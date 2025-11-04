-- Fix: Update get_leads_for_dashboard to check sales role from profiles table
-- Issue: Function only checked hardcoded admin emails, not actual 'sales' role
-- This aligns with get_crm_dashboard_stats which correctly checks role from profiles

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
    -- Check if the current user has admin or sales role
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'Permission denied. Admin or sales role required.';
    END IF;

    -- Return query with asesor email from profiles table (not auth.users)
    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        COALESCE(asesor.email, '')::text as asesor_asignado,  -- Cast to TEXT to match return type
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info,
        p.asesor_asignado_id
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
    WHERE p.role = 'user'  -- Only show actual user leads, not admin/sales accounts
    ORDER BY p.updated_at DESC NULLS LAST;
END;
$$;

ALTER FUNCTION public.get_leads_for_dashboard() OWNER TO postgres;

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS 'Returns leads for CRM dashboard. Only returns profiles with role=user (excludes admin/sales users). Requires admin or sales role from profiles table. Gets asesor email from profiles table to avoid auth.users permission issues.';
