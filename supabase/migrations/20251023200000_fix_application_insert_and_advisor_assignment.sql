-- Comprehensive fix for application creation and advisor assignment issues
-- This migration addresses:
-- 1. RLS policy violation when creating applications (trigger uses wrong column name)
-- 2. Missing advisor assignment on user signup

-- ==============================================================================
-- PART 1: Fix set_user_id_from_auth() to use user_id instead of uid
-- ==============================================================================

CREATE OR REPLACE FUNCTION "public"."set_user_id_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  -- Use user_id column (not uid) to match actual table structure
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;$$;

COMMENT ON FUNCTION "public"."set_user_id_from_auth"() IS 'Trigger function to set user_id from auth.uid() on insert. Works with tables that have user_id column.';

-- ==============================================================================
-- PART 2: Update handle_new_user() to assign advisor automatically
-- ==============================================================================

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    user_role TEXT := 'user';
    admin_emails TEXT[] := ARRAY[
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com'
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
        user_role::user_role,
        COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors

    -- ✅ NEW: Automatically assign sales advisor to regular users (not admins/sales)
    IF user_role = 'user' THEN
        PERFORM public.assign_advisor(NEW.id);
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Trigger function to create profile on user signup and assign sales advisor via round-robin.';

-- ==============================================================================
-- PART 3: Assign advisors to existing users who don't have one
-- ==============================================================================

-- Update existing users who don't have an advisor assigned
DO $$
DECLARE
    user_record RECORD;
    assigned_advisor_id uuid;
BEGIN
    -- Loop through all regular users without an advisor
    FOR user_record IN
        SELECT id
        FROM public.profiles
        WHERE role = 'user'
        AND asesor_asignado_id IS NULL
    LOOP
        -- Assign advisor using round-robin logic
        assigned_advisor_id := public.assign_advisor(user_record.id);

        -- Log the assignment (optional)
        RAISE NOTICE 'Assigned advisor % to user %', assigned_advisor_id, user_record.id;
    END LOOP;
END $$;
