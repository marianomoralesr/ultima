-- ============================================================================
-- FIX USER CREATION TRIGGER - Run this in Supabase Dashboard SQL Editor
-- This must be run with the "postgres" role selected in the SQL editor dropdown
-- ============================================================================

-- IMPORTANT: In the Supabase SQL Editor, make sure you select "postgres" from
-- the role dropdown (top right of SQL editor) before running this!

BEGIN;

-- Step 1: Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_role TEXT := 'user';
    admin_emails TEXT[] := ARRAY[
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'holding@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    ];
BEGIN
    -- Determine role based on email
    IF NEW.email = ANY(admin_emails) THEN
        user_role := 'admin';
    END IF;

    -- Insert or update the profile with error handling
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
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1), ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', NULLIF(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'full_name', '') FROM POSITION(' ' IN COALESCE(NEW.raw_user_meta_data->>'full_name', '')) + 1), ''), ''),
        NEW.phone,
        user_role::user_role,
        COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, profiles.email),
        role = EXCLUDED.role,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        metadata = COALESCE(EXCLUDED.metadata, profiles.metadata),
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error details
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- Don't fail user creation even if profile creation fails
    RETURN NEW;
END;
$$;

-- Step 2: Ensure proper ownership and permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMIT;

-- Step 3: Verify the function exists
SELECT
    proname as function_name,
    'Function updated successfully' as status
FROM pg_proc
WHERE proname = 'handle_new_user' AND pronamespace = 'public'::regnamespace;

-- Step 4: Check if trigger exists (must be run separately in Dashboard > Authentication > Triggers)
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgrelid = 'auth.users'::regclass
            AND tgname = 'on_auth_user_created'
        )
        THEN '✓ Trigger exists - user creation should work'
        ELSE '✗ Trigger missing - Go to Dashboard > Authentication > Triggers to enable'
    END as trigger_status;

-- Step 5: Backfill any missing profiles
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
SELECT
    u.id,
    COALESCE(u.email, ''),
    COALESCE(u.raw_user_meta_data->>'first_name', SPLIT_PART(COALESCE(u.raw_user_meta_data->>'full_name', ''), ' ', 1), ''),
    COALESCE(u.raw_user_meta_data->>'last_name', NULLIF(SUBSTRING(COALESCE(u.raw_user_meta_data->>'full_name', '') FROM POSITION(' ' IN COALESCE(u.raw_user_meta_data->>'full_name', '')) + 1), ''), ''),
    u.phone,
    CASE
        WHEN u.email IN (
            'marianomorales@outlook.com',
            'mariano.morales@autostrefa.mx',
            'genauservices@gmail.com',
            'alejandro.trevino@autostrefa.mx',
            'evelia.castillo@autostrefa.mx',
            'holding@autostrefa.mx',
            'fernando.trevino@autostrefa.mx'
        )
        THEN 'admin'::user_role
        ELSE 'user'::user_role
    END,
    COALESCE(u.raw_user_meta_data, '{}'::jsonb),
    u.created_at,
    NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    role = EXCLUDED.role,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    metadata = COALESCE(EXCLUDED.metadata, profiles.metadata),
    updated_at = NOW();

SELECT COUNT(*) || ' profiles backfilled' as result FROM public.profiles;
