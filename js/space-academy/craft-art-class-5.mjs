// Galaxy Command Flagship (class-5): soft-3D toy art. Slot centres, joints and data-feature markers follow the old flat craft.
import {
  STEEL, GOLD, PAPER, GLASS_DEEP, GLASS_MID, tone, feature, group, num, mirror3d, polygon, clipRect,
  cylinder, dome, volume, specular, rimLight, softLight, lamp, flame3, tint as facet,
  linear, radial, litStops,
} from './craft-shading.mjs';

const WHITE = '#ffffff';
const AMBER = '#ffb84d';
const GREEN = '#7dffb0';
const ICE = '#7fd3ff';
const LILAC = '#cdbcff';
const NIGHT = '#101a36';
const OTTER = '#a06c47';
const SIDE = [[0, -.3], [.2, .42], [.5, .02], [.82, -.34], [1, -.24]];
const TOP = [[0, .3], [.2, .44], [.5, .02], [.8, -.36], [1, -.3]];
const ORB = [[0, .6], [.35, .18], [.75, -.26], [1, -.42]];
const BELL = [[0, -.3], [.14, .4], [.3, .3], [.5, 0], [.72, -.28], [.9, -.46], [1, -.34]];
const SKY = [[0, '#5fd8d0'], [.4, GLASS_MID], [.8, '#15677a'], [1, GLASS_DEEP]];
const BULB = [[0, '#5fd8d0'], [.5, GLASS_MID], [1, GLASS_DEEP]];
const WARM = [[0, '#fff1c2'], [.45, '#ffcf6b'], [1, '#e8892f']];
const CORE = [[0, '#f4fdff'], [.45, ICE], [1, '#2c6bd6']];

const lit = c => c.scope?.lit ?? -1;
const ramp = (fill, table) => table.map(([offset, amount]) => [offset, tone(fill, amount)]);
const edge = fill => tone(fill, -.62);
const diagonal = c => lit(c) < 0 ? [0, 0, 1, 1] : [1, 0, 0, 1];
const raw = (c, name, values) => c.blueprint ? ''
  : `<${name}${Object.entries(values).map(([key, value]) => ` ${key}="${typeof value === 'number' ? num(value) : value}"`).join('')}/>`;
const r1 = value => Math.round(value * 10) / 10;
const star = (cx, cy, outer, inner) => polygon(Array.from({ length: 10 }, (_, index) => {
  const angle = -Math.PI / 2 + index * Math.PI / 5;
  const radius = index % 2 ? inner : outer;
  return [r1(cx + radius * Math.cos(angle)), r1(cy + radius * Math.sin(angle))];
}));

const dots = (c, points, color, width = 3) => raw(c, 'path', {
  d: points.map(([x, y]) => `M${num(x)} ${num(y)}h0`).join(''), fill: 'none', stroke: color, 'stroke-width': width,
});

// Crisp white glint along a bevel.
const bevel = (c, d) => raw(c, 'path', { d, fill: 'none', stroke: WHITE, 'stroke-opacity': .7, 'stroke-width': 2.4 });

// Lean metal form: one rect plus a small gradient shared by every bar of the same colour.
function bar(c, x, y, w, h, fill = STEEL, rx = Math.min(w, h) * .3, ghost = true) {
  if (c.blueprint) return ghost ? c.rect(x, y, w, h, 'none', rx) : '';
  const body = h >= w ? linear(c, litStops(c, ramp(fill, SIDE))) : linear(c, ramp(fill, TOP), [0, 0, 0, 1]);
  return c.rect(x, y, w, h, body, rx, edge(fill), 1.8);
}

function ball(c, cx, cy, r, fill = STEEL, o = {}) {
  if (c.blueprint) return o.ghost === false ? '' : c.circle(cx, cy, r, 'none');
  const l = lit(c);
  return c.circle(cx, cy, r, radial(c, ramp(fill, ORB), [.5, .5, .5, .5 + l * .18, .31]), edge(fill), 1.8)
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

// Slot grille as one path of round-cap strokes (the root svg has stroke-linecap round).
function slots(c, x, y, w, count, gap, base) {
  if (c.blueprint) return '';
  let dark = '';
  for (let index = 0; index < count; index++) dark += `M${num(x)} ${num(y + index * gap)}h${num(w)}`;
  return raw(c, 'path', { d: dark, fill: 'none', stroke: tone(base, -.6), 'stroke-width': 2 });
}

function studs(c, points, base = STEEL) {
  if (c.blueprint) return '';
  const spots = points.map(([x, y]) => `M${num(x)} ${num(y)}h0`).join('');
  return raw(c, 'path', { d: spots, fill: 'none', stroke: edge(base), 'stroke-width': 3.6 })
    + raw(c, 'path', { d: spots, fill: 'none', stroke: tone(base, .2), 'stroke-width': 2.2 });
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

// Engine bell: steel flare with a gold band, a heat glow near the lip and an ion-blue throat (white-hot in flight).
function bell(c, cx, y, topW, botW, h, band) {
  const [l, r, bl, br] = [cx - topW / 2, cx + topW / 2, cx - botW / 2, cx + botW / 2];
  const d = `M${num(l)} ${num(y)}H${num(r)}Q${num(r + (br - r) * .3)} ${num(y + h * .64)} ${num(br)} ${num(y + h)}H${num(bl)}Q${num(l + (bl - l) * .3)} ${num(y + h * .64)} ${num(l)} ${num(y)}Z`;
  if (c.blueprint) return c.path(d, 'none');
  const k = lit(c);
  const ry = Math.max(3, botW * .1);
  const half = t => {
    const u = (1.28 - Math.sqrt(1.6384 - 1.12 * t)) / .56;
    return (1 - u) ** 2 * topW / 2 + 2 * (1 - u) * u * (topW / 2 + (botW - topW) * .15) + u * u * botW / 2;
  };
  const arc = (t, sag) => `M${num(cx - half(t))} ${num(y + h * t)}Q${num(cx)} ${num(y + h * t + sag)} ${num(cx + half(t))} ${num(y + h * t)}`;
  return c.path(d, linear(c, litStops(c, ramp(STEEL, BELL))), edge(STEEL), 2)
    + raw(c, 'path', { d: arc(band, 4), fill: 'none', stroke: tone(GOLD, -.45), 'stroke-width': 6.4 })
    + raw(c, 'path', { d: arc(band, 4), fill: 'none', stroke: GOLD, 'stroke-width': 4 })
    + raw(c, 'path', { d: `${arc(.84, 3)}L${num(br)} ${num(y + h)}H${num(bl)}Z`, fill: linear(c, [[0, ICE, 0], [1, ICE, c.flying ? .6 : .34]], [0, 0, 0, 1]) })
    + raw(c, 'path', { d: `M${num(cx + k * topW * .28)} ${num(y + h * (band + .1))}L${num(cx + k * botW * .3)} ${num(y + h * .74)}`, fill: 'none', stroke: WHITE, 'stroke-opacity': .7, 'stroke-width': 2.2 })
    + raw(c, 'ellipse', {
      cx, cy: y + h, rx: botW / 2 - .6, ry,
      fill: radial(c, c.flying ? CORE : [[0, '#3b3f5c'], [.55, '#1d2038'], [1, '#12121f']], [.5, .4, .55]),
      stroke: c.flying ? tone(STEEL, .4) : ICE, 'stroke-opacity': c.flying ? 1 : .75, 'stroke-width': 1.7,
    });
}

function engine(c) {
  return flame3(c, 210, 410, 40, 26, { palette: 'ion' })
    + flame3(c, 170, 398, 26, 20, { palette: 'ion' }) + flame3(c, 250, 398, 26, 20, { palette: 'ion' })
    + bell(c, 170, 350, 22, 34, 48, .55) + bell(c, 250, 350, 22, 34, 48, .55)
    + bell(c, 210, 360, 28, 46, 50, .42)
    + bar(c, 188, 322, 44, 14, STEEL, 5)
    + cylinder(c, 160, 331, 100, 36, { rx: 15, shine: false })
    + softLight(c, 184, 340, 24, 7, { angle: -8, opacity: .5 })
    + specular(c, 177, 335, 7, 1.7, -6)
    + facet(c, 'M165 357Q166 363 174 363H246Q254 363 255 357Z', { color: NIGHT, opacity: .24 })
    + slots(c, 166, 341, 11, 3, 5.2, c.color) + slots(c, 243, 341, 11, 3, 5.2, c.color)
    + raw(c, 'rect', { x: 185, y: 339, width: 50, height: 13, rx: 6.5, fill: tone(STEEL, .1), stroke: edge(STEEL), 'stroke-width': 1.6 })
    + raw(c, 'rect', { x: 188, y: 342, width: 44, height: 7, rx: 3.5, fill: linear(c, CORE, [0, 0, 0, 1]) })
    + raw(c, 'path', { d: 'M196 345.5H224', fill: 'none', stroke: WHITE, 'stroke-opacity': .85, 'stroke-width': 1.6 })
    + bar(c, 162, 360, 96, 7, GOLD, 3, false);
}

const HULL = 'M168 177H252Q258 177 261 181L270 197Q273 202 273 208V264Q273 269 271 273L252 318Q249 328 240 328H180Q171 328 168 318L149 273Q147 269 147 264V208Q147 202 150 197L159 181Q162 177 168 177Z';
const TRIM = 'M172 190H248Q253 190 255 194L262 206Q264 209 264 213V262Q264 266 262 270L246 307Q244 315 237 315H183Q176 315 174 307L158 270Q156 266 156 262V213Q156 209 158 206L165 194Q167 190 172 190Z';

// Gold-ringed viewport onto a spiral galaxy.
function badge(c, cx, cy, r) {
  if (c.blueprint) return c.circle(cx, cy, r, 'none');
  const l = lit(c);
  const s = r / 21;
  const p = (x, y) => `${num(r1(cx + x * s))} ${num(r1(cy + y * s))}`;
  const spiral = k => `M${p(0, 0)}C${p(4 * k, -5 * k)} ${p(11 * k, -3 * k)} ${p(12 * k, 2 * k)}C${p(13 * k, 9 * k)} ${p(4 * k, 14 * k)} ${p(-4 * k, 12 * k)}`;
  return c.circle(cx, cy, r, radial(c, ramp(GOLD, ORB), [.5, .5, .5, .5 + l * .16, .3]), edge(GOLD), 1.8)
    + raw(c, 'circle', { cx, cy, r: r * .78, fill: '#1b1f52', stroke: tone(GOLD, -.5), 'stroke-width': 1.2 })
    + raw(c, 'path', { d: spiral(1) + spiral(-1), fill: 'none', stroke: LILAC, 'stroke-width': 2.2 * s, 'stroke-opacity': .9 })
    + raw(c, 'circle', { cx, cy, r: 5 * s, fill: radial(c, [[0, WHITE], [.5, '#ffe6a0'], [1, AMBER, 0]]) })
    + dots(c, [[cx - 9 * s, cy - 8 * s], [cx + 10 * s, cy - 5 * s], [cx - 7 * s, cy + 11 * s]], WHITE, 1.5)
    + raw(c, 'path', { d: `M${p(-11, -3)}A${num(11.4 * s)} ${num(11.4 * s)} 0 0 1 ${p(-3, -11)}`, fill: 'none', stroke: WHITE, 'stroke-opacity': .55, 'stroke-width': 2.2 });
}

// Pylon wing from the hull shoulder to a pod. Side 1 is placed by mirrored coordinates so both arms share the same left-lit gradients.
function arm(c, side) {
  const x = (left, width = 0) => side ? 420 - left - width : left;
  return volume(c, `M${x(149)} 204L${x(125)} 229V236H${x(149)}Z`, { axis: 'diag' })
    + volume(c, `M${x(149)} 292L${x(125)} 267V260H${x(149)}Z`, { axis: 'diag' })
    + bar(c, x(118, 34), 233, 34, 30, STEEL, 9)
    + raw(c, 'rect', { x: x(128, 17), y: 244.5, width: 17, height: 7, rx: 3.5, fill: linear(c, CORE, [0, 0, 0, 1]), stroke: edge(STEEL), 'stroke-width': 1 })
    + bar(c, x(109, 16), 228, 16, 40, GOLD, 5)
    + studs(c, [[x(117), 234], [x(117), 262]], GOLD);
}

function body(c) {
  return feature('command-spine',
    arm(c, 0) + arm(c, 1)
    + bar(c, 186, 169, 48, 14, STEEL, 5)
    + cylinder(c, 147, 177, 126, 151, { path: HULL, shine: false, rim: false })
    + softLight(c, 177, 214, 26, 18, { angle: -35, opacity: .45 })
    + bevel(c, 'M160.5 187L153.5 199.5')
    + raw(c, 'path', { d: 'M159.7 182H260.3L267.1 194H152.9Z', fill: linear(c, [[0, NIGHT, .4], [1, NIGHT, 0]], [0, 0, 0, 1]) })
    + rimLight(c, 'M271 214V262', { base: c.color, width: 1.6 })
    + raw(c, 'path', { d: TRIM, fill: 'none', stroke: GOLD, 'stroke-width': 2.2 })
    + slots(c, 164, 214, 14, 3, 6, c.color) + slots(c, 242, 214, 14, 3, 6, c.color)
    + lamp(c, 171, 244, 3, { color: GREEN }) + lamp(c, 249, 244, 3, { color: AMBER })
    + raw(c, 'circle', { cx: 210, cy: 227, r: 29, fill: tone(c.color, -.3), stroke: edge(c.color), 'stroke-width': 1.6 })
    + badge(c, 210, 227, 25)
    + dots(c, [[196, 265], [210, 265], [224, 265]], GREEN, 3.4) + dots(c, [[203, 265], [217, 265]], AMBER, 3.4)
    + raw(c, 'rect', { x: 193, y: 273, width: 34, height: 19, rx: 9, fill: tone(STEEL, .1), stroke: edge(STEEL), 'stroke-width': 1.6 })
    + raw(c, 'rect', { x: 196, y: 276, width: 28, height: 13, rx: 6, fill: linear(c, CORE, [0, 0, 0, 1]) })
    + raw(c, 'path', { d: 'M202 282.5H218', fill: 'none', stroke: WHITE, 'stroke-opacity': .85, 'stroke-width': 1.8 })
    + hazard(c, 176, 300, 68, 6)
    + bar(c, 183, 321, 54, 13, GOLD, 5));
}

// Steel frame with deep-teal glass and one slanted glint.
function pane(c, x, y, w, h, rx) {
  if (c.blueprint) return c.rect(x, y, w, h, 'none', rx);
  const ring = 3.2;
  const gx = x + ring;
  const gy = y + ring;
  const gh = h - ring * 2;
  const slant = gh * .7;
  return c.rect(x, y, w, h, linear(c, ramp(STEEL, [[0, .5], [.5, 0], [1, -.5]]), diagonal(c)), rx, edge(STEEL), 1.8)
    + raw(c, 'rect', { x: gx, y: gy, width: w - ring * 2, height: gh, rx: Math.max(1, rx - ring), fill: linear(c, SKY, diagonal(c)), stroke: GLASS_DEEP, 'stroke-width': 1 })
    + raw(c, 'path', { d: polygon([[gx + 6, gy + gh - 1.2], [gx + 15, gy + gh - 1.2], [gx + 15 + slant, gy + 1.2], [gx + 6 + slant, gy + 1.2]]), fill: WHITE, 'fill-opacity': .4 });
}

// Mast whip with a gold tip. Side 1 is placed by mirrored coordinates.
function whip(c, side) {
  const m = x => side ? 420 - x : x;
  const [x1, x2] = [m(167), m(158)];
  return c.line(x1, 153, x2, 120, edge(STEEL), 4.6) + c.line(x1, 153, x2, 120, STEEL, 2.6) + ball(c, m(157.5), 116, 4.4, GOLD, { spec: false });
}

// The captain: a tiny otter bust built from round-cap dots.
function captain(c, x, y) {
  return dots(c, [[x - 5.4, y - 5.2], [x + 5.4, y - 5.2]], OTTER, 4.6)
    + dots(c, [[x, y]], OTTER, 12.6)
    + dots(c, [[x, y + 2.8]], '#f6e3c8', 7.4)
    + dots(c, [[x - 2.8, y - 1.3], [x + 2.8, y - 1.3], [x, y + 1.7]], '#2a1a14', 2.1);
}

function cockpit(c) {
  return feature('command-bridge',
    whip(c, 0) + whip(c, 1) + dots(c, [[155.7, 114.2], [260.7, 114.2]], WHITE, 1.8)
    + bar(c, 194, 105, 32, 10, STEEL, 4)
    + cylinder(c, 190, 111, 40, 16, { rx: 6, shine: false })
    + bar(c, 166, 120, 88, 6, GOLD, 3, false)
    + cylinder(c, 170, 123, 80, 32, { rx: 10, shine: false })
    + softLight(c, 188, 129, 16, 4, { angle: -6, opacity: .5 })
    + pane(c, 173, 127, 74, 24, 9)
    + dots(c, [[181, 134], [190, 143.5], [232, 133.5], [240, 141], [227, 146]], WHITE, 1.3)
    + captain(c, 210, 140.5)
    + raw(c, 'path', { d: 'M198 130.5V147.5M222 130.5V147.5', fill: 'none', stroke: GOLD, 'stroke-width': 2.4 })
    + bar(c, 157, 153, 106, 6, GOLD, 3, false)
    + cylinder(c, 160, 156, 100, 27, { rx: 8, shine: false })
    + softLight(c, 178, 162, 20, 5, { angle: -8, opacity: .45 })
    + port(c, 184, 165, 4.6) + port(c, 210, 165, 4.6) + port(c, 236, 165, 4.6)
    + glints(c, [[184, 165], [210, 165], [236, 165]], 4.6)
    + bar(c, 158, 171.5, 104, 11.5, GOLD, 5));
}

function nose(c) {
  const far = 'M160 68A50 13 0 0 1 260 68';
  const near = 'M160 68A50 13 0 0 0 260 68';
  const tilt = art => art && group(art, { transform: 'rotate(-18 210 68)' });
  const tube = (d, fill) => raw(c, 'path', { d, fill: 'none', stroke: edge(c.color), 'stroke-width': 9.6 })
    + raw(c, 'path', { d, fill: 'none', stroke: fill, 'stroke-width': 6.4 });
  return feature('deep-space-array',
    tilt(c.blueprint ? c.ellipse(210, 68, 50, 13, 'none') : tube(far, tone(c.color, -.3)))
    + c.line(210, 50, 210, 25, edge(STEEL), 5.2) + c.line(210, 50, 210, 25, STEEL, 3)
    + ball(c, 210, 20, 4.8, GOLD, { spec: false })
    + (c.blueprint ? c.circle(210, 68, 22, 'none')
      : raw(c, 'circle', { cx: 210, cy: 68, r: 22, fill: radial(c, [[0, '#9af0e8'], [.4, GLASS_MID], [1, GLASS_DEEP]], [.5, .5, .58, .36, .3]), stroke: GLASS_DEEP, 'stroke-width': 1.8 })
        + raw(c, 'circle', { cx: 210, cy: 68, r: 15, fill: radial(c, [[0, AMBER, .9], [.55, AMBER, .3], [1, AMBER, 0]]) })
        + raw(c, 'path', { d: star(210, 68, 10.5, 4.8), fill: GOLD, stroke: edge(GOLD), 'stroke-width': 1, 'stroke-linejoin': 'round' })
        + raw(c, 'path', { d: 'M192.5 62A19 19 0 0 1 203 50.5', fill: 'none', stroke: WHITE, 'stroke-opacity': .65, 'stroke-width': 2.6 })
        + specular(c, 197.5, 56, 3, 1.6, -40))
    + cylinder(c, 192, 82, 36, 26, { rx: 7, shine: false })
    + bar(c, 189, 80, 42, 6, GOLD, 3, false)
    + dots(c, [[201, 95.5]], GREEN, 3.4) + dots(c, [[210, 95.5]], AMBER, 3.4) + dots(c, [[219, 95.5]], ICE, 3.4)
    + tilt(c.blueprint ? '' : tube(near, linear(c, ramp(c.color, TOP), [0, 0, 0, 1]))
      + raw(c, 'path', { d: 'M163.5 71.2A50 13 0 0 0 217.8 79.2', fill: 'none', stroke: WHITE, 'stroke-opacity': .45, 'stroke-width': 1.6 }))
    + ball(c, 162.5, 83.5, 6.5, GOLD, { spec: false }) + ball(c, 257.5, 52.5, 6.5, GOLD, { spec: false })
    + dots(c, [[208.1, 18], [159.9, 80.8], [254.9, 49.8]], WHITE, 2)
    + bar(c, 190, 104, 40, 11, GOLD, 4)
    + studs(c, [[196, 109.5], [224, 109.5]]));
}

const PODTRIM = 'M56 204H90Q92 204 94 206L108 220Q110 222 110 225V285Q110 288 108 290L94 304Q92 306 90 306H56Q54 306 52 304L38 290Q36 288 36 285V225Q36 222 38 220L52 206Q54 204 56 204Z';

function podShell(c) {
  const shell = 'M56 197H90Q94 197 97 200L113 216Q116 219 116 223V287Q116 291 113 294L97 310Q94 313 90 313H56Q52 313 49 310L33 294Q30 291 30 287V223Q30 219 33 216L49 200Q52 197 56 197Z';
  return bar(c, 106, 229, 16, 38, STEEL, 6)
    + cylinder(c, 30, 197, 86, 116, { path: shell, shine: false, rim: false })
    + softLight(c, lit(c) < 0 ? 54 : 92, 224, 22, 16, { angle: 35 * lit(c), opacity: .45 })
    + bevel(c, lit(c) < 0 ? 'M47.5 206L38.5 215' : 'M98.5 206L107.5 215')
    + rimLight(c, lit(c) < 0 ? 'M116 225V285' : 'M30 225V285', { base: c.color, width: 1.6 })
    + raw(c, 'path', { d: PODTRIM, fill: 'none', stroke: GOLD, 'stroke-width': 2.2 })
    + hazard(c, 48, 299, 50, 6);
}

function sciencePod(c) {
  const jars = [[GREEN, 0], [AMBER, 1], [ICE, 2], ['#ff8fb0', 3]];
  return feature('science-pod',
    c.line(73, 182, 73, 172, edge(STEEL), 3.6) + c.line(73, 182, 73, 172, STEEL, 2)
    + ball(c, 73, 170, 3.6, GOLD)
    + podShell(c)
    + dome(c, 73, 198, 20, 17, { fill: STEEL })
    + raw(c, 'path', { d: 'M71 198L71.2 184.6Q73 183 74.8 184.6L75 198Z', fill: GLASS_DEEP })
    + dots(c, [[73, 188]], WHITE, 1.6)
    + port(c, 73, 232, 21)
    + raw(c, 'circle', { cx: 71, cy: 233, r: 6.2, fill: radial(c, WARM, [.4, .35, .7]) })
    + raw(c, 'ellipse', { cx: 71, cy: 233, rx: 11.5, ry: 3, fill: 'none', stroke: LILAC, 'stroke-width': 1.5, transform: 'rotate(-22 71 233)' })
    + dots(c, [[63, 223], [82, 225], [84, 241], [62, 242]], WHITE, 1.4)
    + glints(c, [[73, 232]], 21)
    + bar(c, 46, 260, 54, 32, STEEL, 7, false)
    + jars.map(([color, index]) => raw(c, 'rect', { x: 49.5 + index * 12.5, y: 264, width: 9, height: 24, rx: 3, fill: color, stroke: edge(color), 'stroke-width': 1.2 })).join('')
    + raw(c, 'path', { d: jars.map(([, index]) => `M${num(52.2 + index * 12.5)} 268V283`).join(''), fill: 'none', stroke: WHITE, 'stroke-opacity': .6, 'stroke-width': 1.4 })
    + lamp(c, 45, 222, 2.4, { color: GREEN }));
}

function habitatPod(c) {
  const panes = [0, 1, 2].map(index => raw(c, 'rect', {
    x: 46 + index * 19.5, y: 219, width: 15, height: 12, rx: 3.5, fill: radial(c, WARM, [.5, .5, .6, .4, .4]), stroke: tone('#e8892f', -.5), 'stroke-width': 1,
  })).join('');
  return feature('habitat-pod',
    podShell(c)
    + dome(c, 73, 198, 22, 20, { fill: GLASS_MID })
    + raw(c, 'path', { d: 'M73 198V186M73 190Q65 188 63 182Q70 183 73 190M73 188Q80 185 83 179Q76 180 73 188', fill: 'none', stroke: GREEN, 'stroke-width': 2.2 })
    + bar(c, 42, 215, 62, 20, STEEL, 8)
    + panes
    + lamp(c, 73, 246, 2.6, { color: AMBER })
    + bar(c, 57, 253, 32, 44, STEEL, 9, false)
    + bar(c, 60, 256, 12.6, 38, PAPER, 5, false) + bar(c, 73.4, 256, 12.6, 38, PAPER, 5, false)
    + raw(c, 'path', { d: 'M73 256V294', fill: 'none', stroke: tone(PAPER, -.55), 'stroke-width': 1.3 })
    + raw(c, 'rect', { x: 64, y: 261, width: 18, height: 9, rx: 4, fill: linear(c, SKY, diagonal(c)), stroke: GLASS_DEEP, 'stroke-width': 1 })
    + dots(c, [[69.4, 282], [76.6, 282]], GOLD, 3.2));
}

export const class5Art = Object.freeze({
  engine, body, cockpit, nose, leftFin: sciencePod, rightFin: c => mirror3d(c, 420, habitatPod),
});
