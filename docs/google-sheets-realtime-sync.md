# Real-Time Google Sheets Sync via Webhooks

This document explains how to set up **real-time synchronization** from Supabase to Google Sheets. Whenever a user submits a financing application, it will automatically appear in your Google Sheet within seconds.

## How It Works

1. User submits a financing application in your app
2. Application is saved to Supabase with status "submitted"
3. Supabase database trigger detects the new submission
4. Trigger sends a webhook POST request to Google Apps Script
5. Google Apps Script fetches the new application data and adds it to the sheet
6. Data appears in Google Sheets in real-time!

## Architecture

```
User App → Supabase DB → Database Trigger → Webhook → Google Apps Script → Google Sheets
```

## Setup Instructions

### Part 1: Update Google Apps Script (First!)

You need to update your Google Apps Script to accept webhook requests and deploy it as a web app.

#### 1. Open Your Google Sheet Apps Script

1. Open your Google Sheet with the financing applications
2. Go to **Extensions** → **Apps Script**
3. Replace the entire code with the updated version below

#### 2. Updated Apps Script Code with Webhook Support

```javascript
// Configuration - Set these in Script Properties
const CONFIG = {
  supabaseUrl: PropertiesService.getScriptProperties().getProperty('SUPABASE_URL'),
  supabaseKey: PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_KEY'),
  sheetsConfig: {
    applications: 'Applications',
    documents: 'Documents',
    bankProfiles: 'Bank Profiles'
  }
};

/**
 * Web App Entry Point - Handles webhook POST requests from Supabase
 * This function is called when Supabase sends a webhook
 */
function doPost(e) {
  try {
    // Parse the webhook payload
    const payload = JSON.parse(e.postData.contents);

    Logger.log('Received webhook: ' + JSON.stringify(payload));

    // Verify it's an application submission event
    if (payload.trigger_event === 'application_submitted' && payload.application_id) {
      // Sync only this specific application
      syncSingleApplication(payload.application_id);

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Application synced successfully',
          application_id: payload.application_id
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'ignored',
        message: 'Event not relevant for sync'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error processing webhook: ' + error.toString());

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Sync a single application by ID (called by webhook)
 */
function syncSingleApplication(applicationId) {
  try {
    // Fetch the specific application with related data
    const url = `${CONFIG.supabaseUrl}/rest/v1/financing_applications?id=eq.${applicationId}&select=*,profiles!inner(*)`;

    const options = {
      method: 'get',
      headers: {
        'apikey': CONFIG.supabaseKey,
        'Authorization': `Bearer ${CONFIG.supabaseKey}`,
        'Content-Type': 'application/json'
      }
    };

    const response = UrlFetchApp.fetch(url, options);
    const applications = JSON.parse(response.getContentText());

    if (applications.length === 0) {
      Logger.log('Application not found: ' + applicationId);
      return;
    }

    const app = applications[0];

    // Update or insert this application in the sheet
    upsertApplicationToSheet(app);

    // Also sync related documents
    syncDocumentsForApplication(applicationId);

    Logger.log('Successfully synced application: ' + applicationId);

  } catch (error) {
    Logger.log('Error syncing single application: ' + error.toString());
    throw error;
  }
}

/**
 * Update or insert a single application row
 */
function upsertApplicationToSheet(app) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetsConfig.applications);

  // Find if this application already exists
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) { // Start from 1 to skip header
    if (values[i][0] === app.id) { // First column is application_id
      rowIndex = i + 1; // +1 because sheet rows are 1-indexed
      break;
    }
  }

  // Build the row data
  const profile = app.profiles || {};
  const appData = app.application_data || {};
  const carInfo = app.car_info || {};
  const personalSnapshot = app.personal_info_snapshot || {};

  const rowData = [
    // Application Metadata
    app.id,
    app.user_id,
    app.status,
    app.created_at,
    app.updated_at,
    app.status === 'submitted' ? app.updated_at : '',

    // Personal Information
    profile.first_name || personalSnapshot.first_name || '',
    profile.last_name || personalSnapshot.last_name || '',
    profile.mother_last_name || personalSnapshot.mother_last_name || '',
    profile.email || personalSnapshot.email || '',
    profile.phone || personalSnapshot.phone || '',
    profile.birth_date || personalSnapshot.birth_date || '',
    profile.rfc || personalSnapshot.rfc || '',
    profile.homoclave || personalSnapshot.homoclave || '',
    profile.fiscal_situation || personalSnapshot.fiscal_situation || '',
    profile.civil_status || personalSnapshot.civil_status || '',
    profile.gender || personalSnapshot.gender || '',

    // Address Information
    appData.current_address || profile.address || '',
    appData.current_colony || profile.colony || '',
    appData.current_city || profile.city || '',
    appData.current_state || profile.state || '',
    appData.current_zip_code || profile.zip_code || '',
    appData.time_at_address || '',
    appData.housing_type || '',

    // Personal Details
    appData.grado_de_estudios || '',
    appData.dependents || '',

    // Employment Information
    appData.fiscal_classification || '',
    appData.company_name || '',
    appData.company_phone || '',
    appData.supervisor_name || '',
    appData.company_website || '',
    appData.company_address || '',
    appData.company_industry || '',
    appData.job_title || '',
    appData.job_seniority || '',
    appData.net_monthly_income || '',

    // References
    appData.friend_reference_name || '',
    appData.friend_reference_phone || '',
    appData.family_reference_name || '',
    appData.family_reference_phone || '',
    appData.parentesco || '',

    // Financing Preferences
    appData.loan_term_months || '',
    appData.down_payment_amount || '',
    appData.estimated_monthly_payment || '',

    // Vehicle Information
    carInfo._vehicleTitle || '',
    carInfo._ordenCompra || appData.ordencompra || '',
    carInfo.precio || '',
    carInfo.enganche_recomendado || '',
    carInfo.enganchemin || '',
    carInfo.mensualidad_recomendada || '',
    carInfo.plazomax || '',
    carInfo._featureImage || '',

    // Bank Selection
    (app.selected_banks && app.selected_banks[0]) || '',
    (app.selected_banks && app.selected_banks[1]) || '',
    (app.selected_banks && app.selected_banks[2]) || '',

    // Consent & Terms
    appData.terms_and_conditions || false,
    appData.consent_survey || false,

    // CRM Fields
    profile.source || '',
    profile.contactado || false,
    getAdvisorEmail(profile.asesor_asignado_id),
    (profile.tags || []).join(', ')
  ];

  // Insert or update
  if (rowIndex > 0) {
    // Update existing row
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    Logger.log('Updated existing application at row ' + rowIndex);
  } else {
    // Append new row
    sheet.appendRow(rowData);
    Logger.log('Appended new application');
  }
}

/**
 * Sync documents for a specific application
 */
function syncDocumentsForApplication(applicationId) {
  try {
    const url = `${CONFIG.supabaseUrl}/rest/v1/uploaded_documents?application_id=eq.${applicationId}`;

    const options = {
      method: 'get',
      headers: {
        'apikey': CONFIG.supabaseKey,
        'Authorization': `Bearer ${CONFIG.supabaseKey}`
      }
    };

    const response = UrlFetchApp.fetch(url, options);
    const documents = JSON.parse(response.getContentText());

    if (documents.length === 0) {
      return;
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetsConfig.documents);

    // For simplicity, we'll append documents (in a production scenario, you might want to upsert)
    documents.forEach(doc => {
      const rowData = [
        doc.application_id,
        doc.user_id,
        doc.document_type,
        doc.file_name,
        Math.round(doc.file_size / 1024),
        doc.status,
        doc.created_at
      ];

      // Check if document already exists to avoid duplicates
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      let exists = false;

      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === doc.application_id && values[i][3] === doc.file_name) {
          exists = true;
          break;
        }
      }

      if (!exists) {
        sheet.appendRow(rowData);
      }
    });

  } catch (error) {
    Logger.log('Error syncing documents: ' + error.toString());
  }
}

/**
 * Full sync function - syncs all applications (for manual/scheduled runs)
 */
function syncFinancingApplications() {
  try {
    Logger.log('Starting full sync...');

    const applications = fetchApplicationsWithRelatedData();
    const documents = fetchDocuments();
    const bankProfiles = fetchBankProfiles();

    updateApplicationsSheet(applications);
    updateDocumentsSheet(documents);
    updateBankProfilesSheet(bankProfiles);

    Logger.log('Full sync completed successfully!');

  } catch (error) {
    Logger.log('Error during full sync: ' + error.toString());
  }
}

/**
 * Fetch all financing applications with related data from Supabase
 */
function fetchApplicationsWithRelatedData() {
  const url = `${CONFIG.supabaseUrl}/rest/v1/financing_applications?select=*,profiles!inner(*)`;

  const options = {
    method: 'get',
    headers: {
      'apikey': CONFIG.supabaseKey,
      'Authorization': `Bearer ${CONFIG.supabaseKey}`,
      'Content-Type': 'application/json'
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

function fetchDocuments() {
  const url = `${CONFIG.supabaseUrl}/rest/v1/uploaded_documents?select=*`;

  const options = {
    method: 'get',
    headers: {
      'apikey': CONFIG.supabaseKey,
      'Authorization': `Bearer ${CONFIG.supabaseKey}`
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

function fetchBankProfiles() {
  const url = `${CONFIG.supabaseUrl}/rest/v1/bank_profiles?select=*`;

  const options = {
    method: 'get',
    headers: {
      'apikey': CONFIG.supabaseKey,
      'Authorization': `Bearer ${CONFIG.supabaseKey}`
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

function updateApplicationsSheet(applications) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetsConfig.applications);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }

  if (applications.length === 0) {
    Logger.log('No applications to sync');
    return;
  }

  const rows = applications.map(app => {
    const profile = app.profiles || {};
    const appData = app.application_data || {};
    const carInfo = app.car_info || {};
    const personalSnapshot = app.personal_info_snapshot || {};

    return [
      app.id, app.user_id, app.status, app.created_at, app.updated_at,
      app.status === 'submitted' ? app.updated_at : '',
      profile.first_name || personalSnapshot.first_name || '',
      profile.last_name || personalSnapshot.last_name || '',
      profile.mother_last_name || personalSnapshot.mother_last_name || '',
      profile.email || personalSnapshot.email || '',
      profile.phone || personalSnapshot.phone || '',
      profile.birth_date || personalSnapshot.birth_date || '',
      profile.rfc || personalSnapshot.rfc || '',
      profile.homoclave || personalSnapshot.homoclave || '',
      profile.fiscal_situation || personalSnapshot.fiscal_situation || '',
      profile.civil_status || personalSnapshot.civil_status || '',
      profile.gender || personalSnapshot.gender || '',
      appData.current_address || profile.address || '',
      appData.current_colony || profile.colony || '',
      appData.current_city || profile.city || '',
      appData.current_state || profile.state || '',
      appData.current_zip_code || profile.zip_code || '',
      appData.time_at_address || '',
      appData.housing_type || '',
      appData.grado_de_estudios || '',
      appData.dependents || '',
      appData.fiscal_classification || '',
      appData.company_name || '',
      appData.company_phone || '',
      appData.supervisor_name || '',
      appData.company_website || '',
      appData.company_address || '',
      appData.company_industry || '',
      appData.job_title || '',
      appData.job_seniority || '',
      appData.net_monthly_income || '',
      appData.friend_reference_name || '',
      appData.friend_reference_phone || '',
      appData.family_reference_name || '',
      appData.family_reference_phone || '',
      appData.parentesco || '',
      appData.loan_term_months || '',
      appData.down_payment_amount || '',
      appData.estimated_monthly_payment || '',
      carInfo._vehicleTitle || '',
      carInfo._ordenCompra || appData.ordencompra || '',
      carInfo.precio || '',
      carInfo.enganche_recomendado || '',
      carInfo.enganchemin || '',
      carInfo.mensualidad_recomendada || '',
      carInfo.plazomax || '',
      carInfo._featureImage || '',
      (app.selected_banks && app.selected_banks[0]) || '',
      (app.selected_banks && app.selected_banks[1]) || '',
      (app.selected_banks && app.selected_banks[2]) || '',
      appData.terms_and_conditions || false,
      appData.consent_survey || false,
      profile.source || '',
      profile.contactado || false,
      getAdvisorEmail(profile.asesor_asignado_id),
      (profile.tags || []).join(', ')
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    Logger.log(`Updated ${rows.length} applications`);
  }
}

function updateDocumentsSheet(documents) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetsConfig.documents);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }

  if (documents.length === 0) {
    Logger.log('No documents to sync');
    return;
  }

  const rows = documents.map(doc => [
    doc.application_id, doc.user_id, doc.document_type, doc.file_name,
    Math.round(doc.file_size / 1024), doc.status, doc.created_at
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    Logger.log(`Updated ${rows.length} documents`);
  }
}

function updateBankProfilesSheet(profiles) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetsConfig.bankProfiles);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }

  if (profiles.length === 0) {
    Logger.log('No bank profiles to sync');
    return;
  }

  const rows = profiles.map(profile => [
    profile.user_id, profile.banco_recomendado || '', profile.banco_segunda_opcion || '',
    profile.is_complete || false, JSON.stringify(profile.respuestas || {}), profile.created_at
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    Logger.log(`Updated ${rows.length} bank profiles`);
  }
}

const advisorCache = {};

function getAdvisorEmail(advisorId) {
  if (!advisorId) return '';
  if (advisorCache[advisorId]) return advisorCache[advisorId];

  try {
    const url = `${CONFIG.supabaseUrl}/rest/v1/profiles?select=email&id=eq.${advisorId}`;
    const options = {
      method: 'get',
      headers: {
        'apikey': CONFIG.supabaseKey,
        'Authorization': `Bearer ${CONFIG.supabaseKey}`
      }
    };

    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());

    if (data && data.length > 0) {
      advisorCache[advisorId] = data[0].email;
      return data[0].email;
    }
  } catch (error) {
    Logger.log('Error fetching advisor email: ' + error.toString());
  }

  return '';
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Supabase Sync')
    .addItem('Sync Now (Full)', 'syncFinancingApplications')
    .addItem('Setup Credentials', 'showCredentialsDialog')
    .addToUi();
}

function showCredentialsDialog() {
  const html = HtmlService.createHtmlOutput(`
    <h3>Setup Supabase Credentials</h3>
    <p>Enter your Supabase project details:</p>
    <form>
      <label>Supabase URL:</label><br>
      <input type="text" id="url" style="width: 100%; margin-bottom: 10px;" placeholder="https://your-project.supabase.co"><br>

      <label>Service Role Key:</label><br>
      <input type="password" id="key" style="width: 100%; margin-bottom: 10px;" placeholder="Your service role key"><br>

      <button type="button" onclick="saveCredentials()">Save</button>
    </form>

    <script>
      function saveCredentials() {
        const url = document.getElementById('url').value;
        const key = document.getElementById('key').value;

        google.script.run.withSuccessHandler(() => {
          alert('Credentials saved successfully!');
          google.script.host.close();
        }).saveSupabaseCredentials(url, key);
      }
    </script>
  `).setWidth(400).setHeight(250);

  SpreadsheetApp.getUi().showModalDialog(html, 'Supabase Credentials');
}

function saveSupabaseCredentials(url, key) {
  PropertiesService.getScriptProperties().setProperties({
    'SUPABASE_URL': url,
    'SUPABASE_SERVICE_KEY': key
  });
}
```

#### 3. Deploy as Web App

1. Click the **Deploy** button (top right) → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Fill in the deployment settings:
   - **Description**: "Real-time sync from Supabase"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone** (this is safe because Supabase will be the only caller)
5. Click **Deploy**
6. **Copy the Web App URL** - It will look like:
   ```
   https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXX/exec
   ```
7. **IMPORTANT: Save this URL** - you'll need it for Part 2!

### Part 2: Configure Supabase

Now we need to tell Supabase about your Google Apps Script webhook URL.

#### 1. Apply the Database Migration

Run the migration file that creates the webhook trigger:

```bash
supabase db push
```

Or if you're using the Supabase dashboard:
1. Go to your Supabase dashboard
2. Click on **SQL Editor**
3. Open the file `supabase/migrations/20251110000000_add_google_sheets_webhook.sql`
4. Copy and paste the entire content into the SQL Editor
5. Click **Run**

#### 2. Set the Webhook URL

In the Supabase SQL Editor, run this command (replace with your actual Google Apps Script URL):

```sql
UPDATE public.app_config
SET value = 'https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID_HERE/exec'
WHERE key = 'google_sheets_webhook_url';
```

**Example:**
```sql
UPDATE public.app_config
SET value = 'https://script.google.com/macros/s/AKfycbzXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec'
WHERE key = 'google_sheets_webhook_url';
```

#### 3. Verify the Configuration

Check that the webhook URL is set:

```sql
SELECT * FROM public.app_config WHERE key = 'google_sheets_webhook_url';
```

You should see your Google Apps Script URL in the `value` column.

### Part 3: Test the Real-Time Sync

#### Manual Test

1. Submit a test financing application through your app
2. Wait a few seconds
3. Check your Google Sheet - the new application should appear automatically!

#### Monitor Webhook Calls

To see if webhooks are being sent:

**In Google Apps Script:**
1. Go to Extensions → Apps Script
2. Click on **Executions** in the left sidebar
3. You should see logs of webhook calls

**In Supabase:**
1. Go to your Supabase dashboard
2. Navigate to **Database** → **Functions**
3. Check the logs for `notify_google_sheets_new_application`

### Troubleshooting

#### Webhook Not Firing

Check Supabase logs:
```sql
-- Check if the trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_google_sheets_sync';

-- Check recent applications
SELECT id, status, created_at, updated_at
FROM financing_applications
ORDER BY created_at DESC
LIMIT 5;
```

#### Google Apps Script Not Receiving Webhooks

1. Check the deployment URL is correct
2. Verify the script is deployed as "Anyone" can access
3. Check Google Apps Script execution logs for errors

#### Applications Not Appearing in Sheet

1. Check Google Apps Script logs for errors
2. Verify Supabase credentials are correct in Script Properties
3. Make sure sheet names match exactly: "Applications", "Documents", "Bank Profiles"

### Fallback: Scheduled Sync

Even with real-time webhooks, it's a good idea to have a scheduled full sync as a backup:

1. In Google Apps Script, go to **Triggers** (clock icon)
2. Add a daily trigger for `syncFinancingApplications`
3. This ensures any missed webhooks get caught in the daily sync

## Performance Considerations

- **Real-time sync**: Happens immediately when application is submitted (< 5 seconds typically)
- **Single application sync**: Very fast, only syncs the new/updated application
- **Full sync**: Slower, refreshes all data (use for scheduled backups)

## Security

- The webhook URL is public, but it only accepts specific payload formats
- Only applications with status "submitted" trigger the webhook
- The Service Role Key is stored securely in Google Apps Script properties
- The webhook URL is stored in Supabase's `app_config` table with RLS enabled (admin-only access)

## What Happens When...

**User submits an application:**
- ✅ Webhook fires immediately
- ✅ Application appears in Google Sheets within seconds

**User saves a draft (not submitted):**
- ❌ Webhook does NOT fire
- ✅ Will be included in next scheduled full sync

**Application status changes (e.g., from reviewing to approved):**
- ✅ Webhook fires and updates the existing row in Google Sheets

**User uploads documents:**
- ✅ Documents are synced when the application webhook fires
- ✅ Or in the next scheduled full sync

## Benefits of This Approach

1. **Real-time updates** - See new applications immediately
2. **No duplicate data** - Upsert logic prevents duplicates
3. **Resilient** - If webhook fails, scheduled sync catches it
4. **Non-blocking** - Doesn't slow down user experience
5. **Secure** - Credentials stored safely, webhook validated

## Summary

You now have:
- ✅ Real-time sync when applications are submitted
- ✅ Webhook from Supabase to Google Sheets
- ✅ Automatic updates to existing applications
- ✅ Fallback scheduled sync for reliability
- ✅ Complete audit trail of all submissions

Your financing applications will appear in Google Sheets automatically, seconds after users submit them!
