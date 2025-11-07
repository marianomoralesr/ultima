#!/bin/bash
# Script to apply Kommo webhook tables migration

echo "🔄 Applying Kommo webhook tables migration..."

# Check if migration file exists
if [ ! -f "supabase/migrations/20251107000002_create_kommo_webhook_tables.sql" ]; then
    echo "❌ Migration file not found!"
    exit 1
fi

# Apply migration using supabase CLI
echo "📤 Pushing migration to Supabase..."
echo "yes" | supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "Tables created:"
    echo "  - kommo_leads"
    echo "  - kommo_webhook_logs"
    echo ""
    echo "Next steps:"
    echo "1. Configure webhook in Kommo CRM"
    echo "2. Point it to: https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/kommo-webhook"
    echo "3. Test with a lead update in Kommo"
else
    echo "❌ Migration failed!"
    echo ""
    echo "You can manually apply it via Supabase Dashboard SQL Editor:"
    echo "https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new"
    exit 1
fi
