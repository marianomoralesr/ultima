-- FIX CRM ACCESS ISSUE
-- This script diagnoses and fixes admin access to the CRM dashboard

-- STEP 1: Check the actual column name in the profiles table
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('role', 'user_role');

-- STEP 2: Check your user's role value
-- Replace 'your-email@example.com' with your actual email
SELECT
    id,
    email,
    CASE
        WHEN column_name = 'role' THEN role::text
        ELSE NULL
    END as role_value,
    first_name,
    last_name,
    created_at
FROM profiles
CROSS JOIN (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name IN ('role', 'user_role')
    LIMIT 1
) col
WHERE email = 'your-email@example.com';  -- CHANGE THIS!

-- STEP 3: If the column exists but value is NULL or 'user', update it
-- UNCOMMENT and run this if your role is not 'admin':
/*
UPDATE profiles
SET role = 'admin'::user_role
WHERE email = 'your-email@example.com';  -- CHANGE THIS!
*/

-- STEP 4: Verify the update worked
SELECT
    id,
    email,
    role,
    first_name,
    last_name
FROM profiles
WHERE email = 'your-email@example.com';  -- CHANGE THIS!

-- STEP 5: Check if get_leads_for_dashboard function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_leads_for_dashboard';

-- STEP 6: Test the function (should work if you're admin)
SELECT COUNT(*) as total_leads
FROM get_leads_for_dashboard();

-- STEP 7: Check RLS policies on profiles table
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;
