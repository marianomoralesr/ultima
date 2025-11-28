#!/bin/bash

# ============================================================================
# Script RÁPIDO para Activar Sistema de Emails - Autos TREFA
# Ejecuta operaciones una por una para evitar timeouts
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DB_HOST="db.jjepfehmuybpctdzipnu.supabase.co"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres"

if [ -z "$PGPASSWORD" ]; then
    echo -e "${RED}❌ PGPASSWORD no está configurado${NC}"
    echo ""
    echo "Ejecuta primero:"
    echo "export PGPASSWORD='tu-password-de-postgres'"
    exit 1
fi

echo "🚀 Activando Sistema de Emails (versión rápida)..."
echo ""

# Función para ejecutar SQL individual
run_sql() {
    local sql="$1"
    local description="$2"

    echo -e "${YELLOW}▶ $description${NC}"
    echo "$sql" | psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -q 2>&1 | grep -v "does not exist" || true
    echo -e "${GREEN}✓${NC}"
}

# PASO 1: Eliminar triggers uno por uno (rápido)
echo ""
echo "📝 Paso 1: Eliminando triggers antiguos..."
run_sql "DROP TRIGGER IF EXISTS on_application_status_change ON public.financing_applications;" "Trigger 1"
run_sql "DROP TRIGGER IF EXISTS trigger_application_status_change ON public.financing_applications;" "Trigger 2"
run_sql "DROP TRIGGER IF EXISTS trigger_application_submitted ON public.financing_applications;" "Trigger 3"
run_sql "DROP TRIGGER IF EXISTS trigger_document_status_change ON public.uploaded_documents;" "Trigger 4"

# PASO 2: Eliminar funciones una por una (rápido)
echo ""
echo "📝 Paso 2: Eliminando funciones antiguas..."
run_sql "DROP FUNCTION IF EXISTS handle_application_status_change() CASCADE;" "Función 1"
run_sql "DROP FUNCTION IF EXISTS notify_application_status_change() CASCADE;" "Función 2"
run_sql "DROP FUNCTION IF EXISTS notify_application_submitted() CASCADE;" "Función 3"
run_sql "DROP FUNCTION IF EXISTS notify_document_status_change() CASCADE;" "Función 4"

# PASO 3: Crear nueva función (rápido)
echo ""
echo "📝 Paso 3: Creando nueva función de emails..."
cat > /tmp/create_function.sql << 'EOSQL'
CREATE OR REPLACE FUNCTION handle_status_change_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url text := 'https://jjepfehmuybpctdzipnu.supabase.co';
  v_notifiable_statuses text[] := ARRAY['Faltan Documentos', 'Completa', 'En Revisión', 'Aprobada', 'Rechazada'];
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = ANY(v_notifiable_statuses) THEN
      BEGIN
        PERFORM net.http_post(
          url := v_supabase_url || '/functions/v1/brevo-status-change-emails',
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := jsonb_build_object('record', to_jsonb(NEW), 'old_record', to_jsonb(OLD))
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error enviando email: %', SQLERRM;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
EOSQL

psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f /tmp/create_function.sql -q
echo -e "${GREEN}✓ Función creada${NC}"

# PASO 4: Crear trigger (rápido)
echo ""
echo "📝 Paso 4: Creando trigger..."
run_sql "CREATE TRIGGER on_financing_application_status_change AFTER UPDATE ON public.financing_applications FOR EACH ROW EXECUTE FUNCTION handle_status_change_email();" "Trigger nuevo"

# PASO 5: Verificar
echo ""
echo "📝 Paso 5: Verificando instalación..."
echo ""

psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'on_financing_application_status_change';
"

echo ""
echo -e "${GREEN}✅ ¡SISTEMA ACTIVADO EXITOSAMENTE!${NC}"
echo ""
echo "📧 Los emails se enviarán automáticamente cuando cambies el status a:"
echo "   • Faltan Documentos"
echo "   • Completa"
echo "   • En Revisión"
echo "   • Aprobada"
echo "   • Rechazada"
echo ""
echo "🧪 PRUEBA AHORA:"
echo "   1. Ve a tu admin dashboard"
echo "   2. Cambia el status de una aplicación"
echo "   3. Revisa el email del usuario"
echo ""

# Limpiar
rm -f /tmp/create_function.sql
