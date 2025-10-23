-- Debug application access issue

-- 1. Check your current authentication
SELECT
    auth.uid() as user_id,
    auth.jwt()->>'email' as email,
    auth.jwt()->>'role' as jwt_role;

-- 2. Check your profile
SELECT
    id,
    email,
    role,
    asesor_asignado_id
FROM profiles
WHERE id = auth.uid();

-- 3. Check if you have any financing applications
SELECT
    id,
    user_id,
    status,
    created_at,
    updated_at
FROM financing_applications
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 4. Try to create a test application (will show exact error)
-- Uncomment to test:
/*
INSERT INTO financing_applications (status)
VALUES ('draft')
RETURNING id, user_id, status, created_at;
*/

-- 5. Check the trigger on financing_applications
SELECT
    tgname as trigger_name,
    proname as function_name,
    prosrc as function_source
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'financing_applications'::regclass
AND proname = 'set_user_id_from_auth';
