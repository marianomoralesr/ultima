# Automated Email Notifications

This edge function sends automated email notifications to users and sales agents.

## Features

### 1. Incomplete Application Reminder
- Triggers 24 hours after a user starts but doesn't complete their financing application
- Includes featured vehicles with financing options
- Offers 1-1 support to complete the application

### 2. Incomplete Profile Reminder
- Triggers 24 hours after signup if user hasn't completed profile info
- Explains the application flow and benefits
- Includes featured vehicles

### 3. Sales Agent Daily Digest
- Sends daily to all admin emails
- Lists leads with pending resolution (not contacted)
- Lists incomplete applications (draft status > 24 hours)

## Setup Instructions

### 1. Deploy the Edge Function

```bash
supabase functions deploy automated-email-notifications
```

### 2. Set Required Secrets

Make sure these secrets are set in your Supabase project:

```bash
supabase secrets set BREVO_API_KEY=your_brevo_api_key
```

The function automatically accesses:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Apply the Database Migration

The cron job migration sets up pg_cron to run the function daily:

```bash
supabase db push
```

Or apply the specific migration:

```bash
supabase migration up
```

### 4. Verify the Cron Job

Check that the cron job was created successfully:

```sql
SELECT * FROM cron.job WHERE jobname = 'send-automated-email-notifications';
```

### 5. View Execution History

Check cron job history:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-automated-email-notifications')
ORDER BY start_time DESC
LIMIT 10;
```

### 6. Check Email Notification Logs

View logs of email notification runs:

```sql
SELECT * FROM public.email_notification_logs
ORDER BY run_at DESC
LIMIT 20;
```

## Schedule

The cron job runs daily at:
- **10:00 AM UTC**
- **4:00 AM CST** (Mexico Central Time)

## Manual Execution

To test or manually trigger the function:

```bash
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/automated-email-notifications' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Or use the Supabase dashboard to invoke the function directly.

## Monitoring

### Success Response

```json
{
  "success": true,
  "results": {
    "incompleteApplications": 5,
    "incompleteProfiles": 3,
    "salesAgentEmails": 5,
    "errors": []
  },
  "message": "Sent 5 incomplete app emails, 3 incomplete profile emails, and 5 sales agent digests."
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Email Templates

All emails follow TREFA branding:
- Orange gradient header with logo
- Clean, responsive design
- Professional Spanish copy
- Unsubscribe link in footer
- Featured vehicles (when applicable)

## Admin Emails

Sales agent digests are sent to:
- marianomorales@outlook.com
- mariano.morales@autostrefa.mx
- alejandro.trevino@autostrefa.mx
- evelia.castillo@autostrefa.mx
- fernando.trevino@autostrefa.mx

## Troubleshooting

### Cron Job Not Running

1. Check if pg_cron extension is enabled:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Verify the cron job exists:
```sql
SELECT * FROM cron.job;
```

3. Check for errors in job runs:
```sql
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### Function Errors

Check the Supabase function logs:
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Select `automated-email-notifications`
4. View the Logs tab

### Email Not Sending

1. Verify BREVO_API_KEY is set correctly
2. Check Brevo account limits and quota
3. Review function logs for API errors
4. Test the send-brevo-email function directly

## Customization

To change the schedule, modify the cron expression in the migration:

```sql
'0 10 * * *'  -- Current: Daily at 10:00 AM UTC
'0 */6 * * *' -- Every 6 hours
'0 8 * * 1'   -- Every Monday at 8:00 AM
```

## Security

- Function uses service role key for database access
- Brevo API key stored securely in Supabase secrets
- RLS policies protect email logs
- Unsubscribe functionality respects user preferences
