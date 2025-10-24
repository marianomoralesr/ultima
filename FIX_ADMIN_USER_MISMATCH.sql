-- ============================================================================
-- FIX ADMIN USER MISMATCH
-- Problem: Admin email exists in profiles with role='admin', but when logging in,
-- a new profile with role='user' is created instead
-- ============================================================================

-- Step 1: Find all profiles with your admin email
-- Replace 'your-admin@example.com' with your actual admin email
SELECT
    id,
    email,
    role,
    created_at,
    'profiles' as source
FROM profiles
WHERE email = 'your-admin@example.com'  -- CHANGE THIS!
ORDER BY created_at;

-- Step 2: Find the auth.users entry
SELECT
    id,
    email,
    created_at,
    'auth.users' as source
FROM auth.users
WHERE email = 'your-admin@example.com'  -- CHANGE THIS!;

-- Step 3: If there are 2+ profiles for the same email, delete the duplicate(s)
-- Keep the one with role='admin', delete the one(s) with role='user'

-- BACKUP FIRST - Check what will be deleted:
SELECT
    id,
    email,
    role,
    created_at
FROM profiles
WHERE email = 'your-admin@example.com'  -- CHANGE THIS!
AND role = 'user';

-- Then delete the duplicate user profile(s):
-- UNCOMMENT TO RUN:
/*
DELETE FROM profiles
WHERE email = 'your-admin@example.com'  -- CHANGE THIS!
AND role = 'user';
*/

-- Step 4: Update the admin profile to match the auth.users ID
-- This ensures when you log in, it uses your admin profile

-- First, get the correct auth user ID:
-- (Copy this ID from the result)
SELECT id FROM auth.users WHERE email = 'your-admin@example.com';  -- CHANGE THIS!

-- Then update the admin profile to use that ID:
-- UNCOMMENT and replace UUID_FROM_AUTH_USERS with the actual UUID:
/*
UPDATE profiles
SET id = 'UUID_FROM_AUTH_USERS'  -- Paste the UUID from auth.users here
WHERE email = 'your-admin@example.com'  -- CHANGE THIS!
AND role = 'admin';
*/

-- Step 5: Verify the fix
SELECT
    u.id as auth_id,
    u.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'your-admin@example.com';  -- CHANGE THIS!

-- Should show ONE row with:
-- - auth_id = profile_id (they match!)
-- - role = 'admin'
