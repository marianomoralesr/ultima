# Application Submission & Mega Menu Fixes - Implementation Plan

## Issues to Fix

1. **Application Status Logic**: Applications should be marked as "Completa" if documents are uploaded, "Faltan Documentos" if submitted without documents
2. **Google Sheets Sync**: Edge Function must include new columns (Compañía Celular, Correo Electrónico del Asesor)
3. **Mega Menu Lists**: Brands and models lists not showing
4. **Price Range Filters**: Not working properly

---

## Issue 1: Application Status Logic

### Current Problem:
In `src/services/ApplicationService.ts` line 66, the status is hardcoded to `'reviewing'`:

```typescript
const newStatus = 'reviewing'; // Changed from 'submitted' or 'pending_docs' to 'reviewing'
```

This ignores whether documents have been uploaded.

### Solution:

**File**: `src/services/ApplicationService.ts`

Replace the `updateApplication` method (lines 59-91) with:

```typescript
async updateApplication(applicationId: string, applicationData: Record<string, any> & { documents_pending?: boolean }): Promise<UpdatedApplicationData | null> {
  if (applicationData.status === 'submitted') {
      const result = await this.submitApplication({ ...applicationData, id: applicationId });
      return result ? { ...result, status: 'submitted', updated_at: new Date().toISOString() } : null;
  }

  // Check if application has all required documents
  const hasAllDocuments = await this.checkApplicationDocuments(applicationId, applicationData);

  // Set status based on documents
  const newStatus = hasAllDocuments ? 'Completa' : 'Faltan Documentos';

  const patch: Record<string, any> = { status: newStatus };
  for (const [k, v] of Object.entries(applicationData)) {
    if (v !== undefined && k !== 'documents_pending') patch[k] = v;
  }

  const { data, error } = await supabase
    .from('financing_applications')
    .update(patch)
    .eq('id', applicationId)
    .select('id, status, updated_at')
    .maybeSingle();

  if (error) {
    console.error('Error updating application:', error.message, { code: error.code, details: error.details });

    // Better error message for constraint violations
    if (error.message?.includes('unique') || error.message?.includes('constraint')) {
      throw new Error('Ya tienes una solicitud activa. Solo puedes tener una solicitud a la vez.');
    }

    throw new Error('No se pudo enviar la solicitud.');
  }

  return data;
},

// Add this new helper method
async checkApplicationDocuments(applicationId: string, applicationData: Record<string, any>): Promise<boolean> {
  // Check for uploaded documents in R2 or application data
  const requiredDocFields = [
    'ine_url',
    'comprobante_domicilio_url',
    'comprobante_ingresos_url'
  ];

  // First check if documents are provided in the current update
  const hasDocsInData = requiredDocFields.some(field =>
    applicationData[field] && String(applicationData[field]).trim() !== ''
  );

  if (hasDocsInData) return true;

  // If not in data, check existing application
  const { data: app, error } = await supabase
    .from('financing_applications')
    .select(requiredDocFields.join(', '))
    .eq('id', applicationId)
    .maybeSingle();

  if (error || !app) return false;

  // Check if at least the INE is uploaded (minimum requirement)
  return Boolean(app.ine_url && String(app.ine_url).trim() !== '');
},
```

---

## Issue 2: Google Sheets Sync - Missing Columns

### Current Problem:
The Edge Function `google-sheets-sync` doesn't include the new columns.

### Solution:

**File**: `supabase/functions/google-sheets-sync/index.ts`

Find the row data mapping (likely around where it builds the array for Google Sheets) and add the new columns:

```typescript
// Add these fields to the row data array
const rowData = [
  // ... existing fields ...
  application?.application_data?.mobile_carrier || '', // Compañía Celular
  advisor?.email || '', // Correo Electrónico del Asesor
  // ... rest of fields ...
];
```

The exact location depends on the current structure. The Edge Function should be triggered by the database trigger when an application status changes to 'Completa' or 'Faltan Documentos'.

---

## Issue 3: Mega Menu Lists Not Showing

### Current Problem:
Looking at `src/components/MegaMenu.tsx` lines 64-79, the query fetches data but the issue might be in how brands/models are extracted.

### Debugging Steps:

1. Check if `brandsAndModels` has data:
```typescript
console.log('Brands and Models data:', brandsAndModels);
```

2. Verify the unique brands/models extraction logic (likely after line 100)

### Likely Fix:

The brands and models lists need to be extracted from the `brandsAndModels` data. Add this after the `getPriceRangeCounts` function:

```typescript
const uniqueBrands = useMemo(() => {
    if (!brandsAndModels) return [];

    const brandCounts = new Map<string, number>();
    brandsAndModels.forEach(v => {
        if (v.automarca) {
            brandCounts.set(v.automarca, (brandCounts.get(v.automarca) || 0) + 1);
        }
    });

    return Array.from(brandCounts.entries())
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15); // Top 15 brands
}, [brandsAndModels]);

const uniqueModels = useMemo(() => {
    if (!brandsAndModels) return [];

    const modelCounts = new Map<string, { brand: string; count: number }>();
    brandsAndModels.forEach(v => {
        if (v.automodelo && v.automarca) {
            const key = `${v.automarca}|${v.automodelo}`;
            const existing = modelCounts.get(key);
            modelCounts.set(key, {
                brand: v.automarca,
                count: (existing?.count || 0) + 1
            });
        }
    });

    return Array.from(modelCounts.entries())
        .map(([key, data]) => ({
            brand: data.brand,
            model: key.split('|')[1],
            count: data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20 models
}, [brandsAndModels]);
```

---

## Issue 4: Price Range Filters Not Working

### Current Problem:
The price range filter navigates to `/autos` but doesn't apply the filter.

### Solution:

In the `PricingRangeWidget` component, find where it handles the click (likely around line 120-150) and ensure it includes the price filter in the URL:

```typescript
const handlePriceRangeClick = (rangeId: string) => {
    const rangeMap: Record<string, { min: number; max: number | null }> = {
        '1': { min: 0, max: 250000 },
        '2': { min: 250000, max: 300000 },
        '3': { min: 300000, max: 350000 },
        '4': { min: 350000, max: 450000 },
        '5': { min: 450000, max: null },
    };

    const range = rangeMap[rangeId];
    if (!range) return;

    const params = new URLSearchParams();
    params.set('precioMin', range.min.toString());
    if (range.max) {
        params.set('precioMax', range.max.toString());
    }

    navigate(`/autos?${params.toString()}`);
    onClose();
};
```

Then in the price range cards/buttons, use:

```tsx
<button onClick={() => handlePriceRangeClick('1')}>
    $250,000 o menos ({priceRangeCounts['1'] || 0})
</button>
```

---

## Database Function Fix (submit_application)

Check if there's a database function that handles submission. If the status logic is in SQL:

**File**: Look for migration file with `CREATE OR REPLACE FUNCTION submit_application`

The function should check for documents and set status accordingly:

```sql
CREATE OR REPLACE FUNCTION submit_application(application_data JSONB)
RETURNS UUID AS $$
DECLARE
    app_id UUID;
    has_documents BOOLEAN;
BEGIN
    -- Extract application ID
    app_id := (application_data->>'id')::UUID;

    -- Check if required documents exist
    has_documents := (
        (application_data->>'ine_url' IS NOT NULL AND application_data->>'ine_url' != '')
        OR
        EXISTS (
            SELECT 1 FROM financing_applications
            WHERE id = app_id
            AND ine_url IS NOT NULL
            AND ine_url != ''
        )
    );

    -- Update application with appropriate status
    UPDATE financing_applications
    SET
        status = CASE
            WHEN has_documents THEN 'Completa'
            ELSE 'Faltan Documentos'
        END,
        car_info = COALESCE((application_data->>'car_info')::JSONB, car_info),
        application_data = COALESCE((application_data->>'application_data')::JSONB, application_data),
        selected_banks = COALESCE((application_data->>'selected_banks')::JSONB, selected_banks),
        updated_at = NOW()
    WHERE id = app_id;

    RETURN app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Testing Checklist

After implementing fixes:

- [ ] Submit application WITH documents → Status should be "Completa"
- [ ] Submit application WITHOUT documents → Status should be "Faltan Documentos"
- [ ] Application appears in correct bank dashboard
- [ ] Google Sheets receives new row with all columns including:
  - Compañía Celular
  - Correo Electrónico del Asesor
- [ ] Mega menu shows brands list
- [ ] Mega menu shows models list
- [ ] Price range filters navigate with correct parameters
- [ ] Price range counts display correctly

---

## Priority Order:

1. **Application Status Logic** (Critical - affects workflow)
2. **Google Sheets Sync** (Critical - data integrity)
3. **Price Range Filters** (High - user experience)
4. **Mega Menu Lists** (Medium - navigation enhancement)

---

## Files to Modify:

1. `src/services/ApplicationService.ts`
2. `supabase/functions/google-sheets-sync/index.ts`
3. `src/components/MegaMenu.tsx`
4. Possibly: `supabase/migrations/*_submit_application.sql` (if exists)
