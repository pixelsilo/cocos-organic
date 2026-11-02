// Publishes the sticky navigation's height as --nav-h so the pinned hero can sit flush under it.
//
// The hero sits in a tall runway ([data-hero-runway]) and sticks below the nav, which is
// the nav bar plus the dismissible alert. The code_css embed reads the variable
// (top: var(--nav-h, 0px); height: calc(100vh - var(--nav-h, 0px))). When the alert is
// closed, or the nav changes height at another breakpoint, the variable follows it, so there
// is never a gap. Without this script (the Designer canvas) the variable is unset, which
// falls back to 0px, so the hero simply sits directly under the nav.
//
// --nav-bottom is the other measure: where the nav bar visibly ends on screen (the alert
// strip plus the bar under it, which sits outside .navigation's own box). Things that stick
// below the nav, like the flavour page image, use it so their top edge meets the bottom of
// the bar instead of hiding behind it. It follows the bar as it shrinks on scroll.

export default function heroPin() {
  const nav = document.querySelector('.navigation');
  if (!nav) return;

  const root = document.documentElement;
  const bar = document.querySelector('.navbar');
  const apply = () => root.style.setProperty('--nav-h', `${Math.round(nav.getBoundingClientRect().height)}px`);
  const applyBottom = () => {
    const bottoms = [nav, bar].map((el) => (el ? el.getBoundingClientRect().bottom : 0));
    root.style.setProperty('--nav-bottom', `${Math.round(Math.max(...bottoms, 0))}px`);
  };
  const both = () => {
    apply();
    applyBottom();
  };

  both();
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(both);
    ro.observe(nav);
    if (bar) ro.observe(bar);
  }
  window.addEventListener('resize', both);
  window.addEventListener('scroll', applyBottom, { passive: true });
}
