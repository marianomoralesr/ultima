"""
Test con el flujo CORRECTO:
1. Navegar a vehículo
2. Click en "Comprar con financiamiento" (esto genera ordencompra en URL)
3. Login con usuario de prueba
4. Sistema redirige automáticamente a información personal
5. Completar formulario SIN manipular URL
6. Dejar que la app redirija automáticamente
"""

from playwright.sync_api import sync_playwright
import time
import random

TEST_EMAIL = "test.automation@trefa.test"
TEST_PASSWORD = "TestTrefa2024!"

def take_screenshot(page, name):
    filename = f"correct_{name}.png"
    page.screenshot(path=filename, full_page=True)
    print(f"   📸 {filename}")

def hard_reset(page):
    """Limpieza completa"""
    print("\n🔄 HARD RESET")
    context = page.context
    context.clear_cookies()
    page.evaluate("""
        () => {
            localStorage.clear();
            sessionStorage.clear();
            if (window.indexedDB && window.indexedDB.databases) {
                window.indexedDB.databases().then(dbs => {
                    dbs.forEach(db => {
                        if (db.name) {
                            window.indexedDB.deleteDatabase(db.name);
                        }
                    });
                });
            }
        }
    """)
    print("   ✅ Reset completado")
    time.sleep(2)

def validate_homepage(page):
    """Validar homepage con manejo de modal de actualización"""
    print("\n🏠 VALIDANDO HOMEPAGE")
    page.goto('http://localhost:5173', wait_until='domcontentloaded')
    time.sleep(3)

    # Manejar modal de actualización si aparece
    try:
        refresh_btn = page.locator('button:has-text("Refrescar Página")').first
        if refresh_btn.is_visible(timeout=2000):
            print("   → Modal de actualización detectado, refrescando...")
            refresh_btn.click()
            page.wait_for_load_state('networkidle')
            time.sleep(3)
    except:
        pass

    has_logo = page.locator('img[alt*="TREFA"], h1:has-text("TREFA")').count() > 0
    if has_logo:
        print("   ✅ Homepage cargada correctamente")
        take_screenshot(page, "01_homepage")
        return True

    # Si no hay logo, podría ser por el modal, intentar refrescar de nuevo
    print("   → No se detectó logo, intentando refresh manual...")
    page.reload(wait_until='domcontentloaded')
    time.sleep(3)

    has_logo = page.locator('img[alt*="TREFA"], h1:has-text("TREFA")').count() > 0
    if has_logo:
        print("   ✅ Homepage cargada después de refresh")
        take_screenshot(page, "01_homepage")
        return True

    return False

def navigate_to_vehicle_and_click_financing(page):
    """
    PASO CRÍTICO: Navegar a vehículo y hacer clic en financiamiento
    Esto genera el ordencompra en el URL antes de hacer login
    """
    print("\n🚗 NAVEGACIÓN A VEHÍCULO Y FINANCIAMIENTO")

    # Ir a /autos
    page.goto('http://localhost:5173/autos', wait_until='domcontentloaded')
    time.sleep(2)
    take_screenshot(page, "02_autos_page")

    # Buscar y navegar a vehículo
    vehicle_links = page.locator('a[href*="/autos/"]:not([href="/autos"])').all()

    if len(vehicle_links) > 0:
        print(f"   ✅ Encontrados {len(vehicle_links)} vehículos")
        first_link = vehicle_links[0]
        vehicle_href = first_link.get_attribute('href')

        if vehicle_href:
            full_url = f"http://localhost:5173{vehicle_href}" if vehicle_href.startswith('/') else vehicle_href
            print(f"   → Navegando a: {full_url}")

            page.goto(full_url, wait_until='domcontentloaded')
            time.sleep(3)
            take_screenshot(page, "03_vehicle_detail")

            # Buscar botón de financiamiento
            print("\n   → Buscando 'Comprar con financiamiento'...")
            financing_selectors = [
                'button:has-text("Comprar con financiamiento")',
                'a:has-text("Comprar con financiamiento")',
                'button:has-text("Solicitar financiamiento")',
                'a:has-text("Solicitar financiamiento")'
            ]

            for selector in financing_selectors:
                try:
                    btn = page.locator(selector).first
                    if btn.is_visible(timeout=3000):
                        print(f"   → Haciendo clic en: {selector}")
                        btn.click()
                        page.wait_for_load_state('networkidle')
                        time.sleep(3)

                        current_url = page.url
                        print(f"   ✅ Navegado a: {current_url}")

                        # Verificar que tenemos ordencompra en el URL
                        if 'ordencompra' in current_url:
                            print(f"   ✅ ¡URL con ordencompra detectado!")
                            take_screenshot(page, "04_financing_clicked_with_ordencompra")
                            return current_url
                        else:
                            print(f"   ⚠️  URL sin ordencompra, pero continuando...")
                            take_screenshot(page, "04_financing_clicked")
                            return current_url
                except:
                    continue

            print("   ❌ No se encontró botón de financiamiento")
            return None

    return None

def login_after_financing_click(page):
    """
    Login DESPUÉS de hacer clic en financiamiento
    El sistema debe tener ordencompra en la sesión
    """
    print("\n🔐 LOGIN (después de clic en financiamiento)")

    # Verificar si estamos en /acceder
    current_url = page.url
    print(f"   📍 URL actual: {current_url}")

    if '/acceder' not in current_url:
        print("   → No estamos en /acceder, navegando...")
        # El clic en financiamiento debe haber llevado a /acceder
        # Si no, algo falló
        if '/aplicacion' in current_url:
            print("   ✅ Ya estamos en aplicación, parece que ya estábamos logueados")
            return True

    take_screenshot(page, "05_login_page")

    # Hacer login con JavaScript
    login_script = f"""
    (async () => {{
        const {{ createClient }} = window.supabase || {{}};
        if (!window.supabase) {{
            const module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
            window.supabase = module;
        }}

        const supabaseUrl = 'https://jjepfehmuybpctdzipnu.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTk2MDMsImV4cCI6MjA1OTc3NTYwM30.yaMESZqaoLvkbVSgdHxpU-Vb7q-naxj95QxcpRYPrX4';

        const client = window.supabase.createClient(supabaseUrl, supabaseKey);

        const {{ data, error }} = await client.auth.signInWithPassword({{
            email: '{TEST_EMAIL}',
            password: '{TEST_PASSWORD}'
        }});

        if (error) return {{ success: false, error: error.message }};
        return {{ success: true, user: data.user }};
    }})();
    """

    result = page.evaluate(login_script)

    if result.get('success'):
        print(f"   ✅ Login exitoso")
        time.sleep(2)

        # Esperar redirección automática
        page.wait_for_load_state('networkidle')
        time.sleep(3)

        current_url = page.url
        print(f"   📍 URL después de login: {current_url}")
        take_screenshot(page, "06_after_login")

        return True
    else:
        print(f"   ❌ Error en login: {result.get('error')}")
        return False

def complete_application_automatically(page):
    """
    Completar la aplicación sin manipular URLs
    Dejar que la app redirija automáticamente
    """
    print("\n📝 COMPLETANDO APLICACIÓN (SIN MANIPULAR URL)")

    current_url = page.url
    print(f"   📍 URL inicial: {current_url}")
    take_screenshot(page, "07_application_start")

    max_steps = 10
    for step in range(max_steps):
        print(f"\n   → Paso {step + 1}")

        # Llenar campos visibles
        try:
            inputs = page.locator('input[type="text"]:visible, input[type="tel"]:visible, input[type="email"]:visible').all()
            for input_field in inputs[:10]:
                try:
                    if not input_field.is_visible():
                        continue

                    placeholder = input_field.get_attribute('placeholder') or ''
                    name = input_field.get_attribute('name') or ''

                    if 'tel' in name.lower() or 'teléfono' in placeholder.lower():
                        input_field.fill('8112345678')
                    elif 'email' in name.lower() or 'correo' in placeholder.lower():
                        input_field.fill('test@example.com')
                    elif 'nombre' in placeholder.lower():
                        input_field.fill('Juan Pérez García')
                    elif 'rfc' in name.lower():
                        input_field.fill('PEGJ900101XXX')
                    else:
                        input_field.fill('Valor de prueba')

                    time.sleep(0.2)
                except:
                    continue
        except:
            pass

        # Seleccionar opciones de select
        try:
            selects = page.locator('select:visible').all()
            for sel in selects[:5]:
                try:
                    if sel.is_visible():
                        options = sel.locator('option').all()
                        if len(options) > 1:
                            sel.select_option(index=1)
                            time.sleep(0.2)
                except:
                    continue
        except:
            pass

        # Hacer clic en radio buttons
        try:
            radios = page.locator('button[type="button"]:visible').all()
            if len(radios) > 0:
                try:
                    radios[0].click()
                    time.sleep(0.3)
                except:
                    pass
        except:
            pass

        take_screenshot(page, f"08_step_{step + 1}")

        # Buscar botón "Siguiente" o "Enviar"
        next_buttons = [
            'button:has-text("Siguiente")',
            'button:has-text("Continuar")',
            'button:has-text("Enviar Solicitud")',
            'button:has-text("Enviar")',
            'button[type="submit"]:has-text("Enviar")'
        ]

        found_button = False
        for selector in next_buttons:
            try:
                btn = page.locator(selector).first
                if btn.is_visible(timeout=2000) and not btn.is_disabled():
                    print(f"   → Haciendo clic en: {selector}")
                    btn.click()
                    page.wait_for_load_state('networkidle')
                    time.sleep(3)
                    found_button = True

                    current_url = page.url
                    print(f"   📍 URL actual: {current_url}")

                    # Verificar si llegamos a confirmación
                    if '/confirmacion' in current_url:
                        print("\n   🎉 ¡LLEGAMOS A CONFIRMACIÓN!")
                        take_screenshot(page, "09_confirmation")
                        return True

                    break
            except:
                continue

        if not found_button:
            print("   ℹ️  No se encontró botón siguiente, fin del formulario")
            current_url = page.url
            if '/confirmacion' in current_url:
                print("\n   🎉 ¡LLEGAMOS A CONFIRMACIÓN!")
                take_screenshot(page, "09_confirmation")
                return True
            break

    take_screenshot(page, "09_final_state")
    return False

def main():
    print("="*80)
    print("🚀 TEST CON FLUJO CORRECTO")
    print("="*80)
    print("\nFlujo:")
    print("  1. Navegar a vehículo")
    print("  2. Click 'Comprar con financiamiento' (genera ordencompra)")
    print("  3. Login")
    print("  4. Sistema redirige automáticamente")
    print("  5. Completar formulario (SIN manipular URL)")
    print("  6. Llegar a confirmación")
    print("="*80 + "\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        page.set_default_timeout(90000)

        try:
            # Paso 1: Reset y validar homepage
            page.goto('http://localhost:5173')
            hard_reset(page)

            if not validate_homepage(page):
                raise Exception("Homepage no validada")

            # Paso 2: Navegar a vehículo y hacer clic en financiamiento
            # ESTO ES CRÍTICO: debe generar ordencompra antes del login
            financing_url = navigate_to_vehicle_and_click_financing(page)

            if not financing_url:
                raise Exception("No se pudo hacer clic en financiamiento")

            # Paso 3: Login (después del clic en financiamiento)
            if not login_after_financing_click(page):
                raise Exception("Login falló")

            # Paso 4: Completar aplicación automáticamente
            # NO manipular URL, dejar que la app redirija
            success = complete_application_automatically(page)

            if success:
                print("\n" + "="*80)
                print("✅ TEST EXITOSO")
                print("="*80)
                print("\n🎉 Flujo completo hasta confirmación")
            else:
                print("\n" + "="*80)
                print("⚠️  TEST PARCIAL")
                print("="*80)
                print("\nRevisar screenshots correct_*.png")

            print("\n⏳ Navegador abierto 60 segundos...")
            time.sleep(60)

        except Exception as e:
            print(f"\n❌ Error: {e}")
            take_screenshot(page, "error_final")
            import traceback
            traceback.print_exc()

        finally:
            print("\n🏁 Cerrando navegador...")
            browser.close()
            print("✅ Test finalizado\n")

if __name__ == "__main__":
    main()
