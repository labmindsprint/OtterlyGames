import { MISCONCEPTIONS as SHARED, QuestionRetry, answerChoices, wrong } from './bank-shared.mjs';

export const MISCONCEPTIONS = {
  'class-3-digit-swap': { title: 'Swapped digits', message: 'Keep each digit in its own place. Swapping two digits makes a different number.' },
  'class-3-nearest-end': { title: 'Nearest labelled mark', message: 'See which labelled mark is closer to the arrow, then use that value.' },
  'class-3-rule-step': { title: 'Same machine rule', message: 'Use the same rule on the new input. Do not switch to a different operation.' },
  'class-3-array-add': { title: 'Rows times columns', message: 'For an array, multiply the number of rows by the number in each row.' },
  'class-3-hidden-digit': { title: 'Missing column digit', message: 'The missing digit must make that column work, including a carry or regroup.' },
  'class-3-symbol-link': { title: 'Linked shape values', message: 'Find one shape from the first line, then use that value in the next line.' },
  'class-3-not-same-amount': { title: 'Same shaded amount', message: 'Match the shaded amount of the whole, even if the parts are cut differently.' },
  'class-3-angle-size': { title: 'Angle opening', message: 'Compare the opening with a square corner: smaller, the same, or wider.' },
  'class-3-grid-count': { title: 'Squares or outer edges', message: 'Count filled squares for area. Count only exposed outer edges for perimeter.' },
  'class-3-tower-stack': { title: 'Cubes in a stack', message: 'Count every cube in the stack, including the cubes hidden underneath.' },
  'class-3-sensible-unit': { title: 'Sensible unit', message: 'Pick the unit that matches the real size of the object, then convert if needed.' },
  'class-3-clock-swap': { title: 'Hour and minute hands', message: 'The short hand shows the hour. The long hand shows the minutes.' },
  'class-3-weekday-shift': { title: 'Counting days forward', message: 'Start at the known date and count forward one day at a time.' },
  'class-3-coin-value': { title: 'Value on the coin', message: 'Add the value printed on each coin or note. Do not just count the pieces.' },
  'class-3-offer-each': { title: 'Price of one item', message: 'Compare the cost of one item in each offer, not only the pack price.' },
  'class-3-budget-fit': { title: 'Budget and required items', message: 'The purchase must include every required item and stay within the money.' },
  'class-3-half-symbol': { title: 'Half a pictograph symbol', message: 'A half symbol stands for half of the key, not for a whole symbol.' },
  'class-3-true-line': { title: 'Statement matches the data', message: 'Check each sentence against the numbers. Only one sentence is fully true.' },
  'class-3-rank-total': { title: 'Ranks from both ends', message: 'Add the rank from the front and the rank from the back, then subtract 1.' },
  'class-3-shift-letter': { title: 'Same letter shift', message: 'Move every letter the same number of places. Keep the order of the letters.' },
  'class-3-compass-step': { title: 'Compass grid steps', message: 'East and west change the letter. North and south change the number.' },
  'class-3-path-block': { title: 'Routes around a block', message: 'Count only routes that stay on the streets and avoid a blocked crossing.' },
  'class-3-ways-product': { title: 'Pairs of choices', message: 'Multiply the choices in each group, then take away any pair the rule forbids.' },
  'class-3-exactly-one': { title: 'Exactly one true clue', message: 'Keep a code only when exactly one clue is true. Zero or two true clues do not fit.' },
  'class-3-whole-count': { title: 'Whole shapes count too', message: 'Count the whole circles first, then read the fraction of the last circle.' },
  'class-3-unequal-cut': { title: 'Equal parts only', message: 'A fraction needs equal parts. Check that every part is exactly the same size.' },
  'class-3-order-direction': { title: 'Order direction', message: 'Smallest to greatest puts the smallest first and the greatest last.' },
  'class-3-scale-both': { title: 'Equal fractions', message: 'Multiply or divide the top and the bottom by the same number. Adding does not keep it equal.' },
  'class-3-add-denominators': { title: 'Adding fractions', message: 'When the parts are the same size, add the tops and keep the bottom the same.' },
  'class-3-unit-carry': { title: 'Carry to the bigger unit', message: 'When the small units reach 100, 1000 or 60, carry 1 into the bigger unit.' },
  'class-3-letter-reuse': { title: 'Use each letter once', message: 'A word can use a letter only as many times as the given word has it.' },
  'class-3-pattern-period': { title: 'Find the whole pattern', message: 'Find how often each feature repeats. Colour and shape can repeat at different speeds.' },
  'class-3-rule-flip': { title: 'Same rule for every pair', message: 'Find the rule in the first pair, then use the very same rule on the second pair.' },
  'class-3-code-chain': { title: 'Use the code word', message: 'First find the real thing, then change it with the code. Do not skip the code step.' },
  'class-3-order-clue': { title: 'Order from the clues', message: 'Put the clues in one line from first to last, then read off the place asked.' },
};

export const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

export const NAMES = ['Mira', 'Arun', 'Zara', 'Leo', 'Nia', 'Omar', 'Priya', 'Sam', 'Tara', 'Dev', 'Kiran', 'Anya', 'Rohan', 'Meera', 'Isha', 'Kabir'];
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const clean = value => String(value).replace(/\s+/g, ' ').trim();

export function person(r) {
  return r.pick(NAMES);
}

export function hook(r, rest) {
  return rest;
}

export function q(spec) {
  const prompt = clean(spec.prompt);
  const hint = clean(spec.hint);
  const explanation = clean(spec.explanation);
  const words = prompt.split(/\s+/).length;
  if (prompt.length > 200 || words > 36) throw new Error(`LONG PROMPT ${spec.family} (${prompt.length}/${words}): ${prompt}`);
  if (hint.length > 140) throw new Error(`LONG HINT ${spec.family}: ${hint}`);
  if (explanation.length > 260) throw new Error(`LONG EXPL ${spec.family}: ${explanation}`);
  if (/^\d{2,}$/.test(String(spec.answer)) && new RegExp(`(^|\\D)${spec.answer}(\\D|$)`).test(hint)) throw new Error(`HINT LEAK ${spec.family}: ${hint}`);
  const pictured = spec.choices.some(choice => choice.visual);
  const choices = spec.choices.map(choice => {
    const value = String(choice.value);
    if (!pictured && value.length > 44) throw new Error(`LONG OPTION ${spec.family}: ${value}`);
    if (!choice.visual) return { ...choice, value };
    const description = clean(choice.visual.description);
    if (description.length < 8) throw new Error(`SHORT CHOICE DESC ${spec.family}`);
    return { ...choice, value, visual: { ...choice.visual, description } };
  });
  let visual;
  if (spec.visual) {
    const description = clean(spec.visual.description);
    if (description.length < 15) throw new Error(`SHORT DESC ${spec.family}: ${description}`);
    visual = { ...spec.visual, description };
  }
  return {
    family: spec.family,
    prompt,
    answer: String(spec.answer),
    hint,
    explanation,
    proof: { family: spec.family, givens: spec.givens },
    ...(visual ? { visual } : {}),
    choices,
  };
}

export function numberChoices(r, answer, codes, bounds = {}) {
  const min = bounds.min ?? 0;
  const max = bounds.max ?? 9999;
  const count = bounds.count ?? 4;
  const target = Number(answer);
  const mode = bounds.mode ?? r.int(0, 2);
  const steps = [1, 2, 3, 4, 5, 6, 8, 10, 12, 20, 25, 50];
  const build = sign => {
    const pool = [];
    const seen = new Set([String(target)]);
    steps.forEach((step, index) => {
      const value = target + sign * step;
      if (!Number.isInteger(value) || value < min || value > max) return;
      const text = String(value);
      if (seen.has(text)) return;
      seen.add(text);
      pool.push(wrong(value, codes[index % codes.length]));
    });
    return pool;
  };
  const up = build(1);
  const down = build(-1);
  const both = [];
  for (let index = 0; index < Math.max(up.length, down.length); index++) {
    if (up[index]) both.push(up[index]);
    if (down[index]) both.push(down[index]);
  }
  let pool = mode === 0 ? up : mode === 1 ? down : both;
  if (pool.length < count - 1) pool = both;
  if (pool.length < count - 1) throw new QuestionRetry('not enough numeric choices');
  return answerChoices(target, pool, count, null, KNOWN);
}

export function textChoices(answer, alts, count = 4) {
  return answerChoices(answer, alts, count, null, KNOWN);
}

export function biased(r, answer, named, bounds = {}) {
  const target = Number(answer);
  const min = bounds.min ?? 0;
  const max = bounds.max ?? 9999;
  const count = bounds.count ?? 4;
  const mode = bounds.mode ?? r.int(0, 2);
  const custom = named[0]?.code;
  const seen = new Set([String(target)]);
  const smaller = [];
  const larger = [];
  const push = (value, code) => {
    if (!Number.isInteger(value) || value < min || value > max || seen.has(String(value))) return;
    seen.add(String(value));
    (value < target ? smaller : larger).push(wrong(value, code));
  };
  named.forEach(item => push(Number(item.value), item.code));
  const filler = sideName => (custom && !(sideName === 'up' ? larger : smaller).some(item => item.code === custom) ? custom : 'missing-step');
  [1, 2, 3, 4, 5, 6, 8, 10, 12, 20, 25, 50].forEach(step => {
    push(target + step, filler('up'));
    push(target - step, filler('down'));
  });
  const side = mode === 0 ? larger : mode === 1 ? smaller : null;
  let pool = side ? [...side] : [];
  if (!side) {
    for (let index = 0; index < Math.max(larger.length, smaller.length); index++) {
      if (larger[index]) pool.push(larger[index]);
      if (smaller[index]) pool.push(smaller[index]);
    }
  }
  if (custom && !pool.slice(0, count - 1).some(item => item.code === custom)) {
    const spare = (side || [...larger, ...smaller]).find(item => item.code === custom);
    if (spare) pool = [spare, ...pool.filter(item => item !== spare)];
  }
  if (pool.length < count - 1) pool = [...larger, ...smaller];
  if (pool.length < count - 1) throw new QuestionRetry('not enough numeric choices');
  return answerChoices(target, pool, count, null, KNOWN);
}

export function pictureChoices(answer, visual, alts, count = 4) {
  return answerChoices(answer, alts, count, visual, KNOWN);
}

export function matchPictures(question, keyOf) {
  if (!question.optionVisuals) throw new Error('Picture choices are missing.');
  question.optionVisuals.forEach((visual, index) => {
    if (!visual || keyOf(visual) !== question.options[index]) throw new Error('A picture choice does not match its label.');
  });
}

export function rs(value) {
  return `Rs ${value}`;
}

export function clockLabel(hour, minute) {
  const shown = ((hour % 12) + 12) % 12 || 12;
  return `${shown}:${String(minute).padStart(2, '0')}`;
}

export function clock24(hour, minute) {
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

export function addMinutes(hour, minute, delta) {
  const total = hour * 60 + minute + delta;
  return { hour: Math.floor(total / 60), minute: ((total % 60) + 60) % 60, total };
}

export function fractionText(numerator, denominator) {
  return `${numerator}/${denominator}`;
}

export function equivalent(a, b, c, d) {
  return a * d === b * c;
}
