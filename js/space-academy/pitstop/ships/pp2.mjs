// PP2 Paper Jet: a folded-paper delta jet with a pilot canopy, two wings, a pointed nose, tail fins and a small engine.
const INK = '#2b2b2b';
const ln = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const path = (d, fill, w = 3, x = '') => `<path d="${d}" fill="${fill}" ${ln(w)} ${x}/>`;
const circ = (cx, cy, r, fill, w = 3) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${ln(w)}/>`;
const ell = (cx, cy, rx, ry, fill, w = 3, rot = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${ln(w)}${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
const line = (d, w = 2, color = INK, op = 1) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
const shade = d => `<path d="${d}" fill="${INK}" opacity=".12"/>`;
const mirror = s => `<g transform="translate(300 0) scale(-1 1)">${s}</g>`;
const PAPER = 'var(--paint,#fffdf8)';
const GREEN = '#d6f2e2';
const star = (cx, cy, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const k = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + k * Math.cos(a)).toFixed(1)} ${(cy + k * Math.sin(a)).toFixed(1)}`);
  }
  return `<path d="M${pts.join(' L')} Z" fill="#fde9a8" ${ln(1.8)}/>`;
};

const base = '<g>' +
  ell(150, 372, 84, 9, INK, 0).replace('<ellipse', '<ellipse opacity=".12"') +
  path('M96 352 H204 L216 372 H84 Z', '#efe6d2', 3.2) +
  line('M90 362 H210', 2, '#8a8780') +
  line('M110 357 l-4 11 M130 357 l-4 11 M150 357 l-4 11 M170 357 l-4 11 M190 357 l-4 11', 1.8, INK, 0.35) +
  '</g>';

const cockpit = '<g>' +
  path('M150 84 L172 130 V306 H128 V130 Z', PAPER, 3.4) +
  shade('M150 84 L172 130 V306 H150 Z') +
  line('M150 92 V300', 2.2, '#8a8780') +
  ell(150, 178, 18, 37, '#d3e6fb', 3.2) +
  '<path d="M150 141 A18 37 0 0 1 150 215 A26 37 0 0 0 150 141 Z" fill="#4a8fe0" opacity=".28"/>' +
  circ(142, 175, 3.8, '#b9855a', 2) + circ(158, 175, 3.8, '#b9855a', 2) +
  circ(150, 183, 12, '#b9855a', 2.6) +
  ell(150, 188, 6.5, 4.8, '#efe6d2', 1.6) +
  circ(145, 181, 1.9, INK, 1) + circ(155, 181, 1.9, INK, 1) +
  ell(150, 185.5, 2.4, 1.7, INK, 1) +
  line('M146 191 Q150 194 154 191', 1.8) +
  line('M137 158 Q139 150 146 147', 3.6, '#ffffff', 0.95) +
  '<circle cx="136" cy="168" r="2" fill="#ffffff"/>' +
  line('M133 236 H167 M133 252 H167 M133 268 H167', 1.8, INK, 0.28) +
  '</g>';

const wing = '<g>' +
  path('M130 105 L46 336 L130 308 Z', PAPER, 3.4) +
  '<path d="M130 170 L50 328 L46 336 L130 308 Z" fill="#2b2b2b" opacity=".06"/>' +
  line('M130 170 L50 328', 2.4, '#8a8780') +
  path('M66.3 280 L46 336 L96 319.3 Z', GREEN, 2.8) +
  line('M72 300 L58 322', 1.8, INK, 0.4) +
  star(100, 222, 10) +
  line('M118 130 L112 144 M112 146 L106 160', 1.8, INK, 0.35) +
  '</g>';

const nose = '<g>' +
  path('M150 50 L179 129 Q150 139 121 129 Z', PAPER, 3.4) +
  shade('M150 50 L179 129 Q150 139 150 135 Z') +
  path('M133.3 96 L166.7 96 L170.9 108 L129.1 108 Z', GREEN, 2.6) +
  path('M150 50 L158 72 Q150 76 142 72 Z', '#d3e6fb', 3) +
  line('M150 78 V134', 2.2, '#8a8780') +
  line('M136 118 Q150 123 164 118', 1.8, INK, 0.35) +
  '</g>';

const finL = path('M128 222 L90 324 Q87 336 100 333 L128 314 Z', GREEN, 3.2) +
  line('M122 240 L102 314', 1.8, '#8a8780') +
  line('M116 262 l-6 -2 M112 276 l-6 -2', 1.8, INK, 0.4);
const tail = '<g>' +
  finL + mirror(finL) +
  path('M150 230 L163 264 L160 306 H140 L137 264 Z', GREEN, 3) +
  shade('M150 230 L163 264 L160 306 H150 Z') +
  line('M150 240 V304', 2, '#8a8780') +
  path('M124 298 H176 L181 314 H119 Z', '#d9d6cf', 3) +
  line('M128 304 H146', 2, '#ffffff', 0.8) +
  '</g>';

const engine = '<g>' +
  path('M134 314 H166 L175 340 H125 Z', '#d9d6cf', 3.2) +
  shade('M158 314 H166 L175 340 H162 Z') +
  ell(150, 340, 25, 6.5, '#2f3650', 3) +
  line('M129 326 H171', 2, '#8a8780') +
  line('M138 320 H146', 2, '#ffffff', 0.8) +
  '</g>';

const flame = '<g>' +
  path('M128 342 C124 370 140 390 150 412 C160 390 176 370 172 342 Z', '#f5b82e', 3) +
  path('M136 342 C134 360 144 374 150 390 C156 374 166 360 164 342 Z', '#fde9a8', 2.4) +
  path('M144 342 C144 352 148 358 150 364 C152 358 156 352 156 342 Z', '#fffdf8', 2) +
  '</g>';

export default {
  id: 'pp2',
  name: 'Paper Jet',
  viewBox: '0 0 300 420',
  base,
  parts: [
    { id: 'cockpit', svg: cockpit, from: { dx: 0, dy: -170 }, joints: [{ x: 150, y: 100 }, { x: 128, y: 200 }, { x: 172, y: 200 }, { x: 150, y: 300 }] },
    { id: 'left-wing', svg: wing, from: { dx: -190, dy: 20 }, joints: [{ x: 130, y: 150 }, { x: 130, y: 250 }, { x: 130, y: 306 }, { x: 52, y: 322 }] },
    { id: 'right-wing', svg: mirror(wing), from: { dx: 190, dy: 20 }, joints: [{ x: 170, y: 150 }, { x: 170, y: 250 }, { x: 170, y: 306 }, { x: 248, y: 322 }] },
    { id: 'nose', svg: nose, from: { dx: 0, dy: -170 }, joints: [{ x: 150, y: 56 }, { x: 128, y: 126 }, { x: 172, y: 126 }] },
    { id: 'tail', svg: tail, from: { dx: 0, dy: 150 }, joints: [{ x: 128, y: 240 }, { x: 172, y: 240 }, { x: 150, y: 306 }, { x: 122, y: 314 }] },
    { id: 'engine', svg: engine, from: { dx: 0, dy: 170 }, joints: [{ x: 134, y: 314 }, { x: 166, y: 314 }, { x: 150, y: 340 }] },
  ],
  stickerSlots: [{ x: 112, y: 196, s: 24 }, { x: 188, y: 196, s: 24 }, { x: 96, y: 262, s: 26 }, { x: 204, y: 262, s: 26 }],
  flame,
};
