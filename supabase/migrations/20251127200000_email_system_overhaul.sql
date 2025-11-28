-- ============================================================================
-- COMPLETE EMAIL SYSTEM OVERHAUL - Autos TREFA
-- ============================================================================
-- Removes legacy triggers and creates modern email notification system
-- ============================================================================

-- ============================================================================
-- PART 1: Clean up legacy triggers and functions
-- ============================================================================

DROP TRIGGER IF EXISTS on_application_status_change ON public.financing_applications;
DROP TRIGGER IF EXISTS trigger_application_status_change ON public.financing_applications;
DROP TRIGGER IF EXISTS trigger_application_submitted ON public.financing_applications;
DROP TRIGGER IF EXISTS trigger_document_status_change ON public.uploaded_documents;

DROP FUNCTION IF EXISTS handle_application_status_change();
DROP FUNCTION IF EXISTS notify_application_status_change();
DROP FUNCTION IF EXISTS notify_application_submitted();
DROP FUNCTION IF EXISTS notify_document_status_change();

-- ============================================================================
-- PART 2: Create modern status change email system
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_status_change_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url text;
  v_notifiable_statuses text[] := ARRAY['Faltan Documentos', 'Completa', 'En Revisión', 'Aprobada', 'Rechazada'];
BEGIN
  -- Get Supabase URL
  v_supabase_url := current_setting('app.settings.supabase_url', true);

  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://jjepfehmuybpctdzipnu.supabase.co';
  END IF;

  -- Only trigger on UPDATE operations when status actually changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN

    -- Only send emails for specific statuses
    IF NEW.status = ANY(v_notifiable_statuses) THEN

      -- Check for duplicate email in last hour to prevent spam
      IF NOT EXISTS (
        SELECT 1 FROM public.user_email_notifications
        WHERE user_id = NEW.user_id
        AND email_type = 'status_change_' || lower(replace(NEW.status, ' ', '_'))
        AND metadata->>'application_id' = NEW.id::text
        AND sent_at > NOW() - INTERVAL '1 hour'
      ) THEN

        -- Call status change email edge function
        PERFORM net.http_post(
          url := v_supabase_url || '/functions/v1/brevo-status-change-emails',
          headers := jsonb_build_object(
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object(
            'record', to_jsonb(NEW),
            'old_record', to_jsonb(OLD)
          )
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

-- Create trigger for status changes
CREATE TRIGGER on_financing_application_status_change
  AFTER UPDATE ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_status_change_email();

COMMENT ON FUNCTION handle_status_change_email IS
'Sends email notifications when application status changes to specific values';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration has:
-- ✅ Removed all legacy email triggers and functions
-- ✅ Created modern status change email system with duplicate prevention
-- ✅ Uses correct status values: Faltan Documentos, Completa, En Revisión, Aprobada, Rechazada
-- ============================================================================
