# 🎯 Setup de Marketing Tracking - Tus Pasos Específicos

## Tu Configuración

- **GTM Container ID:** `GTM-KDVDMB4X`
- **Facebook Pixel ID:** `1748754972582547`

---

## ⚡ Opción 1: Setup Automático (RECOMENDADO)

Ejecuta este comando en tu terminal:

```bash
./setup-my-tracking.sh
```

Este script:
1. ✅ Aplica las migraciones de base de datos
2. ✅ Inserta tu configuración automáticamente
3. ✅ Verifica que todo esté bien
4. ✅ Te da instrucciones para importar en GTM

---

## 🔧 Opción 2: Setup Manual

### Paso 1: Aplicar Migraciones

```bash
supabase db push
```

### Paso 2: Insertar Configuración

```bash
supabase db execute < insert-marketing-config.sql
```

### Paso 3: Verificar

```bash
echo "SELECT * FROM marketing_config WHERE active = true;" | supabase db execute
```

---

## 📦 Importar Contenedor GTM

### Archivo a importar:
📁 `gtm-container-ultima-copy.json`

### Pasos:

1. **Ve a Google Tag Manager**
   ```
   https://tagmanager.google.com/
   ```

2. **Selecciona tu contenedor:** `GTM-KDVDMB4X`

3. **Importar:**
   - Ve a **Admin** (esquina superior derecha)
   - Click en **Import Container**
   - Sube el archivo `gtm-container-ultima-copy.json`
   - Selecciona:
     - **Workspace:** Default Workspace
     - **Choose import option:** Merge → **Rename conflicting tags, triggers, and variables**
   - Click **Confirm**

4. **Publicar:**
   - Click **Submit** (esquina superior derecha)
   - Nombre de versión: "Marketing Tracking v1.0"
   - Click **Publish**

---

## ✅ Verificar que Todo Funciona

### En tu sitio web:

1. Abre tu sitio: `http://localhost:5173`
2. Abre DevTools (F12)
3. En la consola ejecuta:

```javascript
conversionTracking.test();
```

**Deberías ver:**
```
✅ Config loaded
✅ GTM active
✅ Facebook Pixel active
```

### En Facebook Events Manager:

1. Ve a: https://business.facebook.com/events_manager2/list/pixel/1748754972582547
2. Click en tu Pixel ID: `1748754972582547`
3. Deberías empezar a ver eventos como:
   - **PageView** (automático en todas las páginas)
   - **Lead** (cuando alguien envía un formulario)
   - **CompleteRegistration** (cuando alguien se registra)

### En Google Tag Manager (Preview Mode):

1. En GTM, click **Preview**
2. Ingresa la URL de tu sitio
3. Deberías ver activarse:
   - Tag: "FB Pixel - Base Code"
   - Variables: UTM Source, UTM Medium, UTM Campaign

---

## 📊 Eventos que se Trackean Automáticamente

| Evento | Cuándo se activa | Dónde |
|--------|------------------|-------|
| **PageView** | Carga de página | Todas las páginas |
| **Lead** | Envío de formulario | Application, Contact forms |
| **CompleteRegistration** | Usuario se registra | AuthPage (OTP, Google) |
| **ViewContent** | Ver vehículo | VehicleDetailPage (por implementar) |

---

## 🔍 Probar con URL de Campaña

Prueba con una URL que tenga parámetros UTM:

```
http://localhost:5173?utm_source=facebook&utm_medium=cpc&utm_campaign=test_enero_2025
```

Luego verifica en la consola:

```javascript
sessionStorage.getItem('leadSourceData')
```

Deberías ver:
```json
{
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "test_enero_2025"
}
```

---

## 📱 Instalar Facebook Pixel Helper (Recomendado)

1. Instala la extensión de Chrome: [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Visita tu sitio
3. Click en el ícono de la extensión
4. Deberías ver tu Pixel ID: `1748754972582547`
5. Verás los eventos que se están enviando en tiempo real

---

## 🎯 Configurar Conversiones en Facebook Ads

### Crear Conversión Personalizada:

1. Ve a [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Click en tu Pixel: `1748754972582547`
3. Ve a **Custom Conversions**
4. Click **Create Custom Conversion**
5. Configura:
   - **Name:** Lead - Solicitud de Financiamiento
   - **Data Source:** Tu Pixel (1748754972582547)
   - **Event:** Lead
   - **Rule:** URL contains `/aplicacion`
6. Save

Ahora puedes usar esta conversión en tus campañas de Facebook Ads!

---

## 🆘 Troubleshooting

### No veo eventos en Facebook

**Solución:**
- Espera 20-30 minutos (delay normal de Facebook)
- Usa Facebook Pixel Helper para ver eventos en tiempo real
- Verifica en consola: `console.log(window.fbq)`
- Debería mostrar la función fbq

### GTM no está activo

**Solución:**
```javascript
console.log(window.dataLayer);
```
- Si es `undefined`, GTM no se cargó
- Recarga la página
- Verifica que guardaste la configuración en `/admin/marketing-config`

### No captura UTMs

**Solución:**
- El componente `LeadSourceHandler` ya está en `App.tsx`
- Verifica: `sessionStorage.getItem('leadSourceData')`
- Prueba con una URL completa con UTMs

---

## 📞 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `setup-my-tracking.sh` | Script de instalación automática |
| `insert-marketing-config.sql` | SQL con tu configuración |
| `gtm-container-ultima-copy.json` | Contenedor GTM listo para importar |
| `MARKETING_TRACKING_SETUP.md` | Documentación completa |

---

## ✅ Checklist

- [ ] Ejecutar `./setup-my-tracking.sh`
- [ ] Importar `gtm-container-ultima-copy.json` en GTM
- [ ] Publicar el contenedor en GTM
- [ ] Probar con `conversionTracking.test()`
- [ ] Instalar Facebook Pixel Helper
- [ ] Verificar eventos en Facebook Events Manager
- [ ] Crear conversiones personalizadas en Facebook

---

**¡Listo! 🎉** Tu tracking está completamente configurado con tus IDs.

Si tienes dudas, revisa la documentación completa en `MARKETING_TRACKING_SETUP.md`
