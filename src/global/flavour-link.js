// Points the flavour name in a recipe's "Made with" card at that flavour's page.
//
//   [data-flavour-link]   the link around the name; its id is bound to the referenced
//                         flavour's slug in the Designer (Recipes template, Flavour > Slug)
//
// Webflow can't link to a *referenced* item's page from the API, and a link can't be built from
// a slug alone, so the bound id carries the slug and the link is finished here. The id is then
// removed so it can't clash with anything else on the page. Without the id (a recipe with no
// flavour) the link keeps its fallback, the range page.

export default function flavourLink() {
  document.querySelectorAll('[data-flavour-link]').forEach((link) => {
    const slug = link.id.trim();
    if (!slug) return;
    link.setAttribute('href', `/flavours/${encodeURIComponent(slug)}`);
    link.removeAttribute('id');
  });
}
