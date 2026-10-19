import { runBattery } from './space-academy-bank3-battery.mjs';
import * as template from '../js/space-academy/bank3-template.mjs';

// The template keeps most version 2 rows, which are thin and repeat questions; a real grade module must meet the
// defaults (4+ families a row, 2+ new, 3+ formats, 85% different questions, 20+ questions a family).
runBattery('class-2', template, { minRow: 1, minNew: 0, minFormats: 1, minUnique: 0.1, minPerFamily: 5 });
