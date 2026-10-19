// Small helpers shared by the real-paper style Class 3 families.
import { wrong } from './bank-shared.mjs';
import { biased, q, textChoices } from './bank3-class-3-helpers.mjs';

export const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export const fr = (n, d) => `${n}/${d}`;
export const reduce = (n, d) => {
  const g = gcd(n, d);
  return [n / g, d / g];
};
export const same = (a, b, c, d) => a * d === b * c;
export const count = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const rs = n => `Rs ${n}`;
export const sum = list => list.reduce((total, value) => total + value, 0);
export const range = (low, high) => Array.from({ length: high - low + 1 }, (_, index) => low + index);

// A whole-number question. wrongs is a list of [value, feedback code] pairs, most telling first.
export function numberQ(r, spec) {
  const { wrongs = [], min = 0, max = 99999, mode, ...rest } = spec;
  return q({ ...rest, choices: biased(r, rest.answer, wrongs.map(([value, code]) => ({ value, code })), { min, max, mode }) });
}

// A question whose answers are words, fractions or lists.
export function textQ(spec) {
  const { wrongs, ...rest } = spec;
  return q({ ...rest, choices: textChoices(rest.answer, wrongs.map(([value, code]) => wrong(value, code))) });
}

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function permutations(list) {
  if (list.length <= 1) return [list];
  return list.flatMap((item, index) => permutations([...list.slice(0, index), ...list.slice(index + 1)]).map(rest => [item, ...rest]));
}

export const digitSum = value => String(value).split('').reduce((total, digit) => total + Number(digit), 0);

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function words(value) {
  if (value < 20) return ONES[value];
  if (value < 100) return TENS[Math.floor(value / 10)] + (value % 10 ? ` ${ONES[value % 10]}` : '');
  if (value < 1000) return `${ONES[Math.floor(value / 100)]} hundred${value % 100 ? ` ${words(value % 100)}` : ''}`;
  return `${words(Math.floor(value / 1000))} thousand${value % 1000 ? ` ${words(value % 1000)}` : ''}`;
}

// Whole parts and small parts of a measure, such as 1 L 500 mL.
export const UNIT_PAIRS = {
  capacity: { big: 'L', small: 'mL', k: 1000 },
  mass: { big: 'kg', small: 'g', k: 1000 },
  length: { big: 'm', small: 'cm', k: 100 },
  distance: { big: 'km', small: 'm', k: 1000 },
};

export function measureText(pair, whole, rest) {
  if (!rest) return `${whole} ${pair.big}`;
  if (!whole) return `${rest} ${pair.small}`;
  return `${whole} ${pair.big} ${rest} ${pair.small}`;
}

// Reads "8 m 54 cm", "805 cm" or "2 L" and returns the amount in the smaller unit of the pair.
export function measureValue(text, pair) {
  let total = 0;
  for (const [, amount, unit] of text.matchAll(/(\d+) ([A-Za-z]+)/g)) {
    if (unit === pair.big) total += Number(amount) * pair.k;
    else if (unit === pair.small) total += Number(amount);
    else throw new Error(`Unexpected unit ${unit}`);
  }
  return total;
}
