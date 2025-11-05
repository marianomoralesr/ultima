const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
}
const json = (data, status = 200, cacheSeconds = 900)=>new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Connection": "keep-alive",
      "Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
      "CDN-Cache-Control": `public, max-age=${cacheSeconds}`,
      "Vary": "Accept-Encoding, Origin"
    }
  });
const CACHE_PATH = '/tmp/facebook_catalogue.csv';
const META_PATH = '/tmp/facebook_catalogue.meta.json';
const STALE_MS = 1000 * 60 * 60; // 1 hour
async function fetchRowsFromSupabase() {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/facebook_catalogue`;
  // Request all rows; you may want to add ?select=col1,col2 to limit
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: 'application/json'
    }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase REST error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  let s = '';
  if (typeof value === 'object') {
    try {
      s = JSON.stringify(value);
    } catch  {
      s = String(value);
    }
  } else {
    s = String(value);
  }
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    s = '"' + s.replaceAll('"', '""') + '"';
  }
  return s;
}
function rowsToCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const header = Object.keys(rows[0]);
  const lines = [];
  lines.push(header.map(escapeCsv).join(','));
  for (const r of rows){
    const row = header.map((h)=>escapeCsv(r[h]));
    lines.push(row.join(','));
  }
  return lines.join('\n');
}
async function writeCache(csv, meta) {
  try {
    await Deno.writeTextFile(CACHE_PATH, csv);
    await Deno.writeTextFile(META_PATH, JSON.stringify(meta));
  } catch (e) {
    console.error('Failed to write cache', e);
  }
}
async function readCache() {
  try {
    const [csv, metaRaw] = await Promise.all([
      Deno.readTextFile(CACHE_PATH),
      Deno.readTextFile(META_PATH)
    ]);
    const meta = JSON.parse(metaRaw);
    return {
      csv,
      meta
    };
  } catch (e) {
    return null;
  }
}
async function fetchAndCacheCsv() {
  const rows = await fetchRowsFromSupabase();
  const csv = rowsToCsv(rows);
  const meta = {
    updated_at: Date.now(),
    rowcount: rows.length
  };
  await writeCache(csv, meta);
  return {
    csv,
    meta
  };
}
async function isStale() {
  const cached = await readCache();
  if (!cached) return true;
  return Date.now() - (cached.meta?.updated_at || 0) > STALE_MS;
}
console.info('Starting facebook-catalogue-csv edge function');
Deno.serve(async (req)=>{
  const url = new URL(req.url);
  if (req.method === 'GET' && url.pathname === '/facebook_catalogue.csv') {
    const cached = await readCache();
    if (cached) {
      // refresh in background if stale
      if (Date.now() - (cached.meta?.updated_at || 0) > STALE_MS) {
        try {
          globalThis.EdgeRuntime?.waitUntil?.(fetchAndCacheCsv());
        } catch  {
          // fallback: spawn a non-blocking promise
          fetchAndCacheCsv().catch((e)=>console.error('background refresh failed', e));
        }
      }
      return new Response(cached.csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="facebook_catalogue.csv"',
          'Cache-Control': 'public, max-age=60'
        }
      });
    }
    // no cache -> generate synchronously
    try {
      const { csv } = await fetchAndCacheCsv();
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="facebook_catalogue.csv"',
          'Cache-Control': 'public, max-age=60'
        }
      });
    } catch (e) {
      console.error('Failed to generate CSV', e);
      return new Response('Internal Server Error', {
        status: 500
      });
    }
  }
  if (req.method === 'POST' && url.pathname === '/refresh') {
    try {
      const { meta } = await fetchAndCacheCsv();
      return new Response(JSON.stringify({
        ok: true,
        meta
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (e) {
      console.error('Manual refresh failed', e);
      return new Response(JSON.stringify({
        ok: false,
        error: String(e)
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
  return new Response('Not Found', {
    status: 404
  });
});
