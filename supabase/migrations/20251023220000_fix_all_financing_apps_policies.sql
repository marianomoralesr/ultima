-- Complete fix for financing_applications RLS policies
-- Drop ALL existing policies first, then recreate them correctly

-- Drop ALL existing policies on financing_applications
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'financing_applications' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.financing_applications CASCADE';
    END LOOP;
END $$;

-- Recreate policies with correct logic

-- 1. INSERT: Allow authenticated users (trigger sets user_id)
CREATE POLICY "financing_apps_insert"
ON public.financing_applications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. SELECT: Users can see their own + admins/sales see all
CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR
    get_my_role() IN ('admin', 'sales')
);

-- 3. UPDATE: Users can only update their own
CREATE POLICY "financing_apps_update"
ON public.financing_applications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. DELETE: Users can only delete their own drafts
CREATE POLICY "financing_apps_delete"
ON public.financing_applications
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND status = 'draft');

-- Add helpful comments
COMMENT ON POLICY "financing_apps_insert" ON public.financing_applications IS
'Allow authenticated users to insert. Trigger automatically sets user_id from auth.uid()';

COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'Users see their own applications. Admins and sales see all applications';

COMMENT ON POLICY "financing_apps_update" ON public.financing_applications IS
'Users can only update their own applications';

COMMENT ON POLICY "financing_apps_delete" ON public.financing_applications IS
'Users can only delete their own draft applications';
