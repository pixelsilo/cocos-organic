# Newsletter Worker

Takes the e-book sign-up form on the website and adds the subscriber to a Campaign Monitor list. It replaces the old WordPress "Forms for Campaign Monitor" popup.

The repo is public, so nothing secret lives here: the API key is a Cloudflare secret, and the list id (not secret) goes in `wrangler.toml`.

## Deploy

```bash
cd worker-newsletter
npx wrangler login
# paste the list id into wrangler.toml (CM_LIST_ID)
npx wrangler secret put CM_API_KEY      # Campaign Monitor API key
npx wrangler deploy
```

## Endpoint

`POST /subscribe` with JSON `{ "name": "", "email": "", "consent": true, "company": "" }`

- 200 `{ ok: true }` subscribed (or a bot caught by the honeypot)
- 400 `{ ok: false, error: "invalid-email" | "consent-required" | "bad-request" }`
- 502 `{ ok: false, error: "upstream" }` Campaign Monitor refused it (see `npx wrangler tail`)

Only the staging site and cocos-organic.com can call it (the `ORIGINS` list in `src/index.js`).

The e-book itself is sent by Campaign Monitor (an autoresponder on the list), as before.
