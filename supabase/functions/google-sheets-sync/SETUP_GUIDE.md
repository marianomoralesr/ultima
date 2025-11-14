# Quick Setup Guide

Follow these steps to get the Google Sheets sync running:

## ⚡ Quick Start (5 minutes)

### 1. Create Google Service Account (2 min)

```bash
# Visit Google Cloud Console
open https://console.cloud.google.com/

# Create project → Enable Google Sheets API → Create Service Account → Download JSON key
```

**Important**: Copy the `client_email` from the JSON file (you'll need it in step 2)

### 2. Create & Share Google Sheet (1 min)

```bash
# Create new Google Sheet
open https://sheets.google.com/

# Share sheet with service account email (from step 1)
# Give it "Editor" permissions
```

**Important**: Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### 3. Set Supabase Secrets (1 min)

```bash
# Set the service account credentials
supabase secrets set GOOGLE_SHEETS_CREDENTIALS="$(cat path/to/your-service-account-key.json)"

# Set the Google Sheet ID
supabase secrets set GOOGLE_SHEET_ID="your-sheet-id-from-step-2"

# Set the sheet tab name (optional, defaults to "Applications")
supabase secrets set GOOGLE_SHEET_NAME="Applications"
```

### 4. Deploy Everything (1 min)

```bash
# Deploy the edge function
supabase functions deploy google-sheets-sync

# Apply the database migration
supabase db push

# Update the function URL in the database
# Replace 'your-project-ref' with your actual Supabase project reference
supabase db execute --query "ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project-ref.supabase.co';"
```

### 5. Test It! (30 seconds)

Submit a test application through your app, then check:

```bash
# View the logs
supabase functions logs google-sheets-sync --follow

# Check your Google Sheet - you should see a new row!
```

## ✅ Verification Checklist

- [ ] Google Sheets API is enabled in Google Cloud Console
- [ ] Service account JSON key is downloaded
- [ ] Google Sheet is created and shared with service account email
- [ ] Sheet ID is copied from URL
- [ ] All three secrets are set in Supabase (check with `supabase secrets list`)
- [ ] Edge function is deployed (check with `supabase functions list`)
- [ ] Database migration is applied
- [ ] Function URL is set in database
- [ ] Test application appears in Google Sheet

## 🚨 Troubleshooting

### "GOOGLE_SHEETS_CREDENTIALS is not set"
```bash
# Verify secrets are set
supabase secrets list

# If missing, set them again
supabase secrets set GOOGLE_SHEETS_CREDENTIALS="$(cat your-key.json)"
```

### "Failed to append to Google Sheet"
- Make sure the Sheet ID is correct
- Verify the service account email has Editor access to the sheet
- Check that the sheet tab name matches GOOGLE_SHEET_NAME

### "Trigger not firing"
```sql
-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_application_sync_to_sheets';

-- If missing, run the migration again
```

### View detailed logs
```bash
# Edge function logs
supabase functions logs google-sheets-sync --follow

# Database logs
supabase db logs

# Check pg_net queue
supabase db execute --query "SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 10;"
```

## 📊 Column Headers

The first time an application syncs, the function will automatically create these column headers:

```
Application ID | User ID | Status | Created At | Updated At | Selected Banks |
First Name | Last Name | Mother Last Name | Full Name | Email | Phone | RFC |
Homoclave | Birth Date | Civil Status | Spouse Name | Fiscal Situation |
Profile Address | Profile Colony | Profile City | Profile State | Profile Zip Code |
Current Address | Current Colony | Current City | Current State | Current Zip Code |
Time at Address | Housing Type | Education Level | Dependents |
Fiscal Classification | Company Name | Company Phone | Supervisor Name |
Company Website | Company Address | Company Industry | Job Title | Job Seniority |
Net Monthly Income | Friend Reference Name | Friend Reference Phone |
Friend Reference Relationship | Family Reference Name | Family Reference Phone |
Family Relationship | Loan Term (Months) | Down Payment |
Estimated Monthly Payment | Vehicle Title | Orden Compra | Vehicle Price |
Recommended Down Payment | Min Down Payment | Recommended Monthly Payment |
Max Term | Vehicle Image URL | Terms Accepted | Survey Consent |
Assigned Advisor ID | Advisor Name
```

## 🎯 Next Steps

1. **Customize the sheet**: Add formatting, freeze header row, add filters
2. **Connect to AppSheet**: Import the sheet and build your app
3. **Set up monitoring**: Create alerts for new applications
4. **Batch sync existing data**: Use the SQL query in README.md to sync historical applications

## 🔗 Useful Links

- [Full Documentation](./README.md)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [AppSheet Documentation](https://help.appsheet.com/)

---

**Need help?** Check the [full README](./README.md) for detailed troubleshooting and advanced configuration.
