-- Debug script for "No se pudo iniciar una nueva solicitud" error
-- Run this while logged in as the user experiencing the error

-- 1. Check current authentication
SELECT
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as current_email,
    auth.jwt() ->> 'role' as jwt_role;

-- 2. Check if user has a profile
SELECT
    id,
    email,
    role,
    first_name,
    last_name,
    created_at
FROM profiles
WHERE id = auth.uid();

-- 3. Check RLS policies on financing_applications
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
WHERE tablename = 'financing_applications'
ORDER BY cmd, policyname;

-- 4. Check if user has any existing applications
SELECT
    id,
    status,
    created_at,
    updated_at
FROM financing_applications
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 5. Test if user can insert (this will fail with the actual error message)
-- Comment this out after seeing the error
/*
INSERT INTO financing_applications (user_id, status)
VALUES (auth.uid(), 'draft')
RETURNING id, status, created_at;
*/

-- 6. Check current_user_id() function
SELECT current_user_id() as test_current_user_id;

-- 7. Verify auth.users record exists
SELECT
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE id = auth.uid();
