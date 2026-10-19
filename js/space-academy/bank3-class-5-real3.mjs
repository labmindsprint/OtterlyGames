// Class 5 "real paper" gap families: greatest-of comparison, Statement-I/II options, line graph, mirror and water images.
// Modelled on the official SOF IMO Class 5 sample papers. Imported by bank3-class-5.mjs.
import { answerChoices, choiceCount, wrong } from './bank-shared.mjs';
import { circle, line, path, rect, svg, text, GREEN, ORANGE } from './diagram-kit.mjs';
import { KNOWN as KIT_KNOWN, QuestionRetry, gcd, lcm } from './bank3-class-5-real-kit.mjs';

export const REAL3_CODES = {
  'class-5-line-night': { title: 'Matching the night to its point', message: 'Find the named night on the horizontal axis, then read the point straight above it.' },
  'class-5-mirror-flip': { title: 'Flipping in a mirror', message: 'A mirror swaps left and right, so the last letter comes first. A water image swaps top and bottom.' },
};

export const REAL3_FAMILIES = {
  'class-5-greatest-of-four': { skill: 'factors', title: 'Pick the greatest or smallest of four number facts' },
  'class-5-statement-pair': { skill: 'compare', title: 'Judge Statement I and Statement II' },
  'class-5-line-graph-two': { skill: 'chart', title: 'Answer two questions from a line graph' },
  'class-5-mirror-water-word': { skill: 'visual', title: 'Find the mirror or water image of letters' },
};

export const DRAFT = {};
export const SOLVE = {};

const KNOWN = { ...KIT_KNOWN, ...REAL3_CODES };

function pick3(answer, pairs, count, r) {
  const seen = new Set([String(answer)]);
  const alternatives = [];
  for (const [value, code] of pairs) {
    const key = String(value);
    if (seen.has(key) || key === 'NaN') continue;
    seen.add(key);
    alternatives.push(wrong(value, code));
  }
  return answerChoices(String(answer), r.shuffle(alternatives), count, null, KNOWN);
}

// ---------------------------------------------------------------------------
// Greatest or smallest of four facts
// ---------------------------------------------------------------------------
const greatestPrimeFactor = n => { let m = n; let p = 2; let best = 1; while (m > 1) { if (m % p === 0) { best = p; m /= p; } else p++; } return best; };
const factorCount = n => { let c = 0; for (let d = 1; d <= n; d++) if (n % d === 0) c++; return c; };
const ITEM_POOLS = {
  hcf: [[10, 30], [24, 36], [18, 45], [28, 42], [16, 40], [36, 60], [48, 72], [14, 21]],
  lcm: [[2, 5], [3, 4], [6, 8], [4, 10], [9, 12], [15, 25], [12, 18], [20, 30]],
  gpf: [[35], [42], [77], [91], [65], [143], [66], [110]],
  nfac: [[12], [18], [20], [24], [28], [30], [36], [40], [48], [60]],
  mult: [[3], [4], [6], [7], [8], [9], [11], [12]],
};
const itemValue = it => (it.k === 'hcf' ? gcd(it.a, it.b) : it.k === 'lcm' ? lcm(it.a, it.b) : it.k === 'gpf' ? greatestPrimeFactor(it.a) : it.k === 'nfac' ? factorCount(it.a) : 5 * it.a);
const itemText = it => (it.k === 'hcf' ? `HCF of ${it.a} and ${it.b}` : it.k === 'lcm' ? `LCM of ${it.a} and ${it.b}` : it.k === 'gpf' ? `Greatest prime factor of ${it.a}` : it.k === 'nfac' ? `Number of factors of ${it.a}` : `5th multiple of ${it.a}`);

DRAFT['class-5-greatest-of-four'] = (family, grade, level, r) => {
  const kinds = r.shuffle(Object.keys(ITEM_POOLS)).slice(0, 4);
  const items = kinds.map(k => { const [a, b] = r.pick(ITEM_POOLS[k]); return { k, a, ...(b ? { b } : {}) }; });
  const values = items.map(itemValue);
  if (new Set(values).size < 4) throw new QuestionRetry('Tied values');
  const biggest = r.int(0, 1) === 0;
  const target = biggest ? Math.max(...values) : Math.min(...values);
  const best = items[values.indexOf(target)];
  const answer = itemText(best);
  return {
    family, answer, visual: null,
    prompt: `Which of these has the ${biggest ? 'greatest' : 'smallest'} value?`,
    hint: 'Work out the value of each one first, then compare the four numbers.',
    explanation: `${items.map((it, i) => `${itemText(it)} = ${values[i]}`).join('; ')}. The ${biggest ? 'greatest' : 'smallest'} is ${target}.`,
    proof: { family, givens: { biggest, items } },
    choices: pick3(answer, items.map(it => [itemText(it), 'class-5-hcf-lcm-mix']), choiceCount(grade), r),
  };
};
SOLVE['class-5-greatest-of-four'] = q => {
  const { biggest, items } = q.proof.givens;
  const values = items.map(itemValue);
  return itemText(items[values.indexOf(biggest ? Math.max(...values) : Math.min(...values))]);
};

// ---------------------------------------------------------------------------
// Statement I and Statement II
// ---------------------------------------------------------------------------
const money = (n, d) => (n / 10 ** d).toFixed(d);
const STATEMENTS = {
  round: {
    make: (r, ok) => {
      const a = r.int(1001, 9999);
      if (a % 10 === 0) throw new QuestionRetry('Exact');
      const right = Math.round(a / 10);
      return { a, shown: ok ? right : (Math.floor(a / 10) !== right ? Math.floor(a / 10) : right + 1) };
    },
    truth: s => s.shown === Math.round(s.a / 10),
    text: s => `${money(s.a, 3)} rounded to the nearest hundredth is ${money(s.shown, 2)}`,
    why: s => `${money(s.a, 3)} rounds to ${money(Math.round(s.a / 10), 2)}`,
  },
  dsum: {
    make: (r, ok) => {
      const a = r.int(150, 899); const b = r.int(150, 899);
      return { a, b, shown: ok ? a + b : a + b + r.pick([10, -10, 100]) };
    },
    truth: s => s.shown === s.a + s.b,
    text: s => `${money(s.a, 2)} + ${money(s.b, 2)} = ${money(s.shown, 2)}`,
    why: s => `${money(s.a, 2)} + ${money(s.b, 2)} = ${money(s.a + s.b, 2)}`,
  },
  ddiff: {
    make: (r, ok) => {
      const a = r.int(500, 999); const b = r.int(100, a - 100);
      return { a, b, shown: ok ? a - b : a - b + r.pick([10, -10, 100]) };
    },
    truth: s => s.shown === s.a - s.b,
    text: s => `${money(s.a, 2)} - ${money(s.b, 2)} = ${money(s.shown, 2)}`,
    why: s => `${money(s.a, 2)} - ${money(s.b, 2)} = ${money(s.a - s.b, 2)}`,
  },
  div: {
    make: (r, ok) => {
      const k = r.pick([3, 4, 6, 9]);
      const base = k * r.int(120, 900);
      return { a: ok ? base : base + r.int(1, k - 1), b: k };
    },
    truth: s => s.a % s.b === 0,
    text: s => `${s.a} is divisible by ${s.b}`,
    why: s => `${s.a} / ${s.b} leaves remainder ${s.a % s.b}`,
  },
  lcm: {
    make: (r, ok) => {
      const [a, b] = r.pick([[6, 8], [12, 18], [4, 10], [15, 25], [9, 12], [20, 30]]);
      return { a, b, shown: ok ? lcm(a, b) : r.pick([a * b, Math.max(a, b) * 2, gcd(a, b)]) };
    },
    truth: s => s.shown === lcm(s.a, s.b),
    text: s => `The LCM of ${s.a} and ${s.b} is ${s.shown}`,
    why: s => `the LCM of ${s.a} and ${s.b} is ${lcm(s.a, s.b)}`,
  },
  pct: {
    make: (r, ok) => {
      const p = r.pick([10, 20, 25, 50]); const n = r.pick([80, 120, 160, 200, 240, 360, 400]);
      const right = (p * n) / 100;
      return { a: p, b: n, shown: ok ? right : r.pick([right * 2, (p * n) / 10, n - right]) };
    },
    truth: s => s.shown === (s.a * s.b) / 100,
    text: s => `${s.a}% of ${s.b} is ${s.shown}`,
    why: s => `${s.a}% of ${s.b} is ${(s.a * s.b) / 100}`,
  },
};
const STATEMENT_OPTIONS = { '1,1': 'Both Statements are true', '1,0': 'Only Statement I is true', '0,1': 'Only Statement II is true', '0,0': 'Neither Statement is true' };

DRAFT['class-5-statement-pair'] = (family, grade, level, r) => {
  const kinds = r.shuffle(level === 1 ? ['dsum', 'ddiff', 'div', 'pct'] : level === 2 ? ['dsum', 'ddiff', 'div', 'pct', 'round', 'lcm'] : ['round', 'lcm', 'dsum', 'ddiff', 'div', 'pct']).slice(0, 2);
  const truths = [r.int(0, 1), r.int(0, 1)];
  const parts = kinds.map((k, i) => ({ kind: k, ...STATEMENTS[k].make(r, truths[i] === 1) }));
  if (parts.some((s, i) => STATEMENTS[s.kind].truth(s) !== (truths[i] === 1))) throw new QuestionRetry('Statement truth mismatch');
  const answer = STATEMENT_OPTIONS[truths.join(',')];
  const note = (s, ok) => `Statement ${s.roman} is ${ok ? 'true' : 'false'}: ${STATEMENTS[s.kind].why(s)}.`;
  parts.forEach((s, i) => { s.roman = i === 0 ? 'I' : 'II'; });
  return {
    family, answer, visual: null,
    prompt: `Statement I: ${STATEMENTS[parts[0].kind].text(parts[0])}. Statement II: ${STATEMENTS[parts[1].kind].text(parts[1])}. Which option is correct?`,
    hint: 'Work out each statement on its own, then match the two results to an option.',
    explanation: `${note(parts[0], truths[0] === 1)} ${note(parts[1], truths[1] === 1)}`,
    proof: { family, givens: { parts: parts.map(({ roman, ...rest }) => rest) } },
    choices: pick3(answer, Object.values(STATEMENT_OPTIONS).map(v => [v, 'class-5-statement-each']), choiceCount(grade), r),
  };
};
SOLVE['class-5-statement-pair'] = q => STATEMENT_OPTIONS[q.proof.givens.parts.map(s => (STATEMENTS[s.kind].truth(s) ? 1 : 0)).join(',')];

// ---------------------------------------------------------------------------
// Line graph with two questions
// ---------------------------------------------------------------------------
DRAFT['class-5-line-graph-two'] = (family, grade, level, r) => {
  const step = r.pick([10, 20, 50]);
  const values = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 6).map(v => step * v);
  const peak = Math.max(...values);
  let x = r.int(0, 5);
  let y = r.int(0, 4);
  if (y >= x) y += 1;
  if (values[x] < values[y]) [y, x] = [x, y];
  const noun = r.pick(['crates', 'rockets', 'stars', 'probes']);
  const max = peak + step;
  const diff = values[x] - values[y];
  const top = values.indexOf(peak) + 1;
  const sorted = [...values].sort((a, b) => b - a);
  const second = values.indexOf(sorted[1]) + 1;
  const answer = `${diff} more; Night ${top}`;
  const alternatives = [
    [`${diff + step} more; Night ${top}`, 'scale-interval'], [`${diff - step} more; Night ${top}`, 'scale-interval'],
    [`${diff} more; Night ${second}`, 'class-5-line-night'], [`${values[x] + values[y]} more; Night ${top}`, 'graph-difference'],
    [`${diff} more; Night ${values.indexOf(Math.min(...values)) + 1}`, 'class-5-line-night'],
  ].filter(([v]) => !/^-|^0 /.test(v));
  return {
    family, answer,
    prompt: `The graph shows ${noun} counted on six nights. (i) How many more on Night ${x + 1} than Night ${y + 1}? (ii) On which night was the count highest?`,
    hint: 'Read each point against the gridlines. Subtract for "more than", then find the highest point.',
    explanation: `Night ${x + 1} ${values[x]} - Night ${y + 1} ${values[y]} = ${diff}. The highest point is Night ${top}, at ${peak}.`,
    visual: { kind: 'v3-class-5-linegraph', values, max, step, noun, description: `A line graph of ${noun} counted on six nights, gridlines every ${step}. ${values.map((v, i) => `Night ${i + 1} is ${v}`).join(', ')}.` },
    proof: { family, givens: { x, y } },
    choices: pick3(answer, alternatives, choiceCount(grade), r),
  };
};
SOLVE['class-5-line-graph-two'] = q => {
  const { values } = q.visual;
  const { x, y } = q.proof.givens;
  return `${values[x] - values[y]} more; Night ${values.indexOf(Math.max(...values)) + 1}`;
};

const renderLineGraph = visual => {
  const left = 70; const right = 450; const top = 30; const bottom = 215;
  const rows = visual.max / visual.step;
  let body = rect(0, 0, 480, 280, { fill: '#f4f1e4', stroke: '#d8d2c0', rx: 10, strokeWidth: 1 });
  for (let i = 0; i <= rows; i++) {
    const y = bottom - ((bottom - top) * i) / rows;
    body += line(left, y, right, y, { stroke: '#c9c3b0', width: 1 }) + text(left - 8, y + 6, String(i * visual.step), { size: 16, anchor: 'end' });
  }
  const pts = visual.values.map((v, i) => [left + ((right - left) * (i + 0.5)) / visual.values.length, bottom - ((bottom - top) * v) / visual.max]);
  body += path(`M${pts.map(p => p.map(n => n.toFixed(1)).join(' ')).join(' L')}`, { stroke: ORANGE, strokeWidth: 3 });
  pts.forEach((p, i) => { body += circle(p[0], p[1], 6, { fill: GREEN }) + text(p[0], bottom + 24, String(i + 1), { size: 16 }); });
  body += text((left + right) / 2, 266, 'Night', { size: 16 });
  return svg(body, visual.description, 480, 280);
};

// ---------------------------------------------------------------------------
// Mirror and water images of words
// ---------------------------------------------------------------------------
const SIDE_SYMMETRIC = 'AHIMOTUVWXY';
const TOP_SYMMETRIC = 'BCDEHIKOX';
const NOT_SIDE = 'BCDEFGJKLNPQRSZ';
const NOT_TOP = 'AMTUWPRLVY';
const rev = w => [...w].reverse().join('');
const isSideWord = w => w === rev(w) && [...w].every(c => SIDE_SYMMETRIC.includes(c));
const isTopWord = w => [...w].every(c => TOP_SYMMETRIC.includes(c));
const letters = (r, set, n) => Array.from({ length: n }, () => r.pick([...set])).join('');
const replaceAt = (w, i, c) => w.slice(0, i) + c + w.slice(i + 1);

DRAFT['class-5-mirror-water-word'] = (family, grade, level, r) => {
  const mode = r.pick(level === 1 ? ['mirror-word'] : level === 2 ? ['mirror-word', 'mirror-same'] : ['mirror-word', 'mirror-same', 'water-same']);
  const count = choiceCount(grade);
  if (mode === 'mirror-word') {
    const w = letters(r, SIDE_SYMMETRIC, 5);
    if (w === rev(w)) throw new QuestionRetry('Palindrome');
    const answer = rev(w);
    const side = r.pick(['right', 'left']);
    return {
      family, answer, visual: null,
      prompt: `A mirror stands on the ${side} of the word ${w}. What does the mirror image read?`,
      hint: 'A mirror swaps left and right, so the last letter appears first.',
      explanation: `Every letter here looks the same flipped, so the image is ${w} read from the other end: ${answer}.`,
      proof: { family, givens: { mode, w, side } },
      choices: pick3(answer, [[w, 'class-5-mirror-flip'], [answer.slice(1) + answer[0], 'class-5-mirror-flip'], [w[0] + rev(w.slice(1)), 'class-5-mirror-flip'], [rev(w.slice(0, 2)) + w.slice(2), 'class-5-mirror-flip'], [answer[1] + answer[0] + answer.slice(2), 'class-5-mirror-flip']], count, r),
    };
  }
  let items;
  let answer;
  if (mode === 'mirror-same') {
    const n = r.pick([3, 5]);
    const half = letters(r, SIDE_SYMMETRIC, (n - 1) / 2);
    answer = half + r.pick([...SIDE_SYMMETRIC]) + rev(half);
    const bad = () => r.pick([...NOT_SIDE]);
    const outer = bad();
    const outerBad = outer + answer.slice(1, n - 1) + outer;
    const middleBad = replaceAt(answer, (n - 1) / 2, bad());
    const notPal = replaceAt(answer, n - 1, r.pick([...SIDE_SYMMETRIC].filter(c => c !== answer[n - 1])));
    items = [answer, outerBad, middleBad, notPal];
  } else {
    answer = letters(r, TOP_SYMMETRIC, 4);
    items = [answer, ...r.shuffle([0, 1, 2, 3]).slice(0, 3).map(i => replaceAt(answer, i, r.pick([...NOT_TOP])))];
  }
  const test = mode === 'mirror-same' ? isSideWord : isTopWord;
  if (new Set(items).size < 4 || items.filter(test).length !== 1) throw new QuestionRetry('Need exactly one matching word');
  return {
    family, answer, visual: null,
    prompt: mode === 'mirror-same' ? 'Which word looks exactly the same in a mirror placed on its right side?' : 'Which word looks the same in its water image, with the mirror placed below it?',
    hint: mode === 'mirror-same' ? 'The word must read the same backwards, and every letter must look the same flipped left to right.' : 'A water image flips top and bottom, so each letter needs matching top and bottom halves.',
    explanation: mode === 'mirror-same' ? `${answer} reads the same backwards and each letter is left-right symmetric. Every other word fails one of these tests.` : `Each letter of ${answer} has matching top and bottom halves. Every other word has a letter that does not.`,
    proof: { family, givens: { mode, items } },
    choices: pick3(answer, items.map(w => [w, 'class-5-mirror-flip']), count, r),
  };
};
SOLVE['class-5-mirror-water-word'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'mirror-word') return rev(g.w);
  return g.items.find(g.mode === 'mirror-same' ? isSideWord : isTopWord);
};

export function renderReal3(visual) {
  if (visual.kind === 'v3-class-5-linegraph') return renderLineGraph(visual);
  return null;
}
