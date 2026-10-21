// Smooth open/close for native <details> accordions (the FAQ).
//
// Markup (inside the root):
//   [data-module="accordion"]               root, e.g. the FAQ Collection List
//     details[name="faq-home"]              one per row; rows sharing a name behave as a group
//       summary                             the toggle
//       <element>                           the answer: whatever follows the summary
//
// Without GSAP, or under prefers-reduced-motion, nothing here runs and the browser's own
// details behaviour (including the exclusive `name` group) is used unchanged.
//
// With GSAP: the answer's height and opacity are tweened, and a row that is closing gets
// [data-closing] so the stylesheet can flip its icon straight away rather than at the end.
// The native `name` is moved to data-accordion-group so the browser doesn't snap the
// other row shut; the group is enforced here with an animated close instead.

import { canAnimate } from '../lib/motion.js';

const OPEN_S = 0.5;
const CLOSE_S = 0.35;

export default function accordion(root) {
  const items = [...root.querySelectorAll('details')];
  if (!items.length || !canAnimate()) return;

  const gsap = window.gsap;
  const contentOf = (d) => d.querySelector('summary')?.nextElementSibling;
  const isOpen = (d) => d.hasAttribute('open') && !d.hasAttribute('data-closing');
  const reset = (c) => gsap.set(c, { clearProps: 'height,opacity,overflow' });

  items.forEach((d) => {
    const group = d.getAttribute('name');
    if (group) {
      d.dataset.accordionGroup = group;
      d.removeAttribute('name');
    }
  });

  function close(d) {
    const c = contentOf(d);
    if (!c) return d.removeAttribute('open');
    d.setAttribute('data-closing', '');
    c.style.overflow = 'hidden';
    gsap.killTweensOf(c);
    gsap.to(c, {
      height: 0,
      opacity: 0,
      duration: CLOSE_S,
      ease: 'power2.inOut',
      onComplete() {
        d.removeAttribute('open');
        d.removeAttribute('data-closing');
        reset(c);
      },
    });
  }

  function open(d) {
    const c = contentOf(d);
    if (!c) return d.setAttribute('open', '');
    const wasOpen = d.hasAttribute('open'); // true when re-opening mid-close
    d.removeAttribute('data-closing');
    d.setAttribute('open', '');
    c.style.overflow = 'hidden';
    gsap.killTweensOf(c);
    const to = { height: 'auto', opacity: 1, duration: OPEN_S, ease: 'power2.out', onComplete: () => reset(c) };
    if (wasOpen) gsap.to(c, to);
    else gsap.fromTo(c, { height: 0, opacity: 0 }, to);
  }

  root.addEventListener('click', (e) => {
    const summary = e.target.closest('summary');
    const d = summary?.parentElement;
    if (!d || d.tagName !== 'DETAILS' || !root.contains(d)) return;
    e.preventDefault(); // take over from the native toggle (Enter and Space arrive here as clicks too)

    if (isOpen(d)) return close(d);

    const group = d.dataset.accordionGroup;
    if (group) items.forEach((o) => o !== d && o.dataset.accordionGroup === group && isOpen(o) && close(o));
    open(d);
  });
}
