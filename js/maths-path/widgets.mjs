import * as tenFrame from './ten-frame.mjs';
import * as placeValue from './place-value.mjs';
import * as numberLine from './number-line.mjs';
import * as barModel from './bar-model.mjs';
import * as coinTray from './coin-tray.mjs';
import * as clock from './clock.mjs';
import * as sorter from './sorter.mjs';
import * as patternBuilder from './pattern-builder.mjs';
import * as balance from './balance.mjs';
import * as fractionBars from './fraction-bars.mjs';
import * as array from './array.mjs';
import * as grid from './grid.mjs';
import * as chart from './chart.mjs';
import * as calendar from './calendar.mjs';
import * as logicBoard from './logic-board.mjs';
import * as angle from './angle.mjs';
import * as placeValueBig from './place-value-big.mjs';

// One registry for the browser runtime and the Node page generator.
export const WIDGETS = Object.fromEntries([tenFrame, placeValue, numberLine, barModel, coinTray, clock, sorter, patternBuilder, balance, fractionBars, array, grid, chart, calendar, logicBoard, angle, placeValueBig]
  .map((module) => [module.type, module]));

export function widget(type) {
  const found = WIDGETS[type];
  if (!found) throw new Error(`Unknown maths-path widget: ${type}`);
  return found;
}

export const renderWidget = (spec) => widget(spec.w).render(spec.c);
