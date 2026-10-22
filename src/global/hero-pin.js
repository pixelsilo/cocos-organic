// Publishes the sticky navigation's height as --nav-h so the pinned hero can sit flush under it.
//
// The hero sits in a tall runway ([data-hero-runway]) and sticks below the nav, which is
// the nav bar plus the dismissible alert. The code_css embed reads the variable
// (top: var(--nav-h, 0px); height: calc(100vh - var(--nav-h, 0px))). When the alert is
// closed, or the nav changes height at another breakpoint, the variable follows it, so there
// is never a gap. Without this script (the Designer canvas) the variable is unset, which
// falls back to 0px, so the hero simply sits directly under the nav.

export default function heroPin() {
  const nav = document.querySelector('.navigation');
  if (!nav) return;

  const root = document.documentElement;
  const apply = () => root.style.setProperty('--nav-h', `${Math.round(nav.getBoundingClientRect().height)}px`);

  apply();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(apply).observe(nav);
  window.addEventListener('resize', apply);
}
