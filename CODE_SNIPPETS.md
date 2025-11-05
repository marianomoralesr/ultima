# Important Code Snippets Reference

## 1. Admin Email List (For Creating Admin Users)

**File**: `/src/context/AuthContext.tsx` (lines ~120-125)

```typescript
const adminEmails = [
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
];
const role = adminEmails.includes(user.email || '') ? 'admin' : 'user';
```

**To add a new admin**:
1. Add their email to this list
2. Redeploy the app
3. They'll be admin on their next login

---

## 2. Round-Robin Assignment Function

**File**: `/supabase/migrations/20251020121153_remote_schema.sql`

```plpgsql
CREATE OR REPLACE FUNCTION public.assign_advisor(user_id_to_assign uuid)
RETURNS uuid AS $$
DECLARE
    available_advisor_id uuid;
BEGIN
    -- Find the sales advisor with the oldest last_assigned_at timestamp
    SELECT id
    INTO available_advisor_id
    FROM public.profiles
    WHERE role = 'sales'
    ORDER BY last_assigned_at ASC NULLS FIRST
    LIMIT 1;

    -- If an advisor is found, assign them to the user
    IF available_advisor_id IS NOT NULL THEN
        -- Assign the advisor to the user
        UPDATE public.profiles
        SET asesor_asignado_id = available_advisor_id
        WHERE id = user_id_to_assign;

        -- Update the advisor's last_assigned_at timestamp
        UPDATE public.profiles
        SET last_assigned_at = now()
        WHERE id = available_advisor_id;
    END IF;

    -- Return the ID of the assigned advisor
    RETURN available_advisor_id;
END;
$$;
```

**Key points**:
- `WHERE role = 'sales'` - Only looks at sales reps
- `ORDER BY last_assigned_at ASC NULLS FIRST` - Least recently assigned first
- Updates `last_assigned_at` to NOW() when assigning
- Returns the advisor ID

---

## 3. How AuthContext Detects Role

**File**: `/src/context/AuthContext.tsx`

```typescript
// Load profile from database
const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

// ... later ...

// Set derived boolean flags
const isAdmin = profile?.role === 'admin';
const isSales = profile?.role === 'sales';

// Return context
const value = {
    session,
    user,
    profile,
    loading,
    isAdmin,
    isSales,
    signOut,
    reloadProfile
};
```

**How it's used in components**:
```typescript
const { isAdmin, isSales, profile } = useAuth();

if (isAdmin) {
    // Show admin controls
}

if (isSales) {
    // Show sales controls
}
```

---

## 4. Admin Route Guard

**File**: `/src/components/AdminRoute.tsx`

```typescript
const AdminRoute: React.FC = () => {
    const { isAdmin, isSales, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isAdmin && !isSales) {
        return <Navigate to="/escritorio" state={{ from: location }} replace />;
    }

    return <Outlet />;
};
```

**Behavior**: Allows BOTH admin and sales users (sales can see admin routes)

---

## 5. Sales Route Guard

**File**: `/src/components/SalesRoute.tsx`

```typescript
const SalesRoute: React.FC = () => {
    const { isAdmin, isSales, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isSales && !isAdmin) {
        return <Navigate to="/escritorio" state={{ from: location }} replace />;
    }

    return <Outlet />;
};
```

**Behavior**: Only allows sales and admin users

---

## 6. Getting All Leads (Admin)

**File**: `/src/services/AdminService.ts`

```typescript
async getAllLeads(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_leads_for_dashboard');

    if (error) {
        console.error("Error fetching all leads:", error);
        throw new Error("Could not fetch leads. Ensure you have the required permissions.");
    }
    return data || [];
}
```

**RPC Function** calls:
```plpgsql
-- File: /supabase/migrations/20251104000007_fix_sales_access_complete.sql
CREATE OR REPLACE FUNCTION public.get_leads_for_dashboard()
RETURNS TABLE(...)
AS $$
    -- Check if admin or sales role
    SELECT p.role INTO user_role
    FROM public.profiles p
    WHERE p.id = auth.uid();

    IF user_role IS NULL OR user_role NOT IN ('admin', 'sales') THEN
        RAISE EXCEPTION 'Permission denied. Admin or sales role required.';
    END IF;

    RETURN QUERY
    SELECT * FROM public.profiles p
    WHERE p.role = 'user'  -- Only actual customers
    ORDER BY p.last_sign_in_at DESC NULLS LAST;
END;
$$;
```

---

## 7. Getting Assigned Leads (Sales Rep)

**File**: `/src/services/SalesService.ts`

```typescript
async getMyAssignedLeads(salesUserId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_sales_assigned_leads', {
        sales_user_id: salesUserId
    });

    if (error) {
        console.error("Error fetching assigned leads:", error);
        throw new Error("No se pudieron cargar los leads asignados.");
    }
    return data || [];
}
```

**RPC Function** calls:
```plpgsql
-- File: /supabase/migrations/sales_dashboard_functions.sql
CREATE OR REPLACE FUNCTION get_sales_assigned_leads(sales_user_id UUID)
RETURNS TABLE (...)
AS $$
    RETURN QUERY
    SELECT p.*, asesor.first_name || ' ' || asesor.last_name as asesor_asignado
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'  -- Only actual customers
    ORDER BY p.created_at DESC;
END;
$$;
```

---

## 8. Getting Client Profile (with all data)

**File**: `/src/services/AdminService.ts`

```typescript
async getClientProfile(userId: string): Promise<{...}> {
    const { data, error } = await supabase.rpc(
        'get_secure_client_profile',
        { client_id: userId }
    );

    if (error) {
        throw new Error("Could not fetch client profile.");
    }

    if (!data || !data.profile) {
        return null; // Access denied or client not found
    }

    return {
        profile: data.profile,
        applications: data.applications || [],
        tags: data.tags || [],
        reminders: data.reminders || [],
        documents: data.documents || [],
    };
}
```

**Sales version** - Same but with access check:
```typescript
async getClientProfile(
    clientId: string,
    salesUserId: string
): Promise<{...}> {
    const { data, error } = await supabase.rpc('get_sales_client_profile', {
        client_id: clientId,
        sales_user_id: salesUserId
    });

    // ... same error handling ...
}
```

---

## 9. Dashboard Stats (Admin)

**File**: `/src/services/AdminService.ts`

```typescript
async getDashboardStats(): Promise<any> {
    const { data, error } = await supabase.rpc('get_crm_dashboard_stats');

    if (error) {
        throw new Error("Could not fetch dashboard stats.");
    }
    return data[0] || {};
}
```

**Returns**:
```javascript
{
    total_leads: 150,
    leads_with_active_app: 45,
    leads_with_unfinished_app: 30,
    leads_needing_follow_up: 50
}
```

---

## 10. Dashboard Stats (Sales Rep)

**File**: `/src/services/SalesService.ts`

```typescript
async getMyLeadsStats(salesUserId: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_sales_dashboard_stats', {
        sales_user_id: salesUserId
    });

    if (error) {
        throw new Error("No se pudieron cargar las estadísticas.");
    }
    return data?.[0] || {};
}
```

---

## 11. Tag Management (Admin & Sales)

**File**: `/src/services/AdminService.ts` & `/src/services/SalesService.ts`

```typescript
async updateLeadTags(userId: string, tagIds: string[]): Promise<void> {
    // Delete existing tags
    const { error: deleteError } = await supabase
        .from('lead_tag_associations')
        .delete()
        .eq('lead_id', userId);

    if (deleteError) throw deleteError;

    // Insert new tags
    if (tagIds.length > 0) {
        const associations = tagIds.map(tagId => ({
            lead_id: userId,
            tag_id: tagId
        }));
        const { error: insertError } = await supabase
            .from('lead_tag_associations')
            .insert(associations);
        if (insertError) throw insertError;
    }
}
```

**Sales version** - Includes access check:
```typescript
async updateLeadTags(userId: string, tagIds: string[], salesUserId: string): Promise<void> {
    // Verify access first
    const { data: hasAccess } = await supabase.rpc('verify_sales_access_to_lead', {
        lead_id: userId,
        sales_user_id: salesUserId
    });

    if (!hasAccess) {
        throw new Error("No tienes autorización para modificar este lead.");
    }

    // ... then same as admin ...
}
```

---

## 12. Reminder Management

**File**: `/src/services/AdminService.ts`

```typescript
async createReminder(reminder: {
    lead_id: string;
    agent_id: string;
    reminder_text: string;
    reminder_date: string;
}): Promise<void> {
    const { error } = await supabase.from('lead_reminders').insert(reminder);
    if (error) throw error;
}

async updateReminder(
    reminderId: string,
    updates: {
        reminder_text?: string;
        reminder_date?: string;
        is_completed?: boolean;
    }
): Promise<void> {
    const { error } = await supabase
        .from('lead_reminders')
        .update(updates)
        .eq('id', reminderId);
    if (error) throw error;
}

async deleteReminder(reminderId: string): Promise<void> {
    const { error } = await supabase
        .from('lead_reminders')
        .delete()
        .eq('id', reminderId);
    if (error) throw error;
}
```

---

## 13. Profile Type Definition

**File**: `/src/types/types.ts`

```typescript
export interface Profile {
    id: string;
    updated_at?: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    role: 'user' | 'admin' | 'sales';  // Key field!
    asesor_asignado_id?: string;       // Who's assigned to this user
    contactado?: boolean;               // Has this lead been contacted?
    source?: string;                    // Where they came from
    metadata?: any;                     // Extra tracking data
    [key: string]: any;                 // Other fields allowed
}
```

---

## 14. Database Query - Check Round-Robin Status

**Run in Supabase SQL Editor**:

```sql
-- See how many leads each sales rep has
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    COUNT(leads.id) as assigned_leads,
    p.last_assigned_at,
    CASE 
        WHEN p.last_assigned_at IS NULL THEN 'Never assigned'
        ELSE TO_CHAR(p.last_assigned_at, 'YYYY-MM-DD HH:MI:SS')
    END as last_assignment_time
FROM profiles p
LEFT JOIN profiles leads ON leads.asesor_asignado_id = p.id AND leads.role = 'user'
WHERE p.role = 'sales'
GROUP BY p.id
ORDER BY p.last_assigned_at ASC NULLS FIRST;
```

---

## 15. Manual Lead Reassignment

**Run in Supabase SQL Editor**:

```sql
-- Reassign a specific lead to a different sales rep
UPDATE profiles 
SET asesor_asignado_id = '<new_sales_rep_id>'
WHERE id = '<lead_id>';

-- Verify the change
SELECT email, asesor_asignado_id FROM profiles WHERE id = '<lead_id>';
```

---

## 16. Routing Structure in App.tsx

**File**: `/src/App.tsx`

```typescript
<Routes>
    {/* Public routes - no login needed */}
    <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="autos" element={<VehicleListPage />} />
        {/* ... more public routes ... */}
    </Route>

    {/* Protected routes - login required */}
    <Route path="/escritorio" element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
            {/* Regular user routes */}
            <Route index element={<DashboardPage />} />
            
            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
                <Route path="admin/leads" element={<AdminLeadsDashboardPage />} />
                <Route path="admin/cliente/:id" element={<AdminClientProfilePage />} />
                {/* ... more admin routes ... */}
            </Route>

            {/* Sales routes (sales + admin) */}
            <Route element={<SalesRoute />}>
                <Route path="ventas/leads" element={<SalesLeadsDashboardPage />} />
                <Route path="ventas/cliente/:id" element={<SalesClientProfilePage />} />
            </Route>
        </Route>
    </Route>

    {/* Auth routes - public */}
    <Route path="/acceder" element={<AuthPage />} />
</Routes>
```

