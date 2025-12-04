-- ============================================================================
-- VERIFICACIÓN COMPLETA: Todas las Políticas RLS
-- ============================================================================
-- Ejecuta esto para ver TODAS las políticas actuales y detectar qué falta
-- ============================================================================

\echo ''
\echo '==================== POLÍTICAS DE PROFILES ===================='
SELECT
  policyname,
  cmd,
  roles::text,
  permissive,
  CASE
    WHEN cmd = 'INSERT' AND policyname = 'profiles_insert' THEN '✅ INSERT OK'
    WHEN cmd = 'SELECT' AND policyname = 'profiles_select' THEN '✅ SELECT OK'
    WHEN cmd = 'UPDATE' AND policyname = 'profiles_update' THEN '✅ UPDATE OK'
    ELSE '⚠️ REVISAR'
  END as estado
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

\echo ''
\echo '==================== POLÍTICAS DE FINANCING_APPLICATIONS ===================='
SELECT
  policyname,
  cmd,
  roles::text,
  CASE
    WHEN policyname LIKE '%select%' THEN '✅ SELECT'
    WHEN policyname LIKE '%insert%' THEN '✅ INSERT'
    WHEN policyname LIKE '%update%' THEN '✅ UPDATE'
    ELSE policyname
  END as tipo
FROM pg_policies
WHERE tablename = 'financing_applications'
ORDER BY cmd, policyname;

\echo ''
\echo '==================== POLÍTICAS DE UPLOADED_DOCUMENTS ===================='
SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE tablename = 'uploaded_documents'
ORDER BY cmd, policyname;

\echo ''
\echo '==================== POLÍTICAS DE BANK_PROFILES ===================='
SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE tablename = 'bank_profiles'
ORDER BY cmd, policyname;

\echo ''
\echo '==================== BUSCAR CONSTRAINT asesor_autorizado_acceso ===================='
SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN pg_get_expr(qual, polrelid) LIKE '%asesor_autorizado_acceso%' THEN '❌ BLOQUEADO'
    ELSE '✅ SIN RESTRICCIÓN'
  END as estado_constraint,
  CASE
    WHEN pg_get_expr(with_check, polrelid) LIKE '%asesor_autorizado_acceso%' THEN '❌ WITH CHECK BLOQUEADO'
    ELSE '✅ WITH CHECK OK'
  END as with_check_status
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'financing_applications', 'uploaded_documents', 'bank_profiles');

\echo ''
\echo '==================== VERIFICAR profiles_insert ===================='
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'profiles'
        AND policyname = 'profiles_insert'
        AND cmd = 'INSERT'
    ) THEN '✅ profiles_insert EXISTE'
    ELSE '❌ profiles_insert NO EXISTE - Usuarios NO pueden registrarse'
  END as estado_insert_policy;

\echo ''
\echo '==================== VERIFICAR financing_apps_insert ===================='
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'financing_applications'
        AND policyname LIKE '%insert%'
        AND cmd = 'INSERT'
    ) THEN '✅ financing_apps INSERT existe'
    ELSE '❌ financing_apps INSERT NO existe'
  END as estado_apps_insert;

\echo ''
\echo '==================== CONTENIDO COMPLETO: profiles_select ===================='
SELECT
  'USING clause:' as seccion,
  pg_get_expr(qual, polrelid) as contenido
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'profiles'
  AND policyname = 'profiles_select'
UNION ALL
SELECT
  'WITH CHECK clause:' as seccion,
  pg_get_expr(with_check, polrelid) as contenido
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'profiles'
  AND policyname = 'profiles_select';

\echo ''
\echo '==================== RESUMEN DIAGNÓSTICO ===================='
\echo ''
\echo 'Verifica que:'
\echo '  1. ✅ profiles_insert existe (para registro de usuarios)'
\echo '  2. ✅ profiles_select NO contiene asesor_autorizado_acceso'
\echo '  3. ✅ financing_apps_select NO contiene asesor_autorizado_acceso'
\echo '  4. ✅ Estado de constraint muestra "SIN RESTRICCIÓN" para sales'
\echo ''
\echo 'Si alguno está con ❌, las migraciones NO se aplicaron correctamente'
\echo ''
