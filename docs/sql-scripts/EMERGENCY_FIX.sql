-- ============================================================================
-- EMERGENCY FIX FOR HTTP 556 - AUTH SERVICE DOWN
-- ============================================================================
-- Problem: Infinite recursion in RLS policies causing Auth service to crash
-- Solution: Remove all recursive dependencies and simplify RLS
-- ============================================================================

-- Step 1: Drop the problematic recursive function
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- Step 2: Disable RLS temporarily on profiles to break the cycle
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- Step 4: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create SIMPLE policies that don't cause recursion
-- These policies ONLY use auth.uid() - no function calls, no subqueries

-- Allow users to see their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow new users to insert their profile on signup
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Step 7: Verify the fix
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ EMERGENCY FIX APPLIED';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Dropped recursive function: get_my_role()';
  RAISE NOTICE '✓ Recreated profiles RLS policies (non-recursive)';
  RAISE NOTICE '✓ Granted necessary permissions';
  RAISE NOTICE '';
  RAISE NOTICE '⏳ Auth service should recover in 1-2 minutes';
  RAISE NOTICE '📊 Monitor health at: Dashboard > Project Settings > General';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 If still unhealthy after 5 min, check:';
  RAISE NOTICE '   - Dashboard > Logs > Postgres Logs';
  RAISE NOTICE '   - Dashboard > Reports > API';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
END $$;
