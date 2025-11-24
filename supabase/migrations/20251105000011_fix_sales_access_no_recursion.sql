-- FIX RECURSION: Sales role access WITHOUT infinite recursion
-- The previous migration caused recursion by querying profiles table within profiles RLS policies
-- This version uses JWT-based checks and helper functions to avoid recursion

-- ============================================================================
-- 1. CREATE HELPER FUNCTION TO CHECK SALES ROLE (uses JWT, no recursion)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_sales_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user has sales role using SECURITY DEFINER to bypass RLS
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'sales'
    );
END;
$$;

COMMENT ON FUNCTION public.is_sales_user() IS
'Returns true if current user has sales role. Uses SECURITY DEFINER to bypass RLS and avoid recursion.';

-- ============================================================================
-- 2. FIX PROFILES TABLE RLS - NO RECURSION
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_sales_assigned_leads" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

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

COMMENT ON POLICY "profiles_admin_select" ON public.profiles IS
'Admin users can view all profiles using JWT-based check';

-- ============================================================================
-- 3. FIX FINANCING_APPLICATIONS TABLE RLS - NO RECURSION
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

COMMENT ON POLICY "financing_apps_admin_select" ON public.financing_applications IS
'Admin can view all applications using JWT-based check';

-- ============================================================================
-- 4. FIX UPLOADED_DOCUMENTS TABLE RLS - NO RECURSION
-- ============================================================================

DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_insert" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_delete" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_select_own" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_sales_assigned" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_admin_select" ON public.uploaded_documents;

-- Users can view their own documents
CREATE POLICY "uploaded_documents_select_own" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (user_id = auth.uid());

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
-- Admin can update all documents
CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
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

COMMENT ON POLICY "uploaded_documents_admin_select" ON public.uploaded_documents IS
'Admin can view all documents using JWT-based check';

-- ============================================================================
-- 5. FIX STORAGE BUCKET POLICIES - NO RECURSION
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
-- 6. UPDATE SECURITY DEFINER FUNCTIONS FOR SALES ACCESS
-- ============================================================================

-- Sales users will access data through SECURITY DEFINER functions
-- These functions bypass RLS and implement their own access checks

-- Function to get client profile for sales (already exists, just ensure it's correct)
CREATE OR REPLACE FUNCTION public.get_sales_client_profile(client_id uuid, sales_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    has_access boolean;
BEGIN
    -- Check if sales user has access to this client (bypasses RLS)
    SELECT
        (p.asesor_asignado_id = sales_user_id AND COALESCE(p.asesor_autorizado_acceso, false) = true)
    INTO has_access
    FROM public.profiles p
    WHERE p.id = client_id;

    -- If no access, return null
    IF NOT COALESCE(has_access, false) THEN
        RETURN NULL;
    END IF;

    -- Build result with profile and related data (bypasses RLS)
    SELECT jsonb_build_object(
        'profile', to_jsonb(p.*) || jsonb_build_object(
            'asesor_asignado_name', COALESCE(
                asesor.first_name || ' ' || asesor.last_name,
                'Sin asignar'
            )
        ),
        'applications', COALESCE(
            (SELECT jsonb_agg(to_jsonb(fa.*) ORDER BY fa.created_at DESC)
             FROM public.financing_applications fa
             WHERE fa.user_id = client_id),
            '[]'::jsonb
        ),
        'tags', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', lta.tag_id,
                'tag_name', lt.tag_name,
                'color', lt.color
            ))
             FROM public.lead_tag_associations lta
             JOIN public.lead_tags lt ON lt.id = lta.tag_id
             WHERE lta.lead_id = client_id),
            '[]'::jsonb
        ),
        'reminders', COALESCE(
            (SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.reminder_date ASC)
             FROM public.lead_reminders r
             WHERE r.lead_id = client_id),
            '[]'::jsonb
        ),
        'documents', COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*) ORDER BY d.created_at DESC)
             FROM public.uploaded_documents d
             WHERE d.user_id = client_id),
            '[]'::jsonb
        )
    ) INTO result
    FROM public.profiles p
    LEFT JOIN public.profiles asesor ON p.asesor_asignado_id = asesor.id
    WHERE p.id = client_id;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sales_client_profile(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.get_sales_client_profile(uuid, uuid) IS
'Returns complete client profile if sales user has authorized access. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================================
-- 7. VERIFY AND LOG RESULTS
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
    RAISE NOTICE '=== SALES ACCESS FIX (NO RECURSION) APPLIED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Database Statistics:';
    RAISE NOTICE '  - Admin users: %', admin_count;
    RAISE NOTICE '  - Sales users: %', sales_count;
    RAISE NOTICE '  - Leads with sales assigned (authorized): %', leads_with_sales;
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed Policies (NO RECURSION):';
    RAISE NOTICE '  ✓ profiles table - Admin only (JWT-based)';
    RAISE NOTICE '  ✓ financing_applications table - Admin only (JWT-based)';
    RAISE NOTICE '  ✓ uploaded_documents table - Admin only (JWT-based)';
    RAISE NOTICE '  ✓ storage.objects (documents bucket) - Admin only (JWT-based)';
    RAISE NOTICE '';
    RAISE NOTICE 'Sales Access Method:';
    RAISE NOTICE '  ✓ Sales users access data through SECURITY DEFINER functions';
    RAISE NOTICE '  ✓ Functions: get_sales_client_profile(), get_sales_assigned_leads()';
    RAISE NOTICE '  ✓ These functions bypass RLS and implement custom access checks';
    RAISE NOTICE '';
    RAISE NOTICE 'Key Points:';
    RAISE NOTICE '  - RLS policies do NOT query profiles table (no recursion)';
    RAISE NOTICE '  - Admin access uses JWT email check only';
    RAISE NOTICE '  - Sales access goes through SECURITY DEFINER functions';
    RAISE NOTICE '  - Functions check asesor_asignado_id and asesor_autorizado_acceso';
END $$;
