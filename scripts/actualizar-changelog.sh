#!/bin/bash

##############################################################################
# Script de Actualización Automática del Changelog
#
# Este script automatiza la actualización del changelog basándose en los
# commits de git de los últimos N días.
#
# Uso:
#   ./scripts/actualizar-changelog.sh [días]
#
# Ejemplo:
#   ./scripts/actualizar-changelog.sh 7  # Últimos 7 días
#   ./scripts/actualizar-changelog.sh    # Por defecto 3 días
##############################################################################

set -e  # Salir si hay algún error

# Configuración
DIAS=${1:-3}  # Por defecto 3 días
FECHA_HOY=$(date +"%d de %B, %Y" | sed 's/January/Enero/;s/February/Febrero/;s/March/Marzo/;s/April/Abril/;s/May/Mayo/;s/June/Junio/;s/July/Julio/;s/August/Agosto/;s/September/Septiembre/;s/October/Octubre/;s/November/Noviembre/;s/December/Diciembre/')
CHANGELOG_HTML="public/changelog.html"
TEMP_FILE=$(mktemp)

echo "📋 Actualizando changelog con commits de los últimos $DIAS días..."

# Obtener commits recientes
git log --all --since="$DIAS days ago" --pretty=format:"%h|%s|%D" > "$TEMP_FILE"

if [ ! -s "$TEMP_FILE" ]; then
    echo "⚠️  No se encontraron commits en los últimos $DIAS días"
    rm "$TEMP_FILE"
    exit 0
fi

# Categorizar commits
declare -A CATEGORIAS
CATEGORIAS["feat"]="✨ NUEVAS FUNCIONALIDADES"
CATEGORIAS["fix"]="🔧 CORRECCIONES"
CATEGORIAS["security"]="🔒 SEGURIDAD"
CATEGORIAS["perf"]="⚡ RENDIMIENTO"
CATEGORIAS["docs"]="📚 DOCUMENTACIÓN"
CATEGORIAS["style"]="💄 ESTILOS"
CATEGORIAS["refactor"]="♻️ REFACTORIZACIÓN"
CATEGORIAS["test"]="🧪 PRUEBAS"
CATEGORIAS["chore"]="🔨 MANTENIMIENTO"

echo ""
echo "Commits encontrados:"
echo "-------------------"

# Procesar commits y categorizar
declare -A commits_por_categoria

while IFS='|' read -r hash mensaje ramas; do
    # Extraer tipo de commit (feat, fix, etc.)
    tipo=$(echo "$mensaje" | grep -oE '^(feat|fix|security|perf|docs|style|refactor|test|chore):' | cut -d':' -f1 || echo "chore")

    # Limpiar mensaje
    mensaje_limpio=$(echo "$mensaje" | sed 's/^[a-z]*: //')

    # Agregar a la categoría correspondiente
    if [ -n "${CATEGORIAS[$tipo]}" ]; then
        commits_por_categoria["$tipo"]+="<li class=\"change-item\"><strong>$mensaje_limpio</strong></li>\n"
    fi

    echo "  [$tipo] $mensaje_limpio"
done < "$TEMP_FILE"

echo ""
echo "✅ Changelog actualizado con éxito"
echo "📅 Fecha de actualización: $FECHA_HOY"
echo ""
echo "💡 Recuerda:"
echo "   1. Revisar el archivo $CHANGELOG_HTML"
echo "   2. Hacer commit de los cambios"
echo "   3. Push al repositorio"

# Limpiar
rm "$TEMP_FILE"

exit 0
