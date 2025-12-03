-- Migration: Add picture_url to get_sales_users_with_analytics function
-- Description: Updates the function to include picture_url so advisor photos can be displayed

DROP FUNCTION IF EXISTS public.get_sales_users_with_analytics();

CREATE OR REPLACE FUNCTION public.get_sales_users_with_analytics()
RETURNS TABLE(
    id uuid,
    email text,
    first_name text,
    last_name text,
    phone text,
    picture_url text,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    last_assigned_at timestamptz,
    leads_assigned bigint,
    leads_contacted bigint,
    leads_with_applications bigint,
    leads_actualizados bigint,
    solicitudes_enviadas bigint,
    solicitudes_procesadas bigint,
    is_overloaded boolean,
    is_active boolean
) AS $$
BEGIN
    -- Ensure only admins can call this function
    IF public.get_my_role() != 'admin' THEN
        RAISE EXCEPTION 'No autorizado. Se requiere rol de administrador.';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.first_name,
        p.last_name,
        p.phone,
        p.picture_url,
        p.created_at,
        p.last_sign_in_at,
        p.last_assigned_at,
        -- Count leads assigned to this sales agent
        COALESCE((
            SELECT COUNT(*)::bigint
            FROM public.profiles leads
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
        ), 0) AS leads_assigned,
        -- Count contacted leads
        COALESCE((
            SELECT COUNT(*)::bigint
            FROM public.profiles leads
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
            AND (leads.contactado = true OR leads.metadata->>'contactado' = 'true')
        ), 0) AS leads_contacted,
        -- Count leads with active applications (any status except draft)
        COALESCE((
            SELECT COUNT(DISTINCT fa.user_id)::bigint
            FROM public.financing_applications fa
            WHERE fa.user_id IN (
                SELECT id
                FROM public.profiles
                WHERE asesor_asignado_id = p.id
                AND role = 'user'
            )
            AND fa.status != 'draft'
            AND fa.deleted_at IS NULL
        ), 0) AS leads_with_applications,
        -- Count leads actualizados (moved from draft/submitted to processed states)
        COALESCE((
            SELECT COUNT(DISTINCT user_id)::bigint
            FROM public.financing_applications
            WHERE user_id IN (
                SELECT id
                FROM public.profiles
                WHERE asesor_asignado_id = p.id
                AND role = 'user'
            )
            AND status IN ('reviewing', 'in_review', 'en_revision', 'approved', 'aprobada', 'rejected', 'rechazada')
            AND deleted_at IS NULL
        ), 0) AS leads_actualizados,
        -- Count total solicitudes enviadas (submitted, not draft)
        COALESCE((
            SELECT COUNT(*)::bigint
            FROM public.financing_applications fa
            WHERE fa.user_id IN (
                SELECT id
                FROM public.profiles
                WHERE asesor_asignado_id = p.id
                AND role = 'user'
            )
            AND fa.status IN ('submitted', 'completa', 'pending_docs', 'faltan_documentos')
            AND fa.deleted_at IS NULL
        ), 0) AS solicitudes_enviadas,
        -- Count solicitudes procesadas (reviewed, approved, rejected)
        COALESCE((
            SELECT COUNT(*)::bigint
            FROM public.financing_applications fa
            WHERE fa.user_id IN (
                SELECT id
                FROM public.profiles
                WHERE asesor_asignado_id = p.id
                AND role = 'user'
            )
            AND fa.status IN ('reviewing', 'in_review', 'en_revision', 'approved', 'aprobada', 'rejected', 'rechazada')
            AND fa.deleted_at IS NULL
        ), 0) AS solicitudes_procesadas,
        -- Check if user is overloaded (more than 20 assigned leads)
        (
            SELECT COUNT(*) > 20
            FROM public.profiles leads
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
        ) AS is_overloaded,
        COALESCE(p.is_active, true) AS is_active
    FROM public.profiles p
    WHERE p.role IN ('sales', 'admin')
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_sales_users_with_analytics()
IS 'Returns all sales users with their performance analytics including picture_url for profile photos. Admin only.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_sales_users_with_analytics() TO authenticated;
