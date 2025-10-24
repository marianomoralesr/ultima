-- DIAGNOSE AUTH.UID() ISSUE
-- Run this while logged in as your admin user

-- Check what auth.uid() returns
SELECT
    auth.uid() as my_auth_uid,
    auth.jwt() as my_jwt_token;

-- Check if your profile exists with that UUID
SELECT
    id,
    email,
    role,
    first_name,
    last_name
FROM profiles
WHERE id = auth.uid();

-- If the above returns NULL, check if your profile exists at all
SELECT
    id,
    email,
    role,
    first_name,
    last_name
FROM profiles
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- Check if there's a mismatch between auth.users and profiles
SELECT
    u.id as auth_user_id,
    u.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'YOUR_EMAIL_HERE';  -- Replace with your email
