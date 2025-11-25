-- Tabla para analytics de links de carga de documentos
-- Trackea eventos importantes del flujo de documentos

CREATE TABLE IF NOT EXISTS public.document_upload_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'link_generated',     -- Link creado/regenerado
    'link_viewed',        -- Usuario vio la página de confirmación
    'qr_scanned',         -- Usuario escaneó QR (estimado por visitas móviles)
    'dropzone_opened',    -- Usuario abrió el dropzone
    'document_uploaded',  -- Documento individual subido
    'all_docs_complete',  -- Todos los documentos requeridos completados
    'link_expired'        -- Link expirado sin uso
  )),
  metadata JSONB,         -- Datos adicionales específicos del evento
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Índices para búsquedas rápidas
  CONSTRAINT valid_event_type CHECK (event_type IS NOT NULL)
);

-- Índices para queries de analytics
CREATE INDEX idx_document_upload_analytics_application
ON public.document_upload_analytics(application_id);

CREATE INDEX idx_document_upload_analytics_user
ON public.document_upload_analytics(user_id);

CREATE INDEX idx_document_upload_analytics_event_type
ON public.document_upload_analytics(event_type);

CREATE INDEX idx_document_upload_analytics_created_at
ON public.document_upload_analytics(created_at DESC);

CREATE INDEX idx_document_upload_analytics_app_event
ON public.document_upload_analytics(application_id, event_type);

-- Vista para métricas agregadas
CREATE OR REPLACE VIEW public.document_upload_metrics AS
SELECT
  fa.id as application_id,
  fa.user_id,
  fa.status,
  fa.created_at as application_created_at,
  fa.token_expires_at,

  -- Contadores de eventos
  COUNT(DISTINCT CASE WHEN dua.event_type = 'link_viewed' THEN dua.id END) as views_count,
  COUNT(DISTINCT CASE WHEN dua.event_type = 'dropzone_opened' THEN dua.id END) as dropzone_opens,
  COUNT(DISTINCT CASE WHEN dua.event_type = 'document_uploaded' THEN dua.id END) as documents_uploaded,
  COUNT(DISTINCT CASE WHEN dua.event_type = 'all_docs_complete' THEN dua.id END) as completion_count,

  -- Timestamps importantes
  MIN(CASE WHEN dua.event_type = 'link_generated' THEN dua.created_at END) as link_generated_at,
  MIN(CASE WHEN dua.event_type = 'link_viewed' THEN dua.created_at END) as first_view_at,
  MIN(CASE WHEN dua.event_type = 'dropzone_opened' THEN dua.created_at END) as first_dropzone_open_at,
  MIN(CASE WHEN dua.event_type = 'document_uploaded' THEN dua.created_at END) as first_document_at,
  MAX(CASE WHEN dua.event_type = 'document_uploaded' THEN dua.created_at END) as last_document_at,
  MIN(CASE WHEN dua.event_type = 'all_docs_complete' THEN dua.created_at END) as completed_at,

  -- Métricas calculadas
  CASE
    WHEN MIN(CASE WHEN dua.event_type = 'all_docs_complete' THEN dua.created_at END) IS NOT NULL
      AND MIN(CASE WHEN dua.event_type = 'link_generated' THEN dua.created_at END) IS NOT NULL
    THEN EXTRACT(EPOCH FROM (
      MIN(CASE WHEN dua.event_type = 'all_docs_complete' THEN dua.created_at END) -
      MIN(CASE WHEN dua.event_type = 'link_generated' THEN dua.created_at END)
    )) / 3600.0  -- Horas
    ELSE NULL
  END as hours_to_complete,

  -- Estado del link
  CASE
    WHEN fa.token_expires_at < NOW() THEN 'expired'
    WHEN COUNT(CASE WHEN dua.event_type = 'all_docs_complete' THEN 1 END) > 0 THEN 'completed'
    WHEN COUNT(CASE WHEN dua.event_type = 'document_uploaded' THEN 1 END) > 0 THEN 'in_progress'
    WHEN COUNT(CASE WHEN dua.event_type = 'dropzone_opened' THEN 1 END) > 0 THEN 'opened'
    WHEN COUNT(CASE WHEN dua.event_type = 'link_viewed' THEN 1 END) > 0 THEN 'viewed'
    ELSE 'not_opened'
  END as link_status

FROM public.financing_applications fa
LEFT JOIN public.document_upload_analytics dua ON dua.application_id = fa.id
WHERE fa.public_upload_token IS NOT NULL
GROUP BY fa.id, fa.user_id, fa.status, fa.created_at, fa.token_expires_at;

-- Función helper para registrar eventos
CREATE OR REPLACE FUNCTION track_document_upload_event(
  p_application_id UUID,
  p_event_type TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_event_id UUID;
BEGIN
  -- Obtener user_id de la aplicación
  SELECT user_id INTO v_user_id
  FROM public.financing_applications
  WHERE id = p_application_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found: %', p_application_id;
  END IF;

  -- Insertar evento
  INSERT INTO public.document_upload_analytics (
    application_id,
    user_id,
    event_type,
    metadata
  ) VALUES (
    p_application_id,
    v_user_id,
    p_event_type,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- RLS Policies
ALTER TABLE public.document_upload_analytics ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propios eventos
CREATE POLICY "Users can view their own analytics"
ON public.document_upload_analytics
FOR SELECT
USING (auth.uid() = user_id);

-- Admin y sales pueden ver todos los eventos
CREATE POLICY "Admin and sales can view all analytics"
ON public.document_upload_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'sales')
  )
);

-- Sistema puede insertar eventos (via service role)
CREATE POLICY "Service role can insert analytics"
ON public.document_upload_analytics
FOR INSERT
WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE public.document_upload_analytics IS
'Analytics de eventos del flujo de carga de documentos públicos';

COMMENT ON COLUMN public.document_upload_analytics.event_type IS
'Tipo de evento: link_generated, link_viewed, qr_scanned, dropzone_opened, document_uploaded, all_docs_complete, link_expired';

COMMENT ON COLUMN public.document_upload_analytics.metadata IS
'Datos adicionales del evento en formato JSON (ej: document_type, file_size, user_agent, etc.)';

COMMENT ON VIEW public.document_upload_metrics IS
'Vista agregada con métricas clave por aplicación para analytics';

COMMENT ON FUNCTION track_document_upload_event IS
'Helper function para registrar eventos de analytics de forma segura';
