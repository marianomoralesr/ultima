-- Fix get_secure_client_profile function with role-based authentication
-- This removes the hardcoded email list and uses role from profiles table

DROP FUNCTION IF EXISTS get_secure_client_profile(uuid);

CREATE OR REPLACE FUNCTION get_secure_client_profile(client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    caller_role text;
BEGIN
    -- Get caller's role from profiles table (not hardcoded emails)
    SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();

    -- Only admins can access
    IF caller_role IS NULL OR caller_role != 'admin' THEN
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

GRANT EXECUTE ON FUNCTION get_secure_client_profile(uuid) TO authenticated;

COMMENT ON FUNCTION get_secure_client_profile(uuid) IS
'Returns complete client profile with applications, tags, reminders, and documents. Includes advisor name. Only accessible to users with admin role. Uses SECURITY DEFINER to bypass RLS.';

-- Verify all admin users
SELECT id, email, role FROM profiles WHERE role = 'admin';
