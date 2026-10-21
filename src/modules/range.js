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
// Autoplay advances to the next tab once the fill completes. Hovering or focusing the
// section does NOT pause it; only picking a tab does. The picked tab then holds (fill
// full) for HOLD_MS and autoplay restarts from zero. Reduced motion disables autoplay.
//
// Switching ranges animates the list height from the old set to the new one, so the
// content below glides instead of jumping (the sets can differ a lot when stacked on
// mobile, so locking to the tallest height would leave a big gap).

import { animateIn, animateOut, canAnimate } from '../lib/motion.js';

const AUTOPLAY_MS = 8000;
const HOLD_MS = 10000;

export default function range(root) {
  const tabs = [...root.querySelectorAll('[data-range-tab]')];
  const cards = [...root.querySelectorAll('[data-range]')];
  if (tabs.length < 2 || !cards.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  const autoplay = !reduceMotion;
  let held = false;
  let holdTimer = 0;
  let inView = true;
  let elapsed = 0;
  let last = 0;
  let raf = 0;

  const items = cards.map((card) => card.closest('.w-dyn-item') || card);
  const group = items[0].closest('[data-reveal]'); // scroll reveal wrapper, if the list has one
  const list = items[0].parentElement;
  let shown = null; // range currently on screen
  let swapId = 0; // invalidates an in-flight card transition

  const fillOf = (tab) => tab.querySelector('[data-range-fill]');
  const labelOf = (tab) => tab.querySelector('.range_tab-label');

  // Swap the visible cards. Animated: current cards fade out, then the new ones rise in, staggered.
  function swapCards(name, animate) {
    const id = ++swapId;
    const next = items.filter((_, k) => cards[k].dataset.range === name);
    const apply = () => items.forEach((item) => (item.hidden = !next.includes(item)));
    const previous = shown;
    shown = name;

    if (!animate || previous === null || previous === name || !canAnimate()) {
      if (typeof window.gsap !== 'undefined') window.gsap.killTweensOf(list);
      list.style.height = ''; // drop any height a superseded transition left behind
      apply();
      return;
    }
    group?.setAttribute('data-reveal-done', ''); // the scroll reveal must not replay over this
    const gsap = window.gsap;
    gsap.killTweensOf(list);
    const fromHeight = list.getBoundingClientRect().height;
    list.style.height = `${fromHeight}px`; // freeze while the old cards fade out
    animateOut(items.filter((item) => !item.hidden)).then(() => {
      if (id !== swapId) return; // a newer pick took over
      apply();
      // New natural height, measured without painting, then glide there from the old one
      list.style.height = 'auto';
      const toHeight = list.getBoundingClientRect().height;
      list.style.height = `${fromHeight}px`;
      gsap.to(list, {
        height: toHeight,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => (list.style.height = ''),
      });
      animateIn(next, { y: 1, duration: 0.7, stagger: 0.08, delay: 0.1 });
    });
  }

  function show(index, animate = false) {
    current = index;
    const name = tabs[index].dataset.rangeTab;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      labelOf(tab)?.classList.toggle('is-inactive', !on);
      const fill = fillOf(tab);
      if (fill) fill.style.width = on && (held || !autoplay) ? '100%' : '0%';
    });
    swapCards(name, animate);
    elapsed = 0;
  }

  function tick(now) {
    if (autoplay && !held && inView) {
      // Cap the step so a throttled frame (background tab) can't skip ahead
      elapsed += Math.min(now - (last || now), 100);
      const fill = fillOf(tabs[current]);
      if (fill) fill.style.width = `${Math.min(elapsed / AUTOPLAY_MS, 1) * 100}%`;
      if (elapsed >= AUTOPLAY_MS) show((current + 1) % tabs.length, true);
    }
    last = now;
    raf = requestAnimationFrame(tick);
  }

  function release() {
    held = false;
    show(current); // fill back to 0, timer restarts (same range, so no card change)
  }

  function choose(index) {
    clearTimeout(holdTimer);
    held = true;
    show(index, true);
    if (autoplay) holdTimer = setTimeout(release, HOLD_MS);
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

  // Only run the progress while the section is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => (inView = entry.isIntersecting)).observe(root);
  }

  show(0);
  if (autoplay) raf = requestAnimationFrame(tick);
}
