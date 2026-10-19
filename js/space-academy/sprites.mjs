import { INK, PAPER, GREEN, ORANGE, circle, line, path, rect, text } from './diagram-kit.mjs';

// Shared space-academy art for question pictures. Every sprite is drawn in a 48 x 48 box in one flat style
// (INK outline, bright fills, light highlights) and uses plain SVG only: no ids, gradients, <use> or <style>.

const num = value => String(Math.round(value * 100) / 100);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

export const TINTS = Object.freeze({
  coral: '#e0735a', sky: '#6fb4e8', gold: '#f2c14e', mint: '#7fcfae', purple: '#9b83d1', rose: '#e58fa6',
  orange: ORANGE, green: GREEN, slate: '#8895aa', paper: PAPER, navy: '#14284a',
});

const HEX = /^#[0-9a-f]{6}$/i;
const hex = value => {
  if (!HEX.test(String(value))) throw new Error(`Sprite colours must look like #rrggbb, not ${value}`);
  return String(value).toLowerCase();
};
const channels = colour => [1, 3, 5].map(index => parseInt(colour.slice(index, index + 2), 16));
const mix = (from, to, amount) => {
  const a = channels(from);
  const b = channels(to);
  return `#${a.map((value, index) => Math.round(value + (b[index] - value) * amount).toString(16).padStart(2, '0')).join('')}`;
};
export const lighter = (colour, amount = 0.4) => mix(hex(colour), '#ffffff', amount);
export const darker = (colour, amount = 0.2) => mix(hex(colour), INK, amount);

function pen(ink, sw) {
  const outline = width => `stroke="${ink}" stroke-width="${num(width ?? sw)}" stroke-linejoin="round" stroke-linecap="round"`;
  return {
    sw,
    path: (d, fill, width) => `<path d="${d}" fill="${fill}" ${outline(width)}/>`,
    shape: (d, fill) => `<path d="${d}" fill="${fill}"/>`,
    trace: (d, width, colour = ink) => `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${num(width ?? sw)}" stroke-linecap="round" stroke-linejoin="round"/>`,
    circle: (cx, cy, radius, fill, width) => `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(radius)}" fill="${fill}" ${outline(width)}/>`,
    dot: (cx, cy, radius, fill) => `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(radius)}" fill="${fill}"/>`,
    ellipse: (cx, cy, rx, ry, fill, width, turn = 0) => `<ellipse cx="${num(cx)}" cy="${num(cy)}" rx="${num(rx)}" ry="${num(ry)}" fill="${fill}" ${outline(width)}${turn ? ` transform="rotate(${num(turn)} ${num(cx)} ${num(cy)})"` : ''}/>`,
    rect: (x, y, w, h, radius, fill, width) => `<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" rx="${num(radius)}" fill="${fill}" ${outline(width)}/>`,
    line: (x1, y1, x2, y2, width, colour = ink) => `<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke="${colour}" stroke-width="${num(width ?? sw)}" stroke-linecap="round"/>`,
  };
}

function starPath(cx, cy, outer, inner, points = 5) {
  const corners = Array.from({ length: points * 2 }, (_, index) => {
    const radius = index % 2 ? inner : outer;
    const angle = (-90 + index * 180 / points) * Math.PI / 180;
    return `${num(cx + radius * Math.cos(angle))} ${num(cy + radius * Math.sin(angle))}`;
  });
  return `M${corners.join('L')}Z`;
}

// The part of a circle between two horizontal lines, for planet stripes (no clip paths needed).
function slice(cx, cy, radius, y1, y2) {
  const half = y => Math.sqrt(Math.max(0, radius * radius - (y - cy) ** 2));
  const a = half(y1);
  const b = half(y2);
  return `M${num(cx - a)} ${num(y1)}H${num(cx + a)}A${radius} ${radius} 0 0 1 ${num(cx + b)} ${num(y2)}H${num(cx - b)}A${radius} ${radius} 0 0 1 ${num(cx - a)} ${num(y1)}Z`;
}

const SPRITES = {
  rocket: {
    label: 'rocket', fill: PAPER, accent: TINTS.coral,
    draw: (p, fill, accent) => [
      p.path('M24 38C27.6 40.8 27.8 44.2 24 46.2C20.2 44.2 20.4 40.8 24 38Z', TINTS.gold),
      p.path('M16 24C11.6 26.2 9 31 9 38.4L16 34.4Z', accent),
      p.path('M32 24C36.4 26.2 39 31 39 38.4L32 34.4Z', accent),
      p.path('M16.6 14H31.4L32.4 34H15.6Z', fill),
      p.path('M24 2.6C28.2 5.6 30.8 9.8 31.6 14H16.4C17.2 9.8 19.8 5.6 24 2.6Z', accent),
      p.circle(24, 23.5, 4.8, '#bfe6f7'),
      p.dot(22.4, 21.9, 1.3, '#ffffff'),
      p.path('M18.4 34H29.6L28.2 38.2H19.8Z', TINTS.slate),
    ].join(''),
  },
  star: {
    label: 'star', fill: TINTS.gold, accent: null,
    draw: (p, fill, accent) => [
      p.path(starPath(24, 25.4, 21, 9.6), fill),
      p.shape(starPath(24, 25.4, 11.2, 5.2), accent ?? lighter(fill, 0.55)),
    ].join(''),
  },
  planet: {
    label: 'planet', fill: TINTS.sky, accent: '#3f86c9',
    draw: (p, fill, accent) => [
      p.circle(24, 24, 18, fill),
      p.shape(slice(24, 24, 18, 15.5, 21), accent),
      p.shape(slice(24, 24, 18, 26, 29.5), accent),
      p.circle(24, 24, 18, 'none'),
      p.dot(16.8, 15.4, 2.4, lighter(fill, 0.6)),
    ].join(''),
  },
  'ringed-planet': {
    label: 'ringed planet', fill: '#e8a45a', accent: '#fff0c7',
    draw: (p, fill, accent) => {
      const ring = turn => `${p.trace(`M3 24A21 7.2 0 0 ${turn} 45 24`, 4.6 + 2 * p.sw)}${p.trace(`M3 24A21 7.2 0 0 ${turn} 45 24`, 4.6, accent)}`;
      return [
        `<g transform="rotate(-18 24 24)">${ring(1)}</g>`,
        p.circle(24, 24, 12.5, fill),
        p.dot(19.6, 19.4, 2.3, lighter(fill, 0.6)),
        `<g transform="rotate(-18 24 24)">${ring(0)}</g>`,
      ].join('');
    },
  },
  moon: {
    label: 'moon', fill: '#d5dae3', accent: '#aeb7c7',
    draw: (p, fill, accent) => [
      p.circle(24, 24, 18.5, fill),
      p.ellipse(16.4, 17.2, 4.6, 3.8, accent, p.sw * 0.6, -20),
      p.circle(30.6, 21.8, 3.1, accent, p.sw * 0.6),
      p.ellipse(21.4, 31.4, 4.2, 3.4, accent, p.sw * 0.6, 15),
      p.circle(32.4, 32.4, 1.9, accent, p.sw * 0.6),
    ].join(''),
  },
  crystal: {
    label: 'crystal', fill: TINTS.purple, accent: null,
    draw: (p, fill) => [
      p.path('M15 6.5H33L43 17.5L24 42.5L5 17.5Z', fill),
      p.shape('M15 6.5H33L29.2 17.5H18.8Z', lighter(fill, 0.5)),
      p.shape('M15 6.5L18.8 17.5H5Z', lighter(fill, 0.22)),
      p.shape('M33 6.5L43 17.5H29.2Z', darker(fill, 0.1)),
      p.shape('M5 17.5H18.8L24 42.5Z', darker(fill, 0.08)),
      p.shape('M29.2 17.5H43L24 42.5Z', darker(fill, 0.24)),
      p.trace('M5 17.5H43M15 6.5L18.8 17.5L24 42.5L29.2 17.5L33 6.5', p.sw * 0.6),
      p.path('M15 6.5H33L43 17.5L24 42.5L5 17.5Z', 'none'),
    ].join(''),
  },
  'fuel-cell': {
    label: 'fuel cell', fill: TINTS.mint, accent: TINTS.gold,
    draw: (p, fill, accent) => [
      p.rect(18.5, 3.5, 11, 7, 2, TINTS.slate),
      p.rect(12, 9, 24, 35, 5, fill),
      p.rect(12, 20, 24, 14, 0, PAPER),
      p.path('M25.8 21.6L19.6 28.2H23.6L22.2 33L28.4 26.4H24.4Z', accent, p.sw * 0.6),
    ].join(''),
  },
  crate: {
    label: 'crate', fill: '#d9a35f', accent: null,
    draw: (p, fill) => [
      p.rect(5, 8, 38, 34, 3, fill),
      p.rect(10.5, 13.5, 27, 23, 1.5, lighter(fill, 0.28), p.sw * 0.6),
      p.line(10.5, 13.5, 37.5, 36.5, p.sw * 0.6),
      p.line(37.5, 13.5, 10.5, 36.5, p.sw * 0.6),
    ].join(''),
  },
  alien: {
    label: 'alien', fill: '#7fcf8a', accent: TINTS.gold,
    draw: (p, fill, accent) => [
      p.line(17.5, 14.5, 13, 6.6),
      p.line(30.5, 14.5, 35, 6.6),
      p.circle(12.4, 5.6, 2.8, accent),
      p.circle(35.6, 5.6, 2.8, accent),
      p.ellipse(24, 27, 17, 14.5, fill),
      p.ellipse(18, 25.5, 4.8, 6, PAPER, p.sw * 0.8),
      p.ellipse(30, 25.5, 4.8, 6, PAPER, p.sw * 0.8),
      p.dot(18.8, 26.6, 2.4, INK),
      p.dot(29.2, 26.6, 2.4, INK),
      p.dot(19.6, 25, 0.9, '#ffffff'),
      p.dot(30, 25, 0.9, '#ffffff'),
      p.trace('M19.5 35Q24 39 28.5 35', p.sw * 0.8),
    ].join(''),
  },
  otter: {
    label: 'otter', fill: '#a9754f', accent: TINTS.coral,
    draw: (p, fill, accent) => [
      p.circle(10.5, 13.5, 4.6, fill),
      p.circle(37.5, 13.5, 4.6, fill),
      p.dot(10.5, 13.9, 1.9, darker(fill, 0.35)),
      p.dot(37.5, 13.9, 1.9, darker(fill, 0.35)),
      p.ellipse(24, 25.5, 17.5, 15.5, fill),
      p.ellipse(24, 31, 10.5, 7.8, '#f3dfc1', p.sw * 0.7),
      p.ellipse(24, 27.6, 3.4, 2.4, INK, p.sw * 0.4),
      p.trace('M24 30V32.4M20.6 33.2Q24 36.4 27.4 33.2', p.sw * 0.7),
      p.dot(17.4, 21.4, 2.3, INK),
      p.dot(30.6, 21.4, 2.3, INK),
      p.dot(18.1, 20.6, 0.8, '#ffffff'),
      p.dot(31.3, 20.6, 0.8, '#ffffff'),
      p.line(15.5, 30.5, 6.5, 28.5, p.sw * 0.5),
      p.line(15.5, 33, 6.5, 34.5, p.sw * 0.5),
      p.line(32.5, 30.5, 41.5, 28.5, p.sw * 0.5),
      p.line(32.5, 33, 41.5, 34.5, p.sw * 0.5),
      p.path('M12.5 38.2Q24 44.6 35.5 38.2L36.6 42.6Q24 46.8 11.4 42.6Z', accent),
    ].join(''),
  },
  rover: {
    label: 'rover', fill: TINTS.sky, accent: TINTS.gold,
    draw: (p, fill, accent) => [
      p.line(31, 12, 31, 5.4),
      p.circle(31, 4.6, 2.4, accent),
      p.path('M15.5 21V15.2Q15.5 12.4 18.3 12.4H29.4Q31.2 12.4 32.2 14.2L35 21Z', PAPER),
      p.path('M18.6 20.2V15.8Q18.6 15 19.4 15H27.6Q28.4 15 28.8 15.8L30.8 20.2Z', '#bfe6f7', p.sw * 0.5),
      p.rect(6, 20.5, 36, 11.5, 3.5, fill),
      p.dot(38.6, 26, 1.6, accent),
      p.circle(13, 36.6, 5.4, '#46556d'),
      p.circle(24, 36.6, 5.4, '#46556d'),
      p.circle(35, 36.6, 5.4, '#46556d'),
      p.dot(13, 36.6, 1.9, PAPER),
      p.dot(24, 36.6, 1.9, PAPER),
      p.dot(35, 36.6, 1.9, PAPER),
    ].join(''),
  },
  satellite: {
    label: 'satellite', fill: TINTS.gold, accent: TINTS.sky,
    draw: (p, fill, accent) => [
      p.line(15.2, 24, 17.5, 24),
      p.line(30.5, 24, 32.8, 24),
      p.line(24, 15, 24, 9.5),
      p.path('M18.4 8.4Q24 1.6 29.6 8.4Z', PAPER),
      p.rect(2.6, 17.2, 12.6, 13.6, 1.5, accent),
      p.line(8.9, 17.2, 8.9, 30.8, p.sw * 0.55),
      p.line(2.6, 24, 15.2, 24, p.sw * 0.55),
      p.rect(32.8, 17.2, 12.6, 13.6, 1.5, accent),
      p.line(39.1, 17.2, 39.1, 30.8, p.sw * 0.55),
      p.line(32.8, 24, 45.4, 24, p.sw * 0.55),
      p.rect(17.5, 15, 13, 18, 2.5, fill),
      p.circle(24, 24, 3.4, PAPER, p.sw * 0.7),
    ].join(''),
  },
  ufo: {
    label: 'UFO', fill: TINTS.slate, accent: TINTS.gold,
    draw: (p, fill, accent) => [
      p.line(15, 31.5, 12.5, 38.5),
      p.line(33, 31.5, 35.5, 38.5),
      p.path('M15 22C15 8.8 33 8.8 33 22Z', '#cfeaf6'),
      p.circle(24, 16.8, 4.4, '#7fcf8a', p.sw * 0.7),
      p.dot(22.4, 16.4, 0.9, INK),
      p.dot(25.6, 16.4, 0.9, INK),
      p.ellipse(24, 25.5, 21, 8.2, fill),
      p.circle(11.5, 26.6, 2.2, accent, p.sw * 0.5),
      p.circle(24, 29.4, 2.2, accent, p.sw * 0.5),
      p.circle(36.5, 26.6, 2.2, accent, p.sw * 0.5),
    ].join(''),
  },
  asteroid: {
    label: 'asteroid', fill: '#b9b2a2', accent: '#968e7c',
    draw: (p, fill, accent) => [
      p.path('M9.6 15.4L19.2 6.4L32.6 8.2L42 18.6L39.4 33L29 42L14.6 40.2L6 28.4Z', fill),
      p.circle(19.6, 19.4, 4.4, accent, p.sw * 0.6),
      p.circle(31.6, 27.6, 3.4, accent, p.sw * 0.6),
      p.circle(17.2, 32.8, 2.5, accent, p.sw * 0.6),
    ].join(''),
  },
  comet: {
    label: 'comet', fill: PAPER, accent: '#f2a65a',
    draw: (p, fill, accent) => [
      p.path('M30.5 7.5Q9 12 3.5 43Q27 33.5 41 20Z', accent),
      p.shape('M30.5 13.5Q16 19 10.5 36Q26.5 29 37 19.5Z', lighter(accent, 0.55)),
      p.circle(34.5, 14.5, 9.5, fill),
      p.dot(31.6, 11.6, 2, '#d0d6e2'),
      p.dot(38, 18.2, 1.6, '#d0d6e2'),
    ].join(''),
  },
  flag: {
    label: 'flag', fill: TINTS.coral, accent: TINTS.slate,
    draw: (p, fill, accent) => [
      p.ellipse(13, 43.6, 8.4, 2.8, accent),
      p.line(13, 4.6, 13, 43, p.sw + 0.6),
      p.path('M13 6H39L32.4 14.2L39 22.4H13Z', fill),
      p.dot(21.2, 14.2, 3.2, '#ffffff'),
    ].join(''),
  },
  coin: {
    label: 'coin', fill: TINTS.gold, accent: null,
    draw: (p, fill, accent) => [
      p.circle(24, 24, 18.6, fill),
      p.circle(24, 24, 13.4, 'none', p.sw * 0.6),
      p.path(starPath(24, 24.8, 8, 3.6), accent ?? lighter(fill, 0.55), p.sw * 0.6),
    ].join(''),
  },
  sun: {
    label: 'sun', fill: '#f5c542', accent: '#f2994a',
    draw: (p, fill, accent) => {
      const rays = Array.from({ length: 8 }, (_, index) => {
        const angle = index * Math.PI / 4;
        const point = (radius, turn = 0) => `${num(24 + radius * Math.cos(angle + turn))} ${num(24 + radius * Math.sin(angle + turn))}`;
        return p.path(`M${point(22.4)}L${point(13, 0.4)}L${point(13, -0.4)}Z`, accent);
      });
      return [...rays, p.circle(24, 24, 13.4, fill), p.dot(19.6, 19.8, 2.8, lighter(fill, 0.6))].join('');
    },
  },
  astronaut: {
    label: 'astronaut', fill: PAPER, accent: TINTS.coral,
    draw: (p, fill, accent) => [
      p.circle(6.4, 24.5, 3.6, accent),
      p.circle(41.6, 24.5, 3.6, accent),
      p.circle(24, 24, 17.5, fill),
      p.ellipse(24, 25, 12.2, 10.4, '#25395a', p.sw * 0.8),
      p.trace('M16.8 21.4Q18 18.8 21.6 18', p.sw * 0.9, '#bfe6f7'),
      p.dot(20.2, 25.6, 1.8, '#ffffff'),
      p.dot(27.8, 25.6, 1.8, '#ffffff'),
      p.trace('M20.4 29.6Q24 32.4 27.6 29.6', p.sw * 0.6, '#ffffff'),
    ].join(''),
  },
};

export const SPRITE_NAMES = Object.freeze(Object.keys(SPRITES));

export function spriteName(name, count = 1) {
  if (!SPRITES[name]) throw new Error(`Unknown space sprite: ${name}`);
  const label = SPRITES[name].label;
  return count === 1 ? label : `${label}s`;
}

// Draws one sprite with its top-left corner at (x, y). fill is the main colour and accent the second one.
export function sprite(name, x, y, size = 40, { fill, accent, ink = INK, rotate = 0, flip = false } = {}) {
  const spec = SPRITES[name];
  if (!spec) throw new Error(`Unknown space sprite: ${name}`);
  if (![x, y, size, rotate].every(Number.isFinite) || size <= 0) throw new Error(`Invalid sprite placement for ${name}`);
  const scale = size / 48;
  const outlineWidth = clamp(105 / size, 2.2, 3.6);
  const main = hex(fill ?? spec.fill);
  const second = accent ?? spec.accent;
  let body = spec.draw(pen(hex(ink), outlineWidth), main, second === null ? null : hex(second));
  if (flip) body = `<g transform="translate(48 0) scale(-1 1)">${body}</g>`;
  if (rotate) body = `<g transform="rotate(${num(rotate)} 24 24)">${body}</g>`;
  return `<g transform="translate(${num(x)} ${num(y)}) scale(${Math.round(scale * 10000) / 10000})">${body}</g>`;
}

export const spriteSpan = (count, size, gap = 6) => count > 0 ? count * size + (count - 1) * gap : 0;

export function spriteRow(name, count, x, y, size = 36, gap = 6, options = {}) {
  return Array.from({ length: count }, (_, index) => sprite(name, x + index * (size + gap), y, size, options)).join('');
}

export function spriteGrid(name, count, columns, x, y, size = 36, gap = 6, options = {}) {
  return Array.from({ length: count }, (_, index) =>
    sprite(name, x + (index % columns) * (size + gap), y + Math.floor(index / columns) * (size + gap), size, options)).join('');
}

// Top-left corners for count objects that never overlap: each object gets its own jittered grid cell.
export function scatter(r, count, { width, height, size, gap = 6, margin = 6 }) {
  const columns = Math.floor((width - margin * 2) / (size + gap));
  const rows = Math.floor((height - margin * 2) / (size + gap));
  if (columns < 1 || rows < 1 || count > columns * rows) throw new Error(`scatter: no room for ${count} objects of size ${size} in ${width}x${height}`);
  const cellWidth = (width - margin * 2) / columns;
  const cellHeight = (height - margin * 2) / rows;
  return r.shuffle(Array.from({ length: columns * rows }, (_, index) => index)).slice(0, count).map(index => ({
    x: Math.round(margin + (index % columns) * cellWidth + r.int(0, Math.floor(cellWidth - size - gap))),
    y: Math.round(margin + Math.floor(index / columns) * cellHeight + r.int(0, Math.floor(cellHeight - size - gap))),
  }));
}

// A ten-frame (or any columns x rows frame). filled is a count, or a list of cell numbers (row by row from 0).
export function tenFrame(filled, x, y, { cell = 36, columns = 5, rows = 2, name = 'star', options = {} } = {}) {
  const on = Array.isArray(filled) ? new Set(filled) : new Set(Array.from({ length: filled }, (_, index) => index));
  const parts = [];
  for (let index = 0; index < columns * rows; index++) {
    const cx = x + (index % columns) * cell;
    const cy = y + Math.floor(index / columns) * cell;
    parts.push(rect(cx, cy, cell, cell, { fill: PAPER, strokeWidth: 2 }));
    if (on.has(index)) parts.push(sprite(name, cx + 4, cy + 4, cell - 8, options));
  }
  parts.push(rect(x, y, columns * cell, rows * cell, { fill: 'none', strokeWidth: 3.5 }));
  return parts.join('');
}

const HOP = '#a8681f';

export const numberLineX = (value, { min, max, x = 30, width = 420 }) => x + (value - min) / (max - min) * width;

// Ticks and labels from min to max. marks: [{ at, sprite, fill, accent, size }]; hops: [{ from, to, label }];
// hideLabels lists values whose label is left blank for the child to find. Labels are at least 16 units high.
// A hop that starts or ends on a sprite starts or lands on top of that sprite instead of crossing it.
// Leave about 100 units above y for sprites with hops and 45 below it for the labels.
export function numberLine(config) {
  const { min, max, x = 30, y = 130, width = 420, step = 1, labelEvery = 1, labelSize = 16, hideLabels = [], marks = [], hops = [] } = config;
  if (!(max > min) || !(step > 0)) throw new Error('numberLine needs max > min and a positive step.');
  const at = value => numberLineX(value, { min, max, x, width });
  const key = value => Number(value.toFixed(6));
  const hidden = new Set(hideLabels.map(key));
  const standing = new Map(marks.filter(mark => mark.sprite).map(mark => [key(mark.at), mark.size ?? 36]));
  const hopY = value => y - (standing.has(key(value)) ? standing.get(key(value)) + 16 : 14);
  const parts = [`<line x1="${num(x - 12)}" y1="${num(y)}" x2="${num(x + width + 12)}" y2="${num(y)}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`];
  const ticks = Math.round((max - min) / step);
  for (let index = 0; index <= ticks; index++) {
    const value = Number((min + index * step).toFixed(6));
    const major = index % labelEvery === 0;
    const px = at(value);
    parts.push(line(num(px), num(y - (major ? 10 : 6)), num(px), num(y + (major ? 10 : 6)), { width: major ? 3 : 2 }));
    if (major && !hidden.has(value)) parts.push(text(num(px), num(y + 34), String(value), { size: labelSize }));
  }
  for (const hop of hops) {
    const x1 = at(hop.from);
    const x2 = at(hop.to);
    const y1 = hopY(hop.from);
    const y2 = hopY(hop.to);
    const mid = (x1 + x2) / 2;
    const raised = y1 !== y - 14 || y2 !== y - 14;
    const rise = hop.lift ?? (raised ? Math.min(36, 16 + Math.abs(x2 - x1) * 0.12) : Math.min(54, 22 + Math.abs(x2 - x1) * 0.2));
    const control = Math.min(y1, y2) - rise * 2;
    const length = Math.hypot(x2 - mid, y2 - control);
    const ux = (x2 - mid) / length;
    const uy = (y2 - control) / length;
    const backX = x2 - ux * 11;
    const backY = y2 - uy * 11;
    parts.push(path(`M${num(x1)} ${num(y1)}Q${num(mid)} ${num(control)} ${num(x2)} ${num(y2)}`, { stroke: HOP, strokeWidth: 3 }));
    parts.push(path(`M${num(x2)} ${num(y2)}L${num(backX - uy * 5.5)} ${num(backY + ux * 5.5)}L${num(backX + uy * 5.5)} ${num(backY - ux * 5.5)}Z`, { fill: HOP, stroke: HOP, strokeWidth: 1 }));
    if (hop.label !== undefined) parts.push(text(num(mid), num((y1 + 2 * control + y2) / 4 - 8), hop.label, { size: labelSize, fill: HOP, weight: 700 }));
  }
  for (const mark of marks) {
    const size = mark.size ?? 36;
    const px = at(mark.at);
    parts.push(circle(num(px), num(y), 6, { fill: ORANGE }));
    if (mark.sprite) parts.push(sprite(mark.sprite, px - size / 2, y - size - 12, size, mark));
  }
  return parts.join('');
}

// A two-pan balance. tilt -1 lowers the left pan, +1 the right pan, 0 keeps it level. Pan items are
// { sprite, count }, { weight: 5 } for a numbered block, or { unknown: true } for a block with a question mark.
// A pan holds perRow items across (three with the default cell 30) in up to two rows, so six items. The hangers
// lengthen for a second row, so items never touch the beam. The drawing is width units wide and
// balanceScaleHeight(config) tall (y included).
const countItems = items => items.reduce((total, item) => total + (item.count ?? 1), 0);
const balanceRows = ({ left = [], right = [], perRow = 3 }) => Math.max(1, Math.ceil(Math.max(countItems(left), countItems(right)) / perRow));

export const balanceScaleHeight = ({ y = 0, left = [], right = [], cell = 30, perRow = 3 } = {}) =>
  Math.ceil(y + 168 + (balanceRows({ left, right, perRow }) - 1) * (cell + 2));

export function balanceScale({ x = 0, y = 0, width = 400, tilt = 0, left = [], right = [], cell = 30, perRow = 3 } = {}) {
  const panHalf = (perRow * (cell + 2) + 8) / 2;
  const rows = balanceRows({ left, right, perRow });
  if (rows > 2) throw new Error(`balanceScale: ${Math.max(countItems(left), countItems(right))} items do not fit on one pan (the limit is ${perRow * 2})`);
  const extra = (rows - 1) * (cell + 2);
  const cx = x + width / 2;
  const reach = width / 2 - panHalf - 4;
  const angle = clamp(tilt, -1, 1) * 9 * Math.PI / 180;
  const pivotY = y + 46;
  const baseY = pivotY + 110 + extra;
  const ends = [
    { x: cx - reach * Math.cos(angle), y: pivotY - reach * Math.sin(angle), items: left },
    { x: cx + reach * Math.cos(angle), y: pivotY + reach * Math.sin(angle), items: right },
  ];
  const parts = [
    rect(num(cx - 44), num(baseY - 10), 88, 14, { fill: TINTS.slate, rx: 7 }),
    rect(num(cx - 6), num(pivotY), 12, num(baseY - pivotY - 4), { fill: TINTS.slate, rx: 3 }),
    `<line x1="${num(ends[0].x)}" y1="${num(ends[0].y)}" x2="${num(ends[1].x)}" y2="${num(ends[1].y)}" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>`,
    `<line x1="${num(ends[0].x)}" y1="${num(ends[0].y)}" x2="${num(ends[1].x)}" y2="${num(ends[1].y)}" stroke="${TINTS.gold}" stroke-width="7.5" stroke-linecap="round"/>`,
    circle(num(cx), num(pivotY), 9, { fill: TINTS.gold, strokeWidth: 2.5 }),
  ];
  for (const end of ends) {
    const panY = end.y + 54 + extra;
    parts.push(line(num(end.x), num(end.y), num(end.x - panHalf + 12), num(panY), { width: 2 }), line(num(end.x), num(end.y), num(end.x + panHalf - 12), num(panY), { width: 2 }));
    parts.push(path(`M${num(end.x - panHalf)} ${num(panY)}H${num(end.x + panHalf)}L${num(end.x + panHalf - 14)} ${num(panY + 14)}H${num(end.x - panHalf + 14)}Z`, { fill: '#b8c4d8', strokeWidth: 2.5 }));
    const units = end.items.flatMap(item => Array.from({ length: item.count ?? 1 }, () => item));
    units.forEach((item, index) => {
      const row = Math.floor(index / perRow);
      const inRow = Math.min(perRow, units.length - row * perRow);
      const rowWidth = inRow * (cell + 2) - 2;
      const ux = end.x - rowWidth / 2 + (index % perRow) * (cell + 2);
      const uy = panY - (row + 1) * (cell + 2) + 2;
      if (item.sprite) parts.push(sprite(item.sprite, ux, uy, cell, item));
      else if (item.weight !== undefined) parts.push(rect(num(ux), num(uy), cell, cell, { fill: TINTS.gold, rx: 6 }), text(num(ux + cell / 2), num(uy + cell / 2 + 5.5), item.weight, { size: 16, weight: 700 }));
      else parts.push(rect(num(ux), num(uy), cell, cell, { fill: '#fff4d6', rx: 6 }), text(num(ux + cell / 2), num(uy + cell / 2 + 7), '?', { size: 22, weight: 700 }));
    });
  }
  return parts.join('');
}

// A dark navy panel with a few fixed stars: a high-contrast stage for bright sprites. Put PAPER-coloured text on it.
export function spacePanel(x, y, width, height, { fill = TINTS.navy, rx = 18, stars = 9, seed = 1 } = {}) {
  let state = ((Math.imul(Math.round(width), 73856093) ^ Math.imul(Math.round(height), 19349663) ^ Math.imul(seed + stars, 83492791)) >>> 0) || 1;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const parts = [rect(num(x), num(y), num(width), num(height), { fill, rx, strokeWidth: 3 })];
  for (let index = 0; index < stars; index++) {
    const sx = x + 14 + next() * (width - 28);
    const sy = y + 14 + next() * (height - 28);
    const size = 1.3 + next() * 1.4;
    if (index % 4 === 3) parts.push(`<path d="M${num(sx)} ${num(sy - 4.5)}L${num(sx + 1.4)} ${num(sy - 1.4)}L${num(sx + 4.5)} ${num(sy)}L${num(sx + 1.4)} ${num(sy + 1.4)}L${num(sx)} ${num(sy + 4.5)}L${num(sx - 1.4)} ${num(sy + 1.4)}L${num(sx - 4.5)} ${num(sy)}L${num(sx - 1.4)} ${num(sy - 1.4)}Z" fill="#ffe08a"/>`);
    else parts.push(`<circle cx="${num(sx)}" cy="${num(sy)}" r="${num(size)}" fill="${index % 3 ? '#ffffff' : '#bcd3f2'}"/>`);
  }
  return parts.join('');
}
