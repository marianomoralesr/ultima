-- ============================================================================
-- CORRECTIVE FIX: Sales Role - ONLY Assigned Leads Access
-- ============================================================================
-- This migration corrects the previous migration (20251112000002) which
-- incorrectly gave sales users access to ALL leads.
--
-- CORRECT BEHAVIOR:
-- - Sales users: Can ONLY see leads assigned to them (asesor_asignado_id = auth.uid())
-- - Admin users: Can see ALL leads and users
-- - Regular users: Can only see their own data
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE - Sales can ONLY see ASSIGNED user profiles (leads)
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  -- Users can see their own profile
  id = auth.uid()
  OR
  -- Admin can see all profiles
  public.get_my_role() = 'admin'
  OR
  -- Sales can ONLY see ASSIGNED user profiles (leads)
  (
    public.get_my_role() = 'sales'
    AND role = 'user'  -- Only actual leads, not other sales/admin users
    AND asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
  )
);

COMMENT ON POLICY "profiles_select" ON public.profiles IS
'[PERMANENT] Users see own profile. Admin sees all profiles. Sales sees ONLY ASSIGNED user profiles (leads).';

-- Allow sales to update contactado field and notes ONLY on ASSIGNED leads
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND role = 'user'  -- Only actual user profiles (leads)
    AND asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
  )
)
WITH CHECK (
  id = auth.uid()
  OR
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND role = 'user'
    AND asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
  )
);

COMMENT ON POLICY "profiles_update" ON public.profiles IS
'[PERMANENT] Users update own profile. Admin updates all. Sales updates ONLY ASSIGNED user profiles (leads).';

-- ============================================================================
-- 2. FINANCING_APPLICATIONS - Sales can ONLY see applications from ASSIGNED leads
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
  -- Sales can ONLY see applications from ASSIGNED leads
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'  -- Application must belong to a user (lead)
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'[PERMANENT] Users see own applications. Admin sees all. Sales sees applications from ASSIGNED leads ONLY.';

DROP POLICY IF EXISTS "financing_apps_update" ON public.financing_applications;

CREATE POLICY "financing_apps_update"
ON public.financing_applications
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
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
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
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "financing_apps_update" ON public.financing_applications IS
'[PERMANENT] Users update own applications. Admin updates all. Sales updates applications from ASSIGNED leads ONLY.';

-- ============================================================================
-- 3. UPLOADED_DOCUMENTS - Sales can ONLY see documents from ASSIGNED leads
-- ============================================================================

DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  -- Users can see their own documents
  user_id = auth.uid()
  OR
  -- Admin can see all documents
  public.get_my_role() = 'admin'
  OR
  -- Sales can ONLY see documents from ASSIGNED leads
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "uploaded_documents_select" ON public.uploaded_documents IS
'[PERMANENT] Users see own documents. Admin sees all. Sales sees documents from ASSIGNED leads ONLY.';

DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;

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
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
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
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "uploaded_documents_update" ON public.uploaded_documents IS
'[PERMANENT] Users update own documents. Admin updates all. Sales updates documents from ASSIGNED leads ONLY.';

-- ============================================================================
-- 4. LEAD_TAG_ASSOCIATIONS - Sales can manage tags ONLY for ASSIGNED leads
-- ============================================================================

DROP POLICY IF EXISTS "lead_tag_associations_select" ON public.lead_tag_associations;

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
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "lead_tag_associations_select" ON public.lead_tag_associations IS
'[PERMANENT] Admin sees all tag associations. Sales sees tag associations for ASSIGNED leads ONLY.';

DROP POLICY IF EXISTS "lead_tag_associations_insert" ON public.lead_tag_associations;

CREATE POLICY "lead_tag_associations_insert" ON public.lead_tag_associations
FOR INSERT TO authenticated
WITH CHECK (
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = lead_tag_associations.lead_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "lead_tag_associations_insert" ON public.lead_tag_associations IS
'[PERMANENT] Admin and Sales can create tag associations for ASSIGNED leads ONLY.';

DROP POLICY IF EXISTS "lead_tag_associations_update" ON public.lead_tag_associations;

CREATE POLICY "lead_tag_associations_update" ON public.lead_tag_associations
FOR UPDATE TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = lead_tag_associations.lead_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
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
      WHERE p.id = lead_tag_associations.lead_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "lead_tag_associations_update" ON public.lead_tag_associations IS
'[PERMANENT] Admin and Sales can update tag associations for ASSIGNED leads ONLY.';

DROP POLICY IF EXISTS "lead_tag_associations_delete" ON public.lead_tag_associations;

CREATE POLICY "lead_tag_associations_delete" ON public.lead_tag_associations
FOR DELETE TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = lead_tag_associations.lead_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "lead_tag_associations_delete" ON public.lead_tag_associations IS
'[PERMANENT] Admin and Sales can delete tag associations for ASSIGNED leads ONLY.';

-- ============================================================================
-- 5. LEAD_REMINDERS - Sales can manage reminders ONLY for ASSIGNED leads
-- ============================================================================

DROP POLICY IF EXISTS "lead_reminders_select" ON public.lead_reminders;

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
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "lead_reminders_select" ON public.lead_reminders IS
'[PERMANENT] Admin sees all reminders. Sales sees reminders for ASSIGNED leads ONLY.';

DROP POLICY IF EXISTS "lead_reminders_insert" ON public.lead_reminders;

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
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "lead_reminders_insert" ON public.lead_reminders IS
'[PERMANENT] Admin and Sales can create reminders for ASSIGNED leads ONLY.';

DROP POLICY IF EXISTS "lead_reminders_update" ON public.lead_reminders;

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
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
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
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "lead_reminders_update" ON public.lead_reminders IS
'[PERMANENT] Admin and Sales can update reminders for ASSIGNED leads ONLY.';

DROP POLICY IF EXISTS "lead_reminders_delete" ON public.lead_reminders;

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
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY assigned leads!
    )
  )
);

COMMENT ON POLICY "lead_reminders_delete" ON public.lead_reminders IS
'[PERMANENT] Admin and Sales can delete reminders for ASSIGNED leads ONLY.';

-- ============================================================================
-- 6. VERIFY AND LOG RESULTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CORRECTIVE FIX: SALES PERMISSIONS - ASSIGNED LEADS ONLY ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Sales Role Permissions (CORRECTED):';
    RAISE NOTICE '  ✓ View ONLY ASSIGNED user profiles (leads) in CRM';
    RAISE NOTICE '  ✓ Update contactado field and notes on ASSIGNED leads';
    RAISE NOTICE '  ✓ View financing applications from ASSIGNED leads ONLY';
    RAISE NOTICE '  ✓ Update applications from ASSIGNED leads ONLY';
    RAISE NOTICE '  ✓ View documents from ASSIGNED leads ONLY';
    RAISE NOTICE '  ✓ Update documents from ASSIGNED leads ONLY';
    RAISE NOTICE '  ✓ Manage lead tags for ASSIGNED leads ONLY';
    RAISE NOTICE '  ✓ Manage lead reminders for ASSIGNED leads ONLY';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin Role Permissions:';
    RAISE NOTICE '  ✓ View ALL leads and users';
    RAISE NOTICE '  ✓ Full access to all data';
    RAISE NOTICE '';
    RAISE NOTICE 'Key Change from Previous Migration:';
    RAISE NOTICE '  - Sales now see ONLY leads where asesor_asignado_id = auth.uid()';
    RAISE NOTICE '  - Previous migration incorrectly allowed sales to see ALL leads';
    RAISE NOTICE '';
    RAISE NOTICE 'All policies use public.get_my_role() to avoid infinite recursion';
    RAISE NOTICE '';
END $$;
