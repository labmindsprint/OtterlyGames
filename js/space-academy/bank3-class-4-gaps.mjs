// Class 4 question-bank gaps: five-digit number names and "list the possible pairs" (factor pairs and combinations).
import { MISCONCEPTIONS as SHARED, QuestionRetry, choiceCount, numberText } from './bank-shared.mjs';
import { build, retrying } from './bank3-gap-kit.mjs';

export const GAP4_CODES = {
  'class-4-name-zero': { title: 'A zero holds a place', message: 'A zero in a numeral means that place is empty. Say nothing for it, but keep the place.' },
  'class-4-name-order': { title: 'Digits in the wrong order', message: 'Read the thousands first, then the hundreds, then the tens and ones, in that order.' },
  'class-4-name-place': { title: 'Thousands or hundreds', message: 'Check which place each part of the name belongs to. Thousands come before hundreds.' },
  'class-4-pair-missing': { title: 'A pair is missing', message: 'Start at 1 and test each number in turn. Stop when the pairs meet, and list every pair that works.' },
  'class-4-pair-extra': { title: 'A pair that does not work', message: 'Every pair on the list must work. Multiply or add the two numbers to check.' },
  'class-4-pair-order': { title: 'Same pair, other order', message: 'Pairs like 2 and 6, and 6 and 2, are the same pair. Count each pair once.' },
  'class-4-pair-zero': { title: 'Leading zero', message: 'A two-digit number cannot start with 0. A card with 0 can only be the ones digit.' },
};
const KNOWN = { ...SHARED, ...GAP4_CODES };

export const GAP4_FAMILIES = {
  'class-4-number-name': { skill: 'place', title: 'Match five-digit numbers with their names' },
  'class-4-pair-list': { skill: 'combinations', title: 'List the possible pairs of numbers' },
};

export const DRAFT = {};
export const SOLVE = {};

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const two = n => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ''}`);
export function nameOf(n) {
  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  return [thousands ? `${two(thousands)} thousand` : '', hundreds ? `${ONES[hundreds]} hundred` : '', rest ? two(rest) : ''].filter(Boolean).join(' ');
}
const draftNumber = r => {
  const thousands = r.int(10, 99);
  const hundreds = r.pick([0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const rest = r.pick([0, r.int(1, 9), r.int(10, 99), r.int(10, 99)]);
  if (hundreds === 0 && rest === 0) throw new QuestionRetry('Too plain');
  return thousands * 1000 + hundreds * 100 + rest;
};
const swapDigits = n => {
  const digits = [...String(n)];
  const at = digits.findIndex((digit, index) => index > 0 && digit !== digits[index - 1]);
  if (at < 0) return n;
  [digits[at - 1], digits[at]] = [digits[at], digits[at - 1]];
  return Number(digits.join(''));
};
const wrongNumbers = n => {
  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  const list = [
    { value: thousands * 1000 + hundreds * 10 + rest, code: 'class-4-name-zero' },
    { value: thousands * 1000 + (hundreds ? hundreds * 10 : 100) + (rest % 10), code: 'class-4-name-zero' },
    { value: thousands * 100 + (n % 1000), code: 'class-4-name-place' },
    { value: thousands * 10000 + (n % 1000), code: 'class-4-name-place' },
    { value: swapDigits(n), code: 'class-4-name-order' },
    { value: Number(`${n % 1000 < 100 ? '' : ''}${String(n % 1000).padStart(3, '0')}${thousands}`) % 100000, code: 'class-4-name-order' },
  ];
  return list.filter(item => item.value !== n && item.value >= 1000 && item.value < 100000);
};

DRAFT['class-4-number-name'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const n = draftNumber(r);
  const mode = r.pick(level === 1 ? ['say', 'write'] : level === 2 ? ['say', 'write', 'expand'] : ['write', 'expand', 'say', 'write']);
  const wrongs = wrongNumbers(n);
  if (mode === 'say') {
    const answer = nameOf(n);
    if (answer.length > 44) throw new QuestionRetry('The name is too long for a choice.');
    const names = wrongs.map(item => ({ value: nameOf(item.value), code: item.code })).filter(item => item.value.length <= 44);
    return build({
      family, known: KNOWN, count, prompt: `Which is the number name for ${numberText(n)}?`, answer, wrongs: names,
      hint: 'Say the thousands first, then the hundreds, then the rest.',
      explanation: `${numberText(n)} has ${Math.floor(n / 1000)} thousands, so it is read ${answer}.`, givens: { mode, n },
    });
  }
  const answer = numberText(n);
  const given = mode === 'expand'
    ? `${numberText(Math.floor(n / 1000) * 1000)}${n % 1000 >= 100 ? ` + ${numberText(Math.floor((n % 1000) / 100) * 100)}` : ''}${n % 100 ? ` + ${n % 100}` : ''}`
    : nameOf(n);
  const prompt = mode === 'expand' ? `Which number is ${given}?` : `Which number is ${given}?`;
  return build({
    family, known: KNOWN, count, prompt, answer, wrongs: wrongs.map(item => ({ value: numberText(item.value), code: item.code })),
    hint: mode === 'expand' ? 'Add the parts. A part with a gap keeps its zero.' : 'Write the thousands, then the hundreds, tens and ones. Empty places hold a zero.',
    explanation: mode === 'expand' ? `Adding the parts gives ${answer}.` : `${given} is written ${answer}, with zeros in any empty place.`,
    givens: { mode, n, given },
  });
});
SOLVE['class-4-number-name'] = question => {
  const { mode, n } = question.proof.givens;
  return mode === 'say' ? nameOf(n) : numberText(n);
};

// ---------------------------------------------------------------------------
// Pairs of numbers
// ---------------------------------------------------------------------------
const factorPairs = n => {
  const pairs = [];
  for (let a = 1; a * a <= n; a++) if (n % a === 0) pairs.push([a, n / a]);
  return pairs;
};
const pairText = pairs => pairs.map(([a, b]) => `${a}\u00d7${b}`).join(', ');
const cardNumbers = cards => {
  const made = new Set();
  for (const a of cards) for (const b of cards) if (a !== b || cards.filter(card => card === a).length > 1) if (a !== 0) made.add(a * 10 + b);
  return made.size;
};
const NUMBERS = [12, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48];
const POUCHES = ['boxes', 'bags', 'baskets', 'jars'];
const THINGS = ['marbles', 'pencils', 'sweets', 'stickers', 'beads', 'coins'];

DRAFT['class-4-pair-list'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['list', 'missing', 'sum'] : level === 2 ? ['list', 'missing', 'sum', 'cards'] : ['list', 'cards', 'sum', 'missing', 'cards']);
  if (mode === 'list' || mode === 'missing') {
    const n = r.pick(NUMBERS.filter(value => factorPairs(value).length >= 3));
    const pairs = factorPairs(n);
    if (mode === 'list') {
      const answer = pairText(pairs);
      const drop = r.int(1, pairs.length - 1);
      const fake = r.pick(pairs.slice(0, -1).map(([a, b]) => [a, b + 1]).filter(([a, b]) => a * b !== n));
      const wrongs = [
        { value: pairText(pairs.filter((_, index) => index !== drop)), code: 'class-4-pair-missing' },
        { value: pairText(pairs.slice(0, -1)), code: 'class-4-pair-missing' },
        { value: pairText([...pairs.slice(0, drop), fake, ...pairs.slice(drop + 1)]), code: 'class-4-pair-extra' },
        { value: pairText([...pairs, [n / 2 - 1 || 1, 3]].filter(([a, b], index, all) => index < pairs.length || a * b !== n)), code: 'class-4-pair-extra' },
        { value: pairText(pairs.flatMap(([a, b]) => (a === b ? [[a, b]] : [[a, b], [b, a]]))), code: 'class-4-pair-order' },
      ].filter(item => item.value.length <= 44);
      return build({
        family, known: KNOWN, count, prompt: `Which list shows all the pairs of whole numbers that multiply to make ${n}?`,
        answer, wrongs, hint: 'Test 1, 2, 3 and so on. Stop when the pairs meet.',
        explanation: `The numbers that divide ${n} exactly make these pairs: ${answer}. No other pair works.`, givens: { mode, n },
      });
    }
    const gap = r.int(0, pairs.length - 1);
    const shown = pairs.filter((_, index) => index !== gap);
    const answer = pairText([pairs[gap]]);
    const near = pairs[gap][1] > 1 ? [pairs[gap][0], pairs[gap][1] + 1] : [pairs[gap][0] + 1, pairs[gap][1]];
    const wrongs = [
      { value: pairText([near]), code: 'class-4-pair-extra' }, { value: pairText([[pairs[gap][0] + 1, pairs[gap][1]]]), code: 'class-4-pair-extra' },
      { value: pairText([[pairs[gap][0], pairs[gap][1] - 1]]), code: 'class-4-pair-extra' }, { value: pairText([[pairs[gap][0] + 2, pairs[gap][1] + 1]]), code: 'class-4-pair-extra' },
      ...(shown.length ? [{ value: pairText([[shown[0][1], shown[0][0]]]), code: 'class-4-pair-order' }] : []),
    ].filter(item => !pairs.some(pair => pairText([pair]) === item.value) && !pairs.some(([a, b]) => pairText([[b, a]]) === item.value && a !== b));
    return build({
      family, known: KNOWN, count, prompt: `These pairs multiply to make ${n}: ${pairText(shown)}. Which pair is missing?`,
      answer, wrongs, hint: 'Check each choice by multiplying its two numbers.',
      explanation: `${pairs[gap][0]} \u00d7 ${pairs[gap][1]} = ${n}, so ${answer} is the missing pair.`, givens: { mode, n, shown, answer },
    });
  }
  if (mode === 'sum') {
    const total = r.pick(level === 1 ? [6, 7, 8, 9, 10] : [11, 12, 13, 14, 15, 16]);
    const answer = String(Math.floor(total / 2));
    const [pouch, thing] = [r.pick(POUCHES), r.pick(THINGS)];
    const wrongs = [
      { value: String(total - 1), code: 'class-4-pair-order' }, { value: String(Math.floor(total / 2) + 1), code: 'class-4-pair-missing' },
      { value: String(Math.floor(total / 2) - 1), code: 'class-4-pair-missing' }, { value: String(total), code: 'class-4-pair-order' }, { value: String(total + 1), code: 'class-4-pair-zero' },
    ];
    return build({
      family, known: KNOWN, count,
      prompt: `Put ${total} ${thing} into 2 ${pouch}, with at least 1 in each. The ${pouch} are the same, so 2 and ${total - 2} is the same as ${total - 2} and 2. How many different pairs?`,
      answer, wrongs, hint: 'List the pairs from the smallest first and count each pair once.',
      explanation: `List the pairs with the smaller number first. Each pair is counted once, so there are ${answer} pairs.`, givens: { mode, total },
    });
  }
  const cards = (level === 3 ? [0, ...r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2)] : r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3)).sort((a, b) => a - b);
  const answer = String(cardNumbers(cards));
  const wrongs = [
    { value: String(cards.length * (cards.length - 1)), code: 'class-4-pair-zero' },
    { value: String(cards.length), code: 'class-4-pair-missing' }, { value: String(cards.length * cards.length), code: 'class-4-pair-zero' },
    { value: String(cardNumbers(cards) + 2), code: 'class-4-pair-order' }, { value: String(cardNumbers(cards) / 2 || 1), code: 'class-4-pair-order' },
  ];
  return build({
    family, known: KNOWN, count, prompt: `You have cards ${cards.join(', ')}. Use two different cards to make a two-digit number. How many different numbers can you make?`,
    answer, wrongs, hint: cards.includes(0) ? 'A two-digit number cannot start with 0. Try each card as the tens digit.' : 'Pick a tens card, then try each of the other cards as the ones digit.',
    explanation: `Try each card as the tens digit with each other card as the ones digit. ${cards.includes(0) ? 'The card 0 cannot be the tens digit. ' : ''}That gives ${answer} numbers.`, givens: { mode, cards },
  });
});
SOLVE['class-4-pair-list'] = question => {
  const g = question.proof.givens;
  if (g.mode === 'list') return pairText(factorPairs(g.n));
  if (g.mode === 'missing') {
    const shown = new Set(g.shown.map(([a]) => a));
    return pairText(factorPairs(g.n).filter(([a]) => !shown.has(a)));
  }
  if (g.mode === 'sum') return String(Math.floor(g.total / 2));
  return String(cardNumbers(g.cards));
};
