// Pit Stop sky objects: comic-ink drawings in a 0..60 box (centre 30,30) with a name and a true kid-sized fact.
// Early skies (Home Sky, Rocky Planets) use the simplest words. Pure string builders: no DOM, no ids.

export const SKY_ART_VERSION = 1;

const INK = '#2b2b2b';
const MID = '#8a8780';
const GREY = '#d9d6cf';
const PAPER = '#fffdf8';
const NIGHT = '#2f3650';
const NIGHT2 = '#3b4468';
const GOLD = '#f5b82e';
const GOLD_SOFT = '#fde9a8';
const GOLD_DARK = '#d99a1c';
const BLUE = '#4a8fe0';
const BLUE_SOFT = '#d3e6fb';
const BAD = '#d9534f';
const BAD_SOFT = '#fbdcda';
const GOOD = '#3aa56b';
const GOOD_SOFT = '#d6f2e2';
const CREAM = '#efe6d2';
const ROCK = '#d9cdb8';
const ROCK_DARK = '#b7a98f';

const r1 = n => Math.round(n * 10) / 10;
const st = (o = {}) => (o.sw === 0 ? '' : ` stroke="${o.stroke ?? INK}" stroke-width="${o.sw ?? 2.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}`) + (o.op != null ? ` opacity="${o.op}"` : '');
const circ = (x, y, r, fill = 'none', o) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${fill}"${st(o)}/>`;
const ell = (x, y, rx, ry, fill = 'none', o = {}) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}"${o.rot ? ` transform="rotate(${o.rot} ${r1(x)} ${r1(y)})"` : ''}${st(o)}/>`;
const pth = (d, fill = 'none', o) => `<path d="${d}" fill="${fill}"${st(o)}/>`;
const poly = (pts, fill = 'none', o) => pth('M' + pts.map(p => `${r1(p[0])} ${r1(p[1])}`).join('L') + 'Z', fill, o);
const hat = (d, color = MID, sw = 1.6) => pth(d, 'none', { stroke: color, sw });
const rot = (inner, deg, x = 30, y = 30) => `<g transform="rotate(${deg} ${x} ${y})">${inner}</g>`;
const wrap = (...parts) => `<g stroke-linejoin="round" stroke-linecap="round">${parts.join('')}</g>`;

const burst = (cx, cy, R, r, n, fill, o = {}, start = -90, jitter = null) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (start + i * 180 / n) * Math.PI / 180;
    let rr = i % 2 ? r : R;
    if (jitter && !(i % 2)) rr *= jitter[(i / 2) % jitter.length];
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return poly(pts, fill, o);
};
const sparkle = (x, y, s, fill = PAPER, o = { sw: 1.6 }) => {
  const k = s * 0.3;
  return poly([[x, y - s], [x + k, y - k], [x + s, y], [x + k, y + k], [x, y + s], [x - k, y + k], [x - s, y], [x - k, y - k]], fill, o);
};
const dot = (x, y, r = 1, fill = INK) => circ(x, y, r, fill, { sw: 0 });
// Horizontal slice of a circle between y1 and y2 (no clip paths needed).
const band = (cx, cy, R, y1, y2, fill, o = {}) => {
  const w = y => Math.sqrt(Math.max(0, R * R - (y - cy) ** 2));
  const a = w(y1), b = w(y2);
  return pth(`M${r1(cx - a)} ${r1(y1)}L${r1(cx + a)} ${r1(y1)}A${R} ${R} 0 0 1 ${r1(cx + b)} ${r1(y2)}L${r1(cx - b)} ${r1(y2)}A${R} ${R} 0 0 1 ${r1(cx - a)} ${r1(y1)}Z`, fill, { sw: 0, ...o });
};
const crater = (x, y, rx, ry = rx, fill = 'none', stroke = MID) => ell(x, y, rx, ry, fill, { stroke, sw: 1.8 });

// Crescent moon = big circle minus an offset circle.
const crescent = (ax, ay, ra, bx, by, rb) => {
  const d = Math.hypot(bx - ax, by - ay);
  const a = (ra * ra - rb * rb + d * d) / (2 * d);
  const h = Math.sqrt(ra * ra - a * a);
  const px = ax + a * (bx - ax) / d, py = ay + a * (by - ay) / d;
  const ox = -(by - ay) / d * h, oy = (bx - ax) / d * h;
  const p1 = [px + ox, py + oy], p2 = [px - ox, py - oy];
  return `M${r1(p1[0])} ${r1(p1[1])}A${ra} ${ra} 0 1 1 ${r1(p2[0])} ${r1(p2[1])}A${rb} ${rb} 0 0 0 ${r1(p1[0])} ${r1(p1[1])}Z`;
};

const meteor = (hx, hy, len, r, fill = GOLD_SOFT, head = GOLD) => {
  const dx = -0.7071, dy = 0.7071, nx = 0.7071, ny = 0.7071;
  const tip = [hx + dx * len, hy + dy * len];
  return poly([[hx + nx * r, hy + ny * r], tip, [hx - nx * r, hy - ny * r]], fill, { sw: 2.2 }) +
    hat(`M${r1(hx + dx * len * 0.25)} ${r1(hy + dy * len * 0.25)}L${r1(hx + dx * len * 0.7)} ${r1(hy + dy * len * 0.7)}`, PAPER, 1.4) +
    circ(hx, hy, r, head, { sw: 2.4 });
};

const spiralArm = k => {
  const a = [], b = [], N = 20;
  for (let i = 0; i <= N; i++) {
    const t = i / N,     ang = k * Math.PI + t * 4.2, rad = 5 + 22 * t, w = 4.8 * (1 - t) + 0.8;
    const cx = 30 + rad * Math.cos(ang), cy = 30 + rad * Math.sin(ang);
        let dx = 22 * Math.cos(ang) - rad * 4.2 * Math.sin(ang), dy = 22 * Math.sin(ang) + rad * 4.2 * Math.cos(ang);
    const l = Math.hypot(dx, dy); dx /= l; dy /= l;
    a.push([cx - dy * w, cy + dx * w]); b.push([cx + dy * w, cy - dx * w]);
  }
  return [...a, ...b.reverse()];
};

const potato = (d, fill, extra = '') => pth(d, fill, { sw: 2.8 }) + extra;

export const SKY = {
  sun: {
    name: 'The Sun',
    fact: 'The Sun is a star. It gives us light and warmth every day.',
    svg: wrap(
      burst(30, 30, 28, 20.5, 12, GOLD_SOFT, { sw: 2.6 }),
      circ(30, 30, 16, GOLD),
      pth('M38 41A13 13 0 0 0 43 29', 'none', { stroke: GOLD_DARK, sw: 2.2 }),
      hat('M39 37q2-2 3-6', GOLD_DARK, 1.6),
      pth('M21 25A10 10 0 0 1 29 19', 'none', { stroke: PAPER, sw: 2.4 }),
    ),
  },
  moon: {
    name: 'The Moon',
    fact: 'The Moon goes around Earth. It shines because the Sun lights it up.',
    svg: wrap(
      pth(crescent(28, 30, 22, 41, 24, 18.5), GOLD_SOFT, { sw: 2.8 }),
      crater(17, 31, 2.8, 3.4, '#f0d98a'),
      crater(22, 43, 3.2, 2.6, '#f0d98a'),
      crater(23, 17, 2, 2, '#f0d98a'),
      hat('M12 24q-1 4 0 8', GOLD_DARK, 1.5),
      sparkle(46, 46, 4.5, GOLD, { sw: 1.6 }),
      sparkle(49, 14, 3, GOLD, { sw: 1.4 }),
    ),
  },
  earth: {
    name: 'Earth',
    fact: 'Earth is our home planet. It has oceans, land and air to breathe.',
    svg: wrap(
      circ(30, 30, 22, BLUE),
      pth('M15 23q3-8 11-8q5 3 1 8q-4 3-3 8q-1 6-6 4q-5-4-3-12z', GOOD, { sw: 2.2 }),
      pth('M34 30q8-3 11 3q1 8-6 11q-6 1-6-5q1-5 1-9z', GOOD, { sw: 2.2 }),
      pth('M40 14q5 2 6 6q-5 0-6-6z', GOOD, { sw: 2 }),
      pth('M24 12q6-3 12-1', 'none', { stroke: PAPER, sw: 2.4 }),
      pth('M12 36q5-3 10 0', 'none', { stroke: PAPER, sw: 2.4 }),
      pth('M26 48q5 2 11-1', 'none', { stroke: PAPER, sw: 2.4 }),
      pth('M20 17A14 14 0 0 0 15 28', 'none', { stroke: BLUE_SOFT, sw: 2 }),
      circ(30, 30, 22, 'none'),
    ),
  },
  comet: {
    name: 'Comet',
    fact: 'A comet is a ball of ice and dust. Near the Sun it grows a tail.',
    svg: wrap(
      poly([[34, 14], [4, 56], [47, 30]], BLUE_SOFT, { sw: 2.6 }),
      hat('M30 24L12 49', PAPER, 2),
      hat('M37 29L19 52', PAPER, 2),
      hat('M33 20L22 33', BLUE, 1.5),
      circ(40, 22, 12, CREAM),
      crater(36, 19, 3, 2.6, ROCK),
      crater(44, 27, 2.4, 2.4, ROCK),
      pth('M33 28A9 9 0 0 0 44 31', 'none', { stroke: ROCK_DARK, sw: 1.8 }),
      sparkle(51, 9, 3.5, GOLD, { sw: 1.4 }),
    ),
  },
  star: {
    name: 'A Star',
    fact: 'Stars are huge balls of hot gas. They look tiny because they are far away.',
    svg: wrap(
      burst(30, 31, 25, 11, 5, GOLD, { sw: 2.8 }),
      ...[0, 1, 2, 3, 4].map(i => {
        const a = (-90 + 36 + i * 72) * Math.PI / 180;
        return hat(`M30 31L${r1(30 + Math.cos(a) * 11)} ${r1(31 + Math.sin(a) * 11)}`, GOLD_DARK, 1.5);
      }),
      hat('M24 25L28 14', PAPER, 2.2),
      sparkle(51, 12, 4, GOLD_SOFT, { sw: 1.5 }),
      sparkle(9, 46, 3.2, GOLD_SOFT, { sw: 1.4 }),
    ),
  },
  'milky-way': {
    name: 'The Milky Way',
    fact: 'The Milky Way is a huge group of stars. Our Sun is one of them.',
    svg: wrap(
      rot(ell(30, 30, 28, 11, BLUE_SOFT, { sw: 2.8 }), -28),
      rot(ell(30, 30, 21, 6.5, GOLD_SOFT, { sw: 1.8 }), -28),
      rot(ell(30, 30, 9, 8, GOLD, { sw: 2.4 }), -28),
      rot(pth('M10 32Q30 28 50 29', 'none', { stroke: ROCK_DARK, sw: 1.8 }), -28),
      sparkle(14, 14, 4, GOLD, { sw: 1.5 }),
      sparkle(47, 47, 4, GOLD, { sw: 1.5 }),
      sparkle(48, 14, 2.8, GOLD_SOFT, { sw: 1.3 }),
      sparkle(10, 47, 2.8, GOLD_SOFT, { sw: 1.3 }),
      dot(20, 27, 1.3), dot(36, 34, 1.3), dot(41, 25, 1.1), dot(26, 38, 1.1),
    ),
  },
  mercury: {
    name: 'Mercury',
    fact: 'Mercury is the smallest planet. It is the closest planet to the Sun.',
    svg: wrap(
      circ(30, 30, 20, GREY),
      pth('M44 40A20 20 0 0 1 24 49', 'none', { stroke: ROCK_DARK, sw: 2.4 }),
      hat('M43 31q0 6-3 10', MID, 1.6),
      crater(22, 24, 4.5, 4, '#c7c2b8'),
      crater(35, 36, 3.6, 3.2, '#c7c2b8'),
      crater(24, 40, 2.4, 2.4, '#c7c2b8'),
      crater(38, 20, 2.4, 2.4, '#c7c2b8'),
      hat('M18 18A14 14 0 0 1 28 11', PAPER, 2.2),
    ),
  },
  venus: {
    name: 'Venus',
    fact: 'Venus is the hottest planet. Thick clouds trap heat all around it.',
    svg: wrap(
      circ(30, 30, 22, GOLD_SOFT),
      band(30, 30, 22, 14, 21, '#f8d67c'),
      band(30, 30, 22, 33, 41, '#f8d67c'),
      pth('M10 22q8-6 14 0t14 0t12-3', 'none', { stroke: GOLD_DARK, sw: 2.2 }),
      pth('M8 32q9 6 16 0t15 0t13 3', 'none', { stroke: GOLD_DARK, sw: 2.2 }),
      pth('M13 42q8-5 15 0t12-1', 'none', { stroke: GOLD_DARK, sw: 2.2 }),
      pth('M18 14A18 18 0 0 1 28 9', 'none', { stroke: PAPER, sw: 2.4 }),
      circ(30, 30, 22, 'none'),
    ),
  },
  mars: {
    name: 'Mars',
    fact: 'Mars looks red because its dust is rusty. People call it the Red Planet.',
    svg: wrap(
      circ(30, 30, 21, '#ee9c80'),
      pth('M19 15Q30 8 41 15Q30 19 19 15Z', PAPER, { sw: 2 }),
      pth('M33 28q7-2 10 3q-2 6-9 5q-4-3-1-8z', '#c9684f', { sw: 0 }),
      pth('M12 33l9 3l8-2l7 4', 'none', { stroke: '#b8503a', sw: 2.2 }),
      crater(21, 26, 3.6, 3.2, '#e0836a', '#b8503a'),
      crater(38, 43, 3, 2.8, '#e0836a', '#b8503a'),
      crater(27, 44, 2.2, 2, '#e0836a', '#b8503a'),
      pth('M44 40A21 21 0 0 1 24 50', 'none', { stroke: '#c9684f', sw: 2.2 }),
      circ(30, 30, 21, 'none'),
    ),
  },
  phobos: {
    name: 'Phobos',
    fact: 'Phobos is a small, lumpy moon of Mars. It circles Mars about three times a day.',
    svg: wrap(
      potato('M8 31Q6 17 20 13Q34 8 46 14Q56 22 50 36Q44 49 28 50Q10 49 8 31Z', ROCK),
      pth('M44 17Q54 24 49 37Q47 44 38 48', 'none', { stroke: ROCK_DARK, sw: 2 }),
      crater(21, 28, 8, 6.5, '#cdbfa6', INK),
      crater(21, 28, 3, 2.4, ROCK_DARK, ROCK_DARK),
      hat('M30 22q6 1 10 6M33 40q6 1 10-3M12 40q4 4 9 5', ROCK_DARK, 1.6),
      crater(40, 34, 2.4, 2, 'none'),
    ),
  },
  satellite: {
    name: 'Satellite',
    fact: 'A satellite is a machine that circles a planet. Some take pictures of Earth.',
    svg: wrap(rot(
      rect(3, 24.5, 18, 11, BLUE, [2.6]) + hat('M9 24.5V35.5M15 24.5V35.5M3 30H21', BLUE_SOFT, 1.4) +
      rect(39, 24.5, 18, 11, BLUE, [2.6]) + hat('M45 24.5V35.5M51 24.5V35.5M39 30H57', BLUE_SOFT, 1.4) +
      pth('M21 30H24M36 30H39', 'none', { sw: 2.6 }) +
      rect(24, 20, 12, 20, GOLD_SOFT, [2.8]) + hat('M24 27H36M24 33H36', GOLD_DARK, 1.5) +
      pth('M24 20L30 14L36 20', PAPER, { sw: 2.4 }) +
      pth('M30 14V8', 'none', { sw: 2.4 }) + circ(30, 7, 2.4, GOLD, { sw: 2 }) +
      pth('M27 40v4h6v-4', GREY, { sw: 2 }),
      -24)),
  },
  deimos: {
    name: 'Deimos',
    fact: 'Deimos is the smaller of Mars’s two moons. It is a tiny, bumpy rock.',
    svg: wrap(
      potato('M14 30Q13 18 24 15Q36 12 44 19Q50 28 44 38Q36 47 24 45Q14 42 14 30Z', '#e6dac3'),
      pth('M40 18Q47 27 42 38', 'none', { stroke: ROCK_DARK, sw: 1.8 }),
      crater(25, 27, 4.6, 3.6, '#d8cbb2'),
      crater(34, 36, 3.2, 2.8, '#d8cbb2'),
      hat('M20 37q3 3 7 2', ROCK_DARK, 1.5),
      hat('M30 20q4-1 7 1', PAPER, 2),
      sparkle(51, 50, 3, GOLD_SOFT, { sw: 1.3 }),
    ),
  },
  ceres: {
    name: 'Ceres',
    fact: 'Ceres is a dwarf planet. It is the biggest object in the asteroid belt.',
    svg: wrap(
      circ(30, 30, 21, GREY),
      pth('M44 42A21 21 0 0 1 24 51', 'none', { stroke: ROCK_DARK, sw: 2.4 }),
      crater(33, 25, 7, 6, '#c7c2b8'),
      circ(32, 24, 1.9, PAPER, { sw: 1.4 }), circ(35.5, 26.5, 1.4, PAPER, { sw: 1.2 }),
      crater(19, 33, 4, 3.4, '#c7c2b8'),
      crater(30, 42, 3, 2.6, '#c7c2b8'),
      crater(43, 36, 2.2, 2, '#c7c2b8'),
      hat('M16 20A15 15 0 0 1 25 13', PAPER, 2.2),
    ),
  },
  vesta: {
    name: 'Vesta',
    fact: 'Vesta is a giant space rock. It is one of the biggest asteroids.',
    svg: wrap(
      potato('M9 29Q8 16 21 11Q36 8 47 16Q54 26 49 38Q42 50 28 51Q13 50 9 29Z', CREAM),
      ell(34, 42, 13, 5.5, '#e3d3b2', { sw: 2.2 }),
      ell(34, 42, 4, 1.8, ROCK_DARK, { sw: 0 }),
      hat('M12 33Q22 30 34 33M14 24Q25 21 40 23', ROCK_DARK, 1.6),
      crater(18, 41, 2.6, 2.3, '#e3d3b2'),
      crater(40, 20, 2.6, 2.3, '#e3d3b2'),
      hat('M16 17A15 15 0 0 1 26 12', PAPER, 2),
    ),
  },
  'ice-comet': {
    name: 'Ice comet',
    fact: 'Comets are made of ice and dust. Their tails always point away from the Sun.',
    svg: wrap(
      poly([[27, 33], [56, 4], [38, 40]], BLUE_SOFT, { sw: 2.6 }),
      hat('M34 33L50 14', PAPER, 2),
      hat('M31 39L47 23', PAPER, 1.6),
      poly([[8, 38], [14, 25], [26, 22], [36, 31], [34, 45], [20, 50], [10, 47]], '#bcd8f6', { sw: 2.8 }),
      pth('M14 25L22 36L36 31M22 36L20 50M22 36L8 38', 'none', { stroke: BLUE, sw: 1.5 }),
      poly([[14, 25], [26, 22], [22, 36]], BLUE_SOFT, { sw: 0 }),
      sparkle(46, 46, 5, PAPER, { sw: 1.7 }),
      sparkle(8, 12, 3.5, PAPER, { sw: 1.5 }),
      sparkle(52, 24, 2.6, PAPER, { sw: 1.3 }),
    ),
  },
  'twin-rocks': {
    name: 'Twin rocks',
    fact: 'Some asteroids have a little moon. Two space rocks can circle each other.',
    svg: wrap(
      ell(27, 33, 24, 12, 'none', { stroke: MID, sw: 1.8, dash: '3 3.5', rot: -22 }),
      potato('M5 36Q3 22 15 17Q27 14 32 24Q36 36 26 44Q14 50 5 36Z', ROCK),
      crater(16, 29, 4.5, 3.6, '#cdbfa6'),
      crater(22, 40, 2.8, 2.4, '#cdbfa6'),
      hat('M8 28q2-5 6-7', PAPER, 2),
      potato('M42 19Q41 10 50 9Q58 11 56 21Q53 29 46 28Q41 26 42 19Z', CREAM),
      crater(49, 17, 2.4, 2, '#e3d3b2'),
      hat('M44 14q2-3 5-3', PAPER, 1.6),
    ),
  },
  'gold-rock': {
    name: 'Metal rock',
    fact: 'Some asteroids are packed with metal like iron and nickel. People may mine them one day.',
    svg: wrap(
      poly([[8, 35], [13, 17], [29, 9], [48, 18], [52, 35], [41, 50], [20, 50]], GOLD, { sw: 2.8 }),
      poly([[13, 17], [29, 9], [28, 25], [8, 35]], GOLD_SOFT, { sw: 2 }),
      poly([[29, 9], [48, 18], [38, 28], [28, 25]], '#f9d56e', { sw: 2 }),
      poly([[28, 25], [38, 28], [52, 35], [41, 50], [32, 41]], GOLD_DARK, { sw: 2 }),
      poly([[8, 35], [28, 25], [32, 41], [20, 50]], GOLD, { sw: 2 }),
      sparkle(20, 22, 4.2, PAPER, { sw: 1.5 }),
      sparkle(44, 41, 3, PAPER, { sw: 1.3 }),
      sparkle(52, 8, 3.4, GOLD_SOFT, { sw: 1.4 }),
    ),
  },
  'meteor-shower': {
    name: 'Meteor shower',
    fact: 'A meteor shower happens when Earth passes through comet dust. Bits burn up as streaks.',
    svg: wrap(
      meteor(47, 11, 30, 4.6),
      meteor(31, 24, 26, 3.8, BLUE_SOFT, '#9cc4f0'),
      meteor(54, 33, 24, 3.6, BAD_SOFT, '#f2a29d'),
      meteor(21, 17, 12, 2.4, GOLD_SOFT, GOLD),
      meteor(38, 49, 14, 3, GOLD_SOFT, GOLD),
      sparkle(8, 8, 3.2, GOLD_SOFT, { sw: 1.3 }),
      sparkle(10, 40, 2.6, GOLD_SOFT, { sw: 1.2 }),
    ),
  },
  jupiter: {
    name: 'Jupiter',
    fact: 'Jupiter is the biggest planet. Over 1,000 Earths could fit inside it.',
    svg: wrap(
      circ(30, 30, 24, CREAM),
      band(30, 30, 24, 10, 17, '#d9a56e'),
      band(30, 30, 24, 21, 24, '#c98d5c'),
      band(30, 30, 24, 29, 35, '#e3b98a'),
      band(30, 30, 24, 39, 44, '#c98d5c'),
      pth('M8 33q8 3 14 0t14 0t16 2', 'none', { stroke: '#a8703f', sw: 1.7 }),
      pth('M7 19q9-3 16 0t14 0t15-2', 'none', { stroke: '#a8703f', sw: 1.5 }),
      ell(38, 40.5, 6.5, 3.8, '#e0705a', { sw: 2.2 }),
      ell(38, 40.5, 2.8, 1.5, '#b8503a', { sw: 0 }),
      pth('M16 16A18 18 0 0 1 28 8', 'none', { stroke: PAPER, sw: 2.4 }),
      circ(30, 30, 24, 'none', { sw: 2.9 }),
    ),
  },
  saturn: {
    name: 'Saturn',
    fact: 'Saturn’s bright rings are made of countless chunks of ice and rock.',
    svg: wrap(rot(
      pth('M1 30A29 11 0 0 1 59 30L50 30A20 7.5 0 0 0 10 30Z', CREAM, { sw: 2.4 }) +
      circ(30, 30, 15, '#f5d78a', { sw: 2.8 }) +
      pth('M16 25q14-4 28 0M15.5 35q14.5 4 29 0', 'none', { stroke: GOLD_DARK, sw: 1.7 }) +
      pth('M1 30A29 11 0 0 0 59 30L50 30A20 7.5 0 0 1 10 30Z', GOLD_SOFT, { sw: 2.6 }) +
      hat('M9 33Q30 46 51 33', GOLD_DARK, 1.4) +
      pth('M5 30A25 9 0 0 0 55 30', 'none', { stroke: GOLD_DARK, sw: 1.2 }),
      -18)),
  },
  io: {
    name: 'Io',
    fact: 'Io is covered in active volcanoes. It is the most volcanic world we know.',
    svg: wrap(
      circ(28, 36, 19, '#f7dc6a'),
      pth('M42 44A19 19 0 0 1 22 55', 'none', { stroke: GOLD_DARK, sw: 2.2 }),
      circ(20, 38, 3.4, '#6b3b2b', { sw: 2 }), circ(20, 38, 1.4, BAD, { sw: 0 }),
      circ(33, 45, 2.8, '#6b3b2b', { sw: 2 }), circ(33, 45, 1.1, BAD, { sw: 0 }),
      circ(36, 31, 2.4, '#6b3b2b', { sw: 2 }),
      poly([[39.5, 23], [46.5, 23], [53, 7], [33, 7]], GOLD_SOFT, { sw: 2.2 }),
      hat('M43 21V10', GOLD_DARK, 1.6),
      dot(32, 3, 1.5, BAD), dot(54, 3, 1.5, BAD), dot(43, 2.5, 1.3, BAD), dot(37, 4, 1.1, BAD), dot(49, 4, 1.1, BAD),
      hat('M17 26A15 15 0 0 1 26 20', PAPER, 2.2),
    ),
  },
  europa: {
    name: 'Europa',
    fact: 'Scientists think a deep ocean of salty water hides under Europa’s ice.',
    svg: wrap(
      circ(30, 30, 21, '#eaf3fb'),
      pth('M12 24L24 28L30 20L44 24M24 28L22 40L34 44L44 36M30 20L34 10M34 44L38 52M22 40L12 44', 'none', { stroke: '#b5654a', sw: 2 }),
      pth('M44 24L50 30M44 36L49 40M24 28L10 32', 'none', { stroke: '#b5654a', sw: 1.5 }),
      band(30, 30, 21, 40, 51, BLUE_SOFT, { op: 0.6 }),
      pth('M44 42A21 21 0 0 1 24 51', 'none', { stroke: '#a9c3de', sw: 2.2 }),
      pth('M15 18A17 17 0 0 1 26 11', 'none', { stroke: PAPER, sw: 2.2 }),
      circ(30, 30, 21, 'none'),
    ),
  },
  titan: {
    name: 'Titan',
    fact: 'Titan is Saturn’s biggest moon. It has orange haze and lakes made of methane.',
    svg: wrap(
      circ(30, 30, 24, '#fbe3c0', { sw: 2.6 }),
      circ(30, 30, 17.5, '#eab06a', { sw: 2.6 }),
      pth('M18 24q7-4 14 0t10 0', 'none', { stroke: '#d68f46', sw: 2 }),
      pth('M15 34q8 4 16 0t12 0', 'none', { stroke: '#d68f46', sw: 2 }),
      ell(34, 41, 5, 2.4, BLUE, { sw: 1.8 }),
      ell(22, 40, 2.8, 1.5, BLUE, { sw: 1.6 }),
      pth('M12 14A22 22 0 0 1 24 8', 'none', { stroke: PAPER, sw: 2.4 }),
    ),
  },
  ganymede: {
    name: 'Ganymede',
    fact: 'Ganymede is the biggest moon in our solar system. It is wider than Mercury.',
    svg: wrap(
      circ(30, 30, 22, '#d8cfbd'),
      pth('M12 22q5-6 11-3q3 5-2 8q-6 1-9-5z', '#a39a86', { sw: 0 }),
      pth('M36 38q8-5 10 2q-3 6-9 5q-3-3-1-7z', '#a39a86', { sw: 0 }),
      pth('M26 14q8-3 14 2q-6 3-12 1z', '#a39a86', { sw: 0 }),
      hat('M10 36q10-3 17 2M14 41q9-2 15 3M28 24q8-1 14 3M33 29q6 0 11 2', '#8e8571', 1.5),
      crater(24, 36, 3.6, 3.2, PAPER, '#8e8571'),
      hat('M24 29v4M24 39v4M18 36h3M28 36h3', PAPER, 1.4),
      pth('M44 42A22 22 0 0 1 24 52', 'none', { stroke: '#a39a86', sw: 2.2 }),
      circ(30, 30, 22, 'none'),
    ),
  },
  uranus: {
    name: 'Uranus',
    fact: 'Uranus is tipped on its side as it circles the Sun. It looks pale blue-green.',
    svg: wrap(rot(
      pth('M0 30A30 10 0 0 1 60 30L54 30A24 6.5 0 0 0 6 30Z', GREY, { sw: 2 }) +
      circ(30, 30, 15, '#bfeaee', { sw: 2.8 }) +
      pth('M18 25q12-3 24 0', 'none', { stroke: '#8ccdd6', sw: 1.6 }) +
      pth('M17 35q13 3 26 0', 'none', { stroke: '#8ccdd6', sw: 1.6 }) +
      pth('M0 30A30 10 0 0 0 60 30L54 30A24 6.5 0 0 1 6 30Z', GREY, { sw: 2.2 }),
      -72)),
  },
  neptune: {
    name: 'Neptune',
    fact: 'Neptune is a deep blue ice giant. It has the fastest winds of any planet.',
    svg: wrap(
      circ(30, 30, 22, BLUE),
      ell(25, 34, 6.5, 4, '#2f62b0', { sw: 2, rot: -12 }),
      pth('M9 24q8-4 15-1M38 20q8 0 13 4M32 45q8 2 14-3', 'none', { stroke: BLUE_SOFT, sw: 2.2 }),
      pth('M44 40A22 22 0 0 1 24 52', 'none', { stroke: '#2f62b0', sw: 2.4 }),
      pth('M15 17A18 18 0 0 1 27 9', 'none', { stroke: BLUE_SOFT, sw: 2.4 }),
      circ(30, 30, 22, 'none'),
    ),
  },
  pluto: {
    name: 'Pluto',
    fact: 'Pluto is a dwarf planet. It has a big heart-shaped patch of ice.',
    svg: wrap(
      circ(30, 30, 21, '#efdcc4'),
      pth('M14 36q5 6 12 4q-2-6-5-6q-5 0-7 2z', '#b88a6a', { sw: 0 }),
      pth('M24 44q6 3 12 1q-4-2-12-1z', '#b88a6a', { sw: 0 }),
      pth('M34 42C24 34 24 25 31 27Q34 28 34 31Q34 28 38 27C45 25 44 34 34 42Z', PAPER, { sw: 2.2 }),
      pth('M44 40A21 21 0 0 1 24 51', 'none', { stroke: '#cdb596', sw: 2.4 }),
      pth('M16 18A17 17 0 0 1 26 11', 'none', { stroke: PAPER, sw: 2.2 }),
      circ(30, 30, 21, 'none'),
    ),
  },
  triton: {
    name: 'Triton',
    fact: 'Triton is Neptune’s biggest moon. It circles backwards and has icy geysers.',
    svg: wrap(
      circ(30, 36, 18, '#f2e2dc'),
      pth('M22 24l-5 8M36 23l4 6M44 36l-6 5M20 42l7 3', 'none', { stroke: '#a8908a', sw: 1.5 }),
      ...[[22, 31], [30, 33], [38, 34], [26, 39], [34, 41], [42, 38], [18, 37]].map(([x, y]) => circ(x, y, 1.9, '#e3cdc6', { stroke: '#b9a09a', sw: 1.2 })),
      pth('M26 21V11Q26 7 34 7', 'none', { stroke: '#6b5a58', sw: 2.6 }), dot(38, 8, 1.1, '#6b5a58'), dot(41, 6.5, 0.9, '#6b5a58'),
      pth('M40 23V13Q40 9 48 9', 'none', { stroke: '#6b5a58', sw: 2.6 }), dot(52, 10, 1.1, '#6b5a58'), dot(55, 8.5, 0.9, '#6b5a58'),
      pth('M44 46A18 18 0 0 1 25 54', 'none', { stroke: '#d4b8b0', sw: 2.2 }),
      circ(30, 36, 18, 'none'),
    ),
  },
  'kuiper-rock': {
    name: 'Kuiper Belt rock',
    fact: 'Kuiper Belt rocks are frozen leftovers from when the planets were born.',
    svg: wrap(
      poly([[6, 33], [12, 17], [28, 11], [46, 17], [52, 33], [43, 48], [22, 49]], '#cfdcf3', { sw: 2.8 }),
      poly([[12, 17], [28, 11], [26, 26], [6, 33]], BLUE_SOFT, { sw: 1.8 }),
      poly([[26, 26], [46, 17], [52, 33], [38, 36]], '#b6c8e8', { sw: 1.8 }),
      poly([[38, 36], [52, 33], [43, 48], [32, 44]], '#a6b9de', { sw: 1.8 }),
      crater(20, 36, 4, 3.2, '#bccae6', BLUE),
      sparkle(24, 20, 4, PAPER, { sw: 1.4 }),
      sparkle(44, 27, 2.6, PAPER, { sw: 1.2 }),
      dot(5, 9, 1.5), dot(55, 8, 1.3), dot(54, 52, 1.5), dot(6, 52, 1.2), dot(30, 5, 1.1), dot(55, 24, 1.1),
    ),
  },
  charon: {
    name: 'Charon',
    fact: 'Charon is Pluto’s biggest moon. Pluto and Charon circle each other like dance partners.',
    svg: wrap(
      pth('M52 20A28 18 0 0 1 8 44', 'none', { stroke: MID, sw: 1.6, dash: '3 3.5' }),
      circ(46, 15, 9, '#efdcc4', { sw: 2.4 }),
      circ(25, 36, 18, '#d0cbc2'),
      band(25, 36, 18, 18, 24, '#a66c5c', { op: 0.9 }),
      pth('M9 30q6-2 8 1M14 45l8-2l8 3', 'none', { stroke: MID, sw: 1.6 }),
      crater(32, 40, 3.6, 3.2, '#bdb7ac'),
      pth('M40 46A18 18 0 0 1 22 54', 'none', { stroke: ROCK_DARK, sw: 2.2 }),
      circ(25, 36, 18, 'none'),
    ),
  },
  eris: {
    name: 'Eris',
    fact: 'Eris is a dwarf planet nearly as wide as Pluto. It is very cold.',
    svg: wrap(
      ell(30, 32, 27, 10, 'none', { stroke: MID, sw: 1.7, dash: '3 3.5', rot: -22 }),
      circ(28, 33, 19, '#f1efe9'),
      pth('M43 44A19 19 0 0 1 24 52', 'none', { stroke: GREY, sw: 2.6 }),
      pth('M16 24q5-6 12-6', 'none', { stroke: PAPER, sw: 3 }),
      hat('M20 36q6 3 12 0M24 44q5 1 9-1', GREY, 1.5),
      sparkle(37, 26, 3, PAPER, { sw: 1.4 }),
      circ(52, 13, 4, CREAM, { sw: 2.2 }),
      sparkle(8, 10, 2.8, GOLD_SOFT, { sw: 1.3 }),
    ),
  },
  nebula: {
    name: 'Nebula',
    fact: 'A nebula is a huge cloud of gas and dust. New stars are born inside.',
    svg: wrap(
      pth('M6 34Q2 22 12 19Q14 9 25 11Q33 5 40 12Q52 10 52 22Q58 30 50 38Q48 50 36 48Q28 54 20 47Q8 48 6 34Z', '#f7b9c6', { sw: 2.8 }),
      pth('M22 12Q31 9 37 17Q46 15 47 25Q54 30 47 38Q44 46 35 43Q27 48 21 42Q12 40 15 31Q10 22 19 20Q18 14 22 12Z', '#c2c0f1', { sw: 2.2 }),
      pth('M27 20Q36 17 40 26Q47 30 40 36Q35 42 28 38Q20 37 22 30Q18 24 27 20Z', BLUE_SOFT, { sw: 2 }),
      hat('M12 30q4 6 11 5M44 20q4 3 3 8M30 48q5-1 8-5', PAPER, 2),
      sparkle(31, 30, 6, GOLD_SOFT, { sw: 1.8 }),
      sparkle(14, 16, 3.2, GOLD, { sw: 1.3 }),
      sparkle(51, 45, 3.4, GOLD, { sw: 1.3 }),
      dot(40, 15, 1.2), dot(18, 44, 1.2), dot(47, 33, 1.3),
    ),
  },
  pulsar: {
    name: 'Pulsar',
    fact: 'A pulsar is a tiny spinning star. Its beams sweep past us like a lighthouse.',
    svg: wrap(
      rot(
        poly([[30, 30], [20, 1], [40, 1]], GOLD_SOFT, { sw: 2.4 }) +
        poly([[30, 30], [20, 59], [40, 59]], GOLD_SOFT, { sw: 2.4 }) +
        hat('M30 22V8M30 38V52', PAPER, 2.2) +
        circ(30, 30, 11, BLUE_SOFT, { sw: 2.8 }) +
        pth('M24 28q6-6 12 0', 'none', { stroke: PAPER, sw: 2 }),
        32),
      circ(30, 30, 4.4, PAPER, { sw: 2 }),
      circ(30, 30, 19, 'none', { stroke: MID, sw: 1.4, dash: '2 3.5' }),
    ),
  },
  'black-hole': {
    name: 'Black hole',
    fact: 'A black hole pulls so strongly that even light cannot escape.',
    svg: wrap(
      rot(ell(30, 30, 28, 10, '#f9d56e', { sw: 2.8 }) + ell(30, 30, 21, 6.4, GOLD_SOFT, { sw: 1.8 }) + hat('M6 30H54', GOLD_DARK, 1.4), -14),
      circ(30, 30, 13.5, INK, { sw: 2.6 }),
      rot(pth('M2 30A28 10 0 0 0 58 30L51 30A21 6.4 0 0 1 9 30Z', '#f9d56e', { sw: 2.6 }) + hat('M12 33Q30 41 48 33', GOLD_DARK, 1.4), -14),
      pth('M17.5 27A13.5 13.5 0 0 1 42.5 27', 'none', { stroke: GOLD, sw: 3 }),
      pth('M19 24A12 12 0 0 1 41 24', 'none', { stroke: PAPER, sw: 1.4 }),
      rot(pth('M6 33Q17 37 21 34M39 26Q44 23 54 27', 'none', { stroke: GOLD_DARK, sw: 1.6 }), -14),
      sparkle(7, 9, 3, GOLD_SOFT, { sw: 1.3 }),
      sparkle(53, 51, 3, GOLD_SOFT, { sw: 1.3 }),
    ),
  },
  'neutron-star': {
    name: 'Neutron star',
    fact: 'A neutron star is as small as a city, yet heavier than our Sun.',
    svg: wrap(
      burst(30, 30, 28, 4.5, 8, BLUE_SOFT, { sw: 2.2 }),
      ell(30, 30, 10, 21, 'none', { stroke: BLUE, sw: 1.8 }),
      ell(30, 30, 18, 12, 'none', { stroke: BLUE, sw: 1.5, rot: 0 }),
      circ(30, 30, 8.5, '#a9c8f2', { sw: 2.8 }),
      circ(30, 30, 3.5, PAPER, { sw: 1.6 }),
      pth('M24 27A7 7 0 0 1 29 23', 'none', { stroke: PAPER, sw: 1.8 }),
    ),
  },
  cluster: {
    name: 'Star cluster',
    fact: 'A star cluster is a big group of stars born together. Gravity holds them close.',
    svg: wrap(
      circ(30, 30, 27, 'none', { stroke: MID, sw: 1.5, dash: '2 4' }),
      ...[[22, 18, 6], [38, 15, 5], [45, 30, 6.5], [30, 31, 8], [16, 38, 5], [36, 46, 5.5], [24, 49, 3.8], [12, 26, 3.8], [49, 45, 3.2]]
        .map(([x, y, s]) => burst(x, y, s, s * 0.44, 5, s > 5 ? GOLD : GOLD_SOFT, { sw: 2 })),
      ...[[30, 8], [50, 20], [8, 32], [28, 54], [44, 40], [19, 28], [41, 24], [30, 42], [10, 46]].map(([x, y]) => dot(x, y, 1.3)),
    ),
  },
  supernova: {
    name: 'Supernova',
    fact: 'A supernova is a giant star exploding. For a short time it can outshine a galaxy.',
    svg: wrap(
      circ(30, 30, 27, 'none', { stroke: BLUE, sw: 1.8, dash: '3 3.5' }),
      burst(30, 30, 26, 11, 11, BAD_SOFT, { sw: 2.6 }, -90, [1, 0.72, 0.9, 0.62, 1, 0.8]),
      burst(30, 30, 19, 9, 9, '#f9d56e', { sw: 2.2 }, -70, [1, 0.8, 0.95]),
      burst(30, 30, 11.5, 6, 8, GOLD_SOFT, { sw: 1.8 }, -90),
      circ(30, 30, 5.5, PAPER, { sw: 1.8 }),
      sparkle(8, 10, 3, GOLD, { sw: 1.3 }),
      sparkle(53, 8, 2.6, GOLD, { sw: 1.2 }),
      sparkle(52, 52, 3, GOLD, { sw: 1.3 }),
    ),
  },
  'red-giant': {
    name: 'Red giant',
    fact: 'The Sun will swell into a red giant in about five billion years.',
    svg: wrap(
      circ(33, 27, 24, '#f08a80'),
      circ(33, 27, 18, '#ee7b6e', { sw: 1.6, stroke: '#cf5a50' }),
      pth('M22 22q5-4 10 0t9-1M20 33q6 4 12 0t12 0M27 14q5 2 10 0', 'none', { stroke: '#cf5a50', sw: 2 }),
      pth('M46 40A24 24 0 0 1 28 51', 'none', { stroke: '#cf5a50', sw: 2.4 }),
      pth('M18 12A20 20 0 0 1 30 6', 'none', { stroke: PAPER, sw: 2.6 }),
      circ(33, 27, 24, 'none'),
      circ(9, 50, 5, GOLD, { sw: 2.2 }),
      hat('M6 48q1-2 3-2', PAPER, 1.4),
    ),
  },
  galaxy: {
    name: 'Spiral galaxy',
    fact: 'A galaxy is a giant family of stars, gas and dust. Some have trillions of stars.',
    svg: wrap(
      `<g transform="translate(30 30) rotate(-20) scale(1 .94) translate(-30 -30)">` +
      ell(30, 30, 27, 25, 'none', { stroke: BLUE_SOFT, sw: 1.4, dash: '1.5 3.5' }) +
      poly(spiralArm(0), BLUE_SOFT, { sw: 2.2 }) +
      poly(spiralArm(1), '#c2c0f1', { sw: 2.2 }) +
      ell(30, 30, 9, 8, GOLD, { sw: 2.6 }) +
      circ(30, 30, 3.5, GOLD_SOFT, { sw: 1.5 }) +
      `</g>`,
      dot(12, 17, 1.4, GOLD), dot(47, 14, 1.4, GOLD), dot(50, 42, 1.4, GOLD), dot(14, 48, 1.4, GOLD),
      sparkle(53, 28, 2.6, GOLD, { sw: 1.2 }),
    ),
  },
  exoplanet: {
    name: 'Exoplanet',
    fact: 'An exoplanet is a planet that circles another star. We have found thousands.',
    svg: wrap(
      rot(ell(30, 33, 28, 9, 'none', { stroke: MID, sw: 1.7, dash: '3 3.5' }), -24),
      circ(28, 34, 16, '#9fe0c4'),
      band(28, 34, 16, 26, 31, '#6ec9a2'),
      band(28, 34, 16, 38, 42, '#6ec9a2'),
      pth('M13 31q8-3 14 0t14 0M14 40q8 3 14 0t13 0', 'none', { stroke: '#4aa682', sw: 1.4 }),
      pth('M12 26A14 14 0 0 1 22 20', 'none', { stroke: PAPER, sw: 2.2 }),
      ell(35, 29, 3, 2, '#8e6fd1', { sw: 1.6, rot: -20 }),
      circ(28, 34, 16, 'none'),
      burst(50, 12, 8, 4, 8, GOLD_SOFT, { sw: 1.8 }),
      circ(50, 12, 4, GOLD, { sw: 1.8 }),
    ),
  },
  'twin-suns': {
    name: 'Twin suns',
    fact: 'Many stars live in pairs. A planet can circle two stars and see two suns.',
    svg: wrap(
      ell(30, 32, 28, 17, 'none', { stroke: MID, sw: 1.6, dash: '3 3.5' }),
      burst(20, 28, 15, 11.5, 10, GOLD_SOFT, { sw: 2.2 }),
      circ(20, 28, 10, GOLD, { sw: 2.4 }),
      hat('M14 25A7 7 0 0 1 19 21', PAPER, 2),
      burst(43, 29, 11, 8, 9, BAD_SOFT, { sw: 2 }),
      circ(43, 29, 6.6, '#f08a80', { sw: 2.2 }),
      hat('M39 27A4 4 0 0 1 42 25', PAPER, 1.6),
      circ(52.5, 41, 3.6, BLUE, { sw: 2 }),
      sparkle(9, 52, 2.8, GOLD, { sw: 1.2 }),
    ),
  },
  wormhole: {
    name: 'Wormhole',
    fact: 'A wormhole is an idea for a shortcut through space. No one has found one yet.',
    svg: wrap(
      circ(30, 30, 27, BLUE_SOFT, { sw: 2.8 }),
      circ(31, 31, 21.5, '#a9c8f2', { sw: 2.2 }),
      circ(32, 32, 16, BLUE, { sw: 2.2 }),
      circ(33, 33, 10.5, NIGHT2, { sw: 2.2 }),
      circ(34, 34, 5.5, INK, { sw: 2 }),
      pth('M8 20Q12 8 26 6M52 26Q54 42 42 50M16 46Q24 54 34 52', 'none', { stroke: PAPER, sw: 2.4 }),
      pth('M13 28Q15 16 26 13M45 30Q44 40 38 44', 'none', { stroke: BLUE_SOFT, sw: 2 }),
      pth('M26 40Q30 46 38 42', 'none', { stroke: '#a9c8f2', sw: 1.6 }),
      sparkle(41, 18, 3, PAPER, { sw: 1.2 }),
      sparkle(18, 38, 2.4, PAPER, { sw: 1.1 }),
    ),
  },
  quasar: {
    name: 'Quasar',
    fact: 'A quasar is a super-bright glow around a giant black hole far away.',
    svg: wrap(
      poly([[30, 30], [25.5, 1], [34.5, 1]], BLUE_SOFT, { sw: 2.4 }),
      poly([[30, 30], [25.5, 59], [34.5, 59]], BLUE_SOFT, { sw: 2.4 }),
      hat('M30 22V7M30 38V53', PAPER, 2),
      ell(30, 30, 24, 7, GOLD_SOFT, { sw: 2.4 }),
      ell(30, 30, 15, 4, GOLD, { sw: 1.8 }),
      burst(30, 30, 14, 4, 8, PAPER, { sw: 1.8 }),
      circ(30, 30, 6.5, PAPER, { sw: 2.6 }),
      circ(30, 30, 2.6, GOLD, { sw: 0 }),
      sparkle(9, 11, 3, GOLD, { sw: 1.3 }),
      sparkle(52, 50, 3, GOLD, { sw: 1.3 }),
    ),
  },
  supercluster: {
    name: 'Supercluster',
    fact: 'A supercluster is a gigantic gathering of many galaxy groups. Ours is called Laniakea.',
    svg: wrap(
      pth('M16 17Q30 28 44 20M44 20Q47 34 41 43M16 17Q10 30 17 43M17 43Q30 38 41 43', 'none', { stroke: BLUE, sw: 1.5, dash: '2 3' }),
      ...[[14, 14, 7], [18, 23, 5], [10, 24, 4.5], [44, 17, 7], [50, 25, 4.5], [38, 25, 4.5], [41, 44, 7], [48, 37, 4.5], [33, 48, 4.5], [16, 45, 7], [8, 38, 4.5], [24, 52, 4.5], [30, 33, 5]]
        .map(([x, y, s], i) => rot(ell(x, y, s, s * 0.52, i % 3 ? BLUE_SOFT : '#c2c0f1', { sw: 1.8 }) + circ(x, y, s * 0.2, GOLD, { sw: 0 }), (i * 47) % 160 - 70, x, y)),
      sparkle(30, 9, 2.6, GOLD, { sw: 1.2 }),
    ),
  },
  'cosmic-web': {
    name: 'Cosmic web',
    fact: 'Galaxies line up in long threads with huge empty gaps, like a giant web.',
    svg: wrap(
      circ(30, 30, 28, NIGHT, { sw: 2.8 }),
      ...[
        'M30 30Q38 20 48 18', 'M30 30Q20 22 14 14', 'M30 30Q24 40 16 46', 'M30 30Q40 38 46 46', 'M30 30Q30 20 30 8',
        'M48 18Q52 28 54 36', 'M14 14Q10 24 8 32', 'M16 46Q28 52 40 52', 'M46 46Q52 42 54 36', 'M8 32Q12 40 16 46', 'M14 14Q22 8 30 8', 'M30 8Q40 10 48 18',
      ].map((d, i) => pth(d, 'none', { stroke: i % 3 ? GOLD_SOFT : '#8fb8ee', sw: 1.8 })),
      ...[[30, 30, 5.5], [48, 18, 3.6], [14, 14, 3.6], [16, 46, 3.6], [46, 46, 3.6], [30, 8, 3], [54, 36, 2.6], [8, 32, 2.6], [40, 52, 2.4]]
        .map(([x, y, r]) => circ(x, y, r + 2.2, 'rgba(245,184,46,.28)', { sw: 0 }) + circ(x, y, r, GOLD, { stroke: PAPER, sw: 1.5 })),
      ...[[39, 24], [22, 22], [21, 38], [38, 41], [51, 27], [11, 23], [30, 20], [50, 41]].map(([x, y]) => dot(x, y, 1.2, PAPER)),
      circ(30, 30, 28, 'none', { sw: 2.8 }),
    ),
  },
};

// helper used by satellite: rounded rect as a path string builder
function rect(x, y, w, h, fill, [sw = 2.6] = []) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
}
