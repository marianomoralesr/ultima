#!/bin/bash

# Git Safety Check Script
# Verifies that your local repository is synchronized with remote
# and that it's safe to proceed with deployment or push

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo -e "${BLUE}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Git Safety Check                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# === Check 1: Are we in a git repository? ===
echo -e "${YELLOW}[1/8] Verificando repositorio Git...${NC}"
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}✗ No estás en un repositorio Git${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Repositorio Git detectado${NC}"
echo ""

# === Check 2: Get current branch ===
echo -e "${YELLOW}[2/8] Verificando rama actual...${NC}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${GREEN}✓ Rama actual: ${CURRENT_BRANCH}${NC}"
echo ""

# === Check 3: Check for uncommitted changes ===
echo -e "${YELLOW}[3/8] Verificando cambios sin commit...${NC}"
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}✗ Tienes cambios sin commit${NC}"
    echo ""
    echo -e "${YELLOW}Archivos modificados:${NC}"
    git status --short
    echo ""
    echo -e "${YELLOW}Opciones:${NC}"
    echo -e "  1. Hacer commit: git add . && git commit -m 'mensaje'"
    echo -e "  2. Descartar cambios: git checkout -- <archivo>"
    echo -e "  3. Guardar temporalmente: git stash"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ No hay cambios sin commit${NC}"
fi
echo ""

# === Check 4: Check for untracked files ===
echo -e "${YELLOW}[4/8] Verificando archivos sin seguimiento...${NC}"
UNTRACKED=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')
if [ "$UNTRACKED" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Tienes ${UNTRACKED} archivos sin seguimiento${NC}"
    echo ""
    echo -e "${YELLOW}Archivos sin seguimiento:${NC}"
    git ls-files --others --exclude-standard | head -10
    if [ "$UNTRACKED" -gt 10 ]; then
        echo -e "${YELLOW}... y $((UNTRACKED - 10)) más${NC}"
    fi
    echo ""
    echo -e "${YELLOW}Opciones:${NC}"
    echo -e "  1. Agregar al commit: git add <archivo>"
    echo -e "  2. Agregar a .gitignore si no son necesarios"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ No hay archivos sin seguimiento${NC}"
fi
echo ""

# === Check 5: Fetch latest from remote ===
echo -e "${YELLOW}[5/8] Obteniendo cambios del servidor remoto...${NC}"
git fetch origin > /dev/null 2>&1
echo -e "${GREEN}✓ Cambios remotos obtenidos${NC}"
echo ""

# === Check 6: Check if remote branch exists ===
echo -e "${YELLOW}[6/8] Verificando rama remota...${NC}"
REMOTE_BRANCH="origin/${CURRENT_BRANCH}"
if ! git rev-parse --verify "$REMOTE_BRANCH" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  La rama '${CURRENT_BRANCH}' no existe en el remoto${NC}"
    echo -e "${YELLOW}   Esta es una rama nueva local${NC}"
    echo -e "${YELLOW}   Primer push requerirá: git push -u origin ${CURRENT_BRANCH}${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ Rama remota encontrada: ${REMOTE_BRANCH}${NC}"
fi
echo ""

# === Check 7: Compare local vs remote (if remote exists) ===
if git rev-parse --verify "$REMOTE_BRANCH" > /dev/null 2>&1; then
    echo -e "${YELLOW}[7/8] Comparando con rama remota...${NC}"

    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse "$REMOTE_BRANCH")

    if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
        echo -e "${GREEN}✓ Tu rama está sincronizada con el remoto${NC}"
    else
        # Check if local is ahead
        AHEAD=$(git rev-list --count "$REMOTE_BRANCH..HEAD")
        # Check if local is behind
        BEHIND=$(git rev-list --count "HEAD..$REMOTE_BRANCH")

        if [ "$AHEAD" -gt 0 ] && [ "$BEHIND" -eq 0 ]; then
            echo -e "${GREEN}✓ Tu rama está ${AHEAD} commits adelante del remoto${NC}"
            echo -e "${GREEN}  Puedes hacer push de forma segura${NC}"
        elif [ "$BEHIND" -gt 0 ] && [ "$AHEAD" -eq 0 ]; then
            echo -e "${RED}✗ Tu rama está ${BEHIND} commits atrás del remoto${NC}"
            echo -e "${RED}  ¡DEBES hacer pull antes de continuar!${NC}"
            echo ""
            echo -e "${YELLOW}Ejecuta: git pull origin ${CURRENT_BRANCH}${NC}"
            ERRORS=$((ERRORS + 1))
        elif [ "$AHEAD" -gt 0 ] && [ "$BEHIND" -gt 0 ]; then
            echo -e "${RED}✗ Tu rama ha divergido del remoto${NC}"
            echo -e "${RED}  Adelante: ${AHEAD} commits | Atrás: ${BEHIND} commits${NC}"
            echo -e "${RED}  ¡Necesitas sincronizar antes de continuar!${NC}"
            echo ""
            echo -e "${YELLOW}Opciones:${NC}"
            echo -e "  1. Pull y merge: git pull origin ${CURRENT_BRANCH}"
            echo -e "  2. Pull y rebase: git pull --rebase origin ${CURRENT_BRANCH}"
            echo -e "  3. Ver diferencias: git log HEAD..${REMOTE_BRANCH}"
            ERRORS=$((ERRORS + 1))
        fi

        # Show recent commits on remote that are not local
        if [ "$BEHIND" -gt 0 ]; then
            echo ""
            echo -e "${YELLOW}Commits en el remoto que no tienes:${NC}"
            git log --oneline --graph --decorate HEAD.."$REMOTE_BRANCH" | head -5
        fi
    fi
else
    echo -e "${YELLOW}[7/8] Saltando comparación (rama nueva)${NC}"
fi
echo ""

# === Check 8: Check for merge conflicts ===
echo -e "${YELLOW}[8/8] Verificando conflictos de merge...${NC}"
CONFLICT_FILES=$(git ls-files -u | wc -l | tr -d ' ')
if [ "$CONFLICT_FILES" -gt 0 ]; then
    echo -e "${RED}✗ Tienes conflictos de merge sin resolver${NC}"
    echo ""
    echo -e "${YELLOW}Archivos con conflictos:${NC}"
    git diff --name-only --diff-filter=U
    echo ""
    echo -e "${YELLOW}Resuelve los conflictos antes de continuar${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ No hay conflictos de merge${NC}"
fi
echo ""

# === Summary ===
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Resumen de Verificación${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ TODO ESTÁ BIEN${NC}"
    echo -e "${GREEN}  Es seguro continuar con el deployment o push${NC}"
    exit 0
elif [ $ERRORS -eq 0 ] && [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} ADVERTENCIA(S)${NC}"
    echo -e "${YELLOW}  Puedes continuar, pero revisa las advertencias${NC}"
    exit 0
else
    echo -e "${RED}✗ ${ERRORS} ERROR(ES) ENCONTRADO(S)${NC}"
    echo -e "${RED}  NO ES SEGURO CONTINUAR${NC}"
    echo -e "${RED}  Resuelve los errores antes de hacer deployment o push${NC}"
    exit 1
fi
