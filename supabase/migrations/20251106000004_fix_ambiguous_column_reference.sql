-- Fix ambiguous column reference in get_leads_for_dashboard()
-- The "id" column was ambiguous between output table and source table

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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    user_email text;
BEGIN
    -- Get user role and email from JWT (no recursion)
    user_email := auth.jwt()->>'email';
    -- Fully qualify the id column to avoid ambiguity
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
'Fixed version: Returns leads for dashboard - all leads for admin, only assigned leads for sales. Uses explicit column aliases to avoid ambiguity.';
