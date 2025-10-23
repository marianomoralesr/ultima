-- Diagnostic queries to understand the RLS issue

-- 1. Check if RLS is enabled on the table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'financing_applications';

-- 2. List ALL current policies on financing_applications
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
WHERE schemaname = 'public' AND tablename = 'financing_applications'
ORDER BY policyname;

-- 3. Check if the trigger exists and is enabled
SELECT
    tgname as trigger_name,
    tgenabled as enabled,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'bi_set_user_id_financing_applications';

-- 4. Check the trigger function source
SELECT
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'set_user_id_from_auth';

-- 5. Test the trigger with a simulated insert (will rollback)
-- This tests if trigger can set user_id
DO $$
BEGIN
    -- Try to insert without user_id (trigger should set it)
    BEGIN
        INSERT INTO financing_applications (status)
        VALUES ('draft');

        RAISE NOTICE 'SUCCESS: Insert worked! Trigger set user_id.';

        -- Rollback the test insert
        RAISE EXCEPTION 'Test complete - rolling back';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: %', SQLERRM;
    END;
END $$;

-- 6. Check current_user_id function
SELECT
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'current_user_id';

-- 7. Check get_my_role function
SELECT
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'get_my_role';
