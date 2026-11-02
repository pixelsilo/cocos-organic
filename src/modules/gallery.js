// Click-through gallery on the flavour page: the pack shot first, then the CMS photos.
//
// Markup (the .flavour_stage is the root, so it stays one sticky box):
//   [data-module="gallery"]                root (the stage)
//     .flavour_pot                         the pack shot, slide 1
//     [data-gallery-photo]                 CMS image bound to Gallery 1..5, one slide each
//
// Empty CMS images carry Webflow's .w-dyn-bind-empty (or no src) and are removed, so a
// flavour with no photos gets no controls at all. The arrows, dots, swipe and arrow keys
// are added here; their look is in the code_css embed (.flavour_gallery-*).

const ARROW = (dir) =>
  `<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="${
    dir === 'prev' ? 'M14.25 9H3.75M3.75 9L8.25 4.5M3.75 9L8.25 13.5' : 'M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5'
  }" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SWIPE_PX = 40;

export default function gallery(root) {
  const pot = root.querySelector('.flavour_pot');
  const photos = [...root.querySelectorAll('[data-gallery-photo]')].filter((img) => {
    const ok = !img.classList.contains('w-dyn-bind-empty') && img.getAttribute('src');
    if (!ok) img.remove();
    return ok;
  });
  if (!pot || !photos.length) return;

  const slides = [pot, ...photos];
  let index = 0;

  root.setAttribute('role', 'group');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', 'Product photos');
  root.style.touchAction = 'pan-y';

  const button = (cls, label, html) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-label', label);
    b.innerHTML = html;
    return b;
  };

  const prev = button('flavour_gallery-btn is-prev', 'Previous photo', ARROW('prev'));
  const next = button('flavour_gallery-btn is-next', 'Next photo', ARROW('next'));
  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'flavour_gallery-dots';
  const dots = slides.map((_, i) => {
    const d = button('flavour_gallery-dot', `Show photo ${i + 1} of ${slides.length}`, '');
    d.addEventListener('click', () => show(i));
    dotsWrap.appendChild(d);
    return d;
  });
  root.append(prev, next, dotsWrap);

  function show(i) {
    index = (i + slides.length) % slides.length;
    pot.classList.toggle('is-off', index !== 0);
    photos.forEach((img, k) => {
      const on = k + 1 === index;
      img.classList.toggle('is-active', on);
      img.setAttribute('aria-hidden', String(!on));
    });
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === index)));
  }

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });

  // Swipe: a mostly horizontal drag of at least SWIPE_PX
  let startX = 0;
  let startY = 0;
  root.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
  });
  root.addEventListener('pointerup', (e) => {
    const dx = e.clientX - startX;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - startY) * 1.5) show(index + (dx < 0 ? 1 : -1));
  });

  show(0);
}
