// R2 Upload Helper for Airtable Sync
// Extracted R2 upload logic to use within airtable-sync function

import { createHash, createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

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

export interface R2UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

export async function uploadToR2(
  fileUrl: string,
  destinationPath: string,
  contentType: string = 'image/jpeg'
): Promise<R2UploadResult> {
  try {
    // Get R2 configuration from environment
    const R2_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const R2_ACCESS_KEY_ID = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    const R2_BUCKET_NAME = 'trefa-images';
    const R2_PUBLIC_DOMAIN = Deno.env.get('CLOUDFLARE_R2_PUBLIC_DOMAIN') || 'r2.trefa.mx';

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.error('❌ R2 credentials not configured');
      return { success: false, error: 'R2 credentials not configured' };
    }

    // Download file from source URL
    console.log(`📥 Downloading from: ${fileUrl.substring(0, 80)}...`);
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileData = new Uint8Array(fileBuffer);
    console.log(`✓ Downloaded ${fileData.byteLength} bytes`);

    // Prepare AWS Signature V4
    const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${R2_BUCKET_NAME}/${destinationPath}`;
    const region = 'auto';
    const service = 's3';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const payloadHash = sha256Hash(fileData);

    // Create canonical request
    const canonicalUri = `/${R2_BUCKET_NAME}/${destinationPath}`;
    const canonicalQuerystring = '';
    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
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
    const signature = Array.from(hmacSha256(signingKey, stringToSign))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create authorization header
    const authorizationHeader = `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Upload to R2
    console.log(`📤 Uploading to R2: ${destinationPath}`);
    const uploadResponse = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
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

    // Generate public URL using custom domain
    const publicUrl = `https://${R2_PUBLIC_DOMAIN}/${destinationPath}`;
    console.log(`✅ Uploaded to R2: ${publicUrl}`);

    return {
      success: true,
      publicUrl,
    };
  } catch (error: any) {
    console.error('❌ R2 upload error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to upload to R2',
    };
  }
}

// Helper to upload multiple images concurrently with rate limiting
export async function uploadImagesToR2(
  imageUrls: string[],
  ordenCompra: string,
  category: 'feature' | 'exterior' | 'interior'
): Promise<string[]> {
  const results: string[] = [];
  const MAX_CONCURRENT = 3; // Limit concurrent uploads

  // Process in batches
  for (let i = 0; i < imageUrls.length; i += MAX_CONCURRENT) {
    const batch = imageUrls.slice(i, i + MAX_CONCURRENT);
    const uploads = batch.map(async (url, index) => {
      // Extract filename from URL or generate one
      let filename = 'image.jpg';
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        filename = pathParts[pathParts.length - 1] || `${category}-${i + index}.jpg`;
      } catch {
        filename = `${category}-${i + index}.jpg`;
      }

      // Clean filename
      const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const destinationPath = `vehicles/${ordenCompra}/${category}/${cleanFilename}`;

      const result = await uploadToR2(url, destinationPath);
      return result.success ? result.publicUrl : null;
    });

    const batchResults = await Promise.all(uploads);
    results.push(...batchResults.filter((url): url is string => url !== null));
  }

  return results;
}
