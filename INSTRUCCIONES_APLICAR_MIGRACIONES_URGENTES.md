# 🚨 INSTRUCCIONES: Aplicar Migraciones Urgentes RLS

## 2 Problemas Críticos a Resolver:

1. ❌ **Usuarios NO pueden registrarse** desde /financiamientos (Error RLS)
2. ❌ **Asesores NO pueden ver sus leads** asignados (Error de permisos)

---

## 🎯 Solución: Aplicar 2 Migraciones en Supabase Dashboard

**URL del SQL Editor**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

---

## Migración 1: Fix de INSERT Policy (Para Registro de Usuarios)

### Copia y pega este SQL completo:

\`\`\`sql
-- ============================================================================
-- FIX 1: Add INSERT policy for profiles table
-- ============================================================================
-- Permite que usuarios puedan crear su propio perfil al registrarse
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
\`\`\`

### ✅ Click en "Run"

---

## Migración 2: Fix de Acceso de Sales a sus Leads

Este es el archivo completo que ya existe en:
`supabase/migrations/20251203000000_remove_asesor_autorizado_constraint_global.sql`

### Forma más fácil de aplicarlo:

1. **Abre el archivo**: `supabase/migrations/20251203000000_remove_asesor_autorizado_constraint_global.sql`
2. **Copia TODO el contenido** (todas las 529 líneas)
3. **Pégalo en el SQL Editor** de Supabase
4. **Click en "Run"**

---

## 🧪 Verificar que Funcionó

### Test 1: Registro de Usuarios

1. Ve a: http://localhost:5173/financiamientos
2. Completa el formulario con un nuevo email y teléfono
3. Verifica el código SMS
4. ✅ Debe completarse sin error de RLS

### Test 2: Acceso de Sales a Leads

1. Inicia sesión como un usuario con role `sales`
2. Ve a cualquier ruta `/escritorio/ventas/...`
3. ✅ Debe ver sus leads asignados sin error

---

## 📊 Verificar Políticas Creadas

Después de aplicar las migraciones, ejecuta este SQL para verificar:

\`\`\`sql
-- Verificar política de INSERT
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'profiles_insert';

-- Verificar políticas de SELECT para sales
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'profiles_select';
\`\`\`

**Resultado esperado**:

\`\`\`
profiles_insert    | {authenticated,anon} | INSERT
profiles_select    | {authenticated}      | SELECT
\`\`\`

---

## 🔍 Qué Hacen estas Migraciones

### Migración 1 (INSERT Policy):
- Permite que usuarios **creen su propio perfil** durante el registro
- Soluciona el error: "new row violates row-level security policy"
- Afecta: Registro desde /financiamientos, /registro

### Migración 2 (Sales Access):
- **Remueve** el constraint `asesor_autorizado_acceso` de todas las políticas y funciones
- Sales ahora pueden ver **TODOS sus leads asignados** (donde `asesor_asignado_id = sales_user_id`)
- Actualiza 7 políticas RLS
- Actualiza 4 funciones RPC
- Soluciona el error: "Error al cargar leads, verifica tus permisos"

---

## ⚠️ Si Algo Sale Mal

Si después de aplicar las migraciones hay errores:

### Rollback de Migración 1:
\`\`\`sql
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
\`\`\`

### Rollback de Migración 2:
Esto es más complejo porque actualiza muchas políticas. Si necesitas revertir, avísame y te ayudo.

---

## 📁 Archivos de Migración

- ✅ `supabase/migrations/20251203140000_fix_profiles_insert_policy.sql`
- ✅ `supabase/migrations/20251203000000_remove_asesor_autorizado_constraint_global.sql`
- ✅ `supabase/migrations/20251203200000_create_sms_otp_system.sql` (Ya aplicada)

---

## 🚀 Después de Aplicar

Una vez aplicadas ambas migraciones:

1. ✅ Los usuarios pueden registrarse desde /financiamientos
2. ✅ Los asesores ven todos sus leads asignados
3. ✅ Los asesores pueden acceder a todas las rutas `/escritorio/ventas/...`
4. ✅ El sistema de SMS OTP funciona completamente

---

## 💡 Tip

Si tienes muchos asesores quejándose de falta de acceso, **la Migración 2 es LA PRIORIDAD**.

Si tienes usuarios que no pueden registrarse, **la Migración 1 es LA PRIORIDAD**.

**Recomendación**: Aplica AMBAS ahora para resolver ambos problemas.
