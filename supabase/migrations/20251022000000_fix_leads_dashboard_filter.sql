-- Fix: get_leads_for_dashboard should only return users with role='user', not admin/sales
-- This prevents admin and sales user profiles from showing up in the CRM dashboard

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
        WHERE id = auth.uid()
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
