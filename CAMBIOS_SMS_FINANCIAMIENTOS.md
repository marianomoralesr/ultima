# Cambios: Verificación SMS en Landing Page de Financiamientos

## 📝 Resumen

Se ha actualizado el formulario de registro en la landing page `/financiamientos` para usar **verificación por SMS** en lugar de email OTP.

## 🔄 Cambios Realizados

### 1. Modificación del Flujo de Registro

**Antes:**
1. Usuario completa formulario → Se envía OTP por **email**
2. Usuario ingresa código de email
3. Se crea/actualiza perfil

**Ahora:**
1. Usuario completa formulario → Se envía OTP por **SMS**
2. Usuario ingresa código recibido por mensaje de texto
3. Se verifica SMS con la función `verify_sms_otp()`
4. Se crea cuenta de usuario
5. Se actualiza perfil en base de datos

### 2. Archivo Modificado

**`src/pages/FinanciamientosPage.tsx`**

#### Cambios en `onSubmit`:
```typescript
// ANTES: Enviaba email OTP
const { error: otpError } = await supabase.auth.signInWithOtp({
  email: data.email,
  options: { shouldCreateUser: true }
});

// AHORA: Envía SMS OTP
const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-otp', {
  body: {
    phone: formattedPhone,
    otp: generatedOtp
  }
});
```

#### Cambios en `handleOtpVerification`:
```typescript
// ANTES: Verificaba email OTP
const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
  email: formDataCache.email,
  token: otp,
  type: 'email'
});

// AHORA: Verifica SMS OTP
const { data: verifyData, error: verifyError } = await supabase.rpc('verify_sms_otp', {
  p_phone: formattedPhone,
  p_otp_code: otp
});
```

#### Cambios en la UI:
```typescript
// ANTES
<h2>Verifica tu correo</h2>
<p>Hemos enviado un código de 6 dígitos a {formDataCache?.email}</p>

// AHORA
<h2>Verifica tu teléfono</h2>
<p>Hemos enviado un código de 6 dígitos por SMS a {formDataCache?.phone}</p>
```

## 🎯 Flujo Completo Actualizado

```
Usuario en /financiamientos
         ↓
Completa formulario (nombre, email, teléfono)
         ↓
Submit → Genera OTP aleatorio (6 dígitos)
         ↓
Llama a Edge Function: send-sms-otp
         ↓
Twilio envía SMS al teléfono del usuario
         ↓
Código se guarda en tabla sms_otp_codes
         ↓
Pantalla de verificación (ingresa código SMS)
         ↓
Verifica con RPC: verify_sms_otp()
         ↓
¿Código válido? → Sí
         ↓
Crea usuario con signUp()
         ↓
Actualiza perfil en tabla profiles
         ↓
Guarda lead en tabla leads
         ↓
Muestra mensaje de éxito
         ↓
Tracking con Facebook Pixel y GTM
```

## ✅ Ventajas del Cambio

1. **Verificación más rápida**: SMS llega en segundos vs minutos del email
2. **Mejor experiencia móvil**: Código llega directo al dispositivo
3. **Mayor seguridad**: Verificación de número de teléfono real
4. **Reduce fricción**: Un solo paso de verificación
5. **Menos spam**: No depende de filtros de email

## 🧪 Cómo Probar

### 1. Acceder a la landing page:
```
http://localhost:5173/financiamientos
```

### 2. Completar el formulario:
- **Nombre completo**: Tu Nombre Completo
- **Email**: tu@email.com
- **Teléfono**: 5512345678 (10 dígitos)
- ✓ Acepto términos
- ✓ Soy mayor de 21 años

### 3. Click "Solicitar Pre-Aprobación"
- Se enviará SMS al número **(781) 660-9063** (número de prueba de Twilio)
- Espera unos segundos para recibir el código

### 4. Ingresar código de 6 dígitos
- Recibirás un mensaje: "Tu código de verificación TREFA es: 123456"
- Ingresa el código en la pantalla

### 5. Verificación exitosa
- Se crea tu cuenta automáticamente
- Se muestra mensaje de éxito
- Datos guardados en `profiles` y `leads`

## 📊 Tablas Afectadas

### `sms_otp_codes`
Almacena los códigos OTP enviados por SMS:
- `phone`: Número de teléfono (+52XXXXXXXXXX)
- `otp_code`: Código de 6 dígitos
- `expires_at`: Expira en 10 minutos
- `verified`: Boolean (si fue verificado)

### `profiles`
Se actualiza con los datos del formulario:
- `first_name`, `last_name`, `mother_last_name`
- `email`
- `phone`
- Datos de tracking (UTM, referrer, etc.)

### `leads`
Se crea un registro nuevo:
- `user_id`: ID del usuario creado
- `nombre`, `email`, `telefono`
- `source`: financiamientos-landing
- `metadata`: Tracking completo

## 🔐 Seguridad

- ✅ Códigos OTP expiran en 10 minutos
- ✅ Cada código solo se puede usar una vez
- ✅ Validación de formato de teléfono
- ✅ RLS habilitado en tabla `sms_otp_codes`
- ✅ Funciones con `SECURITY DEFINER`

## ⚠️ Consideraciones

### Costos
- Cada SMS tiene un costo en Twilio (~$0.0075 USD por SMS en México)
- Monitorear uso mensual en Twilio Console

### Rate Limiting
- Considerar agregar límites por IP/teléfono
- Prevenir abuso del sistema de SMS

### Números Internacionales
- Actualmente solo soporta números mexicanos (+52)
- Para otros países, ajustar el código de formato

### Testing
- Usar el número de prueba de Twilio: **(781) 660-9063**
- En producción, todos los números reales funcionarán

## 🐛 Troubleshooting

### "Error al enviar código SMS"
- Verificar que la Edge Function esté desplegada
- Revisar logs en Supabase Dashboard
- Confirmar secrets de Twilio configurados

### "Código inválido o expirado"
- Verificar que el código no haya pasado 10 minutos
- Comprobar formato del teléfono
- Revisar tabla `sms_otp_codes` en la base de datos

### "No llega el SMS"
- Esperar hasta 30 segundos (puede haber demora)
- Verificar que el número sea válido
- Revisar logs de Twilio Console

## 📚 Archivos Relacionados

- `/src/pages/FinanciamientosPage.tsx` - Página modificada
- `/supabase/functions/send-sms-otp/index.ts` - Edge Function SMS
- `/supabase/migrations/20251203200000_create_sms_otp_system.sql` - Tabla y funciones
- `/GUIA_VERIFICACION_SMS.md` - Guía completa del sistema

## 🚀 Deployment

Los cambios están listos para testing local. Para producción:

1. **Commit los cambios:**
```bash
git add src/pages/FinanciamientosPage.tsx
git commit -m "feat: Implementar verificación SMS en landing de financiamientos"
```

2. **Verificar que la Edge Function esté desplegada:**
```bash
npx supabase functions list
```

3. **Aplicar migración de tabla SMS (si no está aplicada):**
- Ir a Supabase Dashboard → SQL Editor
- Ejecutar contenido de `20251203200000_create_sms_otp_system.sql`

4. **Deploy:**
```bash
git push
```

## 📈 Métricas a Monitorear

Después del deployment, revisar:
- Tasa de éxito de SMS (delivery rate)
- Tiempo promedio de verificación
- Tasa de conversión del formulario
- Costos de SMS por lead generado
- Errores en Edge Function logs

---

**Fecha de implementación:** 3 de diciembre de 2025
**Versión:** 1.0.0
**Desarrollado por:** Claude Code
