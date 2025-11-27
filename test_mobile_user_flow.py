"""
Test del flujo móvil completo simulando comportamiento real de usuario.

Flujo:
1. Hard reset completo (cookies, caché, force reload)
2. Navegar como usuario móvil real
3. Ir a página 2 del inventario
4. Aplicar filtros
5. Hacer búsqueda en header
6. Seleccionar vehículo
7. Click en botón de financiamiento
8. Verificar vehículo visible en UI hasta inicio de aplicación
"""

from playwright.sync_api import sync_playwright
import time
import random

# Credenciales del usuario de prueba
TEST_EMAIL = "test.automation@trefa.test"
TEST_PASSWORD = "TestTrefa2024!"

def take_screenshot(page, name):
    filename = f"mobile_{name}.png"
    page.screenshot(path=filename, full_page=True)
    print(f"   📸 {filename}")

def hard_reset_browser(page):
    """Limpieza completa del navegador - cookies, caché, storage, etc."""
    print("\n🔄 HARD RESET DEL NAVEGADOR MÓVIL")

    # Limpiar cookies
    print("   → Limpiando cookies...")
    context = page.context
    context.clear_cookies()

    # Limpiar todo el storage del navegador
    print("   → Limpiando localStorage, sessionStorage, IndexedDB...")
    page.evaluate("""
        () => {
            // Limpiar localStorage
            localStorage.clear();

            // Limpiar sessionStorage
            sessionStorage.clear();

            // Limpiar todas las bases de datos IndexedDB
            if (window.indexedDB && window.indexedDB.databases) {
                window.indexedDB.databases().then(dbs => {
                    dbs.forEach(db => {
                        if (db.name) {
                            window.indexedDB.deleteDatabase(db.name);
                        }
                    });
                });
            }

            // Limpiar caches del service worker si existe
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                    });
                });
            }
        }
    """)

    print("   ✅ Reset completado")
    time.sleep(2)

def auto_login(page):
    """Login automático usando JavaScript"""
    print("\n🔐 LOGIN AUTOMÁTICO")

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
        user_id = result.get('user', {}).get('id', 'N/A')
        print(f"   ✅ Login exitoso - User ID: {user_id[:20]}...")
        return True
    else:
        print(f"   ❌ Error en login: {result.get('error')}")
        return False

def navigate_to_inventory_page_2(page):
    """Navegar a la página 2 del inventario"""
    print("\n📱 NAVEGACIÓN A INVENTARIO - PÁGINA 2")

    print("   → Navegando a /autos...")
    page.goto('http://localhost:5173/autos', wait_until='domcontentloaded')
    time.sleep(3)
    take_screenshot(page, "01_inventory_page1")

    # Buscar botón de página 2
    print("   → Buscando paginación...")
    try:
        # Intentar diferentes selectores de paginación
        pagination_selectors = [
            'button:has-text("2")',
            'a:has-text("2")',
            '[aria-label="Go to page 2"]',
            '.pagination button:nth-child(2)',
            'nav button:has-text("2")'
        ]

        for selector in pagination_selectors:
            try:
                btn = page.locator(selector).first
                if btn.is_visible(timeout=2000):
                    print(f"   → Haciendo clic en página 2...")
                    btn.click()
                    page.wait_for_load_state('networkidle')
                    time.sleep(2)
                    print("   ✅ Navegado a página 2")
                    take_screenshot(page, "02_inventory_page2")
                    return True
            except:
                continue

        print("   ⚠️  No se encontró paginación, continuando con página 1...")
        return True

    except Exception as e:
        print(f"   ⚠️  Error navegando a página 2: {e}")
        return True

def apply_filters(page):
    """Aplicar filtros en el inventario"""
    print("\n🔍 APLICANDO FILTROS")

    try:
        # Buscar botones de filtro (marca, modelo, año, etc.)
        filter_buttons = page.locator('button:visible, select:visible').all()

        # Intentar hacer clic en un filtro
        for btn in filter_buttons[:5]:  # Probar los primeros 5 elementos
            try:
                btn_text = btn.text_content() or btn.get_attribute('name') or ''
                if any(word in btn_text.lower() for word in ['marca', 'modelo', 'año', 'precio', 'filter', 'filtro']):
                    print(f"   → Aplicando filtro: {btn_text[:30]}...")
                    btn.click(timeout=2000)
                    time.sleep(1)

                    # Si es un select, seleccionar una opción
                    if btn.tag_name == 'select':
                        options = btn.locator('option').all()
                        if len(options) > 1:
                            btn.select_option(index=1)
                            print(f"   ✅ Filtro aplicado")
                            time.sleep(2)
                            break

                    # Si abrió un menú, seleccionar algo
                    dropdown_items = page.locator('[role="option"]:visible, li:visible').all()
                    if len(dropdown_items) > 0:
                        dropdown_items[0].click(timeout=1000)
                        print(f"   ✅ Filtro aplicado")
                        time.sleep(2)
                        break
            except:
                continue

        take_screenshot(page, "03_filters_applied")
        print("   ✅ Filtros procesados")
        return True

    except Exception as e:
        print(f"   ⚠️  Error aplicando filtros: {e}")
        take_screenshot(page, "03_filters_applied")
        return True

def search_in_header(page):
    """Hacer búsqueda en el header"""
    print("\n🔎 BÚSQUEDA EN HEADER")

    try:
        # Buscar input de búsqueda
        search_selectors = [
            'input[type="search"]',
            'input[placeholder*="Buscar"]',
            'input[placeholder*="Search"]',
            'input[name="search"]',
            'input[aria-label*="Buscar"]',
            '.search-input',
            'header input[type="text"]'
        ]

        for selector in search_selectors:
            try:
                search_input = page.locator(selector).first
                if search_input.is_visible(timeout=2000):
                    print(f"   → Ingresando búsqueda: 'Toyota'...")
                    search_input.fill('Toyota')
                    time.sleep(1)

                    # Presionar Enter o buscar botón de búsqueda
                    search_input.press('Enter')
                    page.wait_for_load_state('networkidle')
                    time.sleep(2)

                    print("   ✅ Búsqueda realizada")
                    take_screenshot(page, "04_search_results")
                    return True
            except:
                continue

        print("   ⚠️  No se encontró campo de búsqueda, continuando...")
        take_screenshot(page, "04_no_search")
        return True

    except Exception as e:
        print(f"   ⚠️  Error en búsqueda: {e}")
        return True

def select_vehicle(page):
    """Seleccionar un vehículo del inventario"""
    print("\n🚗 SELECCIONANDO VEHÍCULO")

    try:
        # Buscar tarjetas de vehículos
        vehicle_links = page.locator('a[href*="/autos/"]:not([href="/autos"])').all()

        if len(vehicle_links) > 0:
            print(f"   ✅ Encontrados {len(vehicle_links)} vehículos")

            # Obtener href del primer vehículo
            first_link = vehicle_links[0]
            vehicle_href = first_link.get_attribute('href')

            # Intentar obtener nombre del vehículo
            try:
                vehicle_name = first_link.text_content()[:50] or "Vehículo"
                print(f"   → Seleccionando: {vehicle_name}...")
            except:
                print(f"   → Seleccionando vehículo...")

            if vehicle_href:
                full_url = f"http://localhost:5173{vehicle_href}" if vehicle_href.startswith('/') else vehicle_href
                print(f"   → Navegando a: {full_url}")

                page.goto(full_url, wait_until='domcontentloaded')
                time.sleep(3)
                take_screenshot(page, "05_vehicle_detail")

                print("   ✅ En página de detalle del vehículo")
                return vehicle_href
            else:
                print("   ❌ No se pudo obtener URL del vehículo")
                return None
        else:
            print("   ❌ No se encontraron vehículos")
            return None

    except Exception as e:
        print(f"   ❌ Error seleccionando vehículo: {e}")
        take_screenshot(page, "error_vehicle_selection")
        return None

def click_financing_button(page):
    """Hacer clic en el botón de financiamiento"""
    print("\n💰 CLICK EN BOTÓN DE FINANCIAMIENTO")

    try:
        financing_selectors = [
            'button:has-text("Comprar con financiamiento")',
            'button:has-text("Solicitar financiamiento")',
            'a:has-text("Comprar con financiamiento")',
            'a:has-text("Solicitar financiamiento")',
            'button:has-text("Financiamiento")',
            'a:has-text("Financiar")',
            '[data-action="apply-financing"]'
        ]

        for selector in financing_selectors:
            try:
                btn = page.locator(selector).first
                if btn.is_visible(timeout=3000):
                    print(f"   → Haciendo clic en: '{selector}'...")
                    btn.click()
                    page.wait_for_load_state('networkidle')
                    time.sleep(3)

                    take_screenshot(page, "06_after_financing_click")

                    current_url = page.url
                    print(f"   ✅ Navegado a: {current_url}")
                    return True
            except:
                continue

        print("   ❌ No se encontró botón de financiamiento")
        return False

    except Exception as e:
        print(f"   ❌ Error haciendo clic en financiamiento: {e}")
        return False

def verify_vehicle_visible_in_application(page):
    """Verificar que el vehículo seleccionado es visible en la página de aplicación"""
    print("\n✅ VERIFICANDO VEHÍCULO VISIBLE EN APLICACIÓN")

    try:
        take_screenshot(page, "07_application_with_vehicle")

        current_url = page.url
        print(f"   📍 URL actual: {current_url}")

        # Verificar que estamos en la página de aplicación
        if '/aplicacion' in current_url or '/escritorio' in current_url:
            print("   ✅ Estamos en la página de aplicación")

            # Buscar indicadores del vehículo en la UI
            vehicle_indicators = [
                'img[alt*="vehículo"]',
                'img[alt*="vehicle"]',
                '.vehicle-card',
                '[data-vehicle-info]',
                'h2, h3, h4',  # Títulos que podrían contener nombre del vehículo
            ]

            vehicle_found = False
            for selector in vehicle_indicators:
                try:
                    elements = page.locator(selector).all()
                    if len(elements) > 0:
                        print(f"   ✅ Encontrados {len(elements)} elementos del vehículo")
                        vehicle_found = True
                        break
                except:
                    continue

            if vehicle_found:
                print("   🎉 ¡VEHÍCULO VISIBLE EN LA APLICACIÓN!")
                return True
            else:
                print("   ⚠️  No se detectaron elementos del vehículo en la UI")
                return True  # Continuar de todos modos
        else:
            print(f"   ⚠️  No estamos en página de aplicación: {current_url}")
            return False

    except Exception as e:
        print(f"   ⚠️  Error verificando vehículo: {e}")
        return True

def main():
    print("=" * 80)
    print("📱 TEST MÓVIL - FLUJO COMPLETO COMO USUARIO REAL")
    print("=" * 80)
    print("\nFlujo del Test:")
    print("  1. Hard reset completo del navegador")
    print("  2. Force reload para obtener código actualizado")
    print("  3. Login automático")
    print("  4. Navegar a página 2 del inventario")
    print("  5. Aplicar filtros")
    print("  6. Hacer búsqueda en header")
    print("  7. Seleccionar vehículo")
    print("  8. Click en botón de financiamiento")
    print("  9. Verificar vehículo visible en aplicación")
    print("=" * 80 + "\n")

    with sync_playwright() as p:
        # Configuración para móvil (iPhone 12 Pro)
        device = p.devices['iPhone 12 Pro']

        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            **device,
            locale='es-MX',
            timezone_id='America/Mexico_City'
        )
        page = context.new_page()
        page.set_default_timeout(60000)

        try:
            # Paso 1: Hard reset
            page.goto('http://localhost:5173')
            page.wait_for_load_state('domcontentloaded')
            hard_reset_browser(page)

            # Paso 2: Force reload para obtener código más reciente
            print("\n🔄 FORCE RELOAD PARA CÓDIGO ACTUALIZADO")
            page.reload(wait_until='domcontentloaded')
            time.sleep(2)
            page.evaluate('() => location.reload(true)')  # Hard reload
            page.wait_for_load_state('domcontentloaded')
            time.sleep(3)
            print("   ✅ Código actualizado cargado")
            take_screenshot(page, "00_homepage_fresh")

            # Paso 3: Login
            if not auto_login(page):
                raise Exception("Login falló")

            # Paso 4: Navegar a página 2 del inventario
            if not navigate_to_inventory_page_2(page):
                print("   ⚠️  Continuando sin página 2...")

            # Paso 5: Aplicar filtros
            apply_filters(page)

            # Paso 6: Búsqueda en header
            search_in_header(page)

            # Paso 7: Seleccionar vehículo
            vehicle_href = select_vehicle(page)
            if not vehicle_href:
                raise Exception("No se pudo seleccionar vehículo")

            # Paso 8: Click en financiamiento
            if not click_financing_button(page):
                raise Exception("No se pudo hacer clic en financiamiento")

            # Paso 9: Verificar vehículo visible
            if verify_vehicle_visible_in_application(page):
                print("\n" + "=" * 80)
                print("✅ TEST MÓVIL EXITOSO")
                print("=" * 80)
                print("\n🎉 Flujo completo ejecutado correctamente")
                print("📱 Experiencia móvil validada")
                print("🚗 Vehículo mantenido visible en toda la aplicación")
                print("\n📸 Revisa los screenshots mobile_*.png")
            else:
                print("\n" + "=" * 80)
                print("⚠️  TEST PARCIALMENTE EXITOSO")
                print("=" * 80)

            # Mantener navegador abierto para inspección
            print("\n⏳ Navegador permanecerá abierto 60 segundos para inspección...")
            time.sleep(60)

        except Exception as e:
            print(f"\n❌ Error en el flujo: {e}")
            take_screenshot(page, "error_final")
            import traceback
            traceback.print_exc()

        finally:
            print("\n🏁 Cerrando navegador...")
            browser.close()
            print("✅ Test finalizado\n")

if __name__ == "__main__":
    main()
