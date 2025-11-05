-- Update user_email_notifications table to support Airtable valuation emails
-- Make user_id nullable since Airtable valuations might not have associated user accounts
-- Add recipient_email column for tracking emails sent to non-users

-- Make user_id nullable
ALTER TABLE public.user_email_notifications
  ALTER COLUMN user_id DROP NOT NULL;

-- Add recipient_email column
ALTER TABLE public.user_email_notifications
  ADD COLUMN IF NOT EXISTS recipient_email TEXT;

-- Create index on recipient_email for performance
CREATE INDEX IF NOT EXISTS idx_user_email_notifications_recipient_email
  ON public.user_email_notifications(recipient_email);

-- Add helpful comment
COMMENT ON COLUMN public.user_email_notifications.recipient_email IS 'Email address of recipient (for tracking emails sent to non-users like Airtable valuations)';
