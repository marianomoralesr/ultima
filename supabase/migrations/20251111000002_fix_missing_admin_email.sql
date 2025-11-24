-- Fix: Add missing moralesm04@gmail.com and autostrefa@gmail.com to admin emails list
-- These emails are referenced in code but were missing from RLS policies

-- ============================================================================
-- 1. UPDATE PROFILES TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;

CREATE POLICY "profiles_admin_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

COMMENT ON POLICY "profiles_admin_select" ON public.profiles IS
'Admin users can view all profiles using JWT-based check OR role check';

-- ============================================================================
-- 2. UPDATE FINANCING_APPLICATIONS TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "financing_apps_admin_select" ON public.financing_applications;

CREATE POLICY "financing_apps_admin_select"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

COMMENT ON POLICY "financing_apps_admin_select" ON public.financing_applications IS
'Admin can view all applications using JWT-based check OR role check';

-- ============================================================================
-- 3. UPDATE UPLOADED_DOCUMENTS TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "uploaded_documents_admin_select" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_delete" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_admin_select" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

COMMENT ON POLICY "uploaded_documents_admin_select" ON public.uploaded_documents IS
'Admin can view all documents using JWT-based check OR role check';

-- ============================================================================
-- 4. UPDATE STORAGE BUCKET POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "documents_admin_select" ON storage.objects;

CREATE POLICY "documents_admin_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND (
    auth.jwt()->>'email' IN (
      'moralesm04@gmail.com',
      'autostrefa@gmail.com',
      'marianomorales@outlook.com',
      'mariano.morales@autostrefa.mx',
      'genauservices@gmail.com',
      'alejandro.trevino@autostrefa.mx',
      'evelia.castillo@autostrefa.mx',
      'fernando.trevino@autostrefa.mx'
    ) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
);

-- ============================================================================
-- 5. UPDATE LEAD_TAGS TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "lead_tags_select" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_insert" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_update" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_delete" ON public.lead_tags;

CREATE POLICY "lead_tags_select" ON public.lead_tags
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "lead_tags_insert" ON public.lead_tags
FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "lead_tags_update" ON public.lead_tags
FOR UPDATE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "lead_tags_delete" ON public.lead_tags
FOR DELETE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- 6. UPDATE LEAD_TAG_ASSOCIATIONS TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "lead_tag_associations_select" ON public.lead_tag_associations;
DROP POLICY IF EXISTS "lead_tag_associations_insert" ON public.lead_tag_associations;
DROP POLICY IF EXISTS "lead_tag_associations_update" ON public.lead_tag_associations;
DROP POLICY IF EXISTS "lead_tag_associations_delete" ON public.lead_tag_associations;

CREATE POLICY "lead_tag_associations_select" ON public.lead_tag_associations
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "lead_tag_associations_insert" ON public.lead_tag_associations
FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "lead_tag_associations_update" ON public.lead_tag_associations
FOR UPDATE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "lead_tag_associations_delete" ON public.lead_tag_associations
FOR DELETE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- 7. UPDATE LEAD_REMINDERS TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "lead_reminders_select" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_insert" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_update" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_delete" ON public.lead_reminders;

CREATE POLICY "lead_reminders_select" ON public.lead_reminders
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "lead_reminders_insert" ON public.lead_reminders
FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "lead_reminders_update" ON public.lead_reminders
FOR UPDATE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "lead_reminders_delete" ON public.lead_reminders
FOR DELETE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'moralesm04@gmail.com',
    'autostrefa@gmail.com',
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- 8. VERIFY AND LOG RESULTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ADMIN EMAILS UPDATED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Added missing admin emails:';
    RAISE NOTICE '  • moralesm04@gmail.com (ADDED)';
    RAISE NOTICE '  • autostrefa@gmail.com (ADDED)';
    RAISE NOTICE '';
    RAISE NOTICE 'All admin emails with JWT-based privileges:';
    RAISE NOTICE '  1. moralesm04@gmail.com';
    RAISE NOTICE '  2. autostrefa@gmail.com';
    RAISE NOTICE '  3. marianomorales@outlook.com';
    RAISE NOTICE '  4. mariano.morales@autostrefa.mx';
    RAISE NOTICE '  5. genauservices@gmail.com';
    RAISE NOTICE '  6. alejandro.trevino@autostrefa.mx';
    RAISE NOTICE '  7. evelia.castillo@autostrefa.mx';
    RAISE NOTICE '  8. fernando.trevino@autostrefa.mx';
    RAISE NOTICE '';
    RAISE NOTICE 'Also added fallback: Users with role=admin in profiles table';
    RAISE NOTICE '';
END $$;
