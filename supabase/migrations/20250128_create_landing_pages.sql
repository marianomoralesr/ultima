-- Create landing pages tables for the landing page constructor

-- Table for storing reusable components (heroes, sections, features, carousels, comparisons)
CREATE TABLE IF NOT EXISTS public.landing_page_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  component_type TEXT NOT NULL CHECK (component_type IN ('hero', 'section', 'features', 'carousel', 'comparison')),
  layout TEXT NOT NULL, -- e.g., 'centered', 'split', 'cards', etc.
  data JSONB NOT NULL, -- stores all component properties (headline, paragraph, images, colors, etc.)
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT valid_component_data CHECK (jsonb_typeof(data) = 'object')
);

-- Table for storing published landing pages
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  meta_title TEXT,
  meta_description TEXT,
  component_ids UUID[] NOT NULL DEFAULT '{}', -- ordered array of component IDs
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_landing_page_components_type ON public.landing_page_components(component_type);
CREATE INDEX IF NOT EXISTS idx_landing_page_components_created_by ON public.landing_page_components(created_by);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON public.landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_created_by ON public.landing_pages(created_by);

-- Enable RLS
ALTER TABLE public.landing_page_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for landing_page_components
-- Admin users can do everything
CREATE POLICY "Admins can do everything with components"
  ON public.landing_page_components
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- All authenticated users can view components (for preview purposes)
CREATE POLICY "Authenticated users can view components"
  ON public.landing_page_components
  FOR SELECT
  TO authenticated
  USING (true);

-- Public users can view published components (for rendering landing pages)
CREATE POLICY "Public can view components"
  ON public.landing_page_components
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for landing_pages
-- Admin users can do everything with landing pages
CREATE POLICY "Admins can do everything with landing pages"
  ON public.landing_pages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- All authenticated users can view landing pages
CREATE POLICY "Authenticated users can view landing pages"
  ON public.landing_pages
  FOR SELECT
  TO authenticated
  USING (true);

-- Public users can view published landing pages
CREATE POLICY "Public can view published landing pages"
  ON public.landing_pages
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_landing_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_landing_page_components_updated_at
  BEFORE UPDATE ON public.landing_page_components
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_page_updated_at();

CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_page_updated_at();

-- Function to increment landing page views
CREATE OR REPLACE FUNCTION increment_landing_page_views(page_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.landing_pages
  SET views = views + 1
  WHERE slug = page_slug AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_landing_page_views(TEXT) TO anon, authenticated;

-- Function to get a landing page with all its components
CREATE OR REPLACE FUNCTION get_landing_page_with_components(page_slug TEXT)
RETURNS TABLE (
  page_id UUID,
  page_title TEXT,
  page_slug TEXT,
  page_status TEXT,
  page_meta_title TEXT,
  page_meta_description TEXT,
  page_views INTEGER,
  components JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.id,
    lp.title,
    lp.slug,
    lp.status,
    lp.meta_title,
    lp.meta_description,
    lp.views,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', lpc.id,
          'component_type', lpc.component_type,
          'layout', lpc.layout,
          'data', lpc.data
        ) ORDER BY array_position(lp.component_ids, lpc.id)
      ) FILTER (WHERE lpc.id IS NOT NULL),
      '[]'::jsonb
    ) as components
  FROM public.landing_pages lp
  LEFT JOIN public.landing_page_components lpc ON lpc.id = ANY(lp.component_ids)
  WHERE lp.slug = page_slug
  GROUP BY lp.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_landing_page_with_components(TEXT) TO anon, authenticated;

COMMENT ON TABLE public.landing_page_components IS 'Stores reusable landing page components (heroes, sections, features, carousels, comparisons)';
COMMENT ON TABLE public.landing_pages IS 'Stores published landing pages with references to components';
COMMENT ON FUNCTION increment_landing_page_views(TEXT) IS 'Increments view count for a published landing page';
COMMENT ON FUNCTION get_landing_page_with_components(TEXT) IS 'Retrieves a landing page with all its components in order';
