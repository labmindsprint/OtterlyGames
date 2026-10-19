// Drawing and question helpers shared by the PP1 (Moon Camp) question bank 3 chapters.
// Imports only the shared kits; never curriculum, questions, art or another grade.
import { QuestionRetry, wrong } from './bank-shared.mjs';
import { INK, PAPER, svg, text } from './diagram-kit.mjs';
import { darker, lighter, scatter, spacePanel, sprite } from './sprites.mjs';

export { INK, PAPER, QuestionRetry, darker, lighter, svg, text, wrong };

export const n1 = value => Math.round(value * 10) / 10;

export const HUES = {
  red: '#e5534b', orange: '#f2953a', yellow: '#f8c93e', green: '#5bb86d',
  teal: '#38a89d', blue: '#4a90d9', purple: '#9066c8', pink: '#ee8ab4',
};

// Moon Camp things drawn with the shared sprite kit, with the words used in prompts.
export const THINGS = {
  star: { sprite: 'star', one: 'star', many: 'stars' },
  coin: { sprite: 'coin', one: 'moon coin', many: 'moon coins' },
  planet: { sprite: 'planet', one: 'planet', many: 'planets' },
  moon: { sprite: 'moon', one: 'moon', many: 'moons' },
  rock: { sprite: 'asteroid', one: 'moon rock', many: 'moon rocks' },
  crystal: { sprite: 'crystal', one: 'crystal', many: 'crystals' },
  fuel: { sprite: 'fuel-cell', one: 'fuel cell', many: 'fuel cells' },
  flag: { sprite: 'flag', one: 'flag', many: 'flags' },
  alien: { sprite: 'alien', one: 'alien', many: 'aliens' },
  astro: { sprite: 'astronaut', one: 'astronaut', many: 'astronauts' },
  otter: { sprite: 'otter', one: 'otter', many: 'otters' },
  rover: { sprite: 'rover', one: 'rover', many: 'rovers' },
  rocket: { sprite: 'rocket', one: 'rocket', many: 'rockets' },
  comet: { sprite: 'comet', one: 'comet', many: 'comets' },
  ufo: { sprite: 'ufo', one: 'saucer', many: 'saucers' },
  crate: { sprite: 'crate', one: 'crate', many: 'crates' },
  satellite: { sprite: 'satellite', one: 'satellite', many: 'satellites' },
  ringed: { sprite: 'ringed-planet', one: 'ringed planet', many: 'ringed planets' },
  sun: { sprite: 'sun', one: 'sun', many: 'suns' },
};
export const thingWord = (key, count = 2) => (count === 1 ? THINGS[key].one : THINGS[key].many);

// A sprite centred on (cx, cy).
export function put(key, cx, cy, size, options = {}) {
  const thing = THINGS[key];
  if (!thing) throw new Error(`Unknown PP1 thing: ${key}`);
  return sprite(thing.sprite, n1(cx - size / 2), n1(cy - size / 2), size, options);
}

const PLATES = { sunny: '#fff0c2', sky: '#d8eafd', mint: '#dcf3e3', lavender: '#e8e1fa', paper: '#fffdf5' };
export function plate(tone, width, height, { stars = 9 } = {}) {
  if (tone === 'night') return spacePanel(0, 0, width, height, { seed: width + height, stars });
  const fill = PLATES[tone];
  return `<rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="18" fill="${fill}" stroke="${darker(fill, 0.3)}" stroke-width="3"/>`;
}

// Grey moon ground with a few craters along the bottom of a scene.
export function moonGround(width, height, top) {
  const craters = [0.14, 0.45, 0.78].map((at, index) => `<ellipse cx="${n1(width * at)}" cy="${n1(top + (height - top) * (0.4 + 0.2 * (index % 2)))}" rx="${18 + index * 4}" ry="${5 + index}" fill="#98a2b5"/>`).join('');
  return `<rect x="1.5" y="${top}" width="${width - 3}" height="${n1(height - top - 1.5)}" rx="14" fill="#b8c0cf" stroke="${INK}" stroke-width="3"/>${craters}`;
}

const polygon = points => `M${points.map(([x, y]) => `${n1(x)} ${n1(y)}`).join('L')}Z`;
const regular = (sides, cx, cy, rx, ry, start = -90) => Array.from({ length: sides }, (_, index) => {
  const angle = (start + index * 360 / sides) * Math.PI / 180;
  return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
});

// Flat shapes with a bold outline. skew slides a triangle's top point sideways; rot turns the whole shape.
export function shapeSvg(kind, cx, cy, w, h = w, { fill = HUES.yellow, rot = 0, sw = 4, dash = '', skew = 0, stroke = INK } = {}) {
  const hw = w / 2;
  const hh = h / 2;
  const style = `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}`;
  let body;
  if (kind === 'circle' || kind === 'oval') body = `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(hw)}" ry="${n1(hh)}" ${style}/>`;
  else if (kind === 'square' || kind === 'rectangle') body = `<rect x="${n1(cx - hw)}" y="${n1(cy - hh)}" width="${n1(w)}" height="${n1(h)}" rx="2" ${style}/>`;
  else {
    let d;
    if (kind === 'triangle') d = polygon([[cx + skew * w, cy - hh], [cx + hw, cy + hh], [cx - hw, cy + hh]]);
    else if (kind === 'diamond') d = polygon([[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy]]);
    else if (kind === 'pentagon') d = polygon(regular(5, cx, cy + hh * 0.06, hw, hh * 1.04));
    else if (kind === 'hexagon') d = polygon(regular(6, cx, cy, hw, hh * 0.92, 0));
    else if (kind === 'star') d = polygon(Array.from({ length: 10 }, (_, index) => {
      const k = index % 2 ? 0.47 : 1;
      const angle = (-90 + index * 36) * Math.PI / 180;
      return [cx + hw * k * Math.cos(angle), cy + hh * 0.1 + hh * k * Math.sin(angle)];
    }));
    else if (kind === 'heart') {
      const x0 = cx - hw;
      const y0 = cy - hh;
      const at = (fx, fy) => `${n1(x0 + fx * w)} ${n1(y0 + fy * h)}`;
      d = `M${at(0.5, 0.94)}C${at(0.06, 0.62)} ${at(-0.02, 0.2)} ${at(0.26, 0.1)}C${at(0.4, 0.05)} ${at(0.5, 0.18)} ${at(0.5, 0.3)}C${at(0.5, 0.18)} ${at(0.6, 0.05)} ${at(0.74, 0.1)}C${at(1.02, 0.2)} ${at(0.94, 0.62)} ${at(0.5, 0.94)}Z`;
    } else throw new Error(`Unknown PP1 shape: ${kind}`);
    body = `<path d="${d}" ${style}/>`;
  }
  return rot ? `<g transform="rotate(${n1(rot)} ${n1(cx)} ${n1(cy)})">${body}</g>` : body;
}

export function badge(cx, cy, radius, value, { fill = PAPER, size = radius * 1.15 } = {}) {
  return `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(radius)}" fill="${fill}" stroke="${INK}" stroke-width="3.5"/>${text(n1(cx), n1(cy + size * 0.35), String(value), { size: n1(size), weight: 800 })}`;
}

// A bold block arrow centred on (cx, cy).
export function arrow(cx, cy, size, dir = 'right', fill = HUES.orange) {
  const angle = { right: 0, down: 90, left: 180, up: 270 }[dir];
  const scale = size / 100;
  return `<g transform="translate(${n1(cx)} ${n1(cy)}) rotate(${angle}) scale(${Math.round(scale * 1000) / 1000})"><path d="M-44 -17H4V-38L46 0L4 38V17H-44Z" fill="${fill}" stroke="${INK}" stroke-width="${n1(4 / scale)}" stroke-linejoin="round"/></g>`;
}

// Centres of count objects that never overlap, inside the box (x, y, w, h).
export function scatterPoints(r, count, { x, y, w, h, size, gap = 8 }) {
  return scatter(r, count, { width: w, height: h, size, gap, margin: 0 }).map(point => ({ x: n1(x + point.x + size / 2), y: n1(y + point.y + size / 2) }));
}

export const listText = parts => (parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`);

// A stem with {name} slots filled from values.
export const say = (r, stems, values = {}) => r.pick(stems).replace(/\{(\w+)\}/g, (_, key) => values[key]);

// Wrong numbers, chosen so the right number is not always the middle one. candidates: [{ n, code, label?, visual? }] in priority order.
export function spreadWrongs(r, answer, candidates, { min = 1, max = 99 } = {}) {
  const seen = new Set([answer]);
  const usable = [];
  for (const item of candidates) {
    if (!Number.isInteger(item.n) || item.n < min || item.n > max || seen.has(item.n)) continue;
    seen.add(item.n);
    usable.push(item);
  }
  const lower = usable.filter(item => item.n < answer);
  const upper = usable.filter(item => item.n > answer);
  const plans = r.shuffle([['L', 'L'], ['U', 'U'], ['L', 'U']]).filter(plan => plan.filter(side => side === 'L').length <= lower.length && plan.filter(side => side === 'U').length <= upper.length);
  const taken = { L: 0, U: 0 };
  const chosen = (plans[0] ?? []).map(side => (side === 'L' ? lower : upper)[taken[side]++]);
  return [...chosen, ...usable.filter(item => !chosen.includes(item))].map(item => wrong(item.label ?? item.n, item.code, item.visual));
}

// The fields every draft returns, in the shape the game expects.
export const build = ({ family, prompt, answer, hint, explanation, givens, visual, choices }) => ({
  family, prompt, answer: String(answer), hint, explanation, proof: { family, givens },
  ...(visual ? { visual } : {}), choices,
});

// For picture options: the label of the option whose picture satisfies the test; exactly one must.
export function pickOption(question, test) {
  const matches = question.options.filter((_, index) => question.optionVisuals?.[index] && test(question.optionVisuals[index]));
  if (matches.length !== 1) throw new Error(`Expected exactly one matching picture choice, found ${matches.length}.`);
  return matches[0];
}

const PIPS = [
  [], [[1, 1]], [[0, 0], [2, 2]], [[0, 0], [1, 1], [2, 2]], [[0, 0], [2, 0], [0, 2], [2, 2]],
  [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
];
export function pips(value, cx, cy, size, { fill = PAPER, stroke = INK, sw = 1.6 } = {}) {
  const gap = size * 0.27;
  return PIPS[value].map(([col, row]) => `<circle cx="${n1(cx + (col - 1) * gap)}" cy="${n1(cy + (row - 1) * gap)}" r="${n1(size * 0.085)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`).join('');
}
const turned = (body, rot, cx, cy) => (rot ? `<g transform="rotate(${n1(rot)} ${n1(cx)} ${n1(cy)})">${body}</g>` : body);

// A coloured die face (1 to 6 dots) centred on (cx, cy).
export function die(cx, cy, size, value, { fill = HUES.red, rot = 0 } = {}) {
  const body = `<rect x="${n1(cx - size / 2)}" y="${n1(cy - size / 2)}" width="${n1(size)}" height="${n1(size)}" rx="${n1(size * 0.2)}" fill="${fill}" stroke="${INK}" stroke-width="4"/>${pips(value, cx, cy, size)}`;
  return turned(body, rot, cx, cy);
}

// A cream domino, two halves side by side, centred on (cx, cy).
export function domino(cx, cy, size, [left, right], { rot = 0 } = {}) {
  const body = `<rect x="${n1(cx - size)}" y="${n1(cy - size / 2)}" width="${n1(size * 2)}" height="${n1(size)}" rx="${n1(size * 0.2)}" fill="#fffdf5" stroke="${INK}" stroke-width="4"/>`
    + `<line x1="${n1(cx)}" y1="${n1(cy - size * 0.38)}" x2="${n1(cx)}" y2="${n1(cy + size * 0.38)}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`
    + pips(left, cx - size / 2, cy, size, { fill: INK }) + pips(right, cx + size / 2, cy, size, { fill: INK });
  return turned(body, rot, cx, cy);
}

// A fluffy cloud outlined once around its whole shape. It is about 1.03 w wide and 0.86 h tall around (cx, cy).
export function cloud(cx, cy, w, h, fill = '#ffffff') {
  const puffs = [[-0.3, 0.1, 0.28], [-0.08, -0.12, 0.36], [0.18, -0.02, 0.32], [0.34, 0.14, 0.24]].map(([dx, dy, k]) => [cx + dx * w, cy + dy * h, k * h]);
  const base = [cx - 0.34 * w, cy + 0.1 * h, 0.68 * w, 0.28 * h];
  const draw = (grow, colour) => puffs.map(([x, y, radius]) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(radius + grow)}" fill="${colour}"/>`).join('')
    + `<rect x="${n1(base[0] - grow)}" y="${n1(base[1] - grow)}" width="${n1(base[2] + grow * 2)}" height="${n1(base[3] + grow * 2)}" rx="${n1(0.14 * h + grow)}" fill="${colour}"/>`;
  return draw(3.5, INK) + draw(0, fill);
}

// A big grey moon boulder with two craters.
export function boulder(cx, cy, w, h) {
  return `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(w / 2)}" ry="${n1(h / 2)}" fill="#8c96aa" stroke="${INK}" stroke-width="4"/>`
    + `<ellipse cx="${n1(cx - w * 0.18)}" cy="${n1(cy - h * 0.16)}" rx="${n1(w * 0.2)}" ry="${n1(h * 0.14)}" fill="#a9b2c4"/>`
    + `<ellipse cx="${n1(cx + w * 0.2)}" cy="${n1(cy + h * 0.14)}" rx="${n1(w * 0.12)}" ry="${n1(h * 0.09)}" fill="#6f7a90"/>`
    + `<ellipse cx="${n1(cx - w * 0.22)}" cy="${n1(cy + h * 0.2)}" rx="${n1(w * 0.07)}" ry="${n1(h * 0.05)}" fill="#6f7a90"/>`;
}

// Things that look alike are never picked together, so a count never depends on telling them apart.
const LOOKALIKE = [['planet', 'moon', 'coin']];
export function distinctKinds(r, count, pool) {
  const out = [];
  for (const key of r.shuffle(pool)) {
    if (out.some(other => LOOKALIKE.some(group => group.includes(key) && group.includes(other)))) continue;
    out.push(key);
    if (out.length === count) return out;
  }
  throw new Error('Not enough distinct PP1 things to pick from.');
}

export const sum = values => values.reduce((total, value) => total + value, 0);

// Markup size of every sprite, so a crowded scene can ask for a retry before it breaks the picture size limit.
export const COST = Object.fromEntries(Object.keys(THINGS).map(key => [key, put(key, 0, 0, 40).length]));

// Small flat tokens for number cards: cheap to draw, so a card can hold ten of them.
export const TOKENS = ['star', 'coin', 'rock', 'crystal'];
export function token(kind, cx, cy, size) {
  const h = size / 2;
  const at = (dx, dy) => `cx="${n1(cx + dx * h)}" cy="${n1(cy + dy * h)}"`;
  if (kind === 'star') return shapeSvg('star', cx, cy, size, size, { fill: HUES.yellow, sw: 2.6 });
  if (kind === 'coin') return `<circle ${at(0, 0)} r="${n1(h)}" fill="#f5b83d" stroke="${INK}" stroke-width="2.6"/><circle ${at(0, 0)} r="${n1(h * 0.58)}" fill="#ffd978" stroke="#b97a14" stroke-width="2"/>`;
  if (kind === 'rock') return `<circle ${at(0, 0)} r="${n1(h)}" fill="#98a3b8" stroke="${INK}" stroke-width="2.6"/><circle ${at(-0.25, -0.2)} r="${n1(h * 0.22)}" fill="#7b869c"/><circle ${at(0.3, 0.25)} r="${n1(h * 0.14)}" fill="#7b869c"/>`;
  return shapeSvg('diamond', cx, cy, size * 0.82, size, { fill: '#6fd0e6', sw: 2.6 });
}

// A frame of columns x rows squares with the first `filled` squares holding a token.
export function tokenFrame(filled, x, y, cell, kind, { columns = 5, rows = 2 } = {}) {
  const parts = [];
  for (let index = 0; index < columns * rows; index++) {
    const cx = x + (index % columns) * cell;
    const cy = y + Math.floor(index / columns) * cell;
    parts.push(`<rect x="${n1(cx)}" y="${n1(cy)}" width="${cell}" height="${cell}" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>`);
    if (index < filled) parts.push(token(kind, cx + cell / 2, cy + cell / 2, cell * 0.72));
  }
  parts.push(`<rect x="${n1(x)}" y="${n1(y)}" width="${columns * cell}" height="${rows * cell}" fill="none" stroke="${INK}" stroke-width="3.5"/>`);
  return parts.join('');
}
