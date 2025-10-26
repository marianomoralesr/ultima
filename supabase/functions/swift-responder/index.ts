import { createClient } from "npm:@supabase/supabase-js@2.33.0";
import { Client as PGClient } from "npm:pg@8.10.0";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
const AIRTABLE_BASE_ID = "appbOPKYqQRW2HgyB";
const AIRTABLE_TABLE_ID = "tblOjECDJDZlNv8At";
const AIRTABLE_VIEW_ID = "viwambx3gqVJsujuP";
const STORAGE_BUCKET = "fotos_airtable";
const MAX_CONCURRENT_UPLOADS = 4;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const WEBP_QUALITY = 85;
const MAX_IMAGE_WIDTH = 1920;
// Sleep utility for retries
const sleep = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
// Retry wrapper with exponential backoff
async function withRetry(fn, maxRetries = MAX_RETRIES, context = '') {
  let lastError;
  for(let attempt = 0; attempt <= maxRetries; attempt++){
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}
// Convert image to WebP with optimization
async function convertToWebP(arrayBuffer) {
  try {
    const image = await Image.decode(new Uint8Array(arrayBuffer));
    // Resize if too large
    if (image.width > MAX_IMAGE_WIDTH) {
      const ratio = MAX_IMAGE_WIDTH / image.width;
      const newHeight = Math.round(image.height * ratio);
      image.resize(MAX_IMAGE_WIDTH, newHeight);
    }
    // Encode to WebP
    const webpBuffer = await image.encodeWebP(WEBP_QUALITY);
    return webpBuffer;
  } catch (err) {
    console.error('Image conversion error:', err);
    throw new Error(`Failed to convert image to WebP: ${err.message}`);
  }
}
Deno.serve(async (req)=>{
  const processingResult = {
    processed: 0,
    errors: [],
    skipped: 0
  };
  let pg = null;
  try {
    // Environment validation
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const AIRTABLE_API_KEY = Deno.env.get("AIRTABLE_API_KEY") ?? "";
    const SYNC_DB_URL = Deno.env.get("SYNC_DB_URL");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({
        error: "Missing Supabase environment variables"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (!AIRTABLE_API_KEY) {
      return new Response(JSON.stringify({
        error: "Missing AIRTABLE_API_KEY"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (!SYNC_DB_URL) {
      return new Response(JSON.stringify({
        error: "Missing SYNC_DB_URL"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false
      }
    });
    // Fetch all Airtable records with pagination
    const fetchAllAirtableRecords = async ()=>{
      const allRecords = [];
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?view=${AIRTABLE_VIEW_ID}&pageSize=100`;
      while(url){
        const data = await withRetry(async ()=>{
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              "Content-Type": "application/json"
            }
          });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Airtable request failed: ${res.status} - ${text}`);
          }
          return await res.json();
        }, MAX_RETRIES, `Fetching Airtable page`);
        if (Array.isArray(data.records)) allRecords.push(...data.records);
        url = data.offset ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?view=${AIRTABLE_VIEW_ID}&pageSize=100&offset=${data.offset}` : "";
      }
      return allRecords;
    };
    const records = await fetchAllAirtableRecords();
    console.log(`Fetched ${records.length} records from Airtable`);
    // Concurrency pool
    const pool = (()=>{
      const active = [];
      const enqueue = (p)=>{
        active.push(p);
        const cleanup = ()=>{
          const idx = active.indexOf(p);
          if (idx >= 0) active.splice(idx, 1);
        };
        p.then(cleanup).catch(cleanup);
      };
      const waitAll = ()=>Promise.all(active.slice());
      const canRun = ()=>active.length < MAX_CONCURRENT_UPLOADS;
      return {
        enqueue,
        waitAll,
        canRun,
        active
      };
    })();
    // Connect to Postgres
    pg = new PGClient({
      connectionString: SYNC_DB_URL
    });
    await pg.connect();
    // Process records
    for (const rec of records){
      const fields = rec.fields ?? {};
      // Filter: only "Comprado" status
      if ((fields?.OrdenStatus ?? "") !== "Comprado") {
        processingResult.skipped++;
        continue;
      }
      const ordencompra = fields?.ordencompra ?? fields?.OrdenCompra ?? null;
      if (!ordencompra) {
        console.warn(`Record ${rec.id} missing ordencompra; skipping`);
        processingResult.skipped++;
        continue;
      }
      const attachmentMapping = {
        Foto: "feature_image",
        fotos_exterior_archivos: "fotos_exterior",
        fotos_interior_archivos: "fotos_interior"
      };
      const uploadResults = {
        feature_image: [],
        fotos_exterior: [],
        fotos_interior: []
      };
      const uploadTasks = [];
      for (const [airtableField, targetCol] of Object.entries(attachmentMapping)){
        const attachments = fields[airtableField] ?? [];
        if (!Array.isArray(attachments) || attachments.length === 0) continue;
        for (const att of attachments){
          // Throttle concurrency
          while(!pool.canRun()){
            await Promise.race(pool.active);
          }
          const task = (async ()=>{
            const originalFilename = att.filename || "file";
            try {
              // Step 1: Fetch image from Airtable
              const arrayBuffer = await withRetry(async ()=>{
                const fileRes = await fetch(att.url);
                if (!fileRes.ok) {
                  throw new Error(`HTTP ${fileRes.status}`);
                }
                return await fileRes.arrayBuffer();
              }, MAX_RETRIES, `Fetching ${originalFilename}`);
              // Step 2: Convert to WebP
              let webpData;
              try {
                webpData = await convertToWebP(arrayBuffer);
              } catch (convErr) {
                processingResult.errors.push({
                  ordencompra,
                  filename: originalFilename,
                  error: convErr.message,
                  stage: 'convert'
                });
                return;
              }
              // Step 3: Upload to Supabase Storage
              const safeFilename = originalFilename.replace(/\.[^/.]+$/, "") // Remove original extension
              .replace(/[^a-zA-Z0-9._-]/g, "_");
              const uploadPath = `${ordencompra}/${safeFilename}.webp`;
              await withRetry(async ()=>{
                const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(uploadPath, webpData, {
                  upsert: true,
                  contentType: "image/webp"
                });
                if (uploadError) throw uploadError;
              }, MAX_RETRIES, `Uploading ${uploadPath}`);
              // Get public URL
              const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadPath);
              if (!urlData?.publicUrl) {
                processingResult.errors.push({
                  ordencompra,
                  filename: originalFilename,
                  error: "No public URL generated",
                  stage: 'upload'
                });
                return;
              }
              uploadResults[targetCol].push(urlData.publicUrl);
            } catch (err) {
              processingResult.errors.push({
                ordencompra,
                filename: originalFilename,
                error: err.message ?? String(err),
                stage: 'upload'
              });
            }
          })();
          pool.enqueue(task);
          uploadTasks.push(task);
        }
      }
      // Wait for all uploads for this record
      await Promise.all(uploadTasks);
      await pool.waitAll();
      // Step 4: Update database
      if (uploadResults.feature_image.length || uploadResults.fotos_exterior.length || uploadResults.fotos_interior.length) {
        const p_feature_image = uploadResults.feature_image.length ? uploadResults.feature_image[0] : null;
        const p_fotos_exterior = uploadResults.fotos_exterior.length ? JSON.stringify(uploadResults.fotos_exterior) : null;
        const p_fotos_interior = uploadResults.fotos_interior.length ? JSON.stringify(uploadResults.fotos_interior) : null;
        const p_record_id = rec.id ?? null;
        try {
          await withRetry(async ()=>{
            await pg.queryArray(`SELECT public.svc_sync_upsert_images($1, $2, $3::jsonb, $4::jsonb, $5)`, [
              ordencompra,
              p_feature_image,
              p_fotos_exterior,
              p_fotos_interior,
              p_record_id
            ]);
          }, 2, `DB update for ${ordencompra}`);
          processingResult.processed++;
        } catch (dbErr) {
          processingResult.errors.push({
            ordencompra,
            filename: 'database',
            error: dbErr.message ?? String(dbErr),
            stage: 'db'
          });
        }
      }
    }
    // Close Postgres connection
    if (pg) await pg.end();
    // Return detailed results
    return new Response(JSON.stringify({
      status: "ok",
      ...processingResult,
      total_records: records.length
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Function error:", err);
    // Cleanup
    if (pg) {
      try {
        await pg.end();
      } catch  {}
    }
    return new Response(JSON.stringify({
      status: "error",
      message: err?.message ?? String(err),
      ...processingResult
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
