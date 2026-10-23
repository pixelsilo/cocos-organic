// Starts the Home hero's load reveal (CSS keyframes in the page's reveal embed) at the right moment.
//
// The scroll storyboard (native interactions) reads each piece's starting opacity and transform
// when it sets itself up. If the reveal's keyframes were already running then, it would record
// their from-state (opacity 0, shifted) as the piece's natural state and the hero would be
// broken at rest. So the reveal waits for that setup: the interaction engine marks every piece
// it drives with an inline `translate: none`, which is the cue to start.
//
// Flags on <html>:
//   hero-pending  set by a tiny inline script in the Home page head; holds the pieces hidden
//                 (visibility, which the storyboard does not read) until the reveal starts, and
//                 is removed by that script after a few seconds as a failsafe
//   hero-go       set here; the CSS plays the reveal only under this class

const GIVE_UP_MS = 3000;

export default function heroReveal() {
  const root = document.documentElement;
  if (!root.classList.contains('hero-pending')) return; // not the Home page

  const probe = document.querySelector('.hero.is-pinned .hero_content > .hero_lead');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!probe || reduced) {
    root.classList.remove('hero-pending');
    return;
  }

  const start = performance.now();
  const go = () => {
    root.classList.add('hero-go');
    root.classList.remove('hero-pending');
  };
  const check = () => {
    const ready = /translate: none/.test(probe.getAttribute('style') || '');
    if (ready || performance.now() - start > GIVE_UP_MS) go();
    else requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}
