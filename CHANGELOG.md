# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2025-11-23]

### Corregido
- **Sistema de seguimiento de conversiones**
  - Corregido duplicación de eventos "ComienzaSolicitud" al revisitar borradores de solicitud
  - Ahora solo rastrea el evento una vez cuando se crea el borrador inicial
  - Previene el conteo de visitas regulares como nuevos inicios de solicitud
  - Mejora en la precisión de métricas de conversión
- **Error de InteractiveStepper**
  - Corregido error "stepStates[i] is undefined" consolidando instancias del stepper
  - Mejorada estabilidad del componente de onboarding
- **Visibilidad en dispositivos móviles**
  - Corregido problema de barra de búsqueda del header no visible en móviles
  - Simplificada estructura de layout del header con espaciado adecuado
  - Asegurado que la barra de búsqueda sea del tamaño apropiado con margenes correctos
  - Corregida visibilidad de secciones "Vistos Recientemente" y "También te puede interesar" en móviles
  - Actualizado overflow-y de hidden a visible en carruseles de vehículos
  - Mejorado estilo con tokens de diseño shadcn consistentes

### Agregado
- **Sistema de estados de solicitud estandarizado con indicadores visuales**
  - Propiedades dotColor y textColor añadidas a STATUS_CONFIG para puntos pulsantes
  - Estado "En Revisión" ahora usa color púrpura (antes azul) para diferenciación
  - Reemplazado dropdown de estado con punto pulsante y texto colorido en páginas CRM
  - Agentes de ventas ya no pueden cambiar estados manualmente (solo lectura)
  - Esquema de colores: Gris (Borrador), Ámbar (Faltan Docs), Verde (Completa/Aprobada), Púrpura (En Revisión), Rojo (Rechazada)
- **Selector de vehículos mejorado**
  - Nuevo método getAllAvailableVehiclesForSelection() en VehicleService
  - Muestra TODOS los vehículos con OrdenStatus=Comprado y separado=false
  - Ya no limitado a 21 vehículos por página
  - Lista más compacta con espaciado reducido, imágenes más pequeñas y texto optimizado
- **Visualización de borradores en dashboard móvil**
  - Borradores de solicitud movidos a la parte superior en móvil (después de Mi Asesor)
  - Usa componente ApplicationCard para consistencia con página de Solicitudes
  - Muestra estados correctos que coinciden con la página de solicitudes

### Mejorado
- **OnboardingStepper rediseñado**
  - Diseño personalizado con círculos de iconos y barra de progreso
  - Barra de progreso abarca todo el ancho debajo de los pasos
  - Estados codificados por color: verde (completado), primario (activo), atenuado (inactivo)
  - Animaciones suaves (scale-110 en activo, transiciones de 700ms)
  - Barra de progreso con gradiente y porcentajes apropiados
  - Descripciones limpias sin paréntesis para mejor UI
- **Foto de perfil del asesor asignado**
  - Corregido para obtener foto de perfil real usando campo picture_url
  - Recae a placeholder solo cuando está vacío
- **Calculadora de proyección financiera**
  - Actualizado enganche mínimo de 15% a 25%
  - Actualizada etiqueta y lógica de validación
- **Detección automática de estado de solicitud**
  - updateApplication() ahora detecta automáticamente el estado basado en documentos
  - "Completa" cuando se adjuntan documentos
  - "Faltan Documentos" cuando no hay documentos adjuntos
  - Solo auto-detecta cuando el estado actual es borrador o no se proporciona explícitamente
  - Preserva cambios manuales de estado (En Revisión, Aprobada, Rechazada)
- **Función getStatusColor() centralizada**
  - Ahora usa STATUS_CONFIG centralizado desde constants
  - Retorna todas las propiedades necesarias: bg, text, border, dot, label, dotColor, textColor
  - Asegura consistencia en todas las páginas CRM

### Revertido
- **Sección hero de página /financiamientos**
  - Restaurado hero original con gradiente animado
  - Mensaje "Estrena un auto seminuevo en menos de 24h" restaurado
  - Revertido commit c122362 mientras se mantienen otros cambios

## [Anteriores]

### Corregido
- **Email notification system updated with new status mappings**
  - Updated `send-brevo-email` Edge Function to support new centralized status names
  - Updated `automated-email-notifications` Edge Function to use new status values
  - New status mappings: Completa, Faltan Documentos, En Revisión, Aprobada, Rechazada
  - Legacy status mappings maintained for backwards compatibility
  - Application submission email subject: 'Autos TREFA | Solicitud Recibida con Éxito'
  - Status change email subject: 'Notificaciones TREFA | Cambio el status de tu solicitud'
  - Fixed 24-hour reminder emails to check for 'Borrador' status instead of 'draft'
  - Fixed confirmation emails to check for 'Completa' and 'Faltan Documentos' statuses

### Agregado
- **Botón "Ver autos similares disponibles" para vehículos separados**
  - Nuevo botón que aparece automáticamente en tarjetas de vehículos separados
  - Botón de "Financiar" deshabilitado visualmente para vehículos separados
  - Navegación dinámica a página de resultados con filtros inteligentes:
    - Misma marca del vehículo
    - Misma carrocería
    - Rango de precio ±20% del vehículo original
  - Mejora en la experiencia de usuario al buscar alternativas disponibles

### Mejorado
- **Tarjetas de vehículos en vista de lista**
  - Navegación de galería de imágenes simplificada con flechas transparentes
  - Indicadores de navegación (dots) con dot activo elongado para mejor visibilidad
  - Imagen del vehículo ahora ocupa ~3/7 del ancho de la tarjeta para mayor protagonismo
  - Altura de tarjeta aumentada (h-64/md:h-80) para mejor visualización
  - Bordes animados más pronunciados para vehículos rezago y populares
  - Border radius incrementado a 18px para esquinas más suaves
- **Indicadores visuales para vehículos separados**
  - Badge "SEPARADO" con icono de candado en esquina superior derecha
  - Borde gris sutil (border-gray-400) en lugar de rojo
  - Fondo gris claro (bg-gray-50) para diferenciación visual
  - Bordes 2px más gruesos para mejor visibilidad
- **Sistema de estados de solicitudes centralizado**
  - Constantes centralizadas en `applicationStatus.ts`
  - Estados estandarizados: borrador, completa, faltan documentos, en revisión, aprobada, rechazada
  - Actualización en tiempo real desde la base de datos
  - Homogeneidad de estados en toda la aplicación
  - Compatibilidad con estados legacy para retrocompatibilidad

### Corregido
- **Z-index de bordes en tarjetas de vehículos**
  - Eliminadas esquinas afiladas que aparecían sobre otros elementos
  - Jerarquía de capas correcta: badges (z-30), toast (z-40), link (z-20)
  - Overflow oculto en contenedor principal para bordes limpios
- **Página de seguimiento (SeguimientoPage)**
  - Ahora muestra correctamente el estado "Faltan Documentos" después de enviar solicitud sin documentos
  - Lectura en tiempo real del estado desde la base de datos
- **Asignación automática de estados de solicitudes**
  - Estado "Completa" cuando se incluyen todos los documentos requeridos
  - Estado "Faltan Documentos" cuando se envía solicitud sin documentos
  - Verificación dinámica de documentos (INE, comprobante de domicilio, comprobante de ingresos)

### Técnico
- Refactorización de VehicleCardActions para soportar filtrado dinámico
- Nuevos props en VehicleCard: marca, carroceria, precio
- Layout de botones actualizado de flex-row a flex-col para apilamiento vertical
- Función `handleSimilarVehiclesClick` para generación dinámica de URLs
- Método `checkApplicationDocuments` en ApplicationService
- Importación de constantes centralizadas en 6 archivos clave
- Actualización de helpers CRM para usar nuevos estados

## [1.1.0] - 2025-11-08

### Fixed
- **Critical**: Redirect bug causing all authenticated users to be redirected to `/escritorio/dashboard` on every page load
  - Fixed AuthHandler.tsx to only redirect when `loginRedirect` exists in localStorage
  - Separated OAuth tracking logic from redirect logic for better clarity
- Video player on Financiamientos landing page not visible
  - Refactored to use same iframe embed code as homepage
  - Replaced `youtube-nocookie.com` with standard `youtube.com/embed`
  - Removed custom play button overlay and state management
- Email notification logs API key error
  - Added session verification before querying `email_notification_logs`
  - Improved error handling for RLS policy issues
  - Added specific error code detection (42P01, apikey errors)
- Hero heading typography on Financiamientos page
  - Reduced letter-spacing from -0.025em to -0.05em for tighter spacing
  - Added WebkitTextStroke for enhanced boldness appearance
  - Added xl:whitespace-nowrap to prevent unwanted line breaks
  - Optimized to fit in 2 lines instead of 3 on desktop

### Added
- **Cloudflare Google Tag Gateway support** for improved tracking
  - Added `gtm_server_container_url` field to MarketingConfig interface
  - Added `use_cloudflare_tag_gateway` flag
  - Automatic Tag Gateway detection with console logging
  - Server container URL support via dataLayer
  - Expected 11% average uplift in data signals (per Cloudflare)
  - First-party tracking that bypasses ad blockers
  - Comprehensive setup guide: `CLOUDFLARE_TAG_GATEWAY_SETUP.md`
- Marketing Configuration enhancements
  - Event URLs with clickable links for each event type
  - Data Layer Variable (DLV) parameters for GTM integration
  - Example: `formType = {{DLV - Form Type}}`, `source = {{DLV - Lead Source}}`
- Financiamientos page visual enhancements
  - Animated gradient border around video player (matching card design)
  - Extended margins for larger video display
- Enhanced error logging and diagnostics
  - Detailed logging for Cloudflare Tag Gateway detection
  - Better RLS/apikey error messages in email service

### Changed
- Marketing Config event label from "Tipo:" to "Evento:" for clarity
- Financiamientos video/form layout
  - Video: 60% width allocation (3/5ths) for better prominence
  - Form: 40% width allocation (2/5ths), more compact
  - Grid changed from `lg:grid-cols-2` to `lg:grid-cols-[3fr_2fr]`
  - Reduced gaps from `gap-8 lg:gap-12` to `gap-6 lg:gap-8 xl:gap-10`
- Event parameters format in Marketing Config
  - Converted from generic Facebook Pixel parameters to Data Layer Variable (DLV) format
  - All events now use GTM-compatible DLV syntax: `{{DLV - Variable Name}}`
- Code cleanup
  - Removed unused `Play` icon import from FinanciamientosPage
  - Removed unused `videoPlaying` state and `handleVideoPlay` function
  - Cleaner iframe implementation for video player

### Technical
- Updated `initializeGTM()` method signature to support server container URLs
- Added `detectCloudflareTagGateway()` private method for automatic detection
- Enhanced CSP headers compatibility (already configured with `"https:"` allowlist)
- Session verification added to email logs queries for better security

### Documentation
- Created `CLOUDFLARE_TAG_GATEWAY_SETUP.md` with:
  - Step-by-step Cloudflare dashboard setup instructions
  - Google Tag Manager configuration guide
  - Testing and verification procedures
  - Troubleshooting guide
  - API access examples for automation
  - Performance monitoring recommendations

## [1.0.0] - 2024-10-21

### Added
- Initial release
- Base marketing tracking system with GTM and Facebook Pixel
- User authentication and profile management
- Vehicle inventory management
- Application submission workflow
- Admin dashboard
- Sales dashboard
- Analytics and reporting

---

**Note**: For detailed commit history, see `git log` or GitHub releases.
