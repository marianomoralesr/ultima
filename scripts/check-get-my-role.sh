#!/bin/bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Load database configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/db-config.sh"
# DB_PASSWORD is now loaded from db-config.sh
PROJECT_REF="jjepfehmuybpctdzipnu"

PGPASSWORD="${DB_PASSWORD}" psql \
  -h "aws-0-us-east-2.pooler.supabase.com" \
  -p "5432" \
  -U "postgres.${PROJECT_REF}" \
  -d "postgres" \
  -c "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'get_my_role';"
