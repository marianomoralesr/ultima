# Sales Dashboard - Documentación

## Descripción General

El Sales Dashboard es una funcionalidad completa que permite a los usuarios con rol 'sales' (ventas) acceder y gestionar sus leads asignados de manera segura y eficiente.

## Características Principales

### 1. **Dashboard de Leads Asignados** (`/escritorio/ventas/leads`)
- Vista de todos los leads asignados al asesor de ventas
- Estadísticas en tiempo real:
  - Total de leads asignados
  - Leads con solicitud activa
  - Leads sin contactar
  - Leads que necesitan seguimiento
- Búsqueda por nombre, email o teléfono
- Filtros por:
  - Estado de contacto (Contactado/No contactado)
  - Estado de solicitud (Borrador, Enviada, En Revisión, etc.)

### 2. **Perfil de Cliente** (`/escritorio/ventas/cliente/:id`)
- Información completa del cliente (solo si `autorizar_asesor_acceso = true`)
- Gestión de etiquetas (tags)
- Gestión de recordatorios
- Historial de aplicaciones
- Visualización de documentos cargados
- Sincronización con Kommo CRM

### 3. **Seguridad y Autorización**

#### Verificaciones de Seguridad
Los asesores de ventas **SOLO** pueden acceder a leads que cumplan **AMBAS** condiciones:
1. `asesor_asignado_id` = ID del asesor
2. `autorizar_asesor_acceso` = `true`

#### Niveles de Protección
1. **Frontend**: Componente `SalesRoute` verifica rol antes de renderizar
2. **Backend**: Funciones RPC con `SECURITY DEFINER` verifican permisos
3. **Base de datos**: RLS policies (si están configuradas)

## Arquitectura

### Componentes Creados

#### 1. **SalesService** (`src/services/SalesService.ts`)
Servicio que maneja todas las operaciones relacionadas con ventas:

```typescript
// Obtener leads asignados
SalesService.getMyAssignedLeads(salesUserId: string)

// Obtener estadísticas
SalesService.getMyLeadsStats(salesUserId: string)

// Obtener perfil de cliente
SalesService.getClientProfile(clientId: string, salesUserId: string)

// Verificar acceso
SalesService.verify_sales_access_to_lead(leadId: string, salesUserId: string)

// Gestión de tags
SalesService.updateLeadTags(userId: string, tagIds: string[], salesUserId: string)

// Gestión de recordatorios
SalesService.createReminder(reminder: {...}, salesUserId: string)
SalesService.updateReminder(reminderId: string, updates: {...})
SalesService.deleteReminder(reminderId: string)
```

#### 2. **SalesLeadsDashboardPage** (`src/pages/SalesLeadsDashboardPage.tsx`)
Página principal del dashboard de ventas con:
- Tarjetas de estadísticas
- Tabla de leads con filtros y búsqueda
- Indicadores visuales de acceso autorizado
- Links condicionales basados en permisos

#### 3. **SalesClientProfilePage** (`src/pages/SalesClientProfilePage.tsx`)
Página de perfil individual del cliente con:
- Información del cliente
- Gestión de tags y recordatorios
- Historial de aplicaciones con cambio de estado
- Visualización de documentos
- Manejo de errores de acceso no autorizado

#### 4. **SalesRoute** (`src/components/SalesRoute.tsx`)
Guard de rutas que permite acceso a:
- Usuarios con rol `sales`
- Usuarios con rol `admin` (para supervisión)

### Funciones SQL/RPC

#### 1. **get_sales_assigned_leads(sales_user_id UUID)**
Retorna todos los leads asignados a un asesor específico.

**Retorna:**
- Información del perfil
- Estado de aplicación más reciente
- Información del vehículo de interés
- Estado de autorización de acceso

#### 2. **get_sales_dashboard_stats(sales_user_id UUID)**
Retorna estadísticas agregadas de los leads asignados.

**Retorna:**
- total_leads
- leads_with_active_app
- leads_not_contacted
- leads_needing_follow_up

#### 3. **get_sales_client_profile(client_id UUID, sales_user_id UUID)**
Retorna el perfil completo del cliente si el asesor tiene acceso autorizado.

**Retorna JSONB con:**
- profile
- applications
- tags
- reminders
- documents

**Retorna NULL si:**
- El asesor no está asignado al cliente
- `autorizar_asesor_acceso` es `false`

#### 4. **verify_sales_access_to_lead(lead_id UUID, sales_user_id UUID)**
Verifica si un asesor tiene acceso a un lead específico.

**Retorna:** `BOOLEAN`

## Rutas

### Accesibles por Sales y Admin

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/escritorio/ventas/leads` | `SalesLeadsDashboardPage` | Dashboard principal de ventas |
| `/escritorio/ventas/cliente/:id` | `SalesClientProfilePage` | Perfil individual del cliente |

## Flujo de Usuario (Sales)

### 1. Acceso al Dashboard
```
Usuario con rol 'sales' → /escritorio/ventas/leads
```

### 2. Vista de Leads
- El usuario ve solo sus leads asignados
- Puede filtrar y buscar
- Ve indicador de "Acceso Autorizado"

### 3. Acceso a Perfil
**Si `autorizar_asesor_acceso = true`:**
- Click en "Ver Perfil" → `/escritorio/ventas/cliente/:id`
- Acceso completo a información del cliente
- Puede gestionar tags y recordatorios
- Puede ver y actualizar estado de aplicaciones

**Si `autorizar_asesor_acceso = false`:**
- Botón muestra "Acceso Restringido"
- Si intenta acceder directamente a la URL:
  - Ve mensaje de "Acceso No Autorizado"
  - Opción para volver al dashboard

## Configuración de Base de Datos

### Migración Requerida
Ejecutar: `supabase/migrations/sales_dashboard_functions.sql`

### Campos Requeridos en `profiles`
```sql
- asesor_asignado_id: UUID (references profiles.id)
- autorizar_asesor_acceso: BOOLEAN (default: false)
- role: TEXT ('user' | 'sales' | 'admin')
- contactado: BOOLEAN
```

### Tablas Relacionadas
- `applications`: Solicitudes de financiamiento
- `lead_tags`: Catálogo de etiquetas
- `lead_tag_associations`: Asociación de tags con leads
- `lead_reminders`: Recordatorios para leads
- `documents`: Documentos cargados por clientes

## Permisos y Roles

### Rol: `sales`
**Puede:**
- Ver sus propios leads asignados
- Acceder a perfiles con `autorizar_asesor_acceso = true`
- Gestionar tags de sus leads
- Crear/editar/eliminar recordatorios de sus leads
- Actualizar estado de aplicaciones
- Sincronizar con Kommo

**NO puede:**
- Ver leads asignados a otros asesores
- Acceder a perfiles sin autorización
- Acceder a rutas `/admin/*`

### Rol: `admin`
**Puede:**
- Acceder a todas las rutas de sales (supervisión)
- Acceder a todas las rutas de admin
- Ver todos los leads sin restricciones

## Ejemplo de Uso

### Asignar Lead a Asesor (Admin)
```sql
UPDATE profiles
SET asesor_asignado_id = 'uuid-del-asesor'
WHERE id = 'uuid-del-cliente';
```

### Autorizar Acceso (Admin o Usuario)
```sql
UPDATE profiles
SET autorizar_asesor_acceso = true
WHERE id = 'uuid-del-cliente';
```

### Query de Verificación
```sql
-- Ver todos los leads de un asesor con acceso autorizado
SELECT
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.autorizar_asesor_acceso
FROM profiles p
WHERE p.asesor_asignado_id = 'uuid-del-asesor'
  AND p.autorizar_asesor_acceso = true;
```

## Manejo de Errores

### Escenarios Comunes

#### 1. Lead No Encontrado
- **Causa**: ID inválido o lead no existe
- **Respuesta**: Mensaje de error con link de retorno

#### 2. Acceso No Autorizado
- **Causa**: `autorizar_asesor_acceso = false`
- **Respuesta**: Mensaje explicativo + link de retorno

#### 3. Lead No Asignado
- **Causa**: `asesor_asignado_id` no coincide
- **Respuesta**: Acceso denegado

#### 4. Error de Permisos
- **Causa**: Usuario no es sales/admin
- **Respuesta**: Redirect a `/escritorio`

## Testing

### Casos de Prueba Recomendados

1. **Acceso con rol correcto**
   - Sales user ve solo sus leads
   - Admin ve todos los leads

2. **Filtros y búsqueda**
   - Búsqueda por nombre/email/teléfono funciona
   - Filtros de estado se aplican correctamente

3. **Autorización de acceso**
   - Leads con `autorizar_asesor_acceso = true` son accesibles
   - Leads con `autorizar_asesor_acceso = false` muestran restricción

4. **Gestión de tags**
   - Tags se guardan correctamente
   - Solo afectan al lead específico

5. **Gestión de recordatorios**
   - Creación de recordatorios funciona
   - Toggle de completado funciona
   - Eliminación funciona

## Consideraciones de Seguridad

1. **Nunca confiar en el frontend**
   - Todas las verificaciones críticas están en RPC functions
   - Frontend solo mejora UX

2. **Principio de mínimo privilegio**
   - Sales solo ve lo que necesita ver
   - Acceso explícito requerido (autorizar_asesor_acceso)

3. **Auditoría**
   - Todas las acciones usan user_id del contexto
   - RPC functions registran accesos

4. **Validación de entrada**
   - UUIDs validados antes de queries
   - Sanitización de inputs en búsqueda

## Roadmap / Mejoras Futuras

- [ ] Notificaciones push cuando un lead autoriza acceso
- [ ] Exportación de reporte de leads (CSV/PDF)
- [ ] Métricas de conversión por asesor
- [ ] Calendario integrado de recordatorios
- [ ] Chat integrado con clientes
- [ ] Historial de interacciones
- [ ] Asignación automática inteligente de leads
- [ ] Dashboard de performance individual

## Soporte

Para preguntas o issues relacionados con el Sales Dashboard:
1. Revisar esta documentación
2. Verificar logs en consola del navegador
3. Verificar logs de Supabase
4. Contactar al equipo de desarrollo
