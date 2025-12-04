#!/bin/bash

# ============================================================================
# Script Automático para Activar Sistema de Emails - Autos TREFA
# ============================================================================

set -e

echo "🚀 Activando Sistema de Emails de Autos TREFA..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
DB_HOST="db.jjepfehmuybpctdzipnu.supabase.co"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres"

# Verificar si PGPASSWORD está configurado
if [ -z "$PGPASSWORD" ]; then
    echo -e "${YELLOW}⚠️  PGPASSWORD no está configurado${NC}"
    echo ""
    echo "Por favor ejecuta primero:"
    echo "export PGPASSWORD='tu-password-de-postgres'"
    echo ""
    echo "Puedes encontrar o resetear tu password aquí:"
    echo "https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/database"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Password configurado${NC}"
echo ""

# Crear SQL temporal
SQL_FILE="/tmp/activate_emails_$(date +%s).sql"

cat > "$SQL_FILE" << 'EOSQL'
-- ============================================================================
-- ACTIVAR SISTEMA DE EMAILS - AUTOS TREFA
-- ============================================================================

-- Limpiar triggers antiguos
DROP TRIGGER IF EXISTS on_application_status_change ON public.financing_applications CASCADE;
DROP TRIGGER IF EXISTS trigger_application_status_change ON public.financing_applications CASCADE;
DROP TRIGGER IF EXISTS trigger_application_submitted ON public.financing_applications CASCADE;
DROP TRIGGER IF EXISTS trigger_document_status_change ON public.uploaded_documents CASCADE;

-- Limpiar funciones antiguas
DROP FUNCTION IF EXISTS handle_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS notify_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS notify_application_submitted() CASCADE;
DROP FUNCTION IF EXISTS notify_document_status_change() CASCADE;

-- Crear función moderna
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

-- Crear trigger
CREATE TRIGGER on_financing_application_status_change
  AFTER UPDATE ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_status_change_email();

-- Verificar que se creó
\echo ''
\echo '✅ Verificando que el trigger se creó correctamente:'
\echo ''
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'on_financing_application_status_change';
EOSQL

echo -e "${YELLOW}📝 Aplicando migraciones...${NC}"
echo ""

# Ejecutar SQL
if psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$SQL_FILE"; then
    echo ""
    echo -e "${GREEN}✅ ¡Sistema de Emails Activado Exitosamente!${NC}"
    echo ""
    echo "📧 Ahora los emails se enviarán automáticamente cuando cambies el status a:"
    echo "   • Faltan Documentos"
    echo "   • Completa"
    echo "   • En Revisión"
    echo "   • Aprobada"
    echo "   • Rechazada"
    echo ""
    echo "🧪 PRUEBA:"
    echo "   1. Ve a tu admin dashboard"
    echo "   2. Cambia el status de una aplicación"
    echo "   3. Revisa el email del usuario en 1-2 minutos"
    echo ""
    echo "📊 Para ver logs de emails enviados:"
    echo "   https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/functions/brevo-status-change-emails/logs"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error aplicando migraciones${NC}"
    echo ""
    echo "Posibles soluciones:"
    echo "1. Verifica que PGPASSWORD esté correcto"
    echo "2. Verifica que pg_net esté habilitado:"
    echo "   https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/database/extensions"
    echo ""
    exit 1
fi

# Limpiar archivo temporal
rm -f "$SQL_FILE"
