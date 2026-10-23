// Adds a "scrolled" class to the nav pieces once the page is scrolled past the threshold.
//
// The bar is transparent over the top of the page and solid once it has scrolled (the colours
// live on the .scrolled classes in Webflow). It also counts as scrolled while the full-screen
// mobile menu is open, so the logo and button stay readable on the menu's brown panel. The menu
// is opened by a native Webflow interaction, so its state is read from the panel's position
// instead of tracking clicks.
const SELECTOR = '.navbar, .nav_button, .nav-link, .menu_lottie, .fs_nav, .navbar_static_background';
const THRESHOLD = 20; // a little slack stops the "flick"

export default function navScrolled() {
  const elements = document.querySelectorAll(SELECTOR);
  if (!elements.length) return;

  const panel = document.querySelector('.fs_nav');
  let isScrolled = false;

  const menuOpen = () => !!panel && panel.getBoundingClientRect().left < window.innerWidth / 2;

  function update() {
    const scrolled = window.scrollY > THRESHOLD || menuOpen();
    if (scrolled === isScrolled) return; // don't spam the DOM
    isScrolled = scrolled;
    elements.forEach((el) => el.classList.toggle('scrolled', scrolled));
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  if (panel) new MutationObserver(update).observe(panel, { attributes: true, attributeFilter: ['style'] });
}
