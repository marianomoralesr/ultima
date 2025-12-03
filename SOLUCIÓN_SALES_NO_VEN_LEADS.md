# 🚨 Solución: Sales NO Pueden Ver Sus Leads

## 🔍 Diagnóstico

Aplicaste las migraciones RLS, pero los asesores (role: 'sales') aún ven el error:
```
"No se pudieron cargar los leads asignados. Verifica tus permisos."
```

## 🎯 Problema Identificado

Hay **3 posibles causas**:

### Causa 1: Migraciones NO se aplicaron correctamente
- Las políticas RLS todavía tienen el constraint `asesor_autorizado_acceso`
- La política `profiles_insert` no existe

### Causa 2: La función `get_leads_for_dashboard()` NO fue actualizada
- La función sigue usando lógica antigua
- Las funciones RPC no se recrearon

### Causa 3: Sales users tienen `asesor_autorizado_acceso = false` en sus leads
- Aunque las políticas se actualizaron, los datos tienen el flag en false
- Necesitas actualizar el campo o ignorarlo completamente

---

## ✅ SOLUCIÓN PASO A PASO

### **Paso 1: Verificar Estado Actual**

Ejecuta este query en Supabase Dashboard SQL Editor:

```sql
-- Ver si profiles_insert existe
SELECT COUNT(*) as existe_insert_policy
FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'profiles_insert';

-- Ver si profiles_select contiene asesor_autorizado_acceso
SELECT
  policyname,
  CASE
    WHEN pg_get_expr(qual, polrelid) LIKE '%asesor_autorizado_acceso%' THEN 'SÍ - PROBLEMA'
    ELSE 'NO - OK'
  END as contiene_constraint
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'profiles'
  AND policyname = 'profiles_select';
```

**Resultado esperado**:
- `existe_insert_policy`: **1** (si es 0, falta la migración)
- `contiene_constraint`: **'NO - OK'** (si es 'SÍ - PROBLEMA', falta la migración)

---

### **Paso 2A: Si las Migraciones NO se Aplicaron**

Si el resultado del Paso 1 muestra problemas, ejecuta:

```sql
-- ============================================================================
-- FIX RÁPIDO: Aplicar políticas corregidas
-- ============================================================================

BEGIN;

-- 1. Fix INSERT policy
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

-- 2. Fix SELECT policy (remover asesor_autorizado_acceso)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR
  get_my_role() = 'admin'
  OR
  get_my_role() = 'marketing'
  OR
  (
    get_my_role() = 'sales'
    AND role = 'user'
    AND asesor_asignado_id = auth.uid()
    -- NO asesor_autorizado_acceso check
  )
);

-- 3. Fix UPDATE policy
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND role = 'user'
    AND asesor_asignado_id = auth.uid()
  )
)
WITH CHECK (
  id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND role = 'user'
    AND asesor_asignado_id = auth.uid()
  )
);

-- 4. Fix financing_applications SELECT policy
DROP POLICY IF EXISTS "financing_apps_select" ON public.financing_applications;

CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
        -- NO asesor_autorizado_acceso check
    )
  )
);

-- 5. Fix financing_applications UPDATE policy
DROP POLICY IF EXISTS "financing_apps_update" ON public.financing_applications;

CREATE POLICY "financing_apps_update"
ON public.financing_applications
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  get_my_role() IN ('admin', 'marketing')
  OR
  (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

COMMIT;

-- Verificar
SELECT 'Políticas actualizadas correctamente' as resultado;
```

---

### **Paso 2B: Si las Migraciones SÍ se Aplicaron Pero Aún No Funciona**

Entonces el problema está en **otra capa**. Ejecuta estos queries de diagnóstico:

```sql
-- Ver si hay leads asignados a sales sin autorización
SELECT
  COUNT(*) as total_leads_sin_autorizacion
FROM profiles
WHERE role = 'user'
  AND asesor_asignado_id IS NOT NULL
  AND (asesor_autorizado_acceso = false OR asesor_autorizado_acceso IS NULL);

-- Ver un ejemplo específico
SELECT
  p.id as lead_id,
  p.email as lead_email,
  p.asesor_asignado_id,
  p.asesor_autorizado_acceso,
  s.email as asesor_email,
  s.role as asesor_role
FROM profiles p
LEFT JOIN profiles s ON s.id = p.asesor_asignado_id
WHERE p.role = 'user'
  AND p.asesor_asignado_id IS NOT NULL
LIMIT 5;
```

Si ves que `asesor_autorizado_acceso = false` en muchos leads, eso NO debería ser un problema SI las políticas RLS se actualizaron correctamente (ya no verifican ese campo).

---

### **Paso 3: Verificar la Función get_leads_for_dashboard()**

```sql
-- Ver el código de la función
SELECT
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_leads_for_dashboard';
```

**Busca en el resultado**:
- Debe tener: `current_user_role = 'sales' AND p.asesor_asignado_id = current_user_id`
- NO debe tener: `asesor_autorizado_acceso`

Si la función tiene `asesor_autorizado_acceso`, necesitas actualizarla. Avísame y te doy el script.

---

### **Paso 4: Probar Acceso Directo Como Sales**

Para verificar que las políticas funcionan, necesitas probar como un usuario sales:

1. Inicia sesión como un usuario con role `sales` en tu aplicación
2. Ve a la consola del navegador
3. Ejecuta:

```javascript
// Test directo de políticas RLS
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'user')
  .limit(5);

console.log('Leads visibles:', data?.length);
console.log('Error:', error);
```

**Resultado esperado**:
- Si las políticas están bien: `data` contiene los leads asignados
- Si hay error: `error` muestra el código 42501 (RLS policy violation)

---

## 🧪 Script de Verificación Completo

Ejecuta este archivo para un diagnóstico completo:

```bash
# En el SQL Editor de Supabase Dashboard
cat VERIFICAR_TODAS_LAS_POLITICAS.sql
```

O:

```bash
cat DIAGNOSTICO_SALES_ACCESS.sql
```

---

## 📊 Checklist de Verificación

- [ ] `profiles_insert` existe (para registro de usuarios)
- [ ] `profiles_select` NO contiene `asesor_autorizado_acceso`
- [ ] `financing_apps_select` NO contiene `asesor_autorizado_acceso`
- [ ] La función `get_leads_for_dashboard()` NO verifica `asesor_autorizado_acceso`
- [ ] Sales users pueden ejecutar query directo a `profiles` table

---

## 🆘 Si Nada Funciona

Si después de aplicar el Paso 2A el problema persiste, ejecuta:

```sql
-- Ver logs de PostgreSQL (últimos errores)
SELECT
  log_time,
  message
FROM postgres_logs
WHERE message LIKE '%policy%'
  OR message LIKE '%permission%'
ORDER BY log_time DESC
LIMIT 20;
```

Y comparte:
1. El resultado del Paso 1 (verificación)
2. El error exacto de la consola del navegador
3. El resultado del test directo (Paso 4)

---

## 💡 Solución Rápida (Si tienes acceso admin)

Si tienes un usuario admin, puedes:

1. Asignar temporalmente el role 'admin' a un usuario sales
2. Verificar que como admin SÍ ve los leads
3. Si funciona como admin, confirma que el problema es RLS
4. Aplica el Paso 2A

```sql
-- Cambiar temporalmente a admin (para testing)
UPDATE profiles
SET role = 'admin'
WHERE email = 'email-del-asesor@example.com';

-- Después de probar, revertir
UPDATE profiles
SET role = 'sales'
WHERE email = 'email-del-asesor@example.com';
```

---

## 📝 Resumen

**Problema**: Sales users no ven sus leads asignados

**Causa probable**: Políticas RLS todavía tienen el constraint `asesor_autorizado_acceso`

**Solución**: Aplicar Paso 2A para actualizar políticas RLS

**Tiempo**: ~2 minutos

**Próximo paso**: Ejecuta el Paso 1 y comparte el resultado
