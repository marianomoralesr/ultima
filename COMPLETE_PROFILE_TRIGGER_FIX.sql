-- ============================================================================
-- COMPLETE PROFILE TRIGGER FIX
-- This creates the trigger that automatically creates profiles on signup
-- ============================================================================

-- Step 1: Create or update the handle_new_user function with DO UPDATE
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
        role = EXCLUDED.role,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates or updates a profile when a user signs up. Sets admin role for whitelisted emails.';

-- Step 2: Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Creates a profile automatically when a new user signs up';

-- Step 3: Backfill profiles for any auth.users that don't have one
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
    COALESCE(u.raw_user_meta_data->>'first_name', SPLIT_PART(u.raw_user_meta_data->>'full_name', ' ', 1)),
    COALESCE(u.raw_user_meta_data->>'last_name', NULLIF(SUBSTRING(u.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN u.raw_user_meta_data->>'full_name') + 1), '')),
    u.phone,
    CASE
        WHEN u.email IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com')
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
    updated_at = NOW();

-- Step 4: Fix existing admin profiles that have wrong role
UPDATE public.profiles
SET role = 'admin'::user_role, updated_at = NOW()
WHERE email IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com')
AND role != 'admin';

-- Step 5: Verify everything worked
SELECT
    'Trigger Status' as check_type,
    tgname as trigger_name,
    CASE tgenabled
        WHEN 'O' THEN '✓ Enabled'
        ELSE '✗ Disabled'
    END as status
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
AND tgname = 'on_auth_user_created'

UNION ALL

SELECT
    'Admin Profiles' as check_type,
    email as trigger_name,
    CASE
        WHEN role = 'admin' THEN '✓ Admin role set'
        ELSE '✗ Wrong role: ' || role::text
    END as status
FROM public.profiles
WHERE email IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com')

UNION ALL

SELECT
    'Orphaned Users' as check_type,
    COUNT(*)::text as trigger_name,
    CASE
        WHEN COUNT(*) = 0 THEN '✓ All users have profiles'
        ELSE '✗ Users without profiles found'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
