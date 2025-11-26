# 🧪 Prueba Manual de Google Sheets Sync

Esta guía te permitirá probar la sincronización con Google Sheets manualmente.

## Opción 1: Usando SQL Editor en Supabase Dashboard

### Paso 1: Crear Aplicación de Prueba

Abre el SQL Editor en tu Dashboard de Supabase y ejecuta:

```sql
-- Primero, obtén un user_id válido
SELECT id, email, role
FROM profiles
WHERE role = 'user'
LIMIT 1;
```

Copia el `id` del usuario. Luego ejecuta (reemplaza `'USER_ID_AQUI'` con el ID que copiaste):

```sql
INSERT INTO financing_applications (
  user_id,
  status,
  personal_info_snapshot,
  application_data,
  car_info,
  selected_banks,
  assigned_to
) VALUES (
  'USER_ID_AQUI', -- Reemplaza con el user_id que copiaste
  'Completa',
  jsonb_build_object(
    'first_name', 'Juan',
    'last_name', 'Pérez',
    'mother_last_name', 'García',
    'email', 'test@example.com',
    'phone', '8181234567',
    'rfc', 'PEGJ900101',
    'homoclave', 'XX0',
    'birth_date', '1990-01-01',
    'civil_status', 'Soltero',
    'fiscal_situation', 'Persona Física',
    'address', 'Calle Principal 123',
    'colony', 'Centro',
    'city', 'Monterrey',
    'state', 'Nuevo León',
    'zip_code', '64000',
    'mobile_carrier', 'Telcel',
    'asesor_asignado_id', 'USER_ID_AQUI',
    'advisor_name', 'Asesor Prueba'
  ),
  jsonb_build_object(
    'current_address', 'Calle Principal 123',
    'current_colony', 'Centro',
    'current_city', 'Monterrey',
    'current_state', 'Nuevo León',
    'current_zip_code', '64000',
    'time_at_address', '2 años',
    'housing_type', 'Propia',
    'grado_de_estudios', 'Licenciatura',
    'dependents', '2',
    'fiscal_classification', 'Asalariado',
    'company_name', 'Empresa Prueba S.A.',
    'company_phone', '8187654321',
    'net_monthly_income', '25000',
    'loan_term_months', '48',
    'down_payment_amount', '50000',
    'estimated_monthly_payment', '8000',
    'mobile_carrier', 'Telcel',
    'terms_and_conditions', true,
    'consent_survey', true
  ),
  jsonb_build_object(
    '_vehicleTitle', 'Toyota Corolla 2024 TEST',
    '_ordenCompra', 'OC-TEST-001',
    'precio', '350000',
    'enganche_recomendado', '70000',
    'enganchemin', '50000'
  ),
  ARRAY['BBVA', 'Santander'],
  'USER_ID_AQUI' -- Reemplaza con el mismo user_id
)
RETURNING id, status, created_at;
```

**✅ Esto debería:**
1. Crear una nueva fila en Google Sheets
2. Incluir "Telcel" en la columna "Compañía Celular"
3. Incluir el correo del asesor en "Correo del Asesor"

---

### Paso 2: Actualizar la Aplicación (Simular Subida de Documentos)

Copia el `id` que retornó el paso anterior y ejecuta:

```sql
UPDATE financing_applications
SET
  status = 'En Revisión',
  application_data = application_data || jsonb_build_object(
    'documents_uploaded', true,
    'upload_timestamp', NOW()
  ),
  updated_at = NOW()
WHERE id = 'APPLICATION_ID_AQUI' -- Reemplaza con el id de la aplicación
RETURNING id, status, updated_at;
```

**✅ Esto debería:**
1. ACTUALIZAR la fila existente (NO crear una nueva)
2. Cambiar el estado a "En Revisión"

---

### Paso 3: Tercera Actualización (Simular Aprobación)

```sql
UPDATE financing_applications
SET
  status = 'Aprobada',
  application_data = application_data || jsonb_build_object(
    'approval_timestamp', NOW()
  ),
  updated_at = NOW()
WHERE id = 'APPLICATION_ID_AQUI' -- Reemplaza con el mismo id
RETURNING id, status, updated_at;
```

**✅ Esto debería:**
1. ACTUALIZAR la misma fila (NO crear otra nueva)
2. Cambiar el estado a "Aprobada"

---

## 📊 Verificación en Google Sheets

Ve a tu Google Sheet y verifica:

1. ✅ Solo hay **UNA fila** con el ID de aplicación que creaste
2. ✅ La columna "Estado" muestra "Aprobada" (el último estado)
3. ✅ La columna "Compañía Celular" muestra "Telcel"
4. ✅ La columna "Correo del Asesor" tiene el email del usuario

---

## 📋 Ver Logs de la Edge Function

Para ver qué está pasando en la Edge Function:

```bash
npx supabase functions logs google-sheets-sync --tail
```

Busca estos mensajes en los logs:
- ✅ `"Application {id} not found, creating new row..."` (primera vez)
- ✅ `"Application {id} found at row {N}, updating..."` (actualizaciones)
- ✅ `"Successfully created application {id} in Google Sheets"`
- ✅ `"Successfully updated application {id} in Google Sheets"`

---

## 🗑️ Limpiar la Prueba

Cuando termines, elimina la aplicación de prueba:

```sql
DELETE FROM financing_applications
WHERE id = 'APPLICATION_ID_AQUI';
```

Y elimina la fila correspondiente en Google Sheets manualmente.

---

## ❓ Solución de Problemas

### La fila no se crea en Google Sheets

1. Verifica que el trigger esté activo:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_application_sync_to_sheets';
```

2. Verifica que la Edge Function esté desplegada:
```bash
npx supabase functions list
```

3. Revisa los logs de la función:
```bash
npx supabase functions logs google-sheets-sync
```

### Se crean múltiples filas en lugar de actualizar

Esto indicaría que la función `findApplicationRow` no está encontrando la fila existente. Verifica:
1. Que la columna A del sheet se llama exactamente "ID de Solicitud"
2. Que los IDs coinciden (son UUIDs)
3. Revisa los logs de la Edge Function para ver qué está pasando

---

## 🎯 Resultado Esperado

Al final de las 3 operaciones, deberías tener:
- ✅ 1 fila en Google Sheets (no 3)
- ✅ Estado: "Aprobada"
- ✅ Todas las columnas llenas correctamente
- ✅ "Compañía Celular": "Telcel"
- ✅ "Correo del Asesor": email del usuario
