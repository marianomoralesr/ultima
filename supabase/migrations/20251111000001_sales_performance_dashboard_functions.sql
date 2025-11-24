-- Sales Performance Dashboard Functions
-- Creates comprehensive analytics functions for sales agents to track their performance

-- Function to get comprehensive performance metrics for a sales user
CREATE OR REPLACE FUNCTION get_sales_performance_metrics(sales_user_id UUID)
RETURNS TABLE (
    -- Lead metrics
    total_leads BIGINT,
    leads_contacted BIGINT,
    leads_not_contacted BIGINT,
    leads_with_active_app BIGINT,
    leads_needing_follow_up BIGINT,
    leads_actualizados BIGINT,

    -- Application metrics
    total_applications BIGINT,
    submitted_applications BIGINT,
    complete_applications BIGINT,
    incomplete_applications BIGINT,
    draft_applications BIGINT,
    approved_applications BIGINT,
    rejected_applications BIGINT,

    -- Performance rates
    contact_rate NUMERIC,
    conversion_rate NUMERIC,
    completion_rate NUMERIC,
    approval_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_leads BIGINT;
    v_leads_contacted BIGINT;
    v_leads_not_contacted BIGINT;
    v_leads_with_app BIGINT;
    v_leads_needing_follow_up BIGINT;
    v_leads_actualizados BIGINT;
    v_total_apps BIGINT;
    v_submitted_apps BIGINT;
    v_complete_apps BIGINT;
    v_incomplete_apps BIGINT;
    v_draft_apps BIGINT;
    v_approved_apps BIGINT;
    v_rejected_apps BIGINT;
BEGIN
    -- Get lead counts
    SELECT
        COUNT(DISTINCT p.id),
        COUNT(DISTINCT p.id) FILTER (WHERE p.contactado = TRUE),
        COUNT(DISTINCT p.id) FILTER (WHERE p.contactado = FALSE OR p.contactado IS NULL),
        COUNT(DISTINCT CASE
            WHEN a.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
            THEN p.id
        END),
        COUNT(DISTINCT CASE
            WHEN (p.contactado = FALSE OR p.contactado IS NULL)
                OR (a.status IN ('submitted', 'reviewing', 'pending_docs'))
            THEN p.id
        END),
        0::BIGINT  -- actualizado column doesn't exist, always return 0
    INTO
        v_total_leads,
        v_leads_contacted,
        v_leads_not_contacted,
        v_leads_with_app,
        v_leads_needing_follow_up,
        v_leads_actualizados
    FROM profiles p
    LEFT JOIN financing_applications fa ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = sales_user_id
    AND p.asesor_autorizado_acceso = TRUE;

    -- Get application counts
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status IN ('submitted', 'reviewing', 'pending_docs', 'approved', 'rejected')),
        COUNT(*) FILTER (WHERE is_complete = TRUE),
        COUNT(*) FILTER (WHERE is_complete = FALSE),
        COUNT(*) FILTER (WHERE status = 'draft'),
        COUNT(*) FILTER (WHERE status = 'approved'),
        COUNT(*) FILTER (WHERE status = 'rejected')
    INTO
        v_total_apps,
        v_submitted_apps,
        v_complete_apps,
        v_incomplete_apps,
        v_draft_apps,
        v_approved_apps,
        v_rejected_apps
    FROM financing_applications fa
    JOIN profiles p ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = sales_user_id
    AND p.asesor_autorizado_acceso = TRUE;

    -- Return the metrics
    RETURN QUERY SELECT
        v_total_leads,
        v_leads_contacted,
        v_leads_not_contacted,
        v_leads_with_app,
        v_leads_needing_follow_up,
        v_leads_actualizados,
        v_total_apps,
        v_submitted_apps,
        v_complete_apps,
        v_incomplete_apps,
        v_draft_apps,
        v_approved_apps,
        v_rejected_apps,
        -- Calculate rates
        CASE WHEN v_total_leads > 0 THEN (v_leads_contacted::NUMERIC / v_total_leads::NUMERIC * 100) ELSE 0 END,
        CASE WHEN v_total_leads > 0 THEN (v_leads_with_app::NUMERIC / v_total_leads::NUMERIC * 100) ELSE 0 END,
        CASE WHEN v_total_apps > 0 THEN (v_complete_apps::NUMERIC / v_total_apps::NUMERIC * 100) ELSE 0 END,
        CASE WHEN v_submitted_apps > 0 THEN (v_approved_apps::NUMERIC / v_submitted_apps::NUMERIC * 100) ELSE 0 END;
END;
$$;

-- Function to get applications grouped by status for a sales user
CREATE OR REPLACE FUNCTION get_sales_applications_by_status(sales_user_id UUID)
RETURNS TABLE (
    status TEXT,
    count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fa.status,
        COUNT(*)::BIGINT as count
    FROM financing_applications fa
    JOIN profiles p ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = sales_user_id
    AND p.asesor_autorizado_acceso = TRUE
    GROUP BY fa.status
    ORDER BY count DESC;
END;
$$;

-- Function to get detailed applications list for a sales user
CREATE OR REPLACE FUNCTION get_sales_detailed_applications(
    sales_user_id UUID,
    status_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    application_id UUID,
    application_status TEXT,
    application_created_at TIMESTAMPTZ,
    application_updated_at TIMESTAMPTZ,
    is_complete BOOLEAN,
    document_count BIGINT,
    car_info JSONB,
    lead_id UUID,
    lead_name TEXT,
    lead_email TEXT,
    lead_phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fa.id as application_id,
        fa.status as application_status,
        fa.created_at as application_created_at,
        fa.updated_at as application_updated_at,
        fa.is_complete,
        COALESCE((
            SELECT COUNT(*)
            FROM documents d
            WHERE d.application_id = fa.id
        ), 0) as document_count,
        fa.car_info,
        p.id as lead_id,
        CONCAT(p.first_name, ' ', p.last_name) as lead_name,
        p.email as lead_email,
        p.phone as lead_phone
    FROM financing_applications fa
    JOIN profiles p ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = sales_user_id
    AND p.asesor_autorizado_acceso = TRUE
    AND (status_filter IS NULL OR fa.status = status_filter)
    ORDER BY fa.updated_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_sales_performance_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_applications_by_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_detailed_applications(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION get_sales_performance_metrics IS 'Returns comprehensive performance metrics for a sales user including lead and application statistics';
COMMENT ON FUNCTION get_sales_applications_by_status IS 'Returns application counts grouped by status for a sales user';
COMMENT ON FUNCTION get_sales_detailed_applications IS 'Returns detailed list of applications for a sales user with optional status filter';
