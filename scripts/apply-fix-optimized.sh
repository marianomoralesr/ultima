#!/bin/bash
# Script optimizado para aplicar el fix de sales access
# Uso: ./apply-fix-optimized.sh

set -e

echo "🔧 Aplicando fix de acceso para Sales..."
echo ""

# Configuración
DB_HOST="db.jjepfehmuybpctdzipnu.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="${PGPASSWORD:-Lifeintechnicolor2!}"

CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

# Función para ejecutar SQL con manejo de errores
execute_sql() {
    local part_num=$1
    local description=$2
    local sql_file=$3

    echo "📝 Parte ${part_num}: ${description}"
    if PGPASSWORD="${DB_PASSWORD}" psql "${CONNECTION_STRING}" -f "${sql_file}" -v ON_ERROR_STOP=1 --quiet 2>&1; then
        echo "✅ Parte ${part_num} completada"
        return 0
    else
        echo "❌ Error en parte ${part_num}"
        return 1
    fi
}

# Test de conexión
echo "🔌 Probando conexión..."
if ! PGPASSWORD="${DB_PASSWORD}" psql "${CONNECTION_STRING}" -c "SELECT 'Conexión exitosa' as status;" --quiet 2>&1; then
    echo "❌ No se pudo conectar a la base de datos"
    echo "Por favor verifica la contraseña y el connection string"
    exit 1
fi
echo "✅ Conexión exitosa"
echo ""

# Ejecutar partes
execute_sql 1 "Políticas de Profiles" "../docs/sql-scripts/fix-part-1-policies.sql" || exit 1
execute_sql 2 "Función get_sales_assigned_leads" "../docs/sql-scripts/fix-part-2-function-leads.sql" || exit 1
execute_sql 3 "Función get_sales_dashboard_stats" "../docs/sql-scripts/fix-part-3-function-stats.sql" || exit 1
execute_sql 4 "Funciones de perfil de cliente" "../docs/sql-scripts/fix-part-4-function-profile.sql" || exit 1
execute_sql 5 "Políticas de Applications" "../docs/sql-scripts/fix-part-5-apps-policies.sql" || exit 1
execute_sql 6 "Políticas de Documents y Bank Profiles" "../docs/sql-scripts/fix-part-6-docs-policies.sql" || exit 1

echo ""
echo "✅ ¡Fix aplicado exitosamente!"
echo ""
echo "📋 Cambios aplicados:"
echo "  - Políticas RLS actualizadas (profiles, applications, documents, bank_profiles)"
echo "  - 4 funciones RPC actualizadas para sales"
echo "  - Constraint asesor_autorizado_acceso removido globalmente"
echo ""
echo "🎯 Resultado:"
echo "  - Sales puede ver TODOS sus leads asignados"
echo "  - No más pantallas de carga infinita"
echo "  - Admin mantiene acceso total"
echo ""
