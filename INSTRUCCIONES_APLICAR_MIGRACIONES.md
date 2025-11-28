# 📋 INSTRUCCIONES PARA APLICAR LAS MIGRACIONES

## Paso 1: Abrir el SQL Editor de Supabase

Abre este link en tu navegador:
https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

## Paso 2: Copiar el SQL

Copia TODO el contenido del archivo `apply_migrations_manual.sql` que se mostró arriba.

## Paso 3: Pegar y Ejecutar

1. Pega el SQL completo en el editor
2. Haz clic en el botón **"Run"** (o presiona Cmd+Enter / Ctrl+Enter)
3. Espera a que termine la ejecución (~10-15 segundos)

## Paso 4: Verificar que se Aplicaron Correctamente

Ejecuta este SQL para verificar:

```sql
-- Verificar tabla de eventos
SELECT COUNT(*) as tabla_existe FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'facebook_catalogue_events';

-- Verificar trigger de emails
SELECT tgname FROM pg_trigger 
WHERE tgname = 'on_financing_application_status_change';

-- Verificar funciones
SELECT proname FROM pg_proc 
WHERE proname IN ('get_catalogue_metrics', 'get_top_performing_vehicles', 'handle_status_change_email');

-- Verificar migraciones registradas
SELECT version, name FROM supabase_migrations.schema_migrations 
WHERE version IN ('20251127000000', '20251127200000')
ORDER BY version;
```

## Resultado Esperado

Deberías ver:
- ✅ tabla_existe = 1
- ✅ 1 trigger: on_financing_application_status_change
- ✅ 3 funciones: get_catalogue_metrics, get_top_performing_vehicles, handle_status_change_email  
- ✅ 2 migraciones registradas

## Si Algo Sale Mal

- El SQL usa `IF NOT EXISTS` y `DROP IF EXISTS`, así que es seguro ejecutarlo múltiples veces
- Si hay algún error, copia el mensaje de error completo y avísame

