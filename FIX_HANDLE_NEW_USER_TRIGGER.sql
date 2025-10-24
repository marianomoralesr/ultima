-- ============================================================================
-- FIX HANDLE_NEW_USER TRIGGER TO UPDATE EXISTING PROFILES
-- This fixes the issue where admin emails don't get the admin role when they
-- log in if their profile was created before this trigger existed
-- ============================================================================

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

    -- Insert or update the profile
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
        user_role,
        COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,  -- ✅ Update the role if it changed
        updated_at = NOW();     -- ✅ Update the timestamp

    RETURN NEW;
END;
$$;

-- ============================================================================
-- NOW FIX YOUR EXISTING PROFILE
-- Since the trigger now updates on conflict, we can just manually update your profile
-- ============================================================================

UPDATE profiles
SET role = 'admin'::user_role
WHERE email = 'marianomorales@outlook.com'
AND role != 'admin';

-- ============================================================================
-- VERIFY THE FIX
-- ============================================================================

SELECT
    id,
    email,
    role,
    first_name,
    last_name,
    CASE
        WHEN role = 'admin' THEN '✓ SUCCESS - You now have admin access'
        ELSE '✗ FAILED - Still not admin'
    END as status
FROM profiles
WHERE email = 'marianomorales@outlook.com';
