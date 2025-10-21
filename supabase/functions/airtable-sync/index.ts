import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define CORS headers for preflight and actual requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Airtable Single-Record Sync Function Initialized');

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 1. Get Environment Variables ---
    const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY');
    const airtableBaseId = Deno.env.get('AIRTABLE_BASE_ID');
    const airtableTableId = Deno.env.get('AIRTABLE_TABLE_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!airtableApiKey || !airtableBaseId || !airtableTableId || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables.');
    }

    // --- 2. Get recordId from Request Body ---
    const body = await req.json();
    const { recordId } = body;

    if (!recordId) {
      throw new Error("Request body must contain a 'recordId'.");
    }
    console.log(`Processing update for Airtable record: ${recordId}`);

    // --- 3. Fetch Single Record from Airtable ---
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableId}/${recordId}`;

    const response = await fetch(airtableUrl, {
      headers: {
        Authorization: `Bearer ${airtableApiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      // If the record was deleted in Airtable, it will return a 404.
      // We can choose to ignore this or handle it by deleting it in Supabase.
      // For now, we will log it and exit gracefully.
      if (response.status === 404) {
        console.log(`Record ${recordId} not found in Airtable. It may have been deleted. No action taken.`);
        return new Response(JSON.stringify({ message: `Record ${recordId} not found in Airtable.` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      throw new Error(`Airtable API Error: ${errorData.error?.message || 'Failed to fetch data'}`);
    }

    const record = await response.json();
    console.log(`Successfully fetched record: ${record.id}`);

    // --- 4. Transform Data for Supabase ---
    const supabaseData = {
        record_id: record.id, // Use Airtable record ID as the unique key
        ...record.fields
    };

    // --- 5. Upsert Data into Supabase ---
    console.log(`Upserting record ${record.id} into Supabase...`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('inventario_cache')
      .upsert(supabaseData, {
        onConflict: 'record_id', // Use the Airtable record ID to match the row
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    console.log('Supabase upsert successful.');

    // --- 6. Return Success Response ---
    return new Response(JSON.stringify({ message: `Successfully synced record ${record.id}.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('An error occurred:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});