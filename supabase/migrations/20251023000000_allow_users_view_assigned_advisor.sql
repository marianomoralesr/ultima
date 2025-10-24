-- Migration: Allow users to view their assigned advisor's profile
-- Date: 2025-10-23
-- Issue: Users getting "No se pudo cargar la información del asesor" error
-- Cause: RLS policy only allows users to view their own profile, not their advisor's
-- Solution: Use a SECURITY DEFINER function to avoid infinite recursion

-- Drop the existing policy if it exists (in case we're re-running this)
DROP POLICY IF EXISTS "Users can view assigned advisor profile" ON public.profiles;

-- Create a security definer function to get the current user's assigned advisor ID
-- This breaks the recursion by using a function that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_my_advisor_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT asesor_asignado_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_advisor_id() TO authenticated;

-- Create the policy using the security definer function
-- This allows users to view profiles where the ID matches their advisor's ID
CREATE POLICY "Users can view assigned advisor profile" ON public.profiles
  FOR SELECT
  USING (
    id = public.get_my_advisor_id()
  );

-- Add comments to explain the policy and function
COMMENT ON POLICY "Users can view assigned advisor profile" ON public.profiles IS
'Allows authenticated users to view the profile of their assigned advisor using a security definer function to avoid infinite recursion';

COMMENT ON FUNCTION public.get_my_advisor_id() IS
'Returns the asesor_asignado_id for the currently authenticated user. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';
