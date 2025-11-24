# 📊 Configuración de Marketing Tracking - GTM & Facebook Pixel

Esta documentación describe cómo configurar y usar el sistema de tracking de conversiones con **Google Tag Manager** y **Facebook Pixel** en tu aplicación.

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Uso de la Interfaz de Configuración](#uso-de-la-interfaz-de-configuración)
5. [Eventos Trackeados](#eventos-trackeados)
6. [Análisis de Fuentes de Leads](#análisis-de-fuentes-de-leads)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## 📖 Descripción General

El sistema de tracking integra tres plataformas:

1. **Google Tag Manager (GTM)** - Gestión centralizada de tags y eventos
2. **Facebook Pixel** - Tracking de conversiones para Facebook Ads
3. **Supabase Custom Tracking** - Almacenamiento de eventos en base de datos propia

### Características Principales

✅ **Configuración visual** - Interfaz gráfica para administrar IDs y eventos
✅ **Tracking automático** - Los eventos se envían a todas las plataformas configuradas
✅ **Identificación de fuentes** - Captura automática de UTM parameters, fbclid, gclid
✅ **Analytics en tiempo real** - Dashboard de fuentes de leads
✅ **Exportación GTM** - Contenedor pre-configurado listo para importar
✅ **Testing integrado** - Herramienta para verificar que todo funciona

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    Usuario Interactúa                    │
│                  (Registro, Formularios, etc)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           ConversionTrackingService.ts                   │
│  (Servicio unificado de tracking de conversiones)       │
└─────┬──────────────┬──────────────────┬─────────────────┘
      │              │                  │
      ▼              ▼                  ▼
┌──────────┐  ┌──────────────┐  ┌─────────────────────┐
│   GTM    │  │  FB Pixel    │  │  Supabase DB        │
│dataLayer │  │   fbq()      │  │ tracking_events     │
└──────────┘  └──────────────┘  └─────────────────────┘
```

### Componentes Clave

#### 1. **MarketingConfigService.ts** (`/src/services/MarketingConfigService.ts`)
- Gestiona la configuración de GTM y Facebook Pixel
- Inicializa scripts de tracking dinámicamente
- Almacena configuración en Supabase y localStorage

#### 2. **ConversionTrackingService.ts** (`/src/services/ConversionTrackingService.ts`)
- API unificada para trackear eventos
- Métodos específicos para cada tipo de conversión
- Se auto-inicializa al importar

#### 3. **MarketingConfigPage.tsx** (`/src/pages/MarketingConfigPage.tsx`)
- Interfaz de administración
- Configuración de IDs y eventos
- Analytics y testing

#### 4. **Database Tables**
```sql
-- Configuración de marketing
marketing_config (
  id, gtm_container_id, facebook_pixel_id,
  google_analytics_id, conversion_events, active
)

-- Eventos trackeados
tracking_events (
  id, event_name, event_type, user_id, session_id,
  metadata, utm_source, utm_medium, utm_campaign,
  fbclid, gclid, created_at
)
```

---

## 🚀 Instalación y Configuración

### Paso 1: Ejecutar Migraciones de Base de Datos

```bash
# Aplicar la migración
supabase db push

# O si usas el script de migración
./scripts/apply-migration.sh supabase/migrations/20250105000000_create_marketing_tracking_tables.sql
```

Esto creará las tablas:
- `marketing_config` - Almacena configuración de GTM y FB Pixel
- `tracking_events` - Almacena todos los eventos de conversión

### Paso 2: Obtener tus IDs

#### Google Tag Manager (GTM)

1. Ve a [Google Tag Manager](https://tagmanager.google.com/)
2. Crea un contenedor web (o usa uno existente)
3. Copia tu **Container ID** (formato: `GTM-XXXXXXX`)

#### Facebook Pixel

1. Ve a [Facebook Business Manager](https://business.facebook.com/)
2. Navega a **Configuración de Eventos → Píxeles**
3. Crea un pixel (o usa uno existente)
4. Copia tu **Pixel ID** (número de 15-16 dígitos)

#### Google Analytics 4 (Opcional)

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Crea una propiedad GA4 (o usa una existente)
3. Copia tu **Measurement ID** (formato: `G-XXXXXXXXXX`)

### Paso 3: Acceder a la Interfaz de Configuración

1. Inicia sesión como **admin**
2. Navega a: `http://localhost:5173/escritorio/admin/marketing-config`
3. Verás la interfaz de configuración

---

## 🎛️ Uso de la Interfaz de Configuración

### Pestaña: Configuración

![Marketing Config Interface](docs/marketing-config-screenshot.png)

1. **Ingresa tu GTM Container ID**
   - Formato: `GTM-XXXXXXX`
   - Ejemplo: `GTM-A1B2C3D`

2. **Ingresa tu Facebook Pixel ID**
   - Formato: `123456789012345` (15-16 dígitos)
   - Ejemplo: `123456789012345`

3. **Ingresa tu Google Analytics ID** (opcional)
   - Formato: `G-XXXXXXXXXX`
   - Ejemplo: `G-ABC123XYZ`

4. **Haz clic en "Guardar Configuración"**
   - Esto iniciará automáticamente GTM y Facebook Pixel
   - Los scripts se inyectarán dinámicamente en la página

### Pestaña: Eventos de Conversión

Aquí puedes configurar qué eventos se trackean y en qué plataformas:

| Evento | Descripción | FB Pixel | GTM |
|--------|-------------|----------|-----|
| **Lead** | Formulario enviado, aplicación iniciada | ✅ | ✅ |
| **PageView** | Vista de página | ✅ | ✅ |
| **ViewContent** | Ver detalle de vehículo | ✅ | ✅ |
| **CompleteRegistration** | Registro completado | ✅ | ✅ |

**Controles:**
- **Activo** - Habilita/deshabilita el evento completamente
- **GTM** - Envía evento a Google Tag Manager
- **FB Pixel** - Envía evento a Facebook Pixel

### Pestaña: Analytics

Muestra:
- **Fuentes de Leads** - De dónde vienen tus leads (UTM source)
- **Eventos Recientes** - Últimos 10 eventos trackeados

### Botones de Acción

- **Test Tracking** - Verifica que GTM y FB Pixel estén funcionando
- **Exportar GTM** - Descarga el contenedor GTM pre-configurado

---

## 📊 Eventos Trackeados

### 1. Registro de Usuario (CompleteRegistration)

**Trigger:** Cuando el usuario completa el registro vía OTP o Google OAuth

**Código:**
```typescript
// En AuthPage.tsx (después de verificar OTP exitosamente)
conversionTracking.trackAuth.otpVerified(userId, {
  email: email,
  vehicleId: ordencompra
});

// En AuthPage.tsx (después de Google Sign In)
conversionTracking.trackAuth.googleSignIn({
  email: email
});
```

**Data enviada:**
```javascript
{
  event: 'CompleteRegistration',
  eventName: 'User Registration Complete',
  userId: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  vehicleId: '12345', // Si viene de un vehículo específico
  method: 'email_otp' // o 'google_oauth'
}
```

### 2. Solicitud de Financiamiento - Step Completado (Lead)

**Trigger:** Cada vez que el usuario completa un paso del formulario

**Código:**
```typescript
// En Application.tsx (al guardar cada step)
conversionTracking.trackApplication.stepCompleted(stepNumber, stepName, {
  applicationId: applicationId,
  vehicleId: ordencompra
});
```

**Data enviada:**
```javascript
{
  event: 'Lead',
  eventName: 'Application Step 1 Complete: Información Personal',
  stepNumber: 1,
  stepName: 'Información Personal',
  applicationId: 'app-123',
  vehicleId: '12345'
}
```

### 3. Solicitud de Financiamiento - Enviada (Lead)

**Trigger:** Cuando el usuario envía la solicitud completa

**Código:**
```typescript
// En Application.tsx (onSubmit success)
conversionTracking.trackApplication.submitted({
  applicationId: applicationId,
  vehicleId: ordencompra,
  vehicleName: vehicleTitle,
  vehiclePrice: vehiclePrice,
  recommendedBank: recommendedBank,
  userId: userId
});
```

**Data enviada:**
```javascript
{
  event: 'Lead',
  eventName: 'Application Submitted',
  applicationId: 'app-123',
  vehicleId: '12345',
  vehicleName: 'Honda Accord 2020',
  vehiclePrice: 350000,
  recommendedBank: 'Santander',
  userId: '123e4567-e89b-12d3-a456-426614174000',
  value: 350000,
  currency: 'MXN'
}
```

### 4. Vista de Contenido (ViewContent)

**Trigger:** Cuando el usuario ve la página de detalle de un vehículo

**Código:**
```typescript
// Implementar en VehicleDetailPage.tsx
conversionTracking.trackViewContent(vehicleTitle, 'vehicle', {
  vehicleId: ordencompra,
  vehiclePrice: price,
  vehicleBrand: brand,
  vehicleModel: model
});
```

### 5. PageView

**Trigger:** Automáticamente en cada cambio de página (configurar en App.tsx o main.tsx)

**Código:**
```typescript
// En App.tsx useEffect
useEffect(() => {
  conversionTracking.trackPageView(document.title);
}, [location.pathname]);
```

---

## 🔍 Análisis de Fuentes de Leads

El sistema captura automáticamente los siguientes parámetros de origen:

### UTM Parameters
- `utm_source` - Fuente de tráfico (google, facebook, newsletter)
- `utm_medium` - Medio (cpc, email, social)
- `utm_campaign` - Nombre de campaña
- `utm_term` - Término de búsqueda
- `utm_content` - Contenido del anuncio

### Click IDs
- `fbclid` - Facebook Click ID
- `gclid` - Google Click ID
- `msclkid` - Microsoft Click ID

### Ejemplo de URL con tracking:
```
https://ultima.com/autos/honda-accord?
  utm_source=facebook&
  utm_medium=cpc&
  utm_campaign=summer_sale_2025&
  utm_content=ad_variant_a&
  fbclid=IwAR1234567890
```

### Ver Analytics de Fuentes

En la pestaña **Analytics** de la interfaz de configuración:

```
Fuente: facebook
Medium: cpc
Campaign: summer_sale_2025
Leads: 25
```

### Consultar Datos Programáticamente

```typescript
import { marketingConfigService } from '@/services/MarketingConfigService';

// Obtener leads por fuente
const sources = await marketingConfigService.getLeadSourceAnalytics(
  '2025-01-01', // fecha inicio
  '2025-01-31'  // fecha fin
);

console.log(sources);
// [
//   { source: 'facebook', medium: 'cpc', campaign: 'summer_sale', count: 25 },
//   { source: 'google', medium: 'cpc', campaign: 'brand_search', count: 18 },
//   { source: 'direct', medium: null, campaign: null, count: 12 }
// ]
```

---

## 🛠️ Troubleshooting

### Problema: Los eventos no se están trackeando

**Solución:**

1. **Verificar configuración:**
   ```typescript
   import { conversionTracking } from '@/services/ConversionTrackingService';

   // En la consola del navegador
   conversionTracking.test();
   ```

   Deberías ver:
   ```
   Config loaded: ✅
   GTM active: ✅
   Facebook Pixel active: ✅
   ```

2. **Revisar la consola del navegador:**
   - Abre DevTools (F12)
   - Busca errores en la pestaña Console
   - Deberías ver logs como: `📊 Conversion tracked: Lead - Application Submitted`

3. **Verificar que GTM está cargado:**
   ```javascript
   // En consola del navegador
   console.log(window.dataLayer);
   // Debería mostrar un array con eventos

   console.log(window.fbq);
   // Debería mostrar la función de Facebook Pixel
   ```

### Problema: No aparecen eventos en Facebook Events Manager

**Solución:**

1. Verifica que tu Pixel ID sea correcto (15-16 dígitos)
2. Usa la extensión **Facebook Pixel Helper** de Chrome
3. Revisa que los eventos tengan `fb_enabled: true` en la configuración
4. Los eventos pueden tardar hasta 20 minutos en aparecer en Facebook

### Problema: No aparecen eventos en GTM Preview Mode

**Solución:**

1. Asegúrate de haber **importado el contenedor GTM** desde el archivo exportado
2. En GTM, entra en modo **Preview**
3. Navega a tu sitio
4. Verifica que los eventos aparezcan en el panel de preview

### Problema: Los UTM parameters no se están capturando

**Solución:**

El componente `LeadSourceHandler` ya está capturando UTMs. Verifica:

```typescript
// En consola del navegador
const leadData = sessionStorage.getItem('leadSourceData');
console.log(JSON.parse(leadData));
```

Deberías ver:
```json
{
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "summer_sale",
  "fbclid": "IwAR1234..."
}
```

---

## 📚 API Reference

### ConversionTrackingService

#### `trackRegistration(metadata?)`
Trackea el registro de un nuevo usuario.

```typescript
conversionTracking.trackRegistration({
  userId: '123',
  email: 'user@email.com',
  method: 'email_otp'
});
```

#### `trackLead(metadata?)`
Trackea la captura de un lead genérico.

```typescript
conversionTracking.trackLead({
  formName: 'contact_form',
  source: 'landing_page'
});
```

#### `trackPageView(pageName?, metadata?)`
Trackea una vista de página.

```typescript
conversionTracking.trackPageView('Home Page', {
  category: 'landing'
});
```

#### `trackViewContent(contentName, contentType, metadata?)`
Trackea la vista de contenido específico.

```typescript
conversionTracking.trackViewContent('Honda Accord 2020', 'vehicle', {
  vehicleId: '12345',
  vehiclePrice: 350000
});
```

#### `trackFormSubmission(formName, metadata?)`
Trackea el envío de un formulario.

```typescript
conversionTracking.trackFormSubmission('contact_form', {
  formType: 'contact',
  leadSource: 'website'
});
```

#### `trackButtonClick(buttonName, metadata?)`
Trackea clicks en botones importantes.

```typescript
conversionTracking.trackButtonClick('Get Quote', {
  vehicleId: '12345'
});
```

### Métodos Específicos de Aplicación

#### `trackApplication.started(metadata?)`
```typescript
conversionTracking.trackApplication.started({
  vehicleId: '12345'
});
```

#### `trackApplication.stepCompleted(stepNumber, stepName, metadata?)`
```typescript
conversionTracking.trackApplication.stepCompleted(1, 'Personal Info', {
  applicationId: 'app-123'
});
```

#### `trackApplication.submitted(metadata?)`
```typescript
conversionTracking.trackApplication.submitted({
  applicationId: 'app-123',
  vehiclePrice: 350000,
  recommendedBank: 'Santander'
});
```

### Métodos de Autenticación

#### `trackAuth.otpRequested(email, metadata?)`
```typescript
conversionTracking.trackAuth.otpRequested('user@email.com', {
  source: 'website'
});
```

#### `trackAuth.otpVerified(userId, metadata?)`
```typescript
conversionTracking.trackAuth.otpVerified('user-123', {
  email: 'user@email.com'
});
```

#### `trackAuth.googleSignIn(metadata?)`
```typescript
conversionTracking.trackAuth.googleSignIn({
  referrer: 'landing_page'
});
```

---

## 🎯 Importar Contenedor GTM

### Paso 1: Exportar desde la interfaz

1. Ve a `/escritorio/admin/marketing-config`
2. Haz clic en **"Exportar GTM"**
3. Se descargará `gtm-container-template.json`

### Paso 2: Importar en Google Tag Manager

1. Ve a [Google Tag Manager](https://tagmanager.google.com/)
2. Selecciona tu contenedor
3. Ve a **Admin → Importar contenedor**
4. Sube el archivo `gtm-container-template.json`
5. Selecciona **"Combinar - Sobrescribir conflictos"**
6. Haz clic en **"Confirmar"**

### Paso 3: Actualizar Variables

En GTM, ve a **Variables** y actualiza:

1. **Facebook Pixel ID** - Ingresa tu Pixel ID real
2. **Google Analytics ID** - Ingresa tu GA4 Measurement ID (si lo usas)

### Paso 4: Publicar

1. Haz clic en **"Enviar"**
2. Agrega un nombre de versión (ej: "Marketing Tracking v1.0")
3. Haz clic en **"Publicar"**

### Paso 5: Verificar

1. Activa el modo **Preview** en GTM
2. Navega a tu sitio
3. Realiza acciones (registro, formularios, etc.)
4. Verifica que los eventos aparezcan en el panel de preview

---

## 🔐 Seguridad y Privacidad

### Row Level Security (RLS)

Las tablas tienen políticas de seguridad:

**marketing_config:**
- Solo admins pueden insertar/actualizar configuración
- Todos pueden leer la configuración activa

**tracking_events:**
- Cualquiera puede insertar eventos (para tracking anónimo)
- Los usuarios solo ven sus propios eventos
- Los admins ven todos los eventos

### Datos Sensibles

❌ **NO trackees:**
- Contraseñas
- Números de tarjeta
- INE/RFC completos
- Información médica

✅ **SÍ trackea:**
- IDs de referencia (applicationId, vehicleId)
- Nombres de eventos
- UTM parameters
- Valores numéricos (precio, paso del formulario)

---

## 📈 Mejores Prácticas

### 1. Nombra eventos consistentemente
```typescript
// ✅ Bueno
trackLead({ eventName: 'Application - Step 1 Complete' });

// ❌ Malo
trackLead({ eventName: 'step1done' });
```

### 2. Incluye contexto relevante
```typescript
// ✅ Bueno
trackApplication.submitted({
  applicationId: 'app-123',
  vehicleId: '12345',
  vehiclePrice: 350000,
  recommendedBank: 'Santander'
});

// ❌ Malo
trackApplication.submitted({ id: '123' });
```

### 3. No sobre-trackees
- No trackees cada click
- Enfócate en eventos de conversión importantes
- Agrupa eventos relacionados

### 4. Usa UTM parameters en tus campañas
```
URL de campaña de Facebook:
https://ultima.com/autos?utm_source=facebook&utm_medium=cpc&utm_campaign=verano_2025

URL de email marketing:
https://ultima.com/promociones?utm_source=newsletter&utm_medium=email&utm_campaign=promo_junio
```

---

## 🚀 Próximos Pasos

Después de configurar el tracking:

1. **Configura campañas en Facebook Ads**
   - Usa tu Pixel ID
   - Crea audiencias personalizadas basadas en eventos
   - Configura conversiones personalizadas

2. **Configura objetivos en Google Analytics**
   - Importa eventos desde GTM
   - Crea embudos de conversión
   - Configura atribución multi-canal

3. **Analiza tus datos**
   - Revisa qué fuentes generan más leads
   - Optimiza campañas con bajo rendimiento
   - A/B testing de landing pages

4. **Mejora continua**
   - Agrega nuevos eventos según necesites
   - Refina los parámetros de tracking
   - Documenta cambios en eventos

---

## 📞 Soporte

Si tienes problemas:

1. Revisa esta documentación
2. Usa el botón "Test Tracking" en la interfaz
3. Revisa los logs en la consola del navegador
4. Contacta al equipo de desarrollo

---

## 📝 Changelog

### v1.0.0 (2025-01-05)
- ✅ Implementación inicial
- ✅ Interfaz de configuración de marketing
- ✅ Integración GTM y Facebook Pixel
- ✅ Tracking de eventos de registro
- ✅ Tracking de eventos de aplicación
- ✅ Analytics de fuentes de leads
- ✅ Exportación de contenedor GTM
- ✅ Migraciones de base de datos
- ✅ Documentación completa

---

**¡Listo! 🎉** Ahora tienes un sistema completo de tracking de conversiones para identificar las mejores fuentes de tus leads y optimizar tus campañas de marketing.
