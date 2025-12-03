-- ============================================================================
-- FIX: Dashboard de Performance - 3 funciones RPC corregidas
-- ============================================================================
-- Problema:
-- 1. Ambigüedad de parámetros (sin prefijo p_)
-- 2. Constraint asesor_autorizado_acceso que no debe existir
-- 3. Campos que no existen (is_complete, documents table)
-- ============================================================================

-- ============================================================================
-- 1. get_sales_performance_metrics - VERSIÓN CORREGIDA
-- ============================================================================

DROP FUNCTION IF EXISTS get_sales_performance_metrics(uuid);

CREATE OR REPLACE FUNCTION get_sales_performance_metrics(p_sales_user_id uuid)
RETURNS TABLE(
  total_leads bigint,
  leads_contacted bigint,
  leads_not_contacted bigint,
  leads_with_active_app bigint,
  leads_needing_follow_up bigint,
  leads_actualizados bigint,
  total_applications bigint,
  submitted_applications bigint,
  complete_applications bigint,
  incomplete_applications bigint,
  draft_applications bigint,
  approved_applications bigint,
  rejected_applications bigint,
  contact_rate numeric,
  conversion_rate numeric,
  completion_rate numeric,
  approval_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_leads bigint;
    v_leads_contacted bigint;
    v_leads_not_contacted bigint;
    v_leads_with_active_app bigint;
    v_leads_needing_follow_up bigint;
    v_leads_actualizados bigint;
    v_total_applications bigint;
    v_submitted_applications bigint;
    v_complete_applications bigint;
    v_incomplete_applications bigint;
    v_draft_applications bigint;
    v_approved_applications bigint;
    v_rejected_applications bigint;
    v_contact_rate numeric;
    v_conversion_rate numeric;
    v_completion_rate numeric;
    v_approval_rate numeric;
BEGIN
    -- Get total leads assigned to this sales user
    SELECT COUNT(*)
    INTO v_total_leads
    FROM profiles
    WHERE asesor_asignado_id = p_sales_user_id
      AND role = 'user';

    -- Get leads contacted
    SELECT COUNT(*)
    INTO v_leads_contacted
    FROM profiles
    WHERE asesor_asignado_id = p_sales_user_id
      AND role = 'user'
      AND contactado = true;

    -- Get leads not contacted
    SELECT COUNT(*)
    INTO v_leads_not_contacted
    FROM profiles
    WHERE asesor_asignado_id = p_sales_user_id
      AND role = 'user'
      AND (contactado = false OR contactado IS NULL);

    -- Get leads with active application
    SELECT COUNT(DISTINCT p.id)
    INTO v_leads_with_active_app
    FROM profiles p
    INNER JOIN financing_applications fa ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = p_sales_user_id
      AND p.role = 'user'
      AND fa.status NOT IN ('draft', 'rejected', 'cancelled');

    -- Get leads needing follow up
    SELECT COUNT(*)
    INTO v_leads_needing_follow_up
    FROM profiles p
    WHERE p.asesor_asignado_id = p_sales_user_id
      AND p.role = 'user'
      AND (p.contactado = false OR p.contactado IS NULL)
      AND NOT EXISTS (
        SELECT 1
        FROM financing_applications fa
        WHERE fa.user_id = p.id
          AND fa.status NOT IN ('draft', 'rejected', 'cancelled')
      );

    -- Get leads actualizados (contacted with application)
    SELECT COUNT(DISTINCT p.id)
    INTO v_leads_actualizados
    FROM profiles p
    INNER JOIN financing_applications fa ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = p_sales_user_id
      AND p.role = 'user'
      AND p.contactado = true;

    -- Get total applications
    SELECT COUNT(*)
    INTO v_total_applications
    FROM financing_applications fa
    INNER JOIN profiles p ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = p_sales_user_id
      AND p.role = 'user';

    -- Get submitted applications (not draft)
    SELECT COUNT(*)
    INTO v_submitted_applications
    FROM financing_applications fa
    INNER JOIN profiles p ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = p_sales_user_id
      AND p.role = 'user'
      AND fa.status != 'draft';

    -- Get draft applications
    SELECT COUNT(*)
    INTO v_draft_applications
    FROM financing_applications fa
    INNER JOIN profiles p ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = p_sales_user_id
      AND p.role = 'user'
      AND fa.status = 'draft';

    -- Get approved applications
    SELECT COUNT(*)
    INTO v_approved_applications
    FROM financing_applications fa
    INNER JOIN profiles p ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = p_sales_user_id
      AND p.role = 'user'
      AND fa.status = 'approved';

    -- Get rejected applications
    SELECT COUNT(*)
    INTO v_rejected_applications
    FROM financing_applications fa
    INNER JOIN profiles p ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = p_sales_user_id
      AND p.role = 'user'
      AND fa.status = 'rejected';

    -- Calculate complete vs incomplete
    v_complete_applications := v_submitted_applications;
    v_incomplete_applications := v_draft_applications;

    -- Calculate rates
    v_contact_rate := CASE
        WHEN v_total_leads > 0 THEN (v_leads_contacted::numeric / v_total_leads::numeric) * 100
        ELSE 0
    END;

    v_conversion_rate := CASE
        WHEN v_total_leads > 0 THEN (v_leads_with_active_app::numeric / v_total_leads::numeric) * 100
        ELSE 0
    END;

    v_completion_rate := CASE
        WHEN v_total_applications > 0 THEN (v_complete_applications::numeric / v_total_applications::numeric) * 100
        ELSE 0
    END;

    v_approval_rate := CASE
        WHEN v_submitted_applications > 0 THEN (v_approved_applications::numeric / v_submitted_applications::numeric) * 100
        ELSE 0
    END;

    -- Return the metrics
    RETURN QUERY SELECT
        v_total_leads,
        v_leads_contacted,
        v_leads_not_contacted,
        v_leads_with_active_app,
        v_leads_needing_follow_up,
        v_leads_actualizados,
        v_total_applications,
        v_submitted_applications,
        v_complete_applications,
        v_incomplete_applications,
        v_draft_applications,
        v_approved_applications,
        v_rejected_applications,
        v_contact_rate,
        v_conversion_rate,
        v_completion_rate,
        v_approval_rate;
END;
$$;

ALTER FUNCTION get_sales_performance_metrics(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_sales_performance_metrics(uuid) TO authenticated;

COMMENT ON FUNCTION get_sales_performance_metrics(uuid) IS
'Returns comprehensive performance metrics for a sales user. Fixed parameter name to p_sales_user_id and removed asesor_autorizado_acceso constraint.';

-- ============================================================================
-- 2. get_sales_applications_by_status - VERSIÓN CORREGIDA
-- ============================================================================

DROP FUNCTION IF EXISTS get_sales_applications_by_status(uuid);

CREATE OR REPLACE FUNCTION get_sales_applications_by_status(p_sales_user_id uuid)
RETURNS TABLE(
    status text,
    count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fa.status,
        COUNT(*)::bigint as count
    FROM financing_applications fa
    INNER JOIN profiles p ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = p_sales_user_id
      AND p.role = 'user'
    GROUP BY fa.status
    ORDER BY count DESC;
END;
$$;

ALTER FUNCTION get_sales_applications_by_status(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_sales_applications_by_status(uuid) TO authenticated;

COMMENT ON FUNCTION get_sales_applications_by_status(uuid) IS
'Returns application counts grouped by status for a sales user. Fixed parameter name and removed asesor_autorizado_acceso constraint.';

-- ============================================================================
-- 3. get_sales_detailed_applications - VERSIÓN CORREGIDA
-- ============================================================================

DROP FUNCTION IF EXISTS get_sales_detailed_applications(uuid, text);

CREATE OR REPLACE FUNCTION get_sales_detailed_applications(
    p_sales_user_id uuid,
    p_status_filter text DEFAULT NULL
)
RETURNS TABLE(
    application_id uuid,
    application_status text,
    application_created_at timestamptz,
    application_updated_at timestamptz,
    document_count bigint,
    car_info jsonb,
    lead_id uuid,
    lead_name text,
    lead_email text,
    lead_phone text
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
        COALESCE((
            SELECT COUNT(*)
            FROM uploaded_documents ud
            WHERE ud.user_id = p.id
        ), 0)::bigint as document_count,
        fa.car_info,
        p.id as lead_id,
        CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) as lead_name,
        p.email as lead_email,
        p.phone as lead_phone
    FROM financing_applications fa
    INNER JOIN profiles p ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = p_sales_user_id
      AND p.role = 'user'
      AND (p_status_filter IS NULL OR fa.status = p_status_filter)
    ORDER BY fa.updated_at DESC;
END;
$$;

ALTER FUNCTION get_sales_detailed_applications(uuid, text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_sales_detailed_applications(uuid, text) TO authenticated;

COMMENT ON FUNCTION get_sales_detailed_applications(uuid, text) IS
'Returns detailed list of applications for a sales user with optional status filter. Fixed parameter names, removed asesor_autorizado_acceso constraint, and corrected document count query.';
