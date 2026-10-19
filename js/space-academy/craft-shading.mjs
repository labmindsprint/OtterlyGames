/*
 * craft-shading.mjs - the shared "soft 3D toy" shading kit for the Otterly Space Academy crafts.
 *
 * LOOK: one light for every craft: key light upper-left, soft fill lower-right, a thin rim light on the
 * shadow edge. Forms get a smooth volume gradient, a crisp specular glint, a cool core shadow and a
 * tone-on-tone outline (never pure black). Inside a mirrored part the lit side is flipped for you.
 *
 * RULES (enforced by scripts/space-academy-crafts.test.mjs): gradients only for fitted modules, ids
 * `sa-g-<grade>-<part>-<paint>-<w|f>-<n>` created here, `<defs>` live inside the module group, no filters,
 * masks, clip paths, images, styles, animation, scripts or href. Blueprint ghosts stay dashed silhouettes:
 * every primitive returns only its dashed outline when `c.blueprint` is true.
 *
 * `c` is the brush made by createBrush() (see campaign-crafts.mjs moduleArt). Every primitive takes `c`
 * first, then geometry, then an optional options object `o`. All return SVG strings. Fill colours default
 * to the paint (`c.color`). Draw back to front: flames first, then housings, bells, rivets.
 *
 * COLOUR
 *   tone(hex, amount)              amount -1..1: negative = cool deep shade, positive = warm light tint.
 *                                  tone(c.color, -.4)
 *   mixHex(a, b, t)                blend two hex colours. mixHex(GOLD, '#ff7a2e', .3)
 *   shades(hex)                    { spec, hi, light, base, mid, shade, deep, edge } ready-made tones.
 *                                  const t = shades(c.color); c.path(d, t.light, t.edge, 2)
 *   INK PAPER STEEL GLASS GOLD PANEL GHOST      the shared palette (strings).
 *   GLASS_DEEP GLASS_MID GLASS_LIGHT            the deep-teal glass ramp.
 *
 * MARKUP HELPERS (same behaviour as the old private helpers of campaign-crafts.mjs)
 *   num(v)                         round to 0.01 and trim; throws on NaN/Infinity. `M${num(x)} ${num(y)}`
 *   escape(v) attributes(obj) group(art, attrs) mirror(width, art) feature(name, art)
 *                                  feature('radio-dish', art) wraps art in <g data-feature="radio-dish">.
 *   mirror3d(c, width, art)        like mirror() but flips the light: mirror3d(c, 420, leg => landerLeg(leg))
 *                                  (art may be a string or a function that receives c). Use it for every
 *                                  right-hand part so the key light stays upper-left on screen.
 *   polygon(points)                path data for [[x, y], ...]. polygon([[0, 0], [9, 0], [9, 4]])
 *   clipRect(points, x0, y0, x1, y1)  clip a polygon to a rectangle (there is no clipPath). clipRect(p, 0, 0, 9, 9)
 *
 * BRUSH AND GRADIENT REGISTRY
 *   createBrush(color, blueprint, flying, scope)   the brush used by campaign-crafts.mjs.
 *   createScope({ grade, part, paint, flying, blueprint })   per-module registry; scope.defs() -> '<defs>..</defs>'.
 *   linear(c, stops, [x1, y1, x2, y2], { user })   -> 'url(#sa-g-...)' fill value ('none' for blueprints).
 *                                  stops are [offset, colour, opacity?]. linear(c, [[0, '#fff'], [1, '#000']])
 *   radial(c, stops, [cx, cy, r, fx, fy], { user, transform })   radial(c, stops, [.4, .3, .7])
 *   litStops(c, stops)             flips stop offsets when the lit side is on the right (inside mirror3d).
 *
 * FORMS
 *   cylinder(c, x, y, w, h, o)     rounded rect/pill/tube with volume. o: fill, rx, axis 'y'|'x', path
 *                                  (custom silhouette, x/y/w/h still drive the shading), outline, width,
 *                                  shine false, rim false.   cylinder(c, 133, 302, 94, 23, { rx: 10 })
 *   frustum(c, cx, y, topW, botW, h, o)   cone / trapezoid. frustum(c, 210, 40, 30, 60, 50)
 *   dome(c, cx, baseY, rx, ry, o)  half-ellipse cap on a base line. dome(c, 180, 110, 50, 60)
 *   sphere(c, cx, cy, r, o)        ball (o.ry for an ellipse). sphere(c, 180, 60, 14, { fill: GOLD })
 *   bevelPanel(c, x, y, w, h, o)   bevelled plate. o: fill, rx, screws. bevelPanel(c, 20, 20, 80, 40)
 *   volume(c, d, o)                any silhouette path with a volume gradient. o: fill, axis 'across'|'down'|'diag'
 *                                  volume(c, 'M0 0H50V80Z', { fill: GOLD, axis: 'diag' })
 *   strut(c, x1, y1, x2, y2, width, o)    metal tube between two points. strut(c, 143, 219, 74, 267, 11)
 *   nozzleBell(c, x, y, w, h, o)   drop-in for the old nozzle(): banded steel bell with lip and glint.
 *                                  o.palette 'ion' glows blue in flight.   nozzleBell(c, 146, 324, 68, 49)
 *   glassLens(c, cx, cy, r, o)     porthole/lens: metal ring, deep teal glass, streak. o: frame, ring.
 *                                  glassLens(c, 180, 153, 35)
 *   glassPane(c, x, y, w, h, o)    rounded-rect window: metal frame, deep teal glass, diagonal streaks. o: rx,
 *                                  frame, ring.   glassPane(c, 179, 124, 62, 40, { rx: 16 })
 *   solarCells(c, x, y, w, h, o)   framed blue cell array with sweep. o: cols, rows, frame, inset.
 *                                  feature('solar-array', solarCells(c, 22, 180, 106, 108))
 *   wheel3d(c, cx, cy, r)          tyre + hub, wrapped in data-feature="wheel". wheel3d(c, 43, 305, 20)
 *
 * DETAILS (fitted only; they return '' for blueprints)
 *   shine(c, x, y, w, h, o)        glossy white strip fading out. shine(c, 140, 200, 6, 40)
 *   specular(c, cx, cy, rx, ry, angle, o)   crisp glint blob. specular(c, 150, 120, 8, 4, -32)
 *   rimLight(c, d, o)              thin bright line along a shadow-side path. rimLight(c, 'M236 200V280', { base })
 *   seam(c, d, o)                  engraved panel seam (dark + lit line). seam(c, 'M150 250H230')
 *   rivets(c, points, o)           bolts. rivets(c, [[150, 210], [170, 210]])
 *   vents(c, x, y, w, h, count, o) grille slots. vents(c, 160, 260, 40, 14, 4)
 *   hazardStripes(c, x, y, w, h, o)  yellow/dark chevron band wrapped on a cylinder.
 *   wrap(c, x, y, w, h, o)         light/shadow overlay that wraps a flat decal round a cylinder.
 *   contactShadow(c, cx, cy, rx, ry, o)   ambient-occlusion blob where parts meet. contactShadow(c, 180, 190, 40, 6)
 *   shadeBand(c, x, y, w, h, o)    soft dark band that fades out: ambient occlusion INSIDE a silhouette where it
 *                                  meets a neighbour. o.edge 'top'|'bottom'|'left'|'right' (darkest edge), opacity,
 *                                  color, rx.   shadeBand(c, 120, 191, 120, 16, { edge: 'top' })
 *   softLight(c, cx, cy, rx, ry, o)  soft white radial bloom for a glossy top-left sheen. o.opacity, color, angle.
 *                                  softLight(c, 150, 60, 30, 20, { angle: -30 })
 *   tint(c, d, o)                  flat translucent overlay polygon: a lit or shadowed facet on a gradient form.
 *                                  o.color (white by default), o.opacity. tint(c, 'M176 181H244L238 199H182Z', { opacity: .3 })
 *   glow(c, cx, cy, r, o)          emissive lamp/core with halo rings. o.color. glow(c, 180, 250, 8, { color: '#ffb84d' })
 *   lamp(c, cx, cy, r, o)          gradient-free status light (halo disc + bulb + glint), about 0.3 KB instead of
 *                                  glow's 0.7 KB. Use it for tiny lights. o.color. lamp(c, 169, 216, 2.4, { color: '#7dffb0' })
 *   flame3(c, x, y, w, h, o)       FLIGHT ONLY three-layer flame inside <g data-feature="exhaust">; x = centre,
 *                                  y = nozzle exit. o.palette 'fire' | 'ion'. flame3(c, 180, 373, 51, 40)
 *                                  Tongues carry data-flame="outer|mid|core" so CSS can flicker them apart.
 */

export const INK = '#293e58';
export const PAPER = '#fff6df';
export const STEEL = '#7e94a8';
export const GLASS = '#8ce1dd';
export const PANEL = '#294d76';
export const GOLD = '#edc47c';
export const GHOST = '#7698ad';
export const GLASS_DEEP = '#0e4357';
export const GLASS_MID = '#2a9ca3';
export const GLASS_LIGHT = '#6fe3dc';

const SHADOW = '#101a36';
const WHITE = '#ffffff';

export const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
export const attributes = values => Object.entries(values).filter(([, value]) => value !== undefined)
  .map(([name, value]) => `${name}="${escape(value)}"`).join(' ');
export const group = (art, values = {}) => `<g${Object.keys(values).length ? ` ${attributes(values)}` : ''}>${art}</g>`;
export const mirror = (width, art) => group(art, { transform: `translate(${width} 0) scale(-1 1)` });
export const feature = (name, art) => group(art, { 'data-feature': name });

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const lerp = (from, to, amount) => from + (to - from) * amount;

export function num(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(`Craft shading needs a finite number, not ${String(value)}.`);
  }
  return String(Math.round(value * 100) / 100).replace(/^(-?)0\./, '$1.');
}

const format = value => typeof value === 'number' ? num(value) : escape(value);
const attrs = values => Object.entries(values)
  .filter(([, value]) => value !== undefined && value !== null && value !== false)
  .map(([name, value]) => ` ${name}="${format(value)}"`).join('');
const shape = (tag, values) => `<${tag}${attrs(values)}/>`;

export const polygon = points => points.length < 3 ? ''
  : `M${points.map(([px, py]) => `${num(px)} ${num(py)}`).join('L')}Z`;

export function clipRect(points, x0, y0, x1, y1) {
  const edges = [
    [p => p[0] >= x0, (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]],
    [p => p[0] <= x1, (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0])]],
    [p => p[1] >= y0, (a, b) => [a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0]],
    [p => p[1] <= y1, (a, b) => [a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1]],
  ];
  let output = points;
  for (const [inside, cross] of edges) {
    const input = output;
    output = [];
    input.forEach((current, index) => {
      const previous = input[(index + input.length - 1) % input.length];
      if (inside(current)) {
        if (!inside(previous)) output.push(cross(previous, current));
        output.push(current);
      } else if (inside(previous)) output.push(cross(previous, current));
    });
    if (!output.length) break;
  }
  return output;
}

/* ---------- colour ---------- */

function parse(color) {
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(String(color));
  if (!match) throw new TypeError(`Craft shading needs a #rgb or #rrggbb colour, not ${String(color)}.`);
  const full = match[1].length === 3 ? [...match[1]].map(digit => digit + digit).join('') : match[1];
  return [0, 2, 4].map(at => parseInt(full.slice(at, at + 2), 16));
}
const hexOf = rgb => `#${rgb.map(value => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0')).join('')}`;
const WARM = [255, 249, 232];
const COOL = [.52, .55, .38];

export function mixHex(from, to, amount) {
  const a = parse(from);
  const b = parse(to);
  const t = clamp(amount, 0, 1);
  return hexOf(a.map((value, index) => lerp(value, b[index], t)));
}

export function tone(color, amount = 0) {
  const rgb = parse(color);
  const t = clamp(Math.abs(amount), 0, 1);
  if (amount >= 0) return hexOf(rgb.map((value, index) => lerp(value, WARM[index], t)));
  return hexOf(rgb.map((value, index) => value * (1 - t * COOL[index])));
}

export function shades(color) {
  return {
    spec: tone(color, .78), hi: tone(color, .5), light: tone(color, .26), base: color,
    mid: tone(color, -.2), shade: tone(color, -.4), deep: tone(color, -.58), edge: tone(color, -.64),
  };
}

/* ---------- brush and gradient registry ---------- */

export function createBrush(color, blueprint = false, flying = false, scope = null) {
  const drawn = (tag, geometry, fill = 'none', stroke = INK, width = 3) => shape(tag, {
    ...geometry, fill: blueprint ? 'none' : fill, stroke: blueprint ? GHOST : stroke,
    'stroke-width': blueprint ? 2 : width, 'stroke-dasharray': blueprint ? '6 5' : undefined,
  });
  return {
    color, blueprint, flying, scope,
    detail: art => blueprint ? '' : art,
    path: (d, fill = 'none', stroke = INK, width = 3) => drawn('path', { d }, fill, stroke, width),
    rect: (x, y, width, height, fill = PAPER, rx = 0, stroke = INK, lineWidth = 3) =>
      drawn('rect', { x, y, width, height, rx }, fill, stroke, lineWidth),
    circle: (cx, cy, r, fill = PAPER, stroke = INK, width = 3) =>
      drawn('circle', { cx, cy, r }, fill, stroke, width),
    ellipse: (cx, cy, rx, ry, fill = PAPER, stroke = INK, width = 3) =>
      drawn('ellipse', { cx, cy, rx, ry }, fill, stroke, width),
    line: (x1, y1, x2, y2, stroke = INK, width = 3) =>
      drawn('line', { x1, y1, x2, y2 }, 'none', stroke, width),
  };
}

const safe = value => String(value ?? 'x').toLowerCase().replace(/[^a-z\d]+/g, '-').replace(/^-+|-+$/g, '') || 'x';

export function createScope({ grade, part, paint, flying = false, blueprint = false } = {}) {
  const prefix = `sa-g-${safe(grade)}-${safe(part)}-${safe(paint)}-${flying ? 'f' : 'w'}-`;
  const defs = [];
  const known = new Map();
  const scope = { prefix, blueprint, lit: -1 };
  const register = (kind, values, stops) => {
    if (blueprint) return 'none';
    const body = stops.map(([offset, color, opacity]) => shape('stop', {
      offset, 'stop-color': color, 'stop-opacity': opacity === undefined || opacity === 1 ? undefined : opacity,
    })).join('');
    const key = `${kind}${attrs(values)}${body}`;
    if (!known.has(key)) {
      const id = `${prefix}${defs.length}`;
      known.set(key, id);
      defs.push(`<${kind}Gradient${attrs({ id, ...values })}>${body}</${kind}Gradient>`);
    }
    return `url(#${known.get(key)})`;
  };
  scope.linear = (stops, [x1 = 0, y1 = 0, x2 = 1, y2 = 0] = [], o = {}) => register('linear', o.user
    ? { x1, y1, x2, y2, gradientUnits: 'userSpaceOnUse' }
    : { x1: x1 === 0 ? undefined : x1, y1: y1 === 0 ? undefined : y1, x2: x2 === 1 ? undefined : x2, y2: y2 === 0 ? undefined : y2 },
  stops);
  scope.radial = (stops, [cx = .5, cy = .5, r = .5, fx = cx, fy = cy] = [], o = {}) => register('radial', o.user
    ? { cx, cy, r, fx, fy, gradientUnits: 'userSpaceOnUse', gradientTransform: o.transform }
    : { cx: cx === .5 ? undefined : cx, cy: cy === .5 ? undefined : cy, r: r === .5 ? undefined : r,
      fx: fx === cx ? undefined : fx, fy: fy === cy ? undefined : fy, gradientTransform: o.transform },
  stops);
  scope.flipped = fn => {
    scope.lit = -scope.lit;
    try { return fn(); } finally { scope.lit = -scope.lit; }
  };
  scope.defs = () => defs.length ? `<defs>${defs.join('')}</defs>` : '';
  return scope;
}

function need(c) {
  if (!c || !c.scope) throw new TypeError('Craft shading primitives need a brush created with a shading scope.');
  return c.scope;
}

export const linear = (c, stops, line = [0, 0, 1, 0], o = {}) => need(c).linear(stops, line, o);
export const radial = (c, stops, circle = [.5, .5, .5], o = {}) => need(c).radial(stops, circle, o);
const flip = stops => stops.map(([offset, ...rest]) => [1 - offset, ...rest]).reverse();
export const litStops = (c, stops) => need(c).lit < 0 ? stops : flip(stops);

export function mirror3d(c, width, art) {
  return mirror(width, typeof art === 'function' ? need(c).flipped(() => art(c)) : art);
}

/* ---------- tone ramps (amounts for tone()) ---------- */

const ACROSS = [[0, -.28], [.1, .08], [.24, .44], [.38, .16], [.55, 0], [.76, -.26], [.9, -.42], [.97, -.24], [1, -.34]];
const DOWN = [[0, -.2], [.1, .12], [.2, .46], [.34, .18], [.52, 0], [.72, -.26], [.88, -.42], [.96, -.22], [1, -.34]];
const DIAG = [[0, .34], [.38, .08], [.7, -.18], [1, -.42]];
const ORB = [[0, .62], [.2, .34], [.52, 0], [.8, -.28], [.94, -.46], [1, -.38]];
const METAL = [[0, -.3], [.1, -.22], [.16, .42], [.3, .46], [.36, .12], [.58, .02], [.66, -.2], [.84, -.38], [.9, -.5], [.95, -.18], [1, -.34]];
const ramp = (color, table) => table.map(([offset, amount, opacity]) => [offset, tone(color, amount), opacity]);
const FADE = [[0, WHITE, .85], [1, WHITE, 0]];
const FADE_DOWN = [0, 0, 0, 1];

const lineOf = (fill, o) => o.outline ?? tone(fill, -.62);
const inkWidth = o => o.width ?? 2.2;

/* ---------- forms ---------- */

export function cylinder(c, x, y, w, h, o = {}) {
  const fill = o.fill ?? c.color;
  const radius = o.rx ?? Math.min(w, h) * .2;
  if (c.blueprint) return o.path ? c.path(o.path, 'none') : c.rect(x, y, w, h, 'none', radius);
  const s = need(c);
  const upright = o.axis !== 'x';
  const body = upright ? linear(c, litStops(c, ramp(fill, ACROSS)))
    : linear(c, ramp(fill, DOWN), FADE_DOWN);
  let art = o.path ? c.path(o.path, body, lineOf(fill, o), inkWidth(o))
    : c.rect(x, y, w, h, body, radius, lineOf(fill, o), inkWidth(o));
  if (o.shine !== false) {
    if (upright) {
      const sw = Math.max(2.4, w * .09);
      const sx = s.lit < 0 ? x + w * .17 : x + w * .83 - sw;
      const sy = y + Math.max(radius * .6, h * .07);
      art += shape('rect', { x: sx, y: sy, width: sw, height: h * .46, rx: sw / 2, fill: linear(c, FADE, FADE_DOWN) })
        + shape('rect', { x: sx, y: sy + h * .46 + sw * 1.2, width: sw, height: sw, rx: sw / 2, fill: WHITE, 'fill-opacity': .6 });
    } else {
      const sw = Math.max(2.4, h * .09);
      const sx = x + Math.max(radius * .6, w * .07);
      art += shape('rect', { x: sx, y: y + h * .17, width: w * .46, height: sw, rx: sw / 2, fill: linear(c, FADE) })
        + shape('rect', { x: sx + w * .46 + sw * 1.2, y: y + h * .17, width: sw, height: sw, rx: sw / 2, fill: WHITE, 'fill-opacity': .6 });
    }
  }
  if (o.rim !== false) {
    const rim = upright
      ? `M${num(s.lit < 0 ? x + w - 2.8 : x + 2.8)} ${num(y + radius * .9 + 2)}V${num(y + h - radius * .9 - 2)}`
      : `M${num(x + radius * .9 + 2)} ${num(y + h - 2.8)}H${num(x + w - radius * .9 - 2)}`;
    art += rimLight(c, rim, { base: fill });
  }
  return art;
}

export function frustum(c, cx, y, topW, botW, h, o = {}) {
  const fill = o.fill ?? c.color;
  const d = `M${num(cx - topW / 2)} ${num(y)}H${num(cx + topW / 2)}L${num(cx + botW / 2)} ${num(y + h)}H${num(cx - botW / 2)}Z`;
  if (c.blueprint) return c.path(d, 'none');
  const s = need(c);
  const widthAt = t => lerp(topW, botW, t);
  const at = (t, f) => s.lit < 0 ? [cx - widthAt(t) / 2 + widthAt(t) * f, y + h * t] : [cx + widthAt(t) / 2 - widthAt(t) * f, y + h * t];
  let art = c.path(d, linear(c, litStops(c, ramp(fill, ACROSS))), lineOf(fill, o), inkWidth(o));
  if (o.shine !== false) {
    art += shape('path', { d: polygon([at(.08, .14), at(.08, .24), at(.66, .24), at(.66, .14)]), fill: linear(c, FADE, FADE_DOWN) });
  }
  if (o.rim !== false) {
    const inner = t => [cx - s.lit * (widthAt(t) / 2 - 2.6), y + h * t];
    const [ax, ay] = inner(.1);
    const [bx, by] = inner(.9);
    art += rimLight(c, `M${num(ax)} ${num(ay)}L${num(bx)} ${num(by)}`, { base: fill });
  }
  return art;
}

export function dome(c, cx, baseY, rx, ry, o = {}) {
  const fill = o.fill ?? c.color;
  const d = `M${num(cx - rx)} ${num(baseY)}A${num(rx)} ${num(ry)} 0 0 1 ${num(cx + rx)} ${num(baseY)}Z`;
  if (c.blueprint) return c.path(d, 'none');
  const s = need(c);
  const body = radial(c, ramp(fill, ORB), [0, 0, rx * 1.02, s.lit * .36 * rx, -.56 * rx],
    { user: true, transform: `translate(${num(cx)} ${num(baseY)}) scale(1 ${num(ry / rx)})` });
  let art = c.path(d, body, lineOf(fill, o), inkWidth(o));
  if (o.shine !== false) art += specular(c, cx + s.lit * rx * .42, baseY - ry * .68, Math.max(2.4, rx * .17), Math.max(1.4, rx * .09), -s.lit * 32);
  if (o.rim !== false) {
    const point = degrees => [cx - s.lit * (rx - 3.4) * Math.cos(degrees * Math.PI / 180), baseY - (ry - 3.4) * Math.sin(degrees * Math.PI / 180)];
    const [ax, ay] = point(10);
    const [bx, by] = point(58);
    art += rimLight(c, `M${num(ax)} ${num(ay)}A${num(rx - 3.4)} ${num(ry - 3.4)} 0 0 ${s.lit < 0 ? 0 : 1} ${num(bx)} ${num(by)}`, { base: fill });
  }
  return art;
}

export function sphere(c, cx, cy, r, o = {}) {
  const fill = o.fill ?? c.color;
  const ry = o.ry ?? r;
  if (c.blueprint) return ry === r ? c.circle(cx, cy, r, 'none') : c.ellipse(cx, cy, r, ry, 'none');
  const s = need(c);
  const body = radial(c, ramp(fill, ORB), [0, 0, r * 1.02, s.lit * .36 * r, -.38 * r],
    { user: true, transform: `translate(${num(cx)} ${num(cy)}) scale(1 ${num(ry / r)})` });
  let art = ry === r ? c.circle(cx, cy, r, body, lineOf(fill, o), inkWidth(o))
    : c.ellipse(cx, cy, r, ry, body, lineOf(fill, o), inkWidth(o));
  if (o.shine !== false && r >= 5) art += specular(c, cx + s.lit * r * .4, cy - ry * .44, Math.max(1.6, r * .24), Math.max(1, r * .13), -s.lit * 38);
  if (o.rim !== false && r >= 8) {
    const point = degrees => [cx - s.lit * (r - 3) * Math.cos(degrees * Math.PI / 180), cy + (ry - 3) * Math.sin(degrees * Math.PI / 180)];
    const [ax, ay] = point(-12);
    const [bx, by] = point(64);
    art += rimLight(c, `M${num(ax)} ${num(ay)}A${num(r - 3)} ${num(ry - 3)} 0 0 ${s.lit < 0 ? 1 : 0} ${num(bx)} ${num(by)}`, { base: fill });
  }
  return art;
}

export function bevelPanel(c, x, y, w, h, o = {}) {
  const fill = o.fill ?? c.color;
  const radius = o.rx ?? Math.min(w, h) * .14;
  if (c.blueprint) return c.rect(x, y, w, h, 'none', radius);
  const s = need(c);
  const body = linear(c, ramp(fill, DIAG), s.lit < 0 ? [0, 0, 1, 1] : [1, 0, 0, 1]);
  const light = tone(fill, .62);
  const dark = tone(fill, -.5);
  const lx = s.lit < 0 ? x + 1.8 : x + w - 1.8;
  const dx = s.lit < 0 ? x + w - 1.8 : x + 1.8;
  let art = c.rect(x, y, w, h, body, radius, lineOf(fill, o), inkWidth(o));
  art += shape('path', { d: `M${num(x + radius)} ${num(y + 1.8)}H${num(x + w - radius)}M${num(lx)} ${num(y + radius)}V${num(y + h - radius)}`, fill: 'none', stroke: light, 'stroke-opacity': .75, 'stroke-width': 1.4 });
  art += shape('path', { d: `M${num(x + radius)} ${num(y + h - 1.8)}H${num(x + w - radius)}M${num(dx)} ${num(y + radius)}V${num(y + h - radius)}`, fill: 'none', stroke: dark, 'stroke-opacity': .55, 'stroke-width': 1.4 });
  if (o.screws) {
    const inset = Math.max(4.5, radius * .7);
    art += rivets(c, [[x + inset, y + inset], [x + w - inset, y + inset], [x + inset, y + h - inset], [x + w - inset, y + h - inset]], { base: fill });
  }
  return art;
}

export function volume(c, d, o = {}) {
  const fill = o.fill ?? c.color;
  if (c.blueprint) return c.path(d, 'none');
  const axis = o.axis ?? 'across';
  const body = axis === 'down' ? linear(c, ramp(fill, DOWN), FADE_DOWN)
    : axis === 'diag' ? linear(c, ramp(fill, DIAG), need(c).lit < 0 ? [0, 0, 1, 1] : [1, 0, 0, 1])
      : linear(c, litStops(c, ramp(fill, ACROSS)));
  return c.path(d, body, lineOf(fill, o), inkWidth(o));
}

export function strut(c, x1, y1, x2, y2, width, o = {}) {
  const fill = o.fill ?? STEEL;
  const line = lineOf(fill, o);
  if (c.blueprint) return c.line(x1, y1, x2, y2, line, width);
  const s = need(c);
  const length = Math.hypot(x2 - x1, y2 - y1) || 1;
  let nx = -(y2 - y1) / length;
  let ny = (x2 - x1) / length;
  if (nx * s.lit * .62 + ny * -.78 < 0) { nx = -nx; ny = -ny; }
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const half = width / 2;
  const body = linear(c, [[0, tone(fill, -.42)], [.2, tone(fill, -.24)], [.46, fill], [.74, tone(fill, .5)], [.9, tone(fill, .1)], [1, tone(fill, -.1)]],
    [mx - nx * half, my - ny * half, mx + nx * half, my + ny * half], { user: true });
  const gx = nx * half * .46;
  const gy = ny * half * .46;
  const ux = (x2 - x1) * .18;
  const uy = (y2 - y1) * .18;
  return shape('line', { x1, y1, x2, y2, stroke: line, 'stroke-width': width + 2.6 })
    + shape('line', { x1, y1, x2, y2, stroke: body, 'stroke-width': width })
    + shape('line', { x1: x1 + gx + ux, y1: y1 + gy + uy, x2: x2 + gx - ux, y2: y2 + gy - uy, stroke: WHITE, 'stroke-opacity': .5, 'stroke-width': Math.max(1.2, width * .13) });
}

export function nozzleBell(c, x, y, width, height, o = {}) {
  const fill = o.fill ?? STEEL;
  const cx = x + width / 2;
  const left = x + width * .2;
  const right = x + width * .8;
  const bell = `M${num(left)} ${num(y)}H${num(right)}Q${num(x + width * .86)} ${num(y + height * .62)} ${num(x + width)} ${num(y + height)}H${num(x)}Q${num(x + width * .14)} ${num(y + height * .62)} ${num(left)} ${num(y)}Z`;
  if (c.blueprint) return c.path(bell, 'none');
  const s = need(c);
  const edge = lineOf(fill, o);
  const lipRy = Math.max(3, width * .085);
  const edgeX = t => {
    const u = (1.24 - Math.sqrt(1.5376 - .96 * t)) / .48;
    return (1 - u) ** 2 * left + 2 * (1 - u) * u * (x + width * .14) + u * u * x;
  };
  const arc = (t, sag) => `M${num(edgeX(t))} ${num(y + height * t)}Q${num(cx)} ${num(y + height * t + sag)} ${num(2 * cx - edgeX(t))} ${num(y + height * t)}`;
  const sag = width * .05;
  let art = c.path(bell, linear(c, litStops(c, ramp(fill, METAL))), edge, inkWidth(o));
  art += shape('rect', { x: left + 1, y: y + 1, width: right - left - 2, height: height * .2, fill: linear(c, [[0, SHADOW, .5], [1, SHADOW, 0]], FADE_DOWN) });
  art += shape('path', { d: `${arc(.3, sag)}${arc(.62, sag)}`, fill: 'none', stroke: tone(fill, -.55), 'stroke-width': 1.4 });
  art += shape('path', { d: `${arc(.3, sag)}${arc(.62, sag)}`, fill: 'none', stroke: tone(fill, .6), 'stroke-opacity': .6, 'stroke-width': 1, transform: 'translate(0 1.4)' });
  const ion = o.palette === 'ion';
  const heat = ion ? '#4fb8ff' : '#ff8a3a';
  art += shape('path', { d: `M${num(edgeX(.78))} ${num(y + height * .78)}Q${num(cx)} ${num(y + height * .78 + sag)} ${num(2 * cx - edgeX(.78))} ${num(y + height * .78)}L${num(x + width)} ${num(y + height)}H${num(x)}Z`, fill: linear(c, [[0, heat, 0], [1, heat, c.flying ? .62 : .3]], FADE_DOWN) });
  const hot = c.flying;
  art += shape('ellipse', { cx, cy: y + height, rx: width / 2 - .6, ry: lipRy, fill: radial(c, hot
    ? (ion ? [[0, '#f4fdff'], [.45, '#7fd3ff'], [1, '#14407a']] : [[0, '#fff6d8'], [.45, '#ffb347'], [1, '#6a2410']])
    : [[0, '#4b3a3c'], [.55, '#241c2c'], [1, '#12121f']], [.5, .4, .55]),
  stroke: tone(fill, .38), 'stroke-width': 1.8 });
  art += shape('ellipse', { cx, cy: y + height, rx: width / 2 - 3, ry: Math.max(1.6, lipRy - 2.2), fill: 'none', stroke: tone(fill, -.5), 'stroke-opacity': .55, 'stroke-width': 1 });
  const gx = s.lit < 0 ? x + width * .27 : x + width * .73;
  const gx2 = s.lit < 0 ? x + width * .2 : x + width * .8;
  art += shape('path', { d: `M${num(gx)} ${num(y + height * .1)}L${num(gx2)} ${num(y + height * .56)}`, fill: 'none', stroke: WHITE, 'stroke-opacity': .7, 'stroke-width': 2.2 });
  art += sparkle(c, gx + (s.lit < 0 ? 1 : -1), y + height * .09, Math.max(3, width * .07));
  return art;
}

export function glassLens(c, cx, cy, r, o = {}) {
  const frame = o.frame ?? STEEL;
  if (c.blueprint) return c.circle(cx, cy, r, 'none');
  const s = need(c);
  const ring = o.ring ?? Math.max(2.6, r * .2);
  const g = r - ring;
  const lit = s.lit;
  const edge = tone(frame, -.62);
  let art = c.circle(cx, cy, r, linear(c, ramp(frame, [[0, .56], [.32, .18], [.55, 0], [.8, -.3], [1, -.5]]), lit < 0 ? [0, 0, 1, 1] : [1, 0, 0, 1]), edge, 2);
  art += shape('circle', { cx, cy, r: g + .8, fill: tone(frame, -.6) });
  art += shape('circle', { cx, cy, r: g, fill: radial(c, [[0, '#5fd8d0'], [.45, GLASS_MID], [.85, '#15677a'], [1, GLASS_DEEP]],
    [cx - lit * g * .22, cy + g * .28, g * 1.3, cx - lit * g * .22, cy + g * .28], { user: true }), stroke: GLASS_DEEP, 'stroke-width': 1 });
  art += shape('circle', { cx, cy, r: g - 1.6, fill: 'none', stroke: GLASS_DEEP, 'stroke-opacity': .5, 'stroke-width': 1.6 });
  const p = (px, py) => [cx + lit * px * g, cy + py * g];
  art += shape('path', { d: polygon([p(.56, -.3), p(.14, -.66), p(.02, -.52), p(.46, -.1)]), fill: WHITE, 'fill-opacity': .5 });
  art += shape('path', { d: polygon([p(.3, .02), p(-.1, -.32), p(-.04, -.26), p(.36, .08)]), fill: WHITE, 'fill-opacity': .3 });
  art += shape('path', { d: `M${num(cx - lit * g * .5)} ${num(cy + g * .58)}A${num(g * .76)} ${num(g * .76)} 0 0 ${lit < 0 ? 1 : 0} ${num(cx - lit * g * .08)} ${num(cy + g * .75)}`, fill: 'none', stroke: GLASS_LIGHT, 'stroke-opacity': .5, 'stroke-width': 1.3 });
  return art;
}

export function glassPane(c, x, y, w, h, o = {}) {
  const frame = o.frame ?? STEEL;
  const radius = o.rx ?? Math.min(w, h) * .3;
  if (c.blueprint) return c.rect(x, y, w, h, 'none', radius);
  const s = need(c);
  const ring = o.ring ?? Math.max(2.6, Math.min(w, h) * .09);
  const lit = s.lit;
  const diagonal = lit < 0 ? [0, 0, 1, 1] : [1, 0, 0, 1];
  const gx = x + ring;
  const gy = y + ring;
  const gw = w - ring * 2;
  const gh = h - ring * 2;
  const gr = Math.max(1, radius - ring);
  let art = c.rect(x, y, w, h, linear(c, ramp(frame, [[0, .56], [.32, .18], [.55, 0], [.8, -.3], [1, -.5]]), diagonal), radius, tone(frame, -.62), 2);
  art += shape('rect', { x: gx - .8, y: gy - .8, width: gw + 1.6, height: gh + 1.6, rx: gr + .8, fill: tone(frame, -.6) });
  art += shape('rect', { x: gx, y: gy, width: gw, height: gh, rx: gr, stroke: GLASS_DEEP, 'stroke-width': 1,
    fill: linear(c, [[0, '#5fd8d0'], [.4, GLASS_MID], [.8, '#15677a'], [1, GLASS_DEEP]], diagonal) });
  art += shape('rect', { x: gx + 1.6, y: gy + 1.6, width: gw - 3.2, height: gh - 3.2, rx: Math.max(.5, gr - 1.6), fill: 'none', stroke: GLASS_DEEP, 'stroke-opacity': .5, 'stroke-width': 1.6 });
  const slant = gh * .6;
  const inset = gr * .55;
  const sweep = (offset, width) => polygon(clipRect(lit < 0
    ? [[gx + offset, gy + gh], [gx + offset + width, gy + gh], [gx + offset + width + slant, gy], [gx + offset + slant, gy]]
    : [[gx + gw - offset, gy + gh], [gx + gw - offset - width, gy + gh], [gx + gw - offset - width - slant, gy], [gx + gw - offset - slant, gy]],
  gx + inset, gy + inset, gx + gw - inset, gy + gh - inset));
  art += shape('path', { d: sweep(gw * .12, gw * .14), fill: WHITE, 'fill-opacity': .42 });
  art += shape('path', { d: sweep(gw * .34, gw * .05), fill: WHITE, 'fill-opacity': .26 });
  art += shape('path', { d: `M${num(gx + gr)} ${num(gy + gh - 2.4)}H${num(gx + gw - gr)}`, fill: 'none', stroke: GLASS_LIGHT, 'stroke-opacity': .45, 'stroke-width': 1.3 });
  return art;
}

export function solarCells(c, x, y, w, h, o = {}) {
  const frame = o.frame ?? c.color;
  const inset = o.inset ?? 6;
  const cols = o.cols ?? 3;
  const rows = o.rows ?? 3;
  if (c.blueprint) return c.rect(x, y, w, h, 'none', 5);
  const s = need(c);
  const ix = x + inset;
  const iy = y + inset;
  const iw = w - inset * 2;
  const ih = h - inset * 2;
  let art = bevelPanel(c, x, y, w, h, { fill: frame, rx: 5, screws: o.screws });
  art += shape('rect', { x: ix, y: iy, width: iw, height: ih, rx: 2, stroke: '#0c2a55', 'stroke-width': 1.6,
    fill: linear(c, [[0, '#5aaaf5'], [.38, '#2f78d4'], [.72, '#1d4e9e'], [1, '#12336f']], s.lit < 0 ? [0, 0, 1, 1] : [1, 0, 0, 1]) });
  let grid = '';
  for (let column = 1; column < cols; column++) grid += `M${num(ix + iw * column / cols)} ${num(iy)}V${num(iy + ih)}`;
  for (let row = 1; row < rows; row++) grid += `M${num(ix)} ${num(iy + ih * row / rows)}H${num(ix + iw)}`;
  let busbars = '';
  for (let column = 0; column < cols; column++) busbars += `M${num(ix + iw * (column + .5) / cols)} ${num(iy + 1.5)}V${num(iy + ih - 1.5)}`;
  art += shape('path', { d: busbars, fill: 'none', stroke: '#9fd0ff', 'stroke-opacity': .2, 'stroke-width': 1 });
  art += shape('path', { d: grid, fill: 'none', stroke: '#a9d6ff', 'stroke-opacity': .62, 'stroke-width': 1.3 });
  const slant = ih * .7;
  const sweep = (offset, width) => {
    const polygonPoints = s.lit < 0
      ? [[ix + offset, iy + ih], [ix + offset + width, iy + ih], [ix + offset + width + slant, iy], [ix + offset + slant, iy]]
      : [[ix + iw - offset, iy + ih], [ix + iw - offset - width, iy + ih], [ix + iw - offset - width - slant, iy], [ix + iw - offset - slant, iy]];
    return polygon(clipRect(polygonPoints, ix, iy, ix + iw, iy + ih));
  };
  art += shape('path', { d: sweep(iw * .1, iw * .2), fill: WHITE, 'fill-opacity': .24 });
  art += shape('path', { d: sweep(iw * .36, iw * .06), fill: WHITE, 'fill-opacity': .16 });
  return art;
}

export function wheel3d(c, cx, cy, r) {
  if (c.blueprint) return feature('wheel', c.circle(cx, cy, r, 'none'));
  let tread = '';
  for (let step = 0; step < 14; step++) {
    const angle = step * Math.PI / 7;
    tread += `M${num(cx + Math.cos(angle) * r * .8)} ${num(cy + Math.sin(angle) * r * .8)}L${num(cx + Math.cos(angle) * r * .97)} ${num(cy + Math.sin(angle) * r * .97)}`;
  }
  const s = need(c);
  let art = c.circle(cx, cy, r, radial(c, [[0, '#46506a'], [.7, '#2a3249'], [1, '#161c2e']], [cx, cy, r, cx + s.lit * r * .3, cy - r * .3], { user: true }), '#0f1424', 2);
  art += shape('path', { d: tread, fill: 'none', stroke: '#566180', 'stroke-width': Math.max(1.4, r * .09) });
  art += shape('circle', { cx, cy, r: r * .72, fill: 'none', stroke: '#566180', 'stroke-opacity': .7, 'stroke-width': 1.1 });
  art += sphere(c, cx, cy, r * .52, { fill: STEEL, shine: false, rim: false, width: 1.6 });
  art += rivets(c, [0, 1, 2, 3, 4].map(step => [cx + Math.cos(step * Math.PI * .4 - 1.2) * r * .33, cy + Math.sin(step * Math.PI * .4 - 1.2) * r * .33]), { base: STEEL, r: Math.max(.9, r * .06) });
  art += sphere(c, cx, cy, r * .17, { fill: GOLD, width: 1.2 });
  art += specular(c, cx + s.lit * r * .5, cy - r * .6, r * .15, r * .07, -s.lit * 40, { opacity: .6 });
  return feature('wheel', art);
}

/* ---------- details ---------- */

export function specular(c, cx, cy, rx, ry, angle = -32, o = {}) {
  if (c.blueprint) return '';
  return shape('ellipse', { cx, cy, rx, ry, fill: WHITE, 'fill-opacity': o.opacity ?? .85, transform: angle ? `rotate(${num(angle)} ${num(cx)} ${num(cy)})` : undefined });
}

function sparkle(c, cx, cy, size) {
  if (c.blueprint) return '';
  const a = size;
  const b = size * .22;
  return shape('path', { d: `M${num(cx)} ${num(cy - a)}L${num(cx + b)} ${num(cy - b)}L${num(cx + a)} ${num(cy)}L${num(cx + b)} ${num(cy + b)}L${num(cx)} ${num(cy + a)}L${num(cx - b)} ${num(cy + b)}L${num(cx - a)} ${num(cy)}L${num(cx - b)} ${num(cy - b)}Z`, fill: WHITE, 'fill-opacity': .95 });
}

export function shine(c, x, y, w, h, o = {}) {
  if (c.blueprint) return '';
  return shape('rect', { x, y, width: w, height: h, rx: Math.min(w, h) / 2, fill: linear(c, [[0, WHITE, o.opacity ?? .85], [1, WHITE, 0]], o.across ? [0, 0, 1, 0] : FADE_DOWN) });
}

export function rimLight(c, d, o = {}) {
  if (c.blueprint) return '';
  return shape('path', { d, fill: 'none', stroke: tone(o.base ?? c.color, .5), 'stroke-opacity': o.opacity ?? .55, 'stroke-width': o.width ?? 1.5 });
}

export function seam(c, d, o = {}) {
  if (c.blueprint) return '';
  const s = need(c);
  const base = o.base ?? c.color;
  return shape('path', { d, fill: 'none', stroke: tone(base, -.55), 'stroke-width': o.width ?? 1.4 })
    + shape('path', { d, fill: 'none', stroke: tone(base, .6), 'stroke-opacity': .7, 'stroke-width': Math.max(.8, (o.width ?? 1.4) * .7), transform: `translate(${num(-s.lit * .9)} 1.1)` });
}

export function rivets(c, points, o = {}) {
  if (c.blueprint) return '';
  const base = o.base ?? STEEL;
  const r = o.r ?? 1.7;
  const s = need(c);
  const fill = radial(c, [[0, tone(base, .8)], [.5, base], [1, tone(base, -.4)]], [.5 + s.lit * .12, .38, .6]);
  return points.map(([px, py]) => shape('circle', { cx: px, cy: py, r, fill, stroke: tone(base, -.62), 'stroke-width': .7 })).join('');
}

export function vents(c, x, y, w, h, count = 4, o = {}) {
  if (c.blueprint) return '';
  const base = o.base ?? c.color;
  const gap = h / count;
  const slot = Math.max(1.8, gap * .5);
  let art = '';
  for (let index = 0; index < count; index++) {
    const top = y + gap * index + (gap - slot) / 2;
    art += shape('rect', { x, y: top + 1, width: w, height: slot, rx: slot / 2, fill: tone(base, .5), 'fill-opacity': .7 })
      + shape('rect', { x, y: top, width: w, height: slot, rx: slot / 2, fill: tone(base, -.6) });
  }
  return art;
}

export function wrap(c, x, y, w, h, o = {}) {
  if (c.blueprint) return '';
  const stops = [[0, SHADOW, .14], [.2, WHITE, .32], [.36, WHITE, .06], [.55, WHITE, 0], [.78, SHADOW, .2], [.92, SHADOW, .34], [1, SHADOW, .16]];
  return shape('rect', { x, y, width: w, height: h, rx: o.rx ?? 0, fill: linear(c, litStops(c, stops)) });
}

export function hazardStripes(c, x, y, w, h, o = {}) {
  if (c.blueprint) return '';
  const pitch = o.pitch ?? h * 1.1;
  const light = o.light ?? '#f6c944';
  const dark = o.dark ?? '#2b3550';
  let stripes = '';
  for (let at = x - h; at < x + w; at += pitch) {
    stripes += polygon(clipRect([[at, y + h], [at + pitch / 2, y + h], [at + pitch / 2 + h, y], [at + h, y]], x, y, x + w, y + h));
  }
  return shape('rect', { x, y, width: w, height: h, fill: light, stroke: tone(dark, -.2), 'stroke-width': 1.4 })
    + shape('path', { d: stripes, fill: dark })
    + wrap(c, x, y, w, h);
}

export function contactShadow(c, cx, cy, rx, ry, o = {}) {
  if (c.blueprint) return '';
  return shape('ellipse', { cx, cy, rx, ry, fill: radial(c, [[0, SHADOW, o.opacity ?? .5], [1, SHADOW, 0]]) });
}

export function shadeBand(c, x, y, w, h, o = {}) {
  if (c.blueprint) return '';
  const color = o.color ?? SHADOW;
  const line = { top: [0, 0, 0, 1], bottom: [0, 1, 0, 0], left: [0, 0, 1, 0], right: [1, 0, 0, 0] }[o.edge ?? 'bottom'];
  if (!line) throw new RangeError(`shadeBand edge must be top, bottom, left or right, not ${String(o.edge)}.`);
  return shape('rect', { x, y, width: w, height: h, rx: o.rx, fill: linear(c, [[0, color, o.opacity ?? .4], [1, color, 0]], line) });
}

export function softLight(c, cx, cy, rx, ry, o = {}) {
  if (c.blueprint) return '';
  const color = o.color ?? WHITE;
  return shape('ellipse', { cx, cy, rx, ry, fill: radial(c, [[0, color, o.opacity ?? .5], [1, color, 0]]),
    transform: o.angle ? `rotate(${num(o.angle)} ${num(cx)} ${num(cy)})` : undefined });
}

export function tint(c, d, o = {}) {
  if (c.blueprint) return '';
  return shape('path', { d, fill: o.color ?? WHITE, 'fill-opacity': o.opacity ?? .25 });
}

export function glow(c, cx, cy, r, o = {}) {
  if (c.blueprint) return '';
  const color = o.color ?? '#ffb84d';
  return shape('circle', { cx, cy, r: r * 2.5, fill: radial(c, [[0, color, .6], [.45, color, .22], [1, color, 0]]) })
    + shape('circle', { cx, cy, r: r * 1.5, fill: 'none', stroke: color, 'stroke-opacity': .5, 'stroke-width': 1.4 })
    + shape('circle', { cx, cy, r, fill: radial(c, [[0, WHITE], [.45, tone(color, .55)], [1, color]]) });
}

export function lamp(c, cx, cy, r, o = {}) {
  if (c.blueprint) return '';
  const color = o.color ?? '#ffb84d';
  return shape('circle', { cx, cy, r: r * 2.1, fill: color, 'fill-opacity': .24 })
    + shape('circle', { cx, cy, r, fill: tone(color, .2), stroke: tone(color, -.55), 'stroke-width': .7 })
    + shape('circle', { cx: cx - r * .28, cy: cy - r * .3, r: r * .4, fill: WHITE, 'fill-opacity': .9 });
}

const FLAMES = {
  fire: { outer: ['#ffa12e', '#ff5a1f'], mid: ['#fff08a', '#ffb62e'], core: ['#ffffff', '#fff1b0'], halo: '#ff8a2e' },
  ion: { outer: ['#6fc4ff', '#2f6fff'], mid: ['#d4f4ff', '#7fd0ff'], core: ['#ffffff', '#e6fbff'], halo: '#58b6ff' },
};

export function flame3(c, x, y, w, h, o = {}) {
  if (!c.flying || c.blueprint) return '';
  const palette = FLAMES[o.palette] ?? FLAMES.fire;
  const tongue = (width, length) => `M${num(x - width / 2)} ${num(y)}C${num(x - width * .6)} ${num(y + length * .34)} ${num(x - width * .2)} ${num(y + length * .74)} ${num(x)} ${num(y + length)}C${num(x + width * .2)} ${num(y + length * .74)} ${num(x + width * .6)} ${num(y + length * .34)} ${num(x + width / 2)} ${num(y)}Z`;
  const layer = ([top, bottom]) => linear(c, [[0, top], [.55, bottom, .9], [1, bottom, 0]], FADE_DOWN);
  return feature('exhaust',
    shape('ellipse', { cx: x, cy: y + h * .3, rx: w * 1.1, ry: h * .56, fill: radial(c, [[0, palette.halo, .5], [1, palette.halo, 0]]) })
    + shape('path', { d: tongue(w, h), fill: layer(palette.outer), 'data-flame': 'outer' })
    + shape('path', { d: tongue(w * .64, h * .72), fill: layer(palette.mid), 'data-flame': 'mid' })
    + shape('path', { d: tongue(w * .32, h * .44), fill: layer(palette.core), 'data-flame': 'core' }));
}
