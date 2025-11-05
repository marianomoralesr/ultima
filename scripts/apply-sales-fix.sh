#!/bin/bash
set -e
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
DB_PASSWORD="Lifeintechnicolor2!"
PROJECT_REF="jjepfehmuybpctdzipnu"

cat ../supabase/migrations/20251105000005_fix_sales_functions_table_names.sql | \
PGPASSWORD="${DB_PASSWORD}" psql \
  -h "aws-0-us-east-2.pooler.supabase.com" \
  -p "5432" \
  -U "postgres.${PROJECT_REF}" \
  -d "postgres"
