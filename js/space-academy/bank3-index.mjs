// Question bank version 3: the grade modules that are integrated into the live game.
// Add a grade here only after its own test file passes. Grades not listed keep their version 2 plan.
import * as pp1 from './bank3-pp1.mjs';
import * as pp2 from './bank3-pp2.mjs';
import * as class1 from './bank3-class-1.mjs';
import * as class2 from './bank3-class-2.mjs';
import * as class3 from './bank3-class-3.mjs';
import * as class4 from './bank3-class-4.mjs';
import * as class5 from './bank3-class-5.mjs';

export const BANK3_MODULES = {
  pp1, pp2, 'class-1': class1, 'class-2': class2, 'class-3': class3, 'class-4': class4, 'class-5': class5,
};

export function renderBank3(visual, modules = BANK3_MODULES) {
  const gradeId = Object.keys(modules).find(id => visual.kind.startsWith(`v3-${id}-`));
  if (!gradeId) throw new Error(`Unsupported question diagram: ${visual.kind}`);
  return modules[gradeId].render(visual);
}
