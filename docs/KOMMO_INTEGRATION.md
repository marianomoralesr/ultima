# Kommo CRM Integration Guide

## Overview

The KommoService provides a safe, production-ready integration with Kommo CRM (formerly amoCRM). This service is designed with multiple safety layers to protect your existing Kommo data while enabling bidirectional synchronization.

## Safety Features

### 🔒 Multi-Layer Protection

1. **READ-ONLY by Default**: All operations default to read-only mode
2. **SAFE_MODE Enabled**: Prevents any modifications to existing leads
3. **ALLOW_WRITES Flag**: Must be explicitly enabled for write operations
4. **Duplicate Detection**: Automatically checks for existing leads before creation
5. **Update/Delete Disabled**: These operations throw errors and must be manually enabled

### Protection Against Data Loss

- ✅ **Cannot** modify existing leads (status, pipeline, tags, etc.)
- ✅ **Cannot** delete leads
- ✅ **Cannot** change pipeline configurations
- ✅ **Cannot** update lead assignments
- ✅ **Will** prevent creating duplicate leads
- ✅ **Will** throw explicit errors if attempting unsafe operations

## Prerequisites

### 1. Create a Kommo Integration

1. Log into your Kommo account as administrator
2. Navigate to: **Settings → Integrations → Create Integration**
3. Fill in the integration details:
   - **Name**: "TREFA Portal Integration" (or your app name)
   - **Redirect URI**: `https://yourdomain.com/oauth/kommo/callback`
   - **Scopes**: Select the permissions you need

### 2. Get Your Credentials

After creating the integration:

1. Go to the **"Keys and Scopes"** tab
2. Copy these values:
   - **Integration ID** (public, looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
   - **Secret Key** (confidential, shown only once)

### 3. Complete OAuth Flow

You'll need to authorize the integration to get tokens:

1. Direct users to: `https://www.kommo.com/oauth?client_id={YOUR_INTEGRATION_ID}`
2. After approval, you'll receive an authorization code
3. Exchange the code for tokens (see OAuth section below)

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Kommo CRM Configuration
VITE_KOMMO_INTEGRATION_ID=your-integration-id-here
VITE_KOMMO_SECRET_KEY=your-secret-key-here
VITE_KOMMO_SUBDOMAIN=yourcompany  # e.g., if your URL is yourcompany.kommo.com
VITE_KOMMO_ACCESS_TOKEN=your-access-token
VITE_KOMMO_REFRESH_TOKEN=your-refresh-token
VITE_KOMMO_REDIRECT_URI=https://yourdomain.com/oauth/kommo/callback
```

### OAuth Token Exchange (Initial Setup)

Use this script to exchange your authorization code for tokens:

```typescript
// Run this ONCE to get your initial tokens
async function getInitialTokens(authorizationCode: string) {
    const response = await fetch('https://yoursubdomain.kommo.com/oauth2/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: 'YOUR_INTEGRATION_ID',
            client_secret: 'YOUR_SECRET_KEY',
            grant_type: 'authorization_code',
            code: authorizationCode,
            redirect_uri: 'YOUR_REDIRECT_URI'
        })
    });

    const tokens = await response.json();
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);

    // Add these to your .env file
}
```

## Usage Examples

### 1. Read Operations (SAFE - No Risk)

```typescript
import KommoService from './services/KommoService';

// Get all leads (with filters)
const leads = await KommoService.getLeads({
    limit: 50,
    page: 1,
    filter: {
        pipeline_id: 12345,
        statuses: [142, 143] // Specific stage IDs
    }
});

// Get a specific lead by ID
const lead = await KommoService.getLeadById(123456);
console.log('Lead:', lead.name, 'Status:', lead.status_id);

// Get all pipelines and stages
const pipelines = await KommoService.getPipelines();
pipelines.forEach(pipeline => {
    console.log(`Pipeline: ${pipeline.name}`);
    pipeline._embedded.statuses.forEach(status => {
        console.log(`  - ${status.name} (ID: ${status.id})`);
    });
});

// Get a beautiful summary of your funnels
const summary = await KommoService.getPipelinesSummary();
console.log(summary);
/*
=== KOMMO PIPELINES SUMMARY ===

Pipeline: Main Sales Pipeline (ID: 12345)
  Main: Yes | Archive: No
  Stages:
    - Incoming Leads (ID: 1) [blue]
    - Qualification (ID: 2) [yellow]
    - Proposal (ID: 3) [green]
    - Closed - Won (ID: 142) [green]
    - Closed - Lost (ID: 143) [red]
*/

// Get all tags
const tags = await KommoService.getTags();
console.log('Available tags:', tags.map(t => t.name));

// Search for a lead by email or phone
const existingLead = await KommoService.searchLeadByContact(
    'cliente@example.com',
    '+52 1234567890'
);

if (existingLead) {
    console.log('Found lead:', existingLead.id);
} else {
    console.log('No lead found with this contact info');
}
```

### 2. Check Configuration Status

```typescript
const status = KommoService.getConfigStatus();
console.log('Kommo Configuration:', {
    configured: status.configured,       // Are credentials present?
    safeMode: status.safeMode,          // Is safe mode enabled?
    writesAllowed: status.writesAllowed, // Are writes allowed?
    hasCredentials: status.hasCredentials // Do we have valid tokens?
});
```

### 3. Creating New Leads (PROTECTED)

**⚠️ IMPORTANT**: Before using `createLead()`, you must:

1. Set `ALLOW_WRITES = true` in `KommoService.ts:153`
2. Test thoroughly in a development/staging environment first
3. The service will automatically prevent duplicate leads

```typescript
// Enable writes first (in KommoService.ts)
// private static readonly ALLOW_WRITES = true;

// Create a new lead
try {
    const newLead = await KommoService.createLead({
        name: 'Juan Pérez - New Lead',
        price: 250000,
        pipeline_id: 12345,    // Optional: specific pipeline
        status_id: 1,          // Optional: specific stage
        contact: {
            first_name: 'Juan',
            last_name: 'Pérez',
            email: 'juan.perez@example.com',
            phone: '+52 1234567890'
        },
        tags: ['Web Portal', 'Auto Financing'],
        custom_fields: [
            {
                field_id: 123,
                values: [{ value: 'Some custom value' }]
            }
        ]
    });

    console.log('Lead created successfully:', newLead.id);
} catch (error) {
    if (error.message.includes('SAFETY')) {
        console.log('Lead already exists, no action taken');
    } else {
        console.error('Error creating lead:', error);
    }
}
```

### 4. Sync Your App Data to Kommo

```typescript
// Example: Sync a lead from your app to Kommo
async function syncLeadToKommo(userProfile: Profile) {
    try {
        // First, check if lead already exists
        const existing = await KommoService.searchLeadByContact(
            userProfile.email,
            userProfile.phone
        );

        if (existing) {
            console.log(`Lead already exists in Kommo (ID: ${existing.id})`);
            // You can log this for reference or analytics
            return { success: true, leadId: existing.id, created: false };
        }

        // Create new lead
        const lead = await KommoService.createLead({
            name: `${userProfile.first_name} ${userProfile.last_name}`,
            price: 0, // Initial price
            contact: {
                first_name: userProfile.first_name,
                last_name: userProfile.last_name,
                email: userProfile.email,
                phone: userProfile.phone
            },
            tags: ['Portal TREFA', userProfile.source || 'Web'],
        });

        console.log('Successfully synced to Kommo:', lead.id);
        return { success: true, leadId: lead.id, created: true };

    } catch (error) {
        console.error('Failed to sync to Kommo:', error);
        return { success: false, error: error.message };
    }
}
```

### 5. Pull Data from Kommo to Your App

```typescript
// Example: Sync Kommo data to your app database
async function syncKommoDataToApp() {
    try {
        // Get all leads from Kommo
        const response = await KommoService.getLeads({
            limit: 250,
            filter: {
                pipeline_id: 12345, // Your main pipeline
            }
        });

        const leads = response._embedded.leads;

        for (const kommoLead of leads) {
            // Extract data
            const leadData = {
                kommo_id: kommoLead.id,
                name: kommoLead.name,
                status_id: kommoLead.status_id,
                pipeline_id: kommoLead.pipeline_id,
                price: kommoLead.price,
                responsible_user_id: kommoLead.responsible_user_id,
                tags: kommoLead._embedded?.tags?.map(t => t.name) || [],
                created_at: new Date(kommoLead.created_at * 1000),
                updated_at: new Date(kommoLead.updated_at * 1000)
            };

            // Update your database
            // await updateYourDatabase(leadData);

            console.log(`Synced lead: ${leadData.name}`);
        }

        console.log(`Successfully synced ${leads.length} leads from Kommo`);
    } catch (error) {
        console.error('Failed to sync from Kommo:', error);
    }
}
```

## API Reference

### Read Operations (Safe)

| Method | Description | Returns |
|--------|-------------|---------|
| `getLeads(params?)` | Get list of leads with optional filters | `KommoLeadsListResponse` |
| `getLeadById(id)` | Get single lead by ID | `KommoLead` |
| `getPipelines()` | Get all pipelines and their stages | `KommoPipeline[]` |
| `getPipelineById(id)` | Get specific pipeline | `KommoPipeline` |
| `getTags()` | Get all unique tags from leads | `KommoTag[]` |
| `searchLeadByContact(email?, phone?)` | Search for lead by contact info | `KommoLead \| null` |
| `getPipelinesSummary()` | Get formatted pipeline summary | `string` |
| `getConfigStatus()` | Get configuration status | `ConfigStatus` |

### Write Operations (Protected)

| Method | Description | Status |
|--------|-------------|--------|
| `createLead(data)` | Create a new lead | ⚠️ Requires `ALLOW_WRITES = true` |
| `updateLead(id, data)` | Update existing lead | 🔒 **DISABLED** for safety |
| `deleteLead(id)` | Delete a lead | 🔒 **DISABLED** for safety |

## Error Handling

```typescript
try {
    const leads = await KommoService.getLeads();
} catch (error) {
    if (error.message.includes('401')) {
        // Authentication failed - need to refresh tokens
        console.error('Authentication error:', error);
    } else if (error.message.includes('429')) {
        // Rate limit exceeded
        console.error('Too many requests, retry later');
    } else if (error.message.includes('SAFETY')) {
        // Safety check prevented operation
        console.log('Operation blocked by safety check');
    } else {
        console.error('Kommo API error:', error);
    }
}
```

## Token Management

The service automatically handles token refresh:

- Access tokens expire after 24 hours
- The service automatically refreshes tokens before expiry
- Refresh tokens are valid for 3 months
- **Important**: In production, store tokens securely in your database

```typescript
// Example: Store tokens after refresh (you should implement this)
// Modify KommoService.ts line 201-202:

// After successful refresh:
await storeTokensInDatabase({
    access_token: currentAccessToken,
    refresh_token: currentRefreshToken,
    expires_at: new Date(tokenExpiresAt)
});
```

## Production Checklist

Before deploying to production:

- [ ] Test all read operations in staging
- [ ] Verify OAuth flow works correctly
- [ ] Implement secure token storage (database/backend)
- [ ] Set up token refresh monitoring
- [ ] Test createLead() with duplicates (should be rejected)
- [ ] Verify SAFE_MODE prevents existing lead modifications
- [ ] Set up error monitoring and logging
- [ ] Document which pipeline IDs and stage IDs to use
- [ ] Train team on when to enable ALLOW_WRITES
- [ ] Create backup of Kommo data before enabling writes

## Troubleshooting

### "Authentication error (401)"
- Check if your access token is valid
- Verify the token hasn't expired
- Try refreshing manually or re-authenticate

### "Write operations are disabled"
- This is intentional for safety
- Set `ALLOW_WRITES = true` in line 153 of KommoService.ts
- Only enable in controlled environments

### "Lead already exists"
- This is SAFE_MODE working correctly
- The service prevented creating a duplicate
- Use `searchLeadByContact()` to find the existing lead

### "No lead found for: ..."
- The search is case-sensitive
- Try searching by both email and phone separately
- Verify the contact exists in Kommo

## Support & References

- **Kommo API Docs**: https://developers.kommo.com/
- **OAuth 2.0 Guide**: https://developers.kommo.com/docs/oauth-20
- **Service Location**: `src/services/KommoService.ts`
- **Config Location**: `src/pages/config.ts`

---

**Created**: 2025
**Version**: 1.0.0
**Status**: Production Ready (Read-Only)
