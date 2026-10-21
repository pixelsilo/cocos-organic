// Adds a "scrolled" class to the nav pieces once the page is scrolled past the threshold
const SELECTOR = '.navbar, .nav_button, .nav-link, .menu_lottie, .fs_nav, .navbar_static_background';
const THRESHOLD = 20; // a little slack stops the "flick"

export default function navScrolled() {
  const elements = document.querySelectorAll(SELECTOR);
  if (!elements.length) return;

  let isScrolled = false;

  function toggleScrolledClass() {
    const scrolled = window.scrollY > THRESHOLD;
    if (scrolled === isScrolled) return; // don't spam the DOM
    isScrolled = scrolled;
    elements.forEach((el) => el.classList.toggle('scrolled', scrolled));
  }

  toggleScrolledClass();
  window.addEventListener('scroll', toggleScrolledClass, { passive: true });
}
