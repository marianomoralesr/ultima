# Email Notifications Setup Guide

This guide explains how to set up and configure email notifications for the Trefa Autos platform using Brevo (formerly Sendinblue).

## Overview

The email notification system automatically sends branded emails to users when:
- Their financing application is submitted
- Their application status changes (reviewing, approved, rejected, etc.)
- Their document status changes (approved, rejected, reviewing)

## Features

- Beautiful, brand-consistent email templates with Trefa colors and logo
- Automatic triggers via database changes
- Responsive email design optimized for all devices
- Status-specific messaging with next steps guidance
- Direct links to user portal for checking application status

## Prerequisites

1. **Brevo Account**: Sign up at [https://www.brevo.com](https://www.brevo.com)
2. **Brevo API Key**: Generate an API key from your Brevo account
3. **Supabase Project**: Active Supabase project with database access
4. **Logo Upload**: Upload your logo to Supabase Storage

## Step 1: Configure Brevo API Key

### Option A: Local Development

1. Add your Brevo API key to `.env`:
   ```bash
   BREVO_API_KEY=your_actual_brevo_api_key_here
   ```

### Option B: Production (Supabase Dashboard)

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions**
3. Add a new secret:
   - Name: `BREVO_API_KEY`
   - Value: Your Brevo API key from your Brevo account

## Step 2: Deploy the Edge Function

Deploy the email sending Edge Function:

```bash
supabase functions deploy send-brevo-email
```

## Step 3: Configure Database Settings

The triggers need to know your Supabase URL and anon key. Run these SQL commands in your Supabase SQL Editor:

```sql
-- Set your Supabase URL
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project-ref.supabase.co';

-- Set your Supabase Anon Key
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'your-anon-key-here';
```

Replace:
- `your-project-ref` with your actual Supabase project reference
- `your-anon-key-here` with your Supabase anon key (found in Project Settings → API)

## Step 4: Upload Brand Logo

1. Go to **Storage** in your Supabase dashboard
2. Create a bucket named `public-assets` (if it doesn't exist) and make it public
3. Upload your logo (preferably white/light colored for the email header)
4. Name it `logoblanco.png`
5. The URL should be: `https://your-project-ref.supabase.co/storage/v1/object/public/public-assets/logoblanco.png`

Alternatively, you can update the logo URL in the Edge Function at `/supabase/functions/send-brevo-email/index.ts` (line ~260).

## Step 5: Run Database Migration

Apply the email notification triggers migration:

```bash
supabase db push
```

Or run the migration file directly:
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20251024220000_add_email_notification_triggers.sql
```

## Step 6: Configure Sender Email in Brevo

1. Log in to your Brevo account
2. Go to **Senders & IP** → **Senders**
3. Add and verify your sender email address (e.g., `noreply@trefaautos.com`)
4. If using a custom domain, you'll need to add DNS records for verification

**Note**: The default sender in the Edge Function is `noreply@trefaautos.com`. Update this in `/supabase/functions/send-brevo-email/index.ts` if you use a different email.

## Email Templates

### 1. Application Submitted
**Trigger**: When an application status changes from `draft` to `submitted`

**Features**:
- Welcome message
- Application summary
- What happens next
- Link to check status

### 2. Status Changed
**Trigger**: When application status changes (except initial submission)

**Statuses Covered**:
- **Reviewing**: Application under review
- **Pending Documents**: Additional documents needed
- **Approved**: Application approved
- **Rejected**: Application not approved

**Features**:
- Status-specific messaging
- Clear next steps
- Visual status badges
- Direct link to portal

### 3. Document Status Changed
**Trigger**: When a document's status changes

**Statuses**:
- **Approved**: Document accepted
- **Rejected**: Document needs to be re-uploaded
- **Reviewing**: Document under review

**Features**:
- Document details
- Rejection reason (if applicable)
- Upload link for rejected documents

## Testing

### Test Application Submission Email

```sql
-- Change an application from draft to submitted
UPDATE financing_applications
SET status = 'submitted'
WHERE id = 'your-test-application-id' AND status = 'draft';
```

### Test Status Change Email

```sql
-- Change application status
UPDATE financing_applications
SET status = 'approved'
WHERE id = 'your-test-application-id';
```

### Test Document Status Email

```sql
-- Change document status
UPDATE uploaded_documents
SET status = 'approved'
WHERE id = 'your-test-document-id';
```

## Customization

### Updating Email Templates

Email templates are defined in `/supabase/functions/send-brevo-email/index.ts` in the `getEmailTemplate()` function.

To customize:
1. Edit the HTML/CSS in the template strings
2. Modify the status messages and next steps
3. Update colors, fonts, or layout
4. Redeploy the Edge Function: `supabase functions deploy send-brevo-email`

### Brand Colors Used

The email templates use Trefa's brand colors:
- **Primary Orange**: `#FF6801`
- **Navy Blue**: `#0B2540`
- **Muted Gray**: `#556675`
- **Background**: `#F7F8FA`
- **Success Green**: `#1E8A56`
- **Danger Red**: `#D64500`

### Updating Portal URLs

The emails contain links to the user portal. Update these in the trigger functions if your domain changes:

```sql
-- In the migration file, update:
status_url := 'https://yourdomain.com/escritorio/solicitudes';
```

## Monitoring

### View Email Logs in Brevo
1. Log in to Brevo
2. Go to **Statistics** → **Email**
3. View sent emails, delivery rates, and opens

### View Trigger Logs in Supabase
1. Go to **Database** → **Functions**
2. Select the notification function
3. Check logs for any errors

### Troubleshooting

**Emails not sending?**
- Verify BREVO_API_KEY is set correctly
- Check that Supabase URL and anon key are configured
- Ensure the Edge Function is deployed
- Check Brevo dashboard for API errors

**Wrong email content?**
- Verify the template data being passed in the trigger functions
- Check that user profiles have email addresses
- Ensure vehicle info exists in car_info JSON field

**Emails going to spam?**
- Configure SPF, DKIM, and DMARC records in Brevo
- Warm up your sender reputation
- Ensure sender email is verified

## Security Notes

1. **Never commit** `.env` files with real API keys
2. Use Supabase secrets for production API keys
3. The notification functions use `SECURITY DEFINER` - ensure they're secure
4. Email sending is asynchronous - failures won't block database operations

## Support

For issues or questions:
- Check Brevo documentation: https://developers.brevo.com/
- Review Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
- Contact the development team

## Next Steps

After setup, consider:
1. Adding email tracking and analytics
2. Creating additional email templates (password reset, etc.)
3. Implementing email preferences for users
4. Adding SMS notifications via Brevo
5. Setting up email A/B testing
