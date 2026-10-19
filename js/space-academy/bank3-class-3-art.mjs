import {
  GREEN, INK, ORANGE, PAPER, circle, clockFace, line, path, rect, svg, text,
} from './diagram-kit.mjs';

const TEAL = '#2f7d78';
const CORAL = '#d16b4f';
const GOLD = '#e0b14a';
const NAVY = '#29415f';
const CREAM = '#fff6e8';
const SKY = '#d7ebf5';
const LILAC = '#8d79b8';

const polygon = (points, fill = GREEN, stroke = INK, width = 3) =>
  `<polygon points="${points.map(point => point.map(value => Number(value).toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;

const hatch = (x, y, width, height) => {
  let body = '';
  for (let offset = -height; offset < width; offset += 10) {
    const x1 = x + Math.max(0, offset);
    const y1 = y + Math.max(0, -offset);
    const x2 = x + Math.min(width, offset + height);
    const y2 = y + Math.min(height, height - (offset < 0 ? -offset : 0) + Math.max(0, offset + height - width));
    body += line(x1, y1, x2, y2, { stroke: PAPER, width: 2 });
  }
  return body;
};

function star(x, y, radius, fill = GOLD) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const arm = index % 2 ? radius * 0.42 : radius;
    return [x + Math.cos(angle) * arm, y + Math.sin(angle) * arm];
  });
  return polygon(points, fill, INK, 2);
}

function frame(width, height) {
  return rect(0, 0, width, height, { fill: PAPER, stroke: 'none', strokeWidth: 0 });
}

function drawAbacus(visual) {
  const width = 440;
  const height = 280;
  let body = frame(width, height) + rect(24, 24, 392, 232, { fill: '#f3d2a2', rx: 12, strokeWidth: 3 });
  const labels = ['Th', 'H', 'T', 'O'];
  visual.rods.forEach((count, index) => {
    const x = 78 + index * 92;
    body += text(x, 48, labels[index], { size: 18, fill: NAVY });
    body += line(x, 64, x, 228, { stroke: NAVY, width: 5 });
    for (let bead = 0; bead < count; bead++) {
      body += circle(x, 210 - bead * 24, 11, { fill: index % 2 ? CORAL : TEAL, strokeWidth: 3 });
    }
  });
  return svg(body, visual.description, width, height);
}

function drawBlocks(visual) {
  const compact = Boolean(visual.compact);
  const width = compact ? 210 : 460;
  const height = compact ? 210 : 250;
  const hundreds = visual.hundreds;
  const tens = visual.tens;
  const ones = visual.ones;
  let body = frame(width, height);
  const flat = compact ? 52 : 46;
  const perRow = compact ? 3 : 4;
  for (let index = 0; index < hundreds; index++) {
    const x = 10 + (index % perRow) * (flat + 8);
    const y = 10 + Math.floor(index / perRow) * (flat + 8);
    body += rect(x, y, flat, flat, { fill: SKY, rx: 4, strokeWidth: 3 });
    body += line(x + flat / 2, y + 4, x + flat / 2, y + flat - 4, { width: 2 });
    body += line(x + 4, y + flat / 2, x + flat - 4, y + flat / 2, { width: 2 });
  }
  const rodY = compact ? 78 : 128;
  const rodW = compact ? 20 : 14;
  const rodGap = compact ? 12 : 8;
  const rodH = compact ? 52 : 56;
  for (let index = 0; index < tens; index++) {
    body += rect(12 + index * (rodW + rodGap), rodY, rodW, rodH, { fill: GOLD, rx: 3, strokeWidth: 3 });
  }
  const cube = compact ? 28 : 18;
  const cubeY = compact ? 150 : 204;
  for (let index = 0; index < ones; index++) {
    body += rect(12 + index * (cube + 8), cubeY, cube, cube, { fill: CORAL, rx: 3, strokeWidth: 3 });
  }
  return svg(body, visual.description, width, height);
}

function drawLine(visual) {
  const width = 480;
  const height = 170;
  const left = 36;
  const right = 444;
  const count = visual.count;
  const gap = (right - left) / (count - 1);
  let body = frame(width, height) + line(left, 78, right, 78, { width: 4 });
  for (let index = 0; index < count; index++) {
    const x = left + gap * index;
    const major = index % visual.labelEvery === 0;
    body += line(x, major ? 62 : 68, x, 90, { width: major ? 3 : 2 });
    if (major) body += text(x, 118, String(visual.start + index * visual.step), { size: 16 });
  }
  const arrowX = left + gap * visual.arrow;
  body += text(arrowX, 20, 'arrow', { size: 16, fill: CORAL });
  body += line(arrowX, 26, arrowX, 54, { stroke: CORAL, width: 3 });
  body += polygon([[arrowX, 74], [arrowX - 8, 52], [arrowX + 8, 52]], CORAL, INK, 2);
  return svg(body, visual.description, width, height);
}

function drawCards(visual) {
  const width = 460;
  const height = 160;
  let body = frame(width, height);
  visual.digits.forEach((digit, index) => {
    const x = 28 + index * 108;
    body += rect(x, 36, 88, 96, { fill: index % 2 ? SKY : CREAM, rx: 12, strokeWidth: 3 });
    body += text(x + 44, 98, String(digit), { size: 42 });
  });
  return svg(body, visual.description, width, height);
}

function drawMachine(visual) {
  const width = 480;
  const height = 214;
  let body = frame(width, height);
  body += rect(24, 28, 130, 144, { fill: SKY, rx: 16, strokeWidth: 3 });
  body += rect(176, 48, 128, 104, { fill: GOLD, rx: 16, strokeWidth: 3 });
  body += rect(326, 28, 130, 144, { fill: CREAM, rx: 16, strokeWidth: 3 });
  body += text(89, 78, 'IN', { size: 18 });
  body += text(89, 118, String(visual.ask), { size: 28 });
  body += text(240, 92, visual.rule, { size: 22 });
  body += text(240, 124, 'rule', { size: 16 });
  body += text(391, 78, 'OUT', { size: 18 });
  body += text(391, 122, '?', { size: 32, fill: CORAL });
  body += polygon([[174, 100], [156, 90], [156, 110]], TEAL, INK, 2);
  body += polygon([[324, 100], [306, 90], [306, 110]], TEAL, INK, 2);
  visual.examples.forEach((pair, index) => {
    body += text(24 + index * 160, 198, `${pair[0]} to ${pair[1]}`, { size: 16, anchor: 'start' });
  });
  return svg(body, visual.description, width, height);
}

function drawArray(visual) {
  const cell = 34;
  const width = Math.max(220, 40 + visual.cols * cell);
  const height = Math.max(120, 36 + visual.rows * cell);
  let body = frame(width, height);
  for (let row = 0; row < visual.rows; row++) {
    for (let col = 0; col < visual.cols; col++) {
      const x = 18 + col * cell;
      const y = 16 + row * cell;
      body += rect(x, y, 26, 26, { fill: row % 2 ? SKY : CREAM, rx: 5, strokeWidth: 3 });
      body += star(x + 13, y + 14, 8, GOLD);
    }
  }
  return svg(body, visual.description, width, height);
}

function drawBar(visual) {
  const width = 480;
  const height = 150;
  const caption = visual.caption || '';
  let body = frame(width, height) + (caption ? text(24, 28, caption, { size: 18, anchor: 'start' }) : '');
  const scale = 420 / visual.total;
  let x = 24;
  visual.parts.forEach((part, index) => {
    const span = Math.max(36, part.value * scale);
    body += rect(x, 48, span, 52, { fill: index % 2 ? GOLD : TEAL, rx: 6, strokeWidth: 3 });
    const ink = index % 2 ? NAVY : PAPER;
    body += text(x + span / 2, 80, part.unknown ? '?' : part.label, { size: part.unknown ? 28 : 16, fill: ink });
    x += span;
  });
  return svg(body, visual.description, width, height);
}

function drawColumn(visual) {
  const width = 280;
  const height = 210;
  const xs = [168, 124, 80, 36].slice(0, visual.width).reverse();
  let body = frame(width, height);
  const drawRow = (digits, y, sign = '') => {
    if (sign) body += text(28, y, sign, { size: 22, anchor: 'start' });
    digits.forEach((digit, index) => {
      if (digit < 0) body += rect(xs[index] - 16, y - 24, 32, 32, { fill: CREAM, rx: 4, strokeWidth: 3 });
      else body += text(xs[index], y, String(digit), { size: 26 });
    });
  };
  drawRow(visual.top, 58);
  drawRow(visual.bottom, 100, visual.op);
  body += line(24, 118, 196, 118, { width: 3 });
  drawRow(visual.result, 156);
  return svg(body, visual.description, width, height);
}

function shapeIcon(shape, x, y, size, fill) {
  if (shape === 'circle') return circle(x, y, size * 0.42, { fill, strokeWidth: 3 });
  if (shape === 'square') return rect(x - size * 0.38, y - size * 0.38, size * 0.76, size * 0.76, { fill, rx: 4, strokeWidth: 3 });
  if (shape === 'triangle') return polygon([[x, y - size * 0.46], [x + size * 0.46, y + size * 0.4], [x - size * 0.46, y + size * 0.4]], fill, INK, 3);
  return star(x, y, size * 0.46, fill);
}

function drawSymbols(visual) {
  const width = 460;
  const height = 48 + visual.lines.length * 58;
  let body = frame(width, height);
  visual.lines.forEach((row, index) => {
    const y = 42 + index * 58;
    const shapeColour = { circle: TEAL, square: CORAL, triangle: GOLD, star: LILAC };
    row.shapes.forEach((shape, shapeIndex) => {
      body += shapeIcon(shape, 36 + shapeIndex * 58, y, 36, shapeColour[shape] || TEAL);
      if (shapeIndex < row.shapes.length - 1) body += text(64 + shapeIndex * 58, y + 6, '+', { size: 20 });
    });
    const resultX = 36 + row.shapes.length * 58 + 20;
    body += text(resultX, y + 6, '=', { size: 22 });
    body += text(resultX + 48, y + 8, row.result < 0 ? '?' : String(row.result), { size: 24, fill: row.result < 0 ? CORAL : INK });
  });
  return svg(body, visual.description, width, height);
}

function drawShade(visual) {
  const tone = visual.tone ?? TEAL;
  const parts = visual.parts;
  const vertical = visual.way === 'cols';
  const cell = vertical ? 48 : 40;
  const width = vertical ? 40 + parts * cell : 400;
  const height = vertical ? 168 : 40 + parts * cell;
  const pad = 20;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  let body = frame(width, height) + rect(pad, pad, innerW, innerH, { fill: CREAM, strokeWidth: 3 });
  for (let index = 0; index < parts; index++) {
    const x = vertical ? pad + index * innerW / parts : pad;
    const y = vertical ? pad : pad + index * innerH / parts;
    const w = vertical ? innerW / parts : innerW;
    const h = vertical ? innerH : innerH / parts;
    const shaded = index < visual.shaded;
    if (shaded) body += rect(x, y, w, h, { fill: tone, strokeWidth: 0 });
    body += rect(x, y, w, h, { fill: 'none', strokeWidth: 3 });
    body += circle(x + w / 2, y + h / 2, 6, { fill: shaded ? PAPER : tone, strokeWidth: 2 });
  }
  return svg(body, visual.description, width, height);
}

function drawGroups(visual) {
  const width = 80 + visual.groups * 70;
  const height = 36 + visual.each * 28;
  let body = frame(width, height);
  for (let group = 0; group < visual.groups; group++) {
    const x = 24 + group * 70;
    body += rect(x, 16, 58, height - 32, { fill: group % 2 ? SKY : CREAM, rx: 8, strokeWidth: 3 });
    for (let item = 0; item < visual.each; item++) {
      body += circle(x + 29, 36 + item * 26, 8, { fill: visual.tone ?? GOLD, strokeWidth: 2 });
    }
  }
  return svg(body, visual.description, Math.min(500, width), Math.min(280, height));
}

function drawFractionLine(visual) {
  const width = 460;
  const height = 150;
  let body = frame(width, height) + line(40, 78, 420, 78, { width: 4 });
  body += text(40, 110, '0', { size: 18 });
  body += text(420, 110, '1', { size: 18 });
  for (let index = 0; index <= visual.parts; index++) {
    const x = 40 + index * 380 / visual.parts;
    body += line(x, 66, x, 90, { width: 3 });
  }
  const [nameA, nameB] = visual.names ?? ['A', 'B'];
  visual.marks.forEach((mark, index) => {
    const x = 40 + mark * 380 / visual.parts;
    body += text(x, 24, index ? nameB : nameA, { size: 16, fill: index ? CORAL : TEAL });
    body += polygon([[x, 72], [x - 8, 46], [x + 8, 46]], index ? CORAL : TEAL, INK, 2);
  });
  return svg(body, visual.description, width, height);
}

function drawFractionBar(visual) {
  const tone = visual.tone ?? TEAL;
  const width = visual.compact ? 200 : 360;
  const height = visual.compact ? 90 : 120;
  const barW = width - 24;
  let body = frame(width, height) + rect(12, height / 2 - 22, barW, 44, { fill: CREAM, strokeWidth: 3 });
  for (let index = 0; index < visual.parts; index++) {
    const x = 12 + index * barW / visual.parts;
    if (index < visual.shaded) {
      body += rect(x, height / 2 - 22, barW / visual.parts, 44, { fill: tone, strokeWidth: 2 });
      body += circle(x + barW / visual.parts / 2, height / 2, 4, { fill: PAPER, strokeWidth: 0 });
    }
    body += rect(x, height / 2 - 22, barW / visual.parts, 44, { fill: 'none', strokeWidth: 2 });
  }
  return svg(body, visual.description, width, height);
}

function drawAngle(visual) {
  const width = 360;
  const height = 220;
  let body = frame(width, height);
  if (visual.figure === 'rect') {
    body += rect(70, 40, 200, 120, { fill: SKY, strokeWidth: 4 });
  } else if (visual.figure === 'triangle') {
    body += polygon([[60, 180], [250, 180], [250, 50]], SKY, INK, 4);
    body += rect(232, 162, 18, 18, { fill: 'none', strokeWidth: 3 });
  } else if (visual.figure === 'lshape') {
    body += polygon([[50, 40], [150, 40], [150, 110], [230, 110], [230, 180], [50, 180]], SKY, INK, 4);
  } else {
    const rad = visual.degrees * Math.PI / 180;
    const dir = visual.facing === 'left' ? -1 : 1;
    const lean = Math.max(0, -Math.cos(rad)) * 150;
    const apex = visual.facing === 'left' ? 320 - lean : 40 + lean;
    const x2 = apex + dir * Math.cos(rad) * 150;
    const y2 = 170 - Math.sin(rad) * 150;
    body += line(apex, 170, apex + dir * 160, 170, { width: 5 });
    body += line(apex, 170, x2, y2, { width: 5 });
    if (visual.degrees === 90) body += rect(dir > 0 ? apex : apex - 18, 152, 18, 18, { fill: 'none', strokeWidth: 3 });
    else if (visual.degrees > 0 && visual.degrees < 180) {
      const arc = 28;
      const ax = apex + dir * Math.cos(rad / 2) * arc;
      const ay = 170 - Math.sin(rad / 2) * arc;
      body += circle(ax, ay, 4, { fill: CORAL, strokeWidth: 0 });
    }
  }
  return svg(body, visual.description, width, height);
}

function tileCells(cells, x, y, size) {
  return cells.map((row, rowIndex) => row.map((value, colIndex) => {
    const cx = x + colIndex * size;
    const cy = y + rowIndex * size;
    return rect(cx, cy, size, size, { fill: value ? TEAL : CREAM, strokeWidth: 2 })
      + (value ? circle(cx + size / 2, cy + size / 2, 4, { fill: GOLD, strokeWidth: 0 }) : '');
  }).join('')).join('');
}

function drawTiles(visual) {
  const compact = Boolean(visual.compact);
  const size = compact ? 32 : 40;
  const rows = visual.cells.length;
  const cols = visual.cells[0].length;
  const gridW = cols * size;
  const gridH = rows * size;
  const width = compact ? 200 : visual.mirror ? 460 : gridW + 40;
  const height = compact ? 180 : gridH + 40;
  let body = frame(width, height) + tileCells(visual.cells, compact ? (width - gridW) / 2 : 20, compact ? (height - gridH) / 2 : 20, size);
  if (visual.mirror) {
    body += line(250, 16, 250, height - 28, { stroke: CORAL, width: 4, dash: '6 4' });
    body += text(250, height - 12, 'mirror', { size: 16, fill: CORAL });
  }
  return svg(body, visual.description, width, height);
}

function drawPoly(visual) {
  const cells = visual.cells;
  const maxC = Math.max(...cells.map(cell => cell[1]));
  const maxR = Math.max(...cells.map(cell => cell[0]));
  const size = 42;
  const width = (maxC + 3) * size;
  const height = (maxR + 3) * size;
  let body = frame(width, height);
  for (let row = 0; row <= maxR + 1; row++) {
    for (let col = 0; col <= maxC + 1; col++) {
      body += rect(16 + col * size, 16 + row * size, size, size, { fill: PAPER, stroke: '#d8d3c4', strokeWidth: 1 });
    }
  }
  cells.forEach(([row, col]) => {
    body += rect(16 + (col + 0) * size, 16 + row * size, size, size, { fill: visual.tone ?? TEAL, strokeWidth: 3 });
    body += circle(16 + col * size + size / 2, 16 + row * size + size / 2, 5, { fill: GOLD, strokeWidth: 0 });
  });
  return svg(body, visual.description, width, height);
}

function drawShape(visual) {
  const width = 180;
  const height = 180;
  const shape = visual.shape;
  let body = frame(width, height);
  if (shape === 'circle') body += circle(90, 90, 62, { fill: SKY, strokeWidth: 4 });
  else if (shape === 'triangle') body += polygon([[90, 24], [156, 146], [24, 146]], GOLD, INK, 4);
  else if (shape === 'square') body += rect(38, 38, 104, 104, { fill: TEAL, rx: 6, strokeWidth: 4 });
  else if (shape === 'rectangle') body += rect(24, 52, 132, 76, { fill: CORAL, rx: 6, strokeWidth: 4 });
  else if (shape === 'pentagon') {
    body += polygon(Array.from({ length: 5 }, (_, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / 5;
      return [90 + Math.cos(angle) * 68, 94 + Math.sin(angle) * 68];
    }), LILAC, INK, 4);
  } else if (shape === 'octagon') {
    body += polygon(Array.from({ length: 8 }, (_, index) => {
      const angle = Math.PI / 8 + index * Math.PI / 4;
      return [90 + Math.cos(angle) * 66, 90 + Math.sin(angle) * 66];
    }), CORAL, INK, 4);
  } else {
    body += polygon(Array.from({ length: 6 }, (_, index) => {
      const angle = index * Math.PI / 3;
      return [90 + Math.cos(angle) * 64, 90 + Math.sin(angle) * 64];
    }), GOLD, INK, 4);
  }
  return svg(body, visual.description, width, height);
}

function drawTowers(visual) {
  const size = 32;
  const width = 40 + visual.heights.length * 48;
  const height = 48 + Math.max(...visual.heights) * size;
  let body = frame(width, height) + line(16, height - 20, width - 12, height - 20, { width: 3 });
  visual.heights.forEach((stack, index) => {
    const x = 28 + index * 48;
    for (let level = 0; level < stack; level++) {
      const y = height - 20 - (level + 1) * size;
      body += rect(x, y, size, size, { fill: level % 2 ? SKY : CREAM, strokeWidth: 3 });
      body += line(x + 6, y + 6, x + size - 6, y + size - 6, { stroke: GOLD, width: 2 });
    }
  });
  return svg(body, visual.description, width, height);
}

function drawNet(visual) {
  const size = 48;
  const spots = { top: [1, 0], left: [0, 1], center: [1, 1], right: [2, 1], far: [3, 1], bottom: [1, 2] };
  const width = 28 + 4 * size;
  const height = 28 + 3 * size;
  let body = frame(width, height);
  Object.entries(spots).forEach(([name, [col, row]]) => {
    const x = 14 + col * size;
    const y = 14 + row * size;
    const marked = name === visual.mark;
    body += rect(x, y, size - 6, size - 6, { fill: marked ? GOLD : SKY, rx: 4, strokeWidth: 3 });
    body += text(x + (size - 6) / 2, y + 28, visual.labels[name], { size: 18, fill: NAVY });
    if (marked) body += circle(x + 10, y + 10, 5, { fill: CORAL, strokeWidth: 0 });
  });
  return svg(body, visual.description, width, height);
}

function drawRuler(visual) {
  const width = 500;
  const height = 150;
  const left = 30;
  const unit = 26;
  let body = frame(width, height) + rect(left, 70, visual.to * unit, 42, { fill: CREAM, strokeWidth: 3 });
  for (let mark = 0; mark <= visual.to; mark++) {
    const x = left + mark * unit;
    body += line(x, 70, x, mark % 2 ? 86 : 98, { width: mark % 2 ? 2 : 3 });
    if (mark % 2 === 0) body += text(x, 128, String(mark), { size: 16 });
  }
  const x1 = left + visual.start * unit;
  const x2 = left + visual.end * unit;
  body += rect(x1, 28, Math.max(8, x2 - x1), 24, { fill: visual.tone ?? TEAL, rx: 6, strokeWidth: 3 });
  body += text(470, 24, 'cm', { size: 16, anchor: 'end' });
  return svg(body, visual.description, width, height);
}

function drawThermo(visual) {
  const width = 220;
  const height = 280;
  const top = 28;
  const bottom = 230;
  const span = bottom - top;
  let body = frame(width, height);
  body += rect(96, top, 28, span, { fill: CREAM, rx: 14, strokeWidth: 3 });
  body += circle(110, 246, 22, { fill: CORAL, strokeWidth: 3 });
  const fill = (visual.value - visual.min) / (visual.max - visual.min) * span;
  body += rect(100, bottom - fill, 20, fill, { fill: CORAL, stroke: CORAL, strokeWidth: 0 });
  for (let value = visual.min; value <= visual.max; value += visual.step) {
    const y = bottom - (value - visual.min) / (visual.max - visual.min) * span;
    body += line(78, y, 96, y, { width: 2 });
    body += text(70, y + 5, String(value), { size: 16, anchor: 'end' });
  }
  return svg(body, visual.description, width, height);
}

function drawBalance(visual) {
  const width = 460;
  const height = 200;
  let body = frame(width, height);
  body += polygon([[230, 36], [214, 70], [246, 70]], NAVY, INK, 2);
  body += line(70, 70, 390, 70, { width: 5 });
  body += line(230, 70, 230, 170, { width: 4 });
  body += line(190, 170, 270, 170, { width: 4 });
  [90, 350].forEach(x => {
    body += line(x, 70, x, 108, { width: 3 });
    body += polygon([[x - 48, 108], [x + 48, 108], [x + 36, 132], [x - 36, 132]], SKY, INK, 3);
  });
  visual.left.forEach((label, index) => body += text(90, 156 + index * 20, label, { size: 16 }));
  visual.right.forEach((label, index) => body += text(350, 156 + index * 20, label, { size: 16 }));
  return svg(body, visual.description, width, height);
}

function drawJug(visual) {
  const width = 420;
  const height = 220;
  let body = frame(width, height);
  body += rect(40, 36, 110, 150, { fill: visual.tone ?? SKY, rx: 8, strokeWidth: 4 });
  body += rect(150, 70, 18, 28, { fill: 'none', strokeWidth: 3 });
  body += text(95, 118, `${visual.litres} L`, { size: 22 });
  body += text(220, 48, `1 cup = ${visual.cupMl} mL`, { size: 16, anchor: 'start' });
  body += rect(250, 78, 36, 52, { fill: visual.tone ?? CREAM, rx: 6, strokeWidth: 3 });
  return svg(body, visual.description, width, height);
}

function drawClock(visual) {
  if (!visual.compact) {
    const size = 300;
    return svg(frame(size, size) + clockFace(visual.minutes, size / 2, size / 2, 136), visual.description, size, size);
  }
  const size = 200;
  const cx = 100;
  const cy = 100;
  const minute = ((visual.minutes % 60) + 60) % 60;
  const hour = Math.floor(((visual.minutes % 720) + 720) % 720 / 60) || 12;
  let body = frame(size, size) + circle(cx, cy, 92, { fill: PAPER, strokeWidth: 4 });
  for (let mark = 1; mark <= 12; mark++) {
    const angle = mark * Math.PI / 6;
    body += text(cx + Math.sin(angle) * 68, cy - Math.cos(angle) * 68 + 8, String(mark), { size: 20 });
  }
  const hourAngle = ((hour % 12) * 30 + minute * 0.5) * Math.PI / 180;
  const minuteAngle = minute * 6 * Math.PI / 180;
  body += line(cx, cy, cx + Math.sin(hourAngle) * 40, cy - Math.cos(hourAngle) * 40, { stroke: '#675082', width: 7 });
  body += line(cx, cy, cx + Math.sin(minuteAngle) * 58, cy - Math.cos(minuteAngle) * 58, { stroke: '#9d4e2d', width: 4 });
  body += circle(cx, cy, 5, { fill: INK, strokeWidth: 0 });
  return svg(body, visual.description, size, size);
}

function drawTimeline(visual) {
  const width = 480;
  const height = 150;
  let body = frame(width, height) + line(40, 78, 440, 78, { width: 6, stroke: TEAL });
  body += circle(40, 78, 8, { fill: GOLD, strokeWidth: 3 });
  body += circle(440, 78, 8, { fill: CORAL, strokeWidth: 3 });
  body += text(40, 112, visual.start, { size: 18 });
  body += text(440, 112, visual.end, { size: 18 });
  if (visual.stop) {
    const [startHour, startMinute] = String(visual.start).split(':').map(Number);
    const [endHour, endMinute] = String(visual.end).split(':').map(Number);
    const [stopHour, stopMinute] = String(visual.stop).split(':').map(Number);
    const span = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const along = (stopHour * 60 + stopMinute) - (startHour * 60 + startMinute);
    const x = span > 0 ? 40 + 400 * along / span : 240;
    const mark = Math.max(110, Math.min(370, x));
    body += circle(mark, 78, 8, { fill: PAPER, strokeWidth: 3 });
    body += text(mark, 48, visual.stop, { size: 16 });
  }
  return svg(body, visual.description, width, height);
}

function drawCalendar(visual) {
  const cell = 44;
  const width = 36 + 7 * cell;
  const height = 78 + 6 * 36;
  let body = frame(width, height) + text(width / 2, 28, visual.month, { size: 20 });
  ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach((label, index) => {
    body += text(22 + index * cell + cell / 2, 54, label, { size: 16, fill: NAVY });
  });
  for (let date = 1; date <= visual.days; date++) {
    const slot = visual.start + date - 1;
    const col = slot % 7;
    const row = Math.floor(slot / 7);
    const x = 22 + col * cell;
    const y = 64 + row * 36;
    if (date === visual.mark) body += rect(x + 4, y, cell - 8, 30, { fill: GOLD, rx: 6, strokeWidth: 0 });
    body += text(x + cell / 2, y + 22, String(date), { size: 16 });
  }
  return svg(body, visual.description, width, height);
}

function drawTable(visual, width = 440) {
  const rows = visual.rows;
  const height = 56 + rows.length * 36;
  let body = frame(width, height) + text(16, 28, visual.title, { size: 18, anchor: 'start' });
  rows.forEach((row, index) => {
    const y = 44 + index * 36;
    body += rect(16, y, width - 32, 32, { fill: index % 2 ? SKY : CREAM, rx: 6, strokeWidth: 2 });
    body += text(28, y + 22, row.left, { size: 16, anchor: 'start' });
    if (row.mid) body += text(width / 2, y + 22, row.mid, { size: 16 });
    body += text(width - 28, y + 22, row.right, { size: 16, anchor: 'end' });
  });
  return svg(body, visual.description, width, height);
}

function drawCoins(visual) {
  const width = 460;
  const height = 180;
  let body = frame(width, height);
  let x = 24;
  visual.pieces.forEach(piece => {
    for (let index = 0; index < piece.count; index++) {
      if (piece.note) {
        body += rect(x, 36, 84, 48, { fill: GOLD, rx: 6, strokeWidth: 3 });
        body += text(x + 42, 66, `Rs ${piece.value}`, { size: 16 });
        x += 96;
      } else {
        body += circle(x + 28, 60, 26, { fill: piece.value >= 5 ? TEAL : CREAM, strokeWidth: 3 });
        body += text(x + 28, 118, `Rs ${piece.value}`, { size: 16, fill: INK });
        x += 72;
      }
    }
  });
  return svg(body, visual.description, width, height);
}

function drawPicto(visual) {
  const width = 480;
  const height = 56 + visual.rows.length * 40;
  let body = frame(width, height) + text(16, 28, `Each circle = ${visual.key}`, { size: 18, anchor: 'start' });
  visual.rows.forEach((row, index) => {
    const y = 58 + index * 40;
    body += text(16, y + 8, row.label, { size: 16, anchor: 'start' });
    for (let symbol = 0; symbol < row.full; symbol++) {
      body += circle(130 + symbol * 32, y, 12, { fill: TEAL, strokeWidth: 3 });
    }
    if (row.half) {
      const hx = 130 + row.full * 32;
      body += circle(hx, y, 12, { fill: PAPER, strokeWidth: 3 });
      body += path(`M ${hx} ${y - 12} A 12 12 0 0 0 ${hx} ${y + 12} Z`, { fill: GOLD, stroke: INK, strokeWidth: 3 });
    }
  });
  return svg(body, visual.description, width, height);
}

function drawBars(visual) {
  const width = 460;
  const height = 250;
  const max = Math.max(...visual.values, visual.scale);
  let body = frame(width, height) + line(48, 200, 430, 200, { width: 3 }) + line(48, 24, 48, 200, { width: 3 });
  for (let value = visual.scale; value <= max; value += visual.scale) {
    const y = 200 - value * 140 / max;
    body += line(44, y, 430, y, { stroke: '#d8d3c4', width: 1 });
    body += text(40, y + 5, String(value), { size: 16, anchor: 'end' });
  }
  visual.labels.forEach((label, index) => {
    const x = 70 + index * 90;
    const bar = visual.values[index] * 140 / max;
    body += rect(x, 200 - bar, 48, bar, { fill: index % 2 ? ORANGE : TEAL, rx: 4, strokeWidth: 2 });
    body += text(x + 24, 222, label, { size: 16 });
  });
  return svg(body, visual.description, width, height);
}

function drawTally(visual) {
  const width = 440;
  const height = 48 + visual.rows.length * 42;
  let body = frame(width, height);
  visual.rows.forEach((row, index) => {
    const y = 36 + index * 42;
    body += text(16, y, row.label, { size: 16, anchor: 'start' });
    for (let mark = 0; mark < row.count; mark++) {
      const bundle = Math.floor(mark / 5);
      const slot = mark % 5;
      const x = 120 + bundle * 36 + slot * 6;
      if (slot === 4) body += line(x - 24, y - 14, x, y + 4, { width: 3, stroke: CORAL });
      else body += line(x, y - 14, x, y + 4, { width: 3 });
    }
  });
  return svg(body, visual.description, width, height);
}

function drawSplit(visual) {
  const width = 480;
  const height = 230;
  let body = frame(width, height);
  [visual.leftTitle, visual.rightTitle].forEach((title, side) => {
    body += text(120 + side * 230, 28, title, { size: 18 });
  });
  const max = Math.max(...visual.left, ...visual.right, 1);
  visual.labels.forEach((label, index) => {
    const y = 48 + index * 56;
    body += text(16, y + 22, label, { size: 16, anchor: 'start' });
    const leftSpan = visual.left[index] * 110 / max;
    const rightSpan = visual.right[index] * 110 / max;
    body += rect(90, y, leftSpan, 28, { fill: TEAL, rx: 4, strokeWidth: 2 });
    body += text(98 + leftSpan, y + 20, String(visual.left[index]), { size: 16, anchor: 'start' });
    body += rect(310, y, rightSpan, 28, { fill: GOLD, rx: 4, strokeWidth: 2 });
    body += text(318 + rightSpan, y + 20, String(visual.right[index]), { size: 16, anchor: 'start' });
  });
  return svg(body, visual.description, width, height);
}

function drawQueue(visual) {
  const width = 36 + visual.names.length * 62;
  const height = 140;
  let body = frame(width, height) + text(20, 28, 'Front', { size: 16, anchor: 'start', fill: CORAL });
  body += polygon([[78, 22], [96, 14], [96, 30]], CORAL, INK, 2);
  visual.names.forEach((name, index) => {
    const x = 28 + index * 62;
    body += circle(x + 22, 78, 20, { fill: index % 2 ? SKY : CREAM, strokeWidth: 3 });
    body += text(x + 22, 118, name, { size: 16 });
  });
  return svg(body, visual.description, width, height);
}

function drawCode(visual) {
  const width = 280;
  const height = 48 + visual.pairs.length * 36;
  let body = frame(width, height) + text(140, 28, 'Code key', { size: 18 });
  visual.pairs.forEach((pair, index) => {
    const y = 44 + index * 36;
    body += rect(36, y, 70, 30, { fill: SKY, rx: 6, strokeWidth: 2 });
    body += rect(174, y, 70, 30, { fill: CREAM, rx: 6, strokeWidth: 2 });
    body += text(71, y + 21, pair[0], { size: 18 });
    body += text(140, y + 21, 'to', { size: 16 });
    body += text(209, y + 21, pair[1], { size: 18 });
  });
  return svg(body, visual.description, width, height);
}

function drawMap(visual) {
  const cell = 46;
  const width = 90 + 5 * cell;
  const height = 70 + 5 * cell;
  let body = frame(width, height);
  body += text(36, 28, 'N', { size: 18, fill: CORAL });
  body += polygon([[36, 36], [28, 52], [44, 52]], CORAL, INK, 2);
  for (let col = 0; col < 5; col++) body += text(78 + col * cell, 48, 'ABCDE'[col], { size: 16 });
  for (let row = 0; row < 5; row++) {
    body += text(52, 78 + (4 - row) * cell, String(row + 1), { size: 16 });
    for (let col = 0; col < 5; col++) {
      body += rect(62 + col * cell, 58 + (4 - row) * cell, cell - 6, cell - 6, { fill: (col + row) % 2 ? SKY : CREAM, strokeWidth: 2 });
    }
  }
  const sx = 62 + visual.col * cell + 20;
  const sy = 58 + (4 - visual.row) * cell + 20;
  body += circle(sx, sy, 10, { fill: CORAL, strokeWidth: 3 });
  return svg(body, visual.description, width, height);
}

function drawPaths(visual) {
  const gap = 56;
  const width = 50 + visual.width * gap;
  const height = 50 + visual.height * gap;
  const blocked = new Set(visual.blocked.map(cell => `${cell[0]},${cell[1]}`));
  let body = frame(width, height);
  for (let y = 0; y <= visual.height; y++) {
    for (let x = 0; x <= visual.width; x++) {
      const px = 24 + x * gap;
      const py = height - 24 - y * gap;
      if (x < visual.width) body += line(px, py, px + gap, py, { width: 4, stroke: NAVY });
      if (y < visual.height) body += line(px, py, px, py - gap, { width: 4, stroke: NAVY });
    }
  }
  for (let y = 0; y <= visual.height; y++) {
    for (let x = 0; x <= visual.width; x++) {
      const px = 24 + x * gap;
      const py = height - 24 - y * gap;
      const block = blocked.has(`${x},${y}`);
      body += circle(px, py, 8, { fill: block ? CORAL : PAPER, strokeWidth: 3 });
      if (block) body += text(px, py + 4, 'x', { size: 16, fill: PAPER });
    }
  }
  body += text(24, height - 4, 'S', { size: 16 });
  body += text(24 + visual.width * gap, 20, 'F', { size: 16 });
  return svg(body, visual.description, width, height);
}

function drawBadge(visual) {
  const compact = Boolean(visual.compact);
  const size = compact ? 210 : 300;
  const flip = visual.flip === 'x' ? -1 : 1;
  const turn = visual.flip === 'y' ? -1 : 1;
  const scale = compact ? 1.35 : 1.15;
  const cx = size / 2;
  const cy = size / 2 + 8;
  let body = frame(size, size);
  body += `<g transform="translate(${cx} ${cy}) scale(${flip * scale} ${turn * scale})">`;
  body += rect(-50, -20, 100, 70, { fill: visual.tone ?? SKY, rx: 8, strokeWidth: 4 });
  const roof = visual.roof === 'left' ? -18 : 18;
  body += polygon([[-58, -20], [58, -20], [roof, -62]], GOLD, INK, 4);
  const windowX = visual.window === 'left' ? -24 : 24;
  body += circle(windowX, 8, 16, { fill: CREAM, strokeWidth: 3 });
  const starX = visual.star === 'left' ? -26 : 26;
  body += star(starX, 40, 12, CORAL);
  body += '</g>';
  return svg(body, visual.description, size, size);
}

const RENDERERS = {
  'v3-class-3-abacus': drawAbacus,
  'v3-class-3-blocks': drawBlocks,
  'v3-class-3-line': drawLine,
  'v3-class-3-cards': drawCards,
  'v3-class-3-machine': drawMachine,
  'v3-class-3-array': drawArray,
  'v3-class-3-bar': drawBar,
  'v3-class-3-column': drawColumn,
  'v3-class-3-symbols': drawSymbols,
  'v3-class-3-shade': drawShade,
  'v3-class-3-groups': drawGroups,
  'v3-class-3-fline': drawFractionLine,
  'v3-class-3-fbar': drawFractionBar,
  'v3-class-3-angle': drawAngle,
  'v3-class-3-tiles': drawTiles,
  'v3-class-3-poly': drawPoly,
  'v3-class-3-shape': drawShape,
  'v3-class-3-towers': drawTowers,
  'v3-class-3-net': drawNet,
  'v3-class-3-ruler': drawRuler,
  'v3-class-3-thermo': drawThermo,
  'v3-class-3-balance': drawBalance,
  'v3-class-3-jug': drawJug,
  'v3-class-3-clock': drawClock,
  'v3-class-3-timeline': drawTimeline,
  'v3-class-3-calendar': drawCalendar,
  'v3-class-3-schedule': visual => drawTable(visual, 460),
  'v3-class-3-board': visual => drawTable(visual, 360),
  'v3-class-3-budget': visual => drawTable(visual, 360),
  'v3-class-3-receipt': visual => drawTable(visual, 400),
  'v3-class-3-datatable': visual => drawTable(visual, 360),
  'v3-class-3-coins': drawCoins,
  'v3-class-3-picto': drawPicto,
  'v3-class-3-bars': drawBars,
  'v3-class-3-tally': drawTally,
  'v3-class-3-split': drawSplit,
  'v3-class-3-queue': drawQueue,
  'v3-class-3-code': drawCode,
  'v3-class-3-map': drawMap,
  'v3-class-3-paths': drawPaths,
  'v3-class-3-badge': drawBadge,
};

export function renderClass3(visual) {
  const draw = RENDERERS[visual.kind];
  if (!draw) throw new Error(`Unsupported class-3 diagram: ${visual.kind}`);
  return draw(visual);
}
