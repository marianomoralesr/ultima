-- Migration: Add Leads Actualizados and Solicitudes Procesadas counters
-- Description: Updates get_sales_users_with_analytics to include new metrics for tracking
-- leads that have been updated from draft/submitted to processed states

-- ===================================
-- Function: get_sales_users_with_analytics (Updated)
-- Description: Returns all sales users with their performance metrics including new counters
-- ===================================

DROP FUNCTION IF EXISTS public.get_sales_users_with_analytics();

CREATE OR REPLACE FUNCTION public.get_sales_users_with_analytics()
RETURNS TABLE(
    id uuid,
    email text,
    first_name text,
    last_name text,
    phone text,
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
            INNER JOIN public.profiles leads ON leads.id = fa.user_id
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
            AND fa.status != 'draft'
        ), 0) AS leads_with_applications,
        -- NEW: Count leads that have been updated from 'draft' or 'submitted' to processed states
        -- (approved, rejected, docs_pending, under_review)
        COALESCE((
            SELECT COUNT(DISTINCT fa.user_id)::bigint
            FROM public.financing_applications fa
            INNER JOIN public.profiles leads ON leads.id = fa.user_id
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
            AND fa.status IN ('approved', 'rejected', 'docs_pending', 'under_review')
        ), 0) AS leads_actualizados,
        -- NEW: Count applications with status 'submitted' (Enviadas)
        COALESCE((
            SELECT COUNT(*)::bigint
            FROM public.financing_applications fa
            INNER JOIN public.profiles leads ON leads.id = fa.user_id
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
            AND fa.status = 'submitted'
        ), 0) AS solicitudes_enviadas,
        -- NEW: Count applications that have been processed (not draft, not submitted)
        COALESCE((
            SELECT COUNT(*)::bigint
            FROM public.financing_applications fa
            INNER JOIN public.profiles leads ON leads.id = fa.user_id
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
            AND fa.status NOT IN ('draft', 'submitted')
            AND fa.status IS NOT NULL
        ), 0) AS solicitudes_procesadas,
        -- Check if overloaded (more than 20 uncontacted leads)
        CASE WHEN (
            SELECT COUNT(*)
            FROM public.profiles leads
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
            AND (leads.contactado IS NULL OR leads.contactado = false)
            AND (leads.metadata->>'contactado' IS NULL OR leads.metadata->>'contactado' != 'true')
        ) > 20 THEN true ELSE false END AS is_overloaded,
        -- Check if user is active (signed in within last 30 days)
        CASE WHEN p.last_sign_in_at > now() - interval '30 days'
             THEN true ELSE false END AS is_active
    FROM public.profiles p
    WHERE p.role = 'sales'
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_sales_users_with_analytics()
IS 'Returns all sales users with their performance analytics including leads actualizados and solicitudes procesadas. Admin only.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_sales_users_with_analytics() TO authenticated;
