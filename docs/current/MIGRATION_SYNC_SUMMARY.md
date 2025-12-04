# Resumen de Sincronización de Esquema Supabase

## Estado Final

**Fecha**: 2025-11-27  
**Proyecto**: jjepfehmuybpctdzipnu (https://jjepfehmuybpctdzipnu.supabase.co)

## Migraciones Pendientes de Aplicar

Se identificaron 2 migraciones nuevas que requieren aplicación manual:

### 1. `20251127000000_create_facebook_catalogue_events.sql`
**Propósito**: Sistema de tracking de eventos de Facebook Pixel para el catálogo de vehículos

**Componentes**:
- Tabla `facebook_catalogue_events` con campos:
  - `event_type`: ViewContent, Search, AddToCart, InitiateCheckout, Lead, Purchase
  - `vehicle_id`, `vehicle_data`: Información del vehículo
  - `user_id`, `session_id`: Tracking de usuarios
  - `fbclid`: Facebook Click ID para atribución
  - Timestamps y metadata

- **8 índices** para optimizar consultas
- **3 políticas RLS**:
  - Cualquiera puede insertar eventos (tracking público)
  - Solo admins pueden leer eventos
  - Solo admins pueden eliminar eventos

- **2 funciones de análisis**:
  - `get_catalogue_metrics()`: Métricas agregadas de conversión
  - `get_top_performing_vehicles()`: Top vehículos por performance

- **1 vista**: `catalogue_funnel_by_vehicle` - Embudo de conversión por vehículo

### 2. `20251127200000_email_system_overhaul.sql`
**Propósito**: Modernizar el sistema de notificaciones por email

**Cambios**:
- Elimina triggers y funciones legacy:
  - `on_application_status_change`
  - `trigger_application_status_change`
  - `trigger_application_submitted`
  - `trigger_document_status_change`
  - Funciones asociadas

- Crea nuevo sistema moderno:
  - Función `handle_status_change_email()` con:
    - Status notificables: Faltan Documentos, Completa, En Revisión, Aprobada, Rechazada
    - Prevención de duplicados (1 hora)
    - Llamada a edge function `brevo-status-change-emails`
    - Manejo de errores sin fallar transacciones

  - Trigger `on_financing_application_status_change` en tabla `financing_applications`

## Problema Identificado

El historial de migraciones (`supabase_migrations.schema_migrations`) no está sincronizado con las migraciones locales:
- ~115 migraciones locales
- Muchas ya aplicadas en la BD remota pero no registradas en el historial
- Esto causa que `db push` intente reaplicar migraciones existentes, resultando en timeouts

## Solución Aplicada

Se creó el archivo `apply_migrations_manual.sql` con el SQL completo de ambas migraciones, listo para ejecutar manualmente en el dashboard de Supabase.

## Instrucciones para Completar la Sincronización

### Opción 1: Aplicación Manual (RECOMENDADA - 2 minutos)

1. Abre el SQL Editor: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

2. Copia todo el contenido de `apply_migrations_manual.sql`

3. Pega en el editor y ejecuta (botón "Run" o Cmd+Enter)

4. Verifica la creación exitosa:
   ```sql
   -- Verificar tabla
   SELECT COUNT(*) FROM facebook_catalogue_events;
   
   -- Verificar trigger
   SELECT tgname FROM pg_trigger WHERE tgname = 'on_financing_application_status_change';
   
   -- Verificar funciones
   SELECT proname FROM pg_proc WHERE proname IN ('get_catalogue_metrics', 'get_top_performing_vehicles', 'handle_status_change_email');
   ```

### Opción 2: Reparar Historial Completo (si quieres evitar problemas futuros)

Si prefieres que el historial local y remoto estén 100% sincronizados, necesitarás reparar ~100 migraciones una por una. Este proceso puede tomar 15-30 minutos.

## Archivos Generados

- `apply_migrations_manual.sql` - SQL listo para ejecutar en dashboard
- `MIGRATION_SYNC_SUMMARY.md` - Este documento de resumen
- `supabase/migrations/.temp_old/` - Backup temporal de migraciones (puedes eliminar)
- `supabase/migrations/.backup/` - Backup de remote_schema.sql (puedes eliminar)

## Próximos Pasos Recomendados

1. ✅ Aplicar las 2 migraciones manualmente (Opción 1 arriba)
2. Verificar que funcionan correctamente
3. Opcionalmente: Limpiar directorios de backup temporal
4. Opcionalmente: Reparar historial completo si planeas hacer muchos más cambios de schema

## Notas Adicionales

- Las migraciones usan `IF NOT EXISTS` / `DROP IF EXISTS` para ser idempotentes
- El sistema de emails ahora previene duplicados automáticamente
- Los eventos de Facebook se pueden insertar de forma anónima (para tracking público)
- Solo los admins pueden ver y analizar los datos de eventos
