# Debug: Verificación SMS

## 🔍 Paso 1: Verificar que los códigos se están guardando

Ejecuta este SQL en Supabase Dashboard:

```sql
-- Ver todos los códigos OTP generados (ordenados por más reciente)
SELECT
  id,
  phone,
  otp_code,
  verified,
  expires_at,
  created_at,
  (expires_at > NOW()) as is_valid
FROM sms_otp_codes
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado:** Deberías ver filas con los códigos que se enviaron.

## 🔍 Paso 2: Verificar la consola del navegador

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Completa el formulario de financiamientos
4. **Copia y pega aquí TODOS los mensajes que aparecen**

Busca específicamente estos mensajes:
- `📱 Sending SMS OTP to: ...`
- `✅ SMS OTP sent successfully`
- `🔐 Verifying SMS OTP...`
- `❌ SMS OTP Verification Error...`

## 🔍 Paso 3: Verificar el número de teléfono

Cuando completas el formulario, ¿qué número de teléfono ingresas?
- ¿10 dígitos? Ejemplo: 5512345678
- ¿Con código de país? Ejemplo: +525512345678

El sistema debe formatear automáticamente a: `+52XXXXXXXXXX`

## 🔍 Paso 4: Verificar el código SMS recibido

1. ¿Recibes el SMS?
2. ¿A qué número llega? (recuerda que en testing va al número de Twilio)
3. ¿Qué código tiene? (son 6 dígitos)

## 🔍 Paso 5: Probar manualmente la verificación

Una vez que tengas un código en la tabla, prueba verificarlo manualmente:

```sql
-- Reemplaza con el teléfono y código real que veas en la tabla
SELECT verify_sms_otp('+525512345678', '123456');
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Código verificado exitosamente",
  "phone": "+525512345678"
}
```

## 🐛 Posibles Problemas

### Problema 1: El código no se está guardando
**Síntoma:** La consulta SQL del Paso 1 no muestra ninguna fila
**Causa:** Error en la Edge Function al guardar el código
**Solución:** Revisar logs de Edge Function

### Problema 2: El formato del teléfono no coincide
**Síntoma:** El código existe pero no se encuentra al verificar
**Ejemplo:**
- Se guarda como: `+525512345678`
- Se busca como: `5512345678` o `+5215512345678`
**Solución:** Verificar los logs de consola para ver ambos números

### Problema 3: El código expiró
**Síntoma:** El código existe pero `is_valid = false`
**Causa:** Los códigos expiran en 10 minutos
**Solución:** Generar un nuevo código

### Problema 4: El código ya fue usado
**Síntoma:** `verified = true` en la tabla
**Causa:** Ya verificaste ese código antes
**Solución:** Solicitar un nuevo código

## 🧪 Test Completo

Voy a hacer un test completo contigo:

1. **Abre la consola del navegador (F12)**
2. **Ve a:** http://localhost:5173/financiamientos
3. **Completa el formulario** con:
   - Nombre: Test Usuario
   - Email: test@test.com
   - Teléfono: **5512345678** (anotar este número exacto)
4. **Click en Solicitar Pre-Aprobación**
5. **Copia todos los logs de consola aquí**
6. **Ve a Supabase Dashboard y ejecuta:**
```sql
SELECT * FROM sms_otp_codes
WHERE phone LIKE '%5512345678%'
ORDER BY created_at DESC LIMIT 5;
```
7. **Copia el resultado aquí**
8. **Ingresa el código** que veas en el resultado
9. **Copia los logs de verificación**

Con esto podremos identificar exactamente dónde falla.
