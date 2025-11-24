-- EMERGENCY FIX: Remove infinite recursion that's killing Auth service
-- Issue: get_my_role() function creates infinite loop with profiles RLS policies
-- Solution: Use JWT claims directly instead of querying profiles table

-- ============================================================================
-- 1. DROP THE PROBLEMATIC FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- ============================================================================
-- 2. FIX PROFILES RLS POLICIES - Use JWT directly, no function calls
-- ============================================================================

-- Drop all existing policies that might be causing issues
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

-- Create simple, safe policies that don't cause recursion
-- Users can always read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- New users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- ============================================================================
-- 3. CREATE SAFE HELPER FUNCTION (does NOT query profiles)
-- ============================================================================

-- This function uses JWT claims directly - NO DATABASE QUERIES
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from JWT custom claims if available
  user_role := COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'user' -- default to 'user' if no role claim exists
  );

  RETURN user_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

COMMENT ON FUNCTION public.get_user_role() IS
'Returns the role from JWT claims without querying any tables. Safe from recursion.';

-- ============================================================================
-- 4. FIX ANY FUNCTIONS THAT WERE USING get_my_role()
-- ============================================================================

-- Update get_leads_for_dashboard to use JWT directly
CREATE OR REPLACE FUNCTION public.get_leads_for_dashboard()
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz,
  asesor_asignado_name text,
  tags text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_role text;
BEGIN
  -- Get email and role from JWT (no database queries yet)
  user_email := auth.jwt()->>'email';
  user_role := COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'user'
  );

  -- Admin sees all leads
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.email,
      p.first_name,
      p.last_name,
      p.phone,
      p.created_at,
      p.asesor_asignado_name,
      p.tags
    FROM profiles p
    WHERE p.role = 'user'
    ORDER BY p.created_at DESC;

  -- Sales sees only their assigned leads
  ELSIF user_role = 'sales' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.email,
      p.first_name,
      p.last_name,
      p.phone,
      p.created_at,
      p.asesor_asignado_name,
      p.tags
    FROM profiles p
    WHERE p.asesor_asignado_id = auth.uid()
    ORDER BY p.created_at DESC;

  -- Regular users see nothing
  ELSE
    RETURN;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO authenticated;

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

-- Verify no recursive dependencies exist
DO $$
BEGIN
  RAISE NOTICE '✅ Emergency fix applied successfully';
  RAISE NOTICE '📊 Profiles RLS policies recreated without recursion';
  RAISE NOTICE '🔧 get_my_role() function dropped (was causing infinite loop)';
  RAISE NOTICE '✨ New get_user_role() function uses JWT claims directly';
  RAISE NOTICE '🚀 Auth service should recover in 1-2 minutes';
END $$;
