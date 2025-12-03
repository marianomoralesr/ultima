-- ============================================================================
-- FIX: get_sales_assigned_leads - Resolver ambigüedad de columnas
-- ============================================================================
-- Error: column reference "id" is ambiguous
-- Causa: La función tiene parámetros que pueden confundirse con columnas
-- Solución: Usar nombres de parámetros únicos y cualificar todas las referencias
-- ============================================================================

DROP FUNCTION IF EXISTS get_sales_assigned_leads(uuid);

CREATE OR REPLACE FUNCTION get_sales_assigned_leads(p_sales_user_id uuid)
RETURNS TABLE(
    id uuid,
    email text,
    first_name text,
    last_name text,
    mother_last_name text,
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
    latest_app_submitted boolean,
    latest_app_car_info jsonb,
    documents jsonb,
    bank_profile_data jsonb,
    rfc text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
        latest_app.id as latest_app_id,
        latest_app.submitted as latest_app_submitted,
        latest_app.car_info as latest_app_car_info,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*))
             FROM uploaded_documents d
             WHERE d.user_id = p.id),
            '[]'::jsonb
        ) as documents,
        to_jsonb(bp.*) as bank_profile_data,
        p.rfc
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    LEFT JOIN LATERAL (
        SELECT fa.id, fa.status, fa.submitted, fa.car_info
        FROM financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    LEFT JOIN bank_profiles bp ON bp.user_id = p.id
    WHERE p.asesor_asignado_id = p_sales_user_id  -- ✅ Usando prefijo p_ para el parámetro
      AND p.role = 'user'
      -- REMOVED: AND COALESCE(p.asesor_autorizado_acceso, false) = true
    ORDER BY p.created_at DESC;
END;
$$;

ALTER FUNCTION get_sales_assigned_leads(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_sales_assigned_leads(uuid) TO authenticated;

COMMENT ON FUNCTION get_sales_assigned_leads(uuid) IS
'[FIXED] Returns all leads assigned to a sales user WITHOUT asesor_autorizado_acceso constraint. Fixed ambiguous column reference error.';

-- ============================================================================
-- Verificar que se creó correctamente
-- ============================================================================

SELECT
    routine_name,
    routine_type,
    data_type,
    'Función recreada correctamente' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_sales_assigned_leads';
