-- Fix RPC functions to use SECURITY DEFINER and handle both admin and sales roles
-- This avoids infinite recursion by bypassing RLS policies

-- ============================================================================
-- 1. FIX get_leads_for_dashboard() - Make it SECURITY DEFINER
-- ============================================================================

-- Drop existing function first (signature is changing)
DROP FUNCTION IF EXISTS public.get_leads_for_dashboard();

CREATE OR REPLACE FUNCTION public.get_leads_for_dashboard()
RETURNS TABLE (
    id uuid,
    first_name text,
    last_name text,
    email text,
    phone text,
    source text,
    contactado boolean,
    asesor_asignado text,
    asesor_asignado_id uuid,
    asesor_autorizado_acceso boolean,
    latest_app_status text,
    latest_app_car_info jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER  -- This bypasses RLS
SET search_path = public
AS $$
DECLARE
    user_role text;
    user_email text;
BEGIN
    -- Get user role and email from JWT (no recursion)
    user_email := auth.jwt()->>'email';
    user_role := (SELECT role FROM public.profiles WHERE id = auth.uid());

    -- Check if user is admin or sales
    IF user_role NOT IN ('admin', 'sales') AND user_email NOT IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com'
    ) THEN
        RAISE EXCEPTION 'Permission denied to access leads dashboard.';
    END IF;

    -- Return different data based on role
    IF user_role = 'admin' OR user_email IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com'
    ) THEN
        -- Admin sees all leads
        RETURN QUERY
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.email,
            p.phone,
            p.source,
            p.contactado,
            COALESCE(asesor.first_name || ' ' || asesor.last_name, 'No asignado') as asesor_asignado,
            p.asesor_asignado_id,
            COALESCE(p.asesor_autorizado_acceso, false) as asesor_autorizado_acceso,
            latest_app.status as latest_app_status,
            latest_app.car_info as latest_app_car_info
        FROM public.profiles p
        LEFT JOIN public.profiles asesor ON p.asesor_asignado_id = asesor.id
        LEFT JOIN LATERAL (
            SELECT fa.status, fa.car_info
            FROM public.financing_applications fa
            WHERE fa.user_id = p.id
            ORDER BY fa.created_at DESC
            LIMIT 1
        ) latest_app ON true
        WHERE p.role = 'user'
        ORDER BY p.updated_at DESC;
    ELSE
        -- Sales sees only their assigned and authorized leads
        RETURN QUERY
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.email,
            p.phone,
            p.source,
            p.contactado,
            COALESCE(asesor.first_name || ' ' || asesor.last_name, 'No asignado') as asesor_asignado,
            p.asesor_asignado_id,
            COALESCE(p.asesor_autorizado_acceso, false) as asesor_autorizado_acceso,
            latest_app.status as latest_app_status,
            latest_app.car_info as latest_app_car_info
        FROM public.profiles p
        LEFT JOIN public.profiles asesor ON p.asesor_asignado_id = asesor.id
        LEFT JOIN LATERAL (
            SELECT fa.status, fa.car_info
            FROM public.financing_applications fa
            WHERE fa.user_id = p.id
            ORDER BY fa.created_at DESC
            LIMIT 1
        ) latest_app ON true
        WHERE p.asesor_asignado_id = auth.uid()
          AND COALESCE(p.asesor_autorizado_acceso, false) = true
          AND p.role = 'user'
        ORDER BY p.updated_at DESC;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO authenticated;

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS
'Returns leads for dashboard - all leads for admin, only assigned leads for sales. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================================
-- 2. FIX get_crm_dashboard_stats() - Make it SECURITY DEFINER
-- ============================================================================

-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_crm_dashboard_stats();

CREATE OR REPLACE FUNCTION public.get_crm_dashboard_stats()
RETURNS TABLE (
    total_leads bigint,
    leads_with_active_app bigint,
    leads_with_unfinished_app bigint,
    leads_needing_follow_up bigint
)
LANGUAGE plpgsql
SECURITY DEFINER  -- This bypasses RLS
SET search_path = public
AS $$
DECLARE
    user_role text;
    user_email text;
BEGIN
    -- Get user role and email from JWT (no recursion)
    user_email := auth.jwt()->>'email';
    user_role := (SELECT role FROM public.profiles WHERE id = auth.uid());

    -- Check if user is admin or sales
    IF user_role NOT IN ('admin', 'sales') AND user_email NOT IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com'
    ) THEN
        RAISE EXCEPTION 'Permission denied to access dashboard stats.';
    END IF;

    -- Return different stats based on role
    IF user_role = 'admin' OR user_email IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com'
    ) THEN
        -- Admin sees stats for all leads
        RETURN QUERY
        SELECT
            COUNT(DISTINCT p.id) as total_leads,
            COUNT(DISTINCT CASE
                WHEN a.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
                THEN p.id
            END) as leads_with_active_app,
            COUNT(DISTINCT CASE
                WHEN a.status = 'draft' OR (a.id IS NULL AND p.id IS NOT NULL)
                THEN p.id
            END) as leads_with_unfinished_app,
            COUNT(DISTINCT CASE
                WHEN (p.contactado = false OR p.contactado IS NULL)
                  OR (a.status IN ('pending_docs', 'reviewing'))
                THEN p.id
            END) as leads_needing_follow_up
        FROM public.profiles p
        LEFT JOIN public.financing_applications a ON p.id = a.user_id
        WHERE p.role = 'user';
    ELSE
        -- Sales sees stats only for their assigned leads
        RETURN QUERY
        SELECT
            COUNT(DISTINCT p.id) as total_leads,
            COUNT(DISTINCT CASE
                WHEN a.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
                THEN p.id
            END) as leads_with_active_app,
            COUNT(DISTINCT CASE
                WHEN a.status = 'draft' OR (a.id IS NULL AND p.id IS NOT NULL)
                THEN p.id
            END) as leads_with_unfinished_app,
            COUNT(DISTINCT CASE
                WHEN (p.contactado = false OR p.contactado IS NULL)
                  OR (a.status IN ('pending_docs', 'reviewing'))
                THEN p.id
            END) as leads_needing_follow_up
        FROM public.profiles p
        LEFT JOIN public.financing_applications a ON p.id = a.user_id
        WHERE p.asesor_asignado_id = auth.uid()
          AND COALESCE(p.asesor_autorizado_acceso, false) = true
          AND p.role = 'user';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_crm_dashboard_stats() TO authenticated;

COMMENT ON FUNCTION public.get_crm_dashboard_stats() IS
'Returns dashboard stats - all leads for admin, only assigned leads for sales. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================================
-- 3. FIX get_secure_client_profile() - Ensure it handles sales users
-- ============================================================================

-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_secure_client_profile(uuid);

CREATE OR REPLACE FUNCTION public.get_secure_client_profile(client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    user_role text;
    user_email text;
    has_access boolean := false;
BEGIN
    -- Get user role and email
    user_email := auth.jwt()->>'email';
    user_role := (SELECT role FROM public.profiles WHERE id = auth.uid());

    -- Check access: Admin can access all, Sales can access their assigned leads
    IF user_role = 'admin' OR user_email IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com'
    ) THEN
        has_access := true;
    ELSIF user_role = 'sales' THEN
        -- Check if this lead is assigned to the sales user
        SELECT (p.asesor_asignado_id = auth.uid() AND COALESCE(p.asesor_autorizado_acceso, false) = true)
        INTO has_access
        FROM public.profiles p
        WHERE p.id = client_id;
    END IF;

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

GRANT EXECUTE ON FUNCTION public.get_secure_client_profile(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_secure_client_profile(uuid) IS
'Returns complete client profile - all profiles for admin, only assigned profiles for sales. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================================
-- 4. VERIFY AND LOG RESULTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RPC FUNCTIONS FIXED FOR SALES ACCESS ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated Functions:';
    RAISE NOTICE '  ✓ get_leads_for_dashboard() - Now SECURITY DEFINER';
    RAISE NOTICE '  ✓ get_crm_dashboard_stats() - Now SECURITY DEFINER';
    RAISE NOTICE '  ✓ get_secure_client_profile() - Enhanced for sales';
    RAISE NOTICE '';
    RAISE NOTICE 'Behavior:';
    RAISE NOTICE '  - Admin users: See all leads and stats';
    RAISE NOTICE '  - Sales users: See only assigned & authorized leads';
    RAISE NOTICE '  - No RLS recursion (uses SECURITY DEFINER)';
    RAISE NOTICE '';
END $$;
