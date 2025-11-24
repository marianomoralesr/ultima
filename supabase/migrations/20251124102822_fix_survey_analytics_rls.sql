-- ============================================================================
-- FIX SURVEY ANALYTICS RLS POLICIES
-- ============================================================================
-- Issue: Admin users cannot see survey responses on the analytics dashboard
-- due to missing RLS policy for admin access
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "anonymous_survey_responses_select_admin" ON public.anonymous_survey_responses;
DROP POLICY IF EXISTS "anonymous_survey_responses_insert_public" ON public.anonymous_survey_responses;

-- Allow admins to view all survey responses
CREATE POLICY "anonymous_survey_responses_select_admin"
ON public.anonymous_survey_responses
FOR SELECT
TO authenticated
USING (
  -- Check if user is admin or sales
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sales')
  )
);

-- Allow anyone (even anonymous) to insert survey responses
CREATE POLICY "anonymous_survey_responses_insert_public"
ON public.anonymous_survey_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

COMMENT ON POLICY "anonymous_survey_responses_select_admin" ON public.anonymous_survey_responses IS
'Allows admin and sales users to view all survey responses for analytics';

COMMENT ON POLICY "anonymous_survey_responses_insert_public" ON public.anonymous_survey_responses IS
'Allows anyone to submit anonymous survey responses';
