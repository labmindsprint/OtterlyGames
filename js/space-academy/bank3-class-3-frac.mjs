// Class 3 fraction families written after real SOF Class 3 papers: fractions of numbers, of money and of shapes,
// mixed numbers, equal fractions, comparing and ordering. Each family has its own draft() and solve().
import { QuestionRetry } from './bank-shared.mjs';
import { person, q, hook } from './bank3-class-3-helpers.mjs';
import { LETTERS, count, fr, gcd, numberQ, reduce, rs, same, textQ } from './bank3-class-3-kit.mjs';

const WORD = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 8: 'eighth', 10: 'tenth' };
const PLURAL = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 8: 'eighths' };
const say = (n, d) => (n === 1 && WORD[d] ? `one ${WORD[d]}` : fr(n, d));
const cap = text => text[0].toUpperCase() + text.slice(1);
const shuffleIn = (r, list) => r.shuffle(list);

// Wrong fractions that are close to the right one but never worth the same amount.
function nearFractions(an, ad, extra = []) {
  const pool = [
    [ad - an, ad, 'fraction-complement'], [an, ad - an, 'whole-parts'], [an + 1, ad, 'missing-step'], [an, ad + 1, 'whole-parts'],
    [an + 1, ad + 1, 'class-3-scale-both'], [an - 1, ad, 'missing-step'], [an, ad - 1, 'fraction-denominator'], ...extra,
  ];
  const kept = [];
  for (const [n, d, code] of pool) {
    if (n < 1 || d < 2 || n >= d || same(n, d, an, ad) || kept.some(item => same(item[0], item[1], n, d))) continue;
    kept.push([n, d, code]);
  }
  return kept.map(([n, d, code]) => [fr(n, d), code]);
}

const GROUPS = [
  { intro: n => `A class has ${n} pupils.`, part: 'are girls', noun: 'girls', rest: 'boys' },
  { intro: n => `A box holds ${n} marbles.`, part: 'are red', noun: 'red marbles', rest: 'blue marbles' },
  { intro: n => `A farm has ${n} animals.`, part: 'are cows', noun: 'cows', rest: 'goats' },
  { intro: n => `A shelf has ${n} books.`, part: 'are story books', noun: 'story books', rest: 'comic books' },
  { intro: n => `A garden has ${n} flowers.`, part: 'are roses', noun: 'roses', rest: 'lilies' },
  { intro: n => `A crew has ${n} astronauts.`, part: 'are pilots', noun: 'pilots', rest: 'engineers' },
  { intro: n => `A tray holds ${n} cookies.`, part: 'have nuts', noun: 'cookies with nuts', rest: 'plain cookies' },
  { intro: n => `A hangar has ${n} rockets.`, part: 'are silver', noun: 'silver rockets', rest: 'gold rockets' },
];

function draftOfAmount(family, grade, level, r) {
  const d = level === 1 ? r.pick([2, 3, 4, 5, 10]) : r.pick([3, 4, 5, 6, 8, 10]);
  const n = level === 1 ? 1 : r.int(1, d - 1);
  const share = r.int(2, level === 3 ? 30 : 12);
  const total = d * share;
  const ask = r.pick(['part', 'rest']);
  const ctx = r.pick(GROUPS);
  const part = share * n;
  const answer = ask === 'part' ? part : total - part;
  const lead = `${ctx.intro(total)} ${cap(say(n, d))} of them ${ctx.part}.`;
  return numberQ(r, {
    family,
    prompt: ask === 'part' ? `${lead} How many ${ctx.noun} are there?` : `${lead} The others are ${ctx.rest}. How many ${ctx.rest} are there?`,
    answer,
    hint: 'Divide the whole by the number of equal parts to find one share.',
    explanation: ask === 'part'
      ? `${total} ÷ ${d} = ${share}, and ${share} × ${n} = ${part}.`
      : `${total} ÷ ${d} = ${share}, ${share} × ${n} = ${part}, and ${total} − ${part} = ${answer}.`,
    givens: { total, n, d, ask },
    wrongs: ask === 'part'
      ? [[total - part, 'fraction-complement'], [n > 1 ? share : total - share, n > 1 ? 'missing-step' : 'fraction-complement'], [part + d, 'wrong-operation']]
      : [[part, 'fraction-complement'], [share, 'missing-step'], [total - share, 'wrong-operation']],
    min: 1, max: 999,
  });
}

function solveOfAmount(question) {
  const { total, n, d, ask } = question.proof.givens;
  const part = total / d * n;
  return ask === 'part' ? part : total - part;
}

const COLOUR_SETS = [
  { bag: 'A bag', noun: 'beads', colours: ['red', 'blue', 'green', 'yellow', 'white'] },
  { bag: 'A jar', noun: 'sweets', colours: ['red', 'orange', 'green', 'purple', 'pink'] },
  { bag: 'A box', noun: 'balloons', colours: ['red', 'blue', 'green', 'yellow', 'orange'] },
  { bag: 'A tin', noun: 'crayons', colours: ['black', 'blue', 'green', 'red', 'brown'] },
  { bag: 'A sheet', noun: 'stickers', colours: ['gold', 'silver', 'blue', 'red', 'green'] },
];

function draftRest(family, grade, level, r) {
  const d = r.pick([4, 5, 6, 8, 10]);
  const a = r.int(1, d - 2);
  const b = r.int(1, d - 1 - a);
  const share = r.int(2, level === 3 ? 25 : 12);
  const total = d * share;
  const set = r.pick(COLOUR_SETS);
  const [c0, c1, c2] = r.shuffle(set.colours);
  const answer = share * (d - a - b);
  return numberQ(r, {
    family,
    prompt: `${set.bag} has ${total} ${set.noun}. ${fr(a, d)} are ${c0} and ${fr(b, d)} are ${c1}. The rest are ${c2}. How many are ${c2}?`,
    answer,
    hint: 'Add the two fractions first. Then take that fraction away from the whole.',
    explanation: `${a}/${d} + ${b}/${d} = ${a + b}/${d}, so ${d - a - b}/${d} are ${c2}. One share is ${share}, so ${answer}.`,
    givens: { total, a, b, d },
    wrongs: [[share * (a + b), 'fraction-complement'], [total - share * a, 'missing-step'], [share * (d - a), 'changed-whole']],
    min: 1, max: 999,
  });
}

const solveRest = question => {
  const { total, a, b, d } = question.proof.givens;
  return total / d * (d - a - b);
};

const SPEND = ['a book', 'a toy rocket', 'snacks', 'a kite', 'a lunch box', 'a star map', 'a cap', 'a pen set'];

function spentLeft(g) {
  if (g.kind === 'one') return g.total - g.total / g.d * g.a;
  if (g.kind === 'two') return g.total - g.total / g.d * (g.a + g.b);
  const rest = g.total - g.total / g.d;
  return rest - rest / g.d2;
}

function draftSpent(family, grade, level, r) {
  const who = person(r);
  const [item, item2] = r.shuffle(SPEND);
  let g;
  let prompt;
  let wrongs;
  let explanation;
  if (level === 1) {
    const d = r.pick([2, 4, 5, 10]);
    g = { kind: 'one', total: d * 5 * r.int(2, 8), d, a: r.pick([1, 1, d > 2 ? 3 : 1].filter(value => value < d)) };
    prompt = `${who} has ${rs(g.total)}. ${cap(say(g.a, g.d))} of it is spent on ${item}. How many rupees are left?`;
    wrongs = [[g.total / g.d * g.a, 'fraction-complement'], [g.total / g.d, 'missing-step']];
    explanation = `${g.total} ÷ ${g.d} = ${g.total / g.d}. Spent: ${g.total / g.d * g.a}. Left: ${spentLeft(g)}.`;
  } else if (level === 2) {
    const d = r.pick([4, 5, 8, 10]);
    const a = r.int(1, d - 2);
    g = { kind: 'two', total: d * 5 * r.int(2, 10), d, a, b: r.int(1, d - 1 - a) };
    prompt = `${who} has ${rs(g.total)}. ${fr(g.a, d)} of it is spent on ${item} and ${fr(g.b, d)} on ${item2}. How many rupees are left?`;
    wrongs = [[g.total / d * (g.a + g.b), 'fraction-complement'], [g.total - g.total / d * g.a, 'missing-step'], [g.total - g.total / d * g.b, 'missing-step']];
    explanation = `Spent: ${g.a + g.b}/${d} of ${g.total} = ${g.total / d * (g.a + g.b)}. Left: ${spentLeft(g)}.`;
  } else {
    const d = r.pick([2, 3, 4, 5]);
    const d2 = r.pick([2, 3, 4, 5]);
    const total = d * d2 * 5 * r.int(1, 4);
    g = { kind: 'seq', total, d, d2 };
    const rest = total - total / d;
    prompt = `${who} has ${rs(total)}. ${cap(say(1, d))} is spent on ${item}. Then ${say(1, d2)} of the money left is spent on ${item2}. How many rupees are left?`;
    wrongs = [[total - total / d - total / d2, 'changed-whole'], [rest, 'missing-step'], [rest / d2, 'fraction-complement']];
    explanation = `After ${item}: ${total} − ${total / d} = ${rest}. Then ${rest} − ${rest / d2} = ${spentLeft(g)}.`;
  }
  return numberQ(r, {
    family, prompt, answer: spentLeft(g),
    hint: level === 3 ? 'The second fraction is of the money that is left, not of the start.' : 'Find the money spent first. Then take it away from the start.',
    explanation, givens: g, wrongs, min: 1, max: 999,
  });
}

const solveSpent = question => spentLeft(question.proof.givens);

const THINGS = [['rope', 'cm'], ['ribbon', 'cm'], ['pipe', 'm'], ['road', 'km'], ['plank', 'cm'], ['cable', 'm']];

function draftWhole(family, grade, level, r) {
  const d = level === 1 ? r.pick([2, 3, 4, 5, 10]) : r.pick([3, 4, 5, 6, 8, 10]);
  const n = level === 1 ? 1 : r.int(1, d - 1);
  const share = r.int(2, level === 3 ? 30 : 12);
  const part = share * n;
  if (level === 3 || (level === 2 && r.int(0, 1))) {
    const who = person(r);
    const answer = share * (d - n);
    return numberQ(r, {
      family,
      prompt: `${who} gave away ${say(n, d)} of the stickers in a pack. That was ${part} stickers. How many stickers are left in the pack?`,
      answer,
      hint: 'The part given away shows one share. Find the whole, then subtract.',
      explanation: `${part} ÷ ${n} = ${share} for one share. The pack has ${share * d}, so ${share * d} − ${part} = ${answer} are left.`,
      givens: { n, d, part, ask: 'left' },
      wrongs: [[share * d, 'missing-step'], [part, 'fraction-complement'], [share, 'wrong-operation']],
      min: 1, max: 999,
    });
  }
  const [thing, unit] = r.pick(THINGS);
  return numberQ(r, {
    family,
    prompt: `${cap(say(n, d))} of a ${thing} is ${part} ${unit} long. How many ${unit} long is the whole ${thing}?`,
    answer: share * d,
    hint: 'First find how long one equal part is. Then count all the parts.',
    explanation: `${part} ÷ ${n} = ${share} for one part. The ${thing} has ${d} parts: ${share} × ${d} = ${share * d}.`,
    givens: { n, d, part, ask: 'whole' },
    wrongs: [[part * d, 'whole-parts'], [part * n, 'reversed-operation'], [part + d, 'wrong-operation']],
    min: 1, max: 999,
  });
}

function solveWhole(question) {
  const { n, d, part, ask } = question.proof.givens;
  const share = part / n;
  return ask === 'left' ? share * (d - n) : share * d;
}

function mixedWrongs(wholes, shaded, parts) {
  const list = [
    [wholes > 1 ? `${wholes - 1} ${shaded}/${parts}` : fr(shaded, parts), 'class-3-whole-count'],
    [`${wholes} ${parts - shaded}/${parts}`, 'fraction-complement'],
    [`${wholes + 1} ${shaded}/${parts}`, 'class-3-whole-count'],
    [`${wholes} ${shaded}/${parts - 1 > shaded ? parts - 1 : parts + 1}`, 'whole-parts'],
  ];
  return list;
}

function draftMixed(family, grade, level, r) {
  const parts = r.pick(level === 1 ? [2, 3, 4, 5, 6, 8] : [3, 4, 5, 6, 8]);
  const shaded = r.int(1, parts - 1);
  const wholes = r.int(1, level === 1 ? 3 : 4);
  const ask = level === 1 ? r.pick(['mixed', 'mixed', 'open']) : r.pick(['mixed', 'mixed', 'open', 'more']);
  const visual = {
    kind: 'v3-class-3-pies', wholes, parts, shaded,
    description: `${count(wholes, 'full circle')} and one more circle cut into ${parts} equal parts with ${shaded} of them shaded.`,
  };
  const base = { family, hint: 'Count the whole circles. Then read the fraction of the last circle.', givens: { ask }, visual };
  if (ask === 'open') {
    return textQ({
      ...base,
      prompt: 'The last circle is cut into equal parts. What fraction of that circle is not shaded?',
      answer: fr(parts - shaded, parts),
      explanation: `${shaded} of ${parts} parts are shaded, so ${parts - shaded} of ${parts} are not shaded.`,
      wrongs: nearFractions(parts - shaded, parts, [[shaded, parts, 'fraction-complement']]),
    });
  }
  if (ask === 'more') {
    return numberQ(r, {
      ...base,
      prompt: `How many more equal parts must be shaded in the last circle to make ${wholes + 1} whole circles?`,
      answer: parts - shaded,
      explanation: `The last circle has ${parts} parts and ${shaded} ${shaded === 1 ? 'is' : 'are'} shaded. ${parts} − ${shaded} = ${parts - shaded} more.`,
      wrongs: [[shaded, 'fraction-complement'], [parts, 'whole-parts'], [parts - shaded + parts, 'changed-whole']],
      min: 1, max: 12,
    });
  }
  return textQ({
    ...base,
    prompt: 'If one whole circle is 1, which number shows all the shaded parts?',
    answer: `${wholes} ${shaded}/${parts}`,
    explanation: `${count(wholes, 'whole circle')} and ${shaded}/${parts} of the last one: ${wholes} ${shaded}/${parts}.`,
    wrongs: mixedWrongs(wholes, shaded, parts),
  });
}

function solveMixed(question) {
  const { wholes, parts, shaded } = question.visual;
  const { ask } = question.proof.givens;
  if (ask === 'open') return fr(parts - shaded, parts);
  if (ask === 'more') return parts - shaded;
  return `${wholes} ${shaded}/${parts}`;
}

const GRIDS = [[2, 3], [2, 4], [3, 3], [2, 5], [3, 4], [2, 6]];

function draftCells(family, grade, level, r) {
  const [rows, cols] = r.pick(GRIDS);
  const total = rows * cols;
  const simple = level >= 2 && r.int(0, 1) === 1;
  const k = r.int(1, total - 1);
  if (simple && gcd(k, total) === 1) throw new QuestionRetry('needs a reducible fraction');
  const ask = r.pick(['shaded', 'open']);
  const shape = r.pick(['square', 'circle', 'triangle']);
  const shaded = r.shuffle(Array.from({ length: total }, (_, index) => index)).slice(0, k).sort((a, b) => a - b);
  const value = ask === 'shaded' ? k : total - k;
  const [an, ad] = simple ? reduce(value, total) : [value, total];
  const names = { square: 'squares', circle: 'circles', triangle: 'triangles' };
  return textQ({
    family,
    prompt: ask === 'shaded'
      ? `What fraction of the ${names[shape]} is shaded?${simple ? ' Give the fraction in its simplest form.' : ''}`
      : `What fraction of the ${names[shape]} is not shaded?${simple ? ' Give the fraction in its simplest form.' : ''}`,
    answer: fr(an, ad),
    hint: simple ? 'Count the shaded shapes and all the shapes. Then divide the top and bottom by the same number.' : 'Count all the shapes for the bottom. Count the shapes the question asks about for the top.',
    explanation: simple ? `${value} of ${total} shapes. Divide both by ${gcd(value, total)}: ${an}/${ad}.` : `${value} of ${total} shapes are ${ask === 'shaded' ? 'shaded' : 'not shaded'}: ${an}/${ad}.`,
    givens: { ask, simple },
    visual: {
      kind: 'v3-class-3-cells', rows, cols, shape, shaded,
      description: `${total} ${names[shape]} in ${rows} rows. ${k} of them ${k === 1 ? 'is' : 'are'} shaded and ${total - k} ${total - k === 1 ? 'is' : 'are'} not.`,
    },
    wrongs: nearFractions(an, ad, [[total - value, total, 'fraction-complement'], [value, total - value, 'whole-parts']]),
  });
}

function solveCells(question) {
  const { rows, cols, shaded } = question.visual;
  const { ask, simple } = question.proof.givens;
  const total = rows * cols;
  const value = ask === 'shaded' ? shaded.length : total - shaded.length;
  const [n, d] = simple ? reduce(value, total) : [value, total];
  return fr(n, d);
}

const SHAPES = ['circle', 'square', 'triangle', 'diamond'];
const TARGETS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [3, 8], [5, 8], [6, 8]];

function draftSets(family, grade, level, r) {
  const [n, d] = r.pick(TARGETS);
  const unit = r.pick([2, 3, 4].filter(m => d * m >= 6 && d * m <= 16));
  const totalC = d * unit;
  const shadedC = n * unit;
  const sets = [{ total: totalC, shaded: shadedC }];
  const used = new Set([`${totalC}:${shadedC}`]);
  for (let tries = 0; sets.length < 4 && tries < 60; tries++) {
    const total = level === 1 ? totalC : r.pick([6, 8, 9, 10, 12, 15, 16]);
    const shaded = r.int(1, total - 1);
    if (same(shaded, total, n, d) || used.has(`${total}:${shaded}`)) continue;
    used.add(`${total}:${shaded}`);
    sets.push({ total, shaded });
  }
  if (sets.length < 4) throw new QuestionRetry('not enough picture sets');
  const shapes = r.shuffle(SHAPES);
  const placed = r.shuffle(sets).map((set, index) => ({ ...set, shape: shapes[index] }));
  const correctIndex = placed.findIndex(set => same(set.shaded, set.total, n, d));
  const names = { circle: 'circles', square: 'squares', triangle: 'triangles', diamond: 'diamonds' };
  const wrongs = placed.map((set, index) => [LETTERS[index], set.total - set.shaded === shadedC ? 'fraction-complement' : set.shaded === n ? 'changed-whole' : 'whole-parts', index]).filter(item => item[2] !== correctIndex);
  return textQ({
    family,
    prompt: r.pick([
      `Which group has ${fr(n, d)} of its shapes shaded?`,
      `In which group is exactly ${fr(n, d)} of the shapes shaded?`,
      `Pick the group where the shaded shapes make ${fr(n, d)} of all its shapes.`,
      `Which group shows ${fr(n, d)} shaded?`,
    ]),
    answer: LETTERS[correctIndex],
    hint: 'Count all the shapes in a group, then count the shaded ones. Compare with the fraction.',
    explanation: `Group ${LETTERS[correctIndex]} has ${placed[correctIndex].shaded} shaded of ${placed[correctIndex].total} ${names[placed[correctIndex].shape]}. That is ${fr(n, d)}.`,
    givens: { n, d },
    visual: {
      kind: 'v3-class-3-sets', sets: placed,
      description: `Four groups of shapes. ${placed.map((set, index) => `${LETTERS[index]} has ${set.shaded} shaded of ${set.total} ${names[set.shape]}`).join('; ')}.`,
    },
    wrongs: wrongs.map(([value, code]) => [value, code]),
  });
}

function solveSets(question) {
  const { n, d } = question.proof.givens;
  const hits = question.visual.sets.map((set, index) => (same(set.shaded, set.total, n, d) ? LETTERS[index] : null)).filter(Boolean);
  if (hits.length !== 1) throw new Error('shape groups');
  return hits[0];
}

const equalCuts = parts => Array.from({ length: parts - 1 }, (_, index) => (index + 1) * 120 / parts);
const cutsAreEqual = cuts => cuts.every((position, index) => position === (index + 1) * 120 / (cuts.length + 1));

function unequalCuts(r, parts) {
  for (let tries = 0; tries < 40; tries++) {
    const cuts = Array.from({ length: parts - 1 }, () => r.int(1, 14) * 8 + 4).sort((a, b) => a - b);
    const gaps = [cuts[0], ...cuts.slice(1).map((position, index) => position - cuts[index]), 120 - cuts[cuts.length - 1]];
    if (new Set(cuts).size === cuts.length && Math.min(...gaps) >= 8 && !cutsAreEqual(cuts)) return cuts;
  }
  throw new QuestionRetry('uneven cuts');
}

function draftCuts(family, grade, level, r) {
  const parts = r.pick(level === 1 ? [2, 3, 4] : level === 2 ? [3, 4, 5, 6] : [4, 5, 6, 8]);
  const others = r.shuffle([2, 3, 4, 5, 6, 8].filter(value => value !== parts));
  const shapes = [
    { dir: r.pick(['v', 'h']), cuts: equalCuts(parts) },
    { dir: r.pick(['v', 'h']), cuts: unequalCuts(r, parts) },
    { dir: r.pick(['v', 'h']), cuts: equalCuts(others[0]) },
    { dir: r.pick(['v', 'h']), cuts: level === 1 ? equalCuts(others[1]) : unequalCuts(r, parts) },
  ];
  const kinds = ['correct', 'uneven', 'other', 'uneven'];
  const order = r.shuffle([0, 1, 2, 3]);
  const placed = order.map(index => shapes[index]);
  const correctIndex = order.indexOf(0);
  const wrongs = order.map((index, slot) => [LETTERS[slot], kinds[index] === 'uneven' ? 'class-3-unequal-cut' : 'whole-parts', index]).filter(item => item[2] !== 0);
  return textQ({
    family,
    prompt: `Which shape is cut into equal ${PLURAL[parts]}?`,
    answer: LETTERS[correctIndex],
    hint: 'Equal parts are exactly the same size. Count the parts too.',
    explanation: `Shape ${LETTERS[correctIndex]} has ${parts} parts that are all the same size.`,
    givens: { parts },
    visual: {
      kind: 'v3-class-3-cuts', shapes: placed,
      description: `Four rectangles. ${placed.map((shape, index) => `${LETTERS[index]} is cut by ${count(shape.cuts.length, 'line')} ${shape.dir === 'v' ? 'up and down' : 'across'} at ${shape.cuts.join(', ')} out of 120`).join('; ')}.`,
    },
    wrongs: wrongs.map(([value, code]) => [value, code]),
  });
}

function solveCuts(question) {
  const { parts } = question.proof.givens;
  const hits = question.visual.shapes.map((shape, index) => (shape.cuts.length + 1 === parts && cutsAreEqual(shape.cuts) ? LETTERS[index] : null)).filter(Boolean);
  if (hits.length !== 1) throw new Error('cut shapes');
  return hits[0];
}

function draftGreater(family, grade, level, r) {
  const kind = level === 1 ? 'den' : level === 2 ? r.pick(['num', 'half']) : r.pick(['half', 'mixed', 'num']);
  const ask = r.pick(['greatest', 'smallest']);
  let items;
  if (kind === 'den') {
    const d = r.int(6, 12);
    items = r.shuffle(Array.from({ length: d - 1 }, (_, index) => index + 1)).slice(0, 4).map(value => [value, d]);
  } else if (kind === 'num') {
    const n = r.int(1, 4);
    items = r.shuffle([5, 6, 7, 8, 9, 10, 12].filter(value => value > n)).slice(0, 4).map(value => [n, value]);
  } else if (kind === 'half') {
    const above = r.pick([true, false]);
    const dens = r.shuffle([3, 4, 5, 6, 8, 10, 12]).slice(0, 4);
    items = dens.map((d, index) => {
      const low = Array.from({ length: d }, (_, i) => i).filter(i => i >= 1 && 2 * i < d);
      const high = Array.from({ length: d }, (_, i) => i).filter(i => i >= 1 && 2 * i > d && i < d);
      const odd = index === 0 ? above : !above;
      return [r.pick(odd ? high : low), d];
    });
  } else {
    items = [];
    for (let tries = 0; items.length < 4 && tries < 80; tries++) {
      const d = r.pick([2, 3, 4, 5, 6, 8, 10]);
      const n = r.int(1, d - 1);
      if (items.every(item => Math.abs(item[0] * d - n * item[1]) >= Math.max(item[1], d) / 2 && !same(item[0], item[1], n, d))) items.push([n, d]);
    }
    if (items.length < 4) throw new QuestionRetry('fractions too close');
  }
  const text = items.map(([n, d]) => fr(n, d));
  if (new Set(text).size !== 4) throw new QuestionRetry('same fraction twice');
  let target;
  let prompt;
  let explain;
  let key;
  if (kind === 'half') {
    const above = items.filter(([n, d]) => 2 * n > d).length === 1;
    key = above ? 'above' : 'below';
    target = items.find(([n, d]) => (above ? 2 * n > d : 2 * n < d));
    prompt = `Which of these fractions is ${above ? 'greater' : 'less'} than 1/2: ${text.join(', ')}?`;
    explain = `Half of ${target[1]} is ${target[1] / 2}. The top of ${fr(...target)} is ${above ? 'more' : 'less'} than that.`;
  } else {
    key = ask;
    const better = (a, b) => (ask === 'greatest' ? a[0] * b[1] > b[0] * a[1] : a[0] * b[1] < b[0] * a[1]);
    target = items.reduce((best, item) => (better(item, best) ? item : best));
    prompt = `Which is the ${ask} fraction: ${text.join(', ')}?`;
    explain = kind === 'den' ? `The bottoms match, so the ${ask === 'greatest' ? 'biggest' : 'smallest'} top wins: ${fr(...target)}.`
      : kind === 'num' ? `With the same top, ${ask === 'greatest' ? 'fewer' : 'more'} equal parts make a ${ask === 'greatest' ? 'bigger' : 'smaller'} piece: ${fr(...target)}.`
        : `Change them to the same bottom or compare with 1/2. The ${ask} is ${fr(...target)}.`;
  }
  return textQ({
    family, prompt,
    answer: fr(...target),
    hint: kind === 'den' ? 'The bottoms are the same, so compare the tops.' : kind === 'num' ? 'The tops are the same. More equal parts means smaller parts.' : kind === 'half' ? 'Half of the bottom number is the top number that makes 1/2.' : 'Compare each fraction with 1/2 or with a matching bottom number.',
    explanation: explain,
    givens: { kind, key, items },
    wrongs: items.filter(item => item !== target).map(([n, d]) => [fr(n, d), 'fraction-denominator']),
  });
}

function solveGreater(question) {
  const { kind, key, items } = question.proof.givens;
  let pick;
  if (kind === 'half') {
    const hits = items.filter(([n, d]) => (key === 'above' ? 2 * n > d : 2 * n < d));
    if (hits.length !== 1) throw new Error('half');
    [pick] = hits;
  } else {
    pick = items.reduce((best, item) => ((key === 'greatest' ? item[0] * best[1] > best[0] * item[1] : item[0] * best[1] < best[0] * item[1]) ? item : best));
  }
  return fr(...pick);
}

function permutations(list) {
  if (list.length <= 1) return [list];
  return list.flatMap((item, index) => permutations([...list.slice(0, index), ...list.slice(index + 1)]).map(rest => [item, ...rest]));
}

function draftOrder(family, grade, level, r) {
  let items;
  if (level === 1) {
    const d = r.int(5, 12);
    items = r.shuffle(Array.from({ length: d - 1 }, (_, index) => index + 1)).slice(0, 3).map(n => [n, d]);
  } else if (level === 2) {
    const n = r.int(1, 3);
    items = r.shuffle([4, 5, 6, 8, 10, 12].filter(value => value > n)).slice(0, 3).map(d => [n, d]);
  } else {
    const d = r.pick([4, 8]);
    const options = [[1, 2], [3, 4], [1, 4], [5, 8], [3, 8], [7, 8], [1, 8]].filter(([a, b]) => b <= d || d === 8);
    items = r.shuffle(options).slice(0, 3);
  }
  const ascending = r.pick([true, false]);
  const sorted = [...items].sort((a, b) => (a[0] * b[1] - b[0] * a[1]) * (ascending ? 1 : -1));
  if (new Set(sorted.map(([n, d]) => n / d)).size !== 3) throw new QuestionRetry('equal fractions');
  const show = list => list.map(([n, d]) => fr(n, d)).join(', ');
  const answer = show(sorted);
  const reversed = show([...sorted].reverse());
  const others = permutations(sorted).map(show).filter(text => text !== answer && text !== reversed);
  return textQ({
    family,
    prompt: `Arrange ${show(r.shuffle(items))} from ${ascending ? 'smallest to greatest' : 'greatest to smallest'}.`,
    answer,
    hint: ascending ? 'Find the smallest first, then the next smallest.' : 'Find the greatest first, then the next greatest.',
    explanation: `In order from ${ascending ? 'smallest to greatest' : 'greatest to smallest'}: ${answer}.`,
    givens: { items, ascending },
    wrongs: [[reversed, 'class-3-order-direction'], ...r.shuffle(others).slice(0, 3).map(text => [text, 'fraction-denominator'])],
  });
}

function solveOrder(question) {
  const { items, ascending } = question.proof.givens;
  return [...items].sort((a, b) => (a[0] * b[1] - b[0] * a[1]) * (ascending ? 1 : -1)).map(([n, d]) => fr(n, d)).join(', ');
}

function draftEquivalent(family, grade, level, r) {
  const kind = level === 1 ? r.pick(['num', 'pick']) : r.pick(['num', 'den', 'pick']);
  const [bn, bd] = r.pick(level === 1 ? [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4]] : [[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [1, 6], [5, 6], [3, 8]]);
  const k = r.int(2, level === 1 ? 3 : 5);
  const n = bn * k;
  const d = bd * k;
  if (kind === 'pick') {
    const wrongs = [[`${bn + k}/${bd + k}`, 'class-3-scale-both'], [`${bn * k}/${bd}`, 'class-3-scale-both'], [`${bn}/${bd * k}`, 'class-3-scale-both'], [`${bn + 1}/${bd * k}`, 'class-3-scale-both']];
    if (wrongs.some(([text]) => { const [a, b] = text.split('/').map(Number); return same(a, b, bn, bd); })) throw new QuestionRetry('equal wrong');
    return textQ({
      family,
      prompt: `Which fraction is equal to ${fr(bn, bd)}?`,
      answer: fr(n, d),
      hint: 'Multiply the top and the bottom by the same number.',
      explanation: `${bn} × ${k} = ${n} and ${bd} × ${k} = ${d}, so ${fr(bn, bd)} = ${fr(n, d)}.`,
      givens: { kind, bn, bd, k, options: null },
      wrongs,
    });
  }
  const fromBig = level === 3 && r.int(0, 1) === 1;
  const [shownN, shownD] = fromBig ? [n, d] : [bn, bd];
  const [hiddenN, hiddenD] = fromBig ? [bn, bd] : [n, d];
  const answer = kind === 'num' ? hiddenN : hiddenD;
  return numberQ(r, {
    family,
    prompt: kind === 'num' ? `${fr(shownN, shownD)} = ?/${hiddenD}. What number is the top?` : `${fr(shownN, shownD)} = ${hiddenN}/?. What number is the bottom?`,
    answer,
    hint: 'Find what the known bottoms (or tops) were multiplied or divided by.',
    explanation: kind === 'num'
      ? `${shownD} to ${hiddenD} is ${fromBig ? '÷' : '×'} ${k}. Do the same to the top: ${hiddenN}.`
      : `${shownN} to ${hiddenN} is ${fromBig ? '÷' : '×'} ${k}. Do the same to the bottom: ${hiddenD}.`,
    givens: { kind, shownN, shownD, hiddenN, hiddenD },
    wrongs: kind === 'num'
      ? [[shownN + (hiddenD - shownD), 'class-3-scale-both'], [hiddenD, 'whole-parts'], [shownN, 'missing-step']]
      : [[shownD + (hiddenN - shownN), 'class-3-scale-both'], [hiddenN, 'whole-parts'], [shownD, 'missing-step']],
    min: 1, max: 99,
  });
}

function solveEquivalent(question) {
  const g = question.proof.givens;
  if (g.kind === 'pick') return fr(g.bn * g.k, g.bd * g.k);
  return g.kind === 'num' ? g.shownN * g.hiddenD / g.shownD : g.shownD * g.hiddenN / g.shownN;
}

const UNITS = [
  { whole: 'an hour', small: 'minutes', size: 60, dens: [2, 3, 4, 5, 6, 10, 12] },
  { whole: 'a metre', small: 'centimetres', size: 100, dens: [2, 4, 5, 10] },
  { whole: 'a kilogram', small: 'grams', size: 1000, dens: [2, 4, 5, 8, 10] },
  { whole: 'a litre', small: 'millilitres', size: 1000, dens: [2, 4, 5, 8, 10] },
  { whole: 'a day', small: 'hours', size: 24, dens: [2, 3, 4, 6, 8, 12] },
  { whole: 'a year', small: 'months', size: 12, dens: [2, 3, 4, 6] },
];

function draftUnit(family, grade, level, r) {
  const u = r.pick(UNITS);
  const d = r.pick(u.dens);
  const n = level === 1 ? 1 : r.int(1, d - 1);
  const amount = u.size / d * n;
  const toAmount = r.int(0, 1) === 1;
  if (toAmount) {
    return numberQ(r, {
      family,
      prompt: `How many ${u.small} are in ${say(n, d)} of ${u.whole}?`,
      answer: amount,
      hint: `Find how many ${u.small} make ${u.whole}. Then find one equal part.`,
      explanation: `${u.size} ÷ ${d} = ${u.size / d}, and ${u.size / d} × ${n} = ${amount}.`,
      givens: { size: u.size, n, d, toAmount: true },
      wrongs: [[u.size - amount, 'fraction-complement'], [u.size / d, 'missing-step'], [u.size / d * (d - 1) === amount ? u.size / n : u.size * n, 'wrong-operation']],
      min: 1, max: 1000,
    });
  }
  const [an, ad] = reduce(amount, u.size);
  return textQ({
    family,
    prompt: `What fraction of ${u.whole} is ${amount} ${u.small}?`,
    answer: fr(an, ad),
    hint: `Write ${u.small} out of the ${u.small} in ${u.whole}. Then make it simpler.`,
    explanation: `${amount} out of ${u.size} is ${fr(amount, u.size)}. Divide both by ${gcd(amount, u.size)}: ${fr(an, ad)}.`,
    givens: { size: u.size, amount, toAmount: false },
    wrongs: nearFractions(an, ad, [[1, amount, 'whole-parts']]),
  });
}

function solveUnit(question) {
  const g = question.proof.givens;
  if (g.toAmount) return g.size / g.d * g.n;
  const [n, d] = reduce(g.amount, g.size);
  return fr(n, d);
}

function draftAdd(family, grade, level, r) {
  const who = person(r);
  const d = r.pick(level === 1 ? [4, 5, 6, 8, 10] : [5, 6, 7, 8, 9, 10, 12]);
  const a = r.int(1, d - 2);
  const b = r.int(1, d - 1 - a);
  if (level === 1) {
    const [pn, pd] = [a + b, d];
    return textQ({
      family,
      prompt: `What is ${fr(a, d)} + ${fr(b, d)}?`,
      answer: fr(pn, pd),
      hint: 'The parts are the same size. Add the tops and keep the bottom.',
      explanation: `${a} + ${b} = ${a + b}, and the bottom stays ${d}: ${fr(a + b, d)}.`,
      givens: { mode: 'sum', a, b, d },
      wrongs: [[fr(a + b, d * 2), 'class-3-add-denominators'], [fr(d - a - b, d), 'fraction-complement'], [fr(a + b, d + d - 1), 'class-3-add-denominators']].filter(([text]) => { const [x, y] = text.split('/').map(Number); return x < y && !same(x, y, a + b, d); }),
    });
  }
  const slices = level === 2;
  const [food, bit] = r.pick([['pizza', 'slice'], ['cake', 'piece'], ['pie', 'piece'], ['chocolate bar', 'piece'], ['pancake', 'piece'], ['watermelon', 'slice']]);
  const text = slices
    ? `A ${food} is cut into ${d} equal ${bit}s. ${who} eats ${count(a, bit)}. What fraction of the ${food} is left?`
    : `${who} eats ${fr(a, d)} of a ${food} and a friend eats ${fr(b, d)}. What fraction of the ${food} is left?`;
  const left = slices ? d - a : d - a - b;
  return textQ({
    family, prompt: text,
    answer: fr(left, d),
    hint: slices ? `The whole ${food} is all the ${bit}s. Take away the ${bit}s eaten.` : `Add what was eaten. Then take it from the whole ${food}.`,
    explanation: slices ? `${d} − ${a} = ${d - a}, so ${fr(d - a, d)} is left.` : `${a} + ${b} = ${a + b} eaten, so ${d} − ${a + b} = ${left} left: ${fr(left, d)}.`,
    givens: { mode: slices ? 'slices' : 'story', a, b, d },
    wrongs: [[fr(slices ? a : a + b, d), 'fraction-complement'], [fr(left, d * 2 - 1), 'class-3-add-denominators'], [fr(slices ? d - a - 1 : d - a, d), 'missing-step'], [fr(left + 1, d), 'missing-step']].filter(([option]) => option !== fr(left, d) && Number(option.split('/')[0]) > 0 && Number(option.split('/')[0]) < Number(option.split('/')[1])),
  });
}

function solveAdd(question) {
  const { mode, a, b, d } = question.proof.givens;
  if (mode === 'sum') return fr(a + b, d);
  return fr(mode === 'slices' ? d - a : d - a - b, d);
}

const FRUIT = [['apples', ['red', 'green', 'yellow']], ['balloons', ['blue', 'pink', 'white']], ['beads', ['gold', 'silver', 'black']], ['flags', ['red', 'blue', 'green']], ['stars', ['big', 'small', 'tiny']]];

function draftShare(family, grade, level, r) {
  const groups = level === 1 ? 2 : 3;
  const counts = Array.from({ length: groups }, () => r.int(2, level === 1 ? 10 : 8));
  const total = counts.reduce((a, b) => a + b, 0);
  const pick = r.int(0, groups - 1);
  const ask = level === 3 ? r.pick(['part', 'not']) : 'part';
  const value = ask === 'part' ? counts[pick] : total - counts[pick];
  if (value === total) throw new QuestionRetry('whole');
  let prompt;
  if (level === 1) {
    const who = r.pick(['pupils', 'players', 'children']);
    prompt = `A group of ${who} has ${counts[0]} boys and ${counts[1]} girls. What fraction of the ${who} are ${pick === 0 ? 'boys' : 'girls'}?`;
  } else {
    const [noun, colours] = r.pick(FRUIT);
    const list = `${counts.map((value2, index) => `${value2} ${colours[index]}`).join(', ').replace(/, ([^,]*)$/, ' and $1')} ${noun}`;
    prompt = `A basket has ${list}. What fraction of the ${noun} are ${ask === 'not' ? 'not ' : ''}${colours[pick]}?`;
  }
  const wrongs = [
    [fr(total - value, total), 'fraction-complement'], [fr(value, total - value), 'whole-parts'], [fr(counts[(pick + 1) % groups], total), 'missing-step'],
    [fr(value, total + 1), 'whole-parts'], [fr(value + 1, total), 'missing-step'],
  ].filter(([text]) => { const [x, y] = text.split('/').map(Number); return x >= 1 && x < y && !same(x, y, value, total); });
  const seen = [];
  const distinct = wrongs.filter(([text]) => !seen.includes(text) && seen.push(text));
  return textQ({
    family, prompt,
    answer: fr(value, total),
    hint: 'Add all the groups for the bottom number. The top is the group asked about.',
    explanation: `There are ${total} in all. ${value} of ${total} fit the question: ${fr(value, total)}.`,
    givens: { counts, pick, ask },
    wrongs: distinct,
  });
}

function solveShare(question) {
  const { counts, pick, ask } = question.proof.givens;
  const total = counts.reduce((a, b) => a + b, 0);
  return fr(ask === 'part' ? counts[pick] : total - counts[pick], total);
}

export const DRAFT = {
  'class-3-frac-of-amount': draftOfAmount,
  'class-3-frac-rest': draftRest,
  'class-3-frac-spent': draftSpent,
  'class-3-frac-whole': draftWhole,
  'class-3-frac-mixed': draftMixed,
  'class-3-frac-cells': draftCells,
  'class-3-frac-sets': draftSets,
  'class-3-frac-cuts': draftCuts,
  'class-3-frac-greater': draftGreater,
  'class-3-frac-order': draftOrder,
  'class-3-frac-equal': draftEquivalent,
  'class-3-frac-unit': draftUnit,
  'class-3-frac-add': draftAdd,
  'class-3-frac-share': draftShare,
};

export const SOLVE = {
  'class-3-frac-of-amount': solveOfAmount,
  'class-3-frac-rest': solveRest,
  'class-3-frac-spent': solveSpent,
  'class-3-frac-whole': solveWhole,
  'class-3-frac-mixed': solveMixed,
  'class-3-frac-cells': solveCells,
  'class-3-frac-sets': solveSets,
  'class-3-frac-cuts': solveCuts,
  'class-3-frac-greater': solveGreater,
  'class-3-frac-order': solveOrder,
  'class-3-frac-equal': solveEquivalent,
  'class-3-frac-unit': solveUnit,
  'class-3-frac-add': solveAdd,
  'class-3-frac-share': solveShare,
};

export const FAMILIES = {
  'class-3-frac-of-amount': { skill: 'fraction-of', title: 'Find a fraction of a number in a story' },
  'class-3-frac-rest': { skill: 'fraction-of', title: 'Find the last group after two fractions' },
  'class-3-frac-spent': { skill: 'fraction-of', title: 'Find money left after spending fractions' },
  'class-3-frac-whole': { skill: 'fraction-of', title: 'Find the whole from a fraction of it' },
  'class-3-frac-mixed': { skill: 'fraction-read', title: 'Read a mixed number from shaded circles' },
  'class-3-frac-cells': { skill: 'fraction-read', title: 'Read the fraction of scattered shaded shapes' },
  'class-3-frac-sets': { skill: 'fraction-read', title: 'Pick the group with a given shaded fraction' },
  'class-3-frac-cuts': { skill: 'fraction-read', title: 'Spot the shape cut into equal parts' },
  'class-3-frac-greater': { skill: 'fraction-compare', title: 'Find the greatest or smallest fraction' },
  'class-3-frac-order': { skill: 'fraction-compare', title: 'Arrange three fractions in order' },
  'class-3-frac-equal': { skill: 'fraction-compare', title: 'Find the missing part of an equal fraction' },
  'class-3-frac-unit': { skill: 'fraction-of', title: 'Link fractions to hours, metres and kilograms' },
  'class-3-frac-add': { skill: 'fraction-compare', title: 'Add and take away fractions of one whole' },
  'class-3-frac-share': { skill: 'fraction-read', title: 'Write a fraction from a count in a story' },
};
