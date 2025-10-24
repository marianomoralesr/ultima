# Cron Setup for Nightly Fallback Sync

## Overview

The nightly fallback sync ensures that any missed webhook updates are caught by running a full sync from Airtable to Supabase once per day.

## Prerequisites

1. Ensure the sync script has environment variables configured
2. Make sure the script is executable: `chmod +x scripts/nightly-fallback-sync.sh`
3. Test the script manually first

## Option 1: System Crontab (Recommended for Server)

### Step 1: Create Environment File

Create a file with your environment variables (e.g., `/etc/airtable-sync.env`):

```bash
# /etc/airtable-sync.env
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://jjepfehmuybpctdzipnu.supabase.co
```

Secure the file:
```bash
sudo chmod 600 /etc/airtable-sync.env
sudo chown root:root /etc/airtable-sync.env
```

### Step 2: Edit Crontab

```bash
crontab -e
```

Add this line (runs daily at 2 AM):

```cron
# Nightly Airtable to Supabase fallback sync
0 2 * * * set -a && source /etc/airtable-sync.env && set +a && /path/to/ultima\ copy/scripts/nightly-fallback-sync.sh >> /var/log/airtable-sync-cron.log 2>&1
```

Replace `/path/to/ultima\ copy` with your actual project path.

### Step 3: Verify Cron Job

```bash
# List your cron jobs
crontab -l

# Monitor the cron log
tail -f /var/log/airtable-sync-cron.log
```

## Option 2: User Crontab (Local Development)

If running on your local machine:

### Step 1: Create .env File

Create `.env` in project root:

```bash
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://jjepfehmuybpctdzipnu.supabase.co
```

### Step 2: Edit User Crontab

```bash
crontab -e
```

Add:

```cron
# Nightly Airtable to Supabase fallback sync (2 AM daily)
0 2 * * * cd "/Users/marianomorales/Downloads/ultima copy" && ./scripts/nightly-fallback-sync.sh >> logs/cron.log 2>&1
```

The script will automatically load environment variables from `.env`.

## Option 3: systemd Timer (Linux Only)

For Linux systems, systemd timers are more reliable than cron.

### Step 1: Create Service File

`/etc/systemd/system/airtable-sync.service`:

```ini
[Unit]
Description=Airtable to Supabase Nightly Sync
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=your-username
WorkingDirectory=/path/to/ultima copy
EnvironmentFile=/etc/airtable-sync.env
ExecStart=/path/to/ultima copy/scripts/nightly-fallback-sync.sh
StandardOutput=journal
StandardError=journal
```

### Step 2: Create Timer File

`/etc/systemd/system/airtable-sync.timer`:

```ini
[Unit]
Description=Run Airtable Sync Nightly at 2 AM
Requires=airtable-sync.service

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

### Step 3: Enable and Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable airtable-sync.timer
sudo systemctl start airtable-sync.timer

# Check status
sudo systemctl status airtable-sync.timer

# View logs
journalctl -u airtable-sync.service -f
```

## Option 4: GitHub Actions (Cloud-Based)

Run the sync from GitHub Actions on a schedule.

Create `.github/workflows/nightly-sync.yml`:

```yaml
name: Nightly Airtable Sync

on:
  schedule:
    # Run at 2 AM UTC daily
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

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
        run: npm install @supabase/supabase-js node-fetch

      - name: Run sync
        env:
          AIRTABLE_API_KEY: ${{ secrets.AIRTABLE_API_KEY }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          SUPABASE_URL: https://jjepfehmuybpctdzipnu.supabase.co
          UPLOAD_IMAGES: false
        run: |
          chmod +x scripts/nightly-fallback-sync.sh
          ./scripts/nightly-fallback-sync.sh

      - name: Upload logs
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: sync-logs
          path: logs/
```

Add secrets in GitHub:
- Settings → Secrets and variables → Actions
- Add `AIRTABLE_API_KEY` and `SUPABASE_SERVICE_KEY`

## Testing the Setup

### Manual Test Run

```bash
# Test with environment variables inline
AIRTABLE_API_KEY=your_key SUPABASE_SERVICE_KEY=your_key ./scripts/nightly-fallback-sync.sh

# Or test with .env file
./scripts/nightly-fallback-sync.sh
```

### Cron Test (Run Immediately)

```bash
# Run the exact command that cron will run
cd "/Users/marianomorales/Downloads/ultima copy" && ./scripts/nightly-fallback-sync.sh
```

### Check Logs

```bash
# View today's log
cat "logs/nightly-sync-$(date +%Y%m%d).log"

# Watch live
tail -f "logs/nightly-sync-$(date +%Y%m%d).log"
```

## Cron Schedule Examples

```cron
# Every day at 2 AM
0 2 * * *

# Every day at 3:30 AM
30 3 * * *

# Twice daily (2 AM and 2 PM)
0 2,14 * * *

# Every 6 hours
0 */6 * * *

# Monday through Friday at 2 AM
0 2 * * 1-5

# First day of month at 2 AM
0 2 1 * *
```

## Monitoring

### Check Last Run

```bash
# Find latest log file
ls -lt logs/nightly-sync-*.log | head -1

# Check if sync succeeded
grep "✅" logs/nightly-sync-$(date +%Y%m%d).log
```

### Email Notifications

Add to crontab for email alerts on failure:

```cron
MAILTO=your-email@example.com
0 2 * * * cd "/path/to/project" && ./scripts/nightly-fallback-sync.sh || echo "Sync failed!"
```

### Slack Notifications

Edit `scripts/nightly-fallback-sync.sh` and add webhook URL:

```bash
send_notification() {
    local status=$1
    local message=$2

    # Send to Slack
    curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"[$status] $message\"}"
}
```

## Troubleshooting

### Cron Job Not Running

1. Check cron service is running:
   ```bash
   # macOS
   sudo launchctl list | grep cron

   # Linux
   systemctl status cron
   ```

2. Check cron logs:
   ```bash
   # macOS
   log show --predicate 'process == "cron"' --last 1h

   # Linux
   grep CRON /var/log/syslog
   ```

3. Verify crontab syntax:
   ```bash
   crontab -l
   ```

### Permission Errors

```bash
# Make script executable
chmod +x scripts/nightly-fallback-sync.sh

# Check Node.js is in PATH
which node

# If not, use full path in script:
/usr/local/bin/node populate-cache-from-airtable.cjs
```

### Environment Variables Not Loading

Add debug to cron:

```cron
0 2 * * * env > /tmp/cron-env.log && cd "/path/to/project" && ./scripts/nightly-fallback-sync.sh
```

Then check `/tmp/cron-env.log` to see what environment cron has.

## Best Practices

1. **Run during off-peak hours** - 2-4 AM is typically low traffic
2. **Monitor logs regularly** - Check for failures weekly
3. **Set up alerts** - Get notified if sync fails
4. **Keep logs for 30 days** - Automatically cleaned up by script
5. **Test after changes** - Always test manually after modifying script
6. **Use absolute paths** - Cron has limited PATH

## Cleanup

To remove the cron job:

```bash
crontab -e
# Delete the line for airtable sync
```

For systemd:

```bash
sudo systemctl stop airtable-sync.timer
sudo systemctl disable airtable-sync.timer
sudo rm /etc/systemd/system/airtable-sync.{service,timer}
sudo systemctl daemon-reload
```

---

**Recommended Schedule**: Daily at 2 AM (Option 1 or 2)
**Backup Option**: GitHub Actions (Option 4) if server access is limited
