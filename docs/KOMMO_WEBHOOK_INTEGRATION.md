# Kommo CRM Webhook Integration

This document explains how to set up and use the Kommo CRM webhook integration to sync lead data from Kommo to your Supabase database.

## Overview

The Kommo webhook handler automatically syncs lead updates from Kommo CRM to your database in real-time. It supports:

- ✅ New lead creation
- ✅ Lead updates
- ✅ Status changes
- ✅ Responsible user changes
- ✅ Lead deletions

## Architecture

```
Kommo CRM  →  Webhook Event  →  Supabase Edge Function  →  Database
                                  (kommo-webhook)           (kommo_leads table)
```

## Deployment Status

- ✅ **Edge Function**: Deployed to `https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/kommo-webhook`
- ⏳ **Database Tables**: Need to be created (see Setup below)

## Setup Instructions

### Step 1: Create Database Tables

You have two options:

#### Option A: Using the migration script (Recommended)

```bash
chmod +x scripts/apply-kommo-migration.sh
./scripts/apply-kommo-migration.sh
```

#### Option B: Manual SQL execution

1. Go to Supabase Dashboard → SQL Editor: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new
2. Copy and paste the SQL from `supabase/migrations/20251107000002_create_kommo_webhook_tables.sql`
3. Click "Run"

This creates:
- `kommo_leads` - Stores lead data synced from Kommo
- `kommo_webhook_logs` - Logs all webhook events for debugging

### Step 2: Configure Webhook in Kommo

1. Log into your Kommo CRM account: https://crmautostrefa.kommo.com

2. Go to **Settings** → **Integrations** → **Webhooks**

3. Click **"Add Webhook"**

4. Configure the webhook:
   - **URL**: `https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/kommo-webhook`
   - **Method**: POST
   - **Events to track**:
     - ☑️ Lead created (`leads.add`)
     - ☑️ Lead updated (`leads.update`)
     - ☑️ Lead status changed (`leads.status`)
     - ☑️ Lead responsible changed (`leads.responsible`)
     - ☑️ Lead deleted (`leads.delete`)

5. Click **"Save"**

### Step 3: Test the Integration

1. **Create a test lead** in Kommo CRM

2. **Check the logs** in Supabase:
   ```sql
   -- View recent webhook events
   SELECT * FROM kommo_webhook_logs
   ORDER BY created_at DESC
   LIMIT 10;

   -- View synced leads
   SELECT * FROM kommo_leads
   ORDER BY updated_at DESC
   LIMIT 10;
   ```

3. **Expected result**: You should see the lead in the `kommo_leads` table within a few seconds

## Usage

### Querying Synced Leads

```sql
-- Get all active leads
SELECT * FROM kommo_leads
WHERE is_deleted = false
ORDER BY updated_at DESC;

-- Get leads by pipeline
SELECT * FROM kommo_leads
WHERE pipeline_id = YOUR_PIPELINE_ID
  AND is_deleted = false;

-- Get leads by status
SELECT * FROM kommo_leads
WHERE status_id = YOUR_STATUS_ID
  AND is_deleted = false;

-- Get leads with specific event type
SELECT * FROM kommo_leads
WHERE event_type = 'status_changed'
ORDER BY updated_at DESC;
```

### Accessing from Frontend

You can query `kommo_leads` from your React app using Supabase client:

```typescript
import { supabase } from './supabaseClient';

// Get all active leads
const { data: leads, error } = await supabase
  .from('kommo_leads')
  .select('*')
  .eq('is_deleted', false)
  .order('updated_at', { ascending: false });

// Get lead by Kommo ID
const { data: lead, error } = await supabase
  .from('kommo_leads')
  .select('*')
  .eq('kommo_id', 123456)
  .single();
```

## Data Structure

### kommo_leads Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Internal Supabase ID |
| `kommo_id` | BIGINT | Lead ID from Kommo CRM (unique) |
| `name` | TEXT | Lead name |
| `status_id` | INTEGER | Current status ID |
| `pipeline_id` | INTEGER | Pipeline ID |
| `responsible_user_id` | INTEGER | Assigned user ID |
| `price` | DECIMAL | Lead value |
| `event_type` | TEXT | Last event: created, updated, status_changed, responsible_changed, deleted |
| `is_deleted` | BOOLEAN | Whether lead was deleted in Kommo |
| `raw_data` | JSONB | Full Kommo lead data |
| `created_at` | TIMESTAMPTZ | First sync time |
| `updated_at` | TIMESTAMPTZ | Last sync time |

### kommo_webhook_logs Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Log entry ID |
| `event_type` | TEXT | Type of webhook event |
| `payload` | JSONB | Full webhook payload |
| `results` | JSONB | Processing results |
| `status` | TEXT | success or error |
| `error_message` | TEXT | Error details if failed |
| `created_at` | TIMESTAMPTZ | When webhook was received |

## Troubleshooting

### Webhook not receiving events

1. **Check webhook is enabled** in Kommo CRM settings
2. **Verify the URL** is correct: `https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/kommo-webhook`
3. **Check Edge Function logs** in Supabase Dashboard → Functions → kommo-webhook
4. **Test manually**:
   ```bash
   curl -X POST https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/kommo-webhook \
     -H "Content-Type: application/json" \
     -d '{
       "leads": {
         "add": [{
           "id": 999999,
           "name": "Test Lead",
           "status_id": 123,
           "pipeline_id": 456
         }]
       }
     }'
   ```

### Data not appearing in database

1. **Check webhook logs**:
   ```sql
   SELECT * FROM kommo_webhook_logs
   WHERE status = 'error'
   ORDER BY created_at DESC;
   ```

2. **Check RLS policies** are not blocking access:
   ```sql
   -- This should work (uses service role)
   SELECT * FROM kommo_leads;
   ```

3. **Verify tables exist**:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_name IN ('kommo_leads', 'kommo_webhook_logs');
   ```

### 500 Error from Kommo

If you're getting a 500 error when syncing contacts from your frontend:

1. **Check Edge Function logs** for the exact error
2. **Verify OAuth tokens** are valid in `oauth_tokens` table
3. **Test the kommo-oauth function** directly:
   ```bash
   curl -X POST https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/kommo-oauth?action=api-request \
     -H "Content-Type: application/json" \
     -H "apikey: YOUR_ANON_KEY" \
     -d '{
       "endpoint": "/api/v4/leads",
       "method": "GET"
     }'
   ```

## Webhook Endpoint Reference

### Your Kommo Webhook URL (Provided by You)

You mentioned you created this webhook endpoint on Kommo:
```
https://data.widgets.wearekwid.com/api/webhook/33734259/b97dfdcaa69344055c30fc5ec1f6b15b2bec4742087c83ca8ff8afd3b6460b53
```

This endpoint returns `{"status":"success"}` and can be used for **incoming webhooks from external services to Kommo**.

### Our Supabase Webhook Endpoint (For Kommo → Supabase)

For syncing data **from Kommo to Supabase**, use:
```
https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/kommo-webhook
```

This is the endpoint configured in the Kommo CRM settings to receive webhook events.

## Integration with Existing KommoService

The webhook handler is **independent** from your existing `KommoService.ts` implementation:

- **KommoService.ts**: Makes API calls TO Kommo (create leads, update leads, search)
- **kommo-webhook Edge Function**: Receives data FROM Kommo (passive listener)

They can work together:
1. User fills out form → `KommoService.syncLeadWithKommo()` creates lead in Kommo
2. Lead is created in Kommo → Webhook fires → Lead data synced to `kommo_leads` table
3. Your app can now query `kommo_leads` for real-time lead status without API calls

## Next Steps

- ✅ Webhook handler deployed
- ⏳ Create database tables (run migration script)
- ⏳ Configure webhook in Kommo CRM
- ⏳ Test with a real lead update
- ⏳ Integrate `kommo_leads` queries into your dashboard

## Support

For issues or questions:
1. Check Edge Function logs: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/functions/kommo-webhook
2. Check webhook logs: `SELECT * FROM kommo_webhook_logs ORDER BY created_at DESC;`
3. Review Kommo API docs: https://developers.kommo.com/
