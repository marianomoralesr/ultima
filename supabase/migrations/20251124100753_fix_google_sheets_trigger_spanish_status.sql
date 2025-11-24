-- ============================================================================
-- FIX GOOGLE SHEETS SYNC TRIGGER - SUPPORT SPANISH STATUS VALUES
-- ============================================================================
-- Issue: The trigger was checking for English status values but the app uses Spanish
-- This prevented applications from syncing to Google Sheets
-- ============================================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_application_sync_to_sheets ON public.financing_applications;

-- Recreate trigger with both Spanish and English status values
CREATE TRIGGER on_application_sync_to_sheets
  AFTER INSERT OR UPDATE OF status ON public.financing_applications
  FOR EACH ROW
  WHEN (
    NEW.status IN (
      -- Spanish status values (current)
      'Completa', 
      'Faltan Documentos', 
      'En Revisión', 
      'Aprobada', 
      'Rechazada',
      -- English status values (legacy, for backward compatibility)
      'submitted', 
      'reviewing', 
      'pending_docs', 
      'approved', 
      'rejected'
    )
  )
  EXECUTE FUNCTION public.trigger_google_sheets_sync();

-- Update the trigger function to handle both status types
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
  -- Skip drafts (both Spanish and English)
  IF NEW.status IN ('draft', 'Borrador') THEN
    RETURN NEW;
  END IF;

  -- Get the Supabase function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/google-sheets-sync';

  -- If the setting is not available, use the project URL
  IF function_url IS NULL OR function_url = '' THEN
    function_url := 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/google-sheets-sync';
  END IF;

  -- Make async HTTP request to the Edge Function using pg_net
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
  RAISE NOTICE 'Google Sheets sync triggered for application % with status %, request_id: %', NEW.id, NEW.status, request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the application submission
    RAISE WARNING 'Failed to trigger Google Sheets sync for application %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON TRIGGER on_application_sync_to_sheets ON public.financing_applications IS
  'Automatically syncs financing applications to Google Sheets when submitted or status changes (supports Spanish and English status values)';

COMMENT ON FUNCTION public.trigger_google_sheets_sync() IS
  'Triggers the google-sheets-sync Edge Function when a financing application is submitted or updated (supports Spanish and English status values)';
