-- EMERGENCY FIX: Ensure get_sales_users_with_analytics exists
-- Created: 2025-12-04 to fix /admin/usuarios page

DROP FUNCTION IF EXISTS public.get_sales_users_with_analytics();

CREATE OR REPLACE FUNCTION public.get_sales_users_with_analytics()
RETURNS TABLE(
    id uuid,
    email text,
    first_name text,
    last_name text,
    phone text,
    picture_url text,
    role text,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    last_assigned_at timestamptz,
    leads_assigned bigint,
    leads_contacted bigint,
    leads_with_applications bigint,
    leads_actualizados bigint,
    solicitudes_enviadas bigint,
    solicitudes_procesadas bigint,
    is_overloaded boolean
) AS $$
BEGIN
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
        p.role::text,
        p.created_at,
        COALESCE(p.updated_at, p.created_at) AS last_sign_in_at,
        p.last_assigned_at,
        COALESCE((SELECT COUNT(*)::bigint FROM public.profiles leads WHERE leads.asesor_asignado_id = p.id AND leads.role = 'user'), 0) AS leads_assigned,
        COALESCE((SELECT COUNT(*)::bigint FROM public.profiles leads WHERE leads.asesor_asignado_id = p.id AND leads.role = 'user' AND (leads.contactado = true OR leads.metadata->>'contactado' = 'true')), 0) AS leads_contacted,
        COALESCE((SELECT COUNT(DISTINCT fa.user_id)::bigint FROM public.financing_applications fa INNER JOIN public.profiles leads ON leads.id = fa.user_id WHERE leads.asesor_asignado_id = p.id AND leads.role = 'user' AND fa.status != 'draft'), 0) AS leads_with_applications,
        COALESCE((SELECT COUNT(DISTINCT fa.user_id)::bigint FROM public.financing_applications fa INNER JOIN public.profiles leads ON leads.id = fa.user_id WHERE leads.asesor_asignado_id = p.id AND leads.role = 'user' AND fa.status IN ('En Revisión', 'Aprobada', 'Rechazada', 'reviewing', 'in_review', 'approved', 'rejected')), 0) AS leads_actualizados,
        COALESCE((SELECT COUNT(*)::bigint FROM public.financing_applications fa INNER JOIN public.profiles leads ON leads.id = fa.user_id WHERE leads.asesor_asignado_id = p.id AND leads.role = 'user' AND fa.status IN ('Completa', 'Faltan Documentos', 'submitted', 'pending_docs')), 0) AS solicitudes_enviadas,
        COALESCE((SELECT COUNT(*)::bigint FROM public.financing_applications fa INNER JOIN public.profiles leads ON leads.id = fa.user_id WHERE leads.asesor_asignado_id = p.id AND leads.role = 'user' AND fa.status IN ('En Revisión', 'Aprobada', 'Rechazada', 'reviewing', 'in_review', 'approved', 'rejected')), 0) AS solicitudes_procesadas,
        (SELECT COUNT(*) > 20 FROM public.profiles leads WHERE leads.asesor_asignado_id = p.id AND leads.role = 'user') AS is_overloaded
    FROM public.profiles p
    WHERE p.role IN ('sales', 'admin')
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_sales_users_with_analytics() TO authenticated;
