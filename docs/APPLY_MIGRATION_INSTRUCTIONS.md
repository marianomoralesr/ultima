# How to Apply the Google Sheets Webhook Migration

## The Issue (Fixed)

The original migration had an empty string `''` being inserted into the `value` column, which PostgreSQL interpreted as invalid JSON in certain contexts. This has been fixed.

## Fixed Migration File

Use this file: `supabase/migrations/20251110000001_add_google_sheets_webhook_safe.sql`

## Option 1: Using Supabase CLI (Recommended)

```bash
cd /Users/marianomorales/Downloads/ultima\ copy
supabase db push
```

This will apply all pending migrations including the new webhook migration.

## Option 2: Using Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/20251110000001_add_google_sheets_webhook_safe.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

## What This Migration Does

1. ✅ Creates the `app_config` table (if it doesn't exist)
2. ✅ Enables Row Level Security (admin-only access)
3. ✅ Inserts a placeholder webhook URL (`https://example.com/placeholder...`)
4. ✅ Creates the `notify_google_sheets_new_application()` function
5. ✅ Creates the trigger on `financing_applications` table
6. ✅ Adds helpful comments to all objects

## After Running the Migration

### Verify It Worked

Run this query in Supabase SQL Editor:

```sql
-- Check that the config table exists
SELECT * FROM public.app_config WHERE key = 'google_sheets_webhook_url';

-- Check that the trigger exists
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_google_sheets_sync';

-- Check that the function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'notify_google_sheets_new_application';
```

You should see:
- ✅ One row in `app_config` with key `google_sheets_webhook_url`
- ✅ One trigger named `trigger_google_sheets_sync`
- ✅ One function named `notify_google_sheets_new_application`

### Update the Webhook URL

After you deploy your Google Apps Script as a web app and get the URL, update it:

```sql
UPDATE public.app_config
SET value = 'https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec',
    updated_at = now()
WHERE key = 'google_sheets_webhook_url';
```

Replace `YOUR_ACTUAL_SCRIPT_ID` with your actual Google Apps Script deployment URL.

## Troubleshooting

### Error: "relation app_config already exists"

This is fine - the migration handles this gracefully with `IF NOT EXISTS`.

### Error: "permission denied"

Make sure you're connected as a user with sufficient privileges (usually the default Supabase connection has this).

### Error: "extension pg_net does not exist"

The `pg_net` extension should be available in Supabase by default. If not, run:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

### Webhook Not Firing

The webhook won't fire until you:
1. Update the webhook URL in `app_config` (remove the placeholder)
2. Submit an application with status = 'submitted'

To test manually:

```sql
-- Simulate a new submitted application (replace user_id with actual UUID)
INSERT INTO financing_applications (user_id, status)
VALUES ('YOUR_USER_ID_HERE', 'submitted');
```

Check the logs to see if the webhook was called:

```sql
-- This will show NOTICE/WARNING messages from the trigger
-- (Available in Supabase logs UI)
```

## Safe to Run Multiple Times

This migration is **idempotent** - it's safe to run multiple times. It uses:
- `CREATE TABLE IF NOT EXISTS`
- `CREATE OR REPLACE FUNCTION`
- `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`
- `ON CONFLICT DO NOTHING` for the config insert

## Next Steps

After successfully applying this migration:

1. ✅ Follow the setup guide in `docs/google-sheets-realtime-sync.md`
2. ✅ Deploy your Google Apps Script as a web app
3. ✅ Update the webhook URL in Supabase
4. ✅ Test by submitting an application
5. ✅ Watch it appear in Google Sheets automatically!
