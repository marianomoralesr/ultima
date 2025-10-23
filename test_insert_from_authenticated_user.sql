-- Test INSERT into financing_applications from an authenticated session
-- Run this from the Supabase SQL Editor while logged into the Dashboard
-- (This simulates what the browser should be doing)

-- 1. First, verify RLS is enabled
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'financing_applications';

-- 2. Check the INSERT policy
SELECT
    policyname,
    cmd::text as command,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'financing_applications'
AND cmd = 'INSERT';

-- 3. Check if trigger exists
SELECT
    tgname as trigger_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'bi_set_user_id_financing_applications';

-- 4. Check trigger function
SELECT prosrc as function_code
FROM pg_proc
WHERE proname = 'set_user_id_from_auth';

-- ============================================================================
-- IMPORTANT: The queries above are diagnostic.
-- The SQL Editor cannot test the actual INSERT because it runs in a
-- service_role context, not an authenticated user context.
--
-- The browser SHOULD be able to INSERT because:
-- 1. RLS policy allows: WITH CHECK (true) ✓
-- 2. Trigger sets user_id from auth.uid() ✓
-- 3. Supabase client sends auth token automatically ✓
--
-- If browser still fails, the issue is likely:
-- - Browser cache (old JavaScript code)
-- - Auth token expired/missing
-- - CORS or network issue preventing auth header
-- ============================================================================
