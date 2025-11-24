-- Fix get_sales_assigned_leads function to use correct column name
-- The column is 'asesor_autorizado_acceso' not 'autorizar_asesor_acceso'

CREATE OR REPLACE FUNCTION get_sales_assigned_leads(sales_user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    mother_last_name TEXT,
    phone TEXT,
    source TEXT,
    contactado BOOLEAN,
    asesor_asignado_id UUID,
    asesor_asignado TEXT,
    autorizar_asesor_acceso BOOLEAN,
    created_at TIMESTAMPTZ,
    metadata JSONB,
    latest_app_status TEXT,
    latest_app_car_info JSONB,
    rfc TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.first_name,
        p.last_name,
        p.mother_last_name,
        p.phone,
        p.source,
        p.contactado,
        p.asesor_asignado_id,
        COALESCE(asesor.first_name || ' ' || asesor.last_name, 'No asignado') as asesor_asignado,
        COALESCE(p.asesor_autorizado_acceso, false) as autorizar_asesor_acceso,
        p.created_at,
        p.metadata,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info,
        p.rfc
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    LEFT JOIN LATERAL (
        SELECT status, car_info
        FROM financing_applications
        WHERE user_id = p.id
        ORDER BY created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      AND COALESCE(p.asesor_autorizado_acceso, false) = true
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_sales_dashboard_stats function
CREATE OR REPLACE FUNCTION get_sales_dashboard_stats(sales_user_id UUID)
RETURNS TABLE (
    total_leads BIGINT,
    leads_with_active_app BIGINT,
    leads_not_contacted BIGINT,
    leads_needing_follow_up BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT p.id) as total_leads,
        COUNT(DISTINCT CASE
            WHEN fa.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
            THEN p.id
        END) as leads_with_active_app,
        COUNT(DISTINCT CASE
            WHEN p.contactado = false OR p.contactado IS NULL
            THEN p.id
        END) as leads_not_contacted,
        COUNT(DISTINCT CASE
            WHEN (p.contactado = false OR p.contactado IS NULL)
                OR (fa.status IN ('submitted', 'reviewing', 'pending_docs'))
            THEN p.id
        END) as leads_needing_follow_up
    FROM profiles p
    LEFT JOIN financing_applications fa ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      AND COALESCE(p.asesor_autorizado_acceso, false) = true
    GROUP BY p.asesor_asignado_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_sales_assigned_leads(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_dashboard_stats(UUID) TO authenticated;

COMMENT ON FUNCTION get_sales_assigned_leads IS 'Returns all leads assigned to a sales user with proper authorization check';
COMMENT ON FUNCTION get_sales_dashboard_stats IS 'Returns statistics for a sales users assigned leads';
