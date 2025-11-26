"""
Test del flujo completo de registro desde landing de financiamientos hasta confirmación.

Este script automatiza:
1. Landing de financiamientos → Selección de auto
2. Registro con email → OTP
3. Completar perfil
4. Perfilación bancaria
5. Solicitud de financiamiento
6. Verificar página de confirmación

NOTA: El OTP debe ingresarse manualmente ya que es un código de seguridad real.
"""

from playwright.sync_api import sync_playwright, Page, expect
import time
import random
import string

def generate_test_email():
    """Genera un email de prueba único"""
    timestamp = str(int(time.time()))
    random_str = ''.join(random.choices(string.ascii_lowercase, k=4))
    return f"test.automation.{timestamp}.{random_str}@trefa.test"

def wait_for_otp_manual(page: Page):
    """Espera a que el usuario ingrese el OTP manualmente"""
    print("\n" + "="*80)
    print("⏳ ESPERANDO OTP")
    print("="*80)
    print("Por favor:")
    print("1. Revisa tu correo electrónico")
    print("2. Copia el código de 6 dígitos")
    print("3. Ingrésalo en la página")
    print("="*80)

    # Esperar a que el usuario ingrese el OTP y presione el botón
    # Detectamos la navegación fuera de la página de OTP
    print("\n⏳ Esperando que ingreses el código OTP...")

    # Esperar hasta 2 minutos para que se complete la verificación
    try:
        page.wait_for_url("**/escritorio/**", timeout=120000)
        print("✅ OTP verificado exitosamente - navegando a escritorio")
        return True
    except Exception as e:
        print(f"❌ Timeout esperando verificación de OTP: {e}")
        return False

def take_screenshot(page: Page, name: str):
    """Toma un screenshot y lo guarda con timestamp"""
    timestamp = int(time.time())
    filename = f"screenshot_{timestamp}_{name}.png"
    page.screenshot(path=filename, full_page=True)
    print(f"📸 Screenshot guardado: {filename}")
    return filename

def test_registration_flow():
    """Ejecuta el test completo del flujo de registro"""

    print("\n" + "="*80)
    print("🚀 INICIANDO TEST DE FLUJO DE REGISTRO COMPLETO")
    print("="*80)

    with sync_playwright() as p:
        # Lanzar navegador en modo headful para ver el proceso
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            locale='es-MX'
        )

        # Configurar timeouts más largos
        context.set_default_timeout(60000)  # 60 segundos
        context.set_default_navigation_timeout(60000)  # 60 segundos

        page = context.new_page()

        # Generar email de prueba
        test_email = generate_test_email()
        print(f"\n📧 Email de prueba generado: {test_email}")

        try:
            # PASO 1: Landing de Financiamientos
            print("\n" + "-"*80)
            print("PASO 1: Navegando a landing de financiamientos")
            print("-"*80)
            page.goto('http://localhost:5173/financiamientos', wait_until='domcontentloaded')
            time.sleep(2)  # Esperar a que cargue completamente
            take_screenshot(page, "01_landing_financiamientos")
            print("✅ Landing de financiamientos cargada")

            # Clic en "Elegir mi auto"
            print("\n🖱️  Haciendo clic en 'Elegir mi auto'...")
            elegir_auto_btn = page.get_by_role('link', name='Elegir mi auto')
            elegir_auto_btn.click()
            page.wait_for_load_state('networkidle')
            take_screenshot(page, "02_autos_page")
            print("✅ Página de autos cargada")

            # PASO 2: Seleccionar un auto
            print("\n" + "-"*80)
            print("PASO 2: Seleccionando un auto")
            print("-"*80)
            page.wait_for_selector('[data-vehicle-card]', timeout=10000)

            # Clic en el primer auto disponible
            first_vehicle = page.locator('[data-vehicle-card]').first
            first_vehicle.wait_for(state='visible')

            # Extraer título del vehículo para logging
            vehicle_title = first_vehicle.locator('h3, h2').first.text_content()
            print(f"🚗 Seleccionando vehículo: {vehicle_title}")

            first_vehicle.click()
            page.wait_for_load_state('networkidle')
            take_screenshot(page, "03_vehicle_detail")
            print("✅ Detalle del vehículo cargado")

            # Buscar botón "Solicitar Financiamiento" o "Iniciar Solicitud"
            print("\n🖱️  Buscando botón de solicitud de financiamiento...")

            # Intentar varios selectores posibles
            solicitar_buttons = [
                'button:has-text("Solicitar")',
                'button:has-text("Financiamiento")',
                'a:has-text("Solicitar")',
                '[data-action="apply-financing"]'
            ]

            button_clicked = False
            for selector in solicitar_buttons:
                try:
                    btn = page.locator(selector).first
                    if btn.is_visible(timeout=2000):
                        print(f"✅ Encontrado botón con selector: {selector}")
                        btn.click()
                        button_clicked = True
                        break
                except:
                    continue

            if not button_clicked:
                print("⚠️  No se encontró botón específico, usando navegación directa a /acceder")
                # Guardar ordencompra del URL actual si existe
                current_url = page.url
                if 'ordencompra' in current_url or '/autos/' in current_url:
                    # Navegar a acceder con el ordencompra
                    page.goto('http://localhost:5173/acceder')

            page.wait_for_load_state('networkidle')
            take_screenshot(page, "04_auth_page")
            print("✅ Página de autenticación cargada")

            # PASO 3: Registro con Email
            print("\n" + "-"*80)
            print("PASO 3: Registrando con email")
            print("-"*80)

            # Ingresar email
            email_input = page.locator('input[type="email"]')
            email_input.fill(test_email)
            print(f"📧 Email ingresado: {test_email}")

            # Clic en "Recibir código de acceso"
            submit_btn = page.locator('button:has-text("Recibir código")')
            submit_btn.click()

            # Esperar a que aparezca la pantalla de OTP
            page.wait_for_selector('input[type="text"][inputmode="numeric"]', timeout=10000)
            take_screenshot(page, "05_otp_screen")
            print("✅ Pantalla de OTP mostrada")

            # PASO 4: Verificación OTP (Manual)
            print("\n" + "-"*80)
            print("PASO 4: Verificación de OTP")
            print("-"*80)

            otp_success = wait_for_otp_manual(page)

            if not otp_success:
                print("❌ No se completó la verificación de OTP a tiempo")
                return False

            # Esperar a que cargue el escritorio/perfil
            page.wait_for_load_state('networkidle')
            time.sleep(2)  # Dar tiempo para redirección
            take_screenshot(page, "06_after_otp")
            print(f"✅ Navegado a: {page.url}")

            # PASO 5: Verificar si estamos en perfil o perfilación bancaria
            print("\n" + "-"*80)
            print("PASO 5: Completando información de perfil")
            print("-"*80)

            current_url = page.url

            # Si estamos en perfil, completarlo
            if '/profile' in current_url or '/perfil' in current_url:
                print("📝 Completando perfil personal...")

                # Llenar campos básicos del perfil
                try:
                    # Nombre
                    page.locator('input[name="first_name"], input[id="first_name"]').fill('Juan')
                    # Apellido paterno
                    page.locator('input[name="last_name"], input[id="last_name"]').fill('Pérez')
                    # Apellido materno
                    page.locator('input[name="mother_last_name"], input[id="mother_last_name"]').fill('García')
                    # RFC (ejemplo válido)
                    page.locator('input[name="rfc"], input[id="rfc"]').fill('PEGJ900101XXX')
                    # Teléfono
                    page.locator('input[name="phone"], input[id="phone"]').fill('8112345678')
                    # Fecha de nacimiento
                    page.locator('input[name="birth_date"], input[id="birth_date"], input[type="date"]').fill('1990-01-01')
                    # Estado civil
                    page.locator('select[name="civil_status"], select[id="civil_status"]').select_option('Soltero')

                    take_screenshot(page, "07_profile_filled")
                    print("✅ Campos de perfil completados")

                    # Guardar perfil
                    save_btn = page.locator('button:has-text("Guardar"), button[type="submit"]').first
                    save_btn.click()
                    page.wait_for_load_state('networkidle')
                    time.sleep(2)
                    take_screenshot(page, "08_profile_saved")
                    print("✅ Perfil guardado")

                except Exception as e:
                    print(f"⚠️  Error completando perfil: {e}")
                    print("Continuando con el flujo...")

            # PASO 6: Perfilación Bancaria
            print("\n" + "-"*80)
            print("PASO 6: Perfilación bancaria")
            print("-"*80)

            # Navegar a perfilación bancaria si no estamos ahí
            if '/perfilacion' not in page.url:
                print("🔄 Navegando a perfilación bancaria...")
                page.goto('http://localhost:5173/escritorio/perfilacion-bancaria')
                page.wait_for_load_state('networkidle')

            take_screenshot(page, "09_perfilacion_bancaria_start")
            print("✅ Página de perfilación bancaria cargada")

            # Completar perfilación bancaria (simulación - ajustar según UI real)
            print("📝 Completando perfilación bancaria...")
            try:
                # Buscar botones de opciones y hacer clic en las primeras opciones
                # Este es un ejemplo genérico - ajustar según la UI real
                time.sleep(2)

                # Intentar hacer clic en opciones de perfilación
                option_buttons = page.locator('button[type="button"]').all()
                if len(option_buttons) > 0:
                    print(f"✅ Encontrados {len(option_buttons)} botones de opciones")
                    # Seleccionar algunas opciones de forma automática
                    for i in range(min(5, len(option_buttons))):
                        try:
                            option_buttons[i].click()
                            time.sleep(0.5)
                        except:
                            pass

                take_screenshot(page, "10_perfilacion_completed")

                # Buscar botón para continuar/finalizar
                continue_btn = page.locator('button:has-text("Continuar"), button:has-text("Siguiente"), button:has-text("Finalizar")').first
                continue_btn.click()
                page.wait_for_load_state('networkidle')
                time.sleep(2)

                print("✅ Perfilación bancaria completada")

            except Exception as e:
                print(f"⚠️  Error en perfilación bancaria: {e}")
                print("Continuando con el flujo...")

            take_screenshot(page, "11_after_perfilacion")

            # PASO 7: Solicitud de Financiamiento
            print("\n" + "-"*80)
            print("PASO 7: Completando solicitud de financiamiento")
            print("-"*80)

            # Navegar a aplicación si no estamos ahí
            if '/aplicacion' not in page.url:
                print("🔄 Navegando a página de aplicación...")
                page.goto('http://localhost:5173/escritorio/aplicacion')
                page.wait_for_load_state('networkidle')

            take_screenshot(page, "12_application_start")
            print("✅ Página de aplicación cargada")

            # Completar formulario de aplicación (simplificado para demo)
            print("📝 Completando formulario de solicitud...")

            # Esta parte requiere completar múltiples pasos
            # Por ahora, tomamos screenshots de cada paso

            try:
                # Buscar botón "Siguiente" y hacer clic varias veces
                max_steps = 5
                for step in range(max_steps):
                    print(f"\n  → Paso {step + 1} del formulario")
                    take_screenshot(page, f"13_application_step_{step + 1}")

                    # Intentar llenar campos visibles
                    time.sleep(1)

                    # Buscar y hacer clic en "Siguiente"
                    try:
                        next_btn = page.locator('button:has-text("Siguiente")').first
                        if next_btn.is_visible():
                            next_btn.click()
                            page.wait_for_load_state('networkidle')
                            time.sleep(1)
                        else:
                            break
                    except:
                        break

                print("✅ Formulario de solicitud navegado")

            except Exception as e:
                print(f"⚠️  Error completando solicitud: {e}")

            # PASO 8: Verificar llegada a confirmación
            print("\n" + "-"*80)
            print("PASO 8: Verificando página de confirmación")
            print("-"*80)

            # Verificar si llegamos a la página de confirmación
            current_url = page.url
            take_screenshot(page, "14_final_page")

            if '/confirmacion' in current_url:
                print("✅ ¡ÉXITO! Llegamos a la página de confirmación")
                print(f"📍 URL final: {current_url}")

                # Verificar elementos de la página de confirmación
                try:
                    success_icon = page.locator('svg.text-green-600').first
                    if success_icon.is_visible():
                        print("✅ Icono de éxito visible")

                    success_title = page.locator('text=/Felicidades|Solicitud.*Enviada/i').first
                    if success_title.is_visible():
                        print("✅ Título de confirmación visible")
                        print(f"   Texto: {success_title.text_content()}")

                    take_screenshot(page, "15_confirmation_success")

                except Exception as e:
                    print(f"⚠️  Error verificando elementos de confirmación: {e}")

                return True
            else:
                print(f"⚠️  No llegamos a confirmación. URL actual: {current_url}")
                return False

        except Exception as e:
            print(f"\n❌ ERROR EN EL FLUJO: {e}")
            take_screenshot(page, "error_final")
            import traceback
            traceback.print_exc()
            return False

        finally:
            print("\n" + "="*80)
            print("🏁 TEST FINALIZADO")
            print("="*80)

            # Mantener navegador abierto por 10 segundos para inspección
            print("\n⏳ Manteniendo navegador abierto por 10 segundos...")
            time.sleep(10)

            browser.close()

if __name__ == "__main__":
    success = test_registration_flow()

    if success:
        print("\n✅ TEST EXITOSO - El flujo completo funcionó correctamente")
        exit(0)
    else:
        print("\n❌ TEST FALLÓ - Revisa los screenshots y logs")
        exit(1)
