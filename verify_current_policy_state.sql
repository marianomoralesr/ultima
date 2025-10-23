-- Verify the EXACT current state of RLS policies
-- Run this in Supabase SQL Editor to see what's actually active

-- 1. Show ALL policies on financing_applications
SELECT
    schemaname,
    tablename,
    policyname,
    cmd::text as command,
    qual::text as using_clause,
    with_check::text as with_check_clause,
    permissive,
    roles::text
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'financing_applications'
ORDER BY cmd, policyname;

-- 2. Show the trigger
SELECT
    tgname,
    tgenabled,
    tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'bi_set_user_id_financing_applications';

-- 3. Show trigger function
SELECT
    proname,
    prosrc
FROM pg_proc
WHERE proname = 'set_user_id_from_auth';

-- ===========================================================================
-- EXPECTED OUTPUT for INSERT policy:
-- ===========================================================================
-- policyname: financing_apps_insert
-- command: INSERT
-- using_clause: null (or blank)
-- with_check_clause: true
-- permissive: PERMISSIVE
-- roles: {authenticated}
--
-- If you see something DIFFERENT, the migration didn't apply correctly!
-- ===========================================================================
