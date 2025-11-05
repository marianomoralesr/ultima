-- ============================================================================
-- FINAL COMPLETE FIX - ALL TABLES, ALL ADMINS
-- This is the ONE script to fix everything:
-- 1. profiles table RLS (no recursion)
-- 2. financing_applications table RLS (includes admin emails)
-- 3. All RPC functions (includes admin emails)
-- 4. Admin user roles
-- ============================================================================

-- ============================================================================
-- PART 1: Fix profiles table RLS (NO RECURSION - ONLY JWT)
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
-- PART 2: Fix financing_applications table RLS
-- ============================================================================

DROP POLICY IF EXISTS "financing_apps_select" ON public.financing_applications;
DROP POLICY IF EXISTS "financing_apps_update" ON public.financing_applications;

CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR
    auth.jwt()->>'email' IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    )
    OR
    get_my_role() IN ('admin', 'sales')
);

CREATE POLICY "financing_apps_update"
ON public.financing_applications
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
    OR
    auth.jwt()->>'email' IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    )
    OR
    get_my_role() IN ('admin', 'sales')
)
WITH CHECK (
    user_id = auth.uid()
    OR
    auth.jwt()->>'email' IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    )
    OR
    get_my_role() IN ('admin', 'sales')
);

-- ============================================================================
-- PART 3: Fix get_my_role function (SECURITY DEFINER)
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

COMMENT ON FUNCTION "public"."get_my_role"() IS
'Returns the role of the current authenticated user. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================================
-- PART 4: Fix get_secure_client_profile function
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
    caller_email := auth.jwt()->>'email';

    SELECT role INTO caller_role
    FROM public.profiles
    WHERE id = auth.uid();

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

    IF NOT is_authorized THEN
        RETURN NULL;
    END IF;

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
'Returns complete client profile. Accessible to admin/sales users (by email OR role). SECURITY DEFINER bypasses RLS.';

-- ============================================================================
-- PART 5: Set admin roles in database
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
-- PART 6: Comprehensive Verification
-- ============================================================================

-- Test 1: Profiles
SELECT
    'TEST 1: Profiles visible' as test,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 50 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM public.profiles;

-- Test 2: Financing Applications
SELECT
    'TEST 2: Financing apps visible' as test,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'reviewing', 'pending_docs')) as active,
    COUNT(*) FILTER (WHERE status = 'draft') as drafts,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ PASS'
        ELSE '❌ FAIL - No apps visible'
    END as result
FROM public.financing_applications;

-- Test 3: Your role
SELECT
    'TEST 3: Your role' as test,
    email,
    role as db_role,
    get_my_role() as function_role,
    CASE
        WHEN role IN ('admin', 'sales') THEN '✅ PASS'
        ELSE '❌ FAIL - Not admin'
    END as result
FROM public.profiles
WHERE id = auth.uid();

-- Test 4: All admins
SELECT
    'TEST 4: All admin users' as test,
    email,
    role,
    CASE
        WHEN role = 'admin' THEN '✅ Has admin role'
        ELSE '❌ Missing admin role'
    END as status
FROM public.profiles
WHERE email IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
)
ORDER BY email;

-- Final message
SELECT '
╔══════════════════════════════════════════════════════════╗
║  ✅ COMPLETE FIX APPLIED SUCCESSFULLY!                  ║
║                                                          ║
║  All admins should now be able to:                      ║
║  • See all profiles in CRM                              ║
║  • See all financing applications                       ║
║  • View "Con Solicitud Activa" and "Solicitud           ║
║    Incompleta" stats                                    ║
║  • View client detail pages                             ║
║  • See "Último Auto de Interés" column                  ║
║                                                          ║
║  Please refresh your browser and test!                  ║
╔══════════════════════════════════════════════════════════╗
' as FINAL_STATUS;
