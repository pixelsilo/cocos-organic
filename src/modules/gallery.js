// Click-through gallery on the flavour and recipe pages: the main image first, then the CMS photos.
//
// Markup (the stage is the root; the .gallery_wrap around it is what sticks on desktop, so the
// thumbnails under the stage travel with it):
//   .gallery_wrap
//     [data-module="gallery"]              root (the stage)
//       [data-gallery-main]                the main image, slide 1 (a flavour page's .flavour_pot also works)
//       [data-gallery-photo]               CMS image bound to Gallery 1..5, one slide each
//
// Empty CMS images carry Webflow's .w-dyn-bind-empty (or no src) and are removed, so a page with
// no photos gets no controls at all. The arrows, dots, thumbnail strip, swipe and arrow keys are
// added here; their look is in the code_css embed (.flavour_gallery-*). The thumbnails are the
// accessible way to pick a photo (real buttons in the tab order); the dots are a visual copy.

const ARROW = (dir) =>
  `<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="${
    dir === 'prev' ? 'M14.25 9H3.75M3.75 9L8.25 4.5M3.75 9L8.25 13.5' : 'M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5'
  }" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SWIPE_PX = 40;

// The smallest image Webflow offers for a slide (from its srcset), so a thumbnail is not a full-size download
function thumbSrc(img) {
  const set = (img.getAttribute('srcset') || '')
    .split(',')
    .map((part) => part.trim().split(/\s+/))
    .filter(([url, w]) => url && /^\d+w$/.test(w || ''))
    .map(([url, w]) => ({ url, w: parseInt(w, 10) }))
    .sort((a, b) => a.w - b.w);
  return set.length ? set[0].url : img.currentSrc || img.getAttribute('src');
}

export default function gallery(root) {
  const main = root.querySelector('[data-gallery-main]') || root.querySelector('.flavour_pot');
  const photos = [...root.querySelectorAll('[data-gallery-photo]')].filter((img) => {
    const ok = !img.classList.contains('w-dyn-bind-empty') && img.getAttribute('src');
    if (!ok) img.remove();
    return ok;
  });
  if (!main || !photos.length) return;

  const slides = [main, ...photos];
  const wrap = root.closest('.gallery_wrap') || root.parentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;

  root.setAttribute('role', 'group');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', 'Photos');
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
  dotsWrap.setAttribute('aria-hidden', 'true');
  const dots = slides.map((_, i) => {
    const d = button('flavour_gallery-dot', `Show photo ${i + 1} of ${slides.length}`, '');
    d.tabIndex = -1;
    d.addEventListener('click', () => show(i));
    dotsWrap.appendChild(d);
    return d;
  });
  root.append(prev, next, dotsWrap);

  // Thumbnail strip under the stage, inside the sticky wrapper. The pack shot keeps its whole shape
  const strip = document.createElement('div');
  strip.className = 'flavour_gallery-thumbs';
  const thumbs = slides.map((slide, i) => {
    const t = button('flavour_gallery-thumb', `Show photo ${i + 1} of ${slides.length}`, '');
    if (i === 0 && slide.matches('.flavour_pot')) t.classList.add('is-pack');
    const img = document.createElement('img');
    img.src = thumbSrc(slide);
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    t.appendChild(img);
    t.addEventListener('click', () => show(i));
    strip.appendChild(t);
    return t;
  });
  wrap.appendChild(strip);

  // The photos start transparent and Webflow marks them lazy, so the browser may never fetch
  // them. Once the page has loaded, load them all (about 100KB each) so a click shows one at once
  const preload = () => photos.forEach((img) => (img.loading = 'eager'));
  if (document.readyState === 'complete') setTimeout(preload, 300);
  else window.addEventListener('load', () => setTimeout(preload, 300), { once: true });

  function show(i) {
    index = (i + slides.length) % slides.length;
    if (photos[index - 1]) photos[index - 1].loading = 'eager';
    main.classList.toggle('is-off', index !== 0);
    photos.forEach((img, k) => {
      const on = k + 1 === index;
      img.classList.toggle('is-active', on);
      img.setAttribute('aria-hidden', String(!on));
    });
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === index)));
    thumbs.forEach((t, k) => t.setAttribute('aria-current', String(k === index)));

    // When the strip scrolls (many photos, narrow screen), bring the chosen thumbnail to the middle
    const t = thumbs[index];
    if (strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));

  wrap.addEventListener('keydown', (e) => {
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
