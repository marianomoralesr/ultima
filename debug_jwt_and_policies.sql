-- Debug JWT claims and RLS policies

-- 1. Check what's actually in your JWT
SELECT
    auth.uid() as user_id,
    auth.jwt() as full_jwt,
    auth.jwt()->>'email' as jwt_email,
    auth.jwt()->>'role' as jwt_role,
    auth.jwt()->>'user_role' as jwt_user_role;

-- 2. Check your actual profile role
SELECT
    id,
    email,
    role,
    asesor_asignado_id
FROM profiles
WHERE id = auth.uid();

-- 3. List ALL UPDATE policies on profiles table
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'UPDATE'
ORDER BY policyname;

-- 4. Test if you can update your own profile
-- This should work if there's a "Users can update their own profile" policy
BEGIN;

UPDATE profiles
SET asesor_asignado_id = (SELECT id FROM profiles WHERE role = 'sales' LIMIT 1)
WHERE id = auth.uid()
RETURNING id, email, asesor_asignado_id;

ROLLBACK;
