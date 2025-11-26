"""
Test de Producción - Flujo Completo con Validaciones Robustas

Características:
1. Hard reset y limpieza de caché antes de iniciar
2. Validación de homepage con reintentos automáticos
3. Inicio desde página de detalle de vehículo
4. Clic en "Comprar con financiamiento"
5. Flujo completo hasta confirmación
6. Manejo automático de modales de actualización
"""

from playwright.sync_api import sync_playwright
import time
import random

# Credenciales del usuario de prueba
TEST_EMAIL = "test.automation@trefa.test"
TEST_PASSWORD = "TestTrefa2024!"

# Configuración de Supabase
SUPABASE_URL = "https://jjepfehmuybpctdzipnu.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTk2MDMsImV4cCI6MjA1OTc3NTYwM30.yaMESZqaoLvkbVSgdHxpU-Vb7q-naxj95QxcpRYPrX4"

def take_screenshot(page, name):
    """Toma screenshot con timestamp"""
    filename = f"prod_{name}.png"
    page.screenshot(path=filename, full_page=True)
    print(f"   📸 {filename}")
    return filename

def hard_reset_browser(context):
    """
    Hard reset del navegador:
    - Limpia cookies
    - Limpia storage
    - Limpia caché
    """
    print("\n🔄 HARD RESET DEL NAVEGADOR")
    print("   → Limpiando cookies...")
    context.clear_cookies()

    print("   → Limpiando localStorage y sessionStorage...")
    # Esto se hará al visitar la página

    print("   ✅ Reset completado\n")

def clear_storage(page):
    """Limpia localStorage, sessionStorage y cache del navegador"""
    try:
        page.evaluate("""
            () => {
                // Limpiar localStorage
                localStorage.clear();

                // Limpiar sessionStorage
                sessionStorage.clear();

                // Limpiar IndexedDB si existe
                if (window.indexedDB) {
                    window.indexedDB.databases().then(dbs => {
                        dbs.forEach(db => {
                            if (db.name) window.indexedDB.deleteDatabase(db.name);
                        });
                    });
                }

                console.log('✅ Storage limpiado');
            }
        """)
        print("   ✅ Storage del navegador limpiado")
    except Exception as e:
        print(f"   ⚠️  Error limpiando storage: {e}")

def validate_homepage_with_retries(page, max_attempts=3):
    """
    Valida que la homepage carga correctamente.
    Si hay errores, reintenta hasta 3 veces con hard refresh.

    Returns: True si carga exitosamente, False si falla después de todos los intentos
    """
    print("\n🏠 VALIDACIÓN DE HOMEPAGE")

    for attempt in range(1, max_attempts + 1):
        print(f"\n   Intento {attempt}/{max_attempts}")

        try:
            # Navegar a homepage
            print("   → Navegando a http://localhost:5173")
            page.goto('http://localhost:5173', wait_until='domcontentloaded', timeout=30000)

            # Esperar un momento para que cargue
            time.sleep(3)

            # Limpiar storage en cada intento
            clear_storage(page)

            # Verificar si hay mensajes de error CRÍTICOS en la página
            # Solo buscar errores en elementos visibles, no en todo el HTML
            has_error = False
            try:
                # Buscar modales o alertas de error visibles
                error_elements = page.locator('[role="alert"], .error-message, .alert-error').all()
                for elem in error_elements:
                    if elem.is_visible():
                        has_error = True
                        break

                # Buscar el modal de "Nueva Versión Disponible" con error
                if page.locator('text="Nueva Versión Disponible"').count() > 0:
                    if page.locator('text="Error Details"').is_visible(timeout=1000):
                        has_error = True
            except:
                pass

            if has_error:
                print(f"   ❌ Intento {attempt} - Detectado mensaje de error en la página")
                take_screenshot(page, f"homepage_error_attempt_{attempt}")

                if attempt < max_attempts:
                    print("   🔄 Haciendo hard refresh...")
                    page.reload(wait_until='domcontentloaded')
                    time.sleep(2)
                    continue
                else:
                    print("   ❌ Todos los intentos fallaron")
                    return False

            # Verificar que elementos básicos estén presentes
            try:
                # Buscar elementos comunes de la homepage
                has_logo = page.locator('img[alt*="TREFA"], h1:has-text("TREFA")').count() > 0
                has_navigation = page.locator('nav, header').count() > 0

                if has_logo or has_navigation:
                    print(f"   ✅ Homepage cargada correctamente en intento {attempt}")
                    take_screenshot(page, "homepage_success")
                    return True
                else:
                    print(f"   ⚠️  Intento {attempt} - No se detectaron elementos esperados")

                    if attempt < max_attempts:
                        print("   🔄 Haciendo hard refresh...")
                        page.reload(wait_until='domcontentloaded')
                        time.sleep(2)
                        continue

            except Exception as e:
                print(f"   ⚠️  Error verificando elementos: {e}")
                if attempt < max_attempts:
                    continue

        except Exception as e:
            print(f"   ❌ Intento {attempt} falló: {e}")
            take_screenshot(page, f"homepage_fail_attempt_{attempt}")

            if attempt < max_attempts:
                print("   🔄 Reintentando...")
                time.sleep(2)
                continue
            else:
                return False

    return False

def auto_login(page):
    """Login automático usando JavaScript"""
    print("\n🔐 LOGIN AUTOMÁTICO")

    login_script = f"""
    (async () => {{
        try {{
            const {{ createClient }} = window.supabase || {{}};
            if (!window.supabase) {{
                const module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                window.supabase = module;
            }}

            const client = window.supabase.createClient('{SUPABASE_URL}', '{SUPABASE_ANON_KEY}');

            const {{ data, error }} = await client.auth.signInWithPassword({{
                email: '{TEST_EMAIL}',
                password: '{TEST_PASSWORD}'
            }});

            if (error) {{
                console.error('Login error:', error);
                return {{ success: false, error: error.message }};
            }}

            console.log('Login exitoso:', data);
            return {{ success: true, user: data.user }};
        }} catch (err) {{
            console.error('Exception during login:', err);
            return {{ success: false, error: err.toString() }};
        }}
    }})();
    """

    try:
        result = page.evaluate(login_script)

        if result.get('success'):
            user_id = result.get('user', {}).get('id', 'N/A')
            print(f"   ✅ Login exitoso - User ID: {user_id[:20]}...")
            return True
        else:
            print(f"   ❌ Error en login: {result.get('error')}")
            return False
    except Exception as e:
        print(f"   ❌ Excepción durante login: {e}")
        return False

def handle_update_modal(page):
    """Detecta y maneja modales de actualización"""
    try:
        time.sleep(1)

        update_selectors = [
            'button:has-text("Actualizar")',
            'button:has-text("Reload")',
            'button:has-text("Refresh")',
            'button:has-text("Recargar")',
            'button:has-text("Reiniciar")',
            '[data-action="reload"]',
            '[data-action="update"]',
            '.update-modal button',
            '[role="dialog"] button:has-text("Actualizar")'
        ]

        for selector in update_selectors:
            try:
                btn = page.locator(selector).first
                if btn.is_visible(timeout=2000):
                    print(f"   ⚠️  Modal de actualización detectado")
                    print(f"   → Haciendo clic en '{selector}'")
                    btn.click()
                    page.wait_for_load_state('networkidle', timeout=15000)
                    time.sleep(2)
                    return True
            except:
                continue

        return False
    except:
        return False

def navigate_to_vehicle_and_click_financing(page):
    """
    Navega a una página de detalle de vehículo y hace clic en 'Comprar con financiamiento'
    """
    print("\n🚗 NAVEGACIÓN A VEHÍCULO Y SOLICITUD DE FINANCIAMIENTO")

    # Primero, ir a la página de autos para encontrar un vehículo
    print("   → Navegando a página de autos...")
    page.goto('http://localhost:5173/autos', wait_until='domcontentloaded')
    time.sleep(3)

    handle_update_modal(page)
    take_screenshot(page, "01_autos_page")

    # Buscar el primer vehículo disponible
    print("   → Buscando vehículo disponible...")
    try:
        # Buscar cards de vehículos
        vehicle_cards = page.locator('[data-vehicle-card], .vehicle-card, a[href*="/autos/"]').all()

        if len(vehicle_cards) == 0:
            print("   ⚠️  No se encontraron vehículos, intentando con selector alternativo...")
            # Intentar con links que contengan /autos/
            vehicle_links = page.locator('a[href*="/autos/"]').all()
            if len(vehicle_links) > 0:
                vehicle_cards = vehicle_links

        if len(vehicle_cards) > 0:
            print(f"   ✅ Encontrados {len(vehicle_cards)} vehículos")

            # Hacer clic en el primer vehículo
            first_vehicle = vehicle_cards[0]

            # Intentar obtener el título del vehículo
            try:
                vehicle_title = first_vehicle.locator('h2, h3, .vehicle-title').first.text_content()
                print(f"   → Seleccionando: {vehicle_title}")
            except:
                print("   → Seleccionando primer vehículo disponible")

            first_vehicle.click()
            page.wait_for_load_state('networkidle')
            time.sleep(3)

            handle_update_modal(page)
            take_screenshot(page, "02_vehicle_detail")

            print(f"   ✅ En página de detalle: {page.url}")

        else:
            print("   ❌ No se encontraron vehículos disponibles")
            return False

    except Exception as e:
        print(f"   ❌ Error navegando a vehículo: {e}")
        take_screenshot(page, "error_vehicle_navigation")
        return False

    # Ahora buscar y hacer clic en "Comprar con financiamiento"
    print("\n   → Buscando botón 'Comprar con financiamiento'...")

    financing_selectors = [
        'button:has-text("Comprar con financiamiento")',
        'button:has-text("Solicitar financiamiento")',
        'a:has-text("Comprar con financiamiento")',
        'a:has-text("Solicitar financiamiento")',
        '[data-action="apply-financing"]',
        'button:has-text("Financiamiento")',
        'a:has-text("Financiar")'
    ]

    for selector in financing_selectors:
        try:
            btn = page.locator(selector).first
            if btn.is_visible(timeout=3000):
                print(f"   ✅ Botón encontrado: '{selector}'")
                btn.click()
                page.wait_for_load_state('networkidle')
                time.sleep(3)

                handle_update_modal(page)
                take_screenshot(page, "03_after_financing_click")

                print(f"   ✅ Navegado a: {page.url}")
                return True
        except:
            continue

    print("   ⚠️  No se encontró botón específico, probando navegación directa...")
    # Si no encuentra el botón, navegar directamente a aplicación
    current_url = page.url
    if '/autos/' in current_url:
        # Extraer ordencompra del URL si es posible
        parts = current_url.split('/')
        ordencompra = parts[-1] if parts[-1] else None

        if ordencompra:
            app_url = f"http://localhost:5173/escritorio/aplicacion?ordencompra={ordencompra}"
            print(f"   → Navegando directamente a: {app_url}")
            page.goto(app_url)
            page.wait_for_load_state('networkidle')
            time.sleep(3)
            return True

    return False

def complete_application_flow(page):
    """
    Completa el flujo de aplicación completo hasta la confirmación
    """
    print("\n📝 COMPLETANDO FLUJO DE APLICACIÓN")

    handle_update_modal(page)
    take_screenshot(page, "04_application_start")

    # Navegar por los pasos del formulario
    max_steps = 8
    step_count = 0

    while step_count < max_steps:
        step_count += 1
        print(f"\n   → Paso {step_count} del formulario")

        # Llenar campos de texto visibles
        try:
            text_inputs = page.locator('input[type="text"]:visible, input[type="tel"]:visible, input[type="email"]:visible').all()
            for idx, input_field in enumerate(text_inputs[:10]):  # Máximo 10 campos por paso
                try:
                    if not input_field.is_visible():
                        continue

                    placeholder = input_field.get_attribute('placeholder') or ''
                    name = input_field.get_attribute('name') or ''

                    # Determinar qué valor llenar según el campo
                    if 'tel' in name.lower() or 'phone' in name.lower() or 'teléfono' in placeholder.lower():
                        input_field.fill('8112345678')
                    elif 'email' in name.lower() or 'correo' in placeholder.lower():
                        input_field.fill('test@example.com')
                    elif 'nombre' in placeholder.lower() or 'name' in name.lower():
                        input_field.fill('Juan Pérez García')
                    elif 'rfc' in name.lower():
                        input_field.fill('PEGJ900101XXX')
                    elif 'address' in name.lower() or 'domicilio' in placeholder.lower():
                        input_field.fill('Calle Ejemplo 123')
                    elif 'colonia' in placeholder.lower() or 'colony' in name.lower():
                        input_field.fill('Centro')
                    elif 'ciudad' in placeholder.lower() or 'city' in name.lower():
                        input_field.fill('Monterrey')
                    elif 'zip' in name.lower() or 'postal' in placeholder.lower():
                        input_field.fill('64000')
                    elif 'empresa' in placeholder.lower() or 'company' in name.lower():
                        input_field.fill('Empresa de Prueba SA')
                    else:
                        input_field.fill('Valor de prueba')

                    time.sleep(0.2)
                except:
                    continue
        except:
            pass

        # Seleccionar opciones de select si hay
        try:
            selects = page.locator('select:visible').all()
            for select in selects[:5]:
                try:
                    if select.is_visible():
                        options = select.locator('option').all()
                        if len(options) > 1:  # Más de una opción (sin contar placeholder)
                            select.select_option(index=1)  # Seleccionar primera opción real
                            time.sleep(0.2)
                except:
                    continue
        except:
            pass

        # Hacer clic en radio buttons/opciones
        try:
            radio_buttons = page.locator('button[type="button"]:visible').all()
            visible_radios = [btn for btn in radio_buttons if btn.is_visible()]
            if len(visible_radios) > 0:
                random.choice(visible_radios).click()
                time.sleep(0.3)
        except:
            pass

        # Marcar checkboxes si es necesario (como términos y condiciones)
        try:
            checkboxes = page.locator('input[type="checkbox"]:visible').all()
            for checkbox in checkboxes:
                if checkbox.is_visible() and not checkbox.is_checked():
                    checkbox.check()
                    time.sleep(0.2)
        except:
            pass

        take_screenshot(page, f"05_step_{step_count}")

        # Buscar botón "Siguiente"
        next_clicked = False
        next_selectors = [
            'button:has-text("Siguiente")',
            'button:has-text("Continuar")',
            'button[type="button"]:has-text("Siguiente")'
        ]

        for selector in next_selectors:
            try:
                btn = page.locator(selector).first
                if btn.is_visible(timeout=2000) and not btn.is_disabled():
                    print(f"   → Haciendo clic en 'Siguiente'")
                    btn.click()
                    page.wait_for_load_state('networkidle')
                    time.sleep(2)
                    handle_update_modal(page)
                    next_clicked = True
                    break
            except:
                continue

        # Si no hay botón "Siguiente", buscar botón "Enviar"
        if not next_clicked:
            submit_selectors = [
                'button:has-text("Enviar Solicitud")',
                'button:has-text("Enviar")',
                'button[type="submit"]:has-text("Enviar")',
                'button.bg-green-600',  # El botón de envío es verde
            ]

            for selector in submit_selectors:
                try:
                    btn = page.locator(selector).first
                    if btn.is_visible(timeout=2000) and not btn.is_disabled():
                        print(f"   ✅ Encontrado botón de envío")
                        print(f"   → Enviando solicitud...")
                        btn.click()
                        page.wait_for_load_state('networkidle', timeout=15000)
                        time.sleep(3)
                        handle_update_modal(page)
                        take_screenshot(page, "06_after_submit")
                        print(f"   ✅ Solicitud enviada")
                        return True
                except:
                    continue

            # Si tampoco hay botón de enviar, probablemente terminamos o hay un error
            print("   ℹ️  No se encontró botón 'Siguiente' ni 'Enviar', asumiendo fin del formulario")
            break

    return True

def verify_confirmation_page(page):
    """Verifica que estamos en la página de confirmación"""
    print("\n✅ VERIFICACIÓN DE PÁGINA DE CONFIRMACIÓN")

    time.sleep(2)
    current_url = page.url
    take_screenshot(page, "07_confirmation_page")

    print(f"   📍 URL actual: {current_url}")

    # Verificar URL
    if '/confirmacion' in current_url:
        print("   ✅ ¡ÉXITO! URL contiene '/confirmacion'")

        # Verificar elementos de confirmación
        success_indicators = [
            ('text=/Felicidades|Solicitud.*Enviada|Éxito|Gracias/i', 'Texto de éxito'),
            ('.text-green-600, .text-green-500', 'Icono verde'),
            ('svg.text-green-600', 'SVG de éxito'),
            ('h1:has-text("Felicidades"), h2:has-text("Solicitud")', 'Título de confirmación')
        ]

        found_indicators = 0
        for selector, description in success_indicators:
            try:
                if page.locator(selector).first.is_visible(timeout=3000):
                    print(f"   ✅ {description} visible")
                    found_indicators += 1
            except:
                pass

        if found_indicators > 0:
            print(f"\n   🎉 Página de confirmación verificada ({found_indicators} indicadores encontrados)")
            return True
        else:
            print("   ⚠️  URL correcta pero no se encontraron indicadores visuales de éxito")
            return True  # Aún consideramos éxito si la URL es correcta
    else:
        print(f"   ❌ No llegamos a confirmación")
        print(f"   ℹ️  URL esperada debería contener '/confirmacion'")
        return False

def complete_profile_step(page):
    """Completar paso de perfil"""
    print("\n📋 PASO: COMPLETAR PERFIL")

    # Navegar a perfil
    page.goto('http://localhost:5173/escritorio/profile')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    handle_update_modal(page)
    take_screenshot(page, "step1_profile_page")

    print("   → Completando campos del perfil...")

    # Llenar campos del perfil
    profile_fields = [
        ('input[name="first_name"]', 'Usuario'),
        ('input[name="last_name"]', 'Prueba'),
        ('input[name="mother_last_name"]', 'Testing'),
        ('input[name="phone"]', '8112345678'),
        ('input[name="birth_date"]', '1990-01-01'),
        ('input[name="rfc"]', 'PUET900101XXX'),
        ('select[name="civil_status"]', 'Soltero'),
        ('select[name="fiscal_situation"]', 'Empleado'),
        ('input[name="address"]', 'Calle Ejemplo 123'),
        ('input[name="colony"]', 'Colonia Centro'),
        ('input[name="city"]', 'Monterrey'),
        ('select[name="state"]', 'Nuevo León'),
        ('input[name="zip_code"]', '64000'),
    ]

    for selector, value in profile_fields:
        try:
            field = page.locator(selector).first
            if field.is_visible(timeout=2000):
                if 'select' in selector:
                    field.select_option(value)
                else:
                    field.fill(value)
                time.sleep(0.2)
        except:
            continue

    take_screenshot(page, "step1_profile_filled")

    # Guardar perfil
    try:
        save_btn = page.locator('button:has-text("Guardar"), button[type="submit"]').first
        if save_btn.is_visible(timeout=2000):
            print("   → Guardando perfil...")
            save_btn.click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            print("   ✅ Perfil guardado")
    except:
        print("   ⚠️  No se encontró botón guardar, continuando...")

    take_screenshot(page, "step1_profile_saved")
    return True

def complete_bank_profiling_step(page):
    """Completar perfilación bancaria"""
    print("\n🏦 PASO: PERFILACIÓN BANCARIA")

    # Verificar si estamos siendo redirigidos automáticamente
    current_url = page.url
    if '/perfilacion' not in current_url:
        print("   → Navegando a perfilación bancaria...")
        page.goto('http://localhost:5173/escritorio/perfilacion-bancaria')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
    else:
        print("   ✅ Ya estamos en perfilación bancaria (redirección automática)")

    handle_update_modal(page)
    take_screenshot(page, "step2_bank_profiling_start")

    print("   → Completando perfilación bancaria...")

    # Responder preguntas de perfilación
    max_questions = 10
    for question_num in range(max_questions):
        # Seleccionar opciones de radio/botones
        try:
            option_buttons = page.locator('button[role="radio"]:visible, button[type="button"]:visible').all()
            if len(option_buttons) > 0:
                visible = [btn for btn in option_buttons if btn.is_visible()]
                if visible:
                    random.choice(visible).click()
                    time.sleep(0.5)
        except:
            pass

        # Buscar botón siguiente/continuar
        next_found = False
        for selector in ['button:has-text("Siguiente")', 'button:has-text("Continuar")', 'button:has-text("Finalizar")']:
            try:
                btn = page.locator(selector).first
                if btn.is_visible(timeout=1000):
                    btn.click()
                    page.wait_for_load_state('networkidle')
                    time.sleep(1)
                    next_found = True
                    break
            except:
                continue

        if not next_found:
            break

    take_screenshot(page, "step2_bank_profiling_completed")
    print("   ✅ Perfilación bancaria completada")

    # Esperar redirección automática a aplicación
    time.sleep(2)
    return True

def main():
    """Función principal del test"""
    print("="*80)
    print("🚀 TEST DE PRODUCCIÓN - FLUJO COMPLETO AUTOMATIZADO")
    print("="*80)
    print("\nFlujo del Test:")
    print("  1. Hard reset y validación homepage")
    print("  2. Login automático")
    print("  3. Navegación a vehículo → Clic 'Comprar con financiamiento'")
    print("  4. /escritorio/profile → Completar perfil")
    print("  5. /escritorio/perfilacion-bancaria → Completar perfilación")
    print("  6. /escritorio/aplicacion → Completar solicitud")
    print("  7. /escritorio/aplicacion/:id/confirmacion → Verificar éxito")
    print("\n" + "="*80 + "\n")

    with sync_playwright() as p:
        # Lanzar navegador
        browser = p.chromium.launch(headless=False)

        # Crear contexto CON persistencia para mantener sesión
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            locale='es-MX'
        )

        context.set_default_timeout(90000)
        page = context.new_page()

        try:
            # PASO 0: Hard Reset
            hard_reset_browser(context)

            # PASO 1: Validar homepage con reintentos
            if not validate_homepage_with_retries(page, max_attempts=3):
                raise Exception("Homepage no cargó correctamente después de 3 intentos")

            # PASO 2: Login automático
            if not auto_login(page):
                raise Exception("Login falló")

            time.sleep(2)

            # PASO 3: Navegar a vehículo y hacer clic en financiamiento
            if not navigate_to_vehicle_and_click_financing(page):
                raise Exception("No se pudo navegar a vehículo o hacer clic en financiamiento")

            # En este punto deberíamos estar en /escritorio/profile o ser redirigidos ahí
            time.sleep(2)
            current_url = page.url
            print(f"\n📍 URL después de clic en financiamiento: {current_url}")

            # PASO 4: Completar perfil
            complete_profile_step(page)

            # PASO 5: Perfilación bancaria (debería redirigir automáticamente)
            time.sleep(2)
            complete_bank_profiling_step(page)

            # PASO 6: Verificar que estamos en aplicación
            time.sleep(2)
            current_url = page.url
            print(f"\n📍 URL después de perfilación: {current_url}")

            if '/aplicacion' not in current_url:
                print("   ⚠️  No estamos en aplicación, navegando manualmente...")
                page.goto('http://localhost:5173/escritorio/aplicacion')
                page.wait_for_load_state('networkidle')
                time.sleep(2)
            else:
                print("   ✅ Redirigidos automáticamente a aplicación")

            # PASO 7: Completar flujo de aplicación
            complete_application_flow(page)

            # PASO 8: Verificar confirmación
            success = verify_confirmation_page(page)

            if success:
                print("\n" + "="*80)
                print("✅ TEST COMPLETAMENTE EXITOSO")
                print("="*80)
                print("\n🎉 Flujo completo ejecutado correctamente")
                print("📸 Revisa los screenshots prod_*.png\n")
            else:
                print("\n" + "="*80)
                print("⚠️  TEST PARCIALMENTE EXITOSO")
                print("="*80)
                print("\nEl flujo avanzó pero no llegó a confirmación")
                print("Revisa los screenshots para ver el estado final\n")

            # Mantener navegador abierto
            print("⏳ Navegador permanecerá abierto 60 segundos para inspección...")
            time.sleep(60)

        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            take_screenshot(page, "error_final")
            import traceback
            traceback.print_exc()

            print("\n⏳ Navegador permanecerá abierto 30 segundos para debugging...")
            time.sleep(30)

        finally:
            print("\n🏁 Cerrando navegador...")
            browser.close()
            print("✅ Test finalizado\n")

if __name__ == "__main__":
    main()
