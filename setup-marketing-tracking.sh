#!/bin/bash

# Marketing Tracking Setup Script
# Este script facilita la configuración inicial del sistema de tracking

set -e

echo "🚀 Configuración de Marketing Tracking - GTM & Facebook Pixel"
echo "=============================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if Supabase is running
echo "📋 Paso 1: Verificando conexión a Supabase..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI no está instalado${NC}"
    echo "Instálalo con: brew install supabase/tap/supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI encontrado${NC}"
echo ""

# Step 2: Apply database migrations
echo "📋 Paso 2: Aplicando migraciones de base de datos..."
if [ -f "supabase/migrations/20250105000000_create_marketing_tracking_tables.sql" ]; then
    supabase db push
    echo -e "${GREEN}✅ Migraciones aplicadas exitosamente${NC}"
else
    echo -e "${RED}❌ Archivo de migración no encontrado${NC}"
    exit 1
fi
echo ""

# Step 3: Verify tables were created
echo "📋 Paso 3: Verificando tablas creadas..."
echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('marketing_config', 'tracking_events');" | supabase db execute
echo -e "${GREEN}✅ Tablas verificadas${NC}"
echo ""

# Step 4: Ask for GTM Container ID
echo "📋 Paso 4: Configuración de IDs"
echo ""
echo -e "${YELLOW}¿Tienes tu GTM Container ID? (formato: GTM-XXXXXXX)${NC}"
read -p "GTM Container ID (presiona Enter para omitir): " gtm_id

if [ -n "$gtm_id" ]; then
    echo -e "${GREEN}✅ GTM ID guardado: $gtm_id${NC}"
fi
echo ""

# Step 5: Ask for Facebook Pixel ID
echo -e "${YELLOW}¿Tienes tu Facebook Pixel ID? (15-16 dígitos)${NC}"
read -p "Facebook Pixel ID (presiona Enter para omitir): " fb_pixel_id

if [ -n "$fb_pixel_id" ]; then
    echo -e "${GREEN}✅ Facebook Pixel ID guardado: $fb_pixel_id${NC}"
fi
echo ""

# Step 6: Optional - Insert configuration
if [ -n "$gtm_id" ] && [ -n "$fb_pixel_id" ]; then
    echo "📋 Paso 5: ¿Deseas insertar esta configuración en la base de datos ahora?"
    read -p "(s/n): " insert_config

    if [ "$insert_config" = "s" ]; then
        cat <<EOF | supabase db execute
INSERT INTO public.marketing_config (
    gtm_container_id,
    facebook_pixel_id,
    conversion_events,
    active
) VALUES (
    '$gtm_id',
    '$fb_pixel_id',
    '[
        {"id": "lead", "name": "Lead Capturado", "event_type": "Lead", "trigger_location": "Formularios", "enabled": true, "fb_enabled": true, "gtm_enabled": true},
        {"id": "pageview", "name": "Vista de Página", "event_type": "PageView", "trigger_location": "Todas las páginas", "enabled": true, "fb_enabled": true, "gtm_enabled": true},
        {"id": "viewcontent", "name": "Ver Contenido", "event_type": "ViewContent", "trigger_location": "Páginas de vehículos", "enabled": true, "fb_enabled": true, "gtm_enabled": true},
        {"id": "registration", "name": "Registro Completo", "event_type": "CompleteRegistration", "trigger_location": "Autenticación", "enabled": true, "fb_enabled": true, "gtm_enabled": true}
    ]'::jsonb,
    true
);
EOF
        echo -e "${GREEN}✅ Configuración insertada en la base de datos${NC}"
    fi
fi
echo ""

# Final steps
echo "=============================================================="
echo -e "${GREEN}✅ Setup completado!${NC}"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Accede a la interfaz de configuración:"
echo "   http://localhost:5173/escritorio/admin/marketing-config"
echo ""
echo "2. Si no ingresaste los IDs, configúralos en la interfaz"
echo ""
echo "3. Descarga el contenedor GTM con el botón 'Exportar GTM'"
echo ""
echo "4. Importa el contenedor en Google Tag Manager:"
echo "   https://tagmanager.google.com/"
echo ""
echo "5. Lee la documentación completa en:"
echo "   MARKETING_TRACKING_SETUP.md"
echo ""
echo "6. Prueba el tracking con el botón 'Test Tracking'"
echo ""
echo -e "${YELLOW}📖 Documentación: MARKETING_TRACKING_SETUP.md${NC}"
echo ""
