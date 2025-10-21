#!/bin/bash

# TREFA Git Repository Setup Script
# This script initializes git with best practices for the project

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   TREFA Git Repository Setup                 ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install git first.${NC}"
    exit 1
fi

# Check if already initialized
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git repository already initialized${NC}"
    read -p "Do you want to continue anyway? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
else
    echo -e "${GREEN}✓ Initializing git repository...${NC}"
    git init
fi

# Create/update .gitignore
echo -e "${GREEN}✓ Creating .gitignore...${NC}"
cat > .gitignore << 'EOF'
# Environment variables and secrets
.env
.env.local
.env.production
.env.staging
cloud-build-vars.yaml

# Dependencies
node_modules/
server/node_modules/

# Build outputs
dist/
build/
.vite/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Test coverage
coverage/

# Temporary files
*.tmp
.cache/

# Docker
.dockerignore

# Local development
.local/
EOF

echo -e "${GREEN}✓ .gitignore created${NC}"

# Configure git user if not set
if [ -z "$(git config user.name)" ]; then
    echo ""
    echo -e "${YELLOW}Git user not configured. Please set up your identity:${NC}"
    read -p "Your name: " git_name
    read -p "Your email: " git_email
    git config user.name "$git_name"
    git config user.email "$git_email"
    echo -e "${GREEN}✓ Git identity configured${NC}"
fi

# Initial commit
if ! git rev-parse HEAD &> /dev/null; then
    echo ""
    echo -e "${GREEN}✓ Creating initial commit...${NC}"
    git add .
    git commit -m "Initial commit: TREFA application baseline

This commit establishes the baseline for the TREFA auto inventory platform:

Features:
- React + TypeScript frontend with Vite
- Express.js backend server
- Supabase database integration
- Airtable sync functionality
- Vehicle inventory management
- Financing application system
- Admin dashboard
- Automated version tracking (beta-<git-hash>)
- Docker deployment configuration
- Cloud Run deployment scripts

Infrastructure:
- Multi-stage Docker build
- Staging and production environments
- Organized documentation in docs/
- Comprehensive deployment guides

This is a known-good state that can be used as a rollback point."

    echo -e "${GREEN}✓ Initial commit created${NC}"

    # Get the commit hash for reference
    COMMIT_HASH=$(git rev-parse --short HEAD)
    echo ""
    echo -e "${GREEN}📝 Initial commit hash: ${COMMIT_HASH}${NC}"
    echo -e "${YELLOW}💡 This will be your version: beta-${COMMIT_HASH}${NC}"
else
    echo -e "${YELLOW}ℹ️  Repository already has commits${NC}"
    COMMIT_HASH=$(git rev-parse --short HEAD)
    echo -e "${GREEN}📝 Current commit hash: ${COMMIT_HASH}${NC}"
fi

# Create branches
echo ""
echo -e "${GREEN}✓ Setting up branch structure...${NC}"

# Rename master to main if needed (modern convention)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "master" ]; then
    read -p "Rename 'master' to 'main' (recommended)? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy]es$ ]]; then
        git branch -m master main
        echo -e "${GREEN}✓ Branch renamed to 'main'${NC}"
        CURRENT_BRANCH="main"
    fi
fi

# Create develop branch if it doesn't exist
if ! git show-ref --verify --quiet refs/heads/develop; then
    git branch develop
    echo -e "${GREEN}✓ Created 'develop' branch${NC}"
else
    echo -e "${YELLOW}ℹ️  'develop' branch already exists${NC}"
fi

# Tag this as the baseline
BASELINE_TAG="baseline-$(date +%Y%m%d)"
if ! git tag -l | grep -q "$BASELINE_TAG"; then
    git tag -a "$BASELINE_TAG" -m "Baseline: Initial working state $(date +%Y-%m-%d)"
    echo -e "${GREEN}✓ Created baseline tag: $BASELINE_TAG${NC}"
fi

# Set up remote (optional)
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Optional: Set up remote repository${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
read -p "Do you want to add a remote repository? (yes/no): " -r
if [[ $REPLY =~ ^[Yy]es$ ]]; then
    read -p "Remote repository URL (e.g., git@github.com:user/repo.git): " remote_url

    if git remote | grep -q "origin"; then
        echo -e "${YELLOW}⚠️  'origin' remote already exists${NC}"
        git remote set-url origin "$remote_url"
        echo -e "${GREEN}✓ Updated remote origin${NC}"
    else
        git remote add origin "$remote_url"
        echo -e "${GREEN}✓ Added remote origin${NC}"
    fi

    read -p "Push to remote now? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy]es$ ]]; then
        git push -u origin $CURRENT_BRANCH
        git push -u origin develop
        git push --tags
        echo -e "${GREEN}✓ Pushed to remote${NC}"
    fi
fi

# Summary
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Git Setup Complete! ✨                      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Branch Structure:${NC}"
echo -e "  • ${GREEN}${CURRENT_BRANCH}${NC} - Production-ready code"
echo -e "  • ${GREEN}develop${NC} - Integration branch for new features"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo ""
echo -e "1. ${YELLOW}Start a new feature:${NC}"
echo -e "   git checkout develop"
echo -e "   git checkout -b feature/your-feature-name"
echo ""
echo -e "2. ${YELLOW}Deploy to staging:${NC}"
echo -e "   git checkout develop"
echo -e "   ./docs/deployment/deploy.sh staging"
echo ""
echo -e "3. ${YELLOW}Deploy to production (after staging tests):${NC}"
echo -e "   git checkout ${CURRENT_BRANCH}"
echo -e "   git merge develop --no-ff"
echo -e "   git tag -a v1.0.\$(date +%Y%m%d) -m 'Production release'"
echo -e "   ./docs/deployment/deploy.sh production"
echo ""
echo -e "${GREEN}📚 Read the full guide:${NC}"
echo -e "   docs/guides/GIT_WORKFLOW_GUIDE.md"
echo ""
echo -e "${GREEN}Current version: beta-${COMMIT_HASH}${NC}"
echo ""
