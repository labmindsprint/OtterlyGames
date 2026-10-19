// Class 5 question bank (v3) -- "Galaxy Command" campaign, ages 10-11.
// Contract: FAMILIES, MISCONCEPTIONS, PLAN, draft, solve, render. See bank3-authoring-brief.md.
import {
  answerChoices, choiceCount, MISCONCEPTIONS as SHARED, numberArticle, numberText, QuestionRetry, sum, tidyStops, timeText, wordArticle, wrong,
} from './bank-shared.mjs';
import { clockDescription, clockFace, svg, text, tileGrid } from './diagram-kit.mjs';
import { balanceScale, balanceScaleHeight } from './sprites.mjs';
import {
  cardRow, numberGrid, numberTrack, placeValueChart, PLACE_NAMES,
  barModel, columnCalc, groupShare, symbolEquations,
  fractionStrips, fractionLine, fractionTileGrid,
  decimalPlaceChart, DECIMAL_PLACE_NAMES,
  labeledRectangle, angleFan, cubeNetCross, line,
  gaugeDial, thermometerTube,
  calendarGrid, calendarGridRows, timetableBoard, timetableBoardHeight, WEEKDAY_LABELS,
  barChart, priceTag, priceTagHeight, packCompareArt, packCompareHeight, itemShelfArt, itemShelfHeight, BLUE, PLUM,
  twinBarChart, twinBarChartHeight, pictographArt, pictographHeight,
  queueLine, routeGridArt, routeGridSize, iconSequenceArt, iconSequenceSize,
  junctionGridArt, junctionGridSize, predictionBoardArt, predictionBoardHeight,
} from './bank3-class-5-art.mjs';
import { REAL_MISCONCEPTIONS } from './bank3-class-5-real-kit.mjs';
import { REASONING_FAMILIES, DRAFT as REASONING_DRAFT, SOLVE as REASONING_SOLVE, renderReasoning } from './bank3-class-5-real.mjs';
import { MIXED_FAMILIES, DRAFT as MIXED_DRAFT, SOLVE as MIXED_SOLVE } from './bank3-class-5-real2.mjs';
import { REAL3_CODES, REAL3_FAMILIES, DRAFT as REAL3_DRAFT, SOLVE as REAL3_SOLVE, renderReal3 } from './bank3-class-5-real3.mjs';

// ---------------------------------------------------------------------------
// FAMILIES -- one entry per question family, grouped by chapter.
// ---------------------------------------------------------------------------
export const FAMILIES = {
  // numbers -- Number detectives
  'class-5-digit-card-extreme': { skill: 'expand', title: 'Build the greatest or smallest number from digit cards' },
  'class-5-number-line-round': { skill: 'place', title: 'Round a number using a number line' },
  'class-5-roman-numeral-mix': { skill: 'expand', title: 'Convert and calculate with Roman numerals' },
  'class-5-digit-riddle': { skill: 'place', title: 'Solve a multi-clue mystery number riddle' },
  'class-5-compare-order-grid': { skill: 'compare', title: 'Compare and order a set of large numbers' },
  'class-5-place-value-expand': { skill: 'place', title: 'Read and use a place-value chart' },

  // operations -- Mission mathematics
  'class-5-bar-model-multistep': { skill: 'mystery', title: 'Find an unknown part of a multi-step bar model' },
  'class-5-missing-digit-column': { skill: 'groups', title: 'Recover missing digits in a column calculation' },
  'class-5-factor-multiple-sort': { skill: 'factors', title: 'Sort numbers by factor and multiple conditions' },
  'class-5-schedule-meet-again': { skill: 'factors', title: 'Find when two repeating schedules meet again' },
  'class-5-equal-share-remainder': { skill: 'sharing', title: 'Share a quantity equally and use the remainder' },
  'class-5-symbol-equation-chain': { skill: 'mystery', title: 'Solve linked symbol equations' },

  // fractions -- Fraction lab
  'class-5-fraction-bar-equivalent': { skill: 'fraction-read', title: 'Find an equivalent fraction from a bar picture' },
  'class-5-fraction-number-line': { skill: 'fraction-read', title: 'Locate fractions on a number line' },
  'class-5-fraction-of-amount': { skill: 'fraction-of', title: 'Find a fraction of a quantity' },
  'class-5-fraction-left-after': { skill: 'fraction-of', title: 'Find what remains after two fraction changes' },
  'class-5-fraction-compare-order': { skill: 'fraction-compare', title: 'Compare and order fractions of the same whole' },
  'class-5-mixed-number-picture': { skill: 'fraction-read', title: 'Match a shaded picture to a mixed number' },

  // decimals -- Decimal discoveries
  'class-5-decimal-grid-model': { skill: 'decimals', title: 'Read a hundredths grid as a decimal' },
  'class-5-decimal-number-line': { skill: 'decimals', title: 'Locate decimals on a number line' },
  'class-5-decimal-place-value': { skill: 'decimals', title: 'Use place value in a decimal chart' },
  'class-5-decimal-money-measure': { skill: 'decimals', title: 'Add and subtract decimal money or measures' },
  'class-5-decimal-compare-order': { skill: 'decimals', title: 'Compare and order decimal cards' },
  'class-5-decimal-fraction-link': { skill: 'decimals', title: 'Convert between a decimal and a fraction' },

  // geometry -- Area, perimeter and angles
  'class-5-composite-area': { skill: 'area', title: 'Find the area of a composite grid figure' },
  'class-5-perimeter-missing-side': { skill: 'perimeter', title: 'Find a missing side or the perimeter of a figure' },
  'class-5-angle-chase': { skill: 'angles', title: 'Find an unknown angle using angle facts' },
  'class-5-cube-net-fold': { skill: 'solids', title: 'Find a matching or opposite face on a cube net' },
  'class-5-symmetry-count': { skill: 'symmetry', title: 'Complete or count a figure using symmetry' },
  'class-5-count-rectangles-grid': { skill: 'shape', title: 'Count every rectangle hidden in a grid' },

  // measurement -- Measure the mission
  'class-5-dial-read-convert': { skill: 'measure', title: 'Read a dial and convert its units' },
  'class-5-balance-unknown-mass': { skill: 'measure', title: 'Find an unknown mass from a balanced scale' },
  'class-5-unit-conversion-compare': { skill: 'measure', title: 'Convert mixed units before comparing them' },
  'class-5-thermometer-change': { skill: 'measure', title: 'Track a temperature change on a thermometer' },
  'class-5-measurement-word-problem': { skill: 'measure', title: 'Solve a multi-step measurement word problem' },
  'class-5-sensible-unit-estimate': { skill: 'measure', title: 'Choose the most sensible unit or measurement' },

  // time -- Time travellers
  'class-5-elapsed-time-bar': { skill: 'time', title: 'Find elapsed time on a mission timeline' },
  'class-5-clock-fast-slow': { skill: 'time', title: 'Correct a clock that runs fast or slow' },
  'class-5-calendar-weekday-calc': { skill: 'calendar', title: 'Reason with dates on a month calendar' },
  'class-5-timetable-read': { skill: 'time', title: 'Read and compare a departures timetable' },
  'class-5-time-24hr-convert': { skill: 'time', title: 'Convert between 12-hour and 24-hour time' },

  // money -- Space supplies
  'class-5-price-board-bundle': { skill: 'money', title: 'Total a bundle of purchases from a price board' },
  'class-5-discount-calc': { skill: 'money', title: 'Apply or reverse a discount on a price' },
  'class-5-best-value-compare': { skill: 'money', title: 'Compare packs to find the best value' },
  'class-5-budget-condition': { skill: 'money', title: 'Choose a purchase that meets a budget condition' },
  'class-5-receipt-missing-price': { skill: 'money', title: 'Find a missing price on a receipt' },

  // data -- Mission data
  'class-5-pictograph-key-scale': { skill: 'chart', title: 'Read a pictograph with a scaled key' },
  'class-5-bar-chart-unusual-scale': { skill: 'chart', title: 'Read a bar chart with an unusual scale' },
  'class-5-two-chart-compare': { skill: 'chart', title: 'Compare results across two charts' },
  'class-5-chart-after-transfer': { skill: 'chart', title: 'Update a chart after a transfer between groups' },
  'class-5-average-balance': { skill: 'chart', title: 'Find an average by balancing a bar chart' },
  'class-5-chart-statement-check': { skill: 'chart', title: 'Decide which statement about a chart is true' },

  // reasoning -- Logic launchpad
  'class-5-rank-queue-twoends': { skill: 'ranking', title: 'Combine ranks counted from both ends of a queue' },
  'class-5-grid-route-turns': { skill: 'directions', title: 'Follow turning instructions on a grid map' },
  'class-5-path-count-grid': { skill: 'routes', title: 'Count the routes across a junction grid' },
  'class-5-truth-teller': { skill: 'visual', title: 'Find the real finishing places from a prediction board' },
  'class-5-combinations-count': { skill: 'combinations', title: 'Count allowed combinations from two groups' },
  'class-5-figure-matrix-analogy': { skill: 'visual', title: 'Complete a picture matrix by its hidden rule' },
  ...REASONING_FAMILIES,
  ...MIXED_FAMILIES,
  ...REAL3_FAMILIES,
};

// ---------------------------------------------------------------------------
// MISCONCEPTIONS -- class-5-specific codes. Shared codes from bank-shared.mjs
// are reused directly by name in wrong(..., code) and do not need redeclaring.
// ---------------------------------------------------------------------------
export const MISCONCEPTIONS = {
  ...REAL_MISCONCEPTIONS,
  ...REAL3_CODES,
  // numbers
  'class-5-extreme-confuse': { title: 'Greatest or smallest', message: 'Re-read whether the question asks for the greatest or the smallest number.' },
  'class-5-round-direction': { title: 'Rounding direction', message: 'Compare the value to both neighbouring multiples and round to the one it is closer to.' },
  'class-5-compare-digits': { title: 'Comparing multi-digit numbers', message: 'Compare the leftmost digits first; a bigger digit there makes the whole number bigger.' },
  'class-5-roman-subtract': { title: 'Roman subtractive notation', message: 'A smaller symbol placed before a larger one is subtracted, not added.' },
  'class-5-roman-value': { title: 'Roman symbol values', message: 'Learn each symbol: I=1, V=5, X=10, L=50, C=100, D=500, M=1000.' },
  'class-5-roman-combine': { title: 'Which group changes', message: 'Re-read which group gains or loses the amount that moved.' },
  'class-5-order-position': { title: 'Ordering a list', message: 'Sort every number first, then count positions from the end stated in the question.' },
  'class-5-place-column': { title: 'Finding the right column', message: 'Count the places from the ones column to find the column the question means.' },

  // operations
  'class-5-bar-share-equal': { title: 'Sharing before comparing', message: 'When one part is more than the other, remove the extra amount first, then share the rest equally.' },
  'class-5-factor-vs-multiple': { title: 'Factor or multiple', message: 'A factor divides the number exactly; a multiple is what you get by multiplying it.' },
  'class-5-common-factor': { title: 'Common factors', message: 'A common factor must divide both numbers exactly, not just one of them.' },
  'class-5-hcf-lcm-confuse': { title: 'HCF or LCM', message: 'The highest common factor divides both numbers; the lowest common multiple is divided by both numbers.' },

  // fractions
  'class-5-equivalent-rule': { title: 'Making an equivalent fraction', message: 'Multiply (or divide) both the numerator and the denominator by the same number.' },
  'class-5-fraction-simplify': { title: 'Simplifying a fraction', message: 'Divide the numerator and denominator by their common factor until none remains.' },

  // decimals
  'class-5-decimal-place-shift': { title: 'Decimal place value', message: 'Each step right of the decimal point is ten times smaller: tenths, then hundredths, then thousandths.' },
  'class-5-decimal-compare': { title: 'Comparing decimals', message: 'Line up the decimal points first; a longer decimal is not always the bigger value.' },
  'class-5-decimal-complement': { title: 'Shaded or not shaded', message: 'Re-read whether the question wants the shaded amount or the part left unshaded.' },
  'class-5-decimal-fraction-rule': { title: 'Decimal-fraction links', message: 'Hundredths are written as a fraction over 100, then simplified by dividing top and bottom by their common factor.' },

  // geometry
  'class-5-symmetry-mirror': { title: 'Completing a symmetric figure', message: 'Every shaded square on one side of the mirror line needs a matching shaded square on the other side.' },
  'class-5-rectangle-count': { title: 'Counting hidden rectangles', message: 'Count rectangles of every size, not just the smallest unit squares.' },

  // measurement
  'class-5-measure-compare': { title: 'Comparing mixed units', message: 'Convert both quantities to the same unit before deciding which is larger.' },
  'class-5-sensible-unit': { title: 'Choosing a sensible unit', message: 'Picture the real object; the unit and the number together must give a sensible size.' },

  // time
  'class-5-ampm-confuse': { title: 'Morning or afternoon', message: 'Check whether the hour is before or after midday before switching between the two clock formats.' },

  // money
  'class-5-best-value': { title: 'Comparing value for money', message: 'Divide each price by its own quantity so every pack is compared by its price for one item.' },
  'class-5-percent-of-confuse': { title: 'Taking a percentage off a price', message: 'Work out the percentage of the price first, then subtract that amount -- do not subtract the percent number itself.' },

  // data
  'class-5-chart-row': { title: 'Matching the chart row', message: 'Match the named category to its own bar, row or symbol before reading its value.' },
  'class-5-average-total': { title: 'Finding an average', message: 'Add every value together first, then divide by how many values there are.' },
  'class-5-chart-statement': { title: 'Checking a statement against a chart', message: 'Check a statement against every value in the chart before deciding it is true.' },

  // reasoning
  'class-5-queue-total': { title: 'Combining front and back ranks', message: 'Subtract 1 only once for the cadet counted in both ranks.' },
  'class-5-queue-gap': { title: 'Counting cadets between two people', message: 'Add both ranks and the number between them, then subtract 1 only once.' },
  'class-5-grid-axis': { title: 'Reading grid coordinates', message: 'The first number is the column, counted from the left; the second is the row, counted from the top.' },
  'class-5-route-turn': { title: 'Turning left or right', message: 'A right turn and a left turn send the rover to face in opposite new directions.' },
  'class-5-combo-count': { title: 'Counting every combination', message: 'Multiply the two group sizes exactly once; do not add or remove a single item from either group.' },
  'class-5-combo-exclude': { title: 'Removing one forbidden pairing', message: 'Only the one forbidden pair is removed, not a whole row or column of pairings.' },
  'class-5-pattern-outside': { title: 'Shapes outside the pattern', message: 'The missing shape must be one of the shapes already used in the repeating pattern.' },
  'class-5-matrix-rule': { title: 'Finding the hidden-cell rule', message: 'Check what changes along the row and what changes along the column separately.' },
  'class-5-path-count': { title: 'Counting routes on a grid', message: 'Add the routes reaching each junction from the one above and the one to its left, starting from 1s along the top and left edges.' },
  'class-5-path-block': { title: 'Routes through a blocked junction', message: 'Subtract routes that reach the blocked junction and then continue on to the end, not just the routes that reach it.' },
  'class-5-truth-swap': { title: 'Finishing places after elimination', message: 'Every rover not named correct must have swapped places with another rover not named correct.' },
};

const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

// ---------------------------------------------------------------------------
// PLAN -- exactly the ten class-5 chapters; rows are Explore / Reason / Stretch.
// ---------------------------------------------------------------------------
export const PLAN = {
  numbers: [
    'class-5-digit-card-extreme class-5-number-line-round class-5-place-value-expand class-5-compare-order-grid class-5-roman-numeral-mix class-5-pqr-number-facts',
    'class-5-digit-card-extreme class-5-roman-numeral-mix class-5-digit-riddle class-5-place-value-expand class-5-compare-order-grid class-5-pqr-number-facts class-5-big-number-story class-5-statement-pair',
    'class-5-digit-riddle class-5-roman-numeral-mix class-5-number-line-round class-5-compare-order-grid class-5-digit-card-extreme class-5-pqr-number-facts class-5-hcf-lcm-mix class-5-greatest-of-four',
  ],
  operations: [
    'class-5-bar-model-multistep class-5-missing-digit-column class-5-equal-share-remainder class-5-symbol-equation-chain class-5-big-number-story class-5-hcf-lcm-mix',
    'class-5-bar-model-multistep class-5-factor-multiple-sort class-5-schedule-meet-again class-5-missing-digit-column class-5-symbol-equation-chain class-5-hcf-lcm-mix class-5-big-number-story class-5-greatest-of-four',
    'class-5-factor-multiple-sort class-5-schedule-meet-again class-5-bar-model-multistep class-5-equal-share-remainder class-5-missing-digit-column class-5-hcf-lcm-mix class-5-age-puzzle class-5-big-number-story',
  ],
  fractions: [
    'class-5-fraction-bar-equivalent class-5-fraction-number-line class-5-fraction-of-amount class-5-mixed-number-picture',
    'class-5-fraction-bar-equivalent class-5-fraction-compare-order class-5-fraction-of-amount class-5-fraction-left-after class-5-fraction-number-line class-5-pqr-number-facts',
    'class-5-fraction-left-after class-5-fraction-compare-order class-5-mixed-number-picture class-5-fraction-of-amount class-5-fraction-number-line class-5-pqr-number-facts',
  ],
  decimals: [
    'class-5-decimal-grid-model class-5-decimal-number-line class-5-decimal-place-value class-5-decimal-money-measure class-5-decimal-fraction-link class-5-pqr-number-facts',
    'class-5-decimal-grid-model class-5-decimal-place-value class-5-decimal-compare-order class-5-decimal-money-measure class-5-decimal-fraction-link class-5-pqr-number-facts class-5-statement-pair',
    'class-5-decimal-compare-order class-5-decimal-number-line class-5-decimal-place-value class-5-decimal-money-measure class-5-decimal-fraction-link class-5-pqr-number-facts class-5-statement-pair',
  ],
  geometry: [
    'class-5-composite-area class-5-perimeter-missing-side class-5-angle-chase class-5-cube-net-fold class-5-pqr-shape-measure',
    'class-5-composite-area class-5-perimeter-missing-side class-5-angle-chase class-5-symmetry-count class-5-count-rectangles-grid class-5-pqr-shape-measure class-5-field-rounds-area',
    'class-5-composite-area class-5-angle-chase class-5-symmetry-count class-5-count-rectangles-grid class-5-cube-net-fold class-5-pqr-shape-measure class-5-field-rounds-area',
  ],
  measurement: [
    'class-5-dial-read-convert class-5-thermometer-change class-5-unit-conversion-compare class-5-sensible-unit-estimate class-5-pqr-shape-measure',
    'class-5-dial-read-convert class-5-balance-unknown-mass class-5-unit-conversion-compare class-5-measurement-word-problem class-5-thermometer-change class-5-pqr-shape-measure class-5-field-rounds-area',
    'class-5-balance-unknown-mass class-5-measurement-word-problem class-5-unit-conversion-compare class-5-thermometer-change class-5-dial-read-convert class-5-pqr-shape-measure class-5-field-rounds-area',
  ],
  time: [
    'class-5-elapsed-time-bar class-5-calendar-weekday-calc class-5-timetable-read class-5-time-24hr-convert class-5-ampm-elapsed',
    'class-5-elapsed-time-bar class-5-clock-fast-slow class-5-calendar-weekday-calc class-5-timetable-read class-5-time-24hr-convert class-5-ampm-elapsed',
    'class-5-clock-fast-slow class-5-elapsed-time-bar class-5-calendar-weekday-calc class-5-timetable-read class-5-time-24hr-convert class-5-ampm-elapsed',
  ],
  money: [
    'class-5-price-board-bundle class-5-discount-calc class-5-receipt-missing-price class-5-best-value-compare',
    'class-5-price-board-bundle class-5-discount-calc class-5-best-value-compare class-5-budget-condition class-5-receipt-missing-price',
    'class-5-budget-condition class-5-discount-calc class-5-best-value-compare class-5-price-board-bundle class-5-receipt-missing-price',
  ],
  data: [
    'class-5-pictograph-key-scale class-5-bar-chart-unusual-scale class-5-two-chart-compare class-5-chart-after-transfer class-5-line-graph-two',
    'class-5-pictograph-key-scale class-5-bar-chart-unusual-scale class-5-average-balance class-5-two-chart-compare class-5-chart-two-answers class-5-line-graph-two',
    'class-5-chart-statement-check class-5-average-balance class-5-two-chart-compare class-5-bar-chart-unusual-scale class-5-chart-two-answers class-5-line-graph-two',
  ],
  // reasoning carries 15 of the 50 questions in a real Class 5 paper, so its rows are as wide as the sampling battery allows.
  reasoning: [
    'class-5-order-middle class-5-walk-distance class-5-blood-relation class-5-mirror-clock class-5-letter-code class-5-alpha-series class-5-figure-matrix-analogy class-5-rank-queue-twoends class-5-mirror-water-word class-5-combinations-count',
    'class-5-order-people class-5-compass-map class-5-letter-code class-5-mirror-clock class-5-number-series class-5-fold-cut-count class-5-venn-survey class-5-odd-one-out class-5-day-sequence class-5-grid-route-turns',
    'class-5-row-swap-rank class-5-walk-distance class-5-count-grid class-5-venn-survey class-5-truth-teller class-5-combinations-count class-5-figure-matrix-analogy class-5-path-count-grid class-5-grid-route-turns class-5-rank-queue-twoends',
  ],
};

// ---------------------------------------------------------------------------
// Small pure helpers shared across families.
// ---------------------------------------------------------------------------
const digitsOf = n => String(n).split('').map(Number);
const fromDigits = arr => Number(arr.join(''));
const digitSum = n => digitsOf(n).reduce((a, b) => a + b, 0);
// Pluralises a regular noun only when the count requires it, so generated prose never reads "1 crates".
const plural = (n, word) => (n === 1 ? word : `${word}s`);
// Formats whole minutes as "N min" under an hour, else "H h" or "H h MM min" -- avoids the plural trap
// entirely because "min"/"h" are abbreviations, not count-sensitive nouns.
const fmtDuration = minutes => (minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h${minutes % 60 === 0 ? '' : ` ${minutes % 60} min`}`);
// Formats a rupee amount, dropping ".00" so a whole-rupee result reads "Rs 5" rather than "Rs 5.00".
const rupees = value => (Number.isInteger(value) ? `Rs ${value}` : `Rs ${value.toFixed(2)}`);
// Thematic item names for the money chapter's price boards/receipts -- regular plural nouns so quantity
// phrasing ("3 fuel cells") always reads naturally.
const SPACE_ITEMS = ['fuel cell', 'star map', 'oxygen tank', 'signal flare', 'tool kit', 'ration pack', 'solar panel', 'repair kit'];
// Items paired with a matching sprite name from sprites.mjs and a short card label, for money-chapter
// visuals that draw an icon per item (pack comparisons, supply shelves) rather than a plain text board.
// The card label stays a single short word so it never crowds a narrow shelf/pack card; prose always
// uses the full name (index 0) instead.
const SHELF_ITEMS = [
  ['fuel cell', 'fuel-cell', 'Fuel cell'], ['crystal', 'crystal', 'Crystal'], ['satellite', 'satellite', 'Satellite'],
  ['crate', 'crate', 'Crate'], ['comet sample', 'comet', 'Comet'], ['asteroid chunk', 'asteroid', 'Asteroid'],
  ['signal flag', 'flag', 'Flag'],
];
// English ordinal suffix for a whole number (1 -> "st", 2 -> "nd", 11 -> "th", 21 -> "st", ...).
const ordinal = n => (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');

function bumpDigit(digitsArr, index, delta) {
  const copy = [...digitsArr];
  copy[index] = Math.max(0, Math.min(9, copy[index] + delta));
  return fromDigits(copy);
}

function divisorsOf(n) {
  const list = [];
  for (let d = 1; d * d <= n; d++) {
    if (n % d === 0) { list.push(d); if (d !== n / d) list.push(n / d); }
  }
  return list.sort((a, b) => a - b);
}
function gcdOf(a, b) { return b === 0 ? a : gcdOf(b, a % b); }
function lcmOf(a, b) { return (a * b) / gcdOf(a, b); }

// Money is always carried as an integer paise count internally and formatted once, to avoid float drift.
const fmtRs = paise => `Rs ${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, '0')}`;
// Nudges a numeric candidate upward by `step` until it is not already in `used` (and records it), so
// distractors built from the same arithmetic domain as the answer never collide purely by coincidence.
function distinctNudge(candidate, used, step) {
  let value = candidate;
  while (used.has(value)) value += step;
  used.add(value);
  return value;
}
// Capitalises the first letter of a lowercase item name for display on a board or receipt row.
const cap = word => word[0].toUpperCase() + word.slice(1);
// Formats a hundredths integer as a decimal string, dropping a trailing zero (e.g. 340 -> "3.4", 345 -> "3.45").
const fmtDecimal = hundredths => {
  const whole = Math.floor(hundredths / 100);
  const frac = hundredths % 100;
  return frac % 10 === 0 ? `${whole}.${frac / 10}` : `${whole}.${String(frac).padStart(2, '0')}`;
};
// A 10x10 grid of cells, filled row-major from the top left up to `shaded` cells.
function buildHundredthsGrid(shaded) {
  const cells = [];
  for (let row = 0; row < 10; row++) {
    const rowCells = [];
    for (let col = 0; col < 10; col++) rowCells.push(row * 10 + col < shaded ? 1 : 0);
    cells.push(rowCells);
  }
  return cells;
}
// A W-by-H grid with a notchW-by-notchH corner (top right) left unfilled, forming an L-shaped figure.
function buildCompositeGrid(W, H, notchW, notchH) {
  const cells = [];
  for (let row = 0; row < H; row++) {
    const rowCells = [];
    for (let col = 0; col < W; col++) rowCells.push(row < notchH && col >= W - notchW ? 0 : 1);
    cells.push(rowCells);
  }
  return cells;
}
const nChoose2 = k => (k * (k - 1)) / 2;
// A grid split by a vertical mirror line at column cols/2; shadedLeftIndexes are row-major indexes (0 to
// (cols/2)*rows - 1) within the left half only, marked 1; the right half is always left blank (0) for the
// student to complete.
function buildMirrorGrid(cols, rows, shadedLeftIndexes) {
  const half = cols / 2;
  const shadedSet = new Set(shadedLeftIndexes);
  const cells = [];
  for (let row = 0; row < rows; row++) {
    const rowCells = [];
    for (let col = 0; col < cols; col++) rowCells.push(col < half && shadedSet.has(row * half + col) ? 1 : 0);
    cells.push(rowCells);
  }
  return cells;
}
// Opposite-face index pairs for the cubeNetCross layout (positions 0-3 are the row of four, 4-5 are the
// flaps above/below position 1): verified by manually folding the cross net into a cube.
const NET_OPPOSITE_PAIRS = [[0, 2], [1, 3], [4, 5]];

const ROMAN_TABLE = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const ROMAN_ADDITIVE_TABLE = [[1000, 'M'], [500, 'D'], [100, 'C'], [50, 'L'], [10, 'X'], [5, 'V'], [1, 'I']];
const ROMAN_FACE = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

function toRoman(value) {
  let remaining = value;
  let result = '';
  for (const [amount, symbol] of ROMAN_TABLE) {
    while (remaining >= amount) { result += symbol; remaining -= amount; }
  }
  return result;
}

function toRomanAdditive(value) {
  let remaining = value;
  let result = '';
  for (const [amount, symbol] of ROMAN_ADDITIVE_TABLE) {
    while (remaining >= amount) { result += symbol; remaining -= amount; }
  }
  return result;
}

const romanMisread = roman => [...roman].reduce((total, letter) => total + ROMAN_FACE[letter], 0);

// Picks a number whose standard Roman form uses at least one subtractive pair,
// so an "additive misread" distractor is always different from the real answer.
function romanFriendlyNumber(r, min, max) {
  for (let tries = 0; tries < 20; tries++) {
    const n = r.int(min, max);
    if (toRoman(n) !== toRomanAdditive(n)) return n;
  }
  return 49;
}

// Splits a quantity given in the small unit into a "big small-remainder" compound pair,
// e.g. splitCompound(340, 100) -> { big: 3, rem: 40 } for "3 m 40 cm".
function splitCompound(valueSmall, factor) {
  return { big: Math.floor(valueSmall / factor), rem: valueSmall % factor };
}

// Gauge contexts for class-5-dial-read-convert: each pairs a cover-story name with a big/small unit and
// the x1000 factor between them (so the dial-reading step and the conversion step use the same arithmetic).
const DIAL_CONTEXTS = [
  { name: 'fuel tank', big: 'L', small: 'mL', factor: 1000 },
  { name: 'water tank', big: 'L', small: 'mL', factor: 1000 },
  { name: 'cargo pod', big: 'kg', small: 'g', factor: 1000 },
  { name: 'ice sample', big: 'kg', small: 'g', factor: 1000 },
];

// Location contexts for class-5-thermometer-change.
const THERMO_CONTEXTS = ['engine core', 'cryo-bay', 'greenhouse dome', 'hull plating'];

// Big/small unit pairs for class-5-unit-conversion-compare.
const UNIT_COMPARE_PAIRS = [
  { big: 'km', small: 'm', factor: 1000 },
  { big: 'm', small: 'cm', factor: 100 },
  { big: 'kg', small: 'g', factor: 1000 },
  { big: 'l', small: 'ml', factor: 1000 },
];

// Real-world items for class-5-sensible-unit-estimate, grouped by measurement category; each unit list
// always has exactly 4 entries (the true unit plus 3 distractor units) so every item yields 4 options.
const SENSIBLE_UNITS_BY_CATEGORY = {
  mass: ['mg', 'g', 'kg', 'tonnes'],
  length: ['mm', 'cm', 'm', 'km'],
  capacity: ['ml', 'l', 'g', 'kg'],
};
const SENSIBLE_ITEMS = [
  { thing: 'the mass of a school bus', category: 'mass', value: 9, unit: 'tonnes' },
  { thing: 'the mass of a mobile phone', category: 'mass', value: 180, unit: 'g' },
  { thing: 'the mass of a grain of rice', category: 'mass', value: 20, unit: 'mg' },
  { thing: 'the mass of a bag of rice', category: 'mass', value: 5, unit: 'kg' },
  { thing: 'the mass of an adult otter', category: 'mass', value: 12, unit: 'kg' },
  { thing: 'the height of a classroom door', category: 'length', value: 2, unit: 'm' },
  { thing: 'the width of a fingernail', category: 'length', value: 12, unit: 'mm' },
  { thing: 'the length of a football pitch', category: 'length', value: 100, unit: 'm' },
  { thing: 'the distance between two cities', category: 'length', value: 90, unit: 'km' },
  { thing: 'the thickness of a coin', category: 'length', value: 2, unit: 'mm' },
  { thing: 'the amount in a spoon of syrup', category: 'capacity', value: 5, unit: 'ml' },
  { thing: 'the amount of water in a bucket', category: 'capacity', value: 9, unit: 'l' },
  { thing: 'the amount of fuel in a rover tank', category: 'capacity', value: 40, unit: 'l' },
  { thing: 'the mass of a pencil', category: 'mass', value: 6, unit: 'g' },
  { thing: 'the mass of an elephant', category: 'mass', value: 5, unit: 'tonnes' },
  { thing: 'the mass of a watermelon', category: 'mass', value: 4, unit: 'kg' },
  { thing: 'the mass of a slice of bread', category: 'mass', value: 30, unit: 'g' },
  { thing: 'the mass of a cricket ball', category: 'mass', value: 160, unit: 'g' },
  { thing: 'the mass of a loaded cargo truck', category: 'mass', value: 20, unit: 'tonnes' },
  { thing: 'the length of a pencil', category: 'length', value: 18, unit: 'cm' },
  { thing: 'the length of a swimming pool', category: 'length', value: 50, unit: 'm' },
  { thing: 'the height of a tall tree', category: 'length', value: 20, unit: 'm' },
  { thing: 'the width of a laptop', category: 'length', value: 35, unit: 'cm' },
  { thing: 'the length of an ant', category: 'length', value: 5, unit: 'mm' },
  { thing: 'the distance a rover drives in a day', category: 'length', value: 40, unit: 'km' },
  { thing: 'the amount of water in a bath', category: 'capacity', value: 150, unit: 'l' },
  { thing: 'the amount of milk in a cup', category: 'capacity', value: 200, unit: 'ml' },
  { thing: 'the amount of medicine in one dose', category: 'capacity', value: 10, unit: 'ml' },
  { thing: 'the amount of juice in a carton', category: 'capacity', value: 1, unit: 'l' },
  { thing: 'the amount of water in a small bottle', category: 'capacity', value: 500, unit: 'ml' },
];
const SENSIBLE_TEMPLATES = [
  thing => `Which is the most sensible estimate for ${thing}?`,
  thing => `Pick the sensible measurement for ${thing}.`,
  thing => `Which measurement makes the most sense for ${thing}?`,
  thing => `Choose the measurement that best fits ${thing}.`,
];

// Cover-story contexts for class-5-measurement-word-problem, one per unit-type family. setup() builds the
// opening sentence that states the starting quantity in natural words for that unit type.
const WORD_PROBLEM_CONTEXTS = [
  {
    small: 'cm', big: 'm', factor: 100, verb: 'cut off', things: ['cable', 'rope', 'wire', 'ribbon'],
    setup: (thing, text) => `A ${thing} is ${text} long.`,
  },
  {
    small: 'g', big: 'kg', factor: 1000, verb: 'unloaded', things: ['sack of rice', 'crate of parts', 'sample tray'],
    setup: (thing, text) => `A ${thing} weighs ${text}.`,
  },
  {
    small: 'ml', big: 'l', factor: 1000, verb: 'poured out', things: ['fuel drum', 'water tank', 'coolant tank'],
    setup: (thing, text) => `A ${thing} holds ${text}.`,
  },
];

// Stage names for class-5-elapsed-time-bar's mission timeline bar model.
const MISSION_STAGES = ['Launch prep', 'Orbit climb', 'Jump transit', 'Approach burn', 'Docking'];

// Craft names for class-5-timetable-read's departures board.
const CRAFT_NAMES = ['Comet Runner', 'Star Skiff', 'Nova Ferry', 'Orbit Shuttle', 'Jump Clipper', 'Solar Barge'];

// Category names for the data chapter's bar/pictograph families.
const OUTPOST_NAMES = ['Outpost A', 'Outpost B', 'Outpost C', 'Outpost D'];

// A statement about an outpost chart, parameterised so draft() and solve() build identical text from
// identical facts. shape is 'greatest' | 'smallest' | 'sum' | 'greater'; params carries the indices (and,
// for 'sum', the claimed total) the statement is about.
const CHART_CONTEXTS = [
  { noun: 'crates', did: 'loaded' }, { noun: 'samples', did: 'collected' },
  { noun: 'panels', did: 'fixed' }, { noun: 'tanks', did: 'filled' },
];
function chartStatement(shape, { a, b, total, noun = 'units' }) {
  if (shape === 'greatest') return `${OUTPOST_NAMES[a]} has the most ${noun}.`;
  if (shape === 'smallest') return `${OUTPOST_NAMES[a]} has the fewest ${noun}.`;
  if (shape === 'sum') return `Outposts ${OUTPOST_NAMES[a].slice(-1)} and ${OUTPOST_NAMES[b].slice(-1)} have ${total} ${noun} together.`;
  return `${OUTPOST_NAMES[a]} has more ${noun} than ${OUTPOST_NAMES[b]}.`;
}

// Counts of rectangles in an m-wide, n-tall grid of unit squares, for class-5-count-rectangles-grid.
function rectangleCounts(m, n, k, j) {
  const all = nChoose2(m + 1) * nChoose2(n + 1);
  let squares = 0;
  for (let side = 1; side <= Math.min(m, n); side++) squares += (m - side + 1) * (n - side + 1);
  return {
    all, squares, nonsquare: all - squares, unit: m * n,
    wide: (m - k + 1) * nChoose2(n + 1), tall: (n - k + 1) * nChoose2(m + 1), exact: (m - k + 1) * (n - j + 1),
  };
}

// 12-hour clock text such as "9:05 AM" for a minute count since midnight.
function clockText12(totalMinutes) {
  const day = ((totalMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(day / 60);
  return `${hour % 12 || 12}:${String(day % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

// Answer for class-5-schedule-meet-again; shared by draft() and solve().
function scheduleAnswer({ a, b, ask, span, startMinute }) {
  const lcm = lcmOf(a, b);
  if (ask === 'trips') return String(lcm / b);
  if (ask === 'times') return String(Math.floor(span / lcm));
  if (ask === 'clock') return clockText12(startMinute + lcm);
  return String(lcm);
}

// Cover stories for class-5-equal-share-remainder: what is shared, who gets it, and what it is packed into.
const SHARE_CONTEXTS = [
  { item: 'ration packs', holder: 'crews', packs: 'crates' },
  { item: 'star charts', holder: 'cadets', packs: 'folders' },
  { item: 'seed packets', holder: 'greenhouse domes', packs: 'trays' },
  { item: 'oxygen tanks', holder: 'moon bases', packs: 'racks' },
  { item: 'solar panels', holder: 'outposts', packs: 'pallets' },
  { item: 'spare bolts', holder: 'rovers', packs: 'boxes' },
];

// Numerator asked for in class-5-fraction-number-line level 1; shared by draft() and solve().
function fractionLineTarget(ask, pointerAt, den) {
  if (ask === 'togo') return den - pointerAt;
  if (ask === 'next') return pointerAt + 1;
  if (ask === 'back') return pointerAt - 1;
  return pointerAt;
}

// Singular/plural helper for reasoning-chapter wording, e.g. noun(1, 'cadet', 'cadets').
const noun = (n, one, many) => (n === 1 ? one : many);

// Names for the reasoning chapter's queue and race-prediction puzzles.
const CADET_NAMES = ['Zayn', 'Mira', 'Juno', 'Kavi', 'Leni', 'Omar', 'Priya', 'Theo'];
const ROVER_NAMES = ['Vega', 'Lyra', 'Atlas', 'Nyx', 'Orion', 'Cora'];

// Shapes usable in class-5-figure-matrix-analogy (matches diagram-kit.mjs's icon() shapes exactly).
const ALL_SHAPES = ['circle', 'triangle', 'square', 'rectangle', 'star', 'pentagon', 'hexagon'];
const MATRIX_COLORS = [{ name: 'blue', fill: BLUE }, { name: 'purple', fill: PLUM }];

// Compass simulation for class-5-grid-route-turns. Grid cells are numbered 0..size-1; row 0 is the
// north edge, column 0 is the west edge (matching how routeGridArt draws top-to-bottom, left-to-right).
const FACINGS = ['N', 'E', 'S', 'W'];
const FACING_WORDS = { N: 'north', E: 'east', S: 'south', W: 'west' };
const FACING_DELTA = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const turnFacing = (facing, dir) => FACINGS[(FACINGS.indexOf(facing) + (dir === 'right' ? 1 : 3)) % 4];

// Simulates a route (segments = [{ turnBefore: 'right' | 'left' | null, distance }], turnBefore applies
// before that segment's forward move). Returns null the moment any step would leave the grid.
function simulateRoute(size, startX, startY, startFacing, segments) {
  let facing = startFacing;
  let x = startX;
  let y = startY;
  for (const seg of segments) {
    if (seg.turnBefore) facing = turnFacing(facing, seg.turnBefore);
    const [dx, dy] = FACING_DELTA[facing];
    x += dx * seg.distance;
    y += dy * seg.distance;
    if (x < 0 || x >= size || y < 0 || y >= size) return null;
  }
  return { x, y, facing };
}

// Same simulation with no bounds check, used only to compute "what if" distractor end points that
// never need to stay on the visible grid.
function simulateRouteLenient(startX, startY, startFacing, segments) {
  let facing = startFacing;
  let x = startX;
  let y = startY;
  for (const seg of segments) {
    if (seg.turnBefore) facing = turnFacing(facing, seg.turnBefore);
    const [dx, dy] = FACING_DELTA[facing];
    x += dx * seg.distance;
    y += dy * seg.distance;
  }
  return { x, y, facing };
}

// Builds a random in-bounds route of numForward forward moves starting from the grid's centre cell.
// Retries with a fresh random route (never a fixed seed) up to 40 times before giving up.
function buildRoute(r, size, numForward, maxDistance = 2) {
  for (let tries = 0; tries < 40; tries++) {
    const start = { x: r.int(3, size - 4), y: r.int(3, size - 4) };
    const startFacing = r.pick(FACINGS);
    const segments = Array.from({ length: numForward }, (_, i) => ({
      turnBefore: i === 0 ? null : r.pick(['right', 'left']),
      distance: r.int(1, maxDistance),
    }));
    const end = simulateRoute(size, start.x, start.y, startFacing, segments);
    if (end) return { start, startFacing, segments, end };
  }
  throw new QuestionRetry('Could not fit a rover route inside the grid.');
}

// Step-by-step working for a route, using 1-based (column, row) cells.
function routeTrace(start, startFacing, segments) {
  let { x, y } = start;
  let facing = startFacing;
  const parts = [`Start (${x + 1}, ${y + 1}) facing ${FACING_WORDS[facing]}.`];
  for (const seg of segments) {
    if (seg.turnBefore) facing = turnFacing(facing, seg.turnBefore);
    x += FACING_DELTA[facing][0] * seg.distance;
    y += FACING_DELTA[facing][1] * seg.distance;
    parts.push(`${seg.turnBefore ? `Turn ${seg.turnBefore} to face ${FACING_WORDS[facing]}, move` : 'Move'} ${seg.distance}: (${x + 1}, ${y + 1}).`);
  }
  return parts.join(' ');
}

// Describes a route as one sentence: "move forward 2; then turn right, then move forward 1; ...".
const routeText = segments => segments.map((seg, i) => (i === 0
  ? `moves forward ${seg.distance}`
  : `turns ${seg.turnBefore}, moves forward ${seg.distance}`)).join(', ');

// Counts shortest right/down-only routes across a cols x rows junction grid from (0,0) to (cols,rows),
// optionally with one junction blocked (never the start or the end). Shared by draft() and solve().
function countGridPaths(cols, rows, blocked) {
  const dp = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0));
  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= cols; x++) {
      if (blocked && blocked.x === x && blocked.y === y) continue;
      dp[y][x] = x === 0 && y === 0 ? 1 : (x > 0 ? dp[y][x - 1] : 0) + (y > 0 ? dp[y - 1][x] : 0);
    }
  }
  return dp[rows][cols];
}

// ---------------------------------------------------------------------------
// draft -- one branch per family, grouped by chapter.
// ---------------------------------------------------------------------------
export function draft(family, grade, level, r) {
  if (REASONING_DRAFT[family]) return REASONING_DRAFT[family](family, grade, level, r);
  if (MIXED_DRAFT[family]) {
    const drafted = MIXED_DRAFT[family](family, grade, level, r);
    for (const key of ['prompt', 'hint', 'explanation']) if (typeof drafted[key] === 'string') drafted[key] = tidyStops(drafted[key]);
    return drafted;
  }
  if (REAL3_DRAFT[family]) return REAL3_DRAFT[family](family, grade, level, r);
  const count = choiceCount(grade);

  // ---- numbers ----------------------------------------------------------
  if (family === 'class-5-digit-card-extreme') {
    const n = level === 1 ? 5 : level === 2 ? 6 : 7;
    const cards = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, n);
    const target = r.pick(['greatest', 'smallest']);
    const desc = [...cards].sort((a, b) => b - a);
    const asc = [...cards].sort((a, b) => a - b);
    if (asc[0] === 0) {
      const firstNonZero = asc.findIndex(d => d !== 0);
      [asc[0], asc[firstNonZero]] = [asc[firstNonZero], asc[0]];
    }
    const chosen = target === 'greatest' ? desc : asc;
    const answer = chosen.join('');
    const other = (target === 'greatest' ? asc : desc).join('');
    const givenOrder = cards.join('');
    const swapped = [...chosen];
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    const template = r.pick([
      `These digit cards arrived: ${cards.join(', ')}. Use every card once to make the ${target} ${n}-digit number.`,
      `A loader sorts digit cards ${cards.join(', ')}. Using each card once, what is the ${target} possible number?`,
    ]);
    return {
      family, prompt: template, answer,
      hint: `Line up the cards from the ${target === 'greatest' ? 'biggest' : 'smallest'} digit first, then fill in the rest.`,
      explanation: `Sorted ${target === 'greatest' ? 'from biggest to smallest' : 'from smallest to biggest, keeping a non-zero first digit'}: ${answer}.`,
      proof: { family, givens: { cards, target } },
      visual: { kind: 'v3-class-5-cards', cards, description: `Digit cards in the order they arrived: ${cards.join(', ')}.` },
      choices: answerChoices(answer, [
        wrong(other, 'class-5-extreme-confuse'),
        wrong(givenOrder, 'class-5-compare-digits'),
        wrong(swapped.join(''), 'class-5-compare-digits'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-number-line-round') {
    const unitTable = level === 1 ? [10, 100] : level === 2 ? [1000, 10000] : [10000, 100000];
    const unit = r.pick(unitTable);
    const unitWord = { 10: 'ten', 100: 'hundred', 1000: 'thousand', 10000: 'ten thousand', 100000: 'hundred thousand' }[unit];
    const lower = r.int(1, 90) * unit;
    const value = lower + r.int(1, unit - 1);
    const upper = lower + unit;
    const rounded = Math.round(value / unit) * unit;
    const fmt = numberText;
    const template = r.pick([
      `The arrow marks ${fmt(value)}, which lies between ${fmt(lower)} and ${fmt(upper)}. What is ${fmt(value)} rounded to the nearest ${unitWord}?`,
      `On the number line, ${fmt(value)} sits between ${fmt(lower)} and ${fmt(upper)}. Round ${fmt(value)} to the nearest ${unitWord}.`,
    ]);
    const altUnit = unit === unitTable[0] ? unitTable[1] : unitTable[0];
    const wrongDirection = rounded === lower ? upper : lower;
    const halfway = lower + unit / 2;
    return {
      family, prompt: template, answer: fmt(rounded),
      hint: `Find the halfway mark, ${fmt(halfway)}. A number at or past it rounds up; a number before it rounds down.`,
      explanation: `${fmt(value)} is ${value < halfway ? 'before' : 'past'} the halfway mark ${fmt(halfway)}, so it is closer to ${fmt(rounded)}: ${fmt(value - lower)} past ${fmt(lower)} and ${fmt(upper - value)} before ${fmt(upper)}.`,
      proof: { family, givens: { value, unit } },
      visual: {
        kind: 'v3-class-5-track', min: lower, max: upper, step: unit / 5, pointerAt: value,
        labels: Array.from({ length: 6 }, (_, i) => (i === 0 ? fmt(lower) : i === 5 ? fmt(upper) : null)),
        description: `Number line from ${fmt(lower)} to ${fmt(upper)} with an arrow pointing at ${fmt(value)}.`,
      },
      choices: answerChoices(fmt(rounded), [
        wrong(fmt(wrongDirection), 'class-5-round-direction'),
        wrong(fmt(value), 'missing-step'),
        wrong(fmt(Math.round(value / altUnit) * altUnit), 'scale-interval'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-roman-numeral-mix') {
    if (level === 1) {
      const n = romanFriendlyNumber(r, 4, 489);
      const roman = toRoman(n);
      if (r.pick([true, false])) {
        return {
          family, prompt: `A supply crate is tagged with the Roman numeral ${roman}. What number is this?`, answer: String(n),
          hint: 'Add the symbol values, but a smaller symbol placed before a larger one is subtracted.',
          explanation: `${roman} stands for ${n}.`,
          proof: { family, givens: { n, toNumber: true } },
          choices: answerChoices(String(n), [
            wrong(String(romanMisread(roman)), 'class-5-roman-subtract'),
            wrong(String(n + 1), 'class-5-roman-value'),
            wrong(String(n - 1), 'class-5-roman-value'),
          ], count, null, KNOWN),
        };
      }
      return {
        family, prompt: `Crate number ${n} needs a Roman numeral label. Which numeral is correct?`, answer: roman,
        hint: 'Build it from the biggest value symbols down to the smallest.',
        explanation: `${n} is written ${roman}.`,
        proof: { family, givens: { n, toNumber: false } },
        choices: answerChoices(roman, [
          wrong(toRomanAdditive(n), 'class-5-roman-subtract'),
          wrong(toRoman(n + 1), 'class-5-roman-value'),
          wrong(toRoman(n - 1), 'class-5-roman-value'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const base = romanFriendlyNumber(r, 20, 240);
      const roman = toRoman(base);
      const add = r.pick([true, false]);
      const delta = add ? r.int(5, 60) : r.int(5, Math.min(60, base));
      const result = add ? base + delta : base - delta;
      const template = add
        ? `A convoy carries ${roman} fuel cells. Another ${delta} cells are loaded. How many cells are there now?`
        : `A convoy carries ${roman} fuel cells. ${delta} cells are used on the way. How many cells are left?`;
      return {
        family, prompt: template, answer: String(result),
        hint: 'First read the Roman numeral as a number, then apply the change.',
        explanation: `${roman} is ${base}; ${add ? `${base} + ${delta}` : `${base} - ${delta}`} = ${result}.`,
        proof: { family, givens: { base, delta, add } },
        choices: answerChoices(String(result), [
          wrong(String(base), 'missing-step'),
          wrong(String(add ? base - delta : base + delta), 'wrong-operation'),
          wrong(String(add ? romanMisread(roman) + delta : romanMisread(roman) - delta), 'class-5-roman-subtract'),
        ], count, null, KNOWN),
      };
    }
    const a = romanFriendlyNumber(r, 30, 320);
    const b = romanFriendlyNumber(r, 30, 320);
    const move = r.int(5, Math.min(a, b));
    const romanA = toRoman(a);
    const romanB = toRoman(b);
    const answer = a + move;
    return {
      family,
      prompt: `Sector Alpha has ${romanA} probes and Sector Beta has ${romanB} probes. ${move} probes move from Beta to Alpha. How many are in Alpha now?`,
      answer: String(answer),
      hint: 'Read both numerals as numbers first, then add the amount that moved into Alpha.',
      explanation: `Alpha has ${a}; adding the ${move} probes that moved in gives ${answer}.`,
      proof: { family, givens: { a, move } },
      choices: answerChoices(String(answer), [
        wrong(String(a + b + move), 'class-5-roman-combine'),
        wrong(String(b - move), 'class-5-roman-combine'),
        wrong(String(a - move), 'reversed-operation'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-digit-riddle') {
    const [lo, hi] = level === 1 ? [1000, 9999] : level === 2 ? [100000, 999999] : [1000000, 9999999];
    const d = r.pick([2, 3, 4, 5, 6, 8, 9, 11]);
    const low = Math.ceil(lo / d);
    const high = Math.floor(hi / d);
    const n = d * r.int(low, high);
    const nd = digitsOf(n);
    const placeIndex = r.int(1, nd.length - 2);
    const placeNameFromEnd = PLACE_NAMES[nd.length - 1 - placeIndex];
    const spanA = n - d * r.int(2, 6) - r.int(0, d - 1);
    const spanB = n + d * r.int(2, 6) + r.int(0, d - 1);
    const clues = {
      sum: `digit sum ${digitSum(n)}`,
      parity: n % 2 === 0 ? 'even' : 'odd',
      place: `${placeNameFromEnd} digit ${nd[placeIndex]}`,
      range: `between ${spanA} and ${spanB}`,
    };
    const tests = {
      sum: m => digitSum(m) === digitSum(n),
      parity: m => m % 2 === n % 2,
      place: m => digitsOf(m)[placeIndex] === nd[placeIndex],
      range: () => true,
    };
    const others = r.shuffle(['sum', 'parity', 'place']);
    let picked = null;
    for (let take = Math.min(level, 3); take <= 3 && !picked; take++) {
      const keys = others.slice(0, take);
      let matches = 0;
      for (let m = Math.max(lo, spanA + 1); m < spanB && matches < 2; m++) {
        if (m % d === 0 && keys.every(key => tests[key](m))) matches += 1;
      }
      if (matches === 1) picked = r.shuffle(['range', ...keys]);
    }
    if (!picked) throw new QuestionRetry('digit riddle clues are not unique');
    const text = [`a multiple of ${d}`, ...picked.map(key => clues[key])].join('; ');
    const swapAt = r.int(0, nd.length - 2);
    const swappedDigits = [...nd];
    [swappedDigits[swapAt], swappedDigits[swapAt + 1]] = [swappedDigits[swapAt + 1], swappedDigits[swapAt]];
    const swapped = fromDigits(swappedDigits);
    const reversedFull = Number([...String(n)].reverse().join(''));
    const reversed = String(reversedFull).length === String(n).length ? reversedFull : fromDigits([nd[1], nd[0], ...nd.slice(2)]);
    const nudge = n + r.pick([-1, 1]) * Math.pow(10, r.int(1, Math.min(3, nd.length - 1)));
    return {
      family, prompt: `Clues: ${text}. Which of these numbers fits all the clues?`, answer: String(n),
      hint: 'Check each number against every clue, not only the first one.',
      explanation: `${n} fits every clue: ${text}.`,
      proof: { family, givens: { n } },
      choices: answerChoices(String(n), [
        wrong(String(reversed), 'ignored-condition'),
        wrong(String(swapped), 'ignored-condition'),
        wrong(String(nudge), 'ignored-condition'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-compare-order-grid') {
    const digitsLen = level === 1 ? 5 : 7;
    const low = Math.pow(10, digitsLen - 1);
    const high = Math.pow(10, digitsLen) - 1;
    const numbers = [];
    while (numbers.length < 4) {
      const candidate = r.int(low, high);
      if (!numbers.includes(candidate)) numbers.push(candidate);
    }
    const sorted = [...numbers].sort((a, b) => a - b);
    const fmt = value => numberText(value);
    const list = numbers.map(fmt).join('; ');
    const visual = { kind: 'v3-class-5-number-grid', numbers, description: `Four number cards: ${list}.` };
    if (level === 1) {
      const target = r.pick(['greatest', 'least']);
      const answer = target === 'greatest' ? sorted[3] : sorted[0];
      return {
        family, prompt: `The grid shows ${list}. Which number is the ${target}?`, answer: fmt(answer),
        hint: 'Compare the leftmost digits first; the bigger digit there wins.',
        explanation: `In order: ${sorted.map(fmt).join(' < ')}. So ${fmt(answer)} is the ${target}.`,
        proof: { family, givens: { numbers, mode: 'extreme', target } },
        visual,
        choices: answerChoices(fmt(answer), numbers.filter(value => value !== answer).map(value => wrong(fmt(value), 'class-5-compare-digits')), count, null, KNOWN),
      };
    }
    if (level === 2) {
      const answer = sorted[1];
      return {
        family, prompt: `Put these four numbers in order from least to greatest: ${list}. Which number comes second?`, answer: fmt(answer),
        hint: 'Sort every number first, then count from the least.',
        explanation: `In order: ${sorted.map(fmt).join(' < ')}. The second number is ${fmt(answer)}.`,
        proof: { family, givens: { numbers, mode: 'order' } },
        visual,
        choices: answerChoices(fmt(answer), [sorted[0], sorted[2], sorted[3]].map(value => wrong(fmt(value), 'class-5-order-position')), count, null, KNOWN),
      };
    }
    const [s0, s1, s2, s3] = sorted;
    const trueBank = [`${fmt(s3)} > ${fmt(s0)}`, `${fmt(s0)} < ${fmt(s1)}`, `${fmt(s2)} > ${fmt(s1)}`];
    const falseBank = [`${fmt(s0)} > ${fmt(s3)}`, `${fmt(s3)} < ${fmt(s0)}`, `${fmt(s1)} > ${fmt(s2)}`, `${fmt(s1)} < ${fmt(s0)}`];
    const trueId = r.int(0, trueBank.length - 1);
    const answer = trueBank[trueId];
    const falseChoices = r.shuffle(falseBank).slice(0, 3);
    return {
      family, prompt: `The four cards show ${list}. Which statement is true?`, answer,
      hint: 'Compare only two numbers at a time, using their leftmost different digit.',
      explanation: `In order from least to greatest: ${sorted.map(fmt).join(' < ')}.`,
      proof: { family, givens: { numbers, mode: 'statement', trueId } },
      visual,
      choices: answerChoices(answer, falseChoices.map(value => wrong(value, 'class-5-compare-digits')), count, null, KNOWN),
    };
  }

  if (family === 'class-5-place-value-expand') {
    const len = level === 1 ? 5 : level === 2 ? 6 : 7;
    const digitsArr = [r.int(1, 9), ...Array.from({ length: len - 1 }, () => r.int(0, 9))];
    const n = fromDigits(digitsArr);
    const placeIndexFromRight = r.int(1, len - 2);
    const placeIndex = len - 1 - placeIndexFromRight;
    const placeName = PLACE_NAMES[placeIndexFromRight];
    const digit = digitsArr[placeIndex];
    const places = digitsArr.map((_, i) => PLACE_NAMES[len - 1 - i]);
    const visual = {
      kind: 'v3-class-5-pvchart', digits: digitsArr, highlightIndex: placeIndex, places,
      description: `Place-value chart for ${n}. Columns left to right: ${digitsArr.map((dd, i) => `${places[i]} ${dd}`).join(', ')}.`,
    };
    if (level === 1) {
      return {
        family, prompt: `In the number ${n}, which digit is in the ${placeName} place?`, answer: String(digit),
        hint: 'Count the places starting from the ones digit on the right.',
        explanation: `Counting from the right, the ${placeName} digit of ${n} is ${digit}.`,
        proof: { family, givens: { digits: digitsArr, placeIndexFromRight, ask: 'digit' } },
        visual,
        choices: answerChoices(String(digit), [
          wrong(String(digitsArr[Math.max(0, placeIndex - 1)]), 'class-5-place-column'),
          wrong(String(digitsArr[Math.min(len - 1, placeIndex + 1)]), 'class-5-place-column'),
          wrong(String(digitsArr[0]), 'class-5-place-column'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const placeValue = digit * Math.pow(10, placeIndexFromRight);
      return {
        family, prompt: `In the number ${n}, what value does the digit in the ${placeName} place represent?`, answer: String(placeValue),
        hint: 'Multiply the digit by the value of its place.',
        explanation: `The ${placeName} digit is ${digit}, worth ${digit} x ${Math.pow(10, placeIndexFromRight)} = ${placeValue}.`,
        proof: { family, givens: { digits: digitsArr, placeIndexFromRight, ask: 'value' } },
        visual,
        choices: answerChoices(String(placeValue), [
          wrong(String(digit), 'face-value'),
          wrong(String(digit * Math.pow(10, placeIndexFromRight + 1)), 'class-5-place-column'),
          wrong(String(digit * Math.pow(10, Math.max(0, placeIndexFromRight - 1))), 'class-5-place-column'),
        ], count, null, KNOWN),
      };
    }
    const delta = r.int(1, 9);
    if (digit + delta > 9) throw new QuestionRetry('The digit would carry into the next place.');
    const changed = [...digitsArr];
    changed[placeIndex] = digit + delta;
    const answer = fromDigits(changed);
    return {
      family, prompt: `If the ${placeName} digit of ${n} increased by ${delta}, what would the new number be?`, answer: String(answer),
      hint: 'Only the highlighted place changes; keep every other digit the same.',
      explanation: `Changing the ${placeName} digit from ${digit} to ${digit + delta} adds ${delta * Math.pow(10, placeIndexFromRight)}, giving ${answer}.`,
      proof: { family, givens: { digits: digitsArr, placeIndexFromRight, ask: 'change', delta } },
      visual,
      choices: answerChoices(String(answer), [
        wrong(String(delta), 'missing-step'),
        wrong(String(n - delta * Math.pow(10, placeIndexFromRight)), 'wrong-operation'),
        wrong(String(bumpDigit(digitsArr, Math.max(0, placeIndex - 1), delta)), 'class-5-place-column'),
      ], count, null, KNOWN),
    };
  }

  // ---- operations --------------------------------------------------------
  if (family === 'class-5-bar-model-multistep') {
    if (level === 1) {
      const part = r.int(12, 68) * 100;
      const total = part + r.int(15, 70) * 100;
      const other = total - part;
      const [label, labelOther] = r.shuffle(['food pods', 'fuel pods', 'spare parts', 'water tanks']).slice(0, 2);
      return {
        family, prompt: `A convoy carries ${total} crates in total. ${part} are ${label} and the rest are ${labelOther}. How many are ${labelOther}?`,
        answer: String(other),
        hint: 'Subtract the known part from the whole to find the missing part.',
        explanation: `${total} - ${part} = ${other}.`,
        proof: { family, givens: { total, part } },
        visual: {
          kind: 'v3-class-5-barmodel', parts: [{ label, value: part }, { label: labelOther, value: '?' }], totalLabel: `Total: ${total}`,
          description: `A bar split into two parts: ${label} ${part}, and ${labelOther} unknown. The whole bar totals ${total}.`,
        },
        choices: answerChoices(String(other), [
          wrong(String(total + part), 'wrong-operation'),
          wrong(String(part), 'missing-step'),
          wrong(String(total), 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const partA = r.int(8, 40) * 100;
      const diff = r.int(2, 20) * 100;
      const partB = partA + diff;
      const partC = r.int(5, 30) * 100;
      const total = partA + partB + partC;
      return {
        family,
        prompt: `A mission stores ${total} units across three bays. Bay A has ${partA}. Bay B has ${diff} more than Bay A. Bay C has the rest. How many units are in Bay C?`,
        answer: String(partC),
        hint: 'Work out Bay B first, then subtract both Bay A and Bay B from the total.',
        explanation: `Bay B = ${partA} + ${diff} = ${partB}. Bay C = ${total} - ${partA} - ${partB} = ${partC}.`,
        proof: { family, givens: { total, partA, diff } },
        visual: {
          kind: 'v3-class-5-barmodel', parts: [{ label: 'Bay A', value: partA }, { label: 'Bay B', value: partB }, { label: 'Bay C', value: '?' }], totalLabel: `Total: ${total}`,
          description: `A bar split into three parts: Bay A ${partA}, Bay B ${partB}, Bay C unknown. The whole bar totals ${total}.`,
        },
        choices: answerChoices(String(partC), [
          wrong(String(total - partA), 'missing-step'),
          wrong(String(total - partB), 'missing-step'),
          wrong(String(partC + diff), 'class-5-bar-share-equal'),
        ], count, null, KNOWN),
      };
    }
    const a = r.int(10, 60) * 100;
    const diff = r.int(2, 30) * 100;
    const total = 2 * a + diff;
    return {
      family,
      prompt: `Two convoys carry ${total} units together. Convoy B carries ${diff} more than Convoy A. How many units does Convoy A carry?`,
      answer: String(a),
      hint: 'Remove the extra amount first, then share what is left equally between the two convoys.',
      explanation: `${total} - ${diff} = ${2 * a}; sharing equally gives ${a} for Convoy A.`,
      proof: { family, givens: { total, diff } },
      visual: {
        kind: 'v3-class-5-barmodel', parts: [{ label: 'Convoy A', value: '?' }, { label: 'Convoy B', value: '?' }, { label: 'extra for B', value: diff }], totalLabel: `Together: ${total}`,
        description: `A bar split into three parts: Convoy A (unknown), a matching unknown part for Convoy B, and extra ${diff} units that Convoy B has on top. Together the whole bar totals ${total}.`,
      },
      choices: answerChoices(String(a), [
        wrong(String(total / 2), 'class-5-bar-share-equal'),
        wrong(String(a + diff), 'ignored-condition'),
        wrong(String(total - diff), 'missing-step'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-missing-digit-column') {
    const len = level === 1 ? 3 : level === 2 ? 4 : 5;
    const lowBound = Math.pow(10, len - 1);
    const highBound = Math.pow(10, len) - 1;
    const top = r.int(lowBound, highBound - lowBound);
    const bottom = r.int(lowBound, highBound - top);
    const result = top + bottom;
    const hideIn = r.pick(['top', 'bottom', 'result']);
    const hideIndex = r.int(0, len - 1);
    const source = hideIn === 'top' ? top : hideIn === 'bottom' ? bottom : result;
    const sourceDigits = digitsOf(source);
    const hiddenDigit = sourceDigits[hideIndex];
    const neighbour = sourceDigits[(hideIndex + 1) % len];
    const rowName = hideIn === 'result' ? 'answer' : hideIn === 'top' ? 'top number' : 'bottom number';
    const masked = value => digitsOf(value).map((dd, i) => (i === hideIndex ? '?' : dd)).join('');
    const shown = { top: hideIn === 'top' ? masked(top) : String(top), bottom: hideIn === 'bottom' ? masked(bottom) : String(bottom), result: hideIn === 'result' ? masked(result) : String(result) };
    const working = hideIn === 'result'
      ? `${top} + ${bottom} = ${result}`
      : hideIn === 'top' ? `${result} - ${bottom} = ${top}` : `${result} - ${top} = ${bottom}`;
    return {
      family, prompt: `In this addition, one digit of the ${rowName} is hidden. What is the missing digit?`, answer: String(hiddenDigit),
      hint: hideIn === 'result' ? 'Add the two numbers, then read off the digit that is hidden.' : `Subtract the known number from the answer to rebuild the hidden ${rowName}.`,
      explanation: `${working}, so the missing digit in the ${rowName} is ${hiddenDigit}.`,
      proof: { family, givens: { top, bottom, hideIn, hideIndex } },
      visual: {
        kind: 'v3-class-5-columncalc', top, bottom, result, hideIn, hideIndex,
        description: `A column addition: ${shown.top} plus ${shown.bottom} equals ${shown.result}, where ? is the hidden digit.`,
      },
      choices: answerChoices(String(hiddenDigit), [
        wrong(String((hiddenDigit + 1) % 10), 'missing-step'),
        wrong(String((hiddenDigit + 9) % 10), 'missing-step'),
        wrong(String(neighbour), 'class-5-place-column'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-factor-multiple-sort') {
    if (level === 1) {
      const pool = [24, 36, 40, 48, 54, 60, 72, 84, 90, 96, 108, 120];
      const n = r.pick(pool);
      const divisors = divisorsOf(n).filter(d => d !== 1 && d !== n);
      const answer = r.pick(divisors);
      const nonFactors = [];
      for (let v = 2; v < n; v++) if (n % v !== 0) nonFactors.push(v);
      const picks = r.shuffle(nonFactors);
      return {
        family, prompt: `Which of these numbers is a factor of ${n}?`, answer: String(answer),
        hint: 'A factor divides the number exactly, with no remainder.',
        explanation: `${n} / ${answer} = ${n / answer}, so ${answer} is a factor of ${n}.`,
        proof: { family, givens: { n, answer } },
        choices: answerChoices(String(answer), [
          wrong(String(picks[0]), 'class-5-factor-vs-multiple'),
          wrong(String(n * 2), 'class-5-factor-vs-multiple'),
          wrong(String(picks[1]), 'class-5-factor-vs-multiple'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      let a = 0;
      let b = 0;
      for (let tries = 0; tries < 20; tries++) {
        const g = r.int(2, 9);
        a = g * r.int(3, 11);
        b = g * r.int(3, 11);
        if (a !== b) break;
      }
      const divA = divisorsOf(a);
      const divB = divisorsOf(b);
      const common = divA.filter(d => d !== 1 && divB.includes(d));
      if (!common.length) throw new QuestionRetry('No shared factor beyond 1.');
      const answer = r.pick(common);
      const onlyA = divA.filter(d => d !== 1 && d !== a && !divB.includes(d));
      const onlyB = divB.filter(d => d !== 1 && d !== b && !divA.includes(d));
      if (!onlyA.length || !onlyB.length) throw new QuestionRetry('Not enough distinct factors.');
      return {
        family, prompt: `Which number is a common factor of ${a} and ${b}?`, answer: String(answer),
        hint: 'A common factor must divide both numbers exactly.',
        explanation: `${answer} divides both ${a} (${a} / ${answer} = ${a / answer}) and ${b} (${b} / ${answer} = ${b / answer}).`,
        proof: { family, givens: { a, b, answer } },
        choices: answerChoices(String(answer), [
          wrong(String(r.pick(onlyA)), 'class-5-common-factor'),
          wrong(String(r.pick(onlyB)), 'class-5-common-factor'),
          wrong(String(a * b), 'class-5-factor-vs-multiple'),
        ], count, null, KNOWN),
      };
    }
    let a = 0;
    let b = 0;
    for (let tries = 0; tries < 20; tries++) {
      const g = r.int(3, 9);
      a = g * r.int(2, 8);
      b = g * r.int(2, 8);
      if (a !== b) break;
    }
    const hcf = gcdOf(a, b);
    const lcm = lcmOf(a, b);
    const divA = divisorsOf(a);
    const divB = divisorsOf(b);
    const smallerCommon = divA.filter(d => d !== 1 && d !== hcf && divB.includes(d));
    const wrongCommon = smallerCommon.length ? r.pick(smallerCommon) : 1;
    const minAB = Math.min(a, b);
    const maxAB = Math.max(a, b);
    const selfDistractor = minAB !== hcf ? minAB : maxAB;
    return {
      family, prompt: `What is the highest common factor of ${a} and ${b}?`, answer: String(hcf),
      hint: 'List the factors of both numbers and find the largest one they share.',
      explanation: `The highest factor that ${a} and ${b} share is ${hcf}.`,
      proof: { family, givens: { a, b } },
      choices: answerChoices(String(hcf), [
        wrong(String(lcm), 'class-5-hcf-lcm-confuse'),
        wrong(String(wrongCommon), 'ignored-condition'),
        wrong(String(selfDistractor), 'class-5-common-factor'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-schedule-meet-again') {
    const pools = level === 1 ? [2, 3, 4, 5, 6, 8, 10] : level === 2 ? [3, 4, 5, 6, 8, 9, 10, 12] : [4, 6, 8, 9, 10, 12, 15, 18];
    const ask = r.pick(level === 1 ? ['next', 'next', 'trips'] : level === 2 ? ['next', 'trips', 'times'] : ['next', 'times', 'clock']);
    const a = r.pick(pools);
    let b = r.pick(pools.filter(v => v !== a));
    if (ask !== 'next') for (let tries = 0; tries < 12 && lcmOf(a, b) > 72; tries++) b = r.pick(pools.filter(v => v !== a));
    if (lcmOf(a, b) > 72 && ask !== 'next') throw new QuestionRetry('schedule too long');
    const lcm = lcmOf(a, b);
    const unit = ask === 'clock' || r.int(0, 1) ? 'minutes' : 'hours';
    const [craftA, craftB] = r.shuffle(['probe drone', 'supply shuttle', 'scout ship', 'cargo hauler', 'repair bot', 'relay shuttle']).slice(0, 2);
    const rounds = r.int(2, 4);
    const span = lcm * rounds + r.int(1, lcm - 1);
    const startMinute = r.int(6, 10) * 60 + r.pick([0, 15, 30, 45]);
    const givens = { a, b, ask, span, startMinute };
    const answer = scheduleAnswer(givens);
    const intro = `A ${craftA} docks every ${a} ${unit} and a ${craftB} docks every ${b} ${unit}.`;
    const wrongProduct = a * b === lcm ? a * b + Math.min(a, b) : a * b;
    const biggest = Math.max(a, b);
    const wrongBiggest = biggest === lcm ? biggest + Math.min(a, b) : biggest;
    if (ask === 'trips') {
      return {
        family, prompt: `${intro} Both just docked together. How many times does the ${craftB} dock up to and including their next shared dock?`, answer,
        hint: `First find when they dock together, then divide that time by ${b}.`,
        explanation: `Multiples of ${a} and ${b} first match at ${lcm} ${unit}. The ${craftB} docks every ${b}, so ${lcm} / ${b} = ${answer}.`,
        proof: { family, givens },
        choices: answerChoices(answer, [
          wrong(String(lcm / a), 'factor-multiple'),
          wrong(String(lcm), 'missing-step'),
          wrong(String(lcm / b + 1), 'counted-endpoints'),
        ], count, null, KNOWN),
      };
    }
    if (ask === 'times') {
      const options = [Number(answer) - 1, Number(answer) + 1, Math.floor(span / a), Math.floor(span / b), Number(answer) + 2].filter(v => v >= 0 && String(v) !== answer);
      return {
        family, prompt: `${intro} They dock together at the start. How many more times do they dock together in the next ${span} ${unit}?`, answer,
        hint: 'Find when they first dock together again; they repeat that same gap each time.',
        explanation: `They dock together every ${lcm} ${unit} (the first match of the multiples of ${a} and ${b}). ${span} / ${lcm} = ${answer} full gaps, with ${span - Number(answer) * lcm} ${span - Number(answer) * lcm === 1 ? unit.replace(/s$/, '') : unit} left over.`,
        proof: { family, givens },
        choices: answerChoices(answer, [...new Set(options)].map(v => wrong(String(v), 'remainder-rule')), count, null, KNOWN),
      };
    }
    if (ask === 'clock') {
      const startText = clockText12(startMinute);
      const options = [startMinute + a * b, startMinute + a + b, startMinute + biggest, startMinute + lcm * 2].filter(v => clockText12(v) !== answer);
      return {
        family, prompt: `${intro} Both docked together at ${startText}. At what time will they next dock together?`, answer,
        hint: 'Find the number of minutes until they dock together, then add it to the start time.',
        explanation: `The multiples of ${a} and ${b} first match at ${lcm}, so they next dock together ${lcm} minutes after ${startText}, at ${answer}.`,
        proof: { family, givens },
        choices: answerChoices(answer, [...new Set(options.map(clockText12))].map(v => wrong(v, 'factor-multiple')), count, null, KNOWN),
      };
    }
    return {
      family, prompt: `${intro} Both just docked together. In how many ${unit} will they next dock together?`,
      answer,
      hint: 'Find the smallest number that both return-times divide into exactly.',
      explanation: `Multiples of ${a}: ${Array.from({ length: Math.min(6, lcm / a) }, (_, i) => a * (i + 1)).join(', ')}. Multiples of ${b}: ${Array.from({ length: Math.min(6, lcm / b) }, (_, i) => b * (i + 1)).join(', ')}. They first match at ${lcm}.`,
      proof: { family, givens },
      choices: answerChoices(answer, [
        wrong(String(wrongProduct), 'factor-multiple'),
        wrong(String(a + b), 'wrong-operation'),
        wrong(String(wrongBiggest), 'factor-multiple'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-equal-share-remainder') {
    const groups = r.int(3, 9);
    const quotient = level === 1 ? r.int(8, 40) : level === 2 ? r.int(15, 80) : r.int(20, 120);
    const remainder = r.int(1, groups - 1);
    const total = groups * quotient + remainder;
    const ctxIndex = r.int(0, SHARE_CONTEXTS.length - 1);
    const { item, holder, packs } = SHARE_CONTEXTS[ctxIndex];
    const ask = r.pick(level === 1 ? ['remainder', 'packs'] : level === 2 ? ['quotient', 'packsFull', 'extra'] : ['needed', 'remove', 'extra']);
    const visual = { kind: 'v3-class-5-share', total, groups, description: `${total} items are shared evenly among ${groups} groups, one item at a time.` };
    const give = `${total} ${item} are shared among ${groups} ${holder}, and every one of them must get the same number.`;
    const sets = {
      remainder: {
        prompt: `${give} As many as possible are given out. How many ${item} are left over?`, answer: remainder,
        hint: 'Share one at a time until there are not enough left for another full round.',
        explanation: `${total} = ${groups} x ${quotient} + ${remainder}, so ${remainder} ${noun(remainder, 'is', 'are')} left over.`,
        wrongs: [[groups - remainder, 'remainder-rule'], [quotient, 'remainder-rule'], [groups, 'remainder-rule']],
      },
      packs: {
        prompt: `${total} ${item} are packed into ${packs} of ${groups}. How many ${item} are left over after all the full ${packs} are packed?`, answer: remainder,
        hint: `Divide by ${groups}; the remainder is what is left over.`,
        explanation: `${total} / ${groups} = ${quotient} remainder ${remainder}, so ${remainder} ${noun(remainder, 'is', 'are')} left over.`,
        wrongs: [[quotient, 'remainder-rule'], [groups - remainder, 'remainder-rule'], [remainder + 1, 'remainder-rule']],
      },
      quotient: {
        prompt: `${give} How many ${item} does each of them get, with as few left over as possible?`, answer: quotient,
        hint: 'Divide the total by the number of groups and ignore the remainder.',
        explanation: `${total} / ${groups} = ${quotient} remainder ${remainder}, so each gets ${quotient}.`,
        wrongs: [[quotient + 1, 'remainder-rule'], [remainder, 'remainder-rule'], [total, 'missing-step']],
      },
      packsFull: {
        prompt: `${total} ${item} are packed into ${packs} of ${groups}. How many full ${packs} can be made?`, answer: quotient,
        hint: `Divide by ${groups} and ignore the remainder, because a part-filled ${packs.replace(/s$/, '')} is not full.`,
        explanation: `${total} / ${groups} = ${quotient} remainder ${remainder}, so ${quotient} full ${packs} can be made.`,
        wrongs: [[quotient + 1, 'remainder-rule'], [remainder, 'remainder-rule'], [Math.round(total / (groups + 1)), 'missing-step']],
      },
      extra: {
        prompt: `${give} How many more ${item} are needed so that each of them can get ${quotient + 1}?`, answer: groups * (quotient + 1) - total,
        hint: `Find how many ${item} are needed in all, then subtract the ${total} already there.`,
        explanation: `${groups} x ${quotient + 1} = ${groups * (quotient + 1)} are needed; ${groups * (quotient + 1)} - ${total} = ${groups * (quotient + 1) - total} more.`,
        wrongs: [[remainder, 'remainder-rule'], [groups, 'missing-step'], [quotient + 1, 'wrong-operation']],
      },
      needed: {
        prompt: `${total} ${item} are shared equally among ${groups} ${holder}, with some left over. How many more ${item} would be needed to share them with none left over?`, answer: groups - remainder,
        hint: 'Find the remainder first, then work out how many more are needed to fill one more full round.',
        explanation: `${total} leaves a remainder of ${remainder} when shared among ${groups}, so ${groups} - ${remainder} = ${groups - remainder} more are needed.`,
        wrongs: [[remainder, 'remainder-rule'], [groups, 'missing-step'], [groups + remainder, 'ignored-condition']],
      },
      remove: {
        prompt: `${total} ${item} are shared among ${groups} ${holder}. What is the fewest ${item} that must be taken away so the rest can be shared equally?`, answer: remainder,
        hint: 'Divide by the number of groups; the remainder is what must be taken away.',
        explanation: `${total} = ${groups} x ${quotient} + ${remainder}, so taking away ${remainder} leaves ${groups * quotient}, which shares equally.`,
        wrongs: [[groups - remainder, 'remainder-rule'], [quotient, 'remainder-rule'], [groups, 'missing-step']],
      },
    }[ask];
    return {
      family, prompt: sets.prompt, answer: String(sets.answer),
      hint: sets.hint, explanation: sets.explanation,
      proof: { family, givens: { total, groups, ask } },
      ...(ask === 'packs' || ask === 'packsFull' ? {} : { visual }),
      choices: answerChoices(String(sets.answer), sets.wrongs.map(([value, code]) => wrong(String(value), code)), count, null, KNOWN),
    };
  }

  if (family === 'class-5-symbol-equation-chain') {
    const shapePool = ['circle', 'triangle', 'square', 'star', 'pentagon', 'hexagon'];
    const line = parts => parts.map(([n, shape]) => (n === 1 ? `one ${shape}` : `${n} ${shape}s`)).join(' and ');
    const lineShapes = parts => parts.flatMap(([n, shape]) => Array(n).fill(shape));
    const lineText = (parts, total) => `${line(parts)} ${parts.length === 1 && parts[0][0] === 1 ? 'is' : 'total'} ${total}`;
    if (level === 1) {
      const [shape, shapeB] = r.shuffle(shapePool).slice(0, 2);
      if (r.int(0, 1) === 0) {
        const copies = r.int(2, 5);
        const value = r.int(3, 9);
        const sum = copies * value;
        const parts = [[copies, shape]];
        return {
          family, prompt: `In the picture, ${line(parts)} add up to ${sum}. What is the value of one ${shape}?`,
          answer: String(value),
          hint: 'Divide the total by how many identical shapes there are.',
          explanation: `${sum} / ${copies} = ${value}.`,
          proof: { family, givens: { kind: 'single', copies, sum } },
          visual: {
            kind: 'v3-class-5-symboleq', lines: [{ shapes: lineShapes(parts), total: sum }],
            description: `${lineText(parts, sum)}.`.replace(/^./, c => c.toUpperCase()),
          },
          choices: answerChoices(String(value), [
            wrong(String(sum), 'missing-step'),
            wrong(String(value + 1), 'wrong-operation'),
            wrong(String(copies), 'wrong-operation'),
          ], count, null, KNOWN),
        };
      }
      const copies = r.int(2, 4);
      const value = r.int(2, 9);
      const valueB = r.int(2, 9);
      const sum = copies * value + valueB;
      const parts = [[copies, shape], [1, shapeB]];
      return {
        family, prompt: `Line 1: ${lineText(parts, sum)}. Line 2: one ${shapeB} is ${valueB}. What is the value of one ${shape}?`,
        answer: String(value),
        hint: `Take the value of the ${shapeB} away from line 1, then share what is left between the ${shape}s.`,
        explanation: `${sum} - ${valueB} = ${sum - valueB}, and ${sum - valueB} / ${copies} = ${value}.`,
        proof: { family, givens: { kind: 'given', copies, sum, valueB } },
        visual: {
          kind: 'v3-class-5-symboleq',
          lines: [{ shapes: lineShapes(parts), total: sum }, { shapes: [shapeB], total: valueB }],
          description: `Line 1: ${lineText(parts, sum)}. Line 2: one ${shapeB} is ${valueB}.`,
        },
        choices: answerChoices(String(value), [
          wrong(String(sum - valueB), 'missing-step'),
          wrong(String(Math.round(sum / copies)), 'wrong-operation'),
          wrong(String(value + valueB), 'ignored-condition'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const [shapeA, shapeB] = r.shuffle(shapePool).slice(0, 2);
      const copiesA = r.int(2, 4);
      const valueA = r.int(3, 9);
      const sumA = copiesA * valueA;
      const copiesB = r.int(1, 3);
      const valueB = r.int(2, 12);
      const sum2 = copiesB * valueA + valueB;
      const parts1 = [[copiesA, shapeA]];
      const parts2 = [[copiesB, shapeA], [1, shapeB]];
      return {
        family, prompt: `Line 1: ${lineText(parts1, sumA)}. Line 2: ${lineText(parts2, sum2)}. What is the value of one ${shapeB}?`,
        answer: String(valueB),
        hint: `First find the value of one ${shapeA}, then use line 2 to find the ${shapeB}.`,
        explanation: `One ${shapeA} = ${sumA} / ${copiesA} = ${valueA}. So the ${shapeB} = ${sum2} - ${copiesB} x ${valueA} = ${valueB}.`,
        proof: { family, givens: { kind: 'chain', copiesA, sumA, copiesB, sum2 } },
        visual: {
          kind: 'v3-class-5-symboleq',
          lines: [{ shapes: lineShapes(parts1), total: sumA }, { shapes: lineShapes(parts2), total: sum2 }],
          description: `Line 1: ${lineText(parts1, sumA)}. Line 2: ${lineText(parts2, sum2)}.`,
        },
        choices: answerChoices(String(valueB), [
          wrong(String(valueA), 'ignored-condition'),
          wrong(String(sum2), 'missing-step'),
          wrong(String(Math.abs(sum2 - sumA)), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    const variant = r.pick(['extra', 'swap', 'triple']);
    if (variant === 'triple') {
      const [shapeA, shapeB, shapeC] = r.shuffle(shapePool).slice(0, 3);
      const vA = r.int(2, 9);
      const vB = r.int(2, 9);
      const vC = r.int(2, 9);
      const lines = [[[1, shapeA], [1, shapeB]], [[1, shapeB], [1, shapeC]], [[1, shapeA], [1, shapeC]]];
      const totals = [vA + vB, vB + vC, vA + vC];
      const whole = (totals[0] + totals[1] + totals[2]) / 2;
      return {
        family, prompt: `Line 1: ${lineText(lines[0], totals[0])}. Line 2: ${lineText(lines[1], totals[1])}. Line 3: ${lineText(lines[2], totals[2])}. What is the value of one ${shapeA}?`,
        answer: String(vA),
        hint: 'Add all three lines: every shape then appears twice. Halve the sum to get one of each, then subtract line 2.',
        explanation: `${totals[0]} + ${totals[1]} + ${totals[2]} = ${totals[0] + totals[1] + totals[2]}, so one of each is ${whole}. ${shapeA} = ${whole} - ${totals[1]} = ${vA}.`,
        proof: { family, givens: { kind: 'triple', totals } },
        visual: {
          kind: 'v3-class-5-symboleq',
          lines: lines.map((parts, i) => ({ shapes: lineShapes(parts), total: totals[i] })),
          description: `Line 1: ${lineText(lines[0], totals[0])}. Line 2: ${lineText(lines[1], totals[1])}. Line 3: ${lineText(lines[2], totals[2])}.`,
        },
        choices: answerChoices(String(vA), [
          wrong(String(vB), 'ignored-condition'),
          wrong(String(vC), 'ignored-condition'),
          wrong(String(whole), 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    if (variant === 'swap') {
      const [shapeA, shapeB] = r.shuffle(shapePool).slice(0, 2);
      const vA = r.int(2, 9);
      const vB = r.int(2, 9);
      const s1 = 2 * vA + vB;
      const s2 = vA + 2 * vB;
      const parts1 = [[2, shapeA], [1, shapeB]];
      const parts2 = [[1, shapeA], [2, shapeB]];
      return {
        family, prompt: `Line 1: ${lineText(parts1, s1)}. Line 2: ${lineText(parts2, s2)}. What is the value of one ${shapeA}?`,
        answer: String(vA),
        hint: 'Add both lines: you get 3 of each shape. Divide by 3 to get one of each, then use a line to find the other.',
        explanation: `${s1} + ${s2} = ${s1 + s2}, so one of each is ${(s1 + s2) / 3}. Line 2 has one ${shapeA} and two ${shapeB}s, so ${shapeB} = ${s2} - ${(s1 + s2) / 3} = ${vB}, and ${shapeA} = ${(s1 + s2) / 3} - ${vB} = ${vA}.`,
        proof: { family, givens: { kind: 'swap', s1, s2 } },
        visual: {
          kind: 'v3-class-5-symboleq',
          lines: [{ shapes: lineShapes(parts1), total: s1 }, { shapes: lineShapes(parts2), total: s2 }],
          description: `Line 1: ${lineText(parts1, s1)}. Line 2: ${lineText(parts2, s2)}.`,
        },
        choices: answerChoices(String(vA), [
          wrong(String(vB), 'ignored-condition'),
          wrong(String((s1 + s2) / 3), 'missing-step'),
          wrong(String(s1 - s2), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    const [shapeA, shapeB] = r.shuffle(shapePool).slice(0, 2);
    const valueB = r.int(2, 9);
    const valueA = r.int(3, 10);
    const s1 = valueA + valueB;
    const s2 = valueA + 2 * valueB;
    const parts1 = [[1, shapeA], [1, shapeB]];
    const parts2 = [[1, shapeA], [2, shapeB]];
    return {
      family, prompt: `Line 1: ${lineText(parts1, s1)}. Line 2: ${lineText(parts2, s2)}. What is the value of one ${shapeA}?`,
      answer: String(valueA),
      hint: 'Compare the two lines to find the value of one shape, then use either line for the other.',
      explanation: `Line 2 has one extra ${shapeB}, worth ${s2} - ${s1} = ${valueB}. So ${shapeA} = ${s1} - ${valueB} = ${valueA}.`,
      proof: { family, givens: { kind: 'extra', s1, s2 } },
      visual: {
        kind: 'v3-class-5-symboleq',
        lines: [{ shapes: lineShapes(parts1), total: s1 }, { shapes: lineShapes(parts2), total: s2 }],
        description: `Line 1: ${lineText(parts1, s1)}. Line 2: ${lineText(parts2, s2)}.`,
      },
      choices: answerChoices(String(valueA), [
        wrong(String(valueB), 'ignored-condition'),
        wrong(String(s1), 'missing-step'),
        wrong(String(Math.round(s2 / 3)), 'wrong-operation'),
      ], count, null, KNOWN),
    };
  }

  // ---- fractions ----------------------------------------------------------
  if (family === 'class-5-fraction-bar-equivalent') {
    const den1 = level === 1 ? r.int(2, 8) : level === 2 ? r.int(3, 10) : r.int(4, 12);
    let num1 = r.int(1, den1 - 1);
    while (gcdOf(num1, den1) !== 1) num1 = r.int(1, den1 - 1);
    const visual = {
      kind: 'v3-class-5-fracstrip', strips: [{ total: den1, shaded: num1 }],
      description: `A strip split into ${den1} equal parts with ${num1} shaded.`,
    };
    const ask = r.pick(level === 1 ? ['equivalent', 'missingTop'] : level === 2 ? ['equivalent', 'missingTop', 'missingBottom'] : ['missingTop', 'missingBottom']);
    const k = level === 1 ? r.int(2, 3) : level === 2 ? r.int(2, 4) : r.int(2, 6);
    const newDen = den1 * k;
    const newNum = num1 * k;
    if (ask === 'equivalent') {
      const answer = `${newNum}/${newDen}`;
      const addK = num1 + k;
      const wrongAdd = `${addK === newNum ? addK + 1 : addK}/${den1 + k}`;
      return {
        family, prompt: `The strip shows ${num1}/${den1} shaded. Which fraction is equivalent to it?`, answer,
        hint: 'Multiply both the top and bottom numbers by the same amount.',
        explanation: `${num1}/${den1} = ${num1} x ${k} / ${den1} x ${k} = ${answer}.`,
        proof: { family, givens: { num1, den1, k, ask: 'equivalent' } },
        visual,
        choices: answerChoices(answer, [
          wrong(`${newNum}/${den1}`, 'class-5-equivalent-rule'),
          wrong(`${num1}/${newDen}`, 'class-5-equivalent-rule'),
          wrong(wrongAdd, 'class-5-equivalent-rule'),
        ], count, null, KNOWN),
      };
    }
    if (ask === 'missingBottom') {
      return {
        family, prompt: `${num1}/${den1} = ${newNum}/?. What is the missing bottom number?`, answer: String(newDen),
        hint: 'Work out what the top number was multiplied by, then do the same to the bottom number.',
        explanation: `${newNum} / ${num1} = ${k}, so the bottom number is ${den1} x ${k} = ${newDen}.`,
        proof: { family, givens: { num1, den1, k, ask: 'missingBottom' } },
        visual,
        choices: answerChoices(String(newDen), [
          wrong(String(newNum), 'class-5-equivalent-rule'),
          wrong(String(den1 + k), 'class-5-equivalent-rule'),
          wrong(String(newDen + k), 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    const wrongK = k === newNum ? k + 1 : k;
    return {
      family, prompt: `${num1}/${den1} = ?/${newDen}. What is the missing top number?`, answer: String(newNum),
      hint: 'Work out what the bottom number was multiplied by, then do the same to the top number.',
      explanation: `${newDen} / ${den1} = ${k}, so the top number is ${num1} x ${k} = ${newNum}.`,
      proof: { family, givens: { num1, den1, k, ask: 'missingTop' } },
      visual,
      choices: answerChoices(String(newNum), [
        wrong(String(newDen), 'class-5-equivalent-rule'),
        wrong(String(wrongK), 'class-5-equivalent-rule'),
        wrong(String(newNum + 1), 'missing-step'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-fraction-number-line') {
    if (level === 1) {
      const den = r.int(3, 10);
      const ask = r.pick(['read', 'togo', 'next', 'back']);
      const pointerAt = ask === 'next' ? r.int(1, den - 2) : ask === 'back' ? r.int(2, den - 1) : r.int(1, den - 1);
      const targetAt = fractionLineTarget(ask, pointerAt, den);
      const answer = `${targetAt}/${den}`;
      const prompts = {
        read: `The number line from 0 to 1 is split into ${den} equal parts. What fraction does the arrow point to?`,
        togo: `The arrow points to ${pointerAt}/${den}. What fraction of the line is left between the arrow and 1?`,
        next: `The arrow points to ${pointerAt}/${den}. What fraction is the next mark to the right of the arrow?`,
        back: `The arrow points to ${pointerAt}/${den}. What fraction is the next mark to the left of the arrow?`,
      };
      const hints = {
        read: 'Count how many equal parts the whole line is split into, then count to the arrow from zero.',
        togo: `The whole line is ${den}/${den}. Subtract the arrow's fraction from the whole.`,
        next: 'Marks to the right have a bigger top number; the bottom number stays the same.',
        back: 'Marks to the left have a smaller top number; the bottom number stays the same.',
      };
      const explanations = {
        read: `The line is split into ${den} equal parts; the arrow sits at the ${pointerAt}${ordinal(pointerAt)} mark, so it reads ${answer}.`,
        togo: `The whole line is ${den}/${den}, so ${den}/${den} - ${pointerAt}/${den} = ${answer}.`,
        next: `Each part is 1/${den}, so one mark to the right is ${pointerAt} + 1 = ${targetAt} ${noun(targetAt, 'part', 'parts')} from 0: ${answer}.`,
        back: `Each part is 1/${den}, so one mark to the left is ${pointerAt} - 1 = ${targetAt} ${noun(targetAt, 'part', 'parts')} from 0: ${answer}.`,
      };
      const candidates = [pointerAt, den - pointerAt, pointerAt + 1, pointerAt - 1, den - pointerAt + 1, den - pointerAt - 1]
        .filter(n => n >= 1 && n <= den - 1 && n !== targetAt);
      const options = [...new Set(candidates)].map(n => wrong(`${n}/${den}`, 'scale-interval'));
      options.push(wrong(`${targetAt}/${den + 1}`, 'whole-parts'));
      return {
        family, prompt: prompts[ask], answer,
        hint: hints[ask],
        explanation: explanations[ask],
        proof: { family, givens: { den, units: 1, pointerAt, ask } },
        visual: { kind: 'v3-class-5-fracline', den, units: 1, pointerAt, description: `A number line from 0 to 1 split into ${den} equal parts, with an arrow pointing at one of the marks.` },
        choices: answerChoices(answer, options, count, null, KNOWN),
      };
    }
    if (level === 2) {
      const den = r.int(3, 8);
      let pointerAt = r.int(1, 2 * den - 1);
      while (pointerAt % den === 0) pointerAt = r.int(1, 2 * den - 1);
      const answer = `${pointerAt}/${den}`;
      const offBy1 = pointerAt + 1 <= 2 * den - 1 ? pointerAt + 1 : pointerAt - 1;
      const wrongUnit = pointerAt > den ? pointerAt - den : pointerAt + den;
      return {
        family, prompt: `The number line runs from 0 to 2 and each whole is split into ${den} equal parts. What fraction does the arrow point to?`, answer,
        hint: 'Count every equal part from zero, across both whole units, to reach the arrow.',
        explanation: `Each unit is split into ${den} equal parts; counting from 0 gives ${pointerAt} ${noun(pointerAt, 'part', 'parts')}, so the arrow reads ${answer}.`,
        proof: { family, givens: { den, units: 2, pointerAt } },
        visual: { kind: 'v3-class-5-fracline', den, units: 2, pointerAt, description: `A number line from 0 to 2 split into ${den} equal parts per unit, with an arrow pointing at one of the marks.` },
        choices: answerChoices(answer, [
          wrong(`${offBy1}/${den}`, 'scale-interval'),
          wrong(`${wrongUnit}/${den}`, 'missing-step'),
          wrong(`${pointerAt}/${den + 1}`, 'whole-parts'),
        ], count, null, KNOWN),
      };
    }
    const den0 = r.pick([2, 3, 4, 5]);
    let num0 = r.int(1, den0 - 1);
    while (gcdOf(num0, den0) !== 1) num0 = r.int(1, den0 - 1);
    const m = r.pick([2, 3, 4]);
    const den = den0 * m;
    const pointerAt = num0 * m;
    const answer = `${num0}/${den0}`;
    return {
      family, prompt: `The number line from 0 to 1 is split into ${den} equal parts. The arrow points to a fraction. Write it in its simplest form.`, answer,
      hint: 'Read the fraction from the line first, then divide the top and bottom by their common factor.',
      explanation: `The arrow reads ${pointerAt}/${den}, which simplifies to ${answer}.`,
      proof: { family, givens: { den0, num0, m } },
      visual: { kind: 'v3-class-5-fracline', den, units: 1, pointerAt, description: `A number line from 0 to 1 split into ${den} equal parts, with an arrow pointing at one of the marks.` },
      choices: answerChoices(answer, [
        wrong(`${pointerAt}/${den}`, 'class-5-fraction-simplify'),
        wrong(`${den0}/${num0}`, 'class-5-fraction-simplify'),
        wrong(`${num0}/${den0 + 1}`, 'class-5-fraction-simplify'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-fraction-of-amount') {
    if (level === 1) {
      const den = r.int(3, 6);
      let num = r.int(1, den - 1);
      while (2 * num === den) num = r.int(1, den - 1);
      const N = den * r.int(3, 40);
      const answer = (N * num) / den;
      const complement = N - answer;
      const [holder, thing] = r.pick([['cargo hold', 'crystal cells'], ['supply bay', 'ration packs'], ['hangar', 'probe drones'], ['archive', 'star charts']]);
      return {
        family, prompt: `${wordArticle(holder) === 'an' ? 'An' : 'A'} ${holder} has ${N} ${thing}. ${num}/${den} of them are marked for the mission. How many is that?`, answer: String(answer),
        hint: 'Divide the total by the bottom number, then multiply by the top number.',
        explanation: `${N} / ${den} = ${N / den}; ${N / den} x ${num} = ${answer}.`,
        proof: { family, givens: { N, num, den } },
        choices: answerChoices(String(answer), [
          wrong(String(complement), 'fraction-complement'),
          wrong(String(N / den), 'missing-step'),
          wrong(String(N * num), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const den1 = r.int(2, 5);
      const num1 = r.int(1, den1 - 1);
      const N = den1 * r.int(4, 12);
      const reserved = (N * num1) / den1;
      const divisors = divisorsOf(reserved).filter(d => d !== 1 && d !== 2 && d !== reserved);
      if (!divisors.length) throw new QuestionRetry('No clean second split.');
      const den2 = r.pick(divisors);
      let num2 = r.int(1, den2 - 1);
      while (2 * num2 === den2) num2 = r.int(1, den2 - 1);
      const used = (reserved * num2) / den2;
      return {
        family, prompt: `A fleet has ${N} drones. ${num1}/${den1} of them are reserved for patrol. ${num2}/${den2} of the reserved drones are sent out today. How many are sent out today?`, answer: String(used),
        hint: 'Find the reserved amount first, then take the second fraction of that amount, not of the original total.',
        explanation: `Reserved: ${N} x ${num1}/${den1} = ${reserved}. Sent out: ${reserved} x ${num2}/${den2} = ${used}.`,
        proof: { family, givens: { N, num1, den1, num2, den2 } },
        choices: answerChoices(String(used), [
          wrong(String(reserved), 'missing-step'),
          wrong(String((N * num2) / den1), 'wrong-operation'),
          wrong(String(reserved - used), 'fraction-complement'),
        ], count, null, KNOWN),
      };
    }
    const den = r.int(3, 8);
    const num = r.int(2, den - 1);
    const whole = den * r.int(4, 30);
    const given = (whole * num) / den;
    return {
      family, prompt: `${num}/${den} of a crate of spare parts is ${given} parts. How many parts does a full crate hold?`, answer: String(whole),
      hint: 'Work backwards: find what one part of the fraction is worth, then scale up to the whole.',
      explanation: `${given} / ${num} = ${given / num} (one share); ${given / num} x ${den} = ${whole}.`,
      proof: { family, givens: { given, num, den } },
      choices: answerChoices(String(whole), [
        wrong(String(given + den), 'missing-step'),
        wrong(String(given * den), 'reversed-operation'),
        wrong(String(Math.round((given / den) * num)), 'wrong-operation'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-fraction-left-after') {
    if (level === 1) {
      const den1 = r.int(3, 8);
      let num1 = r.int(1, den1 - 1);
      while (2 * num1 === den1) num1 = r.int(1, den1 - 1);
      const W = den1 * r.int(4, 20);
      const removed = (W * num1) / den1;
      const answer = W - removed;
      const [thing] = r.pick([['ration packs'], ['oxygen tanks'], ['tool kits'], ['data chips']]);
      return {
        family, prompt: `A base starts with ${W} ${thing}. ${num1}/${den1} of them are used on a mission. How many ${thing} remain?`, answer: String(answer),
        hint: 'Find how many were used first, then subtract that from the starting total.',
        explanation: `Used: ${W} x ${num1}/${den1} = ${removed}. Remaining: ${W} - ${removed} = ${answer}.`,
        proof: { family, givens: { W, num1, den1 } },
        choices: answerChoices(String(answer), [
          wrong(String(removed), 'fraction-complement'),
          wrong(String(W), 'missing-step'),
          wrong(String(W * (den1 - num1)), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const den1 = r.int(3, 6);
      const num1 = r.int(1, den1 - 1);
      const W = den1 * r.int(6, 16);
      const remaining1 = (W * (den1 - num1)) / den1;
      const divisors = divisorsOf(remaining1).filter(d => d !== 1 && d !== 2 && d !== remaining1);
      if (!divisors.length) throw new QuestionRetry('No clean second split.');
      const den2 = r.pick(divisors);
      let num2 = r.int(1, den2 - 1);
      while (2 * num2 === den2) num2 = r.int(1, den2 - 1);
      const remaining2 = (remaining1 * (den2 - num2)) / den2;
      return {
        family, prompt: `A base starts with ${W} supply crates. First, ${num1}/${den1} of them are used. Then ${num2}/${den2} of what remains is used. How many crates remain now?`, answer: String(remaining2),
        hint: 'Work out what is left after the first use, then take the second fraction of that new, smaller amount.',
        explanation: `After the first use: ${remaining1} remain. After the second use: ${remaining1} x (${den2}-${num2})/${den2} = ${remaining2}.`,
        proof: { family, givens: { W, den1, num1, den2, num2 } },
        choices: answerChoices(String(remaining2), [
          wrong(String((W * (den2 - num2)) / den2), 'changed-whole'),
          wrong(String(remaining1), 'missing-step'),
          wrong(String((remaining1 * num2) / den2), 'fraction-complement'),
        ], count, null, KNOWN),
      };
    }
    const den1 = r.int(3, 6);
    const num1 = r.int(1, den1 - 1);
    const W = den1 * r.int(8, 20);
    const remaining1 = (W * (den1 - num1)) / den1;
    const F = r.int(1, Math.max(1, Math.floor(remaining1 / 2)));
    const answer = remaining1 - F;
    return {
      family, prompt: `A base starts with ${W} fuel cells. ${num1}/${den1} of them are used, then ${F} more are sent to another outpost. How many fuel cells remain?`, answer: String(answer),
      hint: 'Take away the fraction first, then take away the fixed amount from what is left.',
      explanation: `After the fraction is used: ${remaining1} remain. ${remaining1} - ${F} = ${answer}.`,
      proof: { family, givens: { W, den1, num1, F } },
      choices: answerChoices(String(answer), [
        wrong(String(remaining1), 'missing-step'),
        wrong(String(W - F), 'missing-step'),
        wrong(String(remaining1 + F), 'wrong-operation'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-fraction-compare-order') {
    const buildSet = () => {
      const den = level === 1 ? r.pick([5, 6, 7, 8]) : r.int(3, 9);
      const fracs = [];
      const seen = new Set();
      while (fracs.length < 4) {
        const thisDen = level === 1 ? den : r.int(3, 9);
        const num = r.int(1, thisDen - 1);
        const value = num / thisDen;
        if (seen.has(value)) continue;
        seen.add(value);
        fracs.push({ num, den: thisDen, value, text: `${num}/${thisDen}` });
      }
      return fracs;
    };
    const fracs = buildSet();
    const sorted = [...fracs].sort((a, b) => a.value - b.value);
    const visual = { kind: 'v3-class-5-fracgrid', values: fracs.map(f => f.text), description: `A grid of four fraction tiles: ${fracs.map(f => f.text).join(', ')}.` };
    if (level === 1) {
      const target = r.pick(['greatest', 'least']);
      const answer = (target === 'greatest' ? sorted[3] : sorted[0]).text;
      return {
        family, prompt: `Which fraction is the ${target}: ${fracs.map(f => f.text).join(', ')}?`, answer,
        hint: 'All these fractions share the same bottom number, so just compare the top numbers.',
        explanation: `Comparing the top numbers, the ${target} fraction is ${answer}.`,
        proof: { family, givens: { fracs: fracs.map(f => [f.num, f.den]), target } },
        visual,
        choices: answerChoices(answer, fracs.filter(f => f.text !== answer).map(f => wrong(f.text, 'class-5-extreme-confuse')), count, null, KNOWN),
      };
    }
    if (level === 2) {
      const answer = sorted[1].text;
      return {
        family, prompt: `Order these fractions from least to greatest: ${fracs.map(f => f.text).join(', ')}. Which fraction comes second?`, answer,
        hint: 'Convert or compare each fraction carefully; a bigger bottom number does not always mean a bigger fraction.',
        explanation: `In order from least to greatest: ${sorted.map(f => f.text).join(', ')}. The second one is ${answer}.`,
        proof: { family, givens: { fracs: fracs.map(f => [f.num, f.den]) } },
        visual,
        choices: answerChoices(answer, fracs.filter(f => f.text !== answer).map(f => wrong(f.text, 'fraction-denominator')), count, null, KNOWN),
      };
    }
    const trueId = r.int(0, 2);
    const trueBank = [`${sorted[3].text} > ${sorted[0].text}`, `${sorted[0].text} < ${sorted[1].text}`, `${sorted[2].text} > ${sorted[1].text}`];
    const falseBank = [`${sorted[0].text} > ${sorted[3].text}`, `${sorted[1].text} < ${sorted[0].text}`, `${sorted[1].text} > ${sorted[2].text}`];
    return {
      family, prompt: `Look at these fractions: ${fracs.map(f => f.text).join(', ')}. Which statement is true?`, answer: trueBank[trueId],
      hint: 'Compare each pair of fractions carefully before choosing a statement.',
      explanation: `Ordering them from least to greatest gives ${sorted.map(f => f.text).join(', ')}, which makes "${trueBank[trueId]}" true.`,
      proof: { family, givens: { fracs: fracs.map(f => [f.num, f.den]), trueId } },
      visual,
      choices: answerChoices(trueBank[trueId], falseBank.map(s => wrong(s, 'fraction-denominator')), count, null, KNOWN),
    };
  }

  if (family === 'class-5-mixed-number-picture') {
    const den = level === 3 ? r.int(5, 9) : r.int(3, 8);
    const whole = level === 1 ? r.int(1, 3) : r.int(2, 4);
    const num = r.int(1, den - 1);
    const strips = [...Array(whole).fill(null).map(() => ({ total: den, shaded: den })), { total: den, shaded: num }];
    const visual = { kind: 'v3-class-5-fracstrip', strips, description: `A row of strips, each split into ${den} equal parts: the first ones fully shaded and the last one only partly shaded.` };
    if (level < 3) {
      const answer = `${whole} ${num}/${den}`;
      const total = whole * den + num;
      return {
        family, prompt: `Each strip is split into ${den} equal parts, and ${total} parts are shaded in all. What mixed number is shown by the shaded strips?`, answer,
        hint: 'Count the fully shaded strips first for the whole number, then read the last strip as the fraction part.',
        explanation: `${total} parts is ${whole} full ${noun(whole, 'strip', 'strips')} (${whole} x ${den} = ${whole * den}) and ${total - whole * den} more ${noun(total - whole * den, 'part', 'parts')}, so ${answer}.`,
        proof: { family, givens: { whole, num, den, ask: 'mixed' } },
        visual,
        choices: answerChoices(answer, [
          wrong(`${whole} ${den - num}/${den}`, 'fraction-complement'),
          wrong(`${whole} ${num}/${den - 1}`, 'whole-parts'),
          wrong(`${whole > 1 ? whole - 1 : whole + 1} ${num}/${den}`, 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    const answer = whole * den + num;
    return {
      family, prompt: `The shaded strips show a mixed number. Write it as an improper fraction over ${den}.`, answer: String(answer),
      hint: 'Multiply the whole number by the bottom number, then add the top number of the fraction part.',
      explanation: `${whole} x ${den} + ${num} = ${answer}, so the improper fraction is ${answer}/${den}.`,
      proof: { family, givens: { whole, num, den, ask: 'improper' } },
      visual,
      choices: answerChoices(String(answer), [
        wrong(String(whole + num), 'wrong-operation'),
        wrong(String(whole * den), 'missing-step'),
        wrong(String(num), 'whole-parts'),
      ], count, null, KNOWN),
    };
  }

  // ---- decimals -----------------------------------------------------------
  if (family === 'class-5-decimal-grid-model') {
    if (level === 1) {
      let shaded = r.int(11, 95);
      while (Math.floor(shaded / 10) === shaded % 10) shaded = r.int(11, 95);
      const cells = buildHundredthsGrid(shaded);
      const answer = (shaded / 100).toFixed(2);
      const rowShift = shaded + 10 > 99 ? shaded - 10 : shaded + 10;
      return {
        family, prompt: 'The grid has 100 equal squares. What decimal is shown by the shaded squares?', answer,
        hint: 'Count the shaded squares; each one is one hundredth of the whole grid.',
        explanation: `${shaded} out of 100 squares are shaded, which is ${answer}.`,
        proof: { family, givens: { shaded, ask: 'direct' } },
        visual: { kind: 'v3-class-5-decgrid', cells, description: 'A 10 by 10 grid of 100 equal squares, with some squares shaded from the top left.' },
        choices: answerChoices(answer, [
          wrong((rowShift / 100).toFixed(2), 'missing-step'),
          wrong((Math.min(99, shaded + 1) / 100).toFixed(2), 'class-5-decimal-compare'),
          wrong((shaded / 10).toFixed(2), 'class-5-decimal-place-shift'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const shaded = r.int(5, 95);
      const cells = buildHundredthsGrid(shaded);
      const unshaded = 100 - shaded;
      const answer = (unshaded / 100).toFixed(2);
      return {
        family, prompt: 'The grid has 100 equal squares. What decimal shows the part that is NOT shaded?', answer,
        hint: 'Count the empty squares, not the shaded ones; both groups add up to 100.',
        explanation: `${shaded} squares are shaded, so 100 - ${shaded} = ${unshaded} are empty, which is ${answer}.`,
        proof: { family, givens: { shaded, ask: 'complement' } },
        visual: { kind: 'v3-class-5-decgrid', cells, description: 'A 10 by 10 grid of 100 equal squares, with some squares shaded from the top left.' },
        choices: answerChoices(answer, [
          wrong((shaded / 100).toFixed(2), 'class-5-decimal-complement'),
          wrong((Math.min(99, unshaded + 1) / 100).toFixed(2), 'class-5-decimal-compare'),
          wrong((unshaded / 10).toFixed(2), 'class-5-decimal-place-shift'),
        ], count, null, KNOWN),
      };
    }
    let shaded = r.int(12, 88);
    while (shaded % 10 === 0 || shaded % 10 === 5) shaded = r.int(12, 88);
    const cells = buildHundredthsGrid(shaded);
    const roundedTenth = Math.round(shaded / 10);
    const otherTenth = roundedTenth === Math.ceil(shaded / 10) ? Math.floor(shaded / 10) : Math.ceil(shaded / 10);
    const answer = (roundedTenth / 10).toFixed(1);
    return {
      family, prompt: 'The grid shows a decimal. Rounded to the nearest tenth, what decimal is it?', answer,
      hint: 'Read the exact decimal first, then decide which tenth mark it is closer to.',
      explanation: `${shaded} out of 100 squares is ${(shaded / 100).toFixed(2)}, which rounds to ${answer}.`,
      proof: { family, givens: { shaded, ask: 'round' } },
      visual: { kind: 'v3-class-5-decgrid', cells, description: 'A 10 by 10 grid of 100 equal squares, with some squares shaded from the top left.' },
      choices: answerChoices(answer, [
        wrong((shaded / 100).toFixed(2), 'class-5-decimal-place-shift'),
        wrong((otherTenth / 10).toFixed(1), 'class-5-round-direction'),
        wrong((Math.round(shaded / 100)).toFixed(1), 'class-5-decimal-place-shift'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-decimal-number-line') {
    if (level === 1) {
      const base = r.int(0, 8);
      const index = r.int(1, 9);
      const pointerAt = base + index / 10;
      const answer = pointerAt.toFixed(1);
      const offBy1 = index + 1 <= 9 ? index + 1 : index - 1;
      const wrongEnd = 10 - index;
      return {
        family, prompt: 'What decimal does the arrow point to on the number line?', answer,
        hint: 'Count the small steps from the labelled whole number to the arrow.',
        explanation: `The line runs from ${base} to ${base + 1} in tenths; the arrow is ${index} ${noun(index, 'step', 'steps')} from ${base}, so it reads ${answer}.`,
        proof: { family, givens: { base, index } },
        visual: {
          kind: 'v3-class-5-track', min: base, max: base + 1, step: 0.1,
          labels: [String(base), ...Array(9).fill(null), String(base + 1)], pointerAt,
          description: `A number line from ${base} to ${base + 1} split into tenths, with an arrow pointing at one of the marks.`,
        },
        choices: answerChoices(answer, [
          wrong((base + offBy1 / 10).toFixed(1), 'class-5-decimal-place-shift'),
          wrong((base + wrongEnd / 10).toFixed(1), 'class-5-decimal-compare'),
          wrong((base + 1 + index / 10).toFixed(1), 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const base = r.int(0, 6);
      let index = r.int(1, 19);
      while (index % 10 === 0) index = r.int(1, 19);
      const pointerAt = base + index / 10;
      const answer = pointerAt.toFixed(1);
      const offBy1 = index + 1 <= 19 ? index + 1 : index - 1;
      const wrongEnd = 20 - index;
      return {
        family, prompt: `The number line runs from ${base} to ${base + 2}. What decimal does the arrow point to?`, answer,
        hint: 'Count every tenth from the start of the line, across both whole units, to reach the arrow.',
        explanation: `Each unit is split into tenths; counting ${index} ${noun(index, 'tenth', 'tenths')} from ${base} gives ${answer}.`,
        proof: { family, givens: { base, index } },
        visual: {
          kind: 'v3-class-5-track', min: base, max: base + 2, step: 0.1,
          labels: [String(base), ...Array(9).fill(null), String(base + 1), ...Array(9).fill(null), String(base + 2)], pointerAt,
          description: `A number line from ${base} to ${base + 2} split into tenths, with an arrow pointing at one of the marks.`,
        },
        choices: answerChoices(answer, [
          wrong((base + offBy1 / 10).toFixed(1), 'class-5-decimal-place-shift'),
          wrong((base + wrongEnd / 10).toFixed(1), 'class-5-decimal-compare'),
          wrong((base + 1 + index / 10).toFixed(1), 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    const baseTenths = r.int(0, 69);
    const index = r.int(1, 9);
    const pointerAt = (baseTenths * 10 + index) / 100;
    const answer = pointerAt.toFixed(2);
    const lowLabel = (baseTenths / 10).toFixed(1);
    const highLabel = ((baseTenths + 1) / 10).toFixed(1);
    const offBy1 = index + 1 <= 9 ? index + 1 : index - 1;
    const wrongEnd = 10 - index;
    return {
      family, prompt: `The number line runs from ${lowLabel} to ${highLabel}. What decimal does the arrow point to?`, answer,
      hint: 'This line is split into hundredths; count the small steps from the left label to the arrow.',
      explanation: `The gap from ${lowLabel} to ${highLabel} is split into 10 equal hundredths; the arrow is ${index} ${noun(index, 'step', 'steps')} from ${lowLabel}, so it reads ${answer}.`,
      proof: { family, givens: { baseTenths, index } },
      visual: {
        kind: 'v3-class-5-track', min: baseTenths / 10, max: (baseTenths + 1) / 10, step: 0.01,
        labels: [lowLabel, ...Array(9).fill(null), highLabel], pointerAt,
        description: `A number line from ${lowLabel} to ${highLabel} split into hundredths, with an arrow pointing at one of the marks.`,
      },
      choices: answerChoices(answer, [
        wrong(((baseTenths * 10 + offBy1) / 100).toFixed(2), 'class-5-decimal-place-shift'),
        wrong(((baseTenths * 10 + wrongEnd) / 100).toFixed(2), 'class-5-decimal-compare'),
        wrong((((baseTenths + 1) * 10 + index) / 100).toFixed(2), 'missing-step'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-decimal-place-value') {
    if (level === 1) {
      const wholeDigits = [r.int(1, 9)];
      const fracDigits = [r.int(0, 9), r.int(1, 9)];
      const n = `${wholeDigits[0]}.${fracDigits[0]}${fracDigits[1]}`;
      const highlightIndex = r.int(0, 1);
      const placeName = DECIMAL_PLACE_NAMES[highlightIndex];
      const digit = fracDigits[highlightIndex];
      const visual = {
        kind: 'v3-class-5-decchart', wholeDigits, fracDigits, highlightSide: 'frac', highlightIndex,
        description: `Decimal place-value chart for ${n}, with the ${placeName} column highlighted.`,
      };
      return {
        family, prompt: `In the number ${n}, which digit is in the ${placeName} place?`, answer: String(digit),
        hint: 'Count the places after the decimal point: tenths first, then hundredths.',
        explanation: `In ${n}, the ${placeName} digit is ${digit}.`,
        proof: { family, givens: { wholeDigits, fracDigits, highlightSide: 'frac', highlightIndex, ask: 'digit' } },
        visual,
        choices: answerChoices(String(digit), [
          wrong(String(fracDigits[1 - highlightIndex]), 'class-5-decimal-place-shift'),
          wrong(String(wholeDigits[0]), 'face-value'),
          wrong(String((digit + 1) % 10), 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const wholeDigits = [r.int(1, 9), r.int(0, 9)];
      const fracDigits = [r.int(0, 9), r.int(1, 9)];
      const n = `${wholeDigits[0]}${wholeDigits[1]}.${fracDigits[0]}${fracDigits[1]}`;
      const side = r.pick(['whole', 'frac']);
      const highlightIndex = r.int(0, 1);
      const digit = side === 'whole' ? wholeDigits[highlightIndex] : fracDigits[highlightIndex];
      const placeName = side === 'whole' ? PLACE_NAMES[1 - highlightIndex] : DECIMAL_PLACE_NAMES[highlightIndex];
      const placeValue = side === 'whole' ? Math.pow(10, 1 - highlightIndex) : (highlightIndex === 0 ? 0.1 : 0.01);
      const value = digit * placeValue;
      const answer = side === 'whole' ? String(value) : value.toFixed(2);
      const visual = {
        kind: 'v3-class-5-decchart', wholeDigits, fracDigits, highlightSide: side, highlightIndex,
        description: `Decimal place-value chart for ${n}, with the ${placeName} column highlighted.`,
      };
      return {
        family, prompt: `In the number ${n}, what value does the digit in the ${placeName} place represent?`, answer,
        hint: 'Multiply the digit by the value of its own place.',
        explanation: `The ${placeName} digit is ${digit}, worth ${digit} x ${placeValue} = ${answer}.`,
        proof: { family, givens: { wholeDigits, fracDigits, highlightSide: side, highlightIndex, ask: 'value' } },
        visual,
        choices: answerChoices(answer, [
          wrong(String(digit), 'face-value'),
          wrong(side === 'whole' ? String(value * 10) : (value * 10).toFixed(2), 'class-5-decimal-place-shift'),
          wrong(side === 'whole' ? String(Math.round(value / 10)) : (value / 10).toFixed(3), 'class-5-decimal-place-shift'),
        ], count, null, KNOWN),
      };
    }
    const wholeDigits = [r.int(1, 9), r.int(0, 9)];
    const fracDigits = [r.int(0, 9), r.int(1, 8)];
    const side = r.pick(['whole', 'frac']);
    const highlightIndex = r.int(0, 1);
    const digits = side === 'whole' ? wholeDigits : fracDigits;
    if (digits[highlightIndex] === 9) digits[highlightIndex] = 8;
    const digit = digits[highlightIndex];
    const delta = r.int(1, 9 - digit);
    const placeName = side === 'whole' ? PLACE_NAMES[1 - highlightIndex] : DECIMAL_PLACE_NAMES[highlightIndex];
    const n = `${wholeDigits[0]}${wholeDigits[1]}.${fracDigits[0]}${fracDigits[1]}`;
    const changedDigits = [...digits];
    changedDigits[highlightIndex] = digit + delta;
    const answer = side === 'whole'
      ? `${changedDigits[0]}${changedDigits[1]}.${fracDigits[0]}${fracDigits[1]}`
      : `${wholeDigits[0]}${wholeDigits[1]}.${changedDigits[0]}${changedDigits[1]}`;
    const neighborIndex = 1 - highlightIndex;
    const neighborDigits = [...digits];
    neighborDigits[neighborIndex] = neighborDigits[neighborIndex] + delta > 9 ? 9 : neighborDigits[neighborIndex] + delta;
    const wrongNeighbor = side === 'whole'
      ? `${neighborDigits[0]}${neighborDigits[1]}.${fracDigits[0]}${fracDigits[1]}`
      : `${wholeDigits[0]}${wholeDigits[1]}.${neighborDigits[0]}${neighborDigits[1]}`;
    const visual = {
      kind: 'v3-class-5-decchart', wholeDigits, fracDigits, highlightSide: side, highlightIndex,
      description: `Decimal place-value chart for ${n}, with the ${placeName} column highlighted.`,
    };
    return {
      family, prompt: `If the ${placeName} digit of ${n} increased by ${delta}, what would the new number be?`, answer,
      hint: 'Only the highlighted digit changes; keep every other digit the same.',
      explanation: `Changing the ${placeName} digit from ${digit} to ${digit + delta} gives ${answer}.`,
      proof: { family, givens: { wholeDigits, fracDigits, highlightSide: side, highlightIndex, ask: 'change', delta } },
      visual,
      choices: answerChoices(answer, [
        wrong(String(delta), 'missing-step'),
        wrong(n, 'missing-step'),
        wrong(wrongNeighbor, 'class-5-decimal-place-shift'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-decimal-money-measure') {
    if (level === 1) {
      const aPaise = r.int(105, 2995);
      const bPaise = r.int(105, 2995);
      const totalPaise = aPaise + bPaise;
      const answer = fmtRs(totalPaise);
      const items = r.pick([['fuel cell', 'coolant pack'], ['oxygen tank', 'repair kit'], ['solar panel', 'heat shield'], ['data chip', 'signal booster']]);
      return {
        family, prompt: `${wordArticle(items[0]) === 'an' ? 'An' : 'A'} ${items[0]} costs ${fmtRs(aPaise)} and ${wordArticle(items[1])} ${items[1]} costs ${fmtRs(bPaise)}. What is the total cost?`, answer,
        hint: 'Line up the rupees and the paise, then add each column.',
        explanation: `${fmtRs(aPaise)} + ${fmtRs(bPaise)} = ${answer}.`,
        proof: { family, givens: { aPaise, bPaise, ask: 'total' } },
        visual: { kind: 'v3-class-5-barmodel', parts: [{ label: items[0], value: fmtRs(aPaise) }, { label: items[1], value: fmtRs(bPaise) }], totalLabel: 'Total cost?', description: `A bar split into two parts: ${items[0]} at ${fmtRs(aPaise)} and ${items[1]} at ${fmtRs(bPaise)}.` },
        choices: answerChoices(answer, [
          wrong(fmtRs(Math.abs(aPaise - bPaise)), 'wrong-operation'),
          wrong(fmtRs(totalPaise + 100), 'missing-step'),
          wrong(fmtRs(aPaise), 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const budgetPaise = r.int(1500, 4995);
      const spentPaise = r.int(500, budgetPaise - 200);
      const leftPaise = budgetPaise - spentPaise;
      const answer = fmtRs(leftPaise);
      const item = r.pick(['a star map', 'a thruster part', 'a navigation chip', 'a cargo net']);
      return {
        family, prompt: `The crew has a budget of ${fmtRs(budgetPaise)}. They spend ${fmtRs(spentPaise)} on ${item}. How much of the budget is left?`, answer,
        hint: 'Subtract the amount spent from the whole budget.',
        explanation: `${fmtRs(budgetPaise)} - ${fmtRs(spentPaise)} = ${answer}.`,
        proof: { family, givens: { budgetPaise, spentPaise, ask: 'left' } },
        visual: { kind: 'v3-class-5-barmodel', parts: [{ label: 'Spent', value: fmtRs(spentPaise) }, { label: 'Left', value: '?' }], totalLabel: `Budget: ${fmtRs(budgetPaise)}`, description: `A bar for the budget ${fmtRs(budgetPaise)}, split into a spent part of ${fmtRs(spentPaise)} and an unknown left part.` },
        choices: answerChoices(answer, [
          wrong(fmtRs(budgetPaise + spentPaise), 'wrong-operation'),
          wrong(fmtRs(spentPaise), 'missing-step'),
          wrong(fmtRs(Math.abs(leftPaise - 100)), 'class-5-decimal-compare'),
        ], count, null, KNOWN),
      };
    }
    const unitPaise = r.int(300, 999);
    const packs = r.int(2, 5);
    const subtotalPaise = unitPaise * packs;
    const discountPaise = r.int(50, 300);
    const finalPaise = subtotalPaise - discountPaise;
    const answer = fmtRs(finalPaise);
    const item = r.pick(['ration packs', 'fuel canisters', 'signal flares', 'repair kits']);
    return {
      family, prompt: `${packs} ${item} cost ${fmtRs(unitPaise)} each. The crew gets a ${fmtRs(discountPaise)} discount on the whole order. What is the final cost?`, answer,
      hint: 'Multiply the unit price by how many are bought, then subtract the discount.',
      explanation: `${packs} x ${fmtRs(unitPaise)} = ${fmtRs(subtotalPaise)}; ${fmtRs(subtotalPaise)} - ${fmtRs(discountPaise)} = ${answer}.`,
      proof: { family, givens: { unitPaise, packs, discountPaise, ask: 'bundle' } },
      visual: { kind: 'v3-class-5-barmodel', parts: [{ label: `${packs} x ${item}`, value: fmtRs(subtotalPaise) }, { label: 'Discount', value: `-${fmtRs(discountPaise)}` }], totalLabel: 'Final cost?', description: `A bar showing the order subtotal ${fmtRs(subtotalPaise)} and a discount of ${fmtRs(discountPaise)}.` },
      choices: answerChoices(answer, [
        wrong(fmtRs(subtotalPaise), 'missing-step'),
        wrong(fmtRs(subtotalPaise + discountPaise), 'wrong-operation'),
        wrong(fmtRs(Math.max(0, subtotalPaise - discountPaise * packs)), 'class-5-decimal-compare'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-decimal-compare-order') {
    const values = [];
    while (values.length < 4) {
      const candidate = r.int(100, 995);
      if (!values.includes(candidate)) values.push(candidate);
    }
    const sorted = [...values].sort((a, b) => a - b);
    const list = values.map(fmtDecimal).join(', ');
    const visual = { kind: 'v3-class-5-cards', cards: values.map(fmtDecimal), description: `Four decimal cards: ${list}.` };
    if (level === 1) {
      const target = r.pick(['greatest', 'least']);
      const extreme = target === 'greatest' ? sorted[3] : sorted[0];
      const answer = fmtDecimal(extreme);
      return {
        family, prompt: `These decimal readings: ${list}. Which one is the ${target}?`, answer,
        hint: 'Line up the decimal points, then compare the whole-number part first.',
        explanation: `${answer} is the ${target} of the four readings.`,
        proof: { family, givens: { values, mode: 'extreme', target } },
        visual,
        choices: answerChoices(answer, values.filter(value => value !== extreme).map(value => wrong(fmtDecimal(value), 'class-5-decimal-compare')), count, null, KNOWN),
      };
    }
    if (level === 2) {
      const answer = fmtDecimal(sorted[1]);
      return {
        family, prompt: `Order these four decimal readings from least to greatest: ${list}. Which reading comes second?`, answer,
        hint: 'Sort every reading first, then count from the least.',
        explanation: `In order: ${sorted.map(fmtDecimal).join(', ')}. The second reading is ${answer}.`,
        proof: { family, givens: { values, mode: 'order' } },
        visual,
        choices: answerChoices(answer, [sorted[0], sorted[2], sorted[3]].map(value => wrong(fmtDecimal(value), 'class-5-decimal-compare')), count, null, KNOWN),
      };
    }
    const [s0, s1, s2, s3] = sorted;
    const trueBank = [`${fmtDecimal(s3)} > ${fmtDecimal(s0)}`, `${fmtDecimal(s0)} < ${fmtDecimal(s1)}`, `${fmtDecimal(s2)} > ${fmtDecimal(s1)}`];
    const falseBank = [`${fmtDecimal(s0)} > ${fmtDecimal(s3)}`, `${fmtDecimal(s3)} < ${fmtDecimal(s0)}`, `${fmtDecimal(s1)} > ${fmtDecimal(s2)}`, `${fmtDecimal(s1)} < ${fmtDecimal(s0)}`];
    const trueId = r.int(0, trueBank.length - 1);
    const answer = trueBank[trueId];
    const falseChoices = r.shuffle(falseBank).slice(0, 3);
    return {
      family, prompt: `These four decimal readings: ${list}. Which statement is true?`, answer,
      hint: 'Compare only two readings at a time after lining up their decimal points.',
      explanation: `In order from least to greatest: ${sorted.map(fmtDecimal).join(', ')}.`,
      proof: { family, givens: { values, mode: 'statement', trueId } },
      visual,
      choices: answerChoices(answer, falseChoices.map(value => wrong(value, 'class-5-decimal-compare')), count, null, KNOWN),
    };
  }

  if (family === 'class-5-decimal-fraction-link') {
    const NICE_DENS = [2, 4, 5, 10, 20, 25, 50, 100];
    if (level === 1) {
      const den = r.pick(NICE_DENS);
      const num = r.int(1, den - 1);
      const hundredths = Math.round((num * 100) / den);
      const answer = fmtDecimal(hundredths);
      const cells = buildHundredthsGrid(hundredths);
      return {
        family, prompt: `The grid shows ${num}/${den} shaded. Which decimal equals that fraction?`, answer,
        hint: 'Count the shaded squares out of 100, then write that as a decimal.',
        explanation: `${num}/${den} is the same as ${hundredths}/100, which is ${answer}.`,
        proof: { family, givens: { num, den, ask: 'toDecimal' } },
        visual: { kind: 'v3-class-5-decgrid', cells, description: `A 10 by 10 grid of 100 equal squares, with ${num}/${den} of them shaded from the top left.` },
        choices: answerChoices(answer, [
          wrong(fmtDecimal(100 - hundredths), 'class-5-decimal-complement'),
          wrong(fmtDecimal(Math.min(99, Math.max(1, hundredths + 10))), 'class-5-decimal-compare'),
          wrong(`${num}.${den}`, 'class-5-decimal-fraction-rule'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const hundredths = r.int(5, 95);
      const g = gcdOf(hundredths, 100);
      const simpleNum = hundredths / g;
      const simpleDen = 100 / g;
      const answer = `${simpleNum}/${simpleDen}`;
      const cells = buildHundredthsGrid(hundredths);
      return {
        family, prompt: `The grid shows the decimal ${fmtDecimal(hundredths)}. Write it as a fraction in its simplest form.`, answer,
        hint: 'Write the decimal over 100 first, then divide the top and bottom by their common factor.',
        explanation: `${fmtDecimal(hundredths)} is ${hundredths}/100, which simplifies to ${answer}.`,
        proof: { family, givens: { hundredths, ask: 'toFraction' } },
        visual: { kind: 'v3-class-5-decgrid', cells, description: `A 10 by 10 grid with ${hundredths} of the 100 squares shaded.` },
        choices: answerChoices(answer, [
          wrong(`${hundredths}/100`, 'class-5-decimal-fraction-rule'),
          wrong(`${simpleDen}/${simpleNum}`, 'class-5-decimal-fraction-rule'),
          wrong(`${hundredths}/10`, 'class-5-decimal-fraction-rule'),
        ], count, null, KNOWN),
      };
    }
    const den = r.pick(NICE_DENS);
    const num = r.int(1, den - 1);
    const finHundredths = Math.round((num * 100) / den);
    let panelHundredths = r.int(5, 95);
    while (panelHundredths === finHundredths) panelHundredths = r.int(5, 95);
    const diff = Math.abs(finHundredths - panelHundredths);
    const answer = fmtDecimal(diff);
    return {
      family, prompt: `A rocket fin is ${num}/${den} of a metre long. A sensor panel is ${fmtDecimal(panelHundredths)} m long. What is the difference between their lengths?`, answer,
      hint: 'Change the fraction to a decimal first, then subtract the smaller length from the greater one.',
      explanation: `${num}/${den} m is ${fmtDecimal(finHundredths)} m; the difference from ${fmtDecimal(panelHundredths)} m is ${answer} m.`,
      proof: { family, givens: { num, den, panelHundredths, ask: 'difference' } },
      visual: { kind: 'v3-class-5-barmodel', parts: [{ label: 'Fin', value: `${num}/${den} m` }, { label: 'Panel', value: `${fmtDecimal(panelHundredths)} m` }], totalLabel: 'Difference?', description: `A bar comparing a fin of ${num}/${den} m with a panel of ${fmtDecimal(panelHundredths)} m.` },
      choices: answerChoices(answer, [
        wrong(fmtDecimal(Math.min(99, finHundredths + panelHundredths)), 'wrong-operation'),
        wrong(fmtDecimal(finHundredths), 'missing-step'),
        wrong(fmtDecimal(panelHundredths), 'missing-step'),
      ], count, null, KNOWN),
    };
  }

  // ---- geometry -----------------------------------------------------------
  if (family === 'class-5-composite-area') {
    const W = r.int(5, 8);
    const H = r.int(4, 6);
    const notchW = r.int(1, Math.min(3, W - 2));
    const notchH = r.int(1, Math.min(3, H - 2));
    const cells = buildCompositeGrid(W, H, notchW, notchH);
    const description = `A step-shaped plot made from ${numberArticle(W)} ${W} by ${H} unit rectangle with a ${notchW} by ${notchH} unit corner cut from the top right.`;
    const area = W * H - notchW * notchH;
    if (level === 1) {
      const answer = String(area);
      return {
        family, prompt: `A step-shaped plot is built from ${numberArticle(W)} ${W} by ${H} unit rectangle with a ${notchW} by ${notchH} unit corner removed, as shown. What is its area in square units?`, answer,
        hint: 'Find the area of the whole rectangle, then subtract the area of the missing corner.',
        explanation: `The whole rectangle is ${W} x ${H} = ${W * H} square units; the missing corner is ${notchW} x ${notchH} = ${notchW * notchH}, so the shape covers ${W * H} - ${notchW * notchH} = ${answer} square units.`,
        proof: { family, givens: { W, H, notchW, notchH, ask: 'area' } },
        visual: { kind: 'v3-class-5-areagrid', cells, description },
        choices: answerChoices(answer, [
          wrong(String(W * H), 'missing-step'),
          wrong(String(notchW * notchH), 'wrong-operation'),
          wrong(String((W - notchW) * (H - notchH)), 'area-perimeter'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const perimeter = 2 * (W + H);
      const answer = String(perimeter);
      return {
        family, prompt: `A step-shaped plot is built from ${numberArticle(W)} ${W} by ${H} unit rectangle with a ${notchW} by ${notchH} unit corner removed, as shown. What is its perimeter in units?`, answer,
        hint: 'Trace the outside edge and count the length of every side. Check what the removed corner does to the sides.',
        explanation: `The notch removes ${notchW} along one side and ${notchH} along another, but its two new edges add exactly ${notchW} and ${notchH} back. So the perimeter is the same as the full rectangle: 2 x (${W} + ${H}) = ${answer} units.`,
        proof: { family, givens: { W, H, notchW, notchH, ask: 'perimeter' } },
        visual: { kind: 'v3-class-5-areagrid', cells, description },
        choices: answerChoices(answer, [
          wrong(String(area), 'area-perimeter'),
          wrong(String(2 * (W + H) + 2 * notchW), 'missing-dimension'),
          wrong(String(2 * (W + H) - 2 * notchH), 'missing-dimension'),
        ], count, null, KNOWN),
      };
    }
    const rate = r.int(2, 9);
    const cost = area * rate;
    const answer = `Rs ${cost}`;
    return {
      family, prompt: `A step-shaped plot is built from ${numberArticle(W)} ${W} by ${H} unit rectangle with a ${notchW} by ${notchH} unit corner removed, as shown. Tiling costs Rs ${rate} per square unit. What is the total cost?`, answer,
      hint: 'Work out the area first, then multiply by the cost of one square unit.',
      explanation: `The area is ${W * H} - ${notchW * notchH} = ${area} square units; at Rs ${rate} per unit, the cost is ${area} x ${rate} = ${answer}.`,
      proof: { family, givens: { W, H, notchW, notchH, rate, ask: 'cost' } },
      visual: { kind: 'v3-class-5-areagrid', cells, description },
      choices: answerChoices(answer, [
        wrong(`Rs ${area + rate}`, 'wrong-operation'),
        wrong(`Rs ${2 * (W + H) * rate}`, 'area-perimeter'),
        wrong(`Rs ${W * H * rate}`, 'missing-step'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-perimeter-missing-side') {
    if (level === 1) {
      const side = r.int(4, 20);
      const otherSide = r.int(4, 20);
      const P = 2 * (side + otherSide);
      const answer = String(otherSide);
      return {
        family, prompt: `A rectangular plot has a perimeter of ${P} m. One side measures ${side} m. What is the length of the other side?`, answer,
        hint: 'Half the perimeter is the sum of one width and one length; subtract the known side from that half.',
        explanation: `Half the perimeter is ${P} / 2 = ${P / 2} m; taking away the known side of ${side} m gives ${answer} m.`,
        proof: { family, givens: { P, side, ask: 'other' } },
        visual: { kind: 'v3-class-5-labelrect', width: side, height: otherSide, widthLabel: `${side} m`, heightLabel: '?', description: `A rectangle labelled ${side} m along the bottom, with an unknown height.` },
        choices: answerChoices(answer, [
          wrong(String(P - side), 'missing-step'),
          wrong(String(P / 2), 'missing-step'),
          wrong(String(P / 2 + side), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const ratio = r.pick([2, 3, 4]);
      const width = r.int(3, 20);
      const length = ratio * width;
      const P = 2 * (width + length);
      const answer = String(width);
      return {
        family, prompt: `A rectangular garden is ${ratio} times as long as it is wide. Its perimeter is ${P} m. What is its width, in metres?`, answer,
        hint: 'A width plus a length that is the width times the ratio must add up to half the perimeter.',
        explanation: `Half the perimeter is ${P / 2} m, split into 1 width and ${ratio} widths, so ${1 + ratio} widths = ${P / 2} m, giving a width of ${answer} m.`,
        proof: { family, givens: { P, ratio, ask: 'ratio' } },
        visual: { kind: 'v3-class-5-labelrect', width, height: length, widthLabel: '?', heightLabel: `${ratio} × width`, description: `A rectangle with an unknown width and a height that is ${ratio} times that width.` },
        choices: answerChoices(answer, [
          wrong(String(P / 2), 'missing-dimension'),
          wrong(String(Math.round(P / (2 * ratio))), 'wrong-operation'),
          wrong(String(P / 4), 'missing-dimension'),
        ], count, null, KNOWN),
      };
    }
    const width = r.int(4, 14);
    const diff = r.int(2, 10);
    const length = width + diff;
    const P = 2 * (width + length);
    const answer = String(width);
    return {
      family, prompt: `A rectangular pool has a perimeter of ${P} m. Its length is ${diff} m more than its width. What is the width, in metres?`, answer,
      hint: 'Half the perimeter is one width plus one length; replace the length with "width plus the difference" and solve.',
      explanation: `Half the perimeter is ${P / 2} m, which is 2 widths plus ${diff} m, so 2 widths = ${P / 2 - diff} m, giving a width of ${answer} m.`,
      proof: { family, givens: { P, diff, ask: 'sumdiff' } },
      visual: { kind: 'v3-class-5-labelrect', width, height: length, widthLabel: '?', heightLabel: `width + ${diff} m`, description: `A rectangle with an unknown width and a height that is ${diff} m more than that width.` },
      choices: answerChoices(answer, [
        wrong(String(P / 2), 'missing-step'),
        wrong(String(P / 4), 'missing-dimension'),
        wrong(String(length), 'wrong-operation'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-angle-chase') {
    if (level === 1) {
      let angleA = r.int(20, 160);
      while (angleA === 90) angleA = r.int(20, 160);
      const otherAngle = 180 - angleA;
      const answer = `${otherAngle}°`;
      return {
        family, prompt: `Two angles sit on a straight line. One measures ${angleA}°. What is the other angle?`, answer,
        hint: 'Angles on a straight line always add up to 180 degrees.',
        explanation: `180° - ${angleA}° = ${answer}.`,
        proof: { family, givens: { angleA, ask: 'line2' } },
        visual: { kind: 'v3-class-5-anglefan', segments: [{ deg: angleA, label: `${angleA}°` }, { deg: otherAngle, label: '?' }], startDeg: 180, description: `A straight line split into two angles by a ray; one angle is ${angleA} degrees and the other is unknown.` },
        choices: answerChoices(answer, [
          wrong(`${angleA}°`, 'angle-relation'),
          wrong(`${360 - angleA}°`, 'angle-relation'),
          wrong(`${200 - angleA}°`, 'angle-relation'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      let angleA = r.int(40, 150);
      let angleB = r.int(40, 150);
      let angleC = 360 - angleA - angleB;
      while (angleC === 180 || angleC === angleA || angleC === angleB) {
        angleB = r.int(40, 150);
        angleC = 360 - angleA - angleB;
      }
      const answer = `${angleC}°`;
      return {
        family, prompt: `Three angles meet at a point and make a full turn. Two of them measure ${angleA}° and ${angleB}°. What is the third angle?`, answer,
        hint: 'Angles that meet at a point and make one full turn always add up to 360 degrees.',
        explanation: `360° - ${angleA}° - ${angleB}° = ${answer}.`,
        proof: { family, givens: { angleA, angleB, ask: 'point3' } },
        visual: { kind: 'v3-class-5-anglefan', segments: [{ deg: angleA, label: `${angleA}°` }, { deg: angleB, label: `${angleB}°` }, { deg: angleC, label: '?' }], startDeg: 90, description: `Three angles meeting at a point and making a full turn; two are ${angleA} and ${angleB} degrees and the third is unknown.` },
        choices: answerChoices(answer, [
          wrong(`${angleA + angleB}°`, 'angle-relation'),
          wrong(`${angleC + 20}°`, 'angle-relation'),
          wrong(`${angleC - 20}°`, 'angle-relation'),
        ], count, null, KNOWN),
      };
    }
    let s1 = r.int(20, 70);
    let s2 = r.int(20, 70);
    let s3 = 180 - s1 - s2;
    while (s1 + s2 === 90 || s3 === s1 || s3 === s2) {
      s2 = r.int(20, 70);
      s3 = 180 - s1 - s2;
    }
    const answer = `${s3}°`;
    return {
      family, prompt: `Three angles sit on a straight line. Two of them measure ${s1}° and ${s2}°. What is the third angle?`, answer,
      hint: 'Angles on a straight line always add up to 180 degrees, even when there are three of them.',
      explanation: `180° - ${s1}° - ${s2}° = ${answer}.`,
      proof: { family, givens: { s1, s2, ask: 'line3' } },
      visual: { kind: 'v3-class-5-anglefan', segments: [{ deg: s1, label: `${s1}°` }, { deg: s2, label: `${s2}°` }, { deg: s3, label: '?' }], startDeg: 180, description: `A straight line split into three angles; two are ${s1} and ${s2} degrees and the third is unknown.` },
      choices: answerChoices(answer, [
        wrong(`${s1 + s2}°`, 'angle-relation'),
        wrong(`${s3 + 20}°`, 'angle-relation'),
        wrong(`${180 - s1}°`, 'angle-relation'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-cube-net-fold') {
    const labels = r.shuffle(['1', '2', '3', '4', '5', '6']);
    const pairIndex = level === 1 ? 0 : level === 2 ? r.int(0, 1) : r.int(0, 2);
    const pair = NET_OPPOSITE_PAIRS[pairIndex];
    const askIndex = r.pick(pair);
    const otherIndex = pair[0] === askIndex ? pair[1] : pair[0];
    const answer = labels[otherIndex];
    const remainingIndexes = [0, 1, 2, 3, 4, 5].filter(index => index !== askIndex && index !== otherIndex);
    const wrongLabels = r.shuffle(remainingIndexes.map(index => labels[index])).slice(0, 3);
    const visual = { kind: 'v3-class-5-cubenet', labels, description: `A cross-shaped net of six squares labelled ${labels.join(', ')}, ready to fold into a cube.` };
    if (level > 1 && r.int(0, 1) === 1) {
      const pairText = indexes => `${labels[indexes[0]]} and ${labels[indexes[1]]}`;
      const pairAnswer = pairText(pair);
      const neighbours = [[askIndex, remainingIndexes[0]], [askIndex, remainingIndexes[1]], [otherIndex, remainingIndexes[2]]];
      return {
        family, prompt: 'This net folds into a cube. Which two faces are opposite each other once it is folded?', answer: pairAnswer,
        hint: 'Fold the net in your mind: faces two apart in the row of four end up opposite each other, and the two flaps end up opposite each other.',
        explanation: `Once folded, face ${labels[pair[0]]} sits directly opposite face ${labels[pair[1]]}.`,
        proof: { family, givens: { labels, askIndex, pairIndex, ask: 'pair' } },
        visual,
        choices: answerChoices(pairAnswer, neighbours.map(indexes => wrong(pairText(indexes), 'opposite-faces')), count, null, KNOWN),
      };
    }
    return {
      family, prompt: `This net folds into a cube. Face ${labels[askIndex]} is opposite which other face?`, answer,
      hint: 'Fold the net in your mind: faces two apart in the row of four end up opposite each other, and the two flaps end up opposite each other.',
      explanation: `Once folded, face ${labels[askIndex]} sits directly opposite face ${answer}.`,
      proof: { family, givens: { labels, askIndex, pairIndex } },
      visual,
      choices: answerChoices(answer, wrongLabels.map(label => wrong(label, 'opposite-faces')), count, null, KNOWN),
    };
  }

  if (family === 'class-5-symmetry-count') {
    if (level === 1) {
      const cols = 4;
      const rows = r.int(3, 4);
      const leftCells = (cols / 2) * rows;
      const leftShaded = r.int(1, leftCells - 1);
      const shadedLeftIndexes = r.shuffle(Array.from({ length: leftCells }, (_, index) => index)).slice(0, leftShaded);
      const cells = buildMirrorGrid(cols, rows, shadedLeftIndexes);
      const answer = String(2 * leftShaded);
      return {
        family, prompt: `The dashed line is a mirror line. ${leftShaded} ${noun(leftShaded, 'square is', 'squares are')} shaded on the left of a ${cols} by ${rows} grid. Once the right half matches, how many squares are shaded in total?`, answer,
        hint: 'Each shaded square on the left needs a matching shaded square in the same place on the right.',
        explanation: `${leftShaded} ${noun(leftShaded, 'square', 'squares')} shaded on the left plus ${leftShaded} matching ${noun(leftShaded, 'square', 'squares')} on the right makes ${answer} in total.`,
        proof: { family, givens: { cols, rows, leftShaded, ask: 'total' } },
        visual: { kind: 'v3-class-5-mirrorgrid', cells, mirrorCol: cols / 2, description: `A grid split by a mirror line, with ${leftShaded} ${noun(leftShaded, 'square', 'squares')} shaded on the left and the right half still blank.` },
        choices: answerChoices(answer, [
          wrong(String(leftShaded), 'class-5-symmetry-mirror'),
          wrong(String(2 * leftShaded + 2), 'class-5-symmetry-mirror'),
          wrong(String(rows * cols), 'class-5-symmetry-mirror'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const cols = 6;
      const rows = r.int(3, 5);
      const leftCells = (cols / 2) * rows;
      const leftShaded = r.int(1, leftCells - 1);
      const shadedLeftIndexes = r.shuffle(Array.from({ length: leftCells }, (_, index) => index)).slice(0, leftShaded);
      const cells = buildMirrorGrid(cols, rows, shadedLeftIndexes);
      const answer = String(2 * leftShaded);
      return {
        family, prompt: `The dashed line is a mirror line. ${leftShaded} ${noun(leftShaded, 'square is', 'squares are')} shaded on the left of a ${cols} by ${rows} grid. Once the right half matches, how many squares are shaded in total?`, answer,
        hint: 'Each shaded square on the left needs a matching shaded square in the same place on the right.',
        explanation: `${leftShaded} ${noun(leftShaded, 'square', 'squares')} shaded on the left plus ${leftShaded} matching ${noun(leftShaded, 'square', 'squares')} on the right makes ${answer} in total.`,
        proof: { family, givens: { cols, rows, leftShaded, ask: 'total' } },
        visual: { kind: 'v3-class-5-mirrorgrid', cells, mirrorCol: cols / 2, description: `A grid split by a mirror line, with ${leftShaded} ${noun(leftShaded, 'square', 'squares')} shaded on the left and the right half still blank.` },
        choices: answerChoices(answer, [
          wrong(String(leftShaded), 'class-5-symmetry-mirror'),
          wrong(String(2 * leftShaded + 2), 'class-5-symmetry-mirror'),
          wrong(String(rows * cols), 'class-5-symmetry-mirror'),
        ], count, null, KNOWN),
      };
    }
    const cols = r.pick([4, 6]);
    const rows = r.int(3, 5);
    const leftCells = (cols / 2) * rows;
    const leftShaded = r.int(1, leftCells - 1);
    const totalCells = cols * rows;
    const shadedLeftIndexes = r.shuffle(Array.from({ length: leftCells }, (_, index) => index)).slice(0, leftShaded);
    const cells = buildMirrorGrid(cols, rows, shadedLeftIndexes);
    const answer = String(totalCells - 2 * leftShaded);
    return {
      family, prompt: `The grid has ${totalCells} squares in total and is split by a mirror line. ${leftShaded} ${noun(leftShaded, 'square is', 'squares are')} shaded on the left. Once the right half matches, how many squares stay unshaded?`, answer,
      hint: 'Work out how many squares will be shaded in total once the right half matches, then subtract that from the whole grid.',
      explanation: `${leftShaded} ${noun(leftShaded, 'square', 'squares')} shaded on the left will match ${leftShaded} on the right, so ${2 * leftShaded} are shaded in total; ${totalCells} - ${2 * leftShaded} = ${answer} stay unshaded.`,
      proof: { family, givens: { cols, rows, leftShaded, ask: 'unshaded' } },
      visual: { kind: 'v3-class-5-mirrorgrid', cells, mirrorCol: cols / 2, description: `A grid of ${totalCells} squares split by a mirror line, with ${leftShaded} ${noun(leftShaded, 'square', 'squares')} shaded on the left and the right half still blank.` },
      choices: answerChoices(answer, [
        wrong(String(2 * leftShaded), 'class-5-symmetry-mirror'),
        wrong(String(totalCells - leftShaded), 'class-5-symmetry-mirror'),
        wrong(String(totalCells), 'missing-step'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-count-rectangles-grid') {
    const [m, n] = level === 1 ? [r.int(2, 5), r.int(2, 4)] : level === 2 ? [r.int(3, 6), r.int(3, 4)] : [r.int(4, 7), r.int(3, 5)];
    const ask = r.pick(level === 1 ? ['unit', 'squares', 'all'] : level === 2 ? ['all', 'squares', 'nonsquare', 'wide', 'tall'] : ['all', 'squares', 'nonsquare', 'wide', 'tall', 'exact']);
    const k = ask === 'wide' || ask === 'exact' ? r.int(2, m - 1) : ask === 'tall' ? r.int(2, n - 1) : 1;
    const j = ask === 'exact' ? r.int(2, n - 1) : 1;
    const totalRect = nChoose2(m + 1) * nChoose2(n + 1);
    let totalSquare = 0;
    const squareParts = [];
    for (let side = 1; side <= Math.min(m, n); side++) {
      totalSquare += (m - side + 1) * (n - side + 1);
      squareParts.push(`${side} by ${side}: ${(m - side + 1) * (n - side + 1)}`);
    }
    const nonSquare = totalRect - totalSquare;
    const bank = rectangleCounts(m, n, k, j);
    const answer = String(bank[ask]);
    const askText = {
      all: 'rectangles of any size', squares: 'squares of any size', nonsquare: 'rectangles that are NOT squares', unit: 'small unit squares',
      wide: `rectangles that are exactly ${k} squares wide (any height)`, tall: `rectangles that are exactly ${k} squares tall (any width)`,
      exact: `rectangles that are exactly ${k} squares wide and ${j} squares tall`,
    }[ask];
    const explanation = {
      all: `Choose 2 of the ${m + 1} vertical lines and 2 of the ${n + 1} horizontal lines: ${nChoose2(m + 1)} x ${nChoose2(n + 1)} = ${totalRect} rectangles.`,
      squares: `Squares by size - ${squareParts.join('; ')} - make ${totalSquare} in total.`,
      nonsquare: `There are ${totalRect} rectangles in all and ${totalSquare} of them are squares, so ${totalRect} - ${totalSquare} = ${nonSquare} are not squares.`,
      unit: `The grid has ${m} columns and ${n} rows of small squares: ${m} x ${n} = ${m * n}.`,
      wide: `A ${k}-wide rectangle can start in ${m - k + 1} places across, and any of the ${nChoose2(n + 1)} height choices works: ${m - k + 1} x ${nChoose2(n + 1)} = ${bank.wide}.`,
      tall: `A ${k}-tall rectangle can start in ${n - k + 1} places down, and any of the ${nChoose2(m + 1)} width choices works: ${n - k + 1} x ${nChoose2(m + 1)} = ${bank.tall}.`,
      exact: `It can start in ${m - k + 1} places across and ${n - j + 1} places down: ${m - k + 1} x ${n - j + 1} = ${bank.exact}.`,
    }[ask];
    const cells = Array.from({ length: n }, () => Array(m).fill(0));
    const wrongValues = [...new Set([
      ...Object.entries(bank).filter(([key]) => key !== ask).map(([, value]) => value),
      bank[ask] + 1, bank[ask] + 2, bank[ask] - 1,
    ])].filter(value => value !== bank[ask] && value > 0);
    return {
      family, prompt: `This grid of unit squares is ${m} squares wide and ${n} squares tall. How many ${askText} can you find in it?`, answer,
      hint: ask === 'unit' ? 'Multiply the number of columns by the number of rows.' : 'Count every size, not just the smallest unit squares; a rectangle can be made of several unit squares together.',
      explanation,
      proof: { family, givens: { m, n, ask, k, j } },
      visual: { kind: 'v3-class-5-rectgrid', cells, description: `A blank grid of unit squares, ${m} wide and ${n} tall.` },
      choices: answerChoices(answer, wrongValues.map((value, i) => wrong(String(value), i < 2 ? 'class-5-rectangle-count' : 'missing-step')), count, null, KNOWN),
    };
  }

  // ---- measurement -------------------------------------------------------
  if (family === 'class-5-dial-read-convert') {
    const ctx = r.pick(DIAL_CONTEXTS);
    const ctxIndex = DIAL_CONTEXTS.indexOf(ctx);
    if (level === 1) {
      const max = r.pick([20, 40, 60, 100]);
      const divisions = 10;
      const step = max / divisions;
      let needleAt = r.int(2, 8);
      while (needleAt === divisions / 2) needleAt = r.int(2, 8);
      const reading = needleAt * step;
      const answer = String(reading);
      return {
        family, prompt: `The ${ctx.name} gauge reads from 0 to ${max} ${ctx.big}. What does the needle show, in ${ctx.big}?`, answer,
        hint: `Count the ticks from 0 to the needle; each tick is ${step} ${ctx.big}.`,
        explanation: `The needle sits ${needleAt} tick${needleAt === 1 ? '' : 's'} from 0, and each tick is ${step} ${ctx.big}: ${needleAt} x ${step} = ${reading} ${ctx.big}.`,
        proof: { family, givens: { max, divisions, needleAt, ctxIndex, ask: 'read' } },
        visual: { kind: 'v3-class-5-gauge', max, divisions, needleAt, unit: ctx.big, description: `A gauge dial reading from 0 to ${max} ${ctx.big}, with a needle pointing at one of the ticks.` },
        choices: answerChoices(answer, [
          wrong(String((needleAt - 1) * step), 'scale-interval'),
          wrong(String((needleAt + 1) * step), 'scale-interval'),
          wrong(String(max), 'scale-interval'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const max = r.pick([20, 40, 60, 100]);
      const divisions = 10;
      const step = max / divisions;
      const needleAt = r.int(1, 8);
      const reading = needleAt * step;
      const answer = String(reading * ctx.factor);
      return {
        family, prompt: `Read the ${ctx.name} gauge, then give the amount in ${ctx.small}.`, answer,
        hint: `Read the ${ctx.big} first, then multiply by ${ctx.factor} to change it to ${ctx.small}.`,
        explanation: `The needle shows ${reading} ${ctx.big}. ${reading} x ${ctx.factor} = ${reading * ctx.factor} ${ctx.small}.`,
        proof: { family, givens: { max, divisions, needleAt, ctxIndex, ask: 'convert' } },
        visual: { kind: 'v3-class-5-gauge', max, divisions, needleAt, unit: ctx.big, description: `A gauge dial reading from 0 to ${max} ${ctx.big}, with a needle pointing at one of the ticks.` },
        choices: answerChoices(answer, [
          wrong(String(reading), 'unit-conversion'),
          wrong(String(reading * 100), 'unit-conversion'),
          wrong(String((needleAt - 1) * step * ctx.factor), 'scale-interval'),
        ], count, null, KNOWN),
      };
    }
    const max = r.pick([40, 60, 100]);
    const divisions = 20;
    const step = max / divisions;
    let needleAt = r.int(1, 18);
    if (needleAt === divisions / 2) needleAt += 1;
    const reading = needleAt * step;
    const remaining = max - reading;
    const answer = String(remaining * ctx.factor);
    return {
      family, prompt: `Read the ${ctx.name} gauge. How many more ${ctx.small} are needed to fill it to ${max} ${ctx.big}?`, answer,
      hint: `Find how far the needle is from the top, then change that amount from ${ctx.big} to ${ctx.small}.`,
      explanation: `The needle shows ${reading} ${ctx.big}, so ${max} - ${reading} = ${remaining} ${ctx.big} is left to fill. ${remaining} x ${ctx.factor} = ${remaining * ctx.factor} ${ctx.small}.`,
      proof: { family, givens: { max, divisions, needleAt, ctxIndex, ask: 'remaining' } },
      visual: { kind: 'v3-class-5-gauge', max, divisions, needleAt, unit: ctx.big, description: `A gauge dial reading from 0 to ${max} ${ctx.big}, with a needle pointing at one of the finer ticks.` },
      choices: answerChoices(answer, [
        wrong(String(remaining), 'unit-conversion'),
        wrong(String(reading * ctx.factor), 'wrong-operation'),
        wrong(String((remaining + step) * ctx.factor), 'scale-interval'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-thermometer-change') {
    const ctx = r.pick(THERMO_CONTEXTS);
    const ctxIndex = THERMO_CONTEXTS.indexOf(ctx);
    const min = -10;
    const max = r.pick([30, 40, 50]);
    const step = (max - min) / 10;
    const fillAt = r.int(1, 9);
    const startReading = min + fillAt * step;
    const deg = n => `${n} degree${Math.abs(n) === 1 ? '' : 's'} C`;
    if (level === 1) {
      const answer = `${startReading}°C`;
      return {
        family, prompt: `The ${ctx} sensor runs from ${min} to ${max} degrees C. What does it read?`, answer,
        hint: `Count the ticks from ${min}; each tick is ${step} degrees.`,
        explanation: `The level is ${fillAt} tick${fillAt === 1 ? '' : 's'} above ${min}, and each tick is ${step} degrees: ${min} + ${fillAt} x ${step} = ${deg(startReading)}.`,
        proof: { family, givens: { min, max, fillAt, ctxIndex } },
        visual: { kind: 'v3-class-5-thermo', min, max, step, fillAt, unit: '°C', description: `A thermometer scaled from ${min} to ${max} degrees C, filled to one of the ticks.` },
        choices: answerChoices(answer, [
          wrong(`${startReading - step}°C`, 'scale-interval'),
          wrong(`${startReading + step}°C`, 'scale-interval'),
          wrong(`${startReading + 2 * step}°C`, 'scale-interval'),
        ], count, null, KNOWN),
      };
    }
    const direction1 = r.pick(['rises', 'falls']);
    const amount1 = r.int(3, 25);
    const afterStep1 = direction1 === 'rises' ? startReading + amount1 : startReading - amount1;
    if (level === 2) {
      const answer = `${afterStep1}°C`;
      return {
        family, prompt: `The ${ctx} temperature ${direction1} by ${amount1} degrees. What is the new reading, in degrees C?`, answer,
        hint: `Find the starting reading from the sensor, then ${direction1 === 'rises' ? 'add' : 'subtract'} ${amount1}.`,
        explanation: `The sensor starts at ${deg(startReading)}. It ${direction1} by ${amount1}: ${startReading} ${direction1 === 'rises' ? '+' : '-'} ${amount1} = ${deg(afterStep1)}.`,
        proof: { family, givens: { min, max, fillAt, ctxIndex, direction1, amount1 } },
        visual: { kind: 'v3-class-5-thermo', min, max, step, fillAt, unit: '°C', description: `A thermometer scaled from ${min} to ${max} degrees C, filled to one of the ticks.` },
        choices: answerChoices(answer, [
          wrong(`${direction1 === 'rises' ? startReading - amount1 : startReading + amount1}°C`, 'wrong-operation'),
          wrong(`${direction1 === 'rises' ? startReading + (amount1 - 1) : startReading - (amount1 - 1)}°C`, 'missing-step'),
          wrong(`${startReading}°C`, 'scale-zero'),
        ], count, null, KNOWN),
      };
    }
    const direction2 = r.pick(['rises', 'falls']);
    const amount2 = r.int(3, 20);
    const answerValue = direction2 === 'rises' ? afterStep1 + amount2 : afterStep1 - amount2;
    const answer = `${answerValue}°C`;
    const wrongReverseSecond = direction2 === 'rises' ? afterStep1 - amount2 : afterStep1 + amount2;
    let wrongIgnoreFirst = direction2 === 'rises' ? startReading + amount2 : startReading - amount2;
    if (wrongIgnoreFirst === afterStep1) wrongIgnoreFirst += direction2 === 'rises' ? 1 : -1;
    return {
      family, prompt: `The ${ctx} temperature ${direction1} by ${amount1} degrees, then ${direction2} by ${amount2} degrees. What is the final reading, in degrees C?`, answer,
      hint: 'Apply the first change to the starting reading, then apply the second change to that result.',
      explanation: `Start at ${startReading}. After the first change: ${deg(afterStep1)}. After the second change: ${deg(answerValue)}.`,
      proof: { family, givens: { min, max, fillAt, ctxIndex, direction1, amount1, direction2, amount2 } },
      visual: { kind: 'v3-class-5-thermo', min, max, step, fillAt, unit: '°C', description: `A thermometer scaled from ${min} to ${max} degrees C, filled to one of the ticks.` },
      choices: answerChoices(answer, [
        wrong(`${afterStep1}°C`, 'missing-step'),
        wrong(`${wrongReverseSecond}°C`, 'wrong-operation'),
        wrong(`${wrongIgnoreFirst}°C`, 'scale-zero'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-unit-conversion-compare') {
    const pair = r.pick(UNIT_COMPARE_PAIRS);
    const pairIndex = UNIT_COMPARE_PAIRS.indexOf(pair);
    const forceEqual = r.int(1, 4) === 1;
    const compound = level !== 1;
    let aBig, aRem, bBig, bRem;
    if (!compound) {
      aBig = r.int(2, 20);
      aRem = 0;
      bBig = 0;
      bRem = forceEqual ? aBig * pair.factor : r.int(1, pair.factor * 20);
    } else {
      const bigMax = level === 2 ? 9 : 99;
      aBig = r.int(2, bigMax);
      aRem = r.int(0, pair.factor - 1);
      bBig = forceEqual ? aBig : r.int(2, bigMax);
      bRem = forceEqual ? aRem : r.int(0, pair.factor - 1);
    }
    const aTotal = aBig * pair.factor + aRem;
    const bTotal = bBig * pair.factor + bRem;
    const aText = compound ? `${aBig} ${pair.big} ${aRem} ${pair.small}` : `${aBig} ${pair.big}`;
    const bText = compound ? `${bBig} ${pair.big} ${bRem} ${pair.small}` : `${bRem} ${pair.small}`;
    const labels = [aText, bText, 'They are equal'];
    const correctIndex = aTotal === bTotal ? 2 : aTotal > bTotal ? 0 : 1;
    const answer = labels[correctIndex];
    const distractorLabels = labels.filter((_, index) => index !== correctIndex);
    return {
      family, prompt: `Which is greater: ${aText} or ${bText}?`, answer,
      hint: `Change both amounts to ${pair.small} before comparing.`,
      explanation: `${aText} = ${aTotal} ${pair.small} and ${bText} = ${bTotal} ${pair.small}, so ${answer === 'They are equal' ? 'they are equal' : `${answer} is greater`}.`,
      proof: { family, givens: { aBig, aRem, bBig, bRem, pairIndex, compound } },
      choices: answerChoices(answer, [
        wrong(distractorLabels[0], 'class-5-measure-compare'),
        wrong(distractorLabels[1], 'class-5-measure-compare'),
        wrong('Not enough information', 'class-5-measure-compare'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-balance-unknown-mass') {
    if (level === 2) {
      const crateCount = r.int(2, 4);
      const crateMass = r.int(2, 48);
      const known = r.int(1, 20);
      const total = crateMass * crateCount + known;
      const answer = String(crateMass);
      let w3 = crateMass + crateCount;
      if (w3 === crateMass + known) w3 += 1;
      return {
        family, prompt: 'The balance is level. Each crate weighs the same. What is the mass of one crate, in kg?', answer,
        hint: 'Take the known weight away from the total first, then share what is left between the crates.',
        explanation: `${total} - ${known} = ${total - known} kg for ${crateCount} crates. ${total - known} / ${crateCount} = ${crateMass} kg each.`,
        proof: { family, givens: { crateCount, crateMass, known } },
        visual: {
          kind: 'v3-class-5-balance',
          balances: [{ left: [{ sprite: 'crate', count: crateCount }, { weight: known }], right: [{ weight: total }] }],
          description: `A level balance. Left pan: ${crateCount} crates and ${numberArticle(known)} ${known} kg weight. Right pan: ${numberArticle(total)} ${total} kg weight.`,
        },
        choices: answerChoices(answer, [
          wrong(String(crateMass + known), 'balance-total'),
          wrong(String(total), 'missing-step'),
          wrong(String(w3), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    const crateCount = r.int(2, 3);
    const crateMass = r.int(2, 20);
    const known1 = r.int(1, 15);
    const total1 = crateMass * crateCount + known1;
    const cellCount = r.int(2, 3);
    const cellMass = r.int(2, 20);
    const total2 = cellMass * cellCount + crateMass;
    const answer = String(cellMass);
    let w1 = Math.round(total2 / cellCount);
    if (w1 === cellMass) w1 += 1;
    let w2 = crateMass;
    if (w2 === cellMass) w2 += 1;
    let w3 = Math.round((total2 - known1) / cellCount);
    if (w3 === cellMass || w3 === w1) w3 += 1;
    return {
      family, prompt: `On Balance 1 (not shown), ${crateCount} crates and ${numberArticle(known1)} ${known1} kg weight balanced ${numberArticle(total1)} ${total1} kg weight. Balance 2 is pictured. What is the mass of one fuel cell, in kg?`, answer,
      hint: 'Solve Balance 1 for the mass of one crate first, then use that crate in Balance 2.',
      explanation: `Balance 1: (${total1} - ${known1}) / ${crateCount} = ${crateMass} kg per crate. Balance 2: (${total2} - ${crateMass}) / ${cellCount} = ${cellMass} kg per fuel cell.`,
      proof: { family, givens: { crateCount, crateMass, known1, cellCount, cellMass } },
      visual: {
        kind: 'v3-class-5-balance',
        balances: [{ left: [{ sprite: 'fuel-cell', count: cellCount }, { sprite: 'crate', count: 1 }], right: [{ weight: total2 }] }],
        description: `Balance 2: ${cellCount} fuel cells and one crate from Balance 1 balance ${numberArticle(total2)} ${total2} kg weight.`,
      },
      choices: answerChoices(answer, [
        wrong(String(w1), 'missing-step'),
        wrong(String(w2), 'missing-step'),
        wrong(String(w3), 'balance-total'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-measurement-word-problem') {
    const ctx = r.pick(WORD_PROBLEM_CONTEXTS);
    const ctxIndex = WORD_PROBLEM_CONTEXTS.indexOf(ctx);
    const thing = r.pick(ctx.things);
    const thingIndex = ctx.things.indexOf(thing);
    if (level === 2) {
      const startBig = r.int(4, 12);
      const startRem = r.int(1, ctx.factor - 1);
      const startSmall = startBig * ctx.factor + startRem;
      const cutBig = r.int(1, startBig - 2);
      const cutRem = r.int(1, ctx.factor - 1);
      const cutSmall = cutBig * ctx.factor + cutRem;
      const leftSmall = startSmall - cutSmall;
      const startText = `${startBig} ${ctx.big} ${startRem} ${ctx.small}`;
      const answer = String(leftSmall);
      let w2 = startBig * ctx.factor - cutSmall;
      if (w2 === leftSmall) w2 -= 1;
      return {
        family, prompt: `${ctx.setup(thing, startText)} ${cutBig} ${ctx.big} ${cutRem} ${ctx.small} is ${ctx.verb}. How many ${ctx.small} are left?`, answer,
        hint: `Change both amounts to ${ctx.small}, then subtract.`,
        explanation: `${startSmall} ${ctx.small} - ${cutSmall} ${ctx.small} = ${leftSmall} ${ctx.small}.`,
        proof: { family, givens: { startBig, startRem, cutBig, cutRem, ctxIndex, thingIndex } },
        choices: answerChoices(answer, [
          wrong(String(startSmall + cutSmall), 'wrong-operation'),
          wrong(String(w2), 'unit-conversion'),
          wrong(String(Math.abs(startRem - cutRem)), 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    const startBig = r.int(6, 18);
    const startSmall = startBig * ctx.factor;
    const cut1Big = r.int(1, Math.floor(startBig / 3));
    const cut1Small = cut1Big * ctx.factor + r.int(0, ctx.factor - 1);
    const afterCut1 = startSmall - cut1Small;
    const cut2Big = r.int(1, Math.max(1, Math.floor(afterCut1 / ctx.factor / 2)));
    const cut2Small = cut2Big * ctx.factor + r.int(0, ctx.factor - 1);
    const leftSmall = afterCut1 - cut2Small;
    const answer = String(leftSmall);
    let w3 = afterCut1 - (cut2Small % ctx.factor);
    if (w3 === afterCut1) w3 -= 1;
    if (w3 === leftSmall) w3 -= 1;
    return {
      family, prompt: `${ctx.setup(thing, `${startBig} ${ctx.big}`)} Two amounts are ${ctx.verb}: ${cut1Small} ${ctx.small}, then ${cut2Small} ${ctx.small}. How many ${ctx.small} are left?`, answer,
      hint: 'Subtract both cuts from the start; a bar model can help you see the parts.',
      explanation: `${startSmall} - ${cut1Small} - ${cut2Small} = ${leftSmall} ${ctx.small}.`,
      proof: { family, givens: { startBig, cut1Small, cut2Small, ctxIndex, thingIndex } },
      visual: {
        kind: 'v3-class-5-barmodel',
        parts: [
          { label: 'First cut', value: `${cut1Small} ${ctx.small}` },
          { label: 'Second cut', value: `${cut2Small} ${ctx.small}` },
          { label: 'Left', value: '?' },
        ],
        totalLabel: `Start: ${startSmall} ${ctx.small}`,
        description: `A bar split into three parts: a first cut of ${cut1Small} ${ctx.small}, a second cut of ${cut2Small} ${ctx.small}, and an unknown part left over. The whole bar totals ${startSmall} ${ctx.small}.`,
      },
      choices: answerChoices(answer, [
        wrong(String(afterCut1), 'missing-step'),
        wrong(String(startSmall + cut1Small + cut2Small), 'wrong-operation'),
        wrong(String(w3), 'unit-conversion'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-sensible-unit-estimate') {
    const itemIndex = r.int(0, SENSIBLE_ITEMS.length - 1);
    const item = SENSIBLE_ITEMS[itemIndex];
    const template = r.pick(SENSIBLE_TEMPLATES);
    const answer = `${item.value} ${item.unit}`;
    const otherUnits = SENSIBLE_UNITS_BY_CATEGORY[item.category].filter(unit => unit !== item.unit);
    return {
      family, prompt: template(item.thing), answer,
      hint: `Picture ${item.thing} in real life, then judge which unit makes sense.`,
      explanation: `${item.thing[0].toUpperCase()}${item.thing.slice(1)} is about ${answer}.`,
      proof: { family, givens: { itemIndex } },
      choices: answerChoices(answer, otherUnits.map(unit => wrong(`${item.value} ${unit}`, 'class-5-sensible-unit')), count, null, KNOWN),
    };
  }

  // ---- time ---------------------------------------------------------------
  if (family === 'class-5-elapsed-time-bar') {
    const stageCount = level === 1 ? 3 : level === 2 ? 3 : 4;
    const names = r.shuffle(MISSION_STAGES).slice(0, stageCount);
    if (level === 1) {
      let durations;
      do {
        durations = Array.from({ length: stageCount }, () => r.int(12, 48));
        if (sum(durations) < 60) durations[stageCount - 1] += 60 - sum(durations) + r.int(0, 10);
      } while (new Set(durations).size !== stageCount);
      const total = sum(durations);
      const answer = fmtDuration(total);
      return {
        family, prompt: `Mission control times three stages: ${names.map((name, i) => `${name} ${fmtDuration(durations[i])}`).join(', ')}. What is the total time for the mission?`, answer,
        hint: 'Add every stage together; regroup 60 minutes as 1 hour if the total passes an hour.',
        explanation: `${durations.join(' + ')} = ${total} min, which is ${answer}.`,
        proof: { family, givens: { durations } },
        visual: {
          kind: 'v3-class-5-barmodel',
          parts: names.map((name, i) => ({ label: name, value: fmtDuration(durations[i]) })),
          totalLabel: 'Total: ?',
          description: `A bar split into ${stageCount} stages: ${names.map((name, i) => `${name} ${fmtDuration(durations[i])}`).join(', ')}. The total is unknown.`,
        },
        choices: answerChoices(answer, durations.map((_, i) => wrong(fmtDuration(total - durations[i]), 'missing-step')), count, null, KNOWN),
      };
    }
    const durations = Array.from({ length: stageCount }, () => r.int(12, 48));
    const missingIndex = r.int(0, stageCount - 1);
    const total = sum(durations);
    const knownSum = total - durations[missingIndex];
    const answer = fmtDuration(durations[missingIndex]);
    return {
      family, prompt: `A mission timeline has ${stageCount} stages totalling ${fmtDuration(total)}: ${names.map((name, i) => i === missingIndex ? `${name} ?` : `${name} ${fmtDuration(durations[i])}`).join(', ')}. How long is the ${names[missingIndex]} stage?`, answer,
      hint: 'Add the known stages, then subtract that sum from the stated total.',
      explanation: `${fmtDuration(total)} - ${fmtDuration(knownSum)} = ${answer}.`,
      proof: { family, givens: { knownDurations: durations.map((d, i) => (i === missingIndex ? null : d)), total } },
      visual: {
        kind: 'v3-class-5-barmodel',
        parts: names.map((name, i) => ({ label: name, value: i === missingIndex ? '?' : fmtDuration(durations[i]) })),
        totalLabel: `Total: ${fmtDuration(total)}`,
        description: `A bar split into ${stageCount} stages, one of them (${names[missingIndex]}) unknown and marked with a question mark. The whole bar totals ${fmtDuration(total)}.`,
      },
      choices: answerChoices(answer, [
        wrong(fmtDuration(knownSum === durations[missingIndex] ? knownSum + 7 : knownSum), 'missing-step'),
        wrong(fmtDuration(total), 'missing-step'),
        wrong(fmtDuration(total + knownSum), 'wrong-operation'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-clock-fast-slow') {
    const shown = r.int(60, 1380);
    if (level === 2) {
      const direction = r.pick(['fast', 'slow']);
      const amount = r.pick([5, 10, 15, 20, 25, 30, 40, 45, 50]);
      const real = direction === 'fast' ? shown - amount : shown + amount;
      const answer = timeText(real);
      return {
        family, prompt: `The command-deck clock shows the time below, but it runs ${amount} min ${direction}. What is the real time?`, answer,
        hint: 'A fast clock is ahead of the real time; a slow clock is behind it.',
        explanation: `${timeText(shown)} corrected by ${amount} min ${direction} gives ${answer}.`,
        proof: { family, givens: { shown, direction, amount } },
        visual: { kind: 'v3-class-5-clock', minutes: shown, description: clockDescription(shown) },
        choices: answerChoices(answer, [
          wrong(timeText(direction === 'fast' ? shown + amount : shown - amount), 'clock-error'),
          wrong(timeText(shown), 'missing-step'),
          wrong(timeText(direction === 'fast' ? shown - 2 * amount : shown + 2 * amount), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    const direction = r.pick(['fast', 'slow']);
    const amount = r.pick([5, 10, 15, 20, 25, 30]);
    const direction2 = r.pick(['fast', 'slow']);
    const amount2 = r.pick([5, 10, 15, 20, 25, 30]);
    const afterFirst = direction === 'fast' ? shown - amount : shown + amount;
    const afterSecond = direction2 === 'fast' ? afterFirst - amount2 : afterFirst + amount2;
    const answer = timeText(afterSecond);
    const secondOnly = direction2 === 'fast' ? shown - amount2 : shown + amount2;
    const reversedSecond = direction2 === 'fast' ? afterFirst + amount2 : afterFirst - amount2;
    const usedTexts = new Set([answer]);
    const nudgeDistinct = minutes => {
      let offset = 0;
      let txt = timeText(minutes);
      while (usedTexts.has(txt)) { offset += 1; txt = timeText(minutes + offset); }
      usedTexts.add(txt);
      return txt;
    };
    const wrong1Text = nudgeDistinct(afterFirst);
    const wrong2Text = nudgeDistinct(secondOnly);
    const wrong3Text = nudgeDistinct(reversedSecond);
    const verb2 = direction2 === 'fast' ? 'gained' : 'lost';
    return {
      family, prompt: `The clock below was ${amount} min ${direction}. Then it ${verb2} a further ${amount2} min. What is the real time now?`, answer,
      hint: 'A fast clock is ahead of the real time and a slow clock is behind it. Work out the total error, then correct the time shown.',
      explanation: `The clock was ${amount} min ${direction}, then ${verb2} ${amount2} min. To correct it, ${timeText(shown)} ${direction === 'slow' ? '+' : '-'} ${amount} ${direction2 === 'slow' ? '+' : '-'} ${amount2} gives ${answer}.`,
      proof: { family, givens: { shown, direction, amount, direction2, amount2 } },
      visual: { kind: 'v3-class-5-clock', minutes: shown, description: clockDescription(shown) },
      choices: answerChoices(answer, [
        wrong(wrong1Text, 'missing-step'),
        wrong(wrong2Text, 'missing-step'),
        wrong(wrong3Text, 'clock-error'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-calendar-weekday-calc') {
    const daysInMonth = r.pick([28, 29, 30, 31]);
    const startWeekday = r.int(0, 6);
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayColumn = day => (startWeekday + day - 1) % 7;
    if (level === 1) {
      const day = r.int(1, daysInMonth);
      const col = dayColumn(day);
      const answer = WEEKDAY_LABELS[col];
      const wrongCols = [1, 2, 3].map(offset => WEEKDAY_LABELS[(col + offset) % 7]);
      return {
        family, prompt: `This month's calendar is shown below. What day of the week is the ${day}${ordinal(day)}?`, answer,
        hint: 'Find the day number in the grid, then read the weekday heading above its column.',
        explanation: `Day ${day} sits in the ${weekdayNames[col]} column.`,
        proof: { family, givens: { daysInMonth, startWeekday, day } },
        visual: {
          kind: 'v3-class-5-calendar', daysInMonth, startWeekday, highlight: [day], highlightColumn: null,
          description: `A month calendar starting on ${weekdayNames[startWeekday]} with ${daysInMonth} days; day ${day} is highlighted.`,
        },
        choices: answerChoices(answer, wrongCols.map(w => wrong(w, 'calendar-column')), count, null, KNOWN),
      };
    }
    if (level === 2) {
      const col = r.int(0, 6);
      const firstDay = col >= startWeekday ? col - startWeekday + 1 : col - startWeekday + 8;
      const occurrences = [];
      for (let d = firstDay; d <= daysInMonth; d += 7) occurrences.push(d);
      const n = r.int(1, occurrences.length);
      const idx = n - 1;
      const answer = String(occurrences[idx]);
      const ordinalWord = ['first', 'second', 'third', 'fourth', 'fifth'][idx];
      const otherIdx = occurrences.map((_, i) => i).filter(i => i !== idx);
      const wrongChoices = [otherIdx[0], otherIdx[1], otherIdx[otherIdx.length - 1]].map(i => occurrences[i]);
      return {
        family, prompt: `This month's calendar is shown below, with every ${weekdayNames[col]} highlighted. What is the date of the ${ordinalWord} ${weekdayNames[col]}?`, answer,
        hint: 'Scan down the highlighted column and count the highlighted dates in order.',
        explanation: `The highlighted dates in order: ${occurrences.join(', ')}; the ${ordinalWord} is ${answer}.`,
        proof: { family, givens: { daysInMonth, startWeekday, col, n } },
        visual: {
          kind: 'v3-class-5-calendar', daysInMonth, startWeekday, highlight: [], highlightColumn: col,
          description: `A month calendar starting on ${weekdayNames[startWeekday]} with ${daysInMonth} days; the ${weekdayNames[col]} column is tinted.`,
        },
        choices: answerChoices(answer, wrongChoices.map(w => wrong(String(w), 'calendar-column')), count, null, KNOWN),
      };
    }
    const col = r.int(0, 6);
    const firstDay = col >= startWeekday ? col - startWeekday + 1 : col - startWeekday + 8;
    const occurrenceCount = Math.floor((daysInMonth - firstDay) / 7) + 1;
    const answer = String(occurrenceCount);
    return {
      family, prompt: `This month's calendar is shown below, with every ${weekdayNames[col]} highlighted. How many ${weekdayNames[col]}s does this month have?`, answer,
      hint: 'Count every highlighted date in the column.',
      explanation: `${weekdayNames[col]} falls on days ${Array.from({ length: occurrenceCount }, (_, i) => firstDay + i * 7).join(', ')}, so there are ${occurrenceCount}.`,
      proof: { family, givens: { daysInMonth, startWeekday, col } },
      visual: {
        kind: 'v3-class-5-calendar', daysInMonth, startWeekday, highlight: [], highlightColumn: col,
        description: `A month calendar starting on ${weekdayNames[startWeekday]} with ${daysInMonth} days; the ${weekdayNames[col]} column is tinted.`,
      },
      choices: answerChoices(answer, [
        wrong(String(occurrenceCount - 1), 'counted-endpoints'),
        wrong(String(occurrenceCount + 1), 'counted-endpoints'),
        wrong(String(occurrenceCount + 2), 'calendar-column'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-timetable-read') {
    const craftCount = level === 1 ? 4 : 5;
    const names = r.shuffle(CRAFT_NAMES).slice(0, craftCount);
    const times = r.shuffle(Array.from({ length: 20 }, (_, i) => i * 15)).slice(0, craftCount).sort((a, b) => a - b);
    const order = r.shuffle(times.map((_, i) => i));
    const rows = order.map(i => ({ name: names[i], value: timeText(times[i]) }));
    if (level === 1) {
      const ask = r.pick(['earliest', 'latest']);
      const sortedIdx = [...order].sort((a, b) => times[a] - times[b]);
      const answerIdx = ask === 'earliest' ? sortedIdx[0] : sortedIdx[sortedIdx.length - 1];
      const answer = names[answerIdx];
      const wrongIdx = ask === 'earliest' ? sortedIdx[sortedIdx.length - 1] : sortedIdx[0];
      return {
        family, prompt: `The departures board below lists ${craftCount} craft. Which craft leaves ${ask === 'earliest' ? 'earliest' : 'latest'}?`, answer,
        hint: 'Compare every listed time; the earliest is the smallest time, the latest is the biggest.',
        explanation: `${names[answerIdx]} leaves at ${timeText(times[answerIdx])}, the ${ask === 'earliest' ? 'earliest' : 'latest'} time listed.`,
        proof: { family, givens: { names: order.map(i => names[i]), times: order.map(i => times[i]), ask } },
        visual: { kind: 'v3-class-5-timetable', rows, description: `A departures board: ${rows.map(row => `${row.name} ${row.value}`).join(', ')}.` },
        choices: answerChoices(answer, [
          wrong(names[wrongIdx], 'position-end'),
          ...sortedIdx.slice(1, -1).slice(0, 2).map(i => wrong(names[i], 'position-end')),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const [i, j] = r.shuffle(order).slice(0, 2);
      const diff = Math.abs(times[i] - times[j]);
      const answer = fmtDuration(diff);
      return {
        family, prompt: `The departures board below lists ${craftCount} craft. How much later does ${times[i] > times[j] ? names[i] : names[j]} leave than ${times[i] > times[j] ? names[j] : names[i]}?`, answer,
        hint: 'Find both times, then subtract the earlier one from the later one.',
        explanation: `${timeText(Math.max(times[i], times[j]))} - ${timeText(Math.min(times[i], times[j]))} = ${answer}.`,
        proof: { family, givens: { timeA: times[i], timeB: times[j] } },
        visual: { kind: 'v3-class-5-timetable', rows, description: `A departures board: ${rows.map(row => `${row.name} ${row.value}`).join(', ')}.` },
        choices: answerChoices(answer, [
          wrong(fmtDuration(diff + 15), 'scale-interval'),
          wrong(timeText(Math.max(times[i], times[j])), 'wrong-operation'),
          wrong(fmtDuration(1440 - diff), 'time-direction'),
        ], count, null, KNOWN),
      };
    }
    const sortedIdx = [...order].sort((a, b) => times[a] - times[b]);
    const cut = r.int(1, sortedIdx.length - 1);
    const deadline = times[sortedIdx[cut]] + r.int(1, 14);
    const answerIdx = sortedIdx[cut];
    const answer = names[answerIdx];
    const others = sortedIdx.filter((_, idx) => idx !== cut);
    return {
      family, prompt: `You must board a craft that leaves no later than ${timeText(deadline)}. Using the departures board below, which craft should you choose to leave as late as possible while still meeting that deadline?`, answer,
      hint: 'Cross out every craft that leaves after the deadline, then pick the latest time left.',
      explanation: `${answer} leaves at ${timeText(times[answerIdx])}, the latest time at or before ${timeText(deadline)}.`,
      proof: { family, givens: { names: order.map(i => names[i]), times: order.map(i => times[i]), deadline } },
      visual: { kind: 'v3-class-5-timetable', rows, description: `A departures board: ${rows.map(row => `${row.name} ${row.value}`).join(', ')}.` },
      choices: answerChoices(answer, [
        wrong(names[others[0]], 'position-end'),
        wrong(names[others[1]], 'ignored-condition'),
        wrong(names[others[others.length - 1]], 'ignored-condition'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-time-24hr-convert') {
    if (level === 1) {
      const hour24 = r.int(0, 23);
      const minute = r.pick([0, 15, 30, 45]);
      const period = hour24 < 12 ? 'AM' : 'PM';
      const hour12 = hour24 % 12 || 12;
      const answer = `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
      const rawHourWrong = hour24 !== hour12
        ? `${hour24}:${String(minute).padStart(2, '0')} ${period}`
        : `${hour12}:${String((minute + 15) % 60).padStart(2, '0')} ${period}`;
      return {
        family, prompt: `A mission log shows the 24-hour time ${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}. Write this as a 12-hour time with AM or PM.`, answer,
        hint: 'Hours 00-11 are AM; hours 12-23 are PM (subtract 12 from 13-23 for the 12-hour hour).',
        explanation: `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')} is ${answer}.`,
        proof: { family, givens: { hour24, minute } },
        choices: answerChoices(answer, [
          wrong(`${hour12}:${String(minute).padStart(2, '0')} ${period === 'AM' ? 'PM' : 'AM'}`, 'class-5-ampm-confuse'),
          wrong(rawHourWrong, 'class-5-ampm-confuse'),
          wrong(`${hour12 === 12 ? 1 : hour12 + 1}:${String(minute).padStart(2, '0')} ${period}`, 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const hour12 = r.int(1, 12);
      const minute = r.pick([0, 15, 30, 45]);
      const period = r.pick(['AM', 'PM']);
      const hour24 = period === 'AM' ? (hour12 === 12 ? 0 : hour12) : (hour12 === 12 ? 12 : hour12 + 12);
      const answer = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      return {
        family, prompt: `Write ${hour12}:${String(minute).padStart(2, '0')} ${period} as a 24-hour time.`, answer,
        hint: 'For AM, keep 12 as 00 and keep other hours the same; for PM, add 12 (but 12 PM stays 12).',
        explanation: `${hour12}:${String(minute).padStart(2, '0')} ${period} is ${answer} in 24-hour time.`,
        proof: { family, givens: { hour12, minute, period } },
        choices: answerChoices(answer, [
          wrong(`${String((hour24 + 12) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, 'class-5-ampm-confuse'),
          wrong(`${String(hour24).padStart(2, '0')}:${String((minute + 15) % 60).padStart(2, '0')}`, 'missing-step'),
          wrong(`${String((hour24 + 1) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    const startMinutes = r.int(0, 1439);
    const elapsed = r.int(30, 300);
    const endMinutes = (startMinutes + elapsed) % 1440;
    const fmt24 = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const answer = fmt24(endMinutes);
    const wrapped = startMinutes + elapsed >= 1440;
    return {
      family, prompt: `A craft departs at ${fmt24(startMinutes)} (24-hour time) and travels for ${fmtDuration(elapsed)}. What 24-hour time does it arrive?`, answer,
      hint: 'Add the travel time to the departure time; if you pass midnight, continue counting from 00:00.',
      explanation: `${fmt24(startMinutes)} plus ${fmtDuration(elapsed)} is ${answer}${wrapped ? ' (the trip crosses midnight)' : ''}.`,
      proof: { family, givens: { startMinutes, elapsed } },
      choices: answerChoices(answer, [
        wrong(fmt24(startMinutes), 'missing-step'),
        wrong(fmt24(((startMinutes - elapsed) % 1440 + 1440) % 1440), 'wrong-operation'),
        wrong(fmt24((startMinutes + elapsed + 60) % 1440), 'hour-carry'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-price-board-bundle') {
    const boardSize = level === 1 ? 4 : level === 2 ? 5 : 6;
    const items = r.shuffle(SPACE_ITEMS).slice(0, boardSize);
    // Distinct whole-rupee prices (as paise) so no two board rows ever show the same price.
    const prices = r.shuffle(Array.from({ length: 30 }, (_, i) => (i + 3) * 100)).slice(0, boardSize);
    const rows = items.map((name, i) => ({ name: cap(name), value: fmtRs(prices[i]) }));
    const description = `A supply price board listing ${rows.map(row => `${row.name} at ${row.value}`).join(', ')}.`;
    if (level === 1) {
      const [iA, iB] = [0, 1];
      const totalPaise = prices[iA] + prices[iB];
      const answer = fmtRs(totalPaise);
      const used = new Set([totalPaise]);
      return {
        family, prompt: `The supply board below lists prices. What is the total cost of 1 ${items[iA]} and 1 ${items[iB]}?`, answer,
        hint: "Find each item's price on the board, then add them.",
        explanation: `${fmtRs(prices[iA])} + ${fmtRs(prices[iB])} = ${answer}.`,
        proof: { family, givens: { items, prices, bundle: [{ index: iA, qty: 1 }, { index: iB, qty: 1 }] } },
        visual: { kind: 'v3-class-5-timetable', rows, description },
        choices: answerChoices(answer, [
          wrong(fmtRs(distinctNudge(prices[iA], used, 100)), 'price-total'),
          wrong(fmtRs(distinctNudge(prices[iB], used, 100)), 'price-total'),
          wrong(fmtRs(distinctNudge(totalPaise + prices[2], used, 100)), 'price-total'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const [iA, iB] = [0, 1];
      const [qtyA, qtyB] = r.shuffle([2, 3, 4]).slice(0, 2);
      const totalPaise = prices[iA] * qtyA + prices[iB] * qtyB;
      const answer = fmtRs(totalPaise);
      const used = new Set([totalPaise]);
      return {
        family, prompt: `The supply board below lists prices. What is the total cost of ${qtyA} ${plural(qtyA, items[iA])} and ${qtyB} ${plural(qtyB, items[iB])}?`, answer,
        hint: 'Multiply each price by its quantity, then add the two totals.',
        explanation: `${qtyA} x ${fmtRs(prices[iA])} + ${qtyB} x ${fmtRs(prices[iB])} = ${answer}.`,
        proof: { family, givens: { items, prices, bundle: [{ index: iA, qty: qtyA }, { index: iB, qty: qtyB }] } },
        visual: { kind: 'v3-class-5-timetable', rows, description },
        choices: answerChoices(answer, [
          wrong(fmtRs(distinctNudge(prices[iA] * qtyA + prices[iB], used, 100)), 'missing-step'),
          wrong(fmtRs(distinctNudge(prices[iA] + prices[iB] * qtyB, used, 100)), 'missing-step'),
          wrong(fmtRs(distinctNudge(prices[iA] * qtyB + prices[iB] * qtyA, used, 100)), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    const [iA, iB, iC] = [0, 1, 2];
    const [qtyA, qtyB, qtyC] = r.shuffle([2, 3, 4]);
    const subtotalPaise = prices[iA] * qtyA + prices[iB] * qtyB + prices[iC] * qtyC;
    // Pay with a round amount strictly above the subtotal, so change is always a positive, clean value.
    const paidPaise = Math.ceil((subtotalPaise + 1) / 500) * 500 + r.pick([0, 500, 1000]);
    const changePaise = paidPaise - subtotalPaise;
    const answer = fmtRs(changePaise);
    const used = new Set([changePaise]);
    return {
      family, prompt: `The supply board below lists prices. The crew buys ${qtyA} ${plural(qtyA, items[iA])}, ${qtyB} ${plural(qtyB, items[iB])} and ${qtyC} ${plural(qtyC, items[iC])}, then pays with ${fmtRs(paidPaise)}. How much change do they get?`, answer,
      hint: 'Add up the cost of every item in the order for the subtotal, then subtract that from the amount paid.',
      explanation: `${qtyA} x ${fmtRs(prices[iA])} + ${qtyB} x ${fmtRs(prices[iB])} + ${qtyC} x ${fmtRs(prices[iC])} = ${fmtRs(subtotalPaise)}; ${fmtRs(paidPaise)} - ${fmtRs(subtotalPaise)} = ${answer}.`,
      proof: { family, givens: { items, prices, bundle: [{ index: iA, qty: qtyA }, { index: iB, qty: qtyB }, { index: iC, qty: qtyC }], paidPaise } },
      visual: { kind: 'v3-class-5-timetable', rows, description },
      choices: answerChoices(answer, [
        wrong(fmtRs(distinctNudge(subtotalPaise, used, 100)), 'change-order'),
        wrong(fmtRs(distinctNudge(paidPaise - (prices[iA] * qtyA + prices[iB] * qtyB), used, 100)), 'price-total'),
        wrong(fmtRs(distinctNudge(paidPaise + subtotalPaise, used, 100)), 'wrong-operation'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-discount-calc') {
    const item = r.pick(['thruster module', 'star chart', 'comet scanner', 'cargo drone', 'solar sail', 'nav beacon']);
    if (level === 1) {
      const k = r.int(2, 9);
      const price = k * 100;
      const pct = r.pick([10, 20, 25, 50]);
      const discountAmount = (price * pct) / 100;
      const finalPrice = price - discountAmount;
      const answer = rupees(finalPrice);
      const used = new Set([finalPrice]);
      return {
        family, prompt: `A ${item} is priced at Rs ${price}, with ${pct}% off. What is the final price?`, answer,
        hint: `Find ${pct}% of Rs ${price}, then subtract it from the price.`,
        explanation: `${pct}% of Rs ${price} is Rs ${discountAmount}; Rs ${price} - Rs ${discountAmount} = ${answer}.`,
        proof: { family, givens: { price, pct } },
        visual: { kind: 'v3-class-5-pricetag', price, priceLabel: item, discounts: [pct], description: `A price tag showing Rs ${price} for a ${item}, with a ${pct}% off ribbon.` },
        choices: answerChoices(answer, [
          wrong(rupees(distinctNudge(price - pct, used, 1)), 'class-5-percent-of-confuse'),
          wrong(rupees(distinctNudge(discountAmount, used, 1)), 'missing-step'),
          wrong(rupees(distinctNudge(price + discountAmount, used, 1)), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const k = r.int(2, 9);
      const price = k * 100;
      const pct = r.pick([10, 20, 25, 50]);
      const discountAmount = (price * pct) / 100;
      const finalPrice = price - discountAmount;
      const answer = rupees(price);
      const used = new Set([price]);
      return {
        family, prompt: `A ${item} now costs Rs ${finalPrice} after a ${pct}% discount. What was the original price?`, answer,
        hint: 'The final price is what remains after the discount is taken off the original price.',
        explanation: `Rs ${finalPrice} is ${100 - pct}% of the original price, so the original price is Rs ${price}.`,
        proof: { family, givens: { price, pct, ask: 'original' } },
        visual: { kind: 'v3-class-5-pricetag', price: finalPrice, priceLabel: `${item} (after discount)`, discounts: [], description: `A price tag showing the discounted price Rs ${finalPrice} for a ${item}.` },
        choices: answerChoices(answer, [
          wrong(rupees(distinctNudge(finalPrice, used, 1)), 'reversed-operation'),
          wrong(rupees(distinctNudge(finalPrice + pct, used, 1)), 'class-5-percent-of-confuse'),
          wrong(rupees(distinctNudge(Math.round(finalPrice + (finalPrice * pct) / 100), used, 1)), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    const k = r.int(2, 9);
    const price = k * 100;
    const [pct1, pct2] = [r.pick([10, 20, 50]), r.pick([10, 20, 50])];
    const afterFirst = (price * (100 - pct1)) / 100;
    const afterSecond = (afterFirst * (100 - pct2)) / 100;
    const answer = rupees(afterSecond);
    const used = new Set([afterSecond]);
    const addedPctWrong = (price * (100 - pct1 - pct2)) / 100;
    return {
      family, prompt: `A ${item} is priced at Rs ${price}. It has ${pct1}% off, then an extra ${pct2}% off the new price. What is the final price?`, answer,
      hint: 'Apply the first discount to the price, then apply the second discount to that new, smaller price -- not to the original price.',
      explanation: `Rs ${price} with ${pct1}% off is Rs ${afterFirst}; Rs ${afterFirst} with ${pct2}% off is ${answer}.`,
      proof: { family, givens: { price, pct1, pct2 } },
      visual: { kind: 'v3-class-5-pricetag', price, priceLabel: item, discounts: [pct1, pct2], description: `A price tag showing Rs ${price} for a ${item}, with a ${pct1}% off ribbon and a ${pct2}% off ribbon.` },
      choices: answerChoices(answer, [
        wrong(rupees(distinctNudge(addedPctWrong, used, 1)), 'class-5-percent-of-confuse'),
        wrong(rupees(distinctNudge(afterFirst, used, 1)), 'missing-step'),
        wrong(rupees(distinctNudge(price - afterSecond, used, 1)), 'missing-step'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-receipt-missing-price') {
    const rowCount = level === 1 ? 2 : 3;
    const names = r.shuffle(SPACE_ITEMS).slice(0, rowCount + 1);
    const knownPaise = Array.from({ length: rowCount }, () => r.int(100, 1500));
    if (level <= 2) {
      const missingPaise = r.int(100, 1500);
      const grandTotalPaise = sum(knownPaise) + missingPaise;
      const answer = fmtRs(missingPaise);
      const used = new Set([missingPaise]);
      const rows = [
        ...knownPaise.map((p, i) => ({ name: cap(names[i]), value: fmtRs(p) })),
        { name: cap(names[rowCount]), value: '?' },
        { name: 'Total', value: fmtRs(grandTotalPaise) },
      ];
      return {
        family, prompt: `The receipt below shows every item's price and the total paid. What is the missing price for the ${names[rowCount]}?`, answer,
        hint: 'Add up every known price, then subtract that sum from the total.',
        explanation: `${fmtRs(grandTotalPaise)} - (${knownPaise.map(fmtRs).join(' + ')}) = ${answer}.`,
        proof: { family, givens: { knownPaise, missingPaise, names } },
        visual: { kind: 'v3-class-5-timetable', rows, description: `A receipt listing ${rows.map(row => `${row.name}: ${row.value}`).join(', ')}.` },
        choices: answerChoices(answer, [
          wrong(fmtRs(distinctNudge(grandTotalPaise, used, 100)), 'price-total'),
          wrong(fmtRs(distinctNudge(sum(knownPaise), used, 100)), 'missing-step'),
          wrong(fmtRs(distinctNudge(grandTotalPaise - knownPaise[0], used, 100)), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    const qty = r.pick([2, 3]);
    const unitPaise = r.int(100, 600);
    const lineTotalPaise = unitPaise * qty;
    const grandTotalPaise = sum(knownPaise) + lineTotalPaise;
    const answer = fmtRs(unitPaise);
    const used = new Set([unitPaise]);
    const rows = [
      ...knownPaise.map((p, i) => ({ name: cap(names[i]), value: fmtRs(p) })),
      { name: `${qty} x ${cap(names[rowCount])}`, value: '?' },
      { name: 'Total', value: fmtRs(grandTotalPaise) },
    ];
    return {
      family, prompt: `The receipt below shows every line's price and the total paid. ${qty} ${plural(qty, names[rowCount])} were bought together for one price. What was the price of one ${names[rowCount]}?`, answer,
      hint: 'Subtract every known price from the total to find the missing line, then divide by the quantity.',
      explanation: `${fmtRs(grandTotalPaise)} - (${knownPaise.map(fmtRs).join(' + ')}) = ${fmtRs(lineTotalPaise)}; ${fmtRs(lineTotalPaise)} / ${qty} = ${answer}.`,
      proof: { family, givens: { knownPaise, unitPaise, qty, names, ask: 'unit' } },
      visual: { kind: 'v3-class-5-timetable', rows, description: `A receipt listing ${rows.map(row => `${row.name}: ${row.value}`).join(', ')}.` },
      choices: answerChoices(answer, [
        wrong(fmtRs(distinctNudge(lineTotalPaise, used, 100)), 'missing-step'),
        wrong(fmtRs(distinctNudge(grandTotalPaise, used, 100)), 'price-total'),
        wrong(fmtRs(distinctNudge(lineTotalPaise * qty, used, 100)), 'wrong-operation'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-best-value-compare') {
    const [itemName, itemIcon] = r.pick(SHELF_ITEMS);
    if (level === 1) {
      const [unitA, unitB] = r.shuffle([8, 10, 12, 14, 15, 16, 18, 20]).slice(0, 2);
      const [countA, countB] = r.shuffle([2, 3, 4, 5, 6]).slice(0, 2);
      const priceA = unitA * countA;
      const priceB = unitB * countB;
      const cheaperUnit = Math.min(unitA, unitB);
      const answer = rupees(cheaperUnit);
      const used = new Set([cheaperUnit]);
      return {
        family, prompt: `Pack A: ${countA} ${plural(countA, itemName)} for Rs ${priceA}. Pack B: ${countB} ${plural(countB, itemName)} for Rs ${priceB}. What is the best (lowest) price for just one ${itemName}?`, answer,
        hint: "Divide each pack's price by its count to find the price for one item, then compare.",
        explanation: `Pack A: Rs ${priceA} / ${countA} = Rs ${unitA} each. Pack B: Rs ${priceB} / ${countB} = Rs ${unitB} each. Rs ${cheaperUnit} is lower.`,
        proof: { family, givens: { unitA, unitB, countA, countB } },
        visual: {
          kind: 'v3-class-5-packcompare',
          packs: [{ label: 'Pack A', count: countA, price: `Rs ${priceA}`, icon: itemIcon }, { label: 'Pack B', count: countB, price: `Rs ${priceB}`, icon: itemIcon }],
          description: `Two packs of ${itemName}s: Pack A has ${countA} for Rs ${priceA}; Pack B has ${countB} for Rs ${priceB}.`,
        },
        choices: answerChoices(answer, [
          wrong(rupees(distinctNudge(Math.max(unitA, unitB), used, 1)), 'class-5-best-value'),
          wrong(rupees(distinctNudge(priceA, used, 1)), 'missing-step'),
          wrong(rupees(distinctNudge(priceB, used, 1)), 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const [unitA, unitB, unitC] = r.shuffle([8, 10, 12, 14, 15, 16, 18, 20, 24]).slice(0, 3);
      const [countA, countB, countC] = r.shuffle([2, 3, 4, 5, 6, 8]).slice(0, 3);
      const priceA = unitA * countA;
      const priceB = unitB * countB;
      const priceC = unitC * countC;
      const cheapestUnit = Math.min(unitA, unitB, unitC);
      const cheapestPrice = cheapestUnit === unitA ? priceA : cheapestUnit === unitB ? priceB : priceC;
      const answer = rupees(cheapestUnit);
      const used = new Set([cheapestUnit]);
      const others = [unitA, unitB, unitC].filter(u => u !== cheapestUnit);
      return {
        family, prompt: `Pack A: ${countA} ${plural(countA, itemName)} for Rs ${priceA}. Pack B: ${countB} ${plural(countB, itemName)} for Rs ${priceB}. Pack C: ${countC} ${plural(countC, itemName)} for Rs ${priceC}. What is the best (lowest) price for just one ${itemName}?`, answer,
        hint: "Divide each pack's price by its count to find the price for one item, then compare all three.",
        explanation: `Unit prices: Rs ${unitA}, Rs ${unitB}, Rs ${unitC}. Rs ${cheapestUnit} is the lowest.`,
        proof: { family, givens: { unitA, unitB, unitC, countA, countB, countC } },
        visual: {
          kind: 'v3-class-5-packcompare',
          packs: [
            { label: 'Pack A', count: countA, price: `Rs ${priceA}`, icon: itemIcon },
            { label: 'Pack B', count: countB, price: `Rs ${priceB}`, icon: itemIcon },
            { label: 'Pack C', count: countC, price: `Rs ${priceC}`, icon: itemIcon },
          ],
          description: `Three packs of ${itemName}s: Pack A has ${countA} for Rs ${priceA}; Pack B has ${countB} for Rs ${priceB}; Pack C has ${countC} for Rs ${priceC}.`,
        },
        choices: answerChoices(answer, [
          wrong(rupees(distinctNudge(others[0], used, 1)), 'class-5-best-value'),
          wrong(rupees(distinctNudge(others[1], used, 1)), 'class-5-best-value'),
          wrong(rupees(distinctNudge(cheapestPrice, used, 1)), 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    let unitA, unitB, unitC, countA, countB, countC, priceA, priceB, priceC, needed, totalCostA, totalCostB, totalCostC;
    do {
      [unitA, unitB, unitC] = r.shuffle([8, 10, 12, 14, 15, 16, 18, 20, 24]).slice(0, 3);
      [countA, countB, countC] = r.shuffle([2, 3, 4, 5, 6, 8]).slice(0, 3);
      priceA = unitA * countA;
      priceB = unitB * countB;
      priceC = unitC * countC;
      needed = r.int(10, 20);
      totalCostA = Math.ceil(needed / countA) * priceA;
      totalCostB = Math.ceil(needed / countB) * priceB;
      totalCostC = Math.ceil(needed / countC) * priceC;
    } while (new Set([totalCostA, totalCostB, totalCostC]).size !== 3 || [priceA, priceB, priceC].includes(Math.min(totalCostA, totalCostB, totalCostC)));
    const packs = [
      { label: 'Pack A', count: countA, price: priceA, cost: totalCostA, icon: itemIcon },
      { label: 'Pack B', count: countB, price: priceB, cost: totalCostB, icon: itemIcon },
      { label: 'Pack C', count: countC, price: priceC, cost: totalCostC, icon: itemIcon },
    ];
    const cheapest = packs.reduce((best, p) => (p.cost < best.cost ? p : best));
    const sortedCosts = packs.map(p => p.cost).sort((a, b) => a - b);
    const answer = rupees(cheapest.cost);
    const used = new Set([cheapest.cost]);
    const naiveFloorCost = Math.floor(needed / cheapest.count) * cheapest.price;
    return {
      family, prompt: `The crew needs at least ${needed} ${plural(needed, itemName)}. Using whole packs of just one type from the board below, what is the lowest total cost that covers the need?`, answer,
      hint: 'For each pack, round the number of packs needed up to a whole number, multiply by its price, then compare the three totals.',
      explanation: `Pack A needs ${Math.ceil(needed / countA)} ${noun(Math.ceil(needed / countA), 'pack', 'packs')} (Rs ${totalCostA}); Pack B needs ${Math.ceil(needed / countB)} ${noun(Math.ceil(needed / countB), 'pack', 'packs')} (Rs ${totalCostB}); Pack C needs ${Math.ceil(needed / countC)} ${noun(Math.ceil(needed / countC), 'pack', 'packs')} (Rs ${totalCostC}). The lowest is ${answer}.`,
      proof: { family, givens: { unitA, unitB, unitC, countA, countB, countC, needed } },
      visual: {
        kind: 'v3-class-5-packcompare',
        packs: packs.map(p => ({ label: p.label, count: p.count, price: `Rs ${p.price}`, icon: p.icon })),
        description: `Three packs of ${itemName}s: Pack A has ${countA} for Rs ${priceA}; Pack B has ${countB} for Rs ${priceB}; Pack C has ${countC} for Rs ${priceC}. The crew needs at least ${needed}.`,
      },
      choices: answerChoices(answer, [
        wrong(rupees(distinctNudge(sortedCosts[1], used, 1)), 'class-5-best-value'),
        wrong(rupees(distinctNudge(sortedCosts[2], used, 1)), 'class-5-best-value'),
        wrong(rupees(distinctNudge(naiveFloorCost, used, 1)), 'missing-step'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-budget-condition') {
    if (level === 2) {
      const picked = r.shuffle(SHELF_ITEMS).slice(0, 4);
      const prices = r.shuffle(Array.from({ length: 24 }, (_, i) => (i + 3) * 25)).slice(0, 4);
      const sortedIdx = [0, 1, 2, 3].sort((a, b) => prices[a] - prices[b]);
      const maxIdx = sortedIdx[3];
      const secondIdx = sortedIdx[2];
      const total = sum(prices);
      const budget = r.int(total - prices[maxIdx], total - prices[secondIdx] - 1);
      // Answer options reuse the shelf card's own short label (lowercased for mid-sentence prose) so the
      // picture and the options always name each item exactly the same way.
      const shortNames = picked.map(p => p[2].toLowerCase());
      const answer = shortNames[maxIdx];
      const items = picked.map(([, icon, label], i) => ({ name: label, icon, price: `Rs ${prices[i]}` }));
      return {
        family, prompt: `The crew has a budget of Rs ${budget} but wants all 4 supplies below. Which one should they leave out to stay within budget?`, answer,
        hint: "Add all four prices, then check which single item's price covers the amount over budget.",
        explanation: `The four items cost ${prices.map(p => `Rs ${p}`).join(' + ')} = Rs ${total}, which is Rs ${total - budget} over budget. Leaving out the ${answer} (Rs ${prices[maxIdx]}) brings the total to Rs ${total - prices[maxIdx]}, within budget.`,
        proof: { family, givens: { names: shortNames, prices } },
        visual: { kind: 'v3-class-5-itemshelf', items, description: `A supply shelf with ${items.map(it => `${it.name} at ${it.price}`).join(', ')}.` },
        choices: answerChoices(answer, sortedIdx.slice(0, 3).map(i => wrong(shortNames[i], 'ignored-condition')), count, null, KNOWN),
      };
    }
    if (level === 1) {
      const picked = r.shuffle(SHELF_ITEMS).slice(0, 4);
      const prices = r.shuffle(Array.from({ length: 24 }, (_, i) => (i + 3) * 25)).slice(0, 4);
      const sortedIdx = [0, 1, 2, 3].sort((a, b) => prices[a] - prices[b]);
      const shortNames = picked.map(p => p[2].toLowerCase());
      const items = picked.map(([, icon, label], i) => ({ name: label, icon, price: `Rs ${prices[i]}` }));
      const visual = { kind: 'v3-class-5-itemshelf', items, description: `A supply shelf with ${items.map(it => `${it.name} at ${it.price}`).join(', ')}.` };
      const ask = r.pick(['dearest', 'left']);
      if (ask === 'left') {
        const cheapest = prices[sortedIdx[0]];
        const budget = cheapest + r.int(1, 12) * 25;
        const answer = rupees(budget - cheapest);
        const used = new Set([budget - cheapest]);
        return {
          family, prompt: `The crew has Rs ${budget} and buys the cheapest item on the shelf below. How much money is left?`, answer,
          hint: 'Find the lowest price on the shelf, then subtract it from the money the crew has.',
          explanation: `The cheapest item costs Rs ${cheapest}. Rs ${budget} - Rs ${cheapest} = ${answer}.`,
          proof: { family, givens: { names: shortNames, prices, budget, ask } },
          visual,
          choices: answerChoices(answer, [
            wrong(rupees(distinctNudge(budget - prices[sortedIdx[3]], used, 1)), 'ignored-condition'),
            wrong(rupees(distinctNudge(cheapest, used, 1)), 'missing-step'),
            wrong(rupees(distinctNudge(budget + cheapest, used, 1)), 'wrong-operation'),
          ], count, null, KNOWN),
        };
      }
      const k = r.int(0, 2);
      const budget = prices[sortedIdx[k]] + r.int(0, prices[sortedIdx[k + 1]] - prices[sortedIdx[k]] - 1);
      const answer = shortNames[sortedIdx[k]];
      const affordable = sortedIdx.slice(0, k + 1).map(i => `${shortNames[i]} (Rs ${prices[i]})`).join(', ');
      return {
        family, prompt: `The crew has Rs ${budget}. Which is the most expensive single item on the shelf below that they can afford?`, answer,
        hint: 'Find the items that cost no more than the money the crew has, then pick the dearest of them.',
        explanation: `With Rs ${budget} they can afford: ${affordable}. The dearest of these is the ${answer}.`,
        proof: { family, givens: { names: shortNames, prices, budget, ask } },
        visual,
        choices: answerChoices(answer, sortedIdx.filter(i => shortNames[i] !== answer).map(i => wrong(shortNames[i], 'ignored-condition')), count, null, KNOWN),
      };
    }
    let picked, prices, sortedSums;
    do {
      picked = r.shuffle(SHELF_ITEMS).slice(0, 4);
      prices = r.shuffle(Array.from({ length: 24 }, (_, i) => (i + 3) * 25)).slice(0, 4);
      const pairs = [];
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) pairs.push(prices[i] + prices[j]);
      sortedSums = [...pairs].sort((a, b) => a - b);
    } while (new Set(sortedSums).size !== sortedSums.length);
    const k = r.int(1, sortedSums.length - 2);
    const budget = sortedSums[k] + r.int(0, sortedSums[k + 1] - sortedSums[k] - 1);
    const answer = rupees(sortedSums[k]);
    const used = new Set([sortedSums[k]]);
    const items = picked.map(([, icon, label], i) => ({ name: label, icon, price: `Rs ${prices[i]}` }));
    return {
      family, prompt: `The crew has a budget of Rs ${budget}. Using the supply shelf below, what is the greatest total they can spend on exactly 2 items without going over budget?`, answer,
      hint: 'Work out the total cost for pairs of two items, then pick the greatest total that still fits the budget.',
      explanation: `The pair totals are ${[...sortedSums].map(s => `Rs ${s}`).join(', ')}. The greatest that is not over Rs ${budget} is ${answer}.`,
      proof: { family, givens: { names: picked.map(p => p[0]), prices, budget } },
      visual: { kind: 'v3-class-5-itemshelf', items, description: `A supply shelf with ${items.map(it => `${it.name} at ${it.price}`).join(', ')}.` },
      choices: answerChoices(answer, [
        wrong(rupees(distinctNudge(sortedSums[k + 1], used, 1)), 'ignored-condition'),
        wrong(rupees(distinctNudge(sortedSums[sortedSums.length - 1], used, 1)), 'ignored-condition'),
        wrong(rupees(distinctNudge(budget, used, 1)), 'missing-step'),
      ], count, null, KNOWN),
    };
  }

  // ---- data -------------------------------------------------------------
  if (family === 'class-5-pictograph-key-scale') {
    const key = r.pick([2, 5]);
    if (level === 3) {
      const otherIcons = [r.int(2, 4), r.int(2, 4), r.int(2, 4)];
      const maxIcons = sum(otherIcons) + r.int(1, 4);
      const icons = r.shuffle([...otherIcons, maxIcons]);
      const values = icons.map(c => c * key);
      const maxV = Math.max(...values);
      const answer = String(2 * maxV - sum(values));
      const rows = OUTPOST_NAMES.map((label, i) => ({ label, count: icons[i] }));
      const totalIcons = sum(icons);
      return {
        family, prompt: `The pictograph below shows crates delivered to each outpost; the symbol counts add up to ${totalIcons} in total. How many more did the busiest outpost receive than all the other outposts added together?`, answer,
        hint: 'Multiply each row by the key to find its value, then subtract the sum of the other rows from the busiest row.',
        explanation: `Each row's value is its symbol count x ${key}. The busiest outpost's total minus the sum of the other three is ${answer}.`,
        proof: { family, givens: { icons, key } },
        visual: { kind: 'v3-class-5-pictograph', rows, key, description: `A pictograph with a key of each symbol = ${key} crates. ${rows.map(row => `${row.label} shows ${row.count} symbols`).join(', ')}.` },
        choices: answerChoices(answer, [
          wrong(String(2 * (Math.max(...icons) * (key === 2 ? 5 : 2)) - sum(icons) * (key === 2 ? 5 : 2)), 'graph-key'),
          wrong(String(maxV - Math.max(...values.filter(v => v !== maxV))), 'ignored-condition'),
          wrong(String(maxV), 'missing-step'),
        ], count, null, KNOWN),
      };
    }
    const icons = Array.from({ length: 4 }, () => r.int(2, 7));
    const values = icons.map(c => c * key);
    const rows = OUTPOST_NAMES.map((label, i) => ({ label, count: icons[i] }));
    const description = `A pictograph with a key of each symbol = ${key} crates. ${rows.map(row => `${row.label} shows ${row.count} symbols`).join(', ')}.`;
    if (level === 1) {
      const idx = r.int(0, 3);
      const answer = String(values[idx]);
      const [otherA, otherB] = r.shuffle([0, 1, 2, 3].filter(i => i !== idx)).slice(0, 2);
      return {
        family, prompt: `The pictograph below shows crates delivered to each outpost. How many crates did ${OUTPOST_NAMES[idx]} receive?`, answer,
        hint: 'Count the symbols on that row, then multiply by the key.',
        explanation: `${OUTPOST_NAMES[idx]} shows ${icons[idx]} symbols, and each symbol is worth ${key} crates, so ${icons[idx]} x ${key} = ${answer}.`,
        proof: { family, givens: { icons, key, idx } },
        visual: { kind: 'v3-class-5-pictograph', rows, key, description },
        choices: answerChoices(answer, [
          wrong(String(values[otherA]), 'class-5-chart-row'),
          wrong(String(values[otherB]), 'class-5-chart-row'),
          wrong(String(icons[idx] * (key === 2 ? 5 : 2)), 'graph-key'),
        ], count, null, KNOWN),
      };
    }
    const [a, b] = r.shuffle([0, 1, 2, 3]).slice(0, 2);
    const op = r.pick(['sum', 'diff']);
    const answer = String(op === 'sum' ? values[a] + values[b] : Math.abs(values[a] - values[b]));
    const [c, d] = [0, 1, 2, 3].filter(i => i !== a && i !== b);
    const crossOp = ([x, y]) => (op === 'sum' ? values[x] + values[y] : Math.abs(values[x] - values[y]));
    return {
      family, prompt: `The pictograph below shows crates delivered to each outpost. ${op === 'sum' ? `What is the total number of crates ${OUTPOST_NAMES[a]} and ${OUTPOST_NAMES[b]} received together?` : `What is the difference in crates received between ${OUTPOST_NAMES[a]} and ${OUTPOST_NAMES[b]}?`}`, answer,
      hint: 'Multiply each row by the key to find its value, then add or subtract as asked.',
      explanation: `${OUTPOST_NAMES[a]} received ${values[a]} crates and ${OUTPOST_NAMES[b]} received ${values[b]} crates, so the ${op === 'sum' ? 'total' : 'difference'} is ${answer}.`,
      proof: { family, givens: { icons, key, a, b, op } },
      visual: { kind: 'v3-class-5-pictograph', rows, key, description },
      choices: answerChoices(answer, [
        wrong(String(op === 'sum' ? Math.abs(values[a] - values[b]) : values[a] + values[b]), 'wrong-operation'),
        wrong(String(crossOp([a, c])), 'class-5-chart-row'),
        wrong(String(crossOp([b, d])), 'class-5-chart-row'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-bar-chart-unusual-scale') {
    const step = r.pick([3, 4, 6, 7, 8, 9, 12, 14]);
    const maxMultiple = r.int(5, 8);
    const max = step * maxMultiple;
    const pool = Array.from({ length: maxMultiple - 1 }, (_, i) => i + 1);
    const picks = r.shuffle(pool).slice(0, 4);
    const values = picks.map(m => m * step);
    const bars = OUTPOST_NAMES.map((label, i) => ({ label, value: values[i] }));
    const description = `A bar chart with gridlines every ${step}. ${bars.map(b => `${b.label} reaches ${b.value}`).join(', ')}.`;
    if (level === 1) {
      const idx = r.int(0, 3);
      const answer = String(values[idx]);
      const direction = r.pick([1, -1]);
      const [otherA, otherB] = r.shuffle([0, 1, 2, 3].filter(i => i !== idx)).slice(0, 2);
      return {
        family, prompt: `The bar chart below shows cargo units handled by each outpost. How many cargo units did ${OUTPOST_NAMES[idx]} handle?`, answer,
        hint: 'Follow the bar up to its top, then read across to the gridline value.',
        explanation: `${OUTPOST_NAMES[idx]}'s bar reaches ${answer} on the scale.`,
        proof: { family, givens: { values, idx } },
        visual: { kind: 'v3-class-5-barchart', bars, max, step, description },
        choices: answerChoices(answer, [
          wrong(String(values[idx] + direction * step), 'scale-interval'),
          wrong(String(values[otherA]), 'class-5-chart-row'),
          wrong(String(values[otherB]), 'class-5-chart-row'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const [a, b] = r.shuffle([0, 1, 2, 3]).slice(0, 2);
      const [c, d] = [0, 1, 2, 3].filter(i => i !== a && i !== b);
      const op = r.pick(['sum', 'diff']);
      const answer = String(op === 'sum' ? values[a] + values[b] : Math.abs(values[a] - values[b]));
      const direction = r.pick([1, -1]);
      return {
        family, prompt: `The bar chart below shows cargo units handled by each outpost. ${op === 'sum' ? `What is the combined total handled by ${OUTPOST_NAMES[a]} and ${OUTPOST_NAMES[b]}?` : `What is the difference between ${OUTPOST_NAMES[a]} and ${OUTPOST_NAMES[b]}?`}`, answer,
        hint: 'Read both bars from the scale first, then add or subtract as asked.',
        explanation: `${OUTPOST_NAMES[a]} reaches ${values[a]} and ${OUTPOST_NAMES[b]} reaches ${values[b]}, so the ${op === 'sum' ? 'total' : 'difference'} is ${answer}.`,
        proof: { family, givens: { values, a, b, op } },
        visual: { kind: 'v3-class-5-barchart', bars, max, step, description },
        choices: answerChoices(answer, [
          wrong(String(op === 'sum' ? Math.abs(values[a] - values[b]) : values[a] + values[b]), 'wrong-operation'),
          wrong(String(Number(answer) + direction * step), 'scale-interval'),
          wrong(String(op === 'sum' ? values[c] + values[d] : Math.abs(values[c] - values[d])), 'class-5-chart-row'),
        ], count, null, KNOWN),
      };
    }
    const maxV = Math.max(...values);
    const minV = Math.min(...values);
    const answer = String(maxV - minV);
    const sortedVals = [...values].sort((x, y) => y - x);
    const [dir1, dir2] = [r.pick([1, -1]), r.pick([1, -1])];
    return {
      family, prompt: `The bar chart below (gridlines every ${step}, up to ${max}) shows cargo units handled by each outpost. How many more did the busiest outpost handle than the quietest outpost?`, answer,
      hint: 'Find the tallest and shortest bars on the scale, then subtract.',
      explanation: `The busiest outpost reaches ${maxV} and the quietest reaches ${minV}, so the difference is ${answer}.`,
      proof: { family, givens: { values } },
      visual: { kind: 'v3-class-5-barchart', bars, max, step, description },
      choices: answerChoices(answer, [
        wrong(String(sortedVals[0] - sortedVals[2]), 'ignored-condition'),
        wrong(String(maxV - minV + dir1 * step), 'scale-interval'),
        wrong(String(maxV - minV + dir2 * (2 * step)), 'scale-interval'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-two-chart-compare') {
    const step = r.pick([5, 10]);
    const maxMultiple = r.int(5, 8);
    const max = step * maxMultiple;
    const pool = Array.from({ length: maxMultiple - 1 }, (_, i) => i + 1);
    let week1, week2, totals;
    do {
      week1 = r.shuffle(pool).slice(0, 4).map(m => m * step);
      week2 = r.shuffle(pool).slice(0, 4).map(m => m * step);
      totals = OUTPOST_NAMES.map((_, i) => week1[i] + week2[i]);
    } while (totals.filter(t => t === Math.max(...totals)).length > 1);
    const bars1 = OUTPOST_NAMES.map((label, i) => ({ label, value: week1[i] }));
    const bars2 = OUTPOST_NAMES.map((label, i) => ({ label, value: week2[i] }));
    const description = `Two bar charts with gridlines every ${step}. Week 1: ${bars1.map(b => `${b.label} reaches ${b.value}`).join(', ')}. Week 2: ${bars2.map(b => `${b.label} reaches ${b.value}`).join(', ')}.`;
    const visual = { kind: 'v3-class-5-twinchart', left: { title: 'Week 1', bars: bars1 }, right: { title: 'Week 2', bars: bars2 }, max, step, description };
    if (level === 1) {
      const idx = r.int(0, 3);
      const week = r.pick([1, 2]);
      const values = week === 1 ? week1 : week2;
      const otherValues = week === 1 ? week2 : week1;
      const answer = String(values[idx]);
      return {
        family, prompt: `The two charts below show cargo units handled by each outpost in Week 1 and Week 2. How many units did ${OUTPOST_NAMES[idx]} handle in Week ${week}?`, answer,
        hint: 'Find the chart for that week, then read that outpost\'s bar.',
        explanation: `In Week ${week}, ${OUTPOST_NAMES[idx]} reaches ${answer}.`,
        proof: { family, givens: { week1, week2, idx, week } },
        visual,
        choices: answerChoices(answer, [
          wrong(String(otherValues[idx]), 'ignored-condition'),
          wrong(String(values[r.pick([0, 1, 2, 3].filter(i => i !== idx))]), 'class-5-chart-row'),
          wrong(String(values[idx] + r.pick([1, -1]) * step), 'scale-interval'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const idx = r.int(0, 3);
      const answer = String(Math.abs(week2[idx] - week1[idx]));
      const otherIdx = r.pick([0, 1, 2, 3].filter(i => i !== idx));
      return {
        family, prompt: `The two charts below show cargo units handled by each outpost in Week 1 and Week 2. What is the difference for ${OUTPOST_NAMES[idx]} between the two weeks?`, answer,
        hint: 'Read that outpost\'s bar on both charts, then subtract the smaller from the larger.',
        explanation: `${OUTPOST_NAMES[idx]} reached ${week1[idx]} in Week 1 and ${week2[idx]} in Week 2, a difference of ${answer}.`,
        proof: { family, givens: { week1, week2, idx } },
        visual,
        choices: answerChoices(answer, [
          wrong(String(week2[idx] + week1[idx]), 'wrong-operation'),
          wrong(String(Math.abs(week2[otherIdx] - week1[otherIdx])), 'class-5-chart-row'),
          wrong(String(Math.abs(week2[idx] - week1[idx]) + r.pick([1, -1]) * step), 'scale-interval'),
        ], count, null, KNOWN),
      };
    }
    const bestIdx = totals.indexOf(Math.max(...totals));
    const answer = OUTPOST_NAMES[bestIdx];
    const wrongIdx = [0, 1, 2, 3].filter(i => i !== bestIdx);
    return {
      family, prompt: r.pick([
        `The two charts below (gridlines every ${step}, up to ${max}) show cargo units handled by each outpost in Week 1 and Week 2. Which outpost handled the greatest combined total across both weeks?`,
        `Look at both charts below (scale: every ${step}, up to ${max}). Which outpost's combined total across both weeks is the greatest?`,
      ]), answer,
      hint: 'Add each outpost\'s Week 1 and Week 2 values together, then compare the four totals.',
      explanation: `${answer}'s combined total of ${totals[bestIdx]} is the greatest of all four outposts.`,
      proof: { family, givens: { week1, week2 } },
      visual,
      choices: answerChoices(answer, wrongIdx.map(i => wrong(OUTPOST_NAMES[i], 'ignored-condition')), count, null, KNOWN),
    };
  }

  if (family === 'class-5-chart-after-transfer') {
    const step = r.pick([5, 10]);
    const maxMultiple = r.int(6, 9);
    const max = step * maxMultiple;
    const pool = Array.from({ length: maxMultiple - 2 }, (_, i) => i + 1);
    const before = r.shuffle(pool).slice(0, 4).map(m => m * step);
    const bars = OUTPOST_NAMES.map((label, i) => ({ label, value: before[i] }));
    const description = `A bar chart with gridlines every ${step}, before any transfer. ${bars.map(b => `${b.label} reaches ${b.value}`).join(', ')}.`;
    const visual = { kind: 'v3-class-5-barchart', bars, max, step, description };
    const idxPool = [0, 1, 2, 3];
    if (level === 1) {
      const [from, to] = r.shuffle(idxPool).slice(0, 2);
      const moved = step * r.int(1, Math.min(3, Math.floor(before[from] / step)));
      const ask = r.pick(['to', 'from']);
      const askName = ask === 'to' ? OUTPOST_NAMES[to] : OUTPOST_NAMES[from];
      const answer = String(ask === 'to' ? before[to] + moved : before[from] - moved);
      return {
        family, prompt: `The chart below shows fuel cells held by each outpost. ${moved} fuel cells move from ${OUTPOST_NAMES[from]} to ${OUTPOST_NAMES[to]}. How many does ${askName} have now?`, answer,
        hint: "Start from that outpost's bar, then add or subtract the amount that moved.",
        explanation: `${askName} started with ${ask === 'to' ? before[to] : before[from]} and ${ask === 'to' ? `gained ${moved}` : `gave away ${moved}`}, leaving ${answer}.`,
        proof: { family, givens: { before, from, to, moved, ask } },
        visual,
        choices: answerChoices(answer, [
          wrong(String(ask === 'to' ? before[to] : before[from]), 'graph-update'),
          wrong(String(ask === 'to' ? before[to] - moved : before[from] + moved), 'wrong-operation'),
          wrong(String((ask === 'to' ? before[to] : before[from]) + step), 'scale-interval'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const [from, to] = r.shuffle(idxPool).slice(0, 2);
      const other = r.pick(idxPool.filter(i => i !== from && i !== to));
      const moved = step * r.int(1, Math.min(3, Math.floor(before[from] / step)));
      const after = before.map((v, i) => (i === from ? v - moved : i === to ? v + moved : v));
      const answer = String(Math.abs(after[to] - after[other]));
      return {
        family, prompt: `The chart below shows fuel cells held by each outpost. ${moved} fuel cells move from ${OUTPOST_NAMES[from]} to ${OUTPOST_NAMES[to]}. Now what is the difference between ${OUTPOST_NAMES[to]} and ${OUTPOST_NAMES[other]}?`, answer,
        hint: 'Update the outposts in the transfer first, then compare.',
        explanation: `After the transfer, ${OUTPOST_NAMES[to]} has ${after[to]} and ${OUTPOST_NAMES[other]} has ${after[other]}, a difference of ${answer}.`,
        proof: { family, givens: { before, from, to, other, moved } },
        visual,
        choices: answerChoices(answer, [
          wrong(String(Math.abs(before[to] - before[other])), 'graph-update'),
          wrong(String(Math.abs(before[from] - before[other])), 'graph-update'),
          wrong(String(Math.abs(after[from] - after[other])), 'class-5-chart-row'),
        ], count, null, KNOWN),
      };
    }
    const [a, b, c] = r.shuffle(idxPool).slice(0, 3);
    const moved1 = step * r.int(1, Math.min(3, Math.floor(before[a] / step)));
    const afterFirst = before.map((v, i) => (i === a ? v - moved1 : i === b ? v + moved1 : v));
    const moved2 = step * r.int(1, Math.min(3, Math.floor(afterFirst[b] / step)));
    const afterSecond = afterFirst.map((v, i) => (i === b ? v - moved2 : i === c ? v + moved2 : v));
    const answer = String(afterSecond[c]);
    return {
      family, prompt: `The chart below shows fuel cells held by each outpost. ${moved1} move from ${OUTPOST_NAMES[a]} to ${OUTPOST_NAMES[b]}, then ${moved2} move from ${OUTPOST_NAMES[b]} to ${OUTPOST_NAMES[c]}. How many does ${OUTPOST_NAMES[c]} have now?`, answer,
      hint: 'Apply the first transfer, then apply the second transfer to the updated amounts.',
      explanation: `${OUTPOST_NAMES[c]} started with ${before[c]} and gained ${moved2} in the second transfer, giving ${answer}.`,
      proof: { family, givens: { before, a, b, c, moved1, moved2 } },
      visual,
      choices: answerChoices(answer, [
        wrong(String(before[c]), 'graph-update'),
        wrong(String(afterFirst[b]), 'missing-step'),
        wrong(String(afterSecond[a]), 'class-5-chart-row'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-average-balance') {
    const ctx = r.pick(CHART_CONTEXTS);
    const step = r.pick([2, 3, 4, 5]);
    if (level === 1) {
      const base = step * r.int(8, 14);
      const d1 = r.int(-2, 2);
      const d2 = r.int(-2, 2);
      const d3 = r.int(-2, 2);
      const d4 = -(d1 + d2 + d3);
      const values = [d1, d2, d3, d4].map(d => base + d * step);
      const answer = String(base);
      const bars = OUTPOST_NAMES.map((label, i) => ({ label, value: values[i] }));
      return {
        family, prompt: `The bar chart below shows the number of ${ctx.noun} ${ctx.did} at each of four outposts (gridlines every ${step}). What is the mean number of ${ctx.noun} ${ctx.did} per outpost?`, answer,
        hint: 'Add all four values, then divide by 4.',
        explanation: `${values.join(' + ')} = ${sum(values)}, and ${sum(values)} / 4 = ${answer}.`,
        proof: { family, givens: { values, mode: 'mean' } },
        visual: { kind: 'v3-class-5-barchart', bars, max: Math.max(...values) + step * 2, step, description: `A bar chart with gridlines every ${step}. ${bars.map(b => `${b.label} reaches ${b.value}`).join(', ')}.` },
        choices: answerChoices(answer, [
          wrong(String(sum(values)), 'class-5-average-total'),
          wrong(String(Math.round(sum(values) / 3)), 'class-5-average-total'),
          wrong(String(Math.max(...values)), 'ignored-condition'),
        ], count, null, KNOWN),
      };
    }
    if (level === 2) {
      const base = step * r.int(10, 16);
      const d0 = r.int(-2, 2);
      const d1 = r.int(-2, 2);
      const d2 = r.int(-2, 2);
      const d3 = r.int(-2, 2);
      const d5 = -(d0 + d1 + d2 + d3);
      const known = [d0, d1, d2, d3].map(d => base + d * step);
      const target = base;
      const need = base + d5 * step;
      const answer = String(need);
      const bars = OUTPOST_NAMES.map((label, i) => ({ label, value: known[i] }));
      return {
        family, prompt: `The bar chart below shows ${ctx.noun} ${ctx.did} at four outposts. A fifth outpost must bring the mean of all five to ${target}. How many ${ctx.noun} must the fifth outpost have ${ctx.did}?`, answer,
        hint: 'Multiply the target average by 5, then subtract the total already known.',
        explanation: `5 x ${target} = ${5 * target}, and ${5 * target} - ${sum(known)} = ${answer}.`,
        proof: { family, givens: { known, target } },
        visual: { kind: 'v3-class-5-barchart', bars, max: Math.max(...known) + step * 2, step, description: `A bar chart with gridlines every ${step}. ${bars.map(b => `${b.label} reaches ${b.value}`).join(', ')}.` },
        choices: answerChoices(answer, [
          wrong(String(Math.round(sum(known) / 4)), 'class-5-average-total'),
          wrong(String(5 * target), 'missing-step'),
          wrong(String(target), 'wrong-operation'),
        ], count, null, KNOWN),
      };
    }
    const base = step * r.int(8, 14);
    let d1 = r.int(-2, 2);
    const d2 = r.int(-2, 2);
    const d3 = r.int(-2, 2);
    if (d1 === 0 && d2 === 0 && d3 === 0) d1 = 2;
    const d4 = -(d1 + d2 + d3);
    const deviations = [d1, d2, d3, d4];
    const values = deviations.map(d => base + d * step);
    const mean = base;
    const answer = String(step * sum(deviations.filter(d => d > 0)));
    const bars = OUTPOST_NAMES.map((label, i) => ({ label, value: values[i] }));
    const maxV = Math.max(...values);
    const dir = r.pick([1, -1]);
    return {
      family, prompt: `The bar chart below shows ${ctx.noun} ${ctx.did} at four outposts. What is the smallest number of ${ctx.noun} that must move between outposts so all four end up with the same number?`, answer,
      hint: 'Find the mean first. Then add up how much each outpost above the mean must give away.',
      explanation: `The mean is ${sum(values)} / 4 = ${mean}. Outposts above it give away ${values.filter(v => v > mean).map(v => `${v} - ${mean}`).join(' + ')} = ${answer}.`,
      proof: { family, givens: { values, mode: 'balance' } },
      visual: { kind: 'v3-class-5-barchart', bars, max: maxV + step * 2, step, description: `A bar chart with gridlines every ${step}. ${bars.map(b => `${b.label} reaches ${b.value}`).join(', ')}.` },
      choices: answerChoices(answer, [
        wrong(String(Math.round(sum(values) / 3)), 'class-5-average-total'),
        wrong(String(maxV), 'ignored-condition'),
        wrong(String(Number(answer) + dir * step), 'wrong-operation'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-chart-statement-check') {
    const ctx = r.pick(CHART_CONTEXTS);
    const step = r.pick([5, 10]);
    let values;
    do {
      values = r.shuffle(Array.from({ length: 16 }, (_, i) => (i + 2) * step)).slice(0, 4);
    } while (new Set(values).size !== 4);
    const bars = OUTPOST_NAMES.map((label, i) => ({ label, value: values[i] }));
    const description = `A bar chart with gridlines every ${step}. ${bars.map(b => `${b.label} reaches ${b.value}`).join(', ')}.`;
    const max = Math.max(...values) + step * 2;
    const maxIdx = values.indexOf(Math.max(...values));
    const minIdx = values.indexOf(Math.min(...values));
    const pool = [];
    for (let a = 0; a < 4; a++) {
      pool.push({ shape: 'greatest', a, isTrue: a === maxIdx });
      pool.push({ shape: 'smallest', a, isTrue: a === minIdx });
    }
    if (level >= 2) {
      for (let a = 0; a < 4; a++) {
        for (let b = 0; b < 4; b++) if (a !== b) pool.push({ shape: 'greater', a, b, isTrue: values[a] > values[b] });
      }
    }
    if (level >= 3) {
      const [sa, sb] = r.shuffle([0, 1, 2, 3]).slice(0, 2);
      const trueTotal = values[sa] + values[sb];
      const falseTotal = trueTotal + step * r.pick([-2, -1, 1, 2]);
      pool.push({ shape: 'sum', a: sa, b: sb, total: trueTotal, isTrue: true });
      pool.push({ shape: 'sum', a: sa, b: sb, total: falseTotal, isTrue: false });
    }
    const render1 = p => chartStatement(p.shape, { ...p, noun: ctx.noun });
    const trues = pool.filter(p => p.isTrue);
    const falses = pool.filter(p => !p.isTrue);
    if (!trues.length || falses.length < 3) throw new QuestionRetry('Not enough true/false chart statements.');
    const truePick = r.pick(trues);
    const falsePicks = r.shuffle(falses).slice(0, 3);
    const answer = render1(truePick);
    const valueList = bars.map(b => `${b.label.replace('Outpost ', '')} ${b.value}`).join(', ');
    return {
      family, prompt: r.pick([
        `The bar chart below shows the number of ${ctx.noun} ${ctx.did} at each outpost (gridlines every ${step}). Which statement is true?`,
        `Look at the bar chart of ${ctx.noun} ${ctx.did} (scale: every ${step}, up to ${max}). Which one of these statements is true?`,
      ]), answer,
      hint: 'Read each bar against the gridlines, then test the statements one at a time.',
      explanation: `The bars read ${valueList}. So "${answer}" is true; each of the others is contradicted by these values.`,
      proof: { family, givens: { values, noun: ctx.noun, truePick: { shape: truePick.shape, a: truePick.a, b: truePick.b } } },
      visual: { kind: 'v3-class-5-barchart', bars, max, step, description },
      choices: answerChoices(answer, falsePicks.map(p => wrong(render1(p), 'class-5-chart-statement')), count, null, KNOWN),
    };
  }

  // reasoning -- Logic launchpad
  if (family === 'class-5-rank-queue-twoends') {
    if (level === 1) {
      const name = r.pick(CADET_NAMES);
      const P = r.int(4, 9);
      const Q = r.int(4, 9);
      const total = P + Q - 1;
      const classicSign = r.pick([1, -1]);
      const classic = classicSign === 1 ? P + Q : P + Q - 2;
      const jitterSign = r.pick([1, -1]);
      const jitter1 = total + jitterSign * 3;
      const jitter2 = total + jitterSign * 5;
      return {
        family,
        prompt: `${name} is ${P}${ordinal(P)} in the queue counting from the front, and ${Q}${ordinal(Q)} counting from the back. How many cadets are in the queue in total?`,
        answer: String(total),
        hint: 'Add the two positions, then subtract 1 because that cadet is counted in both.',
        explanation: `${name} is ${P}${ordinal(P)} from the front and ${Q}${ordinal(Q)} from the back: ${P} + ${Q} - 1 = ${total} cadets.`,
        proof: { family, givens: { P, Q } },
        visual: {
          kind: 'v3-class-5-queueline',
          markers: [{ frac: 0.5, sprite: 'astronaut', label: name }],
          band: null,
          description: `A queue line from front to back with ${name} marked partway along; the total number of cadets is not shown.`,
        },
        choices: answerChoices(String(total), [
          wrong(String(classic), 'class-5-queue-total'),
          wrong(String(jitter1), 'wrong-operation'),
          wrong(String(jitter2), 'ignored-condition'),
        ], count, null, KNOWN),
      };
    }
    // level === 3
    const [name1, name2] = r.shuffle(CADET_NAMES).slice(0, 2);
    const P = r.int(4, 9);
    const Q = r.int(4, 9);
    const G = r.int(1, 6);
    const total = P + G + Q;
    const sign1 = r.pick([1, -1]);
    const sign2 = r.pick([1, -1]);
    const d1 = total - G;
    const d2 = total + sign1 * 7;
    const d3 = total + sign2 * 8;
    return {
      family,
      prompt: `${name1} is ${P}${ordinal(P)} in the queue from the front, and ${name2} is ${Q}${ordinal(Q)} from the back. There ${G === 1 ? 'is' : 'are'} ${G} ${noun(G, 'cadet', 'cadets')} between them. How many cadets are in the queue in total?`,
      answer: String(total),
      hint: 'Add both positions and the number of cadets between them: each position already counts one of the two named cadets.',
      explanation: `${P} + ${G} + ${Q} = ${total} cadets are in the queue in total.`,
      proof: { family, givens: { P, Q, G } },
      visual: {
        kind: 'v3-class-5-queueline',
        markers: [
          { frac: 0.3, sprite: 'astronaut', label: name1 },
          { frac: 0.7, sprite: 'rover', label: name2 },
        ],
        band: [0.3, 0.7],
        description: `A queue line from front to back with ${name1} and ${name2} marked, and the gap between them shaded; the total number of cadets is not shown.`,
      },
      choices: answerChoices(String(total), [
        wrong(String(d1), 'class-5-queue-gap'),
        wrong(String(d2), 'wrong-operation'),
        wrong(String(d3), 'ignored-condition'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-grid-route-turns') {
    const SIZE = 9;
    const numForward = level === 1 ? 2 : 3;
    const { start, startFacing, segments, end } = buildRoute(r, SIZE, numForward, level === 3 ? 3 : 2);
    const positionText = p => `(${p.x + 1}, ${p.y + 1})`;
    const visual = {
      kind: 'v3-class-5-routegrid', size: SIZE, startX: start.x, startY: start.y, facing: startFacing,
      description: `A ${SIZE} by ${SIZE} grid with the rover's starting cell highlighted, facing ${FACING_WORDS[startFacing]}.`,
    };
    const trace = routeTrace(start, startFacing, segments);
    if (level === 2) {
      const ask = r.pick(['facing', 'column', 'row']);
      if (ask !== 'facing') {
        const answer = String((ask === 'column' ? end.x : end.y) + 1);
        const startValue = (ask === 'column' ? start.x : start.y) + 1;
        return {
          family,
          prompt: `The rover on the highlighted cell faces ${FACING_WORDS[startFacing]}. It ${routeText(segments)}. Counting from 1 at the ${ask === 'column' ? 'left' : 'top'}, which ${ask} is it in?`,
          answer,
          hint: 'Track the rover one move at a time. Moving up or down changes the row; moving left or right changes the column.',
          explanation: trace,
          proof: { family, givens: { start, startFacing, segments, ask } },
          visual,
          choices: answerChoices(answer, [
            wrong(String(startValue), 'class-5-route-turn'),
            wrong(String((ask === 'column' ? end.y : end.x) + 1), 'class-5-grid-axis'),
            wrong(String(Number(answer) + (Number(answer) > 2 ? -1 : 1)), 'class-5-route-turn'),
          ], count, null, KNOWN),
        };
      }
      const answer = FACING_WORDS[end.facing];
      const others = FACINGS.filter(f => f !== end.facing).map(f => FACING_WORDS[f]);
      return {
        family,
        prompt: `The rover on the highlighted cell faces ${FACING_WORDS[startFacing]}. It ${routeText(segments)}. Which direction is it facing when it stops?`,
        answer,
        hint: 'Only turns change the way the rover faces. Moving forward keeps the same direction.',
        explanation: (() => {
          let f = startFacing;
          const steps = segments.filter(seg => seg.turnBefore).map(seg => { f = turnFacing(f, seg.turnBefore); return `turn ${seg.turnBefore} to face ${FACING_WORDS[f]}`; });
          return `Start facing ${FACING_WORDS[startFacing]}, then ${steps.join(', then ')}. The rover stops facing ${answer}.`;
        })(),
        proof: { family, givens: { start, startFacing, segments, ask: 'facing' } },
        visual,
        choices: answerChoices(answer, others.map(word => wrong(word, 'turn-frame')), count, null, KNOWN),
      };
    }
    const answer = positionText(end);
    const noLastTurnSegs = segments.map((seg, i) => (i === segments.length - 1 ? { ...seg, turnBefore: null } : seg));
    const noLastTurnEnd = simulateRouteLenient(start.x, start.y, startFacing, noLastTurnSegs);
    const axisSwap = { x: end.y, y: end.x };
    const allReversedSegs = segments.map(seg => (seg.turnBefore ? { ...seg, turnBefore: seg.turnBefore === 'right' ? 'left' : 'right' } : seg));
    const allReversedEnd = simulateRouteLenient(start.x, start.y, startFacing, allReversedSegs);
    return {
      family,
      prompt: `The rover on the highlighted cell faces ${FACING_WORDS[startFacing]}. It ${routeText(segments)}. Top-left is (1,1). Where does it end up?`,
      answer,
      hint: 'Walk through each move one at a time, turning before you move when the instructions say to.',
      explanation: `${trace} The rover ends at ${answer}.`,
      proof: { family, givens: { start, startFacing, segments, ask: 'position' } },
      visual,
      choices: answerChoices(answer, [
        wrong(positionText(noLastTurnEnd), 'class-5-route-turn'),
        wrong(positionText(axisSwap), 'class-5-grid-axis'),
        wrong(positionText(allReversedEnd), 'turn-frame'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-combinations-count') {
    const ctx = r.pick([
      { A: 'suit colours', B: 'helmet styles', thing: 'outfits', who: 'cadet' },
      { A: 'main dishes', B: 'drinks', thing: 'meals', who: 'cadet' },
      { A: 'rover bodies', B: 'wheel types', thing: 'rover builds', who: 'team' },
      { A: 'badge colours', B: 'badge shapes', thing: 'badges', who: 'cadet' },
      { A: 'tent colours', B: 'tent sizes', thing: 'tents', who: 'crew' },
      { A: 'flag colours', B: 'flag symbols', thing: 'flags', who: 'crew' },
    ]);
    if (level === 1) {
      const X = r.int(3, 9);
      const Y = r.int(3, 9);
      const answer = X * Y;
      const classicSign = r.pick([1, -1]);
      const classic = classicSign === 1 ? X * (Y + 1) : (X - 1) * Y;
      const jitterSign = r.pick([1, -1]);
      const jitter1 = answer + jitterSign * (X + Y);
      const jitter2 = answer + jitterSign * (X + Y + 4);
      const cells = Array.from({ length: Y }, () => Array(X).fill(1));
      return {
        family,
        prompt: `Mission Control offers ${X} ${ctx.A} and ${Y} ${ctx.B}. Each ${ctx.who} picks one of each. How many different ${ctx.thing} are possible?`,
        answer: String(answer),
        hint: 'Multiply the number of choices in each group.',
        explanation: `Each of the ${X} ${ctx.A} can go with each of the ${Y} ${ctx.B}: ${X} x ${Y} = ${answer} ${ctx.thing}.`,
        proof: { family, givens: { X, Y } },
        visual: { kind: 'v3-class-5-combogrid', cells, description: `A grid with ${Y} rows and ${X} columns, every cell filled, showing every pairing of the ${X} ${ctx.A} with the ${Y} ${ctx.B}.` },
        choices: answerChoices(String(answer), [
          wrong(String(classic), 'class-5-combo-count'),
          wrong(String(jitter1), 'wrong-operation'),
          wrong(String(jitter2), 'ignored-condition'),
        ], count, null, KNOWN),
      };
    }
    const X = level === 2 ? r.int(3, 6) : r.int(4, 7);
    const Y = level === 2 ? r.int(3, 6) : r.int(4, 7);
    const forbidden = level === 2 ? 1 : 2;
    const total = X * Y;
    const answer = total - forbidden;
    const slots = r.shuffle(Array.from({ length: total }, (_, i) => i)).slice(0, forbidden);
    const cells = Array.from({ length: Y }, (_, row) => Array.from({ length: X }, (_, col) => (slots.includes(row * X + col) ? 2 : 1)));
    const classicSign = r.pick([1, -1]);
    const classic = classicSign === 1 ? total : total - forbidden - 1;
    const jitterSign = r.pick([1, -1]);
    const jitter1 = answer + jitterSign * (X + Y);
    const jitter2 = answer + jitterSign * (X + Y + 4);
    return {
      family,
      prompt: `Mission Control offers ${X} ${ctx.A} and ${Y} ${ctx.B}, but ${forbidden === 1 ? 'one pairing is' : 'two pairings are'} not allowed (crossed out below). Each ${ctx.who} picks one of each. How many allowed ${ctx.thing} are there?`,
      answer: String(answer),
      hint: `Count every pairing, then take away the ${forbidden === 1 ? 'crossed-out pairing' : 'two crossed-out pairings'}.`,
      explanation: `All pairings: ${X} x ${Y} = ${total}. Not allowed: ${forbidden}. So ${total} - ${forbidden} = ${answer} ${ctx.thing}.`,
      proof: { family, givens: { X, Y, forbidden } },
      visual: { kind: 'v3-class-5-combogrid', cells, description: `A grid with ${Y} rows and ${X} columns; every cell is filled except ${forbidden === 1 ? 'one, which is' : 'two, which are'} crossed out to show the pairing${forbidden === 1 ? '' : 's'} not allowed.` },
      choices: answerChoices(String(answer), [
        wrong(String(classic), 'class-5-combo-exclude'),
        wrong(String(jitter1), 'wrong-operation'),
        wrong(String(jitter2), 'ignored-condition'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-figure-matrix-analogy') {
    if (level === 1) {
      const pattern = r.pick(['abc', 'ab', 'aab', 'abb']);
      const [s1, s2, s3] = r.shuffle(ALL_SHAPES);
      const unit = { abc: [s1, s2, s3], ab: [s1, s2], aab: [s1, s1, s2], abb: [s1, s2, s2] }[pattern];
      const sequenceLen = r.int(5, 8);
      const answer = unit[(sequenceLen - 1) % unit.length];
      const items = Array.from({ length: sequenceLen }, (_, i) => (i === sequenceLen - 1 ? null : { shape: unit[i % unit.length], fill: BLUE }));
      const others = [...new Set(unit)].filter(shape => shape !== answer);
      const outsiders = r.shuffle(ALL_SHAPES.filter(shape => !unit.includes(shape)));
      const wrongs = [...others.map(shape => wrong(shape, 'repeat-unit')), ...outsiders.map(shape => wrong(shape, 'class-5-pattern-outside'))].slice(0, 3);
      return {
        family,
        prompt: 'The picture pattern below repeats. Which shape completes the pattern where the ? is?',
        answer,
        hint: 'Find the shortest group of shapes that repeats, then continue it to the ?.',
        explanation: `The group ${unit.join(', ')} repeats. Picture ${sequenceLen} is picture ${(sequenceLen - 1) % unit.length + 1} of the group, so the missing shape is a ${answer}.`,
        proof: { family, givens: { unit, sequenceLen } },
        visual: { kind: 'v3-class-5-iconseq', items, columns: sequenceLen, description: `A row of ${sequenceLen} shapes repeating a pattern, with the last shape replaced by a question mark.` },
        choices: answerChoices(answer, wrongs, count, null, KNOWN),
      };
    }
    const rule = level === 3 ? r.pick(['rowShape', 'colShape', 'swap']) : r.pick(['rowShape', 'colShape']);
    const [sA, sB] = r.shuffle(ALL_SHAPES).slice(0, 2);
    const [cL, cR] = r.shuffle(MATRIX_COLORS).slice(0, 2);
    const pic = (shape, colour) => ({ shape, fill: colour.fill });
    const cells = {
      rowShape: [pic(sA, cL), pic(sA, cR), pic(sB, cL)],
      colShape: [pic(sA, cL), pic(sB, cL), pic(sA, cR)],
      swap: [pic(sA, cL), pic(sB, cL), pic(sB, cR)],
    }[rule];
    const missingShape = rule === 'swap' ? sA : sB;
    const answer = `${cR.name} ${missingShape}`;
    const explanation = {
      rowShape: `Each row keeps one shape and each column keeps one colour, so the missing picture is a ${answer}.`,
      colShape: `Each row keeps one colour and each column keeps one shape, so the missing picture is a ${answer}.`,
      swap: `Row 2 is row 1 with the two shapes swapped and the colour changed to ${cR.name}, so the missing picture is a ${answer}.`,
    }[rule];
    return {
      family,
      prompt: 'The picture matrix below follows a rule. Which picture belongs where the ? is?',
      answer,
      hint: rule === 'swap' ? 'Compare row 1 with row 2: what changed in the shapes and what changed in the colour?' : 'Check what stays the same across each row, then what stays the same down each column.',
      explanation,
      proof: { family, givens: { rule, sA, sB, cRName: cR.name } },
      visual: { kind: 'v3-class-5-iconseq', items: [...cells, null], columns: 2, description: '2 by 2 picture matrix; the bottom-right picture is replaced by a question mark.' },
      choices: answerChoices(answer, [
        wrong(`${cL.name} ${missingShape}`, 'class-5-matrix-rule'),
        wrong(`${cR.name} ${missingShape === sA ? sB : sA}`, 'class-5-matrix-rule'),
        wrong(`${cL.name} ${missingShape === sA ? sB : sA}`, 'class-5-matrix-rule'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-path-count-grid') {
    if (level === 2) {
      const cols = r.int(2, 8);
      const rows = r.int(2, 5);
      const answer = countGridPaths(cols, rows, null);
      const classicSign = r.pick([1, -1]);
      const classic = answer + classicSign;
      const jitterSign = r.pick([1, -1]);
      const jitter1 = answer + jitterSign * (cols + rows);
      const jitter2 = answer + jitterSign * (cols * rows - Math.max(cols, rows) + 1);
      const bottomRow = Array.from({ length: cols + 1 }, (_, x) => countGridPaths(x, rows, null)).join(', ');
      return {
        family,
        prompt: 'A rover goes from A to B on the road grid below, moving only right or down. How many different routes can it take?',
        answer: String(answer),
        hint: 'Add the routes reaching each junction from the one above it and the one to its left.',
        explanation: `Each junction's count is the junction above plus the junction to its left. Along the bottom row the counts are ${bottomRow}, so B has ${answer}.`,
        proof: { family, givens: { cols, rows } },
        visual: { kind: 'v3-class-5-junctiongrid', cols, rows, blocked: null, description: `A road grid from junction A (top-left) to junction B (bottom-right), ${cols} blocks across and ${rows} blocks down.` },
        choices: answerChoices(String(answer), [
          wrong(String(classic), 'class-5-path-count'),
          wrong(String(jitter1), 'wrong-operation'),
          wrong(String(jitter2), 'ignored-condition'),
        ], count, null, KNOWN),
      };
    }
    // levels 1 and 3: one closed junction
    const cols = level === 1 ? r.int(2, 5) : r.int(4, 6);
    const rows = level === 1 ? r.int(2, 3) : r.int(3, 4);
    const blocked = { x: r.int(1, cols - 1), y: r.int(1, rows - 1) };
    const totalUnblocked = countGridPaths(cols, rows, null);
    const pathsToBlocked = countGridPaths(blocked.x, blocked.y, null);
    const pathsFromBlocked = countGridPaths(cols - blocked.x, rows - blocked.y, null);
    const answer = countGridPaths(cols, rows, blocked);
    const classicSign = r.pick([1, -1]);
    const classic = answer + classicSign;
    const jitterSign = r.pick([1, -1]);
    const jitter = answer + jitterSign * Math.max(2, pathsToBlocked);
    return {
      family,
      prompt: 'A rover goes from A to B on the road grid below, moving only right or down. One junction (marked with a cross) is closed. How many different routes avoid it?',
      answer: String(answer),
      hint: 'Count every route, then subtract the routes that pass through the closed junction.',
      explanation: `All routes: ${totalUnblocked}. Routes through the closed junction: ${pathsToBlocked} x ${pathsFromBlocked} = ${pathsToBlocked * pathsFromBlocked}. So ${totalUnblocked} - ${pathsToBlocked * pathsFromBlocked} = ${answer}.`,
      proof: { family, givens: { cols, rows, blocked } },
      visual: { kind: 'v3-class-5-junctiongrid', cols, rows, blocked, description: `A road grid from junction A (top-left) to junction B (bottom-right), ${cols} blocks across and ${rows} blocks down, with one junction crossed out and closed.` },
      choices: answerChoices(String(answer), [
        wrong(String(totalUnblocked), 'class-5-path-block'),
        wrong(String(classic), 'class-5-path-count'),
        wrong(String(jitter), 'wrong-operation'),
      ], count, null, KNOWN),
    };
  }

  if (family === 'class-5-truth-teller') {
    const n = level === 1 ? 4 : level === 2 ? 5 : 6;
    const numCorrect = n - 2;
    const names = r.shuffle(ROVER_NAMES).slice(0, n);
    const predicted = r.shuffle(names.map((_, i) => i + 1));
    const allIdx = predicted.map((_, i) => i);
    const correctIdx = r.shuffle(allIdx).slice(0, numCorrect);
    const remaining = allIdx.filter(i => !correctIdx.includes(i));
    const queriedIdx = r.pick(remaining);
    const otherSwapIdx = remaining.find(i => i !== queriedIdx);
    const askWho = level > 1 && r.int(0, 1) === 1;
    const placeText = idx => `${predicted[idx]}${ordinal(predicted[idx])}`;
    const answer = askWho ? names[otherSwapIdx] : placeText(otherSwapIdx);
    const rows = names.map((name, i) => ({ name, place: placeText(i), correct: correctIdx.includes(i) }));
    const wrongs = askWho
      ? [names[queriedIdx], ...correctIdx.map(i => names[i])].slice(0, 3).map(name => wrong(name, name === names[queriedIdx] ? 'class-5-truth-swap' : 'ignored-condition'))
      : [wrong(placeText(queriedIdx), 'class-5-truth-swap'), ...correctIdx.slice(0, 2).map(i => wrong(placeText(i), 'ignored-condition'))];
    return {
      family,
      prompt: `The board shows each rover's predicted place. Starred rovers finished exactly as predicted. The two rovers without a star swapped places with each other. ${askWho ? `Which rover actually finished ${placeText(queriedIdx)}?` : `What place did ${names[queriedIdx]} actually finish?`}`,
      answer,
      hint: 'The two rovers without a star must have swapped their predicted places with each other.',
      explanation: `${names[queriedIdx]} (predicted ${placeText(queriedIdx)}) and ${names[otherSwapIdx]} (predicted ${placeText(otherSwapIdx)}) have no star, so they swapped. ${askWho ? `${names[otherSwapIdx]} actually finished ${placeText(queriedIdx)}` : `${names[queriedIdx]} actually finished ${answer}`}.`,
      proof: { family, givens: { names, predicted, correctIdx, queriedIdx, askWho } },
      visual: { kind: 'v3-class-5-predictionboard', rows, description: "A prediction board listing each rover's name and predicted place; starred rovers finished exactly as predicted." },
      choices: answerChoices(answer, wrongs, count, null, KNOWN),
    };
  }

  throw new Error(`Unknown class-5 family: ${family}`);
}

// ---------------------------------------------------------------------------
// solve -- recomputes the answer only from proof.givens / visual.
// ---------------------------------------------------------------------------
export function solve(question) {
  if (REASONING_SOLVE[question.family]) return REASONING_SOLVE[question.family](question);
  if (MIXED_SOLVE[question.family]) return MIXED_SOLVE[question.family](question);
  if (REAL3_SOLVE[question.family]) return REAL3_SOLVE[question.family](question);
  const { family, proof } = question;
  const givens = proof?.givens ?? {};

  if (family === 'class-5-digit-card-extreme') {
    const { cards, target } = givens;
    const asc = [...cards].sort((a, b) => a - b);
    if (asc[0] === 0) {
      const firstNonZero = asc.findIndex(d => d !== 0);
      [asc[0], asc[firstNonZero]] = [asc[firstNonZero], asc[0]];
    }
    const desc = [...cards].sort((a, b) => b - a);
    return (target === 'greatest' ? desc : asc).join('');
  }

  if (family === 'class-5-number-line-round') {
    const { value, unit } = givens;
    return numberText(Math.round(value / unit) * unit);
  }

  if (family === 'class-5-roman-numeral-mix') {
    if ('toNumber' in givens) return givens.toNumber ? String(givens.n) : toRoman(givens.n);
    if ('base' in givens) return String(givens.add ? givens.base + givens.delta : givens.base - givens.delta);
    return String(givens.a + givens.move);
  }

  if (family === 'class-5-digit-riddle') {
    return String(givens.n);
  }

  if (family === 'class-5-compare-order-grid') {
    const { numbers, mode } = givens;
    const sorted = [...numbers].sort((a, b) => a - b);
    const fmt = value => numberText(value);
    if (mode === 'extreme') return fmt(givens.target === 'greatest' ? sorted[3] : sorted[0]);
    if (mode === 'order') return fmt(sorted[1]);
    const trueBank = [`${fmt(sorted[3])} > ${fmt(sorted[0])}`, `${fmt(sorted[0])} < ${fmt(sorted[1])}`, `${fmt(sorted[2])} > ${fmt(sorted[1])}`];
    return trueBank[givens.trueId];
  }

  if (family === 'class-5-place-value-expand') {
    const { digits, placeIndexFromRight, ask, delta } = givens;
    const len = digits.length;
    const placeIndex = len - 1 - placeIndexFromRight;
    const digit = digits[placeIndex];
    if (ask === 'digit') return String(digit);
    if (ask === 'value') return String(digit * Math.pow(10, placeIndexFromRight));
    const changed = [...digits];
    changed[placeIndex] = digit + delta;
    return String(fromDigits(changed));
  }

  // ---- operations --------------------------------------------------------
  if (family === 'class-5-bar-model-multistep') {
    const { total, part, partA, diff } = givens;
    if (partA !== undefined) return String(total - partA - (partA + diff));
    if (diff !== undefined) return String((total - diff) / 2);
    return String(total - part);
  }

  if (family === 'class-5-missing-digit-column') {
    const { top, bottom, hideIn, hideIndex } = givens;
    const value = hideIn === 'top' ? top : hideIn === 'bottom' ? bottom : top + bottom;
    return String(digitsOf(value)[hideIndex]);
  }

  if (family === 'class-5-factor-multiple-sort') {
    const { a, b, answer } = givens;
    if (answer !== undefined) return String(answer);
    return String(gcdOf(a, b));
  }

  if (family === 'class-5-schedule-meet-again') {
    return scheduleAnswer(givens);
  }

  if (family === 'class-5-equal-share-remainder') {
    const { total, groups, ask } = givens;
    const remainder = total % groups;
    const quotient = Math.floor(total / groups);
    if (ask === 'remainder' || ask === 'packs' || ask === 'remove') return String(remainder);
    if (ask === 'quotient' || ask === 'packsFull') return String(quotient);
    if (ask === 'extra') return String(groups * (quotient + 1) - total);
    return String(groups - remainder);
  }

  if (family === 'class-5-symbol-equation-chain') {
    const { kind, copies, sum, valueB, copiesA, sumA, copiesB, sum2, s1, s2, totals } = givens;
    if (kind === 'given') return String((sum - valueB) / copies);
    if (kind === 'chain') return String(sum2 - copiesB * (sumA / copiesA));
    if (kind === 'triple') return String((totals[0] + totals[1] + totals[2]) / 2 - totals[1]);
    if (kind === 'swap') return String(2 * (s1 + s2) / 3 - s2);
    if (kind === 'extra') return String(s1 - (s2 - s1));
    return String(sum / copies);
  }

  // ---- fractions -----------------------------------------------------------
  if (family === 'class-5-fraction-bar-equivalent') {
    const { num1, den1, k, ask } = givens;
    if (ask === 'missingTop') return String(num1 * k);
    if (ask === 'missingBottom') return String(den1 * k);
    return `${num1 * k}/${den1 * k}`;
  }

  if (family === 'class-5-fraction-number-line') {
    const { den, pointerAt, den0, num0, ask } = givens;
    if (den0 !== undefined) return `${num0}/${den0}`;
    return `${fractionLineTarget(ask, pointerAt, den)}/${den}`;
  }

  if (family === 'class-5-fraction-of-amount') {
    const { N, num, den, num1, den1, num2, den2, given } = givens;
    if (given !== undefined) return String(Math.round((given * den) / num));
    if (num1 !== undefined) {
      const reserved = (N * num1) / den1;
      return String((reserved * num2) / den2);
    }
    return String((N * num) / den);
  }

  if (family === 'class-5-fraction-left-after') {
    const { W, num1, den1, den2, num2, F } = givens;
    const remaining1 = (W * (den1 - num1)) / den1;
    if (den2 !== undefined) return String((remaining1 * (den2 - num2)) / den2);
    if (F !== undefined) return String(remaining1 - F);
    return String(remaining1);
  }

  if (family === 'class-5-fraction-compare-order') {
    const { fracs, target, trueId } = givens;
    const items = fracs.map(([num, den]) => ({ value: num / den, text: `${num}/${den}` }));
    const sorted = [...items].sort((a, b) => a.value - b.value);
    if (target !== undefined) return (target === 'greatest' ? sorted[3] : sorted[0]).text;
    if (trueId !== undefined) {
      const trueBank = [`${sorted[3].text} > ${sorted[0].text}`, `${sorted[0].text} < ${sorted[1].text}`, `${sorted[2].text} > ${sorted[1].text}`];
      return trueBank[trueId];
    }
    return sorted[1].text;
  }

  if (family === 'class-5-mixed-number-picture') {
    const { whole, num, den, ask } = givens;
    if (ask === 'improper') return String(whole * den + num);
    return `${whole} ${num}/${den}`;
  }

  // ---- decimals -----------------------------------------------------------
  if (family === 'class-5-decimal-grid-model') {
    const { shaded, ask } = givens;
    if (ask === 'complement') return ((100 - shaded) / 100).toFixed(2);
    if (ask === 'round') return (Math.round(shaded / 10) / 10).toFixed(1);
    return (shaded / 100).toFixed(2);
  }

  if (family === 'class-5-decimal-number-line') {
    const { base, baseTenths, index } = givens;
    if (baseTenths !== undefined) return ((baseTenths * 10 + index) / 100).toFixed(2);
    return (base + index / 10).toFixed(1);
  }

  if (family === 'class-5-decimal-place-value') {
    const { wholeDigits, fracDigits, highlightSide, highlightIndex, ask, delta } = givens;
    const digits = highlightSide === 'whole' ? wholeDigits : fracDigits;
    const digit = digits[highlightIndex];
    if (ask === 'value') {
      if (highlightSide === 'whole') return String(digit * Math.pow(10, 1 - highlightIndex));
      return (digit * (highlightIndex === 0 ? 0.1 : 0.01)).toFixed(2);
    }
    if (ask === 'change') {
      const changedDigits = [...digits];
      changedDigits[highlightIndex] = digit + delta;
      return highlightSide === 'whole'
        ? `${changedDigits[0]}${changedDigits[1]}.${fracDigits[0]}${fracDigits[1]}`
        : `${wholeDigits[0]}${wholeDigits[1]}.${changedDigits[0]}${changedDigits[1]}`;
    }
    return String(digit);
  }

  if (family === 'class-5-decimal-money-measure') {
    const { aPaise, bPaise, budgetPaise, spentPaise, unitPaise, packs, discountPaise, ask } = givens;
    if (ask === 'left') return fmtRs(budgetPaise - spentPaise);
    if (ask === 'bundle') return fmtRs(unitPaise * packs - discountPaise);
    return fmtRs(aPaise + bPaise);
  }

  if (family === 'class-5-decimal-compare-order') {
    const { values, target, trueId } = givens;
    const sorted = [...values].sort((a, b) => a - b);
    if (target !== undefined) return fmtDecimal(target === 'greatest' ? sorted[3] : sorted[0]);
    if (trueId !== undefined) {
      const trueBank = [`${fmtDecimal(sorted[3])} > ${fmtDecimal(sorted[0])}`, `${fmtDecimal(sorted[0])} < ${fmtDecimal(sorted[1])}`, `${fmtDecimal(sorted[2])} > ${fmtDecimal(sorted[1])}`];
      return trueBank[trueId];
    }
    return fmtDecimal(sorted[1]);
  }

  if (family === 'class-5-decimal-fraction-link') {
    const { num, den, hundredths, panelHundredths, ask } = givens;
    if (ask === 'toFraction') {
      const g = gcdOf(hundredths, 100);
      return `${hundredths / g}/${100 / g}`;
    }
    if (ask === 'difference') {
      const finHundredths = Math.round((num * 100) / den);
      return fmtDecimal(Math.abs(finHundredths - panelHundredths));
    }
    const finHundredths = Math.round((num * 100) / den);
    return fmtDecimal(finHundredths);
  }

  if (family === 'class-5-composite-area') {
    const { W, H, notchW, notchH, rate, ask } = givens;
    const area = W * H - notchW * notchH;
    if (ask === 'perimeter') return String(2 * (W + H));
    if (ask === 'cost') return `Rs ${area * rate}`;
    return String(area);
  }

  if (family === 'class-5-perimeter-missing-side') {
    const { P, side, ratio, diff, ask } = givens;
    if (ask === 'other') return String(P / 2 - side);
    if (ask === 'ratio') return String(P / (2 * (1 + ratio)));
    return String((P / 2 - diff) / 2);
  }

  if (family === 'class-5-angle-chase') {
    const { angleA, angleB, s1, s2, ask } = givens;
    if (ask === 'line2') return `${180 - angleA}°`;
    if (ask === 'point3') return `${360 - angleA - angleB}°`;
    return `${180 - s1 - s2}°`;
  }

  if (family === 'class-5-cube-net-fold') {
    const { labels, askIndex, pairIndex, ask } = givens;
    const pair = NET_OPPOSITE_PAIRS[pairIndex];
    if (ask === 'pair') return `${labels[pair[0]]} and ${labels[pair[1]]}`;
    const otherIndex = pair[0] === askIndex ? pair[1] : pair[0];
    return labels[otherIndex];
  }

  if (family === 'class-5-symmetry-count') {
    const { cols, rows, leftShaded, ask } = givens;
    if (ask === 'unshaded') return String(cols * rows - 2 * leftShaded);
    return String(2 * leftShaded);
  }

  if (family === 'class-5-count-rectangles-grid') {
    const { m, n, ask, k = 1, j = 1 } = givens;
    return String(rectangleCounts(m, n, k, j)[ask]);
  }

  if (family === 'class-5-dial-read-convert') {
    const { max, divisions, needleAt, ctxIndex, ask } = givens;
    const ctx = DIAL_CONTEXTS[ctxIndex];
    const step = max / divisions;
    const reading = needleAt * step;
    if (ask === 'read') return String(reading);
    if (ask === 'convert') return String(reading * ctx.factor);
    return String((max - reading) * ctx.factor);
  }

  if (family === 'class-5-thermometer-change') {
    const { min, max, fillAt, direction1, amount1, direction2, amount2 } = givens;
    const step = (max - min) / 10;
    const startReading = min + fillAt * step;
    if (direction1 === undefined) return `${startReading}°C`;
    const afterStep1 = direction1 === 'rises' ? startReading + amount1 : startReading - amount1;
    if (direction2 === undefined) return `${afterStep1}°C`;
    const final = direction2 === 'rises' ? afterStep1 + amount2 : afterStep1 - amount2;
    return `${final}°C`;
  }

  if (family === 'class-5-unit-conversion-compare') {
    const { aBig, aRem, bBig, bRem, pairIndex, compound } = givens;
    const pair = UNIT_COMPARE_PAIRS[pairIndex];
    const aTotal = aBig * pair.factor + aRem;
    const bTotal = bBig * pair.factor + bRem;
    const aText = compound ? `${aBig} ${pair.big} ${aRem} ${pair.small}` : `${aBig} ${pair.big}`;
    const bText = compound ? `${bBig} ${pair.big} ${bRem} ${pair.small}` : `${bRem} ${pair.small}`;
    if (aTotal === bTotal) return 'They are equal';
    return aTotal > bTotal ? aText : bText;
  }

  if (family === 'class-5-balance-unknown-mass') {
    return String(givens.cellMass ?? givens.crateMass);
  }

  if (family === 'class-5-measurement-word-problem') {
    const { startBig, startRem, cutBig, cutRem, cut1Small, cut2Small, ctxIndex } = givens;
    const ctx = WORD_PROBLEM_CONTEXTS[ctxIndex];
    if (cut1Small !== undefined) return String(startBig * ctx.factor - cut1Small - cut2Small);
    return String(startBig * ctx.factor + startRem - (cutBig * ctx.factor + cutRem));
  }

  if (family === 'class-5-sensible-unit-estimate') {
    const item = SENSIBLE_ITEMS[givens.itemIndex];
    return `${item.value} ${item.unit}`;
  }

  // ---- time ---------------------------------------------------------------
  if (family === 'class-5-elapsed-time-bar') {
    if ('total' in givens) return fmtDuration(givens.total - sum(givens.knownDurations.filter(d => d != null)));
    return fmtDuration(sum(givens.durations));
  }

  if (family === 'class-5-clock-fast-slow') {
    const { shown, direction, amount, direction2, amount2 } = givens;
    const afterFirst = direction === 'fast' ? shown - amount : shown + amount;
    if (direction2 === undefined) return timeText(afterFirst);
    return timeText(direction2 === 'fast' ? afterFirst - amount2 : afterFirst + amount2);
  }

  if (family === 'class-5-calendar-weekday-calc') {
    const { daysInMonth, startWeekday, day, col, n } = givens;
    if (day !== undefined) return WEEKDAY_LABELS[(startWeekday + day - 1) % 7];
    const firstDay = col >= startWeekday ? col - startWeekday + 1 : col - startWeekday + 8;
    if (n !== undefined) {
      const occurrences = [];
      for (let d = firstDay; d <= daysInMonth; d += 7) occurrences.push(d);
      return String(occurrences[n - 1]);
    }
    return String(Math.floor((daysInMonth - firstDay) / 7) + 1);
  }

  if (family === 'class-5-timetable-read') {
    const { names, times, ask, timeA, timeB, deadline } = givens;
    if (deadline !== undefined) {
      const sortedIdx = times.map((_, i) => i).sort((a, b) => times[a] - times[b]);
      let best = sortedIdx[0];
      for (const i of sortedIdx) if (times[i] <= deadline) best = i;
      return names[best];
    }
    if (timeA !== undefined) return fmtDuration(Math.abs(timeA - timeB));
    const indices = times.map((_, i) => i).sort((a, b) => times[a] - times[b]);
    return names[ask === 'earliest' ? indices[0] : indices[indices.length - 1]];
  }

  if (family === 'class-5-time-24hr-convert') {
    const { hour24, minute, hour12, period, startMinutes, elapsed } = givens;
    if (startMinutes !== undefined) {
      const endMinutes = (startMinutes + elapsed) % 1440;
      return `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
    }
    if (period !== undefined) {
      const h24 = period === 'AM' ? (hour12 === 12 ? 0 : hour12) : (hour12 === 12 ? 12 : hour12 + 12);
      return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    const h12 = hour24 % 12 || 12;
    return `${h12}:${String(minute).padStart(2, '0')} ${hour24 < 12 ? 'AM' : 'PM'}`;
  }

  // ---- money ----------------------------------------------------------------
  if (family === 'class-5-price-board-bundle') {
    const { prices, bundle, paidPaise } = givens;
    const subtotal = bundle.reduce((s, b) => s + prices[b.index] * b.qty, 0);
    return fmtRs(paidPaise !== undefined ? paidPaise - subtotal : subtotal);
  }

  if (family === 'class-5-discount-calc') {
    const { price, pct, pct1, pct2, ask } = givens;
    if (pct1 !== undefined) return rupees((price * (100 - pct1) * (100 - pct2)) / 10000);
    if (ask === 'original') return rupees(price);
    return rupees(price - (price * pct) / 100);
  }

  if (family === 'class-5-receipt-missing-price') {
    const { missingPaise, unitPaise, ask } = givens;
    return fmtRs(ask === 'unit' ? unitPaise : missingPaise);
  }

  if (family === 'class-5-best-value-compare') {
    const { unitA, unitB, unitC, countA, countB, countC, needed } = givens;
    if (needed !== undefined) {
      const costA = Math.ceil(needed / countA) * unitA * countA;
      const costB = Math.ceil(needed / countB) * unitB * countB;
      const costC = Math.ceil(needed / countC) * unitC * countC;
      return rupees(Math.min(costA, costB, costC));
    }
    if (unitC !== undefined) return rupees(Math.min(unitA, unitB, unitC));
    return rupees(Math.min(unitA, unitB));
  }

  if (family === 'class-5-budget-condition') {
    const { names, prices, budget, ask } = givens;
    if (ask === 'left') return rupees(budget - Math.min(...prices));
    if (ask === 'dearest') return names[prices.map((p, i) => i).filter(i => prices[i] <= budget).sort((a, b) => prices[b] - prices[a])[0]];
    if (budget === undefined) {
      const sortedIdx = names.map((_, i) => i).sort((a, b) => prices[a] - prices[b]);
      return names[sortedIdx[sortedIdx.length - 1]];
    }
    const sums = [];
    for (let i = 0; i < prices.length; i++) for (let j = i + 1; j < prices.length; j++) sums.push(prices[i] + prices[j]);
    let best = Math.min(...sums);
    for (const s of sums) if (s <= budget && s > best) best = s;
    return rupees(best);
  }

  if (family === 'class-5-pictograph-key-scale') {
    const { icons, key, idx, a, b, op } = givens;
    const values = icons.map(c => c * key);
    if (idx !== undefined) return String(values[idx]);
    if (a !== undefined) return String(op === 'sum' ? values[a] + values[b] : Math.abs(values[a] - values[b]));
    const maxV = Math.max(...values);
    return String(2 * maxV - sum(values));
  }

  if (family === 'class-5-bar-chart-unusual-scale') {
    const { values, idx, a, b, op } = givens;
    if (idx !== undefined) return String(values[idx]);
    if (a !== undefined) return String(op === 'sum' ? values[a] + values[b] : Math.abs(values[a] - values[b]));
    return String(Math.max(...values) - Math.min(...values));
  }

  if (family === 'class-5-two-chart-compare') {
    const { week1, week2, idx, week } = givens;
    if (week !== undefined) return String((week === 1 ? week1 : week2)[idx]);
    if (idx !== undefined) return String(Math.abs(week2[idx] - week1[idx]));
    const totals = OUTPOST_NAMES.map((_, i) => week1[i] + week2[i]);
    return OUTPOST_NAMES[totals.indexOf(Math.max(...totals))];
  }

  if (family === 'class-5-chart-after-transfer') {
    const { before, from, to, moved, ask, other, moved1, moved2, a, b, c } = givens;
    if (ask !== undefined) return String(ask === 'to' ? before[to] + moved : before[from] - moved);
    if (other !== undefined) {
      const after = before.map((v, i) => (i === from ? v - moved : i === to ? v + moved : v));
      return String(Math.abs(after[to] - after[other]));
    }
    const afterFirst = before.map((v, i) => (i === a ? v - moved1 : i === b ? v + moved1 : v));
    const afterSecond = afterFirst.map((v, i) => (i === b ? v - moved2 : i === c ? v + moved2 : v));
    return String(afterSecond[c]);
  }

  if (family === 'class-5-average-balance') {
    const { values, mode, known, target } = givens;
    if (mode === 'mean') return String(sum(values) / 4);
    if (mode === 'balance') {
      const mean = sum(values) / 4;
      return String(sum(values.filter(v => v > mean).map(v => v - mean)));
    }
    return String(5 * target - sum(known));
  }

  if (family === 'class-5-chart-statement-check') {
    const { values, truePick, noun } = givens;
    return chartStatement(truePick.shape, { a: truePick.a, b: truePick.b, noun, total: truePick.b !== undefined ? values[truePick.a] + values[truePick.b] : undefined });
  }

  // reasoning -- Logic launchpad
  if (family === 'class-5-rank-queue-twoends') {
    const { P, Q, G } = givens;
    return String(G === undefined ? P + Q - 1 : P + Q + G);
  }

  if (family === 'class-5-grid-route-turns') {
    const { start, startFacing, segments, ask } = givens;
    const end = simulateRouteLenient(start.x, start.y, startFacing, segments);
    if (ask === 'facing') return FACING_WORDS[end.facing];
    if (ask === 'column') return String(end.x + 1);
    if (ask === 'row') return String(end.y + 1);
    return `(${end.x + 1}, ${end.y + 1})`;
  }

  if (family === 'class-5-combinations-count') {
    const { X, Y, forbidden } = givens;
    return String(X * Y - (forbidden ?? 0));
  }

  if (family === 'class-5-figure-matrix-analogy') {
    const { unit, sequenceLen, rule, sA, sB, cRName } = givens;
    if (unit !== undefined) return unit[(sequenceLen - 1) % unit.length];
    return `${cRName} ${rule === 'swap' ? sA : sB}`;
  }

  if (family === 'class-5-path-count-grid') {
    const { cols, rows, blocked } = givens;
    return String(countGridPaths(cols, rows, blocked ?? null));
  }

  if (family === 'class-5-truth-teller') {
    const { names, predicted, correctIdx, queriedIdx, askWho } = givens;
    const allIdx = predicted.map((_, i) => i);
    const remaining = allIdx.filter(i => !correctIdx.includes(i));
    const otherSwapIdx = remaining.find(i => i !== queriedIdx);
    if (askWho) return names[otherSwapIdx];
    const answerValue = predicted[otherSwapIdx];
    return `${answerValue}${ordinal(answerValue)}`;
  }

  throw new Error(`Unknown class-5 family: ${family}`);
}

// ---------------------------------------------------------------------------
// render -- one branch per visual.kind.
// ---------------------------------------------------------------------------
export function render(visual) {
  const reasoningArt = renderReasoning(visual);
  if (reasoningArt) return reasoningArt;
  const real3Art = renderReal3(visual);
  if (real3Art) return real3Art;
  if (visual.kind === 'v3-class-5-cards') {
    return svg(cardRow(visual.cards), visual.description, 520, 110);
  }
  if (visual.kind === 'v3-class-5-track') {
    return svg(numberTrack({ min: visual.min, max: visual.max, step: visual.step, labels: visual.labels, pointerAt: visual.pointerAt }), visual.description, 500, 160);
  }
  if (visual.kind === 'v3-class-5-pvchart') {
    return svg(placeValueChart({ digits: visual.digits, places: visual.places, highlightIndex: visual.highlightIndex }), visual.description, 480, 270);
  }
  if (visual.kind === 'v3-class-5-number-grid') {
    return svg(numberGrid(visual.numbers), visual.description, 480, 170);
  }
  if (visual.kind === 'v3-class-5-barmodel') {
    return svg(barModel(visual.parts, { totalLabel: visual.totalLabel }), visual.description, 500, 130);
  }
  if (visual.kind === 'v3-class-5-columncalc') {
    return svg(columnCalc({ top: visual.top, bottom: visual.bottom, result: visual.result, hideIn: visual.hideIn, hideIndex: visual.hideIndex }), visual.description, 320, 160);
  }
  if (visual.kind === 'v3-class-5-share') {
    return svg(groupShare({ total: visual.total, groups: visual.groups }), visual.description, 480, 110);
  }
  if (visual.kind === 'v3-class-5-symboleq') {
    const height = 30 + visual.lines.length * 70;
    return svg(symbolEquations(visual.lines), visual.description, 480, height);
  }
  if (visual.kind === 'v3-class-5-fracstrip') {
    const height = 30 + visual.strips.length * 56;
    return svg(fractionStrips(visual.strips), visual.description, 440, height);
  }
  if (visual.kind === 'v3-class-5-fracline') {
    return svg(fractionLine(visual.den, visual.units, visual.pointerAt), visual.description, 480, 150);
  }
  if (visual.kind === 'v3-class-5-fracgrid') {
    return svg(fractionTileGrid(visual.values), visual.description, 480, 170);
  }
  if (visual.kind === 'v3-class-5-decgrid') {
    return svg(tileGrid(visual.cells, 15, 15, 27), visual.description, 300, 300);
  }
  if (visual.kind === 'v3-class-5-decchart') {
    return svg(decimalPlaceChart({ wholeDigits: visual.wholeDigits, fracDigits: visual.fracDigits, highlightSide: visual.highlightSide, highlightIndex: visual.highlightIndex }), visual.description, 480, 270);
  }
  if (visual.kind === 'v3-class-5-areagrid' || visual.kind === 'v3-class-5-rectgrid') {
    const size = 24;
    const cols = visual.cells[0].length;
    const rows = visual.cells.length;
    return svg(tileGrid(visual.cells, 15, 15, size), visual.description, 30 + cols * size, 30 + rows * size);
  }
  if (visual.kind === 'v3-class-5-labelrect') {
    return svg(labeledRectangle({ width: visual.width, height: visual.height, widthLabel: visual.widthLabel, heightLabel: visual.heightLabel }), visual.description, 420, 240);
  }
  if (visual.kind === 'v3-class-5-anglefan') {
    return svg(angleFan(visual.segments, { startDeg: visual.startDeg }), visual.description, 480, 260);
  }
  if (visual.kind === 'v3-class-5-cubenet') {
    return svg(cubeNetCross(visual.labels), visual.description, 320, 220);
  }
  if (visual.kind === 'v3-class-5-mirrorgrid') {
    const size = 27;
    const x0 = 15;
    const y0 = 15;
    const cols = visual.cells[0].length;
    const rows = visual.cells.length;
    const midX = x0 + visual.mirrorCol * size;
    const gw = cols * size;
    const gh = rows * size;
    return svg(`${tileGrid(visual.cells, x0, y0, size)}${line(midX, y0 - 8, midX, y0 + gh + 8, { dash: '6 4' })}`, visual.description, x0 + gw + 15, y0 + gh + 25);
  }
  if (visual.kind === 'v3-class-5-gauge') {
    return svg(gaugeDial({ max: visual.max, divisions: visual.divisions, needleAt: visual.needleAt, unit: visual.unit }), visual.description, 460, 260);
  }
  if (visual.kind === 'v3-class-5-thermo') {
    return svg(thermometerTube({ min: visual.min, max: visual.max, step: visual.step, fillAt: visual.fillAt, unit: visual.unit }), visual.description, 220, 290);
  }
  if (visual.kind === 'v3-class-5-balance') {
    let y = 6;
    let body = '';
    for (const bal of visual.balances) {
      const capH = bal.caption ? 22 : 0;
      if (bal.caption) body += text(16, y + 14, bal.caption, { size: 15, anchor: 'start', fill: '#6b6456' });
      body += balanceScale({ x: 20, y: y + capH, width: 420, left: bal.left, right: bal.right });
      y += balanceScaleHeight({ left: bal.left, right: bal.right }) + capH + 14;
    }
    return svg(body, visual.description, 460, y);
  }
  if (visual.kind === 'v3-class-5-clock') {
    return svg(clockFace(visual.minutes, 120, 120, 100), visual.description, 240, 240);
  }
  if (visual.kind === 'v3-class-5-calendar') {
    const height = 40 + calendarGridRows(visual.daysInMonth, visual.startWeekday) * 42;
    return svg(calendarGrid(visual.daysInMonth, visual.startWeekday, { highlight: visual.highlight, highlightColumn: visual.highlightColumn }), visual.description, 476, height);
  }
  if (visual.kind === 'v3-class-5-timetable') {
    return svg(timetableBoard(visual.rows), visual.description, 460, timetableBoardHeight(visual.rows));
  }
  if (visual.kind === 'v3-class-5-pricetag') {
    return svg(priceTag({ price: visual.price, priceLabel: visual.priceLabel, discounts: visual.discounts }), visual.description, 300, priceTagHeight(visual.discounts));
  }
  if (visual.kind === 'v3-class-5-packcompare') {
    return svg(packCompareArt(visual.packs), visual.description, 460, packCompareHeight());
  }
  if (visual.kind === 'v3-class-5-itemshelf') {
    return svg(itemShelfArt(visual.items), visual.description, 460, itemShelfHeight());
  }
  if (visual.kind === 'v3-class-5-barchart') {
    return svg(barChart(visual.bars, { max: visual.max, step: visual.step, barFill: PLUM }), visual.description, 460, 220);
  }
  if (visual.kind === 'v3-class-5-twinchart') {
    return svg(twinBarChart(visual.left, visual.right, { max: visual.max, step: visual.step, barFill: PLUM }), visual.description, 460, twinBarChartHeight());
  }
  if (visual.kind === 'v3-class-5-pictograph') {
    return svg(pictographArt(visual.rows, { key: visual.key }), visual.description, 460, pictographHeight(visual.rows));
  }
  if (visual.kind === 'v3-class-5-queueline') {
    return svg(queueLine(visual.markers, { band: visual.band }), visual.description, 480, 150);
  }
  if (visual.kind === 'v3-class-5-routegrid') {
    const cell = 30;
    const size = routeGridSize(visual.size, cell);
    return svg(routeGridArt({ size: visual.size, startX: visual.startX, startY: visual.startY, facing: visual.facing, cell }), visual.description, size, size);
  }
  if (visual.kind === 'v3-class-5-iconseq') {
    const cell = 50;
    const gap = 10;
    const { width, height } = iconSequenceSize(visual.items.length, visual.columns, cell, gap);
    return svg(iconSequenceArt(visual.items, { columns: visual.columns, cell, gap }), visual.description, width, height);
  }
  if (visual.kind === 'v3-class-5-combogrid') {
    const size = 24;
    const cols = visual.cells[0].length;
    const rows = visual.cells.length;
    return svg(tileGrid(visual.cells, 15, 15, size), visual.description, 30 + cols * size, 30 + rows * size);
  }
  if (visual.kind === 'v3-class-5-junctiongrid') {
    const { width, height } = junctionGridSize(visual.cols, visual.rows);
    return svg(junctionGridArt({ cols: visual.cols, rows: visual.rows, blocked: visual.blocked }), visual.description, width, height);
  }
  if (visual.kind === 'v3-class-5-predictionboard') {
    return svg(predictionBoardArt(visual.rows), visual.description, 460, predictionBoardHeight(visual.rows));
  }
  throw new Error(`Unsupported class-5 diagram: ${visual.kind}`);
}
