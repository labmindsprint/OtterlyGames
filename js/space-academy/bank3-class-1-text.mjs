import { MISCONCEPTIONS as SHARED, QuestionRetry, answerChoices, timeText, wrong } from './bank-shared.mjs';

// Real SOF Class 1 questions are short sentences with four word, number or sentence options.
// These families copy that style without pictures; bank3-class-1.mjs adds them to its own list.

export const TEXT_FAMILIES = {
  'class-1-number-name': { skill: 'place', title: 'Match a number with its number name' },
  'class-1-expanded-form': { skill: 'place', title: 'Split a number into tens and ones' },
  'class-1-compare-numbers': { skill: 'compare', title: 'Find the greatest or smallest number' },
  'class-1-add-story': { skill: 'addition', title: 'Solve a short add or take-away story' },
  'class-1-number-sentence': { skill: 'addition', title: 'Pick the number sentence for a story' },
  'class-1-true-pair': { skill: 'mystery', title: 'Decide which number sentences are true' },
  'class-1-letter-gap': { skill: 'sequence', title: 'Fill the gap in a letter pattern' },
  'class-1-word-repeat': { skill: 'repeat', title: 'Continue a repeating word pattern' },
  'class-1-shape-facts': { skill: 'shape', title: 'Use sides and corners to name a shape' },
  'class-1-real-solids': { skill: 'solids', title: 'Match everyday things with solid shapes' },
  'class-1-choose-unit': { skill: 'measure', title: 'Choose the best unit to measure with' },
  'class-1-length-story': { skill: 'measure', title: 'Join, cut or compare lengths in a story' },
  'class-1-days-months': { skill: 'calendar', title: 'Name the day or month before, after or nth' },
  'class-1-price-compare': { skill: 'money', title: 'Compare two prices or find how much more' },
  'class-1-note-count': { skill: 'money', title: 'Count equal coins that make an amount' },
  'class-1-stack-order': { skill: 'ranking', title: 'Order things from above and below clues' },
  'class-1-word-odd': { skill: 'odd', title: 'Find the word that does not belong' },
  'class-1-word-analogy': { skill: 'odd', title: 'Match a pair, as bird goes with fly' },
  'class-1-equal-groups': { skill: 'groups', title: 'Share equally, or count equal groups' },
  'class-1-time-shift': { skill: 'time', title: 'Find the time after or before a short wait' },
};

export const TEXT_MISCONCEPTIONS = {
  'class-1-number-word': { title: 'Number names', message: 'Say the tens word first, then the ones word, and listen for teen and ty endings.' },
  'class-1-unit-choice': { title: 'Choosing a unit', message: 'Think about what is measured: length, weight or how much a container holds.' },
  'class-1-analogy-link': { title: 'Matching a pair', message: 'Find how the first two words go together, then use the same link.' },
};
const KNOWN = { ...SHARED, ...TEXT_MISCONCEPTIONS };

const NAMES = ['Asha', 'Dev', 'Ira', 'Kabir', 'Mina', 'Neel', 'Ovi', 'Ria', 'Tara', 'Zoya'];
const noun = (n, one, many) => n === 1 ? one : many;
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const numberWord = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PATTERN_WORDS = ['star', 'moon', 'sun', 'rocket', 'comet', 'planet'];
const SIDES = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 };
const SOLID_THINGS = {
  cube: ['dice', 'toy block', 'puzzle block', 'gift box', 'wooden block'],
  sphere: ['ball', 'marble', 'globe', 'football', 'orange'],
  cylinder: ['tin can', 'drum', 'water pipe', 'battery', 'paint tin'],
  cone: ['party hat', 'witch hat', 'road marker', 'wizard hat', 'clown hat'],
};
const UNIT_THINGS = {
  centimetre: ['a pencil', 'a crayon', 'a key', 'an eraser', 'a paper clip', 'a button', 'a toothbrush'],
  metre: ['a classroom', 'a playground', 'a bus', 'a school corridor', 'a football pitch', 'a long rope'],
  kilogram: ['a bag of rice', 'a pumpkin', 'a watermelon', 'a school bag', 'a sack of potatoes', 'a bag of flour'],
  litre: ['a bucket of water', 'a jug of milk', 'a water tank', 'a bottle of juice', 'a can of paint', 'a water cooler'],
};
const UNIT_HOW = { centimetre: 'a short length', metre: 'a long length', kilogram: 'how heavy it is', litre: 'how much liquid it holds' };
const withArticle = word => `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;
const UNIT_ORDER = ['centimetre', 'metre', 'kilogram', 'litre'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December'];
const STACK_THINGS = ['book', 'cup', 'pen', 'ball', 'hat', 'box', 'shoe', 'clock', 'plate', 'toy'];
const ODD_GROUPS = {
  animals: ['cat', 'dog', 'cow', 'goat', 'horse'],
  fruits: ['apple', 'mango', 'grape', 'banana', 'lemon'],
  vegetables: ['potato', 'carrot', 'onion', 'peas', 'tomato'],
  vehicles: ['car', 'bus', 'train', 'boat', 'cycle'],
  colours: ['red', 'blue', 'green', 'pink', 'black'],
  'body parts': ['hand', 'leg', 'ear', 'eye', 'nose'],
};
const PAIRS = {
  bird: 'fly', fish: 'swim', dog: 'bark', frog: 'jump', cow: 'moo', snake: 'crawl', duck: 'quack',
  eye: 'see', ear: 'hear', nose: 'smell', cat: 'purr', horse: 'gallop',
};
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const CALENDAR_FACTS = [
  { prompt: 'How many days are in one week?', answer: WEEKDAYS.length, hint: 'Say the days from Monday to Sunday.', explanation: 'Monday to Sunday is 7 days.' },
  { prompt: 'How many months are in one year?', answer: MONTHS.length, hint: 'Say the months from January to December.', explanation: 'January to December is 12 months.' },
  { prompt: 'How many months of a year have 30 days?', answer: MONTH_DAYS.filter(days => days === 30).length,
    hint: 'April, June, September and November are the short ones.', explanation: 'April, June, September and November have 30 days.' },
  { prompt: 'How many months of a year have 31 days?', answer: MONTH_DAYS.filter(days => days === 31).length,
    hint: 'Count the long months one by one.', explanation: 'Seven months have 31 days.' },
  { prompt: 'In a normal year, February has how many days?', answer: MONTH_DAYS[1], hint: 'February is the shortest month.',
    explanation: 'In a normal year February has 28 days.' },
];
const BUY_THINGS = ['kite', 'ball', 'book', 'toy car', 'cap', 'lunch box', 'pencil box', 'bag'];
const LENGTH_THINGS = ['ribbon', 'rope', 'string', 'wire', 'stick', 'pipe'];
const COUNT_THINGS = ['stickers', 'shells', 'marbles', 'stamps', 'cards', 'seeds', 'stars', 'pebbles'];

const sum = values => values.reduce((total, value) => total + value, 0);
const rankOf = (sorted, ask) => ask === 'greatest' ? sorted[sorted.length - 1] : ask === 'smallest' ? sorted[0]
  : ask === 'second greatest' ? sorted[sorted.length - 2] : sorted[1];

function question(family, prompt, answer, hint, explanation, givens, choices) {
  return { family, prompt, answer: String(answer), hint, explanation, proof: { family, givens }, choices };
}

// Number options lean to the same side of the answer so the middle value does not give it away.
function numberChoices(answer, alternatives, count) {
  const cueValue = value => {
    const match = /^(?:Rs )?(-?\d+)(?: [A-Za-z]+)?$/.exec(String(value));
    return match ? Number(match[1]) : null;
  };
  const usable = alternatives.filter(([value]) => (cueValue(value) ?? 0) >= 0);
  const target = cueValue(answer);
  let ordered = usable;
  if (target != null) {
    const lower = usable.filter(([value]) => cueValue(value) != null && cueValue(value) < target);
    const upper = usable.filter(([value]) => cueValue(value) != null && cueValue(value) > target);
    const preferred = target % 2 ? lower : upper;
    const otherSide = preferred === lower ? upper : lower;
    const sameSide = preferred.length >= count - 1 ? preferred : otherSide.length >= count - 1 ? otherSide : null;
    if (sameSide) ordered = [...sameSide, ...usable.filter(entry => !sameSide.includes(entry))];
  }
  return answerChoices(answer, ordered.map(([value, code]) => wrong(value, code)), count, null, KNOWN);
}

const wordChoices = (answer, wrongs, count) =>
  answerChoices(answer, wrongs.map(([value, code]) => wrong(value, code)), count, null, KNOWN);

export function draftText(family, level, r, count) {
  if (family === 'class-1-number-name') {
    const n = r.int(12, level === 1 ? 39 : level === 2 ? 79 : 99);
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    const toWord = r.int(0, 1) === 1;
    const near = [
      ones ? ones * 10 + tens : tens + 10, ones ? n + 10 : n - 10, n - 1, n + 1, n + 10,
    ].filter(value => value >= 10 && value <= 99 && value !== n);
    const wrongs = near.map(value => [toWord ? numberWord(value) : value, 'class-1-number-word']);
    const word = numberWord(n);
    return question(family,
      toWord ? r.pick([`Which is the number name of ${n}?`, `Which words show the number ${n}?`])
        : r.pick([`Which number is ${word}?`, `Which number do the words "${word}" show?`]),
      toWord ? word : n, 'Say the tens word first, then the ones word.',
      `${n} has ${tens} ${noun(tens, 'ten', 'tens')} and ${ones} ${noun(ones, 'one', 'ones')}, so it is ${word}.`,
      { toWord, n }, toWord ? wordChoices(word, wrongs, count) : numberChoices(n, wrongs, count));
  }

  if (family === 'class-1-expanded-form') {
    const tens = r.int(1, level === 1 ? 5 : 9);
    const ones = r.int(1, 9);
    if (tens === ones) throw new QuestionRetry('Expanded forms need different digits.');
    const n = tens * 10 + ones;
    const mode = r.pick(['forward', 'blank-ones', 'blank-tens', 'number']);
    if (mode === 'number') {
      return question(family,
        r.pick([`Which number is ${tens} ${noun(tens, 'ten', 'tens')} ${ones} ${noun(ones, 'one', 'ones')}?`,
          `${tens} ${noun(tens, 'ten', 'tens')} and ${ones} ${noun(ones, 'one', 'ones')} make which number?`]),
        n, 'Write the tens digit first, then the ones digit.',
        `${tens} ${noun(tens, 'ten', 'tens')} is ${tens * 10} and ${ones} ${noun(ones, 'one', 'ones')} is ${ones}, so the number is ${n}.`,
        { mode, n }, numberChoices(n, [[ones * 10 + tens, 'place-shift'], [tens + ones, 'face-value'],
          [n + 10, 'place-shift'], [n - 10, 'place-shift'], [n + 1, 'missing-step']], count));
    }
    if (mode === 'forward') {
      const answer = `${tens * 10} + ${ones}`;
      return question(family,
        r.pick([`Which shows ${n} as tens and ones?`, `Which breaks ${n} into tens and ones?`]),
        answer, 'The tens digit tells how many tens, not how many ones.',
        `${n} is ${tens} ${noun(tens, 'ten', 'tens')} and ${ones} ${noun(ones, 'one', 'ones')}: ${answer}.`,
        { mode, n }, wordChoices(answer, [
          [`${tens} + ${ones}`, 'face-value'], [`${ones * 10} + ${tens}`, 'place-shift'],
          [`${tens * 10} + ${ones * 10}`, 'place-shift'], [`${tens} + ${ones * 10}`, 'place-shift'],
        ], count));
    }
    const askOnes = mode === 'blank-ones';
    const answer = askOnes ? ones : tens;
    return question(family,
      askOnes ? `${n} = ${tens * 10} + ?. What is missing?` : `${n} = ? ${tens === 1 ? 'ten' : 'tens'} + ${ones} ${noun(ones, 'one', 'ones')}. What is missing?`,
      answer, askOnes ? 'Take the tens part away from the whole number.' : 'Count how many whole tens are in the number.',
      `${n} is ${tens * 10} and ${ones}, so the missing number is ${answer}.`,
      { mode, n }, numberChoices(answer, askOnes
        ? [[tens, 'face-value'], [ones * 10, 'place-shift'], [tens * 10, 'place-shift'], [ones + 1, 'missing-step'], [ones - 1, 'missing-step']]
        : [[ones, 'face-value'], [tens * 10, 'place-shift'], [tens + 1, 'missing-step'], [tens - 1, 'missing-step'], [n, 'place-shift']], count));
  }

  if (family === 'class-1-compare-numbers') {
    const [lo, hi] = level === 1 ? [10, 45] : [10, 99];
    const values = r.shuffle(Array.from({ length: hi - lo + 1 }, (_, index) => lo + index)).slice(0, 4);
    if (level > 1 && new Set(values.map(value => Math.floor(value / 10))).size === 4) {
      throw new QuestionRetry('Harder comparisons should share a tens digit.');
    }
    const ask = level === 1 ? r.pick(['greatest', 'smallest'])
      : level === 2 ? r.pick(['greatest', 'smallest']) : r.pick(['greatest', 'smallest', 'second greatest', 'second smallest']);
    const sorted = [...values].sort((a, b) => a - b);
    const answer = rankOf(sorted, ask);
    return question(family,
      r.pick([`Which of these numbers is the ${ask}?`, `Four numbers are shown. Which is the ${ask}?`]),
      answer, 'Compare the tens digits first, then the ones.',
      `In order the numbers are ${sorted.join(', ')}, so the ${ask} is ${answer}.`,
      { ask }, numberChoices(answer, values.filter(value => value !== answer).map(value => [value, 'face-value']), count));
  }

  if (family === 'class-1-add-story') {
    const items = r.pick(COUNT_THINGS);
    const op = level === 1 ? r.pick(['add', 'take']) : r.pick(['add', 'take', 'more', 'fewer', 'make']);
    const limit = level === 1 ? 20 : level === 2 ? 60 : 99;
    const low = level === 1 ? 5 : level === 2 ? 12 : 25;
    const [bagA, bagB] = r.pick([['red', 'blue'], ['blue', 'green'], ['green', 'red'], ['yellow', 'blue']]);
    const a = op === 'add' || op === 'make' ? r.int(low, limit - 5) : r.int(low + 4, limit);
    const b = op === 'add' || op === 'make' ? r.int(2, limit - a) : r.int(2, a - 2);
    const answer = op === 'add' ? a + b : op === 'make' ? b : a - b;
    const prompt = op === 'add'
      ? r.pick([`A bag has ${a} ${items}. ${b} more are put in. How many are in the bag now?`,
        `${a} ${items} are in a box and then ${b} more are added. How many in all?`])
      : op === 'take'
        ? r.pick([`A bag has ${a} ${items}. ${b} are given away. How many are left?`,
          `There are ${a} ${items}. ${b} get lost. How many are left?`])
        : op === 'fewer' ? `The ${bagA} bag has ${a} ${items}. The ${bagB} bag has ${b} fewer. How many ${items} are in the ${bagB} bag?`
          : op === 'make' ? `A box needs ${a + b} ${items} and has ${a}. How many more are needed?`
            : `The ${bagA} bag has ${a} ${items} and the ${bagB} bag has ${b}. How many more are in the ${bagA} bag?`;
    return question(family, prompt, answer,
      op === 'add' ? 'Getting more makes the group bigger.' : op === 'take' || op === 'fewer' ? 'Fewer or giving away means taking away.'
        : op === 'make' ? 'Find how far the small number is from the target.' : 'Take the smaller group away from the bigger group.',
      op === 'add' ? `${a} and ${b} more make ${answer}.` : op === 'make' ? `${a + b} take away ${a} leaves ${answer}.`
        : `${a} take away ${b} leaves ${answer}.`,
      { op, a, b }, numberChoices(answer, [
        [op === 'add' ? a - b : a + b, 'wrong-operation'], [a, 'ignored-change'], [b, 'missing-step'],
        [answer + 10, 'place-shift'], [answer - 10, 'place-shift'], [answer + 1, 'missing-step'], [answer - 1, 'missing-step'],
      ], count));
  }

  if (family === 'class-1-number-sentence') {
    const items = r.pick(COUNT_THINGS);
    const op = r.pick(['add', 'take']);
    const limit = level === 1 ? 10 : level === 2 ? 20 : 50;
    const a = r.int(op === 'add' ? 3 : 5, limit - 2);
    const b = op === 'add' ? r.int(2, Math.min(a, limit - a)) : r.int(2, a - 1);
    const holder = r.pick(['box', 'bag', 'jar', 'tray']);
    const result = op === 'add' ? a + b : a - b;
    const sentence = (sign, left, right, value) => `${left} ${sign} ${right} = ${value}`;
    const answer = op === 'add' ? sentence('+', a, b, a + b) : sentence('-', a, b, a - b);
    const other = op === 'add' ? sentence('-', a, b, a - b) : sentence('+', a, b, a + b);
    return question(family,
      op === 'add' ? `${a} ${items} are in a ${holder}. ${b} more are put in. Which sentence fits?`
        : `${a} ${items} are in a ${holder}. ${b} are taken out. Which sentence fits?`,
      answer, `Decide if the ${holder} gets more or fewer, then check the answer.`,
      `${op === 'add' ? 'More are added' : 'Some are taken away'}, so ${answer}.`,
      { op, a, b }, wordChoices(answer, [
        [other, 'wrong-operation'],
        [op === 'add' ? sentence('+', a, b, result + 1) : sentence('-', a, b, result + 1), 'missing-step'],
        [op === 'add' ? sentence('+', a, b, result - 1) : sentence('-', a, b, result - 1), 'missing-step'],
      ], count));
  }

  if (family === 'class-1-true-pair') {
    const cap = level === 1 ? 20 : level === 2 ? 50 : 99;
    const build = truth => {
      const plus = r.int(0, 1) === 1;
      const a = r.int(5, cap - 2);
      const b = plus ? r.int(2, cap - a) : r.int(2, a - 1);
      const real = plus ? a + b : a - b;
      const shown = truth ? real : real + r.pick([1, -1, 2, -2, 10, -10]);
      if (shown < 0 || shown === real && !truth) throw new QuestionRetry('The false sentence must be false.');
      return { a, b, plus, shown };
    };
    const truths = r.pick([[true, true], [true, false], [false, true], [false, false]]);
    const [first, second] = truths.map(build);
    const text = e => `${e.a} ${e.plus ? '+' : '-'} ${e.b} = ${e.shown}`;
    const answer = truths[0] && truths[1] ? 'Both are true' : truths[0] ? 'Only sentence 1 is true'
      : truths[1] ? 'Only sentence 2 is true' : 'Neither is true';
    return question(family,
      `Sentence 1: ${text(first)}. Sentence 2: ${text(second)}. Which are true?`, answer,
      'Work out each sentence on its own before choosing.',
      `${text(first)} is ${truths[0] ? 'true' : 'false'} and ${text(second)} is ${truths[1] ? 'true' : 'false'}.`,
      { first, second }, wordChoices(answer, [
        ['Both are true', 'missing-step'], ['Only sentence 1 is true', 'missing-step'],
        ['Only sentence 2 is true', 'missing-step'], ['Neither is true', 'missing-step'],
      ].filter(([value]) => value !== answer), count));
  }

  if (family === 'class-1-letter-gap') {
    const step = level === 1 ? 1 : r.pick([1, 2]);
    const direction = level === 3 && r.int(0, 1) ? -1 : 1;
    const length = 5;
    const start = direction > 0 ? r.int(0, 25 - (length - 1) * step) : r.int((length - 1) * step, 25);
    const missing = r.int(1, 3);
    const letters = Array.from({ length }, (_, index) => start + direction * step * index);
    const answerIndex = letters[missing];
    const shown = letters.map((value, index) => index === missing ? '?' : ALPHABET[value]).join(', ');
    const wrongs = [answerIndex - 1, answerIndex + 1, answerIndex - step * 2, answerIndex + step * 2, answerIndex + 2]
      .filter(value => value >= 0 && value < 26 && value !== answerIndex).map(value => [ALPHABET[value], 'missing-step']);
    return question(family,
      r.pick([`Which letter is missing: ${shown}?`, `Which letter fills the gap: ${shown}?`]),
      ALPHABET[answerIndex], 'Say the alphabet and see how far each letter jumps.',
      `The letters ${direction > 0 ? 'move forward' : 'move back'} by ${step} each time, so the missing letter is ${ALPHABET[answerIndex]}.`,
      { start, step, direction, missing }, wordChoices(ALPHABET[answerIndex], wrongs, count));
  }

  if (family === 'class-1-word-repeat') {
    const [a, b, c] = r.shuffle(PATTERN_WORDS);
    const unit = level === 1 ? [a, b] : level === 2 ? [a, b, c] : r.pick([[a, a, b], [a, b, b], [a, b, a, c]]);
    const shownCount = unit.length * 2 + r.int(1, unit.length - 1);
    const sequence = Array.from({ length: shownCount }, (_, index) => unit[index % unit.length]);
    const answer = unit[shownCount % unit.length];
    return question(family,
      r.pick([`What comes next: ${sequence.join(', ')}, ?`, `Carry on the pattern: ${sequence.join(', ')}. What comes next?`]),
      answer, 'Find the group that repeats, then carry on from the end.',
      `The group ${unit.join(', ')} repeats, so ${answer} comes next.`,
      { unit, shownCount }, wordChoices(answer,
        PATTERN_WORDS.filter(word => word !== answer).map(word => [word, 'repeat-unit']), count));
  }

  if (family === 'class-1-shape-facts') {
    const mode = r.pick(['sides', 'corners', 'which', 'most', 'fewest', 'together', 'more']);
    if (mode === 'most' || mode === 'fewest') {
      const pool = ['triangle', r.pick(['square', 'rectangle']), 'pentagon', 'hexagon'];
      const ranked = [...pool].sort((x, y) => SIDES[x] - SIDES[y]);
      const answer = mode === 'most' ? ranked[3] : ranked[0];
      return question(family,
        `Which of these shapes has the ${mode === 'most' ? 'most' : 'fewest'} sides?`, answer,
        'Count the straight sides of each shape, then compare.',
        `The shapes have ${ranked.map(shape => `${SIDES[shape]} (${shape})`).join(', ')} sides, so the ${mode === 'most' ? 'most' : 'fewest'} is the ${answer}.`,
        { mode, pool: [...pool].sort() }, wordChoices(answer, pool.filter(shape => shape !== answer).map(shape => [shape, 'counted-endpoints']), count));
    }
    if (mode === 'together' || mode === 'more') {
      const [bigger, smaller] = r.shuffle(['triangle', 'square', 'rectangle', 'pentagon', 'hexagon']).slice(0, 2)
        .sort((x, y) => SIDES[y] - SIDES[x]);
      if (SIDES[bigger] === SIDES[smaller]) throw new QuestionRetry('The two shapes need different side counts.');
      const answer = mode === 'together' ? SIDES[bigger] + SIDES[smaller] : SIDES[bigger] - SIDES[smaller];
      return question(family,
        mode === 'together' ? `How many sides do a ${bigger} and a ${smaller} have together?`
          : `How many more sides does a ${bigger} have than a ${smaller}?`,
        answer, 'Find the sides of each shape first.',
        `A ${bigger} has ${SIDES[bigger]} sides and a ${smaller} has ${SIDES[smaller]}, so ${SIDES[bigger]} ${mode === 'together' ? '+' : '-'} ${SIDES[smaller]} = ${answer}.`,
        { mode, bigger, smaller },
        numberChoices(answer, [mode === 'together' ? SIDES[bigger] - SIDES[smaller] : SIDES[bigger] + SIDES[smaller], SIDES[bigger], SIDES[smaller], answer + 1, answer - 1, answer + 2]
          .filter(value => value !== answer).map(value => [value, 'counted-endpoints']), count));
    }
    if (mode !== 'which') {
      const shape = r.pick(Object.keys(SIDES));
      const answer = SIDES[shape];
      return question(family,
        mode === 'sides' ? r.pick([`How many sides does a ${shape} have?`, `A ${shape} is drawn. How many sides does it have?`])
          : r.pick([`How many corners does a ${shape} have?`, `Count the corners of a ${shape}. How many are there?`]),
        answer, 'Picture the shape and touch one side or corner at a time.',
        `A ${shape} has ${answer} ${mode}.`, { mode, shape },
        numberChoices(answer, [2, 3, 4, 5, 6, 7, 8].filter(value => value !== answer).map(value => [value, 'counted-endpoints']), count));
    }
    const target = r.pick(['triangle', 'pentagon', 'hexagon', 'circle']);
    const sides = SIDES[target] ?? 0;
    const others = ['triangle', 'square', 'pentagon', 'hexagon', 'circle']
      .filter(shape => shape !== target && (sides === 0 ? shape !== 'circle' : shape !== 'circle' && SIDES[shape] !== sides));
    return question(family,
      sides ? `Which shape has ${sides} sides?` : r.pick(['Which shape has no corners?', 'Which shape is round with no corners?']),
      target, sides ? 'Count the straight sides of each shape.' : 'A corner is where two straight sides meet.',
      sides ? `A ${target} has ${sides} sides.` : 'A circle is round, so it has no corners.',
      { sides, target }, wordChoices(target, r.shuffle(others).slice(0, 3).map(shape => [shape, 'counted-endpoints']), count));
  }

  if (family === 'class-1-real-solids') {
    const solid = r.pick(Object.keys(SOLID_THINGS));
    const mode = r.pick(['thing', 'solid']);
    const thing = r.pick(SOLID_THINGS[solid]);
    const others = Object.keys(SOLID_THINGS).filter(key => key !== solid);
    if (mode === 'thing') {
      return question(family,
        r.pick([`Which thing is shaped like a ${solid}?`, `Which of these has the shape of a ${solid}?`]),
        thing, 'Think about flat faces, curved faces and points.',
        `${withArticle(thing)[0].toUpperCase()}${withArticle(thing).slice(1)} is shaped like a ${solid}.`, { mode, solid },
        wordChoices(thing, others.map(key => [r.pick(SOLID_THINGS[key]), 'sorting-rule']), count));
    }
    return question(family,
      r.pick([`${withArticle(thing)[0].toUpperCase()}${withArticle(thing).slice(1)} has which solid shape?`, `Which solid shape is ${withArticle(thing)}?`]),
      solid, 'Think about flat faces, curved faces and points.',
      `${withArticle(thing)[0].toUpperCase()}${withArticle(thing).slice(1)} is shaped like a ${solid}.`, { mode, thing },
      wordChoices(solid, others.map(key => [key, 'sorting-rule']), count));
  }

  if (family === 'class-1-choose-unit') {
    const unit = r.pick(UNIT_ORDER);
    const thing = r.pick(UNIT_THINGS[unit]);
    return question(family,
      r.pick([`Which unit is best to measure ${thing}?`, `Which unit would you use to measure ${thing}?`]),
      unit, 'Think about what is measured: how long, how heavy or how much liquid.',
      `For ${thing} we measure ${UNIT_HOW[unit]}, so the unit is the ${unit}.`, { thing },
      wordChoices(unit, UNIT_ORDER.filter(item => item !== unit).map(item => [item, 'class-1-unit-choice']), count));
  }

  if (family === 'class-1-length-story') {
    const op = level === 1 ? r.pick(['cut', 'join']) : r.pick(['cut', 'join', 'longer']);
    const thing = r.pick(LENGTH_THINGS);
    const limit = level === 1 ? 20 : level === 2 ? 50 : 99;
    const a = r.int(8, limit - 4);
    const b = op === 'join' ? r.int(3, limit - a) : r.int(3, a - 2);
    const answer = op === 'join' ? a + b : a - b;
    const cm = value => `${value} cm`;
    const prompt = op === 'cut' ? `A ${thing} is ${a} cm long. ${b} cm is cut off. How long is it now?`
      : op === 'join' ? `${/^(8|11|18|8\d)$/.test(String(a)) ? 'An' : 'A'} ${a} cm ${thing} and ${/^(8|11|18|8\d)$/.test(String(b)) ? 'an' : 'a'} ${b} cm ${thing} are joined end to end. How long is the joined ${thing}?`
        : `A red ${thing} is ${a} cm. A blue ${thing} is ${b} cm. How much longer is the red ${thing}?`;
    return question(family, prompt, cm(answer),
      op === 'join' ? 'Joining two pieces makes one longer piece.' : 'Cutting or comparing means taking one length from the other.',
      op === 'join' ? `${a} cm and ${b} cm make ${cm(answer)}.` : `${a} cm - ${b} cm = ${cm(answer)}.`,
      { op, a, b }, numberChoices(cm(answer), [
        [cm(op === 'join' ? a - b : a + b), 'wrong-operation'], [cm(a), 'ignored-change'], [cm(b), 'missing-step'],
        [cm(answer + 10), 'place-shift'], [cm(answer - 10), 'place-shift'], [cm(answer + 1), 'missing-step'],
      ], count));
  }

  if (family === 'class-1-days-months') {
    if (level > 1 && r.int(0, 3) === 0) {
      const fact = r.pick(CALENDAR_FACTS);
      return question(family, fact.prompt, fact.answer, fact.hint, fact.explanation, { prompt: fact.prompt },
        numberChoices(fact.answer, [...new Set([fact.answer - 1, fact.answer + 1, fact.answer - 2, fact.answer + 2, fact.answer + 3, fact.answer * 2])]
          .filter(value => value > 0).map(value => [value, 'counted-endpoints']), count));
    }
    const useMonths = r.int(0, 1) === 1;
    const list = useMonths ? MONTHS : WEEKDAYS;
    const word = useMonths ? 'month' : 'day';
    const mode = level === 1 ? r.pick(['after', 'before', 'between']) : useMonths ? r.pick(['after', 'before', 'nth', 'between']) : r.pick(['after', 'before', 'nth', 'pair', 'between']);
    const base = r.int(0, list.length - 1);
    // Place 1 would just repeat "Counting from Monday" back to the child.
    const place = r.int(useMonths ? 1 : 2, list.length - 1);
    const answerIndex = mode === 'after' ? (base + 1) % list.length : mode === 'before'
      ? (base + list.length - 1) % list.length : mode === 'pair' ? (base + 2) % list.length : mode === 'between' ? (base + 1) % list.length : place - 1;
    const prompt = mode === 'pair' ? `If yesterday was ${list[base]}, what day will tomorrow be?` : mode === 'after'
      ? (useMonths ? `Which month comes after ${list[base]}?` : r.pick([`Which day comes after ${list[base]}?`,
        `Today is ${list[base]}. What day is tomorrow?`]))
      : mode === 'before'
        ? (useMonths ? `Which month comes before ${list[base]}?` : r.pick([`Which day comes before ${list[base]}?`,
          `Today is ${list[base]}. What day was yesterday?`]))
        : mode === 'between' ? `Which ${word} comes between ${list[base]} and ${list[(base + 2) % list.length]}?`
          : useMonths ? `Which is the ${place}${place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} month of the year?`
            : `Counting from Monday, which is day number ${place} of the week?`;
    const wrongIndexes = [answerIndex - 1, answerIndex + 1, answerIndex - 2, answerIndex + 2]
      .map(index => (index + list.length) % list.length);
    return question(family, prompt, list[answerIndex],
      `Say the ${word}s in order and move one step at a time.`,
      mode === 'nth' ? `The ${word}s in order put ${list[answerIndex]} in place ${place}.`
        : mode === 'pair' ? `Today is ${list[(base + 1) % list.length]}, so tomorrow is ${list[answerIndex]}.`
          : mode === 'between' ? `In order: ${list[base]}, ${list[answerIndex]}, ${list[(base + 2) % list.length]}. The one in the middle is ${list[answerIndex]}.`
            : `${list[answerIndex]} comes right ${mode} ${list[base]} in the ${word} list.`,
      { mode, useMonths, base, place }, wordChoices(list[answerIndex],
        wrongIndexes.filter(index => index !== answerIndex).map(index => [list[index], 'time-direction']), count));
  }

  if (family === 'class-1-price-compare') {
    const [first, second] = r.shuffle(BUY_THINGS).slice(0, 2);
    const mode = r.pick(['diff', 'need', 'change']);
    const cap = level === 1 ? 30 : level === 2 ? 60 : 100;
    const note = r.pick(level === 1 ? [20, 50] : [20, 50, 100]);
    const high = mode === 'change' ? note : r.int(12, cap);
    const low = mode === 'change' ? r.int(Math.floor(note / 3), note - 3) : r.int(5, high - 3);
    const name = r.pick(NAMES);
    const answer = high - low;
    const rs = value => `Rs ${value}`;
    return question(family,
      mode === 'diff' ? `A ${first} costs ${rs(high)} and a ${second} costs ${rs(low)}. How much more is the ${first}?`
        : mode === 'change' ? `${name} pays with a ${rs(note)} note for a ${first} that costs ${rs(low)}. How much change?`
          : `${name} has ${rs(low)}. A ${first} costs ${rs(high)}. How much more money is needed?`,
      rs(answer), mode === 'need' ? 'Find the gap between what is held and the price.'
        : mode === 'change' ? 'Change is the money given minus the price.' : 'Take the lower price away from the higher price.',
      `${rs(high)} take away ${rs(low)} leaves ${rs(answer)}.`, { mode, high, low },
      numberChoices(rs(answer), [
        [rs(high + low), 'price-total'], [rs(high), 'ignored-change'], [rs(low), 'change-order'],
        [rs(answer + 10), 'place-shift'], [rs(answer + 1), 'missing-step'], [rs(answer - 1), 'missing-step'],
      ], count));
  }

  if (family === 'class-1-note-count') {
    const coin = level === 1 ? r.pick([2, 5]) : r.pick([2, 5, 10]);
    const pieces = r.int(3, level === 3 ? 10 : 8);
    const total = coin * pieces;
    const mode = r.pick(['how-many', 'total']);
    const name = r.pick(NAMES);
    const rs = value => `Rs ${value}`;
    if (mode === 'how-many') {
      return question(family,
        r.pick([`How many Rs ${coin} coins make ${rs(total)}?`, `${name} pays ${rs(total)} with Rs ${coin} coins only. How many coins?`]),
        pieces, 'Count on in equal steps until you reach the amount.',
        `${pieces} coins of ${rs(coin)} make ${rs(total)}.`, { mode, coin, pieces },
        numberChoices(pieces, [[total - coin, 'coin-count'], [pieces + 1, 'coin-count'], [pieces - 1, 'coin-count'],
          [coin, 'coin-count'], [pieces + 2, 'coin-count']], count));
    }
    return question(family,
      r.pick([`${name} has ${pieces} coins of Rs ${coin}. How much money is that?`, `How much money is ${pieces} coins of Rs ${coin}?`]),
      rs(total), 'Count on by the value of one coin each time.',
      `${pieces} coins of ${rs(coin)} make ${rs(total)}.`, { mode, coin, pieces },
      numberChoices(rs(total), [[rs(pieces + coin), 'coin-count'], [rs(total + coin), 'coin-count'], [rs(total - coin), 'coin-count'],
        [rs(pieces), 'coin-count'], [rs(total + 10), 'place-shift']], count));
  }

  if (family === 'class-1-stack-order') {
    const order = r.shuffle(STACK_THINGS).slice(0, 4);
    const [top, middle, bottom, decoy] = order;
    const ask = r.pick(['top', 'middle', 'bottom']);
    const answer = { top, middle, bottom }[ask];
    const flip = level === 3 && r.int(0, 1) === 1;
    const statements = flip
      ? `The ${middle} is below the ${top}. The ${bottom} is below the ${middle}.`
      : `The ${top} is above the ${middle}. The ${middle} is above the ${bottom}.`;
    return question(family,
      `${statements} Which is at the ${ask}?`, answer, 'Draw the three things in a tower from the clues.',
      `From the top the order is ${top}, ${middle}, ${bottom}. The ${ask} is the ${answer}.`,
      { top, middle, bottom, ask },
      wordChoices(answer, r.shuffle([top, middle, bottom, decoy].filter(item => item !== answer)).map(item => [item, 'rank-endpoints']), count));
  }

  if (family === 'class-1-word-odd') {
    const [group, other] = r.shuffle(Object.keys(ODD_GROUPS)).slice(0, 2);
    const same = r.shuffle(ODD_GROUPS[group]).slice(0, 3);
    const answer = r.pick(ODD_GROUPS[other]);
    return question(family,
      r.pick([`Which one does not belong with the others?`, `${r.pick(NAMES)} sorts four words. Which is the odd one out?`,
        `Three words go together. Which one does not?`]),
      answer, 'Find what three of the words have in common.',
      `${same.join(', ')} are all ${group}. ${withArticle(answer)[0].toUpperCase()}${withArticle(answer).slice(1)} is not.`,
      { items: [...same, answer].sort() }, wordChoices(answer, same.map(item => [item, 'sorting-rule']), count));
  }

  if (family === 'class-1-word-analogy') {
    const [first, second] = r.shuffle(Object.keys(PAIRS)).slice(0, 2);
    const verbs = Object.values(PAIRS).filter(verb => verb !== PAIRS[second]);
    return question(family,
      r.pick([`${first} goes with ${PAIRS[first]}. ${second} goes with what?`,
        `${first} is to ${PAIRS[first]} as ${second} is to what?`]),
      PAIRS[second], 'Find how the first two words go together, then use the same link.',
      `${withArticle(first)[0].toUpperCase()}${withArticle(first).slice(1)} can ${PAIRS[first]} and ${withArticle(second)} can ${PAIRS[second]}.`,
      { first, second }, wordChoices(PAIRS[second],
        r.shuffle(verbs.filter(verb => verb !== PAIRS[first])).slice(0, 3).map(verb => [verb, 'class-1-analogy-link']), count));
  }

  if (family === 'class-1-equal-groups') {
    const mode = level === 1 ? r.pick(['share', 'groups']) : r.pick(['share', 'groups', 'afford']);
    const name = r.pick(NAMES);
    const items = r.pick(COUNT_THINGS);
    const [oneBox, manyBox] = r.pick([['plate', 'plates'], ['box', 'boxes'], ['bag', 'bags'], ['jar', 'jars'], ['tray', 'trays']]);
    const groups = r.int(2, 5);
    if (mode === 'afford') {
      const each = r.pick(level === 2 ? [5, 10, 20] : [5, 10, 20, 25]);
      const total = each * groups + (level === 3 ? r.int(1, each - 1) : 0);
      const toy = r.pick(BUY_THINGS);
      return question(family, `A ${toy} costs Rs ${each}. How many can ${name} buy with Rs ${total}?`, groups,
        'Count how many whole prices fit into the money.', `${groups} of them cost Rs ${each * groups}; one more would cost too much.`,
        { mode, total, groups, each }, numberChoices(groups, [[groups + 1, 'ignored-condition'], [groups - 1, 'missing-step'],
          [each, 'price-total'], [groups + 2, 'ignored-condition'], [total - each, 'wrong-operation']], count));
    }
    const each = r.int(2, level === 1 ? 5 : 10);
    const total = each * groups;
    if (mode === 'share') {
      return question(family, `${name} puts ${total} ${items} equally into ${groups} ${manyBox}. How many are in each ${oneBox}?`, each,
        'Share one at a time, or ask which number times the count makes the total.', `${groups} groups of ${each} make ${total}.`,
        { mode, total, groups, each }, numberChoices(each, [[total, 'ignored-change'], [groups, 'missing-step'],
          [each + 1, 'missing-step'], [each - 1, 'missing-step'], [total - groups, 'wrong-operation']], count));
    }
    return question(family, `There are ${groups} ${manyBox} with ${each} ${items} in each ${oneBox}. How many ${items} in all?`, total,
      'Add the same number again and again.', `${groups} groups of ${each} make ${total}.`,
      { mode, total, groups, each }, numberChoices(total, [[groups + each, 'wrong-operation'], [total + each, 'repeat-unit'],
        [total - each, 'repeat-unit'], [each, 'missing-step'], [total + 10, 'place-shift']], count));
  }

  if (family === 'class-1-time-shift') {
    const hour = r.int(1, 12);
    const minute = r.pick(level === 1 ? [0, 30] : level === 2 ? [0, 15, 30, 45] : [5, 10, 15, 20, 25, 35, 40, 45, 50, 55]);
    const wait = r.pick(level === 1 ? [30, 60] : level === 2 ? [15, 30, 45] : [15, 20, 25, 30, 40, 45]);
    const dir = r.int(0, 1) ? 1 : -1;
    const start = hour % 12 * 60 + minute;
    const answer = timeText(start + dir * wait);
    return question(family,
      `What time is ${wait} minutes ${dir > 0 ? 'after' : 'before'} ${timeText(start)}?`, answer,
      dir > 0 ? 'Count on, and move to the next hour after 60 minutes.' : 'Count back, and go to the hour before when passing zero.',
      `${wait} minutes ${dir > 0 ? 'after' : 'before'} ${timeText(start)} is ${answer}.`,
      { start, wait, dir }, wordChoices(answer, [
        [timeText(start - dir * wait), 'time-direction'],
        [timeText(Math.floor(start / 60) * 60 + ((minute + dir * wait) % 60 + 60) % 60), 'hour-carry'],
        [timeText(start + dir * wait + 60), 'hour-carry'], [timeText(start + dir * wait - 60), 'hour-carry'],
        [timeText(start + dir * wait + 5), 'missing-step'], [timeText(start + dir * wait - 5), 'missing-step'],
      ], count));
  }

  throw new Error(`Unknown class-1 text family: ${family}`);
}

export function solveText(question) {
  const givens = question.proof.givens;
  const options = question.options;
  const sortedNumbers = () => options.map(Number).sort((a, b) => a - b);
  switch (question.family) {
    case 'class-1-number-name': return givens.toWord ? numberWord(givens.n) : String(givens.n);
    case 'class-1-expanded-form': {
      const tens = Math.floor(givens.n / 10);
      const ones = givens.n % 10;
      return givens.mode === 'forward' ? `${tens * 10} + ${ones}` : String(givens.mode === 'number' ? givens.n
        : givens.mode === 'blank-ones' ? ones : tens);
    }
    case 'class-1-compare-numbers': return String(rankOf(sortedNumbers(), givens.ask));
    case 'class-1-add-story': return String(givens.op === 'add' ? givens.a + givens.b : givens.op === 'make' ? givens.b : givens.a - givens.b);
    case 'class-1-number-sentence': {
      const { op, a, b } = givens;
      return op === 'add' ? `${a} + ${b} = ${a + b}` : `${a} - ${b} = ${a - b}`;
    }
    case 'class-1-true-pair': {
      const holds = e => (e.plus ? e.a + e.b : e.a - e.b) === e.shown;
      const [one, two] = [holds(givens.first), holds(givens.second)];
      return one && two ? 'Both are true' : one ? 'Only sentence 1 is true' : two ? 'Only sentence 2 is true' : 'Neither is true';
    }
    case 'class-1-letter-gap': {
      const { start, step, direction, missing } = givens;
      return ALPHABET[start + direction * step * missing];
    }
    case 'class-1-word-repeat': return givens.unit[givens.shownCount % givens.unit.length];
    case 'class-1-shape-facts': {
      if (givens.mode === 'together') return String(SIDES[givens.bigger] + SIDES[givens.smaller]);
      if (givens.mode === 'more') return String(SIDES[givens.bigger] - SIDES[givens.smaller]);
      if (givens.mode === 'most' || givens.mode === 'fewest') {
        const ranked = [...options].sort((x, y) => SIDES[x] - SIDES[y]);
        return givens.mode === 'most' ? ranked[ranked.length - 1] : ranked[0];
      }
      if (givens.mode === 'sides' || givens.mode === 'corners') return String(SIDES[givens.shape]);
      const matches = options.filter(shape => (SIDES[shape] ?? 0) === givens.sides);
      if (matches.length !== 1) throw new Error('The shape clue needs exactly one answer.');
      return matches[0];
    }
    case 'class-1-real-solids': {
      if (givens.mode === 'solid') return Object.keys(SOLID_THINGS).find(key => SOLID_THINGS[key].includes(givens.thing));
      const matches = options.filter(option => SOLID_THINGS[givens.solid].includes(option));
      if (matches.length !== 1) throw new Error('The solid clue needs exactly one answer.');
      return matches[0];
    }
    case 'class-1-choose-unit': return UNIT_ORDER.find(unit => UNIT_THINGS[unit].includes(givens.thing));
    case 'class-1-length-story': {
      const { op, a, b } = givens;
      return `${op === 'join' ? a + b : a - b} cm`;
    }
    case 'class-1-days-months': {
      if (givens.prompt) return String(CALENDAR_FACTS.find(fact => fact.prompt === givens.prompt).answer);
      const list = givens.useMonths ? MONTHS : WEEKDAYS;
      const { mode, base, place } = givens;
      return list[mode === 'after' || mode === 'between' ? (base + 1) % list.length : mode === 'before'
        ? (base + list.length - 1) % list.length : mode === 'pair' ? (base + 2) % list.length : place - 1];
    }
    case 'class-1-equal-groups': {
      const { mode, total, groups, each } = givens;
      return String(mode === 'share' ? total / groups : mode === 'afford' ? Math.floor(total / each) : groups * each);
    }
    case 'class-1-time-shift': {
      const { start, wait, dir } = givens;
      return timeText(start + dir * wait);
    }
    case 'class-1-price-compare': return `Rs ${givens.high - givens.low}`;
    case 'class-1-note-count': return givens.mode === 'how-many' ? String(givens.pieces) : `Rs ${givens.coin * givens.pieces}`;
    case 'class-1-stack-order': return givens[givens.ask];
    case 'class-1-word-odd': {
      const groupOf = item => Object.keys(ODD_GROUPS).find(group => ODD_GROUPS[group].includes(item));
      const items = givens.items;
      if (items.join(',') !== [...options].sort().join(',')) throw new Error('The words changed.');
      const odd = items.filter(item => items.filter(other => groupOf(other) === groupOf(item)).length === 1);
      if (odd.length !== 1) throw new Error('There is no single odd one out.');
      return odd[0];
    }
    case 'class-1-word-analogy': return PAIRS[givens.second];
    default: throw new Error(`Unknown class-1 text family: ${question.family}`);
  }
}
