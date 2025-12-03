-- ============================================================================
-- VERIFICACIÓN: Funciones RPC del Performance Dashboard
-- ============================================================================
-- Ejecuta esto en Supabase Dashboard -> SQL Editor para verificar las funciones
-- ============================================================================

-- 1. Ver todas las funciones que existen con estos nombres
SELECT
    routine_name,
    routine_schema,
    pg_get_function_arguments(p.oid) as parameters,
    pg_get_function_result(p.oid) as returns_type
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_sales_performance_metrics',
    'get_sales_applications_by_status',
    'get_sales_detailed_applications'
  )
ORDER BY routine_name;

-- 2. Si no aparecen funciones, o aparecen con parámetros incorrectos, ejecuta esto:
-- NOTA: Copia el contenido COMPLETO del archivo:
-- supabase/migrations/20251203210000_fix_sales_performance_dashboard_functions.sql
-- y pégalo aquí en el SQL Editor

-- 3. Después de aplicar la migración, ejecuta este SELECT de nuevo para verificar
