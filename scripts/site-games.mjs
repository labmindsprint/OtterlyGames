const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const slug = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const artPath = /^\/(?:images|games\/clockmaster\/art)(?:\/[a-zA-Z0-9_-]+)+\.(?:webp|png|svg)(?:#[a-z][a-z0-9-]*)?$/;

export function validateGames(registry, routes) {
  if (!Array.isArray(registry?.categories) || !Array.isArray(registry.games) || !registry.games.length) {
    throw new Error('Game registry needs categories and a nonempty games array');
  }
  const categories = new Set();
  for (const category of registry.categories) {
    if (!category || typeof category.id !== 'string' || !slug.test(category.id) || category.id === 'all' || categories.has(category.id) ||
        typeof category.label !== 'string' || !category.label.trim()) {
      throw new Error('Game categories need unique slug IDs and nonempty labels');
    }
    categories.add(category.id);
  }
  const ids = new Set();
  const urls = new Set();
  for (const game of registry.games) {
    if (!game || typeof game.id !== 'string' || !slug.test(game.id) || ids.has(game.id) || urls.has(game.url)) {
      throw new Error('Games need unique slug IDs and unique URLs');
    }
    if (!['title', 'genre', 'description', 'note'].every((key) => typeof game[key] === 'string' && game[key].trim()) ||
        !Array.isArray(game.categories) || !game.categories.length ||
        new Set(game.categories).size !== game.categories.length || game.categories.some((id) => !categories.has(id))) {
      throw new Error(`${game.id}: Games need descriptive text, content notes and known, unique categories`);
    }
    if (!/^\/play\/[a-z0-9-]+\.html$/.test(game.url) || !routes.has(game.url)) {
      throw new Error(`${game.id}: Game landing URL must be in the public inventory`);
    }
    if (!artPath.test(game.art) || (game.art.includes('#') && !game.art.includes('.svg#')) ||
        !['icon', 'wide', 'scene'].includes(game.fit) || !['purple', 'pink', 'blue', 'green', 'amber'].includes(game.tone)) {
      throw new Error(`${game.id}: Use local game art, a known fit and a brand colour`);
    }
    ids.add(game.id);
    urls.add(game.url);
  }
  return registry;
}

export function renderGames(registry, origin) {
  const categories = new Map(registry.categories.map((category) => [category.id, category.label]));
  const buttons = [{ id: 'all', label: 'All games' }, ...registry.categories].map(({ id, label }) =>
    `<button type="button" data-game-category="${escape(id)}" aria-pressed="${id === 'all'}">${escape(label)}</button>`).join('\n        ');
  const cards = registry.games.map((game) => {
    const search = [game.title, game.genre, game.description, game.note, ...game.categories.map((id) => categories.get(id))].join(' ');
    const art = game.art.includes('#')
      ? `<svg viewBox="0 0 800 500" aria-hidden="true" focusable="false"><use href="${escape(game.art)}"/></svg>`
      : `<img src="${escape(game.art)}" alt="" width="640" height="400" loading="lazy" decoding="async">`;
    return `<a class="catalogue-card" href="${escape(game.url)}" data-game-card="${escape(game.id)}" data-categories="${game.categories.join(' ')}" data-search="${escape(search)}" aria-label="Play ${escape(game.title)}" aria-describedby="game-note-${game.id}">
        <div class="catalogue-art" data-tone="${game.tone}" data-art-fit="${game.fit}">${art}<span class="catalogue-art-badge">Free to play</span></div>
        <div class="catalogue-card-body">
          <p class="catalogue-genre">${escape(game.genre)}</p>
          <h3>${escape(game.title)}</h3>
          <p class="catalogue-description">${escape(game.description)}</p>
          <p class="catalogue-note" id="game-note-${game.id}">${escape(game.note)}</p>
          <span class="catalogue-play">Play now <span aria-hidden="true">&nearr;</span></span>
        </div>
      </a>`;
  }).join('\n      ');
  const schema = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: 'Otterly browser games',
    numberOfItems: registry.games.length,
    itemListElement: registry.games.map((game, index) => ({
      '@type': 'ListItem', position: index + 1, name: game.title, url: origin + game.url
    }))
  };
  return `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>
    <div class="game-catalogue" data-game-catalogue>
      <div class="catalogue-controls" data-catalogue-controls hidden>
        <div class="catalogue-search" role="search">
          <label class="sr-only" for="game-search">Search games</label>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
          <input id="game-search" type="search" placeholder="Find your next favourite..." autocomplete="off" maxlength="120">
        </div>
        <div class="catalogue-categories" role="group" aria-label="Game categories">
        ${buttons}
        </div>
      </div>
      <p class="catalogue-count" data-catalogue-count role="status" aria-live="polite" aria-atomic="true">${registry.games.length} games to explore</p>
      <div class="catalogue-grid">
      ${cards}
      </div>
      <div class="catalogue-empty" data-catalogue-empty hidden>
        <h3>No games found. A fresh start?</h3>
        <p>Try another word or browse the whole collection.</p>
        <button type="button" data-catalogue-reset>Show all games</button>
      </div>
      <noscript><p class="catalogue-count">All games are listed above. JavaScript is needed to play.</p></noscript>
    </div>`;
}
