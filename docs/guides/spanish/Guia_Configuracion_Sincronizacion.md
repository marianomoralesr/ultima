Guía de Configuración - Sincronización con Google Sheets
 
Esta guía te ayudará a configurar la sincronización automática de solicitudes de financiamiento desde Supabase a Google Sheets para su procesamiento en AppSheet.
 
## ⚡ Configuración Rápida (5 minutos)
 
### 1. Crear Cuenta de Servicio de Google (2 min)
 
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **API de Google Sheets**:
   - Ve a "APIs y Servicios" > "Biblioteca"
   - Busca "Google Sheets API"
   - Haz clic en "Habilitar"
 
4. Crea una Cuenta de Servicio:
   - Ve a "APIs y Servicios" > "Credenciales"
   - Haz clic en "Crear Credenciales" > "Cuenta de Servicio"
   - Nómbrala: `supabase-sheets-sync`
   - Haz clic en "Crear y Continuar"
   - Omite los pasos opcionales y haz clic en "Listo"
 
5. Crea una Clave para la Cuenta de Servicio:
   - Haz clic en la cuenta de servicio que acabas de crear
   - Ve a la pestaña "Claves"
   - Haz clic en "Agregar Clave" > "Crear clave nueva"
   - Elige el formato **JSON**
   - Haz clic en "Crear" - esto descargará un archivo JSON
   - **¡Guarda este archivo de forma segura!**
 
**Importante**: Abre el archivo JSON y copia el valor de `client_email` (lo necesitarás en el paso 2)
 
Ejemplo: `supabase-sheets-sync@tu-proyecto.iam.gserviceaccount.com`
 
### 2. Crear y Compartir Google Sheet (1 min)
 
1. Crea una nueva Hoja de Cálculo de Google:
   - Ve a [Google Sheets](https://sheets.google.com)
   - Crea una nueva hoja en blanco
   - Nómbrala: "Solicitudes de Financiamiento" (o como prefieras)
   - Anota el ID de la hoja desde la URL: `https://docs.google.com/spreadsheets/d/{ID_HOJA}/edit`
   - Anota el nombre de la pestaña (por defecto es "Hoja 1", puedes renombrarla a "Applications")
 
2. Comparte la hoja con tu Cuenta de Servicio:
   - En tu Google Sheet, haz clic en "Compartir"
   - Pega el email de la cuenta de servicio (del paso 1)
   - Dale permisos de **Editor**
   - Desmarca "Notificar personas"
   - Haz clic en "Compartir"
 
**Importante**: Copia el ID de la hoja (la parte larga en la URL)
 
### 3. Configurar Secretos en Supabase (1 min)
 
Ejecuta estos comandos en tu terminal (desde la raíz del proyecto):
 
```bash
# Configurar las credenciales de la cuenta de servicio
# Reemplaza la ruta con la ubicación de tu archivo JSON
supabase secrets set GOOGLE_SHEETS_CREDENTIALS="$(cat ruta/a/tu-service-account-key.json)"
 
# Configurar el ID de tu Google Sheet
# Reemplaza con el ID que copiaste en el paso 2
supabase secrets set GOOGLE_SHEET_ID="tu-id-de-hoja-aqui"
 
# Configurar el nombre de la pestaña (opcional, por defecto es "Applications")
supabase secrets set GOOGLE_SHEET_NAME="Applications"
```
 
**Nota**: Si prefieres usar otro nombre para la pestaña (ej: "Solicitudes"), usa ese nombre en lugar de "Applications"
 
### 4. Desplegar Todo (1 min)
 
```bash
# Desplegar la función edge
supabase functions deploy google-sheets-sync
 
# Aplicar la migración de base de datos
supabase db push
 
# Actualizar la URL de la función en la base de datos
# Reemplaza 'tu-referencia-proyecto' con tu referencia real de Supabase
# La encuentras en: Panel de Supabase > Configuración del Proyecto > API
supabase db execute --query "ALTER DATABASE postgres SET app.settings.supabase_url = 'https://tu-referencia-proyecto.supabase.co';"
```
 
### 5. ¡Probar! (30 segundos)
 
Envía una solicitud de prueba a través de tu aplicación, luego verifica:
 
```bash
# Ver los logs en tiempo real
supabase functions logs google-sheets-sync --follow
 
# ¡Revisa tu Google Sheet - deberías ver una nueva fila!
```
 
## ✅ Lista de Verificación
 
- [ ] La API de Google Sheets está habilitada en Google Cloud Console
- [ ] Descargaste la clave JSON de la cuenta de servicio
- [ ] Creaste la hoja de cálculo de Google y la compartiste con el email de la cuenta de servicio
- [ ] Copiaste el ID de la hoja desde la URL
- [ ] Configuraste los tres secretos en Supabase (verifica con `supabase secrets list`)
- [ ] Desplegaste la función edge (verifica con `supabase functions list`)
- [ ] Aplicaste la migración de base de datos
- [ ] Configuraste la URL de la función en la base de datos
- [ ] Una solicitud de prueba aparece en tu Google Sheet
 
## 🚨 Solución de Problemas
 
### Error: "GOOGLE_SHEETS_CREDENTIALS is not set"
```bash
# Verifica que los secretos estén configurados
supabase secrets list
 
# Si falta alguno, configúralo de nuevo
supabase secrets set GOOGLE_SHEETS_CREDENTIALS="$(cat tu-archivo-key.json)"
```
 
### Error: "Failed to append to Google Sheet"
- Asegúrate de que el ID de la hoja sea correcto
- Verifica que el email de la cuenta de servicio tenga acceso de Editor a la hoja
- Verifica que el nombre de la pestaña coincida con GOOGLE_SHEET_NAME
 
### El trigger no se activa
```sql
-- Verifica que el trigger exista
SELECT tgname FROM pg_trigger WHERE tgname = 'on_application_sync_to_sheets';
 
-- Si falta, ejecuta la migración de nuevo
```
 
### Ver logs detallados
```bash
# Logs de la función edge
supabase functions logs google-sheets-sync --follow
 
# Logs de la base de datos
supabase db logs
 
# Verificar la cola de pg_net
supabase db execute --query "SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 10;"
```
 
## 📊 Estructura de Columnas
 
La primera vez que se sincroniza una solicitud, la función creará automáticamente estas columnas:
 
### Metadatos de la Solicitud
- Application ID (ID de Solicitud)
- User ID (ID de Usuario)
- Status (Estado)
- Created At (Fecha de Creación)
- Updated At (Fecha de Actualización)
- Selected Banks (Bancos Seleccionados)
 
### Información Personal
- First Name (Nombre)
- Last Name (Apellido Paterno)
- Mother Last Name (Apellido Materno)
- Full Name (Nombre Completo)
- Email (Correo Electrónico)
- Phone (Teléfono)
- RFC
- Homoclave
- Birth Date (Fecha de Nacimiento)
- Civil Status (Estado Civil)
- Spouse Name (Nombre del Cónyuge)
- Fiscal Situation (Situación Fiscal)
 
### Direcciones
- Profile Address (Dirección del Perfil)
- Profile Colony (Colonia del Perfil)
- Profile City (Ciudad del Perfil)
- Profile State (Estado del Perfil)
- Profile Zip Code (Código Postal del Perfil)
- Current Address (Dirección Actual)
- Current Colony (Colonia Actual)
- Current City (Ciudad Actual)
- Current State (Estado Actual)
- Current Zip Code (Código Postal Actual)
- Time at Address (Tiempo en el Domicilio)
- Housing Type (Tipo de Vivienda)
 
### Información Personal Adicional
- Education Level (Nivel de Estudios)
- Dependents (Dependientes Económicos)
 
### Información Laboral
- Fiscal Classification (Clasificación Fiscal)
- Company Name (Nombre de la Empresa)
- Company Phone (Teléfono de la Empresa)
- Supervisor Name (Nombre del Jefe Inmediato)
- Company Website (Sitio Web de la Empresa)
- Company Address (Dirección de la Empresa)
- Company Industry (Sector o Industria)
- Job Title (Puesto)
- Job Seniority (Antigüedad en el Puesto)
- Net Monthly Income (Ingreso Mensual Neto)
 
### Referencias
- Friend Reference Name (Nombre Referencia de Amistad)
- Friend Reference Phone (Teléfono Referencia de Amistad)
- Friend Reference Relationship (Relación Referencia de Amistad)
- Family Reference Name (Nombre Referencia Familiar)
- Family Reference Phone (Teléfono Referencia Familiar)
- Family Relationship (Parentesco)
 
### Preferencias de Financiamiento
- Loan Term (Months) (Plazo del Crédito en Meses)
- Down Payment (Enganche)
- Estimated Monthly Payment (Mensualidad Estimada)
 
### Información del Vehículo
- Vehicle Title (Título del Vehículo)
- Orden Compra
- Vehicle Price (Precio del Vehículo)
- Recommended Down Payment (Enganche Recomendado)
- Min Down Payment (Enganche Mínimo)
- Recommended Monthly Payment (Mensualidad Recomendada)
- Max Term (Plazo Máximo)
- Vehicle Image URL (URL de Imagen del Vehículo)
 
### Consentimientos
- Terms Accepted (Términos Aceptados)
- Survey Consent (Consentimiento de Encuesta)
 
### Información del Asesor
- Assigned Advisor ID (ID del Asesor Asignado)
- Advisor Name (Nombre del Asesor)
 
**Total: 60+ columnas con todos los datos de la solicitud**
 
## 🎯 Siguientes Pasos
 
### 1. Personalizar tu Hoja de Cálculo
 
Una vez que tengas datos sincronizándose:
 
- **Congela la fila de encabezados**: Ver > Congelar > 1 fila
- **Agrega filtros**: Selecciona la fila de encabezados > Datos > Crear un filtro
- **Formato condicional**: Colorea filas según el estado de la solicitud
- **Crea vistas filtradas**: Para ver solo solicitudes "submitted", "approved", etc.
 
### 2. Conectar con AppSheet
 
1. Ve a [AppSheet](https://www.appsheet.com/)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Crear" > "App" > "Start with your own data"
4. Elige "Google Sheets" como fuente de datos
5. Selecciona tu hoja "Solicitudes de Financiamiento"
6. AppSheet detectará automáticamente las columnas y creará una app
7. Personaliza las vistas y flujos de trabajo según tus necesidades
 
### 3. Sincronizar Solicitudes Existentes (Opcional)
 
Si ya tienes solicitudes en tu base de datos y quieres sincronizarlas:
 
```sql
-- Ejecuta esto en el Editor SQL de Supabase
-- Sincronizará todas las solicitudes enviadas a Google Sheets
SELECT net.http_post(
  url := 'https://tu-referencia-proyecto.supabase.co/functions/v1/google-sheets-sync',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'role'
  ),
  body := jsonb_build_object(
    'record', row_to_json(fa)
  )
)
FROM financing_applications fa
WHERE status IN ('submitted', 'reviewing', 'pending_docs', 'approved', 'rejected')
ORDER BY created_at ASC;
```
 
**Nota**: Esto enviará todas las solicitudes a Google Sheets. Puede tomar algunos minutos si tienes muchas solicitudes.
 
### 4. Configurar Alertas (Opcional)
 
Puedes configurar notificaciones por email cuando lleguen nuevas solicitudes:
 
1. En Google Sheets: Herramientas > Reglas de notificación
2. Selecciona "Se realiza algún cambio"
3. Elige recibir notificaciones inmediatas por email
4. Guarda la regla
 
## 🔒 Notas de Seguridad
 
- ✅ Las credenciales de la cuenta de servicio se almacenan de forma segura en Supabase (encriptadas en reposo)
- ✅ La función edge usa HTTPS para todas las llamadas API
- ✅ El trigger de base de datos tiene manejo de errores para prevenir pérdida de datos
- ✅ La cuenta de servicio tiene permisos mínimos (solo acceso a la API de Sheets)
- ⚠️ Los datos en Google Sheet son accesibles para cualquiera con el enlace - restringe el uso compartido apropiadamente
- ⚠️ Considera usar las funciones de seguridad integradas de AppSheet para datos sensibles
 
## 📈 Monitoreo
 
### Ver el Estado de la Sincronización
 
```bash
# Ver logs de la función en tiempo real
supabase functions logs google-sheets-sync --follow
 
# Ver respuestas HTTP recientes
supabase db execute --query "SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 20;"
```
 
### Verificar que el Trigger Esté Funcionando
 
```sql
-- En el Editor SQL de Supabase
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_application_sync_to_sheets';
```
 
## 💡 Consejos para Stakeholders
 
### ¿Por qué Google Sheets + AppSheet?
 
1. **Accesibilidad**: Todos conocen Google Sheets - fácil de ver y entender datos
2. **Flexibilidad**: Puedes crear filtros, gráficos y reportes personalizados
3. **AppSheet**: Crea aplicaciones móviles sin código para procesar solicitudes en campo
4. **Colaboración**: Múltiples personas pueden ver y trabajar con los datos
5. **Backup**: Tienes una copia de seguridad de todas las solicitudes fuera de Supabase
 
### ¿Qué tan rápido se sincronizan los datos?
 
- **Tiempo real**: La sincronización ocurre 1-2 segundos después de que el usuario envía la solicitud
- **No bloquea**: El usuario no tiene que esperar - la sincronización es asíncrona
- **Confiable**: Si falla, se registra el error pero no afecta la experiencia del usuario
 
### ¿Qué pasa si hay un error?
 
- La solicitud **siempre se guarda** en la base de datos de Supabase (fuente principal)
- Si Google Sheets falla, se registra el error en los logs
- Puedes volver a sincronizar manualmente las solicitudes que fallaron
- El sistema está diseñado para **nunca perder datos**
 
## 🔗 Recursos Útiles
 
- [Documentación Completa (Técnica)](./README.md)
- [Documentación de la API de Google Sheets](https://developers.google.com/sheets/api)
- [Documentación de Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentación de AppSheet](https://help.appsheet.com/)
- [Tutoriales de AppSheet en Español](https://www.youtube.com/c/AppSheet)
 
## 📞 Soporte
 
Si encuentras algún problema durante la configuración:
 
1. **Revisa los logs primero**: `supabase functions logs google-sheets-sync --follow`
2. **Verifica la configuración**: Todos los secretos de Supabase están configurados
3. **Prueba la función directamente**: Usa el comando curl del README técnico
4. **Revisa los logs de Google Cloud Console**: Por errores de autenticación
5. **Contacta al equipo técnico**: Con los logs y el mensaje de error específico
 
---
 
**¿Necesitas ayuda?** Consulta el [README técnico completo](./README.md) para documentación detallada y solución de problemas avanzada.
 
## 📝 Resumen Ejecutivo
 
Esta solución proporciona:
 
✅ **Sincronización automática** de solicitudes a Google Sheets
✅ **60+ campos** organizados en columnas claras
✅ **Tiempo real** - datos disponibles en 1-2 segundos
✅ **Seguro** - credenciales encriptadas, no expuestas
✅ **Escalable** - maneja miles de solicitudes sin problemas
✅ **Confiable** - nunca pierde datos, tiene manejo de errores
✅ **Fácil de usar** - stakeholders pueden ver datos en Google Sheets
✅ **Integración AppSheet** - crea apps móviles sin código
 
**Tiempo de implementación**: 5 minutos
**Mantenimiento requerido**: Mínimo (casi cero)
**Costo adicional**: $0 (usa infraestructura existente)