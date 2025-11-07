/**
 * Simple Kommo Connection Test
 * Directly uses environment variables without Vite's config system
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '.env.local') });

console.log('============================================================');
console.log('🧪 KOMMO SIMPLE CONNECTION TEST');
console.log('============================================================\n');

console.log('📋 Environment Variables Check:');
console.log('  VITE_KOMMO_INTEGRATION_ID:', process.env.VITE_KOMMO_INTEGRATION_ID ? '✓ Set' : '❌ Missing');
console.log('  VITE_KOMMO_SECRET_KEY:', process.env.VITE_KOMMO_SECRET_KEY ? '✓ Set' : '❌ Missing');
console.log('  VITE_KOMMO_SUBDOMAIN:', process.env.VITE_KOMMO_SUBDOMAIN || '❌ Missing');
console.log('  VITE_KOMMO_ACCESS_TOKEN:', process.env.VITE_KOMMO_ACCESS_TOKEN ? '✓ Set (length: ' + process.env.VITE_KOMMO_ACCESS_TOKEN.length + ')' : '❌ Missing');
console.log('');

const baseUrl = `https://${process.env.VITE_KOMMO_SUBDOMAIN}.kommo.com/api/v4`;
const accessToken = process.env.VITE_KOMMO_ACCESS_TOKEN;

console.log('🔍 Testing API Connection...');
console.log(`  Base URL: ${baseUrl}`);
console.log('');

async function testConnection() {
    try {
        console.log('📊 Test 1: Fetching Pipelines...');
        const response = await fetch(`${baseUrl}/leads/pipelines`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('  ❌ Failed:', response.status, response.statusText);
            console.error('  Error:', JSON.stringify(errorData, null, 2));
            return;
        }

        const data: any = await response.json();
        const pipelines = data._embedded?.pipelines || [];

        console.log(`  ✓ Successfully retrieved ${pipelines.length} pipeline(s)\n`);

        pipelines.forEach((pipeline: any, index: number) => {
            console.log(`  Pipeline ${index + 1}: ${pipeline.name} (ID: ${pipeline.id})`);
            console.log(`    - Main: ${pipeline.is_main ? 'Yes' : 'No'}`);
            console.log(`    - Stages: ${pipeline._embedded.statuses.length}`);

            const stages = pipeline._embedded.statuses.slice(0, 3);
            stages.forEach((status: any) => {
                console.log(`      → ${status.name} (ID: ${status.id})`);
            });

            if (pipeline._embedded.statuses.length > 3) {
                console.log(`      ... and ${pipeline._embedded.statuses.length - 3} more stages`);
            }
            console.log('');
        });

        console.log('👥 Test 2: Fetching Sample Leads...');
        const leadsResponse = await fetch(`${baseUrl}/leads?limit=5`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!leadsResponse.ok) {
            console.error('  ❌ Failed to fetch leads:', leadsResponse.status);
            return;
        }

        const leadsData: any = await leadsResponse.json();
        const leads = leadsData._embedded?.leads || [];

        console.log(`  ✓ Successfully retrieved ${leads.length} sample lead(s)\n`);

        leads.forEach((lead: any, index: number) => {
            console.log(`  Lead ${index + 1}:`);
            console.log(`    - Name: ${lead.name}`);
            console.log(`    - ID: ${lead.id}`);
            console.log(`    - Pipeline: ${lead.pipeline_id}`);
            console.log(`    - Status: ${lead.status_id}`);
            console.log(`    - Price: $${lead.price}`);
            console.log(`    - Created: ${new Date(lead.created_at * 1000).toLocaleDateString()}`);
            console.log('');
        });

        console.log('============================================================');
        console.log('✅ ALL TESTS PASSED - CONNECTION SUCCESSFUL');
        console.log('============================================================');
        console.log('');
        console.log('Next Steps:');
        console.log('1. Review the pipeline structure above');
        console.log('2. Verify the lead data looks correct');
        console.log('3. Integration is ready to use!');
        console.log('');

    } catch (error) {
        console.error('\n❌ Test failed with error:');
        console.error(error);
        console.error('');
        console.error('Possible issues:');
        console.error('- Check your access token is valid');
        console.error('- Verify network connectivity to Kommo API');
        console.error('- Confirm the subdomain is correct');
    }
}

testConnection();
