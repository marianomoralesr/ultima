-- Fix get_filter_options function to use correct column names and return keys
-- This fixes the issue where filters were only showing 21 vehicles

CREATE OR REPLACE FUNCTION "public"."get_filter_options"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result jsonb;
BEGIN
    WITH vehicle_base AS (
        SELECT
            marca,
            autoano,
            carroceria,  -- was clasificacionid
            transmision,
            combustible,
            ubicacion,   -- was sucursal
            garantia,    -- was autogarantia
            promociones,
            precio,
            enganchemin  -- was enganche_minimo
        FROM inventario_cache
        WHERE ordenstatus = 'Comprado'
    ),
    marcas_agg AS (
        SELECT marca AS name, COUNT(*) AS count
        FROM vehicle_base
        WHERE marca IS NOT NULL AND marca != ''
        GROUP BY marca
    ),
    years_agg AS (
        SELECT autoano AS name, COUNT(*) AS count
        FROM vehicle_base
        WHERE autoano IS NOT NULL
        GROUP BY autoano
    ),
    carrocerias_agg AS (
        SELECT carroceria AS name, COUNT(*) AS count
        FROM vehicle_base
        WHERE carroceria IS NOT NULL AND carroceria != ''
        GROUP BY carroceria
    ),
    transmissions_agg AS (
        SELECT transmision AS name, COUNT(*) AS count
        FROM vehicle_base
        WHERE transmision IS NOT NULL AND transmision != ''
        GROUP BY transmision
    ),
    combustibles_agg AS (
        SELECT combustible AS name, COUNT(*) AS count
        FROM vehicle_base
        WHERE combustible IS NOT NULL AND combustible != ''
        GROUP BY combustible
    ),
    ubicaciones_agg AS (
        SELECT ubicacion AS name, COUNT(*) AS count
        FROM vehicle_base
        WHERE ubicacion IS NOT NULL AND ubicacion != ''
        GROUP BY ubicacion
    ),
    garantias_agg AS (
        SELECT garantia AS name, COUNT(*) AS count
        FROM vehicle_base
        WHERE garantia IS NOT NULL AND garantia != ''
        GROUP BY garantia
    ),
    promotions_agg AS (
        SELECT value AS name, COUNT(*) AS count
        FROM vehicle_base, jsonb_array_elements_text(promociones) AS value
        WHERE value IS NOT NULL AND value != ''
        GROUP BY value
    ),
    price_range AS (
        SELECT
            min(precio) AS minprice,
            max(precio) AS maxprice,
            min(enganchemin) AS minenganche,
            max(enganchemin) AS maxenganche
        FROM vehicle_base
    )
    SELECT jsonb_build_object(
        'marcas', (SELECT jsonb_agg(t ORDER BY t.name) FROM marcas_agg t),
        'autoano', (SELECT jsonb_agg(t ORDER BY t.name DESC) FROM years_agg t),
        'carroceria', (SELECT jsonb_agg(t ORDER BY t.name) FROM carrocerias_agg t),
        'transmision', (SELECT jsonb_agg(t ORDER BY t.name) FROM transmissions_agg t),
        'combustible', (SELECT jsonb_agg(t ORDER BY t.name) FROM combustibles_agg t),
        'ubicacion', (SELECT jsonb_agg(t ORDER BY t.name) FROM ubicaciones_agg t),
        'garantia', (SELECT jsonb_agg(t ORDER BY t.name) FROM garantias_agg t),
        'promociones', (SELECT jsonb_agg(t ORDER BY t.name) FROM promotions_agg t),
        'minPrice', (SELECT minprice FROM price_range),
        'maxPrice', (SELECT maxprice FROM price_range),
        'enganchemin', (SELECT minenganche FROM price_range),
        'maxEnganche', (SELECT maxenganche FROM price_range)
    ) INTO result;

    RETURN result;
END;
$$;
