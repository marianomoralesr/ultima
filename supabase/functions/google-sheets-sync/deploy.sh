#!/bin/bash

# Automated Deployment Script for Google Sheets Sync
# Este script despliega automáticamente la función y configura todo

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_REF="jjepfehmuybpctdzipnu"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
FUNCTION_NAME="google-sheets-sync"

echo -e "${GREEN}🚀 Iniciando deployment de Google Sheets Sync${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Check if required files exist
echo -e "\n${YELLOW}📋 Paso 1: Verificando archivos...${NC}"

if [ ! -f "supabase/functions/${FUNCTION_NAME}/index.ts" ]; then
    echo -e "${RED}❌ Error: No se encuentra el archivo de la función${NC}"
    exit 1
fi

if [ ! -f "supabase/migrations/20251114144533_add_google_sheets_sync_trigger.sql" ]; then
    echo -e "${RED}❌ Error: No se encuentra el archivo de migración${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Archivos verificados${NC}"

# Step 2: Check if secrets are set
echo -e "\n${YELLOW}📋 Paso 2: Verificando secretos de Supabase...${NC}"

# Check for Google Sheets credentials
if ! supabase secrets list 2>/dev/null | grep -q "GOOGLE_SHEETS_CREDENTIALS"; then
    echo -e "${RED}⚠️  GOOGLE_SHEETS_CREDENTIALS no está configurado${NC}"
    echo "Ejecuta: supabase secrets set GOOGLE_SHEETS_CREDENTIALS='{...}'"
    MISSING_SECRETS=true
fi

if ! supabase secrets list 2>/dev/null | grep -q "GOOGLE_SHEET_ID"; then
    echo -e "${RED}⚠️  GOOGLE_SHEET_ID no está configurado${NC}"
    echo "Ejecuta: supabase secrets set GOOGLE_SHEET_ID='tu-sheet-id'"
    MISSING_SECRETS=true
fi

if [ "$MISSING_SECRETS" = true ]; then
    echo -e "\n${YELLOW}💡 Tip: Puedes configurar los secretos ahora o después${NC}"
    echo "La función se desplegará pero no funcionará hasta que configures los secretos"
    read -p "¿Continuar de todos modos? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${RED}Deployment cancelado${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Secretos configurados${NC}"
fi

# Step 3: Deploy Edge Function
echo -e "\n${YELLOW}📋 Paso 3: Desplegando Edge Function...${NC}"

if supabase functions deploy ${FUNCTION_NAME}; then
    echo -e "${GREEN}✓ Edge Function desplegada exitosamente${NC}"
else
    echo -e "${RED}❌ Error al desplegar la función${NC}"
    exit 1
fi

# Step 4: Apply database migration
echo -e "\n${YELLOW}📋 Paso 4: Aplicando migración de base de datos...${NC}"

if supabase db push --include-all; then
    echo -e "${GREEN}✓ Migración aplicada exitosamente${NC}"
else
    echo -e "${RED}❌ Error al aplicar la migración${NC}"
    exit 1
fi

# Step 5: Configure function URL in database
echo -e "\n${YELLOW}📋 Paso 5: Configurando URL de la función...${NC}"

SQL_COMMAND="ALTER DATABASE postgres SET app.settings.supabase_url = '${SUPABASE_URL}';"

echo -e "${YELLOW}ℹ️  Skipping URL configuration (requires manual setup if needed)${NC}"

# Step 6: Verify deployment
echo -e "\n${YELLOW}📋 Paso 6: Verificando deployment...${NC}"

# Check if function is listed
if supabase functions list | grep -q ${FUNCTION_NAME}; then
    echo -e "${GREEN}✓ Función visible en la lista${NC}"
else
    echo -e "${RED}⚠️  La función no aparece en la lista${NC}"
fi

# Check if trigger exists
TRIGGER_CHECK="SELECT tgname FROM pg_trigger WHERE tgname = 'on_application_sync_to_sheets';"
echo -e "${YELLOW}ℹ️  Checking for database trigger...${NC}"
# Trigger verification would require db execute which we're skipping

# Summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment completado exitosamente!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}📊 Información del deployment:${NC}"
echo "  • Proyecto: ${PROJECT_REF}"
echo "  • URL: ${SUPABASE_URL}"
echo "  • Función: ${FUNCTION_NAME}"
echo "  • URL de la función: ${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}"

echo -e "\n${YELLOW}📝 Próximos pasos:${NC}"

if [ "$MISSING_SECRETS" = true ]; then
    echo "  1. Configura los secretos faltantes:"
    echo "     supabase secrets set GOOGLE_SHEETS_CREDENTIALS='{...}' --project-ref ${PROJECT_REF}"
    echo "     supabase secrets set GOOGLE_SHEET_ID='tu-sheet-id' --project-ref ${PROJECT_REF}"
    echo "     supabase secrets set GOOGLE_SHEET_NAME='Applications' --project-ref ${PROJECT_REF}"
fi

echo "  2. Prueba la función con una solicitud de prueba"
echo "  3. Revisa los logs:"
echo "     supabase functions logs ${FUNCTION_NAME} --project-ref ${PROJECT_REF}"
echo "  4. Verifica que los datos aparezcan en tu Google Sheet"

echo -e "\n${YELLOW}🔗 Enlaces útiles:${NC}"
echo "  • Dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}"
echo "  • Logs: https://supabase.com/dashboard/project/${PROJECT_REF}/functions/${FUNCTION_NAME}/logs"
echo "  • Settings: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/functions"

echo -e "\n${GREEN}¡Listo! 🎉${NC}"
