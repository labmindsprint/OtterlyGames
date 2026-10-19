// Pictures for the real-paper style Class 3 families: shaded circles, shape groups, cut shapes, dial scales,
// road maps, trails, bookshelves and figure rows.
import {
  INK, PAPER, circle, line, path, rect, svg, text,
} from './diagram-kit.mjs';

const TEAL = '#2f7d78';
const GOLD = '#e0b14a';
const NAVY = '#29415f';
const CREAM = '#fff6e8';
const SKY = '#d7ebf5';

export const COLOURS = {
  red: '#d95f5f', blue: '#4f86c6', green: '#5aa469', yellow: '#e6c34a', orange: '#e49a47', purple: '#8d79b8', pink: '#e59ab8', brown: '#9b6b4b',
};
export const SIDES = { circle: 0, triangle: 3, square: 4, diamond: 4, pentagon: 5, hexagon: 6, star: 10 };

const frame = (width, height) => rect(0, 0, width, height, { fill: PAPER, stroke: 'none', strokeWidth: 0 });
const polygon = (points, fill, stroke = INK, width = 2.5) =>
  `<polygon points="${points.map(point => point.map(value => Number(value).toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const regular = (cx, cy, radius, sides, start = -Math.PI / 2) =>
  Array.from({ length: sides }, (_, index) => [cx + Math.cos(start + index * 2 * Math.PI / sides) * radius, cy + Math.sin(start + index * 2 * Math.PI / sides) * radius]);

export function glyph(shape, cx, cy, size, fill = TEAL, stroke = INK) {
  const half = size / 2;
  switch (shape) {
    case 'circle': return circle(cx, cy, half, { fill, stroke });
    case 'square': return rect(cx - half * 0.88, cy - half * 0.88, size * 0.88, size * 0.88, { fill, stroke });
    case 'triangle': return polygon([[cx, cy - half], [cx + half, cy + half * 0.8], [cx - half, cy + half * 0.8]], fill, stroke);
    case 'diamond': return polygon([[cx, cy - half], [cx + half * 0.8, cy], [cx, cy + half], [cx - half * 0.8, cy]], fill, stroke);
    case 'pentagon': return polygon(regular(cx, cy + 1, half, 5), fill, stroke);
    case 'hexagon': return polygon(regular(cx, cy, half, 6, 0), fill, stroke);
    case 'star': return polygon(Array.from({ length: 10 }, (_, index) => {
      const angle = -Math.PI / 2 + index * Math.PI / 5;
      const arm = index % 2 ? half * 0.45 : half;
      return [cx + Math.cos(angle) * arm, cy + Math.sin(angle) * arm];
    }), fill, stroke);
    default: throw new Error(`Unknown shape ${shape}`);
  }
}

function drawPies(visual) {
  const radius = 34;
  const stride = 84;
  const width = 20 + (visual.wholes + 1) * stride;
  const height = 100;
  let body = frame(width, height);
  for (let index = 0; index < visual.wholes; index++) body += circle(20 + radius + index * stride, 50, radius, { fill: TEAL, strokeWidth: 3 });
  const cx = 20 + radius + visual.wholes * stride;
  body += circle(cx, 50, radius, { fill: PAPER, strokeWidth: 3 });
  for (let part = 0; part < visual.parts; part++) {
    const from = -Math.PI / 2 + part * 2 * Math.PI / visual.parts;
    const to = -Math.PI / 2 + (part + 1) * 2 * Math.PI / visual.parts;
    const fill = part < visual.shaded ? TEAL : PAPER;
    body += path(`M ${cx} 50 L ${(cx + Math.cos(from) * radius).toFixed(1)} ${(50 + Math.sin(from) * radius).toFixed(1)} A ${radius} ${radius} 0 0 1 ${(cx + Math.cos(to) * radius).toFixed(1)} ${(50 + Math.sin(to) * radius).toFixed(1)} Z`, { fill, strokeWidth: 3 });
  }
  return svg(body, visual.description, width, height);
}

function drawCells(visual) {
  const cell = 56;
  const width = 24 + visual.cols * cell;
  const height = 24 + visual.rows * cell;
  let body = frame(width, height);
  for (let index = 0; index < visual.rows * visual.cols; index++) {
    const cx = 12 + (index % visual.cols) * cell + cell / 2;
    const cy = 12 + Math.floor(index / visual.cols) * cell + cell / 2;
    body += glyph(visual.shape, cx, cy, 40, visual.shaded.includes(index) ? TEAL : PAPER);
  }
  return svg(body, visual.description, width, height);
}

function drawSets(visual) {
  const width = 370;
  const height = 290;
  let body = frame(width, height);
  visual.sets.forEach((set, index) => {
    const x = 10 + (index % 2) * 180;
    const y = 10 + Math.floor(index / 2) * 140;
    body += rect(x, y, 170, 130, { fill: CREAM, rx: 8, strokeWidth: 2 });
    body += text(x + 18, y + 26, 'ABCD'[index], { size: 18, fill: NAVY });
    const cols = set.total <= 8 ? 4 : set.total <= 10 ? 5 : 6;
    for (let spot = 0; spot < set.total; spot++) {
      const cx = x + 17 + (spot % cols) * 27 + 13;
      const cy = y + 46 + Math.floor(spot / cols) * 28 + 13;
      body += glyph(set.shape, cx, cy, 22, (spot * 7) % set.total < set.shaded ? TEAL : PAPER);
    }
  });
  return svg(body, visual.description, width, height);
}

function drawCuts(visual) {
  const width = 376;
  const height = 270;
  let body = frame(width, height);
  visual.shapes.forEach((shape, index) => {
    const x = 36 + (index % 2) * 170;
    const y = 16 + Math.floor(index / 2) * 124;
    body += text(x - 18, y + 52, 'ABCD'[index], { size: 18, fill: NAVY });
    body += rect(x, y, 130, 90, { fill: CREAM, strokeWidth: 3 });
    shape.cuts.forEach(position => {
      body += shape.dir === 'v'
        ? line(x + position * 130 / 120, y, x + position * 130 / 120, y + 90, { width: 3 })
        : line(x, y + position * 90 / 120, x + 130, y + position * 90 / 120, { width: 3 });
    });
  });
  return svg(body, visual.description, width, height);
}

function drawScales(visual) {
  const gap = 220;
  const width = 20 + visual.items.length * gap;
  const height = 190;
  let body = frame(width, height);
  const radius = 78;
  visual.items.forEach((item, index) => {
    const cx = 120 + index * gap;
    const cy = 120;
    body += path(`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy} Z`, { fill: CREAM, strokeWidth: 3 });
    for (let tick = 0; tick <= 10; tick++) {
      const angle = Math.PI - tick * Math.PI / 10;
      const inner = radius - (tick % 2 ? 8 : 14);
      body += line(cx + Math.cos(angle) * inner, cy - Math.sin(angle) * inner, cx + Math.cos(angle) * radius, cy - Math.sin(angle) * radius, { width: tick % 2 ? 2 : 3 });
      if (tick % 2 === 0) body += text(cx + Math.cos(angle) * (radius + 17), cy - Math.sin(angle) * (radius + 17) + 5, String(tick * visual.max / 10), { size: 16 });
    }
    const angle = Math.PI - item.value * Math.PI / visual.max;
    body += line(cx, cy, cx + Math.cos(angle) * (radius - 12), cy - Math.sin(angle) * (radius - 12), { stroke: '#9d4e2d', width: 4 });
    body += circle(cx, cy, 6, { fill: INK, strokeWidth: 0 });
    body += text(cx, cy + 32, `${item.label} (${visual.unit})`, { size: 16 });
  });
  return svg(body, visual.description, width, height);
}

function drawRoads(visual) {
  const width = 440;
  const height = 230;
  let body = frame(width, height);
  const at = name => visual.nodes.find(node => node.name === name);
  visual.edges.forEach(edge => {
    const a = at(edge.a);
    const b = at(edge.b);
    body += line(a.x, a.y, b.x, b.y, { width: 4, stroke: NAVY });
  });
  visual.edges.forEach(edge => {
    const a = at(edge.a);
    const b = at(edge.b);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    body += rect(mx - 30, my - 13, 60, 26, { fill: PAPER, rx: 6, strokeWidth: 1.5 });
    body += text(mx, my + 6, `${edge.km} km`, { size: 16 });
  });
  visual.nodes.forEach(node => {
    body += circle(node.x, node.y, 19, { fill: GOLD, strokeWidth: 3 });
    body += text(node.x, node.y + 6, node.name, { size: 18 });
  });
  return svg(body, visual.description, width, height);
}

function drawTrail(visual) {
  const width = 460;
  const height = 160;
  const count = visual.points.length;
  const span = 380 / (count - 1);
  let body = frame(width, height);
  visual.legs.forEach((leg, index) => {
    const x1 = 40 + index * span;
    const x2 = x1 + span;
    body += line(x1, 70, x2, 70, { width: 5, stroke: NAVY });
    body += text((x1 + x2) / 2, 50, leg === null ? '?' : `${leg} ${visual.unit}`, { size: 18, fill: leg === null ? '#9d4e2d' : INK });
  });
  visual.points.forEach((name, index) => {
    body += circle(40 + index * span, 70, 16, { fill: GOLD, strokeWidth: 3 });
    body += text(40 + index * span, 76, name, { size: 18 });
  });
  body += line(40, 112, 420, 112, { width: 2 }) + line(40, 104, 40, 120, { width: 2 }) + line(420, 104, 420, 120, { width: 2 });
  body += text(230, 142, `${visual.points[0]} to ${visual.points[count - 1]}: ${visual.total} ${visual.unit}`, { size: 18 });
  return svg(body, visual.description, width, height);
}

function drawShelf(visual) {
  const stride = 70;
  const width = 20 + visual.items.length * stride;
  const height = 130;
  let body = frame(width, height);
  visual.items.forEach((item, index) => {
    const x = 14 + index * stride;
    body += rect(x, 14, 54, 74, { fill: COLOURS[item.color], rx: 4, strokeWidth: 3 });
    body += line(x + 10, 14, x + 10, 88, { width: 2 });
    body += text(x + 27, 114, item.color, { size: 16 });
  });
  return svg(body, visual.description, width, height);
}

function drawSeq(visual) {
  const cell = 68;
  const slots = visual.items.length + (visual.next ? 1 : 0);
  const cols = visual.cols ?? slots;
  const rows = Math.ceil(slots / cols);
  const lower = visual.labels ? 28 : 0;
  const width = 16 + cols * cell;
  const height = 16 + rows * (cell + lower);
  let body = frame(width, height);
  for (let index = 0; index < slots; index++) {
    const x = 12 + (index % cols) * cell;
    const y = 8 + Math.floor(index / cols) * (cell + lower);
    const item = visual.items[index];
    body += rect(x, y, cell - 6, cell - 6, { fill: item ? CREAM : SKY, rx: 8, strokeWidth: 2 });
    if (!item) {
      body += text(x + (cell - 6) / 2, y + 40, '?', { size: 30, fill: '#9d4e2d' });
      continue;
    }
    body += glyph(item.shape, x + (cell - 6) / 2, y + (cell - 6) / 2, item.size === 'small' ? 20 : 38, item.color ? COLOURS[item.color] : TEAL);
    if (visual.labels) body += text(x + (cell - 6) / 2, y + cell + 18, 'ABCDEFG'[index], { size: 18, fill: NAVY });
  }
  return svg(body, visual.description, width, height);
}

export const IMO_RENDERERS = {
  'v3-class-3-pies': drawPies,
  'v3-class-3-cells': drawCells,
  'v3-class-3-sets': drawSets,
  'v3-class-3-cuts': drawCuts,
  'v3-class-3-scales': drawScales,
  'v3-class-3-roads': drawRoads,
  'v3-class-3-trail': drawTrail,
  'v3-class-3-shelf': drawShelf,
  'v3-class-3-seq': drawSeq,
};
