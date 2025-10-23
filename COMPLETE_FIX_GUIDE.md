# Complete Fix Guide - All Current Issues

This guide fixes **all current issues** in the correct order:

1. ✅ Signup failures (blocking all new users)
2. ✅ CRM Dashboard permission errors
3. ✅ Financing application creation errors
4. ✅ View count permission errors

## Prerequisites

- Access to Supabase SQL Editor: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql

---

## Step 1: Fix Signups (CRITICAL - Do This First!)

**Issue**: All new user registrations fail with 500 error: "column role is of type user_role but expression is of type text"

**File**: `supabase/migrations/20251023000000_fix_signup_role_enum_cast.sql`

**What it does**: Fixes the `handle_new_user()` trigger to properly cast role TEXT to user_role enum

**Run this SQL**:
```sql
-- Copy and paste the contents of:
-- supabase/migrations/20251023000000_fix_signup_role_enum_cast.sql
```

---

## Step 2: Fix CRM Dashboard

**Issue**: "Mis Leads" page shows 400 error when calling `get_leads_for_dashboard()`

**File**: `fix_crm_dashboard.sql`

**What it does**:
- Recreates `get_leads_for_dashboard()` with proper signature
- Adds `WHERE p.role = 'user'` filter (so admin/sales don't show as leads)
- Fixes `get_crm_dashboard_stats()` return fields

**Run this SQL**:
```sql
-- Copy and paste the contents of: fix_crm_dashboard.sql
```

---

## Step 3: Update Your Admin Profile Role

**Issue**: Current user getting "Permission denied to access leads dashboard"

**Why**: Your profile might not have role='admin' set

**Run this SQL**:
```sql
-- Check your current role
SELECT id, email, role FROM profiles WHERE email = 'mariano.morales@autostrefa.mx';

-- If role is not 'admin', update it:
UPDATE profiles
SET role = 'admin'
WHERE email = 'mariano.morales@autostrefa.mx';

-- Verify the update
SELECT id, email, role FROM profiles WHERE email = 'mariano.morales@autostrefa.mx';
```

---

## Step 4: Fix View Count Permissions (Optional)

**Issue**: Vehicle view count incrementing fails with permission error

**File**: `supabase/migrations/20251022100000_fix_increment_views_security.sql`

**What it does**: Adds `SECURITY DEFINER` to `increment_vehicle_views()` function

**Run this SQL**:
```sql
-- Copy and paste the contents of:
-- supabase/migrations/20251022100000_fix_increment_views_security.sql
```

---

## Step 5: Debug Application Creation Error

**Issue**: "No se pudo iniciar una nueva solicitud" when trying to create financing application

**File**: `debug_application_error.sql`

**What to do**:
1. Run the debug script: `debug_application_error.sql`
2. Look at query #2 - do you have a profile?
3. Look at query #5 - uncomment and run it to see the exact error
4. Check browser console for detailed error message

**Common fixes**:

### If you don't have a profile:
```sql
INSERT INTO profiles (id, email, role, first_name, last_name)
SELECT
    id,
    email,
    'admin'::user_role,
    COALESCE(raw_user_meta_data->>'first_name', 'Admin'),
    COALESCE(raw_user_meta_data->>'last_name', 'User')
FROM auth.users
WHERE id = auth.uid()
ON CONFLICT (id) DO NOTHING;
```

### If RLS is blocking:
The policies look correct, but if still blocked, try:
```sql
-- Temporarily disable RLS to test (ONLY FOR DEBUGGING)
ALTER TABLE financing_applications DISABLE ROW LEVEL SECURITY;

-- Try creating application again

-- Re-enable RLS after testing
ALTER TABLE financing_applications ENABLE ROW LEVEL SECURITY;
```

---

## Step 6: Clean Up Invalid Image URLs (Optional)

**File**: `fix_invalid_image_urls.sql`

**What it does**: Removes "[]" and other invalid strings from image URL fields

**Run if needed**:
```sql
-- Copy and paste the contents of: fix_invalid_image_urls.sql
```

---

## Verification Checklist

After applying all fixes, verify:

### ✅ Signups Work
1. Go to auth logs: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/logs/auth
2. Test signup with new user
3. Should see 200 status, no enum errors
4. Profile should be created automatically

### ✅ CRM Dashboard Works
1. Go to `/escritorio` → "Mis Leads"
2. Should see stats cards with numbers
3. Should see table of user leads (not admin/sales)
4. No 400 or permission errors

### ✅ Applications Work
1. Go to `/escritorio/aplicacion`
2. Should be able to start new application
3. No "No se pudo iniciar una nueva solicitud" error

### ✅ View Counts Work
1. Visit a vehicle detail page
2. Check console - no permission errors
3. View count should increment in database

---

## Quick Reference: File Locations

```
supabase/migrations/
  20251023000000_fix_signup_role_enum_cast.sql      # Fix signups
  20251022100000_fix_increment_views_security.sql   # Fix view counts
  20251022000000_fix_leads_dashboard_filter.sql     # Fix leads filter
  20251022000001_fix_crm_dashboard_stats.sql        # Fix stats

Root directory:
  fix_crm_dashboard.sql           # Combined CRM fix
  fix_invalid_image_urls.sql      # Image URL cleanup
  debug_application_error.sql     # Debug financing apps
  debug_user_role.sql             # Debug user role/profile
```

---

## Order of Operations

**CRITICAL**: Apply in this exact order:

1. ✅ **Signup fix** (20251023000000_fix_signup_role_enum_cast.sql)
2. ✅ **CRM dashboard fix** (fix_crm_dashboard.sql)
3. ✅ **Update your profile role** to 'admin'
4. ✅ **Debug application error** (debug_application_error.sql)
5. ⚠️ **View count fix** (optional - 20251022100000_fix_increment_views_security.sql)
6. ⚠️ **Image URL cleanup** (optional - fix_invalid_image_urls.sql)

---

## Need Help?

If issues persist:
1. Check browser console for JavaScript errors
2. Check Supabase logs: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/logs
3. Run debug scripts and share results
4. Verify all migrations were applied successfully
