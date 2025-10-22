-- ============================================================================
-- MANUAL FILTER FIX - Run this directly in Supabase SQL Editor
-- ============================================================================
-- This script fixes the transmision and combustible filter issues
--
-- Problem: App expects 'transmision' and 'combustible' columns but Supabase has
--          'autotransmision' and nested 'data.combustible'
--
-- Solution: Add normalized columns and keep them in sync automatically
-- ============================================================================

-- ============================================================================
-- STEP 1: Add the new columns
-- ============================================================================

ALTER TABLE inventario_cache
ADD COLUMN IF NOT EXISTS transmision TEXT,
ADD COLUMN IF NOT EXISTS combustible TEXT;

-- ============================================================================
-- STEP 2: Populate transmision from autotransmision
-- ============================================================================

UPDATE inventario_cache
SET transmision = autotransmision
WHERE autotransmision IS NOT NULL;

-- ============================================================================
-- STEP 3: Populate combustible from data->combustible
-- ============================================================================

UPDATE inventario_cache
SET combustible = data->>'combustible'
WHERE data->>'combustible' IS NOT NULL;

-- ============================================================================
-- STEP 4: Create indexes for better query performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_inventario_cache_transmision
ON inventario_cache(transmision);

CREATE INDEX IF NOT EXISTS idx_inventario_cache_combustible
ON inventario_cache(combustible);

-- ============================================================================
-- STEP 5: Create auto-sync function
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_transmision_combustible()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync transmision from autotransmision
  IF NEW.autotransmision IS NOT NULL THEN
    NEW.transmision := NEW.autotransmision;
  END IF;

  -- Sync combustible from data->combustible
  IF NEW.data->>'combustible' IS NOT NULL THEN
    NEW.combustible := NEW.data->>'combustible';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: Create triggers to keep columns in sync
-- ============================================================================

-- Trigger for INSERT operations
DROP TRIGGER IF EXISTS sync_transmision_combustible_on_insert ON inventario_cache;
CREATE TRIGGER sync_transmision_combustible_on_insert
  BEFORE INSERT ON inventario_cache
  FOR EACH ROW
  EXECUTE FUNCTION sync_transmision_combustible();

-- Trigger for UPDATE operations
DROP TRIGGER IF EXISTS sync_transmision_combustible_on_update ON inventario_cache;
CREATE TRIGGER sync_transmision_combustible_on_update
  BEFORE UPDATE ON inventario_cache
  FOR EACH ROW
  WHEN (
    OLD.autotransmision IS DISTINCT FROM NEW.autotransmision OR
    OLD.data IS DISTINCT FROM NEW.data
  )
  EXECUTE FUNCTION sync_transmision_combustible();

-- ============================================================================
-- STEP 7: Verify the changes
-- ============================================================================

-- Check how many records have the new columns populated
SELECT
  COUNT(*) as total_vehicles,
  COUNT(transmision) as with_transmision,
  COUNT(combustible) as with_combustible,
  COUNT(DISTINCT transmision) as unique_transmision_values,
  COUNT(DISTINCT combustible) as unique_combustible_values
FROM inventario_cache
WHERE ordenstatus = 'Comprado';

-- Show sample of the new data
SELECT
  id,
  ordencompra,
  marca,
  modelo,
  autotransmision,
  transmision,
  data->>'combustible' as data_combustible,
  combustible
FROM inventario_cache
WHERE ordenstatus = 'Comprado'
LIMIT 5;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Your filters should now work correctly. The app will be able to:
-- 1. Filter by transmision (reading from the new 'transmision' column)
-- 2. Filter by combustible (reading from the new 'combustible' column)
-- 3. See all 80 vehicles in the filters instead of just 20
-- ============================================================================
