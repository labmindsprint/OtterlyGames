import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GEAR_ORDER, SHIELDS, TURRETS, gearById, gearIcon, gearUnlockedBy, projectileSVG, shieldSprite, turretSprite,
} from '../js/space-academy/pitstop/gear.mjs';

const PATTERNS = ['single', 'twin', 'spread3', 'burst3', 'beam', 'homing'];
const EFFECTS = ['bubble', 'reflect', 'absorb', 'nova'];
const SELF_CLOSING = new Set(['path', 'circle', 'rect', 'ellipse', 'polygon', 'polyline', 'line', 'stop']);

const wellFormed = markup => {
  assert.ok(markup.startsWith('<svg ') && markup.endsWith('</svg>'));
  assert.ok(!/&(?!(amp|lt|gt|quot|apos|#\d+);)/.test(markup), 'unescaped ampersand');
  const stack = [];
  for (const [tag, name, , selfClose] of [...markup.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)].map(m => [m[0], m[2], m[1], m[4]])) {
    if (selfClose) continue;
    if (tag.startsWith('</')) assert.equal(stack.pop(), name, `unbalanced </${name}>`);
    else {
      assert.ok(!SELF_CLOSING.has(name), `<${name}> must self-close`);
      stack.push(name);
    }
  }
  assert.deepEqual(stack, [], 'unclosed tags');
};

const svgIds = markup => [...markup.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);

test('6 turrets and 4 shields with valid stats, weakest to strongest', () => {
  assert.equal(TURRETS.length, 6);
  assert.equal(SHIELDS.length, 4);
  for (const turret of TURRETS) {
    assert.equal(turret.kind, 'turret');
    assert.ok(PATTERNS.includes(turret.pattern));
    assert.match(turret.color, /^#[0-9a-f]{6}$/i);
    assert.ok(turret.blurb.length > 0 && turret.blurb.length <= 60);
    assert.ok(turret.damage > 0 && turret.cooldownMs > 0 && turret.speed > 0);
    assert.ok(Number.isInteger(turret.pierce) && turret.pierce >= 0);
    assert.ok(turret.power >= 1 && turret.power <= 5);
  }
  for (const shield of SHIELDS) {
    assert.equal(shield.kind, 'shield');
    assert.ok(EFFECTS.includes(shield.effect));
    assert.match(shield.color, /^#[0-9a-f]{6}$/i);
    assert.ok(shield.blurb.length > 0 && shield.blurb.length <= 60);
    assert.ok(shield.hits > 0 && shield.regenSec > 0);
    assert.ok(shield.power >= 1 && shield.power <= 5);
  }
  for (const list of [TURRETS, SHIELDS]) {
    list.forEach((item, i) => { if (i) assert.ok(item.power >= list[i - 1].power, `${item.id} is not stronger`); });
  }
});

test('GEAR_ORDER interleaves every gear id exactly once', () => {
  const all = [...TURRETS, ...SHIELDS].map(item => item.id);
  assert.equal(new Set(all).size, 10);
  assert.equal(GEAR_ORDER.length, 10);
  assert.deepEqual([...GEAR_ORDER].sort(), [...all].sort());
  assert.equal(GEAR_ORDER[0], TURRETS[0].id);
  assert.equal(GEAR_ORDER[1], SHIELDS[0].id);
  assert.deepEqual(GEAR_ORDER.filter(id => gearById(id).kind === 'turret'), TURRETS.map(item => item.id));
  assert.deepEqual(GEAR_ORDER.filter(id => gearById(id).kind === 'shield'), SHIELDS.map(item => item.id));
});

test('gearById and gearUnlockedBy', () => {
  assert.equal(gearById('nope'), null);
  assert.equal(gearById(TURRETS[2].id), TURRETS[2]);
  assert.deepEqual(gearUnlockedBy(0), []);
  assert.deepEqual(gearUnlockedBy(2).map(item => item.id), GEAR_ORDER.slice(0, 2));
  assert.equal(gearUnlockedBy(99).length, 10);
  assert.equal(gearUnlockedBy(-3).length, 0);
});

test('every gear has distinct well-formed SVG art', () => {
  const seen = new Set();
  const check = (markup, viewBox) => {
    assert.ok(markup.length > 0);
    assert.ok(markup.includes(`viewBox="${viewBox}"`));
    assert.ok(markup.includes('aria-hidden="true"') && markup.includes('focusable="false"'));
    wellFormed(markup);
    assert.ok(!seen.has(markup), 'duplicate art');
    seen.add(markup);
    return markup;
  };
  const ids = [];
  for (const id of GEAR_ORDER) {
    ids.push(...svgIds(check(gearIcon(id), '0 0 64 64')));
    if (gearById(id).kind === 'turret') {
      check(turretSprite(id), '0 0 40 56');
      check(projectileSVG(id), '0 0 24 48');
      assert.equal(shieldSprite(id), '');
    } else {
      ids.push(...svgIds(check(shieldSprite(id), '0 0 200 200')));
      assert.equal(turretSprite(id), '');
    }
  }
  for (const id of ids) assert.ok(GEAR_ORDER.some(gear => id.startsWith(`${gear}-`)), `${id} is not prefixed`);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(gearIcon('nope'), '');
});

test('every class has 10 sky objects, and mock tests only launch (no gear, paint or stickers)', async () => {
  const { CLASSES } = await import('../js/space-academy/pitstop/data.mjs');
  const progress = await import('../js/space-academy/pitstop/progress.mjs');
  for (const info of CLASSES) {
    assert.equal(info.sky.length, 10, `${info.id} needs 10 mocks`);
    let save = progress.blankSave();
    for (const part of info.parts) save = progress.applyPart(save, info.id, part.id, [{ chapter: info.parts[0].chapters[0], correct: true }]);
    for (let mock = 0; mock < 10; mock += 1) {
      save = progress.applyPaperEnd(save, info.id, 20, []);
      assert.equal(progress.launchReady(save, info.id), info.sky[mock]);
      assert.equal(progress.gearOf(save, info.id).length, 0, 'a mock test never awards gear');
      assert.equal(progress.cargoOf(save, info.id).length, 0, 'a mock test never adds schematics');
      assert.equal(progress.classState(save, info.id).printed ?? 0, 0);
      save = progress.applyFlight(save, info.id, info.sky[mock]);
    }
    assert.equal(progress.nextSky(save, info.id), null);
    save = progress.applyPaperEnd(save, info.id, 20, []);
    assert.equal(progress.gearOf(save, info.id).length, 0, 'practice mocks award nothing either');
  }
});

test('loadout keeps 2 turrets and 1 shield and refuses unearned gear', async () => {
  const progress = await import('../js/space-academy/pitstop/progress.mjs');
  let save = progress.blankSave();
  assert.throws(() => progress.applyLoadout(save, 'pp1', 'twin-laser'), RangeError);
  save.classes.pp1 = { ...progress.blankClass(), gear: [...GEAR_ORDER] };
  for (const id of ['pulse-blaster', 'twin-laser', 'scatter-gun', 'bubble-shield', 'mirror-shield']) save = progress.applyLoadout(save, 'pp1', id);
  const load = progress.loadoutOf(save, 'pp1');
  assert.deepEqual(load.turrets.map(item => item.id), ['twin-laser', 'scatter-gun']);
  assert.equal(load.shield.id, 'mirror-shield');
  save = progress.applyLoadout(save, 'pp1', 'mirror-shield');
  assert.equal(progress.loadoutOf(save, 'pp1').shield, null);
});
