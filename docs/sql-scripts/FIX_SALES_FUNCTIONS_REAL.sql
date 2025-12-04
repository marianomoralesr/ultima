-- ============================================================================
-- FIX REAL: Funciones RPC con SOLO los campos que existen
-- ============================================================================
-- Basado en la estructura REAL de las tablas de la migración 20251020121153
-- SIN campos inventados
-- ============================================================================

-- ============================================================================
-- 1. get_sales_assigned_leads - VERSIÓN CON CAMPOS REALES
-- ============================================================================

DROP FUNCTION IF EXISTS get_sales_assigned_leads(uuid);

CREATE OR REPLACE FUNCTION get_sales_assigned_leads(p_sales_user_id uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  mother_last_name text,
  email text,
  phone text,
  source text,
  contactado boolean,
  asesor_asignado_id uuid,
  asesor_asignado text,
  asesor_autorizado_acceso boolean,
  created_at timestamptz,
  metadata jsonb,
  latest_app_status text,
  latest_app_id uuid,
  latest_app_car_info jsonb,
  documents jsonb,
  rfc text
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
        p.mother_last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        p.asesor_asignado_id,
        COALESCE(asesor.email, 'No asignado')::text as asesor_asignado,
        COALESCE(p.asesor_autorizado_acceso, false) as asesor_autorizado_acceso,
        p.created_at,
        p.metadata,
        latest_app.status as latest_app_status,
        latest_app.id as latest_app_id,
        latest_app.car_info as latest_app_car_info,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*))
             FROM uploaded_documents d
             WHERE d.user_id = p.id),
            '[]'::jsonb
        ) as documents,
        p.rfc
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    LEFT JOIN LATERAL (
        SELECT fa.id, fa.status, fa.car_info
        FROM financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.asesor_asignado_id = p_sales_user_id
      AND p.role = 'user'
      -- REMOVED: AND COALESCE(p.asesor_autorizado_acceso, false) = true
    ORDER BY p.created_at DESC;
END;
$$;

ALTER FUNCTION get_sales_assigned_leads(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_sales_assigned_leads(uuid) TO authenticated;

COMMENT ON FUNCTION get_sales_assigned_leads(uuid) IS
'[FIXED REAL] Returns all leads assigned to a sales user WITHOUT asesor_autorizado_acceso constraint. Uses ONLY fields that exist in the schema.';

-- ============================================================================
-- 2. get_sales_dashboard_stats - VERSIÓN CON CAMPOS REALES
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
      -- REMOVED: AND COALESCE(p.asesor_autorizado_acceso, false) = true
END;
$$;

ALTER FUNCTION get_sales_dashboard_stats(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_sales_dashboard_stats(uuid) TO authenticated;

-- ============================================================================
-- 3. get_sales_client_profile - VERSIÓN CON CAMPOS REALES
-- ============================================================================

DROP FUNCTION IF EXISTS get_sales_client_profile(uuid, uuid);

CREATE OR REPLACE FUNCTION get_sales_client_profile(p_client_id uuid, p_sales_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
        RETURN NULL;
    END IF;

    -- Get complete client profile
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
-- 4. verify_sales_access_to_lead - VERSIÓN SIMPLE
-- ============================================================================

DROP FUNCTION IF EXISTS verify_sales_access_to_lead(uuid, uuid);

CREATE OR REPLACE FUNCTION verify_sales_access_to_lead(p_lead_id uuid, p_sales_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
-- Verificar creación
-- ============================================================================

SELECT
    '✅ Funciones actualizadas:' as mensaje,
    routine_name,
    pg_get_function_arguments(p.oid) as parametros
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
