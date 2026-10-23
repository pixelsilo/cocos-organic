import copyrightYear from './global/copyright-year.js';
import navScrolled from './global/nav-scrolled.js';
import formPlaceholders from './global/form-placeholders.js';
import heroPin from './global/hero-pin.js';
import opticalFields from './global/optical-fields.js';
import hideEmpty from './global/hide-empty.js';
import schemaClean from './global/schema-clean.js';
import schemaRecipe from './global/schema-recipe.js';
import schemaPost from './global/schema-post.js';
import schemaFaq from './global/schema-faq.js';
import schemaList from './global/schema-list.js';
import heroReveal from './global/hero-reveal.js';
import accordion from './modules/accordion.js';
import alertBar from './modules/alert.js';
import range from './modules/range.js';
import marquee from './modules/marquee.js';
import stockistSearch from './modules/stockist-search.js';
import stockistMap from './modules/stockist-map.js';
import recipeFilter from './modules/recipe-filter.js';
import faqSearch from './modules/faq-search.js';
import newsletter from './modules/newsletter.js';

// Site-wide behaviour that runs on every page
const GLOBALS = [copyrightYear, navScrolled, formPlaceholders, heroPin, opticalFields, hideEmpty, schemaClean, schemaRecipe, schemaPost, schemaFaq, schemaList, heroReveal];

// Opt-in modules, mounted on [data-module="<name>"] roots
const MODULES = { accordion, alert: alertBar, range, marquee, 'stockist-search': stockistSearch, 'stockist-map': stockistMap, 'recipe-filter': recipeFilter, 'faq-search': faqSearch, newsletter };

function boot() {
  GLOBALS.forEach((init) => {
    try {
      init();
    } catch (err) {
      console.error('[cocos] global failed:', err);
    }
  });

  document.querySelectorAll('[data-module]').forEach((root) => {
    if (root.hasAttribute('data-ready')) return; // guard double init
    const init = MODULES[root.getAttribute('data-module')];
    if (!init) return;
    try {
      init(root);
      root.setAttribute('data-ready', '');
    } catch (err) {
      console.error('[cocos] module failed:', root.getAttribute('data-module'), err);
    }
  });
}

// Injected scripts load async, so wait for Webflow's own JS and the DOM
window.Webflow ||= [];
window.Webflow.push(() => {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
});
