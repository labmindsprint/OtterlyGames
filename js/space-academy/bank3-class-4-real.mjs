// Wires the paper-style Class 4 families (reasoning, maths and everyday specs) into the bank3 module contract.
import { draftFrom, solveFrom } from './bank3-class-4-real-core.mjs';
import { REASONING_SPECS } from './bank3-class-4-real-reasoning.mjs';
import { MATHS_SPECS } from './bank3-class-4-real-maths.mjs';
import { EVERYDAY_SPECS } from './bank3-class-4-real-everyday.mjs';
import { FIGURE_SPECS } from './bank3-class-4-real-figures.mjs';

export { renderReal } from './bank3-class-4-real-art.mjs';

export const REAL_SPECS = { ...REASONING_SPECS, ...MATHS_SPECS, ...EVERYDAY_SPECS, ...FIGURE_SPECS };

const entry = (skill, title) => ({ skill, title });
export const REAL_FAMILIES = {
  'class-4-word-code': entry('coding', 'Write a word in a code shown by an example'),
  'class-4-letter-shift': entry('coding', 'Find a code made by moving letters along the alphabet'),
  'class-4-cycle-position': entry('repeat', 'Find a number in a repeating numbered cycle'),
  'class-4-compass-turn': entry('directions', 'Turn a fraction of a circle to find the place faced'),
  'class-4-letter-arrange': entry('position', 'Order numbered letters to form a word'),
  'class-4-alphabet-position': entry('position', 'Count letters left or right in the alphabet'),
  'class-4-row-order': entry('ranking', 'Find a place in a row from clues'),
  'class-4-day-count': entry('calendar', 'Find a day of the week from a day count'),
  'class-4-number-analogy': entry('coding', 'Complete a number analogy'),
  'class-4-symmetry-letters': entry('symmetry', 'Find capital letters with or without a line of symmetry'),
  'class-4-grid-rule': entry('sequence', 'Find the missing number in a grid of rows'),
  'class-4-number-series': entry('sequence', 'Complete a number series'),
  'class-4-dictionary-order': entry('ranking', 'Arrange words in dictionary order'),
  'class-4-odd-one-out': entry('odd', 'Find the odd number out'),
  'class-4-place-value-gap': entry('place', 'Find the difference between place values of digits'),
  'class-4-number-clues': entry('mystery', 'Find a number from digit clues'),
  'class-4-compare-statements': entry('compare', 'Choose the true comparison from four statements'),
  'class-4-order-numbers': entry('compare', 'Arrange numbers in ascending or descending order'),
  'class-4-factor-facts': entry('factors', 'Use factors, common factors and least or greatest factors'),
  'class-4-multiple-facts': entry('factors', 'Find the smallest multiple with a given number of digits'),
  'class-4-words-place': entry('place', 'Write numbers using ones and place-value words'),
  'class-4-multiply-story': entry('groups', 'Solve a multiplication story with a hidden step'),
  'class-4-divide-pack': entry('sharing', 'Pack items into bags and find what is left'),
  'class-4-story-total': entry('addition', 'Find a total in a multi-step story'),
  'class-4-sum-diff-pieces': entry('subtraction', 'Find two numbers from their sum and difference'),
  'class-4-letter-multiplication': entry('mystery', 'Solve a letter multiplication puzzle'),
  'class-4-long-division': entry('sharing', 'Use the quotient and remainder of a division'),
  'class-4-two-prices': entry('mystery', 'Find prices or masses from two or three combined totals'),
  'class-4-shaded-grid': entry('fraction-read', 'Name the fraction of a figure that is shaded'),
  'class-4-fraction-claims': entry('fraction-compare', 'Compare fractions and pick the true statement'),
  'class-4-fraction-quantity': entry('fraction-of', 'Find a fraction of a quantity'),
  'class-4-fraction-share': entry('fraction-of', 'Share items equally and find the leftover'),
  'class-4-mixed-measure': entry('fraction-read', 'Add or subtract mixed numbers in measures'),
  'class-4-perimeter-word': entry('perimeter', 'Find a perimeter from a word problem'),
  'class-4-perimeter-unknown': entry('perimeter', 'Find the unknown side of a stepped shape'),
  'class-4-area-word': entry('area', 'Find an area, a tile count or a missing side'),
  'class-4-solid-facts': entry('solids', 'Count faces, edges and vertices of solids'),
  'class-4-score-table': entry('chart', 'Read a score table and compare totals'),
  'class-4-library-compare': entry('chart', 'Compare book counts from a short list'),
  'class-4-survey-rest': entry('chart', 'Find the rest from a survey total'),
  'class-4-age-sum': entry('time', 'Add or subtract ages in years and months'),
  'class-4-clock-duration': entry('time', 'Find a start time, an end time or a duration'),
  'class-4-time-units': entry('time', 'Change between hours, minutes, days and weeks'),
  'class-4-date-gap': entry('calendar', 'Count days between dates or find a return date'),
  'class-4-savings-weeks': entry('money', 'Find savings over several weeks or months'),
  'class-4-round-total': entry('money', 'Round a total price to the nearest ten or hundred'),
  'class-4-price-gap': entry('money', 'Use more than or less than to find prices'),
  'class-4-unit-rate': entry('money', 'Use the cost of one to find the cost of many'),
  'class-4-bill-change': entry('money', 'Find the change from a bill'),
  'class-4-mass-units': entry('measure', 'Add or subtract measures in mixed units'),
  'class-4-rice-packs': entry('measure', 'Find what is left after filling equal packs'),
  'class-4-measure-share': entry('measure', 'Share a measure equally or count equal portions'),
  'class-4-mirror-word': entry('symmetry', 'Read a word as it looks in a mirror'),
  'class-4-paper-fold': entry('symmetry', 'Find where holes appear after unfolding paper'),
  'class-4-figure-analogy': entry('coding', 'Apply the change from one figure to another'),
  'class-4-embedded-figure': entry('position', 'Find a small figure hidden in a big figure'),
  'class-4-pattern-complete': entry('symmetry', 'Complete a mirror pattern with a missing piece'),
  'class-4-bar-scale': entry('chart', 'Read a bar graph with a scaled axis'),
  'class-4-scale-weights': entry('mystery', 'Find the mass of shapes from three weighing scales'),
  'class-4-blood-relation': entry('compare', 'Work out a family relation from clues'),
  'class-4-venn-count': entry('chart', 'Count groups that overlap, with or without neither'),
};

export const isReal = family => family in REAL_SPECS;
export const draftReal = (known, family, grade, level, r) => draftFrom(REAL_SPECS, known, family, grade, level, r);
export const solveReal = question => solveFrom(REAL_SPECS, question);
