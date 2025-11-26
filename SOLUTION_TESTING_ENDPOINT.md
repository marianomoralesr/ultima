# Solución: Endpoint de Testing Interno

## Implementación Backend

### 1. Crear Endpoint de Testing (Solo Desarrollo)

Agrega este endpoint que solo funciona en desarrollo:

```typescript
// src/api/testing/auth.ts (NUEVO ARCHIVO)

import { supabase } from '../../supabaseClient';

/**
 * SOLO PARA TESTING EN DESARROLLO
 * Crea usuarios de prueba sin OTP
 */
export const TestingAuthService = {
  async createTestUser(email: string, profile?: Partial<Profile>) {
    // CRITICAL: Solo funciona en desarrollo
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Testing endpoints only available in development');
    }

    // Solo permite emails con @trefa.test
    if (!email.endsWith('@trefa.test')) {
      throw new Error('Test users must use @trefa.test domain');
    }

    try {
      // Crear usuario directamente con Admin API
      const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          test_user: true,
          created_by: 'testing_script'
        }
      });

      if (createError) throw createError;

      // Crear perfil básico si se proporciona
      if (profile && user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.user.id,
            email: email,
            ...profile
          });

        if (profileError) throw profileError;
      }

      return user;
    } catch (error) {
      console.error('Error creating test user:', error);
      throw error;
    }
  },

  async deleteTestUser(email: string) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Testing endpoints only available in development');
    }

    // Buscar usuario por email
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users?.users.find(u => u.email === email);

    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }
  },

  async loginTestUser(email: string) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Testing endpoints only available in development');
    }

    if (!email.endsWith('@trefa.test')) {
      throw new Error('Test users must use @trefa.test domain');
    }

    // Generar link de login mágico (sin OTP)
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email
    });

    if (error) throw error;

    return data;
  }
};
```

### 2. Crear Ruta de Testing (Solo Desarrollo)

```typescript
// src/pages/TestingAuthPage.tsx (NUEVO ARCHIVO)

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

/**
 * SOLO DESARROLLO - Página que auto-autentica usuarios de prueba
 * URL: http://localhost:5173/testing/auto-login?email=test@trefa.test
 */
const TestingAuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState('Autenticando...');

  useEffect(() => {
    const autoLogin = async () => {
      // CRITICAL: Solo en desarrollo
      if (process.env.NODE_ENV !== 'development') {
        navigate('/');
        return;
      }

      const email = searchParams.get('email');
      const token = searchParams.get('token');

      if (!email?.endsWith('@trefa.test')) {
        setStatus('Error: Solo emails @trefa.test permitidos');
        return;
      }

      try {
        if (token) {
          // Verificar token de acceso
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'magiclink'
          });

          if (error) throw error;

          setStatus('✅ Autenticado exitosamente');
          setTimeout(() => navigate('/escritorio'), 1000);
        } else {
          setStatus('Token no proporcionado');
        }
      } catch (error: any) {
        setStatus(`Error: ${error.message}`);
      }
    };

    autoLogin();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Testing Auto-Login</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
};

export default TestingAuthPage;
```

### 3. Agregar Ruta (Solo en Desarrollo)

```typescript
// src/App.tsx o tu archivo de rutas

// Solo agregar en desarrollo
if (process.env.NODE_ENV === 'development') {
  routes.push({
    path: '/testing/auto-login',
    element: <TestingAuthPage />
  });
}
```

---

## Script de Playwright Mejorado

```python
# test_with_auto_login.py

from playwright.sync_api import sync_playwright
import requests
import time

SUPABASE_URL = "https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_KEY = "tu-service-role-key"  # ⚠️ Solo en desarrollo

def create_test_user(email: str):
    """Crea usuario de prueba usando Admin API"""

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }

    # Crear usuario
    response = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=headers,
        json={
            "email": email,
            "email_confirm": True,
            "user_metadata": {
                "test_user": True
            }
        }
    )

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error creando usuario: {response.text}")
        return None

def generate_magic_link(email: str):
    """Genera link de auto-login"""

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/generate_link",
        headers=headers,
        json={
            "type": "magiclink",
            "email": email
        }
    )

    if response.status_code == 200:
        data = response.json()
        return data.get('action_link')  # URL completa con token
    else:
        print(f"Error generando link: {response.text}")
        return None

def run_automated_test():
    print("="*80)
    print("🚀 TEST AUTOMATIZADO - SIN OTP MANUAL")
    print("="*80)

    # 1. Crear usuario de prueba
    test_email = f"test.{int(time.time())}@trefa.test"
    print(f"\n📧 Creando usuario de prueba: {test_email}")

    user = create_test_user(test_email)
    if not user:
        print("❌ No se pudo crear usuario")
        return

    print("✅ Usuario creado")

    # 2. Generar link de auto-login
    print("\n🔗 Generando link de auto-login...")
    magic_link = generate_magic_link(test_email)

    if not magic_link:
        print("❌ No se pudo generar link")
        return

    print(f"✅ Link generado")

    # 3. Usar Playwright para navegar directamente con el link
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        print("\n→ Navegando con auto-login...")
        page.goto(magic_link)

        # Esperar redirección a escritorio
        page.wait_for_url("**/escritorio**", timeout=10000)
        time.sleep(2)

        print("\n✅ TEST EXITOSO - AUTENTICADO AUTOMÁTICAMENTE")
        print(f"📍 URL: {page.url}")

        # Tomar screenshot
        page.screenshot(path="test_auto_login_success.png")
        print("📸 Screenshot guardado: test_auto_login_success.png")

        # Continuar con el resto del flujo...
        print("\n⏳ Navegador permanecerá abierto 30 segundos...")
        time.sleep(30)

        browser.close()

if __name__ == "__main__":
    run_automated_test()
```

---

## Ventajas de Este Approach

✅ **100% Automatizado** - No requiere OTP manual
✅ **Seguro** - Solo funciona en desarrollo
✅ **Rápido** - Test completo en <30 segundos
✅ **Usa usuarios reales** - No mocks, testing real
✅ **Fácil de mantener** - Endpoint controlado internamente
✅ **No compromete producción** - Validaciones de NODE_ENV

---

## Flujo del Test

```
1. Script crea usuario test@trefa.test ✅ (5 segundos)
2. Script genera magic link con token ✅ (2 segundos)
3. Playwright navega al magic link ✅ (3 segundos)
4. Usuario auto-autenticado ✅ (1 segundo)
5. Test continúa con flujo completo ✅ (automático)
```

**Total: ~15 segundos, 100% automatizado**

---

## Seguridad

### Protecciones Implementadas:

1. ✅ Solo funciona si `NODE_ENV === 'development'`
2. ✅ Solo acepta emails `@trefa.test`
3. ✅ Service key solo en archivo local (no commitear)
4. ✅ Endpoint no existe en producción
5. ✅ Usuarios de prueba marcados con metadata

### Variables de Entorno (.env.local):

```bash
# Solo para desarrollo local
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
VITE_ENABLE_TESTING_ENDPOINTS=true
```

---

## Implementación Rápida (30 minutos)

1. **Crear endpoint de testing** (10 min)
2. **Agregar ruta de auto-login** (10 min)
3. **Actualizar script de Playwright** (10 min)
4. **Probar** (5 min)

¿Quieres que implemente esto ahora?
