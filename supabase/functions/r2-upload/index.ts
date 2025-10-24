// Supabase Edge Function: r2-upload
// Securely uploads files to Cloudflare R2 from Airtable scripts
// Uses direct HTTP PUT to avoid AWS SDK filesystem dependencies

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

function sha256Hash(data: Uint8Array): string {
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
    // Parse request body
    const { path, fileUrl, contentType } = await req.json();

    if (!path || !fileUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: path, fileUrl' }),
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

    // Download file from source URL
    console.log(`Downloading file from: ${fileUrl}`);
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileData = new Uint8Array(fileBuffer);
    const fileSize = fileData.byteLength;
    console.log(`Downloaded ${fileSize} bytes`);

    // Prepare AWS Signature V4
    const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${R2_BUCKET_NAME}/${path}`;
    const region = 'auto';
    const service = 's3';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const payloadHash = sha256Hash(fileData);

    // Create canonical request
    const canonicalUri = `/${R2_BUCKET_NAME}/${path}`;
    const canonicalQuerystring = '';
    const canonicalHeaders = `content-type:${contentType || 'application/octet-stream'}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const hash = createHash('sha256');
    hash.update(canonicalRequest);
    const canonicalRequestHash = hash.digest('hex');
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

    // Calculate signature
    const signingKey = getSignatureKey(R2_SECRET_ACCESS_KEY, dateStamp, region, service);
    const signature = Array.from(hmacSha256(signingKey, stringToSign)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Create authorization header
    const authorizationHeader = `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Upload to R2
    console.log(`Uploading to R2: ${path}`);
    const uploadResponse = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Host': host,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authorizationHeader,
        'Cache-Control': 'public, max-age=31536000',
      },
      body: fileData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`R2 upload failed (${uploadResponse.status}): ${errorText}`);
    }

    // Generate public URL
    const publicUrl = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${path}`;

    console.log(`✅ Successfully uploaded to R2: ${publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        publicUrl,
        path,
        size: fileSize,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('R2 upload error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to upload to R2',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
