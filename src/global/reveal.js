// Scroll reveal, driven by attributes so new sections need no JS.
//
//   data-reveal="group"   fades up the element's direct children, staggered
//                         (put it on a CMS Collection List, card grid, etc.)
//   data-reveal="item"    fades up the element itself
//
// Optional tuning attributes: data-reveal-y / -duration / -stagger / -delay / -ease
// (see lib/motion.js) and data-reveal-start (ScrollTrigger start, default "top 85%").
//
// Until this runs, CSS (code_css) hides revealed content behind html.reveal-pending,
// which a snippet in the same embed removes after a few seconds as a safety net.
// Runs once per element, and not at all under prefers-reduced-motion.

import { animateIn, canAnimate, readOptions, setHidden } from '../lib/motion.js';

const READY = 'data-reveal-ready';
const DONE = 'data-reveal-done'; // another module (e.g. range tabs) already animated this group

export default function reveal() {
  const roots = [...document.querySelectorAll('[data-reveal]')];
  const release = () => document.documentElement.classList.remove('reveal-pending');

  if (!roots.length || !canAnimate()) {
    roots.forEach((el) => el.setAttribute(READY, ''));
    release();
    return;
  }

  const gsap = window.gsap;
  const hasTrigger = typeof window.ScrollTrigger !== 'undefined';
  if (hasTrigger) gsap.registerPlugin(window.ScrollTrigger);

  roots.forEach((el) => {
    if (el.hasAttribute(READY)) return;
    const targets = el.getAttribute('data-reveal') === 'group' ? [...el.children] : [el];
    if (!targets.length) return;
    const opts = readOptions(el);

    setHidden(targets, opts.y); // inline styles now hold the hidden state...
    el.setAttribute(READY, ''); // ...so the CSS pre-hide can step aside

    const play = () => {
      if (el.hasAttribute(DONE)) return;
      el.setAttribute(DONE, '');
      animateIn(targets, opts);
    };

    if (hasTrigger) {
      window.ScrollTrigger.create({
        trigger: el,
        start: el.getAttribute('data-reveal-start') || 'top 85%',
        once: true,
        onEnter: play,
      });
    } else {
      play();
    }
  });

  release();
}
