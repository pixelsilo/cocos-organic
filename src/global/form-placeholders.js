// Webflow's form inputs can't be given a placeholder through the API, and designers may want
// to set it per field without touching code, so any field can carry data-placeholder="..."
// and it is copied to the real placeholder attribute on load.

export default function formPlaceholders() {
  document.querySelectorAll('[data-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', el.getAttribute('data-placeholder'));
  });
}
