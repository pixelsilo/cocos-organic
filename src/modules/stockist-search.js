// Stockist search box: sends the visitor to the stockists page with their search.
//
// Markup (inside the section):
//   [data-module="stockist-search"]    root
//     [data-stockist-input]            text input (Town or postcode)
//     [data-stockist-submit]           link; its href is the results page, e.g. /stockists
//
// Result: <href>?q=<search>. Enter in the input does the same as clicking the link.
// An empty search just focuses the input instead of navigating.

export default function stockistSearch(root) {
  const input = root.querySelector('[data-stockist-input]');
  const submit = root.querySelector('[data-stockist-submit]');
  if (!input || !submit) return;

  const base = submit.getAttribute('href') || '/stockists';

  function go() {
    const q = input.value.trim();
    if (!q) {
      input.focus();
      return;
    }
    const url = new URL(base, window.location.href);
    url.searchParams.set('q', q);
    window.location.href = url.toString();
  }

  submit.addEventListener('click', (e) => {
    e.preventDefault();
    go();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      go();
    }
  });
}
