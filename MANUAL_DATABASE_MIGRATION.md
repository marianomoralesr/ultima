# Manual Database Migration Instructions

## Overview

The sync_logs table migration needs to be applied manually via Supabase Dashboard SQL Editor.

## Steps

### 1. Go to Supabase SQL Editor

Open: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

### 2. Copy and Paste the SQL

Copy the entire contents of `supabase/migrations/20251024000000_create_sync_logs_table.sql` and paste into the SQL editor.

### 3. Run the Migration

Click "Run" button (or Cmd/Ctrl + Enter)

### 4. Verify Success

Run this query to verify the table was created:

```sql
SELECT * FROM sync_logs LIMIT 1;
SELECT * FROM sync_stats LIMIT 1;
```

You should see empty results (no error) - this confirms the tables exist.

### 5. Test Sync Logging

Trigger a sync from Airtable (update any vehicle record), then check:

```sql
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;
```

You should see log entries appear after syncs complete.

---

## Alternative: Use Supabase CLI  (if configured with database password)

If you have psql installed:

```bash
PGPASSWORD="your_db_password" psql \\
  -h aws-0-us-west-1.pooler.supabase.com \\
  -p 6543 \\
  -U postgres.jjepfehmuybpctdzipnu \\
  -d postgres \\
  < supabase/migrations/20251024000000_create_sync_logs_table.sql
```

---

## Rollback (if needed)

If you need to remove the sync_logs table:

```sql
-- Run in Supabase SQL Editor
DROP TABLE IF EXISTS public.sync_logs CASCADE;
DROP VIEW IF EXISTS public.sync_stats CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_sync_logs() CASCADE;
```

---

## Confirmation

After applying, you should be able to query:

```sql
-- Should return table structure
\\d sync_logs

-- Should return view structure
\\d sync_stats

-- Should list the cleanup function
\\df cleanup_old_sync_logs
```
