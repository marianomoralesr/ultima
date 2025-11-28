#!/bin/bash

echo "🔍 Verificando si la tabla facebook_catalogue_events existe..."

# Crear script SQL temporal para verificar
cat > /tmp/check_fb_table.sql << 'EOF'
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'facebook_catalogue_events'
);
EOF

echo "📊 Ejecutando verificación..."
echo ""
echo "⚠️  INSTRUCCIONES MANUALES:"
echo ""
echo "1. Ve a: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new"
echo ""
echo "2. Copia y pega el siguiente SQL para verificar si la tabla existe:"
echo ""
cat /tmp/check_fb_table.sql
echo ""
echo "3. Si el resultado es 'false', ejecuta esta migración:"
echo ""
cat supabase/migrations/20251127000000_create_facebook_catalogue_events.sql
