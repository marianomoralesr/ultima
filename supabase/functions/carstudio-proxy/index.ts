import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("CarStudio Proxy function started")

const ALLOWED_DOMAINS = [
  'tokyo.carstudio.ai'
]

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-ApiKey',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  try {
    const url = new URL(req.url)
    const targetUrl = url.searchParams.get('url')

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    // Validate the target URL is from an allowed domain
    const targetDomain = new URL(targetUrl).hostname
    if (!ALLOWED_DOMAINS.includes(targetDomain)) {
      return new Response(
        JSON.stringify({ error: 'Domain not allowed' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    console.log(`Proxying request to: ${targetUrl}`)

    // Forward headers except host
    const headers = new Headers()
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value)
      }
    })

    // Make the proxied request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.arrayBuffer() : undefined,
    })

    // Forward the response with CORS headers
    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-ApiKey')

    return new Response(await response.arrayBuffer(), {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to proxy request to CarStudio API'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
})
