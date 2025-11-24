-- Script de Verificación del Setup de Roadmap
-- Corre esto en el SQL Editor de Supabase para diagnosticar problemas

-- 1. Verificar que la tabla existe
SELECT
    'Table exists: roadmap_items' as check_name,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'roadmap_items'
    ) THEN '✅ YES' ELSE '❌ NO' END as result;

-- 2. Ver estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'roadmap_items'
ORDER BY ordinal_position;

-- 3. Contar items en la tabla
SELECT
    'Total roadmap items' as check_name,
    COUNT(*) as count
FROM roadmap_items;

-- 4. Ver políticas RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'roadmap_items';

-- 5. Verificar que RLS está habilitado
SELECT
    'RLS enabled on roadmap_items' as check_name,
    CASE WHEN relrowsecurity THEN '✅ YES' ELSE '❌ NO' END as result
FROM pg_class
WHERE relname = 'roadmap_items';

-- 6. Ver tu rol de usuario (ejecuta como usuario autenticado)
SELECT
    'Your role' as check_name,
    role as result
FROM profiles
WHERE id = auth.uid();

-- 7. Test de INSERT (como admin)
-- NOTA: Esto intentará insertar y luego eliminar inmediatamente
DO $$
DECLARE
    test_id uuid;
BEGIN
    INSERT INTO roadmap_items (title, description, category, status, is_published)
    VALUES ('TEST - Delete me', 'Test insert', 'Nueva Funcionalidad', 'Planificado para Iniciar', false)
    RETURNING id INTO test_id;

    RAISE NOTICE 'INSERT Test: ✅ SUCCESS - ID: %', test_id;

    DELETE FROM roadmap_items WHERE id = test_id;
    RAISE NOTICE 'Cleanup: ✅ Test record deleted';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'INSERT Test: ❌ FAILED - Error: %', SQLERRM;
END $$;
