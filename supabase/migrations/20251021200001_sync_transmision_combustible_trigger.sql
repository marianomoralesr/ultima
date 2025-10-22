-- Migration: Auto-sync transmision and combustible columns
-- Description: Creates trigger to automatically populate transmision and combustible columns

-- Create function to sync the columns
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

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS sync_transmision_combustible_on_insert ON inventario_cache;
CREATE TRIGGER sync_transmision_combustible_on_insert
  BEFORE INSERT ON inventario_cache
  FOR EACH ROW
  EXECUTE FUNCTION sync_transmision_combustible();

-- Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS sync_transmision_combustible_on_update ON inventario_cache;
CREATE TRIGGER sync_transmision_combustible_on_update
  BEFORE UPDATE ON inventario_cache
  FOR EACH ROW
  WHEN (
    OLD.autotransmision IS DISTINCT FROM NEW.autotransmision OR
    OLD.data IS DISTINCT FROM NEW.data
  )
  EXECUTE FUNCTION sync_transmision_combustible();

-- Add comment to document the function
COMMENT ON FUNCTION sync_transmision_combustible() IS 'Automatically syncs transmision and combustible columns from their source fields';
