// PP1 numbers and everyday sequences, matched to real pre-primary papers: number before and after, number names, bigger and smaller,
// picture add and take away, alphabet and skip-count gaps, days of the week and clocks.
import { MISCONCEPTIONS as SHARED, answerChoices, choiceCount } from './bank-shared.mjs';
import { ORANGE, text } from './diagram-kit.mjs';
import {
  HUES, INK, PAPER, QuestionRetry, TOKENS, arrow, badge, build, n1, plate, say, spreadWrongs, svg, thingWord, token, wrong,
} from './bank3-pp1-art.mjs';

export const MISCONCEPTIONS = {
  'pp1-near-flip': { title: 'Before or after?', message: 'After means one more. Before means one less. Check which one is asked.' },
  'pp1-near-skip': { title: 'Right next to it', message: 'The number you want sits right beside the one in the question. Do not skip.' },
  'pp1-near-same': { title: 'A new number', message: 'The answer is a different number from the ones in the question.' },
  'pp1-name-near': { title: 'One step off', message: 'That is one step too far or too short. Count again, one step at a time.' },
  'pp1-name-teen': { title: 'Use the whole number', message: 'That leaves out part of the number. Check the ten, the ones and the number you start from.' },
  'pp1-big-flip': { title: 'Bigger or smaller?', message: 'Bigger is more. Smaller is less. Check which one is asked.' },
  'pp1-big-mid': { title: 'Compare all the numbers', message: 'That number is in the middle. Compare it with both others.' },
  'pp1-add-one': { title: 'Count both groups', message: 'Count the left group and the right group together.' },
  'pp1-add-off': { title: 'Count again, one by one', message: 'The total is a bit different. Touch each one and count again.' },
  'pp1-take-total': { title: 'Take the crossed ones away', message: 'Crossed out ones are gone. Count only the ones not crossed out.' },
  'pp1-take-crossed': { title: 'Count what is left', message: 'That is how many are crossed out. Count the ones still there.' },
  'pp1-take-off': { title: 'Touch each one left', message: 'Count only the ones still there, one at a time.' },
  'pp1-abc-slip': { title: 'Say the letters in order', message: 'That letter is next to the gap but is already shown. Say the letters in order.' },
  'pp1-abc-skip': { title: 'Do not skip a letter', message: 'That letter skips one. Say each letter in order from the start.' },
  'pp1-skip-step': { title: 'Jump the same each time', message: 'Find how far one number jumps to the next. Jump that far again.' },
  'pp1-skip-near': { title: 'The jump is bigger', message: 'The numbers jump by more than one. Find the jump first.' },
  'pp1-day-flip': { title: 'Before or after?', message: 'Tomorrow is the day after today. Yesterday is the day before.' },
  'pp1-day-skip': { title: 'The very next day', message: 'That day is two away. Find the day right next to it.' },
  'pp1-day-same': { title: 'A different day', message: 'That is the day in the question. The answer is another day.' },
  'pp1-clock-near': { title: 'Look at the short hand', message: 'The short hand tells the hour. It is not on that number.' },
  'pp1-clock-hands': { title: 'Short hand or long hand?', message: 'The short hand tells the hour. The long hand tells the minutes.' },
  'pp1-clock-shift': { title: 'Move on the hours', message: 'Read the hour on the clock. Then count on or back by 1 hour.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

const DAYS =  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const counted = (n, key) => `${n} ${thingWord(key, n)}`;
const choices = (grade, answer, wrongs) => answerChoices(answer, wrongs, choiceCount(grade), null, KNOWN);
const numberChoices = (r, grade, answer, candidates, min = 1, max = 99) => choices(grade, answer, spreadWrongs(r, answer, candidates, { min, max }));
const pickWrongs = (r, candidates) => r.shuffle(candidates).map(([value, code]) => wrong(value, code));
const rowText = values => values.map(value => (value === null ? 'an empty circle' : value)).join(', ');

// A row of numbers, letters or days with one empty place.
const numberRow = (values, description, arrows = false) => ({ kind: 'v3-pp1-num-row', values, arrows, description });
const dayRow = (values, description) => ({ kind: 'v3-pp1-day-row', values, description });
const missingAt = values => values.indexOf(null);

// ---- 1. What comes before, after or between? ----
function draftNear(grade, level, r) {
  const mode = level === 1 ? r.pick(['after', 'after', 'before']) : r.pick(['after', 'before', 'between']);
  const range = {
    1: { after: [1, 9], before: [2, 10] },
    2: { after: [2, 19], before: [3, 20], between: [3, 19] },
    3: { after: [11, 19], before: [12, 20], between: [11, 19] },
  }[level][mode];
  const n = r.int(range[0], range[1]);
  let values;
  let answer;
  let stems;
  let hint;
  let explanation;
  let candidates;
  if (mode === 'after') {
    answer = n + 1;
    values = [n, null];
    stems = [`What number comes after ${n}?`, `Which number comes just after ${n}?`, `What comes next after ${n}?`, `Count on from ${n}. What do you say next?`, `Which number is one more than ${n}?`];
    hint = 'Count on. The number after is one more.';
    explanation = `${n} + 1 = ${answer}, so ${answer} comes right after ${n}.`;
    candidates = [{ n: n - 1, code: 'pp1-near-flip' }, { n: n + 2, code: 'pp1-near-skip' }, { n, code: 'pp1-near-same' }, { n: n + 3, code: 'pp1-near-skip' }];
  } else if (mode === 'before') {
    answer = n - 1;
    values = [null, n];
    stems = [`What number comes before ${n}?`, `Which number comes just before ${n}?`, `Count back. What is just before ${n}?`, `Count back from ${n}. What do you say next?`, `Which number is one less than ${n}?`];
    hint = 'Count back. The number before is one less.';
    explanation = `${n} - 1 = ${answer}, so ${answer} comes right before ${n}.`;
    candidates = [{ n: n + 1, code: 'pp1-near-flip' }, { n: n - 2, code: 'pp1-near-skip' }, { n, code: 'pp1-near-same' }, { n: n - 3, code: 'pp1-near-skip' }];
  } else {
    answer = n;
    values = [n - 1, null, n + 1];
    stems = [`Which number is between ${n - 1} and ${n + 1}?`, `What number goes between ${n - 1} and ${n + 1}?`, `${n - 1}, ?, ${n + 1}. What number is missing?`, `Count on from ${n - 1}. Which number fits the gap before ${n + 1}?`];
    hint = 'Count on from the first number. Stop before the last one.';
    explanation = `${n - 1}, ${answer}, ${n + 1}. ${answer} is in the middle.`;
    candidates = [{ n: n - 1, code: 'pp1-near-same' }, { n: n + 1, code: 'pp1-near-same' }, { n: n + 2, code: 'pp1-near-skip' }, { n: n - 2, code: 'pp1-near-skip' }];
  }
  return build({
    family: 'pp1-num-near', prompt: say(r, stems), answer, hint, explanation, givens: { mode },
    visual: numberRow(values, `Number circles in a row: ${rowText(values)}. An arrow points from each circle to the next one.`, true),
    choices: numberChoices(r, grade, answer, candidates, 1, 20),
  });
}
function solveNear(question) {
  const { values } = question.visual;
  const at = missingAt(values);
  return String(at < values.length - 1 && values[at + 1] !== null ? values[at + 1] - 1 : values[at - 1] + 1);
}

// ---- 2. Count on and back, ten more and ten less, tens and ones. ----
const onesWord = count => (count === 1 ? 'one' : 'ones');
function draftName(grade, level, r) {
  const mode = r.pick(level === 1 ? ['more', 'less'] : level === 2 ? ['more', 'less', 'tenMore', 'tenLess'] : ['more', 'less', 'tenMore', 'tenLess', 'tens', 'ones']);
  const k = level === 1 ? 2 : level === 2 ? r.pick([2, 3]) : r.pick([3, 4, 5]);
  const top = level === 1 ? 10 : 20;
  let n;
  let answer;
  let stems;
  let hint;
  let explanation;
  let candidates;
  if (mode === 'more') {
    n = r.int(1, top - k);
    answer = n + k;
    stems = [`What is ${k} more than ${n}?`, `Count on ${k} from ${n}. Where do you land?`, `${n} and ${k} more make what number?`, `Start at ${n}, then jump ${k} forward. Where are you?`];
    hint = 'Count on from the first number, one step at a time.';
    explanation = `${n} + ${k} = ${answer}.`;
    candidates = [{ n: n - k, code: 'pp1-near-flip' }, { n: answer + 1, code: 'pp1-name-near' }, { n: answer - 1, code: 'pp1-name-near' }, { n, code: 'pp1-name-teen' }];
  } else if (mode === 'less') {
    n = r.int(k + 1, top);
    answer = n - k;
    stems = [`What is ${k} less than ${n}?`, `Count back ${k} from ${n}. Where do you land?`, `${n} take away ${k} leaves what number?`, `Start at ${n}, then jump ${k} back. Where are you?`];
    hint = 'Count back from the first number, one step at a time.';
    explanation = `${n} - ${k} = ${answer}.`;
    candidates = [{ n: n + k, code: 'pp1-near-flip' }, { n: answer + 1, code: 'pp1-name-near' }, { n: answer - 1, code: 'pp1-name-near' }, { n, code: 'pp1-name-teen' }];
  } else if (mode === 'tenMore') {
    n = r.int(1, 10);
    answer = n + 10;
    stems = [`What is 10 more than ${n}?`, `Add 10 to ${n}. What number is it?`, `${n} and 10 more make what number?`];
    hint = '10 more adds 1 to the tens place. The ones stay the same.';
    explanation = `${n} + 10 = ${answer}.`;
    candidates = [{ n, code: 'pp1-name-teen' }, { n: answer + 1, code: 'pp1-name-near' }, { n: answer - 1, code: 'pp1-name-near' }, { n: n + 1, code: 'pp1-name-near' }];
  } else if (mode === 'tenLess') {
    n = r.int(11, 20);
    answer = n - 10;
    stems = [`What is 10 less than ${n}?`, `Take 10 away from ${n}. What is left?`, `${n} take away 10 leaves what number?`];
    hint = '10 less takes 1 from the tens place. The ones stay the same.';
    explanation = `${n} - 10 = ${answer}.`;
    candidates = [{ n, code: 'pp1-name-teen' }, { n: answer + 1, code: 'pp1-name-near' }, { n: answer - 1, code: 'pp1-name-near' }, { n: n - 1, code: 'pp1-name-near' }];
  } else if (mode === 'tens') {
    n = r.int(1, 9);
    answer = 10 + n;
    stems = [`What number is 1 ten and ${n} ${onesWord(n)}?`, `1 ten and ${n} ${onesWord(n)} make which number?`, `Which number has 1 ten and ${n} ${onesWord(n)}?`];
    hint = 'One ten is 10. Put the ones with it.';
    explanation = `1 ten is 10. 10 + ${n} = ${answer}.`;
    candidates = [{ n, code: 'pp1-name-teen' }, { n: answer + 1, code: 'pp1-name-near' }, { n: answer - 1, code: 'pp1-name-near' }, { n: 10, code: 'pp1-name-teen' }];
  } else {
    n = r.int(11, 19);
    answer = n - 10;
    stems = [`${n} is 1 ten and how many ones?`, `How many ones are in ${n}, after the ten?`, `Take 1 ten from ${n}. How many ones are left?`];
    hint = 'Take the ten away. What is left over?';
    explanation = `${n} - 10 = ${answer}, so ${answer} ${onesWord(answer)}.`;
    candidates = [{ n: 1, code: 'pp1-name-teen' }, { n, code: 'pp1-name-teen' }, { n: answer + 1, code: 'pp1-name-near' }, { n: answer - 1, code: 'pp1-name-near' }];
  }
  return build({
    family: 'pp1-num-name', prompt: say(r, stems), answer, hint, explanation,
    givens: { mode, n, k }, choices: numberChoices(r, grade, answer, candidates, 1, 20),
  });
}
function solveName(question) {
  const { mode, n, k } = question.proof.givens;
  return String({ more: n + k, less: n - k, tenMore: n + 10, tenLess: n - 10, tens: 10 + n, ones: n - 10 }[mode]);
}

// ---- 3. Bigger and smaller numbers. ----
function draftBigger(grade, level, r) {
  const top = level === 1 ? 10 : 20;
  const gap = level === 1 ? 2 : 3;
  const pool = [];
  while (pool.length < 3) {
    const value = r.int(level === 3 ? 10 : 1, top);
    if (pool.every(other => Math.abs(other - value) >= gap)) pool.push(value);
    if (pool.length === 2 && level === 3 && Math.floor(pool[0] / 10) !== Math.floor(pool[1] / 10) && r.int(0, 1)) pool.length = 1;
  }
  const bigger = r.int(0, 1) === 0;
  const sorted = [...pool].sort((a, b) => a - b);
  const answer = bigger ? sorted[2] : sorted[0];
  const word = bigger ? 'biggest' : 'smallest';
  const wrongs = bigger
    ? [wrong(sorted[0], 'pp1-big-flip'), wrong(sorted[1], 'pp1-big-mid')]
    : [wrong(sorted[2], 'pp1-big-flip'), wrong(sorted[1], 'pp1-big-mid')];
  const list = `${pool[0]}, ${pool[1]} or ${pool[2]}`;
  const stems = bigger
    ? [`Which is the biggest: ${list}?`, `Pick the biggest number: ${list}.`, `Which number is the most: ${list}?`, `Counting up, which comes last: ${list}?`]
    : [`Which is the smallest: ${list}?`, `Pick the smallest number: ${list}.`, `Which number is the least: ${list}?`, `Counting up, which comes first: ${list}?`];
  return build({
    family: 'pp1-num-bigger', prompt: say(r, stems), answer,
    hint: bigger ? 'The biggest number is the one with the most.' : 'The smallest number is the one with the least.',
    explanation: `${sorted[0]}, ${sorted[1]}, ${sorted[2]} go from smallest to biggest. The ${word} is ${answer}.`,
    givens: { pool, bigger }, choices: choices(grade, String(answer), wrongs),
  });
}
function solveBigger(question) {
  const { pool, bigger } = question.proof.givens;
  return String(bigger ? Math.max(...pool) : Math.min(...pool));
}

// ---- 4. Picture addition: two groups put together. ----
const SIDE = [{ x: 14, w: 196 }, { x: 270, w: 196 }];
function groupPoints(count, side, top, height) {
  const perRow = count <= 4 ? count : Math.ceil(count / 2);
  const rows = Math.ceil(count / perRow);
  const size = Math.min(52, Math.floor((side.w - 16) / perRow) - 6, Math.floor((height - 16) / rows) - 6);
  const gap = 6;
  const startY = top + (height - (rows * size + (rows - 1) * gap)) / 2 + size / 2;
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / perRow);
    const inRow = Math.min(perRow, count - row * perRow);
    const startX = side.x + (side.w - (inRow * size + (inRow - 1) * gap)) / 2 + size / 2;
    return [n1(startX + (index % perRow) * (size + gap)), n1(startY + row * (size + gap)), size];
  });
}
function draftJoin(grade, level, r) {
  const total = level === 1 ? r.int(2, 5) : level === 2 ? r.int(4, 8) : r.int(7, 12);
  const a = r.int(Math.max(1, total - 8), Math.min(8, total - 1));
  const b = total - a;
  const kind = r.pick(TOKENS);
  const stems = [
    `${counted(a, kind)} and ${counted(b, kind)}. How many in all?`,
    `Add ${counted(a, kind)} and ${counted(b, kind)}. How many?`,
    `Put ${counted(a, kind)} with ${counted(b, kind)}. How many now?`,
    `Left: ${counted(a, kind)}. Right: ${b}. How many altogether?`,
    `${a} + ${b} = ? Count the ${thingWord(kind, 2)} in both boxes.`,
  ];
  return build({
    family: 'pp1-add-join', prompt: say(r, stems), answer: total,
    hint: 'Count the left group. Then count on the right group.', explanation: `${a} + ${b} = ${total}.`,
    givens: { kind }, visual: {
      kind: 'v3-pp1-add-join', token: kind, left: groupPoints(a, SIDE[0], 20, 160), right: groupPoints(b, SIDE[1], 20, 160),
      description: `A left box with ${counted(a, kind)}, a plus sign, and a right box with ${counted(b, kind)}.`,
    },
    choices: numberChoices(r, grade, total, [
      { n: a, code: 'pp1-add-one' }, { n: b, code: 'pp1-add-one' }, { n: total + 1, code: 'pp1-add-off' }, { n: total - 1, code: 'pp1-add-off' }, { n: total + 2, code: 'pp1-add-off' },
    ], 1, 14),
  });
}
const solveJoin = question => String(question.visual.left.length + question.visual.right.length);

// ---- 5. Picture subtraction: some are crossed out. ----
function draftTake(grade, level, r) {
  const total = level === 1 ? r.int(3, 6) : level === 2 ? r.int(5, 8) : r.int(8, 12);
  const crossed = r.int(1, level === 1 ? 2 : total - 2);
  const left = total - crossed;
  const kind = r.pick(TOKENS);
  const perRow = total <= 5 ? total : Math.ceil(total / 2);
  const rows = Math.ceil(total / perRow);
  const size = Math.min(56, Math.floor(440 / perRow) - 8, Math.floor(170 / rows) - 8);
  const cells = Array.from({ length: total }, (_, index) => {
    const row = Math.floor(index / perRow);
    const inRow = Math.min(perRow, total - row * perRow);
    const startX = 240 - (inRow * (size + 8) - 8) / 2 + size / 2;
    return [n1(startX + (index % perRow) * (size + 8)), n1(110 + (row - (rows - 1) / 2) * (size + 8)), index >= left ? 1 : 0];
  });
  const stems = [
    `${counted(total, kind)}, ${crossed} crossed out. How many are left?`,
    `${counted(total, kind)}. Take away the ${crossed} crossed out. How many?`,
    `${counted(total, kind)}. ${crossed} ${crossed === 1 ? 'is' : 'are'} crossed out. How many remain?`,
    `Take ${crossed} from ${counted(total, kind)}. How many are left?`,
  ];
  return build({
    family: 'pp1-add-take', prompt: say(r, stems), answer: left,
    hint: 'Do not count the crossed ones. Count the rest.', explanation: `${total} - ${crossed} = ${left}.`,
    givens: { kind }, visual: { kind: 'v3-pp1-add-take', token: kind, size, cells, description: `${counted(total, kind)} in a row. ${crossed} ${crossed === 1 ? 'has a red cross' : 'have a red cross'}.` },
    choices: numberChoices(r, grade, left, [
      { n: total, code: 'pp1-take-total' }, { n: crossed, code: 'pp1-take-crossed' }, { n: left + 1, code: 'pp1-take-off' }, { n: left - 1, code: 'pp1-take-off' }, { n: left + 2, code: 'pp1-take-off' },
    ], 1, 14),
  });
}
const solveTake = question => String(question.visual.cells.filter(cell => !cell[2]).length);

// ---- 6. Letters in a row with one gap. ----
function draftAbc(grade, level, r) {
  const step = level === 1 ? 1 : level === 2 ? r.pick([1, -1]) : r.pick([-1, 2, -1]);
  const lower = level > 1 && r.int(0, 1) === 1;
  const start = step > 0 ? r.int(0, 25 - 4 * step) : r.int(-4 * step, 25);
  const form = letter => (lower ? letter.toLowerCase() : letter);
  const full = Array.from({ length: 5 }, (_, index) => form(LETTERS[start + step * index]));
  const hole = r.int(1, 3);
  const values = full.map((letter, index) => (index === hole ? null : letter));
  const answer = full[hole];
  const at = start + step * hole;
  const words = values.map(value => value ?? '?').join(' ');
  const stems = [`Which letter is missing? ${words}`, `Fill the gap: ${words}`, `${words}. Which letter fits the gap?`];
  const candidates = [[LETTERS[at - step], 'pp1-abc-slip'], [LETTERS[at + step], 'pp1-abc-slip'], [LETTERS[at + 2 * step], 'pp1-abc-skip'], [LETTERS[at - 2 * step], 'pp1-abc-skip']].filter(([letter]) => letter).map(([letter, code]) => [form(letter), code]);
  return build({
    family: 'pp1-pat-alpha', prompt: say(r, stems), answer,
    hint: step < 0 ? 'Say the alphabet backwards from the first letter.' : step > 1 ? 'Skip one letter each time. Say the letters in between.' : 'Say the alphabet from the first letter.',
    explanation: `The letters go ${step > 0 ? 'forward' : 'back'}${Math.abs(step) > 1 ? ', skipping one letter' : ' one at a time'}, so the gap is ${answer}.`,
    givens: { step }, visual: numberRow(values, `5 letter circles in a row: ${rowText(values)}.`),
    choices: choices(grade, answer, pickWrongs(r, candidates)),
  });
}
function solveAbc(question) {
  const { values } = question.visual;
  const known = values.map((value, index) => [value === null ? -1 : LETTERS.indexOf(value.toUpperCase()), index]).filter(([code]) => code >= 0);
  const [[c0, i0], [c1, i1]] = known;
  const found = LETTERS[c0 + (c1 - c0) / (i1 - i0) * (missingAt(values) - i0)];
  const sample = values.find(value => value !== null);
  return sample === sample.toLowerCase() ? found.toLowerCase() : found;
}

// ---- 7. Skip counting gaps. ----
function draftSkip(grade, level, r) {
  const step = r.pick(level === 1 ? [2, 5] : level === 2 ? [2, 5, -2] : [2, 3, -2, -5, -3]);
  const base = Math.abs(step);
  const span = 4 * base;
  const startMin = step > 0 ? (level === 3 ? 1 : 0) : span;
  let start = r.int(startMin, step > 0 ? 20 - span : 20);
  if (level < 3 && base === 2) start -= start % 2;
  const full = Array.from({ length: 5 }, (_, index) => start + step * index);
  if (full.some(value => value < 0 || value > 20)) throw new QuestionRetry('Out of range.');
  const hole = r.int(1, 3);
  const values = full.map((value, index) => (index === hole ? null : value));
  const answer = full[hole];
  const words = values.map(value => value ?? '?').join(' ');
  const lead = step > 0 ? `Count by ${step}s` : `Count back by ${-step}s`;
  return build({
    family: 'pp1-num-skip', prompt: say(r, [`${lead}: ${words}. What is missing?`, `${lead}. Find the gap: ${words}`, `${words}. What number fits the gap?`]), answer,
    hint: step > 0 ? 'Find how far one number jumps up. Jump that far again.' : 'Find how far one number jumps down. Jump that far again.',
    explanation: `The numbers go ${step > 0 ? 'up' : 'down'} by ${base}: ${full.join(', ')}. So the gap is ${answer}.`,
    givens: { step }, visual: numberRow(values, `5 number circles in a row: ${rowText(values)}.`),
    choices: numberChoices(r, grade, answer, [
      { n: answer + (step > 0 ? 1 : -1), code: 'pp1-skip-near' }, { n: answer - (step > 0 ? 1 : -1), code: 'pp1-skip-near' },
      { n: answer + step, code: 'pp1-skip-step' }, { n: answer - step, code: 'pp1-skip-step' }, { n: answer + 2 * step, code: 'pp1-skip-step' },
    ], 0, 20),
  });
}
function solveSkip(question) {
  const { values } = question.visual;
  const known = values.map((value, index) => [value, index]).filter(([value]) => value !== null);
  const [[v0, i0], [v1, i1]] = known;
  return String(v0 + (v1 - v0) / (i1 - i0) * (missingAt(values) - i0));
}

// ---- 8. Days of the week. ----
function draftDay(grade, level, r) {
  const mode = level === 1 ? r.pick(['after', 'before']) : level === 2 ? r.pick(['after', 'before', 'between']) : r.pick(['after', 'before', 'between', 'next', 'prior']);
  const start = r.int(0, 6);
  const day = DAYS[start];
  const next = DAYS[(start + 1) % 7];
  const last = DAYS[(start + 6) % 7];
  let values;
  let answer;
  let stems;
  let candidates;
  let explanation;
  if (mode === 'next') {
    answer = DAYS[(start + 2) % 7];
    values = [day, next, null];
    stems = [`${day}, ${next}, ?. What day comes next?`, `Fill the gap: ${day}, ${next}, ?`];
    explanation = `${day}, ${next}, ${answer}. ${answer} comes after ${next}.`;
    candidates = [[day, 'pp1-day-same'], [last, 'pp1-day-flip'], [DAYS[(start + 3) % 7], 'pp1-day-skip'], [DAYS[(start + 4) % 7], 'pp1-day-skip']];
  } else if (mode === 'prior') {
    answer = last;
    values = [null, day, next];
    stems = [`?, ${day}, ${next}. What day comes first?`, `Fill the gap: ?, ${day}, ${next}`];
    explanation = `${last}, ${day}, ${next}. ${last} comes before ${day}.`;
    candidates = [[next, 'pp1-day-flip'], [day, 'pp1-day-same'], [DAYS[(start + 5) % 7], 'pp1-day-skip'], [DAYS[(start + 3) % 7], 'pp1-day-skip']];
  } else if (mode === 'after') {
    answer = next;
    values = [day, null];
    stems = [`Today is ${day}. What day is tomorrow?`, `Which day comes after ${day}?`, `What day comes just after ${day}?`];
    explanation = `${next} comes right after ${day}.`;
    candidates = [[last, 'pp1-day-flip'], [DAYS[(start + 2) % 7], 'pp1-day-skip'], [day, 'pp1-day-same'], [DAYS[(start + 3) % 7], 'pp1-day-skip']];
  } else if (mode === 'before') {
    answer = last;
    values = [null, day];
    stems = [`Today is ${day}. What day was yesterday?`, `Which day comes before ${day}?`, `What day comes just before ${day}?`];
    explanation = `${last} comes right before ${day}.`;
    candidates = [[next, 'pp1-day-flip'], [DAYS[(start + 5) % 7], 'pp1-day-skip'], [day, 'pp1-day-same'], [DAYS[(start + 4) % 7], 'pp1-day-skip']];
  } else {
    answer = next;
    values = [day, null, DAYS[(start + 2) % 7]];
    stems = [`Which day is between ${day} and ${values[2]}?`, `${day}, ?, ${values[2]}. What day is missing?`];
    explanation = `${day}, ${next}, ${values[2]}. ${next} is in the middle.`;
    candidates = [[day, 'pp1-day-same'], [values[2], 'pp1-day-same'], [DAYS[(start + 3) % 7], 'pp1-day-skip'], [last, 'pp1-day-skip']];
  }
  return build({
    family: 'pp1-day-week', prompt: say(r, stems), answer, hint: mode === 'before' || mode === 'prior' ? 'Go back one day.' : 'Go forward one day.', explanation, givens: { mode },
    visual: dayRow(values, `Day cards in a row: ${rowText(values).replace('an empty circle', 'an empty card')}. An arrow points from each card to the next one.`),
    choices: choices(grade, answer, pickWrongs(r, candidates)),
  });
}
function solveDay(question) {
  const { values } = question.visual;
  const at = missingAt(values);
  const known = at < values.length - 1 && values[at + 1] !== null ? DAYS.indexOf(values[at + 1]) - 1 : DAYS.indexOf(values[at - 1]) + 1;
  return DAYS[(known + 7) % 7];
}

// ---- 9. Clocks: read one, or pick the clock that shows a time. ----
const CLOCK_HUES = { red: '#f4b3a9', blue: '#b7d3f5', green: '#b9e3c0' };
const timeText = h => `${h} o'clock`;
const cap = word => word[0].toUpperCase() + word.slice(1);
const wrapHour = h => ((h + 11) % 12) + 1;
const uniqueHours = list => list.filter(([hour], index) => list.findIndex(([other]) => other === hour) === index);
function clock(h, tint, four = false) {
  const angle = (deg, len) => `x2="${n1(100 + Math.sin(deg * Math.PI / 180) * len)}" y2="${n1(100 - Math.cos(deg * Math.PI / 180) * len)}"`;
  const marks = Array.from({ length: 12 }, (_, index) => {
    const deg = index * 30;
    return `<line x1="${n1(100 + Math.sin(deg * Math.PI / 180) * 80)}" y1="${n1(100 - Math.cos(deg * Math.PI / 180) * 80)}" ${angle(deg, 90)} stroke="${INK}" stroke-width="3"/>`;
  }).join('');
  const numbers = (four ? [12, 3, 6, 9] : Array.from({ length: 12 }, (_, index) => index + 1)).map(value => {
    const deg = value * 30;
    return text(n1(100 + Math.sin(deg * Math.PI / 180) * 66), n1(106 - Math.cos(deg * Math.PI / 180) * 66), value, { size: 17, weight: 700 });
  }).join('');
  const hourDeg = (h % 12) * 30;
  return `<circle cx="100" cy="100" r="97" fill="${tint}" stroke="${INK}" stroke-width="4"/><circle cx="100" cy="100" r="88" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>${marks}${numbers}`
    + `<line x1="100" y1="100" ${angle(hourDeg, 44)} stroke="#675082" stroke-width="9" stroke-linecap="round"/>`
    + `<line x1="100" y1="100" ${angle(0, 66)} stroke="#9d4e2d" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="${INK}"/>`;
}
const clockVisual = (h, tint, four = false) => ({
  kind: 'v3-pp1-clock', hour: h, tint, four,
  description: `A clock. The short hand points at ${h}. The long hand points at 12.`,
});
function draftClock(grade, level, r) {
  const h = r.int(1, 12);
  const mode = level === 3 ? r.pick(['read', 'pick', 'later', 'earlier']) : r.pick(['read', 'pick']);
  const four = level > 1 && r.int(0, 1) === 1;
  const handsHour = h === 12 ? null : 12;
  if (mode === 'pick') {
    const hues = r.shuffle(Object.keys(CLOCK_HUES));
    const others = [[wrapHour(h + 1), 'pp1-clock-near'], [wrapHour(h - 1), 'pp1-clock-near'], ...(handsHour ? [[handsHour, 'pp1-clock-hands']] : [])];
    const wrongs = r.shuffle(uniqueHours(others)).slice(0, 2);
    const cards = [[h, null], ...wrongs].map(([hour, code], index) => ({
      ...clockVisual(hour, CLOCK_HUES[hues[index]], true), tag: `${cap(hues[index])} clock`, code,
      description: `The ${hues[index]} clock. ${clockVisual(hour, '').description}`,
    }));
    return build({
      family: 'pp1-time-clock', prompt: say(r, [`Which clock shows ${timeText(h)}?`, `Find the clock that shows ${timeText(h)}.`, `Touch the clock that says ${timeText(h)}.`]), answer: cards[0].tag,
      hint: 'Look at the short hand for the hour. Check the long hand too.',
      explanation: `The ${hues[0]} clock has the short hand on ${h} and the long hand on 12.`,
      givens: { h, mode },
      choices: answerChoices(cards[0].tag, cards.slice(1).map(card => wrong(card.tag, card.code, card)), choiceCount(grade), cards[0], KNOWN),
    });
  }
  const answerHour = mode === 'later' ? wrapHour(h + 1) : mode === 'earlier' ? wrapHour(h - 1) : h;
  const answer = timeText(answerHour);
  let candidates;
  if (mode === 'later') candidates = [[h, 'pp1-clock-shift'], [wrapHour(h - 1), 'pp1-clock-shift'], [wrapHour(h + 2), 'pp1-clock-shift']];
  else if (mode === 'earlier') candidates = [[h, 'pp1-clock-shift'], [wrapHour(h + 1), 'pp1-clock-shift'], [wrapHour(h - 2), 'pp1-clock-shift']];
  else candidates = [[wrapHour(h + 1), 'pp1-clock-near'], [wrapHour(h - 1), 'pp1-clock-near'], ...(handsHour ? [[handsHour, 'pp1-clock-hands']] : [])];
  const wrongs = r.shuffle(uniqueHours(candidates)).slice(0, 2).map(([hour, code]) => wrong(timeText(hour), code));
  const stems = {
    read: ['What time is it on this clock?', 'Read the clock. What time is it?', 'What time does the clock show?'],
    later: ['What time is it 1 hour after this clock?', 'Move on 1 hour from this clock. What time is it?'],
    earlier: ['What time was it 1 hour before this clock?', 'Go back 1 hour from this clock. What time is it?'],
  }[mode];
  const explanation = {
    read: `The short hand is on ${h} and the long hand is on 12. It is ${answer}.`,
    later: h === 12 ? `The clock shows 12 o'clock. One hour later is 1 o'clock.` : `The clock shows ${timeText(h)}. ${h} + 1 = ${h + 1}, so ${answer}.`,
    earlier: h === 1 ? `The clock shows 1 o'clock. One hour before is 12 o'clock.` : `The clock shows ${timeText(h)}. ${h} - 1 = ${h - 1}, so ${answer}.`,
  }[mode];
  return build({
    family: 'pp1-time-clock', prompt: say(r, stems), answer,
    hint: mode === 'read' ? 'Short hand: the hour. Long hand up means o\'clock.' : 'Read the hour on the clock first. Then count the hours on or back.',
    explanation, givens: { h, mode }, visual: clockVisual(h, '#fff0c2', four),
    choices: choices(grade, answer, wrongs),
  });
}
function solveClock(question) {
  const { h, mode } = question.proof.givens;
  if (mode === 'pick') {
    const matches = question.options.filter((_, index) => question.optionVisuals[index].hour === h);
    if (matches.length !== 1) throw new Error(`Expected exactly one matching clock, found ${matches.length}.`);
    return matches[0];
  }
  const hour = question.visual.hour;
  return timeText(mode === 'later' ? wrapHour(hour + 1) : mode === 'earlier' ? wrapHour(hour - 1) : hour);
}

const DEFS = {
  'pp1-num-near': { skill: 'sequence', title: 'Number before, after and between', draft: draftNear, solve: solveNear },
  'pp1-num-name': { skill: 'count', title: 'Count on, count back and tens', draft: draftName, solve: solveName },
  'pp1-num-bigger': { skill: 'compare', title: 'Bigger and smaller numbers', draft: draftBigger, solve: solveBigger },
  'pp1-add-join': { skill: 'addition', title: 'Put two picture groups together', draft: draftJoin, solve: solveJoin },
  'pp1-add-take': { skill: 'subtraction', title: 'Take away the crossed out ones', draft: draftTake, solve: solveTake },
  'pp1-pat-alpha': { skill: 'sequence', title: 'Letters in order, forwards and back', draft: draftAbc, solve: solveAbc },
  'pp1-num-skip': { skill: 'sequence', title: 'Count by twos, fives and tens', draft: draftSkip, solve: solveSkip },
  'pp1-day-week': { skill: 'calendar', title: 'Days of the week in order', draft: draftDay, solve: solveDay },
  'pp1-time-clock': { skill: 'time', title: 'Read the clock and move on one hour', draft: draftClock, solve: solveClock },
};
export const FAMILIES = Object.fromEntries(Object.entries(DEFS).map(([id, def]) => [id, { skill: def.skill, title: def.title }]));
export const draft = (family, grade, level, r) => DEFS[family].draft(grade, level, r);
export const solve = question => DEFS[question.family].solve(question);

function rowPicture(v) {
  const count = v.values.length;
  const radius = count === 2 ? 46 : count === 3 ? 38 : 32;
  const xs = v.values.map((_, index) => n1(480 * (index + 1) / (count + 1)));
  const parts = [plate('night', 480, 140, { stars: 6 })];
  v.values.forEach((value, index) => {
    const x = xs[index];
    if (value === null) parts.push(`<circle cx="${x}" cy="70" r="${radius}" fill="#fff0c2" stroke="${ORANGE}" stroke-width="4.5" stroke-dasharray="9 6"/>${text(x, 70 + radius * 0.42, '?', { size: n1(radius * 1.2), weight: 800, fill: ORANGE })}`);
    else parts.push(badge(x, 70, radius, value, { size: n1(radius * (String(value).length > 1 ? 1.1 : 1.3)) }));
    if (v.arrows && index < count - 1) parts.push(arrow(n1((x + xs[index + 1]) / 2), 70, 26, 'right', HUES.orange));
  });
  return svg(parts.join(''), v.description, 480, 140);
}
function dayPicture(v) {
  const count = v.values.length;
  const width = count === 2 ? 150 : 122;
  const xs = v.values.map((_, index) => n1(480 * (index + 1) / (count + 1)));
  const parts = [plate('sunny', 480, 130)];
  v.values.forEach((value, index) => {
    const x = xs[index];
    if (value === null) parts.push(`<rect x="${n1(x - width / 2)}" y="32" width="${width}" height="66" rx="14" fill="#fffdf5" stroke="${ORANGE}" stroke-width="4.5" stroke-dasharray="9 6"/>${text(x, 78, '?', { size: 40, weight: 800, fill: ORANGE })}`);
    else parts.push(`<rect x="${n1(x - width / 2)}" y="32" width="${width}" height="66" rx="14" fill="#fffdf5" stroke="${INK}" stroke-width="4"/>${text(x, 72, value, { size: 20, weight: 800 })}`);
    if (index < count - 1) parts.push(arrow(n1((x + xs[index + 1]) / 2), 65, 26, 'right', HUES.orange));
  });
  return svg(parts.join(''), v.description, 480, 130);
}
const boxes = [0, 1].map(index => `<rect x="${SIDE[index].x}" y="14" width="${SIDE[index].w}" height="172" rx="16" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>`);
const RENDER = {
  'v3-pp1-num-row': rowPicture,
  'v3-pp1-day-row': dayPicture,
  'v3-pp1-add-join': v => svg(plate('sky', 480, 200) + boxes.join('') + v.left.map(([x, y, size]) => token(v.token, x, y, size * 0.9)).join('')
    + v.right.map(([x, y, size]) => token(v.token, x, y, size * 0.9)).join('') + text(240, 118, '+', { size: 54, weight: 800, fill: HUES.orange }), v.description, 480, 200),
  'v3-pp1-add-take': v => svg(plate('mint', 480, 220) + v.cells.map(([x, y, gone]) => token(v.token, x, y, v.size * 0.84)
    + (gone ? `<path d="M${n1(x - v.size * 0.45)} ${n1(y - v.size * 0.45)}L${n1(x + v.size * 0.45)} ${n1(y + v.size * 0.45)}M${n1(x + v.size * 0.45)} ${n1(y - v.size * 0.45)}L${n1(x - v.size * 0.45)} ${n1(y + v.size * 0.45)}" stroke="#d1362b" stroke-width="6" stroke-linecap="round"/>` : '')).join(''), v.description, 480, 220),
  'v3-pp1-clock': v => svg(clock(v.hour, v.tint, v.four), v.description, 200, 200),
};
export const render = visual => RENDER[visual.kind]?.(visual) ?? null;
