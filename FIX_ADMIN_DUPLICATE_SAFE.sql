-- ============================================================================
-- SAFE FIX FOR ADMIN DUPLICATE PROFILES
-- This promotes the existing 'user' profile to 'admin' instead of trying to
-- merge IDs (which causes constraint violations)
-- ============================================================================

-- Step 1: Identify which profile is connected to auth.users
-- This is the one that gets used when you log in
SELECT
    u.id as auth_user_id,
    u.email,
    p.id as profile_id,
    p.role as current_role,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'marianomorales@outlook.com'  -- CHANGE THIS!
ORDER BY p.created_at DESC;

-- Step 2: Check if there's an orphaned admin profile
-- (one with role='admin' but different ID than auth.users)
SELECT
    p.id as orphaned_profile_id,
    p.email,
    p.role,
    p.created_at,
    'This profile is NOT connected to auth.users' as note
FROM profiles p
WHERE p.email = 'marianomorales@outlook.com'  -- CHANGE THIS!
AND p.id NOT IN (
    SELECT id FROM auth.users WHERE email = 'marianomorales@outlook.com'  -- CHANGE THIS!
);

-- Step 3: SOLUTION - Simply update the connected profile to be admin
-- This is the safest approach - just change the role of the profile that's
-- actually connected to your auth.users account

UPDATE profiles
SET role = 'admin'::user_role
WHERE id IN (
    SELECT u.id
    FROM auth.users u
    WHERE u.email = 'marianomorales@outlook.com'  -- CHANGE THIS!
)
AND email = 'marianomorales@outlook.com';  -- CHANGE THIS! (double safety check)

-- Step 4: (Optional) Delete the orphaned admin profile if it exists
-- Only run this if Step 2 showed an orphaned profile
-- UNCOMMENT TO RUN:
/*
DELETE FROM profiles
WHERE email = 'marianomorales@outlook.com'  -- CHANGE THIS!
AND id NOT IN (
    SELECT id FROM auth.users WHERE email = 'marianomorales@outlook.com'  -- CHANGE THIS!
);
*/

-- Step 5: Verify the fix worked
SELECT
    u.id as auth_id,
    u.email,
    p.id as profile_id,
    p.role,
    p.first_name,
    p.last_name,
    'SUCCESS - IDs match and role is admin' as status
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'marianomorales@outlook.com';  -- CHANGE THIS!

-- Expected result:
-- - auth_id = profile_id (they should match)
-- - role = 'admin'
-- - status = 'SUCCESS - IDs match and role is admin'
