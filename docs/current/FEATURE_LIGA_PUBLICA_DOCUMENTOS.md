# Feature: Liga Pública de Documentos

## Descripción General

Esta feature implementa un sistema de dropzone público que permite a usuarios, agentes de ventas y cualquier persona con el enlace, cargar documentos de forma segura a una solicitud de financiamiento específica sin necesidad de autenticación.

## Características Principales

### 1. **Dropzone Público con Diseño TREFA**
- Página pública accesible mediante token único
- Diseño con animación de ondas pulsantes estilo "Connecting" o "In reception mode"
- QR code generado automáticamente para compartir fácilmente
- Interfaz intuitiva sin información sensible de la aplicación
- Validación de tipos de archivo (PDF, JPG, PNG)
- Límite de tamaño de 10MB por archivo

### 2. **Generación Automática de Tokens**
- Cada aplicación recibe un token único al ser creada
- Token seguro de 40 caracteres (UUID + hash)
- URLs del formato: `https://tu-dominio.com/documentos/{token}`

### 3. **Integración en el Sistema**
- Link público visible en PrintableApplication
- Link compacto en UserApplicationsPage
- Componente reutilizable `PublicUploadLinkCard` con dos modos (compacto/completo)
- Generación de QR code para compartir

### 4. **Seguridad**
- Token único por aplicación
- Validación de existencia de token antes de permitir uploads
- Almacenamiento seguro en Supabase Storage
- Solo los tipos de documento requeridos pueden ser subidos

## Archivos Modificados y Creados

### Migraciones
- `supabase/migrations/20251124000000_add_public_upload_token.sql`
  - Agrega columna `public_upload_token` a `financing_applications`
  - Función para generar tokens únicos
  - Trigger para asignar tokens automáticamente
  - Actualización de aplicaciones existentes

### Edge Functions
- `supabase/functions/public-document-upload/index.ts`
  - GET: Verifica token y retorna info de aplicación + documentos
  - POST: Sube documento y lo asocia a la aplicación
  - Validaciones de tipo y tamaño de archivo

### Componentes
- `src/components/PublicUploadLinkCard.tsx` (nuevo)
  - Muestra el link público
  - Botón de copiar al portapapeles
  - Generador y visualizador de QR code
  - Modo compacto para listas

- `src/components/PrintableApplication.tsx` (modificado)
  - Agrega sección de link público
  - Clase `no-print` para ocultar en impresión

### Páginas
- `src/pages/PublicDocumentUploadPage.tsx` (nuevo)
  - Página pública del dropzone
  - Animación de ondas pulsantes
  - Lista de documentos requeridos
  - Indicador de progreso
  - Mensajes de éxito/error

- `src/pages/UserApplicationsPage.tsx` (modificado)
  - Muestra link compacto en cada aplicación
  - Link completo en modal de detalles

- `src/pages/DashboardPage.tsx` (modificado)
  - Removido `DocumentUploadSection`
  - Documentos ahora se suben vía dropzone público

### Rutas
- `src/App.tsx` (modificado)
  - Ruta pública: `/documentos/:token`

### Dependencias
- `qrcode` y `@types/qrcode` agregados al package.json

## Pasos de Implementación

### 1. Aplicar Migración
```bash
cd ../ultima-liga-publica-documentos
supabase db push
```

### 2. Desplegar Edge Function
```bash
supabase functions deploy public-document-upload
```

### 3. Verificar Variables de Entorno
Asegúrate de que estén configuradas:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL` (en edge function)
- `SUPABASE_SERVICE_ROLE_KEY` (en edge function)

### 4. Configurar Bucket de Storage
Si no existe, crear bucket `financing-documents` en Supabase Storage con las políticas apropiadas.

### 5. Build y Deploy de Frontend
```bash
npm run build
# Deploy según tu pipeline (Vercel, Netlify, etc.)
```

## Uso

### Para Usuarios
1. Crear una solicitud de financiamiento
2. Ir a "Mis Aplicaciones"
3. Ver el link público generado automáticamente
4. Compartir link o código QR con quien deba subir documentos

### Para Agentes de Ventas
1. Abrir PrintableApplication de un cliente
2. Copiar link público o mostrar QR code
3. Compartir con el cliente vía WhatsApp, email, etc.

### Para Personas sin Cuenta
1. Recibir link del formato `/documentos/{token}`
2. Acceder sin login
3. Ver lista de documentos requeridos
4. Subir archivos de forma intuitiva
5. Ver confirmación de éxito

## Flujo de Datos

1. **Creación de Aplicación**
   - Trigger genera `public_upload_token` automáticamente
   - Token se guarda en `financing_applications`

2. **Acceso al Dropzone**
   - Usuario accede a `/documentos/{token}`
   - Edge function verifica token
   - Retorna info básica de aplicación

3. **Subida de Documento**
   - Usuario selecciona archivo
   - Validación cliente y servidor
   - Upload a Supabase Storage
   - Registro en `uploaded_documents`
   - Vinculación con `application_id`

4. **Visualización**
   - Admin/Sales ven documentos en CRM
   - Usuario ve en PrintableApplication
   - Status de documentos actualizado

## Documentos Requeridos

1. INE (Frente)
2. INE (Reverso)
3. Comprobante de Domicilio
4. Comprobante de Ingresos
5. Constancia de Situación Fiscal

## Mejoras Futuras Sugeridas

- [ ] Notificaciones por email cuando se sube un documento
- [ ] Expiración de tokens después de X días
- [ ] Permitir que admin/sales regeneren tokens
- [ ] Analíticas de uso de dropzones
- [ ] WhatsApp integration para compartir link
- [ ] Preview de documentos en el dropzone
- [ ] Drag & drop múltiple de archivos
- [ ] Compresión automática de imágenes grandes

## Problemas Conocidos

Ninguno por el momento. Esta es una implementación nueva.

## Testing

### Manual Testing Checklist
- [ ] Crear nueva aplicación verifica token generado
- [ ] Acceder a dropzone público con token válido
- [ ] Acceder con token inválido muestra error
- [ ] Subir documento PDF funciona
- [ ] Subir documento JPG funciona
- [ ] Subir documento PNG funciona
- [ ] Rechazar archivo muy grande (>10MB)
- [ ] Rechazar tipo de archivo no permitido
- [ ] Ver documentos subidos en PrintableApplication
- [ ] Ver link en UserApplicationsPage
- [ ] Copiar link al portapapeles
- [ ] Generar y mostrar QR code
- [ ] Verificar que aplicaciones antiguas reciben token

## Rollback

Si es necesario hacer rollback:

1. Revertir cambios en frontend
2. Opcional: Remover columna `public_upload_token` de la base de datos
   ```sql
   ALTER TABLE financing_applications DROP COLUMN public_upload_token;
   ```
3. Eliminar edge function
   ```bash
   supabase functions delete public-document-upload
   ```

## Soporte

Para dudas o problemas, contactar al equipo de desarrollo.
