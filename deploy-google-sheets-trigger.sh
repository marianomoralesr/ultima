#!/bin/bash

# Apply Google Sheets sync trigger migration directly to production database

# Load database configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/scripts/.env" ]; then
    source "${SCRIPT_DIR}/scripts/.env"
fi

# Check if password is set
if [ -z "$DB_PASSWORD" ]; then
    echo "ERROR: DB_PASSWORD environment variable is not set!"
    echo "Please set it by: export DB_PASSWORD=your-password"
    exit 1
fi

export PGPASSWORD="$DB_PASSWORD"

echo "Applying Google Sheets sync trigger migration..."

psql \
  -h db.jjepfehmuybpctdzipnu.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f supabase/migrations/20251114144533_add_google_sheets_sync_trigger.sql

echo "Migration complete! Checking if trigger exists..."

psql \
  -h db.jjepfehmuybpctdzipnu.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_name = 'on_application_sync_to_sheets';"

echo "Done!"
