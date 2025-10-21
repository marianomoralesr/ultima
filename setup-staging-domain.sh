#!/bin/bash

# TREFA Staging Domain Setup Script
# This script helps you map a custom domain to the staging environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_ID="trefa-web-apis-1731136641165"
SERVICE_NAME="app-staging"
REGION="us-central1"
STAGING_DOMAIN="staging.trefa.mx"

echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   TREFA Staging Domain Setup                  ║${NC}"
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo ""

# Check if staging service exists
echo -e "${YELLOW}Checking if staging service exists...${NC}"
if ! gcloud run services describe $SERVICE_NAME --region=$REGION &>/dev/null; then
    echo -e "${RED}✗ Staging service ($SERVICE_NAME) does not exist yet.${NC}"
    echo "Please deploy to staging first:"
    echo "  ./deploy.sh staging"
    exit 1
fi
echo -e "${GREEN}✓ Staging service exists${NC}"
echo ""

# Step 1: Create domain mapping
echo -e "${YELLOW}[1/3] Creating domain mapping for $STAGING_DOMAIN...${NC}"
echo ""

if gcloud run domain-mappings describe --domain=$STAGING_DOMAIN --region=$REGION &>/dev/null; then
    echo -e "${YELLOW}⚠️  Domain mapping already exists${NC}"
    echo "Current status:"
    gcloud run domain-mappings describe --domain=$STAGING_DOMAIN --region=$REGION
else
    echo "Creating domain mapping..."
    gcloud run domain-mappings create \
        --service=$SERVICE_NAME \
        --domain=$STAGING_DOMAIN \
        --region=$REGION \
        --platform=managed

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Domain mapping created${NC}"
    else
        echo -e "${RED}✗ Failed to create domain mapping${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   NEXT STEPS                                  ║${NC}"
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo ""

# Step 2: DNS Configuration
echo -e "${YELLOW}[2/3] Configure DNS${NC}"
echo ""
echo "Add this DNS record to your DNS provider:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}Name:${NC}   staging"
echo -e "  ${GREEN}Type:${NC}   CNAME"
echo -e "  ${GREEN}Value:${NC}  ghs.googlehosted.com"
echo -e "  ${GREEN}TTL:${NC}    Auto (or 1 hour)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "For Cloudflare:"
echo "  1. Go to DNS dashboard"
echo "  2. Add CNAME record"
echo "  3. Set Proxy status to 'DNS only' (gray cloud)"
echo ""
echo "Wait 5-30 minutes for DNS to propagate."
echo "Check with: ${YELLOW}dig $STAGING_DOMAIN${NC}"
echo ""

# Step 3: Wait for SSL
echo -e "${YELLOW}[3/3] Wait for SSL Certificate${NC}"
echo ""
echo "After DNS propagates, Cloud Run will provision SSL automatically."
echo "Check status with:"
echo -e "  ${YELLOW}gcloud run domain-mappings describe --domain=$STAGING_DOMAIN --region=$REGION${NC}"
echo ""
echo "Look for: certificateStatus: ACTIVE"
echo ""

# Step 4: Re-deploy staging
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   AFTER DNS & SSL ARE READY                   ║${NC}"
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo ""
echo "1. Re-deploy staging with the custom domain:"
echo -e "   ${YELLOW}STAGING_DOMAIN=https://$STAGING_DOMAIN ./deploy.sh staging${NC}"
echo ""
echo "2. Add to Supabase Dashboard:"
echo "   → Settings → API → Site URL"
echo "   → Authentication → URL Configuration"
echo -e "   Add: ${GREEN}https://$STAGING_DOMAIN${NC}"
echo ""
echo "3. Test the deployment:"
echo -e "   ${GREEN}https://$STAGING_DOMAIN/healthz${NC}"
echo -e "   ${GREEN}https://$STAGING_DOMAIN/explorar${NC}"
echo ""

# Offer to check DNS status
echo -e "${YELLOW}Would you like to check DNS status now? (y/n)${NC}"
read -r CHECK_DNS

if [[ $CHECK_DNS =~ ^[Yy]$ ]]; then
    echo ""
    echo "Checking DNS for $STAGING_DOMAIN..."
    dig $STAGING_DOMAIN +short
    echo ""

    # Check if DNS is configured
    if dig $STAGING_DOMAIN +short | grep -q "ghs.googlehosted.com"; then
        echo -e "${GREEN}✓ DNS is configured correctly!${NC}"
        echo ""
        echo "SSL certificate should be ready in a few minutes."
        echo "Check with:"
        echo "  gcloud run domain-mappings describe --domain=$STAGING_DOMAIN --region=$REGION"
    else
        echo -e "${YELLOW}⚠️  DNS not yet configured or not propagated${NC}"
        echo "Add the CNAME record and wait a few minutes."
    fi
fi

echo ""
echo -e "${GREEN}Setup script completed!${NC}"
