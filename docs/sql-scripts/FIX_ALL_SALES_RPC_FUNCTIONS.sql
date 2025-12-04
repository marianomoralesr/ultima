-- ============================================================================
-- FIX: Actualizar TODAS las funciones RPC de sales con nombres de parámetros
-- ============================================================================
-- Problema: Ambigüedad de columnas en funciones RPC
-- Solución: Usar prefijo p_ en TODOS los parámetros
-- ============================================================================

-- ============================================================================
-- 1. get_sales_dashboard_stats
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
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::bigint as total_leads,
        COUNT(CASE
            WHEN EXISTS (
                SELECT 1 FROM financing_applications fa
                WHERE fa.user_id = p.id
                AND fa.status NOT IN ('draft', 'rejected', 'cancelled')
            ) THEN 1
        END)::bigint as leads_with_active_app,
        COUNT(CASE
            WHEN EXISTS (
                SELECT 1 FROM financing_applications fa
                WHERE fa.user_id = p.id
                AND fa.status = 'draft'
            ) THEN 1
        END)::bigint as leads_with_unfinished_app,
        COUNT(CASE WHEN p.contactado = false OR p.contactado IS NULL THEN 1 END)::bigint as leads_needing_follow_up
    FROM profiles p
    WHERE p.role = 'user'
      AND p.asesor_asignado_id = p_sales_user_id;
END;
$$;

ALTER FUNCTION get_sales_dashboard_stats(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_sales_dashboard_stats(uuid) TO authenticated;

-- ============================================================================
-- 2. get_sales_client_profile
-- ============================================================================

DROP FUNCTION IF EXISTS get_sales_client_profile(uuid, uuid);

CREATE OR REPLACE FUNCTION get_sales_client_profile(p_client_id uuid, p_sales_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Check if sales user has access to this client
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = p_client_id
          AND role = 'user'
          AND asesor_asignado_id = p_sales_user_id
    ) THEN
        RETURN NULL; -- No access
    END IF;

    -- Get complete client profile with related data
    SELECT jsonb_build_object(
        'profile', to_jsonb(p.*),
        'applications', COALESCE(
            (SELECT jsonb_agg(to_jsonb(fa.*))
             FROM financing_applications fa
             WHERE fa.user_id = p.id
             ORDER BY fa.created_at DESC),
            '[]'::jsonb
        ),
        'documents', COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*))
             FROM uploaded_documents d
             WHERE d.user_id = p.id),
            '[]'::jsonb
        ),
        'bank_profile', to_jsonb(bp.*),
        'tags', COALESCE(
            (SELECT jsonb_agg(to_jsonb(lt.*))
             FROM lead_tag_associations lta
             JOIN lead_tags lt ON lt.id = lta.tag_id
             WHERE lta.lead_id = p.id),
            '[]'::jsonb
        ),
        'reminders', COALESCE(
            (SELECT jsonb_agg(to_jsonb(lr.*))
             FROM lead_reminders lr
             WHERE lr.lead_id = p.id
             ORDER BY lr.reminder_date DESC),
            '[]'::jsonb
        )
    )
    INTO result
    FROM profiles p
    LEFT JOIN bank_profiles bp ON bp.user_id = p.id
    WHERE p.id = p_client_id;

    RETURN result;
END;
$$;

ALTER FUNCTION get_sales_client_profile(uuid, uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_sales_client_profile(uuid, uuid) TO authenticated;

-- ============================================================================
-- 3. verify_sales_access_to_lead
-- ============================================================================

DROP FUNCTION IF EXISTS verify_sales_access_to_lead(uuid, uuid);

CREATE OR REPLACE FUNCTION verify_sales_access_to_lead(p_lead_id uuid, p_sales_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = p_lead_id
          AND role = 'user'
          AND asesor_asignado_id = p_sales_user_id
    );
END;
$$;

ALTER FUNCTION verify_sales_access_to_lead(uuid, uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION verify_sales_access_to_lead(uuid, uuid) TO authenticated;

-- ============================================================================
-- Verificar que todas se crearon correctamente
-- ============================================================================

SELECT
    routine_name,
    pg_get_function_arguments(p.oid) as parameters,
    '✅ Función actualizada' as status
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_sales_assigned_leads',
    'get_sales_dashboard_stats',
    'get_sales_client_profile',
    'verify_sales_access_to_lead'
  )
ORDER BY routine_name;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Deberías ver 4 funciones con sus nuevos parámetros:
-- - get_sales_assigned_leads(p_sales_user_id uuid)
-- - get_sales_dashboard_stats(p_sales_user_id uuid)
-- - get_sales_client_profile(p_client_id uuid, p_sales_user_id uuid)
-- - verify_sales_access_to_lead(p_lead_id uuid, p_sales_user_id uuid)
-- ============================================================================
