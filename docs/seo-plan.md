# Cocos Organic: SEO and schema plan

Draft for review, 23 Oct 2026. Nothing here is implemented yet. Production domain: `https://cocos-organic.com` (non-www, to confirm).

## 1. What is already in place

- Every static page has a title and description, but most are generic ("Page | Cocos Organic") and none has its own share image except Home.
- Home already has JSON-LD: Organization, WebSite, WebPage and a 4-question FAQPage. A good base, but it lives only on Home.
- The recipe template has a thin Recipe schema (name, description, image, serves, author). No ingredients, steps, times, dates or category.
- The flavour template and the news template have **no** title, description or schema.
- Webflow subdomain pages are already noindex while staging.

## 2. Problems to fix before launch (not schema)

1. **Legal pages are empty.** Privacy Policy and Cookie Policy exist at `/legal/...` but have no content, and there is no Terms & Conditions page. The newsletter checkbox says "I have read and accept the Privacy Policy", so this is a compliance risk as well as an SEO gap. Needs copy from the client.
2. **301 redirects from the old WordPress site** (map in section 6). The old site has about 60 indexed URLs. Without redirects they all 404 and the ranking history is lost.
3. **Collection templates that should not be indexed.** Reviews, Awards, Trust Points, Team, Instagram Posts, FAQs and Locations each publish a page per item (for example `/reviews/...`). They are thin and mostly orphaned. Exclude them from the sitemap and set them to noindex, or turn off their collection pages. Also exclude `/styleguide`.
4. **Share images.** Only Home has one. Each template needs a dynamic one (recipe photo, post image, flavour pack shot) and the static pages need a default 1200x630 image. The existing `og/og.png` shows "3 Simple Ingredients" and "Good for gut health" on the pots. Your copy notes say the "3 simple ingredients" wording is Natural-only and the gut icons may be health claims, so the wording needs a decision first.
5. **Logo for schema.** Home's schema uses an SVG logo. Google needs a raster logo (PNG or WebP, at least 112 px square, ideally 512 px).

## 3. Meta titles and descriptions

Titles are 60 characters or fewer; descriptions are 110 to 160 (lengths in brackets, counted by script). Pattern: page topic first, brand last. Flavour, recipe and news pages take theirs from the CMS.

| Page | URL | Title | Meta description | Schema |
|---|---|---|---|---|
| Home | `/` | Cocos Organic \| Organic Coconut Yog & Kefir, Made in Kent (57) | Organic coconut yog and kefir made in Kent with just three simple ingredients and billions of live cultures. Vegan, dairy free and never heat treated. (150) | WebPage, FAQPage (4 Home FAQs) |
| Our Range | `/our-range` | Our Range: Organic Coconut Yog & Kefir \| Cocos Organic (54) | Five organic coconut yogs and three coconut kefirs, thick, creamy and made with billions of live cultures. Vegan, dairy free and made in the UK. (144) | CollectionPage, ItemList (8 products), BreadcrumbList |
| Flavour pages | `/flavours/{slug}` | From CMS field "SEO title", e.g. Natural Organic Coconut Yogurt \| Cocos Organic | From CMS field "SEO description", taken from your flavour copy doc | Product, WebPage, BreadcrumbList |
| Gut Health | `/gut-health` | Gut Health & Live Cultures \| Cocos Organic (42) | Organic coconut yogs and kefirs made with simple ingredients and billions of live and active cultures, including BB-12®. Never heat treated. (140) | WebPage, FAQPage (10 Gut Health FAQs), BreadcrumbList |
| Recipes | `/recipes` | Coconut Yog & Kefir Recipes \| Cocos Organic (43) | More than 30 breakfasts, bakes, savoury dishes and desserts, all made with Cocos Organic coconut yog and kefir. Vegan and dairy free. (133) | CollectionPage, ItemList, BreadcrumbList |
| Recipe pages | `/recipes/{slug}` | {name} Recipe \| Cocos Organic | The recipe's description field | Recipe (full), WebPage, BreadcrumbList |
| Stockists | `/stockists` | Where to Buy Coconut Yog & Kefir \| Cocos Organic (48) | Find Cocos Organic coconut yog and kefir near you. Search by postcode or town for supermarkets, health food stores and independents that stock us. (146) | WebPage, BreadcrumbList |
| Our Story | `/our-story` | Our Story: Family-Owned, Made in Kent \| Cocos Organic (53) | Cocos Organic is a small, independent, family-owned British business making organic coconut yog and kefir in our own dairy-free factory in Kent. (144) | AboutPage, BreadcrumbList |
| Our Coconuts | `/our-coconuts` | Our Coconuts: Hand-Picked in Sri Lanka \| Cocos Organic (54) | Our organic coconuts come exclusively from small farms in Sri Lanka, picked by hand with no pesticides or fertilisers, and nothing goes to waste. (145) | WebPage, BreadcrumbList |
| FAQ | `/faq` | FAQs: Ingredients, Storage & Where to Buy \| Cocos Organic (57) | Answers to common questions about Cocos Organic coconut yog and kefir: ingredients, gut health, where to buy, storage and trade. (128) | FAQPage (13 general FAQs), BreadcrumbList |
| Contact | `/contact` | Contact Cocos Organic \| Questions, Stockists & Trade (52) | Get in touch with Cocos Organic: questions, stockist and trade enquiries, or anything about our coconut yog and kefir. (118) | ContactPage, BreadcrumbList |
| Blog | `/blog` | Blog: News, Recipes & Gut Health \| Cocos Organic (48) | News, recipes and stories on gut health, organic coconuts and everything happening at Cocos Organic, the British coconut yog and kefir makers. (142) | Blog, ItemList, BreadcrumbList |
| News posts | `/news/{slug}` | {name} \| Cocos Organic | The post's summary field | BlogPosting, WebPage, BreadcrumbList |
| Privacy Policy | `/legal/privacy-policy` | Privacy Policy \| Cocos Organic (30) | How Cocos Organic collects, uses and protects your personal information, including newsletter sign-ups and cookies. (115) | WebPage |
| Cookie Policy | `/legal/cookie-policy` | Cookie Policy \| Cocos Organic (29) | Which cookies the Cocos Organic website uses, what each one is for, how long it lasts and how to manage or switch off cookies in your browser. (142) | WebPage |
| Terms and Conditions (new page) | `/legal/terms-conditions` | Terms and Conditions \| Cocos Organic (36) | The terms and conditions for using the Cocos Organic website, covering how you may use our content, our liability and how to contact us about them. (147) | WebPage |

**Flavour pages need two new CMS fields**, "SEO title" and "SEO description". Your copy doc already has these for the five yogs. A Webflow template can bind to them, so every flavour gets unique metadata.

**Open Graph and Twitter:** each page gets og:title, og:description, og:image (1200x630), og:type (website; article for news posts), og:url and `twitter:card` = `summary_large_image`. Titles and descriptions copy from the SEO fields. Images: Home and the static pages share one default image; recipes use the recipe photo; news posts use the main image; flavours get a per-flavour share image (to be made, one per flavour).

## 4. Schema plan (JSON-LD)

One `@graph` per page. Entities share stable `@id`s so they link together.

**Sitewide, in the site head (every page):** Organization and WebSite. Moving them out of Home's page schema means every page carries them once, with nothing duplicated.
- Organization: name, url, logo (PNG), description, email `hello@cocos-organic.com`, address (3rd Floor, 86-90 Paul Street, London EC2A 4NE), contactPoint, `sameAs` = Instagram, TikTok, Facebook (`facebook.com/cocosorganicuk`, taken from the old campaign links; to confirm).
- WebSite: url, name, inLanguage en-GB, publisher. No SearchAction, because the site has no site search.

**Per page:**

| Type | Used on | Notes |
|---|---|---|
| WebPage / CollectionPage / AboutPage / ContactPage | each page | name, description, url, isPartOf WebSite, about Organization, inLanguage |
| BreadcrumbList | every page except Home | Home > Section > Page; templates add the item name |
| FAQPage | Home (4), FAQ (13), Gut Health (10) | Built from the visible FAQs only (see notes below) |
| Product | each flavour | name, description, image, brand, category (Coconut Yog or Coconut Kefir), sizes, url. **No offers or price**, since we do not sell online. That means no merchant rich result, but search engines still get a clean entity |
| ItemList | Our Range, Recipes, Blog | the items on the page, so each product, recipe and post is linked as an entity |
| Recipe | each recipe | see below |
| BlogPosting | each news post | headline, description, image, datePublished, dateModified, author, publisher, mainEntityOfPage, articleSection |

**FAQ schema, honest expectations**
- Since 2023 Google only shows FAQ rich results for well-known government and health sites, so this site will not get the expandable snippets. The markup still helps AI answers and other engines, and costs little.
- It must match the visible text exactly, and a question may only be marked up on a page where it is visible. The same 4 questions on Home and on the FAQ page is fine.
- Generating it from the page (section 5) keeps it in step when the FAQ CMS changes. Hand-writing 13 questions into Webflow would go stale.
- There are 23 FAQ items today. 10 are flagged "Gut Health page only", and there are near-duplicates to consolidate before launch ("Is there added sugar?" appears twice, as does the tapioca starch question).

**Recipe schema, full version** (the template has roughly a third of it today): name, description, image, author (Organization), datePublished, recipeCategory (Breakfast, Bakes, Savoury, Desserts), recipeYield (Serves), prepTime or totalTime as ISO 8601 (the CMS holds text like "30 mins"), recipeIngredient (a list from the Ingredients rich text), recipeInstructions (HowToStep list from Method), keywords (flavour plus category), and `suitableForDiet` = VeganDiet **only if the client confirms every recipe is vegan**. We have no ratings or video, so there is no aggregateRating or VideoObject. Adding made-up ratings would breach Google's policy.

**Not recommended**
- **Review or AggregateRating markup** for the testimonial cards: they are the brand's own quotes with no star ratings, and Google ignores or penalises self-served review markup.
- **LocalBusiness, Store or Offer:** no public premises or online sales.
- **Health claims in schema** (MedicalWebPage, healthClaim). Your copy notes flag the immune and skin health icons as needing sign-off.

## 5. How it gets built, and what only you can do

| Item | Method | Notes |
|---|---|---|
| Titles, descriptions, OG titles | Webflow API (bulk page update) | Static pages in one call |
| Template titles and descriptions | CMS binding in page settings | Needs the two new Flavours fields, and a check that every news post has a summary |
| Static page schema | Webflow API (bulk schema update) | Home, Our Range, Our Story, Our Coconuts, Stockists, Contact, Blog, Recipes, legal |
| Sitewide Organization and WebSite | Site head custom code | One small block, replaces Home's copy |
| Product, BlogPosting | CMS bindings where the field is text or an image | The existing Recipe schema shows bindings work |
| Recipe ingredients and steps, FAQ lists | A small script in the site code (v1.19) | Reads the page and writes JSON-LD. Googlebot reads JS-added JSON-LD. Needed because rich text and repeated items cannot be bound into a list |
| OG image per template | CMS image bindings | Needs the default and per-flavour images made |
| Sitemap exclusions, noindex on the collection templates | **You**, in each page's SEO settings | Not exposed to my tools |
| 301 redirects | **You**, importing a CSV in Site settings > Hosting | I will prepare the CSV |
| Canonical tag, robots.txt, favicon, Search Console | **You**, in site settings | I will give exact values |

Everything is validated afterwards with Google's Rich Results Test and the Schema.org validator, then published to staging only, as always.

## 6. Redirect map (old WordPress to new)

From the old site's sitemaps. Old URLs end in `/`; the new site has none. Total: 18 pages, 30 recipes, 10 posts.

| Old | New |
|---|---|
| `/` | `/` |
| `/products/`, `/organic-yoghurt-alternatives/`, `/organic-coconut-kefir/`, `/organic-coconut-milk-yog-tubes/`, `/npd/` | `/our-range` |
| `/organic-creamy-spread/` | `/news/new-organic-creamy-spreadnow-available-in-waitrose` |
| `/creamy-coconut-drink-recipes/`, `/recipes/` | `/recipes` |
| `/gut-health-e-book/` | `/` (the e-book sign-up is on Home) |
| `/our-story/`, `/our-coconuts/`, `/contact/`, `/stockists/`, `/blog/` | same path |
| `/privacy-policy/` | `/legal/privacy-policy` |
| `/cookies-policy/` | `/legal/cookie-policy` |
| `/terms-conditions/` | `/legal/terms-conditions` (page to be written) |
| `/recipe/{slug}/` (30) | `/recipes/{slug}`. Two slugs changed: `healthy-mulberry-coconut-granola` to `mulberry-coconut-granola`, and `high-protein-ranch-quinoa-salad` to `ranch-quinoa-salad` |
| `/blogs/{slug}/` (10) | `/news/{slug}` (each slug to be checked) |

The new CMS has 33 recipes, so three have no old URL (vegan lasagne, creamy beans with pesto, lemon poppyseed muffins). Old `/wp-content/uploads/` image URLs can't be redirected from Webflow, so check whether any external site links to them.

## 7. Other on-page and technical items

1. Set the site language to English (UK) so `<html lang>` is `en-GB`.
2. One canonical domain, decided once (www versus non-www), with the other redirecting to it. Turn off indexing of the `webflow.io` subdomain after launch.
3. Check each page has exactly one H1 and a sensible heading order. I used an H1 for the page title on the new pages; the audit should also cover Home and the older pages.
4. Alt text: bound to the name on cards; the hero pot photos and Our Story photos need written alt text.
5. Favicon (32 px) and Apple touch icon (180 px); theme colour.
6. A real 404 page.
7. Core Web Vitals pass on Home (the pinned hero and large images), plus lazy loading below the fold.
8. Google Search Console and Bing Webmaster Tools: verify, submit the sitemap, then watch coverage against the redirect map.

## 8. Decisions needed

1. Non-www (`cocos-organic.com`) as the canonical domain?
2. Is `facebook.com/cocosorganicuk` the right page, and are there others (LinkedIn, YouTube)?
3. Are all recipes vegan, so the schema can say so?
4. Who writes the Privacy, Cookie and Terms copy? Without it we can't ship a compliant newsletter form.
5. Can you supply a PNG logo, and approve the share image's wording?
6. OK to generate Recipe and FAQ lists with a small script (section 5), or would you rather hand-write them in Webflow?
7. OK to noindex the collection templates listed in section 2?

## 9. Suggested order

1. Metadata and OG text for all static pages; sitewide Organization and WebSite.
2. Flavours: new SEO fields filled from your copy doc; Product schema and bindings.
3. Recipe schema in full, then News and BlogPosting.
4. FAQ and list schema via the script.
5. Your Designer jobs: noindex and sitemap exclusions, redirects CSV, canonical, favicon.
6. Validate everything, publish to staging, final check, then production.

## 10. Decisions made (23 Oct 2026)

1. Canonical domain: `https://cocos-organic.com` (non-www).
2. sameAs: Instagram and TikTok only (no Facebook).
3. Recipe vegan label: left out until the client confirms.
4. Legal copy: sorted later by the client (Termageddon or Consent Pro). Pages stay placeholders and remain a launch blocker.
5. Logo and share image: make from what exists (PNG logo from the SVG; rework og.png without the "3 Simple Ingredients" and gut health wording on the pots).
6. Recipe and FAQ lists: generated by a small script from the page.
7. Collection templates and /styleguide: noindex and sitemap exclusion, done by Luke in each page's SEO settings.
