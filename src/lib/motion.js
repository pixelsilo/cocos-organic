// Shared motion helpers on top of the GSAP that Webflow already loads (window.gsap).
// Nothing here bundles GSAP: if it is missing, or the visitor prefers reduced motion,
// canAnimate() is false and callers just show things.
//
// Defaults per reveal type, each tunable per element with attributes
// (y in rem, or em for text; times in seconds):
//   data-reveal-y  data-reveal-duration  data-reveal-stagger  data-reveal-delay
//   data-reveal-ease  data-reveal-start (ScrollTrigger start, e.g. "top 85%")

export const MODES = {
  item: { y: 1.5, duration: 0.8, stagger: 0.1, delay: 0, ease: 'power3.out', start: 'top 85%' },
  group: { y: 1.5, duration: 0.8, stagger: 0.1, delay: 0, ease: 'power3.out', start: 'top 85%' },
  // A whole section: a short slide up with a fade
  section: { y: 2.5, duration: 1, stagger: 0, delay: 0, ease: 'power3.out', start: 'top 88%' },
  // Heading text, y is in em so it scales with the type size. A short delay lets the
  // section start moving first, so the two read as layers
  words: { y: 0.6, duration: 0.9, stagger: 0.06, delay: 0.1, ease: 'power3.out', start: 'top 88%' },
  chars: { y: 0.5, duration: 0.7, stagger: 0.025, delay: 0.1, ease: 'power3.out', start: 'top 88%' },
};
export const DEFAULTS = MODES.item;

export const rootPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

export const canAnimate = () =>
  typeof window.gsap !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function num(el, name, fallback) {
  const value = parseFloat(el?.getAttribute(`data-reveal-${name}`));
  return Number.isFinite(value) ? value : fallback;
}

export function readOptions(el, mode = 'item') {
  const base = MODES[mode] || DEFAULTS;
  return {
    y: num(el, 'y', base.y),
    duration: num(el, 'duration', base.duration),
    stagger: num(el, 'stagger', base.stagger),
    delay: num(el, 'delay', base.delay),
    ease: el?.getAttribute('data-reveal-ease') || base.ease,
    start: el?.getAttribute('data-reveal-start') || base.start,
  };
}

// Pre-state used before a reveal (opacity 0, nudged down by y px)
export function setHiddenPx(targets, yPx) {
  window.gsap.set(targets, { opacity: 0, y: yPx });
}

export function setHidden(targets, y = DEFAULTS.y) {
  setHiddenPx(targets, y * rootPx());
}

// Fade + rise in, staggered. Inline opacity/transform are cleared afterwards so
// hover styles and the stylesheet take over again. yPx overrides y (rem) when given.
export function animateIn(targets, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const yPx = opts.yPx ?? o.y * rootPx();
  return window.gsap.fromTo(
    targets,
    { opacity: 0, y: yPx },
    {
      opacity: 1,
      y: 0,
      duration: o.duration,
      stagger: o.stagger,
      delay: o.delay,
      ease: o.ease,
      overwrite: 'auto',
      clearProps: 'opacity,transform',
    }
  );
}

// Quick fade out; resolves when finished (or if it is interrupted)
export function animateOut(targets, { y = 0.5, duration = 0.25, stagger = 0.03 } = {}) {
  return new Promise((resolve) => {
    window.gsap.to(targets, {
      opacity: 0,
      y: -y * rootPx(),
      duration,
      stagger,
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: resolve,
      onInterrupt: resolve,
    });
  });
}
