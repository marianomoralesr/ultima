-- This migration fixes the Row Level Security (RLS) policy for the 'uploaded_documents' table.
-- The previous policy was incorrect for INSERT operations, causing "record 'new' has no field 'uid'" errors.
-- This script replaces the faulty policy with a corrected one that uses a 'WITH CHECK' clause for inserts.

-- Drop the old, incorrect policy to avoid conflicts.
DROP POLICY IF EXISTS "Users can manage their own documents." ON public.uploaded_documents;
DROP POLICY IF EXISTS "Admins and sales can view all documents." ON public.uploaded_documents;

-- Create a new, correct policy for users to manage their own documents.
CREATE POLICY "Users can manage their own documents" ON public.uploaded_documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recreate the policy for admin and sales staff.
CREATE POLICY "Admins and sales can view all documents" ON public.uploaded_documents
  FOR SELECT
  USING (get_my_role() IN ('admin', 'sales'));
