-- Solo actualizar profiles_select (una política a la vez)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR get_my_role() = 'admin'
  OR get_my_role() = 'marketing'
  OR (get_my_role() = 'sales' AND role = 'user' AND asesor_asignado_id = auth.uid())
);