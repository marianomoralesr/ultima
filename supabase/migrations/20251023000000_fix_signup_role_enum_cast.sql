-- Fix signup failure: Cast TEXT role to user_role enum in handle_new_user trigger
-- Error: "column role is of type user_role but expression is of type text"

-- Recreate the handle_new_user function with proper enum casting
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    user_role TEXT := 'user';
    admin_emails TEXT[] := ARRAY[
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    ];
BEGIN
    -- Determine role based on email
    IF NEW.email = ANY(admin_emails) THEN
        user_role := 'admin';
    END IF;

    -- Insert the new profile
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        metadata,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', NULLIF(SUBSTRING(NEW.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN NEW.raw_user_meta_data->>'full_name') + 1), '')),
        NEW.phone,
        user_role::user_role,  -- ✅ FIX: Cast TEXT to user_role enum
        COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors

    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Trigger function to create profile on user signup. Properly casts role to user_role enum type.';
