"""
Test de autenticación con TU EMAIL - para recibir OTP real.

Este script:
1. Te pide tu email al inicio
2. Solicita el código OTP
3. Espera a que lo ingreses manualmente
4. Verifica que llegues a la página de escritorio
"""

from playwright.sync_api import sync_playwright
import time

def take_screenshot(page, name):
    filename = f"test_{name}.png"
    page.screenshot(path=filename, full_page=True)
    print(f"📸 Screenshot guardado: {filename}")

print("="*80)
print("🚀 TEST DE AUTENTICACIÓN CON OTP")
print("="*80)

# PEDIR EMAIL AL USUARIO
print("\n📧 Ingresa tu email para recibir el OTP:")
print("   (Usa un email al que tengas acceso)")
print("   Ejemplo: tu-email@gmail.com")
user_email = input("\nEmail: ").strip()

if not user_email or '@' not in user_email:
    print("❌ Email inválido. Por favor ejecuta el script de nuevo.")
    exit(1)

print(f"\n✅ Usando email: {user_email}")
print("\n⏳ Iniciando test en 3 segundos...")
time.sleep(3)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()
    page.set_default_timeout(90000)

    try:
        # Paso 1: Navegar a /acceder
        print("\n" + "-"*80)
        print("PASO 1: Navegando a página de autenticación")
        print("-"*80)
        page.goto('http://localhost:5173/acceder')
        page.wait_for_load_state('domcontentloaded')
        time.sleep(2)
        take_screenshot(page, "01_auth_page")
        print("✅ Página de autenticación cargada")

        # Paso 2: Ingresar email
        print("\n" + "-"*80)
        print("PASO 2: Ingresando tu email")
        print("-"*80)
        email_field = page.locator('input[type="email"]').first
        email_field.fill(user_email)
        time.sleep(1)
        take_screenshot(page, "02_email_filled")
        print(f"✅ Email ingresado: {user_email}")

        # Paso 3: Solicitar OTP
        print("\n" + "-"*80)
        print("PASO 3: Solicitando código OTP")
        print("-"*80)
        submit_button = page.locator('button[type="submit"]').first
        submit_button.click()

        # Esperar pantalla de OTP
        print("⏳ Esperando pantalla de verificación OTP...")
        page.wait_for_selector('input[inputmode="numeric"]', timeout=10000)
        time.sleep(2)
        take_screenshot(page, "03_otp_screen")
        print("✅ Pantalla de OTP mostrada")

        # Paso 4: Esperar ingreso manual de OTP
        print("\n" + "="*80)
        print("⏳ AHORA INGRESA EL CÓDIGO OTP MANUALMENTE")
        print("="*80)
        print(f"\n1. Revisa el email que enviamos a: {user_email}")
        print("2. Busca el correo de Supabase/TREFA")
        print("3. Copia el código de 6 dígitos")
        print("4. Pégalo en el navegador que se abrió")
        print("5. Presiona el botón 'Verificar y Continuar'")
        print("\n" + "="*80)
        print("⏰ El test esperará hasta 3 minutos a que completes este paso...")
        print("="*80 + "\n")

        # Esperar redirección después de verificar OTP
        try:
            page.wait_for_url("**/escritorio**", timeout=180000)  # 3 minutos
            time.sleep(2)
            take_screenshot(page, "04_success_after_otp")

            current_url = page.url

            print("\n" + "="*80)
            print("✅ TEST EXITOSO - OTP VERIFICADO")
            print("="*80)
            print(f"\n📍 Redirigido exitosamente a: {current_url}")

            if '/profile' in current_url:
                print("\n📝 Estado: Necesitas completar tu perfil")
                print("   → El test te llevó hasta aquí correctamente")
            elif '/perfilacion' in current_url:
                print("\n🏦 Estado: Necesitas completar perfilación bancaria")
                print("   → El test te llevó hasta aquí correctamente")
            elif '/escritorio' in current_url:
                print("\n🏠 Estado: En el dashboard principal")
                print("   → El test te llevó hasta aquí correctamente")

            print("\n✅ El flujo de autenticación funciona correctamente")
            print("="*80)

            # Mantener navegador abierto para inspección
            print("\n⏳ Navegador permanecerá abierto por 30 segundos para inspección...")
            print("   Presiona Ctrl+C para cerrar antes si quieres.\n")
            time.sleep(30)

        except Exception as timeout_error:
            print("\n" + "="*80)
            print("⏰ TIMEOUT - NO SE COMPLETÓ LA VERIFICACIÓN OTP")
            print("="*80)
            print("\nPosibles causas:")
            print("1. No ingresaste el código OTP a tiempo (3 minutos máximo)")
            print("2. El código OTP era incorrecto")
            print("3. Hubo un error de red o del servidor")
            print("\n💡 Consejo: Ejecuta el script de nuevo e intenta más rápido")
            take_screenshot(page, "05_otp_timeout")
            print(f"\n📸 Screenshot del error guardado: test_05_otp_timeout.png")

    except Exception as e:
        print("\n" + "="*80)
        print("❌ ERROR DURANTE EL TEST")
        print("="*80)
        print(f"\nDetalle del error: {e}")
        take_screenshot(page, "error_general")
        print(f"\n📸 Screenshot del error guardado: test_error_general.png")

        import traceback
        print("\nStack trace completo:")
        traceback.print_exc()

    finally:
        print("\n🏁 Cerrando navegador...")
        browser.close()
        print("✅ Test finalizado\n")
