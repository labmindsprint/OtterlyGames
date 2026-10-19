import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as kit from '../js/space-academy/craft-shading.mjs';

const SOURCE = readFileSync(new URL('../js/space-academy/craft-shading.mjs', import.meta.url), 'utf8');

const make = ({ blueprint = false, flying = false, color = '#fc9879', part = 'body' } = {}) => {
  const scope = kit.createScope({ grade: 'pp1', part, paint: 'coral', flying, blueprint });
  return kit.createBrush(color, blueprint, flying, scope);
};

// Draws every primitive and detail once, plus the variants (axis, path, palette) that change the markup.
function everything(c) {
  const art = [
    kit.cylinder(c, 20, 20, 80, 60, { rx: 10 }),
    kit.cylinder(c, 20, 100, 80, 30, { axis: 'x', outline: '#123456', width: 3, shine: false, rim: false }),
    kit.cylinder(c, 20, 140, 80, 60, { path: 'M20 140H100L90 200H30Z', fill: kit.GOLD }),
    kit.frustum(c, 60, 10, 30, 60, 50),
    kit.dome(c, 60, 100, 40, 40),
    kit.sphere(c, 60, 60, 20),
    kit.sphere(c, 60, 60, 20, { ry: 12, fill: kit.GOLD }),
    kit.sphere(c, 60, 60, 3),
    kit.bevelPanel(c, 10, 10, 80, 40, { screws: true }),
    kit.volume(c, 'M0 0H50V80Z', { axis: 'diag' }),
    kit.volume(c, 'M0 0H50V80Z', { axis: 'down' }),
    kit.volume(c, 'M0 0H50V80Z'),
    kit.strut(c, 10, 10, 80, 60, 10),
    kit.nozzleBell(c, 10, 10, 68, 49),
    kit.nozzleBell(c, 10, 10, 44, 50, { palette: 'ion' }),
    kit.glassLens(c, 50, 50, 30),
    kit.glassPane(c, 20, 20, 62, 36, { rx: 15 }),
    kit.glassPane(c, 20, 20, 40, 30),
    kit.solarCells(c, 10, 10, 100, 100),
    kit.solarCells(c, 10, 10, 100, 100, { cols: 4, rows: 2, screws: true }),
    kit.wheel3d(c, 50, 50, 20),
    kit.specular(c, 20, 20, 8, 4, -32),
    kit.shine(c, 20, 20, 6, 40),
    kit.rimLight(c, 'M20 20V80'),
    kit.seam(c, 'M20 20H80'),
    kit.rivets(c, [[10, 10], [20, 10]]),
    kit.vents(c, 10, 10, 40, 14, 4),
    kit.hazardStripes(c, 10, 10, 80, 12),
    kit.wrap(c, 10, 10, 40, 60),
    kit.contactShadow(c, 50, 50, 30, 6),
    kit.shadeBand(c, 10, 10, 40, 12, { edge: 'top' }),
    kit.shadeBand(c, 10, 10, 40, 12),
    kit.shadeBand(c, 10, 10, 40, 12, { edge: 'left', opacity: .6, rx: 3 }),
    kit.shadeBand(c, 10, 10, 40, 12, { edge: 'right', color: '#223' }),
    kit.softLight(c, 30, 30, 20, 10, { angle: -30 }),
    kit.softLight(c, 30, 30, 20, 10, { opacity: .3 }),
    kit.glow(c, 50, 50, 8, { color: '#ffb84d' }),
    kit.lamp(c, 50, 50, 3, { color: '#7dffb0' }),
    kit.lamp(c, 60, 50, 3),
    kit.tint(c, 'M10 10H50L40 30H20Z', { opacity: .3, color: '#101a36' }),
    kit.tint(c, 'M10 10H50L40 30H20Z'),
    kit.flame3(c, 50, 50, 40, 50),
    kit.flame3(c, 50, 50, 40, 50, { palette: 'ion' }),
    kit.mirror3d(c, 200, leg => kit.cylinder(leg, 20, 20, 30, 60) + kit.strut(leg, 10, 10, 40, 50, 8)),
  ].join('');
  return c.scope.defs() + art;
}

function gradientIds(markup) {
  return {
    defined: [...markup.matchAll(/<(?:linear|radial)Gradient\b[^>]*?\sid="([^"]+)"/g)].map(match => match[1]),
    referenced: [...markup.matchAll(/url\(#([^)]*)\)/g)].map(match => match[1]),
  };
}

function assertWellFormed(markup) {
  assert.doesNotMatch(markup, /(?:NaN|Infinity|undefined|null|\[object Object\])/);
  const open = [];
  for (const [, closing, name, selfClosing] of markup.matchAll(/<(\/?)([A-Za-z]+)\b[^>]*?(\/?)>/g)) {
    if (selfClosing) continue;
    if (closing) assert.equal(open.pop(), name, `</${name}> closes the element that was opened last`);
    else open.push(name);
  }
  assert.deepEqual(open, [], 'every element is closed');
}

const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16));
  return .2126 * r + .7152 * g + .0722 * b;
};

test('every primitive draws finite, well-formed markup for every paint, state and mirroring', () => {
  for (const color of ['#fc9879', '#77ddcc', '#b8a2f5', '#000', '#ffffff']) {
    for (const flying of [false, true]) {
      assertWellFormed(everything(make({ color, flying })));
    }
  }
  assert.throws(() => kit.cylinder(make(), Number.NaN, 0, 10, 10), RangeError);
  assert.throws(() => kit.strut(make(), 0, 0, Infinity, 10, 4), RangeError);
  assert.throws(() => kit.num('3'), RangeError);
  assert.equal(kit.num(.5), '.5');
  assert.equal(kit.num(-.25), '-.25');
  assert.equal(kit.num(12.3456), '12.35');
});

test('fitted gradient ids are scoped, unique, defined exactly once and never dangling', () => {
  for (const flying of [false, true]) {
    const c = make({ flying, part: 'left-fin' });
    const markup = everything(c);
    const { defined, referenced } = gradientIds(markup);
    assert.ok(defined.length > 10, 'the shaded primitives really use gradients');
    assert.equal(new Set(defined).size, defined.length, 'each id is defined exactly once');
    defined.forEach((id, index) => assert.equal(id, `sa-g-pp1-left-fin-coral-${flying ? 'f' : 'w'}-${index}`));
    for (const id of referenced) assert.ok(defined.includes(id), `${id} is defined`);
    for (const id of defined) assert.ok(referenced.includes(id), `${id} is used, so no dead weight in the defs`);
    assert.equal([...markup.matchAll(/<defs>/g)].length, 1, 'one <defs> block per module');
    assert.doesNotMatch(markup, /<(?:image|script|style|animate\w*|foreignObject|filter|mask|clipPath|pattern)\b|\b(?:href|on\w+)=/i);
    assert.doesNotMatch(markup.replace(/url\(#sa-g-[a-z\d-]+\)/g, ''), /url\(/);
  }
});

test('the registry reuses identical definitions and sanitises its id parts', () => {
  const scope = kit.createScope({ grade: 'Class 2!', part: 'Left Fin', paint: 'mint' });
  const c = kit.createBrush('#77ddcc', false, false, scope);
  const stops = [[0, '#fff'], [1, '#000']];
  const first = kit.linear(c, stops);
  assert.equal(first, 'url(#sa-g-class-2-left-fin-mint-w-0)');
  assert.equal(kit.linear(c, stops), first, 'identical gradients share one id');
  assert.notEqual(kit.linear(c, stops, [0, 0, 0, 1]), first);
  assert.notEqual(kit.radial(c, stops), first);
  assert.equal(gradientIds(scope.defs()).defined.length, 3);
  assert.equal(kit.createScope({ grade: 'pp1', part: 'x', paint: 'coral', blueprint: true }).defs(), '');
});

test('output is byte-deterministic for fresh brushes and independent of earlier renders', () => {
  const first = everything(make());
  everything(make({ color: '#b8a2f5', flying: true, part: 'engine' }));
  assert.equal(everything(make()), first);
  const flight = everything(make({ flying: true }));
  assert.equal(everything(make({ flying: true })), flight);
  assert.notEqual(flight, first);
});

test('blueprint brushes strip every gradient, fill, detail and flame', () => {
  const c = make({ blueprint: true, flying: true });
  const markup = everything(c);
  assertWellFormed(markup);
  assert.equal(c.scope.defs(), '');
  assert.doesNotMatch(markup, /Gradient|<defs|url\(|stop|data-feature="exhaust"|data-flame/);
  const shapes = [...markup.matchAll(/<(?:path|rect|circle|ellipse|line)\b[^>]*>/g)].map(match => match[0]);
  assert.ok(shapes.length > 15);
  for (const tag of shapes) {
    assert.match(tag, /stroke-dasharray="6 5"/, 'blueprint outlines are dashed');
    assert.match(tag, /fill="none"/, 'blueprints are silhouettes with no fill');
  }
  for (const detail of [kit.specular(c, 1, 1, 2, 2), kit.shine(c, 1, 1, 2, 2), kit.rimLight(c, 'M0 0H4'), kit.seam(c, 'M0 0H4'),
    kit.rivets(c, [[1, 1]]), kit.vents(c, 1, 1, 8, 8, 2), kit.hazardStripes(c, 1, 1, 8, 8), kit.wrap(c, 1, 1, 8, 8),
    kit.contactShadow(c, 1, 1, 4, 4), kit.glow(c, 1, 1, 2), kit.lamp(c, 1, 1, 2), kit.tint(c, 'M0 0H4V4Z'), kit.flame3(c, 1, 1, 8, 8), kit.shadeBand(c, 1, 1, 8, 8), kit.softLight(c, 1, 1, 4, 4)]) {
    assert.equal(detail, '');
  }
  assert.throws(() => kit.shadeBand(make(), 1, 1, 8, 8, { edge: 'middle' }), RangeError);
  assert.match(kit.wheel3d(c, 50, 50, 20), /^<g data-feature="wheel">/);
});

test('fitted art never carries a blueprint dash and only the flight variant draws the three-layer flame', () => {
  assert.doesNotMatch(everything(make()), /stroke-dasharray/);
  assert.equal(kit.flame3(make(), 50, 50, 40, 50), '', 'no exhaust while the craft is on the workshop floor');
  for (const palette of ['fire', 'ion']) {
    const c = make({ flying: true });
    const flame = kit.flame3(c, 50, 50, 40, 50, { palette });
    assert.match(flame, /^<g data-feature="exhaust">/);
    assert.equal([...flame.matchAll(/data-feature="exhaust"/g)].length, 1);
    for (const layer of ['outer', 'mid', 'core']) assert.equal([...flame.matchAll(new RegExp(`data-flame="${layer}"`, 'g'))].length, 1);
    assertWellFormed(c.scope.defs() + flame);
  }
  const fire = make({ flying: true });
  const ion = make({ flying: true });
  kit.flame3(fire, 50, 50, 40, 50);
  kit.flame3(ion, 50, 50, 40, 50, { palette: 'ion' });
  assert.notEqual(fire.scope.defs(), ion.scope.defs(), 'the ion drive is blue, the chemical flame orange');
  assert.match(ion.scope.defs(), /#2f6fff/);
});

test('mirror3d flips the light on screen, restores it afterwards and accepts art or a drawing function', () => {
  const c = make();
  const plain = kit.cylinder(c, 20, 20, 30, 60);
  const flipped = kit.mirror3d(c, 200, leg => kit.cylinder(leg, 20, 20, 30, 60));
  assert.match(flipped, /^<g transform="translate\(200 0\) scale\(-1 1\)">/);
  assert.equal(c.scope.lit, -1);
  const gradients = gradientIds(c.scope.defs()).defined;
  assert.equal(gradients.length, 3, 'body ramp, shine fade, and the flipped body ramp a mirrored part needs');
  const body = markup => markup.match(/url\(#[^)]+\)/)[0];
  assert.notEqual(body(flipped), body(plain));
  assert.notEqual(flipped.replace(/^<g[^>]*>|<\/g>$/g, ''), plain);
  assert.throws(() => kit.mirror3d(c, 200, () => { throw new Error('boom'); }), /boom/);
  assert.equal(c.scope.lit, -1, 'the light is restored even when the drawing throws');
  assert.equal(kit.mirror3d(c, 100, '<path d="M0 0"/>'), '<g transform="translate(100 0) scale(-1 1)"><path d="M0 0"/></g>');
});

test('colour helpers are exact at zero, monotonic, and reject anything that is not a hex colour', () => {
  assert.equal(kit.tone('#fc9879', 0), '#fc9879');
  assert.equal(kit.tone('#abc', 0), '#aabbcc');
  assert.equal(kit.tone('#123456', 1), '#fff9e8');
  assert.equal(kit.tone('#ffffff', -1), '#7a739e');
  assert.equal(kit.mixHex('#000000', '#ffffff', .5), '#808080');
  assert.equal(kit.mixHex('#000000', '#ffffff', 9), '#ffffff');
  for (const color of ['#fc9879', '#77ddcc', '#b8a2f5', kit.STEEL, kit.GOLD]) {
    const shade = kit.shades(color);
    const order = [shade.spec, shade.hi, shade.light, shade.base, shade.mid, shade.shade, shade.deep, shade.edge].map(luminance);
    assert.deepEqual([...order].sort((a, b) => b - a), order, `${color}: tones run from highlight to core shadow`);
    assert.equal(shade.base, color);
    assert.notEqual(shade.edge, '#000000', 'outlines stay tone-on-tone, never pure black');
  }
  for (const bad of ['red', '#12', '#12345', 'rgb(1,2,3)', undefined, null, 5]) assert.throws(() => kit.tone(bad, .2), TypeError);
});

test('3D primitives refuse a brush that has no shading scope instead of drawing silently flat', () => {
  const bare = kit.createBrush('#fc9879', false, false);
  assert.throws(() => kit.cylinder(bare, 0, 0, 10, 10), /shading scope/);
  assert.throws(() => kit.linear(bare, [[0, '#fff'], [1, '#000']]), TypeError);
  assert.equal(kit.cylinder(kit.createBrush('#fc9879', true), 0, 0, 10, 10).includes('stroke-dasharray'), true);
});

test('the header documents every export and the contract names other artists rely on stay exported', () => {
  const header = SOURCE.match(/^\/\*[\s\S]*?\*\//)[0];
  for (const name of Object.keys(kit)) assert.match(header, new RegExp(`(?<![\\w$])${name.replace(/\$/g, '\\$')}(?![\\w$])`), `${name} is documented in the header`);
  const contract = ['INK', 'PAPER', 'STEEL', 'GLASS', 'GOLD', 'PANEL', 'GHOST', 'escape', 'attributes', 'group', 'mirror', 'feature', 'num', 'polygon',
    'clipRect', 'tone', 'mixHex', 'shades', 'createBrush', 'createScope', 'linear', 'radial', 'litStops', 'mirror3d', 'cylinder', 'frustum', 'dome',
    'sphere', 'bevelPanel', 'volume', 'strut', 'nozzleBell', 'glassLens', 'glassPane', 'solarCells', 'wheel3d', 'specular', 'shine', 'rimLight', 'seam', 'rivets',
    'vents', 'hazardStripes', 'wrap', 'contactShadow', 'shadeBand', 'softLight', 'glow', 'lamp', 'tint', 'flame3'];
  for (const name of contract) assert.ok(name in kit, `${name} must stay exported (additions only)`);
  assert.doesNotMatch(SOURCE, /import\s*\(|\bfetch\(|new Image\(|new Audio\(|\beval\(|https?:\/\//, 'the Android exporter rejects these in game modules');
});
