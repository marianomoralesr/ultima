#!/usr/bin/env bash

##############################################################################
# Script de Actualización Automática del Changelog
#
# Este script automatiza la actualización del changelog basándose en los
# commits de git de los últimos N días y los AÑADE al changelog.html existente
# sin sobrescribir el contenido anterior.
#
# IMPORTANTE: Los commits deben estar escritos en ESPAÑOL desde el inicio.
#             El script NO traduce, usa los mensajes tal como están.
#
# Uso:
#   ./scripts/actualizar-changelog.sh [días]
#
# Ejemplo:
#   ./scripts/actualizar-changelog.sh 7  # Últimos 7 días
#   ./scripts/actualizar-changelog.sh    # Por defecto 3 días
##############################################################################

set -e  # Salir si hay algún error

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              📋 ACTUALIZACIÓN DE CHANGELOG                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  RECORDATORIO IMPORTANTE:"
echo "   ✅ Los commits DEBEN escribirse en ESPAÑOL desde el inicio"
echo "   ✅ Este script NO traduce, usa los mensajes tal cual están"
echo "   ✅ El changelog es PÚBLICO - los usuarios lo leen"
echo ""
echo "📖 Formato correcto:"
echo "   feat: Agregar sistema de notificaciones en tiempo real"
echo "   fix: Corregir cálculo de intereses en simulador"
echo ""
echo "❌ Formato incorrecto:"
echo "   feat: Add notification system"
echo "   fix: fix bug"
echo ""
echo "📚 Ver GUIA_COMMITS_ESPAÑOL.md para más detalles"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo ""

# Configuración
DIAS=${1:-3}  # Por defecto 3 días
FECHA_HOY=$(date +"%d de %B, %Y" | sed 's/January/Enero/;s/February/Febrero/;s/March/Marzo/;s/April/Abril/;s/May/Mayo/;s/June/Junio/;s/July/Julio/;s/August/Agosto/;s/September/Septiembre/;s/October/Octubre/;s/November/Noviembre/;s/December/Diciembre/')
CHANGELOG_HTML="public/changelog.html"
TEMP_FILE=$(mktemp)
TEMP_HTML=$(mktemp)
TEMP_COMMITS=$(mktemp)

echo "📋 Actualizando changelog con commits de los últimos $DIAS días..."

# Verificar que existe el archivo HTML
if [ ! -f "$CHANGELOG_HTML" ]; then
    echo "❌ Error: No se encuentra el archivo $CHANGELOG_HTML"
    exit 1
fi

# Obtener commits recientes
git log --all --since="$DIAS days ago" --pretty=format:"%h|%s|%D" > "$TEMP_FILE"

if [ ! -s "$TEMP_FILE" ]; then
    echo "⚠️  No se encontraron commits en los últimos $DIAS días"
    rm "$TEMP_FILE"
    exit 0
fi

echo ""
echo "Commits encontrados:"
echo "-------------------"

# Procesar commits y separar por categoría usando archivos temporales
> "$TEMP_COMMITS.feat"
> "$TEMP_COMMITS.fix"
> "$TEMP_COMMITS.security"
> "$TEMP_COMMITS.perf"
> "$TEMP_COMMITS.docs"
> "$TEMP_COMMITS.style"
> "$TEMP_COMMITS.refactor"
> "$TEMP_COMMITS.test"
> "$TEMP_COMMITS.chore"

# Variables para detectar commits en inglés
commits_en_ingles=0
total_commits=0

while IFS='|' read -r hash mensaje ramas; do
    total_commits=$((total_commits + 1))

    # Extraer tipo de commit (feat, fix, etc.)
    if echo "$mensaje" | grep -qE '^feat:'; then
        tipo="feat"
    elif echo "$mensaje" | grep -qE '^fix:'; then
        tipo="fix"
    elif echo "$mensaje" | grep -qE '^security:'; then
        tipo="security"
    elif echo "$mensaje" | grep -qE '^perf:'; then
        tipo="perf"
    elif echo "$mensaje" | grep -qE '^docs:'; then
        tipo="docs"
    elif echo "$mensaje" | grep -qE '^style:'; then
        tipo="style"
    elif echo "$mensaje" | grep -qE '^refactor:'; then
        tipo="refactor"
    elif echo "$mensaje" | grep -qE '^test:'; then
        tipo="test"
    else
        tipo="chore"
    fi

    # Limpiar mensaje (quitar prefijo)
    mensaje_limpio=$(echo "$mensaje" | sed 's/^[a-z]*: //')

    # Detectar si el mensaje está en inglés (simple heurística)
    if echo "$mensaje_limpio" | grep -qiE '\b(add|remove|fix|update|improve|create|delete|implement|refactor|optimize|enhance|change)\b'; then
        if ! echo "$mensaje_limpio" | grep -qiE '\b(agregar|eliminar|corregir|actualizar|mejorar|crear|implementar|refactorizar|optimizar|cambiar)\b'; then
            commits_en_ingles=$((commits_en_ingles + 1))
            echo "  ⚠️  [$tipo] $mensaje_limpio ($hash) [INGLÉS]"
        else
            echo "  [$tipo] $mensaje_limpio ($hash)"
        fi
    else
        echo "  [$tipo] $mensaje_limpio ($hash)"
    fi

    # Agregar a la categoría correspondiente (SIN TRADUCIR - se usa tal cual)
    echo "                        <li class=\"change-item\"><strong>$mensaje_limpio</strong> <span class=\"commit-hash\">$hash</span></li>" >> "$TEMP_COMMITS.$tipo"
done < "$TEMP_FILE"

# Verificar que hay commits para agregar
tiene_commits=false
for tipo in feat fix security perf docs style refactor test chore; do
    if [ -s "$TEMP_COMMITS.$tipo" ]; then
        tiene_commits=true
        break
    fi
done

if [ "$tiene_commits" = false ]; then
    echo "⚠️  No se encontraron commits categorizados"
    rm -f "$TEMP_FILE" "$TEMP_COMMITS".*
    exit 0
fi

# Mostrar advertencia si hay commits en inglés
if [ $commits_en_ingles -gt 0 ]; then
    echo ""
    echo "⚠️  ⚠️  ⚠️  ADVERTENCIA ⚠️  ⚠️  ⚠️"
    echo ""
    echo "   Se detectaron $commits_en_ingles commits en INGLÉS de $total_commits totales"
    echo ""
    echo "   Por favor, reescribe estos commits en ESPAÑOL antes de continuar."
    echo "   El changelog es PÚBLICO y debe estar completamente en español."
    echo ""
    echo "   Usa: git rebase -i HEAD~$total_commits"
    echo "   Luego cambia 'pick' por 'reword' en los commits en inglés"
    echo ""
    echo "   Ver GUIA_COMMITS_ESPAÑOL.md para ejemplos"
    echo ""
fi

# Obtener versión incrementada
ULTIMA_VERSION=$(grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' "$CHANGELOG_HTML" | head -1 | sed 's/v//')
MAJOR=$(echo "$ULTIMA_VERSION" | cut -d'.' -f1)
MINOR=$(echo "$ULTIMA_VERSION" | cut -d'.' -f2)
PATCH=$(echo "$ULTIMA_VERSION" | cut -d'.' -f3)
NUEVA_VERSION="v$MAJOR.$MINOR.$((PATCH + 1))"

echo ""
echo "📦 Generando nueva versión: $NUEVA_VERSION"

# Generar HTML de la nueva versión
cat > "$TEMP_HTML" << EOF

            <!-- VERSIÓN $NUEVA_VERSION - $FECHA_HOY -->
            <div class="version">
                <div class="version-header">
                    <span class="version-number">$NUEVA_VERSION</span>
                    <span class="version-date">$FECHA_HOY</span>
                    <span class="badge badge-feature">Actualización Automática</span>
                </div>
EOF

# Función para agregar categoría
add_category() {
    tipo=$1
    titulo=$2
    badge_class=$3

    if [ -s "$TEMP_COMMITS.$tipo" ]; then
        cat >> "$TEMP_HTML" << EOF

                <div class="change-category">
                    <div class="category-title">
                        <span class="badge $badge_class">$titulo</span>
                    </div>
                    <ul class="change-list">
EOF
        cat "$TEMP_COMMITS.$tipo" >> "$TEMP_HTML"
        cat >> "$TEMP_HTML" << EOF
                    </ul>
                </div>
EOF
    fi
}

# Agregar cada categoría con commits
add_category "feat" "✨ NUEVAS FUNCIONALIDADES" "badge-feature"
add_category "fix" "🔧 CORRECCIONES" "badge-fix"
add_category "security" "🔒 SEGURIDAD" "badge-security"
add_category "perf" "⚡ RENDIMIENTO" "badge-perf"
add_category "docs" "📚 DOCUMENTACIÓN" "badge-docs"
add_category "style" "💄 ESTILOS" "badge-feature"
add_category "refactor" "♻️ REFACTORIZACIÓN" "badge-feature"
add_category "test" "🧪 PRUEBAS" "badge-feature"
add_category "chore" "🔨 MANTENIMIENTO" "badge-feature"

cat >> "$TEMP_HTML" << EOF
            </div>
EOF

# Insertar la nueva versión en el HTML
# Buscar la línea que contiene '<div class="content">' y agregar después
LINEA_CONTENT=$(grep -n '<div class="content">' "$CHANGELOG_HTML" | head -1 | cut -d':' -f1)

if [ -z "$LINEA_CONTENT" ]; then
    echo "❌ Error: No se pudo encontrar '<div class=\"content\">' en el archivo"
    rm -f "$TEMP_FILE" "$TEMP_HTML" "$TEMP_COMMITS".*
    exit 1
fi

# Crear backup
cp "$CHANGELOG_HTML" "${CHANGELOG_HTML}.backup"

# Insertar nuevo contenido después de <div class="content">
{
    head -n "$((LINEA_CONTENT + 1))" "$CHANGELOG_HTML"
    cat "$TEMP_HTML"
    tail -n "+$((LINEA_CONTENT + 2))" "$CHANGELOG_HTML"
} > "${CHANGELOG_HTML}.tmp"

# Actualizar fecha en el header
sed "s/Última actualización: .*/Última actualización: $FECHA_HOY<\/p>/" "${CHANGELOG_HTML}.tmp" > "${CHANGELOG_HTML}.tmp2"
mv "${CHANGELOG_HTML}.tmp2" "${CHANGELOG_HTML}.tmp"

# Actualizar fecha en el footer
sed "s/🤖 Generado automáticamente • Última actualización: .*/🤖 Generado automáticamente • Última actualización: $FECHA_HOY/" "${CHANGELOG_HTML}.tmp" > "${CHANGELOG_HTML}.tmp2"
mv "${CHANGELOG_HTML}.tmp2" "${CHANGELOG_HTML}.tmp"

# Reemplazar el archivo original
mv "${CHANGELOG_HTML}.tmp" "$CHANGELOG_HTML"

echo ""
echo "✅ Changelog actualizado con éxito"
echo "📦 Nueva versión agregada: $NUEVA_VERSION"
echo "📅 Fecha de actualización: $FECHA_HOY"
echo "💾 Backup guardado en: ${CHANGELOG_HTML}.backup"
echo ""

# Mostrar estadísticas
total_commits=$(wc -l < "$TEMP_FILE" | tr -d ' ')
echo "📊 Estadísticas:"
echo "   Total de commits procesados: $total_commits"

for tipo in feat fix security perf docs style refactor test chore; do
    if [ -s "$TEMP_COMMITS.$tipo" ]; then
        count=$(wc -l < "$TEMP_COMMITS.$tipo" | tr -d ' ')
        case $tipo in
            feat) titulo="✨ NUEVAS FUNCIONALIDADES" ;;
            fix) titulo="🔧 CORRECCIONES" ;;
            security) titulo="🔒 SEGURIDAD" ;;
            perf) titulo="⚡ RENDIMIENTO" ;;
            docs) titulo="📚 DOCUMENTACIÓN" ;;
            style) titulo="💄 ESTILOS" ;;
            refactor) titulo="♻️ REFACTORIZACIÓN" ;;
            test) titulo="🧪 PRUEBAS" ;;
            chore) titulo="🔨 MANTENIMIENTO" ;;
        esac
        echo "   $titulo: $count commits"
    fi
done

echo ""
echo "💡 Próximos pasos:"
echo "   1. Revisar el archivo $CHANGELOG_HTML"
echo "   2. Si hay algún error, restaurar desde ${CHANGELOG_HTML}.backup"
echo "   3. Hacer commit de los cambios:"
echo "      git add $CHANGELOG_HTML && git commit -m 'docs: Actualizar changelog a $NUEVA_VERSION'"
echo "   4. Push al repositorio"
echo ""

# Limpiar
rm -f "$TEMP_FILE" "$TEMP_HTML" "$TEMP_COMMITS".*

exit 0
