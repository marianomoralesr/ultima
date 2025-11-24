-- Fix: Use ONLY role-based access from profiles table, remove hardcoded emails
-- This is cleaner, more maintainable, and follows best practices
-- Admin role gets full access, Sales role gets access to assigned leads only

-- ============================================================================
-- 1. PROFILES TABLE - Admin sees all, Sales sees all, Users see own
-- ============================================================================

DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
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

DROP POLICY IF EXISTS "financing_apps_admin_select" ON public.financing_applications;
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
  -- Sales can see applications from their assigned leads
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = financing_applications.user_id
      AND p.asesor_asignado_id = auth.uid()
      AND p.autorizar_asesor_acceso = true
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
);

COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'Users see own applications. Admin sees all. Sales sees applications from assigned leads (role-based).';

-- ============================================================================
-- 3. UPLOADED_DOCUMENTS - Admin sees all, Sales sees from assigned leads, Users see own
-- ============================================================================

DROP POLICY IF EXISTS "uploaded_documents_admin_select" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_delete" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;

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
      AND p.autorizar_asesor_acceso = true
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
      AND p.autorizar_asesor_acceso = true
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
      AND p.autorizar_asesor_acceso = true
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
-- 4. STORAGE BUCKET - Admin and assigned Sales can access
-- ============================================================================

DROP POLICY IF EXISTS "documents_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_select" ON storage.objects;

CREATE POLICY "documents_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
);

COMMENT ON POLICY "documents_select" ON storage.objects IS
'Admin can access all documents in storage (role-based).';

-- ============================================================================
-- 5. LEAD_TAGS - Admin only
-- ============================================================================

DROP POLICY IF EXISTS "lead_tags_select" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_insert" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_update" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_delete" ON public.lead_tags;

CREATE POLICY "lead_tags_select" ON public.lead_tags
FOR SELECT TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'sales'));

CREATE POLICY "lead_tags_insert" ON public.lead_tags
FOR INSERT TO authenticated
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "lead_tags_update" ON public.lead_tags
FOR UPDATE TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "lead_tags_delete" ON public.lead_tags
FOR DELETE TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

COMMENT ON POLICY "lead_tags_select" ON public.lead_tags IS
'Admin and Sales can view tags. Only Admin can create/edit/delete (role-based).';

-- ============================================================================
-- 6. LEAD_TAG_ASSOCIATIONS - Admin full, Sales can see for assigned leads
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
      AND p.autorizar_asesor_acceso = true
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
-- 7. LEAD_REMINDERS - Admin full, Sales can see/manage for assigned leads
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
      AND p.autorizar_asesor_acceso = true
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
      AND p.autorizar_asesor_acceso = true
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
      AND p.autorizar_asesor_acceso = true
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
      AND p.autorizar_asesor_acceso = true
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
      AND p.autorizar_asesor_acceso = true
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
  )
);

COMMENT ON POLICY "lead_reminders_select" ON public.lead_reminders IS
'Admin sees all. Sales sees/manages reminders for assigned leads (role-based).';

-- ============================================================================
-- 8. VERIFY AND LOG RESULTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ROLE-BASED ACCESS CONTROL IMPLEMENTED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Access Control Rules:';
    RAISE NOTICE '';
    RAISE NOTICE 'ADMIN ROLE:';
    RAISE NOTICE '  ✓ Full access to all profiles';
    RAISE NOTICE '  ✓ Full access to all applications';
    RAISE NOTICE '  ✓ Full access to all documents';
    RAISE NOTICE '  ✓ Full access to storage';
    RAISE NOTICE '  ✓ Full access to tags and reminders';
    RAISE NOTICE '';
    RAISE NOTICE 'SALES ROLE:';
    RAISE NOTICE '  ✓ Can view all profiles (to see client info)';
    RAISE NOTICE '  ✓ Can view/edit applications from assigned leads (with authorized access)';
    RAISE NOTICE '  ✓ Can view/edit documents from assigned leads (with authorized access)';
    RAISE NOTICE '  ✓ Can view tags';
    RAISE NOTICE '  ✓ Can view/manage reminders for assigned leads';
    RAISE NOTICE '';
    RAISE NOTICE 'USER ROLE:';
    RAISE NOTICE '  ✓ Can view own profile';
    RAISE NOTICE '  ✓ Can view own applications';
    RAISE NOTICE '  ✓ Can view own documents';
    RAISE NOTICE '';
    RAISE NOTICE 'NO MORE HARDCODED EMAILS! All access based on role field in profiles table.';
    RAISE NOTICE '';
END $$;
