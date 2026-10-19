// Figure, relation and graph families modelled on the printed SOF IMO papers: mirror words, folded paper, figure analogy,
// embedded figures, pattern completion, scaled bar graphs, weighing scales, blood relations and Venn counts.
// Every answer is derived by search or simulation from the givens, never copied from the generator.
import { QuestionRetry } from './bank-shared.mjs';
import { BOYS, GIRLS, checkPictures, pic, plural } from './bank3-class-4-real-core.mjs';

const key = cells => cells.map(row => row.join('')).join('/');
const flipH = cells => cells.map(row => [...row].reverse());
const flipV = cells => [...cells].reverse().map(row => [...row]);
const invert = cells => cells.map(row => row.map(value => 1 - value));
const turn180 = cells => flipV(flipH(cells));
const transpose = cells => cells[0].map((_, c) => cells.map(row => row[c]));
const TRANSFORMS = { 'mirror left to right': flipH, 'turn upside down': flipV, 'swap filled and empty cells': invert, 'half turn': turn180, 'flip over the diagonal': transpose };
const describeCells = cells => cells.map((row, i) => `Row ${i + 1}: ${row.map(value => value === null ? 'gap' : value ? 'filled' : 'empty').join(', ')}`).join('. ');
const cellPic = (cells, label) => pic('cells-choice', { cells }, `${label}. ${describeCells(cells)}.`);
const randomCells = (r, n, m, density) => Array.from({ length: n }, () => Array.from({ length: m }, () => r.int(0, 99) < density ? 1 : 0));
const sameCells = (a, b) => key(a) === key(b);
const count = cells => cells.flat().reduce((a, b) => a + b, 0);

const SYMMETRIC = ['MATH', 'TOY', 'MAY', 'HAT', 'WAX', 'OUT', 'AIM', 'MOTH', 'WHO', 'HIM', 'WAY', 'TWO', 'VAT', 'YAM', 'HOW', 'TOUT', 'MIX', 'TAX', 'WHY', 'AXIOM',
  'HOT', 'HAM', 'VIM', 'OAT', 'AWAY', 'WIT', 'MOW', 'TOW', 'VOW', 'HAY', 'HIT', 'WHAT', 'THAW', 'YOU', 'YOUTH', 'AUTO', 'WHIM', 'WITH', 'OATH', 'MAT', 'TAM'];
const WATER = ['CODE', 'BOX', 'DECK', 'HIDE', 'ICE', 'BIKE', 'COOK', 'BOOK', 'HOOK', 'DICE', 'OBOE', 'KICK', 'DOCK', 'BOOKED', 'CHOICE', 'HIKE',
  'BED', 'COB', 'HEX', 'DIE', 'KID', 'ODE', 'HOE', 'BIKED', 'HIKED', 'COKED', 'BEE', 'CHEEK', 'CHOKE', 'EBB', 'DECODE', 'OXIDE', 'BOXED', 'DOCKED', 'HEED', 'COOKED'];
const swap = (word, i, j) => { const a = [...word]; [a[i], a[j]] = [a[j], a[i]]; return a.join(''); };

const setText = cells => cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([r, c]) => `R${r}C${c}`).join(', ');

const PLACES = ['library', 'museum', 'zoo', 'science park', 'fair', 'sports hall'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SHAPE_NAMES = ['square', 'circle', 'triangle'];
const SCALE_SETS = [
  [[1, 1, 0], [1, 2, 0], [0, 1, 2]],
  [[0, 2, 0], [0, 1, 1], [1, 0, 1]],
  [[2, 1, 0], [1, 1, 0], [0, 1, 2]],
  [[1, 0, 1], [1, 0, 2], [2, 1, 0]],
  [[0, 1, 1], [1, 1, 1], [0, 2, 1]],
];

const RELATION_ITEMS = ['Grandfather', 'Grandmother', 'Grandson', 'Granddaughter', 'Uncle', 'Aunt', 'Nephew', 'Niece', 'Father', 'Mother', 'Brother', 'Sister', 'Cousin'];

function relationOf(people, edges, x, y) {
  const gender = who => people[who].gender;
  const parents = who => edges.filter(e => e.kind === 'parent' && e.b === who).map(e => e.a);
  const siblings = who => edges.filter(e => e.kind === 'sibling' && (e.a === who || e.b === who)).map(e => e.a === who ? e.b : e.a);
  const grandparents = who => parents(who).flatMap(parents);
  if (grandparents(y).includes(x)) return gender(x) === 'M' ? 'Grandfather' : 'Grandmother';
  if (grandparents(x).includes(y)) return gender(x) === 'M' ? 'Grandson' : 'Granddaughter';
  if (parents(y).some(p => siblings(p).includes(x))) return gender(x) === 'M' ? 'Uncle' : 'Aunt';
  if (parents(x).some(p => siblings(p).includes(y))) return gender(x) === 'M' ? 'Nephew' : 'Niece';
  throw new QuestionRetry('The relation is not covered.');
}

export const FIGURE_SPECS = {
  'class-4-mirror-word': {
    gen(level, r) {
      const mode = level === 1 ? 'side' : r.pick(['side', 'water', 'side']);
      return { mode, word: r.pick(mode === 'side' ? SYMMETRIC : WATER) };
    },
    calc(g) {
      const word = g.word;
      const answer = g.mode === 'side' ? [...word].reverse().join('') : word;
      if (g.mode === 'side' && answer === word) throw new QuestionRetry('The mirror word reads the same.');
      const reversed = [...word].reverse().join('');
      const candidates = [word, reversed, swap(reversed, 0, 1), swap(word, word.length - 2, word.length - 1), swap(reversed, 0, word.length - 1)];
      const wrongs = candidates.filter(c => c !== answer).map(c => [c, 'wrong-transform']);
      return {
        prompt: g.mode === 'side' ? 'The word in the picture is held up to a mirror on its right. Which word do you see in the mirror?' : 'The word in the picture lies on a flat mirror below it. Which word do you see in the mirror?',
        answer, wrongs,
        hint: g.mode === 'side' ? 'A side mirror swaps left and right, so the last letter comes first.' : 'A mirror below flips only up and down, so the order of the letters stays.',
        explanation: g.mode === 'side' ? `Every letter looks the same when flipped, so only the order reverses: ${word} becomes ${answer}.` : `Each letter looks the same when flipped upside down, so the word still reads ${answer}.`,
        visual: pic('mirror-word', { word, mode: g.mode }, g.mode === 'side' ? `The word ${word} is written with a mirror line on its right.` : `The word ${word} is written with a mirror line below it.`),
      };
    },
  },

  'class-4-paper-fold': {
    gen(level, r) {
      const n = level === 1 ? 4 : r.pick([4, 6]), folds = level === 1 ? 1 : r.pick([1, 2]);
      const first = r.pick(['LR', 'TB']), keepFar = [r.int(0, 1), r.int(0, 1)];
      const half = n / 2, range = far => Array.from({ length: half }, (_, i) => (far ? half : 0) + i + 1);
      const cols = first === 'LR' || folds === 2 ? range(keepFar[first === 'LR' ? 0 : 1]) : range(0).concat(range(1));
      const rows = first === 'TB' || folds === 2 ? range(keepFar[first === 'TB' ? 0 : 1]) : range(0).concat(range(1));
      return { n, folds, first, keepFar, hole: { r: r.pick(rows), c: r.pick(cols) }, cols, rows };
    },
    calc(g) {
      const mirror = x => g.n + 1 - x, { r, c } = g.hole;
      const sides = { cols: g.first === 'LR' || g.folds === 2, rows: g.first === 'TB' || g.folds === 2 };
      let holes = [[r, c]];
      if (sides.cols) holes = holes.flatMap(([row, col]) => [[row, col], [row, mirror(col)]]);
      if (sides.rows) holes = holes.flatMap(([row, col]) => [[row, col], [mirror(row), col]]);
      const answer = setText(holes);
      const near = x => x + (x * 2 <= g.n ? 1 : -1);
      const grid = (rowList, colList) => rowList.flatMap(x => colList.map(y => [x, y]));
      const wrongSets = g.folds === 1 ? [
        [[r, c], [mirror(r), mirror(c)]],
        sides.cols ? grid([r], [c, mirror(near(c))]) : grid([r, mirror(near(r))], [c]),
        sides.cols ? grid([r, mirror(r)], [c]) : grid([r], [c, mirror(c)]),
        sides.cols ? grid([r], [c, near(c)]) : grid([r, near(r)], [c]),
      ] : [
        grid([r, mirror(near(r))], [c, mirror(c)]),
        grid([r, mirror(r)], [c, mirror(near(c))]),
        grid([r, mirror(near(r))], [c, mirror(near(c))]),
        grid([r, near(r)], [c, near(c)]),
      ];
      const fold = (axis, far) => axis === 'LR' ? (far ? 'left half over the right half' : 'right half over the left half') : (far ? 'top half over the bottom half' : 'bottom half over the top half');
      const second = g.first === 'LR' ? 'TB' : 'LR';
      const how = g.folds === 1 ? fold(g.first, g.keepFar[0]) : `${fold(g.first, g.keepFar[0])}, then ${fold(second, g.keepFar[1])}`;
      return {
        prompt: `A ${g.n} by ${g.n} square of paper is folded as shown and one hole is punched. Where are the holes when it is opened? (R is row from the top, C is column from the left)`,
        answer, wrongs: wrongSets.filter(set => new Set(set.map(String)).size === holes.length).map(set => [setText(set), 'wrong-transform']),
        hint: 'A fold turns each hole into a matching hole on the other side of the fold line.',
        explanation: `Open the paper one fold at a time. A hole at R${r}C${c} is copied across each fold line.`,
        visual: pic('fold-sheet', { cols: g.cols, rows: g.rows, hole: { r, c }, how },
          `A ${g.n} by ${g.n} paper, folded ${how}, shows rows ${g.rows[0]} to ${g.rows.at(-1)} and columns ${g.cols[0]} to ${g.cols.at(-1)}. One hole is punched in row ${r}, column ${c}.`),
      };
    },
  },

  'class-4-figure-analogy': {
    gen(level, r) {
      const names = Object.keys(TRANSFORMS).slice(0, level === 1 ? 3 : 5);
      return { rule: r.pick(names), p: randomCells(r, 3, 3, 50), r: randomCells(r, 3, 3, 50), noise: r.int(0, 8) };
    },
    calc(g) {
      const t = TRANSFORMS[g.rule];
      const q = t(g.p), answer = t(g.r);
      if (sameCells(g.p, q) || sameCells(g.r, answer) || count(g.p) < 3 || count(g.r) < 3 || count(g.r) > 7) throw new QuestionRetry('The rule must change the figure.');
      const others = Object.entries(TRANSFORMS).filter(([, f]) => sameCells(f(g.p), q) && !sameCells(f(g.r), answer));
      if (others.length) throw new QuestionRetry('Two rules explain the same pair.');
      const errors = Object.values(TRANSFORMS).map(f => f(g.r)).filter(cells => !sameCells(cells, answer));
      const nudged = answer.map(row => [...row]);
      nudged[Math.floor(g.noise / 3)][g.noise % 3] ^= 1;
      errors.push(nudged, g.r);
      const unique = [];
      for (const cells of errors) if (!sameCells(cells, answer) && !unique.some(u => sameCells(u, cells))) unique.push(cells);
      return {
        prompt: 'Figure P changes to Q by one rule. Apply the same rule to R. Which figure replaces the question mark?',
        answer: key(answer),
        wrongs: unique.map(cells => [key(cells), 'wrong-transform', cellPic(cells, 'Answer figure')]),
        correctVisual: cellPic(answer, 'Answer figure'),
        hint: 'Compare P and Q cell by cell to see what moved or changed.',
        explanation: `The rule is to ${g.rule}. Doing the same to R gives the figure with the matching cells.`,
        visual: pic('analogy-row', { grids: [g.p, q, g.r, null] }, `Figure P changes to Q. Figure R is shown next to a question mark. P. ${describeCells(g.p)}. Q. ${describeCells(q)}. R. ${describeCells(g.r)}.`),
      };
    },
    check: question => checkPictures(question, 'cells-choice', v => key(v.cells)),
  },

  'class-4-embedded-figure': {
    gen(level, r) {
      const n = level === 3 ? 5 : 4, h = r.pick([2, 3]), w = h === 3 ? 2 : 3;
      return { big: randomCells(r, n, n, 55), top: r.int(0, n - h), left: r.int(0, n - w), h, w, flips: r.shuffle([...Array(h * w).keys()]).slice(0, 5) };
    },
    calc(g) {
      const windowAt = (cells, top, left) => cells.slice(top, top + g.h).map(row => row.slice(left, left + g.w));
      const occurs = piece => {
        for (let top = 0; top + g.h <= g.big.length; top++) for (let left = 0; left + g.w <= g.big[0].length; left++) if (sameCells(windowAt(g.big, top, left), piece)) return true;
        return false;
      };
      const answer = windowAt(g.big, g.top, g.left);
      if (count(answer) < 2 || count(answer) > g.h * g.w - 2) throw new QuestionRetry('The piece needs filled and empty cells.');
      const wrongs = [];
      for (const index of g.flips) {
        const piece = answer.map(row => [...row]);
        piece[Math.floor(index / g.w)][index % g.w] ^= 1;
        if (!occurs(piece) && !wrongs.some(w => sameCells(w, piece))) wrongs.push(piece);
      }
      if (wrongs.length < 3) throw new QuestionRetry('Too few pieces that are not hidden.');
      return {
        prompt: 'Which small figure is hidden inside the big figure? It must match exactly, with no turning.',
        answer: key(answer),
        wrongs: wrongs.map(piece => [key(piece), 'wrong-transform', cellPic(piece, 'Small figure')]),
        correctVisual: cellPic(answer, 'Small figure'),
        hint: 'Slide each small figure over the big one and compare every cell.',
        explanation: 'Only one small figure matches a block of the big figure cell for cell. The others differ in one cell.',
        visual: pic('cells-choice', { cells: g.big }, `The big figure. ${describeCells(g.big)}.`),
      };
    },
    check: question => checkPictures(question, 'cells-choice', v => key(v.cells)),
  },

  'class-4-pattern-complete': {
    gen(level, r) {
      return { top: randomCells(r, 2, 4, 50).map(row => [row[0], row[1], row[1], row[0]]), bottomLeft: randomCells(r, 2, 2, 50), extra: r.int(0, 3) };
    },
    calc(g) {
      const grid = [...g.top.map(row => [...row.slice(0, 2), ...row.slice(0, 2).reverse()]), ...g.bottomLeft.map(row => [...row, ...[...row].reverse()])];
      const answer = grid.slice(2).map(row => row.slice(2));
      const original = g.bottomLeft;
      if (sameCells(answer, original) || sameCells(answer, flipV(answer)) || count(answer) === 0 || count(answer) === 4) throw new QuestionRetry('The missing piece needs a clear mirror image.');
      const nudged = answer.map(row => [...row]);
      nudged[Math.floor(g.extra / 2)][g.extra % 2] ^= 1;
      const errors = [original, flipV(answer), nudged, invert(answer)];
      const gapped = grid.map((row, r) => row.map((value, c) => r >= 2 && c >= 2 ? null : value));
      return {
        prompt: 'The left and right sides of the pattern match like a mirror. Which piece fits in the gap?',
        answer: key(answer),
        wrongs: errors.map(cells => [key(cells), 'wrong-transform', cellPic(cells, 'Piece')]),
        correctVisual: cellPic(answer, 'Piece'),
        hint: 'Look at the piece on the same row, on the other side of the middle.',
        explanation: 'The bottom-right piece is the mirror image of the bottom-left piece, so each row of it is read backwards.',
        visual: pic('pattern-gap', { cells: gapped }, `A pattern of 4 rows and 4 columns with a gap at the bottom right. ${describeCells(gapped)}.`),
      };
    },
    check: question => checkPictures(question, 'cells-choice', v => key(v.cells)),
  },

  'class-4-bar-scale': {
    gen(level, r) {
      const scale = r.pick(level === 1 ? [2, 5, 10] : level === 2 ? [5, 10, 20, 25, 11] : [11, 12, 15, 25, 20]);
      const n = r.int(4, 5), start = r.int(0, 6 - n);
      return { scale, labels: DAYS_SHORT.slice(start, start + n), units: Array.from({ length: n }, () => r.int(1, 8)), place: r.pick(PLACES), ask: r.pick(['total', 'gap', 'pair', 'more']), a: r.int(0, n - 1), b: r.int(0, n - 1) };
    },
    calc(g) {
      const values = g.units.map(u => u * g.scale), top = Math.max(...g.units) + 1;
      const hi = values.indexOf(Math.max(...values)), lo = values.indexOf(Math.min(...values));
      if (new Set(g.units).size < g.units.length - 1) throw new QuestionRetry('Bars should differ.');
      let prompt, answer, wrongs, hint, explanation;
      const unitsTotal = g.units.reduce((a, b) => a + b, 0);
      if (g.ask === 'total') {
        answer = values.reduce((a, b) => a + b, 0);
        prompt = `The graph shows how many people came to the ${g.place} each day. How many people came in all?`;
        wrongs = [[unitsTotal, 'graph-key'], [answer + g.scale, 'graph-difference'], [answer - g.scale, 'graph-difference'], [answer + 2 * g.scale, 'graph-difference']];
        hint = 'Read each bar against the scale first, then add the days.';
        explanation = `The bars are ${values.join(', ')}. Their sum is ${answer}.`;
      } else if (g.ask === 'gap') {
        answer = values[hi] - values[lo];
        prompt = `The graph shows how many people came to the ${g.place} each day. How many more came on the busiest day than on the quietest day?`;
        wrongs = [[g.units[hi] - g.units[lo], 'graph-key'], [answer + g.scale, 'graph-difference'], [answer - g.scale, 'graph-difference'], [values[hi] + values[lo], 'wrong-operation']];
        hint = 'Find the tallest and shortest bars, then use the scale.';
        explanation = `The tallest bar is ${values[hi]} and the shortest is ${values[lo]}. The difference is ${answer}.`;
      } else {
        if (g.a === g.b) throw new QuestionRetry('Two different days are needed.');
        const A = g.labels[g.a], B = g.labels[g.b];
        answer = g.ask === 'pair' ? values[g.a] + values[g.b] : Math.abs(values[g.a] - values[g.b]);
        if (g.ask === 'more' && values[g.a] <= values[g.b]) throw new QuestionRetry('The first day must be busier.');
        prompt = g.ask === 'pair' ? `The graph shows how many people came to the ${g.place} each day. How many came on ${A} and ${B} together?` : `The graph shows how many people came to the ${g.place} each day. How many more came on ${A} than on ${B}?`;
        const unitsWrong = g.ask === 'pair' ? g.units[g.a] + g.units[g.b] : g.units[g.a] - g.units[g.b];
        wrongs = [[unitsWrong, 'graph-key'], [answer + g.scale, 'graph-difference'], [Math.max(g.scale, answer - g.scale), 'graph-difference'], [g.ask === 'pair' ? Math.abs(values[g.a] - values[g.b]) : values[g.a] + values[g.b], 'wrong-operation']];
        hint = 'Read the two bars against the scale, then add or subtract.';
        explanation = `${A} is ${values[g.a]} and ${B} is ${values[g.b]}, so the answer is ${answer}.`;
      }
      return {
        prompt, answer, wrongs, hint, explanation,
        visual: pic('bar-scale', { scale: g.scale, labels: g.labels, units: g.units, top, every: top > 6 ? 2 : 1 }, `A bar graph of people each day. Each step on the side scale is ${g.scale}. ${g.labels.map((label, i) => `${label}: ${g.units[i]} steps`).join(', ')}.`),
      };
    },
  },

  'class-4-scale-weights': {
    gen(level, r) {
      const set = r.int(0, SCALE_SETS.length - 1), masses = [r.int(2, 20), r.int(2, 20), r.int(2, 20)];
      return { set, masses, ask: r.int(0, 2) };
    },
    calc(g) {
      const rows = SCALE_SETS[g.set].map(counts => ({ counts, total: counts.reduce((sum, n, i) => sum + n * g.masses[i], 0) }));
      const possible = new Set();
      for (let s = 1; s <= 60; s++) for (let c = 1; c <= 60; c++) for (let t = 1; t <= 60; t++) {
        if (rows.every(row => row.counts[0] * s + row.counts[1] * c + row.counts[2] * t === row.total)) possible.add([s, c, t][g.ask]);
      }
      if (possible.size !== 1) throw new QuestionRetry('The scales must give one mass.');
      if (!rows.some(row => row.counts[g.ask])) throw new QuestionRetry('The asked shape must be on a scale.');
      const answer = [...possible][0];
      const shape = SHAPE_NAMES[g.ask];
      const parts = row => row.counts.flatMap((n, i) => Array(n).fill(SHAPE_NAMES[i]));
      return {
        prompt: `Each scale shows the total mass of the shapes on it. What is the mass of one ${shape} in grams?`,
        answer,
        wrongs: [[answer + 1, 'wrong-operation'], [Math.max(1, answer - 1), 'wrong-operation'], [answer + 2, 'missing-step'], [rows[2].total, 'ignored-condition'], [g.masses[(g.ask + 1) % 3], 'wrong-operation']],
        hint: 'Compare two scales that differ by a single shape.',
        explanation: `Subtract one scale from another to find one shape, then use it in the other scales. One ${shape} is ${answer} g.`,
        visual: pic('weigh-scales', { rows: rows.map(row => ({ parts: parts(row), total: row.total })) }, `Three scales. ${rows.map(row => `${parts(row).join(' and ')} weigh ${row.total} grams`).join('. ')}.`),
      };
    },
  },

  'class-4-blood-relation': {
    gen(level, r) {
      const variant = r.int(0, level === 1 ? 1 : 3), genders = Array.from({ length: 4 }, () => r.pick(['M', 'F']));
      const used = new Set(), name = g => { let n; do n = r.pick(g === 'M' ? BOYS : GIRLS); while (used.has(n)); used.add(n); return n; };
      return { variant, genders, names: genders.map(name) };
    },
    calc(g) {
      const [p, q, s, t] = g.names;
      const gen = i => g.genders[i];
      const people = Object.fromEntries(g.names.map((n, i) => [n, { gender: gen(i) }]));
      const dad = i => gen(i) === 'M' ? 'father' : 'mother', sib = i => gen(i) === 'M' ? 'brother' : 'sister';
      let edges, facts, x, y;
      if (g.variant === 0 || g.variant === 1) {
        // P is the parent of Q; Q is a sibling of S and the parent of T.
        edges = [{ kind: 'parent', a: p, b: q }, { kind: 'sibling', a: q, b: s }, { kind: 'parent', a: q, b: t }];
        facts = `${p} is the ${dad(0)} of ${q}. ${q} is the ${sib(1)} of ${s} and the ${dad(1)} of ${t}.`;
        [x, y] = g.variant === 0 ? [p, t] : [t, p];
      } else {
        // S is a sibling of Q; Q is the parent of T.
        edges = [{ kind: 'sibling', a: s, b: q }, { kind: 'parent', a: q, b: t }, { kind: 'parent', a: p, b: q }];
        facts = `${s} is the ${sib(2)} of ${q}. ${q} is the ${dad(1)} of ${t}.`;
        [x, y] = g.variant === 2 ? [s, t] : [t, s];
      }
      const answer = relationOf(people, edges, x, y);
      const isGrand = /^Grand/.test(answer), isLine = /^(Uncle|Aunt|Nephew|Niece)$/.test(answer);
      const swap = { Grandfather: 'Grandson', Grandmother: 'Granddaughter', Grandson: 'Grandfather', Granddaughter: 'Grandmother', Uncle: 'Nephew', Aunt: 'Niece', Nephew: 'Uncle', Niece: 'Aunt' };
      const female = gen(g.names.indexOf(x)) === 'F';
      const wrongs = [[swap[answer], 'reversed-operation'], [female ? 'Mother' : 'Father', 'ignored-condition'], [isGrand ? (female ? 'Aunt' : 'Uncle') : (female ? 'Sister' : 'Brother'), 'wrong-transform'], ['Cousin', 'included-extra']];
      return {
        prompt: `${facts} How is ${x} related to ${y}?`,
        answer, wrongs,
        hint: isLine || isGrand ? 'Draw the family as a small tree, then count the steps up or down.' : 'Draw the family as a small tree.',
        explanation: g.variant < 2
          ? `${p} is the parent of ${q}, and ${q} is the parent of ${t}. So ${x} is the ${answer.toLowerCase()} of ${y}.`
          : `${s} and ${q} are brother or sister, and ${q} is the parent of ${t}. So ${x} is the ${answer.toLowerCase()} of ${y}.`,
      };
    },
  },

  'class-4-venn-count': {
    gen(level, r) {
      const total = r.int(24, 60), both = r.int(3, 9), a = both + r.int(3, 14), b = both + r.int(3, 14);
      return { total, a, b, both, ask: level === 1 ? r.pick(['only', 'either']) : r.pick(['neither', 'only', 'either', 'neither']), pair: r.pick([['tea', 'milk'], ['football', 'cricket'], ['cats', 'dogs'], ['maths', 'art'], ['swimming', 'cycling']]), who: r.pick(['children', 'students', 'members']) };
    },
    calc(g) {
      const either = g.a + g.b - g.both;
      if (either >= g.total) throw new QuestionRetry('Someone must like neither.');
      const [one, two] = g.pair;
      const intro = `In a group of ${g.total} ${g.who}, ${g.a} like ${one}, ${g.b} like ${two} and ${g.both} like both.`;
      if (g.ask === 'neither') {
        const answer = g.total - either;
        return {
          prompt: `${intro} How many like neither?`, answer,
          wrongs: [[g.total - g.a - g.b, 'included-extra'], [either, 'missing-step'], [g.total - g.both, 'ignored-condition'], [answer + g.both, 'included-extra']],
          hint: 'Those who like both were counted twice when you add the two groups.',
          explanation: `Like at least one: ${g.a} + ${g.b} - ${g.both} = ${either}. Neither: ${g.total} - ${either} = ${g.total - either}.`,
        };
      }
      if (g.ask === 'only') {
        const answer = g.a - g.both;
        return {
          prompt: `${intro} How many like ${one} but not ${two}?`, answer,
          wrongs: [[g.a, 'included-extra'], [g.a + g.both, 'included-extra'], [g.b - g.both, 'ignored-condition'], [either, 'missing-step']],
          hint: 'Take away the part of the group that also likes the other thing.',
          explanation: `Those who like ${one} include ${g.both} who also like ${two}. ${g.a} - ${g.both} = ${answer}.`,
        };
      }
      return {
        prompt: `${intro} How many like at least one of them?`, answer: either,
        wrongs: [[g.a + g.b, 'included-extra'], [g.a + g.b + g.both, 'included-extra'], [g.total - either, 'wrong-operation'], [Math.max(g.a, g.b), 'missing-step']],
        hint: 'Do not count the children who like both twice.',
        explanation: `Add both groups, then take away those counted twice: ${g.a} + ${g.b} - ${g.both} = ${either}.`,
      };
    },
  },
};

export { plural };
