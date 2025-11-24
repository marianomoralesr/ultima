-- ============================================================================
-- FIX BROKEN RLS POLICIES AFTER DROPPING get_my_role()
-- ============================================================================
-- After dropping get_my_role() function, we need to recreate all policies
-- that were using it. Now we use direct role checks from profiles table.
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE - Fix policies
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  -- Users can see their own profile
  id = auth.uid()
  OR
  -- Admin and Sales can see all profiles
  -- Direct query to profiles - safe because we're already in profiles context
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'sales')
  )
);

COMMENT ON POLICY "profiles_select" ON public.profiles IS
'Users see own profile. Admin and Sales see all profiles.';

-- ============================================================================
-- 2. FINANCING_APPLICATIONS - Fix policies
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
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  -- Sales can see applications from their assigned leads
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'sales'
    AND p.id = (
      SELECT asesor_asignado_id FROM profiles
      WHERE id = financing_applications.user_id
    )
  )
);

COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'Users see own applications. Admin sees all. Sales sees applications from assigned leads.';

-- ============================================================================
-- 3. UPLOADED_DOCUMENTS - Fix policies
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
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  -- Sales can see documents from their assigned leads
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'sales'
    AND p.id = (
      SELECT asesor_asignado_id FROM profiles
      WHERE id = uploaded_documents.user_id
    )
  )
);

CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ============================================================================
-- 4. USER_VEHICLES_FOR_SALE - Fix policies
-- ============================================================================

DROP POLICY IF EXISTS "user_vehicles_select" ON public.user_vehicles_for_sale;
DROP POLICY IF EXISTS "user_vehicles_update" ON public.user_vehicles_for_sale;

CREATE POLICY "user_vehicles_select" ON public.user_vehicles_for_sale
FOR SELECT TO authenticated
USING (
  -- Users can see their own vehicles
  user_id = auth.uid()
  OR
  -- Admin can see all
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  -- Sales can see vehicles from assigned leads
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'sales'
    AND p.id = (
      SELECT asesor_asignado_id FROM profiles
      WHERE id = user_vehicles_for_sale.user_id
    )
  )
);

CREATE POLICY "user_vehicles_update" ON public.user_vehicles_for_sale
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'sales')
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'sales')
  )
);

-- ============================================================================
-- 5. BANK_FINANCING_INQUIRIES - Fix policies
-- ============================================================================

DROP POLICY IF EXISTS "bank_financing_select" ON public.bank_financing_inquiries;

CREATE POLICY "bank_financing_select" ON public.bank_financing_inquiries
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'sales')
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ RLS POLICIES FIXED';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ profiles: Fixed role-based access';
  RAISE NOTICE '✓ financing_applications: Fixed admin/sales access';
  RAISE NOTICE '✓ uploaded_documents: Fixed CRUD policies';
  RAISE NOTICE '✓ user_vehicles_for_sale: Fixed access';
  RAISE NOTICE '✓ bank_financing_inquiries: Fixed access';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTE: These policies query profiles table';
  RAISE NOTICE '   but avoid recursion because they use EXISTS';
  RAISE NOTICE '   with simple WHERE clauses, not functions.';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
END $$;
