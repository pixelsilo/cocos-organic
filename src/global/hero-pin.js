// Keeps the pinned hero flush under the sticky navigation.
//
// The hero sits in a tall runway ([data-hero-runway]) and sticks below the nav, which is
// the nav bar plus the dismissible alert. When the alert is closed (or the nav changes
// height at another breakpoint) the nav gets shorter, so the hero's sticky offset and
// height follow it instead of leaving a gap. Webflow's 134px is the fallback until this runs.

export default function heroPin() {
  const nav = document.querySelector('.navigation');
  const hero = document.querySelector('[data-hero-runway] > *');
  if (!nav || !hero) return;
  // Reduced motion un-pins the hero in CSS, so leave its layout alone
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const apply = () => {
    const offset = Math.round(nav.getBoundingClientRect().height);
    hero.style.top = `${offset}px`;
    hero.style.height = `calc(100vh - ${offset}px)`;
  };

  apply();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(apply).observe(nav);
  window.addEventListener('resize', apply);
}
