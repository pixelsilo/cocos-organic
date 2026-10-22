# Stockists Worker

Serves the Webflow **Locations** collection as one cached JSON file for the stockists map.

The repo is public, so nothing secret lives here: the Webflow token and refresh key are Cloudflare secrets.

## Deploy

```bash
cd worker
npx wrangler login
npx wrangler kv namespace create LOCATIONS   # paste the id into wrangler.toml
npx wrangler secret put WEBFLOW_TOKEN        # Webflow API token (CMS read access)
npx wrangler secret put REFRESH_KEY          # any long random string
npx wrangler deploy
```

## Keep it fresh

In Webflow: Site settings > Apps & integrations > Webhooks, add triggers for
*Collection item created / changed / deleted / unpublished* pointing at:

```
https://<worker-url>/refresh?key=<REFRESH_KEY>
```

A cron also rebuilds every 6 hours as a safety net.

## Endpoints

- `GET /locations.json` compact list (`n` name, `r` retailer, `t` type, `a` address, `c` town, `p` postcode, `y` lat, `x` long, `w` website, `h` phone, `o` online only, `f` flavours)
- `POST /refresh?key=...` rebuild now
