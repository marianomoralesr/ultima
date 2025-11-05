#!/bin/bash

# Apply a migration file to the database
# Usage: ./apply-migration.sh <migration_file.sql>

set -e

# Add PostgreSQL to PATH
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Configuration
PROJECT_REF="jjepfehmuybpctdzipnu"
DB_PASSWORD="Lifeintechnicolor2!"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No migration file specified${NC}"
    echo -e "${YELLOW}Usage: $0 <migration_file.sql>${NC}"
    exit 1
fi

MIGRATION_FILE="$1"

if [ ! -f "${MIGRATION_FILE}" ]; then
    echo -e "${RED}❌ Error: Migration file not found: ${MIGRATION_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 Applying migration: ${MIGRATION_FILE}${NC}"

# Apply using cat and psql (this method works with the password)
cat "${MIGRATION_FILE}" | PGPASSWORD="${DB_PASSWORD}" psql \
  -h "aws-0-us-east-2.pooler.supabase.com" \
  -p "5432" \
  -U "postgres.${PROJECT_REF}" \
  -d "postgres"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration applied successfully!${NC}"
else
    echo -e "${RED}❌ Migration failed!${NC}"
    exit 1
fi
