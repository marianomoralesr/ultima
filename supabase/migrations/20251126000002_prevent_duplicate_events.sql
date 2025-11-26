-- Migración: Prevenir eventos de tracking duplicados
-- Fecha: 2025-11-26
-- Propósito: Agregar constraints y funciones para evitar que usuarios disparen el mismo evento múltiples veces

-- 1. Agregar columna para marcar eventos como procesados (evita recálculos)
ALTER TABLE public.tracking_events
ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- 2. Crear índice compuesto para detectar duplicados potenciales
-- Permite detectar rápidamente si un usuario ya disparó un evento específico
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_event_date
ON public.tracking_events(user_id, event_type, DATE(created_at))
WHERE user_id IS NOT NULL;

-- 3. Crear función para validar si un evento ya existe
CREATE OR REPLACE FUNCTION check_duplicate_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_time_window_minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
    v_cutoff_time TIMESTAMPTZ;
BEGIN
    -- Solo verificar si tenemos user_id
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Calcular ventana de tiempo (últimos N minutos)
    v_cutoff_time := NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;

    -- Verificar si existe un evento similar reciente
    SELECT EXISTS (
        SELECT 1
        FROM tracking_events
        WHERE user_id = p_user_id
          AND event_type = p_event_type
          AND created_at >= v_cutoff_time
        LIMIT 1
    ) INTO v_exists;

    RETURN v_exists;
END;
$$;

-- 4. Crear función trigger para prevenir duplicados en eventos críticos
CREATE OR REPLACE FUNCTION prevent_critical_event_duplicates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_duplicate BOOLEAN;
    v_critical_events TEXT[] := ARRAY[
        'LeadComplete',
        'ApplicationSubmission',
        'SolicitudEnviada',
        'ConversionLandingPage'
    ];
BEGIN
    -- Solo aplicar a eventos críticos
    IF NEW.event_type = ANY(v_critical_events) OR NEW.event_name = ANY(v_critical_events) THEN
        -- Verificar si es duplicado (ventana de 30 minutos)
        v_is_duplicate := check_duplicate_event(NEW.user_id, COALESCE(NEW.event_type, NEW.event_name), 30);

        IF v_is_duplicate THEN
            -- Registrar en logs pero no fallar la inserción
            RAISE NOTICE 'Evento duplicado detectado: user_id=%, event_type=%, ventana=30min',
                NEW.user_id, COALESCE(NEW.event_type, NEW.event_name);

            -- Marcar como duplicado en metadata
            NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) ||
                           jsonb_build_object('is_duplicate', true, 'duplicate_detected_at', NOW());
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 5. Crear trigger para ejecutar la validación
DROP TRIGGER IF EXISTS trg_prevent_duplicate_events ON public.tracking_events;
CREATE TRIGGER trg_prevent_duplicate_events
    BEFORE INSERT ON public.tracking_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_critical_event_duplicates();

-- 6. Nota: Vista materializada removida debido a problemas con funciones IMMUTABLE
-- Los dashboards pueden consultar tracking_events directamente con deduplicación en queries

-- 7. Crear tabla para controlar eventos de confirmación (page-level tracking)
CREATE TABLE IF NOT EXISTS public.confirmation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    dispatched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevenir duplicados: un usuario solo puede disparar el mismo evento para una aplicación una vez
    UNIQUE(user_id, application_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_confirmation_events_user ON public.confirmation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_confirmation_events_application ON public.confirmation_events(application_id);

-- RLS para confirmation_events
ALTER TABLE public.confirmation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios eventos de confirmación"
    ON public.confirmation_events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propios eventos de confirmación"
    ON public.confirmation_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 8. Función helper para registrar evento de confirmación
CREATE OR REPLACE FUNCTION register_confirmation_event(
    p_application_id TEXT,
    p_event_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_already_exists BOOLEAN;
BEGIN
    -- Obtener user_id actual
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verificar si ya existe
    SELECT EXISTS (
        SELECT 1
        FROM confirmation_events
        WHERE user_id = v_user_id
          AND application_id = p_application_id
          AND event_type = p_event_type
    ) INTO v_already_exists;

    -- Si ya existe, retornar FALSE (no disparar evento)
    IF v_already_exists THEN
        RETURN FALSE;
    END IF;

    -- Insertar nuevo registro
    INSERT INTO confirmation_events (user_id, application_id, event_type)
    VALUES (v_user_id, p_application_id, p_event_type)
    ON CONFLICT (user_id, application_id, event_type) DO NOTHING;

    -- Retornar TRUE (sí disparar evento)
    RETURN TRUE;
END;
$$;

-- 9. Comentarios para documentación
COMMENT ON FUNCTION check_duplicate_event IS 'Verifica si un evento ya fue disparado por un usuario en una ventana de tiempo';
COMMENT ON FUNCTION prevent_critical_event_duplicates IS 'Trigger function que marca eventos duplicados en metadata';
COMMENT ON TABLE confirmation_events IS 'Tabla para controlar eventos disparados en página de confirmación';
COMMENT ON FUNCTION register_confirmation_event IS 'Registra y valida si un evento de confirmación debe dispararse';
