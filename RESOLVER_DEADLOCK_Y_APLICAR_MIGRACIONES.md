# 🔒 Resolver Deadlock y Aplicar Migraciones

## ❌ Error Actual

```
ERROR: 40P01: deadlock detected
Process waits for AccessExclusiveLock on relation blocked by another process
```

## 🔍 Causa

Hay **múltiples conexiones/procesos** intentando modificar las políticas RLS al mismo tiempo, causando un deadlock.

---

## ✅ Solución en 3 Pasos

### Paso 1: Terminar Todas las Conexiones Activas

Ve al SQL Editor de Supabase y ejecuta:

```sql
-- Terminar todas las conexiones activas (excepto la tuya)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND datname = current_database()
  AND state = 'active'
  AND query NOT LIKE '%pg_stat_activity%';

-- Verificar que no queden conexiones bloqueadas
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE datname = current_database()
  AND state IN ('active', 'idle in transaction');
```

**Resultado esperado**: Deberías ver solo tu propia conexión activa.

---

### Paso 2: Aplicar Migraciones UNA POR UNA (con espera entre cada una)

#### 2.1 Primera Migración: Fix de INSERT Policy

```sql
-- ============================================
-- MIGRACIÓN 1: Fix de INSERT Policy
-- ============================================

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

-- Verificar que se creó
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'profiles_insert';
```

**⏸️ ESPERA 10 SEGUNDOS** antes de continuar

---

#### 2.2 Segunda Migración: Parte 1 - Políticas de Profiles

```sql
-- ============================================
-- MIGRACIÓN 2 - PARTE 1: Políticas de Profiles
-- ============================================

BEGIN;

-- Profiles: Sales can see their assigned leads without authorization check
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
  )
);

COMMENT ON POLICY "profiles_select" ON public.profiles IS
'[PERMANENT] Sales see assigned leads WITHOUT asesor_autorizado_acceso constraint';

COMMIT;
```

**⏸️ ESPERA 10 SEGUNDOS**

---

#### 2.3 Segunda Migración: Parte 2 - Update Policy

```sql
-- ============================================
-- MIGRACIÓN 2 - PARTE 2: Update Policy
-- ============================================

BEGIN;

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

COMMENT ON POLICY "profiles_update" ON public.profiles IS
'[PERMANENT] Sales update assigned leads WITHOUT asesor_autorizado_acceso constraint';

COMMIT;
```

**⏸️ ESPERA 10 SEGUNDOS**

---

#### 2.4 Segunda Migración: Parte 3 - Financing Applications

```sql
-- ============================================
-- MIGRACIÓN 2 - PARTE 3: Financing Applications
-- ============================================

BEGIN;

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
    )
  )
);

COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'[PERMANENT] Sales see applications from assigned leads WITHOUT authorization constraint';

COMMIT;
```

**⏸️ ESPERA 10 SEGUNDOS**

---

#### 2.5 Segunda Migración: Parte 4 - Update Applications

```sql
-- ============================================
-- MIGRACIÓN 2 - PARTE 4: Update Applications
-- ============================================

BEGIN;

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

COMMENT ON POLICY "financing_apps_update" ON public.financing_applications IS
'[PERMANENT] Sales update applications from assigned leads WITHOUT authorization constraint';

COMMIT;
```

**⏸️ ESPERA 10 SEGUNDOS**

---

#### 2.6 Segunda Migración: Parte 5 - Documents Policies

```sql
-- ============================================
-- MIGRACIÓN 2 - PARTE 5: Documents Policies
-- ============================================

BEGIN;

DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents
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
      WHERE p.id = uploaded_documents.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "uploaded_documents_select" ON public.uploaded_documents IS
'[PERMANENT] Sales see documents from assigned leads WITHOUT authorization constraint';

DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
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
      WHERE p.id = uploaded_documents.user_id
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
      WHERE p.id = uploaded_documents.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "uploaded_documents_update" ON public.uploaded_documents IS
'[PERMANENT] Sales update documents from assigned leads WITHOUT authorization constraint';

COMMIT;
```

**⏸️ ESPERA 10 SEGUNDOS**

---

#### 2.7 Segunda Migración: Parte 6 - Bank Profiles

```sql
-- ============================================
-- MIGRACIÓN 2 - PARTE 6: Bank Profiles
-- ============================================

BEGIN;

DROP POLICY IF EXISTS "bank_profiles_select" ON public.bank_profiles;

CREATE POLICY "bank_profiles_select" ON public.bank_profiles
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
      WHERE p.id = bank_profiles.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "bank_profiles_select" ON public.bank_profiles IS
'[PERMANENT] Sales see bank profiles from assigned leads WITHOUT authorization constraint';

COMMIT;
```

---

### Paso 3: Verificar que TODO se Aplicó Correctamente

```sql
-- Verificar todas las políticas creadas
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'financing_applications', 'uploaded_documents', 'bank_profiles')
ORDER BY tablename, policyname;
```

**Resultado esperado**: Deberías ver todas estas políticas:
- `profiles_insert`
- `profiles_select`
- `profiles_update`
- `financing_apps_select`
- `financing_apps_update`
- `uploaded_documents_select`
- `uploaded_documents_update`
- `bank_profiles_select`

---

## 🧪 Probar que Funciona

### Test 1: Registro de Usuario
1. Ve a `/financiamientos`
2. Registra un usuario nuevo
3. ✅ Debe completarse sin error RLS

### Test 2: Acceso de Sales
1. Inicia sesión como asesor (sales)
2. Ve a `/escritorio/ventas/crm`
3. ✅ Debe ver todos sus leads asignados

---

## 🔧 Si el Deadlock Persiste

Si aún hay deadlock después del Paso 1:

1. **Cierra TODAS las pestañas** del Supabase Dashboard
2. **Espera 30 segundos**
3. **Abre UNA SOLA pestaña** del SQL Editor
4. **Aplica las migraciones una por una** con las esperas indicadas

---

## ⚠️ Importante

- **NO ejecutes** todo el SQL de una vez
- **ESPERA** entre cada migración para evitar deadlocks
- **VERIFICA** después de cada parte que se aplicó correctamente
- Si algo falla, avísame qué parte específicamente falló

---

## 📝 Orden de Ejecución

1. ✅ Terminar conexiones activas (Paso 1)
2. ⏸️ Esperar 10 segundos
3. ✅ Migración 1 (INSERT policy)
4. ⏸️ Esperar 10 segundos
5. ✅ Migración 2 Parte 1 (profiles_select)
6. ⏸️ Esperar 10 segundos
7. ✅ Migración 2 Parte 2 (profiles_update)
8. ⏸️ Esperar 10 segundos
9. ✅ Migración 2 Parte 3 (financing_apps_select)
10. ⏸️ Esperar 10 segundos
11. ✅ Migración 2 Parte 4 (financing_apps_update)
12. ⏸️ Esperar 10 segundos
13. ✅ Migración 2 Parte 5 (documents policies)
14. ⏸️ Esperar 10 segundos
15. ✅ Migración 2 Parte 6 (bank_profiles)
16. ✅ Verificar (Paso 3)

**Tiempo total estimado**: ~2 minutos
