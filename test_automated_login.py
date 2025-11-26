"""
Test 100% automatizado usando usuario con contraseña.

No requiere OTP manual - usa login directo con email/password.
"""

from playwright.sync_api import sync_playwright
import time

# Credenciales del usuario de prueba
TEST_EMAIL = "test.automation@trefa.test"
TEST_PASSWORD = "TestTrefa2024!"

def take_screenshot(page, name):
    filename = f"test_{name}.png"
    page.screenshot(path=filename, full_page=True)
    print(f"📸 {filename}")

print("="*80)
print("🚀 TEST AUTOMATIZADO - LOGIN CON CONTRASEÑA")
print("="*80)
print(f"\n📧 Usuario: {TEST_EMAIL}")
print("🔑 Usando login directo (sin OTP)\n")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()
    page.set_default_timeout(60000)

    try:
        # ESTRATEGIA: Usar la API de Supabase directamente desde el navegador
        # para hacer login sin necesidad de UI

        print("→ PASO 1: Navegando a la aplicación...")
        page.goto('http://localhost:5173')
        page.wait_for_load_state('domcontentloaded')
        time.sleep(2)
        take_screenshot(page, "01_homepage")
        print("✅ Homepage cargada")

        # PASO 2: Inyectar login usando JavaScript
        print("\n→ PASO 2: Haciendo login automático...")

        login_script = f"""
        (async () => {{
            // Obtener instancia de Supabase del window (si existe)
            const {{ createClient }} = window.supabase || {{}};

            // Si no existe, importar dinámicamente
            if (!window.supabase) {{
                console.log('Importando Supabase...');
                const module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                window.supabase = module;
            }}

            // Crear cliente
            const supabaseUrl = 'https://jjepfehmuybpctdzipnu.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTk2MDMsImV4cCI6MjA1OTc3NTYwM30.yaMESZqaoLvkbVSgdHxpU-Vb7q-naxj95QxcpRYPrX4';

            const client = window.supabase.createClient(supabaseUrl, supabaseKey);

            // Login con email y contraseña
            const {{ data, error }} = await client.auth.signInWithPassword({{
                email: '{TEST_EMAIL}',
                password: '{TEST_PASSWORD}'
            }});

            if (error) {{
                console.error('Error en login:', error);
                return {{ success: false, error: error.message }};
            }}

            console.log('Login exitoso:', data);
            return {{ success: true, user: data.user }};
        }})();
        """

        result = page.evaluate(login_script)

        if result.get('success'):
            print("✅ Login exitoso vía API")
            print(f"   User ID: {result.get('user', {}).get('id', 'N/A')}")
        else:
            print(f"❌ Error en login: {result.get('error', 'Unknown')}")
            take_screenshot(page, "02_login_error")
            raise Exception("Login falló")

        # PASO 3: Navegar a escritorio
        print("\n→ PASO 3: Navegando a escritorio...")
        page.goto('http://localhost:5173/escritorio')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        take_screenshot(page, "03_escritorio")

        # Verificar que estamos autenticados
        current_url = page.url
        print(f"✅ Navegado a: {current_url}")

        if '/escritorio' in current_url:
            print("\n" + "="*80)
            print("✅ TEST EXITOSO - AUTENTICACIÓN AUTOMÁTICA COMPLETA")
            print("="*80)
            print(f"\n📍 URL actual: {current_url}")

            # Aquí puedes continuar con el resto del flujo...
            # Por ejemplo: completar perfil, perfilación bancaria, etc.

            print("\n💡 Próximos pasos opcionales:")
            print("   - Completar perfil")
            print("   - Perfilación bancaria")
            print("   - Solicitud de financiamiento")
            print("   - etc.")

            print("\n⏳ Navegador permanecerá abierto 30 segundos...")
            time.sleep(30)

        else:
            print(f"⚠️  URL inesperada: {current_url}")
            take_screenshot(page, "04_unexpected_url")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        take_screenshot(page, "error")
        import traceback
        traceback.print_exc()

    finally:
        print("\n🏁 Cerrando navegador...")
        browser.close()
        print("✅ Test finalizado\n")
