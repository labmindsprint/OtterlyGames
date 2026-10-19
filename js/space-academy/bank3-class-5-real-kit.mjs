// Shared helpers for the "real paper" Class 5 families (reasoning and mixed). Pure and deterministic.
import { answerChoices, MISCONCEPTIONS as SHARED, QuestionRetry, wrong } from './bank-shared.mjs';

export { QuestionRetry };

export const REAL_MISCONCEPTIONS = {
  'class-5-order-slip': { title: 'Sort first, then pick', message: 'Write every number in order first, then pick the position the question asks for.' },
  'class-5-walk-cancel': { title: 'Opposite moves cancel', message: 'Moves in opposite directions cancel: subtract the shorter move from the longer one.' },
  'class-5-relation-gen': { title: 'Counting generations', message: 'Move one generation at a time: parent, then grandparent. Check each link.' },
  'class-5-mirror-time': { title: 'Reading a mirror clock', message: 'In a mirror the real time is 11:60 minus the time shown.' },
  'class-5-letter-position': { title: 'Letter positions', message: 'A is 1, B is 2 and so on to Z at 26. Apply the same rule to every letter.' },
  'class-5-compass-point': { title: 'Reading compass directions', message: 'Place each person on a map: north is up, east is right. Then read the final direction.' },
  'class-5-odd-rule': { title: 'Finding the shared rule', message: 'Find the rule that all but one item share; the odd one breaks that rule.' },
  'class-5-series-gap': { title: 'Finding the series rule', message: 'Check the gaps between terms; they may grow, repeat or alternate.' },
  'class-5-grid-count': { title: 'Counting every size', message: 'Count squares or triangles of every size, not only the smallest ones.' },
  'class-5-day-offset': { title: 'Counting days from a clue', message: 'Turn the clue into a day count from a known day, then move forward or back.' },
  'class-5-fold-double': { title: 'Folds double the layers', message: 'Each fold doubles the layers, so every hole or cut shows up twice as often.' },
  'class-5-venn-overlap': { title: 'Counting the overlap', message: 'Cadets in both groups are counted twice when the two groups are added.' },
  'class-5-chain-order': { title: 'Linking every clue', message: 'Join the clues into one line from highest to lowest before answering.' },
  'class-5-statement-each': { title: 'Testing each statement', message: 'Check every statement on its own, then match your results to the options.' },
  'class-5-ampm-span': { title: 'Crossing noon or midnight', message: 'Work to 12 noon or midnight first, then add the rest of the time.' },
  'class-5-rounds-side': { title: 'Rounds and square perimeter', message: 'Distance = rounds x perimeter. The perimeter of a square is 4 times its side.' },
  'class-5-big-number': { title: 'Big number columns', message: 'Line up digits by place value and carry or borrow across every column.' },
  'class-5-hcf-lcm-mix': { title: 'HCF or LCM', message: 'HCF is the biggest number dividing both; LCM is the smallest number both divide.' },
};

export const KNOWN = { ...SHARED, ...REAL_MISCONCEPTIONS };

export const MALE = ['Omar', 'Kavi', 'Theo', 'Zayn', 'Arjun', 'Rohan'];
export const FEMALE = ['Mira', 'Juno', 'Leni', 'Priya', 'Nila', 'Asha'];
export const CADETS = [...MALE.slice(0, 3), ...FEMALE.slice(0, 3), 'Leo', 'Sia'];

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ord = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const letterAt = n => LETTERS[n - 1];
export const posOf = ch => LETTERS.indexOf(ch) + 1;

// Builds 4 options: the right answer plus 3 of the plausible wrong values, shuffled so the right one is not always central.
export function pickChoices(answer, pairs, count, r, { numeric = false } = {}) {
  const seen = new Set([String(answer)]);
  const valid = [];
  for (const [value, code] of pairs) {
    const text = String(value);
    if (seen.has(text) || text === 'NaN' || text.includes('Infinity')) continue;
    if (numeric && (!/^\d/.test(text))) continue;
    seen.add(text);
    valid.push(wrong(value, code));
  }
  const first = text => Number(/-?\d+(?:\.\d+)?/.exec(String(text).replaceAll(',', ''))?.[0]);
  const target = first(answer);
  let alternatives = valid.length > count - 1 ? r.shuffle(valid) : valid;
  if (alternatives.length > count - 1 && Number.isFinite(target) && alternatives.every(item => Number.isFinite(first(item.value ?? item.text ?? item)))) {
    const below = alternatives.filter(item => first(item.value ?? item.text ?? item) < target);
    const above = alternatives.filter(item => first(item.value ?? item.text ?? item) > target);
    const rest = alternatives.filter(item => !below.includes(item) && !above.includes(item));
    const lower = Math.min(r.int(0, count - 1), below.length);
    const upper = Math.min(count - 1 - lower, above.length);
    const chosen = [...below.slice(0, lower), ...above.slice(0, upper)];
    const spare = [...below.slice(lower), ...above.slice(upper), ...rest];
    alternatives = [...chosen, ...spare.slice(0, count - 1 - chosen.length)];
  }
  return answerChoices(String(answer), alternatives, count, null, KNOWN);
}

export const DIRS = {
  N: { word: 'north', dx: 0, dy: 1 },
  E: { word: 'east', dx: 1, dy: 0 },
  S: { word: 'south', dx: 0, dy: -1 },
  W: { word: 'west', dx: -1, dy: 0 },
};
export const DIR_ORDER = ['N', 'E', 'S', 'W'];
export const turnDir = (dir, side) => DIR_ORDER[(DIR_ORDER.indexOf(dir) + (side === 'right' ? 1 : 3)) % 4];

export const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
export const lcm = (a, b) => (a / gcd(a, b)) * b;
export const isPrime = n => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
export const digitSum = n => String(n).split('').reduce((total, d) => total + Number(d), 0);
export const isSquare = n => Number.isInteger(Math.sqrt(n));
export const isCube = n => Number.isInteger(Math.round(Math.cbrt(n))) && Math.round(Math.cbrt(n)) ** 3 === n;
