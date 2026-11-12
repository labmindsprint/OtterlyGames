// Class 2 question-bank gaps: code keys, letter codes and hidden blocks inside a grid of pictures.
import { QuestionRetry, choiceCount } from './bank-shared.mjs';
import { build, ordinal, retrying } from './bank3-gap-kit.mjs';
import { GREEN, ORANGE, icon, rect, svg, text } from './diagram-kit.mjs';

export const GAP2_CODES = {
  'class-2-code-order': { title: 'Order of a code', message: 'Write the codes in the same order as the pictures or letters. Do not swap them.' },
  'class-2-code-lookup': { title: 'Use the key', message: 'Find each picture in the key and read its own number. Pictures next to each other in the key may have different codes.' },
  'class-2-code-direction': { title: 'Which way the code goes', message: 'Check whether each letter moves to the next letter or to the one before it in the alphabet.' },
  'class-2-code-partial': { title: 'Change every letter', message: 'The rule works on every letter of the word, not only the first one.' },
  'class-2-grid-near': { title: 'Nearly the same block', message: 'A block must match in every square. One picture that is different means it is not in the grid.' },
  'class-2-grid-turn': { title: 'Same pictures, wrong places', message: 'The pictures must be in the same places. Turning or flipping a block gives a different block.' },
};

export const GAP2_FAMILIES = {
  'class-2-code-key': { skill: 'coding', title: 'Read a picture code key forwards and backwards' },
  'class-2-code-shift': { skill: 'coding', title: 'Write words in a letter code' },
  'class-2-grid-find': { skill: 'visual', title: 'Find the block that is hidden in a grid of pictures' },
};

export const DRAFT = {};
export const SOLVE = {};
const SHAPES = ['circle', 'triangle', 'square', 'star'];
const NAMES = { circle: 'circle', triangle: 'triangle', square: 'square', star: 'star', pentagon: 'pentagon', hexagon: 'hexagon' };
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ---------------------------------------------------------------------------
// Picture code key
// ---------------------------------------------------------------------------
DRAFT['class-2-code-key'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const kinds = r.shuffle(['circle', 'triangle', 'square', 'star', 'pentagon', 'hexagon']).slice(0, level === 1 ? 3 : 4);
  const codes = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, kinds.length);
  const key = kinds.map((shape, index) => ({ shape, code: codes[index] }));
  const mode = r.pick(level === 1 ? ['forward', 'backward'] : ['forward', 'backward', 'sum', 'forward']);
  const size = mode === 'sum' ? 2 : level === 3 ? 3 : 2;
  const picks = Array.from({ length: size }, () => r.pick(key));
  const codeOf = shape => key.find(item => item.shape === shape).code;
  const visual = { kind: 'v3-class-2-codekey', key, description: `A key. ${key.map(item => `${item.shape} is ${item.code}`).join(', ')}` };
  const names = picks.map(item => item.shape);
  const sentence = names.map(name => NAMES[name]).join(', then ');
  let prompt;
  let answer;
  let wrongs;
  let hint = 'Look each picture up in the key, one at a time.';
  let explanation;
  if (mode === 'forward') {
    answer = picks.map(item => item.code).join(' ');
    prompt = `Use the key. What is the code for ${sentence}?`;
    const swapped = picks.map(item => item.code).reverse().join(' ');
    const lookups = picks.map(item => r.pick(key.filter(other => other.shape !== item.shape)).code).join(' ');
    wrongs = [
      { value: swapped, code: 'class-2-code-order' }, { value: lookups, code: 'class-2-code-lookup' },
      { value: picks.map((item, index) => (index ? item.code : r.pick(key.filter(other => other.shape !== item.shape)).code)).join(' '), code: 'class-2-code-lookup' },
      { value: picks.map(item => item.code + 1).join(' '), code: 'class-2-code-lookup' },
    ];
    explanation = `${picks.map(item => `${item.shape} is ${item.code}`).join(', ')}. So the code is ${answer}.`;
  } else if (mode === 'backward') {
    const codeWords = picks.map(item => item.code).join(' ');
    answer = names.join(', ');
    prompt = `Use the key. The code is ${codeWords}. Which pictures are these?`;
    wrongs = [
      { value: [...names].reverse().join(', '), code: 'class-2-code-order' },
      { value: picks.map(item => r.pick(key.filter(other => other.code !== item.code)).shape).join(', '), code: 'class-2-code-lookup' },
      { value: picks.map((item, index) => (index ? item.shape : r.pick(key.filter(other => other.shape !== item.shape)).shape)).join(', '), code: 'class-2-code-lookup' },
      { value: picks.map((item, index) => (index ? r.pick(key.filter(other => other.shape !== item.shape)).shape : item.shape)).join(', '), code: 'class-2-code-lookup' },
    ];
    explanation = `${picks.map(item => `${item.shape} has code ${item.code}`).join(', ')}. The pictures are ${answer}.`;
  } else {
    const total = picks[0].code + picks[1].code;
    answer = String(total);
    prompt = `Use the key. Add the codes of the ${picks[0].shape} and the ${picks[1].shape}. What is the total?`;
    wrongs = [
      { value: String(total + 1), code: 'class-2-code-lookup' }, { value: String(total - 1), code: 'class-2-code-lookup' },
      { value: `${picks[0].code}${picks[1].code}`, code: 'class-2-code-order' }, { value: String(Math.abs(picks[0].code - picks[1].code)), code: 'class-2-code-lookup' },
    ];
    hint = 'Find both codes in the key, then add them.';
    explanation = `The key shows ${picks[0].shape} is ${picks[0].code} and ${picks[1].shape} is ${picks[1].code}. ${picks[0].code} + ${picks[1].code} = ${total}.`;
  }
  if (mode !== 'sum' && new Set(names).size === 1 && size > 1) throw new QuestionRetry('Repeated picture');
  return build({ family, known: GAP2_CODES, count, prompt, answer, wrongs, hint, explanation, givens: { mode, key, names, size: names.length }, visual });
});

SOLVE['class-2-code-key'] = question => {
  const { mode, names, key } = question.proof.givens;
  const codeOf = shape => key.find(item => item.shape === shape).code;
  if (mode === 'forward') return names.map(codeOf).join(' ');
  if (mode === 'backward') return names.join(', ');
  return String(codeOf(names[0]) + codeOf(names[1]));
};

// ---------------------------------------------------------------------------
// Letter codes
// ---------------------------------------------------------------------------
const WORDS = ['CAT', 'DOG', 'SUN', 'HEN', 'BOX', 'PIG', 'BUS', 'FOX', 'MAP', 'CUP', 'HAT', 'BED', 'FISH', 'MOON', 'STAR', 'LAMP', 'BIRD', 'TREE', 'DUCK', 'FROG', 'MILK', 'BOAT', 'KITE', 'RAIN', 'COW', 'BAT', 'JAM', 'KEY', 'LOG', 'NET', 'PEN', 'RUG', 'TOP', 'WEB', 'ANT', 'OWL', 'BEE', 'CAR', 'DEN', 'EGG', 'GUM', 'ICE', 'JET', 'LEG', 'MUG', 'NUT', 'OAK', 'PAN', 'RAT', 'TUB', 'VAN', 'WIG', 'SAND', 'LEAF', 'BELL', 'CAKE', 'DRUM', 'FARM', 'GOAT', 'HILL', 'JUMP', 'LION', 'NEST', 'PARK', 'ROAD', 'SHIP', 'TOWN', 'WIND'];
const shiftWord = (word, by) => [...word].map(letter => ALPHA[(ALPHA.indexOf(letter) + by + 26) % 26]).join('');

DRAFT['class-2-code-shift'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['next', 'reverse', 'before'] : level === 2 ? ['next', 'before', 'reverse', 'decode'] : ['before', 'decode', 'two', 'reverse']);
  const pool = WORDS.filter(word => word.length === (level === 1 ? 3 : r.pick([3, 4])) && !/[YZ]/.test(word));
  const word = r.pick(pool.length ? pool : WORDS);
  const by = mode === 'next' ? 1 : mode === 'before' ? -1 : mode === 'two' ? 2 : mode === 'decode' ? 1 : 0;
  const rule = { next: 'Each letter is changed to the next letter. A becomes B.', before: 'Each letter is changed to the letter before it. B becomes A.', two: 'Each letter jumps two letters on. A becomes C.', reverse: 'The code writes the word backwards.', decode: 'Each letter is changed to the next letter. A becomes B.' }[mode];
  const coded = mode === 'reverse' ? [...word].reverse().join('') : shiftWord(word, by);
  let prompt;
  let answer;
  let wrongs;
  let hint;
  let explanation;
  if (mode === 'decode') {
    prompt = `${rule} The code is ${coded}. What is the word?`;
    answer = word;
    wrongs = [
      { value: shiftWord(coded, 1), code: 'class-2-code-direction' }, { value: shiftWord(word, 1), code: 'class-2-code-direction' },
      { value: coded[0] + word.slice(1), code: 'class-2-code-partial' }, { value: [...word].reverse().join(''), code: 'class-2-code-order' },
      { value: shiftWord(coded, -2), code: 'class-2-code-direction' },
    ];
    hint = 'Undo the rule. Go back one letter for each letter.';
    explanation = `The code moved every letter on by one. Going back one letter each time gives ${word}.`;
  } else {
    prompt = `${rule} What is the code for ${word}?`;
    answer = coded;
    const other = by === 0 ? [...word].reverse().join('') : shiftWord(word, -by);
    wrongs = [
      { value: other === coded ? shiftWord(word, 1) : other, code: mode === 'reverse' ? 'class-2-code-order' : 'class-2-code-direction' },
      { value: coded[0] + word.slice(1), code: 'class-2-code-partial' },
      { value: mode === 'reverse' ? word : [...coded].reverse().join(''), code: 'class-2-code-order' },
      { value: mode === 'reverse' ? shiftWord(word, 1) : word.slice(0, -1) + coded.slice(-1), code: 'class-2-code-partial' },
      { value: mode === 'reverse' ? word.slice(1) + word[0] : shiftWord(word, by + 1), code: 'class-2-code-partial' },
    ];
    hint = mode === 'reverse' ? 'Say the letters from the last one to the first one.' : 'Do the rule on one letter at a time, in order.';
    explanation = mode === 'reverse' ? `The code writes ${word} backwards, from the last letter to the first. So the code is ${coded}.` : `Changing each letter of ${word} by the rule gives ${coded}.`;
  }
  if (new Set([...word]).size < 3) throw new QuestionRetry('Repeated letters');
  const visual = { kind: 'v3-class-2-strip', from: ALPHA.indexOf(word[0]) - 1 < 0 ? 0 : ALPHA.indexOf(word[0]) - 1, description: `The alphabet strip, starting at the letter ${ALPHA[Math.max(0, ALPHA.indexOf(word[0]) - 1)]}, in order.` };
  return build({ family, known: GAP2_CODES, count, prompt, answer, wrongs, hint, explanation, givens: { mode, word, coded }, ...(mode === 'reverse' ? {} : { visual }) });
});
SOLVE['class-2-code-shift'] = question => {
  const { mode, word } = question.proof.givens;
  if (mode === 'decode') return word;
  if (mode === 'reverse') return [...word].reverse().join('');
  return shiftWord(word, mode === 'next' ? 1 : mode === 'before' ? -1 : 2);
};

// ---------------------------------------------------------------------------
// A block hidden in a grid
// ---------------------------------------------------------------------------
const initial = { circle: 'o', triangle: 't', square: 's', star: 'r' };
const blockKey = block => block.map(row => row.map(shape => initial[shape]).join('')).join('/');
const blockWords = block => block.map((row, index) => `row ${index + 1}: ${row.join(', ')}`).join('. ');
const occurs = (grid, block) => {
  for (let y = 0; y + block.length <= grid.length; y++) {
    for (let x = 0; x + block[0].length <= grid[0].length; x++) {
      if (block.every((row, j) => row.every((shape, i) => grid[y + j][x + i] === shape))) return true;
    }
  }
  return false;
};

DRAFT['class-2-grid-find'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const rows = level === 1 ? 3 : 4;
  const cols = level === 3 ? 5 : 4;
  const bh = level === 1 ? 1 : 2;
  const bw = level === 3 ? 3 : 2;
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => r.pick(SHAPES)));
  const y = r.int(0, rows - bh);
  const x = r.int(0, cols - bw);
  const block = Array.from({ length: bh }, (_, j) => Array.from({ length: bw }, (_, i) => grid[y + j][x + i]));
  if (new Set(block.flat()).size < 2) throw new QuestionRetry('Plain block');
  const candidates = [];
  const flat = block.map(row => [...row].reverse());
  candidates.push({ block: flat, code: 'class-2-grid-turn' });
  if (bh > 1) candidates.push({ block: [...block].reverse(), code: 'class-2-grid-turn' });
  for (let tries = 0; tries < 12; tries++) {
    const near = block.map(row => [...row]);
    near[r.int(0, bh - 1)][r.int(0, bw - 1)] = r.pick(SHAPES);
    candidates.push({ block: near, code: 'class-2-grid-near' });
  }
  const seen = new Set([blockKey(block)]);
  const wrongs = [];
  for (const candidate of r.shuffle(candidates)) {
    const key = blockKey(candidate.block);
    if (seen.has(key) || occurs(grid, candidate.block)) continue;
    seen.add(key);
    wrongs.push(candidate);
  }
  const small = shapes => ({ kind: 'v3-class-2-block', block: shapes, description: `A small block. ${blockWords(shapes)}` });
  return build({
    family, known: GAP2_CODES, count,
    prompt: r.pick(['Which small block is hidden in the big picture?', 'Look at the big grid. Which small block is in it?', 'Find the block that you can see inside the big grid.']),
    answer: blockKey(block), hint: 'Check one square at a time. Every picture must match.',
    explanation: `Only one block matches the pictures in the same places. The block is ${blockWords(block)}.`,
    givens: { size: [bh, bw] },
    visual: { kind: 'v3-class-2-grid', grid, description: `A big grid of pictures. ${blockWords(grid)}` }, correctVisual: small(block),
    wrongs: wrongs.map(item => ({ value: blockKey(item.block), code: item.code, visual: small(item.block) })),
  });
});
SOLVE['class-2-grid-find'] = question => {
  const found = question.optionVisuals.map((visual, index) => (occurs(question.visual.grid, visual.block) ? index : -1)).filter(index => index >= 0);
  if (found.length !== 1) throw new Error('Exactly one block must occur in the grid.');
  return question.options[found[0]];
};

const drawIcons = (grid, x, y, cell) => grid.map((row, j) => row.map((shape, i) => icon(shape, x + i * cell, y + j * cell, cell - 6, { circle: GREEN, triangle: ORANGE, square: '#7b6cb0', star: '#c98a2e' }[shape])).join('')).join('');
export function renderGaps(visual) {
  if (visual.kind === 'v3-class-2-grid') {
    const cell = 52;
    const w = visual.grid[0].length * cell;
    const h = visual.grid.length * cell;
    const x = Math.round((480 - w) / 2);
    return svg(rect(x - 8, 6, w + 10, h + 10, { rx: 8, strokeWidth: 2 }) + drawIcons(visual.grid, x, 11, cell), visual.description, 480, h + 22);
  }
  if (visual.kind === 'v3-class-2-block') {
    const cell = 52;
    const w = visual.block[0].length * cell;
    const h = visual.block.length * cell;
    return svg(drawIcons(visual.block, Math.round((200 - w) / 2), Math.round((200 - h) / 2), cell), visual.description, 200, 200);
  }
  if (visual.kind === 'v3-class-2-codekey') {
    const step = 460 / visual.key.length;
    return svg(visual.key.map((item, index) => {
      const cx = 10 + index * step + step / 2;
      return icon(item.shape, cx - 22, 34, 44, GREEN) + text(cx, 112, `= ${item.code}`, { size: 24 });
    }).join('') + text(240, 20, 'Key', { size: 18 }), visual.description, 480, 130);
  }
  if (visual.kind === 'v3-class-2-strip') {
    const letters = ALPHA.slice(visual.from, visual.from + 12);
    return svg([...letters].map((letter, index) => rect(12 + index * 38, 20, 36, 40, { rx: 4 }) + text(30 + index * 38, 48, letter, { size: 20 })).join('') + text(240, 90, `${ordinal(visual.from + 1)} letter onwards`, { size: 16 }), visual.description, 480, 104);
  }
  return null;
}
