# Application Creation & Advisor Assignment Fix Summary

## Problems Identified

### 1. RLS Policy Violation when Creating Applications
**Issue**: Users encounter an RLS (Row Level Security) policy violation when trying to create a new application.

**Root Cause**:
- The `set_user_id_from_auth()` trigger function references `NEW.uid`
- But the `financing_applications` table uses `user_id` column (not `uid`)
- This mismatch causes the trigger to fail, leaving `user_id` NULL
- The RLS policy then rejects the insert because `user_id` doesn't match `auth.uid()`

### 2. Missing Advisor Assignment on Signup
**Issue**: New users don't see an assigned sales advisor on their dashboard.

**Root Cause**:
- The `handle_new_user()` function creates user profiles but doesn't call `assign_advisor()`
- The dashboard `MiAsesor` component only displays if `profile.asesor_asignado_id` exists
- Without automatic assignment, users never get an advisor

## Solution Created

### Migration File: `20251023200000_fix_application_insert_and_advisor_assignment.sql`

This migration fixes both issues:

1. **Updates `set_user_id_from_auth()` function**
   - Changes `NEW.uid` to `NEW.user_id`
   - Matches the actual column name in all tables

2. **Updates `handle_new_user()` function**
   - Adds automatic advisor assignment via `assign_advisor()` function
   - Only assigns to regular users (not admins/sales)
   - Uses existing round-robin logic

3. **Assigns advisors to existing users**
   - Loops through users without advisors
   - Assigns them using the round-robin system

## How to Apply the Fix

### For Staging Environment

```bash
# Method 1: Using Supabase CLI
cd /Users/marianomorales/Downloads/ultima copy
supabase db push --db-url "postgresql://postgres:[PASSWORD]@[STAGING_HOST]:5432/postgres"

# Method 2: Direct SQL execution
psql "postgresql://postgres:[PASSWORD]@[STAGING_HOST]:5432/postgres" -f supabase/migrations/20251023200000_fix_application_insert_and_advisor_assignment.sql
```

### For Production Environment

```bash
# Method 1: Using Supabase CLI
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.jjepfehmuybpctdzipnu.supabase.co:5432/postgres"

# Method 2: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new
2. Copy the contents of supabase/migrations/20251023200000_fix_application_insert_and_advisor_assignment.sql
3. Execute the SQL
```

## Verification Steps

After applying the migration, run the verification script:

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f verify_fixes.sql
```

This will check:
1. ✅ Trigger function uses correct column name (`user_id` not `uid`)
2. ✅ Trigger exists and is enabled on `financing_applications`
3. ✅ `handle_new_user()` includes advisor assignment logic
4. ✅ All existing users have assigned advisors
5. ✅ Advisor assignment distribution is balanced

## Expected Results

After the fix:

1. **Application Creation**
   - Users can create draft applications without RLS errors
   - The trigger automatically sets `user_id` from `auth.uid()`
   - RLS policy validation passes

2. **Advisor Assignment**
   - New signups automatically get an advisor assigned
   - Existing users without advisors get one assigned
   - Dashboard shows "Mi Asesor" component with advisor info
   - Round-robin distribution balances load across sales agents

## Files Created

- `supabase/migrations/20251023200000_fix_application_insert_and_advisor_assignment.sql` - The fix migration
- `verify_fixes.sql` - Verification script to confirm fixes work
- `FIX_SUMMARY.md` - This document

## Testing Checklist

- [ ] Apply migration to staging database
- [ ] Run verification script on staging
- [ ] Test creating a new application as a user
- [ ] Test new user signup and verify advisor assignment
- [ ] Check existing users now have advisors
- [ ] Verify dashboard shows "Mi Asesor" component
- [ ] Apply migration to production database
- [ ] Run verification script on production
- [ ] Monitor for any errors in production

## Rollback Plan

If issues occur, you can rollback by:

1. Restoring the previous versions of the functions:
```sql
-- See supabase/migrations/20251020121153_remote_schema.sql lines 1432-1442 for set_user_id_from_auth
-- See supabase/migrations/20251023000000_fix_signup_role_enum_cast.sql for handle_new_user
```

2. Manually removing advisor assignments if needed:
```sql
UPDATE profiles
SET asesor_asignado_id = NULL
WHERE role = 'user' AND created_at > '[MIGRATION_TIMESTAMP]';
```
