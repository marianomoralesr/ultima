-- Fixed version - resolves ambiguous column reference error
-- Run this to replace the existing functions

CREATE OR REPLACE FUNCTION get_purchase_leads_for_dashboard()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    status text,
    valuation_data jsonb,
    vehicle_info text,
    suggested_offer numeric,
    owner_count integer,
    key_info text,
    invoice_status text,
    financing_entity_type text,
    financing_entity_name text,
    vehicle_state text,
    plate_registration_state text,
    accident_history text,
    reason_for_selling text,
    additional_details text,
    exterior_photos text[],
    interior_photos text[],
    inspection_notes text,
    final_offer numeric,
    listing_url text,
    inspection_branch text,
    contacted boolean,
    asesor_asignado_id uuid,
    asesor_asignado text,
    created_at timestamptz,
    updated_at timestamptz,
    first_name text,
    last_name text,
    email text,
    phone text,
    tags jsonb
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user has admin or sales role
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'No autorizado: Solo los roles de admin y ventas pueden ver los leads de compra';
    END IF;

    RETURN QUERY
    SELECT
        uvfs.id AS id,
        uvfs.user_id AS user_id,
        uvfs.status AS status,
        uvfs.valuation_data AS valuation_data,
        (uvfs.valuation_data->'vehicle'->>'label')::text AS vehicle_info,
        (uvfs.valuation_data->'valuation'->>'suggestedOffer')::numeric AS suggested_offer,
        uvfs.owner_count AS owner_count,
        uvfs.key_info AS key_info,
        uvfs.invoice_status AS invoice_status,
        uvfs.financing_entity_type AS financing_entity_type,
        uvfs.financing_entity_name AS financing_entity_name,
        uvfs.vehicle_state AS vehicle_state,
        uvfs.plate_registration_state AS plate_registration_state,
        uvfs.accident_history AS accident_history,
        uvfs.reason_for_selling AS reason_for_selling,
        uvfs.additional_details AS additional_details,
        uvfs.exterior_photos AS exterior_photos,
        uvfs.interior_photos AS interior_photos,
        uvfs.inspection_notes AS inspection_notes,
        uvfs.final_offer AS final_offer,
        uvfs.listing_url AS listing_url,
        uvfs.inspection_branch AS inspection_branch,
        uvfs.contacted AS contacted,
        uvfs.asesor_asignado_id AS asesor_asignado_id,
        (SELECT profiles.first_name || ' ' || profiles.last_name FROM profiles WHERE profiles.id = uvfs.asesor_asignado_id) AS asesor_asignado,
        uvfs.created_at AS created_at,
        uvfs.updated_at AS updated_at,
        p.first_name AS first_name,
        p.last_name AS last_name,
        p.email AS email,
        p.phone AS phone,
        COALESCE(uvfs.tags, '[]'::jsonb) AS tags
    FROM user_vehicles_for_sale uvfs
    LEFT JOIN profiles p ON uvfs.user_id = p.id
    ORDER BY uvfs.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_purchase_lead_details(listing_id uuid)
RETURNS json
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    -- Check if user has admin or sales role
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'No autorizado: Solo los roles de admin y ventas pueden ver los detalles del lead';
    END IF;

    SELECT json_build_object(
        'id', uvfs.id,
        'user_id', uvfs.user_id,
        'status', uvfs.status,
        'valuation_data', uvfs.valuation_data,
        'owner_count', uvfs.owner_count,
        'key_info', uvfs.key_info,
        'invoice_status', uvfs.invoice_status,
        'financing_entity_type', uvfs.financing_entity_type,
        'financing_entity_name', uvfs.financing_entity_name,
        'vehicle_state', uvfs.vehicle_state,
        'plate_registration_state', uvfs.plate_registration_state,
        'accident_history', uvfs.accident_history,
        'reason_for_selling', uvfs.reason_for_selling,
        'additional_details', uvfs.additional_details,
        'exterior_photos', uvfs.exterior_photos,
        'interior_photos', uvfs.interior_photos,
        'inspection_notes', uvfs.inspection_notes,
        'final_offer', uvfs.final_offer,
        'listing_url', uvfs.listing_url,
        'inspection_branch', uvfs.inspection_branch,
        'contacted', uvfs.contacted,
        'asesor_asignado_id', uvfs.asesor_asignado_id,
        'created_at', uvfs.created_at,
        'updated_at', uvfs.updated_at,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'email', p.email,
        'phone', p.phone,
        'tags', COALESCE(uvfs.tags, '[]'::jsonb)
    ) INTO result
    FROM user_vehicles_for_sale uvfs
    LEFT JOIN profiles p ON uvfs.user_id = p.id
    WHERE uvfs.id = listing_id;

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_compras_dashboard_stats()
RETURNS TABLE (
    total_leads bigint,
    in_inspection bigint,
    offer_made bigint,
    completed bigint
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user has admin or sales role
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'No autorizado: Solo los roles de admin y ventas pueden ver las estadísticas';
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*)::bigint AS total_leads,
        COUNT(*) FILTER (WHERE user_vehicles_for_sale.status = 'in_inspection')::bigint AS in_inspection,
        COUNT(*) FILTER (WHERE user_vehicles_for_sale.status = 'offer_made')::bigint AS offer_made,
        COUNT(*) FILTER (WHERE user_vehicles_for_sale.status = 'completed')::bigint AS completed
    FROM user_vehicles_for_sale;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_purchase_leads_for_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_lead_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_compras_dashboard_stats() TO authenticated;
