// Number, operation, fraction, geometry and data families modelled on the printed SOF IMO Class 4 papers.
import { QuestionRetry } from './bank-shared.mjs';
import { NAMES, gcd, mixedText, pic, plural, pronoun, sumOf } from './bank3-class-4-real-core.mjs';

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export function numberWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '');
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${numberWords(n % 100)}` : ''}`;
  return `${numberWords(Math.floor(n / 1000))} thousand${n % 1000 ? ` ${numberWords(n % 1000)}` : ''}`;
}
function roman(number) {
  let result = '';
  for (const [value, letters] of [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) {
    while (number >= value) { result += letters; number -= value; }
  }
  return result;
}
const digitsOf = n => [...String(n)].map(Number);
const factorsOf = n => Array.from({ length: n }, (_, i) => i + 1).filter(d => n % d === 0);
const wrongs = (values, code) => values.map(value => [value, code]);
const an = word => /^[aeiou]/i.test(word) ? 'an' : 'a';
const cap = text => text[0].toUpperCase() + text.slice(1);

// ---- digit-clue puzzles -------------------------------------------------------------------------------------------
const POSITIONS = {
  3: ['hundreds', 'tens', 'ones'],
  4: ['thousands', 'hundreds', 'tens', 'ones'],
};
function clueHolds(n, clue, d = digitsOf(n)) {
  if (clue.t === 'parity') return n % 2 === (clue.odd ? 1 : 0);
  if (clue.t === 'twice') return d[clue.i] === 2 * d[clue.j];
  if (clue.t === 'plus') return d[clue.i] === d[clue.j] + clue.k;
  if (clue.t === 'sum') return sumOf(d) === clue.value;
  if (clue.t === 'digit') return d[clue.i] === clue.value;
  if (clue.t === 'multiple') return n % clue.k === 0;
  return new Set(d).size === d.length;
}
function clueText(clue, digits) {
  const pos = POSITIONS[digits];
  if (clue.t === 'parity') return clue.odd ? 'I am odd.' : 'I am even.';
  if (clue.t === 'twice') return `My ${pos[clue.i]} digit is twice my ${pos[clue.j]} digit.`;
  if (clue.t === 'plus') return `My ${pos[clue.i]} digit is ${clue.k} more than my ${pos[clue.j]} digit.`;
  if (clue.t === 'sum') return `My digits add up to ${clue.value}.`;
  if (clue.t === 'digit') return `My ${pos[clue.i]} digit is ${clue.value}.`;
  if (clue.t === 'multiple') return `I am a multiple of ${clue.k}.`;
  return 'All my digits are different.';
}
const UNIVERSE = {};
const universe = digits => UNIVERSE[digits] ??= Array.from({ length: 9 * 10 ** (digits - 1) }, (_, i) => ({ n: 10 ** (digits - 1) + i, d: digitsOf(10 ** (digits - 1) + i) }));
function clueMatches(digits, clues) {
  return universe(digits).filter(({ n, d }) => clues.every(clue => clueHolds(n, clue, d))).map(entry => entry.n);
}
function trueClues(n, digits) {
  const d = digitsOf(n), pool = [{ t: 'parity', odd: n % 2 === 1 }, { t: 'sum', value: sumOf(d) }, { t: 'distinct' }];
  if (new Set(d).size !== d.length) pool.pop();
  for (const k of [3, 4, 5, 6, 9]) if (n % k === 0) pool.push({ t: 'multiple', k });
  for (let i = 0; i < digits; i++) {
    pool.push({ t: 'digit', i, value: d[i] });
    for (let j = 0; j < digits; j++) if (i !== j) {
      if (d[i] === 2 * d[j] && d[j] > 0) pool.push({ t: 'twice', i, j });
      if (d[i] - d[j] >= 2 && d[i] - d[j] <= 4) pool.push({ t: 'plus', i, j, k: d[i] - d[j] });
    }
  }
  return pool;
}

// ---- number comparison statements --------------------------------------------------------------------------------
function exprText(e) {
  if (e.k === 'roman') return `${roman(e.a)} ${e.op} ${roman(e.b)}`;
  return e.v.join(` ${e.op} `);
}
function exprValue(e) {
  if (e.k === 'roman') return e.op === '+' ? e.a + e.b : e.a - e.b;
  if (e.op === '×') return e.v.reduce((a, b) => a * b, 1);
  if (e.op === '+') return sumOf(e.v);
  return e.v.reduce((a, b) => a - b);
}
const symbolFor = (a, b) => a < b ? '<' : a > b ? '>' : '=';

function randomExpr(level, r) {
  const pick = r.int(0, level === 1 ? 1 : 3);
  if (pick === 0) { const a = r.int(20, 99), b = r.int(10, 60); return { k: 'sum', op: '+', v: [a, b] }; }
  if (pick === 1) { const a = r.int(30, 99), b = r.int(3, 9); return { k: 'sum', op: '×', v: [a, b] }; }
  if (pick === 2) { const a = r.int(20, 99), b = r.int(5, 19); return { k: 'roman', op: r.pick(['+', '-']), a: a + b, b: r.int(5, 19) }; }
  return { k: 'sum', op: '×', v: [r.int(110, 999), 0] };
}

export const MATHS_SPECS = {
  'class-4-place-value-gap': {
    gen(level, r) {
      const mode = r.pick(['gap', 'gap', 'twice', 'total']);
      const length = level === 1 ? 4 : 5;
      const digits = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, length);
      if (mode === 'twice') {
        const [i, j] = r.shuffle([...Array(length).keys()]).slice(0, 2);
        digits[j] = digits[i];
        return { mode, n: Number(digits.join('')), d: digits[i] };
      }
      const d = r.pick(digits.slice(0, length - 1));
      return { mode, n: Number(digits.join('')), d };
    },
    calc(g) {
      const text = String(g.n), places = [...text].map((c, i) => [Number(c), 10 ** (text.length - 1 - i)]).filter(([digit]) => digit === g.d);
      const [d] = [g.d];
      if (g.mode === 'twice') {
        if (places.length !== 2) throw new Error('The digit must appear twice.');
        const [high, low] = places.map(([, place]) => d * place);
        return {
          prompt: `What is the difference between the place values of the two ${d}s in ${g.n}?`,
          answer: high - low,
          wrongs: wrongs([high, high + low, d * 9, high - d, low], 'face-value'),
          hint: 'Write the value of each digit by its place, then subtract.',
          explanation: `The place values are ${high} and ${low}. ${high} - ${low} = ${high - low}.`,
        };
      }
      if (places.length !== 1) throw new Error('The digit must appear once.');
      const place = places[0][1], value = d * place;
      const sumMode = g.mode === 'total';
      return {
        prompt: `What is the ${sumMode ? 'sum' : 'difference'} of the place value and the face value of ${d} in ${g.n}?`,
        answer: sumMode ? value + d : value - d,
        wrongs: wrongs(sumMode ? [value, d, value - d, value * 10 + d, value / 10 + d] : [value, d, value + d, d * place * 10 - d, d * place / 10 - d], 'face-value'),
        hint: 'The face value is the digit itself. The place value depends on where it sits.',
        explanation: `${d} is worth ${value} in ${g.n}. Its face value is ${d}. ${sumMode ? `${value} + ${d} = ${value + d}` : `${value} - ${d} = ${value - d}`}.`,
      };
    },
  },

  'class-4-number-clues': {
    gen(level, r) {
      const digits = level === 1 ? 3 : 4;
      for (let attempt = 0; attempt < 8; attempt++) {
        const n = r.int(10 ** (digits - 1), 10 ** digits - 1);
        const clues = [];
        let alive = universe(digits);
        for (const clue of r.shuffle(trueClues(n, digits))) {
          if (clues.some(other => other.t === clue.t && clue.t !== 'digit' && clue.t !== 'plus' && clue.t !== 'multiple')) continue;
          clues.push(clue);
          alive = alive.filter(entry => clueHolds(entry.n, clue, entry.d));
          if (clues.length > 4) break;
          if (alive.length === 1) {
            if (clues.length >= (level === 1 ? 2 : 3)) return { digits, clues };
            break;
          }
        }
      }
      throw new QuestionRetry('No short clue set found.');
    },
    calc(g) {
      const found = clueMatches(g.digits, g.clues);
      if (found.length !== 1) throw new Error('The clues must name one number.');
      const [answer] = found;
      const near = [];
      g.clues.forEach((clue, skip) => {
        const others = g.clues.filter((_, i) => i !== skip);
        const pool = clueMatches(g.digits, others).filter(n => n !== answer);
        pool.sort((a, b) => Math.abs(a - answer) - Math.abs(b - answer));
        near.push(...pool.slice(0, 2));
      });
      return {
        prompt: `I am a ${g.digits}-digit number. ${g.clues.map(clue => clueText(clue, g.digits)).join(' ')} Which number am I?`,
        answer,
        wrongs: wrongs(near, 'ignored-condition'),
        hint: 'Test each choice against every clue. A choice that breaks one clue is out.',
        explanation: `Only ${answer} follows every clue. Each other choice breaks at least one clue.`,
      };
    },
  },

  'class-4-compare-statements': {
    gen(level, r) {
      const statements = [];
      for (let i = 0; i < 4; i++) {
        let left, right;
        do { left = randomExpr(level, r); right = randomExpr(level, r); } while (left.k !== right.k && r.int(0, 2) > 0);
        statements.push({ left, right, sym: '' });
      }
      const truth = statements.map(s => symbolFor(exprValue(s.left), exprValue(s.right)));
      statements.forEach((s, i) => { s.sym = i === 0 ? truth[i] : r.pick(['<', '>', '='].filter(sym => sym !== truth[i])); });
      return { statements: r.shuffle(statements), variant: r.int(0, 5) };
    },
    calc(g) {
      const text = s => `${exprText(s.left)} ${s.sym} ${exprText(s.right)}`;
      const good = g.statements.filter(s => symbolFor(exprValue(s.left), exprValue(s.right)) === s.sym);
      if (good.length !== 1) throw new QuestionRetry('Exactly one comparison must be true.');
      return {
        prompt: ['Which comparison is true?', 'Choose the correct comparison.', 'Which statement is correct?', 'Only one of these comparisons is right. Which one?', 'Which of these statements is true?', 'Pick the statement that is true.'][g.variant],
        answer: text(good[0]),
        wrongs: g.statements.filter(s => s !== good[0]).map(s => [text(s), 'wrong-operation']),
        hint: 'Work out both sides of every statement before choosing a symbol.',
        explanation: `${exprText(good[0].left)} = ${exprValue(good[0].left)} and ${exprText(good[0].right)} = ${exprValue(good[0].right)}, so ${text(good[0])} is true.`,
      };
    },
  },

  'class-4-order-numbers': {
    gen(level, r) {
      const length = level === 1 ? 4 : 5;
      const base = r.shuffle([1, 2, 5, 6, 7, 8, 9, 0]).slice(0, length - 1);
      base.push(base[r.int(0, length - 2)]);
      const numbers = new Set();
      for (let i = 0; i < 60 && numbers.size < 5; i++) {
        const digits = r.shuffle(base);
        if (digits[0] !== 0) numbers.add(Number(digits.join('')));
      }
      if (numbers.size < 5) throw new QuestionRetry('Too few arrangements.');
      return { numbers: [...numbers], order: r.pick(['descending', 'ascending']), k: r.int(1, 5) };
    },
    calc(g) {
      const sorted = [...g.numbers].sort((a, b) => g.order === 'ascending' ? a - b : b - a);
      const words = ['first', 'second', 'third', 'fourth', 'fifth'];
      return {
        prompt: `Arrange ${g.numbers.join(', ')} in ${g.order} order. Which number comes ${words[g.k - 1]}?`,
        answer: sorted[g.k - 1],
        wrongs: g.numbers.filter(n => n !== sorted[g.k - 1]).map(n => [n, 'ignored-zero']),
        hint: 'Compare the leading digits, then the next place, one place at a time.',
        explanation: `In ${g.order} order: ${sorted.join(', ')}. The ${words[g.k - 1]} number is ${sorted[g.k - 1]}.`,
      };
    },
  },

  'class-4-factor-facts': {
    gen(level, r) {
      const mode = r.pick(['common', 'common', 'count', 'hcf']);
      if (mode === 'count') return { mode, a: r.int(level === 1 ? 12 : 24, level === 3 ? 100 : 60) };
      for (;;) {
        const g = r.int(2, level === 1 ? 6 : 12), x = r.int(2, 8), y = r.int(2, 8);
        if (gcd(x, y) === 1 && x !== y) return { mode, a: g * x * (level === 3 ? 2 : 1), b: g * y * (level === 3 ? 2 : 1) };
      }
    },
    calc(g) {
      if (g.mode === 'count') {
        const count = factorsOf(g.a).length;
        return {
          prompt: `How many factors does ${g.a} have?`, answer: count,
          wrongs: wrongs([count + 1, count - 1, count + 2, Math.max(2, count - 2), Math.ceil(count / 2)], 'factor-multiple'),
          hint: 'List the factor pairs in order and stop when they meet.',
          explanation: `Factors of ${g.a}: ${factorsOf(g.a).join(', ')}. That is ${count} factors.`,
        };
      }
      const common = factorsOf(gcd(g.a, g.b));
      const g2 = gcd(g.a, g.b);
      if (g.mode === 'hcf') {
        return {
          prompt: `What is the highest common factor of ${g.a} and ${g.b}?`, answer: g2,
          wrongs: wrongs([g.a * g.b / g2, g2 * 2, Math.max(1, g2 - 1), common.length, g.a - g.b], 'factor-multiple'),
          hint: 'List factors of both numbers and choose the biggest one they share.',
          explanation: `Common factors: ${common.join(', ')}. The highest is ${g2}.`,
        };
      }
      return {
        prompt: `${g.a} and ${g.b} have how many common factors?`, answer: common.length,
        wrongs: wrongs([g2, common.length + 1, common.length + 2, Math.max(1, common.length - 1), factorsOf(g.a).length], 'factor-multiple'),
        hint: 'A common factor divides both numbers exactly. List and count them.',
        explanation: `Both numbers divide by ${common.join(', ')}. That is ${common.length} common factors.`,
      };
    },
  },

  'class-4-multiple-facts': {
    gen(level, r) {
      const mode = r.pick(['smallest', 'largest', 'between', 'lcm']);
      if (mode === 'smallest') return { mode, k: r.int(level === 1 ? 6 : 11, level === 3 ? 29 : 19), digits: r.pick([3, 4]) };
      if (mode === 'largest') return { mode, k: r.int(level === 1 ? 6 : 11, level === 3 ? 29 : 19), digits: r.pick([3, 4]) };
      if (mode === 'between') { const k = r.int(4, 12); const lo = r.int(10, 90); return { mode, k, lo, hi: lo + r.int(60, 200) }; }
      return { mode, a: r.pick([4, 6, 8, 9, 10, 12]), b: r.pick([5, 6, 7, 9, 15]), digits: 0 };
    },
    calc(g) {
      if (g.mode === 'smallest' || g.mode === 'largest') {
        const low = 10 ** (g.digits - 1), high = 10 ** g.digits - 1;
        const answer = g.mode === 'smallest' ? Math.ceil(low / g.k) * g.k : Math.floor(high / g.k) * g.k;
        const edge = g.mode === 'smallest' ? low : high;
        if (answer === edge) throw new QuestionRetry('The edge number is already a multiple.');
        return {
          prompt: `What is the ${g.mode} ${g.digits}-digit multiple of ${g.k}?`, answer,
          wrongs: wrongs([edge, g.mode === 'smallest' ? answer + g.k : answer - g.k, g.mode === 'smallest' ? answer - g.k : answer + g.k, g.mode === 'smallest' ? edge + 1 : edge - 1], 'ignored-condition'),
          hint: `Divide ${edge} by ${g.k} and use the quotient and remainder.`,
          explanation: `${edge} ÷ ${g.k} leaves ${edge % g.k}. The ${g.mode} ${g.digits}-digit multiple of ${g.k} is ${answer}.`,
        };
      }
      if (g.mode === 'between') {
        const count = Math.floor(g.hi / g.k) - Math.floor((g.lo - 1) / g.k);
        return {
          prompt: `How many multiples of ${g.k} are there from ${g.lo} to ${g.hi}, counting both ends?`, answer: count,
          wrongs: wrongs([count + 1, count - 1, count + 2, Math.floor((g.hi - g.lo) / g.k)], 'counted-endpoints'),
          hint: 'Count the multiples up to the larger number, then remove those below the smaller.',
          explanation: `Multiples up to ${g.hi}: ${Math.floor(g.hi / g.k)}. Those below ${g.lo}: ${Math.floor((g.lo - 1) / g.k)}. The difference is ${count}.`,
        };
      }
      let lcm = g.a;
      while (lcm % g.b) lcm += g.a;
      return {
        prompt: `What is the smallest number that both ${g.a} and ${g.b} divide exactly?`, answer: lcm,
        wrongs: wrongs([g.a * g.b === lcm ? lcm + g.a : g.a * g.b, lcm * 2, lcm + g.a, gcd(g.a, g.b) || 1, lcm - g.a], 'factor-multiple'),
        hint: 'List multiples of the larger number until the other divides one exactly.',
        explanation: `The first multiple of ${Math.max(g.a, g.b)} that ${Math.min(g.a, g.b)} also divides is ${lcm}.`,
      };
    },
  },

  'class-4-words-place': {
    gen(level, r) {
      if (r.int(0, 1)) {
        const a = r.int(2200, 9899), b = r.int(1100, a - 400);
        return { mode: 'diff', a, b };
      }
      const k = r.int(3, 9);
      const base = r.int(Math.ceil(1000 / k), Math.min(999, Math.floor(9999 / k)));
      return { mode: 'fill', base, k };
    },
    calc(g) {
      if (g.mode === 'diff') {
        const answer = g.a - g.b;
        return {
          prompt: `Find the difference between ${numberWords(g.a)} and ${numberWords(g.b)}.`, answer,
          wrongs: wrongs([g.a + g.b, answer + 100, answer - 100, answer + 1000, answer - 10], 'ignored-zero'),
          hint: 'Write both numbers in digits first, then subtract place by place.',
          explanation: `${g.a} - ${g.b} = ${answer}.`,
        };
      }
      const product = g.base * g.k, d = digitsOf(product);
      if (d.length !== 4) throw new QuestionRetry('The product needs four digits.');
      const tens = d[2];
      return {
        prompt: `${g.base} × ${g.k} = ${plural(d[0], 'thousand')} ${plural(d[1], 'hundred')} ? tens ${plural(d[3], 'one')}. What is the missing number?`, answer: tens,
        wrongs: wrongs([(tens + 1) % 10, (tens + 9) % 10, d[1], d[3], (tens + 5) % 10, d[0]], 'place-shift'),
        hint: 'Multiply to find the whole product, then read the digit in the tens place.',
        explanation: `${g.base} × ${g.k} = ${product}. The digit in the tens place is ${tens}.`,
      };
    },
  },

  'class-4-multiply-story': {
    gen(level, r) {
      const a = level === 1 ? r.int(12, 49) : level === 2 ? r.int(31, 99) : r.int(120, 399);
      const b = level === 1 ? r.int(3, 9) : level === 2 ? r.int(12, 59) : r.int(11, 45);
      return { a, b, scene: r.int(0, 3) };
    },
    calc(g) {
      const scenes = [
        ['rows', 'trees in each row', 'trees'], ['classrooms', 'desks in each classroom', 'desks'],
        ['boxes', 'pencils in each box', 'pencils'], ['shelves', 'books on each shelf', 'books'],
      ];
      const [unit, each, total] = scenes[g.scene];
      const answer = g.a * g.b, tensPart = g.b % 10 ? g.a * (g.b % 10) + g.a * Math.floor(g.b / 10) : g.a * g.b - g.a;
      return {
        prompt: `A school has ${g.a} ${unit} with ${g.b} ${each}. How many ${total} are there altogether?`, answer,
        wrongs: wrongs([g.b > 10 ? tensPart : answer + 10, answer + 10 * g.b, answer - 10 * Math.min(g.a, g.b), g.a + g.b, answer + g.a], 'place-shift'),
        hint: 'Multiply by the ones, then by the tens, and add the two partial products.',
        explanation: `${g.a} × ${g.b} = ${answer}.`,
      };
    },
  },

  'class-4-divide-pack': {
    gen(level, r) {
      const bag = r.int(3, level === 1 ? 6 : 9), per = bag * r.int(level === 1 ? 4 : 12, level === 3 ? 40 : 28);
      const exact = level === 1 || r.int(0, 2) > 0;
      const boxes = r.int(2, 9);
      return { boxes, per: exact ? per : per + r.int(1, bag - 1), bag, exact, item: r.pick(['sweets', 'marbles', 'stickers', 'beads']) };
    },
    calc(g) {
      const total = g.boxes * g.per, full = Math.floor(total / g.bag), left = total % g.bag;
      const answer = g.exact ? full : full + (left ? 1 : 0);
      if (!g.exact && !left) throw new QuestionRetry('Choose a remainder.');
      return {
        prompt: `${g.boxes} boxes have ${g.per} ${g.item} each. The ${g.item} are packed in bags of ${g.bag}. How many bags ${g.exact ? 'are filled' : 'are needed to pack all of them'}?`, answer,
        wrongs: wrongs(g.exact ? [g.per / g.bag, total, full + 1, full - 1, g.boxes * g.bag] : [full, full + 2, left, total, full - 1], g.exact ? 'missing-step' : 'remainder-rule'),
        hint: g.exact ? 'First find all the items, then share them into bags.' : 'A few left over still need one more bag.',
        explanation: `${g.boxes} × ${g.per} = ${total}. ${total} ÷ ${g.bag} = ${full}${left ? ` remainder ${left}, so one more bag is needed: ${answer}` : ''}.`,
      };
    },
  },

  'class-4-story-total': {
    gen(level, r) {
      return {
        mode: r.pick(['change', 'together', 'change']), a: r.int(level === 1 ? 14 : 31, level === 3 ? 240 : 90),
        b: r.int(5, level === 1 ? 20 : 60), c: r.int(5, level === 1 ? 12 : 29), who: r.pick(NAMES), other: r.pick(NAMES), thing: r.int(0, 3),
      };
    },
    calc(g) {
      const thing = ['comics', 'stickers', 'marbles', 'stamps'][g.thing];
      if (g.other === g.who) throw new QuestionRetry('Use two names.');
      if (g.mode === 'together') {
        const second = g.a - g.c;
        return {
          prompt: `${g.who} has ${g.a} ${thing}. ${g.other} has ${g.c} fewer ${thing}. How many ${thing} do they have together?`,
          answer: g.a + second,
          wrongs: wrongs([g.a, second, g.a + g.c, g.a - g.c - g.c, g.a * 2], 'missing-step'),
          hint: 'Find the second amount first, then add both amounts.',
          explanation: `${g.other} has ${g.a} - ${g.c} = ${second}. Together: ${g.a} + ${second} = ${g.a + second}.`,
        };
      }
      const answer = g.a + g.b - g.c;
      return {
        prompt: `${g.who} had ${g.a} ${thing}. ${pronoun(g.who).subject} bought ${g.b} more and gave ${g.c} to ${g.other}. How many ${thing} does ${g.who} have now?`, answer,
        wrongs: wrongs([g.a + g.b + g.c, g.a - g.b - g.c, g.a + g.b, g.a - g.c, answer + 10], 'wrong-operation'),
        hint: 'Add what was bought, then take away what was given.',
        explanation: `${g.a} + ${g.b} = ${g.a + g.b}. Then ${g.a + g.b} - ${g.c} = ${answer}.`,
      };
    },
  },

  'class-4-sum-diff-pieces': {
    gen(level, r) {
      const small = r.int(level === 1 ? 10 : 15, level === 3 ? 400 : 120), diff = r.int(level === 1 ? 10 : 20, level === 3 ? 600 : 200);
      return { small, diff, scene: r.int(0, 2) };
    },
    calc(g) {
      const total = 2 * g.small + g.diff;
      const scenes = [['ribbon', 'cm', 'is cut into two pieces', 'longer', 'shorter piece'], ['rope', 'cm', 'is cut into two pieces', 'longer', 'shorter piece'], ['stick', 'cm', 'is broken into two parts', 'longer', 'shorter part']];
      const [thing, unit, cut, comp, ask] = scenes[g.scene];
      return {
        prompt: `A ${thing} ${total} ${unit} long ${cut}. One is ${g.diff} ${unit} ${comp} than the other. How long is the ${ask}?`, answer: g.small,
        wrongs: wrongs([total - g.diff, total / 2, g.small + g.diff, total - 2 * g.diff, (total + g.diff) / 2 + g.small], 'missing-step'),
        hint: 'Take away the extra length first. The rest splits into two equal pieces.',
        explanation: `${total} - ${g.diff} = ${total - g.diff}. Half of that is ${g.small} ${unit}, the shorter ${ask.split(' ')[1]}.`,
      };
    },
  },

  'class-4-letter-multiplication': {
    gen(level, r) {
      const combos = [];
      for (let a = 1; a <= 9; a++) for (let k = 3; k <= 9; k++) {
        const v = 111 * a * k, d = digitsOf(v);
        if (d.length === 4 && d[1] === d[2] && d[3] === a && d[1] !== a && d[0] !== d[1]) combos.push({ a, k, lead: d[0] });
      }
      return { ...r.pick(combos), ask: r.pick(['b', 'sum', 'product', 'lead']) };
    },
    calc(g) {
      const hits = [];
      for (let a = 1; a <= 9; a++) for (let b = 0; b <= 9; b++) if (b !== a && 111 * a * g.k === g.lead * 1000 + b * 110 + a) hits.push({ a, b });
      if (hits.length !== 1) throw new Error('The puzzle needs exactly one solution.');
      const { a, b } = hits[0];
      const answer = { b, sum: a + b, product: a * b, lead: a + g.lead }[g.ask];
      const text = { b: 'What is the value of B?', sum: 'What is A + B?', product: 'What is A × B?', lead: `What is A + ${g.lead}?` }[g.ask];
      return {
        prompt: `AAA × ${g.k} = ${g.lead}BBA, where A and B are different digits. ${text}`, answer,
        wrongs: wrongs([answer + 1, Math.max(0, answer - 1), answer + 2, a + b, a * b, b + 1, a].filter(v => v !== answer), 'ignored-condition'),
        hint: 'The ones digit of the product must match A. Test the digits that can work.',
        explanation: `A = ${a} works because ${a}${a}${a} × ${g.k} = ${111 * a * g.k}. That makes B = ${b}.`,
      };
    },
  },

  'class-4-long-division': {
    gen(level, r) {
      const divisor = level === 1 ? r.int(3, 9) : level === 2 ? r.int(6, 19) : r.int(21, 49);
      const quotient = r.int(level === 1 ? 40 : 90, level === 3 ? 400 : 700), remainder = r.int(1, divisor - 1);
      return { divisor, quotient, remainder, mode: r.pick(['quotient', 'remainder', 'dividend']) };
    },
    calc(g) {
      const dividend = g.divisor * g.quotient + g.remainder;
      if (g.mode === 'dividend') {
        return {
          prompt: `A number is divided by ${g.divisor}. The quotient is ${g.quotient} and the remainder is ${g.remainder}. What is the number?`, answer: dividend,
          wrongs: wrongs([g.divisor * g.quotient, dividend + g.divisor, dividend - g.remainder * 2, g.quotient + g.remainder + g.divisor, dividend + 10], 'reversed-operation'),
          hint: 'Multiply the divisor and quotient, then add the remainder.',
          explanation: `${g.divisor} × ${g.quotient} = ${g.divisor * g.quotient}. Add ${g.remainder}: ${dividend}.`,
        };
      }
      const ask = g.mode === 'quotient' ? g.quotient : g.remainder;
      return {
        prompt: `What is the ${g.mode} when ${dividend} is divided by ${g.divisor}?`, answer: ask,
        wrongs: wrongs(g.mode === 'quotient' ? [g.quotient + 1, g.quotient - 1, g.quotient * 10, g.quotient + g.remainder, g.quotient + 10] : [g.divisor - g.remainder, g.remainder + 1, Math.max(0, g.remainder - 1), g.quotient % g.divisor, g.divisor + g.remainder], 'remainder-rule'),
        hint: 'Divide step by step, then check with multiplication.',
        explanation: `${dividend} = ${g.divisor} × ${g.quotient} + ${g.remainder}. The ${g.mode} is ${ask}.`,
      };
    },
  },

  'class-4-two-prices': {
    gen(level, r) {
      const trio = level === 3 || (level === 2 && r.int(0, 2) === 0);
      const unit = r.pick(['Rs', 'g']);
      const x = r.int(2, 14) * (unit === 'Rs' ? 10 : 25), y = r.int(2, 14) * (unit === 'Rs' ? 10 : 25), z = r.int(2, 14) * (unit === 'Rs' ? 10 : 25);
      return { trio, unit, x, y, z, items: r.shuffle(ITEMS[unit]).slice(0, 3), ask: r.pick(['two', 'one']) };
    },
    calc(g) {
      const verb = g.unit === 'Rs' ? 'cost' : 'weigh';
      const val = n => g.unit === 'Rs' ? `Rs ${n}` : `${n} g`;
      const [p, q, s] = g.items;
      if (!g.trio) {
        const sum = g.x + g.y, twice = 2 * g.x;
        const answer = g.ask === 'two' ? 2 * g.y : g.y;
        return {
            prompt: `${cap(an(p[0]))} ${p[0]} and ${an(q[0])} ${q[0]} ${verb} ${val(sum)}. Two ${p[1]} ${verb} ${val(twice)}. ${g.ask === 'two' ? `What do two ${q[1]} ${verb}?` : `What does one ${q[0]} ${verb}?`}`,
          answer,
            wrongs: wrongs([g.ask === 'two' ? g.y : 2 * g.y, sum - twice, sum, twice, answer + (g.unit === 'Rs' ? 20 : 50), answer - (g.unit === 'Rs' ? 10 : 25)].filter(v => v > 0 && v !== answer), 'missing-step'),
          hint: `Half of the two-${p[0]} total gives one ${p[0]}. Then take it from the pair total.`,
          explanation: `One ${p[0]} ${verb} ${twice / 2}. One ${q[0]} ${verb} ${sum} - ${twice / 2} = ${g.y}.${g.ask === 'two' ? ` Two ${q[1]} ${verb} ${2 * g.y}.` : ''}`,
        };
      }
      const a = g.x + g.y, b = g.y + g.z, c = g.x + g.z, total = g.x + g.y + g.z;
      return {
        prompt: `${cap(an(p[0]))} ${p[0]} and ${an(q[0])} ${q[0]} ${verb} ${val(a)}. ${cap(an(q[0]))} ${q[0]} and ${an(s[0])} ${s[0]} ${verb} ${val(b)}. ${cap(an(p[0]))} ${p[0]} and ${an(s[0])} ${s[0]} ${verb} ${val(c)}. What do all three ${verb}?`,
        answer: total,
        wrongs: wrongs([a + b + c, total + 10 * (g.unit === 'Rs' ? 1 : 5), total - 10 * (g.unit === 'Rs' ? 1 : 5), a + b, total * 2 - g.y], 'missing-step'),
        hint: 'Add the three pair totals. Each item is counted twice.',
        explanation: `${a} + ${b} + ${c} = ${a + b + c}. That counts each item twice, so all three ${verb} ${total}.`,
      };
    },
  },

  'class-4-shaded-grid': {
    gen(level, r) {
      const layouts = level === 1 ? [[1, 5], [1, 6], [1, 7], [1, 8], [2, 3], [2, 4]] : [[1, 7], [2, 4], [2, 5], [2, 6], [3, 3], [3, 4], [3, 5], [1, 9]];
      const [rows, cols] = r.pick(layouts), total = rows * cols;
      const shadedCount = r.pick([...Array(total - 1).keys()].map(i => i + 1).filter(n => gcd(n, total) === 1 && (total < 6 || n > 1)));
      return { who: r.pick(NAMES), thing: r.pick(['flag', 'mat', 'window', 'chocolate bar', 'garden plan', 'tile pattern']), rows, cols, shaded: r.shuffle([...Array(total).keys()]).slice(0, shadedCount).sort((a, b) => a - b), ask: level === 1 ? 'shaded' : r.pick(['shaded', 'unshaded']) };
    },
    calc(g) {
      const total = g.rows * g.cols, s = g.shaded.length, u = total - s;
      const ask = g.ask === 'shaded' ? s : u;
      return {
        prompt: `${g.who} shades parts of the ${g.thing} shown. What fraction of the ${g.thing} is ${g.ask === 'shaded' ? 'shaded' : 'not shaded'}?`, answer: `${ask}/${total}`,
        wrongs: [[`${g.ask === 'shaded' ? u : s}/${total}`, 'fraction-complement'], [`${ask}/${total - ask}`, 'whole-parts'], [`${total - ask === ask ? ask + 1 : total - ask}/${s}`, 'whole-parts'], [`${ask}/${total + 1}`, 'whole-parts'], [`${ask + 1}/${total}`, 'whole-parts']],
        hint: 'The bottom number counts all equal parts. The top number counts the parts asked about.',
        explanation: `The figure has ${total} equal parts: ${s} shaded and ${u} not shaded. The fraction is ${ask}/${total}.`,
        visual: pic('shaded-grid', { rows: g.rows, cols: g.cols, shaded: g.shaded }, `A figure of ${total} equal parts in ${g.rows} ${g.rows === 1 ? 'row' : 'rows'} of ${g.cols}. ${plural(s, 'part')} ${s === 1 ? 'is' : 'are'} shaded and ${plural(u, 'part')} ${u === 1 ? 'is' : 'are'} white.`),
      };
    },
  },

  'class-4-fraction-claims': {
    gen(level, r) {
      const pairs = [];
      for (let i = 0; i < 4; i++) {
        const kind = r.int(0, 2);
        let a, b;
        if (kind === 0) { const n = r.int(1, 5), d1 = r.int(6, 14), d2 = r.int(d1 + 1, 20); a = [n, d1]; b = [n, d2]; }
        else if (kind === 1) { const d = r.int(5, 13), n1 = r.int(1, d - 2); a = [n1, d]; b = [n1 + r.int(1, 2), d]; }
        else { a = [r.int(1, 5), r.int(6, 12)]; b = [r.int(1, 5), r.int(6, 12)]; }
        pairs.push({ a, b, sym: '' });
      }
      const truth = pairs.map(p => symbolFor(p.a[0] * p.b[1], p.b[0] * p.a[1]));
      pairs.forEach((p, i) => { p.sym = i === 0 ? truth[i] : r.pick(['<', '>', '='].filter(sym => sym !== truth[i])); });
      return { pairs: r.shuffle(pairs), variant: r.int(0, 3) };
    },
    calc(g) {
      const text = p => `${p.a[0]}/${p.a[1]} ${p.sym} ${p.b[0]}/${p.b[1]}`;
      const good = g.pairs.filter(p => symbolFor(p.a[0] * p.b[1], p.b[0] * p.a[1]) === p.sym);
      if (good.length !== 1) throw new QuestionRetry('Exactly one comparison must be true.');
      const p = good[0];
      return {
        prompt: ['Which fraction comparison is true?', 'Choose the correct comparison of fractions.', 'Only one of these fraction statements is true. Which one?', 'Pick the true statement about these fractions.'][g.variant],
        answer: text(p),
        wrongs: g.pairs.filter(q => q !== p).map(q => [text(q), 'fraction-denominator']),
        hint: 'Equal numerators: more parts means smaller parts. Otherwise use common denominators.',
        explanation: `Cross-multiply: ${p.a[0]} × ${p.b[1]} = ${p.a[0] * p.b[1]} and ${p.b[0]} × ${p.a[1]} = ${p.b[0] * p.a[1]}, so ${text(p)} is true.`,
      };
    },
  },

  'class-4-fraction-quantity': {
    gen(level, r) {
      const d = r.int(3, level === 1 ? 6 : 9), n = r.int(1, d - 1);
      return { d, n, unit: r.int(level === 1 ? 2 : 3, level === 3 ? 14 : 9), mode: level === 1 ? r.pick(['part', 'rest']) : r.pick(['rest', 'part', 'whole', 'spent']), scene: r.int(0, 2) };
    },
    calc(g) {
      const whole = g.d * g.unit, part = g.n * g.unit, rest = whole - part;
      const scenes = [['people', 'children', 'adults'], ['students', 'girls', 'boys'], ['birds', 'crows', 'sparrows']];
      const [group, one, other] = scenes[g.scene];
      if (g.mode === 'whole') {
        return {
          prompt: `${g.n}/${g.d} of a number is ${part}. What is the number?`, answer: whole,
          wrongs: wrongs([part * g.n, part + g.d, rest, part * g.d, whole + g.unit], 'whole-parts'),
          hint: 'First find what one equal part is worth, then count all the parts.',
          explanation: `${g.n} of the ${g.d} equal parts make ${part}, so one part is ${g.unit}. All ${g.d} parts make ${whole}.`,
        };
      }
      if (g.mode === 'spent') {
        const price = whole * 10;
        return {
          prompt: `Meera had Rs ${price}. She spent ${g.n}/${g.d} of it. How much money is left?`, answer: `Rs ${rest * 10}`,
          wrongs: [[`Rs ${part * 10}`, 'fraction-complement'], [`Rs ${price - g.n * 10}`, 'wrong-operation'], [`Rs ${rest * 10 + 10 * g.unit}`, 'whole-parts'], [`Rs ${Math.max(10, part * 10 - g.unit * 10)}`, 'whole-parts']],
          hint: `Find one of the ${g.d} equal parts first. The money left is what was not spent.`,
          explanation: `One part is Rs ${g.unit * 10}. Spent: ${g.n} of ${g.d} parts = Rs ${part * 10}. Left: Rs ${price} - Rs ${part * 10} = Rs ${rest * 10}.`,
        };
      }
      const asks = g.mode === 'rest';
      return {
        prompt: `${g.n}/${g.d} of ${whole} ${group} are ${one}. ${asks ? `How many ${group} are ${other}?` : `How many ${one} are there?`}`,
        answer: asks ? rest : part,
        wrongs: wrongs(asks ? [part, whole / g.d, rest + g.unit, part + g.n, whole - g.n] : [rest, g.unit, part + g.unit, whole - g.d, part - g.unit], asks ? 'fraction-complement' : 'whole-parts'),
        hint: `Divide by ${g.d} to find one equal part, then multiply by the number of parts you need.`,
        explanation: `One part is ${whole} ÷ ${g.d} = ${g.unit}. ${one[0].toUpperCase() + one.slice(1)}: ${g.n} × ${g.unit} = ${part}. ${asks ? `${cap(other)}: ${whole} - ${part} = ${rest}.` : ''}`.trim(),
      };
    },
  },

  'class-4-fraction-share': {
    gen(level, r) {
      const d = level === 1 ? 2 : r.pick([2, 3, 4]), f = r.int(2, level === 1 ? 5 : 8), total = Math.ceil(f / d) + r.int(1, 3);
      return { d, f, total, who: r.pick(NAMES), item: r.int(0, 3) };
    },
    calc(g) {
      const items = [['apple', 'apples'], ['pizza', 'pizzas'], ['orange', 'oranges'], ['pie', 'pies']];
      const [one, many] = items[g.item], phrase = { 2: 'half', 3: 'one third', 4: 'a quarter' }[g.d];
      const leftParts = g.total * g.d - g.f;
      if (leftParts <= 0) throw new QuestionRetry('Nothing is left.');
      const He = pronoun(g.who).subject;
      return {
        prompt: `${g.who} had ${g.total} ${many}. ${He} gave ${phrase} ${g.d === 4 ? 'of ' : ''}${an(one)} ${one} to each of ${g.f} friends. How many ${many} are left?`,
        answer: mixedText(leftParts, g.d),
        wrongs: [[mixedText(leftParts + 1, g.d), 'whole-parts'], [mixedText(Math.max(1, leftParts - 1), g.d), 'whole-parts'], [String(Math.max(1, g.total - g.f)), 'fraction-denominator'], [mixedText(Math.max(1, g.total * g.d - g.f * 2), g.d), 'missing-step'], [mixedText(g.total * g.d - g.f + g.d, g.d), 'whole-parts']],
        hint: `Count the pieces given away in total, then take them from the whole ${many}.`,
        explanation: `${g.f} pieces of 1/${g.d} make ${mixedText(g.f, g.d)}. ${g.total} - ${mixedText(g.f, g.d)} = ${mixedText(leftParts, g.d)}.`,
      };
    },
  },

  'class-4-mixed-measure': {
    gen(level, r) {
      const d = r.pick(level === 1 ? [2, 4] : [4, 6, 8, 10]);
      const sub = r.int(0, 2) === 0 && level > 1;
      return { d, whole: r.int(1, 6), part: r.int(1, d - 1), extraDen: r.pick(d % 2 ? [d] : [2, d]), extraNum: 1, sub, unit: r.pick(['kg', 'litre', 'metre']), ask: r.pick(['other', 'together']), who: r.pick(NAMES), other: r.pick(NAMES) };
    },
    calc(g) {
      if (g.who === g.other) throw new QuestionRetry('Two names needed.');
      const extra = g.extraNum * (g.d / g.extraDen), base = g.whole * g.d + g.part;
      const second = g.sub ? base - extra : base + extra;
      if (second <= 0) throw new QuestionRetry('Not positive.');
      const answer = g.ask === 'other' ? second : base + second;
      const fmt = (n, d = g.d) => mixedText(n, d);
      const show = (n, d = g.d) => `${fmt(n, d)} ${g.unit === 'kg' || n <= d ? g.unit : `${g.unit}s`}`;
      const thing = g.unit === 'kg' ? 'flour' : g.unit === 'litre' ? 'juice' : 'cloth';
      const verb = g.sub ? 'less' : 'more';
      return {
        prompt: `${g.who} has ${show(base)} of ${thing}. ${g.other} has ${g.extraNum}/${g.extraDen} ${g.unit} ${verb} than ${g.who}. How much ${thing} ${g.ask === 'other' ? `does ${g.other} have` : 'do they have together'}?`,
        answer: show(answer),
        wrongs: [[show(answer + 1), 'whole-parts'], [show(Math.max(1, answer - 1)), 'whole-parts'], [show(g.ask === 'other' ? base : second), 'missing-step'], [show(answer + g.d), 'whole-parts'], [show(g.sub ? answer + 2 * extra : Math.max(1, answer - 2 * extra)), 'wrong-operation']],
        hint: 'Write both amounts with the same denominator, then add or subtract the fractions.',
        explanation: `${g.other} has ${show(second)}.${g.ask === 'together' ? ` Together: ${fmt(base)} + ${fmt(second)} = ${show(base + second)}.` : ''}`,
      };
    },
  },

  'class-4-perimeter-word': {
    gen(level, r) {
      const mode = r.pick(level === 1 ? ['rect', 'square', 'rect'] : ['rect', 'missing', 'rounds', 'compare', 'square']);
      const l = r.int(level === 1 ? 8 : 15, level === 3 ? 90 : 60), b = r.int(5, l - 1);
      return { mode, l, b, k: r.int(2, 5), s: r.int(8, 40), unit: r.pick(['cm', 'm']) };
    },
    calc(g) {
      const P = 2 * (g.l + g.b), u = g.unit;
      if (g.mode === 'missing') {
        return {
          prompt: `The perimeter of a rectangle is ${P} ${u}. Its length is ${g.l} ${u}. What is its breadth?`, answer: `${g.b} ${u}`,
          wrongs: [[`${P - g.l} ${u}`, 'missing-step'], [`${P - 2 * g.l} ${u}`, 'missing-step'], [`${P / 2 + g.l} ${u}`, 'wrong-operation'], [`${g.b + 2} ${u}`, 'missing-dimension']],
          hint: 'Half the perimeter is length plus breadth. Take the length away.',
          explanation: `Half of ${P} is ${P / 2}. ${P / 2} - ${g.l} = ${g.b} ${u}.`,
        };
      }
      if (g.mode === 'rounds') {
        return {
          prompt: `A park is ${g.l} ${u} long and ${g.b} ${u} wide. ${NAMES[g.l % NAMES.length]} walks ${g.k} times around its edge. How far is that?`, answer: `${P * g.k} ${u}`,
          wrongs: [[`${P} ${u}`, 'missing-step'], [`${g.l * g.b * g.k} ${u}`, 'area-perimeter'], [`${(g.l + g.b) * g.k} ${u}`, 'missing-step'], [`${(P + g.l) * g.k} ${u}`, 'missing-dimension']],
          hint: 'Find the distance around once, then multiply by the number of rounds.',
          explanation: `Once around: 2 × (${g.l} + ${g.b}) = ${P} ${u}. ${g.k} rounds: ${P * g.k} ${u}.`,
        };
      }
      if (g.mode === 'compare') {
        const side = Math.floor(P / 4) - r2(g.s % 6) - 1, Q = 4 * side;
        if (side < 3) throw new QuestionRetry('Square too small.');
        return {
          prompt: `A rectangle is ${g.l} ${u} by ${g.b} ${u}. A square has side ${side} ${u}. How much longer is the rectangle's perimeter?`, answer: `${P - Q} ${u}`,
          wrongs: [[`${g.l + g.b - side} ${u}`, 'missing-step'], [`${g.l * g.b - side * side} ${u}`, 'area-perimeter'], [`${P - side} ${u}`, 'missing-step'], [`${P + Q} ${u}`, 'wrong-operation']],
          hint: 'Find each perimeter first. Then subtract.',
          explanation: `Rectangle: ${P} ${u}. Square: 4 × ${side} = ${Q} ${u}. ${P} - ${Q} = ${P - Q} ${u}.`,
        };
      }
      if (g.mode === 'square') {
        const Q = 4 * g.s;
        return {
          prompt: `A square garden has sides of ${g.s} ${u}. How much fence goes around it?`, answer: `${Q} ${u}`,
          wrongs: [[`${g.s * g.s} ${u}`, 'area-perimeter'], [`${2 * g.s} ${u}`, 'missing-step'], [`${3 * g.s} ${u}`, 'missing-step'], [`${Q + g.s} ${u}`, 'wrong-operation']],
          hint: 'A square has four sides of the same length.',
          explanation: `4 × ${g.s} = ${Q} ${u}.`,
        };
      }
      return {
        prompt: `A rectangular field is ${g.l} ${u} long and ${g.b} ${u} wide. What is its perimeter?`, answer: `${P} ${u}`,
        wrongs: [[`${g.l * g.b} ${u}`, 'area-perimeter'], [`${g.l + g.b} ${u}`, 'missing-step'], [`${2 * g.l + g.b} ${u}`, 'missing-step'], [`${P + g.b} ${u}`, 'wrong-operation']],
        hint: 'Add the four sides, or double the length plus breadth.',
        explanation: `2 × (${g.l} + ${g.b}) = ${P} ${u}.`,
      };
    },
  },

  'class-4-perimeter-unknown': {
    gen(level, r) {
      const W = r.int(10, level === 3 ? 28 : 20), H = r.int(8, 18);
      return { W, H, w1: r.int(2, W - 3), h1: r.int(2, H - 3) };
    },
    calc(g) {
      const P = 2 * (g.W + g.H), X = P / 2 - g.W;
      return {
        prompt: `All corners are right angles and the perimeter is ${P} cm. Find the length of X.`, answer: `${X} cm`,
        wrongs: [[`${P / 2 - g.h1} cm`, 'missing-dimension'], [`${P / 2 - g.w1} cm`, 'missing-dimension'], [`${P - g.W - g.w1 - g.h1} cm`, 'missing-step'], [`${P - 2 * g.W} cm`, 'missing-step'], [`${X + 2} cm`, 'internal-edges']],
        hint: 'Sides facing each other add to the same total. Half the perimeter is width plus height.',
        explanation: `The stepped sides add up to the same as the full width and height. Half of ${P} is ${P / 2}, so X = ${P / 2} - ${g.W} = ${X} cm.`,
        visual: pic('shape-sides', { W: g.W, w1: g.w1, h1: g.h1 }, `An L-shaped figure with right-angled corners, not drawn to scale. Bottom side ${g.W} cm, right side ${g.h1} cm, top side ${g.w1} cm, and the left side marked X.`),
      };
    },
  },

  'class-4-area-word': {
    gen(level, r) {
      const t = r.pick([2, 3, 4, 5]), cols = r.int(3, level === 3 ? 12 : 8), rows = r.int(2, 8);
      return { mode: r.pick(['area', 'tiles', 'missing']), l: r.int(6, level === 1 ? 20 : 45), b: r.int(4, 18), t, cols, rows };
    },
    calc(g) {
      if (g.mode === 'tiles') {
        const l = g.cols * g.t, b = g.rows * g.t, count = g.cols * g.rows;
        return {
          prompt: `A floor is ${l} m by ${b} m. It is covered with square tiles of side ${g.t} m. How many tiles are needed?`, answer: count,
          wrongs: wrongs([2 * (g.cols + g.rows), l * b, g.cols + g.rows, count + g.cols, count - g.rows], 'area-perimeter'),
          hint: 'Count how many tiles fit along each side, then multiply.',
          explanation: `${l} ÷ ${g.t} = ${g.cols} tiles along, ${b} ÷ ${g.t} = ${g.rows} tiles across. ${g.cols} × ${g.rows} = ${count}.`,
        };
      }
      if (g.mode === 'missing') {
        const area = g.l * g.b;
        return {
          prompt: `The area of a rectangle is ${area} square metres. Its length is ${g.l} m. What is its breadth?`, answer: `${g.b} m`,
          wrongs: [[`${area - g.l} m`, 'wrong-operation'], [`${g.b + 2} m`, 'missing-dimension'], [`${area / 2 - g.l} m`, 'area-perimeter'], [`${g.l - g.b} m`, 'wrong-operation']],
          hint: 'Area is length times breadth, so divide the area by the length.',
          explanation: `${area} ÷ ${g.l} = ${g.b} m.`,
        };
      }
      return {
        prompt: `A rectangular notice board is ${g.l} cm long and ${g.b} cm wide. What is its area?`, answer: `${g.l * g.b} square cm`,
        wrongs: [[`${2 * (g.l + g.b)} square cm`, 'area-perimeter'], [`${g.l + g.b} square cm`, 'area-perimeter'], [`${g.l * g.b + g.l} square cm`, 'missing-step'], [`${g.l * g.b - g.b} square cm`, 'missing-step']],
        hint: 'Area is the surface covered: length times breadth.',
        explanation: `${g.l} × ${g.b} = ${g.l * g.b} square cm.`,
      };
    },
  },

  'class-4-solid-facts': {
    gen(level, r) {
      return { solid: r.pick(Object.keys(SOLIDS)), ask: r.pick(['faces', 'edges', 'vertices', 'edges-faces', 'faces-vertices']) };
    },
    calc(g) {
      const [f, e, v] = SOLIDS[g.solid];
      const values = { faces: f, edges: e, vertices: v, 'edges-faces': e - f, 'faces-vertices': f + v };
      const answer = values[g.ask];
      const text = { faces: `How many faces does a ${g.solid} have?`, edges: `How many edges does a ${g.solid} have?`, vertices: `How many vertices does a ${g.solid} have?`, 'edges-faces': `How many more edges than faces does a ${g.solid} have?`, 'faces-vertices': `What is the total number of faces and vertices of a ${g.solid}?` }[g.ask];
      return {
        prompt: text, answer,
        wrongs: wrongs([f, e, v, f + e, e - v, f + v, e + v].filter(value => value !== answer && value > 0), 'included-extra'),
        hint: 'Picture the solid and count each part once, or use a model.',
        explanation: `A ${g.solid} has ${f} faces, ${e} edges and ${v} vertices.${g.ask.includes('-') ? ` The answer is ${answer}.` : ''}`,
      };
    },
  },

  'class-4-score-table': {
    gen(level, r) {
      const names = r.shuffle(NAMES).slice(0, 4), subjects = r.shuffle(['Maths', 'Science', 'English', 'Hindi', 'Art', 'Music']).slice(0, level === 1 ? 3 : 4);
      return { names, subjects, marks: names.map(() => subjects.map(() => r.int(6, level === 1 ? 20 : 48))), ask: r.pick(['top', 'gap', 'between', 'top']), variant: r.int(0, 2) };
    },
    calc(g) {
      const totals = g.marks.map(row => sumOf(row)), best = Math.max(...totals), worst = Math.min(...totals);
      if (totals.filter(t => t === best).length !== 1 || totals.filter(t => t === worst).length !== 1) throw new QuestionRetry('Totals tie.');
      const top = g.names[totals.indexOf(best)];
      const visual = pic('score-table', { names: g.names, subjects: g.subjects, marks: g.marks }, `Score table. ${g.names.map((n, i) => `${n}: ${g.subjects.map((s, j) => `${s} ${g.marks[i][j]}`).join(', ')}`).join('. ')}.`);
      if (g.ask === 'gap') {
        return {
          prompt: ['How many more marks in total does the highest scorer have than the lowest scorer?', 'What is the difference between the highest total and the lowest total?', 'By how many marks does the top total beat the lowest total?'][g.variant], answer: best - worst, visual,
          wrongs: wrongs([best, best + worst, best - worst + 10, Math.abs(g.marks[totals.indexOf(best)][0] - g.marks[totals.indexOf(worst)][0]), best - worst - 5], 'graph-difference'),
          hint: 'Add each row to get a total first, then compare the biggest and smallest.',
          explanation: `Totals: ${totals.join(', ')}. Highest ${best} minus lowest ${worst} is ${best - worst}.`,
        };
      }
      if (g.ask === 'between') {
        const col = g.subjects.length - 1, colTotal = sumOf(g.marks.map(row => row[col]));
        return {
          prompt: [`What is the total of all four children's marks in ${g.subjects[col]}?`, `Add the marks of all four children in ${g.subjects[col]}. What is the total?`, `Together, how many marks did the four children score in ${g.subjects[col]}?`][g.variant], answer: colTotal, visual,
          wrongs: wrongs([colTotal + 10, colTotal - 10, sumOf(g.marks[0]), best, colTotal + g.marks[0][col]], 'graph-key'),
          hint: `Read down the ${g.subjects[col]} column, not along a row.`,
          explanation: `${g.marks.map(row => row[col]).join(' + ')} = ${colTotal}.`,
        };
      }
      return {
        prompt: ['Who has the highest total marks?', 'Which child scores the most marks in all subjects together?', 'Whose total across all subjects is the highest?'][g.variant], answer: top, visual,
        wrongs: g.names.filter(n => n !== top).map(n => [n, 'graph-difference']),
        hint: 'Add across each row to get a total for every child.',
        explanation: `Totals: ${g.names.map((n, i) => `${n} ${totals[i]}`).join(', ')}. ${top} is highest.`,
      };
    },
  },

  'class-4-library-compare': {
    gen(level, r) {
      const subjects = r.shuffle(['Maths', 'Science', 'Story', 'Art', 'History', 'Poems']).slice(0, 4);
      const counts = subjects.map(() => r.int(12, level === 1 ? 60 : 95) * 10);
      const build = (i, j, kind, truth) => {
        const actual = kind === 'more' ? Math.abs(counts[i] - counts[j]) : counts[i] + counts[j];
        return { i, j, kind, claim: truth ? actual : actual + r.pick([-100, -50, -10, 10, 50, 100]) };
      };
      const [a, b, c, d] = r.shuffle([0, 1, 2, 3]);
      const claims = [build(a, b, 'more', true), build(b, c, 'total', false), build(c, d, 'more', false), build(d, a, 'total', false)];
      claims.forEach(claim => { if (claim.kind === 'more' && counts[claim.i] <= counts[claim.j]) [claim.i, claim.j] = [claim.j, claim.i]; });
      return { subjects, counts, claims: r.shuffle(claims) };
    },
    calc(g) {
      const name = i => g.subjects[i];
      const actual = c => c.kind === 'more' ? g.counts[c.i] - g.counts[c.j] : g.counts[c.i] + g.counts[c.j];
      const text = c => c.kind === 'more' ? `${name(c.i)} books are ${c.claim} more than ${name(c.j)}` : `${name(c.i)} and ${name(c.j)} books total ${c.claim}`;
      const good = g.claims.filter(c => actual(c) === c.claim);
      if (good.length !== 1) throw new QuestionRetry('Exactly one statement must be true.');
      return {
        prompt: `A library has ${g.subjects.map((s, i) => `${s} ${g.counts[i]}`).join(', ')} books. Which statement is true?`,
        answer: text(good[0]),
        wrongs: g.claims.filter(c => c !== good[0]).map(c => [text(c), 'graph-difference']),
        hint: 'Check each statement: subtract for "more than" and add for "total".',
        explanation: `${text(good[0])} is true: ${g.counts[good[0].i]} ${good[0].kind === 'more' ? '-' : '+'} ${g.counts[good[0].j]} = ${good[0].claim}.`,
      };
    },
  },

  'class-4-survey-rest': {
    gen(level, r) {
      const a = r.int(12, level === 1 ? 40 : 90), b = r.int(10, level === 1 ? 35 : 80), rest = r.int(9, 60);
      return { a, b, rest, drinks: r.pick([['tea', 'milk', 'juice'], ['rice', 'roti', 'noodles'], ['cricket', 'football', 'hockey']]), ask: r.pick(['rest', 'more', 'rest']) };
    },
    calc(g) {
      const total = g.a + g.b + g.rest, [x, y, z] = g.drinks;
      if (g.ask === 'more') {
        return {
          prompt: `In a survey of ${total} children, ${g.a} chose ${x}, ${g.b} chose ${y} and the rest chose ${z}. How many more chose ${x === 'tea' ? 'tea' : x} than ${z}?`,
          answer: Math.abs(g.a - g.rest),
          wrongs: wrongs([g.a + g.rest, g.rest, g.a - g.b, total - g.a, Math.abs(g.a - g.rest) + 10, Math.abs(g.a - g.rest) + 20], 'graph-difference'),
          hint: 'Find how many chose the last option first, then compare.',
          explanation: `${total} - ${g.a} - ${g.b} = ${g.rest} chose ${z}. The difference is ${Math.abs(g.a - g.rest)}.`.replace(/\.$/, '.'),
        };
      }
      return {
        prompt: `In a survey of ${total} children, ${g.a} chose ${x}, ${g.b} chose ${y} and the rest chose ${z}. How many chose ${z}?`, answer: g.rest,
        wrongs: wrongs([g.a + g.b, total - g.a, total - g.b, g.rest + 10, Math.abs(g.a - g.b)], 'missing-step'),
        hint: 'Take the two known groups away from the total.',
        explanation: `${total} - ${g.a} - ${g.b} = ${g.rest}.`,
      };
    },
  },
};

const r2 = n => n;
const SOLIDS = { cube: [6, 12, 8], cuboid: [6, 12, 8], 'square pyramid': [5, 8, 5], 'triangular prism': [5, 9, 6], 'triangular pyramid': [4, 6, 4], 'pentagonal prism': [7, 15, 10] };
const ITEMS = {
  Rs: [['cup', 'cups'], ['burger', 'burgers'], ['pen', 'pens'], ['book', 'books'], ['bat', 'bats'], ['ball', 'balls'], ['kite', 'kites'], ['top', 'tops'], ['doll', 'dolls'], ['bag', 'bags']],
  g: [['apple', 'apples'], ['mango', 'mangoes'], ['melon', 'melons'], ['pear', 'pears'], ['toy car', 'toy cars'], ['doll', 'dolls']],
};
