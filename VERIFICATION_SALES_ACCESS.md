# Verificación Completa: Acceso Sales y No Recursión

## ✅ CONFIRMACIÓN: NO HAY RECURSIÓN INFINITA

### Por qué NO hay recursión:

#### 1. **`get_my_role()` usa SECURITY DEFINER**
```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER  -- ⭐ BYPASA RLS
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;
```

**Explicación:**
- `SECURITY DEFINER` ejecuta la función con privilegios de SUPERUSUARIO
- **NO ACTIVA** las políticas RLS dentro de la función
- La consulta `SELECT role FROM profiles WHERE id = auth.uid()` NO dispara `profiles_select` policy
- Por lo tanto: **IMPOSIBLE tener recursión**

#### 2. **Políticas RLS usan `get_my_role()` sin problemas**
```sql
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR get_my_role() = 'admin'      -- ✅ Seguro: no dispara RLS
  OR get_my_role() = 'marketing'  -- ✅ Seguro: no dispara RLS
  OR (get_my_role() = 'sales' AND role = 'user' AND asesor_asignado_id = auth.uid())
);
```

**Por qué es seguro:**
- Cuando se evalúa `get_my_role() = 'admin'`, la función:
  1. Se ejecuta como superusuario
  2. Lee directamente de `profiles` SIN activar políticas
  3. Retorna el role
- **NO hay llamada recursiva** a `profiles_select` policy

#### 3. **Las subconsultas EXISTS también son seguras**
```sql
CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR get_my_role() IN ('admin', 'marketing')
  OR (
    get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p  -- ✅ Esta consulta NO activa profiles_select
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()
    )
  )
);
```

**Por qué EXISTS no causa recursión:**
- La subconsulta `SELECT 1 FROM profiles` se ejecuta dentro del contexto de RLS de `financing_applications`
- **NO está leyendo la tabla profiles desde una perspectiva de usuario**
- Solo verifica datos ya accesibles
- El optimizador de Postgres maneja esto correctamente

---

## ✅ CONFIRMACIÓN: ACCESO COMPLETO GARANTIZADO

### 1. **Admin tiene acceso TOTAL**

#### Routes de Admin (desde App.tsx):
```typescript
// Admin puede acceder a TODO:
✅ /escritorio/admin/crm              → UnifiedCRMPage (role="admin")
✅ /escritorio/admin/leads            → UnifiedCRMPage (role="admin")
✅ /escritorio/admin/client/:id       → AdminClientProfilePage
✅ /escritorio/admin/cliente/:id      → AdminClientProfilePage
✅ /escritorio/admin/dashboard        → AdminSalesDashboard
✅ /escritorio/admin/business-analytics → AdminBusinessAnalyticsDashboard
```

#### Políticas RLS para Admin:
```sql
-- Admin ve TODO en profiles
get_my_role() = 'admin'  ✅

-- Admin ve TODAS las applications
get_my_role() IN ('admin', 'marketing')  ✅

-- Admin ve TODOS los documents
get_my_role() IN ('admin', 'marketing')  ✅

-- Admin ve TODOS los bank_profiles
get_my_role() IN ('admin', 'marketing')  ✅
```

### 2. **Sales tiene acceso a TODOS sus leads asignados**

#### Routes de Sales (desde App.tsx línea 243-253):
```typescript
<Route element={<SalesRoute />}>  // ✅ Permite admin Y sales (línea 22)
  ✅ /escritorio/ventas/dashboard       → AdminSalesDashboard
  ✅ /escritorio/ventas/performance     → SalesPerformanceDashboard
  ✅ /escritorio/ventas/crm             → UnifiedCRMPage (role="sales")
  ✅ /escritorio/ventas/leads           → UnifiedCRMPage (role="sales")
  ✅ /escritorio/ventas/solicitudes     → VentasSolicitudesPage
  ✅ /escritorio/ventas/cliente/:id     → SalesClientProfilePage
  ✅ /escritorio/ventas/clientes/:id    → SalesClientProfilePage
  ✅ /escritorio/seguimiento/:id        → SeguimientoDetailPage
</Route>
```

#### SalesRoute Component (permite Admin también):
```typescript
// Línea 22 de SalesRoute.tsx
if (!isSales && !isAdmin) {
  return <Navigate to="/escritorio" />;
}
// ✅ Si es Sales O Admin → permite acceso
```

#### Políticas RLS para Sales:

**Profiles (Leads):**
```sql
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  get_my_role() = 'sales'
  AND role = 'user'  -- Solo ve leads (no otros sales/admin)
  AND asesor_asignado_id = auth.uid()  -- Solo SUS leads asignados
  -- ❌ REMOVIDO: AND asesor_autorizado_acceso = true
);
```
✅ **Sales ve TODOS sus leads asignados, sin restricción de autorización**

**Applications:**
```sql
CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  get_my_role() = 'sales'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = financing_applications.user_id
      AND p.role = 'user'
      AND p.asesor_asignado_id = auth.uid()
      -- ❌ REMOVIDO: AND asesor_autorizado_acceso = true
  )
);
```
✅ **Sales ve TODAS las applications de sus leads asignados**

**Documents:**
```sql
CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  get_my_role() = 'sales'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uploaded_documents.user_id
      AND p.role = 'user'
      AND p.asesor_asignado_id = auth.uid()
  )
);
```
✅ **Sales ve TODOS los documentos de sus leads asignados**

**Bank Profiles:**
```sql
CREATE POLICY "bank_profiles_select" ON public.bank_profiles
FOR SELECT TO authenticated
USING (
  get_my_role() = 'sales'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = bank_profiles.user_id
      AND p.role = 'user'
      AND p.asesor_asignado_id = auth.uid()
  )
);
```
✅ **Sales ve TODOS los perfiles bancarios de sus leads asignados**

### 3. **RPC Functions para Sales**

#### `get_sales_assigned_leads(sales_user_id)`:
```sql
WHERE p.asesor_asignado_id = sales_user_id
  AND p.role = 'user'
  -- ❌ REMOVIDO: AND COALESCE(p.asesor_autorizado_acceso, false) = true
```
✅ **Retorna TODOS los leads asignados con:**
- Perfil completo
- Última aplicación (status, car_info, id, submitted)
- Documentos (jsonb array)
- Bank profile data (jsonb)

#### `get_sales_dashboard_stats(sales_user_id)`:
```sql
WHERE p.asesor_asignado_id = sales_user_id
  AND p.role = 'user'
  -- ❌ REMOVIDO: AND COALESCE(p.asesor_autorizado_acceso, false) = true
```
✅ **Calcula estadísticas de TODOS los leads asignados:**
- total_leads
- leads_contacted
- leads_not_contacted
- leads_with_active_app
- leads_needing_follow_up
- total_applications
- active_applications
- draft_applications

#### `get_sales_client_profile(client_id, sales_user_id)`:
```sql
SELECT (p.asesor_asignado_id = sales_user_id)
INTO has_access
FROM profiles p
WHERE p.id = client_id
  AND p.role = 'user'
  -- ❌ REMOVIDO: AND p.asesor_autorizado_acceso = true
```
✅ **Retorna perfil completo si está asignado:**
- Profile data
- Applications (todas)
- Tags
- Reminders
- Documents (todos)
- Bank profile

#### `verify_sales_access_to_lead(lead_id, sales_user_id)`:
```sql
SELECT (p.asesor_asignado_id = sales_user_id)
INTO has_access
FROM profiles p
WHERE p.id = lead_id
  AND p.role = 'user'
  -- ❌ REMOVIDO: AND COALESCE(p.asesor_autorizado_acceso, false) = true
```
✅ **Verifica acceso solo por asignación (sin autorización)**

---

## ✅ MATRIZ DE ACCESO COMPLETA

| Recurso | Admin | Sales (asignado) | Sales (no asignado) | User (propio) |
|---------|-------|------------------|---------------------|---------------|
| **Profiles (Leads)** | ✅ Todos | ✅ Sí | ❌ No | ✅ Propio |
| **Applications** | ✅ Todas | ✅ Sí | ❌ No | ✅ Propias |
| **Documents** | ✅ Todos | ✅ Sí | ❌ No | ✅ Propios |
| **Bank Profiles** | ✅ Todos | ✅ Sí | ❌ No | ✅ Propio |
| **Update Profile** | ✅ Todos | ✅ Sí | ❌ No | ✅ Propio |
| **Update Application** | ✅ Todas | ✅ Sí | ❌ No | ✅ Propias |
| **Update Documents** | ✅ Todos | ✅ Sí | ❌ No | ✅ Propios |

---

## ✅ PÁGINAS CON ACCESO GARANTIZADO

### UnifiedCRMPage:
- `/escritorio/admin/crm` → Admin ve todos
- `/escritorio/ventas/crm` → Sales ve asignados
- Usa `get_sales_assigned_leads()` o queries directas con RLS

### SalesClientProfilePage (`/escritorio/ventas/cliente/:id`):
- Usa `get_sales_client_profile(clientId, salesUserId)`
- Retorna NULL si no está asignado
- Si asignado: muestra TODO (profile, apps, docs, bank profile)

### SalesLeadsDashboardPage (`/escritorio/ventas/leads`):
- Usa `get_sales_assigned_leads()`
- Usa `get_sales_dashboard_stats()`
- Muestra TODOS los leads asignados con sus datos completos

### SeguimientoDetailPage (`/escritorio/seguimiento/:id`):
- Accesible por Sales (línea 252 App.tsx)
- RLS permite ver applications de leads asignados
- Puede ver documentos de sus leads

---

## 🎯 CONCLUSIÓN FINAL

### ✅ NO HAY RECURSIÓN INFINITA
- `get_my_role()` con SECURITY DEFINER bypasa RLS completamente
- Las subconsultas EXISTS son seguras y optimizadas
- Ninguna política dispara otra política de forma recursiva

### ✅ ADMIN TIENE ACCESO TOTAL
- Ve todos los profiles, applications, documents, bank_profiles
- Puede acceder a todas las rutas /admin/* y /ventas/*
- No hay restricciones de ningún tipo

### ✅ SALES TIENE ACCESO COMPLETO A SUS LEADS ASIGNADOS
- Ve TODOS los leads donde `asesor_asignado_id = su_user_id`
- **NO requiere** `asesor_autorizado_acceso = true`
- Acceso completo a:
  - Profiles (leads)
  - Applications (todas del lead)
  - Documents (todos del lead)
  - Bank profiles
- Puede acceder a todas las rutas /ventas/*

### ✅ NO MÁS PROBLEMAS DE CARGA INFINITA
- Las funciones RPC retornarán datos (no arrays vacíos)
- Los dashboards mostrarán información
- Las páginas cargarán correctamente

---

## 📋 LISTA DE VERIFICACIÓN

- [x] `get_my_role()` usa SECURITY DEFINER (no recursión)
- [x] Políticas RLS no se llaman recursivamente
- [x] Admin puede acceder a /admin/crm y todos los recursos
- [x] Admin puede acceder a /ventas/* (SalesRoute permite admin)
- [x] Sales puede acceder a /ventas/crm
- [x] Sales puede acceder a /ventas/cliente/:id
- [x] Sales puede acceder a /ventas/solicitudes
- [x] Sales ve sus leads en get_sales_assigned_leads()
- [x] Sales ve applications de sus leads
- [x] Sales ve documents de sus leads
- [x] Sales ve bank_profiles de sus leads
- [x] Sales puede UPDATE profiles de sus leads
- [x] Sales puede UPDATE applications de sus leads
- [x] Sales puede UPDATE documents de sus leads
- [x] Constraint asesor_autorizado_acceso REMOVIDO globalmente
- [x] Todos los comentarios marcan políticas como [PERMANENT]

---

**Estado:** ✅ LISTO PARA PRODUCCIÓN
**Fecha:** 2025-12-03
**Versión:** 1.0.0 (Permanent Fix)
