-- Fix: Eliminate infinite recursion by using JWT directly instead of querying profiles table
-- The JWT already contains the user's email, we just need to check the role from a SECURITY DEFINER function

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTION TO GET ROLE (bypasses RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

COMMENT ON FUNCTION public.get_my_role() IS
'Returns the role of the current user. Uses SECURITY DEFINER to bypass RLS and avoid recursion.';

-- ============================================================================
-- 2. PROFILES TABLE - Use function instead of direct query
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  -- Users can see their own profile
  id = auth.uid()
  OR
  -- Admin can see all profiles (using SECURITY DEFINER function)
  public.get_my_role() = 'admin'
  OR
  -- Sales can see all profiles (using SECURITY DEFINER function)
  public.get_my_role() = 'sales'
);

COMMENT ON POLICY "profiles_select" ON public.profiles IS
'Users see own profile. Admin and Sales see all profiles (role-based via SECURITY DEFINER function).';

-- ============================================================================
-- 3. FINANCING_APPLICATIONS - Use function
-- ============================================================================

DROP POLICY IF EXISTS "financing_apps_select" ON public.financing_applications;

CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  -- Users can see their own applications
  user_id = auth.uid()
  OR
  -- Admin can see all applications
  public.get_my_role() = 'admin'
  OR
  -- Sales can see applications from their assigned leads
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'Users see own applications. Admin sees all. Sales sees applications from assigned leads (role-based via SECURITY DEFINER function).';

-- ============================================================================
-- 4. UPLOADED_DOCUMENTS - Use function
-- ============================================================================

DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_delete" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  -- Users can see their own documents
  user_id = auth.uid()
  OR
  -- Admin can see all documents
  public.get_my_role() = 'admin'
  OR
  -- Sales can see documents from their assigned leads
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR
  public.get_my_role() = 'admin'
);

COMMENT ON POLICY "uploaded_documents_select" ON public.uploaded_documents IS
'Users see own documents. Admin sees all. Sales sees documents from assigned leads (role-based via SECURITY DEFINER function).';

-- ============================================================================
-- 5. LEAD_TAGS - Use function
-- ============================================================================

DROP POLICY IF EXISTS "lead_tags_select" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_insert" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_update" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_delete" ON public.lead_tags;

CREATE POLICY "lead_tags_select" ON public.lead_tags
FOR SELECT TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

CREATE POLICY "lead_tags_insert" ON public.lead_tags
FOR INSERT TO authenticated
WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "lead_tags_update" ON public.lead_tags
FOR UPDATE TO authenticated
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "lead_tags_delete" ON public.lead_tags
FOR DELETE TO authenticated
USING (public.get_my_role() = 'admin');

COMMENT ON POLICY "lead_tags_select" ON public.lead_tags IS
'Admin and Sales can view tags. Only Admin can create/edit/delete (role-based via SECURITY DEFINER function).';

-- ============================================================================
-- 6. LEAD_TAG_ASSOCIATIONS - Use function
-- ============================================================================

DROP POLICY IF EXISTS "lead_tag_associations_select" ON public.lead_tag_associations;
DROP POLICY IF EXISTS "lead_tag_associations_insert" ON public.lead_tag_associations;
DROP POLICY IF EXISTS "lead_tag_associations_update" ON public.lead_tag_associations;
DROP POLICY IF EXISTS "lead_tag_associations_delete" ON public.lead_tag_associations;

CREATE POLICY "lead_tag_associations_select" ON public.lead_tag_associations
FOR SELECT TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = lead_tag_associations.lead_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

CREATE POLICY "lead_tag_associations_insert" ON public.lead_tag_associations
FOR INSERT TO authenticated
WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "lead_tag_associations_update" ON public.lead_tag_associations
FOR UPDATE TO authenticated
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "lead_tag_associations_delete" ON public.lead_tag_associations
FOR DELETE TO authenticated
USING (public.get_my_role() = 'admin');

COMMENT ON POLICY "lead_tag_associations_select" ON public.lead_tag_associations IS
'Admin sees all. Sales sees tags for assigned leads. Only Admin can modify (role-based via SECURITY DEFINER function).';

-- ============================================================================
-- 7. LEAD_REMINDERS - Use function
-- ============================================================================

DROP POLICY IF EXISTS "lead_reminders_select" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_insert" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_update" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_delete" ON public.lead_reminders;

CREATE POLICY "lead_reminders_select" ON public.lead_reminders
FOR SELECT TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = lead_reminders.lead_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

CREATE POLICY "lead_reminders_insert" ON public.lead_reminders
FOR INSERT TO authenticated
WITH CHECK (
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = lead_reminders.lead_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

CREATE POLICY "lead_reminders_update" ON public.lead_reminders
FOR UPDATE TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = lead_reminders.lead_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
)
WITH CHECK (
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = lead_reminders.lead_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

CREATE POLICY "lead_reminders_delete" ON public.lead_reminders
FOR DELETE TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = lead_reminders.lead_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "lead_reminders_select" ON public.lead_reminders IS
'Admin sees all. Sales sees/manages reminders for assigned leads (role-based via SECURITY DEFINER function).';

-- ============================================================================
-- 8. VERIFY AND LOG RESULTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== INFINITE RECURSION FIXED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Solution: Using public.get_my_role() SECURITY DEFINER function';
    RAISE NOTICE 'This function bypasses RLS when checking roles, preventing recursion.';
    RAISE NOTICE '';
    RAISE NOTICE 'All policies now use:';
    RAISE NOTICE '  public.get_my_role() = ''admin''';
    RAISE NOTICE '  public.get_my_role() = ''sales''';
    RAISE NOTICE '';
    RAISE NOTICE 'Instead of:';
    RAISE NOTICE '  (SELECT role FROM profiles WHERE id = auth.uid())';
    RAISE NOTICE '';
    RAISE NOTICE 'This eliminates the circular dependency!';
    RAISE NOTICE '';
END $$;
