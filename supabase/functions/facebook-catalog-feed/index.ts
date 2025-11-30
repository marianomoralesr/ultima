import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHash, createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

/**
 * Facebook Catalog Feed - Direct from Airtable
 *
 * Generates CSV feed for Facebook Catalog directly from Airtable's "Facebook Catalogo" view
 * without affecting the existing tracking system that uses inventario_cache.
 *
 * View: https://airtable.com/appbOPKYqQRW2HgyB/tblOjECDJDZlNv8At/viwfybc9ldi49Ul4p
 *
 * Field Mapping:
 * - id: ordencompra (unique ID)
 * - title: Auto field
 * - description: description field (fallback to Auto)
 * - image_link: Foto Facebook (first image from attachment)
 * - additional_image_link: fotos_exterior_url + fotos_interior_url (up to 20 images)
 * - link: liga_catalogo_fb (fallback to Publicacion Web)
 * - price: Precio
 * - availability: Based on stock status
 * - condition: "used"
 * - brand: Automarca
 */

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_BASE_ID = 'appbOPKYqQRW2HgyB';
const AIRTABLE_TABLE_ID = 'tblOjECDJDZlNv8At'; // Inventario table
const AIRTABLE_VIEW_ID = 'viwfybc9ldi49Ul4p'; // Facebook Catalogo view

// Get API key from environment
const AIRTABLE_API_KEY = Deno.env.get("AIRTABLE_API_KEY") || Deno.env.get("VITE_AIRTABLE_API_KEY");

// Cache configuration
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
let cachedCsv: string | null = null;
let cacheTimestamp = 0;

// Base URL for your website
const BASE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://trefa.mx";

// Cloudflare R2 Configuration
const R2_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
const R2_ACCESS_KEY_ID = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID');
const R2_SECRET_ACCESS_KEY = Deno.env.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
const R2_BUCKET_NAME = 'trefa-images';
const IMAGE_CDN_URL = "https://images.trefa.mx";

interface AirtableRecord {
  id: string;
  fields: {
    ordencompra?: string;
    OrdenCompra?: string; // Alternative field name
    Auto?: string;
    description?: string; // Description field
    "Foto Facebook"?: Array<{ url: string }>;
    fotos_exterior_url?: any;
    fotos_interior_url?: any;
    liga_catalogo_fb?: string; // Link for Facebook catalog
    "Publicacion  Web"?: string; // Fallback for link
    Precio?: number;
    stock?: string;
    Automarca?: string;
    AutoMarca?: string; // Alternative field name
    OrdenStatus?: string;
    vendido?: boolean;
    separado?: boolean;
    ClasificacionID?: any; // For custom_label_1 (SUV, Sedan, etc.)
    carroceria?: any; // Alternative field for vehicle type
  };
  createdTime: string;
}

interface FacebookProduct {
  id: string;
  title: string;
  description: string;
  availability: string;
  condition: string;
  price: string;
  link: string;
  image_link: string;
  brand: string;
  additional_image_link?: string;
  quantity_to_sell_on_facebook?: string;
  currency?: string;
  status?: string;
  custom_label_1?: string;
}

/**
 * AWS Signature V4 helpers for R2
 */
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

/**
 * Upload image to Cloudflare R2
 */
async function uploadToR2(imageUrl: string, fileName: string): Promise<string | null> {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn('R2 credentials not configured, skipping upload');
    return null;
  }

  try {
    // Download image from Airtable
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`Failed to download image from ${imageUrl}`);
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageData = new Uint8Array(imageBuffer);

    // Determine content type
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Prepare R2 upload path
    const path = `fotos_airtable/facebook_catalog/${fileName}`;
    const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${R2_BUCKET_NAME}/${path}`;
    const region = 'auto';
    const service = 's3';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const payloadHash = sha256Hash(imageData);

    // Create canonical request
    const canonicalUri = `/${R2_BUCKET_NAME}/${path}`;
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
    const uploadResponse = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authorizationHeader,
      },
      body: imageData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`R2 upload failed: ${uploadResponse.status} ${errorText}`);
      return null;
    }

    // Return CDN URL
    const cdnUrl = `${IMAGE_CDN_URL}/${path}`;
    console.log(`Uploaded to R2: ${cdnUrl}`);
    return cdnUrl;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return null;
  }
}

/**
 * Fetch all records from the Facebook Catalogo view in Airtable
 */
async function fetchAirtableRecords(): Promise<AirtableRecord[]> {
  if (!AIRTABLE_API_KEY) {
    throw new Error("AIRTABLE_API_KEY not configured in environment");
  }

  console.log("Fetching records from Airtable Facebook Catalogo view...");

  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined = undefined;
  let pageCount = 0;
  const maxPages = 20; // Safety limit

  try {
    do {
      pageCount++;
      console.log(`Fetching page ${pageCount}...`);

      const url = new URL(`${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);

      // Use the specific view ID (viwfybc9ldi49Ul4p)
      url.searchParams.append('view', AIRTABLE_VIEW_ID);
      url.searchParams.append('pageSize', '100'); // Max per page

      if (offset) {
        url.searchParams.append('offset', offset);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Airtable API error:`, errorText);
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.records && Array.isArray(data.records)) {
        allRecords.push(...data.records);
        console.log(`Page ${pageCount}: ${data.records.length} records (total: ${allRecords.length})`);
      }

      offset = data.offset;

    } while (offset && pageCount < maxPages);

    console.log(`Fetch complete: ${allRecords.length} total records`);
    return allRecords;

  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    throw error;
  }
}

/**
 * Extract image URLs from Airtable attachment field
 */
function getImageUrls(attachments: any): string[] {
  if (!attachments || !Array.isArray(attachments)) return [];
  return attachments.map((att: any) => att.url).filter(Boolean);
}

/**
 * Extract additional images from fotos_exterior_url and fotos_interior_url
 * Handles multiple formats: Airtable attachments, string arrays, or object arrays
 */
function extractAdditionalImages(
  fotosExterior: any,
  fotosInterior: any,
  recordId?: string
): string {
  const images: string[] = [];

  // Helper function to extract URLs from various formats
  const extractUrls = (fotos: any, fieldName: string): void => {
    if (!fotos) return;

    if (Array.isArray(fotos)) {
      fotos.slice(0, 10).forEach((foto: any) => {
        let url: string | undefined;

        if (typeof foto === "string") {
          // Direct string URL
          url = foto;
        } else if (foto && typeof foto === "object") {
          // Airtable attachment format: { url: "...", thumbnails: {...} }
          // Or simple object format: { url: "..." }
          url = foto.url || foto.thumbnails?.large?.url || foto.thumbnails?.full?.url;
        }

        if (url && typeof url === "string" && url.trim()) {
          images.push(url.trim());
        }
      });
    } else if (typeof fotos === "string") {
      // Single string (unlikely but handle it)
      if (fotos.trim()) images.push(fotos.trim());
    }
  };

  // Extract from both fields
  extractUrls(fotosExterior, "fotos_exterior_url");
  extractUrls(fotosInterior, "fotos_interior_url");

  // Debug logging for first record only
  if (recordId && images.length > 0) {
    console.log(`[${recordId}] Extracted ${images.length} additional images`);
  }

  // Facebook allows up to 20 additional images
  return images.slice(0, 20).join(",");
}

/**
 * Determine availability based on status fields
 */
function determineAvailability(
  ordenstatus: string | undefined,
  vendido: boolean | undefined,
  separado: boolean | undefined,
  stock: string | undefined
): string {
  if (vendido) return "out of stock";
  if (separado) return "preorder";
  if (ordenstatus === "Comprado") return "in stock";
  if (stock && stock.toLowerCase() === "disponible") return "in stock";
  return "out of stock";
}

/**
 * Format price for Facebook
 */
function formatPrice(precio: number | undefined, currency = "MXN"): string {
  if (!precio) return `0.00 ${currency}`;
  return `${precio.toFixed(2)} ${currency}`;
}

/**
 * Normalize vehicle type (carroceria/clasificacionid) for custom_label_1
 */
function normalizeVehicleType(clasificacionid: any, carroceria: any): string {
  // Extract first value if it's an array
  const getFirst = (field: any): string => {
    if (Array.isArray(field)) return field[0] || '';
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) return parsed[0] || '';
      } catch {
        return field;
      }
    }
    return field || '';
  };

  const type = (getFirst(clasificacionid) || getFirst(carroceria) || '').toLowerCase().trim();

  // Map variations to standard categories
  if (type.includes("suv") || type.includes("crossover")) return "SUV";
  if (type.includes("pick") || type.includes("pickup")) return "Pick Up";
  if (type.includes("sedán") || type.includes("sedan")) return "Sedán";
  if (type.includes("hatchback") || type.includes("hatch")) return "Hatchback";
  if (type.includes("coupé") || type.includes("coupe")) return "Coupé";
  if (type.includes("camioneta")) return "Camioneta";
  if (type.includes("convertible")) return "Convertible";
  if (type.includes("van") || type.includes("minivan")) return "Van";
  if (type.includes("deportivo") || type.includes("sport")) return "Deportivo";

  // Return capitalized if no match
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : "Otros";
}

/**
 * Transform Airtable record to Facebook Product format
 */
async function transformToFacebookProduct(record: AirtableRecord): Promise<FacebookProduct | null> {
  const fields = record.fields;

  // Get ordencompra with fallback
  const ordencompra = fields.ordencompra || fields.OrdenCompra || record.id;

  // Validate required fields
  if (!ordencompra) {
    console.warn(`Skipping record ${record.id}: missing ordencompra`);
    return null;
  }

  if (!fields.Auto) {
    console.warn(`Skipping record ${record.id}: missing Auto field`);
    return null;
  }

  // Extract images
  const fotoFacebook = getImageUrls(fields["Foto Facebook"]);
  const airtableImageUrl = fotoFacebook[0] || "";

  if (!airtableImageUrl) {
    console.warn(`Skipping record ${record.id} (${ordencompra}): missing Foto Facebook`);
    return null;
  }

  // Upload image to R2 and get CDN URL
  const fileName = `${ordencompra}.jpg`;
  const imageLink = await uploadToR2(airtableImageUrl, fileName) || airtableImageUrl;

  // Build additional images from fotos_exterior_url and fotos_interior_url
  const additionalImages = extractAdditionalImages(
    fields.fotos_exterior_url,
    fields.fotos_interior_url,
    ordencompra
  );

  // Build product link from liga_catalogo_fb with fallback
  const link = fields.liga_catalogo_fb ||
               (fields["Publicacion  Web"] ? `${BASE_URL}/autos/${fields["Publicacion  Web"]}` : `${BASE_URL}/inventario`);

  // Get brand with fallback
  const brand = fields.Automarca || fields.AutoMarca || "";

  // Get description from description field, fallback to Auto
  const description = fields.description || fields.Auto || "";

  const product: FacebookProduct = {
    id: ordencompra,
    title: fields.Auto.substring(0, 200).trim(),
    description: description.substring(0, 5000).trim(),
    availability: determineAvailability(
      fields.OrdenStatus,
      fields.vendido,
      fields.separado,
      fields.stock
    ),
    condition: "used", // All vehicles are used/pre-owned
    price: formatPrice(fields.Precio),
    link: link,
    image_link: imageLink,
    brand: brand.substring(0, 100),
    // Fixed constant fields
    quantity_to_sell_on_facebook: "1",
    currency: "MXN",
    status: "active",
    // Vehicle type for filtering/segmentation
    custom_label_1: normalizeVehicleType(fields.ClasificacionID, fields.carroceria),
  };

  // Add additional images if available
  if (additionalImages) {
    product.additional_image_link = additionalImages;
  }

  return product;
}

/**
 * Escape CSV cell content
 */
function escapeCsvCell(value: string | undefined): string {
  if (!value) return "";
  const escaped = value.replace(/"/g, '""');
  if (/[",\n\r]/.test(value)) {
    return `"${escaped}"`;
  }
  return escaped;
}

/**
 * Convert products array to CSV string
 */
function productsToCsv(products: FacebookProduct[]): string {
  if (products.length === 0) return "";

  // Define the exact field order for Facebook Catalogue
  const headers = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "link",
    "image_link",
    "brand",
    "additional_image_link",
    "quantity_to_sell_on_facebook",
    "currency",
    "status",
    "custom_label_1",
  ];

  const lines = [headers.join(",")];

  for (const product of products) {
    const row = headers.map((header) =>
      escapeCsvCell(product[header as keyof FacebookProduct])
    );
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

/**
 * Generate CSV from Airtable data
 */
async function generateCsv(): Promise<string> {
  console.log("Generating Facebook Catalog CSV from Airtable...");

  // Fetch records from Airtable
  const records = await fetchAirtableRecords();

  if (!records || records.length === 0) {
    console.warn("No records found in Airtable view");
    return "";
  }

  console.log(`Transforming ${records.length} records to Facebook format...`);

  // Transform to Facebook products (process in parallel with Promise.all)
  const productPromises = records.map((record) => transformToFacebookProduct(record));
  const productsWithNulls = await Promise.all(productPromises);
  const products = productsWithNulls.filter((product): product is FacebookProduct => product !== null);

  console.log(`Generated ${products.length} valid products`);

  // Convert to CSV
  const csv = productsToCsv(products);

  console.log(`CSV generated with ${products.length} products`);
  return csv;
}

/**
 * Main handler
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("force") === "true";

  try {
    // Check cache
    const now = Date.now();
    if (
      !forceRefresh &&
      cachedCsv &&
      now - cacheTimestamp < CACHE_TTL
    ) {
      console.log("Serving cached CSV");
      return new Response(cachedCsv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="facebook-catalogue.csv"',
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Generate fresh CSV
    console.log("Generating fresh CSV...");
    const csv = await generateCsv();

    // Update cache
    cachedCsv = csv;
    cacheTimestamp = Date.now();

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="facebook-catalogue.csv"',
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error generating CSV:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate Facebook catalogue CSV",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
