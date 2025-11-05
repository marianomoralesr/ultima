-- Fix RLS policy to allow Edge Functions (using anon role) to insert email notifications
-- The automated-email-notifications function uses the anon key for authentication

-- Drop the restrictive service_role-only policy
DROP POLICY IF EXISTS "Allow service role to insert notifications" ON public.user_email_notifications;

-- Create new policy allowing both service_role AND anon role to insert
-- (anon role is used by Edge Functions)
CREATE POLICY "Allow Edge Functions to insert notifications"
  ON public.user_email_notifications
  FOR INSERT
  WITH CHECK (true);

-- Add helpful comment
COMMENT ON POLICY "Allow Edge Functions to insert notifications" ON public.user_email_notifications
  IS 'Allows Edge Functions and service role to log email notifications to the database';
