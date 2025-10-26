console.info('api-facebook-catalogue-csv (public) starting');
// This Edge Function is written to be publicly callable (no incoming JWT required).
// IMPORTANT: When deploying, set verify_jwt = false (CLI: --no-verify-jwt or Dashboard toggle).
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
// Simple in-memory cache to reduce DB load
let cachedCsv = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes by default
function escapeCsvCell(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    try {
      v = JSON.stringify(v);
    } catch  {
      v = String(v);
    }
  }
  const s = String(v);
  const escaped = s.replace(/"/g, '""');
  if (/[",\n\r]/.test(s)) return `"${escaped}"`;
  return escaped;
}
async function fetchRows(params) {
  const restUrl = new URL(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/facebook_catalogue`);
  // Respect common query params: select, limit, order
  if (params.get('select')) restUrl.searchParams.set('select', params.get('select'));
  if (params.get('limit')) restUrl.searchParams.set('limit', params.get('limit'));
  if (params.get('order')) restUrl.searchParams.set('order', params.get('order'));
  const res = await fetch(restUrl.toString(), {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Accept: 'application/json'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstream error: ${res.status} ${text}`);
  }
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error('Unexpected response from DB');
  return rows;
}
function rowsToCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [];
  lines.push(headers.join(','));
  for (const r of rows){
    const values = headers.map((h)=>{
      let v = r[h];
      if (Array.isArray(v) || v && typeof v === 'object') v = JSON.stringify(v);
      if (typeof v === 'boolean') v = v ? 'true' : 'false';
      return escapeCsvCell(v);
    });
    lines.push(values.join(','));
  }
  return lines.join('\r\n');
}
Deno.serve(async (req)=>{
  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/\/+$/, '');
    // Accept both /api-facebook-catalogue-csv and /api-facebook-catalogue-csv.csv
    if (!pathname.endsWith('/api-facebook-catalogue-csv') && !pathname.endsWith('/api-facebook-catalogue-csv.csv')) {
      return new Response('Not Found', {
        status: 404
      });
    }
    const params = url.searchParams;
    const force = params.get('force') === 'true';
    const now = Date.now();
    if (!force && cachedCsv && now - cacheTimestamp < CACHE_TTL) {
      const filename = `facebook_catalogue-${new Date(cacheTimestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
      return new Response(cachedCsv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': `public, max-age=${Math.floor(CACHE_TTL / 1000)}`
        }
      });
    }
    const rows = await fetchRows(params);
    const csv = rowsToCsv(rows);
    cachedCsv = csv;
    cacheTimestamp = Date.now();
    // Background refresh (non-blocking)
    const refreshPromise = (async ()=>{
      try {
        await new Promise((r)=>setTimeout(r, 100));
        const freshRows = await fetchRows(params);
        cachedCsv = rowsToCsv(freshRows);
        cacheTimestamp = Date.now();
      } catch (e) {
        console.error('Background refresh failed', e);
      }
    })();
    if (typeof globalThis.EdgeRuntime?.waitUntil === 'function') {
      globalThis.EdgeRuntime.waitUntil(refreshPromise);
    }
    const filename = `facebook_catalogue-${new Date(cacheTimestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': `public, max-age=${Math.floor(CACHE_TTL / 1000)}`
      }
    });
  } catch (err) {
    console.error(err);
    return new Response('Internal Server Error', {
      status: 500
    });
  }
});
