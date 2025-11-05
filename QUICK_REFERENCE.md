# Quick Reference Guide - Key Files & Components

## Most Important Files for Understanding the System

### Authentication & Authorization
1. **AuthContext** - `/src/context/AuthContext.tsx`
   - Manages user login state
   - Detects role (admin/sales/user)
   - Controls profile loading

2. **Route Guards** - `/src/components/AdminRoute.tsx` & `/src/components/SalesRoute.tsx`
   - Protects routes based on role
   - AdminRoute: admin only
   - SalesRoute: sales + admin

### Database & Backend Logic
3. **Profile Table Schema** - `/supabase/migrations/20251020121153_remote_schema.sql`
   - `id` - user UUID
   - `role` - 'user' | 'admin' | 'sales'
   - `asesor_asignado_id` - assigned sales rep (for users)
   - `last_assigned_at` - for round-robin tracking

4. **Round-Robin Function** - `/supabase/migrations/20251020121153_remote_schema.sql`
   - Function: `assign_advisor(user_id_to_assign)`
   - Finds sales rep with oldest `last_assigned_at`
   - Assigns new user to them
   - Updates their `last_assigned_at`

5. **Sales Functions** - `/supabase/migrations/sales_dashboard_functions.sql`
   - `get_sales_assigned_leads(sales_user_id)` - All leads for this sales rep
   - `get_sales_dashboard_stats(sales_user_id)` - Stats for their leads
   - `get_sales_client_profile(client_id, sales_user_id)` - Full profile if authorized

### Services (API Calls)
6. **AdminService** - `/src/services/AdminService.ts`
   - `getAllLeads()` - Get all leads
   - `getClientProfile(userId)` - Get full profile + apps + tags + reminders
   - Lead/reminder/tag management

7. **SalesService** - `/src/services/SalesService.ts`
   - `getMyAssignedLeads(salesUserId)` - Only assigned leads
   - `getMyLeadsStats(salesUserId)` - Only their stats
   - Same management methods as Admin but with access checks

### Frontend Pages
8. **Admin Leads Dashboard** - `/src/pages/AdminLeadsDashboardPage.tsx`
   - Shows all leads
   - Can search/filter
   - Click to view full profile

9. **Admin Client Profile** - `/src/pages/AdminClientProfilePage.tsx`
   - Full client details
   - Applications, documents, reminders, tags
   - Can edit everything

10. **Sales Leads Dashboard** - `/src/pages/SalesLeadsDashboardPage.tsx`
    - Shows only assigned leads
    - Same UI as admin dashboard
    - Auto-filters by `asesor_asignado_id`

11. **Sales Client Profile** - `/src/pages/SalesClientProfilePage.tsx`
    - Same as admin but restricted to assigned leads
    - Includes authorization check

---

## Role Assignment Flow

```
User signs up → Supabase Auth
                      ↓
              handle_new_user trigger
                      ↓
            Create profiles record
                      ↓
     Is email in admin list?
      /                      \
    YES                      NO
    ↓                         ↓
  role='admin'          role='user'
                              ↓
                      assign_advisor()
                              ↓
                    Find sales rep with
                    oldest last_assigned_at
                              ↓
                      Set asesor_asignado_id
                      Update last_assigned_at
```

---

## Round-Robin Algorithm

```sql
SELECT id
FROM profiles
WHERE role = 'sales'
ORDER BY last_assigned_at ASC NULLS FIRST
LIMIT 1;
```

1. Looks at ALL sales reps (role = 'sales')
2. Sorts by `last_assigned_at` in ascending order
3. NULLS FIRST = new sales reps (no assignments yet) get priority
4. Takes first one (least recently assigned)
5. Updates their `last_assigned_at = NOW()`

**Result**: Perfect round-robin distribution

---

## Sales Rep Access Control

### What a Sales Rep Can See
- Their own assigned leads only
- Leads where: `p.asesor_asignado_id = their_id AND p.role = 'user'`

### What a Sales Rep Can Do
- View lead profile (with access check)
- Add/edit tags on assigned leads
- Create/edit reminders for assigned leads
- View documents (with authorization check)

### RLS Policies
Located in:
- `/supabase/migrations/20251104000001_fix_sales_documents_access.sql`
- `/supabase/migrations/20251104000007_fix_sales_access_complete.sql`

---

## Testing Scenarios

### Create Admin User
1. Add email to admin list in `/src/context/AuthContext.tsx` (lines ~120-125)
2. User signs up with that email
3. Trigger sets role='admin'

### Create Sales User
Database only (no UI yet):
```sql
UPDATE profiles 
SET role = 'sales', last_assigned_at = NOW()
WHERE id = '<user-uuid>';
```

### Test Round-Robin
```sql
SELECT 
  p.email,
  COUNT(leads.id) as assigned_count,
  p.last_assigned_at
FROM profiles p
LEFT JOIN profiles leads ON leads.asesor_asignado_id = p.id
WHERE p.role = 'sales'
GROUP BY p.id
ORDER BY p.last_assigned_at ASC;
```

---

## Database Tables Summary

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| auth.users | Auth | id, email |
| profiles | Users & leads | id, role, asesor_asignado_id, contactado |
| financing_applications | Loan apps | user_id, status |
| uploaded_documents | Docs | user_id, status |
| lead_tags | Tag definitions | tag_name, color |
| lead_tag_associations | Tag-lead links | lead_id, tag_id |
| lead_reminders | Follow-ups | lead_id, reminder_text, reminder_date |

---

## RPC Functions (Important!)

### Admin Can Call
- `get_leads_for_dashboard()` - All leads with full fields
- `get_secure_client_profile(client_id)` - Full profile
- `get_crm_dashboard_stats()` - Global stats

### Sales Can Call
- `get_sales_assigned_leads(sales_user_id)` - Only their leads
- `get_sales_dashboard_stats(sales_user_id)` - Only their stats
- `get_sales_client_profile(client_id, sales_user_id)` - With access check
- `verify_sales_access_to_lead(lead_id, sales_user_id)` - Boolean check

---

## Common Questions

**Q: How do I add a new admin?**
A: Update admin email list in `/src/context/AuthContext.tsx` and redeploy

**Q: How do I reassign a lead to a different sales rep?**
A: No UI yet - manually update:
```sql
UPDATE profiles 
SET asesor_asignado_id = '<new_sales_rep_id>'
WHERE id = '<lead_id>';
```

**Q: What if there are no sales reps?**
A: `assign_advisor()` returns NULL and lead stays unassigned

**Q: Can a sales rep see other sales reps' leads?**
A: No - RLS policies enforce `asesor_asignado_id = auth.uid()`

**Q: How is a new sales rep detected?**
A: When they have NULL `last_assigned_at`, they get priority in round-robin

**Q: What's autorizar_asesor_acceso for?**
A: Exists in schema but implementation is incomplete - meant for access control

