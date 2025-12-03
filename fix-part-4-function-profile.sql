-- PARTE 4: Actualizar funciones get_sales_client_profile y verify_sales_access_to_lead
DROP FUNCTION IF EXISTS get_sales_client_profile(uuid, uuid);
CREATE OR REPLACE FUNCTION get_sales_client_profile(client_id uuid, sales_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    has_access boolean;
BEGIN
    SELECT (p.asesor_asignado_id = sales_user_id)
    INTO has_access
    FROM profiles p
    WHERE p.id = client_id AND p.role = 'user';

    IF NOT COALESCE(has_access, false) THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object(
        'profile', to_jsonb(p.*) || jsonb_build_object(
            'asesor_asignado_name', COALESCE(asesor.first_name || ' ' || asesor.last_name, 'Sin asignar')
        ),
        'applications', COALESCE(
            (SELECT jsonb_agg(to_jsonb(fa.*) ORDER BY fa.created_at DESC)
             FROM financing_applications fa WHERE fa.user_id = client_id), '[]'::jsonb
        ),
        'tags', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('id', lta.tag_id, 'tag_name', lt.tag_name, 'color', lt.color))
             FROM lead_tag_associations lta
             JOIN lead_tags lt ON lt.id = lta.tag_id WHERE lta.lead_id = client_id), '[]'::jsonb
        ),
        'reminders', COALESCE(
            (SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.reminder_date ASC)
             FROM lead_reminders r WHERE r.lead_id = client_id), '[]'::jsonb
        ),
        'documents', COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*) ORDER BY d.created_at DESC)
             FROM uploaded_documents d WHERE d.user_id = client_id), '[]'::jsonb
        ),
        'bank_profile', COALESCE(
            (SELECT to_jsonb(bp.*) FROM bank_profiles bp WHERE bp.user_id = client_id), 'null'::jsonb
        )
    ) INTO result
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    WHERE p.id = client_id;

    RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION get_sales_client_profile(uuid, uuid) TO authenticated;

DROP FUNCTION IF EXISTS verify_sales_access_to_lead(uuid, uuid);
CREATE OR REPLACE FUNCTION verify_sales_access_to_lead(lead_id uuid, sales_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    has_access boolean;
BEGIN
    SELECT (p.asesor_asignado_id = sales_user_id)
    INTO has_access
    FROM profiles p
    WHERE p.id = lead_id AND p.role = 'user';

    RETURN COALESCE(has_access, false);
END;
$$;
GRANT EXECUTE ON FUNCTION verify_sales_access_to_lead(uuid, uuid) TO authenticated;
