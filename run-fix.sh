#!/bin/bash
# Script para aplicar el fix de sales access
# Uso: ./run-fix.sh

echo "🔧 Aplicando fix de acceso para Sales..."
echo ""
echo "Por favor ingresa la contraseña de la base de datos:"
read -s DB_PASSWORD
echo ""

export PGPASSWORD="$DB_PASSWORD"

echo "🔌 Conectando a Supabase..."
psql -h aws-0-us-east-2.pooler.supabase.com \
     -p 5432 \
     -d postgres \
     -U postgres.jjepfehmuybpctdzipnu \
     -f apply-sales-fix.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Fix aplicado exitosamente!"
    echo ""
    echo "📋 Cambios aplicados:"
    echo "  ✓ Sales puede ver TODOS sus leads asignados"
    echo "  ✓ No más pantallas de carga infinita"
    echo "  ✓ Admin mantiene acceso total"
    echo "  ✓ Sin recursión infinita"
else
    echo ""
    echo "❌ Error al aplicar el fix"
    echo "Verifica la contraseña y la conexión"
fi
