-- PARTE 3: Actualizar función get_sales_dashboard_stats
DROP FUNCTION IF EXISTS get_sales_dashboard_stats(uuid);
CREATE OR REPLACE FUNCTION get_sales_dashboard_stats(sales_user_id UUID)
RETURNS TABLE(
    total_leads BIGINT, leads_contacted BIGINT, leads_not_contacted BIGINT,
    leads_with_active_app BIGINT, leads_needing_follow_up BIGINT,
    total_applications BIGINT, active_applications BIGINT, draft_applications BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT p.id) AS total_leads,
        COUNT(DISTINCT p.id) FILTER (WHERE p.contactado = true) AS leads_contacted,
        COUNT(DISTINCT p.id) FILTER (WHERE p.contactado = false OR p.contactado IS NULL) AS leads_not_contacted,
        COUNT(DISTINCT CASE WHEN fa.status NOT IN ('draft', 'rejected', 'cancelled') THEN p.id END) AS leads_with_active_app,
        COUNT(DISTINCT CASE WHEN (p.contactado = false OR p.contactado IS NULL) AND fa.id IS NULL THEN p.id END) AS leads_needing_follow_up,
        COUNT(fa.id) AS total_applications,
        COUNT(fa.id) FILTER (WHERE fa.status NOT IN ('draft', 'rejected', 'cancelled')) AS active_applications,
        COUNT(fa.id) FILTER (WHERE fa.status = 'draft') AS draft_applications
    FROM profiles p
    LEFT JOIN financing_applications fa ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = sales_user_id AND p.role = 'user';
END;
$$;
GRANT EXECUTE ON FUNCTION get_sales_dashboard_stats(UUID) TO authenticated;
