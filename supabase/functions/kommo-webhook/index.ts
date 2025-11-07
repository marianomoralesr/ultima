// Supabase Edge Function: Kommo Webhook Handler
// This function receives webhooks from Kommo CRM and syncs data to Supabase
// Deploy with: supabase functions deploy kommo-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface KommoWebhookPayload {
  leads?: {
    add?: KommoLeadData[];
    update?: KommoLeadData[];
    delete?: KommoLeadData[];
    status?: KommoLeadData[];
    responsible?: KommoLeadData[];
    note?: any[];
  };
  contacts?: {
    add?: any[];
    update?: any[];
    delete?: any[];
  };
}

interface KommoLeadData {
  id: number;
  name: string;
  status_id: number;
  pipeline_id: number;
  responsible_user_id?: number;
  price?: number;
  created_at?: number;
  updated_at?: number;
  created_by?: number;
  updated_by?: number;
  custom_fields_values?: any[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Note: This endpoint is intentionally public to receive webhooks from Kommo
  // We use service_role key to write to database, but endpoint itself is open

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('[Kommo Webhook] Incoming webhook request');
    console.log('[Kommo Webhook] Method:', req.method);
    console.log('[Kommo Webhook] Headers:', Object.fromEntries(req.headers.entries()));

    // Parse webhook payload
    const payload: KommoWebhookPayload = await req.json();
    console.log('[Kommo Webhook] Payload:', JSON.stringify(payload, null, 2));

    const results: any[] = [];

    // Process lead events
    if (payload.leads) {
      // Handle new leads
      if (payload.leads.add && payload.leads.add.length > 0) {
        console.log(`[Kommo Webhook] Processing ${payload.leads.add.length} new lead(s)`);
        for (const lead of payload.leads.add) {
          const result = await processLeadEvent(supabase, 'created', lead);
          results.push(result);
        }
      }

      // Handle lead updates
      if (payload.leads.update && payload.leads.update.length > 0) {
        console.log(`[Kommo Webhook] Processing ${payload.leads.update.length} lead update(s)`);
        for (const lead of payload.leads.update) {
          const result = await processLeadEvent(supabase, 'updated', lead);
          results.push(result);
        }
      }

      // Handle status changes
      if (payload.leads.status && payload.leads.status.length > 0) {
        console.log(`[Kommo Webhook] Processing ${payload.leads.status.length} status change(s)`);
        for (const lead of payload.leads.status) {
          const result = await processLeadEvent(supabase, 'status_changed', lead);
          results.push(result);
        }
      }

      // Handle responsible user changes
      if (payload.leads.responsible && payload.leads.responsible.length > 0) {
        console.log(`[Kommo Webhook] Processing ${payload.leads.responsible.length} responsible change(s)`);
        for (const lead of payload.leads.responsible) {
          const result = await processLeadEvent(supabase, 'responsible_changed', lead);
          results.push(result);
        }
      }

      // Handle lead deletions
      if (payload.leads.delete && payload.leads.delete.length > 0) {
        console.log(`[Kommo Webhook] Processing ${payload.leads.delete.length} lead deletion(s)`);
        for (const lead of payload.leads.delete) {
          const result = await processLeadEvent(supabase, 'deleted', lead);
          results.push(result);
        }
      }
    }

    // Process contact events
    if (payload.contacts) {
      console.log('[Kommo Webhook] Contact events detected but not yet implemented');
    }

    // Log webhook receipt
    await logWebhookEvent(supabase, {
      event_type: determineEventType(payload),
      payload: payload,
      results: results,
      status: 'success'
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        processed: results.length,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[Kommo Webhook] Error:', error);

    // Log error
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await logWebhookEvent(supabase, {
        event_type: 'error',
        payload: await req.clone().json().catch(() => ({})),
        results: [],
        status: 'error',
        error: error.message
      });
    } catch (logError) {
      console.error('[Kommo Webhook] Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Process a single lead event
async function processLeadEvent(
  supabase: any,
  eventType: string,
  lead: KommoLeadData
): Promise<any> {
  console.log(`[Kommo Webhook] Processing lead ${eventType}: ${lead.id}`);

  try {
    // Store/update lead data in kommo_leads table
    const { error } = await supabase
      .from('kommo_leads')
      .upsert({
        kommo_id: lead.id,
        name: lead.name,
        status_id: lead.status_id,
        pipeline_id: lead.pipeline_id,
        responsible_user_id: lead.responsible_user_id,
        price: lead.price || 0,
        created_at: lead.created_at ? new Date(lead.created_at * 1000).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        event_type: eventType,
        is_deleted: eventType === 'deleted',
        raw_data: lead
      }, {
        onConflict: 'kommo_id'
      });

    if (error) {
      console.error('[Kommo Webhook] Error upserting lead:', error);
      throw error;
    }

    console.log(`[Kommo Webhook] Lead ${lead.id} processed successfully`);

    return {
      kommo_id: lead.id,
      event_type: eventType,
      status: 'success'
    };

  } catch (error: any) {
    console.error(`[Kommo Webhook] Error processing lead ${lead.id}:`, error);
    return {
      kommo_id: lead.id,
      event_type: eventType,
      status: 'error',
      error: error.message
    };
  }
}

// Log webhook event
async function logWebhookEvent(
  supabase: any,
  data: {
    event_type: string;
    payload: any;
    results: any[];
    status: string;
    error?: string;
  }
): Promise<void> {
  try {
    await supabase.from('kommo_webhook_logs').insert({
      event_type: data.event_type,
      payload: data.payload,
      results: data.results,
      status: data.status,
      error_message: data.error,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Kommo Webhook] Failed to log webhook event:', error);
  }
}

// Determine event type from payload
function determineEventType(payload: KommoWebhookPayload): string {
  if (payload.leads?.add) return 'leads.add';
  if (payload.leads?.update) return 'leads.update';
  if (payload.leads?.status) return 'leads.status';
  if (payload.leads?.responsible) return 'leads.responsible';
  if (payload.leads?.delete) return 'leads.delete';
  if (payload.contacts?.add) return 'contacts.add';
  if (payload.contacts?.update) return 'contacts.update';
  if (payload.contacts?.delete) return 'contacts.delete';
  return 'unknown';
}
