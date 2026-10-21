// Shared motion helpers on top of the GSAP that Webflow already loads (window.gsap).
// Nothing here bundles GSAP: if it is missing, or the visitor prefers reduced motion,
// canAnimate() is false and callers just show things.
//
// Tunable per element with attributes (units: y in rem, times in seconds):
//   data-reveal-y="1.5"  data-reveal-duration="0.8"  data-reveal-stagger="0.1"
//   data-reveal-delay="0"  data-reveal-ease="power3.out"

export const DEFAULTS = { y: 1.5, duration: 0.8, stagger: 0.1, delay: 0, ease: 'power3.out' };

const rootPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

export const canAnimate = () =>
  typeof window.gsap !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function num(el, name, fallback) {
  const value = parseFloat(el?.getAttribute(`data-reveal-${name}`));
  return Number.isFinite(value) ? value : fallback;
}

export function readOptions(el) {
  return {
    y: num(el, 'y', DEFAULTS.y),
    duration: num(el, 'duration', DEFAULTS.duration),
    stagger: num(el, 'stagger', DEFAULTS.stagger),
    delay: num(el, 'delay', DEFAULTS.delay),
    ease: el?.getAttribute('data-reveal-ease') || DEFAULTS.ease,
  };
}

// Pre-state used before a reveal (opacity 0, nudged down)
export function setHidden(targets, y = DEFAULTS.y) {
  window.gsap.set(targets, { opacity: 0, y: y * rootPx() });
}

// Fade + rise in, staggered. Inline opacity/transform are cleared afterwards so
// hover styles and the stylesheet take over again.
export function animateIn(targets, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  return window.gsap.fromTo(
    targets,
    { opacity: 0, y: o.y * rootPx() },
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
