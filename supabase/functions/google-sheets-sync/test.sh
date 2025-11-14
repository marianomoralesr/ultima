#!/bin/bash

# Script de prueba para Google Sheets Sync
# Este script envía una solicitud de prueba a la función

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Project configuration
PROJECT_REF="jjepfehmuybpctdzipnu"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
FUNCTION_URL="${SUPABASE_URL}/functions/v1/google-sheets-sync"

# Service role key (for testing)
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5OTYwMywiZXhwIjoyMDU5Nzc1NjAzfQ.KwSFEXOrtgwgIjMVG-czB73VWQIVDahgDvTdyL5qSQo"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Prueba de Google Sheets Sync${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}Configuración:${NC}"
echo "  • URL de la función: ${FUNCTION_URL}"
echo "  • Proyecto: ${PROJECT_REF}"

# Create test payload
TEST_PAYLOAD=$(cat <<'EOF'
{
  "record": {
    "id": "test-123-456",
    "user_id": "test-user-id",
    "status": "submitted",
    "created_at": "2025-01-14T00:00:00Z",
    "updated_at": "2025-01-14T00:00:00Z",
    "selected_banks": ["Santander", "BBVA"],
    "personal_info_snapshot": {
      "first_name": "Juan",
      "last_name": "Pérez",
      "mother_last_name": "García",
      "email": "juan.perez@example.com",
      "phone": "5551234567",
      "rfc": "PEGJ850101ABC",
      "homoclave": "ABC",
      "birth_date": "1985-01-01",
      "civil_status": "Casado",
      "spouse_name": "María López",
      "fiscal_situation": "Empleado",
      "address": "Calle Principal 123",
      "colony": "Centro",
      "city": "Ciudad de México",
      "state": "Ciudad de México",
      "zip_code": "01000"
    },
    "application_data": {
      "current_address": "Calle Principal 123",
      "current_colony": "Centro",
      "current_city": "Ciudad de México",
      "current_state": "Ciudad de México",
      "current_zip_code": "01000",
      "time_at_address": "3-5 años",
      "housing_type": "Propia",
      "grado_de_estudios": "Licenciatura",
      "dependents": "2",
      "fiscal_classification": "Empleado del sector privado",
      "company_name": "ACME Corporation",
      "company_phone": "5559876543",
      "supervisor_name": "Pedro Martínez",
      "company_website": "www.acme.com",
      "company_address": "Av. Reforma 500, Ciudad de México",
      "company_industry": "Tecnología",
      "job_title": "Ingeniero de Software",
      "job_seniority": "3-5 años",
      "net_monthly_income": "35,000",
      "friend_reference_name": "Carlos Rodríguez",
      "friend_reference_phone": "5551112222",
      "friend_reference_relationship": "Amistad",
      "family_reference_name": "Ana Pérez",
      "family_reference_phone": "5553334444",
      "parentesco": "Hermano/Hermana",
      "loan_term_months": 60,
      "down_payment_amount": 50000,
      "estimated_monthly_payment": 8500,
      "terms_and_conditions": true,
      "consent_survey": true,
      "ordencompra": "OC-2025-001"
    },
    "car_info": {
      "_vehicleTitle": "Honda Civic EX 2020",
      "_ordenCompra": "OC-2025-001",
      "_featureImage": "https://example.com/civic.jpg",
      "precio": 350000,
      "enganche_recomendado": 70000,
      "enganchemin": 50000,
      "mensualidad_recomendada": 8500,
      "plazomax": 60
    }
  }
}
EOF
)

echo -e "\n${YELLOW}📤 Enviando solicitud de prueba...${NC}"

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "${TEST_PAYLOAD}")

# Extract status code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "\n${YELLOW}📥 Respuesta recibida:${NC}"
echo "  • HTTP Status: ${HTTP_CODE}"

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Solicitud exitosa!${NC}"
    echo -e "\n${YELLOW}Respuesta:${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Prueba completada exitosamente${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    echo -e "\n${YELLOW}📋 Verifica:${NC}"
    echo "  1. Abre tu Google Sheet"
    echo "  2. Busca una nueva fila con Application ID: test-123-456"
    echo "  3. Verifica que todos los campos estén completos"

else
    echo -e "${RED}❌ Error en la solicitud${NC}"
    echo -e "\n${YELLOW}Respuesta de error:${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

    echo -e "\n${YELLOW}💡 Posibles causas:${NC}"
    echo "  • Los secretos no están configurados (GOOGLE_SHEETS_CREDENTIALS, GOOGLE_SHEET_ID)"
    echo "  • El Google Sheet no está compartido con la cuenta de servicio"
    echo "  • El ID del Google Sheet es incorrecto"
    echo "  • La API de Google Sheets no está habilitada"

    echo -e "\n${YELLOW}🔍 Revisa los logs:${NC}"
    echo "  supabase functions logs google-sheets-sync --project-ref ${PROJECT_REF}"

    exit 1
fi

echo -e "\n${YELLOW}📊 Ver más logs:${NC}"
echo "  supabase functions logs google-sheets-sync --project-ref ${PROJECT_REF} --follow"

echo -e "\n${GREEN}¡Listo! 🎉${NC}"
