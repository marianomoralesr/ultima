import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Google Sheets API configuration
const GOOGLE_SHEETS_CREDENTIALS = Deno.env.get('GOOGLE_SHEETS_CREDENTIALS');
const GOOGLE_SHEET_ID = Deno.env.get('GOOGLE_SHEET_ID');
const GOOGLE_SHEET_NAME = Deno.env.get('GOOGLE_SHEET_NAME') || 'Applications';

interface ApplicationData {
  id: string;
  user_id: string;
  status: string;
  car_info: any;
  personal_info_snapshot: any;
  application_data: any;
  selected_banks: string[];
  created_at: string;
  updated_at: string;
}

interface GoogleSheetsCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * Flatten application data into a single row for Google Sheets
 */
function flattenApplicationData(app: ApplicationData): Record<string, any> {
  const profile = app.personal_info_snapshot || {};
  const appData = app.application_data || {};
  const carInfo = app.car_info || {};

  return {
    // Application metadata
    'Application ID': app.id,
    'User ID': app.user_id,
    'Status': app.status,
    'Created At': app.created_at,
    'Updated At': app.updated_at,
    'Selected Banks': (app.selected_banks || []).join(', '),

    // Personal information from profile snapshot
    'First Name': profile.first_name || '',
    'Last Name': profile.last_name || '',
    'Mother Last Name': profile.mother_last_name || '',
    'Full Name': `${profile.first_name || ''} ${profile.last_name || ''} ${profile.mother_last_name || ''}`.trim(),
    'Email': profile.email || '',
    'Phone': profile.phone || '',
    'RFC': profile.rfc || '',
    'Homoclave': profile.homoclave || '',
    'Birth Date': profile.birth_date || '',
    'Civil Status': profile.civil_status || '',
    'Spouse Name': profile.spouse_name || '',
    'Fiscal Situation': profile.fiscal_situation || '',

    // Profile address (from profile snapshot)
    'Profile Address': profile.address || '',
    'Profile Colony': profile.colony || '',
    'Profile City': profile.city || '',
    'Profile State': profile.state || '',
    'Profile Zip Code': profile.zip_code || '',

    // Current address from application (may differ from profile)
    'Current Address': appData.current_address || profile.address || '',
    'Current Colony': appData.current_colony || profile.colony || '',
    'Current City': appData.current_city || profile.city || '',
    'Current State': appData.current_state || profile.state || '',
    'Current Zip Code': appData.current_zip_code || profile.zip_code || '',
    'Time at Address': appData.time_at_address || '',
    'Housing Type': appData.housing_type || '',

    // Personal details from application
    'Education Level': appData.grado_de_estudios || '',
    'Dependents': appData.dependents || '',

    // Employment information
    'Fiscal Classification': appData.fiscal_classification || '',
    'Company Name': appData.company_name || '',
    'Company Phone': appData.company_phone || '',
    'Supervisor Name': appData.supervisor_name || '',
    'Company Website': appData.company_website || '',
    'Company Address': appData.company_address || '',
    'Company Industry': appData.company_industry || '',
    'Job Title': appData.job_title || '',
    'Job Seniority': appData.job_seniority || '',
    'Net Monthly Income': appData.net_monthly_income || '',

    // References
    'Friend Reference Name': appData.friend_reference_name || '',
    'Friend Reference Phone': appData.friend_reference_phone || '',
    'Friend Reference Relationship': appData.friend_reference_relationship || '',
    'Family Reference Name': appData.family_reference_name || '',
    'Family Reference Phone': appData.family_reference_phone || '',
    'Family Relationship': appData.parentesco || '',

    // Financing preferences
    'Loan Term (Months)': appData.loan_term_months || '',
    'Down Payment': appData.down_payment_amount || '',
    'Estimated Monthly Payment': appData.estimated_monthly_payment || '',

    // Vehicle information
    'Vehicle Title': carInfo._vehicleTitle || carInfo.vehicleTitle || '',
    'Orden Compra': carInfo._ordenCompra || carInfo.ordencompra || appData.ordencompra || '',
    'Vehicle Price': carInfo.precio || '',
    'Recommended Down Payment': carInfo.enganche_recomendado || '',
    'Min Down Payment': carInfo.enganchemin || '',
    'Recommended Monthly Payment': carInfo.mensualidad_recomendada || '',
    'Max Term': carInfo.plazomax || '',
    'Vehicle Image URL': carInfo._featureImage || carInfo.featureImage || '',

    // Consent
    'Terms Accepted': appData.terms_and_conditions ? 'Yes' : 'No',
    'Survey Consent': appData.consent_survey ? 'Yes' : 'No',

    // Advisor information
    'Assigned Advisor ID': profile.asesor_asignado_id || '',
    'Advisor Name': profile.advisor_name || '',
  };
}

/**
 * Get OAuth2 access token for Google Sheets API
 */
async function getGoogleAccessToken(credentials: GoogleSheetsCredentials): Promise<string> {
  const jwtHeader = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtClaimSet = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Encode header and claim set
  const encoder = new TextEncoder();
  const headerB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(jwtHeader))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const claimSetB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(jwtClaimSet))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const signatureInput = `${headerB64}.${claimSetB64}`;

  // Import private key
  const privateKey = credentials.private_key.replace(/\\n/g, '\n');
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

/**
 * Append row to Google Sheet
 */
async function appendToGoogleSheet(
  sheetId: string,
  sheetName: string,
  values: any[],
  accessToken: string
): Promise<void> {
  const range = `${sheetName}!A:A`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=RAW`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to append to Google Sheet: ${error}`);
  }
}

/**
 * Get or create header row in Google Sheet
 */
async function ensureHeaderRow(
  sheetId: string,
  sheetName: string,
  headers: string[],
  accessToken: string
): Promise<void> {
  // Check if sheet has data
  const range = `${sheetName}!A1:ZZ1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to read sheet headers');
  }

  const data = await response.json();

  // If no data or first row is empty, write headers
  if (!data.values || data.values.length === 0 || data.values[0].length === 0) {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1?valueInputOption=RAW`;

    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headers],
      }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to write headers: ${error}`);
    }
  }
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    if (!GOOGLE_SHEETS_CREDENTIALS) {
      throw new Error('GOOGLE_SHEETS_CREDENTIALS environment variable is not set');
    }
    if (!GOOGLE_SHEET_ID) {
      throw new Error('GOOGLE_SHEET_ID environment variable is not set');
    }

    // Parse request body
    const { record } = await req.json();

    if (!record) {
      return new Response(
        JSON.stringify({ error: 'Missing record in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const application: ApplicationData = record;

    console.log(`Processing application ${application.id} with status ${application.status}`);

    // Only sync submitted applications (not drafts)
    if (application.status === 'draft') {
      return new Response(
        JSON.stringify({ message: 'Skipping draft application', applicationId: application.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse Google credentials
    const credentials: GoogleSheetsCredentials = JSON.parse(GOOGLE_SHEETS_CREDENTIALS);

    // Get access token
    console.log('Getting Google access token...');
    const accessToken = await getGoogleAccessToken(credentials);

    // Flatten application data
    const flatData = flattenApplicationData(application);
    const headers = Object.keys(flatData);
    const values = Object.values(flatData);

    // Ensure header row exists
    console.log('Ensuring header row exists...');
    await ensureHeaderRow(GOOGLE_SHEET_ID, GOOGLE_SHEET_NAME, headers, accessToken);

    // Append data to sheet
    console.log('Appending data to Google Sheet...');
    await appendToGoogleSheet(GOOGLE_SHEET_ID, GOOGLE_SHEET_NAME, values, accessToken);

    console.log(`Successfully synced application ${application.id} to Google Sheets`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Application synced to Google Sheets',
        applicationId: application.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
