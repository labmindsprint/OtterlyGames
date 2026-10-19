import { QuestionRetry, answerChoices, wrong, choiceCount, sum, numberText } from './bank-shared.mjs';
import { INK, GREEN, ORANGE, PAPER, svg, text, line, rect, circle, path, icon } from './diagram-kit.mjs';

export const NUMBER_FAMILIES = [
  'abacus-read', 'abacus-change', 'abacus-combine', 'number-clues', 'number-build',
  'number-compare', 'roman-number', 'picture-add', 'bar-unknown', 'equal-groups',
  'sharing-remainder', 'two-stage', 'symbol-equations', 'digit-algorithm',
  'number-pattern', 'alternating-pattern', 'fraction-picture', 'fraction-change',
  'fraction-group', 'fraction-left', 'fraction-compare', 'fraction-statements',
  'decimal-model', 'decimal-context', 'decimal-statements', 'factor-compare',
  'factor-application',
];

const PREFIX = 'v2-number-';
const clone = value => JSON.parse(JSON.stringify(value));
const facts = ({ kind, description, ...givens }) => givens;
const diagram = (type, givens, description) => ({ kind: `${PREFIX}${type}`, description, ...givens });
const assert = (condition, message) => { if (!condition) throw new Error(`Number-bank proof: ${message}`); };
const equal = (actual, expected, message) => assert(JSON.stringify(actual) === JSON.stringify(expected), message);
const integer = (value, minimum = 0) => Number.isSafeInteger(value) && value >= minimum;
const decimal = cents => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
const onlyIntegers = alternatives => alternatives.filter(item => {
  const value = Number(item.value);
  return Number.isSafeInteger(value) && value >= 0;
});
const PLACE_NAMES = {
  1: 'ones', 10: 'tens', 100: 'hundreds', 1000: 'thousands',
  10000: 'ten-thousands', 100000: 'lakhs', 1000000: 'ten-lakhs', 10000000: 'crores',
};
const PLACE_SHORT = { 1: 'O', 10: 'T', 100: 'H', 1000: 'Th', 10000: 'TTh', 100000: 'L', 1000000: 'TL', 10000000: 'Cr' };
const widthFor = (grade, r) => grade.year <= 1 ? 2 : grade.year <= 3 ? grade.year + 1 : r.pick(grade.year === 4 ? [5, 6] : [7, 8]);
const rodsFor = (value, width) => {
  assert(integer(value) && value < 10 ** width, 'an abacus number does not fit its rods');
  return Array.from({ length: width }, (_, index) => {
    const place = 10 ** (width - index - 1);
    return { place, beads: Math.floor(value / place) % 10 };
  });
};
function readRods(rods) {
  assert(Array.isArray(rods) && rods.length > 0 && rods.length <= 8, 'invalid abacus rods');
  rods.forEach((rod, index) => {
    assert(rod.place === 10 ** (rods.length - index - 1), 'abacus rods must include every place in descending order');
    assert(integer(rod.beads) && rod.beads <= 9, 'an abacus rod needs zero to nine beads');
  });
  return sum(rods.map(rod => rod.place * rod.beads));
}
const rodDescription = rods => rods.map(rod => `${rod.beads} on the ${PLACE_NAMES[rod.place]} rod`).join('; ');
const abacus = (value, width, label = '') => {
  const rods = rodsFor(value, width);
  return diagram('abacus', { rods, label }, `${label ? `${label}. ` : ''}Abacus: ${rodDescription(rods)}. Each bead has the value of its labelled rod.`);
};
const PLACE_SINGULAR = name => (name.endsWith('s') ? name.slice(0, -1) : name);
// Frozen banks 1 and 2 keep "1 tens"; only bank 3 drafts (singular = true) say "1 ten".
let singular = false;
const abacusKeyWith = (rods, useSingular) => `Abacus: ${rods.map(rod => `${rod.beads} ${useSingular && rod.beads === 1 ? PLACE_SINGULAR(PLACE_NAMES[rod.place]) : PLACE_NAMES[rod.place]}`).join('; ')}`;
const abacusKey = rods => abacusKeyWith(rods, singular);
function changeRods(rods, from, to) {
  const changed = clone(rods);
  const source = changed.find(rod => rod.place === from);
  const destination = changed.find(rod => rod.place === to);
  assert(source && destination && from !== to && source.beads > 0 && destination.beads < 9, 'a bead transfer is not possible');
  source.beads--;
  destination.beads++;
  return changed;
}
function swapPlaces(value, places, width) {
  if (!places) return value;
  const rods = rodsFor(value, width);
  const first = rods.find(rod => rod.place === places[0]);
  const second = rods.find(rod => rod.place === places[1]);
  assert(first && second && first !== second, 'invalid digit swap');
  [first.beads, second.beads] = [second.beads, first.beads];
  return readRods(rods);
}
const numericAbacusWrongs = (values, width) => onlyIntegers(values)
  .filter(item => Number(item.value) < 10 ** width)
  .map(item => ({ ...item, visual: abacus(Number(item.value), width) }));

function complete(family, grade, body) {
  const { proof = {}, ...rest } = body;
  return {
    ...rest,
    proof: { family, ...proof, ...(body.visual ? { diagram: clone(facts(body.visual)) } : {}) },
  };
}
function numeric(family, grade, body, value, alternatives, optionVisual = null) {
  const withinGrade = grade.year === 0 ? alternatives.filter(item => !Number.isFinite(Number(item.value)) || Number(item.value) < 20) : alternatives;
  return complete(family, grade, {
    ...body, answer: String(value),
    choices: answerChoices(value, withinGrade, choiceCount(grade), optionVisual),
  });
}
const gridFor = (denominator, numerator) => {
  assert(integer(denominator, 1) && integer(numerator) && numerator <= denominator, 'invalid equal-part grid');
  const rows = denominator > 5 && denominator % 2 === 0 ? 2 : 1;
  return Array.from({ length: rows }, (_, row) => Array.from({ length: denominator / rows }, (_, column) =>
    row * denominator / rows + column < numerator ? 1 : 0));
};
function readFraction(cells) {
  assert(Array.isArray(cells) && cells.length > 0 && Array.isArray(cells[0]) && cells[0].length > 0, 'missing equal parts');
  assert(cells.every(row => Array.isArray(row) && row.length === cells[0].length && row.every(value => value === 0 || value === 1)), 'fraction cells must be equal, rectangular, and either shaded or unshaded');
  return { numerator: sum(cells.flat()), denominator: cells.length * cells[0].length };
}
const fractionKey = cells => {
  const { numerator, denominator } = readFraction(cells);
  return `${numerator}/${denominator} shaded`;
};
const fractionDiagram = (denominator, numerator, label = '') => diagram('fraction',
  { cells: gridFor(denominator, numerator), label },
  `${label ? `${label}. ` : ''}One whole divided into ${denominator} equal parts; ${numerator} parts are shaded and hatched, ${denominator - numerator} are unshaded.`);
const fractionWrong = (denominator, numerator, code) => {
  const visual = fractionDiagram(denominator, numerator);
  return wrong(fractionKey(visual.cells), code, visual);
};
const fractionBoard = panels => diagram('fraction-board', { panels },
  `All panels are equal-sized wholes. ${panels.map(panel => `${panel.label}: ${fractionDiagram(readFraction(panel.cells).denominator, readFraction(panel.cells).numerator).description}`).join(' ')}`);
const STATEMENTS = ['Both statements are true', 'Only statement 1 is true', 'Only statement 2 is true', 'Neither statement is true'];
const statementKey = (first, second) => STATEMENTS[first ? (second ? 0 : 1) : (second ? 2 : 3)];
const statementChoices = (answer, codes) => answerChoices(answer, STATEMENTS.filter(value => value !== answer).map((value, index) => wrong(value, codes[index])));
function permutations(digits) {
  const results = [];
  const visit = (prefix, remaining) => {
    if (!remaining.length) { results.push(Number(prefix.join(''))); return; }
    const used = new Set();
    remaining.forEach((digit, index) => {
      if (used.has(digit) || (!prefix.length && digit === 0)) return;
      used.add(digit);
      visit([...prefix, digit], remaining.filter((_, position) => position !== index));
    });
  };
  visit([], digits);
  return results.sort((a, b) => a - b);
}
function extremeDigits(digits, order) {
  const sorted = [...digits].sort((a, b) => order === 'smallest' ? a - b : b - a);
  if (sorted[0] === 0) {
    const firstNonzero = sorted.findIndex(digit => digit !== 0);
    assert(firstNonzero >= 0, 'a number cannot have only zero digits');
    [sorted[0], sorted[firstNonzero]] = [sorted[firstNonzero], sorted[0]];
  }
  return Number(sorted.join(''));
}
function obeysBuild(value, proof) {
  return (!proof.parity || value % 2 === (proof.parity === 'even' ? 0 : 1))
    && (!proof.limit || (proof.limit.direction === 'greater' ? value > proof.limit.value : value < proof.limit.value));
}
function clueHolds(digits, rule) {
  if (rule.kind === 'sum') return sum(rule.positions.map(position => digits[position])) === rule.total;
  if (rule.kind === 'difference') return digits[rule.left] - digits[rule.right] === rule.difference;
  if (rule.kind === 'parity') return Number(digits.join('')) % 2 === rule.remainder;
  if (rule.kind === 'digit-between') return digits[rule.position] > rule.lower && digits[rule.position] < rule.upper;
  throw new Error(`Unknown digit clue: ${rule.kind}`);
}
function clueCandidates(proof) {
  assert(integer(proof.width, 1) && proof.width <= 8 && integer(proof.tailWidth, 1) && proof.tailWidth <= 3, 'invalid digit-clue width');
  assert(typeof proof.prefix === 'string' && /^\d*$/.test(proof.prefix) && proof.prefix.length + proof.tailWidth === proof.width, 'digit-clue prefix does not fit');
  const candidates = [];
  for (let tail = 0; tail < 10 ** proof.tailWidth; tail++) {
    const word = proof.prefix + String(tail).padStart(proof.tailWidth, '0');
    if (word[0] === '0') continue;
    const digits = [...word].map(Number);
    candidates.push({ value: Number(word), matches: proof.rules.map(rule => clueHolds(digits, rule)) });
  }
  return candidates;
}
function clueText(rule, width) {
  const name = position => PLACE_NAMES[10 ** (width - position - 1)];
  if (rule.kind === 'sum') return `The ${rule.positions.map(name).join(', ')} digits add to ${rule.total}.`;
  if (rule.kind === 'difference') return `The ${name(rule.left)} digit is ${rule.difference} more than the ${name(rule.right)} digit.`;
  if (rule.kind === 'digit-between') return `The ${name(rule.position)} digit is greater than ${rule.lower} and less than ${rule.upper}.`;
  return `The whole number is ${rule.remainder ? 'odd' : 'even'}.`;
}
const ROMAN_DIGITS = [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
function toRoman(value) {
  let remaining = value;
  let output = '';
  for (const [word, amount] of ROMAN_DIGITS) while (remaining >= amount) { output += word; remaining -= amount; }
  return output;
}
function fromRoman(word) {
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  assert(typeof word === 'string' && /^[IVXLCDM]+$/.test(word), 'invalid Roman numeral');
  let total = 0;
  for (let index = 0; index < word.length; index++) total += values[word[index]] < (values[word[index + 1]] ?? 0) ? -values[word[index]] : values[word[index]];
  assert(total > 0 && total < 4000 && toRoman(total) === word, 'noncanonical Roman numeral');
  return total;
}
function sequenceValue(values, alternating = false) {
  assert(Array.isArray(values) && values.filter(value => value === null).length === 1, 'a sequence needs exactly one gap');
  values.forEach(value => assert(value === null || integer(value), 'invalid sequence term'));
  const gap = values.indexOf(null);
  const lane = alternating ? gap % 2 : 0;
  const positions = values.map((value, index) => ({ value, index })).filter(item =>
    item.value !== null && (!alternating || item.index % 2 === lane));
  assert(positions.length >= 2, 'not enough shown terms to determine the rule');
  const [first, second] = positions;
  const stride = alternating ? 2 : 1;
  const step = (second.value - first.value) / ((second.index - first.index) / stride);
  assert(Number.isSafeInteger(step) && step !== 0, 'the sequence has no whole-number step');
  positions.forEach(item => assert(item.value === first.value + (item.index - first.index) / stride * step, 'inconsistent sequence rule'));
  if (alternating) {
    const other = values.filter((_, index) => index % 2 !== lane);
    assert(other.length >= 2, 'the other number rule is not shown');
    const difference = other[1] - other[0];
    assert(Number.isSafeInteger(difference) && difference !== 0 && other.every((value, index) => value === other[0] + index * difference), 'inconsistent second sequence rule');
  }
  const value = first.value + (gap - first.index) / stride * step;
  assert(integer(value), 'the missing sequence term is not a nonnegative integer');
  return { value, step };
}
const coefficient = (terms, symbol) => terms.filter(term => term === symbol).length;
function solveSymbols(equations, target) {
  assert(Array.isArray(equations) && equations.length === 2 && Array.isArray(target), 'two symbol relations are required');
  const symbols = [...new Set(equations.flatMap(row => row.terms))];
  assert(symbols.length === 2 && symbols.every(symbol => ['star', 'circle'].includes(symbol)) && target.every(symbol => symbols.includes(symbol)), 'invalid pictorial symbols');
  const [a, b] = symbols;
  const [first, second] = equations;
  const [aa, ab, ba, bb] = [coefficient(first.terms, a), coefficient(first.terms, b), coefficient(second.terms, a), coefficient(second.terms, b)];
  const determinant = aa * bb - ab * ba;
  assert(determinant !== 0, 'the pictorial equations do not determine both symbols');
  const av = (first.total * bb - second.total * ab) / determinant;
  const bv = (aa * second.total - ba * first.total) / determinant;
  assert(integer(av, 1) && integer(bv, 1), 'symbol values must be positive whole numbers');
  return { value: sum(target.map(symbol => symbol === a ? av : bv)), values: { [a]: av, [b]: bv } };
}
function calculationCandidates(model) {
  assert(/^[\d□]+$/.test(model.topMask) && /^[\d□]+$/.test(model.bottomMask) && integer(model.factor, 2) && model.factor <= 9, 'invalid written multiplication');
  assert(model.topMask.includes('□'), 'the calculation needs a missing digit');
  const results = [];
  for (let digit = 0; digit <= 9; digit++) {
    const top = model.topMask.replaceAll('□', String(digit));
    const bottom = model.bottomMask.replaceAll('□', String(digit));
    if (top[0] === '0' || bottom[0] === '0') continue;
    if (Number(top) * model.factor === Number(bottom)) results.push(digit);
  }
  return results;
}
function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}
const lcm = (a, b) => a / gcd(a, b) * b;
const DRAFTS = {};

DRAFTS['abacus-read'] = (family, grade, level, r) => {
  const width = widthFor(grade, r);
  const value = grade.year === 0 ? r.int(11, 19) : r.int(10 ** (width - 1), 10 ** width - 1);
  const visual = abacus(value, width);
  const digits = visual.rods.map(rod => rod.beads);
  return numeric(family, grade, {
    prompt: 'What number does this labelled abacus show?', visual,
    explanation: `${rodDescription(visual.rods)}. Multiply each bead count by its place value and add: ${visual.rods.map(rod => `${rod.beads} × ${numberText(rod.place)}`).join(' + ')} = ${numberText(value)}.`,
    hint: 'Read the labelled rods from the largest place to the ones, keeping empty rods as zero.',
  }, value, [
    wrong(sum(digits), 'face-value'), wrong(Number([...digits].reverse().join('')), 'place-shift'),
    wrong(visual.rods[0].beads * visual.rods[0].place, 'ignored-zero'), wrong(digits.at(-1), 'place-shift'),
    wrong(Number(digits.filter(digit => digit !== 0).join('')), 'ignored-zero'),
  ]);
};

DRAFTS['abacus-change'] = (family, grade, level, r) => {
  const width = widthFor(grade, r);
  const digits = Array.from({ length: width }, (_, index) => r.int(index ? 0 : 1, 8));
  const initial = Number(digits.join(''));
  const visual = abacus(initial, width, 'Before the move');
  const source = r.pick(visual.rods.filter(rod => rod.beads > 0));
  const destination = r.pick(visual.rods.filter(rod => rod.place !== source.place && rod.beads < 9));
  const from = source.place;
  const to = destination.place;
  const changed = readRods(changeRods(visual.rods, from, to));
  const swap = level === 3 ? [10, 1] : null;
  const value = swapPlaces(changed, swap, width);
  if (swap && (changed === value || value < 10 ** (width - 1))) throw new QuestionRetry('The linked digit swap must change a full-width number.');
  return numeric(family, grade, {
    prompt: `Move one bead from the ${PLACE_NAMES[from]} rod to the ${PLACE_NAMES[to]} rod.${swap ? ' Then exchange the digits on the tens and ones rods.' : ''} Which abacus shows the final number?`,
    visual, proof: { from, to, swap },
    explanation: `The move removes ${numberText(from)} and adds ${numberText(to)}, so ${numberText(initial)} − ${numberText(from)} + ${numberText(to)} = ${numberText(changed)}.${swap ? ` Now exchange its tens and ones digits to get ${numberText(value)}.` : ` The final number is ${numberText(value)}.`}`,
    hint: 'Update both rods before doing anything else.',
  }, value, numericAbacusWrongs([
    wrong(initial, 'ignored-change'), wrong(initial - from, 'place-shift'), wrong(initial + to, 'place-shift'),
    wrong(changed, 'missing-step'), wrong(initial + from - to, 'reversed-operation'),
  ], width), abacus(value, width));
};

DRAFTS['abacus-combine'] = (family, grade, level, r) => {
  const width = widthFor(grade, r);
  const low = grade.year === 1 ? 12 : 110;
  const high = grade.year === 1 ? 44 : 440;
  const a = r.int(low, high);
  const b = r.int(low, high);
  const panels = [abacus(a, width, 'A'), abacus(b, width, 'B')].map(panel => ({ label: panel.label, rods: panel.rods }));
  const visual = diagram('abacus-pair', { panels }, panels.map(panel => `Abacus ${panel.label}: ${rodDescription(panel.rods)}.`).join(' '));
  const total = a + b;
  const swap = [10, 1];
  const value = swapPlaces(total, swap, width);
  if (value === total || value < 10 ** (width - 1)) throw new QuestionRetry('The sum needs a meaningful digit exchange.');
  return numeric(family, grade, {
    prompt: 'Add the numbers on abacuses A and B. In the sum, exchange the tens and ones digits. What number do you get?',
    visual, proof: { swap },
    explanation: `First add ${numberText(a)} + ${numberText(b)} = ${numberText(total)}, regrouping if a rod reaches ten. Only then exchange the tens and ones digits: ${numberText(value)}.`,
    hint: 'Add first. Exchanging digits in the starting numbers is a different operation.',
  }, value, numericAbacusWrongs([
    wrong(total, 'missing-step'), wrong(swapPlaces(a, swap, width) + b, 'ignored-condition'),
    wrong(a + swapPlaces(b, swap, width), 'ignored-condition'),
    wrong(swapPlaces(a, swap, width) + swapPlaces(b, swap, width), 'place-shift'),
    wrong(sum(panels.flatMap(panel => panel.rods.map(rod => rod.beads))), 'face-value'),
  ], width), abacus(value, width));
};

DRAFTS['number-clues'] = (family, grade, level, r) => {
  const width = widthFor(grade, r);
  const tailWidth = grade.year <= 1 || level === 2 ? 2 : 3;
  let prefix = '';
  const rules = [];
  if (grade.year === 0) {
    prefix = '1';
    const ones = r.int(2, 8);
    rules.push({ kind: 'digit-between', position: 1, lower: ones - 2, upper: ones + 2 }, { kind: 'parity', remainder: ones % 2 });
  } else {
    prefix = Array.from({ length: width - tailWidth }, (_, index) => r.int(index ? 0 : 1, 9)).join('');
    if (tailWidth === 2) {
      const ones = r.int(1, 5);
      const difference = r.int(1, 4);
      const start = width - 2;
      rules.push({ kind: 'sum', positions: [start, start + 1], total: 2 * ones + difference },
        { kind: 'difference', left: start, right: start + 1, difference });
    } else {
      const hundreds = r.int(3, 6);
      const more = r.int(1, 3);
      const less = r.int(1, 2);
      const start = width - 3;
      rules.push({ kind: 'sum', positions: [start, start + 1, start + 2], total: 3 * hundreds + more - less },
        { kind: 'difference', left: start + 1, right: start, difference: more },
        { kind: 'difference', left: start, right: start + 2, difference: less });
    }
  }
  const model = { width, prefix, tailWidth: grade.year === 0 ? 1 : tailWidth, rules };
  const candidates = clueCandidates(model);
  const solutions = candidates.filter(item => item.matches.every(Boolean));
  if (solutions.length !== 1) throw new QuestionRetry('Digit clues must determine exactly one number.');
  const value = solutions[0].value;
  const clueLines = rules.map(rule => clueText(rule, width));
  const visual = diagram('digit-clues', model, `${width}-digit number. ${prefix ? `Fixed starting digits: ${prefix}. ` : ''}${clueLines.join(' ')}`);
  const partials = [
    candidates.filter(item => item.matches[0] && !item.matches.every(Boolean)),
    candidates.filter(item => item.matches.slice(1).every(Boolean) && !item.matches[0]),
    candidates.filter(item => !item.matches.every(Boolean)),
  ];
  let method;
  if (grade.year === 0) {
    const between = rules[0];
    method = `The possible ones digits between ${between.lower} and ${between.upper} are ${Array.from({ length: between.upper - between.lower - 1 }, (_, index) => between.lower + index + 1).join(', ')}. Only ${value % 10} also makes the whole number ${rules[1].remainder ? 'odd' : 'even'}.`;
  } else if (tailWidth === 2) {
    const total = rules[0].total;
    const difference = rules[1].difference;
    const ones = (total - difference) / 2;
    method = `Remove the extra ${difference} from the larger digit: ${total} − ${difference} = ${2 * ones}. This is two copies of the ones digit, so the ones digit is ${ones} and the tens digit is ${ones + difference}.`;
  } else {
    const total = rules[0].total;
    const more = rules[1].difference;
    const less = rules[2].difference;
    const hundreds = (total - more + less) / 3;
    method = `Make all three unknown digits equal to the hundreds digit: ${total} − ${more} + ${less} = ${3 * hundreds}. Dividing by 3 gives ${hundreds}; the tens digit is ${hundreds + more} and the ones digit is ${hundreds - less}.`;
  }
  return numeric(family, grade, {
    prompt: `Find the ${width}-digit number.${prefix ? ` Its first ${prefix.length} digit${prefix.length === 1 ? ' is' : 's are'} ${prefix}.` : ''} ${clueLines.join(' ')}`,
    visual,
    explanation: `${method}${prefix ? ` Keep the fixed starting digits ${prefix}.` : ''} The result is ${numberText(value)}. Substitution checks every clue.`,
    hint: grade.year === 0 ? 'List the allowed ones digits, then use the odd-or-even clue.' : 'Use the digit differences together with the digit sum, then check every condition.',
  }, value, partials.filter(items => items.length).map(items => wrong(r.pick(items).value, 'ignored-condition')).concat([
    wrong(Number(String(value).split('').reverse().join('')), 'place-shift'),
  ]));
};

DRAFTS['number-build'] = (family, grade, level, r) => {
  const width = widthFor(grade, r);
  const digits = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, width);
  const order = r.pick(['smallest', 'greatest']);
  const model = { digits, order, parity: null, limit: null };
  let candidates;
  if (level === 3) {
    model.parity = r.pick(['even', 'odd']);
    candidates = permutations(digits);
    const parityCandidates = candidates.filter(value => obeysBuild(value, model));
    if (parityCandidates.length < 3) throw new QuestionRetry('A constrained build needs several candidate arrangements.');
    model.limit = { direction: order === 'smallest' ? 'greater' : 'less', value: parityCandidates[Math.floor(parityCandidates.length / 2)] };
    candidates = candidates.filter(value => obeysBuild(value, model));
  }
  const value = candidates ? (order === 'smallest' ? candidates[0] : candidates.at(-1)) : extremeDigits(digits, order);
  const description = `Digit cards: ${digits.join(', ')}. Use every card exactly once. Find the ${order} number${model.parity ? ` that is ${model.parity}` : ''}${model.limit ? ` and ${model.limit.direction} than ${numberText(model.limit.value)}` : ''}. A leading zero is not allowed.`;
  const visual = diagram('digit-cards', model, description);
  const reversed = Number(String(value).split('').reverse().join(''));
  const alternatives = [
    wrong(extremeDigits(digits, order === 'smallest' ? 'greatest' : 'smallest'), 'ignored-condition'),
    wrong(extremeDigits(digits, order), 'ignored-condition'),
    wrong(reversed, 'place-shift'), wrong(Number(digits.join('')), 'ignored-condition'),
    wrong(sum(digits), 'face-value'), wrong(Number(String(digits.find(digit => digit !== 0)).repeat(width)), 'ignored-condition'),
    ...digits.map(digit => wrong(digit, 'missing-step')),
  ];
  if (candidates) {
    const ignoredParity = permutations(digits).filter(candidate => obeysBuild(candidate, { ...model, parity: null }) && !obeysBuild(candidate, model));
    if (ignoredParity.length) alternatives.unshift(wrong(order === 'smallest' ? ignoredParity[0] : ignoredParity.at(-1), 'ignored-condition'));
  }
  return numeric(family, grade, {
    prompt: description, visual,
    explanation: `${order === 'smallest' ? 'Put the smallest possible nonzero digit first, then arrange the remaining digits in increasing order' : 'Place larger digits earlier'}${model.parity ? ', while reserving a suitable final digit for the even/odd condition and checking the bound' : ''}. Testing the stated conditions gives ${numberText(value)}; every card is used once.`,
    hint: 'The first digit cannot be zero. A last-digit condition may stop a simple sorting shortcut.',
  }, value, alternatives);
};

DRAFTS['number-compare'] = (family, grade, level, r) => {
  const width = widthFor(grade, r);
  let values;
  let model;
  let prompt;
  if (level === 3) {
    const add = r.int(2, 8) * 10;
    const base = r.int(10 ** (width - 3) + 5, 10 ** (width - 2) - 8) * 100;
    const target = base + 100 - add;
    values = [target, target + 10, target + 400, target - 390];
    model = { task: 'qualifying', lower: target - 50, upper: target + 150, add, divisibleBy: 100 };
    prompt = `Which abacus shows a number greater than ${numberText(model.lower)} and less than ${numberText(model.upper)}, which becomes a multiple of 100 when ${add} is added?`;
  } else {
    const digits = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, width);
    values = Array.from({ length: 4 }, (_, shift) => Number(digits.map((_, index) => digits[(index + shift) % width]).join('')));
    if (width === 2) values = [Number(digits.join('')), Number([...digits].reverse().join('')), digits[0] * 10, digits[1] * 10];
    if (width === 3) values[3] = digits[0] * 100 + digits[2] * 10;
    model = { task: r.pick(['greatest', 'smallest']) };
    prompt = `Which abacus shows the ${model.task} number? All rods are labelled.`;
  }
  if (new Set(values).size !== 4) throw new QuestionRetry('Comparison cards need distinct numbers.');
  const chosen = model.task === 'qualifying'
    ? values.filter(value => value > model.lower && value < model.upper && (value + model.add) % model.divisibleBy === 0)
    : [model.task === 'greatest' ? Math.max(...values) : Math.min(...values)];
  if (chosen.length !== 1) throw new QuestionRetry('Exactly one comparison card must meet the conditions.');
  const answer = abacusKey(rodsFor(chosen[0], width));
  const options = values.map(value => {
    const visual = abacus(value, width);
    return { value: abacusKey(visual.rods), visual };
  });
  return complete(family, grade, {
    prompt, answer, proof: { ...model, cards: options.map(option => clone(facts(option.visual))) },
    explanation: model.task === 'qualifying'
      ? `Apply both tests. ${numberText(chosen[0])} is inside the given interval, and adding ${model.add} gives ${numberText(chosen[0] + model.add)}, a multiple of 100. A card passing only one test is not enough.`
      : `Compare the highest-value rods first; only if they match, move to the next rod. The ${model.task} number is ${numberText(chosen[0])}. Adding bead counts ignores their places.`,
    hint: level === 3 ? 'Check the interval and the final two digits after the addition.' : 'Start with the highest place, not the total number of beads.',
    choices: answerChoices(answer, options.filter(option => option.value !== answer).map(option => wrong(option.value, level === 3 ? 'ignored-condition' : 'face-value', option.visual)), 4, options.find(option => option.value === answer).visual),
  });
};

DRAFTS['roman-number'] = (family, grade, level, r) => {
  const pool = [14, 19, 24, 39, 44, 49, 54, 89, 94, 99, 140, 190, 240, 390, 440, 490, 540, 890, 940];
  if (grade.year === 5) pool.push(1490, 1940, 2490, 2940);
  let a = r.pick(pool);
  let b = r.pick(pool);
  const operation = r.pick(['+', '−']);
  if (operation === '−' && a < b) [a, b] = [b, a];
  if (a === b) throw new QuestionRetry('Use two different Roman cards.');
  const left = toRoman(a);
  const right = toRoman(b);
  const visual = diagram('roman', { left, right, operation }, `Roman numeral calculation: ${left} ${operation} ${right}.`);
  const value = operation === '+' ? a + b : a - b;
  const naive = word => sum([...word].map(character => ({ I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 })[character]));
  return numeric(family, grade, {
    prompt: 'Read the Roman numeral cards, then find the value of their calculation in ordinary numbers.', visual,
    explanation: `${left} is ${a} and ${right} is ${b}. A smaller symbol before a larger one is subtracted, as in IV, IX or XL. Then ${a} ${operation} ${b} = ${value}.`,
    hint: 'Decode each numeral before doing the operation.',
  }, value, [
    wrong(operation === '+' ? naive(left) + naive(right) : Math.abs(naive(left) - naive(right)), 'ignored-condition'),
    wrong(operation === '+' ? Math.abs(a - b) : a + b, 'wrong-operation'),
    wrong(a, 'missing-step'), wrong(b, 'missing-step'),
  ]);
};

DRAFTS['picture-add'] = (family, grade, level, r) => {
  const groups = [r.int(3, grade.year ? 9 : 7), r.int(2, grade.year ? 8 : 6)];
  const visual = diagram('addition', { groups }, `Addition picture: ${groups[0]} stars in the first collection plus ${groups[1]} stars in the second collection.`);
  const value = sum(groups);
  return numeric(family, grade, {
    prompt: 'Join the two pictured collections. How many stars are there altogether?', visual,
    explanation: `Count the first ${groups[0]} stars, then count on ${groups[1]} more. ${groups[0]} + ${groups[1]} = ${value}; count every star once.`,
    hint: 'Start with one group and count on the stars in the other group.',
  }, value, [wrong(Math.max(...groups), 'missing-step'), wrong(Math.abs(groups[0] - groups[1]), 'wrong-operation'), wrong(Math.min(...groups), 'missed-object')]);
};

DRAFTS['bar-unknown'] = (family, grade, level, r) => {
  const known = grade.year < 2 ? [r.int(3, grade.year ? 16 : 7)] : [r.int(12, grade.year === 2 ? 35 : 80), r.int(8, grade.year === 2 ? 25 : 60)];
  const value = r.int(2, grade.year <= 0 ? 8 : grade.year === 1 ? 20 : 70);
  const total = value + sum(known);
  const segments = [...known.map(part => ({ value: part })), { value: null }];
  const visual = diagram('bar', { total, segments }, `Part-whole bar, not to scale. Whole: ${total}. Known parts: ${known.join(' and ')}. One part is unknown.`);
  return numeric(family, grade, {
    prompt: 'The labelled parts together make the whole bar. What number belongs in the question-mark part?', visual,
    explanation: `First combine the known parts: ${known.join(' + ')} = ${sum(known)}. Subtract this from the whole: ${total} − ${sum(known)} = ${value}. The parts now add back to ${total}.`,
    hint: 'The whole includes the missing part as well as every labelled part.',
  }, value, [wrong(total + sum(known), 'wrong-operation'), wrong(sum(known), 'missing-step'), wrong(total, 'missing-step')]);
};

DRAFTS['equal-groups'] = (family, grade, level, r) => {
  const count = r.int(2, grade.year === 2 ? 5 : 6);
  const each = r.int(2, grade.year === 2 ? 5 : 8);
  const loose = r.int(1, 4);
  const groups = Array(count).fill(each);
  const visual = diagram('groups', { groups, loose }, `${count} outlined bags, each holding ${each} pictured tokens, and ${loose} loose tokens outside the bags.`);
  const value = count * each + loose;
  return numeric(family, grade, {
    prompt: 'Every outlined bag has the same number of tokens. Include the loose tokens. How many tokens are there altogether?', visual,
    explanation: `${count} equal groups of ${each} make ${count} × ${each} = ${count * each}. Include the ${loose} loose tokens: ${count * each} + ${loose} = ${value}.`,
    hint: 'Find the amount in all the bags, then include what is outside.',
  }, value, [wrong(count + each + loose, 'wrong-operation'), wrong(count * each, 'missing-step'), wrong((count - 1) * each + loose, 'missed-object'), wrong(count * each - loose, 'wrong-operation')]);
};

DRAFTS['sharing-remainder'] = (family, grade, level, r) => {
  const groupSize = r.int(3, grade.year === 2 ? 6 : 12);
  const groups = r.int(3, 7);
  const leftover = r.int(1, groupSize - 1);
  const change = level === 2 ? -r.int(1, groupSize + leftover) : 0;
  const ask = level === 2 ? 'containers' : r.pick(['full', 'leftover', 'containers']);
  const visual = diagram('sharing', { groups, groupSize, leftover },
    `${groups} full crates, each holding ${groupSize} counters, and ${leftover} loose counters. The full crates are labelled with their capacity.`);
  const total = groups * groupSize + leftover;
  const after = total + change;
  const answerFor = (count, size) => ask === 'full' ? Math.floor(count / size) : ask === 'leftover' ? count % size : Math.ceil(count / size);
  // The repack size differs from the crate size, so the crate labels cannot be counted off as the answer.
  const bags = Array.from({ length: grade.year === 2 ? 5 : 11 }, (_, index) => index + 2).filter(size => size !== groupSize && size <= after
    && answerFor(after, size) !== groups && (ask !== 'leftover' || (after % size > 0 && after % size !== leftover)));
  if (!bags.length) throw new QuestionRetry('The repacking size needs to differ from the crates and use the loose counters.');
  const bag = r.pick(bags);
  const value = answerFor(after, bag);
  const question = ask === 'full' ? `All the counters are repacked into bags of ${bag}. How many full bags can be made? Count full bags only.`
    : ask === 'leftover' ? `All the counters are repacked into bags of ${bag}, filling as many bags as possible. How many counters are left over, not in a full bag?`
      : `All the counters are repacked into bags that each hold at most ${bag}. How many bags are needed to hold every counter? A partly filled bag is still needed.`;
  return numeric(family, grade, {
    prompt: `${change ? `The picture shows the counters before ${-change} counters are taken away. Repack everything that remains. ` : 'Use every counter shown, in the crates and loose. '}${question}`,
    visual, proof: { change, ask, bag },
    explanation: `The picture contains ${groups} × ${groupSize} + ${leftover} = ${total} counters.${change ? ` After taking away ${-change}, ${after} remain.` : ''} Repacking into bags of ${bag}: ${after} ÷ ${bag} gives ${Math.floor(after / bag)} full bags and ${after % bag} left over.${ask === 'containers' ? ` ${after % bag ? 'The leftover counters need one extra bag, so' : 'No extra bag is needed, so'} the answer is ${value}.` : ` The question asks for ${ask === 'full' ? 'full bags' : 'leftover counters'}, so answer ${value}.`}`,
    hint: 'First find how many counters there are altogether, then share that total into the new bag size.',
  }, value, [
    wrong(Math.floor(after / bag), 'remainder-rule'), wrong(after % bag, 'remainder-rule'),
    wrong(Math.ceil(after / bag), 'remainder-rule'), wrong(answerFor(after, groupSize), 'ignored-condition'),
    wrong(answerFor(groups * groupSize + Math.min(change, 0), bag), 'missing-step'), wrong(answerFor(total, bag), 'ignored-change'),
    wrong(groups, 'missing-step'), wrong(bag, 'remainder-rule'), wrong(total, 'missing-step'),
  ].filter(item => Number(item.value) >= 0));
};

DRAFTS['two-stage'] = (family, grade, level, r) => {
  let mode;
  let steps;
  let endValue;
  let value;
  let alternatives;
  let prompt;
  let explanation;
  if (grade.year <= 1) {
    mode = 'add-remove';
    value = r.int(3, grade.year ? 18 : 8);
    const added = r.int(2, grade.year ? 9 : 5);
    const removed = r.int(1, Math.min(value + added - 1, grade.year ? 12 : 6));
    endValue = value + added - removed;
    steps = [{ operation: '+', value: added }, { operation: '−', value: removed }];
    prompt = `A pouch held some stars. ${added} stars were added, then ${removed} were used. Now ${endValue} stars remain. How many stars were in the pouch at the start?`;
    explanation = `Work backwards: put back the ${removed} used stars, giving ${endValue + removed}; then undo the addition of ${added}. ${endValue} + ${removed} − ${added} = ${value} stars at the start.`;
    alternatives = [wrong(endValue + added - removed, 'reversed-operation'), wrong(endValue + removed, 'missing-step'), wrong(endValue - added, 'missing-step'), wrong(endValue + added + removed, 'wrong-operation')];
  } else if (level === 3) {
    mode = 'share-add';
    const groups = r.int(2, 6);
    const each = r.int(3, 10);
    const added = r.int(2, 8);
    value = groups * each;
    endValue = each + added;
    steps = [{ operation: '÷', value: groups }, { operation: '+', value: added }];
    prompt = `A collection was shared equally among ${groups} crews. Each crew then received ${added} extra tokens and now has ${endValue}. How many tokens were in the original collection?`;
    explanation = `Undo the extra gift first: each crew originally had ${endValue} − ${added} = ${each}. Rejoin all ${groups} equal shares: ${each} × ${groups} = ${value}.`;
    alternatives = [wrong(endValue * groups + added, 'reversed-operation'), wrong((endValue + added) * groups, 'wrong-operation'), wrong(endValue - added, 'missing-step'), wrong(endValue * groups, 'missing-step')];
  } else {
    mode = 'multiply-remove';
    const groups = r.int(2, 8);
    value = r.int(5, grade.year >= 4 ? 45 : 12);
    const removed = groups * r.int(1, Math.min(4, value - 2));
    endValue = groups * value - removed;
    steps = [{ operation: '×', value: groups }, { operation: '−', value: removed }];
    prompt = `${groups} identical trays each started with the same number of tokens. ${removed} tokens were taken from their combined total, leaving ${endValue}. How many tokens were on each tray at the start?`;
    explanation = `Restore the ${removed} removed tokens: ${endValue} + ${removed} = ${endValue + removed}. Divide that starting total equally among ${groups} trays: ${endValue + removed} ÷ ${groups} = ${value}.`;
    alternatives = [wrong(endValue + removed, 'missing-step'), wrong(endValue / groups + removed, 'reversed-operation'), wrong((endValue - removed) / groups, 'wrong-operation'), wrong(endValue / groups, 'missing-step')];
  }
  const visual = diagram('flow', { startLabel: mode === 'multiply-remove' ? '? on each tray' : '? at start', steps, endValue },
    `Unknown starting amount; then ${steps.map(step => `${step.operation} ${step.value}`).join(', then ')}; final amount ${endValue}.`);
  return numeric(family, grade, { prompt, visual, proof: { mode }, explanation, hint: 'Start at the end of the story. Undo the last action first.' }, value, onlyIntegers(alternatives));
};

DRAFTS['symbol-equations'] = (family, grade, level, r) => {
  const a = r.int(2, grade.year === 1 ? 5 : 12);
  const b = r.int(2, grade.year === 1 ? 5 : 12);
  const first = grade.year < 4 ? ['star', 'star'] : ['star', 'star', 'circle'];
  const second = grade.year < 3 ? ['star', 'circle'] : ['star', 'circle', 'circle'];
  const target = grade.year < 3 ? ['star', 'circle', 'circle'] : ['star', 'star', 'circle', 'circle'];
  const totalFor = terms => sum(terms.map(term => term === 'star' ? a : b));
  const equations = [{ terms: first, total: totalFor(first) }, { terms: second, total: totalFor(second) }];
  const value = totalFor(target);
  const visual = diagram('equations', { equations, target },
    `Equal pictures have equal values. ${equations.map(row => `${row.terms.join(' plus ')} equals ${row.total}`).join('. ')}. Find ${target.join(' plus ')}.`);
  const method = grade.year < 4
    ? `Two stars total ${equations[0].total}, so one star is ${a}. Remove that star's value from the second total: ${equations[1].total} − ${a} = ${equations[1].total - a}.${grade.year >= 3 ? ` This is two circles, so one circle is ${b}.` : ` This gives one circle, ${b}.`}`
    : `Adding the first two rows gives three stars and three circles, totalling ${equations[0].total + equations[1].total}. One star-and-circle pair is therefore ${(equations[0].total + equations[1].total) / 3}. The final row contains two such pairs.`;
  return numeric(family, grade, {
    prompt: 'Every star has the same value and every circle has the same value. Use both picture equations to find the final sum.', visual,
    explanation: `${method} The final sum is ${target.map(term => term === 'star' ? a : b).join(' + ')} = ${value}. Both given equations check with these symbol values.`,
    hint: grade.year < 4 ? 'Find the repeated symbol from the first row, then use it in the second row.' : 'Compare the two rows: replacing one star by one circle explains the difference in their totals.',
  }, value, [
    wrong(target.length * a, 'ignored-condition'), wrong(equations[1].total, 'missing-step'),
    wrong(sum(equations.map(row => row.total)), 'wrong-operation'), wrong(target.length, 'face-value'),
    wrong(coefficient(target, 'star') * equations[0].total + coefficient(target, 'circle') * equations[1].total, 'whole-parts'),
  ]);
};

DRAFTS['digit-algorithm'] = (family, grade, level, r) => {
  const original = r.int(112, grade.year === 5 ? 987 : 897);
  const factor = r.int(3, 9);
  const product = original * factor;
  const top = String(original);
  const bottom = String(product);
  const positions = [...top].map((digit, index) => ({ digit, index })).filter(item => level < 3 || bottom.includes(item.digit));
  if (!positions.length) throw new QuestionRetry('The linked calculation needs a digit on both sides.');
  const selected = r.pick(positions);
  const topMask = [...top].map((digit, index) => index === selected.index ? '□' : digit).join('');
  const bottomIndex = level === 3 ? r.pick([...bottom].map((digit, index) => ({ digit, index })).filter(item => item.digit === selected.digit)).index : -1;
  const bottomMask = [...bottom].map((digit, index) => index === bottomIndex ? '□' : digit).join('');
  const model = { topMask, factor, bottomMask };
  const candidates = calculationCandidates(model);
  if (candidates.length !== 1) throw new QuestionRetry('The written calculation must have one possible digit.');
  const value = candidates[0];
  const visual = diagram('calculation', model, `Written multiplication: ${topMask.replaceAll('□', 'box')} times ${factor} equals ${bottomMask.replaceAll('□', 'box')}. Every box is the same digit.`);
  const visibleDigits = [...new Set([...topMask, ...bottomMask].filter(character => /\d/.test(character)).map(Number))];
  return numeric(family, grade, {
    prompt: `Which digit belongs in ${level === 3 ? 'both boxes? The two boxes must contain the same digit' : 'the box'}? Check the whole written multiplication.`, visual,
    explanation: `Complete each column, carrying to the next place when needed. The only digit that makes the whole calculation true is ${value}: ${original} × ${factor} = ${product}. ${level === 3 ? 'The same digit also fits the box in the product.' : 'Checking the complete product rules out a digit that fits only one column.'}`,
    hint: 'Work from the ones column and keep each carry. Test a proposed digit in every box.',
  }, value, [wrong(factor, 'face-value'), ...visibleDigits.map(digit => wrong(digit, 'ignored-condition')), wrong(0, 'ignored-zero')]);
};

DRAFTS['number-pattern'] = (family, grade, level, r) => {
  const step = r.int(1, grade.year === 0 ? 3 : grade.year === 1 ? 5 : 9);
  const start = r.int(1, grade.year === 0 ? 4 : 12);
  const values = Array.from({ length: 5 }, (_, index) => start + index * step);
  const index = level === 2 ? r.pick([1, 2, 3]) : 4;
  const value = values[index];
  values[index] = null;
  const visual = diagram('sequence', { values, alternating: false },
    `Number sequence with the same change each step: ${values.map(item => item === null ? 'gap' : item).join(', ')}.`);
  return numeric(family, grade, {
    prompt: 'The numbers change by the same amount each time. What belongs in the gap?', visual,
    explanation: `The shown neighbouring terms increase by ${step}. Keep that same step through the gap: the missing number is ${value}. Check the terms on both sides if the gap is inside the row.`,
    hint: 'Find the change between two shown neighbours; use it at the gap.',
  }, value, [
    wrong(value - step, 'repeat-unit'), wrong(value + step, 'repeat-unit'), wrong(step, 'face-value'),
    wrong(sum(values.filter(item => item !== null).slice(-2)), 'wrong-operation'),
  ]);
};

DRAFTS['alternating-pattern'] = (family, grade, level, r) => {
  const firstStart = r.int(1, grade.year === 0 ? 5 : 12);
  const secondStart = r.int(grade.year === 0 ? 12 : 25, grade.year === 0 ? 18 : grade.year === 1 ? 45 : 90);
  const firstStep = r.int(1, grade.year === 0 ? 2 : 5);
  const secondStep = -r.int(1, grade.year === 0 ? 3 : 6);
  const values = Array.from({ length: 7 }, (_, index) => index % 2 ? secondStart + Math.floor(index / 2) * secondStep : firstStart + Math.floor(index / 2) * firstStep);
  const gap = r.pick([4, 5]);
  const value = values[gap];
  values[gap] = null;
  const ownStep = gap % 2 ? secondStep : firstStep;
  const otherStep = gap % 2 ? firstStep : secondStep;
  const visual = diagram('sequence', { values, alternating: true },
    `Seven numbered positions: ${values.map((item, index) => `position ${index + 1}: ${item === null ? 'gap' : item}`).join('; ')}. Odd and even positions follow separate constant-step rules.`);
  return numeric(family, grade, {
    prompt: 'Positions 1, 3, 5, 7 follow one rule. Positions 2, 4, 6 follow another. What belongs in the gap?', visual,
    explanation: `Separate the two interleaved rows. The odd positions increase by ${firstStep}; the even positions decrease by ${-secondStep}. The gap is at position ${gap + 1}, so use its own row: ${values[gap - 2]} ${ownStep > 0 ? '+' : '−'} ${Math.abs(ownStep)} = ${value}.`,
    hint: 'Look at every other number, not just the number immediately before the gap.',
  }, value, onlyIntegers([
    wrong(values[gap - 2], 'repeat-unit'), wrong(values[gap - 1] + ownStep, 'ignored-condition'),
    wrong(values[gap - 2] + otherStep, 'repeat-unit'), wrong(values[gap - 1], 'ignored-condition'),
    wrong(value + ownStep, 'repeat-unit'),
  ]));
};

DRAFTS['fraction-picture'] = (family, grade, level, r) => {
  const denominator = r.pick([3, 4, 5, 6, 8, 10, 12]);
  const numerator = r.int(1, denominator - 1);
  const visual = fractionDiagram(denominator, numerator);
  const value = `${numerator}/${denominator}`;
  return numeric(family, grade, {
    prompt: 'What fraction of this whole is shaded? Count the equal parts as drawn; do not simplify your answer.', visual,
    explanation: `The whole has ${denominator} equal parts, and ${numerator} of them are shaded. Shaded parts go above the line and all equal parts go below it: ${numerator}/${denominator}.`,
    hint: 'Count every equal part for the denominator, including the unshaded parts.',
  }, value, [
    wrong(`${denominator - numerator}/${denominator}`, 'fraction-complement'),
    wrong(`${numerator}/${denominator - numerator}`, 'whole-parts'),
    wrong(`${denominator}/${numerator}`, 'fraction-denominator'),
    wrong(`${numerator}/${numerator}`, 'whole-parts'),
  ]);
};

DRAFTS['fraction-change'] = (family, grade, level, r) => {
  const denominator = r.pick([8, 10, 12]);
  const original = r.int(2, denominator - 3);
  const amount = r.int(1, Math.min(3, original - 1, denominator - original - 1));
  const action = r.pick(['shade', 'erase']);
  const final = original + (action === 'shade' ? amount : -amount);
  const visual = fractionDiagram(denominator, final, 'After the change');
  const originalVisual = fractionDiagram(denominator, original, 'Before the change');
  const alternatives = [
    [final, 'ignored-change'], [final + (action === 'shade' ? amount : -amount), 'reversed-operation'],
    [denominator - original, 'fraction-complement'], [denominator - final, 'fraction-complement'],
  ].filter(([numerator]) => numerator >= 0 && numerator <= denominator)
    .map(([numerator, code]) => fractionWrong(denominator, numerator, code));
  const answer = fractionKey(originalVisual.cells);
  return complete(family, grade, {
    prompt: `The picture shows the whole AFTER ${amount} equal part${amount === 1 ? ' was' : 's were'} ${action === 'shade' ? 'newly shaded' : 'erased from the shading'}. Which picture shows how it looked BEFORE? The whole and its equal parts never changed.`,
    answer, visual, proof: { action, amount },
    explanation: `The final picture has ${final} shaded parts out of ${denominator}. Undo the change: ${final} ${action === 'shade' ? '−' : '+'} ${amount} = ${original} shaded parts before. Keep all ${denominator} equal parts in the whole.`,
    hint: 'Work backwards. Newly shading a part and erasing its shading are opposite actions.',
    choices: answerChoices(answer, alternatives, 4, originalVisual),
  });
};

DRAFTS['fraction-group'] = (family, grade, level, r) => {
  const denominator = r.pick([3, 4, 5, 6, 8]);
  const numerator = r.int(1, denominator - 1);
  const each = r.int(2, grade.year === 3 ? 6 : 10);
  if (level === 3) {
    const remaining = (denominator - numerator) * each;
    const value = denominator * each;
    const visual = fractionDiagram(denominator, numerator, 'Shaded parts were given away');
    return numeric(family, grade, {
      prompt: `${numerator}/${denominator} of a token collection was given away, as shown by the shaded parts. The unshaded parts together stand for ${remaining} tokens. How many tokens were in the whole collection at the start?`,
      visual, proof: { mode: 'reverse', remaining },
      explanation: `There are ${denominator - numerator} equal parts left. Each part represents ${remaining} ÷ ${denominator - numerator} = ${each} tokens. The original ${denominator} parts held ${each} × ${denominator} = ${value} tokens.`,
      hint: 'The given token count belongs to all the unshaded parts, not to the original whole.',
    }, value, onlyIntegers([
      wrong(remaining * denominator / numerator, 'fraction-complement'), wrong(remaining * denominator, 'whole-parts'),
      wrong(remaining, 'changed-whole'), wrong(remaining + numerator, 'wrong-operation'),
    ]));
  }
  const groups = Array(denominator).fill(each);
  const visual = diagram('groups', { groups, loose: 0, selectedGroups: numerator },
    `${denominator} equal outlined groups of ${each} tokens. The first ${numerator} groups have a hatched header; these are the selected ${numerator}/${denominator} of the collection.`);
  const value = each * numerator;
  return numeric(family, grade, {
    prompt: `The whole collection is split into equal groups. The hatched groups show ${numerator}/${denominator} of the collection. How many tokens are in those groups?`,
    visual, proof: { mode: 'of-group', numerator },
    explanation: `One of the ${denominator} equal groups has ${each} tokens. Take ${numerator} such groups: ${each} × ${numerator} = ${value} tokens.`,
    hint: 'Find the number in one equal group before taking the required number of groups.',
  }, value, [
    wrong(denominator * each, 'whole-parts'), wrong((denominator - numerator) * each, 'fraction-complement'),
    wrong(numerator, 'missed-object'), wrong(each, 'missing-step'), wrong(denominator + numerator, 'wrong-operation'),
  ]);
};

DRAFTS['fraction-left'] = (family, grade, level, r) => {
  if (grade.year === 4) {
    const [numerator, denominator] = r.pick([[1, 2], [1, 3], [1, 4], [2, 5], [3, 5]]);
    const each = r.int(5, 15);
    const original = denominator * each;
    const afterFraction = (denominator - numerator) * each;
    const extraUsed = r.int(2, afterFraction - 2);
    const remaining = afterFraction - extraUsed;
    const visual = fractionDiagram(denominator, numerator, 'Fraction used first');
    return numeric(family, grade, {
      prompt: `A crew first used ${numerator}/${denominator} of its tokens, shown shaded. It then used ${extraUsed} more tokens, leaving ${remaining}. How many tokens did it have at the start?`,
      visual, proof: { mode: 'reverse-fixed', extraUsed, remaining },
      explanation: `Undo the last use: ${remaining} + ${extraUsed} = ${afterFraction}. This is ${denominator - numerator}/${denominator} of the original collection. One equal part is ${afterFraction} ÷ ${denominator - numerator} = ${each}, so the original total is ${each} × ${denominator} = ${original}.`,
      hint: 'First restore the fixed number used last. That gives the entire unshaded fraction.',
    }, original, onlyIntegers([
      wrong(remaining + extraUsed, 'missing-step'), wrong((remaining + extraUsed) * denominator / numerator, 'fraction-complement'),
      wrong(remaining * denominator, 'whole-parts'), wrong((remaining - extraUsed) * denominator / (denominator - numerator), 'reversed-operation'),
      wrong(remaining, 'changed-whole'),
    ]));
  }
  const [n1, d1] = r.pick([[1, 3], [1, 4], [2, 5]]);
  const [n2, d2] = r.pick([[1, 2], [1, 3]]);
  const unit = 6 * r.int(1, 8);
  const original = d1 * d2 * unit;
  const afterFirst = (d1 - n1) * d2 * unit;
  const remaining = (d1 - n1) * (d2 - n2) * unit;
  const mode = r.pick(['forward', 'reverse']);
  const stages = [
    { label: 'First: fraction of the original', cells: gridFor(d1, n1) },
    { label: 'Next: fraction of what remains', cells: gridFor(d2, n2) },
  ];
  const visual = diagram('fraction-chain', { stages },
    `First use ${n1}/${d1} of the original collection. Then use ${n2}/${d2} of the remainder, not of the original. In each bar, shaded equal parts are used. The second bar represents only what remains after the first use.`);
  const value = mode === 'forward' ? remaining : original;
  const wrongOriginalWhole = original - original * n1 / d1 - original * n2 / d2;
  const alternatives = mode === 'forward' ? [
    wrong(wrongOriginalWhole, 'changed-whole'), wrong(afterFirst, 'missing-step'),
    wrong(original - original * n2 / d2, 'missing-step'), wrong(original - remaining, 'fraction-complement'),
  ] : [
    wrong(remaining * d1 / (d1 - n1), 'missing-step'), wrong(remaining * d2 / (d2 - n2), 'missing-step'),
    wrong(remaining, 'changed-whole'), wrong(remaining * d1 * d2 / ((d1 - n1) * d2 - n2 * d1), 'changed-whole'),
  ];
  return numeric(family, grade, {
    prompt: mode === 'forward'
      ? `A supply holds ${original} tokens. First ${n1}/${d1} of them are used. Then ${n2}/${d2} of what REMAINS are used. How many tokens are left?`
      : `First ${n1}/${d1} of a token supply are used. Then ${n2}/${d2} of what REMAINS are used. Finally ${remaining} tokens are left. How many were in the original supply?`,
    visual, proof: { mode, ...(mode === 'forward' ? { total: original } : { remaining }) },
    explanation: mode === 'forward'
      ? `After the first use, ${d1 - n1}/${d1} of ${original} remain: ${afterFirst}. The second fraction is of this new whole. Keep ${d2 - n2}/${d2} of ${afterFirst}: ${remaining} tokens.`
      : `Undo the second use first: ${remaining} is ${d2 - n2}/${d2} of the first remainder, so that remainder was ${afterFirst}. Then ${afterFirst} is ${d1 - n1}/${d1} of the original, giving ${original}. Each reversal uses the whole appropriate to that stage.`,
    hint: 'The second fraction has a new whole: only the amount left after the first step.',
  }, value, onlyIntegers(alternatives));
};

DRAFTS['fraction-compare'] = (family, grade, level, r) => {
  const selected = r.shuffle([[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [1, 3], [3, 8], [5, 8], [4, 5], [5, 6]]).slice(0, 4);
  const greatest = selected.reduce((best, candidate) => candidate[0] * best[1] > best[0] * candidate[1] ? candidate : best);
  const correctVisual = fractionDiagram(greatest[1], greatest[0]);
  const answer = fractionKey(correctVisual.cells);
  return complete(family, grade, {
    prompt: 'Each option shows an equal-sized whole divided into equal parts. Which picture has the greatest shaded fraction?',
    answer, proof: { task: 'greatest', fractions: selected.map(([numerator, denominator]) => ({ numerator, denominator })) },
    explanation: `Compare shaded amounts of equal wholes, not just the number of shaded pieces or the denominators. ${greatest[0]}/${greatest[1]} is greater than each other shown fraction; equal-sized parts or cross-products can verify the comparisons.`,
    hint: 'A piece is smaller when the same whole is split into more equal parts.',
    choices: answerChoices(answer, selected.filter(([n, d]) => n !== greatest[0] || d !== greatest[1]).map(([n, d]) => fractionWrong(d, n, 'fraction-denominator')), 4, correctVisual),
  });
};

function fractionClaim(claim, fractions) {
  const a = fractions[0];
  const b = fractions[1];
  if (claim === 'equal') return a.numerator * b.denominator === b.numerator * a.denominator;
  if (claim === 'greater') return a.numerator * b.denominator > b.numerator * a.denominator;
  if (claim === 'less') return a.numerator * b.denominator < b.numerator * a.denominator;
  if (claim === 'sum-whole') return a.numerator * b.denominator + b.numerator * a.denominator === a.denominator * b.denominator;
  if (claim === 'complement-equal') return (a.denominator - a.numerator) * b.denominator === b.numerator * a.denominator;
  throw new Error(`Unknown fraction statement: ${claim}`);
}
const FRACTION_CLAIMS = {
  equal: 'A and B have equal shaded amounts.',
  greater: 'A has a greater shaded amount than B.',
  less: 'A has a smaller shaded amount than B.',
  'sum-whole': 'The two shaded amounts together make exactly one whole.',
  'complement-equal': 'The unshaded amount of A equals the shaded amount of B.',
};
DRAFTS['fraction-statements'] = (family, grade, level, r) => {
  const denominators = r.pick([[4, 8], [3, 6], [6, 12], [4, 6], [5, 10], [8, 12]]);
  const panels = denominators.map((d, index) => ({ label: index ? 'B' : 'A', cells: gridFor(d, r.int(1, d - 1)) }));
  const claims = [r.pick(['equal', 'greater', 'less']), r.pick(['sum-whole', 'complement-equal'])];
  const fractions = panels.map(panel => readFraction(panel.cells));
  const truth = claims.map(claim => fractionClaim(claim, fractions));
  const answer = statementKey(...truth);
  const visual = fractionBoard(panels);
  return complete(family, grade, {
    prompt: `The two pictures are equal-sized wholes. Statement 1: ${FRACTION_CLAIMS[claims[0]]} Statement 2: ${FRACTION_CLAIMS[claims[1]]} Which choice is correct?`,
    answer, visual, proof: { claims },
    explanation: `A shows ${fractions[0].numerator}/${fractions[0].denominator}; B shows ${fractions[1].numerator}/${fractions[1].denominator}. Compare equal wholes, using matching parts if necessary. Statement 1 is ${truth[0] ? 'true' : 'false'}; statement 2 is ${truth[1] ? 'true' : 'false'}. Check both, including whether a statement refers to unshaded parts.`,
    hint: 'Judge each statement separately. For the second, identify whether it uses shaded or unshaded parts.',
    choices: statementChoices(answer, ['fraction-denominator', 'fraction-complement', 'ignored-condition']),
  });
};

const hundredthsCells = count => Array.from({ length: 10 }, (_, row) => Array.from({ length: 10 }, (_, column) => row * 10 + column < count ? 1 : 0));
function readHundredths(cells) {
  const fraction = readFraction(cells);
  assert(cells.length === 10 && cells[0].length === 10, 'a hundredths model must have ten rows and ten columns');
  return fraction.numerator;
}
const decimalWrongs = alternatives => onlyIntegers(alternatives).map(item => wrong(decimal(Number(item.value)), item.code));
DRAFTS['decimal-model'] = (family, grade, level, r) => {
  const cents = r.int(11, 98);
  if (cents % 10 === 0) throw new QuestionRetry('Use a model with both tenths and hundredths.');
  const visual = diagram('hundredths', { cells: hundredthsCells(cents) },
    `One whole is a ten-by-ten grid of 100 equal squares. ${cents} squares are shaded and hatched; ${100 - cents} are unshaded.`);
  const answer = decimal(cents);
  return complete(family, grade, {
    prompt: 'The complete grid is one whole. What decimal represents its shaded part?', answer, visual,
    explanation: `There are 100 equal squares, so each is one hundredth. ${cents} shaded hundredths are ${Math.floor(cents / 10)} tenths and ${cents % 10} hundredths: ${answer}.`,
    hint: 'Ten small squares make one tenth; one small square makes one hundredth.',
    choices: answerChoices(answer, [
      wrong(`${Math.floor(cents / 10)}.${cents % 10}`, 'decimal-place'),
      wrong(decimal(100 - cents), 'fraction-complement'), wrong(`0.${String(cents).padStart(3, '0')}`, 'decimal-place'),
    ]),
  });
};

DRAFTS['decimal-context'] = (family, grade, level, r) => {
  let model;
  let value;
  let alternatives;
  let prompt;
  let explanation;
  if (level === 2) {
    const startCents = r.int(225, 650);
    const takenCents = r.int(45, startCents - 80);
    const addedCents = r.int(15, 190);
    model = { mode: 'forward', startCents, takenCents, addedCents };
    value = startCents - takenCents + addedCents;
    prompt = `A tank holds ${decimal(startCents)} L. A crew takes out ${decimal(takenCents)} L, then adds ${decimal(addedCents)} L. How many litres are now in the tank?`;
    explanation = `Align equal place values. First ${decimal(startCents)} − ${decimal(takenCents)} = ${decimal(startCents - takenCents)} L. Then add ${decimal(addedCents)} L, giving ${decimal(value)} L. Thinking in hundredths avoids moving the decimal point.`;
    alternatives = [
      wrong(startCents - takenCents, 'missing-step'), wrong(startCents + takenCents + addedCents, 'wrong-operation'),
      wrong(startCents - takenCents - addedCents, 'wrong-operation'), wrong(startCents + addedCents, 'missing-step'),
    ];
  } else {
    const tubeCount = r.int(3, 7);
    const tubeCents = r.int(12, 79);
    const addedCents = r.int(20, 165);
    const finalCents = r.int(addedCents + 35, addedCents + 300);
    model = { mode: 'reverse', tubeCount, tubeCents, addedCents, finalCents };
    value = finalCents - addedCents + tubeCount * tubeCents;
    prompt = `A tank filled ${tubeCount} identical sample tubes, each with ${decimal(tubeCents)} L. Then ${decimal(addedCents)} L was added to the tank, bringing it to ${decimal(finalCents)} L. How many litres were in the tank before any tubes were filled?`;
    explanation = `Undo the last addition first: ${decimal(finalCents)} − ${decimal(addedCents)} = ${decimal(finalCents - addedCents)} L. The tubes had removed ${tubeCount} × ${decimal(tubeCents)} = ${decimal(tubeCount * tubeCents)} L. Restore that amount: ${decimal(value)} L originally.`,
    alternatives = [
      wrong(finalCents - addedCents + tubeCents, 'missing-step'),
      wrong(finalCents + addedCents + tubeCount * tubeCents, 'reversed-operation'),
      wrong(finalCents - addedCents, 'missing-step'),
      wrong(finalCents + tubeCount * tubeCents, 'missing-step'),
    ];
  }
  const description = model.mode === 'forward'
    ? `Tank readings: start ${decimal(model.startCents)} litres, remove ${decimal(model.takenCents)} litres, then add ${decimal(model.addedCents)} litres.`
    : `Tank story: fill ${model.tubeCount} sample tubes of ${decimal(model.tubeCents)} litres each, then add ${decimal(model.addedCents)} litres; final tank reading ${decimal(model.finalCents)} litres. The starting reading is unknown.`;
  const visual = diagram('decimal-story', model, description);
  return complete(family, grade, {
    prompt, answer: decimal(value), visual, explanation,
    hint: level === 3 ? 'Work backwards, restoring the combined amount in all the tubes.' : 'Keep the decimal point fixed and complete both changes.',
    choices: answerChoices(decimal(value), decimalWrongs(alternatives)),
  });
};

DRAFTS['decimal-statements'] = (family, grade, level, r) => {
  const cents = r.int(12, 89);
  if (cents % 10 === 0) throw new QuestionRetry('Use nonzero tenths and hundredths.');
  const firstClaim = { count: cents, unit: r.pick(['hundredths', 'tenths']) };
  const addendCents = r.int(12, 89);
  const statedCents = r.pick([cents + addendCents, cents + Math.floor(addendCents / 10) * 100 + addendCents % 10]);
  const secondClaim = { addendCents, statedCents };
  const cells = hundredthsCells(cents);
  const visual = diagram('decimal-statements', { cells, firstClaim, secondClaim },
    `A ten-by-ten grid represents one whole; ${cents} of the 100 squares are shaded and hatched. Statement 1 says the shaded part is ${firstClaim.count} ${firstClaim.unit}. Statement 2 says the shaded decimal plus ${decimal(addendCents)} is ${decimal(statedCents)}.`);
  const first = firstClaim.unit === 'hundredths';
  const second = cents + addendCents === statedCents;
  const answer = statementKey(first, second);
  return complete(family, grade, {
    prompt: `The complete grid is one whole. Statement 1: The shaded part represents ${firstClaim.count} ${firstClaim.unit}. Statement 2: Its decimal value + ${decimal(addendCents)} = ${decimal(statedCents)}. Which choice is correct?`,
    answer, visual,
    explanation: `The shaded part is ${cents} hundredths, or ${decimal(cents)}, not ${cents} tenths. So statement 1 is ${first ? 'true' : 'false'}. Add aligned hundredths: ${decimal(cents)} + ${decimal(addendCents)} = ${decimal(cents + addendCents)}, making statement 2 ${second ? 'true' : 'false'}. Both statements must be tested.`,
    hint: 'Read the unit in statement 1. Then calculate statement 2 separately, lining up the decimal places.',
    choices: statementChoices(answer, ['decimal-place', 'decimal-align', 'ignored-condition']),
  });
};

DRAFTS['factor-compare'] = (family, grade, level, r) => {
  const common = r.int(2, 9);
  const a = common * r.int(2, 7);
  const b = common * r.int(2, 8);
  if (a === b) throw new QuestionRetry('Use two different factor cards.');
  const task = r.pick(['hcf', 'lcm']);
  const visual = diagram('factor-pair', { a, b, task }, `Number cards: ${a} and ${b}. Find the ${task === 'hcf' ? 'greatest positive number dividing both exactly' : 'least positive multiple shared by both'}.`);
  const value = task === 'hcf' ? gcd(a, b) : lcm(a, b);
  return numeric(family, grade, {
    prompt: `For the numbers on the cards, find the ${task === 'hcf' ? 'greatest positive number that divides both exactly' : 'least positive number that is a multiple of both'}.`,
    visual,
    explanation: task === 'hcf'
      ? `List factors that divide each card without a remainder. The largest shared factor of ${a} and ${b} is ${value}: ${a} ÷ ${value} = ${a / value} and ${b} ÷ ${value} = ${b / value}.`
      : `List multiples until the lists first meet, or use their common factors. The least shared positive multiple is ${value}: ${value} ÷ ${a} = ${value / a} and ${value} ÷ ${b} = ${value / b}.`,
    hint: task === 'hcf' ? 'A factor divides into each given number; seek the largest shared one.' : 'A shared multiple is divisible by both given numbers; seek the first positive one.',
  }, value, [
    wrong(task === 'hcf' ? lcm(a, b) : gcd(a, b), 'factor-multiple'),
    wrong(a + b, 'wrong-operation'), wrong(a * b, 'factor-multiple'),
    wrong(Math.min(a, b), 'ignored-condition'), wrong(Math.max(a, b), 'ignored-condition'),
  ]);
};

DRAFTS['factor-application'] = (family, grade, level, r) => {
  if (r.pick([true, false])) {
    const common = r.int(3, 12);
    const a = common * r.int(2, 7);
    const b = common * r.int(2, 8);
    if (a === b) throw new QuestionRetry('Use unequal badge supplies.');
    const reserveRed = level === 3 ? r.int(1, 9) : 0;
    const reserveBlue = level === 3 ? r.int(1, 9) : 0;
    const red = a + reserveRed;
    const blue = b + reserveBlue;
    const task = level === 3 ? 'items-per-pack' : 'pack-count';
    const visual = diagram('factor-story', { context: 'packs', red, blue, reserveRed, reserveBlue, task },
      `${red} red badges and ${blue} blue badges. Keep back ${reserveRed} red and ${reserveBlue} blue. Make the greatest possible number of identical packs with all the remaining badges and no leftovers; every pack has the same red count and the same blue count.`);
    const packs = gcd(a, b);
    const value = task === 'pack-count' ? packs : a / packs + b / packs;
    return numeric(family, grade, {
      prompt: `${red} red badges and ${blue} blue badges are available.${level === 3 ? ` First keep back ${reserveRed} red and ${reserveBlue} blue badges.` : ''} Use all the remaining badges to make the greatest possible number of identical packs, with no leftovers. Every pack must have the same number of each colour. ${task === 'pack-count' ? 'How many packs can be made?' : 'How many badges will be in EACH pack altogether?'}`,
      visual,
      explanation: `After keeping back the reserves, there are ${a} red and ${b} blue badges. The greatest number of identical packs is their highest common factor, ${packs}. ${task === 'items-per-pack' ? `Each pack has ${a} ÷ ${packs} = ${a / packs} red and ${b} ÷ ${packs} = ${b / packs} blue badges: ${value} altogether.` : `Both colours divide exactly into ${packs} packs; a shared multiple would not describe equal packs.`}`,
      hint: 'The number of packs must divide both supplies exactly. If asked about one pack, divide both colours by that number.',
    }, value, [
      wrong(task === 'pack-count' ? lcm(a, b) : packs, 'factor-multiple'), wrong(a + b, 'missing-step'),
      wrong(task === 'pack-count' ? Math.min(a, b) : (red + blue) / gcd(red, blue), 'ignored-condition'),
      wrong(a / packs, 'missing-step'), wrong(b / packs, 'missing-step'),
      wrong(lcm(a, b), 'factor-multiple'),
    ].filter(item => Number.isSafeInteger(Number(item.value))));
  }
  const a = r.pick([4, 6, 8, 9, 10, 12]);
  const b = r.pick([6, 8, 9, 10, 12, 15]);
  if (a === b) throw new QuestionRetry('Use two different beacon periods.');
  const interval = lcm(a, b);
  const window = level === 3 ? interval * r.int(3, 7) + r.int(0, interval - 1) : null;
  const visual = diagram('factor-story', { context: 'beacons', a, b, window },
    `Beacon A flashes every ${a} minutes; beacon B every ${b} minutes. They flash together now.${window === null ? ' Find their next shared flash.' : ` Count later shared flashes during the next ${window} minutes, including the endpoint but not the flash now.`}`);
  const value = level === 3 ? Math.floor(window / interval) : interval;
  return numeric(family, grade, {
    prompt: `Two beacons flash every ${a} minutes and every ${b} minutes. They flash together now. ${window === null ? 'After how many minutes will they next flash together?' : `How many MORE times will they flash together during the next ${window} minutes? Include a flash at the ending time, but do not count the flash now.`}`,
    visual,
    explanation: `A shared flash occurs at a common multiple of ${a} and ${b}. The first positive one is their least common multiple, ${interval} minutes.${window === null ? ` So the next shared flash is after ${interval} minutes.` : ` Shared flashes are ${interval}, ${2 * interval}, ${3 * interval}, … minutes from now. ${window} ÷ ${interval} gives ${value} complete intervals, so there are ${value} later shared flashes.`}`,
    hint: 'Find the first shared positive multiple. If a time window is given, count its complete shared intervals, excluding now.',
  }, value, window === null ? [
    wrong(gcd(a, b), 'factor-multiple'), wrong(a + b, 'wrong-operation'),
    wrong(a * b, 'factor-multiple'), wrong(Math.max(a, b), 'ignored-condition'),
  ] : [
    wrong(value + 1, 'counted-endpoints'), wrong(Math.floor(window / gcd(a, b)), 'factor-multiple'),
    wrong(interval, 'missing-step'), wrong(Math.floor(window / a) + Math.floor(window / b), 'ignored-condition'),
  ]);
};

export function draftNumbers(family, grade, level, r, bank3 = false) {
  if (!NUMBER_FAMILIES.includes(family) || !DRAFTS[family]) throw new RangeError(`Unknown number family: ${family}`);
  if (![1, 2, 3].includes(level)) throw new RangeError('Number questions need level 1, 2 or 3.');
  singular = bank3;
  try { return DRAFTS[family](family, grade, level, r); } finally { singular = false; }
}

function optionsOf(question) {
  if (Array.isArray(question.choices)) return question.choices;
  if (Array.isArray(question.options)) {
    assert(!question.optionVisuals || question.optionVisuals.length === question.options.length, 'graphical options are not aligned with their keys');
    return question.options.map((value, index) => ({ value, visual: question.optionVisuals?.[index] ?? null }));
  }
  return [];
}
function checkGraphicalOptions(question) {
  for (const option of optionsOf(question)) {
    if (!option.visual) continue;
    assert(typeof option.visual.description === 'string' && option.visual.description.length > 10, 'a graphical option needs a description');
    if (option.visual.kind === `${PREFIX}abacus`) {
      const value = readRods(option.visual.rods);
      const text = String(option.value);
      const matches = text.startsWith('Abacus:') ? [false, true].some(useSingular => abacusKeyWith(option.visual.rods, useSingular) === text) : text === String(value);
      assert(matches, 'abacus option key disagrees with its pictured rods');
    } else if (option.visual.kind === `${PREFIX}fraction`) {
      assert(String(option.value) === fractionKey(option.visual.cells), 'fraction option key disagrees with its shaded equal parts');
    } else {
      throw new Error(`Number-bank proof: unexpected graphical option ${option.visual.kind}`);
    }
  }
}
function mainVisual(question, type) {
  assert(question.visual?.kind === `${PREFIX}${type}`, `expected a ${type} diagram`);
  assert(typeof question.visual.description === 'string' && question.visual.description.length > 10, 'a diagram needs an accessible description');
  assert(question.proof.diagram && typeof question.proof.diagram === 'object', 'missing pictured-givens snapshot');
  equal(facts(question.visual), question.proof.diagram, 'diagram givens disagree with the proof');
  return question.visual;
}
function answerKey(question, value) {
  const key = String(value);
  const options = optionsOf(question);
  if (options.length) assert(options.filter(option => String(option.value) === key).length === 1, 'the recomputed answer must match exactly one option');
  return key;
}
function properFraction(cells) {
  const fraction = readFraction(cells);
  assert(fraction.numerator > 0 && fraction.numerator < fraction.denominator, 'a proper nonzero fraction is needed');
  return fraction;
}

export function solveNumbers(question) {
  assert(question && question.proof && typeof question.proof === 'object', 'missing question proof');
  const family = question.family ?? question.proof.family;
  assert(NUMBER_FAMILIES.includes(family) && family === question.proof.family, 'unknown or inconsistent number family');
  checkGraphicalOptions(question);
  const proof = question.proof;
  let value;
  if (family === 'abacus-read') {
    value = readRods(mainVisual(question, 'abacus').rods);
  } else if (family === 'abacus-change') {
    const visual = mainVisual(question, 'abacus');
    value = swapPlaces(readRods(changeRods(visual.rods, proof.from, proof.to)), proof.swap, visual.rods.length);
  } else if (family === 'abacus-combine') {
    const visual = mainVisual(question, 'abacus-pair');
    assert(visual.panels.length === 2 && visual.panels[0].rods.length === visual.panels[1].rods.length, 'two matching sets of abacus rods are needed');
    const total = sum(visual.panels.map(panel => readRods(panel.rods)));
    value = swapPlaces(total, proof.swap, visual.panels[0].rods.length);
  } else if (family === 'number-clues') {
    const model = mainVisual(question, 'digit-clues');
    const solutions = clueCandidates(model).filter(item => item.matches.every(Boolean));
    assert(solutions.length === 1, 'the digit clues do not have exactly one solution');
    value = solutions[0].value;
  } else if (family === 'number-build') {
    const model = mainVisual(question, 'digit-cards');
    assert(model.digits.length >= 2 && model.digits.length <= 8 && model.digits.every(digit => integer(digit) && digit <= 9), 'invalid digit cards');
    assert(['smallest', 'greatest'].includes(model.order) && [null, 'even', 'odd'].includes(model.parity), 'invalid build constraint');
    if (model.parity || model.limit) {
      const candidates = permutations(model.digits).filter(candidate => obeysBuild(candidate, model));
      assert(candidates.length > 0, 'no digit arrangement meets all the conditions');
      value = model.order === 'smallest' ? candidates[0] : candidates.at(-1);
    } else value = extremeDigits(model.digits, model.order);
  } else if (family === 'number-compare') {
    const options = optionsOf(question);
    assert(options.length >= 2 && options.every(option => option.visual?.kind === `${PREFIX}abacus`), 'comparison choices must all be abacus diagrams');
    assert(Array.isArray(proof.cards), 'missing comparison-card givens');
    equal(options.map(option => JSON.stringify(facts(option.visual))).sort(),
      proof.cards.map(card => JSON.stringify(card)).sort(), 'comparison-card diagrams disagree with their givens');
    const cards = options.map(option => ({ key: option.value, number: readRods(option.visual.rods) }));
    if (proof.task === 'qualifying') {
      assert(integer(proof.lower) && integer(proof.upper) && proof.upper > proof.lower && integer(proof.add) && integer(proof.divisibleBy, 1), 'invalid comparison conditions');
      const matches = cards.filter(card => card.number > proof.lower && card.number < proof.upper && (card.number + proof.add) % proof.divisibleBy === 0);
      assert(matches.length === 1, 'exactly one abacus must satisfy all the conditions');
      value = matches[0].key;
    } else {
      assert(['smallest', 'greatest'].includes(proof.task), 'unknown comparison task');
      const best = proof.task === 'greatest' ? Math.max(...cards.map(card => card.number)) : Math.min(...cards.map(card => card.number));
      const matches = cards.filter(card => card.number === best);
      assert(matches.length === 1, 'comparison has tied best values');
      value = matches[0].key;
    }
  } else if (family === 'roman-number') {
    const model = mainVisual(question, 'roman');
    assert(['+', '−'].includes(model.operation), 'invalid Roman calculation operation');
    const a = fromRoman(model.left);
    const b = fromRoman(model.right);
    value = model.operation === '+' ? a + b : a - b;
    assert(integer(value), 'the Roman calculation must be nonnegative');
  } else if (family === 'picture-add' || family === 'equal-groups') {
    const model = mainVisual(question, family === 'picture-add' ? 'addition' : 'groups');
    assert(Array.isArray(model.groups) && model.groups.length > 0 && model.groups.every(count => integer(count, 1)), 'invalid pictured collections');
    if (family === 'equal-groups') assert(model.groups.every(count => count === model.groups[0]) && integer(model.loose), 'the pictured groups are not equal');
    value = sum(model.groups) + (model.loose ?? 0);
  } else if (family === 'bar-unknown') {
    const model = mainVisual(question, 'bar');
    assert(integer(model.total, 1) && model.segments.filter(segment => segment.value === null).length === 1, 'the bar needs one unknown part and a whole');
    const known = model.segments.filter(segment => segment.value !== null).map(segment => segment.value);
    assert(known.every(part => integer(part)), 'invalid known bar part');
    value = model.total - sum(known);
    assert(integer(value, 1), 'known bar parts leave no positive unknown part');
  } else if (family === 'sharing-remainder') {
    const model = mainVisual(question, 'sharing');
    assert(integer(model.groups, 1) && integer(model.groupSize, 2) && integer(model.leftover) && model.leftover < model.groupSize, 'invalid pictured full groups or remainder');
    assert(Number.isSafeInteger(proof.change), 'invalid change before repacking');
    const total = model.groups * model.groupSize + model.leftover + proof.change;
    assert(integer(total), 'too many counters were taken away');
    assert(['full', 'leftover', 'containers'].includes(proof.ask), 'the remainder rule must be explicit');
    assert(integer(proof.bag, 2) && proof.bag !== model.groupSize, 'the counters must be repacked into a different group size');
    value = proof.ask === 'full' ? Math.floor(total / proof.bag)
      : proof.ask === 'leftover' ? total % proof.bag : Math.ceil(total / proof.bag);
    assert(value !== model.groups || proof.ask !== 'full', 'the answer must not simply be the pictured crate count');
  } else if (family === 'two-stage') {
    const model = mainVisual(question, 'flow');
    assert(model.steps.length === 2 && integer(model.endValue), 'invalid two-stage flow');
    value = model.endValue;
    for (const step of [...model.steps].reverse()) {
      assert(integer(step.value, 1), 'invalid step quantity');
      if (step.operation === '+') value -= step.value;
      else if (step.operation === '−') value += step.value;
      else if (step.operation === '×') value /= step.value;
      else if (step.operation === '÷') value *= step.value;
      else throw new Error('Number-bank proof: unknown reverse-flow operation');
    }
    assert(integer(value, 1), 'the starting quantity is not a positive whole number');
  } else if (family === 'symbol-equations') {
    const model = mainVisual(question, 'equations');
    value = solveSymbols(model.equations, model.target).value;
  } else if (family === 'digit-algorithm') {
    const model = mainVisual(question, 'calculation');
    const candidates = calculationCandidates(model);
    assert(candidates.length === 1, 'the written calculation has no unique missing digit');
    value = candidates[0];
  } else if (family === 'number-pattern' || family === 'alternating-pattern') {
    const model = mainVisual(question, 'sequence');
    assert(model.alternating === (family === 'alternating-pattern'), 'sequence rule disagrees with the question family');
    value = sequenceValue(model.values, model.alternating).value;
  } else if (family === 'fraction-picture') {
    const fraction = readFraction(mainVisual(question, 'fraction').cells);
    value = `${fraction.numerator}/${fraction.denominator}`;
  } else if (family === 'fraction-change') {
    const fraction = readFraction(mainVisual(question, 'fraction').cells);
    assert(['shade', 'erase'].includes(proof.action) && integer(proof.amount, 1), 'invalid shading change');
    const before = fraction.numerator + (proof.action === 'shade' ? -proof.amount : proof.amount);
    assert(integer(before) && before <= fraction.denominator, 'the reverse shading condition is impossible');
    value = `${before}/${fraction.denominator} shaded`;
  } else if (family === 'fraction-group') {
    if (proof.mode === 'reverse') {
      const fraction = properFraction(mainVisual(question, 'fraction').cells);
      assert(integer(proof.remaining, 1), 'the remaining token count is missing');
      value = proof.remaining * fraction.denominator / (fraction.denominator - fraction.numerator);
    } else {
      assert(proof.mode === 'of-group', 'unknown fraction-of-collection task');
      const model = mainVisual(question, 'groups');
      assert(model.loose === 0 && model.groups.length > 1 && model.groups.every(count => integer(count, 1) && count === model.groups[0]), 'fraction groups must be equal and cover the whole');
      assert(integer(model.selectedGroups, 1) && model.selectedGroups < model.groups.length && model.selectedGroups === proof.numerator, 'selected groups disagree with the fraction');
      value = sum(model.groups.slice(0, model.selectedGroups));
    }
    assert(integer(value, 1), 'a collection fraction does not give whole tokens');
  } else if (family === 'fraction-left') {
    if (proof.mode === 'reverse-fixed') {
      const fraction = properFraction(mainVisual(question, 'fraction').cells);
      assert(integer(proof.remaining, 1) && integer(proof.extraUsed, 1), 'missing fixed-use givens');
      value = (proof.remaining + proof.extraUsed) * fraction.denominator / (fraction.denominator - fraction.numerator);
    } else {
      const model = mainVisual(question, 'fraction-chain');
      assert(model.stages.length === 2, 'a fraction chain needs two different wholes');
      const first = properFraction(model.stages[0].cells);
      const second = properFraction(model.stages[1].cells);
      const keptNumerator = (first.denominator - first.numerator) * (second.denominator - second.numerator);
      const wholeDenominator = first.denominator * second.denominator;
      if (proof.mode === 'forward') {
        assert(integer(proof.total, 1), 'missing original collection count');
        value = proof.total * keptNumerator / wholeDenominator;
      } else {
        assert(proof.mode === 'reverse' && integer(proof.remaining, 1), 'missing reverse remainder count');
        value = proof.remaining * wholeDenominator / keptNumerator;
      }
    }
    assert(integer(value, 1), 'the fraction chain does not give a whole-token answer');
  } else if (family === 'fraction-compare') {
    const options = optionsOf(question);
    assert(proof.task === 'greatest' && options.length === 4 && options.every(option => option.visual?.kind === `${PREFIX}fraction`), 'fraction comparison needs four equal-whole picture choices');
    const fractions = options.map(option => ({ key: option.value, ...readFraction(option.visual.cells) }));
    assert(Array.isArray(proof.fractions), 'missing fraction-choice givens');
    equal(fractions.map(item => `${item.numerator}/${item.denominator}`).sort(),
      proof.fractions.map(item => `${item.numerator}/${item.denominator}`).sort(), 'fraction-choice diagrams disagree with their givens');
    const best = fractions.reduce((a, b) => a.numerator * b.denominator >= b.numerator * a.denominator ? a : b);
    assert(fractions.filter(item => item.numerator * best.denominator === best.numerator * item.denominator).length === 1, 'fraction comparison has a tied greatest amount');
    value = best.key;
  } else if (family === 'fraction-statements') {
    const model = mainVisual(question, 'fraction-board');
    assert(model.panels.length === 2 && Array.isArray(proof.claims) && proof.claims.length === 2, 'fraction statements need two panels and two claims');
    const fractions = model.panels.map(panel => readFraction(panel.cells));
    value = statementKey(...proof.claims.map(claim => fractionClaim(claim, fractions)));
  } else if (family === 'decimal-model') {
    value = decimal(readHundredths(mainVisual(question, 'hundredths').cells));
  } else if (family === 'decimal-context') {
    const model = mainVisual(question, 'decimal-story');
    let cents;
    if (model.mode === 'forward') {
      assert([model.startCents, model.takenCents, model.addedCents].every(amount => integer(amount)), 'invalid decimal quantities');
      assert(model.startCents >= model.takenCents, 'the tank cannot lose more than it contains');
      cents = model.startCents - model.takenCents + model.addedCents;
    } else {
      assert(model.mode === 'reverse' && [model.finalCents, model.addedCents, model.tubeCents].every(amount => integer(amount)) && integer(model.tubeCount, 1), 'invalid reverse decimal quantities');
      assert(model.finalCents >= model.addedCents, 'the final addition exceeds the final reading');
      cents = model.finalCents - model.addedCents + model.tubeCount * model.tubeCents;
    }
    value = decimal(cents);
  } else if (family === 'decimal-statements') {
    const model = mainVisual(question, 'decimal-statements');
    const cents = readHundredths(model.cells);
    assert(integer(model.firstClaim.count) && ['tenths', 'hundredths'].includes(model.firstClaim.unit), 'invalid decimal place-value claim');
    assert(integer(model.secondClaim.addendCents) && integer(model.secondClaim.statedCents), 'invalid decimal calculation claim');
    const first = cents === model.firstClaim.count * (model.firstClaim.unit === 'tenths' ? 10 : 1);
    const second = cents + model.secondClaim.addendCents === model.secondClaim.statedCents;
    value = statementKey(first, second);
  } else if (family === 'factor-compare') {
    const model = mainVisual(question, 'factor-pair');
    assert(integer(model.a, 1) && integer(model.b, 1) && ['hcf', 'lcm'].includes(model.task), 'invalid factor cards');
    value = model.task === 'hcf' ? gcd(model.a, model.b) : lcm(model.a, model.b);
  } else if (family === 'factor-application') {
    const model = mainVisual(question, 'factor-story');
    if (model.context === 'packs') {
      assert([model.red, model.blue, model.reserveRed, model.reserveBlue].every(amount => integer(amount)), 'invalid badge supplies');
      const red = model.red - model.reserveRed;
      const blue = model.blue - model.reserveBlue;
      assert(red > 0 && blue > 0 && ['items-per-pack', 'pack-count'].includes(model.task), 'invalid reserve or pack question');
      const packs = gcd(red, blue);
      value = model.task === 'pack-count' ? packs : red / packs + blue / packs;
    } else {
      assert(model.context === 'beacons' && integer(model.a, 1) && integer(model.b, 1), 'invalid beacon periods');
      const interval = lcm(model.a, model.b);
      if (model.window === null) value = interval;
      else {
        assert(integer(model.window, 1), 'the beacon counting window is missing');
        value = Math.floor(model.window / interval);
      }
    }
  } else throw new Error(`Number-bank proof: unimplemented solver ${family}`);
  return answerKey(question, value);
}

function wrapped(value, x, y, length = 45, size = 19, anchor = 'start') {
  const words = String(value).split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current && `${current} ${word}`.length > length) { lines.push(current); current = word; }
    else current = current ? `${current} ${word}` : word;
  }
  if (current) lines.push(current);
  return { body: lines.map((row, index) => text(x, y + index * (size + 8), row, { size, anchor })).join(''), height: lines.length * (size + 8) };
}
function abacusDrawing(rods, y = 0, label = '') {
  readRods(rods);
  const rows = Math.ceil(rods.length / 4);
  let body = label ? text(240, y + 24, label, { size: 22 }) : '';
  const top = y + (label ? 40 : 10);
  for (let row = 0; row < rows; row++) {
    const group = rods.slice(row * 4, row * 4 + 4);
    const spacing = 432 / group.length;
    const base = top + row * 205 + 120;
    body += line(30, base, 450, base, { width: 5 });
    group.forEach((rod, index) => {
      const x = 24 + spacing * (index + 0.5);
      body += line(x, base - 114, x, base, { width: 4 });
      for (let bead = 0; bead < rod.beads; bead++) body += rect(x - 19, base - 12 * (bead + 1), 38, 10, { fill: GREEN, rx: 5, strokeWidth: 1.5 });
      const labelLines = PLACE_NAMES[rod.place].replace('ten-', 'ten ').split(/[- ]/);
      labelLines.forEach((part, partIndex) => { body += text(x, base + 27 + partIndex * 23, part, { size: 18 }); });
      body += text(x, base + 76, PLACE_SHORT[rod.place], { size: 17, fill: '#675082' });
    });
  }
  return { body, height: (label ? 40 : 10) + rows * 205 };
}
function fractionDrawing(cells, x, y, width = 400, height = 100) {
  readFraction(cells);
  const cellWidth = width / cells[0].length;
  const cellHeight = height / cells.length;
  return cells.map((row, rowIndex) => row.map((shaded, column) => {
    const left = x + column * cellWidth;
    const top = y + rowIndex * cellHeight;
    return rect(left, top, cellWidth, cellHeight, { fill: shaded ? GREEN : PAPER, strokeWidth: 1.8 })
      + (shaded ? line(left + 4, top + cellHeight - 4, left + cellWidth - 4, top + 4, { width: 2 }) : '');
  }).join('')).join('');
}
function groupsDrawing(model) {
  let body = '';
  const rows = Math.ceil(model.groups.length / 3);
  model.groups.forEach((count, index) => {
    const x = 18 + index % 3 * 150;
    const y = 12 + Math.floor(index / 3) * 120;
    const selected = index < (model.selectedGroups ?? 0);
    body += rect(x, y, 142, 108, { rx: 10 });
    body += rect(x + 2, y + 2, 138, 27, { fill: selected ? '#f4d9ab' : '#e9efe8', strokeWidth: 0, rx: 8 });
    if (selected) body += line(x + 6, y + 24, x + 24, y + 6) + line(x + 117, y + 24, x + 135, y + 6);
    body += text(x + 71, y + 22, `Group ${index + 1}`, { size: 18 });
    for (let item = 0; item < count; item++) body += circle(x + 25 + item % 4 * 30, y + 46 + Math.floor(item / 4) * 24, 8, { fill: GREEN });
  });
  if (model.loose) {
    body += text(24, rows * 120 + 42, 'Loose:', { size: 20, anchor: 'start' });
    for (let index = 0; index < model.loose; index++) body += circle(125 + index * 35, rows * 120 + 35, 10, { fill: ORANGE });
  }
  if (model.selectedGroups) body += text(240, rows * 120 + 35, 'Hatched headers mark selected groups.', { size: 18 });
  return { body, height: rows * 120 + (model.loose || model.selectedGroups ? 70 : 15) };
}
function hundredthsDrawing(cells, y = 12) {
  readHundredths(cells);
  return fractionDrawing(cells, 120, y, 240, 240);
}
function labelledRows(rows, y = 20) {
  return rows.map(([label, value], index) => {
    const top = y + index * 66;
    return rect(18, top, 444, 58, { fill: index % 2 ? '#edf3ef' : PAPER, rx: 9, strokeWidth: 1.5 })
      + text(36, top + 37, label, { size: 21, anchor: 'start' })
      + text(440, top + 37, value, { size: 25, anchor: 'end' });
  }).join('');
}

export function renderNumbers(visual) {
  if (!visual || typeof visual.kind !== 'string' || !visual.kind.startsWith(PREFIX)) throw new RangeError(`Unknown number diagram: ${visual?.kind}`);
  if (typeof visual.description !== 'string' || !visual.description.trim()) throw new Error('A number diagram needs an accessible description.');
  let body = '';
  let height = 260;
  const type = visual.kind.slice(PREFIX.length);
  if (type === 'abacus') {
    ({ body, height } = abacusDrawing(visual.rods, 0, visual.label));
  } else if (type === 'abacus-pair') {
    let top = 0;
    for (const panel of visual.panels) {
      const drawing = abacusDrawing(panel.rods, top, `Abacus ${panel.label}`);
      body += drawing.body;
      top += drawing.height;
    }
    height = top + 12;
  } else if (type === 'digit-clues') {
    const slotWidth = Math.min(60, 432 / visual.width);
    const left = (480 - slotWidth * visual.width) / 2;
    for (let index = 0; index < visual.width; index++) {
      const x = left + index * slotWidth;
      body += rect(x + 3, 20, slotWidth - 6, 61, { rx: 8, fill: index < visual.prefix.length ? '#edf3ef' : PAPER });
      body += text(x + slotWidth / 2, 62, index < visual.prefix.length ? visual.prefix[index] : '?', { size: 32 });
      body += text(x + slotWidth / 2, 109, PLACE_SHORT[10 ** (visual.width - index - 1)], { size: 18 });
    }
    let y = 153;
    for (const rule of visual.rules) {
      const drawing = wrapped(clueText(rule, visual.width), 24, y, 43, 19);
      body += drawing.body;
      y += drawing.height + 9;
    }
    height = y + 18;
  } else if (type === 'digit-cards') {
    const count = Math.min(4, visual.digits.length);
    const spacing = 88;
    const start = (480 - count * spacing) / 2;
    visual.digits.forEach((digit, index) => {
      const x = start + index % 4 * spacing;
      const y = 16 + Math.floor(index / 4) * 91;
      body += rect(x, y, 72, 73, { fill: index % 2 ? '#f4d9ab' : '#e3efe7', rx: 12 });
      body += text(x + 36, y + 52, digit, { size: 38 });
    });
    const bottom = 30 + Math.ceil(visual.digits.length / 4) * 91;
    const note = `${visual.order[0].toUpperCase() + visual.order.slice(1)} number; every card once.${visual.parity ? ` Must be ${visual.parity}.` : ''}${visual.limit ? ` Must be ${visual.limit.direction} than ${numberText(visual.limit.value)}.` : ''} No leading zero.`;
    const drawing = wrapped(note, 24, bottom, 43, 20);
    body += drawing.body;
    height = bottom + drawing.height + 12;
  } else if (type === 'addition') {
    visual.groups.forEach((count, index) => {
      const x = index ? 273 : 23;
      body += rect(x, 25, 184, 178, { rx: 15 });
      for (let item = 0; item < count; item++) body += icon('star', x + 20 + item % 3 * 49, 47 + Math.floor(item / 3) * 48, 37, GREEN);
    });
    body += text(240, 128, '+', { size: 42 });
    height = 225;
  } else if (type === 'bar') {
    body += line(26, 62, 454, 62) + line(26, 54, 26, 70) + line(454, 54, 454, 70);
    body += text(240, 42, `Whole: ${visual.total}`, { size: 26 });
    const width = 428 / visual.segments.length;
    visual.segments.forEach((segment, index) => {
      body += rect(26 + index * width, 92, width, 80, { fill: segment.value === null ? '#f4d9ab' : '#e3efe7' });
      body += text(26 + (index + 0.5) * width, 142, segment.value === null ? '?' : segment.value, { size: 30 });
    });
    body += text(240, 217, 'Parts together make the whole (not to scale).', { size: 18 });
    height = 244;
  } else if (type === 'groups') {
    ({ body, height } = groupsDrawing(visual));
  } else if (type === 'sharing') {
    const rows = Math.ceil(visual.groups / 3);
    for (let index = 0; index < visual.groups; index++) {
      const x = 25 + index % 3 * 150;
      const y = 15 + Math.floor(index / 3) * 100;
      body += rect(x, y, 130, 80, { rx: 8, fill: '#e3efe7' });
      body += text(x + 65, y + 27, 'Full crate', { size: 18 });
      body += text(x + 65, y + 59, `${visual.groupSize} inside`, { size: 22 });
    }
    body += text(24, rows * 100 + 36, 'Loose:', { size: 20, anchor: 'start' });
    for (let index = 0; index < visual.leftover; index++) body += circle(115 + index % 11 * 29, rows * 100 + 30 + Math.floor(index / 11) * 30, 9, { fill: ORANGE });
    height = rows * 100 + 70;
  } else if (type === 'flow') {
    const labels = [visual.startLabel, '? after step 1', String(visual.endValue)];
    labels.forEach((label, index) => {
      const y = 15 + index * 102;
      body += rect(40, y, 205, 51, { rx: 10, fill: index === 2 ? '#e3efe7' : PAPER });
      body += text(142, y + 34, label, { size: 23 });
      if (index < 2) {
        body += line(142, y + 53, 142, y + 96, { width: 3 });
        body += path(`M136 ${y + 88}l6 8 6-8`, { strokeWidth: 3 });
        body += text(270, y + 83, `${visual.steps[index].operation} ${visual.steps[index].value}`, { size: 27, anchor: 'start' });
      }
    });
    height = 294;
  } else if (type === 'equations') {
    const rows = [...visual.equations, { terms: visual.target, total: '?' }];
    rows.forEach((row, index) => {
      const top = 18 + index * 87;
      row.terms.forEach((term, position) => {
        body += icon(term, 20 + position * 79, top, 46, term === 'star' ? ORANGE : GREEN);
        if (position < row.terms.length - 1) body += text(82 + position * 79, top + 31, '+', { size: 25 });
      });
      body += text(351, top + 32, '=', { size: 28 }) + text(420, top + 32, row.total, { size: 29 });
    });
    height = 283;
  } else if (type === 'calculation') {
    const digits = (word, y) => [...word].map((character, index) => {
      const x = 400 - (word.length - index - 1) * 49;
      return character === '□'
        ? rect(x - 17, y - 33, 34, 40, { fill: '#f4d9ab', rx: 5 })
        : text(x, y, character, { size: 37 });
    }).join('');
    body = digits(visual.topMask, 67) + text(165, 130, '×', { size: 37 }) + text(400, 130, visual.factor, { size: 37 })
      + line(150, 150, 435, 150, { width: 3 }) + digits(visual.bottomMask, 209)
      + text(240, 259, 'Every box is the same missing digit.', { size: 19 });
    height = 284;
  } else if (type === 'sequence') {
    const size = visual.values.length > 5 ? 58 : 78;
    const left = (480 - size * visual.values.length) / 2;
    visual.values.forEach((value, index) => {
      const x = left + index * size;
      body += rect(x + 2, 55, size - 5, 66, { rx: 9, fill: value === null ? '#f4d9ab' : PAPER });
      body += text(x + (size - 1) / 2, 99, value === null ? '?' : value, { size: 28 });
      body += text(x + (size - 1) / 2, 151, index + 1, { size: 17 });
    });
    body += text(240, 196, visual.alternating ? 'Positions: separate odd and even rules.' : 'Positions: use the same change each step.', { size: 19 });
    height = 226;
  } else if (type === 'fraction') {
    if (visual.label) body += text(240, 29, visual.label, { size: 22 });
    body += fractionDrawing(visual.cells, 40, 55, 400, 116);
    body += text(240, 213, 'Hatched parts are shaded.', { size: 20 });
    height = 241;
  } else if (type === 'fraction-board') {
    visual.panels.forEach((panel, index) => {
      body += text(35, 29 + index * 159, panel.label, { size: 24, anchor: 'start' });
      body += fractionDrawing(panel.cells, 40, 43 + index * 159, 400, 102);
    });
    body += text(240, visual.panels.length * 159 + 19, 'Equal-sized wholes; hatched parts are shaded.', { size: 18 });
    height = visual.panels.length * 159 + 45;
  } else if (type === 'fraction-chain') {
    const first = properFraction(visual.stages[0].cells);
    visual.stages.forEach((stage, index) => {
      body += text(240, 29 + index * 156, stage.label, { size: 21 });
      const width = index === 0 ? 400 : 400 * (first.denominator - first.numerator) / first.denominator;
      body += fractionDrawing(stage.cells, 40, 46 + index * 156, width, 94);
    });
    body += text(240, 349, 'The second whole is only the remainder.', { size: 19 });
    height = 377;
  } else if (type === 'hundredths' || type === 'decimal-statements') {
    body += hundredthsDrawing(visual.cells);
    body += text(240, 285, '1 whole = 100 equal squares', { size: 21 });
    body += text(240, 314, 'Hatched squares are shaded.', { size: 19 });
    height = 341;
    if (type === 'decimal-statements') {
      const first = wrapped(`1. Shaded part: ${visual.firstClaim.count} ${visual.firstClaim.unit}.`, 22, 354, 43, 19);
      const second = wrapped(`2. Shaded decimal + ${decimal(visual.secondClaim.addendCents)} = ${decimal(visual.secondClaim.statedCents)}.`, 22, 354 + first.height + 12, 43, 19);
      body += first.body + second.body;
      height = 385 + first.height + second.height;
    }
  } else if (type === 'decimal-story') {
    const rows = visual.mode === 'forward'
      ? [['Start', `${decimal(visual.startCents)} L`], ['Taken out', `${decimal(visual.takenCents)} L`], ['Then added', `${decimal(visual.addedCents)} L`]]
      : [['Tubes filled', visual.tubeCount], ['Each tube', `${decimal(visual.tubeCents)} L`], ['Then added', `${decimal(visual.addedCents)} L`], ['Final tank reading', `${decimal(visual.finalCents)} L`]];
    body += labelledRows(rows);
    height = rows.length * 66 + 38;
  } else if (type === 'factor-pair') {
    body += rect(40, 25, 165, 108, { fill: '#e3efe7', rx: 15 }) + rect(275, 25, 165, 108, { fill: '#f4d9ab', rx: 15 });
    body += text(122, 95, visual.a, { size: 43 }) + text(357, 95, visual.b, { size: 43 });
    const note = wrapped(visual.task === 'hcf' ? 'Greatest positive number dividing both exactly.' : 'Least positive multiple shared by both.', 240, 183, 38, 22, 'middle');
    body += note.body;
    height = 209 + note.height;
  } else if (type === 'factor-story') {
    if (visual.context === 'packs') {
      body += labelledRows([['Red badges (R)', visual.red], ['Blue badges (B)', visual.blue], ['Keep back R', visual.reserveRed], ['Keep back B', visual.reserveBlue]]);
      body += text(240, 313, 'Identical packs; no badges left over.', { size: 20 });
      height = 344;
    } else {
      body += labelledRows([['Beacon A: every', `${visual.a} min`], ['Beacon B: every', `${visual.b} min`]]);
      body += text(240, 198, 'Both flash together now.', { size: 23 });
      if (visual.window !== null) {
        body += text(240, 240, `Next ${visual.window} minutes; do not count now.`, { size: 21 });
        height = 279;
      } else height = 234;
    }
  } else if (type === 'roman') {
    body += rect(18, 35, 195, 108, { fill: '#e3efe7', rx: 12 }) + rect(267, 35, 195, 108, { fill: '#f4d9ab', rx: 12 });
    body += text(115, 100, visual.left, { size: visual.left.length > 6 ? 24 : 30 })
      + text(240, 101, visual.operation, { size: 36 })
      + text(365, 100, visual.right, { size: visual.right.length > 6 ? 24 : 30 });
    body += text(240, 197, 'Decode each card, then calculate.', { size: 22 });
    height = 228;
  } else throw new RangeError(`Unknown number diagram: ${visual.kind}`);
  return svg(body, visual.description, 480, height);
}
