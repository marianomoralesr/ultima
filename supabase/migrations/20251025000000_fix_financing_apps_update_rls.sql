-- ============================================================================
-- FIX FINANCING APPLICATIONS UPDATE RLS POLICY
-- Allow admins and sales to update application status
-- ============================================================================

-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "financing_apps_update" ON public.financing_applications;

-- Create new update policy that allows:
-- 1. Users to update their own applications
-- 2. Admins and sales to update ANY application
CREATE POLICY "financing_apps_update" ON public.financing_applications
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR
  get_my_role() IN ('admin', 'sales')
)
WITH CHECK (
  user_id = auth.uid() OR
  get_my_role() IN ('admin', 'sales')
);

COMMENT ON POLICY "financing_apps_update" ON public.financing_applications IS
'Allow users to update their own applications. Allow admins and sales to update any application.';
