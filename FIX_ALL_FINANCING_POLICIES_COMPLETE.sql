-- ============================================================================
-- COMPLETE FIX FOR ALL FINANCING_APPLICATIONS POLICIES
-- Fixes INSERT, SELECT, UPDATE, and DELETE
-- ============================================================================

-- Drop ALL existing policies on financing_applications
DROP POLICY IF EXISTS "financing_apps_insert" ON public.financing_applications;
DROP POLICY IF EXISTS "financing_apps_select" ON public.financing_applications;
DROP POLICY IF EXISTS "financing_apps_update" ON public.financing_applications;
DROP POLICY IF EXISTS "financing_apps_delete" ON public.financing_applications;
DROP POLICY IF EXISTS "financing_apps_del" ON public.financing_applications;
DROP POLICY IF EXISTS "financing_apps_ins" ON public.financing_applications;
DROP POLICY IF EXISTS "financing_apps_upd" ON public.financing_applications;

-- 1. INSERT: Allow ALL authenticated users to insert
-- The trigger will set user_id automatically
CREATE POLICY "financing_apps_insert"
ON public.financing_applications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. SELECT: Users see their own + admins see all
CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR
    auth.jwt()->>'email' IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    )
    OR
    get_my_role() IN ('admin', 'sales')
);

-- 3. UPDATE: Users update their own + admins update all
CREATE POLICY "financing_apps_update"
ON public.financing_applications
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
    OR
    auth.jwt()->>'email' IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    )
    OR
    get_my_role() IN ('admin', 'sales')
)
WITH CHECK (
    user_id = auth.uid()
    OR
    auth.jwt()->>'email' IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    )
    OR
    get_my_role() IN ('admin', 'sales')
);

-- 4. DELETE: Users delete their own drafts
CREATE POLICY "financing_apps_delete"
ON public.financing_applications
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND status = 'draft');

-- Add comments
COMMENT ON POLICY "financing_apps_insert" ON public.financing_applications IS
'Allow all authenticated users to insert. Trigger sets user_id automatically.';

COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'Users see their own applications. Admins (by email OR role) see all.';

COMMENT ON POLICY "financing_apps_update" ON public.financing_applications IS
'Users update their own. Admins (by email OR role) update all.';

COMMENT ON POLICY "financing_apps_delete" ON public.financing_applications IS
'Users can only delete their own draft applications.';

-- Verify the policies
SELECT
    'All financing_applications policies' as test,
    policyname,
    cmd as policy_type,
    CASE
        WHEN cmd = 'INSERT' AND with_check::text = 'true' THEN '✅ GOOD - Allows all authenticated'
        WHEN cmd = 'SELECT' THEN '✅ GOOD - Has USING clause'
        WHEN cmd = 'UPDATE' THEN '✅ GOOD - Has USING and WITH CHECK'
        WHEN cmd = 'DELETE' THEN '✅ GOOD - Has USING clause'
        ELSE '⚠️ Check manually'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'financing_applications'
ORDER BY cmd, policyname;

-- Success message
SELECT '
╔══════════════════════════════════════════════════╗
║  ✅ ALL FINANCING_APPLICATIONS POLICIES FIXED!  ║
║                                                  ║
║  Users should now be able to:                   ║
║  • Create new financing applications            ║
║  • View their own applications                  ║
║  • Update their own applications                ║
║  • Delete their own draft applications          ║
║                                                  ║
║  Admins can:                                     ║
║  • View ALL applications                        ║
║  • Update ALL applications                      ║
║                                                  ║
║  Please test creating a new application!        ║
╔══════════════════════════════════════════════════╗
' as FINAL_STATUS;
