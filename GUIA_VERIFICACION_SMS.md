# Guía de Implementación: Verificación SMS para Nuevos Usuarios

## 📋 Resumen

Se ha implementado un sistema de verificación por SMS para usuarios que se registran por primera vez en la plataforma. Los usuarios existentes pueden seguir usando el sistema de OTP por email como siempre.

## 🎯 Funcionalidad

### Para Usuarios Nuevos (Registro)
1. El usuario accede a `/registro`
2. Completa el formulario con: nombre, apellido, teléfono y email
3. Acepta términos y condiciones
4. Se envía un código SMS de 6 dígitos a su teléfono
5. El usuario ingresa el código para verificar su número
6. Se crea la cuenta automáticamente

### Para Usuarios Existentes (Login)
- El flujo actual de OTP por email permanece sin cambios
- Acceden a `/acceder` o `/auth`
- Ingresan su email y reciben el código por correo

## 🔧 Componentes Técnicos

### 1. Base de Datos

**Tabla: `sms_otp_codes`**
```sql
- id: UUID (Primary Key)
- phone: TEXT (Número de teléfono con formato +52XXXXXXXXXX)
- otp_code: TEXT (Código de 6 dígitos)
- expires_at: TIMESTAMPTZ (Expira en 10 minutos)
- verified: BOOLEAN (Si el código fue verificado)
- verified_at: TIMESTAMPTZ (Cuándo se verificó)
- twilio_message_sid: TEXT (ID del mensaje de Twilio)
- created_at: TIMESTAMPTZ
- attempts: INT (Número de intentos)
```

**Funciones RPC:**
- `verify_sms_otp(p_phone TEXT, p_otp_code TEXT)`: Verifica un código OTP
- `cleanup_expired_sms_otp_codes()`: Limpia códigos expirados

### 2. Edge Function

**Función:** `send-sms-otp`
- **Ubicación:** `supabase/functions/send-sms-otp/index.ts`
- **Propósito:** Enviar códigos SMS usando Twilio
- **Configuración:**
  - TWILIO_ACCOUNT_SID: (Configurado en Supabase secrets)
  - TWILIO_AUTH_TOKEN: (Configurado en Supabase secrets)
  - TWILIO_MESSAGING_SERVICE_SID: (Configurado en Supabase secrets)

**Uso:**
```typescript
const { data, error } = await supabase.functions.invoke('send-sms-otp', {
  body: { phone: '+5255123456', otp: '123456' }
});
```

### 3. Frontend

**Página de Registro:** `/src/pages/RegisterPage.tsx`
- Formulario de registro con validación
- Verificación SMS en dos pasos
- Integración con Supabase Auth

**Ruta:** `/registro`

### 4. Configuración de Twilio

#### Mensajería Service
- **Service SID:** `MG40541813c90a3c423b23e282b98e2834`
- **Configuración Recomendada:**
  - Incoming Messages: **"Receive the message"** (no webhook necesario)
  - Autocreate Conversation: **Desactivado**
  - Status Callback URL: **Dejar vacío** (no necesario para OTP)

#### Número de Prueba
- **(781) 660-9063** (para testing)

## 📝 Flujo Completo de Registro

```
1. Usuario → /registro
   ↓
2. Completa formulario (nombre, apellido, teléfono, email)
   ↓
3. Click "Continuar" → Genera OTP de 6 dígitos
   ↓
4. Llama a send-sms-otp Edge Function
   ↓
5. Twilio envía SMS con código
   ↓
6. Código se guarda en sms_otp_codes
   ↓
7. Usuario ingresa código en pantalla de verificación
   ↓
8. Llama a verify_sms_otp() RPC
   ↓
9. Si es válido → Crea cuenta en Supabase Auth
   ↓
10. Actualiza perfil en tabla profiles
    ↓
11. Redirige a /auth para login
```

## 🔐 Seguridad

- **Expiración:** Códigos OTP expiran en 10 minutos
- **Verificación única:** Cada código solo se puede usar una vez
- **Row Level Security (RLS):** Políticas configuradas en tabla sms_otp_codes
- **Validación de teléfono:** Formato +52XXXXXXXXXX (México)

## 🧪 Testing

### Probar el flujo completo:

1. **Verificar que la función esté desplegada:**
```bash
npx supabase functions list
```

2. **Probar la Edge Function directamente:**
```bash
curl -X POST https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/send-sms-otp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone":"5512345678","otp":"123456"}'
```

3. **Verificar tabla en base de datos:**
```sql
SELECT * FROM sms_otp_codes ORDER BY created_at DESC LIMIT 10;
```

4. **Probar verificación de código:**
```sql
SELECT verify_sms_otp('+525512345678', '123456');
```

## 📦 Migraciones Aplicadas

- **20251203200000_create_sms_otp_system.sql**: Crea tabla, índices, políticas RLS y funciones

## 🚀 Despliegue

Para redesplegar la función SMS:
```bash
npx supabase functions deploy send-sms-otp
```

Para aplicar migraciones pendientes:
```bash
# Ejecutar el SQL en /tmp/create_sms_table.sql
# O usar el dashboard de Supabase → SQL Editor
```

## ⚙️ Configuración de Secrets

```bash
npx supabase secrets set \
  TWILIO_ACCOUNT_SID=<tu_account_sid> \
  TWILIO_AUTH_TOKEN=<tu_auth_token> \
  TWILIO_MESSAGING_SERVICE_SID=<tu_messaging_service_sid>
```

Obtén estos valores desde tu [Twilio Console](https://console.twilio.com/)

## 🔄 Mantenimiento

### Limpieza de códigos expirados
Ejecutar periódicamente (recomendado: diariamente):
```sql
SELECT cleanup_expired_sms_otp_codes();
```

### Monitoreo
- Ver logs de Edge Function en Supabase Dashboard
- Revisar delivery status en Twilio Console
- Monitorear tabla sms_otp_codes para intentos fallidos

## 📊 Diferencias entre Login y Registro

| Característica | Login (/acceder) | Registro (/registro) |
|----------------|------------------|----------------------|
| Verificación | Email OTP | SMS OTP |
| Para quién | Usuarios existentes | Usuarios nuevos |
| Campos requeridos | Email | Nombre, Apellido, Teléfono, Email |
| Flujo Auth | signInWithOtp() | signUp() + SMS verify |
| Términos | No requeridos | Aceptación obligatoria |

## 🎨 UI/UX

- **Diseño:** Basado en shadcn/ui register-04 block
- **Responsive:** Totalmente adaptable a móviles
- **Validaciones:** Tiempo real en el formulario
- **Feedback:** Mensajes claros de error/éxito
- **Navegación:** Link "¿No tienes cuenta?" en página de login

## ⚠️ Notas Importantes

1. **Solo para registro:** La verificación SMS solo aplica para nuevos usuarios
2. **Login sin cambios:** Usuarios existentes usan email OTP como siempre
3. **Formato teléfono:** Solo números mexicanos (+52) por ahora
4. **Costo:** Cada SMS tiene costo en Twilio (revisar plan)
5. **Rate limiting:** Considerar implementar límites de intentos por IP

## 🐛 Troubleshooting

### El SMS no llega
- Verificar que el número esté en formato correcto (+52XXXXXXXXXX)
- Revisar logs de la Edge Function
- Verificar balance y configuración en Twilio Console

### Error "Código inválido"
- Verificar que el código no haya expirado (10 min)
- Comprobar que el teléfono coincida exactamente
- Ver tabla sms_otp_codes para debugear

### Usuario no puede registrarse
- Verificar que el email no esté ya registrado
- Revisar logs de Supabase Auth
- Comprobar políticas RLS en tabla profiles

## 📚 Referencias

- [Documentación Twilio Messaging](https://www.twilio.com/docs/messaging)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

**Última actualización:** 3 de diciembre de 2025
**Versión:** 1.0.0
