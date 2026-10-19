// Grade-specific scene helpers for bank3-class-5.mjs. Not a general sprite kit: only class-5 diagrams.
// Every helper returns an SVG body string built from diagram-kit primitives, deterministic and markup-safe.
import { circle, escape, GREEN, icon, INK, line, ORANGE, path, PAPER, rect, text } from './diagram-kit.mjs';
import { numberText } from './bank-shared.mjs';
import { sprite, spriteRow } from './sprites.mjs';

export const GOLD = '#b68a2e';
export const BLUE = '#3d6ea8';
export const PLUM = '#7a5a95';

// A row of rounded tiles, each showing one text value (digit cards, number cards, decimal cards).
export function cardRow(values, { width = 520, highlight = [], fill = PAPER, highlightFill = GOLD, size = 22 } = {}) {
  const n = values.length;
  const gap = 10;
  const tileW = Math.min(86, Math.floor((width - gap * (n + 1)) / n));
  const tileH = 72;
  const totalW = tileW * n + gap * (n + 1);
  const left = (width - totalW) / 2;
  let body = '';
  values.forEach((value, index) => {
    const x = left + gap + index * (tileW + gap);
    const isHigh = highlight.includes(index);
    body += rect(x, 20, tileW, tileH, { fill: isHigh ? highlightFill : fill, stroke: INK, rx: 10, strokeWidth: isHigh ? 4 : 2 });
    body += text(x + tileW / 2, 20 + tileH / 2 + size * 0.35, String(value), { size, anchor: 'middle' });
  });
  return body;
}

// A horizontal number line with labelled ticks and an optional arrow pointer at a value between min and max.
export function numberTrack({ min, max, step, labels, pointerAt, width = 500, y = 90 } = {}) {
  const left = 40;
  const right = width - 20;
  const span = right - left;
  const at = value => left + ((value - min) / (max - min)) * span;
  let body = line(left, y, right, y, { width: 3 });
  const count = Math.round((max - min) / step);
  for (let index = 0; index <= count; index++) {
    const value = min + index * step;
    const x = at(value);
    body += line(x, y - 12, x, y + 12, { width: 2 });
    const label = labels ? labels[index] : String(value);
    if (label != null) body += text(x, y + 32, label, { size: 16 });
  }
  if (pointerAt != null) {
    const x = at(pointerAt);
    body += path(`M ${x} ${y - 46} L ${x - 10} ${y - 20} L ${x + 10} ${y - 20} Z`, { fill: ORANGE, stroke: INK });
    body += line(x, y - 20, x, y - 6, { stroke: ORANGE, width: 3 });
  }
  return body;
}

// Text rotated 90 degrees clockwise so a long word can run top-to-bottom beside a narrow column.
function verticalLabel(x, y, value, { size = 16, fill = INK } = {}) {
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="600" text-anchor="start" fill="${fill}" transform="rotate(90 ${x} ${y})">${escape(value)}</text>`;
}

// A place-value column chart: one box per digit, place names running downward below, one column highlighted.
export function placeValueChart({ digits, places, highlightIndex, width = 480 } = {}) {
  const n = digits.length;
  const boxW = 56;
  const gap = 10;
  const totalW = boxW * n + gap * (n - 1);
  const left = (width - totalW) / 2;
  let body = '';
  digits.forEach((digit, index) => {
    const x = left + index * (boxW + gap);
    const isHigh = index === highlightIndex;
    body += rect(x, 24, boxW, 56, { fill: isHigh ? GOLD : PAPER, stroke: INK, rx: 8, strokeWidth: isHigh ? 4 : 2 });
    body += text(x + boxW / 2, 62, String(digit), { size: 26 });
    body += verticalLabel(x + boxW / 2 - 8, 96, places[index], { size: 16, fill: isHigh ? INK : '#6b6456' });
  });
  return body;
}

// A 2x2 grid of larger number tiles, used to compare/order a small set of numbers.
export function numberGrid(numbers, { width = 480 } = {}) {
  const tileW = 200;
  const tileH = 68;
  const gapX = 24;
  const gapY = 18;
  const totalW = tileW * 2 + gapX;
  const left = (width - totalW) / 2;
  let body = '';
  numbers.forEach((value, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = left + col * (tileW + gapX);
    const y = 16 + row * (tileH + gapY);
    body += rect(x, y, tileW, tileH, { fill: PAPER, stroke: INK, rx: 10 });
    body += text(x + tileW / 2, y + tileH / 2 + 8, numberText(value), { size: 22, anchor: 'middle' });
  });
  return body;
}

export const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'lakhs', 'ten lakhs'];
export const DECIMAL_PLACE_NAMES = ['tenths', 'hundredths', 'thousandths'];

// A decimal place-value chart: whole-number boxes, a decimal point, then fraction-part boxes, one column highlighted.
export function decimalPlaceChart({ wholeDigits, fracDigits, highlightSide, highlightIndex, width = 480 } = {}) {
  const boxW = 52;
  const gap = 8;
  const dotGap = 18;
  const n = wholeDigits.length + fracDigits.length;
  const totalW = boxW * n + gap * (n - 1) + dotGap;
  let x = (width - totalW) / 2;
  let body = '';
  wholeDigits.forEach((digit, index) => {
    const fromRight = wholeDigits.length - 1 - index;
    const isHigh = highlightSide === 'whole' && index === highlightIndex;
    body += rect(x, 24, boxW, 56, { fill: isHigh ? GOLD : PAPER, stroke: INK, rx: 8, strokeWidth: isHigh ? 4 : 2 });
    body += text(x + boxW / 2, 62, String(digit), { size: 26 });
    body += verticalLabel(x + boxW / 2 - 8, 96, PLACE_NAMES[fromRight] ?? `place ${fromRight}`, { size: 16, fill: isHigh ? INK : '#6b6456' });
    x += boxW + gap;
  });
  body += circle(x + dotGap / 2 - gap / 2, 74, 4, { fill: INK, strokeWidth: 0 });
  x += dotGap;
  fracDigits.forEach((digit, index) => {
    const isHigh = highlightSide === 'frac' && index === highlightIndex;
    body += rect(x, 24, boxW, 56, { fill: isHigh ? GOLD : PAPER, stroke: INK, rx: 8, strokeWidth: isHigh ? 4 : 2 });
    body += text(x + boxW / 2, 62, String(digit), { size: 26 });
    body += verticalLabel(x + boxW / 2 - 8, 96, DECIMAL_PLACE_NAMES[index] ?? `place ${index}`, { size: 16, fill: isHigh ? INK : '#6b6456' });
    x += boxW + gap;
  });
  return body;
}

// A part-whole bar split into labelled segments; an unknown segment is highlighted gold with "?".
export function barModel(parts, { width = 500, totalLabel } = {}) {
  const n = parts.length;
  const gap = 6;
  const left = 20;
  const barH = 64;
  const totalW = width - 2 * left;
  const segW = (totalW - gap * (n - 1)) / n;
  let body = '';
  if (totalLabel) body += text(width / 2, 18, totalLabel, { size: 16 });
  parts.forEach((part, index) => {
    const x = left + index * (segW + gap);
    const y = 32;
    const unknown = part.value === '?';
    body += rect(x, y, segW, barH, { fill: unknown ? GOLD : PAPER, stroke: INK, rx: 8, strokeWidth: unknown ? 4 : 2 });
    body += text(x + segW / 2, y + barH / 2 - 6, part.label, { size: 16, fill: '#6b6456' });
    body += text(x + segW / 2, y + barH / 2 + 18, String(part.value), { size: 20 });
  });
  return body;
}

// A right-aligned column addition with one digit box hidden ("?") in the top, bottom or result row.
export function columnCalc({ top, bottom, result, hideIn, hideIndex, width = 320 } = {}) {
  const resultDigits = String(result).split('');
  const len = resultDigits.length;
  const cell = 42;
  const totalW = len * cell;
  const left = (width - totalW) / 2;
  let body = '';
  const drawRow = (value, y, hideThis) => {
    const digits = String(value).padStart(len, ' ');
    [...digits].forEach((ch, index) => {
      if (ch === ' ' && !(hideThis && index === hideIndex)) return;
      const x = left + index * cell;
      const isHidden = hideThis && index === hideIndex;
      if (isHidden) body += rect(x + 4, y - 28, cell - 10, 36, { fill: GOLD, stroke: INK, rx: 6 });
      body += text(x + cell / 2, y, isHidden ? '?' : ch, { size: 26 });
    });
  };
  drawRow(top, 36, hideIn === 'top');
  body += text(left - 24, 76, '+', { size: 26 });
  drawRow(bottom, 76, hideIn === 'bottom');
  body += line(left - 12, 92, left + totalW + 6, 92, { width: 3 });
  drawRow(result, 126, hideIn === 'result');
  return body;
}

// A caption plus a row of empty group boxes, used to set the scene for a sharing/remainder question.
export function groupShare({ total, groups, width = 480 } = {}) {
  const boxW = 58;
  const boxH = 58;
  const gap = 12;
  const totalW = boxW * groups + gap * (groups - 1);
  const left = (width - totalW) / 2;
  let body = text(width / 2, 18, `${total} items to share`, { size: 16 });
  for (let index = 0; index < groups; index++) {
    const x = left + index * (boxW + gap);
    body += rect(x, 32, boxW, boxH, { fill: PAPER, stroke: INK, rx: 10 });
    body += text(x + boxW / 2, 32 + boxH / 2 + 7, String(index + 1), { size: 20, fill: '#6b6456' });
  }
  return body;
}

// One or two rows of shape icons joined by "+" and ending in "= total", for symbol-equation puzzles.
export function symbolEquations(lines, { width = 480 } = {}) {
  const rowH = 70;
  let body = '';
  lines.forEach((row, rowIndex) => {
    const y = 10 + rowIndex * rowH;
    let x = 20;
    row.shapes.forEach((shape, shapeIndex) => {
      body += icon(shape, x, y, 44);
      x += 50;
      if (shapeIndex < row.shapes.length - 1) {
        body += text(x, y + 30, '+', { size: 22 });
        x += 26;
      }
    });
    body += text(x + 16, y + 30, `= ${row.total}`, { size: 22 });
  });
  return body;
}

export { circle, escape, icon, line, path, rect, text };

// One or more horizontal strips split into equal cells; shaded cells read left-to-right, used for
// equivalent-fraction bars and for mixed-number pictures (several full strips plus one partial strip).
export function fractionStrips(strips, { width = 420, cellSize = 40 } = {}) {
  let body = '';
  strips.forEach((strip, row) => {
    const { total, shaded } = strip;
    const cell = Math.min(cellSize, Math.floor((width - 20) / total));
    const totalW = cell * total;
    const left = (width - totalW) / 2;
    const y = 10 + row * (cellSize + 16);
    for (let index = 0; index < total; index++) {
      const x = left + index * cell;
      body += rect(x, y, cell, cellSize, { fill: index < shaded ? GOLD : PAPER, stroke: INK, rx: 4 });
    }
  });
  return body;
}

// A number line split into equal fractional ticks across one or more whole units, with an arrow pointer.
export function fractionLine(den, units, pointerAt, { width = 480, y = 90 } = {}) {
  const left = 40;
  const right = width - 20;
  const span = right - left;
  const totalTicks = den * units;
  const at = tick => left + (tick / totalTicks) * span;
  let body = line(left, y, right, y, { width: 3 });
  for (let tick = 0; tick <= totalTicks; tick++) {
    const x = at(tick);
    const isWhole = tick % den === 0;
    body += line(x, y - (isWhole ? 16 : 10), x, y + (isWhole ? 16 : 10), { width: isWhole ? 3 : 2 });
    if (isWhole) body += text(x, y + 32, String(tick / den), { size: 16 });
  }
  const x = at(pointerAt);
  body += path(`M ${x} ${y - 46} L ${x - 10} ${y - 20} L ${x + 10} ${y - 20} Z`, { fill: GOLD, stroke: INK });
  body += line(x, y - 20, x, y - 6, { stroke: GOLD, width: 3 });
  return body;
}

// A 2x2 grid of tiles showing raw fraction-text values (kept as text, not run through numeric formatting).
export function fractionTileGrid(values, { width = 480 } = {}) {
  const tileW = 200;
  const tileH = 68;
  const gapX = 24;
  const gapY = 18;
  const totalW = tileW * 2 + gapX;
  const left = (width - totalW) / 2;
  let body = '';
  values.forEach((value, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = left + col * (tileW + gapX);
    const y = 16 + row * (tileH + gapY);
    body += rect(x, y, tileW, tileH, { fill: PAPER, stroke: INK, rx: 10 });
    body += text(x + tileW / 2, y + tileH / 2 + 8, value, { size: 22, anchor: 'middle' });
  });
  return body;
}

// A rectangle with its width and height labelled (one of the two labels may be "?").
export function labeledRectangle({ width: w, height: h, widthLabel, heightLabel }, { canvasWidth = 420 } = {}) {
  const scale = Math.min(260 / w, 150 / h, 24);
  const rw = w * scale;
  const rh = h * scale;
  const x = (canvasWidth - rw) / 2;
  const y = 30;
  let body = rect(x, y, rw, rh, { fill: PAPER, stroke: INK, strokeWidth: 3 });
  body += text(x + rw / 2, y + rh + 28, widthLabel, { size: 20 });
  body += text(x - 14, y + rh / 2 + 7, heightLabel, { size: 20, anchor: 'end' });
  return body;
}

// Rays from a shared vertex splitting a straight line (180 degrees) or a full turn (360 degrees) into
// consecutive labelled sectors (one label may be "?"); segments is an ordered array of { deg, label }.
export function angleFan(segments, { vertex = { x: 230, y: 180 }, rayLen = 120, arcRadius = 50, startDeg = 180 } = {}) {
  const toXY = deg => {
    const rad = (deg * Math.PI) / 180;
    return { x: vertex.x + rayLen * Math.cos(rad), y: vertex.y - rayLen * Math.sin(rad) };
  };
  let body = '';
  let cumulative = startDeg;
  const rayAngles = [cumulative];
  segments.forEach(segment => { cumulative -= segment.deg; rayAngles.push(cumulative); });
  rayAngles.forEach(deg => {
    const p = toXY(deg);
    body += line(vertex.x, vertex.y, p.x, p.y, { width: 3 });
  });
  body += circle(vertex.x, vertex.y, 4, { fill: INK, strokeWidth: 0 });
  let running = startDeg;
  segments.forEach(segment => {
    const midDeg = running - segment.deg / 2;
    const rad = (midDeg * Math.PI) / 180;
    const lx = vertex.x + arcRadius * Math.cos(rad);
    const ly = vertex.y - arcRadius * Math.sin(rad);
    body += text(lx, ly, segment.label, { size: 18 });
    running -= segment.deg;
  });
  return body;
}

// A cross-shaped cube net: 4 squares in a row plus one flap above and one below the 2nd square.
export function cubeNetCross(labels, { size = 56, width = 320 } = {}) {
  const positions = [
    { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 },
    { col: 1, row: 0 }, { col: 1, row: 2 },
  ];
  const left = (width - 4 * size) / 2;
  const top = 20;
  let body = '';
  positions.forEach(({ col, row }, index) => {
    const x = left + col * size;
    const y = top + row * size;
    body += rect(x, y, size, size, { fill: PAPER, stroke: INK, rx: 6 });
    body += text(x + size / 2, y + size / 2 + 8, String(labels[index]), { size: 24 });
  });
  return body;
}

// A semicircular dial with evenly spaced ticks from 0 to max and a needle pointing at one of them.
// Only the two ends and the midpoint carry a number; the reading comes from counting ticks between them.
export function gaugeDial({ max, divisions, needleAt, unit }, { vertex = { x: 230, y: 195 }, radius = 140 } = {}) {
  const angleFor = index => 180 - (index / divisions) * 180;
  const toXY = (deg, len) => {
    const rad = (deg * Math.PI) / 180;
    return { x: vertex.x + len * Math.cos(rad), y: vertex.y - len * Math.sin(rad) };
  };
  const left = toXY(180, radius);
  const right = toXY(0, radius);
  let body = path(`M ${left.x} ${left.y} A ${radius} ${radius} 0 0 1 ${right.x} ${right.y}`, { strokeWidth: 3 });
  for (let index = 0; index <= divisions; index++) {
    const deg = angleFor(index);
    const outer = toXY(deg, radius);
    const inner = toXY(deg, radius - 12);
    body += line(outer.x, outer.y, inner.x, inner.y, { width: 2 });
  }
  body += text(left.x, vertex.y + 24, '0', { size: 18 });
  body += text(right.x, vertex.y + 24, String(max), { size: 18 });
  const mid = toXY(90, radius + 20);
  body += text(mid.x, mid.y, String(max / 2), { size: 16, fill: '#6b6456' });
  const needleDeg = angleFor(needleAt);
  const tip = toXY(needleDeg, radius - 20);
  body += line(vertex.x, vertex.y, tip.x, tip.y, { stroke: ORANGE, width: 4 });
  body += circle(vertex.x, vertex.y, 7, { fill: INK, strokeWidth: 0 });
  body += text(vertex.x, vertex.y + 38, unit, { size: 16, fill: '#6b6456' });
  return body;
}

// A vertical thermometer: a tube with a scale from min to max (labelled every other tick), a bulb, and a
// filled level at fillAt. A dashed line marks zero when the scale crosses it.
export function thermometerTube({ min, max, step, fillAt, unit }, { x = 150, top = 20, bottom = 210 } = {}) {
  const tubeW = 24;
  const bulbR = 26;
  const bulbY = bottom + bulbR - 4;
  const scale = value => bottom - ((value - min) / (max - min)) * (bottom - top);
  let body = rect(x - tubeW / 2, top, tubeW, bottom - top, { fill: PAPER, stroke: INK, rx: tubeW / 2, strokeWidth: 3 });
  const fillY = scale(fillAt);
  body += rect(x - tubeW / 2 + 5, fillY, tubeW - 10, bulbY + bulbR - fillY, { fill: ORANGE, strokeWidth: 0 });
  const count = Math.round((max - min) / step);
  for (let index = 0; index <= count; index++) {
    const value = min + index * step;
    const y = scale(value);
    const major = index % 2 === 0;
    body += line(x + tubeW / 2, y, x + tubeW / 2 + (major ? 14 : 8), y, { width: major ? 2 : 1 });
    if (major) body += text(x + tubeW / 2 + 20, y + 6, String(value), { size: 16, anchor: 'start' });
  }
  if (min < 0 && max > 0) {
    const zeroY = scale(0);
    body += line(x - tubeW / 2, zeroY, x + tubeW / 2, zeroY, { stroke: BLUE, width: 2, dash: '4 3' });
  }
  body += circle(x, bulbY, bulbR, { fill: ORANGE, stroke: INK, strokeWidth: 3 });
  body += text(x, bulbY + bulbR + 24, unit, { size: 16, fill: '#6b6456' });
  return body;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Number of grid rows a calendarGrid(daysInMonth, startWeekday) will need, so callers can size the canvas.
export const calendarGridRows = (daysInMonth, startWeekday) => Math.ceil((startWeekday + daysInMonth) / 7);

// A month calendar: a 7-column grid with weekday headers, day numbers 1..daysInMonth starting under
// startWeekday (0=Sun .. 6=Sat). `highlight` marks specific days gold; `highlightColumn` tints a whole
// weekday column pale gold so the reader can scan every date that falls on it.
export function calendarGrid(daysInMonth, startWeekday, { highlight = [], highlightColumn = null, width = 476 } = {}) {
  const cols = 7;
  const cellW = width / cols;
  const cellH = 42;
  const top = 40;
  let body = '';
  WEEKDAY_LABELS.forEach((label, col) => {
    body += text(col * cellW + cellW / 2, 20, label, { size: 16, anchor: 'middle' });
  });
  for (let day = 1; day <= daysInMonth; day++) {
    const cellIndex = startWeekday + day - 1;
    const col = cellIndex % cols;
    const row = Math.floor(cellIndex / cols);
    const x = col * cellW;
    const y = top + row * cellH;
    const isHigh = highlight.includes(day);
    const inColumn = highlightColumn !== null && col === highlightColumn;
    const fill = isHigh ? GOLD : inColumn ? '#f1e6c6' : PAPER;
    body += rect(x + 2, y + 2, cellW - 4, cellH - 4, { fill, stroke: INK, strokeWidth: isHigh ? 3 : 1, rx: 6 });
    body += text(x + cellW / 2, y + cellH / 2 + 6, String(day), { size: 16, anchor: 'middle' });
  }
  return body;
}

// A vertical bar chart: bars = [{label, value}] rise from a baseline against faint gridlines spaced
// every `step` up to `max`, each carrying a number label -- the reader must use the scale, not count
// whole squares. Reused for single charts and, called twice, for side-by-side chart comparisons.
export function barChart(bars, { max, step, width = 460, height = 220, barFill = BLUE } = {}) {
  const left = 44;
  const bottom = height - 26;
  const top = 14;
  const plotH = bottom - top;
  const gap = 16;
  const barW = Math.min(64, (width - left - 14 - gap * (bars.length - 1)) / bars.length);
  const scaleY = value => bottom - (value / max) * plotH;
  let body = '';
  for (let value = 0; value <= max; value += step) {
    const y = scaleY(value);
    body += line(left, y, width - 10, y, { stroke: '#d8d2c0', width: 1 });
    body += text(left - 8, y + 5, String(value), { size: 16, anchor: 'end' });
  }
  bars.forEach((bar, index) => {
    const x = left + 10 + index * (barW + gap);
    const y = scaleY(bar.value);
    body += rect(x, y, barW, bottom - y, { fill: barFill, strokeWidth: 2 });
    body += text(x + barW / 2, bottom + 18, bar.label, { size: 16, anchor: 'middle' });
  });
  return body;
}

// Pixel height a twinBarChart(...) will need, so callers can size the canvas.
export const twinBarChartHeight = (height = 190) => height + 26;

// Two small titled bar charts side by side, sharing one scale -- for comparing the same categories
// across two charts (e.g. two weeks). Each side reuses barChart() unchanged inside its own <g> group.
export function twinBarChart(left, right, { max, step, width = 460, height = 190, barFill = BLUE } = {}) {
  const gap = 20;
  const halfW = (width - gap) / 2;
  let body = text(halfW / 2, 14, left.title, { size: 16, anchor: 'middle', weight: 700 });
  body += text(halfW + gap + halfW / 2, 14, right.title, { size: 16, anchor: 'middle', weight: 700 });
  body += `<g transform="translate(0 24)">${barChart(left.bars, { max, step, width: halfW, height, barFill })}</g>`;
  body += `<g transform="translate(${halfW + gap} 24)">${barChart(right.bars, { max, step, width: halfW, height, barFill })}</g>`;
  return body;
}

// Pixel height a pictographArt(rows) will need, so callers can size the canvas.
export const pictographHeight = rows => 48 + rows.length * 42;

// A pictograph: a key row ("each [icon] = N crates") above one row per category, each drawn as that many
// identical icons -- the reader must multiply by the key, not just count icons. Never draws the
// multiplied totals, only the raw per-row icon count and the key value.
export function pictographArt(rows, { key, keyLabel = 'crates', iconShape = 'rectangle', width = 460 } = {}) {
  const labelW = 112;
  const rowH = 42;
  const top = 46;
  let body = icon(iconShape, 0, 2, 22, GOLD);
  body += text(32, 20, `= ${key} ${keyLabel}`, { size: 16, anchor: 'start', fill: '#6b6456' });
  rows.forEach((row, index) => {
    const y = top + index * rowH;
    body += text(0, y + 18, row.label, { size: 16, anchor: 'start' });
    for (let i = 0; i < row.count; i++) body += icon(iconShape, labelW + i * 25, y, 20, GOLD);
    if (index > 0) body += line(0, y - 6, width, y - 6, { stroke: '#e7e1d0', width: 1 });
  });
  return body;
}

// Pixel height a priceTag(...) will need, so callers can size the canvas.
export const priceTagHeight = discounts => 120 + discounts.length * 40;

// A price tag: one stated price (with its own label, e.g. "List price") and one or two discount
// ribbons stacked below it. Never draws the price that results from applying a discount.
export function priceTag({ price, priceLabel, discounts }, { width = 300 } = {}) {
  const tagH = priceTagHeight(discounts);
  let body = rect(10, 10, width - 20, tagH - 20, { fill: '#fff3d6', stroke: GOLD, strokeWidth: 3, rx: 14 });
  body += circle(width - 24, 24, 7, { fill: PAPER, stroke: GOLD, strokeWidth: 3 });
  body += text(width / 2, 46, priceLabel, { size: 16, fill: '#6b6456' });
  body += text(width / 2, 80, `Rs ${price}`, { size: 26, weight: 700 });
  discounts.forEach((pct, index) => {
    const y = 106 + index * 38;
    body += rect(26, y, width - 52, 30, { fill: ORANGE, rx: 15 });
    body += text(width / 2, y + 21, `${pct}% OFF`, { size: 18, fill: '#fff', weight: 700 });
  });
  return body;
}

// Pixel height a timetableBoard(rows) will need, so callers can size the canvas.
export const timetableBoardHeight = rows => 20 + rows.length * 40;

// A board-style list: each row shows a name (left) and a bold value (right) with rules between rows.
// Used for departure timetables (value = a time) and price boards (value = a cost) alike.
export function timetableBoard(rows, { width = 460 } = {}) {
  const rowH = 40;
  const top = 10;
  let body = rect(0, 0, width, timetableBoardHeight(rows), { fill: PAPER, stroke: INK, rx: 10 });
  rows.forEach((row, index) => {
    const y = top + index * rowH;
    const midY = y + rowH / 2 + 6;
    body += text(18, midY, row.name, { size: 18, anchor: 'start' });
    body += text(width - 18, midY, row.value, { size: 18, anchor: 'end', weight: 700 });
    if (index > 0) body += line(10, y, width - 10, y, { stroke: '#d8d2c0', width: 1 });
  });
  return body;
}

// Pixel height a packCompareArt(packs) will need, so callers can size the canvas.
export const packCompareHeight = () => 190;

// 2-3 "value packs" side by side: each card shows a label, a small icon cluster capped at 4 (flavour
// only -- the exact count is always given as text, never meant to be counted), the pack's count and its
// total price. Never shows a per-unit price -- that is what the question asks the player to work out.
export function packCompareArt(packs, { width = 460 } = {}) {
  const gap = 16;
  const cardW = (width - gap * (packs.length + 1)) / packs.length;
  let body = '';
  // Some sprites (e.g. satellite) draw far more path data than others; capping the row lower once there
  // are 3+ cards keeps every combination of icon and pack count under the shared picture-size budget.
  const iconCap = packs.length >= 3 ? 2 : 4;
  packs.forEach((pack, index) => {
    const x = gap + index * (cardW + gap);
    body += rect(x, 10, cardW, 170, { fill: PAPER, stroke: INK, rx: 14 });
    body += text(x + cardW / 2, 34, pack.label, { size: 17, anchor: 'middle', weight: 700 });
    const iconCount = Math.min(pack.count, iconCap);
    const iconSize = 34;
    const rowWidth = iconCount * iconSize + (iconCount - 1) * 6;
    body += spriteRow(pack.icon ?? 'crate', iconCount, x + (cardW - rowWidth) / 2, 46, iconSize, 6);
    body += text(x + cardW / 2, 122, `${pack.count}-pack`, { size: 16, anchor: 'middle', fill: '#6b6456' });
    body += text(x + cardW / 2, 152, pack.price, { size: 20, anchor: 'middle', weight: 700 });
  });
  return body;
}

// Pixel height an itemShelfArt(items) will need, so callers can size the canvas.
export const itemShelfHeight = () => 150;

// A "supply shelf": each of 4-5 differently named items shown as an icon above its name and price, side
// by side. Distinct from timetableBoard's vertical list and packCompareArt's quantity-pack cards.
export function itemShelfArt(items, { width = 460 } = {}) {
  const gap = 14;
  const cardW = (width - gap * (items.length + 1)) / items.length;
  let body = '';
  items.forEach((item, index) => {
    const x = gap + index * (cardW + gap);
    body += rect(x, 8, cardW, 134, { fill: PAPER, stroke: INK, rx: 12 });
    body += sprite(item.icon ?? 'crate', x + cardW / 2 - 20, 18, 40);
    body += text(x + cardW / 2, 100, item.name, { size: 16, anchor: 'middle' });
    body += text(x + cardW / 2, 126, item.price, { size: 17, anchor: 'middle', weight: 700 });
  });
  return body;
}

// ---------------------------------------------------------------------------
// reasoning -- Logic launchpad
// ---------------------------------------------------------------------------

// A horizontal queue line from FRONT to BACK with one or two labelled sprite markers at proportional
// positions (frac in [0,1]). Never reveals a total headcount -- only relative position along the line.
export function queueLine(markers, { width = 480, band = null } = {}) {
  const left = 46;
  const right = width - 46;
  const y = 74;
  const at = frac => left + frac * (right - left);
  let body = '';
  if (band) {
    const x1 = at(band[0]);
    const x2 = at(band[1]);
    body += rect(x1, y - 16, x2 - x1, 32, { fill: '#e9e1f6', stroke: 'none' });
  }
  body += line(left, y, right, y, { width: 4 });
  body += text(left, y - 34, 'FRONT', { size: 16, anchor: 'start', weight: 700 });
  body += text(right, y - 34, 'BACK', { size: 16, anchor: 'end', weight: 700 });
  markers.forEach(marker => {
    const x = at(marker.frac);
    body += sprite(marker.sprite ?? 'astronaut', x - 18, y - 40, 36);
    body += text(x, y + 32, marker.label, { size: 16, anchor: 'middle' });
  });
  return body;
}

// A small square grid of cells with the start cell highlighted and a rover sprite rotated to face
// startFacing ('N' | 'E' | 'S' | 'W'). Used by class-5-grid-route-turns; never shows the route taken.
export function routeGridArt({ size, startX, startY, facing, cell = 46 } = {}) {
  const pad = 20;
  const FACE_ANGLE = { N: -90, E: 0, S: 90, W: 180 };
  let body = '';
  for (let row = 0; row <= size; row++) body += line(pad, pad + row * cell, pad + size * cell, pad + row * cell, { stroke: '#cfc6b0', width: 1 });
  for (let col = 0; col <= size; col++) body += line(pad + col * cell, pad, pad + col * cell, pad + size * cell, { stroke: '#cfc6b0', width: 1 });
  body += rect(pad + startX * cell, pad + startY * cell, cell, cell, { fill: '#fce9c4', stroke: INK, strokeWidth: 2 });
  const cx = pad + startX * cell + cell / 2;
  const cy = pad + startY * cell + cell / 2;
  body += sprite('rover', cx - cell * 0.37, cy - cell * 0.37, cell * 0.74, { rotate: FACE_ANGLE[facing] });
  return body;
}
export const routeGridSize = (size, cell = 46) => 20 * 2 + size * cell;

// A row (or small grid, with `columns`) of icon cells; any item that is null renders as a dashed "?"
// placeholder. Shared by class-5-figure-matrix-analogy's sequence (L1) and 2x2 matrix (L3) layouts.
export function iconSequenceArt(items, { columns = items.length, cell = 60, gap = 14 } = {}) {
  let body = '';
  items.forEach((item, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = 10 + col * (cell + gap);
    const y = 10 + row * (cell + gap);
    body += rect(x, y, cell, cell, { fill: PAPER, stroke: INK, rx: 10 });
    if (item) {
      body += icon(item.shape, x + cell * 0.1, y + cell * 0.1, cell * 0.8, item.fill);
    } else {
      body += line(x + 8, y + 8, x + cell - 8, y + cell - 8, { dash: '5 4' });
      body += line(x + cell - 8, y + 8, x + 8, y + cell - 8, { dash: '5 4' });
      body += text(x + cell / 2, y + cell / 2 + 9, '?', { size: 26, anchor: 'middle' });
    }
  });
  return body;
}
export const iconSequenceSize = (count, columns, cell = 60, gap = 14) => {
  const rows = Math.ceil(count / columns);
  return { width: 20 + columns * (cell + gap) - gap, height: 20 + rows * (cell + gap) - gap };
};

// A junction grid (cols x rows blocks, so (cols+1) x (rows+1) dots) for shortest-route counting.
// blocked, if given, marks one interior junction with an X that cannot be used. A labels the
// top-left start, B labels the bottom-right destination.
export function junctionGridArt({ cols, rows, blocked, cell = 52 } = {}) {
  const pad = 24;
  let body = '';
  for (let row = 0; row <= rows; row++) body += line(pad, pad + row * cell, pad + cols * cell, pad + row * cell, { width: 2 });
  for (let col = 0; col <= cols; col++) body += line(pad + col * cell, pad, pad + col * cell, pad + rows * cell, { width: 2 });
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) body += circle(pad + col * cell, pad + row * cell, 4.5, { fill: INK });
  }
  if (blocked) {
    const bx = pad + blocked.x * cell;
    const by = pad + blocked.y * cell;
    body += line(bx - 9, by - 9, bx + 9, by + 9, { stroke: '#b23a3a', width: 3 });
    body += line(bx + 9, by - 9, bx - 9, by + 9, { stroke: '#b23a3a', width: 3 });
  }
  body += text(pad - 14, pad + 5, 'A', { size: 18, anchor: 'end', weight: 700 });
  body += text(pad + cols * cell + 16, pad + rows * cell + 5, 'B', { size: 18, anchor: 'start', weight: 700 });
  return body;
}
export const junctionGridSize = (cols, rows, cell = 52) => ({ width: 24 * 2 + cols * cell + 16, height: 24 * 2 + rows * cell });

// Rows of a race-prediction board: each row shows one competitor's name and predicted place; rows
// flagged `correct` get a highlighted background and a star mark. Never shows the actual results.
export function predictionBoardArt(rows, { width = 460 } = {}) {
  const rowH = 38;
  const gap = 6;
  let body = '';
  rows.forEach((row, index) => {
    const y = 10 + index * (rowH + gap);
    body += rect(10, y, width - 20, rowH, { fill: row.correct ? '#fbecc0' : PAPER, stroke: INK, rx: 10 });
    body += sprite('rover', 16, y + 2, rowH - 4, { flip: index % 2 === 1 });
    body += text(70, y + rowH / 2 + 6, `${row.name}: predicted ${row.place}`, { size: 16, anchor: 'start' });
    if (row.correct) body += icon('star', width - 50, y + 2, rowH - 4, '#caa43d');
  });
  return body;
}
export const predictionBoardHeight = rows => 20 + rows.length * 44;
