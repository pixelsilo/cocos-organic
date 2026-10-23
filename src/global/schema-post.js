// Adds the publish date to a news post's BlogPosting JSON-LD. The CMS date binds into schema as
// text Webflow formats for display, so read the date the page already shows and convert it to
// an ISO date instead.
//
//   [data-post-date]   element whose text is a date such as "August 16, 2023"

export default function schemaPost() {
  const el = document.querySelector('[data-post-date]');
  if (!el) return;

  // Parse as UTC midday so the day never shifts with the visitor's time zone
  const parsed = new Date(`${el.textContent.trim()} 12:00:00 UTC`);
  if (Number.isNaN(parsed.getTime())) return;
  const iso = parsed.toISOString().slice(0, 10);

  const block = [...document.querySelectorAll('script[type="application/ld+json"]')].find((s) => /"@type"\s*:\s*"BlogPosting"/.test(s.textContent));
  if (!block) return;

  let data;
  try {
    data = JSON.parse(block.textContent);
  } catch (err) {
    return;
  }
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
  const post = graph.find((n) => n['@type'] === 'BlogPosting');
  if (!post) return;

  post.datePublished = iso;
  post.dateModified = iso;
  block.textContent = JSON.stringify(data);
}
