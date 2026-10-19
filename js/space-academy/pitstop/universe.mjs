// Free-roam universe: six sectors of real, lesser-known cosmic objects joined by (fictional) wormholes.
// Gravity bends the ship's path and the canvas bends the stars around heavy bodies. Nothing here can hurt the ship.
import { factText, nearestBody as nearestBodyTo, pickBody as pickBodyAt, readMs } from './steer.mjs';

export const WORLD = 5600;

const TAU = Math.PI * 2;
const WARP_SECONDS = 1;
const WORM_R = 54;
const MINE_RANGE = 175;
const MINE_TIME = 1.1;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const mod = (v, n) => ((v % n) + n) % n;

function seeded(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Every object is real science except the wormholes. Facts stay short because they show as a banner.
export const SECTORS = [
  {
    id: 'eagle', name: 'Eagle Nebula', intro: 'Where baby stars are born.', tint: ['#ff4f9a', '#9b3dff', '#ff9a6a'], accent: '#ff7ab8', galaxies: 3,
    objects: [
      { t: 'star', type: 'young', name: 'HL Tauri', fact: 'A baby star. Gaps in its disc may be new planets!' },
      { t: 'belt', name: 'Fomalhaut debris belt', fact: 'A ring of icy rocks. Fly close to mine ore!', rin: 230, rout: 400, n: 26 },
      { t: 'planet', type: 'iron', name: 'WASP-76b', fact: 'Its night side rains molten iron.' },
      { t: 'planet', type: 'rogue', name: 'CFBDSIR 2149-0403', fact: 'A planet with no star. It drifts alone.' },
    ],
  },
  {
    id: 'kepler', name: 'Kepler-16 System', intro: 'Two suns in one sky.', tint: ['#ff7a1a', '#e0262a', '#ffc53d'], accent: '#ffb347', galaxies: 2,
    objects: [
      { t: 'binary', name: 'Kepler-16 A and B', fact: 'Two suns that circle each other.' },
      { t: 'planet', type: 'metal', name: 'K2-229b', fact: 'A planet more than half iron. Its year is 14 hours.' },
      { t: 'planet', type: 'azure', name: 'HD 189733b', fact: 'Deep blue, but it may rain glass sideways.' },
    ],
  },
  {
    id: 'eta', name: 'Eta Carinae', intro: 'Giant stars living on borrowed time.', tint: ['#2bd98a', '#1b8fd6', '#a6ff6a'], accent: '#5cf0a8', galaxies: 2,
    objects: [
      { t: 'star', type: 'eta', name: 'Eta Carinae', fact: 'A dying giant. It will explode someday!' },
      { t: 'star', type: 'ring', name: 'Ring Nebula', fact: 'A dying Sun-like star. Our Sun ends this way.' },
      { t: 'planet', type: 'gas', name: 'Beta Pictoris b', fact: 'A gas giant whose day lasts only 8 hours.' },
      { t: 'belt', name: 'Beta Pictoris debris disc', fact: 'Young rocks colliding. Mine some ore!', rin: 220, rout: 380, n: 24 },
    ],
  },
  {
    id: 'crab', name: 'Crab Nebula', intro: 'A star exploded here in 1054.', tint: ['#7ff3ff', '#ff7a1a', '#5fffd0'], accent: '#9ff7ff', galaxies: 3,
    objects: [
      { t: 'star', type: 'pulsar', name: 'Crab Pulsar', fact: 'A spinning dead star. 30 turns every second!' },
      { t: 'collapse', name: 'Collapsing star', fact: 'Heavy stars collapse, then blow up as supernovae.' },
      { t: 'planet', type: 'lava', name: '55 Cancri e', fact: 'A lava world with a year under 18 hours.' },
      { t: 'planet', type: 'diamond', name: 'PSR J1719-1438 b', fact: 'Squeezed carbon: maybe a diamond planet.' },
      { t: 'belt', name: 'Psyche-type metal belt', fact: 'Metal asteroids of iron and nickel. Mine them!', rin: 220, rout: 380, n: 24, metal: true },
    ],
  },
  {
    id: 'cygnus', name: 'Cygnus X-1', intro: 'A hungry black hole and a crash of two more.', tint: ['#3d7bff', '#22d3ee', '#7a5cff'], accent: '#6fb0ff', galaxies: 4,
    objects: [
      { t: 'cygnus', name: 'Cygnus X-1', fact: 'The first black hole ever found. It eats a blue star.' },
      { t: 'merge', name: 'GW150914', r: 30, sep: 190, T: 34, fact: 'Two black holes crash. Space ripples.', msg: 'Two black holes merged! Ripples in space spread out.' },
      { t: 'star', type: 'tabby', name: "Tabby's Star", fact: 'Its light dips oddly. Dust clouds, probably!' },
    ],
  },
  {
    id: 'centre', name: 'Galactic Centre', intro: 'Millions of stars circle a giant black hole.', tint: ['#a855ff', '#ffc53d', '#ff5fd2'], accent: '#c58bff', galaxies: 4,
    objects: [
      { t: 'sgr', name: 'Sagittarius A*', fact: 'The black hole in our galaxy. 4 million Suns heavy.' },
      { t: 'merge', name: 'GW170817', ns: true, r: 14, sep: 120, T: 28, fact: 'Two neutron stars crash and make gold.', msg: 'Kilonova! Crashes like this make gold and platinum.' },
      { t: 'star', type: 'quasar', name: '3C 273', fact: 'A quasar. A black hole so hungry it outshines a galaxy.' },
      { t: 'planet', type: 'ice', name: 'OGLE-2005-BLG-390Lb', fact: 'Found when its gravity bent starlight!' },
    ],
  },
];
const LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3]];

const SIZE = { gas: [120, 150], ice: [70, 88], lava: [62, 78], iron: [80, 94], diamond: [52, 62], rogue: [62, 74], metal: [54, 66], azure: [98, 116] };
const GLOW = { gas: '#e0a868', ice: '#a8e8ff', lava: '#ff6a2a', iron: '#ff7a2a', diamond: '#bff3ff', rogue: '#a8304a', metal: '#b8c2d6', azure: '#4a8fe8', young: '#ffb347', tabby: '#fff1c9', eta: '#ffb347', ring: '#7affc8', pulsar: '#6fb0ff', neutron: '#6fb0ff', quasar: '#9fd0ff', orange: '#ffb347', red: '#ff5a3a', bluestar: '#6fb0ff' };
const MAP_COLOR = { gas: '#d9a86c', ice: '#bfe8f4', lava: '#ff6a2a', iron: '#ff8a3a', diamond: '#bff3ff', rogue: '#8a5a7a', metal: '#aab4c8', azure: '#3d7bff', young: '#ffb36a', tabby: '#fff1c9', eta: '#ffb347', ring: '#7affc8', pulsar: '#bfe8ff', neutron: '#bfe8ff', quasar: '#ffffff', orange: '#ffb347', red: '#ff5a3a', bluestar: '#6fb0ff' };

let uid = 0;
const pick = (rng, list) => list[Math.floor(rng() * list.length)];

const svg = (inner, defs = '', cls = '', style = '') => `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"${cls ? ` class="${cls}"` : ''}${style ? ` style="${style}"` : ''}>${defs ? `<defs>${defs}</defs>` : ''}${inner}</svg>`;

const shadeDef = id => `<radialGradient id="sh${id}" cx=".32" cy=".3" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".66"/></radialGradient>`;
const sunDefs = (id, cols, corona) => `<radialGradient id="co${id}"><stop offset=".55" stop-color="${corona}" stop-opacity=".55"/><stop offset="1" stop-color="${corona}" stop-opacity="0"/></radialGradient><radialGradient id="st${id}"><stop offset="0" stop-color="${cols[0]}"/><stop offset=".6" stop-color="${cols[1]}"/><stop offset="1" stop-color="${cols[2]}"/></radialGradient>`;

function sunSvg(cols, corona) {
  const id = ++uid;
  return svg(`<circle cx="100" cy="100" r="98" fill="url(#co${id})"/><circle cx="100" cy="100" r="60" fill="url(#st${id})"/>`, sunDefs(id, cols, corona));
}

// A young star inside a dusty disc whose gaps are probably new planets.
function discSvg(cols, corona) {
  const id = ++uid;
  const rings = [[98, 7, '#e8b27a'], [86, 4, '#c98a52'], [74, 7, '#e8b27a'], [64, 4, '#c98a52']]
    .map(([rx, w, c]) => `<ellipse cx="100" cy="100" rx="${rx}" ry="${(rx * 0.27).toFixed(1)}" fill="none" stroke="${c}" stroke-width="${w}" opacity=".85" transform="rotate(-18 100 100)"/>`).join('');
  return svg(`${rings}<circle cx="100" cy="100" r="98" fill="url(#co${id})"/><circle cx="100" cy="100" r="60" fill="url(#st${id})"/><g clip-path="url(#lo${id})">${rings}</g>`,
    `${sunDefs(id, cols, corona)}<clipPath id="lo${id}"><rect x="0" y="100" width="200" height="100"/></clipPath>`);
}

// Two huge gas lobes puff out of a star that is tearing itself apart.
function etaSvg() {
  const id = ++uid;
  return svg(`<ellipse cx="100" cy="38" rx="30" ry="40" fill="url(#lb${id})" stroke="#ffcf8a" stroke-opacity=".6" stroke-width="2"/><ellipse cx="100" cy="162" rx="30" ry="40" fill="url(#lb${id})" stroke="#ffcf8a" stroke-opacity=".6" stroke-width="2"/><circle cx="100" cy="100" r="46" fill="url(#co${id})"/><circle cx="100" cy="100" r="28" fill="url(#st${id})"/>`,
    `${sunDefs(id, ['#fff4e0', '#ff9a5a', '#c8321e'], '#ff7a3a')}<radialGradient id="lb${id}"><stop offset="0" stop-color="#ffe2b0" stop-opacity=".95"/><stop offset=".7" stop-color="#e8743a" stop-opacity=".7"/><stop offset="1" stop-color="#a8301e" stop-opacity=".35"/></radialGradient>`);
}

function ringSvg() {
  const id = ++uid;
  const shells = '<circle cx="100" cy="100" r="82" fill="none" stroke="#ff6a5a" stroke-width="9" stroke-dasharray="46 12 18 9" opacity=".6"/><circle cx="100" cy="100" r="72" fill="none" stroke="#7affc8" stroke-width="11" stroke-dasharray="30 8 52 10" opacity=".55"/><circle cx="100" cy="100" r="62" fill="none" stroke="#5aa8ff" stroke-width="8" stroke-dasharray="20 6 34 8" opacity=".6"/>';
  return svg(`<circle cx="100" cy="100" r="76" fill="url(#rf${id})"/>`, `<radialGradient id="rf${id}"><stop offset=".6" stop-color="#5aa8ff" stop-opacity="0"/><stop offset=".9" stop-color="#5aa8ff" stop-opacity=".22"/><stop offset="1" stop-color="#5aa8ff" stop-opacity="0"/></radialGradient>`)
    + svg(shells, '', 'ps-uni-spin', '--d:90s')
    + svg('<circle cx="100" cy="100" r="9" fill="#bfe8ff" opacity=".4"/><circle cx="100" cy="100" r="5" fill="#fff"/>');
}

function pulsarSvg(beams) {
  const id = ++uid;
  const halo = svg('<circle cx="100" cy="100" r="44" fill="url(#pg' + id + ')"/><circle cx="100" cy="100" r="8" fill="#fff"/>', `<radialGradient id="pg${id}"><stop offset="0" stop-color="#e8f6ff" stop-opacity=".9"/><stop offset=".25" stop-color="#6fb0ff" stop-opacity=".5"/><stop offset="1" stop-color="#6fb0ff" stop-opacity="0"/></radialGradient>`);
  if (!beams) return halo;
  const beam = svg(`<polygon points="100,100 86,0 114,0" fill="url(#pb${id})"/><polygon points="100,100 86,200 114,200" fill="url(#pb${id})"/>`, `<radialGradient id="pb${id}" cx="100" cy="100" r="100" gradientUnits="userSpaceOnUse"><stop offset=".05" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#6fd8ff" stop-opacity="0"/></radialGradient>`, 'ps-uni-spin', '--d:1.6s');
  return beam + halo;
}

function quasarSvg() {
  const id = ++uid;
  return svg(`<g transform="rotate(32 100 100)"><polygon points="100,100 91,0 109,0" fill="url(#qj${id})"/><polygon points="100,100 91,200 109,200" fill="url(#qj${id})"/><ellipse cx="100" cy="100" rx="40" ry="10" fill="url(#qd${id})"/></g><circle cx="100" cy="100" r="26" fill="url(#qc${id})"/><circle cx="100" cy="100" r="11" fill="#fff"/>`,
    `<radialGradient id="qj${id}" cx="100" cy="100" r="100" gradientUnits="userSpaceOnUse"><stop offset=".1" stop-color="#fff" stop-opacity=".95"/><stop offset=".6" stop-color="#7fc0ff" stop-opacity=".5"/><stop offset="1" stop-color="#7fc0ff" stop-opacity="0"/></radialGradient><radialGradient id="qd${id}"><stop offset="0" stop-color="#fff6d8"/><stop offset=".6" stop-color="#ffb347" stop-opacity=".7"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient><radialGradient id="qc${id}"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#bfe0ff" stop-opacity=".7"/><stop offset="1" stop-color="#6fb0ff" stop-opacity="0"/></radialGradient>`);
}

function dustSvg(rng) {
  const clumps = Array.from({ length: 6 }, (_, i) => {
    const a = i * 1.05 + rng() * 0.5;
    const x = 100 + Math.cos(a) * (82 + rng() * 10);
    const y = 100 + Math.sin(a) * (82 + rng() * 10);
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(13 + rng() * 14).toFixed(1)}" ry="${(5 + rng() * 5).toFixed(1)}" fill="${i % 2 ? '#7a4a2a' : '#a07a52'}" opacity=".8" transform="rotate(${(a * 57.3 + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }).join('');
  return svg(clumps, '', 'ps-uni-spin', '--d:26s');
}

function planetArt(kind, rng) {
  const id = ++uid;
  const body = [];
  const dune = (fill, count) => Array.from({ length: count }, () => `<ellipse cx="${60 + rng() * 80}" cy="${50 + rng() * 100}" rx="${10 + rng() * 22}" ry="${5 + rng() * 9}" fill="${fill}" opacity=".7" transform="rotate(${(rng() * 40 - 20).toFixed(0)} 100 100)"/>`).join('');
  const bands = palette => {
    let y = 40;
    let out = '';
    while (y < 160) {
      const h = 8 + rng() * 18;
      out += `<rect x="30" y="${y.toFixed(1)}" width="140" height="${h.toFixed(1)}" fill="${pick(rng, palette)}"/>`;
      y += h;
    }
    return out;
  };
  if (kind === 'gas') {
    body.push(bands(['#d9a86c', '#c98a52', '#efd2a0', '#a8683a']), `<ellipse cx="${110 + rng() * 20}" cy="${112 + rng() * 20}" rx="14" ry="8" fill="#b4542f" opacity=".85"/>`);
  } else if (kind === 'azure') {
    body.push(bands(['#2f6fd8', '#4a8fe8', '#1f4fa8', '#7ab8ff']));
  } else if (kind === 'iron') {
    body.push('<rect x="30" y="30" width="140" height="140" fill="#241426"/>', bands(['#2a1830', '#4a2236', '#2a1830']), '<ellipse cx="150" cy="100" rx="58" ry="74" fill="#ff8a3a" opacity=".6"/><ellipse cx="160" cy="100" rx="30" ry="50" fill="#ffd166" opacity=".55"/>');
  } else if (kind === 'diamond') {
    body.push('<rect x="30" y="30" width="140" height="140" fill="#cfeff8"/>');
    for (let i = 0; i < 9; i++) {
      const x = 40 + rng() * 120;
      const y = 40 + rng() * 120;
      body.push(`<polygon points="${x.toFixed(0)},${y.toFixed(0)} ${(x + 20 + rng() * 22).toFixed(0)},${(y + rng() * 14).toFixed(0)} ${(x + rng() * 18).toFixed(0)},${(y + 22 + rng() * 18).toFixed(0)}" fill="${pick(rng, ['#ffffff', '#a8e8ff', '#e8d4ff', '#8fd0f0'])}" stroke="#fff" stroke-opacity=".7" opacity=".85"/>`);
    }
    body.push('<path d="M72 64l4 10 10 4-10 4-4 10-4-10-10-4 10-4z M128 108l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fff"/>');
  } else if (kind === 'rogue') {
    body.push('<rect x="30" y="30" width="140" height="140" fill="#2b1d33"/>', dune('#3f2a4a', 6), `<circle cx="${80 + rng() * 40}" cy="${90 + rng() * 40}" r="22" fill="#a8304a" opacity=".35"/>`, dune('#1a1020', 4));
  } else if (kind === 'metal') {
    body.push('<rect x="30" y="30" width="140" height="140" fill="#8d97aa"/>', dune('#b8c2d6', 5), dune('#5d6678', 6), '<path d="M52 80 90 70M110 120 150 108M70 138 108 132" stroke="#ffd166" stroke-width="2.5" opacity=".7" fill="none"/>');
  } else if (kind === 'ice') {
    body.push('<rect x="30" y="30" width="140" height="140" fill="#bfe8f4"/>', dune('#fff', 6), dune('#8ccbe0', 5));
  } else {
    body.push('<rect x="30" y="30" width="140" height="140" fill="#3a1410"/>');
    for (let i = 0; i < 6; i++) {
      const x = 50 + rng() * 100;
      const y = 50 + rng() * 100;
      const pts = `${x.toFixed(0)},${y.toFixed(0)} ${(x + rng() * 30 - 15).toFixed(0)},${(y + 14).toFixed(0)} ${(x + rng() * 40 - 20).toFixed(0)},${(y + 30).toFixed(0)}`;
      body.push(`<polyline points="${pts}" fill="none" stroke="#ff7a1a" stroke-width="7" opacity=".4"/><polyline points="${pts}" fill="none" stroke="#ffd166" stroke-width="2.5"/>`);
    }
  }
  return `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><defs><clipPath id="cp${id}"><circle cx="100" cy="100" r="60"/></clipPath>${shadeDef(id)}</defs><g clip-path="url(#cp${id})">${body.join('')}</g><circle cx="100" cy="100" r="60" fill="url(#sh${id})"/></svg>`;
}

function rockSvg(rng, metal) {
  const pts = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * TAU;
    const r = 34 + rng() * 14;
    return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  const detail = metal
    ? '<path d="M30 40 52 34M44 62 70 54M34 58 46 66" stroke="#ffd166" stroke-width="3" fill="none" opacity=".85"/><path d="M26 30 48 22" stroke="#fff" stroke-width="3" opacity=".6"/>'
    : `<circle cx="${40 + rng() * 14}" cy="${40 + rng() * 14}" r="${5 + rng() * 4}" fill="#5b564e" opacity=".7"/><circle cx="${56 + rng() * 10}" cy="${56 + rng() * 10}" r="${3 + rng() * 3}" fill="#5b564e" opacity=".7"/>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><polygon points="${pts}" fill="${metal ? '#aab4c8' : '#8b8579'}" stroke="${metal ? '#5b6579' : '#4b463f'}" stroke-width="4" stroke-linejoin="round"/>${detail}</svg>`;
}

function holeArt() {
  const id = ++uid;
  return `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><defs><radialGradient id="ad${id}"><stop offset="0" stop-color="#fff6d8"/><stop offset=".35" stop-color="#ffb347"/><stop offset=".72" stop-color="#ff5a1f" stop-opacity=".75"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient><clipPath id="lo${id}"><rect x="0" y="100" width="200" height="100"/></clipPath></defs>
  <ellipse cx="100" cy="100" rx="97" ry="22" fill="url(#ad${id})"/>
  <path d="M52 100C52 42 148 42 148 100" fill="none" stroke="#ffcf8a" stroke-width="8" opacity=".8" stroke-linecap="round"/>
  <path d="M60 104C60 148 140 148 140 104" fill="none" stroke="#ff8a3a" stroke-width="4" opacity=".7" stroke-linecap="round"/>
  <circle cx="100" cy="100" r="34" fill="#000"/><circle cx="100" cy="100" r="36" fill="none" stroke="#ffe8bd" stroke-width="2.5"/>
  <g clip-path="url(#lo${id})"><ellipse cx="100" cy="100" rx="97" ry="22" fill="url(#ad${id})"/></g></svg>`;
}

function galaxyArt(rng, color) {
  const dots = [];
  const arms = 2 + Math.floor(rng() * 2);
  for (let arm = 0; arm < arms; arm++) {
    for (let i = 0; i < 46; i++) {
      const r = 6 + i * 0.9;
      const a = arm * (TAU / arms) + r * 0.13 + (rng() - 0.5) * 0.35;
      dots.push(`<circle cx="${(50 + Math.cos(a) * r).toFixed(1)}" cy="${(50 + Math.sin(a) * r).toFixed(1)}" r="${(0.5 + rng() * 1.1).toFixed(2)}" opacity="${(0.9 - i * 0.015).toFixed(2)}"/>`);
    }
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><radialGradient id="ga${++uid}"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="22" fill="url(#ga${uid})"/><g fill="#fff">${dots.join('')}</g></svg>`;
}

// r is the solid radius; core is the radius of the drawn body inside the 200-unit art box; lab is where the name label sits.
const STARS = {
  young: { r: 70, core: 60, g: 0.6, art: () => discSvg(['#fff3c8', '#ffb347', '#e0701a'], '#ffb347') },
  tabby: { r: 62, core: 60, g: 0.6, art: rng => sunSvg(['#fffff0', '#fff1a8', '#ffd166'], '#fff1c9') + dustSvg(rng), anim: 'tabby' },
  eta: { r: 62, core: 28, g: 0.8, lab: 230, art: () => etaSvg(), anim: 'eta' },
  ring: { r: 16, core: 6, g: 0.4, range: 380, lab: 210, art: () => ringSvg() },
  pulsar: { r: 16, core: 8, g: 1, range: 420, lab: 96, art: () => pulsarSvg(true) },
  quasar: { r: 40, core: 11, g: 0.9, range: 720, lab: 150, art: () => quasarSvg() },
};

export function mountUniverse(ctx) {
  const { stage, world, ship, shipR, speed, rm, say, kick, onWarp, onMine } = ctx;
  const W = WORLD;
  const H = WORLD;

  const neb = document.createElement('div');
  neb.className = 'ps-uni-layer';
  const gal = document.createElement('div');
  gal.className = 'ps-uni-layer';
  const cv = document.createElement('canvas');
  cv.className = 'ps-uni-stars';
  cv.setAttribute('aria-hidden', 'true');
  stage.prepend(cv);
  stage.prepend(gal);
  stage.prepend(neb);
  const g2 = cv.getContext('2d');
  const sectorEl = document.createElement('div');
  sectorEl.className = 'ps-uni-sector';
  world.prepend(sectorEl);
  const beam = document.createElement('div');
  beam.className = 'ps-uni-beam';
  beam.hidden = true;

  const info = document.createElement('div');
  info.className = 'ps-uni-info';
  info.innerHTML = '<canvas width="192" height="192" aria-hidden="true"></canvas><b></b>';
  stage.appendChild(info);
  const mm = info.firstElementChild;
  const mg = mm.getContext('2d');
  const nameEl = info.lastElementChild;

  let index = 0;
  let bodies = [];
  let rocks = [];
  let anims = [];
  let sector = SECTORS[0];
  let stars = null;
  let starKey = '';
  let lenses = [];
  let time = 0;
  const visited = new Set();
  const warp = { t: 0, to: -1, done: true };
  let locked = false;
  let flashTimer = 0;
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  };

  const flash = (cls, ms) => {
    stage.classList.add(cls);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => stage.classList.remove(cls), ms);
  };

  const makeStars = (w, h) => {
    const rng = seeded(`stars|${w}|${h}`);
    const colors = ['#ffffff', '#cfe3ff', '#fff1c9', '#ffd6e0', '#ffffff'];
    const make = (count, big) => Array.from({ length: count }, () => ({ u: rng(), v: rng(), r: big ? 1.4 + rng() * 1.6 : 0.8 + rng() * 0.9, a: (big ? 0.7 : 0.35) + rng() * 0.3, c: pick(rng, colors), ph: rng() * 6 }));
    const area = w * h;
    stars = [
      { p: 0.12, list: make(Math.round(150 + area / 5000), false) },
      { p: 0.3, list: make(Math.round(70 + area / 11000), false) },
      { p: 0.58, list: make(Math.round(30 + area / 26000), true) },
    ];
  };

  // ---------- effects ----------
  const fx = (cls, x, y, color, vars = '') => {
    const node = document.createElement('div');
    node.className = `ps-uni-fx ${cls}`;
    node.style.cssText = `left:${x}px;top:${y}px;--c:${color};${vars}`;
    sectorEl.appendChild(node);
    later(() => node.remove(), 6500);
    return node;
  };
  const bang = (x, y, color, scale) => fx('ps-uni-bang', x, y, color, `--s:${scale}`);
  const waves = (x, y, color) => [0, 0.7, 1.4].forEach(d => fx('ps-uni-wave', x, y, color, `--d:${d}s`));
  const shakeNear = (x, y, amount) => { if (Math.hypot(ship.x - x, ship.y - y) < 1600) kick?.(amount); };
  const sayNear = (x, y, text) => { if (Math.hypot(ship.x - x, ship.y - y) < 1700) say(text, readMs(text, 4500)); };

  // ---------- sector building ----------
  const placeFree = (rng, placed, r, gap, avoid) => {
    let x = W / 2;
    let y = H / 2;
    for (let tries = 0; tries < 160; tries++) {
      x = r + 200 + rng() * (W - 2 * r - 400);
      y = r + 200 + rng() * (H - 2 * r - 400);
      const fine = placed.every(p => Math.hypot(x - p.x, y - p.y) > r + (p.reserve ?? p.r) + gap)
        && (!avoid || Math.hypot(x - avoid.x, y - avoid.y) > r + avoid.r);
      if (fine) break;
    }
    return { x, y };
  };

  const place = b => {
    b.node.style.left = `${b.x}px`;
    b.node.style.top = `${b.y}px`;
  };

  const addLabel = (node, text, offset) => {
    const label = document.createElement('i');
    label.className = 'ps-uni-label';
    label.textContent = text;
    label.style.top = `${offset + 14}px`;
    node.appendChild(label);
    return label;
  };

  const makeBody = (b, artHtml, core, cls = '') => {
    const sizePx = b.r * 200 / core;
    const node = document.createElement('div');
    node.className = `ps-uni-body ps-uni-${b.kind} ${cls}`;
    node.style.cssText = `left:${b.x ?? 0}px;top:${b.y ?? 0}px;width:0;height:0`;
    const art = document.createElement('div');
    art.className = 'ps-uni-art';
    art.style.cssText = `width:${sizePx}px;height:${sizePx}px;margin:${-sizePx / 2}px 0 0 ${-sizePx / 2}px`;
    art.innerHTML = artHtml;
    node.appendChild(art);
    b.hit = Math.max(b.r, Math.min(sizePx * 0.375, 260));
    if (GLOW[b.type]) art.style.filter = `drop-shadow(0 0 ${Math.round(Math.min(b.r, 120) * 0.35)}px ${GLOW[b.type]}66)`;
    if (b.name) b.labelEl = addLabel(node, b.name, b.lab ?? (b.kind === 'hole' ? b.r * 2.2 : b.r));
    sectorEl.appendChild(node);
    b.node = node;
    b.art = art;
    return art;
  };

  const loadSector = (next, from) => {
    index = next;
    sector = SECTORS[index];
    const rng = seeded(`uni|${sector.id}`);
    sectorEl.replaceChildren();
    sectorEl.appendChild(beam);
    beam.hidden = true;
    neb.replaceChildren();
    gal.replaceChildren();
    bodies = [];
    rocks = [];
    anims = [];
    const start = { x: W / 2, y: H / 2, r: 520 };

    const add = (b) => {
      const spot = placeFree(rng, bodies, b.reserve ?? b.r, b.gap ?? 300, from == null && b.kind !== 'worm' ? start : null);
      Object.assign(b, spot);
      bodies.push(b);
    };
    const build = {
      planet: s => {
        const [lo, hi] = SIZE[s.type];
        const r = Math.round(lo + rng() * (hi - lo));
        const b = { kind: 'planet', type: s.type, r, name: s.name, fact: s.fact, g: 0.5, range: r * 4.2, lens: r * 1.35, gap: 260 };
        add(b);
        makeBody(b, planetArt(s.type, rng), 60);
      },

      star: s => {
        const def = STARS[s.type];
        const b = { kind: 'star', type: s.type, r: def.r, name: s.name, fact: s.fact, g: def.g, range: def.range ?? def.r * 5, lens: def.r * 1.3, lab: def.lab, gap: 320 };
        add(b);
        makeBody(b, def.art(rng), def.core, def.anim ? 'is-js' : '');
        if (def.anim === 'eta') {
          let shell = 6;
          anims.push((dt, t) => {
            b.art.style.transform = `scale(${(1 + 0.045 * Math.sin(t * 1.7)).toFixed(3)})`;
            shell -= dt;
            if (shell <= 0) { shell = 22; fx('ps-uni-wave', b.x, b.y, '#ffb347', '--d:0s'); }
          });
        } else if (def.anim === 'tabby') {
          // The star's light dips unevenly, like the real KIC 8462852.
          anims.push((dt, t) => {
            const dip = Math.max(0, Math.sin(t * 0.9)) ** 6 + Math.max(0, Math.sin(t * 2.3 + 1)) ** 10 * 0.5;
            b.art.style.opacity = (1 - Math.min(0.6, dip * 0.6)).toFixed(2);
          });
        }
      },

      belt: s => {
        const b = { kind: 'belt', type: 'belt', r: s.rout, name: s.name, fact: s.fact, g: 0, range: 0, gap: 140, near: s.rout + 110 };
        add(b);
        const node = document.createElement('div');
        node.className = 'ps-uni-body ps-uni-beltlabel';
        node.style.cssText = `left:${b.x}px;top:${b.y}px;width:0;height:0`;
        addLabel(node, s.name, s.rout + 6);
        sectorEl.appendChild(node);
        b.node = node;
        for (let i = 0; i < s.n; i++) {
          const rad = s.rin + rng() * (s.rout - s.rin);
          const size = 10 + rng() * 14;
          const el = document.createElement('div');
          el.className = 'ps-uni-rock';
          el.style.cssText = `width:${size * 2}px;height:${size * 2}px;margin:${-size}px 0 0 ${-size}px`;
          el.innerHTML = rockSvg(rng, s.metal);
          sectorEl.appendChild(el);
          rocks.push({ belt: b, rad, ang: rng() * TAU, w: (0.05 + rng() * 0.03) * (s.rin / rad), r: size, spin: rng() * TAU, spinV: (rng() - 0.5) * 1.2, x: b.x, y: b.y, prog: 0, dead: 0, node: el });
        }
      },

      binary: s => {
        const A = { kind: 'star', type: 'orange', r: 72, name: 'Kepler-16 A', fact: s.fact, g: 0.6, range: 620, lens: 94, gap: 200, reserve: 560 };
        const B = { kind: 'star', type: 'red', r: 44, name: 'Kepler-16 B', fact: s.fact, g: 0.4, range: 480, lens: 58, quiet: true };
        const P = { kind: 'planet', type: 'azure', r: 36, name: 'Kepler-16b', fact: 'It circles BOTH suns, like Tatooine.', g: 0.4, range: 300, lens: 48 };
        add(A);
        const c = { x: A.x, y: A.y };
        bodies.push(B, P);
        makeBody(A, sunSvg(['#ffe9b0', '#ffb347', '#e0701a'], '#ffb347'), 60);
        makeBody(B, sunSvg(['#ffd0b8', '#ff6a3a', '#8a1a14'], '#ff5a3a'), 60);
        makeBody(P, planetArt('azure', rng), 60);
        const phase = rng() * TAU;
        const step = (dt, t) => {
          const a = t * 0.42 + phase;
          A.x = c.x - Math.cos(a) * 70; A.y = c.y - Math.sin(a) * 70;
          B.x = c.x + Math.cos(a) * 150; B.y = c.y + Math.sin(a) * 150;
          const p = t * 0.13 + phase * 2;
          P.x = c.x + Math.cos(p) * 440; P.y = c.y + Math.sin(p) * 440;
          place(A); place(B); place(P);
        };
        step(0, 0);
        anims.push(step);
      },

      cygnus: s => {
        const H1 = { kind: 'hole', type: 'small', r: 34, name: s.name, fact: s.fact, g: 1.5, range: 380, lens: 34 * 3.2, gap: 300, reserve: 650 };
        const S = { kind: 'star', type: 'bluestar', r: 92, name: 'HDE 226868', fact: 'A blue supergiant. The black hole is eating it.', g: 0.6, range: 520, lens: 110, quiet: false };
        add(H1);
        const c = { x: H1.x, y: H1.y };
        bodies.push(S);
        const stream = document.createElement('div');
        stream.className = 'ps-uni-stream';
        sectorEl.appendChild(stream);
        makeBody(H1, holeArt(), 34, 'is-js');
        makeBody(S, sunSvg(['#f4fbff', '#8fd0ff', '#3d7bff'], '#6fb0ff'), 60);
        const phase = rng() * TAU;
        const step = (dt, t) => {
          const a = t * 0.11 + phase;
          S.x = c.x + Math.cos(a) * 520; S.y = c.y + Math.sin(a) * 520;
          place(S);
          const dx = c.x - S.x;
          const dy = c.y - S.y;
          const d = Math.hypot(dx, dy);
          const len = Math.max(0, d - S.r * 0.8 - 40);
          stream.style.cssText = `left:${S.x + dx / d * S.r * 0.8}px;top:${S.y + dy / d * S.r * 0.8}px;width:${len}px;transform:rotate(${Math.atan2(dy, dx)}rad)`;
        };
        step(0, 0);
        anims.push(step);
      },

      merge: s => {
        const ns = !!s.ns;
        const make = name => ({ kind: ns ? 'star' : 'hole', type: ns ? 'neutron' : 'small', r: s.r, name, fact: s.fact, g: ns ? 0.8 : 1.5, range: ns ? 380 : 340, lens: ns ? 0 : s.r * 3.2, gap: 300 });
        const A = make(s.name);
        const B = make('');
        B.quiet = true;
        A.reserve = s.sep + 170;
        add(A);
        const c = { x: A.x, y: A.y };
        bodies.push(B);
        for (const b of [A, B]) makeBody(b, ns ? pulsarSvg(false) : holeArt(), ns ? 8 : 34, 'is-js');
        const POST = ns ? 7 : 9;
        let u = 0;
        let ang = rng() * TAU;
        let post = 0;
        let cloud = null;
        const finish = () => {
          A.off = B.off = false;
          A.node.style.display = B.node.style.display = '';
          A.r = s.r;
          A.lens = ns ? 0 : s.r * 3.2;
          A.art.style.transform = '';
          cloud?.remove();
          cloud = null;
          u = 0;
        };
        const crash = () => {
          A.x = B.x = c.x; A.y = B.y = c.y;
          place(A);
          B.off = true;
          B.node.style.display = 'none';
          if (ns) {
            A.off = true;
            A.node.style.display = 'none';
            cloud = fx('ps-uni-cloud', c.x, c.y, '#ffc53d');
            bang(c.x, c.y, '#fff4c0', 9);
            waves(c.x, c.y, '#ffd166');
          } else {
            bang(c.x, c.y, '#cfe8ff', 7);
            waves(c.x, c.y, '#8fd0ff');
          }
          shakeNear(c.x, c.y, 6);
          sayNear(c.x, c.y, s.msg);
          post = POST;
        };
        anims.push(dt => {
          if (post > 0) {
            post -= dt;
            if (post <= 0) finish();
            else if (!ns) {
              const k = Math.min(1, (POST - post) / 0.8);
              A.r = s.r * (1 + 0.5 * k);
              A.lens = A.r * 3.2;
              A.art.style.transform = `scale(${1 + 0.5 * k})`;
            }
            return;
          }
          u += dt / s.T;
          const sep = s.sep * Math.max(0, 1 - u) ** 0.4;
          ang += dt * (0.5 + 0.26 * (s.sep / Math.max(sep, 20)) ** 1.5);
          if (sep <= s.r * 1.8 || u >= 1) { crash(); return; }
          A.x = c.x + Math.cos(ang) * sep / 2; A.y = c.y + Math.sin(ang) * sep / 2;
          B.x = c.x - Math.cos(ang) * sep / 2; B.y = c.y - Math.sin(ang) * sep / 2;
          place(A); place(B);
        });
        A.x = c.x + s.sep / 2; B.x = c.x - s.sep / 2; B.y = c.y;
        place(A); place(B);
      },

      collapse: s => {
        const S = { kind: 'star', type: 'red', r: 92, name: s.name, fact: s.fact, g: 0.5, range: 600, lens: 120, gap: 320 };
        add(S);
        makeBody(S, sunSvg(['#ffd0a8', '#ff5a2a', '#a01a14'], '#ff4a2a'), 60, 'is-js');
        const rem = document.createElement('div');
        rem.className = 'ps-uni-art';
        rem.style.cssText = 'width:400px;height:400px;margin:-200px 0 0 -200px;display:none';
        rem.innerHTML = pulsarSvg(true);
        S.node.insertBefore(rem, S.labelEl);
        let t = 0;
        let popped = false;
        let pushed = false;
        let ring = null;
        const restart = () => {
          t = 0; popped = pushed = false;
          ring?.remove(); ring = null;
          S.r = 92; S.g = 0.5; S.lens = 120;
          S.labelEl.textContent = s.name;
          S.art.style.display = '';
          rem.style.display = 'none';
          S.art.style.transform = '';
        };
        anims.push(dt => {
          t += dt;
          if (t < 14) {
            const k = 1 + (0.025 + t * 0.006) * Math.sin(t * (1.4 + t * 0.35));
            const jx = t > 10 ? (Math.random() - 0.5) * (t - 10) * 1.2 : 0;
            S.art.style.transform = `translate(${jx}px,${jx}px) scale(${k.toFixed(3)})`;
            S.r = 92 * k;
          } else if (t < 15.2) {
            const f = (t - 14) / 1.2;
            const k = 1 - 0.88 * f * f;
            S.art.style.transform = `scale(${k.toFixed(3)})`;
            S.r = Math.max(16, 92 * k);
          } else if (!popped) {
            popped = true;
            S.art.style.display = 'none';
            rem.style.display = '';
            S.r = 16; S.g = 1; S.lens = 0;
            S.labelEl.textContent = 'Neutron star';
            bang(S.x, S.y, '#ffffff', 10);
            ring = fx('ps-uni-shock', S.x, S.y, '#ffe6b0');
            shakeNear(S.x, S.y, 9);
            sayNear(S.x, S.y, 'Supernova! The star collapsed, then blew up.');
          } else if (ring) {
            const R = (t - 15.2) * 420;
            if (R > 1900) { ring.remove(); ring = null; return; }
            ring.style.width = ring.style.height = `${R * 2}px`;
            ring.style.opacity = (1 - R / 1900).toFixed(2);
            const d = Math.hypot(ship.x - S.x, ship.y - S.y);
            if (!pushed && Math.abs(d - R) < 80) {
              pushed = true;
              ship.vx += (ship.x - S.x) / d * 540;
              ship.vy += (ship.y - S.y) / d * 540;
              kick?.(9);
            }
          }
          if (t >= 27) restart();
        });
      },

      sgr: s => {
        const H1 = { kind: 'hole', type: 'large', r: 80, name: s.name, fact: s.fact, g: 1.5, range: 900, lens: 80 * 3.2, gap: 300, reserve: 560 };
        const S2 = { kind: 'star', type: 'bluestar', r: 20, name: 'S2', fact: 'A star that whips around it every 16 years.', g: 0.3, range: 200, lens: 0, quiet: false };
        add(H1);
        const c = { x: H1.x, y: H1.y };
        bodies.push(S2);
        makeBody(H1, holeArt(), 34, 'is-js');
        makeBody(S2, sunSvg(['#f4fbff', '#8fd0ff', '#3d7bff'], '#6fb0ff'), 60);
        const e = 0.55;
        const a = 330;
        const rot = rng() * TAU;
        const step = (dt, t) => {
          let E = (t / 22 * TAU) % TAU;
          const M = E;
          for (let i = 0; i < 5; i++) E = M + e * Math.sin(E);
          const ox = a * (Math.cos(E) - e);
          const oy = a * Math.sqrt(1 - e * e) * Math.sin(E);
          S2.x = c.x + ox * Math.cos(rot) - oy * Math.sin(rot);
          S2.y = c.y + ox * Math.sin(rot) + oy * Math.cos(rot);
          place(S2);
        };
        step(0, 0);
        anims.push(step);
      },
    };

    for (const spec of sector.objects) build[spec.t](spec);

    const links = LINKS.filter(pair => pair.includes(index)).map(pair => (pair[0] === index ? pair[1] : pair[0]));
    for (const to of links) {
      const dest = SECTORS[to];
      const b = { kind: 'worm', type: 'worm', r: WORM_R, to, name: `Wormhole to ${dest.name}`, fact: 'A tunnel through space (made up!). Fly in.', g: 0, range: 0, lens: WORM_R * 1.7, gap: 420, color: dest.accent };
      add(b);
      const node = document.createElement('div');
      node.className = 'ps-uni-body ps-uni-worm';
      node.style.cssText = `left:${b.x}px;top:${b.y}px;--c:${dest.accent}`;
      node.innerHTML = '<span class="ps-uni-worm-core"></span><i></i><i></i>';
      addLabel(node, b.name, b.r + 8);
      sectorEl.appendChild(node);
      b.node = node;
    }

    // Nebula clouds and far galaxies sit on slow parallax layers behind everything.
    const vw = stage.clientWidth || 800;
    const vh = stage.clientHeight || 600;
    for (let i = 0; i < 9; i++) {
      const size = 620 + rng() * 760;
      const color = sector.tint[i % sector.tint.length];
      const dark = i % 4 === 3;
      const blob = document.createElement('div');
      blob.className = 'ps-uni-neb';
      blob.style.cssText = `width:${size}px;height:${size * (0.6 + rng() * 0.4)}px;left:${-300 + rng() * (W * 0.3 + vw + 300)}px;top:${-300 + rng() * (H * 0.3 + vh + 300)}px;background:radial-gradient(closest-side,${dark ? '#000000cc' : `${color}55`},${dark ? '#00000055' : `${color}22`} 55%,transparent);transform:rotate(${Math.round(rng() * 180)}deg)`;
      neb.appendChild(blob);
    }
    for (let i = 0; i < sector.galaxies; i++) {
      const size = 140 + rng() * 170;
      const node = document.createElement('div');
      node.className = 'ps-uni-galaxy';
      node.style.cssText = `width:${size}px;height:${size}px;left:${rng() * (W * 0.12 + vw)}px;top:${rng() * (H * 0.12 + vh)}px;transform:rotate(${Math.round(rng() * 180)}deg) scaleY(${(0.35 + rng() * 0.4).toFixed(2)})`;
      node.innerHTML = galaxyArt(rng, sector.tint[i % sector.tint.length]);
      gal.appendChild(node);
    }
    lenses = bodies.filter(b => b.lens);

    if (from == null) {
      ship.x = W / 2;
      ship.y = H / 2;
      ship.vx = ship.vy = 0;
    } else {
      const back = bodies.find(b => b.kind === 'worm' && b.to === from) ?? bodies[0];
      const a = rng() * TAU;
      const dist = back.r + 150;
      ship.x = clamp(back.x + Math.cos(a) * dist, 80, W - 80);
      ship.y = clamp(back.y + Math.sin(a) * dist, 80, H - 80);
      ship.vx = Math.cos(a) * 140;
      ship.vy = Math.sin(a) * 140;
    }
    for (const b of bodies) b.seen = !!b.quiet;
    nameEl.textContent = `${sector.name} · ${visited.size + (visited.has(index) ? 0 : 1)} of ${SECTORS.length} sectors`;
    const fresh = !visited.has(index);
    visited.add(index);
    const intro = fresh ? `${sector.name}: ${sector.intro}` : `Back in the ${sector.name}.`;
    say(intro, readMs(intro, 4500));
  };

  // ---------- gravity and hazards ----------
  const pull = () => {
    if (locked) return { x: 0, y: 0 };
    let px = 0;
    let py = 0;
    for (const b of bodies) {
      if (!b.g || b.off) continue;
      const dx = b.x - ship.x;
      const dy = b.y - ship.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d >= b.range) continue;
      const k = (1 - d / b.range) ** 2 * b.g * speed;
      px += (dx / d) * k;
      py += (dy / d) * k;
    }
    return { x: px, y: py };
  };

  const startWarp = to => {
    locked = true;
    warp.t = WARP_SECONDS;
    warp.to = to;
    warp.done = false;
    stage.classList.add('is-warping');
    kick?.(4);
  };

  const fling = b => {
    const rng = Math.random;
    let x = ship.x;
    let y = ship.y;
    for (let tries = 0; tries < 16; tries++) {
      const a = rng() * TAU;
      x = clamp(b.x + Math.cos(a) * 1150, 200, W - 200);
      y = clamp(b.y + Math.sin(a) * 1150, 200, H - 200);
      if (bodies.every(o => o.off || o.kind === 'belt' || Math.hypot(x - o.x, y - o.y) > o.r + 220)) break;
    }
    const a = Math.atan2(y - b.y, x - b.x);
    ship.x = x;
    ship.y = y;
    ship.vx = Math.cos(a) * 320;
    ship.vy = Math.sin(a) * 320;
    flash('is-flung', 700);
    kick?.(8);
    const flung = 'Whoa! The black hole flung you out! Stars bend around it because gravity bends light.';
    say(flung, readMs(flung, 5000));
  };

  // Returns true when the ship hit something (a door, a hole or a solid body), so a fast sweep can stop there.
  const hazards = () => {
    let hit = false;
    for (const b of bodies) {
      if (b.off) continue;
      const dx = ship.x - b.x;
      const dy = ship.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      if (!b.seen && d < (b.near ?? b.r * 2.2 + 150)) {
        b.seen = true;
        if (ctx.intro) ctx.intro(b); else say(factText(b), readMs(factText(b)));
        ctx.onDiscover?.(b);
      }
      if (b.kind === 'worm') {
        if (d < 44) { startWarp(b.to); return true; }
      } else if (b.kind === 'hole') {
        if (d < b.r * 0.72) { fling(b); return true; }
      } else if (b.kind !== 'belt' && d < b.r + shipR * 0.7) {
        const nx = dx / d;
        const ny = dy / d;
        ship.x = b.x + nx * (b.r + shipR * 0.7);
        ship.y = b.y + ny * (b.r + shipR * 0.7);
        const vn = ship.vx * nx + ship.vy * ny;
        if (vn < 0) { ship.vx -= 1.5 * vn * nx; ship.vy -= 1.5 * vn * ny; }
        kick?.(3);
        hit = true;
      }
    }
    return hit;
  };

  // The ship's mining beam locks the nearest rock in range and cracks it for ore.
  const mining = dt => {
    let best = null;
    let bestGap = MINE_RANGE;
    for (const k of rocks) {
      k.ang += k.w * dt;
      k.spin += k.spinV * dt;
      k.x = k.belt.x + Math.cos(k.ang) * k.rad;
      k.y = k.belt.y + Math.sin(k.ang) * k.rad;
      if (k.dead > 0) {
        k.dead -= dt;
        if (k.dead <= 0) { k.prog = 0; k.node.style.display = ''; }
        continue;
      }
      const gap = Math.hypot(k.x - ship.x, k.y - ship.y) - k.r;
      if (!locked && gap < bestGap) { bestGap = gap; best = k; }
    }
    for (const k of rocks) {
      if (k.dead > 0) continue;
      if (k === best) k.prog += dt / MINE_TIME;
      else k.prog = Math.max(0, k.prog - dt * 0.8);
      k.node.style.transform = `translate3d(${k.x}px,${k.y}px,0) rotate(${k.spin.toFixed(2)}rad) scale(${(1 - k.prog * 0.4).toFixed(2)})`;
      k.node.classList.toggle('is-mined', k === best);
    }
    if (best && best.prog >= 1) {
      best.dead = 7;
      best.node.style.display = 'none';
      onMine?.(best.x, best.y);
      kick?.(2);
      best = null;
    }
    if (best) {
      const dx = best.x - ship.x;
      const dy = best.y - ship.y;
      beam.hidden = false;
      beam.style.cssText = `left:${ship.x}px;top:${ship.y}px;width:${Math.hypot(dx, dy)}px;transform:rotate(${Math.atan2(dy, dx)}rad)`;
    } else {
      beam.hidden = true;
    }
  };

  // ---------- drawing ----------
  const draw = (cam, clock) => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const key = `${w}x${h}`;
    if (!stars || starKey !== key) { makeStars(w, h); starKey = key; }
    neb.style.transform = `translate3d(${-cam.x * 0.3}px,${-cam.y * 0.3}px,0)`;
    gal.style.transform = `translate3d(${-cam.x * 0.12}px,${-cam.y * 0.12}px,0)`;
    g2.clearRect(0, 0, w, h);
    const live = lenses.filter(b => !b.off && b.lens).map(b => ({ x: b.x - cam.x, y: b.y - cam.y, te: b.lens, hole: b.kind === 'hole', r: b.r }))
      .filter(l => l.x > -l.te * 3 && l.x < w + l.te * 3 && l.y > -l.te * 3 && l.y < h + l.te * 3);
    const T = Math.max(w, h) + 300;
    for (const layer of stars) {
      for (const s of layer.list) {
        let x = mod(s.u * T - cam.x * layer.p, T);
        let y = mod(s.v * T - cam.y * layer.p, T);
        if (x > w + 40 || y > h + 40) continue;
        let alpha = s.a * (layer.p > 0.5 && !rm ? 0.78 + 0.22 * Math.sin(clock * 2 + s.ph) : 1);
        for (const l of live) {
          const dx = x - l.x;
          const dy = y - l.y;
          const r = Math.hypot(dx, dy) || 0.001;
          if (r > l.te * 4) continue;
          const root = Math.sqrt(r * r / 4 + l.te * l.te);
          const r1 = r / 2 + root;
          const r2 = r / 2 - root;
          if (l.hole || r < l.te * 2.5) {
            const sx = l.x + dx / r * r2;
            const sy = l.y + dy / r * r2;
            if (Math.hypot(sx - l.x, sy - l.y) > l.r && sx > -4 && sx < w + 4 && sy > -4 && sy < h + 4) {
              g2.globalAlpha = alpha * 0.5;
              g2.fillStyle = s.c;
              g2.fillRect(sx, sy, s.r * 1.2, s.r * 1.2);
            }
          }
          x = l.x + dx / r * r1;
          y = l.y + dy / r * r1;
        }
        g2.globalAlpha = alpha;
        g2.fillStyle = s.c;
        g2.fillRect(x, y, s.r * 1.4, s.r * 1.4);
      }
    }
    g2.globalAlpha = 1;
    for (const l of live) {
      if (!l.hole) continue;
      g2.strokeStyle = 'rgba(255,224,170,.28)';
      g2.lineWidth = 2;
      g2.beginPath();
      g2.arc(l.x, l.y, l.te, 0, TAU);
      g2.stroke();
    }

    // radar
    const size = mm.width;
    const k = size / W;
    mg.clearRect(0, 0, size, size);
    mg.fillStyle = 'rgba(4,6,16,.82)';
    mg.fillRect(0, 0, size, size);
    mg.strokeStyle = 'rgba(255,255,255,.25)';
    mg.lineWidth = 2;
    mg.strokeRect(1, 1, size - 2, size - 2);
    for (const b of bodies) {
      if (b.off) continue;
      const x = b.x * k;
      const y = b.y * k;
      if (b.kind === 'worm') {
        mg.strokeStyle = b.color;
        mg.lineWidth = 3;
        mg.beginPath();
        mg.arc(x, y, 7, 0, TAU);
        mg.stroke();
      } else if (b.kind === 'belt') {
        mg.strokeStyle = 'rgba(159,216,255,.7)';
        mg.lineWidth = 2;
        mg.setLineDash([3, 4]);
        mg.beginPath();
        mg.arc(x, y, b.r * k * 0.8, 0, TAU);
        mg.stroke();
        mg.setLineDash([]);
      } else if (b.kind === 'hole') {
        mg.fillStyle = '#000';
        mg.strokeStyle = '#ffb347';
        mg.lineWidth = 2.5;
        mg.beginPath();
        mg.arc(x, y, 5, 0, TAU);
        mg.fill();
        mg.stroke();
      } else {
        mg.fillStyle = MAP_COLOR[b.type] ?? '#fff';
        mg.beginPath();
        mg.arc(x, y, Math.max(3, b.r * k * 1.1), 0, TAU);
        mg.fill();
      }
    }
    mg.strokeStyle = 'rgba(255,255,255,.55)';
    mg.lineWidth = 1.5;
    mg.strokeRect(cam.x * k, cam.y * k, w * k, h * k);
    mg.fillStyle = '#fff';
    mg.beginPath();
    mg.arc(ship.x * k, ship.y * k, 4, 0, TAU);
    mg.fill();
  };

  const update = (dt, cam, clock) => {
    time += dt;
    for (const fn of anims) fn(dt, time);
    if (!warp.done) {
      warp.t -= dt;
      ship.vx *= 0.9;
      ship.vy *= 0.9;
      if (warp.t <= WARP_SECONDS * 0.5) {
        warp.done = true;
        const from = index;
        loadSector(warp.to, from);
        onWarp?.();
      }
    } else if (locked) {
      warp.t -= dt;
      if (warp.t <= 0) { locked = false; stage.classList.remove('is-warping'); }
    } else {
      hazards();
    }
    mining(dt);
    draw(cam, clock);
  };

  // The chevron points at the nearest wormhole, preferring sectors not yet visited.
  const waypoint = () => {
    let best = null;
    let bestScore = Infinity;
    for (const b of bodies) {
      if (b.kind !== 'worm') continue;
      const score = Math.hypot(b.x - ship.x, b.y - ship.y) + (visited.has(b.to) ? 2500 : 0);
      if (score < bestScore) { bestScore = score; best = b; }
    }
    return best ? { x: best.x, y: best.y } : null;
  };

  // Tap targeting: see steer.mjs.
  const pickBody = (x, y, slop) => pickBodyAt(bodies, x, y, slop);
  const nearestBody = (x, y, range) => nearestBodyTo(bodies, x, y, range);
  const ping = b => {
    if (!b) return;
    const d = Math.round((b.hit ?? b.r) * 2.2);
    fx('ps-uni-ping', b.x, b.y, sector.accent ?? '#ffd166', `width:${d}px;height:${d}px`);
  };

  loadSector(0, null);

  return {
    update,
    pull,
    waypoint,
    pickBody,
    nearestBody,
    ping,
    probe: () => (locked || !warp.done ? false : hazards()),
    sectorIntro: () => `${sector.name}: ${sector.intro}`,
    get locked() { return locked; },
    get sector() { return sector; },
    jump: to => { if (warp.done && !locked) startWarp(to); },
    bodies: () => bodies,
    rocks: () => rocks,
    // Test hook: runs the scripted object animations ahead by the given seconds.
    fastForward(seconds) {
      for (let t = 0; t < seconds; t += 0.05) { time += 0.05; for (const fn of anims) fn(0.05, time); }
    },
    destroy() {
      clearTimeout(flashTimer);
      for (const id of timers) clearTimeout(id);
      timers.clear();
      neb.remove();
      gal.remove();
      cv.remove();
      sectorEl.remove();
      info.remove();
    },
  };
}
