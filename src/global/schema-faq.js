// Writes a FAQPage JSON-LD block from the questions visible on the page, so the markup always
// matches the text and follows the FAQ CMS without anyone editing schema by hand.
//
//   [data-schema-faq]   put on the element that holds the FAQ rows (a page can have one)
//
// Each row is a <details>: its <summary> is the question and the element after the summary is
// the answer. Rows with no answer are skipped. Nothing is written when there are no questions.

const SITE = 'https://cocos-organic.com';
const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

export default function schemaFaq() {
  const root = document.querySelector('[data-schema-faq]');
  if (!root) return;

  const seen = new Set();
  const questions = [];
  root.querySelectorAll('details').forEach((row) => {
    const summary = row.querySelector('summary');
    const answer = summary?.nextElementSibling;
    if (!summary || !answer) return;
    const name = text(summary);
    const body = text(answer);
    if (!name || !body || seen.has(name)) return;
    seen.add(name);
    questions.push({
      '@type': 'Question',
      name,
      acceptedAnswer: { '@type': 'Answer', text: body },
    });
  });
  if (!questions.length) return;

  // Always the production address, like every other schema block, even when viewed on staging
  const url = `${SITE}${window.location.pathname}`.replace(/\/$/, '');
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: questions,
  });
  document.head.appendChild(script);
}
