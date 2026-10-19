// Star Navigator (class-3): soft-3D drawing code. Slot centres follow the original flat art; the joints sit on the mast
// flange, cabin collar, hull flange and wing hinge knuckles drawn here. The nose is an eight-ray compass star on a mast
// and the cruise engine burns an ion flame in flight.
import {
  PAPER, STEEL, GOLD, GLASS_MID, GLASS_DEEP, num, tone, feature, mirror3d, linear, radial, polygon, clipRect,
  cylinder, volume, bevelPanel, strut, glassLens, specular, rimLight, rivets, contactShadow, lamp, nozzleBell, tint, flame3,
} from './craft-shading.mjs';

const WIDTH = 400;
const SHADOW = '#101a36';
const RED = '#ff5368';
const GREEN = '#7dffb0';
const CYAN = '#7df0ff';
const AMBER = '#ffb84d';
const ORB = [[0, .62], [.2, .34], [.52, 0], [.8, -.28], [.94, -.46], [1, -.38]];
const HULL = 'M172 174H228Q233 174 235 179L252 233Q254 239 253 245L244 298Q243 304 238 307Q222 316 200 316Q178 316 162 307Q157 304 156 298L147 245Q146 239 148 233L165 179Q167 174 172 174Z';
const SHELL = 'M164 187L162 148Q166 121 200 101Q234 121 238 148L236 187Z';
const FRAME = 'M173 179V148Q175 127 200 113Q225 127 227 148V179Z';
const PANE = 'M178.5 173V149Q180.5 132 200 120Q219.5 132 221.5 149V173Z';
const WING = 'M146 212L70 227Q60 229 56 238L30 298Q27 306 35 305L146 284Z';
const KNUCKLES = [[149, 222], [148, 250], [147, 276]];

const el = (tag, values) => `<${tag}${Object.entries(values).filter(([, value]) => value !== undefined)
  .map(([name, value]) => ` ${name}="${typeof value === 'number' ? num(value) : value}"`).join('')}/>`;
const tenth = value => Math.round(value * 10) / 10;
const polar = (radius, degrees) => [tenth(200 + Math.sin(degrees * Math.PI / 180) * radius), tenth(58 - Math.cos(degrees * Math.PI / 180) * radius)];
const spark = (cx, cy, long, short = long * .26) => `M${num(cx)} ${num(cy - long)}L${num(cx + short)} ${num(cy - short)}L${num(cx + long)} ${num(cy)}L${num(cx + short)} ${num(cy + short)}L${num(cx)} ${num(cy + long)}L${num(cx - short)} ${num(cy + short)}L${num(cx - long)} ${num(cy)}L${num(cx - short)} ${num(cy - short)}Z`;
const glint = (c, d, width = 3, opacity = .55) => c.detail(el('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-opacity': opacity, 'stroke-width': width, 'stroke-linecap': 'round' }));

// Round ball with one shared bounding-box gradient (the kit's sphere builds a new gradient for every ball).
function ball(c, cx, cy, r, fill = c.color, glare = true) {
  if (c.blueprint) return c.circle(cx, cy, r, 'none');
  const lit = c.scope.lit;
  return c.circle(cx, cy, r, radial(c, ORB.map(([at, amount]) => [at, tone(fill, amount)]), [.5, .5, .51, .5 + lit * .18, .31]), tone(fill, -.62), 1.6)
    + (glare ? specular(c, cx + lit * r * .4, cy - r * .44, r * .24, r * .13, -lit * 38) : '');
}

const glassFill = c => linear(c, [[0, '#5fd8d0'], [.4, GLASS_MID], [.8, '#15677a'], [1, GLASS_DEEP]], c.scope.lit < 0 ? [0, 0, 1, 1] : [1, 0, 0, 1]);

// Eight-ray compass star around (200, 58): long cardinal rays, short diagonal rays.
const RAYS = [36, 26, 33, 26, 33, 26, 33, 26];
const STAR = polygon(RAYS.flatMap((radius, index) => [polar(18, index * 45 - 22.5), polar(radius, index * 45)]));

function starFacets(c) {
  const lightX = c.scope.lit * .6;
  const score = face => (face.reduce((sum, [x]) => sum + x, 0) / 3 - 200) * lightX - (face.reduce((sum, [, y]) => sum + y, 0) / 3 - 58) * .8;
  const bright = [];
  const dim = [];
  RAYS.forEach((radius, index) => {
    const centre = [200, 58];
    const tip = polar(radius, index * 45);
    const faces = [[centre, polar(18, index * 45 - 22.5), tip], [centre, tip, polar(18, index * 45 + 22.5)]].sort((a, b) => score(b) - score(a));
    bright.push(polygon(faces[0]));
    dim.push(polygon(faces[1]));
  });
  return tint(c, bright.join(''), { opacity: .32 }) + tint(c, dim.join(''), { color: SHADOW, opacity: .24 });
}

function nose(c) {
  return feature('star-navigation-array',
    cylinder(c, 194, 80, 12, 33, { fill: STEEL, rx: 3, shine: false, rim: false })
    + c.detail(contactShadow(c, 200, 115, 17, 3, { opacity: .5 }))
    + cylinder(c, 186, 104, 28, 9, { axis: 'x', fill: STEEL, rx: 4, shine: false })
    + c.detail(rivets(c, [[196, 108], [204, 108]], { base: STEEL }))
    + volume(c, STAR, { axis: 'diag' })
    + starFacets(c)
    + c.detail(ball(c, 200, 58, 18, c.color, false))
    + glassLens(c, 200, 58, 13.5, { frame: GOLD, ring: 3.4 })
    + c.detail(el('circle', { cx: 200, cy: 58, r: 7, fill: '#ffe08a', 'fill-opacity': .3 })
      + el('path', { d: spark(200, 58, 8), fill: '#fff3b0' })));
}

function cockpit(c) {
  const sweep = (offset, width) => polygon(clipRect([[178.5 + offset, 173], [178.5 + offset + width, 173], [178.5 + offset + width + 20, 138], [178.5 + offset + 20, 138]], 178.5, 138, 221.5, 173));
  return c.detail(cylinder(c, 194, 97, 12, 14, { fill: STEEL, rx: 3, shine: false, rim: false }))
    + volume(c, SHELL, { fill: PAPER })
    + glint(c, 'M169 150Q171 129 187 113', 3.2, .6)
    + c.detail(volume(c, FRAME, { axis: 'across' })
      + c.path(PANE, glassFill(c), GLASS_DEEP, 1.4)
      + el('path', { d: sweep(4, 9), fill: '#ffffff', 'fill-opacity': .36 })
      + el('path', { d: 'M184 148Q186 134 197 126', fill: 'none', stroke: '#ffffff', 'stroke-opacity': .5, 'stroke-width': 2.2, 'stroke-linecap': 'round' })
      + el('path', { d: 'M187 158L197 149L207 154L211 141', fill: 'none', stroke: '#ffe9a8', 'stroke-opacity': .6, 'stroke-width': .9, 'stroke-linejoin': 'round' })
      + [[187, 158, 1.7], [197, 149, 1.4], [207, 154, 1.6]].map(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#fff3b0' })).join('')
      + el('path', { d: spark(211, 141, 5.6), fill: '#fff3b0' })
      + el('path', { d: PANE, fill: 'none', stroke: GOLD, 'stroke-width': 1.3, 'stroke-opacity': .9 })
      + rivets(c, [[167.5, 158], [167.5, 168], [232.5, 158], [232.5, 168]], { base: STEEL })
      + contactShadow(c, 200, 180, 36, 3.6, { opacity: .5 }))
    + cylinder(c, 160, 181, 80, 10, { axis: 'x', fill: STEEL, rx: 5 })
    + c.detail(rivets(c, [[182, 186], [218, 186]], { base: STEEL }));
}

const knuckle = (c, x, y) => cylinder(c, x - 5, y - 8, 10, 16, { fill: STEEL, rx: 4, shine: false, rim: false });

// Hazard belt without the kit's cylinder-wrap gradient: the shading comes from the end caps and a top highlight.
function belt(c, x, y, w, h, pitch) {
  let stripes = '';
  for (let at = x - h; at < x + w; at += pitch) {
    stripes += polygon(clipRect([[at, y + h], [at + pitch / 2, y + h], [at + pitch / 2 + h, y], [at + h, y]], x, y, x + w, y + h));
  }
  return el('rect', { x, y, width: w, height: h, rx: 1.5, fill: '#f6c944', stroke: '#1b2540', 'stroke-width': 1.4 })
    + el('path', { d: stripes, fill: '#2b3550' })
    + el('rect', { x: x + 1, y: y + .6, width: w - 2, height: 1.6, rx: .8, fill: '#ffffff', 'fill-opacity': .38 })
    + el('rect', { x, y, width: 4, height: h, fill: '#101a36', 'fill-opacity': .26 })
    + el('rect', { x: x + w - 4, y, width: 4, height: h, fill: '#101a36', 'fill-opacity': .26 });
}

function body(c) {
  return volume(c, HULL)
    + glint(c, 'M168 187L153 229', 3.4, .55)
    + c.detail(el('path', { d: 'M166 236Q162 264 164 289M234 236Q238 264 236 289', fill: 'none', stroke: tone(c.color, -.45), 'stroke-opacity': .65, 'stroke-width': 1.2, 'stroke-linecap': 'round' })
      + contactShadow(c, 200, 184, 40, 6, { opacity: .5 })
      + cylinder(c, 172, 170, 56, 12, { axis: 'x', fill: STEEL, rx: 5, shine: false })
      + cylinder(c, 181, 198, 38, 90, { fill: PAPER, rx: 17 })
      + volume(c, 'M200 205L217 224L200 243L183 224Z', { fill: GOLD, axis: 'diag' })
      + c.path('M200 212L210.5 224L200 236L189.5 224Z', glassFill(c), GLASS_DEEP, 1.2)
      + el('path', { d: spark(195, 219.5, 3.6), fill: '#ffffff', 'fill-opacity': .85 })
      + el('rect', { x: 194, y: 250, width: 12, height: 34, rx: 6, fill: tone(PAPER, -.7), stroke: tone(PAPER, -.3), 'stroke-width': 1.2 })
      + lamp(c, 200, 257, 2.8, { color: CYAN }) + lamp(c, 200, 267, 2.8, { color: CYAN }) + lamp(c, 200, 277, 2.8, { color: AMBER })
      + belt(c, 162, 292, 76, 8, 12)
      + contactShadow(c, 200, 309, 40, 5, { opacity: .5 })
      + KNUCKLES.map(([x, y]) => knuckle(c, x, y) + knuckle(c, WIDTH - x, y)).join('')
      + cylinder(c, 172, 311, 56, 13, { axis: 'x', fill: STEEL, rx: 5 })
      + rivets(c, [[188, 318], [212, 318]], { base: STEEL })
      + lamp(c, 200, 320, 3.2, { color: CYAN }));
}

function engine(c) {
  return flame3(c, 200, 392, 46, 34, { palette: 'ion' })
    + volume(c, 'M172 326L151 366Q149 371 155 371L172 366Z', { axis: 'diag' })
    + volume(c, 'M228 326L249 366Q251 371 245 371L228 366Z', { axis: 'diag' })
    + c.detail(el('path', { d: 'M171 332L155 364M229 332L245 364', fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round' }))
    + c.detail(cylinder(c, 183, 306, 34, 16, { fill: STEEL, rx: 5, shine: false, rim: false })
      + rivets(c, [[190, 316], [210, 316]], { base: STEEL }))
    + cylinder(c, 169, 318, 62, 28, { rx: 10, shine: false })
    + c.detail(el('rect', { x: 188, y: 328, width: 24, height: 12, rx: 6, fill: GLASS_DEEP, stroke: STEEL, 'stroke-width': 2 })
      + lamp(c, 200, 334, 3.4, { color: CYAN }))
    + cylinder(c, 161, 341, 78, 13, { axis: 'x', fill: PAPER, rx: 6 })
    + c.detail(lamp(c, 172, 347.5, 2.8, { color: CYAN }) + lamp(c, 228, 347.5, 2.8, { color: CYAN }))
    + nozzleBell(c, 170, 350, 60, 42, { palette: 'ion' });
}

function wing(c, lampColor) {
  return c.detail(el('path', { d: WING, transform: 'translate(0 5)', fill: tone(c.color, -.5), stroke: tone(c.color, -.64), 'stroke-width': 2.2 }))
    + volume(c, WING, { axis: 'diag' })
    + rimLight(c, 'M144 215L73 228.5', { base: c.color, opacity: .6, width: 1.6 })
    + c.detail(el('path', { d: 'M141 221L74 234', fill: 'none', stroke: tone(c.color, -.62), 'stroke-width': 6.4, 'stroke-linecap': 'round' })
      + el('path', { d: 'M141 221L74 234', fill: 'none', stroke: PAPER, 'stroke-width': 4, 'stroke-linecap': 'round' })
      + el('path', { d: spark(116, 273, 8), fill: GOLD, stroke: tone(GOLD, -.55), 'stroke-width': 1, 'stroke-linejoin': 'round' })
      + strut(c, 92, 259, 136, 248, 8)
      + bevelPanel(c, 133, 211, 18, 75, { fill: STEEL, rx: 5 })
      + rivets(c, KNUCKLES.map(([, y]) => [140, y]), { base: STEEL })
      + lamp(c, 43, 291, 4.2, { color: lampColor }))
    + ball(c, 72, 262, 21, PAPER)
    + glassLens(c, 72, 262, 14.5, { frame: GOLD, ring: 3.6 });
}

export const class3Art = Object.freeze({
  engine,
  body,
  cockpit,
  nose,
  leftFin: c => wing(c, RED),
  rightFin: c => mirror3d(c, WIDTH, mirrored => wing(mirrored, GREEN)),
});
