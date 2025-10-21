CREATE OR REPLACE FUNCTION "public"."search_vehicles"("search_term" "text") 
RETURNS SETOF "public"."inventario_cache"
LANGUAGE "plpgsql"
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM inventario_cache
  WHERE
    similarity(LOWER(search_term), LOWER(title)) > 0.3 OR
    similarity(LOWER(search_term), LOWER(marca)) > 0.3 OR
    similarity(LOWER(search_term), LOWER(modelo)) > 0.3;
END;
$$;
