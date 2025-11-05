-- ==================================================================================
-- SETUP AUTOMATED EMAIL NOTIFICATIONS CRON JOB
-- ==================================================================================
-- Run this SQL in the Supabase SQL Editor to set up daily automated emails
-- https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql
-- ==================================================================================

-- Step 1: Remove any existing cron job with the same name (for idempotency)
DO $$
BEGIN
  PERFORM cron.unschedule('send-automated-email-notifications');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No existing cron job to remove';
END $$;

-- Step 2: Get your Supabase project URL and service role key
-- Replace these values with your actual credentials from:
-- https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/api

-- Step 3: Schedule the automated email notifications
-- Runs daily at 10:00 AM UTC (4:00 AM CST Mexico time)
SELECT cron.schedule(
  'send-automated-email-notifications', -- job name
  '0 10 * * *', -- cron schedule: Every day at 10:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/automated-email-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5OTYwMywiZXhwIjoyMDU5Nzc1NjAzfQ.jj5YZ-b3z_eYt36vqxqDRlNsAH8Qp6bGPm4lR0_9Wkw'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Step 4: Create a log table to track email notification runs
CREATE TABLE IF NOT EXISTS public.email_notification_logs (
  id BIGSERIAL PRIMARY KEY,
  run_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  results JSONB,
  error TEXT
);

-- Step 5: Enable RLS on the log table
ALTER TABLE public.email_notification_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow service role to insert logs" ON public.email_notification_logs;
DROP POLICY IF EXISTS "Allow authenticated users to view logs" ON public.email_notification_logs;

-- Step 7: Create policy to allow service role to insert logs
CREATE POLICY "Allow service role to insert logs"
  ON public.email_notification_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Step 8: Create policy to allow authenticated users to view logs
CREATE POLICY "Allow authenticated users to view logs"
  ON public.email_notification_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 9: Add helpful comment
COMMENT ON TABLE public.email_notification_logs IS 'Logs for automated email notification runs';

-- ==================================================================================
-- VERIFICATION QUERIES
-- ==================================================================================

-- Verify the cron job was created successfully
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'send-automated-email-notifications';

-- View recent cron job execution history
SELECT
  job_id,
  run_id,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job
  WHERE jobname = 'send-automated-email-notifications'
)
ORDER BY start_time DESC
LIMIT 10;

-- View email notification logs
SELECT *
FROM public.email_notification_logs
ORDER BY run_at DESC
LIMIT 20;

-- ==================================================================================
-- MANUAL TESTING
-- ==================================================================================
-- To manually test the function (without waiting for the cron schedule):
-- Uncomment and run the following:

/*
SELECT
  net.http_post(
    url := 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/automated-email-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5OTYwMywiZXhwIjoyMDU5Nzc1NjAzfQ.jj5YZ-b3z_eYt36vqxqDRlNsAH8Qp6bGPm4lR0_9Wkw'
    ),
    body := '{}'::jsonb
  ) AS request_id;
*/

-- ==================================================================================
-- TROUBLESHOOTING
-- ==================================================================================

-- If the cron job is not running, check:
-- 1. Verify pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 2. Check if the cron job exists and is active
SELECT * FROM cron.job WHERE jobname = 'send-automated-email-notifications';

-- 3. Check for failed job runs
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC
LIMIT 10;

-- 4. To unschedule (delete) the cron job:
-- SELECT cron.unschedule('send-automated-email-notifications');

-- 5. To change the schedule (must unschedule first, then reschedule)
