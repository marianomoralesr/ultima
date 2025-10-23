-- Debug script to check current user's profile and role
-- Run this in Supabase SQL Editor while logged in as the user having issues

-- 1. Check who is currently logged in
SELECT
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as current_email;

-- 2. Check if this user has a profile
SELECT
    id,
    email,
    first_name,
    last_name,
    role,
    created_at
FROM profiles
WHERE id = auth.uid();

-- 3. List all admin and sales users (to verify roles are set correctly)
SELECT
    id,
    email,
    first_name,
    last_name,
    role,
    created_at
FROM profiles
WHERE role IN ('admin', 'sales')
ORDER BY created_at DESC;

-- 4. Check if the profiles table has RLS policies that might be blocking the read
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';
