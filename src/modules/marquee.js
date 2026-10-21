// Auto-looping logo marquee for a CMS collection list.
//
// Markup (inside the section):
//   [data-module="marquee"]          root
//     [data-marquee-list]            the collection list (flex row, width: max-content)
//       .w-dyn-item                  one logo each, spaced with margin-right
//
// The original items are cloned until one set plus the viewport is covered, then the
// list slides left by exactly one set's width forever (CSS keyframes in the Webflow
// code_css embed read --marquee-shift / --marquee-duration). Clones are aria-hidden.
// With reduced motion the logos just wrap and sit still.

const SPEED = 50; // px per second

export default function marquee(root) {
  const list = root.querySelector('[data-marquee-list]');
  if (!list) return;

  const originals = [...list.children];
  if (!originals.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;

  function build() {
    list.querySelectorAll('[data-marquee-clone]').forEach((el) => el.remove());
    list.classList.remove('is-running', 'is-static');

    if (reduceMotion.matches) {
      list.classList.add('is-static');
      return;
    }

    // One set's width includes each item's trailing margin, so the loop is seamless
    const first = originals[0].getBoundingClientRect().left;
    const set = originals[originals.length - 1].getBoundingClientRect().right
      + parseFloat(getComputedStyle(originals[originals.length - 1]).marginRight) - first;
    if (!set) return;

    const copies = Math.ceil(root.clientWidth / set) + 1;
    for (let i = 0; i < copies; i++) {
      originals.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('data-marquee-clone', '');
        list.appendChild(clone);
      });
    }

    list.style.setProperty('--marquee-shift', `${set}px`);
    list.style.setProperty('--marquee-duration', `${set / SPEED}s`);
    list.classList.add('is-running');
  }

  // Rebuild when the width changes (rem sizes scale with the viewport)
  let timer;
  window.addEventListener('resize', () => {
    if (root.clientWidth === width) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      width = root.clientWidth;
      build();
    }, 200);
  });
  reduceMotion.addEventListener('change', build);

  width = root.clientWidth;
  // Wait for the logos so item widths are known
  // (lazy images off-screen would never report, so load them eagerly, with a timeout as a backstop)
  const imgs = [...list.querySelectorAll('img')];
  imgs.forEach((img) => { img.loading = 'eager'; });
  const loaded = Promise.all(
    imgs.map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })))
  );
  Promise.race([loaded, new Promise((r) => setTimeout(r, 3000))]).then(build);
}
