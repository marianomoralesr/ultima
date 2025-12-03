-- ============================================================================
-- Script de Verificación del Estado Actual de Políticas RLS
-- ============================================================================
-- Ejecuta esto en Supabase Dashboard SQL Editor para ver qué políticas existen
-- ============================================================================

-- 1. Ver TODAS las políticas de la tabla profiles
SELECT
  policyname,
  cmd,
  roles,
  CASE
    WHEN policyname = 'profiles_insert' THEN '✅ NECESARIA para registro'
    WHEN policyname = 'profiles_select' THEN '✅ NECESARIA para sales'
    WHEN policyname = 'profiles_update' THEN '✅ NECESARIA para sales'
    ELSE 'Otra política'
  END as importancia
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 2. Verificar si existe la política INSERT (crítica para registro)
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'profiles'
        AND policyname = 'profiles_insert'
    ) THEN '✅ profiles_insert EXISTE - Registro debería funcionar'
    ELSE '❌ profiles_insert NO EXISTE - Registro está bloqueado'
  END as estado_insert;

-- 3. Ver el contenido de la política profiles_select (para sales)
SELECT
  policyname,
  pg_get_expr(qual, polrelid) as using_condition
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'profiles'
  AND policyname = 'profiles_select';

-- 4. Verificar si la restricción asesor_autorizado_acceso todavía existe
-- (buscar en el USING condition de profiles_select)
SELECT
  policyname,
  CASE
    WHEN pg_get_expr(qual, polrelid) LIKE '%asesor_autorizado_acceso%'
      THEN '❌ RESTRICCIÓN ANTIGUA PRESENTE - Sales no puede acceder'
    ELSE '✅ Restricción removida - Sales puede acceder'
  END as estado_constraint
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'profiles'
  AND policyname = 'profiles_select';

-- 5. Resumen general
SELECT
  'RESUMEN DEL ESTADO ACTUAL' as seccion,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as total_policies_profiles,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles' AND policyname LIKE '%insert%') as policies_insert,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles' AND policyname LIKE '%select%') as policies_select,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles' AND policyname LIKE '%update%') as policies_update;
