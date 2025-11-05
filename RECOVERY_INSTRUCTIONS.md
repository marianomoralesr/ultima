# User Data Recovery Instructions

## What Happened?

The migration `20251024000000_fix_get_my_role_function.sql` only modified a database function. It **should not** have deleted any user data. However, if data appears missing, follow these steps.

## Step 1: Verify Data Still Exists

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new
2. Copy and paste the contents of `check_user_data.sql`
3. Run the query
4. This will show you:
   - Total number of profiles
   - Profiles grouped by role
   - Recent 50 profiles
   - Total financing applications
   - Status of all admin users

**If the data shows up**, the issue is RLS (Row Level Security) blocking access, not deleted data.

## Step 2: If Data Actually Missing - Point-in-Time Recovery

Supabase automatically backs up your database. If data was actually deleted:

### Using Supabase Dashboard (Recommended):

1. Go to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/database/backups
2. Look for the most recent backup BEFORE you ran the migration
3. Click "Restore" on that backup
4. **WARNING**: This will restore the ENTIRE database to that point in time
   - Any changes made AFTER that backup will be lost
   - Make sure to note what time you ran the migration

### Using Supabase CLI:

```bash
# List available backups
supabase db dump --remote > backup_current.sql

# Restore from a specific point in time (if available on your plan)
# Contact Supabase support for point-in-time recovery options
```

## Step 3: Alternative - Manual Data Import

If you have a recent backup or export of user data:

1. Prepare your backup SQL file
2. Go to SQL Editor
3. Disable RLS temporarily:
   ```sql
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   ```
4. Import your data
5. Re-enable RLS:
   ```sql
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ```

## Step 4: Fix the Root Cause

After recovery, run the `fix_admin_rls_complete.sql` script to fix the admin access issues properly.

## What Actually Happened with the Migration?

The migration you ran (`20251024000000_fix_get_my_role_function.sql`) only did this:

1. Dropped the `get_my_role()` function (just the function, not data)
2. Recreated the `get_my_role()` function with updated logic

**It did NOT:**
- Delete any rows from profiles table
- Delete any rows from financing_applications table
- Modify any user data

## Most Likely Scenario:

The data is still there, but RLS policies are preventing you from seeing it. Run `check_user_data.sql` first to verify.

## Need Help?

If data is truly deleted and you need assistance:
1. Contact Supabase Support: https://supabase.com/dashboard/support/new
2. Provide them with:
   - Project ID: jjepfehmuybpctdzipnu
   - Time when migration was run
   - Request point-in-time recovery to before that time
