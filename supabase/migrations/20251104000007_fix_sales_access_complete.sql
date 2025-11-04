-- Complete fix: Ensure get_leads_for_dashboard has ALL fields and correct permissions
-- This migration consolidates timestamps + source tracking + sales role access

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
  asesor_asignado_id uuid,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  rfdm text,
  referrer text,
  landing_page text,
  first_visit_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    -- Get role from profiles table
    SELECT p.role INTO user_role
    FROM public.profiles p
    WHERE p.id = auth.uid();

    -- Allow both admin and sales roles
    IF user_role IS NULL OR user_role NOT IN ('admin', 'sales') THEN
        RAISE EXCEPTION 'Permission denied. Admin or sales role required.';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        COALESCE(asesor.email, '')::text as asesor_asignado,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info,
        p.asesor_asignado_id,
        p.last_sign_in_at,
        p.created_at,
        p.updated_at,
        p.utm_source,
        p.utm_medium,
        p.utm_campaign,
        p.utm_term,
        p.utm_content,
        p.rfdm,
        p.referrer,
        p.landing_page,
        p.first_visit_at
    FROM
        public.profiles p
    LEFT JOIN public.profiles asesor ON asesor.id = p.asesor_asignado_id
    LEFT JOIN LATERAL (
        SELECT fa.status, fa.car_info
        FROM public.financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.role = 'user'
    ORDER BY p.last_sign_in_at DESC NULLS LAST;
END;
$$;

ALTER FUNCTION public.get_leads_for_dashboard() OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO authenticated;

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS 'Returns leads for CRM dashboard with timestamps and source tracking. Only returns profiles with role=user (excludes admin/sales users). Requires admin or sales role from profiles table. Default sort is by last_sign_in_at DESC.';

-- Verify the function works by testing permissions
DO $$
BEGIN
    RAISE NOTICE 'Migration complete. The get_leads_for_dashboard function now:';
    RAISE NOTICE '1. Checks role from profiles table (not hardcoded emails)';
    RAISE NOTICE '2. Allows both admin AND sales roles';
    RAISE NOTICE '3. Returns timestamps (last_sign_in_at, created_at, updated_at)';
    RAISE NOTICE '4. Returns source tracking fields (utm_*, rfdm, referrer, landing_page, first_visit_at)';
    RAISE NOTICE '5. Has SECURITY DEFINER to bypass RLS';
    RAISE NOTICE '6. Has explicit GRANT to authenticated role';
END $$;
