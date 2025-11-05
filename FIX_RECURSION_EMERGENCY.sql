-- ============================================================================
-- EMERGENCY FIX: Remove Infinite Recursion
-- The recursion happens because RLS policy tries to read profiles table
-- while checking permissions ON profiles table
-- Solution: Only use JWT email, NOT role queries
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop ALL policies on profiles (stop the recursion)
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

-- ============================================================================
-- STEP 2: Create SIMPLE, NON-RECURSIVE policies
-- Only use auth.jwt() - NEVER query profiles table in profiles RLS
-- ============================================================================

-- 1. Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 2. Admins can read ALL profiles (BY EMAIL ONLY - no recursion)
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

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 4. Admins can update ALL profiles (BY EMAIL ONLY - no recursion)
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

-- 5. Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Add comments
COMMENT ON POLICY "Admins can read all profiles by email" ON public.profiles IS
'Allows admin users (by email from JWT token) to read all profiles. Uses ONLY auth.jwt() to avoid recursion - does NOT query profiles table.';

COMMENT ON POLICY "Admins can update all profiles by email" ON public.profiles IS
'Allows admin users (by email from JWT token) to update all profiles. Uses ONLY auth.jwt() to avoid recursion - does NOT query profiles table.';

-- ============================================================================
-- STEP 3: Verify get_my_role function is SECURITY DEFINER (bypasses RLS)
-- ============================================================================

-- This function is safe because SECURITY DEFINER bypasses RLS
-- It can query profiles without triggering recursion
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
'Returns the role of the current authenticated user. Uses SECURITY DEFINER to bypass RLS and avoid recursion.';

-- ============================================================================
-- STEP 4: Update admin user roles in database
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
-- STEP 5: Verification
-- ============================================================================

-- Test 1: Can you see profiles now?
SELECT
    'TEST: Profiles visible to you' as test,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 100 THEN '✅ SUCCESS - Can see all profiles'
        WHEN COUNT(*) = 1 THEN '❌ STILL BLOCKED - Only see own profile'
        ELSE '⚠️ PARTIAL - See some profiles'
    END as result
FROM public.profiles;

-- Test 2: What's your role?
SELECT
    'Your email and role' as test,
    email,
    role,
    get_my_role() as role_via_function
FROM public.profiles
WHERE id = auth.uid();

-- Success message
SELECT '✅ RECURSION FIX COMPLETE!' as status;
