#!/bin/bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Load database configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/db-config.sh"
# DB_PASSWORD is now loaded from db-config.sh
PROJECT_REF="jjepfehmuybpctdzipnu"

echo "=== ROADMAP TABLE CHECK ==="
PGPASSWORD="${DB_PASSWORD}" psql \
  -h "aws-0-us-east-2.pooler.supabase.com" \
  -p "5432" \
  -U "postgres.${PROJECT_REF}" \
  -d "postgres" \
  -c "
-- Check if roadmap_items table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'roadmap_items'
) as table_exists;

-- Count roadmap items
SELECT COUNT(*) as total_roadmap_items FROM roadmap_items;

-- Check RLS policies on roadmap_items
SELECT policyname, 
       CASE cmd
           WHEN 'r' THEN 'SELECT'
           WHEN 'a' THEN 'INSERT'
           WHEN 'w' THEN 'UPDATE'
           WHEN 'd' THEN 'DELETE'
           WHEN '*' THEN 'ALL'
           ELSE cmd::text
       END as command,
       qual as using_expression
FROM pg_policies
WHERE tablename = 'roadmap_items'
ORDER BY policyname;
"
