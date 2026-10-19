// Figure pictures for the Class 4 paper-style figure questions: mirror words, folded paper, cell figures, bar graphs, weighing scales.
import { GREEN, INK, ORANGE, PAPER, circle, line, path, rect, svg, text } from './diagram-kit.mjs';

const GOLD = '#f6dfae', PALE = '#e6f3ef';

function cellsAt(cells, x, y, size) {
  let body = '';
  cells.forEach((row, r) => row.forEach((value, c) => {
    body += rect(x + c * size, y + r * size, size, size, { fill: value === null ? GOLD : value ? GREEN : PAPER, strokeWidth: 2 })
      + (value === null ? text(x + c * size + size / 2, y + r * size + size / 2 + 7, '?', { size: 20 }) : '');
  }));
  return body;
}

function cellsChoice(v) {
  const size = Math.min(40, Math.floor(260 / v.cells[0].length), Math.floor(200 / v.cells.length));
  const w = v.cells[0].length * size, h = v.cells.length * size;
  return svg(cellsAt(v.cells, 12, 12, size), v.description, w + 24, h + 24);
}

function patternGap(v) {
  const size = 44, n = v.cells.length;
  return svg(cellsAt(v.cells, 16, 16, size) + text(16 + n * size / 2, 16 + n * size + 28, 'Left and right sides match like a mirror', { size: 16 }), v.description, n * size + 32, n * size + 44);
}

function analogyRow(v) {
  const size = 26, n = v.grids[0].length, w = n * size, gap = 46;
  let body = '', x = 12;
  v.grids.forEach((grid, i) => {
    body += (grid ? cellsAt(grid, x, 30, size) : rect(x, 30, w, w, { fill: GOLD, strokeWidth: 3 }) + text(x + w / 2, 30 + w / 2 + 9, '?', { size: 28 })) + text(x + w / 2, 20, ['P', 'Q', 'R', 'S'][i], { size: 18 });
    if (i % 2 === 0) body += line(x + w + 8, 30 + w / 2, x + w + gap - 8, 30 + w / 2, { width: 3, stroke: ORANGE }) + path(`M${x + w + gap - 16} ${30 + w / 2 - 6}L${x + w + gap - 8} ${30 + w / 2}L${x + w + gap - 16} ${30 + w / 2 + 6}`, { stroke: ORANGE, strokeWidth: 3 });
    x += w + (i % 2 === 0 ? gap : gap - 4);
  });
  return svg(body, v.description, x + 8, 30 + n * size + 14);
}

function mirrorWord(v) {
  const water = v.mode === 'water';
  let body = rect(8, 8, 404, 124, { fill: PALE, rx: 12, strokeWidth: 2 });
  if (water) {
    body += text(210, 70, v.word, { size: 46 }) + line(40, 92, 380, 92, { stroke: ORANGE, width: 4, dash: '8 6' }) + text(210, 122, 'mirror on the floor', { size: 16 });
  } else {
    body += text(150, 82, v.word, { size: 46 }) + line(300, 22, 300, 118, { stroke: ORANGE, width: 4, dash: '8 6' }) + text(350, 76, 'mirror', { size: 18 });
  }
  return svg(body, v.description, 420, 140);
}

function foldSheet(v) {
  const size = v.rows.length > 4 ? 38 : 46, x0 = 56, y0 = 46;
  let body = text(x0 + v.cols.length * size / 2, 22, `Folded: ${v.how}`, { size: 16 });
  v.cols.forEach((col, c) => { body += text(x0 + c * size + size / 2, 40, `C${col}`, { size: 16 }); });
  v.rows.forEach((row, r) => { body += text(x0 - 10, y0 + r * size + size / 2 + 6, `R${row}`, { size: 16, anchor: 'end' }); });
  v.rows.forEach((row, r) => v.cols.forEach((col, c) => { body += rect(x0 + c * size, y0 + r * size, size, size, { fill: PALE, strokeWidth: 2 }); }));
  const hc = v.cols.indexOf(v.hole.c), hr = v.rows.indexOf(v.hole.r);
  body += circle(x0 + hc * size + size / 2, y0 + hr * size + size / 2, 11, { fill: INK });
  return svg(body, v.description, x0 + v.cols.length * size + 40, y0 + v.rows.length * size + 14);
}

function barScale(v) {
  const left = 58, top = 20, plotH = 190, step = plotH / v.top, bw = Math.min(54, 300 / v.labels.length);
  const slot = 330 / v.labels.length;
  let body = '';
  for (let k = 0; k <= v.top; k++) {
    const y = top + plotH - k * step;
    body += line(left, y, left + 340, y, { stroke: k ? '#c9d3df' : INK, width: k ? 1 : 2 });
    if (k % v.every === 0) body += text(left - 6, y + 6, k * v.scale, { size: 16, anchor: 'end' });
  }
  v.labels.forEach((label, i) => {
    const h = v.units[i] * step, x = left + 12 + i * slot;
    body += rect(x, top + plotH - h, bw, h, { fill: i % 2 ? ORANGE : GREEN, strokeWidth: 2 }) + text(x + bw / 2, top + plotH + 24, label, { size: 16 });
  });
  return svg(body, v.description, 420, top + plotH + 38);
}

function shapeIcon(shape, x, y) {
  if (shape === 'circle') return circle(x, y, 15, { fill: ORANGE });
  if (shape === 'triangle') return path(`M${x} ${y - 16}L${x + 17} ${y + 14}L${x - 17} ${y + 14}Z`, { fill: GOLD, strokeWidth: 2 });
  return rect(x - 14, y - 14, 28, 28, { fill: GREEN, strokeWidth: 2 });
}

function weighScales(v) {
  let body = '';
  v.rows.forEach((row, i) => {
    const y = 30 + i * 56;
    let x = 36;
    row.parts.forEach(shape => { body += shapeIcon(shape, x, y); x += 40; });
    body += text(x + 8, y + 7, '=', { size: 24 }) + rect(x + 28, y - 20, 84, 40, { fill: PAPER, rx: 8, strokeWidth: 2 }) + text(x + 70, y + 8, `${row.total} g`, { size: 20 });
  });
  return svg(body, v.description, 330, 30 + v.rows.length * 56);
}

const DRAW = {
  'cells-choice': cellsChoice, 'pattern-gap': patternGap, 'analogy-row': analogyRow, 'mirror-word': mirrorWord,
  'fold-sheet': foldSheet, 'bar-scale': barScale, 'weigh-scales': weighScales,
};

export const FIGURE_KINDS = Object.keys(DRAW).map(kind => `v3-class-4-${kind}`);
export const renderFigures = visual => DRAW[visual.kind.replace('v3-class-4-', '')]?.(visual) ?? null;
