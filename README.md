# Cocos Organic: Webflow custom code

Custom JavaScript and CSS for the Cocos Organic Webflow site. Built with Vite into `dist/site.js` and `dist/site.css`, committed, served by jsDelivr from a git tag, and loaded by one small snippet in the Webflow **head** (`snippets/loader.html`).

## Develop

```bash
npm install
npm run dev     # terminal 1: rebuild on change
npm run serve   # terminal 2: serve dist/ at http://127.0.0.1:5500
```

Then open the Webflow site (published or `webflow.io`) with `?dev` on the URL. That browser loads `http://127.0.0.1:5500/site.js` until you visit with `?dev=off`. Everyone else keeps getting the tagged CDN build. Use Chrome: Safari blocks localhost scripts on https pages.

## Conventions

- Hook JS to attributes, never Webflow classes or IDs.
- Site-wide behaviour lives in `src/global/` and is listed in `GLOBALS` in `src/main.js`.
- Site-wide CSS lives in `src/styles/` and is imported by `src/main.js`. It ships as `dist/site.css` and loads from the head so the root `html` font-size is set before first paint.
- Opt-in modules live in `src/modules/`, are registered in `MODULES`, and mount on `[data-module="<name>"]`. A module is `export default function (root) {}` and only queries inside `root`.
- `data-ready` on a root means it has been initialised.

## Release

```bash
npm run build
git add -A && git commit -m "<what changed>"
git push
git tag -a v1.1.0 -m "<what changed>"
git push origin v1.1.0
```

1. Check `https://cdn.jsdelivr.net/gh/pixelsilo/cocos-organic@v1.1.0/dist/site.js` returns 200 with the new build.
2. Bump `VERSION` in the Webflow loader (Site settings > Custom code > Head) and publish.
3. Check the published page: no console errors and `[data-module]` roots have `data-ready`.

Rollback: set `VERSION` back to the previous tag and republish. Never move or re-push an existing tag, since jsDelivr caches tagged files permanently.

## Snippets

- `snippets/loader.html`: the loader pasted into Webflow Head (current source of truth). The Footer is left empty.
- `snippets/head-tracking.html`: the starter template's Usercentrics, GA, Clarity and Meta Pixel head code (placeholder IDs), removed from Webflow. Re-add with real IDs when tracking is set up.
- `snippets/footer-copyright.original.html`: the template's original footer script, now `src/global/copyright-year.js`.
- `snippets/code-snippets.original.html`: verbatim JS and CSS embeds from the template's `code-snippets` component, now `src/global/nav-scrolled.js` and `src/styles/base.css`.
