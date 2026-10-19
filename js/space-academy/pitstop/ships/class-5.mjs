// Class 5 - Wedge Flagship: layered armour wedge, bridge tower, turrets, dish, hangar bay, engine row.
const INK = '#2b2b2b';
const PAINT = 'var(--paint,#fffdf8)';
const GREY = '#d9d6cf';
const MID = '#8a8780';
const NIGHT = '#2f3650';
const NIGHT2 = '#3b4468';
const GOLD = '#f5b82e';
const GOLD_SOFT = '#fde9a8';
const BLUE = '#4a8fe0';
const BLUE_SOFT = '#d3e6fb';
const CREAM = '#efe6d2';
const RED = '#d9534f';
const GREEN = '#3aa56b';

const f = n => +n.toFixed(1);
const pts = a => a.map(p => `${f(p[0])},${f(p[1])}`).join(' ');
const poly = (a, fill, sw = 3) => `<polygon points="${pts(a)}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line = (x1, y1, x2, y2, sw = 1.6, c = INK, op = 1) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}"/>`;
const circ = (x, y, r, fill, sw = 3) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const rect = (x, y, w, h, fill, sw = 3, r = 2) => `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const rivet = (x, y) => circ(x, y, 1.6, MID, 1);
const light = (x, y, c, r = 3) => circ(x, y, r, c, 1.5);

// Half-width of the wedge hull at height y (apex at 150,40).
const hw = y => 0.4 * (y - 40);
const L = (y, k = 1, inset = 0) => 150 - (hw(y) * k - inset);
const R = (y, k = 1, inset = 0) => 150 + (hw(y) * k - inset);
const trap = (yt, yb, inset = 0) => [[L(yt, 1, inset), yt], [R(yt, 1, inset), yt], [R(yb, 1, inset), yb], [L(yb, 1, inset), yb]];
const sideBand = (yt, yb, k1, k2, fill, side) => {
  const s = side;
  return poly([[150 + s * hw(yt) * k1, yt], [150 + s * hw(yt) * k2, yt], [150 + s * hw(yb) * k2, yb], [150 + s * hw(yb) * k1, yb]], fill, 2);
};

function bow() {
  let s = poly([[150, 40], [R(120), 120], [L(120), 120]], PAINT, 3.5);
  s += poly([[150, 40], [R(60), 60], [L(60), 60]], NIGHT, 3);
  s += line(147, 47, 145, 56, 1.8, '#fff', 0.8);
  s += poly(trap(64, 70, 3), GOLD, 2) + poly(trap(73, 79, 3), GOLD, 2);
  s += poly(trap(83, 90, 9), BLUE_SOFT, 2) + line(L(86.5, 1, 11), 86.5, R(86.5, 1, 11), 86.5, 1.4, BLUE, 1);
  [-1, 1].forEach(m => {
    for (let y = 70; y <= 110; y += 20) s += rivet(150 + m * (hw(y) - 6), y);
    for (let i = 0; i < 4; i++) {
      const y = 96 + i * 5;
      s += line(150 + m * (hw(y) - 9), y, 150 + m * (hw(y) - 4), y + 3, 1.4, INK, 0.45);
    }
    s += line(150 + m * 5, 62, 150 + m * 20, 118, 1.4, INK, 0.35);
  });
  s += light(L(112, 1, 6), 112, RED) + light(R(112, 1, 6), 112, GREEN);
  s += `<path d="M${f(L(117, 1, 1))} 117L${f(R(117, 1, 1))} 117" stroke="${INK}" stroke-width="1.4" opacity=".4" fill="none"/>`;
  return `<g>${s}</g>`;
}

function layer(yt, yb, stripe, lightY) {
  let s = poly(trap(yt, yb), PAINT, 3.5);
  s += sideBand(yt + 8, yb, 0.76, 0.9, stripe, -1) + sideBand(yt + 8, yb, 0.76, 0.9, stripe, 1);
  [-1, 1].forEach(m => {
    s += line(150 + m * hw(yt + 8) * 0.55, yt + 9, 150 + m * hw(yb) * 0.55, yb, 1.5, INK, 0.55);
    s += line(150 + m * hw(yt + 8) * 0.76, yt + 9, 150 + m * hw(yb) * 0.76, yb, 1.5, INK, 0.7);
    for (let i = 0; i < 5; i++) {
      const y = yt + 16 + i * ((yb - yt - 22) / 4);
      s += line(150 + m * hw(y) * 0.93, y, 150 + m * hw(y) * 0.99, y + 3, 1.3, INK, 0.45);
      s += rivet(150 + m * hw(y) * 0.66, y);
    }
    s += line(150 + m * hw(yt + 12) * 0.2, yb - 10, 150 + m * hw(yb - 10) * 0.45, yb - 10, 1.3, INK, 0.35);
  });
  s += poly([[L(yt, 1, -4), yt], [R(yt, 1, -4), yt], [R(yt + 8, 1, -4), yt + 8], [L(yt + 8, 1, -4), yt + 8]], GREY, 2.6);
  for (let i = 0; i < 9; i++) {
    const x = L(yt, 1, -4) + 3 + i * ((R(yt, 1, -4) - L(yt, 1, -4) - 6) / 8);
    s += line(x, yt + 2, x - 1, yt + 6.5, 1.2, INK, 0.4);
  }
  s += light(L(lightY, 1, 4), lightY, RED, 2.8) + light(R(lightY, 1, 4), lightY, GREEN, 2.8);
  return s;
}

function armour() {
  return `<g>${layer(116, 192, GOLD, 183)}${layer(186, 256, BLUE, 247)}${layer(250, 320, GOLD, 311)}</g>`;
}

function turret(x, y, r) {
  const bw = r * 0.3, bh = r * 2.1;
  let s = '';
  [-1, 1].forEach(m => {
    s += rect(x + m * r * 0.34 - bw / 2, y - r * 0.2 - bh, bw, bh, MID, 2, 1);
    s += rect(x + m * r * 0.34 - bw / 2 - 0.8, y - r * 0.2 - bh - 1, bw + 1.6, r * 0.4, GREY, 1.6, 1);
  });
  s += circ(x, y, r, GREY, 2.8);
  s += circ(x, y, r * 0.66, PAINT, 2.2);
  s += line(x - r * 0.3, y - r * 0.15, x + r * 0.2, y - r * 0.35, 1.6, '#fff', 0.9);
  s += line(x - r * 0.2, y + r * 0.25, x + r * 0.35, y + r * 0.25, 1.4, INK, 0.5);
  [-1, 1].forEach(m => { s += light(x + m * r * 0.34, y - r * 0.2 - bh - 3, RED, 1.5); });
  return s;
}

function turrets() {
  let s = '';
  [[96, 226, 12], [204, 226, 12], [66, 292, 12], [234, 292, 12], [120, 144, 7], [180, 144, 7]].forEach(t => { s += turret(...t); });
  return `<g>${s}</g>`;
}

function bridge() {
  let s = '';
  s += poly([[122, 250], [178, 250], [184, 270], [116, 270]], PAINT, 3);
  s += poly([[132, 236], [168, 236], [174, 252], [126, 252]], PAINT, 3);
  s += rect(138, 241, 24, 6, GOLD_SOFT, 1.8, 1.5);
  [144, 150, 156].forEach(x => { s += line(x, 241, x, 247, 1.2, INK, 0.7); });
  s += line(150, 236, 150, 227, 2.2) + line(143, 232, 157, 232, 2) + light(150, 225.5, RED, 2.4);
  s += line(138, 236, 135, 230, 1.8) + circ(135, 229, 1.6, GOLD, 1);
  s += rect(104, 268, 92, 24, PAINT, 3, 3);
  s += line(106, 273, 194, 273, 1.5, INK, 0.5);
  for (let i = 0; i < 8; i++) {
    const x = 114 + i * 10.5;
    s += rect(x, 277, 7, 7, GOLD_SOFT, 1.6, 1.4) + line(x + 1.5, 280.5, x + 5.5, 280.5, 1, GOLD, 1);
  }
  [-1, 1].forEach(m => {
    const dx = 150 + m * 38;
    s += circ(dx, 261, 6.2, BLUE_SOFT, 2.4) + line(dx - 2.5, 258.5, dx - 0.5, 256.8, 1.5, '#fff', 1);
    s += rivet(150 + m * 62, 270) + rivet(150 + m * 62, 289);
    s += line(150 + m * 30, 287, 150 + m * 38, 287, 1.2, INK, 0.45);
  });
  s += poly([[132, 292], [168, 292], [166, 297], [134, 297]], MID, 2);
  s += line(110, 288, 118, 288, 1.3, INK, 0.45) + line(182, 288, 190, 288, 1.3, INK, 0.45);
  s += line(126, 253, 174, 253, 1.4, INK, 0.45);
  s += light(111, 270.5, RED, 1.8) + light(189, 270.5, GREEN, 1.8);
  return `<g>${s}</g>`;
}

function dish() {
  const cx = 150, cy = 158;
  let s = '';
  s += `<path d="M${cx - 21} 143A24 24 0 0 1 ${cx + 21} 143" fill="none" stroke="${BLUE}" stroke-width="2.6" stroke-linecap="round"/>`;
  s += `<path d="M${cx - 28} 139A32 32 0 0 1 ${cx + 28} 139" fill="none" stroke="${BLUE}" stroke-width="2.6" stroke-linecap="round" opacity=".6"/>`;
  s += poly([[132, 187], [168, 187], [164, 178], [136, 178]], GREY, 2.8);
  s += rect(143, 170, 14, 11, MID, 2.6, 2);
  s += line(136, 183, 124, 172, 2.2) + circ(123, 171, 2, GOLD, 1.2) + line(164, 183, 176, 172, 2.2) + circ(177, 171, 2, GOLD, 1.2);
  s += circ(cx, cy, 18, CREAM, 3);
  s += `<circle cx="${cx}" cy="${cy}" r="12.5" fill="none" stroke="${INK}" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="7" fill="${GREY}" stroke="${INK}" stroke-width="1.4"/>`;
  [-90, 30, 150].forEach(a => {
    const r = a * Math.PI / 180;
    s += line(cx + 7 * Math.cos(r), cy + 7 * Math.sin(r), cx + 18 * Math.cos(r), cy + 18 * Math.sin(r), 1.6);
  });
  s += circ(cx, cy, 3.8, GOLD, 2) + line(cx - 1.4, cy - 1.4, cx + 0.2, cy - 2.4, 1, '#fff', 1);
  s += `<path d="M${cx - 15} ${cy - 6}A16 16 0 0 1 ${cx - 6} ${cy - 15}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".95"/>`;
  for (let i = 0; i < 3; i++) s += line(cx + 10 + i * 2, cy + 13 - i * 2.5, cx + 14 + i * 2, cy + 10 - i * 2.5, 1.3, INK, 0.45);
  s += light(cx, 187, RED, 2);
  return `<g>${s}</g>`;
}

function hangar() {
  let s = poly([[113, 192], [187, 192], [193, 227], [107, 227]], GREY, 3);
  s += poly([[121, 198], [179, 198], [183, 219], [117, 219]], NIGHT, 2.4);
  s += poly([[121, 198], [179, 198], [180, 202], [120, 202]], GOLD_SOFT, 1);
  s += poly([[121, 202], [179, 202], [181, 210], [119, 210]], NIGHT2, 0);
  s += poly([[150, 204], [158, 215], [150, 213], [142, 215]], MID, 1.6) + light(150, 209, BLUE, 1.5);
  s += line(131, 207, 139, 211, 1.4, GOLD_SOFT, 0.8) + line(169, 207, 161, 211, 1.4, GOLD_SOFT, 0.8);
  for (let i = 0; i < 6; i++) s += circ(127 + i * 9.2, 216.5, 1.4, GOLD, 0.8);
  s += `<path d="M122 200L178 200" stroke="${BLUE}" stroke-width="1.8" stroke-dasharray="3 3" fill="none" opacity=".9"/>`;
  s += poly([[110.5, 220], [189.5, 220], [191.5, 227], [108.5, 227]], GOLD, 2);
  for (let x = 114; x < 188; x += 10) s += `<polygon points="${pts([[x, 220], [x + 5, 220], [x + 3.5, 227], [x - 1.5, 227]])}" fill="${INK}"/>`;
  s += light(115, 205, RED, 2.2) + light(185, 205, RED, 2.2);
  s += line(116, 196, 126, 196, 1.4, '#fff', 0.8);
  return `<g>${s}</g>`;
}

const NOZZLES = [62, 106, 150, 194, 238];

function engineRow() {
  const xl = y => 38 + 6 * (y - 316) / 32, xr = y => 300 - xl(y);
  let s = '';
  NOZZLES.forEach((cx, i) => {
    const c = i === 2 ? 1.2 : 1;
    s += rect(cx - 14 * c, 345, 28 * c, 7, MID, 2.6, 2);
    s += poly([[cx - 13 * c, 352], [cx + 13 * c, 352], [cx + 17 * c, 368], [cx - 17 * c, 368]], GREY, 3);
    s += line(cx - 6 * c, 354, cx - 8 * c, 366, 1.3, INK, 0.45) + line(cx + 6 * c, 354, cx + 8 * c, 366, 1.3, INK, 0.45);
    s += rect(cx - 18 * c, 366, 36 * c, 5, MID, 2.4, 2);
    s += `<ellipse cx="${cx}" cy="373" rx="${15 * c}" ry="4.6" fill="${GOLD}" stroke="${INK}" stroke-width="2.4"/>`;
    s += `<ellipse cx="${cx}" cy="373" rx="${8.5 * c}" ry="2.6" fill="#fffdf8" stroke="${INK}" stroke-width="1.2"/>`;
    if (i === 2) s += `<ellipse cx="${cx}" cy="373" rx="3.5" ry="1.2" fill="${BLUE}"/>`;
  });
  s += poly([[xl(316), 316], [xr(316), 316], [xr(348), 348], [xl(348), 348]], PAINT, 3.5);
  s += poly([[xl(318.5), 318.5], [xr(318.5), 318.5], [xr(323.5), 323.5], [xl(323.5), 323.5]], GOLD, 2);
  [84, 128, 172, 216].forEach(x => { s += line(x, 324, x, 348, 1.8, INK, 0.75); });
  [-1, 1].forEach(m => {
    for (let k = 0; k < 4; k++) s += line(150 + m * (96 - 0) - 17, 328 + k * 5, 150 + m * 96 + 17, 328 + k * 5, 1.5, INK, 0.5);
    for (let k = 0; k < 3; k++) s += line(150 + m * 62 - 9, 328 + k * 6, 150 + m * 62 + 9, 328 + k * 6 - 1, 1.3, INK, 0.35);
    s += rivet(150 + m * 20, 343) + rivet(150 + m * 108, 343) + rivet(150 + m * 108, 328);
    s += light(150 + m * 55, 344, m < 0 ? RED : GREEN, 1.8);
    s += line(150 + m * 78, 345, 150 + m * 84, 342, 1.3, INK, 0.45);
  });
  s += line(46, 346, 254, 346, 1.4, INK, 0.5);
  return `<g>${s}</g>`;
}

function tongue(cx, len, w) {
  const y = 374;
  return `<path d="M${cx - w} ${y}C${cx - w - 3} ${y + len * 0.4} ${cx - w * 0.4} ${y + len * 0.6} ${cx} ${y + len}C${cx + w * 0.4} ${y + len * 0.6} ${cx + w + 3} ${y + len * 0.4} ${cx + w} ${y}Z" fill="${GOLD}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<path d="M${cx - w * 0.55} ${y + 2}C${cx - w * 0.6} ${y + len * 0.3} ${cx - 2} ${y + len * 0.45} ${cx} ${y + len * 0.62}C${cx + 2} ${y + len * 0.45} ${cx + w * 0.6} ${y + len * 0.3} ${cx + w * 0.55} ${y + 2}Z" fill="#fffdf8" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
}

const flame = `<g>${NOZZLES.map((x, i) => tongue(x, i === 2 ? 42 : 30, i === 2 ? 13 : 10)).join('')}</g>`;

function base() {
  let s = rect(4, 400, 292, 10, GREY, 3, 3);
  [[12, -1], [272, 1]].forEach(([x, m]) => {
    s += rect(x, 238, 16, 162, GREY, 3, 2);
    for (let y = 252; y < 390; y += 34) s += line(x, y, x + 16, y + 30, 1.6, INK, 0.55) + line(x + 16, y, x, y + 30, 1.6, INK, 0.55);
    s += rect(x - 4, 394, 24, 7, MID, 2.6, 2);
    s += rect(m < 0 ? x + 16 : 258, 336, m < 0 ? 24 : 14, 8, MID, 2.6, 2);
    s += light(x + 8, 244, m < 0 ? RED : GREEN, 3.4);
    s += rivet(x + 8, 226 + 14);
  });
  return `<g>${s}</g>`;
}

export default {
  id: 'class-5',
  name: 'Wedge Flagship',
  viewBox: '0 0 300 420',
  base: base(),
  parts: [
    { id: 'bow', svg: bow(), from: { dx: 0, dy: -150 }, joints: [{ x: 118, y: 120 }, { x: 150, y: 120 }, { x: 182, y: 120 }] },
    { id: 'armour', svg: armour(), from: { dx: 0, dy: 150 }, joints: [{ x: 150, y: 118 }, { x: 100, y: 190 }, { x: 200, y: 190 }, { x: 150, y: 252 }] },
    { id: 'turrets', svg: turrets(), from: { dx: -160, dy: -80 }, joints: [{ x: 96, y: 226 }, { x: 204, y: 226 }, { x: 66, y: 292 }, { x: 234, y: 292 }] },
    { id: 'bridge', svg: bridge(), from: { dx: 0, dy: -140 }, joints: [{ x: 112, y: 270 }, { x: 188, y: 270 }, { x: 150, y: 252 }] },
    { id: 'dish', svg: dish(), from: { dx: 0, dy: -170 }, joints: [{ x: 150, y: 178 }, { x: 134, y: 184 }, { x: 166, y: 184 }] },
    { id: 'hangar', svg: hangar(), from: { dx: 170, dy: 10 }, joints: [{ x: 112, y: 226 }, { x: 188, y: 226 }, { x: 150, y: 228 }] },
    { id: 'engine-row', svg: engineRow(), from: { dx: 0, dy: 160 }, joints: [{ x: 50, y: 318 }, { x: 150, y: 318 }, { x: 250, y: 318 }] },
  ],
  stickerSlots: [{ x: 150, y: 105, s: 22 }, { x: 92, y: 271, s: 26 }, { x: 208, y: 271, s: 26 }, { x: 150, y: 332, s: 20 }],
  flame,
};
