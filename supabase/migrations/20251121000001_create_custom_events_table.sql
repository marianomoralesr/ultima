-- Migration: Create Custom Events Table for Customer Journeys
-- Description: Allows admins to create custom tracking events for customer journeys
-- Date: 2025-11-21

-- Create custom_events table
CREATE TABLE IF NOT EXISTS public.custom_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- Event type name (e.g., 'ClickFinanciamientos', 'ViewPricing')
    label TEXT NOT NULL, -- Display label (e.g., 'Click Financiamientos Button')
    description TEXT NOT NULL, -- Human-readable description
    category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN ('standard', 'custom')),

    -- Visual customization
    icon_name TEXT, -- Lucide icon name
    color TEXT DEFAULT 'text-blue-600',
    bg_color TEXT DEFAULT 'bg-blue-100',

    -- Platform mappings
    facebook_event_mapping TEXT, -- Maps to Facebook Pixel event (e.g., 'ViewContent', 'Lead')
    gtm_event_mapping TEXT, -- Maps to GTM event name

    -- Status
    active BOOLEAN NOT NULL DEFAULT true,

    -- Audit fields
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_events_category ON public.custom_events(category);
CREATE INDEX IF NOT EXISTS idx_custom_events_active ON public.custom_events(active);
CREATE INDEX IF NOT EXISTS idx_custom_events_name ON public.custom_events(name);

-- Update journey_steps table to add enhanced trigger fields
DO $$
BEGIN
    -- Add trigger_selector_method if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='journey_steps' AND column_name='trigger_selector_method'
    ) THEN
        ALTER TABLE public.journey_steps
        ADD COLUMN trigger_selector_method TEXT;
    END IF;

    -- Add trigger_url_pattern if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='journey_steps' AND column_name='trigger_url_pattern'
    ) THEN
        ALTER TABLE public.journey_steps
        ADD COLUMN trigger_url_pattern TEXT;
    END IF;

    -- Add scroll_depth_percentage if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='journey_steps' AND column_name='scroll_depth_percentage'
    ) THEN
        ALTER TABLE public.journey_steps
        ADD COLUMN scroll_depth_percentage INTEGER CHECK (scroll_depth_percentage >= 0 AND scroll_depth_percentage <= 100);
    END IF;

    -- Add time_on_page_seconds if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='journey_steps' AND column_name='time_on_page_seconds'
    ) THEN
        ALTER TABLE public.journey_steps
        ADD COLUMN time_on_page_seconds INTEGER CHECK (time_on_page_seconds >= 0);
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE public.custom_events IS 'Custom tracking events that can be used in customer journeys';
COMMENT ON COLUMN public.custom_events.name IS 'Unique event type identifier used in code (e.g., ClickFinanciamientos)';
COMMENT ON COLUMN public.custom_events.label IS 'User-friendly display label shown in UI';
COMMENT ON COLUMN public.custom_events.category IS 'Event category: standard (built-in) or custom (user-created)';
COMMENT ON COLUMN public.custom_events.facebook_event_mapping IS 'Facebook Pixel standard event to fire (e.g., ViewContent, Lead)';
COMMENT ON COLUMN public.custom_events.gtm_event_mapping IS 'Google Tag Manager event name mapping';

COMMENT ON COLUMN public.journey_steps.trigger_selector_method IS 'Method for selecting elements: css, text, url, id, class';
COMMENT ON COLUMN public.journey_steps.trigger_url_pattern IS 'URL pattern to match (supports wildcards like /autos/*)';
COMMENT ON COLUMN public.journey_steps.scroll_depth_percentage IS 'Percentage of page scroll to trigger event (0-100)';
COMMENT ON COLUMN public.journey_steps.time_on_page_seconds IS 'Seconds on page before triggering event';

-- Enable RLS
ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_events
-- Anyone can read active custom events
CREATE POLICY "Anyone can read active custom events"
    ON public.custom_events
    FOR SELECT
    USING (active = true);

-- Only admins can manage custom events
CREATE POLICY "Admins can insert custom events"
    ON public.custom_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update custom events"
    ON public.custom_events
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete custom events"
    ON public.custom_events
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_custom_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_custom_events_updated_at ON public.custom_events;
CREATE TRIGGER set_custom_events_updated_at
    BEFORE UPDATE ON public.custom_events
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_events_updated_at();

-- Insert standard/default events from EVENT_TEMPLATES
INSERT INTO public.custom_events (name, label, description, category, icon_name, color, bg_color, facebook_event_mapping, active)
VALUES
    ('PageView', 'Vista de Página', 'Usuario visita una página', 'standard', 'Eye', 'text-blue-600', 'bg-blue-100', 'PageView', true),
    ('ViewContent', 'Ver Contenido', 'Usuario ve contenido específico (ej: vehículo)', 'standard', 'Target', 'text-purple-600', 'bg-purple-100', 'ViewContent', true),
    ('InitialRegistration', 'Registro Inicial', 'Usuario completa OTP o Google Sign-In', 'standard', 'UserCheck', 'text-green-600', 'bg-green-100', 'CompleteRegistration', true),
    ('ConversionLandingPage', 'Conversión Landing Page', 'Usuario se registra desde landing page', 'standard', 'Flag', 'text-orange-600', 'bg-orange-100', 'Lead', true),
    ('PersonalInformationComplete', 'Información Personal Completa', 'Usuario completa su perfil', 'standard', 'FileCheck', 'text-indigo-600', 'bg-indigo-100', 'CompleteRegistration', true),
    ('PerfilacionBancariaComplete', 'Perfilación Bancaria Completa', 'Usuario completa cuestionario bancario', 'standard', 'TrendingUp', 'text-cyan-600', 'bg-cyan-100', 'CompleteRegistration', true),
    ('ComienzaSolicitud', 'Comienza Solicitud', 'Usuario llega a página de aplicación', 'standard', 'MousePointerClick', 'text-yellow-600', 'bg-yellow-100', 'InitiateCheckout', true),
    ('ApplicationSubmission', 'Solicitud Enviada', 'Usuario envía solicitud (todas las fuentes)', 'standard', 'CheckCircle2', 'text-emerald-600', 'bg-emerald-100', 'SubmitApplication', true),
    ('LeadComplete', 'Lead Completo', 'Usuario envía solicitud (solo desde landing page)', 'standard', 'Flag', 'text-rose-600', 'bg-rose-100', 'Lead', true)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.custom_events TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.custom_events TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Custom events table created successfully with % standard events', (SELECT COUNT(*) FROM public.custom_events WHERE category = 'standard');
END $$;
