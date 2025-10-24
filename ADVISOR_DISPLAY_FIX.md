# Advisor Display Fix

## Problem
When logging into the dashboard, users see the error: **"No se pudo cargar la información del asesor"** even though they have an advisor assigned in the `asesor_asignado_id` field.

## Root Cause
The issue is with Supabase Row Level Security (RLS) policies on the `profiles` table. The current policy only allows users to view their own profile:

```sql
CREATE POLICY "Users can view their own profile" ON "public"."profiles"
FOR SELECT USING (auth.uid() = id);
```

When the dashboard tries to load the advisor's profile information using `ProfileService.getProfile(asesorId)`, the query fails because:
- The logged-in user's `auth.uid()` is their own user ID
- They're trying to fetch their advisor's profile (different ID)
- The RLS policy blocks this query because `auth.uid() ≠ advisor.id`

## Location in Code
The error occurs in **DashboardPage.tsx:177**:
```typescript
const MiAsesor: React.FC<{ asesorId: string }> = ({ asesorId }) => {
    const fetchAsesor = async () => {
        const asesorProfile = await ProfileService.getProfile(asesorId);
        if (asesorProfile) {
            setAsesor(asesorProfile);
        } else {
            setError('No se pudo cargar la información del asesor'); // ← Error shown here
        }
    };
};
```

## Solution
Add a new RLS policy with a SECURITY DEFINER function to avoid infinite recursion.

### Quick Fix (Apply Now)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Paste the contents of `apply_advisor_fix_v2.sql`
5. Click "Run"

### What the Fix Does

The fix creates a SECURITY DEFINER function that bypasses RLS to fetch the current user's advisor ID:

```sql
CREATE OR REPLACE FUNCTION public.get_my_advisor_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT asesor_asignado_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;
```

Then uses this function in the RLS policy:

```sql
CREATE POLICY "Users can view assigned advisor profile" ON public.profiles
  FOR SELECT
  USING (id = public.get_my_advisor_id());
```

This approach:
- ✅ Allows users to view their advisor's profile
- ✅ Avoids infinite recursion by using SECURITY DEFINER
- ✅ Maintains security - users can only see their OWN advisor's profile
- ✅ Does not affect other RLS policies

### Why SECURITY DEFINER?
The `SECURITY DEFINER` keyword makes the function execute with the permissions of the user who created it (the database owner), bypassing RLS. This breaks the infinite recursion that would occur if the policy queried the same table it's protecting.

## Files Created
1. `supabase/migrations/20251023000000_allow_users_view_assigned_advisor.sql` - Migration file for version control
2. `apply_advisor_fix_v2.sql` - **USE THIS** - Fixed version that avoids infinite recursion
3. `apply_advisor_fix.sql` - ~~DO NOT USE~~ - Old version that causes infinite recursion

## Testing After Fix
1. Apply the SQL fix in Supabase dashboard
2. Refresh your dashboard page
3. You should now see your advisor's information instead of the error message
4. The "Mi Asesor" card should display:
   - Advisor's name
   - Profile picture (if available)
   - Phone number
   - "Contactar Asesor" WhatsApp button

## Next Steps
After confirming the fix works, you can proceed with deploying the image optimization changes to staging and production.
