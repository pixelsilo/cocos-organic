// Scroll reveals, driven by attributes so new sections need no JS.
//
// Blocks (data-reveal):
//   data-reveal="section"   the whole element slides up a little and fades in (use on a section)
//   data-reveal="group"     fades up the element's direct children, staggered (card grids, CMS lists)
//   data-reveal="item"      fades up the element itself
//
// Text (data-reveal-text):
//   data-reveal-text="words"   headings: each word rises and fades in, staggered
//   data-reveal-text="chars"   the same, per letter (short headings only)
//
// Tuning, all optional: data-reveal-y (rem; em for text) / -duration / -stagger / -delay /
// -ease / -start (ScrollTrigger start). Defaults per type live in lib/motion.js.
//
// Until this runs, CSS (code_css) hides these elements behind html.reveal-pending, which the
// code_js embed sets and clears after a few seconds as a safety net. Each element is revealed
// once, and nothing runs under prefers-reduced-motion or without GSAP.

import { animateIn, canAnimate, readOptions, rootPx, setHiddenPx } from '../lib/motion.js';
import { splitText } from '../lib/split.js';

const READY = 'data-reveal-ready';
const DONE = 'data-reveal-done'; // another module (e.g. range tabs) already animated this group

export default function reveal() {
  const blocks = [...document.querySelectorAll('[data-reveal]')];
  const texts = [...document.querySelectorAll('[data-reveal-text]')];
  const all = [...blocks, ...texts];
  const release = () => document.documentElement.classList.remove('reveal-pending');

  if (!all.length || !canAnimate()) {
    all.forEach((el) => el.setAttribute(READY, ''));
    release();
    return;
  }

  const hasTrigger = typeof window.ScrollTrigger !== 'undefined';
  if (hasTrigger) window.gsap.registerPlugin(window.ScrollTrigger);

  // Hold the element hidden now (inline styles), play when it scrolls into view
  function arm(el, opts, play) {
    el.setAttribute(READY, ''); // inline styles hold the hidden state, so the CSS pre-hide can step aside
    const run = () => {
      if (el.hasAttribute(DONE)) return;
      el.setAttribute(DONE, '');
      play();
    };
    if (hasTrigger) {
      window.ScrollTrigger.create({ trigger: el, start: opts.start, once: true, onEnter: run });
    } else {
      run();
    }
  }

  blocks.forEach((el) => {
    if (el.hasAttribute(READY)) return;
    const mode = ['section', 'group', 'item'].includes(el.getAttribute('data-reveal'))
      ? el.getAttribute('data-reveal')
      : 'item';
    const targets = mode === 'group' ? [...el.children] : [el];
    if (!targets.length) return;
    const opts = readOptions(el, mode);
    setHiddenPx(targets, opts.y * rootPx());
    arm(el, opts, () => animateIn(targets, opts));
  });

  texts.forEach((el) => {
    if (el.hasAttribute(READY)) return;
    const mode = el.getAttribute('data-reveal-text') === 'chars' ? 'chars' : 'words';
    const units = splitText(el, mode);
    if (!units.length) return;
    const opts = readOptions(el, mode);
    const yPx = opts.y * (parseFloat(getComputedStyle(el).fontSize) || rootPx()); // em -> px
    // Keep long headings from taking forever: spread the stagger over at most ~0.8s
    const stagger = Math.min(opts.stagger, 0.8 / Math.max(1, units.length - 1));
    setHiddenPx(units, yPx);
    arm(el, opts, () => animateIn(units, { ...opts, stagger, yPx }));
  });

  release();

  // Heights shift as fonts load, so have ScrollTrigger re-measure its start positions
  if (hasTrigger) {
    const refresh = () => window.ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh, { once: true });
  }
}
