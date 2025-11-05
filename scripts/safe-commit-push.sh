#!/bin/bash

# Safe Commit and Push Script
# Ensures you commit and push changes safely without overwriting remote changes

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Safe Git Commit & Push                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# === Step 1: Run git safety check ===
echo -e "${YELLOW}[1/5] Ejecutando verificaciones de seguridad...${NC}"
if [ -f "./scripts/git-safety-check.sh" ]; then
    ./scripts/git-safety-check.sh
    GIT_CHECK_EXIT=$?

    if [ $GIT_CHECK_EXIT -ne 0 ]; then
        echo ""
        echo -e "${RED}✗ Git safety check falló${NC}"
        echo -e "${RED}  Resuelve los problemas primero${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Git safety check script no encontrado${NC}"
    exit 1
fi
echo ""

# === Step 2: Check for changes to commit ===
echo -e "${YELLOW}[2/5] Verificando cambios...${NC}"

# Check for modified files
MODIFIED=$(git diff --name-only | wc -l | tr -d ' ')
# Check for staged files
STAGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
# Check for untracked files
UNTRACKED=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')

TOTAL_CHANGES=$((MODIFIED + STAGED + UNTRACKED))

if [ "$TOTAL_CHANGES" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No hay cambios para hacer commit${NC}"
    echo ""
    read -p "¿Quieres hacer push de commits existentes? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy]es$ ]]; then
        SKIP_COMMIT=true
    else
        echo "Operación cancelada."
        exit 0
    fi
else
    SKIP_COMMIT=false
    echo -e "${GREEN}✓ Cambios encontrados:${NC}"
    echo -e "  Modificados: $MODIFIED"
    echo -e "  Preparados: $STAGED"
    echo -e "  Sin seguimiento: $UNTRACKED"
    echo ""

    # Show changes
    echo -e "${YELLOW}Archivos modificados:${NC}"
    git status --short
    echo ""
fi

# === Step 3: Create commit (if needed) ===
if [ "$SKIP_COMMIT" = false ]; then
    echo -e "${YELLOW}[3/5] Creando commit...${NC}"

    # Ask if user wants to stage all changes
    read -p "¿Agregar todos los cambios al commit? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy]es$ ]]; then
        git add -A
        echo -e "${GREEN}✓ Todos los cambios agregados${NC}"
    else
        echo -e "${YELLOW}Agrega manualmente los archivos que quieras:${NC}"
        echo -e "${YELLOW}  git add <archivo>${NC}"
        exit 0
    fi

    # Ask for commit message
    echo ""
    echo -e "${YELLOW}Ingresa el mensaje del commit:${NC}"
    read -p "> " COMMIT_MESSAGE

    if [ -z "$COMMIT_MESSAGE" ]; then
        echo -e "${RED}✗ El mensaje del commit no puede estar vacío${NC}"
        exit 1
    fi

    # Create commit
    git commit -m "$COMMIT_MESSAGE"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Commit creado exitosamente${NC}"
    else
        echo -e "${RED}✗ Error al crear commit${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}[3/5] Saltando creación de commit...${NC}"
fi
echo ""

# === Step 4: Pull latest changes before pushing ===
echo -e "${YELLOW}[4/5] Obteniendo últimos cambios del remoto...${NC}"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
REMOTE_BRANCH="origin/${CURRENT_BRANCH}"

# Check if remote branch exists
if git rev-parse --verify "$REMOTE_BRANCH" > /dev/null 2>&1; then
    echo -e "${YELLOW}Haciendo pull de ${REMOTE_BRANCH}...${NC}"

    # Try to pull with rebase to keep history clean
    git pull --rebase origin "$CURRENT_BRANCH"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Pull completado exitosamente${NC}"
    else
        echo -e "${RED}✗ Error durante pull${NC}"
        echo -e "${YELLOW}Puede haber conflictos que necesites resolver${NC}"
        echo ""
        echo -e "${YELLOW}Opciones:${NC}"
        echo -e "  1. Resolver conflictos: edita los archivos marcados"
        echo -e "  2. Continuar rebase: git rebase --continue"
        echo -e "  3. Abortar rebase: git rebase --abort"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Rama remota no existe (primera vez pushing esta rama)${NC}"
fi
echo ""

# === Step 5: Push to remote ===
echo -e "${YELLOW}[5/5] Haciendo push al remoto...${NC}"

# Check if this is the first push
if ! git rev-parse --verify "$REMOTE_BRANCH" > /dev/null 2>&1; then
    echo -e "${YELLOW}Primera vez haciendo push de esta rama${NC}"
    git push -u origin "$CURRENT_BRANCH"
else
    git push origin "$CURRENT_BRANCH"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          PUSH EXITOSO! 🎉                     ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✓ Cambios enviados a: ${REMOTE_BRANCH}${NC}"

    # Show last commit
    echo ""
    echo -e "${YELLOW}Último commit:${NC}"
    git log -1 --oneline --decorate
else
    echo -e "${RED}✗ Error al hacer push${NC}"
    echo -e "${YELLOW}Verifica tu conexión y permisos en el repositorio${NC}"
    exit 1
fi
echo ""

# === Summary ===
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Resumen${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Rama: ${CURRENT_BRANCH}${NC}"
echo -e "${GREEN}✓ Remoto: ${REMOTE_BRANCH}${NC}"
echo -e "${GREEN}✓ Estado: Sincronizado${NC}"
echo ""

# Suggest next steps
echo -e "${YELLOW}Siguientes pasos recomendados:${NC}"
echo -e "  - Ver cambios en GitHub/GitLab"
echo -e "  - Crear Pull Request (si aplica)"
echo -e "  - Deployment: ./deploy.sh [staging|production]"
