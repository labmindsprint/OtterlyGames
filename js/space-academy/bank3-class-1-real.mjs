import {
  MISCONCEPTIONS as SHARED, QuestionRetry, answerChoices, wrong,
} from './bank-shared.mjs';
import {
  INK, PAPER, circle, line, path, rect, svg, text,
} from './diagram-kit.mjs';
import { TINTS, spacePanel, sprite } from './sprites.mjs';

export const REAL_FAMILIES = {
  'class-1-count-expanded': { skill: 'expand', title: 'Count a pictured group and choose its expanded form' },
  'class-1-jump-line-choice': { skill: 'sequence', title: 'Choose the number line with the stated jumps' },
  'class-1-cross-out-count': { skill: 'subtraction', title: 'Cross pictured objects to leave a target amount' },
  'class-1-picture-subtraction-match': { skill: 'subtraction', title: 'Match pictured crossings to subtraction sentences' },
  'class-1-figure-wheel-complete': { skill: 'visual', title: 'Complete a turning figure pattern' },
  'class-1-shape-statement-pair': { skill: 'shape', title: 'Test two statements about a compound shape picture' },
  'class-1-equal-object-mass': { skill: 'measure', title: 'Find one object mass from a balanced group' },
  'class-1-height-difference': { skill: 'measure', title: 'Compare two pictured heights' },
  'class-1-clock-elapsed-pair': { skill: 'time', title: 'Find minutes passed between two clocks' },
  'class-1-least-money-set': { skill: 'money', title: 'Choose the fewest coins for an exact amount' },
  'class-1-unit-price-board': { skill: 'money', title: 'Scale a pictured item price' },
  'class-1-thickness-order': { skill: 'ranking', title: 'Choose the thickest and thinnest pictured objects' },
};

export const REAL_MISCONCEPTIONS = {
  'class-1-figure-turn': {
    title: 'Turning a whole figure',
    message: 'Turn the arrow and the coloured corner together by the same quarter-turn.',
  },
  'class-1-jump-size': {
    title: 'Equal jump size',
    message: 'Compare the landing numbers, not the number of arcs, to find the size of each jump.',
  },
  'class-1-extreme-pair': {
    title: 'Ordering both extremes',
    message: 'Find the greatest thickness first, then separately find the least thickness.',
  },
  'class-1-row-match': {
    title: 'Matching a picture row',
    message: 'Count all objects, count the crossed objects, and check the number left in that same row.',
  },
  'class-1-statement-pair': {
    title: 'Checking two statements',
    message: 'Count the picture for each statement separately before choosing the T and F code.',
  },
  'class-1-equal-piece': {
    title: 'Mass of one equal piece',
    message: 'The total mass is shared equally by all identical pieces on the other pan.',
  },
  'class-1-clock-gap': {
    title: 'Time between clocks',
    message: 'Move the minute hand forward from the first clock to the second in equal five-minute steps.',
  },
  'class-1-least-coins': {
    title: 'Exact amount with fewest coins',
    message: 'First reject trays with the wrong total, then compare how many coins the exact trays use.',
  },
  'class-1-unit-price': {
    title: 'Price for one item',
    message: 'Find the price of one item, then build the requested number of equal-priced items.',
  },
};

export const REAL_PLAN = {
  numbers: 'class-1-count-expanded class-1-jump-line-choice',
  operations: 'class-1-cross-out-count class-1-picture-subtraction-match',
  patterns: 'class-1-figure-wheel-complete',
  geometry: 'class-1-shape-statement-pair',
  measurement: 'class-1-equal-object-mass class-1-height-difference',
  time: 'class-1-clock-elapsed-pair',
  money: 'class-1-least-money-set class-1-unit-price-board',
  reasoning: 'class-1-thickness-order',
};

const KNOWN = { ...SHARED, ...REAL_MISCONCEPTIONS };
const TAGS = ['Astra', 'Bolt', 'Comet', 'Dune', 'Echo', 'Flash', 'Glow', 'Helio'];
const FILLS = [TINTS.mint, TINTS.gold, TINTS.coral, TINTS.purple];
const DIRECTIONS = ['up', 'right', 'down', 'left'];
const sum = values => values.reduce((total, value) => total + value, 0);
const noun = (n, one, many) => n === 1 ? one : many;
const coinKey = coins => [...coins].sort((a, b) => b - a).join('+');
const FILL_NAMES = Object.fromEntries([['mint', 'green'], ['gold', 'gold'], ['coral', 'red'], ['purple', 'purple']].map(([tint, name]) => [TINTS[tint], name]));
const MARK_NAMES = { dot: 'dot', bar: 'bar' };
const turnKey = visual => `${DIRECTIONS[visual.turn]} arrow, ${FILL_NAMES[visual.fill]} ${MARK_NAMES[visual.mark]}`;
const jumpKey = visual => `jumps of ${visual.step}`;

function question(family, prompt, answer, hint, explanation, givens, choices, visual = null) {
  return {
    family, prompt, answer: String(answer), hint, explanation,
    proof: { family, givens },
    ...(visual ? { visual } : {}),
    choices,
  };
}

function wordChoices(answer, alternatives, count, visual = null) {
  return answerChoices(answer, alternatives.map(([value, code, optionVisual]) =>
    wrong(value, code, optionVisual)), count, visual, KNOWN);
}

function numberChoices(answer, alternatives, count, visual = null) {
  const cue = value => {
    const match = /^(?:Rs )?(-?\d+)/.exec(String(value));
    return match ? Number(match[1]) : null;
  };
  const target = cue(answer);
  const usable = alternatives.filter(([value]) => (cue(value) ?? 1) > 0);
  let ordered = usable;
  if (target != null) {
    const lower = usable.filter(([value]) => cue(value) != null && cue(value) < target);
    const upper = usable.filter(([value]) => cue(value) != null && cue(value) > target);
    const preferred = target % 2 ? lower : upper;
    const other = preferred === lower ? upper : lower;
    const sameSide = preferred.length >= count - 1 ? preferred : other.length >= count - 1 ? other : null;
    if (sameSide) ordered = [...sameSide, ...usable.filter(entry => !sameSide.includes(entry))];
  }
  return wordChoices(answer, ordered, count, visual);
}

function turnVisual(turn, fill, mark) {
  return {
    kind: 'v3-class-1-turn-choice', turn, fill, mark,
    description: `Signal tile with ${turn === 0 ? 'an' : 'a'} ${DIRECTIONS[turn]} arrow and matching ${fill} corner.`,
  };
}

function jumpVisual(step) {
  return {
    kind: 'v3-class-1-jump-line-choice', step,
    description: `Number line showing equal jumps of ${step}.`,
  };
}

function moneyVisual(coins) {
  return {
    kind: 'v3-class-1-money-set-choice', coins: [...coins],
    description: `Coin tray containing values ${coins.join(', ')} rupees.`,
  };
}

function expandedForm(tens, ones) {
  return `${tens * 10} + ${ones}`;
}

function splitLargest(coins) {
  const next = [...coins].sort((a, b) => b - a);
  const index10 = next.indexOf(10);
  if (index10 >= 0) {
    next.splice(index10, 1, 5, 5);
    return next;
  }
  const index5 = next.indexOf(5);
  if (index5 >= 0) {
    next.splice(index5, 1, 2, 2, 1);
    return next;
  }
  const index2 = next.indexOf(2);
  if (index2 >= 0) {
    next.splice(index2, 1, 1, 1);
    return next;
  }
  return null;
}

function greedyCoins(target) {
  const coins = [];
  let left = target;
  for (const value of [10, 5, 2, 1]) {
    while (left >= value) {
      coins.push(value);
      left -= value;
    }
  }
  return coins;
}

function equation(row) {
  return `${row.total} - ${row.crossed} = ${row.total - row.crossed}`;
}

function codeFor(mapping) {
  return `P${mapping[0]} Q${mapping[1]} R${mapping[2]} S${mapping[3]}`;
}

function countShapes(parts) {
  return parts.reduce((counts, part) => {
    counts[part.shape] = (counts[part.shape] ?? 0) + 1;
    return counts;
  }, {});
}

export function draftReal(family, level, r, count) {
  if (family === 'class-1-figure-wheel-complete') {
    const base = r.int(0, 3);
    const fill = r.pick(FILLS);
    const mark = r.pick(['dot', 'bar']);
    const tag = r.pick(TAGS);
    const correctTurn = (base + 3) % 4;
    const correct = turnVisual(correctTurn, fill, mark);
    const visual = {
      kind: 'v3-class-1-turn-gap', base, fill, mark, tag,
      description: `${tag}'s board has three signal tiles turning around a blank fourth space.`,
    };
    return question(
      family, `Which tile completes ${tag}'s turning signal board?`, turnKey(correct),
      'Track the arrow and coloured corner together around the board.',
      `Each tile turns one quarter-turn clockwise, so the missing arrow points ${DIRECTIONS[correctTurn]}.`,
      { base }, wordChoices(turnKey(correct), [0, 1, 2, 3].filter(turn => turn !== correctTurn)
        .map(turn => [turnKey(turnVisual(turn, fill, mark)), 'class-1-figure-turn', turnVisual(turn, fill, mark)]),
      count, correct), visual,
    );
  }

  if (family === 'class-1-thickness-order') {
    const base = r.int(12, 18);
    const step = r.int(4, 7);
    const values = r.shuffle([0, 1, 2, 3].map(index => base + index * step));
    const labels = ['P', 'Q', 'R', 'S'];
    const maxIndex = values.indexOf(Math.max(...values));
    const minIndex = values.indexOf(Math.min(...values));
    const secondMax = values.indexOf([...values].sort((a, b) => b - a)[1]);
    const secondMin = values.indexOf([...values].sort((a, b) => a - b)[1]);
    const answer = `${labels[maxIndex]}, ${labels[minIndex]}`;
    const visual = {
      kind: 'v3-class-1-thickness-bars', values, labels, tag: r.pick(TAGS),
      description: `Four labelled battery pads P, Q, R and S have visibly different thicknesses.`,
    };
    return question(
      family, 'Which pair names the thickest pad, then the thinnest pad?', answer,
      'Compare all four pads once for the thickest and again for the thinnest.',
      `${labels[maxIndex]} is thickest and ${labels[minIndex]} is thinnest, so the pair is ${answer}.`,
      {}, wordChoices(answer, [
        [`${labels[minIndex]}, ${labels[maxIndex]}`, 'class-1-extreme-pair'],
        [`${labels[secondMax]}, ${labels[minIndex]}`, 'class-1-extreme-pair'],
        [`${labels[maxIndex]}, ${labels[secondMin]}`, 'class-1-extreme-pair'],
        [`${labels[secondMax]}, ${labels[secondMin]}`, 'class-1-extreme-pair'],
      ], count), visual,
    );
  }

  if (family === 'class-1-count-expanded') {
    const ones = r.int(1, 9);
    const tag = r.pick(TAGS);
    const item = r.pick(['crystals', 'fuel cells', 'sample pods', 'signal beads']);
    const fill = r.pick(FILLS);
    const answer = expandedForm(1, ones);
    const visual = {
      kind: 'v3-class-1-count-expanded', tens: 1, ones, item, fill, tag,
      description: `${tag}'s tray contains one full group of ten ${item} and ${ones} extra.`,
    };
    return question(
      family, `Which expanded form matches ${tag}'s pictured ${item}?`, answer,
      'Find the full group of ten, then count the extra objects.',
      `The tray has 1 ten and ${ones} ${noun(ones, 'one', 'ones')}, so its expanded form is ${answer}.`,
      {}, wordChoices(answer, [
        [`1 + ${ones}`, 'face-value'],
        [`${ones * 10} + 1`, 'place-shift'],
        [`10 + ${ones + 1}`, 'missing-step'],
        [`10 + ${Math.max(0, ones - 1)}`, 'missing-step'],
        [`${ones} + 10 + 1`, 'counted-endpoints'],
      ], count), visual,
    );
  }

  if (family === 'class-1-jump-line-choice') {
    const targetStep = level === 1 ? r.pick([1, 2]) : level === 2 ? r.pick([1, 2, 3]) : r.pick([2, 3, 4]);
    const tag = r.pick(TAGS);
    const traveller = r.pick(['frog', 'rover', 'alien']);
    const steps = [1, 2, 3, 4];
    const correct = jumpVisual(targetStep);
    return question(
      family, `Which ${tag} line shows the ${traveller} jumping by ${targetStep}?`, jumpKey(correct),
      'Read the distance from one landing point to the next.',
      `Every arc on the correct line moves ${targetStep}, so all its jumps are equal jumps of ${targetStep}.`,
      { targetStep, tag, traveller, steps }, wordChoices(jumpKey(correct), steps.filter(step => step !== targetStep)
        .map(step => [jumpKey(jumpVisual(step)), 'class-1-jump-size', jumpVisual(step)]), count, correct),
    );
  }

  if (family === 'class-1-cross-out-count') {
    const total = r.int(level === 1 ? 10 : 12, level === 3 ? 20 : 18);
    const mode = r.pick(['cross', 'left']);
    const crossed = mode === 'left' ? r.int(1, total - 3) : 0;
    const target = mode === 'cross' ? r.int(5, total - 2) : total - crossed;
    const answer = mode === 'cross' ? total - target : target;
    const visual = {
      kind: 'v3-class-1-cross-out', total, crossed, target, mode, fill: r.pick(FILLS),
      description: mode === 'cross'
        ? `A board shows ${total} uncrossed sample balloons.`
        : `A board shows ${total} sample balloons with ${crossed} crossed out.`,
    };
    const prompt = mode === 'cross'
      ? `Cross some pictured balloons so ${target} stay. How many should be crossed?`
      : 'Some pictured balloons are crossed out. How many stay?';
    return question(
      family, prompt, answer,
      mode === 'cross' ? 'Take the number that must stay from the total pictured.' : 'Do not count the balloons marked with an X.',
      mode === 'cross'
        ? `${total} - ${target} = ${answer}, so cross ${answer} ${noun(answer, 'balloon', 'balloons')}.`
        : `${total} - ${crossed} = ${answer} balloons stay.`,
      {}, numberChoices(answer, [
        [total, 'ignored-change'], [target, 'ignored-change'], [crossed || total - target, 'wrong-operation'],
        [answer + 1, 'missing-step'], [answer + 2, 'missing-step'],
        [answer - 1, 'missing-step'], [answer - 2, 'missing-step'],
      ], count), visual,
    );
  }

  if (family === 'class-1-picture-subtraction-match') {
    const pool = [];
    for (let total = 3; total <= (level === 1 ? 6 : 8); total++) {
      for (let crossed = 1; crossed < Math.min(total, 4); crossed++) pool.push({ total, crossed });
    }
    const rows = r.shuffle(pool).slice(0, 4);
    const equations = r.shuffle(rows.map(equation));
    const mapping = rows.map(row => equations.indexOf(equation(row)) + 1);
    const answer = codeFor(mapping);
    const swapped = (a, b) => {
      const copy = [...mapping];
      [copy[a], copy[b]] = [copy[b], copy[a]];
      return codeFor(copy);
    };
    const visual = {
      kind: 'v3-class-1-subtraction-match', rows, equations,
      description: 'Four labelled sample rows show crossed objects beside four numbered subtraction sentences.',
    };
    return question(
      family, 'Which code matches each crossed sample row to its subtraction sentence?', answer,
      'For each row, count the total, the crossed objects and the objects left.',
      rows.map((row, index) => `${'PQRS'[index]}: ${equation(row)}`).join('; ') + `. The code is ${answer}.`,
      {}, wordChoices(answer, [
        [swapped(0, 1), 'class-1-row-match'],
        [swapped(1, 2), 'class-1-row-match'],
        [swapped(2, 3), 'class-1-row-match'],
        [codeFor([...mapping].reverse()), 'class-1-row-match'],
      ], count), visual,
    );
  }

  if (family === 'class-1-shape-statement-pair') {
    const parts = [];
    const cars = r.int(2, 3);
    for (let car = 0; car < cars; car++) {
      parts.push({ shape: 'rectangle', car, role: 'body' });
      parts.push({ shape: 'triangle', car, role: 'roof' });
      parts.push({ shape: r.pick(['square', 'circle']), car, role: 'window' });
      if (level > 1) parts.push({ shape: r.pick(['square', 'circle']), car, role: 'window-2' });
      parts.push({ shape: 'circle', car, role: 'wheel-left' });
      parts.push({ shape: 'circle', car, role: 'wheel-right' });
    }
    parts.push({ shape: 'square', car: cars, role: 'signal' });
    const counts = countShapes(parts);
    const shapes = Object.keys(counts);
    const truth = r.pick([[true, true], [true, false], [false, true], [false, false]]);
    const firstShape = r.pick(shapes);
    const firstClaim = truth[0] ? counts[firstShape] : counts[firstShape] + r.pick([1, 2]);
    const pairs = [];
    for (const high of shapes) for (const low of shapes) {
      if (counts[high] > counts[low]) pairs.push([high, low]);
    }
    const [high, low] = r.pick(pairs);
    const difference = counts[high] - counts[low];
    const secondClaim = truth[1] ? difference : difference + r.pick([1, 2]);
    const answer = `p ${truth[0] ? 'T' : 'F'}, q ${truth[1] ? 'T' : 'F'}`;
    const visual = {
      kind: 'v3-class-1-shape-statements', parts, cars,
      description: 'A rover convoy is built from visible rectangles, squares, circles and triangles.',
    };
    const firstText = firstClaim === 1 ? `There is 1 ${firstShape}.` : `There are ${firstClaim} ${firstShape}s.`;
    const secondText = secondClaim === 1
      ? `The ${high} count is 1 greater than the ${low} count.`
      : `There are ${secondClaim} more ${high}s than ${low}s.`;
    const prompt = `(p) ${firstText} (q) ${secondText} Which code is right?`;
    return question(
      family, prompt, answer,
      'Count the convoy again for p and q; one statement does not prove the other.',
      `The convoy has ${counts[firstShape]} ${noun(counts[firstShape], firstShape, `${firstShape}s`)}, ${counts[high]} ${noun(counts[high], high, `${high}s`)} and ${counts[low]} ${noun(counts[low], low, `${low}s`)}, so ${answer}.`,
      { firstShape, firstClaim, high, low, secondClaim }, wordChoices(answer, [
        ['p T, q T', 'class-1-statement-pair'], ['p T, q F', 'class-1-statement-pair'],
        ['p F, q T', 'class-1-statement-pair'], ['p F, q F', 'class-1-statement-pair'],
      ].filter(([value]) => value !== answer), count), visual,
    );
  }

  if (family === 'class-1-equal-object-mass') {
    const pieces = r.int(2, level === 1 ? 4 : 5);
    const each = r.pick(level === 1 ? [2, 5] : [2, 5, 10]);
    const total = pieces * each;
    const item = r.pick(['repair cell', 'sample tube', 'chalk stick', 'signal peg']);
    const tag = r.pick(TAGS);
    const answer = `${each} g`;
    const visual = {
      kind: 'v3-class-1-equal-mass', pieces, total, item, tag,
      description: `${tag}'s level balance shows ${pieces} identical ${noun(pieces, item, `${item}s`)} against a weight of ${total} grams.`,
    };
    return question(
      family, `${tag}'s balance is level. What is each ${item}'s mass?`, answer,
      'All identical pieces have equal mass, so share the shown total equally.',
      `${pieces} equal ${noun(pieces, item, `${item}s`)} balance ${total} g, so each one is ${answer}.`,
      {}, numberChoices(answer, [
        [`${total} g`, 'class-1-equal-piece'],
        [`${Math.max(1, total - pieces)} g`, 'class-1-equal-piece'],
        [`${each + pieces} g`, 'wrong-operation'],
        [`${each + 1} g`, 'missing-step'],
        [`${Math.max(1, each - 1)} g`, 'missing-step'],
        [`${each * 2} g`, 'class-1-equal-piece'],
      ], count), visual,
    );
  }

  if (family === 'class-1-height-difference') {
    const tall = r.int(level === 1 ? 10 : 13, level === 3 ? 24 : 20);
    const short = r.int(5, tall - 2);
    const answerNumber = tall - short;
    if (answerNumber === short) throw new QuestionRetry('A shown height should not also be the requested difference.');
    const answer = `${answerNumber} m`;
    const visual = {
      kind: 'v3-class-1-height-compare', tall, short,
      description: `A repair tower is labelled ${tall} metres and a signal mast is labelled ${short} metres.`,
    };
    return question(
      family, 'How many metres shorter is the pictured signal mast than the repair tower?', answer,
      'Compare the two heights by taking the smaller height from the larger.',
      `${tall} - ${short} = ${answerNumber}, so the mast is ${answer} shorter.`,
      {}, numberChoices(answer, [
        [`${tall + short} m`, 'wrong-operation'], [`${short} m`, 'ignored-change'],
        [`${tall} m`, 'ignored-change'], [`${answerNumber + 1} m`, 'missing-step'],
        [`${Math.max(1, answerNumber - 1)} m`, 'missing-step'], [`${answerNumber + 2} m`, 'missing-step'],
      ], count), visual,
    );
  }

  if (family === 'class-1-clock-elapsed-pair') {
    const starts = level === 1 ? [0, 30] : [0, 15, 30, 45];
    const elapsed = r.pick(level === 1 ? [30, 60] : level === 2 ? [15, 30, 45] : [15, 30, 45, 60]);
    const hour = r.int(1, 10);
    const start = hour * 60 + r.pick(starts);
    const end = (start + elapsed) % 720;
    const tag = r.pick(TAGS);
    const answer = `${elapsed} minutes`;
    const visual = {
      kind: 'v3-class-1-clock-pair', start, end, tag,
      description: `${tag}'s first clock shows ${clockText(start)} and the second clock shows ${clockText(end)}.`,
    };
    return question(
      family, `How many minutes pass between ${tag}'s two pictured clocks?`, answer,
      'Move forward from the first minute hand to the second; do not compare the hour numbers alone.',
      `Moving forward from ${clockText(start)} to ${clockText(end)} takes ${answer}.`,
      {}, numberChoices(answer, [
        [`${Math.max(5, elapsed - 15)} minutes`, 'class-1-clock-gap'],
        [`${elapsed + 15} minutes`, 'class-1-clock-gap'],
        [`${elapsed + 30} minutes`, 'class-1-clock-gap'],
        [`${Math.max(5, 60 - elapsed)} minutes`, 'class-1-clock-gap'],
        [`${elapsed + 60} minutes`, 'class-1-clock-gap'],
      ], count), visual,
    );
  }

  if (family === 'class-1-least-money-set') {
    const target = r.int(level === 1 ? 12 : 16, level === 3 ? 35 : 28);
    const tag = r.pick(TAGS);
    const trays = [greedyCoins(target)];
    while (trays.length < 4) {
      const next = splitLargest(trays.at(-1));
      if (!next) throw new QuestionRetry('The amount needs more coin representations.');
      trays.push(next);
    }
    const keys = trays.map(coinKey);
    if (new Set(keys).size !== 4 || new Set(trays.map(coins => coins.length)).size < 2) {
      throw new QuestionRetry('Coin trays must be visibly different.');
    }
    const correct = moneyVisual(trays[0]);
    return question(
      family, `Which ${tag} tray makes Rs ${target} with the fewest coins?`, coinKey(trays[0]),
      'Check that every tray totals the amount, then count the coins in each tray.',
      `All four trays make Rs ${target}; the ${trays[0].length}-coin tray uses the fewest coins.`,
      { target, keys, tag }, wordChoices(coinKey(trays[0]), trays.slice(1)
        .map(coins => [coinKey(coins), 'class-1-least-coins', moneyVisual(coins)]), count, correct),
    );
  }

  if (family === 'class-1-unit-price-board') {
    const item = r.pick([
      { one: 'fuel cell', many: 'fuel cells', sprite: 'fuel-cell' },
      { one: 'sample tube', many: 'sample tubes', sprite: 'crystal' },
      { one: 'signal flag', many: 'signal flags', sprite: 'flag' },
      { one: 'repair crate', many: 'repair crates', sprite: 'crate' },
    ]);
    const unit = r.pick([2, 5]);
    const mode = level === 1 ? 'cost' : r.pick(['cost', 'max']);
    if (mode === 'cost') {
      const shownCount = r.int(2, 4);
      const targetCount = r.int(shownCount + 1, Math.min(8, Math.floor(50 / unit)));
      const shownTotal = shownCount * unit;
      const answerNumber = targetCount * unit;
      const answer = `Rs ${answerNumber}`;
      const visual = {
        kind: 'v3-class-1-unit-price', mode, shownCount, shownTotal, targetCount, item,
        description: `A price board shows ${shownCount} ${item.many} costing Rs ${shownTotal}.`,
      };
      return question(
        family, `The board shows one bundle. What do ${targetCount} ${item.many} cost?`, answer,
        'Find one item price from the pictured bundle, then make the new equal group.',
        `${shownTotal} for ${shownCount} means Rs ${unit} each; ${targetCount} cost ${answer}.`,
        {}, numberChoices(answer, [
          [`Rs ${shownTotal}`, 'class-1-unit-price'], [`Rs ${targetCount * shownTotal}`, 'class-1-unit-price'],
          [`Rs ${answerNumber + unit}`, 'missing-step'], [`Rs ${answerNumber - unit}`, 'missing-step'],
          [`Rs ${answerNumber + shownCount}`, 'wrong-operation'], [`Rs ${unit}`, 'class-1-unit-price'],
        ], count), visual,
      );
    }
    const budgetCount = r.int(3, level === 3 ? 8 : 6);
    const budget = budgetCount * unit;
    const visual = {
      kind: 'v3-class-1-unit-price', mode, shownCount: 1, shownTotal: unit, budget, item,
      description: `A price board shows one ${item.one} costing Rs ${unit} and a budget of Rs ${budget}.`,
    };
    return question(
      family, `Each ${item.one} costs Rs ${unit}. How many can Rs ${budget} buy?`, budgetCount,
      'Build equal groups of the item price until the budget is used.',
      `${budgetCount} groups of Rs ${unit} make Rs ${budget}, so the budget buys ${budgetCount}.`,
      {}, numberChoices(budgetCount, [
        [budget, 'class-1-unit-price'], [unit, 'class-1-unit-price'],
        [budgetCount + 1, 'missing-step'], [budgetCount + 2, 'missing-step'],
        [Math.max(1, budgetCount - 1), 'missing-step'], [Math.max(1, budgetCount - 2), 'missing-step'],
      ], count), visual,
    );
  }

  throw new Error(`Unknown Class 1 real-paper family: ${family}`);
}

function clockText(minutes) {
  const normal = ((minutes % 720) + 720) % 720;
  return `${Math.floor(normal / 60) || 12}:${String(normal % 60).padStart(2, '0')}`;
}

function validatePictures(question, kind, key) {
  if (!question.optionVisuals || question.optionVisuals.length !== question.options.length) {
    throw new Error('Picture choices are missing.');
  }
  question.optionVisuals.forEach((visual, index) => {
    if (visual?.kind !== kind || key(visual) !== question.options[index]) {
      throw new Error('A picture choice does not match its answer label.');
    }
  });
}

export function solveReal(question) {
  const visual = question.visual;
  const givens = question.proof.givens;
  if (question.family === 'class-1-figure-wheel-complete') {
    if (visual?.kind !== 'v3-class-1-turn-gap') throw new Error('The turning board is missing.');
    validatePictures(question, 'v3-class-1-turn-choice', turnKey);
    return turnKey(turnVisual((visual.base + 3) % 4, visual.fill, visual.mark));
  }
  if (question.family === 'class-1-thickness-order') {
    if (visual?.kind !== 'v3-class-1-thickness-bars') throw new Error('The thickness picture is missing.');
    const maxIndex = visual.values.indexOf(Math.max(...visual.values));
    const minIndex = visual.values.indexOf(Math.min(...visual.values));
    return `${visual.labels[maxIndex]}, ${visual.labels[minIndex]}`;
  }
  if (question.family === 'class-1-count-expanded') {
    if (visual?.kind !== 'v3-class-1-count-expanded') throw new Error('The sample tray is missing.');
    return expandedForm(visual.tens, visual.ones);
  }
  if (question.family === 'class-1-jump-line-choice') {
    validatePictures(question, 'v3-class-1-jump-line-choice', jumpKey);
    const matches = question.optionVisuals.filter(option => option.step === givens.targetStep);
    if (matches.length !== 1) throw new Error('The jump lines do not have one answer.');
    return jumpKey(matches[0]);
  }
  if (question.family === 'class-1-cross-out-count') {
    if (visual?.kind !== 'v3-class-1-cross-out') throw new Error('The cross-out board is missing.');
    return String(visual.mode === 'cross' ? visual.total - visual.target : visual.total - visual.crossed);
  }
  if (question.family === 'class-1-picture-subtraction-match') {
    if (visual?.kind !== 'v3-class-1-subtraction-match') throw new Error('The subtraction rows are missing.');
    return codeFor(visual.rows.map(row => visual.equations.indexOf(equation(row)) + 1));
  }
  if (question.family === 'class-1-shape-statement-pair') {
    if (visual?.kind !== 'v3-class-1-shape-statements') throw new Error('The compound shape picture is missing.');
    const counts = countShapes(visual.parts);
    const first = counts[givens.firstShape] === givens.firstClaim;
    const second = counts[givens.high] - counts[givens.low] === givens.secondClaim;
    return `p ${first ? 'T' : 'F'}, q ${second ? 'T' : 'F'}`;
  }
  if (question.family === 'class-1-equal-object-mass') {
    if (visual?.kind !== 'v3-class-1-equal-mass') throw new Error('The equal-mass balance is missing.');
    if (visual.total % visual.pieces) throw new Error('The balance does not split equally.');
    return `${visual.total / visual.pieces} g`;
  }
  if (question.family === 'class-1-height-difference') {
    if (visual?.kind !== 'v3-class-1-height-compare') throw new Error('The height picture is missing.');
    return `${visual.tall - visual.short} m`;
  }
  if (question.family === 'class-1-clock-elapsed-pair') {
    if (visual?.kind !== 'v3-class-1-clock-pair') throw new Error('The clock pair is missing.');
    return `${(visual.end - visual.start + 720) % 720} minutes`;
  }
  if (question.family === 'class-1-least-money-set') {
    validatePictures(question, 'v3-class-1-money-set-choice', coinKeyFromVisual);
    const keys = question.optionVisuals.map(coinKeyFromVisual).sort();
    if (JSON.stringify(keys) !== JSON.stringify([...givens.keys].sort())) throw new Error('The coin trays changed.');
    const exact = question.optionVisuals.filter(option => sum(option.coins) === givens.target);
    const least = Math.min(...exact.map(option => option.coins.length));
    const matches = exact.filter(option => option.coins.length === least);
    if (matches.length !== 1) throw new Error('The fewest-coin tray is not unique.');
    return coinKey(matches[0].coins);
  }
  if (question.family === 'class-1-unit-price-board') {
    if (visual?.kind !== 'v3-class-1-unit-price') throw new Error('The unit-price board is missing.');
    const unit = visual.shownTotal / visual.shownCount;
    return visual.mode === 'cost' ? `Rs ${unit * visual.targetCount}` : String(visual.budget / unit);
  }
  throw new Error(`Unknown Class 1 real-paper family: ${question.family}`);
}

function coinKeyFromVisual(visual) {
  return coinKey(visual.coins);
}

function polygon(points, fill, stroke = INK, strokeWidth = 2) {
  return `<polygon points="${points.map(point => point.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`;
}

function arrow(x, y, size, turn, colour = INK) {
  const vectors = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const [dx, dy] = vectors[turn];
  const endX = x + dx * size;
  const endY = y + dy * size;
  const sideX = -dy;
  const sideY = dx;
  return line(x, y, endX, endY, { stroke: colour, width: 5 })
    + polygon([
      [endX, endY],
      [endX - dx * 12 + sideX * 8, endY - dy * 12 + sideY * 8],
      [endX - dx * 12 - sideX * 8, endY - dy * 12 - sideY * 8],
    ], colour, colour, 1);
}

function turnTile(x, y, width, height, turn, fill, mark) {
  const corners = [
    [[x, y], [x + width * 0.55, y], [x, y + height * 0.55]],
    [[x + width, y], [x + width * 0.45, y], [x + width, y + height * 0.55]],
    [[x + width, y + height], [x + width * 0.45, y + height], [x + width, y + height * 0.45]],
    [[x, y + height], [x + width * 0.55, y + height], [x, y + height * 0.45]],
  ];
  let body = rect(x, y, width, height, { fill: PAPER, rx: 8, strokeWidth: 3 });
  body += polygon(corners[turn], fill, INK, 2);
  body += arrow(x + width / 2, y + height / 2, Math.min(width, height) * 0.28, turn);
  if (mark === 'dot') body += circle(x + width / 2, y + height / 2, 7, { fill, strokeWidth: 2 });
  else body += line(x + width * 0.34, y + height / 2, x + width * 0.66, y + height / 2, { stroke: fill, width: 5 });
  return body;
}

function drawTurnGap(visual) {
  const turns = [visual.base, (visual.base + 1) % 4, null, (visual.base + 2) % 4];
  let body = spacePanel(10, 10, 480, 250, { seed: visual.base * 13 + visual.tag.length });
  body += text(250, 38, `${visual.tag} Turning Signal`, { size: 19, fill: PAPER });
  turns.forEach((turn, index) => {
    const x = 92 + (index % 2) * 165;
    const y = 55 + Math.floor(index / 2) * 92;
    if (turn == null) {
      body += rect(x, y, 150, 78, { fill: '#fff8e7', rx: 8, strokeWidth: 3, dash: '7 6' });
      body += text(x + 75, y + 51, '?', { size: 34, fill: TINTS.coral });
    } else {
      body += turnTile(x, y, 150, 78, turn, visual.fill, visual.mark);
    }
  });
  return svg(body, visual.description, 500, 270);
}

function drawTurnChoice(visual) {
  const body = turnTile(18, 18, 164, 144, visual.turn, visual.fill, visual.mark);
  return svg(body, visual.description, 200, 180);
}

function drawThickness(visual) {
  let body = spacePanel(10, 10, 480, 215, { seed: sum(visual.values) });
  body += sprite('fuel-cell', 24, 20, 40);
  body += text(270, 43, 'Battery Pad Test', { size: 19, fill: PAPER });
  visual.values.forEach((value, index) => {
    const x = 42 + index * 112;
    const y = 170 - value;
    body += rect(x, y, 82, value, { fill: FILLS[index], rx: 7, strokeWidth: 3 });
    body += line(x + 10, y + value * 0.35, x + 72, y + value * 0.35, { stroke: '#6d6457', width: 2 });
    body += text(x + 41, 203, visual.labels[index], { size: 20, fill: PAPER });
  });
  return svg(body, visual.description, 500, 235);
}

function drawExpanded(visual) {
  const cell = 38;
  let body = rect(10, 10, 490, 220, { fill: '#f6f0e3', rx: 18, strokeWidth: 3 });
  body += sprite('crate', 25, 23, 38);
  body += text(285, 44, `${visual.tag}'s Sample Tray`, { size: 19 });
  const drawFrame = (x, filled, label) => {
    let frame = text(x + 95, 78, label, { size: 16 });
    for (let index = 0; index < 10; index++) {
      const cx = x + (index % 5) * cell + 20;
      const cy = 104 + Math.floor(index / 5) * cell;
      frame += rect(cx - 16, cy - 16, 32, 32, { fill: PAPER, rx: 7, strokeWidth: 2 });
      if (index < filled) frame += circle(cx, cy, 10, { fill: visual.fill, strokeWidth: 2 });
    }
    return frame;
  };
  body += drawFrame(45, 10, 'Full tray');
  body += drawFrame(285, visual.ones, 'Extra tray');
  return svg(body, visual.description, 510, 240);
}

function drawJumpChoice(visual) {
  const left = 18;
  const right = 192;
  const y = 77;
  const gap = (right - left) / 8;
  let body = rect(5, 5, 200, 116, { fill: PAPER, rx: 10, strokeWidth: 2 });
  body += line(left, y, right, y, { width: 3 });
  for (let value = 0; value <= 8; value++) {
    const x = left + value * gap;
    body += line(x, y - 7, x, y + 8, { width: 2 });
    if (value % 2 === 0) body += text(x, 105, String(value), { size: 14 });
  }
  for (let from = 0; from + visual.step <= 8; from += visual.step) {
    const x1 = left + from * gap;
    const x2 = left + (from + visual.step) * gap;
    body += path(`M${x1} ${y - 5} Q${(x1 + x2) / 2} ${y - 48} ${x2} ${y - 5}`, { fill: 'none', stroke: TINTS.coral, strokeWidth: 3 });
    body += polygon([[x2, y - 5], [x2 - 8, y - 11], [x2 - 7, y + 2]], TINTS.coral, TINTS.coral, 1);
  }
  return svg(body, visual.description, 210, 126);
}

function balloon(x, y, fill, crossed) {
  let body = `<ellipse cx="${x}" cy="${y}" rx="13" ry="17" fill="${fill}" stroke="${INK}" stroke-width="2"/>`;
  body += polygon([[x - 3, y + 17], [x + 3, y + 17], [x, y + 23]], fill, INK, 1);
  body += line(x, y + 23, x - 2, y + 36, { stroke: '#766b5e', width: 2 });
  if (crossed) {
    body += line(x - 16, y - 19, x + 16, y + 21, { stroke: TINTS.coral, width: 5 });
    body += line(x + 16, y - 19, x - 16, y + 21, { stroke: TINTS.coral, width: 5 });
  }
  return body;
}

function drawCrossOut(visual) {
  let body = rect(10, 10, 490, 210, { fill: '#edf6f5', rx: 18, strokeWidth: 3 });
  body += text(255, 42, visual.mode === 'cross' ? 'Sample Balloons' : 'Crossed Sample Balloons', { size: 19 });
  for (let index = 0; index < visual.total; index++) {
    const x = 48 + (index % 10) * 45;
    const y = 83 + Math.floor(index / 10) * 78;
    body += balloon(x, y, visual.fill, index < visual.crossed);
  }
  return svg(body, visual.description, 510, 230);
}

function seal(x, y, crossed) {
  let body = circle(x, y, 11, { fill: TINTS.gold, strokeWidth: 2 });
  body += circle(x, y, 4, { fill: PAPER, strokeWidth: 1 });
  if (crossed) {
    body += line(x - 12, y - 12, x + 12, y + 12, { stroke: TINTS.coral, width: 4 });
    body += line(x + 12, y - 12, x - 12, y + 12, { stroke: TINTS.coral, width: 4 });
  }
  return body;
}

function drawSubtractionMatch(visual) {
  let body = rect(8, 8, 494, 294, { fill: '#f7f2e8', rx: 16, strokeWidth: 3 });
  body += text(128, 34, 'Picture Rows', { size: 18 });
  body += text(386, 34, 'Sentences', { size: 18 });
  visual.rows.forEach((row, rowIndex) => {
    const y = 68 + rowIndex * 55;
    body += text(28, y + 6, 'PQRS'[rowIndex], { size: 18 });
    for (let index = 0; index < row.total; index++) {
      body += seal(58 + index * 29, y, index >= row.total - row.crossed);
    }
  });
  visual.equations.forEach((value, index) => {
    body += text(370, 72 + index * 55, `(${index + 1}) ${value}`, { size: 16 });
  });
  body += line(265, 45, 265, 282, { stroke: '#b3a58e', width: 3, dash: '7 6' });
  return svg(body, visual.description, 510, 310);
}

function shapeToken(shape, x, y, width, height, fill) {
  if (shape === 'rectangle') return rect(x - width / 2, y - height / 2, width, height, { fill, rx: 4, strokeWidth: 3 });
  if (shape === 'square') return rect(x - height / 2, y - height / 2, height, height, { fill, rx: 3, strokeWidth: 3 });
  if (shape === 'circle') return circle(x, y, height / 2, { fill, strokeWidth: 3 });
  return polygon([[x, y - height / 2], [x + width / 2, y + height / 2], [x - width / 2, y + height / 2]], fill, INK, 3);
}

function drawShapeStatements(visual) {
  let body = rect(8, 8, 494, 226, { fill: '#eef6f4', rx: 18, strokeWidth: 3 });
  body += text(255, 38, 'Rover Shape Convoy', { size: 19 });
  visual.parts.forEach(part => {
    const baseX = 48 + part.car * 140;
    const fill = FILLS[part.car % FILLS.length];
    if (part.role === 'body') body += shapeToken('rectangle', baseX + 58, 130, 116, 54, fill);
    else if (part.role === 'roof') body += shapeToken('triangle', baseX + 58, 82, 70, 38, TINTS.gold);
    else if (part.role === 'window') body += shapeToken(part.shape, baseX + 43, 128, 27, 27, PAPER);
    else if (part.role === 'window-2') body += shapeToken(part.shape, baseX + 76, 128, 27, 27, PAPER);
    else if (part.role === 'wheel-left') body += shapeToken('circle', baseX + 30, 173, 25, 25, '#6d6457');
    else if (part.role === 'wheel-right') body += shapeToken('circle', baseX + 86, 173, 25, 25, '#6d6457');
    else {
      const x = 48 + (visual.cars - 1) * 140 + 126;
      body += line(x, 102, x, 158, { stroke: INK, width: 4 });
      body += shapeToken('square', x, 88, 30, 30, TINTS.coral);
    }
  });
  return svg(body, visual.description, 510, 242);
}

function drawEqualMass(visual) {
  let body = rect(8, 8, 494, 238, { fill: '#f7f1e5', rx: 18, strokeWidth: 3 });
  body += text(255, 36, 'Level Repair Balance', { size: 19 });
  body += line(250, 78, 250, 205, { stroke: INK, width: 6 });
  body += polygon([[250, 193], [222, 226], [278, 226]], TINTS.coral, INK, 3);
  body += line(92, 112, 408, 112, { stroke: INK, width: 6 });
  body += line(112, 112, 112, 157, { stroke: INK, width: 3 });
  body += line(388, 112, 388, 157, { stroke: INK, width: 3 });
  body += line(58, 157, 166, 157, { stroke: INK, width: 4 });
  body += line(334, 157, 442, 157, { stroke: INK, width: 4 });
  visual.pieces && Array.from({ length: visual.pieces }, (_, index) => {
    const x = 70 + (index % 3) * 36;
    const y = 137 - Math.floor(index / 3) * 29;
    body += rect(x, y - 16, 28, 18, { fill: TINTS.mint, rx: 8, strokeWidth: 2 });
    return null;
  });
  body += rect(354, 112, 70, 38, { fill: TINTS.gold, rx: 7, strokeWidth: 3 });
  body += text(389, 138, `${visual.total} g`, { size: 17 });
  return svg(body, visual.description, 510, 254);
}

function drawHeightCompare(visual) {
  const baseY = 235;
  const scale = 7;
  const towerHeight = visual.tall * scale;
  const mastHeight = visual.short * scale;
  let body = rect(8, 8, 494, 260, { fill: '#eaf3f5', rx: 18, strokeWidth: 3 });
  body += text(255, 36, 'Outpost Height Check', { size: 19 });
  body += rect(92, baseY - towerHeight, 112, towerHeight, { fill: TINTS.purple, rx: 5, strokeWidth: 3 });
  for (let y = baseY - towerHeight + 25; y < baseY - 15; y += 34) {
    body += rect(118, y, 60, 18, { fill: PAPER, rx: 3, strokeWidth: 2 });
  }
  body += line(356, baseY - mastHeight, 356, baseY, { stroke: INK, width: 7 });
  body += sprite('flag', 337, baseY - mastHeight - 34, 45);
  body += line(70, baseY - towerHeight, 70, baseY, { stroke: TINTS.coral, width: 3 });
  body += line(334, baseY - mastHeight, 334, baseY, { stroke: TINTS.coral, width: 3 });
  body += text(54, (baseY * 2 - towerHeight) / 2, `${visual.tall} m`, { size: 17 });
  body += text(306, (baseY * 2 - mastHeight) / 2, `${visual.short} m`, { size: 17 });
  body += text(148, 256, 'repair tower', { size: 16 });
  body += text(380, 256, 'signal mast', { size: 16 });
  return svg(body, visual.description, 510, 276);
}

function drawClockPair(visual) {
  let body = rect(8, 8, 494, 246, { fill: '#f7f2e8', rx: 18, strokeWidth: 3 });
  body += text(255, 34, 'Before and After', { size: 19 });
  body += compactClock(visual.start, 145, 137, 82);
  body += compactClock(visual.end, 365, 137, 82);
  body += text(145, 238, 'Before', { size: 17 });
  body += text(365, 238, 'After', { size: 17 });
  return svg(body, visual.description, 510, 262);
}

function compactClock(minutes, cx, cy, radius) {
  const minute = ((minutes % 60) + 60) % 60;
  const hourValue = ((minutes % 720) + 720) % 720 / 60;
  const minuteAngle = minute * Math.PI / 30;
  const hourAngle = hourValue * Math.PI / 6;
  let body = circle(cx, cy, radius, { fill: PAPER, strokeWidth: 4 });
  for (let index = 0; index < 12; index++) {
    const angle = index * Math.PI / 6;
    body += line(
      cx + Math.sin(angle) * (radius - 12), cy - Math.cos(angle) * (radius - 12),
      cx + Math.sin(angle) * (radius - 3), cy - Math.cos(angle) * (radius - 3),
      { width: 3 },
    );
  }
  body += text(cx, cy - radius + 22, '12', { size: 16 });
  body += text(cx + radius - 18, cy + 6, '3', { size: 16 });
  body += text(cx, cy + radius - 10, '6', { size: 16 });
  body += text(cx - radius + 18, cy + 6, '9', { size: 16 });
  body += line(cx, cy, cx + Math.sin(hourAngle) * 42, cy - Math.cos(hourAngle) * 42, { stroke: TINTS.purple, width: 7 });
  body += line(cx, cy, cx + Math.sin(minuteAngle) * 58, cy - Math.cos(minuteAngle) * 58, { stroke: TINTS.coral, width: 5 });
  body += circle(cx, cy, 6, { fill: INK, strokeWidth: 0 });
  return body;
}

function drawMoneyChoice(visual) {
  let body = rect(5, 5, 200, 170, { fill: '#f8f1df', rx: 12, strokeWidth: 2 });
  visual.coins.forEach((value, index) => {
    const x = 34 + (index % 4) * 47;
    const y = 42 + Math.floor(index / 4) * 55;
    const fill = value >= 10 ? TINTS.coral : value >= 5 ? TINTS.gold : TINTS.mint;
    body += circle(x, y, 20, { fill, strokeWidth: 3 });
    body += text(x, y + 6, String(value), { size: 16 });
  });
  return svg(body, visual.description, 210, 180);
}

function drawUnitPrice(visual) {
  let body = spacePanel(10, 10, 480, 214, { seed: visual.shownTotal * 11 + visual.shownCount });
  body += text(258, 40, 'Supply Price Board', { size: 19, fill: PAPER });
  const size = visual.shownCount >= 4 ? 52 : 62;
  const gap = visual.shownCount >= 4 ? 78 : 96;
  const startX = 50;
  for (let index = 0; index < visual.shownCount; index++) {
    body += sprite(visual.item.sprite, startX + index * gap, 72, size);
  }
  body += rect(300, 82, 148, 58, { fill: TINTS.gold, rx: 10, strokeWidth: 3 });
  body += text(374, 119, `Rs ${visual.shownTotal}`, { size: 24 });
  body += text(250, 188, visual.mode === 'cost'
    ? `${visual.shownCount} ${visual.item.many} in this bundle`
    : `Budget: Rs ${visual.budget}`, { size: 17, fill: PAPER });
  return svg(body, visual.description, 500, 234);
}

export function renderRealClass1(visual) {
  if (visual.kind === 'v3-class-1-turn-gap') return drawTurnGap(visual);
  if (visual.kind === 'v3-class-1-turn-choice') return drawTurnChoice(visual);
  if (visual.kind === 'v3-class-1-thickness-bars') return drawThickness(visual);
  if (visual.kind === 'v3-class-1-count-expanded') return drawExpanded(visual);
  if (visual.kind === 'v3-class-1-jump-line-choice') return drawJumpChoice(visual);
  if (visual.kind === 'v3-class-1-cross-out') return drawCrossOut(visual);
  if (visual.kind === 'v3-class-1-subtraction-match') return drawSubtractionMatch(visual);
  if (visual.kind === 'v3-class-1-shape-statements') return drawShapeStatements(visual);
  if (visual.kind === 'v3-class-1-equal-mass') return drawEqualMass(visual);
  if (visual.kind === 'v3-class-1-height-compare') return drawHeightCompare(visual);
  if (visual.kind === 'v3-class-1-clock-pair') return drawClockPair(visual);
  if (visual.kind === 'v3-class-1-money-set-choice') return drawMoneyChoice(visual);
  if (visual.kind === 'v3-class-1-unit-price') return drawUnitPrice(visual);
  return null;
}
