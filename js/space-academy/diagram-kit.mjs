import { clockHandEndpoints } from '../worksheet-generator.mjs';

export const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
export const INK = '#293e58';
export const GREEN = '#4d9986';
export const ORANGE = '#d79446';
export const PAPER = '#fffdf5';

export function svg(body, description, width = 480, height = 260) {
  return `<div class="sa-picture sa-v2-picture"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(description)}" focusable="false">${body}</svg></div>`;
}

export function text(x, y, value, { size = 18, anchor = 'middle', fill = INK, weight = 600 } = {}) {
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}">${escape(value)}</text>`;
}

export function line(x1, y1, x2, y2, { stroke = INK, width = 2, dash = '' } = {}) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${escape(dash)}"` : ''}/>`;
}

export function rect(x, y, width, height, { fill = PAPER, stroke = INK, rx = 0, strokeWidth = 2 } = {}) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

export function circle(x, y, radius, { fill = GREEN, stroke = INK, strokeWidth = 2 } = {}) {
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

export function path(d, { fill = 'none', stroke = INK, strokeWidth = 2 } = {}) {
  return `<path d="${escape(d)}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

export function icon(shape, x, y, size = 40, fill = GREEN, mark = '') {
  const shapes = {
    circle: circle(24, 24, 18, { fill }),
    triangle: path('M24 4 45 43H3Z', { fill }),
    square: rect(6, 6, 36, 36, { fill }),
    rectangle: rect(2, 13, 44, 24, { fill }),
    star: path('m24 2 7 14 16 3-12 12 3 16-14-8-14 8 3-16L1 19l16-3Z', { fill }),
    pentagon: path('M24 3 45 19 37 43H11L3 19Z', { fill }),
    hexagon: path('M13 5H35L46 24 35 43H13L2 24Z', { fill }),
  };
  if (!shapes[shape]) throw new Error(`Unknown original picture symbol: ${shape}`);
  return `<g transform="translate(${x} ${y}) scale(${size / 48})">${shapes[shape]}${mark ? text(24, 30, mark, { size: 19, fill: '#fff' }) : ''}</g>`;
}

export function tileGrid(cells, x = 0, y = 0, size = 32) {
  return cells.map((row, r) => row.map((value, c) => {
    const cx = x + c * size;
    const cy = y + r * size;
    return rect(cx, cy, size, size, { fill: value ? (value === 2 ? '#f4d9ab' : value === 3 ? '#c9b6de' : GREEN) : PAPER, strokeWidth: 1.5 })
      + (value === 2 ? line(cx + 6, cy + 6, cx + size - 6, cy + size - 6) + line(cx + size - 6, cy + 6, cx + 6, cy + size - 6) : '')
      + (value === 3 ? circle(cx + size / 2, cy + size / 2, 3, { fill: INK, strokeWidth: 0 }) : '');
  }).join('')).join('');
}

export const gridDescription = cells => cells.map((row, index) =>
  `Row ${index + 1}: ${row.map(value => value === 2 ? 'crossed' : value === 3 ? 'dotted' : value ? 'filled' : 'empty').join(', ')}`).join('. ');

export function clockFace(minutes, x = 100, y = 100, radius = 85) {
  const minute = ((minutes % 60) + 60) % 60;
  const hour = Math.floor(((minutes % 720) + 720) % 720 / 60) || 12;
  const hands = clockHandEndpoints(hour, minute);
  const ticks = Array.from({ length: 60 }, (_, index) => {
    const angle = index * Math.PI / 30;
    const inner = index % 5 ? 87 : 82;
    return line(100 + Math.sin(angle) * inner, 100 - Math.cos(angle) * inner,
      100 + Math.sin(angle) * 92, 100 - Math.cos(angle) * 92, { width: index % 5 ? 1 : 2 });
  }).join('');
  const labels = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 1;
    return text(100 + Math.sin(hour * Math.PI / 6) * 69, 106 - Math.cos(hour * Math.PI / 6) * 69, hour, { size: 16 });
  }).join('');
  return `<g transform="translate(${x - radius} ${y - radius}) scale(${radius / 100})">${circle(100, 100, 96, { fill: PAPER, strokeWidth: 3 })}${ticks}${labels}${line(100, 100, hands.hour.x2, hands.hour.y2, { stroke: '#675082', width: 8 })}${line(100, 100, hands.minute.x2, hands.minute.y2, { stroke: '#9d4e2d', width: 4 })}${circle(100, 100, 5, { fill: INK })}</g>`;
}

export function clockDescription(minutes) {
  const minute = ((minutes % 60) + 60) % 60;
  const hour = Math.floor(((minutes % 720) + 720) % 720 / 60) || 12;
  return `Clock: long hand at minute mark ${minute || 60}; short hand ${minute ? `between ${hour} and ${hour % 12 + 1}` : `at ${hour}`}.`;
}
