// Class 3 question bank 3: Star Navigator. Each chapter is its own set of tasks.
import { QuestionRetry } from './bank-shared.mjs';
import { MISCONCEPTIONS } from './bank3-class-3-helpers.mjs';
import { DRAFT as MATH_DRAFT, SOLVE as MATH_SOLVE } from './bank3-class-3-math.mjs';
import { DRAFT as WORLD_DRAFT, SOLVE as WORLD_SOLVE } from './bank3-class-3-world.mjs';
import { renderClass3 } from './bank3-class-3-art.mjs';
import { IMO_RENDERERS } from './bank3-class-3-imo-art.mjs';
import { DRAFT as FRAC_DRAFT, SOLVE as FRAC_SOLVE, FAMILIES as FRAC_FAMILIES } from './bank3-class-3-frac.mjs';
import { DRAFT as SKILL_DRAFT, SOLVE as SKILL_SOLVE, FAMILIES as SKILL_FAMILIES } from './bank3-class-3-skills.mjs';
import { DRAFT as LIFE_DRAFT, SOLVE as LIFE_SOLVE, FAMILIES as LIFE_FAMILIES } from './bank3-class-3-life.mjs';
import { DRAFT as SHAPE_DRAFT, SOLVE as SHAPE_SOLVE, FAMILIES as SHAPE_FAMILIES } from './bank3-class-3-shapes.mjs';
import { DRAFT as LOGIC_DRAFT, SOLVE as LOGIC_SOLVE, FAMILIES as LOGIC_FAMILIES } from './bank3-class-3-logic.mjs';
import { DRAFT as PUZZLE_DRAFT, SOLVE as PUZZLE_SOLVE, FAMILIES as PUZZLE_FAMILIES, PUZZLE_RENDERERS } from './bank3-class-3-puzzles.mjs';

export { MISCONCEPTIONS };

export const FAMILIES = {
  ...FRAC_FAMILIES,
  ...SKILL_FAMILIES,
  ...LIFE_FAMILIES,
  ...SHAPE_FAMILIES,
  ...LOGIC_FAMILIES,
  ...PUZZLE_FAMILIES,
  'class-3-bead-count': { skill: 'place', title: 'Read a four-rod star abacus' },
  'class-3-block-match': { skill: 'place', title: 'Pick the base-ten blocks for a number' },
  'class-3-line-mark': { skill: 'place', title: 'Read an arrow on a labelled number line' },
  'class-3-clue-lock': { skill: 'mystery', title: 'Open a lock from three number clues' },
  'class-3-digit-cards': { skill: 'expand', title: 'Build a number from place-value cards' },
  'class-3-rule-box': { skill: 'sequence', title: 'Run a number through a rule machine' },
  'class-3-array-trays': { skill: 'groups', title: 'Count crates in equal tray rows' },
  'class-3-bar-story': { skill: 'addition', title: 'Find the missing part of a bar model' },
  'class-3-share-left': { skill: 'sharing', title: 'Share supplies and count what is left' },
  'class-3-column-gap': { skill: 'mystery', title: 'Fill a missing digit in a column sum' },
  'class-3-symbol-sum': { skill: 'mystery', title: 'Find linked shape values from two lines' },
  'class-3-shade-read': { skill: 'fraction-read', title: 'Read the shaded part of a shape' },
  'class-3-group-share': { skill: 'fraction-of', title: 'Find a fraction of a group of items' },
  'class-3-fraction-line': { skill: 'fraction-read', title: 'Read a fraction mark on a number line' },
  'class-3-equal-bars': { skill: 'fraction-compare', title: 'Pick the bar with the same shaded amount' },
  'class-3-fraction-true': { skill: 'fraction-of', title: 'Choose the true fraction statement' },
  'class-3-angle-mark': { skill: 'angles', title: 'Name an angle or count square corners' },
  'class-3-mirror-pick': { skill: 'symmetry', title: 'Pick the mirror image of a badge' },
  'class-3-grid-edge': { skill: 'perimeter', title: 'Find area or perimeter of a grid shape' },
  'class-3-shape-pick': { skill: 'shape', title: 'Pick the shape that matches a property' },
  'class-3-tower-view': { skill: 'solids', title: 'Count cubes in a tower view' },
  'class-3-cube-net': { skill: 'solids', title: 'Find the opposite face on a cube net' },
  'class-3-ruler-gap': { skill: 'measure', title: 'Read a length between two ruler marks' },
  'class-3-dial-read': { skill: 'measure', title: 'Read a thermometer or dial scale' },
  'class-3-balance-pan': { skill: 'measure', title: 'Find the missing mass on a balance' },
  'class-3-unit-sense': { skill: 'measure', title: 'Choose a sensible unit or convert it' },
  'class-3-jug-fill': { skill: 'measure', title: 'Fill a jug using equal cups' },
  'class-3-clock-face': { skill: 'time', title: 'Read a clock or a later time' },
  'class-3-clock-pick': { skill: 'time', title: 'Pick the clock that shows a time' },
  'class-3-elapsed-bar': { skill: 'time', title: 'Read elapsed minutes on a time bar' },
  'class-3-calendar-grid': { skill: 'calendar', title: 'Read a date or weekday on a calendar' },
  'class-3-timetable': { skill: 'time', title: 'Read a beacon timetable' },
  'class-3-price-board': { skill: 'money', title: 'Add prices from a shop board' },
  'class-3-coin-pile': { skill: 'money', title: 'Add the value of notes and coins' },
  'class-3-change-slip': { skill: 'money', title: 'Work out change from a receipt' },
  'class-3-best-buy': { skill: 'money', title: 'Compare two packs to find the better buy' },
  'class-3-budget-rule': { skill: 'money', title: 'Pick a purchase that fits a budget rule' },
  'class-3-picto-key': { skill: 'chart', title: 'Read a pictograph with a key' },
  'class-3-bar-scale': { skill: 'chart', title: 'Compare bars on a scaled chart' },
  'class-3-chart-move': { skill: 'chart', title: 'Update a number in a data table' },
  'class-3-tally-true': { skill: 'chart', title: 'Choose the true tally statement' },
  'class-3-split-chart': { skill: 'chart', title: 'Compare two side-by-side bar charts' },
  'class-3-queue-rank': { skill: 'ranking', title: 'Find a place or the length of a queue' },
  'class-3-signal-code': { skill: 'coding', title: 'Decode a letter shift from a code key' },
  'class-3-compass-walk': { skill: 'directions', title: 'Follow compass steps on a map' },
  'class-3-mirror-sign': { skill: 'symmetry', title: 'Pick the mirror image of a tile sign' },
  'class-3-path-count': { skill: 'routes', title: 'Count right-and-up routes on a street map' },
  'class-3-ways-menu': { skill: 'combinations', title: 'Count allowed pairs from two menus' },
  'class-3-truth-line': { skill: 'coding', title: 'Find the code with exactly one true clue' },
};

const ids = (names) => names.split(' ').map((name) => `class-3-${name}`).join(' ');

export const PLAN = {
  numbers: [
    ids('bead-count block-match line-mark digit-cards order-digits place-fill number-words near-round rule-box'),
    ids('clue-lock digit-cards which-number order-digits near-round number-facts place-fill box-chain bead-count'),
    ids('which-number number-facts two-numbers box-chain clue-lock rule-box line-mark block-match near-round order-digits'),
  ],
  operations: [
    ids('array-trays bar-story share-left times-story divide-story add-story column-gap'),
    ids('bar-story share-left column-gap symbol-sum times-story divide-story add-story start-amount expression picture-sum long-division'),
    ids('symbol-sum start-amount age-story expression compare-values divide-story column-gap times-story add-story picture-sum long-division'),
  ],
  fractions: [
    ids('shade-read group-share fraction-line frac-mixed frac-cells frac-sets frac-cuts frac-of-amount frac-share equal-bars'),
    ids('frac-of-amount frac-greater frac-equal frac-unit frac-sets frac-mixed fraction-true equal-bars frac-order frac-add frac-whole'),
    ids('frac-rest frac-spent frac-whole frac-add frac-order frac-equal frac-unit frac-cells frac-sets frac-mixed frac-cuts'),
  ],
  geometry: [
    ids('letter-symmetry shape-count shape-perimeter angle-mark mirror-pick grid-edge shape-pick symmetry-lines'),
    ids('letter-symmetry solid-riddle shape-count symmetry-lines shape-perimeter tower-view cube-net grid-edge mirror-pick cube-stack'),
    ids('solid-riddle shape-perimeter symmetry-lines letter-symmetry cube-net tower-view grid-edge angle-mark shape-count cube-stack'),
  ],
  measurement: [
    ids('ruler-gap dial-read balance-pan unit-sense mixed-units longest-length closest-qty weigh-items trail-gap'),
    ids('dial-read balance-pan jug-fill mixed-units closest-qty weigh-items route-pick trail-gap longest-length'),
    ids('mixed-units weigh-items route-pick trail-gap longest-length closest-qty balance-pan jug-fill unit-sense ruler-gap'),
  ],
  time: [
    ids('clock-face clock-pick elapsed-bar calendar-grid elapsed-words time-after day-count time-units month-days'),
    ids('elapsed-bar timetable elapsed-words time-after day-count time-units clock-face calendar-grid month-days'),
    ids('timetable elapsed-words time-after day-count time-units elapsed-bar clock-pick calendar-grid month-days'),
  ],
  money: [
    ids('price-board coin-pile change-slip toy-trio price-times note-count big-price'),
    ids('coin-pile change-slip best-buy toy-trio price-times big-price note-count budget-rule'),
    ids('best-buy budget-rule toy-trio price-times big-price note-count change-slip price-board'),
  ],
  data: [
    ids('picto-key bar-scale bars-sum table-read bag-chance tally-true chart-move'),
    ids('bars-sum bars-transfer table-read bag-chance split-chart bar-scale tally-true bars-pair'),
    ids('bars-transfer bars-pair table-read split-chart bars-sum chart-move picto-key bag-chance'),
  ],
  reasoning: [
    ids('notebook-position word-jumble alpha-step number-series figure-pattern odd-out order-clues pick-ways mirror-sign queue-rank figure-analogy figure-places'),
    ids('notebook-position word-form number-series figure-pattern odd-out ways-menu word-code order-clues pick-ways signal-code embedded-letter figure-analogy'),
    ids('word-form triangle-rule number-series pair-rule compass-walk order-clues pick-ways truth-line path-count odd-out embedded-letter figure-places'),
  ],
};

const DRAFT = { ...MATH_DRAFT, ...WORLD_DRAFT, ...FRAC_DRAFT, ...SKILL_DRAFT, ...LIFE_DRAFT, ...SHAPE_DRAFT, ...LOGIC_DRAFT, ...PUZZLE_DRAFT };
const SOLVE = { ...MATH_SOLVE, ...WORLD_SOLVE, ...FRAC_SOLVE, ...SKILL_SOLVE, ...LIFE_SOLVE, ...SHAPE_SOLVE, ...LOGIC_SOLVE, ...PUZZLE_SOLVE };

export function draft(family, grade, level, r) {
  const fn = DRAFT[family];
  if (!fn) throw new Error(`Unknown class-3 family: ${family}`);
  try {
    return fn(family, grade, level, r);
  } catch (error) {
    if (error instanceof QuestionRetry) throw error;
    if (/^(LONG|HINT|SHORT)/.test(error.message)) throw new QuestionRetry(error.message);
    throw error;
  }
}

export function solve(question) {
  const fn = SOLVE[question.family];
  if (!fn) throw new Error(`Unknown class-3 family: ${question.family}`);
  return String(fn(question));
}

export function render(visual) {
  const draw = IMO_RENDERERS[visual.kind] ?? PUZZLE_RENDERERS[visual.kind];
  return draw ? draw(visual) : renderClass3(visual);
}
