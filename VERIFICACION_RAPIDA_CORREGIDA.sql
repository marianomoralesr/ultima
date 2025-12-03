-- ============================================================================
-- VERIFICACIÓN RÁPIDA CORREGIDA: ¿Las migraciones se aplicaron?
-- ============================================================================

-- 1. ¿Existe la política profiles_insert?
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ profiles_insert EXISTE'
    ELSE '❌ profiles_insert NO EXISTE - Usuarios NO pueden registrarse'
  END as estado_insert
FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'profiles_insert';

-- 2. ¿La política profiles_select contiene asesor_autorizado_acceso?
SELECT
  p.polname as nombre_politica,
  CASE
    WHEN pg_get_expr(p.qual, p.polrelid) LIKE '%asesor_autorizado_acceso%' THEN '❌ SÍ CONTIENE (PROBLEMA)'
    ELSE '✅ NO CONTIENE (CORRECTO)'
  END as tiene_constraint_problematico
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'profiles'
  AND p.polname = 'profiles_select';

-- 3. ¿Cuántos leads están bloqueados?
SELECT
  COUNT(*) as leads_sin_autorizacion,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ No hay leads bloqueados'
    ELSE '⚠️ Hay ' || COUNT(*) || ' leads sin asesor_autorizado_acceso = true'
  END as diagnostico
FROM profiles
WHERE role = 'user'
  AND asesor_asignado_id IS NOT NULL
  AND (asesor_autorizado_acceso = false OR asesor_autorizado_acceso IS NULL);

-- 4. ¿Hay usuarios con role sales?
SELECT
  COUNT(*) as total_sales_users,
  CASE
    WHEN COUNT(*) = 0 THEN '❌ NO hay usuarios sales'
    ELSE '✅ Hay ' || COUNT(*) || ' usuarios sales'
  END as estado_sales
FROM profiles
WHERE role = 'sales';

-- 5. ¿Hay leads asignados a sales users?
SELECT
  COUNT(*) as leads_asignados_a_sales,
  CASE
    WHEN COUNT(*) = 0 THEN '⚠️ NO hay leads asignados a sales'
    ELSE '✅ Hay ' || COUNT(*) || ' leads asignados a sales'
  END as estado_asignacion
FROM profiles
WHERE role = 'user'
  AND asesor_asignado_id IS NOT NULL;
