-- ============================================================================
-- COMPLETE FIX - NO RECURSION
-- This fixes ALL issues:
-- 1. Removes infinite recursion
-- 2. Adds all admin emails everywhere
-- 3. Allows admins to see all data
-- ============================================================================

-- ============================================================================
-- PART 1: Fix profiles table RLS (NO RECURSION)
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles by email" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles by email" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles for CRM" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles for CRM" ON public.profiles;

-- Create simple, non-recursive policies (ONLY use JWT - never query profiles)

CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles by email"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles by email"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PART 2: Fix get_my_role function (SECURITY DEFINER bypasses RLS)
-- ============================================================================

DROP FUNCTION IF EXISTS "public"."get_my_role"() CASCADE;

CREATE FUNCTION "public"."get_my_role"()
RETURNS "public"."user_role"
LANGUAGE "sql"
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_my_role"() TO authenticated;

-- ============================================================================
-- PART 3: Fix get_secure_client_profile function
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
    is_authorized boolean;
BEGIN
    -- Get caller's email from JWT
    caller_email := auth.jwt()->>'email';

    -- Get caller's role (SECURITY DEFINER allows this without recursion)
    SELECT role INTO caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    -- Check if caller is authorized (by email OR role)
    is_authorized := (
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

    -- If not authorized, return null
    IF NOT is_authorized THEN
        RETURN NULL;
    END IF;

    -- Build result (SECURITY DEFINER allows reading all tables)
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

-- ============================================================================
-- PART 4: Set admin roles
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
-- PART 5: Verification
-- ============================================================================

-- Test: How many profiles can you see?
SELECT
    'Profiles visible to you' as test,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 50 THEN '✅ SUCCESS - Can see many profiles'
        WHEN COUNT(*) = 1 THEN '❌ BLOCKED - Only own profile'
        ELSE '⚠️ PARTIAL - See some profiles'
    END as status
FROM public.profiles;

-- Test: Your role
SELECT
    'Your account details' as test,
    email,
    role as role_in_db,
    get_my_role() as role_via_function
FROM public.profiles
WHERE id = auth.uid();

-- Test: All admin users
SELECT
    'All admin users' as test,
    email,
    role,
    created_at
FROM public.profiles
WHERE role = 'admin'
ORDER BY email;

-- Success
SELECT '✅ COMPLETE FIX APPLIED - No more recursion!' as status;
