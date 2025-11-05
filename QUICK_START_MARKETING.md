# 🚀 Quick Start - Marketing Tracking

Guía rápida de 5 minutos para configurar GTM y Facebook Pixel.

## ⚡ Instalación Rápida

### Opción 1: Script Automatizado

```bash
./setup-marketing-tracking.sh
```

### Opción 2: Manual

```bash
# 1. Aplicar migraciones
supabase db push

# 2. Acceder a la interfaz
# http://localhost:5173/escritorio/admin/marketing-config

# 3. Ingresar IDs y guardar
```

## 🔑 Obtener IDs

### Google Tag Manager
1. [tagmanager.google.com](https://tagmanager.google.com/)
2. Crear contenedor → Copiar **GTM-XXXXXXX**

### Facebook Pixel
1. [business.facebook.com](https://business.facebook.com/)
2. Eventos → Píxeles → Copiar **ID numérico (15-16 dígitos)**

## ✅ Verificar

```javascript
// En consola del navegador (F12)
conversionTracking.test();
```

Deberías ver:
```
✅ Config loaded
✅ GTM active
✅ Facebook Pixel active
```

## 📊 Ver Eventos

### En Facebook Events Manager
1. [business.facebook.com](https://business.facebook.com/)
2. Eventos → Píxeles → Ver eventos
3. Deberías ver eventos como "Lead", "PageView", "CompleteRegistration"

### En Google Tag Manager
1. Modo Preview en GTM
2. Navega a tu sitio
3. Verifica eventos en el panel

### En tu Base de Datos
```sql
SELECT * FROM tracking_events ORDER BY created_at DESC LIMIT 10;
```

## 📈 Analytics de Leads

```typescript
import { marketingConfigService } from '@/services/MarketingConfigService';

const sources = await marketingConfigService.getLeadSourceAnalytics();
console.log(sources);
```

## 🎯 Usar en tu Código

### Registro
```typescript
import { conversionTracking } from '@/services/ConversionTrackingService';

conversionTracking.trackRegistration({
  userId: '123',
  email: 'user@email.com'
});
```

### Formulario
```typescript
conversionTracking.trackFormSubmission('financing_application', {
  vehicleId: '456'
});
```

### Click de Botón
```typescript
conversionTracking.trackButtonClick('Get Quote', {
  vehicleId: '789'
});
```

## 📖 Documentación Completa

Ver [MARKETING_TRACKING_SETUP.md](./MARKETING_TRACKING_SETUP.md)

## 🆘 Ayuda

**Problema:** No veo eventos en Facebook
- Usa Facebook Pixel Helper (extensión Chrome)
- Espera 20 minutos (delay normal)
- Verifica Pixel ID

**Problema:** No veo eventos en GTM
- Importa el contenedor desde "Exportar GTM"
- Activa modo Preview
- Verifica Container ID

**Problema:** No captura UTMs
- Verifica que LeadSourceHandler esté en App.tsx
- Revisa sessionStorage: `sessionStorage.getItem('leadSourceData')`

---

**¡Listo en 5 minutos!** 🎉
