// Supabase Edge Function for Airtable → Supabase Sync
// Deploy with: supabase functions deploy sync-airtable
// Invoke via cron or webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY')!
const AIRTABLE_BASE_ID = 'appbOPKYqQRW2HgyB'
const AIRTABLE_TABLE_ID = 'tblOjECDJDZlNv8At'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get last sync time
    const { data: lastSync } = await supabaseClient
      .from('inventario_cache')
      .select('last_synced_at')
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .single()

    const lastSyncTime = lastSync?.last_synced_at

    // Fetch from Airtable
    const airtableUrl = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`
    )

    if (lastSyncTime) {
      const isoDate = new Date(lastSyncTime).toISOString()
      airtableUrl.searchParams.append(
        'filterByFormula',
        `OR({OrdenStatus} = "Comprado", AND(LAST_MODIFIED_TIME() > "${isoDate}", {OrdenStatus} = "Historico"))`
      )
    } else {
      airtableUrl.searchParams.append('filterByFormula', '{OrdenStatus} = "Comprado"')
    }

    const response = await fetch(airtableUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    })

    const { records } = await response.json()

    // Normalize and upsert (simplified version)
    const normalized = records.map((record: any) => ({
      record_id: record.id,
      ordencompra: record.fields.OrdenCompra,
      title: record.fields.Auto,
      marca: record.fields.AutoMarca,
      modelo: record.fields.AutoSubmarcaVersion,
      precio: record.fields.Precio,
      ordenstatus: record.fields.OrdenStatus,
      data: record.fields,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    if (normalized.length > 0) {
      const { error } = await supabaseClient
        .from('inventario_cache')
        .upsert(normalized, { onConflict: 'record_id' })

      if (error) throw error
    }

    // Mark sold vehicles
    const airtableRecordIds = records.map((r: any) => r.id)
    const { data: currentVehicles } = await supabaseClient
      .from('inventario_cache')
      .select('record_id')
      .eq('ordenstatus', 'Comprado')

    const soldRecordIds = currentVehicles
      ?.filter((v: any) => !airtableRecordIds.includes(v.record_id))
      .map((v: any) => v.record_id) || []

    if (soldRecordIds.length > 0) {
      await supabaseClient
        .from('inventario_cache')
        .update({ ordenstatus: 'Historico', vendido: true })
        .in('record_id', soldRecordIds)
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: normalized.length,
        markedAsSold: soldRecordIds.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
