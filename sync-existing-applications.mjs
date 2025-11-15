/**
 * Script to sync all existing applications to Google Sheets
 * This will call the google-sheets-sync Edge Function for each submitted application
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jjepfehmuybpctdzipnu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncApplication(application) {
  try {
    console.log(`Syncing application ${application.id} (${application.status})...`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-sheets-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        record: application,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ Failed: ${error}`);
      return false;
    }

    const result = await response.json();
    console.log(`  ✅ Success: ${result.message || 'Synced'}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Fetching all submitted applications...\n');

  // Fetch all applications that should be synced (not drafts)
  const { data: applications, error } = await supabase
    .from('financing_applications')
    .select('*')
    .in('status', ['submitted', 'reviewing', 'pending_docs', 'approved', 'rejected'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching applications:', error.message);
    process.exit(1);
  }

  if (!applications || applications.length === 0) {
    console.log('No applications found to sync.');
    process.exit(0);
  }

  console.log(`Found ${applications.length} applications to sync.\n`);

  let successCount = 0;
  let failCount = 0;

  for (const app of applications) {
    const success = await syncApplication(app);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Successfully synced: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  📈 Total: ${applications.length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
