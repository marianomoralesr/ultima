-- ============================================================================
-- DEBUG: Check if financing applications are visible (FIXED)
-- This will help us understand why the CRM page shows 0 applications
-- ============================================================================

-- Test 1: How many applications exist in total (bypassing RLS)?
SET ROLE postgres;

SELECT
    'TEST 1: Total applications in DB (bypassing RLS)' as test,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'reviewing', 'pending_docs')) as active_count,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_count
FROM public.financing_applications;

RESET ROLE;

-- Test 2: How many applications can YOU see with your current session?
SELECT
    'TEST 2: Applications visible to you (with RLS)' as test,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'reviewing', 'pending_docs')) as active_count,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_count
FROM public.financing_applications;

-- Test 3: Sample applications with user info
SELECT
    'TEST 3: Sample applications' as test,
    fa.id,
    fa.status,
    fa.created_at,
    p.email as user_email,
    fa.car_info->>'_vehicleTitle' as car_title
FROM public.financing_applications fa
LEFT JOIN public.profiles p ON p.id = fa.user_id
ORDER BY fa.created_at DESC
LIMIT 10;

-- Test 4: Check the RLS policy on financing_applications
SELECT
    'TEST 4: Current RLS policies on financing_applications' as test,
    policyname,
    cmd as policy_type,
    qual::text as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'financing_applications'
ORDER BY policyname;

-- Test 5: Check your email and role
SELECT
    'TEST 5: Your account' as test,
    auth.jwt()->>'email' as jwt_email,
    email as profile_email,
    role as profile_role,
    get_my_role() as role_via_function,
    CASE
        WHEN auth.jwt()->>'email' IN (
            'marianomorales@outlook.com',
            'mariano.morales@autostrefa.mx',
            'genauservices@gmail.com',
            'alejandro.trevino@autostrefa.mx',
            'evelia.castillo@autostrefa.mx',
            'fernando.trevino@autostrefa.mx'
        ) THEN '✅ Email is in admin list'
        ELSE '❌ Email NOT in admin list'
    END as email_check
FROM public.profiles
WHERE id = auth.uid();

-- Test 6: Test the exact query that SimpleCRMPage uses
SELECT
    'TEST 6: SimpleCRMPage query simulation' as test,
    user_id,
    status,
    car_info->>'_vehicleTitle' as car_title,
    created_at
FROM public.financing_applications
WHERE status IN ('submitted', 'reviewing', 'pending_docs', 'draft')
ORDER BY created_at DESC
LIMIT 5;

-- Test 7: Count for query simulation
SELECT
    'TEST 7: Count from SimpleCRMPage query' as test,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ Query returns data'
        ELSE '❌ Query returns nothing - RLS is blocking'
    END as result
FROM public.financing_applications
WHERE status IN ('submitted', 'reviewing', 'pending_docs', 'draft');

-- Summary
SELECT '========================================================' as info
UNION ALL SELECT 'Compare TEST 1 (total in DB) with TEST 2 (visible to you)'
UNION ALL SELECT 'If TEST 1 > 0 but TEST 2 = 0, RLS is still blocking'
UNION ALL SELECT 'If both are > 0, RLS is working correctly'
UNION ALL SELECT '========================================================';
