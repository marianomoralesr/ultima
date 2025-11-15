#!/bin/bash

# Apply Google Sheets sync trigger migration directly to production database
echo "Applying Google Sheets sync trigger migration..."

PGPASSWORD="Lifeintechnicolor2!" psql \
  -h db.jjepfehmuybpctdzipnu.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f supabase/migrations/20251114144533_add_google_sheets_sync_trigger.sql

echo "Migration complete! Checking if trigger exists..."

PGPASSWORD="Lifeintechnicolor2!" psql \
  -h db.jjepfehmuybpctdzipnu.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_name = 'on_application_sync_to_sheets';"

echo "Done!"
