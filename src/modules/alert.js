// Dismissible alert bar.
//
// Markup (inside the navigation component):
//   .alert[data-module="alert"]              root; optional data-alert-version="2" to force a re-show
//     button[data-alert-close]               close button
//     ...alert-content...
//
// The bar is hidden by CSS (.alert { display: none }) and revealed with .is-visible.
// A dismissal is remembered for DAYS against a signature, so changing the message
// (or bumping data-alert-version) shows the bar again.

const STORAGE_KEY = 'cocos-alert-dismissed';
const DAYS = 180;

function readDismissed() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && stored.expires > Date.now()) return stored.signature;
  } catch (err) {
    // storage blocked or corrupt: treat as not dismissed
  }
  return null;
}

function writeDismissed(signature) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ signature, expires: Date.now() + DAYS * 24 * 60 * 60 * 1000 })
    );
  } catch (err) {
    // storage blocked: the bar just comes back next page
  }
}

// Small stable hash so the stored value stays short whatever the message length
function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function getSignature(root) {
  if (root.dataset.alertVersion) return `v:${root.dataset.alertVersion}`;
  const clone = root.cloneNode(true);
  clone.querySelectorAll('[data-alert-close]').forEach((el) => el.remove());
  return `t:${hash(clone.textContent.replace(/\s+/g, ' ').trim())}`;
}

function setVisible(root, visible) {
  root.classList.toggle('is-visible', visible);
  root.setAttribute('aria-hidden', String(!visible));
}

export default function alertBar(root) {
  const closeBtn = root.querySelector('[data-alert-close]');
  if (!closeBtn) return;

  const signature = getSignature(root);

  // Explicit both ways, so markup that ships with .is-visible (e.g. in the Designer) is still hidden when dismissed
  setVisible(root, readDismissed() !== signature);

  closeBtn.addEventListener('click', () => {
    setVisible(root, false);
    writeDismissed(signature);
  });
}
