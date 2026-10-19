// PP1 Bubble Pod: a chunky round pod with a porthole, bendy legs, side fins, an antenna and a small engine.
const INK = '#2b2b2b';
const ln = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const path = (d, fill, w = 3, x = '') => `<path d="${d}" fill="${fill}" ${ln(w)} ${x}/>`;
const circ = (cx, cy, r, fill, w = 3) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${ln(w)}/>`;
const ell = (cx, cy, rx, ry, fill, w = 3, rot = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${ln(w)}${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
const line = (d, w = 2, color = INK, op = 1) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
const rivet = (x, y, r = 2.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fffdf8" stroke="${INK}" stroke-width="1.6"/>`;
const shade = d => `<path d="${d}" fill="${INK}" opacity=".13"/>`;
const mirror = s => `<g transform="translate(300 0) scale(-1 1)">${s}</g>`;
const tube = (d, w = 11, fill = '#efe6d2') => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w - 6}" stroke-linecap="round" stroke-linejoin="round"/>`;

const base = '<g>' +
  ell(150, 362, 112, 15, '#d9d6cf', 3) +
  ell(150, 362, 80, 8, '#8a8780', 2.4) +
  line('M62 366 q6 4 12 5 M226 366 q-6 4 -12 5 M138 372 h24', 2, INK, 0.5) +
  '</g>';

const body = '<g>' +
  circ(150, 215, 88, 'var(--paint,#fffdf8)', 3.6) +
  shade('M233.7 207.7 A84 84 0 0 1 142.7 298.7 A110 110 0 0 0 233.7 207.7 Z') +
  line('M76.7 188.3 A78 78 0 0 1 123.3 141.7', 5, '#ffffff', 0.9) +
  line('M72 202 A78 78 0 0 1 80 175', 3, '#ffffff', 0.9) +
  line('M71 250 Q150 276 229 250', 2.6, '#8a8780') +
  [[90, 255.5], [115, 260.4], [150, 263], [185, 260.4], [210, 255.5]].map(([x, y]) => rivet(x, y)).join('') +
  line('M196 281 l10 -12 M206 270 l10 -12 M214 258 l8 -10', 2, INK, 0.35) +
  ell(150, 131, 21, 6, '#d9d6cf', 2.8) +
  ell(150, 301, 25, 7, '#d9d6cf', 2.8) +
  rivet(138, 131, 1.8) + rivet(162, 131, 1.8) + rivet(134, 301, 1.8) + rivet(166, 301, 1.8) +
  '</g>';

const windowArt = '<g>' +
  circ(150, 195, 42, '#d9d6cf', 3.4) +
  circ(150, 195, 31, '#d3e6fb', 3) +
  '<path d="M150 164 A31 31 0 0 1 150 226 A44 44 0 0 0 150 164 Z" fill="#4a8fe0" opacity=".28"/>' +
  [0, 45, 90, 135, 180, 225, 270, 315].map(a => rivet((150 + 36.5 * Math.cos(a * Math.PI / 180)).toFixed(1), (195 + 36.5 * Math.sin(a * Math.PI / 180)).toFixed(1), 2.2)).join('') +
  circ(136, 186, 5.5, '#b9855a', 2.4) + circ(164, 186, 5.5, '#b9855a', 2.4) +
  circ(150, 200, 18, '#b9855a', 2.8) +
  ell(150, 207, 10, 7.5, '#efe6d2', 2) +
  circ(143, 197, 2.6, INK, 1) + circ(157, 197, 2.6, INK, 1) +
  ell(150, 203, 3.6, 2.6, INK, 1) +
  line('M144 210 Q150 215 156 210', 2) +
  line('M122 178 Q127 168 142 165', 4.5, '#ffffff', 0.95) +
  '<circle cx="120" cy="188" r="2.6" fill="#ffffff"/>' +
  '</g>';

const fin = path('M66 194 C46 184 30 166 26 142 C12 186 14 244 52 270 C62 270 70 264 73.8 259 A88 88 0 0 1 65 192.2 Z', '#fde9a8', 3.4) +
  line('M35 170 C30 204 36 236 56 258', 2.4, '#8a8780') +
  line('M46 190 l11 6 M44 208 l13 6 M47 226 l11 6 M52 244 l9 5', 2, INK, 0.45) +
  circ(62, 200, 3.2, '#f5b82e', 1.8);

const legArt = side => {
  const m = side ? mirror : s => s;
  return m(
    tube('M96 284 L66 338', 15) +
    line('M110 296 L82 334', 3) +
    circ(96, 284, 9, '#d9d6cf', 3) + circ(96, 284, 2.6, INK, 1) +
    ell(56, 347, 20, 8, '#d9d6cf', 3) +
    line('M44 345 Q56 341 66 345', 2, '#ffffff', 0.9) +
    circ(74, 322, 2.6, '#8a8780', 1.5)
  );
};

const nozzle = '<g>' +
  path('M126 306 H174 L186 334 H114 Z', '#d9d6cf', 3.2) +
  shade('M160 306 H174 L186 334 H168 Z') +
  ell(150, 334, 36, 7.5, '#2f3650', 3) +
  ell(150, 335, 22, 3.8, '#3b4468', 0) +
  line('M122 318 H178', 2, '#8a8780') +
  rivet(130, 312, 1.9) + rivet(170, 312, 1.9) + rivet(124, 326, 1.9) + rivet(176, 326, 1.9) +
  path('M122 300 H178 V310 H122 Z', '#8a8780', 3, 'rx="3"') +
  line('M128 304 H146', 2, '#ffffff', 0.7) +
  '</g>';

const antenna = '<g>' +
  ell(150, 128, 15, 5.5, '#d9d6cf', 2.8) +
  tube('M150 126 L150 72', 8, '#d9d6cf') +
  line('M143 118 L157 112 L143 106 L157 100 L143 94 L157 88', 2.4) +
  line('M124 50 Q116 57 124 64 M176 50 Q184 57 176 64', 2.4) +
  line('M114 44 Q103 57 114 70 M186 44 Q197 57 186 70', 2.2, INK, 0.5) +
  circ(150, 57, 12.5, '#f5b82e', 3.2) +
  line('M144 52 Q147 48 152 48', 3, '#ffffff', 0.95) +
  '</g>';

const flame = '<g>' +
  path('M118 336 C112 368 136 392 150 414 C164 392 188 368 182 336 Z', '#f5b82e', 3) +
  path('M130 336 C128 360 142 376 150 392 C158 376 172 360 170 336 Z', '#fde9a8', 2.4) +
  path('M141 336 C141 350 147 358 150 366 C153 358 159 350 159 336 Z', '#fffdf8', 2) +
  '</g>';

export default {
  id: 'pp1',
  name: 'Bubble Pod',
  viewBox: '0 0 300 420',
  base,
  parts: [
    { id: 'body', svg: body, from: { dx: -200, dy: 10 }, joints: [{ x: 150, y: 129 }, { x: 150, y: 301 }, { x: 74, y: 255 }, { x: 226, y: 255 }] },
    { id: 'window', svg: windowArt, from: { dx: 170, dy: -90 }, joints: [{ x: 150, y: 153 }, { x: 108, y: 195 }, { x: 192, y: 195 }, { x: 150, y: 237 }] },
    { id: 'legs', svg: legArt(false) + legArt(true), from: { dx: 0, dy: 150 }, joints: [{ x: 96, y: 284 }, { x: 204, y: 284 }, { x: 60, y: 346 }, { x: 240, y: 346 }] },
    { id: 'side-fins', svg: fin + mirror(fin), from: { dx: -170, dy: 40 }, joints: [{ x: 66, y: 196 }, { x: 70, y: 255 }, { x: 234, y: 196 }, { x: 230, y: 255 }] },
    { id: 'antenna', svg: antenna, from: { dx: 0, dy: -160 }, joints: [{ x: 150, y: 127 }, { x: 150, y: 94 }] },
    { id: 'engine', svg: nozzle, from: { dx: 0, dy: 160 }, joints: [{ x: 126, y: 302 }, { x: 174, y: 302 }, { x: 150, y: 334 }] },
  ],
  stickerSlots: [{ x: 88, y: 226, s: 28 }, { x: 212, y: 226, s: 28 }, { x: 124, y: 276, s: 28 }, { x: 176, y: 276, s: 28 }],
  flame,
};
