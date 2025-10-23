-- Add columns to user_vehicles_for_sale table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_vehicles_for_sale' AND column_name = 'contacted') THEN
        ALTER TABLE user_vehicles_for_sale ADD COLUMN contacted boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_vehicles_for_sale' AND column_name = 'asesor_asignado_id') THEN
        ALTER TABLE user_vehicles_for_sale ADD COLUMN asesor_asignado_id uuid REFERENCES profiles(id);
    END IF;
END $$;

-- Create function to get purchase leads for dashboard with enriched user data
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
        RAISE EXCEPTION 'Unauthorized: Only admin and sales roles can view purchase leads';
    END IF;

    RETURN QUERY
    SELECT
        uvfs.id,
        uvfs.user_id,
        uvfs.status,
        uvfs.valuation_data,
        (uvfs.valuation_data->'vehicle'->>'label')::text as vehicle_info,
        (uvfs.valuation_data->'valuation'->>'suggestedOffer')::numeric as suggested_offer,
        uvfs.owner_count,
        uvfs.key_info,
        uvfs.invoice_status,
        uvfs.financing_entity_type,
        uvfs.financing_entity_name,
        uvfs.vehicle_state,
        uvfs.plate_registration_state,
        uvfs.accident_history,
        uvfs.reason_for_selling,
        uvfs.additional_details,
        uvfs.exterior_photos,
        uvfs.interior_photos,
        uvfs.inspection_notes,
        uvfs.final_offer,
        uvfs.listing_url,
        uvfs.inspection_branch,
        uvfs.contacted,
        uvfs.asesor_asignado_id,
        (SELECT first_name || ' ' || last_name FROM profiles WHERE id = uvfs.asesor_asignado_id) as asesor_asignado,
        uvfs.created_at,
        uvfs.updated_at,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', lt.id,
                    'tag_name', lt.tag_name,
                    'color', lt.color
                )
            )
            FROM lead_tag_associations lta
            JOIN lead_tags lt ON lta.tag_id = lt.id
            WHERE lta.lead_id = uvfs.user_id
        ), '[]'::jsonb) as tags
    FROM user_vehicles_for_sale uvfs
    LEFT JOIN profiles p ON uvfs.user_id = p.id
    ORDER BY uvfs.created_at DESC;
END;
$$;

-- Create function to get purchase lead details
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
        RAISE EXCEPTION 'Unauthorized: Only admin and sales roles can view purchase lead details';
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
        'tags', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', lt.id,
                    'tag_name', lt.tag_name,
                    'color', lt.color
                )
            )
            FROM lead_tag_associations lta
            JOIN lead_tags lt ON lta.tag_id = lt.id
            WHERE lta.lead_id = uvfs.user_id
        ), '[]'::jsonb)
    ) INTO result
    FROM user_vehicles_for_sale uvfs
    LEFT JOIN profiles p ON uvfs.user_id = p.id
    WHERE uvfs.id = listing_id;

    RETURN result;
END;
$$;

-- Create function to get dashboard stats
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
        RAISE EXCEPTION 'Unauthorized: Only admin and sales roles can view dashboard stats';
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*)::bigint as total_leads,
        COUNT(*) FILTER (WHERE status = 'in_inspection')::bigint as in_inspection,
        COUNT(*) FILTER (WHERE status = 'offer_made')::bigint as offer_made,
        COUNT(*) FILTER (WHERE status = 'completed')::bigint as completed
    FROM user_vehicles_for_sale;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_purchase_leads_for_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_lead_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_compras_dashboard_stats() TO authenticated;

-- Create config entry for Kommo webhook if it doesn't exist
INSERT INTO app_config (key, value)
VALUES (
    'kommo_webhook_url',
    '""'::jsonb
)
ON CONFLICT (key) DO NOTHING;
