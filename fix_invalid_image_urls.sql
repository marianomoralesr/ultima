-- Fix invalid image URLs in inventario_cache
-- This script cleans up records that have "[]", "{}", or other invalid strings as image URLs

-- First, let's see what needs to be fixed
SELECT
  id,
  ordencompra,
  title,
  feature_image,
  fotos_exterior_url,
  fotos_interior_url
FROM inventario_cache
WHERE
  feature_image = '[]'
  OR feature_image = '{}'
  OR feature_image = 'null'
  OR feature_image = 'undefined'
  OR fotos_exterior_url = '[]'
  OR fotos_exterior_url = '{}'
  OR fotos_interior_url = '[]'
  OR fotos_interior_url = '{}'
ORDER BY updated_at DESC;

-- Clean up feature_image with invalid values
UPDATE inventario_cache
SET
  feature_image = NULL,
  updated_at = NOW()
WHERE
  feature_image IN ('[]', '{}', 'null', 'undefined', '');

-- Clean up fotos_exterior_url with invalid values
UPDATE inventario_cache
SET
  fotos_exterior_url = '',
  updated_at = NOW()
WHERE
  fotos_exterior_url IN ('[]', '{}', 'null', 'undefined');

-- Clean up fotos_interior_url with invalid values
UPDATE inventario_cache
SET
  fotos_interior_url = '',
  updated_at = NOW()
WHERE
  fotos_interior_url IN ('[]', '{}', 'null', 'undefined');

-- Show summary of cleaned records
SELECT
  'Cleaned Records' as status,
  COUNT(*) as count
FROM inventario_cache
WHERE feature_image IS NULL OR feature_image = '';

-- Verify no invalid URLs remain
SELECT
  CASE
    WHEN feature_image = '[]' THEN 'feature_image has []'
    WHEN fotos_exterior_url = '[]' THEN 'fotos_exterior_url has []'
    WHEN fotos_interior_url = '[]' THEN 'fotos_interior_url has []'
    ELSE 'OK'
  END as status,
  COUNT(*) as count
FROM inventario_cache
GROUP BY status;
