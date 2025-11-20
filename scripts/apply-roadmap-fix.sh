#!/bin/bash
set -e

# Load database configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/db-config.sh"
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
# DB_PASSWORD is now loaded from db-config.sh
PROJECT_REF="jjepfehmuybpctdzipnu"

echo "Applying roadmap infinite recursion fix..."
cat ../supabase/migrations/20251105000007_fix_roadmap_infinite_recursion.sql | \
PGPASSWORD="${DB_PASSWORD}" psql \
  -h "aws-0-us-east-2.pooler.supabase.com" \
  -p "5432" \
  -U "postgres.${PROJECT_REF}" \
  -d "postgres"
