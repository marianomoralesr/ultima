-- Migration: Add transmision and combustible columns to inventario_cache
-- Description: Normalizes transmission and fuel type data for easier filtering

-- Step 1: Add the new columns
ALTER TABLE inventario_cache
ADD COLUMN IF NOT EXISTS transmision TEXT,
ADD COLUMN IF NOT EXISTS combustible TEXT;

-- Step 2: Populate transmision from autotransmision
UPDATE inventario_cache
SET transmision = autotransmision
WHERE autotransmision IS NOT NULL;

-- Step 3: Populate combustible from data->combustible
UPDATE inventario_cache
SET combustible = data->>'combustible'
WHERE data->>'combustible' IS NOT NULL;

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventario_cache_transmision
ON inventario_cache(transmision);

CREATE INDEX IF NOT EXISTS idx_inventario_cache_combustible
ON inventario_cache(combustible);

-- Step 5: Add comment to document the columns
COMMENT ON COLUMN inventario_cache.transmision IS 'Transmission type - normalized from autotransmision for filtering';
COMMENT ON COLUMN inventario_cache.combustible IS 'Fuel type - normalized from data.combustible for filtering';
