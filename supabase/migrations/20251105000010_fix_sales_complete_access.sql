-- COMPREHENSIVE FIX: Sales role access to leads, financing_applications, uploaded_documents table, and storage bucket
-- This migration ensures sales users can access all data for their assigned leads

-- ============================================================================
-- 1. FIX PROFILES TABLE RLS - Allow sales to view their assigned leads
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_sales_assigned_leads" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Sales can view profiles of leads assigned to them where asesor_autorizado_acceso is true
CREATE POLICY "profiles_sales_assigned_leads" ON public.profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles sales
    WHERE sales.id = auth.uid()
      AND sales.role = 'sales'
      AND profiles.asesor_asignado_id = auth.uid()
      AND COALESCE(profiles.asesor_autorizado_acceso, false) = true
  )
);

-- Admin can view all profiles (using JWT to avoid recursion)
CREATE POLICY "profiles_admin_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

COMMENT ON POLICY "profiles_select_own" ON public.profiles IS
'Users can view their own profile';

COMMENT ON POLICY "profiles_sales_assigned_leads" ON public.profiles IS
'Sales can view profiles of leads assigned to them where asesor_autorizado_acceso is true';

COMMENT ON POLICY "profiles_admin_select" ON public.profiles IS
'Admin users can view all profiles';

-- ============================================================================
-- 2. FIX FINANCING_APPLICATIONS TABLE RLS - Allow sales to view applications from their assigned leads
-- ============================================================================

-- Drop all existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'financing_applications' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.financing_applications CASCADE';
    END LOOP;
END $$;

-- Allow authenticated users to insert (trigger sets user_id)
CREATE POLICY "financing_apps_insert"
ON public.financing_applications
FOR INSERT TO authenticated
WITH CHECK (true);

-- Users can see their own applications
CREATE POLICY "financing_apps_select_own"
ON public.financing_applications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Sales can see applications from their assigned leads where asesor_autorizado_acceso is true
CREATE POLICY "financing_apps_sales_assigned"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = financing_applications.user_id
      AND p.asesor_asignado_id = auth.uid()
      AND COALESCE(p.asesor_autorizado_acceso, false) = true
      AND EXISTS (
        SELECT 1 FROM public.profiles sales
        WHERE sales.id = auth.uid() AND sales.role = 'sales'
      )
  )
);

-- Admin can see all applications (using JWT to avoid recursion)
CREATE POLICY "financing_apps_admin_select"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

-- Users can update their own applications
CREATE POLICY "financing_apps_update"
ON public.financing_applications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own draft applications
CREATE POLICY "financing_apps_delete"
ON public.financing_applications
FOR DELETE TO authenticated
USING (user_id = auth.uid() AND status = 'draft');

COMMENT ON POLICY "financing_apps_insert" ON public.financing_applications IS
'Allow authenticated users to insert. Trigger automatically sets user_id from auth.uid()';

COMMENT ON POLICY "financing_apps_select_own" ON public.financing_applications IS
'Users see their own applications';

COMMENT ON POLICY "financing_apps_sales_assigned" ON public.financing_applications IS
'Sales can view applications from leads assigned to them where asesor_autorizado_acceso is true';

COMMENT ON POLICY "financing_apps_admin_select" ON public.financing_applications IS
'Admin can view all applications';

-- ============================================================================
-- 3. FIX UPLOADED_DOCUMENTS TABLE RLS - Allow sales to view documents from their assigned leads
-- ============================================================================

DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_insert" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_delete" ON public.uploaded_documents;

-- Users can view their own documents
CREATE POLICY "uploaded_documents_select_own" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Sales can view documents from their assigned leads where asesor_autorizado_acceso is true
CREATE POLICY "uploaded_documents_sales_assigned" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uploaded_documents.user_id
      AND p.asesor_asignado_id = auth.uid()
      AND COALESCE(p.asesor_autorizado_acceso, false) = true
      AND EXISTS (
        SELECT 1 FROM public.profiles sales
        WHERE sales.id = auth.uid() AND sales.role = 'sales'
      )
  )
);

-- Admin can view all documents (using JWT to avoid recursion)
CREATE POLICY "uploaded_documents_admin_select" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

-- Users can insert their own documents
CREATE POLICY "uploaded_documents_insert" ON public.uploaded_documents
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own documents
-- Sales can update documents from their assigned leads
-- Admin can update all documents
CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uploaded_documents.user_id
      AND p.asesor_asignado_id = auth.uid()
      AND COALESCE(p.asesor_autorizado_acceso, false) = true
      AND EXISTS (
        SELECT 1 FROM public.profiles sales
        WHERE sales.id = auth.uid() AND sales.role = 'sales'
      )
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uploaded_documents.user_id
      AND p.asesor_asignado_id = auth.uid()
      AND COALESCE(p.asesor_autorizado_acceso, false) = true
      AND EXISTS (
        SELECT 1 FROM public.profiles sales
        WHERE sales.id = auth.uid() AND sales.role = 'sales'
      )
  )
);

-- Users can delete their own documents
-- Admin can delete all documents
CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

COMMENT ON POLICY "uploaded_documents_select_own" ON public.uploaded_documents IS
'Users can view their own documents';

COMMENT ON POLICY "uploaded_documents_sales_assigned" ON public.uploaded_documents IS
'Sales can view documents from leads assigned to them where asesor_autorizado_acceso is true';

COMMENT ON POLICY "uploaded_documents_admin_select" ON public.uploaded_documents IS
'Admin can view all documents';

-- ============================================================================
-- 4. FIX STORAGE BUCKET POLICIES - Allow sales to access files from their assigned leads
-- ============================================================================

-- Drop existing storage policies for documents bucket
DROP POLICY IF EXISTS "Users can manage their own application documents." ON storage.objects;
DROP POLICY IF EXISTS "Admins and sales staff can view all documents." ON storage.objects;
DROP POLICY IF EXISTS "documents_select_own" ON storage.objects;
DROP POLICY IF EXISTS "documents_sales_assigned" ON storage.objects;
DROP POLICY IF EXISTS "documents_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete" ON storage.objects;

-- Users can view their own files in documents bucket
CREATE POLICY "documents_select_own" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Sales can view files from their assigned leads where asesor_autorizado_acceso is true
CREATE POLICY "documents_sales_assigned" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.asesor_asignado_id = auth.uid()
      AND COALESCE(p.asesor_autorizado_acceso, false) = true
      AND EXISTS (
        SELECT 1 FROM public.profiles sales
        WHERE sales.id = auth.uid() AND sales.role = 'sales'
      )
  )
);

-- Admin can view all documents in bucket (using JWT to avoid recursion)
CREATE POLICY "documents_admin_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

-- Users can insert their own files
CREATE POLICY "documents_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own files
CREATE POLICY "documents_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
CREATE POLICY "documents_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- 5. VERIFY AND LOG RESULTS
-- ============================================================================

DO $$
DECLARE
    sales_count INT;
    admin_count INT;
    leads_with_sales INT;
BEGIN
    SELECT COUNT(*) INTO sales_count FROM public.profiles WHERE role = 'sales';
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    SELECT COUNT(*) INTO leads_with_sales
    FROM public.profiles
    WHERE asesor_asignado_id IS NOT NULL
      AND COALESCE(asesor_autorizado_acceso, false) = true;

    RAISE NOTICE '';
    RAISE NOTICE '=== SALES ACCESS FIX APPLIED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Database Statistics:';
    RAISE NOTICE '  - Admin users: %', admin_count;
    RAISE NOTICE '  - Sales users: %', sales_count;
    RAISE NOTICE '  - Leads with sales assigned (authorized): %', leads_with_sales;
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed Tables & Policies:';
    RAISE NOTICE '  ✓ profiles table - Sales can view assigned leads';
    RAISE NOTICE '  ✓ financing_applications table - Sales can view applications from assigned leads';
    RAISE NOTICE '  ✓ uploaded_documents table - Sales can view documents from assigned leads';
    RAISE NOTICE '  ✓ storage.objects (documents bucket) - Sales can access files from assigned leads';
    RAISE NOTICE '';
    RAISE NOTICE 'All policies check for:';
    RAISE NOTICE '  - asesor_asignado_id matches auth.uid()';
    RAISE NOTICE '  - asesor_autorizado_acceso is true';
    RAISE NOTICE '  - User role is "sales"';
    RAISE NOTICE '';
    RAISE NOTICE 'If sales users still cannot access:';
    RAISE NOTICE '  1. Verify sales user has role="sales" in profiles table';
    RAISE NOTICE '  2. Verify leads have asesor_asignado_id set to sales user ID';
    RAISE NOTICE '  3. Verify leads have asesor_autorizado_acceso=true';
    RAISE NOTICE '  4. Ask users to log out and log back in';
    RAISE NOTICE '  5. Clear browser cache/localStorage';
    RAISE NOTICE '  6. Check browser console for errors';
END $$;
