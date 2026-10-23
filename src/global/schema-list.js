// Writes an ItemList JSON-LD block for a listing page (recipes, blog), so each item is linked as
// an entity. Built from the page's own cards, so it follows the CMS.
//
//   [data-schema-list="Name"]   the collection list element; its value names the list
//
// Every card is the <a> directly inside a .w-dyn-item; its first heading is the item name.
// Cards without a link or a name are skipped.

const SITE = 'https://cocos-organic.com';
const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

export default function schemaList() {
  document.querySelectorAll('[data-schema-list]').forEach((root) => {
    const items = [];
    root.querySelectorAll('.w-dyn-item > a[href]').forEach((card) => {
      const href = card.getAttribute('href');
      const name = card.querySelector('h1, h2, h3, h4');
      if (!href || href === '#' || !name || !text(name)) return;
      items.push({
        '@type': 'ListItem',
        position: items.length + 1,
        url: href.startsWith('http') ? href : `${SITE}${href}`,
        name: text(name),
      });
    });
    if (!items.length) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: root.getAttribute('data-schema-list') || 'List',
      itemListElement: items,
    });
    document.head.appendChild(script);
  });
}
