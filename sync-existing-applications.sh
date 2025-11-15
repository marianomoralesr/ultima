#!/bin/bash

# Script to sync all existing applications to Google Sheets
# This uses the Deno script to call the Edge Function for each application

echo "🚀 Starting sync of existing applications to Google Sheets..."
echo ""

# Check if SUPABASE_SERVICE_ROLE_KEY is set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️  SUPABASE_SERVICE_ROLE_KEY environment variable not set."
  echo "Please set it before running this script:"
  echo ""
  echo "export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
  echo ""
  echo "You can find your service role key in the Supabase dashboard:"
  echo "https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/api"
  exit 1
fi

# Run the Deno script
deno run --allow-net --allow-env sync-existing-applications.ts

echo ""
echo "✅ Sync complete!"
