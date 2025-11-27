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
import os

TEST_EMAIL = "test.automation@trefa.test"
TEST_PASSWORD = "TestTrefa2024!"

# Generador de teléfonos únicos
PHONE_COUNTER_FILE = ".phone_counter.txt"

def get_unique_phone():
    """Genera teléfonos únicos secuencialmente desde 8199999998"""
    if os.path.exists(PHONE_COUNTER_FILE):
        with open(PHONE_COUNTER_FILE, 'r') as f:
            counter = int(f.read().strip())
    else:
        counter = 8199999998

    # Decrementar para siguiente uso
    next_counter = counter - 1
    with open(PHONE_COUNTER_FILE, 'w') as f:
        f.write(str(next_counter))

    phone = str(counter)
    print(f"   → Teléfono único generado: {phone}")
    return phone

def take_screenshot(page, name):
    filename = f"correct_{name}.png"
    try:
        page.screenshot(path=filename, timeout=10000)
        print(f"   📸 {filename}")
    except Exception as e:
        print(f"   ⚠️  Error screenshot {filename}: {str(e)[:50]}")

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
    Mejorado: Llena TODOS los campos, maneja múltiples opciones y errores
    """
    print("\n📝 COMPLETANDO APLICACIÓN (SIN MANIPULAR URL)")

    current_url = page.url
    print(f"   📍 URL inicial: {current_url}")
    take_screenshot(page, "07_application_start")

    # Generar teléfono único para este test
    unique_phone = get_unique_phone()

    max_steps = 15
    max_retries_per_step = 3

    for step in range(max_steps):
        print(f"\n   → Paso {step + 1}")

        for retry in range(max_retries_per_step):
            if retry > 0:
                print(f"   ⚠️  Reintento {retry + 1}/{max_retries_per_step}")

            # 1. LLENAR TODOS LOS INPUTS DE TEXTO
            try:
                all_inputs = page.locator('input:visible').all()
                print(f"   → Encontrados {len(all_inputs)} inputs visibles")

                for idx, input_field in enumerate(all_inputs):
                    try:
                        if not input_field.is_visible():
                            continue

                        # Verificar si ya tiene valor
                        current_value = input_field.input_value()
                        if current_value and len(current_value) > 0:
                            continue

                        input_type = input_field.get_attribute('type') or 'text'
                        placeholder = input_field.get_attribute('placeholder') or ''
                        name = input_field.get_attribute('name') or ''
                        id_attr = input_field.get_attribute('id') or ''

                        print(f"   → Llenando input {idx + 1}: type={input_type}, name={name}, placeholder={placeholder[:30]}")

                        # Determinar valor basado en contexto
                        if input_type in ['radio', 'checkbox']:
                            continue  # Manejado más abajo
                        elif input_type == 'tel' or 'tel' in name.lower() or 'teléfono' in placeholder.lower() or 'phone' in name.lower():
                            input_field.fill(unique_phone)
                        elif input_type == 'email' or 'email' in name.lower() or 'correo' in placeholder.lower():
                            input_field.fill('test@example.com')
                        elif 'nombre' in placeholder.lower() or 'nombre' in name.lower():
                            if 'completo' in placeholder.lower() or 'completo' in name.lower():
                                input_field.fill('Juan Pérez García')
                            else:
                                input_field.fill('Juan')
                        elif 'apellido' in placeholder.lower() or 'apellido' in name.lower():
                            input_field.fill('Pérez García')
                        elif 'cónyuge' in placeholder.lower() or 'conyuge' in placeholder.lower() or 'esposa' in placeholder.lower() or 'esposo' in placeholder.lower() or 'spouse' in placeholder.lower():
                            input_field.fill('María González López')
                        elif 'rfc' in name.lower() or 'rfc' in placeholder.lower():
                            input_field.fill('PEGJ900101XXX')
                        elif 'curp' in name.lower() or 'curp' in placeholder.lower():
                            input_field.fill('PEGJ900101HNLRRN09')
                        elif 'calle' in placeholder.lower() or 'calle' in name.lower():
                            input_field.fill('Av. Insurgentes')
                        elif 'número' in placeholder.lower() or 'numero' in placeholder.lower():
                            input_field.fill('123')
                        elif 'colonia' in placeholder.lower() or 'colonia' in name.lower():
                            input_field.fill('Centro')
                        elif 'ciudad' in placeholder.lower() or 'ciudad' in name.lower():
                            input_field.fill('Monterrey')
                        elif 'estado' in placeholder.lower() or 'estado' in name.lower():
                            input_field.fill('Nuevo León')
                        elif 'cp' in name.lower() or 'postal' in placeholder.lower() or 'código' in placeholder.lower():
                            input_field.fill('64000')
                        elif input_type == 'number' or 'monto' in placeholder.lower() or 'cantidad' in placeholder.lower():
                            # Si es un campo de fecha individual (día, mes, año)
                            if 'día' in placeholder.lower() or 'dia' in placeholder.lower() or 'day' in placeholder.lower():
                                input_field.fill('10')
                            elif 'mes' in placeholder.lower() or 'month' in placeholder.lower():
                                input_field.fill('10')
                            elif 'año' in placeholder.lower() or 'year' in placeholder.lower():
                                input_field.fill('1990')
                            else:
                                input_field.fill('100000')
                        elif 'fecha' in placeholder.lower() or 'date' in input_type or 'nacimiento' in placeholder.lower():
                            # Intentar con formato de fecha apropiado
                            if input_type == 'date':
                                input_field.fill('1990-10-10')  # Formato YYYY-MM-DD para campos date
                            else:
                                input_field.fill('10/10/1990')  # Formato DD/MM/YYYY para texto
                        else:
                            input_field.fill('Valor de prueba')

                        time.sleep(0.1)
                    except Exception as e:
                        print(f"   ⚠️  Error llenando input {idx + 1}: {str(e)[:50]}")
                        continue
            except Exception as e:
                print(f"   ⚠️  Error en inputs: {str(e)[:50]}")

            # 2. SELECCIONAR TODAS LAS OPCIONES DE SELECT/DROPDOWN
            try:
                selects = page.locator('select:visible').all()
                print(f"   → Encontrados {len(selects)} selects visibles")

                for idx, sel in enumerate(selects):
                    try:
                        if not sel.is_visible():
                            continue

                        # Scroll into view
                        sel.scroll_into_view_if_needed()
                        time.sleep(0.2)

                        options = sel.locator('option').all()
                        if len(options) > 1:
                            # Seleccionar la primera opción válida (no placeholder)
                            # Intentar por valor primero, luego por index
                            try:
                                first_value = options[1].get_attribute('value')
                                if first_value:
                                    sel.select_option(value=first_value)
                                else:
                                    sel.select_option(index=1)
                            except:
                                sel.select_option(index=1)

                            selected = sel.input_value()
                            print(f"   → Select {idx + 1}: seleccionado opción con valor={selected}")
                            time.sleep(0.3)
                    except Exception as e:
                        print(f"   ⚠️  Error en select {idx + 1}: {str(e)[:50]}")
                        continue
            except Exception as e:
                print(f"   ⚠️  Error en selects: {str(e)[:50]}")

            # 3. HACER CLIC EN RADIO BUTTONS Y OPCIONES MÚLTIPLES
            try:
                # Buscar grupos de radio buttons por nombre
                radio_groups = {}
                radios = page.locator('input[type="radio"]:visible').all()
                print(f"   → Encontrados {len(radios)} radio buttons")

                for radio in radios:
                    try:
                        name = radio.get_attribute('name')
                        if name:
                            if name not in radio_groups:
                                radio_groups[name] = []
                            radio_groups[name].append(radio)
                    except:
                        continue

                # Seleccionar primera opción de cada grupo
                for group_name, group_radios in radio_groups.items():
                    try:
                        if len(group_radios) > 0:
                            # Para estado civil, seleccionar "Casado" si existe, sino la primera
                            selected_option = None
                            if 'estado' in group_name.lower() or 'civil' in group_name.lower():
                                for r in group_radios:
                                    value = r.get_attribute('value') or ''
                                    if 'casado' in value.lower() or 'married' in value.lower():
                                        selected_option = r
                                        print(f"   → Radio group '{group_name}': seleccionando 'Casado'")
                                        break

                            if not selected_option:
                                selected_option = group_radios[0]
                                print(f"   → Radio group '{group_name}': seleccionada primera opción")

                            selected_option.check()
                            time.sleep(0.3)  # Esperar que aparezcan campos dependientes
                    except:
                        continue

                # Buscar botones tipo radio (button[type="button"] que funcionan como radio)
                # Estos son comunes para género, estado civil, etc.
                button_radios = page.locator('button[type="button"]:visible, button[role="radio"]:visible').all()
                print(f"   → Encontrados {len(button_radios)} button-radios")

                # Agrupar por contexto (buscar texto cercano para identificar el grupo)
                processed_groups = set()

                for idx, btn in enumerate(button_radios):
                    try:
                        # Verificar si ya está seleccionado
                        aria_checked = btn.get_attribute('aria-checked')
                        class_name = btn.get_attribute('class') or ''

                        if aria_checked == 'true' or 'selected' in class_name:
                            continue  # Ya está seleccionado

                        # Obtener texto del botón para identificar el tipo de pregunta
                        btn_text = btn.text_content().strip().lower()

                        # Identificar el grupo/pregunta padre
                        parent_text = ''
                        try:
                            parent = btn.evaluate('el => el.closest("div[role=radiogroup], fieldset, .form-group, .question")')
                            if parent:
                                parent_locator = page.locator(f'xpath=//button[contains(text(), "{btn_text}")]/ancestor::div[@role="radiogroup" or contains(@class, "form-group") or contains(@class, "question")][1]')
                                parent_text = parent_locator.first.text_content() if parent_locator.count() > 0 else ''
                        except:
                            pass

                        # Crear identificador único para el grupo
                        group_id = f"{parent_text[:50]}_{idx // 5}"

                        if group_id in processed_groups:
                            continue  # Ya procesamos este grupo

                        # Seleccionar según el tipo de pregunta
                        should_click = False

                        # Para género: seleccionar "Masculino" o primera opción
                        if 'género' in parent_text.lower() or 'genero' in parent_text.lower() or 'sexo' in parent_text.lower():
                            if 'masculino' in btn_text or 'hombre' in btn_text or 'male' in btn_text:
                                should_click = True
                                print(f"   → Género: seleccionando 'Masculino'")
                            elif idx == 0 or not any('masculino' in b.text_content().lower() for b in button_radios):
                                should_click = True
                                print(f"   → Género: seleccionando primera opción")

                        # Para estado civil: seleccionar "Casado"
                        elif 'estado' in parent_text.lower() and 'civil' in parent_text.lower():
                            if 'casado' in btn_text or 'married' in btn_text:
                                should_click = True
                                print(f"   → Estado civil: seleccionando 'Casado' (abrirá campo de cónyuge)")
                            elif idx == 0 or not any('casado' in b.text_content().lower() for b in button_radios):
                                should_click = True
                                print(f"   → Estado civil: seleccionando primera opción")

                        # Para asesor asignado: seleccionar "Sí" (esto abrirá un dropdown)
                        elif 'asesor' in parent_text.lower() or 'asignado' in parent_text.lower():
                            if 'sí' in btn_text or 'si' in btn_text or 'yes' in btn_text:
                                should_click = True
                                print(f"   → Asesor asignado: seleccionando 'Sí' (abrirá dropdown)")
                            elif 'no' in btn_text and not any('sí' in b.text_content().lower() or 'si' in b.text_content().lower() for b in button_radios):
                                should_click = True
                                print(f"   → Asesor asignado: seleccionando 'No'")

                        # Para otras preguntas: seleccionar primera opción no seleccionada
                        else:
                            if aria_checked != 'true':
                                should_click = True
                                print(f"   → Button-radio '{btn_text[:30]}': seleccionando")

                        if should_click:
                            # Scroll into view y esperar
                            btn.scroll_into_view_if_needed()
                            time.sleep(0.2)
                            # Click con force para asegurar
                            btn.click(force=True)
                            time.sleep(0.5)  # Esperar animaciones/campos dependientes
                            processed_groups.add(group_id)

                    except Exception as e:
                        print(f"   ⚠️  Error con button-radio {idx}: {str(e)[:50]}")
                        continue

            except Exception as e:
                print(f"   ⚠️  Error en radios: {str(e)[:50]}")

            # 4. HACER SCROLL HACIA ABAJO PARA VER MÁS CAMPOS Y EL BOTÓN
            print("   → Scrolleando hacia abajo para ver todos los campos...")
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(0.5)

            # 5. VERIFICAR SI HAY TABS Y CLICKEAR EN "FISCAL" SI EXISTE
            try:
                fiscal_tab = page.locator('button:has-text("Fiscal"), [role="tab"]:has-text("Fiscal")').first
                if fiscal_tab.is_visible(timeout=2000):
                    print("   → Clickeando en tab 'Fiscal'...")
                    fiscal_tab.click()
                    time.sleep(1)

                    # Llenar campos fiscales si aparecen
                    fiscal_inputs = page.locator('input:visible').all()
                    for inp in fiscal_inputs:
                        try:
                            placeholder = inp.get_attribute('placeholder') or ''
                            if 'rfc' in placeholder.lower():
                                inp.fill('XAXX010101000')
                                print("   → RFC llenado")
                            elif 'fiscal' in placeholder.lower() or 'dirección' in placeholder.lower():
                                inp.fill('Calle Fiscal 123, Col. Centro')
                                print("   → Dirección fiscal llenada")
                        except:
                            continue
            except:
                print("   → No se encontró tab Fiscal (puede no existir)")

            # 6. CHECKBOXES (con scroll para asegurar visibilidad)
            try:
                checkboxes = page.locator('input[type="checkbox"]:visible').all()
                print(f"   → Encontrados {len(checkboxes)} checkboxes")

                for idx, cb in enumerate(checkboxes):
                    try:
                        # Scroll al checkbox
                        cb.scroll_into_view_if_needed()
                        time.sleep(0.2)

                        if not cb.is_checked():
                            cb.check(force=True)
                            print(f"   → Checkbox {idx + 1}: checked")
                            time.sleep(0.3)
                    except Exception as e:
                        print(f"   ⚠️  Error en checkbox {idx + 1}: {str(e)[:30]}")
                        continue
            except Exception as e:
                print(f"   ⚠️  Error en checkboxes: {str(e)[:50]}")

            time.sleep(0.5)

            # Scroll hacia abajo una vez más antes de buscar el botón
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(0.3)

            take_screenshot(page, f"08_step_{step + 1}_attempt_{retry + 1}")

            # 7. INTENTAR HACER CLIC EN "SIGUIENTE" / "GUARDAR Y CONTINUAR"
            next_buttons = [
                'button:has-text("Siguiente")',
                'button:has-text("Continuar")',
                'button:has-text("Guardar y continuar")',
                'button:has-text("Enviar Solicitud")',
                'button:has-text("Enviar")',
                'button[type="submit"]:visible'
            ]

            button_clicked = False
            for selector in next_buttons:
                try:
                    btn = page.locator(selector).first
                    if btn.is_visible(timeout=2000) and not btn.is_disabled():
                        print(f"   → Encontrado botón: {selector}")

                        # Scroll al botón y esperar
                        btn.scroll_into_view_if_needed()
                        time.sleep(0.5)

                        print(f"   → Haciendo clic en: {selector}")
                        btn.click(force=True)
                        page.wait_for_load_state('networkidle', timeout=15000)
                        time.sleep(2)
                        button_clicked = True

                        current_url = page.url
                        print(f"   📍 URL actual: {current_url}")

                        # Verificar si hay errores
                        error_messages = page.locator('.error, [class*="error"], [role="alert"]').all()
                        if len(error_messages) > 0:
                            print(f"   ⚠️  Detectados {len(error_messages)} errores en la página")
                            for i, err in enumerate(error_messages[:3]):
                                try:
                                    text = err.text_content()
                                    if text and len(text.strip()) > 0:
                                        print(f"      Error {i + 1}: {text[:100]}")
                                except:
                                    pass
                            # No romper el loop, volver a llenar
                            break

                        # Verificar si llegamos a confirmación
                        if '/confirmacion' in current_url:
                            print("\n   🎉 ¡LLEGAMOS A CONFIRMACIÓN!")
                            take_screenshot(page, "09_confirmation")
                            return True

                        # Si avanzamos a nueva página, salir del retry loop
                        return complete_application_automatically(page)  # Llamada recursiva para siguiente paso
                except Exception as e:
                    print(f"   ⚠️  Error con botón {selector}: {str(e)[:50]}")
                    continue

            if button_clicked:
                break  # Salir del retry loop si clickeamos botón

            if retry == max_retries_per_step - 1:
                print("   ❌ No se pudo avanzar después de 3 intentos")
                break

        # Si no encontramos botón después de todos los reintentos
        if not button_clicked:
            print("   ℹ️  No se encontró botón siguiente")
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
        # Tamaño ajustado para MacBook 14" - ventana más pequeña
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
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
