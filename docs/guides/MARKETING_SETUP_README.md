# 🚀 Setup Marketing Tracking - Primeros Pasos

## ⚠️ IMPORTANTE: Ejecuta esto PRIMERO

Antes de usar la interfaz de configuración de marketing, **debes aplicar las migraciones de base de datos**.

## Paso 1: Aplicar Migración (OBLIGATORIO)

```bash
supabase db push
```

Este comando creará las tablas necesarias:
- `marketing_config` - Almacena configuración de GTM y Facebook Pixel
- `tracking_events` - Almacena eventos de conversión

### ¿Qué pasa si no ejecuto esto?

Verás un error como:
```
❌ Error: La tabla marketing_config no existe
```

## Paso 2: Acceder a la Interfaz

Una vez aplicada la migración, accede a:

```
http://localhost:5173/escritorio/admin/marketing-config
```

(Necesitas estar logueado como admin)

## Paso 3: Configurar IDs

En la interfaz, ingresa:

1. **GTM Container ID** (formato: `GTM-XXXXXXX`)
   - Obtén esto de [Google Tag Manager](https://tagmanager.google.com/)

2. **Facebook Pixel ID** (15-16 dígitos)
   - Obtén esto de [Facebook Business Manager](https://business.facebook.com/) → Eventos → Píxeles

3. **Google Analytics 4 ID** (opcional, formato: `G-XXXXXXXXXX`)

## Paso 4: Exportar e Importar Contenedor GTM

1. En la interfaz, haz clic en **"Exportar GTM"**
2. Ve a [Google Tag Manager](https://tagmanager.google.com/)
3. Importa el archivo descargado
4. Publica el contenedor

## Paso 5: Verificar

En la consola del navegador (F12):

```javascript
conversionTracking.test();
```

Deberías ver:
```
✅ Config loaded
✅ GTM active
✅ Facebook Pixel active
```

---

## 🆘 Troubleshooting

### Error: "supabase: command not found"

Instala Supabase CLI:
```bash
brew install supabase/tap/supabase
```

### Error: "Could not connect to Supabase"

1. Asegúrate de que Supabase esté corriendo:
   ```bash
   supabase status
   ```

2. Si no está corriendo:
   ```bash
   supabase start
   ```

### Error: "Permission denied"

Verifica que tienes permisos de admin en tu perfil de usuario.

---

## 📖 Documentación Completa

- [Guía completa](./MARKETING_TRACKING_SETUP.md)
- [Quick Start](./QUICK_START_MARKETING.md)
- [Script de setup](./setup-marketing-tracking.sh)

---

## ✅ Checklist Rápido

- [ ] Ejecutar `supabase db push`
- [ ] Acceder a `/escritorio/admin/marketing-config`
- [ ] Ingresar GTM Container ID
- [ ] Ingresar Facebook Pixel ID
- [ ] Guardar configuración
- [ ] Exportar contenedor GTM
- [ ] Importar en Google Tag Manager
- [ ] Verificar con `conversionTracking.test()`

---

**¡Listo!** Una vez completados estos pasos, tu sistema de tracking estará funcionando. 🎉
