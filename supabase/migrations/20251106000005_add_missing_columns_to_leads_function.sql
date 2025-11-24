-- Add missing columns to get_leads_for_dashboard() function
-- Includes: last_sign_in_at, UTM parameters, tracking fields, timestamps

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
    latest_app_car_info jsonb,
    -- New fields for CRM
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_term text,
    utm_content text,
    rfdm text,
    referrer text,
    landing_page text,
    first_visit_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    user_email text;
BEGIN
    -- Get user role and email from JWT (no recursion)
    user_email := auth.jwt()->>'email';
    user_role := (SELECT profiles.role FROM public.profiles WHERE profiles.id = auth.uid());

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
            p.id AS id,
            p.first_name AS first_name,
            p.last_name AS last_name,
            p.email AS email,
            p.phone AS phone,
            p.source AS source,
            p.contactado AS contactado,
            COALESCE(asesor.first_name || ' ' || asesor.last_name, 'No asignado') as asesor_asignado,
            p.asesor_asignado_id AS asesor_asignado_id,
            COALESCE(p.asesor_autorizado_acceso, false) as asesor_autorizado_acceso,
            latest_app.status as latest_app_status,
            latest_app.car_info as latest_app_car_info,
            -- New fields
            p.last_sign_in_at AS last_sign_in_at,
            p.created_at AS created_at,
            p.updated_at AS updated_at,
            p.utm_source AS utm_source,
            p.utm_medium AS utm_medium,
            p.utm_campaign AS utm_campaign,
            p.utm_term AS utm_term,
            p.utm_content AS utm_content,
            p.rfdm AS rfdm,
            p.referrer AS referrer,
            p.landing_page AS landing_page,
            p.first_visit_at AS first_visit_at
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
            p.id AS id,
            p.first_name AS first_name,
            p.last_name AS last_name,
            p.email AS email,
            p.phone AS phone,
            p.source AS source,
            p.contactado AS contactado,
            COALESCE(asesor.first_name || ' ' || asesor.last_name, 'No asignado') as asesor_asignado,
            p.asesor_asignado_id AS asesor_asignado_id,
            COALESCE(p.asesor_autorizado_acceso, false) as asesor_autorizado_acceso,
            latest_app.status as latest_app_status,
            latest_app.car_info as latest_app_car_info,
            -- New fields
            p.last_sign_in_at AS last_sign_in_at,
            p.created_at AS created_at,
            p.updated_at AS updated_at,
            p.utm_source AS utm_source,
            p.utm_medium AS utm_medium,
            p.utm_campaign AS utm_campaign,
            p.utm_term AS utm_term,
            p.utm_content AS utm_content,
            p.rfdm AS rfdm,
            p.referrer AS referrer,
            p.landing_page AS landing_page,
            p.first_visit_at AS first_visit_at
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
'Returns comprehensive leads data including last_sign_in_at, UTM parameters, and tracking fields for CRM.';
