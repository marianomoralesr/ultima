# Validación de Email en Página de Acceso

**Fecha:** 4 de Diciembre, 2025
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen

Se ha implementado validación de email antes de enviar el código OTP en la página `/acceder`. Los usuarios con emails no registrados son redirigidos automáticamente a la página de registro con un mensaje amigable e informativo.

---

## 🎯 Objetivo

Mejorar la experiencia del usuario verificando si el email existe en la base de datos **antes** de enviar el código OTP, evitando confusión y proporcionando un flujo claro hacia el registro para nuevos usuarios.

---

## ✅ Cambios Implementados

### 1. Validación de Email en AuthPage.tsx

**Archivo:** `src/pages/AuthPage.tsx:164-298`

#### Flujo de Validación:

```typescript
// PASO 1: Validar formato de email
if (!emailRegex.test(email)) {
    setError('Por favor, ingresa un correo electrónico válido.');
    return;
}

// PASO 2: Verificar si el email existe en la base de datos
const { data: existingUser, error: checkError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

// PASO 3: Si no existe, mostrar mensaje amigable
if (!existingUser) {
    // Mostrar UI con botón para registrarse
}

// PASO 4: Si existe, enviar OTP normalmente
await supabase.auth.signInWithOtp({ email, options });
```

---

## 🎨 Experiencia de Usuario

### Caso 1: Email No Registrado

**Mensaje mostrado:**
```
🔍 No encontramos una cuenta con este correo

El correo user@example.com no está registrado en nuestro sistema.

¿Es tu primera vez aquí? ¡Genial! Crear tu cuenta es rápido y gratis.

[Botón: Crear mi cuenta →]
[Botón: Intentar con otro correo]
```

**Características:**
- ✅ Mensaje claro y amigable
- ✅ Tono positivo ("¡Genial!")
- ✅ Call-to-action prominente
- ✅ Opción de intentar con otro email
- ✅ Preserva todos los URL params (UTM, ordencompra, etc.)
- ✅ Pre-llena el email en el formulario de registro

---

### Caso 2: Email Registrado

**Flujo:**
1. ✅ Email encontrado en la base de datos
2. ✅ Se envía código OTP al email
3. ✅ Usuario procede a verificar el código
4. ✅ Acceso exitoso

---

## 🔧 Detalles Técnicos

### Estado de Error Actualizado

```typescript
// Antes
const [error, setError] = useState<string | null>(null);

// Después
const [error, setError] = useState<string | React.ReactNode | null>(null);
```

**Razón:** Permitir mostrar componentes React (botones, divs) dentro del mensaje de error, no solo texto plano.

---

### Renderizado de Error Mejorado

**Vista de Sign In:**
```tsx
{error && (
    <div className="text-red-600 text-sm p-3 rounded-md mb-4 bg-red-50 border border-red-200">
        {typeof error === 'string' ? <p className="text-center">{error}</p> : error}
    </div>
)}
```

**Vista de Verify OTP:**
```tsx
{error && (
    <div className="text-red-600 text-sm sm:text-base p-3 rounded-md mt-4 bg-red-50 border border-red-200">
        {typeof error === 'string' ? error : error}
    </div>
)}
```

---

### Pre-llenado de Email en Registro

**Archivo:** `src/pages/RegisterPage.tsx:99-104`

```typescript
// Pre-llenar email si viene en los params (desde AuthPage)
const emailParam = params.get('email');
if (emailParam) {
    setEmail(decodeURIComponent(emailParam));
    console.log('📧 Email pre-llenado desde URL:', emailParam);
}
```

**URL de redirección:**
```
/registro?utm_source=google&ordencompra=123&email=user%40example.com
```

---

## 📊 Casos de Uso Cubiertos

### ✅ Usuario Nuevo (Primera Vez)
1. Ingresa email en `/acceder`
2. Sistema detecta que no existe
3. Ve mensaje amigable con contexto
4. Click en "Crear mi cuenta"
5. Redirigido a `/registro` con email pre-llenado
6. Completa registro exitosamente

### ✅ Usuario Existente
1. Ingresa email en `/acceder`
2. Sistema encuentra el email
3. Envía código OTP
4. Verifica código
5. Accede a su cuenta

### ✅ Preservación de Context
- ✅ UTM parameters preservados
- ✅ OrdenCompra preservada
- ✅ RFDM source preservado
- ✅ FBCLID preservado
- ✅ Email pre-llenado en registro

---

## 🔐 Seguridad

### Validaciones Implementadas:

1. **Formato de Email**
   ```typescript
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   ```

2. **Normalización**
   ```typescript
   email.toLowerCase().trim()
   ```

3. **Query Seguro**
   ```typescript
   .maybeSingle() // No arroja error si no encuentra nada
   ```

4. **shouldCreateUser: false**
   - Previene creación accidental de usuarios
   - Usuarios deben registrarse explícitamente

---

## 📝 Logging y Debug

### Console Logs Agregados:

```typescript
console.log('🔍 Verificando si el email existe en la base de datos:', email);
console.log('❌ Email no encontrado en la base de datos');
console.log('✅ Email encontrado en la base de datos, procediendo a enviar OTP');
console.log('📧 Enviando OTP a:', email);
console.log('✅ OTP enviado exitosamente a:', email);
```

---

## 🎯 Beneficios

### Para el Usuario:
1. ✅ **Claridad inmediata** - Sabe de inmediato si necesita registrarse
2. ✅ **Menos fricción** - No espera un código que nunca llegará
3. ✅ **Guía proactiva** - Se le indica exactamente qué hacer
4. ✅ **Experiencia sin frustración** - Mensajes amigables y positivos
5. ✅ **Proceso más rápido** - Email pre-llenado en registro

### Para el Negocio:
1. ✅ **Menos confusión** - Usuarios no reportan "no recibí el código"
2. ✅ **Mayor conversión** - Path claro hacia el registro
3. ✅ **Mejor onboarding** - Experiencia guiada
4. ✅ **Menos soporte** - Menos tickets de "código no llega"

---

## 🧪 Testing

### Escenarios a Probar:

1. ✅ Email nuevo → Muestra mensaje de registro
2. ✅ Email existente → Envía OTP normalmente
3. ✅ Email con mayúsculas → Normaliza correctamente
4. ✅ Email con espacios → Trim funciona
5. ✅ Preservación de UTM params → Todos se mantienen
6. ✅ Pre-llenado en registro → Email aparece automáticamente
7. ✅ Botón "Crear cuenta" → Redirige correctamente
8. ✅ Botón "Intentar con otro correo" → Limpia el formulario

---

## 🔄 Flujo Completo

```
Usuario ingresa email en /acceder
         |
         v
    ¿Email válido?
         |
    No ──┴── Sí
    |         |
    └─> Error v
         ¿Existe en DB?
              |
         No ──┴── Sí
         |         |
         v         v
    Mensaje    Enviar OTP
    amigable       |
         |         v
    [Crear   Verificar OTP
     cuenta]       |
         |         v
         └────> Éxito
```

---

## 📦 Archivos Modificados

1. **src/pages/AuthPage.tsx**
   - Línea 82: Cambio de tipo de `error`
   - Líneas 164-298: Nueva lógica de validación
   - Líneas 426-430: Renderizado mejorado de error (signIn)
   - Líneas 485-489: Renderizado mejorado de error (verifyOtp)

2. **src/pages/RegisterPage.tsx**
   - Líneas 99-104: Pre-llenado de email desde URL params

---

## 🚀 Próximos Pasos Recomendados

### Opcional - Mejoras Futuras:

1. **Sugerencias de Email**
   - Detectar typos comunes (gmail.con → gmail.com)
   - Mostrar sugerencia antes de validar

2. **Rate Limiting en Frontend**
   - Limitar intentos de verificación
   - Mostrar cooldown timer

3. **Analytics**
   - Trackear cuántos usuarios intentan con email no registrado
   - Medir tasa de conversión hacia registro

4. **A/B Testing**
   - Probar diferentes mensajes
   - Optimizar copy del CTA

---

## ✨ Resultado Final

La página `/acceder` ahora valida proactivamente si el email existe antes de enviar el código OTP, proporcionando una experiencia de usuario fluida, clara y sin fricciones. Los nuevos usuarios son guiados amablemente hacia el registro con toda la información preservada.

**Estado:** ✅ Completamente implementado y listo para producción
