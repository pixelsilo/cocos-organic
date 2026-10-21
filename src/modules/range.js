// Range tabs: filter the CMS flavour list by range and drive the progress bars.
//
// Markup (inside the section):
//   [data-module="range"]                      root
//     [role=tablist]
//       [data-range-tab="Coconut Yog"]         tab; value matches the CMS Range option name
//         .range_tab-label                     gets .is-inactive when not selected
//         [data-range-fill]                    progress bar fill, width driven here
//     .w-dyn-item                              list item wrapping a [data-range="Coconut Yog"] card
//
// Autoplay advances to the next tab once the fill completes. It pauses on hover/focus
// and stops for good after the visitor picks a tab or if they prefer reduced motion.

const AUTOPLAY_MS = 8000;

export default function range(root) {
  const tabs = [...root.querySelectorAll('[data-range-tab]')];
  const cards = [...root.querySelectorAll('[data-range]')];
  if (tabs.length < 2 || !cards.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let autoplay = !reduceMotion;
  let paused = false;
  let inView = true;
  let elapsed = 0;
  let last = 0;
  let raf = 0;

  const fillOf = (tab) => tab.querySelector('[data-range-fill]');
  const labelOf = (tab) => tab.querySelector('.range_tab-label');

  function show(index) {
    current = index;
    const name = tabs[index].dataset.rangeTab;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      labelOf(tab)?.classList.toggle('is-inactive', !on);
      const fill = fillOf(tab);
      if (fill) fill.style.width = on && !autoplay ? '100%' : '0%';
    });
    cards.forEach((card) => {
      const item = card.closest('.w-dyn-item') || card;
      item.hidden = card.dataset.range !== name;
    });
    elapsed = 0;
  }

  function tick(now) {
    if (autoplay && !paused && inView) {
      // Cap the step so a throttled frame (background tab) can't skip ahead
      elapsed += Math.min(now - (last || now), 100);
      const fill = fillOf(tabs[current]);
      if (fill) fill.style.width = `${Math.min(elapsed / AUTOPLAY_MS, 1) * 100}%`;
      if (elapsed >= AUTOPLAY_MS) show((current + 1) % tabs.length);
    }
    last = now;
    raf = requestAnimationFrame(tick);
  }

  function choose(index) {
    autoplay = false;
    cancelAnimationFrame(raf);
    show(index);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => choose(i));
    tab.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        choose(i);
      } else if (dir) {
        e.preventDefault();
        const next = (i + dir + tabs.length) % tabs.length;
        choose(next);
        tabs[next].focus();
      }
    });
  });

  ['mouseenter', 'focusin'].forEach((t) => root.addEventListener(t, () => (paused = true)));
  ['mouseleave', 'focusout'].forEach((t) => root.addEventListener(t, () => (paused = false)));

  // Only run the progress while the section is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => (inView = entry.isIntersecting)).observe(root);
  }

  show(0);
  if (autoplay) raf = requestAnimationFrame(tick);
}
