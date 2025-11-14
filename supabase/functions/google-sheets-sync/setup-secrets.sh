#!/bin/bash

# Script para configurar los secretos de Google Sheets en Supabase
# Este script te ayuda a configurar todos los secretos necesarios

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_REF="jjepfehmuybpctdzipnu"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔐 Configuración de Secretos - Google Sheets Sync${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}Este script te ayudará a configurar los secretos necesarios.${NC}"
echo -e "${YELLOW}Necesitarás:${NC}"
echo "  1. Archivo JSON de la cuenta de servicio de Google"
echo "  2. ID de tu Google Sheet"
echo "  3. Nombre de la pestaña (opcional)"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Error: Supabase CLI no está instalado${NC}"
    echo "Instálalo con: npm install -g supabase"
    exit 1
fi

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2

    echo -e "\n${YELLOW}Configurando ${secret_name}...${NC}"

    if echo "${secret_value}" | supabase secrets set "${secret_name}" --project-ref "${PROJECT_REF}"; then
        echo -e "${GREEN}✓ ${secret_name} configurado exitosamente${NC}"
        return 0
    else
        echo -e "${RED}❌ Error al configurar ${secret_name}${NC}"
        return 1
    fi
}

# Step 1: Google Sheets Credentials
echo -e "\n${BLUE}━━━ Paso 1: Credenciales de Google Sheets ━━━${NC}"
echo -e "${YELLOW}¿Ya tienes el archivo JSON de la cuenta de servicio?${NC}"
echo "  Si no lo tienes, sigue estas instrucciones:"
echo "  1. Ve a https://console.cloud.google.com/"
echo "  2. Crea o selecciona un proyecto"
echo "  3. Habilita Google Sheets API"
echo "  4. Crea una cuenta de servicio"
echo "  5. Descarga el archivo JSON"
echo ""

read -p "Ingresa la ruta al archivo JSON (o 'skip' para omitir): " JSON_PATH

if [ "$JSON_PATH" != "skip" ] && [ "$JSON_PATH" != "" ]; then
    if [ -f "$JSON_PATH" ]; then
        CREDENTIALS=$(cat "$JSON_PATH")

        # Validate JSON
        if echo "$CREDENTIALS" | jq empty 2>/dev/null; then
            set_secret "GOOGLE_SHEETS_CREDENTIALS" "$CREDENTIALS"

            # Extract and display client_email
            CLIENT_EMAIL=$(echo "$CREDENTIALS" | jq -r '.client_email')
            echo -e "\n${GREEN}📧 Email de la cuenta de servicio: ${CLIENT_EMAIL}${NC}"
            echo -e "${YELLOW}⚠️  IMPORTANTE: Comparte tu Google Sheet con este email (como Editor)${NC}"
        else
            echo -e "${RED}❌ El archivo JSON no es válido${NC}"
        fi
    else
        echo -e "${RED}❌ Archivo no encontrado: $JSON_PATH${NC}"
    fi
else
    echo -e "${YELLOW}⊘ Omitiendo configuración de credenciales${NC}"
fi

# Step 2: Google Sheet ID
echo -e "\n${BLUE}━━━ Paso 2: ID de Google Sheet ━━━${NC}"
echo -e "${YELLOW}El ID está en la URL de tu Google Sheet:${NC}"
echo "  https://docs.google.com/spreadsheets/d/{ESTE_ES_EL_ID}/edit"
echo ""

read -p "Ingresa el ID de tu Google Sheet (o 'skip' para omitir): " SHEET_ID

if [ "$SHEET_ID" != "skip" ] && [ "$SHEET_ID" != "" ]; then
    set_secret "GOOGLE_SHEET_ID" "$SHEET_ID"
else
    echo -e "${YELLOW}⊘ Omitiendo configuración de Sheet ID${NC}"
fi

# Step 3: Sheet Name (optional)
echo -e "\n${BLUE}━━━ Paso 3: Nombre de la Pestaña (Opcional) ━━━${NC}"
echo -e "${YELLOW}¿Cómo se llama la pestaña de tu hoja?${NC}"
echo "  Por defecto es 'Applications'"
echo "  Ejemplos: 'Solicitudes', 'Applications', 'Hoja 1'"
echo ""

read -p "Ingresa el nombre de la pestaña [Applications]: " SHEET_NAME
SHEET_NAME=${SHEET_NAME:-Applications}

if [ "$SHEET_NAME" != "" ]; then
    set_secret "GOOGLE_SHEET_NAME" "$SHEET_NAME"
fi

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Configuración de secretos completada${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}📋 Verificando secretos configurados...${NC}"
supabase secrets list --project-ref "${PROJECT_REF}" | grep -E "GOOGLE_SHEETS_CREDENTIALS|GOOGLE_SHEET_ID|GOOGLE_SHEET_NAME" || true

echo -e "\n${YELLOW}📝 Próximos pasos:${NC}"
echo "  1. Ejecuta el script de deployment:"
echo "     ./supabase/functions/google-sheets-sync/deploy.sh"
echo ""
echo "  2. Prueba la función:"
echo "     ./supabase/functions/google-sheets-sync/test.sh"
echo ""
echo "  3. Revisa los logs:"
echo "     supabase functions logs google-sheets-sync --project-ref ${PROJECT_REF}"

echo -e "\n${GREEN}¡Listo! 🎉${NC}"
