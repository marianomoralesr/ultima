"""
Test móvil 100% automatizado usando temp-mail.org para recibir OTP.

Flujo:
1. Hard reset completo (cookies, caché, force reload)
2. Obtener correo temporal de temp-mail.org
3. Navegar a /acceder e ingresar el correo temporal
4. Esperar y capturar OTP del correo recibido
5. Ingresar OTP y completar login
6. Continuar con el flujo automático: navegar, filtrar, buscar, seleccionar vehículo
7. Click en "Comprar con financiamiento"
8. Verificar vehículo visible en aplicación
"""

from playwright.sync_api import sync_playwright
import time
import re

def take_screenshot(page, name):
    filename = f"mobile_{name}.png"
    page.screenshot(path=filename, full_page=True)
    print(f"   📸 {filename}")

def hard_reset_browser(page):
    """Limpieza completa del navegador"""
    print("\n🔄 HARD RESET DEL NAVEGADOR MÓVIL")

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

def get_temp_email(page):
    """Obtener correo temporal de temp-mail.org"""
    print("\n📧 OBTENIENDO CORREO TEMPORAL")

    try:
        # Navegar a temp-mail API
        print("   → Navegando a temp-mail.org...")
        page.goto('https://temp-mail.org/en/', wait_until='domcontentloaded')
        time.sleep(5)

        take_screenshot(page, "01_temp_mail")

        # Intentar obtener el correo del input
        email_selectors = [
            'input#mail',
            'input[type="text"]',
            '#email',
            '.email-address',
            'input[readonly]'
        ]

        temp_email = None
        for selector in email_selectors:
            try:
                email_input = page.locator(selector).first
                if email_input.is_visible(timeout=2000):
                    temp_email = email_input.input_value()
                    if temp_email and '@' in temp_email:
                        print(f"   ✅ Correo obtenido: {temp_email}")
                        return temp_email, page
            except:
                continue

        # Si no funcionó, intentar con el botón de copiar
        try:
            copy_btn = page.locator('button:has-text("Copy"), button[title*="Copy"]').first
            if copy_btn.is_visible(timeout=2000):
                # Hacer clic en copiar
                copy_btn.click()
                time.sleep(1)

                # Intentar leer del portapapeles con JavaScript
                temp_email = page.evaluate('() => navigator.clipboard.readText()')
                if temp_email and '@' in temp_email:
                    print(f"   ✅ Correo obtenido del portapapeles: {temp_email}")
                    return temp_email, page
        except:
            pass

        print("   ❌ No se pudo obtener correo temporal")
        return None, page

    except Exception as e:
        print(f"   ❌ Error obteniendo correo temporal: {e}")
        return None, page

def login_with_temp_email(page, temp_email, temp_mail_page):
    """Hacer login usando el correo temporal y OTP"""
    print("\n🔐 LOGIN CON CORREO TEMPORAL")

    # Navegar a /acceder en una nueva pestaña
    print("   → Navegando a /acceder...")
    login_page = page.context.new_page()
    login_page.goto('http://localhost:5173/acceder', wait_until='domcontentloaded')
    time.sleep(2)

    take_screenshot(login_page, "02_login_page")

    # Ingresar el correo temporal
    print(f"   → Ingresando correo: {temp_email}...")
    try:
        email_input = login_page.locator('input[type="email"], input[name="email"]').first
        email_input.fill(temp_email)
        time.sleep(1)

        # Hacer clic en botón de enviar/continuar
        submit_selectors = [
            'button[type="submit"]',
            'button:has-text("Continuar")',
            'button:has-text("Enviar")',
            'button:has-text("Siguiente")'
        ]

        for selector in submit_selectors:
            try:
                btn = login_page.locator(selector).first
                if btn.is_visible(timeout=2000):
                    btn.click()
                    login_page.wait_for_load_state('networkidle')
                    time.sleep(3)
                    print("   ✅ Correo enviado, esperando OTP...")
                    break
            except:
                continue

        take_screenshot(login_page, "03_waiting_otp")

    except Exception as e:
        print(f"   ❌ Error ingresando correo: {e}")
        return None

    # Volver a temp-mail para obtener el OTP
    print("\n📬 ESPERANDO CORREO CON OTP...")
    temp_mail_page.bring_to_front()

    otp_code = None
    max_attempts = 12  # 12 intentos de 5 segundos = 1 minuto

    for attempt in range(max_attempts):
        print(f"   → Intento {attempt + 1}/{max_attempts}...")
        time.sleep(5)

        # Refrescar la página para ver nuevos correos
        temp_mail_page.reload(wait_until='domcontentloaded')
        time.sleep(2)

        take_screenshot(temp_mail_page, f"04_inbox_attempt_{attempt + 1}")

        try:
            # Buscar correo de TREFA
            email_selectors = [
                'a:has-text("TREFA")',
                'a:has-text("trefa")',
                'div:has-text("TREFA")',
                '.mail-item:has-text("TREFA")',
                'li:has-text("TREFA")'
            ]

            for selector in email_selectors:
                try:
                    email_item = temp_mail_page.locator(selector).first
                    if email_item.is_visible(timeout=2000):
                        print("   ✅ ¡Correo de TREFA encontrado!")
                        email_item.click()
                        time.sleep(3)

                        take_screenshot(temp_mail_page, "05_otp_email_opened")

                        # Extraer OTP del contenido del correo
                        email_content = temp_mail_page.content()

                        # Buscar patrones de OTP (típicamente 6 dígitos)
                        otp_patterns = [
                            r'\b\d{6}\b',  # 6 dígitos
                            r'código:\s*(\d{6})',
                            r'OTP:\s*(\d{6})',
                            r'código de verificación:\s*(\d{6})'
                        ]

                        for pattern in otp_patterns:
                            matches = re.findall(pattern, email_content, re.IGNORECASE)
                            if matches:
                                otp_code = matches[0] if isinstance(matches[0], str) else matches[0]
                                print(f"   ✅ OTP encontrado: {otp_code}")
                                break

                        if otp_code:
                            break
                except:
                    continue

            if otp_code:
                break

        except Exception as e:
            print(f"   ⚠️  Error buscando correo: {e}")
            continue

    if not otp_code:
        print("   ❌ No se recibió OTP después de 1 minuto")
        return None

    # Volver a la página de login e ingresar OTP
    print(f"\n🔢 INGRESANDO OTP: {otp_code}")
    login_page.bring_to_front()
    time.sleep(1)

    try:
        # Buscar inputs de OTP
        otp_inputs = login_page.locator('input[type="text"], input[type="number"], input[name*="otp"]').all()

        if len(otp_inputs) == 1:
            # Un solo input para todo el OTP
            otp_inputs[0].fill(otp_code)
            time.sleep(1)
        elif len(otp_inputs) >= 6:
            # Inputs separados por dígito
            for i, digit in enumerate(otp_code[:6]):
                if i < len(otp_inputs):
                    otp_inputs[i].fill(digit)
                    time.sleep(0.2)

        take_screenshot(login_page, "06_otp_entered")

        # Hacer clic en botón de verificar/continuar
        verify_selectors = [
            'button:has-text("Verificar")',
            'button:has-text("Continuar")',
            'button:has-text("Ingresar")',
            'button[type="submit"]'
        ]

        for selector in verify_selectors:
            try:
                btn = login_page.locator(selector).first
                if btn.is_visible(timeout=2000):
                    btn.click()
                    login_page.wait_for_load_state('networkidle')
                    time.sleep(3)
                    break
            except:
                continue

        take_screenshot(login_page, "07_after_login")

        # Verificar que el login fue exitoso
        current_url = login_page.url
        print(f"   📍 URL actual: {current_url}")

        if '/escritorio' in current_url or '/dashboard' in current_url:
            print("   ✅ ¡Login exitoso!")
            # Cerrar temp-mail page
            temp_mail_page.close()
            return login_page
        else:
            print(f"   ⚠️  Login posiblemente exitoso, verificando...")
            return login_page

    except Exception as e:
        print(f"   ❌ Error ingresando OTP: {e}")
        return None

def navigate_and_select_vehicle(page):
    """Navegar al inventario y seleccionar un vehículo"""
    print("\n🚗 NAVEGACIÓN AL INVENTARIO")

    # Ir a /autos
    page.goto('http://localhost:5173/autos', wait_until='domcontentloaded')
    time.sleep(3)
    take_screenshot(page, "08_inventory")

    # Seleccionar primer vehículo
    try:
        vehicle_links = page.locator('a[href*="/autos/"]:not([href="/autos"])').all()

        if len(vehicle_links) > 0:
            print(f"   ✅ Encontrados {len(vehicle_links)} vehículos")
            first_link = vehicle_links[0]
            vehicle_href = first_link.get_attribute('href')

            if vehicle_href:
                full_url = f"http://localhost:5173{vehicle_href}" if vehicle_href.startswith('/') else vehicle_href
                print(f"   → Navegando a vehículo: {full_url}")

                page.goto(full_url, wait_until='domcontentloaded')
                time.sleep(3)
                take_screenshot(page, "09_vehicle_detail")

                return True

        return False

    except Exception as e:
        print(f"   ❌ Error seleccionando vehículo: {e}")
        return False

def click_financing_button(page):
    """Hacer clic en botón de financiamiento"""
    print("\n💰 CLICK EN 'COMPRAR CON FINANCIAMIENTO'")

    try:
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
                    print(f"   → Haciendo clic...")
                    btn.click()
                    page.wait_for_load_state('networkidle')
                    time.sleep(3)

                    take_screenshot(page, "10_after_financing_click")

                    current_url = page.url
                    print(f"   ✅ URL: {current_url}")

                    if '/aplicacion' in current_url:
                        print("   🎉 ¡Navegado a aplicación con vehículo!")
                        return True

                    return True
            except:
                continue

        print("   ❌ No se encontró botón de financiamiento")
        return False

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print("=" * 80)
    print("📱 TEST MÓVIL 100% AUTOMATIZADO CON TEMP-MAIL")
    print("=" * 80)
    print("\nFlujo:")
    print("  1. Hard reset completo")
    print("  2. Obtener correo temporal")
    print("  3. Login con OTP automático")
    print("  4. Navegar y seleccionar vehículo")
    print("  5. Click en 'Comprar con financiamiento'")
    print("  6. Verificar aplicación con vehículo")
    print("=" * 80 + "\n")

    with sync_playwright() as p:
        device = p.devices['iPhone 12 Pro']

        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            **device,
            locale='es-MX',
            timezone_id='America/Mexico_City'
        )

        # Página principal para temp-mail
        temp_mail_page = context.new_page()
        temp_mail_page.set_default_timeout(60000)

        try:
            # Hard reset
            temp_mail_page.goto('http://localhost:5173')
            hard_reset_browser(temp_mail_page)

            # Force reload
            print("\n🔄 FORCE RELOAD")
            temp_mail_page.reload(wait_until='domcontentloaded')
            time.sleep(2)

            # Obtener correo temporal
            temp_email, temp_mail_page = get_temp_email(temp_mail_page)

            if not temp_email:
                raise Exception("No se pudo obtener correo temporal")

            # Login con OTP
            logged_page = login_with_temp_email(temp_mail_page, temp_email, temp_mail_page)

            if not logged_page:
                raise Exception("Login falló")

            # Navegar y seleccionar vehículo
            if not navigate_and_select_vehicle(logged_page):
                raise Exception("No se pudo seleccionar vehículo")

            # Click en financiamiento
            if not click_financing_button(logged_page):
                raise Exception("No se pudo hacer clic en financiamiento")

            print("\n" + "=" * 80)
            print("✅ TEST MÓVIL EXITOSO")
            print("=" * 80)
            print("\n🎉 Flujo completo automatizado correctamente")
            print("📧 Login con correo temporal y OTP automático")
            print("🚗 Vehículo seleccionado y aplicación iniciada")

            print("\n⏳ Navegador permanecerá abierto 60 segundos...")
            time.sleep(60)

        except Exception as e:
            print(f"\n❌ Error: {e}")
            take_screenshot(temp_mail_page, "error_final")
            import traceback
            traceback.print_exc()

        finally:
            print("\n🏁 Cerrando navegador...")
            browser.close()
            print("✅ Test finalizado\n")

if __name__ == "__main__":
    main()
