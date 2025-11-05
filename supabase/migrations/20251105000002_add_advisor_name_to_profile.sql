-- Add advisor name to get_secure_client_profile function
-- This fixes the issue where asesor_asignado_id shows as UUID instead of name

DROP FUNCTION IF EXISTS get_secure_client_profile(uuid);

CREATE OR REPLACE FUNCTION get_secure_client_profile(client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    caller_email text;
    is_admin boolean;
BEGIN
    -- Get caller's email from JWT
    caller_email := auth.jwt()->>'email';

    -- Check if caller is admin
    is_admin := caller_email IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com'
    );

    -- If not admin, return null
    IF NOT is_admin THEN
        RETURN NULL;
    END IF;

    -- Build result with profile and related data, including advisor name
    SELECT jsonb_build_object(
        'profile', jsonb_build_object(
            'id', p.id,
            'email', p.email,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'mother_last_name', p.mother_last_name,
            'phone', p.phone,
            'role', p.role,
            'civil_status', p.civil_status,
            'date_of_birth', p.date_of_birth,
            'curp', p.curp,
            'rfc', p.rfc,
            'address', p.address,
            'picture_url', p.picture_url,
            'asesor_autorizado_acceso', p.asesor_autorizado_acceso,
            'asesor_asignado_id', p.asesor_asignado_id,
            'asesor_asignado_name', COALESCE(
                asesor.first_name || ' ' || asesor.last_name,
                'Sin asignar'
            ),
            'last_assigned_at', p.last_assigned_at,
            'metadata', p.metadata,
            'source', p.source,
            'contactado', p.contactado,
            'spouse_name', p.spouse_name,
            'created_at', p.created_at,
            'updated_at', p.updated_at
        ),
        'applications', COALESCE(
            (SELECT jsonb_agg(to_jsonb(fa.*) ORDER BY fa.created_at DESC)
             FROM financing_applications fa
             WHERE fa.user_id = client_id),
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
             WHERE lta.lead_id = client_id),
            '[]'::jsonb
        ),
        'reminders', COALESCE(
            (SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.reminder_date ASC)
             FROM lead_reminders r
             WHERE r.lead_id = client_id),
            '[]'::jsonb
        ),
        'documents', COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*) ORDER BY d.created_at DESC)
             FROM uploaded_documents d
             WHERE d.user_id = client_id),
            '[]'::jsonb
        )
    ) INTO result
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    WHERE p.id = client_id;

    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_secure_client_profile(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_secure_client_profile(uuid) IS
'Returns complete client profile with applications, tags, reminders, and documents. Includes advisor name when available. Only accessible to admin users (by email from JWT). Uses SECURITY DEFINER to bypass RLS.';
