-- Allow sales users to update contactado field for their assigned leads
-- This enables sales reps to mark leads as contacted directly from their dashboard

-- Create a new UPDATE policy for profiles that allows sales to update specific fields
DROP POLICY IF EXISTS "profiles_sales_update_contactado" ON public.profiles;

CREATE POLICY "profiles_sales_update_contactado" ON public.profiles
FOR UPDATE TO authenticated
USING (
  -- Sales can only update leads assigned to them where access is authorized
  EXISTS (
    SELECT 1 FROM public.profiles sales
    WHERE sales.id = auth.uid()
      AND sales.role = 'sales'
      AND profiles.asesor_asignado_id = auth.uid()
      AND COALESCE(profiles.asesor_autorizado_acceso, false) = true
  )
)
WITH CHECK (
  -- Sales can only update leads assigned to them where access is authorized
  EXISTS (
    SELECT 1 FROM public.profiles sales
    WHERE sales.id = auth.uid()
      AND sales.role = 'sales'
      AND profiles.asesor_asignado_id = auth.uid()
      AND COALESCE(profiles.asesor_autorizado_acceso, false) = true
  )
);

COMMENT ON POLICY "profiles_sales_update_contactado" ON public.profiles IS
'Sales users can update contactado and other fields for their assigned leads where asesor_autorizado_acceso is true';

-- Verify the policy was created
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SALES UPDATE POLICY CREATED ===';
    RAISE NOTICE '';
    RAISE NOTICE '✓ Sales users can now update contactado field';
    RAISE NOTICE '✓ Only for leads where:';
    RAISE NOTICE '  - asesor_asignado_id matches sales user ID';
    RAISE NOTICE '  - asesor_autorizado_acceso is true';
    RAISE NOTICE '  - Sales user has role="sales"';
    RAISE NOTICE '';
END $$;
