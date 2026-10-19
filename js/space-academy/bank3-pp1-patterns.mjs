// PP1 chapter: Pattern planets. Six pattern families, each with its own picture and its own ask.
import { MISCONCEPTIONS as SHARED, answerChoices, choiceCount } from './bank-shared.mjs';
import { ORANGE, text } from './diagram-kit.mjs';
import {
  HUES, INK, PAPER, QuestionRetry, THINGS, arrow, build, darker, distinctKinds, lighter, moonGround, n1, pickOption, plate, put, say, shapeSvg,
  spreadWrongs, svg, wrong,
} from './bank3-pp1-art.mjs';

export const MISCONCEPTIONS = {
  'pp1-pat-same': { title: 'Do not copy the neighbour', message: 'Do not just copy the bead beside it. Say the whole pattern out loud.' },
  'pp1-pat-order': { title: 'Keep the order', message: 'The beads come in the same order every time. Say the pattern out loud.' },
  'pp1-pat-new': { title: 'Use the beads in the pattern', message: 'Only the beads in the pattern come back. A new bead does not belong.' },
  'pp1-row-fine': { title: 'Find the row that changes', message: 'That row repeats the same way all along. Look for the row that changes.' },
  'pp1-steps-same': { title: 'The towers change', message: 'Each tower is different. The next one is not the same as the last.' },
  'pp1-steps-off': { title: 'Count the blocks added', message: 'Check how many blocks change each time, then use that many.' },
  'pp1-turn-same': { title: 'Keep turning', message: 'It turns each time. The next one does not point the same way.' },
  'pp1-turn-back': { title: 'Turn the same way', message: 'It keeps turning the same way each time. It does not go back.' },
  'pp1-turn-side': { title: 'Look at the turn', message: 'Check how far it turns each time, then turn that far again.' },
  'pp1-twin-rhythm': { title: 'Copy the rhythm', message: 'Same pattern means the same rhythm, even with new pictures.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

const range = count => Array.from({ length: count }, (_, index) => index);
const an = word => (/^[aeiou]/i.test(word) ? 'an' : 'a');
const cap = word => word[0].toUpperCase() + word.slice(1);

const UNITS = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1] };
const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'heart'];
const BEAD_HUES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const BEAD_THINGS = ['star', 'rocket', 'flag', 'fuel', 'rock', 'alien', 'crystal', 'comet', 'crate'];
const SIZE_WORDS = { 0.5: 'small', 0.75: 'middle', 1: 'big' };
const STRAND_UNITS = { 1: ['AB'], 2: ['AB', 'AAB', 'ABB'], 3: ['ABC', 'AABB', 'AAB', 'ABB'] };
const STRAND_MODES = { 1: ['shape', 'size', 'thing', 'dots'], 2: ['shape', 'size', 'thing', 'dots'], 3: ['shape', 'size', 'thing', 'dots', 'shape'] };
const LENGTH = { AB: [5, 6], AAB: [6, 8], ABB: [6, 8], ABC: [6, 8], AABB: [6, 7] };

// Beads: shapes with a colour, big and small circles, things, or dice faces. Every kind also differs by more than colour.
function makeBeads(r, count, mode) {
  const need = count + 1;
  if (mode === 'thing') return distinctKinds(r, need, BEAD_THINGS).map(thing => ({ t: 'thing', thing, name: THINGS[thing].one }));
  if (mode === 'dots') {
    const hue = r.pick(BEAD_HUES);
    return r.shuffle([1, 2, 3, 4]).slice(0, need).map(n => ({ t: 'dots', n, hue, name: `${n} ${n === 1 ? 'dot' : 'dots'}` }));
  }
  if (mode === 'size') {
    const shape = r.pick(['circle', 'square', 'heart', 'star']);
    const hue = r.pick(BEAD_HUES);
    const sizes = r.shuffle(count === 2 ? [0.5, 1] : [0.5, 0.75, 1]);
    const spare = r.pick(SHAPES.filter(other => other !== shape));
    return [
      ...sizes.map(k => ({ t: 'shape', shape, hue, k, name: `${SIZE_WORDS[k]} ${shape}` })),
      { t: 'shape', shape: spare, hue, k: 1, name: `${hue} ${spare}` },
    ];
  }
  const shapes = r.shuffle(SHAPES);
  const hues = r.shuffle(BEAD_HUES);
  return range(need).map(index => ({ t: 'shape', shape: shapes[index], hue: hues[index], k: 1, name: `${hues[index]} ${shapes[index]}` }));
}

function dotCard(cx, cy, size, n, fill) {
  const spots = n === 4
    ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y]) => [x * size * 0.18, y * size * 0.18])
    : range(n).map(index => [(index - (n - 1) / 2) * size * 0.29, 0]);
  return `<rect x="${n1(cx - size / 2)}" y="${n1(cy - size / 2)}" width="${n1(size)}" height="${n1(size)}" rx="${n1(size * 0.2)}" fill="${fill}" stroke="${INK}" stroke-width="3"/>`
    + spots.map(([dx, dy]) => `<circle cx="${n1(cx + dx)}" cy="${n1(cy + dy)}" r="${n1(size * 0.12)}" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>`).join('');
}
function drawBead(bead, cx, cy, box) {
  if (bead.t === 'thing') return put(bead.thing, cx, cy, box * 1.12);
  if (bead.t === 'dots') return dotCard(cx, cy, box * 0.95, bead.n, HUES[bead.hue]);
  return shapeSvg(bead.shape, cx, cy, box * bead.k, box * bead.k, { fill: HUES[bead.hue] });
}
function beadVisual(bead) {
  const description = bead.t === 'dots' ? `A card with ${bead.n} ${bead.n === 1 ? 'dot' : 'dots'}.`
    : bead.t === 'thing' ? `Picture of ${an(bead.name)} ${bead.name}.` : `${cap(an(bead.name))} ${bead.name} bead.`;
  return { kind: 'v3-pp1-bead', bead, description };
}

function holeSlot(cx, cy, box) {
  const side = box + 8;
  return `<rect x="${n1(cx - side / 2)}" y="${n1(cy - side / 2)}" width="${n1(side)}" height="${n1(side)}" rx="12" fill="#fffdf5" stroke="${ORANGE}" stroke-width="4" stroke-dasharray="9 6"/>`
    + text(n1(cx), n1(cy + box * 0.2), '?', { size: Math.max(24, n1(box * 0.62)), weight: 800, fill: ORANGE });
}
// A string with one item on it per slot; a null item is the empty "?" slot.
function strandRow(items, drawItem, { x = 24, w = 432, y, box }) {
  const step = w / items.length;
  const at = index => x + step * (index + 0.5);
  const parts = [`<line x1="${n1(at(0) - step * 0.5)}" y1="${y}" x2="${n1(at(items.length - 1) + step * 0.5)}" y2="${y}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`];
  items.forEach((item, index) => parts.push(item === null ? holeSlot(at(index), y, box) : drawItem(item, at(index), y, box)));
  return parts.join('');
}
const boxFor = slots => Math.min(56, Math.floor(432 / slots * 0.82));

// The type that belongs in the single empty slot: the smallest repeat that fits every bead that is shown.
function missingType(seq) {
  const hole = seq.indexOf(null);
  for (let period = 1; period < seq.length; period++) {
    const seen = new Map();
    let fits = true;
    seq.forEach((type, index) => {
      if (type === null) return;
      if (seen.has(index % period) && seen.get(index % period) !== type) fits = false;
      seen.set(index % period, type);
    });
    if (fits && seen.has(hole % period)) return seen.get(hole % period);
  }
  throw new Error('This pattern has no clear missing bead.');
}
const repeats = seq => [1, 2, 3].some(period => seq.length >= period * 2 && seq.every((type, index) => index < period || type === seq[index - period]));

function pickBead(question, name) {
  question.options.forEach((label, index) => {
    if (question.optionVisuals?.[index]?.bead?.name !== label) throw new Error('A bead choice does not match its label.');
  });
  return pickOption(question, visual => visual.bead.name === name);
}

// 1 and 2. A row of beads: what comes next, or what fills the gap.
function makeStrand(r, level, gap) {
  const unitName = r.pick(STRAND_UNITS[level]);
  const unit = UNITS[unitName];
  const count = Math.max(...unit) + 1;
  const mode = r.pick(STRAND_MODES[level]);
  const beads = makeBeads(r, count, mode);
  let seq;
  let hole;
  if (gap) {
    const total = unit.length === 2 ? 7 : 8;
    seq = Array.from({ length: total }, (_, index) => unit[index % unit.length]);
    hole = r.int(unit.length === 2 ? 2 : unit.length, total - 2);
  } else {
    const length = r.int(...LENGTH[unitName]);
    seq = Array.from({ length: length + 1 }, (_, index) => unit[index % unit.length]);
    hole = length;
  }
  const answerType = seq[hole];
  seq[hole] = null;
  if (missingType(seq) !== answerType) throw new QuestionRetry('The pattern is not clear enough.');
  return { unit, mode, types: beads.slice(0, count), spare: beads[count], seq, hole, answerType };
}
const rowText = (types, seq) => seq.map(type => (type === null ? 'a question mark' : types[type].name)).join(', ');
const strandVisual = (kind, strand) => ({ kind, mode: strand.mode, types: strand.types, seq: strand.seq, description: `A pattern row: ${rowText(strand.types, strand.seq)}.` });

function beadChoices(r, grade, strand) {
  const { types, spare, seq, hole, answerType } = strand;
  const before = hole > 0 ? seq[hole - 1] : null;
  const pool = [];
  if (before !== null && before !== answerType) pool.push({ bead: types[before], code: 'pp1-pat-same' });
  types.forEach((bead, index) => {
    if (index !== answerType && index !== before) pool.push({ bead, code: 'pp1-pat-order' });
  });
  pool.push({ bead: spare, code: 'pp1-pat-new' });
  const wrongs = r.shuffle(pool).slice(0, choiceCount(grade) - 1).map(item => wrong(item.bead.name, item.code, beadVisual(item.bead)));
  return answerChoices(types[answerType].name, wrongs, choiceCount(grade), beadVisual(types[answerType]), KNOWN);
}
const strandHint = strand => (strand.mode === 'dots' ? 'Count the dots on each card. Say the pattern.' : 'Say the pattern out loud. It repeats again and again.');
const strandWhy = strand => `The pattern goes ${strand.unit.map(index => strand.types[index].name).join(', ')} again and again.`;

function draftNext(grade, level, r) {
  const strand = makeStrand(r, level, false);
  const answer = strand.types[strand.answerType].name;
  return build({
    family: 'pp1-pat-next',
    prompt: say(r, ['What comes next in the pattern?', 'Which one comes next?', 'Finish the pattern. What comes next?', 'Look at the pattern. What is next?']),
    answer, hint: strandHint(strand), explanation: `${strandWhy(strand)} ${cap(answer)} comes next.`,
    givens: { ask: 'next' }, visual: strandVisual('v3-pp1-pat-next', strand), choices: beadChoices(r, grade, strand),
  });
}
function draftGap(grade, level, r) {
  const strand = makeStrand(r, level, true);
  const answer = strand.types[strand.answerType].name;
  return build({
    family: 'pp1-pat-gap',
    prompt: say(r, ['Which one is missing from the pattern?', 'What goes in the empty spot?', 'Which one fills the gap?', 'Something is missing. What is it?']),
    answer, hint: strandHint(strand), explanation: `${strandWhy(strand)} ${cap(answer)} fills the gap.`,
    givens: { ask: 'gap' }, visual: strandVisual('v3-pp1-pat-gap', strand), choices: beadChoices(r, grade, strand),
  });
}
const solveStrand = question => pickBead(question, question.visual.types[missingType(question.visual.seq)].name);

// 3. Three rows of beads. Two repeat all the way along; one row slips.
function draftRows(grade, level, r) {
  const names = level === 1 ? ['AB'] : level === 2 ? ['AB', 'AAB', 'ABB'] : ['AAB', 'ABB', 'ABC', 'AB'];
  const odd = r.int(0, 2);
  const rows = range(3).map(() => {
    const unit = UNITS[r.pick(names)];
    const count = Math.max(...unit) + 1;
    const beads = makeBeads(r, count, r.pick(['shape', 'shape', 'thing', 'dots']));
    return { unit, types: beads.slice(0, count), seq: Array.from({ length: 6 }, (_, index) => unit[index % unit.length]) };
  });
  const slip = rows[odd];
  const at = r.int(slip.unit.length, 5);
  slip.seq[at] = r.pick(range(slip.types.length).filter(type => type !== slip.seq[at]));
  if (rows.some((row, index) => repeats(row.seq) !== (index !== odd))) throw new QuestionRetry('Exactly one row must break its pattern.');
  const answer = `Row ${odd + 1}`;
  const wrongs = r.shuffle(range(3).filter(index => index !== odd)).map(index => wrong(`Row ${index + 1}`, 'pp1-row-fine'));
  return build({
    family: 'pp1-pat-rows',
    prompt: say(r, ['Which row breaks the pattern?', 'One row is wrong. Which row?', 'Which row does not follow its pattern?']),
    answer, hint: 'Say each row out loud. One row changes its pattern.',
    explanation: `${answer} breaks its pattern. The other rows repeat the same way all along.`,
    givens: {},
    visual: {
      kind: 'v3-pp1-pat-rows', rows: rows.map(row => ({ types: row.types, seq: row.seq })),
      description: `3 rows of beads. ${rows.map((row, index) => `Row ${index + 1}: ${rowText(row.types, row.seq)}.`).join(' ')}`,
    },
    choices: answerChoices(answer, wrongs, choiceCount(grade), null, KNOWN),
  });
}
function solveRows(question) {
  const broken = question.visual.rows.map((row, index) => (repeats(row.seq) ? null : index + 1)).filter(Boolean);
  if (broken.length !== 1) throw new Error('Exactly one row must break the pattern.');
  return `Row ${broken[0]}`;
}

// 4. Towers of blocks that grow or shrink by the same amount each time.
function draftSteps(grade, level, r) {
  const steps = level === 1 ? [1, -1] : level === 2 ? [1, 2, -1, -2] : [2, 3, -1, -2, -3, 2];
  const step = r.pick(steps);
  const gap = level > 1 && r.int(0, 1) === 1;
  const slots = gap ? 5 : r.int(4, 5);
  const hole = gap ? r.int(1, 3) : slots - 1;
  const ceiling = level === 1 ? 8 : level === 2 ? 10 : 12;
  const low = step > 0 ? 1 : 1 - step * (slots - 1);
  const high = step > 0 ? ceiling - step * (slots - 1) : ceiling;
  if (high < low) throw new QuestionRetry('The towers would be too tall.');
  const start = r.int(low, high);
  const full = range(slots).map(index => start + step * index);
  const answer = full[hole];
  const before = full[hole - 1];
  const hues = r.shuffle(['blue', 'green', 'purple', 'orange', 'teal', 'pink']).slice(0, slots);
  const stems = gap
    ? ['How many blocks are in the missing tower?', 'One tower is missing. How many blocks?', 'How many blocks fill the gap?']
    : step > 0
      ? ['How many blocks come next?', 'How many blocks in the next tower?', 'The towers keep growing. How many next?']
      : ['The towers shrink. How many blocks next?', 'How many blocks in the next tower?', 'Count back. How many blocks next?'];
  const size = Math.abs(step);
  const heights = full.map((height, index) => (index === hole ? null : height));
  return build({
    family: 'pp1-pat-steps', prompt: say(r, stems), answer,
    hint: 'Count the blocks in each tower. How many change each time?',
    explanation: `Each tower has ${size} ${size === 1 ? 'block' : 'blocks'} ${step > 0 ? 'more' : 'fewer'} than the last. ${before} ${step > 0 ? '+' : '-'} ${size} = ${answer}.`,
    givens: {},
    visual: {
      kind: 'v3-pp1-pat-steps', heights, hues,
      description: `Towers of blocks with ${heights.map(height => (height === null ? 'a question mark' : `${height} ${height === 1 ? 'block' : 'blocks'}`)).join(', ')}.`,
    },
    choices: answerChoices(String(answer), spreadWrongs(r, answer, [
      { n: before, code: 'pp1-steps-same' }, { n: answer + 1, code: 'pp1-steps-off' }, { n: answer - 1, code: 'pp1-steps-off' },
      { n: answer + 2, code: 'pp1-steps-off' }, { n: answer - 2, code: 'pp1-steps-off' },
    ], { min: 1, max: 14 }), choiceCount(grade), null, KNOWN),
  });
}
function solveSteps(question) {
  const { heights } = question.visual;
  const known = heights.map((height, index) => [height, index]).filter(([height]) => height !== null);
  const [[v0, i0], [v1, i1]] = known;
  const step = (v1 - v0) / (i1 - i0);
  if (known.some(([height, index]) => height !== v0 + step * (index - i0))) throw new Error('The towers do not change by the same amount.');
  return String(v0 + step * (heights.indexOf(null) - i0));
}

// 5. A model row, and three rows to choose from: which one has the same pattern with new pictures?
const FIVE = { AB: '01010', AAB: '00100', ABB: '01101', ABC: '01201', AABB: '00110' };
const WRONG_FIVE = {
  2: ['01010', '00100', '01101', '00110', '01110'],
  3: ['01210', '01120', '00120', '01022'],
};
const TWIN_UNITS = { 1: ['AB'], 2: ['AB', 'AAB', 'ABB'], 3: ['ABB', 'AAB', 'ABC', 'AABB'] };
const pattern = names => {
  const order = [];
  return names.map(name => {
    if (!order.includes(name)) order.push(name);
    return order.indexOf(name);
  }).join('');
};
const cardVisual = (beads, tag, extra = {}) => ({ kind: 'v3-pp1-strand-card', beads, tag, ...extra, description: `${tag}: a row of 5 beads: ${beads.map(bead => bead.name).join(', ')}.` });
function draftTwin(grade, level, r) {
  const unitName = r.pick(TWIN_UNITS[level]);
  const code = FIVE[unitName];
  const count = Math.max(...code.split('').map(Number)) + 1;
  const shapes = r.shuffle(SHAPES);
  const hues = r.shuffle(BEAD_HUES);
  const all = range(2 * count).map(index => ({ t: 'shape', shape: shapes[index], hue: hues[index], k: 1, name: `${hues[index]} ${shapes[index]}` }));
  const model = all.slice(0, count);
  const fresh = all.slice(count);
  const row = (pickFrom, string) => string.split('').map(digit => pickFrom[Number(digit)]);
  const wrongs = r.shuffle(WRONG_FIVE[count].filter(string => string !== code)).slice(0, choiceCount(grade) - 1);
  const tags = r.shuffle(['Row A', 'Row B', 'Row C']);
  const cards = wrongs.map((string, index) => ({ tag: tags[index + 1], beads: row(fresh, string) }));
  const answerRow = row(fresh, code);
  const letters = string => string.split('').map(digit => 'ABC'[digit]).join(' ');
  return build({
    family: 'pp1-pat-twin',
    prompt: say(r, ['Which row has the same pattern?', 'Find the row that copies the top pattern.', 'Which row makes the same pattern?']),
    answer: tags[0],
    hint: 'Say the top pattern out loud. Find the row with the same rhythm.',
    explanation: `The top row goes ${letters(code)}. ${tags[0]} goes ${letters(code)} too, with new pictures.`,
    givens: {},
    visual: {
      kind: 'v3-pp1-pat-twin', types: model, seq: row(range(count), code).map(Number),
      description: `A model row of 5 beads: ${row(model, code).map(item => item.name).join(', ')}.`,
    },
    choices: answerChoices(tags[0], cards.map(card => wrong(card.tag, 'pp1-twin-rhythm', cardVisual(card.beads, card.tag))), choiceCount(grade), cardVisual(answerRow, tags[0]), KNOWN),
  });
}
function solveTwin(question) {
  const model = pattern(question.visual.seq.map(type => question.visual.types[type].name));
  question.options.forEach((label, index) => {
    if (!question.optionVisuals?.[index]?.beads || question.optionVisuals[index].tag !== label) throw new Error('A row choice does not match its label.');
  });
  return pickOption(question, visual => pattern(visual.beads.map(item => item.name)) === model);
}

// 6. An arrow or a rocket turns again and again. Which way does it point next?
const WAYS = { 0: 'up', 90: 'right', 180: 'down', 270: 'left' };
const TURNS = { 1: [180], 2: [180, 90], 3: [90, 270, 180] };
function pointer(kind, deg, hue, cx, cy, size) {
  if (kind === 'rocket') return put('rocket', cx, cy, size * 1.1, { rotate: deg });
  return arrow(cx, cy, size, WAYS[deg], HUES[hue]);
}
const pointerVisual = (kind, deg, hue) => ({ kind: 'v3-pp1-pointer', pointer: kind, deg, hue, description: `${cap(an(kind))} ${kind} pointing ${WAYS[deg]}.` });
function draftTurn(grade, level, r) {
  const delta = r.pick(TURNS[level]);
  const kind = r.pick(['arrow', 'rocket']);
  const hue = r.pick(BEAD_HUES);
  const start = r.pick([0, 90, 180, 270]);
  const shown = delta === 180 ? 5 : r.int(5, 6);
  const degs = range(shown).map(index => (start + delta * index) % 360);
  const next = (degs[shown - 1] + delta) % 360;
  const last = degs[shown - 1];
  const pool = delta === 180
    ? [{ deg: last, code: 'pp1-turn-same' }, { deg: (last + 90) % 360, code: 'pp1-turn-side' }, { deg: (last + 270) % 360, code: 'pp1-turn-side' }]
    : [{ deg: last, code: 'pp1-turn-same' }, { deg: (last + 360 - delta) % 360, code: 'pp1-turn-back' }, { deg: (last + 180) % 360, code: 'pp1-turn-side' }];
  const wrongs = r.shuffle(pool).slice(0, choiceCount(grade) - 1);
  const label = deg => `${kind} ${WAYS[deg]}`;
  const how = delta === 180 ? 'flips over each time' : delta === 90 ? 'turns a quarter to the right each time' : 'turns a quarter to the left each time';
  return build({
    family: 'pp1-pat-turn',
    prompt: say(r, ['Which way does it point next?', 'What comes next?', 'Keep turning. Which one is next?']),
    answer: label(next), hint: 'Watch how it turns each time. Keep turning the same way.',
    explanation: `The ${kind} ${how}, so it points ${WAYS[next]} next.`,
    givens: {},
    visual: {
      kind: 'v3-pp1-pat-turn', pointer: kind, hue, degs: [...degs, null],
      description: `A row of ${kind}s pointing ${degs.map(deg => WAYS[deg]).join(', ')}, then a question mark.`,
    },
    choices: answerChoices(label(next), wrongs.map(item => wrong(label(item.deg), item.code, pointerVisual(kind, item.deg, hue))), choiceCount(grade), pointerVisual(kind, next, hue), KNOWN),
  });
}
function solveTurn(question) {
  const known = question.visual.degs.filter(deg => deg !== null);
  const delta = (known[1] - known[0] + 360) % 360;
  if (known.some((deg, index) => index && (deg - known[index - 1] + 360) % 360 !== delta)) throw new Error('The turns are not all the same.');
  question.options.forEach((label, index) => {
    const visual = question.optionVisuals?.[index];
    if (!visual || label !== `${visual.pointer} ${WAYS[visual.deg]}`) throw new Error('A pointer choice does not match its label.');
  });
  const next = (known[known.length - 1] + delta) % 360;
  return pickOption(question, visual => visual.deg === next);
}

const DEFS = {
  'pp1-pat-next': { skill: 'repeat', title: 'What comes next in the bead row', draft: draftNext, solve: solveStrand },
  'pp1-pat-gap': { skill: 'repeat', title: 'Fill the gap in the bead row', draft: draftGap, solve: solveStrand },
  'pp1-pat-rows': { skill: 'repeat', title: 'Which row breaks the pattern', draft: draftRows, solve: solveRows },
  'pp1-pat-steps': { skill: 'sequence', title: 'Towers that grow or shrink', draft: draftSteps, solve: solveSteps },
  'pp1-pat-twin': { skill: 'visual', title: 'Which row has the same pattern', draft: draftTwin, solve: solveTwin },
  'pp1-pat-turn': { skill: 'visual', title: 'Which way does it turn next', draft: draftTurn, solve: solveTurn },
};
export const FAMILIES = Object.fromEntries(Object.entries(DEFS).map(([id, def]) => [id, { skill: def.skill, title: def.title }]));
export const draft = (family, grade, level, r) => DEFS[family].draft(grade, level, r);
export const solve = question => DEFS[question.family].solve(question);

function stepsPicture(v) {
  const slots = v.heights.length;
  const tallest = Math.max(...v.heights.filter(height => height !== null));
  const unit = Math.floor(Math.min(34, 180 / tallest));
  const colWidth = Math.min(72, Math.floor(420 / slots));
  const block = Math.min(colWidth - 10, 50);
  const left = (480 - slots * colWidth) / 2;
  const ground = 216;
  const body = v.heights.map((height, index) => {
    const cx = left + colWidth * (index + 0.5);
    if (height === null) {
      return `<rect x="${n1(cx - block / 2)}" y="44" width="${block}" height="${ground - 44}" rx="8" fill="#fffdf5" stroke="${ORANGE}" stroke-width="4" stroke-dasharray="9 6"/>${text(n1(cx), 140, '?', { size: 40, weight: 800, fill: ORANGE })}`;
    }
    const hue = HUES[v.hues[index]];
    return range(height).map(row => `<rect x="${n1(cx - block / 2)}" y="${ground - (row + 1) * unit}" width="${block}" height="${unit}" rx="4" fill="${row % 2 ? lighter(hue, 0.35) : hue}" stroke="${INK}" stroke-width="3"/>`).join('');
  }).join('');
  return svg(plate('sunny', 480, 250) + moonGround(480, 250, ground) + body, v.description, 480, 250);
}
function rowsPicture(v) {
  const body = v.rows.map((row, index) => {
    const y = 46 + index * 72;
    const items = row.seq.map(type => row.types[type]);
    return `<rect x="8" y="${y - 31}" width="464" height="62" rx="16" fill="#fffdf5" stroke="${darker('#fff0c2', 0.3)}" stroke-width="3"/>`
      + `<circle cx="40" cy="${y}" r="22" fill="${HUES.yellow}" stroke="${INK}" stroke-width="3.5"/>${text(40, y + 9, String(index + 1), { size: 26, weight: 800 })}`
      + strandRow(items, drawBead, { x: 74, w: 392, y, box: 46 });
  }).join('');
  return svg(plate('sunny', 480, 236) + body, v.description, 480, 236);
}
function cardPicture(v) {
  const body = `<rect x="3" y="3" width="204" height="64" rx="14" fill="#fffdf5" stroke="${INK}" stroke-width="3.5"/>`
    + strandRow(v.beads, drawBead, { x: 6, w: 198, y: 35, box: 34 });
  return svg(body, v.description, 210, 70);
}
const RENDER = {
  'v3-pp1-pat-next': v => svg(plate('sunny', 480, 124) + strandRow(v.seq.map(type => (type === null ? null : v.types[type])), drawBead, { y: 62, box: boxFor(v.seq.length) }), v.description, 480, 124),
  'v3-pp1-pat-rows': rowsPicture,
  'v3-pp1-pat-steps': stepsPicture,
  'v3-pp1-pat-twin': v => svg(plate('sunny', 480, 110) + strandRow(v.seq.map(type => v.types[type]), drawBead, { y: 55, box: 56 }), v.description, 480, 110),
  'v3-pp1-pat-turn': v => svg(plate('sunny', 480, 124) + strandRow(v.degs.map(deg => (deg === null ? null : deg)), (deg, cx, cy, box) => pointer(v.pointer, deg, v.hue, cx, cy, box), { y: 62, box: boxFor(v.degs.length) }), v.description, 480, 124),
  'v3-pp1-bead': v => svg(`<rect x="3" y="3" width="104" height="104" rx="20" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"/>${drawBead(v.bead, 55, 55, v.bead.t === 'shape' ? 66 : 74)}`, v.description, 110, 110),
  'v3-pp1-strand-card': cardPicture,
  'v3-pp1-pointer': v => svg(`<rect x="3" y="3" width="104" height="104" rx="20" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"/>${pointer(v.pointer, v.deg, v.hue, 55, 55, 78)}`, v.description, 110, 110),
};
RENDER['v3-pp1-pat-gap'] = RENDER['v3-pp1-pat-next'];
export const render = visual => RENDER[visual.kind]?.(visual) ?? null;
