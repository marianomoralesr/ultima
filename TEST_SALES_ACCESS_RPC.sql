-- ============================================================================
-- TEST: Verificar si get_sales_assigned_leads funciona
-- ============================================================================

-- 1. Obtener un sales user ID real
SELECT
  id,
  email,
  first_name,
  last_name
FROM profiles
WHERE role = 'sales'
LIMIT 1;

-- Copia el ID del resultado anterior y úsalo en la siguiente query
-- Reemplaza 'SALES_USER_ID_AQUI' con el ID real

-- 2. Probar la función RPC directamente
SELECT * FROM get_sales_assigned_leads('SALES_USER_ID_AQUI');

-- 3. Ver si existe la función
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_sales_assigned_leads';

-- 4. Ver los parámetros de la función
SELECT
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_sales_assigned_leads';
