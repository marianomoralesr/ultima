# 🚀 Google Sheets Sync - Listo para Desplegar

Esta función sincroniza automáticamente las solicitudes de financiamiento a Google Sheets para procesamiento en AppSheet.

## ⚡ INICIO RÁPIDO - 3 Comandos

**Todas las credenciales ya están configuradas. Solo ejecuta:**

```bash
cd supabase/functions/google-sheets-sync

# 1. Configurar secretos (30 seg)
./configure-now.sh

# 2. Desplegar (30 seg)
./deploy.sh

# 3. Probar (30 seg)
./test.sh
```

**Tiempo total: 2 minutos** ⏱️

> 📖 **Instrucciones detalladas**: [DEPLOY_NOW.md](./DEPLOY_NOW.md)

---

## 📋 Pre-requisito

Instala Supabase CLI:

```bash
# macOS
brew install supabase/tap/supabase

# O con npm
npm install -g supabase
```

---

## ⚠️ IMPORTANTE: Compartir Google Sheet

Tu Google Sheet debe estar compartido con:

```
trefacreditos@iatrefa.iam.gserviceaccount.com
```

**Permisos**: Editor

**Link de tu sheet**:
```
https://docs.google.com/spreadsheets/d/1aLWGZe-DiupfHFTk36D7Rxh83dyPMH5waj5Bmk9WD48/edit
```

### Cómo compartir:
1. Abre el Google Sheet (link arriba)
2. Click en "Compartir" (botón verde arriba a la derecha)
3. Pega: `trefacreditos@iatrefa.iam.gserviceaccount.com`
4. Selecciona "Editor" en el dropdown
5. **Desmarcar** "Notificar personas"
6. Click "Compartir"

---

## 📊 ¿Qué hace esta función?

Cuando un usuario envía una solicitud de financiamiento:

1. ✅ Se guarda en Supabase (fuente principal)
2. ✅ Se dispara un trigger automático
3. ✅ Se envía a Google Sheets (1-2 segundos)
4. ✅ Aparece como una nueva fila con **60+ columnas**

### Columnas incluidas:

- **Información Personal**: Nombre, RFC, teléfono, email, fecha de nacimiento
- **Direcciones**: Domicilio actual y del perfil
- **Empleo**: Empresa, puesto, ingresos, antigüedad
- **Referencias**: Contactos de amistad y familiares
- **Vehículo**: Modelo, precio, enganche, mensualidad
- **Financiamiento**: Plazo, enganche, mensualidad estimada
- **Asesor**: Nombre y ID del asesor asignado

---

## 📁 Estructura de Archivos

```
supabase/functions/google-sheets-sync/
├── 📘 README_INICIO.md          ← EMPIEZA AQUÍ
├── 🚀 DEPLOY_NOW.md             ← Guía de despliegue rápido
├── 🔧 configure-now.sh          ← Configurar secretos (ya tiene credenciales)
├── 🚀 deploy.sh                 ← Desplegar función + migración
├── 🧪 test.sh                   ← Probar integración
│
├── 📚 GUIA_CONFIGURACION.md     ← Documentación completa en español
├── 📚 SETUP_GUIDE.md            ← Setup guide (inglés)
├── 📚 README.md                 ← Documentación técnica detallada
├── 📚 QUICK_START.md            ← Quick start guide
│
├── 💻 index.ts                  ← Código de la función (400+ líneas)
└── ⚙️  deno.json                 ← Configuración Deno
```

---

## 🎯 Configuración del Proyecto

Ya está todo pre-configurado:

- **Proyecto ID**: jjepfehmuybpctdzipnu
- **URL**: https://jjepfehmuybpctdzipnu.supabase.co
- **Google Sheet ID**: 1aLWGZe-DiupfHFTk36D7Rxh83dyPMH5waj5Bmk9WD48
- **Cuenta de Servicio**: trefacreditos@iatrefa.iam.gserviceaccount.com
- **Sheet Tab**: Applications

---

## 🎬 Pasos Detallados

### 1️⃣ Configurar Secretos

```bash
./configure-now.sh
```

Este script configura automáticamente:
- ✅ `GOOGLE_SHEETS_CREDENTIALS` - Credenciales de la cuenta de servicio
- ✅ `GOOGLE_SHEET_ID` - ID del sheet de Google
- ✅ `GOOGLE_SHEET_NAME` - Nombre de la pestaña ("Applications")

### 2️⃣ Desplegar

```bash
./deploy.sh
```

Este script automáticamente:
- ✅ Despliega la Edge Function a Supabase
- ✅ Aplica la migración de base de datos (crea el trigger)
- ✅ Configura la URL de la función en PostgreSQL
- ✅ Verifica que todo esté funcionando

### 3️⃣ Probar

```bash
./test.sh
```

Este script:
- ✅ Envía una solicitud de prueba a la función
- ✅ Muestra la respuesta (éxito/error)
- ✅ Te indica dónde verificar en Google Sheets

---

## 🔍 Verificación

### Ver Logs en Tiempo Real

```bash
supabase functions logs google-sheets-sync --project-ref jjepfehmuybpctdzipnu --follow
```

### Verificar Trigger en Base de Datos

```sql
-- Ejecuta en Supabase SQL Editor
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_application_sync_to_sheets';
```

### Ver Solicitudes HTTP Recientes

```sql
-- Ejecuta en Supabase SQL Editor
SELECT *
FROM net._http_response
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🚨 Solución de Problemas

### ❌ Error: "Failed to append to Google Sheet"

**Causa más común**: El Google Sheet no está compartido con la cuenta de servicio

**Solución**:
1. Abre https://docs.google.com/spreadsheets/d/1aLWGZe-DiupfHFTk36D7Rxh83dyPMH5waj5Bmk9WD48/edit
2. Click "Compartir"
3. Agrega `trefacreditos@iatrefa.iam.gserviceaccount.com` como Editor
4. Ejecuta `./test.sh` de nuevo

### ❌ Error: "GOOGLE_SHEETS_CREDENTIALS is not set"

**Solución**:
```bash
./configure-now.sh
```

### ❌ Trigger no se activa

**Solución**:
```bash
supabase db push --project-ref jjepfehmuybpctdzipnu
```

---

## 📈 Monitoreo

### Dashboard de Supabase

- **Proyecto**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu
- **Logs de la Función**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/functions/google-sheets-sync/logs
- **Configuración**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/functions

### Google Sheet

- **URL**: https://docs.google.com/spreadsheets/d/1aLWGZe-DiupfHFTk36D7Rxh83dyPMH5waj5Bmk9WD48/edit

---

## 📚 Documentación Adicional

- [DEPLOY_NOW.md](./DEPLOY_NOW.md) - Guía de despliegue paso a paso
- [GUIA_CONFIGURACION.md](./GUIA_CONFIGURACION.md) - Documentación completa en español
- [README.md](./README.md) - Documentación técnica detallada
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Setup guide en inglés

---

## 💡 Siguiente Paso: AppSheet

Una vez que los datos estén sincronizándose a Google Sheets:

1. Ve a https://www.appsheet.com/
2. Crea una nueva app
3. Conecta con tu Google Sheet
4. AppSheet detectará automáticamente las columnas
5. Personaliza vistas y flujos de trabajo

---

## ✅ Checklist de Despliegue

- [ ] Supabase CLI instalado
- [ ] Google Sheet compartido con `trefacreditos@iatrefa.iam.gserviceaccount.com`
- [ ] Ejecutado `./configure-now.sh`
- [ ] Ejecutado `./deploy.sh`
- [ ] Ejecutado `./test.sh`
- [ ] Verificado que aparece fila de prueba en Google Sheet
- [ ] Enviado solicitud real desde la app
- [ ] Verificado que sincroniza en 1-2 segundos

---

## 🎉 ¡Eso es Todo!

Una vez completado el checklist, tu sistema estará sincronizando automáticamente todas las solicitudes a Google Sheets.

**¿Preguntas?** Revisa la documentación completa o los logs de error.

**¿Todo funcionando?** ¡Excelente! Ahora puedes procesar solicitudes desde Google Sheets o AppSheet.
