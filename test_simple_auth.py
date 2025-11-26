"""
Test simplificado del flujo de autenticación con OTP.
"""

from playwright.sync_api import sync_playwright
import time
import random
import string

def generate_test_email():
    timestamp = str(int(time.time()))
    random_str = ''.join(random.choices(string.ascii_lowercase, k=4))
    return f"test.{timestamp}.{random_str}@trefa.test"

def take_screenshot(page, name):
    filename = f"test_{name}.png"
    page.screenshot(path=filename, full_page=True)
    print(f"📸 {filename}")

print("="*80)
print("🚀 TEST DE AUTENTICACIÓN Y OTP")
print("="*80)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()
    page.set_default_timeout(90000)

    # Usa TU email real para recibir el OTP
    test_email = "mariano.morales@autostrefa.mx"  # Cambia este email al que quieras usar
    print(f"\n📧 Email de prueba: {test_email}")
    print("⚠️  NOTA: Si ya tienes una cuenta, el test hará LOGIN en lugar de REGISTRO")

    try:
        # Paso 1: Ir a /acceder
        print("\n→ Navegando a /acceder...")
        page.goto('http://localhost:5173/acceder')
        page.wait_for_load_state('domcontentloaded')
        time.sleep(2)
        take_screenshot(page, "01_auth")
        print("✅ Página cargada")

        # Paso 2: Ingresar email
        print("\n→ Ingresando email...")
        page.locator('input[type="email"]').fill(test_email)
        take_screenshot(page, "02_email")
        print("✅ Email ingresado")

        # Paso 3: Enviar OTP
        print("\n→ Enviando solicitud de OTP...")
        page.locator('button[type="submit"]').click()
        page.wait_for_selector('input[inputmode="numeric"]', timeout=10000)
        time.sleep(1)
        take_screenshot(page, "03_otp_screen")
        print("✅ Pantalla de OTP mostrada")

        # Paso 4: Esperar ingreso manual de OTP
        print("\n" + "="*80)
        print("⏳ INGRESA EL CÓDIGO OTP MANUALMENTE")
        print("="*80)
        print("1. Revisa tu correo")
        print("2. Ingresa el código de 6 dígitos")
        print("3. Presiona 'Verificar y Continuar'")
        print("="*80)
        print("\n⏰ Esperando (máx 3 minutos)...\n")

        # Esperar redirección
        page.wait_for_url("**/escritorio**", timeout=180000)
        time.sleep(2)
        take_screenshot(page, "04_success")

        print("\n" + "="*80)
        print("✅ TEST EXITOSO")
        print(f"📍 Redirigido a: {page.url}")
        print("="*80)

        print("\n⏳ Cerrando en 20 segundos...")
        time.sleep(20)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        take_screenshot(page, "error")

    finally:
        browser.close()
