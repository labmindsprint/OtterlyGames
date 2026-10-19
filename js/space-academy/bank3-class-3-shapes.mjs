// Real-paper style Class 3 geometry and data families: symmetry, solids, shape counting, perimeter,
// bar graphs, data tables and chance bags.
import { QuestionRetry } from './bank-shared.mjs';
import { NAMES } from './bank3-class-3-helpers.mjs';
import { LETTERS, count, numberQ, range, sum, textQ } from './bank3-class-3-kit.mjs';
import { SIDES } from './bank3-class-3-imo-art.mjs';

export const DRAFT = {};
export const SOLVE = {};
export const FAMILIES = {
  'class-3-letter-symmetry': { skill: 'symmetry', title: 'Find the letter with or without a line of symmetry' },
  'class-3-solid-riddle': { skill: 'solids', title: 'Name a solid from faces, edges and corners' },
  'class-3-shape-count': { skill: 'count', title: 'Count shapes in a row by shape, colour or sides' },
  'class-3-symmetry-lines': { skill: 'symmetry', title: 'Count the lines of symmetry of a shape' },
  'class-3-shape-perimeter': { skill: 'perimeter', title: 'Find a perimeter or a missing side' },
  'class-3-bars-sum': { skill: 'chart', title: 'Add or compare bars on a bar graph' },
  'class-3-bars-transfer': { skill: 'chart', title: 'Give away items and match a bar' },
  'class-3-bars-pair': { skill: 'chart', title: 'Find two bars that make a total' },
  'class-3-table-read': { skill: 'chart', title: 'Add and compare numbers in a data table' },
  'class-3-bag-chance': { skill: 'chart', title: 'Say which colour is most or least likely' },
};

// ---- letters with lines of symmetry ----
const VERTICAL = new Set('AHIMOTUVWXY');
const HORIZONTAL = new Set('BCDEHIKOX');
const SOME = new Set([...VERTICAL, ...HORIZONTAL]);
const LETTER_TESTS = {
  none: letter => !SOME.has(letter),
  some: letter => SOME.has(letter),
  both: letter => VERTICAL.has(letter) && HORIZONTAL.has(letter),
  vertical: letter => VERTICAL.has(letter) && !HORIZONTAL.has(letter),
  horizontal: letter => HORIZONTAL.has(letter) && !VERTICAL.has(letter),
};
const LETTER_ASKS = {
  none: ['Which capital letter has no line of symmetry?', 'cannot be folded into two matching halves'],
  some: ['Which capital letter has a line of symmetry?', 'folds into two matching halves'],
  both: ['Which capital letter has a line of symmetry both across and down?', 'matches when folded down the middle and across the middle'],
  vertical: ['Which capital letter folds into matching halves down the middle, but not across?', 'matches when folded down the middle only'],
  horizontal: ['Which capital letter folds into matching halves across the middle, but not down?', 'matches when folded across the middle only'],
};

function draftLetterSymmetry(family, grade, level, r) {
  const kind = level === 1 ? r.pick(['none', 'some', 'count']) : r.pick(['none', 'some', 'both', 'vertical', 'horizontal', 'count', 'none']);
  if (kind === 'count') {
    const set = r.shuffle(LETTERS.split('')).slice(0, 5).sort();
    const answer = set.filter(letter => SOME.has(letter)).length;
    if (answer < 1 || answer > 4) throw new QuestionRetry('letter count');
    const near = set.filter(letter => VERTICAL.has(letter) && !HORIZONTAL.has(letter)).length;
    return numberQ(r, {
      family,
      prompt: `How many of the letters ${set.join(', ')} have a line of symmetry?`,
      answer,
      hint: 'Imagine folding each letter in half. Do the two halves match?',
      explanation: `${set.filter(letter => SOME.has(letter)).join(', ')} fold into matching halves, so the answer is ${answer}.`,
      givens: { kind, set },
      wrongs: [[answer + 1, 'wrong-transform'], [answer - 1, 'missed-object'], [near || 5 - answer, 'ignored-condition']],
      min: 0, max: 5,
    });
  }
  const test = LETTER_TESTS[kind];
  const all = LETTERS.split('');
  const answer = r.pick(all.filter(test));
  const nonMatch = all.filter(letter => !test(letter));
  const partial = r.shuffle(nonMatch.filter(letter => SOME.has(letter)));
  const rest = r.shuffle(nonMatch.filter(letter => !SOME.has(letter)));
  const wrongs = [...partial.slice(0, 2), ...rest, ...partial.slice(2)].slice(0, 3);
  return textQ({
    family,
    prompt: LETTER_ASKS[kind][0],
    answer,
    hint: 'Imagine folding the letter in half. Check down the middle and across the middle.',
    explanation: `${answer} ${LETTER_ASKS[kind][1]}.`,
    givens: { kind },
    wrongs: wrongs.map(letter => [letter, 'wrong-transform']),
  });
}

function solveLetterSymmetry(question) {
  const { kind, set } = question.proof.givens;
  if (kind === 'count') return set.filter(letter => SOME.has(letter)).length;
  const matches = question.options.filter(LETTER_TESTS[kind]);
  if (matches.length !== 1) throw new Error('Exactly one letter must fit.');
  return matches[0];
}
DRAFT['class-3-letter-symmetry'] = draftLetterSymmetry;
SOLVE['class-3-letter-symmetry'] = solveLetterSymmetry;

// ---- solid riddles ----
const SOLIDS = [
  { name: 'cube', f: 6, e: 12, v: 8 },
  { name: 'cylinder', f: 2, e: 2, v: 0 },
  { name: 'cone', f: 1, e: 1, v: 1 },
  { name: 'sphere', f: 0, e: 0, v: 0 },
  { name: 'square pyramid', f: 5, e: 8, v: 5 },
  { name: 'triangular prism', f: 5, e: 9, v: 6 },
  { name: 'triangular pyramid', f: 4, e: 6, v: 4 },
  { name: 'pentagonal prism', f: 7, e: 15, v: 10 },
  { name: 'pentagonal pyramid', f: 6, e: 10, v: 6 },
  { name: 'hexagonal prism', f: 8, e: 18, v: 12 },
  { name: 'hexagonal pyramid', f: 7, e: 12, v: 7 },
];
const ROUND = new Set(['cylinder', 'cone', 'sphere']);
const num = (n, word) => (n === 0 ? `no ${word}s` : count(n, word));
const NOUN = { f: 'flat face', e: 'edge', v: 'corner' };
const NOUN_PLURAL = { f: 'flat faces', e: 'edges', v: 'corners' };

function draftSolid(family, grade, level, r) {
  const kind = r.pick(level === 1 ? ['riddle', 'fact'] : ['riddle', 'riddle', 'fact', 'extreme']);
  const easy = SOLIDS.slice(0, 7);
  const pool = level === 1 ? easy : SOLIDS;
  if (kind === 'fact') {
    const target = r.pick(pool);
    const key = r.pick(ROUND.has(target.name) ? ['f', 'v'] : ['f', 'e', 'v']);
    const answer = target[key];
    return numberQ(r, {
      family,
      prompt: `How many ${NOUN_PLURAL[key]} does a ${target.name} have?`,
      answer,
      hint: 'Picture the solid or hold one in your hand. Count each part once and do not count it twice.',
      explanation: `A ${target.name} has ${num(answer, NOUN[key])}.`,
      givens: { kind, name: target.name, key },
      wrongs: [[key === 'f' ? target.e : target.f, 'missed-object'], [answer + 1, 'counted-endpoints'], [answer - 1, 'counted-endpoints'], [target.v + target.f, 'included-extra']],
      min: 0, max: 20,
    });
  }
  if (kind === 'extreme') {
    const key = r.pick(['f', 'e', 'v']);
    const most = r.pick([true, false]);
    const options = r.shuffle(pool).slice(0, 4);
    const best = most ? Math.max(...options.map(solid => solid[key])) : Math.min(...options.map(solid => solid[key]));
    if (options.filter(solid => solid[key] === best).length !== 1) throw new QuestionRetry('not unique');
    const answer = options.find(solid => solid[key] === best);
    return textQ({
      family,
      prompt: `Which of these solids has the ${most ? 'most' : 'fewest'} ${NOUN_PLURAL[key]}?`,
      answer: answer.name,
      hint: `Count the ${NOUN_PLURAL[key]} of each solid. Compare the four numbers.`,
      explanation: `The ${answer.name} has ${num(best, NOUN[key])}, the ${most ? 'most' : 'fewest'}.`,
      givens: { kind, key, most },
      wrongs: options.filter(solid => solid !== answer).map(solid => [solid.name, 'missed-object']),
    });
  }
  const target = r.pick(pool);
  const modes = ROUND.has(target.name) ? ['fv'] : ['fv', 'ev', 'fe'];
  const mode = r.pick(modes);
  const fields = { fv: ['f', 'v'], ev: ['e', 'v'], fe: ['f', 'e'] }[mode];
  const options = [target, ...r.shuffle(pool.filter(solid => solid !== target)).slice(0, 3)];
  const fits = solid => fields.every(key => solid[key] === target[key]);
  if (options.filter(fits).length !== 1) throw new QuestionRetry('solid clue is not unique');
  const clue = fields.map(key => num(target[key], NOUN[key])).join(' and ');
  const first = options.filter(solid => solid !== target);
  return textQ({
    family,
    prompt: `I have ${clue}. What solid am I?`,
    answer: target.name,
    hint: 'Check the clues against each solid one by one. Only one solid fits both clues.',
    explanation: `A ${target.name} has ${clue}.`,
    givens: { kind, mode, values: fields.map(key => target[key]) },
    wrongs: first.map(solid => [solid.name, 'missed-object']),
  });
}

function solveSolid(question) {
  const g = question.proof.givens;
  if (g.kind === 'fact') return SOLIDS.find(solid => solid.name === g.name)[g.key];
  if (g.kind === 'extreme') {
    const shown = SOLIDS.filter(solid => question.options.includes(solid.name));
    const best = g.most ? Math.max(...shown.map(solid => solid[g.key])) : Math.min(...shown.map(solid => solid[g.key]));
    return shown.find(solid => solid[g.key] === best).name;
  }
  const fields = { fv: ['f', 'v'], ev: ['e', 'v'], fe: ['f', 'e'] }[g.mode];
  const matches = SOLIDS.filter(solid => question.options.includes(solid.name) && fields.every((key, index) => solid[key] === g.values[index]));
  if (matches.length !== 1) throw new Error('Exactly one solid must fit.');
  return matches[0].name;
}
DRAFT['class-3-solid-riddle'] = draftSolid;
SOLVE['class-3-solid-riddle'] = solveSolid;

// ---- counting shapes in a row ----
const SHAPES = ['circle', 'triangle', 'square', 'diamond', 'pentagon', 'hexagon'];
const SHAPE_PLURAL = { circle: 'circles', triangle: 'triangles', square: 'squares', diamond: 'diamonds', pentagon: 'pentagons', hexagon: 'hexagons' };
const FILLS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];

function draftShapeCount(family, grade, level, r) {
  const total = r.int(8, 12);
  const palette = r.shuffle(SHAPES).slice(0, level === 1 ? 3 : 4);
  const fills = r.shuffle(FILLS).slice(0, 3);
  const items = Array.from({ length: total }, () => ({ shape: r.pick(palette), color: r.pick(fills) }));
  const kind = r.pick(level === 1 ? ['shape', 'color'] : ['shape', 'color', 'sides', 'more', 'both', 'corners']);
  const shape = r.pick(palette);
  const other = r.pick(palette.filter(name => name !== shape));
  const color = r.pick(fills);
  const sides = r.pick([...new Set(palette.map(name => SIDES[name]))].filter(value => value > 0));
  const by = {
    shape: item => item.shape === shape,
    color: item => item.color === color,
    sides: item => SIDES[item.shape] === sides,
    corners: item => SIDES[item.shape] === 0,
    both: item => item.shape === shape && item.color === color,
  };
  let answer;
  let prompt;
  let near;
  if (kind === 'more') {
    answer = items.filter(item => item.shape === shape).length - items.filter(item => item.shape === other).length;
    prompt = `How many more ${SHAPE_PLURAL[shape]} than ${SHAPE_PLURAL[other]} are there?`;
    near = items.filter(item => item.shape === shape).length;
  } else {
    answer = items.filter(by[kind]).length;
    prompt = {
      shape: `How many ${SHAPE_PLURAL[shape]} are there?`,
      color: `How many ${color} shapes are there?`,
      sides: `How many shapes have exactly ${sides} sides?`,
      corners: 'How many shapes have no corners?',
      both: `How many ${color} ${SHAPE_PLURAL[shape]} are there?`,
    }[kind];
    near = kind === 'sides' ? items.filter(item => item.shape === palette.find(name => SIDES[name] === sides)).length : total;
  }
  if (kind === 'corners' && !palette.includes('circle')) throw new QuestionRetry('no circle');
  if (answer < 1 || answer > 9) throw new QuestionRetry('count range');
  const visual = {
    kind: 'v3-class-3-seq', items, cols: 4,
    description: `Shapes in a grid: ${items.map(item => `${item.color} ${item.shape}`).join(', ')}.`,
  };
  return numberQ(r, {
    family,
    prompt,
    answer,
    hint: kind === 'more' ? 'Count each kind of shape on its own, then take the smaller count away.' : 'Touch each shape once as you count. Check the sides, shape or colour each time.',
    explanation: `Counting carefully gives ${answer}.`,
    givens: { kind, shape, other, color, sides },
    visual,
    wrongs: [[near === answer ? answer + 1 : near, 'missed-object'], [answer + 1, 'included-extra'], [answer - 1, 'missed-object'], [total, 'ignored-condition']],
    min: 0, max: 14,
  });
}

function solveShapeCount(question) {
  const { kind, shape, other, color, sides } = question.proof.givens;
  const { items } = question.visual;
  if (kind === 'more') return items.filter(item => item.shape === shape).length - items.filter(item => item.shape === other).length;
  const by = {
    shape: item => item.shape === shape,
    color: item => item.color === color,
    sides: item => SIDES[item.shape] === sides,
    corners: item => SIDES[item.shape] === 0,
    both: item => item.shape === shape && item.color === color,
  };
  return items.filter(by[kind]).length;
}
DRAFT['class-3-shape-count'] = draftShapeCount;
SOLVE['class-3-shape-count'] = solveShapeCount;

// ---- lines of symmetry of shapes ----
const LINES = [
  ['square', 4], ['rectangle', 2], ['equilateral triangle', 3], ['regular pentagon', 5], ['regular hexagon', 6],
  ['kite', 1], ['rhombus', 2], ['isosceles triangle', 1],
];

const aOrAn = word => (/^[aeiou]/.test(word) ? 'an' : 'a');
const capA = word => (/^[aeiou]/.test(word) ? 'An' : 'A');

function draftSymmetryLines(family, grade, level, r) {
  const kind = level === 1 ? r.pick(['count', 'most']) : r.pick(['count', 'most', 'fewest', 'exactly', 'sum']);
  const picks = r.shuffle(LINES).slice(0, 4);
  if (kind === 'count') {
    const [name, lines] = picks[0];
    return numberQ(r, {
      family,
      prompt: `How many lines of symmetry does ${aOrAn(name)} ${name} have?`,
      answer: lines,
      hint: 'Picture folding the shape so both halves match. Count each different fold.',
      explanation: `${capA(name)} ${name} has ${lines} ${lines === 1 ? 'line' : 'lines'} of symmetry.`,
      givens: { kind, name },
      wrongs: [[lines + 1, 'wrong-transform'], [lines - 1, 'missed-object'], [lines === 4 ? 2 : lines * 2, 'ignored-condition']],
      min: 0, max: 8,
    });
  }
  if (kind === 'sum') {
    const [[a, x], [b, y]] = picks;
    if (a === b) throw new QuestionRetry('same');
    return numberQ(r, {
      family,
      prompt: `${capA(a)} ${a} and ${aOrAn(b)} ${b} are drawn. How many lines of symmetry do they have in all?`,
      answer: x + y,
      hint: 'Find the lines of symmetry of each shape, then add the two numbers.',
      explanation: `${x} + ${y} = ${x + y}.`,
      givens: { kind, names: [a, b] },
      wrongs: [[Math.max(x, y), 'missing-step'], [Math.abs(x - y), 'wrong-operation'], [x * y, 'wrong-operation']],
      min: 1, max: 14,
    });
  }
  const counts = picks.map(([, value]) => value);
  const wanted = kind === 'most' ? Math.max(...counts) : kind === 'fewest' ? Math.min(...counts) : r.pick(counts);
  if (counts.filter(value => value === wanted).length !== 1) throw new QuestionRetry('not unique');
  const answer = picks.find(([, value]) => value === wanted)[0];
  const prompt = {
    most: 'Which shape has the most lines of symmetry?',
    fewest: 'Which shape has the fewest lines of symmetry?',
    exactly: `Which shape has exactly ${wanted} ${wanted === 1 ? 'line' : 'lines'} of symmetry?`,
  }[kind];
  return textQ({
    family,
    prompt,
    answer,
    hint: 'Work out the lines of symmetry of each shape. Then compare the numbers.',
    explanation: `The ${answer} has ${wanted} ${wanted === 1 ? 'line' : 'lines'} of symmetry.`,
    givens: { kind, wanted, names: picks.map(([name]) => name) },
    wrongs: picks.filter(([name]) => name !== answer).map(([name]) => [name, 'wrong-transform']),
  });
}

function solveSymmetryLines(question) {
  const { kind, name, names, wanted } = question.proof.givens;
  const table = new Map(LINES);
  if (kind === 'count') return table.get(name);
  if (kind === 'sum') return table.get(names[0]) + table.get(names[1]);
  const shown = question.options.map(option => [option, table.get(option)]);
  const target = kind === 'most' ? Math.max(...shown.map(item => item[1])) : kind === 'fewest' ? Math.min(...shown.map(item => item[1])) : wanted;
  return shown.find(item => item[1] === target)[0];
}
DRAFT['class-3-symmetry-lines'] = draftSymmetryLines;
SOLVE['class-3-symmetry-lines'] = solveSymmetryLines;

// ---- perimeter ----
const REGULAR = [['hexagon', 6], ['pentagon', 5], ['octagon', 8], ['triangle', 3]];

function draftPerimeter(family, grade, level, r) {
  const kind = level === 1 ? r.pick(['square', 'rectangle']) : r.pick(['square', 'rectangle', 'triangle', 'regular', 'missing', 'fence']);
  const unit = r.pick(['cm', 'm']);
  const u = unit === 'cm' ? 'centimetres' : 'metres';
  const tall = level === 1 ? 12 : 25;
  if (kind === 'square') {
    const side = r.int(4, tall);
    return numberQ(r, {
      family, prompt: `A square has a side of ${side} ${unit}. What is its perimeter in ${u}?`, answer: side * 4,
      hint: 'The perimeter is the distance all the way round. A square has 4 equal sides.',
      explanation: `${side} × 4 = ${side * 4} ${unit}.`, givens: { kind, side },
      wrongs: [[side * side, 'area-perimeter'], [side * 2, 'missing-step'], [side * 3, 'missing-step']], min: 4, max: 400,
    });
  }
  if (kind === 'rectangle' || kind === 'fence') {
    const length = r.int(6, tall + 8);
    const width = r.int(3, length - 1);
    const answer = 2 * (length + width);
    const prompt = kind === 'fence'
      ? `${NAMES[r.int(0, NAMES.length - 1)]} puts a fence round a field that is ${length} ${unit} long and ${width} ${unit} wide. How long is the fence in ${u}?`
      : `A rectangle is ${length} ${unit} long and ${width} ${unit} wide. What is its perimeter in ${u}?`;
    return numberQ(r, {
      family, prompt, answer,
      hint: 'Add all four sides. Opposite sides of a rectangle are equal.',
      explanation: `${length} + ${width} + ${length} + ${width} = ${answer} ${unit}.`, givens: { kind, length, width },
      wrongs: [[length * width, 'area-perimeter'], [length + width, 'missing-step'], [2 * length + width, 'missing-dimension']], min: 6, max: 400,
    });
  }
  if (kind === 'triangle') {
    const a = r.int(5, 20);
    const b = r.int(5, 20);
    const c = r.int(Math.abs(a - b) + 1, Math.min(a + b - 1, 24));
    return numberQ(r, {
      family, prompt: `The sides of a triangle are ${a} ${unit}, ${b} ${unit} and ${c} ${unit}. What is the perimeter in ${u}?`, answer: a + b + c,
      hint: 'The perimeter is the total length of all the sides.',
      explanation: `${a} + ${b} + ${c} = ${a + b + c} ${unit}.`, givens: { kind, sides: [a, b, c] },
      wrongs: [[a + b, 'missing-step'], [Math.max(a, b, c) * 3, 'wrong-operation'], [a * b, 'area-perimeter']], min: 6, max: 80,
    });
  }
  if (kind === 'regular') {
    const [name, sides] = r.pick(REGULAR);
    const side = r.int(3, level === 2 ? 12 : 20);
    return numberQ(r, {
      family, prompt: `A regular ${name} has ${sides} equal sides. Each side is ${side} ${unit}. What is its perimeter in ${u}?`, answer: sides * side,
      hint: 'Every side is the same length. Multiply the number of sides by the length of one side.',
      explanation: `${sides} × ${side} = ${sides * side} ${unit}.`, givens: { kind, sides, side },
      wrongs: [[(sides - 1) * side, 'counted-endpoints'], [(sides + 1) * side, 'included-extra'], [sides + side, 'wrong-operation']], min: 6, max: 400,
    });
  }
  const length = r.int(8, 30);
  const width = r.int(3, length - 2);
  const total = 2 * (length + width);
  return numberQ(r, {
    family, prompt: `A rectangle has a perimeter of ${total} ${unit}. Its length is ${length} ${unit}. What is its width in ${u}?`, answer: width,
    hint: 'Half of the perimeter is one length plus one width. Take the length away from that half.',
    explanation: `${total} ÷ 2 = ${total / 2}. ${total / 2} − ${length} = ${width} ${unit}.`, givens: { kind, total, length },
    wrongs: [[total / 2, 'missing-step'], [total - length, 'missing-dimension'], [total / 2 - length * 2 < 1 ? width + 2 : total / 2 - length * 2, 'wrong-operation']], min: 1, max: 100,
  });
}

function solvePerimeter(question) {
  const g = question.proof.givens;
  if (g.kind === 'square') return g.side * 4;
  if (g.kind === 'rectangle' || g.kind === 'fence') return 2 * (g.length + g.width);
  if (g.kind === 'triangle') return sum(g.sides);
  if (g.kind === 'regular') return g.sides * g.side;
  return g.total / 2 - g.length;
}
DRAFT['class-3-shape-perimeter'] = draftPerimeter;
SOLVE['class-3-shape-perimeter'] = solvePerimeter;

// ---- bar graphs ----
const THINGS = ['toy cars', 'stickers', 'marbles', 'story books', 'stamps', 'cards'];

function barVisual(labels, values, scale, thing) {
  return {
    kind: 'v3-class-3-bars', labels, values, scale,
    description: `Bar graph of ${thing}, marked every ${scale}. ${labels.map((label, index) => `${label} ${values[index]}`).join(', ')}.`,
  };
}

function distinctBars(r, level) {
  const scale = r.pick([2, 5, 10]);
  const labels = r.shuffle(NAMES).slice(0, 4);
  const heights = r.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  return { scale, labels, values: heights.map(height => height * scale), thing: r.pick(THINGS), level };
}

function draftBarsSum(family, grade, level, r) {
  const { scale, labels, values, thing } = distinctBars(r, level);
  const kind = level === 1 ? r.pick(['two', 'gap']) : r.pick(['two', 'all', 'gap', 'need']);
  const [i, j] = r.shuffle([0, 1, 2, 3]).slice(0, 2);
  const high = values[i] > values[j] ? i : j;
  const low = high === i ? j : i;
  const sub = `The bar graph shows how many ${thing} each child has.`;
  let prompt;
  let answer;
  let explanation;
  let wrongs;
  if (kind === 'two') {
    answer = values[i] + values[j];
    prompt = `${sub} How many do ${labels[i]} and ${labels[j]} have together?`;
    explanation = `${values[i]} + ${values[j]} = ${answer}.`;
    wrongs = [[values[high] - values[low], 'graph-difference'], [values[i] * scale, 'scale-interval'], [sum(values), 'included-extra']];
  } else if (kind === 'all') {
    answer = sum(values);
    prompt = `${sub} How many do all four children have in all?`;
    explanation = `${values.join(' + ')} = ${answer}.`;
    wrongs = [[answer - Math.min(...values), 'missed-object'], [answer - Math.max(...values), 'missed-object'], [Math.max(...values), 'missing-step']];
  } else if (kind === 'gap') {
    answer = Math.max(...values) - Math.min(...values);
    prompt = `${sub} How many more does the child with the most have than the child with the fewest?`;
    explanation = `${Math.max(...values)} − ${Math.min(...values)} = ${answer}.`;
    wrongs = [[Math.max(...values) + Math.min(...values), 'graph-difference'], [Math.max(...values), 'missing-step'], [answer + scale, 'scale-interval']];
  } else {
    answer = values[high] - values[low];
    prompt = `${sub} How many more must ${labels[low]} get to have as many as ${labels[high]}?`;
    explanation = `${values[high]} − ${values[low]} = ${answer}.`;
    wrongs = [[values[high] + values[low], 'graph-difference'], [values[low], 'missing-step'], [answer + scale, 'scale-interval']];
  }
  return numberQ(r, {
    family, prompt, answer,
    hint: 'Read each bar against the scale first. Then add or take away the numbers.',
    explanation, givens: { kind, i, j, high, low },
    visual: barVisual(labels, values, scale, thing), wrongs, min: 1, max: 400,
  });
}

function solveBarsSum(question) {
  const { kind, i, j, high, low } = question.proof.givens;
  const { values } = question.visual;
  if (kind === 'two') return values[i] + values[j];
  if (kind === 'all') return sum(values);
  if (kind === 'gap') return Math.max(...values) - Math.min(...values);
  return values[high] - values[low];
}
DRAFT['class-3-bars-sum'] = draftBarsSum;
SOLVE['class-3-bars-sum'] = solveBarsSum;

function draftBarsTransfer(family, grade, level, r) {
  const { scale, labels, values, thing } = distinctBars(r, level);
  const owner = r.pick(NAMES.filter(name => !labels.includes(name)));
  const target = r.int(0, 3);
  const given = r.int(1, level === 1 ? 3 : 8) * scale;
  const start = values[target] + given;
  if (start > 99) throw new QuestionRetry('too many');
  const wrongs = labels.filter((_, index) => index !== target).map(label => [label, 'graph-difference']);
  const plus = values.findIndex(value => value === start + given);
  const trap = values.findIndex(value => value === start);
  return textQ({
    family,
    prompt: `The bar graph shows the ${thing} of four friends. ${owner} has ${start} ${thing}. ${owner} gives ${given} away. Now ${owner} has the same number as which friend?`,
    answer: labels[target],
    hint: 'Take away what is given. Then find the bar that shows that number.',
    explanation: `${start} − ${given} = ${values[target]}, which is the bar for ${labels[target]}.`,
    givens: { start, given },
    visual: barVisual(labels, values, scale, thing),
    wrongs: [...wrongs.filter(([label]) => label === labels[plus] || label === labels[trap]), ...wrongs.filter(([label]) => label !== labels[plus] && label !== labels[trap])],
  });
}

function solveBarsTransfer(question) {
  const { start, given } = question.proof.givens;
  const { labels, values } = question.visual;
  return labels[values.indexOf(start - given)];
}
DRAFT['class-3-bars-transfer'] = draftBarsTransfer;
SOLVE['class-3-bars-transfer'] = solveBarsTransfer;

function draftBarsPair(family, grade, level, r) {
  const { scale, labels, values, thing } = distinctBars(r, level);
  const pairs = [];
  for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) pairs.push([a, b, values[a] + values[b]]);
  const [pa, pb, total] = r.pick(pairs);
  if (pairs.filter(pair => pair[2] === total).length !== 1) throw new QuestionRetry('pair not unique');
  const text = ([a, b]) => `${labels[a]} and ${labels[b]}`;
  const others = r.shuffle(pairs.filter(pair => pair[2] !== total));
  return textQ({
    family,
    prompt: `The bar graph shows the ${thing} of four friends. Which two friends have ${total} ${thing} together?`,
    answer: text([pa, pb]),
    hint: 'Read every bar. Then add pairs of bars until the total matches.',
    explanation: `${values[pa]} + ${values[pb]} = ${total}.`,
    givens: { total },
    visual: barVisual(labels, values, scale, thing),
    wrongs: others.map(pair => [text(pair), 'missing-step']),
  });
}

function solveBarsPair(question) {
  const { labels, values } = question.visual;
  const { total } = question.proof.givens;
  const match = question.options.filter(option => {
    const [a, b] = option.split(' and ').map(name => values[labels.indexOf(name)]);
    return a + b === total;
  });
  if (match.length !== 1) throw new Error('Exactly one pair must fit.');
  return match[0];
}
DRAFT['class-3-bars-pair'] = draftBarsPair;
SOLVE['class-3-bars-pair'] = solveBarsPair;

// ---- data tables ----
const TABLES = [
  ['Books borrowed', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']],
  ['Ice creams sold', ['Mint', 'Mango', 'Berry', 'Vanilla', 'Cocoa', 'Lemon']],
  ['Plants in the garden', ['Roses', 'Tulips', 'Daisies', 'Lilies', 'Ferns']],
  ['Visitors to the fair', ['Saturday', 'Sunday', 'Monday', 'Tuesday']],
  ['Goals scored', ['Reds', 'Blues', 'Greens', 'Golds', 'Pinks']],
];

function draftTableRead(family, grade, level, r) {
  const [title, names] = r.pick(TABLES);
  const labels = r.shuffle(names).slice(0, 4);
  const values = r.shuffle(range(12, level === 1 ? 49 : 98)).slice(0, 4);
  const rows = labels.map((left, index) => ({ left, right: String(values[index]) }));
  const kind = level === 1 ? r.pick(['two', 'gap']) : r.pick(['two', 'all', 'gap', 'more', 'both']);
  const [i, j] = r.shuffle([0, 1, 2, 3]).slice(0, 2);
  const visual = { kind: 'v3-class-3-datatable', title, rows, description: `Data table of ${title.toLowerCase()}. ${rows.map(row => `${row.left} ${row.right}`).join(', ')}.` };
  const high = Math.max(...values);
  const low = Math.min(...values);
  const base = { family, visual, hint: 'Read the numbers from the table. Add or take away carefully.', givens: { kind, i, j } };
  if (kind === 'two') {
    return numberQ(r, { ...base, prompt: `Look at the table. How many are there for ${labels[i]} and ${labels[j]} together?`, answer: values[i] + values[j],
      explanation: `${values[i]} + ${values[j]} = ${values[i] + values[j]}.`, wrongs: [[Math.abs(values[i] - values[j]), 'graph-difference'], [sum(values), 'included-extra'], [values[i] + values[j] + 10, 'place-shift']], min: 10, max: 400 });
  }
  if (kind === 'all') {
    return numberQ(r, { ...base, prompt: 'Look at the table. What is the total of all four numbers?', answer: sum(values),
      explanation: `${values.join(' + ')} = ${sum(values)}.`, wrongs: [[sum(values) - low, 'missed-object'], [sum(values) - high, 'missed-object'], [sum(values) + 10, 'place-shift']], min: 40, max: 400 });
  }
  if (kind === 'gap') {
    return numberQ(r, { ...base, prompt: 'Look at the table. How many more is the biggest number than the smallest number?', answer: high - low,
      explanation: `${high} − ${low} = ${high - low}.`, wrongs: [[high + low, 'graph-difference'], [high, 'missing-step'], [high - low + 10, 'place-shift']], min: 1, max: 100 });
  }
  if (kind === 'more') {
    const gap = Math.abs(values[i] - values[j]);
    const smaller = values[i] < values[j] ? i : j;
    const bigger = smaller === i ? j : i;
    if (values.filter(value => value === values[bigger]).length !== 1) throw new QuestionRetry('not unique');
    return textQ({ ...base, prompt: `Look at the table. Which one has ${gap} more than ${labels[smaller]}?`, answer: labels[bigger],
      explanation: `${values[smaller]} + ${gap} = ${values[bigger]}, which is ${labels[bigger]}.`,
      givens: { kind, smaller, gap },
      wrongs: labels.filter((_, index) => index !== bigger).map(label => [label, 'graph-difference']) });
  }
  const gap = Math.abs(values[i] - values[j]);
  return numberQ(r, { ...base, prompt: `Look at the table. How many fewer are there for ${labels[values[i] < values[j] ? i : j]} than for ${labels[values[i] < values[j] ? j : i]}?`, answer: gap,
    explanation: `${Math.max(values[i], values[j])} − ${Math.min(values[i], values[j])} = ${gap}.`, wrongs: [[values[i] + values[j], 'graph-difference'], [gap + 10, 'place-shift'], [Math.max(values[i], values[j]), 'missing-step']], min: 1, max: 100 });
}

function solveTableRead(question) {
  const { kind, i, j, smaller, gap } = question.proof.givens;
  const values = question.visual.rows.map(row => Number(row.right));
  if (kind === 'two') return values[i] + values[j];
  if (kind === 'all') return sum(values);
  if (kind === 'gap') return Math.max(...values) - Math.min(...values);
  if (kind === 'more') return question.visual.rows[values.indexOf(values[smaller] + gap)].left;
  return Math.abs(values[i] - values[j]);
}
DRAFT['class-3-table-read'] = draftTableRead;
SOLVE['class-3-table-read'] = solveTableRead;

// ---- chance bags ----
const BALLS = ['red', 'blue', 'green', 'yellow', 'white', 'black'];

function draftBag(family, grade, level, r) {
  const colours = r.shuffle(BALLS).slice(0, level === 1 ? 3 : 4);
  const counts = r.shuffle(range(1, 9)).slice(0, colours.length);
  const list = colours.map((name, index) => count(counts[index], `${name} ball`));
  const bag = `A bag holds ${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}.`;
  const kind = r.pick(['most', 'least', 'total', 'more']);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  if (kind === 'most' || kind === 'least') {
    const pick = kind === 'most' ? max : min;
    const answer = colours[counts.indexOf(pick)];
    return textQ({
      family,
      prompt: `${bag} Without looking, which colour are you ${kind === 'most' ? 'most' : 'least'} likely to pick?`,
      answer,
      hint: 'The colour with more balls is more likely. The colour with fewer balls is less likely.',
      explanation: `${answer} has ${count(pick, 'ball')}, the ${kind === 'most' ? 'most' : 'fewest'}.`,
      givens: { kind, colours, counts },
      wrongs: colours.filter(name => name !== answer).map(name => [name, 'ignored-condition']),
    });
  }
  if (kind === 'total') {
    return numberQ(r, {
      family, prompt: `${bag} How many balls are in the bag?`, answer: sum(counts),
      hint: 'Add the number of balls of every colour.',
      explanation: `${counts.join(' + ')} = ${sum(counts)}.`, givens: { kind, colours, counts },
      wrongs: [[sum(counts) - min, 'missed-object'], [max, 'missing-step'], [colours.length, 'wrong-operation']], min: 3, max: 40,
    });
  }
  return numberQ(r, {
    family, prompt: `${bag} How many more ${colours[counts.indexOf(max)]} balls than ${colours[counts.indexOf(min)]} balls are there?`, answer: max - min,
    hint: 'Find the two colours in the bag. Take the smaller number from the bigger number.',
    explanation: `${max} − ${min} = ${max - min}.`, givens: { kind, colours, counts },
    wrongs: [[max + min, 'wrong-operation'], [max, 'missing-step'], [max - min + 1, 'included-extra']], min: 1, max: 30,
  });
}

function solveBag(question) {
  const { kind, colours, counts } = question.proof.givens;
  if (kind === 'total') return sum(counts);
  if (kind === 'more') return Math.max(...counts) - Math.min(...counts);
  const pick = kind === 'most' ? Math.max(...counts) : Math.min(...counts);
  return colours[counts.indexOf(pick)];
}
DRAFT['class-3-bag-chance'] = draftBag;
SOLVE['class-3-bag-chance'] = solveBag;
