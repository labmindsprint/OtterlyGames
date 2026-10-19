// Class 5 "real paper" maths, everyday-maths and achievers families. Imported by bank3-class-5.mjs.
import { choiceCount, numberText, wordArticle } from './bank-shared.mjs';
import {
  CADETS, KNOWN, QuestionRetry, digitSum, gcd, isPrime, lcm, ord, pickChoices,
} from './bank3-class-5-real-kit.mjs';

export const MIXED_FAMILIES = {
  'class-5-pqr-number-facts': { skill: 'compare', title: 'Judge three statements about numbers' },
  'class-5-pqr-shape-measure': { skill: 'measure', title: 'Judge three statements about shapes and units' },
  'class-5-hcf-lcm-mix': { skill: 'factors', title: 'Use HCF, LCM and prime factors together' },
  'class-5-ampm-elapsed': { skill: 'time', title: 'Find a duration or time across a.m. and p.m.' },
  'class-5-field-rounds-area': { skill: 'area', title: 'Find the area from rounds or a length ratio' },
  'class-5-big-number-story': { skill: 'addition', title: 'Add and subtract numbers in the lakhs' },
  'class-5-chart-two-answers': { skill: 'chart', title: 'Answer two questions from one bar chart' },
  'class-5-age-puzzle': { skill: 'mystery', title: 'Solve an age puzzle from a sum and a difference' },
};

export const DRAFT = {};
export const SOLVE = {};

const ROMAN_TABLE = [[40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const toRoman = value => { let rest = value; let out = ''; for (const [n, s] of ROMAN_TABLE) while (rest >= n) { out += s; rest -= n; } return out; };

// ---------------------------------------------------------------------------
// Three statements P, Q, R -- one builder shared by the number and shape families.
// ---------------------------------------------------------------------------
const num = numberText;
const SETS = [['P'], ['Q'], ['R'], ['P', 'Q'], ['P', 'R'], ['Q', 'R'], ['P', 'Q', 'R']];
const setText = set => (set.length === 1 ? `${set[0]} only` : set.length === 3 ? 'All of P, Q and R' : `${set[0]} and ${set[1]}`);

const NUMBER_STATEMENTS = {
  cmp: (r, ok) => {
    const lead = r.int(1, 8) * 1000;
    const x = lead + r.int(100, 899);
    const y = lead + r.int(100, 899);
    if (x === y) throw new QuestionRetry('Equal');
    const hi = Math.max(x, y); const lo = Math.min(x, y);
    return ok ? { k: 'cmp', a: hi, b: lo, rel: '>' } : { k: 'cmp', a: lo, b: hi, rel: '>' };
  },
  roman: (r, ok) => {
    const n = r.int(14, 48);
    return ok ? { k: 'roman', n, roman: toRoman(n) } : { k: 'roman', n, roman: toRoman(n + r.pick([-1, 1, 2, -2, 10])) };
  },
  div: (r, ok) => {
    const k = r.int(3, 9);
    const n = k * r.int(5, 15) + (ok ? 0 : r.int(1, k - 1));
    return { k: 'div', n, d: k };
  },
  mul: (r, ok) => {
    const a = r.int(12, 29); const b = r.int(3, 9);
    return { k: 'mul', a, b, c: a * b + (ok ? 0 : r.pick([-10, 10, -9, 9, 20])) };
  },
  round: (r, ok) => {
    const unit = r.pick([10, 100, 1000]);
    const v = r.int(1200, 9800);
    if (v % unit === unit / 2) throw new QuestionRetry('Half');
    const rounded = Math.round(v / unit) * unit;
    return { k: 'round', v, unit, claim: ok ? rounded : rounded + r.pick([-unit, unit]) };
  },
  pv: (r, ok) => {
    const digit = r.int(2, 9);
    const pos = r.int(2, 4);
    const rest = r.int(1000, 9999);
    const value = Number(`${digit}${String(rest)}`);
    return { k: 'pv', value, digit, claim: digit * 10 ** (ok ? 4 : r.pick([3, 5])) };
  },
  prime: (r, ok) => {
    const prime = r.pick([29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89]);
    return { k: 'prime', n: ok ? prime : r.pick([39, 49, 51, 57, 69, 77, 87, 91]) };
  },
  hcf: (r, ok) => {
    const g = r.int(2, 9);
    const a = g * r.pick([2, 3, 4, 5]);
    const b = g * r.pick([6, 7, 8, 9]);
    const real = gcd(a, b);
    return { k: 'hcf', a, b, claim: ok ? real : r.pick([lcm(a, b), real * 2, Math.max(1, real - 1)]) };
  },
  frac: (r, ok) => {
    const b = r.int(3, 9); const d = r.int(3, 9);
    const a = r.int(1, b - 1); const c = r.int(1, d - 1);
    if (a * d === c * b) throw new QuestionRetry('Equal');
    const bigger = a * d > c * b;
    return ok === bigger ? { k: 'frac', a, b, c, d, rel: '>' } : { k: 'frac', a, b, c, d, rel: '<' };
  },
};
const NUMBER_POOLS = { 1: ['cmp', 'roman', 'div', 'mul'], 2: ['cmp', 'roman', 'div', 'round', 'pv', 'prime'], 3: ['round', 'pv', 'prime', 'hcf', 'frac', 'roman', 'div'] };

const showNumberStatement = st => {
  if (st.k === 'cmp') return `${num(st.a)} > ${num(st.b)}`;
  if (st.k === 'roman') return `${st.roman} = ${st.n}`;
  if (st.k === 'div') return `${st.n} is divisible by ${st.d}`;
  if (st.k === 'mul') return `${st.a} x ${st.b} = ${st.c}`;
  if (st.k === 'round') return `${num(st.v)} rounds to ${num(st.claim)} (nearest ${st.unit})`;
  if (st.k === 'pv') return `The ${st.digit} in ${num(st.value)} is worth ${num(st.claim)}`;
  if (st.k === 'prime') return `${st.n} is a prime number`;
  if (st.k === 'hcf') return `HCF of ${st.a} and ${st.b} is ${st.claim}`;
  return `${st.a}/${st.b} ${st.rel} ${st.c}/${st.d}`;
};
const evalNumberStatement = st => {
  if (st.k === 'cmp') return st.a > st.b;
  if (st.k === 'roman') return toRoman(st.n) === st.roman;
  if (st.k === 'div') return st.n % st.d === 0;
  if (st.k === 'mul') return st.a * st.b === st.c;
  if (st.k === 'round') return Math.round(st.v / st.unit) * st.unit === st.claim;
  if (st.k === 'pv') return st.digit * 10 ** (String(st.value).length - 1) === st.claim;
  if (st.k === 'prime') return isPrime(st.n);
  if (st.k === 'hcf') return gcd(st.a, st.b) === st.claim;
  return st.rel === '>' ? st.a * st.d > st.c * st.b : st.a * st.d < st.c * st.b;
};

const CONVERSIONS = [['km', 'm', 1000], ['m', 'cm', 100], ['kg', 'g', 1000], ['L', 'mL', 1000], ['h', 'min', 60], ['cm', 'mm', 10], ['Rs', 'paise', 100]];
const SIDES = [['triangle', 3], ['pentagon', 5], ['hexagon', 6], ['heptagon', 7], ['octagon', 8], ['decagon', 10]];
const CUBE = [['faces', 6], ['edges', 12], ['corners', 8]];
const SHAPE_STATEMENTS = {
  area: (r, ok) => { const s = r.int(4, 15); return { k: 'area', s, claim: ok ? s * s : r.pick([4 * s, 2 * s, s * s + s]) }; },
  peri: (r, ok) => { const l = r.int(5, 14); const w = r.int(3, l - 1); return { k: 'peri', l, w, claim: ok ? 2 * (l + w) : r.pick([l * w, l + w, 2 * l + w]) }; },
  conv: (r, ok) => {
    const [from, to, factor] = r.pick(CONVERSIONS);
    const v = r.pick([2, 3, 4, 5, 6, 2.5, 3.5, 4.5, 0.5]);
    return { k: 'conv', v, from, to, factor, claim: ok ? v * factor : r.pick([v * factor * 10, v * factor / 10, v * factor + factor]) };
  },
  angle: (r, ok) => {
    const deg = r.pick([35, 60, 85, 90, 110, 135, 165, 200, 250, 300]);
    const kind = deg < 90 ? 'acute' : deg === 90 ? 'right' : deg < 180 ? 'obtuse' : 'reflex';
    const wrongKind = r.pick(['acute', 'right', 'obtuse', 'reflex'].filter(k => k !== kind));
    return { k: 'angle', deg, claim: ok ? kind : wrongKind };
  },
  time: (r, ok) => { const h = r.int(1, 5); const m = r.pick([10, 20, 30, 40, 45]); return { k: 'time', h, m, claim: ok ? h * 60 + m : h * 100 + m }; },
  sides: (r, ok) => { const [name, n] = r.pick(SIDES); return { k: 'sides', name, claim: ok ? n : n + r.pick([-1, 1, 2]) }; },
  cube: (r, ok) => { const [what, n] = r.pick(CUBE); return { k: 'cube', what, claim: ok ? n : n + r.pick([-2, 2, 4]) }; },
};
const SHAPE_POOLS = { 1: ['area', 'peri', 'sides', 'cube', 'conv'], 2: ['area', 'peri', 'conv', 'angle', 'time'], 3: ['peri', 'conv', 'angle', 'time', 'area'] };
const showShapeStatement = st => {
  if (st.k === 'area') return `A square of side ${st.s} cm has area ${st.claim} sq cm`;
  if (st.k === 'peri') return `A ${st.l} cm by ${st.w} cm rectangle has perimeter ${st.claim} cm`;
  if (st.k === 'conv') return `${st.v} ${st.from} = ${num(st.claim)} ${st.to}`;
  if (st.k === 'angle') return `An angle of ${st.deg} degrees is ${st.claim === 'obtuse' || st.claim === 'acute' ? 'an' : 'a'} ${st.claim} angle`;
  if (st.k === 'time') return `${st.h} h ${st.m} min = ${st.claim} min`;
  if (st.k === 'sides') return `${wordArticle(st.name) === 'an' ? 'An' : 'A'} ${st.name} has ${st.claim} sides`;
  return `A cube has ${st.claim} ${st.what}`;
};
const evalShapeStatement = st => {
  if (st.k === 'area') return st.claim === st.s * st.s;
  if (st.k === 'peri') return st.claim === 2 * (st.l + st.w);
  if (st.k === 'conv') return Math.abs(st.claim - st.v * st.factor) < 1e-9;
  if (st.k === 'angle') return st.claim === (st.deg < 90 ? 'acute' : st.deg === 90 ? 'right' : st.deg < 180 ? 'obtuse' : 'reflex');
  if (st.k === 'time') return st.claim === st.h * 60 + st.m;
  if (st.k === 'sides') return st.claim === Object.fromEntries(SIDES)[st.name];
  return st.claim === Object.fromEntries(CUBE)[st.what];
};

function pqrDraft(family, grade, level, r, generators, pools, show, evaluate) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const kinds = r.shuffle(pools[level]).slice(0, 3);
    const truths = [r.int(0, 1) === 1, r.int(0, 1) === 1, r.int(0, 1) === 1];
    const asks = r.pick(['correct', 'incorrect']);
    const wanted = asks === 'correct' ? truths.map(Boolean) : truths.map(t => !t);
    if (!wanted.some(Boolean)) continue;
    let statements;
    try { statements = kinds.map((kind, i) => generators[kind](r, truths[i])); } catch { continue; }
    const labels = ['P', 'Q', 'R'];
    const lines = statements.map((st, i) => `${labels[i]}: ${show(st)}.`);
    const stem = asks === 'correct' ? 'Which statements are correct?' : 'Which statements are NOT correct?';
    const prompt = `${lines.join(' ')} ${stem}`;
    if (prompt.length > 190 || prompt.split(/\s+/).length > 34) continue;
    const target = labels.filter((_, i) => evaluate(statements[i]) === (asks === 'correct'));
    if (!target.length) continue;
    const key = target.join('');
    const answer = setText(target);
    const others = SETS.filter(set => set.join('') !== key).map(set => [setText(set), 'class-5-statement-each']);
    return {
      family, prompt, answer, visual: null,
      hint: 'Test each statement on its own, working out the true value, before choosing the option.',
      explanation: `${labels.map((l, i) => `${l} is ${evaluate(statements[i]) ? 'correct' : 'not correct'}`).join('; ')}. So the answer is: ${answer}.`,
      proof: { family, givens: { statements, asks } },
      choices: pickChoices(answer, others, choiceCount(grade), r),
    };
  }
  throw new QuestionRetry('No clean statement set');
}
const pqrSolve = evaluate => q => {
  const { statements, asks } = q.proof.givens;
  const labels = ['P', 'Q', 'R'];
  return setText(labels.filter((_, i) => evaluate(statements[i]) === (asks === 'correct')));
};

DRAFT['class-5-pqr-number-facts'] = (family, grade, level, r) => pqrDraft(family, grade, level, r, NUMBER_STATEMENTS, NUMBER_POOLS, showNumberStatement, evalNumberStatement);
SOLVE['class-5-pqr-number-facts'] = pqrSolve(evalNumberStatement);
DRAFT['class-5-pqr-shape-measure'] = (family, grade, level, r) => pqrDraft(family, grade, level, r, SHAPE_STATEMENTS, SHAPE_POOLS, showShapeStatement, evalShapeStatement);
SOLVE['class-5-pqr-shape-measure'] = pqrSolve(evalShapeStatement);

// ---------------------------------------------------------------------------
// HCF, LCM and prime factors
// ---------------------------------------------------------------------------
const primeFactorSet = n => { const out = []; let rest = n; for (let p = 2; p <= rest; p++) { if (rest % p === 0) { out.push(p); while (rest % p === 0) rest /= p; } } return out; };
const primeFactorList = n => { const out = []; let rest = n; for (let p = 2; p <= rest; p++) while (rest % p === 0) { out.push(p); rest /= p; } return out; };
const lcm3 = (a, b, c) => lcm(lcm(a, b), c);
const gcd3 = (a, b, c) => gcd(gcd(a, b), c);

DRAFT['class-5-hcf-lcm-mix'] = (family, grade, level, r) => {
  const mode = r.pick(level === 1 ? ['sum', 'diff'] : level === 2 ? ['three', 'smallest', 'prime-sum', 'sum'] : ['given', 'prime-sum', 'three', 'smallest', 'given']);
  const count = choiceCount(grade);
  if (mode === 'sum' || mode === 'diff') {
    const a = r.pick([8, 12, 15, 18, 20, 24, 30]);
    const b = r.pick([6, 9, 10, 14, 16, 21, 28, 36]);
    if (a === b || gcd(a, b) === 1 || gcd(a, b) === Math.min(a, b)) throw new QuestionRetry('Plain pair');
    const g = gcd(a, b); const l = lcm(a, b);
    const answer = mode === 'sum' ? g + l : l - g;
    return {
      family, answer: String(answer), visual: null,
      prompt: mode === 'sum' ? `Find the sum of the HCF and the LCM of ${a} and ${b}.` : `What is the LCM of ${a} and ${b} minus their HCF?`,
      hint: 'Find the HCF (biggest common factor) and the LCM (smallest common multiple) separately.',
      explanation: `HCF = ${g} and LCM = ${l}. ${mode === 'sum' ? `${g} + ${l}` : `${l} - ${g}`} = ${answer}.`,
      proof: { family, givens: { mode, a, b } },
      choices: pickChoices(answer, [[mode === 'sum' ? l - g : g + l, 'class-5-hcf-lcm-mix'], [l, 'class-5-hcf-lcm-mix'], [g * 2 + l, 'class-5-hcf-lcm-mix'], [a * b + g, 'class-5-hcf-lcm-mix'], [a * b - g, 'class-5-hcf-lcm-mix'], [a + b, 'class-5-hcf-lcm-mix']], count, r, { numeric: true }),
    };
  }
  if (mode === 'three') {
    const g = r.pick([3, 4, 6, 7]);
    const [u, v, w] = r.shuffle([2, 3, 4, 5, 6, 8]).slice(0, 3);
    const [a, b, c] = [g * u, g * v, g * w];
    const answer = gcd3(a, b, c);
    if (answer === 1 || new Set([a, b, c]).size < 3) throw new QuestionRetry('Plain trio');
    return {
      family, answer: String(answer), visual: null,
      prompt: `What is the greatest number that divides ${a}, ${b} and ${c} exactly?`,
      hint: 'The number must divide all three. Find the factors that every one of them shares.',
      explanation: `The common factors of ${a}, ${b} and ${c} are those of ${answer}; the greatest is ${answer}.`,
      proof: { family, givens: { mode, a, b, c } },
      choices: pickChoices(answer, [[gcd(a, b), 'class-5-hcf-lcm-mix'], [gcd(b, c), 'class-5-hcf-lcm-mix'], [answer * 2, 'class-5-hcf-lcm-mix'], [lcm3(a, b, c), 'class-5-hcf-lcm-mix'], [Math.max(1, answer - 1), 'class-5-hcf-lcm-mix'], [Math.min(a, b, c), 'class-5-hcf-lcm-mix']], count, r, { numeric: true }),
    };
  }
  if (mode === 'smallest') {
    const [a, b, c] = r.shuffle([2, 3, 4, 5, 6, 8, 9, 10]).slice(0, 3);
    const answer = lcm3(a, b, c);
    if (answer > 200) throw new QuestionRetry('Too large');
    return {
      family, answer: String(answer), visual: null,
      prompt: `What is the smallest number that can be divided exactly by ${a}, ${b} and ${c}?`,
      hint: 'Find the smallest number that appears in the multiples lists of all three numbers.',
      explanation: `The least common multiple of ${a}, ${b} and ${c} is ${answer}.`,
      proof: { family, givens: { mode, a, b, c } },
      choices: pickChoices(answer, [[a * b * c, 'class-5-hcf-lcm-mix'], [lcm(a, b), 'class-5-hcf-lcm-mix'], [lcm(b, c), 'class-5-hcf-lcm-mix'], [answer * 2, 'class-5-hcf-lcm-mix'], [gcd3(a, b, c) || 1, 'class-5-hcf-lcm-mix'], [answer + lcm(a, c), 'class-5-hcf-lcm-mix']], count, r, { numeric: true }),
    };
  }
  if (mode === 'prime-sum') {
    const n = r.pick([30, 42, 60, 66, 70, 84, 90, 105, 120, 126, 150, 180]);
    const set = primeFactorSet(n);
    const answer = set.reduce((t, p) => t + p, 0);
    const list = primeFactorList(n);
    return {
      family, answer: String(answer), visual: null,
      prompt: `What is the sum of the different prime factors of ${n}?`,
      hint: 'Break the number into primes. Add each different prime once.',
      explanation: `${n} = ${list.join(' x ')}. The different primes are ${set.join(', ')}, and they add up to ${answer}.`,
      proof: { family, givens: { mode, n } },
      choices: pickChoices(answer, [[list.reduce((t, p) => t + p, 0), 'factor-multiple'], [set.reduce((t, p) => t * p, 1), 'factor-multiple'], [answer + 1, 'factor-multiple'], [answer - 1, 'factor-multiple'], [n / set[0], 'factor-multiple']], count, r, { numeric: true }),
    };
  }
  const g = r.int(2, 6);
  const pairs = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]];
  const [u, v] = r.pick(pairs);
  const l = g * u * v;
  const [known, other] = r.pick([[g * u, g * v], [g * v, g * u]]);
  return {
    family, answer: String(other), visual: null,
    prompt: `The HCF of two numbers is ${g} and their LCM is ${l}. One number is ${known}. What is the other number?`,
    hint: 'The product of two numbers equals their HCF times their LCM.',
    explanation: `${g} x ${l} = ${g * l}. The other number is ${g * l} / ${known} = ${other}.`,
    proof: { family, givens: { mode, g, l, known } },
    choices: pickChoices(other, [[l - known, 'class-5-hcf-lcm-mix'], [l / known, 'class-5-hcf-lcm-mix'], [g * l, 'class-5-hcf-lcm-mix'], [l, 'class-5-hcf-lcm-mix'], [other + g, 'class-5-hcf-lcm-mix'], [Math.abs(known - g), 'class-5-hcf-lcm-mix']], count, r, { numeric: true }),
  };
};
SOLVE['class-5-hcf-lcm-mix'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'sum') return String(gcd(g.a, g.b) + lcm(g.a, g.b));
  if (g.mode === 'diff') return String(lcm(g.a, g.b) - gcd(g.a, g.b));
  if (g.mode === 'three') return String(gcd3(g.a, g.b, g.c));
  if (g.mode === 'smallest') return String(lcm3(g.a, g.b, g.c));
  if (g.mode === 'prime-sum') return String(primeFactorSet(g.n).reduce((t, p) => t + p, 0));
  return String((g.g * g.l) / g.known);
};

// ---------------------------------------------------------------------------
// Durations across a.m. and p.m.
// ---------------------------------------------------------------------------
const clock12 = minutes => {
  const day = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(day / 60);
  return `${hour % 12 || 12}:${String(day % 60).padStart(2, '0')} ${hour < 12 ? 'a.m.' : 'p.m.'}`;
};
const span = minutes => `${Math.floor(minutes / 60)} h ${minutes % 60} min`;

DRAFT['class-5-ampm-elapsed'] = (family, grade, level, r) => {
  const mode = r.pick(level === 1 ? ['noon'] : level === 2 ? ['noon', 'night', 'end'] : ['night', 'end', 'start', 'night']);
  const count = choiceCount(grade);
  const craft = r.pick(['A shuttle', 'A cargo ship', 'A probe', 'A rover convoy', 'A supply drone']);
  if (mode === 'noon' || mode === 'night') {
    const start = mode === 'noon' ? r.int(6 * 60, 11 * 60 + 50) : r.int(20 * 60, 23 * 60 + 50);
    const length = mode === 'noon' ? r.int(3 * 60 + 15, 8 * 60 + 55) : r.int(5 * 60 + 15, 9 * 60 + 55);
    const startM = Math.round(start / 5) * 5;
    const lengthM = Math.round(length / 5) * 5;
    if (startM % 60 === 0 || lengthM % 60 === 0) throw new QuestionRetry('Round times');
    const end = startM + lengthM;
    const naive = Math.abs((end % 720) - (startM % 720));
    const pairs = [
      [span(lengthM + 60), 'class-5-ampm-span'], [span(lengthM - 60), 'class-5-ampm-span'], [span(naive), 'class-5-ampm-span'],
      [span(lengthM + 12 * 60 - 720 + 40), 'class-5-ampm-span'], [`${Math.floor(lengthM / 60)} h ${(60 - (lengthM % 60)) % 60} min`, 'hour-carry'], [span(lengthM + 20), 'hour-carry'],
    ];
    return {
      family, answer: span(lengthM), visual: null,
      prompt: `${craft} leaves at ${clock12(startM)} and arrives at ${clock12(end)}${mode === 'night' ? ' the next day' : ''}. How long is the trip?`,
      hint: mode === 'night' ? 'Go from the start time to midnight, then add the time after midnight.' : 'Go from the start time to 12 noon, then add the time after noon.',
      explanation: `From ${clock12(startM)} to ${clock12(end)} is ${span(lengthM)}.`,
      proof: { family, givens: { mode, startM, end } },
      choices: pickChoices(span(lengthM), pairs, count, r),
    };
  }
  const start = Math.round(r.int(7 * 60, 14 * 60) / 5) * 5;
  const lengthM = Math.round(r.int(2 * 60 + 25, 9 * 60 + 55) / 5) * 5;
  if (start % 60 === 0 || lengthM % 60 === 0) throw new QuestionRetry('Round times');
  const end = start + lengthM;
  if (mode === 'end') {
    const pairs = [[clock12(end + 60), 'class-5-ampm-span'], [clock12(end - 60), 'class-5-ampm-span'], [clock12(end + 12 * 60), 'class-5-ampm-span'], [clock12(start + lengthM + 25), 'hour-carry'], [clock12(end + 40), 'hour-carry']];
    return {
      family, answer: clock12(end), visual: null,
      prompt: `${craft} leaves at ${clock12(start)} and flies for ${span(lengthM)}. At what time does it arrive?`,
      hint: 'Add the hours first, then the minutes. Check whether you pass 12 noon.',
      explanation: `${clock12(start)} + ${span(lengthM)} = ${clock12(end)}.`,
      proof: { family, givens: { mode, start, lengthM } },
      choices: pickChoices(clock12(end), pairs, count, r),
    };
  }
  const pairs = [[clock12(start + 60), 'class-5-ampm-span'], [clock12(start - 60), 'class-5-ampm-span'], [clock12(start + 12 * 60), 'class-5-ampm-span'], [clock12(start + 40), 'hour-carry'], [clock12(start - 25), 'hour-carry']];
  return {
    family, answer: clock12(start), visual: null,
    prompt: `${craft} arrives at ${clock12(end)} after a trip of ${span(lengthM)}. At what time did it leave?`,
    hint: 'Work backwards: take the trip time away from the arrival time.',
    explanation: `${clock12(end)} - ${span(lengthM)} = ${clock12(start)}.`,
    proof: { family, givens: { mode, end, lengthM } },
    choices: pickChoices(clock12(start), pairs, count, r),
  };
};
SOLVE['class-5-ampm-elapsed'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'noon' || g.mode === 'night') return span(g.end - g.startM);
  if (g.mode === 'end') return clock12(g.start + g.lengthM);
  return clock12(g.end - g.lengthM);
};

// ---------------------------------------------------------------------------
// Field problems
// ---------------------------------------------------------------------------
DRAFT['class-5-field-rounds-area'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const name = r.pick(CADETS);
  if (r.int(0, 1) === 0) {
    const side = r.pick([10, 15, 20, 25, 30, 40, 50, 60, 75]);
    const rounds = r.int(2, 6);
    const distance = rounds * 4 * side;
    const area = side * side;
    return {
      family, answer: `${num(area)} sq m`, visual: null,
      prompt: `${name} runs ${rounds} rounds of a square field and covers ${num(distance)} m. What is the area of the field?`,
      hint: 'Find the distance for one round (the perimeter), then the side, then the area.',
      explanation: `One round = ${num(distance)} / ${rounds} = ${distance / rounds} m. Side = ${side} m. Area = ${side} x ${side} = ${num(area)} sq m.`,
      proof: { family, givens: { mode: 'rounds', rounds, distance } },
      choices: pickChoices(`${num(area)} sq m`, [[`${num(distance / rounds)} sq m`, 'class-5-rounds-side'], [`${num((distance / rounds) ** 2)} sq m`, 'class-5-rounds-side'], [`${num(side * 4)} sq m`, 'class-5-rounds-side'], [`${num(distance * side)} sq m`, 'area-perimeter'], [`${num(area + side)} sq m`, 'area-perimeter']], count, r),
    };
  }
  const width = r.int(6, 25);
  const k = r.int(2, 4);
  const perimeter = 2 * width * (k + 1);
  const area = k * width * width;
  return {
    family, answer: `${num(area)} sq m`, visual: null,
    prompt: `A rectangular plot is ${k} times as long as it is wide. Its perimeter is ${perimeter} m. What is its area?`,
    hint: 'Half the perimeter is length plus width. Split it using the ratio of length to width.',
    explanation: `Length + width = ${perimeter / 2} m, made of ${k + 1} equal parts. Width = ${width} m, length = ${k * width} m. Area = ${num(area)} sq m.`,
    proof: { family, givens: { mode: 'ratio', k, perimeter } },
    choices: pickChoices(`${num(area)} sq m`, [[`${num(perimeter * width)} sq m`, 'area-perimeter'], [`${num((perimeter / 4) ** 2)} sq m`, 'class-5-rounds-side'], [`${num(k * width * (width + k))} sq m`, 'missing-dimension'], [`${num((perimeter / 2) * width)} sq m`, 'missing-dimension'], [`${num(area + width * k)} sq m`, 'missing-dimension']], count, r),
  };
};
SOLVE['class-5-field-rounds-area'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'rounds') { const side = g.distance / g.rounds / 4; return `${num(side * side)} sq m`; }
  const width = g.perimeter / (2 * (g.k + 1));
  return `${num(g.k * width * width)} sq m`;
};

// ---------------------------------------------------------------------------
// Big numbers
// ---------------------------------------------------------------------------
DRAFT['class-5-big-number-story'] = (family, grade, level, r) => {
  const digits = level === 1 ? 5 : level === 2 ? 6 : 7;
  const big = () => r.int(10 ** (digits - 1) + 4321, 9 * 10 ** (digits - 1));
  const small = () => r.int(10 ** (digits - 2) + 987, 8 * 10 ** (digits - 2));
  const mode = r.pick(['inout', 'total', 'diff']);
  const count = choiceCount(grade);
  const place = r.pick(['A city', 'A moon colony', 'A space port', 'A fleet base']);
  const unit = 10 ** (digits - 3);
  if (mode === 'inout') {
    const a = big(); const b = small(); const c = small();
    const answer = a + b - c;
    return {
      family, answer: num(answer), visual: null,
      prompt: `${place} had ${num(a)} people. Then ${num(b)} people moved in and ${num(c)} moved out. How many people live there now?`,
      hint: 'Add the people who moved in, then take away those who moved out. Line up the digits.',
      explanation: `${num(a)} + ${num(b)} = ${num(a + b)}. Then ${num(a + b)} - ${num(c)} = ${num(answer)}.`,
      proof: { family, givens: { mode, a, b, c } },
      choices: pickChoices(num(answer), [[num(a - b + c), 'wrong-operation'], [num(a + b + c), 'wrong-operation'], [num(answer + unit), 'class-5-big-number'], [num(answer - unit), 'class-5-big-number'], [num(a + b), 'missing-step']], count, r),
    };
  }
  if (mode === 'total') {
    const a = small(); const b = small(); const c = small();
    const answer = a + b + c;
    return {
      family, answer: num(answer), visual: null,
      prompt: `Fuel sold in three months was ${num(a)} L, ${num(b)} L and ${num(c)} L. How many litres were sold in all?`,
      hint: 'Add the three amounts column by column and carry across each place.',
      explanation: `${num(a)} + ${num(b)} + ${num(c)} = ${num(answer)} L.`,
      proof: { family, givens: { mode, a, b, c } },
      choices: pickChoices(`${num(answer)}`, [[num(answer + unit), 'class-5-big-number'], [num(answer - unit), 'class-5-big-number'], [num(answer + unit * 10), 'class-5-big-number'], [num(a + b), 'missing-step'], [num(Math.max(a, b, c) * 3), 'wrong-operation']], count, r),
    };
  }
  const a = small(); const b = small(); const c = small(); const d = small();
  const answer = Math.abs(a + b - (c + d));
  if (answer < unit) throw new QuestionRetry('Too close');
  const more = a + b > c + d;
  return {
    family, answer: num(answer), visual: null,
    prompt: `Team A scored ${num(a)} and ${num(b)} points. Team B scored ${num(c)} and ${num(d)} points. How many more points did the ${more ? 'first' : 'second'} team score?`,
    hint: 'Find each team total first, then find the difference.',
    explanation: `Team A: ${num(a + b)}. Team B: ${num(c + d)}. The difference is ${num(answer)}.`,
    proof: { family, givens: { mode, a, b, c, d } },
    choices: pickChoices(num(answer), [[num(answer + unit), 'class-5-big-number'], [num(answer - unit), 'class-5-big-number'], [num(a + b + c + d), 'wrong-operation'], [num(Math.abs(a - c) + Math.abs(b - d)), 'wrong-operation'], [num(answer + unit * 10), 'class-5-big-number']], count, r),
  };
};
SOLVE['class-5-big-number-story'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'inout') return num(g.a + g.b - g.c);
  if (g.mode === 'total') return num(g.a + g.b + g.c);
  return num(Math.abs(g.a + g.b - (g.c + g.d)));
};

// ---------------------------------------------------------------------------
// Two questions from one bar chart
// ---------------------------------------------------------------------------
const TWO_ANSWER_CONTEXTS = [
  { place: 'Dock', noun: 'crates', past: 'loaded', at: 'at' },
  { place: 'Lab', noun: 'samples', past: 'tested', at: 'in' },
  { place: 'Workshop', noun: 'robots', past: 'built', at: 'in' },
  { place: 'Greenhouse', noun: 'melons', past: 'picked', at: 'in' },
  { place: 'Station', noun: 'panels', past: 'fixed', at: 'at' },
];
const twoAnswerParts = (values, picks, sumAll) => {
  const [p, q, s, t] = picks;
  const diff = Math.abs(values[p] - values[q]);
  const total = sumAll ? values.reduce((a, b) => a + b, 0) : values[s] + values[t];
  return { diff, total };
};
DRAFT['class-5-chart-two-answers'] = (family, grade, level, r) => {
  const ctx = r.pick(TWO_ANSWER_CONTEXTS);
  const barCount = level === 1 ? 4 : 5;
  const step = r.pick(level === 1 ? [10, 20] : [5, 10, 20, 50]);
  const letters = r.shuffle(['A', 'B', 'C', 'D', 'E', 'F']).slice(0, barCount);
  const labels = letters.map(l => `${ctx.place} ${l}`);
  const values = r.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, barCount).map(k => step * k);
  const max = Math.max(...values) + step;
  const bars = labels.map((label, i) => ({ label, value: values[i] }));
  const order = r.shuffle(labels.map((_, i) => i));
  const picks = order.slice(0, 4);
  const fewer = r.int(0, 1) === 1;
  if ((values[picks[0]] < values[picks[1]]) !== fewer) [picks[0], picks[1]] = [picks[1], picks[0]];
  const [p, q, s, t] = picks;
  const sumAll = level >= 2 && r.int(0, 1) === 1;
  const { diff, total } = twoAnswerParts(values, picks, sumAll);
  const answer = `${diff} ${fewer ? 'fewer' : 'more'}, ${total} in all`;
  const other = fewer ? 'more' : 'fewer';
  const partTwo = sumAll ? `how many ${ctx.noun} in all ${barCount} ${ctx.place.toLowerCase()}s` : `how many ${ctx.noun} ${labels[s]} and ${labels[t]} had together`;
  const wrongTotal = sumAll ? values[s] + values[t] : values.reduce((a, b) => a + b, 0) - values[p];
  const pairs = [
    [`${total} ${fewer ? 'fewer' : 'more'}, ${diff} in all`, 'graph-difference'],
    [`${values[p] + values[q]} ${fewer ? 'fewer' : 'more'}, ${total} in all`, 'graph-difference'],
    [`${diff} ${fewer ? 'fewer' : 'more'}, ${wrongTotal} in all`, 'graph-difference'],
    [`${diff + step} ${fewer ? 'fewer' : 'more'}, ${total} in all`, 'scale-interval'],
    [`${diff} ${fewer ? 'fewer' : 'more'}, ${total + step} in all`, 'scale-interval'],
    [`${diff} ${other}, ${total} in all`, 'graph-difference'],
  ];
  const hiFirst = values[p] > values[q];
  const diffWorking = `${labels[hiFirst ? p : q]} ${Math.max(values[p], values[q])} - ${labels[hiFirst ? q : p]} ${Math.min(values[p], values[q])} = ${diff}`;
  const totalWorking = sumAll ? `${values.join(' + ')} = ${total}` : `${labels[s]} ${values[s]} + ${labels[t]} ${values[t]} = ${total}`;
  return {
    family, answer,
    prompt: `The chart shows ${ctx.noun} ${ctx.past}. How many ${fewer ? 'fewer' : 'more'} ${ctx.noun} ${ctx.at} ${labels[p]} than ${labels[q]}, and ${partTwo}?`,
    hint: `Read each bar against the gridlines. Subtract for "${fewer ? 'fewer' : 'more'} than" and add for "${sumAll ? 'in all' : 'together'}".`,
    explanation: `${diffWorking}. ${totalWorking}.`,
    visual: { kind: 'v3-class-5-barchart', bars, max, step, description: `A bar chart with gridlines every ${step}. ${bars.map(b => `${b.label} reaches ${b.value}`).join(', ')}.` },
    proof: { family, givens: { picks, fewer, sumAll } },
    choices: pickChoices(answer, pairs, choiceCount(grade), r),
  };
};
SOLVE['class-5-chart-two-answers'] = q => {
  const { picks, fewer, sumAll } = q.proof.givens;
  const v = q.visual.bars.map(b => b.value);
  const { diff, total } = twoAnswerParts(v, picks, sumAll);
  return `${diff} ${fewer ? 'fewer' : 'more'}, ${total} in all`;
};

// ---------------------------------------------------------------------------
// Age puzzles
// ---------------------------------------------------------------------------
DRAFT['class-5-age-puzzle'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const [A, B] = r.shuffle(CADETS);
  if (r.int(0, 1) === 0) {
    const young = r.int(6, 15);
    const diff = r.int(3, 9);
    const years = r.int(2, 6);
    const sum = young * 2 + diff + years * 2;
    return {
      family, answer: String(young), visual: null,
      prompt: `${A} is ${diff} years older than ${B}. In ${years} years, the sum of their ages will be ${sum}. How old is ${B} now?`,
      hint: 'In some years both ages grow. Take that growth off the sum first.',
      explanation: `Now the sum is ${sum} - ${years} - ${years} = ${sum - 2 * years}. Two equal ages plus ${diff}: (${sum - 2 * years} - ${diff}) / 2 = ${young}.`,
      proof: { family, givens: { mode: 'older', diff, years, sum } },
      choices: pickChoices(young, [[young + diff, 'wrong-operation'], [(sum - diff) / 2, 'missing-step'], [(sum - 2 * years) / 2, 'wrong-operation'], [young + years, 'missing-step'], [young - 1, 'wrong-operation'], [sum - diff - 2 * years, 'wrong-operation']], count, r, { numeric: true }),
    };
  }
  const k = r.int(3, 5);
  const son = r.int(6, 12);
  const sum = son * (k + 1);
  return {
    family, answer: String(son * k), visual: null,
    prompt: `The sum of ${A}'s age and ${A}'s son's age is ${sum} years. ${A} is ${k} times as old as the son. How old is ${A}?`,
    hint: 'Treat the son as 1 part and the parent as several parts. Share the sum among all the parts.',
    explanation: `There are ${k} + 1 = ${k + 1} equal parts. One part = ${sum} / ${k + 1} = ${son}. ${A} = ${k} x ${son} = ${son * k}.`,
    proof: { family, givens: { mode: 'times', k, sum } },
    choices: pickChoices(son * k, [[son, 'wrong-operation'], [sum / k, 'wrong-operation'], [sum - son * k + k, 'wrong-operation'], [son * (k + 1), 'wrong-operation'], [son * k - k, 'wrong-operation']], count, r, { numeric: true }),
  };
};
SOLVE['class-5-age-puzzle'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'older') return String((g.sum - 2 * g.years - g.diff) / 2);
  return String((g.sum / (g.k + 1)) * g.k);
};

export { KNOWN, digitSum, ord };
