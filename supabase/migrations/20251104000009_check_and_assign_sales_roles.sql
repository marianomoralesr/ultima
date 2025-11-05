-- Check all users and their roles, then help identify who should be sales

-- Step 1: Show ALL users and their roles
SELECT
    'All Users Report' as report_type,
    id,
    email,
    role,
    created_at,
    last_sign_in_at,
    CASE
        WHEN role = 'admin' THEN '✓ Admin'
        WHEN role = 'sales' THEN '✓ Sales'
        WHEN role = 'user' THEN 'Regular User'
        WHEN role IS NULL THEN '⚠ No role assigned'
        ELSE '⚠ Unknown role: ' || role
    END as role_status
FROM public.profiles
WHERE role IN ('admin', 'sales') OR role IS NULL
ORDER BY
    CASE
        WHEN role = 'admin' THEN 1
        WHEN role = 'sales' THEN 2
        WHEN role IS NULL THEN 3
        ELSE 4
    END,
    email;

-- Step 2: Count users by role
SELECT
    'Role Distribution' as report_type,
    role,
    COUNT(*) as user_count
FROM public.profiles
GROUP BY role
ORDER BY
    CASE
        WHEN role = 'admin' THEN 1
        WHEN role = 'sales' THEN 2
        WHEN role = 'user' THEN 3
        WHEN role IS NULL THEN 4
        ELSE 5
    END;

-- Step 3: Show admin emails from hardcoded list (for reference)
SELECT
    'Hardcoded Admin Emails' as report_type,
    unnest(ARRAY[
        'mariano@autostrefa.mx',
        'david.rojas@autostrefa.mx',
        'gerardo.martinez@autostrefa.mx',
        'daniel.nava@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    ]) as email;

-- Step 4: Instructions for assigning sales role
DO $$
BEGIN
    RAISE NOTICE '=== How to Fix Sales Access ===';
    RAISE NOTICE '';
    RAISE NOTICE 'If you see users above who should have sales access but have NULL or "user" role:';
    RAISE NOTICE '';
    RAISE NOTICE '1. For a specific user by email:';
    RAISE NOTICE '   UPDATE profiles SET role = ''sales'' WHERE email = ''user@autostrefa.mx'';';
    RAISE NOTICE '';
    RAISE NOTICE '2. For multiple users:';
    RAISE NOTICE '   UPDATE profiles SET role = ''sales'' WHERE email IN (';
    RAISE NOTICE '     ''user1@autostrefa.mx'',';
    RAISE NOTICE '     ''user2@autostrefa.mx''';
    RAISE NOTICE '   );';
    RAISE NOTICE '';
    RAISE NOTICE '3. To verify after update:';
    RAISE NOTICE '   SELECT email, role FROM profiles WHERE email = ''user@autostrefa.mx'';';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTE: Role must be EXACTLY ''sales'' (lowercase, no spaces)';
END $$;
