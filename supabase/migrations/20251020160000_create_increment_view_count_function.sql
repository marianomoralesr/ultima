-- This migration creates a function to safely increment the view count for a vehicle.
-- It runs with the privileges of the definer, allowing it to update the table
-- without granting broad update permissions to users.

CREATE OR REPLACE FUNCTION increment_vehicle_view_count(vehicle_id_param uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.inventario_cache
  SET viewcount = viewcount + 1
  WHERE record_id = vehicle_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_vehicle_view_count(uuid) IS 'Safely increments the view count for a specific vehicle.';
