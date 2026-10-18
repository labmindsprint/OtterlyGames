import test from 'node:test';
import assert from 'node:assert/strict';
import { renderGames, validateGames } from './site-games.mjs';

const sample = () => ({
  categories: [{ id: 'learning', label: 'Learning' }],
  games: [{
    id: 'first-game', title: 'First game', url: '/play/first-game.html', categories: ['learning'],
    genre: 'Puzzles', description: 'Try a puzzle.', note: 'Untimed.',
    art: '/images/games/first-game.svg', fit: 'scene', tone: 'purple'
  }]
});
const routes = new Set(['/play/first-game.html', '/play/next-game.html']);

test('rejects ambiguous, unlisted or unsafe game data before rendering', () => {
  for (const mutate of [
    (data) => { delete data.games[0].id; },
    (data) => { data.categories[0].id = undefined; },
    (data) => { data.categories.push(data.categories[0]); },
    (data) => { data.games.push(data.games[0]); },
    (data) => { data.games[0].categories = ['unknown']; },
    (data) => { data.games[0].categories = ['learning', 'learning']; },
    (data) => { data.games[0].url = '/play/not-in-inventory.html'; },
    (data) => { data.games[0].url = 'https://example.com/game'; },
    (data) => { data.games[0].art = '/images/../private.png'; },
    (data) => { data.games[0].art = '/images/game.png#not-an-svg'; },
    (data) => { data.games[0].note = ''; }
  ]) {
    const data = sample();
    mutate(data);
    assert.throws(() => validateGames(data, routes));
  }
});

test('renders static links, safe text and structured data; new categories need no layout changes', () => {
  const data = sample();
  data.categories.push({ id: 'new-category', label: 'New & different' });
  data.games.push({
    ...data.games[0], id: 'next-game', title: 'Next </script> "game"',
    url: '/play/next-game.html', categories: ['new-category'],
    art: '/images/games/worlds.svg#new-game'
  });
  const output = renderGames(validateGames(data, routes), 'https://otterlygames.com');
  assert.equal((output.match(/data-game-card=/g) ?? []).length, 2);
  assert.match(output, /href="\/play\/next-game\.html"/);
  assert.match(output, /data-game-category="new-category"/);
  assert.match(output, /New &amp; different/);
  assert.match(output, /Next &lt;\/script&gt; &quot;game&quot;/);
  assert.match(output, /<use href="\/images\/games\/worlds\.svg#new-game"/);
  assert.equal((output.match(/<\/script>/g) ?? []).length, 1);
  const schema = JSON.parse(/<script[^>]*>([\s\S]*?)<\/script>/.exec(output)[1]);
  assert.equal(schema.numberOfItems, 2);
  assert.equal(schema.itemListElement[1].url, 'https://otterlygames.com/play/next-game.html');
  assert.equal(schema.itemListElement[1].name, data.games[1].title);
  assert.match(output, /data-catalogue-controls hidden/);
});
