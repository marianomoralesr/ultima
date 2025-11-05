#!/bin/bash

# Pre-Migration Backup Script
# Run this script BEFORE applying any migrations to ensure you can rollback

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛡️  PRE-MIGRATION SAFETY BACKUP${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo -e "${YELLOW}This will create a backup before you apply migrations.${NC}"
echo -e "${YELLOW}You can use this backup to rollback if something goes wrong.${NC}"
echo ""

# Create the backup
./scripts/backup-database.sh

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Pre-migration backup completed!${NC}"
    echo -e "${GREEN}You can now safely apply your migrations.${NC}"
    echo ""
    echo -e "${YELLOW}To apply migrations:${NC}"
    echo -e "  supabase db push"
    echo ""
    echo -e "${YELLOW}If something goes wrong, restore using:${NC}"
    echo -e "  ./scripts/restore-database.sh ./backups/backup_<timestamp>.sql"
else
    echo -e "${RED}❌ Backup failed! DO NOT proceed with migrations.${NC}"
    exit 1
fi
