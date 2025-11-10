# Google Sheets Integration for Financing Applications

## Overview
This document outlines the complete structure for a Google Sheets integration that captures all financing application data from your Supabase database.

## Implementation Approach

### Option 1: Google Apps Script (Recommended)
**Pros:**
- No changes to existing application code
- Centralized data pulling from Supabase
- Can run on schedule or on-demand
- Easier to maintain and update
- No additional server dependencies

**Cons:**
- Requires manual setup in Google Sheets
- Slightly delayed data sync (depends on trigger frequency)

### Option 2: Direct Write from Application
**Pros:**
- Real-time data sync
- Immediate updates when application is submitted

**Cons:**
- Requires changes to application submission flow
- Needs Google Sheets API credentials management
- Additional failure point in submission process
- Could slow down user experience if API is slow

**Recommendation:** Use Google Apps Script approach to avoid affecting the user submission experience and keep the integration separate from critical application flow.

## Google Sheets Structure

### Sheet 1: Applications (Main Data)

#### Application Metadata
| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| application_id | UUID | financing_applications.id | Unique application identifier |
| user_id | UUID | financing_applications.user_id | User identifier |
| status | Text | financing_applications.status | Application status (draft, submitted, reviewing, etc.) |
| created_at | Timestamp | financing_applications.created_at | Application creation date |
| updated_at | Timestamp | financing_applications.updated_at | Last update date |
| submitted_at | Timestamp | Derived from status change | When status changed to submitted |

#### Personal Information (from profiles table + personal_info_snapshot)
| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| first_name | Text | profiles.first_name | User's first name |
| last_name | Text | profiles.last_name | User's last name |
| mother_last_name | Text | profiles.mother_last_name | User's mother's last name |
| email | Text | profiles.email | User's email address |
| phone | Text | profiles.phone | User's phone number |
| birth_date | Date | profiles.birth_date | User's date of birth |
| rfc | Text | profiles.rfc | RFC (tax ID) |
| homoclave | Text | profiles.homoclave | RFC homoclave |
| fiscal_situation | Text | profiles.fiscal_situation | Fiscal situation |
| civil_status | Text | profiles.civil_status | Marital status |
| gender | Text | profiles.gender | Gender |

#### Address Information (from application_data)
| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| current_address | Text | application_data.current_address | Street address |
| current_colony | Text | application_data.current_colony | Neighborhood/Colony |
| current_city | Text | application_data.current_city | City |
| current_state | Text | application_data.current_state | State |
| current_zip_code | Text | application_data.current_zip_code | Zip/Postal code |
| time_at_address | Text | application_data.time_at_address | Time living at address |
| housing_type | Text | application_data.housing_type | Type of housing (Propia, Rentada, Familiar) |

#### Personal Details (from application_data)
| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| grado_de_estudios | Text | application_data.grado_de_estudios | Education level |
| dependents | Text | application_data.dependents | Number of dependents |

#### Employment Information (from application_data)
| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| fiscal_classification | Text | application_data.fiscal_classification | Fiscal classification |
| company_name | Text | application_data.company_name | Employer name |
| company_phone | Text | application_data.company_phone | Company phone number |
| supervisor_name | Text | application_data.supervisor_name | Supervisor's name |
| company_website | Text | application_data.company_website | Company website |
| company_address | Text | application_data.company_address | Company address |
| company_industry | Text | application_data.company_industry | Industry/Sector |
| job_title | Text | application_data.job_title | Job title |
| job_seniority | Text | application_data.job_seniority | Job seniority/tenure |
| net_monthly_income | Text | application_data.net_monthly_income | Monthly net income |

#### References (from application_data)
| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| friend_reference_name | Text | application_data.friend_reference_name | Friend reference name |
| friend_reference_phone | Text | application_data.friend_reference_phone | Friend reference phone |
| family_reference_name | Text | application_data.family_reference_name | Family reference name |
| family_reference_phone | Text | application_data.family_reference_phone | Family reference phone |
| parentesco | Text | application_data.parentesco | Family relationship |

#### Financing Preferences (from application_data)
| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| loan_term_months | Number | application_data.loan_term_months | Loan term in months |
| down_payment_amount | Number | application_data.down_payment_amount | Down payment amount |
| estimated_monthly_payment | Number | application_data.estimated_monthly_payment | Estimated monthly payment |

#### Vehicle Information (from car_info)
| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| vehicle_title | Text | car_info._vehicleTitle | Vehicle title/name |
| ordencompra | Text | car_info._ordenCompra or application_data.ordencompra | Order/vehicle ID |
| vehicle_price | Number | car_info.precio | Vehicle price |
| vehicle_recommended_down_payment | Number | car_info.enganche_recomendado | Recommended down payment |
| vehicle_min_down_payment | Number | car_info.enganchemin | Minimum down payment |
| vehicle_recommended_monthly | Number | car_info.mensualidad_recomendada | Recommended monthly payment |
| vehicle_max_term | Number | car_info.plazomax | Maximum loan term |
| vehicle_image_url | Text | car_info._featureImage | Vehicle image URL |

#### Bank Selection (from selected_banks)
| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| selected_bank_1 | Text | selected_banks[0] | Primary selected bank |
| selected_bank_2 | Text | selected_banks[1] | Secondary bank (if any) |
| selected_bank_3 | Text | selected_banks[2] | Tertiary bank (if any) |

#### Consent & Terms (from application_data)
| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| terms_accepted | Boolean | application_data.terms_and_conditions | Terms acceptance |
| consent_survey | Boolean | application_data.consent_survey | Survey consent |

#### CRM Fields (from profiles)
| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| source | Text | profiles.source | Lead source |
| contactado | Boolean | profiles.contactado | Has been contacted |
| asesor_asignado_email | Text | Derived from asesor_asignado_id | Assigned advisor email |
| tags | Text | profiles.tags (joined) | Associated tags |

### Sheet 2: Documents Tracking

| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| application_id | UUID | uploaded_documents.application_id | Reference to application |
| user_id | UUID | uploaded_documents.user_id | User identifier |
| document_type | Text | uploaded_documents.document_type | Type of document |
| file_name | Text | uploaded_documents.file_name | Original filename |
| file_size_kb | Number | uploaded_documents.file_size / 1024 | File size in KB |
| status | Text | uploaded_documents.status | Document status |
| uploaded_at | Timestamp | uploaded_documents.created_at | Upload timestamp |

### Sheet 3: Bank Profiling Data

| Column Name | Data Type | Source | Description |
|------------|-----------|--------|-------------|
| user_id | UUID | bank_profiles.user_id | User identifier |
| banco_recomendado | Text | bank_profiles.banco_recomendado | Recommended bank |
| banco_segunda_opcion | Text | bank_profiles.banco_segunda_opcion | Second option bank |
| is_complete | Boolean | bank_profiles.is_complete | Profile completion status |
| profiling_answers | JSON | bank_profiles.respuestas | Full questionnaire responses |
| created_at | Timestamp | bank_profiles.created_at | Profile creation date |

## Google Apps Script Implementation

### Setup Instructions

1. Create a new Google Sheet
2. Set up the three sheets with the column headers above
3. Go to Extensions → Apps Script
4. Paste the script code (see below)
5. Set up Supabase credentials in Script Properties
6. Set up a time-based trigger to run periodically

### Script Code

```javascript
// Script Properties Required:
// - SUPABASE_URL: Your Supabase project URL
// - SUPABASE_SERVICE_KEY: Your Supabase service role key (NOT anon key)

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
 * Main function to sync all financing applications from Supabase to Google Sheets
 */
function syncFinancingApplications() {
  try {
    Logger.log('Starting sync...');

    // Fetch data from Supabase
    const applications = fetchApplicationsWithRelatedData();
    const documents = fetchDocuments();
    const bankProfiles = fetchBankProfiles();

    // Update Google Sheets
    updateApplicationsSheet(applications);
    updateDocumentsSheet(documents);
    updateBankProfilesSheet(bankProfiles);

    Logger.log('Sync completed successfully!');

    // Update last sync timestamp
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    sheet.getRangeByName('LastSync').setValue(new Date());

  } catch (error) {
    Logger.log('Error during sync: ' + error.toString());
    // Optional: Send email notification on error
    // MailApp.sendEmail('your@email.com', 'Sync Failed', error.toString());
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

/**
 * Fetch documents data
 */
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

/**
 * Fetch bank profiles data
 */
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

/**
 * Update Applications sheet with fetched data
 */
function updateApplicationsSheet(applications) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetsConfig.applications);

  // Clear existing data (keeping headers)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }

  if (applications.length === 0) {
    Logger.log('No applications to sync');
    return;
  }

  // Prepare data rows
  const rows = applications.map(app => {
    const profile = app.profiles || {};
    const appData = app.application_data || {};
    const carInfo = app.car_info || {};
    const personalSnapshot = app.personal_info_snapshot || {};

    return [
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
  });

  // Write data to sheet
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    Logger.log(`Updated ${rows.length} applications`);
  }
}

/**
 * Update Documents sheet
 */
function updateDocumentsSheet(documents) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetsConfig.documents);

  // Clear existing data (keeping headers)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }

  if (documents.length === 0) {
    Logger.log('No documents to sync');
    return;
  }

  const rows = documents.map(doc => [
    doc.application_id,
    doc.user_id,
    doc.document_type,
    doc.file_name,
    Math.round(doc.file_size / 1024), // Convert to KB
    doc.status,
    doc.created_at
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    Logger.log(`Updated ${rows.length} documents`);
  }
}

/**
 * Update Bank Profiles sheet
 */
function updateBankProfilesSheet(profiles) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetsConfig.bankProfiles);

  // Clear existing data (keeping headers)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }

  if (profiles.length === 0) {
    Logger.log('No bank profiles to sync');
    return;
  }

  const rows = profiles.map(profile => [
    profile.user_id,
    profile.banco_recomendado || '',
    profile.banco_segunda_opcion || '',
    profile.is_complete || false,
    JSON.stringify(profile.respuestas || {}),
    profile.created_at
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    Logger.log(`Updated ${rows.length} bank profiles`);
  }
}

/**
 * Helper function to get advisor email by ID
 * (Caches results to minimize API calls)
 */
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

/**
 * Create menu item for manual sync
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Supabase Sync')
    .addItem('Sync Now', 'syncFinancingApplications')
    .addItem('Setup Credentials', 'showCredentialsDialog')
    .addToUi();
}

/**
 * Show dialog to setup Supabase credentials
 */
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

/**
 * Save Supabase credentials to script properties
 */
function saveSupabaseCredentials(url, key) {
  PropertiesService.getScriptProperties().setProperties({
    'SUPABASE_URL': url,
    'SUPABASE_SERVICE_KEY': key
  });
}
```

## Column Headers for Copy-Paste

### Applications Sheet Headers (Row 1):
```
application_id	user_id	status	created_at	updated_at	submitted_at	first_name	last_name	mother_last_name	email	phone	birth_date	rfc	homoclave	fiscal_situation	civil_status	gender	current_address	current_colony	current_city	current_state	current_zip_code	time_at_address	housing_type	grado_de_estudios	dependents	fiscal_classification	company_name	company_phone	supervisor_name	company_website	company_address	company_industry	job_title	job_seniority	net_monthly_income	friend_reference_name	friend_reference_phone	family_reference_name	family_reference_phone	parentesco	loan_term_months	down_payment_amount	estimated_monthly_payment	vehicle_title	ordencompra	vehicle_price	vehicle_recommended_down_payment	vehicle_min_down_payment	vehicle_recommended_monthly	vehicle_max_term	vehicle_image_url	selected_bank_1	selected_bank_2	selected_bank_3	terms_accepted	consent_survey	source	contactado	asesor_asignado_email	tags
```

### Documents Sheet Headers (Row 1):
```
application_id	user_id	document_type	file_name	file_size_kb	status	uploaded_at
```

### Bank Profiles Sheet Headers (Row 1):
```
user_id	banco_recomendado	banco_segunda_opcion	is_complete	profiling_answers	created_at
```

## Next Steps

1. **Create the Google Sheet**
   - Create a new Google Sheet
   - Create three sheets with the names: "Applications", "Documents", "Bank Profiles"
   - Copy-paste the headers above into each sheet

2. **Setup Apps Script**
   - Open Extensions → Apps Script
   - Paste the script code
   - Save the project

3. **Configure Credentials**
   - Get your Supabase URL and Service Role Key from your Supabase dashboard
   - Run the script and use the menu to setup credentials

4. **Setup Automated Sync**
   - In Apps Script, click on the clock icon (Triggers)
   - Create a time-based trigger to run `syncFinancingApplications`
   - Recommended: Every 1 hour or every day at a specific time

5. **Test**
   - Run the script manually first to verify it works
   - Check that data appears correctly in all three sheets

## Security Considerations

- The Service Role Key should be kept secure
- Only share the Google Sheet with authorized personnel
- Consider setting up a read-only view for stakeholders
- The script runs with your Google account permissions

## Maintenance

- The script will automatically pull new applications
- Existing rows are refreshed with each sync
- Monitor the script execution logs in Apps Script dashboard
- Set up email notifications for script failures (optional)
