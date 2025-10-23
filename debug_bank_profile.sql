-- Debug script for bank profile save issues
-- Run this while logged in as the user experiencing the error

-- 1. Check if bank_profiles table exists and its structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'bank_profiles'
ORDER BY ordinal_position;

-- 2. Check RLS policies on bank_profiles
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
WHERE tablename = 'bank_profiles'
ORDER BY cmd, policyname;

-- 3. Check if RLS is enabled
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'bank_profiles';

-- 4. Check current user's profile
SELECT id, email, role
FROM profiles
WHERE id = auth.uid();

-- 5. Try to select from bank_profiles (check if user can read)
SELECT *
FROM bank_profiles
WHERE user_id = auth.uid();

-- 6. Test insert permission (this will show the actual error)
-- Comment this out after seeing the error
/*
INSERT INTO bank_profiles (user_id, respuestas, banco_recomendado, is_complete)
VALUES (
    auth.uid(),
    '{"test": "data"}'::jsonb,
    'BBVA',
    false
)
ON CONFLICT (user_id) DO UPDATE
SET respuestas = EXCLUDED.respuestas,
    banco_recomendado = EXCLUDED.banco_recomendado,
    is_complete = EXCLUDED.is_complete
RETURNING *;
*/
