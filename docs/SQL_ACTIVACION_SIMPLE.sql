-- ============================================================================
-- ACTIVACIÓN SIMPLE DEL SISTEMA DE EMAILS - SIN TIMEOUT
-- ============================================================================
-- Ejecuta este SQL en partes si es necesario
-- ============================================================================

-- PARTE 1: Limpiar triggers antiguos (ejecutar primero)
-- ============================================================================

DROP TRIGGER IF EXISTS on_application_status_change ON public.financing_applications CASCADE;
DROP TRIGGER IF EXISTS trigger_application_status_change ON public.financing_applications CASCADE;
DROP TRIGGER IF EXISTS trigger_application_submitted ON public.financing_applications CASCADE;
DROP TRIGGER IF EXISTS trigger_document_status_change ON public.uploaded_documents CASCADE;

-- ============================================================================
-- PARTE 2: Eliminar funciones antiguas (ejecutar después de PARTE 1)
-- ============================================================================

DROP FUNCTION IF EXISTS handle_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS notify_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS notify_application_submitted() CASCADE;
DROP FUNCTION IF EXISTS notify_document_status_change() CASCADE;

-- ============================================================================
-- PARTE 3: Crear nueva función SIN verificación de duplicados (ejecutar después de PARTE 2)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_status_change_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url text := 'https://jjepfehmuybpctdzipnu.supabase.co';
  v_notifiable_statuses text[] := ARRAY['Faltan Documentos', 'Completa', 'En Revisión', 'Aprobada', 'Rechazada'];
BEGIN
  -- Solo procesar cuando el status cambia
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN

    -- Solo enviar emails para statuses específicos
    IF NEW.status = ANY(v_notifiable_statuses) THEN

      -- Llamar Edge Function para enviar email (sin verificar duplicados por ahora)
      BEGIN
        PERFORM net.http_post(
          url := v_supabase_url || '/functions/v1/brevo-status-change-emails',
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := jsonb_build_object(
            'record', to_jsonb(NEW),
            'old_record', to_jsonb(OLD)
          )
        );
      EXCEPTION WHEN OTHERS THEN
        -- Si falla el HTTP, solo registrar warning (no fallar la transacción)
        RAISE WARNING 'Error enviando email HTTP: %', SQLERRM;
      END;

    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- No fallar la transacción si hay error
  RAISE WARNING 'Error en trigger de email: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PARTE 4: Crear trigger (ejecutar después de PARTE 3)
-- ============================================================================

CREATE TRIGGER on_financing_application_status_change
  AFTER UPDATE ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_status_change_email();

-- ============================================================================
-- VERIFICACIÓN: Ejecuta esto para confirmar que todo se creó
-- ============================================================================

-- Ver que el trigger existe
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'on_financing_application_status_change';

-- Ver que la función existe
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_status_change_email';

-- ============================================================================
-- ¡LISTO! Ahora prueba cambiando el status de una aplicación
-- ============================================================================
