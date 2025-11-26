# 🧪 Guía de Testing con Playwright - Flujo de Registro

## 📦 Archivos Creados

He creado **3 scripts de testing** para diferentes casos de uso:

### 1. `test_with_your_email.py` ⭐ **RECOMENDADO**

**Úsalo cuando:** Quieras probar el flujo de autenticación con tu email real

```bash
python3 test_with_your_email.py
```

**Qué hace:**
- Te pide tu email al inicio
- Envía el OTP a tu correo
- Espera a que ingreses el código manualmente
- Verifica que llegues a `/escritorio`
- Toma screenshots de todo el proceso

**Ejemplo de ejecución:**
```
🚀 TEST DE AUTENTICACIÓN CON OTP

📧 Ingresa tu email: mariano.morales@autostrefa.mx
✅ Usando email: mariano.morales@autostrefa.mx

→ PASO 1: Navegando a página de autenticación
✅ Página de autenticación cargada

→ PASO 2: Ingresando tu email
✅ Email ingresado

→ PASO 3: Solicitando código OTP
✅ Pantalla de OTP mostrada

⏳ AHORA INGRESA EL CÓDIGO OTP MANUALMENTE
1. Revisa tu email
2. Copia el código de 6 dígitos
3. Pégalo en el navegador
4. Presiona 'Verificar y Continuar'

⏰ Esperando hasta 3 minutos...

✅ TEST EXITOSO - OTP VERIFICADO
📍 Redirigido a: http://localhost:5173/escritorio/profile
```

---

### 2. `test_simple_auth.py`

**Úsalo cuando:** Quieras un test rápido con un email predefinido

```bash
python3 test_simple_auth.py
```

**Nota:** Edita la línea 31 del archivo para cambiar el email:
```python
test_email = "tu-email@gmail.com"  # Cambia esto
```

---

### 3. `test_registration_flow.py`

**Úsalo cuando:** Quieras probar el flujo COMPLETO desde landing hasta confirmación

```bash
python3 test_registration_flow.py
```

**Qué hace:**
- Landing de financiamientos
- Selección de auto
- Registro con email
- OTP (manual)
- Completar perfil
- Perfilación bancaria
- Solicitud de financiamiento
- Confirmación

⚠️ **Nota:** Este es el más complejo y puede fallar en pasos intermedios.

---

## 🚀 Cómo Ejecutar el Test (Método Recomendado)

### Paso 1: Asegúrate que el servidor esté corriendo

```bash
# En una terminal separada
npm run dev
```

Verifica que http://localhost:5173 esté funcionando.

### Paso 2: Ejecuta el test

```bash
cd /Users/marianomorales/Downloads/ultima\ copy
python3 test_with_your_email.py
```

### Paso 3: Ingresa tu email

Cuando veas el prompt:
```
📧 Ingresa tu email:
```

Escribe tu email y presiona Enter.

### Paso 4: Espera a que se abra el navegador

El navegador se abrirá automáticamente y verás cómo:
- Navega a /acceder ✅
- Llena tu email ✅
- Solicita el OTP ✅

### Paso 5: Revisa tu email e ingresa el OTP

1. Abre tu correo electrónico
2. Busca el email de Supabase/TREFA
3. Copia el código de 6 dígitos
4. **En el navegador que abrió el test**, pega el código
5. Presiona "Verificar y Continuar"

### Paso 6: El test detecta automáticamente el éxito

El test verá que fuiste redirigido y mostrará:
```
✅ TEST EXITOSO - OTP VERIFICADO
📍 Redirigido a: http://localhost:5173/escritorio/...
```

---

## 📸 Screenshots Generados

Cada vez que ejecutas el test, se generan screenshots:

```
test_01_auth_page.png          # Página de autenticación
test_02_email_filled.png       # Email ingresado
test_03_otp_screen.png         # Pantalla de OTP
test_04_success_after_otp.png  # Éxito después del OTP
test_error_general.png         # Si hay un error
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué el OTP es manual?

Porque el código se envía por email real de Supabase. No podemos interceptar emails sin:
- Acceso a tu cuenta de correo
- Configurar un servidor de email de prueba
- Crear un bypass de seguridad (no recomendado)

### ¿Puedo automatizar el OTP completamente?

Sí, hay 3 opciones:

**Opción A:** Usar un email de prueba con API (ej: Mailtrap, Mailinator)
**Opción B:** Crear un bypass de OTP en modo desarrollo
**Opción C:** Usar Supabase Admin API para crear usuarios pre-verificados

Si quieres implementar alguna, avísame.

### ¿Cuánto tiempo toma el test?

- **Parte automática:** 10-15 segundos
- **Ingreso de OTP (manual):** 30-60 segundos
- **Total:** ~1-2 minutos

### ¿El test funciona si ya tengo cuenta?

Sí. Si usas un email que ya está registrado:
- El test hará **LOGIN** en lugar de registro
- Recibirás el OTP igual
- Funcionará exactamente igual

### ¿Puedo usar el test en producción?

⚠️ **NO RECOMENDADO**. Este test está configurado para:
```python
page.goto('http://localhost:5173/acceder')
```

Para producción, cambia a:
```python
page.goto('https://tudominio.com/acceder')
```

### ¿Qué pasa si el test falla?

El test genera un screenshot del error:
- `test_error_general.png` - Error general
- `test_05_otp_timeout.png` - Si no ingresaste OTP a tiempo

Revisa los screenshots para diagnosticar el problema.

---

## 🔧 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'playwright'"

**Solución:**
```bash
pip3 install playwright
/Users/marianomorales/Library/Python/3.9/bin/playwright install chromium
```

### Error: "Timeout 30000ms exceeded"

**Causa:** La página tardó mucho en cargar

**Solución:**
1. Verifica que el servidor esté corriendo (`npm run dev`)
2. Verifica que http://localhost:5173 funcione en tu navegador
3. Aumenta el timeout en el script (línea 28):
   ```python
   page.set_default_timeout(120000)  # 2 minutos
   ```

### Error: "Timeout esperando OTP"

**Causa:** No ingresaste el OTP en 3 minutos

**Solución:**
1. Ejecuta el test de nuevo
2. Ten tu email abierto antes de iniciar
3. Copia el código más rápido

### El navegador se cierra inmediatamente

**Causa:** Hay un error de sintaxis o el script terminó

**Solución:**
1. Revisa los logs en la terminal
2. Busca el screenshot `test_error_general.png`
3. Ejecuta con output detallado:
   ```bash
   python3 test_with_your_email.py 2>&1 | tee test_output.log
   ```

---

## 💡 Mejores Prácticas

1. **Usa un email al que tengas acceso** - Obvio, pero importante
2. **Ten tu correo abierto** antes de ejecutar el test
3. **No cierres el navegador manualmente** - Deja que el test lo controle
4. **Revisa los screenshots** si algo falla
5. **Ejecuta en horario de bajo tráfico** si pruebas en staging/producción

---

## 📊 Casos de Uso

### Testing Manual/Demo
✅ Usa `test_with_your_email.py`

### Testing de Regresión
✅ Ejecuta el test después de cada cambio en el flujo de auth

### Debugging de Problemas de UI
✅ Los screenshots muestran exactamente qué vio el navegador

### Documentación Visual
✅ Los screenshots sirven como evidencia de que el flujo funciona

---

## 🎯 Próximos Pasos

Si quieres expandir el testing, puedes:

1. **Agregar más pasos** después del OTP:
   - Completar perfil
   - Perfilación bancaria
   - Solicitud de financiamiento

2. **Crear variantes del test**:
   - Con diferentes vehículos
   - Con diferentes perfiles de usuario
   - Edge cases (datos inválidos, errores de red)

3. **Integrar con CI/CD**:
   - GitHub Actions
   - Ejecutar automáticamente en cada PR

4. **Agregar assertions**:
   - Verificar textos específicos
   - Validar elementos de UI
   - Comprobar navegación correcta

---

## 📞 Soporte

Si tienes problemas o quieres agregar funcionalidad:
1. Revisa los screenshots generados
2. Revisa los logs en la terminal
3. Verifica que el servidor esté corriendo
4. Pregúntame si necesitas ayuda para extender el test

---

**Creado con:** Playwright MCP Server + Claude Code
**Última actualización:** 26 Nov 2024
