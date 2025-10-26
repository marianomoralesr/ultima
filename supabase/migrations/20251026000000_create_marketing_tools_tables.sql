-- Create marketing_events table for tracking user interactions and campaign performance
CREATE TABLE IF NOT EXISTS public.marketing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'button_click', 'form_submit', 'lead_capture', 'custom')),
  event_name TEXT NOT NULL,
  page_url TEXT NOT NULL,
  referrer TEXT,

  -- UTM Parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- Facebook tracking
  fbclid TEXT,

  -- Other tracking parameters
  gclid TEXT, -- Google Ads
  msclkid TEXT, -- Microsoft Ads
  rfdm TEXT, -- Custom referral

  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  ip_address INET,

  -- Geographic data
  country TEXT,
  city TEXT,

  -- Additional metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_marketing_events_created_at ON public.marketing_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_events_event_type ON public.marketing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_marketing_events_session_id ON public.marketing_events(session_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_user_id ON public.marketing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_utm_source ON public.marketing_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_marketing_events_utm_campaign ON public.marketing_events(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_marketing_events_utm_medium ON public.marketing_events(utm_medium);

-- Create r2_images table for tracking uploaded vehicle images in Cloudflare R2
CREATE TABLE IF NOT EXISTS public.r2_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id INTEGER NOT NULL,
  vehicle_title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Optional metadata
  width INTEGER,
  height INTEGER,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for r2_images
CREATE INDEX IF NOT EXISTS idx_r2_images_vehicle_id ON public.r2_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_r2_images_uploaded_at ON public.r2_images(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_r2_images_uploaded_by ON public.r2_images(uploaded_by);

-- Enable Row Level Security
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.r2_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_events
-- Allow anyone to insert events (for tracking)
CREATE POLICY "Anyone can insert marketing events"
ON public.marketing_events
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can read marketing events
CREATE POLICY "Only admins can read marketing events"
ON public.marketing_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete marketing events
CREATE POLICY "Only admins can delete marketing events"
ON public.marketing_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS Policies for r2_images
-- Only authenticated users can insert images
CREATE POLICY "Authenticated users can insert r2 images"
ON public.r2_images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can read all images
CREATE POLICY "Admins can read all r2 images"
ON public.r2_images
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admin or uploader can delete images
CREATE POLICY "Admin or uploader can delete r2 images"
ON public.r2_images
FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Grant permissions
GRANT SELECT, INSERT ON public.marketing_events TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.r2_images TO authenticated;
GRANT SELECT ON public.marketing_events TO anon;
GRANT INSERT ON public.marketing_events TO anon;

-- Add comments for documentation
COMMENT ON TABLE public.marketing_events IS 'Stores marketing events for analytics and campaign tracking';
COMMENT ON TABLE public.r2_images IS 'Tracks vehicle images uploaded to Cloudflare R2 storage';

COMMENT ON COLUMN public.marketing_events.event_type IS 'Type of event: page_view, button_click, form_submit, lead_capture, or custom';
COMMENT ON COLUMN public.marketing_events.session_id IS 'Unique session identifier for tracking user sessions';
COMMENT ON COLUMN public.marketing_events.utm_source IS 'UTM source parameter (e.g., google, facebook)';
COMMENT ON COLUMN public.marketing_events.utm_campaign IS 'UTM campaign parameter';
COMMENT ON COLUMN public.marketing_events.fbclid IS 'Facebook Click ID for attribution';
COMMENT ON COLUMN public.marketing_events.gclid IS 'Google Click ID for Google Ads attribution';

COMMENT ON COLUMN public.r2_images.file_path IS 'Path in R2 bucket (e.g., vehicles/123/image.jpg)';
COMMENT ON COLUMN public.r2_images.file_url IS 'Public URL to access the image';
COMMENT ON COLUMN public.r2_images.vehicle_id IS 'Reference to the WordPress vehicle ID';
