import { QuestionRetry, wrong } from './bank-shared.mjs';
import {
  DAYS, addMinutes, biased, clockLabel, hook, matchPictures, pictureChoices, q, rs, textChoices,
} from './bank3-class-3-helpers.mjs';

const CREW = ['Mira', 'Arun', 'Zara', 'Omar', 'Tara', 'Anya', 'Isha', 'Priya', 'Kabir', 'Meera', 'Rohan', 'Kiran'];
const SITES = ['Apples', 'Mangoes', 'Bananas', 'Grapes', 'Pears', 'Oranges'];
const GOODS = ['Map', 'Lamp', 'Rope', 'Bell', 'Cup', 'Flag'];
const WORDS = ['CAT', 'DOG', 'SUN', 'MAP', 'BOX', 'NET', 'HOP', 'JAM', 'RUG', 'TIP', 'WEB', 'LOG', 'KEY', 'PAD', 'FUN', 'SKY', 'OWL', 'RED', 'BIG', 'CUP'];
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left', center: 'far', far: 'center' };
const DIRS = { N: [0, 1], E: [1, 0], S: [0, -1], W: [-1, 0] };

function pack(spec) {
  const prompt = String(spec.prompt);
  if (prompt.length > 190 || prompt.trim().split(/\s+/).length > 34) throw new QuestionRetry('prompt');
  try {
    return q(spec);
  } catch (error) {
    if (error instanceof QuestionRetry) throw error;
    if (/^(LONG|HINT|SHORT)/.test(error.message)) throw new QuestionRetry(error.message);
    throw error;
  }
}

function said(answer, pairs) {
  const options = [String(answer), ...pairs.map(([value]) => String(value))];
  const lengths = options.map(value => value.length);
  if (new Set(options).size !== options.length || Math.max(...lengths) - Math.min(...lengths) >= 3) throw new QuestionRetry('option length');
  return textChoices(answer, pairs.map(([value, code]) => wrong(value, code)));
}

function rupees(r, answer, named, bounds = {}) {
  return biased(r, answer, named, { min: 10, max: 999, ...bounds }).map(choice => ({ ...choice, value: rs(Number(choice.value)) }));
}

function pairName(left, right) {
  return [left, right].sort().join(' and ');
}

function digitSum(value) {
  return [...String(value)].reduce((sum, digit) => sum + Number(digit), 0);
}

function perimeter(cells) {
  const set = new Set(cells.map(([row, col]) => `${row},${col}`));
  let edges = 0;
  for (const [row, col] of cells) {
    for (const [dRow, dCol] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!set.has(`${row + dRow},${col + dCol}`)) edges++;
    }
  }
  return edges;
}

function rectCells(rows, cols) {
  const cells = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) cells.push([row, col]);
  return cells;
}

function polyFits(cells) {
  const maxRow = Math.max(...cells.map(cell => cell[0]));
  const maxCol = Math.max(...cells.map(cell => cell[1]));
  return maxRow <= 4 && maxCol <= 8;
}

export function countPaths(width, height, blocked = []) {
  const block = new Set(blocked.map(cell => `${cell[0]},${cell[1]}`));
  if (block.has('0,0') || block.has(`${width},${height}`)) return 0;
  const ways = Array.from({ length: width + 1 }, () => Array(height + 1).fill(0));
  ways[0][0] = 1;
  for (let x = 0; x <= width; x++) {
    for (let y = 0; y <= height; y++) {
      if (block.has(`${x},${y}`)) {
        ways[x][y] = 0;
        continue;
      }
      if (x || y) ways[x][y] = (x ? ways[x - 1][y] : 0) + (y ? ways[x][y - 1] : 0);
    }
  }
  return ways[width][height];
}

function angleType(degrees) {
  if (degrees < 90) return 'Acute angle';
  if (degrees === 90) return 'Right angle';
  return 'Obtuse angle';
}

function draftAngle(family, grade, level, r) {
  const countFigure = level === 2 && r.int(0, 2) === 0;
  if (countFigure) {
    const figure = r.pick(['rect', 'triangle']);
    const answer = figure === 'rect' ? '4 square corners' : '1 square corner';
    return pack({
      family,
      prompt: figure === 'rect' ? 'How many square corners does this rectangle have?' : 'How many square corners does this triangle show?',
      answer,
      hint: 'A square corner matches the corner of a book or a tile.',
      explanation: figure === 'rect' ? 'A rectangle has 4 square corners.' : 'The square mark shows 1 square corner.',
      givens: { ask: 'count' },
      visual: {
        kind: 'v3-class-3-angle', figure, degrees: 90,
        description: figure === 'rect'
          ? 'A rectangle drawn in blue. Every corner is a square corner.'
          : 'A right triangle with a small square mark at the square corner.',
      },
      choices: said(answer, [
        [figure === 'rect' ? '2 square corners' : '2 square corners', 'class-3-angle-size'],
        ['3 square corners', 'angle-relation'],
        [figure === 'rect' ? '1 square corner' : '4 square corners', 'missing-step'],
      ]),
    });
  }
  const degrees = r.pick([20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150]);
  const facing = r.pick(['right', 'left']);
  const answer = angleType(degrees);
  return pack({
    family,
    prompt: r.pick(['What kind of angle is marked?', 'Which name matches the marked angle?', 'Is the marked angle acute, right or obtuse?', 'Compare the marked angle with a square corner. What kind of angle is it?']),
    answer,
    hint: 'Compare the opening with a square corner. Smaller, the same, or wider.',
    explanation: degrees === 90 ? 'The opening is a square corner, so it is a right angle.' : `${degrees} degrees is ${answer.toLowerCase()}.`,
    givens: { ask: 'type' },
    visual: {
      kind: 'v3-class-3-angle', figure: 'open', degrees, facing,
      description: `An open angle of ${degrees} degrees. One ray lies flat and the other ray opens up from the ${facing === 'left' ? 'right' : 'left'} endpoint.`,
    },
    choices: said(answer, [
      [answer === 'Acute angle' ? 'Obtuse angle' : 'Acute angle', 'class-3-angle-size'],
      [answer === 'Right angle' ? 'Obtuse angle' : 'Right angle', 'angle-relation'],
      ['A flat line', 'wrong-transform'],
    ]),
  });
}

function solveAngle(question) {
  const visual = question.visual;
  if (question.proof.givens.ask === 'count') return visual.figure === 'rect' ? '4 square corners' : '1 square corner';
  if (visual.figure !== 'open' || !Number.isInteger(visual.degrees)) throw new Error('angle');
  return angleType(visual.degrees);
}

function badgeModel(visual) {
  return { roof: visual.roof, window: visual.window, star: visual.star, flip: visual.flip, tone: visual.tone };
}

function badgeKey(model) {
  return `roof ${model.roof}, window ${model.window}, star ${model.star}, flip ${model.flip}`;
}

function badgeVisual(model, compact) {
  return {
    kind: 'v3-class-3-badge', compact, ...model,
    description: `House badge with roof peak ${model.roof}, round window ${model.window}, star ${model.star}, and flip ${model.flip}.`,
  };
}

const BADGE_WALLS = [
  { tone: '#d7ebf5', colour: 'blue' },
  { tone: '#f6c9b8', colour: 'peach' },
  { tone: '#cfe8c8', colour: 'green' },
  { tone: '#e1d6f2', colour: 'lilac' },
  { tone: '#f7e29a', colour: 'yellow' },
];

function draftMirror(family, grade, level, r) {
  const wall = r.pick(BADGE_WALLS);
  const model = {
    roof: r.pick(['left', 'right']),
    window: r.pick(['left', 'right']),
    star: level === 1 ? 'left' : r.pick(['left', 'right']),
    flip: 'none',
    tone: wall.tone,
  };
  const correct = { ...model, flip: 'x' };
  const alts = [
    { ...model, flip: 'none', code: 'wrong-transform' },
    { ...model, flip: 'y', code: 'wrong-transform' },
    { ...model, star: model.star === 'left' ? 'right' : 'left', flip: 'none', code: 'ignored-condition' },
  ];
  if (new Set([badgeKey(correct), ...alts.map(badgeKey)]).size < 4) throw new QuestionRetry('badge');
  return pack({
    family,
    prompt: hook(r, r.pick(['Which picture is the left-right mirror of this badge?', 'Which picture flips this badge across a vertical mirror?'])),
    answer: badgeKey(correct),
    hint: 'A vertical mirror swaps left and right. It does not turn the badge upside down.',
    explanation: 'The mirror swaps the roof, window and star from left to right.',
    givens: { flip: 'x' },
    visual: {
      ...badgeVisual(model, false),
      description: `House badge facing forward. Roof peak ${model.roof}, round window ${model.window}, star ${model.star}.`,
    },
    choices: pictureChoices(badgeKey(correct), badgeVisual(correct, true), alts.map(item => wrong(badgeKey(item), item.code, badgeVisual(item, true)))),
  });
}

function solveMirror(question) {
  matchPictures(question, badgeKey);
  const source = badgeModel(question.visual);
  const wanted = badgeKey({ ...source, flip: 'x' });
  if (!question.options.includes(wanted)) throw new Error('mirror');
  return wanted;
}

const CELL_TONES = [
  { colour: 'teal', tone: '#2f7d78' },
  { colour: 'coral', tone: '#d16b4f' },
  { colour: 'purple', tone: '#8d79b8' },
  { colour: 'green', tone: '#4f9a4f' },
  { colour: 'blue', tone: '#3a6ea5' },
];

function hasHole(cells) {
  const set = new Set(cells.map(([row, col]) => `${row},${col}`));
  const maxRow = Math.max(...cells.map(cell => cell[0])) + 1;
  const maxCol = Math.max(...cells.map(cell => cell[1])) + 1;
  const outside = new Set(['-1,-1']);
  const queue = [[-1, -1]];
  while (queue.length) {
    const [row, col] = queue.pop();
    for (const [dRow, dCol] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = row + dRow;
      const nc = col + dCol;
      const key = `${nr},${nc}`;
      if (nr < -1 || nc < -1 || nr > maxRow || nc > maxCol || set.has(key) || outside.has(key)) continue;
      outside.add(key);
      queue.push([nr, nc]);
    }
  }
  return (maxRow + 2) * (maxCol + 2) - set.size !== outside.size;
}

// Grows a connected shape one square at a time, so every grid is a different picture.
function growCells(r, size) {
  let cells = [[0, 0]];
  while (cells.length < size) {
    const [row, col] = r.pick(cells);
    const [dRow, dCol] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    const next = [row + dRow, col + dCol];
    if (next[0] < -3 || next[0] > 3 || next[1] < -5 || next[1] > 5 || cells.some(cell => cell[0] === next[0] && cell[1] === next[1])) continue;
    cells.push(next);
  }
  const minRow = Math.min(...cells.map(cell => cell[0]));
  const minCol = Math.min(...cells.map(cell => cell[1]));
  cells = cells.map(([row, col]) => [row - minRow, col - minCol]);
  return cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function draftGrid(family, grade, level, r) {
  const rectangle = level === 2 && r.int(0, 2) === 0;
  const cells = rectangle ? rectCells(r.int(1, 3), r.int(2, 5)) : growCells(r, level === 1 ? r.int(3, 8) : level === 2 ? r.int(4, 7) : r.int(5, 9));
  if (!polyFits(cells) || cells.length < 2 || hasHole(cells)) throw new QuestionRetry('poly');
  const area = cells.length;
  const outside = perimeter(cells);
  const ask = level === 1 ? 'area' : 'perimeter';
  const answer = ask === 'area' ? area : outside;
  const paint = r.pick(CELL_TONES);
  const listed = cells.map(([row, col]) => `row ${row + 1} column ${col + 1}`).join(', ');
  return pack({
    family,
    prompt: ask === 'area' ? `How many ${paint.colour} squares are filled?` : `How many outer edges does the ${paint.colour} shape have?`,
    answer,
    hint: ask === 'area' ? 'Count each filled square once.' : 'Count only the edges that touch the outside, not shared edges.',
    explanation: ask === 'area' ? `There are ${area} filled squares.` : `The shape has ${outside} outer edges.`,
    givens: { ask },
    visual: {
      kind: 'v3-class-3-poly', cells, tone: paint.tone,
      description: `${paint.colour[0].toUpperCase()}${paint.colour.slice(1)} squares on a grid at ${listed}.`,
    },
    choices: biased(r, answer, [
      { value: ask === 'area' ? outside : area, code: 'class-3-grid-count' },
      { value: answer + 1, code: 'internal-edges' },
      { value: Math.max(1, answer - 1), code: 'missing-step' },
      { value: area + outside, code: 'area-perimeter' },
    ], { min: 1, max: 80 }),
  });
}

function solveGrid(question) {
  const cells = question.visual.cells;
  if (!Array.isArray(cells) || cells.length < 2) throw new Error('poly');
  return question.proof.givens.ask === 'area' ? cells.length : perimeter(cells);
}

const SHAPE_INFO = {
  circle: { sides: 0, name: 'circle' },
  triangle: { sides: 3, name: 'triangle' },
  square: { sides: 4, name: 'square' },
  rectangle: { sides: 4, name: 'rectangle' },
  pentagon: { sides: 5, name: 'pentagon' },
  hexagon: { sides: 6, name: 'hexagon' },
  octagon: { sides: 8, name: 'octagon' },
};

const SHAPE_STEPS = [
  { base: 'square', diff: 1, target: 'pentagon' },
  { base: 'square', diff: 2, target: 'hexagon' },
  { base: 'square', diff: 4, target: 'octagon' },
  { base: 'square', diff: -1, target: 'triangle' },
  { base: 'pentagon', diff: 3, target: 'octagon' },
  { base: 'triangle', diff: 2, target: 'pentagon' },
  { base: 'triangle', diff: 3, target: 'hexagon' },
  { base: 'hexagon', diff: 2, target: 'octagon' },
];

function stepText(step) {
  const n = Math.abs(step.diff);
  return `${n} ${step.diff > 0 ? 'more' : 'fewer'} ${n === 1 ? 'side' : 'sides'} than a ${step.base}`;
}

function shapeVisual(shape) {
  const info = SHAPE_INFO[shape];
  return {
    kind: 'v3-class-3-shape', shape,
    description: info.sides ? `${/^[aeiou]/.test(info.name) ? 'An' : 'A'} ${info.name} with ${info.sides} straight sides.` : 'A circle with a curved edge and no corners.',
  };
}

function draftShape(family, grade, level, r) {
  const ask = r.pick(['sides', 'corners', 'equal', 'long', 'most', 'fewest', 'curved', 'compare', 'compare']);
  const names = Object.keys(SHAPE_INFO);
  const sides = r.pick([0, 3, 5, 6, 8]);
  const step = r.pick(SHAPE_STEPS);
  let correct;
  let picked;
  if (ask === 'compare') {
    correct = step.target;
    picked = r.shuffle(names.filter(shape => shape !== correct && shape !== step.base)).slice(0, 3);
  } else if (ask === 'most' || ask === 'fewest') {
    const set = r.shuffle(ask === 'fewest' ? names.filter(shape => shape !== 'circle') : names).slice(0, 4);
    const counts = set.map(shape => SHAPE_INFO[shape].sides);
    const hits = set.filter(shape => SHAPE_INFO[shape].sides === (ask === 'most' ? Math.max(...counts) : Math.min(...counts)));
    if (hits.length !== 1) throw new QuestionRetry('shape');
    correct = hits[0];
    picked = set.filter(shape => shape !== correct);
  } else {
    correct = ask === 'long' ? 'rectangle' : ask === 'equal' ? 'square' : ask === 'curved' ? 'circle' : names.find(shape => SHAPE_INFO[shape].sides === sides && shape !== 'rectangle');
    picked = r.shuffle(names.filter(shape => shape !== correct)).slice(0, 3);
    if (ask === 'long' && !picked.includes('square')) picked[0] = 'square';
    if (ask === 'equal' && !picked.includes('rectangle')) picked[0] = 'rectangle';
  }
  const alts = picked.map((shape, index) => wrong(shape, index === 0 ? 'wrong-transform' : 'ignored-condition', shapeVisual(shape)));
  const count = sides ? `exactly ${sides}` : 'no';
  const prompts = {
    sides: `Which picture has ${count} straight sides?`,
    corners: `Which picture has ${count} corners?`,
    equal: 'Which picture has 4 sides that are all equal?',
    long: 'Which picture has 4 sides and is longer than it is tall?',
    most: 'Which picture has the most straight sides?',
    fewest: 'Which picture has the fewest straight sides?',
    curved: 'Which picture has a curved edge?',
    compare: `Which picture has ${stepText(step)}?`,
  };
  const explanations = {
    sides: sides ? `The ${correct} has ${sides} straight sides.` : 'The circle has a curved edge and no straight sides.',
    corners: sides ? `The ${correct} has ${sides} corners.` : 'The circle is round, so it has no corners.',
    equal: 'The square has 4 sides that are all the same length.',
    long: 'The rectangle has 4 sides and is longer than it is tall.',
    most: `The ${correct} has ${SHAPE_INFO[correct].sides} sides, more than the others.`,
    fewest: `The ${correct} has ${SHAPE_INFO[correct].sides} sides, fewer than the others.`,
    curved: 'The circle is round with a curved edge. The other pictures have only straight sides.',
    compare: `A ${step.base} has ${SHAPE_INFO[step.base].sides} sides. ${SHAPE_INFO[step.base].sides} ${step.diff > 0 ? '+' : '-'} ${Math.abs(step.diff)} = ${SHAPE_INFO[step.target].sides}, so it is the ${correct}.`,
  };
  return pack({
    family,
    prompt: prompts[ask],
    answer: correct,
    hint: ask === 'corners' ? 'A corner is where two straight sides meet. Round shapes have none.' : 'Count straight sides. A curved edge is not a straight side.',
    explanation: explanations[ask],
    givens: { ask, sides, base: step.base, diff: step.diff, shown: [correct, ...picked].sort() },
    choices: pictureChoices(correct, shapeVisual(correct), alts),
  });
}

function solveShape(question) {
  matchPictures(question, visual => visual.shape);
  const { ask, sides, base, diff } = question.proof.givens;
  const counts = question.optionVisuals.map(visual => SHAPE_INFO[visual.shape].sides);
  const fits = {
    sides: visual => SHAPE_INFO[visual.shape].sides === sides && visual.shape !== 'rectangle',
    corners: visual => SHAPE_INFO[visual.shape].sides === sides && visual.shape !== 'rectangle',
    equal: visual => visual.shape === 'square',
    long: visual => visual.shape === 'rectangle',
    most: visual => SHAPE_INFO[visual.shape].sides === Math.max(...counts),
    fewest: visual => SHAPE_INFO[visual.shape].sides === Math.min(...counts),
    curved: visual => visual.shape === 'circle',
    compare: visual => SHAPE_INFO[visual.shape].sides === SHAPE_INFO[base].sides + diff,
  };
  const hits = question.optionVisuals.filter(fits[ask]);
  if (hits.length !== 1) throw new Error('shape');
  return hits[0].shape;
}

function draftTower(family, grade, level, r) {
  const heights = Array.from({ length: r.int(3, 5) }, () => r.int(1, 6));
  const total = heights.reduce((sum, height) => sum + height, 0);
  const tallest = Math.max(...heights);
  const hidden = total - heights.length;
  const ask = level === 1 ? 'tallest' : level === 2 ? 'total' : 'hidden';
  const answer = ask === 'tallest' ? tallest : ask === 'total' ? total : hidden;
  const prompt = ask === 'tallest'
    ? 'How many cubes are in the tallest stack?'
    : ask === 'total'
      ? 'How many cubes are used in all the stacks?'
      : 'How many cubes are hidden under the top cube of each stack?';
  return pack({
    family,
    prompt: hook(r, prompt),
    answer,
    hint: 'Count every cube in a stack, including cubes hidden underneath.',
    explanation: ask === 'tallest' ? `The tallest stack has ${tallest} cubes.` : `The stacks use ${total} cubes.`,
    givens: { ask },
    visual: {
      kind: 'v3-class-3-towers', heights,
      description: `Cube stacks from left to right: ${heights.join(', ')} cubes.`,
    },
    choices: biased(r, answer, [
      { value: ask === 'total' ? heights.length : total, code: 'class-3-tower-stack' },
      { value: tallest, code: 'missing-dimension' },
      { value: hidden, code: 'ignored-condition' },
      { value: answer + 1, code: 'missing-step' },
    ], { min: 1, max: 40 }),
  });
}

function solveTower(question) {
  const heights = question.visual.heights;
  if (!Array.isArray(heights) || heights.some(height => height < 1)) throw new Error('towers');
  const total = heights.reduce((sum, height) => sum + height, 0);
  const ask = question.proof.givens.ask;
  if (ask === 'tallest') return Math.max(...heights);
  if (ask === 'total') return total;
  if (ask === 'hidden') return total - heights.length;
  throw new Error('towers');
}

function draftNet(family, grade, level, r) {
  const letters = r.shuffle(['A', 'B', 'C', 'D', 'E', 'F']);
  const names = ['top', 'left', 'center', 'right', 'far', 'bottom'];
  const labels = Object.fromEntries(names.map((name, index) => [name, letters[index]]));
  const mark = level === 1 ? 'top' : level === 2 ? r.pick(['left', 'right']) : r.pick(['center', 'far']);
  const answer = labels[OPPOSITE[mark]];
  const wrongs = names.filter(name => labels[name] !== answer).slice(0, 3).map((name, index) => [labels[name], index === 0 ? 'opposite-faces' : 'wrong-transform']);
  return pack({
    family,
    prompt: hook(r, `Face ${labels[mark]} is gold with a dot. Which letter is opposite it when folded?`),
    answer,
    hint: 'In this cross net, top faces bottom, left faces right, and the centre faces the far end.',
    explanation: `${labels[mark]} is opposite ${answer} on this net.`,
    givens: { mark },
    visual: {
      kind: 'v3-class-3-net', labels, mark,
      description: `Cube net. Top ${labels.top}, left ${labels.left}, centre ${labels.center}, right ${labels.right}, far ${labels.far}, bottom ${labels.bottom}. ${labels[mark]} is marked.`,
    },
    choices: said(answer, wrongs),
  });
}

function solveNet(question) {
  const { labels, mark } = question.visual;
  if (!OPPOSITE[mark] || !labels?.[OPPOSITE[mark]]) throw new Error('net');
  return labels[OPPOSITE[mark]];
}

const RULER_THINGS = [
  { name: 'teal bar', tone: '#2f7d78', colour: 'teal' },
  { name: 'coral ribbon', tone: '#d16b4f', colour: 'coral' },
  { name: 'gold strip', tone: '#e0b14a', colour: 'gold' },
  { name: 'purple stick', tone: '#8d79b8', colour: 'purple' },
  { name: 'green leaf strip', tone: '#4f9a4f', colour: 'green' },
];

function draftRuler(family, grade, level, r) {
  const start = level === 1 ? 0 : r.int(0, 6);
  const length = level === 1 ? r.int(2, 15) : r.int(3, 8);
  const end = start + length;
  const extra = level >= 3 ? r.int(1, length - 1) : 0;
  const answer = length - extra;
  const to = Math.min(16, end + (end % 2));
  const thing = r.pick(RULER_THINGS);
  return pack({
    family,
    prompt: extra ? `How many cm longer than ${extra} cm is the ${thing.name}?` : `How many centimetres long is the ${thing.name}?`,
    answer,
    hint: 'Read the start and the end of the bar, then subtract.',
    explanation: extra ? `The bar is ${length} cm. ${length} - ${extra} = ${answer}.` : `The bar runs from ${start} cm to ${end} cm, so it is ${length} cm.`,
    givens: { extra },
    visual: {
      kind: 'v3-class-3-ruler', start, end, to, tone: thing.tone,
      description: `A ruler marked in centimetres up to ${to}. The ${thing.name} starts at ${start} cm and ends at ${end} cm.`,
    },
    choices: biased(r, answer, [
      { value: end, code: 'scale-zero' },
      { value: length, code: 'missing-step' },
      { value: start, code: 'scale-interval' },
      { value: answer + 1, code: 'unit-conversion' },
    ], { min: 1, max: 30 }),
  });
}

function solveRuler(question) {
  const { start, end } = question.visual;
  if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start) throw new Error('ruler');
  return end - start - question.proof.givens.extra;
}

function draftDial(family, grade, level, r) {
  const min = level === 1 ? 0 : r.pick([0, 10, 20]);
  const step = r.pick(level === 1 ? [5, 10] : [2, 5, 10]);
  const max = min + step * r.int(4, 6);
  const value = min + step * r.int(1, (max - min) / step - 1);
  const ask = level >= 3 ? 'below' : 'read';
  const answer = ask === 'below' ? max - value : value;
  return pack({
    family,
    prompt: ask === 'below' ? 'How many degrees is the red column below the top mark?' : r.pick(['What temperature does the red column show?', 'What temperature does this thermometer read?']),
    answer,
    hint: 'Read the number beside the top of the red column.',
    explanation: ask === 'below' ? `The column is at ${value}. The top is ${max}. The gap is ${answer}.` : `The red column reaches ${value}.`,
    givens: { ask },
    visual: {
      kind: 'v3-class-3-thermo', min, max, step, value,
      description: `Thermometer from ${min} to ${max}, marked every ${step}. The red column reaches ${value}.`,
    },
    choices: biased(r, answer, [
      { value: value + step, code: 'scale-interval' },
      { value: Math.max(min, value - step), code: 'scale-zero' },
      { value: ask === 'below' ? value : max - value, code: 'unit-conversion' },
      { value: answer + step, code: 'missing-step' },
    ], { min: 0, max: 80 }),
  });
}

function solveDial(question) {
  const { min, max, value } = question.visual;
  if (value < min || value > max) throw new Error('dial');
  return question.proof.givens.ask === 'below' ? max - value : value;
}

function draftBalance(family, grade, level, r) {
  const left = [r.int(2, level === 1 ? 12 : 8)];
  const right = [];
  if (level === 1) {
    const form = r.pick(['plain', 'swap', 'extra']);
    if (form === 'swap') {
      right.push(left[0]);
      left[0] = null;
    } else if (form === 'extra') right.push(r.int(1, left[0] - 1), null);
    else right.push(null);
  } else if (level === 2) {
    left.push(r.int(2, 6));
    right.push(null);
  } else {
    right.push(r.int(2, 5), null);
  }
  const knownLeft = left.reduce((sum, value) => sum + (value ?? 0), 0);
  const knownRight = right.filter(value => value != null).reduce((sum, value) => sum + value, 0);
  const answer = left.includes(null) ? knownRight : knownLeft - knownRight;
  if (answer < 1 || answer > 20) throw new QuestionRetry('balance');
  const grams = r.int(0, 1) === 1;
  const unit = grams ? 'g' : 'kg';
  const factor = grams ? 100 : 1;
  const label = value => (value == null ? '?' : `${value * factor} ${unit}`);
  return pack({
    family,
    prompt: `The pans balance. What is the missing mass in ${unit}?`,
    answer: answer * factor,
    hint: 'Add the masses on each pan. The two sides must match.',
    explanation: `The known masses differ by ${answer * factor} ${unit}, so the missing mass is ${answer * factor} ${unit}.`,
    givens: { ask: 'missing' },
    visual: {
      kind: 'v3-class-3-balance',
      left: left.map(label),
      right: right.map(label),
      description: `Balance scale. Left pan: ${left.map(label).join(' and ')}. Right pan: ${right.map(label).join(' and ')}.`,
    },
    choices: biased(r, answer, [
      { value: knownLeft + knownRight, code: 'balance-total' },
      { value: knownLeft, code: 'missing-step' },
      { value: answer + 1, code: 'unit-conversion' },
      { value: Math.max(1, answer - 1), code: 'ignored-condition' },
    ], { min: 1, max: 40 }).map(choice => ({ ...choice, value: Number(choice.value) * factor })),
  });
}

function solveBalance(question) {
  const read = labels => labels.reduce((sum, label) => sum + (label === '?' ? 0 : Number(label.replace(/ k?g$/, ''))), 0);
  const missing = [...question.visual.left, ...question.visual.right].filter(label => label === '?').length;
  if (missing !== 1) throw new Error('balance');
  const gap = read(question.visual.left) - read(question.visual.right);
  if (question.visual.left.includes('?')) return -gap;
  return gap;
}

const UNIT_ROWS = [
  { key: 'rover', prompt: 'Which length fits a rover?', good: '2 m', bad: ['2 cm', '2 km', '2 mm'] },
  { key: 'crate', prompt: 'Which mass fits a supply crate?', good: '4 kg', bad: ['4 g', '4 mg', '40 kg'] },
  { key: 'cup', prompt: 'Which amount fits a drinking cup?', good: '200 mL', bad: ['200 L', '2 mL', '20 L'] },
  { key: 'path', prompt: 'Which length fits a walk to the dock?', good: '300 m', bad: ['300 mm', '3 cm', '300 km'] },
  { key: 'beacon', prompt: 'Which height fits a small beacon?', good: '1 m', bad: ['1 mm', '1 km', '10 km'] },
  { key: 'pencil', prompt: 'Which length fits a new pencil?', good: '15 cm', bad: ['15 m', '15 mm', '15 km'] },
  { key: 'eraser', prompt: 'Which length fits an eraser?', good: '4 cm', bad: ['4 m', '4 km', '4 mm'] },
  { key: 'door', prompt: 'Which height fits a classroom door?', good: '2 m', bad: ['2 cm', '2 km', '2 mm'] },
  { key: 'bus', prompt: 'Which length fits a school bus?', good: '10 m', bad: ['10 cm', '10 km', '10 mm'] },
  { key: 'track', prompt: 'Which length fits one lap of a school sports track?', good: '400 m', bad: ['400 cm', '400 km', '400 mm'] },
  { key: 'ant', prompt: 'Which length fits an ant?', good: '5 mm', bad: ['5 cm', '5 m', '5 km'] },
  { key: 'pool', prompt: 'Which length fits a swimming pool?', good: '25 m', bad: ['25 cm', '25 km', '25 mm'] },
  { key: 'bat', prompt: 'Which length fits a cricket bat?', good: '85 cm', bad: ['85 m', '85 mm', '85 km'] },
  { key: 'phone', prompt: 'Which width fits a mobile phone?', good: '7 cm', bad: ['7 m', '7 mm', '7 km'] },
  { key: 'giraffe', prompt: 'Which height fits a giraffe?', good: '5 m', bad: ['5 cm', '5 mm', '5 km'] },
  { key: 'bus-ride', prompt: 'Which distance fits a bus ride to school?', good: '5 km', bad: ['5 m', '5 cm', '5 mm'] },
  { key: 'train', prompt: 'Which distance fits a train trip between two cities?', good: '500 km', bad: ['500 m', '500 cm', '500 mm'] },
  { key: 'mango', prompt: 'Which mass fits a mango?', good: '300 g', bad: ['300 kg', '30 g', '30 kg'] },
  { key: 'rice', prompt: 'Which mass fits a bag of rice from the shop?', good: '5 kg', bad: ['5 g', '5 mg', '50 kg'] },
  { key: 'feather', prompt: 'Which mass fits a feather?', good: '1 g', bad: ['1 kg', '2 kg', '10 kg'] },
  { key: 'bag', prompt: 'Which mass fits a full school bag?', good: '3 kg', bad: ['3 g', '30 kg', '3 mg'] },
  { key: 'child', prompt: 'Which mass fits an 8-year-old child?', good: '25 kg', bad: ['25 g', '250 kg', '2 kg'] },
  { key: 'apple', prompt: 'Which mass fits an apple?', good: '150 g', bad: ['150 kg', '15 kg', '1 g'] },
  { key: 'ball', prompt: 'Which mass fits a cricket ball?', good: '160 g', bad: ['160 kg', '16 kg', '16 g'] },
  { key: 'bicycle', prompt: 'Which mass fits a bicycle?', good: '12 kg', bad: ['12 g', '120 kg', '1 kg'] },
  { key: 'elephant', prompt: 'Which mass fits an elephant?', good: '4000 kg', bad: ['4000 g', '40 kg', '400 g'] },
  { key: 'spoon', prompt: 'Which amount fits a spoon of medicine?', good: '5 mL', bad: ['5 L', '50 L', '50 mL'] },
  { key: 'bucket', prompt: 'Which amount fits a bucket of water?', good: '10 L', bad: ['10 mL', '1 mL', '100 L'] },
  { key: 'bottle', prompt: 'Which amount fits a big water bottle?', good: '1 L', bad: ['1 mL', '10 L', '100 L'] },
  { key: 'bath', prompt: 'Which amount fits a full bathtub?', good: '150 L', bad: ['150 mL', '15 mL', '15 L'] },
  { key: 'milk', prompt: 'Which amount fits a glass of milk?', good: '250 mL', bad: ['250 L', '25 L', '25 mL'] },
  { key: 'tank', prompt: 'Which amount fits a water tank on a roof?', good: '1000 L', bad: ['1000 mL', '100 L', '10 mL'] },
  { key: 'tea', prompt: 'Which amount fits a cup of tea?', good: '150 mL', bad: ['150 L', '15 L', '15 mL'] },
  { key: 'fish', prompt: 'Which amount fits a fish tank at home?', good: '60 L', bad: ['60 mL', '6 mL', '600 L'] },
  { key: 'juice', prompt: 'Which amount fits a small juice box?', good: '200 mL', bad: ['200 L', '20 L', '2 mL'] },
  { key: 'pen', prompt: 'Which length fits a pen?', good: '14 cm', bad: ['14 m', '14 mm', '14 km'] },
  { key: 'school-ruler', prompt: 'Which length fits a school ruler?', good: '30 cm', bad: ['30 m', '30 mm', '30 km'] },
  { key: 'pitch', prompt: 'Which length fits a football pitch?', good: '100 m', bad: ['100 cm', '100 km', '100 mm'] },
  { key: 'grown-up', prompt: 'Which height fits a grown-up?', good: '170 cm', bad: ['170 m', '170 mm', '170 km'] },
  { key: 'rice-grain', prompt: 'Which length fits a grain of rice?', good: '7 mm', bad: ['7 cm', '7 m', '7 km'] },
  { key: 'table', prompt: 'Which length fits a dining table?', good: '150 cm', bad: ['150 m', '150 mm', '150 km'] },
  { key: 'classroom', prompt: 'Which length fits a classroom?', good: '8 m', bad: ['8 cm', '8 km', '8 mm'] },
  { key: 'coin', prompt: 'Which thickness fits a coin?', good: '2 mm', bad: ['2 cm', '2 m', '2 km'] },
  { key: 'clip', prompt: 'Which length fits a paper clip?', good: '3 cm', bad: ['3 m', '3 km', '30 cm'] },
  { key: 'cycle-ride', prompt: 'Which distance fits a bike ride to the park?', good: '2 km', bad: ['2 m', '2 cm', '2 mm'] },
  { key: 'mountain', prompt: 'Which height fits a tall mountain?', good: '3000 m', bad: ['3000 cm', '3000 km', '3000 mm'] },
  { key: 'banana', prompt: 'Which length fits a banana?', good: '18 cm', bad: ['18 m', '18 mm', '18 km'] },
  { key: 'car-length', prompt: 'Which length fits a car?', good: '4 m', bad: ['4 cm', '4 km', '4 mm'] },
  { key: 'watermelon', prompt: 'Which mass fits a watermelon?', good: '3 kg', bad: ['3 g', '30 kg', '3 mg'] },
  { key: 'sugar', prompt: 'Which mass fits a packet of sugar?', good: '5 g', bad: ['5 kg', '50 g', '15 kg'] },
  { key: 'laptop', prompt: 'Which mass fits a laptop?', good: '2 kg', bad: ['2 g', '20 kg', '2 mg'] },
  { key: 'tomato', prompt: 'Which mass fits a tomato?', good: '100 g', bad: ['100 kg', '10 kg', '1 g'] },
  { key: 'cow', prompt: 'Which mass fits a cow?', good: '400 kg', bad: ['400 g', '40 g', '4 kg'] },
  { key: 'car-mass', prompt: 'Which mass fits a small car?', good: '1000 kg', bad: ['1000 g', '100 g', '10 kg'] },
  { key: 'dog', prompt: 'Which mass fits a big dog?', good: '20 kg', bad: ['20 g', '200 kg', '2 kg'] },
  { key: 'bread', prompt: 'Which mass fits a loaf of bread?', good: '400 g', bad: ['400 kg', '40 kg', '40 g'] },
  { key: 'eggs', prompt: 'Which mass fits a box of 12 eggs?', good: '600 g', bad: ['600 kg', '60 kg', '60 g'] },
  { key: 'adult', prompt: 'Which mass fits a grown-up?', good: '60 kg', bad: ['60 g', '600 kg', '6 kg'] },
  { key: 'soup', prompt: 'Which amount fits a bowl of soup?', good: '300 mL', bad: ['300 L', '30 L', '30 mL'] },
  { key: 'trip-bottle', prompt: 'Which amount fits a small water bottle for a trip?', good: '500 mL', bad: ['500 L', '50 L', '50 mL'] },
  { key: 'petrol', prompt: 'Which amount fits the petrol tank of a car?', good: '40 L', bad: ['40 mL', '4 mL', '400 L'] },
  { key: 'sink', prompt: 'Which amount fits a kitchen sink full of water?', good: '20 L', bad: ['20 mL', '2 mL', '200 L'] },
  { key: 'dropper', prompt: 'Which amount fits an eye dropper?', good: '1 mL', bad: ['1 L', '10 L', '100 L'] },
  { key: 'milk-packet', prompt: 'Which amount fits a packet of milk?', good: '500 mL', bad: ['500 L', '50 L', '50 mL'] },
  { key: 'dal-pot', prompt: 'Which amount fits a pot of dal for a family?', good: '2 L', bad: ['2 mL', '20 L', '200 L'] },
  { key: 'medicine', prompt: 'Which amount fits a bottle of cough syrup?', good: '100 mL', bad: ['100 L', '10 L', '10 mL'] },
  { key: 'barrel', prompt: 'Which amount fits a rain barrel?', good: '200 L', bad: ['200 mL', '20 mL', '20 L'] },
];

function draftUnit(family, grade, level, r) {
  if (level === 2) {
    const row = r.pick([
      { amount: r.pick([2, 3, 4, 5]), factor: 100, from: 'm', to: 'cm' },
      { amount: r.pick([2, 3, 4]), factor: 1000, from: 'kg', to: 'g' },
      { amount: r.pick([1, 2, 3]), factor: 1000, from: 'L', to: 'mL' },
    ]);
    const answer = row.amount * row.factor;
    return pack({
      family,
      prompt: hook(r, `${row.amount} ${row.from} is how many ${row.to}?`),
      answer,
      hint: 'Use the same measuring idea, then move to the smaller unit.',
      explanation: `${row.amount} ${row.from} = ${answer} ${row.to}.`,
      givens: { amount: row.amount, factor: row.factor },
      choices: biased(r, answer, [
        { value: row.amount * 10, code: 'class-3-sensible-unit' },
        { value: row.amount * row.factor + row.amount, code: 'unit-conversion' },
        { value: row.factor, code: 'missing-step' },
        { value: answer + row.factor, code: 'wrong-operation' },
      ], { min: 1, max: 9999 }),
    });
  }
  const row = r.pick(UNIT_ROWS);
  return pack({
    family,
    prompt: hook(r, row.prompt),
    answer: row.good,
    hint: 'Pick the unit that matches the real size of the object.',
    explanation: `${row.good} is a sensible measure here.`,
    givens: { key: row.key },
    choices: said(row.good, row.bad.map((value, index) => [value, index === 0 ? 'class-3-sensible-unit' : 'unit-conversion'])),
  });
}

function solveUnit(question) {
  const givens = question.proof.givens;
  if (givens.amount) return givens.amount * givens.factor;
  const row = UNIT_ROWS.find(item => item.key === givens.key);
  if (!row) throw new Error('unit');
  return row.good;
}

const LIQUIDS = [
  { name: 'water', tone: '#bfe3f2', look: 'light blue' },
  { name: 'orange juice', tone: '#f3b04f', look: 'orange' },
  { name: 'milk', tone: '#fff6e8', look: 'white' },
  { name: 'mango juice', tone: '#f0cf4d', look: 'yellow' },
  { name: 'lemonade', tone: '#e6efa4', look: 'pale green' },
];

function draftJug(family, grade, level, r) {
  const litres = r.int(1, 5);
  const cupMl = r.pick([100, 125, 200, 250, 500]);
  const liquid = r.pick(LIQUIDS);
  const cups = litres * 1000 / cupMl;
  const used = level >= 3 ? r.int(1, cups - 1) : 0;
  const answer = used ? litres * 1000 - used * cupMl : cups;
  return pack({
    family,
    prompt: used ? `If ${used} ${used === 1 ? 'cup is' : 'cups are'} poured out, how many mL of ${liquid.name} stay in the jug?` : `How many cups of ${liquid.name} fill this jug?`,
    answer,
    hint: 'One litre is 1000 mL. Use the cup size printed beside the jug.',
    explanation: used
      ? `${litres} L is ${litres * 1000} mL. ${used} ${used === 1 ? 'cup takes' : 'cups take'} ${used * cupMl} mL, so ${answer} mL stay.`
      : `${litres} L is ${litres * 1000} mL. Each cup is ${cupMl} mL, so ${cups} cups fill it.`,
    givens: { used },
    visual: {
      kind: 'v3-class-3-jug', litres, cupMl, tone: liquid.tone,
      description: `A jug of ${liquid.look} ${liquid.name} marked ${litres} L beside one cup marked ${cupMl} mL.`,
    },
    choices: biased(r, answer, [
      { value: used ? cups : litres * 100 / cupMl, code: 'unit-conversion' },
      { value: litres, code: 'missing-step' },
      { value: cupMl, code: 'wrong-operation' },
      { value: answer + cupMl / 100, code: 'class-3-sensible-unit' },
    ], { min: 1, max: 5000 }),
  });
}

function solveJug(question) {
  const { litres, cupMl } = question.visual;
  if (1000 % cupMl) throw new Error('jug');
  const cups = litres * 1000 / cupMl;
  const used = question.proof.givens.used;
  return used ? litres * 1000 - used * cupMl : cups;
}

function laterTime(hour, minute, delta) {
  const next = addMinutes(hour, minute, delta);
  if (next.hour < 1 || next.hour > 9) throw new QuestionRetry('clock');
  return next;
}

function draftClock(family, grade, level, r) {
  const hour = r.int(1, 7);
  const minute = r.pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const delta = level === 1 ? 0 : r.pick([10, 15, 20, 25, 30, 35]);
  const shown = laterTime(hour, minute, delta);
  const answer = level >= 3 ? clock24(shown.hour, shown.minute) : clockLabel(shown.hour, shown.minute);
  const swapHour = Math.floor(minute / 5) || 12;
  const swap = clockLabel(swapHour > 9 ? 4 : swapHour, 0);
  const options = level >= 3
    ? said(answer, [
      [clockLabel(shown.hour, shown.minute), 'class-3-clock-swap'],
      [clock24(shown.hour, (shown.minute + 5) % 60), 'missing-step'],
      [clock24(shown.hour === 1 ? 2 : shown.hour - 1, shown.minute), 'hour-carry'],
    ])
    : said(answer, [
      [swap === answer ? clockLabel(hour, (minute + 5) % 60) : swap, 'class-3-clock-swap'],
      [clockLabel(shown.hour, (shown.minute + 5) % 60), 'missing-step'],
      [clockLabel(Math.max(1, shown.hour - 1), shown.minute), 'time-direction'],
    ]);
  const prompt = level === 1
    ? 'What time does the clock show?'
    : level === 2
      ? `What time is it ${delta} minutes later?`
      : `It is morning. What is the 24-hour time ${delta ? `${delta} minutes later` : 'shown'}?`;
  return pack({
    family,
    prompt: hook(r, prompt),
    answer,
    hint: 'The short hand shows the hour. The long hand shows the minutes.',
    explanation: delta ? `${clockLabel(hour, minute)} plus ${delta} minutes is ${answer}.` : `The clock shows ${answer}.`,
    givens: { delta, mode: level >= 3 ? '24' : '12' },
    visual: {
      kind: 'v3-class-3-clock', minutes: hour * 60 + minute,
      description: `Clock showing ${clockLabel(hour, minute)}. Short hand near ${hour}, long hand at minute ${minute}.`,
    },
    choices: options,
  });
}

function clock24(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function solveClock(question) {
  const minutes = question.visual.minutes;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const next = addMinutes(hour, minute, question.proof.givens.delta);
  return question.proof.givens.mode === '24' ? clock24(next.hour, next.minute) : clockLabel(next.hour, next.minute);
}

function clockChoice(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const label = clockLabel(hour, minute);
  return {
    value: label,
    visual: {
      kind: 'v3-class-3-clock', compact: true, minutes,
      description: `Compact clock showing ${label}. Short hand near ${hour}, long hand at minute ${minute}.`,
    },
  };
}

function draftClockPick(family, grade, level, r) {
  const hour = r.int(1, 8);
  const minute = r.pick([0, 10, 15, 20, 30, 40, 45]);
  const delta = level === 1 ? 0 : r.pick([15, 20, 30]);
  const target = laterTime(hour, minute, delta);
  const targetMinutes = target.hour * 60 + target.minute;
  const swapMinutes = (Math.floor(minute / 5) || 4) * 60;
  const pool = [targetMinutes + 5, targetMinutes - 5, swapMinutes, hour * 60 + ((minute + 30) % 60), targetMinutes + 60];
  const wrongMinutes = [];
  for (const value of pool) {
    if (value < 60 || value > 9 * 60 || value === targetMinutes || wrongMinutes.includes(value)) continue;
    wrongMinutes.push(value);
  }
  if (wrongMinutes.length < 3) throw new QuestionRetry('clock pick');
  const correct = clockChoice(targetMinutes);
  const alts = wrongMinutes.slice(0, 3).map((value, index) => {
    const choice = clockChoice(value);
    return wrong(choice.value, index === 0 ? 'class-3-clock-swap' : 'clock-hands', choice.visual);
  });
  const prompt = delta ? `Which clock shows ${delta} minutes after ${clockLabel(hour, minute)}?` : `Which clock shows ${clockLabel(hour, minute)}?`;
  return pack({
    family,
    prompt: hook(r, prompt),
    answer: correct.value,
    hint: 'Match the short hand to the hour and the long hand to the minutes.',
    explanation: `The matching clock shows ${correct.value}.`,
    givens: { minutes: targetMinutes },
    choices: pictureChoices(correct.value, correct.visual, alts),
  });
}

function solveClockPick(question) {
  matchPictures(question, visual => {
    const hour = Math.floor(visual.minutes / 60);
    return clockLabel(hour, visual.minutes % 60);
  });
  const wanted = question.proof.givens.minutes;
  const hits = question.optionVisuals.filter(visual => visual.minutes === wanted);
  if (hits.length !== 1) throw new Error('clock pick');
  return clockLabel(Math.floor(wanted / 60), wanted % 60);
}

function draftElapsed(family, grade, level, r) {
  const hour = r.int(1, 6);
  const minute = r.pick([0, 10, 15, 20, 30]);
  const first = r.pick([10, 15, 20, 25, 30]);
  const second = level === 1 ? 0 : r.pick([10, 15, 20, 30]);
  const mid = laterTime(hour, minute, first);
  const end = laterTime(mid.hour, mid.minute, second);
  const ask = level < 3 ? 'all' : 'second';
  const answer = ask === 'second' ? second : first + second;
  const startLabel = clockLabel(hour, minute);
  const endLabel = clockLabel(end.hour, end.minute);
  const stopLabel = second ? clockLabel(mid.hour, mid.minute) : '';
  return pack({
    family,
    prompt: hook(r, ask === 'second' ? 'How many minutes is the second part of the trip?' : 'How many minutes does the trip take?'),
    answer,
    hint: ask === 'second'
      ? 'Count the minutes from the white stop to the coral end.'
      : 'Count from the gold start dot to the coral end dot. A white dot is only a stop.',
    explanation: `The trip covers ${answer} minutes.`,
    givens: { ask },
    visual: {
      kind: 'v3-class-3-timeline', start: startLabel, end: endLabel, ...(stopLabel ? { stop: stopLabel } : {}),
      description: stopLabel
        ? `Time bar from ${startLabel} to ${endLabel}, with a stop at ${stopLabel}.`
        : `Time bar from ${startLabel} to ${endLabel}.`,
    },
    choices: biased(r, answer, [
      { value: first, code: 'counted-endpoints' },
      { value: answer + 5, code: 'hour-carry' },
      { value: Math.max(5, answer - 5), code: 'time-direction' },
      { value: first + second + 60, code: 'missing-step' },
    ], { min: 5, max: 180 }),
  });
}

function readClock(label) {
  const [hour, minute] = String(label).split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) throw new Error('time');
  return hour * 60 + minute;
}

function solveElapsed(question) {
  const start = readClock(question.visual.start);
  const end = readClock(question.visual.end);
  const stop = question.visual.stop ? readClock(question.visual.stop) : null;
  if (question.proof.givens.ask === 'second') {
    if (stop == null) throw new Error('elapsed');
    return end - stop;
  }
  return end - start;
}

function weekdayOf(start, date) {
  return DAYS[(start + date - 1) % 7];
}

function draftCalendar(family, grade, level, r) {
  const month = r.pick(['March', 'April', 'June', 'July', 'August']);
  const days = r.pick([28, 30, 31]);
  const start = r.int(0, 6);
  const mark = r.int(1, Math.min(days, 24));
  if (level === 1) {
    const answer = weekdayOf(start, mark);
    const near = DAYS.filter(day => day !== answer).sort((a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length)).slice(0, 3);
    return pack({
      family,
      prompt: hook(r, 'What weekday is the gold date?'),
      answer,
      hint: 'Find the gold date, then read the weekday heading of its column.',
      explanation: `${mark} ${month} falls on ${answer}.`,
      givens: { ask: 'weekday' },
      visual: {
        kind: 'v3-class-3-calendar', month, days, start, mark,
        description: `${month} calendar with ${days} days. The 1st is a ${DAYS[start]}. Date ${mark} is gold.`,
      },
      choices: said(answer, near.map((day, index) => [day, index === 0 ? 'class-3-weekday-shift' : 'calendar-column'])),
    });
  }
  const step = level === 2 ? 7 : r.int(3, 6);
  const answer = mark + step;
  if (answer > days) throw new QuestionRetry('calendar');
  return pack({
    family,
    prompt: hook(r, `The gold date is ${mark}. What date is ${step} days later?`),
    answer,
    hint: 'Start at the gold date and count forward one day at a time.',
    explanation: `${mark} plus ${step} days is ${answer}.`,
    givens: { ask: 'later', step },
    visual: {
      kind: 'v3-class-3-calendar', month, days, start, mark,
      description: `${month} calendar with ${days} days. The 1st is a ${DAYS[start]}. Date ${mark} is gold.`,
    },
    choices: biased(r, answer, [
      { value: answer - 1, code: 'class-3-weekday-shift' },
      { value: mark, code: 'counted-endpoints' },
      { value: Math.min(days, answer + 1), code: 'calendar-column' },
      { value: step, code: 'missing-step' },
    ], { min: 1, max: 31 }),
  });
}

function solveCalendar(question) {
  const { start, mark, days } = question.visual;
  const givens = question.proof.givens;
  if (givens.ask === 'weekday') return weekdayOf(start, mark);
  const later = mark + givens.step;
  if (later < 1 || later > days) throw new Error('calendar');
  return later;
}

function draftTableTime(family, grade, level, r) {
  const names = r.shuffle(['Dock', 'Bay', 'Gate', 'Pier', 'Camp']).slice(0, 4);
  let minute = r.int(8, 9) * 60 + r.pick([0, 10, 20]);
  const rows = names.map(name => {
    const label = clockLabel(Math.floor(minute / 60), minute % 60);
    const row = { left: name, right: label, minute };
    minute += r.pick([20, 30, 40]);
    return row;
  });
  const from = r.int(0, 1);
  const to = r.int(from + 1, rows.length - 1);
  const gap = rows[to].minute - rows[from].minute;
  const answer = level >= 3 ? clockLabel(Math.floor((rows[from].minute + 20) / 60), (rows[from].minute + 20) % 60) : gap;
  const visualRows = rows.map(row => ({ left: row.left, right: row.right }));
  if (typeof answer === 'string') {
    const alts = rows.map(row => row.right).filter(label => label !== answer).slice(0, 3);
    if (alts.length < 3) throw new QuestionRetry('timetable');
    return pack({
      family,
      prompt: hook(r, `What time is 20 minutes after ${rows[from].left}?`),
      answer,
      hint: 'Find the time on the table, then count 20 minutes forward.',
      explanation: `${rows[from].left} is at ${rows[from].right}. Twenty minutes later is ${answer}.`,
      givens: { ask: 'after', index: from, delta: 20 },
      visual: {
        kind: 'v3-class-3-schedule', title: 'Times', rows: visualRows,
        description: `Timetable. ${visualRows.map(row => `${row.left} ${row.right}`).join(', ')}.`,
      },
      choices: said(answer, alts.map((label, index) => [label, index === 0 ? 'hour-carry' : 'time-direction'])),
    });
  }
  return pack({
    family,
    prompt: hook(r, `How many minutes from ${rows[from].left} to ${rows[to].left}?`),
    answer,
    hint: 'Subtract the start time from the later time.',
    explanation: `${rows[to].right} is ${gap} minutes after ${rows[from].right}.`,
    givens: { ask: 'gap', from, to },
    visual: {
      kind: 'v3-class-3-schedule', title: 'Times', rows: visualRows,
      description: `Timetable. ${visualRows.map(row => `${row.left} ${row.right}`).join(', ')}.`,
    },
    choices: biased(r, answer, [
      { value: gap + 10, code: 'hour-carry' },
      { value: Math.max(10, gap - 10), code: 'time-direction' },
      { value: rows[to].minute % 60, code: 'clock-hands' },
      { value: gap + 60, code: 'missing-step' },
    ], { min: 10, max: 180 }),
  });
}

function solveTableTime(question) {
  const rows = question.visual.rows;
  const givens = question.proof.givens;
  const minutes = rows.map(row => readClock(row.right));
  if (givens.ask === 'gap') return minutes[givens.to] - minutes[givens.from];
  const next = addMinutes(Math.floor(minutes[givens.index] / 60), minutes[givens.index] % 60, givens.delta);
  return clockLabel(next.hour, next.minute);
}

function draftBoard(family, grade, level, r) {
  const goods = r.shuffle(GOODS).slice(0, 4);
  const prices = goods.map(name => ({ name, price: r.int(8, 24) }));
  const picked = r.shuffle(prices).slice(0, level >= 3 ? 3 : 2);
  const answer = picked.reduce((sum, item) => sum + item.price, 0);
  const rows = prices.map(item => ({ left: item.name, right: rs(item.price) }));
  return pack({
    family,
    prompt: hook(r, `What is the cost of ${picked.map(item => item.name).join(' and ')}?`),
    answer: rs(answer),
    hint: 'Add the prices shown for the named items.',
    explanation: `${picked.map(item => item.price).join(' + ')} = ${answer}.`,
    givens: { names: picked.map(item => item.name) },
    visual: {
      kind: 'v3-class-3-board', title: 'Prices', rows,
      description: `Price board. ${rows.map(row => `${row.left} ${row.right}`).join(', ')}.`,
    },
    choices: rupees(r, answer, [
      { value: picked[0].price, code: 'price-total' },
      { value: answer + picked[0].price, code: 'missing-step' },
      { value: Math.max(10, answer - picked[0].price), code: 'wrong-operation' },
      { value: prices.reduce((sum, item) => sum + item.price, 0), code: 'ignored-condition' },
    ]),
  });
}

function solveBoard(question) {
  const prices = Object.fromEntries(question.visual.rows.map(row => [row.left, Number(row.right.slice(3))]));
  const total = question.proof.givens.names.reduce((sum, name) => sum + prices[name], 0);
  return rs(total);
}

function coinPieces(r, level) {
  const first = r.pick([2, 5, 10]);
  const coins = level === 1
    ? [{ value: first, count: r.int(2, 4) }, { value: r.pick([1, 2].filter(value => value !== first)), count: r.int(1, 3) }]
    : [{ value: r.pick([10, 20]), count: r.int(1, 2), note: true }, { value: r.pick([2, 5]), count: r.int(1, 3) }];
  let width = 20;
  for (const piece of coins) width += piece.count * (piece.note ? 96 : 72);
  if (width > 430) throw new QuestionRetry('coins');
  return coins;
}

function coinTotal(pieces) {
  return pieces.reduce((sum, piece) => sum + piece.value * piece.count, 0);
}

function draftCoins(family, grade, level, r) {
  const pieces = coinPieces(r, level);
  const total = coinTotal(pieces);
  const count = pieces.reduce((sum, piece) => sum + piece.count, 0);
  const answer = level >= 3 ? total - pieces[0].value : total;
  if (answer < 1) throw new QuestionRetry('coins');
  const listed = pieces.map(piece => `${piece.count} ${piece.note ? (piece.count === 1 ? 'note' : 'notes') : (piece.count === 1 ? 'coin' : 'coins')} of ${piece.value}`).join(' and ');
  return pack({
    family,
    prompt: level >= 3 ? `How much is left if one ${pieces[0].value} piece is spent?` : r.pick([`What is the total value of these ${pieces.some(piece => piece.note) ? 'notes and coins' : 'coins'}?`, 'How much money is in this purse?', 'How much money is shown here?']),
    answer: rs(answer),
    hint: 'Add the value printed on each coin or note. Do not only count the pieces.',
    explanation: `The pieces are worth Rs ${total}${level >= 3 ? `, so Rs ${answer} stays` : ''}.`,
    givens: { spent: level >= 3 ? pieces[0].value : 0 },
    visual: {
      kind: 'v3-class-3-coins', pieces,
      description: `Money pieces: ${listed}.`,
    },
    choices: rupees(r, answer, [
      { value: count, code: 'class-3-coin-value' },
      { value: total, code: 'missing-step' },
      { value: pieces[0].value * pieces[0].count, code: 'coin-count' },
      { value: answer + pieces[0].value, code: 'wrong-operation' },
    ], { min: 1 }),
  });
}

function solveCoins(question) {
  const total = coinTotal(question.visual.pieces);
  return rs(total - question.proof.givens.spent);
}

function draftChange(family, grade, level, r) {
  const goods = r.shuffle(GOODS).slice(0, level === 1 ? 1 : 2);
  const prices = goods.map(name => ({ name, price: r.int(8, 24) }));
  const cost = prices.reduce((sum, item) => sum + item.price, 0);
  const paid = cost + r.pick([5, 10, 15, 20]);
  const answer = paid - cost;
  const rows = [...prices.map(item => ({ left: item.name, right: rs(item.price) })), { left: 'Paid', right: rs(paid) }];
  return pack({
    family,
    prompt: hook(r, `Paid with Rs ${paid}. How much change comes back?`),
    answer: rs(answer),
    hint: 'Add the item prices, then subtract that cost from the money paid.',
    explanation: `The cost is Rs ${cost}. Rs ${paid} - Rs ${cost} = Rs ${answer}.`,
    givens: { ask: 'change' },
    visual: {
      kind: 'v3-class-3-receipt', title: 'Receipt', rows,
      description: `Receipt. ${rows.map(row => `${row.left} ${row.right}`).join(', ')}.`,
    },
    choices: rupees(r, answer, [
      { value: cost, code: 'change-order' },
      { value: paid, code: 'missing-step' },
      { value: answer + prices[0].price, code: 'price-total' },
      { value: Math.max(1, answer - 5), code: 'wrong-operation' },
    ], { min: 1 }),
  });
}

function solveChange(question) {
  const rows = question.visual.rows;
  const paid = rows.find(row => row.left === 'Paid');
  const cost = rows.filter(row => row.left !== 'Paid').reduce((sum, row) => sum + Number(row.right.slice(3)), 0);
  const cash = Number(paid.right.slice(3));
  if (cash <= cost) throw new Error('change');
  return rs(cash - cost);
}

function draftBest(family, grade, level, r) {
  const countA = r.int(2, 4);
  const countB = countA + r.int(1, 3);
  const unitA = r.int(3, 8);
  const unitB = unitA + (level === 1 ? r.int(2, 4) : r.pick([-2, -1, 1, 2]));
  if (unitB < 2 || unitA === unitB) throw new QuestionRetry('buy');
  const priceA = countA * unitA;
  const priceB = countB * unitB;
  const better = unitA < unitB ? countA : countB;
  const answer = `Pack of ${better}`;
  const other = better === countA ? countB : countA;
  const extra = [2, 3, 4, 5, 6, 7, 8, 9].find(count => count !== better && count !== other && count !== countA + countB);
  return pack({
    family,
    prompt: hook(r, `${countA} stickers cost Rs ${priceA}. ${countB} stickers cost Rs ${priceB}. Which pack is cheaper for one sticker?`),
    answer,
    hint: 'Find the cost of one sticker in each pack, then compare.',
    explanation: `One sticker costs Rs ${unitA} in the pack of ${countA} and Rs ${unitB} in the pack of ${countB}.`,
    givens: { countA, priceA, countB, priceB },
    choices: said(answer, [
      [`Pack of ${other}`, 'class-3-offer-each'],
      [`Pack of ${countA + countB}`, 'price-total'],
      [`Pack of ${extra}`, 'ignored-condition'],
    ]),
  });
}

function solveBest(question) {
  const { countA, priceA, countB, priceB } = question.proof.givens;
  if (priceA * countB === priceB * countA) throw new Error('buy');
  return `Pack of ${priceA * countB < priceB * countA ? countA : countB}`;
}

function draftBudget(family, grade, level, r) {
  const items = r.shuffle(GOODS).slice(0, 4).map(name => ({ name, price: r.int(6, 16) }));
  if (new Set(items.map(item => item.price)).size < 4) throw new QuestionRetry('budget');
  const need = items[0];
  const companions = items.slice(1).sort((a, b) => a.price - b.price);
  const budget = need.price + companions[0].price + (level >= 3 ? 0 : r.int(0, 1));
  const fitting = companions.filter(item => need.price + item.price <= budget);
  if (fitting.length !== 1) throw new QuestionRetry('budget');
  const answer = pairName(need.name, fitting[0].name);
  const over = companions.filter(item => need.price + item.price > budget);
  const skipped = pairName(companions[1].name, companions[2].name);
  const options = [
    [pairName(need.name, over[0].name), 'class-3-budget-fit'],
    [skipped, 'ignored-condition'],
    [pairName(need.name, over[1] ? over[1].name : companions[2].name), 'price-total'],
  ];
  if (new Set([answer, ...options.map(([value]) => value)]).size < 4) throw new QuestionRetry('budget');
  const rows = [
    { left: 'Money', right: rs(budget) },
    { left: 'Need', right: need.name },
    ...items.map(item => ({ left: item.name, right: rs(item.price) })),
  ];
  return pack({
    family,
    prompt: hook(r, `Which pair includes ${need.name} and stays within the money?`),
    answer,
    hint: 'The pair must include the needed item and cost no more than the money.',
    explanation: `${answer} costs Rs ${need.price + fitting[0].price}, which fits in Rs ${budget}.`,
    givens: { need: need.name, budget },
    visual: {
      kind: 'v3-class-3-budget', title: 'Budget', rows,
      description: `Budget list. Money ${rs(budget)}. Need ${need.name}. ${items.map(item => `${item.name} ${rs(item.price)}`).join(', ')}.`,
    },
    choices: said(answer, options),
  });
}

function solveBudget(question) {
  const rows = question.visual.rows;
  const prices = Object.fromEntries(rows.filter(row => !['Money', 'Need'].includes(row.left)).map(row => [row.left, Number(row.right.slice(3))]));
  const { need, budget } = question.proof.givens;
  const hits = Object.keys(prices).filter(name => name !== need && prices[need] + prices[name] <= budget);
  if (hits.length !== 1) throw new Error('budget');
  return pairName(need, hits[0]);
}

function draftPicto(family, grade, level, r) {
  const key = r.pick([2, 4, 10]);
  const labels = r.shuffle(SITES).slice(0, r.int(3, 4));
  const rows = labels.map((label, index) => ({
    label,
    full: r.int(1, 5),
    half: level === 1 ? 0 : index === 0 ? 1 : 0,
  }));
  const valueOf = row => row.full * key + row.half * key / 2;
  const focus = rows[level === 1 ? r.int(0, rows.length - 1) : 0];
  const other = rows.find(row => row !== focus);
  const answer = level >= 3 ? valueOf(focus) - valueOf(other) : valueOf(focus);
  if (answer < 1) throw new QuestionRetry('picto');
  return pack({
    family,
    prompt: hook(r, level >= 3 ? `How many more ${focus.label.toLowerCase()} than ${other.label.toLowerCase()} are shown?` : `How many ${focus.label.toLowerCase()} are shown?`),
    answer,
    hint: 'A whole circle stands for the key. A half circle stands for half of the key.',
    explanation: level >= 3
      ? `${focus.label} is ${valueOf(focus)} and ${other.label} is ${valueOf(other)}. The gap is ${answer}.`
      : `${focus.full} ${focus.full === 1 ? 'circle' : 'circles'}${focus.half ? ' and a half circle' : ''} at ${key} each make ${valueOf(focus)}.`,
    givens: { ask: level >= 3 ? 'gap' : 'read', label: focus.label, other: other?.label ?? '' },
    visual: {
      kind: 'v3-class-3-picto', key, rows,
      description: `Pictograph. Each circle stands for ${key}. ${rows.map(row => `${row.label} has ${row.full} ${row.full === 1 ? 'circle' : 'circles'}${row.half ? ' and a half circle' : ''}`).join('. ')}.`,
    },
    choices: biased(r, answer, [
      { value: focus.full + focus.half, code: 'class-3-half-symbol' },
      { value: focus.full * key, code: 'graph-key' },
      { value: valueOf(focus), code: 'graph-difference' },
      { value: answer + key / 2, code: 'missing-step' },
    ], { min: 1, max: 80 }),
  });
}

function solvePicto(question) {
  const key = question.visual.key;
  const valueOf = row => row.full * key + (row.half ? key / 2 : 0);
  const focus = question.visual.rows.find(row => row.label === question.proof.givens.label);
  if (!focus) throw new Error('picto');
  if (question.proof.givens.ask === 'gap') {
    const other = question.visual.rows.find(row => row.label === question.proof.givens.other);
    return valueOf(focus) - valueOf(other);
  }
  return valueOf(focus);
}

function draftBars(family, grade, level, r) {
  const labels = r.shuffle(SITES).slice(0, 4);
  const scale = r.pick([2, 5, 10]);
  const values = labels.map(() => scale * r.int(1, 6));
  const [first, second] = r.shuffle([0, 1, 2, 3]).slice(0, 2);
  const high = values[first] >= values[second] ? first : second;
  const low = high === first ? second : first;
  const answer = level === 1 ? values[first] : values[high] - values[low];
  if (answer < 1) throw new QuestionRetry('bars');
  const prompt = level === 1
    ? `How many ${labels[first].toLowerCase()} does the bar show?`
    : `How many more ${labels[high].toLowerCase()} than ${labels[low].toLowerCase()} are there?`;
  return pack({
    family,
    prompt: hook(r, prompt),
    answer,
    hint: 'Read the scale at the left, then compare the bar heights.',
    explanation: level === 1 ? `${labels[first]} reaches ${answer}.` : `${values[high]} - ${values[low]} = ${answer}.`,
    givens: { ask: level === 1 ? 'read' : 'gap', first, high, low },
    visual: {
      kind: 'v3-class-3-bars', labels, values, scale,
      description: `Bar chart marked every ${scale}. ${labels.map((label, index) => `${label} ${values[index]}`).join(', ')}.`,
    },
    choices: biased(r, answer, [
      { value: values[high] + values[low], code: 'graph-difference' },
      { value: values[first], code: 'missing-step' },
      { value: scale, code: 'scale-interval' },
      { value: answer + scale, code: 'wrong-operation' },
    ], { min: 1, max: 80 }),
  });
}

function solveBars(question) {
  const { values } = question.visual;
  const givens = question.proof.givens;
  if (givens.ask === 'read') return values[givens.first];
  return values[givens.high] - values[givens.low];
}

function draftChartMove(family, grade, level, r) {
  const labels = r.shuffle(SITES).slice(0, 3);
  const rows = labels.map(label => ({ left: label, right: String(r.int(4, 16)) }));
  const index = r.int(0, 2);
  const delta = r.int(2, 5);
  const current = Number(rows[index].right);
  const answer = level === 1 ? current : level === 2 ? current + delta : current - Math.min(delta, current - 1);
  const change = answer - current;
  const name = rows[index].left.toLowerCase();
  const prompt = level === 1
    ? `How many ${name} are in the table?`
    : change > 0
      ? `${delta} more ${name} arrive. How many ${name} are there now?`
      : `${-change} ${name} are sold. How many ${name} are left?`;
  return pack({
    family,
    prompt: hook(r, prompt),
    answer,
    hint: 'Start from the number in the table, then apply the change.',
    explanation: level === 1 ? `${rows[index].left} is ${current}.` : `${current} changes by ${change} and becomes ${answer}.`,
    givens: { index, change },
    visual: {
      kind: 'v3-class-3-datatable', title: 'Fruit stall', rows,
      description: `Data table. ${rows.map(row => `${row.left} ${row.right}`).join(', ')}.`,
    },
    choices: biased(r, answer, [
      { value: current, code: 'graph-update' },
      { value: current + delta, code: 'missing-step' },
      { value: Math.max(0, current - delta), code: 'wrong-operation' },
      { value: answer + 1, code: 'ignored-change' },
    ], { min: 0, max: 40 }),
  });
}

function solveChartMove(question) {
  const row = question.visual.rows[question.proof.givens.index];
  return Number(row.right) + question.proof.givens.change;
}

function draftTally(family, grade, level, r) {
  const labels = r.shuffle(SITES).slice(0, level >= 3 ? 4 : 3);
  const rows = labels.map(label => ({ label, count: r.int(4, 9) }));
  const wrongCount = count => (count === 9 ? 4 : count + 1);
  let claims;
  if (level >= 3) {
    const max = Math.max(...rows.map(row => row.count));
    if (rows.filter(row => row.count === max).length !== 1) throw new QuestionRetry('tally');
    claims = rows.map(row => ({ label: row.label, count: row.count, text: `${row.label} have the most` }));
  } else {
    const [focus, other, third] = rows;
    claims = [
      { label: focus.label, count: focus.count, text: `${focus.label} have ${focus.count}` },
      { label: focus.label, count: wrongCount(focus.count), text: `${focus.label} have ${wrongCount(focus.count)}` },
      { label: other.label, count: wrongCount(other.count), text: `${other.label} have ${wrongCount(other.count)}` },
      { label: third.label, count: wrongCount(third.count), text: `${third.label} have ${wrongCount(third.count)}` },
    ];
  }
  const counts = Object.fromEntries(rows.map(row => [row.label, row.count]));
  const trueOnes = claims.filter(claim => claim.text.endsWith('most') ? counts[claim.label] === Math.max(...rows.map(row => row.count)) && rows.filter(row => row.count === counts[claim.label]).length === 1 : counts[claim.label] === claim.count);
  if (trueOnes.length !== 1) throw new QuestionRetry('tally');
  const answer = trueOnes[0].text;
  const wrongs = claims.filter(claim => claim.text !== answer).map((claim, index) => [claim.text, index === 0 ? 'class-3-true-line' : 'graph-key']);
  return pack({
    family,
    prompt: hook(r, 'Which sentence matches the tally marks?'),
    answer,
    hint: 'Count every tally mark, including the diagonal mark in a bundle of five.',
    explanation: `${answer} matches the marks.`,
    givens: { claims: claims.map(claim => ({ label: claim.label, count: claim.count, text: claim.text })) },
    visual: {
      kind: 'v3-class-3-tally', rows,
      description: `Tally chart. ${rows.map(row => `${row.label} have ${row.count} marks`).join('. ')}.`,
    },
    choices: said(answer, wrongs),
  });
}

function solveTally(question) {
  const counts = Object.fromEntries(question.visual.rows.map(row => [row.label, row.count]));
  const max = Math.max(...question.visual.rows.map(row => row.count));
  const hits = question.proof.givens.claims.filter(claim => claim.text.endsWith('most')
    ? counts[claim.label] === max && question.visual.rows.filter(row => row.count === max).length === 1
    : counts[claim.label] === claim.count);
  if (hits.length !== 1) throw new Error('tally');
  return hits[0].text;
}

function draftSplit(family, grade, level, r) {
  const labels = r.shuffle(SITES).slice(0, 3);
  const left = labels.map(() => r.int(2, 9));
  const right = labels.map(() => r.int(2, 9));
  const index = r.int(0, 2);
  if (level > 1 && left[index] <= right[index]) {
    const gap = r.int(1, 3);
    left[index] = Math.min(9, right[index] + gap);
    if (left[index] <= right[index]) right[index] = left[index] - 1;
  }
  const answer = level === 1 ? left[index] + right[index] : left[index] - right[index];
  if (answer < 1 && level > 1) throw new QuestionRetry('split');
  const prompt = level === 1
    ? `How many ${labels[index].toLowerCase()} are there in both weeks?`
    : `How many more ${labels[index].toLowerCase()} are there in week 1 than week 2?`;
  return pack({
    family,
    prompt: hook(r, prompt),
    answer,
    hint: 'Read the number at the end of each bar, then add or subtract.',
    explanation: level === 1 ? `${left[index]} + ${right[index]} = ${answer}.` : `${left[index]} - ${right[index]} = ${answer}.`,
    givens: { ask: level === 1 ? 'sum' : 'gap', index },
    visual: {
      kind: 'v3-class-3-split', leftTitle: 'Week 1', rightTitle: 'Week 2', labels, left, right,
      description: `Two charts. ${labels.map((label, item) => `${label} is ${left[item]} in week 1 and ${right[item]} in week 2`).join('. ')}.`,
    },
    choices: biased(r, answer, [
      { value: left[index] + right[index], code: 'graph-difference' },
      { value: left[index], code: 'missing-step' },
      { value: right[index], code: 'wrong-operation' },
      { value: Math.abs(answer) + 1, code: 'ignored-change' },
    ], { min: 1, max: 30 }),
  });
}

function solveSplit(question) {
  const { left, right } = question.visual;
  const { ask, index } = question.proof.givens;
  return ask === 'sum' ? left[index] + right[index] : left[index] - right[index];
}

function draftQueue(family, grade, level, r) {
  const names = r.shuffle(CREW).slice(0, r.int(4, 6));
  const index = r.int(0, names.length - 1);
  const front = index + 1;
  const back = names.length - index;
  const ask = level === 1 ? 'front' : level === 2 ? 'back' : 'total';
  const ordinal = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
  const answer = ask === 'front' ? names[index] : ask === 'back' ? names[names.length - 2] : names.length;
  const prompt = ask === 'front'
    ? `Who is ${ordinal[index]} from the front?`
    : ask === 'back'
      ? 'Who is 2nd from the back?'
      : `${names[index]} is ${ordinal[index]} from the front and ${ordinal[back - 1]} from the back. How many people are in the line?`;
  const choices = ask === 'total'
    ? biased(r, answer, [
      { value: front + back, code: 'class-3-rank-total' },
      { value: front + back - 2, code: 'rank-endpoints' },
      { value: names.length - 1, code: 'missing-step' },
      { value: front, code: 'position-end' },
    ], { min: 2, max: 12 })
    : said(answer, names.filter(name => name !== answer).slice(0, 3).map((name, item) => [name, item === 0 ? 'class-3-rank-total' : 'position-end']));
  return pack({
    family,
    prompt: hook(r, prompt),
    answer,
    hint: ask === 'total'
      ? 'The arrow marks the front. Add the two ranks and subtract 1.'
      : ask === 'back'
        ? 'The arrow marks the front. Count from the other end.'
        : 'The arrow marks the front. Count along the queue from the front.',
    explanation: ask === 'total' ? `${front} + ${back} - 1 = ${names.length}.` : `${answer} matches that place in the queue.`,
    givens: { ask, index, backIndex: 1 },
    visual: {
      kind: 'v3-class-3-queue', names,
      description: `Queue from the front: ${names.join(', ')}.`,
    },
    choices,
  });
}

function solveQueue(question) {
  const names = question.visual.names;
  const { ask, index } = question.proof.givens;
  if (ask === 'front') return names[index];
  if (ask === 'back') return names[names.length - 1 - question.proof.givens.backIndex];
  if (ask === 'total') return names.length;
  throw new Error('queue');
}

function shiftWord(word, shift) {
  return [...word].map(letter => String.fromCharCode(65 + (letter.charCodeAt(0) - 65 + shift + 26) % 26)).join('');
}

function draftCode(family, grade, level, r) {
  const shift = r.int(1, 4);
  const word = r.pick(WORDS);
  const start = r.int(0, 18);
  const pairs = [0, 1, 2].map(offset => {
    const from = String.fromCharCode(65 + start + offset);
    return [from, shiftWord(from, shift)];
  });
  const encoded = shiftWord(word, shift);
  const answer = level >= 3 ? word : encoded;
  const shown = level >= 3 ? encoded : word;
  const wrongShift = shiftWord(shown, level >= 3 ? -(shift + 1) : shift + 1);
  return pack({
    family,
    prompt: hook(r, level >= 3 ? `The code turns ${shown} back into a word. What is the word?` : `What is ${word} in this code?`),
    answer,
    hint: 'Move every letter the same number of places. Keep the letter order.',
    explanation: `The shift is ${shift}, so ${shown} matches ${answer}.`,
    givens: { word: shown, mode: level >= 3 ? 'decode' : 'code' },
    visual: {
      kind: 'v3-class-3-code', pairs,
      description: `Code key. ${pairs.map(pair => `${pair[0]} to ${pair[1]}`).join(', ')}.`,
    },
    choices: said(answer, [
      [wrongShift, 'class-3-shift-letter'],
      [shiftWord(shown, level >= 3 ? 1 - shift : shift - 1), 'code-order'],
      [[...answer].reverse().join(''), 'wrong-transform'],
    ]),
  });
}

function solveCode(question) {
  const pairs = question.visual.pairs;
  const shift = pairs[0][1].charCodeAt(0) - pairs[0][0].charCodeAt(0);
  if (pairs.some(pair => pair[1].charCodeAt(0) - pair[0].charCodeAt(0) !== shift)) throw new Error('code');
  const word = question.proof.givens.word;
  return question.proof.givens.mode === 'decode' ? shiftWord(word, -shift) : shiftWord(word, shift);
}

function squareName(col, row) {
  return `${'ABCDE'[col]}${row + 1}`;
}

function draftCompass(family, grade, level, r) {
  const col = r.int(0, 4);
  const row = r.int(0, 4);
  const steps = [];
  let x = col;
  let y = row;
  const count = level === 1 ? 1 : level === 2 ? 2 : 3;
  for (let index = 0; index < count; index++) {
    const dir = r.pick(['N', 'E', 'S', 'W']);
    const distance = r.int(1, 2);
    const [dx, dy] = DIRS[dir];
    x += dx * distance;
    y += dy * distance;
    if (x < 0 || y < 0 || x > 4 || y > 4) throw new QuestionRetry('compass');
    steps.push([dir, distance]);
  }
  const answer = squareName(x, y);
  const wrongs = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1], [col, row]]
    .filter(([cx, cy]) => cx >= 0 && cy >= 0 && cx <= 4 && cy <= 4 && squareName(cx, cy) !== answer)
    .slice(0, 3);
  if (wrongs.length < 3) throw new QuestionRetry('compass');
  const words = { N: 'north', E: 'east', S: 'south', W: 'west' };
  const route = steps.map(([dir, distance]) => `${words[dir]} ${distance}`).join(', then ');
  return pack({
    family,
    prompt: hook(r, `Start at the coral dot. Go ${route}. Which square do you reach?`),
    answer,
    hint: 'East and west change the letter. North and south change the number.',
    explanation: `The walk ends at ${answer}.`,
    givens: { steps },
    visual: {
      kind: 'v3-class-3-map', col, row,
      description: `Map with columns A to E and rows 1 to 5. North is up. The coral dot starts at ${squareName(col, row)}.`,
    },
    choices: said(answer, wrongs.map(([cx, cy], index) => [squareName(cx, cy), index === 0 ? 'class-3-compass-step' : 'turn-frame'])),
  });
}

function solveCompass(question) {
  let { col, row } = question.visual;
  for (const [dir, distance] of question.proof.givens.steps) {
    const move = DIRS[dir];
    if (!move) throw new Error('compass');
    col += move[0] * distance;
    row += move[1] * distance;
  }
  if (col < 0 || row < 0 || col > 4 || row > 4) throw new Error('compass');
  return squareName(col, row);
}

function tileKey(cells) {
  return cells.map(line => line.join('')).join('/');
}

function tileVisual(cells, compact, mirror = false) {
  return {
    kind: 'v3-class-3-tiles', cells, compact, ...(mirror ? { mirror: true } : {}),
    description: `${compact ? 'Small tile' : 'Tile'} pattern ${tileKey(cells)}.${mirror ? ' A dashed mirror line is on the right.' : ''}`,
  };
}

function mirrorCells(cells) {
  return cells.map(line => [...line].reverse());
}

function draftMirrorSign(family, grade, level, r) {
  const rows = 3;
  const cols = level === 1 ? 3 : 4;
  const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => r.int(0, 1)));
  if (cells.flat().reduce((sum, value) => sum + value, 0) < 2) cells[0][0] = 1;
  const mirrored = mirrorCells(cells);
  if (tileKey(mirrored) === tileKey(cells)) cells[0][0] = cells[0][0] ? 0 : 1;
  const flipped = mirrorCells(cells);
  const vertical = [...cells].reverse();
  const changed = cells.map(line => [...line]);
  changed[0][0] = changed[0][0] ? 0 : 1;
  const options = [flipped, cells, vertical, changed];
  if (new Set(options.map(tileKey)).size < 4) throw new QuestionRetry('tiles');
  const correct = tileVisual(flipped, true);
  const alts = [
    wrong(tileKey(cells), 'wrong-transform', tileVisual(cells, true)),
    wrong(tileKey(vertical), 'class-3-shift-letter', tileVisual(vertical, true)),
    wrong(tileKey(changed), 'ignored-condition', tileVisual(changed, true)),
  ];
  return pack({
    family,
    prompt: hook(r, 'Which small picture is the left-right mirror of this tile?'),
    answer: tileKey(flipped),
    hint: 'Reverse each row from left to right. Do not turn the tile upside down.',
    explanation: 'The matching picture reverses every row across a vertical mirror.',
    givens: { ask: 'mirror' },
    visual: tileVisual(cells, false, true),
    choices: pictureChoices(tileKey(flipped), correct, alts),
  });
}

function solveMirrorSign(question) {
  matchPictures(question, visual => tileKey(visual.cells));
  const wanted = tileKey(mirrorCells(question.visual.cells));
  if (!question.options.includes(wanted)) throw new Error('tiles');
  return wanted;
}

function draftPaths(family, grade, level, r) {
  const [width, height] = level === 1 ? [2, 2] : r.pick([[3, 2], [4, 2], [5, 2], [2, 3], [3, 3], [4, 3], [2, 4], [3, 4]]);
  const blocked = [];
  const wanted = level === 1 ? 0 : level === 2 ? 1 : 2;
  while (blocked.length < wanted) {
    const cell = [r.int(0, width), r.int(0, height)];
    const edge = (cell[0] === 0 && cell[1] === 0) || (cell[0] === width && cell[1] === height);
    if (!edge && !blocked.some(item => item[0] === cell[0] && item[1] === cell[1])) blocked.push(cell);
  }
  const answer = countPaths(width, height, blocked);
  const open = countPaths(width, height, []);
  if (answer < 1 || (blocked.length && answer === open)) throw new QuestionRetry('paths');
  const many = blocked.length > 1;
  const blockText = blocked.length
    ? ` ${blocked.map(cell => `The crossing ${cell[0]} across and ${cell[1]} up is blocked.`).join(' ')}`
    : ' No crossing is blocked.';
  return pack({
    family,
    prompt: blocked.length
      ? `On this ${width} by ${height} grid, how many right-or-up routes from S to F avoid the blocked ${many ? 'crossings' : 'crossing'}?`
      : `On this ${width} by ${height} grid, how many right-or-up routes go from S to F?`,
    answer,
    hint: blocked.length
      ? 'Move only right or up. Do not pass through a crossing marked x.'
      : 'Move only right or up. Count every route from S to F.',
    explanation: blocked.length
      ? `There ${answer === 1 ? 'is 1 route that stays' : `are ${answer} routes that stay`} on the streets and avoid the block.`
      : `There ${answer === 1 ? 'is 1 route that moves' : `are ${answer} routes that move`} only right or up.`,
    givens: { width, height },
    visual: {
      kind: 'v3-class-3-paths', width, height, blocked,
      description: `Street grid ${width} across and ${height} up, from S at the lower left to F at the upper right.${blockText}`,
    },
    choices: biased(r, answer, [
      { value: open, code: 'class-3-path-block' },
      { value: width + height, code: 'path-constraint' },
      { value: answer + 1, code: 'missing-step' },
      { value: Math.max(1, answer - 1), code: 'ignored-condition' },
    ], { min: 1, max: 40 }),
  });
}

function solvePaths(question) {
  const { width, height, blocked } = question.visual;
  return countPaths(width, height, blocked);
}

const MENU_SETS = [
  { a: 'sandwiches', b: 'drinks', one: 'meal', many: 'meals', place: 'A cafe has' },
  { a: 'shirts', b: 'caps', one: 'outfit', many: 'outfits', place: 'Ravi has' },
  { a: 'cones', b: 'flavours', one: 'ice cream', many: 'ice creams', place: 'A stall has' },
  { a: 'bowls', b: 'toppings', one: 'snack', many: 'snacks', place: 'A school canteen has' },
  { a: 'hats', b: 'scarves', one: 'costume', many: 'costumes', place: 'The drama club has' },
  { a: 'wraps', b: 'fillings', one: 'lunch', many: 'lunches', place: 'A food truck has' },
];

function draftWays(family, grade, level, r) {
  const mains = r.int(2, 6);
  const drinks = r.int(2, 5);
  const banned = level >= 3 ? 1 : 0;
  const answer = mains * drinks - banned;
  const set = r.pick(MENU_SETS);
  return pack({
    family,
    prompt: `${set.place} ${mains} ${set.a} and ${drinks} ${set.b}. One ${set.one} uses 1 of each.${banned ? ` One ${set.one} cannot be made.` : ''} How many different ${set.many} can be made?`,
    answer,
    hint: banned
      ? 'Multiply the choices in each group, then take away the one that cannot be made.'
      : 'Multiply the number of choices in one group by the number in the other.',
    explanation: banned ? `${mains} x ${drinks} = ${mains * drinks}, then 1 sold out leaves ${answer}.` : `${mains} x ${drinks} = ${answer}.`,
    givens: { mains, drinks, banned },
    choices: biased(r, answer, [
      { value: mains + drinks, code: 'class-3-ways-product' },
      { value: mains * drinks, code: 'missing-step' },
      { value: mains * drinks + 1, code: 'ignored-condition' },
      { value: Math.max(1, answer - mains), code: 'wrong-operation' },
    ], { min: 1, max: 40 }),
  });
}

function solveWays(question) {
  const { mains, drinks, banned } = question.proof.givens;
  return mains * drinks - banned;
}

function clueHolds(value, clue) {
  if (clue.kind === 'ones') return value % 10 === clue.n;
  if (clue.kind === 'sum') return digitSum(value) === clue.n;
  if (clue.kind === 'even') return value % 2 === 0;
  if (clue.kind === 'odd') return value % 2 === 1;
  if (clue.kind === 'over') return value > clue.n;
  if (clue.kind === 'under') return value < clue.n;
  throw new Error('clue');
}

function draftTruth(family, grade, level, r) {
  const low = r.int(2, 6) * 10;
  const high = low + (level === 1 ? 5 : 7);
  const sample = r.int(low, high);
  const pool = [
    { kind: 'ones', n: sample % 10, text: `Ones digit is ${sample % 10}.` },
    { kind: 'ones', n: (sample + 3) % 10, text: `Ones digit is ${(sample + 3) % 10}.` },
    { kind: 'sum', n: digitSum(sample), text: `Digits add to ${digitSum(sample)}.` },
    { kind: 'sum', n: digitSum(sample) + 1, text: `Digits add to ${digitSum(sample) + 1}.` },
    { kind: 'even', n: 0, text: 'It is even.' },
    { kind: 'odd', n: 0, text: 'It is odd.' },
    { kind: 'over', n: low + 1, text: `It is over ${low + 1}.` },
    { kind: 'under', n: high - 1, text: `It is under ${high - 1}.` },
  ];
  const sets = [];
  const walk = (start, chosen) => {
    if (chosen.length === 3) {
      sets.push([...chosen]);
      return;
    }
    for (let index = start; index < pool.length; index++) {
      chosen.push(pool[index]);
      walk(index + 1, chosen);
      chosen.pop();
    }
  };
  walk(0, []);
  let clues = null;
  let answer = null;
  for (const set of r.shuffle(sets)) {
    const hits = [];
    for (let value = low; value <= high; value++) {
      if (set.filter(clue => clueHolds(value, clue)).length === 1) hits.push(value);
    }
    if (hits.length === 1) {
      clues = set;
      answer = hits[0];
      break;
    }
  }
  if (!clues) throw new QuestionRetry('truth');
  const others = [];
  for (let value = low; value <= high; value++) if (value !== answer) others.push(value);
  const side = r.int(0, 1) ? others.filter(value => value > answer) : others.filter(value => value < answer);
  const picked = (side.length >= 3 ? side : others).slice(0, 3);
  if (picked.length < 3) throw new QuestionRetry('truth');
  return pack({
    family,
    prompt: hook(r, `One clue is true. Code is ${low} to ${high}. ${clues.map(clue => clue.text).join(' ')} Which code fits?`),
    answer,
    hint: 'Keep a code only when exactly one clue is true.',
    explanation: `${answer} makes exactly one clue true. The others do not.`,
    givens: { low, high, need: 1, clues: clues.map(clue => ({ kind: clue.kind, n: clue.n })) },
    choices: said(String(answer), picked.map((value, index) => [String(value), index === 0 ? 'class-3-exactly-one' : 'ignored-condition'])),
  });
}

function solveTruth(question) {
  const { low, high, need, clues } = question.proof.givens;
  const hits = [];
  for (let value = low; value <= high; value++) {
    if (clues.filter(clue => clueHolds(value, clue)).length === need) hits.push(value);
  }
  if (hits.length !== 1) throw new Error('truth');
  return hits[0];
}

export const DRAFT = {
  'class-3-angle-mark': draftAngle,
  'class-3-mirror-pick': draftMirror,
  'class-3-grid-edge': draftGrid,
  'class-3-shape-pick': draftShape,
  'class-3-tower-view': draftTower,
  'class-3-cube-net': draftNet,
  'class-3-ruler-gap': draftRuler,
  'class-3-dial-read': draftDial,
  'class-3-balance-pan': draftBalance,
  'class-3-unit-sense': draftUnit,
  'class-3-jug-fill': draftJug,
  'class-3-clock-face': draftClock,
  'class-3-clock-pick': draftClockPick,
  'class-3-elapsed-bar': draftElapsed,
  'class-3-calendar-grid': draftCalendar,
  'class-3-timetable': draftTableTime,
  'class-3-price-board': draftBoard,
  'class-3-coin-pile': draftCoins,
  'class-3-change-slip': draftChange,
  'class-3-best-buy': draftBest,
  'class-3-budget-rule': draftBudget,
  'class-3-picto-key': draftPicto,
  'class-3-bar-scale': draftBars,
  'class-3-chart-move': draftChartMove,
  'class-3-tally-true': draftTally,
  'class-3-split-chart': draftSplit,
  'class-3-queue-rank': draftQueue,
  'class-3-signal-code': draftCode,
  'class-3-compass-walk': draftCompass,
  'class-3-mirror-sign': draftMirrorSign,
  'class-3-path-count': draftPaths,
  'class-3-ways-menu': draftWays,
  'class-3-truth-line': draftTruth,
};

export const SOLVE = {
  'class-3-angle-mark': solveAngle,
  'class-3-mirror-pick': solveMirror,
  'class-3-grid-edge': solveGrid,
  'class-3-shape-pick': solveShape,
  'class-3-tower-view': solveTower,
  'class-3-cube-net': solveNet,
  'class-3-ruler-gap': solveRuler,
  'class-3-dial-read': solveDial,
  'class-3-balance-pan': solveBalance,
  'class-3-unit-sense': solveUnit,
  'class-3-jug-fill': solveJug,
  'class-3-clock-face': solveClock,
  'class-3-clock-pick': solveClockPick,
  'class-3-elapsed-bar': solveElapsed,
  'class-3-calendar-grid': solveCalendar,
  'class-3-timetable': solveTableTime,
  'class-3-price-board': solveBoard,
  'class-3-coin-pile': solveCoins,
  'class-3-change-slip': solveChange,
  'class-3-best-buy': solveBest,
  'class-3-budget-rule': solveBudget,
  'class-3-picto-key': solvePicto,
  'class-3-bar-scale': solveBars,
  'class-3-chart-move': solveChartMove,
  'class-3-tally-true': solveTally,
  'class-3-split-chart': solveSplit,
  'class-3-queue-rank': solveQueue,
  'class-3-signal-code': solveCode,
  'class-3-compass-walk': solveCompass,
  'class-3-mirror-sign': solveMirrorSign,
  'class-3-path-count': solvePaths,
  'class-3-ways-menu': solveWays,
  'class-3-truth-line': solveTruth,
};
