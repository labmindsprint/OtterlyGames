// Class 2 "real paper" Logical Reasoning families, modelled on SOF IMO Class 2 items. Imported by bank3-class-2.mjs.
import { answerChoices, choiceCount, MISCONCEPTIONS as SHARED, QuestionRetry, wrong } from './bank-shared.mjs';
import { CUSTOM_CODES, plural } from './bank3-class-2-engines.mjs';
import { circle, icon, line, rect, svg, INK, GREEN, ORANGE, PAPER } from './diagram-kit.mjs';

export const REAL_CODES = {
  'class-2-place-words': { title: 'Hundreds, tens and ones words', message: 'Change each group to its value: hundreds x 100, tens x 10, ones x 1. Then add them.' },
  'class-2-row-count': { title: 'Counting a place twice', message: 'A child counted from both ends is counted twice. Add the two places and take away 1.' },
  'class-2-roll-slide': { title: 'Rolling and sliding', message: 'A curved face can roll and a flat face can slide. A tin or a cone has both.' },
  'class-2-odd-rule': { title: 'Finding the shared rule', message: 'Find what three of them share. The odd one out does not follow that rule.' },
  'class-2-analogy-link': { title: 'Same link, new pair', message: 'Say how the first two go together, then use the same link for the second pair.' },
  'class-2-letter-step': { title: 'Letter steps', message: 'Count the letters between neighbours in the alphabet. A series can also go backwards.' },
  'class-2-day-count': { title: 'Counting days', message: 'Count on from the named day: the next day is 1, not 0. A week has 7 days.' },
  'class-2-shape-line': { title: 'Counting each kind', message: 'Count each kind of shape or line separately, and give the answers in the order asked.' },
  'class-2-make-numbers': { title: 'Making numbers from cards', message: 'The biggest digit goes in the highest place for the greatest number. List every choice when counting.' },
  'class-2-series-gap': { title: 'Finding the series rule', message: 'Subtract neighbouring terms to find the gap. The gap may stay the same, grow or alternate.' },
  'class-2-digit-rule': { title: 'Applying the digit rule', message: 'Test the rule on every number in the cloud, one digit at a time.' },
  'class-2-symbol-chain': { title: 'One name, one digit', message: 'A name stands for the same digit everywhere. Solve the easiest clue first.' },
  'class-2-amount-form': { title: 'Matching amount forms', message: 'Change every form into a number and compare it with the amount.' },
  'class-2-tag-qty': { title: 'Price times quantity', message: 'Multiply each price by how many are bought, then add the totals.' },
};

export const KNOWN = { ...SHARED, ...CUSTOM_CODES, ...REAL_CODES };

export const REASONING_FAMILIES = {
  'class-2-place-words': { skill: 'place', title: 'Turn hundreds, tens and ones words into a number' },
  'class-2-row-position': { skill: 'position', title: 'Find a place in a row from the left or right' },
  'class-2-shape-lines': { skill: 'shape', title: 'Count shapes and lines in a picture' },
  'class-2-roll-slide': { skill: 'solids', title: 'Choose the object that can roll or slide' },
  'class-2-odd-text': { skill: 'odd', title: 'Pick the odd one out of numbers, letters or words' },
  'class-2-analogy': { skill: 'coding', title: 'Match a pair using the same link' },
  'class-2-letter-gap': { skill: 'sequence', title: 'Find a missing letter or count letters in the alphabet' },
  'class-2-day-after': { skill: 'calendar', title: 'Count days and months from a named day' },
  'class-2-clue-number': { skill: 'place', title: 'Find the number that fits every clue' },
  'class-2-make-numbers': { skill: 'combinations', title: 'Make the greatest, smallest or count numbers from digit cards' },
  'class-2-number-series': { skill: 'sequence', title: 'Fill the missing term in a number series' },
};

export const DRAFT = {};
export const SOLVE = {};

export const NAMES = ['Avi', 'Dia', 'Kai', 'Leo', 'Mia', 'Nia', 'Rio', 'Sam', 'Tia', 'Zoe', 'Ira', 'Ben', 'Uma', 'Ravi', 'Tara', 'Dev'];
export const ord = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const BLUE = '#5b88c8';
const PURPLE = '#8a6bb8';

const first = value => Number(/-?\d+(?:\.\d+)?/.exec(String(value).replaceAll(',', ''))?.[0]);

// Right answer plus the plausible wrong values; for numeric options a random number of the wrong values sit below the answer so the key is not always the middle one.
export function choose(answer, pairs, count, r, { numeric = false } = {}) {
  const seen = new Set([String(answer)]);
  const valid = [];
  for (const [value, code] of pairs) {
    const text = String(value);
    if (seen.has(text) || text === 'NaN' || text.includes('Infinity') || text.startsWith('-')) continue;
    if (numeric && !/\d/.test(text)) continue;
    seen.add(text);
    valid.push(wrong(value, code));
  }
  const target = first(answer);
  let alternatives = valid.length > count - 1 ? r.shuffle(valid) : valid;
  if (numeric && alternatives.length > count - 1 && Number.isFinite(target)) {
    const below = alternatives.filter(item => first(item.value) < target);
    const above = alternatives.filter(item => first(item.value) > target);
    const rest = alternatives.filter(item => !below.includes(item) && !above.includes(item));
    const feasible = Array.from({ length: count }, (_, k) => k).filter(k => k <= below.length && count - 1 - k <= above.length);
    const lower = feasible.length ? r.pick(feasible) : Math.min(r.int(0, count - 1), below.length);
    const upper = Math.min(count - 1 - lower, above.length);
    const chosen = [...below.slice(0, lower), ...above.slice(0, upper)];
    const spare = [...below.slice(lower), ...above.slice(upper), ...rest];
    alternatives = [...chosen, ...spare.slice(0, count - 1 - chosen.length)];
  }
  return answerChoices(String(answer), alternatives, count, null, KNOWN);
}

const cap = text => text.charAt(0).toUpperCase() + text.slice(1);

// ---------------------------------------------------------------------------
// Place-value words: 62 hundreds 30 tens and 80 ones = ?
// ---------------------------------------------------------------------------
const wordsOf = (h, t, o) => `${plural(h, 'hundred')}, ${plural(t, 'ten')} and ${plural(o, 'one')}`;

DRAFT['class-2-place-words'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['build', 'build', 'tens-in', 'compare'] : level === 2 ? ['build', 'compare', 'tens-in', 'compare'] : ['build', 'build', 'compare', 'tens-in']);
  if (mode === 'build') {
    let h;
    let t;
    let o;
    let text;
    if (level === 1) {
      h = r.int(2, 9); t = r.int(2, 9); o = r.int(0, 9);
      const order = r.shuffle([0, 1, 2]);
      const parts = [plural(h, 'hundred'), plural(t, 'ten'), plural(o, 'one')];
      text = `${parts[order[0]]}, ${parts[order[1]]} and ${parts[order[2]]}`;
    } else if (level === 2) {
      h = r.int(2, 8);
      if (r.pick([true, false])) { t = r.int(10, 19); o = r.int(1, 9); } else { t = r.int(2, 9); o = r.int(10, 19); }
      text = wordsOf(h, t, o);
    } else {
      h = r.int(2, 6); t = r.int(10, 29); o = r.int(11, 49);
      text = wordsOf(h, t, o);
    }
    const value = h * 100 + t * 10 + o;
    const pairs = level === 1
      ? [[`${h}${t}${o}`, 'class-2-place-words'], [h + t + o, 'face-value'], [h * 100 + t + o, 'face-value'], [h * 100 + o * 10 + t, 'place-shift'], [value + 10, 'place-shift'], [value - 10, 'place-shift']]
      : [[h * 100 + t + o, 'face-value'], [h * 100 + t * 10, 'missing-step'], [value + 100, 'place-shift'], [value - 100, 'place-shift'], [h * 10 + t * 10 + o, 'face-value'], [h * 100 + o * 10 + t, 'place-shift'], [value + 10, 'place-shift']];
    return {
      family, answer: String(value),
      prompt: r.pick([`What number is ${text}?`, `${cap(text)} make which number?`, `Which number is the same as ${text}?`]),
      hint: 'Turn each group into its value, then add the three values.',
      explanation: `${plural(h, 'hundred')} = ${h * 100}, ${plural(t, 'ten')} = ${t * 10}, ${plural(o, 'one')} = ${o}. ${h * 100} + ${t * 10} + ${o} = ${value}.`,
      proof: { family, givens: { mode, h, t, o } }, visual: null,
      choices: choose(value, pairs, count, r, { numeric: true }),
    };
  }
  if (mode === 'compare') {
    const tens = r.int(level === 1 ? 6 : 9, level === 3 ? 29 : 19);
    const ones = r.int(1, 9);
    const dir = r.pick(['less', 'greater']);
    const T = tens * 10 + ones;
    const answer = dir === 'less' ? T - r.int(3, 28) : T + r.int(3, 28);
    const pairs = dir === 'less'
      ? [[T, 'class-2-place-words'], [T + r.int(1, 9), 'class-2-place-words'], [T + 10 * r.int(1, 4), 'place-shift'], [T + r.int(11, 40), 'face-value'], [T + ones, 'face-value']]
      : [[T, 'class-2-place-words'], [T - r.int(1, 9), 'class-2-place-words'], [T - 10 * r.int(1, 4), 'place-shift'], [T - r.int(11, 40), 'face-value'], [T - ones, 'face-value']];
    const spec = `${plural(tens, 'ten')} + ${plural(ones, 'one')}`;
    const choices = choose(answer, pairs, count, r, { numeric: true });
    return {
      family, answer: String(answer),
      prompt: r.pick([`Which number is ${dir} than ${spec}?`, `Which of these is ${dir} than ${spec}?`]),
      hint: `Find the number for ${spec} first. Then compare each option with it.`,
      explanation: `${spec} is ${tens * 10} + ${ones} = ${T}. Only ${answer} is ${dir} than ${T}.`,
      proof: { family, givens: { mode, tens, ones, dir } }, visual: null, choices,
    };
  }
  if (r.pick([true, false])) {
    const n = r.int(level === 1 ? 12 : 30, level === 3 ? 99 : 60) * 10;
    return {
      family, answer: String(n / 10),
      prompt: r.pick([`How many tens are there in ${n}?`, `${n} is made of how many tens?`, `How many ten-rods make ${n}?`]),
      hint: 'Ten is 10, so share the number into groups of 10.',
      explanation: `${n} is ${n / 10} groups of 10, so there are ${n / 10} tens in ${n}.`,
      proof: { family, givens: { mode, n } }, visual: null,
      choices: choose(n / 10, [[Math.floor(n / 100), 'class-2-place-words'], [n, 'class-2-place-words'], [(n / 10) % 10, 'face-value'], [n / 10 + 1, 'place-shift'], [n / 10 + 10, 'place-shift'], [n / 10 - 1, 'place-shift']], count, r, { numeric: true }),
    };
  }
  const h = r.int(2, 9);
  const t = r.int(1, 9);
  return {
    family, answer: String(h * 10 + t),
    prompt: r.pick([`How many tens are there in ${plural(h, 'hundred')} and ${plural(t, 'ten')}?`, `${cap(plural(h, 'hundred'))} and ${plural(t, 'ten')} make how many tens?`]),
    hint: 'Each hundred is 10 tens. Change the hundreds to tens, then add.',
    explanation: `${plural(h, 'hundred')} = ${h * 10} tens. Add ${t} more ${t === 1 ? 'ten' : 'tens'}: ${h * 10} + ${t} = ${h * 10 + t} tens.`,
    proof: { family, givens: { mode: 'hundreds-tens', h, t } }, visual: null,
    choices: choose(h * 10 + t, [[h + t, 'class-2-place-words'], [h * 100 + t * 10, 'class-2-place-words'], [h * 10, 'missing-step'], [h * 100 + t, 'place-shift'], [h * 10 + t + 10, 'place-shift']], count, r, { numeric: true }),
  };
};
SOLVE['class-2-place-words'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'build') return String(g.h * 100 + g.t * 10 + g.o);
  if (g.mode === 'tens-in') return String(g.n / 10);
  if (g.mode === 'hundreds-tens') return String(g.h * 10 + g.t);
  const T = g.tens * 10 + g.ones;
  const fits = q.options.filter(option => (g.dir === 'less' ? Number(option) < T : Number(option) > T));
  if (fits.length !== 1) throw new Error('Exactly one option should satisfy the comparison.');
  return fits[0];
};

// ---------------------------------------------------------------------------
// Position in a row
// ---------------------------------------------------------------------------
DRAFT['class-2-row-position'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['both-ends', 'convert', 'letters'] : ['both-ends', 'convert', 'between', 'letters']);
  const name = r.pick(NAMES);
  const top = level === 1 ? 7 : level === 2 ? 10 : 14;
  if (mode === 'both-ends') {
    const a = r.int(2, top);
    const b = r.int(2, top);
    const total = a + b - 1;
    const sides = r.pick([['left', 'right'], ['right', 'left']]);
    return {
      family, answer: String(total),
      prompt: r.pick([
        `${name} is ${ord(a)} from the ${sides[0]} and ${ord(b)} from the ${sides[1]} in a line. How many children are in the line?`,
        `In a queue, ${name} stands ${ord(a)} from the ${sides[0]} and ${ord(b)} from the ${sides[1]}. How many children are in the queue?`,
      ]),
      hint: `${name} is counted in both places, so use the places together.`,
      explanation: `${a} + ${b} = ${a + b}, but ${name} is counted twice. Take away 1: ${a + b} - 1 = ${total} children.`,
      proof: { family, givens: { mode, a, b } }, visual: null,
      choices: choose(total, [[a + b, 'class-2-row-count'], [a + b - 2, 'class-2-row-count'], [Math.abs(a - b), 'wrong-operation'], [a + b + 1, 'class-2-row-count'], [Math.max(a, b), 'missing-step']], count, r, { numeric: true }),
    };
  }
  if (mode === 'convert') {
    const n = r.int(level === 1 ? 6 : 8, level === 3 ? 19 : 14);
    const a = r.int(2, n - 1);
    const place = n - a + 1;
    return {
      family, answer: ord(place),
      prompt: r.pick([
        `There are ${n} children in a row. ${name} is ${ord(a)} from the left. What is ${name}'s place from the right?`,
        `${name} is ${ord(a)} from the left in a row of ${n} children. Which place is that from the right?`,
      ]),
      hint: 'Count how many children stand to the right of the child, then add 1.',
      explanation: `${n} - ${a} = ${n - a} children are to the right of ${name}. Add 1 for ${name}: ${ord(place)} from the right.`,
      proof: { family, givens: { mode, n, a } }, visual: null,
      choices: choose(ord(place), [[ord(n - a), 'class-2-row-count'], [ord(a), 'class-2-row-count'], [ord(place + 1), 'class-2-row-count'], [ord(n - a + 2), 'class-2-row-count'], [ord(n), 'missing-step']], count, r, { numeric: true }),
    };
  }
  if (mode === 'between') {
    const other = r.pick(NAMES.filter(x => x !== name));
    const a = r.int(2, top - 3);
    const b = a + r.int(3, Math.min(8, top + 2 - a));
    return {
      family, answer: String(b - a - 1),
      prompt: `${name} is ${ord(a)} and ${other} is ${ord(b)} from the left in a row. How many children stand between them?`,
      hint: 'Do not count the two named children. Count only the ones in between.',
      explanation: `${b} - ${a} = ${b - a}. The two named children are included in that gap, so take away 1: ${b - a - 1} children between them.`,
      proof: { family, givens: { mode, a, b } }, visual: null,
      choices: choose(b - a - 1, [[b - a, 'class-2-row-count'], [b - a + 1, 'class-2-row-count'], [b - a - 2, 'class-2-row-count'], [a + b, 'wrong-operation'], [b, 'missing-step']], count, r, { numeric: true }),
    };
  }
  const n = r.int(level === 1 ? 5 : 6, level === 3 ? 8 : 7);
  const row = r.shuffle([...LETTERS]).slice(0, n);
  const side = r.pick(['left', 'right']);
  const k = r.int(2, Math.min(4, n - 2));
  const at = (s, p) => (s === 'left' ? row[p - 1] : row[n - p]);
  const answer = at(side, k);
  const other = side === 'left' ? 'right' : 'left';
  const pairs = [[at(other, k), 'class-2-row-count'], [at(side, k + 1), 'class-2-row-count'], [at(side, k - 1), 'class-2-row-count'], [at(other, k + 1), 'class-2-row-count']];
  return {
    family, answer,
    prompt: `In the row ${row.join(', ')}, which letter is ${ord(k)} from the ${side}?`,
    hint: `Start at the ${side} end and count the letters one by one.`,
    explanation: `Counting from the ${side}: ${(side === 'left' ? row : [...row].reverse()).slice(0, k).join(', ')}. The ${ord(k)} letter is ${answer}.`,
    proof: { family, givens: { mode: 'letters', row, side, k } }, visual: null,
    choices: choose(answer, pairs, count, r),
  };
};
SOLVE['class-2-row-position'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'both-ends') return String(g.a + g.b - 1);
  if (g.mode === 'convert') return ord(g.n - g.a + 1);
  if (g.mode === 'between') return String(g.b - g.a - 1);
  return g.side === 'left' ? g.row[g.k - 1] : g.row[g.row.length - g.k];
};

// ---------------------------------------------------------------------------
// Count shapes and lines in a picture
// ---------------------------------------------------------------------------
const KINDS = ['square', 'triangle', 'circle', 'standing', 'sleeping'];
const KIND_WORDS = { square: ['square', 'squares'], triangle: ['triangle', 'triangles'], circle: ['circle', 'circles'], standing: ['standing line', 'standing lines'], sleeping: ['sleeping line', 'sleeping lines'] };
const kindText = (kind, n) => `${n} ${KIND_WORDS[kind][n === 1 ? 0 : 1]}`;
const moreText = (kind, other, n) => `${n} more ${KIND_WORDS[kind][n === 1 ? 0 : 1]} than ${KIND_WORDS[other][1]}`;
const countsOf = items => Object.fromEntries(KINDS.map(kind => [kind, items.filter(item => item === kind).length]));

export function shapePicture(r, level) {
  const cap = level === 1 ? 11 : 17;
  for (let attempt = 0; attempt < 40; attempt++) {
    const counts = Object.fromEntries(KINDS.map(kind => [kind, r.int(0, level === 1 ? 6 : 7)]));
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total < 7 || total > cap || Object.values(counts).filter(n => n > 0).length < 3) continue;
    const items = r.shuffle(KINDS.flatMap(kind => Array(counts[kind]).fill(kind)));
    const rows = [];
    for (let i = 0; i < items.length; i += 6) rows.push(items.slice(i, i + 6));
    return {
      counts, items,
      visual: {
        kind: 'v3-class-2-shapelines', items,
        description: `A picture of ${items.length} items in ${rows.length} rows. ${rows.map((row, i) => `Row ${i + 1}: ${row.map(kind => KIND_WORDS[kind][0]).join(', ')}.`).join(' ')}`,
      },
    };
  }
  throw new QuestionRetry('Could not build a picture with enough variety.');
}

DRAFT['class-2-shape-lines'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const { counts, visual } = shapePicture(r, level);
  const present = KINDS.filter(kind => counts[kind] > 0);
  const mode = r.pick(level === 1 ? ['two', 'two', 'more'] : ['two', 'more', 'not-correct', 'not-correct']);
  if (mode === 'two') {
    const [a, b] = r.shuffle(present).slice(0, 2);
    const A = counts[a];
    const B = counts[b];
    const text = (x, y) => `${x} and ${y}`;
    return {
      family, answer: text(A, B),
      prompt: r.pick([`How many ${KIND_WORDS[a][1]} and ${KIND_WORDS[b][1]} respectively are in the picture?`, `Count the ${KIND_WORDS[a][1]} and then the ${KIND_WORDS[b][1]}. What are the two numbers, respectively?`]),
      hint: `Count the ${KIND_WORDS[a][1]} first, then count the ${KIND_WORDS[b][1]}.`,
      explanation: `The picture has ${kindText(a, A)} and ${kindText(b, B)}, so the answer is ${A} and ${B}.`,
      proof: { family, givens: { mode, a, b } }, visual,
      choices: answerChoices(text(A, B), [wrong(text(B, A), 'class-2-shape-line'), wrong(text(A + 1, B), 'class-2-shape-line'), wrong(text(A, Math.max(0, B - 1)), 'class-2-shape-line'), wrong(text(A, B + 1), 'class-2-shape-line'), wrong(text(A - 1, B + 1), 'class-2-shape-line')].filter(item => !item.value.startsWith('-')), count, null, KNOWN),
    };
  }
  if (mode === 'more') {
    const pairs = present.flatMap(x => present.filter(y => y !== x && counts[x] > counts[y]).map(y => [x, y]));
    if (!pairs.length) throw new QuestionRetry('Need two kinds with different counts.');
    const [a, b] = r.pick(pairs);
    const diff = counts[a] - counts[b];
    return {
      family, answer: String(diff),
      prompt: `How many more ${KIND_WORDS[a][1]} than ${KIND_WORDS[b][1]} are in the picture?`,
      hint: `Count both kinds, then subtract the smaller number from the bigger.`,
      explanation: `There are ${kindText(a, counts[a])} and ${kindText(b, counts[b])}. ${counts[a]} - ${counts[b]} = ${diff} more.`,
      proof: { family, givens: { mode, a, b } }, visual,
      choices: choose(diff, [[counts[a] + counts[b], 'wrong-operation'], [counts[a], 'class-2-shape-line'], [counts[b], 'class-2-shape-line'], [diff + 1, 'class-2-shape-line'], [Math.max(1, diff - 1), 'class-2-shape-line']], count, r, { numeric: true }),
    };
  }
  const kinds = r.shuffle(present).slice(0, 4);
  if (kinds.length < 4) throw new QuestionRetry('Need four kinds present for statements.');
  const statements = kinds.map((kind, i) => {
    const other = kinds[(i + 1) % 4];
    const useMore = counts[kind] > counts[other] && r.pick([true, false]);
    return useMore
      ? { more: true, text: moreText(kind, other, counts[kind] - counts[other]), make: bad => moreText(kind, other, counts[kind] - counts[other] + bad) }
      : { text: kindText(kind, counts[kind]), make: bad => kindText(kind, counts[kind] + bad) };
  });
  const falseAt = r.int(0, 3);
  const bad = r.pick([-1, 1, 2]);
  const options = statements.map((s, i) => (i === falseAt ? s.make(s.more ? Math.abs(bad) : bad) : s.text));
  if (options.some(text => text.length > 28 || /^0 /.test(text)) || new Set(options).size !== 4) throw new QuestionRetry('Statement options are unusable.');
  return {
    family, answer: options[falseAt],
    prompt: 'Look at the picture. Which statement is NOT correct?',
    hint: 'Count each kind in the picture, then test every statement.',
    explanation: `The picture really has ${statements[falseAt].text}. So "${options[falseAt]}" is the statement that is NOT correct.`,
    proof: { family, givens: { mode, kinds, falseAt, bad } }, visual,
    choices: answerChoices(options[falseAt], options.filter((_, i) => i !== falseAt).map(text => wrong(text, 'class-2-shape-line')), count, null, KNOWN),
  };
};
SOLVE['class-2-shape-lines'] = q => {
  const g = q.proof.givens;
  const counts = countsOf(q.visual.items);
  if (g.mode === 'two') return `${counts[g.a]} and ${counts[g.b]}`;
  if (g.mode === 'more') return String(counts[g.a] - counts[g.b]);
  const truth = text => {
    const m = /^(\d+) more (.+?) than (.+)$/.exec(text);
    const word = name => KINDS.find(kind => KIND_WORDS[kind][1] === name || KIND_WORDS[kind][0] === name);
    if (m) return counts[word(m[2])] - counts[word(m[3])] === Number(m[1]);
    const c = /^(\d+) (.+)$/.exec(text);
    return counts[word(c[2])] === Number(c[1]);
  };
  const falsy = q.options.filter(text => !truth(text));
  if (falsy.length !== 1) throw new Error('Exactly one statement should be NOT correct.');
  return falsy[0];
};

const SHAPE_FILL = { square: BLUE, triangle: ORANGE, circle: GREEN };
export function renderShapeLines(visual) {
  const rows = Math.ceil(visual.items.length / 6);
  let body = '';
  visual.items.forEach((kind, i) => {
    const cx = 52 + (i % 6) * 75;
    const cy = 42 + Math.floor(i / 6) * 70;
    if (kind === 'standing') body += line(cx, cy - 26, cx, cy + 26, { width: 6, stroke: PURPLE });
    else if (kind === 'sleeping') body += line(cx - 26, cy, cx + 26, cy, { width: 6, stroke: PURPLE });
    else body += icon(kind, cx - 24, cy - 24, 48, SHAPE_FILL[kind]);
  });
  return svg(body, visual.description, 480, 20 + rows * 70);
}

// ---------------------------------------------------------------------------
// Roll or slide
// ---------------------------------------------------------------------------
const OBJECTS = {
  roll: ['ball', 'marble', 'football', 'globe', 'orange', 'tennis ball', 'bead', 'basketball', 'pearl', 'balloon'],
  slide: ['dice', 'brick', 'book', 'matchbox', 'tissue box', 'cube block', 'lunch box', 'cereal box', 'notebook', 'eraser'],
  both: ['tin can', 'drum', 'ice-cream cone', 'water bottle', 'rolling pin', 'candle', 'glue stick', 'battery', 'paint tin', 'torch'],
};
const ROLL_STEMS = {
  'roll-not-slide': { answer: 'roll', wrong: ['slide', 'both'], text: 'Which of these can roll but cannot slide?' },
  'cannot-slide': { answer: 'roll', wrong: ['slide', 'both'], text: 'Which of these cannot slide on a flat floor?' },
  'slide-not-roll': { answer: 'slide', wrong: ['roll', 'both'], text: 'Which of these can slide but cannot roll?' },
  'cannot-roll': { answer: 'slide', wrong: ['roll', 'both'], text: 'Which of these cannot roll on a flat floor?' },
  both: { answer: 'both', wrong: ['roll', 'slide'], text: 'Which of these can roll and also slide?' },
};

DRAFT['class-2-roll-slide'] = (family, grade, level, r) => {
  const stemKey = r.pick(level === 1 ? ['roll-not-slide', 'slide-not-roll', 'cannot-roll'] : Object.keys(ROLL_STEMS));
  const stem = ROLL_STEMS[stemKey];
  const answer = r.pick(OBJECTS[stem.answer]);
  const pool = r.shuffle(stem.wrong.flatMap(type => OBJECTS[type].map(name => [name, type])));
  const chosen = pool.slice(0, choiceCount(grade) - 1);
  const reason = { roll: 'has a curved surface and no flat face', slide: 'has flat faces and no curved face', both: 'has a flat face to slide on and a curved face to roll' };
  const verb = { roll: 'only rolls', slide: 'only slides', both: 'rolls and slides' };
  return {
    family, answer,
    prompt: stem.text,
    hint: 'A curved surface rolls. A flat face slides. Some objects have both.',
    explanation: `${/^[aeiou]/.test(answer) ? 'An' : 'A'} ${answer} ${reason[stem.answer]}. The others: ${chosen.map(([name, type]) => `${name} ${verb[type]}`).join(', ')}.`,
    proof: { family, givens: { stemKey, shown: chosen.map(([name]) => name) } }, visual: null,
    choices: answerChoices(answer, chosen.map(([name]) => wrong(name, 'class-2-roll-slide')), choiceCount(grade), null, KNOWN),
  };
};
SOLVE['class-2-roll-slide'] = q => {
  const stem = ROLL_STEMS[q.proof.givens.stemKey];
  const typeOf = name => Object.keys(OBJECTS).find(type => OBJECTS[type].includes(name));
  const fits = q.options.filter(option => typeOf(option) === stem.answer);
  if (fits.length !== 1) throw new Error('Exactly one object should fit.');
  return fits[0];
};

// ---------------------------------------------------------------------------
// Odd one out
// ---------------------------------------------------------------------------
const WORD_GROUPS = [
  { id: 'fruit', plural: 'fruits', one: 'a vegetable', items: ['apple', 'mango', 'banana', 'grapes', 'papaya', 'guava'] },
  { id: 'veg', plural: 'vegetables', one: 'a vegetable', items: ['carrot', 'potato', 'onion', 'cabbage', 'spinach', 'beetroot'] },
  { id: 'land', plural: 'animals that live on land', one: 'a land animal', items: ['cow', 'horse', 'lion', 'tiger', 'goat', 'elephant'] },
  { id: 'bird', plural: 'birds', one: 'a bird', items: ['crow', 'parrot', 'sparrow', 'eagle', 'owl', 'peacock'] },
  { id: 'sea', plural: 'sea animals', one: 'a sea animal', items: ['shark', 'whale', 'crab', 'octopus', 'dolphin', 'jellyfish'] },
  { id: 'vehicle', plural: 'vehicles', one: 'a vehicle', items: ['bus', 'car', 'truck', 'train', 'scooter', 'rocket'] },
  { id: 'body', plural: 'parts of the body', one: 'a part of the body', items: ['hand', 'leg', 'eye', 'ear', 'nose', 'knee'] },
  { id: 'cloth', plural: 'clothes', one: 'a piece of clothing', items: ['shirt', 'skirt', 'frock', 'socks', 'jacket', 'trousers'] },
  { id: 'furn', plural: 'furniture', one: 'furniture', items: ['table', 'chair', 'bed', 'sofa', 'shelf', 'stool'] },
  { id: 'write', plural: 'things to write with', one: 'something to write with', items: ['pencil', 'pen', 'crayon', 'chalk', 'marker'] },
  { id: 'planet', plural: 'planets', one: 'a planet', items: ['Mars', 'Venus', 'Earth', 'Saturn', 'Jupiter', 'Mercury'] },
  { id: 'music', plural: 'musical instruments', one: 'a musical instrument', items: ['drum', 'flute', 'guitar', 'piano', 'violin'] },
];
const BLOCKED = new Set(['fruit|veg', 'veg|fruit', 'land|bird', 'bird|land', 'land|sea', 'sea|land', 'bird|sea', 'sea|bird', 'bird|vehicle', 'vehicle|bird']);
const NUMBER_RULES = [
  { id: 'even', yes: n => n % 2 === 0, yesAll: 'even numbers', noAll: 'odd numbers', yesOne: 'an even number', noOne: 'an odd number' },
  { id: 'five', yes: n => n % 5 === 0, yesAll: 'multiples of 5', noAll: 'numbers that are not multiples of 5', yesOne: 'a multiple of 5', noOne: 'not a multiple of 5' },
  { id: 'three', yes: n => n % 3 === 0, yesAll: 'multiples of 3', noAll: 'numbers that are not multiples of 3', yesOne: 'a multiple of 3', noOne: 'not a multiple of 3', minLevel: 3 },
  { id: 'big', yes: n => n > 50, yesAll: 'more than 50', noAll: '50 or less', yesOne: 'more than 50', noOne: '50 or less', maxLevel: 2 },
];
const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];

function oddNumbers(r, level) {
  const [lo, hi] = level === 1 ? [11, 60] : level === 2 ? [21, 99] : [101, 499];
  for (let attempt = 0; attempt < 60; attempt++) {
    const rule = r.pick(NUMBER_RULES.filter(rl => (rl.minLevel ?? 1) <= level && (rl.maxLevel ?? 3) >= level));
    const flip = r.pick([true, false]);
    const fits = () => {
      for (let i = 0; i < 200; i++) {
        const n = r.int(lo, hi);
        if (rule.yes(n) === flip) return n;
      }
      return null;
    };
    const misses = () => {
      for (let i = 0; i < 200; i++) {
        const n = r.int(lo, hi);
        if (rule.yes(n) !== flip) return n;
      }
      return null;
    };
    const three = [fits(), fits(), fits()];
    const odd = misses();
    const all = [...three, odd];
    if (all.includes(null) || new Set(all).size !== 4) continue;
    const singles = NUMBER_RULES.map(rl => {
      const yes = all.filter(n => rl.yes(n));
      if (yes.length === 1) return yes[0];
      if (yes.length === 3) return all.find(n => !rl.yes(n));
      return null;
    }).filter(v => v !== null);
    if (singles.length !== 1 || singles[0] !== odd) continue;
    const groupText = flip ? rule.yesAll : rule.noAll;
    const oddText = flip ? rule.noOne : rule.yesOne;
    return { items: all, odd, groupText, oddText, kind: `n-${rule.id}` };
  }
  throw new QuestionRetry('No clean odd-one-out numbers.');
}

DRAFT['class-2-odd-text'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const kind = r.pick(level === 1 ? ['words', 'words', 'numbers', 'letters'] : ['words', 'numbers', 'numbers', 'letters']);
  let items;
  let odd;
  let explanation;
  let givens;
  if (kind === 'numbers') {
    const set = oddNumbers(r, level);
    ({ items, odd } = set);
    explanation = `${items.filter(n => n !== odd).join(', ')} are all ${set.groupText}. ${odd} is ${set.oddText}, so it is the odd one out.`;
    givens = { kind: set.kind };
  } else if (kind === 'letters') {
    const flip = r.pick([true, false]);
    const group = r.shuffle(flip ? VOWELS : CONSONANTS).slice(0, 3);
    odd = r.pick(flip ? CONSONANTS : VOWELS);
    items = [...group, odd];
    explanation = `${group.join(', ')} are all ${flip ? 'vowels' : 'consonants'}. ${odd} is a ${flip ? 'consonant' : 'vowel'}, so it is the odd one out.`;
    givens = { kind: flip ? 'l-vowel' : 'l-consonant' };
  } else {
    const pairs = WORD_GROUPS.flatMap(a => WORD_GROUPS.filter(b => a !== b && !BLOCKED.has(`${a.id}|${b.id}`)).map(b => [a, b]));
    const [main, other] = r.pick(pairs);
    const group = r.shuffle(main.items).slice(0, 3);
    odd = r.pick(other.items);
    items = [...group, odd];
    explanation = `${group.join(', ')} are all ${main.plural}. ${odd} is ${other.one}, so it is the odd one out.`;
    givens = { kind: 'w', main: main.id, other: other.id };
  }
  const shown = r.shuffle(items);
  return {
    family, answer: String(odd),
    prompt: r.pick([`Find the odd one out: ${shown.join(', ')}.`, `Which one does not belong with the others: ${shown.join(', ')}?`, `Three of these go together. Which is the odd one out: ${shown.join(', ')}?`]),
    hint: 'Find what three of them share. The odd one out does not share it.',
    explanation,
    proof: { family, givens: { ...givens, shown } }, visual: null,
    choices: answerChoices(String(odd), shown.filter(x => x !== odd).map(x => wrong(x, 'class-2-odd-rule')), count, null, KNOWN),
  };
};
SOLVE['class-2-odd-text'] = q => {
  const g = q.proof.givens;
  const items = q.options;
  if (g.kind === 'w') {
    const main = WORD_GROUPS.find(x => x.id === g.main);
    return items.find(x => !main.items.includes(x));
  }
  if (g.kind === 'l-vowel') return items.find(x => !VOWELS.includes(x));
  if (g.kind === 'l-consonant') return items.find(x => VOWELS.includes(x));
  const singles = NUMBER_RULES.map(rl => {
    const nums = items.map(Number);
    const yes = nums.filter(n => rl.yes(n));
    if (yes.length === 1) return yes[0];
    if (yes.length === 3) return nums.find(n => !rl.yes(n));
    return null;
  }).filter(v => v !== null);
  return String(singles[0]);
};

// ---------------------------------------------------------------------------
// Analogies
// ---------------------------------------------------------------------------
const RELATIONS = [
  { id: 'sound', pairs: [['cow', 'moo'], ['dog', 'bark'], ['cat', 'meow'], ['lion', 'roar'], ['duck', 'quack'], ['hen', 'cluck'], ['horse', 'neigh']] },
  { id: 'home', pairs: [['bird', 'nest'], ['bee', 'hive'], ['dog', 'kennel'], ['horse', 'stable'], ['lion', 'den'], ['spider', 'web'], ['cow', 'shed']] },
  { id: 'use', pairs: [['eye', 'see'], ['ear', 'hear'], ['nose', 'smell'], ['tongue', 'taste'], ['leg', 'walk'], ['hand', 'hold']] },
  { id: 'tool', pairs: [['knife', 'cut'], ['pen', 'write'], ['broom', 'sweep'], ['needle', 'sew'], ['brush', 'paint'], ['spoon', 'stir']] },
  { id: 'young', pairs: [['puppy', 'dog'], ['kitten', 'cat'], ['calf', 'cow'], ['lamb', 'sheep'], ['chick', 'hen'], ['cub', 'lion'], ['foal', 'horse']] },
  { id: 'opposite', pairs: [['hot', 'cold'], ['up', 'down'], ['day', 'night'], ['big', 'small'], ['open', 'close'], ['full', 'empty'], ['fast', 'slow'], ['wet', 'dry']] },
  { id: 'part', pairs: [['wheel', 'car'], ['petal', 'flower'], ['page', 'book'], ['leaf', 'tree'], ['wing', 'bird'], ['finger', 'hand']] },
];
const NUMBER_LINKS = [
  { id: 'double', f: n => n * 2, name: 'double it', from: [2, 3, 4, 5, 6, 7, 8, 9] },
  { id: 'half', f: n => n / 2, name: 'halve it', from: [4, 6, 8, 10, 12, 14, 16, 18, 20] },
  { id: 'plus10', f: n => n + 10, name: 'add 10', from: [3, 7, 12, 15, 21, 34, 46, 58] },
  { id: 'minus5', f: n => n - 5, name: 'subtract 5', from: [9, 12, 15, 20, 26, 31, 44] },
  { id: 'times10', f: n => n * 10, name: 'multiply by 10', from: [2, 3, 4, 5, 6, 7, 8] },
];

DRAFT['class-2-analogy'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  if (level === 3 && r.pick([true, false])) {
    const link = r.pick(NUMBER_LINKS);
    const [a, c] = r.shuffle(link.from).slice(0, 2);
    const answer = link.f(c);
    return {
      family, answer: String(answer),
      prompt: `${a} goes with ${link.f(a)}. In the same way, ${c} goes with ___.`,
      hint: 'Find how the first number changes into the second number, then do the same to the third number.',
      explanation: `${a} becomes ${link.f(a)} when you ${link.name}. Doing the same to ${c} gives ${answer}.`,
      proof: { family, givens: { link: link.id, a, c } }, visual: null,
      choices: choose(answer, [[c + link.f(a) - a, 'class-2-analogy-link'], [c + a, 'class-2-analogy-link'], [link.f(a), 'class-2-analogy-link'], [answer + 1, 'class-2-analogy-link'], [answer + 10, 'class-2-analogy-link'], [Math.max(1, answer - 2), 'class-2-analogy-link']], count, r, { numeric: true }),
    };
  }
  const ri = r.int(0, RELATIONS.length - 1);
  const rel = RELATIONS[ri];
  const [i, j] = r.shuffle(rel.pairs.map((_, k) => k)).slice(0, 2);
  const [x1, y1] = rel.pairs[i];
  const [x2, y2] = rel.pairs[j];
  if (x1 === x2 || y1 === y2) throw new QuestionRetry('Need distinct pairs.');
  const linkedTo = word => RELATIONS.some(o => o.pairs.some(p => (p[0] === x2 && p[1] === word) || (p[1] === x2 && p[0] === word)));
  const others = r.shuffle(RELATIONS.filter((_, k) => k !== ri).flatMap(o => o.pairs.map(p => p[1]))).filter(word => word !== y2 && word !== x2 && !linkedTo(word) && !rel.pairs.some(p => p[1] === word));
  const label = { sound: 'animal and its sound', home: 'animal and its home', use: 'body part and its job', tool: 'tool and its job', young: 'baby and its grown-up', opposite: 'opposites', part: 'part and whole' }[rel.id];
  const pair = r.pick([`${cap(x1)} goes with ${y1}. In the same way, ${x2} goes with ___.`, `As ${x1} is to ${y1}, ${x2} is to ___.`, `${cap(x1)} : ${y1} and ${x2} : ___. Which word fits?`]);
  return {
    family, answer: y2,
    prompt: level < 3 ? `Link: ${label}. ${pair}` : pair,
    hint: `Say how ${x1} and ${y1} are linked. Use the same link for ${x2}.`,
    explanation: `${cap(x1)} and ${y1} are linked as ${rel.id === 'sound' ? 'animal and sound' : rel.id === 'home' ? 'animal and home' : rel.id === 'use' ? 'body part and job' : rel.id === 'tool' ? 'tool and job' : rel.id === 'young' ? 'baby and grown-up' : rel.id === 'opposite' ? 'opposites' : 'part and whole'}. So ${x2} goes with ${y2}.`,
    proof: { family, givens: { link: 'word', ri, i, j } }, visual: null,
    choices: answerChoices(y2, others.slice(0, count - 1).map(word => wrong(word, 'class-2-analogy-link')), count, null, KNOWN),
  };
};
SOLVE['class-2-analogy'] = q => {
  const g = q.proof.givens;
  if (g.link === 'word') return RELATIONS[g.ri].pairs[g.j][1];
  return String(NUMBER_LINKS.find(l => l.id === g.link).f(g.c));
};

// ---------------------------------------------------------------------------
// Letter series and alphabet counting
// ---------------------------------------------------------------------------
const letterTerms = (type, start, step, length) => {
  const out = [start];
  for (let i = 1; i < length; i++) out.push(out[i - 1] + (type === 'grow' ? i : type === 'back' ? -step : step));
  return out;
};

DRAFT['class-2-letter-gap'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['series', 'series', 'between'] : ['series', 'series', 'count']);
  if (mode === 'series') {
    const type = r.pick(level === 3 ? ['fwd', 'back', 'grow'] : ['fwd', 'back']);
    const step = type === 'grow' ? 1 : r.int(1, level === 1 ? 2 : 3);
    const length = r.int(5, 6);
    const span = type === 'grow' ? (length * (length - 1)) / 2 : (length - 1) * step;
    const start = type === 'back' ? r.int(span + 1, 26) : r.int(1, 26 - span);
    const terms = letterTerms(type, start, step, length);
    if (terms.some(n => n < 1 || n > 26)) throw new QuestionRetry('Letters out of range.');
    const hidden = r.int(2, length - 2);
    const letters = terms.map(n => LETTERS[n - 1]);
    const answerN = terms[hidden];
    const shown = letters.map((l, i) => (i === hidden ? '?' : l)).join(', ');
    const gapBefore = terms[hidden] - terms[hidden - 1];
    const pairs = [[answerN + 1, 'class-2-letter-step'], [answerN - 1, 'class-2-letter-step'], [answerN + 2, 'class-2-letter-step'], [answerN - 2, 'class-2-letter-step'], [terms[hidden - 1], 'class-2-letter-step'], [terms[hidden + 1], 'class-2-letter-step']]
      .filter(([n]) => n >= 1 && n <= 26 && n !== answerN)
      .map(([n, code]) => [LETTERS[n - 1], code]);
    return {
      family, answer: LETTERS[answerN - 1],
      prompt: r.pick([`Find the missing letter: ${shown}.`, `Which letter replaces ? in this series: ${shown}?`, `Complete the letter series: ${shown}.`]),
      hint: 'Count how many letters each step moves in the alphabet.',
      explanation: type === 'grow'
        ? `The steps grow by 1 each time (${terms.slice(1).map((n, i) => n - terms[i]).join(', ')}). The ? is ${LETTERS[answerN - 1]}.`
        : `Each step moves ${step} letter${step === 1 ? '' : 's'} ${type === 'back' ? 'back' : 'forward'} (${letters[hidden - 1]} to ${LETTERS[answerN - 1]}), so the ? is ${LETTERS[answerN - 1]}.`,
      proof: { family, givens: { mode, type, start, step, length, hidden, gapBefore } }, visual: null,
      choices: choose(LETTERS[answerN - 1], pairs, count, r),
    };
  }
  if (mode === 'between') {
    const a = r.int(2, 18);
    const b = a + 2;
    return {
      family, answer: LETTERS[a],
      prompt: r.pick([`Which letter comes between ${LETTERS[a - 1]} and ${LETTERS[b - 1]} in the alphabet?`, `Which letter is just after ${LETTERS[a - 1]} and just before ${LETTERS[b - 1]}?`]),
      hint: 'Say the alphabet in order and stop between the two letters.',
      explanation: `In the alphabet the order is ${LETTERS[a - 1]}, ${LETTERS[a]}, ${LETTERS[b - 1]}. So ${LETTERS[a]} is between them.`,
      proof: { family, givens: { mode, a } }, visual: null,
      choices: choose(LETTERS[a], [[LETTERS[a - 2], 'class-2-letter-step'], [LETTERS[b], 'class-2-letter-step'], [LETTERS[a + 2] ?? 'Z', 'class-2-letter-step'], [LETTERS[a - 1], 'class-2-letter-step']], count, r),
    };
  }
  const a = r.int(1, 12);
  const gap = r.int(3, level === 3 ? 12 : 8);
  const b = a + gap;
  return {
    family, answer: String(gap - 1),
    prompt: `How many letters are there between ${LETTERS[a - 1]} and ${LETTERS[b - 1]} in the alphabet?`,
    hint: 'Do not count the two named letters. Count only the ones between.',
    explanation: `${LETTERS[b - 1]} is ${gap} places after ${LETTERS[a - 1]}. The letters strictly between are ${gap} - 1 = ${gap - 1}.`,
    proof: { family, givens: { mode, a, b } }, visual: null,
    choices: choose(gap - 1, [[gap, 'class-2-letter-step'], [gap + 1, 'class-2-letter-step'], [gap - 2, 'class-2-letter-step'], [gap - 3, 'class-2-letter-step'], [gap - 4, 'class-2-letter-step'], [gap + 2, 'class-2-letter-step'], [b, 'class-2-letter-step']].filter(([value]) => value > 0), count, r, { numeric: true }),
  };
};
SOLVE['class-2-letter-gap'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'series') return LETTERS[letterTerms(g.type, g.start, g.step, g.length)[g.hidden] - 1];
  if (g.mode === 'between') return LETTERS[g.a];
  return String(g.b - g.a - 1);
};

// ---------------------------------------------------------------------------
// Days and months
// ---------------------------------------------------------------------------
DRAFT['class-2-day-after'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['after', 'before', 'chain'] : ['after', 'before', 'chain', 'month']);
  const day = r.int(0, 6);
  const k = level === 1 ? r.int(1, 4) : level === 2 ? r.int(3, 9) : r.int(8, 25);
  const pickDays = (answerIndex, offsets) => offsets.map(o => [DAYS[((answerIndex + o) % 7 + 7) % 7], 'class-2-day-count']);
  if (mode === 'after' || mode === 'before') {
    const sign = mode === 'after' ? 1 : -1;
    const answerIndex = ((day + sign * k) % 7 + 7) % 7;
    return {
      family, answer: DAYS[answerIndex],
      prompt: mode === 'after'
        ? r.pick([`Today is ${DAYS[day]}. What day will it be ${plural(k, 'day')} from today?`, `What day comes ${plural(k, 'day')} after ${DAYS[day]}?`])
        : r.pick([`Today is ${DAYS[day]}. What day was it ${plural(k, 'day')} ago?`, `What day comes ${plural(k, 'day')} before ${DAYS[day]}?`]),
      hint: 'Count on one day at a time. A week has 7 days, then the names repeat.',
      explanation: `${plural(k, 'day')} ${mode === 'after' ? 'after' : 'before'} ${DAYS[day]}: ${k % 7 === 0 ? 'a whole number of weeks gives the same day' : `${k % 7} step${k % 7 === 1 ? '' : 's'} ${mode === 'after' ? 'forward' : 'back'} after whole weeks`}. The day is ${DAYS[answerIndex]}.`,
      proof: { family, givens: { mode, day, k } }, visual: null,
      choices: answerChoices(DAYS[answerIndex], pickDays(answerIndex, r.shuffle([1, -1, 2, -2, 3])).slice(0, 4).map(([v, c]) => wrong(v, c)), count, null, KNOWN),
    };
  }
  if (mode === 'chain') {
    const form = r.pick(level === 1 ? ['dat', 'dby'] : ['dat', 'dby', 'yt', 'ty']);
    const shift = form === 'dat' || form === 'ty' ? -2 : 2;
    const answerIndex = ((day + shift) % 7 + 7) % 7;
    return {
      family, answer: DAYS[answerIndex],
      prompt: form === 'dat'
        ? `The day after tomorrow is ${DAYS[day]}. What day is it today?`
        : form === 'dby'
          ? `The day before yesterday was ${DAYS[day]}. What day is it today?`
          : form === 'yt'
            ? `Yesterday was ${DAYS[day]}. What day will it be tomorrow?`
            : `Tomorrow is ${DAYS[day]}. What day was it yesterday?`,
      hint: form === 'yt' || form === 'ty' ? 'Work out today first, then move one day on or back.' : 'Count back (or on) two days from the named day to reach today.',
      explanation: form === 'dat'
        ? `Day after tomorrow is 2 days from today, so today is 2 days before ${DAYS[day]}: ${DAYS[answerIndex]}.`
        : form === 'dby'
          ? `The day before yesterday is 2 days back from today, so today is 2 days after ${DAYS[day]}: ${DAYS[answerIndex]}.`
          : form === 'yt'
            ? `Today is the day after ${DAYS[day]}. Tomorrow is one more day on, so it is ${DAYS[answerIndex]}.`
            : `Today is the day before ${DAYS[day]}. Yesterday is one more day back, so it was ${DAYS[answerIndex]}.`,
      proof: { family, givens: { mode, form, day } }, visual: null,
      choices: answerChoices(DAYS[answerIndex], pickDays(answerIndex, r.shuffle([1, -1, 2, -2, 3])).slice(0, 4).map(([v, c]) => wrong(v, c)), count, null, KNOWN),
    };
  }
  const m = r.int(0, 11);
  const km = r.int(2, level === 3 ? 20 : 8);
  const answerIndex = (m + km) % 12;
  return {
    family, answer: MONTHS[answerIndex],
    prompt: `Which month comes ${km} months after ${MONTHS[m]}?`,
    hint: 'Count on month by month. After December the year starts again with January.',
    explanation: `${km} months after ${MONTHS[m]} is ${MONTHS[answerIndex]}, counting on and starting again after December.`,
    proof: { family, givens: { mode, m, km } }, visual: null,
    choices: answerChoices(MONTHS[answerIndex], r.shuffle([1, -1, 2, -2, 3]).slice(0, 4).map(o => wrong(MONTHS[((answerIndex + o) % 12 + 12) % 12], 'class-2-day-count')), count, null, KNOWN),
  };
};
SOLVE['class-2-day-after'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'after') return DAYS[(g.day + g.k) % 7];
  if (g.mode === 'before') return DAYS[((g.day - g.k) % 7 + 7) % 7];
  if (g.mode === 'chain') return DAYS[((g.day + (g.form === 'dat' || g.form === 'ty' ? -2 : 2)) % 7 + 7) % 7];
  return MONTHS[(g.m + g.km) % 12];
};

// ---------------------------------------------------------------------------
// Clue numbers
// ---------------------------------------------------------------------------
const digitsOf = n => String(n).split('').map(Number);
const CLUE_TEST = {
  hundreds: (n, c) => Math.floor(n / 100) === c.v,
  tens: (n, c) => Math.floor(n / 10) % 10 === c.v,
  ones: (n, c) => n % 10 === c.v,
  sum: (n, c) => digitsOf(n).reduce((a, b) => a + b, 0) === c.v,
  parity: (n, c) => (n % 2 === 0) === (c.v === 'even'),
  five: n => n % 5 === 0,
  between: (n, c) => n > c.v && n < c.w,
};
const clueText = c => ({
  hundreds: `hundreds digit is ${c.v}`, tens: `tens digit is ${c.v}`, ones: `ones digit is ${c.v}`, sum: `digits add up to ${c.v}`,
  parity: `it is ${c.v}`, five: 'it is a multiple of 5', between: `it is between ${c.v} and ${c.w}`,
}[c.t]);
const meets = (n, clues) => clues.filter(c => CLUE_TEST[c.t](n, c)).length;

DRAFT['class-2-clue-number'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const [lo, hi] = level === 1 ? [10, 99] : [100, 999];
  const digits = level === 1 ? 2 : 3;
  const target = r.int(lo + 5, hi - 5);
  const d = digitsOf(target);
  const all = [
    ...(digits === 3 ? [{ t: 'hundreds', v: d[0] }] : []),
    { t: 'tens', v: d[digits - 2] }, { t: 'ones', v: d[digits - 1] },
    { t: 'sum', v: d.reduce((a, b) => a + b, 0) },
    { t: 'parity', v: target % 2 === 0 ? 'even' : 'odd' },
    ...(target % 5 === 0 ? [{ t: 'five' }] : []),
    { t: 'between', v: target - r.int(2, 9), w: target + r.int(2, 9) },
  ];
  const clueCount = level === 3 ? 4 : 3;
  for (let attempt = 0; attempt < 40; attempt++) {
    const clues = r.shuffle(all).slice(0, clueCount);
    const solutions = [];
    for (let n = lo; n <= hi; n++) if (meets(n, clues) === clues.length) solutions.push(n);
    if (solutions.length !== 1) continue;
    const near = [];
    for (let n = lo; n <= hi; n++) if (n !== target && meets(n, clues) === clues.length - 1) near.push(n);
    if (near.length < count - 1) continue;
    const prompt = `Guess my ${digits}-digit number: ${clues.slice(0, -1).map(clueText).join(', ')} and ${clueText(clues.at(-1))}.`;
    if (prompt.split(/\s+/).length > 24 || prompt.length > 140) continue;
    const pairs = r.shuffle(near).map(n => [n, 'ignored-condition']);
    return {
      family, answer: String(target), prompt,
      hint: 'Test each option against every clue. A number must fit all of them.',
      explanation: `${target}: ${clues.map(clueText).join('; ')}. Every other option breaks at least one clue.`,
      proof: { family, givens: { lo, hi, clues } }, visual: null,
      choices: choose(target, pairs, count, r, { numeric: true }),
    };
  }
  throw new QuestionRetry('Clues were not unique.');
};
SOLVE['class-2-clue-number'] = q => {
  const { lo, hi, clues } = q.proof.givens;
  const found = [];
  for (let n = lo; n <= hi; n++) if (meets(n, clues) === clues.length) found.push(n);
  if (found.length !== 1) throw new Error('Clues should give one number.');
  return String(found[0]);
};

// ---------------------------------------------------------------------------
// Digit cards
// ---------------------------------------------------------------------------
const permutations = list => (list.length <= 1 ? [list] : list.flatMap((item, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map(rest => [item, ...rest])));

DRAFT['class-2-make-numbers'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['greatest', 'smallest'] : level === 2 ? ['greatest', 'smallest', 'count-no-repeat'] : ['count-no-repeat', 'count-repeat', 'second-greatest']);
  if (mode === 'count-no-repeat' || mode === 'count-repeat') {
    const cards = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, level === 3 ? r.int(3, 4) : 3);
    const n = cards.length;
    const total = mode === 'count-repeat' ? n * n : n * (n - 1);
    const pairs = [[n, 'class-2-make-numbers'], [n * 2, 'class-2-make-numbers'], [mode === 'count-repeat' ? n * (n - 1) : n * n, 'class-2-make-numbers'], [total + 1, 'class-2-make-numbers'], [total - 1, 'class-2-make-numbers'], [total + n, 'class-2-make-numbers']];
    return {
      family, answer: String(total),
      prompt: `How many different 2-digit numbers can be made from the digits ${cards.slice(0, -1).join(', ')} and ${cards.at(-1)}, ${mode === 'count-repeat' ? 'if a digit can be used twice' : 'if no digit repeats'}?`,
      hint: 'Count the choices for the tens digit, then the choices for the ones digit.',
      explanation: `Tens digit: ${n} choices. Ones digit: ${mode === 'count-repeat' ? n : n - 1} choices. ${n} x ${mode === 'count-repeat' ? n : n - 1} = ${total} numbers.`,
      proof: { family, givens: { mode, cards } }, visual: null,
      choices: choose(total, pairs, count, r, { numeric: true }),
    };
  }
  const size = level === 1 ? 3 : mode === 'second-greatest' ? 3 : r.int(3, 4);
  let cards = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, size);
  if (mode !== 'smallest' && cards.includes(0)) cards = cards.map(x => (x === 0 ? r.pick([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(v => !cards.includes(v))) : x));
  const asNumber = list => Number(list.join(''));
  const desc = [...cards].sort((a, b) => b - a);
  const asc = [...cards].sort((a, b) => a - b);
  let smallest;
  if (asc[0] === 0) { const k = asc.findIndex(x => x !== 0); smallest = [asc[k], ...asc.slice(0, k), ...asc.slice(k + 1)]; } else smallest = asc;
  const perms = permutations(cards).filter(p => p[0] !== 0).map(asNumber).sort((a, b) => b - a);
  let answer;
  let word;
  if (mode === 'greatest') { answer = asNumber(desc); word = 'greatest'; }
  else if (mode === 'smallest') { answer = asNumber(smallest); word = 'smallest'; }
  else { answer = perms[1]; word = 'second greatest'; }
  const pairs = [[asNumber(cards), 'class-2-make-numbers'], [asNumber(asc), 'place-shift'], [asNumber(desc), 'place-shift'], [perms[1], 'place-shift'], [perms.at(-1), 'place-shift'], [perms[2], 'place-shift'], [asNumber([...cards].reverse()), 'class-2-make-numbers']];
  return {
    family, answer: String(answer),
    prompt: `Use each digit card ${cards.slice(0, -1).join(', ')} and ${cards.at(-1)} once. What is the ${word} ${size}-digit number you can make?`,
    hint: word === 'smallest' ? (cards.includes(0) ? 'Put the smallest digit first, but a number cannot start with 0.' : 'Put the smallest digits in the highest places.') : 'Put the biggest digits in the highest places.',
    explanation: mode === 'second-greatest'
      ? `The greatest is ${perms[0]}. Swap the last two digits to get the next one down: ${perms[1]}.`
      : `${word === 'smallest' ? 'Smallest digits go in the highest places, but not 0 first' : 'Biggest digits go in the highest places'}: ${answer}.`,
    proof: { family, givens: { mode, cards } }, visual: null,
    choices: choose(answer, pairs, count, r, { numeric: true }),
  };
};
SOLVE['class-2-make-numbers'] = q => {
  const { mode, cards } = q.proof.givens;
  const n = cards.length;
  if (mode === 'count-repeat') return String(n * n);
  if (mode === 'count-no-repeat') return String(n * (n - 1));
  const perms = permutations(cards).filter(p => p[0] !== 0).map(p => Number(p.join(''))).sort((a, b) => b - a);
  if (mode === 'greatest') return String(perms[0]);
  if (mode === 'smallest') return String(perms.at(-1));
  return String(perms[1]);
};

// ---------------------------------------------------------------------------
// Number series
// ---------------------------------------------------------------------------
const seriesTerms = (type, start, a, b, length) => {
  const out = [start];
  for (let i = 1; i < length; i++) {
    const prev = out[i - 1];
    if (type === 'add') out.push(prev + a);
    else if (type === 'sub') out.push(prev - a);
    else if (type === 'alt') out.push(prev + (i % 2 === 1 ? a : b));
    else if (type === 'grow') out.push(prev + i * a);
    else out.push(prev * 2);
  }
  return out;
};

DRAFT['class-2-number-series'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const type = r.pick(level === 1 ? ['add', 'add', 'sub'] : level === 2 ? ['add', 'sub', 'alt'] : ['alt', 'grow', 'double', 'sub']);
  const a = type === 'grow' ? 1 : type === 'double' ? 2 : r.pick(level === 1 ? [2, 3, 4, 5, 10] : [3, 4, 5, 6, 7, 8, 10, 20]);
  const b = type === 'alt' ? r.pick([1, 2, 3, 4].filter(v => v !== a)) : a;
  const length = type === 'double' ? 5 : r.int(5, 6);
  const start = type === 'sub' ? r.int(length * a + 3, length * a + 40) : type === 'double' ? r.int(1, 6) : r.int(2, 40);
  const terms = seriesTerms(type, start, a, b, length);
  const hidden = r.int(2, length - 1);
  const answer = terms[hidden];
  const shown = terms.map((n, i) => (i === hidden ? '?' : n)).join(', ');
  const gap = terms[hidden] - terms[hidden - 1];
  const pairs = [[answer + 1, 'class-2-series-gap'], [answer - 1, 'class-2-series-gap'], [terms[hidden - 1] + (terms[1] - terms[0]), 'class-2-series-gap'], [answer + a, 'class-2-series-gap'], [Math.max(1, answer - a), 'class-2-series-gap'], [terms[hidden - 1] + terms[hidden - 2], 'wrong-operation']];
  return {
    family, answer: String(answer),
    prompt: r.pick([`Find the missing number in the series: ${shown}.`, `Which number should replace ? in this series: ${shown}${hidden === length - 1 ? '' : '?'}`, `What number is missing from this series: ${shown}${hidden === length - 1 ? '' : '?'}`]),
    hint: type === 'double' ? 'Check how each term compares with the one before it.' : 'Find the gap between neighbouring numbers. It may change.',
    explanation: type === 'double'
      ? `Each term is double the one before it. Double ${terms[hidden - 1]} is ${answer}.`
      : type === 'grow'
        ? `The gaps grow by 1 each time. The gap before ? is ${gap}, so ? = ${terms[hidden - 1]} + ${gap} = ${answer}.`
        : type === 'alt'
          ? `The gaps alternate +${a}, +${b}. The gap before ? is ${gap}, so ? = ${terms[hidden - 1]} + ${gap} = ${answer}.`
          : `Each step ${type === 'add' ? 'adds' : 'takes away'} ${a}, the same amount every time. So ? = ${terms[hidden - 1]} ${type === 'add' ? '+' : '-'} ${a} = ${answer}.`,
    proof: { family, givens: { type, start, a, b, length, hidden } }, visual: null,
    choices: choose(answer, pairs, count, r, { numeric: true }),
  };
};
SOLVE['class-2-number-series'] = q => {
  const g = q.proof.givens;
  return String(seriesTerms(g.type, g.start, g.a, g.b, g.length)[g.hidden]);
};

export function renderReasoning(visual) {
  if (visual.kind === 'v3-class-2-shapelines') return renderShapeLines(visual);
  return null;
}

export { KIND_WORDS, KINDS, countsOf, kindText, moreText, BLUE, PURPLE, cap };
