# Mark Vehicle Sold - Supabase Edge Function

## Overview

This edge function is specifically designed to mark vehicles as sold in the `inventario_cache` table when notified by Airtable Automations. It provides a reliable, dedicated automation path for updating sold vehicles.

## Purpose

The existing `airtable-sync` function handles general synchronization, but this dedicated function ensures that sold status updates are reliably processed with clear logging and error handling specifically for this critical business operation.

## Deployment

```bash
supabase functions deploy mark-vehicle-sold
```

## API Endpoint

Once deployed, the function will be available at:
```
https://<your-project-ref>.supabase.co/functions/v1/mark-vehicle-sold
```

## Request Format

### Method
`POST`

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "ordencompra": "ORDEN123"
}
```

### Parameters
- `ordencompra` (string, required): The unique order/purchase identifier for the vehicle that was sold

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Successfully marked vehicle as sold",
  "data": {
    "ordencompra": "ORDEN123",
    "vehicle_id": 456,
    "titulo": "Honda CR-V 2020",
    "previous_status": {
      "ordenstatus": "Comprado",
      "vendido": false
    },
    "new_status": {
      "ordenstatus": "Historico",
      "vendido": true
    }
  }
}
```

### Not Found Response (404)
```json
{
  "success": false,
  "message": "Vehicle with OrdenCompra ORDEN123 not found",
  "ordencompra": "ORDEN123"
}
```

### Error Response (500)
```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2025-10-30T12:00:00.000Z"
}
```

## What It Does

1. **Receives Notification**: Accepts a POST request with the `ordencompra` of the sold vehicle
2. **Validates Vehicle**: Checks if the vehicle exists in `inventario_cache`
3. **Updates Status**: Sets `ordenstatus` to "Historico" and `vendido` to `true`
4. **Updates Timestamps**: Updates `last_synced_at` and `updated_at`
5. **Invalidates Cache**: Triggers cache invalidation in `rapid-processor` (fire-and-forget)
6. **Returns Result**: Provides detailed response with before/after status

## Database Changes

The function updates the following columns in `inventario_cache`:

| Column | New Value | Description |
|--------|-----------|-------------|
| `ordenstatus` | "Historico" | Marks the order as historical/archived |
| `vendido` | `true` | Boolean flag indicating vehicle is sold |
| `last_synced_at` | Current timestamp | Records when this sync occurred |
| `updated_at` | Current timestamp | Records when the record was last updated |

---

# Airtable Automation Setup

## Overview

This guide explains how to set up an Airtable Automation that notifies the Supabase edge function when a vehicle is sold.

## Prerequisites

1. Airtable Base with vehicle inventory table
2. Deployed `mark-vehicle-sold` edge function in Supabase
3. Edge function URL from Supabase dashboard

## Step-by-Step Setup

### 1. Create New Automation in Airtable

1. Open your Airtable Base
2. Click on "Automations" in the top navigation
3. Click "+ Create automation"
4. Name it: **"Notify Supabase - Vehicle Sold"**

### 2. Configure Trigger

**Trigger Type**: When record matches conditions

**Settings**:
- **Table**: Your vehicle inventory table (e.g., "Inventario")
- **View**: All records (or specific view)
- **Field**: `OrdenStatus`
- **Condition**: "is" → **"Vendido"** (or whatever value indicates sold)

**Alternative Trigger**: When a record is updated
- Add a condition: `OrdenStatus` = "Vendido"

### 3. Add Webhook Action

1. Click "+ Add action"
2. Select "Send a webhook"
3. Configure the webhook:

**URL**:
```
https://<your-project-ref>.supabase.co/functions/v1/mark-vehicle-sold
```

**Method**: `POST`

**Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Body** (JSON format):
```json
{
  "ordencompra": {{OrdenCompra field from trigger}}
}
```

**Note**: In Airtable's automation editor:
- Click on the `{+}` button to insert dynamic fields
- Select the `OrdenCompra` field from your table
- The automation will automatically insert the value

### 4. Test the Automation

1. Click "Test automation" in Airtable
2. Select a test record
3. Check the webhook response in the test results
4. Verify in Supabase that the vehicle was updated:
   - Check `inventario_cache` table
   - Verify `ordenstatus` = "Historico"
   - Verify `vendido` = `true`

### 5. Activate the Automation

1. Review all settings
2. Click "Turn on" to activate the automation
3. Monitor the first few real triggers to ensure it's working correctly

## Airtable Automation Script Example

If you prefer using a script action instead of webhook:

```javascript
// Airtable Automation Script
// This script runs when a vehicle is marked as sold and notifies Supabase

const SUPABASE_FUNCTION_URL = 'https://<your-project-ref>.supabase.co/functions/v1/mark-vehicle-sold';

// Get the record that triggered the automation
let inputConfig = input.config();
let ordenCompra = inputConfig.ordenCompra;

// Validate we have an ordenCompra
if (!ordenCompra) {
    console.error('❌ No OrdenCompra provided');
    throw new Error('OrdenCompra is required');
}

console.log(`📡 Notifying Supabase that vehicle ${ordenCompra} was sold...`);

// Send POST request to Supabase Edge Function
let response = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        ordencompra: ordenCompra
    })
});

// Check response
if (response.ok) {
    let result = await response.json();
    console.log('✅ Successfully notified Supabase:', result.message);
    console.log('   Vehicle:', result.data?.titulo);
    console.log('   Status changed from:', result.data?.previous_status.ordenstatus, '→', result.data?.new_status.ordenstatus);
} else {
    let errorText = await response.text();
    console.error('❌ Failed to notify Supabase:', response.status, errorText);
    throw new Error(`Supabase notification failed: ${response.status}`);
}

console.log('✅ Automation completed successfully');
```

**To use this script**:
1. In Airtable Automation, add a "Run a script" action
2. Paste the script above
3. Replace `<your-project-ref>` with your actual Supabase project reference
4. Configure input variables:
   - Click "+ Add input variable"
   - Name: `ordenCompra`
   - Value: Select the `OrdenCompra` field from your trigger record

## Monitoring and Troubleshooting

### Viewing Logs

**Airtable**:
- Open the automation
- Click on "Runs" tab to see execution history
- Click on individual runs to see details and errors

**Supabase**:
```bash
supabase functions logs mark-vehicle-sold
```

Or in Supabase Dashboard:
1. Go to Edge Functions
2. Select `mark-vehicle-sold`
3. View logs tab

### Common Issues

#### Issue: 404 - Vehicle Not Found
**Cause**: The `ordencompra` doesn't exist in `inventario_cache`
**Solution**:
- Verify the vehicle was synced to Supabase
- Check that `ordencompra` value matches exactly (case-sensitive)
- Run a manual sync if needed

#### Issue: 500 - Server Error
**Cause**: Database connection or query error
**Solution**:
- Check Supabase logs for detailed error message
- Verify database permissions
- Ensure `inventario_cache` table exists

#### Issue: Automation doesn't trigger
**Cause**: Trigger conditions not met
**Solution**:
- Check the trigger field value matches exactly
- Verify the automation is turned on
- Test with a known good record

### Testing Manually

You can test the endpoint manually using `curl`:

```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/mark-vehicle-sold \
  -H "Content-Type: application/json" \
  -d '{"ordencompra":"ORDEN123"}'
```

## Best Practices

1. **Test First**: Always test with a non-production record first
2. **Monitor Regularly**: Check automation runs for the first few days after setup
3. **Handle Errors**: Set up email notifications in Airtable for failed automation runs
4. **Document**: Keep a record of which vehicles were processed when troubleshooting
5. **Backup Trigger**: Consider keeping the existing `airtable-sync` automation as a backup

## Security Notes

- The edge function is publicly accessible (no auth required)
- Only include the `ordencompra` field in the request (don't send sensitive data)
- Monitor for unusual activity in logs
- Consider adding API key authentication if needed in the future

## Support

If you encounter issues:
1. Check Supabase function logs: `supabase functions logs mark-vehicle-sold`
2. Check Airtable automation run history
3. Verify the vehicle exists in `inventario_cache` table
4. Ensure the `ordencompra` value is correct

## Related Functions

- `airtable-sync`: General vehicle synchronization from Airtable
- `rapid-processor`: Cache invalidation and API responses
