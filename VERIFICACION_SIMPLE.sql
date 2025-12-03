-- ============================================================================
-- VERIFICACIÓN SIMPLE: ¿Las migraciones se aplicaron?
-- ============================================================================

-- 1. ¿Existe la política profiles_insert?
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ profiles_insert EXISTE'
    ELSE '❌ profiles_insert NO EXISTE - Usuarios NO pueden registrarse'
  END as estado_insert
FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'profiles_insert';

-- 2. Ver todas las políticas de profiles
SELECT
  policyname,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 3. ¿Cuántos leads están sin autorización?
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

-- 6. Ejemplo de lead asignado a sales
SELECT
  p.id,
  p.email as lead_email,
  p.first_name,
  p.asesor_asignado_id,
  p.asesor_autorizado_acceso,
  s.email as asesor_email,
  s.role as asesor_role
FROM profiles p
LEFT JOIN profiles s ON s.id = p.asesor_asignado_id
WHERE p.role = 'user'
  AND p.asesor_asignado_id IS NOT NULL
LIMIT 3;
