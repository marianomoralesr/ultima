// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Airtable Script: Webhook to Supabase airtable-sync Edge Function
// Version: 2.0.0
// Purpose: Trigger full data sync from Airtable to Supabase inventario_cache
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SUPABASE_FUNCTION_URL = 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/airtable-sync';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTk2MDMsImV4cCI6MjA1OTc3NTYwM30.yaMESZqaoLvkbVSgdHxpU-Vb7q-naxj95QxcpRYPrX4';

// Get the record ID from the trigger
let inputConfig = input.config();
let recordId = inputConfig.recordId;

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`🔄 Syncing record: ${recordId}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

// Send webhook to Supabase
try {
    let response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
            recordId: recordId
        })
    });

    let result = await response.json();

    if (response.ok) {
        console.log('✅ Success:', result.message || 'Record synced successfully');
        console.log('📊 Data:', JSON.stringify(result.data || {}, null, 2));
    } else {
        console.error('❌ Error:', result.error || 'Unknown error');
        console.error('📋 Details:', JSON.stringify(result, null, 2));
        throw new Error(result.error || `HTTP ${response.status}: Sync failed`);
    }
} catch (error) {
    console.error('❌ Network/Fetch Error:', error.message);
    console.error('Stack:', error.stack);
    throw error; // Re-throw to mark automation as failed
}

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log('✨ Sync completed successfully');
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
