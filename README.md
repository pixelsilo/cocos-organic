# Cocos Organic: Webflow custom code

Custom JavaScript for the Cocos Organic Webflow site. Built with Vite into `dist/site.js`, committed, served by jsDelivr from a git tag, and loaded by one small snippet in the Webflow **footer** (`snippets/loader.html`).

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
- **CSS does not live in this repo.** It lives in the `code_css` HTML embed inside the Webflow `code-snippets` component (hidden block on every page), so it previews in the Designer. Edit it there.
- Opt-in modules live in `src/modules/`, are registered in `MODULES`, and mount on `[data-module="<name>"]`. A module is `export default function (root) {}` and only queries inside `root`.
- `data-ready` on a root means it has been initialised.

## Modules

- **`alert`** (`src/modules/alert.js`): dismissible alert bar in the `navigation` component. Root is `.alert[data-module="alert"]`, the close button has `data-alert-close`. Dismissal is stored in `localStorage` for 180 days. By default a changed message re-shows the bar; set `data-alert-version="2"` on the root to control that explicitly (then wording tweaks don't re-show it, and bumping the version does). The bar is hidden by CSS and revealed with `.is-visible`; the module sets it explicitly both ways.

## Motion

**Scroll reveals are native Webflow interactions** (Interactions panel, site-wide, targeted by attribute so they work on any element on any page, no JS in this repo):

| Attribute | Interaction | Effect |
|---|---|---|
| `slide="item"` | `slide=item` | the element rises 4rem and fades in (used on every Home section after the hero) |
| `slide="children"` | `slide=children` | its direct children rise and fade in, staggered 0.2s (CMS Collection Lists, card grids) |
| `split="words"` | `split=words` | heading text splits into words that rise and fade in, staggered |
| `split="chars"` | `split=chars` | the same per letter (short headings only) |

All four start at `top 85%` of the viewport and end at `bottom top`, with the start clamp off. That range matters: the template's original `start = end = top 85%` with clamp on meant anything already past that line at load (the hero title, the first section) never played, because ScrollTrigger only fires when a trigger is crossed or already inside its range. They fire once, and are set to not animate under `prefers-reduced-motion`. Webflow also ships its own CSS that keeps these elements hidden until the interactions runtime starts (so no flash), only for visitors without reduced motion. A new section: add `slide="item"` to the section and `split="words"` to its heading, nothing else. Edit timing/easing in the Interactions panel (one place for the whole site). Debug markers are off (the starter template shipped them on).

**GSAP in JS** (the GSAP and ScrollTrigger Webflow already loads, nothing bundled) is only used where interactions can't express the behaviour:

- **`accordion`** (`src/modules/accordion.js`): smooth open/close for native `<details>` (the FAQ). Root is `[data-module="accordion"]` (on the FAQ Collection List); each row is `details > summary + answer`. Needs GSAP and no reduced motion, otherwise the native behaviour is untouched. It tweens height, padding and margin together (answers can have padding and a negative margin) to a measured border-box height, with the same duration and ease both ways so swapping rows doesn't wobble. The native `name` group is moved to `data-accordion-group` so opening one row closes the others with an animation, and a closing row gets `[data-closing]` so the icon CSS flips straight away.
- **Range tabs** (`src/modules/range.js`): switching tab fades the current cards out, then the new ones rise in, staggered. The list height glides from the old set to the new one so the content below never jumps (not locked to the tallest set, since stacked on mobile the sets differ by hundreds of px). Shared helpers are in `src/lib/motion.js`.

## Release

```bash
npm run build
git add -A && git commit -m "<what changed>"
git push
git tag -a v1.1.0 -m "<what changed>"
git push origin v1.1.0
```

1. Check `https://cdn.jsdelivr.net/gh/pixelsilo/cocos-organic@v1.1.0/dist/site.js` returns 200 with the new build.
2. Bump `VERSION` in the Webflow loader (Site settings > Custom code > Footer) and publish.
3. Check the published page: no console errors and `[data-module]` roots have `data-ready`.

Rollback: set `VERSION` back to the previous tag and republish. Never move or re-push an existing tag, since jsDelivr caches tagged files permanently.

## Snippets

- `snippets/loader.html`: the loader pasted into Webflow Footer (current source of truth). The Head is left empty.
- `snippets/head-tracking.html`: the starter template's Usercentrics, GA, Clarity and Meta Pixel head code (placeholder IDs), removed from Webflow. Re-add with real IDs when tracking is set up.
- `snippets/footer-copyright.original.html`: the template's original footer script, now `src/global/copyright-year.js`.
- `snippets/code-snippets.original.html`: verbatim `code_js` embed from the template's `code-snippets` component, now `src/global/nav-scrolled.js`.
