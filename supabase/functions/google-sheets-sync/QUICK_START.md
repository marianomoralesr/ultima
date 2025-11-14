# 🚀 Inicio Rápido - 3 Comandos

Esta guía te permite configurar y desplegar la sincronización con Google Sheets en **menos de 5 minutos**.

## 📋 Pre-requisitos

1. **Cuenta de servicio de Google** (2 minutos)
   - Ve a https://console.cloud.google.com/
   - Crea proyecto → Habilita Google Sheets API
   - Crea cuenta de servicio → Descarga JSON key

2. **Google Sheet creada y compartida** (1 minuto)
   - Crea nueva hoja en https://sheets.google.com
   - Copia el ID de la URL
   - Comparte con el email de la cuenta de servicio (Editor)

## ⚡ Instalación en 3 Pasos

### Paso 1: Configurar Secretos (2 min)

```bash
cd supabase/functions/google-sheets-sync
./setup-secrets.sh
```

Este script te pedirá:
- ✅ Ruta al archivo JSON de Google
- ✅ ID de tu Google Sheet
- ✅ Nombre de la pestaña (opcional)

### Paso 2: Desplegar (1 min)

```bash
./deploy.sh
```

Este script automáticamente:
- ✅ Despliega la Edge Function
- ✅ Aplica la migración de base de datos
- ✅ Configura la URL de la función
- ✅ Verifica el deployment

### Paso 3: Probar (30 seg)

```bash
./test.sh
```

Este script:
- ✅ Envía una solicitud de prueba
- ✅ Verifica que llegue a Google Sheets
- ✅ Muestra los logs

## ✅ Verificación

Después de ejecutar los 3 comandos:

1. **Verifica Google Sheet**
   - Abre tu hoja
   - Busca la fila con `Application ID: test-123-456`
   - Confirma que todos los campos estén llenos

2. **Envía una solicitud real**
   - Usa tu aplicación para enviar una solicitud
   - Verifica que aparezca en Google Sheets en 1-2 segundos

3. **Revisa los logs**
   ```bash
   supabase functions logs google-sheets-sync --project-ref jjepfehmuybpctdzipnu --follow
   ```

## 🔧 Configuración Manual (Alternativa)

Si prefieres configurar manualmente:

### Configurar Secretos

```bash
# Credenciales de Google
supabase secrets set GOOGLE_SHEETS_CREDENTIALS="$(cat ruta/a/service-account.json)" --project-ref jjepfehmuybpctdzipnu

# ID de Google Sheet
supabase secrets set GOOGLE_SHEET_ID="tu-sheet-id" --project-ref jjepfehmuybpctdzipnu

# Nombre de la pestaña
supabase secrets set GOOGLE_SHEET_NAME="Applications" --project-ref jjepfehmuybpctdzipnu
```

### Desplegar

```bash
# Desplegar función
supabase functions deploy google-sheets-sync --project-ref jjepfehmuybpctdzipnu

# Aplicar migración
supabase db push --project-ref jjepfehmuybpctdzipnu

# Configurar URL
supabase db execute --query "ALTER DATABASE postgres SET app.settings.supabase_url = 'https://jjepfehmuybpctdzipnu.supabase.co';" --project-ref jjepfehmuybpctdzipnu
```

## 🎯 Información del Proyecto

- **Proyecto ID**: `jjepfehmuybpctdzipnu`
- **URL Base**: `https://jjepfehmuybpctdzipnu.supabase.co`
- **Función URL**: `https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/google-sheets-sync`
- **Dashboard**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu

## 📊 Monitoreo

### Ver Logs en Tiempo Real

```bash
supabase functions logs google-sheets-sync --project-ref jjepfehmuybpctdzipnu --follow
```

### Verificar Estado del Trigger

```sql
-- En Supabase SQL Editor
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_application_sync_to_sheets';
```

### Ver Solicitudes HTTP Recientes

```sql
-- En Supabase SQL Editor
SELECT *
FROM net._http_response
ORDER BY created_at DESC
LIMIT 20;
```

## 🚨 Solución de Problemas Rápida

### Error: "GOOGLE_SHEETS_CREDENTIALS is not set"

```bash
# Verifica secretos configurados
supabase secrets list --project-ref jjepfehmuybpctdzipnu

# Si falta, configura de nuevo
./setup-secrets.sh
```

### Error: "Failed to append to Google Sheet"

**Causa común**: Sheet no compartido con cuenta de servicio

**Solución**:
1. Abre el archivo JSON de Google
2. Copia el `client_email`
3. Comparte tu Google Sheet con ese email (permisos de Editor)

### Error: "Failed to get access token"

**Causa común**: API no habilitada o JSON inválido

**Solución**:
1. Ve a https://console.cloud.google.com/
2. Verifica que Google Sheets API esté habilitada
3. Verifica que el JSON sea válido: `cat service-account.json | jq`

### Trigger no se activa

```bash
# Re-aplicar migración
supabase db push --project-ref jjepfehmuybpctdzipnu
```

## 📚 Documentación Completa

- [Guía de Configuración (Español)](./GUIA_CONFIGURACION.md) - Documentación detallada
- [Setup Guide (English)](./SETUP_GUIDE.md) - Quick setup guide
- [README](./README.md) - Technical documentation

## 💡 Tips

1. **Congela la fila de encabezados** en Google Sheets
   - Ver > Congelar > 1 fila

2. **Agrega filtros**
   - Selecciona fila de encabezados > Datos > Crear un filtro

3. **Formato condicional por estado**
   - Colorea filas según el status de la solicitud

4. **Sincroniza solicitudes históricas**
   ```sql
   -- Ejecuta en Supabase SQL Editor
   SELECT net.http_post(
     url := 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/google-sheets-sync',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'role'
     ),
     body := jsonb_build_object('record', row_to_json(fa))
   )
   FROM financing_applications fa
   WHERE status IN ('submitted', 'reviewing', 'pending_docs', 'approved', 'rejected')
   ORDER BY created_at ASC;
   ```

## 🎉 ¡Eso es todo!

Una vez completados los 3 pasos, tu sistema estará sincronizando automáticamente todas las solicitudes a Google Sheets.

Cada vez que un usuario envía una solicitud, aparecerá en tu hoja en 1-2 segundos.

---

**¿Necesitas ayuda?** Revisa la [Guía de Configuración completa](./GUIA_CONFIGURACION.md)
