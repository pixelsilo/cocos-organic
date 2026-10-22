// Stockists API: serves the Webflow "Locations" CMS collection as one small JSON file.
//
//   GET  /locations.json        compact list of every live location (KV-backed, edge cached)
//   POST /refresh?key=<secret>  rebuild from Webflow now (point a Webflow CMS webhook here)
//   cron (see wrangler.toml)    rebuilds on a schedule as a safety net
//
// Secrets (never in the repo): WEBFLOW_TOKEN, REFRESH_KEY
// Binding: LOCATIONS (KV namespace)

const COLLECTION_ID = '6ad9ef15d60fb5a3859bbfd0';
const API = 'https://api.webflow.com/v2';
const PAGE = 100;
const KV_KEY = 'locations';
const EDGE_TTL = 300; // seconds the browser/edge may reuse a response

// Option ids from the collection's "type" field
const TYPES = {
  b5f088525027e082d15c6e03bf45f9db: 'Supermarket',
  fcdd06c66ab2fd352653055ca0cf0414: 'Independent shop',
  '328f43c323a568f092f8f06f35678331': 'Health food store',
  '0d5f4ca6d8c60324cf457aac4e5cec12': 'Cafe',
  '9470290b5e5c83a5df84e5c3de0761cd': 'Online',
};

const CORS = { 'Access-Control-Allow-Origin': '*' };

async function fetchAll(env) {
  const items = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const res = await fetch(`${API}/collections/${COLLECTION_ID}/items/live?limit=${PAGE}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${env.WEBFLOW_TOKEN}`, accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Webflow ${res.status}: ${await res.text()}`);
    const data = await res.json();
    items.push(...data.items);
    total = data.pagination?.total ?? items.length;
    if (!data.items.length) break;
    offset += PAGE;
  }
  return items;
}

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

function compact(item) {
  const f = item.fieldData;
  return {
    n: f.name,
    r: f.retailer || '',
    t: TYPES[f.type] || '',
    a: f.address || '',
    c: f.town || '',
    p: f.postcode || '',
    y: num(f['latitude-2']),
    x: num(f['longitude-2']),
    w: f.website || '',
    h: f.phone || '',
    o: !!f['online-only'],
    f: f['flavours-stocked'] || '',
  };
}

async function rebuild(env) {
  const items = await fetchAll(env);
  const body = JSON.stringify({ updated: new Date().toISOString(), locations: items.map(compact) });
  await env.LOCATIONS.put(KV_KEY, body);
  return body;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET' } });

    if (url.pathname === '/refresh' && request.method === 'POST') {
      if (!env.REFRESH_KEY || url.searchParams.get('key') !== env.REFRESH_KEY) return new Response('Forbidden', { status: 403 });
      const body = await rebuild(env);
      return new Response(`ok ${JSON.parse(body).locations.length}`);
    }

    if (url.pathname === '/locations.json' && request.method === 'GET') {
      let body = await env.LOCATIONS.get(KV_KEY);
      if (!body) body = await rebuild(env);
      return new Response(body, {
        headers: {
          ...CORS,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': `public, max-age=${EDGE_TTL}`,
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(_event, env) {
    await rebuild(env);
  },
};
