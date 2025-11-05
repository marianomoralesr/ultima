#!/bin/bash
set -e
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
DB_PASSWORD="Lifeintechnicolor2!"
PROJECT_REF="jjepfehmuybpctdzipnu"

echo "Applying roadmap infinite recursion fix..."
cat ../supabase/migrations/20251105000007_fix_roadmap_infinite_recursion.sql | \
PGPASSWORD="${DB_PASSWORD}" psql \
  -h "aws-0-us-east-2.pooler.supabase.com" \
  -p "5432" \
  -U "postgres.${PROJECT_REF}" \
  -d "postgres"
