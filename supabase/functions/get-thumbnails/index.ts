// Edge Function: get-thumbnails
// Adds simple in-memory LRU cache with TTL and returns total_count when paginating
// Modes:
// - GET /get-thumbnails?record_id=id1,id2
// - GET /get-thumbnails?limit=10&offset=0
// - POST with JSON { record_ids: [...], limit, offset }
const CACHE_TTL_MS = 10_000; // 10 seconds
const MAX_CACHE_ENTRIES = 500; // simple limit
const cache = new Map();
function makeCacheKey(method, payload) {
  return method + '|' + JSON.stringify(payload);
}
async function callRpc(supabaseUrl, serviceKey, payload) {
  const rpcUrl = supabaseUrl.replace(/\/+$/, '') + '/rest/v1/rpc/get_thumbnails_for_list';
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RPC error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data;
}
// Helper to also query total count when pagination params are present
async function callCount(supabaseUrl, serviceKey, payload) {
  // We'll call PostgREST to count rows from the underlying table with same filter (p_record_ids)
  // If p_record_ids provided, count matching record_ids, else count all rows
  const base = supabaseUrl.replace(/\/+$/, '') + '/rest/v1/autos_normalizados_cache?select=count';
  let url = base;
  if (payload.p_record_ids && Array.isArray(payload.p_record_ids) && payload.p_record_ids.length > 0) {
    // PostgREST IN filter
    const inList = payload.p_record_ids.map(encodeURIComponent).join(',');
    url = supabaseUrl.replace(/\/+$/, '') + `/rest/v1/autos_normalizados_cache?select=count&record_id=in.(${inList})`;
  }
  const res = await fetch(url, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  if (!res.ok) throw new Error(`Count error ${res.status}`);
  const arr = await res.json();
  // PostgREST returns [{ count: '123' }] or [{count:123}] depending
  const c = arr && arr[0] && (arr[0].count ?? arr[0].count);
  return Number(c);
}
Deno.serve(async (req)=>{
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({
        error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const url = new URL(req.url);
    const params = url.searchParams;
    let payload = {
      p_record_ids: null,
      p_limit: null,
      p_offset: null
    };
    if (req.method === 'GET') {
      const rid = params.get('record_id') || params.get('record_ids');
      if (rid) payload.p_record_ids = rid.split(',').map((s)=>s.trim()).filter(Boolean);
      if (params.get('limit')) payload.p_limit = parseInt(params.get('limit') || '0');
      if (params.get('offset')) payload.p_offset = parseInt(params.get('offset') || '0');
    } else if (req.method === 'POST') {
      const body = await req.json().catch(()=>({}));
      if (Array.isArray(body.record_ids)) payload.p_record_ids = body.record_ids.map(String);
      if (body.limit) payload.p_limit = parseInt(body.limit);
      if (body.offset) payload.p_offset = parseInt(body.offset);
    }
    const cacheKey = makeCacheKey(req.method, payload);
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Call RPC
    const data = await callRpc(supabaseUrl, serviceKey, {
      p_record_ids: payload.p_record_ids,
      p_limit: payload.p_limit,
      p_offset: payload.p_offset
    });
    let total_count = null;
    if (payload.p_limit != null) {
      try {
        total_count = await callCount(supabaseUrl, serviceKey, {
          p_record_ids: payload.p_record_ids
        });
      } catch (e) {
        // ignore count errors, continue
        total_count = null;
      }
    }
    const out = {
      data,
      total_count
    };
    // maintain simple cache size
    if (cache.size >= MAX_CACHE_ENTRIES) {
      // delete oldest
      let oldestKey = null;
      let oldestTs = Infinity;
      for (const [k, v] of cache.entries()){
        if (v.ts < oldestTs) {
          oldestTs = v.ts;
          oldestKey = k;
        }
      }
      if (oldestKey) cache.delete(oldestKey);
    }
    cache.set(cacheKey, {
      ts: now,
      data: out
    });
    return new Response(JSON.stringify(out), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: String(err)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
