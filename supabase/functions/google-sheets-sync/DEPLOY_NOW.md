# 🚀 DESPLIEGUE INMEDIATO - Ya Configurado

Todas las credenciales ya están listas. Solo ejecuta estos comandos:

## ⚡ Instalación en 2 Minutos

### Pre-requisito: Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# O con npm (cualquier OS)
npm install -g supabase
```

### Paso 1: Configurar Secretos (30 segundos)

```bash
cd supabase/functions/google-sheets-sync
./configure-now.sh
```

✅ Este script ya tiene todas las credenciales pre-cargadas:
- Credenciales de Google
- ID del Google Sheet
- Nombre de la pestaña

### Paso 2: Desplegar (30 segundos)

```bash
./deploy.sh
```

✅ Este script:
- Despliega la Edge Function
- Aplica la migración de base de datos
- Configura la URL automáticamente

### Paso 3: Probar (30 segundos)

```bash
./test.sh
```

✅ Verifica que:
- La función responde correctamente
- Los datos llegan a Google Sheets
- Todo está funcionando

## ✅ Verificación

### 1. Verifica Google Sheet

Abre tu hoja aquí:
```
https://docs.google.com/spreadsheets/d/1aLWGZe-DiupfHFTk36D7Rxh83dyPMH5waj5Bmk9WD48/edit
```

Busca una fila con `Application ID: test-123-456`

### 2. Verifica que la Hoja esté Compartida

⚠️ **MUY IMPORTANTE**: Tu Google Sheet debe estar compartido con:
```
trefacreditos@iatrefa.iam.gserviceaccount.com
```

Con permisos de **Editor**.

Si no lo has hecho:
1. Abre el Google Sheet
2. Click en "Compartir"
3. Pega el email de arriba
4. Selecciona "Editor"
5. Desmarcar "Notificar personas"
6. Click en "Compartir"

### 3. Ver Logs en Tiempo Real

```bash
supabase functions logs google-sheets-sync --project-ref jjepfehmuybpctdzipnu --follow
```

## 🎯 Información del Proyecto

- **Proyecto**: jjepfehmuybpctdzipnu
- **URL Base**: https://jjepfehmuybpctdzipnu.supabase.co
- **Función**: google-sheets-sync
- **Google Sheet ID**: 1aLWGZe-DiupfHFTk36D7Rxh83dyPMH5waj5Bmk9WD48
- **Cuenta de Servicio**: trefacreditos@iatrefa.iam.gserviceaccount.com

## 🚨 Solución Rápida de Problemas

### Error: "Failed to append to Google Sheet"

**Causa**: Sheet no compartido

**Solución**: Comparte el sheet con `trefacreditos@iatrefa.iam.gserviceaccount.com` (permisos de Editor)

### Error: "GOOGLE_SHEETS_CREDENTIALS is not set"

**Solución**:
```bash
./configure-now.sh
```

### Trigger no funciona

**Solución**:
```bash
supabase db push --project-ref jjepfehmuybpctdzipnu
```

## 📊 Dashboard

- **Proyecto**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu
- **Logs**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/functions/google-sheets-sync/logs
- **Google Sheet**: https://docs.google.com/spreadsheets/d/1aLWGZe-DiupfHFTk36D7Rxh83dyPMH5waj5Bmk9WD48/edit

## ✨ ¡Eso es Todo!

Una vez ejecutados los 3 comandos, cada solicitud enviada por un usuario aparecerá automáticamente en tu Google Sheet en 1-2 segundos.

---

**¿Problemas?** Revisa [GUIA_CONFIGURACION.md](./GUIA_CONFIGURACION.md) para documentación detallada.
