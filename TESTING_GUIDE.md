# Guía de Testing con Playwright MCP Server

## 📋 Resumen

He creado un test automatizado completo que simula el flujo de registro de un usuario desde la landing page de financiamientos hasta la página de confirmación de solicitud enviada.

## 🎯 Flujo Testeado

El test automatiza los siguientes pasos:

1. **Landing de Financiamientos** → Navegación a `/financiamientos`
2. **Selección de Auto** → Clic en "Elegir mi auto" y selección de vehículo
3. **Página de Autenticación** → Ingreso de email
4. **Verificación OTP** → **PASO MANUAL** (debe ingresar el código recibido por email)
5. **Completar Perfil** → Llenado automático de datos personales
6. **Perfilación Bancaria** → Selección de opciones bancarias
7. **Solicitud de Financiamiento** → Navegación por los pasos del formulario
8. **Confirmación** → Verificación de llegada a página de confirmación

## 🔑 Características del Test

### ✅ Lo que SÍ hace automáticamente:

- Genera emails de prueba únicos con timestamp
- Navega por todas las páginas del flujo
- Llena formularios automáticamente
- Toma screenshots en cada paso importante
- Verifica la llegada a la página de confirmación
- Detecta elementos de éxito (ícono verde, título de confirmación)
- Genera logs detallados de cada paso

### ⚠️ Lo que requiere intervención manual:

- **Verificación OTP**: El test se pausa y espera a que ingreses manualmente el código de 6 dígitos recibido por email
  - Tienes 2 minutos para completar este paso
  - El test detecta automáticamente cuando el OTP es verificado y continúa

## 🚀 Cómo Ejecutar el Test

### Instalación (ya completada)

```bash
pip3 install playwright
/Users/marianomorales/Library/Python/3.9/bin/playwright install chromium
```

### Ejecución

```bash
cd /Users/marianomorales/Downloads/ultima\ copy
python3 test_registration_flow.py
```

## 📸 Screenshots Generados

El test genera automáticamente screenshots con timestamp en cada paso:

- `screenshot_TIMESTAMP_01_landing_financiamientos.png`
- `screenshot_TIMESTAMP_02_autos_page.png`
- `screenshot_TIMESTAMP_03_vehicle_detail.png`
- `screenshot_TIMESTAMP_04_auth_page.png`
- `screenshot_TIMESTAMP_05_otp_screen.png`
- `screenshot_TIMESTAMP_06_after_otp.png`
- `screenshot_TIMESTAMP_07_profile_filled.png`
- Y muchos más...

## 🎨 Experiencia del Usuario Durante el Test

1. **Navegador visible**: El test ejecuta en modo `headless=False` para que veas todo el proceso
2. **Velocidad reducida**: Usa `slow_mo=500` para mejor visualización
3. **Pausas estratégicas**: El script espera a que se completen las navegaciones
4. **Logs en tiempo real**: Ves mensajes en consola indicando cada paso

## 📝 Ejemplo de Ejecución

```
================================================================================
🚀 INICIANDO TEST DE FLUJO DE REGISTRO COMPLETO
================================================================================

📧 Email de prueba generado: test.automation.1732654321.abcd@trefa.test

--------------------------------------------------------------------------------
PASO 1: Navegando a landing de financiamientos
--------------------------------------------------------------------------------
📸 Screenshot guardado: screenshot_1732654321_01_landing_financiamientos.png
✅ Landing de financiamientos cargada

🖱️  Haciendo clic en 'Elegir mi auto'...
📸 Screenshot guardado: screenshot_1732654322_02_autos_page.png
✅ Página de autos cargada

--------------------------------------------------------------------------------
PASO 2: Seleccionando un auto
--------------------------------------------------------------------------------
🚗 Seleccionando vehículo: Volkswagen Jetta 2024
📸 Screenshot guardado: screenshot_1732654323_03_vehicle_detail.png
✅ Detalle del vehículo cargado

--------------------------------------------------------------------------------
PASO 3: Registrando con email
--------------------------------------------------------------------------------
📧 Email ingresado: test.automation.1732654321.abcd@trefa.test
📸 Screenshot guardado: screenshot_1732654324_05_otp_screen.png
✅ Pantalla de OTP mostrada

--------------------------------------------------------------------------------
PASO 4: Verificación de OTP
--------------------------------------------------------------------------------
================================================================================
⏳ ESPERANDO OTP
================================================================================
Por favor:
1. Revisa tu correo electrónico
2. Copia el código de 6 dígitos
3. Ingrésalo en la página
================================================================================

⏳ Esperando que ingreses el código OTP...
✅ OTP verificado exitosamente - navegando a escritorio

[... continúa con los demás pasos ...]

--------------------------------------------------------------------------------
PASO 8: Verificando página de confirmación
--------------------------------------------------------------------------------
✅ ¡ÉXITO! Llegamos a la página de confirmación
📍 URL final: http://localhost:5173/escritorio/aplicacion/123abc/confirmacion?firstSubmit=true
✅ Icono de éxito visible
✅ Título de confirmación visible
   Texto: ¡Felicidades! Tu Solicitud ha Sido Enviada

================================================================================
🏁 TEST FINALIZADO
================================================================================

✅ TEST EXITOSO - El flujo completo funcionó correctamente
```

## 🔍 Verificaciones que Realiza el Test

### En la Página de Confirmación:

1. **URL correcta**: Verifica que la URL contenga `/confirmacion`
2. **Ícono de éxito**: Busca el SVG con clase `text-green-600`
3. **Título de confirmación**: Verifica texto "Felicidades" o "Solicitud Enviada"
4. **Screenshot final**: Captura de pantalla de la confirmación

### Parámetros de Éxito:

- ✅ Navegación completada sin errores
- ✅ OTP verificado correctamente
- ✅ Formularios llenados
- ✅ Llegada a página de confirmación
- ✅ Elementos de UI de confirmación visibles

## 🐛 Solución de Problemas

### El test falla en el OTP

**Solución**: Tienes 2 minutos (120 segundos) para ingresar el código. Si se agota el tiempo, el test falla con un mensaje claro.

### No encuentra el botón de "Solicitar Financiamiento"

**Solución**: El script tiene múltiples selectores de respaldo y puede navegar directamente a `/acceder` si no encuentra el botón específico.

### Error de formulario incompleto

**Solución**: El script está configurado para llenar campos básicos. Si hay validaciones específicas que faltan, revisa los screenshots para identificar qué campo falta.

## 🎯 Beneficios de Este Approach

1. **Testing End-to-End Real**: Simula el comportamiento real de un usuario
2. **Detección Temprana de Bugs**: Identifica problemas de UX o flujo
3. **Documentación Visual**: Los screenshots sirven como evidencia del funcionamiento
4. **Automatización Parcial**: Aunque el OTP es manual, el resto está automatizado
5. **Debugging Fácil**: Logs detallados y screenshots en cada paso

## 🔄 Próximos Pasos Sugeridos

Para hacer el testing aún más robusto, podrías:

1. **Mockear el servicio de OTP** en entorno de testing para automatización completa
2. **Agregar assertions más específicas** en cada paso
3. **Crear variantes del test** con diferentes datos de entrada
4. **Integrar con CI/CD** para ejecutar automáticamente en cada deploy
5. **Agregar tests de regresión visual** comparando screenshots

## 📊 Métricas del Test

- **Tiempo estimado**: 5-10 minutos (dependiendo de velocidad manual en OTP)
- **Screenshots generados**: ~15-20 archivos
- **Pasos automatizados**: 8 pasos principales
- **Intervenciones manuales**: 1 (OTP)

## ✨ Casos de Uso Adicionales

Este mismo script puede adaptarse para:

- Testing de diferentes vehículos
- Validación de diferentes estados civiles
- Pruebas de perfiles bancarios variados
- Testing de edge cases (campos vacíos, datos inválidos)
- Performance testing (tiempos de carga)

---

**Nota**: El test mantiene el navegador abierto por 10 segundos al finalizar para permitir inspección visual del resultado final.
