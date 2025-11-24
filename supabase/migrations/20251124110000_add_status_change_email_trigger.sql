-- ============================================================================
-- ADD STATUS CHANGE EMAIL NOTIFICATIONS TRIGGER
-- ============================================================================
-- Automatically sends emails when application status changes to:
-- - Faltan Documentos
-- - Completa
-- - En Revisión
-- - Aprobada
-- - Rechazada
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_application_status_change ON public.financing_applications;
DROP FUNCTION IF EXISTS handle_application_status_change();

-- Create function to handle status change webhooks
CREATE OR REPLACE FUNCTION handle_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payload jsonb;
  v_supabase_url text;
  v_service_role_key text;
BEGIN
  -- Get Supabase URL from environment (will be available in function context)
  v_supabase_url := current_setting('app.settings.supabase_url', true);

  -- Only trigger on status updates (not inserts)
  IF TG_OP = 'UPDATE' THEN
    -- Check if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      -- Only send emails for specific statuses
      IF NEW.status IN ('Faltan Documentos', 'Completa', 'En Revisión', 'Aprobada', 'Rechazada') THEN

        -- Build payload
        v_payload := jsonb_build_object(
          'record', to_jsonb(NEW),
          'old_record', to_jsonb(OLD)
        );

        -- Call edge function via HTTP POST (async)
        -- This will be handled by Supabase's webhook system
        PERFORM net.http_post(
          url := v_supabase_url || '/functions/v1/brevo-status-change-emails',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key
          ),
          body := v_payload
        );

      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to trigger status change email: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger on financing_applications table
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_application_status_change();

COMMENT ON FUNCTION handle_application_status_change IS
'Triggers email notifications when application status changes to specific values';

COMMENT ON TRIGGER on_application_status_change ON public.financing_applications IS
'Sends automated emails via Brevo when application status changes';
