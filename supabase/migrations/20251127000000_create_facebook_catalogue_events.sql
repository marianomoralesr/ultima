-- Crear tabla para tracking de eventos de Facebook Catalogue
-- Esta tabla registra todos los eventos relacionados con el catálogo de vehículos
-- para análisis de performance y atribución de conversiones

CREATE TABLE IF NOT EXISTS public.facebook_catalogue_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tipo de evento (ViewContent, Search, AddToCart, InitiateCheckout, Lead, Purchase)
  event_type TEXT NOT NULL CHECK (event_type IN ('ViewContent', 'Search', 'AddToCart', 'InitiateCheckout', 'Lead', 'Purchase')),

  -- Información del vehículo
  vehicle_id TEXT, -- ID del vehículo del catálogo
  vehicle_data JSONB, -- Datos completos del vehículo {id, title, price, brand, model, year, category, slug}

  -- Información de búsqueda
  search_query TEXT, -- Query de búsqueda (solo para evento Search)

  -- Tipo de interacción (para AddToCart: calculator, whatsapp, contact, favorite, etc.)
  interaction_type TEXT,

  -- Información del usuario
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,

  -- Información de atribución
  fbclid TEXT, -- Facebook Click ID para atribución

  -- Metadata adicional
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_created_at ON public.facebook_catalogue_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_event_type ON public.facebook_catalogue_events(event_type);
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_vehicle_id ON public.facebook_catalogue_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_session_id ON public.facebook_catalogue_events(session_id);
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_user_id ON public.facebook_catalogue_events(user_id);
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_fbclid ON public.facebook_catalogue_events(fbclid) WHERE fbclid IS NOT NULL;

-- Índice compuesto para análisis de conversión por vehículo
CREATE INDEX IF NOT EXISTS idx_fb_catalogue_events_vehicle_event ON public.facebook_catalogue_events(vehicle_id, event_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.facebook_catalogue_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Permitir a cualquiera insertar eventos (para tracking desde frontend)
CREATE POLICY "Cualquiera puede insertar eventos de catálogo"
ON public.facebook_catalogue_events
FOR INSERT
TO public
WITH CHECK (true);

-- Solo admins pueden leer eventos
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

-- Solo admins pueden eliminar eventos
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

-- Grant permissions
GRANT SELECT, INSERT ON public.facebook_catalogue_events TO authenticated;
GRANT SELECT ON public.facebook_catalogue_events TO anon;
GRANT INSERT ON public.facebook_catalogue_events TO anon;

-- Comentarios para documentación
COMMENT ON TABLE public.facebook_catalogue_events IS 'Registra eventos de Facebook Pixel relacionados con el catálogo de vehículos para análisis de performance y atribución';
COMMENT ON COLUMN public.facebook_catalogue_events.event_type IS 'Tipo de evento estándar de Facebook: ViewContent, Search, AddToCart, InitiateCheckout, Lead, Purchase';
COMMENT ON COLUMN public.facebook_catalogue_events.vehicle_id IS 'ID del vehículo en inventario_cache (puede ser record_id o id)';
COMMENT ON COLUMN public.facebook_catalogue_events.vehicle_data IS 'Snapshot de datos del vehículo al momento del evento';
COMMENT ON COLUMN public.facebook_catalogue_events.interaction_type IS 'Tipo de interacción del usuario: calculator, whatsapp, contact, favorite, scroll, etc.';
COMMENT ON COLUMN public.facebook_catalogue_events.fbclid IS 'Facebook Click ID para atribución de conversiones desde anuncios de Facebook';
COMMENT ON COLUMN public.facebook_catalogue_events.session_id IS 'ID de sesión único para agrupar eventos del mismo usuario';

-- Crear función para obtener métricas de catálogo
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

-- Crear función para obtener top vehículos
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

-- Crear vista para análisis de embudo por vehículo
CREATE OR REPLACE VIEW public.catalogue_funnel_by_vehicle AS
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

-- Comentario en vista
COMMENT ON VIEW public.catalogue_funnel_by_vehicle IS 'Vista del embudo de conversión por vehículo individual';
