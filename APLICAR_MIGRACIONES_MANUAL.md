# 🚨 Guía Rápida: Aplicar Migraciones RLS (5 minutos)

## ❌ Problema Actual

Los asesores ven este error: **"No se pudieron cargar los leads asignados. Verifica tus permisos"**

**Causa**: Las políticas RLS en la base de datos NO se han actualizado todavía.

---

## ✅ Solución: 2 Pasos Simples

### 📍 Paso 1: Abrir SQL Editor de Supabase

Ve a: **https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new**

---

### 📍 Paso 2A: Aplicar Migración 1 (Fix INSERT - Para Registro)

**Copia y pega este SQL completo** en el SQL Editor:

```sql
-- ============================================================================
-- MIGRACIÓN 1: Fix de INSERT Policy
-- ============================================================================

BEGIN;

-- Drop existing INSERT policy if any
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

-- Create INSERT policy for users creating their own profile
CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT TO authenticated, anon
WITH CHECK (
  id = auth.uid()
  OR
  get_my_role() = 'admin'
  OR
  get_my_role() = 'marketing'
);

COMMENT ON POLICY "profiles_insert" ON public.profiles IS
'Allow users to create their own profile, admins and marketing can create any profile';

COMMIT;

-- Verificar
SELECT '✅ profiles_insert creada' as resultado
FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'profiles_insert';
```

**Haz click en "Run"** (botón verde abajo a la derecha)

**⏸️ ESPERA 10 SEGUNDOS** antes de continuar

---

### 📍 Paso 2B: Aplicar Migración 2 (Fix Sales Access)

Esta es la migración crítica que permite a los asesores ver sus leads.

**Opción Fácil**: Copia TODO el contenido del archivo:
```
supabase/migrations/20251203000000_remove_asesor_autorizado_constraint_global.sql
```

Y pégalo en el SQL Editor, luego haz click en "Run".

**Opción Alternativa**: Si el archivo es muy grande, te lo divido en partes más pequeñas. Avísame.

---

## 🧪 Verificar que Funcionó

### Test 1: Registro de Usuarios
1. Ve a: http://localhost:5173/financiamientos
2. Registra un usuario nuevo
3. ✅ Debe completarse sin error RLS

### Test 2: Acceso de Sales
1. Inicia sesión como asesor (sales)
2. Ve a: `/escritorio/ventas/crm`
3. ✅ Debe ver todos sus leads asignados sin error

---

## 🔍 Script de Verificación (Opcional)

Si quieres ver el estado actual de las políticas antes de aplicar las migraciones, ejecuta:

```bash
# Desde la raíz del proyecto
cat VERIFICAR_ESTADO_RLS.sql
```

Luego copia el contenido y ejecútalo en el SQL Editor de Supabase.

---

## 📊 Qué Hace Cada Migración

### Migración 1 (profiles_insert):
- ✅ Permite que usuarios creen su propio perfil durante registro
- ✅ Soluciona: "new row violates row-level security policy"

### Migración 2 (remove_asesor_autorizado_constraint):
- ✅ Remueve el check de `asesor_autorizado_acceso` de todas las políticas
- ✅ Sales pueden ver TODOS sus leads donde `asesor_asignado_id = sales_user_id`
- ✅ Actualiza 7 políticas RLS + 4 funciones RPC
- ✅ Soluciona: "No se pudieron cargar los leads asignados"

---

## ⚠️ Importante

- **NO cierres** el SQL Editor mientras se ejecutan las migraciones
- **ESPERA** a que aparezca el mensaje "Success" después de cada migración
- Si hay error de deadlock, consulta: `RESOLVER_DEADLOCK_Y_APLICAR_MIGRACIONES.md`

---

## 🆘 Si Necesitas Ayuda

Si algo falla, comparte:
1. El mensaje de error completo
2. Qué migración estabas aplicando
3. El resultado del script `VERIFICAR_ESTADO_RLS.sql`
