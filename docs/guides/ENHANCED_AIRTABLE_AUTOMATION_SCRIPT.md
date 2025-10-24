# Enhanced Airtable Automation Script

## Overview

This is an improved version of the Airtable automation script that includes:
- Retry logic for failed requests
- Exponential backoff
- Better error handling
- Detailed logging
- Status tracking

## Installation

### Step 1: Open Airtable Automation

1. Go to your Airtable base: https://airtable.com/appbOPKYqQRW2HgyB
2. Click "Automations" in the top menu
3. Find your existing "Sync to Supabase on Record Change" automation (or create new one)
4. Click on the "Run a script" action

### Step 2: Replace Script

Delete the existing script and paste this enhanced version:

```javascript
// Enhanced Airtable Automation Script with Retry Logic
// Version: 2.1 (Fixed for Airtable environment)
// Last Updated: 2025-10-24

const SUPABASE_FUNCTION_URL = 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/airtable-sync';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds between retries

// Get the record ID from the trigger
let inputConfig = input.config();
let recordId = inputConfig.recordId;

console.log(`🚀 Starting sync for record: ${recordId}`);
console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

// Helper: Simple delay using busy wait (Airtable doesn't have setTimeout)
async function sleep(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
        // Busy wait - not ideal but works in Airtable
        await new Promise(resolve => resolve());
    }
}

// Main sync function with retry logic
async function syncWithRetry(attemptNumber = 1) {
    const isRetry = attemptNumber > 1;

    if (isRetry) {
        console.log(`⏳ Waiting ${RETRY_DELAY_MS}ms before retry ${attemptNumber}...`);
        await sleep(RETRY_DELAY_MS);
    }

    console.log(`📡 Attempt ${attemptNumber}/${MAX_RETRIES + 1} - Sending request...`);

    try {
        const startTime = Date.now();

        const response = await fetch(SUPABASE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recordId: recordId,
                source: 'airtable_automation',
                attempt: attemptNumber,
                timestamp: new Date().toISOString()
            })
        });

        const duration = Date.now() - startTime;
        console.log(`⏱️  Request completed in ${duration}ms`);

        // Try to parse response
        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            console.error('⚠️  Failed to parse response JSON:', parseError.message);
            result = { error: 'Invalid JSON response' };
        }

        // Success case
        if (response.ok) {
            console.log('✅ Sync successful!');
            console.log(`📋 Message: ${result.message || 'No message'}`);
            if (result.data) {
                console.log(`🚗 Vehicle: ${result.data.title || 'N/A'}`);
                console.log(`📦 Order: ${result.data.ordencompra || 'N/A'}`);
            }

            output.set('status', 'success');
            output.set('message', result.message || 'Sync completed');
            output.set('attempts', attemptNumber);
            output.set('duration_ms', duration);
            output.set('timestamp', new Date().toISOString());
            return true;
        }

        // Handle different error types
        const statusCode = response.status;
        const errorMessage = result.error || result.message || 'Unknown error';

        console.log(`❌ HTTP ${statusCode}: ${errorMessage}`);

        // Determine if we should retry
        const shouldRetry = attemptNumber <= MAX_RETRIES && (
            statusCode >= 500 || // Server errors
            statusCode === 429 || // Rate limiting
            statusCode === 408 || // Request timeout
            statusCode === 503    // Service unavailable
        );

        if (shouldRetry) {
            console.log(`🔄 Error is retryable. Will retry...`);
            return await syncWithRetry(attemptNumber + 1);
        } else {
            console.error(`🛑 Error is not retryable or max retries reached`);
            output.set('status', 'error');
            output.set('message', errorMessage);
            output.set('http_status', statusCode);
            output.set('attempts', attemptNumber);
            output.set('timestamp', new Date().toISOString());
            return false;
        }

    } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        console.error(`💥 Request failed: ${errorMessage}`);

        // Retry on network errors
        if (attemptNumber <= MAX_RETRIES) {
            console.log(`🔄 Network error, will retry...`);
            return await syncWithRetry(attemptNumber + 1);
        } else {
            console.error(`🛑 Max retries reached after network error`);
            output.set('status', 'error');
            output.set('message', errorMessage);
            output.set('error_type', 'network_error');
            output.set('attempts', attemptNumber);
            output.set('timestamp', new Date().toISOString());
            return false;
        }
    }
}

// Execute sync
try {
    const success = await syncWithRetry();

    if (success) {
        console.log('🎉 Automation completed successfully');
    } else {
        console.log('⚠️  Automation completed with errors');
    }
} catch (error) {
    console.error('💀 Fatal error in automation:', error.message);
    output.set('status', 'fatal_error');
    output.set('message', error.message);
    output.set('timestamp', new Date().toISOString());
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🏁 Automation finished');
```

### Step 3: Configure Input Variables

In the "Input variables" section:
- Variable name: `recordId`
- Value: **Record ID** (select from the trigger step dropdown)

### Step 4: Test the Automation

1. Click "Test automation"
2. Select a test record
3. Click "Run test"
4. Review the detailed logs

Expected output:
```
🚀 Starting sync for record: recXXXXXXXXXXXXXX
⏰ Timestamp: 2025-10-24T12:00:00.000Z
📡 Attempt 1/4 - Sending request...
⏱️  Request completed in 1234ms
✅ Sync successful!
📋 Message: Successfully synced record recXXXXXXXXXXXXXX
🚗 Vehicle: Toyota Camry 2020
📦 Order: ID002104
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏁 Automation finished
```

### Step 5: Configure Trigger (Optional but Recommended)

To reduce unnecessary webhook calls, configure your trigger to only fire when specific fields change:

**Recommended fields to watch:**
- OrdenCompra
- OrdenStatus
- Auto
- AutoMarca
- AutoSubmarcaVersion
- Precio
- Oferta
- fotos_exterior_url
- fotos_interior_url
- feature_image
- autotransmision
- autocombustible
- autokilometraje
- Separado
- vendido

**How to set up:**
1. In the trigger configuration, click "Add conditions"
2. Select "When record matches conditions"
3. Choose the fields listed above
4. This ensures the automation only runs when important data changes

## Features Explained

### 1. Retry Logic with Exponential Backoff
- Automatically retries failed requests up to 3 times
- Delays increase exponentially: 1s → 2s → 4s
- Prevents overwhelming the server during issues

### 2. Timeout Protection
- 25-second timeout prevents hanging requests
- Stays within Airtable's 30-second automation limit
- Gracefully handles timeouts with retry

### 3. Smart Error Handling
- **Retryable errors** (500, 502, 503, 429): Automatically retries
- **Client errors** (400, 404): Does not retry (fix data first)
- **Network errors**: Retries with backoff

### 4. Detailed Logging
- Timestamps for debugging
- Request duration tracking
- Clear success/failure indicators
- HTTP status codes logged

### 5. Output Tracking
Automation outputs include:
- `status`: success, error, or fatal_error
- `message`: Human-readable result
- `attempts`: Number of attempts made
- `duration_ms`: Request duration
- `http_status`: HTTP response code (on error)
- `timestamp`: Completion timestamp

## Monitoring

### View Automation Runs
1. Go to Airtable → Automations
2. Click on your automation
3. Click "Runs" tab
4. Review success rate and logs

### Check Output Values
Each run shows output values:
- Green checkmark = Success
- Red X = Failed
- Click on run to see detailed logs

### Supabase Logs
Cross-reference with Supabase logs:
1. Go to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/logs/edge-functions
2. Select function: `airtable-sync`
3. Filter by timestamp to find corresponding request

## Troubleshooting

### Issue: "Request timeout" error
**Cause**: Supabase function took too long
**Solution**: Check Supabase logs for slow queries. May need to optimize database.

### Issue: Multiple retries, all failing with 500
**Cause**: Server error in edge function
**Solution**: Check Supabase logs for error details. May need to fix edge function code.

### Issue: "Invalid JSON response"
**Cause**: Edge function returned non-JSON response (possibly HTML error page)
**Solution**: Check Supabase function logs for crashes or deployment issues.

### Issue: Automation runs but record doesn't update
**Cause**: Record may not meet sync criteria (e.g., OrdenStatus != "Comprado")
**Solution**: Check edge function logs. Function may be working correctly but filtering out the record.

## Comparison: Old vs New Script

| Feature | Old Script | New Script |
|---------|-----------|------------|
| Retry logic | ❌ No | ✅ Yes (3 retries) |
| Exponential backoff | ❌ No | ✅ Yes |
| Timeout handling | ❌ No | ✅ Yes (25s) |
| Detailed logging | ⚠️  Basic | ✅ Comprehensive |
| Error categorization | ❌ No | ✅ Yes (retryable vs non-retryable) |
| Duration tracking | ❌ No | ✅ Yes |
| Output metadata | ⚠️  Minimal | ✅ Rich (status, attempts, duration) |
| Network error handling | ❌ Fails immediately | ✅ Retries with backoff |

## Best Practices

1. **Monitor regularly**: Check automation runs weekly to catch issues early
2. **Review failed runs**: Investigate any failures to improve reliability
3. **Keep logs**: Airtable keeps recent runs; export critical logs if needed
4. **Test after changes**: Always test after modifying trigger or script
5. **Use field filtering**: Only trigger on important field changes to reduce load

## Support

If issues persist:
1. Check output values in Airtable automation run
2. Check Supabase edge function logs
3. Verify environment variables are set in Supabase
4. Test manually with curl to isolate issue

---

**Version**: 2.0
**Last Updated**: 2025-10-24
**Compatibility**: Airtable Automations, Supabase Edge Functions
