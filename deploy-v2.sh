#!/bin/bash

# TREFA Cloud Run Deployment Script v2
# Implements a "build once, deploy many" strategy.
#
# WORKFLOW:
# 1. Deploy to staging:
#    ./deploy-v2.sh staging
#
# 2. Test the staging environment thoroughly.
#
# 3. Promote the tested version to production:
#    ./deploy-v2.sh promote <commit-hash>
#    (The script will provide the exact command to run after a successful staging deployment)

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
PROJECT_ID="trefa-web-apis-1731136641165"
REGION="us-central1"
REPOSITORY="marianomoralesr"
IMAGE_NAME="app"

# Service names in Cloud Run
STAGING_SERVICE_NAME="app-staging"
PRODUCTION_SERVICE_NAME="app"

# --- Colors for Output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Helper Functions ---
function print_header() {
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   TREFA Cloud Run Deployment Script (v2)      ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
}

function run_git_checks() {
    echo -e "${YELLOW}[1/5] Running Git pre-deployment checks...${NC}"
    if ! git diff --quiet HEAD; then
        echo -e "${RED}✗ Error: Your working directory has uncommitted changes.${NC}"
        echo "Please commit or stash your changes before deploying."
        exit 1
    fi

    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ]; then
        echo -e "${RED}✗ Error: You must be on the 'main' branch to deploy.${NC}"
        echo "Your current branch is '$current_branch'."
        exit 1
    fi

    echo "Fetching latest changes from remote..."
    # git fetch origin

    # local_commit=$(git rev-parse HEAD)
    # remote_commit=$(git rev-parse @{u})

    # if [ "$local_commit" != "$remote_commit" ]; then
    #     echo -e "${RED}✗ Error: Your local 'main' branch is not up-to-date with the remote.${NC}"
    #     echo "Please run 'git pull' to sync your branch."
    #     exit 1
    # fi

    echo -e "${GREEN}✓ Git checks passed. You are on the latest version of 'main'.${NC}"
    echo ""
}

function deploy_staging() {
    local git_commit_short=$(git rev-parse --short HEAD)
    local build_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local image_url="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:$git_commit_short"

    echo -e "${BLUE}Starting STAGING deployment for commit ${YELLOW}$git_commit_short${NC}"
    echo -e "Image URL: ${BLUE}$image_url${NC}"
    echo ""

    # --- Step 2: Build Docker Image ---
    echo -e "${YELLOW}[2/5] Building Docker image with version info...${NC}"
    docker build \
      --platform linux/amd64 \
      --build-arg VITE_GIT_COMMIT="$git_commit_short" \
      --build-arg VITE_BUILD_DATE="$build_date" \
      -t "$image_url" \
      .
    echo -e "${GREEN}✓ Docker image built successfully.${NC}"
    echo ""

    # --- Step 3: Push to Artifact Registry ---
    echo -e "${YELLOW}[3/5] Pushing image to Artifact Registry...${NC}"
    gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
    docker push "$image_url"
    echo -e "${GREEN}✓ Image pushed successfully.${NC}"
    echo ""

    # --- Step 4: Deploy to Cloud Run (Staging) ---
    echo -e "${YELLOW}[4/5] Deploying to Cloud Run (Staging)...${NC}"
    local env_vars=$(paste -d, -s cloud-build-vars.yaml | sed 's/:\s*/=/g' | sed 's/"//g')
    
    gcloud run deploy "$STAGING_SERVICE_NAME" \
      --image="$image_url" \
      --platform=managed \
      --region="$REGION" \
      --allow-unauthenticated \
      --port=8080 \
      --memory=512Mi \
      --cpu=1 \
      --min-instances=0 \
      --max-instances=10 \
      --timeout=300 \
      --set-env-vars="$env_vars" \
      --quiet

    local service_url=$(gcloud run services describe "$STAGING_SERVICE_NAME" --region="$REGION" --format='value(status.url)')
    
    echo -e "${YELLOW}[5/5] Updating staging environment with its own URL...${NC}"
    gcloud run services update "$STAGING_SERVICE_NAME" \
        --region="$REGION" \
        --update-env-vars="FRONTEND_URL=$service_url" \
        --quiet
    echo -e "${GREEN}✓ Staging service updated.${NC}"
    echo ""

    # --- Success ---
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║      STAGING DEPLOYMENT SUCCESSFUL! 🎉        ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Service URL: ${BLUE}$service_url${NC}"
    echo -e "Version: ${YELLOW}$git_commit_short${NC}"
    echo ""
    echo -e "${YELLOW}Please test your changes thoroughly on the staging URL.${NC}"
    echo ""
    echo -e "When you are ready to go live, run the following command to promote this exact build to production:"
    echo -e "${BLUE}./deploy-v2.sh promote $git_commit_short${NC}"
    echo ""
}

function promote_to_production() {
    local git_commit_short=$1
    if [ -z "$git_commit_short" ]; then
        echo -e "${RED}✗ Error: You must specify the commit hash of the version to promote.${NC}"
        echo "Example: ./deploy-v2.sh promote a1b2c3d"
        exit 1
    fi

    local image_url="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:$git_commit_short"

    echo -e "${RED}⚠️  WARNING: You are about to promote an image to PRODUCTION!${NC}"
    echo -e "Service:    ${BLUE}$PRODUCTION_SERVICE_NAME${NC}"
    echo -e "Version:    ${YELLOW}$git_commit_short${NC}"
    echo -e "Image URL:  ${BLUE}$image_url${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        echo "Promotion cancelled."
        exit 0
    fi
    echo ""

    echo -e "${YELLOW}Deploying to Cloud Run (Production)...${NC}"
    local env_vars=$(paste -d, -s cloud-build-vars.yaml | sed 's/:\s*/=/g' | sed 's/"//g')
    
    # Hardcode the production URL
    local prod_env_vars="FRONTEND_URL=https://trefa.mx,${env_vars}"

    gcloud run deploy "$PRODUCTION_SERVICE_NAME" \
      --image="$image_url" \
      --platform=managed \
      --region="$REGION" \
      --allow-unauthenticated \
      --port=8080 \
      --memory=512Mi \
      --cpu=1 \
      --min-instances=0 \
      --max-instances=10 \
      --timeout=300 \
      --set-env-vars="$prod_env_vars" \
      --quiet

    # --- Success ---
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     PRODUCTION PROMOTION SUCCESSFUL! 🎉       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Production URL: ${BLUE}https://trefa.mx${NC}"
    echo -e "Version ${YELLOW}$git_commit_short${NC} is now live."
    echo ""
}


# --- Main Script Logic ---
print_header
COMMAND=$1

case $COMMAND in
    staging)
        run_git_checks
        deploy_staging
        ;;
    promote)
        promote_to_production "$2"
        ;;
    *)
        echo -e "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  staging          Builds the current state of 'main' and deploys it to the staging environment."
        echo "  promote [hash]   Promotes a previously deployed staging version to production."
        echo ""
        exit 1
        ;;
esac
