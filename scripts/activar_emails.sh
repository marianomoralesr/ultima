#!/bin/bash

# Script para activar sistema de emails - Autos TREFA
# Ejecutar: chmod +x activar_emails.sh && ./activar_emails.sh

set -e

SUPABASE_URL="https://jjepfehmuybpctdzipnu.supabase.co"
SUPABASE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurado"
    echo ""
    echo "Ejecuta primero:"
    echo "export SUPABASE_SERVICE_ROLE_KEY='tu-service-role-key'"
    echo ""
    echo "Puedes encontrar tu service role key en:"
    echo "https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/api"
    exit 1
fi

echo "🚀 Activando sistema de emails de Autos TREFA..."
echo ""

# PARTE 1: Limpiar triggers antiguos
echo "📝 Parte 1/4: Limpiando triggers antiguos..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "DROP TRIGGER IF EXISTS on_application_status_change ON public.financing_applications CASCADE; DROP TRIGGER IF EXISTS trigger_application_status_change ON public.financing_applications CASCADE; DROP TRIGGER IF EXISTS trigger_application_submitted ON public.financing_applications CASCADE; DROP TRIGGER IF EXISTS trigger_document_status_change ON public.uploaded_documents CASCADE;"
  }' 2>/dev/null || echo "Triggers eliminados (o no existían)"

echo "✅ Parte 1 completa"
echo ""

# PARTE 2: Eliminar funciones antiguas
echo "📝 Parte 2/4: Eliminando funciones antiguas..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "DROP FUNCTION IF EXISTS handle_application_status_change() CASCADE; DROP FUNCTION IF EXISTS notify_application_status_change() CASCADE; DROP FUNCTION IF EXISTS notify_application_submitted() CASCADE; DROP FUNCTION IF EXISTS notify_document_status_change() CASCADE;"
  }' 2>/dev/null || echo "Funciones eliminadas (o no existían)"

echo "✅ Parte 2 completa"
echo ""

echo "⚠️  IMPORTANTE: Las partes 3 y 4 requieren ejecutarse en SQL Editor"
echo ""
echo "Por favor ve a:"
echo "https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new"
echo ""
echo "Y ejecuta el SQL que está en: docs/SQL_ACTIVACION_SIMPLE.sql"
echo "Específicamente las PARTE 3 y PARTE 4"
echo ""
echo "✅ Script completado - Continúa en SQL Editor del Dashboard"
