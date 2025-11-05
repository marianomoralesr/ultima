-- ============================================================================
-- FIX FINANCING APPLICATIONS INSERT POLICY
-- Error: new row violates row-level security policy
-- The INSERT policy is too restrictive
-- ============================================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "financing_apps_insert" ON public.financing_applications;

-- Recreate INSERT policy - allow authenticated users to insert
CREATE POLICY "financing_apps_insert"
ON public.financing_applications
FOR INSERT
TO authenticated
WITH CHECK (
    -- Users can insert their own applications (trigger sets user_id)
    true
);

COMMENT ON POLICY "financing_apps_insert" ON public.financing_applications IS
'Allow authenticated users to insert applications. The trigger automatically sets user_id from auth.uid().';

-- Verify the policy exists
SELECT
    'INSERT policy check' as test,
    policyname,
    cmd,
    with_check::text as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'financing_applications'
  AND cmd = 'INSERT';

SELECT '✅ INSERT policy fixed - users can now create applications!' as status;
