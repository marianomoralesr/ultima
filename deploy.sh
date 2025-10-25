#!/bin/bash

# TREFA Cloud Run Deployment Script
# This script builds and deploys the application to Google Cloud Run
# Usage: ./deploy.sh [staging|production]

set -e  # Exit on error

# === Configuration ===
ENVIRONMENT=${1:-staging}  # Default to staging if not specified
PROJECT_ID="trefa-web-apis-1731136641165"
REGION="us-central1"
REPOSITORY="marianomoralesr"
IMAGE_NAME="app"

# Staging domain (set this to your custom domain or leave empty for Cloud Run URL)
STAGING_DOMAIN="${STAGING_DOMAIN:-}"  # e.g., "https://staging.trefa.mx"

# Set service name and image tag based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    SERVICE_NAME="app"
    IMAGE_TAG="production"
    FRONTEND_URL_OVERRIDE="https://trefa.mx"
else
    SERVICE_NAME="app-staging"
    IMAGE_TAG="staging"
    FRONTEND_URL_OVERRIDE="$STAGING_DOMAIN"  # Use custom staging domain if set
fi

IMAGE_URL="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:$IMAGE_TAG"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   TREFA Cloud Run Deployment Script          ║${NC}"
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${YELLOW}Environment: ${NC}${GREEN}$ENVIRONMENT${NC}"
echo -e "${YELLOW}Service Name: ${NC}${GREEN}$SERVICE_NAME${NC}"
echo -e "${YELLOW}Image Tag: ${NC}${GREEN}$IMAGE_TAG${NC}"
if [ ! -z "$FRONTEND_URL_OVERRIDE" ]; then
    echo -e "${YELLOW}Frontend URL: ${NC}${GREEN}$FRONTEND_URL_OVERRIDE${NC}"
else
    echo -e "${YELLOW}Frontend URL: ${NC}${GREEN}[Will use Cloud Run URL]${NC}"
fi
echo ""

# Confirm production deployment
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${RED}⚠️  WARNING: You are about to deploy to PRODUCTION!${NC}"
    echo -e "${YELLOW}This will update the live site at https://trefa.mx${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
fi
echo ""

# === Step 1: Verify Prerequisites ===
echo -e "${YELLOW}[1/5] Verifying prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}✗ gcloud CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites verified${NC}"
echo ""

# === Step 2: Set GCloud Project ===
echo -e "${YELLOW}[2/5] Setting GCloud project...${NC}"
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✓ Project set to: $PROJECT_ID${NC}"
echo ""

# === Step 3: Build Docker Image ===
echo -e "${YELLOW}[3/5] Building Docker image...${NC}"

# Read build-time credentials from cloud-build-vars.yaml
VITE_SUPABASE_URL=$(grep "VITE_SUPABASE_URL:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_SUPABASE_ANON_KEY=$(grep "VITE_SUPABASE_ANON_KEY:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_INTELIMOTOR_BUSINESS_UNIT_ID=$(grep "VITE_INTELIMOTOR_BUSINESS_UNIT_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_INTELIMOTOR_API_KEY=$(grep "VITE_INTELIMOTOR_API_KEY:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_INTELIMOTOR_API_SECRET=$(grep "VITE_INTELIMOTOR_API_SECRET:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_AIRTABLE_VALUATION_API_KEY=$(grep "VITE_AIRTABLE_VALUATION_API_KEY:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_AIRTABLE_VALUATION_BASE_ID=$(grep "VITE_AIRTABLE_VALUATION_BASE_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_AIRTABLE_VALUATION_TABLE_ID=$(grep "VITE_AIRTABLE_VALUATION_TABLE_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_AIRTABLE_VALUATION_VIEW=$(grep "VITE_AIRTABLE_VALUATION_VIEW:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID=$(grep "VITE_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_AIRTABLE_LEAD_CAPTURE_API_KEY=$(grep "VITE_AIRTABLE_LEAD_CAPTURE_API_KEY:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_AIRTABLE_LEAD_CAPTURE_BASE_ID=$(grep "VITE_AIRTABLE_LEAD_CAPTURE_BASE_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_AIRTABLE_LEAD_CAPTURE_TABLE_ID=$(grep "VITE_AIRTABLE_LEAD_CAPTURE_TABLE_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_IMAGE_CDN_URL=$(grep "VITE_IMAGE_CDN_URL:" cloud-build-vars.yaml | cut -d'"' -f2)
VITE_CLOUDFLARE_R2_PUBLIC_URL=$(grep "VITE_CLOUDFLARE_R2_PUBLIC_URL:" cloud-build-vars.yaml | cut -d'"' -f2)

# Get git commit hash and build date
VITE_GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VITE_BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Building with:"
echo "  - VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
echo "  - VITE_INTELIMOTOR_BUSINESS_UNIT_ID: $VITE_INTELIMOTOR_BUSINESS_UNIT_ID"
echo "  - VITE_IMAGE_CDN_URL: $VITE_IMAGE_CDN_URL"
echo "  - VITE_CLOUDFLARE_R2_PUBLIC_URL: $VITE_CLOUDFLARE_R2_PUBLIC_URL"
echo "  - VITE_GIT_COMMIT: $VITE_GIT_COMMIT"
echo "  - VITE_BUILD_DATE: $VITE_BUILD_DATE"
echo "  - Image URL: $IMAGE_URL"

docker build \
  --platform linux/amd64 \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  --build-arg VITE_GIT_COMMIT="$VITE_GIT_COMMIT" \
  --build-arg VITE_BUILD_DATE="$VITE_BUILD_DATE" \
  --build-arg VITE_INTELIMOTOR_BUSINESS_UNIT_ID="$VITE_INTELIMOTOR_BUSINESS_UNIT_ID" \
  --build-arg VITE_INTELIMOTOR_API_KEY="$VITE_INTELIMOTOR_API_KEY" \
  --build-arg VITE_INTELIMOTOR_API_SECRET="$VITE_INTELIMOTOR_API_SECRET" \
  --build-arg VITE_AIRTABLE_VALUATION_API_KEY="$VITE_AIRTABLE_VALUATION_API_KEY" \
  --build-arg VITE_AIRTABLE_VALUATION_BASE_ID="$VITE_AIRTABLE_VALUATION_BASE_ID" \
  --build-arg VITE_AIRTABLE_VALUATION_TABLE_ID="$VITE_AIRTABLE_VALUATION_TABLE_ID" \
  --build-arg VITE_AIRTABLE_VALUATION_VIEW="$VITE_AIRTABLE_VALUATION_VIEW" \
  --build-arg VITE_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID="$VITE_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID" \
  --build-arg VITE_AIRTABLE_LEAD_CAPTURE_API_KEY="$VITE_AIRTABLE_LEAD_CAPTURE_API_KEY" \
  --build-arg VITE_AIRTABLE_LEAD_CAPTURE_BASE_ID="$VITE_AIRTABLE_LEAD_CAPTURE_BASE_ID" \
  --build-arg VITE_AIRTABLE_LEAD_CAPTURE_TABLE_ID="$VITE_AIRTABLE_LEAD_CAPTURE_TABLE_ID" \
  --build-arg VITE_IMAGE_CDN_URL="$VITE_IMAGE_CDN_URL" \
  --build-arg VITE_CLOUDFLARE_R2_PUBLIC_URL="$VITE_CLOUDFLARE_R2_PUBLIC_URL" \
  -t $IMAGE_URL \
  .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi
echo ""

# === Step 4: Push to Artifact Registry ===
echo -e "${YELLOW}[4/5] Pushing image to Artifact Registry...${NC}"

# Configure Docker auth for Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

echo "Pushing image to: $IMAGE_URL"
docker push $IMAGE_URL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Image pushed successfully${NC}"
else
    echo -e "${RED}✗ Image push failed${NC}"
    exit 1
fi
echo ""

# === Step 5: Deploy to Cloud Run ===
echo -e "${YELLOW}[5/5] Deploying to Cloud Run...${NC}"

# Read all environment variables from cloud-build-vars.yaml
ENV_VARS=""

# Function to add env var from YAML
add_env_var() {
    local key=$1
    local value=$(grep "^$key:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\(.*\)"$/\1/')
    if [ ! -z "$value" ]; then
        if [ -z "$ENV_VARS" ]; then
            ENV_VARS="$key=$value"
        else
            ENV_VARS="$ENV_VARS,$key=$value"
        fi
    fi
}

# Override FRONTEND_URL for staging to use Cloud Run URL
if [ "$ENVIRONMENT" = "staging" ]; then
    # We'll set this after deployment when we get the URL
    FRONTEND_URL_OVERRIDE=""
else
    FRONTEND_URL_OVERRIDE="https://trefa.mx"
fi

# Add all environment variables
if [ ! -z "$FRONTEND_URL_OVERRIDE" ]; then
    # Production: Use custom domain
    ENV_VARS="FRONTEND_URL=$FRONTEND_URL_OVERRIDE"
else
    # Staging: Will use Cloud Run URL (set after deployment)
    add_env_var "FRONTEND_URL"
fi
add_env_var "CLOUD_RUN_URL"
add_env_var "SUPABASE_URL"
add_env_var "VITE_SUPABASE_URL"
add_env_var "VITE_SUPABASE_ANON_KEY"
add_env_var "AIRTABLE_VALUATION_API_KEY"
add_env_var "AIRTABLE_VALUATION_BASE_ID"
add_env_var "AIRTABLE_VALUATION_TABLE_ID"
add_env_var "AIRTABLE_VALUATION_VIEW"
add_env_var "AIRTABLE_VALUATIONS_STORAGE_TABLE_ID"
add_env_var "AIRTABLE_LEAD_CAPTURE_API_KEY"
add_env_var "AIRTABLE_LEAD_CAPTURE_BASE_ID"
add_env_var "AIRTABLE_LEAD_CAPTURE_TABLE_ID"
add_env_var "VITE_INTELIMOTOR_BUSINESS_UNIT_ID"
add_env_var "VITE_INTELIMOTOR_API_KEY"
add_env_var "VITE_INTELIMOTOR_API_SECRET"
add_env_var "CAR_STUDIO_API_KEY"
add_env_var "LEAD_CONNECTOR_WEBHOOK_URL"
add_env_var "LANDING_WEBHOOK_URL"
add_env_var "APPLICATION_WEBHOOK_URL"
add_env_var "PROXY_URL"
add_env_var "CALENDLY_URL_MTY"
add_env_var "CALENDLY_URL_TMPS"
add_env_var "CALENDLY_URL_COAH"
add_env_var "CALENDLY_URL_GPE"

echo "Deploying service: $SERVICE_NAME"
echo "Region: $REGION"

gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_URL \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=4 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --set-env-vars="$ENV_VARS"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          DEPLOYMENT SUCCESSFUL! 🎉            ║${NC}"
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo ""

    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
    echo -e "Service URL: ${GREEN}$SERVICE_URL${NC}"
    echo ""

    # Update FRONTEND_URL for staging if needed
    if [ "$ENVIRONMENT" = "staging" ] && [ -z "$FRONTEND_URL_OVERRIDE" ]; then
        echo -e "${YELLOW}Updating staging FRONTEND_URL to Cloud Run URL...${NC}"
        gcloud run services update $SERVICE_NAME \
            --region=$REGION \
            --update-env-vars="FRONTEND_URL=$SERVICE_URL" \
            --quiet
        echo -e "${GREEN}✓ FRONTEND_URL updated${NC}"
        echo ""
    fi

    # Environment-specific next steps
    if [ "$ENVIRONMENT" = "staging" ]; then
        echo "✨ STAGING DEPLOYMENT COMPLETE"
        echo ""
        echo "Test the fixes:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "1. Health check:"
        echo "   curl $SERVICE_URL/healthz"
        echo ""
        echo "2. Test CORS headers:"
        echo "   curl -I $SERVICE_URL"
        echo ""
        echo "3. Test Explorar page (mobile):"
        echo "   ${GREEN}$SERVICE_URL/explorar${NC}"
        echo ""
        echo "4. Test Application flow:"
        echo "   ${GREEN}$SERVICE_URL/escritorio/aplicacion${NC}"
        echo ""
        echo "5. Monitor logs:"
        echo "   gcloud run logs tail $SERVICE_NAME --region=$REGION"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo -e "${GREEN}If everything looks good, deploy to production:${NC}"
        echo -e "${YELLOW}./deploy.sh production${NC}"
    else
        echo "✨ PRODUCTION DEPLOYMENT COMPLETE"
        echo ""
        echo "Verify the deployment:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "1. Health check:"
        echo "   curl https://trefa.mx/healthz"
        echo ""
        echo "2. Visit main site:"
        echo "   ${GREEN}https://trefa.mx${NC}"
        echo ""
        echo "3. Test Explorar page on mobile:"
        echo "   ${GREEN}https://trefa.mx/explorar${NC}"
        echo ""
        echo "4. Test Application flow:"
        echo "   ${GREEN}https://trefa.mx/escritorio/aplicacion${NC}"
        echo ""
        echo "5. Monitor logs:"
        echo "   gcloud run logs tail $SERVICE_NAME --region=$REGION"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo -e "${YELLOW}⚠️  Remember to:${NC}"
        echo "- Clear browser cache (Cmd+Shift+Delete)"
        echo "- Test in incognito mode"
        echo "- Hard refresh (Cmd+Shift+R) if needed"
    fi
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
