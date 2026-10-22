// FAQ page: live search over the questions, and a highlighted category link for the group in view.
//
// Markup (inside the root, the page's main):
//   [data-faq-input]               search field
//   [data-faq-group="slug"]        one per category, wrapping that category's .faq_item rows (a CMS list)
//   [data-faq-link="slug"]         category link in the side nav (href="#slug"); gets .is-active while its group is in view,
//                                  and scrolls its group in just below the sticky nav
//   .faqpage_empty                 "no results" line; gets .is-shown when nothing matches
//
// A row matches when every word typed appears in its question or answer. Groups with no matching
// row, and their links, are hidden. Without JS every question is shown and the links are plain anchors.

export default function faqSearch(root) {
  const input = root.querySelector('[data-faq-input]');
  const groups = [...root.querySelectorAll('[data-faq-group]')];
  const links = [...root.querySelectorAll('[data-faq-link]')];
  const empty = root.querySelector('.faqpage_empty');
  if (!groups.length) return;

  const rows = groups.map((group) =>
    [...group.querySelectorAll('.faq_item')].map((item) => ({ item, text: item.textContent.toLowerCase().replace(/\s+/g, ' ') }))
  );
  const linkFor = (slug) => links.find((l) => l.dataset.faqLink === slug);

  function search() {
    const terms = (input?.value || '').toLowerCase().split(/\s+/).filter(Boolean);
    let total = 0;
    groups.forEach((group, g) => {
      let shown = 0;
      rows[g].forEach(({ item, text }) => {
        const ok = terms.every((t) => text.includes(t));
        item.hidden = !ok;
        if (ok) shown += 1;
      });
      group.hidden = shown === 0;
      const link = linkFor(group.dataset.faqGroup);
      if (link) link.hidden = shown === 0;
      total += shown;
    });
    empty?.classList.toggle('is-shown', total === 0);
    track();
  }

  // The sticky nav (alert bar included) sits over the top of the page and its height is published
  // on <html> as --nav-h, so land the group's heading just below it
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function jump(slug, smooth) {
    const group = groups.find((g) => g.dataset.faqGroup === slug);
    if (!group) return;
    const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0;
    const top = group.getBoundingClientRect().top + window.scrollY - nav - 32;
    window.scrollTo({ top, behavior: smooth && !reduced.matches ? 'smooth' : 'auto' });
    setActive(slug);
  }

  function setActive(slug) {
    links.forEach((l) => l.classList.toggle('is-active', l.dataset.faqLink === slug));
  }

  // The active group is the last visible one whose top has reached just under the sticky nav, which is
  // where a category link lands it
  function track() {
    const line = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0) + 80;
    const visible = groups.filter((g) => !g.hidden);
    let current = visible[0];
    visible.forEach((g) => {
      if (g.getBoundingClientRect().top <= line) current = g;
    });
    // The last groups can't scroll up to the line, so at the very bottom the final group wins
    if (visible.length && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = visible[visible.length - 1];
    if (current) setActive(current.dataset.faqGroup);
  }

  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      track();
    });
  };

  input?.addEventListener('input', search);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
  });
  links.forEach((l) =>
    l.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Webflow's own in-page link handler would otherwise scroll the group flush to the top, behind the nav
      jump(l.dataset.faqLink, true);
      history.replaceState(null, '', '#' + l.dataset.faqLink);
    })
  );
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  search();

  // Arriving on /faq#storage: the browser's own jump (and Webflow's, a moment later) runs without the
  // nav offset, so redo it once --nav-h is set and again after Webflow has had its turn
  const slug = window.location.hash.slice(1);
  if (slug) {
    requestAnimationFrame(() => jump(slug, false));
    setTimeout(() => jump(slug, false), 900);
  }
}
