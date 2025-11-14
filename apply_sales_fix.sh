#!/bin/bash

# Apply the sales access fix migration
# This removes the asesor_autorizado_acceso requirement from get_sales_client_profile

echo "Applying sales access fix migration..."
echo "This will allow sales agents to access all their assigned leads at /escritorio/ventas/cliente/:id"
echo ""

cd "$(dirname "$0")"

# Apply migration using supabase db push
supabase db push --include-all

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "Sales agents can now access:"
    echo "  • /escritorio/ventas/cliente/:id pages"
    echo "  • All applications and documents for their assigned leads"
    echo ""
    echo "The fix removed the asesor_autorizado_acceso check,"
    echo "so sales can now access ALL leads where asesor_asignado_id matches their user ID"
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    echo ""
    echo "If the issue is with previous migrations, you may need to:"
    echo "  1. Manually apply just this migration via Supabase dashboard"
    echo "  2. Or fix the blocking migration first"
fi
