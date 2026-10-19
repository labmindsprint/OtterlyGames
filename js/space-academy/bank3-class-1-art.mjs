import {
  GREEN, INK, ORANGE, PAPER, circle, clockFace, line, path, rect, svg, text,
} from './diagram-kit.mjs';
import { timeText } from './bank-shared.mjs';
import { TINTS, numberLine, spacePanel, sprite } from './sprites.mjs';

const MARS = '#c65f4b';
const SKY = '#e8f3f2';
const GOLD = '#efc267';
const PURPLE = '#7563a8';
const PALE = '#f7ead7';
const BLUE = '#4d7fa8';
const sum = values => values.reduce((total, value) => total + value, 0);

function polygon(points, fill = GREEN, stroke = INK, width = 2) {
  return `<polygon points="${points.map(point => point.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
}

function ellipse(cx, cy, rx, ry, fill = PAPER, stroke = INK, width = 2) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
}

function roundedLabel(x, y, width, value, fill = PAPER) {
  return rect(x, y, width, 34, { fill, rx: 10, strokeWidth: 2 })
    + text(x + width / 2, y + 23, value, { size: 17 });
}

function tokenShape(shape, x, y, size, fill = GREEN, mark = 'none', facing = 'up') {
  let body = '';
  if (shape === 'circle') body = circle(x, y, size * 0.42, { fill, strokeWidth: 3 });
  if (shape === 'square') body = rect(x - size * 0.4, y - size * 0.4, size * 0.8, size * 0.8, { fill, rx: 5, strokeWidth: 3 });
  if (shape === 'rectangle') body = rect(x - size * 0.48, y - size * 0.32, size * 0.96, size * 0.64, { fill, rx: 5, strokeWidth: 3 });
  if (shape === 'triangle') {
    const variants = {
      up: [[x, y - size * 0.48], [x + size * 0.46, y + size * 0.4], [x - size * 0.46, y + size * 0.4]],
      right: [[x + size * 0.48, y], [x - size * 0.4, y + size * 0.46], [x - size * 0.4, y - size * 0.46]],
      down: [[x, y + size * 0.48], [x + size * 0.46, y - size * 0.4], [x - size * 0.46, y - size * 0.4]],
      left: [[x - size * 0.48, y], [x + size * 0.4, y + size * 0.46], [x + size * 0.4, y - size * 0.46]],
    };
    body = polygon(variants[facing] ?? variants.up, fill, INK, 3);
  }
  if (shape === 'pentagon') {
    body = polygon(Array.from({ length: 5 }, (_, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / 5;
      return [x + Math.cos(angle) * size * 0.47, y + Math.sin(angle) * size * 0.47];
    }), fill, INK, 3);
  }
  if (shape === 'hexagon') {
    body = polygon(Array.from({ length: 6 }, (_, index) => {
      const angle = index * Math.PI / 3;
      return [x + Math.cos(angle) * size * 0.46, y + Math.sin(angle) * size * 0.46];
    }), fill, INK, 3);
  }
  if (mark === 'dot') body += circle(x, y, size * 0.09, { fill: INK, strokeWidth: 0 });
  if (mark === 'ring') body += circle(x, y, size * 0.14, { fill: PAPER, strokeWidth: 3 });
  if (mark === 'stripe') body += line(x - size * 0.24, y, x + size * 0.24, y, { stroke: INK, width: 4 });
  if (mark === 'cross') {
    body += line(x - size * 0.18, y - size * 0.18, x + size * 0.18, y + size * 0.18, { stroke: INK, width: 4 });
    body += line(x + size * 0.18, y - size * 0.18, x - size * 0.18, y + size * 0.18, { stroke: INK, width: 4 });
  }
  return body;
}

function drawRover(x, y, scale = 1) {
  return rect(x, y, 62 * scale, 32 * scale, { fill: MARS, rx: 8, strokeWidth: 3 })
    + rect(x + 12 * scale, y - 19 * scale, 35 * scale, 22 * scale, { fill: SKY, rx: 7, strokeWidth: 3 })
    + line(x + 48 * scale, y - 14 * scale, x + 63 * scale, y - 28 * scale, { width: 3 })
    + circle(x + 65 * scale, y - 30 * scale, 4 * scale, { fill: GOLD, strokeWidth: 2 })
    + circle(x + 14 * scale, y + 36 * scale, 9 * scale, { fill: INK, strokeWidth: 2 })
    + circle(x + 49 * scale, y + 36 * scale, 9 * scale, { fill: INK, strokeWidth: 2 });
}

function drawDots(count, x, y, columns = 5, fill = ORANGE) {
  let body = '';
  for (let index = 0; index < count; index++) {
    body += circle(x + (index % columns) * 22, y + Math.floor(index / columns) * 22, 7, { fill, strokeWidth: 2 });
  }
  return body;
}

function drawBaseTen(visual) {
  let body = roundedLabel(22, 18, 140, `${visual.bay}'s crate`, SKY);
  for (let index = 0; index < visual.tens; index++) {
    const column = index % 5;
    const row = Math.floor(index / 5);
    const x = 28 + column * 58;
    const y = 75 + row * 96;
    body += rect(x, y, 42, 82, { fill: GOLD, rx: 7, strokeWidth: 3 });
    for (let mark = 1; mark < 10; mark++) body += line(x + 5, y + mark * 7.4, x + 37, y + mark * 7.4, { stroke: '#9b6b31', width: 1 });
  }
  for (let index = 0; index < visual.ones; index++) {
    const x = 335 + (index % 3) * 42;
    const y = 77 + Math.floor(index / 3) * 42;
    body += rect(x, y, 30, 30, { fill: GREEN, rx: 5, strokeWidth: 3 });
  }
  body += text(145, 286, 'TENS', { size: 18 }) + text(388, 286, 'ONES', { size: 18 });
  body += line(305, 58, 305, 292, { stroke: '#b7a88f', width: 3, dash: '7 7' });
  return svg(body, visual.description, 500, 310);
}

function drawDigitCards(visual) {
  const modeText = {
    greatest: 'Build the greatest number',
    least: 'Build the least number',
    swap: 'Swap the two places',
    difference: 'Compare both orders',
  }[visual.mode];
  let body = spacePanel(10, 10, 480, 218, { seed: visual.first * 17 + visual.second * 5 });
  body += sprite('crate', 24, 22, 42);
  body += text(270, 47, 'Rover Digit Dock', { size: 19, fill: PAPER });
  [visual.first, visual.second].forEach((value, index) => {
    const x = 112 + index * 190;
    body += rect(x, 70, 118, 104, { fill: index ? TINTS.gold : TINTS.mint, rx: 14, strokeWidth: 4 });
    body += text(x + 59, 141, String(value), { size: 54, fill: INK, weight: 700 });
  });
  body += line(238, 122, 294, 122, { stroke: TINTS.coral, width: 5 });
  body += path('M294 122L280 113L280 131Z', { fill: TINTS.coral, stroke: TINTS.coral, strokeWidth: 1 });
  body += text(250, 205, modeText, { size: 18, fill: PAPER });
  return svg(body, visual.description, 500, 240);
}

function drawFactBoard(visual) {
  let body = spacePanel(10, 10, 480, 220, { seed: visual.a * 31 + visual.b * 7 });
  body += sprite('crystal', 28, 22, 40);
  body += text(270, 45, 'Fact-Family Cargo', { size: 19, fill: PAPER });
  const cards = [
    { x: 35, label: 'Part', value: visual.a, fill: TINTS.mint, icon: 'crystal' },
    { x: 180, label: 'Part', value: visual.b, fill: TINTS.gold, icon: 'fuel-cell' },
    { x: 338, label: 'Whole', value: visual.whole, fill: TINTS.coral, icon: 'crate' },
  ];
  cards.forEach(card => {
    body += rect(card.x, 70, 126, 118, { fill: PAPER, rx: 12, strokeWidth: 3 });
    body += sprite(card.icon, card.x + 12, 82, 34);
    body += text(card.x + 82, 103, card.label, { size: 16 });
    body += rect(card.x + 18, 122, 90, 48, { fill: card.fill, rx: 8, strokeWidth: 2 });
    body += text(card.x + 63, 154, String(card.value), { size: 25 });
  });
  body += text(169, 147, '+', { size: 28, fill: PAPER });
  body += text(319, 147, '=', { size: 28, fill: PAPER });
  return svg(body, visual.description, 500, 240);
}

function drawSkipTrail(visual) {
  const values = Array.from({ length: visual.length }, (_, index) => visual.start + visual.direction * visual.step * index);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = 55;
  const width = 390;
  const y = 164;
  const target = values[visual.missingIndex];
  const targetX = x + (target - min) / (max - min) * width;
  let body = rect(12, 12, 486, 226, { fill: '#f5f1e6', rx: 18, strokeWidth: 3 });
  body += sprite('rover', 22, 24, 42);
  body += text(270, 48, visual.direction > 0 ? 'Forward Signal Trail' : 'Return Signal Trail', { size: 19 });
  body += numberLine({
    min, max, x, y, width, step: visual.step, labelEvery: 1, labelSize: 16,
    hideLabels: [target],
    marks: [
      { at: values[0], sprite: 'rover', size: 34 },
      { at: values.at(-1), sprite: 'flag', size: 34 },
    ],
    hops: values.slice(0, -1).map((value, index) => ({ from: value, to: values[index + 1] })),
  });
  body += text(targetX, y + 35, '?', { size: 20, fill: MARS });
  return svg(body, visual.description, 510, 250);
}

function drawNumberLine(visual) {
  const left = 45;
  const right = 470;
  const gap = (right - left) / (visual.count - 1);
  let body = roundedLabel(20, 18, 150, `${visual.code}'s line`, SKY)
    + line(left, 150, right, 150, { width: 5 });
  for (let index = 0; index < visual.count; index++) {
    const x = left + index * gap;
    body += line(x, 133, x, 168, { width: 4 });
    if (index === 0 || index === visual.count - 1 || (visual.level === 1 && index % 2 === 0)) {
      body += text(x, 198, String(visual.start + index * visual.step), { size: 18 });
    }
  }
  const targetX = left + visual.targetIndex * gap;
  body += path(`M${targetX - 17} 76 L${targetX + 17} 76 L${targetX} 120 Z`, { fill: MARS, strokeWidth: 3 });
  body += text(260, 250, `Each jump is ${visual.step}`, { size: 19, fill: PURPLE });
  return svg(body, visual.description, 510, 275);
}

function drawHundredMove(visual) {
  const cell = 64;
  const x0 = 125;
  const y0 = 32;
  const startRow = 1;
  const startCol = 1;
  let body = roundedLabel(18, 18, 88, visual.rover, SKY);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const value = visual.start + (row - 1) * 10 + (col - 1);
      const x = x0 + col * cell;
      const y = y0 + row * cell;
      body += rect(x, y, cell, cell, { fill: row === startRow && col === startCol ? '#f7ddb7' : PAPER, rx: 4, strokeWidth: 2 });
      body += text(x + cell / 2, y + 39, String(value), { size: 18 });
    }
  }
  body += drawRover(x0 + 82, y0 + 82, 0.5);
  const startX = x0 + startCol * cell + cell / 2;
  const startY = y0 + startRow * cell + cell / 2;
  const endX = startX + visual.dx * 24;
  const endY = startY + visual.dy * 24;
  body += line(startX, startY, endX, startY, { stroke: PURPLE, width: 6 });
  body += line(endX, startY, endX, endY, { stroke: MARS, width: 6 });
  if (visual.dx) body += polygon([[endX, startY], [endX - Math.sign(visual.dx) * 13, startY - 9], [endX - Math.sign(visual.dx) * 13, startY + 9]], PURPLE);
  if (visual.dy) body += polygon([[endX, endY], [endX - 9, endY - Math.sign(visual.dy) * 13], [endX + 9, endY - Math.sign(visual.dy) * 13]], MARS);
  const across = visual.dx ? `${Math.abs(visual.dx)} ${visual.dx > 0 ? 'right' : 'left'}` : 'no sideways move';
  const vertical = visual.dy ? `${Math.abs(visual.dy)} ${visual.dy > 0 ? 'down' : 'up'}` : 'no vertical move';
  body += text(260, 262, `${across}; ${vertical}`, { size: 18 });
  return svg(body, visual.description, 500, 285);
}

function drawBar(visual) {
  const x = 42;
  const y = 112;
  const width = 430;
  const leftWidth = width * visual.left / visual.whole;
  let body = roundedLabel(18, 18, 155, `${visual.code}'s bar`, SKY)
    + rect(x, y, width, 82, { fill: PAPER, rx: 8, strokeWidth: 3 })
    + rect(x, y, leftWidth, 82, { fill: GOLD, rx: 8, strokeWidth: 3 })
    + line(x + leftWidth, y, x + leftWidth, y + 82, { width: 3 });
  const leftLabel = visual.unknown === 'left' ? '?' : visual.left;
  const rightLabel = visual.unknown === 'right' ? '?' : visual.right;
  body += text(x + leftWidth / 2, y + 50, String(leftLabel), { size: 24 });
  body += text(x + leftWidth + (width - leftWidth) / 2, y + 50, String(rightLabel), { size: 24 });
  body += line(x, 224, x + width, 224, { stroke: PURPLE, width: 3 });
  body += line(x, 215, x, 233, { stroke: PURPLE, width: 3 }) + line(x + width, 215, x + width, 233, { stroke: PURPLE, width: 3 });
  body += text(x + width / 2, 258, visual.unknown === 'whole' ? '?' : String(visual.whole), { size: 23, fill: PURPLE });
  return svg(body, visual.description, 510, 285);
}

function drawScale(leftX, rightX, beamY, leftY, rightY) {
  return line(250, 76, 250, 233, { width: 7 })
    + polygon([[220, 244], [280, 244], [250, 210]], GOLD, INK, 3)
    + line(105, beamY, 395, beamY, { stroke: PURPLE, width: 7 })
    + line(105, beamY, leftX, leftY, { width: 3 }) + line(395, beamY, rightX, rightY, { width: 3 })
    + path(`M${leftX - 70} ${leftY} Q${leftX} ${leftY + 35} ${leftX + 70} ${leftY}`, { fill: PALE, strokeWidth: 3 })
    + path(`M${rightX - 70} ${rightY} Q${rightX} ${rightY + 35} ${rightX + 70} ${rightY}`, { fill: PALE, strokeWidth: 3 });
}

function drawNumberBalance(visual) {
  let body = roundedLabel(18, 16, 150, `${visual.code}'s scale`, SKY) + drawScale(105, 395, 83, 177, 177);
  visual.left.forEach((value, index) => {
    body += roundedLabel(48 + index * 55, 135, 48, String(value), GOLD);
  });
  visual.rightKnown.forEach((value, index) => {
    body += roundedLabel(335 + index * 55, 135, 48, String(value), GREEN);
  });
  body += roundedLabel(390, 135, 48, '?', MARS);
  return svg(body, visual.description, 500, 270);
}

function drawCompareScene(visual) {
  let body = roundedLabel(18, 15, 160, `${visual.code}'s crates`, SKY);
  const groups = [
    { x: 35, name: visual.leftName, start: visual.leftStart, change: visual.leftChange, fill: GREEN },
    { x: 285, name: visual.rightName, start: visual.rightStart, change: visual.rightChange, fill: ORANGE },
  ];
  for (const group of groups) {
    body += text(group.x + 90, 68, group.name, { size: 20 });
    body += rect(group.x, 82, 180, 118, { fill: PALE, rx: 14, strokeWidth: 3 });
    body += drawDots(group.start, group.x + 27, 109, 6, group.fill);
    const sign = group.change >= 0 ? '+' : '-';
    body += roundedLabel(group.x + 49, 216, 82, `${sign}${Math.abs(group.change)}`, group.change >= 0 ? SKY : '#f5d3cc');
  }
  return svg(body, visual.description, 500, 275);
}

function drawBeadChoice(visual) {
  const body = tokenShape(visual.shape, 70, 66, 86, visual.fill, visual.mark, visual.facing);
  return svg(body, visual.description, 140, 132);
}

function drawBeadGap(visual) {
  const gap = 58;
  let body = roundedLabel(18, 16, 140, `${visual.code}'s beads`, SKY)
    + line(37, 145, 475, 145, { stroke: '#a47a52', width: 7 });
  visual.sequence.forEach((bead, index) => {
    const x = 48 + index * gap;
    if (index === visual.gapIndex) {
      body += circle(x, 145, 25, { fill: PAPER, stroke: PURPLE, strokeWidth: 3 });
      body += text(x, 153, '?', { size: 24, fill: PURPLE });
    } else {
      body += tokenShape(bead.shape, x, 145, 48, bead.fill, bead.mark, bead.facing);
    }
  });
  return svg(body, visual.description, 515, 235);
}

function drawGrowingTiles(visual) {
  let body = roundedLabel(18, 16, 150, `${visual.code}'s tiles`, SKY);
  visual.counts.forEach((count, stage) => {
    const x = 36 + stage * 145;
    body += text(x + 53, 68, `Stage ${stage + 1}`, { size: 17 });
    for (let index = 0; index < count; index++) {
      const col = index % 5;
      const row = Math.floor(index / 5);
      body += rect(x + col * 21, 178 - row * 21, 20, 20, { fill: stage % 2 ? GOLD : GREEN, rx: 3, strokeWidth: 1.5 });
    }
    body += roundedLabel(x + 20, 215, 65, String(count), PAPER);
  });
  body += text(455, 147, '?', { size: 42, fill: PURPLE });
  return svg(body, visual.description, 510, 270);
}

function drawCodeTable(visual) {
  let body = roundedLabel(18, 16, 145, `${visual.code}'s code`, SKY)
    + roundedLabel(110, 63, 120, 'INPUT', PALE)
    + roundedLabel(270, 63, 120, 'OUTPUT', PALE);
  visual.rows.forEach((row, index) => {
    const y = 108 + index * 43;
    body += roundedLabel(130, y, 80, String(row.input), PAPER);
    body += line(217, y + 17, 275, y + 17, { stroke: PURPLE, width: 4 });
    body += polygon([[275, y + 17], [262, y + 9], [262, y + 25]], PURPLE);
    body += roundedLabel(290, y, 80, row.output == null ? '?' : String(row.output), row.output == null ? '#f5d3cc' : PAPER);
  });
  return svg(body, visual.description, 480, 300);
}

function drawShapeScene(visual) {
  let body = roundedLabel(16, 14, 125, `${visual.code}'s map`, SKY);
  const shapes = [];
  Object.entries(visual.counts).forEach(([shape, count]) => {
    for (let index = 0; index < count; index++) shapes.push(shape);
  });
  shapes.forEach((shape, index) => {
    const col = index % 6;
    const row = Math.floor(index / 6);
    const x = 54 + col * 76;
    const y = 88 + row * 72;
    const fills = [GREEN, GOLD, MARS, PURPLE];
    body += tokenShape(shape, x, y, 50, fills[(index + row) % fills.length], index % 3 === 0 ? 'dot' : 'none');
  });
  body += line(20, 270, 490, 270, { stroke: '#b98a66', width: 5 });
  return svg(body, visual.description, 510, 295);
}

function drawSolid(visual) {
  let body = '';
  if (visual.shape === 'sphere') {
    body = circle(90, 72, 48, { fill: visual.fill, strokeWidth: 4 })
      + path('M54 60 Q90 34 126 60', { stroke: '#ffffff', strokeWidth: 5 });
  }
  if (visual.shape === 'cube') {
    body = polygon([[42, 51], [86, 26], [135, 48], [90, 77]], visual.fill, INK, 4)
      + polygon([[42, 51], [90, 77], [90, 129], [42, 101]], visual.fill, INK, 4)
      + polygon([[90, 77], [135, 48], [135, 101], [90, 129]], PALE, INK, 4);
  }
  if (visual.shape === 'cylinder') {
    body = rect(45, 42, 90, 78, { fill: visual.fill, strokeWidth: 4 })
      + ellipse(90, 42, 45, 17, SKY, INK, 4) + ellipse(90, 120, 45, 17, visual.fill, INK, 4);
  }
  if (visual.shape === 'cone') {
    body = polygon([[90, 22], [43, 116], [137, 116]], visual.fill, INK, 4)
      + ellipse(90, 116, 47, 16, PALE, INK, 4);
  }
  body += text(90, 154, visual.item, { size: 17 });
  return svg(body, visual.description, 180, 170);
}

function gridBody(cells, x, y, size) {
  let body = '';
  cells.forEach((row, rowIndex) => row.forEach((value, colIndex) => {
    const fill = value ? (value === 2 ? GOLD : GREEN) : PAPER;
    body += rect(x + colIndex * size, y + rowIndex * size, size, size, { fill, rx: 3, strokeWidth: 2 });
    if (value === 2) body += circle(x + colIndex * size + size / 2, y + rowIndex * size + size / 2, size * 0.11, { fill: INK, strokeWidth: 0 });
  }));
  return body;
}

function drawMirrorBoard(visual) {
  let body = roundedLabel(18, 15, 150, `${visual.code}'s badge`, SKY)
    + gridBody(visual.left, 106, 57, 48)
    + line(106 + visual.left[0].length * 48 + 12, 46, 106 + visual.left[0].length * 48 + 12, 274, { stroke: PURPLE, width: 5, dash: '9 8' });
  body += text(376, 166, '?', { size: 54, fill: PURPLE });
  return svg(body, visual.description, 500, 300);
}

function drawMirrorChoice(visual) {
  return svg(gridBody(visual.cells, 14, 14, 36), visual.description, 172, 172);
}

function drawCornerBadge(visual) {
  let body = roundedLabel(18, 14, 135, `${visual.code}'s badge`, SKY);
  const gap = 420 / visual.shapes.length;
  visual.shapes.forEach((shape, index) => {
    const x = 55 + gap / 2 + index * gap;
    body += tokenShape(shape, x, 145, 82, [GREEN, GOLD, MARS][index % 3], index % 2 ? 'dot' : 'stripe');
  });
  body += text(250, 240, 'Count every corner', { size: 20, fill: PURPLE });
  return svg(body, visual.description, 500, 270);
}

function drawUnitChain(visual) {
  let body = roundedLabel(17, 14, 142, `${visual.code}'s part`, SKY)
    + rect(38, 82, 430, 54, { fill: MARS, rx: 18, strokeWidth: 3 });
  const unitWidth = Math.min(42, 420 / visual.count);
  const start = 250 - unitWidth * visual.count / 2;
  for (let index = 0; index < visual.count; index++) {
    const x = start + index * unitWidth;
    if (visual.unit === 'cubes') body += rect(x, 168, unitWidth - 3, unitWidth - 3, { fill: index % 2 ? GOLD : GREEN, rx: 4, strokeWidth: 2 });
    if (visual.unit === 'clips') {
      body += ellipse(x + unitWidth / 2, 186, unitWidth * 0.34, 15, PAPER, index % 2 ? ORANGE : GREEN, 4);
      body += ellipse(x + unitWidth / 2, 186, unitWidth * 0.18, 7, PAPER, index % 2 ? ORANGE : GREEN, 3);
    }
    if (visual.unit === 'rods') body += rect(x, 169, unitWidth - 4, 33, { fill: index % 2 ? PURPLE : GOLD, rx: 9, strokeWidth: 2 });
  }
  body += line(start, 226, start + unitWidth * visual.count, 226, { stroke: INK, width: 3 });
  body += line(start, 216, start, 236, { width: 3 }) + line(start + unitWidth * visual.count, 216, start + unitWidth * visual.count, 236, { width: 3 });
  return svg(body, visual.description, 500, 260);
}

function drawRuler(visual) {
  const x0 = 35;
  const y = 166;
  const gap = 400 / visual.max;
  let body = roundedLabel(18, 14, 145, `${visual.code}'s strip`, SKY)
    + rect(x0 + visual.start * gap, 70, (visual.end - visual.start) * gap, 43, { fill: MARS, rx: 12, strokeWidth: 3 })
    + line(x0, y, x0 + visual.max * gap, y, { width: 5 });
  for (let value = 0; value <= visual.max; value++) {
    const x = x0 + value * gap;
    body += line(x, y - (value % 5 ? 18 : 28), x, y + 14, { width: value % 5 ? 2 : 4 });
    if (value % 2 === 0 || visual.max <= 12) body += text(x, y + 43, String(value), { size: 16 });
  }
  body += text(250, 244, 'centimetres', { size: 18, fill: PURPLE });
  return svg(body, visual.description, 500, 270);
}

function drawMassBalance(visual) {
  let body = roundedLabel(18, 15, 145, `${visual.code}'s balance`, SKY) + drawScale(105, 395, 82, 177, 177);
  body += rect(53, 126, 105, 56, { fill: MARS, rx: 17, strokeWidth: 3 })
    + text(105, 160, visual.item, { size: 16, fill: '#fff' });
  visual.leftKnown.forEach((value, index) => {
    body += roundedLabel(48 + index * 56, 187, 50, `${value}g`, PALE);
  });
  visual.rightWeights.forEach((value, index) => {
    body += roundedLabel(322 + index * 55, 137 + (index % 2) * 42, 53, `${value}g`, GOLD);
  });
  return svg(body, visual.description, 500, 285);
}

function drawCup(x, y, size = 22, fill = TINTS.sky) {
  return path(`M${x} ${y}H${x + size}L${x + size - 4} ${y + size}H${x + 4}Z`, { fill, strokeWidth: 2 })
    + path(`M${x + size} ${y + 5}Q${x + size + 10} ${y + 5} ${x + size + 7} ${y + 14}Q${x + size + 5} ${y + 18} ${x + size - 1} ${y + 16}`, { stroke: INK, strokeWidth: 2 });
}

function drawCapacityShelf(visual) {
  let body = spacePanel(10, 10, 480, 252, { seed: visual.capacity * 11 + sum(visual.pours) });
  body += sprite('fuel-cell', 24, 22, 42);
  body += text(270, 46, 'Rover Cup Station', { size: 19, fill: PAPER });
  body += rect(28, 70, 142, 156, { fill: PAPER, rx: 12, strokeWidth: 3 });
  body += sprite('fuel-cell', 67, 84, 64, { fill: TINTS.sky, accent: TINTS.gold });
  body += text(99, 171, 'Tank limit', { size: 16 });
  body += text(99, 204, `${visual.capacity} cups`, { size: 20 });
  visual.pours.forEach((amount, row) => {
    const top = 76 + row * 76;
    body += rect(188, top, 278, 65, { fill: '#fffdf5', rx: 10, strokeWidth: 2 });
    body += text(231, top + 25, `Pour ${row + 1}`, { size: 16 });
    const columns = Math.min(amount, 8);
    for (let index = 0; index < amount; index++) {
      const cupX = 282 + (index % 8) * 21;
      const cupY = top + 11 + Math.floor(index / 8) * 25;
      body += drawCup(cupX, cupY, 15, row ? TINTS.gold : TINTS.mint);
    }
  });
  if (visual.spilled) {
    body += sprite('comet', 192, 216, 30, { rotate: 12 });
    body += text(335, 241, `${visual.spilled} ${visual.spilled === 1 ? 'cup spills' : 'cups spill'}`, { size: 16, fill: PAPER });
  }
  return svg(body, visual.description, 500, 275);
}

function drawScheduleBoard(visual) {
  let body = spacePanel(10, 10, 480, 214, { seed: visual.start + visual.first * 3 + visual.second });
  body += sprite('rover', 24, 20, 42);
  body += text(270, 44, `${visual.rover}'s Schedule`, { size: 19, fill: PAPER });
  const cards = [
    { label: 'Start', value: timeText(visual.start), spriteName: 'flag', fill: TINTS.mint },
    { label: 'Rover check', value: `${visual.first} min`, spriteName: 'rover', fill: TINTS.gold },
    ...(visual.second ? [{ label: 'Signal test', value: `${visual.second} min`, spriteName: 'satellite', fill: TINTS.coral }] : []),
  ];
  const cardWidth = cards.length === 3 ? 140 : 205;
  cards.forEach((card, index) => {
    const x = 28 + index * (cardWidth + 12);
    body += rect(x, 66, cardWidth, 132, { fill: PAPER, rx: 12, strokeWidth: 3 });
    body += sprite(card.spriteName, x + 12, 78, 36);
    body += text(x + cardWidth / 2 + 16, 103, card.label, { size: 16 });
    body += rect(x + 15, 127, cardWidth - 30, 49, { fill: card.fill, rx: 8, strokeWidth: 2 });
    body += text(x + cardWidth / 2, 159, card.value, { size: 20 });
  });
  return svg(body, visual.description, 500, 235);
}

function drawChangeBoard(visual) {
  const itemSprites = {
    battery: 'fuel-cell', flag: 'flag', tube: 'crystal', map: 'satellite',
    lamp: 'star', wheel: 'rover',
  };
  let body = spacePanel(10, 10, 480, 218, { seed: visual.paid * 13 + sum(visual.costs) });
  body += sprite('otter', 24, 20, 42);
  body += text(270, 45, `${visual.buyer}'s Supply Receipt`, { size: 19, fill: PAPER });
  const cards = [
    { label: 'Money paid', value: `Rs ${visual.paid}`, spriteName: 'coin', fill: TINTS.mint },
    ...visual.costs.map((cost, index) => ({
      label: visual.itemNames[index], value: `Rs ${cost}`,
      spriteName: itemSprites[visual.itemNames[index]] ?? 'crate',
      fill: index ? TINTS.coral : TINTS.gold,
    })),
  ];
  const cardWidth = cards.length === 3 ? 140 : 205;
  cards.forEach((card, index) => {
    const x = 28 + index * (cardWidth + 12);
    body += rect(x, 68, cardWidth, 128, { fill: PAPER, rx: 12, strokeWidth: 3 });
    body += sprite(card.spriteName, x + 12, 78, 36);
    body += text(x + cardWidth / 2 + 15, 103, card.label, { size: 16 });
    body += rect(x + 15, 126, cardWidth - 30, 48, { fill: card.fill, rx: 8, strokeWidth: 2 });
    body += text(x + cardWidth / 2, 158, card.value, { size: 20 });
  });
  return svg(body, visual.description, 500, 240);
}

function drawAlienQueue(visual) {
  let body = spacePanel(10, 10, 480, 210, { seed: visual.total * 17 + visual.start });
  body += sprite('flag', 24, 20, 38);
  body += text(270, 43, `${visual.person}'s Alien Queue`, { size: 19, fill: PAPER });
  const size = 42;
  const gap = 10;
  const span = visual.total * size + (visual.total - 1) * gap;
  const x0 = 250 - span / 2;
  body += text(x0, 83, 'FRONT', { size: 16, anchor: 'start', fill: TINTS.gold });
  body += text(x0 + span, 83, 'BACK', { size: 16, anchor: 'end', fill: TINTS.gold });
  for (let index = 0; index < visual.total; index++) {
    const selected = index === visual.start - 1;
    body += sprite('alien', x0 + index * (size + gap), 102, size, {
      fill: selected ? TINTS.coral : index % 2 ? TINTS.purple : TINTS.mint,
      accent: selected ? TINTS.gold : TINTS.sky,
    });
  }
  const selectedX = x0 + (visual.start - 1) * (size + gap) + size / 2;
  body += path(`M${selectedX} 98L${selectedX - 9} 84H${selectedX + 9}Z`, { fill: TINTS.gold, stroke: TINTS.gold, strokeWidth: 1 });
  const clue = visual.mode === 'opposite' ? 'Count this alien from the back'
    : `This alien moves ${visual.move} ${visual.move === 1 ? 'place' : 'places'} forward`;
  body += text(250, 190, clue, { size: 17, fill: PAPER });
  return svg(body, visual.description, 500, 230);
}

function drawClock(visual, choice = false) {
  const size = choice ? 200 : 250;
  const centre = size / 2;
  const radius = choice ? 88 : 103;
  if (choice) {
    const minute = ((visual.minutes % 60) + 60) % 60;
    const hourValue = ((visual.minutes % 720) + 720) % 720 / 60;
    const minuteAngle = minute * Math.PI / 30;
    const hourAngle = hourValue * Math.PI / 6;
    let body = circle(centre, centre, radius, { fill: PAPER, strokeWidth: 4 });
    for (let index = 0; index < 12; index++) {
      const angle = index * Math.PI / 6;
      body += line(
        centre + Math.sin(angle) * (radius - 13), centre - Math.cos(angle) * (radius - 13),
        centre + Math.sin(angle) * (radius - 3), centre - Math.cos(angle) * (radius - 3),
        { width: 3 },
      );
    }
    body += text(centre, 35, '12', { size: 16 });
    body += text(centre + radius - 17, centre + 6, '3', { size: 16 });
    body += text(centre, centre + radius - 10, '6', { size: 16 });
    body += text(centre - radius + 17, centre + 6, '9', { size: 16 });
    body += line(centre, centre, centre + Math.sin(hourAngle) * 48, centre - Math.cos(hourAngle) * 48, { stroke: PURPLE, width: 8 });
    body += line(centre, centre, centre + Math.sin(minuteAngle) * 68, centre - Math.cos(minuteAngle) * 68, { stroke: MARS, width: 5 });
    body += circle(centre, centre, 6, { fill: INK, strokeWidth: 0 });
    return svg(body, visual.description, size, size);
  }
  const body = clockFace(visual.minutes, centre, centre, radius);
  return svg(body, visual.description, size, size);
}

function drawCalendar(visual) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const cellW = 66;
  const cellH = 39;
  const x0 = 24;
  const y0 = 63;
  let body = roundedLabel(16, 13, 155, `${visual.code}'s calendar`, SKY);
  labels.forEach((label, index) => {
    body += rect(x0 + index * cellW, y0, cellW, 34, { fill: index >= 5 ? '#f4d9ce' : PALE, rx: 3, strokeWidth: 2 });
    body += text(x0 + index * cellW + cellW / 2, y0 + 23, label, { size: 16 });
  });
  for (let slot = 0; slot < 42; slot++) {
    const day = slot - visual.startWeekday + 1;
    const col = slot % 7;
    const row = Math.floor(slot / 7);
    const x = x0 + col * cellW;
    const y = y0 + 34 + row * cellH;
    const active = day >= 1 && day <= visual.days;
    const highlighted = day === visual.date;
    body += rect(x, y, cellW, cellH, { fill: highlighted ? GOLD : active ? PAPER : '#eee9dd', rx: 3, strokeWidth: 1.5 });
    if (active) body += text(x + cellW / 2, y + 26, String(day), { size: 16, fill: highlighted ? '#5b3c13' : INK });
  }
  return svg(body, visual.description, 510, 315);
}

function drawCoin(value, x, y, radius = 30) {
  const fills = { 1: '#e7b665', 2: '#d7dce2', 5: '#e7b665', 10: '#d7dce2' };
  return circle(x, y, radius, { fill: fills[value], stroke: '#7b5d36', strokeWidth: 4 })
    + circle(x, y, radius - 6, { fill: fills[value], stroke: '#9a7647', strokeWidth: 2 })
    + text(x, y + 7, String(value), { size: Math.max(16, radius * 0.68), fill: '#4f432f' });
}

function drawCoinPouch(visual) {
  let body = roundedLabel(17, 14, 145, `${visual.code}'s pouch`, SKY);
  visual.coins.forEach((value, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    body += drawCoin(value, 64 + col * 88, 100 + row * 86, 32);
  });
  body += text(250, 263, 'Rupee coins', { size: 19, fill: PURPLE });
  return svg(body, visual.description, 500, 290);
}

function drawCoinTray(visual) {
  let body = rect(8, 8, 204, 124, { fill: PALE, rx: 16, strokeWidth: 3 });
  const gap = 174 / Math.max(visual.coins.length, 1);
  visual.coins.forEach((value, index) => {
    body += drawCoin(value, 25 + gap / 2 + index * gap, 70, Math.min(27, gap * 0.38));
  });
  return svg(body, visual.description, 220, 140);
}

function drawShop(visual) {
  let body = roundedLabel(16, 13, 135, `${visual.code}'s shop`, SKY);
  visual.items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 28 + col * 245;
    const y = 61 + row * 103;
    body += rect(x, y, 218, 87, { fill: row % 2 ? PALE : PAPER, rx: 14, strokeWidth: 3 });
    body += tokenShape(item.shape, x + 48, y + 43, 48, item.fill, item.mark);
    body += text(x + 124, y + 35, item.name, { size: 17 });
    body += roundedLabel(x + 88, y + 45, 108, `Rs ${item.price}`, GOLD);
  });
  return svg(body, visual.description, 520, 285);
}

function drawRoverMap(visual) {
  const size = 56;
  const x0 = 118;
  const y0 = 30;
  let body = roundedLabel(15, 14, 135, `${visual.code}'s grid`, SKY);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      body += rect(x0 + col * size, y0 + row * size, size, size, { fill: (row + col) % 2 ? PAPER : '#f7eee1', rx: 4, strokeWidth: 2 });
    }
  }
  ['A', 'B', 'C', 'D'].forEach((label, index) => body += text(x0 + index * size + size / 2, 277, label, { size: 18 }));
  ['4', '3', '2', '1'].forEach((label, index) => body += text(91, y0 + index * size + 36, label, { size: 18 }));
  const col = visual.start.charCodeAt(0) - 65;
  const rowNumber = Number(visual.start[1]);
  const row = 4 - rowNumber;
  body += drawRover(x0 + col * size + 9, y0 + row * size + 21, 0.55);
  return svg(body, visual.description, 430, 305);
}

function drawBadgeChoice(visual) {
  const body = tokenShape(visual.shape, 82, 76, 104, visual.fill, visual.mark, visual.facing);
  return svg(body, visual.description, 164, 152);
}

function drawAnalogyBoard(visual) {
  let body = roundedLabel(14, 13, 145, `${visual.code}'s badges`, SKY);
  body += tokenShape(visual.a.shape, 82, 146, 78, visual.a.fill, visual.a.mark, visual.a.facing);
  body += text(155, 154, 'becomes', { size: 17, fill: PURPLE });
  body += tokenShape(visual.b.shape, 245, 146, 78, visual.b.fill, visual.b.mark, visual.b.facing);
  body += line(306, 73, 306, 225, { stroke: '#b7a88f', width: 3, dash: '8 8' });
  body += tokenShape(visual.c.shape, 375, 146, 78, visual.c.fill, visual.c.mark, visual.c.facing);
  body += text(462, 158, '?', { size: 48, fill: MARS });
  return svg(body, visual.description, 515, 270);
}

export function renderClass1(visual) {
  if (visual.kind === 'v3-class-1-base-ten') return drawBaseTen(visual);
  if (visual.kind === 'v3-class-1-digit-cards') return drawDigitCards(visual);
  if (visual.kind === 'v3-class-1-fact-board') return drawFactBoard(visual);
  if (visual.kind === 'v3-class-1-skip-trail') return drawSkipTrail(visual);
  if (visual.kind === 'v3-class-1-number-line') return drawNumberLine(visual);
  if (visual.kind === 'v3-class-1-hundred-move') return drawHundredMove(visual);
  if (visual.kind === 'v3-class-1-part-whole') return drawBar(visual);
  if (visual.kind === 'v3-class-1-number-balance') return drawNumberBalance(visual);
  if (visual.kind === 'v3-class-1-compare-change') return drawCompareScene(visual);
  if (visual.kind === 'v3-class-1-bead-gap') return drawBeadGap(visual);
  if (visual.kind === 'v3-class-1-bead-choice') return drawBeadChoice(visual);
  if (visual.kind === 'v3-class-1-growing-tiles') return drawGrowingTiles(visual);
  if (visual.kind === 'v3-class-1-code-table') return drawCodeTable(visual);
  if (visual.kind === 'v3-class-1-shape-scene') return drawShapeScene(visual);
  if (visual.kind === 'v3-class-1-solid-choice') return drawSolid(visual);
  if (visual.kind === 'v3-class-1-mirror-board') return drawMirrorBoard(visual);
  if (visual.kind === 'v3-class-1-mirror-choice') return drawMirrorChoice(visual);
  if (visual.kind === 'v3-class-1-corner-badge') return drawCornerBadge(visual);
  if (visual.kind === 'v3-class-1-unit-chain') return drawUnitChain(visual);
  if (visual.kind === 'v3-class-1-ruler-span') return drawRuler(visual);
  if (visual.kind === 'v3-class-1-mass-balance') return drawMassBalance(visual);
  if (visual.kind === 'v3-class-1-capacity-shelf') return drawCapacityShelf(visual);
  if (visual.kind === 'v3-class-1-clock-read') return drawClock(visual, false);
  if (visual.kind === 'v3-class-1-clock-choice') return drawClock(visual, true);
  if (visual.kind === 'v3-class-1-schedule-board') return drawScheduleBoard(visual);
  if (visual.kind === 'v3-class-1-calendar') return drawCalendar(visual);
  if (visual.kind === 'v3-class-1-coin-pouch') return drawCoinPouch(visual);
  if (visual.kind === 'v3-class-1-coin-tray') return drawCoinTray(visual);
  if (visual.kind === 'v3-class-1-shop-board') return drawShop(visual);
  if (visual.kind === 'v3-class-1-change-board') return drawChangeBoard(visual);
  if (visual.kind === 'v3-class-1-alien-queue') return drawAlienQueue(visual);
  if (visual.kind === 'v3-class-1-rover-map') return drawRoverMap(visual);
  if (visual.kind === 'v3-class-1-odd-choice') return drawBadgeChoice(visual);
  if (visual.kind === 'v3-class-1-analogy-board') return drawAnalogyBoard(visual);
  if (visual.kind === 'v3-class-1-analogy-choice') return drawBadgeChoice(visual);
  throw new Error(`Unsupported class-1 diagram: ${visual.kind}`);
}
