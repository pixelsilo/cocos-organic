// Splits an element's text into word (or letter) spans so each can be animated.
// Webflow doesn't ship GSAP's SplitText, so this is a small stand-in that keeps what
// headings here rely on: whitespace and line breaks (white-space: pre-line titles),
// inline children (<span>, <br>) and normal wrapping at every width.
//
//   splitText(el, 'words')  -> every word wrapped in <span data-split-word>
//   splitText(el, 'chars')  -> and every letter inside it in <span data-split-char>
//
// Returns the spans to animate. Accessibility: the element gets an aria-label with the
// original text and the spans are aria-hidden, so screen readers read the heading once,
// whole. (No hidden duplicate text node, which would double up on copy and find-in-page.)
// Intended for headings, where aria-label is announced.

const unit = (attr, text) => {
  const span = document.createElement('span');
  span.setAttribute(attr, '');
  span.setAttribute('aria-hidden', 'true');
  span.style.display = 'inline-block'; // transforms need a box; words never contain spaces
  span.textContent = text;
  return span;
};

export function splitText(el, mode = 'words') {
  if (el.hasAttribute('data-split-done')) {
    return [...el.querySelectorAll(mode === 'chars' ? '[data-split-char]' : '[data-split-word]')];
  }
  const original = el.textContent.replace(/\s+/g, ' ').trim();
  const words = [];

  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 1) {
        if (!child.hasAttribute('data-split-word')) walk(child); // inline children keep their styling
        return;
      }
      if (child.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      child.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.append(part); // spaces and newlines stay as plain text so wrapping is untouched
          return;
        }
        const word = unit('data-split-word', part);
        if (mode === 'chars') {
          word.textContent = '';
          [...part].forEach((ch) => word.append(unit('data-split-char', ch)));
        }
        words.push(word);
        frag.append(word);
      });
      child.replaceWith(frag);
    });
  };
  walk(el);

  if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', original);
  el.setAttribute('data-split-done', '');

  return mode === 'chars' ? [...el.querySelectorAll('[data-split-char]')] : words;
}
