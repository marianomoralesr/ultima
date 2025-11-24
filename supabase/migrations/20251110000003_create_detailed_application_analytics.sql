-- Create detailed application analytics functions for admin dashboard
-- This provides deep insights into applications, their completion status, and sales agent performance

-- ============================================================================
-- 1. FUNCTION: Get overall application analytics with completion status
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_detailed_application_analytics()
RETURNS TABLE(
    total_applications bigint,
    submitted_applications bigint,
    complete_applications bigint,
    incomplete_applications bigint,
    applications_with_documents bigint,
    applications_by_status jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH app_stats AS (
        SELECT
            COUNT(*) as total_apps,
            COUNT(*) FILTER (WHERE fa.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')) as submitted_apps,
            -- An application is "complete" if it's submitted AND has at least one uploaded document
            COUNT(*) FILTER (
                WHERE fa.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
                AND EXISTS (
                    SELECT 1 FROM public.uploaded_documents ud
                    WHERE ud.user_id = fa.user_id
                )
            ) as complete_apps,
            -- Incomplete: submitted but no documents
            COUNT(*) FILTER (
                WHERE fa.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
                AND NOT EXISTS (
                    SELECT 1 FROM public.uploaded_documents ud
                    WHERE ud.user_id = fa.user_id
                )
            ) as incomplete_apps,
            -- Applications that have at least one document (regardless of status)
            COUNT(*) FILTER (
                WHERE EXISTS (
                    SELECT 1 FROM public.uploaded_documents ud
                    WHERE ud.user_id = fa.user_id
                )
            ) as apps_with_docs
        FROM public.financing_applications fa
    ),
    status_breakdown AS (
        SELECT
            jsonb_object_agg(
                COALESCE(fa.status, 'unknown'),
                count
            ) as status_distribution
        FROM (
            SELECT
                fa.status,
                COUNT(*) as count
            FROM public.financing_applications fa
            GROUP BY fa.status
        ) fa
    )
    SELECT
        total_apps::bigint,
        submitted_apps::bigint,
        complete_apps::bigint,
        incomplete_apps::bigint,
        apps_with_docs::bigint,
        COALESCE(status_distribution, '{}'::jsonb)
    FROM app_stats, status_breakdown;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_detailed_application_analytics() TO authenticated;

COMMENT ON FUNCTION public.get_detailed_application_analytics() IS
'Returns detailed analytics about all financing applications including completion status based on document uploads';

-- ============================================================================
-- 2. FUNCTION: Get applications grouped by sales agent
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_applications_by_sales_agent(
    sales_agent_id_filter uuid DEFAULT NULL
)
RETURNS TABLE(
    sales_agent_id uuid,
    sales_agent_name text,
    sales_agent_email text,
    total_applications bigint,
    submitted_applications bigint,
    complete_applications bigint,
    incomplete_applications bigint,
    draft_applications bigint,
    approved_applications bigint,
    rejected_applications bigint,
    applications jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p_agent.id as sales_agent_id,
        CONCAT(p_agent.first_name, ' ', p_agent.last_name) as sales_agent_name,
        p_agent.email as sales_agent_email,
        COUNT(fa.id)::bigint as total_applications,
        COUNT(fa.id) FILTER (WHERE fa.status IN ('submitted', 'reviewing', 'pending_docs', 'approved'))::bigint as submitted_applications,
        -- Complete: submitted with documents
        COUNT(fa.id) FILTER (
            WHERE fa.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
            AND EXISTS (
                SELECT 1 FROM public.uploaded_documents ud
                WHERE ud.user_id = fa.user_id
            )
        )::bigint as complete_applications,
        -- Incomplete: submitted without documents
        COUNT(fa.id) FILTER (
            WHERE fa.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
            AND NOT EXISTS (
                SELECT 1 FROM public.uploaded_documents ud
                WHERE ud.user_id = fa.user_id
            )
        )::bigint as incomplete_applications,
        COUNT(fa.id) FILTER (WHERE fa.status = 'draft')::bigint as draft_applications,
        COUNT(fa.id) FILTER (WHERE fa.status = 'approved')::bigint as approved_applications,
        COUNT(fa.id) FILTER (WHERE fa.status = 'rejected')::bigint as rejected_applications,
        -- Applications details as JSON array
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'application_id', fa.id,
                    'application_status', fa.status,
                    'application_created_at', fa.created_at,
                    'application_updated_at', fa.updated_at,
                    'has_documents', EXISTS (
                        SELECT 1 FROM public.uploaded_documents ud
                        WHERE ud.user_id = fa.user_id
                    ),
                    'document_count', (
                        SELECT COUNT(*) FROM public.uploaded_documents ud
                        WHERE ud.user_id = fa.user_id
                    ),
                    'car_info', fa.car_info,
                    'lead_id', p_lead.id,
                    'lead_name', CONCAT(p_lead.first_name, ' ', p_lead.last_name),
                    'lead_email', p_lead.email,
                    'lead_phone', p_lead.phone
                ) ORDER BY fa.created_at DESC
            ) FILTER (WHERE fa.id IS NOT NULL),
            '[]'::jsonb
        ) as applications
    FROM public.profiles p_agent
    LEFT JOIN public.profiles p_lead ON p_lead.asesor_asignado_id = p_agent.id
    LEFT JOIN public.financing_applications fa ON fa.user_id = p_lead.id
    WHERE p_agent.role = 'sales'
      AND (sales_agent_id_filter IS NULL OR p_agent.id = sales_agent_id_filter)
    GROUP BY p_agent.id, p_agent.first_name, p_agent.last_name, p_agent.email
    ORDER BY total_applications DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_applications_by_sales_agent(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_applications_by_sales_agent(uuid) IS
'Returns detailed application statistics grouped by sales agent with optional filtering';

-- ============================================================================
-- 3. FUNCTION: Get detailed application list with all info
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_detailed_applications_list(
    status_filter text DEFAULT NULL,
    sales_agent_filter uuid DEFAULT NULL,
    completion_filter text DEFAULT NULL -- 'complete', 'incomplete', 'all'
)
RETURNS TABLE(
    application_id uuid,
    application_status text,
    application_created_at timestamptz,
    application_updated_at timestamptz,
    is_complete boolean,
    document_count bigint,
    car_info jsonb,
    lead_id uuid,
    lead_name text,
    lead_email text,
    lead_phone text,
    sales_agent_id uuid,
    sales_agent_name text,
    sales_agent_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fa.id as application_id,
        fa.status as application_status,
        fa.created_at as application_created_at,
        fa.updated_at as application_updated_at,
        -- Is complete if submitted AND has documents
        (
            fa.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
            AND EXISTS (
                SELECT 1 FROM public.uploaded_documents ud
                WHERE ud.user_id = fa.user_id
            )
        ) as is_complete,
        (
            SELECT COUNT(*) FROM public.uploaded_documents ud
            WHERE ud.user_id = fa.user_id
        )::bigint as document_count,
        fa.car_info,
        p_lead.id as lead_id,
        CONCAT(p_lead.first_name, ' ', p_lead.last_name) as lead_name,
        p_lead.email as lead_email,
        p_lead.phone as lead_phone,
        p_agent.id as sales_agent_id,
        CONCAT(p_agent.first_name, ' ', p_agent.last_name) as sales_agent_name,
        p_agent.email as sales_agent_email
    FROM public.financing_applications fa
    JOIN public.profiles p_lead ON p_lead.id = fa.user_id
    LEFT JOIN public.profiles p_agent ON p_agent.id = p_lead.asesor_asignado_id
    WHERE
        -- Status filter
        (status_filter IS NULL OR fa.status = status_filter)
        -- Sales agent filter
        AND (sales_agent_filter IS NULL OR p_lead.asesor_asignado_id = sales_agent_filter)
        -- Completion filter
        AND (
            completion_filter IS NULL
            OR completion_filter = 'all'
            OR (
                completion_filter = 'complete'
                AND fa.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
                AND EXISTS (
                    SELECT 1 FROM public.uploaded_documents ud
                    WHERE ud.user_id = fa.user_id
                )
            )
            OR (
                completion_filter = 'incomplete'
                AND fa.status IN ('submitted', 'reviewing', 'pending_docs', 'approved')
                AND NOT EXISTS (
                    SELECT 1 FROM public.uploaded_documents ud
                    WHERE ud.user_id = fa.user_id
                )
            )
        )
    ORDER BY fa.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_detailed_applications_list(text, uuid, text) TO authenticated;

COMMENT ON FUNCTION public.get_detailed_applications_list(text, uuid, text) IS
'Returns detailed list of all applications with filtering options for status, sales agent, and completion';

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== DETAILED APPLICATION ANALYTICS FUNCTIONS CREATED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'New Functions:';
    RAISE NOTICE '  1. get_detailed_application_analytics()';
    RAISE NOTICE '     - Returns overall application statistics';
    RAISE NOTICE '     - Tracks submitted, complete, incomplete applications';
    RAISE NOTICE '     - Provides status breakdown';
    RAISE NOTICE '';
    RAISE NOTICE '  2. get_applications_by_sales_agent(sales_agent_id)';
    RAISE NOTICE '     - Groups applications by sales agent';
    RAISE NOTICE '     - Shows complete vs incomplete applications per agent';
    RAISE NOTICE '     - Returns detailed application list per agent';
    RAISE NOTICE '';
    RAISE NOTICE '  3. get_detailed_applications_list(status, agent_id, completion)';
    RAISE NOTICE '     - Returns filterable list of all applications';
    RAISE NOTICE '     - Includes lead and sales agent info';
    RAISE NOTICE '     - Shows document completion status';
    RAISE NOTICE '';
    RAISE NOTICE 'Definition: Complete Application = Submitted + Has Documents';
    RAISE NOTICE '';
END $$;
