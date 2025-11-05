// Supabase Edge Function: r2-list
// Lists files in Cloudflare R2 bucket using direct S3 API calls
// Rewritten to avoid AWS SDK filesystem dependencies

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash, createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 helpers
function hmacSha256(key: Uint8Array | string, data: string): Uint8Array {
  const hmac = createHmac('sha256', key);
  hmac.update(data);
  return new Uint8Array(hmac.digest());
}

function sha256Hash(data: string): string {
  const hash = createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Uint8Array {
  const kDate = hmacSha256(`AWS4${key}`, dateStamp);
  const kRegion = hmacSha256(kDate, regionName);
  const kService = hmacSha256(kRegion, serviceName);
  const kSigning = hmacSha256(kService, 'aws4_request');
  return kSigning;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prefix } = await req.json();

    if (!prefix) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: prefix' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get R2 configuration from environment
    const R2_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const R2_ACCESS_KEY_ID = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    const R2_BUCKET_NAME = 'trefa-images';

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return new Response(
        JSON.stringify({ error: 'R2 credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare S3 ListObjectsV2 request
    const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const region = 'auto';
    const service = 's3';

    // Build query string for ListObjectsV2
    // IMPORTANT: AWS Signature V4 requires query parameters in alphabetical order
    const canonicalQuerystring = `list-type=2&max-keys=100&prefix=${encodeURIComponent(prefix)}`;
    const endpoint = `https://${host}/${R2_BUCKET_NAME}?${canonicalQuerystring}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const payloadHash = sha256Hash('');

    // Create canonical request
    const canonicalUri = `/${R2_BUCKET_NAME}`;
    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `GET\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const canonicalRequestHash = sha256Hash(canonicalRequest);
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

    // Calculate signature
    const signingKey = getSignatureKey(R2_SECRET_ACCESS_KEY, dateStamp, region, service);
    const signature = Array.from(hmacSha256(signingKey, stringToSign))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create authorization header
    const authorizationHeader = `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Make request to R2
    console.log(`Listing objects with prefix: ${prefix}`);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Host': host,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authorizationHeader,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`R2 list failed (${response.status}):`, errorText);
      throw new Error(`R2 list failed (${response.status}): ${errorText}`);
    }

    // Parse XML response
    const xmlText = await response.text();

    // Simple XML parsing for ListObjectsV2 response
    const files: Array<{ key: string; size: number; lastModified: string }> = [];

    // Extract all <Contents> blocks
    const contentsRegex = /<Contents>(.*?)<\/Contents>/gs;
    const matches = xmlText.matchAll(contentsRegex);

    for (const match of matches) {
      const content = match[1];

      // Extract Key
      const keyMatch = content.match(/<Key>(.*?)<\/Key>/);
      const key = keyMatch ? keyMatch[1] : null;

      // Skip if no key or if it's a directory marker
      if (!key || key.endsWith('/')) continue;

      // Extract Size
      const sizeMatch = content.match(/<Size>(.*?)<\/Size>/);
      const size = sizeMatch ? parseInt(sizeMatch[1]) : 0;

      // Extract LastModified
      const lastModifiedMatch = content.match(/<LastModified>(.*?)<\/LastModified>/);
      const lastModified = lastModifiedMatch ? lastModifiedMatch[1] : new Date().toISOString();

      files.push({ key, size, lastModified });
    }

    console.log(`Found ${files.length} files`);

    return new Response(
      JSON.stringify(files),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('R2 list error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to list R2 files',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
