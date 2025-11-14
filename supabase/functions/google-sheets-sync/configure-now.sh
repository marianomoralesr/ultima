#!/bin/bash

# Script de Configuración Automática
# Lee las credenciales desde google-credentials.json

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

PROJECT_REF="jjepfehmuybpctdzipnu"
CREDENTIALS_FILE="google-credentials.json"
SHEET_ID="1aLWGZe-DiupfHFTk36D7Rxh83dyPMH5waj5Bmk9WD48"
SHEET_NAME="Applications"

echo -e "${MAGENTA}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║   🚀 CONFIGURACIÓN AUTOMÁTICA - GOOGLE SHEETS SYNC 🚀     ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI no está instalado${NC}"
    echo ""
    echo -e "${YELLOW}Por favor instala Supabase CLI primero:${NC}"
    echo "  npm install -g supabase"
    echo ""
    echo "O con Homebrew (macOS):"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

# Check if credentials file exists
if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo -e "${RED}❌ Archivo de credenciales no encontrado${NC}"
    echo ""
    echo -e "${YELLOW}Crea el archivo '${CREDENTIALS_FILE}' con tus credenciales de Google${NC}"
    echo ""
    echo "Puedes usar el archivo que te proporcioné por email/chat."
    echo "Solo guárdalo como: ${CREDENTIALS_FILE}"
    echo ""
    echo "O crea uno nuevo desde Google Cloud Console:"
    echo "  1. Ve a https://console.cloud.google.com/"
    echo "  2. APIs & Services > Credentials"
    echo "  3. Create Service Account > Download JSON"
    echo "  4. Guarda el archivo como: ${CREDENTIALS_FILE}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Archivo de credenciales encontrado${NC}"
echo -e "${GREEN}✓ Proyecto configurado: ${PROJECT_REF}${NC}"
echo -e "${GREEN}✓ Google Sheet ID: ${SHEET_ID}${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Configurando Secretos en Supabase${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Validate JSON
echo -e "${YELLOW}📝 Validando credenciales...${NC}"
if ! jq empty "$CREDENTIALS_FILE" 2>/dev/null; then
    echo -e "${RED}❌ El archivo JSON no es válido${NC}"
    echo "Verifica que el archivo esté bien formateado"
    exit 1
fi
echo -e "${GREEN}✓ JSON válido${NC}"

# Extract client_email for display
CLIENT_EMAIL=$(jq -r '.client_email' "$CREDENTIALS_FILE")
echo -e "${GREEN}✓ Cuenta de servicio: ${CLIENT_EMAIL}${NC}"
echo ""

# Google Sheets Credentials
echo -e "${YELLOW}📝 Configurando GOOGLE_SHEETS_CREDENTIALS...${NC}"

CREDENTIALS=$(cat "$CREDENTIALS_FILE")

# Use printf to properly format the secret for supabase CLI
if printf "GOOGLE_SHEETS_CREDENTIALS=%s" "$CREDENTIALS" | supabase secrets set --project-ref "${PROJECT_REF}"; then
    echo -e "${GREEN}✓ GOOGLE_SHEETS_CREDENTIALS configurado${NC}"
else
    echo -e "${RED}❌ Error al configurar GOOGLE_SHEETS_CREDENTIALS${NC}"
    exit 1
fi

# Google Sheet ID
echo ""
echo -e "${YELLOW}📝 Configurando GOOGLE_SHEET_ID...${NC}"

if printf "GOOGLE_SHEET_ID=%s" "$SHEET_ID" | supabase secrets set --project-ref "${PROJECT_REF}"; then
    echo -e "${GREEN}✓ GOOGLE_SHEET_ID configurado${NC}"
else
    echo -e "${RED}❌ Error al configurar GOOGLE_SHEET_ID${NC}"
    exit 1
fi

# Sheet Name
echo ""
echo -e "${YELLOW}📝 Configurando GOOGLE_SHEET_NAME...${NC}"

if printf "GOOGLE_SHEET_NAME=%s" "$SHEET_NAME" | supabase secrets set --project-ref "${PROJECT_REF}"; then
    echo -e "${GREEN}✓ GOOGLE_SHEET_NAME configurado${NC}"
else
    echo -e "${RED}❌ Error al configurar GOOGLE_SHEET_NAME${NC}"
    exit 1
fi

# Verify secrets
echo ""
echo -e "${YELLOW}📋 Verificando secretos configurados...${NC}"
supabase secrets list --project-ref "${PROJECT_REF}" | grep -E "GOOGLE_SHEETS_CREDENTIALS|GOOGLE_SHEET_ID|GOOGLE_SHEET_NAME"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Secretos configurados exitosamente${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo -e "${YELLOW}📧 Email de la cuenta de servicio:${NC}"
echo "  ${CLIENT_EMAIL}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "  Asegúrate de que tu Google Sheet esté compartido con este email"
echo "  Permisos necesarios: Editor"
echo ""
echo -e "${YELLOW}🔗 Google Sheet:${NC}"
echo "  https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Próximos pasos:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. Desplegar la función:"
echo "   ./deploy.sh"
echo ""
echo "2. Probar la integración:"
echo "   ./test.sh"
echo ""
echo "3. Ver los logs en tiempo real:"
echo "   supabase functions logs google-sheets-sync --project-ref ${PROJECT_REF} --follow"
echo ""

echo -e "${GREEN}¡Listo! 🎉${NC}"
