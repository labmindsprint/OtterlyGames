(() => {
  'use strict';
  const grid = document.querySelector('.play-hub-page .catalogue-grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('[data-game-card]')];
  const isArcade = (card) => card.dataset.categories.split(' ').includes('creative-arcade');
  const groups = [
    {
      id: 'learning', cards: cards.filter((card) => !isArcade(card)),
      eyebrow: 'Learning adventures', title: 'Practise by playing',
      text: 'Full browser games with lessons, practice and local saves. Start with Clock Master or Math Tank.'
    },
    {
      id: 'fun', cards: cards.filter(isArcade),
      eyebrow: 'Just for fun', title: 'Creative Arcade',
      text: 'Kid-imagined arcade games, separate from the learning games. Each game page lists controls and content notes.'
    }
  ];

  for (const group of groups) {
    if (!group.cards.length) continue;
    const head = document.createElement('div');
    head.className = `hub-group-head hub-group-head--${group.id}`;
    for (const [tag, className, text] of [['p', 'hub-eyebrow', group.eyebrow], ['h2', '', group.title], ['p', '', group.text]]) {
      const el = document.createElement(tag);
      if (className) el.className = className;
      el.textContent = text;
      head.append(el);
    }
    grid.insertBefore(head, group.cards[0]);
    group.head = head;
  }

  // The catalogue filter toggles card.hidden; hide a heading when its whole group is filtered out.
  function syncHeadings() {
    for (const group of groups) {
      if (!group.head) continue;
      const hide = group.cards.every((card) => card.hidden);
      if (group.head.hidden !== hide) group.head.hidden = hide;
    }
  }
  new MutationObserver(syncHeadings).observe(grid, { attributes: true, attributeFilter: ['hidden'], subtree: true });
  syncHeadings();
})();
