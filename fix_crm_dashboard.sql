-- Combined fix for CRM Dashboard issues
-- This script fixes two main issues:
-- 1. get_leads_for_dashboard was returning ALL profiles (including admin/sales) instead of just users
-- 2. get_crm_dashboard_stats was returning wrong stat fields

-- ============================================================================
-- FIX 1: Update get_leads_for_dashboard to only return role='user'
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_leads_for_dashboard();

CREATE OR REPLACE FUNCTION public.get_leads_for_dashboard()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  contactado boolean,
  asesor_asignado text,
  latest_app_status text,
  latest_app_car_info jsonb,
  asesor_asignado_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Explicitly check role for an extra layer of security on the function call itself.
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND role IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'Permission denied to access leads dashboard.';
    END IF;

    -- The function runs with the caller's permissions, so RLS policies on underlying tables are automatically applied.
    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        (SELECT u.email FROM auth.users u WHERE u.id = p.asesor_asignado_id) as asesor_asignado,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info,
        p.asesor_asignado_id
    FROM
        public.profiles p
    LEFT JOIN LATERAL (
        SELECT fa.status, fa.car_info
        FROM public.financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.role = 'user'  -- CRITICAL FIX: Only show actual user leads, not admin/sales accounts
    ORDER BY p.updated_at DESC NULLS LAST;
END;
$$;

ALTER FUNCTION public.get_leads_for_dashboard() OWNER TO postgres;

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS 'Returns leads for CRM dashboard. Only returns profiles with role=user (excludes admin/sales users). Requires admin or sales role to call.';

-- ============================================================================
-- FIX 2: Update get_crm_dashboard_stats to return correct fields
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_crm_dashboard_stats();

CREATE OR REPLACE FUNCTION public.get_crm_dashboard_stats()
RETURNS TABLE(
    total_leads bigint,
    leads_with_active_app bigint,
    leads_with_unfinished_app bigint,
    leads_needing_follow_up bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Check if the current user has admin or sales role
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin or sales role required.';
    END IF;

    RETURN QUERY
    SELECT
        -- Total leads (users with role='user')
        (SELECT COUNT(*)::bigint FROM profiles WHERE role = 'user') AS total_leads,

        -- Leads with active applications (submitted, reviewing, or pending docs)
        (SELECT COUNT(DISTINCT fa.user_id)::bigint
         FROM financing_applications fa
         INNER JOIN profiles p ON p.id = fa.user_id
         WHERE p.role = 'user'
         AND fa.status IN ('submitted', 'reviewing', 'pending_docs')
        ) AS leads_with_active_app,

        -- Leads with unfinished applications (draft status)
        (SELECT COUNT(DISTINCT fa.user_id)::bigint
         FROM financing_applications fa
         INNER JOIN profiles p ON p.id = fa.user_id
         WHERE p.role = 'user'
         AND fa.status = 'draft'
        ) AS leads_with_unfinished_app,

        -- Leads needing follow up (not contacted yet)
        (SELECT COUNT(*)::bigint
         FROM profiles
         WHERE role = 'user'
         AND (contactado = false OR contactado IS NULL)
        ) AS leads_needing_follow_up;
END;
$$;

ALTER FUNCTION public.get_crm_dashboard_stats() OWNER TO postgres;

COMMENT ON FUNCTION public.get_crm_dashboard_stats() IS 'Returns CRM dashboard statistics. Only counts users with role=user. Requires admin or sales role to call.';

-- ============================================================================
-- Verification queries (optional - comment out if not needed)
-- ============================================================================

-- Test the functions (will show results if run in Supabase SQL editor)
-- SELECT * FROM get_leads_for_dashboard();
-- SELECT * FROM get_crm_dashboard_stats();
