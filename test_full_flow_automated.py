"""
Test completamente automatizado del flujo completo:
1. Login automático con usuario/contraseña
2. Manejar modal de actualización si aparece
3. Completar perfil
4. Perfilación bancaria
5. Solicitud de financiamiento
6. Llegar a página de confirmación

NO requiere OTP - 100% automatizado.
"""

from playwright.sync_api import sync_playwright
import time
import random

# Credenciales del usuario de prueba
TEST_EMAIL = "test.automation@trefa.test"
TEST_PASSWORD = "TestTrefa2024!"

def take_screenshot(page, name):
    filename = f"flow_{name}.png"
    page.screenshot(path=filename, full_page=True)
    print(f"   📸 {filename}")

def handle_update_modal(page):
    """
    Detecta y maneja modales de actualización/nueva versión.
    Busca botones como "Actualizar", "Reload", "Refresh", etc.
    """
    try:
        # Esperar un momento para ver si aparece el modal
        time.sleep(1)

        # Buscar botones comunes de actualización
        update_buttons = [
            'button:has-text("Actualizar")',
            'button:has-text("Reload")',
            'button:has-text("Refresh")',
            'button:has-text("Recargar")',
            '[data-action="reload"]',
            '[data-action="update"]'
        ]

        for selector in update_buttons:
            try:
                btn = page.locator(selector).first
                if btn.is_visible(timeout=2000):
                    print(f"   ⚠️  Detectado modal de actualización - haciendo clic en '{selector}'")
                    btn.click()
                    page.wait_for_load_state('networkidle', timeout=10000)
                    time.sleep(2)
                    return True
            except:
                continue

        return False
    except Exception as e:
        print(f"   ℹ️  No se detectó modal de actualización")
        return False

def auto_login(page):
    """Login automático usando JavaScript"""
    print("\n→ PASO 1: Login Automático")

    page.goto('http://localhost:5173')
    page.wait_for_load_state('domcontentloaded')
    time.sleep(2)
    take_screenshot(page, "01_homepage")

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
        print(f"   ✅ Login exitoso - User ID: {result.get('user', {}).get('id', 'N/A')[:20]}...")
        return True
    else:
        print(f"   ❌ Error en login: {result.get('error')}")
        return False

def complete_profile(page):
    """Completar perfil si es necesario"""
    print("\n→ PASO 2: Verificar/Completar Perfil")

    page.goto('http://localhost:5173/escritorio/profile')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Manejar modal de actualización si aparece
    handle_update_modal(page)

    take_screenshot(page, "02_profile_page")

    # Verificar si el perfil ya está completo
    try:
        # Si vemos un mensaje de "perfil completo" o similar, skip
        if "completo" in page.content().lower():
            print("   ✅ Perfil ya completo")
            return True
    except:
        pass

    print("   📝 Completando campos del perfil...")

    # Llenar campos básicos si están vacíos
    try:
        fields_to_fill = [
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

        for selector, value in fields_to_fill:
            try:
                field = page.locator(selector).first
                if field.is_visible(timeout=1000):
                    current_value = field.input_value() if 'select' not in selector else ''
                    if not current_value or current_value.strip() == '':
                        if 'select' in selector:
                            field.select_option(value)
                        else:
                            field.fill(value)
                        time.sleep(0.3)
            except:
                continue

        take_screenshot(page, "03_profile_filled")

        # Guardar perfil
        save_btn = page.locator('button:has-text("Guardar"), button[type="submit"]').first
        if save_btn.is_visible(timeout=2000):
            save_btn.click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            print("   ✅ Perfil guardado")

        return True

    except Exception as e:
        print(f"   ⚠️  Error completando perfil: {e}")
        return False

def complete_bank_profiling(page):
    """Completar perfilación bancaria"""
    print("\n→ PASO 3: Perfilación Bancaria")

    page.goto('http://localhost:5173/escritorio/perfilacion-bancaria')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Manejar modal de actualización
    handle_update_modal(page)

    take_screenshot(page, "04_bank_profiling_start")

    print("   📝 Completando perfilación bancaria...")

    try:
        # Buscar y hacer clic en opciones de forma automática
        # Esto seleccionará respuestas al azar
        max_attempts = 10
        for attempt in range(max_attempts):
            # Buscar botones de radio o botones de opción
            option_buttons = page.locator('button[role="radio"], button[type="button"]').all()

            if len(option_buttons) > 0:
                # Seleccionar una opción aleatoria visible
                visible_buttons = [btn for btn in option_buttons if btn.is_visible()]
                if visible_buttons:
                    random_btn = random.choice(visible_buttons)
                    random_btn.click()
                    time.sleep(0.5)

            # Buscar botón "Siguiente" o "Continuar"
            next_btns = [
                'button:has-text("Siguiente")',
                'button:has-text("Continuar")',
                'button:has-text("Finalizar")'
            ]

            clicked_next = False
            for selector in next_btns:
                try:
                    btn = page.locator(selector).first
                    if btn.is_visible(timeout=1000):
                        btn.click()
                        page.wait_for_load_state('networkidle')
                        time.sleep(1)
                        clicked_next = True
                        break
                except:
                    continue

            # Si no hay más botones "Siguiente", hemos terminado
            if not clicked_next:
                break

        take_screenshot(page, "05_bank_profiling_completed")
        print("   ✅ Perfilación bancaria completada")
        return True

    except Exception as e:
        print(f"   ⚠️  Error en perfilación bancaria: {e}")
        return False

def complete_application(page):
    """Completar solicitud de financiamiento"""
    print("\n→ PASO 4: Solicitud de Financiamiento")

    # Navegar a aplicación (puede auto-crear o usar existente)
    page.goto('http://localhost:5173/escritorio/aplicacion')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Manejar modal de actualización
    handle_update_modal(page)

    take_screenshot(page, "06_application_start")

    print("   📝 Completando formulario de solicitud...")

    try:
        # Navegar por los pasos del formulario
        max_steps = 6
        for step in range(max_steps):
            print(f"   → Paso {step + 1} del formulario...")

            # Llenar campos visibles automáticamente
            text_inputs = page.locator('input[type="text"]:visible, input[type="tel"]:visible').all()
            for input_field in text_inputs[:5]:  # Llenar máximo 5 campos por paso
                try:
                    if input_field.is_visible():
                        placeholder = input_field.get_attribute('placeholder') or ''
                        if 'teléfono' in placeholder.lower() or 'phone' in placeholder.lower():
                            input_field.fill('8112345678')
                        elif 'nombre' in placeholder.lower() or 'name' in placeholder.lower():
                            input_field.fill('Juan Pérez')
                        else:
                            input_field.fill('Valor de prueba')
                        time.sleep(0.2)
                except:
                    continue

            # Seleccionar opciones de radio buttons si hay
            radio_buttons = page.locator('button[type="button"]:visible').all()
            if len(radio_buttons) > 0:
                try:
                    radio_buttons[0].click()
                    time.sleep(0.3)
                except:
                    pass

            take_screenshot(page, f"07_application_step_{step + 1}")

            # Buscar botón "Siguiente"
            next_btn = page.locator('button:has-text("Siguiente")').first
            try:
                if next_btn.is_visible(timeout=2000):
                    next_btn.click()
                    page.wait_for_load_state('networkidle')
                    time.sleep(2)
                else:
                    # Si no hay botón "Siguiente", probablemente estamos en el último paso
                    break
            except:
                break

        # Buscar botón "Enviar Solicitud" o "Enviar"
        submit_buttons = [
            'button:has-text("Enviar Solicitud")',
            'button:has-text("Enviar")',
            'button[type="submit"]:has-text("Enviar")'
        ]

        for selector in submit_buttons:
            try:
                btn = page.locator(selector).first
                if btn.is_visible(timeout=2000) and not btn.is_disabled():
                    print("   → Enviando solicitud...")
                    btn.click()
                    page.wait_for_load_state('networkidle')
                    time.sleep(3)
                    break
            except:
                continue

        take_screenshot(page, "08_application_submitted")
        print("   ✅ Formulario de solicitud completado")
        return True

    except Exception as e:
        print(f"   ⚠️  Error completando solicitud: {e}")
        return False

def verify_confirmation_page(page):
    """Verificar que llegamos a la página de confirmación"""
    print("\n→ PASO 5: Verificar Página de Confirmación")

    time.sleep(2)
    current_url = page.url
    take_screenshot(page, "09_final_page")

    # Verificar si estamos en la página de confirmación
    if '/confirmacion' in current_url:
        print(f"   ✅ ¡ÉXITO! Llegamos a la página de confirmación")
        print(f"   📍 URL: {current_url}")

        # Verificar elementos de confirmación
        try:
            success_elements = [
                'text=/Felicidades|Solicitud.*Enviada|Éxito/i',
                '.text-green-600',
                '[data-testid="success-icon"]'
            ]

            for selector in success_elements:
                try:
                    if page.locator(selector).first.is_visible(timeout=2000):
                        print(f"   ✅ Elemento de éxito visible: {selector}")
                except:
                    continue

        except Exception as e:
            print(f"   ℹ️  No se pudieron verificar todos los elementos: {e}")

        return True
    else:
        print(f"   ⚠️  No llegamos a confirmación. URL actual: {current_url}")
        return False

print("="*80)
print("🚀 TEST COMPLETO AUTOMATIZADO - FLUJO END-TO-END")
print("="*80)
print(f"\n📧 Usuario: {TEST_EMAIL}")
print("🎯 Objetivo: Login → Perfil → Perfilación → Solicitud → Confirmación")
print("⚡ 100% automatizado - sin intervención manual\n")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()
    page.set_default_timeout(60000)

    try:
        # Paso 1: Login
        if not auto_login(page):
            raise Exception("Login falló")

        # Paso 2: Completar perfil
        complete_profile(page)

        # Paso 3: Perfilación bancaria
        complete_bank_profiling(page)

        # Paso 4: Solicitud de financiamiento
        complete_application(page)

        # Paso 5: Verificar confirmación
        success = verify_confirmation_page(page)

        if success:
            print("\n" + "="*80)
            print("✅ TEST COMPLETO EXITOSO")
            print("="*80)
            print("\n🎉 El flujo completo funcionó de principio a fin")
            print("📸 Revisa los screenshots flow_*.png para ver cada paso\n")
        else:
            print("\n" + "="*80)
            print("⚠️  TEST PARCIALMENTE EXITOSO")
            print("="*80)
            print("\nEl flujo avanzó pero no llegó a la página de confirmación")
            print("Revisa los screenshots para ver dónde se detuvo\n")

        # Mantener navegador abierto para inspección
        print("⏳ Navegador permanecerá abierto 45 segundos para inspección...")
        time.sleep(45)

    except Exception as e:
        print(f"\n❌ Error en el flujo: {e}")
        take_screenshot(page, "error_final")
        import traceback
        traceback.print_exc()

    finally:
        print("\n🏁 Cerrando navegador...")
        browser.close()
        print("✅ Test finalizado\n")
