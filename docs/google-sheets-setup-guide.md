# Google Sheets Integration - Quick Setup Guide

This guide will walk you through setting up a Google Sheet that automatically syncs your financing application data from Supabase.

## Prerequisites

- Google Account with access to Google Sheets
- Supabase Project URL
- Supabase Service Role Key (found in your Supabase dashboard under Settings → API)

## Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create a new spreadsheet
3. Rename it to "Financing Applications Database" (or your preferred name)

## Step 2: Create the Three Sheets

By default, you'll have one sheet. Create two more:

1. Rename "Sheet1" to **"Applications"**
2. Click the **+** button at the bottom to add a new sheet, name it **"Documents"**
3. Click the **+** button again to add another sheet, name it **"Bank Profiles"**

## Step 3: Add Column Headers

### For "Applications" Sheet:

1. Click on the "Applications" tab
2. In row 1, paste the following headers (they're tab-separated, so they'll go into separate columns):

```
application_id	user_id	status	created_at	updated_at	submitted_at	first_name	last_name	mother_last_name	email	phone	birth_date	rfc	homoclave	fiscal_situation	civil_status	gender	current_address	current_colony	current_city	current_state	current_zip_code	time_at_address	housing_type	grado_de_estudios	dependents	fiscal_classification	company_name	company_phone	supervisor_name	company_website	company_address	company_industry	job_title	job_seniority	net_monthly_income	friend_reference_name	friend_reference_phone	family_reference_name	family_reference_phone	parentesco	loan_term_months	down_payment_amount	estimated_monthly_payment	vehicle_title	ordencompra	vehicle_price	vehicle_recommended_down_payment	vehicle_min_down_payment	vehicle_recommended_monthly	vehicle_max_term	vehicle_image_url	selected_bank_1	selected_bank_2	selected_bank_3	terms_accepted	consent_survey	source	contactado	asesor_asignado_email	tags
```

3. Make the header row bold (select row 1, click **Bold** button)
4. Optionally, freeze the header row: View → Freeze → 1 row

### For "Documents" Sheet:

1. Click on the "Documents" tab
2. In row 1, paste:

```
application_id	user_id	document_type	file_name	file_size_kb	status	uploaded_at
```

3. Make it bold and freeze row 1

### For "Bank Profiles" Sheet:

1. Click on the "Bank Profiles" tab
2. In row 1, paste:

```
user_id	banco_recomendado	banco_segunda_opcion	is_complete	profiling_answers	created_at
```

3. Make it bold and freeze row 1

## Step 4: Add Apps Script

1. In your Google Sheet, click on **Extensions** → **Apps Script**
2. Delete any existing code in the editor
3. Copy the entire script code from `google-sheets-integration-spec.md` (look for the JavaScript code block)
4. Paste it into the Apps Script editor
5. Click the **Save** icon (💾) and name the project "Financing Apps Sync"
6. Close the Apps Script tab

## Step 5: Setup Supabase Credentials

1. Refresh your Google Sheet (press F5 or reload the page)
2. You should see a new menu called **"Supabase Sync"** in the menu bar
3. Click **Supabase Sync** → **Setup Credentials**
4. A dialog will appear
5. Enter your:
   - **Supabase URL**: Something like `https://xxxxx.supabase.co`
   - **Service Role Key**: Your secret service role key (starts with `eyJ...`)
6. Click **Save**

> ⚠️ **Important**: Use the **Service Role Key**, NOT the anon/public key. The service role key is found in Supabase Dashboard → Settings → API → Project API keys → `service_role` (click "Reveal" to see it)

## Step 6: Test the Sync

1. Click **Supabase Sync** → **Sync Now**
2. The first time you run this, Google will ask for permissions:
   - Click **Continue**
   - Select your Google account
   - Click **Advanced** → **Go to Financing Apps Sync (unsafe)**
   - Click **Allow**
3. Wait a few moments for the sync to complete
4. Check your sheets - they should now have data!

## Step 7: Setup Automatic Sync (Optional but Recommended)

1. Go back to **Extensions** → **Apps Script**
2. In the left sidebar, click the **clock icon** (Triggers)
3. Click **+ Add Trigger** in the bottom right
4. Configure:
   - Choose which function to run: **syncFinancingApplications**
   - Choose which deployment: **Head**
   - Select event source: **Time-driven**
   - Select type of time based trigger: **Hour timer** (for hourly sync) OR **Day timer** (for daily sync)
   - Select hour interval: **Every hour** (or your preference)
5. Click **Save**
6. Grant permissions if asked

Now your Google Sheet will automatically update with new financing applications!

## Troubleshooting

### "Permission denied" error
- Make sure you're using the Service Role Key, not the anon key
- Check that your Supabase URL is correct (include `https://`)

### No data appears
- Check the Apps Script logs: Extensions → Apps Script → Execution log
- Verify your Supabase project has financing applications
- Make sure the sheet names match exactly: "Applications", "Documents", "Bank Profiles"

### Script timeout
- If you have many applications, the script might timeout
- Try reducing the amount of data or sync more frequently to handle smaller batches

### Can't find the Service Role Key
1. Go to your Supabase dashboard
2. Click on your project
3. Go to Settings (⚙️ icon in sidebar)
4. Click on **API**
5. Scroll to "Project API keys"
6. Find the `service_role` key and click "Reveal"
7. Copy the entire key (it's very long!)

## What Gets Synced

The script syncs:

1. **All financing applications** with complete user and application data
2. **All uploaded documents** with metadata
3. **All bank profiling data**

The sync is **one-way** from Supabase to Google Sheets. Changes made in Google Sheets won't affect your Supabase database.

## Data Refresh

Each sync **replaces all data** in the sheets with fresh data from Supabase. This ensures:
- No duplicate rows
- All data is up-to-date
- Deleted applications are removed from the sheet

## Tips

- **Formatting**: Feel free to format the sheets (add colors, conditional formatting, etc.) but don't change column order
- **Formulas**: You can add formula columns to the right of the data columns
- **Filters**: Use Google Sheets filters to analyze your data
- **Charts**: Create charts and dashboards using the synced data
- **Sharing**: Share the sheet with your team, but be careful with the Service Role Key access

## Need Help?

If you run into issues:
1. Check the execution logs in Apps Script
2. Verify your Supabase credentials
3. Make sure the sheet names match exactly
4. Ensure you granted all necessary permissions

## Alternative: Manual Sync Only

If you don't want automatic syncing:
- Skip Step 7
- Just use **Supabase Sync → Sync Now** whenever you want to refresh the data
