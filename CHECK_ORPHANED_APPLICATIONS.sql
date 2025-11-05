-- ============================================================================
-- CHECK FOR ORPHANED APPLICATIONS
-- Applications that exist but don't have matching profiles
-- ============================================================================

-- Test 1: Count applications with and without matching profiles
SELECT
    'Applications with/without profiles' as test,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = fa.user_id
    )) as apps_with_profile,
    COUNT(*) FILTER (WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = fa.user_id
    )) as orphaned_apps
FROM public.financing_applications fa;

-- Test 2: Sample orphaned applications (if any)
SELECT
    'Orphaned applications (no matching profile)' as test,
    fa.id,
    fa.user_id,
    fa.status,
    fa.created_at,
    fa.car_info->>'_vehicleTitle' as car_title
FROM public.financing_applications fa
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = fa.user_id
)
ORDER BY fa.created_at DESC
LIMIT 10;

-- Test 3: Check if user_ids exist in auth.users but not profiles
SELECT
    'Applications with auth.user but no profile' as test,
    fa.id as app_id,
    fa.user_id,
    au.email as auth_email,
    fa.status,
    fa.created_at
FROM public.financing_applications fa
JOIN auth.users au ON au.id = fa.user_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = fa.user_id
)
ORDER BY fa.created_at DESC
LIMIT 10;

-- Test 4: Sample valid applications (WITH matching profiles)
SELECT
    'Valid applications (have matching profile)' as test,
    fa.id,
    fa.user_id,
    p.email as profile_email,
    fa.status,
    fa.car_info->>'_vehicleTitle' as car_title,
    fa.created_at
FROM public.financing_applications fa
JOIN public.profiles p ON p.id = fa.user_id
WHERE fa.status IN ('submitted', 'reviewing', 'pending_docs', 'draft')
ORDER BY fa.created_at DESC
LIMIT 10;

-- Test 5: Count by status
SELECT
    'Applications by status' as test,
    status,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = fa.user_id
    )) as with_profile
FROM public.financing_applications fa
GROUP BY status
ORDER BY count DESC;
