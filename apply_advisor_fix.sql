-- Quick fix: Allow users to view their assigned advisor's profile
-- Run this in Supabase Dashboard > SQL Editor

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Users can view assigned advisor profile" ON public.profiles;

-- Create a new policy that allows users to view the profile of their assigned advisor
CREATE POLICY "Users can view assigned advisor profile" ON public.profiles
  FOR SELECT
  USING (
    -- Allow if the profile ID matches the current user's asesor_asignado_id
    id IN (
      SELECT asesor_asignado_id
      FROM public.profiles
      WHERE id = auth.uid()
      AND asesor_asignado_id IS NOT NULL
    )
  );
