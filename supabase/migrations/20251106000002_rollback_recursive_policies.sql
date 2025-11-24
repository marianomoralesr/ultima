-- ROLLBACK: Remove recursive policies that query profiles table
-- These policies cause infinite recursion

DROP POLICY IF EXISTS "profiles_sales_select_assigned" ON public.profiles;
DROP POLICY IF EXISTS "financing_apps_sales_assigned" ON public.financing_applications;
DROP POLICY IF EXISTS "uploaded_documents_sales_assigned" ON public.uploaded_documents;
DROP POLICY IF EXISTS "documents_sales_assigned" ON storage.objects;

-- Note: Keep the UPDATE statements and trigger from previous migration
-- Those are safe and don't cause recursion
