-- ============================================================================
-- TEST SCRIPT - Run this AFTER applying FINAL_FIX_RLS_UNBLOCK.sql
-- This verifies that all admins can see all data
-- ============================================================================

-- Test 1: Check how many profiles you can see
SELECT
    'TEST 1: Profiles visible to you' as test_name,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 100 THEN '✅ PASS - You can see all profiles'
        WHEN COUNT(*) = 1 THEN '❌ FAIL - You can only see your own profile (RLS still blocking)'
        ELSE '⚠️ PARTIAL - You can see some profiles but maybe not all'
    END as result
FROM public.profiles;

-- Test 2: Check your role
SELECT
    'TEST 2: Your role' as test_name,
    email,
    role,
    CASE
        WHEN role IN ('admin', 'sales') THEN '✅ PASS - You have admin/sales role'
        ELSE '❌ FAIL - Your role is not admin/sales'
    END as result
FROM public.profiles
WHERE id = auth.uid();

-- Test 3: Check all admin users exist with correct roles
SELECT
    'TEST 3: Admin users' as test_name,
    email,
    role,
    CASE
        WHEN role = 'admin' THEN '✅ Has admin role'
        ELSE '❌ Missing admin role'
    END as status
FROM public.profiles
WHERE email IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
)
ORDER BY email;

-- Test 4: Check if get_my_role() works
SELECT
    'TEST 4: get_my_role() function' as test_name,
    get_my_role() as your_role,
    CASE
        WHEN get_my_role() IN ('admin', 'sales') THEN '✅ PASS - Function returns admin/sales'
        ELSE '❌ FAIL - Function does not return admin/sales'
    END as result;

-- Test 5: Count financing applications visible
SELECT
    'TEST 5: Financing applications visible' as test_name,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ PASS - You can see financing applications'
        ELSE '⚠️ No financing applications (might be normal if none exist)'
    END as result
FROM public.financing_applications;

-- Test 6: Test get_secure_client_profile function with a random user
-- (Pick the first non-admin user)
SELECT
    'TEST 6: get_secure_client_profile() function' as test_name,
    CASE
        WHEN get_secure_client_profile(
            (SELECT id FROM public.profiles WHERE role = 'user' LIMIT 1)
        ) IS NOT NULL THEN '✅ PASS - Can fetch client profiles'
        ELSE '❌ FAIL - Cannot fetch client profiles'
    END as result;

-- Summary
SELECT
    '=' as separator,
    'If all tests show ✅ PASS, the fix is working!' as summary,
    '=' as separator2;
