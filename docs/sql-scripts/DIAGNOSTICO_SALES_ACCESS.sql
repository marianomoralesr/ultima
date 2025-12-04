-- ============================================================================
-- DIAGNÓSTICO: ¿Por qué sales NO puede acceder a sus leads?
-- ============================================================================
-- Ejecuta este script COMPLETO en el SQL Editor de Supabase Dashboard
-- para diagnosticar el problema de acceso de los asesores
-- ============================================================================

\echo ''
\echo '==================== PASO 1: Verificar que hay usuarios sales ===================='
SELECT
  id,
  email,
  first_name,
  last_name,
  role
FROM profiles
WHERE role = 'sales'
LIMIT 5;

\echo ''
\echo '==================== PASO 2: Verificar que hay leads asignados a sales ===================='
SELECT
  p.id as lead_id,
  p.email as lead_email,
  p.first_name as lead_name,
  p.asesor_asignado_id,
  p.asesor_autorizado_acceso,
  s.email as asesor_email,
  s.role as asesor_role
FROM profiles p
LEFT JOIN profiles s ON s.id = p.asesor_asignado_id
WHERE p.role = 'user'
  AND p.asesor_asignado_id IS NOT NULL
LIMIT 10;

\echo ''
\echo '==================== PASO 3: Contar leads por asesor_autorizado_acceso ===================='
SELECT
  asesor_autorizado_acceso,
  COUNT(*) as cantidad_leads
FROM profiles
WHERE role = 'user'
  AND asesor_asignado_id IS NOT NULL
GROUP BY asesor_autorizado_acceso;

\echo ''
\echo '==================== PASO 4: Ver políticas RLS de profiles ===================='
SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

\echo ''
\echo '==================== PASO 5: Ver contenido completo de profiles_select ===================='
SELECT
  policyname,
  pg_get_expr(qual, polrelid) as using_condition,
  pg_get_expr(with_check, polrelid) as with_check_condition
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'profiles'
  AND policyname = 'profiles_select';

\echo ''
\echo '==================== PASO 6: Verificar si la función get_leads_for_dashboard existe ===================='
SELECT
  routine_name,
  routine_type,
  security_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_leads_for_dashboard';

\echo ''
\echo '==================== PASO 7: Verificar grants de la función ===================='
SELECT
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'get_leads_for_dashboard';

\echo ''
\echo '==================== PASO 8: Intentar ejecutar la función como admin (simulated) ===================='
-- Este query simula lo que hace la función
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  p.phone,
  p.asesor_asignado_id
FROM profiles p
WHERE p.role = 'user'
LIMIT 5;

\echo ''
\echo '==================== PASO 9: Buscar asesor_autorizado_acceso en políticas ===================='
SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN pg_get_expr(qual, polrelid) LIKE '%asesor_autorizado_acceso%' THEN '❌ SÍ TIENE CONSTRAINT'
    ELSE '✅ NO TIENE CONSTRAINT'
  END as tiene_constraint,
  pg_get_expr(qual, polrelid) as using_clause
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'financing_applications', 'uploaded_documents', 'bank_profiles')
  AND policyname LIKE '%select%';

\echo ''
\echo '==================== PASO 10: Verificar función get_my_role ===================='
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_my_role';

\echo ''
\echo '==================== RESUMEN DEL DIAGNÓSTICO ===================='
\echo ''
\echo 'Si ves:'
\echo '  - Paso 3: Muchos leads con asesor_autorizado_acceso = false → Ese es el problema'
\echo '  - Paso 5: La política contiene "asesor_autorizado_acceso" → RLS bloqueando'
\echo '  - Paso 9: Políticas con ❌ SÍ TIENE CONSTRAINT → Migraciones no aplicadas'
\echo ''
\echo 'Si NO ves asesor_autorizado_acceso en ninguna política → Migraciones aplicadas correctamente'
\echo ''
