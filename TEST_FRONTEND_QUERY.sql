-- ============================================================================
-- TEST: Simulate the exact frontend query
-- Run this while logged in as your admin account
-- ============================================================================

-- This is the EXACT query that SimpleCRMPage.tsx line 97-101 runs
SELECT
    'Frontend Query Test' as test,
    user_id,
    status,
    car_info,
    created_at
FROM public.financing_applications
WHERE status IN ('submitted', 'reviewing', 'pending_docs', 'draft')
ORDER BY created_at DESC
LIMIT 10;

-- Count how many it returns
SELECT
    'Count of applications' as test,
    COUNT(*) as count
FROM public.financing_applications
WHERE status IN ('submitted', 'reviewing', 'pending_docs', 'draft');

-- Check if RLS policy exists and is correct
SELECT
    'RLS Policy Check' as test,
    policyname,
    cmd,
    qual::text as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'financing_applications'
  AND cmd = 'SELECT';

-- Check your current role and email
SELECT
    'Your Session Info' as test,
    auth.uid() as your_user_id,
    auth.jwt()->>'email' as your_email,
    get_my_role() as your_role;
