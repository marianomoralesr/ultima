-- Solo actualizar profiles_update
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR get_my_role() IN ('admin', 'marketing')
  OR (get_my_role() = 'sales' AND role = 'user' AND asesor_asignado_id = auth.uid())
)
WITH CHECK (
  id = auth.uid()
  OR get_my_role() IN ('admin', 'marketing')
  OR (get_my_role() = 'sales' AND role = 'user' AND asesor_asignado_id = auth.uid())
);