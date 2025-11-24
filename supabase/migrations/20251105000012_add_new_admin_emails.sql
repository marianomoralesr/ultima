-- Add new admin emails to JWT verification for admin privileges
-- Adding: alejandro.trevino@autostrefa.mx, evelia.castillo@autostrefa.mx, fernando.trevino@autostrefa.mx

-- ============================================================================
-- 1. UPDATE PROFILES TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;

CREATE POLICY "profiles_admin_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

COMMENT ON POLICY "profiles_admin_select" ON public.profiles IS
'Admin users can view all profiles using JWT-based check';

-- ============================================================================
-- 2. UPDATE FINANCING_APPLICATIONS TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "financing_apps_admin_select" ON public.financing_applications;

CREATE POLICY "financing_apps_admin_select"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

COMMENT ON POLICY "financing_apps_admin_select" ON public.financing_applications IS
'Admin can view all applications using JWT-based check';

-- ============================================================================
-- 3. UPDATE UPLOADED_DOCUMENTS TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "uploaded_documents_admin_select" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_delete" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_admin_select" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

COMMENT ON POLICY "uploaded_documents_admin_select" ON public.uploaded_documents IS
'Admin can view all documents using JWT-based check';

-- ============================================================================
-- 4. UPDATE STORAGE BUCKET POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "documents_admin_select" ON storage.objects;

CREATE POLICY "documents_admin_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
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
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "lead_tags_insert" ON public.lead_tags
FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "lead_tags_update" ON public.lead_tags
FOR UPDATE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
)
WITH CHECK (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "lead_tags_delete" ON public.lead_tags
FOR DELETE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
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
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "lead_tag_associations_insert" ON public.lead_tag_associations
FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "lead_tag_associations_update" ON public.lead_tag_associations
FOR UPDATE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
)
WITH CHECK (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "lead_tag_associations_delete" ON public.lead_tag_associations
FOR DELETE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
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
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "lead_reminders_insert" ON public.lead_reminders
FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "lead_reminders_update" ON public.lead_reminders
FOR UPDATE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
)
WITH CHECK (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "lead_reminders_delete" ON public.lead_reminders
FOR DELETE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

-- ============================================================================
-- 8. VERIFY AND LOG RESULTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== NEW ADMIN EMAILS ADDED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin emails with JWT-based privileges:';
    RAISE NOTICE '  1. marianomorales@outlook.com';
    RAISE NOTICE '  2. mariano.morales@autostrefa.mx';
    RAISE NOTICE '  3. genauservices@gmail.com';
    RAISE NOTICE '  4. alejandro.trevino@autostrefa.mx (NEW)';
    RAISE NOTICE '  5. evelia.castillo@autostrefa.mx (NEW)';
    RAISE NOTICE '  6. fernando.trevino@autostrefa.mx (NEW)';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated tables/policies:';
    RAISE NOTICE '  ✓ profiles table';
    RAISE NOTICE '  ✓ financing_applications table';
    RAISE NOTICE '  ✓ uploaded_documents table';
    RAISE NOTICE '  ✓ storage.objects (documents bucket)';
    RAISE NOTICE '  ✓ lead_tags table';
    RAISE NOTICE '  ✓ lead_tag_associations table';
    RAISE NOTICE '  ✓ lead_reminders table';
    RAISE NOTICE '';
    RAISE NOTICE 'These users now have full admin access via JWT verification!';
END $$;
