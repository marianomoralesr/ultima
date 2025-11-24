# Airtable Webhook Setup Guide

## Overview

This guide walks you through setting up real-time sync between Airtable and Supabase using webhooks. When a vehicle record is created or updated in Airtable, it will automatically sync to your `inventario_cache` table in Supabase.

## Architecture

```
Airtable (Inventario Table)
    ↓ (webhook trigger on record change)
Airtable Automation Script
    ↓ (sends recordId)
Supabase Edge Function (airtable-sync)
    ↓ (fetches full record from Airtable)
    ↓ (normalizes data)
Supabase Database (inventario_cache table)
```

## Prerequisites

✅ Airtable account with access to the Inventario base
✅ Supabase project deployed
✅ Edge function `airtable-sync` deployed (already done!)

## Step 1: Set Environment Variables in Supabase

1. Go to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/functions

2. Add these secrets:
   - `AIRTABLE_API_KEY`: Your Airtable Personal Access Token
   - `AIRTABLE_BASE_ID`: `appbOPKYqQRW2HgyB` (already set as default)
   - `AIRTABLE_TABLE_ID`: `tblOjECDJDZlNv8At` (already set as default)

### How to Get Your Airtable API Key

1. Go to: https://airtable.com/create/tokens
2. Click "Create new token"
3. Give it a name: `TREFA Webhook Sync`
4. Add these scopes:
   - `data.records:read`
   - `schema.bases:read`
5. Add access to the base: `TREFA Inventario` (appbOPKYqQRW2HgyB)
6. Click "Create token"
7. Copy the token (starts with `pat...`)

## Step 2: Get Your Edge Function URL

Your webhook URL is:
```
https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/airtable-sync
```

## Step 3: Create Airtable Automation

### 3.1 Go to Automations

1. Open your Airtable base: https://airtable.com/appbOPKYqQRW2HgyB
2. Click on "Automations" in the top menu
3. Click "+ Create automation"

### 3.2 Name Your Automation

Name: `Sync to Supabase on Record Change`

### 3.3 Set Up Trigger

1. **Trigger Type**: "When a record is created or updated"
2. **Table**: Select "Inventario" (or whatever your table is named)
3. **View**: (optional) You can filter to only "Comprado" records if you have a view
4. **Fields** (optional): Select specific fields that, when changed, trigger the sync

Recommended fields to watch:
- OrdenCompra
- OrdenStatus
- Auto
- AutoMarca
- AutoSubmarcaVersion
- Precio
- fotos_exterior_url
- fotos_interior_url
- autotransmision
- autocombustible

### 3.4 Add Action: Run Script

1. Click "+ Add action"
2. Choose "Run a script"
3. Paste this script:

```javascript
// Airtable Automation Script: Sync Record to Supabase
// This script sends the record ID to the Supabase Edge Function

const SUPABASE_FUNCTION_URL = 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/airtable-sync';

// Get the record ID from the trigger
let inputConfig = input.config();
let recordId = inputConfig.recordId;

console.log(`Syncing record: ${recordId}`);

// Send webhook to Supabase
try {
    let response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            recordId: recordId
        })
    });

    let result = await response.json();

    if (response.ok) {
        console.log('✅ Success:', result.message);
        output.set('status', 'success');
        output.set('message', result.message);
    } else {
        console.error('❌ Error:', result.error);
        output.set('status', 'error');
        output.set('message', result.error);
    }
} catch (error) {
    console.error('❌ Network Error:', error.message);
    output.set('status', 'error');
    output.set('message', error.message);
}
```

### 3.5 Configure Script Inputs

In the "Input variables" section:
- Add input variable: `recordId`
- Set value to: **Record ID** (from the trigger step)

### 3.6 Test the Automation

1. Click "Test automation"
2. Select a test record from your table
3. Click "Run test"
4. Check the logs to see if it succeeded

Expected log output:
```
Syncing record: recXXXXXXXXXXXXXXX
✅ Success: Successfully synced record recXXXXXXXXXXXXXXX
```

### 3.7 Turn On the Automation

Once the test succeeds:
1. Click "Turn on" in the top right
2. Your automation is now live!

## Step 4: Verify Sync is Working

### Test 1: Update an Existing Record

1. Go to your Inventario table in Airtable
2. Update a field on a "Comprado" record (e.g., change the price)
3. Wait ~5 seconds
4. Check Supabase:

```bash
curl -s "https://jjepfehmuybpctdzipnu.supabase.co/rest/v1/inventario_cache?select=record_id,title,precio,last_synced_at&ordencompra=eq.ID002104&order=last_synced_at.desc" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTk2MDMsImV4cCI6MjA1OTc3NTYwM30.yaMESZqaoLvkbVSgdHxpU-Vb7q-naxj95QxcpRYPrX4" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTk2MDMsImV4cCI6MjA1OTc3NTYwM30.yaMESZqaoLvkbVSgdHxpU-Vb7q-naxj95QxcpRYPrX4" | python3 -m json.tool
```

The `last_synced_at` should be very recent (within the last minute).

### Test 2: Create a New Record

1. Create a new vehicle record in Airtable
2. Set `OrdenStatus` to "Comprado"
3. Wait ~5 seconds
4. Check if it appears in Supabase

## Step 5: Monitor Logs

### Airtable Logs
1. Go to your Automation in Airtable
2. Click on "Runs" tab
3. You'll see each execution with success/failure status

### Supabase Logs
1. Go to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/logs/edge-functions
2. Select function: `airtable-sync`
3. You'll see detailed logs for each webhook call

## Troubleshooting

### ❌ Error: "Missing required environment variables"

**Solution**: Add the `AIRTABLE_API_KEY` secret in Supabase:
1. Go to: Settings → Edge Functions
2. Add secret: `AIRTABLE_API_KEY` = your Airtable token

### ❌ Error: "Request body must contain a 'recordId'"

**Solution**: Check your Airtable automation script. Make sure:
- Input variable `recordId` is configured
- It's mapped to "Record ID" from the trigger

### ❌ Error: "Airtable API Error: NOT_FOUND"

**Solution**: The record was deleted. This is normal. The edge function will remove it from Supabase automatically.

### ❌ Automation runs but data doesn't appear

**Solution**: Check field mapping. The edge function logs which fields it's processing. Look for errors in Supabase logs.

### ❌ Network timeout

**Solution**: Airtable automation scripts have a 30-second timeout. If the edge function takes too long:
- Check Supabase function logs for slow queries
- Consider optimizing the upsert query

## Initial Data Load

The webhook only syncs **new and updated** records. To sync existing data:

```bash
# Run the bulk sync script once
cd /Users/marianomorales/Downloads/ultima\ copy
AIRTABLE_API_KEY=your_key SUPABASE_SERVICE_KEY=your_service_key node populate-cache-from-airtable.cjs
```

This will:
- Fetch all "Comprado" vehicles from Airtable
- Normalize and upsert them into Supabase
- After this, the webhook will keep them in sync

## Maintenance

### Updating the Edge Function

If you need to modify the sync logic:

1. Edit: `supabase/functions/airtable-sync/index.ts`
2. Deploy:
```bash
supabase functions deploy airtable-sync --no-verify-jwt
```

### Pausing Sync

To temporarily stop syncing:
1. Go to Airtable → Automations
2. Click on your automation
3. Toggle it off

### Re-enabling Sync

1. Go to Airtable → Automations
2. Click on your automation
3. Toggle it on

## Field Mapping Reference

| Airtable Field | Supabase Column | Notes |
|---|---|---|
| `id` | `record_id` | Primary key |
| `Auto` | `title` | Built from AutoMarca + AutoSubmarcaVersion |
| `AutoMarca` | `marca` | Brand name |
| `AutoSubmarcaVersion` | `modelo` | Model/version |
| `Precio` | `precio` | Price (numeric) |
| `OrdenCompra` | `ordencompra` | Order ID |
| `OrdenStatus` | `ordenstatus` | Status |
| `autotransmision` | `transmision` | Transmission type |
| `autocombustible` | `combustible` | Fuel type |
| `fotos_exterior_url` | `fotos_exterior_url` | Array of URLs |
| `fotos_interior_url` | `fotos_interior_url` | Array of URLs |
| `feature_image` | `feature_image` | Main image URL |
| `slug` / `ligawp` | `slug` | URL slug |
| `ClasificacionID` | `clasificacionid` | Classification array |
| `Ubicacion` | `ubicacion` | Location array |
| `descripcion` | `descripcion` | Description HTML |
| `vendido` | `vendido` | Sold boolean |
| (All fields) | `data` | Full JSONB backup |

## Success Indicators

✅ Automation shows "success" in Airtable runs
✅ Supabase logs show "Successfully synced record"
✅ `last_synced_at` timestamp is recent
✅ Data matches between Airtable and Supabase

## Support

If you encounter issues:
1. Check Airtable automation logs
2. Check Supabase edge function logs
3. Verify environment variables are set
4. Test with a single record first
5. Review this documentation

---

**Last Updated**: October 21, 2025
**Edge Function**: `airtable-sync`
**Version**: 1.0
