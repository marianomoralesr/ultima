-- Migration: Add email notification triggers for application and document status changes
-- This migration creates functions and triggers to automatically send emails via Brevo
-- when application status or document status changes.

-- Function to send email notification for application status changes
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
    user_name text;
    user_first_name text;
    vehicle_title text;
    old_status_label text;
    new_status_label text;
    status_url text;
BEGIN
    -- Only send notification if status actually changed
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        -- Get user information
        SELECT
            p.email,
            COALESCE(p.first_name || ' ' || p.last_name, p.email),
            COALESCE(p.first_name, 'Cliente')
        INTO user_email, user_name, user_first_name
        FROM public.profiles p
        WHERE p.id = NEW.user_id;

        -- Get vehicle title if available
        vehicle_title := COALESCE(NEW.car_info->>'_vehicleTitle', 'Tu vehículo');

        -- Create status URL
        status_url := 'https://trefa.mx/escritorio/solicitudes';

        -- Map status codes to labels
        old_status_label := CASE OLD.status
            WHEN 'draft' THEN 'Borrador'
            WHEN 'submitted' THEN 'Enviada'
            WHEN 'reviewing' THEN 'En Revisión'
            WHEN 'pending_docs' THEN 'Documentos Pendientes'
            WHEN 'approved' THEN 'Aprobada'
            WHEN 'rejected' THEN 'Rechazada'
            ELSE OLD.status
        END;

        new_status_label := CASE NEW.status
            WHEN 'draft' THEN 'Borrador'
            WHEN 'submitted' THEN 'Enviada'
            WHEN 'reviewing' THEN 'En Revisión'
            WHEN 'pending_docs' THEN 'Documentos Pendientes'
            WHEN 'approved' THEN 'Aprobada'
            WHEN 'rejected' THEN 'Rechazada'
            ELSE NEW.status
        END;

        -- Call the Edge Function to send email (async, fire and forget)
        PERFORM
            net.http_post(
                url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-brevo-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
                ),
                body := jsonb_build_object(
                    'to', user_email,
                    'toName', user_name,
                    'subject', 'Actualización de tu Solicitud - Trefa Autos',
                    'templateType', 'status_changed',
                    'templateData', jsonb_build_object(
                        'clientName', user_first_name,
                        'vehicleTitle', vehicle_title,
                        'oldStatus', OLD.status,
                        'oldStatusLabel', old_status_label,
                        'newStatus', NEW.status,
                        'newStatusLabel', new_status_label,
                        'statusUrl', status_url
                    )
                )
            );
    END IF;

    RETURN NEW;
END;
$$;

-- Function to send email notification for document status changes
CREATE OR REPLACE FUNCTION public.notify_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
    user_name text;
    user_first_name text;
    documents_url text;
BEGIN
    -- Only send notification if status actually changed and it's not the initial insert
    IF NEW.status IS DISTINCT FROM OLD.status AND OLD.status IS NOT NULL THEN
        -- Get user information
        SELECT
            p.email,
            COALESCE(p.first_name || ' ' || p.last_name, p.email),
            COALESCE(p.first_name, 'Cliente')
        INTO user_email, user_name, user_first_name
        FROM public.profiles p
        WHERE p.id = NEW.user_id;

        -- Create documents URL
        documents_url := 'https://trefa.mx/escritorio/solicitudes';

        -- Call the Edge Function to send email (async, fire and forget)
        PERFORM
            net.http_post(
                url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-brevo-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
                ),
                body := jsonb_build_object(
                    'to', user_email,
                    'toName', user_name,
                    'subject', 'Actualización de Documento - Trefa Autos',
                    'templateType', 'document_status_changed',
                    'templateData', jsonb_build_object(
                        'clientName', user_first_name,
                        'documentName', NEW.file_name,
                        'documentType', NEW.document_type,
                        'documentStatus', NEW.status,
                        'documentsUrl', documents_url
                    )
                )
            );
    END IF;

    RETURN NEW;
END;
$$;

-- Function to send email notification when application is submitted
CREATE OR REPLACE FUNCTION public.notify_application_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
    user_name text;
    user_first_name text;
    vehicle_title text;
    status_url text;
BEGIN
    -- Only send notification when status changes FROM draft TO submitted
    IF OLD.status = 'draft' AND NEW.status = 'submitted' THEN
        -- Get user information
        SELECT
            p.email,
            COALESCE(p.first_name || ' ' || p.last_name, p.email),
            COALESCE(p.first_name, 'Cliente')
        INTO user_email, user_name, user_first_name
        FROM public.profiles p
        WHERE p.id = NEW.user_id;

        -- Get vehicle title if available
        vehicle_title := COALESCE(NEW.car_info->>'_vehicleTitle', '');

        -- Create status URL
        status_url := 'https://trefa.mx/escritorio/solicitudes';

        -- Call the Edge Function to send email (async, fire and forget)
        PERFORM
            net.http_post(
                url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-brevo-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
                ),
                body := jsonb_build_object(
                    'to', user_email,
                    'toName', user_name,
                    'subject', '¡Solicitud Recibida! - Trefa Autos',
                    'templateType', 'application_submitted',
                    'templateData', jsonb_build_object(
                        'clientName', user_first_name,
                        'vehicleTitle', vehicle_title,
                        'submittedAt', NEW.updated_at,
                        'statusUrl', status_url
                    )
                )
            );
    END IF;

    RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_application_status_change ON public.financing_applications;
DROP TRIGGER IF EXISTS trigger_document_status_change ON public.uploaded_documents;
DROP TRIGGER IF EXISTS trigger_application_submitted ON public.financing_applications;

-- Create trigger for application status changes (general status updates)
CREATE TRIGGER trigger_application_status_change
    AFTER UPDATE ON public.financing_applications
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status != 'submitted')
    EXECUTE FUNCTION public.notify_application_status_change();

-- Create trigger for application submission (specific for draft -> submitted)
CREATE TRIGGER trigger_application_submitted
    AFTER UPDATE ON public.financing_applications
    FOR EACH ROW
    WHEN (OLD.status = 'draft' AND NEW.status = 'submitted')
    EXECUTE FUNCTION public.notify_application_submitted();

-- Create trigger for document status changes
CREATE TRIGGER trigger_document_status_change
    AFTER UPDATE ON public.uploaded_documents
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.notify_document_status_change();

-- Add configuration for Supabase URL and Anon Key (these will need to be set via SQL)
-- Run these commands manually or via your deployment script:
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'your-anon-key';

COMMENT ON FUNCTION public.notify_application_status_change() IS 'Sends email notification when application status changes';
COMMENT ON FUNCTION public.notify_document_status_change() IS 'Sends email notification when document status changes';
COMMENT ON FUNCTION public.notify_application_submitted() IS 'Sends email notification when application is submitted';
