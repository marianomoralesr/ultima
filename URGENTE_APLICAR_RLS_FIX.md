# 🚨 URGENTE: Aplicar Fix de RLS para Registro de Usuarios

## ❌ Error Actual

```
❌ Profile update error:
Object { code: "42501", details: null, hint: null, message: 'new row violates row-level security policy for table "profiles"' }
```

## 🔍 Causa

El error ocurre porque **falta una política de INSERT** en la tabla `profiles`. Cuando un usuario se registra desde `/financiamientos`, el sistema intenta hacer un `upsert` que internamente requiere permisos de INSERT.

## ✅ Solución (2 Migraciones)

Debes aplicar **DOS migraciones** en el Supabase Dashboard:

---

### Migración 1: Fix de INSERT Policy

**Ve a**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

**Copia y pega este SQL**:

\`\`\`sql
-- ============================================================================
-- FIX: Add INSERT policy for profiles table
-- ============================================================================

-- Drop existing INSERT policy if any
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

-- Create INSERT policy for users creating their own profile
CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT TO authenticated, anon
WITH CHECK (
  -- Users can insert their own profile
  id = auth.uid()
  OR
  -- Admin can insert any profile
  get_my_role() = 'admin'
  OR
  -- Marketing can insert any profile
  get_my_role() = 'marketing'
);

COMMENT ON POLICY "profiles_insert" ON public.profiles IS
'Allow users to create their own profile, admins and marketing can create any profile';

-- Verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ profiles_insert POLICY CREATED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Policy Details:';
    RAISE NOTICE '  - Users can INSERT their own profile (id = auth.uid())';
    RAISE NOTICE '  - Admin can INSERT any profile';
    RAISE NOTICE '  - Marketing can INSERT any profile';
    RAISE NOTICE '  - Applies to authenticated AND anon users';
    RAISE NOTICE '';
    RAISE NOTICE 'This fixes the RLS error on FinanciamientosPage registration';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
\`\`\`

**Click en "Run" (abajo a la derecha)**

---

### Migración 2: Fix de Sales Access (Opcional pero Recomendado)

Esta migración también está pendiente y corrige problemas de acceso para usuarios de ventas.

**Archivo**: `supabase/migrations/20251203000000_remove_asesor_autorizado_constraint_global.sql`

Es un archivo largo (529 líneas), así que puedes:

**Opción A**: Copiar el contenido del archivo completo y ejecutarlo en el SQL Editor

**Opción B**: Aplicarlo más tarde si no afecta el registro de usuarios

---

## 🧪 Cómo Probar el Fix

1. **Aplica la Migración 1** (la de INSERT policy)
2. **Abre la página de financiamientos**: http://localhost:5173/financiamientos
3. **Completa el formulario** con un nuevo email y teléfono
4. **Verifica el código SMS**
5. **Confirma que NO veas** el error de RLS

### Resultado Esperado:

✅ El registro se completa sin errores
✅ El usuario llega a la página de perfil
✅ Los datos (nombre, teléfono, email) se guardan correctamente

---

## 📊 Verificar que se Aplicó

Después de ejecutar la migración, ejecuta este SQL para verificar:

\`\`\`sql
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'profiles_insert';
\`\`\`

**Resultado esperado**:

| policyname | roles | cmd |
|------------|-------|-----|
| profiles_insert | {authenticated,anon} | INSERT |

---

## 🐛 Si el Error Persiste

Si después de aplicar la migración el error continúa:

1. **Verifica en SQL Editor**:
   \`\`\`sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   \`\`\`
   Deberías ver:
   - `profiles_select`
   - `profiles_update`
   - `profiles_insert` ← **Esta debe existir**

2. **Revisa los logs de Supabase**:
   - Ve a: Dashboard → Logs → Postgres Logs
   - Busca errores relacionados con RLS

3. **Comparte el error completo** incluyendo:
   - El mensaje de error de la consola
   - La respuesta de verificación de políticas

---

## ⚡ Aplicación Rápida (Una Línea)

Si tienes acceso a la conexión directa de Supabase:

\`\`\`bash
npx supabase db execute --file supabase/migrations/20251203140000_fix_profiles_insert_policy.sql
\`\`\`

---

## 📝 Archivos Relacionados

- ✅ `supabase/migrations/20251203140000_fix_profiles_insert_policy.sql` (NUEVA)
- ⏳ `supabase/migrations/20251203000000_remove_asesor_autorizado_constraint_global.sql` (Pendiente)
- 📄 `src/pages/FinanciamientosPage.tsx` (línea 640 - donde ocurre el error)

---

## 🎯 Prioridad

**ALTA** - Este fix es necesario para que funcione el registro de nuevos usuarios desde la página de financiamientos.

Sin este fix:
- ❌ Los usuarios no pueden registrarse desde /financiamientos
- ❌ El flujo de SMS OTP no funciona completamente
- ❌ Los usuarios ven un error técnico en lugar de completar su registro
