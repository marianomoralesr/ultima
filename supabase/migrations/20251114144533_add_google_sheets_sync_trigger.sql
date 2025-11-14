-- Migration: Add Google Sheets sync trigger for financing applications
-- This trigger automatically syncs applications to Google Sheets when submitted

-- Create a function to invoke the google-sheets-sync Edge Function
CREATE OR REPLACE FUNCTION public.trigger_google_sheets_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  function_url text;
BEGIN
  -- Only sync when status changes to submitted, reviewing, pending_docs, approved, or rejected
  -- Skip drafts
  IF NEW.status NOT IN ('submitted', 'reviewing', 'pending_docs', 'approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Get the Supabase function URL from environment
  -- You'll need to set this up in your Supabase project settings
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/google-sheets-sync';

  -- If the setting is not available, construct it from SUPABASE_URL env var
  -- In production, this will be set via the edge function service
  IF function_url IS NULL OR function_url = '' THEN
    function_url := 'https://your-project.supabase.co/functions/v1/google-sheets-sync';
  END IF;

  -- Make async HTTP request to the Edge Function using pg_net
  -- This is non-blocking and won't slow down the application submission
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'role'
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW)
    )
  ) INTO request_id;

  -- Log the request (optional, for debugging)
  RAISE NOTICE 'Google Sheets sync triggered for application %, request_id: %', NEW.id, request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the application submission
    RAISE WARNING 'Failed to trigger Google Sheets sync for application %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION public.trigger_google_sheets_sync() IS
  'Triggers the google-sheets-sync Edge Function when a financing application is submitted or updated';

-- Create the trigger on financing_applications table
-- This fires AFTER INSERT or UPDATE
DROP TRIGGER IF EXISTS on_application_sync_to_sheets ON public.financing_applications;

CREATE TRIGGER on_application_sync_to_sheets
  AFTER INSERT OR UPDATE OF status ON public.financing_applications
  FOR EACH ROW
  WHEN (NEW.status IN ('submitted', 'reviewing', 'pending_docs', 'approved', 'rejected'))
  EXECUTE FUNCTION public.trigger_google_sheets_sync();

-- Add comment to the trigger
COMMENT ON TRIGGER on_application_sync_to_sheets ON public.financing_applications IS
  'Automatically syncs financing applications to Google Sheets when submitted or status changes';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.trigger_google_sheets_sync() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_google_sheets_sync() TO service_role;
