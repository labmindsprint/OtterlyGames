// Class 2 "real paper" Mathematical Reasoning, Everyday Mathematics and Achiever families, modelled on SOF IMO Class 2 items. Imported by bank3-class-2.mjs.
import { answerChoices, choiceCount, QuestionRetry, wrong } from './bank-shared.mjs';
import { plural } from './bank3-class-2-engines.mjs';
import { KINDS, KNOWN, NAMES, BLUE, cap, choose, countsOf, kindText, moreText, shapePicture } from './bank3-class-2-real.mjs';
import { clockDescription, clockFace, line, rect, svg, text, GREEN, INK, ORANGE, PAPER } from './diagram-kit.mjs';

export const MIXED_FAMILIES = {
  'class-2-digit-cloud': { skill: 'place', title: 'Count the numbers in a cloud that follow a digit rule' },
  'class-2-place-compare': { skill: 'compare', title: 'Compare place values and face values of digits' },
  'class-2-symbol-digits': { skill: 'mystery', title: 'Find the value of a letter from sum clues' },
  'class-2-add-story-real': { skill: 'addition', title: 'Solve two-step addition and subtraction stories' },
  'class-2-picture-facts': { skill: 'shape', title: 'Decide which statements about a picture are true' },
  'class-2-picto-pair': { skill: 'chart', title: 'Read a pictograph for two-part answers and totals' },
  'class-2-cylinder-diff': { skill: 'measure', title: 'Compare water in two measuring cylinders' },
  'class-2-clock-elapsed': { skill: 'time', title: 'Find the finish time or minutes left from a clock' },
  'class-2-amount-form': { skill: 'money', title: 'Spot the wrong way to write an amount' },
  'class-2-price-tags': { skill: 'money', title: 'Total or change from price tags' },
};

export const DRAFT = {};
export const SOLVE = {};

const positive = pairs => pairs.filter(([value]) => Number(value) > 0);
const nounPairs = [['mango', 'mangoes'], ['book', 'books'], ['pencil', 'pencils'], ['marble', 'marbles'], ['stamp', 'stamps'], ['sticker', 'stickers'], ['balloon', 'balloons'], ['coin', 'coins']];
const digitSum = n => String(n).split('').reduce((a, b) => a + Number(b), 0);

// ---------------------------------------------------------------------------
// Digit cloud: how many numbers follow a rule?
// ---------------------------------------------------------------------------
const CLOUD_TEST = {
  sum: (n, g) => digitSum(n) === g.k,
  tens: (n, g) => Math.floor(n / 10) % 10 === g.k,
  ones: (n, g) => n % 10 === g.k,
  between: (n, g) => n > g.lo && n < g.hi,
};

DRAFT['class-2-digit-cloud'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(['sum', 'tens', 'ones', 'between']);
  const low = level === 1 ? 10 : 100;
  const high = level === 1 ? 99 : 999;
  const size = level === 3 ? 10 : 8;
  for (let attempt = 0; attempt < 40; attempt++) {
    const numbers = new Set();
    while (numbers.size < size) numbers.add(r.int(low, high));
    const list = r.shuffle([...numbers]);
    const sorted = [...list].sort((a, b) => a - b);
    const g = { mode };
    if (mode === 'sum') g.k = digitSum(r.pick(list));
    else if (mode === 'tens') g.k = Math.floor(r.pick(list) / 10) % 10;
    else if (mode === 'ones') g.k = r.pick(list) % 10;
    else {
      const a = r.int(0, size - 3);
      const b = r.int(a + 1, Math.min(size - 1, a + 4));
      g.lo = Math.floor((sorted[a] - 1) / 10) * 10;
      g.hi = Math.ceil((sorted[b] + 1) / 10) * 10;
    }
    const hits = list.filter(n => CLOUD_TEST[mode](n, g)).sort((a, b) => a - b);
    if (hits.length < 1 || hits.length > 4) continue;
    const answer = hits.length;
    const near = mode === 'sum'
      ? list.filter(n => Math.abs(digitSum(n) - g.k) === 1).length
      : mode === 'between' ? list.filter(n => n >= g.lo && n <= g.hi).length : list.filter(n => String(n).includes(String(g.k))).length;
    const prompt = {
      sum: r.pick([`How many numbers in the cloud have digits that add up to ${g.k}?`, `In the cloud, how many numbers have a digit sum of ${g.k}?`]),
      tens: r.pick([`How many numbers in the cloud have ${g.k} in the tens place?`, `In the cloud, how many numbers have the digit ${g.k} in the tens place?`]),
      ones: r.pick([`How many numbers in the cloud have ${g.k} in the ones place?`, `In the cloud, how many numbers end with the digit ${g.k}?`]),
      between: `How many numbers in the cloud are greater than ${g.lo} and less than ${g.hi}?`,
    }[mode];
    return {
      family, answer: String(answer), prompt,
      hint: 'Check the numbers in the cloud one at a time and keep a count.',
      explanation: `${hits.length === 1 ? `Only ${hits[0]} fits the rule` : `The numbers that fit are ${hits.slice(0, -1).join(', ')} and ${hits.at(-1)}`}, so the answer is ${answer}.`,
      proof: { family, givens: g },
      visual: { kind: 'v3-class-2-numcloud', numbers: list, description: `A cloud holding ${size} numbers: ${list.join(', ')}.` },
      choices: choose(answer, positive([[answer + 1, 'class-2-digit-rule'], [answer - 1, 'class-2-digit-rule'], [answer + 2, 'class-2-digit-rule'], [near, 'class-2-digit-rule'], [size, 'missed-object']]), count, r, { numeric: true }),
    };
  }
  throw new QuestionRetry('Could not build a cloud with a clean answer.');
};
SOLVE['class-2-digit-cloud'] = q => String(q.visual.numbers.filter(n => CLOUD_TEST[q.proof.givens.mode](n, q.proof.givens)).length);

// ---------------------------------------------------------------------------
// Place value and face value
// ---------------------------------------------------------------------------
const placeValue = (digit, number) => {
  const s = String(number);
  return digit * 10 ** (s.length - 1 - s.indexOf(String(digit)));
};
const distinctDigits = (r, digits, nonzeroFirst = true) => {
  for (let i = 0; i < 60; i++) {
    const n = r.int(10 ** (digits - 1), 10 ** digits - 1);
    const s = String(n);
    if (new Set(s).size === digits && (!nonzeroFirst || s[0] !== '0')) return n;
  }
  throw new QuestionRetry('No distinct-digit number.');
};
const pickDigit = (r, n) => r.pick(String(n).split('').filter(d => d !== '0')).charCodeAt(0) - 48;

DRAFT['class-2-place-compare'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const digits = level === 1 ? 2 : 3;
  const mode = r.pick(level === 1 ? ['gap', 'diff-two'] : ['gap', 'diff-two', 'sum-two']);
  if (mode === 'gap') {
    const X = distinctDigits(r, digits);
    const d = pickDigit(r, X);
    const pv = placeValue(d, X);
    if (pv === d) throw new QuestionRetry('The digit is in the ones place.');
    const answer = pv - d;
    return {
      family, answer: String(answer),
      prompt: r.pick([`What is the difference between the place value and the face value of ${d} in ${X}?`, `In ${X}, how much more is the place value of ${d} than its face value?`]),
      hint: 'The face value is the digit itself. The place value depends on its place.',
      explanation: `In ${X}, ${d} has place value ${pv} and face value ${d}. ${pv} - ${d} = ${answer}.`,
      proof: { family, givens: { mode, X, d } }, visual: null,
      choices: choose(answer, positive([[pv, 'face-value'], [d, 'face-value'], [pv + d, 'wrong-operation'], [pv * 10 - d, 'place-shift'], [pv / 10 - d, 'place-shift'], [answer + 1, 'face-value']]), count, r, { numeric: true }),
    };
  }
  let X = distinctDigits(r, digits);
  let Y = distinctDigits(r, digits);
  let a = pickDigit(r, X);
  let b = pickDigit(r, Y);
  if (mode === 'diff-two') {
    if (placeValue(a, X) === placeValue(b, Y)) throw new QuestionRetry('Equal place values.');
    if (placeValue(a, X) < placeValue(b, Y)) [X, Y, a, b] = [Y, X, b, a];
  }
  const pa = placeValue(a, X);
  const pb = placeValue(b, Y);
  const answer = mode === 'diff-two' ? pa - pb : pa + pb;
  return {
    family, answer: String(answer),
    prompt: mode === 'diff-two'
      ? `How much more is the place value of ${a} in ${X} than the place value of ${b} in ${Y}?`
      : `What is the sum of the place value of ${a} in ${X} and the place value of ${b} in ${Y}?`,
    hint: 'Find each place value first, then add or subtract them.',
    explanation: `The place value of ${a} in ${X} is ${pa}. The place value of ${b} in ${Y} is ${pb}. ${pa} ${mode === 'diff-two' ? '-' : '+'} ${pb} = ${answer}.`,
    proof: { family, givens: { mode, X, Y, a, b } }, visual: null,
    choices: choose(answer, positive([
      [mode === 'diff-two' ? a - b : a + b, 'face-value'], [mode === 'diff-two' ? pa + pb : Math.abs(pa - pb), 'wrong-operation'],
      [answer + 10, 'place-shift'], [answer - 10, 'place-shift'], [answer + 100, 'place-shift'], [answer - 100, 'place-shift'], [pa, 'missing-step'],
    ]), count, r, { numeric: true }),
  };
};
SOLVE['class-2-place-compare'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'gap') return String(placeValue(g.d, g.X) - g.d);
  const pa = placeValue(g.a, g.X);
  const pb = placeValue(g.b, g.Y);
  return String(g.mode === 'diff-two' ? pa - pb : pa + pb);
};

// ---------------------------------------------------------------------------
// Letters standing for digits
// ---------------------------------------------------------------------------
const LETTER_SETS = [['A', 'B', 'C'], ['P', 'Q', 'R'], ['X', 'Y', 'Z'], ['M', 'N', 'S']];
const repeatSum = (letter, times) => Array(times).fill(letter).join(' + ');

DRAFT['class-2-symbol-digits'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const set = r.int(0, LETTER_SETS.length - 1);
  const [A, B, C] = LETTER_SETS[set];
  const mode = r.pick(level === 1 ? ['two', 'two', 'more'] : level === 2 ? ['two', 'more', 'more', 'three-sum'] : ['two', 'three-sum', 'three-sum', 'more']);
  if (mode === 'two') {
    const m = r.pick([2, 3]);
    const a = r.int(2, level === 1 ? 6 : 9);
    const b = r.int(1, 9);
    if (a === b) throw new QuestionRetry('Letters would share a value.');
    const ask = r.pick(level === 3 ? ['B', 'B + B', 'A + B + B'] : ['B', 'B + B']);
    const answer = ask === 'B' ? b : ask === 'B + B' ? 2 * b : a + 2 * b;
    const label = ask === 'B' ? `the value of ${B}` : ask.replaceAll('A', A).replaceAll('B', B);
    return {
      family, answer: String(answer),
      prompt: `If ${repeatSum(A, m)} = ${m * a} and ${A} + ${B} = ${a + b}, what is ${label}?`,
      hint: `Use the first clue to find ${A}. Then use ${A} in the second clue.`,
      explanation: `${repeatSum(A, m)} = ${m * a}, so ${A} = ${a}. Then ${A} + ${B} = ${a + b} gives ${B} = ${b}. So ${ask.replaceAll('A', A).replaceAll('B', B)} = ${answer}.`,
      proof: { family, givens: { mode, set, m, S1: m * a, S2: a + b, ask } }, visual: null,
      choices: choose(answer, positive([[a, 'class-2-symbol-chain'], [a + b, 'class-2-symbol-chain'], [m * a, 'class-2-symbol-chain'], [answer + 1, 'class-2-symbol-chain'], [answer - 1, 'class-2-symbol-chain'], [a + b + b, 'wrong-operation']]), count, r, { numeric: true }),
    };
  }
  if (mode === 'more') {
    const b = r.int(2, level === 1 ? 6 : 9);
    const d = r.int(2, 8);
    const ask = r.pick([A, `${A} + ${B}`]);
    const answer = ask === A ? b + d : 2 * b + d;
    return {
      family, answer: String(answer),
      prompt: `If ${A} is ${d} more than ${B} and ${B} + ${B} = ${2 * b}, what is ${ask === A ? `the value of ${A}` : ask}?`,
      hint: `Use ${B} + ${B} to find ${B} first.`,
      explanation: `${B} + ${B} = ${2 * b}, so ${B} = ${b}. ${A} is ${d} more, so ${A} = ${b + d}. ${ask === A ? '' : `${A} + ${B} = ${answer}.`}`.trim(),
      proof: { family, givens: { mode, set, S: 2 * b, d, ask: ask === A ? 'A' : 'A + B' } }, visual: null,
      choices: choose(answer, positive([[b, 'class-2-symbol-chain'], [2 * b, 'class-2-symbol-chain'], [b - d, 'wrong-operation'], [2 * b + d, 'class-2-symbol-chain'], [answer + 1, 'class-2-symbol-chain'], [answer - 1, 'class-2-symbol-chain'], [d, 'missing-step']]), count, r, { numeric: true }),
    };
  }
  const [a, b, c] = [r.int(2, 9), r.int(2, 9), r.int(2, 9)];
  if (new Set([a, b, c]).size < 3) throw new QuestionRetry('Letters would share a value.');
  const answer = a + b + c;
  return {
    family, answer: String(answer),
    prompt: `If ${A} + ${B} = ${a + b}, ${B} + ${C} = ${b + c} and ${A} + ${C} = ${a + c}, what is ${A} + ${B} + ${C}?`,
    hint: 'Add the three clues. Each letter is counted twice.',
    explanation: `The clues add to ${2 * answer}, and every letter is counted twice. Half of ${2 * answer} is ${answer}.`,
    proof: { family, givens: { mode, set, S1: a + b, S2: b + c, S3: a + c } }, visual: null,
    choices: choose(answer, positive([[2 * answer, 'class-2-symbol-chain'], [answer + 1, 'class-2-symbol-chain'], [answer - 1, 'class-2-symbol-chain'], [a + b, 'missing-step'], [Math.max(a + b, b + c, a + c), 'missing-step'], [answer + 2, 'class-2-symbol-chain']]), count, r, { numeric: true }),
  };
};
SOLVE['class-2-symbol-digits'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'two') {
    const a = g.S1 / g.m;
    const b = g.S2 - a;
    return String(g.ask === 'B' ? b : g.ask === 'B + B' ? 2 * b : a + 2 * b);
  }
  if (g.mode === 'more') {
    const b = g.S / 2;
    return String(g.ask === 'A' ? b + g.d : 2 * b + g.d);
  }
  return String((g.S1 + g.S2 + g.S3) / 2);
};

// ---------------------------------------------------------------------------
// Two-step addition and subtraction stories
// ---------------------------------------------------------------------------
DRAFT['class-2-add-story-real'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const [one, many] = r.pick(nounPairs);
  const [n1, n2, n3] = r.shuffle(NAMES);
  const mode = r.pick(level === 1 ? ['left', 'together-more', 'three-add'] : ['left', 'together-more', 'three-add', 'together-fewer']);
  const big = level !== 1;
  if (mode === 'left') {
    const x = r.int(big ? 120 : 12, big ? 320 : 40);
    const y = r.int(big ? 60 : 8, big ? 250 : 30);
    const T = x + y + r.int(big ? 25 : 5, big ? 280 : 30);
    const answer = T - x - y;
    return {
      family, answer: String(answer),
      prompt: `A shop had ${T} ${many}. It sold ${x} in the morning and ${y} in the evening. How many are left?`,
      hint: 'Take away what was sold in the morning, then what was sold in the evening.',
      explanation: `${x} + ${y} = ${x + y} were sold. ${T} - ${x + y} = ${answer} ${many} are left.`,
      proof: { family, givens: { mode, T, x, y } }, visual: null,
      choices: choose(answer, positive([[T - x, 'missing-step'], [T - y, 'missing-step'], [x + y, 'wrong-operation'], [T + x - y, 'wrong-operation'], [answer + 10, 'class-2-carry-borrow'], [answer - 10, 'class-2-carry-borrow'], [T + x + y, 'wrong-operation']]), count, r, { numeric: true }),
    };
  }
  if (mode === 'together-more' || mode === 'together-fewer') {
    const a = r.int(big ? 120 : 20, big ? 480 : 60);
    const d = r.int(big ? 25 : 5, big ? 90 : 20);
    const more = mode === 'together-more';
    const other = more ? a + d : a - d;
    const answer = a + other;
    return {
      family, answer: String(answer),
      prompt: `${n1} has ${a} ${many}. ${n2} has ${d} ${more ? 'more' : 'fewer'} than ${n1}. How many ${many} do they have together?`,
      hint: `First find how many ${n2} has. Then add the two numbers.`,
      explanation: `${n2} has ${a} ${more ? '+' : '-'} ${d} = ${other}. Together: ${a} + ${other} = ${answer} ${many}.`,
      proof: { family, givens: { mode, a, d } }, visual: null,
      choices: choose(answer, positive([[a + d, 'missing-step'], [2 * a, 'ignored-change'], [more ? 2 * a - d : 2 * a + d, 'wrong-operation'], [other, 'missing-step'], [answer + 10, 'class-2-carry-borrow'], [answer - 10, 'class-2-carry-borrow'], [a - d, 'wrong-operation']]), count, r, { numeric: true }),
    };
  }
  const a = r.int(big ? 115 : 12, big ? 360 : 40);
  const b = r.int(big ? 80 : 12, big ? 290 : 40);
  const c = r.int(big ? 45 : 9, big ? 190 : 35);
  const answer = a + b + c;
  return {
    family, answer: String(answer),
    prompt: `${n1} has ${a} ${many}, ${n2} has ${b} and ${n3} has ${c}. How many ${many} do the three have altogether?`,
    hint: 'Add the ones first, then the tens, then the hundreds.',
    explanation: `${a} + ${b} = ${a + b}. Then ${a + b} + ${c} = ${answer} ${many} altogether.`,
    proof: { family, givens: { mode, a, b, c } }, visual: null,
    choices: choose(answer, positive([[a + b, 'missing-step'], [answer + 10, 'class-2-carry-borrow'], [answer - 10, 'class-2-carry-borrow'], [answer + 100, 'class-2-carry-borrow'], [a + b + c - Math.min(a, b, c), 'missing-step'], [Math.max(a, b, c), 'missing-step']]), count, r, { numeric: true }),
  };
};
SOLVE['class-2-add-story-real'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'left') return String(g.T - g.x - g.y);
  if (g.mode === 'together-more') return String(2 * g.a + g.d);
  if (g.mode === 'together-fewer') return String(2 * g.a - g.d);
  return String(g.a + g.b + g.c);
};

// ---------------------------------------------------------------------------
// Statements A, B, C about a shape-and-line picture
// ---------------------------------------------------------------------------
const SUBSETS = [['A'], ['B'], ['C'], ['A', 'B'], ['A', 'C'], ['B', 'C'], ['A', 'B', 'C']];
const subsetText = s => (s.length === 1 ? `Only ${s[0]}` : s.length === 2 ? `${s[0]} and ${s[1]}` : 'A, B and C');
const statementText = s => (s.t === 'more' ? moreText(s.kind, s.other, s.n) : kindText(s.kind, s.n));
const statementTrue = (s, counts) => (s.t === 'more' ? counts[s.kind] - counts[s.other] === s.n : counts[s.kind] === s.n);

DRAFT['class-2-picture-facts'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  for (let attempt = 0; attempt < 40; attempt++) {
    const { counts, visual } = shapePicture(r, level);
    const present = KINDS.filter(kind => counts[kind] > 0);
    const kinds = r.shuffle(present).slice(0, 3);
    let moreUsed = false;
    const statements = kinds.map(kind => {
      const others = present.filter(o => o !== kind && counts[kind] > counts[o]);
      const truth = r.pick([true, false]);
      if (!moreUsed && others.length && r.pick([true, false])) {
        moreUsed = true;
        const other = r.pick(others);
        const diff = counts[kind] - counts[other];
        return { t: 'more', kind, other, n: truth ? diff : diff + r.pick([1, 2]) };
      }
      const n = truth ? counts[kind] : counts[kind] + r.pick([-1, 1, 2]);
      return { t: 'count', kind, n: n < 1 ? counts[kind] + 1 : n };
    });
    const flags = statements.map(s => statementTrue(s, counts));
    const answerSet = ['A', 'B', 'C'].filter((_, i) => flags[i]);
    if (!answerSet.length) continue;
    const prompt = `A: ${statementText(statements[0])}. B: ${statementText(statements[1])}. C: ${statementText(statements[2])}. Which statements are true?`;
    if (prompt.length > 130 || prompt.split(/\s+/).length > 23) continue;
    const answer = subsetText(answerSet);
    const others = r.shuffle(SUBSETS.filter(s => subsetText(s) !== answer)).slice(0, 3).map(s => wrong(subsetText(s), 'class-2-shape-line'));
    return {
      family, answer, prompt,
      hint: 'Count each kind in the picture, then check A, B and C one by one.',
      explanation: `Checking each one: ${['A', 'B', 'C'].map((label, i) => `${label} is ${flags[i] ? 'true' : 'false'}`).join(', ')}. So the answer is ${answer}.`,
      proof: { family, givens: { statements } }, visual,
      choices: answerChoices(answer, others, count, null, KNOWN),
    };
  }
  throw new QuestionRetry('No picture with a usable statement set.');
};
SOLVE['class-2-picture-facts'] = q => {
  const counts = countsOf(q.visual.items);
  const truth = ['A', 'B', 'C'].filter((_, i) => statementTrue(q.proof.givens.statements[i], counts));
  const answer = subsetText(truth);
  if (!q.options.includes(answer)) throw new Error('The true statement set is not an option.');
  return answer;
};

// ---------------------------------------------------------------------------
// Pictograph with two-part answers
// ---------------------------------------------------------------------------
const DAY_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };

DRAFT['class-2-picto-pair'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const keyVal = r.pick(level === 1 ? [2, 5, 10] : level === 2 ? [2, 3, 4, 5, 10] : [3, 4, 5, 6, 10, 20]);
  const rows = level === 1 ? 3 : r.int(3, 4);
  const labels = r.shuffle(Object.keys(DAY_FULL)).slice(0, rows);
  const icons = r.shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, rows);
  const vals = icons.map(n => n * keyVal);
  const mode = r.pick(['respectively', 'most-day', 'total']);
  const visual = {
    kind: 'v3-class-2-picto', labels, icons, keyVal,
    description: `Pictograph where 1 star = ${plural(keyVal, 'crate')}: ${labels.map((l, i) => `${l} shows ${plural(icons[i], 'star')}`).join('; ')}.`,
  };
  if (mode === 'total') {
    const answer = vals.reduce((a, b) => a + b, 0);
    return {
      family, answer: String(answer),
      prompt: r.pick([`How many crates were packed on all ${rows} days together?`, `Use the key. How many crates were packed altogether?`]),
      hint: 'Count all the stars, then multiply by the number in the key.',
      explanation: `Stars: ${icons.join(' + ')} = ${icons.reduce((a, b) => a + b, 0)}. Each star is ${keyVal} crates, so ${icons.reduce((a, b) => a + b, 0)} x ${keyVal} = ${answer} crates.`,
      proof: { family, givens: { mode } }, visual,
      choices: choose(answer, positive([[icons.reduce((a, b) => a + b, 0), 'graph-key'], [answer - Math.min(...vals), 'missing-step'], [answer + keyVal, 'graph-key'], [answer - keyVal, 'graph-key'], [Math.max(...vals), 'graph-difference']]), count, r, { numeric: true }),
    };
  }
  if (mode === 'respectively') {
    const [i, j] = r.shuffle([...labels.keys()]).slice(0, 2);
    const answer = `${vals[i]} and ${vals[j]}`;
    const options = [`${icons[i]} and ${icons[j]}`, `${vals[j]} and ${vals[i]}`, `${vals[i] + keyVal} and ${vals[j]}`, `${vals[i]} and ${vals[j] + keyVal}`, `${vals[i]} and ${Math.max(keyVal, vals[j] - keyVal)}`];
    const codes = ['graph-key', 'graph-difference', 'graph-key', 'graph-key', 'graph-key'];
    return {
      family, answer,
      prompt: `How many crates were packed on ${DAY_FULL[labels[i]]} and ${DAY_FULL[labels[j]]}, respectively?`,
      hint: 'Read the key. Multiply the stars on each day by that number.',
      explanation: `Each star is ${keyVal} crates. ${DAY_FULL[labels[i]]}: ${icons[i]} x ${keyVal} = ${vals[i]}. ${DAY_FULL[labels[j]]}: ${icons[j]} x ${keyVal} = ${vals[j]}.`,
      proof: { family, givens: { mode, i, j } }, visual,
      choices: answerChoices(answer, options.map((o, k) => wrong(o, codes[k])).filter(item => item.value !== answer), count, null, KNOWN),
    };
  }
  const top = vals.indexOf(Math.max(...vals));
  const low = vals.indexOf(Math.min(...vals));
  const answer = `${DAY_FULL[labels[top]]} and ${plural(vals[top], 'crate')}`;
  const options = [`${DAY_FULL[labels[top]]} and ${plural(icons[top], 'crate')}`, `${DAY_FULL[labels[low]]} and ${plural(vals[low], 'crate')}`, `${DAY_FULL[labels[low]]} and ${plural(icons[low], 'crate')}`, `${DAY_FULL[labels[top]]} and ${plural(vals[low], 'crate')}`, `${DAY_FULL[labels[top]]} and ${plural(vals[top] + keyVal, 'crate')}`];
  return {
    family, answer,
    prompt: 'On which day were the most crates packed, and how many crates were packed?',
    hint: 'The longest row has the most stars. Then use the key for the crates.',
    explanation: `${labels[top]} has the most stars: ${icons[top]}. ${icons[top]} x ${keyVal} = ${vals[top]} crates on ${DAY_FULL[labels[top]]}.`,
    proof: { family, givens: { mode, top, low } }, visual,
    choices: answerChoices(answer, options.map((o, k) => wrong(o, k === 1 || k === 2 ? 'graph-difference' : 'graph-key')), count, null, KNOWN),
  };
};
SOLVE['class-2-picto-pair'] = q => {
  const v = q.visual;
  const g = q.proof.givens;
  const vals = v.icons.map(n => n * v.keyVal);
  if (g.mode === 'total') return String(vals.reduce((a, b) => a + b, 0));
  if (g.mode === 'respectively') return `${vals[g.i]} and ${vals[g.j]}`;
  const top = vals.indexOf(Math.max(...vals));
  return `${DAY_FULL[v.labels[top]]} and ${plural(vals[top], 'crate')}`;
};

// ---------------------------------------------------------------------------
// Two measuring cylinders
// ---------------------------------------------------------------------------
DRAFT['class-2-cylinder-diff'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const max = r.pick([500, 1000]);
  const major = max / 5;
  const step = level === 3 ? major / 5 : major / 2;
  const slots = Math.round(max / step);
  const a = r.int(2, slots - 1) * step;
  const b = r.int(2, slots - 1) * step;
  if (a === b) throw new QuestionRetry('Cylinders hold the same amount.');
  const mode = r.pick(['diff', 'sum', 'fill']);
  const visual = {
    kind: 'v3-class-2-cylinders', max, major, step, a, b,
    description: `Two measuring cylinders marked from 0 to ${max} mL. Cylinder A holds ${a} mL of water and cylinder B holds ${b} mL.`,
  };
  const hi = a > b ? 'A' : 'B';
  const lo = hi === 'A' ? 'B' : 'A';
  const pick = r.pick(['A', 'B']);
  const value = pick === 'A' ? a : b;
  const answer = mode === 'diff' ? Math.abs(a - b) : mode === 'sum' ? a + b : max - value;
  const prompt = mode === 'diff'
    ? `How many more mL of water are in cylinder ${hi} than in cylinder ${lo}?`
    : mode === 'sum' ? 'Both cylinders are poured into one empty jug. How many mL of water are in the jug?'
      : `How many more mL must be added to cylinder ${pick} to fill it to ${max} mL?`;
  return {
    family, answer: String(answer), prompt,
    hint: 'Read each water level carefully. Check how much each small mark is worth.',
    explanation: mode === 'diff' ? `Cylinder ${hi} has ${Math.max(a, b)} mL and cylinder ${lo} has ${Math.min(a, b)} mL. ${Math.max(a, b)} - ${Math.min(a, b)} = ${answer} mL.`
      : mode === 'sum' ? `Cylinder A has ${a} mL and cylinder B has ${b} mL. ${a} + ${b} = ${answer} mL.`
        : `Cylinder ${pick} has ${value} mL. ${max} - ${value} = ${answer} mL more.`,
    proof: { family, givens: { mode, hi, lo, pick } }, visual,
    choices: choose(answer, positive([
      [mode === 'diff' ? a + b : mode === 'sum' ? Math.abs(a - b) : value, 'wrong-operation'],
      [answer + step, 'scale-interval'], [answer - step, 'scale-interval'], [answer + major, 'scale-interval'], [answer + 2 * step, 'scale-interval'],
      [mode === 'fill' ? max - (pick === 'A' ? b : a) : Math.max(a, b), 'missing-step'],
    ]), count, r, { numeric: true }),
  };
};
SOLVE['class-2-cylinder-diff'] = q => {
  const { max, a, b } = q.visual;
  const g = q.proof.givens;
  if (g.mode === 'diff') return String(Math.abs(a - b));
  if (g.mode === 'sum') return String(a + b);
  return String(max - (g.pick === 'A' ? a : b));
};

function renderCylinders(visual) {
  const top = 36;
  const bottom = 214;
  const yOf = v => bottom - (v / visual.max) * (bottom - top);
  let body = '';
  [['A', visual.a, 130], ['B', visual.b, 330]].forEach(([name, value, x]) => {
    body += rect(x, top, 64, bottom - top, { fill: PAPER, strokeWidth: 3 });
    body += rect(x + 2, yOf(value), 60, bottom - yOf(value) - 2, { fill: '#8ec5e8', stroke: '#8ec5e8', strokeWidth: 0 });
    for (let v = 0; v <= visual.max; v += visual.step) {
      const major = v % visual.major === 0;
      body += line(x - (major ? 18 : 10), yOf(v), x, yOf(v), { width: major ? 2.5 : 1.5 });
      if (major) body += text(x - 24, yOf(v) + 5, String(v), { size: 16, anchor: 'end' });
    }
    body += text(x + 32, 240, `Cylinder ${name}`, { size: 17 });
  });
  return svg(body, visual.description, 480, 256);
}

// ---------------------------------------------------------------------------
// Clock-based elapsed time
// ---------------------------------------------------------------------------
const clockText = minutes => {
  const m = ((minutes % 720) + 720) % 720;
  return `${Math.floor(m / 60) || 12}:${String(m % 60).padStart(2, '0')}`;
};
const lengthText = d => {
  const h = Math.floor(d / 60);
  const m = d % 60;
  if (!h) return plural(m, 'minute');
  return m ? `${plural(h, 'hour')} ${plural(m, 'minute')}` : plural(h, 'hour');
};

DRAFT['class-2-clock-elapsed'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(['later', 'earlier', 'to-hour', 'later']);
  const activity = r.pick([['starts reading', 'read for'], ['starts a game', 'play for'], ['starts a walk', 'walk for'], ['starts a film', 'watch for']]);
  const place = r.pick(['school', 'the park', 'the library', 'the station']);
  const hour = r.int(1, 12);
  const minute = r.pick(mode === 'to-hour' ? [5, 10, 15, 20, 25, 35, 40, 45, 50, 55] : level === 1 ? [0, 30] : [0, 10, 15, 20, 30, 40, 45, 50]);
  const start = (hour % 12) * 60 + minute;
  const visual = { kind: 'v3-class-2-clock-face', minutes: start, description: clockDescription(start) };
  if (mode === 'to-hour') {
    const answer = 60 - minute;
    const nextHour = hour % 12 + 1;
    return {
      family, answer: String(answer),
      prompt: `The clock shows the time now. How many minutes are left until ${nextHour} o'clock?`,
      hint: 'There are 60 minutes in one hour. Count on from the minute hand to 12.',
      explanation: `The long hand is at ${minute} minutes. ${60} - ${minute} = ${answer} minutes until ${nextHour} o'clock.`,
      proof: { family, givens: { mode, minute } }, visual,
      choices: choose(answer, positive([[minute, 'clock-hands'], [60 + answer, 'hour-carry'], [answer + 10, 'clock-error'], [Math.max(5, answer - 5), 'clock-error'], [answer + 5, 'clock-error']]), count, r, { numeric: true }),
    };
  }
  const d = level === 1 ? r.pick([30, 60, 90]) : level === 2 ? 5 * r.int(5, 26) : 5 * r.int(14, 40);
  const later = mode === 'later';
  const end = later ? start + d : start - d;
  const answer = clockText(end);
  const options = [clockText(later ? start - d : start + d), clockText(end + 60), clockText(end - 60), clockText(end + 10), clockText(end - 10), clockText(start + (later ? 1 : -1) * Math.floor(d / 60) * 60 + (later ? 1 : -1) * (d % 60 ? 100 : 0))];
  const codes = ['time-direction', 'hour-carry', 'hour-carry', 'clock-error', 'clock-error', 'clock-hands'];
  return {
    family, answer,
    prompt: later
      ? `The clock shows when a child ${activity[0]}. They ${activity[1]} ${lengthText(d)}. At what time do they stop?`
      : `The clock shows when a child reaches ${place}. They left home ${lengthText(d)} before. At what time did they leave?`,
    hint: later ? 'Count on from the time on the clock. Add the hours first, then the minutes.' : 'Count back from the time on the clock. Take away the hours first.',
    explanation: `The clock shows ${clockText(start)}. ${lengthText(d)} ${later ? 'later' : 'before'} is ${answer}.`,
    proof: { family, givens: { mode, d } }, visual,
    choices: answerChoices(answer, options.map((o, k) => wrong(o, codes[k])).filter(item => item.value !== answer), count, null, KNOWN),
  };
};
SOLVE['class-2-clock-elapsed'] = q => {
  const g = q.proof.givens;
  const start = q.visual.minutes;
  if (g.mode === 'to-hour') return String(60 - (start % 60));
  return clockText(g.mode === 'later' ? start + g.d : start - g.d);
};

// ---------------------------------------------------------------------------
// Which way of writing an amount is NOT correct?
// ---------------------------------------------------------------------------
const ONES_W = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const TEEN_W = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS_W = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const WORD_VALUE = new Map([...ONES_W.map((w, i) => [w, i]), ...TEEN_W.map((w, i) => [w, 10 + i]), ...TENS_W.map((w, i) => [w, i * 10])].filter(([w]) => w));
const numberWords = n => {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const tail = rest < 10 ? ONES_W[rest] : rest < 20 ? TEEN_W[rest - 10] : `${TENS_W[Math.floor(rest / 10)]}${rest % 10 ? `-${ONES_W[rest % 10]}` : ''}`;
  return cap(`${ONES_W[h]} hundred${tail ? ` ${tail}` : ''}`);
};
const FORMS = {
  words: (h, t, o) => numberWords(h * 100 + t * 10 + o),
  blocks: (h, t, o) => `${plural(h, 'hundred')} ${plural(t, 'ten')} ${plural(o, 'one')}`,
  expanded: (h, t, o) => `${h * 100} + ${t * 10} + ${o}`,
  tensOnes: (h, t, o) => `${plural(h * 10 + t, 'ten')} and ${plural(o, 'one')}`,
  hundredsOnes: (h, t, o) => `${plural(h, 'hundred')} and ${plural(t * 10 + o, 'one')}`,
};
const formValue = form => {
  if (form.includes('+')) return form.split('+').reduce((sum, part) => sum + Number(part), 0);
  if (/^\d/.test(form)) return [...form.matchAll(/(\d+) (hundred|ten|one)s?/g)].reduce((sum, m) => sum + Number(m[1]) * { hundred: 100, ten: 10, one: 1 }[m[2]], 0);
  let total = 0;
  for (const word of form.toLowerCase().split(/[ -]/)) total = word === 'hundred' ? total * 100 : total + WORD_VALUE.get(word);
  return total;
};

DRAFT['class-2-amount-form'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const h = r.int(1, 9);
  const t = r.int(1, 9);
  const o = r.int(1, 9);
  const n = h * 100 + t * 10 + o;
  const types = r.shuffle(level === 1 ? ['blocks', 'expanded', 'tensOnes', 'hundredsOnes'] : Object.keys(FORMS));
  const [badType, ...goodTypes] = types;
  const slips = [[h, o, t], [h, t + (t < 9 ? 1 : -1), o], [h + (h < 9 ? 1 : -1), t, o], [h, t, o + (o < 9 ? 1 : -1)]];
  const [bh, bt, bo] = r.pick(t === o ? slips.slice(1) : slips);
  const badText = badType === 'expanded' && r.pick([true, false]) ? `${h * 100} + ${t} + ${o}` : FORMS[badType](bh, bt, bo);
  const good = goodTypes.slice(0, 3).map(type => FORMS[type](h, t, o));
  if (formValue(badText) === n || good.some(item => item.length > 28) || badText.length > 28) throw new QuestionRetry('Amount form is unusable.');
  const answer = badText;
  return {
    family, answer,
    prompt: `Which of these is NOT a correct way to write Rs ${n}?`,
    hint: `Change every option into a number. Find the one that is not ${n}.`,
    explanation: `${good.join(', ')} all make ${n}. But "${answer}" makes ${formValue(answer)}, so it is NOT correct.`,
    proof: { family, givens: { n, shown: [...good, answer].sort() } }, visual: null,
    choices: answerChoices(answer, good.map(item => wrong(item, 'class-2-amount-form')), count, null, KNOWN),
  };
};
SOLVE['class-2-amount-form'] = q => {
  const off = q.options.filter(option => formValue(option) !== q.proof.givens.n);
  if (off.length !== 1) throw new Error('Exactly one option should not make the amount.');
  return off[0];
};

// ---------------------------------------------------------------------------
// Price tags
// ---------------------------------------------------------------------------
const TAG_ITEMS = [
  ['pen', 'pens', 5, 18], ['eraser', 'erasers', 2, 9], ['ruler', 'rulers', 6, 16], ['notebook', 'notebooks', 12, 35],
  ['pencil', 'pencils', 2, 8], ['glue stick', 'glue sticks', 8, 20], ['crayon box', 'crayon boxes', 10, 30], ['sharpener', 'sharpeners', 3, 12],
];
const qtyText = (q, item) => `${q} ${q === 1 ? item[0] : item[1]}`;

DRAFT['class-2-price-tags'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const picked = r.shuffle(TAG_ITEMS).slice(0, 3);
  const items = picked.map(item => ({ name: item[0], price: r.int(item[2], level === 1 ? Math.min(item[3], item[2] + 5) : item[3]) }));
  const maxQty = level === 1 ? 3 : level === 2 ? 4 : 6;
  const [i, j] = r.shuffle([0, 1, 2]).slice(0, 2);
  const q1 = r.int(2, maxQty);
  const q2 = r.int(2, maxQty);
  const p1 = items[i].price;
  const p2 = items[j].price;
  const total = q1 * p1 + q2 * p2;
  const mode = r.pick(['total', 'change', 'dearer']);
  const visual = { kind: 'v3-class-2-pricetags', items, description: `Price tags: ${items.map(item => `${item.name} Rs ${item.price}`).join(', ')}.` };
  const both = `${qtyText(q1, picked[i])} and ${qtyText(q2, picked[j])}`;
  if (mode === 'total') {
    return {
      family, answer: String(total),
      prompt: `A shopper buys ${both} at the prices shown. How many rupees does the shopper pay?`,
      hint: 'Multiply each price by how many are bought. Then add.',
      explanation: `${q1} x ${p1} = ${q1 * p1} and ${q2} x ${p2} = ${q2 * p2}. ${q1 * p1} + ${q2 * p2} = ${total} rupees.`,
      proof: { family, givens: { mode, i, j, q1, q2 } }, visual,
      choices: choose(total, positive([[p1 + p2, 'class-2-tag-qty'], [q1 * p1, 'missing-step'], [q1 * p2 + q2 * p1, 'class-2-tag-qty'], [(q1 + q2) * Math.max(p1, p2), 'class-2-tag-qty'], [total + 10, 'place-shift'], [total - 10, 'place-shift'], [q1 + q2 + p1 + p2, 'class-2-tag-qty']]), count, r, { numeric: true }),
    };
  }
  if (mode === 'change') {
    const pay = Math.ceil((total + 1) / 10) * 10 + r.pick([0, 10, 20]);
    const answer = pay - total;
    return {
      family, answer: String(answer),
      prompt: `A shopper buys ${both} at the prices shown and pays Rs ${pay}. How many rupees change?`,
      hint: 'Find the total cost first. Then take it away from the money paid.',
      explanation: `The total is ${q1 * p1} + ${q2 * p2} = ${total}. Change: ${pay} - ${total} = ${answer} ${answer === 1 ? 'rupee' : 'rupees'}.`,
      proof: { family, givens: { mode, i, j, q1, q2, pay } }, visual,
      choices: choose(answer, positive([[total, 'missing-step'], [pay + total, 'wrong-operation'], [answer + 10, 'place-shift'], [Math.abs(pay - p1 - p2), 'class-2-tag-qty'], [pay - q1 * p1, 'missing-step'], [Math.max(1, answer - 10), 'place-shift']]), count, r, { numeric: true }),
    };
  }
  const a = q1 * p1;
  const b = q2 * p2;
  if (a === b) throw new QuestionRetry('Both costs are equal.');
  const [bigI, bigQ, smallJ, smallQ] = a > b ? [i, q1, j, q2] : [j, q2, i, q1];
  const answer = Math.abs(a - b);
  return {
    family, answer: String(answer),
    prompt: `How many rupees more do ${qtyText(bigQ, picked[bigI])} cost than ${qtyText(smallQ, picked[smallJ])}?`,
    hint: 'Find the cost of each group first. Then subtract the smaller from the bigger.',
    explanation: `${qtyText(bigQ, picked[bigI])} cost ${Math.max(a, b)} rupees and ${qtyText(smallQ, picked[smallJ])} cost ${Math.min(a, b)} rupees. The difference is ${answer}.`,
    proof: { family, givens: { mode, i, j, q1, q2 } }, visual,
    choices: choose(answer, positive([[a + b, 'wrong-operation'], [Math.abs(p1 - p2), 'class-2-tag-qty'], [answer + 10, 'place-shift'], [Math.max(1, answer - 10), 'place-shift'], [Math.abs(q1 * p2 - q2 * p1), 'class-2-tag-qty'], [answer + p1, 'class-2-tag-qty']]), count, r, { numeric: true }),
  };
};
SOLVE['class-2-price-tags'] = q => {
  const g = q.proof.givens;
  const cost1 = g.q1 * q.visual.items[g.i].price;
  const cost2 = g.q2 * q.visual.items[g.j].price;
  if (g.mode === 'total') return String(cost1 + cost2);
  if (g.mode === 'change') return String(g.pay - cost1 - cost2);
  return String(Math.abs(cost1 - cost2));
};

function renderPriceTags(visual) {
  let body = '';
  visual.items.forEach((item, i) => {
    const x = 14 + i * 154;
    body += rect(x, 14, 140, 86, { fill: '#fff4d6', stroke: ORANGE, rx: 12, strokeWidth: 3 });
    body += text(x + 70, 46, item.name, { size: 17 });
    body += text(x + 70, 82, `Rs ${item.price}`, { size: 26, fill: GREEN });
  });
  return svg(body, visual.description, 480, 114);
}

function renderCloud(visual) {
  const cols = 4;
  const rows = Math.ceil(visual.numbers.length / cols);
  let body = rect(10, 10, 460, rows * 54 + 30, { fill: '#eaf2fb', stroke: BLUE, rx: 40, strokeWidth: 3 });
  visual.numbers.forEach((n, i) => {
    body += text(68 + (i % cols) * 115, 56 + Math.floor(i / cols) * 54, String(n), { size: 26, fill: INK });
  });
  return svg(body, visual.description, 480, rows * 54 + 50);
}

export function renderMixed(visual) {
  if (visual.kind === 'v3-class-2-numcloud') return renderCloud(visual);
  if (visual.kind === 'v3-class-2-cylinders') return renderCylinders(visual);
  if (visual.kind === 'v3-class-2-pricetags') return renderPriceTags(visual);
  if (visual.kind === 'v3-class-2-clock-face') return svg(clockFace(visual.minutes, 110, 110, 100), visual.description, 220, 220);
  return null;
}
