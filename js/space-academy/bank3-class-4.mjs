import { MISCONCEPTIONS as SHARED, QuestionRetry, answerChoices, choiceCount, numberArticle, numberText, wrong } from './bank-shared.mjs';
import { render as renderOld } from './bank3-class-4-art.mjs';
import { REAL_FAMILIES, draftReal, isReal, renderReal, solveReal } from './bank3-class-4-real.mjs';
const pl = (count, one, many = `${one}s`) => `${count} ${Number(count) === 1 ? one : many}`;
const ordinalSuffix = n => (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');

export const render = visual => renderReal(visual) ?? renderOld(visual);

const entry = (skill, title) => ({ skill, title });
export const FAMILIES = {
  ...REAL_FAMILIES,
  'class-4-digit-lock': entry('place', 'Arrange digit cards under a lock rule'),
  'class-4-roman-tablets': entry('expand', 'Calculate with Roman specimen codes'),
  'class-4-rounding-line': entry('place', 'Round a marked point on a number line'),
  'class-4-factor-trays': entry('factors', 'Choose equal trays or a shared signal time'),
  'class-4-part-bars': entry('mystery', 'Recover a count from comparison bars'),
  'class-4-split-product': entry('groups', 'Complete a multiplication area model'),
  'class-4-division-manifest': entry('sharing', 'Interpret packing remainders'),
  'class-4-column-repair': entry('addition', 'Recover a missing column digit'),
  'class-4-equivalent-bars': entry('fraction-compare', 'Match an equivalent fraction model'),
  'class-4-fraction-line': entry('fraction-read', 'Read a fraction across whole units'),
  'class-4-sample-share': entry('fraction-of', 'Take a fraction of grouped specimens'),
  'class-4-fraction-leftovers': entry('fraction-of', 'Track two uses of a whole supply'),
  'class-4-l-bench': entry('area', 'Measure an L-shaped laboratory bench'),
  'class-4-mirror-panel': entry('symmetry', 'Complete a reflected sensor panel'),
  'class-4-folded-cube': entry('solids', 'Find an opposite face in a cube net'),
  'class-4-angle-gap': entry('angles', 'Complete angles along a straight edge'),
  'class-4-offset-ruler': entry('measure', 'Measure between non-zero ruler marks'),
  'class-4-lab-temperature': entry('measure', 'Read a thermometer and a temperature change'),
  'class-4-balance-crates': entry('measure', 'Find one mass on a balanced scale'),
  'class-4-unit-log': entry('measure', 'Combine mixed units in a laboratory log'),
  'class-4-task-timeline': entry('time', 'Find a missing interval on a timeline'),
  'class-4-shuttle-table': entry('time', 'Use a timetable with a waiting condition'),
  'class-4-lab-calendar': entry('calendar', 'Schedule an event on a calendar'),
  'class-4-clock-repair': entry('time', 'Correct a fast or slow station clock'),
  'class-4-receipt-gap': entry('money', 'Recover a missing receipt price'),
  'class-4-best-bundle': entry('money', 'Compare equal quantities in bundle offers'),
  'class-4-supply-budget': entry('money', 'Choose the most supplies within a budget'),
  'class-4-change-counter': entry('money', 'Give change in rupees and paise'),
  'class-4-scaled-bars': entry('chart', 'Read a bar chart with a non-unit scale'),
  'class-4-half-pictograph': entry('chart', 'Read whole and half pictograph symbols'),
  'class-4-paired-surveys': entry('chart', 'Combine two survey displays'),
  'class-4-chart-transfer': entry('chart', 'Choose a true statement after a transfer'),
  'class-4-rank-repair': entry('ranking', 'Update a rank when a queue changes'),
  'class-4-rover-program': entry('directions', 'Follow a rover program in its own frame'),
  'class-4-checkpoint-routes': entry('routes', 'Count grid routes through a checkpoint'),
  'class-4-code-machine': entry('coding', 'Infer a rule from input and output pairs'),
  'class-4-alternating-lock': entry('sequence', 'Separate two interleaved number patterns'),
};

export const MISCONCEPTIONS = {
  'class-4-column-carry': { title: 'A carry belongs to one column', message: 'Use the carry from the column on the right, not the digit above the blank.' },
  'class-4-equivalent-scale': { title: 'Equivalent parts', message: 'Multiply or divide both the numerator and denominator by the same number.' },
  'class-4-half-symbol': { title: 'A half symbol', message: 'A half symbol represents half the value of the complete symbol in the key.' },
  'class-4-queue-change': { title: 'Changes ahead or behind', message: 'Only people who join or leave ahead of you change your rank from the front.' },
  'class-4-interleaved': { title: 'Two separate patterns', message: 'Read every other term as its own pattern before filling the gap.' },
  'class-4-money-borrow': { title: 'Borrowing a rupee', message: 'When the paise need an exchange, trade one rupee for one hundred paise before subtracting.' },
  'class-4-roman-subtract': { title: 'Roman symbol order', message: 'Read the symbols in order; a smaller Roman symbol immediately before a larger one is subtracted.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };
const levels = (...rows) => rows.map(ids => ids.split(/\s+/).map(id => `class-4-${id}`).join(' '));
export const PLAN = {
  numbers: levels(
    'place-value-gap order-numbers compare-statements words-place factor-facts rounding-line     digit-lock roman-tablets odd-one-out letter-shift',
    'place-value-gap number-clues compare-statements order-numbers factor-facts multiple-facts words-place roman-tablets digit-lock rounding-line',
    'number-clues compare-statements factor-facts multiple-facts words-place roman-tablets digit-lock factor-trays place-value-gap alternating-lock rounding-line',
  ),
  operations: levels(
    'multiply-story divide-pack story-total long-division split-product division-manifest column-repair',
    'multiply-story divide-pack story-total sum-diff-pieces long-division two-prices split-product division-manifest part-bars column-repair',
    'story-total sum-diff-pieces letter-multiplication long-division two-prices part-bars multiply-story column-repair division-manifest',
  ),
  fractions: levels(
    'shaded-grid fraction-quantity fraction-share fraction-line sample-share equivalent-bars fraction-claims',
    'shaded-grid fraction-claims fraction-quantity fraction-share mixed-measure equivalent-bars fraction-line sample-share fraction-leftovers',
    'fraction-claims fraction-quantity fraction-share mixed-measure equivalent-bars fraction-leftovers shaded-grid sample-share',
  ),
  geometry: levels(
    'perimeter-word area-word solid-facts mirror-panel angle-gap l-bench',
    'perimeter-word perimeter-unknown area-word solid-facts l-bench mirror-panel folded-cube angle-gap',
    'perimeter-unknown perimeter-word area-word l-bench mirror-panel folded-cube angle-gap checkpoint-routes',
  ),
  measurement: levels(
    'mass-units measure-share offset-ruler lab-temperature balance-crates unit-log',
    'mass-units rice-packs measure-share offset-ruler lab-temperature balance-crates unit-log scale-weights',
    'mass-units rice-packs measure-share balance-crates unit-log offset-ruler scale-weights code-machine',
  ),
  time: levels(
    'clock-duration time-units date-gap task-timeline shuttle-table lab-calendar',
    'age-sum clock-duration time-units date-gap task-timeline shuttle-table lab-calendar clock-repair',
    'age-sum clock-duration date-gap shuttle-table lab-calendar clock-repair task-timeline',
  ),
  money: levels(
    'bill-change price-gap unit-rate receipt-gap change-counter savings-weeks',
    'savings-weeks round-total price-gap unit-rate bill-change receipt-gap best-bundle supply-budget change-counter',
    'savings-weeks round-total price-gap unit-rate bill-change best-bundle supply-budget change-counter',
  ),
  data: levels(
    'score-table survey-rest half-pictograph scaled-bars library-compare bar-scale venn-count number-analogy',
    'score-table library-compare survey-rest scaled-bars half-pictograph paired-surveys chart-transfer bar-scale venn-count',
    'score-table library-compare paired-surveys chart-transfer scaled-bars survey-rest rank-repair bar-scale venn-count',
  ),
  reasoning: levels(
    'word-code cycle-position compass-turn letter-arrange row-order day-count number-series rover-program mirror-word blood-relation grid-rule',
    'word-code compass-turn letter-arrange alphabet-position row-order symmetry-letters paper-fold figure-analogy blood-relation number-series dictionary-order',
    'word-code compass-turn row-order day-count symmetry-letters grid-rule number-series embedded-figure figure-analogy pattern-complete paper-fold',
  ),
};

const NAMES = ['Mina', 'Ravi', 'Isha', 'Noor', 'Dev', 'Tara', 'Ari', 'Zoya'];
const GOODS = ['mirrors', 'probes', 'trays', 'filters', 'vials', 'clips'];
const SINGULAR = { mirrors: 'mirror', probes: 'probe', trays: 'tray', filters: 'filter', vials: 'vial', clips: 'clip' };
const name = r => r.pick(NAMES);
const pic = (kind, data, description) => ({ kind: `v3-class-4-${kind}`, ...data, description });
const numeric = (values, code) => values.map(value => wrong(value, code));
const fraction = (a, b) => `${a}/${b}`;
const money = paise => `Rs ${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, '0')}`;
const clockKey = minutes => {
  const t = ((minutes % 720) + 720) % 720;
  return `${Math.floor(t / 60) || 12}:${String(t % 60).padStart(2, '0')}`;
};
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const LABS = ['Luma', 'Nova', 'Vega', 'Orion', 'Lyra', 'Aster'];
const at = (x, y) => `(${x}, ${y})`;
function roverEnd(visual, { reverseTurns = false, ignoreTurns = false, skipLast = false } = {}) {
  let { x, y, facing } = visual;
  const commands = Array.from({ length: visual.repeat }, () => visual.commands).flat();
  const lastForward = commands.findLastIndex(command => command.action === 'F');
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    if (command.action === 'F') {
      if (skipLast && i === lastForward) continue;
      const [dx, dy] = [[0, 1], [1, 0], [0, -1], [-1, 0]][facing];
      x += dx * command.steps; y += dy * command.steps;
    } else if (!ignoreTurns) {
      facing = (facing + (command.action === 'R' ? 1 : 3) * (reverseTurns ? 3 : 1)) % 4;
    }
  }
  return { x, y };
}
function gridRoutes(width, height, closed = null) {
  const counts = Array.from({ length: height + 1 }, () => Array(width + 1).fill(0));
  counts[0][0] = 1;
  for (let y = 0; y <= height; y++) for (let x = 0; x <= width; x++) {
    if (x || y) {
      const fromLeft = x > 0 && !(closed?.direction === 'R' && closed.x === x - 1 && closed.y === y);
      const fromBelow = y > 0 && !(closed?.direction === 'U' && closed.x === x && closed.y === y - 1);
      counts[y][x] = (fromLeft ? counts[y][x - 1] : 0) + (fromBelow ? counts[y - 1][x] : 0);
    }
  }
  return counts[height][width];
}
function firstWeekday(year, month) {
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const y = month < 3 ? year - 1 : year;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + offsets[month - 1] + 1 + 6) % 7;
}
const choose = (n, k) => {
  let value = 1;
  for (let i = 1; i <= k; i++) value = value * (n - i + 1) / i;
  return Math.round(value);
};
const permutations = values => values.length === 1 ? [values] : values.flatMap((value, i) => permutations(values.filter((_, j) => j !== i)).map(tail => [value, ...tail]));
const digitValues = (cards, parity) => permutations(cards)
  .filter(digits => digits[0] !== 0 && (parity === 'any' || digits.at(-1) % 2 === (parity === 'even' ? 0 : 1)))
  .map(digits => Number(digits.join(''))).sort((a, b) => a - b);
function roman(number) {
  let result = '';
  for (const [value, letters] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) {
    while (number >= value) { result += letters; number -= value; }
  }
  return result;
}
function readRoman(value) {
  const units = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  return [...value].reduce((total, letter, i) => total + (units[letter] < (units[value[i + 1]] ?? 0) ? -units[letter] : units[letter]), 0);
}
function question(family, grade, prompt, givens, visual, answer, alternatives, hint, explanation, correctVisual = null) {
  const usable = alternatives.filter(alternative => !/^[-\u2212]/.test(String(alternative.value ?? alternative.text ?? alternative.label ?? '')));
  return {
    family, prompt, answer: String(answer), hint, explanation,
    proof: { family, givens }, ...(visual ? { visual } : {}),
    choices: answerChoices(answer, usable, choiceCount(grade), correctVisual, KNOWN),
  };
}

export function draft(family, grade, level, r) {
  if (isReal(family)) return draftReal(KNOWN, family, grade, level, r);
  const who = name(r);
  if (family === 'class-4-digit-lock') {
    const cards = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5);
    const parity = level === 1 ? 'any' : r.pick(['even', 'odd']);
    const order = r.pick(['smallest', 'largest']);
    const rank = level === 3 ? 2 : 1;
    const values = digitValues(cards, parity);
    if (values.length < 4) throw new QuestionRetry('Not enough card arrangements.');
    const index = order === 'smallest' ? rank - 1 : values.length - rank;
    const value = values[index];
    const all = digitValues(cards, 'any');
    const adjective = `${rank === 2 ? 'second ' : ''}${order}${parity === 'any' ? '' : ` ${parity}`}`;
    const visual = pic('digit-cards', { cards }, `Five digit cards: ${cards.join(', ')}. Each must be used once; a number cannot start with zero.`);
    const choices = [all[order === 'smallest' ? 0 : all.length - 1], values[0], values.at(-1), values[Math.max(0, index - 1)], values[Math.min(values.length - 1, index + 1)], values[1], values.at(-2), values[2], values.at(-3)]
      .map(v => wrong(numberText(v), 'ignored-condition'));
    return question(family, grade, r.pick([
      `${who}'s lock needs the ${adjective} number. Use every card once.`,
      `Build the ${adjective} number for ${who}'s specimen lock using all five cards.`,
    ]), { parity, order, rank }, visual, numberText(value), choices,
    'Choose the end digit first when the lock requires an odd or even number.',
    `${numberText(value)} uses every card once and is the ${adjective} allowed arrangement.`);
  }
  if (family === 'class-4-roman-tablets') {
    const a = r.int(35, level === 1 ? 110 : 360);
    const b = r.int(11, Math.min(85, a - 8));
    const operation = level === 1 ? 'read' : level === 2 ? 'add' : r.pick(['add', 'subtract']);
    const value = operation === 'read' ? a : operation === 'add' ? a + b : a - b;
    const answer = operation === 'read' ? String(value) : roman(value);
    const visual = pic('roman-tablets', { codes: [roman(a), roman(b)] }, `Specimen tablet A reads ${roman(a)}; tablet B reads ${roman(b)} in Roman numerals.`);
    const errors = operation === 'read' ? [a + b, a + 10, a - 10, b]
      : [operation === 'add' ? a - b : a + b, a, value + b, value + 10];
    return question(family, grade, operation === 'read'
      ? r.pick([`${who} checks tablet A. What is its ordinary number?`, `Using ordinary digits, write the number on ${who}'s tablet A.`])
      : r.pick([`${who} combines the codes. What is A ${operation === 'add' ? '+' : '-'} B in Roman numerals?`, `Which Roman numeral equals A ${operation === 'add' ? '+' : '-'} B in ${who}'s code log?`]),
    { operation }, visual, answer, errors.filter(v => v > 0).map(v => wrong(operation === 'read' ? v : roman(v), operation === 'read' ? 'class-4-roman-subtract' : 'wrong-operation')),
    'A smaller Roman symbol before a larger one is subtracted.',
    operation === 'read' ? `Tablet A, ${roman(a)}, means ${a}.` : `A is ${a}; B is ${b}. ${a} ${operation === 'add' ? '+' : '-'} ${b} = ${value}, written ${roman(value)}.`);
  }
  if (family === 'class-4-rounding-line') {
    const unit = [10, 100, 1000][level - 1];
    const lower = r.int(level === 3 ? 12 : 30, level === 3 ? 87 : 160) * unit;
    const position = r.int(1, 9);
    const value = lower + position * unit / 10;
    const answer = position < 5 ? lower : lower + unit;
    const visual = pic('rounding-line', { lower, unit, value }, `A number line runs from ${numberText(lower)} to ${numberText(lower + unit)} in ten equal intervals. The marked count is ${numberText(value)}.`);
    return question(family, grade, r.pick([
      `${who} rounds the marked count to the nearest ${numberText(unit)}. What does it round to?`,
      `Round the arrow's count to the nearest ${numberText(unit)}.`,
    ]), {}, visual, numberText(answer), [lower, lower + unit, lower - unit, lower + 2 * unit].map(v => wrong(numberText(v), 'scale-interval')),
    'Compare the point with the halfway mark; a halfway value rounds up.',
    `${numberText(value)} is ${position < 5 ? 'below' : 'at or above'} halfway, so it rounds to ${numberText(answer)}.`);
  }
  if (family === 'class-4-factor-trays') {
    const common = r.int(2, level === 1 ? 7 : 12);
    const [u, v] = r.pick([[2, 3], [3, 4], [4, 5], [3, 7], [5, 6], [5, 7], [7, 8]]);
    const a = common * u, b = common * v;
    const mode = level === 3 ? 'signals' : 'trays';
    const answer = mode === 'signals' ? a * b / gcd(a, b) : gcd(a, b);
    const visual = pic('factor-log', { a, b, mode }, mode === 'signals'
      ? `Sensor A flashes every ${a} minutes. Sensor B flashes every ${b} minutes. Both flash together at the start.`
      : `Collection A has ${a} samples. Collection B has ${b} samples. Equal-sized trays hold only one collection each, with no leftovers.`);
    return question(family, grade, mode === 'signals'
      ? r.pick([`${who} starts both sensors together. After how many minutes will they next flash together?`, `When do ${who}'s two sensors next flash together, in minutes?`])
      : r.pick([`${who} needs the largest equal tray size with no samples left. How many samples per tray?`, `What is the greatest number per tray for ${who}'s two collections, with no leftovers?`]),
    {}, visual, answer, numeric(mode === 'signals' ? [Math.max(a, b), a + b, gcd(a, b), a * b] : [Math.min(a, b), a + b, a * b / gcd(a, b), a * b], 'factor-multiple'),
    mode === 'signals' ? 'List multiples of both intervals and find their first shared value.' : 'Find a number that divides both collection sizes exactly.',
    mode === 'signals' ? `The first common multiple of ${a} and ${b} is ${answer} minutes.` : `The greatest common factor of ${a} and ${b} is ${answer}, the largest tray size.`);
  }
  if (family === 'class-4-part-bars') {
    const smaller = r.int(level * 12, level * 36);
    const difference = r.int(4, 18 + level * 5);
    const larger = smaller + difference;
    const total = smaller + larger;
    const pack = level === 3 ? r.pick([2, 3, 4, 5]) : 1;
    const visual = pic('part-bars', { smaller: level === 1 ? smaller : null, difference, total, labels: ['Blue lab', 'Gold lab'] },
      `Blue lab has ${level === 1 ? smaller : 'an unknown number of'} samples. Gold lab has ${difference} more than Blue lab. Together the labs have ${total} samples.`);
    const answer = level === 1 ? larger : level === 2 ? smaller : Math.floor(smaller / pack);
    const prompt = level === 1 ? `${who} compares the sample bars. How many samples belong to Gold lab?`
      : level === 2 ? `Use ${who}'s comparison bars. How many samples belong to Blue lab?`
        : `${who} packs Blue lab's samples, ${pack} per tray. How many full trays can be filled?`;
    return question(family, grade, r.pick([prompt, prompt.replace('samples', 'specimens')]), { pack, level }, visual, answer,
      numeric(level === 1 ? [total, difference, smaller - difference, smaller]
        : level === 2 ? [total - difference, total, larger, difference]
          : [smaller, Math.ceil(smaller / pack), Math.floor(larger / pack), Math.floor(total / pack), total - difference], 'missing-step'),
      level === 1 ? 'Gold has the same amount as Blue, plus the extra end of its bar.' : 'Remove the extra part first, then split the equal parts between the labs.',
      level === 1 ? `${smaller} + ${difference} = ${larger} samples.`
        : `Blue has (${total} - ${difference}) / 2 = ${smaller} samples.${level === 3 ? ` ${smaller} / ${pack} gives ${answer} full trays.` : ''}`);
  }
  if (family === 'class-4-split-product') {
    const left = r.int(level === 1 ? 2 : 11, level === 1 ? 8 : 39) * 10;
    const right = r.int(2, 9);
    const height = r.int(level === 3 ? 12 : 3, level === 3 ? 27 : 9);
    const mode = level === 1 ? 'right' : level === 2 ? 'whole' : 'height';
    const visual = pic('split-product', { left, right, height: mode === 'height' ? null : height, leftArea: left * height, total: mode === 'height' ? (left + right) * height : null, mode },
      `A rectangle is split into widths ${left} and ${right}. ${mode === 'height' ? `Its total area is ${(left + right) * height} square units and its height is unknown.` : `Its height is ${height}. The left part has area ${left * height}.`}`);
    const answer = mode === 'right' ? right * height : mode === 'whole' ? (left + right) * height : height;
    const targets = { right: 'the area of the right-hand part', whole: 'the total area', height: 'the missing height' };
    return question(family, grade, r.pick([
      `${who}'s bench model is split into two parts. Find ${targets[mode]}.`,
      `Use the split rectangle in ${who}'s lab plan. What is ${targets[mode]}?`,
    ]), { mode }, visual, answer, numeric(mode === 'right' ? [left * height, left + right + height, right + height, (left + right) * height]
      : mode === 'whole' ? [left * height, right * height, left + right + height, left * height + right]
        : [left + right, (left + right) * height, right * height, left * height], 'wrong-operation'),
    mode === 'height' ? 'Area divided by the full width gives the shared height.' : 'The two smaller areas add to the area of the whole rectangle.',
    mode === 'right' ? `${right} x ${height} = ${answer} square units.`
      : mode === 'whole' ? `${left} x ${height} + ${right} x ${height} = ${answer} square units.`
        : `${(left + right) * height} / (${left} + ${right}) = ${height} units.`);
  }
  if (family === 'class-4-division-manifest') {
    const capacity = r.int(4, 8 + level * 4);
    const full = r.int(7 + level, 15 + level * 9);
    const remainder = r.int(1, capacity - 1);
    const total = full * capacity + remainder;
    const mode = level === 1 ? r.pick(['full', 'left']) : level === 2 ? 'all' : 'topup';
    const thing = r.pick(GOODS);
    const visual = pic('manifest', { total, capacity, thing }, `Packing manifest: ${total} ${thing}; each tray holds ${capacity}. A partly filled tray is allowed only when packing every item.`);
    const prompts = {
      full: `${who} uses the manifest. How many completely full trays of ${thing} can be packed?`,
      left: `${who} fills as many trays as possible. How many ${thing} are left outside the full trays?`,
      all: `${who} must pack every one of the ${thing}. What is the fewest trays needed?`,
      topup: `${who} packs the ${thing}. How many more are needed to fill the last, partly filled tray?`,
    };
    const answer = mode === 'full' ? full : mode === 'left' ? remainder : mode === 'all' ? full + 1 : capacity - remainder;
    return question(family, grade, r.pick([prompts[mode], prompts[mode].replace('packs', 'sorts')]), { mode }, visual, answer,
      numeric([mode === 'all' ? full : full + 1, mode === 'left' ? capacity : remainder, mode === 'topup' ? capacity : total, capacity - remainder, full, total - capacity], 'remainder-rule'),
      'Decide whether the remainder means loose items, an extra tray, or space still empty.',
      `${total} = ${full} x ${capacity} + ${remainder}. ${mode === 'all' ? 'One extra tray holds the leftovers.' : mode === 'topup' ? `The last tray needs ${capacity} - ${remainder} more.` : mode === 'left' ? `${remainder} ${remainder === 1 ? 'item remains' : 'items remain'}.` : `${full} trays are completely full.`}`);
  }
  if (family === 'class-4-column-repair') {
    const a = r.int(level === 1 ? 120 : 1200, level === 1 ? 780 : 8700);
    const b = r.int(level === 1 ? 110 : 1100, level === 1 ? 740 : 8600);
    const subtract = level === 3 && r.pick([false, true]);
    const top = subtract ? a + b : a;
    const bottom = b;
    const result = subtract ? a : a + b;
    const place = r.pick(level === 1 ? [1, 10] : [10, 100]);
    const hidden = Math.floor(top / place) % 10;
    const displayed = String(top).split('');
    displayed[displayed.length - 1 - Math.log10(place)] = '?';
    const visual = pic('column-repair', { top: displayed.join(''), bottom, result, operation: subtract ? '-' : '+' }, `Column calculation: ${displayed.join('')} ${subtract ? 'minus' : 'plus'} ${bottom} equals ${result}. The question mark is one missing digit.`);
    const near = place * 10;
    const distractors = [Math.floor(result / place) % 10, Math.floor(bottom / place) % 10, (hidden + 1) % 10, (hidden + 9) % 10, Math.floor(top / near) % 10];
    return question(family, grade, r.pick([
      `${who} smudged one digit in this ${subtract ? 'subtraction' : 'addition'}. Which digit repairs it?`,
      `Repair the question-mark digit in ${who}'s written ${subtract ? 'subtraction' : 'addition'}.`,
    ]), { place }, visual, hidden, numeric(distractors, 'class-4-column-carry'),
    'Work from the ones column, carrying or exchanging before moving left.',
    `The top number must be ${top}, because ${top} ${subtract ? '-' : '+'} ${bottom} = ${result}. The missing digit is ${hidden}.`);
  }
  if (family === 'class-4-equivalent-bars') {
    const denominator = r.int(3, level === 1 ? 8 : 9);
    const numerator = r.int(1, denominator - 1);
    const factor = level === 1 || denominator > 6 ? 2 : r.pick([2, 3]);
    const d = denominator * factor, n = numerator * factor;
    const visual = pic('reference-fraction', { numerator, denominator }, `A whole bar has ${denominator} equal parts, of which ${numerator} ${numerator === 1 ? 'is' : 'are'} shaded and marked by a diagonal stroke.`);
    const option = count => pic('fraction-choice', { numerator: count, denominator: d }, `A rectangular whole with ${d} equal parts has ${count} shaded ${count === 1 ? 'part' : 'parts'}.`);
    const errors = [numerator, d - n, n + factor, n - 1, n + 1, d - 1].filter(x => x > 0 && x < d);
    return question(family, grade, r.pick([
      `${who} repartitions the shaded bar. Which picture still shows the same fraction of a whole?`,
      `Which picture is equivalent to the shaded fraction in ${who}'s sample model?`,
    ]), { factor }, visual, fraction(n, d),
    errors.map(count => wrong(fraction(count, d), 'class-4-equivalent-scale', option(count))),
    'Splitting every old part equally changes the part count, not the shaded share.',
    `${numerator}/${denominator} = ${n}/${d}: multiply both part counts by ${factor}.`, option(n));
  }
  if (family === 'class-4-fraction-line') {
    const denominator = r.int(3, 9);
    const step = r.int(1, denominator - 1);
    const whole = level === 1 ? 0 : level === 2 ? 1 : r.int(2, 4);
    const mixed = level === 3;
    const visual = pic('fraction-line', { denominator, step, whole }, `A number line goes from ${whole} to ${whole + 1} in ${denominator} equal intervals. Point P is ${step} ${step === 1 ? 'interval' : 'intervals'} to the right of ${whole}.`);
    const answer = mixed ? `${whole} ${step}/${denominator}` : fraction(whole * denominator + step, denominator);
    const errors = mixed ? [
      `${whole} ${denominator - step}/${denominator}`, `${whole + 1} ${step}/${denominator}`,
      fraction(step, denominator), `${whole} ${step}/${denominator + 1}`, `${whole - 1} ${step}/${denominator}`,
    ] : [
      fraction(whole * denominator + denominator - step, denominator),
      fraction(whole * denominator + step + 1, denominator),
      fraction(whole * denominator + step, denominator + 1),
      fraction(step, denominator), fraction(whole * denominator + step - 1, denominator),
    ];
    return question(family, grade, r.pick([
      `${who} marks point P. Which ${mixed ? 'mixed number' : 'fraction'} names its position?`,
      `Read point P on ${who}'s scale. Choose its ${mixed ? 'mixed number' : 'fraction'}.`,
    ]), { mixed }, visual, answer, errors.map(value => wrong(value, 'whole-parts')),
    'Count equal intervals from the whole-number mark, not the number of tick marks.',
    `${denominator} equal intervals make one whole. P is ${whole} whole${whole === 1 ? '' : 's'} and ${step}/${denominator}, so it is ${answer}.`);
  }
  if (family === 'class-4-sample-share') {
    const denominator = r.int(3, level === 1 ? 6 : 8);
    const numerator = r.int(1, denominator - 1);
    const each = r.int(3, level === 1 ? 8 : 18);
    const total = denominator * each;
    const selected = numerator * each;
    const mode = level === 1 ? 'selected' : level === 2 ? 'left' : 'whole';
    const thing = r.pick(['samples', 'crystals', 'filters', 'specimens']);
    const visual = pic('share-trays', { numerator, denominator, amount: mode === 'whole' ? selected : total, mode, thing },
      `${denominator} equal groups of ${thing}; ${numerator} groups are marked for testing. ${mode === 'whole' ? `The selected groups contain ${selected} ${thing}.` : `The entire collection contains ${total} ${thing}.`}`);
    const answer = mode === 'selected' ? selected : mode === 'left' ? total - selected : total;
    const ask = mode === 'selected' ? 'are selected for testing' : mode === 'left' ? 'remain unselected' : 'are in the whole collection';
    return question(family, grade, r.pick([
      `${who} uses equal sample groups. How many ${thing} ${ask}?`,
      `In ${who}'s collection, how many ${thing} ${ask}?`,
    ]), {}, visual, answer, numeric(mode === 'whole'
      ? [selected * denominator, selected * numerator, each, selected + denominator, selected]
      : [mode === 'left' ? selected : total - selected, total * numerator, each, total], 'whole-parts'),
    mode === 'whole' ? 'Find one selected group first, then count every group in the whole.' : 'Find the size of one equal group before using the marked fraction.',
    `One group has ${each} ${thing}. ${mode === 'whole' ? `${denominator} x ${each} = ${total} in the whole.` : `${numerator} x ${each} = ${selected} selected.${mode === 'left' ? ` ${total} - ${selected} = ${answer} unselected.` : ''}`}`);
  }
  if (family === 'class-4-fraction-leftovers') {
    const firstD = r.int(3, 9);
    const firstN = r.int(1, firstD - 2);
    const secondD = level === 1 ? firstD : r.pick([2, 3, 4, 6]);
    const secondN = 1;
    const sequential = level === 3;
    const denominator = sequential ? firstD * secondD : firstD * secondD / gcd(firstD, secondD);
    const firstParts = firstN * denominator / firstD;
    const secondParts = sequential ? (denominator - firstParts) * secondN / secondD : secondN * denominator / secondD;
    const left = denominator - firstParts - secondParts;
    if (left <= 0 || !Number.isInteger(left)) throw new QuestionRetry('The supply must leave whole equal parts.');
    const unit = r.int(3, 12);
    const total = denominator * unit;
    const visual = pic('fraction-inventory', { firstN, firstD, secondN, secondD, sequential, total: level === 1 ? null : total },
      `Supply log: ${level === 1 ? 'one full supply' : `${total} sample tubes initially`}. First test uses ${firstN}/${firstD} of the original supply. Second test uses ${secondN}/${secondD} of ${sequential ? 'what remains after the first test' : 'the original supply'}.`);
    const answer = level === 1 ? fraction(left, denominator) : left * unit;
    const errors = level === 1
      ? [fraction(firstParts + secondParts, denominator), fraction(denominator - firstParts, denominator), fraction(denominator - secondParts, denominator), fraction(left, denominator + 1)]
      : [total - firstParts * unit, (firstParts + secondParts) * unit, Math.round(total * (1 - firstN / firstD - secondN / secondD)), total - secondN * total / secondD, total];
    return question(family, grade, r.pick([
      `${who} runs the two tests in the supply log. ${level === 1 ? 'What fraction is left?' : 'How many sample tubes are left?'}`,
      `After both of ${who}'s tests, ${level === 1 ? 'which fraction of the supply remains?' : 'how many tubes remain unused?'}`,
    ]), { level }, visual, answer, errors.map(value => wrong(value, sequential ? 'changed-whole' : 'fraction-complement')),
    sequential ? 'The second fraction uses the new, smaller whole left after the first test.' : 'Put both uses into equal-sized parts of the original whole.',
    `${firstN}/${firstD} uses ${firstParts} of ${denominator} equal parts; the next test uses ${secondParts}. ${left}/${denominator} remains${level === 1 ? '.' : `: ${left} x ${unit} = ${answer} tubes.`}`);
  }
  if (family === 'class-4-l-bench') {
    const width = r.int(6 + level * 2, 10 + level * 3);
    const height = r.int(4 + level, 7 + level * 2);
    const cutWidth = r.int(2, width - 3);
    const cutHeight = r.int(2, height - 2);
    const mode = level === 1 ? 'area' : level === 2 ? 'perimeter' : r.pick(['area', 'perimeter']);
    const count = level === 3 ? r.int(2, 4) : 1;
    const visual = pic('l-bench', { width, height, cutWidth, cutHeight },
      `An L-shaped bench is an outer ${width} cm by ${height} cm rectangle with ${numberArticle(cutWidth)} ${cutWidth} cm wide and ${cutHeight} cm high rectangle removed from its top-right corner. Dimensions are labelled; the drawing is not to scale.`);
    const area = width * height - cutWidth * cutHeight;
    const perimeter = 2 * (width + height);
    const answer = (mode === 'area' ? area : perimeter) * count;
    const units = mode === 'area' ? 'square cm' : 'cm';
    const prompt = count === 1
      ? `${who} measures this L-shaped bench. What is its ${mode} in ${units}?`
      : `${who} needs ${count} separate benches like this. What is their total ${mode} in ${units}?`;
    return question(family, grade, r.pick([prompt, prompt.replace('measures', 'checks').replace('needs', 'makes')]), { mode, count }, visual, answer,
      numeric(mode === 'area' ? [width * height * count, (width * height + cutWidth * cutHeight) * count, (width * height - cutWidth) * count, (width - cutWidth) * (height - cutHeight) * count]
        : [(perimeter + 2 * (cutWidth + cutHeight)) * count, area * count, (width + height) * count, (perimeter - cutWidth - cutHeight) * count], mode === 'area' ? 'area-perimeter' : 'internal-edges'),
    mode === 'area' ? 'Subtract the corner rectangle from the large rectangle.' : 'The two new inside edges replace equal lengths lost from the top and side.',
    mode === 'area' ? `One area is ${width} x ${height} - ${cutWidth} x ${cutHeight} = ${area}. ${count > 1 ? `${count} benches: ${count} x ${area} = ${answer}.` : `That is ${answer} square cm.`}`
      : `One perimeter is ${width} + ${height} + ${width} + ${height} = ${perimeter} cm.${count > 1 ? ` ${count} separate benches need ${count} x ${perimeter} = ${answer} cm.` : ''}`);
  }
  if (family === 'class-4-mirror-panel') {
    const size = level === 1 ? 3 : 4;
    const cells = Array.from({ length: size }, () => Array.from({ length: size }, () => r.int(0, 1)));
    const key = grid => grid.map(row => row.join('')).join('/');
    const mirror = cells.map(row => [...row].reverse());
    const reverseRows = [...cells].reverse();
    const rotate = reverseRows.map(row => [...row].reverse());
    const changed = mirror.map(row => [...row]);
    changed[r.int(0, size - 1)][r.int(0, size - 1)] ^= 1;
    const errors = [cells, reverseRows, rotate, changed];
    if (new Set([key(mirror), ...errors.map(key)]).size < 4) throw new QuestionRetry('The reflected panel needs different distractors.');
    const gridPic = grid => pic('mirror-choice', { cells: grid }, `Right-hand panel, read from left to right. ${grid.map((row, i) => `Row ${i + 1}: ${row.map(x => x ? 'filled' : 'empty').join(', ')}`).join('. ')}.`);
    const visual = pic('mirror-source', { cells }, `The left panel has ${size} rows and columns. ${cells.map((row, i) => `Row ${i + 1}, left to right: ${row.map(x => x ? 'filled' : 'empty').join(', ')}`).join('. ')}. A vertical mirror line is at its right edge; choose the reflected right-hand panel.`);
    return question(family, grade, r.pick([
      `${who} completes the right-hand sensor panel. Which picture reflects the left panel across the dashed line?`,
      `Choose the missing right panel in ${who}'s mirror design. Reflect across the vertical dashed line.`,
    ]), {}, visual, key(mirror), errors.map(grid => wrong(key(grid), 'wrong-transform', gridPic(grid))),
    'The cell nearest the mirror must stay nearest the mirror on the other side.',
    'Keep each row in place, but reverse the order of its cells from left to right.', gridPic(mirror));
  }
  if (family === 'class-4-folded-cube') {
    const labels = r.shuffle(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']).slice(0, 6);
    const rotation = r.int(0, 3);
    const faces = [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]].map(([x, y], i) => {
      for (let turn = 0; turn < rotation; turn++) [x, y] = [-y, x];
      return { x, y, label: labels[i] };
    });
    const target = r.pick(labels);
    const answer = cubeOpposite(faces, target);
    const visual = pic('cube-net', { faces }, `A cube net has these labelled unit squares: ${faces.map(face => `${face.label} at column ${face.x}, row ${face.y}`).join('; ')}. Edge-sharing squares are joined. Fold the net into a cube.`);
    return question(family, grade, r.pick([
      `${who} folds this specimen box. Which face is opposite ${target}?`,
      `When ${who}'s net becomes a cube, which letter faces away from ${target}?`,
    ]), { target }, visual, answer, labels.filter(label => label !== target).map(label => wrong(label, 'opposite-faces')),
    'Fold neighbours up around a face; the last flap closes the opposite side.',
    `After folding, face ${answer} is opposite ${target}. Faces sharing an edge with ${target} cannot be opposite it.`);
  }
  if (family === 'class-4-angle-gap') {
    const first = r.int(level === 1 ? 5 : 4, level === 1 ? 25 : 9) * 5;
    const second = level === 1 ? 0 : r.int(5, 11) * 5;
    const missing = 180 - first - second;
    const difference = level === 3;
    const visual = pic('angle-gap', { angles: second ? [first, second] : [first] },
      `A straight angle is split into consecutive angles of ${first} degrees${second ? `, ${second} degrees` : ''}, and an unknown angle x. Their total is a straight angle.`);
    const answer = difference ? missing - first : missing;
    return question(family, grade, r.pick(difference ? [
      `${who} checks angle x. How many degrees larger is x than the ${first}-degree angle?`,
      `In ${who}'s angle diagram, find x minus ${first} degrees.`,
    ] : [
      `${who} measures the straight edge. What is angle x in degrees?`,
      `Find the missing angle x in ${who}'s lab plan, in degrees.`,
    ]), { difference }, visual, answer, numeric(difference
      ? [missing, 180 - first, 180 - second, 180 - first - first, first + second]
      : [first + second, 90 - first, 180 - first + second, 360 - first - second, first], 'angle-relation'),
    'Angles along one straight edge add to a half turn.',
    `x = 180 - ${first}${second ? ` - ${second}` : ''} = ${missing} degrees.${difference ? ` ${missing} - ${first} = ${answer} degrees.` : ''}`);
  }
  if (family === 'class-4-offset-ruler') {
    const base = r.int(1, 9);
    const step = level === 1 ? 1 : level === 2 ? 2 : 5;
    const startTick = r.int(1, 3), endTick = startTick + r.int(3, 7);
    const start = base + startTick * step, end = base + endTick * step;
    const unit = level === 3 ? 'mm' : 'cm';
    const pieces = level === 1 ? 1 : r.int(2, level + 3);
    const visual = pic('offset-ruler', { base, step, startTick, endTick, unit },
      `A ruler is marked from ${base} to ${base + 10 * step} ${unit}, in intervals of ${step} ${unit}. A strip starts at ${start} and ends at ${end}.`);
    const answer = (end - start) * pieces;
    const prompt = pieces === 1 ? `${who} measures the strip. What is its length in ${unit}?`
      : `${who} cuts ${pieces} strips of the length shown. What is their total length in ${unit}?`;
    return question(family, grade, r.pick([prompt, prompt.replace('strip', 'ribbon').replace('strips', 'ribbons')]), { pieces }, visual, answer,
      numeric([end * pieces, (end + start) * pieces, (end - start + step) * pieces, end - start, endTick - startTick], 'scale-zero'),
      'The strip does not start at zero; compare its two end readings.',
      `One strip is ${end} - ${start} = ${end - start} ${unit}.${pieces > 1 ? ` ${pieces} strips: ${pieces} x ${end - start} = ${answer} ${unit}.` : ''}`);
  }
  if (family === 'class-4-lab-temperature') {
    const base = r.int(0, 4) * 5, step = r.pick(level === 1 ? [2, 5] : [2, 5, 10]);
    const tick = r.int(2, 7), reading = base + tick * step;
    const change = level === 1 ? 0 : r.int(2, Math.min(reading - 1, 18)) * r.pick([-1, 1]);
    const mode = level === 1 ? 'read' : level === 2 ? 'after' : 'before';
    const answer = mode === 'before' ? reading - change : reading + change;
    const visual = pic('thermometer', { base, step, tick }, `A thermometer has eight equal intervals above its bottom mark of ${base} degrees C. Each interval is ${step} degrees C. The liquid reaches the ${tick}${ordinalSuffix(tick)} interval above the bottom mark.`);
    const changeWords = `${change > 0 ? 'rose' : 'fell'} by ${Math.abs(change)} degrees`;
    const prompt = mode === 'read' ? `${who} reads this thermometer. What is the temperature in degrees C?`
      : mode === 'after' ? `${who} saw the temperature ${changeWords} after this reading. What was the new temperature in degrees C?`
        : `Before this reading, the temperature ${changeWords}. What was it before that change, in degrees C?`;
    return question(family, grade, r.pick([prompt, prompt.replace('reads', 'checks').replace('Before this', `For ${who}, before this`)]), { mode, change }, visual, answer,
      numeric([mode === 'read' ? tick : reading, reading - change, reading + change, tick * step, base + (tick + 1) * step, base + (tick - 1) * step], 'scale-interval'),
      mode === 'before' ? 'Read the scale first, then undo the stated temperature change.' : 'Find the value of one scale interval before following any change.',
      `The thermometer reads ${base} + ${tick} x ${step} = ${reading} degrees C.${mode === 'read' ? '' : ` ${mode === 'before' ? 'Undo' : 'Apply'} the change: ${reading} ${mode === 'before' ? (change > 0 ? '-' : '+') : (change > 0 ? '+' : '-')} ${Math.abs(change)} = ${answer}.`}`);
  }
  if (family === 'class-4-balance-crates') {
    const count = level === 1 ? 2 : r.int(2, 3);
    const oneMass = level === 3 ? Math.ceil(1000 / (count * 5)) * 5 + r.int(2, 25) * 5
      : r.int(level === 1 ? 4 : 10, level === 1 ? 16 : 65) * 5;
    const known = count * r.int(2, level === 1 ? 5 : 12) * 5;
    const total = count * oneMass + known;
    const mixed = level === 3;
    const visual = pic('balance-crates', { count, known, total, mixed },
      `A level balance has ${count} identical crates and a K weight of ${known} g on the left. The right pan has weight M, labelled ${mixed ? `${Math.floor(total / 1000)} kg ${total % 1000} g` : `${total} g`}. All crates have the same mass.`);
    return question(family, grade, r.pick([
      `${who} weighs identical crates. What is the mass of one crate in grams?`,
      `The pans in ${who}'s balance are level. How many grams does one crate weigh?`,
    ]), {}, visual, oneMass, numeric([total - known, total, (total + known) / count, total + known], 'balance-total'),
    'Subtract the extra weight before sharing the remaining mass equally among the crates.',
    `${mixed ? `${Math.floor(total / 1000)} kg ${total % 1000} g = ${total} g. ` : ''}(${total} - ${known}) / ${count} = ${oneMass} g per crate.`);
  }
  if (family === 'class-4-unit-log') {
    const [large, small, base] = r.pick([['m', 'cm', 100], ['kg', 'g', 1000], ['L', 'mL', 1000], ['km', 'm', 1000]]);
    const aWhole = r.int(3, 8), bWhole = r.int(1, aWhole - 1);
    const aPart = r.int(1, 9) * base / 10, bPart = r.int(1, 9) * base / 10;
    const first = aWhole * base + aPart, second = bWhole * base + bPart;
    const shares = level === 3 ? r.pick([2, 5]) : 1;
    const operation = level === 1 ? 'combine' : 'use';
    const answer = (operation === 'combine' ? first + second : first - second) / shares;
    const visual = pic('unit-log', { large, small, base, aWhole, aPart, bWhole, bPart, operation },
      `Measurement log: first quantity ${aWhole} ${large} ${aPart} ${small}; second quantity ${bWhole} ${large} ${bPart} ${small}. One ${large} equals ${base} ${small}. ${operation === 'use' ? 'The second quantity is used from the first.' : 'The two quantities are combined.'}`);
    const prompt = level === 1 ? `${who} combines both entries. What is the total in ${small}?`
      : level === 2 ? `${who} uses the second amount from the first. How much remains in ${small}?`
        : `${who} uses the second amount, then splits the remainder into ${shares} equal shares. How much is each share in ${small}?`;
    return question(family, grade, r.pick([prompt, prompt.replace('entries', 'quantities').replace('uses', 'takes')]), { shares }, visual, answer,
      numeric(operation === 'combine' ? [aWhole + bWhole + aPart + bPart, first, second, (aWhole + bWhole) * base]
        : [first + second, first - second, (aWhole - bWhole) * base, first - bPart, aPart - bPart].filter(v => v >= 0), 'unit-conversion'),
      'Rewrite both entries in the smaller unit before combining or sharing them.',
      `${aWhole} ${large} ${aPart} ${small} = ${first} ${small}; ${bWhole} ${large} ${bPart} ${small} = ${second} ${small}. ${first} ${operation === 'combine' ? '+' : '-'} ${second}${shares > 1 ? `, then divide by ${shares}` : ''}, gives ${answer} ${small}.`);
  }
  if (family === 'class-4-task-timeline') {
    const start = r.int(7, 10) * 60 + r.int(0, 10) * 5;
    const first = r.int(3, 11) * 5;
    const pause = level === 1 ? 0 : r.int(2, 7) * 5;
    const second = level === 1 ? 0 : r.int(3, 9) * 5;
    const end = start + first + pause + second;
    const backwards = level === 3;
    const visual = pic('task-timeline', { start: backwards ? null : start, end: backwards ? end : null, first, pause, second },
      `Lab timeline: ${backwards ? `start time unknown; finish at ${clockKey(end)}` : `start at ${clockKey(start)}; finish time unknown`}. Scan for ${first} minutes${pause ? `, pause for ${pause} minutes, then sort for ${second} minutes` : ''}.`);
    const answer = clockKey(backwards ? start : end);
    const times = backwards ? [end + first + pause + second, end - first, end - second, end - first - second, start - pause]
      : [start + first, end - pause, end - second, start - first - pause - second, end + 60, end - 60];
    return question(family, grade, r.pick([
      `${who} follows the lab timeline. At what time ${backwards ? 'did the work start' : 'will the work finish'}?`,
      `Use ${who}'s timed lab tasks. Find the ${backwards ? 'starting' : 'finishing'} time.`,
    ]), { backwards }, visual, answer, times.map(value => wrong(clockKey(value), backwards ? 'time-direction' : 'hour-carry')),
      backwards ? 'Work backwards through the tasks in the reverse order.' : 'Follow each interval, regrouping a full hour of minutes when needed.',
      `${first}${pause ? ` + ${pause} + ${second}` : ''} = ${first + pause + second} minutes. ${backwards ? `Count back from ${clockKey(end)} to ${clockKey(start)}.` : `Count on from ${clockKey(start)} to ${clockKey(end)}.`}`);
  }
  if (family === 'class-4-shuttle-table') {
    const base = r.int(7, 10) * 60 + r.int(0, 4) * 5;
    const gap = r.int(3, 7) * 5;
    const rows = Array.from({ length: 4 }, (_, i) => {
      const depart = base + i * gap;
      return { label: `S${i + 1}`, depart, arrive: depart + r.int(4, 11) * 5 };
    });
    const target = r.int(1, 3);
    const ready = rows[target].depart - r.int(1, Math.floor(gap / 5) - 1) * 5;
    const walk = level === 3 ? r.int(2, 5) * 5 : 0;
    const wait = rows[target].depart - ready, travel = rows[target].arrive - rows[target].depart;
    const answer = level === 1 ? String(wait) : level === 2 ? clockKey(rows[target].arrive) : String(wait + travel + walk);
    const visual = pic('shuttle-table', { rows }, `Lab shuttle timetable. ${rows.map(row => `${row.label}: leaves ${clockKey(row.depart)}, reaches the station ${clockKey(row.arrive)}`).join('; ')}.`);
    const prompt = level === 1 ? `${who} is ready at ${clockKey(ready)}. How many minutes until the first available shuttle?`
      : level === 2 ? `${who} is ready at ${clockKey(ready)} and takes the next shuttle. At what time will it reach the station?`
        : `${who} is ready at ${clockKey(ready)}, takes the next shuttle, then walks ${walk} minutes. How many minutes from being ready to reaching the lab?`;
    const errors = level === 2 ? [rows[target - 1].arrive, rows[target].depart, rows[(target + 1) % 4].arrive, rows[target].arrive + 60].map(clockKey)
      : [level === 1 ? travel : travel + walk, gap, wait + travel, wait + travel + walk + gap, wait + walk + gap, travel];
    return question(family, grade, r.pick([prompt, prompt.replace('is ready', 'reaches the platform')]), { ready, walk, level }, visual, answer,
      errors.map(value => wrong(value, 'missing-step')), 'Choose the first departure not earlier than the ready time.',
      `Take ${rows[target].label} at ${clockKey(rows[target].depart)}: wait ${wait} minutes, ride ${travel} minutes.${level === 3 ? ` Add ${walk} minutes walking: ${wait + travel + walk} minutes in all.` : level === 2 ? ` Arrival is ${clockKey(rows[target].arrive)}.` : ''}`);
  }
  if (family === 'class-4-lab-calendar') {
    const year = r.int(2026, 2035), month = r.int(1, 12);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = month === 2 ? leap ? 29 : 28 : [4, 6, 9, 11].includes(month) ? 30 : 31;
    const first = firstWeekday(year, month);
    const interval = level === 3 ? r.int(3, 9) : r.int(3, 12);
    const date = level === 3 ? r.int(1, 9) : r.int(1, days - interval);
    const visual = pic('lab-calendar', { year, month: MONTHS[month - 1], days, first, date },
      `${MONTHS[month - 1]} ${year} calendar has ${days} days. The first is a ${WEEK[first]}. Date ${date} is circled. Columns run Monday to Sunday.`);
    const answer = level === 1 ? WEEK[(first + date - 1) % 7] : level === 2 ? String(date + interval) : String(Math.floor((days - date) / interval) + 1);
    const prompt = level === 1 ? `${who}'s inspection date is circled. Which weekday is it?`
      : level === 2 ? `${who} schedules the next check ${interval} days after the circled date. What date is the next check?`
        : `${who}'s first test is circled. Repeat every ${interval} days. How many tests fit in this month, counting the first?`;
    const errors = level === 1 ? WEEK.filter(day => day !== answer)
      : level === 2 ? [date + interval - 1, date + interval + 1, date, interval, date + 7]
        : [Math.floor((days - date) / interval), Math.ceil(days / interval), Math.floor((days - date) / interval) + 2, days - date + 1, interval];
    return question(family, grade, r.pick([prompt, prompt.replace('circled', 'ringed')]), { interval, level }, visual, answer,
      errors.map(value => wrong(value, level === 1 ? 'calendar-column' : 'counted-endpoints')),
      level === 3 ? 'Count the circled test once, then keep adding the repeat interval until the month ends.' : 'Read the circled date before following the weekday column or counting days.',
      level === 1 ? `Date ${date} is in the ${answer} column.`
        : level === 2 ? `${date} + ${interval} = ${answer}; count the gaps after the circled day.`
          : `Test dates: ${Array.from({ length: Number(answer) }, (_, i) => date + i * interval).join(', ')}. That makes ${answer} tests.`);
  }
  if (family === 'class-4-clock-repair') {
    const reading = r.int(1, 11) * 60 + r.int(0, 11) * 5;
    const error = r.int(1, level === 1 ? 5 : level === 2 ? 11 : 18) * 5 * r.pick([-1, 1]);
    const elapsed = level === 3 ? r.int(2, 8) * 5 : 0;
    const actual = reading - error + elapsed;
    const visual = pic('station-clock', { minutes: reading }, `Station clock displays ${clockKey(reading)}. This is the clock reading, not necessarily the correct time.`);
    const option = minutes => pic('clock-choice', { minutes: ((minutes % 720) + 720) % 720 }, `Clock showing ${clockKey(minutes)}.`);
    return question(family, grade, r.pick([
      `${who}'s station clock is ${Math.abs(error)} minutes ${error > 0 ? 'fast' : 'slow'}. Which clock shows the true time${elapsed ? ` ${elapsed} minutes later` : ''}?`,
      `The station clock is ${Math.abs(error)} minutes ${error > 0 ? 'ahead' : 'behind'}. Choose the correct time${elapsed ? ` after ${elapsed} more minutes` : ` for ${who}`}.`,
    ]), { error, elapsed }, visual, clockKey(actual),
      [reading + error + elapsed, reading + elapsed, actual + 60, actual - 60, reading - error].map(minutes => wrong(clockKey(minutes), 'clock-error', option(minutes))),
      'A fast clock is ahead; a slow clock is behind. Correct it before adding any elapsed time.',
      `The real time is ${clockKey(reading - error)}.${elapsed ? ` Add ${elapsed} minutes to reach ${clockKey(actual)}.` : ''}`, option(actual));
  }
  if (family === 'class-4-receipt-gap') {
    const quantity = r.int(2, level === 1 ? 4 : 7), price = r.int(8, 35 + level * 15);
    const otherQuantity = level === 1 ? 1 : r.int(2, 4), otherPrice = r.int(10, 45);
    const fee = level === 1 ? 0 : r.int(1, 7) * 5;
    const discount = level === 3 ? r.int(1, 6) * 5 : 0;
    const [item, other] = r.shuffle(GOODS).slice(0, 2);
    const single = SINGULAR[item];
    const total = quantity * price + otherQuantity * otherPrice + fee - discount;
    const visual = pic('receipt-gap', { quantity, otherQuantity, otherPrice, item, other, fee, discount, total },
      `Receipt: ${pl(quantity, single, item)} at an unknown price each; ${pl(otherQuantity, SINGULAR[other], other)} at Rs ${otherPrice} each; delivery Rs ${fee}; discount Rs ${discount}; final total Rs ${total}.`);
    return question(family, grade, r.pick([
      `What price per item is missing from ${who}'s receipt for the ${item}?`,
      `${who} checks the receipt. What is the price of one ${single}?`,
    ]), {}, visual, `Rs ${price}`,
      [quantity * price, total - otherQuantity * otherPrice, total, quantity * price + discount, price + otherPrice].map(value => wrong(`Rs ${value}`, 'price-total')),
      'Undo the discount and delivery, subtract the other items, then share the remaining cost.',
      `Cost of ${item}: ${total} + ${discount} - ${fee} - ${otherQuantity} x ${otherPrice} = ${quantity * price}. Divide by ${quantity}: Rs ${price} each.`);
  }
  if (family === 'class-4-best-bundle') {
    const target = 12 * (level === 1 ? 1 : r.int(level, level + 2));
    const packs = r.shuffle([2, 3, 4, 6]);
    const offers = packs.map((count, i) => ({
      label: `Offer ${String.fromCharCode(65 + i)}`, count,
      price: count * r.int(5, 16) + (level === 1 ? 0 : r.int(1, count - 1)),
      fee: level === 3 ? r.int(1, 6) * 5 : 0,
    }));
    const costs = offers.map(offer => target / offer.count * offer.price + offer.fee);
    if (new Set(costs).size !== costs.length) throw new QuestionRetry('Bundle totals must differ.');
    const best = costs.indexOf(Math.min(...costs));
    const thing = r.pick(GOODS);
    const visual = pic('bundle-table', { offers, thing }, `Bundle price board for ${thing}. ${offers.map(offer => `${offer.label}: ${offer.count} items for Rs ${offer.price}${offer.fee ? ` and one delivery charge of Rs ${offer.fee}` : ', no delivery charge'}`).join('; ')}. Each purchase uses only one offer, repeated as needed.`);
    return question(family, grade, r.pick([
      `${who} buys exactly ${target} ${thing}, using one offer repeatedly. Which offer has the lowest total cost${level === 3 ? ', including delivery' : ''}?`,
      `Choose the cheapest offer for ${who} to get exactly ${target} ${thing}${level === 3 ? ', paying delivery once' : ''}. Use only one kind of pack.`,
    ]), { target }, visual, offers[best].label, offers.filter((_, i) => i !== best).map(offer => wrong(offer.label, 'price-total')),
    'Compare the cost of the same total number of items, not the price of one pack.',
    offers.map((offer, i) => `${offer.label.slice(-1)}: ${target / offer.count} packs${offer.fee ? ' plus delivery' : ''} = Rs ${costs[i]}`).join('; ') + '.');
  }
  if (family === 'class-4-supply-budget') {
    const requiredPrice = r.int(15, 75), requiredQuantity = level === 1 ? 1 : r.int(2, 4);
    const extraPrice = r.int(6, 28);
    const reserve = level === 3 ? r.int(2, 8) * 5 : 0;
    const fee = level === 3 ? r.int(1, 5) * 5 : 0;
    const count = r.int(3, 8 + level * 3), remainder = r.int(1, extraPrice - 1);
    const budget = requiredPrice * requiredQuantity + extraPrice * count + reserve + fee + remainder;
    const visual = pic('budget-board', { requiredPrice, requiredQuantity, extraPrice, reserve, fee, budget },
      `Supply board: budget Rs ${budget}; must buy ${requiredQuantity} kit${requiredQuantity === 1 ? '' : 's'} at Rs ${requiredPrice} each; extra filters cost Rs ${extraPrice} each; delivery Rs ${fee}; at least Rs ${reserve} must remain unspent.`);
    return question(family, grade, r.pick([
      `${who} buys the required kits${reserve ? ' and keeps the stated reserve' : ''}. What is the greatest number of extra filters the budget allows?`,
      `After ${who}'s required kit purchase${reserve ? ', delivery and reserve' : ''}, how many extra filters can be bought at most?`,
    ]), {}, visual, count,
      numeric([Math.floor(budget / extraPrice), count + 1, Math.floor((budget - requiredPrice) / extraPrice), Math.floor(budget / (extraPrice + requiredPrice)), Math.ceil(budget / extraPrice), Math.floor((budget - reserve - fee) / extraPrice)], 'ignored-condition'),
      'Set aside every required cost and any reserve before counting complete extra purchases.',
      `Available for filters: ${budget} - ${requiredQuantity} x ${requiredPrice} - ${fee} - ${reserve} = ${count * extraPrice + remainder}. Buy ${count} filters; Rs ${remainder} remains beyond the reserve.`);
  }
  if (family === 'class-4-change-counter') {
    const labels = r.shuffle(GOODS).slice(0, 2);
    const rows = labels.map(item => ({ item, quantity: r.int(1, level + 1), price: r.int(8, 65) * 100 + (level === 1 ? 0 : r.int(1, 19) * 5) }));
    const subtotal = rows.reduce((total, row) => total + row.quantity * row.price, 0);
    const discount = level === 3 ? r.int(1, 9) * 100 : 0;
    const cost = subtotal - discount;
    const paid = (Math.floor(cost / 10000) + 1) * 10000;
    const visual = pic('change-counter', { rows, discount, paid },
      `Payment counter: ${rows.map(row => `${pl(row.quantity, SINGULAR[row.item], row.item)} at ${money(row.price)} each`).join('; ')}. Discount ${money(discount)}. Amount paid ${money(paid)}.`);
    const change = paid - cost;
    const answer = money(change);
    const errors = [
      ...(cost % 100 ? [wrong(money(change + 100), 'class-4-money-borrow'), ...(change >= 100 ? [wrong(money(change - 100), 'class-4-money-borrow')] : []), wrong(money(Math.floor(change / 100) * 100), 'decimal-place')] : []),
      wrong(money(paid - rows.reduce((sum, row) => sum + row.price, 0) + discount), 'price-total'),
      wrong(money(cost), 'change-order'), wrong(money(paid - subtotal), 'missing-step'),
      wrong(money(paid - rows[0].quantity * rows[0].price), 'price-total'),
      wrong(money(paid - rows[1].quantity * rows[1].price), 'price-total'),
      wrong(money(paid + cost), 'change-order'),
    ];
    return question(family, grade, r.pick([
      `${who} pays the amount shown at the counter. How much change should be returned?`,
      `Find ${who}'s change after buying every item on the payment board.`,
    ]), {}, visual, answer, errors,
      'Work in paise to total every item, apply the discount, then subtract the bill from the payment.',
      `Items cost ${money(subtotal)}.${discount ? ` After discount: ${money(cost)}.` : ''} ${money(paid)} - ${money(cost)} = ${answer} change.`);
  }
  if (family === 'class-4-scaled-bars') {
      const labels = r.shuffle(LABS).slice(0, 4);
      const scale = r.pick(level === 1 ? [2, 5] : level === 2 ? [5, 10] : [10, 20]);
      const heights = r.shuffle([2, 3, 4, 5, 6, 7, 8]).slice(0, 4);
      const values = heights.map(h => h * scale);
      const indices = [0, 1, 2, 3].sort((a, b) => values[b] - values[a]);
      const target = r.int(0, 3), high = indices[0], next = indices[1], low = indices[3];
      const visual = pic('scaled-bars', { labels, heights, scale },
        `Bar graph of samples tested. The vertical axis has one interval per ${scale} samples. ${labels.map((label, i) => `${label}: ${values[i]} samples`).join('; ')}.`);
      const answer = level === 1 ? values[target] : level === 2 ? values[high] - values[low] : values[high] + values[next] - values[low];
      const prompt = level === 1 ? `${who} reads the sample chart. How many samples did ${labels[target]} test?`
        : level === 2 ? `How many more samples did ${labels[high]} test than ${labels[low]} in ${who}'s chart?`
          : `Together, how many more samples did ${labels[high]} and ${labels[next]} test than ${labels[low]} in ${who}'s chart?`;
      const errors = level === 1 ? [heights[target], values[target] - scale, scale, values[target] + scale, values[target] * scale]
        : level === 2 ? [values[high] + values[low], values[high], heights[high] - heights[low], values[low], answer + scale]
          : [values[high] + values[next] + values[low], values[high] + values[next], values[high] - values[low], heights[high] + heights[next] - heights[low]];
      return question(family, grade, r.pick([prompt, prompt.replace('samples', 'specimens')]), { level, target, high, next, low }, visual, answer,
        numeric(errors, level === 1 ? 'graph-key' : 'graph-difference'), 'Use the axis scale to read the bars before comparing the totals.',
        level === 1 ? `${labels[target]} reaches ${heights[target]} intervals: ${heights[target]} x ${scale} = ${answer}.`
          : `${values[high]}${level === 3 ? ` + ${values[next]}` : ''} - ${values[low]} = ${answer} samples.`);
  }
  if (family === 'class-4-half-pictograph') {
      const labels = r.shuffle(LABS).slice(0, 3);
      const key = r.pick([2, 4, 6, 10]);
      const halfCounts = r.shuffle(level === 1 ? [4, 6, 8, 10, 12] : [3, 5, 7, 9, 11]).slice(0, 3);
      const amounts = halfCounts.map(halves => halves * key / 2);
      const [first, second] = r.shuffle([0, 1, 2]).slice(0, 2);
      const high = amounts.indexOf(Math.max(...amounts)), low = amounts.indexOf(Math.min(...amounts));
      const answer = level === 1 ? amounts[first] : level === 2 ? amounts[first] + amounts[second] : amounts[high] - amounts[low];
      const visual = pic('half-pictograph', { labels, halfCounts, key },
        `Pictograph: a whole disc represents ${key} samples; a half disc represents ${key / 2}. ${labels.map((label, i) => `${label} has ${Math.floor(halfCounts[i] / 2)} whole discs${halfCounts[i] % 2 ? ' and one half disc' : ''}`).join('; ')}.`);
      const prompt = level === 1 ? `Use ${who}'s pictograph key. How many samples belong to ${labels[first]}?`
        : level === 2 ? `In ${who}'s pictograph, how many samples do ${labels[first]} and ${labels[second]} have altogether?`
          : `How many more samples does ${labels[high]} have than ${labels[low]} in ${who}'s pictograph?`;
      const errors = level === 1 ? [halfCounts[first] / 2, halfCounts[first], amounts[first] + key, amounts[first] * 2]
        : level === 2 ? [(Math.floor(halfCounts[first] / 2) + Math.floor(halfCounts[second] / 2)) * key, (halfCounts[first] + halfCounts[second]) * key, amounts[first], amounts[second], (halfCounts[first] + halfCounts[second]) / 2]
          : [(halfCounts[high] - halfCounts[low]) * key, amounts[high] + amounts[low], amounts[high], (halfCounts[high] - halfCounts[low]) / 2];
      return question(family, grade, r.pick([prompt, prompt.replace('samples', 'specimens')]), { level, first, second, high, low }, visual, answer,
        numeric(errors, level === 1 ? 'graph-key' : 'class-4-half-symbol'),
        'Read the key first. A half disc has half the value of one complete disc.',
        level === 1 ? `${halfCounts[first] / 2} symbols x ${key} samples = ${answer}.`
          : `${amounts[level === 2 ? first : high]} ${level === 2 ? '+' : '-'} ${amounts[level === 2 ? second : low]} = ${answer} samples.`);
  }
  if (family === 'class-4-paired-surveys') {
      const labels = r.shuffle(LABS).slice(0, 4);
      const morning = Array.from({ length: 4 }, () => r.int(8, 35));
      const evening = morning.map(value => value + r.int(-6, 14));
      const scores = labels.map((_, i) => level === 1 ? morning[i] : level === 2 ? morning[i] + evening[i] : evening[i] - morning[i]);
      if (new Set(scores).size !== 4 || (level === 3 && Math.max(...scores) <= 0)) throw new QuestionRetry('Survey comparison must have one clear winner.');
      const best = scores.indexOf(Math.max(...scores));
      const visual = pic('paired-surveys', { labels, morning, evening },
        `Two test records. ${labels.map((label, i) => `${label}: morning ${morning[i]}, evening ${evening[i]}`).join('; ')}.`);
      const ask = level === 1 ? 'tested the most in the morning' : level === 2 ? 'tested the most across both sessions together' : 'had the greatest increase from morning to evening';
      return question(family, grade, r.pick([
        `Which lab ${ask} in ${who}'s records?`,
        `${who} compares the two records. Which lab ${ask}?`,
      ]), { level }, visual, labels[best], labels.filter((_, i) => i !== best).map(label => wrong(label, level === 3 ? 'graph-difference' : 'missing-step')),
      level === 3 ? 'For each lab, subtract its morning result from its evening result.' : level === 2 ? 'Add the two results for each lab before comparing labs.' : 'Use only the morning column for this comparison.',
      labels.map((label, i) => `${label}: ${scores[i]}${level === 3 ? ' more' : ' tests'}`).join('; ') + `. ${labels[best]} is greatest.`);
  }
  if (family === 'class-4-chart-transfer') {
      const labels = r.shuffle(LABS).slice(0, 4);
      const values = Array.from({ length: 4 }, () => r.int(15, 45 + level * 8));
      const [from, to] = r.shuffle([0, 1, 2, 3]).slice(0, 2);
      const amount = r.int(2, level === 1 ? 8 : 13);
      const target = r.pick([from, to]);
      const extra = level === 3 ? r.int(3, 11) : 0;
      const updated = values[target] + (target === from ? -amount : amount) + extra;
      const statement = value => `${labels[target]} now has ${value} samples`;
      const visual = pic('transfer-ledger', { labels, values },
        `Before any change, the specimen ledger shows ${labels.map((label, i) => `${label} ${values[i]} samples`).join('; ')}.`);
      const prompt = `${who} moves ${amount} samples from ${labels[from]} to ${labels[to]}.${extra ? ` Then ${labels[target]} gets ${extra} new samples.` : ''} Which statement is true now?`;
      const errors = [values[target], values[target] + (target === from ? amount : -amount), values[from] + values[to] + extra, updated - extra, amount + extra];
      return question(family, grade, r.pick([prompt, prompt.replace('moves', 'transfers')]), { from, to, amount, target, extra }, visual, statement(updated),
        errors.map(value => wrong(statement(value), 'graph-update')),
        'A transfer removes samples from one lab and adds the same number to the other.',
        `${labels[target]} starts with ${values[target]}: ${values[target]} ${target === from ? '-' : '+'} ${amount}${extra ? ` + ${extra}` : ''} = ${updated}.`);
  }
  if (family === 'class-4-rank-repair') {
      const front = r.int(5, 24), back = r.int(4, 21);
      const leaveAhead = level === 1 ? 0 : r.int(1, 3);
      const joinAhead = level === 3 ? r.int(1, 4) : 0;
      const leaveBehind = level === 3 ? r.int(1, 3) : 0;
      const joinBehind = level === 1 ? 0 : r.int(1, 4);
      const move = level === 3 ? r.int(1, Math.min(3, front - leaveAhead + joinAhead - 1)) : 0;
      const visual = pic('rank-card', { front, back, leaveAhead, joinAhead, leaveBehind, joinBehind, move, who },
        `${who} is rank ${front} from the front and ${back} from the back of a queue. ${leaveAhead} people ahead leave, ${joinAhead} join ahead, ${leaveBehind} behind leave, and ${joinBehind} join behind. Then ${who} moves forward ${pl(move, 'place')}, staying in the queue.`);
      const total = front + back - 1;
      const newFront = front - leaveAhead + joinAhead - move;
      const newBack = back - leaveBehind + joinBehind + move;
      const answer = level === 1 ? total : level === 2 ? newFront : newBack;
      const prompt = level === 1 ? `${who} reads the two rank badges. How many people are in the queue, including ${who}?`
        : `${who} follows the changes on the queue card. What is the new rank from the ${level === 2 ? 'front' : 'back'}?`;
      return question(family, grade, r.pick([prompt, prompt.replace('queue', 'line')]), { level }, visual, answer,
        numeric(level === 1 ? [front + back, front + back + 1, Math.abs(front - back), front + back - 2]
          : level === 2 ? [front, front - leaveAhead + joinBehind, total - leaveAhead + joinBehind, front + leaveAhead]
            : [back, newFront, back - leaveBehind + joinBehind, total + joinAhead + joinBehind - leaveAhead - leaveBehind], level === 1 ? 'rank-endpoints' : 'class-4-queue-change'),
        level === 1 ? 'The two rank counts include the same person, so avoid counting that person twice.' : 'Track changes ahead separately from changes behind; moving forward changes both ranks.',
        level === 1 ? `${front} + ${back} - 1 = ${total} people.`
          : level === 2 ? `Front rank: ${front} - ${leaveAhead} + ${joinAhead} = ${newFront}; joins behind do not change it.`
            : `Back rank: ${back} - ${leaveBehind} + ${joinBehind} + ${move} = ${newBack}. Moving forward puts more people behind.`);
  }
  if (family === 'class-4-rover-program') {
      const size = level === 3 ? 6 : 5;
      const x = r.int(1, size - 2), y = r.int(1, size - 2), facing = level === 1 ? 0 : r.int(0, 3);
      const commands = level === 3
        ? [{ action: 'F', steps: 1 }, { action: r.pick(['L', 'R']) }, { action: 'F', steps: r.int(1, 2) }, { action: r.pick(['L', 'R']) }]
        : [{ action: 'F', steps: r.int(1, 2) }, { action: r.pick(['L', 'R']) }, { action: 'F', steps: r.int(1, 2) }, ...(level === 2 ? [{ action: r.pick(['L', 'R']) }, { action: 'F', steps: r.int(1, 2) }] : [])];
      const data = { x, y, facing, size, commands, repeat: level === 3 ? 2 : 1 };
      const valid = point => point.x >= 0 && point.x < size && point.y >= 0 && point.y < size;
      const end = roverEnd(data);
      const path = { ...data, commands: [] };
      for (const command of Array.from({ length: data.repeat }, () => commands).flat()) {
        path.commands.push(command);
        if (!valid(roverEnd({ ...path, repeat: 1 }))) throw new QuestionRetry('A rover route must stay on the map.');
      }
      if (!valid(end)) throw new QuestionRetry('The rover must finish on the map.');
      const errors = [roverEnd(data, { reverseTurns: true }), roverEnd(data, { ignoreTurns: true }), roverEnd(data, { skipLast: true }), { x: end.y, y: end.x }, { x, y }, { x: size - 1 - end.x, y: end.y }].filter(valid);
      const visual = pic('rover-program', data,
        `Coordinate map with x from 0 to ${size - 1} increasing right, and y from 0 to ${size - 1} increasing up. Rover starts at ${at(x, y)}, facing ${['north', 'east', 'south', 'west'][facing]}. ${data.repeat === 2 ? 'Repeat this entire program twice: ' : 'Program: '}${commands.map(command => command.action === 'F' ? `forward ${command.steps}` : `turn ${command.action === 'L' ? 'left' : 'right'} a quarter turn`).join(', ')}.`);
      return question(family, grade, r.pick([
        `${who} runs the rover program${data.repeat === 2 ? ' twice' : ''}. At which coordinate does the rover finish?`,
        `Follow ${who}'s rover commands${data.repeat === 2 ? ', repeating the whole list twice' : ''}. Choose the final (x, y) coordinate.`,
      ]), {}, visual, at(end.x, end.y), errors.map(point => wrong(at(point.x, point.y), 'turn-frame')),
        'Turn with the rover, then move forwards in its new direction; do not keep facing north.',
        `Start at ${at(x, y)}, facing ${['north', 'east', 'south', 'west'][facing]}. ${data.repeat === 2 ? 'Use the entire command list twice. ' : ''}The final coordinate is ${at(end.x, end.y)}.`);
  }
  if (family === 'class-4-checkpoint-routes') {
      const width = r.int(2, level === 1 ? 3 : 4), height = r.int(2, level === 1 ? 3 : 4);
      const checkpoint = level === 1 ? null : { x: r.int(1, width - 1), y: r.int(1, height - 1) };
      const direction = level === 1 ? r.pick(['R', 'U']) : null;
      const closed = level === 1 ? { direction, x: r.int(0, direction === 'R' ? width - 1 : width), y: r.int(0, direction === 'U' ? height - 1 : height) } : null;
      const mode = level === 1 ? 'all' : level === 2 ? 'through' : 'avoid';
      const unrestricted = choose(width + height, width);
      const throughClosed = closed ? choose(closed.x + closed.y, closed.x)
        * choose(width - closed.x + height - closed.y - 1, width - closed.x - (direction === 'R' ? 1 : 0)) : 0;
      const total = unrestricted - throughClosed;
      const through = checkpoint ? choose(checkpoint.x + checkpoint.y, checkpoint.x) * choose(width - checkpoint.x + height - checkpoint.y, width - checkpoint.x) : 0;
      const answer = mode === 'all' ? total : mode === 'through' ? through : total - through;
      const visual = pic('checkpoint-grid', { width, height, checkpoint, closed },
        `A grid has ${width} rightward steps and ${height} upward steps from S at bottom-left to F at top-right. Only right and up moves along open arrows are allowed.${closed ? ` The edge from ${at(closed.x, closed.y)} to ${at(closed.x + (direction === 'R' ? 1 : 0), closed.y + (direction === 'U' ? 1 : 0))} is crossed out and closed; coordinates count right and up from S.` : ''}${checkpoint ? ` Checkpoint C is ${checkpoint.x} steps right and ${checkpoint.y} steps up from S.` : ''}`);
      return question(family, grade, r.pick([
        `${who} goes from S to F, using open arrows only. How many right-or-up routes ${mode === 'all' ? 'are possible' : mode === 'through' ? 'pass through C' : 'avoid C'}?`,
        `Count ${who}'s right-or-up routes along open arrows from S to F${mode === 'all' ? '' : mode === 'through' ? ', passing through C' : ', never visiting C'}.`,
      ]), { mode }, visual, answer,
        numeric(mode === 'all' ? [unrestricted, throughClosed, width * height, unrestricted + width + height, (width + 1) * (height + 1)]
          : [mode === 'through' ? total : through, mode === 'through' ? total - through : total, width + height, checkpoint.x + checkpoint.y, through + total], 'path-constraint'),
        mode === 'all' ? 'At each junction, add routes from open incoming arrows; the crossed-out edge is closed.' : mode === 'through' ? 'Count ways to C, then ways from C to F; combine the two choices.' : 'Count all routes, then remove the ones passing through C.',
        mode === 'all' ? `There would be ${unrestricted} routes with every edge open. Remove ${throughClosed} that use the closed edge: ${unrestricted} - ${throughClosed} = ${total}.`
          : `${total} total routes; ${choose(checkpoint.x + checkpoint.y, checkpoint.x)} ways to C x ${choose(width - checkpoint.x + height - checkpoint.y, width - checkpoint.x)} ways onwards = ${through} through C.${mode === 'avoid' ? ` ${total} - ${through} = ${answer} avoid C.` : ''}`);
  }
  if (family === 'class-4-code-machine') {
      const multiplier = r.int(2, level === 1 ? 6 : 9), extra = level === 1 ? 0 : r.int(2, 15);
      const first = r.int(2, 9), second = first + r.int(2, 5);
      const query = r.int(14, 28 + level * 4);
      const reverse = level === 3;
      const examples = [[first, first * multiplier + extra], [second, second * multiplier + extra]];
      const output = query * multiplier + extra;
      const visual = pic('code-machine', { examples, query: reverse ? null : query, output: reverse ? output : null },
        `Code machine uses one fixed multiplication${level === 1 ? '' : ' followed by one fixed addition'}. Examples: ${examples.map(([input, output]) => `${input} goes to ${output}`).join('; ')}. ${reverse ? `The final output is ${output}; its input is missing.` : `The final input is ${query}; its output is missing.`}`);
      const answer = reverse ? query : output;
      const errors = reverse ? [output - extra, output / multiplier, output + extra, output * multiplier + extra, query + multiplier]
        : [query + multiplier + extra, query * multiplier, query * multiplier + extra + multiplier, query * (multiplier + extra), query - multiplier];
      return question(family, grade, r.pick([
        `${who} tests one code rule for every row. Find the missing ${reverse ? 'input' : 'output'}.`,
        `Use both worked rows in ${who}'s code machine. What number replaces the question mark?`,
      ]), { reverse }, visual, answer, numeric(errors.filter(Number.isInteger), reverse ? 'reversed-operation' : 'code-order'),
        'Compare how much the output changes when the input changes, then check both rows.',
        `The rule is multiply by ${multiplier}${extra ? `, then add ${extra}` : ''}.${reverse ? ` Undo it: (${output} - ${extra}) / ${multiplier} = ${query}.` : ` ${query} x ${multiplier}${extra ? ` + ${extra}` : ''} = ${output}.`}`);
  }
  if (family === 'class-4-alternating-lock') {
      const firstA = r.int(4, 25), firstB = r.int(45, 88);
      const stepA = level === 3 ? r.pick([2, 3]) : r.int(2, 8);
      const stepB = level === 2 ? -r.int(2, 7) : r.int(2, 9);
      const multiply = level === 3;
      const terms = Array.from({ length: 8 }, (_, i) => i % 2
        ? firstB + Math.floor(i / 2) * stepB
        : multiply ? firstA * stepA ** (i / 2) : firstA + i / 2 * stepA);
      const missing = r.int(4, 7), answer = terms[missing];
      const shown = terms.map((term, i) => i === missing ? null : term);
      const visual = pic('alternating-lock', { terms: shown },
        `Eight lock entries, read across the top row then the bottom row: ${shown.map(term => term === null ? 'question mark' : term).join(', ')}. Alternate positions follow two separate rules.`);
      const errors = [terms[missing - 1] + stepA, terms[missing - 2] + (missing % 2 ? stepA : stepB), terms[missing - 2], terms[missing - 1] * stepA, answer + stepB];
      return question(family, grade, r.pick([
        `${who}'s lock alternates between two number rules. Which number fills the gap?`,
        `Separate the odd and even positions in ${who}'s lock. Find the missing number.`,
      ]), { multiply, missing }, visual, answer, numeric(errors, 'class-4-interleaved'),
        'Follow positions one, three, five, seven separately from positions two, four, six, eight.',
        `Odd positions ${multiply ? 'multiply by' : 'add'} ${stepA}; even positions ${stepB < 0 ? 'subtract' : 'add'} ${Math.abs(stepB)}. The missing entry is ${answer}.`);
  }
  throw new Error(`Unknown class-4 family: ${family}`);
}

function cubeOpposite(faces, target) {
  const negate = vector => vector.map(x => -x);
  const visited = new Map([[0, { right: [1, 0, 0], down: [0, 1, 0], normal: [0, 0, 1] }]]);
  const queue = [0];
  for (let i = 0; i < queue.length; i++) {
    const index = queue[i], basis = visited.get(index), face = faces[index];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = faces.findIndex(item => item.x === face.x + dx && item.y === face.y + dy);
      if (next < 0 || visited.has(next)) continue;
      const { right, down, normal } = basis;
      const orientation = dx === 1 ? { right: negate(normal), down, normal: right }
        : dx === -1 ? { right: normal, down, normal: negate(right) }
          : dy === 1 ? { right, down: negate(normal), normal: down }
            : { right, down: normal, normal: negate(down) };
      visited.set(next, orientation);
      queue.push(next);
    }
  }
  const targetIndex = faces.findIndex(face => face.label === target);
  const normal = visited.get(targetIndex).normal;
  const opposite = faces.findIndex((face, index) => visited.get(index)?.normal.every((value, axis) => value === -normal[axis]));
  if (opposite < 0) throw new Error('The cube net has no opposite face.');
  return faces[opposite].label;
}

const gridKey = cells => cells.map(row => row.join('')).join('/');
function checkPictures(question, kind, key) {
  if (!question.optionVisuals || question.optionVisuals.length !== question.options.length) throw new Error('Picture choices are missing.');
  question.optionVisuals.forEach((visual, i) => {
    if (visual?.kind !== `v3-class-4-${kind}` || key(visual) !== question.options[i]) throw new Error('A picture does not match its option.');
  });
}

export function solve(question) {
  if (isReal(question.family)) return solveReal(question);
  const g = question.proof.givens;
  const v = question.visual;
  switch (question.family) {
    case 'class-4-digit-lock': {
      const values = digitValues(v.cards, g.parity);
      return numberText(values[g.order === 'smallest' ? g.rank - 1 : values.length - g.rank]);
    }
    case 'class-4-roman-tablets': {
      const [a, b] = v.codes.map(readRoman);
      return g.operation === 'read' ? String(a) : roman(g.operation === 'add' ? a + b : a - b);
    }
    case 'class-4-rounding-line': return numberText(Math.floor((v.value + v.unit / 2) / v.unit) * v.unit);
    case 'class-4-factor-trays': return String(v.mode === 'signals' ? v.a * v.b / gcd(v.a, v.b) : gcd(v.a, v.b));
    case 'class-4-part-bars': {
      const smaller = (v.total - v.difference) / 2;
      return String(g.level === 1 ? smaller + v.difference : g.level === 2 ? smaller : Math.floor(smaller / g.pack));
    }
    case 'class-4-split-product': return String(g.mode === 'right' ? v.right * v.height : g.mode === 'whole' ? (v.left + v.right) * v.height : v.total / (v.left + v.right));
    case 'class-4-division-manifest': {
      const full = Math.floor(v.total / v.capacity), left = v.total % v.capacity;
      return String(g.mode === 'full' ? full : g.mode === 'left' ? left : g.mode === 'all' ? Math.ceil(v.total / v.capacity) : v.capacity - left);
    }
    case 'class-4-column-repair': {
      const top = v.operation === '+' ? v.result - v.bottom : v.result + v.bottom;
      return String(Math.floor(top / g.place) % 10);
    }
    case 'class-4-equivalent-bars':
      checkPictures(question, 'fraction-choice', option => fraction(option.numerator, option.denominator));
      return fraction(v.numerator * g.factor, v.denominator * g.factor);
    case 'class-4-fraction-line': return g.mixed ? `${v.whole} ${v.step}/${v.denominator}` : fraction(v.whole * v.denominator + v.step, v.denominator);
    case 'class-4-sample-share': {
      const one = v.mode === 'whole' ? v.amount / v.numerator : v.amount / v.denominator;
      return String(v.mode === 'whole' ? one * v.denominator : v.mode === 'selected' ? one * v.numerator : one * (v.denominator - v.numerator));
    }
    case 'class-4-fraction-leftovers': {
      const firstShare = v.firstN / v.firstD;
      const shareLeft = v.sequential ? (1 - firstShare) * (1 - v.secondN / v.secondD) : 1 - firstShare - v.secondN / v.secondD;
      if (g.level !== 1) return String(Math.round(v.total * shareLeft));
      const denominator = v.firstD * v.secondD / gcd(v.firstD, v.secondD);
      return fraction(Math.round(shareLeft * denominator), denominator);
    }
    case 'class-4-l-bench': return String((g.mode === 'area' ? v.width * v.height - v.cutWidth * v.cutHeight : 2 * (v.width + v.height)) * g.count);
    case 'class-4-mirror-panel':
      checkPictures(question, 'mirror-choice', option => gridKey(option.cells));
      return gridKey(v.cells.map(row => [...row].reverse()));
    case 'class-4-folded-cube': return cubeOpposite(v.faces, g.target);
    case 'class-4-angle-gap': return String(180 - v.angles.reduce((a, b) => a + b, 0) - (g.difference ? v.angles[0] : 0));
    case 'class-4-offset-ruler': return String((v.endTick - v.startTick) * v.step * g.pieces);
    case 'class-4-lab-temperature': return String(v.base + v.tick * v.step + (g.mode === 'before' ? -g.change : g.change));
    case 'class-4-balance-crates': return String((v.total - v.known) / v.count);
    case 'class-4-unit-log': {
      const a = v.aWhole * v.base + v.aPart, b = v.bWhole * v.base + v.bPart;
      return String((v.operation === 'combine' ? a + b : a - b) / g.shares);
    }
    case 'class-4-task-timeline': return clockKey(g.backwards ? v.end - v.first - v.pause - v.second : v.start + v.first + v.pause + v.second);
    case 'class-4-shuttle-table': {
      const row = v.rows.find(row => row.depart >= g.ready);
      return g.level === 1 ? String(row.depart - g.ready) : g.level === 2 ? clockKey(row.arrive) : String(row.arrive - g.ready + g.walk);
    }
    case 'class-4-lab-calendar': return g.level === 1 ? WEEK[(v.first + v.date - 1) % 7] : g.level === 2 ? String(v.date + g.interval) : String(Math.floor((v.days - v.date) / g.interval) + 1);
    case 'class-4-clock-repair':
      checkPictures(question, 'clock-choice', option => clockKey(option.minutes));
      return clockKey(v.minutes - g.error + g.elapsed);
    case 'class-4-receipt-gap': return `Rs ${(v.total + v.discount - v.fee - v.otherQuantity * v.otherPrice) / v.quantity}`;
    case 'class-4-best-bundle': {
      const costs = v.offers.map(offer => g.target / offer.count * offer.price + offer.fee);
      return v.offers[costs.indexOf(Math.min(...costs))].label;
    }
    case 'class-4-supply-budget': return String(Math.floor((v.budget - v.requiredPrice * v.requiredQuantity - v.reserve - v.fee) / v.extraPrice));
    case 'class-4-change-counter': return money(v.paid - v.rows.reduce((sum, row) => sum + row.quantity * row.price, 0) + v.discount);
    case 'class-4-scaled-bars': {
      const values = v.heights.map(height => height * v.scale);
      return String(g.level === 1 ? values[g.target] : g.level === 2 ? values[g.high] - values[g.low] : values[g.high] + values[g.next] - values[g.low]);
    }
    case 'class-4-half-pictograph': {
      const values = v.halfCounts.map(halves => halves * v.key / 2);
      return String(g.level === 1 ? values[g.first] : g.level === 2 ? values[g.first] + values[g.second] : values[g.high] - values[g.low]);
    }
    case 'class-4-paired-surveys': {
      const scores = v.labels.map((_, i) => g.level === 1 ? v.morning[i] : g.level === 2 ? v.morning[i] + v.evening[i] : v.evening[i] - v.morning[i]);
      return v.labels[scores.indexOf(Math.max(...scores))];
    }
    case 'class-4-chart-transfer': return `${v.labels[g.target]} now has ${v.values[g.target] + (g.target === g.from ? -g.amount : g.amount) + g.extra} samples`;
    case 'class-4-rank-repair': {
      const total = v.front + v.back - 1;
      const newTotal = total + v.joinAhead + v.joinBehind - v.leaveAhead - v.leaveBehind;
      const newFront = v.front - v.leaveAhead + v.joinAhead - v.move;
      return String(g.level === 1 ? total : g.level === 2 ? newFront : newTotal - newFront + 1);
    }
    case 'class-4-rover-program': {
      const point = roverEnd(v);
      return at(point.x, point.y);
    }
    case 'class-4-checkpoint-routes': {
      const total = gridRoutes(v.width, v.height, v.closed);
      const through = v.checkpoint ? gridRoutes(v.checkpoint.x, v.checkpoint.y) * gridRoutes(v.width - v.checkpoint.x, v.height - v.checkpoint.y) : 0;
      return String(g.mode === 'all' ? total : g.mode === 'through' ? through : total - through);
    }
    case 'class-4-code-machine': {
      const [[a, b], [c, d]] = v.examples, multiplier = (d - b) / (c - a), extra = b - a * multiplier;
      return String(g.reverse ? (v.output - extra) / multiplier : v.query * multiplier + extra);
    }
    case 'class-4-alternating-lock': {
      const terms = v.terms, stepB = terms[3] - terms[1], index = Math.floor(g.missing / 2);
      if (g.missing % 2) return String(terms[1] + index * stepB);
      return String(g.multiply ? terms[0] * (terms[2] / terms[0]) ** index : terms[0] + index * (terms[2] - terms[0]));
    }
    default: throw new Error(`Unknown class-4 family: ${question.family}`);
  }
}
