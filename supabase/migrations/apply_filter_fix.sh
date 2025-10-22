#!/bin/bash
# Apply transmision and combustible column migrations

set -e

echo "🔧 Applying filter column normalization migrations..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Apply the migrations
echo "📝 Step 1: Adding transmision and combustible columns..."
supabase db push --include "20251021200000_add_transmision_combustible_columns.sql"

echo "📝 Step 2: Creating auto-sync triggers..."
supabase db push --include "20251021200001_sync_transmision_combustible_trigger.sql"

echo "✅ Migrations applied successfully!"
echo ""
echo "📊 Verifying the changes..."

# Test query to check if columns exist and have data
supabase db query <<SQL
SELECT
  COUNT(*) as total_vehicles,
  COUNT(transmision) as with_transmision,
  COUNT(combustible) as with_combustible
FROM inventario_cache
WHERE ordenstatus = 'Comprado';
SQL

echo ""
echo "✅ All done! Your filters should now work correctly."
echo ""
echo "Next steps:"
echo "1. Test the filters in your app"
echo "2. Verify transmision and combustible filters show options"
echo "3. Check that vehicle counts are now accurate (should be 80)"
