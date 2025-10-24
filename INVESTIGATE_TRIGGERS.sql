-- ============================================================================
-- INVESTIGATE TRIGGERS ON PROFILES TABLE
-- This will help us understand why a simple UPDATE is causing a duplicate key error
-- ============================================================================

-- Step 1: Check for triggers on profiles table
SELECT
    tgname as trigger_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass
AND tgname NOT LIKE 'RI_%'  -- Exclude referential integrity triggers
ORDER BY tgname;

-- Step 2: Check for any INSERT/UPDATE/DELETE rules
SELECT
    schemaname,
    tablename,
    rulename
FROM pg_rules
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- Step 3: Check if there are somehow multiple rows with the same ID (shouldn't be possible)
SELECT
    id,
    email,
    role,
    COUNT(*) as count
FROM profiles
WHERE id = '92ca11a7-a17e-451c-bc81-f9583e09456a'
GROUP BY id, email, role
HAVING COUNT(*) > 1;

-- Step 4: Try a different approach - Use a transaction to see exactly what's happening
-- This won't actually commit, just shows what would happen
BEGIN;

-- Update the role
UPDATE profiles
SET role = 'admin'::user_role
WHERE id = '92ca11a7-a17e-451c-bc81-f9583e09456a'
AND email = 'marianomorales@outlook.com';

-- Check the result
SELECT
    id,
    email,
    role,
    'After UPDATE in transaction' as note
FROM profiles
WHERE id = '92ca11a7-a17e-451c-bc81-f9583e09456a';

-- Don't commit, just rollback
ROLLBACK;

-- Step 5: Alternative approach - Try updating via a different method
-- Using a CTE to be more explicit
WITH target AS (
    SELECT id FROM profiles
    WHERE id = '92ca11a7-a17e-451c-bc81-f9583e09456a'
    AND email = 'marianomorales@outlook.com'
    LIMIT 1
)
UPDATE profiles
SET role = 'admin'::user_role
FROM target
WHERE profiles.id = target.id
RETURNING profiles.id, profiles.email, profiles.role;

-- Step 6: If the above works, verify the change
SELECT
    u.id as auth_id,
    u.email,
    p.id as profile_id,
    p.role,
    p.first_name,
    p.last_name,
    CASE
        WHEN u.id = p.id AND p.role = 'admin' THEN '✓ SUCCESS - Admin access should work now'
        ELSE '✗ FAILED - Still needs fixing'
    END as status
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'marianomorales@outlook.com';
