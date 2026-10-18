(() => {
  'use strict';
  for (const catalogue of document.querySelectorAll('[data-game-catalogue]')) {
    const input = catalogue.querySelector('input[type="search"]');
    const buttons = [...catalogue.querySelectorAll('[data-game-category]')];
    const cards = [...catalogue.querySelectorAll('[data-game-card]')];
    const count = catalogue.querySelector('[data-catalogue-count]');
    const empty = catalogue.querySelector('[data-catalogue-empty]');
    let category = 'all';

    function filter() {
      const words = input.value.toLocaleLowerCase('en').trim().split(/\s+/).filter(Boolean);
      let matches = 0;
      for (const card of cards) {
        const text = card.dataset.search.toLocaleLowerCase('en');
        const included = (category === 'all' || card.dataset.categories.split(' ').includes(category)) &&
          words.every((word) => text.includes(word));
        card.hidden = !included;
        if (included) matches++;
      }
      for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.gameCategory === category));
      count.textContent = `${matches} ${matches === 1 ? 'game' : 'games'}${words.length || category !== 'all' ? ' found' : ' to explore'}`;
      empty.hidden = matches !== 0;
    }

    function selectLinkedCollection() {
      const linked = location.hash === '#creative-arcade' ? 'creative-arcade' :
        location.hash === '#learning-games' ? 'learning' : null;
      if (buttons.some((button) => button.dataset.gameCategory === linked)) {
        input.value = '';
        category = linked;
        filter();
      }
    }

    input.addEventListener('input', filter);
    for (const button of buttons) button.addEventListener('click', () => {
      category = button.dataset.gameCategory;
      filter();
    });
    catalogue.querySelector('[data-catalogue-reset]').addEventListener('click', () => {
      input.value = '';
      category = 'all';
      filter();
      input.focus();
    });
    catalogue.querySelector('[data-catalogue-controls]').hidden = false;
    filter();
    selectLinkedCollection();
    window.addEventListener('hashchange', selectLinkedCollection);
  }
})();
