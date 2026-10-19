// Nebula Research Station (class-4): soft-3D toy art. Slot centres, joints and data-feature markers follow the old flat craft.
import {
  STEEL, GOLD, GLASS_DEEP, GLASS_MID, tone, feature, num, mirror3d, polygon, clipRect,
  cylinder, solarCells, nozzleBell, specular, rimLight, softLight, shine, glow, lamp, flame3,
  linear, radial, litStops,
} from './craft-shading.mjs';

const WHITE = '#ffffff';
const AMBER = '#ffb84d';
const GREEN = '#7dffb0';
const SIDE = [[0, -.3], [.2, .42], [.5, .02], [.82, -.34], [1, -.24]];
const TOP = [[0, .3], [.2, .44], [.5, .02], [.8, -.36], [1, -.3]];
const ORB = [[0, .6], [.35, .18], [.75, -.26], [1, -.42]];
const SKY = [[0, '#5fd8d0'], [.4, GLASS_MID], [.8, '#15677a'], [1, GLASS_DEEP]];
const BULB = [[0, '#5fd8d0'], [.5, GLASS_MID], [1, GLASS_DEEP]];

const lit = c => c.scope?.lit ?? -1;
const tint = (fill, table) => table.map(([offset, amount]) => [offset, tone(fill, amount)]);
const edge = fill => tone(fill, -.62);
const diagonal = c => lit(c) < 0 ? [0, 0, 1, 1] : [1, 0, 0, 1];
const raw = (c, name, values) => c.blueprint ? ''
  : `<${name}${Object.entries(values).map(([key, value]) => ` ${key}="${typeof value === 'number' ? num(value) : value}"`).join('')}/>`;
const circlePath = (cx, cy, r, sweep) => `M${num(cx - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 ${sweep} ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 ${sweep} ${num(-2 * r)} 0Z`;
const arcPath = (cx, cy, r, from, to) => {
  const point = degrees => `${num(cx + r * Math.cos(degrees * Math.PI / 180))} ${num(cy + r * Math.sin(degrees * Math.PI / 180))}`;
  return `M${point(from)}A${num(r)} ${num(r)} 0 0 1 ${point(to)}`;
};

// Lean metal form: one rect plus a small gradient shared by every bar of the same colour.
function bar(c, x, y, w, h, fill = STEEL, rx = Math.min(w, h) * .3, ghost = true) {
  if (c.blueprint) return ghost ? c.rect(x, y, w, h, 'none', rx) : '';
  const body = h >= w ? linear(c, litStops(c, tint(fill, SIDE))) : linear(c, tint(fill, TOP), [0, 0, 0, 1]);
  return c.rect(x, y, w, h, body, rx, edge(fill), 1.8);
}

function ball(c, cx, cy, r, fill = STEEL, o = {}) {
  if (c.blueprint) return o.ghost === false ? '' : c.circle(cx, cy, r, 'none');
  const l = lit(c);
  return c.circle(cx, cy, r, radial(c, tint(fill, ORB), [.5, .5, .5, .5 + l * .18, .31]), edge(fill), 1.8)
    + (o.spec === false ? '' : specular(c, cx + l * r * .4, cy - r * .42, Math.max(1.5, r * .22), Math.max(.9, r * .12), -l * 38));
}

// Round window: steel ring + deep teal glass. Add glints() once for all windows of a module.
function port(c, cx, cy, r) {
  if (c.blueprint) return c.circle(cx, cy, r, 'none');
  return raw(c, 'circle', { cx, cy, r, fill: tone(STEEL, .12), stroke: edge(STEEL), 'stroke-width': 1.3 })
    + raw(c, 'circle', { cx, cy, r: r * .68, fill: radial(c, BULB, [.36, .68, .9]), stroke: GLASS_DEEP, 'stroke-width': .8 });
}

function glints(c, points, r) {
  const k = -lit(c);
  return raw(c, 'path', {
    d: points.map(([x, y]) => `M${num(x - k * r * .42)} ${num(y - r * .1)}L${num(x - k * r * .08)} ${num(y - r * .46)}`).join(''),
    fill: 'none', stroke: WHITE, 'stroke-opacity': .7, 'stroke-width': Math.max(1.2, r * .14),
  });
}

function pane(c, x, y, w, h, rx) {
  if (c.blueprint) return c.rect(x, y, w, h, 'none', rx);
  const ring = 2.8;
  const slant = (h - ring * 2) * .6;
  const gx = x + ring;
  const gy = y + ring;
  const gh = h - ring * 2;
  const stripe = [[gx + 9, gy + gh - 1.5], [gx + 20, gy + gh - 1.5], [gx + 20 + slant, gy + 1.5], [gx + 9 + slant, gy + 1.5]];
  return c.rect(x, y, w, h, linear(c, tint(STEEL, [[0, .5], [.5, 0], [1, -.5]]), diagonal(c)), rx, edge(STEEL), 1.8)
    + raw(c, 'rect', { x: gx, y: gy, width: w - ring * 2, height: gh, rx: Math.max(1, rx - ring), fill: linear(c, SKY, diagonal(c)), stroke: GLASS_DEEP, 'stroke-width': 1 })
    + raw(c, 'path', { d: polygon(stripe), fill: WHITE, 'fill-opacity': .4 });
}

// Slot grille and rivets as single paths of round-cap strokes (the root svg has stroke-linecap round).
function slots(c, x, y, w, count, gap, base) {
  if (c.blueprint) return '';
  let dark = '';
  let light = '';
  for (let index = 0; index < count; index++) {
    dark += `M${num(x)} ${num(y + index * gap)}h${num(w)}`;
    light += `M${num(x)} ${num(y + index * gap + 1.2)}h${num(w)}`;
  }
  return raw(c, 'path', { d: light, fill: 'none', stroke: tone(base, .5), 'stroke-opacity': .7, 'stroke-width': 2 })
    + raw(c, 'path', { d: dark, fill: 'none', stroke: tone(base, -.6), 'stroke-width': 2 });
}

function studs(c, points, base = STEEL) {
  if (c.blueprint) return '';
  const l = lit(c);
  const dots = (dx, dy) => points.map(([x, y]) => `M${num(x + dx)} ${num(y + dy)}h0`).join('');
  return raw(c, 'path', { d: dots(0, 0), fill: 'none', stroke: edge(base), 'stroke-width': 3.6 })
    + raw(c, 'path', { d: dots(0, 0), fill: 'none', stroke: tone(base, .12), 'stroke-width': 2.4 })
    + raw(c, 'path', { d: dots(l * .5, -.6), fill: 'none', stroke: WHITE, 'stroke-opacity': .8, 'stroke-width': 1 });
}

function hazard(c, x, y, w, h) {
  if (c.blueprint) return '';
  const pitch = h * 2.4;
  let stripes = '';
  for (let at = x - h; at < x + w; at += pitch) {
    stripes += polygon(clipRect([[at, y + h], [at + pitch / 2, y + h], [at + pitch / 2 + h, y], [at + h, y]], x, y, x + w, y + h));
  }
  return raw(c, 'rect', { x, y, width: w, height: h, fill: '#f6c944', stroke: '#272f4a', 'stroke-width': 1.2 })
    + raw(c, 'path', { d: stripes, fill: '#2b3550' });
}

function torus(c, cx, cy, ro, ri) {
  const d = circlePath(cx, cy, ro, 0) + circlePath(cx, cy, ri, 1);
  const base = c.color;
  const section = radial(c, [[ri / ro, tone(base, -.38)], [.68, tone(base, -.06)], [.79, tone(base, .3)], [.89, base], [.96, tone(base, -.3)], [1, tone(base, -.46)]],
    [cx, cy, ro], { user: true });
  const sun = linear(c, [[0, WHITE, .6], [.46, WHITE, 0], [.56, '#101a36', 0], [1, '#101a36', .5]],
    [cx - ro * .72, cy - ro * .72, cx + ro * .72, cy + ro * .72], { user: true });
  return c.path(d, section, tone(base, -.64), 2.2) + raw(c, 'path', { d, fill: sun });
}

function engine(c) {
  return flame3(c, 210, 388, 40, 30)
    + bar(c, 198, 298, 24, 18, STEEL, 3, false)
    + bar(c, 190, 300, 40, 11, GOLD, 5)
    + bar(c, 160, 322, 18, 36, STEEL, 8)
    + bar(c, 242, 322, 18, 36, STEEL, 8)
    + bar(c, 158, 335, 22, 5, GOLD, 2, false) + bar(c, 240, 335, 22, 5, GOLD, 2, false)
    + cylinder(c, 172, 313, 76, 47, { rx: 16, shine: false })
    + raw(c, 'path', { d: 'M173 333V329A15 15 0 0 1 188 314H232A15 15 0 0 1 247 329V333Z', fill: linear(c, [[0, '#101a36', .5], [1, '#101a36', 0]], [0, 0, 0, 1]) })
    + raw(c, 'path', { d: 'M176.8 325A12 12 0 0 1 184 317.8', fill: 'none', stroke: WHITE, 'stroke-opacity': .75, 'stroke-width': 2.4 })
    + slots(c, 182, 328, 26, 3, 5.5, c.color)
    + lamp(c, 228, 334, 3, { color: GREEN })
    + hazard(c, 180, 347, 60, 7)
    + nozzleBell(c, 184, 358, 52, 30)
    + studs(c, [[169, 327], [251, 327], [169, 351], [251, 351]]);
}

function body(c) {
  const [cx, cy] = [210, 244];
  const ports = [[176, 210], [244, 210], [176, 278], [244, 278]];
  return feature('habitat-ring',
    torus(c, cx, cy, 60, 37)
    + raw(c, 'path', { d: arcPath(cx, cy, 48.5, 196, 252), fill: 'none', stroke: WHITE, 'stroke-opacity': .7, 'stroke-width': 3.6 })
    + specular(c, 168, 205, 4.2, 2, -42)
    + rimLight(c, arcPath(cx, cy, 57.4, 10, 80), { base: c.color, width: 1.6 })
    + rimLight(c, arcPath(cx, cy, 39.4, 8, 78), { base: c.color, width: 1.4 })
    + ports.map(([x, y]) => port(c, x, y, 8)).join('') + glints(c, ports, 8)
    + bar(c, 176, 238, 22, 11, STEEL, 4, false) + bar(c, 222, 238, 22, 11, STEEL, 4, false)
    + bar(c, 199, 196, 22, 98, STEEL, 5, false)
    + ball(c, cx, cy, 17, STEEL, { spec: false })
    + ball(c, cx, cy, 11, c.color, { spec: false, ghost: false })
    + glow(c, cx, cy, 4, { color: AMBER })
    + bar(c, 192, 184, 36, 13, STEEL, 5)
    + bar(c, 192, 292, 36, 12, STEEL, 5)
    + bar(c, 146, 231, 26, 26, STEEL, 7)
    + bar(c, 248, 231, 26, 26, STEEL, 7)
    + lamp(c, 157, 244, 3.2, { color: AMBER }) + lamp(c, 263, 244, 3.2, { color: AMBER }));
}

function cockpit(c) {
  return feature('observation-hub',
    c.line(182, 126, 168, 94, edge(STEEL), 4.6) + c.line(182, 126, 168, 94, STEEL, 2.6) + ball(c, 167.5, 92, 4.6, GOLD)
    + bar(c, 197, 99, 26, 13, STEEL, 4)
    + cylinder(c, 177, 108, 66, 84, { rx: 24, path: 'M176 192V134Q176 108 210 108Q244 108 244 134V192Z', shine: false })
    + softLight(c, 192, 126, 18, 12, { angle: -35, opacity: .5 })
    + pane(c, 184, 122, 52, 28, 12)
    + port(c, 210, 169, 9) + glints(c, [[210, 169]], 9)
    + lamp(c, 190, 170, 2.6, { color: GREEN }) + lamp(c, 230, 170, 2.6, { color: AMBER })
    + hazard(c, 181, 181, 58, 5)
    + bar(c, 183, 187, 54, 11, STEEL, 5));
}

function nose(c) {
  // Drawn upright, then tilted clockwise so the local left (lit) side faces the upper-left key light.
  const scope = bar(c, 172, 28, 11, 36, STEEL, 4)
    + bar(c, 170, 38, 30, 5, GOLD, 2, false) + bar(c, 170, 54, 30, 5, GOLD, 2, false)
    + raw(c, 'ellipse', { cx: 177.5, cy: 28.6, rx: 5.8, ry: 2.7, fill: GLASS_DEEP, stroke: edge(STEEL), 'stroke-width': 1 })
    + bar(c, 203, 76, 14, 14, STEEL, 4, false)
    + cylinder(c, 190, 40, 40, 40, { rx: 10 })
    + bar(c, 188, 66, 44, 6, STEEL, 3)
    + cylinder(c, 180, 18, 60, 26, { path: 'M180 18L190 42Q210 47 230 42L240 18Z', shine: false, rim: false })
    + bar(c, 188, 38, 44, 7, GOLD, 3)
    + raw(c, 'ellipse', { cx: 210, cy: 18, rx: 30, ry: 9.4, fill: tone(STEEL, -.5), stroke: edge(STEEL), 'stroke-width': 1.2 })
    + raw(c, 'ellipse', { cx: 210, cy: 18.8, rx: 26, ry: 7.4, fill: radial(c, BULB, [.4, .66, .9]) })
    + raw(c, 'circle', { cx: 210, cy: 19.6, r: 3, fill: GOLD, stroke: edge(GOLD), 'stroke-width': .9 })
    + raw(c, 'path', { d: 'M191 18.6L201 15.4', fill: 'none', stroke: WHITE, 'stroke-opacity': .75, 'stroke-width': 2.6 });
  return feature('survey-telescope',
    `<g transform="rotate(40 210 68)">${scope}</g>`
    + bar(c, 201, 60, 18, 38, STEEL, 7)
    + ball(c, 210, 68, 9, GOLD)
    + bar(c, 194, 94, 32, 10, STEEL, 4));
}

function wing(c) {
  return bar(c, 112, 238, 40, 12, STEEL, 4, false)
    + bar(c, 138, 231, 12, 26, GOLD, 4)
    + bar(c, 20, 234, 98, 22, c.color, 10)
    + shine(c, 30, 237, 44, 3, { across: true, opacity: .7 })
    + feature('solar-array', solarCells(c, 26, 168, 92, 62, { cols: 4, rows: 2, inset: 5 }))
    + feature('solar-array', solarCells(c, 26, 260, 92, 62, { cols: 4, rows: 2, inset: 5 }))
    + [36, 92].map(x => bar(c, x, 229, 16, 9, STEEL, 3, false) + bar(c, x, 252, 16, 9, STEEL, 3, false)).join('')
    + lamp(c, 69, 245, 3.4, { color: AMBER });
}

function foldedWing(c) {
  return feature('folded-power-wing',
    bar(c, 100, 238, 50, 12, STEEL, 4, false)
    + bar(c, 138, 231, 12, 26, GOLD, 4)
    + bar(c, 96, 232, 30, 26, c.color, 8)
    + lamp(c, 111, 245, 3, { color: AMBER })
    + feature('solar-array', solarCells(c, 100, 172, 26, 56, { cols: 2, rows: 3, inset: 4 }))
    + feature('solar-array', solarCells(c, 100, 262, 26, 56, { cols: 2, rows: 3, inset: 4 })));
}

export const class4Art = Object.freeze({
  engine, body, cockpit, nose, leftFin: wing, rightFin: c => mirror3d(c, 420, wing),
  flight: Object.freeze({ leftFin: foldedWing, rightFin: c => mirror3d(c, 420, foldedWing) }),
});
