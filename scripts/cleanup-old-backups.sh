#!/bin/bash

# Script para Limpiar Respaldos Antiguos de Forma Segura
# Mantiene respaldos importantes y elimina los demás

set -e  # Exit on error

BACKUP_DIR="./backups"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Limpieza Inteligente de Respaldos          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# Check if backup directory exists
if [ ! -d "${BACKUP_DIR}" ]; then
    echo -e "${YELLOW}No existe directorio de respaldos.${NC}"
    exit 0
fi

# Count total backups
TOTAL_BACKUPS=$(ls -1 "${BACKUP_DIR}"/backup_*.sql 2>/dev/null | wc -l | tr -d ' ')

if [ "$TOTAL_BACKUPS" -eq 0 ]; then
    echo -e "${YELLOW}No hay respaldos para limpiar.${NC}"
    exit 0
fi

echo -e "${YELLOW}Respaldos encontrados: ${TOTAL_BACKUPS}${NC}"
echo ""

# Show current disk usage
CURRENT_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo -e "${YELLOW}Espacio usado actualmente: ${CURRENT_SIZE}${NC}"
echo ""

# === Estrategia de Retención ===
echo -e "${BLUE}Estrategia de Retención:${NC}"
echo -e "  📅 Últimos 7 días: Mantener TODOS los respaldos"
echo -e "  📅 Últimos 30 días: Mantener 1 respaldo por semana"
echo -e "  📅 Más de 30 días: Mantener 1 respaldo por mes"
echo -e "  📌 Siempre mantener al menos 5 respaldos recientes"
echo ""

# Arrays to track which backups to keep
declare -a KEEP_BACKUPS
declare -a DELETE_BACKUPS

# Get current timestamp
CURRENT_TIME=$(date +%s)

# Calculate time thresholds
SEVEN_DAYS_AGO=$((CURRENT_TIME - 7 * 86400))
THIRTY_DAYS_AGO=$((CURRENT_TIME - 30 * 86400))

# Process each backup
LAST_WEEK=""
LAST_MONTH=""
RECENT_COUNT=0

# Sort backups by date (newest first)
for BACKUP in $(ls -t "${BACKUP_DIR}"/backup_*.sql 2>/dev/null); do
    FILENAME=$(basename "$BACKUP")

    # Extract timestamp from filename (format: backup_YYYYMMDD_HHMMSS.sql)
    BACKUP_DATE=$(echo "$FILENAME" | sed 's/backup_\([0-9]*\)_.*\.sql/\1/')
    BACKUP_TIME=$(echo "$FILENAME" | sed 's/backup_[0-9]*_\([0-9]*\)\.sql/\1/')

    # Convert to Unix timestamp
    BACKUP_TIMESTAMP=$(date -j -f "%Y%m%d %H%M%S" "${BACKUP_DATE} ${BACKUP_TIME}" +%s 2>/dev/null || echo "0")

    if [ "$BACKUP_TIMESTAMP" -eq 0 ]; then
        # If we can't parse the date, keep the backup (safer)
        KEEP_BACKUPS+=("$BACKUP")
        continue
    fi

    # Calculate age in days
    AGE_SECONDS=$((CURRENT_TIME - BACKUP_TIMESTAMP))
    AGE_DAYS=$((AGE_SECONDS / 86400))

    # Determine whether to keep this backup
    SHOULD_KEEP=false
    REASON=""

    # Rule 1: Keep all backups from last 7 days
    if [ $BACKUP_TIMESTAMP -ge $SEVEN_DAYS_AGO ]; then
        SHOULD_KEEP=true
        REASON="Últimos 7 días"
        RECENT_COUNT=$((RECENT_COUNT + 1))

    # Rule 2: Keep one backup per week for last 30 days
    elif [ $BACKUP_TIMESTAMP -ge $THIRTY_DAYS_AGO ]; then
        WEEK=$(date -j -f %s "$BACKUP_TIMESTAMP" +%Y-W%U 2>/dev/null)
        if [ "$WEEK" != "$LAST_WEEK" ]; then
            SHOULD_KEEP=true
            REASON="Respaldo semanal"
            LAST_WEEK="$WEEK"
        fi

    # Rule 3: Keep one backup per month for older backups
    else
        MONTH=$(date -j -f %s "$BACKUP_TIMESTAMP" +%Y-%m 2>/dev/null)
        if [ "$MONTH" != "$LAST_MONTH" ]; then
            SHOULD_KEEP=true
            REASON="Respaldo mensual"
            LAST_MONTH="$MONTH"
        fi
    fi

    # Rule 4: Always keep at least 5 most recent backups
    if [ $RECENT_COUNT -lt 5 ]; then
        SHOULD_KEEP=true
        REASON="Top 5 recientes"
        RECENT_COUNT=$((RECENT_COUNT + 1))
    fi

    if [ "$SHOULD_KEEP" = true ]; then
        KEEP_BACKUPS+=("$BACKUP")
        echo -e "${GREEN}✓ MANTENER${NC} - ${FILENAME} (${AGE_DAYS} días) - ${REASON}"
    else
        DELETE_BACKUPS+=("$BACKUP")
        echo -e "${RED}✗ ELIMINAR${NC} - ${FILENAME} (${AGE_DAYS} días)"
    fi
done

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Respaldos a mantener: ${#KEEP_BACKUPS[@]}${NC}"
echo -e "${RED}Respaldos a eliminar: ${#DELETE_BACKUPS[@]}${NC}"
echo ""

# If no backups to delete, exit
if [ ${#DELETE_BACKUPS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ No hay respaldos para eliminar.${NC}"
    exit 0
fi

# Calculate space to be freed
SPACE_TO_FREE=0
for BACKUP in "${DELETE_BACKUPS[@]}"; do
    SIZE=$(stat -f%z "$BACKUP" 2>/dev/null || echo "0")
    SPACE_TO_FREE=$((SPACE_TO_FREE + SIZE))
done
SPACE_TO_FREE_MB=$((SPACE_TO_FREE / 1024 / 1024))

echo -e "${YELLOW}Espacio a liberar: ~${SPACE_TO_FREE_MB}MB${NC}"
echo ""

# Ask for confirmation
read -p "¿Eliminar estos respaldos? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${YELLOW}Limpieza cancelada.${NC}"
    exit 0
fi

# Delete backups
echo -e "${YELLOW}Eliminando respaldos antiguos...${NC}"
DELETED_COUNT=0
for BACKUP in "${DELETE_BACKUPS[@]}"; do
    rm -f "$BACKUP"
    DELETED_COUNT=$((DELETED_COUNT + 1))
    echo -e "${GREEN}✓${NC} Eliminado: $(basename "$BACKUP")"
done

echo ""
echo -e "${GREEN}✓ Limpieza completada.${NC}"
echo -e "${GREEN}  Respaldos eliminados: ${DELETED_COUNT}${NC}"
echo -e "${GREEN}  Respaldos conservados: ${#KEEP_BACKUPS[@]}${NC}"

# Show new disk usage
NEW_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo -e "${GREEN}  Espacio usado ahora: ${NEW_SIZE}${NC}"
