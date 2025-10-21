-- This migration fixes the Row Level Security (RLS) policy for the 'uploaded_documents' table.
-- The previous policy used a 'USING' clause for an INSERT operation, which is incorrect
-- and caused "record 'new' has no field 'uid'" errors. This script replaces the faulty
-- policy with a corrected one that uses a 'WITH CHECK' clause for inserts.

-- Drop the old, incorrect policy.
DROP POLICY IF EXISTS "Users can manage their own documents." ON public.uploaded_documents;

-- Create a new, correct policy that handles INSERT, UPDATE, SELECT, and DELETE.
CREATE POLICY "Users can manage their own documents" ON public.uploaded_documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
