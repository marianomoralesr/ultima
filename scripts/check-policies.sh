#!/bin/bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
DB_PASSWORD="Lifeintechnicolor2!"
PROJECT_REF="jjepfehmuybpctdzipnu"

PGPASSWORD="${DB_PASSWORD}" psql \
  -h "aws-0-us-east-2.pooler.supabase.com" \
  -p "5432" \
  -U "postgres.${PROJECT_REF}" \
  -d "postgres" \
  -c "SELECT policyname, qual, with_check FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;"
