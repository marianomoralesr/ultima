-- Migración: Crear tabla de métricas agregadas para tracking persistente
-- Fecha: 2025-11-26
-- Propósito: Almacenar métricas calculadas para evitar recalcular en cada carga de dashboard

-- 1. Crear tabla de métricas agregadas por día
CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,

    -- Métricas del embudo principal
    landing_page_views INTEGER DEFAULT 0,
    registrations INTEGER DEFAULT 0,
    profile_completes INTEGER DEFAULT 0,
    bank_profiling_completes INTEGER DEFAULT 0,
    application_starts INTEGER DEFAULT 0,
    application_submissions INTEGER DEFAULT 0,
    lead_completes INTEGER DEFAULT 0,

    -- Métricas de Meta (Facebook/Instagram)
    meta_landing_views INTEGER DEFAULT 0,
    meta_registrations INTEGER DEFAULT 0,
    meta_profile_completes INTEGER DEFAULT 0,
    meta_bank_profiling_completes INTEGER DEFAULT 0,
    meta_application_starts INTEGER DEFAULT 0,
    meta_lead_completes INTEGER DEFAULT 0,

    -- Métricas generales del sitio
    total_page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,

    -- User IDs únicos para cada etapa (almacenados como JSONB array)
    registered_user_ids JSONB DEFAULT '[]'::jsonb,
    profile_complete_user_ids JSONB DEFAULT '[]'::jsonb,
    bank_profile_user_ids JSONB DEFAULT '[]'::jsonb,
    application_start_user_ids JSONB DEFAULT '[]'::jsonb,
    lead_complete_user_ids JSONB DEFAULT '[]'::jsonb,
    meta_user_ids JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_last_calculated ON public.daily_metrics(last_calculated_at);

-- 2. Crear tabla de métricas agregadas por semana
CREATE TABLE IF NOT EXISTS public.weekly_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,

    -- Métricas acumuladas de la semana
    landing_page_views INTEGER DEFAULT 0,
    registrations INTEGER DEFAULT 0,
    profile_completes INTEGER DEFAULT 0,
    bank_profiling_completes INTEGER DEFAULT 0,
    application_starts INTEGER DEFAULT 0,
    application_submissions INTEGER DEFAULT 0,
    lead_completes INTEGER DEFAULT 0,

    meta_landing_views INTEGER DEFAULT 0,
    meta_registrations INTEGER DEFAULT 0,
    meta_profile_completes INTEGER DEFAULT 0,
    meta_bank_profiling_completes INTEGER DEFAULT 0,
    meta_application_starts INTEGER DEFAULT 0,
    meta_lead_completes INTEGER DEFAULT 0,

    total_page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,

    -- Metadata
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(week_start, week_end)
);

CREATE INDEX IF NOT EXISTS idx_weekly_metrics_dates ON public.weekly_metrics(week_start DESC, week_end DESC);

-- 3. Crear función para calcular y almacenar métricas diarias
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_landing_views INTEGER;
    v_registrations INTEGER;
    v_profile_completes INTEGER;
    v_bank_profiling INTEGER;
    v_app_starts INTEGER;
    v_app_submissions INTEGER;
    v_lead_completes INTEGER;
    v_meta_landing INTEGER;
    v_meta_registrations INTEGER;
    v_meta_profiles INTEGER;
    v_meta_bank INTEGER;
    v_meta_apps INTEGER;
    v_meta_leads INTEGER;
    v_total_pageviews INTEGER;
    v_unique_visitors INTEGER;
    v_registered_ids JSONB;
    v_profile_ids JSONB;
    v_bank_ids JSONB;
    v_app_ids JSONB;
    v_lead_ids JSONB;
    v_meta_ids JSONB;
BEGIN
    -- Calcular landing page views
    SELECT COUNT(*) INTO v_landing_views
    FROM tracking_events
    WHERE DATE(created_at) = target_date
      AND event_type = 'PageView'
      AND metadata->>'page' = '/financiamientos';

    -- Calcular registros únicos (ConversionLandingPage)
    SELECT
        COUNT(DISTINCT user_id),
        jsonb_agg(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)
    INTO v_registrations, v_registered_ids
    FROM tracking_events
    WHERE DATE(created_at) = target_date
      AND (event_type = 'ConversionLandingPage' OR event_name = 'ConversionLandingPage')
      AND user_id IS NOT NULL;

    -- Calcular perfiles completos
    SELECT
        COUNT(DISTINCT user_id),
        jsonb_agg(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)
    INTO v_profile_completes, v_profile_ids
    FROM tracking_events
    WHERE DATE(created_at) = target_date
      AND (event_type = 'PersonalInformationComplete' OR event_name = 'PersonalInformationComplete')
      AND user_id IS NOT NULL;

    -- Calcular perfilación bancaria
    SELECT
        COUNT(DISTINCT user_id),
        jsonb_agg(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)
    INTO v_bank_profiling, v_bank_ids
    FROM tracking_events
    WHERE DATE(created_at) = target_date
      AND (event_type = 'PerfilacionBancariaComplete' OR event_name = 'PerfilacionBancariaComplete')
      AND user_id IS NOT NULL;

    -- Calcular aplicaciones iniciadas
    SELECT
        COUNT(DISTINCT user_id),
        jsonb_agg(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)
    INTO v_app_starts, v_app_ids
    FROM tracking_events
    WHERE DATE(created_at) = target_date
      AND (event_type = 'ComienzaSolicitud' OR event_name = 'ComienzaSolicitud')
      AND user_id IS NOT NULL;

    -- Calcular aplicaciones enviadas
    SELECT COUNT(*) INTO v_app_submissions
    FROM tracking_events
    WHERE DATE(created_at) = target_date
      AND (event_type = 'ApplicationSubmission' OR event_name = 'ApplicationSubmission');

    -- Calcular leads completos
    SELECT
        COUNT(DISTINCT user_id),
        jsonb_agg(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)
    INTO v_lead_completes, v_lead_ids
    FROM tracking_events
    WHERE DATE(created_at) = target_date
      AND (event_type = 'LeadComplete' OR event_name = 'LeadComplete')
      AND user_id IS NOT NULL;

    -- Métricas de Meta
    SELECT COUNT(*) INTO v_meta_landing
    FROM tracking_events
    WHERE DATE(created_at) = target_date
      AND event_type = 'PageView'
      AND metadata->>'page' = '/financiamientos'
      AND (
          metadata->>'fbclid' IS NOT NULL
          OR utm_source ILIKE '%facebook%'
          OR utm_source ILIKE '%instagram%'
          OR utm_source ILIKE '%meta%'
      );

    SELECT
        COUNT(DISTINCT user_id),
        jsonb_agg(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)
    INTO v_meta_registrations, v_meta_ids
    FROM tracking_events
    WHERE DATE(created_at) = target_date
      AND (event_type = 'ConversionLandingPage' OR event_name = 'ConversionLandingPage')
      AND user_id IS NOT NULL
      AND (
          metadata->>'fbclid' IS NOT NULL
          OR utm_source ILIKE '%facebook%'
          OR utm_source ILIKE '%instagram%'
          OR utm_source ILIKE '%meta%'
      );

    -- Total pageviews y visitantes únicos
    SELECT COUNT(*), COUNT(DISTINCT session_id)
    INTO v_total_pageviews, v_unique_visitors
    FROM tracking_events
    WHERE DATE(created_at) = target_date
      AND event_type = 'PageView';

    -- Insertar o actualizar métricas
    INSERT INTO daily_metrics (
        date,
        landing_page_views,
        registrations,
        profile_completes,
        bank_profiling_completes,
        application_starts,
        application_submissions,
        lead_completes,
        meta_landing_views,
        meta_registrations,
        total_page_views,
        unique_visitors,
        registered_user_ids,
        profile_complete_user_ids,
        bank_profile_user_ids,
        application_start_user_ids,
        lead_complete_user_ids,
        meta_user_ids,
        last_calculated_at
    ) VALUES (
        target_date,
        v_landing_views,
        v_registrations,
        v_profile_completes,
        v_bank_profiling,
        v_app_starts,
        v_app_submissions,
        v_lead_completes,
        v_meta_landing,
        v_meta_registrations,
        v_total_pageviews,
        v_unique_visitors,
        COALESCE(v_registered_ids, '[]'::jsonb),
        COALESCE(v_profile_ids, '[]'::jsonb),
        COALESCE(v_bank_ids, '[]'::jsonb),
        COALESCE(v_app_ids, '[]'::jsonb),
        COALESCE(v_lead_ids, '[]'::jsonb),
        COALESCE(v_meta_ids, '[]'::jsonb),
        NOW()
    )
    ON CONFLICT (date)
    DO UPDATE SET
        landing_page_views = EXCLUDED.landing_page_views,
        registrations = EXCLUDED.registrations,
        profile_completes = EXCLUDED.profile_completes,
        bank_profiling_completes = EXCLUDED.bank_profiling_completes,
        application_starts = EXCLUDED.application_starts,
        application_submissions = EXCLUDED.application_submissions,
        lead_completes = EXCLUDED.lead_completes,
        meta_landing_views = EXCLUDED.meta_landing_views,
        meta_registrations = EXCLUDED.meta_registrations,
        total_page_views = EXCLUDED.total_page_views,
        unique_visitors = EXCLUDED.unique_visitors,
        registered_user_ids = EXCLUDED.registered_user_ids,
        profile_complete_user_ids = EXCLUDED.profile_complete_user_ids,
        bank_profile_user_ids = EXCLUDED.bank_profile_user_ids,
        application_start_user_ids = EXCLUDED.application_start_user_ids,
        lead_complete_user_ids = EXCLUDED.lead_complete_user_ids,
        meta_user_ids = EXCLUDED.meta_user_ids,
        last_calculated_at = NOW(),
        updated_at = NOW();
END;
$$;

-- 4. Crear función para calcular métricas semanales
CREATE OR REPLACE FUNCTION calculate_weekly_metrics(start_date DATE, end_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_landing_views INTEGER;
    v_registrations INTEGER;
    v_profile_completes INTEGER;
    v_bank_profiling INTEGER;
    v_app_starts INTEGER;
    v_app_submissions INTEGER;
    v_lead_completes INTEGER;
    v_total_pageviews INTEGER;
    v_unique_visitors INTEGER;
BEGIN
    -- Sumar métricas de los días en el rango
    SELECT
        SUM(landing_page_views),
        SUM(registrations),
        SUM(profile_completes),
        SUM(bank_profiling_completes),
        SUM(application_starts),
        SUM(application_submissions),
        SUM(lead_completes),
        SUM(total_page_views),
        SUM(unique_visitors)
    INTO
        v_landing_views,
        v_registrations,
        v_profile_completes,
        v_bank_profiling,
        v_app_starts,
        v_app_submissions,
        v_lead_completes,
        v_total_pageviews,
        v_unique_visitors
    FROM daily_metrics
    WHERE date >= start_date AND date <= end_date;

    -- Insertar o actualizar
    INSERT INTO weekly_metrics (
        week_start,
        week_end,
        landing_page_views,
        registrations,
        profile_completes,
        bank_profiling_completes,
        application_starts,
        application_submissions,
        lead_completes,
        total_page_views,
        unique_visitors,
        last_calculated_at
    ) VALUES (
        start_date,
        end_date,
        COALESCE(v_landing_views, 0),
        COALESCE(v_registrations, 0),
        COALESCE(v_profile_completes, 0),
        COALESCE(v_bank_profiling, 0),
        COALESCE(v_app_starts, 0),
        COALESCE(v_app_submissions, 0),
        COALESCE(v_lead_completes, 0),
        COALESCE(v_total_pageviews, 0),
        COALESCE(v_unique_visitors, 0),
        NOW()
    )
    ON CONFLICT (week_start, week_end)
    DO UPDATE SET
        landing_page_views = EXCLUDED.landing_page_views,
        registrations = EXCLUDED.registrations,
        profile_completes = EXCLUDED.profile_completes,
        bank_profiling_completes = EXCLUDED.bank_profiling_completes,
        application_starts = EXCLUDED.application_starts,
        application_submissions = EXCLUDED.application_submissions,
        lead_completes = EXCLUDED.lead_completes,
        total_page_views = EXCLUDED.total_page_views,
        unique_visitors = EXCLUDED.unique_visitors,
        last_calculated_at = NOW(),
        updated_at = NOW();
END;
$$;

-- 5. Calcular métricas para los últimos 30 días
DO $$
DECLARE
    current_date DATE := CURRENT_DATE;
    i INTEGER;
BEGIN
    -- Calcular métricas diarias de los últimos 30 días
    FOR i IN 0..30 LOOP
        PERFORM calculate_daily_metrics(current_date - i);
    END LOOP;

    -- Calcular métricas de la última semana
    PERFORM calculate_weekly_metrics(current_date - 7, current_date);

    -- Calcular métricas de hace 2 semanas
    PERFORM calculate_weekly_metrics(current_date - 14, current_date - 7);
END;
$$;

-- 6. Habilitar RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_metrics ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de RLS (solo admins pueden ver)
CREATE POLICY "Admins pueden ver métricas diarias"
    ON public.daily_metrics
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins pueden ver métricas semanales"
    ON public.weekly_metrics
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- 8. Comentarios para documentación
COMMENT ON TABLE public.daily_metrics IS 'Métricas agregadas por día para dashboards de marketing';
COMMENT ON TABLE public.weekly_metrics IS 'Métricas agregadas por semana para análisis de tendencias';
COMMENT ON FUNCTION calculate_daily_metrics IS 'Calcula y almacena métricas para una fecha específica';
COMMENT ON FUNCTION calculate_weekly_metrics IS 'Calcula y almacena métricas para un rango de fechas';
