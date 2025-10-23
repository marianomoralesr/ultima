# CRM Dashboard Fix - Registrations Not Showing

## Problem

User registrations (new sign-ups) were not showing up in the CRM Dashboard at `/escritorio/admin/leads`.

## Root Cause

The `get_leads_for_dashboard()` RPC function was missing a critical filter. It was returning **ALL** profiles from the database, including:
- Admin users (role='admin')
- Sales users (role='sales')
- Actual leads/customers (role='user')

This caused two issues:
1. Admin and sales staff were showing up in the "leads" list
2. The actual customer registrations were buried among staff accounts
3. Stats were potentially incorrect

## The Bug

**Location**: `supabase/migrations/20251020121153_remote_schema.sql` line 673-706

```sql
CREATE OR REPLACE FUNCTION "public"."get_leads_for_dashboard"()
...
    SELECT ... FROM public.profiles p
    LEFT JOIN LATERAL ...
    -- MISSING: WHERE p.role = 'user'  ❌
    ORDER BY p.updated_at DESC;
```

The function was missing the `WHERE p.role = 'user'` filter.

## The Fix

### Files Created

1. **`supabase/migrations/20251022000000_fix_leads_dashboard_filter.sql`**
   - Adds `WHERE p.role = 'user'` filter to `get_leads_for_dashboard()`
   - Ensures only actual customers/leads are returned (not staff)

2. **`supabase/migrations/20251022000001_fix_crm_dashboard_stats.sql`**
   - Updates `get_crm_dashboard_stats()` to return correct stat fields
   - Changed field names to match what the dashboard expects:
     - `leads_with_active_app` (was `active_applications`)
     - `leads_with_unfinished_app` (was missing)
     - `leads_needing_follow_up` (was `pending_contact_leads`)

3. **`fix_crm_dashboard.sql`** (Combined fix)
   - Convenience file containing both migrations
   - Can be run directly in Supabase SQL Editor

## How to Apply the Fix

### Option 1: Run the combined SQL file (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `fix_crm_dashboard.sql`
4. Click **Run**

### Option 2: Apply migrations via Supabase CLI

```bash
# Make sure you're in the project directory
cd /Users/marianomorales/Downloads/ultima\ copy

# Apply the migrations
supabase db push
```

## Verification

After applying the fix, verify it worked:

### 1. Check the leads list
- Go to `/escritorio/admin/leads`
- You should now see actual customer registrations
- Admin and sales users should NOT appear in the list

### 2. Verify the stats
The stats cards should show:
- **Total de Leads**: Count of all users with `role='user'`
- **Con Solicitud Activa**: Users with applications in 'submitted', 'reviewing', or 'pending_docs' status
- **Solicitud Incompleta**: Users with draft applications
- **Necesitan Seguimiento**: Users where `contactado = false` or `contactado IS NULL`

### 3. SQL verification (optional)

Run these queries in Supabase SQL Editor:

```sql
-- Should only return users with role='user'
SELECT * FROM get_leads_for_dashboard();

-- Should return correct stat counts
SELECT * FROM get_crm_dashboard_stats();

-- Verify no admin/sales users in results
SELECT role, COUNT(*)
FROM profiles
WHERE id IN (SELECT id FROM get_leads_for_dashboard())
GROUP BY role;
-- Should only show role='user', nothing else
```

## Related Files

- **Frontend**: `src/pages/AdminLeadsDashboardPage.tsx`
- **Service**: `src/services/AdminService.ts` (line 16)
- **Original Schema**: `supabase/migrations/20251020121153_remote_schema.sql`
- **Previous Fix Attempt**: `supabase/migrations/20251020140000_update_leads_dashboard_function.sql` (was overwritten)

## Technical Details

### Function Signature (After Fix)

```sql
CREATE OR REPLACE FUNCTION public.get_leads_for_dashboard()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  contactado boolean,
  asesor_asignado text,          -- Email of assigned advisor
  latest_app_status text,         -- Status of latest application
  latest_app_car_info jsonb,      -- Car info from latest application
  asesor_asignado_id uuid         -- UUID of assigned advisor
)
```

### Key Changes

1. **Added WHERE clause**: `WHERE p.role = 'user'`
2. **Added NULLS LAST**: `ORDER BY p.updated_at DESC NULLS LAST`
3. **Proper authorization check**: Using EXISTS pattern for better security
4. **Added asesor_asignado_id**: For filtering sales-specific leads

## Migration Timeline

- `20251020121153` - Original schema dump (missing filter) ❌
- `20251020140000` - First fix attempt (got overwritten) ⚠️
- `20251022000000` - Final fix (this migration) ✅
- `20251022000001` - Stats function fix ✅

## Impact

After applying this fix:
- ✅ User registrations will appear in the CRM dashboard
- ✅ Admin/sales users will be excluded from the leads list
- ✅ Stats will show accurate counts
- ✅ Sales users can still filter their assigned leads
- ✅ No impact on application submission or other features

## Questions?

If registrations still don't show after applying the fix:

1. Check if users are actually being created with `role='user'`:
   ```sql
   SELECT id, email, role, created_at
   FROM profiles
   ORDER BY created_at DESC
   LIMIT 10;
   ```

2. Verify RLS policies allow admins to see user profiles:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'profiles';
   ```

3. Check browser console for any errors when loading the dashboard
