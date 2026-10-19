import { GREEN, INK, ORANGE, PAPER, circle, icon, line, path, rect, svg, text } from './diagram-kit.mjs';
import { TINTS, numberLine, spacePanel, sprite, spriteRow } from './sprites.mjs';

const plural = (n, one) => `${n} ${Number(n) === 1 ? one : `${one}s`}`;

const BLUE = '#5b88c8';
const PURPLE = '#8a6bb8';
const GOLD = '#f0c45a';
const RED = '#d95f52';
const SOFT = '#eef3f8';
const MUTED = '#c8d1dc';

function badgeSvg(shape, mark, cx, cy, size = 40) {
  const fill = shape === 'circle' ? GREEN : shape === 'triangle' ? ORANGE : shape === 'square' ? BLUE : PURPLE;
  let body = icon(shape, cx - size / 2, cy - size / 2, size, fill);
  if (mark === 'dot') body += circle(cx, cy + 2, 5, { fill: PAPER, stroke: INK, strokeWidth: 2 });
  if (mark === 'ring') body += circle(cx, cy + 2, 9, { fill: 'none', stroke: PAPER, strokeWidth: 3 });
  return body;
}

export function renderVisual(visual) {
  switch (visual.kind) {
    // 1. Base-ten blocks (main)
    case 'v3-class-2-blocks': {
      let body = rect(10, 10, 460, 210, { fill: SOFT, rx: 10 });
      body += text(240, 34, 'Base-Ten Blocks', { size: 18 });
      // Flats (100)
      body += text(95, 58, 'Hundreds (100)', { size: 16 });
      for (let i = 0; i < visual.h; i++) {
        const x = 24 + (i % 4) * 36;
        const y = 68 + Math.floor(i / 4) * 44;
        body += rect(x, y, 30, 30, { fill: GREEN, rx: 3 });
        body += line(x + 10, y, x + 10, y + 30, { width: 1 }) + line(x + 20, y, x + 20, y + 30, { width: 1 });
        body += line(x, y + 10, x + 30, y + 10, { width: 1 }) + line(x, y + 20, x + 30, y + 20, { width: 1 });
      }
      // Rods (10)
      body += text(255, 58, 'Tens (10)', { size: 16 });
      for (let i = 0; i < visual.t; i++) {
        const x = 195 + i * 16;
        body += rect(x, 70, 11, 76, { fill: ORANGE, rx: 2 });
      }
      // Cubes (1)
      body += text(400, 58, 'Ones (1)', { size: 16 });
      for (let i = 0; i < visual.o; i++) {
        const x = 355 + (i % 3) * 26;
        const y = 72 + Math.floor(i / 3) * 26;
        body += rect(x, y, 18, 18, { fill: GOLD, rx: 2 });
      }
      return svg(body, visual.description, 480, 230);
    }

    // 2. Number line (main)
    case 'v3-class-2-numline': {
      let body = rect(14, 14, 452, 162, { fill: PAPER, rx: 10 });
      body += text(240, 42, 'Number Line', { size: 18 });
      const x0 = 50;
      const span = 380;
      const stepPx = span / visual.ticks;
      const refIdx = visual.arrowIndex === 2 ? 4 : 2;
      body += line(x0, 115, x0 + span, 115, { width: 3 });
      for (let i = 0; i <= visual.ticks; i++) {
        const x = Math.round(x0 + i * stepPx);
        body += line(x, 103, x, 127, { width: 2.5 });
        if (i === visual.arrowIndex) {
          body += text(x, 152, '?', { size: 18, fill: ORANGE });
        } else if (i === 0 || i === visual.ticks || i === refIdx) {
          body += text(x, 152, String(visual.start + i * visual.step), { size: 17 });
        }
      }
      const ax = Math.round(x0 + visual.arrowIndex * stepPx);
      body += path(`M${ax} 96 L${ax - 11} 72 H${ax + 11} Z`, { fill: ORANGE });
      body += rect(ax - 32, 48, 64, 24, { fill: GOLD, rx: 5 });
      body += text(ax, 66, 'HERE', { size: 16 });
      return svg(body, visual.description, 480, 190);
    }

    // 4. Four beacons (main)
    case 'v3-class-2-beacons': {
      let body = '';
      const codes = ['Alpha', 'Beta', 'Gamma', 'Delta'];
      visual.nums.forEach((n, i) => {
        const x = 22 + i * 112;
        body += path(`M${x + 48} 20 L${x + 48} 42`, { width: 3 });
        body += circle(x + 48, 18, 6, { fill: ORANGE });
        body += rect(x, 42, 96, 86, { fill: i % 2 ? SOFT : PAPER, rx: 10, strokeWidth: 2.5 });
        body += text(x + 48, 72, codes[i], { size: 16 });
        body += text(x + 48, 108, String(n), { size: 24 });
      });
      return svg(body, visual.description, 470, 145);
    }

    // 5. Mini base-ten blocks (choice)
    case 'v3-class-2-block-mini': {
      let body = rect(4, 4, 212, 132, { fill: PAPER, rx: 8 });
      // Flats (large 34x34 squares in 2x2 grid)
      for (let i = 0; i < visual.h; i++) {
        const x = 12 + (i % 2) * 38;
        const y = 24 + Math.floor(i / 2) * 38;
        body += rect(x, y, 32, 32, { fill: GREEN, rx: 3 });
        body += line(x + 11, y, x + 11, y + 32, { width: 1.2 }) + line(x + 21, y, x + 21, y + 32, { width: 1.2 });
        body += line(x, y + 11, x + 32, y + 11, { width: 1.2 }) + line(x, y + 21, x + 32, y + 21, { width: 1.2 });
      }
      // Rods (tall 11x88 bars)
      for (let i = 0; i < visual.t; i++) {
        const x = 94 + i * 13;
        body += rect(x, 22, 10, 88, { fill: ORANGE, rx: 2 });
      }
      // Ones (18x18 cubes in 2x3 grid)
      for (let i = 0; i < visual.o; i++) {
        const x = 166 + (i % 2) * 22;
        const y = 24 + Math.floor(i / 2) * 24;
        body += rect(x, y, 17, 17, { fill: GOLD, rx: 2 });
      }
      return svg(body, visual.description, 220, 140);
    }

    // 6. Array grid (main)
    case 'v3-class-2-array': {
      const cell = 32;
      const w = visual.cols * cell + 40;
      const h = visual.rows * cell + 60;
      let body = rect(12, 12, w - 24, h - 24, { fill: SOFT, rx: 10 });
      const total = visual.rows * visual.cols - visual.missing;
      let drawn = 0;
      for (let r = 0; r < visual.rows; r++) {
        for (let c = 0; c < visual.cols; c++) {
          const cx = 36 + c * cell;
          const cy = 42 + r * cell;
          if (drawn < total) {
            body += circle(cx, cy, 11, { fill: r % 2 ? ORANGE : GREEN });
            drawn++;
          } else {
            body += circle(cx, cy, 10, { fill: PAPER, stroke: MUTED });
          }
        }
      }
      return svg(body, visual.description, Math.max(260, w), Math.max(160, h));
    }

    // 7. Jump line (main)
    case 'v3-class-2-jumps': {
      let body = rect(10, 10, 460, 170, { fill: PAPER, rx: 10 });
      const x0 = 42;
      const span = 396;
      const stepPx = span / visual.jumps;
      body += line(x0, 125, x0 + span, 125, { width: 3 });
      for (let i = 0; i <= visual.jumps; i++) {
        const x = Math.round(x0 + i * stepPx);
        body += line(x, 115, x, 135, { width: 2.5 });
        const val = visual.start + i * visual.step;
        const label = (!visual.askStep && i === visual.jumps) ? '?' : (visual.askStep && i > 0 && i < visual.jumps ? '' : String(val));
        if (label) body += text(x, 158, label, { size: 17 });
        if (i < visual.jumps) {
          const nx = Math.round(x0 + (i + 1) * stepPx);
          const mx = Math.round((x + nx) / 2);
          body += path(`M${x} 115 Q${mx} 62 ${nx} 115`, { stroke: ORANGE, strokeWidth: 2.5 });
          body += text(mx, 78, visual.askStep ? '+?' : `+${visual.step}`, { size: 16 });
        }
      }
      return svg(body, visual.description, 480, 190);
    }

    // 9. Vertical column sum (main)
    case 'v3-class-2-colsum': {
      let body = rect(90, 12, 260, 206, { fill: PAPER, rx: 10, strokeWidth: 2.5 });
      const cols = ['H', 'T', 'O'];
      cols.forEach((col, i) => {
        const x = 165 + i * 55;
        body += text(x, 42, col, { size: 17, fill: BLUE });
      });
      body += text(122, 128, visual.op, { size: 26 });
      const drawRow = (str, y) => {
        [...str].forEach((ch, i) => {
          const x = 165 + i * 55;
          if (ch === '?') {
            body += rect(x - 20, y - 28, 40, 38, { fill: GOLD, rx: 6 });
            body += text(x, y - 2, '?', { size: 24 });
          } else {
            body += text(x, y, ch, { size: 24 });
          }
        });
      };
      drawRow(visual.topMask, 86);
      drawRow(visual.botMask, 132);
      body += line(115, 150, 310, 150, { width: 3 });
      drawRow(visual.resStr, 188);
      return svg(body, visual.description, 440, 230);
    }

    // 10. Equalize trays (main)
    case 'v3-class-2-trays': {
      let body = '';
      const drawTray = (name, count, y, fill) => {
        body += rect(20, y, 420, 76, { fill: SOFT, rx: 8 });
        body += text(85, y + 44, `${name} (${count})`, { size: 18 });
        for (let i = 0; i < count; i++) {
          const cx = 165 + (i % 10) * 24;
          const cy = y + (count > 10 ? (i < 10 ? 25 : 53) : 38);
          body += circle(cx, cy, 9, { fill });
        }
      };
      drawTray(visual.nameA, visual.high, 18, ORANGE);
      drawTray(visual.nameB, visual.low, 112, GREEN);
      return svg(body, visual.description, 460, 205);
    }

    // 11. Repeating beads (main) & badge choice
    case 'v3-class-2-beads': {
      const n = visual.row.length;
      const step = Math.floor(420 / n);
      let body = line(24, 65, 456, 65, { width: 3 });
      visual.row.forEach((b, i) => {
        const cx = 42 + i * step;
        if (!b) {
          body += rect(cx - 22, 43, 44, 44, { fill: PAPER, rx: 8, strokeWidth: 2.5 });
          body += text(cx, 72, '?', { size: 22 });
        } else {
          body += badgeSvg(b.shape, b.mark, cx, 65, 40);
        }
        body += text(cx, 112, String(i + 1), { size: 16 });
      });
      return svg(body, visual.description, 480, 130);
    }

    case 'v3-class-2-badge-mini': {
      const body = rect(10, 10, 120, 100, { fill: PAPER, rx: 10 }) + badgeSvg(visual.shape, visual.mark, 70, 60, 56);
      return svg(body, visual.description, 140, 120);
    }

    // 12. Growing tiles (main)
    case 'v3-class-2-growing': {
      let body = '';
      const words = ['One', 'Two', 'Three'];
      visual.steps.forEach((cnt, idx) => {
        const x0 = 24 + idx * 150;
        body += rect(x0, 16, 132, 152, { fill: SOFT, rx: 8 });
        body += text(x0 + 66, 40, `Step ${words[idx]}`, { size: 17 });
        for (let t = 0; t < cnt; t++) {
          const tx = x0 + 18 + (t % 4) * 24;
          const ty = 54 + Math.floor(t / 4) * 24;
          body += rect(tx, ty, 20, 20, { fill: idx % 2 ? ORANGE : GREEN, rx: 3 });
        }
        body += text(x0 + 66, 154, `${cnt} ${cnt === 1 ? 'tile' : 'tiles'}`, { size: 16 });
      });
      return svg(body, visual.description, 480, 185);
    }

    // 13. Function machine (main)
    case 'v3-class-2-machine': {
      let body = '';
      body += rect(24, 54, 92, 64, { fill: GOLD, rx: 10 });
      body += text(70, 78, 'IN', { size: 16 });
      body += text(70, 104, visual.shownIn, { size: 22 });
      body += line(116, 86, 150, 86, { width: 4 });
      body += rect(150, 38, 180, 96, { fill: SOFT, rx: 14, strokeWidth: 3 });
      body += text(240, 72, 'RULE MACHINE', { size: 16, fill: BLUE });
      body += text(240, 104, visual.ruleText, { size: 20 });
      body += line(330, 86, 364, 86, { width: 4 });
      body += rect(364, 54, 92, 64, { fill: GREEN, rx: 10 });
      body += text(410, 78, 'OUT', { size: 16, fill: PAPER });
      body += text(410, 104, visual.shownOut, { size: 22, fill: PAPER });
      return svg(body, visual.description, 480, 165);
    }

    // 14. 3x3 Matrix (main)
    case 'v3-class-2-matrix': {
      let body = rect(95, 10, 250, 230, { fill: SOFT, rx: 10 });
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cx = 145 + c * 75;
          const cy = 52 + r * 68;
          body += rect(cx - 30, cy - 28, 60, 56, { fill: PAPER, rx: 6 });
          if (r === visual.missR && c === visual.missC) {
            body += text(cx, cy + 8, '?', { size: 26, fill: ORANGE });
          } else {
            const cell = visual.grid[r][c];
            body += badgeSvg(cell.shape, cell.mark, cx, cy, 40);
          }
        }
      }
      return svg(body, visual.description, 440, 250);
    }

    // 16. Hidden shapes craft (main)
    case 'v3-class-2-craft-shapes': {
      let body = rect(14, 14, 432, 202, { fill: SOFT, rx: 10 });
      body += text(230, 38, 'Rocket Blueprint', { size: 18 });
      // Main body rectangle
      body += rect(110, 78, 200, 64, { fill: PAPER, strokeWidth: 2.5 });
      // Inner panel rectangles
      for (let i = 0; i < visual.panels; i++) {
        body += rect(120 + i * 44, 88, 34, 44, { fill: GOLD });
      }
      // Porthole circles above
      for (let i = 0; i < visual.portholes; i++) {
        body += circle(135 + i * 38, 60, 11, { fill: GREEN });
      }
      // Nose triangle on right
      body += path('M310 78 L368 110 L310 142 Z', { fill: ORANGE });
      // Fin triangles
      body += path('M120 78 L150 48 L155 78 Z', { fill: ORANGE });
      body += path('M120 142 L150 172 L155 142 Z', { fill: ORANGE });
      if (visual.fins === 4) {
        body += path('M240 78 L265 50 L270 78 Z', { fill: ORANGE });
        body += path('M240 142 L265 170 L270 142 Z', { fill: ORANGE });
      }
      // Wheels below
      for (let i = 0; i < visual.wheels; i++) {
        body += circle(145 + i * 46, 162, 13, { fill: BLUE });
      }
      return svg(body, visual.description, 460, 230);
    }

    // 17. Symmetry half (main + choice)
    case 'v3-class-2-sym-left': {
      let body = rect(60, 14, 280, 190, { fill: SOFT, rx: 10 });
      const cell = 34;
      const mx = 200;
      const y0 = 36;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          const filled = c < visual.rows[r];
          body += rect(mx - (c + 1) * cell, y0 + r * cell, cell, cell, { fill: filled ? GREEN : PAPER });
          body += rect(mx + c * cell, y0 + r * cell, cell, cell, { fill: PAPER, stroke: MUTED });
        }
      }
      body += line(mx, 24, mx, 186, { stroke: ORANGE, width: 3, dash: '6 4' });
      body += text(252, 112, '?', { size: 26, fill: ORANGE });
      return svg(body, visual.description, 400, 220);
    }

    case 'v3-class-2-sym-mini': {
      const cell = 24;
      let body = line(18, 10, 18, 114, { stroke: ORANGE, width: 3, dash: '4 3' });
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          const filled = c < visual.rows[r];
          body += rect(20 + c * cell, 14 + r * cell, cell, cell, { fill: filled ? GREEN : PAPER });
        }
      }
      return svg(body, visual.description, 115, 124);
    }

    // 18. Cube stack (main)
    case 'v3-class-2-cubes': {
      let body = rect(20, 14, 400, 200, { fill: SOFT, rx: 10 });
      body += text(220, 38, 'Cube Stack', { size: 18 });
      visual.cols.forEach((h, i) => {
        const x = 90 + i * 74;
        for (let levelIdx = 0; levelIdx < h; levelIdx++) {
          const y = 152 - levelIdx * 32;
          body += rect(x, y, 48, 30, { fill: levelIdx % 2 ? GOLD : GREEN, rx: 3 });
        }
        body += text(x + 24, 198, `Col ${i + 1}: ${h}`, { size: 16 });
      });
      return svg(body, visual.description, 440, 225);
    }

    // 19. Grid perimeter (main)
    case 'v3-class-2-perim': {
      const cell = 34;
      const rows = visual.cells.length;
      const cols = visual.cells[0].length;
      let body = text(210, 28, '1 square = 1 m by 1 m', { size: 17 });
      const x0 = 90;
      const y0 = 42;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          body += rect(x0 + c * cell, y0 + r * cell, cell, cell, {
            fill: visual.cells[r][c] ? GREEN : PAPER,
            stroke: INK,
            strokeWidth: visual.cells[r][c] ? 2.5 : 1,
          });
        }
      }
      return svg(body, visual.description, 420, Math.max(235, y0 + rows * cell + 14));
    }

    // 20. Solid models tray (main)
    case 'v3-class-2-solids': {
      let body = rect(16, 14, 428, 172, { fill: SOFT, rx: 10 });
      const drawSolid = (shape, x, y) => {
        if (shape === 'cube') {
          body += rect(x, y + 10, 38, 38, { fill: GREEN, rx: 2 });
          body += path(`M${x} ${y + 10} L${x + 12} ${y} H${x + 50} L${x + 38} ${y + 10} Z`, { fill: GOLD });
          body += path(`M${x + 38} ${y + 10} L${x + 50} ${y} V${y + 38} L${x + 38} ${y + 48} Z`, { fill: ORANGE });
        } else if (shape === 'cuboid') {
          body += rect(x - 6, y + 14, 48, 32, { fill: BLUE, rx: 2 });
          body += path(`M${x - 6} ${y + 14} L${x + 6} ${y + 4} H${x + 54} L${x + 42} ${y + 14} Z`, { fill: GOLD });
          body += path(`M${x + 42} ${y + 14} L${x + 54} ${y + 4} V${y + 36} L${x + 42} ${y + 46} Z`, { fill: GREEN });
        } else if (shape === 'cylinder') {
          body += rect(x + 4, y + 8, 36, 40, { fill: ORANGE, rx: 6 });
          body += circle(x + 22, y + 10, 16, { fill: GOLD });
        } else if (shape === 'sphere') {
          body += circle(x + 22, y + 28, 24, { fill: BLUE });
        } else {
          body += path(`M${x + 22} ${y + 2} L${x + 2} ${y + 46} H${x + 42} Z`, { fill: PURPLE });
        }
      };
      const items = [
        ...Array(visual.countA).fill(visual.shapeA),
        ...(visual.shapeB ? Array(visual.countB).fill(visual.shapeB) : []),
      ];
      const step = Math.floor(380 / Math.max(1, items.length));
      items.forEach((sh, idx) => {
        drawSolid(sh, 38 + idx * step, 56);
      });
      const labelText = visual.shapeB
        ? `${plural(visual.countA, visual.shapeA)} + ${plural(visual.countB, visual.shapeB)}`
        : plural(visual.countA, visual.shapeA);
      body += text(230, 156, labelText, { size: 18 });
      return svg(body, visual.description, 460, 200);
    }

    // 21. Clip length (main)
    case 'v3-class-2-clips': {
      let body = rect(14, 14, 452, 176, { fill: SOFT, rx: 10 });
      body += text(240, 38, `1 Block = ${visual.unitVal} cm`, { size: 18 });
      const drawBar = (label, blocks, y, fill) => {
        body += text(95, y + 22, label, { size: 17, anchor: 'end' });
        for (let i = 0; i < blocks; i++) {
          body += rect(105 + i * 30, y, 28, 30, { fill, rx: 4 });
        }
        body += text(112 + blocks * 30, y + 22, `${blocks} blocks`, { size: 16, anchor: 'start' });
      };
      drawBar(visual.itemA, visual.aBlocks, 60, ORANGE);
      drawBar(visual.itemB, visual.bBlocks, 120, GREEN);
      return svg(body, visual.description, 480, 205);
    }

    // 22. Pan compare (main)
    case 'v3-class-2-pans': {
      let body = '';
      const drawScale = (heavy, light, x0, title) => {
        body += rect(x0, 14, 210, 175, { fill: SOFT, rx: 10 });
        body += text(x0 + 105, 38, title, { size: 17 });
        // Fulcrum
        body += path(`M${x0 + 105} 125 L${x0 + 88} 165 H${x0 + 122} Z`, { fill: INK });
        // Tilted beam (left is lower = heavier)
        body += line(x0 + 38, 138, x0 + 172, 108, { width: 3.5 });
        body += rect(x0 + 14, 104, 56, 32, { fill: ORANGE, rx: 6 });
        body += text(x0 + 42, 126, heavy, { size: 16 });
        body += rect(x0 + 140, 74, 56, 32, { fill: GREEN, rx: 6 });
        body += text(x0 + 168, 96, light, { size: 16, fill: PAPER });
      };
      drawScale(visual.items[0], visual.items[1], 16, 'Scale A');
      drawScale(visual.items[1], visual.items[2], 248, 'Scale B');
      return svg(body, visual.description, 476, 205);
    }

    // 23. Jug pour (main)
    case 'v3-class-2-jugs': {
      let body = rect(16, 14, 428, 192, { fill: SOFT, rx: 10 });
      // Small jug
      body += rect(60, 88, 72, 76, { fill: GOLD, rx: 6 });
      body += text(96, 132, `${visual.cup} L`, { size: 20 });
      body += text(96, 186, 'Small Jug', { size: 17 });
      // Arrow
      body += line(155, 126, 215, 126, { width: 3.5 });
      body += path('M215 126 L202 118 V134 Z', { fill: INK });
      // Large tank
      body += rect(245, 42, 140, 122, { fill: PAPER, rx: 8, strokeWidth: 3 });
      if (visual.currentVol > 0) {
        const fillH = Math.round((visual.currentVol / visual.tankCap) * 116);
        body += rect(248, 161 - fillH, 134, fillH, { fill: BLUE, strokeWidth: 0 });
        body += text(315, 145, `Has ${visual.currentVol} L`, { size: 17, fill: PAPER });
      }
      body += text(315, 76, `Tank: ${visual.tankCap} L`, { size: 18 });
      return svg(body, visual.description, 460, 220);
    }

    // 25. Thermometer diff (main)
    case 'v3-class-2-thermo': {
      let body = '';
      const drawThermo = (label, temp, x0, fill) => {
        body += rect(x0, 12, 195, 205, { fill: SOFT, rx: 10 });
        body += text(x0 + 98, 36, `${label}: ${temp} C`, { size: 18 });
        body += rect(x0 + 82, 48, 28, 130, { fill: PAPER, rx: 12 });
        const h = Math.round((temp / (visual.step * 10)) * 115);
        body += rect(x0 + 86, 174 - h, 20, h, { fill, strokeWidth: 0 });
        body += circle(x0 + 96, 182, 18, { fill });
        for (let t = 0; t <= 10; t += 2) {
          const y = 174 - Math.round((t / 10) * 115);
          body += line(x0 + 72, y, x0 + 82, y, { width: 2 });
          body += text(x0 + 66, y + 5, String(t * visual.step), { size: 16, anchor: 'end' });
        }
      };
      drawThermo(visual.podA, visual.tempA, 22, BLUE);
      drawThermo(visual.podB, visual.tempB, 242, ORANGE);
      return svg(body, visual.description, 460, 230);
    }

    // 26. Clock choice (choice)
    case 'v3-class-2-clock-mini': {
      const cx = 90, cy = 90, r = 76;
      const total = ((visual.minutes % 720) + 720) % 720;
      const minute = total % 60;
      const hourAngle = ((total / 720) * Math.PI * 2) - Math.PI / 2;
      const minuteAngle = ((minute / 60) * Math.PI * 2) - Math.PI / 2;
      let body = circle(cx, cy, r, { fill: PAPER, stroke: INK, strokeWidth: 3 });
      for (let h = 1; h <= 12; h++) {
        const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
        const tx = Math.round(cx + Math.cos(a) * (r - 19));
        const ty = Math.round(cy + Math.sin(a) * (r - 19)) + 5;
        body += text(tx, ty, String(h), { size: 15 });
      }
      const hx = Math.round(cx + Math.cos(hourAngle) * (r * 0.45));
      const hy = Math.round(cy + Math.sin(hourAngle) * (r * 0.45));
      const mx = Math.round(cx + Math.cos(minuteAngle) * (r * 0.68));
      const my = Math.round(cy + Math.sin(minuteAngle) * (r * 0.68));
      body += line(cx, cy, hx, hy, { stroke: INK, width: 5 });
      body += line(cx, cy, mx, my, { stroke: RED, width: 3.5 });
      body += circle(cx, cy, 4.5, { fill: GOLD });
      return svg(body, visual.description, 180, 180);
    }

    // 27. Timeline bar (main)
    case 'v3-class-2-timeline': {
      let body = rect(14, 14, 452, 165, { fill: SOFT, rx: 10 });
      body += text(240, 42, `${visual.task} Timeline`, { size: 18 });
      body += rect(48, 72, 185, 38, { fill: GREEN, rx: 4 });
      body += text(140, 97, `${visual.part1} min`, { size: 17, fill: PAPER });
      body += rect(233, 72, 185, 38, { fill: ORANGE, rx: 4 });
      body += text(325, 97, `${visual.part2} min`, { size: 17 });
      body += text(48, 142, visual.startText, { size: 18 });
      body += text(233, 142, visual.midText, { size: 18 });
      body += text(418, 142, visual.endText, { size: 18 });
      return svg(body, visual.description, 480, 195);
    }

    // 28. Schedule table (main)
    case 'v3-class-2-schedule': {
      let body = rect(20, 14, 420, 42 + visual.rows.length * 44 + 4, { fill: PAPER, rx: 10, strokeWidth: 2.5 });
      body += rect(20, 14, 420, 42, { fill: SOFT, rx: 8 });
      body += text(105, 42, 'Task', { size: 18 });
      body += text(255, 42, 'Start', { size: 18 });
      body += text(375, 42, 'End', { size: 18 });
      visual.rows.forEach((row, i) => {
        const y = 88 + i * 44;
        body += line(20, y - 28, 440, y - 28, { stroke: MUTED, width: 1.5 });
        body += text(105, y, row.name, { size: 17 });
        body += text(255, y, row.start, { size: 17 });
        body += text(375, y, row.end, { size: 17 });
      });
      return svg(body, visual.description, 460, 62 + visual.rows.length * 44 + 14);
    }

    // 30. Calendar span (main)
    case 'v3-class-2-cal': {
      let body = rect(16, 10, 428, 250, { fill: PAPER, rx: 10, strokeWidth: 2.5 });
      body += text(230, 36, visual.monthName, { size: 20 });
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.forEach((d, i) => {
        body += text(54 + i * 58, 64, d, { size: 16, fill: BLUE });
      });
      for (let d = 1; d <= visual.totalDays; d++) {
        const idx = visual.startDay + d - 1;
        const col = idx % 7;
        const row = Math.floor(idx / 7);
        body += text(54 + col * 58, 96 + row * 30, String(d), { size: 16 });
      }
      return svg(body, visual.description, 460, 270);
    }

    // 31. Purse choice (choice)
    case 'v3-class-2-purse-mini': {
      let body = rect(8, 8, 184, 114, { fill: SOFT, rx: 10 });
      visual.notes.forEach((val, i) => {
        const x = 18 + (i % 3) * 56;
        const y = 18 + Math.floor(i / 3) * 48;
        if (val >= 10) {
          body += rect(x, y, 50, 34, { fill: val === 50 ? ORANGE : GREEN, rx: 4 });
          body += text(x + 25, y + 23, `${val}`, { size: 16, fill: val === 50 ? INK : PAPER });
        } else {
          body += circle(x + 25, y + 17, 17, { fill: GOLD });
          body += text(x + 25, y + 23, `${val}`, { size: 16 });
        }
      });
      return svg(body, visual.description, 200, 130);
    }

    // 32. Receipt missing (main)
    case 'v3-class-2-receipt': {
      let body = rect(60, 12, 320, 206, { fill: PAPER, rx: 8, strokeWidth: 2.5 });
      body += text(220, 40, 'SUPPLY RECEIPT', { size: 18 });
      body += line(80, 52, 360, 52, { dash: '5 4' });
      visual.lines.forEach((item, i) => {
        const y = 84 + i * 34;
        body += text(92, y, item.label, { size: 17, anchor: 'start' });
        body += text(348, y, item.price, { size: 18, anchor: 'end', fill: item.price === '?' ? ORANGE : INK });
      });
      body += line(80, 166, 360, 166, { width: 2.5 });
      body += text(92, 196, 'TOTAL', { size: 18, anchor: 'start' });
      body += text(348, 196, `Rs ${visual.total}`, { size: 19, anchor: 'end' });
      return svg(body, visual.description, 440, 230);
    }

    // 33. Four-item shop (main)
    case 'v3-class-2-shop4': {
      let body = '';
      visual.items.forEach((it, i) => {
        const x = 18 + i * 112;
        body += rect(x, 22, 100, 116, { fill: i % 2 ? SOFT : PAPER, rx: 10, strokeWidth: 2.5 });
        body += text(x + 50, 62, it.name, { size: 18 });
        body += rect(x + 14, 82, 72, 36, { fill: GOLD, rx: 6 });
        body += text(x + 50, 106, `Rs ${it.price}`, { size: 18 });
      });
      return svg(body, visual.description, 470, 160);
    }

    // 35. Pack deal comparison (main)
    case 'v3-class-2-packs': {
      let body = '';
      body += rect(20, 20, 195, 130, { fill: SOFT, rx: 10, strokeWidth: 2.5 });
      body += text(118, 52, 'Single Price', { size: 18 });
      body += text(118, 86, '1 item', { size: 17 });
      body += text(118, 122, `Rs ${visual.singlePrice}`, { size: 22, fill: ORANGE });

      body += rect(245, 20, 215, 130, { fill: PAPER, rx: 10, strokeWidth: 2.5 });
      body += text(352, 52, 'Pack Deal', { size: 18, fill: GREEN });
      body += text(352, 86, `Pack of ${visual.packQty}`, { size: 17 });
      body += text(352, 122, `Rs ${visual.packPrice}`, { size: 22 });
      return svg(body, visual.description, 480, 170);
    }

    // 36. Tally table (main)
    case 'v3-class-2-tally': {
      let body = rect(20, 14, 420, 182, { fill: PAPER, rx: 10, strokeWidth: 2.5 });
      body += text(95, 42, 'Item', { size: 18 });
      body += text(275, 42, 'Tally Marks (bundle = 5)', { size: 17 });
      visual.rows.forEach((row, rIdx) => {
        const y = 84 + rIdx * 44;
        body += line(20, y - 28, 440, y - 28, { stroke: MUTED, width: 1.5 });
        body += text(95, y, row.label, { size: 18 });
        const bundles = Math.floor(row.count / 5);
        const rem = row.count % 5;
        let x = 175;
        for (let b = 0; b < bundles; b++) {
          for (let s = 0; s < 4; s++) body += line(x + s * 8, y - 18, x + s * 8, y + 6, { width: 2.5 });
          body += line(x - 4, y + 4, x + 28, y - 16, { stroke: ORANGE, width: 3 });
          x += 44;
        }
        for (let s = 0; s < rem; s++) {
          body += line(x + s * 9, y - 18, x + s * 9, y + 6, { width: 2.5 });
        }
      });
      return svg(body, visual.description, 460, 210);
    }

    // 37. Bar graph (main)
    case 'v3-class-2-bars': {
      let body = line(64, 196, 420, 196, { width: 2.5 }) + line(64, 24, 64, 196, { width: 2.5 });
      for (let t = 2; t <= 10; t += 2) {
        const y = 196 - t * 16;
        body += line(58, y, 420, y, { stroke: MUTED, width: 1 });
        body += text(52, y + 6, String(t * visual.scale), { size: 16, anchor: 'end' });
      }
      visual.labels.forEach((label, i) => {
        const x = 88 + i * 82;
        const h = (visual.values[i] / visual.scale) * 16;
        body += rect(x, 196 - h, 48, h, { fill: i % 2 ? ORANGE : GREEN, rx: 3 });
        body += text(x + 24, 222, label, { size: 16 });
      });
      return svg(body, visual.description, 450, 240);
    }

    // 38. Pictograph (main)
    case 'v3-class-2-picto': {
      let body = rect(16, 12, 428, 196, { fill: PAPER, rx: 10, strokeWidth: 2.5 });
      body += text(230, 38, `Key: Each Star = ${visual.keyVal} crates`, { size: 18, fill: ORANGE });
      visual.labels.forEach((label, rIdx) => {
        const y = 78 + rIdx * 44;
        body += line(16, y - 24, 444, y - 24, { stroke: MUTED, width: 1.5 });
        body += text(82, y + 4, label, { size: 17 });
        for (let s = 0; s < visual.icons[rIdx]; s++) {
          body += icon('star', 145 + s * 38, y - 16, 30, GOLD);
        }
      });
      return svg(body, visual.description, 460, 220);
    }

    // 39. Score table (main)
    case 'v3-class-2-scoretable': {
      let body = rect(50, 14, 340, 176, { fill: PAPER, rx: 10, strokeWidth: 2.5 });
      body += rect(50, 14, 340, 40, { fill: SOFT, rx: 8 });
      body += text(145, 40, 'Team', { size: 18 });
      body += text(300, 40, 'Score', { size: 18 });
      visual.rows.forEach((row, i) => {
        const y = 84 + i * 40;
        body += line(50, y - 24, 390, y - 24, { stroke: MUTED, width: 1.5 });
        body += text(145, y, row.team, { size: 18 });
        body += text(300, y, String(row.score), { size: 19 });
      });
      return svg(body, visual.description, 440, 205);
    }

    // 40. Expanded story (main)
    case 'v3-class-2-expanded': {
      let body = spacePanel(10, 10, 440, 170, { seed: visual.h * 19 + visual.t * 7 + visual.o });
      body += sprite('crate', 24, 24, 42);
      body += text(250, 48, 'Crate Code', { size: 19, fill: PAPER });
      const cards = visual.orderSwap
        ? [
          { n: visual.t, unit: `${visual.t === 1 ? 'ten' : 'tens'} (10s)`, fill: ORANGE, ink: INK },
          { n: visual.h, unit: `${visual.h === 1 ? 'hundred' : 'hundreds'} (100s)`, fill: GREEN, ink: PAPER },
          { n: visual.o, unit: `${visual.o === 1 ? 'one' : 'ones'} (1s)`, fill: GOLD, ink: INK },
        ]
        : [
          { n: visual.h, unit: `${visual.h === 1 ? 'hundred' : 'hundreds'} (100s)`, fill: GREEN, ink: PAPER },
          { n: visual.t, unit: `${visual.t === 1 ? 'ten' : 'tens'} (10s)`, fill: ORANGE, ink: INK },
          { n: visual.o, unit: `${visual.o === 1 ? 'one' : 'ones'} (1s)`, fill: GOLD, ink: INK },
        ];
      cards.forEach((c, i) => {
        const x = 24 + i * 140;
        body += rect(x, 66, 132, 96, { fill: PAPER, rx: 10 });
        body += rect(x + 12, 76, 108, 42, { fill: c.fill, rx: 6 });
        body += text(x + 66, 104, String(c.n), { size: 22, fill: c.ink });
        body += text(x + 66, 144, c.unit, { size: 16 });
      });
      return svg(body, visual.description, 460, 190);
    }

    // 41. Regroup story (main)
    case 'v3-class-2-regroup': {
      const cols = visual.c ? 3 : 2;
      const w = cols === 3 ? 136 : 204;
      let body = spacePanel(10, 10, 440, 175, { seed: visual.a + visual.b });
      body += text(230, 38, 'Mission Log', { size: 18, fill: PAPER });
      const entries = visual.c
        ? (visual.sub
          ? [
            { tag: 'Start', val: `${visual.a}`, fill: GREEN },
            { tag: 'Sent Out', val: `- ${visual.b}`, fill: ORANGE },
            { tag: 'Found', val: `+ ${visual.c}`, fill: GOLD },
          ]
          : [
            { tag: 'Packed', val: `${visual.a}`, fill: GREEN },
            { tag: 'Added', val: `+ ${visual.b}`, fill: GOLD },
            { tag: 'Used', val: `- ${visual.c}`, fill: ORANGE },
          ])
        : (visual.sub
          ? [
            { tag: 'Had in Store', val: `${visual.a}`, fill: GREEN },
            { tag: 'Used Up', val: `- ${visual.b}`, fill: ORANGE },
          ]
          : [
            { tag: 'Monday', val: `${visual.a}`, fill: GREEN },
            { tag: 'Tuesday', val: `+ ${visual.b}`, fill: GOLD },
          ]);
      entries.forEach((e, i) => {
        const x = 22 + i * (w + 10);
        body += rect(x, 54, w, 114, { fill: PAPER, rx: 10 });
        body += sprite(visual.sp || 'crystal', x + 12, 66, 38);
        body += text(x + w / 2 + 14, 86, e.tag, { size: 16 });
        body += rect(x + 14, 110, w - 28, 44, { fill: e.fill, rx: 6 });
        body += text(x + w / 2, 139, e.val, { size: 21, fill: e.fill === GREEN ? PAPER : INK });
      });
      return svg(body, visual.description, 460, 195);
    }

    // 42. Story step (main)
    case 'v3-class-2-storystep': {
      let body = spacePanel(10, 10, 460, 175, { seed: visual.seq[0] * 13 });
      body += sprite(visual.sp || 'satellite', 24, 20, 38);
      body += text(250, 44, 'Hourly Log', { size: 18, fill: PAPER });
      const vals = [...visual.seq.slice(0, 4), '?'];
      vals.forEach((v, i) => {
        const x = 22 + i * 88;
        body += rect(x, 62, 78, 92, { fill: v === '?' ? GOLD : PAPER, rx: 10 });
        body += text(x + 39, 90, `Hr ${i + 1}`, { size: 16, fill: BLUE });
        body += text(x + 39, 132, String(v), { size: 22, fill: v === '?' ? INK : INK });
        if (i < 4) {
          const delta = i < 3 ? visual.seq[i + 1] - visual.seq[i] : null;
          const dText = delta !== null ? (delta > 0 ? `+${delta}` : `${delta}`) : '';
          body += line(x + 78, 108, x + 88, 108, { stroke: GOLD, width: 3 });
          if (dText) body += text(x + 83, 56, dText, { size: 16, fill: GOLD });
        }
      });
      return svg(body, visual.description, 480, 195);
    }

    // 43. Unit sense (main)
    case 'v3-class-2-unitsense': {
      let body = rect(12, 12, 436, 176, { fill: SOFT, rx: 10 });
      if (visual.mode === 'sense') {
        body += sprite(visual.sp || 'rover', 34, 46, 76);
        body += rect(134, 34, 292, 130, { fill: PAPER, rx: 10 });
        body += text(280, 72, visual.thingTitle, { size: 18 });
        body += rect(180, 94, 200, 50, { fill: GOLD, rx: 8 });
        body += text(280, 126, `${visual.num} ?`, { size: 24 });
      } else {
        body += sprite('astronaut', 22, 26, 44);
        body += text(245, 48, `${visual.cable}`, { size: 18 });
        const calcMode = visual.calcMode || (visual.sub ? 'sub' : 'add');
        if (calcMode === 'convert') {
          body += rect(34, 74, 392, 44, { fill: GREEN, rx: 6 });
          body += text(230, 103, `${visual.m} m ${visual.cm} cm`, { size: 19, fill: PAPER });
          body += text(230, 156, '1 m = 100 cm   |   Length in cm = ?', { size: 17 });
        } else {
          body += rect(34, 74, 210, 44, { fill: GREEN, rx: 6 });
          body += text(139, 103, `${visual.m} m ${visual.cm} cm`, { size: 19, fill: PAPER });
          if (calcMode === 'gap') {
            body += rect(256, 74, 166, 44, { fill: GOLD, rx: 6 });
            body += text(339, 103, `Goal ${visual.goalM} m`, { size: 18 });
            body += text(230, 156, '1 m = 100 cm   |   More cm needed = ?', { size: 17 });
          } else {
            body += rect(256, 74, 166, 44, { fill: calcMode === 'sub' ? RED : ORANGE, rx: 6 });
            body += text(339, 103, `${calcMode === 'sub' ? 'Cut off' : 'Add'} ${visual.extraCm} cm`, { size: 18, fill: calcMode === 'sub' ? PAPER : INK });
            body += text(230, 156, '1 m = 100 cm   |   Total in cm = ?', { size: 17 });
          }
        }
      }
      return svg(body, visual.description, 460, 200);
    }

    // 44. Duration story (main)
    case 'v3-class-2-duration': {
      let body = spacePanel(12, 12, 436, 168, { seed: visual.mainCount * 17 + visual.remCount });
      body += sprite(visual.sp || 'rocket', 26, 22, 42);
      body += text(245, 46, 'Mission Timer', { size: 18, fill: PAPER });
      body += rect(28, 66, 200, 92, { fill: PAPER, rx: 10 });
      body += text(128, 102, visual.mainText, { size: 21 });
      body += text(128, 138, visual.ruleText, { size: 16, fill: BLUE });
      body += rect(244, 66, 184, 92, { fill: GOLD, rx: 10 });
      body += text(336, 102, visual.remCount ? `+ ${visual.remText}` : 'No extra', { size: 20 });
      body += text(336, 138, `Total ${visual.askUnit} = ?`, { size: 17 });
      return svg(body, visual.description, 460, 192);
    }

    // 45. Saving story (main)
    case 'v3-class-2-saving': {
      const cols = visual.subMode === 'add' ? 2 : 3;
      const w = cols === 3 ? 132 : 196;
      let body = spacePanel(10, 10, 440, 175, { seed: visual.start + visual.earned });
      body += sprite('otter', 22, 18, 40);
      body += text(245, 42, 'Space Bank', { size: 18, fill: PAPER });
      const cards = [
        { title: 'Saved', val: `Rs ${visual.start}`, fill: GREEN, sp: 'coin' },
        { title: 'Earned', val: `+ Rs ${visual.earned}`, fill: GOLD, sp: 'coin' },
      ];
      if (visual.subMode === 'left') {
        cards.push({ title: 'Book Cost', val: `- Rs ${visual.price}`, fill: ORANGE, sp: 'crate' });
      } else if (visual.subMode === 'goal') {
        cards.push({ title: 'Goal Price', val: `Rs ${visual.goalPrice}`, fill: ORANGE, sp: 'satellite' });
      }
      cards.forEach((c, i) => {
        const x = 24 + i * (w + 10);
        body += rect(x, 60, w, 106, { fill: PAPER, rx: 10 });
        body += sprite(c.sp, x + 10, 70, 36);
        body += text(x + w / 2 + 14, 92, c.title, { size: 16 });
        body += rect(x + 12, 114, w - 24, 40, { fill: c.fill, rx: 6 });
        body += text(x + w / 2, 141, c.val, { size: 20, fill: c.fill === GREEN ? PAPER : INK });
      });
      return svg(body, visual.description, 460, 195);
    }

    // 46. Data story (main)
    case 'v3-class-2-datastory': {
      let body = rect(14, 12, 432, 196, { fill: PAPER, rx: 10, strokeWidth: 2.5 });
      body += rect(14, 12, 432, 40, { fill: SOFT, rx: 8 });
      body += sprite('star', 26, 16, 32);
      body += text(240, 38, visual.askMissing ? `Total Collected: ${visual.total} badges` : 'Space Book Log', { size: 18 });
      const rows = [
        { name: visual.n1, info: `${visual.c1}`, fill: GREEN },
        { name: visual.n2, info: `${visual.more} more than ${visual.n1}`, fill: ORANGE },
        { name: visual.n3, info: visual.askMissing ? '? (the rest)' : `${visual.c3}`, fill: GOLD },
      ];
      rows.forEach((row, i) => {
        const y = 74 + i * 44;
        body += line(24, y - 16, 436, y - 16, { stroke: MUTED, width: 1.5 });
        body += text(82, y + 10, row.name, { size: 18 });
        body += rect(150, y - 10, 270, 32, { fill: row.fill, rx: 6 });
        body += text(285, y + 12, row.info, { size: 17, fill: row.fill === GREEN ? PAPER : INK });
      });
      return svg(body, visual.description, 460, 220);
    }

    default:
      throw new Error(`Unsupported class-2 diagram: ${visual.kind}`);
  }
}
