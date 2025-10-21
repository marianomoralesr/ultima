CREATE OR REPLACE FUNCTION public.increment_vehicle_views(vehicle_ordencompra TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.inventario_cache
  SET
    viewcount = COALESCE(viewcount, 0) + 1
  WHERE ordencompra = vehicle_ordencompra;
END;
$$ LANGUAGE plpgsql;
