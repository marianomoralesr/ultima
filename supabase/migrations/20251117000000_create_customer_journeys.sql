-- Create customer_journeys table
CREATE TABLE IF NOT EXISTS public.customer_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    route TEXT NOT NULL,
    description TEXT,
    landing_page TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'paused')),

    -- Tracking configuration
    auto_tracking_enabled BOOLEAN DEFAULT true,
    gtm_enabled BOOLEAN DEFAULT true,
    facebook_pixel_enabled BOOLEAN DEFAULT true,

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create journey_steps table
CREATE TABLE IF NOT EXISTS public.journey_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL REFERENCES public.customer_journeys(id) ON DELETE CASCADE,

    -- Step configuration
    step_order INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    step_description TEXT,

    -- Location/Page configuration
    page_route TEXT NOT NULL,
    page_title TEXT,

    -- Event configuration
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_description TEXT,

    -- Trigger configuration (optional - for advanced setups)
    trigger_type TEXT CHECK (trigger_type IN ('pageview', 'button_click', 'form_submit', 'custom')),
    trigger_selector TEXT, -- CSS selector for button clicks, etc.
    trigger_conditions JSONB, -- Additional conditions for triggering

    -- Event metadata
    event_metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique ordering within journey
    UNIQUE(journey_id, step_order)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_journeys_status ON public.customer_journeys(status);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_route ON public.customer_journeys(route);
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey_id ON public.journey_steps(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_steps_order ON public.journey_steps(journey_id, step_order);
CREATE INDEX IF NOT EXISTS idx_journey_steps_event_type ON public.journey_steps(event_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_customer_journeys_updated_at
    BEFORE UPDATE ON public.customer_journeys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journey_steps_updated_at
    BEFORE UPDATE ON public.journey_steps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.customer_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_journeys
-- Admins can do everything
CREATE POLICY "Admins have full access to customer_journeys"
    ON public.customer_journeys
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Everyone can view active journeys (for tracking purposes)
CREATE POLICY "Users can view active customer journeys"
    ON public.customer_journeys
    FOR SELECT
    USING (status = 'active');

-- RLS Policies for journey_steps
-- Admins can do everything
CREATE POLICY "Admins have full access to journey_steps"
    ON public.journey_steps
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Everyone can view steps for active journeys (for tracking purposes)
CREATE POLICY "Users can view steps of active journeys"
    ON public.journey_steps
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.customer_journeys
            WHERE customer_journeys.id = journey_steps.journey_id
            AND customer_journeys.status = 'active'
        )
    );

-- Create helper function to get journey with steps
CREATE OR REPLACE FUNCTION public.get_customer_journey_with_steps(journey_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'journey', row_to_json(j.*),
        'steps', COALESCE(
            (
                SELECT json_agg(s.* ORDER BY s.step_order)
                FROM public.journey_steps s
                WHERE s.journey_id = j.id
            ),
            '[]'::json
        )
    ) INTO result
    FROM public.customer_journeys j
    WHERE j.id = journey_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get all active journeys
CREATE OR REPLACE FUNCTION public.get_active_customer_journeys()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'journey', row_to_json(j.*),
            'steps', COALESCE(
                (
                    SELECT json_agg(s.* ORDER BY s.step_order)
                    FROM public.journey_steps s
                    WHERE s.journey_id = j.id
                ),
                '[]'::json
            )
        )
    ) INTO result
    FROM public.customer_journeys j
    WHERE j.status = 'active'
    ORDER BY j.created_at DESC;

    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default Financiamientos journey
INSERT INTO public.customer_journeys (
    name,
    route,
    landing_page,
    description,
    status,
    auto_tracking_enabled,
    gtm_enabled,
    facebook_pixel_enabled
) VALUES (
    'Financiamientos',
    '/financiamientos',
    '/financiamientos',
    'Customer journey from landing page to loan application submission',
    'active',
    true,
    true,
    true
) ON CONFLICT DO NOTHING
RETURNING id;

-- Insert default steps for Financiamientos journey
-- Note: We need to get the journey_id from the insert above
DO $$
DECLARE
    journey_id UUID;
BEGIN
    SELECT id INTO journey_id FROM public.customer_journeys WHERE name = 'Financiamientos' LIMIT 1;

    IF journey_id IS NOT NULL THEN
        INSERT INTO public.journey_steps (
            journey_id,
            step_order,
            step_name,
            step_description,
            page_route,
            page_title,
            event_type,
            event_name,
            event_description,
            trigger_type
        ) VALUES
        (
            journey_id,
            1,
            'Visitas Landing Page',
            'Usuario llegó a la página de financiamientos',
            '/financiamientos',
            'Financiamientos Landing Page',
            'PageView',
            'PageView',
            'PageView a /financiamientos',
            'pageview'
        ),
        (
            journey_id,
            2,
            'Registro Completado',
            'Usuario se registró en la plataforma',
            '/financiamientos',
            'Financiamientos Landing Page',
            'ConversionLandingPage',
            'Conversion Landing Page',
            'Usuario completó registro y verificó email',
            'form_submit'
        ),
        (
            journey_id,
            3,
            'Información Personal',
            'Usuario guardó su perfil personal',
            '/escritorio/profile',
            'User Profile',
            'PersonalInformationComplete',
            'Personal Information Complete',
            'Usuario guardó información personal',
            'form_submit'
        ),
        (
            journey_id,
            4,
            'Aplicación Iniciada',
            'Usuario llegó a la página de aplicación',
            '/escritorio/aplicacion',
            'Loan Application',
            'ComienzaSolicitud',
            'Comienza Solicitud',
            'Usuario inició solicitud de financiamiento',
            'pageview'
        ),
        (
            journey_id,
            5,
            'Solicitud Enviada',
            'Usuario envió solicitud de financiamiento',
            '/escritorio/aplicacion',
            'Loan Application',
            'LeadComplete',
            'Lead Complete',
            'Usuario completó y envió solicitud',
            'form_submit'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT ON public.customer_journeys TO anon, authenticated;
GRANT SELECT ON public.journey_steps TO anon, authenticated;
GRANT ALL ON public.customer_journeys TO service_role;
GRANT ALL ON public.journey_steps TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_customer_journey_with_steps(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_customer_journeys() TO authenticated, anon;

COMMENT ON TABLE public.customer_journeys IS 'Stores customer journey configurations for tracking and analytics';
COMMENT ON TABLE public.journey_steps IS 'Stores individual steps/events within a customer journey funnel';
COMMENT ON FUNCTION public.get_customer_journey_with_steps(UUID) IS 'Returns a complete journey with all its steps';
COMMENT ON FUNCTION public.get_active_customer_journeys() IS 'Returns all active customer journeys with their steps';
