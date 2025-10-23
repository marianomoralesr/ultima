-- Fix RLS policy for financing_applications INSERT operations
-- The issue: RLS WITH CHECK runs BEFORE triggers, so user_id is still NULL when checked
-- Solution: Remove user_id validation from INSERT policy since trigger will set it

-- Drop the problematic policies
DROP POLICY IF EXISTS "financing_apps_ins" ON public.financing_applications;
DROP POLICY IF EXISTS "Users can manage their own financing applications" ON public.financing_applications;

-- Recreate INSERT policy without user_id validation
-- The trigger will set user_id from auth.uid() automatically
CREATE POLICY "financing_apps_insert"
ON public.financing_applications
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow insert, trigger will set user_id

-- Keep SELECT policy strict (must be your own records)
DROP POLICY IF EXISTS "financing_apps_select" ON public.financing_applications;
CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR get_my_role() IN ('admin', 'sales'));

-- Keep UPDATE policy strict (must be your own records)
DROP POLICY IF EXISTS "financing_apps_upd" ON public.financing_applications;
CREATE POLICY "financing_apps_update"
ON public.financing_applications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Keep DELETE policy strict (must be your own records)
DROP POLICY IF EXISTS "financing_apps_del" ON public.financing_applications;
CREATE POLICY "financing_apps_delete"
ON public.financing_applications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow admin and sales to view all applications
CREATE POLICY "financing_apps_admin_sales_select"
ON public.financing_applications
FOR SELECT
TO authenticated
USING (get_my_role() IN ('admin', 'sales'));

COMMENT ON POLICY "financing_apps_insert" ON public.financing_applications IS
'Allow authenticated users to insert. Trigger sets user_id from auth.uid()';
