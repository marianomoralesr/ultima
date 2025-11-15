#!/bin/bash

# Sync all existing applications to Google Sheets using cURL
# This script fetches applications from the database and calls the Edge Function for each

SUPABASE_URL="https://jjepfehmuybpctdzipnu.supabase.co"
SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "⚠️  Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set"
  echo ""
  echo "Please get your service role key from:"
  echo "https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/api"
  echo ""
  echo "Then run:"
  echo "export SUPABASE_SERVICE_ROLE_KEY='your-key-here'"
  echo "./sync-applications-curl.sh"
  exit 1
fi

echo "🔍 Fetching all submitted applications..."
echo ""

# Fetch all submitted applications
APPLICATIONS=$(curl -s "$SUPABASE_URL/rest/v1/financing_applications?status=in.(submitted,reviewing,pending_docs,approved,rejected)&select=*&order=created_at.asc" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY")

# Count applications
COUNT=$(echo "$APPLICATIONS" | jq '. | length')

if [ "$COUNT" = "0" ] || [ -z "$COUNT" ]; then
  echo "No applications found to sync."
  exit 0
fi

echo "Found $COUNT applications to sync."
echo ""

SUCCESS=0
FAILED=0

# Process each application
echo "$APPLICATIONS" | jq -c '.[]' | while read -r app; do
  APP_ID=$(echo "$app" | jq -r '.id')
  APP_STATUS=$(echo "$app" | jq -r '.status')

  echo "Syncing application $APP_ID ($APP_STATUS)..."

  # Call the google-sheets-sync Edge Function
  RESPONSE=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/google-sheets-sync" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -d "{\"record\": $app}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ Success"
    ((SUCCESS++))
  else
    echo "  ❌ Failed (HTTP $HTTP_CODE): $BODY"
    ((FAILED++))
  fi

  # Small delay to avoid rate limiting
  sleep 0.5
done

echo ""
echo "📊 Summary:"
echo "  ✅ Successfully synced: $SUCCESS"
echo "  ❌ Failed: $FAILED"
echo "  📈 Total: $COUNT"
