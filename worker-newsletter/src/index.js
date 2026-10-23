// Newsletter sign-up: takes the website form and adds the subscriber to a Campaign Monitor list.
//
//   POST /subscribe   JSON { name, email, consent, company }  ->  { ok: true } or { ok: false, error }
//
// `company` is a honeypot: real visitors never see or fill it, so anything in it is dropped
// silently (the response still says ok so bots learn nothing).
//
// Var:    CM_LIST_ID (wrangler.toml)
// Secret: CM_API_KEY (never in the repo)

const CM_API = 'https://api.createsend.com/api/v3.3';

// Sites allowed to call this Worker. Anything else gets no CORS headers and is refused
const ORIGINS = ['https://cocos-organic.webflow.io', 'https://cocos-organic.com', 'https://www.cocos-organic.com'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cors(origin) {
  return ORIGINS.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : { Vary: 'Origin' };
}

const reply = (origin, status, body) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json; charset=utf-8' } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (url.pathname !== '/subscribe' || request.method !== 'POST') return new Response('Not found', { status: 404 });
    if (!ORIGINS.includes(origin)) return new Response('Forbidden', { status: 403 });

    let data;
    try {
      data = await request.json();
    } catch {
      return reply(origin, 400, { ok: false, error: 'bad-request' });
    }

    if (data.company) return reply(origin, 200, { ok: true }); // honeypot

    const email = String(data.email || '').trim();
    const name = String(data.name || '').trim().slice(0, 100);
    if (!EMAIL.test(email) || email.length > 254) return reply(origin, 400, { ok: false, error: 'invalid-email' });
    if (data.consent !== true) return reply(origin, 400, { ok: false, error: 'consent-required' });

    const res = await fetch(`${CM_API}/subscribers/${env.CM_LIST_ID}.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${env.CM_API_KEY}:x`)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        EmailAddress: email,
        Name: name,
        ConsentToTrack: 'Yes', // they ticked the Privacy Policy box
        Resubscribe: true, // someone who unsubscribed and signs up again is added back
        RestartSubscriptionBasedAutoresponders: true, // and gets the e-book email again
      }),
    });

    if (res.status === 201) return reply(origin, 200, { ok: true });

    const detail = await res.json().catch(() => ({}));
    console.error('Campaign Monitor', res.status, detail.Code, detail.Message);
    // Code 1 is Campaign Monitor rejecting the address itself
    if (detail.Code === 1) return reply(origin, 400, { ok: false, error: 'invalid-email' });
    return reply(origin, 502, { ok: false, error: 'upstream' });
  },
};
