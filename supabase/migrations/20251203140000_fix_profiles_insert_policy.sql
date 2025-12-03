-- ============================================================================
-- FIX: Add INSERT policy for profiles table
-- ============================================================================
-- Issue: Users registering via FinanciamientosPage get RLS error on upsert
-- Root cause: Missing INSERT policy for user's own profile creation
-- Solution: Add INSERT policy that allows users to insert their own profile
-- ============================================================================

-- Drop existing INSERT policy if any
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

-- Create INSERT policy for users creating their own profile
CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT TO authenticated, anon
WITH CHECK (
  -- Users can insert their own profile
  id = auth.uid()
  OR
  -- Admin can insert any profile
  get_my_role() = 'admin'
  OR
  -- Marketing can insert any profile
  get_my_role() = 'marketing'
);

COMMENT ON POLICY "profiles_insert" ON public.profiles IS
'Allow users to create their own profile, admins and marketing can create any profile';

-- Verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ profiles_insert POLICY CREATED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Policy Details:';
    RAISE NOTICE '  - Users can INSERT their own profile (id = auth.uid())';
    RAISE NOTICE '  - Admin can INSERT any profile';
    RAISE NOTICE '  - Marketing can INSERT any profile';
    RAISE NOTICE '  - Applies to authenticated AND anon users';
    RAISE NOTICE '';
    RAISE NOTICE 'This fixes the RLS error on FinanciamientosPage registration';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
