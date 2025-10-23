-- Complete diagnostic test for RLS and trigger issue

-- 1. Check if trigger exists and is enabled
SELECT
    tgname as trigger_name,
    tgenabled as enabled,
    tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'bi_set_user_id_financing_applications';

-- 2. Check trigger function
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'set_user_id_from_auth';

-- 3. Check ALL policies (including USING clauses)
SELECT
    policyname,
    cmd::text,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'financing_applications'
ORDER BY cmd, policyname;

-- 4. Test if auth.uid() works in your session
SELECT auth.uid() as current_user_id;

-- 5. Test INSERT with explicit user_id (bypass trigger)
-- This tests if RLS allows insert when user_id matches
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Get current user
    test_user_id := auth.uid();

    IF test_user_id IS NULL THEN
        RAISE NOTICE '❌ auth.uid() is NULL - you are not authenticated';
    ELSE
        RAISE NOTICE '✅ Current user: %', test_user_id;

        -- Try insert WITH explicit user_id
        BEGIN
            INSERT INTO financing_applications (user_id, status)
            VALUES (test_user_id, 'draft');

            RAISE NOTICE '✅ INSERT with explicit user_id SUCCEEDED';

            -- Clean up
            DELETE FROM financing_applications
            WHERE user_id = test_user_id AND status = 'draft'
            ORDER BY created_at DESC LIMIT 1;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ INSERT with explicit user_id FAILED: %', SQLERRM;
        END;

        -- Try insert WITHOUT user_id (trigger should set it)
        BEGIN
            INSERT INTO financing_applications (status)
            VALUES ('draft');

            RAISE NOTICE '✅ INSERT without user_id (trigger) SUCCEEDED';

            -- Clean up
            DELETE FROM financing_applications
            WHERE user_id = test_user_id AND status = 'draft'
            ORDER BY created_at DESC LIMIT 1;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ INSERT without user_id (trigger) FAILED: %', SQLERRM;
        END;
    END IF;
END $$;
