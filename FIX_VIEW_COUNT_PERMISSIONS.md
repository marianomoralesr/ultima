# Fix View Count Permissions Issue

## Problem
The `increment_vehicle_views` RPC function is returning a **401 permission error** because it's missing the `SECURITY DEFINER` clause. This causes the function to run with the permissions of the anonymous user, who doesn't have UPDATE access to `inventario_cache`.

## Error Message
```
[VehicleService] Error incrementing view count for vehicle 77412:
Object { code: "42501", details: null, hint: null, message: "permission denied for table inventario_cache" }
```

## Solution
Apply the migration `supabase/migrations/20251022100000_fix_increment_views_security.sql`

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql
2. Open the SQL Editor
3. Copy and paste the content of `supabase/migrations/20251022100000_fix_increment_views_security.sql`
4. Run the query

### Option 2: Using Supabase CLI
```bash
# From the project root
cd /Users/marianomorales/Downloads/ultima\ copy

# Push only the new migration
# Note: This might fail if other migrations have conflicts, in which case use Option 1
supabase db push
```

## What the Fix Does
- Adds `SECURITY DEFINER` to the function, making it run with postgres user permissions
- Adds `SET search_path = public` for security best practices
- Ensures proper EXECUTE grants for anon, authenticated, and service_role users

## Expected Result
After applying the fix, vehicle view counts will increment successfully without permission errors.
