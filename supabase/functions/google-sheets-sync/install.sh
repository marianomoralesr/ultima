#!/bin/bash

# Script de Instalación Completa - Google Sheets Sync
# Este script ejecuta todo el proceso de configuración automáticamente

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

clear

echo -e "${MAGENTA}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ___                   _        ___  _               _    ║
║  / __|___  ___  __ _ __| |___   / __|| |_  ___ ___ _| |_  ║
║ | (_ / _ \/ _ \/ _` / _` / -_)  \__ \| ' \/ -_) -_)_   _| ║
║  \___\___/\___/\__, \__,_\___|  |___/|_||_\___\___| |_|   ║
║                |___/                                       ║
║                     Sync Installer                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}Instalador Completo - Google Sheets Sync${NC}"
echo -e "${BLUE}Proyecto: TREFA - Solicitudes de Financiamiento${NC}"
echo ""

# Project info
PROJECT_REF="jjepfehmuybpctdzipnu"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

echo -e "${YELLOW}📋 Información del Proyecto:${NC}"
echo "  • Proyecto ID: ${PROJECT_REF}"
echo "  • URL: ${SUPABASE_URL}"
echo ""

# Check prerequisites
echo -e "${YELLOW}🔍 Verificando pre-requisitos...${NC}"

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI no está instalado${NC}"
    echo "Instala con: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI instalado${NC}"

# Check jq
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq no está instalado (opcional pero recomendado)${NC}"
    echo "Instala con: brew install jq (macOS) o apt-get install jq (Linux)"
else
    echo -e "${GREEN}✓ jq instalado${NC}"
fi

# Check curl
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ curl instalado${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Configure secrets
echo -e "${BLUE}━━━ PASO 1 de 3: Configurar Secretos ━━━${NC}"
echo ""
echo -e "${YELLOW}Necesitarás:${NC}"
echo "  1. Archivo JSON de la cuenta de servicio de Google"
echo "  2. ID de tu Google Sheet"
echo "  3. Nombre de la pestaña (opcional)"
echo ""

read -p "$(echo -e ${YELLOW}¿Continuar con la configuración de secretos? [S/n]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}⊘ Omitiendo configuración de secretos${NC}"
    echo "Puedes configurarlos manualmente después con: ./setup-secrets.sh"
else
    ./setup-secrets.sh
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 2: Deploy
echo -e "${BLUE}━━━ PASO 2 de 3: Desplegar Función y Base de Datos ━━━${NC}"
echo ""

read -p "$(echo -e ${YELLOW}¿Continuar con el deployment? [S/n]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}⊘ Deployment cancelado${NC}"
    exit 0
fi

./deploy.sh

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 3: Test
echo -e "${BLUE}━━━ PASO 3 de 3: Probar Integración ━━━${NC}"
echo ""

read -p "$(echo -e ${YELLOW}¿Ejecutar prueba? [S/n]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}⊘ Prueba omitida${NC}"
else
    ./test.sh
fi

# Final summary
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}         🎉 INSTALACIÓN COMPLETADA 🎉${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}✅ La sincronización con Google Sheets está activa${NC}"
echo ""

echo -e "${YELLOW}📊 Panel de Control:${NC}"
echo "  • Dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}"
echo "  • Logs: https://supabase.com/dashboard/project/${PROJECT_REF}/functions/google-sheets-sync/logs"
echo ""

echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "  1. Abre tu Google Sheet y verifica la fila de prueba"
echo "  2. Envía una solicitud real desde tu aplicación"
echo "  3. Verifica que aparezca en Google Sheets en 1-2 segundos"
echo "  4. Personaliza tu Google Sheet (congela encabezados, agrega filtros)"
echo "  5. Conecta con AppSheet para crear apps móviles"
echo ""

echo -e "${YELLOW}🔧 Comandos útiles:${NC}"
echo "  • Ver logs: supabase functions logs google-sheets-sync --project-ref ${PROJECT_REF} --follow"
echo "  • Re-probar: ./test.sh"
echo "  • Re-desplegar: ./deploy.sh"
echo "  • Reconfigurar secretos: ./setup-secrets.sh"
echo ""

echo -e "${YELLOW}📚 Documentación:${NC}"
echo "  • Guía Rápida: QUICK_START.md"
echo "  • Guía Completa: GUIA_CONFIGURACION.md"
echo "  • README Técnico: README.md"
echo ""

echo -e "${GREEN}¡Gracias por usar Google Sheets Sync! 🚀${NC}"
echo ""
