#!/bin/bash

# Script para aplicar migración de SMS OTP
# Este script aplica la migración directamente a la base de datos de producción

set -e

echo "🚀 Aplicando migración de SMS OTP..."
echo ""

# Leer la migración
MIGRATION_FILE="supabase/migrations/20251203200000_create_sms_otp_system.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: No se encontró el archivo de migración"
    echo "   Buscando: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Archivo de migración encontrado"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   Este script aplicará la migración a tu base de datos de Supabase"
echo "   Asegúrate de estar conectado al proyecto correcto"
echo ""

# Confirmar con el usuario
read -p "¿Deseas continuar? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Obtener la URL de conexión de Supabase
echo ""
echo "📡 Conectando a Supabase..."

# Ejecutar la migración usando el CLI de Supabase
npx supabase db push --include-all

echo ""
echo "✅ Migración aplicada exitosamente!"
echo ""
echo "🔍 Para verificar que se creó la tabla:"
echo "   1. Ve a Supabase Dashboard → Table Editor"
echo "   2. Busca la tabla 'sms_otp_codes'"
echo ""
echo "🧪 Para probar la función RPC:"
echo "   SELECT verify_sms_otp('+525512345678', '123456');"
echo ""
