-- Fix get_leads_for_dashboard to avoid querying auth.users and fix type mismatch
-- Issue: Column 8 (asesor_asignado) was defined as TEXT but query returned VARCHAR(255)
-- Also: Querying auth.users table causes permission denied errors with RLS

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
DECLARE
    caller_email text;
    is_admin boolean;
BEGIN
    -- Get caller's email from JWT
    caller_email := auth.jwt()->>'email';

    -- Check if caller is admin or sales
    is_admin := caller_email IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com'
    );

    -- If not admin/sales, deny access
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Permission denied to access leads dashboard.';
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

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS 'Returns leads for CRM dashboard. Only returns profiles with role=user (excludes admin/sales users). Uses JWT email check for admin/sales access. Gets asesor email from profiles table to avoid auth.users permission issues.';
