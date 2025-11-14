# Google Sheets Sync Edge Function

This Edge Function automatically syncs financing applications from Supabase to Google Sheets when they are submitted. This enables processing applications in AppSheet or analyzing them in Google Sheets.

## Features

- ✅ **Automatic sync**: Triggered by database webhook when application status changes
- ✅ **All 60+ fields**: Flattens nested JSON into columns (personal info, employment, references, vehicle, etc.)
- ✅ **Non-blocking**: Uses async HTTP requests via `pg_net` to avoid slowing down submissions
- ✅ **Smart header management**: Automatically creates header row if sheet is empty
- ✅ **Error handling**: Logs errors without failing application submissions
- ✅ **Secure**: Uses Google Service Account with OAuth2 authentication

## Architecture

```
User submits application (Application.tsx)
         ↓
Application status → 'submitted' (financing_applications table)
         ↓
Database Trigger (on_application_sync_to_sheets)
         ↓
Calls Edge Function: /google-sheets-sync via pg_net
         ↓
Edge Function:
  1. Authenticates with Google Sheets API
  2. Flattens nested JSON data into row
  3. Ensures header row exists
  4. Appends row to Google Sheet
         ↓
AppSheet / Google Sheets processes the data
```

## Setup Instructions

### Step 1: Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

4. Create a Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Name it: `supabase-sheets-sync`
   - Click "Create and Continue"
   - Skip optional steps and click "Done"

5. Create a Service Account Key:
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose **JSON** format
   - Click "Create" - this downloads a JSON file
   - **Keep this file secure!**

### Step 2: Create and Share Google Sheet

1. Create a new Google Sheet:
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new blank spreadsheet
   - Name it: "Financing Applications" (or your preferred name)
   - Note the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - Note the tab name (default is "Sheet1", you can rename to "Applications")

2. Share the sheet with your Service Account:
   - Open the JSON key file you downloaded
   - Copy the `client_email` value (looks like: `supabase-sheets-sync@your-project.iam.gserviceaccount.com`)
   - In your Google Sheet, click "Share"
   - Paste the service account email
   - Give it **Editor** permissions
   - Uncheck "Notify people"
   - Click "Share"

### Step 3: Configure Supabase Environment Variables

1. Go to your Supabase Dashboard
2. Navigate to "Project Settings" > "Edge Functions"
3. Add the following secrets:

   ```bash
   # Google Service Account credentials (entire JSON file content)
   GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"your-project-id",...}'

   # Your Google Sheet ID (from the URL)
   GOOGLE_SHEET_ID='1ABC123xyz...'

   # Sheet tab name (optional, defaults to "Applications")
   GOOGLE_SHEET_NAME='Applications'
   ```

   To set these via CLI:
   ```bash
   # Copy the entire JSON file content and set it as an environment variable
   supabase secrets set GOOGLE_SHEETS_CREDENTIALS="$(cat path/to/service-account-key.json)"
   supabase secrets set GOOGLE_SHEET_ID="your-sheet-id-here"
   supabase secrets set GOOGLE_SHEET_NAME="Applications"
   ```

### Step 4: Deploy the Edge Function

1. Deploy the function to Supabase:
   ```bash
   supabase functions deploy google-sheets-sync
   ```

2. Verify deployment:
   ```bash
   supabase functions list
   ```

### Step 5: Run Database Migration

1. Apply the database migration to create the trigger:
   ```bash
   supabase db push
   ```

   Or if you're running locally:
   ```bash
   supabase migration up
   ```

2. The migration creates:
   - `trigger_google_sheets_sync()` function
   - `on_application_sync_to_sheets` trigger on `financing_applications` table

### Step 6: Update Trigger Function URL (Important!)

After deploying, you need to update the function URL in the trigger:

1. Get your Supabase project URL from the dashboard
2. Update the migration or run this SQL in your Supabase SQL Editor:

   ```sql
   -- Update this with your actual Supabase project URL
   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project-ref.supabase.co';
   ```

   Replace `your-project-ref` with your actual project reference ID.

## Testing

### Test the Edge Function Directly

You can test the function with a sample payload:

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/google-sheets-sync' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "record": {
      "id": "test-123",
      "user_id": "test-user-id",
      "status": "submitted",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "selected_banks": ["Santander"],
      "personal_info_snapshot": {
        "first_name": "Juan",
        "last_name": "Pérez",
        "email": "juan@example.com",
        "phone": "5551234567"
      },
      "application_data": {
        "company_name": "ACME Corp",
        "job_title": "Engineer",
        "net_monthly_income": "25,000"
      },
      "car_info": {
        "_vehicleTitle": "Honda Civic 2020",
        "_ordenCompra": "OC123",
        "precio": 250000
      }
    }
  }'
```

### Test the Full Flow

1. Submit a test application through your app
2. Check the Supabase logs:
   ```bash
   supabase functions logs google-sheets-sync
   ```
3. Verify the data appears in your Google Sheet
4. Check that all columns are populated correctly

## Column Mapping

The Edge Function flattens 60+ fields into the following columns:

### Application Metadata
- Application ID
- User ID
- Status
- Created At
- Updated At
- Selected Banks

### Personal Information (from profile snapshot)
- First Name, Last Name, Mother Last Name, Full Name
- Email, Phone, RFC, Homoclave
- Birth Date, Civil Status, Spouse Name
- Fiscal Situation

### Address Information
- Profile Address, Colony, City, State, Zip Code (from profile)
- Current Address, Colony, City, State, Zip Code (from application, may differ)
- Time at Address, Housing Type

### Personal Details
- Education Level, Dependents

### Employment Information
- Fiscal Classification
- Company Name, Phone, Website, Address, Industry
- Job Title, Seniority
- Supervisor Name
- Net Monthly Income

### References
- Friend Reference (Name, Phone, Relationship)
- Family Reference (Name, Phone, Relationship)

### Financing Preferences
- Loan Term (Months)
- Down Payment
- Estimated Monthly Payment

### Vehicle Information
- Vehicle Title, Orden Compra
- Vehicle Price
- Recommended/Min Down Payment
- Recommended Monthly Payment
- Max Term
- Vehicle Image URL

### Consent
- Terms Accepted, Survey Consent

### Advisor Information
- Assigned Advisor ID, Advisor Name

## Monitoring & Debugging

### View Edge Function Logs

```bash
# View recent logs
supabase functions logs google-sheets-sync

# Follow logs in real-time
supabase functions logs google-sheets-sync --follow
```

### Check Database Trigger

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_application_sync_to_sheets';

-- View trigger function definition
SELECT pg_get_functiondef('public.trigger_google_sheets_sync'::regproc);

-- Check pg_net queue (for pending HTTP requests)
SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 10;
```

### Common Issues

1. **"GOOGLE_SHEETS_CREDENTIALS environment variable is not set"**
   - Make sure you set the secret in Supabase Dashboard or via CLI
   - Redeploy the function after setting secrets

2. **"Failed to get access token"**
   - Verify the JSON credentials are valid and properly formatted
   - Check that Google Sheets API is enabled in Google Cloud Console
   - Ensure the service account has the correct permissions

3. **"Failed to append to Google Sheet"**
   - Verify the Sheet ID is correct
   - Check that the service account email has Editor access to the sheet
   - Verify the sheet tab name matches GOOGLE_SHEET_NAME

4. **Trigger not firing**
   - Check that the migration was applied successfully
   - Verify pg_net extension is installed: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
   - Check that the function URL is correctly set

## Performance Considerations

- The trigger uses `pg_net` for async HTTP requests, so it won't block application submissions
- Each sync takes approximately 1-2 seconds but runs in the background
- Google Sheets API has rate limits (60 requests per minute per user), but with typical usage this shouldn't be an issue
- If you need to sync many historical applications, use the batch sync script below

## Batch Sync Historical Applications

If you want to sync existing applications to Google Sheets:

```sql
-- Call the edge function for all submitted applications
SELECT net.http_post(
  url := 'https://your-project-ref.supabase.co/functions/v1/google-sheets-sync',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'role'
  ),
  body := jsonb_build_object(
    'record', row_to_json(fa)
  )
)
FROM financing_applications fa
WHERE status IN ('submitted', 'reviewing', 'pending_docs', 'approved', 'rejected')
ORDER BY created_at ASC;
```

## AppSheet Integration

Once your applications are in Google Sheets, you can connect AppSheet:

1. Go to [AppSheet](https://www.appsheet.com/)
2. Create a new app
3. Choose "Google Sheets" as data source
4. Select your "Financing Applications" sheet
5. AppSheet will automatically detect columns and create an app
6. Customize the app views and workflows as needed

## Security Notes

- ✅ Service account credentials are stored securely in Supabase secrets (encrypted at rest)
- ✅ The Edge Function uses HTTPS for all API calls
- ✅ Database trigger has error handling to prevent data loss
- ✅ Service account has minimal permissions (only Sheets API access)
- ⚠️ Google Sheet data is accessible to anyone with the sheet link - restrict sharing appropriately
- ⚠️ Consider using AppSheet's built-in security features for sensitive data

## Support

For issues or questions:
1. Check the Edge Function logs first
2. Verify all environment variables are set correctly
3. Test the function directly with curl
4. Check Google Cloud Console logs for API errors
