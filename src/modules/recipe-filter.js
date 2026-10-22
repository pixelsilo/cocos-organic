// Recipes listing: filter the CMS recipe grid by category and flavour, and page it with "Load more".
//
// Markup (inside the root):
//   [data-module="recipe-filter"]               root
//     [data-filter="all|Breakfast|..."]         category chip; value matches the CMS Category option name
//     [data-flavour-toggle]                     chip that opens the flavour row
//     [data-flavours]                           flavour row (hidden until the toggle is used)
//       [data-colour-filter="Natural|..."]      flavour chip; value matches the CMS Made with option name
//     .w-dyn-item                               list item wrapping a card with data-category and data-colour
//     [data-load-more]                          reveals the next page of recipes
//
// Selected chips get .is-active and aria-pressed="true", like the stockist chips. Without JS every
// recipe is shown and the chips do nothing.

const PAGE_SIZE = 9;

export default function recipeFilter(root) {
  const cards = [...root.querySelectorAll('[data-category]')];
  if (!cards.length) return;

  const items = cards.map((card) => card.closest('.w-dyn-item') || card);
  const chips = [...root.querySelectorAll('[data-filter]')];
  const colourChips = [...root.querySelectorAll('[data-colour-filter]')];
  const toggle = root.querySelector('[data-flavour-toggle]');
  const flavours = root.querySelector('[data-flavours]');
  const more = root.querySelector('[data-load-more]');

  // The flavour row starts closed. Set here because Webflow does not publish a hidden attribute
  if (flavours) flavours.hidden = true;

  let category = 'all';
  let colour = '';
  let shown = PAGE_SIZE;

  const press = (el, on) => {
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  };

  function render() {
    let matches = 0;
    items.forEach((item, k) => {
      const card = cards[k];
      const ok = (category === 'all' || card.dataset.category === category) && (!colour || card.dataset.colour === colour);
      if (ok) matches += 1;
      item.hidden = !(ok && matches <= shown);
    });

    chips.forEach((chip) => press(chip, chip.dataset.filter === category));
    colourChips.forEach((chip) => press(chip, chip.dataset.colourFilter === colour));
    if (toggle) toggle.classList.toggle('is-active', Boolean(colour) || toggle.getAttribute('aria-expanded') === 'true');
    if (more) more.parentElement.hidden = matches <= shown;
  }

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      category = chip.dataset.filter;
      shown = PAGE_SIZE;
      render();
    })
  );

  colourChips.forEach((chip) =>
    chip.addEventListener('click', () => {
      colour = colour === chip.dataset.colourFilter ? '' : chip.dataset.colourFilter;
      shown = PAGE_SIZE;
      render();
    })
  );

  if (toggle && flavours) {
    toggle.addEventListener('click', () => {
      const open = flavours.hidden;
      flavours.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open && colour) {
        colour = ''; // closing the row clears the flavour filter
        shown = PAGE_SIZE;
      }
      render();
    });
  }

  if (more) {
    more.addEventListener('click', () => {
      shown += PAGE_SIZE;
      render();
    });
  }

  render();
}
