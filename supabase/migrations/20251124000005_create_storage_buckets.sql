-- Create storage bucket for inventory and homepage images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-images',
  'inventory-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for inventory-images bucket
CREATE POLICY "Public Access for inventory-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'inventory-images');

CREATE POLICY "Authenticated users can upload to inventory-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inventory-images');

CREATE POLICY "Authenticated users can update their inventory-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'inventory-images');

CREATE POLICY "Authenticated users can delete their inventory-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'inventory-images');
