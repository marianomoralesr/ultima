# Airtable → Supabase Sync Documentation

## Overview

The `populate-cache-from-airtable.cjs` script syncs **ALL** fields from your Airtable `Inventario` table to Supabase's `inventario_cache` table.

## Features

✅ **Complete Field Mapping** - Maps all 50+ fields from Airtable to Supabase
✅ **Image Upload** - Automatically uploads images to Supabase Storage (`fotos_airtable` bucket)
✅ **Smart Data Normalization** - Handles arrays, booleans, numbers, dates, and JSONB
✅ **Upsert Logic** - Updates existing records and inserts new ones (based on `record_id`)
✅ **Batch Processing** - Processes in chunks to avoid timeouts
✅ **Error Handling** - Comprehensive logging and error recovery

## Field Mapping

### Airtable → Supabase Column Mapping

| Airtable Field | Supabase Column | Type | Notes |
|---|---|---|---|
| `id` (Record ID) | `record_id` | text | Primary key |
| `OrdenCompra` | `ordencompra` | text | Order ID |
| `Auto` | `title` | text | Vehicle title |
| `AutoMarca` | `marca` | text | Brand |
| `AutoSubmarcaVersion` | `modelo` | text | Model |
| `AutoAño` | `autoano` | integer | Year |
| `Precio` | `precio` | numeric | Price |
| `Oferta` | `oferta` | numeric | Offer price |
| `fotos_exterior` | `fotos_exterior_url` | jsonb | Uploaded to Storage |
| `fotos_interior` | `fotos_interior_url` | jsonb | Uploaded to Storage |
| `feature_image` | `feature_image_url` | text | Uploaded to Storage |
| `autotransmision` | `autotransmision` | text | Transmission |
| `autocombustible` | `autocombustible` | jsonb | Fuel type |
| `autokilometraje` | `kilometraje` | jsonb | Mileage |
| `carroceria` | `carroceria` | text | Body type |
| `OrdenStatus` | `ordenstatus` | text | Status |
| `Separado` | `separado` | boolean | Reserved |
| `Vendido` | `vendido` | boolean | Sold |
| `Es rezago` | `rezago` | boolean | Clearance |
| `Consigna` | `consigna` | boolean | Consignment |
| `Ubicacion` | `ubicacion` | text | Location |
| `descripcion` | `descripcion` | text | Description HTML |
| `metadesc.value` | `description` | text | Meta description |
| `slug` / `ligawp` | `slug` | text | URL slug |
| `Enganche` | `enganchemin` | numeric | Minimum down payment |
| `EngancheRecomendado` | `enganche_recomendado` | text | Recommended down payment |
| `EngancheConBono` | `enganche_con_bono` | numeric | Down payment with bonus |
| `PlazoMax` | `plazomax` | numeric | Max term |
| `PagoMensual` | `pagomensual` | numeric | Monthly payment |
| `MensualidadRecomendada` | `mensualidad_recomendada` | numeric | Recommended monthly |
| `MensualidadMinima` | `mensualidad_minima` | numeric | Minimum monthly |
| `Formula` | `formulafinanciamiento` | text | Finance URL |
| `garantia` | `garantia` | text | Warranty |
| `NumeroDuenos` | `numero_duenos` | numeric | Number of owners |
| `VIN` | `vin` | text | VIN number |
| `factura` | `factura` | text | Invoice |
| `AutoMotor` | `AutoMotor` | text | Engine |
| `cilindros` | `cilindros` | text | Cylinders |
| `Video ID` | `video_url` | text | Video URL |
| `reel_url` / `Reel` | `reel_url` | text | Reel URL |
| `LigaBot` | `liga_boton_con_whatsapp` | text | WhatsApp link |
| `Promociones` | `promociones` | jsonb | Promotions array |
| `ClasificacionID` | `clasificacionid` | text | Classification |
| `FechaIngreso` | `ingreso_inventario` | timestamptz | Inventory date |
| `viewcount` | `viewcount` | numeric | View count |
| **(all fields)** | `data` | jsonb | Full Airtable record |

## Prerequisites

### 1. Install Dependencies

```bash
cd "/Users/marianomorales/Downloads/ultima copy"
npm install @supabase/supabase-js node-fetch
```

### 2. Get API Keys

**Airtable API Key:**
1. Go to https://airtable.com/create/tokens
2. Create a new Personal Access Token
3. Give it access to your `TREFA Inventario` base
4. Scopes needed: `data.records:read`, `schema.bases:read`

**Supabase Service Key:**
1. Go to Supabase Dashboard → Project Settings → API
2. Copy the **`service_role` key** (NOT the `anon` key!)
3. ⚠️ **IMPORTANT**: This key bypasses RLS. Keep it secure!

### 3. Supabase Storage Bucket

Ensure the `fotos_airtable` bucket exists:

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos_airtable', 'fotos_airtable', true)
ON CONFLICT (id) DO NOTHING;

-- Make bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'fotos_airtable';
```

## Usage

### Basic Sync (with image upload)

```bash
AIRTABLE_API_KEY=your_airtable_key \
SUPABASE_SERVICE_KEY=your_supabase_service_key \
node populate-cache-from-airtable.cjs
```

### Skip Image Upload (faster sync)

```bash
AIRTABLE_API_KEY=your_airtable_key \
SUPABASE_SERVICE_KEY=your_supabase_service_key \
UPLOAD_IMAGES=false \
node populate-cache-from-airtable.cjs
```

### Using .env File

Create `.env` file:

```bash
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://jjepfehmuybpctdzipnu.supabase.co
```

Then run:

```bash
export $(cat .env | xargs) && node populate-cache-from-airtable.cjs
```

## What the Script Does

### Step 1: Fetch from Airtable
- Fetches all records where `OrdenStatus = "Comprado"`
- Paginates through all results (100 per page)
- Logs progress for each page

### Step 2: Normalize Data
- Maps Airtable field names to Supabase column names
- Converts data types (strings to numbers, dates to ISO format)
- Handles null values gracefully
- Extracts image URLs from attachment fields

### Step 3: Upload Images (optional)
- Downloads each image from Airtable
- Uploads to Supabase Storage (`fotos_airtable` bucket)
- Organizes by: `{ordencompra}/{field_name}/att{index}.{ext}`
- Returns public URLs for use in database

### Step 4: Upsert to Supabase
- Inserts or updates records based on `record_id`
- Processes in batches of 100 to avoid timeouts
- Sets `last_synced_at` and `updated_at` timestamps

## Example Output

```
[2025-10-20T12:00:00.000Z] 🚀 Starting Airtable → Supabase sync...

[2025-10-20T12:00:01.234Z] 📡 Fetching vehicles from Airtable...
[2025-10-20T12:00:02.456Z] 📄 Fetching page 1...
[2025-10-20T12:00:03.789Z] ✓ Fetched 100 records (total: 100)
[2025-10-20T12:00:04.012Z] 📄 Fetching page 2...
[2025-10-20T12:00:05.234Z] ✓ Fetched 50 records (total: 150)
[2025-10-20T12:00:06.456Z] ✅ Successfully fetched 150 vehicles from Airtable

[2025-10-20T12:00:07.789Z] 🔄 Normalizing 150 Airtable records...
[2025-10-20T12:00:08.012Z] [1/150] Processing ID001638...
[2025-10-20T12:00:09.234Z]   📸 Uploading images for ID001638...
[2025-10-20T12:00:12.456Z]   ✓ Uploaded 21 images
[2025-10-20T12:00:13.789Z] [2/150] Processing ID001637...
...
[2025-10-20T12:05:00.000Z] ✅ Normalized 150 records

[2025-10-20T12:05:01.234Z] 📤 Upserting 150 vehicles to Supabase...
[2025-10-20T12:05:02.456Z]   Upserting batch 1/2...
[2025-10-20T12:05:04.789Z]   ✓ Upserted 100 records
[2025-10-20T12:05:05.012Z]   Upserting batch 2/2...
[2025-10-20T12:05:06.234Z]   ✓ Upserted 50 records
[2025-10-20T12:05:07.456Z] ✅ Upsert complete: 150 succeeded, 0 failed

[2025-10-20T12:05:08.789Z] ✅ Sync completed successfully!
[2025-10-20T12:05:08.790Z] 📊 Total vehicles synced: 150
```

## Automating the Sync

### Option 1: Cron Job (Every Hour)

```bash
# Add to crontab (crontab -e)
0 * * * * cd /path/to/project && AIRTABLE_API_KEY=xxx SUPABASE_SERVICE_KEY=xxx node populate-cache-from-airtable.cjs >> /var/log/airtable-sync.log 2>&1
```

### Option 2: Supabase Edge Function (Webhooks)

Set up an Airtable webhook to trigger the sync when records change.

### Option 3: GitHub Actions (Scheduled)

```yaml
name: Sync Airtable to Supabase
on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install @supabase/supabase-js node-fetch
      - run: node populate-cache-from-airtable.cjs
        env:
          AIRTABLE_API_KEY: ${{ secrets.AIRTABLE_API_KEY }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

## Troubleshooting

### Error: "AIRTABLE_API_KEY environment variable is required"
- Make sure you exported the environment variable
- Check that the key starts with `pat` (Personal Access Token)

### Error: "SUPABASE_SERVICE_KEY environment variable is required"
- Ensure you're using the **service_role** key, not the anon key
- The service_role key starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

### Error: "StorageApiError: Bucket not found"
- Run the SQL commands above to create the `fotos_airtable` bucket

### Images not uploading
- Check Supabase Storage policies
- Ensure the bucket is public
- Verify the service_role key has storage permissions

### Sync is slow
- Set `UPLOAD_IMAGES=false` to skip image uploads
- Images from Airtable URLs still work (they're temporary URLs)

## Performance

- **Without image upload**: ~2-5 seconds per 100 records
- **With image upload**: ~30-60 seconds per vehicle (depends on image count)
- **150 vehicles with images**: ~5-10 minutes total

## Best Practices

1. **Use service_role key** - The anon key won't work for storage uploads
2. **Run during off-peak hours** - Reduces load on production database
3. **Monitor logs** - Check for warnings about missing fields or failed uploads
4. **Test on staging first** - Verify sync works before running on production
5. **Keep Airtable structure stable** - Field renames require script updates

## Security

⚠️ **NEVER commit API keys to Git!**

Add to `.gitignore`:
```
.env
.env.local
*.key
*_key.txt
```

Store keys in:
- Environment variables
- GitHub Secrets (for Actions)
- Vercel/Railway/Render environment variables
- Secrets manager (AWS Secrets Manager, etc.)

## Support

For issues or questions:
1. Check the console output for error messages
2. Verify API keys are correct and have proper permissions
3. Check Supabase logs in Dashboard → Database → Logs
4. Review Airtable API rate limits (5 requests/second)
