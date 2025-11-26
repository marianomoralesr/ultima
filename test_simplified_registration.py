"""
Test simplificado del flujo de registro - enfocado en Auth y OTP.

Este script:
1. Va directo a /acceder
2. Ingresa email
3. Espera OTP manual
4. Verifica redirección a escritorio
"""

from playwright.sync_api import sync_playwright
import time
import random
import string

def generate_test_email():
    """Genera un email de prueba único"""
    timestamp = str(int(time.time()))
    random_str = ''.join(random.choices(string.ascii_lowercase, k=4))
    return f"test.{timestamp}.{random_str}@trefa.test"

def take_screenshot(page, name):
    """Toma screenshot"""
    filename = f"test_{name}.png"
    page.screenshot(path=filename, full_page=True)
    print(f"📸 {filename}")
    return filename

def run_test():
    print("="*80)
    print("🚀 TEST SIMPLIFICADO - REGISTRO Y OTP")
    print("="*80)

    with sync_playwright() as p:
        # Lanzar navegador
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        context.set_default_timeout(90000)
        page = context.new_page()

        try:
        # Email de prueba
        test_email = generate_test_email()
        print(f"\n📧 Email: {test_email}")

        # PASO 1: Ir a /acceder
        print("\n→ Paso 1: Navegando a /acceder")
        page.goto('http://localhost:5173/acceder', wait_until='domcontentloaded')
        time.sleep(3)
        take_screenshot(page, "01_auth_page")
        print("✅ Página de autenticación cargada")

        # PASO 2: Ingresar email
        print("\n→ Paso 2: Ingresando email")
        email_input = page.locator('input[type="email"]').first
        email_input.fill(test_email)
        take_screenshot(page, "02_email_filled")
        print(f"✅ Email ingresado: {test_email}")

        # PASO 3: Enviar OTP
        print("\n→ Paso 3: Solicitando código OTP")
        submit_btn = page.locator('button[type="submit"]').first
        submit_btn.click()

        # Esperar pantalla de OTP
        page.wait_for_selector('input[inputmode="numeric"]', timeout=15000)
        time.sleep(2)
        take_screenshot(page, "03_otp_screen")
        print("✅ Pantalla de OTP mostrada")

        # PASO 4: Esperar OTP manual
        print("\n" + "="*80)
        print("⏳ INGRESA EL CÓDIGO OTP")
        print("="*80)
        print("1. Revisa tu email")
        print("2. Copia el código de 6 dígitos")
        print("3. Pégalo en la página")
        print("4. Presiona 'Verificar y Continuar'")
        print("="*80)
        print("\n⏰ Esperando hasta 3 minutos...")

        # Esperar redirección a escritorio
        try:
            page.wait_for_url("**/escritorio**", timeout=180000)  # 3 minutos
            time.sleep(2)
            take_screenshot(page, "04_after_otp")
            print(f"\n✅ OTP VERIFICADO")
            print(f"📍 URL actual: {page.url}")

            # Verificar si estamos en perfil o dashboard
            if '/profile' in page.url or '/perfil' in page.url:
                print("✅ Redirigido a completar perfil")
            elif '/perfilacion' in page.url:
                print("✅ Redirigido a perfilación bancaria")
            elif '/escritorio' in page.url:
                print("✅ Redirigido a escritorio")

            print("\n" + "="*80)
            print("✅ TEST EXITOSO - OTP VERIFICADO Y SESIÓN INICIADA")
            print("="*80)

            # Mantener abierto para inspección
            print("\n⏳ Navegador se cerrará en 30 segundos...")
            time.sleep(30)

            return True

        except Exception as e:
            print(f"\n❌ Timeout esperando OTP: {e}")
            take_screenshot(page, "05_otp_timeout")
            return False

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        take_screenshot(page, "error")
        import traceback
        traceback.print_exc()
        return False

    finally:
        browser.close()
