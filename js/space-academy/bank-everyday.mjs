import { answerChoices, choiceCount, QuestionRetry, sum, timeText, wrong } from './bank-shared.mjs';
import {
  circle, clockDescription, clockFace, GREEN, icon, INK, line, ORANGE, PAPER, path, rect, svg, text,
} from './diagram-kit.mjs';

export const EVERYDAY_FAMILIES = [
  'count', 'count-target', 'collection-change', 'compare-groups', 'compare-after',
  'pattern-next', 'pattern-gap', 'picture-analogy', 'odd-picture', 'attribute-match',
  'position-row', 'position-swap', 'shape-match', 'shape-count', 'scene-statements', 'solid-properties',
  'ruler-read', 'instrument-read', 'balance-missing', 'measure-change', 'unit-combine', 'temperature',
  'clock-read', 'clock-options', 'time-chain', 'clock-error', 'calendar',
  'coin-value', 'shopping-pair', 'shopping-change', 'shopping-budget',
  'pictograph', 'chart-compare', 'chart-update', 'graph-parts',
];

const SHAPES = ['circle', 'triangle', 'square', 'star', 'rectangle', 'pentagon', 'hexagon'];
const SIDES = { circle: 0, triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Frozen banks 1 and 2 keep their original wording (always plural); only bank 3 drafts set singular wording.
let bank3Words = false;
const isOne = n => bank3Words && Number(n) === 1;
const pl = (n, one, many = `${one}s`) => `${n} ${isOne(n) ? one : many}`;
const SOLIDS = {
  sphere: { flat: 0, vertices: 0 }, cylinder: { flat: 2, vertices: 0 },
  cone: { flat: 1, vertices: 1 }, cube: { flat: 6, vertices: 8 },
};
const diagram = (type, data, description) => ({ kind: `v2-everyday-${type}`, ...data, description });
const symbol = (shape, mark = '') => ({ shape, mark });
const symbolKey = item => `${item.shape}:${item.mark}`;
const symbolName = item => `${item.shape}${item.mark ? ` with ${item.mark === 'o' ? 'a ring' : 'a plus mark'}` : ' without a mark'}`;
const symbolVisual = item => diagram('symbol', item, symbolName(item));
const rowKey = items => items.map(symbolKey).join('|');
const rowVisual = items => diagram('row', { items }, `Read left to right: ${items.map(symbolName).join(', ')}.`);
const symbols = (shape, count, mark = '') => Array.from({ length: count }, () => symbol(shape, mark));
const collection = groups => diagram('collections', { groups }, groups.map(group =>
  `${group.label}: ${group.items.map(symbolName).join(', ')}${group.change ? `; ${Math.abs(group.change)} ${group.change > 0 ? 'join' : 'leave'}` : ''}`).join('. '));
const sceneCounts = vehicles => ({
  circle: sum(vehicles.map(vehicle => vehicle.windows + 2)),
  triangle: vehicles.length, rectangle: vehicles.length,
});
const sceneDescription = vehicles => `A row of ${vehicles.length} ${isOne(vehicles.length) ? 'rover' : 'rovers'}. Each has one rectangular body, one triangular nose, two circular wheels, and these circular window counts: ${vehicles.map(vehicle => vehicle.windows).join(', ')}.`;
const clockVisual = minutes => diagram('clock', { minutes: ((minutes % 720) + 720) % 720 }, clockDescription(minutes));
const calendarDays = visual => new Date(Date.UTC(visual.year, visual.month + 1, 0)).getUTCDate();
const weekday = (visual, date) => new Date(Date.UTC(visual.year, visual.month, date)).getUTCDay();
const chartValues = visual => visual.rows.map(row => row.marks * visual.scale);
const bundleKey = counts => `bundle:${counts.join(':')}`;

function model(question, type) {
  if (question.visual?.kind !== `v2-everyday-${type}`) throw new Error(`The ${question.family} question has an inconsistent diagram.`);
  return question.visual;
}

function optionModels(question, type, key) {
  const values = question.options ?? question.choices?.map(choice => choice.value);
  const visuals = question.optionVisuals ?? question.choices?.map(choice => choice.visual);
  if (!values || !visuals || values.length !== visuals.length) throw new Error('This question needs graphical answer choices.');
  visuals.forEach((visual, index) => {
    if (visual?.kind !== `v2-everyday-${type}` || key(visual) !== values[index]) throw new Error('A picture option does not match its answer key.');
  });
  return visuals;
}

function numeric(answer, values, grade) {
  return answerChoices(String(answer), values.filter(([value]) => Number.isFinite(value) && value >= 0)
    .map(([value, code]) => wrong(value, code)), choiceCount(grade));
}

function make(prompt, answer, explanation, proof, choices, visual = null, hint = null) {
  return {
    prompt, answer: String(answer), explanation, proof, choices,
    ...(visual ? { visual } : {}), ...(hint ? { hint } : {}),
  };
}

function priceBoard(items) {
  return diagram('shop', { items }, `Price board in rupees: ${items.map(item => `${item.name}, Rs ${item.price}`).join('; ')}.`);
}

function graph(r, grade, level, format) {
  const scale = grade.year < 3 ? r.pick([2, 3, 5]) : r.pick([3, 4, 5, 10]);
  const labels = r.shuffle(['Dawn', 'Noon', 'Dusk', 'Night']).slice(0, grade.year < 3 ? 3 : 4);
  const rows = labels.map(label => ({ label, marks: r.int(2, level === 3 ? 9 : 7) }));
  return diagram('chart', { format, scale, rows, unit: 'samples' },
    `${format === 'pictograph' ? `Pictograph key: each star represents ${scale} samples.` : `Graph vertical scale: one interval represents ${scale} samples.`} ${rows.map(row => `${row.label}, ${row.marks} ${format === 'pictograph' ? 'stars' : 'intervals above zero'}`).join('; ')}.`);
}

export function draftEveryday(family, grade, level, r, bank3 = false) {
  bank3Words = bank3;
  try { return draftEverydayWords(family, grade, level, r); } finally { bank3Words = false; }
}

function draftEverydayWords(family, grade, level, r) {
  const count = choiceCount(grade);
  const year = grade.year;
  switch (family) {
    case 'count':
    case 'count-target': {
      const target = r.pick(SHAPES.slice(0, 4));
      const amount = r.int(1, year < 0 ? (level === 1 ? 5 : 7) : 12);
      const other = r.pick(SHAPES.filter(shape => shape !== target));
      const distractors = family === 'count' ? 0 : r.int(1, 4);
      const marked = family === 'count-target' && level === 3;
      const extras = marked ? r.int(1, 3) : 0;
      const items = r.shuffle([
        ...symbols(target, amount, marked ? 'o' : ''),
        ...symbols(other, distractors), ...symbols(target, extras),
      ]);
      const visual = collection([{ label: 'Look carefully', items }]);
      return make(`How many ${marked ? 'ring-marked ' : ''}${target}s can you find?`, amount,
        `Count only the ${target}s${marked ? ' with a ring' : ''}, once each. There are ${amount}.`,
        { target, mark: marked ? 'o' : null },
        numeric(amount, [[amount + distractors + extras, 'included-extra'], [Math.max(0, amount - 1), 'missed-object'],
          [distractors + extras, 'included-extra'], [amount + 1, 'missed-object']], grade), visual);
    }
    case 'collection-change': {
      const shape = r.pick(SHAPES.slice(0, 4));
      const before = r.int(3, year < 0 ? 7 : 14);
      const used = r.int(1, before - 1);
      const answer = before - used;
      return make(`Some ${shape}s are put away. How many are left?`, answer,
        `Start with ${before}, then remove the ${used} put away: ${before} - ${used} = ${answer}.`,
        {}, numeric(answer, [[before, 'ignored-change'], [used, 'wrong-operation'], [before + used, 'wrong-operation']], grade),
        collection([{ label: 'At first', items: symbols(shape, before) }, { label: 'Put away', items: symbols(shape, used) }]));
    }
    case 'compare-groups':
    case 'compare-after': {
      const a = r.int(2, year < 0 ? 6 : 10);
      const b = r.int(2, year < 0 ? 6 : 10);
      const changing = family === 'compare-after';
      const ca = changing ? -r.int(1, a - 1) : 0;
      const cb = changing ? r.int(1, 3) : 0;
      const more = r.pick([true, false]);
      const av = a + ca;
      const bv = b + cb;
      const answer = av === bv ? 'The same number' : (av > bv) === more ? 'Group A' : 'Group B';
      const visual = collection([
        { label: 'Group A', items: symbols(r.pick(SHAPES), a), change: ca },
        { label: 'Group B', items: symbols(r.pick(SHAPES), b), change: cb },
      ]);
      return make(`${changing ? 'Make the changes shown. Then, w' : 'W'}hich group has ${more ? 'more' : 'fewer'} objects?`, answer,
        `${changing ? `After the changes, ${a} - ${-ca} = ${av} and ${b} + ${cb} = ${bv}. ` : ''}${av === bv ? 'Both groups have the same number.' : `${answer} has ${more ? 'more' : 'fewer'} objects. Picture size and spacing do not change the counts.`}`,
        { more }, answerChoices(answer, ['Group A', 'Group B', 'The same number'].filter(value => value !== answer).map(value =>
          wrong(value, changing ? 'ignored-change' : 'compare-spacing')), count), visual);
    }
    case 'pattern-next':
    case 'pattern-gap': {
      const length = level === 1 ? 2 : 3;
      const block = r.shuffle(SHAPES).slice(0, length).map(shape => symbol(shape));
      const size = length * 2 + 1;
      const index = family === 'pattern-next' ? size - 1 : r.int(1, size - 2);
      const items = Array.from({ length: size }, (_, i) => i === index ? null : block[i % length]);
      const answer = block[index % length];
      const visual = diagram('row', { items }, `A repeating row: ${items.map(item => item ? symbolName(item) : 'missing picture').join(', ')}.`);
      return make(family === 'pattern-next' ? 'Which picture comes next in this repeating pattern?' : 'Which picture belongs in the gap?',
        symbolKey(answer), `The repeating group is ${block.map(item => item.shape).join(', ')}. Keep the same group on both sides of the gap; the missing picture is a ${answer.shape}.`,
        { block, index }, answerChoices(symbolKey(answer), r.shuffle(SHAPES.filter(shape => shape !== answer.shape)).map(shape =>
          wrong(symbolKey(symbol(shape)), 'repeat-unit', symbolVisual(symbol(shape)))), count, symbolVisual(answer)), visual);
    }
    case 'picture-analogy': {
      const size = year < 0 ? 2 : 3;
      const first = r.shuffle(SHAPES).slice(0, size).map(shape => symbol(shape));
      const next = r.shuffle(SHAPES).slice(0, size).map(shape => symbol(shape));
      const result = [...next].reverse();
      const permutations = size === 2 ? [next] : [
        next, [next[1], next[2], next[0]], [next[2], next[0], next[1]], [next[0], next[2], next[1]], [next[1], next[0], next[2]],
      ];
      const visual = diagram('analogy', { first, second: [...first].reverse(), third: next },
        `First pair: ${first.map(symbolName).join(', ')} becomes ${[...first].reverse().map(symbolName).join(', ')}. New row: ${next.map(symbolName).join(', ')}.`);
      return make(year < 1 ? 'The first pair switches ends. Which picture row completes the second pair?' : 'The second pair follows the same reversal rule as the first. Which row completes it?',
        rowKey(result), `Read the original row from the other end. The new row becomes ${result.map(item => item.shape).join(', ')}.`,
        {}, answerChoices(rowKey(result), permutations.map(items => wrong(rowKey(items), 'wrong-transform', rowVisual(items))), count, rowVisual(result)), visual);
    }
    case 'odd-picture':
    case 'attribute-match':
    case 'shape-match': {
      const shapes = r.shuffle(Object.keys(SIDES).filter(shape => year >= 1 || !['pentagon', 'hexagon'].includes(shape)));
      if (family === 'odd-picture') {
        const common = r.pick(['circle', 'triangle', 'square']);
        const correct = symbol(r.pick(shapes.filter(shape => shape !== common)), r.pick(['', 'o', '+']));
        const alternatives = ['', 'o', '+'].map(mark => symbol(common, mark));
        return make(`All except one of these pictures are ${common}s. Which is different?`, symbolKey(correct),
          `Look at the outlines, not the inner marks. The other pictures are ${common}s; the different outline is a ${correct.shape}.`,
          { common }, answerChoices(symbolKey(correct), alternatives.map(item =>
            wrong(symbolKey(item), 'sorting-rule', symbolVisual(item))), count, symbolVisual(correct)), null,
          'Match the named outline. The marks inside it are not the sorting rule in this question.');
      }
      if (family === 'attribute-match') {
        const shape = r.pick(shapes);
        const other = r.pick(shapes.filter(value => value !== shape));
        const correct = symbol(shape, r.pick(['o', '+']));
        const alternativeMark = correct.mark === 'o' ? '+' : 'o';
        const alternatives = [symbol(shape, alternativeMark), symbol(other, correct.mark), symbol(other, alternativeMark)];
        return make(`Which picture is a ${shape} with ${correct.mark === 'o' ? 'a ring' : 'a plus mark'}?`, symbolKey(correct),
          `Both clues matter: the outline must be a ${shape}, and its mark must be ${correct.mark === 'o' ? 'a ring' : 'a plus'}.`,
          { shape, mark: correct.mark }, answerChoices(symbolKey(correct), alternatives.map(item =>
            wrong(symbolKey(item), 'ignored-mark', symbolVisual(item))), count, symbolVisual(correct)));
      }
      const correct = symbol(r.pick(shapes));
      const sides = SIDES[correct.shape];
      return make(`Which picture has ${sides} straight sides?`,
        symbolKey(correct), `Trace the boundary once: a ${correct.shape} has ${sides} straight sides.`,
        { sides }, answerChoices(symbolKey(correct), shapes.filter(shape => SIDES[shape] !== sides).map(shape =>
          wrong(symbolKey(symbol(shape)), 'ignored-condition', symbolVisual(symbol(shape)))), count, symbolVisual(correct)));
    }
    case 'position-row':
    case 'position-swap': {
      const size = year < 0 ? 4 : year === 0 ? 5 : 6;
      const items = r.shuffle(SHAPES).slice(0, size).map(shape => symbol(shape));
      const fromRight = year > 0 && r.pick([true, false]);
      const at = r.int(1, size - 2);
      const swap = family === 'position-swap' ? [0, r.int(1, size - 1)] : null;
      const updated = [...items];
      if (swap) [updated[swap[0]], updated[swap[1]]] = [updated[swap[1]], updated[swap[0]]];
      const neighbour = year > 0 ? r.pick([-1, 1]) : 0;
      const targetIndex = fromRight ? size - at - 1 : at;
      const answer = updated[targetIndex + neighbour];
      const instruction = swap ? `The ${items[swap[0]].shape} and ${items[swap[1]].shape} swap places. ` : '';
      const prompt = neighbour ? `${instruction}${swap ? 'After the swap, w' : 'W'}hich picture is immediately ${neighbour < 0 ? 'before' : 'after'} ${swap ? `the ${updated[targetIndex].shape}` : `picture number ${at + 1} from the ${fromRight ? 'right' : 'left'}`}, reading left to right?`
        : `${instruction}Which picture is number ${at + 1} from the ${fromRight ? 'right' : 'left'}${swap ? ' now' : ''}?`;
      return make(prompt, symbolKey(answer), `${swap ? `The new order is ${updated.map(item => item.shape).join(', ')}. ` : ''}Count from the stated end${neighbour ? ', then move to the named neighbour' : ''}. The required picture is the ${answer.shape}.`,
        { at, fromRight, swap, neighbour }, answerChoices(symbolKey(answer), r.shuffle(items.filter(item => symbolKey(item) !== symbolKey(answer))).map(item =>
          wrong(symbolKey(item), swap ? 'ignored-change' : 'position-end', symbolVisual(item))), count, symbolVisual(answer)), rowVisual(items),
        swap ? 'Make the new row after the swap before locating the named position or neighbour.' : 'Start at the left or right end named in the question. Count each position once.');
    }
    case 'shape-count':
    case 'scene-statements': {
      if (family === 'scene-statements' && year >= 4) {
        const width = r.int(7, 12);
        const height = r.int(3, 6);
        const side = r.int(3, 9);
        const delta = r.int(1, height - 1);
        const property = r.pick(['perimeter', 'area']);
        const difference = 4 * side - 2 * (width + height);
        const claimDifference = difference + r.pick([0, 4, -4]);
        const first = property === 'perimeter' ? 2 * (width + delta + height - delta) === 2 * (width + height)
          : (width + delta) * (height - delta) === width * height;
        const second = claimDifference === difference;
        const answer = statementAnswer(first, second);
        const relation = claimDifference === 0 ? 'the same perimeter as A' : `a perimeter ${Math.abs(claimDifference)} cm ${claimDifference > 0 ? 'greater' : 'smaller'} than A`;
        const visual = diagram('property-figures', { width, height, side }, `Figure A: rectangle ${width} cm by ${height} cm. Figure B: square of side ${side} cm. Figures are not to scale.`);
        return make(`I: Making A ${delta} cm longer and ${delta} cm narrower leaves its ${property} unchanged. II: B has ${relation}. Which statement choice is correct?`,
          answer, `A has perimeter ${2 * (width + height)} cm and area ${width * height} square cm. After the change its sides are ${width + delta} and ${height - delta}: perimeter ${2 * (width + height)} cm, area ${(width + delta) * (height - delta)} square cm. B has perimeter ${4 * side} cm. ${answer}.`,
          { delta, property, claimDifference }, statementChoices(answer, grade), visual,
          'Check the changed dimensions for statement I. For statement II, calculate both outside boundaries. Check the two statements separately.');
      }
      const vehicles = Array.from({ length: r.int(1, year < 0 ? 1 : year === 0 ? 2 : 3) }, () => ({ windows: r.int(1, 3) }));
      const counts = sceneCounts(vehicles);
      const visual = diagram('scene', { vehicles }, sceneDescription(vehicles));
      if (family === 'shape-count') {
        const target = r.pick(['circle', 'triangle']);
        const answer = counts[target];
        return make(`How many ${target}-shaped parts are there on all the rovers?`, answer,
          `${target === 'circle' ? `Count the circular windows and both circular wheels on each rover: ${vehicles.map(vehicle => `${vehicle.windows} + 2`).join('; ')}.` : 'Each rover has one triangular nose.'} There ${isOne(answer) ? 'is' : 'are'} ${pl(answer, `${target}-shaped part`)} in all.`,
          { target }, numeric(answer, [[target === 'circle' ? sum(vehicles.map(vehicle => vehicle.windows)) : counts.circle, 'included-extra'],
            [answer + vehicles.length, 'missed-object'], [Math.max(0, answer - vehicles.length), 'missed-object'], [counts.circle + counts.triangle, 'included-extra']], grade), visual);
      }
      const c1 = counts.circle + r.pick([0, 1, -1]);
      const c2 = counts.triangle + r.pick([0, 1]);
      const answer = statementAnswer(c1 === counts.circle, c2 === counts.triangle);
      return make(`Look at the rover parts. I: ${isOne(c1) ? 'There is' : 'There are'} ${pl(c1, 'circular part')}. II: ${isOne(c2) ? 'There is' : 'There are'} ${pl(c2, 'triangular part')}. Which statement choice is correct?`, answer,
        `Circular parts: ${vehicles.map(vehicle => `${pl(vehicle.windows, 'window')} + 2 wheels`).join('; ')}, making ${counts.circle}. There ${isOne(counts.triangle) ? 'is' : 'are'} ${pl(counts.triangle, 'triangular nose')}. ${answer}.`,
        { claims: [c1, c2] }, statementChoices(answer, grade), visual,
        'For circular parts, include the wheels and windows. Check each statement on its own.');
    }
    case 'solid-properties': {
      const rule = r.pick([{ property: 'flat', value: 0 }, { property: 'flat', value: 1 }, { property: 'flat', value: 2 },
        { property: 'flat', value: 6 }, { property: 'vertices', value: 1 }, { property: 'vertices', value: 8 }]);
      const answer = Object.keys(SOLIDS).find(name => SOLIDS[name][rule.property] === rule.value);
      const visual = name => diagram('solid', { solid: name }, `${name} shown as a solid object.`);
      return make(`Which solid has ${rule.value} ${rule.property === 'flat' ? 'flat faces' : 'vertices (pointed corners)'}?`, answer,
        `A ${answer} has ${rule.value} ${rule.property === 'flat' ? 'flat faces' : 'vertices'}. Curved surfaces are not flat faces.`,
        rule, answerChoices(answer, Object.keys(SOLIDS).filter(name => name !== answer).map(name =>
          wrong(name, 'ignored-condition', visual(name))), count, visual(answer)), null,
        'Separate flat faces from curved surfaces. A vertex is a pointed corner, not a curved edge.');
    }
    case 'ruler-read': {
      const start = year < 1 ? 0 : r.int(1, 4);
      const end = start + r.int(2, 6);
      const step = year >= 3 ? r.pick([2, 5]) : 1;
      const unit = year < 1 ? 'blocks' : year >= 3 ? 'mm' : 'cm';
      const answer = (end - start) * step;
      const visual = diagram('ruler', { start, end, step, divisions: end + 1, unit },
        `A ruler marked every ${step} ${unit}. The strip begins at mark ${start * step} and ends at mark ${end * step}.`);
      return make(`How long is the strip, in ${unit}?`, answer,
        `Subtract the starting reading from the ending reading: ${end * step} - ${start * step} = ${answer} ${unit}.`,
        {}, numeric(answer, [[end * step, 'scale-zero'], [end - start, 'scale-interval'], [(end - start + 1) * step, 'counted-endpoints'], [(end + start) * step, 'wrong-operation'], [Math.max(0, (end - start - 1) * step), 'counted-endpoints']], grade),
        visual, 'The strip does not necessarily begin at zero. Find the value of one interval first.');
    }
    case 'instrument-read': {
      const interval = year < 1 ? 1 : year === 1 ? r.pick([1, 2]) : r.pick([5, 10, 20, 50]);
      const fillIndex = r.int(2, 7);
      const visual = diagram('container', { min: 0, interval, divisions: 8, fillIndex, unit: year < 1 ? 'cups' : 'mL' },
        `A graduated container with ${8} equal intervals from 0 to ${interval * 8} ${year < 1 ? 'cups' : 'mL'}. Liquid reaches interval ${fillIndex} above zero.`);
      const answer = interval * fillIndex;
      return make(`What is the amount of liquid, in ${visual.unit}?`, answer,
        `The labelled marks show that one interval is ${interval} ${visual.unit}. The liquid reaches interval ${fillIndex}: ${interval} x ${fillIndex} = ${answer} ${visual.unit}.`,
        {}, numeric(answer, [[fillIndex, 'scale-interval'], [interval * (fillIndex + 1), 'scale-interval'], [interval * (fillIndex - 1), 'scale-interval'], [interval * 8 - answer, 'fraction-complement']], grade), visual,
        year < 1 ? 'Count equal spaces up from zero to the liquid level.' : 'Use two labelled marks to find the amount in one interval, then count intervals up from zero.');
    }
    case 'balance-missing': {
      if (year >= 4) {
        const a = r.int(2, 9) * 10;
        const b = r.int(2, 9) * 10;
        const aCount = r.int(2, 3);
        const bCount = r.int(2, 3);
        const known = r.int(1, 4) * 10;
        const first = aCount * a + known;
        const second = bCount * b + a;
        const visual = diagram('linked-balances', { aCount, bCount, known, first, second },
          `Two level balances. First: ${aCount} A boxes plus ${known} g balance ${first} g. Second: ${bCount} B boxes and one A box balance ${second} g. Identical letters mean identical masses.`);
        return make('Every A box has the same mass, and every B box has the same mass. Both scales balance. What is the mass of ONE B box, in grams?', b,
          `First find one A box: (${first} - ${known}) / ${aCount} = ${a} g. Then use the second balance: (${second} - ${a}) / ${bCount} = ${b} g.`,
          {}, numeric(b, [[second - a, 'missing-step'], [Math.floor(second / bCount), 'balance-total'], [a, 'ignored-condition'], [first - known, 'missing-step'], [second, 'balance-total']], grade), visual,
          'Use the first balance to find one A box. Substitute that mass into the second balance before finding one B box.');
      }
      const unknowns = (year >= 3 && level >= 2 || year >= 2 && level === 3) ? r.int(2, 3) : 1;
      const item = r.int(2, year < 1 ? 5 : year === 1 ? 12 : 90);
      const known = r.int(1, year < 1 ? 3 : 9);
      const total = item * unknowns + known;
      const visual = diagram('balance', { left: [total], right: [known], unknowns, unit: year < 1 ? 'blocks' : 'g' },
        `A level balance. Left pan: ${total} ${year < 1 ? 'blocks' : 'g'}. Right pan: ${known} ${year < 1 ? 'blocks' : 'g'} plus ${unknowns} identical mystery boxes.`);
      return make(`The scale is balanced. What is the mass of ONE mystery box, in ${visual.unit}?`, item,
        `Remove the known ${known} ${visual.unit}: ${total} - ${known} = ${total - known}. ${unknowns > 1 ? `Share that mass between ${unknowns} identical boxes: ${total - known} / ${unknowns} = ${item}.` : `The box is ${item} ${visual.unit}.`}`,
        {}, numeric(item, [[total, 'balance-total'], [total + known, 'wrong-operation'], [total - known, 'missing-step'], [known, 'balance-total'], [item + known, 'balance-total']], grade), visual,
        'Both pans have equal mass. Remove the known mass, then share the rest between the identical mystery boxes.');
    }
    case 'measure-change': {
      const unit = 'cm';
      if (year <= 1 || level === 2) {
        const start = r.int(4, year <= 1 ? 12 : 90);
        const joined = r.int(3, year <= 1 ? 9 : 30);
        const cut = r.int(1, Math.min(joined - 1, 8));
        const end = start + joined - cut;
        const visual = diagram('measures', { rows: [{ label: 'At first', value: start, unit }, { label: 'At the end', value: end, unit }] },
          `Length record: at first ${start} ${unit}; at the end ${end} ${unit}.`);
        return make(`A strip is joined to the first strip, then ${cut} ${unit} is cut off. The final length is shown. How long was the strip that was joined, in ${unit}?`, joined,
          `Undo the cut: ${end} + ${cut} = ${end + cut}. Remove the original ${start}: ${end + cut} - ${start} = ${joined} ${unit}.`,
          { cut, query: 'joined' }, numeric(joined, [[end - start, 'missing-step'], [end + cut, 'missing-step'], [end - start - cut, 'reversed-operation'], [end + start + cut, 'wrong-operation']], grade), visual,
          'Undo the last cut first. Then subtract the original length to find the joined strip.');
      }
      const pieces = r.int(3, 6);
      const each = r.int(12, 50);
      const waste = r.int(5, 20);
      const total = pieces * each + waste;
      const visual = diagram('measures', { rows: [{ label: 'Full roll', value: total, unit }] }, `Full roll: ${total} ${unit}.`);
      return make(`${waste} ${unit} is unusable. The rest makes ${pieces} equal pieces. How much is in each piece, in ${unit}?`, each,
        `Use only ${total} - ${waste} = ${total - waste} ${unit}. Divide between ${pieces} pieces: ${total - waste} / ${pieces} = ${each} ${unit}.`,
        { waste, pieces, query: 'shared' }, numeric(each, [[total - waste, 'missing-step'], [Math.floor(total / pieces), 'ignored-change'], [Math.floor((total + waste) / pieces), 'wrong-operation'], [total, 'missing-step']], grade), visual);
    }
    case 'unit-combine': {
      const units = year < 3 ? { big: 'm', small: 'cm', ratio: 100 } : r.pick([
        { big: 'm', small: 'cm', ratio: 100 }, { big: 'kg', small: 'g', ratio: 1000 }, { big: 'L', small: 'mL', ratio: 1000 },
      ]);
      const major = r.int(1, 5);
      const minor = r.int(1, 8) * (units.ratio / 10);
      const b = r.int(1, 7) * (units.ratio / 10);
      const visual = diagram('measures', { rows: [
        { label: 'A', value: major, unit: units.big, extra: minor, extraUnit: units.small },
        { label: 'B', value: b, unit: units.small },
      ] }, `Quantity A: ${major} ${units.big} ${minor} ${units.small}. Quantity B: ${b} ${units.small}.`);
      const total = major * units.ratio + minor;
      const query = level === 1 ? 'sum' : level === 2 ? 'difference' : 'pieces';
      const piece = query === 'pieces' ? units.ratio / 10 * r.int(2, 4) : null;
      const answer = query === 'sum' ? total + b : query === 'difference' ? Math.abs(total - b) : Math.floor((total - b) / piece);
      const prompt = query === 'sum' ? `What is the combined amount of A and B, in ${units.small}?`
        : query === 'difference' ? `What is the difference between A and B, in ${units.small}?`
          : `Quantity B is removed from A. How many FULL portions of ${piece} ${units.small} can be made from what remains?`;
      const wrongValues = query === 'pieces'
        ? [[Math.floor(total / piece), 'missing-step'], [Math.ceil((total - b) / piece), 'remainder-rule'], [total - b, 'missing-step'], [Math.floor((total + b) / piece), 'wrong-operation']]
        : [[query === 'sum' ? major + minor + b : Math.abs(major + minor - b), 'unit-conversion'], [query === 'sum' ? total - b : total + b, 'wrong-operation'],
          [query === 'sum' ? minor + b : Math.abs(minor - b), 'unit-conversion'], [total, 'missing-step']];
      return make(prompt, answer, `First, A = ${major} x ${units.ratio} + ${minor} = ${total} ${units.small}. ${query === 'pieces' ? `Remove ${b}, then count full portions: floor((${total} - ${b}) / ${piece}) = ${answer}.` : `${query === 'sum' ? 'Combine' : 'Compare'} with ${b} ${units.small}: ${answer} ${units.small}.`}`,
        { ...units, query, piece }, numeric(answer, wrongValues, grade), visual);
    }
    case 'temperature': {
      const interval = r.pick([2, 5]);
      const min = r.pick([0, 10]);
      const fillIndex = r.int(3, 7);
      const drop = r.int(2, 6);
      const rise = r.int(1, 5);
      const visual = diagram('thermometer', { min, interval, divisions: 8, fillIndex, unit: 'C' },
        `Thermometer: equal intervals from ${min} to ${min + interval * 8} degrees C. The level reaches interval ${fillIndex} above ${min}.`);
      const start = min + interval * fillIndex;
      const answer = start - drop + rise;
      return make(`The temperature then falls ${drop} degrees C and rises ${rise} degrees C. What is it now, in degrees C?`, answer,
        `The scale reads ${min} + ${fillIndex} x ${interval} = ${start} degrees C. Then ${start} - ${drop} + ${rise} = ${answer} degrees C.`,
        { drop, rise }, numeric(answer, [[start, 'missing-step'], [start + drop + rise, 'wrong-operation'], [start - drop - rise, 'wrong-operation'], [fillIndex - drop + rise, 'scale-interval']], grade), visual);
    }
    case 'clock-read':
    case 'clock-options':
    case 'time-chain':
    case 'clock-error':
      return draftTime(family, grade, level, r);
    case 'calendar':
      return draftCalendar(grade, level, r);
    case 'coin-value':
    case 'shopping-pair':
    case 'shopping-change':
    case 'shopping-budget':
      return draftMoney(family, grade, level, r);
    case 'pictograph':
    case 'chart-compare':
    case 'chart-update':
    case 'graph-parts':
      return draftData(family, grade, level, r);
    default: throw new Error(`Unknown everyday question family: ${family}`);
  }
}

function statementAnswer(first, second) {
  return first && second ? 'Both I and II' : first ? 'Only I' : second ? 'Only II' : 'Neither I nor II';
}

function statementChoices(answer, grade) {
  return answerChoices(answer, ['Only I', 'Only II', 'Both I and II', 'Neither I nor II'].filter(value => value !== answer).map(value =>
    wrong(value, 'ignored-condition')), choiceCount(grade));
}

function draftTime(family, grade, level, r) {
  const year = grade.year;
  const minute = year === 1 ? r.pick([0, 30]) : year === 2 ? r.int(0, 11) * 5 : r.int(0, 59);
  const start = r.int(1, 10) * 60 + minute;
  if (family === 'clock-read') {
    const answer = timeText(start);
    return make('Which time is shown by this clock?', answer,
      `The shorter hand gives the hour and the longer hand gives the minute mark. The clock reads ${answer}.`,
      {}, answerChoices(answer, [
        wrong(timeText(start + 60), 'clock-hands'), wrong(timeText(Math.floor(start / 60) * 60 + (Math.floor(start / 60) * 5) % 60), 'clock-hands'),
        wrong(timeText(start + 5), 'clock-hands'), wrong(timeText(start - 60), 'clock-hands'),
      ]), clockVisual(start));
  }
  if (family === 'clock-options') {
    const duration = year === 1 ? r.pick(level === 2 ? [30, 60] : [60, 90]) : r.int(2, 21) * 5 + (year >= 3 ? r.int(0, 4) : 0);
    const answer = timeText(start + duration);
    const visual = clockVisual(start);
    const correct = clockVisual(start + duration);
    const alternatives = [
      [start - duration, 'time-direction'], [start + duration + 60, 'hour-carry'],
      [Math.floor(start / 60) * 60 + ((minute + duration) % 60), 'hour-carry'],
      [start + duration * 5, 'clock-hands'], [start, 'missing-step'],
    ].map(([minutes, code]) => wrong(timeText(minutes), code, clockVisual(minutes)));
    return make(`The starting clock is shown. Which clock shows the time ${duration} minutes later?`, answer,
      `Add ${duration} minutes to ${timeText(start)}, regrouping 60 minutes as an hour. The finishing clock is ${answer}.`,
      { duration }, answerChoices(answer, alternatives, 4, correct), visual);
  }
  if (family === 'time-chain') {
    const first = r.int(2, 9) * 5 + (year >= 3 ? r.int(0, 4) : 0);
    const stop = r.int(1, 5) * 5;
    const last = r.int(2, 8) * 5;
    const backwards = level === 3;
    const total = first + stop + last;
    const displayed = backwards ? start + total : start;
    const answer = timeText(backwards ? displayed - total : displayed + total);
    return make(`A shuttle travels ${first} minutes, stops for ${stop} minutes, then travels ${last} minutes. The ${backwards ? 'arrival' : 'departure'} clock is shown. When did it ${backwards ? 'depart' : 'arrive'}?`, answer,
      `Include both trips and the stop: ${first} + ${stop} + ${last} = ${total} minutes. ${backwards ? 'Work backwards from arrival' : 'Count forwards from departure'} to get ${answer}.`,
      { first, stop, last, backwards }, answerChoices(answer, [
        wrong(timeText(displayed + (backwards ? 1 : -1) * total), 'time-direction'),
        wrong(timeText(displayed + (backwards ? -1 : 1) * (first + last)), 'missing-step'),
        wrong(timeText(displayed + (backwards ? -1 : 1) * first), 'missing-step'),
        wrong(timeText(displayed + (backwards ? -1 : 1) * (stop + last)), 'missing-step'),
      ]), clockVisual(displayed));
  }
  const fast = r.pick([true, false]);
  const initial = r.int(2, 8);
  const rate = r.int(1, 4);
  const period = r.pick([1, 2]);
  const hours = period * r.int(2, 4);
  const error = (initial + rate * hours / period) * (fast ? 1 : -1);
  const shown = start + error;
  const answer = timeText(shown - error);
  return make(`A clock is ${initial} minutes ${fast ? 'fast' : 'slow'} when checked. It then ${fast ? 'gains' : 'loses'} ${rate} minutes every ${period} real hour${period > 1 ? 's' : ''}. After ${hours} real hours it shows the picture. What is the actual time?`, answer,
    `The error grows by ${rate} x (${hours} / ${period}) = ${rate * hours / period} minutes. Total error is ${Math.abs(error)} minutes ${fast ? 'ahead' : 'behind'}. ${fast ? 'Subtract' : 'Add'} that error from the shown ${timeText(shown)} to get ${answer}.`,
    { fast, initial, rate, period, hours }, answerChoices(answer, [
      wrong(timeText(shown), 'clock-error'), wrong(timeText(shown + error), 'clock-error'),
      wrong(timeText(shown - initial * (fast ? 1 : -1)), 'missing-step'),
      wrong(timeText(shown - (error - initial * (fast ? 1 : -1))), 'missing-step'),
    ]), clockVisual(shown), 'First find the initial error plus the extra error over the real hours. A fast clock is ahead; a slow clock is behind.');
}

function draftCalendar(grade, level, r) {
  const year = r.pick([2027, 2028, 2029]);
  const month = r.int(0, 11);
  const visual = diagram('calendar', { year, month }, `Calendar for ${new Date(Date.UTC(year, month, 1)).toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })} ${year}; weekday headings Sun, Mon, Tue, Wed, Thu, Fri, Sat. Day 1 is ${WEEKDAYS[new Date(Date.UTC(year, month, 1)).getUTCDay()]}.`);
  if (grade.year <= 2 && level <= 2) {
    const date = r.int(3, 21);
    const after = level === 1 ? 0 : r.int(1, grade.year === 1 ? 4 : 9);
    const answer = WEEKDAYS[weekday(visual, date + after)];
    return make(after ? `A club meets on date ${date}. The launch is ${after} days later. On which weekday is the launch?` : `On which weekday does date ${date} fall?`,
      answer, `Find date ${date} under its weekday heading${after ? `, then move forward ${after} dates to ${date + after}` : ''}. The required day is ${answer}.`,
      { query: 'weekday', date, after }, answerChoices(answer, r.shuffle(WEEKDAYS.filter(day => day !== answer)).map(day =>
        wrong(day, after ? 'counted-endpoints' : 'calendar-column'))), visual);
  }
  if (level < 3 || grade.year <= 2) {
    const day = r.int(0, 6);
    const occurrence = r.int(1, grade.year === 1 ? 2 : 3);
    const dates = Array.from({ length: calendarDays(visual) }, (_, index) => index + 1).filter(date => weekday(visual, date) === day);
    const offset = r.int(1, grade.year === 1 ? 3 : 6);
    const base = dates[occurrence - 1];
    const answer = base + offset;
    return make(`The test flight is ${pl(offset, 'day')} after the ${occurrence === 1 ? 'first' : occurrence === 2 ? 'second' : 'third'} ${WEEKDAYS[day]} of this month. On which date is it?`, answer,
      `The ${occurrence === 1 ? 'first' : occurrence === 2 ? 'second' : 'third'} ${WEEKDAYS[day]} is date ${base}. Count ${pl(offset, 'day')} after it: ${base} + ${offset} = ${answer}.`,
      { query: 'occurrence', day, occurrence, offset }, numeric(answer, [[base, 'missing-step'], [base - offset, 'time-direction'], [base + offset - 1, 'counted-endpoints'], [base + offset + 7, 'ignored-condition']], grade), visual);
  }
  const from = r.int(2, 10);
  const to = from + r.int(9, 16);
  const holiday = r.int(from + 1, to);
  if ([0, 6].includes(weekday(visual, holiday))) throw new QuestionRetry('The holiday must fall on a school day.');
  const dates = Array.from({ length: to - from }, (_, index) => from + index + 1);
  const weekdays = dates.filter(date => ![0, 6].includes(weekday(visual, date))).length;
  const answer = weekdays - 1;
  return make(`Training starts AFTER date ${from} and ends ON date ${to}. It runs Monday to Friday, but date ${holiday} is a holiday. How many training days are there?`, answer,
    `Count weekday dates ${from + 1} through ${to}, including the end but not the start: ${weekdays}. Remove the weekday holiday: ${weekdays} - 1 = ${answer}.`,
    { query: 'schooldays', from, to, holiday }, numeric(answer, [[weekdays, 'ignored-condition'], [to - from - 1, 'ignored-condition'], [to - from, 'ignored-condition'], [weekdays + 1, 'counted-endpoints']], grade), visual);
}

function draftMoney(family, grade, level, r) {
  if (family === 'coin-value') {
    const coins = r.shuffle([1, 2, 5, 10]).slice(0, 3).flatMap(value => Array(r.int(1, 2)).fill(value));
    const visual = diagram('coins', { coins }, `Coins with rupee values: ${coins.join(', ')}.`);
    const answer = sum(coins);
    return make('What is the total value of these coins, in rupees?', answer,
      `Add the values, not the number of coins: ${coins.join(' + ')} = Rs ${answer}.`,
      {}, numeric(answer, [[coins.length, 'coin-count'], [answer - coins[0], 'missed-object'], [answer + coins[0], 'coin-count'], [Math.max(...coins) * coins.length, 'coin-count']], grade), visual,
      'Read and add the value on each coin, rather than only counting the coin shapes.');
  }
  const minimum = grade.year >= 4 ? 15 : 2;
  const items = [
    { name: 'Map', price: r.int(minimum, grade.year === 1 ? 8 : grade.year >= 4 ? 65 : 24), symbol: 'square' },
    { name: 'Badge', price: r.int(minimum + 1, grade.year === 1 ? 9 : grade.year >= 4 ? 75 : 28), symbol: 'star' },
    { name: 'Flag', price: r.int(minimum + 2, grade.year === 1 ? 10 : grade.year >= 4 ? 85 : 30), symbol: 'triangle' },
  ];
  const visual = priceBoard(items);
  if (family === 'shopping-pair') {
    const first = r.int(0, 2);
    const second = (first + 1) % 3;
    const quantity = grade.year === 1 ? 1 : r.int(2, 4);
    const answer = quantity * items[first].price + items[second].price;
    return make(`What is the cost of ${quantity} ${items[first].name.toLowerCase()}${quantity > 1 ? 's' : ''} and one ${items[second].name.toLowerCase()}, in rupees?`, answer,
      `Use the price board: ${quantity} x ${items[first].price} + ${items[second].price} = Rs ${answer}.`,
      { first, second, quantity }, numeric(answer, [[items[first].price + items[second].price, 'price-total'], [quantity * items[first].price, 'missing-step'],
        [quantity * (items[first].price + items[second].price), 'price-total'], [Math.abs(items[first].price - items[second].price), 'wrong-operation'],
        [items[second].price, 'missing-step'], [answer + items[(second + 1) % 3].price, 'included-extra']], grade), visual);
  }
  if (family === 'shopping-change') {
    const quantity = grade.year === 1 ? 1 : r.int(3, 5);
    const badges = grade.year >= 3 ? r.int(2, 3) : 1;
    const removed = grade.year >= 3 ? r.int(1, quantity - 1) : 0;
    const fee = grade.year >= 3 ? r.int(2, 9) : 0;
    const a = items[0].price * (quantity - removed);
    const b = items[1].price * badges;
    const cost = a + b + fee;
    const paid = Math.ceil(cost / 10) * 10 + r.pick([10, 20]);
    const answer = paid - cost;
    return make(`Ari chooses ${quantity} map${quantity > 1 ? 's' : ''} and ${badges === 1 ? 'one badge' : `${badges} badges`}.${removed ? ` At checkout, ${removed} map${removed > 1 ? 's are' : ' is'} removed from the basket, and a Rs ${fee} packing fee is added.` : ''} Ari pays Rs ${paid}. How much change is due, in rupees?`, answer,
      `Maps kept: ${quantity} - ${removed} = ${quantity - removed}. Cost: ${quantity - removed} x ${items[0].price} + ${badges} x ${items[1].price}${fee ? ` + ${fee}` : ''} = Rs ${cost}. Change: ${paid} - ${cost} = Rs ${answer}.`,
      { quantity, badges, removed, fee, paid }, numeric(answer, [[cost, 'change-order'], [paid - a, 'missing-step'], [paid - b, 'missing-step'],
        [paid - a - b, 'missing-step'], [paid - quantity * items[0].price - b - fee, 'ignored-change'], [paid + cost, 'change-order']], grade), visual);
  }
  if (items[0].price === items[1].price) throw new QuestionRetry('Budget alternatives need distinct prices.');
  const totalItems = grade.year < 4 ? 4 : r.int(5, 7);
  const bundles = [1, 2, totalItems - 1, totalItems].map(a => [a, totalItems - a]);
  const fee = grade.year >= 4 ? r.int(2, 8) : 0;
  const candidates = bundles.filter(counts => counts.every(amount => amount > 0))
    .map(counts => ({ counts, cost: counts[0] * items[0].price + counts[1] * items[1].price + fee })).sort((a, b) => a.cost - b.cost);
  const chosen = candidates[r.int(1, candidates.length - 1)];
  const nextCost = candidates.find(candidate => candidate.cost > chosen.cost)?.cost;
  const budget = chosen.cost + (nextCost ? r.int(0, nextCost - chosen.cost - 1) : r.int(0, 3));
  const answer = bundleKey(chosen.counts);
  const bundleVisual = counts => diagram('bundle', { counts, items: items.slice(0, 2).map(({ name, symbol: shape }) => ({ name, shape })) },
    `${pl(counts[0], 'map')} and ${pl(counts[1], 'badge')}.`);
  return make(`Take exactly ${totalItems} items, with at least one map and one badge. ${fee ? `A packing fee of Rs ${fee} is also charged. ` : ''}Spend no more than Rs ${budget}. Which pack uses the MOST money within the budget?`,
    answer, `Check the item count, both types and the ${fee ? 'packing fee as well as the ' : ''}budget. ${pl(chosen.counts[0], 'map')} and ${pl(chosen.counts[1], 'badge')} cost Rs ${chosen.cost}, the largest allowed total${fee ? ` including the Rs ${fee} fee` : ''}.`,
    { totalItems, budget, fee }, answerChoices(answer, bundles.filter(counts => bundleKey(counts) !== answer).map(counts =>
      wrong(bundleKey(counts), 'ignored-condition', bundleVisual(counts))), 4, bundleVisual(chosen.counts)), visual,
    'Reject packs that break the item-count, both-item or budget conditions. Compare the full costs of the allowed packs, including any fee.');
}

function draftData(family, grade, level, r) {
  const visual = graph(r, grade, level, family === 'pictograph' ? 'pictograph' : grade.year >= 4 && family === 'graph-parts' ? 'line' : 'bar');
  const values = chartValues(visual);
  if (family === 'pictograph') {
    const a = r.int(0, values.length - 1);
    const b = (a + 1) % values.length;
    const combine = grade.year >= 3;
    const answer = combine ? values[a] + values[b] : values[a];
    return make(combine ? `How many samples do ${visual.rows[a].label} and ${visual.rows[b].label} have altogether?` : `How many samples does ${visual.rows[a].label} have?`, answer,
      `Each star means ${visual.scale} samples. ${combine ? `(${visual.rows[a].marks} + ${visual.rows[b].marks}) x ${visual.scale}` : `${visual.rows[a].marks} x ${visual.scale}`} = ${answer} samples.`,
      { a, b, combine }, numeric(answer, [[combine ? visual.rows[a].marks + visual.rows[b].marks : visual.rows[a].marks, 'graph-key'],
        [combine ? Math.abs(values[a] - values[b]) : values[a] + values[b], 'graph-difference'], [answer + visual.scale, 'graph-key'], [Math.max(0, answer - visual.scale), 'graph-key']], grade), visual);
  }
  if (family === 'chart-compare') {
    const a = r.int(0, values.length - 1);
    const b = (a + 1) % values.length;
    if (values[a] === values[b]) throw new QuestionRetry('A comparison needs unequal data.');
    const answer = Math.abs(values[a] - values[b]);
    return make(`What is the difference between the sample counts for ${visual.rows[a].label} and ${visual.rows[b].label}?`, answer,
      `Read the scale: the counts are ${values[a]} and ${values[b]}. Subtract the smaller from the larger: ${Math.max(values[a], values[b])} - ${Math.min(values[a], values[b])} = ${answer}.`,
      { a, b }, numeric(answer, [[values[a] + values[b], 'graph-difference'], [Math.abs(visual.rows[a].marks - visual.rows[b].marks), 'graph-key'], [Math.max(values[a], values[b]), 'graph-difference'], [answer + visual.scale, 'graph-key']], grade), visual);
  }
  if (family === 'chart-update') {
    const a = values[0] >= values[1] ? 0 : 1;
    const b = a === 0 ? 1 : 0;
    const transfer = r.int(1, Math.max(1, Math.floor(values[a] / 3)));
    const extra = grade.year >= 3 ? r.int(1, 6) : 0;
    const answer = Math.abs(values[a] - transfer - (values[b] + transfer + extra));
    return make(`${pl(transfer, 'sample')} ${isOne(transfer) ? 'moves' : 'move'} from ${visual.rows[a].label} to ${visual.rows[b].label}.${extra ? ` Then ${visual.rows[b].label} collects ${pl(extra, 'new sample')}.` : ''} What is the difference between their counts now?`, answer,
      `${visual.rows[a].label}: ${values[a]} - ${transfer} = ${values[a] - transfer}. ${visual.rows[b].label}: ${values[b]} + ${transfer}${extra ? ` + ${extra}` : ''} = ${values[b] + transfer + extra}. Their new difference is ${answer}.`,
      { a, b, transfer, extra }, numeric(answer, [[Math.abs(values[a] - values[b]), 'graph-update'], [Math.abs(values[a] - transfer - values[b] - extra), 'graph-update'],
        [values[a] + values[b] + extra, 'graph-difference'], [Math.abs(values[a] - values[b] - extra), 'graph-update']], grade), visual,
      'A transfer changes both groups: take away from the sender and add to the receiver before comparing.');
  }
  const removed = r.int(2, 9);
  const added = r.int(1, 7);
  const first = values[0] + values[2] - removed;
  const second = values[1] + values[3] + added;
  const answer = Math.abs(first - second);
  return make(`${visual.rows[0].label} and ${visual.rows[2].label} combine their samples, then use ${removed}. ${visual.rows[1].label} and ${visual.rows[3].label} combine theirs and find ${added} more. What is the difference between the two final totals?`, answer,
    `First total: ${values[0]} + ${values[2]} - ${removed} = ${first}. Second total: ${values[1]} + ${values[3]} + ${added} = ${second}. Their difference is ${answer}.`,
    { removed, added }, numeric(answer, [[Math.abs(values[0] + values[2] - values[1] - values[3]), 'graph-update'],
      [Math.abs(values[0] + values[2] - removed - values[1] - values[3]), 'missing-step'], [Math.abs(values[0] + values[2] - values[1] - values[3] - added), 'missing-step'],
      [first + second, 'graph-difference']], grade), visual,
    'Build each final total separately, including its change. Only then find the difference between those two totals.');
}

export function solveEveryday(question) {
  const p = question.proof;
  switch (question.family) {
    case 'count':
    case 'count-target': {
      const visual = model(question, 'collections');
      return String(visual.groups[0].items.filter(item => item.shape === p.target && (p.mark === null || item.mark === p.mark)).length);
    }
    case 'collection-change': {
      const visual = model(question, 'collections');
      return String(visual.groups[0].items.length - visual.groups[1].items.length);
    }
    case 'compare-groups':
    case 'compare-after': {
      const visual = model(question, 'collections');
      const [a, b] = visual.groups.map(group => group.items.length + (group.change ?? 0));
      return a === b ? 'The same number' : (a > b) === p.more ? 'Group A' : 'Group B';
    }
    case 'pattern-next':
    case 'pattern-gap': {
      const visual = model(question, 'row');
      if (visual.items[p.index] !== null || visual.items.some((item, index) => item && symbolKey(item) !== symbolKey(p.block[index % p.block.length]))) {
        throw new Error('The displayed pictures do not follow the stated pattern model.');
      }
      optionModels(question, 'symbol', symbolKey);
      return symbolKey(p.block[p.index % p.block.length]);
    }
    case 'picture-analogy': {
      const visual = model(question, 'analogy');
      if (rowKey(visual.second) !== rowKey([...visual.first].reverse())) throw new Error('The analogy does not demonstrate a reversal.');
      optionModels(question, 'row', visual => rowKey(visual.items));
      return rowKey([...visual.third].reverse());
    }
    case 'odd-picture':
    case 'shape-match':
    case 'attribute-match': {
      const options = optionModels(question, 'symbol', symbolKey);
      const matches = options.filter(item => question.family === 'attribute-match' ? item.shape === p.shape && item.mark === p.mark
        : question.family === 'odd-picture' ? item.shape !== p.common : SIDES[item.shape] === p.sides);
      if (matches.length !== 1) throw new Error('The picture properties must select exactly one option.');
      return symbolKey(matches[0]);
    }
    case 'position-row':
    case 'position-swap': {
      const items = [...model(question, 'row').items];
      if (p.swap) [items[p.swap[0]], items[p.swap[1]]] = [items[p.swap[1]], items[p.swap[0]]];
      const index = p.fromRight ? items.length - p.at - 1 : p.at;
      optionModels(question, 'symbol', symbolKey);
      return symbolKey(items[index + p.neighbour]);
    }
    case 'shape-count':
    case 'scene-statements': {
      if (question.visual?.kind === 'v2-everyday-property-figures') {
        const { width, height, side } = model(question, 'property-figures');
        const first = p.property === 'perimeter' ? 2 * (width + p.delta + height - p.delta) === 2 * (width + height)
          : (width + p.delta) * (height - p.delta) === width * height;
        return statementAnswer(first, 4 * side - 2 * (width + height) === p.claimDifference);
      }
      const counts = sceneCounts(model(question, 'scene').vehicles);
      return question.family === 'shape-count' ? String(counts[p.target]) : statementAnswer(p.claims[0] === counts.circle, p.claims[1] === counts.triangle);
    }
    case 'solid-properties': {
      const options = optionModels(question, 'solid', visual => visual.solid);
      const matches = options.filter(visual => SOLIDS[visual.solid]?.[p.property] === p.value);
      if (matches.length !== 1) throw new Error('The solid properties must select one option.');
      return matches[0].solid;
    }
    case 'ruler-read': {
      const visual = model(question, 'ruler');
      return String((visual.end - visual.start) * visual.step);
    }
    case 'instrument-read':
    case 'temperature': {
      const visual = model(question, question.family === 'temperature' ? 'thermometer' : 'container');
      const reading = visual.min + visual.interval * visual.fillIndex;
      return String(question.family === 'temperature' ? reading - p.drop + p.rise : reading);
    }
    case 'balance-missing': {
      if (question.visual?.kind === 'v2-everyday-linked-balances') {
        const visual = model(question, 'linked-balances');
        const a = (visual.first - visual.known) / visual.aCount;
        return String((visual.second - a) / visual.bCount);
      }
      const visual = model(question, 'balance');
      return String((sum(visual.left) - sum(visual.right)) / visual.unknowns);
    }
    case 'measure-change': {
      const visual = model(question, 'measures');
      return String(p.query === 'joined' ? visual.rows[1].value - visual.rows[0].value + p.cut : (visual.rows[0].value - p.waste) / p.pieces);
    }
    case 'unit-combine': {
      const visual = model(question, 'measures');
      const [a, b] = visual.rows;
      if (a.unit !== p.big || a.extraUnit !== p.small || b.unit !== p.small ||
          ![{ big: 'm', small: 'cm', ratio: 100 }, { big: 'kg', small: 'g', ratio: 1000 }, { big: 'L', small: 'mL', ratio: 1000 }]
            .some(unit => unit.big === p.big && unit.small === p.small && unit.ratio === p.ratio)) throw new Error('The conversion model has inconsistent units.');
      const av = a.value * p.ratio + a.extra;
      return String(p.query === 'sum' ? av + b.value : p.query === 'difference' ? Math.abs(av - b.value) : Math.floor((av - b.value) / p.piece));
    }
    case 'clock-read':
      return timeText(model(question, 'clock').minutes);
    case 'clock-options': {
      optionModels(question, 'clock', visual => timeText(visual.minutes));
      return timeText(model(question, 'clock').minutes + p.duration);
    }
    case 'time-chain': {
      const minutes = model(question, 'clock').minutes;
      return timeText(minutes + (p.backwards ? -1 : 1) * (p.first + p.stop + p.last));
    }
    case 'clock-error': {
      const error = (p.initial + p.rate * p.hours / p.period) * (p.fast ? 1 : -1);
      return timeText(model(question, 'clock').minutes - error);
    }
    case 'calendar': {
      const visual = model(question, 'calendar');
      if (p.query === 'weekday') return WEEKDAYS[weekday(visual, p.date + p.after)];
      if (p.query === 'occurrence') {
        const dates = Array.from({ length: calendarDays(visual) }, (_, index) => index + 1).filter(date => weekday(visual, date) === p.day);
        return String(dates[p.occurrence - 1] + p.offset);
      }
      let days = 0;
      for (let date = p.from + 1; date <= p.to; date++) if (![0, 6].includes(weekday(visual, date)) && date !== p.holiday) days++;
      return String(days);
    }
    case 'coin-value':
      return String(sum(model(question, 'coins').coins));
    case 'shopping-pair': {
      const { items } = model(question, 'shop');
      return String(items[p.first].price * p.quantity + items[p.second].price);
    }
    case 'shopping-change': {
      const { items } = model(question, 'shop');
      return String(p.paid - items[0].price * (p.quantity - p.removed) - items[1].price * p.badges - p.fee);
    }
    case 'shopping-budget': {
      const { items } = model(question, 'shop');
      const options = optionModels(question, 'bundle', visual => bundleKey(visual.counts));
      const valid = options.filter(visual => sum(visual.counts) === p.totalItems && visual.counts.every(amount => amount > 0))
        .map(visual => ({ key: bundleKey(visual.counts), cost: sum(visual.counts.map((amount, index) => amount * items[index].price)) + p.fee }))
        .filter(bundle => bundle.cost <= p.budget).sort((a, b) => b.cost - a.cost);
      if (!valid.length || valid[0].cost === valid[1]?.cost) throw new Error('The budget must select one best permitted pack.');
      return valid[0].key;
    }
    case 'pictograph':
    case 'chart-compare':
    case 'chart-update':
    case 'graph-parts': {
      const values = chartValues(model(question, 'chart'));
      if (question.family === 'pictograph') return String(values[p.a] + (p.combine ? values[p.b] : 0));
      if (question.family === 'chart-compare') return String(Math.abs(values[p.a] - values[p.b]));
      if (question.family === 'chart-update') return String(Math.abs(values[p.a] - p.transfer - values[p.b] - p.transfer - p.extra));
      return String(Math.abs(values[0] + values[2] - p.removed - values[1] - values[3] - p.added));
    }
    default: throw new Error(`Unknown everyday answer model: ${question.family}`);
  }
}

function drawRow(items, y, { numbered = false, left = 12, width = 336, size = 34 } = {}) {
  const columns = Math.min(8, items.length);
  const cell = Math.min(48, width / columns);
  return items.map((item, index) => {
    const x = left + (index % columns) * cell + (cell - size) / 2;
    const yy = y + Math.floor(index / columns) * (numbered ? 65 : 49);
    return (item ? icon(item.shape, x, yy, size, GREEN, item.mark) : text(x + size / 2, yy + 29, '?', { size: 30 }))
      + (numbered ? text(x + size / 2, yy + 53, index + 1, { size: 14 }) : '');
  }).join('');
}

function drawSolid(name, x = 100, y = 20, size = 140) {
  const drawings = {
    sphere: circle(80, 80, 56, { fill: '#a4cbb9' }) + path('M24 80Q80 108 136 80', { strokeWidth: 2 }) + path('M80 24Q116 80 80 136', { strokeWidth: 1 }),
    cylinder: rect(25, 38, 110, 84, { fill: '#a4cbb9', strokeWidth: 0 }) + path('M25 38V122C25 146 135 146 135 122V38', { fill: '#a4cbb9' }) + path('M25 38C25 14 135 14 135 38C135 62 25 62 25 38Z', { fill: '#d8eadc' }),
    cone: path('M25 126 80 20 135 126C135 150 25 150 25 126Z', { fill: '#a4cbb9' }) + path('M25 126C25 102 135 102 135 126', { strokeWidth: 1 }),
    cube: path('M30 51 80 23 130 51 130 109 80 137 30 109Z', { fill: '#a4cbb9' }) + path('M30 51 80 80 130 51M80 80V137', { strokeWidth: 2 }),
  };
  if (!drawings[name]) throw new Error(`Unknown solid artwork: ${name}`);
  return `<g transform="translate(${x} ${y}) scale(${size / 160})">${drawings[name]}</g>`;
}

export function renderEveryday(visual) {
  if (!visual?.kind?.startsWith('v2-everyday-')) throw new Error('Unsupported everyday diagram.');
  const type = visual.kind.slice('v2-everyday-'.length);
  let body = '';
  let height = 220;
  switch (type) {
    case 'symbol':
      body = icon(visual.shape, 124, 10, 112, GREEN, visual.mark); height = 134; break;
    case 'row': {
      height = Math.ceil(visual.items.length / 8) * 65 + 20;
      body = drawRow(visual.items, 10, { numbered: true }); break;
    }
    case 'collections': {
      let y = 22;
      for (const group of visual.groups) {
        body += text(12, y, group.label, { anchor: 'start', size: 18 });
        const rows = Math.ceil(group.items.length / 8);
        body += drawRow(group.items, y + 12);
        y += 28 + rows * 49;
        if (group.change) { body += text(12, y, `${Math.abs(group.change)} ${group.change > 0 ? 'join' : 'leave'}`, { anchor: 'start', size: 18 }); y += 27; }
        y += 12;
      }
      height = y; break;
    }
    case 'analogy': {
      body = text(16, 24, 'A', { size: 18 }) + drawRow(visual.first, 38, { left: 32, width: 126, size: 31 })
        + text(180, 63, '->', { size: 22 }) + text(210, 24, 'B', { size: 18 }) + drawRow(visual.second, 38, { left: 224, width: 126, size: 31 })
        + text(16, 122, 'C', { size: 18 }) + drawRow(visual.third, 136, { left: 32, width: 126, size: 31 })
        + text(180, 161, '->', { size: 22 }) + text(276, 166, '?', { size: 36 });
      height = 192; break;
    }
    case 'scene': {
      body = visual.vehicles.map((vehicle, index) => {
        const y = 10 + index * 110;
        return rect(68, y + 18, 185, 53, { fill: '#add0b9', rx: 2 })
          + path(`M253 ${y + 18} 310 ${y + 71}H253Z`, { fill: '#e9bd77' })
          + Array.from({ length: vehicle.windows }, (_, i) => circle(94 + i * 51, y + 43, 14, { fill: PAPER })).join('')
          + circle(106, y + 79, 17, { fill: '#68788a' }) + circle(228, y + 79, 17, { fill: '#68788a' });
      }).join('');
      height = visual.vehicles.length * 110 + 10; break;
    }
    case 'property-figures':
      body = text(91, 28, 'A: Rectangle', { size: 18 }) + rect(18, 62, 153, 86, { fill: '#b3d3bc' })
        + text(93, 54, `${visual.width} cm`, { size: 19 }) + text(94, 177, `${visual.height} cm wide`, { size: 18 })
        + text(267, 28, 'B: Square', { size: 18 }) + rect(216, 62, 103, 103, { fill: '#f0d2a0' })
        + text(269, 54, `${visual.side} cm`, { size: 19 }) + text(180, 215, 'Figures are not to scale', { size: 16 });
      height = 233; break;
    case 'solid':
      body = drawSolid(visual.solid); height = 175; break;
    case 'ruler': {
      const x = index => 20 + index * 320 / visual.divisions;
      body = rect(18, 110, 324, 55, { fill: '#f2dfa9', strokeWidth: 1 });
      for (let index = 0; index <= visual.divisions; index++) {
        body += line(x(index), 110, x(index), 125) + text(x(index), 151, index * visual.step, { size: 16 });
      }
      body += rect(x(visual.start), 50, x(visual.end) - x(visual.start), 30, { fill: '#a5cbb7', rx: 3 })
        + line(x(visual.start), 80, x(visual.start), 110, { dash: '4 3' }) + line(x(visual.end), 80, x(visual.end), 110, { dash: '4 3' })
        + text(180, 194, visual.unit, { size: 20 });
      height = 215; break;
    }
    case 'container':
    case 'thermometer': {
      const bottom = 234;
      const step = 23;
      const top = bottom - visual.divisions * step;
      body = rect(85, top, 108, bottom - top, { fill: PAPER, strokeWidth: 3 })
        + rect(88, bottom - visual.fillIndex * step, 102, visual.fillIndex * step - 2, { fill: '#a6d7ce', strokeWidth: 0 });
      for (let index = 0; index <= visual.divisions; index++) {
        const y = bottom - index * step;
        body += line(178, y, 204, y) + (index % 2 === 0 ? text(216, y + 6, visual.min + index * visual.interval, { anchor: 'start', size: 19 }) : '');
      }
      body += line(77, bottom - visual.fillIndex * step, 193, bottom - visual.fillIndex * step, { stroke: '#256c66', width: 3 })
        + text(180, 29, type === 'thermometer' ? 'Thermometer' : 'Measuring container', { size: 18 })
        + text(275, 154, visual.unit, { size: 20 });
      height = 258; break;
    }
    case 'balance': {
      body = path('M180 61 154 166H206Z', { fill: '#b3c5c4' }) + line(42, 59, 318, 59, { width: 5 })
        + path('M40 112Q87 164 134 112Z', { fill: '#d9e6dc' }) + path('M226 112Q273 164 320 112Z', { fill: '#d9e6dc' })
        + line(42, 59, 40, 112) + line(134, 59, 134, 112) + line(226, 59, 226, 112) + line(318, 59, 320, 112)
        + text(87, 96, `${sum(visual.left)} ${visual.unit}`, { size: 19 })
        + text(273, 37, `${sum(visual.right)} ${visual.unit}`, { size: 18 });
      for (let i = 0; i < visual.unknowns; i++) {
        const x = 232 + i * (82 / visual.unknowns);
        body += rect(x, 77, 72 / visual.unknowns, 30, { fill: '#f5d49b', rx: 2 }) + text(x + 36 / visual.unknowns, 99, '?', { size: 21 });
      }
      body += text(180, 197, 'Both sides have equal mass', { size: 18 });
      height = 219; break;
    }
    case 'linked-balances': {
      const box = (letter, x, y) => rect(x, y, 25, 25, { fill: letter === 'A' ? '#c7e4d6' : '#f5d49b' })
        + text(x + 12.5, y + 20, letter, { size: 18 });
      const pan = (y, left, right) => line(30, y + 32, 330, y + 32, { width: 4 })
        + path(`M180 ${y + 32} 161 ${y + 133}H199Z`, { fill: '#b3c5c4' })
        + path(`M32 ${y + 90}Q89 ${y + 137} 146 ${y + 90}Z`, { fill: '#d9e6dc' })
        + path(`M214 ${y + 90}Q271 ${y + 137} 328 ${y + 90}Z`, { fill: '#d9e6dc' })
        + line(32, y + 32, 32, y + 90) + line(146, y + 32, 146, y + 90)
        + line(214, y + 32, 214, y + 90) + line(328, y + 32, 328, y + 90)
        + left + text(271, y + 78, `${right} g`, { size: 21 });
      const first = Array.from({ length: visual.aCount }, (_, index) => box('A', 41 + index * 27, 68)).join('')
        + text(89, 60, `+ ${visual.known} g`, { size: 18 });
      const second = Array.from({ length: visual.bCount }, (_, index) => box('B', 40 + index * 25, 234)).join('')
        + box('A', 115, 234);
      body = pan(12, first, visual.first) + pan(178, second, visual.second)
        + text(180, 351, 'Same letter = same box mass', { size: 18 });
      height = 373; break;
    }
    case 'measures':
      body = visual.rows.map((row, index) => text(22, 45 + index * 57, row.label, { anchor: 'start', size: 20 })
        + text(334, 45 + index * 57, `${row.value} ${row.unit}${row.extra !== undefined ? ` ${row.extra} ${row.extraUnit}` : ''}`, { anchor: 'end', size: 22 })
        + line(20, 61 + index * 57, 338, 61 + index * 57, { stroke: '#bdcdbd', width: 1 })).join('');
      height = visual.rows.length * 57 + 25; break;
    case 'clock':
      body = clockFace(visual.minutes, 180, 112, 98); height = 224; break;
    case 'calendar': {
      const first = weekday(visual, 1);
      const month = new Date(Date.UTC(visual.year, visual.month, 1)).toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
      body = text(180, 28, `${month} ${visual.year}`, { size: 23 });
      WEEKDAYS.forEach((day, index) => { body += text(34 + index * 48, 65, day, { size: 17 }); });
      for (let date = 1; date <= calendarDays(visual); date++) {
        const slot = first + date - 1;
        body += text(34 + (slot % 7) * 48, 105 + Math.floor(slot / 7) * 37, date, { size: 20 });
      }
      height = 120 + Math.floor((first + calendarDays(visual) - 1) / 7) * 37; break;
    }
    case 'coins': {
      body = visual.coins.map((value, index) => {
        const x = 53 + (index % 4) * 83;
        const y = 47 + Math.floor(index / 4) * 87;
        return circle(x, y, 32, { fill: '#efd09a' }) + circle(x, y, 27, { fill: 'none', stroke: '#997b4f', strokeWidth: 1 })
          + text(x, y - 4, 'Rs', { size: 13 }) + text(x, y + 17, value, { size: 23 });
      }).join('');
      height = Math.ceil(visual.coins.length / 4) * 87 + 6; break;
    }
    case 'shop':
      body = text(180, 27, 'SUPPLY PRICES', { size: 19 }) + visual.items.map((item, index) =>
        icon(item.symbol, 22, 48 + index * 57, 34) + text(76, 74 + index * 57, item.name, { anchor: 'start', size: 21 })
        + text(328, 74 + index * 57, `Rs ${item.price}`, { anchor: 'end', size: 22 })
        + line(20, 94 + index * 57, 338, 94 + index * 57, { stroke: '#c2cebd', width: 1 })).join('');
      height = visual.items.length * 57 + 50; break;
    case 'bundle': {
      let y = 24;
      visual.items.forEach((item, index) => {
        body += text(12, y, `${item.name}s: ${visual.counts[index]}`, { anchor: 'start', size: 19 });
        if (visual.counts[index]) body += drawRow(symbols(item.shape, visual.counts[index]), y + 12, { size: 30 });
        y += 77;
      });
      height = y; break;
    }
    case 'chart':
      return renderChart(visual);
    default: throw new Error(`Unsupported everyday diagram kind: ${visual.kind}`);
  }
  return svg(body, visual.description, 360, height);
}

function renderChart(visual) {
  let body = '';
  if (visual.format === 'pictograph') {
    body = icon('star', 20, 5, 28) + text(61, 28, `= ${visual.scale} samples`, { anchor: 'start', size: 20 });
    visual.rows.forEach((row, index) => {
      const y = 61 + index * 51;
      body += text(12, y + 21, row.label, { anchor: 'start', size: 18 });
      body += symbols('star', row.marks).map((item, i) => icon(item.shape, 89 + i * 28, y, 25)).join('');
    });
    return svg(body, visual.description, 360, visual.rows.length * 51 + 58);
  }
  const maximum = Math.max(...visual.rows.map(row => row.marks)) + 1;
  const left = 56;
  const bottom = 231;
  const top = 36;
  const x = index => 91 + index * (236 / (visual.rows.length - 1));
  const y = marks => bottom - marks * (bottom - top) / maximum;
  for (let mark = 0; mark <= maximum; mark++) {
    body += line(left, y(mark), 345, y(mark), { stroke: '#c5d0bf', width: 1 })
      + text(47, y(mark) + 5, mark * visual.scale, { anchor: 'end', size: 15 });
  }
  body += text(56, 20, 'Samples', { anchor: 'start', size: 17 }) + line(left, top, left, bottom) + line(left, bottom, 345, bottom);
  if (visual.format === 'line') {
    body += path(visual.rows.map((row, index) => `${index ? 'L' : 'M'}${x(index)} ${y(row.marks)}`).join(' '), { stroke: GREEN, strokeWidth: 3 });
  }
  visual.rows.forEach((row, index) => {
    body += visual.format === 'line' ? circle(x(index), y(row.marks), 5, { fill: GREEN })
      : rect(x(index) - 17, y(row.marks), 34, bottom - y(row.marks), { fill: GREEN, strokeWidth: 1 });
    body += text(x(index), bottom + 28, row.label, { size: 16 });
  });
  return svg(body, visual.description, 360, 280);
}
