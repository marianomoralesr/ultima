-- Show ALL users in the profiles table to identify who should be sales/admin

SELECT
    'All Profiles in Database' as report_type,
    id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    last_sign_in_at
FROM public.profiles
ORDER BY
    CASE
        WHEN email LIKE '%@autostrefa.mx' THEN 1
        ELSE 2
    END,
    created_at DESC
LIMIT 100;

-- Count total profiles
SELECT
    'Total Profile Count' as report_type,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'sales' THEN 1 END) as sales_count,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as null_role_count
FROM public.profiles;

-- Show which autostrefa.mx emails exist
SELECT
    'AutoStrefa Employees' as report_type,
    email,
    role,
    CASE
        WHEN role = 'admin' THEN '✓ Admin'
        WHEN role = 'sales' THEN '✓ Sales'
        WHEN role = 'user' THEN '⚠ Regular user (should be admin/sales?)'
        WHEN role IS NULL THEN '⚠ No role assigned'
        ELSE '⚠ Unknown: ' || role
    END as status
FROM public.profiles
WHERE email LIKE '%@autostrefa.mx'
ORDER BY email;
