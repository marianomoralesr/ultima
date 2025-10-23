# Fix Signup Failure - Role Enum Type Error

## Problem

New user registrations are completely failing with a **500 Database error** in auth logs:

```
ERROR: column "role" is of type user_role but expression is of type text
```

This prevents ALL new signups from working, which is why no new leads appear in the CRM dashboard.

## Root Cause

The `handle_new_user()` trigger function (which creates profiles on signup) has a type mismatch:

**File**: `supabase/migrations/20251020121153_remote_schema.sql` line 1152

```sql
DECLARE
    user_role TEXT := 'user';  -- Variable is TEXT
BEGIN
    INSERT INTO public.profiles (
        role,
        ...
    )
    VALUES (
        user_role,  -- ❌ Inserting TEXT into user_role enum column
        ...
    )
```

The `profiles.role` column is of type `user_role` enum (with values: 'user', 'admin', 'sales'), but the function tries to insert a TEXT value without casting.

## The Fix

**File**: `supabase/migrations/20251023000000_fix_signup_role_enum_cast.sql`

Cast the TEXT variable to the enum type:

```sql
VALUES (
    user_role::user_role,  -- ✅ Cast TEXT to user_role enum
    ...
)
```

## How to Apply

### Option 1: Supabase SQL Editor (Fastest)

1. Go to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql
2. Copy the contents of `supabase/migrations/20251023000000_fix_signup_role_enum_cast.sql`
3. Paste and click **Run**

### Option 2: Supabase CLI

```bash
cd /Users/marianomorales/Downloads/ultima\ copy
supabase db push
```

## Verification

After applying the fix, test signup:

1. **Open Auth Logs**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/logs/auth
2. **Sign up a new test user** on your site
3. **Check logs** - you should see:
   - ✅ `signup` event with status 200
   - ✅ No more "column role is of type user_role but expression is of type text" errors

4. **Verify profile created**:
   ```sql
   SELECT id, email, role, created_at
   FROM profiles
   ORDER BY created_at DESC
   LIMIT 5;
   ```

5. **Check CRM Dashboard**: New registrations should now appear in "Mis Leads"

## Expected Behavior After Fix

- ✅ New users can sign up successfully
- ✅ Profiles are automatically created with `role='user'`
- ✅ Admin emails get `role='admin'` automatically
- ✅ New leads appear in the CRM dashboard
- ✅ No more 500 errors in auth logs

## Impact

This is a **critical fix** - without it:
- ❌ Zero new user signups work
- ❌ No new leads can register
- ❌ Entire user acquisition is blocked
- ❌ CRM dashboard shows no new data

After fix:
- ✅ Signups work normally
- ✅ Leads appear in CRM
- ✅ Sales team can see new registrations
