-- =====================================================================
-- Sales Dashboard RPC Functions
-- =====================================================================
-- These functions provide secure access for sales representatives to view
-- and manage their assigned leads with proper authorization checks.
-- =====================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_sales_assigned_leads(UUID);
DROP FUNCTION IF EXISTS get_sales_dashboard_stats(UUID);
DROP FUNCTION IF EXISTS get_sales_client_profile(UUID, UUID);
DROP FUNCTION IF EXISTS verify_sales_access_to_lead(UUID, UUID);

-- =====================================================================
-- Function: get_sales_assigned_leads
-- Description: Returns all leads assigned to a specific sales user
-- Parameters: sales_user_id - The ID of the sales representative
-- Returns: Array of lead profiles with application info
-- =====================================================================
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
        COALESCE(p.asesor_autorizado_acceso, false) as asesor_autorizado_acceso,
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

-- =====================================================================
-- Function: get_sales_dashboard_stats
-- Description: Returns statistics for a sales user's assigned leads
-- Parameters: sales_user_id - The ID of the sales representative
-- Returns: Single row with aggregated statistics
-- =====================================================================
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
            WHEN a.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
            THEN p.id
        END) as leads_with_active_app,
        COUNT(DISTINCT CASE
            WHEN p.contactado = false OR p.contactado IS NULL
            THEN p.id
        END) as leads_not_contacted,
        COUNT(DISTINCT CASE
            WHEN (p.contactado = false OR p.contactado IS NULL)
              OR (a.status IN ('pending_docs', 'reviewing'))
            THEN p.id
        END) as leads_needing_follow_up
    FROM profiles p
    LEFT JOIN financing_applications a ON p.id = a.user_id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- Function: get_sales_client_profile
-- Description: Returns complete client profile if sales user has access
-- Parameters:
--   client_id - The ID of the client to fetch
--   sales_user_id - The ID of the sales representative
-- Returns: JSONB with profile, applications, tags, reminders, documents
-- =====================================================================
CREATE OR REPLACE FUNCTION get_sales_client_profile(
    client_id UUID,
    sales_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    has_access BOOLEAN;
    client_profile JSONB;
    client_applications JSONB;
    client_tags JSONB;
    client_reminders JSONB;
    client_documents JSONB;
BEGIN
    -- Check if sales user has access to this client
    SELECT
        (p.asesor_asignado_id = sales_user_id AND p.asesor_autorizado_acceso = true)
    INTO has_access
    FROM profiles p
    WHERE p.id = client_id;

    -- If no access, return null
    IF NOT has_access THEN
        RETURN NULL;
    END IF;

    -- Get profile
    SELECT to_jsonb(p.*) INTO client_profile
    FROM profiles p
    WHERE p.id = client_id;

    -- Get applications
    SELECT COALESCE(jsonb_agg(to_jsonb(a.*) ORDER BY a.created_at DESC), '[]'::jsonb)
    INTO client_applications
    FROM financing_applications a
    WHERE a.user_id = client_id;

    -- Get tags
    SELECT COALESCE(jsonb_agg(to_jsonb(lt.*)), '[]'::jsonb)
    INTO client_tags
    FROM lead_tag_associations lta
    JOIN lead_tags lt ON lta.tag_id = lt.id
    WHERE lta.lead_id = client_id;

    -- Get reminders
    SELECT COALESCE(jsonb_agg(to_jsonb(lr.*) ORDER BY lr.reminder_date DESC), '[]'::jsonb)
    INTO client_reminders
    FROM lead_reminders lr
    WHERE lr.lead_id = client_id;

    -- Get documents
    SELECT COALESCE(jsonb_agg(to_jsonb(d.*) ORDER BY d.created_at DESC), '[]'::jsonb)
    INTO client_documents
    FROM uploaded_documents d
    WHERE d.user_id = client_id;

    -- Build result
    result := jsonb_build_object(
        'profile', client_profile,
        'applications', client_applications,
        'tags', client_tags,
        'reminders', client_reminders,
        'documents', client_documents
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- Function: verify_sales_access_to_lead
-- Description: Verifies if a sales user has access to a specific lead
-- Parameters:
--   lead_id - The ID of the lead to check
--   sales_user_id - The ID of the sales representative
-- Returns: BOOLEAN - true if access is granted
-- =====================================================================
CREATE OR REPLACE FUNCTION verify_sales_access_to_lead(
    lead_id UUID,
    sales_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN;
BEGIN
    SELECT
        (p.asesor_asignado_id = sales_user_id AND p.asesor_autorizado_acceso = true)
    INTO has_access
    FROM profiles p
    WHERE p.id = lead_id;

    RETURN COALESCE(has_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- Grant execute permissions to authenticated users
-- RLS policies will handle additional security at the row level
-- =====================================================================
GRANT EXECUTE ON FUNCTION get_sales_assigned_leads(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_client_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_sales_access_to_lead(UUID, UUID) TO authenticated;

-- =====================================================================
-- Add comment for documentation
-- =====================================================================
COMMENT ON FUNCTION get_sales_assigned_leads IS 'Returns all leads assigned to a specific sales representative';
COMMENT ON FUNCTION get_sales_dashboard_stats IS 'Returns aggregated statistics for a sales user''s assigned leads';
COMMENT ON FUNCTION get_sales_client_profile IS 'Returns complete client profile if sales user has authorized access';
COMMENT ON FUNCTION verify_sales_access_to_lead IS 'Verifies if a sales user has access to a specific lead';
