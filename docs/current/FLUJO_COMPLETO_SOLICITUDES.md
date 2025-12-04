# Flujo Completo de Solicitudes de Financiamiento

## Estructura de Tablas

### `financing_applications`
Tabla principal de solicitudes.

**Columnas:**
- `id` (UUID): ID de la solicitud
- `user_id` (UUID): ID del usuario
- `status` (text): Estado de la solicitud
- `car_info` (JSONB): Información del vehículo seleccionado
- `personal_info_snapshot` (JSONB): Snapshot de la info personal al momento de envío
- `application_data` (JSONB): **TODA la información del formulario**
- `selected_banks` (text[]): Array de bancos recomendados
- `created_at`, `updated_at` (timestamp)

**Estados posibles:**
- `draft`: Borrador en progreso
- `Completa`: Borrador completo con documentos
- `Faltan Documentos`: Borrador incompleto
- `submitted`: Enviada oficialmente
- `reviewing` / `En Revisión`: En revisión por banco
- `approved` / `Aprobada`: Aprobada
- `rejected` / `Rechazada`: Rechazada
- `pending_docs`: Pendiente de documentos

### `uploaded_documents`
Tabla de documentos subidos.

**Columnas:**
- `id` (UUID): ID del documento
- `user_id` (UUID): ID del usuario
- `application_id` (UUID): ID de la solicitud
- `document_type` (text): Tipo de documento (ej: "INE Front", "Comprobante Ingresos")
- `file_name` (text): Nombre del archivo
- `file_path` (text): Ruta en storage
- `file_size` (integer): Tamaño del archivo
- `content_type` (text): MIME type
- `status` (text): Estado del documento ('pending', 'reviewing', 'approved', 'rejected')
- `created_at` (timestamp)

**Storage Bucket:** `application-documents` (privado)

### `bank_representative_profiles`
Perfiles de representantes bancarios.

**Columnas:**
- `id` (UUID): ID del representante (igual al user_id)
- `bank_affiliation` (text): Banco al que pertenece
- `pin` (text): PIN de 6 dígitos para autenticación
- `created_at`, `updated_at` (timestamp)

### `bank_assignments`
Asignaciones de solicitudes a bancos.

**Columnas:**
- `id` (UUID): ID de la asignación
- `application_id` (UUID): ID de la solicitud
- `assigned_bank_rep_id` (UUID): ID del representante bancario
- `status` (text): Estado de la asignación
- `notes` (text): Notas del banco
- `created_at`, `updated_at` (timestamp)

## Flujo de Registro y Solicitud

### 1. Registro de Usuario
**Ubicación:** `/registro` o `/financiamientos`

1. Usuario completa formulario de registro
2. Se crea registro en `auth.users` y `profiles`
3. Se asigna asesor automáticamente vía `assign_advisor()`
4. Usuario puede ingresar con email/contraseña

**Datos guardados en `profiles`:**
```typescript
{
  id: uuid,
  email: string,
  first_name: string,
  last_name: string,
  phone: string,
  address: string,
  asesor_asignado_id: uuid,
  role: 'user' | 'admin' | 'sales'
}
```

### 2. Inicio de Solicitud
**Ubicación:** `/escritorio/aplicacion` o `/escritorio/aplicacion/:id`

1. Usuario hace clic en "Nueva Solicitud" o continúa borrador
2. Si no hay borrador, se crea uno:
   ```typescript
   ApplicationService.createDraftApplication(userId, {
     car_info: vehicleInfo, // Si seleccionó vehículo
     application_data: {}
   })
   ```
3. Status inicial: `draft`

### 3. Completar Formulario (Multi-Step)
**Pasos:**
1. **Información Personal:** Nombre, email, teléfono, dirección, etc.
2. **Información Laboral:** Empleo, ingresos, antigüedad
3. **Información Financiera:** Gastos mensuales, deudas
4. **Documentos:** Upload de archivos requeridos
5. **Confirmación:** Review y submit

**Guardado de Progreso:**
- Al avanzar entre pasos: `ApplicationService.saveApplicationDraft()`
- Se guarda todo en `application_data` JSONB
- Ejemplo de estructura:
  ```json
  {
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan@example.com",
    "phone": "6141234567",
    "address": "Calle Principal 123",
    "employment_status": "Empleado",
    "monthly_income": 15000,
    "monthly_expenses": 8000,
    // ... todos los campos del formulario
  }
  ```

### 4. Upload de Documentos
**Ubicación:** Durante el formulario o después en Dashboard

**Proceso:**
1. Usuario sube archivo (PDF, JPG, PNG)
2. `DocumentService.uploadDocument()` se ejecuta:
   - Sube archivo a storage bucket `application-documents`
   - Crea registro en tabla `uploaded_documents`
   - Status inicial: `reviewing`
3. Los documentos NO se guardan en `financing_applications`
4. La relación es: `uploaded_documents.application_id` → `financing_applications.id`

**Documentos requeridos:**
- INE (Frente)
- INE (Reverso)
- Comprobante de Domicilio
- Comprobante de Ingresos (últimos 3 meses)
- Constancia de Situación Fiscal

### 5. Envío de Solicitud
**Trigger:** Usuario hace clic en "Enviar Solicitud"

**Proceso:**
1. Se valida que todos los campos estén completos
2. Se llama a `ApplicationService.submitApplication()`
3. Internamente ejecuta RPC `submit_application(application_data)`
4. El RPC:
   - Actualiza status a `submitted`
   - Guarda snapshot de perfil en `personal_info_snapshot`
   - DEBE actualizar `selected_banks` con bancos recomendados
5. Se envían notificaciones (email/WhatsApp)

**PROBLEMA ACTUAL:**
El RPC `submit_application` en `20251020121153_remote_schema.sql` está desactualizado.
Intenta insertar en columnas que YA NO EXISTEN:
- `personal_info` ❌
- `employment_info` ❌
- `financial_info` ❌
- `documents` ❌

**Columnas CORRECTAS:**
- `application_data` ✅ (contiene todo)
- `car_info` ✅
- `personal_info_snapshot` ✅

### 6. Routeo a Bancos
**Ubicación:** Backend / Admin

**Proceso:**
1. Sistema determina bancos recomendados basado en perfil
2. Se actualiza `selected_banks` array en la solicitud
3. Los representantes de esos bancos pueden ver la solicitud
4. Filtrado: `get_bank_rep_assigned_leads()` verifica `bank_affiliation = ANY(selected_banks)`

**Ejemplo:**
```sql
selected_banks = ['BBVA', 'Santander', 'Banorte']
```

Un representante de BBVA verá esta solicitud porque `'BBVA' = ANY(selected_banks)`

### 7. Portal Bancario
**Ubicación:** `/banco/escritorio`

**Proceso:**
1. Representante bancario inicia sesión con PIN
2. Ve lista de aplicaciones asignadas vía `get_bank_rep_assigned_leads()`
3. Esta función retorna:
   - Datos básicos del lead (nombre, email, teléfono)
   - `application_data` JSONB (toda la info del formulario)
   - NO retorna columnas individuales de documentos
4. Para ver documentos, el banco debe:
   - Consultar tabla `uploaded_documents`
   - Usar `application_id` para buscar documentos
   - Generar signed URLs para descargar

**BankService actual:**
- `downloadAllDocuments()` intenta leer columnas inexistentes (ine_url, etc.)
- **DEBE CORREGIRSE** para consultar tabla `uploaded_documents`

### 8. Actualización de Status
**Estados posibles:**

```
draft
  ↓
Completa / Faltan Documentos
  ↓
submitted
  ↓
reviewing / En Revisión
  ↓
approved / Aprobada  OR  rejected / Rechazada
```

**Actualización:**
- Usuario: NO puede cambiar status después de `submitted`
- Admin: Puede cambiar status en cualquier momento
- Banco: Puede actualizar via `bank_assignments.status`

### 9. Emails Automatizados
**Triggers:**

1. **Registro completado:**
   - Email de bienvenida
   - Asignación de asesor

2. **Solicitud enviada (status: submitted):**
   - Confirmación al usuario
   - Notificación a admin/asesor

3. **Status change:**
   - `reviewing`: "Tu solicitud está en revisión"
   - `approved`: "¡Tu crédito fue aprobado!"
   - `rejected`: "Tu solicitud fue rechazada"

**Implementación:**
- Edge Functions en Supabase (carpeta `/supabase/functions/`)
- Triggers de base de datos
- Webhooks

## Estructura de application_data JSONB

```json
{
  // Información Personal
  "first_name": "Juan",
  "last_name": "Pérez García",
  "email": "juan@example.com",
  "phone": "6141234567",
  "phone_company": "Telcel",
  "address": "Calle Principal 123",
  "city": "Chihuahua",
  "state": "Chihuahua",
  "postal_code": "31000",
  "date_of_birth": "1990-01-15",
  "rfc": "PEGJ900115",
  "curp": "PEGJ900115HCHRNS00",
  "marital_status": "Casado",
  "spouse_name": "María López",
  "spouse_phone": "6149876543",

  // Información Laboral
  "employment_status": "Empleado",
  "employer_name": "Empresa ABC S.A. de C.V.",
  "employer_phone": "6141112233",
  "job_title": "Ingeniero de Software",
  "employment_duration_years": "5",
  "monthly_income": 25000,
  "other_income": 5000,
  "other_income_source": "Freelance",

  // Información Financiera
  "monthly_expenses": 12000,
  "monthly_rent": 5000,
  "has_other_debts": true,
  "other_debts_amount": 3000,
  "credit_card_debt": 2000,
  "requested_amount": 300000,
  "requested_term": 48,
  "down_payment": 50000,

  // Referencias
  "reference_1_name": "Pedro Sánchez",
  "reference_1_phone": "6142223344",
  "reference_1_relationship": "Amigo",
  "reference_2_name": "Ana Martínez",
  "reference_2_phone": "6143334455",
  "reference_2_relationship": "Familiar",

  // Información del Vehículo (si aplica)
  "vehicle_interest": "Toyota Corolla 2020",
  "ordencompra": "12345"
}
```

## Correcciones Necesarias

### 1. Actualizar RPC `submit_application`
**Archivo:** Crear nueva migración

```sql
CREATE OR REPLACE FUNCTION public.submit_application(application_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_application_id uuid;
  user_id_from_data uuid;
  existing_app_id uuid;
BEGIN
  -- Extract user_id and id from the application data
  user_id_from_data := (application_data->>'user_id')::uuid;
  existing_app_id := (application_data->>'id')::uuid;

  -- If ID exists, update existing application
  IF existing_app_id IS NOT NULL THEN
    UPDATE public.financing_applications
    SET
      status = 'submitted',
      application_data = application_data - 'id' - 'user_id',
      car_info = application_data->'car_info',
      personal_info_snapshot = jsonb_build_object(
        'first_name', application_data->>'first_name',
        'last_name', application_data->>'last_name',
        'email', application_data->>'email',
        'phone', application_data->>'phone',
        'address', application_data->>'address'
      ),
      selected_banks = (application_data->'selected_banks')::text[],
      updated_at = now()
    WHERE id = existing_app_id
      AND user_id = user_id_from_data;

    RETURN existing_app_id;
  END IF;

  -- Otherwise, create new application (shouldn't happen in normal flow)
  INSERT INTO public.financing_applications (
    user_id,
    status,
    application_data,
    car_info,
    personal_info_snapshot,
    selected_banks
  )
  VALUES (
    user_id_from_data,
    'submitted',
    application_data - 'user_id',
    application_data->'car_info',
    jsonb_build_object(
      'first_name', application_data->>'first_name',
      'last_name', application_data->>'last_name',
      'email', application_data->>'email',
      'phone', application_data->>'phone',
      'address', application_data->>'address'
    ),
    (application_data->'selected_banks')::text[]
  )
  RETURNING id INTO new_application_id;

  -- Update the user's profile with application info
  UPDATE public.profiles
  SET
    first_name = application_data->>'first_name',
    last_name = application_data->>'last_name',
    phone = application_data->>'phone',
    address = application_data->>'address'
  WHERE id = user_id_from_data;

  RETURN new_application_id;
END;
$$;
```

### 2. Corregir BankService.downloadAllDocuments()
**Archivo:** `src/services/BankService.ts`

El método actual intenta leer columnas de documentos que no existen.
Debe consultar la tabla `uploaded_documents`:

```typescript
async downloadAllDocuments(leadId: string, applicationId: string | null): Promise<void> {
  try {
    if (!applicationId) {
      throw new Error('Application ID is required');
    }

    // Query uploaded_documents table, NOT financing_applications
    const { data: documents, error } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('application_id', applicationId)
      .eq('user_id', leadId);

    if (error) throw error;

    if (!documents || documents.length === 0) {
      throw new Error('No se encontraron documentos para esta solicitud');
    }

    // Download each document
    for (const doc of documents) {
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('application-documents')
        .createSignedUrl(doc.file_path, 3600);

      if (urlError || !signedUrl) {
        console.error(`Error creating signed URL for ${doc.file_name}:`, urlError);
        continue;
      }

      // Download the file
      const link = document.createElement('a');
      link.href = signedUrl.signedUrl;
      link.download = doc.file_name;
      link.click();
    }
  } catch (error) {
    console.error('Error downloading documents:', error);
    throw error;
  }
}
```

### 3. Corregir ApplicationService.checkApplicationDocuments()
**Archivo:** `src/services/ApplicationService.ts`

El método actual intenta leer columnas de documentos de `financing_applications`.
Debe consultar `uploaded_documents`:

```typescript
async checkApplicationDocuments(applicationId: string, applicationData: Record<string, any>): Promise<boolean> {
  try {
    const { data: documents, error } = await supabase
      .from('uploaded_documents')
      .select('document_type')
      .eq('application_id', applicationId);

    if (error) {
      console.error('Error checking documents:', error);
      return false;
    }

    // Check if required documents are uploaded
    const requiredTypes = ['ine_front', 'ine_back', 'proof_address', 'proof_income'];
    const uploadedTypes = documents?.map(d => d.document_type) || [];

    // Check if all required types are present (case-insensitive)
    const hasAllRequired = requiredTypes.every(required =>
      uploadedTypes.some(uploaded =>
        uploaded.toLowerCase().includes(required.toLowerCase())
      )
    );

    return hasAllRequired;
  } catch (error) {
    console.error('Error in checkApplicationDocuments:', error);
    return false;
  }
}
```

## Resumen de Correcciones

1. ✅ **Migraciones de banco:** Ya aplicadas (20251124000007)
   - `get_bank_rep_assigned_leads()` retorna `application_data` JSONB
   - `get_bank_rep_lead_details()` retorna `application_data` JSONB

2. ⏳ **RPC submit_application:** Pendiente
   - Actualizar para usar estructura actual de tabla

3. ⏳ **BankService.ts:** Pendiente
   - Corregir `downloadAllDocuments()` para consultar `uploaded_documents`

4. ⏳ **ApplicationService.ts:** Pendiente
   - Corregir `checkApplicationDocuments()` para consultar `uploaded_documents`

5. ⏳ **Deploy y Testing:** Pendiente
   - Desplegar todos los cambios
   - Verificar portal bancario funciona
   - Verificar formulario de aplicación funciona
