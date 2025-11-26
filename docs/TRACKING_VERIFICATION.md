# 🔍 Verificación de Tracking - TREFA

## Resumen de Implementación

Este documento describe cómo verificar que el sistema de tracking (GTM, Facebook Pixel, GA4) está funcionando correctamente.

## 📊 Herramientas de Tracking Implementadas

### 1. Google Tag Manager (GTM)
- **Container ID**: `GTM-KDVDMB4X`
- **Ubicación**: `index.html` (líneas 16-22)
- **Estado**: ✅ Implementado y protegido contra duplicación

### 2. Facebook Pixel
- **Pixel ID**: `846689825695126`
- **Ubicación**: `index.html` (líneas 37-49)
- **Estado**: ✅ Implementado correctamente

### 3. Google Analytics 4
- **Measurement ID**: `G-E580PSBCHH`
- **Ubicación**: `index.html` (líneas 24-35)
- **Estado**: ✅ Recién implementado

### 4. Microsoft Clarity
- **Project ID**: `t3kzkhn6m4`
- **Ubicación**: `index.html` (líneas 9-15)
- **Estado**: ✅ Implementado

---

## 🧪 Cómo Verificar el Tracking

### Opción 1: Herramienta de Verificación Web

1. Abre en tu navegador: `https://trefa.mx/verify-tracking.html`
2. Haz clic en los botones de verificación
3. Revisa los resultados

### Opción 2: Consola del Navegador

1. Abre el sitio en producción (`https://trefa.mx`)
2. Presiona F12 para abrir DevTools
3. Ve a la pestaña Console
4. Copia y pega el siguiente script:

```javascript
// 🔍 Verificación Completa de Tracking
(function() {
  console.log('%c🔍 Verificación de Tracking - TREFA', 'font-size: 20px; font-weight: bold; color: #ff6b35');

  // 1. Verificar GTM
  console.log('\n%c1️⃣ Google Tag Manager', 'font-size: 16px; font-weight: bold; color: #4285f4');
  if (window.dataLayer) {
    console.log('✅ dataLayer existe');
    console.log('📊 Eventos en dataLayer:', window.dataLayer.length);
    console.log('🔗 Últimos 5 eventos:', window.dataLayer.slice(-5));
  } else {
    console.error('❌ dataLayer NO encontrado');
  }

  if (window.google_tag_manager) {
    console.log('✅ google_tag_manager cargado');
    console.log('📦 Containers:', Object.keys(window.google_tag_manager));
  } else {
    console.error('❌ google_tag_manager NO encontrado');
  }

  // 2. Verificar Facebook Pixel
  console.log('\n%c2️⃣ Facebook Pixel', 'font-size: 16px; font-weight: bold; color: #1877f2');
  if (window.fbq) {
    console.log('✅ fbq (Facebook Pixel) existe');
    console.log('📊 Queue:', window.fbq.queue?.length || 0);
    console.log('🔢 Versión:', window.fbq.version);
  } else {
    console.error('❌ fbq NO encontrado');
  }

  // 3. Verificar Google Analytics
  console.log('\n%c3️⃣ Google Analytics 4', 'font-size: 16px; font-weight: bold; color: #f9ab00');
  if (window.gtag) {
    console.log('✅ gtag (Google Analytics) existe');
  } else {
    console.error('❌ gtag NO encontrado');
  }

  // 4. Test Event
  console.log('\n%c4️⃣ Disparar Evento de Prueba', 'font-size: 16px; font-weight: bold; color: #ea4335');
  window.dataLayer?.push({
    event: 'test_event',
    eventName: 'Test Event from Verification',
    timestamp: new Date().toISOString()
  });
  console.log('✅ Evento enviado a dataLayer');

  if (window.fbq) {
    window.fbq('trackCustom', 'TestEvent', { source: 'verification_script' });
    console.log('✅ Evento enviado a Facebook Pixel');
  }

  if (window.gtag) {
    window.gtag('event', 'test_event', { source: 'verification_script' });
    console.log('✅ Evento enviado a Google Analytics');
  }

  console.log('\n%c✨ Verificación Completa', 'font-size: 16px; font-weight: bold; color: #34a853');
})();
```

### Opción 3: Extensiones de Navegador

1. **Google Tag Assistant** (Chrome)
   - Instala desde Chrome Web Store
   - Abre el sitio y verifica que GTM esté disparando

2. **Meta Pixel Helper** (Chrome)
   - Instala desde Chrome Web Store
   - Verifica que el pixel esté activo y enviando eventos

3. **GA Debugger** (Chrome)
   - Para verificar Google Analytics 4

---

## 📋 Verificar Eventos en Supabase

### SQL Query - Resumen de Eventos

```sql
SELECT
  event_type,
  event_name,
  COUNT(*) as total_eventos,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  MIN(created_at) as primer_evento,
  MAX(created_at) as ultimo_evento
FROM tracking_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type, event_name
ORDER BY total_eventos DESC;
```

### SQL Query - Eventos Recientes

```sql
SELECT
  event_type,
  event_name,
  user_id,
  metadata,
  utm_source,
  utm_medium,
  utm_campaign,
  created_at
FROM tracking_events
ORDER BY created_at DESC
LIMIT 20;
```

### SQL Query - Total de Eventos

```sql
SELECT
  COUNT(*) as total_eventos,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(DISTINCT session_id) as sesiones_unicas,
  MIN(created_at) as evento_mas_antiguo,
  MAX(created_at) as evento_mas_reciente
FROM tracking_events;
```

---

## 🎯 Eventos Rastreados

| Evento | Descripción | Ubicación | Trigger |
|--------|-------------|-----------|---------|
| **PageView** | Vista de página | PageViewTracker.tsx | Cambio de ruta |
| **ConversionLandingPage** | Registro desde landing | FinanciamientosPage.tsx:539 | Envío formulario |
| **InitialRegistration** | Registro inicial | AuthPage / OTP verification | Verificación exitosa |
| **PersonalInformationComplete** | Perfil completo | ProfilePage.tsx:352 | Guardar perfil |
| **PerfilacionBancariaComplete** | Perfilación bancaria | PerfilacionBancariaPage.tsx:283 | Completar cuestionario |
| **ComienzaSolicitud** | Inicia aplicación | PerfilacionBancariaPage.tsx:242 | Redirección a aplicación |
| **ApplicationSubmission** | Envío de solicitud | Application.tsx:498 | Enviar aplicación |
| **LeadComplete** | Lead completo | ConversionTrackingService.ts:242 | Aplicación desde landing |

---

## 🔧 Resolución de Problemas

### Problema: No aparecen eventos en dataLayer

**Solución**:
1. Verifica que PageViewTracker esté montado en App.tsx (línea 122)
2. Revisa la consola por errores de JavaScript
3. Confirma que ConversionTrackingService se inicializa en main.tsx

### Problema: Facebook Pixel no dispara

**Solución**:
1. Verifica que `window.fbq` existe
2. Revisa si hay bloqueadores de ads activos
3. Usa Meta Pixel Helper para debugging

### Problema: Eventos no llegan a Supabase

**Solución**:
1. Verifica la conexión a Supabase
2. Revisa permisos de la tabla `tracking_events`
3. Consulta la consola para errores de inserción

---

## 📈 Mejoras Futuras

- [ ] Configurar Cloudflare Tag Gateway para first-party tracking
- [ ] Implementar server-side GTM container
- [ ] Agregar eventos de e-commerce mejorados
- [ ] Configurar conversiones en Google Ads
- [ ] Implementar tracking de scroll depth
- [ ] Agregar heatmaps (Hotjar o similar)

---

## 🎓 Recursos Adicionales

- [Google Tag Manager Docs](https://developers.google.com/tag-platform/tag-manager)
- [Facebook Pixel Guide](https://www.facebook.com/business/help/742478679120153)
- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Cloudflare Tag Gateway](https://developers.cloudflare.com/zaraz/reference/zaraz-track/)

---

**Última actualización**: 2024-01-19
**Responsable**: Equipo de Marketing Digital TREFA
