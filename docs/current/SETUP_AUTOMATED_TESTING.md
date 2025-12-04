# 🚀 Setup: Testing 100% Automatizado con Usuario/Contraseña

## ✅ Lo Que Hemos Logrado

He creado un sistema de testing que NO require OTP manual:

1. ✅ Script para crear usuario de prueba (`create_test_user.py`)
2. ✅ Test automatizado con login por contraseña (`test_automated_login.py`)
3. ✅ Librería Supabase instalada

## 📋 Pasos para Completar el Setup

### Paso 1: Obtener tu Service Role Key de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. En la sección "Project API keys", busca **`service_role`**
5. Copia la key (es la key **secret**, no la `anon` key)

⚠️ **IMPORTANTE:** Esta key es muy poderosa - nunca la commitees a Git

### Paso 2: Configurar la Variable de Entorno

En tu terminal, ejecuta:

```bash
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...'
```

(Reemplaza con tu key real)

### Paso 3: Crear el Usuario de Prueba

```bash
cd /Users/marianomorales/Downloads/ultima\ copy
python3 create_test_user.py
```

Este script:
- ✅ Crea un usuario con email: `test.automation@trefa.test`
- ✅ Contraseña: `TestTrefa2024!`
- ✅ Auto-confirma el email (sin OTP)
- ✅ Crea un perfil básico
- ✅ Lo marca como usuario de prueba

### Paso 4: Ejecutar el Test Automatizado

```bash
python3 test_automated_login.py
```

Este test:
- ✅ Hace login automáticamente usando email/password
- ✅ NO requiere OTP manual
- ✅ Toma screenshots
- ✅ Verifica que llegue a `/escritorio`
- ✅ Se completa en ~10 segundos

## 🎯 Resultado Final

```
🚀 TEST AUTOMATIZADO - LOGIN CON CONTRASEÑA
================================================================================

📧 Usuario: test.automation@trefa.test
🔑 Usando login directo (sin OTP)

→ PASO 1: Navegando a la aplicación...
✅ Homepage cargada

→ PASO 2: Haciendo login automático...
✅ Login exitoso vía API
   User ID: 123abc...

→ PASO 3: Navegando a escritorio...
✅ Navegado a: http://localhost:5173/escritorio/profile

================================================================================
✅ TEST EXITOSO - AUTENTICACIÓN AUTOMÁTICA COMPLETA
================================================================================

📍 URL actual: http://localhost:5173/escritorio/profile

💡 Próximos pasos opcionales:
   - Completar perfil
   - Perfilación bancaria
   - Solicitud de financiamiento
   - etc.
```

## 🔒 Seguridad

### El Usuario de Prueba:
- ✅ Email usa dominio `@trefa.test` (no es real)
- ✅ Marcado con metadata `test_user: true`
- ✅ NO es admin (role: "user")
- ✅ NO tiene acceso a datos reales

### La Service Role Key:
- ⚠️ **Nunca la commitees** a Git
- ⚠️ Úsala solo en desarrollo local
- ⚠️ No la compartas públicamente
- ✅ Guárdala en variable de entorno

## 🎨 Personalización

### Cambiar Credenciales

Edita `create_test_user.py`:

```python
TEST_USER = {
    "email": "mi-test@trefa.test",  # Cambia esto
    "password": "MiPassword123!",    # Cambia esto
    ...
}
```

### Cambiar Perfil Inicial

Edita `create_test_user.py` línea ~70:

```python
profile_data = {
    "first_name": "Nombre",
    "last_name": "Apellido",
    "phone": "8112345678",
    # ... más campos
}
```

## 🔧 Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY not set"

**Solución:**
```bash
export SUPABASE_SERVICE_ROLE_KEY='tu-key-aqui'
```

### Error: "User already exists"

El script te preguntará si quieres eliminarlo y recrearlo. Responde 's' para sí.

### Error: "Login failed" en el test

Verifica que:
1. El usuario fue creado correctamente
2. Las credenciales en `test_automated_login.py` coinciden
3. El servidor está corriendo en localhost:5173

## 📊 Comparación: OTP Manual vs Automatizado

### Con OTP Manual (anterior):
- ⏱️ Tiempo: ~2 minutos
- 👤 Requiere: Revisar email, copiar código, pegarlo
- 🔄 Repetible: Tedioso cada vez

### Con Usuario/Contraseña (nuevo):
- ⏱️ Tiempo: ~10 segundos
- 👤 Requiere: Nada (100% automatizado)
- 🔄 Repetible: Perfecto para CI/CD

## 🚀 Próximos Pasos

Una vez que tengas el usuario creado, puedes:

1. **Extender el test** para cubrir más flujo:
   - Completar perfil
   - Perfilación bancaria
   - Solicitud de financiamiento
   - Hasta confirmación

2. **Crear variantes**:
   - Diferentes datos de perfil
   - Diferentes vehículos
   - Edge cases

3. **Integrar CI/CD**:
   - GitHub Actions
   - Ejecutar automáticamente en PRs

## 📝 Comandos Rápidos

```bash
# 1. Configurar key (una sola vez)
export SUPABASE_SERVICE_ROLE_KEY='tu-key'

# 2. Crear usuario (una sola vez)
python3 create_test_user.py

# 3. Ejecutar test (todas las veces que quieras)
python3 test_automated_login.py
```

---

**¿Listo para empezar?**

Ejecuta los pasos 1-3 y tendrás testing 100% automatizado funcionando en menos de 5 minutos.
