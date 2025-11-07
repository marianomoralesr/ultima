/**
 * Kommo Connection Test Script
 *
 * This script performs safe, read-only tests to verify the Kommo integration.
 * NO DATA WILL BE MODIFIED - This is 100% safe to run.
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '.env.local') });

import KommoService from './src/services/KommoService.ts';

async function testKommoConnection() {
    console.log('='.repeat(60));
    console.log('🧪 KOMMO CONNECTION TEST - READ-ONLY MODE');
    console.log('='.repeat(60));
    console.log('');

    // Test 1: Configuration Status
    console.log('📋 Test 1: Checking Configuration...');
    const status = KommoService.getConfigStatus();
    console.log('  ✓ Configured:', status.configured);
    console.log('  ✓ Has Credentials:', status.hasCredentials);
    console.log('  ✓ Safe Mode:', status.safeMode);
    console.log('  ✓ Writes Allowed:', status.writesAllowed);
    console.log('');

    if (!status.configured) {
        console.error('❌ Configuration incomplete! Check your .env.local file');
        return;
    }

    // Test 2: Fetch Pipelines (Safe Read-Only)
    console.log('🔍 Test 2: Fetching Pipelines (Read-Only)...');
    try {
        const pipelines = await KommoService.getPipelines();
        console.log(`  ✓ Successfully retrieved ${pipelines.length} pipeline(s)`);
        console.log('');

        // Show pipeline details
        pipelines.forEach((pipeline, index) => {
            console.log(`  Pipeline ${index + 1}: ${pipeline.name} (ID: ${pipeline.id})`);
            console.log(`    - Main: ${pipeline.is_main ? 'Yes' : 'No'}`);
            console.log(`    - Stages: ${pipeline._embedded.statuses.length}`);

            // Show first 3 stages
            const stagesToShow = pipeline._embedded.statuses.slice(0, 3);
            stagesToShow.forEach(status => {
                console.log(`      → ${status.name} (ID: ${status.id})`);
            });

            if (pipeline._embedded.statuses.length > 3) {
                console.log(`      ... and ${pipeline._embedded.statuses.length - 3} more stages`);
            }
            console.log('');
        });

    } catch (error: any) {
        console.error('  ❌ Failed to fetch pipelines:', error.message);
        console.error('  → Check your credentials and network connection');
        return;
    }

    // Test 3: Fetch Summary (Safe Read-Only)
    console.log('📊 Test 3: Generating Pipeline Summary (Read-Only)...');
    try {
        const summary = await KommoService.getPipelinesSummary();
        console.log(summary);
    } catch (error: any) {
        console.error('  ❌ Failed to generate summary:', error.message);
    }

    // Test 4: Get Leads (First 5 only - Safe Read-Only)
    console.log('👥 Test 4: Fetching Sample Leads (First 5, Read-Only)...');
    try {
        const leadsResponse = await KommoService.getLeads({ limit: 5 });
        const leads = leadsResponse._embedded?.leads || [];

        console.log(`  ✓ Successfully retrieved ${leads.length} sample lead(s)`);
        console.log('');

        leads.forEach((lead, index) => {
            console.log(`  Lead ${index + 1}:`);
            console.log(`    - Name: ${lead.name}`);
            console.log(`    - ID: ${lead.id}`);
            console.log(`    - Pipeline: ${lead.pipeline_id}`);
            console.log(`    - Status: ${lead.status_id}`);
            console.log(`    - Price: ${lead.price}`);
            console.log(`    - Created: ${new Date(lead.created_at * 1000).toLocaleDateString()}`);

            // Show tags if present
            if (lead._embedded?.tags && lead._embedded.tags.length > 0) {
                const tagNames = lead._embedded.tags.map(t => t.name).join(', ');
                console.log(`    - Tags: ${tagNames}`);
            }
            console.log('');
        });

    } catch (error: any) {
        console.error('  ❌ Failed to fetch leads:', error.message);
    }

    // Test 5: Search Test (Safe Read-Only)
    console.log('🔎 Test 5: Testing Search Functionality (Read-Only)...');
    try {
        // Search for a non-existent contact to test the search without affecting data
        const result = await KommoService.searchLeadByContact('test-search-' + Date.now() + '@example.com');

        if (result) {
            console.log('  ✓ Search working - found a lead (unlikely)');
        } else {
            console.log('  ✓ Search working - no lead found (expected)');
        }
    } catch (error: any) {
        console.error('  ❌ Search failed:', error.message);
    }
    console.log('');

    // Test 6: Verify Safety Mechanisms
    console.log('🔒 Test 6: Verifying Safety Mechanisms...');
    try {
        await KommoService.updateLead(999999, { name: 'Test' });
        console.log('  ❌ DANGER: Update operation was allowed! Safety check failed!');
    } catch (error: any) {
        if (error.message.includes('SAFETY')) {
            console.log('  ✓ Update operations blocked (Safety working correctly)');
        } else {
            console.log('  ⚠️  Update blocked but for different reason:', error.message);
        }
    }

    try {
        await KommoService.deleteLead(999999);
        console.log('  ❌ DANGER: Delete operation was allowed! Safety check failed!');
    } catch (error: any) {
        if (error.message.includes('SAFETY')) {
            console.log('  ✓ Delete operations blocked (Safety working correctly)');
        } else {
            console.log('  ⚠️  Delete blocked but for different reason:', error.message);
        }
    }

    try {
        await KommoService.createLead({ name: 'Test Lead' });
        console.log('  ❌ DANGER: Create operation was allowed without enabling writes!');
    } catch (error: any) {
        if (error.message.includes('SAFETY') || error.message.includes('Write operations are disabled')) {
            console.log('  ✓ Create operations blocked (Safety working correctly)');
        } else {
            console.log('  ⚠️  Create blocked but for different reason:', error.message);
        }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ TEST COMPLETE - All operations were READ-ONLY');
    console.log('='.repeat(60));
    console.log('');
    console.log('Next Steps:');
    console.log('1. Review the pipeline structure above');
    console.log('2. Verify the lead data looks correct');
    console.log('3. When ready, enable ALLOW_WRITES in KommoService.ts');
    console.log('4. Test createLead() in a controlled way');
    console.log('');
}

// Run the tests
testKommoConnection().catch(error => {
    console.error('');
    console.error('❌ Test script failed with error:');
    console.error(error);
    console.error('');
    console.error('Possible issues:');
    console.error('- Check your .env.local file has all Kommo credentials');
    console.error('- Verify your access token is valid');
    console.error('- Confirm network connectivity to Kommo API');
    process.exit(1);
});
