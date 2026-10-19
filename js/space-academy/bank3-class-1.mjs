import {
  MISCONCEPTIONS as SHARED, QuestionRetry, answerChoices, choiceCount, timeText, wrong,
} from './bank-shared.mjs';
import { renderClass1 } from './bank3-class-1-art.mjs';
import {
  TEXT_FAMILIES, TEXT_MISCONCEPTIONS, draftText, solveText,
} from './bank3-class-1-text.mjs';
import {
  REAL_FAMILIES, REAL_MISCONCEPTIONS, REAL_PLAN, draftReal, renderRealClass1, solveReal,
} from './bank3-class-1-real.mjs';

export const FAMILIES = {
  ...TEXT_FAMILIES,
  ...REAL_FAMILIES,
  'class-1-base-ten-build': { skill: 'place', title: 'Read and change a base-ten load' },
  'class-1-number-line-arrow': { skill: 'sequence', title: 'Read an equal-jump number line' },
  'class-1-digit-card-order': { skill: 'place', title: 'Build a number from digit cards' },
  'class-1-hundred-chart-move': { skill: 'place', title: 'Move on a hundred-chart piece' },

  'class-1-part-whole-repair': { skill: 'mystery', title: 'Repair a part-whole bar' },
  'class-1-number-balance': { skill: 'mystery', title: 'Balance two number pans' },
  'class-1-fact-family-intruder': { skill: 'addition', title: 'Find the fact-family intruder' },
  'class-1-sample-change-compare': { skill: 'subtraction', title: 'Compare two changed collections' },

  'class-1-bead-string-gap': { skill: 'repeat', title: 'Replace a missing patterned bead' },
  'class-1-growing-tile-stage': { skill: 'sequence', title: 'Continue a growing tile design' },
  'class-1-skip-count-trail': { skill: 'sequence', title: 'Repair a skip-count trail' },
  'class-1-code-output-table': { skill: 'coding', title: 'Complete an input-output code' },

  'class-1-shape-outpost': { skill: 'shape', title: 'Count one shape in an outpost' },
  'class-1-solid-motion': { skill: 'solids', title: 'Choose a solid by its properties' },
  'class-1-mirror-badge': { skill: 'symmetry', title: 'Complete a mirror badge' },
  'class-1-corner-badge': { skill: 'shape', title: 'Combine corners on a badge' },

  'class-1-unit-chain': { skill: 'measure', title: 'Measure with equal informal units' },
  'class-1-ruler-span': { skill: 'measure', title: 'Measure from two ruler marks' },
  'class-1-sample-mass': { skill: 'measure', title: 'Find a mass on a balance' },
  'class-1-capacity-cups': { skill: 'measure', title: 'Find cups needed to fill a tank' },

  'class-1-clock-read': { skill: 'time', title: 'Read an analogue mission clock' },
  'class-1-clock-choice': { skill: 'time', title: 'Choose the clock for a time' },
  'class-1-rover-schedule': { skill: 'time', title: 'Follow a short rover schedule' },
  'class-1-mission-calendar': { skill: 'calendar', title: 'Find a weekday on a calendar' },

  'class-1-coin-pouch': { skill: 'money', title: 'Add coins in a supply pouch' },
  'class-1-exact-coin-tray': { skill: 'money', title: 'Choose an exact coin tray' },
  'class-1-supply-shop-pair': { skill: 'money', title: 'Add two prices on a shop board' },
  'class-1-shopping-change': { skill: 'money', title: 'Find change after buying supplies' },

  'class-1-queue-rank': { skill: 'ranking', title: 'Reason about a queue position' },
  'class-1-odd-signal-badge': { skill: 'odd', title: 'Find the badge that breaks a rule' },
  'class-1-rover-grid-route': { skill: 'directions', title: 'Follow moves on a labelled grid' },
  'class-1-signal-analogy': { skill: 'visual', title: 'Copy a change between signal badges' },
};

export const MISCONCEPTIONS = {
  ...TEXT_MISCONCEPTIONS,
  ...REAL_MISCONCEPTIONS,
  'class-1-line-jump': { title: 'Equal number-line jumps', message: 'Use the same amount for every jump, then count from the labelled tick.' },
  'class-1-card-place': { title: 'Digit card places', message: 'The digit in the tens place decides which two-digit number is greater.' },
  'class-1-fact-link': { title: 'One fact family', message: 'A fact family uses the same whole and the same two parts in every equation.' },
  'class-1-growth-step': { title: 'Growing pattern step', message: 'Compare two neighbouring stages to find how many tiles are added each time.' },
  'class-1-solid-property': { title: 'Solid properties', message: 'Check flat faces, curved surfaces and points instead of matching the object name.' },
  'class-1-corner-total': { title: 'Corners in all shapes', message: 'Count the corners on every shown shape, then combine the counts.' },
  'class-1-capacity-left': { title: 'Space left in a container', message: 'Take the amount already poured from the full capacity.' },
  'class-1-schedule-duration': { title: 'Following a schedule', message: 'Start at the shown time and move forward by the full activity duration.' },
  'class-1-exact-coins': { title: 'Exact coin amount', message: 'Add the values in one tray and check both the amount and the number of coins.' },
  'class-1-map-axis': { title: 'Grid directions', message: 'Move across the letter columns and up or down the numbered rows.' },
  'class-1-analogy-rule': { title: 'Copying one picture rule', message: 'Change the same property in the second pair and keep every other property.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

const NUMBERS = 'class-1-base-ten-build class-1-number-line-arrow class-1-digit-card-order class-1-hundred-chart-move';
const OPERATIONS = 'class-1-part-whole-repair class-1-number-balance class-1-fact-family-intruder class-1-sample-change-compare';
const PATTERNS = 'class-1-bead-string-gap class-1-growing-tile-stage class-1-skip-count-trail class-1-code-output-table';
const GEOMETRY = 'class-1-shape-outpost class-1-solid-motion class-1-mirror-badge class-1-corner-badge';
const MEASUREMENT = 'class-1-unit-chain class-1-ruler-span class-1-sample-mass class-1-capacity-cups';
const TIME = 'class-1-clock-read class-1-clock-choice class-1-rover-schedule class-1-mission-calendar';
const MONEY = 'class-1-coin-pouch class-1-exact-coin-tray class-1-supply-shop-pair class-1-shopping-change';
const REASONING = 'class-1-queue-rank class-1-odd-signal-badge class-1-rover-grid-route class-1-signal-analogy';

// Real papers mix pictured and sentence questions; each chapter row keeps text under half.
const TEXT_NUMBERS = 'class-1-number-name class-1-expanded-form class-1-compare-numbers';
const TEXT_OPERATIONS = 'class-1-add-story class-1-number-sentence class-1-true-pair class-1-equal-groups';
const TEXT_PATTERNS = 'class-1-letter-gap class-1-word-repeat';
const TEXT_GEOMETRY = 'class-1-shape-facts class-1-real-solids';
const TEXT_MEASUREMENT = 'class-1-choose-unit class-1-length-story';
const TEXT_TIME = 'class-1-days-months class-1-time-shift';
const TEXT_MONEY = 'class-1-price-compare class-1-note-count';
const TEXT_REASONING = 'class-1-stack-order class-1-word-odd class-1-word-analogy';

function rows(pictured, text, real) {
  const art = pictured.split(' ');
  const words = text.split(' ');
  const paper = real.split(' ');
  const keep = words.length > 1 ? Math.min(words.length - 1, 3) : 1;
  return [
    [...art.slice(0, 3), ...paper, ...words.slice(0, keep)].join(' '),
    [...art.slice(1), ...paper, ...words.slice(-keep)].join(' '),
    [...art, ...paper, ...words].join(' '),
  ];
}

export const PLAN = {
  numbers: rows(NUMBERS, TEXT_NUMBERS, REAL_PLAN.numbers),
  operations: rows(OPERATIONS, TEXT_OPERATIONS, REAL_PLAN.operations),
  patterns: rows(PATTERNS, TEXT_PATTERNS, REAL_PLAN.patterns),
  geometry: rows(GEOMETRY, TEXT_GEOMETRY, REAL_PLAN.geometry),
  measurement: rows(MEASUREMENT, TEXT_MEASUREMENT, REAL_PLAN.measurement),
  time: rows(TIME, TEXT_TIME, REAL_PLAN.time),
  money: rows(MONEY, TEXT_MONEY, REAL_PLAN.money),
  reasoning: rows(REASONING, TEXT_REASONING, REAL_PLAN.reasoning),
};

const FILLS = ['#4d9986', '#efc267', '#c65f4b', '#7563a8'];
const SHAPES = ['circle', 'triangle', 'square', 'rectangle', 'pentagon', 'hexagon'];
const MARKS = ['dot', 'stripe', 'ring', 'cross'];
const NAMES = ['Asha', 'Dev', 'Ira', 'Kabir', 'Mina', 'Neel', 'Ovi', 'Ria', 'Tara', 'Zoya'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COINS = [1, 2, 5, 10];

const sum = values => values.reduce((total, value) => total + value, 0);
const noun = (n, one, many) => n === 1 ? one : many;
const code = r => r.pick(NAMES);
const shapeCorners = shape => ({ circle: 0, triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 })[shape];
const ordinal = value => {
  const suffix = value % 10 === 1 && value % 100 !== 11 ? 'st'
    : value % 10 === 2 && value % 100 !== 12 ? 'nd'
      : value % 10 === 3 && value % 100 !== 13 ? 'rd' : 'th';
  return `${value}${suffix}`;
};

function question(family, prompt, answer, hint, explanation, givens, choices, visual) {
  return {
    family, prompt, answer: String(answer), hint, explanation,
    proof: { family, givens },
    ...(visual ? { visual } : {}),
    choices,
  };
}

function numberChoices(answer, alternatives, count, visual = null) {
  let ordered = alternatives;
  const cueValue = value => {
    const match = /^(?:Rs )?(-?\d+)(?:(?:st|nd|rd|th)| [A-Za-z]+)?$/.exec(String(value));
    return match ? Number(match[1]) : null;
  };
  const target = cueValue(answer);
  if (target != null) {
    const lower = alternatives.filter(([value]) => cueValue(value) != null && cueValue(value) < target);
    const upper = alternatives.filter(([value]) => cueValue(value) != null && cueValue(value) > target);
    const preferred = target % 2 ? lower : upper;
    const otherSide = preferred === lower ? upper : lower;
    const sameSide = preferred.length >= count - 1 ? preferred : otherSide.length >= count - 1 ? otherSide : null;
    if (sameSide) ordered = [...sameSide, ...alternatives.filter(entry => !sameSide.includes(entry))];
  }
  return answerChoices(answer, ordered.map(([value, feedback, optionVisual]) =>
    wrong(value, feedback, optionVisual)), count, visual, KNOWN);
}

const FILL_NAMES = { '#4d9986': 'green', '#efc267': 'gold', '#c65f4b': 'red', '#7563a8': 'purple' };
const beadKey = bead => `${FILL_NAMES[bead.fill]} ${bead.shape} with a ${bead.mark}, pointing ${bead.facing ?? 'up'}`;
const coinKey = coins => [...coins].sort((a, b) => a - b).join('+');
const gridKey = cells => cells.map(row => row.join('')).join('-');
const badgeKey = badge => `${FILL_NAMES[badge.fill]} ${badge.shape} with a ${badge.mark}, pointing ${badge.facing ?? 'up'}`;

function beadVisual(bead) {
  return {
    kind: 'v3-class-1-bead-choice', ...bead,
    description: `${bead.mark} ${bead.shape} bead with ${bead.fill} fill, pointing ${bead.facing ?? 'up'}.`,
  };
}

function clockVisual(minutes) {
  return {
    kind: 'v3-class-1-clock-choice', minutes,
    description: `Clock showing ${timeText(minutes)}.`,
  };
}

function coinTrayVisual(coins) {
  return {
    kind: 'v3-class-1-coin-tray', coins: [...coins],
    description: `Coin tray containing values ${coins.join(', ')} rupees.`,
  };
}

function badgeVisual(kind, badge, label) {
  return {
    kind, ...badge,
    description: `${label}: ${badge.mark} ${badge.shape}, ${badge.fill} fill, pointing ${badge.facing ?? 'up'}.`,
  };
}

function mirrorRows(left) {
  return left.map(row => [...row, ...[...row].reverse()]);
}

function shiftedGrid(cells) {
  return cells.map((row, index) => index % 2 ? [...row].reverse() : [...row]);
}

function solidMatches(shape, property) {
  if (property === 'six-faces') return shape === 'cube';
  if (property === 'no-flat-face') return shape === 'sphere';
  if (property === 'two-flat-one-curved') return shape === 'cylinder';
  if (property === 'one-point-one-flat') return shape === 'cone';
  return false;
}

function transformBadge(badge, transform) {
  if (transform === 'change-mark') {
    const mark = badge.mark === 'dot' ? 'stripe' : badge.mark === 'stripe' ? 'ring' : 'dot';
    return { ...badge, mark };
  }
  if (transform === 'turn-right') {
    const directions = ['up', 'right', 'down', 'left'];
    return { ...badge, facing: directions[(directions.indexOf(badge.facing ?? 'up') + 1) % 4] };
  }
  if (transform === 'change-shape') {
    const shapes = ['circle', 'triangle', 'square', 'pentagon'];
    return { ...badge, shape: shapes[(shapes.indexOf(badge.shape) + 1) % shapes.length] };
  }
  return { ...badge, fill: FILLS[(FILLS.indexOf(badge.fill) + 1) % FILLS.length] };
}

export function draft(family, grade, level, r) {
  const count = choiceCount(grade);
  if (TEXT_FAMILIES[family]) return draftText(family, level, r, count);
  if (REAL_FAMILIES[family]) return draftReal(family, level, r, count);

  if (family === 'class-1-base-ten-build') {
    const bay = code(r, 'B');
    let tens = r.int(1, level === 1 ? 5 : 8);
    let ones = r.int(0, 9);
    let change = 0;
    let action = 'Count them all.';
    if (level === 2) {
      change = r.pick([0, 10, -10]);
      if (change < 0 && tens === 1) tens = 2;
      action = change === 10 ? 'One ten rod arrives.' : change === -10 ? 'One ten rod leaves.' : 'Count them all.';
    }
    if (level === 3) {
      change = r.pick([10, -10, 1, -1]);
      if (change === -10 && tens === 1) tens = 2;
      if (change === 1 && ones === 9) ones = 8;
      if (change === -1 && ones === 0) ones = 1;
      action = change === 10 ? 'One ten rod arrives.' : change === -10 ? 'One ten rod leaves.'
        : change === 1 ? 'One cube arrives.' : 'One cube leaves.';
    }
    const base = tens * 10 + ones;
    const answer = base + change;
    const visual = {
      kind: 'v3-class-1-base-ten', tens, ones, bay,
      description: `${bay}'s crate has ${tens} ${noun(tens, 'ten rod', 'ten rods')} and ${ones} ${noun(ones, 'single cube', 'single cubes')}.`,
    };
    return question(
      family, `${bay}'s crate holds rods and cubes. ${action} What number is it?`, answer,
      'Count tens first, then ones, and apply the pictured change.',
      `${tens} ${noun(tens, 'ten', 'tens')} and ${ones} ${noun(ones, 'one', 'ones')} make ${base}${change ? `; the change gives ${answer}` : ''}.`,
      { change }, numberChoices(answer, [
        [base + (change ? -change : 10), 'place-shift'],
        [tens + ones, 'face-value'],
        [answer + 10, 'place-shift'],
        [answer - 10, 'place-shift'],
        [answer + 1, 'ignored-change'],
      ], count), visual,
    );
  }

  if (family === 'class-1-number-line-arrow') {
    const step = level === 1 ? r.pick([1, 2]) : level === 2 ? r.pick([2, 5]) : r.pick([2, 5, 10]);
    const start = step === 10 ? r.int(0, 4) * 10 : r.int(0, level === 1 ? 12 : 30);
    const targetIndex = r.int(1, 4);
    const points = 6;
    const answer = start + targetIndex * step;
    const tag = code(r, 'L');
    const visual = {
      kind: 'v3-class-1-number-line', start, step, targetIndex, count: points, code: tag, level,
      description: `Number line ${tag} starts at ${start}, has ${points} equal ticks of ${step}, and the arrow points to tick ${targetIndex + 1}.`,
    };
    return question(
      family, `${tag}'s arrow points on a line that jumps by ${step}. Which number is it?`, answer,
      'Begin at the labelled tick and make equal jumps to the arrow.',
      `${targetIndex} ${noun(targetIndex, 'jump', 'jumps')} of ${step} from ${start} ${targetIndex === 1 ? 'lands' : 'land'} on ${answer}.`,
      {}, numberChoices(answer, [
        [answer - step, 'class-1-line-jump'],
        [answer + step, 'class-1-line-jump'],
        [start + targetIndex, 'class-1-line-jump'],
        [answer - 1, 'missing-step'],
        [answer + 1, 'missing-step'],
      ], count), visual,
    );
  }

  if (family === 'class-1-digit-card-order') {
    let first = r.int(level === 1 ? 1 : 0, 9);
    let second = r.int(0, 9);
    if (first === second) throw new QuestionRetry('Digit cards need different digits.');
    if (first === 0 && second === 0) throw new QuestionRetry('A two-digit number needs a tens digit.');
    const larger = Math.max(first, second);
    const smaller = Math.min(first, second);
    const greatest = larger * 10 + smaller;
    const least = smaller === 0 ? larger * 10 : smaller * 10 + larger;
    const mode = level === 1 ? r.pick(['greatest', 'least']) : level === 2
      ? r.pick(['greatest', 'least', 'swap']) : r.pick(['greatest', 'least', 'difference']);
    if (mode === 'difference' && (first === 0 || second === 0)) throw new QuestionRetry('A zero card leaves only one number, so the difference is 0.');
    let answer;
    let prompt;
    let explanation;
    if (mode === 'greatest') {
      answer = greatest;
      prompt = `Cards ${first} and ${second}: make the greatest two-digit signal number.`;
      explanation = `Put ${larger} in the tens place and ${smaller} in the ones place: ${answer}.`;
    } else if (mode === 'least') {
      answer = least;
      prompt = `Cards ${first} and ${second}: make the least two-digit signal number.`;
      explanation = `${answer} is the least valid two-digit number using both cards once.`;
    } else if (mode === 'swap') {
      const shown = first === 0 ? second * 10 : first * 10 + second;
      answer = Number(String(shown).padStart(2, '0').split('').reverse().join(''));
      prompt = `Swap the digit cards in ${shown}. What new number appears?`;
      explanation = `The tens and ones trade places, so ${shown} becomes ${answer}.`;
    } else {
      answer = greatest - least;
      prompt = `Cards ${first} and ${second}: greatest number minus least number equals what?`;
      explanation = `${greatest} - ${least} = ${answer}.`;
    }
    const visual = {
      kind: 'v3-class-1-digit-cards', first, second, mode,
      description: `Two mission digit cards show ${first} and ${second}; the task is ${mode}.`,
    };
    return question(
      family, prompt, answer,
      'Choose the tens digit first; it controls the size of the number.',
      explanation, { first, second, mode }, numberChoices(answer, [
        [first * 10 + second, 'class-1-card-place'],
        [second * 10 + first, 'class-1-card-place'],
        [first + second, 'face-value'],
        [answer + 10, 'place-shift'],
        [Math.abs(first - second), 'wrong-operation'],
      ], count), visual,
    );
  }

  if (family === 'class-1-hundred-chart-move') {
    const startCol = r.int(1, 8);
    const startRow = r.int(1, 7);
    const start = startRow * 10 + startCol;
    let dx = level === 1 ? r.pick([-1, 1]) : r.int(-2, 2);
    let dy = level === 1 ? 0 : level === 2 ? r.pick([-1, 1]) : r.int(-2, 2);
    if (!dx && !dy) dx = 1;
    const endCol = startCol + dx;
    const endRow = startRow + dy;
    if (endCol < 0 || endCol > 9 || endRow < 0 || endRow > 9) throw new QuestionRetry('The hundred-chart route left the chart.');
    const answer = start + dx + dy * 10;
    const rover = code(r, 'R');
    const across = dx ? `${Math.abs(dx)} ${dx > 0 ? 'right' : 'left'}` : 'no sideways move';
    const vertical = dy ? `${Math.abs(dy)} ${dy > 0 ? 'down' : 'up'}` : 'no up or down move';
    const visual = {
      kind: 'v3-class-1-hundred-move', start, dx, dy, rover,
      description: `Hundred-chart route for ${rover}: start at ${start}, move ${across}, then ${vertical}.`,
    };
    return question(
      family, `${rover} starts at ${start}. Move ${across}, then ${vertical}. Where does it land?`, answer,
      'Across changes ones; moving down or up changes tens.',
      `${start}${dx ? ` ${dx > 0 ? '+' : '-'} ${Math.abs(dx)}` : ''}${dy ? ` ${dy > 0 ? '+' : '-'} ${Math.abs(dy * 10)}` : ''} = ${answer}.`,
      {}, numberChoices(answer, [
        [start + dx + dy, 'place-shift'],
        [start - dx - dy * 10, 'class-1-line-jump'],
        [start + dy + dx * 10, 'place-shift'],
        [answer + 1, 'missing-step'],
        [answer - 1, 'missing-step'],
        [answer + 10, 'place-shift'],
        [answer - 10, 'place-shift'],
      ].filter(([value]) => value >= 1 && value <= 100), count), visual,
    );
  }

  if (family === 'class-1-part-whole-repair') {
    const max = level === 1 ? 10 : level === 2 ? 20 : 40;
    const left = r.int(2, Math.floor(max / 2));
    const right = r.int(1, Math.max(2, max - left));
    const whole = left + right;
    const unknown = level === 1 ? r.pick(['left', 'right']) : r.pick(['left', 'right', 'whole']);
    const answer = unknown === 'whole' ? whole : unknown === 'left' ? left : right;
    const known = unknown === 'left' ? right : left;
    const tag = code(r, 'P');
    const visual = {
      kind: 'v3-class-1-part-whole', left, right, whole, unknown, code: tag,
      description: `Part-whole bar ${tag}: whole ${unknown === 'whole' ? 'unknown' : whole}, left part ${unknown === 'left' ? 'unknown' : left}, right part ${unknown === 'right' ? 'unknown' : right}.`,
    };
    return question(
      family, `What number is hiding in ${tag}'s bar?`, answer,
      'The two parts join to make the whole bar.',
      unknown === 'whole' ? `${left} + ${right} = ${whole}.` : `${whole} - ${known} = ${answer}.`,
      { unknown }, numberChoices(answer, [
        [whole, 'wrong-operation'],
        [known, 'wrong-operation'],
        [answer + 1, 'missing-step'],
        [Math.abs(left - right), 'wrong-operation'],
        [answer - 1, 'missing-step'],
      ], count), visual,
    );
  }

  if (family === 'class-1-number-balance') {
    const left = level === 1 ? [r.int(5, 12)] : [r.int(3, 10), r.int(2, level === 2 ? 8 : 12)];
    const leftTotal = sum(left);
    const knownCount = level === 3 ? 2 : 1;
    const rightKnown = Array.from({ length: knownCount }, () => r.int(1, Math.max(2, Math.floor(leftTotal / (knownCount + 1)))));
    const answer = leftTotal - sum(rightKnown);
    if (answer < 1) throw new QuestionRetry('The missing balance number must be positive.');
    const tag = code(r, 'N');
    const visual = {
      kind: 'v3-class-1-number-balance', left, rightKnown, code: tag,
      description: `Balanced number pans ${tag}: left pan has ${left.join(' and ')}; right pan has ${rightKnown.join(' and ')} plus an unknown number.`,
    };
    return question(
      family, `${tag}'s scale is level. Which number replaces the question mark?`, answer,
      'Both pans need the same total. Find the known total first.',
      `${left.join(' + ')} = ${leftTotal}; ${leftTotal} - ${sum(rightKnown)} = ${answer}.`,
      {}, numberChoices(answer, [
        [leftTotal, 'balance-total'],
        [sum(rightKnown), 'balance-total'],
        [answer + 1, 'missing-step'],
        [Math.abs(leftTotal - answer), 'wrong-operation'],
        [answer - 1, 'missing-step'],
      ], count), visual,
    );
  }

  if (family === 'class-1-fact-family-intruder') {
    const max = level === 1 ? 10 : 20;
    const a = r.int(1, Math.floor(max / 2));
    const b = r.int(1, max - a);
    const whole = a + b;
    const delta = r.pick([1, 2]);
    const badType = r.int(0, 2);
    const bad = badType === 0 ? `${a} + ${b} = ${whole + delta}`
      : badType === 1 ? `${whole} - ${a} = ${Math.max(0, b - delta)}`
        : `${whole} - ${b} = ${a + delta}`;
    const facts = [`${a} + ${b} = ${whole}`, `${b} + ${a} = ${whole}`, `${whole} - ${a} = ${b}`, `${whole} - ${b} = ${a}`];
    const visual = {
      kind: 'v3-class-1-fact-board', a, b, whole, delta, badType,
      description: `Fact-family cargo board with parts ${a} and ${b} joining to make whole ${whole}.`,
    };
    return question(
      family, `Numbers ${a}, ${b}, ${whole} form a fact family. Which fact sneaked in?`, bad,
      'Keep the same whole and the same two parts in every fact.',
      `${a} and ${b} are the parts; ${whole} is the whole. ${bad} does not fit.`,
      {}, answerChoices(bad, facts.map(value => wrong(value, 'class-1-fact-link')), count, null, KNOWN), visual,
    );
  }

  if (family === 'class-1-sample-change-compare') {
    const [leftName, rightName] = r.shuffle(NAMES).slice(0, 2);
    const limit = level === 1 ? 10 : 18;
    const leftStart = r.int(4, limit);
    const rightStart = r.int(3, limit);
    const changes = level === 1 ? [r.int(1, 3), 0] : level === 2
      ? [r.int(-3, 4), r.int(-3, 4)] : [r.int(-5, 5), r.int(-5, 5)];
    const leftChange = Math.max(-leftStart + 1, changes[0]);
    const rightChange = Math.max(-rightStart + 1, changes[1]);
    const leftFinal = leftStart + leftChange;
    const rightFinal = rightStart + rightChange;
    if (leftFinal === rightFinal) throw new QuestionRetry('The changed collections need a clear comparison.');
    const answer = Math.abs(leftFinal - rightFinal);
    const tag = code(r, 'S');
    const visual = {
      kind: 'v3-class-1-compare-change', leftName, rightName, leftStart, rightStart, leftChange, rightChange, code: tag,
      description: `Sample scene ${tag}: ${leftName} starts with ${leftStart} tubes and changes by ${leftChange}; ${rightName} starts with ${rightStart} tubes and changes by ${rightChange}.`,
    };
    return question(
      family, `After both changes, how many more tubes does the fuller crate of ${tag} have?`, answer,
      'Update each crate first, then compare the two final amounts.',
      `${leftName} has ${leftFinal}; ${rightName} has ${rightFinal}. Their difference is ${answer}.`,
      {}, numberChoices(answer, [
        [Math.abs(leftStart - rightStart), 'ignored-change'],
        [leftFinal + rightFinal, 'wrong-operation'],
        [Math.max(leftFinal, rightFinal), 'wrong-operation'],
        [answer + 1, 'missing-step'],
        [Math.max(0, answer - 1), 'missing-step'],
      ], count), visual,
    );
  }

  if (family === 'class-1-bead-string-gap') {
    const shapes = r.shuffle(['circle', 'triangle', 'square', 'pentagon']).slice(0, 3);
    const marks = r.shuffle(MARKS).slice(0, 3);
    const unitLength = level === 1 ? 2 : r.pick([2, 3]);
    const unit = Array.from({ length: unitLength }, (_, index) => ({
      shape: shapes[index], mark: marks[index], fill: FILLS[index], facing: index % 2 ? 'right' : 'up',
    }));
    const length = level === 3 ? 9 : 8;
    const sequence = Array.from({ length }, (_, index) => unit[index % unit.length]);
    const gapIndex = r.int(2, length - 2);
    const target = sequence[gapIndex];
    const tag = code(r, 'G');
    const candidates = [
      target,
      { ...target, shape: shapes[(shapes.indexOf(target.shape) + 1) % shapes.length] },
      { ...target, mark: marks[(marks.indexOf(target.mark) + 1) % marks.length] },
      {
        ...target,
        fill: FILLS[(FILLS.indexOf(target.fill) + 1) % FILLS.length],
        mark: marks[(marks.indexOf(target.mark) + 1) % marks.length],
      },
      { ...target, facing: target.facing === 'up' ? 'right' : 'up' },
    ];
    const visual = {
      kind: 'v3-class-1-bead-gap', sequence, gapIndex, code: tag,
      description: `Bead string ${tag}: ${sequence.map((bead, index) => index === gapIndex ? 'missing bead' : `${bead.mark} ${bead.shape}`).join(', ')}.`,
    };
    return question(
      family, `Bead ${gapIndex + 1} is missing from ${tag}'s string. Which bead keeps the pattern?`, beadKey(target),
      'Find the whole repeating group, then match the missing position.',
      `The repeat has ${unit.length} beads, so position ${gapIndex + 1} matches the ${target.mark} ${target.shape}.`,
      {}, numberChoices(beadKey(target), candidates.slice(1).map((bead, index) => [
        beadKey(bead), index < 2 ? 'repeat-unit' : 'ignored-mark', beadVisual(bead),
      ]), count, beadVisual(target)), visual,
    );
  }

  if (family === 'class-1-growing-tile-stage') {
    const start = r.int(1, level === 1 ? 4 : 6);
    const step = level === 1 ? 1 : level === 2 ? r.pick([1, 2, 3]) : r.pick([2, 3, 4]);
    const counts = [start, start + step, start + step * 2];
    const targetStage = level === 3 ? 5 : 4;
    const answer = start + step * (targetStage - 1);
    if (answer === targetStage) throw new QuestionRetry('The answer would just repeat the stage number.');
    const tag = code(r, 'T');
    const visual = {
      kind: 'v3-class-1-growing-tiles', counts, step, targetStage, code: tag,
      description: `Growing tiles ${tag}: stages 1, 2 and 3 have ${counts.join(', ')} tiles; each stage adds ${step}; find stage ${targetStage}.`,
    };
    return question(
      family, `${tag} builds tiles that grow by the same amount. How many are in stage ${targetStage}?`, answer,
      'Compare neighbouring stages, then repeat that growth to the target.',
      `Each stage adds ${step}. Stage ${targetStage} has ${start} + ${step * (targetStage - 1)} = ${answer} tiles.`,
      {}, numberChoices(answer, [
        [answer - step, 'class-1-growth-step'],
        [answer + step, 'class-1-growth-step'],
        [answer + step * 2, 'class-1-growth-step'],
        [Math.max(0, answer - step * 2), 'class-1-growth-step'],
        [answer + 1, 'missing-step'],
      ], count), visual,
    );
  }

  if (family === 'class-1-skip-count-trail') {
    const step = level === 1 ? r.pick([1, 2]) : level === 2 ? r.pick([2, 5]) : r.pick([2, 5, 10]);
    const direction = level === 3 && r.int(0, 1) ? -1 : 1;
    const start = direction > 0 ? r.int(0, 30) : r.int(step * 5, Math.min(90, step * 5 + 35));
    const length = 6;
    const missingIndex = r.int(1, length - 2);
    const terms = Array.from({ length }, (_, index) => start + direction * step * index);
    const answer = terms[missingIndex];
    const shown = terms.map((value, index) => index === missingIndex ? '?' : value).join(', ');
    const visual = {
      kind: 'v3-class-1-skip-trail', start, step, direction, missingIndex, length,
      description: `Signal stepping-stone trail reads ${shown}; each move changes by ${step}.`,
    };
    return question(
      family, `Which number is missing: ${shown}?`, answer,
      'Check the equal step between two neighbouring numbers.',
      `The trail ${direction > 0 ? 'adds' : 'subtracts'} ${step} each time, so the missing number is ${answer}.`,
      { start, step, direction, missingIndex }, numberChoices(answer, [
        [answer - direction * step, 'class-1-line-jump'],
        [answer + direction * step, 'class-1-line-jump'],
        [start + direction * missingIndex, 'class-1-line-jump'],
        [answer + 1, 'missing-step'],
        [answer - 1, 'missing-step'],
      ], count), visual,
    );
  }

  if (family === 'class-1-code-output-table') {
    const add = level === 1 ? r.int(1, 3) : level === 2 ? r.int(2, 6) : r.int(4, 9);
    const inputs = r.shuffle(Array.from({ length: 10 }, (_, index) => index + 1)).slice(0, 4).sort((a, b) => a - b);
    const targetIndex = r.int(1, 3);
    const rows = inputs.map((input, index) => ({ input, output: index === targetIndex ? null : input + add }));
    const answer = inputs[targetIndex] + add;
    const tag = code(r, 'C');
    const visual = {
      kind: 'v3-class-1-code-table', rows, add, targetIndex, code: tag,
      description: `Code table ${tag}: ${rows.map(row => `${row.input} goes to ${row.output ?? 'missing'}`).join('; ')}; every output is input plus ${add}.`,
    };
    return question(
      family, `${tag}'s code table follows one rule. What output is missing?`, answer,
      'Compare a complete input-output pair, then use the same change.',
      `Every output is ${add} more than its input. ${inputs[targetIndex]} + ${add} = ${answer}.`,
      {}, numberChoices(answer, [
        [inputs[targetIndex], 'code-order'],
        [answer - add, 'code-order'],
        [answer + add, 'code-order'],
        [answer + 1, 'missing-step'],
        [Math.max(0, answer - 1), 'missing-step'],
      ], count), visual,
    );
  }

  if (family === 'class-1-shape-outpost') {
    const target = r.pick(level === 1 ? ['circle', 'triangle', 'square'] : ['circle', 'triangle', 'square', 'rectangle']);
    const counts = {
      circle: r.int(1, level === 1 ? 4 : 6),
      triangle: r.int(1, level === 1 ? 4 : 6),
      square: r.int(1, level === 1 ? 4 : 6),
      rectangle: r.int(1, level === 3 ? 5 : 3),
    };
    const answer = counts[target];
    const tag = code(r, 'O');
    const visual = {
      kind: 'v3-class-1-shape-scene', counts, target, code: tag,
      description: `Outpost map ${tag} contains ${counts.circle} ${noun(counts.circle, 'circle', 'circles')}, ${counts.triangle} ${noun(counts.triangle, 'triangle', 'triangles')}, ${counts.square} ${noun(counts.square, 'square', 'squares')} and ${counts.rectangle} ${noun(counts.rectangle, 'rectangle', 'rectangles')}.`,
    };
    return question(
      family, `Count only the ${target}s on ${tag}'s map. How many are there?`, answer,
      `Point to each ${target} once and ignore every other shape.`,
      `There ${answer === 1 ? 'is' : 'are'} ${answer} ${noun(answer, target, `${target}s`)} in map ${tag}.`,
      { target }, numberChoices(answer, [
        [sum(Object.values(counts)), 'included-extra'],
        [counts[target === 'circle' ? 'triangle' : 'circle'], 'sorting-rule'],
        [answer + 1, 'included-extra'],
        [Math.max(0, answer - 1), 'missed-object'],
        [counts.rectangle, 'sorting-rule'],
      ], count), visual,
    );
  }

  if (family === 'class-1-solid-motion') {
    const aliases = {
      cube: ['crate', 'block', 'cube box', 'repair case'],
      sphere: ['ball', 'round moon', 'orb', 'round sample'],
      cylinder: ['can', 'drum', 'tube case', 'battery roll'],
      cone: ['cone', 'signal cone', 'pointed cap', 'marker cone'],
    };
    const property = r.pick(['six-faces', 'no-flat-face', 'two-flat-one-curved', 'one-point-one-flat']);
    const shapes = r.shuffle(['cube', 'sphere', 'cylinder', 'cone']);
    const options = shapes.map((shape, index) => ({
      shape, item: r.pick(aliases[shape]), fill: FILLS[(index + r.int(0, 3)) % FILLS.length],
    }));
    if (new Set(options.map(option => option.item)).size !== 4) throw new QuestionRetry('Solid option names need to differ.');
    const target = options.find(option => solidMatches(option.shape, property));
    const propertyText = {
      'six-faces': 'six equal flat faces',
      'no-flat-face': 'no flat face',
      'two-flat-one-curved': 'two flat faces and one curved surface',
      'one-point-one-flat': 'one point and one flat face',
    }[property];
    const prompt = r.pick([`Which pictured object has ${propertyText}?`, `Which object in the picture has ${propertyText}?`]);
    const optionVisual = option => ({
      kind: 'v3-class-1-solid-choice', ...option,
      description: `${option.item}, drawn as a ${option.shape} with ${propertyText === 'no flat face' ? 'its visible surfaces' : 'clear faces and edges'}.`,
    });
    return question(
      family, prompt, target.item,
      'Think about flat faces, curved surfaces and points.',
      `The ${target.item} is a ${target.shape}, which has ${propertyText}.`,
      { property, options: options.map(({ shape, item }) => ({ shape, item })) },
      answerChoices(target.item, options.filter(option => option !== target).map(option =>
        wrong(option.item, 'class-1-solid-property', optionVisual(option))), count, optionVisual(target), KNOWN),
    );
  }

  if (family === 'class-1-mirror-badge') {
    const rows = level === 1 ? 3 : 4;
    const cols = 2;
    const left = Array.from({ length: rows }, () => Array.from({ length: cols }, () => r.int(0, level === 3 ? 2 : 1)));
    if (left.flat().every(value => value === 0)) left[0][0] = 1;
    const correct = mirrorRows(left);
    const wrongA = left.map(row => [...row, ...row]);
    const wrongB = shiftedGrid(correct);
    const wrongC = [...correct].reverse();
    const wrongD = correct.map((row, index) => index === 0 ? row.map(value => value ? 0 : 1) : [...row]);
    const candidates = [wrongA, wrongB, wrongC, wrongD].filter(cells => gridKey(cells) !== gridKey(correct));
    if (new Set(candidates.map(gridKey)).size < 3) throw new QuestionRetry('Mirror choices need different grids.');
    const tag = code(r, 'M');
    const main = {
      kind: 'v3-class-1-mirror-board', left, code: tag,
      description: `Mirror badge ${tag} shows left-half rows ${left.map(row => row.join(' ')).join('; ')} beside a vertical mirror line.`,
    };
    const optionVisual = cells => ({
      kind: 'v3-class-1-mirror-choice', cells,
      description: `Completed badge with rows ${cells.map(row => row.join(' ')).join('; ')}.`,
    });
    return question(
      family, `${tag}'s badge has a dotted mirror line. Which completed badge is correct?`, gridKey(correct),
      'Copy each square to the same distance on the other side.',
      'A mirror reverses each row across the vertical line.',
      { left }, answerChoices(gridKey(correct), candidates.map(cells =>
        wrong(gridKey(cells), 'wrong-transform', optionVisual(cells))), count, optionVisual(correct), KNOWN), main,
    );
  }

  if (family === 'class-1-corner-badge') {
    const pool = level === 1 ? ['triangle', 'square', 'rectangle'] : level === 2
      ? ['triangle', 'square', 'rectangle', 'pentagon'] : SHAPES;
    const shapeCount = level === 1 ? 2 : 3;
    const shapes = Array.from({ length: shapeCount }, () => r.pick(pool));
    const answer = sum(shapes.map(shapeCorners));
    const tag = code(r, 'B');
    const visual = {
      kind: 'v3-class-1-corner-badge', shapes, code: tag,
      description: `Corner badge ${tag} joins ${shapes.join(', ')} with ${shapes.map(shapeCorners).join(', ')} corners.`,
    };
    return question(
      family, `${tag}'s badge joins ${shapes.join(', ')}. How many corners are there altogether?`, answer,
      'Count the corners on each shape, then join the counts.',
      `${shapes.map(shape => `${shapeCorners(shape)} on the ${shape}`).join(' + ')} = ${answer}.`,
      {}, numberChoices(answer, [
        [shapes.length, 'class-1-corner-total'],
        [shapeCorners(shapes[0]), 'class-1-corner-total'],
        [answer + 1, 'included-extra'],
        [Math.max(0, answer - 1), 'missed-object'],
        [answer + shapes.length, 'class-1-corner-total'],
      ], count), visual,
    );
  }

  if (family === 'class-1-unit-chain') {
    const unit = r.pick(['cubes', 'clips', 'rods']);
    const amount = r.int(4, level === 1 ? 9 : level === 2 ? 13 : 18);
    const tag = code(r, 'U');
    const visual = {
      kind: 'v3-class-1-unit-chain', unit, count: amount, code: tag,
      description: `Repair part ${tag} is aligned with ${amount} equal ${unit} from end to end.`,
    };
    const answer = `${amount} ${unit}`;
    return question(
      family, `How many equal ${unit} long is ${tag}'s part?`, answer,
      'Count every equal unit once from one end to the other.',
      `The part covers ${amount} equal ${unit}, so its length is ${answer}.`,
      {}, numberChoices(answer, [
        [`${amount - 1} ${unit}`, 'missed-object'],
        [`${amount + 1} ${unit}`, 'included-extra'],
        [`${amount} cm`, 'unit-conversion'],
        [`${Math.max(1, amount - 2)} ${unit}`, 'missed-object'],
        [`${amount + 2} ${unit}`, 'included-extra'],
      ], count), visual,
    );
  }

  if (family === 'class-1-ruler-span') {
    const max = level === 1 ? 12 : 20;
    const start = level === 1 ? 0 : r.int(1, level === 2 ? 5 : 9);
    const length = r.int(3, Math.min(level === 1 ? 9 : 12, max - start));
    const end = start + length;
    const tag = code(r, 'R');
    const visual = {
      kind: 'v3-class-1-ruler-span', start, end, max, code: tag,
      description: `Repair strip ${tag} begins at ruler mark ${start} and ends at mark ${end}, in centimetres.`,
    };
    const answer = `${length} cm`;
    return question(
      family, `How long is ${tag}'s strip on the ruler?`, answer,
      'Use the finish mark minus the start mark.',
      `${end} - ${start} = ${length}, so the strip is ${answer}.`,
      {}, numberChoices(answer, [
        [`${end} cm`, 'scale-zero'],
        [`${start} cm`, 'scale-zero'],
        [`${length + 1} cm`, 'counted-endpoints'],
        [`${Math.max(1, length - 1)} cm`, 'counted-endpoints'],
        [`${end + start} cm`, 'wrong-operation'],
      ], count), visual,
    );
  }

  if (family === 'class-1-sample-mass') {
    const item = r.pick(['tube', 'rock', 'cell', 'part']);
    const rightCount = level === 1 ? 2 : 3;
    const rightWeights = Array.from({ length: rightCount }, () => r.int(1, level === 1 ? 5 : 8));
    const leftKnown = level === 3 ? [r.int(1, 4)] : [];
    const answerNumber = sum(rightWeights) - sum(leftKnown);
    if (answerNumber < 2) throw new QuestionRetry('The sample mass should stay positive.');
    const answer = `${answerNumber} g`;
    const tag = code(r, 'W');
    const visual = {
      kind: 'v3-class-1-mass-balance', item, rightWeights, leftKnown, code: tag,
      description: `Mass balance ${tag}: the ${item}${leftKnown.length ? ` plus ${leftKnown.join(' and ')} ${noun(leftKnown[0], 'gram', 'grams')}` : ''} balances weights of ${rightWeights.join(', ')} grams.`,
    };
    return question(
      family, `${tag}'s balance is level. What is the ${item}'s mass?`, answer,
      'Equal pans have equal mass. Combine the weights, then remove any known mass.',
      `${rightWeights.join(' + ')}${leftKnown.length ? ` - ${leftKnown.join(' - ')}` : ''} = ${answerNumber} g.`,
      {}, numberChoices(answer, [
        [`${sum(rightWeights)} g`, 'balance-total'],
        [`${sum(leftKnown) || rightWeights[0]} g`, 'balance-total'],
        [`${answerNumber + 1} g`, 'missing-step'],
        [`${Math.max(1, answerNumber - 1)} g`, 'missing-step'],
        [`${Math.max(1, sum(rightWeights) - rightWeights[0])} g`, 'balance-total'],
      ], count), visual,
    );
  }

  if (family === 'class-1-capacity-cups') {
    const tank = r.pick(['sample tank', 'coolant jar', 'water can', 'rover flask']);
    const capacity = r.int(level === 1 ? 6 : 10, level === 3 ? 24 : 18);
    const pours = level === 1 ? [r.int(1, capacity - 2)] : [
      r.int(1, Math.floor(capacity / 2)), r.int(1, Math.floor(capacity / 3)),
    ];
    let filled = sum(pours);
    let spilled = 0;
    if (level === 3) {
      spilled = r.int(0, Math.min(3, filled - 1));
      filled -= spilled;
    }
    if (filled >= capacity) throw new QuestionRetry('The tank should not already be full.');
    const answerNumber = capacity - filled;
    const cupText = value => `${value} ${noun(value, 'cup', 'cups')}`;
    const answer = cupText(answerNumber);
    const pourText = pours.map(value => `${value} ${noun(value, 'cup', 'cups')}`).join(' and ');
    const spillText = spilled ? ` Then ${spilled} ${noun(spilled, 'cup spills', 'cups spill')}.` : '';
    const visual = {
      kind: 'v3-class-1-capacity-shelf', tank, capacity, pours, spilled,
      description: `${tank} capacity board shows ${capacity} cups, pours of ${pours.join(' and ')} cups${spilled ? `, then ${spilled} spilled` : ''}.`,
    };
    return question(
      family, `A ${tank} holds ${capacity} cups. ${pourText} ${pours.length === 1 ? 'goes' : 'go'} in.${spillText} How many more?`, answer,
      'Find how much is in the container now, then compare with full.',
      `${capacity} - ${filled} = ${cupText(answerNumber)} still needed.`,
      { capacity, pours, spilled }, numberChoices(answer, [
        [cupText(capacity), 'class-1-capacity-left'],
        [cupText(filled), 'class-1-capacity-left'],
        [cupText(answerNumber + 1), 'missing-step'],
        [cupText(Math.max(1, answerNumber - 1)), 'missing-step'],
        [cupText(sum(pours)), spilled ? 'ignored-change' : 'wrong-operation'],
      ], count), visual,
    );
  }

  if (family === 'class-1-clock-read') {
    const minutePool = level === 1 ? [0] : level === 2 ? [0, 30] : [0, 15, 30, 45];
    const hour = r.int(1, 12);
    const minute = r.pick(minutePool);
    const minutes = hour % 12 * 60 + minute;
    const tag = code(r, 'C');
    const visual = {
      kind: 'v3-class-1-clock-read', minutes, code: tag,
      description: `${tag}'s mission clock shows ${timeText(minutes)} with its hour and minute hands.`,
    };
    const answer = timeText(minutes);
    const wrongMinute = minute === 0 ? 30 : minute === 30 ? 0 : minute === 15 ? 45 : 15;
    return question(
      family, `${tag} looks at the clock. What time is shown?`, answer,
      'Use the short hand for the hour and the long hand for minutes.',
      `The long hand shows ${minute} minutes and the short hand shows hour ${hour}: ${answer}.`,
      {}, numberChoices(answer, [
        [timeText(((hour + 1) % 12) * 60 + minute), 'clock-hands'],
        [timeText(hour % 12 * 60 + wrongMinute), 'clock-hands'],
        [timeText(((hour + 11) % 12) * 60 + wrongMinute), 'clock-hands'],
        [timeText(((hour + 11) % 12) * 60 + minute), 'time-direction'],
        [timeText(hour % 12 * 60 + ((minute + 15) % 60)), 'clock-hands'],
      ], count), visual,
    );
  }

  if (family === 'class-1-clock-choice') {
    const minutePool = level === 1 ? [0] : level === 2 ? [0, 30] : [0, 15, 30, 45];
    const hour = r.int(1, 12);
    const minute = r.pick(minutePool);
    const target = hour % 12 * 60 + minute;
    const tag = code(r, 'K');
    const candidates = [
      target,
      ((hour + 1) % 12) * 60 + minute,
      hour % 12 * 60 + (minute === 0 ? 30 : 0),
      ((hour + 11) % 12) * 60 + minute,
      hour % 12 * 60 + ((minute + 15) % 60),
    ].map(value => ((value % 720) + 720) % 720);
    const unique = [...new Set(candidates)];
    if (unique.length < 4) throw new QuestionRetry('Clock choices need four different times.');
    const answer = timeText(target);
    return question(
      family, `${tag} sets a clock to ${answer}. Which clock shows it?`, answer,
      'Match the long hand to minutes, then check the short hand.',
      `The correct clock has its hands at ${answer}.`,
      { target }, answerChoices(answer, unique.filter(value => value !== target).map(value =>
        wrong(timeText(value), 'clock-hands', clockVisual(value))), count, clockVisual(target), KNOWN),
    );
  }

  if (family === 'class-1-rover-schedule') {
    const rover = code(r, 'R');
    const startMinute = level === 1 ? 0 : r.pick(level === 2 ? [0, 30] : [0, 15, 30, 45]);
    const startHour = r.int(1, 10);
    const start = startHour * 60 + startMinute;
    const durations = level === 1 ? [60] : level === 2 ? [30, 60, 90] : [15, 30, 45, 75];
    const first = r.pick(durations);
    const second = level === 3 ? r.pick([15, 30]) : 0;
    const answerMinutes = start + first + second;
    const answer = timeText(answerMinutes);
    const secondText = second ? ` and a ${second}-minute signal test` : '';
    const visual = {
      kind: 'v3-class-1-schedule-board', rover, start, first, second,
      description: `Rover schedule ${rover} starts at ${timeText(start)}, then has activities lasting ${first}${second ? ` and ${second}` : ''} minutes.`,
    };
    return question(
      family, `${rover} starts at ${timeText(start)}. A ${first}-minute check${secondText} follows. When does it end?`, answer,
      'Move forward by each activity time in the order shown.',
      `${timeText(start)} plus ${first + second} minutes ends at ${answer}.`,
      {}, numberChoices(answer, [
        [timeText(start + first), 'class-1-schedule-duration'],
        [timeText(start - first - second), 'time-direction'],
        [timeText(start + first + second + 30), 'hour-carry'],
        [timeText(start + first + second - 15), 'missing-step'],
        [timeText(start + second), 'class-1-schedule-duration'],
      ], count), visual,
    );
  }

  if (family === 'class-1-mission-calendar') {
    const startWeekday = r.int(0, 6);
    const days = r.pick([28, 30, 31]);
    const offset = level === 1 ? 0 : level === 2 ? r.int(0, 3) : r.int(2, 9);
    const date = r.int(1, days - offset);
    const targetDate = date + offset;
    const weekdayIndex = (startWeekday + targetDate - 1) % 7;
    const answer = WEEKDAY_SHORT[weekdayIndex];
    const tag = code(r, 'D');
    const visual = {
      kind: 'v3-class-1-calendar', startWeekday, days, date, code: tag,
      description: `${tag}'s mission calendar has ${days} days, date 1 on ${WEEKDAYS[startWeekday]}, and date ${date} highlighted.`,
    };
    const prompt = offset
      ? `On ${tag}'s calendar, what weekday is ${offset} ${noun(offset, 'day', 'days')} after date ${date}?`
      : `On ${tag}'s calendar, what weekday is date ${date}?`;
    return question(
      family, prompt, answer,
      'Find the date column, then count whole days if the question moves forward.',
      `Date ${targetDate} is in the ${answer} column.`,
      { offset }, answerChoices(answer, [
        wrong(WEEKDAY_SHORT[(weekdayIndex + 1) % 7], 'calendar-column'),
        wrong(WEEKDAY_SHORT[(weekdayIndex + 6) % 7], 'calendar-column'),
        wrong(WEEKDAY_SHORT[(startWeekday + date + offset) % 7], 'counted-endpoints'),
        wrong(WEEKDAY_SHORT[startWeekday], 'calendar-column'),
      ], count, null, KNOWN), visual,
    );
  }

  if (family === 'class-1-coin-pouch') {
    const coinCount = level === 1 ? r.int(3, 4) : level === 2 ? r.int(4, 5) : r.int(4, 6);
    const allowed = level === 1 ? [1, 2, 5] : COINS;
    const coins = Array.from({ length: coinCount }, () => r.pick(allowed));
    const total = sum(coins);
    const answer = `Rs ${total}`;
    const tag = code(r, 'P');
    const visual = {
      kind: 'v3-class-1-coin-pouch', coins, code: tag,
      description: `Supply pouch ${tag} contains rupee coins worth ${coins.join(', ')} for a total to be found.`,
    };
    return question(
      family, `Add the coins in ${tag}'s pouch. How much money is there?`, answer,
      'Read each coin value, then add the values rather than the coin count.',
      `${coins.join(' + ')} = ${total}, so the pouch holds ${answer}.`,
      {}, numberChoices(answer, [
        [`Rs ${coinCount}`, 'coin-count'],
        [`Rs ${total - coins[0]}`, 'missed-object'],
        [`Rs ${total + coins[0]}`, 'included-extra'],
        [`Rs ${total + 1}`, 'coin-count'],
        [`Rs ${Math.max(1, total - 1)}`, 'coin-count'],
      ], count), visual,
    );
  }

  if (family === 'class-1-exact-coin-tray') {
    const coinCount = level === 3 ? 4 : 3;
    const allowed = COINS;
    const correct = Array.from({ length: coinCount }, () => r.pick(allowed)).sort((a, b) => a - b);
    const target = sum(correct);
    const variants = [];
    for (let index = 0; index < correct.length; index++) {
      for (const value of allowed) {
        if (value === correct[index]) continue;
        const next = [...correct];
        next[index] = value;
        next.sort((a, b) => a - b);
        if (sum(next) !== target) variants.push(next);
      }
    }
    const unique = r.shuffle([...new Map(variants.map(coins => [coinKey(coins), coins])).values()]);
    if (unique.length < 3) throw new QuestionRetry('Coin trays need three distinct wrong totals.');
    const answer = coinKey(correct);
    const wrongTrays = unique.slice(0, 4);
    const trayKeys = [answer, ...wrongTrays.slice(0, count - 1).map(coinKey)].sort();
    return question(
      family, `Which tray pays exactly Rs ${target} using ${coinCount} coins?`, answer,
      'Add one tray at a time and also check its number of coins.',
      `The correct tray has ${correct.join(' + ')} = Rs ${target}.`,
      { target, coinCount, trayKeys }, answerChoices(answer, wrongTrays.map(coins =>
        wrong(coinKey(coins), 'class-1-exact-coins', coinTrayVisual(coins))), count, coinTrayVisual(correct), KNOWN),
    );
  }

  if (family === 'class-1-supply-shop-pair') {
    const itemPool = [
      { name: 'battery', shape: 'rectangle', mark: 'stripe' },
      { name: 'flag', shape: 'triangle', mark: 'dot' },
      { name: 'tube', shape: 'circle', mark: 'ring' },
      { name: 'wheel', shape: 'circle', mark: 'cross' },
      { name: 'map', shape: 'square', mark: 'stripe' },
      { name: 'lamp', shape: 'pentagon', mark: 'dot' },
    ];
    const selected = r.shuffle(itemPool).slice(0, 4).map((item, index) => ({
      ...item, fill: FILLS[index], price: r.int(2, level === 1 ? 9 : level === 2 ? 15 : 24),
    }));
    const pair = r.shuffle([0, 1, 2, 3]).slice(0, 2);
    const total = selected[pair[0]].price + selected[pair[1]].price;
    const answer = `Rs ${total}`;
    const tag = code(r, 'S');
    const visual = {
      kind: 'v3-class-1-shop-board', items: selected, code: tag,
      description: `Supply shop ${tag}: ${selected.map(item => `${item.name} costs Rs ${item.price}`).join('; ')}.`,
    };
    return question(
      family, `${tag} buys the ${selected[pair[0]].name} and the ${selected[pair[1]].name}. What do they cost together?`, answer,
      'Find both price tags, then add the two prices.',
      `Rs ${selected[pair[0]].price} + Rs ${selected[pair[1]].price} = ${answer}.`,
      { pair }, numberChoices(answer, [
        [`Rs ${selected[pair[0]].price}`, 'price-total'],
        [`Rs ${selected[pair[1]].price}`, 'price-total'],
        [`Rs ${Math.abs(selected[pair[0]].price - selected[pair[1]].price)}`, 'wrong-operation'],
        [`Rs ${total + 1}`, 'missing-step'],
        [`Rs ${Math.max(1, total - 1)}`, 'missing-step'],
      ], count), visual,
    );
  }

  if (family === 'class-1-shopping-change') {
    const buyer = r.pick(NAMES);
    const itemNames = r.shuffle(['battery', 'flag', 'tube', 'map', 'lamp', 'wheel']);
    const costs = level === 1 ? [r.int(2, 9)] : [r.int(2, 12), r.int(2, level === 2 ? 10 : 16)];
    const total = sum(costs);
    const paidOptions = [10, 20, 30, 40, 50].filter(value => value > total);
    if (!paidOptions.length) throw new QuestionRetry('The shopper needs enough money.');
    const paid = r.pick(paidOptions);
    const change = paid - total;
    if (costs.includes(change)) throw new QuestionRetry('Change should not duplicate a shown price.');
    const answer = `Rs ${change}`;
    const purchase = costs.map((cost, index) => `${itemNames[index]} for Rs ${cost}`).join(' and ');
    const visual = {
      kind: 'v3-class-1-change-board', buyer, paid, costs, itemNames: itemNames.slice(0, costs.length),
      description: `${buyer}'s payment board shows Rs ${paid} paid for ${costs.map((cost, index) => `${itemNames[index]} costing Rs ${cost}`).join(' and ')}.`,
    };
    return question(
      family, `${buyer} has Rs ${paid} and buys ${purchase}. What change is left?`, answer,
      'Add every price, then subtract that total from the money paid.',
      `The cost is Rs ${total}. Rs ${paid} - Rs ${total} = ${answer}.`,
      {}, numberChoices(answer, [
        [`Rs ${total}`, 'change-order'],
        [`Rs ${paid - costs[0]}`, 'price-total'],
        [`Rs ${paid + total}`, 'wrong-operation'],
        [`Rs ${change + 1}`, 'missing-step'],
        [`Rs ${Math.max(0, change - 1)}`, 'missing-step'],
      ], count), visual,
    );
  }

  if (family === 'class-1-queue-rank') {
    const person = r.pick(NAMES);
    const total = r.int(5, 8);
    const start = r.int(2, total - 1);
    const mode = level === 1 ? 'opposite' : level === 2 ? r.pick(['opposite', 'move']) : r.pick(['move', 'swap']);
    let answerNumber;
    let prompt;
    let explanation;
    if (mode === 'opposite') {
      answerNumber = total - start + 1;
      prompt = `In a queue of ${total} aliens, ${person} is ${ordinal(start)} from front. What place from back?`;
      explanation = `${total} - ${start} + 1 = ${answerNumber}, so ${person} is ${ordinal(answerNumber)} from the back.`;
    } else {
      const move = r.int(1, Math.min(3, start - 1));
      answerNumber = start - move;
      prompt = `${person} is ${ordinal(start)} in a queue of ${total} aliens and moves ${move} ${noun(move, 'place', 'places')} forward. New place?`;
      explanation = `${start} - ${move} = ${answerNumber}, so the new place is ${ordinal(answerNumber)}.`;
    }
    const answer = ordinal(answerNumber);
    const above = Array.from({ length: total - answerNumber }, (_, index) => answerNumber + index + 1);
    const below = Array.from({ length: answerNumber - 1 }, (_, index) => answerNumber - index - 1);
    const preferred = above.length >= 3 ? above : below.length >= 3 ? below : [...above, ...below];
    const wrongRanks = [...preferred, ...above, ...below].filter((value, index, values) => values.indexOf(value) === index).slice(0, 4);
    const move = mode === 'opposite' ? 0 : start - answerNumber;
    const visual = {
      kind: 'v3-class-1-alien-queue', person, total, start, mode, move,
      description: `Alien queue for ${person}: ${total} places, starting rank ${start}${move ? `, then moving ${move} forward` : ', read from the opposite end'}.`,
    };
    return question(
      family, prompt, answer,
      'Count positions from the named end and include the person once.',
      explanation, { total, start, mode, answerNumber }, numberChoices(answer,
        wrongRanks.map((value, index) => [ordinal(value), index ? 'position-end' : 'rank-endpoints']), count), visual,
    );
  }

  if (family === 'class-1-odd-signal-badge') {
    const common = {
      shape: r.pick(['circle', 'triangle', 'square', 'pentagon']),
      mark: r.pick(MARKS),
      facing: r.pick(['up', 'right']),
      fill: r.pick(FILLS),
    };
    const ruleProps = level === 1 ? ['shape'] : level === 2 ? ['shape', 'mark'] : ['shape', 'mark', 'facing'];
    const oddProperty = r.pick(ruleProps);
    const directions = ['up', 'right', 'down', 'left'];
    const options = Array.from({ length: 4 }, (_, index) => ({
      ...common,
      fill: FILLS[(FILLS.indexOf(common.fill) + index) % FILLS.length],
      ...(ruleProps.includes('mark') ? {} : { mark: MARKS[(MARKS.indexOf(common.mark) + index) % MARKS.length] }),
      ...(ruleProps.includes('facing') ? {} : { facing: directions[(directions.indexOf(common.facing) + index) % directions.length] }),
      label: `badge-${index + 1}`,
    }));
    const oddIndex = r.int(0, 3);
    if (oddProperty === 'shape') options[oddIndex].shape = r.pick(['circle', 'triangle', 'square', 'pentagon'].filter(value => value !== common.shape));
    if (oddProperty === 'mark') options[oddIndex].mark = r.pick(MARKS.filter(value => value !== common.mark));
    if (oddProperty === 'facing') options[oddIndex].facing = common.facing === 'up' ? 'right' : 'up';
    const answer = badgeKey(options[oddIndex]);
    const ruleWords = level === 1 ? `${common.shape}s`
      : level === 2 ? `${common.mark} ${common.shape}s`
        : `${common.mark} ${common.shape}s pointing ${common.facing}`;
    const prompt = `Three badges are ${ruleWords}. Which badge breaks the rule?`;
    const optionVisual = (badge, index) => badgeVisual('v3-class-1-odd-choice', badge, `Badge ${index + 1}`);
    return question(
      family, prompt, answer,
      'Check shape, mark, direction and fill one property at a time.',
      `The odd badge changes the ${oddProperty}; the other three keep every named property.`,
      { common, oddProperty, ruleProps }, answerChoices(answer, options.filter((_, index) => index !== oddIndex).map((badge, index) =>
        wrong(badgeKey(badge), 'sorting-rule', optionVisual(badge, index))), count, optionVisual(options[oddIndex], oddIndex), KNOWN),
    );
  }

  if (family === 'class-1-rover-grid-route') {
    const startCol = r.int(0, 3);
    const startRow = r.int(1, 4);
    let dx = level === 1 ? r.pick([-1, 1]) : r.int(-2, 2);
    let dy = level === 1 ? 0 : r.int(-2, 2);
    if (!dx && !dy) dx = 1;
    const endCol = startCol + dx;
    const endRow = startRow + dy;
    if (endCol < 0 || endCol > 3 || endRow < 1 || endRow > 4) throw new QuestionRetry('The rover route left the four-by-four map.');
    const start = `${String.fromCharCode(65 + startCol)}${startRow}`;
    const answer = `${String.fromCharCode(65 + endCol)}${endRow}`;
    const across = dx ? `${Math.abs(dx)} ${dx > 0 ? 'right' : 'left'}` : '0 across';
    const vertical = dy ? `${Math.abs(dy)} ${dy > 0 ? 'up' : 'down'}` : '0 up';
    const tag = code(r, 'G');
    const visual = {
      kind: 'v3-class-1-rover-map', start, dx, dy, code: tag,
      description: `Grid map ${tag} has columns A to D and rows 1 to 4; the rover starts at ${start} and moves ${across}, then ${vertical}.`,
    };
    const swapped = `${String.fromCharCode(65 + Math.max(0, Math.min(3, startCol + dy)))}${Math.max(1, Math.min(4, startRow + dx))}`;
    return question(
      family, `Rover at ${start} moves ${across}, then ${vertical}. Which grid square does it reach?`, answer,
      'Change the letter for sideways moves and the number for up or down.',
      `${start} moves to ${answer}.`,
      {}, answerChoices(answer, [
        wrong(start, 'class-1-map-axis'),
        wrong(swapped, 'class-1-map-axis'),
        wrong(`${String.fromCharCode(65 + endCol)}${startRow}`, 'missing-step'),
        wrong(`${String.fromCharCode(65 + startCol)}${endRow}`, 'missing-step'),
        wrong(`${String.fromCharCode(65 + Math.max(0, Math.min(3, startCol - dx)))}${Math.max(1, Math.min(4, startRow - dy))}`, 'time-direction'),
      ], count, null, KNOWN), visual,
    );
  }

  if (family === 'class-1-signal-analogy') {
    const transform = r.pick(level === 1 ? ['change-mark', 'change-colour'] : level === 2
      ? ['change-mark', 'change-shape', 'turn-right'] : ['change-mark', 'change-shape', 'turn-right', 'change-colour']);
    const a = {
      shape: r.pick(['circle', 'triangle', 'square', 'pentagon']),
      mark: r.pick(['dot', 'stripe', 'ring']),
      fill: r.pick(FILLS),
      facing: r.pick(['up', 'right', 'down', 'left']),
    };
    const b = transformBadge(a, transform);
    const c = {
      shape: r.pick(['circle', 'triangle', 'square', 'pentagon']),
      mark: r.pick(['dot', 'stripe', 'ring']),
      fill: r.pick(FILLS),
      facing: r.pick(['up', 'right', 'down', 'left']),
    };
    const target = transformBadge(c, transform);
    const candidates = [
      target,
      { ...target, mark: target.mark === 'dot' ? 'stripe' : 'dot' },
      { ...target, shape: target.shape === 'circle' ? 'square' : 'circle' },
      {
        ...target,
        fill: FILLS[(FILLS.indexOf(target.fill) + 2) % FILLS.length],
        mark: target.mark === 'ring' ? 'cross' : 'ring',
      },
      { ...target, facing: target.facing === 'up' ? 'right' : 'up' },
    ];
    const unique = [...new Map(candidates.map(item => [badgeKey(item), item])).values()];
    if (unique.length < 4) throw new QuestionRetry('Analogy choices need four distinct badges.');
    const tag = code(r, 'A');
    const visual = {
      kind: 'v3-class-1-analogy-board', a, b, c, code: tag,
      description: `Signal analogy ${tag}: ${badgeKey(a)} becomes ${badgeKey(b)}; apply the same change to ${badgeKey(c)}.`,
    };
    const optionVisual = (badge, index) => badgeVisual('v3-class-1-analogy-choice', badge, `Answer badge ${index + 1}`);
    return question(
      family, `${tag} copies the first badge change. Which badge completes the second pair?`, badgeKey(target),
      'Find the one property that changed, then change only that property again.',
      `The first pair uses the ${transform.replaceAll('-', ' ')} rule, so the same change makes the answer badge.`,
      { transform, a, c }, answerChoices(badgeKey(target), unique.filter(item => badgeKey(item) !== badgeKey(target)).map((badge, index) =>
        wrong(badgeKey(badge), 'class-1-analogy-rule', optionVisual(badge, index))), count, optionVisual(target, 0), KNOWN), visual,
    );
  }

  throw new Error(`Unknown class-1 family: ${family}`);
}

function validateOptions(question, kind, key) {
  if (!question.optionVisuals || question.optionVisuals.length !== question.options.length) throw new Error('Picture choices are missing.');
  question.optionVisuals.forEach((visual, index) => {
    if (visual?.kind !== kind || key(visual) !== question.options[index]) throw new Error('A picture choice does not match its label.');
  });
}

export function solve(question) {
  const givens = question.proof.givens;
  const visual = question.visual;

  if (TEXT_FAMILIES[question.family]) return solveText(question);
  if (REAL_FAMILIES[question.family]) return solveReal(question);
  if (question.family === 'class-1-base-ten-build') {
    if (visual?.kind !== 'v3-class-1-base-ten') throw new Error('The base-ten load is missing.');
    return String(visual.tens * 10 + visual.ones + givens.change);
  }
  if (question.family === 'class-1-number-line-arrow') {
    if (visual?.kind !== 'v3-class-1-number-line') throw new Error('The number line is missing.');
    return String(visual.start + visual.targetIndex * visual.step);
  }
  if (question.family === 'class-1-digit-card-order') {
    if (visual?.kind !== 'v3-class-1-digit-cards') throw new Error('The digit cards are missing.');
    const { first, second, mode } = visual;
    const larger = Math.max(first, second);
    const smaller = Math.min(first, second);
    const greatest = larger * 10 + smaller;
    const least = smaller === 0 ? larger * 10 : smaller * 10 + larger;
    if (mode === 'greatest') return String(greatest);
    if (mode === 'least') return String(least);
    if (mode === 'difference') return String(greatest - least);
    const shown = first === 0 ? second * 10 : first * 10 + second;
    return String(Number(String(shown).padStart(2, '0').split('').reverse().join('')));
  }
  if (question.family === 'class-1-hundred-chart-move') {
    if (visual?.kind !== 'v3-class-1-hundred-move') throw new Error('The hundred-chart piece is missing.');
    return String(visual.start + visual.dx + visual.dy * 10);
  }
  if (question.family === 'class-1-part-whole-repair') {
    if (visual?.kind !== 'v3-class-1-part-whole') throw new Error('The part-whole bar is missing.');
    return String(givens.unknown === 'whole' ? visual.left + visual.right
      : givens.unknown === 'left' ? visual.left : visual.right);
  }
  if (question.family === 'class-1-number-balance') {
    if (visual?.kind !== 'v3-class-1-number-balance') throw new Error('The number balance is missing.');
    return String(sum(visual.left) - sum(visual.rightKnown));
  }
  if (question.family === 'class-1-fact-family-intruder') {
    if (visual?.kind !== 'v3-class-1-fact-board') throw new Error('The fact-family board is missing.');
    const { a, b, whole, delta, badType } = visual;
    return badType === 0 ? `${a} + ${b} = ${whole + delta}`
      : badType === 1 ? `${whole} - ${a} = ${Math.max(0, b - delta)}`
        : `${whole} - ${b} = ${a + delta}`;
  }
  if (question.family === 'class-1-sample-change-compare') {
    if (visual?.kind !== 'v3-class-1-compare-change') throw new Error('The sample scene is missing.');
    return String(Math.abs(visual.leftStart + visual.leftChange - visual.rightStart - visual.rightChange));
  }
  if (question.family === 'class-1-bead-string-gap') {
    if (visual?.kind !== 'v3-class-1-bead-gap') throw new Error('The bead string is missing.');
    validateOptions(question, 'v3-class-1-bead-choice', beadKey);
    return beadKey(visual.sequence[visual.gapIndex]);
  }
  if (question.family === 'class-1-growing-tile-stage') {
    if (visual?.kind !== 'v3-class-1-growing-tiles') throw new Error('The tile stages are missing.');
    return String(visual.counts[0] + visual.step * (visual.targetStage - 1));
  }
  if (question.family === 'class-1-skip-count-trail') {
    if (visual?.kind !== 'v3-class-1-skip-trail') throw new Error('The stepping-stone trail is missing.');
    return String(visual.start + visual.direction * visual.step * visual.missingIndex);
  }
  if (question.family === 'class-1-code-output-table') {
    if (visual?.kind !== 'v3-class-1-code-table') throw new Error('The code table is missing.');
    return String(visual.rows[visual.targetIndex].input + visual.add);
  }
  if (question.family === 'class-1-shape-outpost') {
    if (visual?.kind !== 'v3-class-1-shape-scene') throw new Error('The shape outpost is missing.');
    return String(visual.counts[givens.target]);
  }
  if (question.family === 'class-1-solid-motion') {
    validateOptions(question, 'v3-class-1-solid-choice', option => option.item);
    const matching = question.optionVisuals.filter(option => solidMatches(option.shape, givens.property));
    if (matching.length !== 1) throw new Error('The solid property does not have one answer.');
    return matching[0].item;
  }
  if (question.family === 'class-1-mirror-badge') {
    if (visual?.kind !== 'v3-class-1-mirror-board') throw new Error('The mirror board is missing.');
    validateOptions(question, 'v3-class-1-mirror-choice', option => gridKey(option.cells));
    return gridKey(mirrorRows(givens.left));
  }
  if (question.family === 'class-1-corner-badge') {
    if (visual?.kind !== 'v3-class-1-corner-badge') throw new Error('The corner badge is missing.');
    return String(sum(visual.shapes.map(shapeCorners)));
  }
  if (question.family === 'class-1-unit-chain') {
    if (visual?.kind !== 'v3-class-1-unit-chain') throw new Error('The unit chain is missing.');
    return `${visual.count} ${visual.unit}`;
  }
  if (question.family === 'class-1-ruler-span') {
    if (visual?.kind !== 'v3-class-1-ruler-span') throw new Error('The ruler is missing.');
    return `${visual.end - visual.start} cm`;
  }
  if (question.family === 'class-1-sample-mass') {
    if (visual?.kind !== 'v3-class-1-mass-balance') throw new Error('The mass balance is missing.');
    return `${sum(visual.rightWeights) - sum(visual.leftKnown)} g`;
  }
  if (question.family === 'class-1-capacity-cups') {
    if (visual?.kind !== 'v3-class-1-capacity-shelf') throw new Error('The capacity shelf is missing.');
    const left = visual.capacity - (sum(visual.pours) - visual.spilled);
    return `${left} ${noun(left, 'cup', 'cups')}`;
  }
  if (question.family === 'class-1-clock-read') {
    if (visual?.kind !== 'v3-class-1-clock-read') throw new Error('The mission clock is missing.');
    return timeText(visual.minutes);
  }
  if (question.family === 'class-1-clock-choice') {
    validateOptions(question, 'v3-class-1-clock-choice', option => timeText(option.minutes));
    return timeText(givens.target);
  }
  if (question.family === 'class-1-rover-schedule') {
    if (visual?.kind !== 'v3-class-1-schedule-board') throw new Error('The rover schedule is missing.');
    return timeText(visual.start + visual.first + visual.second);
  }
  if (question.family === 'class-1-mission-calendar') {
    if (visual?.kind !== 'v3-class-1-calendar') throw new Error('The mission calendar is missing.');
    return WEEKDAY_SHORT[(visual.startWeekday + visual.date + givens.offset - 1) % 7];
  }
  if (question.family === 'class-1-coin-pouch') {
    if (visual?.kind !== 'v3-class-1-coin-pouch') throw new Error('The coin pouch is missing.');
    return `Rs ${sum(visual.coins)}`;
  }
  if (question.family === 'class-1-exact-coin-tray') {
    validateOptions(question, 'v3-class-1-coin-tray', option => coinKey(option.coins));
    const optionKeys = question.optionVisuals.map(option => coinKey(option.coins)).sort();
    if (JSON.stringify(optionKeys) !== JSON.stringify(givens.trayKeys)) throw new Error('The coin tray set changed.');
    const matches = question.optionVisuals.filter(option => option.coins.length === givens.coinCount && sum(option.coins) === givens.target);
    if (matches.length !== 1) throw new Error('The coin trays do not have one exact answer.');
    return coinKey(matches[0].coins);
  }
  if (question.family === 'class-1-supply-shop-pair') {
    if (visual?.kind !== 'v3-class-1-shop-board') throw new Error('The shop board is missing.');
    return `Rs ${visual.items[givens.pair[0]].price + visual.items[givens.pair[1]].price}`;
  }
  if (question.family === 'class-1-shopping-change') {
    if (visual?.kind !== 'v3-class-1-change-board') throw new Error('The shopping board is missing.');
    return `Rs ${visual.paid - sum(visual.costs)}`;
  }
  if (question.family === 'class-1-queue-rank') {
    if (visual?.kind !== 'v3-class-1-alien-queue') throw new Error('The alien queue is missing.');
    return ordinal(visual.mode === 'opposite' ? visual.total - visual.start + 1 : visual.start - visual.move);
  }
  if (question.family === 'class-1-odd-signal-badge') {
    validateOptions(question, 'v3-class-1-odd-choice', badgeKey);
    const matches = question.optionVisuals.filter(option => givens.ruleProps.every(property => option[property] === givens.common[property]));
    if (matches.length !== 3) throw new Error('The odd badge set does not have one exception.');
    return badgeKey(question.optionVisuals.find(option => !matches.includes(option)));
  }
  if (question.family === 'class-1-rover-grid-route') {
    if (visual?.kind !== 'v3-class-1-rover-map') throw new Error('The rover map is missing.');
    const col = visual.start.charCodeAt(0) - 65 + visual.dx;
    const row = Number(visual.start[1]) + visual.dy;
    return `${String.fromCharCode(65 + col)}${row}`;
  }
  if (question.family === 'class-1-signal-analogy') {
    if (visual?.kind !== 'v3-class-1-analogy-board') throw new Error('The analogy board is missing.');
    validateOptions(question, 'v3-class-1-analogy-choice', badgeKey);
    return badgeKey(transformBadge(givens.c, givens.transform));
  }
  throw new Error(`Unknown class-1 family: ${question.family}`);
}

export function render(visual) {
  return renderRealClass1(visual) ?? renderClass1(visual);
}
