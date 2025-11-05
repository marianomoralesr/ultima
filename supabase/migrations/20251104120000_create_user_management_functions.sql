-- Migration: Create User Management Functions
-- Description: This migration creates RPC functions for admin user management interface
-- including functions to get sales users with analytics, create new sales users, and manage user status

-- ===================================
-- Function: get_sales_users_with_analytics
-- Description: Returns all sales users with their performance metrics
-- ===================================

DROP FUNCTION IF EXISTS public.get_sales_users_with_analytics();

CREATE OR REPLACE FUNCTION public.get_sales_users_with_analytics()
RETURNS TABLE(
    id uuid,
    email text,
    first_name text,
    last_name text,
    phone text,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    last_assigned_at timestamptz,
    leads_assigned bigint,
    leads_contacted bigint,
    leads_with_applications bigint,
    is_overloaded boolean,
    is_active boolean
) AS $$
BEGIN
    -- Ensure only admins can call this function
    IF public.get_my_role() != 'admin' THEN
        RAISE EXCEPTION 'No autorizado. Se requiere rol de administrador.';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.first_name,
        p.last_name,
        p.phone,
        p.created_at,
        p.last_sign_in_at,
        p.last_assigned_at,
        -- Count leads assigned to this sales agent
        COALESCE((
            SELECT COUNT(*)::bigint
            FROM public.profiles leads
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
        ), 0) AS leads_assigned,
        -- Count contacted leads
        COALESCE((
            SELECT COUNT(*)::bigint
            FROM public.profiles leads
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
            AND (leads.contactado = true OR leads.metadata->>'contactado' = 'true')
        ), 0) AS leads_contacted,
        -- Count leads with active applications
        COALESCE((
            SELECT COUNT(DISTINCT fa.user_id)::bigint
            FROM public.financing_applications fa
            INNER JOIN public.profiles leads ON leads.id = fa.user_id
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
            AND fa.status != 'draft'
        ), 0) AS leads_with_applications,
        -- Check if overloaded (more than 20 uncontacted leads)
        CASE WHEN (
            SELECT COUNT(*)
            FROM public.profiles leads
            WHERE leads.asesor_asignado_id = p.id
            AND leads.role = 'user'
            AND (leads.contactado IS NULL OR leads.contactado = false)
            AND (leads.metadata->>'contactado' IS NULL OR leads.metadata->>'contactado' != 'true')
        ) > 20 THEN true ELSE false END AS is_overloaded,
        -- Check if user is active (signed in within last 30 days)
        CASE WHEN p.last_sign_in_at > now() - interval '30 days'
             THEN true ELSE false END AS is_active
    FROM public.profiles p
    WHERE p.role = 'sales'
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_sales_users_with_analytics()
IS 'Returns all sales users with their performance analytics. Admin only.';

-- ===================================
-- Function: create_sales_user
-- Description: Creates a new sales user with email and password
-- ===================================

DROP FUNCTION IF EXISTS public.create_sales_user(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_sales_user(
    user_email text,
    user_password text,
    user_first_name text,
    user_last_name text,
    user_phone text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    new_user_id uuid;
    new_user_data jsonb;
BEGIN
    -- Ensure only admins can call this function
    IF public.get_my_role() != 'admin' THEN
        RAISE EXCEPTION 'No autorizado. Se requiere rol de administrador.';
    END IF;

    -- Validate email format
    IF user_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
        RAISE EXCEPTION 'Formato de email inválido.';
    END IF;

    -- Validate password length
    IF length(user_password) < 8 THEN
        RAISE EXCEPTION 'La contraseña debe tener al menos 8 caracteres.';
    END IF;

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        RAISE EXCEPTION 'Ya existe un usuario con este email.';
    END IF;

    -- Insert into auth.users (Supabase Auth table)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        last_sign_in_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        user_email,
        crypt(user_password, gen_salt('bf')),
        now(),
        now(),
        '',
        '',
        '',
        '',
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('first_name', user_first_name, 'last_name', user_last_name),
        false,
        NULL
    )
    RETURNING id INTO new_user_id;

    -- Insert into profiles with role='sales'
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        created_at,
        updated_at,
        last_assigned_at
    )
    VALUES (
        new_user_id,
        user_email,
        user_first_name,
        user_last_name,
        user_phone,
        'sales',
        now(),
        now(),
        NULL -- Will be assigned leads via round-robin
    );

    -- Return the created user data
    SELECT jsonb_build_object(
        'id', id,
        'email', email,
        'first_name', first_name,
        'last_name', last_name,
        'phone', phone,
        'role', role,
        'created_at', created_at,
        'success', true
    )
    INTO new_user_data
    FROM public.profiles
    WHERE id = new_user_id;

    RETURN new_user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_sales_user(text, text, text, text, text)
IS 'Creates a new sales user and automatically adds them to round-robin assignment. Admin only.';

-- ===================================
-- Function: get_user_analytics_details
-- Description: Returns detailed analytics for a specific user
-- ===================================

DROP FUNCTION IF EXISTS public.get_user_analytics_details(uuid);

CREATE OR REPLACE FUNCTION public.get_user_analytics_details(user_id_param uuid)
RETURNS jsonb AS $$
DECLARE
    analytics_data jsonb;
BEGIN
    -- Ensure only admins can call this function
    IF public.get_my_role() != 'admin' THEN
        RAISE EXCEPTION 'No autorizado. Se requiere rol de administrador.';
    END IF;

    SELECT jsonb_build_object(
        'user_info', (
            SELECT jsonb_build_object(
                'id', p.id,
                'email', p.email,
                'first_name', p.first_name,
                'last_name', p.last_name,
                'phone', p.phone,
                'role', p.role,
                'created_at', p.created_at,
                'last_sign_in_at', p.last_sign_in_at,
                'last_assigned_at', p.last_assigned_at
            )
            FROM public.profiles p
            WHERE p.id = user_id_param
        ),
        'leads_stats', jsonb_build_object(
            'total_assigned', (
                SELECT COUNT(*)::bigint
                FROM public.profiles
                WHERE asesor_asignado_id = user_id_param
                AND role = 'user'
            ),
            'contacted', (
                SELECT COUNT(*)::bigint
                FROM public.profiles
                WHERE asesor_asignado_id = user_id_param
                AND role = 'user'
                AND (contactado = true OR metadata->>'contactado' = 'true')
            ),
            'pending_contact', (
                SELECT COUNT(*)::bigint
                FROM public.profiles
                WHERE asesor_asignado_id = user_id_param
                AND role = 'user'
                AND (contactado IS NULL OR contactado = false)
                AND (metadata->>'contactado' IS NULL OR metadata->>'contactado' != 'true')
            ),
            'with_applications', (
                SELECT COUNT(DISTINCT fa.user_id)::bigint
                FROM public.financing_applications fa
                INNER JOIN public.profiles p ON p.id = fa.user_id
                WHERE p.asesor_asignado_id = user_id_param
                AND p.role = 'user'
                AND fa.status != 'draft'
            ),
            'approved_applications', (
                SELECT COUNT(DISTINCT fa.user_id)::bigint
                FROM public.financing_applications fa
                INNER JOIN public.profiles p ON p.id = fa.user_id
                WHERE p.asesor_asignado_id = user_id_param
                AND p.role = 'user'
                AND fa.status = 'approved'
            )
        ),
        'recent_leads', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'name', concat(p.first_name, ' ', p.last_name),
                    'email', p.email,
                    'phone', p.phone,
                    'contactado', COALESCE(p.contactado, false),
                    'created_at', p.created_at
                )
                ORDER BY p.created_at DESC
            )
            FROM (
                SELECT * FROM public.profiles
                WHERE asesor_asignado_id = user_id_param
                AND role = 'user'
                ORDER BY created_at DESC
                LIMIT 10
            ) p
        )
    ) INTO analytics_data;

    RETURN analytics_data;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_analytics_details(uuid)
IS 'Returns detailed analytics for a specific sales user. Admin only.';

-- ===================================
-- Function: update_sales_user_status
-- Description: Enable or disable a sales user from receiving new leads
-- ===================================

DROP FUNCTION IF EXISTS public.update_sales_user_status(uuid, boolean);

CREATE OR REPLACE FUNCTION public.update_sales_user_status(
    user_id_param uuid,
    is_active boolean
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    -- Ensure only admins can call this function
    IF public.get_my_role() != 'admin' THEN
        RAISE EXCEPTION 'No autorizado. Se requiere rol de administrador.';
    END IF;

    -- Check if user exists and is a sales user
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id_param AND role = 'sales'
    ) THEN
        RAISE EXCEPTION 'Usuario de ventas no encontrado.';
    END IF;

    -- Update the user's status
    -- When disabled, set last_assigned_at to far future to exclude from round-robin
    UPDATE public.profiles
    SET
        last_assigned_at = CASE
            WHEN is_active THEN COALESCE(last_assigned_at, now())
            ELSE '9999-12-31 23:59:59'::timestamptz
        END,
        updated_at = now()
    WHERE id = user_id_param;

    SELECT jsonb_build_object(
        'success', true,
        'user_id', user_id_param,
        'is_active', is_active,
        'message', CASE
            WHEN is_active THEN 'Usuario activado correctamente'
            ELSE 'Usuario desactivado correctamente'
        END
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_sales_user_status(uuid, boolean)
IS 'Enable or disable a sales user from receiving new leads in round-robin. Admin only.';

-- ===================================
-- Grant execute permissions
-- ===================================

GRANT EXECUTE ON FUNCTION public.get_sales_users_with_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_sales_user(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_analytics_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_sales_user_status(uuid, boolean) TO authenticated;
