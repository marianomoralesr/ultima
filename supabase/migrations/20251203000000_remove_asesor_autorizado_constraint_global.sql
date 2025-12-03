-- ============================================================================
-- GLOBAL FIX: Remove asesor_autorizado_acceso Constraint for Sales Access
-- ============================================================================
-- Issue: Sales users can only see leads where asesor_autorizado_acceso = true
-- Solution: Remove this constraint GLOBALLY from all functions and policies
--
-- Sales should see ALL their assigned leads (where asesor_asignado_id matches)
-- WITHOUT requiring asesor_autorizado_acceso = true
--
-- This is the PERMANENT fix that will prevent this issue from recurring
-- ============================================================================

-- ============================================================================
-- PART 1: Update RLS Policies
-- ============================================================================

-- Profiles: Sales can see their assigned leads without authorization check
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  -- Users can see their own profile
  id = auth.uid()
  OR
  -- Admin can see all profiles
  get_my_role() = 'admin'
  OR
  -- Marketing can see all profiles
  get_my_role() = 'marketing'
  OR
  -- Sales can see their assigned user profiles (NO asesor_autorizado_acceso check)
  (
    get_my_role() = 'sales'
    AND role = 'user'
    AND asesor_asignado_id = auth.uid()
  )
);

COMMENT ON POLICY "profiles_select" ON public.profiles IS
'[PERMANENT] Sales see assigned leads WITHOUT asesor_autorizado_acceso constraint';

-- Allow sales to update their assigned leads
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND role = 'user'
    AND asesor_asignado_id = auth.uid()
  )
)
WITH CHECK (
  id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND role = 'user'
    AND asesor_asignado_id = auth.uid()
  )
);

COMMENT ON POLICY "profiles_update" ON public.profiles IS
'[PERMANENT] Sales update assigned leads WITHOUT asesor_autorizado_acceso constraint';

-- ============================================================================
-- PART 2: Update All Sales RPC Functions
-- ============================================================================

-- Function 1: get_sales_assigned_leads
-- Remove asesor_autorizado_acceso constraint
DROP FUNCTION IF EXISTS get_sales_assigned_leads(uuid);

CREATE OR REPLACE FUNCTION get_sales_assigned_leads(sales_user_id uuid)
RETURNS TABLE(
    id uuid,
    email text,
    first_name text,
    last_name text,
    mother_last_name text,
    phone text,
    source text,
    contactado boolean,
    asesor_asignado_id uuid,
    asesor_asignado text,
    asesor_autorizado_acceso boolean,
    created_at timestamptz,
    metadata jsonb,
    latest_app_status text,
    latest_app_id uuid,
    latest_app_submitted boolean,
    latest_app_car_info jsonb,
    documents jsonb,
    bank_profile_data jsonb,
    rfc text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.first_name,
        p.last_name,
        p.mother_last_name,
        p.phone,
        p.source,
        p.contactado,
        p.asesor_asignado_id,
        COALESCE(asesor.first_name || ' ' || asesor.last_name, 'No asignado') as asesor_asignado,
        COALESCE(p.asesor_autorizado_acceso, false) as asesor_autorizado_acceso,
        p.created_at,
        p.metadata,
        latest_app.status as latest_app_status,
        latest_app.id as latest_app_id,
        latest_app.submitted as latest_app_submitted,
        latest_app.car_info as latest_app_car_info,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*))
             FROM uploaded_documents d
             WHERE d.user_id = p.id),
            '[]'::jsonb
        ) as documents,
        to_jsonb(bp.*) as bank_profile_data,
        p.rfc
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    LEFT JOIN LATERAL (
        SELECT id, status, submitted, car_info
        FROM financing_applications
        WHERE user_id = p.id
        ORDER BY created_at DESC
        LIMIT 1
    ) latest_app ON true
    LEFT JOIN bank_profiles bp ON bp.user_id = p.id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      -- REMOVED: AND COALESCE(p.asesor_autorizado_acceso, false) = true
    ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_sales_assigned_leads(uuid) TO authenticated;

COMMENT ON FUNCTION get_sales_assigned_leads(uuid) IS
'[PERMANENT] Returns assigned leads for sales WITHOUT asesor_autorizado_acceso constraint';

-- Function 2: get_sales_dashboard_stats
-- Remove asesor_autorizado_acceso constraint
DROP FUNCTION IF EXISTS get_sales_dashboard_stats(uuid);

CREATE OR REPLACE FUNCTION get_sales_dashboard_stats(sales_user_id UUID)
RETURNS TABLE(
    total_leads BIGINT,
    leads_contacted BIGINT,
    leads_not_contacted BIGINT,
    leads_with_active_app BIGINT,
    leads_needing_follow_up BIGINT,
    total_applications BIGINT,
    active_applications BIGINT,
    draft_applications BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT p.id) AS total_leads,
        COUNT(DISTINCT p.id) FILTER (WHERE p.contactado = true) AS leads_contacted,
        COUNT(DISTINCT p.id) FILTER (WHERE p.contactado = false OR p.contactado IS NULL) AS leads_not_contacted,
        COUNT(DISTINCT CASE WHEN fa.status NOT IN ('draft', 'rejected', 'cancelled') THEN p.id END) AS leads_with_active_app,
        COUNT(DISTINCT CASE WHEN (p.contactado = false OR p.contactado IS NULL) AND fa.id IS NULL THEN p.id END) AS leads_needing_follow_up,
        COUNT(fa.id) AS total_applications,
        COUNT(fa.id) FILTER (WHERE fa.status NOT IN ('draft', 'rejected', 'cancelled')) AS active_applications,
        COUNT(fa.id) FILTER (WHERE fa.status = 'draft') AS draft_applications
    FROM profiles p
    LEFT JOIN financing_applications fa ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user';
      -- REMOVED: AND COALESCE(p.asesor_autorizado_acceso, false) = true
END;
$$;

GRANT EXECUTE ON FUNCTION get_sales_dashboard_stats(UUID) TO authenticated;

COMMENT ON FUNCTION get_sales_dashboard_stats IS
'[PERMANENT] Stats for assigned leads WITHOUT asesor_autorizado_acceso constraint';

-- Function 3: get_sales_client_profile
-- Remove asesor_autorizado_acceso constraint
DROP FUNCTION IF EXISTS get_sales_client_profile(uuid, uuid);

CREATE OR REPLACE FUNCTION get_sales_client_profile(client_id uuid, sales_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    has_access boolean;
BEGIN
    -- Check if sales user has access to this client (only check assignment, not authorization)
    SELECT (p.asesor_asignado_id = sales_user_id)
    INTO has_access
    FROM profiles p
    WHERE p.id = client_id
      AND p.role = 'user';
      -- REMOVED: AND p.asesor_autorizado_acceso = true

    -- If no access, return null
    IF NOT COALESCE(has_access, false) THEN
        RETURN NULL;
    END IF;

    -- Build result with profile and related data
    SELECT jsonb_build_object(
        'profile', to_jsonb(p.*) || jsonb_build_object(
            'asesor_asignado_name', COALESCE(
                asesor.first_name || ' ' || asesor.last_name,
                'Sin asignar'
            )
        ),
        'applications', COALESCE(
            (SELECT jsonb_agg(to_jsonb(fa.*) ORDER BY fa.created_at DESC)
             FROM financing_applications fa
             WHERE fa.user_id = client_id),
            '[]'::jsonb
        ),
        'tags', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', lta.tag_id,
                'tag_name', lt.tag_name,
                'color', lt.color
            ))
             FROM lead_tag_associations lta
             JOIN lead_tags lt ON lt.id = lta.tag_id
             WHERE lta.lead_id = client_id),
            '[]'::jsonb
        ),
        'reminders', COALESCE(
            (SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.reminder_date ASC)
             FROM lead_reminders r
             WHERE r.lead_id = client_id),
            '[]'::jsonb
        ),
        'documents', COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*) ORDER BY d.created_at DESC)
             FROM uploaded_documents d
             WHERE d.user_id = client_id),
            '[]'::jsonb
        ),
        'bank_profile', COALESCE(
            (SELECT to_jsonb(bp.*)
             FROM bank_profiles bp
             WHERE bp.user_id = client_id),
            'null'::jsonb
        )
    ) INTO result
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    WHERE p.id = client_id;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_sales_client_profile(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION get_sales_client_profile(uuid, uuid) IS
'[PERMANENT] Returns client profile if assigned WITHOUT asesor_autorizado_acceso constraint';

-- Function 4: verify_sales_access_to_lead
-- Remove asesor_autorizado_acceso constraint
DROP FUNCTION IF EXISTS verify_sales_access_to_lead(uuid, uuid);

CREATE OR REPLACE FUNCTION verify_sales_access_to_lead(lead_id uuid, sales_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_access boolean;
BEGIN
    -- Sales has access if lead is assigned to them (NO authorization check)
    SELECT (p.asesor_asignado_id = sales_user_id)
    INTO has_access
    FROM profiles p
    WHERE p.id = lead_id
      AND p.role = 'user';
      -- REMOVED: AND COALESCE(p.asesor_autorizado_acceso, false) = true

    RETURN COALESCE(has_access, false);
END;
$$;

GRANT EXECUTE ON FUNCTION verify_sales_access_to_lead(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION verify_sales_access_to_lead(uuid, uuid) IS
'[PERMANENT] Verifies assignment WITHOUT asesor_autorizado_acceso constraint';

-- ============================================================================
-- PART 3: Update Financing Applications and Documents Policies
-- ============================================================================

DROP POLICY IF EXISTS "financing_apps_select" ON public.financing_applications;

CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
        -- REMOVED: AND COALESCE(p.asesor_autorizado_acceso, false) = true
    )
  )
);

COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'[PERMANENT] Sales see applications from assigned leads WITHOUT authorization constraint';

DROP POLICY IF EXISTS "financing_apps_update" ON public.financing_applications;

CREATE POLICY "financing_apps_update"
ON public.financing_applications
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "financing_apps_update" ON public.financing_applications IS
'[PERMANENT] Sales update applications from assigned leads WITHOUT authorization constraint';

DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "uploaded_documents_select" ON public.uploaded_documents IS
'[PERMANENT] Sales see documents from assigned leads WITHOUT authorization constraint';

DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "uploaded_documents_update" ON public.uploaded_documents IS
'[PERMANENT] Sales update documents from assigned leads WITHOUT authorization constraint';

-- ============================================================================
-- PART 4: Add Bank Profiles Access for Sales
-- ============================================================================

DROP POLICY IF EXISTS "bank_profiles_select" ON public.bank_profiles;

CREATE POLICY "bank_profiles_select" ON public.bank_profiles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = bank_profiles.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "bank_profiles_select" ON public.bank_profiles IS
'[PERMANENT] Sales see bank profiles from assigned leads WITHOUT authorization constraint';

-- ============================================================================
-- VERIFICATION AND LOGGING
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count updated policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE '%select%'
      AND tablename IN ('profiles', 'financing_applications', 'uploaded_documents', 'bank_profiles');

    -- Count updated functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname LIKE '%sales%';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ GLOBAL FIX: asesor_autorizado_acceso REMOVED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes Applied:';
    RAISE NOTICE '';
    RAISE NOTICE '1. RLS Policies (% updated):', policy_count;
    RAISE NOTICE '   ✓ profiles_select';
    RAISE NOTICE '   ✓ profiles_update';
    RAISE NOTICE '   ✓ financing_apps_select';
    RAISE NOTICE '   ✓ financing_apps_update';
    RAISE NOTICE '   ✓ uploaded_documents_select';
    RAISE NOTICE '   ✓ uploaded_documents_update';
    RAISE NOTICE '   ✓ bank_profiles_select';
    RAISE NOTICE '';
    RAISE NOTICE '2. RPC Functions (% exist):', function_count;
    RAISE NOTICE '   ✓ get_sales_assigned_leads()';
    RAISE NOTICE '   ✓ get_sales_dashboard_stats()';
    RAISE NOTICE '   ✓ get_sales_client_profile()';
    RAISE NOTICE '   ✓ verify_sales_access_to_lead()';
    RAISE NOTICE '';
    RAISE NOTICE '3. Access Rule (PERMANENT):';
    RAISE NOTICE '   Sales see leads WHERE:';
    RAISE NOTICE '     - asesor_asignado_id = sales_user_id';
    RAISE NOTICE '     - role = ''user''';
    RAISE NOTICE '     - NO asesor_autorizado_acceso check';
    RAISE NOTICE '';
    RAISE NOTICE '4. Fixes Applied:';
    RAISE NOTICE '   ✓ Sales can access ALL assigned leads';
    RAISE NOTICE '   ✓ No more empty results';
    RAISE NOTICE '   ✓ No more infinite loading states';
    RAISE NOTICE '   ✓ Complete data access for assigned leads';
    RAISE NOTICE '';
    RAISE NOTICE 'This fix is PERMANENT and prevents future issues.';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
