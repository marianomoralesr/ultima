# Airtable Sync Automation Guide

## Overview

There are 4 ways to automate the Airtable → Supabase sync:

1. **Supabase Edge Functions + pg_cron** ⭐ Recommended (Free, serverless)
2. **GitHub Actions** (Free, runs on GitHub servers)
3. **Vercel Cron Jobs** (Free tier available)
4. **Linux Cron Job** (Requires your own server)

---

## Option 1: Supabase Edge Functions + pg_cron ⭐ **RECOMMENDED**

**Pros:**
- ✅ Completely free (runs on Supabase infrastructure)
- ✅ No external servers needed
- ✅ Built-in scheduling with pg_cron
- ✅ Low latency (runs close to your database)

**Cons:**
- ⚠️ Requires Supabase CLI setup
- ⚠️ Image uploads may be slower (serverless execution limits)

### Setup Steps:

#### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or with NPM
npm install -g supabase
```

#### 2. Login to Supabase

```bash
supabase login
```

#### 3. Link to Your Project

```bash
cd "/Users/marianomorales/Downloads/ultima copy"
supabase link --project-ref jjepfehmuybpctdzipnu
```

#### 4. Set Secrets

```bash
supabase secrets set AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
```

#### 5. Deploy Edge Function

```bash
supabase functions deploy sync-airtable
```

#### 6. Schedule with pg_cron

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule sync every hour
SELECT cron.schedule(
  'airtable-sync-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/sync-airtable',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

#### 7. Manual Trigger (for testing)

```bash
# Get your function URL
supabase functions list

# Trigger manually
curl -X POST 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/sync-airtable' \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## Option 2: GitHub Actions

**Pros:**
- ✅ Free for public repos (2000 min/month for private)
- ✅ Easy to set up with YAML
- ✅ Great for teams (everyone can see runs)

**Cons:**
- ⚠️ Requires GitHub repository
- ⚠️ Limited to 2000 minutes/month on free plan

### Setup Steps:

#### 1. Create Workflow File

Create `.github/workflows/sync-airtable.yml`:

```yaml
name: Sync Airtable to Supabase

on:
  schedule:
    # Runs every hour
    - cron: '0 * * * *'

  # Allow manual trigger
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          npm install @supabase/supabase-js node-fetch

      - name: Run sync
        env:
          AIRTABLE_API_KEY: ${{ secrets.AIRTABLE_API_KEY }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          UPLOAD_IMAGES: 'false'  # Set to 'true' for image uploads
        run: |
          node populate-cache-from-airtable.cjs
```

#### 2. Add Secrets to GitHub

1. Go to your repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - `AIRTABLE_API_KEY`
   - `SUPABASE_SERVICE_KEY`

#### 3. Test the Workflow

1. Go to Actions tab in GitHub
2. Click "Sync Airtable to Supabase"
3. Click "Run workflow"

---

## Option 3: Vercel Cron Jobs

**Pros:**
- ✅ Free tier (100GB bandwidth)
- ✅ Easy deployment
- ✅ Good for existing Vercel projects

**Cons:**
- ⚠️ Requires Vercel account
- ⚠️ More complex setup for non-Next.js projects

### Setup Steps:

#### 1. Create API Route

Create `api/sync-airtable.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Import and run sync logic
    const { main } = require('../../populate-cache-from-airtable.cjs');
    await main();

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### 2. Create `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/sync-airtable",
      "schedule": "0 * * * *"
    }
  ]
}
```

#### 3. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

#### 4. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:
- `AIRTABLE_API_KEY`
- `SUPABASE_SERVICE_KEY`
- `CRON_SECRET` (generate a random string)

---

## Option 4: Linux Cron Job (VPS/Dedicated Server)

**Pros:**
- ✅ Full control
- ✅ No vendor lock-in
- ✅ Can handle large image uploads

**Cons:**
- ⚠️ Requires managing your own server
- ⚠️ Cost of VPS ($5-10/month)

### Setup Steps:

#### 1. SSH into Your Server

```bash
ssh user@your-server.com
```

#### 2. Clone Repository

```bash
cd /var/www
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
```

#### 3. Create Environment File

```bash
nano .env
```

Add:
```
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4. Create Cron Job

```bash
crontab -e
```

Add:
```bash
# Run every hour
0 * * * * cd /var/www/your-repo && /usr/bin/node populate-cache-from-airtable.cjs >> /var/log/airtable-sync.log 2>&1
```

#### 5. Monitor Logs

```bash
tail -f /var/log/airtable-sync.log
```

---

## Recommended Schedules

### For Active Inventory (High Update Frequency)
```
Every 15 minutes: */15 * * * *
```

### For Normal Operations
```
Every hour: 0 * * * *
```

### For Low Update Frequency
```
Every 6 hours: 0 */6 * * *
```

### Off-Peak Hours Only
```
2 AM daily: 0 2 * * *
```

---

## Monitoring & Alerts

### 1. Supabase Logs

Check function execution in Dashboard → Logs:
```sql
SELECT * FROM edge_logs
WHERE function_name = 'sync-airtable'
ORDER BY timestamp DESC
LIMIT 50;
```

### 2. GitHub Actions Notifications

Enable email notifications in GitHub Settings → Notifications

### 3. Healthcheck Monitoring (Optional)

Use services like:
- **Uptime Robot** (free)
- **Better Uptime** (free tier)
- **Cronitor** (cron-specific monitoring)

Example: Add to end of sync script:
```javascript
// Ping healthcheck endpoint on success
await fetch('https://hc-ping.com/YOUR-UUID');
```

---

## Troubleshooting

### Sync Takes Too Long
- Set `UPLOAD_IMAGES=false` to skip image uploads
- Run image uploads separately once per day

### Rate Limiting from Airtable
- Airtable limits: 5 requests/second
- Add delay between batches if needed

### Out of Memory (Serverless)
- Process in smaller batches
- Use `FULL_SYNC=false` for incremental updates

---

## Cost Comparison

| Method | Cost | Ease of Setup | Best For |
|--------|------|---------------|----------|
| **Supabase Edge Functions** | FREE | Medium | Most users ⭐ |
| **GitHub Actions** | FREE | Easy | GitHub repos |
| **Vercel Cron** | FREE (100GB) | Medium | Vercel users |
| **Linux Cron** | $5-10/month | Hard | Full control |

---

## Recommendation

**Start with Supabase Edge Functions + pg_cron** because:
1. ✅ It's completely free
2. ✅ Runs directly on Supabase (low latency)
3. ✅ No external dependencies
4. ✅ Built-in scheduling with pg_cron
5. ✅ Easy to monitor in Supabase Dashboard

If you need **faster image uploads**, consider:
- Running the Node.js script on a VPS with Linux cron
- Separating image sync from data sync (data hourly, images daily)
