-- Add Car Studio columns to inventario_cache table

-- Add galeria_exterior column to store the Car Studio processed gallery images as JSONB array
ALTER TABLE public.inventario_cache
ADD COLUMN IF NOT EXISTS galeria_exterior jsonb;

-- Add car_studio_feature_image column to store the Car Studio processed feature image URL
ALTER TABLE public.inventario_cache
ADD COLUMN IF NOT EXISTS car_studio_feature_image text;

-- Add use_car_studio_images flag to indicate if Car Studio images should be used
ALTER TABLE public.inventario_cache
ADD COLUMN IF NOT EXISTS use_car_studio_images boolean DEFAULT false;

-- Add comment to explain the purpose of these columns
COMMENT ON COLUMN public.inventario_cache.galeria_exterior IS 'JSONB array of Car Studio processed exterior gallery image URLs';
COMMENT ON COLUMN public.inventario_cache.car_studio_feature_image IS 'Car Studio processed feature image URL';
COMMENT ON COLUMN public.inventario_cache.use_car_studio_images IS 'Flag to indicate if Car Studio processed images should be displayed instead of original images';
