-- Test if the trigger can access auth.uid()
-- This checks if auth.uid() returns a value in trigger context

-- 1. Check trigger function exists
SELECT
    proname,
    prosrc
FROM pg_proc
WHERE proname = 'set_user_id_from_auth';

-- 2. Check if auth.uid() works in a function context
-- (This simulates what the trigger does)
DO $$
DECLARE
    current_auth_id uuid;
BEGIN
    current_auth_id := auth.uid();

    IF current_auth_id IS NULL THEN
        RAISE NOTICE '❌ auth.uid() returns NULL - Auth context not available';
    ELSE
        RAISE NOTICE '✅ auth.uid() returns: %', current_auth_id;
    END IF;
END $$;

-- 3. Check get_my_role() function (used in SELECT policy)
SELECT
    proname,
    prosrc
FROM pg_proc
WHERE proname = 'get_my_role';

-- ============================================================================
-- HYPOTHESIS: The 403 error might be from the SELECT policy, not INSERT policy
--
-- When you do: .insert().select().single()
-- 1. INSERT succeeds (WITH CHECK: true) ✅
-- 2. Trigger sets user_id ✅
-- 3. SELECT tries to read the row back
-- 4. SELECT policy checks: user_id = auth.uid() ❓
-- 5. If auth.uid() doesn't match the inserted user_id, SELECT fails with 403 ❌
--
-- SOLUTION: Check if auth.uid() is the same in both contexts
-- ============================================================================
