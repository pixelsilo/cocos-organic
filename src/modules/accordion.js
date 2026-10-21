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
// With GSAP: the answer's height, padding, margin and opacity are tweened. Padding and margin
// have to go too (the FAQ answer has bottom padding and a negative top margin), or the row
// floors at that spacing and snaps when it opens or finishes closing. A row that is closing
// gets [data-closing] so the stylesheet can flip its icon straight away rather than at the end.
// The native `name` is moved to data-accordion-group so the browser doesn't snap the
// other row shut; the group is enforced here with an animated close instead.

import { canAnimate } from '../lib/motion.js';

// Same duration and ease both ways, so when one row opens as another closes the page below
// moves by the difference of two matching curves instead of wobbling
const DURATION = 0.45;
const EASE = 'power2.inOut';

export default function accordion(root) {
  const items = [...root.querySelectorAll('details')];
  if (!items.length || !canAnimate()) return;

  const gsap = window.gsap;
  const contentOf = (d) => d.querySelector('summary')?.nextElementSibling;
  const isOpen = (d) => d.hasAttribute('open') && !d.hasAttribute('data-closing');
  const SPACING = ['paddingTop', 'paddingBottom', 'marginTop', 'marginBottom'];
  const NONE = Object.fromEntries(SPACING.map((p) => [p, 0]));
  const reset = (c) => gsap.set(c, { clearProps: ['height', 'opacity', 'overflow', ...SPACING].join(',') });

  // The answer's natural border-box height, padding and margin, read with any in-flight inline
  // values set aside. The height is measured here because GSAP's own 'auto' target ignores the
  // padding of a border-box element, which leaves the tween short and snaps when it finishes.
  function natural(c) {
    const props = ['height', ...SPACING];
    const inline = Object.fromEntries(props.map((p) => [p, c.style[p]]));
    props.forEach((p) => (c.style[p] = ''));
    const computed = getComputedStyle(c);
    const size = { height: c.getBoundingClientRect().height };
    SPACING.forEach((p) => (size[p] = computed[p]));
    props.forEach((p) => (c.style[p] = inline[p]));
    return size;
  }

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
      ...NONE,
      opacity: 0,
      duration: DURATION,
      ease: EASE,
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
    const to = {
      opacity: 1,
      ...natural(c),
      duration: DURATION,
      ease: EASE,
      onComplete: () => reset(c),
    };
    if (wasOpen) gsap.to(c, to);
    else gsap.fromTo(c, { height: 0, ...NONE, opacity: 0 }, to);
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
