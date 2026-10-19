import { ORANGE, circle, icon, line, path, rect, svg, text } from './diagram-kit.mjs';
import { sprite } from './sprites.mjs';

const NAVY = '#263b61';
const TEAL = '#179e94';
const GOLD = '#f2bb4d';
const CORAL = '#ed765c';
const LILAC = '#a28acf';
const WHITE = '#ffffff';

const tile = (x, y, number, hidden = false, fill = TEAL) =>
  circle(x, y, 29, { fill: hidden ? WHITE : fill, stroke: NAVY, strokeWidth: 3.5 })
  + text(x, y + 8, hidden ? '?' : number, { size: 25, fill: hidden ? NAVY : WHITE, weight: 750 });
const shapeFill = { star: GOLD, circle: TEAL, triangle: CORAL, square: LILAC,
  rectangle: GOLD, pentagon: '#61b7b6', hexagon: '#56b8a4' };
const shapeTile = (shape, x, y, size) => icon(shape, x, y, size, shapeFill[shape]);
const alienTile = (shape, mark, x, y, size) => {
  const middleX = x + size / 2;
  const middleY = y + size / 2;
  let body = shapeTile(shape, x, y, size);
  if (mark === 'dots') {
    body += circle(middleX - size * .12, middleY, size * .055, { fill: WHITE, stroke: NAVY, strokeWidth: 1.5 });
    body += circle(middleX + size * .12, middleY, size * .055, { fill: WHITE, stroke: NAVY, strokeWidth: 1.5 });
  } else if (mark === 'stripe') {
    body += line(middleX - size * .19, middleY - size * .08, middleX + size * .19, middleY - size * .08,
      { stroke: WHITE, width: 6 });
    body += line(middleX - size * .19, middleY + size * .08, middleX + size * .19, middleY + size * .08,
      { stroke: NAVY, width: 4 });
  } else if (mark === 'cross') {
    body += line(middleX - size * .13, middleY - size * .13, middleX + size * .13, middleY + size * .13,
      { stroke: WHITE, width: 6 });
    body += line(middleX - size * .13, middleY + size * .13, middleX + size * .13, middleY - size * .13,
      { stroke: WHITE, width: 6 });
  } else {
    body += circle(middleX, middleY, size * .067, { fill: shapeFill[shape], strokeWidth: 0 });
  }
  return body;
};

export function renderPP2(visual) {
  if (visual.kind === 'v3-pp2-trail') {
    const count = visual.count;
    const gap = count === 5 ? 84 : 102;
    let body = line(36, 93, 42 + (count - 1) * gap, 93, { stroke: '#d1cadc', width: 10 });
    for (let i = 0; i < count; i++) body += tile(44 + i * gap, 91, visual.start + i, i === visual.missing, i % 2 ? CORAL : TEAL);
    return svg(body, visual.description, 42 + (count - 1) * gap + 44, 184);
  }
  if (visual.kind === 'v3-pp2-skips') {
    const gap = visual.count === 5 ? 88 : 111;
    let body = '';
    for (let i = 1; i < visual.count; i++) {
      const before = 43 + (i - 1) * gap;
      const after = 43 + i * gap;
      body += path(`M${before + 28} 84 Q${(before + after) / 2} 14 ${after - 28} 84`,
        { stroke: ORANGE, strokeWidth: 3.5 });
      body += text((before + after) / 2, 46, `+${visual.step}`, { size: 16, fill: NAVY });
    }
    for (let i = 0; i < visual.count; i++) {
      const x = 43 + i * gap;
      const hidden = i === visual.missing;
      body += rect(x - 32, 84, 64, 62, { fill: hidden ? WHITE : i % 2 ? CORAL : TEAL,
        stroke: NAVY, rx: 14, strokeWidth: 3.5 });
      body += text(x, 124, hidden ? '?' : visual.start + i * visual.step,
        { size: 25, fill: hidden ? NAVY : WHITE, weight: 750 });
    }
    return svg(body, visual.description, 43 + (visual.count - 1) * gap + 43, 171);
  }
  if (visual.kind === 'v3-pp2-frame') {
    const size = 35;
    let body = '';
    for (let frame = 0; frame < visual.frames; frame++) {
      const x = 16 + frame * 206;
      body += rect(x - 5, 23, 192, 96, { fill: '#eaf8f4', stroke: NAVY, rx: 17, strokeWidth: 3 });
      for (let index = 0; index < 10; index++) {
        const cx = x + 17 + (index % 5) * size;
        const cy = 48 + Math.floor(index / 5) * size;
        body += rect(cx - 14, cy - 14, 28, 28, { fill: WHITE, stroke: '#71839d', rx: 7, strokeWidth: 2 });
        if (frame * 10 + index < visual.filled) {
          body += sprite('star', cx - 13, cy - 13, 26,
            { fill: frame ? CORAL : GOLD });
        }
      }
    }
    return svg(body, visual.description, visual.frames === 1 ? 206 : 412, 145);
  }
  if (visual.kind === 'v3-pp2-bundles') {
    let body = text(75, 45, 'TEN', { size: 18 });
    body += rect(30, 61, 91, 113, { fill: '#f8e8c7', stroke: NAVY, rx: 14, strokeWidth: 3 });
    for (let i = 0; i < 10; i++) {
      body += line(38 + i * 8, 81, 38 + i * 8, 159, { stroke: i % 2 ? ORANGE : NAVY, width: 4 });
    }
    body += rect(32, 110, 87, 15, { fill: CORAL, stroke: NAVY, rx: 5, strokeWidth: 2 });
    body += text(282, 45, 'ONES', { size: 18 });
    for (let i = 0; i < visual.loose; i++) {
      const x = 206 + (i % 3) * 73;
      const y = 70 + Math.floor(i / 3) * 58;
      body += rect(x, y, 36, 36, { fill: GOLD, stroke: NAVY, rx: 6, strokeWidth: 3 });
      body += circle(x + 18, y + 18, 4, { fill: NAVY, strokeWidth: 0 });
    }
    return svg(body, visual.description, 416, 257);
  }
  if (visual.kind === 'v3-pp2-signs') {
    let body = '';
    const count = visual.values.length;
    const gap = count > 3 ? 112 : 137;
    const boardWidth = count > 3 ? 98 : 114;
    visual.values.forEach((value, i) => {
      const x = 26 + i * gap;
      body += line(x + boardWidth / 2, 115, x + boardWidth / 2, 216, { stroke: NAVY, width: 9 });
      body += rect(x, 19, boardWidth, 110, { fill: ['#e1f5ee', '#fff0d4', '#f2eafa', '#fde6e0'][i],
        stroke: NAVY, rx: 16, strokeWidth: 3 });
      body += text(x + boardWidth / 2, 60, visual.labels[i], { size: 23, weight: 800 });
      body += text(x + boardWidth / 2, 104, value, { size: 36, weight: 800 });
    });
    const width = 26 + (count - 1) * gap + boardWidth + 17;
    body += line(17, 219, width - 17, 219, { stroke: NAVY, width: 4 });
    return svg(body, visual.description, width, 243);
  }
  if (visual.kind === 'v3-pp2-gardens') {
    const width = visual.parts.length === 3 ? 130 : 176;
    let body = '';
    visual.parts.forEach((count, bed) => {
      const x = 17 + bed * (width + 13);
      body += rect(x, 32, width, 133, { fill: bed % 2 ? '#fff0d9' : '#e4f8ef', stroke: NAVY, rx: 20, strokeWidth: 3 });
      body += text(x + width / 2, 24, `BED ${bed + 1}`, { size: 17 });
      for (let i = 0; i < count; i++) {
        const cx = x + 27 + (i % 4) * (visual.parts.length === 3 ? 25 : 37);
        const cy = 67 + Math.floor(i / 4) * 32;
        body += circle(cx, cy, 10, { fill: bed % 2 ? CORAL : TEAL, stroke: NAVY, strokeWidth: 2 });
        body += path(`M${cx} ${cy - 9}q2 -8 8 -8q-1 6 -8 8`, { fill: GOLD, stroke: NAVY, strokeWidth: 1.5 });
      }
    });
    return svg(body, visual.description, visual.parts.length === 3 ? 438 : 400, 185);
  }
  if (visual.kind === 'v3-pp2-leaving') {
    let body = '';
    for (let i = 0; i < visual.total; i++) {
      const cx = 47 + (i % 6) * 64;
      const cy = 53 + Math.floor(i / 6) * 65;
      body += circle(cx, cy, 20, { fill: i < visual.removed ? '#d9dde3' : GOLD, stroke: NAVY, strokeWidth: 2.5 });
      body += circle(cx - 5, cy - 4, 3, { fill: NAVY, strokeWidth: 0 });
      if (i < visual.removed) {
        body += line(cx - 24, cy - 24, cx + 24, cy + 24, { stroke: CORAL, width: 5 });
        body += line(cx + 24, cy - 24, cx - 24, cy + 24, { stroke: CORAL, width: 5 });
      }
    }
    return svg(body, visual.description, 412, 227);
  }
  if (visual.kind === 'v3-pp2-partbar') {
    const parts = [...visual.known, visual.missing];
    let body = rect(25, 28, 370, 64, { fill: LILAC, stroke: NAVY, rx: 11, strokeWidth: 3 });
    body += text(210, 69, `WHOLE ${visual.whole}`, { size: 25, fill: WHITE, weight: 800 });
    let x = 25;
    parts.forEach((part, i) => {
      const width = part / visual.whole * 370;
      body += rect(x, 105, width, 88, { fill: i === parts.length - 1 ? '#f6dfbc' : '#c3e9df',
        stroke: NAVY, rx: 4, strokeWidth: 3 });
      body += text(x + width / 2, 160, i === parts.length - 1 ? '?' : part, { size: width < 53 ? 18 : 27 });
      x += width;
    });
    return svg(body, visual.description, 420, 216);
  }
  if (visual.kind === 'v3-pp2-hopline') {
    const spacing = 370 / visual.max;
    const xAt = n => 33 + n * spacing;
    let body = line(30, 131, 406, 131, { stroke: NAVY, width: 5 });
    for (let n = 0; n <= visual.max; n++) {
      const x = xAt(n);
      body += line(x, 123, x, 144, { stroke: NAVY, width: n % (visual.max === 10 ? 1 : 2) ? 1.5 : 3 });
      if (visual.max === 10 || n % 2 === 0) body += text(x, 170, n, { size: 16 });
    }
    let position = visual.start;
    body += circle(xAt(position), 130, 10, { fill: CORAL, stroke: NAVY, strokeWidth: 2.5 });
    visual.steps.forEach((step, i) => {
      const end = position + step;
      const from = xAt(position);
      const to = xAt(end);
      const y = 93 - i * 31;
      body += path(`M${from} 115 Q${(from + to) / 2} ${y - 42} ${to} 115`, { stroke: i ? ORANGE : TEAL, strokeWidth: 4 });
      body += path(`M${to - (step > 0 ? 9 : -9)} 106 L${to} 115 L${to - (step > 0 ? 10 : -10)} 120`,
        { stroke: i ? ORANGE : TEAL, strokeWidth: 3 });
      const markerY = i === 0 ? 56 : 30;
      body += circle((from + to) / 2, markerY, 12, { fill: WHITE, stroke: NAVY, strokeWidth: 2 });
      body += text((from + to) / 2, markerY + 6, i + 1, { size: 17, weight: 800 });
      position = end;
    });
    return svg(body, visual.description, 438, 198);
  }
  if (visual.kind === 'v3-pp2-pairs') {
    let body = text(38, 71, 'TOP', { size: 16 }) + text(38, 145, 'LOW', { size: 16 });
    for (const [row, amount] of [[0, visual.top], [1, visual.bottom]]) {
      for (let i = 0; i < amount; i++) {
        const cx = 79 + i * 27;
        const cy = 65 + row * 75;
        body += circle(cx, cy, 11, { fill: row ? CORAL : TEAL, stroke: NAVY, strokeWidth: 2 });
        body += circle(cx - 3, cy - 2, 2, { fill: WHITE, strokeWidth: 0 });
      }
    }
    if (visual.gain) body += text(222, 202, `+ ${visual.gain} below`, { size: 18, fill: NAVY });
    return svg(body, visual.description, 440, 224);
  }
  if (visual.kind === 'v3-pp2-chain' || visual.kind === 'v3-pp2-chain-gap') {
    let body = '';
    visual.sequence.forEach((shape, i) => {
      const x = 16 + i * 55;
      body += rect(x, 31, 50, 54, { fill: '#f4f4f3', stroke: '#b7c4ce', rx: 9, strokeWidth: 2 });
      body += shape ? shapeTile(shape, x + 3, 34, 45)
        : text(x + 25, 68, '?', { size: 29, fill: NAVY, weight: 800 });
    });
    return svg(body, visual.description, 35 + visual.sequence.length * 55, 117);
  }
  if (visual.kind === 'v3-pp2-symbol') {
    return svg(shapeTile(visual.shape, 25, 12, 74), visual.description, 124, 100);
  }
  if (visual.kind === 'v3-pp2-growing') {
    let body = '';
    visual.rows.forEach((count, row) => {
      const y = 32 + row * 69;
      body += text(39, y + 29, row + 1, { size: 24 });
      for (let i = 0; i < count; i++) {
        body += rect(75 + i * 39, y, 36, 36, { fill: row === 1 ? GOLD : TEAL, stroke: NAVY, rx: 5, strokeWidth: 2.5 });
        body += circle(93 + i * 39, y + 18, 3, { fill: WHITE, strokeWidth: 0 });
      }
    });
    return svg(body, visual.description, 417, 246);
  }
  if (visual.kind === 'v3-pp2-machine') {
    let body = rect(16, 13, 344, 235, { fill: '#eaf8f4', stroke: NAVY, rx: 15, strokeWidth: 3 });
    body += text(94, 49, 'IN', { size: 19 }) + text(277, 49, 'OUT', { size: 19 });
    [...visual.examples, visual.reverse ? ['?', visual.target] : [visual.target, '?']].forEach(([input, output], i) => {
      const y = 87 + i * 63;
      body += rect(52, y - 28, 87, 49, { fill: WHITE, stroke: NAVY, rx: 9, strokeWidth: 2.5 });
      body += rect(231, y - 28, 87, 49, { fill: WHITE, stroke: NAVY, rx: 9, strokeWidth: 2.5 });
      body += text(95, y + 7, input, { size: 26 });
      body += text(274, y + 7, output, { size: 26 });
      body += line(151, y - 3, 213, y - 3, { stroke: CORAL, width: 4 });
      body += path(`M205 ${y - 11}L217 ${y - 3}L205 ${y + 5}`, { stroke: CORAL, strokeWidth: 4 });
    });
    return svg(body, visual.description, 377, 263);
  }
  if (visual.kind === 'v3-pp2-pattern-strip') {
    let body = '';
    visual.sequence.forEach((shape, i) => {
      body += shapeTile(shape, 8 + i * 40, 12, 37);
    });
    return svg(body, visual.description, 218, 64);
  }
  if (visual.kind === 'v3-pp2-patches') {
    let body = rect(12, 17, 420, 231, { fill: '#e6f4f2', stroke: NAVY, rx: 32, strokeWidth: 4 });
    body += rect(33, 34, 378, 190, { fill: WHITE, stroke: NAVY, rx: 24, strokeWidth: 2.5 });
    const columns = visual.pieces.length > 6 ? 4 : 3;
    visual.pieces.forEach((shape, i) => {
      const x = 49 + (i % columns) * (columns === 4 ? 91 : 120);
      const y = 39 + Math.floor(i / columns) * 89;
      body += rect(x, y, 79, 77, { fill: '#f5f0de', stroke: '#71849a', rx: 13, strokeWidth: 2 });
      body += shapeTile(shape, x + 8, y + 6, 64);
    });
    return svg(body, visual.description, 444, 268);
  }
  if (visual.kind === 'v3-pp2-corner') {
    return svg(shapeTile(visual.shape, 18, 6, 97), visual.description, 137, 108);
  }
  if (visual.kind === 'v3-pp2-solid') {
    let body = '';
    if (visual.solid === 'ball') {
      body += circle(73, 58, 45, { fill: TEAL, stroke: NAVY, strokeWidth: 4 });
      body += path('M45 27Q92 57 45 94', { stroke: WHITE, strokeWidth: 4 });
      body += circle(85, 35, 7, { fill: WHITE, strokeWidth: 0 });
    } else if (visual.solid === 'can') {
      body += rect(34, 36, 78, 70, { fill: GOLD, stroke: NAVY, strokeWidth: 4 });
      body += `<ellipse cx="73" cy="36" rx="39" ry="16" fill="${CORAL}" stroke="${NAVY}" stroke-width="4"/>`;
      body += path('M35 106Q73 121 111 106', { stroke: NAVY, strokeWidth: 3 });
      body += line(73, 57, 73, 88, { stroke: WHITE, width: 5 });
    } else if (visual.solid === 'box') {
      body += path('M28 35 L75 18 L117 37 L73 55 Z', { fill: GOLD, stroke: NAVY, strokeWidth: 4 });
      body += path('M28 35 L73 55 L73 108 L28 88 Z', { fill: CORAL, stroke: NAVY, strokeWidth: 4 });
      body += path('M73 55 L117 37 L117 89 L73 108 Z', { fill: LILAC, stroke: NAVY, strokeWidth: 4 });
    } else {
      body += path('M73 13 L27 99 Q73 116 119 99 Z', { fill: CORAL, stroke: NAVY, strokeWidth: 4 });
      body += `<ellipse cx="73" cy="99" rx="46" ry="16" fill="${GOLD}" stroke="${NAVY}" stroke-width="4"/>`;
      body += path('M72 31 L47 81', { stroke: WHITE, strokeWidth: 4 });
    }
    return svg(body, visual.description, 146, 125);
  }
  if (visual.kind === 'v3-pp2-mirror' || visual.kind === 'v3-pp2-mirror-option') {
    const choice = visual.kind.endsWith('option');
    const size = choice ? 41 : 47;
    const x0 = choice ? 13 : 31;
    const y0 = choice ? 11 : 40;
    let body = '';
    const grid = (rows, left, show) => rows.forEach((row, rowIndex) => row.forEach((filled, column) => {
      const x = left + column * size;
      const y = y0 + rowIndex * size;
      body += rect(x, y, size - 3, size - 3, { fill: WHITE, stroke: NAVY, rx: 3, strokeWidth: 2 });
      if (show && filled) {
        body += rect(x + 8, y + 8, size - 19, size - 19, { fill: TEAL, stroke: NAVY, rx: 4, strokeWidth: 2 });
        body += circle(x + (size - 3) / 2, y + (size - 3) / 2, 4, { fill: WHITE, strokeWidth: 0 });
      }
    }));
    grid(visual.rows, x0, true);
    if (!choice) {
      body += line(157, 31, 157, y0 + visual.rows.length * size + 7, { stroke: CORAL, width: 5, dash: '7 6' });
      grid(visual.rows, 192, false);
      body += text(239, 29, '?', { size: 25 });
    }
    return svg(body, visual.description, choice ? 112 : 326,
      y0 + visual.rows.length * size + 20);
  }
  if (visual.kind === 'v3-pp2-combo' || visual.kind === 'v3-pp2-combo-choice') {
    const small = visual.kind.endsWith('choice');
    const x = small ? 31 : 111;
    const size = small ? 74 : 112;
    let body = '';
    if (!small) {
      body += rect(29, 19, 335, 232, { fill: '#ecf8f4', stroke: NAVY, rx: 39, strokeWidth: 3 });
      body += line(195, 16, 195, 257, { stroke: '#c8dce2', width: 4, dash: '8 9' });
    }
    body += shapeTile(visual.top, x, small ? 3 : 24, size);
    body += shapeTile(visual.bottom, x, small ? 80 : 124, size);
    return svg(body, visual.description, small ? 145 : 394, small ? 169 : 270);
  }
  if (visual.kind === 'v3-pp2-unitrod') {
    let body = rect(29, 45, visual.units * 30, 29, { fill: LILAC, stroke: NAVY, rx: 9, strokeWidth: 3 });
    body += text(31 + visual.units * 15, 66, 'ROD', { size: 17, fill: WHITE });
    for (let i = 0; i < visual.units; i++) {
      const x = 29 + i * 30;
      body += rect(x, 85, 30, 37, { fill: visual.unit === 'cubes' ? GOLD : TEAL, stroke: NAVY, rx: 3, strokeWidth: 2.5 });
      body += visual.unit === 'cubes'
        ? circle(x + 15, 104, 4, { fill: NAVY, strokeWidth: 0 })
        : line(x + 8, 93, x + 22, 115, { stroke: WHITE, width: 3 });
    }
    body += text(209, 164, `EQUAL ${visual.unit.toUpperCase()}`, { size: 17 });
    return svg(body, visual.description, 418, 179);
  }
  if (visual.kind === 'v3-pp2-ruler') {
    const xAt = value => 40 + value * 34;
    let body = text(210, 24, visual.item.toUpperCase(), { size: 17 });
    body += rect(xAt(visual.start), 40, (visual.end - visual.start) * 34, 42,
      { fill: TEAL, stroke: NAVY, rx: 8, strokeWidth: 3 });
    body += circle(xAt(visual.start), 62, 6, { fill: GOLD, stroke: NAVY, strokeWidth: 2 });
    body += circle(xAt(visual.end), 62, 6, { fill: GOLD, stroke: NAVY, strokeWidth: 2 });
    body += rect(31, 100, 359, 51, { fill: '#fff1d6', stroke: NAVY, rx: 5, strokeWidth: 3 });
    for (let i = 0; i <= 10; i++) {
      const x = xAt(i);
      body += line(x, 100, x, 118, { stroke: NAVY, width: 2 });
      body += text(x, 141, i, { size: 17 });
    }
    return svg(body, visual.description, 420, 170);
  }
  if (visual.kind === 'v3-pp2-rods') {
    const rows = visual.lengths.length;
    const spacing = rows > 3 ? 56 : 73;
    let body = line(71, 18, 71, 32 + (rows - 1) * spacing + 50, { stroke: NAVY, width: 4 });
    visual.lengths.forEach((length, row) => {
      const y = 32 + row * spacing;
      body += text(35, y + 27, visual.labels[row], { size: 24, weight: 800 });
      body += rect(75, y, length * 24, 36, { fill: [TEAL, CORAL, LILAC, GOLD][row], stroke: NAVY, rx: 6, strokeWidth: 3 });
      for (let i = 1; i < length; i++) {
        body += line(75 + i * 24, y + 2, 75 + i * 24, y + 34, { stroke: WHITE, width: 2 });
      }
    });
    return svg(body, visual.description, 425, 32 + (rows - 1) * spacing + 66);
  }
  if (visual.kind === 'v3-pp2-balance') {
    let body = line(207, 67, 207, 219, { stroke: NAVY, width: 8 });
    body += path('M169 225 L245 225 L207 181 Z', { fill: LILAC, stroke: NAVY, strokeWidth: 3 });
    body += line(44, 85, 370, 85, { stroke: NAVY, width: 7 });
    body += circle(207, 85, 9, { fill: CORAL, stroke: NAVY, strokeWidth: 2 });
    for (const x of [91, 325]) {
      body += line(x, 87, x, 184, { stroke: NAVY, width: 3 });
      body += line(x - 63, 183, x + 63, 183, { stroke: NAVY, width: 5 });
    }
    const weights = (values, x) => values.forEach((value, i) => {
      const bx = x - values.length * 26 + i * 52;
      body += rect(bx, 134, 48, 46, { fill: value === '?' ? '#f4d2ba' : GOLD,
        stroke: NAVY, rx: 9, strokeWidth: 3 });
      body += text(bx + 24, 165, value, { size: 23, weight: 800 });
    });
    weights(visual.left, 91);
    weights([...visual.right, '?'], 325);
    return svg(body, visual.description, 415, 249);
  }
  if (visual.kind === 'v3-pp2-jug') {
    const unit = 19;
    const top = 34;
    const bottom = top + visual.capacity * unit;
    let body = rect(108, top - 6, 167, visual.capacity * unit + 12, { fill: WHITE, stroke: NAVY, rx: 18, strokeWidth: 4 });
    body += path(`M275 ${top + 32} Q335 ${top + 18} 324 ${top + 85} Q316 ${top + 128} 278 ${top + 106}`,
      { stroke: NAVY, strokeWidth: 8 });
    for (let i = 0; i < visual.capacity; i++) {
      const y = bottom - (i + 1) * unit;
      body += rect(126, y, 131, unit - 1, { fill: i < visual.filled ? TEAL : '#f6f1df',
        stroke: '#54738a', rx: 2, strokeWidth: 1.5 });
      if (i < visual.filled) body += circle(144, y + unit / 2, 3, { fill: WHITE, strokeWidth: 0 });
    }
    if (visual.add) body += text(65, top + 71, `+${visual.add}`, { size: 23, fill: CORAL });
    return svg(body, visual.description, 369, Math.max(202, bottom + 28));
  }
  if (visual.kind === 'v3-pp2-queue') {
    const space = visual.names.length === 5 ? 94 : visual.names.length === 4 ? 108 : 132;
    let body = line(36, 119, 483, 119, { stroke: '#bccbd0', width: 5 });
    visual.names.forEach((name, i) => {
      const x = 20 + i * space;
      body += circle(x + 40, 74, 42, { fill: i % 2 ? '#fef0db' : '#e8f7f3', stroke: NAVY, strokeWidth: 2.5 });
      body += shapeTile(visual.portraits[i], x + 8, 43, 64);
      body += text(x + 40, 158, name, { size: 20, weight: 750 });
    });
    return svg(body, visual.description, 503, 182);
  }
  if (visual.kind === 'v3-pp2-alien-choice') {
    return svg(alienTile(visual.shape, visual.mark, 26, 16, 89),
      visual.description, 142, 121);
  }
  if (visual.kind === 'v3-pp2-analogy') {
    let body = '';
    const objects = [
      [visual.topShape, visual.topMark],
      [visual.bottomShape, visual.topMark],
      [visual.topShape, visual.bottomMark],
      [null, null],
    ];
    objects.forEach(([shape, mark], i) => {
      const x = 30 + (i % 2) * 131;
      const y = 20 + Math.floor(i / 2) * 119;
      body += rect(x, y, 108, 100, { fill: '#f1f5ee', stroke: NAVY, rx: 12, strokeWidth: 3 });
      body += shape ? alienTile(shape, mark, x + 16, y + 8, 77)
        : text(x + 54, y + 63, '?', { size: 37, weight: 800 });
    });
    return svg(body, visual.description, 302, 267);
  }
  if (visual.kind === 'v3-pp2-changes') {
    let body = text(47, 73, 'OLD', { size: 17 }) + text(47, 187, 'NEW', { size: 17 });
    visual.before.forEach((shape, i) => {
      const x = 81 + i * 79;
      body += rect(x - 3, 22, 66, 201, { fill: i % 2 ? '#f8f3eb' : '#e9f6f1',
        stroke: '#b4c9ce', rx: 9, strokeWidth: 2 });
      body += shapeTile(shape, x + 3, 27, 57);
      body += line(x + 29, 88, x + 29, 145, { stroke: '#a2adba', width: 3, dash: '5 6' });
      body += shapeTile(visual.after[i], x + 3, 155, 57);
    });
    return svg(body, visual.description, 503, 245);
  }
  if (visual.kind === 'v3-pp2-map') {
    const arrow = (name, x, y) => {
      const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const [dx, dy] = directions[name];
      const ex = x + dx * 35;
      const ey = y + dy * 26;
      return line(x, y, ex, ey, { stroke: CORAL, width: 6 })
        + path(`M${ex - dx * 10 - dy * 9} ${ey - dy * 10 + dx * 9}L${ex} ${ey}L${ex - dx * 10 + dy * 9} ${ey - dy * 10 - dx * 9}`,
          { stroke: CORAL, strokeWidth: 5 });
    };
    let body = '';
    visual.steps.forEach((name, i) => {
      body += arrow(name, 84 + i * 107, 29);
    });
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) {
        const x = 47 + column * 82;
        const y = 65 + row * 77;
        body += rect(x, y, 78, 73, { fill: row === 1 && column === 1 ? '#f5e9d8' : '#eef8f3',
          stroke: NAVY, rx: 10, strokeWidth: 2.5 });
        if (row === 1 && column === 1) {
          body += sprite('rover', x + 18, y + 5, 43);
          body += text(x + 39, y + 62, 'ROVER', { size: 18 });
        } else {
          const planet = visual.planets.find(p => p.x === column && p.y === row);
          if (planet) {
            body += sprite('planet', x + 14, y + 1, 49,
              { fill: [TEAL, GOLD, LILAC, CORAL][visual.planets.indexOf(planet)] });
            body += text(x + 39, y + 68, planet.name, { size: 20, weight: 750 });
          }
        }
      }
    }
    return svg(body, visual.description, 343, 308);
  }
  throw new Error(`Unsupported PP2 picture: ${visual.kind}`);
}
