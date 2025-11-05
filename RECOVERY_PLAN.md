# EMERGENCY RECOVERY PLAN - User Data Missing

## CRITICAL ISSUE
Only admin profiles are showing up in the database. This could be:
1. **Data was actually deleted** (worst case)
2. **RLS is blocking everything** (fixable)
3. **Profiles weren't created but auth.users still exists** (recoverable)

## STEP 1: Verify Data Exists (DO THIS FIRST)

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new
2. Copy contents of `EMERGENCY_CHECK_DATA.sql`
3. Run it - this will bypass RLS and show actual data

### What to look for:
- **TOTAL PROFILES (bypassing RLS)**: Should be > 100 if data exists
- **TOTAL AUTH USERS**: This shows actual user accounts
- **ORPHANED AUTH USERS**: If this is > 0, users exist but profiles were deleted

## STEP 2A: If Data Was Deleted - RESTORE FROM BACKUP

### Supabase Point-in-Time Recovery:

1. **Check your plan**:
   - Go to https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/billing
   - Pro plan has Point-in-Time Recovery (PITR)
   - Free plan has daily backups only

2. **Restore from backup**:
   - Go to https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/database/backups
   - Find backup from BEFORE the migration was run
   - Click "Restore"
   - **WARNING**: This restores ENTIRE database

3. **If no backups available**:
   - Contact Supabase Support IMMEDIATELY: https://supabase.com/dashboard/support/new
   - Request emergency recovery
   - Provide: Project ID `jjepfehmuybpctdzipnu`, time of data loss

## STEP 2B: If Profiles Missing But Auth.Users Exists - RECREATE PROFILES

If `auth.users` has users but `public.profiles` doesn't, we can recreate profiles:

```sql
-- Recreate profiles from auth.users
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
SELECT
    id,
    email,
    'user' as role,  -- Default role
    created_at,
    NOW() as updated_at
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;
```

## STEP 3: Check for CASCADE Deletions

The migration ran `DROP FUNCTION IF EXISTS "public"."get_my_role"() CASCADE;`

The CASCADE keyword can drop dependent objects. Let me check what was dependent:

```sql
-- Check what policies/triggers depend on get_my_role
SELECT
    schemaname,
    tablename,
    policyname,
    pg_get_expr(qual, tablename::regclass) as policy_definition
FROM pg_policies
WHERE pg_get_expr(qual, tablename::regclass) LIKE '%get_my_role%'
   OR pg_get_expr(with_check, tablename::regclass) LIKE '%get_my_role%';
```

**POSSIBLE CAUSE**: If there was an `ON DELETE CASCADE` trigger or policy that depended on `get_my_role()`, dropping it might have triggered deletions.

## STEP 4: Immediate Actions

### DO NOW:
1. Run `EMERGENCY_CHECK_DATA.sql` to see actual data state
2. **DO NOT run any more migrations**
3. **DO NOT make any more database changes**
4. Take a snapshot/backup NOW before doing anything else

### DO NOT:
- ❌ Run `supabase db push` again
- ❌ Run any more DROP commands
- ❌ Try to "fix" anything without knowing the data state
- ❌ Run any UPDATE or DELETE queries

## STEP 5: Recovery Checklist

- [ ] Run EMERGENCY_CHECK_DATA.sql to verify data state
- [ ] Report results (how many profiles? how many auth.users? orphaned users?)
- [ ] If data deleted: Contact Supabase support for PITR
- [ ] If profiles missing but auth exists: Recreate profiles
- [ ] After recovery: Re-run admin access fix scripts
- [ ] Test all functionality thoroughly

## What Likely Happened

Looking at the migration that was run:

```sql
DROP FUNCTION IF EXISTS "public"."get_my_role"() CASCADE;
```

The `CASCADE` keyword drops all dependent objects. If there was a trigger or RLS policy that:
1. Used `get_my_role()`
2. Had `ON DELETE CASCADE` behavior
3. Was linked to profile rows

Then dropping the function could have cascade-deleted profiles.

**However**: This is unusual and shouldn't happen with a function drop unless there was a very specific (and bad) database design.

## Next Steps

**STOP AND RUN EMERGENCY_CHECK_DATA.sql NOW**

Send me the results and I can tell you exactly what happened and how to fix it.
