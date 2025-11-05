#!/bin/bash

# Setup Marketing Tracking para Ultima Copy
# GTM: GTM-KDVDMB4X
# FB Pixel: 1748754972582547

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🚀 Setup Marketing Tracking - Ultima Copy${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}GTM Container ID:${NC} GTM-KDVDMB4X"
echo -e "${YELLOW}Facebook Pixel ID:${NC} 1748754972582547"
echo ""

# Paso 1: Aplicar migraciones
echo -e "${BLUE}📋 Paso 1: Aplicando migraciones de base de datos...${NC}"
if supabase db push; then
    echo -e "${GREEN}✅ Migraciones aplicadas exitosamente${NC}"
else
    echo -e "${RED}❌ Error al aplicar migraciones${NC}"
    echo -e "${YELLOW}Asegúrate de que Supabase esté corriendo: supabase status${NC}"
    exit 1
fi
echo ""

# Paso 2: Insertar configuración
echo -e "${BLUE}📋 Paso 2: Insertando configuración de marketing...${NC}"
if supabase db execute < insert-marketing-config.sql; then
    echo -e "${GREEN}✅ Configuración insertada en la base de datos${NC}"
else
    echo -e "${RED}❌ Error al insertar configuración${NC}"
    exit 1
fi
echo ""

# Paso 3: Verificar
echo -e "${BLUE}📋 Paso 3: Verificando instalación...${NC}"
echo "SELECT gtm_container_id, facebook_pixel_id, active FROM marketing_config WHERE active = true;" | supabase db execute
echo ""

# Paso 4: Instrucciones para GTM
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup completado exitosamente!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo ""
echo "1. Importar contenedor en Google Tag Manager:"
echo "   📁 Archivo: gtm-container-ultima-copy.json"
echo "   🔗 URL: https://tagmanager.google.com/container/GTM-KDVDMB4X"
echo ""
echo "2. Pasos para importar:"
echo "   a. Ve a Google Tag Manager"
echo "   b. Selecciona el contenedor GTM-KDVDMB4X"
echo "   c. Admin → Import Container"
echo "   d. Sube gtm-container-ultima-copy.json"
echo "   e. Choose: Merge → Rename conflicting items"
echo "   f. Confirm → Submit → Publish"
echo ""
echo "3. Verificar tracking en tu sitio:"
echo "   a. Abre http://localhost:5173"
echo "   b. Presiona F12 (DevTools)"
echo "   c. En consola ejecuta: conversionTracking.test()"
echo "   d. Deberías ver: ✅ GTM active, ✅ Facebook Pixel active"
echo ""
echo "4. Ver en Facebook Events Manager:"
echo "   🔗 https://business.facebook.com/events_manager2/list/pixel/1748754972582547"
echo ""
echo -e "${BLUE}🎉 Tu tracking está configurado y listo!${NC}"
echo ""
