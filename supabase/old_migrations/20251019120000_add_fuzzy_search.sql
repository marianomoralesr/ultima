-- 1. Create the search function
CREATE OR REPLACE FUNCTION search_vehicles(search_term TEXT)
RETURNS SETOF inventario_cache AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM inventario_cache
  WHERE
    similarity(search_term, title) > 0.3 OR
    similarity(search_term, marca) > 0.3 OR
    similarity(search_term, modelo) > 0.3;
END;
$$ LANGUAGE plpgsql;
