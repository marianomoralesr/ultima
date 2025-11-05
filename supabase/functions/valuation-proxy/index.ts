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
    let data;
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

      data = await response.json();
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

      // Add lite parameter only if explicitly requested in body
      if (body && body.lite === true) {
        targetUrl.searchParams.set('lite', 'true');
        console.log('✓ Added lite=true as query parameter');
      }

      console.log(`✓ Calling Intelimotor: ${method} ${targetUrl.pathname}`);
      console.log(`✓ Full URL: ${targetUrl.toString()}`);
      console.log(`✓ Query params:`, Object.fromEntries(targetUrl.searchParams.entries()));

      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Only add body for non-GET requests
      if (method !== 'GET' && body) {
        fetchOptions.body = JSON.stringify(body);
        console.log(`✓ Request body:`, body);
      }

      response = await fetch(targetUrl.toString(), fetchOptions);

      console.log(`✓ Intelimotor response status: ${response.status}`);

      // Log response body for debugging
      const responseText = await response.text();
      console.log(`✓ Intelimotor response body (first 500 chars):`, responseText.substring(0, 500));

      // Parse back to JSON
      data = JSON.parse(responseText);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid target URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
