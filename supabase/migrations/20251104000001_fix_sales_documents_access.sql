-- Fix: Allow sales role to access documents from their assigned leads
-- Issue: RLS policies only check hardcoded admin emails, not role from profiles table
-- This aligns with the sales dashboard functions that check role from profiles

-- Drop existing policies
DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_delete" ON public.uploaded_documents;

-- Users can view their own documents
-- Admin and sales can view documents from leads they have access to
CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  -- Users can see their own documents
  user_id = auth.uid() OR
  -- Admin role can see all documents
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) OR
  -- Sales role can see documents from their assigned leads with authorized access
  EXISTS (
    SELECT 1 FROM public.profiles lead
    WHERE lead.id = uploaded_documents.user_id
      AND lead.asesor_asignado_id = auth.uid()
      AND lead.autorizar_asesor_acceso = true
      AND EXISTS (
        SELECT 1 FROM public.profiles sales
        WHERE sales.id = auth.uid() AND sales.role = 'sales'
      )
  )
);

-- Admin can update documents from any lead
-- Sales can update documents from their assigned leads with authorized access
CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  -- Users can update their own documents
  user_id = auth.uid() OR
  -- Admin role can update all documents
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) OR
  -- Sales role can update documents from their assigned leads with authorized access
  EXISTS (
    SELECT 1 FROM public.profiles lead
    WHERE lead.id = uploaded_documents.user_id
      AND lead.asesor_asignado_id = auth.uid()
      AND lead.autorizar_asesor_acceso = true
      AND EXISTS (
        SELECT 1 FROM public.profiles sales
        WHERE sales.id = auth.uid() AND sales.role = 'sales'
      )
  )
)
WITH CHECK (
  -- Users can update their own documents
  user_id = auth.uid() OR
  -- Admin role can update all documents
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) OR
  -- Sales role can update documents from their assigned leads with authorized access
  EXISTS (
    SELECT 1 FROM public.profiles lead
    WHERE lead.id = uploaded_documents.user_id
      AND lead.asesor_asignado_id = auth.uid()
      AND lead.autorizar_asesor_acceso = true
      AND EXISTS (
        SELECT 1 FROM public.profiles sales
        WHERE sales.id = auth.uid() AND sales.role = 'sales'
      )
  )
);

-- Admin can delete documents from any lead
-- Sales can delete documents from their assigned leads with authorized access
CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents
FOR DELETE TO authenticated
USING (
  -- Users can delete their own documents
  user_id = auth.uid() OR
  -- Admin role can delete all documents
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) OR
  -- Sales role can delete documents from their assigned leads with authorized access
  EXISTS (
    SELECT 1 FROM public.profiles lead
    WHERE lead.id = uploaded_documents.user_id
      AND lead.asesor_asignado_id = auth.uid()
      AND lead.autorizar_asesor_acceso = true
      AND EXISTS (
        SELECT 1 FROM public.profiles sales
        WHERE sales.id = auth.uid() AND sales.role = 'sales'
      )
  )
);

COMMENT ON POLICY "uploaded_documents_select" ON public.uploaded_documents IS
'Users can view their own documents. Admin role can view all. Sales role can view documents from leads they are assigned to with authorized access.';

COMMENT ON POLICY "uploaded_documents_update" ON public.uploaded_documents IS
'Users can update their own documents. Admin role can update all. Sales role can update documents from leads they are assigned to with authorized access.';

COMMENT ON POLICY "uploaded_documents_delete" ON public.uploaded_documents IS
'Users can delete their own documents. Admin role can delete all. Sales role can delete documents from leads they are assigned to with authorized access.';
