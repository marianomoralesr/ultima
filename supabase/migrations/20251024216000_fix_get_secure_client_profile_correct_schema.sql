-- Fix get_secure_client_profile to use correct table names
-- The schema has: lead_tags (tag definitions) and lead_tag_associations (lead-to-tag mapping)
-- NOT a separate "tags" table

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

    -- Build result with profile and related data
    SELECT jsonb_build_object(
        'profile', to_jsonb(p.*),
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
    WHERE p.id = client_id;

    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_secure_client_profile(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_secure_client_profile(uuid) IS
'Returns complete client profile with applications, tags, reminders, and documents. Only accessible to admin users (by email from JWT). Uses SECURITY DEFINER to bypass RLS. Fixed to use correct table names: lead_tags, lead_tag_associations, lead_reminders, uploaded_documents.';
