-- Fix GROUP BY error in get_sales_client_profile function
-- Error: column "fa.created_at" must appear in the GROUP BY clause or be used in an aggregate function

DROP FUNCTION IF EXISTS get_sales_client_profile(uuid, uuid);

CREATE OR REPLACE FUNCTION get_sales_client_profile(p_client_id uuid, p_sales_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    has_access boolean;
BEGIN
    -- Check if sales user has access to this client (remove asesor_autorizado_acceso constraint)
    SELECT
        (p.asesor_asignado_id = p_sales_user_id)
    INTO has_access
    FROM profiles p
    WHERE p.id = p_client_id;

    -- If no access, return null
    IF NOT has_access THEN
        RETURN NULL;
    END IF;

    -- Build result with profile and related data
    SELECT jsonb_build_object(
        'profile', to_jsonb(p.*) || jsonb_build_object(
            'asesor_asignado_name', COALESCE(
                asesor.first_name || ' ' || asesor.last_name,
                'Sin asignar'
            )
        ),
        'applications', COALESCE(
            (SELECT jsonb_agg(
                to_jsonb(fa.*)
                ORDER BY (fa.created_at) DESC
             )
             FROM financing_applications fa
             WHERE fa.user_id = p_client_id),
            '[]'::jsonb
        ),
        'tags', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', lta.tag_id,
                'tag_name', lt.tag_name,
                'color', lt.color
            ))
             FROM lead_tag_associations lta
             JOIN lead_tags lt ON lt.id = lta.tag_id
             WHERE lta.lead_id = p_client_id),
            '[]'::jsonb
        ),
        'reminders', COALESCE(
            (SELECT jsonb_agg(
                to_jsonb(r.*)
                ORDER BY (r.reminder_date) ASC
             )
             FROM lead_reminders r
             WHERE r.lead_id = p_client_id),
            '[]'::jsonb
        ),
        'documents', COALESCE(
            (SELECT jsonb_agg(
                to_jsonb(d.*)
                ORDER BY (d.created_at) DESC
             )
             FROM uploaded_documents d
             WHERE d.user_id = p_client_id),
            '[]'::jsonb
        ),
        'bank_profile', COALESCE(
            (SELECT to_jsonb(bp.*)
             FROM bank_profiles bp
             WHERE bp.user_id = p_client_id
             LIMIT 1),
            '{}'::jsonb
        )
    ) INTO result
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    WHERE p.id = p_client_id;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_sales_client_profile(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION get_sales_client_profile(uuid, uuid) IS
'Returns complete client profile if sales user has authorized access (asesor_asignado_id matches). Removed asesor_autorizado_acceso constraint.';
