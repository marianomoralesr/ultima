-- Create roadmap_items table for storing admin-managed roadmap features

CREATE TABLE IF NOT EXISTS public.roadmap_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL DEFAULT 'Nueva Funcionalidad',
    status text NOT NULL DEFAULT 'Planificado para Iniciar',
    priority text DEFAULT 'Media',
    progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    eta text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    is_published boolean DEFAULT false NOT NULL
);

-- Add RLS (Row Level Security)
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view published roadmap items
CREATE POLICY "Anyone can view published roadmap items"
    ON public.roadmap_items
    FOR SELECT
    USING (is_published = true);

-- Policy: Admin users can do anything
CREATE POLICY "Admin users can manage all roadmap items"
    ON public.roadmap_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS roadmap_items_status_idx ON public.roadmap_items(status);
CREATE INDEX IF NOT EXISTS roadmap_items_created_at_idx ON public.roadmap_items(created_at DESC);
CREATE INDEX IF NOT EXISTS roadmap_items_is_published_idx ON public.roadmap_items(is_published);

-- Add comment
COMMENT ON TABLE public.roadmap_items IS 'Stores roadmap features and planned implementations for the Trefa platform';
