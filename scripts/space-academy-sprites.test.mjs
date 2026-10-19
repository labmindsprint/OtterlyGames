import test from 'node:test';
import assert from 'node:assert/strict';
import { randomContext } from '../js/space-academy/bank-shared.mjs';
import {
  SPRITE_NAMES, balanceScale, balanceScaleHeight, darker, lighter, numberLine, numberLineX,
  scatter, spacePanel, sprite, spriteGrid, spriteName, spriteRow, spriteSpan, tenFrame,
} from '../js/space-academy/sprites.mjs';

// The same markup the bank-3 battery refuses in question pictures.
const UNSAFE = /<script|<image|<foreignObject|<style|<iframe|<animate|<use|<a[\s>]|\shref=|xlink:|javascript:|https?:|\son[a-z]+=|url\(|\sid=/i;
const SPRITE_PLACEMENT = /<g transform="translate\((-?[\d.]+) (-?[\d.]+)\) scale\(/g;
const placements = markup => [...markup.matchAll(SPRITE_PLACEMENT)].map(match => ({ x: Number(match[1]), y: Number(match[2]) }));

test('every sprite is safe, bounded and text-free at every size', () => {
  assert.equal(SPRITE_NAMES.length, new Set(SPRITE_NAMES).size);
  for (const name of SPRITE_NAMES) {
    for (const size of [24, 28, 48, 96]) {
      const markup = sprite(name, 10, 12, size);
      assert.doesNotMatch(markup, /NaN|undefined|Infinity/, `${name} at ${size}`);
      assert.doesNotMatch(markup, UNSAFE, `${name} at ${size}`);
      assert.doesNotMatch(markup, /<text|font-size/, `${name} carries no text`);
      assert.ok(markup.length < 2000, `${name} stays small (${markup.length})`);
    }
    assert.match(sprite(name, 0, 0, 40, { rotate: 20, flip: true }), /rotate\(20 24 24\)/);
    assert.equal(sprite(name, 3, 4, 40), sprite(name, 3, 4, 40), `${name} is deterministic`);
    assert.equal(spriteName(name, 1), spriteName(name, 2).slice(0, -1), `${name} plural adds an s`);
  }
  assert.match(sprite('star', 0, 0, 40, { fill: '#112233' }), /#112233/);
  assert.throws(() => sprite('star', 0, 0, 40, { fill: 'red' }), /#rrggbb/);
  assert.throws(() => sprite('nope', 0, 0, 40), /Unknown space sprite/);
  assert.throws(() => sprite('star', Number.NaN, 0, 40), /Invalid sprite placement/);
  assert.match(lighter('#336699'), /^#[0-9a-f]{6}$/);
  assert.match(darker('#336699'), /^#[0-9a-f]{6}$/);
});

test('rows and grids place sprites on an even grid', () => {
  assert.equal(spriteSpan(4, 36, 6), 4 * 36 + 3 * 6);
  assert.equal(spriteSpan(0, 36), 0);
  const row = placements(spriteRow('star', 4, 10, 20, 36, 6));
  assert.deepEqual(row.map(place => place.x), [10, 52, 94, 136]);
  const grid = placements(spriteGrid('coin', 7, 3, 0, 0, 30, 4));
  assert.equal(grid.length, 7);
  assert.deepEqual(grid.at(-1), { x: 0, y: 68 });
});

test('scatter is deterministic, stays inside its box and never overlaps', () => {
  const layouts = [
    { width: 320, height: 200, size: 40, gap: 6, margin: 6 },
    { width: 440, height: 150, size: 34, gap: 6, margin: 6 },
    { width: 200, height: 200, size: 48, gap: 10, margin: 8 },
  ];
  for (const layout of layouts) {
    const capacity = Math.floor((layout.width - layout.margin * 2) / (layout.size + layout.gap)) * Math.floor((layout.height - layout.margin * 2) / (layout.size + layout.gap));
    for (let seed = 1; seed <= 120; seed++) {
      const count = 1 + seed % capacity;
      const spots = scatter(randomContext(seed), count, layout);
      assert.deepEqual(spots, scatter(randomContext(seed), count, layout), 'same seed, same layout');
      assert.equal(spots.length, count);
      for (const spot of spots) {
        assert.ok(spot.x >= layout.margin && spot.y >= layout.margin, 'inside the margin');
        assert.ok(spot.x + layout.size <= layout.width - layout.margin && spot.y + layout.size <= layout.height - layout.margin, 'inside the far edge');
      }
      for (let a = 0; a < spots.length; a++) {
        for (let b = a + 1; b < spots.length; b++) {
          const apart = Math.max(Math.abs(spots[a].x - spots[b].x), Math.abs(spots[a].y - spots[b].y));
          assert.ok(apart >= layout.size + layout.gap, `objects ${a} and ${b} keep their gap (seed ${seed})`);
        }
      }
    }
    assert.throws(() => scatter(randomContext(1), capacity + 1, layout), /no room/);
  }
});

test('a ten-frame draws exactly the filled cells', () => {
  for (let filled = 0; filled <= 10; filled++) assert.equal(placements(tenFrame(filled, 0, 0)).length, filled);
  assert.equal(placements(tenFrame([0, 2, 9], 0, 0)).length, 3);
  assert.equal(placements(tenFrame(2, 0, 0, { columns: 3, rows: 1 })).length, 2);
  assert.equal((tenFrame(0, 0, 0, { columns: 3, rows: 2 }).match(/<rect/g) ?? []).length, 7, 'six cells and one outline');
});

test('a number line is linear, hides asked-for labels and keeps hops off sprites', () => {
  assert.equal(numberLineX(0, { min: 0, max: 10, x: 30, width: 400 }), 30);
  assert.equal(numberLineX(10, { min: 0, max: 10, x: 30, width: 400 }), 430);
  assert.equal(numberLineX(5, { min: 0, max: 10, x: 30, width: 400 }), 230);
  const labels = markup => [...markup.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map(match => match[1]);
  const plain = numberLine({ min: 0, max: 10, y: 120 });
  assert.deepEqual(labels(plain), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  assert.ok(!labels(numberLine({ min: 0, max: 10, hideLabels: [7] })).includes('7'));
  assert.deepEqual(labels(numberLine({ min: 20, max: 40, labelEvery: 5 })), ['20', '25', '30', '35', '40']);
  assert.doesNotMatch(plain, /NaN|undefined|UNSAFE/);
  assert.throws(() => numberLine({ min: 5, max: 5 }), /max > min/);

  const size = 40;
  const y = 130;
  const onSprite = numberLine({ min: 0, max: 10, y, marks: [{ at: 3, sprite: 'rocket', size }], hops: [{ from: 0, to: 3, label: '+3' }, { from: 3, to: 8 }] });
  const [rocket] = placements(onSprite);
  const hopStarts = [...onSprite.matchAll(/d="M[\d.]+ ([\d.]+)Q[\d.]+ [\d.-]+ [\d.]+ ([\d.]+)"/g)].map(match => ({ from: Number(match[1]), to: Number(match[2]) }));
  assert.equal(hopStarts.length, 2);
  assert.ok(hopStarts[0].to < rocket.y, 'the first hop lands above the rocket');
  assert.ok(hopStarts[1].from < rocket.y, 'the second hop leaves from above the rocket');
  assert.ok(labels(onSprite).includes('+3'));
});

test('a balance scale fits six items per pan clear of the beam and refuses more', () => {
  const sixLeft = [{ sprite: 'moon', count: 6 }];
  const mixedRight = [{ sprite: 'coin', count: 4 }, { weight: 4 }, { unknown: true }];
  for (const tilt of [-1, 0, 1]) {
    const markup = balanceScale({ width: 440, tilt, left: sixLeft, right: mixedRight });
    assert.doesNotMatch(markup, /NaN|undefined/);
    assert.doesNotMatch(markup, UNSAFE);
    const beam = markup.match(/<line x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)" stroke="#293e58" stroke-width="13"/);
    assert.ok(beam, 'the beam is drawn');
    const [, leftX, leftY, rightX, rightY] = beam.map(Number);
    const items = [
      ...placements(markup).map(place => ({ x: place.x + 15, y: place.y })),
      ...[...markup.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="30" height="30"/g)].map(match => ({ x: Number(match[1]) + 15, y: Number(match[2]) })),
    ];
    assert.equal(items.length, 12, 'every item is drawn');
    for (const item of items) {
      const beamY = item.x < 220 ? leftY : rightY;
      assert.ok(item.y > beamY + 8, `an item at ${item.x},${item.y} stays below the beam end (${beamY}) at tilt ${tilt}`);
    }
    assert.ok(leftX < 220 && rightX > 220);
  }
  assert.throws(() => balanceScale({ left: [{ sprite: 'moon', count: 7 }] }), /do not fit/);
  const one = balanceScaleHeight({ left: [{ sprite: 'moon', count: 3 }] });
  const two = balanceScaleHeight({ left: [{ sprite: 'moon', count: 4 }] });
  assert.equal(two - one, 32, 'a second row adds one cell of height');
});

test('a space panel is deterministic and draws the requested stars', () => {
  assert.equal(spacePanel(0, 0, 300, 200, { stars: 12 }), spacePanel(0, 0, 300, 200, { stars: 12 }));
  assert.notEqual(spacePanel(0, 0, 300, 200, { seed: 1 }), spacePanel(0, 0, 300, 200, { seed: 2 }));
  const stars = spacePanel(0, 0, 300, 200, { stars: 12 });
  assert.equal((stars.match(/<circle|<path/g) ?? []).length, 12);
  assert.doesNotMatch(stars, UNSAFE);
});
