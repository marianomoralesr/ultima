-- ============================================================================
-- COMPREHENSIVE UPDATE: Fix all admin email checks in RLS policies
-- This migration updates ALL policies that use JWT email checks to include
-- the complete list of TREFA admin users
-- ============================================================================

-- Complete list of authorized admin emails
-- marianomorales@outlook.com
-- mariano.morales@autostrefa.mx
-- evelia.castillo@autostrefa.mx
-- alejandro.trevino@autostrefa.mx
-- fernando.trevino@autostrefa.mx
-- alejandro.gallardo@autostrefa.mx
-- lizeth.juarez@autostrefa.mx

-- ============================================================================
-- 1. UPDATE PROFILES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;

CREATE POLICY "profiles_admin_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx'
  )
);

COMMENT ON POLICY "profiles_admin_select" ON public.profiles IS
'Admin users can view all profiles using JWT-based check (no recursion)';

-- ============================================================================
-- 2. UPDATE FINANCING_APPLICATIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "financing_apps_admin_select" ON public.financing_applications;

CREATE POLICY "financing_apps_admin_select"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx'
  )
);

COMMENT ON POLICY "financing_apps_admin_select" ON public.financing_applications IS
'Admin can view all applications using JWT-based check (no recursion)';

-- ============================================================================
-- 3. UPDATE UPLOADED_DOCUMENTS TABLE POLICIES
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
    'evelia.castillo@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx'
  )
);

CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx'
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx'
  )
);

CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx'
  )
);

COMMENT ON POLICY "uploaded_documents_admin_select" ON public.uploaded_documents IS
'Admin can view all documents using JWT-based check (no recursion)';

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
    'evelia.castillo@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx'
  )
);

COMMENT ON POLICY "documents_admin_select" ON storage.objects IS
'Admin can view all documents in storage using JWT-based check (no recursion)';

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

DO $$
DECLARE
    admin_count INT;
    policy_count INT;
BEGIN
    -- Count admin users
    SELECT COUNT(*) INTO admin_count
    FROM public.profiles
    WHERE role = 'admin';

    -- Count policies with email checks
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE definition LIKE '%mariano.morales@autostrefa.mx%'
    OR definition LIKE '%marianomorales@outlook.com%';

    RAISE NOTICE '';
    RAISE NOTICE '=== ADMIN EMAIL UPDATE COMPLETED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin users in database: %', admin_count;
    RAISE NOTICE 'Policies using JWT email checks: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Updated admin email list includes:';
    RAISE NOTICE '  ✓ marianomorales@outlook.com';
    RAISE NOTICE '  ✓ mariano.morales@autostrefa.mx';
    RAISE NOTICE '  ✓ evelia.castillo@autostrefa.mx';
    RAISE NOTICE '  ✓ alejandro.trevino@autostrefa.mx';
    RAISE NOTICE '  ✓ fernando.trevino@autostrefa.mx';
    RAISE NOTICE '  ✓ alejandro.gallardo@autostrefa.mx';
    RAISE NOTICE '  ✓ lizeth.juarez@autostrefa.mx';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: This uses JWT-based checks to avoid infinite recursion';
END $$;
