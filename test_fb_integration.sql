-- =====================================================
-- TEST 1: Verificar que la tabla existe
-- =====================================================
SELECT 'TEST 1: Verificar tabla existe' as test;

SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'facebook_catalogue_events'
) as tabla_existe;

-- =====================================================
-- TEST 2: Verificar funciones RPC
-- =====================================================
SELECT 'TEST 2: Verificar funciones RPC' as test;

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_catalogue_metrics',
    'get_top_performing_vehicles'
  )
ORDER BY routine_name;

-- =====================================================
-- TEST 3: Verificar vista
-- =====================================================
SELECT 'TEST 3: Verificar vista' as test;

SELECT table_name, table_type
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'catalogue_funnel_by_vehicle';

-- =====================================================
-- TEST 4: Insertar evento de prueba
-- =====================================================
SELECT 'TEST 4: Insertar evento de prueba' as test;

INSERT INTO public.facebook_catalogue_events (
  event_type,
  vehicle_id,
  vehicle_data,
  session_id,
  fbclid,
  metadata
) VALUES (
  'ViewContent',
  'test_rec123',
  jsonb_build_object(
    'id', 'test_rec123',
    'title', 'Toyota Camry 2020 Test',
    'price', 250000,
    'brand', 'Toyota',
    'model', 'Camry',
    'year', 2020,
    'category', 'Sedán',
    'slug', 'toyota-camry-2020-test'
  ),
  'test_session_' || gen_random_uuid()::text,
  'fb.1.123456789.987654321',
  '{"test": true, "source": "manual_verification"}'::jsonb
) RETURNING id, event_type, vehicle_id, created_at;

-- =====================================================
-- TEST 5: Insertar más eventos para probar métricas
-- =====================================================
SELECT 'TEST 5: Insertar eventos adicionales' as test;

-- Search event
INSERT INTO public.facebook_catalogue_events (event_type, search_query, session_id)
VALUES ('Search', 'Toyota SUV', 'test_session_search_' || gen_random_uuid()::text);

-- AddToCart event
INSERT INTO public.facebook_catalogue_events (
  event_type, vehicle_id, vehicle_data, interaction_type, session_id
) VALUES (
  'AddToCart',
  'test_rec123',
  jsonb_build_object('id', 'test_rec123', 'title', 'Toyota Camry 2020 Test', 'price', 250000),
  'calculator',
  'test_session_cart_' || gen_random_uuid()::text
);

-- InitiateCheckout event
INSERT INTO public.facebook_catalogue_events (
  event_type, vehicle_id, vehicle_data, session_id
) VALUES (
  'InitiateCheckout',
  'test_rec123',
  jsonb_build_object('id', 'test_rec123', 'title', 'Toyota Camry 2020 Test', 'price', 250000),
  'test_session_checkout_' || gen_random_uuid()::text
);

-- Lead event
INSERT INTO public.facebook_catalogue_events (
  event_type, vehicle_id, vehicle_data, session_id
) VALUES (
  'Lead',
  'test_rec123',
  jsonb_build_object('id', 'test_rec123', 'title', 'Toyota Camry 2020 Test', 'price', 250000),
  'test_session_lead_' || gen_random_uuid()::text
);

SELECT '✅ Eventos de prueba insertados correctamente' as resultado;

-- =====================================================
-- TEST 6: Probar función get_catalogue_metrics
-- =====================================================
SELECT 'TEST 6: Probar get_catalogue_metrics()' as test;

SELECT * FROM get_catalogue_metrics(
  NOW() - INTERVAL '1 hour',
  NOW()
);

-- =====================================================
-- TEST 7: Probar función get_top_performing_vehicles
-- =====================================================
SELECT 'TEST 7: Probar get_top_performing_vehicles()' as test;

SELECT * FROM get_top_performing_vehicles(
  NOW() - INTERVAL '1 hour',
  NOW(),
  5
);

-- =====================================================
-- TEST 8: Consultar vista catalogue_funnel_by_vehicle
-- =====================================================
SELECT 'TEST 8: Consultar vista catalogue_funnel_by_vehicle' as test;

SELECT *
FROM catalogue_funnel_by_vehicle
WHERE vehicle_id = 'test_rec123'
LIMIT 5;

-- =====================================================
-- TEST 9: Verificar permisos
-- =====================================================
SELECT 'TEST 9: Verificar permisos RLS' as test;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'facebook_catalogue_events'
ORDER BY grantee, privilege_type;

-- =====================================================
-- TEST 10: Ver todos los eventos insertados
-- =====================================================
SELECT 'TEST 10: Ver eventos de prueba insertados' as test;

SELECT
  id,
  event_type,
  vehicle_id,
  interaction_type,
  search_query,
  fbclid,
  created_at
FROM public.facebook_catalogue_events
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- =====================================================
-- CLEANUP (Opcional - Descomentar para limpiar)
-- =====================================================
-- DELETE FROM public.facebook_catalogue_events
-- WHERE vehicle_id = 'test_rec123'
--    OR search_query = 'Toyota SUV'
--    OR metadata->>'test' = 'true';
