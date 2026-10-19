// Real-paper puzzle families for Class 3: letters hidden in a dot figure, figure analogies, picture sums,
// long division with hidden digits, figure rows that change places, stacked cubes and weekdays in a month.
import { QuestionRetry } from './bank-shared.mjs';
import { count, numberQ, range, sum, textQ } from './bank3-class-3-kit.mjs';
import { COLOURS, glyph } from './bank3-class-3-imo-art.mjs';
import { INK, PAPER, circle, line, path, rect, svg, text } from './diagram-kit.mjs';

export const DRAFT = {};
export const SOLVE = {};
export const FAMILIES = {
  'class-3-embedded-letter': { skill: 'odd', title: 'Find a letter hidden in a dot figure' },
  'class-3-figure-analogy': { skill: 'repeat', title: 'Change a figure the same way as the first pair' },
  'class-3-picture-sum': { skill: 'mystery', title: 'Find what shapes stand for from picture sums' },
  'class-3-long-division': { skill: 'mystery', title: 'Find a hidden digit in a division' },
  'class-3-figure-places': { skill: 'position', title: 'Follow figures that swap or jump places' },
  'class-3-cube-stack': { skill: 'solids', title: 'Count cubes in a stack with hidden cubes' },
  'class-3-month-days': { skill: 'calendar', title: 'Count or find weekday dates in a month' },
};

const TEAL = '#2f7d78';
const frame = (width, height) => rect(0, 0, width, height, { fill: PAPER, stroke: 'none', strokeWidth: 0 });
const poly = (points, fill) => `<polygon points="${points.map(point => point.join(',')).join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
const ord = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;
const distinct = (items) => [...new Set(items)];

// ---- letters hidden in a 3 by 3 dot figure; dots are numbered 1 to 9 across each row ----
const EDGES = ['1-2', '2-3', '4-5', '5-6', '7-8', '8-9', '1-4', '4-7', '2-5', '5-8', '3-6', '6-9'];
const GLYPHS = Object.fromEntries(Object.entries({
  L: '1-4 4-7 7-8 8-9',
  T: '1-2 2-3 2-5 5-8',
  H: '1-4 4-7 3-6 6-9 4-5 5-6',
  U: '1-4 4-7 7-8 8-9 6-9 3-6',
  C: '2-3 1-2 1-4 4-7 7-8 8-9',
  F: '1-4 4-7 1-2 2-3 4-5',
  E: '1-4 4-7 1-2 2-3 4-5 5-6 7-8 8-9',
  P: '1-4 4-7 1-2 2-3 3-6 4-5 5-6',
}).map(([letter, parts]) => [letter, parts.split(' ')]));
const fitsIn = (letter, segments) => GLYPHS[letter].every(part => segments.includes(part));
const dotWords = part => part.replace('-', ' and ');

function draftEmbedded(family, grade, level, r) {
  const names = Object.keys(GLYPHS);
  const parts = r.shuffle(names).slice(0, level === 1 ? 1 : 2);
  const noise = r.shuffle(EDGES).slice(0, level === 1 ? r.int(2, 3) : r.int(0, 2));
  const segments = EDGES.filter(edge => parts.some(letter => GLYPHS[letter].includes(edge)) || noise.includes(edge));
  if (segments.length < 5 || segments.length > 11) throw new QuestionRetry('figure size');
  const inside = names.filter(letter => fitsIn(letter, segments));
  const outside = names.filter(letter => !inside.includes(letter));
  const kind = level === 1 ? 'hidden' : r.pick(['hidden', 'missing']);
  let answer;
  let wrongs;
  if (kind === 'hidden') {
    if (!inside.length || outside.length < 3) throw new QuestionRetry('not one clear letter');
    answer = r.pick(inside);
    wrongs = r.shuffle(outside).map(letter => [letter, 'included-extra']);
  } else {
    if (inside.length < 3 || !outside.length) throw new QuestionRetry('not three hidden letters');
    answer = r.pick(outside);
    wrongs = r.shuffle(inside).map(letter => [letter, 'missed-object']);
  }
  const lacking = kind === 'missing' ? GLYPHS[answer].find(part => !segments.includes(part)) : '';
  return textQ({
    family,
    prompt: kind === 'hidden'
      ? r.pick(['Which letter is hidden in this figure? Use only the lines shown.', 'Which of these letters can you find inside the figure?'])
      : r.pick(['Which of these letters is NOT hidden in this figure?', 'Three of these letters are hidden in the figure. Which one is not?']),
    answer,
    hint: 'Trace each letter on the figure. Every line of the letter must already be there.',
    explanation: kind === 'hidden'
      ? `Every line of ${answer} is in the figure, so ${answer} is hidden there.`
      : `${answer} needs a line between dots ${dotWords(lacking)}, but the figure has none.`,
    givens: { kind },
    visual: {
      kind: 'v3-class-3-lattice', segments,
      description: `A figure on a 3 by 3 grid of dots, numbered 1 to 9 across each row from the top left. The lines join dots ${segments.map(dotWords).join('; ')}.`,
    },
    wrongs,
  });
}

function solveEmbedded(question) {
  const fits = question.options.filter(letter => fitsIn(letter, question.visual.segments));
  if (question.proof.givens.kind === 'hidden') {
    if (fits.length !== 1) throw new Error('Exactly one letter must be hidden.');
    return fits[0];
  }
  const absent = question.options.filter(letter => !fits.includes(letter));
  if (absent.length !== 1) throw new Error('Exactly one letter must be missing.');
  return absent[0];
}
DRAFT['class-3-embedded-letter'] = draftEmbedded;
SOLVE['class-3-embedded-letter'] = solveEmbedded;

function drawLattice(visual) {
  const width = 150;
  const height = 150;
  let body = frame(width, height);
  const at = dot => [25 + ((dot - 1) % 3) * 50, 25 + Math.floor((dot - 1) / 3) * 50];
  for (const part of visual.segments) {
    const [from, to] = part.split('-').map(Number).map(at);
    body += line(from[0], from[1], to[0], to[1], { stroke: TEAL, width: 6 });
  }
  for (let dot = 1; dot <= 9; dot++) body += circle(at(dot)[0], at(dot)[1], 5, { fill: INK });
  return svg(body, visual.description, width, height);
}

// ---- figure analogy: first figure becomes the second, so what does the third become? ----
const LADDER = ['triangle', 'square', 'pentagon', 'hexagon'];
const PLAIN = ['circle', 'triangle', 'square', 'diamond', 'pentagon', 'hexagon', 'star'];
const PICK_COLOURS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];
const itemText = (item, withSize) => `${withSize ? `${item.size} ` : ''}${item.color} ${item.shape}`;

function draftAnalogy(family, grade, level, r) {
  const kind = level === 1 ? r.pick(['colour', 'size']) : level === 2 ? r.pick(['colour', 'size', 'sides']) : r.pick(['sides', 'both']);
  const [c1, c2, c3] = r.shuffle(PICK_COLOURS);
  const shapes = r.shuffle(PLAIN);
  const step = r.int(0, LADDER.length - 2);
  const other = r.pick(range(0, LADDER.length - 2).filter(index => index !== step));
  let a;
  let b;
  let c;
  let answer;
  if (kind === 'colour') {
    a = { shape: shapes[0], color: c1, size: 'big' };
    b = { ...a, color: c2 };
    c = { shape: shapes[1], color: c1, size: 'big' };
    answer = { ...c, color: c2 };
  } else if (kind === 'size') {
    a = { shape: shapes[0], color: c1, size: 'small' };
    b = { ...a, size: 'big' };
    c = { shape: shapes[1], color: c2, size: 'small' };
    answer = { ...c, size: 'big' };
  } else if (kind === 'sides') {
    a = { shape: LADDER[step], color: c1, size: 'big' };
    b = { ...a, shape: LADDER[step + 1] };
    c = { shape: LADDER[other], color: c2, size: 'big' };
    answer = { ...c, shape: LADDER[other + 1] };
  } else {
    a = { shape: LADDER[step], color: c1, size: 'big' };
    b = { shape: LADDER[step + 1], color: c2, size: 'big' };
    c = { shape: LADDER[other], color: c1, size: 'big' };
    answer = { shape: LADDER[other + 1], color: c2, size: 'big' };
  }
  const withSize = kind === 'size';
  const text = item => itemText(item, withSize);
  const other1 = r.pick(PICK_COLOURS.filter(color => color !== answer.color && color !== c.color));
  const other2 = r.pick(PLAIN.filter(shape => shape !== answer.shape && shape !== c.shape));
  const candidates = [
    [c, 'ignored-condition'],
    [{ ...answer, color: kind === 'colour' || kind === 'both' ? c.color : other1 }, 'wrong-transform'],
    [{ ...answer, shape: kind === 'sides' || kind === 'both' ? c.shape : other2 }, 'wrong-transform'],
    [{ ...answer, size: answer.size === 'big' ? 'small' : 'big' }, 'wrong-transform'],
    [{ ...answer, color: other1 }, 'wrong-transform'],
    [{ ...answer, shape: other2 }, 'wrong-transform'],
  ].map(([item, code]) => [text(item), code]).filter(([value]) => value !== text(answer));
  const items = [a, b, c];
  return textQ({
    family,
    prompt: r.pick([
      'The first figure changes into the second figure. The third figure changes in the same way. Which figure goes in the box?',
      'Look at how the first figure turns into the second. Which figure does the third one turn into?',
    ]),
    answer: text(answer),
    hint: 'Compare the first two figures. Say what changed, then make the same change to the third.',
    explanation: kind === 'colour' ? `Only the colour changes, from ${c1} to ${c2}. The third figure becomes ${text(answer)}.`
      : kind === 'size' ? `The small figure becomes big and nothing else changes, so the third becomes ${text(answer)}.`
        : kind === 'sides' ? `The shape gains one side each time. ${c.shape} gains a side and becomes ${answer.shape}.`
          : `The shape gains one side and the colour turns ${c2}. The third figure becomes ${text(answer)}.`,
    givens: { kind },
    visual: {
      kind: 'v3-class-3-seq', items, next: true, cols: 4,
      description: `Three figures: ${items.map(item => itemText(item, true)).join(', ')}. The first changes into the second. A box with a question mark follows the third.`,
    },
    wrongs: candidates,
  });
}

function solveAnalogy(question) {
  const [a, b, c] = question.visual.items;
  const result = { ...c };
  for (const prop of ['color', 'size']) {
    if (a[prop] === b[prop]) continue;
    if (c[prop] !== a[prop]) throw new Error('The third figure does not fit the change.');
    result[prop] = b[prop];
  }
  if (a.shape !== b.shape) {
    if (LADDER.indexOf(b.shape) !== LADDER.indexOf(a.shape) + 1 || LADDER.indexOf(a.shape) < 0) throw new Error('The shape change must add one side.');
    const next = LADDER[LADDER.indexOf(c.shape) + 1];
    if (!next) throw new Error('No shape with one more side.');
    result.shape = next;
  }
  return itemText(result, a.size !== b.size);
}
DRAFT['class-3-figure-analogy'] = draftAnalogy;
SOLVE['class-3-figure-analogy'] = solveAnalogy;

// ---- picture sums ----
const SUM_SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon'];

function solveRows(rows, names) {
  const results = new Set();
  const query = rows.find(row => row.total === null);
  const known = rows.filter(row => row.total !== null);
  const assign = (index, values) => {
    if (index === names.length) {
      const value = symbols => sum(symbols.map(symbol => values[symbol]));
      if (known.every(row => value(row.symbols) === row.total)) results.add(value(query.symbols));
      return;
    }
    for (let guess = 1; guess <= 40; guess++) assign(index + 1, { ...values, [names[index]]: guess });
  };
  assign(0, {});
  return [...results];
}

const times = (symbol, n) => Array.from({ length: n }, () => symbol);

function draftPictureSum(family, grade, level, r) {
  const k = level === 3 ? 3 : 2;
  const names = r.shuffle(SUM_SHAPES).slice(0, k);
  const values = r.shuffle(range(2, 14)).slice(0, k);
  const value = Object.fromEntries(names.map((name, index) => [name, values[index]]));
  const total = symbols => sum(symbols.map(symbol => value[symbol]));
  const [A, B, C] = names;
  let rows;
  let query;
  let explain;
  if (k === 2) {
    const m = r.int(2, 3);
    const n = r.int(1, 2);
    rows = [times(A, m), [A, ...times(B, n)]];
    query = level === 1 ? times(B, r.int(2, 3)) : [...times(A, r.int(1, 2)), ...times(B, r.int(2, 3))];
    explain = `${m} × ${A} is ${m * value[A]}, so each ${A} is ${value[A]}. Then each ${B} is ${value[B]}, and the last row is ${total(query)}.`;
  } else {
    rows = [times(A, 2), [A, B], [B, ...times(C, 2)]];
    query = r.pick([times(C, 3), [A, B, C], [A, C, C]]);
    explain = `Each ${A} is ${value[A]}, each ${B} is ${value[B]} and each ${C} is ${value[C]}. The last row is ${total(query)}.`;
  }
  if (rows.some(row => total(row) > 60) || total(query) > 60) throw new QuestionRetry('too large');
  const shown = [...rows.map(symbols => ({ symbols, total: total(symbols) })), { symbols: query, total: null }];
  if (solveRows(shown, names).length !== 1) throw new QuestionRetry('not unique');
  const answer = total(query);
  const small = Math.min(...values);
  const line1 = row => `${row.symbols.join(' + ')} = ${row.total ?? '?'}`;
  return numberQ(r, {
    family,
    prompt: 'Each shape stands for a number. What number goes in place of the question mark?',
    answer,
    hint: 'Start with the row that has only one kind of shape. Use what you find in the next row.',
    explanation: explain,
    givens: {},
    visual: {
      kind: 'v3-class-3-picture-sum', shapes: names, rows: shown,
      description: `Picture sums: ${shown.map((row, index) => `Row ${index + 1}: ${line1(row)}`).join('. ')}.`,
    },
    wrongs: [[answer + 1, 'missing-step'], [answer - 1, 'missing-step'], [answer + small, 'wrong-operation'], [answer - small, 'wrong-operation']].filter(([v]) => v > 0),
    min: 1, max: 99,
  });
}

function solvePictureSum(question) {
  const { rows, shapes } = question.visual;
  const found = solveRows(rows, shapes);
  if (found.length !== 1) throw new Error('The picture sums must give one answer.');
  return found[0];
}
DRAFT['class-3-picture-sum'] = draftPictureSum;
SOLVE['class-3-picture-sum'] = solvePictureSum;

function drawPictureSum(visual) {
  const widest = Math.max(...visual.rows.map(row => row.symbols.length));
  const width = Math.max(240, 40 * widest + 130);
  const height = 12 + visual.rows.length * 46;
  let body = frame(width, height);
  visual.rows.forEach((row, rowIndex) => {
    const y = 30 + rowIndex * 46;
    row.symbols.forEach((symbol, index) => {
      body += glyph(symbol, 28 + index * 40, y, 30, Object.values(COLOURS)[visual.shapes.indexOf(symbol)]);
      if (index) body += text(8 + index * 40, y + 6, '+', { size: 18 });
    });
    body += text(34 + row.symbols.length * 40, y + 8, row.total === null ? '= ?' : `= ${row.total}`, { size: 24, fill: row.total === null ? '#9d4e2d' : INK, anchor: 'start' });
  });
  return svg(body, visual.description, width, height);
}

// ---- division with hidden digits ----
function divisionSolutions(visual) {
  const letters = distinct([...visual.quotient, ...visual.dividend].filter(char => /[A-Z]/.test(char)));
  const found = [];
  const fill = (digits, assignment) => digits.map(char => (/[A-Z]/.test(char) ? String(assignment[char]) : char));
  const valid = digits => digits[0] !== '0' || digits.length === 1;
  const walk = (index, assignment) => {
    if (index === letters.length) {
      const quotient = fill(visual.quotient, assignment);
      const dividend = fill(visual.dividend, assignment);
      if (valid(quotient) && valid(dividend) && Number(visual.divisor) * Number(quotient.join('')) + Number(visual.remainder) === Number(dividend.join(''))) found.push(assignment);
      return;
    }
    for (let digit = 0; digit <= 9; digit++) walk(index + 1, { ...assignment, [letters[index]]: digit });
  };
  walk(0, {});
  return found;
}

function draftLongDivision(family, grade, level, r) {
  const divisor = level === 1 ? r.int(2, 5) : r.int(3, 9);
  const dividend = level === 1 ? r.int(30, 99) : level === 2 ? r.int(100, 600) : r.int(300, 999);
  const quotient = Math.floor(dividend / divisor);
  const remainder = dividend % divisor;
  const qDigits = String(quotient).split('');
  const dDigits = String(dividend).split('');
  const hide = [];
  if (level === 1 || (level === 2 && r.int(0, 1) === 0)) {
    hide.push(['dividend', r.int(0, dDigits.length - 1), 'P']);
  } else if (level === 2) {
    hide.push(['quotient', r.int(0, qDigits.length - 1), 'P']);
  } else {
    hide.push(['dividend', r.int(0, dDigits.length - 1), 'P'], ['quotient', r.int(0, qDigits.length - 1), 'Q']);
  }
  const truth = {};
  for (const [part, index, letter] of hide) {
    const digits = part === 'dividend' ? dDigits : qDigits;
    truth[letter] = Number(digits[index]);
    digits[index] = letter;
  }
  const visual = {
    kind: 'v3-class-3-long-division', divisor: String(divisor), quotient: qDigits, dividend: dDigits, remainder: String(remainder),
    description: `A long division. The divisor is ${divisor}. The quotient is ${qDigits.join(' ')}. The number divided is ${dDigits.join(' ')}. The remainder is ${remainder}. Each letter hides one digit.`,
  };
  const solutions = divisionSolutions(visual);
  if (solutions.length !== 1) throw new QuestionRetry('digits not unique');
  const ask = r.pick(Object.keys(truth));
  const answer = truth[ask];
  const product = divisor * quotient;
  return numberQ(r, {
    family,
    prompt: `In this division each letter hides one digit. What digit does ${ask} stand for?`,
    answer,
    hint: 'Multiply the divisor by the quotient. Then add the remainder to get the number divided.',
    explanation: `${divisor} × ${quotient} = ${product}, and ${product} + ${remainder} = ${dividend}. So ${ask} is ${answer}.`,
    givens: { ask },
    visual,
    wrongs: [[(answer + 1) % 10, 'missing-step'], [(answer + 9) % 10, 'missing-step'], [Number(String(product).split('')[0]), 'wrong-operation'], [remainder, 'wrong-operation']],
    min: 0, max: 9,
  });
}

function solveLongDivision(question) {
  const found = divisionSolutions(question.visual);
  if (found.length !== 1) throw new Error('The hidden digits must be unique.');
  return found[0][question.proof.givens.ask];
}
DRAFT['class-3-long-division'] = draftLongDivision;
SOLVE['class-3-long-division'] = solveLongDivision;

function drawLongDivision(visual) {
  const n = visual.dividend.length;
  const left = 70;
  const width = left + 34 * n + 190;
  const height = 120;
  let body = frame(width, height);
  const cell = (digit, x, y) => (/[A-Z]/.test(digit)
    ? rect(x - 14, y - 22, 28, 32, { fill: '#fff6e8', rx: 4, strokeWidth: 2 }) + text(x, y + 2, digit, { size: 22, fill: '#9d4e2d' })
    : text(x, y + 2, digit, { size: 24 }));
  body += text(34, 88, visual.divisor, { size: 26 });
  body += path(`M ${left - 6} 52 L ${left - 6} 104`, { strokeWidth: 3 });
  body += line(left - 6, 52, left + 34 * n + 4, 52, { width: 3 });
  visual.dividend.forEach((digit, index) => { body += cell(digit, left + 17 + index * 34, 88); });
  const shift = n - visual.quotient.length;
  visual.quotient.forEach((digit, index) => { body += cell(digit, left + 17 + (index + shift) * 34, 40); });
  body += text(left + 34 * n + 20, 88, `remainder ${visual.remainder}`, { size: 18, anchor: 'start' });
  return svg(body, visual.description, width, height);
}

// ---- a row of figures that swap, turn around or jump ----
function applyMoves(list, moves) {
  let row = [...list];
  for (const move of moves) {
    if (move.type === 'swap') {
      const i = row.indexOf(move.a);
      const j = row.indexOf(move.b);
      [row[i], row[j]] = [row[j], row[i]];
    } else if (move.type === 'turn') {
      row.reverse();
    } else {
      row = [move.a, ...row.filter(shape => shape !== move.a)];
    }
  }
  return row;
}

function moveSentence(move) {
  if (move.type === 'swap') return `The ${move.a} and the ${move.b} swap places.`;
  if (move.type === 'turn') return 'The whole row is turned around, so the left end becomes the right end.';
  return `The ${move.a} jumps to the front. The figures it passes each move one place to the right.`;
}

function draftPlaces(family, grade, level, r) {
  const total = level === 3 ? 6 : 5;
  const shapes = r.shuffle(PLAIN).slice(0, total);
  const colours = r.shuffle(PICK_COLOURS).slice(0, total);
  const items = shapes.map((shape, index) => ({ shape, color: colours[index] }));
  const swap = () => {
    const [a, b] = r.shuffle(shapes).slice(0, 2);
    return { type: 'swap', a, b };
  };
  const make = kind => (kind === 'swap' ? swap() : kind === 'turn' ? { type: 'turn' } : { type: 'jump', a: r.pick(shapes.slice(1)) });
  const moves = level === 1 ? [make(r.pick(['swap', 'turn']))]
    : level === 2 ? [make(r.pick(['swap', 'turn', 'jump']))]
      : [make(r.pick(['swap', 'jump'])), make(r.pick(['swap', 'turn', 'jump']))];
  const after = applyMoves(shapes, moves);
  const place = r.int(1, total);
  const answer = after[place - 1];
  if (answer === shapes[place - 1]) throw new QuestionRetry('nothing moved there');
  const wrongs = [[shapes[place - 1], 'ignored-condition'], [shapes[total - place], 'turn-frame'], ...r.shuffle(shapes).map(shape => [shape, 'rank-endpoints'])];
  return textQ({
    family,
    prompt: `${moves.map(moveSentence).join(' ')} Which figure is now ${ord(place)} from the left?`,
    answer,
    hint: 'Write down the new order of the figures after each change. Then read off the place asked for.',
    explanation: `The new order is ${after.join(', ')}. The ${ord(place)} figure from the left is the ${answer}.`,
    givens: { moves, place },
    visual: {
      kind: 'v3-class-3-seq', items, cols: total,
      description: `A row of ${total} figures from left to right: ${items.map(item => `${item.color} ${item.shape}`).join(', ')}.`,
    },
    wrongs,
  });
}

function solvePlaces(question) {
  const { moves, place } = question.proof.givens;
  return applyMoves(question.visual.items.map(item => item.shape), moves)[place - 1];
}
DRAFT['class-3-figure-places'] = draftPlaces;
SOLVE['class-3-figure-places'] = solvePlaces;

// ---- stacked cubes: heights are listed from the back row to the front row ----
const hiddenAt = (heights, row, col, level) => {
  const above = level + 1 < heights[row][col];
  const right = col + 1 < heights[row].length && heights[row][col + 1] > level;
  const front = row + 1 < heights.length && heights[row + 1][col] > level;
  return above && right && front;
};

function draftCubes(family, grade, level, r) {
  const rows = level === 1 ? 2 : r.int(2, 3);
  const cols = r.int(2, 3);
  const top = level === 1 ? 3 : 4;
  const heights = Array.from({ length: rows }, () => Array(cols).fill(1));
  heights[rows - 1][cols - 1] = r.int(1, 2);
  for (let row = rows - 1; row >= 0; row--) {
    for (let col = cols - 1; col >= 0; col--) {
      if (row === rows - 1 && col === cols - 1) continue;
      const base = Math.max(row + 1 < rows ? heights[row + 1][col] : 1, col + 1 < cols ? heights[row][col + 1] : 1);
      heights[row][col] = Math.min(base + r.int(0, 1), top);
    }
  }
  const flat = heights.flat();
  const total = sum(flat);
  if (total < 5 || total > 22 || Math.max(...flat) < 2) throw new QuestionRetry('stack size');
  let seen = 0;
  heights.forEach((line, row) => line.forEach((high, col) => { for (let z = 0; z < high; z++) if (!hiddenAt(heights, row, col, z)) seen += 1; }));
  if (seen === total) throw new QuestionRetry('no hidden cubes');
  const kind = level === 1 ? 'total' : r.pick(['total', 'fill', 'above']);
  const tallest = Math.max(...flat);
  const answer = kind === 'total' ? total : kind === 'fill' ? tallest * flat.length - total : total - flat.length;
  const prompt = kind === 'total' ? 'Cubes are piled in columns with no gaps. Some cubes are hidden behind others. How many cubes are there in all?'
    : kind === 'fill' ? 'The cubes have no gaps. How many more cubes make every column as tall as the tallest column?'
      : 'The cubes have no gaps. How many cubes sit above the bottom layer?';
  return numberQ(r, {
    family,
    prompt,
    answer,
    hint: kind === 'total' ? 'Count the height of each column, including cubes you cannot see. Then add the columns.'
      : kind === 'fill' ? 'Find how many cubes each column lacks to reach the tallest, then add those gaps.'
        : 'Count every cube first. Then take away the cubes in the bottom layer.',
    explanation: kind === 'total' ? `The column heights are ${flat.join(', ')}. They add up to ${total} cubes.`
      : kind === 'fill' ? `${flat.length} columns of ${tallest} make ${tallest * flat.length}. ${tallest * flat.length} − ${total} = ${answer}.`
        : `${total} cubes in all. The bottom layer has ${flat.length}. ${total} − ${flat.length} = ${answer}.`,
    givens: { kind },
    visual: {
      kind: 'v3-class-3-cubes', heights,
      description: `A block of cubes with ${count(rows, 'row')} and ${count(cols, 'column')}. Column heights from the back row to the front row: ${heights.map((line, index) => `row ${index + 1}: ${line.join(', ')}`).join('; ')}. Cubes in front hide some cubes behind.`,
    },
    wrongs: kind === 'total'
      ? [[seen, 'missed-object'], [total + 1, 'missing-step'], [total - 1, 'missing-step'], [tallest * flat.length, 'wrong-operation']]
      : [[total, 'missing-step'], [answer + 1, 'counted-endpoints'], [answer - 1, 'counted-endpoints'], [tallest * flat.length, 'wrong-operation']],
    min: 1, max: 60,
  });
}

function solveCubes(question) {
  const flat = question.visual.heights.flat();
  const total = sum(flat);
  const { kind } = question.proof.givens;
  return kind === 'total' ? total : kind === 'fill' ? Math.max(...flat) * flat.length - total : total - flat.length;
}
DRAFT['class-3-cube-stack'] = draftCubes;
SOLVE['class-3-cube-stack'] = solveCubes;

function drawCubes(visual) {
  const w = 24;
  const hh = 14;
  const high = 26;
  const heights = visual.heights;
  const rows = heights.length;
  const cols = heights[0].length;
  const tallest = Math.max(...heights.flat());
  const width = (rows + cols) * w + 16;
  const oy = tallest * high + 8;
  const height = oy + (rows + cols) * hh + 8;
  let body = frame(width, height);
  const order = [];
  heights.forEach((line, row) => line.forEach((_, col) => order.push([row, col])));
  order.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
  for (const [row, col] of order) {
    for (let z = 0; z < heights[row][col]; z++) {
      if (hiddenAt(heights, row, col, z)) continue;
      const x = 8 + rows * w + (col - row) * w;
      const y = oy + (col + row) * hh - (z + 1) * high;
      body += poly([[x, y], [x + w, y + hh], [x, y + 2 * hh], [x - w, y + hh]], '#f7e3a1');
      body += poly([[x - w, y + hh], [x, y + 2 * hh], [x, y + 2 * hh + high], [x - w, y + hh + high]], '#e0b14a');
      body += poly([[x, y + 2 * hh], [x + w, y + hh], [x + w, y + hh + high], [x, y + 2 * hh + high]], '#c8943a');
    }
  }
  return svg(body, visual.description, width, height);
}

// ---- weekdays in a month ----
const MONTHS = [['January', 31], ['February', 28], ['April', 30], ['June', 30], ['July', 31], ['September', 30], ['October', 31], ['November', 30], ['December', 31]];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const datesOn = (days, start, ...targets) => range(1, days).filter(date => targets.includes((start + date - 1) % 7));

function draftMonth(family, grade, level, r) {
  const [name, days] = r.pick(MONTHS);
  const start = r.int(0, 6);
  const target = r.int(0, 6);
  const day = DAYS[target];
  const dates = datesOn(days, start, target);
  const kind = level === 1 ? 'count' : level === 2 ? r.pick(['count', 'nth', 'nth']) : r.pick(['last', 'weekend', 'nth', 'count']);
  const nth = r.int(2, 3);
  const weekend = datesOn(days, start, 0, 6);
  const answer = kind === 'count' ? dates.length : kind === 'nth' ? dates[nth - 1] : kind === 'last' ? dates.at(-1) : weekend.length;
  const prompts = {
    count: `How many ${day}s are there in ${name}?`,
    nth: `On which date is the ${ord(nth)} ${day} of ${name}?`,
    last: `What is the date of the last ${day} in ${name}?`,
    weekend: `How many Saturdays and Sundays are there in ${name}?`,
  };
  const hints = {
    count: 'Find the first one in the grid. Then jump 7 days at a time until the month ends.',
    nth: 'The same weekday comes back every 7 days. Follow that weekday down its column.',
    last: 'Look down the column of that weekday and find the last date in it.',
    weekend: 'Count the dates in the first column and in the last column. Then add them.',
  };
  const explanations = {
    count: `The first ${day} is the ${ord(dates[0])}. Adding 7 each time gives ${dates.join(', ')}. That is ${count(dates.length, day)}.`,
    nth: `The ${day}s fall on ${dates.join(', ')}. The ${ord(nth)} one is the ${ord(answer)}.`,
    last: `The ${day}s fall on ${dates.join(', ')}. The last one is the ${ord(answer)}.`,
    weekend: `Sundays: ${datesOn(days, start, 0).length}. Saturdays: ${datesOn(days, start, 6).length}. Together that is ${answer}.`,
  };
  const wrongs = kind === 'count' || kind === 'weekend'
    ? [[answer - 1, 'missing-step'], [answer + 1, 'counted-endpoints'], [answer + 2, 'counted-endpoints'], [answer - 2, 'missing-step']]
    : [[answer + 7, 'missing-step'], [answer - 7, 'missing-step'], [answer + 1, 'counted-endpoints'], [answer - 1, 'counted-endpoints']];
  return numberQ(r, {
    family,
    prompt: prompts[kind],
    answer,
    hint: hints[kind],
    explanation: explanations[kind],
    givens: { kind, target, nth },
    visual: {
      kind: 'v3-class-3-month', name, days, start,
      description: `The calendar of ${name} with ${days} days. The 1st falls on a ${DAYS[start]}. Weeks start on Sunday.`,
    },
    wrongs: wrongs.filter(([value]) => value >= 1 && value <= (kind === 'nth' || kind === 'last' ? days : 12)),
    min: 1, max: kind === 'nth' || kind === 'last' ? days : 12,
  });
}

function solveMonth(question) {
  const { days, start } = question.visual;
  const { kind, target, nth } = question.proof.givens;
  const dates = datesOn(days, start, target);
  return kind === 'count' ? dates.length : kind === 'nth' ? dates[nth - 1] : kind === 'last' ? dates.at(-1) : datesOn(days, start, 0, 6).length;
}
DRAFT['class-3-month-days'] = draftMonth;
SOLVE['class-3-month-days'] = solveMonth;

function drawMonth(visual) {
  const cell = 52;
  const rows = Math.ceil((visual.start + visual.days) / 7);
  const width = 16 + 7 * cell;
  const height = 64 + rows * 30 + 8;
  let body = frame(width, height);
  body += text(width / 2, 24, visual.name, { size: 20 });
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((name, index) => { body += text(8 + index * cell + cell / 2, 50, name, { size: 16, fill: TEAL }); });
  for (let date = 1; date <= visual.days; date++) {
    const slot = visual.start + date - 1;
    body += text(8 + (slot % 7) * cell + cell / 2, 82 + Math.floor(slot / 7) * 30, String(date), { size: 18 });
  }
  return svg(body, visual.description, width, height);
}

export const PUZZLE_RENDERERS = {
  'v3-class-3-lattice': drawLattice,
  'v3-class-3-picture-sum': drawPictureSum,
  'v3-class-3-long-division': drawLongDivision,
  'v3-class-3-cubes': drawCubes,
  'v3-class-3-month': drawMonth,
};
