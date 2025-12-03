-- ============================================================================
-- FIX FINAL: Funciones RPC de Sales con estructura correcta
-- ============================================================================
-- Basado en la versión que funcionaba (20251115000004)
-- PERO sin el constraint asesor_autorizado_acceso
-- Y usando nombres de parámetros con prefijo p_ para evitar ambigüedad
-- ============================================================================

-- ============================================================================
-- 1. get_sales_assigned_leads - VERSIÓN CORREGIDA
-- ============================================================================

DROP FUNCTION IF EXISTS get_sales_assigned_leads(uuid);

CREATE OR REPLACE FUNCTION get_sales_assigned_leads(p_sales_user_id uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  contactado boolean,
  asesor_asignado text,
  latest_app_status text,
  latest_app_car_info jsonb,
  asesor_asignado_id uuid,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  rfdm text,
  referrer text,
  landing_page text,
  first_visit_at timestamptz,
  latest_app_id uuid,
  documents jsonb,
  bank_profile_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        COALESCE(asesor.email, '')::text as asesor_asignado,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info,
        p.asesor_asignado_id,
        p.last_sign_in_at,
        p.created_at,
        p.updated_at,
        p.utm_source,
        p.utm_medium,
        p.utm_campaign,
        p.utm_term,
        p.utm_content,
        p.rfdm,
        p.referrer,
        p.landing_page,
        p.first_visit_at,
        latest_app.id as latest_app_id,
        COALESCE(docs.documents, '[]'::jsonb) as documents,
        p.bank_profile_data
    FROM profiles p
    LEFT JOIN profiles asesor ON asesor.id = p.asesor_asignado_id
    LEFT JOIN LATERAL (
        SELECT fa.id, fa.status, fa.car_info
        FROM financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    LEFT JOIN LATERAL (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', d.id,
                'document_type', d.document_type,
                'file_path', d.file_path,
                'status', d.status,
                'created_at', d.created_at
            )
        ) as documents
        FROM uploaded_documents d
        WHERE d.user_id = p.id
    ) docs ON true
    WHERE p.role = 'user'
      AND p.asesor_asignado_id = p_sales_user_id
      -- REMOVED: AND p.asesor_autorizado_acceso = true
    ORDER BY p.created_at DESC;
END;
$$;

ALTER FUNCTION get_sales_assigned_leads(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_sales_assigned_leads(uuid) TO authenticated;

COMMENT ON FUNCTION get_sales_assigned_leads(uuid) IS
'[FIXED FINAL] Returns all leads assigned to a sales user WITHOUT asesor_autorizado_acceso constraint. Uses correct field names from working version.';

-- ============================================================================
-- 2. get_sales_dashboard_stats - VERSIÓN CORREGIDA
-- ============================================================================

DROP FUNCTION IF EXISTS get_sales_dashboard_stats(uuid);

CREATE OR REPLACE FUNCTION get_sales_dashboard_stats(p_sales_user_id uuid)
RETURNS TABLE(
    total_leads bigint,
    leads_with_active_app bigint,
    leads_with_unfinished_app bigint,
    leads_needing_follow_up bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::bigint as total_leads,
        COUNT(CASE
            WHEN latest_app.status IS NOT NULL
                AND latest_app.status NOT IN ('draft', 'rejected', 'cancelled')
            THEN 1
        END)::bigint as leads_with_active_app,
        COUNT(CASE
            WHEN latest_app.status = 'draft'
            THEN 1
        END)::bigint as leads_with_unfinished_app,
        COUNT(CASE
            WHEN p.contactado = false OR p.contactado IS NULL
            THEN 1
        END)::bigint as leads_needing_follow_up
    FROM profiles p
    LEFT JOIN LATERAL (
        SELECT fa.status
        FROM financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.role = 'user'
      AND p.asesor_asignado_id = p_sales_user_id;
      -- REMOVED: AND p.asesor_autorizado_acceso = true
END;
$$;

ALTER FUNCTION get_sales_dashboard_stats(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_sales_dashboard_stats(uuid) TO authenticated;

-- ============================================================================
-- Verificar creación
-- ============================================================================

SELECT
    'Funciones actualizadas correctamente:' as mensaje,
    routine_name,
    pg_get_function_arguments(p.oid) as parametros
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public'
  AND routine_name IN ('get_sales_assigned_leads', 'get_sales_dashboard_stats')
ORDER BY routine_name;
