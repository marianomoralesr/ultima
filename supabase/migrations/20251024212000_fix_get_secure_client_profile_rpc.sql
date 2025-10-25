-- Fix get_secure_client_profile RPC function to work with new RLS policies
-- Uses SECURITY DEFINER to bypass RLS while checking admin email from JWT

-- Drop existing function
DROP FUNCTION IF EXISTS get_secure_client_profile(uuid);

-- Recreate with SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_secure_client_profile(client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS
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
            (SELECT jsonb_agg(to_jsonb(fa.*))
             FROM financing_applications fa
             WHERE fa.user_id = client_id
             ORDER BY fa.created_at DESC),
            '[]'::jsonb
        ),
        'tags', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', lt.tag_id,
                'tag_name', t.tag_name,
                'color', t.color
            ))
             FROM lead_tags lt
             JOIN tags t ON t.id = lt.tag_id
             WHERE lt.lead_id = client_id),
            '[]'::jsonb
        ),
        'reminders', COALESCE(
            (SELECT jsonb_agg(to_jsonb(r.*))
             FROM reminders r
             WHERE r.lead_id = client_id
             ORDER BY r.reminder_date ASC),
            '[]'::jsonb
        ),
        'documents', COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*))
             FROM documents d
             WHERE d.user_id = client_id
             ORDER BY d.created_at DESC),
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
'Returns complete client profile with applications, tags, reminders, and documents. Only accessible to admin users (by email from JWT). Uses SECURITY DEFINER to bypass RLS.';
