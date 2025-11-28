-- ============================================================================
-- APLICAR MANUALMENTE ESTAS 2 MIGRACIONES EN EL DASHBOARD DE SUPABASE
-- Dashboard: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new
-- ============================================================================

-- ============================================================================
-- MIGRACIÓN 1: Facebook Catalogue Events
-- ============================================================================

-- Crear tabla para tracking de eventos de Facebook Catalogue
CREATE TABLE IF NOT EXISTS public.facebook_catalogue_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('ViewContent', 'Search', 'AddToCart', 'InitiateCheckout', 'Lead', 'Purchase')),
  vehicle_id TEXT,
  vehicle_data JSONB,
  search_query TEXT,
  interaction_type TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  fbclid TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_created_at ON public.facebook_catalogue_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_event_type ON public.facebook_catalogue_events(event_type);
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_vehicle_id ON public.facebook_catalogue_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_session_id ON public.facebook_catalogue_events(session_id);
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_user_id ON public.facebook_catalogue_events(user_id);
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_fbclid ON public.facebook_catalogue_events(fbclid) WHERE fbclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_vehicle_event ON public.facebook_catalogue_events(vehicle_id, event_type, created_at DESC);

-- RLS
ALTER TABLE public.facebook_catalogue_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Cualquiera puede insertar eventos de catálogo" ON public.facebook_catalogue_events;
CREATE POLICY "Cualquiera puede insertar eventos de catálogo"
ON public.facebook_catalogue_events
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Solo admins pueden leer eventos de catálogo" ON public.facebook_catalogue_events;
CREATE POLICY "Solo admins pueden leer eventos de catálogo"
ON public.facebook_catalogue_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Solo admins pueden eliminar eventos de catálogo" ON public.facebook_catalogue_events;
CREATE POLICY "Solo admins pueden eliminar eventos de catálogo"
ON public.facebook_catalogue_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permisos
GRANT SELECT, INSERT ON public.facebook_catalogue_events TO authenticated;
GRANT SELECT ON public.facebook_catalogue_events TO anon;
GRANT INSERT ON public.facebook_catalogue_events TO anon;

-- Funciones de análisis
CREATE OR REPLACE FUNCTION public.get_catalogue_metrics(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_views BIGINT,
  total_searches BIGINT,
  total_add_to_cart BIGINT,
  total_checkouts BIGINT,
  total_leads BIGINT,
  unique_vehicles_viewed BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'ViewContent') as total_views,
    COUNT(*) FILTER (WHERE event_type = 'Search') as total_searches,
    COUNT(*) FILTER (WHERE event_type = 'AddToCart') as total_add_to_cart,
    COUNT(*) FILTER (WHERE event_type = 'InitiateCheckout') as total_checkouts,
    COUNT(*) FILTER (WHERE event_type = 'Lead') as total_leads,
    COUNT(DISTINCT vehicle_id) FILTER (WHERE event_type = 'ViewContent') as unique_vehicles_viewed,
    CASE
      WHEN COUNT(*) FILTER (WHERE event_type = 'ViewContent') > 0
      THEN (COUNT(*) FILTER (WHERE event_type = 'Lead')::NUMERIC / COUNT(*) FILTER (WHERE event_type = 'ViewContent')::NUMERIC) * 100
      ELSE 0
    END as conversion_rate
  FROM public.facebook_catalogue_events
  WHERE created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_top_performing_vehicles(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  vehicle_id TEXT,
  vehicle_title TEXT,
  vehicle_price NUMERIC,
  view_count BIGINT,
  add_to_cart_count BIGINT,
  checkout_count BIGINT,
  lead_count BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.vehicle_id,
    (e.vehicle_data->>'title')::TEXT as vehicle_title,
    (e.vehicle_data->>'price')::NUMERIC as vehicle_price,
    COUNT(*) FILTER (WHERE e.event_type = 'ViewContent') as view_count,
    COUNT(*) FILTER (WHERE e.event_type = 'AddToCart') as add_to_cart_count,
    COUNT(*) FILTER (WHERE e.event_type = 'InitiateCheckout') as checkout_count,
    COUNT(*) FILTER (WHERE e.event_type = 'Lead') as lead_count,
    CASE
      WHEN COUNT(*) FILTER (WHERE e.event_type = 'ViewContent') > 0
      THEN (COUNT(*) FILTER (WHERE e.event_type = 'Lead')::NUMERIC / COUNT(*) FILTER (WHERE e.event_type = 'ViewContent')::NUMERIC) * 100
      ELSE 0
    END as conversion_rate
  FROM public.facebook_catalogue_events e
  WHERE e.created_at BETWEEN start_date AND end_date
    AND e.vehicle_id IS NOT NULL
  GROUP BY e.vehicle_id, e.vehicle_data->>'title', e.vehicle_data->>'price'
  ORDER BY view_count DESC, conversion_rate DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP VIEW IF EXISTS public.catalogue_funnel_by_vehicle;
CREATE VIEW public.catalogue_funnel_by_vehicle AS
SELECT
  vehicle_id,
  vehicle_data->>'title' as vehicle_title,
  vehicle_data->>'brand' as brand,
  vehicle_data->>'model' as model,
  (vehicle_data->>'year')::INTEGER as year,
  (vehicle_data->>'price')::NUMERIC as price,
  COUNT(*) FILTER (WHERE event_type = 'ViewContent') as views,
  COUNT(*) FILTER (WHERE event_type = 'AddToCart') as interactions,
  COUNT(*) FILTER (WHERE event_type = 'InitiateCheckout') as checkouts,
  COUNT(*) FILTER (WHERE event_type = 'Lead') as leads,
  CASE
    WHEN COUNT(*) FILTER (WHERE event_type = 'ViewContent') > 0
    THEN (COUNT(*) FILTER (WHERE event_type = 'Lead')::NUMERIC / COUNT(*) FILTER (WHERE event_type = 'ViewContent')::NUMERIC) * 100
    ELSE 0
  END as conversion_rate,
  MAX(created_at) as last_activity
FROM public.facebook_catalogue_events
WHERE vehicle_id IS NOT NULL
GROUP BY vehicle_id, vehicle_data;

-- Registrar migración
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20251127000000', 'create_facebook_catalogue_events', ARRAY['CREATE TABLE', 'CREATE INDEX', 'ALTER TABLE', 'CREATE POLICY', 'CREATE FUNCTION', 'CREATE VIEW'])
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- MIGRACIÓN 2: Email System Overhaul
-- ============================================================================

-- Limpiar triggers y funciones legacy
DROP TRIGGER IF EXISTS on_application_status_change ON public.financing_applications;
DROP TRIGGER IF EXISTS trigger_application_status_change ON public.financing_applications;
DROP TRIGGER IF EXISTS trigger_application_submitted ON public.financing_applications;
DROP TRIGGER IF EXISTS trigger_document_status_change ON public.uploaded_documents;

DROP FUNCTION IF EXISTS handle_application_status_change();
DROP FUNCTION IF EXISTS notify_application_status_change();
DROP FUNCTION IF EXISTS notify_application_submitted();
DROP FUNCTION IF EXISTS notify_document_status_change();

-- Crear función moderna para manejo de emails
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

  -- Solo trigger en UPDATE cuando status cambió
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN

    -- Solo enviar emails para status específicos
    IF NEW.status = ANY(v_notifiable_statuses) THEN

      -- Verificar duplicados en última hora para prevenir spam
      IF NOT EXISTS (
        SELECT 1 FROM public.user_email_notifications
        WHERE user_id = NEW.user_id
        AND email_type = 'status_change_' || lower(replace(NEW.status, ' ', '_'))
        AND metadata->>'application_id' = NEW.id::text
        AND sent_at > NOW() - INTERVAL '1 hour'
      ) THEN

        -- Llamar edge function de cambio de status
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
  -- Log error pero no fallar la transacción
  RAISE WARNING 'Failed to trigger status change email: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Crear trigger para cambios de status
DROP TRIGGER IF EXISTS on_financing_application_status_change ON public.financing_applications;
CREATE TRIGGER on_financing_application_status_change
  AFTER UPDATE ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_status_change_email();

-- Registrar migración
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20251127200000', 'email_system_overhaul', ARRAY['DROP TRIGGER', 'DROP FUNCTION', 'CREATE FUNCTION', 'CREATE TRIGGER'])
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- FIN - Migraciones aplicadas exitosamente
-- ============================================================================
