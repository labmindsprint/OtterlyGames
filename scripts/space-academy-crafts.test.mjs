import test from 'node:test';
import assert from 'node:assert/strict';
import { CRAFTS, craftFor, renderCraft, renderCraftPart } from '../js/space-academy/campaign-crafts.mjs';
import { PAINTS } from '../js/space-academy/destinations.mjs';

const GRADES = ['pp1', 'pp2', 'class-1', 'class-2', 'class-3', 'class-4', 'class-5'];
const IDS = ['engine', 'body', 'cockpit', 'nose', 'left-fin', 'right-fin'];

function modules(svg) {
  const stack = [];
  const found = [];
  for (const match of svg.matchAll(/<\/?g\b[^>]*>/g)) {
    if (!match[0].startsWith('</')) {
      const id = match[0].match(/\bdata-craft-part="([^"]+)"/)?.[1];
      stack.push({ id, start: match.index, inner: match.index + match[0].length, opening: match[0] });
    } else {
      const node = stack.pop();
      assert.ok(node, 'SVG groups must be balanced');
      if (node.id) found.push({
        id: node.id, className: node.opening.match(/\bclass="([^"]+)"/)?.[1],
        art: svg.slice(node.inner, match.index),
        markup: svg.slice(node.start, match.index + match[0].length),
      });
    }
  }
  assert.equal(stack.length, 0, 'SVG groups must be closed');
  return found;
}

function viewBox(svg) {
  const values = svg.match(/\bviewBox="([^"]+)"/)?.[1].split(' ').map(Number);
  assert.equal(values?.length, 4);
  assert.ok(values.every(Number.isFinite));
  assert.ok(values[2] > 0 && values[3] > 0);
  return values;
}

function geometry(art) {
  return [...art.matchAll(/<(?:path|rect|circle|ellipse|line|g)\b[^>]*>/g)]
    .map(([tag]) => tag.replace(/\s(?:fill|stroke(?:-[\w-]+)?|class|data-[\w-]+)="[^"]*"/g, ''))
    .join('');
}

function safeSVG(svg) {
  assert.match(svg, /^<svg\b[^>]*class="sa-craft(?:-part)?(?:[ "])/);
  assert.match(svg, /\bxmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(svg, /\brole="img"/);
  assert.match(svg, /\baria-label="[^"]+"/);
  assert.match(svg, /<title>[^<]+<\/title><desc>[^<]+<\/desc>/);
  assert.ok(svg.endsWith('</svg>'));
  assert.doesNotMatch(svg, /(?:NaN|Infinity|undefined|\[object Object\])/);
  // The only paint server a craft may reference is one of its own sa-g- gradients (see scopedGradients).
  assert.doesNotMatch(svg.replace(/url\(#sa-g-[a-z\d-]+\)/g, ''),
    /<(?:image|script|style|animate\w*|foreignObject|filter|mask|clipPath|pattern)\b|\b(?:href|on\w+)=|url\(/i);
}

function scopedGradients(svg, grade, paint, flying) {
  const everyId = [];
  for (const item of modules(svg)) {
    const defined = [...item.art.matchAll(/<(?:linear|radial)Gradient\b[^>]*?\sid="([^"]+)"/g)].map(match => match[1]);
    const referenced = [...item.art.matchAll(/url\(#([^)]*)\)/g)].map(match => match[1]);
    const prefix = `sa-g-${grade}-${item.id}-${paint}-${flying ? 'f' : 'w'}-`;
    assert.equal(new Set(defined).size, defined.length, `${grade}/${item.id}: every gradient id is defined exactly once`);
    for (const id of referenced) {
      assert.ok(defined.includes(id), `${grade}/${item.id}: ${id} is referenced but not defined inside the same module`);
    }
    for (const id of defined) assert.match(id, new RegExp(`^${prefix}\\d+$`), `${grade}/${item.id}: deterministic scoped id`);
    if (item.className.includes('is-blueprint')) {
      assert.deepEqual([defined, referenced, /<defs\b/.test(item.art)], [[], [], false],
        `${grade}/${item.id}: blueprint art stays silhouette-only`);
    }
    everyId.push(...defined);
  }
  assert.equal(new Set(everyId).size, everyId.length, `${grade}: gradient ids are unique across the whole craft`);
}

test('grade-specific slots preserve save IDs and fit centred child controls on a 280px board', () => {
  assert.deepEqual(Object.keys(CRAFTS), GRADES);
  assert.ok(Object.isFrozen(CRAFTS));
  for (const grade of GRADES) {
    const craft = craftFor(grade);
    assert.equal(craft, CRAFTS[grade]);
    assert.ok(Object.isFrozen(craft) && Object.isFrozen(craft.parts));
    assert.deepEqual(craft.parts.map(item => item.id), IDS);
    const height = 280 * craft.height / craft.width;
    const centres = craft.parts.map(item => {
      assert.ok(Object.isFrozen(item));
      assert.ok(Number.isFinite(item.x) && Number.isFinite(item.y));
      assert.ok(item.x > 0 && item.x < 100 && item.y > 0 && item.y < 100);
      const x = item.x / 100 * 280;
      const y = item.y / 100 * height;
      assert.ok(x - 43 >= 4 && x + 43 <= 276, `${grade}/${item.id}: horizontal target margin`);
      assert.ok(y - 24 >= 4 && y + 24 <= height - 4, `${grade}/${item.id}: vertical target margin`);
      const [bx, by, bw, bh] = viewBox(renderCraftPart(grade, item.id));
      const sx = item.x / 100 * craft.width;
      const sy = item.y / 100 * craft.height;
      assert.ok(sx > bx && sx < bx + bw && sy > by && sy < by + bh,
        `${grade}/${item.id}: the slot must lie within its actual module's tray crop`);
      return { id: item.id, x, y };
    });
    for (let a = 0; a < centres.length; a++) {
      for (let b = a + 1; b < centres.length; b++) {
        assert.ok(Math.abs(centres[a].x - centres[b].x) >= 90
          || Math.abs(centres[a].y - centres[b].y) >= 52,
        `${grade}: 86 × 48 controls for ${centres[a].id}/${centres[b].id} need a 4px gap`);
      }
    }
  }
  assert.throws(() => { CRAFTS.pp1.parts[0].x = 0; }, TypeError);
});

test('every six-part subset and supported paint honestly renders workshop and flight states', () => {
  for (const grade of GRADES) {
    const craft = craftFor(grade);
    for (const paint of PAINTS) {
      for (let mask = 0; mask < 64; mask++) {
        const fitted = IDS.filter((_, index) => mask & (1 << index));
        const savedInput = [...fitted];
        const workshop = renderCraft(grade, fitted, paint.id);
        const flight = renderCraft(grade, fitted, paint.id, true);
        safeSVG(workshop);
        safeSVG(flight);
        scopedGradients(workshop, grade, paint.id, false);
        scopedGradients(flight, grade, paint.id, true);
        assert.deepEqual(viewBox(workshop), [0, 0, craft.width, craft.height]);
        assert.deepEqual(viewBox(flight), [0, 0, craft.width, craft.height]);
        assert.deepEqual(fitted, savedInput, 'rendering must not mutate the saved fitted array');
        assert.equal(renderCraft(grade, [...fitted].reverse(), paint.id), workshop);
        const workshopModules = modules(workshop);
        const flightModules = modules(flight);
        assert.equal(workshopModules.length, 6);
        assert.deepEqual(workshopModules.filter(item => item.className.includes('is-fitted'))
          .map(item => item.id).sort(), [...fitted].sort());
        assert.deepEqual(workshopModules.filter(item => item.className.includes('is-blueprint'))
          .map(item => item.id).sort(), IDS.filter(id => !fitted.includes(id)).sort());
        assert.deepEqual(flightModules.map(item => item.id).sort(), [...fitted].sort());
        assert.doesNotMatch(flight, /is-blueprint/);
        assert.match(flight, new RegExp(`${fitted.length} of 6 modules fitted`));
        for (const item of workshopModules) {
          assert.match(item.art, /<(?:path|rect|circle|ellipse|line)\b/,
            `${grade}/${item.id} has drawn geometry rather than a label or empty group`);
          if (item.className.includes('is-blueprint')) {
            assert.match(item.art, /stroke-dasharray=/);
            assert.doesNotMatch(item.art, /fill="(?!none)[^"]+"|data-feature="exhaust"/);
          } else {
            assert.match(item.art, /fill="#[\da-f]{6}"/i);
            assert.doesNotMatch(item.art, /stroke-dasharray=/);
          }
        }
        if (mask === 63) {
          assert.ok(workshop.includes(paint.color));
          assert.doesNotMatch(workshop, /is-blueprint/);
        }
        if (!mask) assert.equal(flightModules.length, 0);
      }
    }
  }
});

test('seven forms and corresponding modules differ in geometry, not just paint or labels', () => {
  const craftGeometry = GRADES.map(grade => geometry(renderCraft(grade, IDS)));
  assert.equal(new Set(craftGeometry).size, 7);
  for (const id of IDS) {
    const partGeometry = GRADES.map(grade => geometry(modules(renderCraftPart(grade, id))[0].art));
    assert.equal(new Set(partGeometry).size, 7, `${id} must not be a generic reused rocket part`);
  }
  const rover = renderCraft('class-1', IDS);
  assert.equal([...rover.matchAll(/data-feature="wheel"/g)].length, 6);
  assert.match(rover, /data-feature="stereo-camera"/);
  assert.match(rover, /data-feature="cargo-chassis"/);
  assert.equal([...renderCraft('class-2', IDS).matchAll(/data-feature="solar-array"/g)].length, 2);
  assert.match(renderCraft('class-2', IDS), /data-feature="radio-dish"/);
  assert.match(renderCraft('class-3', IDS), /data-feature="star-navigation-array"/);
  const station = renderCraft('class-4', IDS);
  assert.match(station, /data-feature="habitat-ring"/);
  assert.match(station, /data-feature="survey-telescope"/);
  assert.equal([...station.matchAll(/data-feature="solar-array"/g)].length, 4);
  const flagship = renderCraft('class-5', IDS);
  assert.match(flagship, /data-feature="command-bridge"/);
  assert.match(flagship, /data-feature="science-pod"/);
  assert.match(flagship, /data-feature="habitat-pod"/);
});

test('starter flights use a real rover carrier and a progressively fitted station transfer configuration', () => {
  const starter = IDS.slice(0, 3);
  const rover = renderCraft('class-1', starter, 'mint', true);
  assert.match(rover, /data-configuration="orbital-carrier"/);
  assert.match(rover, /Carrier thrusters provide space propulsion/);
  assert.match(rover, /data-feature="orbital-carrier"/);
  assert.match(rover, /data-feature="carrier-thrusters"/);
  assert.match(rover, /data-feature="carried-rover"/);
  assert.doesNotMatch(rover, /data-feature="wheel"|data-feature="stereo-camera"/);
  const carriedWheels = modules(renderCraft('class-1', IDS, 'mint', true))
    .filter(item => item.id.endsWith('-fin'));
  for (const item of carriedWheels) {
    assert.match(item.art, /transform="translate\(63 22\) scale\(\.7\)"/);
    assert.doesNotMatch(item.art, /data-feature="exhaust"/);
  }
  assert.doesNotMatch(renderCraft('class-1', ['body', 'cockpit'], 'mint', true), /carrier-thrusters|exhaust/);
  const station = renderCraft('class-4', starter, 'violet', true);
  assert.doesNotMatch(station, /solar-array|folded-power-wing|survey-telescope/);
  const oneWing = renderCraft('class-4', [...starter, 'left-fin'], 'violet', true);
  assert.equal([...oneWing.matchAll(/data-feature="folded-power-wing"/g)].length, 1);
  assert.equal([...oneWing.matchAll(/data-feature="solar-array"/g)].length, 2);
  assert.doesNotMatch(oneWing, /data-craft-part="right-fin"/);
});

test('tray thumbnails isolate the corresponding fitted module with a useful deterministic crop', () => {
  for (const grade of GRADES) {
    const craft = craftFor(grade);
    for (const paint of PAINTS) {
      const assembled = modules(renderCraft(grade, IDS, paint.id));
      for (const id of IDS) {
        const thumbnail = renderCraftPart(grade, id, paint.id);
        safeSVG(thumbnail);
        scopedGradients(thumbnail, grade, paint.id, false);
        assert.match(thumbnail, /\bclass="sa-craft-part"/);
        const pieces = modules(thumbnail);
        assert.equal(pieces.length, 1);
        assert.equal(pieces[0].id, id);
        assert.equal(pieces[0].art, assembled.find(item => item.id === id).art);
        const [, , width, height] = viewBox(thumbnail);
        assert.ok(width * height < craft.width * craft.height * .3, 'crop cannot be the whole craft');
        assert.ok(Math.max(width, height) / Math.min(width, height) < 3, 'no unreadable thin tray slivers');
        assert.equal(thumbnail, renderCraftPart(grade, id, paint.id));
        assert.doesNotMatch(thumbnail, /is-blueprint|data-feature="exhaust"/);
      }
    }
  }
  assert.match(renderCraftPart('class-4', 'cockpit'), /Lab &amp; control hub/);
  assert.doesNotMatch(renderCraftPart('class-4', 'cockpit'), /Lab & control hub/);
});

test('unknown grade, part, paint, duplicate fitted IDs and malformed arguments fail explicitly', () => {
  for (const grade of ['class-6', '', '__proto__', 'constructor', 0, null, undefined]) {
    assert.throws(() => craftFor(grade), /Unknown craft grade/);
    assert.throws(() => renderCraft(grade), /Unknown craft grade/);
    assert.throws(() => renderCraftPart(grade, 'engine'), /Unknown craft grade/);
  }
  for (const id of ['wheel', '', '__proto__', 1, null, undefined]) {
    assert.throws(() => renderCraftPart('pp1', id), /Unknown craft part/);
    assert.throws(() => renderCraft('pp1', [id]), /Unknown fitted craft part/);
  }
  for (const paint of ['blue', '', '__proto__', null, 1, {}]) {
    assert.throws(() => renderCraft('pp1', [], paint), /Unknown craft paint/);
    assert.throws(() => renderCraftPart('pp1', 'body', paint), /Unknown craft paint/);
  }
  for (const fitted of [null, 'engine', {}, new Set(['engine'])]) {
    assert.throws(() => renderCraft('pp1', fitted), /must be an array/);
  }
  for (const id of IDS) assert.throws(() => renderCraft('pp1', [id, id]), /Duplicate fitted craft part/);
  for (const flying of [null, 0, 'true', {}]) {
    assert.throws(() => renderCraft('pp1', [], 'coral', flying), /flying flag must be a boolean/);
  }
});

test('shaded art is byte-deterministic, independent of context, and inside the size budgets', () => {
  const kb = text => Buffer.byteLength(text) / 1024;
  for (const grade of GRADES) {
    for (const paint of PAINTS) {
      const full = renderCraft(grade, IDS, paint.id);
      const flight = renderCraft(grade, IDS, paint.id, true);
      assert.equal(renderCraft(grade, IDS, paint.id), full);
      assert.equal(renderCraft(grade, [...IDS].reverse(), paint.id), full);
      assert.equal(renderCraft(grade, IDS, paint.id, true), flight);
      assert.ok(kb(full) <= 36, `${grade}/${paint.id}: fitted craft is ${kb(full).toFixed(1)} KB (budget 36)`);
      assert.ok(kb(flight) <= 40, `${grade}/${paint.id}: flight craft is ${kb(flight).toFixed(1)} KB (budget 40)`);
      for (const id of IDS) {
        const part = renderCraftPart(grade, id, paint.id);
        assert.equal(renderCraftPart(grade, id, paint.id), part);
        assert.ok(kb(part) <= 9, `${grade}/${paint.id}/${id}: tray part is ${kb(part).toFixed(1)} KB (budget 9)`);
      }
    }
  }
});
