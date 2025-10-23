-- RECREATE ALL RLS POLICIES FOR FINANCING_APPLICATIONS

-- Enable RLS (should already be enabled)
ALTER TABLE financing_applications ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first (in case some remain)
DROP POLICY IF EXISTS "financing_apps_select" ON financing_applications;
DROP POLICY IF EXISTS "financing_apps_ins" ON financing_applications;
DROP POLICY IF EXISTS "financing_apps_upd" ON financing_applications;
DROP POLICY IF EXISTS "financing_apps_del" ON financing_applications;

-- SELECT policy: Users can view their own applications
CREATE POLICY "financing_apps_select"
ON financing_applications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT policy: Users can create their own applications
CREATE POLICY "financing_apps_ins"
ON financing_applications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE policy: Users can update their own applications
CREATE POLICY "financing_apps_upd"
ON financing_applications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE policy: Users can delete their own applications
CREATE POLICY "financing_apps_del"
ON financing_applications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- VERIFY: Show all policies
SELECT
    policyname,
    cmd,
    permissive,
    roles,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'financing_applications'
ORDER BY cmd, policyname;

-- TEST: Try to insert (should work now)
BEGIN;
INSERT INTO financing_applications (status)
VALUES ('draft')
RETURNING id, user_id, status;
ROLLBACK;
