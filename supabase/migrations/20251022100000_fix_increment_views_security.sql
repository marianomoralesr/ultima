-- Fix increment_vehicle_views function to use SECURITY DEFINER
-- This allows anon users to increment view counts without having direct UPDATE permissions

CREATE OR REPLACE FUNCTION "public"."increment_vehicle_views"("vehicle_ordencompra" "text")
RETURNS "void"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.inventario_cache
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE ordencompra = vehicle_ordencompra;
END;
$$;

-- Ensure proper grants are in place
GRANT EXECUTE ON FUNCTION "public"."increment_vehicle_views"("vehicle_ordencompra" "text") TO "anon";
GRANT EXECUTE ON FUNCTION "public"."increment_vehicle_views"("vehicle_ordencompra" "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."increment_vehicle_views"("vehicle_ordencompra" "text") TO "service_role";
