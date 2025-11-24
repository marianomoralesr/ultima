# Airtable → Supabase Webhook Sync - Implementation Summary

## What Was Done

### ✅ Completed Tasks

1. **Fixed the `airtable-sync` Edge Function**
   - Complete field mapping from Airtable to Supabase
   - Proper normalization of all vehicle data
   - Handles image URLs, arrays, and complex field types
   - Supports record deletions (removes from Supabase if deleted in Airtable)
   - Location: `supabase/functions/airtable-sync/index.ts`

2. **Removed Redundant Sync Functions**
   - Deleted `/supabase/functions/sync-airtable/` (conflicting implementation)
   - Deleted `syncAirtableData.cjs` (old manual script)
   - Deleted `syncAirtableToSupabase.cjs` (duplicate script)
   - This prevents confusion and unwanted syncs

3. **Deployed to Supabase**
   - Edge function is live at: `https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/airtable-sync`
   - No JWT verification required (accepts Airtable webhooks)
   - Configured with proper CORS headers

4. **Created Documentation**
   - `AIRTABLE_WEBHOOK_SETUP.md` - Complete setup guide for Airtable automation
   - Includes step-by-step instructions
   - Troubleshooting section
   - Field mapping reference

5. **Created Test Script**
   - `test-webhook-sync.cjs` - End-to-end testing
   - Tests passed successfully ✅
   - Verified record syncs in under 2 seconds

6. **Committed Changes**
   - Commit: `67e9d97` - "feat(sync): implement Airtable webhook sync with proper field mapping"
   - All changes version controlled

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Airtable Inventario                       │
│  (Record created/updated with OrdenStatus = "Comprado")     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├── Triggers Automation
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Airtable Automation Script                      │
│  • Extracts recordId from trigger                           │
│  • Sends POST request with {recordId}                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├── HTTP POST
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          Supabase Edge Function (airtable-sync)             │
│  • Fetches full record from Airtable API                    │
│  • Normalizes field names (AutoMarca → marca, etc.)         │
│  • Processes images, arrays, and complex types              │
│  • Upserts to inventario_cache table                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├── SQL UPSERT
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               Supabase inventario_cache                      │
│  • Record updated with last_synced_at timestamp             │
│  • Available to frontend immediately                         │
└─────────────────────────────────────────────────────────────┘
```

## Test Results

```bash
🧪 Airtable → Supabase Webhook Sync Test

==================================================
📡 Fetching a test record from Airtable...
✅ Found test record: rec0JJni3MFfixrF0
   OrdenCompra: ID002112
   Auto: Honda  BR-V Touring 2024

🔄 Testing webhook sync for record: rec0JJni3MFfixrF0
✅ Webhook succeeded!
   Message: Successfully synced record rec0JJni3MFfixrF0

⏳ Waiting 2 seconds for sync to complete...

🔍 Verifying sync in Supabase...
✅ Record found in Supabase!
   record_id: rec0JJni3MFfixrF0
   title: Honda  BR-V Touring
   ordencompra: ID002112
   precio: 429900
   last_synced_at: 2025-10-22T02:40:02.25+00:00
   Synced 2 seconds ago

==================================================
✅ TEST PASSED: Webhook sync is working correctly!
```

## Next Steps (Required)

### 1. Set Supabase Environment Variables

Go to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/functions

Add this secret:
- **Name**: `AIRTABLE_API_KEY`
- **Value**: Your Airtable Personal Access Token (starts with `pat...`)

#### How to Get Airtable API Key:
1. Visit: https://airtable.com/create/tokens
2. Create token with scopes: `data.records:read`, `schema.bases:read`
3. Grant access to base: `TREFA Inventario` (appbOPKYqQRW2HgyB)
4. Copy the token

### 2. Set Up Airtable Automation

Follow the complete guide in: **`AIRTABLE_WEBHOOK_SETUP.md`**

Quick steps:
1. Go to Airtable → Automations
2. Create automation: "When a record is created or updated"
3. Add action: "Run a script" (script provided in setup guide)
4. Configure input variable: `recordId` = Record ID
5. Test and enable

### 3. Verify Setup

Run the test script:
```bash
AIRTABLE_API_KEY=your_key node test-webhook-sync.cjs
```

Expected result: `✅ TEST PASSED`

## Field Mapping

The edge function maps **all** Airtable fields to Supabase columns:

| Airtable Field | Supabase Column | Type |
|---|---|---|
| `id` | `record_id` | text (PK) |
| `Auto` + `AutoMarca` + `AutoSubmarcaVersion` | `title` | text |
| `AutoMarca` | `marca` | text |
| `AutoSubmarcaVersion` | `modelo` | text |
| `Precio` | `precio` | numeric |
| `OrdenCompra` | `ordencompra` | text |
| `OrdenStatus` | `ordenstatus` | text |
| `autotransmision` | `transmision` / `autotransmision` | text |
| `autocombustible` | `combustible` / `autocombustible` | text |
| `fotos_exterior_url` | `fotos_exterior_url` | jsonb (array) |
| `fotos_interior_url` | `fotos_interior_url` | jsonb (array) |
| `feature_image` | `feature_image` | text |
| `slug` / `ligawp` | `slug` | text |
| `ClasificacionID` | `clasificacionid` | jsonb (array) |
| `Ubicacion` | `ubicacion` | jsonb (array) |
| `descripcion` | `descripcion` | text |
| `vendido` | `vendido` | boolean |
| (All fields) | `data` | jsonb |

## Files Modified

### Created
- `supabase/functions/airtable-sync/index.ts` - Fixed edge function
- `AIRTABLE_WEBHOOK_SETUP.md` - Setup documentation
- `test-webhook-sync.cjs` - Test script
- `WEBHOOK_SYNC_SUMMARY.md` - This file

### Deleted
- `supabase/functions/sync-airtable/` - Redundant function
- `syncAirtableData.cjs` - Old script
- `syncAirtableToSupabase.cjs` - Old script

### Unchanged (Still Available for Bulk Sync)
- `populate-cache-from-airtable.cjs` - Use for initial data load

## Monitoring & Debugging

### Airtable Logs
View automation runs:
- Go to Automations → Your automation → "Runs" tab
- Shows success/failure for each trigger

### Supabase Logs
View edge function logs:
- https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/logs/edge-functions
- Filter by function: `airtable-sync`
- Shows detailed execution logs

### Check Sync Status

Query recent syncs:
```bash
curl "https://jjepfehmuybpctdzipnu.supabase.co/rest/v1/inventario_cache?select=record_id,title,ordencompra,last_synced_at&order=last_synced_at.desc&limit=10" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Troubleshooting

### Issue: Webhook not triggering

**Check:**
1. Airtable automation is enabled (toggle is ON)
2. Record has `OrdenStatus = "Comprado"`
3. Changed a watched field (if field filters are set)

**Fix:** Test automation manually in Airtable

### Issue: Error "Missing required environment variables"

**Check:** Supabase secrets are set
- Go to: Settings → Edge Functions
- Ensure `AIRTABLE_API_KEY` is present

**Fix:** Add the missing secret

### Issue: Data not syncing

**Check:**
1. Supabase function logs for errors
2. Airtable automation logs for failures
3. Field names match expected format

**Fix:** Review logs and adjust field mapping if Airtable schema changed

## Performance

- **Sync Speed**: ~2 seconds per record
- **Airtable Rate Limits**: 5 requests/second (shouldn't be an issue for single-record webhooks)
- **Supabase Edge Function Timeout**: 30 seconds (plenty of time)

## Security

- ✅ No JWT verification required (Airtable doesn't support it)
- ✅ CORS enabled for Airtable webhook domains
- ✅ Service role key only used server-side in edge function
- ✅ Webhook endpoint is public but validates request format
- ⚠️ Consider adding webhook signature verification in the future

## Initial Data Load

For existing vehicles not yet synced:

```bash
# Run once to populate all existing data
AIRTABLE_API_KEY=your_key \
SUPABASE_SERVICE_KEY=your_service_key \
node populate-cache-from-airtable.cjs
```

After this, the webhook will keep data in sync automatically.

## Support

- **Setup Guide**: `AIRTABLE_WEBHOOK_SETUP.md`
- **Test Script**: `test-webhook-sync.cjs`
- **Edge Function**: `supabase/functions/airtable-sync/index.ts`

---

**Status**: ✅ Ready for Production
**Last Updated**: October 21, 2025
**Version**: 1.0
