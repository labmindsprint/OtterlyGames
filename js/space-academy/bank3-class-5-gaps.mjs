// Class 5 question-bank gaps: crore place value, angle sense, logical word order, and figures hidden inside line figures.
import { MISCONCEPTIONS as SHARED, QuestionRetry, choiceCount, numberText } from './bank-shared.mjs';
import { TEMPLATE_NAMES, build, countRectangles, embedQuestion, hEdge, renderEmbed, retrying, solveEmbed, vEdge, boxEdges, union } from './bank3-gap-kit.mjs';
import { INK, ORANGE, clockDescription, clockFace, line, path, svg, text } from './diagram-kit.mjs';

export const GAP5_CODES = {
  'class-5-crore-place': { title: 'Indian places', message: 'Count places from the right: ones, tens, hundreds, thousands, ten thousands, lakhs, ten lakhs, crores.' },
  'class-5-crore-face': { title: 'Face value or place value', message: 'The face value is the digit. The place value is the digit times its place, such as 5 lakhs = 5,00,000.' },
  'class-5-crore-zero': { title: 'Keep empty places', message: 'When a part is missing, write zeros in its places so every digit stays in its own place.' },
  'class-5-crore-compare': { title: 'Compare from the left', message: 'With the same number of digits, compare the leftmost digits first, then the next ones.' },
  'class-5-angle-type': { title: 'Compare with a right angle', message: 'Acute is less than 90 degrees, right is exactly 90, obtuse is between 90 and 180, and straight is 180.' },
  'class-5-angle-turn': { title: 'Turns in degrees', message: 'A quarter turn is 90 degrees, a half turn is 180, three quarters is 270 and a full turn is 360.' },
  'class-5-angle-clock': { title: 'Angle between the hands', message: 'Each hour gap on a clock is 30 degrees. Use the smaller angle between the two hands.' },
  'class-5-word-rank': { title: 'Place in the order', message: 'Put every word in order first, then count to the place you are asked about.' },
  'class-5-word-reverse': { title: 'First or last', message: 'Check which end of the order starts the list: first step first, or last step first.' },
  'class-5-word-swap': { title: 'Two steps swapped', message: 'Test each step with the one before it. Two neighbours in the wrong order break the chain.' },
  'class-5-hidden-small': { title: 'Only the small ones', message: 'Squares can be made from several small squares. Count every size.' },
  'class-5-hidden-kind': { title: 'Squares are rectangles too', message: 'A square is a special rectangle. Read the question to see if squares are counted.' },
  'class-5-hidden-miss': { title: 'A shape was missed', message: 'Count in order: all one-box shapes, then two-box shapes, then bigger ones, so no shape is missed.' },
  'class-5-hidden-other': { title: 'A different figure', message: 'A hidden figure must match line for line. Check each line, not the overall look.' },
  'class-5-hidden-turned': { title: 'Turned or flipped', message: 'A flipped figure can look alike. Check if a turned copy fits, as the question allows.' },
  'class-5-hidden-near': { title: 'One line different', message: 'One extra or missing line makes a different figure, so it is not hidden.' },
  'class-5-hidden-found': { title: 'That one is hidden', message: 'This figure is hidden in the big one. The question asks for the figure that is not hidden.' },
};
const KNOWN = { ...SHARED, ...GAP5_CODES };

export const GAP5_FAMILIES = {
  'class-5-crore-places': { skill: 'place', title: 'Read and compare eight-digit numbers in crores and lakhs' },
  'class-5-angle-sense': { skill: 'angles', title: 'Name angles, turns and clock-hand angles' },
  'class-5-word-order': { skill: 'ranking', title: 'Put words in a logical order' },
  'class-5-hidden-count': { skill: 'shape', title: 'Count the squares and rectangles hidden in a grid' },
  'class-5-hidden-figure': { skill: 'shape', title: 'Find a figure hidden in a bigger line figure' },
};

export const DRAFT = {};
export const SOLVE = {};

// ---------------------------------------------------------------------------
// Crores and lakhs
// ---------------------------------------------------------------------------
const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'lakhs', 'ten lakhs', 'crores'];
const distinctDigits = (r, size) => {
  const digits = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, size);
  if (digits[0] === 0) digits.reverse();
  if (digits[0] === 0) throw new QuestionRetry('Leading zero');
  return digits;
};
const fromDigits = digits => Number(digits.join(''));
const scaled = (digit, place) => digit * 10 ** place;

DRAFT['class-5-crore-places'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['digit-at', 'value', 'write'] : level === 2 ? ['value', 'write', 'compare', 'digit-at'] : ['write', 'compare', 'step', 'value']);
  if (mode === 'digit-at') {
    const digits = distinctDigits(r, 8);
    const n = fromDigits(digits);
    const place = r.int(3, 7);
    const answer = String(digits[7 - place]);
    const wrongs = [place - 1, place + 1, place - 2, place + 2 > 7 ? 0 : place + 2, 7 - place].map(other => ({ value: String(digits[7 - Math.max(0, Math.min(7, other))]), code: 'class-5-crore-place' }));
    return build({
      family, known: KNOWN, count, prompt: `Which digit is in the ${PLACE_NAMES[place]} place of ${numberText(n)}?`, answer, wrongs,
      hint: 'Count places from the right. The commas group them as 3, 2, 2, 1.',
      explanation: `Counting from the right, the ${PLACE_NAMES[place]} place holds ${answer} in ${numberText(n)}.`, givens: { mode, digits, place },
    });
  }
  if (mode === 'value') {
    const digits = distinctDigits(r, 8);
    const n = fromDigits(digits);
    const place = r.int(3, 7);
    const digit = digits[7 - place];
    if (digit === 0) throw new QuestionRetry('Zero has no value');
    const wrongs = [
      { value: numberText(digit), code: 'class-5-crore-face' }, { value: numberText(scaled(digit, place - 1)), code: 'class-5-crore-place' },
      { value: numberText(scaled(digit, place + 1)), code: 'class-5-crore-place' }, { value: numberText(scaled(digit, place - 2)), code: 'class-5-crore-place' },
      { value: numberText(scaled(digit, place === 7 ? 3 : 7)), code: 'class-5-crore-place' },
    ];
    return build({
      family, known: KNOWN, count, prompt: `What is the place value of the digit ${digit} in ${numberText(n)}?`, answer: numberText(scaled(digit, place)), wrongs,
      hint: 'Find the digit, then say its place and write that value.',
      explanation: `The digit ${digit} is in the ${PLACE_NAMES[place]} place, so its place value is ${numberText(scaled(digit, place))}.`, givens: { mode, digits, digit },
    });
  }
  if (mode === 'write') {
    const parts = { crore: r.int(1, 9), lakh: r.int(10, 99), thousand: r.pick([0, 5, r.int(10, 99), r.int(10, 99)]), rest: r.pick([0, 7, r.int(100, 999), r.int(10, 99)]) };
    const n = parts.crore * 10 ** 7 + parts.lakh * 10 ** 5 + parts.thousand * 1000 + parts.rest;
    const given = [`${parts.crore} crore`, `${parts.lakh} lakh`, parts.thousand ? `${parts.thousand} thousand` : '', parts.rest ? `${parts.rest}` : ''].filter(Boolean).join(' ');
    const wrongs = [
      { value: numberText(n - parts.lakh * 10 ** 5 + parts.lakh * 10 ** 4), code: 'class-5-crore-place' },
      { value: numberText(parts.crore * 10 ** 6 + parts.lakh * 10 ** 5 + parts.thousand * 1000 + parts.rest), code: 'class-5-crore-place' },
      { value: numberText(n - parts.thousand * 1000 + parts.thousand * 100), code: 'class-5-crore-zero' },
      { value: numberText(parts.crore * 10 ** 7 + parts.lakh * 10 ** 5 + parts.thousand + parts.rest), code: 'class-5-crore-zero' },
      { value: numberText(n * 10), code: 'class-5-crore-place' },
    ];
    return build({
      family, known: KNOWN, count, prompt: `Which number is ${given}?`, answer: numberText(n), wrongs,
      hint: 'Write each part in its own places. Empty places hold zeros.',
      explanation: `${given} is written ${numberText(n)}, with zeros in any empty place.`, givens: { mode, parts },
    });
  }
  if (mode === 'compare') {
    const base = distinctDigits(r, 8);
    const list = [fromDigits(base)];
    while (list.length < count) {
      const copy = [...base];
      const a = r.int(0, 7);
      const b = r.int(0, 7);
      if (a === b || (a === 0 && copy[b] === 0) || (b === 0 && copy[a] === 0)) continue;
      [copy[a], copy[b]] = [copy[b], copy[a]];
      if (!list.includes(fromDigits(copy))) list.push(fromDigits(copy));
    }
    const greatest = Math.max(...list);
    const asking = r.pick(['greatest', 'smallest']);
    const answer = asking === 'greatest' ? greatest : Math.min(...list);
    return build({
      family, known: KNOWN, count, prompt: `Which is the ${asking} number: ${list.map(numberText).join(', ')}?`, answer: numberText(answer),
      wrongs: list.filter(value => value !== answer).map(value => ({ value: numberText(value), code: 'class-5-crore-compare' })),
      hint: 'All have eight digits. Compare from the left, digit by digit.',
      explanation: `All have eight digits, so compare from the left. The ${asking} number is ${numberText(answer)}.`, givens: { mode, list, asking },
    });
  }
  const n = distinctDigits(r, 8);
  const start = fromDigits(n);
  const place = r.pick([3, 4, 5, 6]);
  const amounts = [['1 thousand', 3], ['10 thousand', 4], ['1 lakh', 5], ['10 lakh', 6]];
  const [label, power] = amounts.find(item => item[1] === place);
  const stepValue = 10 ** power;
  if (start + stepValue >= 10 ** 8) throw new QuestionRetry('Too big');
  const wrongs = amounts.filter(item => item[1] !== power).map(item => ({ value: numberText(start + 10 ** item[1]), code: 'class-5-crore-place' }))
    .concat([{ value: numberText(start + stepValue * 10), code: 'class-5-crore-place' }]);
  return build({
    family, known: KNOWN, count, prompt: `What is ${label} more than ${numberText(start)}?`, answer: numberText(start + stepValue), wrongs,
    hint: 'Add to the right place only. The other digits stay the same.',
    explanation: `${label} adds one to the right place, so ${numberText(start)} becomes ${numberText(start + stepValue)}.`, givens: { mode, start, power },
  });
});
SOLVE['class-5-crore-places'] = question => {
  const g = question.proof.givens;
  if (g.mode === 'digit-at') return String(g.digits[7 - g.place]);
  if (g.mode === 'value') return numberText(scaled(g.digit, 7 - g.digits.indexOf(g.digit)));
  if (g.mode === 'write') return numberText(g.parts.crore * 10 ** 7 + g.parts.lakh * 10 ** 5 + g.parts.thousand * 1000 + g.parts.rest);
  if (g.mode === 'compare') return numberText(g.asking === 'greatest' ? Math.max(...g.list) : Math.min(...g.list));
  return numberText(g.start + 10 ** g.power);
};

// ---------------------------------------------------------------------------
// Angles
// ---------------------------------------------------------------------------
const kindOf = degrees => (degrees < 90 ? 'acute' : degrees === 90 ? 'right' : degrees < 180 ? 'obtuse' : degrees === 180 ? 'straight' : 'reflex');
const angleVisual = degrees => ({ kind: 'v3-class-5-angle', degrees, description: `Two rays meeting at a point, with an opening of ${degrees} degrees.` });
const clockAngle = minutes => {
  const hour = Math.floor((minutes % 720) / 60) % 12;
  const minute = minutes % 60;
  const diff = Math.abs(30 * hour + minute / 2 - 6 * minute);
  return diff > 180 ? 360 - diff : diff;
};
const TURN_WORDS = { 90: 'a quarter turn', 180: 'a half turn', 270: 'three quarters of a turn', 360: 'a full turn' };

DRAFT['class-5-angle-sense'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['type', 'picture', 'turn'] : level === 2 ? ['type', 'picture', 'turn', 'clock'] : ['clock', 'type', 'turn', 'clock', 'picture']);
  const kinds = ['acute', 'right', 'obtuse', 'straight'];
  if (mode === 'type') {
    const degrees = r.pick(level === 1 ? [25, 40, 55, 70, 90, 110, 125, 140, 155] : [20, 35, 45, 65, 90, 105, 120, 135, 150, 170, 180]);
    const answer = kindOf(degrees);
    const wrongs = kinds.filter(kind => kind !== answer).map(kind => ({ value: kind, code: 'class-5-angle-type' }));
    if (wrongs.length < count - 1) wrongs.push({ value: 'reflex', code: 'class-5-angle-type' });
    return build({
      family, known: KNOWN, count, prompt: `An angle measures ${degrees} degrees. What kind of angle is it?`, answer, wrongs,
      hint: 'Compare it with the corner of a page, which is 90 degrees.',
      explanation: `${degrees} degrees is ${degrees < 90 ? 'less than' : degrees === 90 ? 'exactly' : 'more than'} 90 degrees${degrees > 90 ? ' and not more than 180' : ''}, so it is ${answer === 'obtuse' ? 'obtuse' : answer}.`, givens: { mode, degrees },
    });
  }
  if (mode === 'picture') {
    const asked = r.pick(kinds.filter(kind => kind !== 'straight'));
    const sample = kind => r.pick({ acute: [25, 35, 45, 60, 75], right: [90], obtuse: [105, 120, 135, 150, 165], straight: [180] }[kind]);
    const degrees = sample(asked);
    const wrongKinds = kinds.filter(kind => kind !== asked);
    const wrongPictures = r.shuffle(wrongKinds).map(kind => sample(kind));
    const pictures = [degrees, ...wrongPictures];
    if (new Set(pictures).size < count) throw new QuestionRetry('Pictures repeat');
    return build({
      family, known: KNOWN, count, prompt: `Which picture shows ${asked === 'acute' || asked === 'obtuse' ? 'an' : 'a'} ${asked} angle?`,
      answer: `${degrees} degrees`, hint: 'A right angle looks like the corner of a page. Compare each picture with it.',
      explanation: `Only one picture shows ${asked === 'acute' || asked === 'obtuse' ? 'an' : 'a'} ${asked} angle. The other angles are bigger or smaller than that.`,
      givens: { mode, asked }, correctVisual: angleVisual(degrees),
      wrongs: wrongPictures.slice(0, count - 1).map(value => ({ value: `${value} degrees`, code: 'class-5-angle-type', visual: angleVisual(value) })),
    });
  }
  if (mode === 'turn') {
    const turns = r.pick([90, 180, 270, 360]);
    const spin = r.pick(['A wheel', 'A door', 'A robot', 'A dial']);
    const answer = `${turns} degrees`;
    const wrongs = [90, 180, 270, 360, 45].filter(value => value !== turns).map(value => ({ value: `${value} degrees`, code: 'class-5-angle-turn' }));
    return build({
      family, known: KNOWN, count, prompt: `${spin} makes ${TURN_WORDS[turns]}. How many degrees does it turn?`, answer, wrongs,
      hint: 'A full turn is 360 degrees. Split it into quarters.', explanation: `A full turn is 360 degrees, so ${TURN_WORDS[turns]} is ${turns} degrees.`, givens: { mode, turns },
    });
  }
  const hours = r.int(1, 12);
  const minutes = level === 3 && r.pick([true, false]) ? 30 : 0;
  const time = hours * 60 + minutes;
  const answerValue = clockAngle(time);
  if (!answerValue) throw new QuestionRetry('Hands overlap');
  const hour = hours % 12;
  const options = [360 - answerValue, Math.abs(30 * hour - 6 * minutes), answerValue + 30, Math.abs(answerValue - 30), answerValue + 90, 30 * hours, 30 * (hours % 12 || 12)]
    .filter(value => value > 0 && value < 360 && value !== answerValue);
  const wrongs = options.map(value => ({ value: `${value} degrees`, code: 'class-5-angle-clock' }));
  return build({
    family, known: KNOWN, count, prompt: `What is the smaller angle between the clock hands at ${hours}:${String(minutes).padStart(2, '0')}?`,
    answer: `${answerValue} degrees`, wrongs, hint: 'There are 12 hour gaps round the clock face. Each gap is the same angle.',
    explanation: `Count ${answerValue / 30} ${answerValue === 30 ? 'hour gap' : 'hour gaps'} between the hands. Each hour gap is 30 degrees. So the angle is ${answerValue} degrees.`,
    givens: { mode, time },
    visual: { kind: 'v3-class-5-angle-clock', time, description: `A clock showing ${clockDescription(time)}` },
  });
});
SOLVE['class-5-angle-sense'] = question => {
  const g = question.proof.givens;
  if (g.mode === 'type') return kindOf(g.degrees);
  if (g.mode === 'turn') return `${g.turns} degrees`;
  if (g.mode === 'clock') return `${clockAngle(g.time)} degrees`;
  const matching = question.optionVisuals.map((visual, index) => (kindOf(visual.degrees) === g.asked ? index : -1)).filter(index => index >= 0);
  if (matching.length !== 1) throw new Error('Exactly one picture must match.');
  return question.options[matching[0]];
};

// ---------------------------------------------------------------------------
// Logical word order
// ---------------------------------------------------------------------------
const CHAINS = [
  { topic: 'a plant growing', words: ['Seed', 'Sprout', 'Plant', 'Flower', 'Fruit'], first: 'first step' },
  { topic: 'a person growing', words: ['Baby', 'Child', 'Teenager', 'Adult', 'Elder'], first: 'youngest' },
  { topic: 'a day', words: ['Dawn', 'Morning', 'Noon', 'Evening', 'Night'], first: 'earliest' },
  { topic: 'lengths', words: ['Millimetre', 'Centimetre', 'Metre', 'Kilometre'], first: 'smallest' },
  { topic: 'water on its way to the sea', words: ['Drop', 'Stream', 'River', 'Sea'], first: 'first step' },
  { topic: 'making a roti', words: ['Wheat', 'Flour', 'Dough', 'Roti'], first: 'first step' },
  { topic: 'a butterfly growing', words: ['Egg', 'Larva', 'Pupa', 'Butterfly'], first: 'first step' },
  { topic: 'times', words: ['Second', 'Minute', 'Hour', 'Day', 'Week'], first: 'shortest' },
  { topic: 'shapes growing', words: ['Dot', 'Line', 'Square', 'Cube'], first: 'smallest' },
  { topic: 'writing', words: ['Letter', 'Word', 'Sentence', 'Page', 'Book'], first: 'smallest' },
  { topic: 'places', words: ['Room', 'House', 'Street', 'Town', 'Country'], first: 'smallest' },
  { topic: 'weights', words: ['Gram', 'Kilogram', 'Quintal', 'Tonne'], first: 'lightest' },
];
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];
DRAFT['class-5-word-order'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const chain = r.pick(CHAINS);
  const size = level === 1 ? 4 : chain.words.length;
  const start = r.int(0, chain.words.length - size);
  const words = chain.words.slice(start, start + size);
  const reverse = level >= 2 && r.pick([true, false]);
  const ordered = reverse ? [...words].reverse() : words;
  const shuffled = r.shuffle(words);
  if (shuffled.join() === words.join() || shuffled.join() === [...words].reverse().join()) throw new QuestionRetry('Not shuffled');
  const direction = reverse ? `${chain.first} last` : `${chain.first} first`;
  const base = `Put these words about ${chain.topic} in order, ${direction}: ${shuffled.join(', ')}.`;
  const mode = r.pick(level === 1 ? ['nth', 'list'] : ['nth', 'between', 'list', 'nth']);
  let prompt;
  let answer;
  let wrongs;
  let hint;
  let explanation;
  let givens;
  if (mode === 'nth') {
    const position = r.int(1, size);
    answer = ordered[position - 1];
    prompt = `${base} Which word is ${ORDINALS[position - 1]}?`;
    wrongs = [
      { value: [...ordered].reverse()[position - 1], code: 'class-5-word-reverse' }, { value: ordered[position % size], code: 'class-5-word-rank' },
      { value: ordered[(position + size - 2) % size], code: 'class-5-word-rank' }, { value: shuffled[position - 1], code: 'class-5-word-swap' }, { value: ordered[(position + 1) % size], code: 'class-5-word-rank' },
    ];
    hint = 'Write the words in order on a line, then count along.';
    explanation = `In order, the words are ${ordered.join(', ')}. The ${ORDINALS[position - 1]} word is ${answer}.`;
    givens = { mode, ordered, position };
  } else if (mode === 'between') {
    const at = r.int(1, size - 2);
    answer = ordered[at];
    prompt = `${base} Which word comes between ${ordered[at - 1]} and ${ordered[at + 1]}?`;
    wrongs = ordered.filter((_, index) => Math.abs(index - at) !== 0).map(value => ({ value, code: 'class-5-word-rank' }));
    hint = 'Put the words in order, then look between the two named words.';
    explanation = `In order, ${ordered[at - 1]} comes before ${answer}, and ${answer} comes before ${ordered[at + 1]}.`;
    givens = { mode, ordered, at };
  } else {
    answer = ordered.join(', ');
    prompt = `${base} Which is the correct order?`;
    const swap = index => ordered.map((word, i) => (i === index ? ordered[index + 1] : i === index + 1 ? ordered[index] : word));
    wrongs = [
      { value: [...ordered].reverse().join(', '), code: 'class-5-word-reverse' }, { value: swap(r.int(0, size - 2)).join(', '), code: 'class-5-word-swap' },
      { value: swap(size - 2).join(', '), code: 'class-5-word-swap' }, { value: [...ordered.slice(1), ordered[0]].join(', '), code: 'class-5-word-rank' },
      { value: swap(0).join(', '), code: 'class-5-word-swap' }, { value: shuffled.join(', '), code: 'class-5-word-rank' },
    ].filter(item => item.value.length <= 44);
    hint = 'Check each choice step by step against the real order.';
    explanation = `Each step comes after the one before it. In order, ${direction}, the words are ${answer}.`;
    givens = { mode, ordered };
  }
  return build({ family, known: KNOWN, count, prompt, answer, wrongs, hint, explanation, givens });
});
SOLVE['class-5-word-order'] = question => {
  const g = question.proof.givens;
  if (g.mode === 'nth') return g.ordered[g.position - 1];
  if (g.mode === 'between') return g.ordered[g.at];
  return g.ordered.join(', ');
};

// ---------------------------------------------------------------------------
// Hidden squares and rectangles
// ---------------------------------------------------------------------------
DRAFT['class-5-hidden-count'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const cols = level === 1 ? r.pick([2, 3]) : r.pick([3, 3, 4]);
  const rows = level === 1 ? r.pick([2, 3]) : r.pick([2, 3]);
  let edges = boxEdges(0, 0, cols, rows);
  for (let x = 1; x < cols; x++) edges = union(edges, Array.from({ length: rows }, (_, y) => vEdge(x, y)));
  for (let y = 1; y < rows; y++) edges = union(edges, Array.from({ length: cols }, (_, x) => hEdge(x, y)));
  {
    const inner = edges.filter(edge => {
      const [kind, pair] = [edge[0], edge.slice(1).split(',').map(Number)];
      return kind === 'h' ? pair[1] > 0 && pair[1] < rows : pair[0] > 0 && pair[0] < cols;
    });
    for (const edge of r.shuffle(inner).slice(0, r.int(level === 1 ? 0 : 1, level === 3 ? 3 : 2))) edges = edges.filter(item => item !== edge);
  }
  const tally = countRectangles(edges, cols, rows);
  const askSquares = r.pick(level === 1 ? [true] : [true, false, true]);
  const total = tally.squares + tally.others;
  const answer = askSquares ? tally.squares : total;
  if (answer < 3) throw new QuestionRetry('Too few shapes');
  const unit = Array.from({ length: cols * rows }, (_, i) => i).filter(i => {
    const x = i % cols;
    const y = Math.floor(i / cols);
    return [hEdge(x, y), hEdge(x, y + 1), vEdge(x, y), vEdge(x + 1, y)].every(edge => edges.includes(edge));
  }).length;
  const wrongs = [
    { value: unit, code: 'class-5-hidden-small' }, { value: askSquares ? total : tally.squares, code: 'class-5-hidden-kind' },
    { value: answer - 1, code: 'class-5-hidden-miss' }, { value: answer + 1, code: 'class-5-hidden-miss' }, { value: answer + 2, code: 'class-5-hidden-miss' },
  ].filter(item => item.value > 0).map(item => ({ value: String(item.value), code: item.code }));
  return build({
    family, known: KNOWN, count,
    prompt: askSquares ? 'How many squares of any size can you find in this figure?' : 'How many rectangles of any size can you find? Squares count as rectangles.',
    answer: String(answer), wrongs, hint: 'Count the small boxes first, then pairs of boxes, then bigger shapes.',
    explanation: askSquares ? `Counting squares of every size gives ${answer}.` : `Counting every rectangle, squares included, gives ${answer}.`,
    givens: { askSquares, cols, rows }, visual: { kind: 'v3-class-5-hidden-big', edges, cols, rows, turn: false, description: `A grid ${cols} boxes wide and ${rows} high drawn with ${edges.length} short lines.` },
  });
});
SOLVE['class-5-hidden-count'] = question => {
  const { askSquares, cols, rows } = question.proof.givens;
  const tally = countRectangles(question.visual.edges, cols, rows);
  return String(askSquares ? tally.squares : tally.squares + tally.others);
};

// ---------------------------------------------------------------------------
// Hidden figures
// ---------------------------------------------------------------------------
const HIDDEN_CODES = { other: 'class-5-hidden-other', turned: 'class-5-hidden-turned', near: 'class-5-hidden-near', found: 'class-5-hidden-found' };
DRAFT['class-5-hidden-figure'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['find', 'not'] : ['find', 'not', 'find']);
  const frame = level === 1 ? { cols: 5, rows: 4, extra: 5 } : level === 2 ? { cols: 6, rows: 4, extra: 7 } : { cols: 6, rows: 5, extra: 9 };
  const turning = level >= 2 && mode === 'find';
  return embedQuestion({
    family, known: KNOWN, count, r, level: level + 1, ...frame, mode, turning, kindPrefix: 'v3-class-5-hidden', names: TEMPLATE_NAMES.filter(name => name !== 'box' && name !== 'domino'), codes: HIDDEN_CODES, contexts: [0],
    prompt: () => (mode === 'find'
      ? `Which figure is hidden in the big figure?${turning ? ' You may turn it.' : ' Do not turn it.'}`
      : 'Three of the small figures are hidden in the big figure. Which one is NOT hidden?'),
    hint: 'Try one figure at a time. Every line of it must lie on a line of the big figure.',
    explanation: mode === 'find'
      ? 'Only this figure fits exactly on the lines of the big figure. Each other choice has a line that the big figure does not have.'
      : 'The other three fit on lines of the big figure. This one has a line that the big figure does not have.',
  });
});
SOLVE['class-5-hidden-figure'] = solveEmbed;

const rays = degrees => {
  const rad = degrees * Math.PI / 180;
  const cx = 40;
  const cy = 150;
  const reach = 130;
  const end = [cx + reach * Math.cos(rad), cy - reach * Math.sin(rad)];
  let body = line(cx, cy, cx + reach, cy, { stroke: INK, width: 5 }) + line(cx, cy, end[0], end[1], { stroke: INK, width: 5 });
  if (degrees === 90) body += path(`M${cx + 24} ${cy} V${cy - 24} H${cx}`, { stroke: ORANGE, strokeWidth: 3 });
  else body += path(`M${cx + 34} ${cy} A34 34 0 0 0 ${(cx + 34 * Math.cos(rad)).toFixed(1)} ${(cy - 34 * Math.sin(rad)).toFixed(1)}`, { stroke: ORANGE, strokeWidth: 3 });
  return body;
};
export function renderGaps(visual) {
  if (visual.kind === 'v3-class-5-angle') return svg(rays(visual.degrees), visual.description, 200, 180);
  if (visual.kind === 'v3-class-5-angle-clock') return svg(clockFace(visual.time, 110, 105, 90) + text(110, 213, 'Clock', { size: 16 }), visual.description, 220, 220);
  if (visual.kind.startsWith('v3-class-5-hidden')) return renderEmbed(visual, svg);
  return null;
}
