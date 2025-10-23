-- FINAL VERIFICATION - Everything should work now

-- 1. Verify trigger exists
SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'bi_set_user_id_financing_applications';

-- 2. Verify function is correct
SELECT prosrc as function_source
FROM pg_proc
WHERE proname = 'set_user_id_from_auth';

-- 3. Verify RLS policies exist
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'financing_applications'
ORDER BY cmd;

-- 4. Check current user (this will be NULL in SQL editor, but that's OK)
SELECT
    auth.uid() as current_user_id,
    current_user_id() as current_user_id_function;

-- 5. Get a real user ID to test with
SELECT id, email, role
FROM profiles
WHERE role = 'user'
ORDER BY created_at DESC
LIMIT 1;

-- 6. Manually assign advisor to test user
UPDATE profiles
SET asesor_asignado_id = (SELECT id FROM profiles WHERE role = 'sales' LIMIT 1)
WHERE role = 'user'
AND asesor_asignado_id IS NULL
RETURNING id, email, asesor_asignado_id;
