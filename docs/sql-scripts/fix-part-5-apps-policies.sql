-- PARTE 5: Actualizar políticas de financing_applications
DROP POLICY IF EXISTS "financing_apps_select" ON public.financing_applications;
CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR get_my_role() IN ('admin', 'marketing')
  OR (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "financing_apps_update" ON public.financing_applications;
CREATE POLICY "financing_apps_update"
ON public.financing_applications
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR get_my_role() IN ('admin', 'marketing')
  OR (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR get_my_role() IN ('admin', 'marketing')
  OR (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);
