-- PARTE 6: Actualizar políticas de uploaded_documents y bank_profiles
DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;
CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR get_my_role() IN ('admin', 'marketing')
  OR (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;
CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR get_my_role() IN ('admin', 'marketing')
  OR (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
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
      WHERE p.id = uploaded_documents.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "bank_profiles_select" ON public.bank_profiles;
CREATE POLICY "bank_profiles_select" ON public.bank_profiles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR get_my_role() IN ('admin', 'marketing')
  OR (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = bank_profiles.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);
