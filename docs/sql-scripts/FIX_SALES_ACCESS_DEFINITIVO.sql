-- ============================================================================
-- FIX DEFINITIVO: Eliminar Políticas Conflictivas y Consolidar
-- ============================================================================
-- Problema identificado: profiles_sales_update_contactado tiene el constraint
-- asesor_autorizado_acceso que bloquea a los sales users
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Eliminar TODAS las políticas antiguas de profiles
-- ============================================================================

-- Eliminar políticas SELECT antiguas/duplicadas
DROP POLICY IF EXISTS "Admins can read all profiles by email" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_sales_can_view" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_optimized" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Eliminar políticas UPDATE antiguas/duplicadas
DROP POLICY IF EXISTS "Admins can update all profiles by email" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_sales_update_contactado" ON public.profiles; -- ❌ Esta tiene el constraint bloqueante

-- Eliminar políticas INSERT antiguas/duplicadas
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- ============================================================================
-- PASO 2: Mantener SOLO las políticas correctas (sin constraint)
-- ============================================================================
-- Estas ya existen y están bien:
-- - profiles_insert (INSERT)
-- - profiles_select (SELECT sin asesor_autorizado_acceso)
-- - profiles_update (UPDATE sin asesor_autorizado_acceso)
-- ============================================================================

-- Verificar que profiles_insert existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles' AND policyname = 'profiles_insert'
    ) THEN
        -- Crear si no existe
        EXECUTE '
        CREATE POLICY "profiles_insert" ON public.profiles
        FOR INSERT TO authenticated, anon
        WITH CHECK (
          id = auth.uid()
          OR
          get_my_role() = ''admin''
          OR
          get_my_role() = ''marketing''
        )';
        RAISE NOTICE 'profiles_insert creada';
    ELSE
        RAISE NOTICE 'profiles_insert ya existe';
    END IF;
END $$;

-- Verificar que profiles_select existe y es correcta
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles' AND policyname = 'profiles_select'
    ) THEN
        -- Crear si no existe
        EXECUTE '
        CREATE POLICY "profiles_select" ON public.profiles
        FOR SELECT TO authenticated
        USING (
          id = auth.uid()
          OR
          get_my_role() = ''admin''
          OR
          get_my_role() = ''marketing''
          OR
          (
            get_my_role() = ''sales''
            AND role = ''user''
            AND asesor_asignado_id = auth.uid()
          )
        )';
        RAISE NOTICE 'profiles_select creada';
    ELSE
        RAISE NOTICE 'profiles_select ya existe';
    END IF;
END $$;

-- Verificar que profiles_update existe y es correcta
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles' AND policyname = 'profiles_update'
    ) THEN
        -- Crear si no existe
        EXECUTE '
        CREATE POLICY "profiles_update" ON public.profiles
        FOR UPDATE TO authenticated
        USING (
          id = auth.uid()
          OR
          get_my_role() IN (''admin'', ''marketing'')
          OR
          (
            get_my_role() = ''sales''
            AND role = ''user''
            AND asesor_asignado_id = auth.uid()
          )
        )
        WITH CHECK (
          id = auth.uid()
          OR
          get_my_role() IN (''admin'', ''marketing'')
          OR
          (
            get_my_role() = ''sales''
            AND role = ''user''
            AND asesor_asignado_id = auth.uid()
          )
        )';
        RAISE NOTICE 'profiles_update creada';
    ELSE
        RAISE NOTICE 'profiles_update ya existe';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- PASO 3: Verificar el resultado
-- ============================================================================

SELECT
  policyname,
  cmd,
  CASE
    WHEN policyname IN ('profiles_insert', 'profiles_select', 'profiles_update') THEN '✅ CORRECTA'
    ELSE '⚠️ ANTIGUA - Debería eliminarse'
  END as estado
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Deberías ver SOLO 3 políticas:
-- - profiles_insert (INSERT) ✅
-- - profiles_select (SELECT) ✅
-- - profiles_update (UPDATE) ✅
--
-- Si ves más políticas, significa que no se eliminaron correctamente
-- ============================================================================
