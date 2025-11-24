-- Fix: Update get_secure_client_profile to use uploaded_documents instead of documents
-- The table was renamed from documents to uploaded_documents but the function still references the old name

CREATE OR REPLACE FUNCTION public.get_secure_client_profile(client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    current_user_role text;
    current_user_id uuid;
BEGIN
    -- Get current user info from JWT
    current_user_id := auth.uid();
    SELECT role INTO current_user_role FROM profiles WHERE id = current_user_id;

    -- Admin can see everything
    IF current_user_role = 'admin' THEN
        -- Return full profile with related data
        SELECT jsonb_build_object(
            'profile', to_jsonb(p.*),
            'applications', COALESCE(
                (SELECT jsonb_agg(to_jsonb(fa.*))
                 FROM financing_applications fa
                 WHERE fa.user_id = client_id
                 ORDER BY fa.created_at DESC),
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
                 FROM uploaded_documents d
                 WHERE d.user_id = client_id
                 ORDER BY d.created_at DESC),
                '[]'::jsonb
            )
        ) INTO result
        FROM profiles p
        WHERE p.id = client_id;

        RETURN result;
    END IF;

    -- Sales can see only if they are assigned and access is authorized
    IF current_user_role = 'sales' THEN
        -- Check if current user is assigned to this lead AND access is authorized
        IF EXISTS (
            SELECT 1 FROM profiles
            WHERE id = client_id
              AND asesor_asignado_id = current_user_id
              AND autorizar_asesor_acceso = true
        ) THEN
            -- Return full profile
            SELECT jsonb_build_object(
                'profile', to_jsonb(p.*),
                'applications', COALESCE(
                    (SELECT jsonb_agg(to_jsonb(fa.*))
                     FROM financing_applications fa
                     WHERE fa.user_id = client_id
                     ORDER BY fa.created_at DESC),
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
                     FROM uploaded_documents d
                     WHERE d.user_id = client_id
                     ORDER BY d.created_at DESC),
                    '[]'::jsonb
                )
            ) INTO result
            FROM profiles p
            WHERE p.id = client_id;

            RETURN result;
        ELSE
            -- Not authorized - return null or minimal info
            RETURN NULL;
        END IF;
    END IF;

    -- User role can only see their own profile
    IF current_user_role = 'user' AND current_user_id = client_id THEN
        SELECT jsonb_build_object(
            'profile', to_jsonb(p.*),
            'applications', COALESCE(
                (SELECT jsonb_agg(to_jsonb(fa.*))
                 FROM financing_applications fa
                 WHERE fa.user_id = client_id
                 ORDER BY fa.created_at DESC),
                '[]'::jsonb
            ),
            'reminders', '[]'::jsonb,  -- Users don't see reminders
            'documents', COALESCE(
                (SELECT jsonb_agg(to_jsonb(d.*))
                 FROM uploaded_documents d
                 WHERE d.user_id = client_id
                 ORDER BY d.created_at DESC),
                '[]'::jsonb
            )
        ) INTO result
        FROM profiles p
        WHERE p.id = client_id;

        RETURN result;
    END IF;

    -- Default: no access
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.get_secure_client_profile(uuid) IS
'Securely retrieves client profile with related data based on role. Uses uploaded_documents table.';
