-- ============================================================================
-- SCRIPT DE VERIFICACIÓN: Auditoría Completa de Políticas RLS
-- ============================================================================
-- Fecha: 2025-12-03
-- Objetivo: Verificar todas las políticas RLS y detectar problemas
-- ============================================================================

\echo ''
\echo '========================================'
\echo 'AUDITORÍA DE POLÍTICAS RLS'
\echo '========================================'
\echo ''

-- ============================================================================
-- 1. VERIFICAR TODAS LAS TABLAS CON RLS HABILITADO
-- ============================================================================

\echo '1. Tablas con Row Level Security habilitado:'
\echo ''

SELECT
  schemaname,
  tablename,
  rowsecurity AS "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

\echo ''

-- ============================================================================
-- 2. LISTAR TODAS LAS POLÍTICAS RLS EXISTENTES
-- ============================================================================

\echo '2. Políticas RLS por tabla:'
\echo ''

SELECT
  schemaname AS "Schema",
  tablename AS "Tabla",
  policyname AS "Política",
  cmd AS "Comando",
  CASE
    WHEN permissive = 'PERMISSIVE' THEN '✓'
    ELSE '✗'
  END AS "Permisiva",
  roles AS "Roles"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

\echo ''

-- ============================================================================
-- 3. DETECTAR POLÍTICAS QUE USAN get_my_role()
-- ============================================================================

\echo '3. Políticas que usan get_my_role() (riesgo de recursión):'
\echo ''

SELECT
  tablename AS "Tabla",
  policyname AS "Política",
  cmd AS "Comando",
  qual AS "Condición USING",
  with_check AS "Condición WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual::text LIKE '%get_my_role%'
    OR with_check::text LIKE '%get_my_role%'
  )
ORDER BY tablename;

\echo ''
\echo '⚠️  Si la tabla "profiles" aparece arriba, hay RIESGO DE RECURSIÓN'
\echo ''

-- ============================================================================
-- 4. DETECTAR POLÍTICAS CON EXISTS QUERIES
-- ============================================================================

\echo '4. Políticas con EXISTS queries (potencial problema de performance):'
\echo ''

SELECT
  tablename AS "Tabla",
  policyname AS "Política",
  cmd AS "Comando",
  CASE
    WHEN qual::text LIKE '%EXISTS%' THEN 'USING'
    WHEN with_check::text LIKE '%EXISTS%' THEN 'WITH CHECK'
  END AS "Tipo"
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual::text LIKE '%EXISTS%'
    OR with_check::text LIKE '%EXISTS%'
  )
ORDER BY tablename;

\echo ''
\echo '⚠️  Estas políticas necesitan índices para performance óptimo'
\echo ''

-- ============================================================================
-- 5. VERIFICAR ÍNDICES CRÍTICOS PARA RLS
-- ============================================================================

\echo '5. Índices críticos para RLS (deben existir):'
\echo ''

WITH required_indexes AS (
  SELECT unnest(ARRAY[
    'idx_profiles_sales_access',
    'idx_profiles_user_assignment',
    'idx_profiles_id_role',
    'idx_financing_applications_user_id',
    'idx_uploaded_documents_user_id',
    'idx_bank_profiles_user_id',
    'idx_lead_tag_associations_lead_id',
    'idx_lead_reminders_lead_id'
  ]) AS index_name
),
existing_indexes AS (
  SELECT indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
)
SELECT
  ri.index_name AS "Índice Requerido",
  CASE
    WHEN ei.indexname IS NOT NULL THEN '✅ Existe'
    ELSE '❌ FALTA'
  END AS "Estado"
FROM required_indexes ri
LEFT JOIN existing_indexes ei ON ri.index_name = ei.indexname
ORDER BY ri.index_name;

\echo ''

-- ============================================================================
-- 6. DETECTAR TABLAS SIN POLÍTICAS RLS
-- ============================================================================

\echo '6. Tablas importantes sin políticas RLS (ADVERTENCIA):'
\echo ''

WITH important_tables AS (
  SELECT unnest(ARRAY[
    'profiles',
    'financing_applications',
    'uploaded_documents',
    'bank_profiles',
    'lead_tags',
    'lead_tag_associations',
    'lead_reminders'
  ]) AS table_name
),
tables_with_policies AS (
  SELECT DISTINCT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT
  it.table_name AS "Tabla",
  CASE
    WHEN twp.tablename IS NOT NULL THEN '✅ Tiene políticas'
    ELSE '⚠️  SIN POLÍTICAS'
  END AS "Estado RLS"
FROM important_tables it
LEFT JOIN tables_with_policies twp ON it.table_name = twp.tablename
ORDER BY it.table_name;

\echo ''

-- ============================================================================
-- 7. VERIFICAR SI get_my_role() EXISTE Y SU DEFINICIÓN
-- ============================================================================

\echo '7. Verificar función get_my_role():'
\echo ''

SELECT
  proname AS "Función",
  prosecdef AS "SECURITY DEFINER",
  provolatile AS "Volatility",
  pg_get_functiondef(p.oid) AS "Definición"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_my_role';

\echo ''

-- Si no existe, mostrar advertencia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_my_role'
  ) THEN
    RAISE NOTICE '⚠️  ADVERTENCIA: Función get_my_role() NO EXISTE';
    RAISE NOTICE '   Las políticas RLS que la usan FALLARÁN';
  END IF;
END $$;

-- ============================================================================
-- 8. DETECTAR POLÍTICAS DUPLICADAS O CONFLICTIVAS
-- ============================================================================

\echo '8. Detectar políticas duplicadas (mismo comando en misma tabla):'
\echo ''

SELECT
  tablename AS "Tabla",
  cmd AS "Comando",
  COUNT(*) AS "Cantidad de Políticas"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

\echo ''

-- ============================================================================
-- 9. ANALIZAR COMPLEJIDAD DE POLÍTICAS
-- ============================================================================

\echo '9. Políticas complejas (más de 200 caracteres - revisar performance):'
\echo ''

SELECT
  tablename AS "Tabla",
  policyname AS "Política",
  cmd AS "Comando",
  LENGTH(qual::text) AS "Longitud USING",
  LENGTH(with_check::text) AS "Longitud WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
  AND (LENGTH(qual::text) > 200 OR LENGTH(with_check::text) > 200)
ORDER BY LENGTH(qual::text) DESC;

\echo ''

-- ============================================================================
-- 10. VERIFICAR USO DE ÍNDICES EN TABLAS RLS
-- ============================================================================

\echo '10. Estadísticas de uso de índices (tabla scans vs index scans):'
\echo ''

SELECT
  schemaname AS "Schema",
  tablename AS "Tabla",
  seq_scan AS "Table Scans",
  idx_scan AS "Index Scans",
  CASE
    WHEN (seq_scan + idx_scan) > 0
    THEN ROUND((seq_scan::numeric / (seq_scan + idx_scan)) * 100, 2)
    ELSE 0
  END AS "% Table Scans",
  CASE
    WHEN seq_scan > idx_scan AND seq_scan > 1000 THEN '⚠️  REVISAR'
    ELSE '✅ OK'
  END AS "Estado"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'financing_applications',
    'uploaded_documents',
    'bank_profiles',
    'lead_tag_associations',
    'lead_reminders'
  )
ORDER BY seq_scan DESC;

\echo ''
\echo '⚠️  Si "% Table Scans" > 50%, la tabla necesita mejores índices'
\echo ''

-- ============================================================================
-- 11. VERIFICAR CONSTRAINT asesor_autorizado_acceso (DEBE ESTAR REMOVIDO)
-- ============================================================================

\echo '11. Verificar si políticas usan asesor_autorizado_acceso (DEBE SER 0):'
\echo ''

SELECT
  tablename AS "Tabla",
  policyname AS "Política",
  'USING' AS "Tipo"
FROM pg_policies
WHERE schemaname = 'public'
  AND qual::text LIKE '%asesor_autorizado_acceso%'
UNION ALL
SELECT
  tablename AS "Tabla",
  policyname AS "Política",
  'WITH CHECK' AS "Tipo"
FROM pg_policies
WHERE schemaname = 'public'
  AND with_check::text LIKE '%asesor_autorizado_acceso%';

\echo ''

DO $$
DECLARE
  count_found INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_found
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      qual::text LIKE '%asesor_autorizado_acceso%'
      OR with_check::text LIKE '%asesor_autorizado_acceso%'
    );

  IF count_found > 0 THEN
    RAISE NOTICE '❌ PROBLEMA: Se encontraron % políticas con asesor_autorizado_acceso', count_found;
    RAISE NOTICE '   Estas políticas deben ser actualizadas';
  ELSE
    RAISE NOTICE '✅ CORRECTO: Ninguna política usa asesor_autorizado_acceso';
  END IF;
END $$;

-- ============================================================================
-- 12. RESUMEN FINAL
-- ============================================================================

\echo ''
\echo '========================================'
\echo 'RESUMEN DE AUDITORÍA'
\echo '========================================'

DO $$
DECLARE
  tables_with_rls INTEGER;
  total_policies INTEGER;
  policies_with_get_my_role INTEGER;
  policies_with_exists INTEGER;
  missing_indexes INTEGER;
  tables_without_policies INTEGER;
BEGIN
  -- Contar tablas con RLS
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;

  -- Contar políticas totales
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Contar políticas con get_my_role
  SELECT COUNT(*) INTO policies_with_get_my_role
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual::text LIKE '%get_my_role%' OR with_check::text LIKE '%get_my_role%');

  -- Contar políticas con EXISTS
  SELECT COUNT(*) INTO policies_with_exists
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual::text LIKE '%EXISTS%' OR with_check::text LIKE '%EXISTS%');

  -- Contar índices faltantes
  WITH required AS (
    SELECT 8 AS total_required
  ),
  existing AS (
    SELECT COUNT(*) AS count_existing
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (
        'idx_profiles_sales_access',
        'idx_profiles_user_assignment',
        'idx_profiles_id_role',
        'idx_financing_applications_user_id',
        'idx_uploaded_documents_user_id',
        'idx_bank_profiles_user_id',
        'idx_lead_tag_associations_lead_id',
        'idx_lead_reminders_lead_id'
      )
  )
  SELECT r.total_required - e.count_existing INTO missing_indexes
  FROM required r, existing e;

  -- Contar tablas importantes sin políticas
  WITH important AS (
    SELECT unnest(ARRAY[
      'profiles', 'financing_applications', 'uploaded_documents',
      'bank_profiles', 'lead_tags', 'lead_tag_associations', 'lead_reminders'
    ]) AS table_name
  ),
  with_policies AS (
    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
  )
  SELECT COUNT(*) INTO tables_without_policies
  FROM important i
  LEFT JOIN with_policies wp ON i.table_name = wp.tablename
  WHERE wp.tablename IS NULL;

  -- Mostrar resumen
  RAISE NOTICE '';
  RAISE NOTICE 'Estadísticas:';
  RAISE NOTICE '  • Tablas con RLS: %', tables_with_rls;
  RAISE NOTICE '  • Políticas totales: %', total_policies;
  RAISE NOTICE '  • Políticas con get_my_role(): %', policies_with_get_my_role;
  RAISE NOTICE '  • Políticas con EXISTS: %', policies_with_exists;
  RAISE NOTICE '  • Índices críticos faltantes: %', missing_indexes;
  RAISE NOTICE '  • Tablas importantes sin políticas: %', tables_without_policies;
  RAISE NOTICE '';

  -- Recomendaciones
  IF missing_indexes > 0 THEN
    RAISE NOTICE '⚠️  ACCIÓN REQUERIDA: Ejecutar RLS_CREATE_CRITICAL_INDEXES.sql';
  END IF;

  IF policies_with_get_my_role > 0 AND EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND (qual::text LIKE '%get_my_role%' OR with_check::text LIKE '%get_my_role%')
  ) THEN
    RAISE NOTICE '⚠️  ADVERTENCIA: Posible recursión en get_my_role()';
    RAISE NOTICE '   Considerar migración a JWT claims';
  END IF;

  IF tables_without_policies > 0 THEN
    RAISE NOTICE '⚠️  ADVERTENCIA: Tablas sin políticas RLS detectadas';
  END IF;

  IF missing_indexes = 0 AND tables_without_policies = 0 THEN
    RAISE NOTICE '✅ Sistema RLS en buen estado';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

\echo ''
\echo 'Auditoría completada.'
\echo ''
