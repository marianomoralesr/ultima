-- ============================================================================
-- FIX RLS POLICIES USING JWT CLAIMS - NO DATABASE QUERIES = NO RECURSION
-- ============================================================================
-- IMPORTANT: This migration fixes policies WITHOUT causing infinite recursion
-- because it reads the role from JWT claims (in memory), not from database.
--
-- WHY THIS IS SAFE:
-- 1. current_setting('request.jwt.claims') reads from JWT token (already decoded)
-- 2. NO database queries happen when checking role
-- 3. NO recursion is possible because we don't touch profiles table
-- 4. JWT is set by Supabase Auth when user logs in
-- ============================================================================

-- ============================================================================
-- STEP 1: Create a SAFE helper function that reads JWT (not database)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER  -- NOT SECURITY DEFINER - we don't need to bypass RLS
AS $$
DECLARE
  jwt_claims json;
  user_role text;
BEGIN
  -- Get JWT claims (this is in-memory, NO database query)
  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true)::json;
  EXCEPTION WHEN OTHERS THEN
    -- If no JWT (shouldn't happen for authenticated users), default to 'user'
    RETURN 'user';
  END;

  -- Extract role from JWT claims
  user_role := jwt_claims->>'role';

  -- If role is not in JWT, default to 'user'
  IF user_role IS NULL OR user_role = '' THEN
    RETURN 'user';
  END IF;

  RETURN user_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

COMMENT ON FUNCTION public.get_current_user_role() IS
'Returns role from JWT claims. SAFE - no database queries, no recursion possible.';

-- ============================================================================
-- STEP 2: PROFILES TABLE - Use JWT-based function
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  -- Users can see their own profile
  id = auth.uid()
  OR
  -- Admin can see all profiles (reads from JWT, not database)
  get_current_user_role() = 'admin'
  OR
  -- Sales can see all profiles (reads from JWT, not database)
  get_current_user_role() = 'sales'
);

COMMENT ON POLICY "profiles_select" ON public.profiles IS
'Users see own profile. Admin and Sales see all profiles (role from JWT claims).';

-- ============================================================================
-- STEP 3: FINANCING_APPLICATIONS - Use JWT-based function
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
  get_current_user_role() = 'admin'
  OR
  -- Sales can see applications from their assigned leads
  (
    get_current_user_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'Users see own applications. Admin sees all. Sales sees applications from assigned leads.';

-- ============================================================================
-- STEP 4: UPLOADED_DOCUMENTS - Use JWT-based function
-- ============================================================================

DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_delete" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  get_current_user_role() = 'admin'
  OR
  (
    get_current_user_role() = 'sales'
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
  get_current_user_role() = 'admin'
)
WITH CHECK (
  user_id = auth.uid()
  OR
  get_current_user_role() = 'admin'
);

CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR
  get_current_user_role() = 'admin'
);

-- ============================================================================
-- STEP 5: USER_VEHICLES_FOR_SALE - Use JWT-based function
-- ============================================================================

DROP POLICY IF EXISTS "user_vehicles_select" ON public.user_vehicles_for_sale;
DROP POLICY IF EXISTS "user_vehicles_update" ON public.user_vehicles_for_sale;

CREATE POLICY "user_vehicles_select" ON public.user_vehicles_for_sale
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  get_current_user_role() = 'admin'
  OR
  (
    get_current_user_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_vehicles_for_sale.user_id
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

CREATE POLICY "user_vehicles_update" ON public.user_vehicles_for_sale
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR
  get_current_user_role() IN ('admin', 'sales')
)
WITH CHECK (
  user_id = auth.uid()
  OR
  get_current_user_role() IN ('admin', 'sales')
);

-- ============================================================================
-- STEP 6: BANK_FINANCING_INQUIRIES - Use JWT-based function
-- ============================================================================

DROP POLICY IF EXISTS "bank_financing_select" ON public.bank_financing_inquiries;

CREATE POLICY "bank_financing_select" ON public.bank_financing_inquiries
FOR SELECT TO authenticated
USING (
  get_current_user_role() IN ('admin', 'sales')
);

-- ============================================================================
-- STEP 7: PROFILES UPDATE/INSERT POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR
  get_current_user_role() = 'admin'
)
WITH CHECK (
  id = auth.uid()
  OR
  get_current_user_role() = 'admin'
);

CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  id = auth.uid()
);

-- ============================================================================
-- IMPORTANT: Set role in JWT when user logs in
-- ============================================================================
-- Note: This assumes your Auth flow sets a 'role' claim in the JWT.
-- If not, you need to add a hook or edge function to set it.
--
-- Example custom claim in Supabase Auth:
-- {
--   "sub": "user-uuid",
--   "email": "user@example.com",
--   "role": "admin"  <-- This is what we read
-- }
-- ============================================================================

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  test_role text;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ RLS POLICIES FIXED (JWT-BASED)';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Created get_current_user_role() - reads JWT, no DB queries';
  RAISE NOTICE '✓ profiles: Fixed role-based access';
  RAISE NOTICE '✓ financing_applications: Fixed admin/sales access';
  RAISE NOTICE '✓ uploaded_documents: Fixed CRUD policies';
  RAISE NOTICE '✓ user_vehicles_for_sale: Fixed access';
  RAISE NOTICE '✓ bank_financing_inquiries: Fixed access';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  CRITICAL: Role must be in JWT claims!';
  RAISE NOTICE '   Your auth flow must set role claim in JWT.';
  RAISE NOTICE '   If not set, users will default to "user" role.';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Test your role:';
  RAISE NOTICE '   SELECT get_current_user_role();';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';

  -- Try to get current role (will work if there's an active session)
  BEGIN
    test_role := get_current_user_role();
    RAISE NOTICE 'Current session role: %', test_role;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No active session (normal for migration context)';
  END;
END $$;
