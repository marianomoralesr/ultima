import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Get credentials from environment variables (set via Supabase secrets)
const INTELIMOTOR_API_KEY = Deno.env.get('INTELIMOTOR_API_KEY');
const INTELIMOTOR_API_SECRET = Deno.env.get('INTELIMOTOR_API_SECRET');
const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, method, headers, body } = await req.json();
    const targetUrl = new URL(url);

    console.log(`📡 Proxy request: ${method} ${targetUrl.pathname}`);

    let response;
    if (targetUrl.hostname.includes('api.airtable.com')) {
      // For Airtable, use Bearer token authentication
      if (!AIRTABLE_API_KEY) {
        return new Response(JSON.stringify({ error: 'AIRTABLE_API_KEY not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      response = await fetch(url, {
        method,
        headers: {
          ...headers,
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
        body: body ? JSON.stringify(body) : null,
      });
    } else if (targetUrl.hostname.includes('intelimotor.com')) {
      // For Intelimotor, add credentials as QUERY PARAMETERS (not headers)
      if (!INTELIMOTOR_API_KEY || !INTELIMOTOR_API_SECRET) {
        console.error('❌ Missing Intelimotor credentials in environment');
        return new Response(JSON.stringify({
          error: 'INTELIMOTOR_API_KEY or INTELIMOTOR_API_SECRET not configured in Edge Function secrets'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add authentication as query parameters (Intelimotor requirement)
      targetUrl.searchParams.set('apiKey', INTELIMOTOR_API_KEY);
      targetUrl.searchParams.set('apiSecret', INTELIMOTOR_API_SECRET);

      console.log(`✓ Calling Intelimotor: ${method} ${targetUrl.pathname}`);

      response = await fetch(targetUrl.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null,
      });

      console.log(`✓ Intelimotor response: ${response.status}`);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid target URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Upstream API error:', response.status, JSON.stringify(data));
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
