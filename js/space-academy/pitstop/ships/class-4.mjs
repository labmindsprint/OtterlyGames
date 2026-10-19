// Class 4 - Hex Interceptor: round pod, two big hex panels, struts, twin guns, glowing engine.
const INK = '#2b2b2b';
const PAINT = 'var(--paint,#fffdf8)';
const GREY = '#d9d6cf';
const MID = '#8a8780';
const NIGHT = '#2f3650';
const GOLD = '#f5b82e';
const GOLD_SOFT = '#fde9a8';
const BLUE_SOFT = '#d3e6fb';
const RED = '#d9534f';
const GREEN = '#3aa56b';

const f = n => +n.toFixed(1);
const pts = a => a.map(p => `${f(p[0])},${f(p[1])}`).join(' ');
const poly = (a, fill, sw = 3) => `<polygon points="${pts(a)}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line = (x1, y1, x2, y2, sw = 1.6, c = INK, op = 1) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}"/>`;
const circ = (x, y, r, fill, sw = 3) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const rect = (x, y, w, h, fill, sw = 3, r = 2) => `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const rivet = (x, y) => circ(x, y, 1.7, MID, 1);
const light = (x, y, c, r = 3.2) => circ(x, y, r, c, 1.6);
const bar = (x1, y1, x2, y2, w, c) => line(x1, y1, x2, y2, w + 3, INK) + line(x1, y1, x2, y2, w, c);
const hex = (cx, cy, rx, ry) => [[cx, cy - ry], [cx + rx, cy - ry / 2], [cx + rx, cy + ry / 2], [cx, cy + ry], [cx - rx, cy + ry / 2], [cx - rx, cy - ry / 2]];
const arc = (cx, cy, r, a1, a2) => {
  const p = a => [cx + r * Math.cos(a * Math.PI / 180), cy - r * Math.sin(a * Math.PI / 180)];
  const [x1, y1] = p(a1), [x2, y2] = p(a2);
  return `M${f(x1)} ${f(y1)}A${r} ${r} 0 0 ${a2 > a1 ? 0 : 1} ${f(x2)} ${f(y2)}`;
};
const arcBar = (cx, cy, r, a1, a2, w, c) => {
  const d = arc(cx, cy, r, a1, a2);
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 3}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
};
const hatchEdge = (c, p1, p2, n, len) => {
  let s = '';
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const x = p1[0] + (p2[0] - p1[0]) * t, y = p1[1] + (p2[1] - p1[1]) * t;
    const dx = c[0] - x, dy = c[1] - y, d = Math.hypot(dx, dy);
    s += line(x + dx / d * 2, y + dy / d * 2, x + dx / d * (2 + len), y + dy / d * (2 + len), 1.4, INK, 0.5);
  }
  return s;
};

const CY = 210;
const PCX = 150, PCY = 204, PR = 38;

function pod() {
  let s = circ(PCX, PCY, PR, PAINT, 3.5);
  s += `<circle cx="${PCX}" cy="${PCY}" r="32" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".75"/>`;
  s += `<path d="${arc(PCX, PCY, 24, -20, -80)}" fill="none" stroke="${INK}" stroke-width="1.4" opacity=".4" stroke-linecap="round"/>`;
  s += arcBar(PCX, PCY, 33, 150, 210, 4, GOLD);
  s += arcBar(PCX, PCY, 33, -30, 30, 4, GOLD);
  [70, 110].forEach(a => { s += rivet(PCX + 35 * Math.cos(a * Math.PI / 180), PCY - 35 * Math.sin(a * Math.PI / 180)); });
  [235, 305].forEach(a => { s += rivet(PCX + 35 * Math.cos(a * Math.PI / 180), PCY - 35 * Math.sin(a * Math.PI / 180)); });
  for (let i = 0; i < 4; i++) s += line(PCX + 12 + i * 3, PCY + 25 - i * 0.6, PCX + 17 + i * 3, PCY + 21, 1.4, INK, 0.5);
  s += line(PCX - 26, PCY + 6, PCX - 31, PCY + 14, 1.4, INK, 0.5) + line(PCX - 22, PCY + 12, PCX - 27, PCY + 20, 1.4, INK, 0.5);
  s += light(PCX - 22, PCY + 28, RED, 2.6) + light(PCX + 22, PCY + 28, GREEN, 2.6);
  s += `<path d="${arc(PCX, PCY, 35, 130, 105)}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>`;
  return `<g>${s}</g>`;
}

function panel(cx, grid) {
  const cy = CY, rx = 35, ry = 106, d = cx < 150 ? 1 : -1;
  const o = hex(cx, cy, rx, ry);
  const gx = rx * 0.78, gy = ry * 0.8;
  const g = hex(cx, cy, gx, gy);
  let s = poly(o, PAINT, 3.5);
  s += poly(hex(cx, cy, rx * 0.9, ry * 0.9), GREY, 1.8);
  s += poly(g, BLUE_SOFT, 2.6);
  if (grid) {
    for (let k = -3; k <= 3; k++) {
      const y = k * gy / 4, w = gx * Math.min(1, (gy - Math.abs(y)) / (gy / 2));
      s += line(cx - w, cy + y, cx + w, cy + y);
    }
    for (let k = -2; k <= 2; k++) {
      const x = k * gx / 3, yt = gy - (gy / 2) * (Math.abs(x) / gx);
      s += line(cx + x, cy - yt, cx + x, cy + yt);
    }
    for (let k = -2; k <= 2; k += 2) for (let j = -2; j <= 2; j += 2) if (k || j) s += line(cx + k * gx / 3 - 3, cy + j * gy / 4 + 3, cx + k * gx / 3 + 3, cy + j * gy / 4 - 3, 1.3, '#4a8fe0', 0.9);
  } else {
    const v = g;
    for (let i = 0; i < 6; i += 2) s += `<polygon points="${pts([[cx, cy], v[i], v[(i + 1) % 6]])}" fill="#a9cdf3" stroke="none"/>`;
    v.forEach(p => { s += line(cx, cy, p[0], p[1]); });
    s += poly(hex(cx, cy, gx * 0.62, gy * 0.62), 'none', 1.6) + poly(hex(cx, cy, gx * 0.34, gy * 0.34), 'none', 1.6);
  }
  s += line(cx - gx * 0.62, cy - gy * 0.3, cx - gx * 0.3, cy - gy * 0.62, 3, '#fff', 0.9);
  s += line(cx - gx * 0.62, cy - gy * 0.14, cx - gx * 0.46, cy - gy * 0.34, 3, '#fff', 0.9);
  s += circ(cx, cy, 19, PAINT, 3) + `<circle cx="${cx}" cy="${cy}" r="13.5" fill="none" stroke="${INK}" stroke-width="1.5" opacity=".7"/>`;
  [0, 90, 180, 270].forEach(a => { s += rivet(cx + 16.3 * Math.cos(a * Math.PI / 180), cy + 16.3 * Math.sin(a * Math.PI / 180)); });
  const outer = cx - d * rx * 0.945;
  s += bar(outer, cy - ry * 0.34, outer, cy + ry * 0.34, 3.4, GOLD);
  const rv = hex(cx, cy, rx * 0.95, ry * 0.95);
  [1, 2, 4, 5].forEach(i => { s += rivet(rv[i][0], rv[i][1]); });
  s += light(cx, cy - ry + 6.5, d > 0 ? RED : GREEN) + light(cx, cy + ry - 6.5, GOLD);
  s += hatchEdge([cx, cy], [cx + rx, cy + ry / 2], [cx, cy + ry], 3, 6);
  return `<g>${s}</g>`;
}

function windowSvg() {
  const cx = 150, cy = 192;
  const o = hex(cx, cy, 22, 24), i = hex(cx, cy, 17, 19);
  let s = poly(o, NIGHT, 3) + poly(i, BLUE_SOFT, 2);
  s += circ(cx, cy + 6, 7, '#b9855a', 1.8);
  s += circ(cx - 5.5, cy - 0.5, 2.6, '#b9855a', 1.5) + circ(cx + 5.5, cy - 0.5, 2.6, '#b9855a', 1.5);
  s += `<ellipse cx="${cx}" cy="${cy + 9}" rx="4" ry="3" fill="#efe6d2" stroke="${INK}" stroke-width="1"/>`;
  s += circ(cx - 2.6, cy + 5, 1, INK, 0) + circ(cx + 2.6, cy + 5, 1, INK, 0) + circ(cx, cy + 8, 1.2, INK, 0);
  [0, 2, 4].forEach(k => { s += line(cx, cy, i[k][0], i[k][1], 2.2); });
  [0, 2, 4].forEach(k => { s += line(i[k][0], i[k][1], o[k][0], o[k][1], 2.2); });
  s += line(cx - 14, cy - 5, cx - 8, cy - 14, 3, '#fff', 0.95) + line(cx - 14, cy + 1, cx - 11, cy - 4, 3, '#fff', 0.95);
  o.forEach((p, k) => { if (k % 2 === 1) s += rivet(p[0] + (cx - p[0]) * 0.1, p[1] + (cy - p[1]) * 0.1); });
  s += light(cx - 24, cy - 26, GOLD, 2.6) + light(cx + 24, cy - 26, GOLD, 2.6);
  return `<g>${s}</g>`;
}

function strutSide(m) {
  const X = x => (m < 0 ? x : 300 - x);
  const poly4 = a => a.map(p => [X(p[0]), p[1]]);
  let s = '';
  s += line(X(127), 181, X(100), 170, 9, INK) + line(X(127), 181, X(100), 170, 5.5, GREY);
  s += line(X(127), 223, X(100), 234, 9, INK) + line(X(127), 223, X(100), 234, 5.5, GREY);
  s += rect(Math.min(X(98), X(120)), 192, 22, 20, GREY, 3, 3);
  s += rect(Math.min(X(102), X(107)), 188, 5, 28, MID, 2.4, 1.5) + rect(Math.min(X(111), X(116)), 188, 5, 28, MID, 2.4, 1.5);
  s += line(X(110), 197, X(110), 207, 1.4, INK, 0.5);
  s += rivet(X(103.5), 222) + rivet(X(103.5), 182) + rivet(X(113.5), 182) + rivet(X(113.5), 222);
  s += light(X(125), 181, m < 0 ? RED : GREEN, 2.4) + light(X(125), 223, GOLD, 2.4);
  return s;
}

function struts() { return `<g>${strutSide(-1)}${strutSide(1)}</g>`; }

function guns() {
  let s = poly([[128, 174], [133, 156], [167, 156], [172, 174]], GREY, 3);
  s += line(138, 163, 162, 163, 1.4, INK, 0.5) + line(135, 169, 165, 169, 1.4, INK, 0.5);
  [138, 162].forEach(x => {
    s += rect(x - 5.5, 108, 11, 54, GREY, 3, 2);
    s += rect(x - 8, 98, 16, 13, MID, 3, 3);
    s += line(x - 5, 103, x + 5, 103, 1.6, '#fff', 0.7);
    s += bar(x - 5.5, 126, x + 5.5, 126, 3.2, GOLD) + bar(x - 5.5, 142, x + 5.5, 142, 3.2, GOLD);
    s += line(x - 3, 114, x - 3, 120, 1.4, INK, 0.5) + line(x + 3, 130, x + 3, 138, 1.4, INK, 0.5) + line(x - 3, 147, x - 3, 155, 1.4, INK, 0.5);
    s += light(x, 93, RED, 3) + `<line x1="${x}" y1="86" x2="${x}" y2="81" stroke="${RED}" stroke-width="2.4" stroke-linecap="round"/>`;
    s += rivet(x - 3.5, 158) + rivet(x + 3.5, 158);
  });
  s += poly([[150, 140], [155, 158], [145, 158]], MID, 2.6);
  s += light(150, 150, GOLD, 2.2);
  s += light(132, 168, RED, 2.2) + light(168, 168, GREEN, 2.2);
  return `<g>${s}</g>`;
}

function engine() {
  let s = '';
  [-1, 1].forEach(m => {
    const X = x => 150 + m * (x - 150);
    s += poly([[X(128), 250], [X(110), 284], [X(126), 276]], GREY, 3);
    s += bar(X(124), 262, X(116), 277, 2.6, GOLD);
  });
  s += poly([[132, 234], [168, 234], [173, 264], [127, 264]], PAINT, 3);
  [-1, 1].forEach(m => {
    const X = x => 150 + m * (x - 150);
    s += line(X(134), 246, X(139), 246, 1.5, INK, 0.6) + line(X(133), 254, X(139), 254, 1.5, INK, 0.6);
    s += rivet(X(135), 240) + rivet(X(131), 259);
  });
  s += poly([[127, 264], [173, 264], [184, 289], [116, 289]], GREY, 3);
  s += line(131, 270, 126, 284, 1.4, INK, 0.5) + line(169, 270, 174, 284, 1.4, INK, 0.5) + line(150, 266, 150, 285, 1.4, INK, 0.35);
  s += rect(114, 286, 72, 7, MID, 3, 3);
  s += `<ellipse cx="150" cy="295" rx="26" ry="6.5" fill="${GOLD}" stroke="${INK}" stroke-width="2.5"/>`;
  s += `<ellipse cx="150" cy="295" rx="15" ry="3.8" fill="#fffdf8" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<ellipse cx="150" cy="295" rx="6" ry="2" fill="#4a8fe0"/>`;
  s += light(122, 289, RED, 2.2) + light(178, 289, GREEN, 2.2);
  return `<g>${s}</g>`;
}

const flame = `<g>
<path d="M122 294C118 326 138 350 150 396C162 350 182 326 178 294Z" fill="${GOLD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<path d="M132 296C130 320 142 336 150 366C158 336 170 320 168 296Z" fill="${GOLD_SOFT}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<path d="M142 298C142 314 147 324 150 340C153 324 158 314 158 298Z" fill="#fffdf8" stroke="#4a8fe0" stroke-width="2" stroke-linejoin="round"/>
<path d="M112 300C106 316 110 330 114 344" fill="none" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
<path d="M188 300C194 316 190 330 186 344" fill="none" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
</g>`;

function base() {
  let s = `<ellipse cx="150" cy="402" rx="132" ry="8" fill="${GREY}" stroke="${INK}" stroke-width="2.4"/>`;
  [66, 234].forEach(x => {
    s += rect(x - 6, 314, 12, 82, GREY, 3, 2);
    s += line(x - 6, 330, x + 6, 348, 1.6, INK, 0.6) + line(x + 6, 330, x - 6, 348, 1.6, INK, 0.6);
    s += line(x - 6, 356, x + 6, 374, 1.6, INK, 0.6) + line(x + 6, 356, x - 6, 374, 1.6, INK, 0.6);
    s += rect(x - 17, 392, 34, 9, MID, 3, 2);
    s += bar(x - 6, 379, x + 6, 379, 3, GOLD);
  });
  return `<g>${s}</g>`;
}

export default {
  id: 'class-4',
  name: 'Hex Interceptor',
  viewBox: '0 0 300 420',
  base: base(),
  parts: [
    { id: 'pod', svg: pod(), from: { dx: 0, dy: -150 }, joints: [{ x: 120, y: 202 }, { x: 180, y: 202 }, { x: 150, y: 168 }, { x: 150, y: 236 }] },
    { id: 'left-panel', svg: panel(66, false), from: { dx: -170, dy: -20 }, joints: [{ x: 100, y: 170 }, { x: 100, y: 202 }, { x: 100, y: 234 }] },
    { id: 'right-panel', svg: panel(234, true), from: { dx: 170, dy: -20 }, joints: [{ x: 200, y: 170 }, { x: 200, y: 202 }, { x: 200, y: 234 }] },
    { id: 'window', svg: windowSvg(), from: { dx: 0, dy: -120 }, joints: [{ x: 128, y: 178 }, { x: 172, y: 178 }, { x: 150, y: 214 }] },
    { id: 'struts', svg: struts(), from: { dx: 0, dy: 150 }, joints: [{ x: 100, y: 202 }, { x: 200, y: 202 }, { x: 127, y: 181 }, { x: 173, y: 223 }] },
    { id: 'guns', svg: guns(), from: { dx: 0, dy: -170 }, joints: [{ x: 138, y: 160 }, { x: 162, y: 160 }, { x: 150, y: 172 }] },
    { id: 'engine', svg: engine(), from: { dx: 0, dy: 160 }, joints: [{ x: 132, y: 236 }, { x: 168, y: 236 }, { x: 150, y: 264 }] },
  ],
  stickerSlots: [{ x: 66, y: 210, s: 34 }, { x: 234, y: 210, s: 34 }, { x: 150, y: 228, s: 22 }, { x: 150, y: 251, s: 20 }],
  flame,
};
