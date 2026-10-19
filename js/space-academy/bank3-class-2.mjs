import { MISCONCEPTIONS as SHARED } from './bank-shared.mjs';
import { DRAFT_MAP, SOLVE_MAP } from './bank3-class-2-engines.mjs';
import { renderVisual } from './bank3-class-2-art.mjs';
import { DRAFT as REAL_DRAFT, REASONING_FAMILIES, REAL_CODES, SOLVE as REAL_SOLVE, renderReasoning } from './bank3-class-2-real.mjs';
import { DRAFT as MIXED_DRAFT, MIXED_FAMILIES, SOLVE as MIXED_SOLVE, renderMixed } from './bank3-class-2-real2.mjs';
import { DRAFT as REAL3_DRAFT, REAL3_CODES, REAL3_FAMILIES, SOLVE as REAL3_SOLVE, renderReal3 } from './bank3-class-2-real3.mjs';

export const FAMILIES = {
  ...REASONING_FAMILIES,
  ...MIXED_FAMILIES,
  ...REAL3_FAMILIES,
  // Numbers
  'class-2-place-blocks': { skill: 'place', title: 'Read base-ten hundreds, tens and ones blocks' },
  'class-2-number-line': { skill: 'place', title: 'Read a number on a scaled number line' },
  'class-2-expanded-story': { skill: 'expand', title: 'Match expanded form and place value in stories' },
  'class-2-order-four': { skill: 'compare', title: 'Order four 3-digit numbers on beacons' },
  'class-2-block-choice': { skill: 'place', title: 'Pick the block model that matches a 3-digit number' },

  // Operations
  'class-2-array-grid': { skill: 'groups', title: 'Count an array of rows and columns' },
  'class-2-jump-line': { skill: 'groups', title: 'Read equal jumps on a number line' },
  'class-2-regroup-story': { skill: 'addition', title: 'Solve 3-digit addition and subtraction stories' },
  'class-2-missing-digit': { skill: 'mystery', title: 'Find a missing digit in a vertical sum' },
  'class-2-equalize-trays': { skill: 'sharing', title: 'Move items between two trays to make them equal' },

  // Patterns
  'class-2-bead-rule': { skill: 'repeat', title: 'Pick the next or missing badge in a pattern' },
  'class-2-growing-tiles': { skill: 'sequence', title: 'Count tiles in the next step of a growing figure' },
  'class-2-function-machine': { skill: 'sequence', title: 'Follow a number machine rule' },
  'class-2-matrix-cell': { skill: 'visual', title: 'Complete a 3 by 3 picture matrix' },
  'class-2-story-step': { skill: 'sequence', title: 'Continue a skip-counting mission log' },

  // Geometry
  'class-2-hidden-shapes': { skill: 'shape', title: 'Count a target shape in a composite craft' },
  'class-2-symmetry-half': { skill: 'symmetry', title: 'Pick the half that completes a symmetric badge' },
  'class-2-cube-stack': { skill: 'solids', title: 'Count unit cubes in a 3D stack' },
  'class-2-grid-perimeter': { skill: 'perimeter', title: 'Find the boundary length of a grid figure' },
  'class-2-shape-riddle': { skill: 'solids', title: 'Solve a riddle about faces, edges and corners' },

  // Measurement
  'class-2-clip-length': { skill: 'measure', title: 'Compare lengths measured with unit blocks' },
  'class-2-pan-compare': { skill: 'measure', title: 'Order three objects from two balance scales' },
  'class-2-jug-pour': { skill: 'measure', title: 'Fill a large tank with equal small jugs' },
  'class-2-unit-sense': { skill: 'measure', title: 'Choose the sensible measurement or sum' },
  'class-2-thermometer-diff': { skill: 'measure', title: 'Compare two thermometer readings' },

  // Time
  'class-2-clock-match': { skill: 'time', title: 'Pick the analog clock that matches a stated time' },
  'class-2-timeline-bar': { skill: 'time', title: 'Read elapsed minutes from a timeline bar' },
  'class-2-schedule-table': { skill: 'time', title: 'Read a mission timetable' },
  'class-2-duration-story': { skill: 'time', title: 'Convert hours, minutes, days and weeks' },
  'class-2-calendar-span': { skill: 'calendar', title: 'Count days or weekdays on a month calendar' },

  // Money
  'class-2-note-combo': { skill: 'money', title: 'Pick the purse that shows an exact rupee amount' },
  'class-2-receipt-missing': { skill: 'money', title: 'Find a missing item price on a receipt' },
  'class-2-two-item-buy': { skill: 'money', title: 'Pick two shop items that match an exact total' },
  'class-2-saving-story': { skill: 'money', title: 'Track rupees saved and spent in a story' },
  'class-2-best-pack': { skill: 'money', title: 'Compare pack deals to find the cheaper buy' },

  // Data
  'class-2-tally-table': { skill: 'chart', title: 'Read a tally table of mission finds' },
  'class-2-bar-gap': { skill: 'chart', title: 'Compare and combine bars on a scaled bar graph' },
  'class-2-pictograph-half': { skill: 'chart', title: 'Read a pictograph key and compare rows' },
  'class-2-chart-true': { skill: 'chart', title: 'Find which statement about a data table is true' },
  'class-2-data-story': { skill: 'chart', title: 'Solve a word puzzle about survey totals' },
};

export const MISCONCEPTIONS = {
  'class-2-block-count': { title: 'Counting blocks not values', message: 'A flat is 100, a rod is 10, and a cube is 1. Use each block value.' },
  'class-2-tick-step': { title: 'Number-line step', message: 'Find how much each tick mark adds before reading the arrow.' },
  'class-2-order-rank': { title: 'Order and position', message: 'Sort all four numbers from smallest to greatest, then check the asked position.' },
  'class-2-added-sides': { title: 'Rows plus columns', message: 'For an array of rows and columns, multiply rows by columns instead of adding.' },
  'class-2-jump-marks': { title: 'Counting marks not jumps', message: 'Count the curved jumps and multiply by the size of each jump.' },
  'class-2-carry-borrow': { title: 'Regrouping ten', message: 'When ones or tens cross 10, regroup 1 ten or 1 hundred carefully.' },
  'class-2-full-diff': { title: 'Giving the whole difference', message: 'Give only half the difference so both trays end up with the same amount.' },
  'class-2-tile-step': { title: 'Growing pattern step', message: 'Find how many new tiles are added at each step, then add that to the last figure.' },
  'class-2-hidden-cube': { title: 'Hidden bottom cubes', message: 'A tall column has cubes underneath holding up the top cube.' },
  'class-2-heavier-side': { title: 'Reading balance tilt', message: 'The heavier object makes its pan go down; the lighter pan goes up.' },
  'class-2-full-transfer': { title: 'Tally bundle of five', message: 'A crossed tally group counts as 5, not 4.' },
  ...REAL_CODES,
  ...REAL3_CODES,
};

export const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

export const PLAN = {
  numbers: [
    'abacus-read class-2-digit-cloud class-2-place-compare class-2-place-blocks class-2-number-line class-2-expanded-story class-2-order-four',
    'abacus-change number-compare class-2-digit-cloud class-2-place-compare class-2-order-four class-2-block-choice class-2-place-sign',
    'number-clues abacus-combine class-2-digit-cloud class-2-place-compare class-2-order-four class-2-place-sign',
  ],
  operations: [
    'equal-groups class-2-add-story-real class-2-symbol-digits class-2-array-grid class-2-jump-line class-2-regroup-story class-2-equalize-trays',
    'bar-unknown class-2-add-story-real class-2-symbol-digits class-2-missing-digit class-2-equalize-trays class-2-regroup-story class-2-array-grid',
    'symbol-equations two-stage class-2-add-story-real class-2-symbol-digits class-2-missing-digit class-2-equalize-trays class-2-jump-line',
  ],
  patterns: [
    'class-2-place-words class-2-row-position class-2-shape-lines class-2-roll-slide class-2-bead-rule class-2-day-after class-2-number-series class-2-odd-text class-2-boat-position class-2-circle-seats',
    'class-2-growing-tiles class-2-row-position class-2-shape-lines class-2-roll-slide class-2-analogy class-2-clue-number class-2-make-numbers class-2-odd-text class-2-function-machine class-2-cardinal-ordinal',
    'class-2-story-step class-2-row-position class-2-shape-lines class-2-letter-gap class-2-analogy class-2-clue-number class-2-make-numbers class-2-tree-interval class-2-matrix-cell class-2-function-machine',
  ],
  geometry: [
    'mirror-grid class-2-picture-facts class-2-hidden-shapes class-2-shape-riddle class-2-cube-stack class-2-grid-perimeter',
    'rotate-grid class-2-picture-facts class-2-symmetry-half class-2-cube-stack class-2-grid-perimeter class-2-shape-riddle',
    'scene-statements figure-analogy class-2-picture-facts class-2-cube-stack class-2-grid-perimeter class-2-symmetry-half',
  ],
  measurement: [
    'balance-missing class-2-cylinder-diff class-2-clip-length class-2-unit-sense class-2-jug-pour class-2-thermometer-diff',
    'balance-missing class-2-cylinder-diff class-2-pan-compare class-2-jug-pour class-2-thermometer-diff class-2-unit-sense',
    'measure-change unit-combine class-2-cylinder-diff class-2-pan-compare class-2-jug-pour class-2-clip-length',
  ],
  time: [
    'clock-read class-2-clock-elapsed class-2-clock-match class-2-timeline-bar class-2-duration-story class-2-schedule-table',
    'clock-options class-2-clock-elapsed class-2-schedule-table class-2-calendar-span class-2-duration-story class-2-timeline-bar',
    'time-chain calendar class-2-clock-elapsed class-2-clock-match class-2-schedule-table class-2-timeline-bar',
  ],
  money: [
    'coin-value class-2-price-tags class-2-amount-form class-2-note-combo class-2-two-item-buy class-2-saving-story class-2-receipt-missing',
    'shopping-change class-2-price-tags class-2-amount-form class-2-receipt-missing class-2-best-pack class-2-saving-story class-2-two-item-buy',
    'shopping-budget class-2-price-tags class-2-amount-form class-2-note-combo class-2-receipt-missing class-2-best-pack class-2-two-item-buy',
  ],
  data: [
    'pictograph class-2-picto-pair class-2-tally-table class-2-bar-gap class-2-data-story class-2-chart-true',
    'chart-compare class-2-picto-pair class-2-pictograph-half class-2-chart-true class-2-data-story class-2-bar-gap',
    'chart-update class-2-picto-pair class-2-tally-table class-2-pictograph-half class-2-chart-true class-2-bar-gap',
  ],
};

export function draft(family, grade, level, r) {
  const fn = REAL_DRAFT[family] ?? MIXED_DRAFT[family] ?? REAL3_DRAFT[family] ?? DRAFT_MAP[family];
  if (!fn) throw new Error(`Unknown class-2 family: ${family}`);
  return fn(family, grade, level, r);
}

export function solve(question) {
  const fn = REAL_SOLVE[question.family] ?? MIXED_SOLVE[question.family] ?? REAL3_SOLVE[question.family] ?? SOLVE_MAP[question.family];
  if (!fn) throw new Error(`Unknown class-2 family: ${question.family}`);
  return fn(question);
}

export function render(visual) {
  return renderReasoning(visual) ?? renderMixed(visual) ?? renderReal3(visual) ?? renderVisual(visual);
}
