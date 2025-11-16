-- Create anonymous_survey_responses table for storing survey data
-- This migration creates the table structure for the anonymous customer survey

-- Create the table
CREATE TABLE IF NOT EXISTS public.anonymous_survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  responses JSONB NOT NULL,
  coupon_code TEXT NOT NULL UNIQUE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_anonymous_survey_responses_completed_at
  ON public.anonymous_survey_responses(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_anonymous_survey_responses_coupon_code
  ON public.anonymous_survey_responses(coupon_code);

-- Add index for JSONB queries (GIN index for efficient JSONB querying)
CREATE INDEX IF NOT EXISTS idx_anonymous_survey_responses_responses
  ON public.anonymous_survey_responses USING GIN (responses);

-- Enable Row Level Security
ALTER TABLE public.anonymous_survey_responses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for survey submission)
CREATE POLICY "Allow anonymous survey submission"
  ON public.anonymous_survey_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow authenticated users to insert surveys
CREATE POLICY "Allow authenticated survey submission"
  ON public.anonymous_survey_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for admin users to view all survey responses
CREATE POLICY "Allow admins to view all survey responses"
  ON public.anonymous_survey_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comment to table
COMMENT ON TABLE public.anonymous_survey_responses IS 'Stores anonymous customer survey responses with coupon codes for incentives';

-- Add comments to columns
COMMENT ON COLUMN public.anonymous_survey_responses.id IS 'Unique identifier for each survey response';
COMMENT ON COLUMN public.anonymous_survey_responses.responses IS 'JSONB object containing all survey answers';
COMMENT ON COLUMN public.anonymous_survey_responses.coupon_code IS 'Unique coupon code generated for the respondent';
COMMENT ON COLUMN public.anonymous_survey_responses.completed_at IS 'Timestamp when the survey was completed';
COMMENT ON COLUMN public.anonymous_survey_responses.created_at IS 'Timestamp when the record was created';

-- Create a function to get survey analytics (admin only)
CREATE OR REPLACE FUNCTION public.get_survey_analytics()
RETURNS TABLE (
  total_responses BIGINT,
  responses_today BIGINT,
  responses_this_week BIGINT,
  responses_this_month BIGINT,
  average_completion_time INTERVAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_responses,
    COUNT(*) FILTER (WHERE completed_at >= CURRENT_DATE)::BIGINT as responses_today,
    COUNT(*) FILTER (WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as responses_this_week,
    COUNT(*) FILTER (WHERE completed_at >= CURRENT_DATE - INTERVAL '30 days')::BIGINT as responses_this_month,
    AVG(created_at - completed_at) as average_completion_time
  FROM public.anonymous_survey_responses;
END;
$$;

-- Grant execute permission to authenticated users (function handles authorization)
GRANT EXECUTE ON FUNCTION public.get_survey_analytics() TO authenticated;

COMMENT ON FUNCTION public.get_survey_analytics() IS 'Returns analytics data for anonymous surveys (admin only)';
