// Pictures for the paper-style Class 4 families: number grids, shaded fractions, stepped perimeter shapes and score tables.
import { GREEN, ORANGE, PAPER, line, path, rect, svg, text } from './diagram-kit.mjs';
import { renderFigures } from './bank3-class-4-real-figart.mjs';

const GOLD = '#f6dfae', PALE = '#e6f3ef';

function gridRule(v) {
  const cellW = 100, cellH = 52, gap = 8, left = (420 - (3 * cellW + 2 * gap)) / 2;
  let body = text(210, 27, 'Every row follows the same rule', { size: 18 });
  v.rows.forEach((row, r) => row.forEach((value, c) => {
    const x = left + c * (cellW + gap), y = 44 + r * (cellH + gap);
    body += rect(x, y, cellW, cellH, { fill: value === null ? GOLD : PALE, rx: 10, strokeWidth: 3 })
      + text(x + cellW / 2, y + 35, value === null ? '?' : value, { size: 26 });
  }));
  return svg(body, v.description, 420, 44 + v.rows.length * (cellH + gap) + 6);
}

function shadedGrid(v) {
  const size = Math.min(60, Math.floor(380 / v.cols), Math.floor(200 / v.rows));
  const x0 = (420 - size * v.cols) / 2, y0 = 52;
  let body = text(210, 28, 'All the parts are equal', { size: 18 });
  for (let i = 0; i < v.rows * v.cols; i++) {
    const x = x0 + (i % v.cols) * size, y = y0 + Math.floor(i / v.cols) * size;
    body += rect(x, y, size, size, { fill: v.shaded.includes(i) ? GREEN : PAPER, strokeWidth: 3 });
  }
  return svg(body, v.description, 420, y0 + v.rows * size + 24);
}

function shapeSides(v) {
  const label = (x, y, value, anchor = 'middle') => text(x, y, value, { size: 20, anchor });
  const outline = path('M90 190L310 190L310 120L210 120L210 50L90 50Z', { fill: PALE, strokeWidth: 4 });
  return svg(outline
    + label(200, 218, `${v.W} cm`) + label(324, 160, `${v.h1} cm`, 'start') + label(150, 40, `${v.w1} cm`)
    + text(72, 128, 'X', { size: 26, anchor: 'end', fill: ORANGE })
    + line(80, 50, 80, 190, { stroke: ORANGE, width: 3, dash: '6 5' }), v.description, 420, 232);
}

function scoreTable(v) {
  const first = 96, cell = Math.floor((410 - first) / v.subjects.length), rowH = 40, x0 = 5, y0 = 8;
  let body = '';
  const heads = ['Name', ...v.subjects];
  heads.forEach((head, c) => {
    const x = c ? x0 + first + (c - 1) * cell : x0, w = c ? cell : first;
    body += rect(x, y0, w, rowH, { fill: GOLD, strokeWidth: 2 }) + text(x + w / 2, y0 + 27, head, { size: 17 });
  });
  v.names.forEach((name, r) => {
    const y = y0 + (r + 1) * rowH;
    body += rect(x0, y, first, rowH, { fill: PALE }) + text(x0 + first / 2, y + 27, name, { size: 17 });
    v.marks[r].forEach((mark, c) => {
      const x = x0 + first + c * cell;
      body += rect(x, y, cell, rowH) + text(x + cell / 2, y + 27, mark, { size: 19 });
    });
  });
  return svg(body, v.description, 420, y0 + (v.names.length + 1) * rowH + 8);
}

const DRAW = { 'grid-rule': gridRule, 'shaded-grid': shadedGrid, 'shape-sides': shapeSides, 'score-table': scoreTable };

export const REAL_KINDS = Object.keys(DRAW).map(kind => `v3-class-4-${kind}`);
export const renderReal = visual => DRAW[visual.kind.replace('v3-class-4-', '')]?.(visual) ?? renderFigures(visual);
