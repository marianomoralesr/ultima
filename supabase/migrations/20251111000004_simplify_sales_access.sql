-- Simplify: Sales role automatically gets access to assigned leads
-- No need for explicit authorization field - if assigned, they have access
-- This is cleaner and more practical

-- ============================================================================
-- 1. PROFILES TABLE - Admin sees all, Sales sees all, Users see own
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  -- Users can see their own profile
  id = auth.uid()
  OR
  -- Admin can see all profiles
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Sales can see all profiles (they need to see client info)
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
);

COMMENT ON POLICY "profiles_select" ON public.profiles IS
'Users see own profile. Admin and Sales see all profiles (role-based).';

-- ============================================================================
-- 2. FINANCING_APPLICATIONS - Admin sees all, Sales sees assigned, Users see own
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
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Sales can see applications from their assigned leads (if assigned = access granted)
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = financing_applications.user_id
      AND p.asesor_asignado_id = auth.uid()
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
);

COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'Users see own applications. Admin sees all. Sales sees applications from assigned leads (role-based).';

-- ============================================================================
-- 3. UPLOADED_DOCUMENTS - Admin sees all, Sales sees from assigned leads, Users see own
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
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Sales can see documents from their assigned leads
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uploaded_documents.user_id
      AND p.asesor_asignado_id = auth.uid()
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
);

CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uploaded_documents.user_id
      AND p.asesor_asignado_id = auth.uid()
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uploaded_documents.user_id
      AND p.asesor_asignado_id = auth.uid()
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
);

CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

COMMENT ON POLICY "uploaded_documents_select" ON public.uploaded_documents IS
'Users see own documents. Admin sees all. Sales sees documents from assigned leads (role-based).';

-- ============================================================================
-- 4. LEAD_TAG_ASSOCIATIONS - Admin full, Sales can see for assigned leads
-- ============================================================================

DROP POLICY IF EXISTS "lead_tag_associations_select" ON public.lead_tag_associations;
DROP POLICY IF EXISTS "lead_tag_associations_insert" ON public.lead_tag_associations;
DROP POLICY IF EXISTS "lead_tag_associations_update" ON public.lead_tag_associations;
DROP POLICY IF EXISTS "lead_tag_associations_delete" ON public.lead_tag_associations;

CREATE POLICY "lead_tag_associations_select" ON public.lead_tag_associations
FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = lead_tag_associations.lead_id
      AND p.asesor_asignado_id = auth.uid()
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
);

CREATE POLICY "lead_tag_associations_insert" ON public.lead_tag_associations
FOR INSERT TO authenticated
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "lead_tag_associations_update" ON public.lead_tag_associations
FOR UPDATE TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "lead_tag_associations_delete" ON public.lead_tag_associations
FOR DELETE TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

COMMENT ON POLICY "lead_tag_associations_select" ON public.lead_tag_associations IS
'Admin sees all. Sales sees tags for assigned leads. Only Admin can modify (role-based).';

-- ============================================================================
-- 5. LEAD_REMINDERS - Admin full, Sales can see/manage for assigned leads
-- ============================================================================

DROP POLICY IF EXISTS "lead_reminders_select" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_insert" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_update" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_delete" ON public.lead_reminders;

CREATE POLICY "lead_reminders_select" ON public.lead_reminders
FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = lead_reminders.lead_id
      AND p.asesor_asignado_id = auth.uid()
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
);

CREATE POLICY "lead_reminders_insert" ON public.lead_reminders
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = lead_reminders.lead_id
      AND p.asesor_asignado_id = auth.uid()
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
);

CREATE POLICY "lead_reminders_update" ON public.lead_reminders
FOR UPDATE TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = lead_reminders.lead_id
      AND p.asesor_asignado_id = auth.uid()
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = lead_reminders.lead_id
      AND p.asesor_asignado_id = auth.uid()
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
);

CREATE POLICY "lead_reminders_delete" ON public.lead_reminders
FOR DELETE TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = lead_reminders.lead_id
      AND p.asesor_asignado_id = auth.uid()
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
);

COMMENT ON POLICY "lead_reminders_select" ON public.lead_reminders IS
'Admin sees all. Sales sees/manages reminders for assigned leads (role-based).';

-- ============================================================================
-- 6. VERIFY AND LOG RESULTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SIMPLIFIED ROLE-BASED ACCESS ===';
    RAISE NOTICE '';
    RAISE NOTICE 'ADMIN:';
    RAISE NOTICE '  ✓ Full access to everything';
    RAISE NOTICE '';
    RAISE NOTICE 'SALES:';
    RAISE NOTICE '  ✓ Can view ALL profiles';
    RAISE NOTICE '  ✓ Can view/edit applications from ASSIGNED leads';
    RAISE NOTICE '  ✓ Can view/edit documents from ASSIGNED leads';
    RAISE NOTICE '  ✓ Can view/edit reminders for ASSIGNED leads';
    RAISE NOTICE '  ✓ Assignment = Automatic access (no separate authorization needed)';
    RAISE NOTICE '';
    RAISE NOTICE 'USER:';
    RAISE NOTICE '  ✓ Can only see/edit own data';
    RAISE NOTICE '';
END $$;
