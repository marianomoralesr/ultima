-- ============================================================================
-- TESTING DE PERFORMANCE - Políticas RLS
-- ============================================================================
-- Fecha: 2025-12-03
-- Objetivo: Medir performance de queries con políticas RLS optimizadas
-- ============================================================================

\timing on
\echo ''
\echo '========================================'
\echo 'PERFORMANCE TESTING - RLS POLICIES'
\echo '========================================'
\echo ''

-- ============================================================================
-- PARTE 1: Configurar usuario de test
-- ============================================================================

\echo 'Configurando usuario de test...'
\echo ''

-- Necesitarás reemplazar estos UUIDs con valores reales de tu base de datos
DO $$
DECLARE
  test_admin_id uuid;
  test_sales_id uuid;
  test_user_id uuid;
BEGIN
  -- Obtener IDs de usuarios para testing
  SELECT id INTO test_admin_id
  FROM profiles
  WHERE role = 'admin'
  LIMIT 1;

  SELECT id INTO test_sales_id
  FROM profiles
  WHERE role = 'sales'
  LIMIT 1;

  SELECT id INTO test_user_id
  FROM profiles
  WHERE role = 'user'
  LIMIT 1;

  -- Guardar en variables de sesión
  PERFORM set_config('app.test_admin_id', test_admin_id::text, false);
  PERFORM set_config('app.test_sales_id', test_sales_id::text, false);
  PERFORM set_config('app.test_user_id', test_user_id::text, false);

  RAISE NOTICE 'Test Admin ID: %', test_admin_id;
  RAISE NOTICE 'Test Sales ID: %', test_sales_id;
  RAISE NOTICE 'Test User ID: %', test_user_id;
END $$;

\echo ''

-- ============================================================================
-- PARTE 2: Test de función get_my_role()
-- ============================================================================

\echo 'TEST 1: Performance de get_my_role()'
\echo '========================================'
\echo ''

-- Test 1.1: Llamada única
\echo 'Test 1.1: Llamada única a get_my_role()'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT get_my_role() as role;

\echo ''

-- Test 1.2: Múltiples llamadas (simula política RLS)
\echo 'Test 1.2: Múltiples llamadas en un WHERE'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT COUNT(*)
FROM profiles
WHERE (
  get_my_role() = 'admin'
  OR get_my_role() = 'marketing'
  OR get_my_role() = 'sales'
);

\echo ''
\echo '⚠️  Si "Execution Time" > 50ms, considera migrar a JWT claims'
\echo ''

-- ============================================================================
-- PARTE 3: Test de política profiles_select
-- ============================================================================

\echo 'TEST 2: Performance de profiles_select'
\echo '========================================'
\echo ''

-- Test 2.1: Query como Admin (ve todo)
\echo 'Test 2.1: SELECT como Admin (debe ser muy rápido)'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT COUNT(*), COUNT(DISTINCT role)
FROM profiles
WHERE get_my_role() = 'admin';

\echo ''

-- Test 2.2: Query como Sales (ve solo asignados)
\echo 'Test 2.2: SELECT como Sales (debe usar idx_profiles_sales_access)'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT COUNT(*)
FROM profiles
WHERE role = 'user'
  AND asesor_asignado_id = (SELECT id FROM profiles WHERE role = 'sales' LIMIT 1);

\echo ''
\echo '✅ Verificar que usa "Index Scan using idx_profiles_sales_access"'
\echo ''

-- ============================================================================
-- PARTE 4: Test de política financing_applications_select
-- ============================================================================

\echo 'TEST 3: Performance de financing_applications_select'
\echo '========================================'
\echo ''

-- Test 3.1: Query con EXISTS (Sales)
\echo 'Test 3.1: SELECT con EXISTS como Sales'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT fa.id, fa.status, fa.user_id
FROM financing_applications fa
WHERE EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = fa.user_id
    AND p.role = 'user'
    AND p.asesor_asignado_id = (SELECT id FROM profiles WHERE role = 'sales' LIMIT 1)
  LIMIT 1
);

\echo ''
\echo '✅ Verificar que usa "Index Scan using idx_profiles_user_assignment"'
\echo ''

-- Test 3.2: Query completa con JOIN
\echo 'Test 3.2: SELECT con JOIN a profiles'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT
  fa.id,
  fa.status,
  p.email,
  p.first_name,
  p.last_name
FROM financing_applications fa
JOIN profiles p ON p.id = fa.user_id
WHERE p.role = 'user'
  AND p.asesor_asignado_id = (SELECT id FROM profiles WHERE role = 'sales' LIMIT 1)
LIMIT 50;

\echo ''

-- ============================================================================
-- PARTE 5: Test de query complejo (get_sales_assigned_leads)
-- ============================================================================

\echo 'TEST 4: Performance de get_sales_assigned_leads()'
\echo '========================================'
\echo ''

-- Obtener un sales_user_id real
DO $$
DECLARE
  test_sales_id uuid;
BEGIN
  SELECT id INTO test_sales_id
  FROM profiles
  WHERE role = 'sales'
  LIMIT 1;

  RAISE NOTICE 'Testing con Sales ID: %', test_sales_id;
END $$;

\echo ''
\echo 'Test 4.1: Función completa get_sales_assigned_leads()'

-- Ejecutar función (reemplazar UUID con valor real)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_sales_assigned_leads(
  (SELECT id FROM profiles WHERE role = 'sales' LIMIT 1)
)
LIMIT 10;

\echo ''
\echo '✅ Tiempo de ejecución debe ser < 200ms'
\echo ''

-- ============================================================================
-- PARTE 6: Comparación ANTES vs DESPUÉS
-- ============================================================================

\echo 'TEST 5: Comparación de performance'
\echo '========================================'
\echo ''

-- Test 5.1: Sequential Scan vs Index Scan
\echo 'Test 5.1: Verificar que NO hay Sequential Scans en queries de Sales'

SELECT
  schemaname,
  tablename,
  seq_scan AS "Sequential Scans",
  seq_tup_read AS "Rows Read (Seq)",
  idx_scan AS "Index Scans",
  idx_tup_fetch AS "Rows Fetched (Idx)",
  CASE
    WHEN (seq_scan + idx_scan) > 0
    THEN ROUND((idx_scan::numeric / (seq_scan + idx_scan)) * 100, 2)
    ELSE 0
  END AS "% Index Usage"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'financing_applications',
    'uploaded_documents',
    'bank_profiles'
  )
ORDER BY tablename;

\echo ''
\echo '✅ "% Index Usage" debe ser > 90% para mejor performance'
\echo ''

-- Test 5.2: Índices más usados
\echo 'Test 5.2: Índices más utilizados (deben incluir idx_profiles_*)'

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS "Veces usado",
  idx_tup_read AS "Rows leídas",
  idx_tup_fetch AS "Rows retornadas"
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND idx_scan > 0
ORDER BY idx_scan DESC
LIMIT 20;

\echo ''

-- ============================================================================
-- PARTE 7: Test de queries problemáticas históricas
-- ============================================================================

\echo 'TEST 6: Queries históricamente lentas'
\echo '========================================'
\echo ''

-- Test 6.1: Query del dashboard de Sales (históricamente lenta)
\echo 'Test 6.1: Dashboard query - Lead count por Sales'

EXPLAIN (ANALYZE, BUFFERS)
SELECT
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE p.contactado = true) as contacted,
  COUNT(*) FILTER (WHERE p.contactado = false) as not_contacted
FROM profiles p
WHERE p.role = 'user'
  AND p.asesor_asignado_id = (SELECT id FROM profiles WHERE role = 'sales' LIMIT 1);

\echo ''
\echo '⏱️  Tiempo esperado: < 50ms'
\echo ''

-- Test 6.2: Query de aplicaciones con documentos
\echo 'Test 6.2: Applications con documentos asociados'

EXPLAIN (ANALYZE, BUFFERS)
SELECT
  fa.id,
  fa.status,
  p.email,
  (SELECT COUNT(*) FROM uploaded_documents ud WHERE ud.user_id = fa.user_id) as doc_count
FROM financing_applications fa
JOIN profiles p ON p.id = fa.user_id
WHERE p.role = 'user'
  AND p.asesor_asignado_id = (SELECT id FROM profiles WHERE role = 'sales' LIMIT 1)
LIMIT 20;

\echo ''
\echo '⏱️  Tiempo esperado: < 100ms'
\echo ''

-- ============================================================================
-- PARTE 8: Test de carga (muchos leads)
-- ============================================================================

\echo 'TEST 7: Simulación de carga alta'
\echo '========================================'
\echo ''

-- Test 7.1: Query con muchos resultados
\echo 'Test 7.1: SELECT de todos los leads de un Sales'

EXPLAIN (ANALYZE, BUFFERS)
SELECT
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.phone,
  p.contactado,
  p.created_at
FROM profiles p
WHERE p.role = 'user'
  AND p.asesor_asignado_id = (SELECT id FROM profiles WHERE role = 'sales' LIMIT 1)
ORDER BY p.created_at DESC;

\echo ''
\echo '⏱️  Debe completar en < 200ms incluso con 1000+ leads'
\echo ''

-- ============================================================================
-- PARTE 9: Detectar problemas de performance
-- ============================================================================

\echo 'TEST 8: Detectar queries lentas actuales'
\echo '========================================'
\echo ''

-- Requiere pg_stat_statements extension
\echo 'Top 10 queries más lentas relacionadas con RLS:'

SELECT
  LEFT(query, 100) as query_preview,
  calls,
  ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
  ROUND(max_exec_time::numeric, 2) as max_time_ms,
  ROUND((total_exec_time / 1000)::numeric, 2) as total_time_seconds
FROM pg_stat_statements
WHERE query LIKE '%profiles%'
   OR query LIKE '%financing_applications%'
   OR query LIKE '%get_my_role%'
ORDER BY mean_exec_time DESC
LIMIT 10;

\echo ''

-- ============================================================================
-- PARTE 10: Resumen de resultados
-- ============================================================================

\echo ''
\echo '========================================'
\echo 'RESUMEN DE PERFORMANCE'
\echo '========================================'
\echo ''

DO $$
DECLARE
  avg_get_my_role_time numeric;
  profiles_index_usage numeric;
  apps_index_usage numeric;
  slow_query_count integer;
BEGIN
  -- Calcular métricas
  SELECT COALESCE(AVG(mean_exec_time), 0) INTO avg_get_my_role_time
  FROM pg_stat_statements
  WHERE query LIKE '%get_my_role%'
  LIMIT 1;

  SELECT
    CASE
      WHEN (seq_scan + idx_scan) > 0
      THEN ROUND((idx_scan::numeric / (seq_scan + idx_scan)) * 100, 2)
      ELSE 0
    END
  INTO profiles_index_usage
  FROM pg_stat_user_tables
  WHERE tablename = 'profiles';

  SELECT
    CASE
      WHEN (seq_scan + idx_scan) > 0
      THEN ROUND((idx_scan::numeric / (seq_scan + idx_scan)) * 100, 2)
      ELSE 0
    END
  INTO apps_index_usage
  FROM pg_stat_user_tables
  WHERE tablename = 'financing_applications';

  SELECT COUNT(*) INTO slow_query_count
  FROM pg_stat_statements
  WHERE (query LIKE '%profiles%' OR query LIKE '%financing_applications%')
    AND mean_exec_time > 100;

  -- Mostrar resumen
  RAISE NOTICE 'Métricas de Performance:';
  RAISE NOTICE '';
  RAISE NOTICE '  get_my_role() avg time: % ms', ROUND(avg_get_my_role_time, 2);
  RAISE NOTICE '  profiles index usage: %%', profiles_index_usage;
  RAISE NOTICE '  financing_apps index usage: %%', apps_index_usage;
  RAISE NOTICE '  Queries lentas (>100ms): %', slow_query_count;
  RAISE NOTICE '';

  -- Evaluación
  IF avg_get_my_role_time < 10 AND profiles_index_usage > 90 AND apps_index_usage > 90 THEN
    RAISE NOTICE '✅ EXCELENTE: Performance óptima';
  ELSIF avg_get_my_role_time < 50 AND profiles_index_usage > 70 AND apps_index_usage > 70 THEN
    RAISE NOTICE '✅ BUENO: Performance aceptable';
  ELSIF profiles_index_usage < 50 OR apps_index_usage < 50 THEN
    RAISE NOTICE '⚠️  ADVERTENCIA: Bajo uso de índices, verificar queries';
  ELSE
    RAISE NOTICE '⚠️  REVISAR: Performance subóptima';
  END IF;

  RAISE NOTICE '';

  -- Recomendaciones
  IF avg_get_my_role_time > 50 THEN
    RAISE NOTICE 'Recomendación: Considerar migración a JWT claims';
  END IF;

  IF profiles_index_usage < 80 OR apps_index_usage < 80 THEN
    RAISE NOTICE 'Recomendación: Revisar queries que causan Sequential Scans';
  END IF;

  IF slow_query_count > 5 THEN
    RAISE NOTICE 'Recomendación: Optimizar queries lentas (ver pg_stat_statements)';
  END IF;
END $$;

\echo ''
\echo '========================================'
\echo 'Testing completado'
\echo ''
\echo 'Para más detalles:'
\echo '  - Ver índices: \\di+ idx_*'
\echo '  - Ver estadísticas: SELECT * FROM pg_stat_user_indexes WHERE indexname LIKE ''idx_%%'';'
\echo '  - Ver queries lentas: SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20;'
\echo '========================================'
\echo ''

\timing off
