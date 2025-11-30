# Rol de Marketing - Documentación

## Descripción General

Se ha creado un nuevo rol llamado `marketing` diseñado específicamente para demostración del sistema. Este rol tiene acceso a todas las herramientas de marketing y analytics, pero **NO tiene acceso a información sensible de clientes** como solicitudes de financiamiento, documentos subidos o perfiles bancarios.

## Características del Rol de Marketing

### ✅ Acceso Permitido

El rol de marketing tiene acceso a las siguientes secciones:

#### 1. **Marketing Hub** (`/escritorio/marketing`)
- Panel principal de marketing con métricas y herramientas

#### 2. **Analytics** (`/escritorio/marketing/analytics`)
- Analytics de marketing
- Visualización de datos agregados
- Métricas de rendimiento

#### 3. **Customer Journeys** (`/escritorio/marketing/customer-journeys`)
- Creación y gestión de customer journeys
- Visualización de flujos de usuarios
- Análisis de conversión

#### 4. **Landing Page Constructor** (`/escritorio/marketing/constructor`)
- Constructor de landing pages
- Edición de páginas de aterrizaje
- Gestión de contenido

#### 5. **Homepage Editor** (`/escritorio/marketing/homepage-editor`)
- Editor de homepage
- Gestión de contenido de la página principal

#### 6. **Marketing Config** (`/escritorio/marketing/config`)
- Configuración de herramientas de marketing
- Ajustes de campañas

#### 7. **CRM con Datos de Demostración** (`/escritorio/marketing/crm`)
- Vista de CRM con 20 leads de demostración
- Los datos son completamente ficticios (demo1@ejemplo.com, demo2@ejemplo.com, etc.)
- **NO muestra información real de clientes**

#### 8. **Documents Analytics** (`/escritorio/documentos-analytics`)
- Analytics de documentos cargados (agregados, sin información personal)

#### 9. **Todas las Páginas Públicas**
- Homepage
- FAQs
- Inventario de autos
- Páginas de marcas y categorías
- etc.

### ❌ Acceso Denegado

El rol de marketing **NO tiene acceso** a:

1. **CRM con Datos Reales** - No puede ver el CRM de admin o ventas con información real
2. **Solicitudes de Financiamiento** (`financing_applications`) - No puede ver las solicitudes de crédito de clientes
3. **Documentos Subidos** (`uploaded_documents`) - No puede acceder a documentos personales de clientes
4. **Perfiles Bancarios** (`bank_profiles`) - No puede ver perfiles de clientes para bancos
5. **Información Personal de otros usuarios** - Solo puede ver su propio perfil

## Implementación Técnica

### Base de Datos

#### 1. Enum de Roles Actualizado
```sql
CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin',
    'sales',
    'marketing'  -- Nuevo rol añadido
);
```

#### 2. Función de Verificación
```sql
CREATE FUNCTION public.is_marketing()
RETURNS BOOLEAN
```
Esta función verifica si el usuario actual tiene el rol de marketing.

#### 3. Políticas RLS (Row Level Security)

**Perfiles:**
- Los usuarios de marketing solo pueden ver y editar su propio perfil
- No pueden cambiar su rol

**Tablas Sensibles (Bloqueadas):**
- `financing_applications` - Completamente bloqueada
- `uploaded_documents` - Completamente bloqueada
- `bank_profiles` - Completamente bloqueada

**Tablas de Marketing (Acceso Completo):**
- `customer_journeys` - Ver y gestionar
- `marketing_landing_pages` - Ver y gestionar
- `custom_events` - Solo lectura
- `aggregated_metrics` - Solo lectura
- `anonymous_survey_responses` - Solo lectura
- `app_config` - Solo lectura
- `homepage_content` - Ver y gestionar

#### 4. Función de Datos Demo
```sql
CREATE FUNCTION public.get_marketing_dummy_leads()
```
Esta función retorna 20 leads ficticios para demostración del CRM.

### Frontend

#### 1. Actualización del AuthContext
```typescript
interface AuthContextType {
    // ...
    isMarketing: boolean;
    // ...
}
```

#### 2. Componente MarketingRoute
Nuevo componente de guard de rutas similar a `AdminRoute` y `SalesRoute`:
- Permite acceso solo a usuarios con rol `marketing` o `admin`
- Redirige a `/escritorio` si no se tiene permiso

#### 3. Navegación en Sidebar
- Nueva sección "Marketing" con icono morado
- Visible solo para usuarios con rol `marketing` o `admin`
- Incluye enlaces a todas las herramientas de marketing

#### 4. Rutas Protegidas
Nuevas rutas bajo `<MarketingRoute>`:
- `/escritorio/marketing/*`
- `/escritorio/documentos-analytics`

## Cómo Asignar el Rol de Marketing

### Opción 1: Manualmente en la Base de Datos
```sql
UPDATE public.profiles
SET role = 'marketing'
WHERE email = 'usuario@ejemplo.com';
```

### Opción 2: A través del Panel de Admin
(Si existe funcionalidad de gestión de usuarios)

## Casos de Uso

### Demo para Clientes Potenciales
- Mostrar capacidades de marketing sin exponer datos reales
- Demostrar customer journeys y analytics
- Presentar el constructor de landing pages

### Equipo de Marketing Interno
- Crear y gestionar campañas
- Analizar métricas agregadas
- Diseñar landing pages
- Sin riesgo de acceder a información sensible de clientes

### Pruebas y Desarrollo
- Probar funcionalidad de marketing sin afectar datos reales
- Desarrollar nuevas features de marketing de forma segura

## Migración Aplicada

Archivo: `supabase/migrations/20251129120000_add_marketing_role.sql`

Para aplicar la migración:
```bash
npx supabase db push --include-all
```

**Nota:** Si hay problemas con migraciones pendientes, contacta al equipo de desarrollo para resolverlos antes de aplicar esta migración.

## Verificación

Para verificar que el rol funciona correctamente:

1. **Crear un usuario de prueba con rol marketing:**
```sql
UPDATE public.profiles
SET role = 'marketing'
WHERE email = 'test-marketing@ejemplo.com';
```

2. **Iniciar sesión con ese usuario**

3. **Verificar acceso:**
   - ✅ Debe ver la sección "Marketing" en el sidebar
   - ✅ Debe poder acceder a `/escritorio/marketing`
   - ✅ Debe ver 20 leads ficticios en el CRM
   - ❌ NO debe poder acceder a datos reales de clientes
   - ❌ NO debe ver la sección "Asesores" o "Administración"

## Mantenimiento

### Agregar Nuevas Tablas de Marketing
Si se crea una nueva tabla para marketing:

```sql
CREATE POLICY "Marketing users can view [tabla]"
ON public.[tabla]
FOR SELECT
USING (public.is_marketing() OR public.get_my_role() = ANY(ARRAY['admin'::text]));
```

### Agregar Nuevas Rutas de Marketing
1. Agregar la ruta en `App.tsx` dentro del componente `<MarketingRoute>`
2. Agregar el enlace en `SidebarContent.tsx` en la sección de Marketing

## Seguridad

### Principios de Seguridad Implementados

1. **Deny by Default**: Las tablas sensibles tienen políticas explícitas de denegación para usuarios de marketing
2. **Least Privilege**: Los usuarios de marketing solo tienen los permisos mínimos necesarios
3. **Data Segregation**: Los datos de demostración están completamente separados de los datos reales
4. **Audit Trail**: Todas las políticas RLS son rastreables y auditables

### Consideraciones de Seguridad

⚠️ **IMPORTANTE**: Los usuarios de marketing **NO deben tener acceso al SQL directo** ni a herramientas de administración de base de datos.

⚠️ **IMPORTANTE**: Validar que ninguna función o endpoint de API devuelva accidentalmente datos sensibles a usuarios de marketing.

## Preguntas Frecuentes

### ¿Puede un usuario de marketing ver solicitudes reales de financiamiento?
**No.** El acceso está completamente bloqueado a nivel de base de datos mediante políticas RLS.

### ¿Los datos de demostración se guardan en la base de datos?
**No.** Los datos de demostración se generan dinámicamente mediante la función `get_marketing_dummy_leads()` y no persisten en la base de datos.

### ¿Puede un usuario de marketing cambiar su propio rol?
**No.** Las políticas RLS previenen que los usuarios de marketing modifiquen su propio rol.

### ¿Los usuarios admin pueden hacer lo mismo que los usuarios de marketing?
**Sí.** Los usuarios admin tienen acceso completo, incluyendo todas las funcionalidades de marketing.

## Soporte

Para reportar problemas o sugerencias sobre el rol de marketing:
- Contactar al equipo de desarrollo
- Abrir un issue en el repositorio del proyecto
