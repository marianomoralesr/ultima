-- ============================================================================
-- FINAL FIX: UNBLOCK ALL DATA FOR ADMINS
-- Data exists but RLS is blocking it. This fixes all RLS policies.
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix profiles table RLS policies
-- ============================================================================

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles by email" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles by email" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles for CRM" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles for CRM" ON public.profiles;

-- Recreate policies with correct logic

-- 1. Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 2. Allow admins to read ALL profiles (by email OR by role)
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Check email from JWT (avoids recursion)
    auth.jwt()->>'email' IN (
      'marianomorales@outlook.com',
      'mariano.morales@autostrefa.mx',
      'genauservices@gmail.com',
      'alejandro.trevino@autostrefa.mx',
      'evelia.castillo@autostrefa.mx',
      'fernando.trevino@autostrefa.mx'
    )
    OR
    -- Also allow if they have admin/sales role in their own profile
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'sales')
  )
);

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 4. Allow admins to update ALL profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.jwt()->>'email' IN (
      'marianomorales@outlook.com',
      'mariano.morales@autostrefa.mx',
      'genauservices@gmail.com',
      'alejandro.trevino@autostrefa.mx',
      'evelia.castillo@autostrefa.mx',
      'fernando.trevino@autostrefa.mx'
    )
    OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'sales')
  )
);

-- 5. Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Add comments
COMMENT ON POLICY "Admins can read all profiles" ON public.profiles IS
'Allows admin users (by email from JWT OR by role) to read all profiles. Regular users can only read their own via separate policy.';

COMMENT ON POLICY "Admins can update all profiles" ON public.profiles IS
'Allows admin users (by email from JWT OR by role) to update all profiles.';

-- ============================================================================
-- STEP 2: Fix get_secure_client_profile function
-- ============================================================================

DROP FUNCTION IF EXISTS get_secure_client_profile(uuid);

CREATE OR REPLACE FUNCTION get_secure_client_profile(client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    caller_email text;
    caller_role text;
    is_admin boolean;
BEGIN
    -- Get caller's email from JWT
    caller_email := auth.jwt()->>'email';

    -- Get caller's role from their profile
    SELECT role INTO caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    -- Check if caller is admin (by email OR role)
    is_admin := (
        caller_email IN (
            'marianomorales@outlook.com',
            'mariano.morales@autostrefa.mx',
            'genauservices@gmail.com',
            'alejandro.trevino@autostrefa.mx',
            'evelia.castillo@autostrefa.mx',
            'fernando.trevino@autostrefa.mx'
        )
        OR
        caller_role IN ('admin', 'sales')
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

GRANT EXECUTE ON FUNCTION get_secure_client_profile(uuid) TO authenticated;

COMMENT ON FUNCTION get_secure_client_profile(uuid) IS
'Returns complete client profile with applications, tags, reminders, and documents. Accessible to admin/sales users (by email OR role). Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================================
-- STEP 3: Ensure admin users have correct roles
-- ============================================================================

UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
)
AND role != 'admin';

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

-- Count profiles visible with current session (tests RLS)
SELECT
    'Profiles visible to current user' as test,
    COUNT(*) as count
FROM public.profiles;

-- Show admin users
SELECT
    'Admin users in database' as test,
    email,
    role,
    created_at
FROM public.profiles
WHERE role = 'admin'
ORDER BY email;

-- Test get_my_role function
SELECT
    'Current user role (via get_my_role)' as test,
    get_my_role() as my_role;

-- Success message
SELECT '✅ RLS FIX COMPLETE - All admins should now see all data!' as status;
