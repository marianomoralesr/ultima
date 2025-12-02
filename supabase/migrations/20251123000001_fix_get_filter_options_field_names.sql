-- Migration: Fix get_filter_options to return field names matching FilterSidebar expectations
-- Issue: FilterSidebar expects Spanish field names (autoano, garantia, etc.) but function returns English names (years, warranties, etc.)
-- Date: 2025-11-23

CREATE OR REPLACE FUNCTION "public"."get_filter_options"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result jsonb;
BEGIN
    WITH vehicle_base AS (
        SELECT marca, autoano, clasificacionid, transmision, combustible, ubicacion, autogarantia, promociones, precio, enganche_minimo
        FROM inventario_cache
        WHERE ordenstatus = 'Comprado'
    ),
    marcas_agg AS (
        SELECT marca AS name, COUNT(*) AS count FROM vehicle_base WHERE marca IS NOT NULL AND marca != '' GROUP BY marca
    ),
    years_agg AS (
        SELECT autoano AS name, COUNT(*) AS count FROM vehicle_base WHERE autoano IS NOT NULL GROUP BY autoano
    ),
    classifications_agg AS (
        SELECT name, COUNT(*) AS count FROM (SELECT unnest(string_to_array(clasificacionid, ',')) AS name FROM vehicle_base) s WHERE name IS NOT NULL AND name != '' GROUP BY name
    ),
    transmissions_agg AS (
        SELECT transmision AS name, COUNT(*) AS count FROM vehicle_base WHERE transmision IS NOT NULL AND transmision != '' GROUP BY transmision
    ),
    combustibles_agg AS (
        SELECT combustible AS name, COUNT(*) AS count FROM vehicle_base WHERE combustible IS NOT NULL AND combustible != '' GROUP BY combustible
    ),
    sucursales_agg AS (
        SELECT
            CASE ubicacion_val
                WHEN 'MTY' THEN 'Monterrey'
                WHEN 'GPE' THEN 'Guadalupe'
                WHEN 'TMPS' THEN 'Reynosa'
                WHEN 'COAH' THEN 'Saltillo'
                ELSE ubicacion_val
            END AS name,
            COUNT(*) AS count
        FROM (
            SELECT unnest(string_to_array(ubicacion, ',')) AS ubicacion_val
            FROM vehicle_base
        ) s
        WHERE ubicacion_val IS NOT NULL AND ubicacion_val != ''
        GROUP BY name
    ),
    warranties_agg AS (
        SELECT autogarantia AS name, COUNT(*) AS count FROM vehicle_base WHERE autogarantia IS NOT NULL AND autogarantia != '' GROUP BY autogarantia
    ),
    promotions_agg AS (
        SELECT value AS name, COUNT(*) AS count
        FROM vehicle_base, jsonb_array_elements_text(promociones)
        WHERE value IS NOT NULL AND value != ''
        GROUP BY name
    ),
    price_range AS (
        SELECT min(precio) AS minprice, max(precio) AS maxprice, min(enganche_minimo) AS minenganche, max(enganche_minimo) AS maxenganche FROM vehicle_base
    )
    SELECT jsonb_build_object(
        'marcas', (SELECT jsonb_agg(t) FROM marcas_agg t),
        'autoano', (SELECT jsonb_agg(t) FROM years_agg t ORDER BY name DESC),
        'carroceria', (SELECT jsonb_agg(t) FROM classifications_agg t),
        'transmision', (SELECT jsonb_agg(t) FROM transmissions_agg t),
        'combustible', (SELECT jsonb_agg(t) FROM combustibles_agg t),
        'ubicacion', (SELECT jsonb_agg(t) FROM sucursales_agg t),
        'garantia', (SELECT jsonb_agg(t) FROM warranties_agg t),
        'promociones', (SELECT jsonb_agg(t) FROM promotions_agg t),
        'minPrice', (SELECT minprice FROM price_range),
        'maxPrice', (SELECT maxprice FROM price_range),
        'enganchemin', (SELECT minenganche FROM price_range),
        'maxEnganche', (SELECT maxenganche FROM price_range)
    ) INTO result;

    RETURN result;
END;
$$;
