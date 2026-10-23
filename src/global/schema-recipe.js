// Completes the Recipe JSON-LD that Webflow writes on the recipe template. Webflow can bind plain
// text and images into schema, but not a list built from a rich text field, so the ingredients,
// method steps and cooking time are read from the page here and merged into the same Recipe node
// (one node, not a second block).
//
//   [data-rich="ingredients"]   <h3> subheads are ignored, every <li> becomes a recipeIngredient
//   [data-rich="method"]        <h3> starts a HowToSection, every <p> is a HowToStep
//   [data-recipe-time]          text like "30 mins" or "1 hour 10 mins" becomes totalTime (ISO 8601)
//   [data-recipe-category]      becomes recipeCategory
//   [data-recipe-flavour]       its text (or attribute value) becomes keywords with "coconut yog recipe"

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

// "1 hour 10 mins" -> "PT1H10M"; anything it cannot read returns ''
function duration(raw) {
  const s = (raw || '').toLowerCase();
  const h = s.match(/(\d+)\s*(?:h|hr|hrs|hour|hours)\b/);
  const m = s.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/);
  if (!h && !m) return '';
  return `PT${h ? `${h[1]}H` : ''}${m ? `${m[1]}M` : ''}`;
}

function steps(method) {
  const sections = [];
  let current = { name: '', steps: [] };
  method.querySelectorAll('h2, h3, h4, p, li').forEach((el) => {
    if (/^H\d$/.test(el.tagName)) {
      if (current.steps.length) sections.push(current);
      current = { name: text(el), steps: [] };
    } else if (text(el)) {
      current.steps.push({ '@type': 'HowToStep', text: text(el) });
    }
  });
  if (current.steps.length) sections.push(current);

  // No subheads: a flat list of steps. Otherwise one HowToSection per subhead
  if (sections.length === 1 && !sections[0].name) return sections[0].steps;
  return sections.map((s) => ({
    '@type': 'HowToSection',
    name: s.name || 'Method',
    itemListElement: s.steps,
  }));
}

export default function schemaRecipe() {
  const block = [...document.querySelectorAll('script[type="application/ld+json"]')].find((s) => /"@type"\s*:\s*"Recipe"/.test(s.textContent));
  if (!block) return;

  let data;
  try {
    data = JSON.parse(block.textContent);
  } catch (err) {
    return;
  }
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
  const recipe = graph.find((n) => n['@type'] === 'Recipe');
  if (!recipe) return;

  const ingredients = document.querySelector('[data-rich="ingredients"]');
  if (ingredients) {
    const list = [...ingredients.querySelectorAll('li')].map(text).filter(Boolean);
    if (list.length) recipe.recipeIngredient = list;
  }

  const method = document.querySelector('[data-rich="method"]');
  if (method) {
    const list = steps(method);
    if (list.length) recipe.recipeInstructions = list;
  }

  const time = duration(document.querySelector('[data-recipe-time]')?.textContent);
  if (time) recipe.totalTime = time;

  const category = document.querySelector('[data-recipe-category]')?.getAttribute('data-recipe-category');
  if (category) recipe.recipeCategory = category;

  // The flavour name is the element's own text unless the attribute carries a value
  const flavourEl = document.querySelector('[data-recipe-flavour]');
  const flavour = flavourEl && (flavourEl.getAttribute('data-recipe-flavour') || text(flavourEl));
  if (flavour) recipe.keywords = `coconut yog recipe, ${flavour}`;

  block.textContent = JSON.stringify(data);
}
