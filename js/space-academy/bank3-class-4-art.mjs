import { GREEN, INK, ORANGE, PAPER, circle, line, path, rect, svg, text, tileGrid } from './diagram-kit.mjs';
import { balanceScale, sprite } from './sprites.mjs';

const PALE = '#e6f3ef', GOLD = '#f6dfae';
const panel = (x, y, w, h, fill = PAPER) => rect(x, y, w, h, { fill, rx: 12, strokeWidth: 3 });
const title = (value, y = 27) => text(210, y, value, { size: 19 });
const label = (x, y, value, size = 21) => text(x, y, value, { size });
const grouped = value => Number(value).toLocaleString('en-IN');
const time = minutes => {
  const value = ((minutes % 720) + 720) % 720;
  return `${Math.floor(value / 60) || 12}:${String(value % 60).padStart(2, '0')}`;
};
const rs = paise => `Rs ${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, '0')}`;
const compact = value => Math.round(value * 100) / 100;
function smallClock(minutes) {
  let body = circle(100, 100, 94, { fill: PAPER, strokeWidth: 3 });
  let ticks = '';
  for (let i = 1; i <= 12; i++) {
    const angle = i * Math.PI / 6;
    ticks += `M${compact(100 + Math.sin(angle) * 84)} ${compact(100 - Math.cos(angle) * 84)}L${compact(100 + Math.sin(angle) * 90)} ${compact(100 - Math.cos(angle) * 90)}`;
    body += label(compact(100 + Math.sin(angle) * 66), compact(107 - Math.cos(angle) * 66), i, 20);
  }
  const minute = minutes % 60 * Math.PI / 30, hour = minutes % 720 * Math.PI / 360;
  body += path(ticks, { strokeWidth: 2 })
    + line(100, 100, compact(100 + Math.sin(hour) * 44), compact(100 - Math.cos(hour) * 44), { width: 8, stroke: '#675082' })
    + line(100, 100, compact(100 + Math.sin(minute) * 73), compact(100 - Math.cos(minute) * 73), { width: 4, stroke: '#9d4e2d' })
    + circle(100, 100, 5, { fill: INK });
  return body;
}
function disc(x, y, half = false) {
  return half
    ? path(`M${x} ${y - 13}A13 13 0 0 0 ${x} ${y + 13}Z`, { fill: GREEN, strokeWidth: 2 })
    : circle(x, y, 13, { fill: GREEN }) + line(x - 6, y, x + 6, y, { stroke: PAPER, width: 2 }) + line(x, y - 6, x, y + 6, { stroke: PAPER, width: 2 });
}
const fractionBar = (n, d, x, y, w, h) => {
  const compact = value => Math.round(value * 10) / 10;
  let body = rect(x, y, w, h) + rect(x, y, compact(w * n / d), h, { fill: GREEN });
  let marks = '';
  for (let i = 0; i < d; i++) {
    const cx = compact(x + w * i / d), next = compact(x + w * (i + 1) / d);
    if (i) body += line(cx, y, cx, y + h, { width: 1.5 });
    if (i < n) marks += `M${compact(cx + 1.5)} ${y + h - 4}L${compact(next - 1.5)} ${y + 4}`;
  }
  return body + path(marks, { stroke: PAPER, strokeWidth: 1.5 });
};

export function render(v) {
  let body = '';
  const kind = v.kind.replace('v3-class-4-', '');
  if (kind === 'digit-cards') {
    body = title('Use each card exactly once');
    v.cards.forEach((value, i) => {
      body += panel(20 + i * 79, 56, 64, 92, i % 2 ? GOLD : PALE)
        + text(52 + i * 79, 117, value, { size: 38 });
    });
    body += label(210, 186, 'A leading zero is not allowed', 18);
    return svg(body, v.description, 420, 210);
  }
  if (kind === 'roman-tablets') {
    v.codes.forEach((value, i) => {
      body += panel(15 + i * 205, 40, 190, 125, i ? GOLD : PALE)
        + label(110 + i * 205, 70, `Tablet ${i ? 'B' : 'A'}`, 19)
        + label(110 + i * 205, 123, value, value.length > 8 ? 21 : 27);
    });
    return svg(body, v.description, 420, 190);
  }
  if (kind === 'rounding-line') {
    body = title('Marked specimen count');
    body += line(38, 136, 382, 136, { width: 4 });
    for (let i = 0; i <= 10; i++) {
      const x = 38 + i * 34.4;
      body += line(x, i % 5 ? 129 : 122, x, 149, { width: 2.5 });
    }
    const x = 38 + (v.value - v.lower) / v.unit * 344;
    body += label(x, 70, grouped(v.value), 23)
      + line(x, 82, x, 111, { width: 4, stroke: GREEN })
      + path(`M${x - 7} 103L${x} 116L${x + 7} 103`, { stroke: GREEN, strokeWidth: 4 })
      + text(38, 179, grouped(v.lower), { size: 19, anchor: 'start' })
      + text(382, 179, grouped(v.lower + v.unit), { size: 19, anchor: 'end' });
    return svg(body, v.description, 420, 200);
  }
  if (kind === 'factor-log') {
    body = title(v.mode === 'signals' ? 'Both sensors start together' : 'Keep the collections separate');
    [v.a, v.b].forEach((value, i) => {
      const x = 18 + i * 202;
      body += panel(x, 51, 184, 132, i ? GOLD : PALE)
        + label(x + 92, 83, `${v.mode === 'signals' ? 'Sensor' : 'Collection'} ${i ? 'B' : 'A'}`, 19)
        + label(x + 92, 126, value, 34)
        + label(x + 92, 157, v.mode === 'signals' ? 'minutes per flash' : 'samples', 17);
    });
    return svg(body, v.description, 420, 205);
  }
  if (kind === 'part-bars') {
    body = title(`Together: ${v.total} samples`);
    body += text(16, 82, v.labels[0], { size: 18, anchor: 'start' })
      + text(16, 153, v.labels[1], { size: 18, anchor: 'start' });
    body += rect(117, 51, 185, 45, { fill: PALE, rx: 5, strokeWidth: 3 })
      + rect(117, 123, 185, 45, { fill: PALE, rx: 5, strokeWidth: 3 })
      + rect(302, 123, 99, 45, { fill: GOLD, rx: 4, strokeWidth: 3 })
      + label(210, 81, v.smaller === null ? '?' : v.smaller, 25)
      + label(210, 153, 'same', 19)
      + label(352, 152, `+${v.difference}`, 23);
    return svg(body, v.description, 420, 195);
  }
  if (kind === 'split-product') {
    body = title(v.mode === 'height' ? `Whole area: ${v.total}` : 'Area model: not to scale');
    body += rect(86, 78, 205, 110, { fill: PALE, strokeWidth: 3 })
      + rect(291, 78, 100, 110, { fill: GOLD, strokeWidth: 3 })
      + label(188, 64, v.left, 23) + label(341, 64, v.right, 23)
      + label(44, 141, v.height === null ? '?' : v.height, 26)
      + label(188, 139, v.leftArea, 27) + label(341, 139, '?', 30);
    return svg(body, v.description, 420, 218);
  }
  if (kind === 'manifest') {
    body = title('Packing manifest');
    body += panel(26, 47, 368, 142, PALE)
      + text(46, 85, 'Items to pack', { size: 21, anchor: 'start' })
      + text(373, 85, v.total, { size: 28, anchor: 'end' })
      + line(45, 102, 374, 102, { stroke: '#9ebdaf' })
      + text(46, 137, 'Items per tray', { size: 21, anchor: 'start' })
      + text(373, 137, v.capacity, { size: 28, anchor: 'end' })
      + label(210, 173, `Cargo: ${v.thing}`, 18);
    return svg(body, v.description, 420, 210);
  }
  if (kind === 'column-repair') {
    const values = [v.top, String(v.bottom), String(v.result)];
    const width = Math.max(...values.map(s => s.length));
    body = panel(83, 15, 254, 225, PALE);
    values.forEach((value, row) => [...value.padStart(width, ' ')].forEach((digit, col) => {
      body += text(144 + col * 35, 65 + row * 68, digit, { size: 33, fill: digit === '?' ? '#93552b' : INK });
    }));
    body += text(107, 132, v.operation, { size: 32 }) + line(109, 148, 314, 148, { width: 3 });
    return svg(body, v.description, 420, 255);
  }
  if (kind === 'reference-fraction') {
    body = title('One whole, divided equally')
      + fractionBar(v.numerator, v.denominator, 30, 68, 360, 66)
      + label(210, 177, 'Keep the same shaded share', 19);
    return svg(body, v.description, 420, 202);
  }
  if (kind === 'fraction-choice') {
    const rows = v.denominator % 3 === 0 ? 3 : v.denominator % 4 === 0 ? 4 : 2;
    const columns = v.denominator / rows, width = 176 / columns, height = 96 / rows;
    for (let i = 0; i < v.denominator; i++) {
      const x = compact(12 + i % columns * width), y = compact(16 + Math.floor(i / columns) * height);
      body += rect(x, y, compact(width), compact(height), { fill: i < v.numerator ? GREEN : PAPER, strokeWidth: 1.5 });
      if (i < v.numerator) body += line(x + 3, y + height - 4, compact(x + width - 3), y + 4, { stroke: PAPER, width: 1.5 });
    }
    return svg(body, v.description, 200, 129);
  }
  if (kind === 'fraction-line') {
    body = title('Point P on equal intervals') + line(35, 125, 385, 125, { width: 4 });
    for (let tick = 0; tick <= v.denominator; tick++) {
      const x = 35 + tick * 350 / v.denominator;
      body += line(x, 116, x, 137, { width: 3 });
    }
    const x = 35 + v.step * 350 / v.denominator;
    body += circle(x, 125, 7, { fill: ORANGE, strokeWidth: 3 }) + label(x, 91, 'P', 27)
      + label(35, 170, v.whole, 24) + label(385, 170, v.whole + 1, 24);
    return svg(body, v.description, 420, 199);
  }
  if (kind === 'share-trays') {
    body = title(`${v.mode === 'whole' ? 'Selected' : 'All'} ${v.thing}: ${v.amount}`)
      + label(210, 59, `${v.numerator}/${v.denominator} of the groups selected`, 20);
    const columns = Math.min(4, v.denominator);
    const size = 72, gap = 13;
    for (let i = 0; i < v.denominator; i++) {
      const row = Math.floor(i / columns), col = i % columns;
      const rowLength = Math.min(columns, v.denominator - row * columns);
      const x = (420 - rowLength * (size + gap) + gap) / 2 + col * (size + gap);
      const y = 83 + row * 83;
      body += panel(x, y, size, 66, i < v.numerator ? PALE : PAPER);
      body += i < v.numerator
        ? path(`M${x + 19} ${y + 33}L${x + 31} ${y + 45}L${x + 54} ${y + 20}`, { stroke: GREEN, strokeWidth: 5 })
        : label(x + size / 2, y + 40, '-', 24);
    }
    body += label(210, 276, 'Ticked groups are selected', 18);
    return svg(body, v.description, 420, 295);
  }
  if (kind === 'fraction-inventory') {
    body = title(v.total === null ? 'Start with one whole supply' : `Start with ${v.total} sample tubes`);
    const rows = [
      ['First test', `${v.firstN}/${v.firstD}`, 'of original supply'],
      ['Second test', `${v.secondN}/${v.secondD}`, v.sequential ? 'of what remains' : 'of original supply'],
    ];
    rows.forEach((row, i) => {
      const y = 48 + i * 99;
      body += panel(22, y, 376, 85, i ? GOLD : PALE)
        + text(38, y + 32, row[0], { size: 20, anchor: 'start' })
        + text(377, y + 34, row[1], { size: 28, anchor: 'end' })
        + text(38, y + 65, row[2], { size: 19, anchor: 'start' });
    });
    return svg(body, v.description, 420, 248);
  }
  if (kind === 'l-bench') {
    const x = 84, y = 61, w = 240, h = 156;
    const cw = v.cutWidth / v.width * w, ch = v.cutHeight / v.height * h;
    body = title('Bench plan: not to scale', 23)
      + path(`M${x} ${y}H${x + w - cw}V${y + ch}H${x + w}V${y + h}H${x}Z`, { fill: PALE, strokeWidth: 4 })
      + line(x, y + h + 18, x + w, y + h + 18)
      + label(x + w / 2, y + h + 43, `${v.width} cm`, 21)
      + text(x - 12, y + h / 2, `${v.height} cm`, { size: 20, anchor: 'end' })
      + label(x + w - cw / 2, y - 12, `${v.cutWidth} cm`, 19)
      + text(x + w + 12, y + ch / 2 + 7, `${v.cutHeight} cm`, { size: 19, anchor: 'start' })
      + line(x + w - cw, y, x + w, y, { dash: '5 5', stroke: '#9b8468' })
      + line(x + w, y, x + w, y + ch, { dash: '5 5', stroke: '#9b8468' });
    return svg(body, v.description, 420, 281);
  }
  if (kind === 'mirror-source') {
    const n = v.cells.length, size = 31;
    const x = 210 - n * size - 9, y = 59;
    body = title('Reflect into the right panel')
      + tileGrid(v.cells, x, y, size)
      + tileGrid(v.cells.map(row => row.map(() => 0)), 219, y, size)
      + line(210, 45, 210, y + n * size + 16, { width: 3, dash: '7 5', stroke: '#93552b' })
      + label(219 + n * size / 2, y + n * size / 2 + 10, '?', 36);
    return svg(body, v.description, 420, 217);
  }
  if (kind === 'mirror-choice') {
    const n = v.cells.length, size = 38;
    body = tileGrid(v.cells, (200 - n * size) / 2, 14, size);
    return svg(body, v.description, 200, n * size + 28);
  }
  if (kind === 'cube-net') {
    const minX = Math.min(...v.faces.map(f => f.x)), maxX = Math.max(...v.faces.map(f => f.x));
    const minY = Math.min(...v.faces.map(f => f.y)), maxY = Math.max(...v.faces.map(f => f.y));
    const size = 54, offsetX = (420 - (maxX - minX + 1) * size) / 2;
    body = title('Fold along the joined edges');
    v.faces.forEach((face, i) => {
      const x = offsetX + (face.x - minX) * size, y = 49 + (face.y - minY) * size;
      body += rect(x, y, size, size, { fill: i % 2 ? GOLD : PALE, strokeWidth: 2.5 })
        + label(x + size / 2, y + 35, face.label, 27);
    });
    return svg(body, v.description, 420, 66 + (maxY - minY + 1) * size);
  }
  if (kind === 'angle-gap') {
    const cx = 210, cy = 214, radius = 151;
    body = title('Angles on a straight edge')
      + line(36, cy, 384, cy, { width: 4 });
    let angle = 0;
    v.angles.forEach(value => {
      const mid = (angle + value / 2) * Math.PI / 180;
      angle += value;
      const radians = angle * Math.PI / 180;
      body += line(cx, cy, cx + Math.cos(radians) * radius, cy - Math.sin(radians) * radius, { width: 3 })
        + label(cx + Math.cos(mid) * 108, cy - Math.sin(mid) * 108, `${value}°`, 20);
    });
    const mid = (angle + (180 - angle) / 2) * Math.PI / 180;
    body += label(cx + Math.cos(mid) * 104, cy - Math.sin(mid) * 104, 'x', 28)
      + circle(cx, cy, 5, { fill: INK });
    return svg(body, v.description, 420, 244);
  }
  if (kind === 'offset-ruler') {
    const at = tick => 38 + tick * 34.4;
    body = title(`Ruler readings in ${v.unit}`)
      + rect(30, 122, 360, 67, { fill: GOLD, rx: 5, strokeWidth: 3 })
      + rect(at(v.startTick), 65, at(v.endTick) - at(v.startTick), 33, { fill: GREEN, rx: 4, strokeWidth: 3 });
    for (let tick = 0; tick <= 10; tick++) {
      const x = at(tick);
      body += line(x, 124, x, tick % 2 ? 139 : 149, { width: 2 });
      if (tick % 2 === 0) body += label(x, 178, v.base + tick * v.step, 18);
    }
    body += line(at(v.startTick), 98, at(v.startTick), 123, { dash: '4 4', width: 2 })
      + line(at(v.endTick), 98, at(v.endTick), 123, { dash: '4 4', width: 2 });
    return svg(body, v.description, 420, 217);
  }
  if (kind === 'thermometer') {
    const x = 171, bottom = 237, tickHeight = 23;
    body = title('Lab thermometer: degrees C')
      + rect(x - 17, 43, 34, 203, { fill: PAPER, rx: 16, strokeWidth: 3 })
      + rect(x - 10, bottom - v.tick * tickHeight, 20, v.tick * tickHeight + 8, { fill: '#d47b66', rx: 7, strokeWidth: 0 })
      + circle(x, 256, 23, { fill: '#d47b66', strokeWidth: 3 });
    for (let tick = 0; tick <= 8; tick++) {
      const y = bottom - tick * tickHeight;
      body += line(198, y, tick % 2 ? 211 : 219, y, { width: 2.5 });
      if (tick % 2 === 0) body += text(231, y + 6, v.base + tick * v.step, { size: 20, anchor: 'start' });
    }
    const y = bottom - v.tick * tickHeight;
    body += path(`M149 ${y}L135 ${y - 8}V${y + 8}Z`, { fill: INK });
    return svg(body, v.description, 420, 294);
  }
  if (kind === 'balance-crates') {
    body = title(`${v.count} identical crates on a level balance`)
      + balanceScale({
        x: 10, y: 47, width: 400, cell: 34,
        left: [{ sprite: 'crate', count: v.count }, { weight: 'K' }],
        right: [{ weight: 'M' }],
      })
      + panel(12, 236, 180, 43, PALE) + panel(205, 236, 203, 43, GOLD)
      + label(102, 264, `K = ${v.known} g`, 19)
      + label(307, 264, `M = ${v.mixed ? `${Math.floor(v.total / 1000)} kg ${v.total % 1000} g` : `${v.total} g`}`, 18);
    return svg(body, v.description, 420, 296);
  }
  if (kind === 'unit-log') {
    body = title('Measurement log');
    const rows = [
      ['First amount', `${v.aWhole} ${v.large} ${v.aPart} ${v.small}`],
      [v.operation === 'use' ? 'Amount used' : 'Second amount', `${v.bWhole} ${v.large} ${v.bPart} ${v.small}`],
    ];
    rows.forEach((row, i) => {
      body += panel(18, 51 + i * 78, 384, 65, i ? GOLD : PALE)
        + text(35, 91 + i * 78, row[0], { size: 20, anchor: 'start' })
        + text(385, 91 + i * 78, row[1], { size: 23, anchor: 'end' });
    });
    body += label(210, 233, `1 ${v.large} = ${v.base} ${v.small}`, 20);
    return svg(body, v.description, 420, 258);
  }
  if (kind === 'task-timeline') {
    body = title('Follow the lab work timeline');
    const tasks = v.pause ? [['Scan', v.first], ['Pause', v.pause], ['Sort', v.second]] : [['Scan', v.first]];
    const count = tasks.length, w = count === 1 ? 164 : 112, gap = 17;
    tasks.forEach(([task, duration], i) => {
      const x = (420 - count * w - (count - 1) * gap) / 2 + i * (w + gap);
      body += panel(x, 57, w, 91, i % 2 ? GOLD : PALE)
        + label(x + w / 2, 88, task, 20) + label(x + w / 2, 125, `${duration} min`, 22);
    });
    body += line(36, 180, 384, 180, { width: 4 })
      + circle(36, 180, 6, { fill: GREEN }) + circle(384, 180, 6, { fill: ORANGE })
      + text(28, 213, v.start === null ? 'Start: ?' : `Start ${time(v.start)}`, { size: 21, anchor: 'start' })
      + text(392, 213, v.end === null ? 'Finish: ?' : `Finish ${time(v.end)}`, { size: 21, anchor: 'end' });
    return svg(body, v.description, 420, 243);
  }
  if (kind === 'shuttle-table') {
    body = title('Research station shuttles')
      + rect(22, 42, 376, 39, { fill: INK, rx: 6 })
      + text(78, 68, 'Shuttle', { size: 18, fill: PAPER })
      + text(222, 68, 'Leave', { size: 18, fill: PAPER })
      + text(342, 68, 'Reach', { size: 18, fill: PAPER });
    v.rows.forEach((row, i) => {
      const y = 82 + i * 42;
      body += rect(22, y, 376, 42, { fill: i % 2 ? GOLD : PALE, strokeWidth: 1 })
        + label(78, y + 28, row.label, 21) + label(222, y + 28, time(row.depart), 23)
        + label(342, y + 28, time(row.arrive), 23);
    });
    return svg(body, v.description, 420, 270);
  }
  if (kind === 'lab-calendar') {
    body = title(`${v.month} ${v.year}`);
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((day, i) => {
      body += rect(35 + i * 50, 43, 50, 32, { fill: INK, strokeWidth: 1 })
        + text(60 + i * 50, 65, day, { size: 16, fill: PAPER });
    });
    const rows = Math.ceil((v.first + v.days) / 7);
    for (let i = 0; i < rows * 7; i++) {
      const date = i - v.first + 1, x = 35 + i % 7 * 50, y = 76 + Math.floor(i / 7) * 35;
      body += rect(x, y, 50, 35, { fill: i % 7 >= 5 ? '#fbefda' : PAPER, strokeWidth: 1 });
      if (date >= 1 && date <= v.days) {
        if (date === v.date) body += circle(x + 25, y + 18, 15, { fill: GOLD, strokeWidth: 2.5 });
        body += label(x + 25, y + 25, date, 18);
      }
    }
    return svg(body, v.description, 420, 94 + rows * 35);
  }
  if (kind === 'station-clock') {
    body = title('Station clock reading') + `<g transform="translate(110 42)">${smallClock(v.minutes)}</g>`;
    return svg(body, v.description, 420, 260);
  }
  if (kind === 'clock-choice') {
    return svg(smallClock(v.minutes), v.description, 200, 200);
  }
  if (kind === 'receipt-gap') {
    body = title('Laboratory supply receipt');
    [
      [`${v.quantity} ${v.item}`, '@ Rs ? each'],
      [`${v.otherQuantity} ${v.other}`, `@ Rs ${v.otherPrice} each`],
      ['Delivery', `Rs ${v.fee}`],
      ['Discount', `- Rs ${v.discount}`],
    ].forEach(([left, right], i) => {
      const y = 66 + i * 44;
      body += text(25, y, left, { size: 20, anchor: 'start' })
        + text(394, y, right, { size: 21, anchor: 'end' })
        + line(24, y + 13, 396, y + 13, { stroke: '#d8d3c4', width: 1 });
    });
    body += panel(19, 226, 382, 48, GOLD)
      + text(34, 258, 'FINAL TOTAL', { size: 20, anchor: 'start' })
      + text(386, 258, `Rs ${v.total}`, { size: 25, anchor: 'end' });
    return svg(body, v.description, 420, 292);
  }
  if (kind === 'bundle-table') {
    body = title(`Bundle offers: ${v.thing}`)
      + rect(15, 44, 390, 36, { fill: INK, rx: 5 });
    [['Offer', 62], ['Items', 133], ['Pack price', 246], ['Delivery', 355]].forEach(([value, x]) => {
      body += text(x, 68, value, { size: 16, fill: PAPER });
    });
    v.offers.forEach((offer, i) => {
      const y = 82 + i * 43;
      body += rect(15, y, 390, 43, { fill: i % 2 ? GOLD : PALE, strokeWidth: 1 })
        + label(62, y + 29, offer.label.slice(-1), 23)
        + label(133, y + 29, offer.count, 22)
        + label(246, y + 29, `Rs ${offer.price}`, 21)
        + label(355, y + 29, `Rs ${offer.fee}`, 20);
    });
    return svg(body, v.description, 420, 274);
  }
  if (kind === 'budget-board') {
    body = title('Supply budget board');
    const rows = [
      ['Budget', `Rs ${v.budget}`],
      [`${v.requiredQuantity} kits required`, `Rs ${v.requiredPrice} each`],
      ['Extra filters', `Rs ${v.extraPrice} each`],
      ...(v.fee ? [['Delivery once', `Rs ${v.fee}`]] : []),
      ...(v.reserve ? [['Keep unspent', `Rs ${v.reserve}`]] : []),
    ];
    rows.forEach(([left, right], i) => {
      const y = 46 + i * 46;
      body += panel(18, y, 384, 41, i % 2 ? PAPER : PALE)
        + text(31, y + 28, left, { size: 20, anchor: 'start' })
        + text(389, y + 28, right, { size: 22, anchor: 'end' });
    });
    return svg(body, v.description, 420, 60 + rows.length * 46);
  }
  if (kind === 'change-counter') {
    body = title('Payment counter');
    v.rows.forEach((row, i) => {
      const y = 56 + i * 54;
      body += panel(18, y, 384, 47, i ? GOLD : PALE)
        + text(32, y + 31, row.item, { size: 21, anchor: 'start' })
        + text(388, y + 31, `${row.quantity} x ${rs(row.price)}`, { size: 22, anchor: 'end' });
    });
    body += text(28, 197, 'Discount', { size: 20, anchor: 'start' })
      + text(392, 197, rs(v.discount), { size: 22, anchor: 'end' })
      + line(24, 212, 396, 212, { width: 2 })
      + text(28, 245, 'AMOUNT PAID', { size: 20, anchor: 'start' })
      + text(392, 245, rs(v.paid), { size: 25, anchor: 'end' });
    return svg(body, v.description, 420, 269);
  }
  if (kind === 'scaled-bars') {
    const bottom = 224, height = 22;
    body = title('Samples tested')
      + line(60, 43, 60, bottom, { width: 3 })
      + line(60, bottom, 398, bottom, { width: 3 });
    for (let tick = 0; tick <= 8; tick++) {
      const y = bottom - tick * height;
      body += line(60, y, 398, y, { stroke: '#d5dcd8', width: 1 })
        + text(49, y + 6, tick * v.scale, { size: 17, anchor: 'end' });
    }
    v.heights.forEach((value, i) => {
      const x = 78 + i * 80;
      body += rect(x, bottom - value * height, 49, value * height, { fill: i % 2 ? GOLD : GREEN, rx: 3, strokeWidth: 2.5 })
        + label(x + 24.5, 254, v.labels[i], 18);
      if (i % 2) body += line(x + 8, bottom - 8, x + 41, bottom - value * height + 8, { width: 2 });
    });
    return svg(body, v.description, 420, 278);
  }
  if (kind === 'half-pictograph') {
    body = disc(31, 25) + text(52, 31, `= ${v.key} samples`, { size: 18, anchor: 'start' })
      + disc(275, 25, true) + text(292, 31, `= ${v.key / 2}`, { size: 18, anchor: 'start' });
    v.halfCounts.forEach((halves, i) => {
      const y = 61 + i * 63;
      body += panel(16, y, 388, 54, i % 2 ? GOLD : PALE)
        + text(30, y + 34, v.labels[i], { size: 19, anchor: 'start' });
      const full = Math.floor(halves / 2);
      for (let j = 0; j < full; j++) body += disc(127 + j * 41, y + 27);
      if (halves % 2) body += disc(127 + full * 41, y + 27, true);
    });
    return svg(body, v.description, 420, 264);
  }
  if (kind === 'paired-surveys') {
    body = title('Samples tested in two sessions')
      + rect(18, 45, 384, 37, { fill: INK, rx: 5 });
    [['Lab', 72], ['Morning', 217], ['Evening', 340]].forEach(([value, x]) => {
      body += text(x, 71, value, { size: 18, fill: PAPER });
    });
    v.labels.forEach((value, i) => {
      const y = 83 + i * 45;
      body += rect(18, y, 384, 45, { fill: i % 2 ? GOLD : PALE, strokeWidth: 1 })
        + label(72, y + 30, value, 20)
        + label(217, y + 31, v.morning[i], 25)
        + label(340, y + 31, v.evening[i], 25);
    });
    return svg(body, v.description, 420, 283);
  }
  if (kind === 'transfer-ledger') {
    body = title('Samples before the transfer');
    v.labels.forEach((value, i) => {
      const x = 20 + i % 2 * 202, y = 51 + Math.floor(i / 2) * 106;
      body += panel(x, y, 178, 91, i % 2 ? GOLD : PALE)
        + sprite('crate', x + 7, y + 28, 48)
        + label(x + 114, y + 31, value, 20)
        + label(x + 114, y + 70, v.values[i], 31);
    });
    return svg(body, v.description, 420, 273);
  }
  if (kind === 'rank-card') {
    body = title(`${v.who}'s queue card`)
      + panel(18, 48, 141, 79, PALE) + panel(261, 48, 141, 79, GOLD)
      + label(89, 77, 'From front', 18) + label(332, 77, 'From back', 18)
      + label(89, 112, v.front, 30) + label(332, 112, v.back, 30)
      + label(210, 99, v.who, 21)
      + line(165, 91, 178, 91, { width: 3 }) + line(242, 91, 255, 91, { width: 3 });
    if (v.leaveAhead || v.joinAhead || v.leaveBehind || v.joinBehind || v.move) {
      [
        `Ahead: ${v.leaveAhead} leave, ${v.joinAhead} join`,
        `Behind: ${v.leaveBehind} leave, ${v.joinBehind} join`,
        `Then move forward ${v.move} places`,
      ].forEach((value, i) => {
        body += panel(24, 149 + i * 47, 372, 39, i % 2 ? PAPER : PALE)
          + label(210, 175 + i * 47, value, 20);
      });
      return svg(body, v.description, 420, 301);
    }
    return svg(body, v.description, 420, 151);
  }
  if (kind === 'rover-program') {
    const cell = v.size === 5 ? 43 : 36, left = 27, top = 58;
    body = title(`Start faces ${['north', 'east', 'south', 'west'][v.facing]}`);
    for (let y = 0; y < v.size; y++) for (let x = 0; x < v.size; x++) {
      body += rect(left + x * cell, top + (v.size - 1 - y) * cell, cell, cell, {
        fill: x === v.x && y === v.y ? GOLD : PAPER, strokeWidth: 1.5,
      });
    }
    for (let i = 0; i < v.size; i++) {
      body += label(left + i * cell + cell / 2, top + v.size * cell + 24, i, 18)
        + label(15, top + (v.size - 1 - i) * cell + cell / 2 + 6, i, 18);
    }
    body += text(18, 48, 'y', { size: 17 })
      + text(left + v.size * cell + 13, top + v.size * cell + 23, 'x', { size: 17 })
      + sprite('rover', left + v.x * cell + (cell - 34) / 2, top + (v.size - 1 - v.y) * cell + (cell - 34) / 2, 34, { rotate: [-90, 0, 90, 180][v.facing] })
      + label(330, 62, 'PROGRAM', 17);
    v.commands.forEach((command, i) => {
      body += panel(261, 76 + i * 31, 141, 28, i % 2 ? GOLD : PALE)
        + label(331, 96 + i * 31, command.action === 'F' ? `Forward ${command.steps}` : command.action === 'L' ? 'Left turn' : 'Right turn', 18);
    });
    body += label(331, 257, v.repeat === 2 ? 'Repeat twice' : 'Run once', 19)
      + label(331, 285, 'Quarter-turns', 16);
    return svg(body, v.description, 420, 314);
  }
  if (kind === 'checkpoint-grid') {
    const step = Math.min(272 / v.width, 210 / v.height), left = (360 - v.width * step) / 2, bottom = 60 + v.height * step;
    const px = x => left + x * step, py = y => bottom - y * step;
    body = text(180, 26, 'Allowed moves: right or up', { size: 19 });
    if (v.closed) body += text(180, 47, 'Crossed edge is closed', { size: 16 });
    for (let y = 0; y <= v.height; y++) for (let x = 0; x <= v.width; x++) {
      if (x < v.width) {
        const mid = px(x) + step / 2;
        const closed = v.closed?.direction === 'R' && v.closed.x === x && v.closed.y === y;
        body += line(px(x), py(y), px(x + 1), py(y), { width: 2, ...(closed ? { dash: '5 4' } : {}) })
          + (closed
            ? path(`M${mid - 7} ${py(y) - 7}L${mid + 7} ${py(y) + 7}M${mid - 7} ${py(y) + 7}L${mid + 7} ${py(y) - 7}`, { stroke: '#aa503e', strokeWidth: 3 })
            : path(`M${mid - 4} ${py(y) - 4}L${mid + 3} ${py(y)}L${mid - 4} ${py(y) + 4}`, { strokeWidth: 2 }));
      }
      if (y < v.height) {
        const mid = py(y) - step / 2;
        const closed = v.closed?.direction === 'U' && v.closed.x === x && v.closed.y === y;
        body += line(px(x), py(y), px(x), py(y + 1), { width: 2, ...(closed ? { dash: '5 4' } : {}) })
          + (closed
            ? path(`M${px(x) - 7} ${mid - 7}L${px(x) + 7} ${mid + 7}M${px(x) - 7} ${mid + 7}L${px(x) + 7} ${mid - 7}`, { stroke: '#aa503e', strokeWidth: 3 })
            : path(`M${px(x) - 4} ${mid + 4}L${px(x)} ${mid - 3}L${px(x) + 4} ${mid + 4}`, { strokeWidth: 2 }));
      }
      body += circle(px(x), py(y), 3.5, { fill: INK, strokeWidth: 0 });
    }
    body += circle(px(0), py(0), 8, { fill: GREEN }) + circle(px(v.width), py(v.height), 8, { fill: ORANGE })
      + label(px(0) - 21, py(0) + 26, 'S', 23)
      + label(px(v.width) + 23, py(v.height) - 16, 'F', 23);
    if (v.checkpoint) {
      body += circle(px(v.checkpoint.x), py(v.checkpoint.y), 9, { fill: GOLD, strokeWidth: 3 })
        + label(px(v.checkpoint.x) - 15, py(v.checkpoint.y) - 14, 'C', 20);
    }
    return svg(body, v.description, 360, bottom + 38);
  }
  if (kind === 'code-machine') {
    body = title('The same code on every row')
      + label(97, 63, 'Input', 20) + label(323, 63, 'Output', 20);
    [...v.examples, [v.query, v.output]].forEach(([input, output], i) => {
      const y = 79 + i * 69;
      body += panel(35, y, 124, 53, i === 2 ? GOLD : PALE) + panel(261, y, 124, 53, i === 2 ? GOLD : PALE)
        + label(97, y + 36, input === null ? '?' : input, 29)
        + label(323, y + 36, output === null ? '?' : output, 29)
        + line(180, y + 27, 239, y + 27, { width: 3 })
        + path(`M230 ${y + 20}L240 ${y + 27}L230 ${y + 34}`, { strokeWidth: 3 });
    });
    return svg(body, v.description, 420, 291);
  }
  if (kind === 'alternating-lock') {
    body = title('Read top row, then bottom row', 24);
    v.terms.forEach((value, i) => {
      const x = 29 + i % 4 * 94, y = 65 + Math.floor(i / 4) * 100;
      body += label(x + 40, y - 11, `#${i + 1}`, 16)
        + panel(x, y, 80, 65, value === null ? GOLD : PALE)
        + label(x + 40, y + 43, value === null ? '?' : value, 29);
    });
    return svg(body, v.description, 420, 251);
  }
  throw new Error(`Unsupported class-4 picture: ${v.kind}`);
}
