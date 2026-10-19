// Class 1 Classic Rocket: a bold red-and-white rocket with a porthole, ogive nose, swept fins and a big engine bell.
const INK = '#2b2b2b';
const ln = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const path = (d, fill, w = 3, x = '') => `<path d="${d}" fill="${fill}" ${ln(w)} ${x}/>`;
const circ = (cx, cy, r, fill, w = 3) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${ln(w)}/>`;
const ell = (cx, cy, rx, ry, fill, w = 3) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${ln(w)}/>`;
const rect = (x, y, w, h, fill, sw = 3, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${ln(sw)}/>`;
const line = (d, w = 2, color = INK, op = 1) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
const rivet = (x, y, r = 2.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fffdf8" stroke="${INK}" stroke-width="1.6"/>`;
const shade = d => `<path d="${d}" fill="${INK}" opacity=".13"/>`;
const mirror = s => `<g transform="translate(300 0) scale(-1 1)">${s}</g>`;
const PAINT = 'var(--paint,#fffdf8)';
const RED = '#d9534f';
const Y = 10;
const shift = s => `<g transform="translate(0 ${Y})">${s}</g>`;
const jt = (x, y) => ({ x, y: y + Y });

const base = '<g>' +
  // gantry tower with a service arm
  rect(238, 150, 20, 232, '#efe6d2', 3) +
  line('M238 150 L258 190 L238 230 L258 270 L238 310 L258 350 M258 150 L238 190 L258 230 L238 270 L258 310 L238 350', 2, '#8a8780') +
  rect(214, 198, 28, 10, '#d9d6cf', 2.8, 3) +
  rect(236, 140, 24, 12, RED, 3, 3) +
  path('M62 366 H238 L250 384 H50 Z', '#d9d6cf', 3.2) +
  line('M60 374 H240', 2, '#8a8780') +
  line('M80 370 l-4 10 M110 370 l-4 10 M140 370 l-4 10 M170 370 l-4 10 M200 370 l-4 10', 1.8, INK, 0.35) +
  '</g>';

const upperBody = shift('<g>' +
  rect(95, 130, 110, 82, PAINT, 3.6) +
  shade('M180 131 H204 V211 H180 Z') +
  line('M108 144 V200', 4.5, '#ffffff', 0.9) +
  line('M95 144 H205', 2.4, '#8a8780') +
  line('M190 190 l8 -10 M196 202 l8 -10 M186 202 l8 -10', 2, INK, 0.3) +
  rivet(106, 138) + rivet(194, 138) + rivet(106, 204) + rivet(194, 204) + rivet(150, 138, 2) +
  '</g>');

const lowerBody = shift('<g>' +
  rect(95, 212, 110, 80, PAINT, 3.6) +
  shade('M180 213 H204 V291 H180 Z') +
  line('M108 228 V282', 4.5, '#ffffff', 0.9) +
  rect(95, 212, 110, 12, '#fde9a8', 2.8) +
  rivet(106, 218, 2) + rivet(150, 218, 2) + rivet(194, 218, 2) +
  circ(150, 246, 10, '#d9d6cf', 3) + circ(150, 246, 3, INK, 1.4) + line('M150 246 L156 240', 2.4) +
  line('M128 272 H172 M128 279 H172 M134 286 H166', 2.4, INK, 0.6) +
  rect(95, 284, 110, 8, '#d9d6cf', 2.8) +
  rivet(110, 288, 1.8) + rivet(150, 288, 1.8) + rivet(190, 288, 1.8) +
  '</g>');

const windowArt = shift('<g>' +
  circ(150, 171, 28, '#d9d6cf', 3.6) +
  circ(150, 171, 20, '#d3e6fb', 3) +
  '<path d="M150 151 A20 20 0 0 1 150 191 A30 20 0 0 0 150 151 Z" fill="#4a8fe0" opacity=".3"/>' +
  [30, 90, 150, 210, 270, 330].map(a => rivet((150 + 24.2 * Math.cos(a * Math.PI / 180)).toFixed(1), (171 + 24.2 * Math.sin(a * Math.PI / 180)).toFixed(1), 1.9)).join('') +
  line('M137 163 Q140 156 148 153', 4, '#ffffff', 0.95) +
  '<circle cx="136" cy="172" r="1.8" fill="#ffffff"/>' +
  '<path d="M158 176 l1.8 4 l4 1.8 l-4 1.8 l-1.8 4 l-1.8 -4 l-4 -1.8 l4 -1.8 Z" fill="#fffdf8" stroke="#2b2b2b" stroke-width="1.2" stroke-linejoin="round"/>' +
  '</g>');

const nose = shift('<g>' +
  path('M95 132 C95 92 124 56 150 34 C176 56 205 92 205 132 Z', PAINT, 3.6) +
  shade('M205 132 C205 92 176 56 150 34 C170 70 180 100 178 132 Z') +
  path('M126.7 57.3 C134 49 142 41 150 34 C158 41 166 49 173.3 57.3 Q150 66 126.7 57.3 Z', RED, 3) +
  line('M108 122 C108 100 118 80 130 66', 4.5, '#ffffff', 0.9) +
  line('M99 108 Q150 122 201 108', 2.4, '#8a8780') +
  rect(91, 126, 118, 13, '#d9d6cf', 3, 3) +
  rivet(104, 132.5, 1.8) + rivet(150, 132.5, 1.8) + rivet(196, 132.5, 1.8) +
  '</g>');

const finShape = path('M95 222 L48 298 Q38 322 58 324 L95 308 Z', RED, 3.4) +
  line('M88 238 L60 292', 3.4, '#ffffff', 0.55) +
  line('M92 262 L70 304', 2, INK, 0.35) +
  shade('M95 266 L72 306 L95 308 Z') +
  circ(86, 230, 2.4, '#fffdf8', 1.6);
const fins = shift(`<g>${finShape}${mirror(finShape)}</g>`);

const engine = shift('<g>' +
  rect(105, 290, 90, 12, '#8a8780', 3, 3) +
  path('M116 300 H184 L200 338 H100 Z', '#d9d6cf', 3.4) +
  shade('M168 300 H184 L200 338 H178 Z') +
  ell(150, 338, 50, 9.5, '#2f3650', 3.2) +
  ell(150, 339, 32, 4.8, '#3b4468', 0) +
  line('M110 318 H190', 2.4, '#8a8780') +
  line('M106 328 H194', 2.4, '#8a8780') +
  line('M122 306 H142', 2.4, '#ffffff', 0.8) +
  rivet(122, 312, 1.9) + rivet(178, 312, 1.9) + rivet(115, 323, 1.9) + rivet(185, 323, 1.9) +
  line('M130 296 H146', 2, '#ffffff', 0.6) +
  '</g>');

const flame = '<g>' +
  path('M104 352 C94 380 126 396 150 420 C174 396 206 380 196 352 Z', '#f5b82e', 3) +
  path('M120 352 C116 372 138 386 150 402 C162 386 184 372 180 352 Z', '#fde9a8', 2.4) +
  path('M136 352 C136 364 146 372 150 380 C154 372 164 364 164 352 Z', '#fffdf8', 2) +
  '</g>';

export default {
  id: 'class-1',
  name: 'Classic Rocket',
  viewBox: '0 0 300 420',
  base,
  parts: [
    { id: 'upper-body', svg: upperBody, from: { dx: 0, dy: -190 }, joints: [jt(95, 212), jt(205, 212), jt(95, 132), jt(205, 132)] },
    { id: 'lower-body', svg: lowerBody, from: { dx: 0, dy: 190 }, joints: [jt(95, 212), jt(205, 212), jt(95, 292), jt(205, 292)] },
    { id: 'window', svg: windowArt, from: { dx: -170, dy: -40 }, joints: [jt(150, 143), jt(122, 171), jt(178, 171), jt(150, 199)] },
    { id: 'nose', svg: nose, from: { dx: 0, dy: -200 }, joints: [jt(95, 132), jt(205, 132), jt(150, 132)] },
    { id: 'fins', svg: fins, from: { dx: -190, dy: 60 }, joints: [jt(95, 222), jt(95, 306), jt(205, 222), jt(205, 306)] },
    { id: 'engine', svg: engine, from: { dx: 0, dy: 180 }, joints: [jt(105, 294), jt(195, 294), jt(150, 338)] },
  ],
  stickerSlots: [
    { x: 109, y: 178 + Y, s: 20 }, { x: 191, y: 178 + Y, s: 20 },
    { x: 122, y: 245 + Y, s: 30 }, { x: 178, y: 245 + Y, s: 30 },
  ],
  flame,
};
