CREATE OR REPLACE FUNCTION public.increment_vehicle_views(vehicle_ordencompra TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.inventario_cache
  SET
    view_count = COALESCE(view_count, 0) + 1
  WHERE ordencompra = vehicle_ordencompra;
END;
$$ LANGUAGE plpgsql;
