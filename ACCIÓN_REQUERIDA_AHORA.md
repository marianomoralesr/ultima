# 🚨 ACCIÓN REQUERIDA: Sales NO Pueden Ver Sus Leads

## ⚡ Resumen Ejecutivo

Has aplicado las migraciones, pero los asesores con `role = 'sales'` aún NO pueden ver sus leads asignados.

**Necesito que ejecutes 1 query de verificación** para diagnosticar exactamente cuál es el problema.

---

## 📋 PASO 1: Ejecuta Este Query de Verificación

**Abre**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

**Copia y pega EXACTAMENTE esto**:

```sql
-- ============================================================================
-- VERIFICACIÓN RÁPIDA: ¿Las migraciones se aplicaron correctamente?
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
  policyname,
  CASE
    WHEN pg_get_expr(qual, polrelid) LIKE '%asesor_autorizado_acceso%' THEN '❌ SÍ CONTIENE (PROBLEMA)'
    ELSE '✅ NO CONTIENE (CORRECTO)'
  END as tiene_constraint_problematico
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'profiles'
  AND policyname = 'profiles_select';

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
```

**Click en "Run"**

---

## 📊 Interpreta el Resultado

### Resultado A: TODO CORRECTO
```
✅ profiles_insert EXISTE
✅ NO CONTIENE (CORRECTO)
✅ No hay leads bloqueados
```

**Significado**: Las migraciones se aplicaron correctamente, pero el problema está en otra parte.

**Próxima acción**: Ejecuta el archivo `DIAGNOSTICO_SALES_ACCESS.sql` completo y comparte el resultado.

---

### Resultado B: FALTA profiles_insert
```
❌ profiles_insert NO EXISTE
❌ o ✅ (cualquiera)
⚠️ (cualquier número)
```

**Significado**: La migración 1 NO se aplicó.

**Próxima acción**: Ejecuta este SQL:

```sql
-- FIX: Crear profiles_insert
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT TO authenticated, anon
WITH CHECK (
  id = auth.uid()
  OR
  get_my_role() = 'admin'
  OR
  get_my_role() = 'marketing'
);

SELECT 'profiles_insert creada correctamente' as resultado;
```

---

### Resultado C: CONTIENE asesor_autorizado_acceso
```
✅ o ❌ (cualquiera)
❌ SÍ CONTIENE (PROBLEMA)
⚠️ (cualquier número)
```

**Significado**: La migración 2 NO se aplicó o se aplicó incorrectamente.

**Próxima acción**: Ejecuta el script del **Paso 2A** que está en el archivo `SOLUCIÓN_SALES_NO_VEN_LEADS.md`

O directamente ejecuta el archivo completo:

```
supabase/migrations/20251203000000_remove_asesor_autorizado_constraint_global.sql
```

---

### Resultado D: TODO MAL
```
❌ profiles_insert NO EXISTE
❌ SÍ CONTIENE (PROBLEMA)
⚠️ Hay X leads sin autorización
```

**Significado**: NINGUNA migración se aplicó correctamente.

**Próxima acción**: Necesitas aplicar ambas migraciones completas. Lee el archivo:

```
RESOLVER_DEADLOCK_Y_APLICAR_MIGRACIONES.md
```

---

## 🎯 Qué Esperar Después de la Fix

Una vez aplicadas las correcciones:

1. **Usuarios pueden registrarse** desde `/financiamientos` sin error RLS
2. **Asesores con role='sales' ven TODOS sus leads** donde `asesor_asignado_id = sales_user_id`
3. **Asesores pueden acceder** a `/escritorio/ventas/crm` y todas las subrutas
4. **Asesores pueden hacer SELECT, INSERT, UPDATE** en:
   - `profiles` (sus leads asignados)
   - `financing_applications` (aplicaciones de sus leads)
   - `uploaded_documents` (documentos de sus leads)
   - `bank_profiles` (perfiles bancarios de sus leads)

---

## 📞 Próximo Paso

1. **Ejecuta el query de verificación** (PASO 1 arriba)
2. **Comparte el resultado** que veas en pantalla
3. **Sigue la acción** correspondiente según el resultado (A, B, C, o D)

**Tiempo estimado**: 2-3 minutos

---

## 📁 Archivos de Ayuda Disponibles

1. **SOLUCIÓN_SALES_NO_VEN_LEADS.md** ← **COMPLETO con Paso 2A**
2. **VERIFICAR_TODAS_LAS_POLITICAS.sql** ← Verificación detallada
3. **DIAGNOSTICO_SALES_ACCESS.sql** ← Diagnóstico profundo
4. **RESOLVER_DEADLOCK_Y_APLICAR_MIGRACIONES.md** ← Si hay deadlock
5. **APLICAR_MIGRACIONES_MANUAL.md** ← Guía original

---

## 🔧 Ejemplo de Salida Real

Así es como se verá el resultado del query:

```
┌──────────────────────────────────────────────┐
│ estado_insert                                 │
├──────────────────────────────────────────────┤
│ ✅ profiles_insert EXISTE                    │
└──────────────────────────────────────────────┘

┌───────────────────┬────────────────────────────┐
│ policyname        │ tiene_constraint_problema  │
├───────────────────┼────────────────────────────┤
│ profiles_select   │ ✅ NO CONTIENE (CORRECTO) │
└───────────────────┴────────────────────────────┘

┌────────────────────────┬──────────────────────────┐
│ leads_sin_autorizacion │ diagnostico              │
├────────────────────────┼──────────────────────────┤
│ 0                      │ ✅ No hay leads bloqueados│
└────────────────────────┴──────────────────────────┘
```

Si ves ✅ en TODO, el problema está en otra capa y necesito más información.

Si ves ❌ en alguno, sigue la acción correspondiente arriba.
