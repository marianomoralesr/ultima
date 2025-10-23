-- RECREATE RLS POLICIES WITH CORRECT current_user_id() FUNCTION

-- First, verify current_user_id() function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'current_user_id';

-- Drop any broken policies
DROP POLICY IF EXISTS "financing_apps_select" ON financing_applications;
DROP POLICY IF EXISTS "financing_apps_ins" ON financing_applications;
DROP POLICY IF EXISTS "financing_apps_upd" ON financing_applications;
DROP POLICY IF EXISTS "financing_apps_del" ON financing_applications;

-- Recreate policies using current_user_id() (matches original schema)
CREATE POLICY "financing_apps_select"
ON financing_applications
FOR SELECT
TO authenticated
USING (user_id = current_user_id());

CREATE POLICY "financing_apps_ins"
ON financing_applications
FOR INSERT
TO authenticated
WITH CHECK (user_id = current_user_id());

CREATE POLICY "financing_apps_upd"
ON financing_applications
FOR UPDATE
TO authenticated
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

CREATE POLICY "financing_apps_del"
ON financing_applications
FOR DELETE
TO authenticated
USING (user_id = current_user_id());

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'financing_applications'
ORDER BY cmd, policyname;
