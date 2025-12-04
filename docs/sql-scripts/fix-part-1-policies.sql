-- PARTE 1: Actualizar políticas RLS de profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR get_my_role() = 'admin'
  OR get_my_role() = 'marketing'
  OR (get_my_role() = 'sales' AND role = 'user' AND asesor_asignado_id = auth.uid())
);

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
