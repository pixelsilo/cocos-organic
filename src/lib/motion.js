// Small GSAP helpers for the JS modules that need them (the range tabs, the FAQ accordion),
// on top of the GSAP that Webflow already loads (window.gsap). Nothing here bundles GSAP:
// if it is missing, or the visitor prefers reduced motion, canAnimate() is false and
// callers just show things.
//
// Scroll reveals (sections, card grids, headings) are NOT here: they are native Webflow
// interactions driven by attributes (slide / split), see the README.

const rootPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

export const canAnimate = () =>
  typeof window.gsap !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fade + rise in, staggered. Inline opacity/transform are cleared afterwards so
// hover styles and the stylesheet take over again.
export function animateIn(targets, { y = 1.5, duration = 0.8, stagger = 0.1, delay = 0, ease = 'power3.out' } = {}) {
  return window.gsap.fromTo(
    targets,
    { opacity: 0, y: y * rootPx() },
    { opacity: 1, y: 0, duration, stagger, delay, ease, overwrite: 'auto', clearProps: 'opacity,transform' }
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
