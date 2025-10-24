#!/bin/bash
# Test script for R2 upload edge function

# Test with a small placeholder image URL from Airtable
curl -X POST \
  "https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/r2-upload" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5OTYwMywiZXhwIjoyMDU5Nzc1NjAzfQ.KwSFEXOrtgwgIjMVG-czB73VWQIVDahgDvTdyL5qSQo" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5OTYwMywiZXhwIjoyMDU5Nzc1NjAzfQ.KwSFEXOrtgwgIjMVG-czB73VWQIVDahgDvTdyL5qSQo" \
  -d '{
    "path": "airtable/test/feature_image/test-image.jpg",
    "fileUrl": "https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/app/suv-2Artboard-12-trefa.png",
    "contentType": "image/png"
  }' | jq .
