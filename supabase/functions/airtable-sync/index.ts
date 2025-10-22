// Supabase Edge Function: Airtable Webhook → inventario_cache Sync
// This function receives a single record update from Airtable webhooks
// Deploy with: supabase functions deploy airtable-sync

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('✅ Airtable Webhook Sync Function Initialized');

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 1. Get Environment Variables ---
    const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY');
    const airtableBaseId = Deno.env.get('AIRTABLE_BASE_ID') || 'appbOPKYqQRW2HgyB';
    const airtableTableId = Deno.env.get('AIRTABLE_TABLE_ID') || 'tblOjECDJDZlNv8At';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!airtableApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables.');
    }

    // --- 2. Get recordId from Request Body ---
    const body = await req.json();
    const { recordId } = body;

    if (!recordId) {
      throw new Error("Request body must contain a 'recordId'.");
    }

    console.log(`📡 Processing webhook for Airtable record: ${recordId}`);

    // --- 3. Fetch Single Record from Airtable ---
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableId}/${recordId}`;

    const response = await fetch(airtableUrl, {
      headers: {
        Authorization: `Bearer ${airtableApiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();

      // If record was deleted in Airtable (404), remove from Supabase
      if (response.status === 404) {
        console.log(`🗑️ Record ${recordId} not found in Airtable. Deleting from Supabase...`);

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error: deleteError } = await supabase
          .from('inventario_cache')
          .delete()
          .eq('record_id', recordId);

        if (deleteError) {
          console.error('Error deleting record:', deleteError);
        } else {
          console.log(`✅ Deleted record ${recordId} from Supabase`);
        }

        return new Response(
          JSON.stringify({ message: `Record ${recordId} deleted from cache.` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      throw new Error(`Airtable API Error: ${errorData.error?.message || 'Failed to fetch data'}`);
    }

    const record = await response.json();
    console.log(`✅ Fetched record: ${record.id}`);

    // --- 4. Check OrdenStatus and Handle Business Logic ---
    const fields = record.fields;
    const ordenStatus = fields.OrdenStatus || '';

    console.log(`📋 Record status: ${ordenStatus}`);

    // If the record changed from "Comprado" to something else (e.g., "Historico", "Vendido"),
    // update it in Supabase to mark it as not active
    if (ordenStatus !== 'Comprado') {
      console.log(`⚠️ Record ${recordId} is no longer "Comprado" (status: ${ordenStatus}). Updating to Historico in Supabase...`);

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Update the record to mark it as Historico so it won't show in listings
      const { error: updateError } = await supabase
        .from('inventario_cache')
        .update({
          ordenstatus: 'Historico',
          vendido: true,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('record_id', recordId);

      if (updateError) {
        console.error('❌ Error updating record to Historico:', updateError);
        throw new Error(`Failed to update record to Historico: ${updateError.message}`);
      }

      console.log(`✅ Updated record ${recordId} to Historico status`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Record ${recordId} updated to Historico (was: ${ordenStatus})`,
          data: {
            record_id: recordId,
            ordenstatus: 'Historico',
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Only sync records with OrdenStatus = "Comprado"
    console.log(`✅ Record is "Comprado" - proceeding with sync`);

    // --- 5. Transform Data for Supabase (Normalize Field Names) ---

    // Helper functions
    const getImageUrls = (attachments: any): string[] => {
      if (!attachments || !Array.isArray(attachments)) return [];
      return attachments.map((att: any) => att.url || att.thumbnails?.large?.url).filter(Boolean);
    };

    const getArrayField = (fieldValue: any): string[] => {
      if (!fieldValue) return [];
      if (Array.isArray(fieldValue)) return fieldValue.map(String).filter(Boolean);
      if (typeof fieldValue === 'string') {
        return fieldValue.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [String(fieldValue)];
    };

    // Convert single-element arrays to strings, otherwise keep as array
    const normalizeArrayOrString = (fieldValue: any): string | string[] => {
      const arrayValue = getArrayField(fieldValue);
      return arrayValue.length === 1 ? arrayValue[0] : arrayValue;
    };

    // Get string value from field, checking multiple possible field names
    const getStringField = (primaryField: any, fallbackField: any): string => {
      if (primaryField) {
        if (Array.isArray(primaryField)) {
          return primaryField[0] || '';
        }
        return String(primaryField);
      }
      if (fallbackField) {
        if (Array.isArray(fallbackField)) {
          return fallbackField[0] || '';
        }
        return String(fallbackField);
      }
      return '';
    };

    // Get number value, checking multiple possible field names
    const getNumberField = (primaryField: any, fallbackField: any): number => {
      const value = primaryField ?? fallbackField;
      if (!value) return 0;
      if (Array.isArray(value)) {
        return parseFloat(value[0]) || 0;
      }
      return parseFloat(value) || 0;
    };

    // Build title
    const titulo = fields.AutoMarca && fields.AutoSubmarcaVersion
      ? `${fields.AutoMarca} ${fields.AutoSubmarcaVersion}`.trim()
      : fields.Auto || 'Auto sin título';

    // Extract images
    const exteriorImages = getImageUrls(fields.fotos_exterior_url);
    const interiorImages = getImageUrls(fields.fotos_interior_url);
    const featureImage = getImageUrls(fields.feature_image)[0] || exteriorImages[0] || '';

    // Normalize combustible field (check autocombustible, then combustible)
    const combustibleValue = getStringField(fields.autocombustible, fields.combustible);

    // Normalize kilometraje field (check autokilometraje, then kilometraje)
    const kilometrajeValue = getNumberField(fields.autokilometraje, fields.kilometraje);

    // Normalize transmision field
    const transmisionValue = getStringField(fields.autotransmision, fields.transmision);

    // Normalize ubicacion - convert ["Guadalupe"] to "Guadalupe"
    const ubicacionValue = normalizeArrayOrString(fields.Ubicacion);

    // Normalize clasificacionid - convert ["SUV"] to "SUV"
    const clasificacionValue = normalizeArrayOrString(fields.ClasificacionID);

    // Map Airtable fields to Supabase columns
    const supabaseData = {
      record_id: record.id,
      title: titulo,
      slug: (fields.ligawp || fields.slug || record.id).toLowerCase().replace(/\s+/g, '-'),
      precio: parseFloat(fields.Precio || '0'),
      marca: fields.AutoMarca || 'Sin Marca',
      modelo: fields.AutoSubmarcaVersion || '',
      transmision: transmisionValue,
      autotransmision: transmisionValue,
      combustible: combustibleValue,
      autocombustible: combustibleValue,
      kilometraje: kilometrajeValue,
      autokilometraje: kilometrajeValue,
      feature_image: featureImage,
      fotos_exterior_url: exteriorImages,
      fotos_interior_url: interiorImages,
      ordencompra: fields.OrdenCompra || '',
      ordenstatus: fields.OrdenStatus || '',
      separado: fields.OrdenStatus === 'Separado',
      vendido: fields.vendido === true,
      clasificacionid: clasificacionValue,
      ubicacion: ubicacionValue,
      descripcion: fields.descripcion || '',
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Store full Airtable data for reference
      data: fields,
    };

    // --- 6. Upsert Data into Supabase ---
    console.log(`📤 Upserting record ${record.id} into Supabase...`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('inventario_cache')
      .upsert(supabaseData, {
        onConflict: 'record_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('❌ Supabase Error:', error);
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    console.log(`✅ Successfully synced record ${record.id}`);

    // --- 7. Return Success Response ---
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced record ${record.id}`,
        data: {
          record_id: record.id,
          title: titulo,
          ordencompra: fields.OrdenCompra,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error occurred:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
