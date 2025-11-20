#!/bin/bash


# Load database configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/db-config.sh"
# Database Restoration Script for Supabase
# This script restores a database backup

set -e  # Exit on any error

# Add PostgreSQL to PATH
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Configuration
PROJECT_REF="jjepfehmuybpctdzipnu"
# DB_PASSWORD is now loaded from db-config.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No backup file specified${NC}"
    echo -e "${YELLOW}Usage: $0 <backup_file.sql>${NC}"
    echo ""
    echo -e "${YELLOW}Available backups:${NC}"
    if [ -d "./backups" ]; then
        ls -lht ./backups/backup_*.sql 2>/dev/null | head -10 || echo "  No backups found"
        echo ""
        if [ -f "./backups/latest_backup.txt" ]; then
            LATEST=$(cat ./backups/latest_backup.txt)
            echo -e "${GREEN}Latest backup: ${LATEST}${NC}"
        fi
    else
        echo "  No backups directory found"
    fi
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}❌ Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${RED}⚠️  WARNING: This will OVERWRITE your current database!${NC}"
echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"
echo -e "${YELLOW}Database: ${PROJECT_REF}${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'YES' to confirm): " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo -e "${YELLOW}Restoration cancelled.${NC}"
    exit 0
fi

echo -e "${YELLOW}🔄 Creating safety backup before restoration...${NC}"
./scripts/backup-database.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create safety backup. Aborting restoration.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔄 Starting database restoration...${NC}"

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${RED}❌ Error: Supabase project not linked${NC}"
    echo -e "${YELLOW}Run: supabase link --project-ref ${PROJECT_REF}${NC}"
    exit 1
fi

# Restore using psql
PGPASSWORD="${DB_PASSWORD}" psql \
  -h "aws-0-us-east-2.pooler.supabase.com" \
  -p "5432" \
  -U "postgres.${PROJECT_REF}" \
  -d "postgres" \
  -f "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
    echo -e "${YELLOW}Note: You may need to restart your application for changes to take effect.${NC}"
else
    echo -e "${RED}❌ Restoration failed!${NC}"
    echo -e "${YELLOW}Your database should still be in its previous state.${NC}"
    exit 1
fi
