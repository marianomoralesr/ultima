-- ============================================================================
-- FIX USER CREATION TRIGGER - Resolves "Database error saving new user"
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Drop existing trigger and function to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Create the handle_new_user function with proper error handling
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
        COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', NULLIF(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'full_name', '') FROM POSITION(' ' IN COALESCE(NEW.raw_user_meta_data->>'full_name', '')) + 1), '')),
        NEW.phone,
        user_role::user_role,
        COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 3: Grant permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates or updates a profile when a user signs up. Sets admin role for whitelisted emails.';

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Creates a profile automatically when a new user signs up';

-- Step 5: Verify the trigger is created
SELECT
    'Trigger Status' as check_type,
    tgname as name,
    CASE tgenabled
        WHEN 'O' THEN '✓ Enabled'
        ELSE '✗ Disabled'
    END as status
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
AND tgname = 'on_auth_user_created';

-- Step 6: Backfill any missing profiles
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
    u.email,
    COALESCE(u.raw_user_meta_data->>'first_name', SPLIT_PART(COALESCE(u.raw_user_meta_data->>'full_name', ''), ' ', 1)),
    COALESCE(u.raw_user_meta_data->>'last_name', NULLIF(SUBSTRING(COALESCE(u.raw_user_meta_data->>'full_name', '') FROM POSITION(' ' IN COALESCE(u.raw_user_meta_data->>'full_name', '')) + 1), '')),
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
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
