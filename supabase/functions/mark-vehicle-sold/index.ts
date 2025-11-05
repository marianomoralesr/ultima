// Supabase Edge Function: Mark Vehicle as Sold
// This function receives a webhook from Airtable Automations when a vehicle is sold
// and updates the inventario_cache table to mark it as Historico and vendido=true.
//
// Purpose: Dedicated automation for sold vehicles to ensure reliability
// Deploy with: supabase functions deploy mark-vehicle-sold

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('✅ Mark Vehicle Sold Function Initialized');

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 1. Get Environment Variables ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables.');
    }

    // --- 2. Get ordencompra from Request Body ---
    const body = await req.json();
    const { ordencompra } = body;

    if (!ordencompra) {
      throw new Error("Request body must contain an 'ordencompra' field.");
    }

    console.log(`📡 Processing sold vehicle notification for OrdenCompra: ${ordencompra}`);

    // --- 3. Update Vehicle in Supabase ---
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, check if the vehicle exists
    const { data: existingVehicle, error: fetchError } = await supabase
      .from('inventario_cache')
      .select('id, titulo, record_id, ordenstatus, vendido')
      .eq('ordencompra', ordencompra)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which we want to handle separately
      console.error('❌ Error fetching vehicle:', fetchError);
      throw new Error(`Failed to fetch vehicle: ${fetchError.message}`);
    }

    if (!existingVehicle) {
      console.warn(`⚠️ Vehicle with OrdenCompra ${ordencompra} not found in inventario_cache`);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Vehicle with OrdenCompra ${ordencompra} not found`,
          ordencompra: ordencompra,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    console.log(`📋 Found vehicle: ${existingVehicle.titulo} (ID: ${existingVehicle.id})`);
    console.log(`   Current status: ordenstatus=${existingVehicle.ordenstatus}, vendido=${existingVehicle.vendido}`);

    // Update the vehicle to mark it as sold
    const { error: updateError } = await supabase
      .from('inventario_cache')
      .update({
        ordenstatus: 'Historico',
        vendido: true,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('ordencompra', ordencompra);

    if (updateError) {
      console.error('❌ Error updating vehicle:', updateError);
      throw new Error(`Failed to update vehicle: ${updateError.message}`);
    }

    console.log(`✅ Successfully marked vehicle ${ordencompra} as sold (Historico)`);

    // --- 4. Invalidate rapid-processor cache (fire and forget) ---
    try {
      const rapidProcessorUrl = `${supabaseUrl}/functions/v1/rapid-processor/invalidate-cache`;
      console.log('🔄 Invalidating rapid-processor cache...');

      // Fire and forget - don't wait for response
      fetch(rapidProcessorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }).catch(err => {
        console.warn('⚠️  Cache invalidation failed (non-critical):', err.message);
      });
    } catch (cacheError) {
      console.warn('⚠️  Cache invalidation error (non-critical):', cacheError.message);
    }

    // --- 5. Return Success Response ---
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully marked vehicle as sold`,
        data: {
          ordencompra: ordencompra,
          vehicle_id: existingVehicle.id,
          titulo: existingVehicle.titulo,
          previous_status: {
            ordenstatus: existingVehicle.ordenstatus,
            vendido: existingVehicle.vendido,
          },
          new_status: {
            ordenstatus: 'Historico',
            vendido: true,
          }
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
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
