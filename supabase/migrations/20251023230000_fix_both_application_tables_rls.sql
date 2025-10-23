-- Fix RLS policies for BOTH application tables
-- Both 'financing_applications' and 'applications' have the same RLS issue

-- ==============================================================================
-- FIX 1: financing_applications table
-- ==============================================================================

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

-- Recreate policies for financing_applications
CREATE POLICY "financing_apps_insert" ON public.financing_applications
FOR INSERT TO authenticated
WITH CHECK (true);  -- Trigger sets user_id

CREATE POLICY "financing_apps_select" ON public.financing_applications
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR get_my_role() IN ('admin', 'sales'));

CREATE POLICY "financing_apps_update" ON public.financing_applications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "financing_apps_delete" ON public.financing_applications
FOR DELETE TO authenticated
USING (user_id = auth.uid() AND status = 'draft');

-- ==============================================================================
-- FIX 2: applications table (older table, but fix it too)
-- ==============================================================================

-- Drop ALL existing policies on applications
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'applications' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.applications CASCADE';
    END LOOP;
END $$;

-- Recreate policies for applications
CREATE POLICY "applications_insert" ON public.applications
FOR INSERT TO authenticated
WITH CHECK (true);  -- Trigger sets user_id

CREATE POLICY "applications_select" ON public.applications
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR get_my_role() IN ('admin', 'sales'));

CREATE POLICY "applications_update" ON public.applications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "applications_delete" ON public.applications
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ==============================================================================
-- Add helpful comments
-- ==============================================================================

COMMENT ON POLICY "financing_apps_insert" ON public.financing_applications IS
'Allow authenticated users to insert. Trigger automatically sets user_id from auth.uid()';

COMMENT ON POLICY "applications_insert" ON public.applications IS
'Allow authenticated users to insert. Trigger automatically sets user_id from auth.uid()';
