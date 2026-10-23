// Webflow HTML-escapes CMS text it binds into JSON-LD, so a name like "Mango & Passionfruit"
// arrives in the schema as "Mango &amp; Passionfruit". JSON-LD is not HTML, so the entity would
// be read literally. Turn the common ones back into characters before anything else touches
// the blocks. Runs first among the schema globals.

const ENTITIES = [
  [/&amp;/g, '&'],
  [/&quot;/g, '\\"'],
  [/&#x27;|&#39;/g, "'"],
];

export default function schemaClean() {
  document.querySelectorAll('script[type="application/ld+json"]').forEach((block) => {
    const before = block.textContent;
    if (!before.includes('&')) return;
    let after = before;
    ENTITIES.forEach(([pattern, replacement]) => {
      after = after.replace(pattern, replacement);
    });
    if (after === before) return;
    try {
      JSON.parse(after); // only write it back if it is still valid JSON
      block.textContent = after;
    } catch (err) {
      /* leave the block as Webflow wrote it */
    }
  });
}
