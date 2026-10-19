// Class 5 "real paper" reasoning families, modelled on SOF IMO Logical Reasoning items. Imported by bank3-class-5.mjs.
import { choiceCount, numberText, timeText } from './bank-shared.mjs';
import { circle, clockDescription, line, path, rect, svg, text, INK, GREEN, ORANGE, PAPER } from './diagram-kit.mjs';
import {
  CADETS, DIRS, DIR_ORDER, FEMALE, KNOWN, MALE, QuestionRetry, WEEKDAYS, digitSum, gcd, isCube, isPrime, isSquare,
  letterAt, ord, pickChoices, posOf, turnDir,
} from './bank3-class-5-real-kit.mjs';

export const REASONING_FAMILIES = {
  'class-5-order-middle': { skill: 'compare', title: 'Arrange numbers in order and pick one by position' },
  'class-5-walk-distance': { skill: 'directions', title: 'Find where a walk with turns ends from the start' },
  'class-5-blood-relation': { skill: 'ranking', title: 'Work out a family relation from linked clues' },
  'class-5-mirror-clock': { skill: 'time', title: 'Read a mirror clock or the angle between hands' },
  'class-5-letter-code': { skill: 'coding', title: 'Crack a letter or number word code' },
  'class-5-compass-map': { skill: 'directions', title: 'Find a compass direction from linked positions' },
  'class-5-row-swap-rank': { skill: 'ranking', title: 'Use ranks in a row before and after a swap' },
  'class-5-odd-one-out': { skill: 'odd', title: 'Pick the odd one out of numbers or words' },
  'class-5-alpha-series': { skill: 'sequence', title: 'Fill the missing term in a letter series' },
  'class-5-number-series': { skill: 'sequence', title: 'Fill the missing term in a number series' },
  'class-5-count-grid': { skill: 'shape', title: 'Count every square or triangle in a figure' },
  'class-5-day-sequence': { skill: 'calendar', title: 'Reason about days of the week from a clue' },
  'class-5-fold-cut-count': { skill: 'visual', title: 'Count holes, pieces or posts after folding or cutting' },
  'class-5-venn-survey': { skill: 'mystery', title: 'Find the overlap or one part of a two-group survey' },
  'class-5-order-people': { skill: 'ranking', title: 'Order people from linked comparison clues' },
};

export const DRAFT = {};
export const SOLVE = {};

const unitsOnly = value => String(value);

// ---------------------------------------------------------------------------
// Number ordering
// ---------------------------------------------------------------------------
DRAFT['class-5-order-middle'] = (family, grade, level, r) => {
  const digits = level === 1 ? 3 : level === 2 ? 4 : 5;
  const mode = r.pick(level === 1 ? ['middle', 'kth'] : ['middle', 'kth', 'digit']);
  const lead = r.int(1, 8) * 10 ** (digits - 1);
  const set = new Set();
  while (set.size < 5) set.add(lead + r.int(0, 10 ** (digits - 1) - 1));
  const nums = r.shuffle([...set]);
  const given = { nums, mode };
  const list = nums.map(numberText).join(', ');
  const asc = [...nums].sort((a, b) => a - b);
  const desc = [...asc].reverse();
  let prompt;
  let answer;
  let pairs;
  let hint;
  let explanation;
  if (mode === 'middle') {
    answer = asc[2];
    prompt = `Arrange ${list} in ascending order. Which number is in the middle?`;
    pairs = [[nums[2], 'class-5-order-slip'], [asc[1], 'class-5-order-slip'], [asc[3], 'class-5-order-slip'], [asc[0], 'class-5-order-slip'], [asc[4], 'class-5-order-slip']];
    hint = 'Write the numbers from smallest to greatest; the middle one is the third of five.';
    explanation = `Ascending order is ${asc.map(numberText).join(', ')}. The third number, ${numberText(answer)}, is in the middle.`;
  } else if (mode === 'kth') {
    const side = r.pick(['greatest', 'smallest']);
    const k = r.pick([2, 4]);
    given.side = side;
    given.k = k;
    answer = (side === 'greatest' ? desc : asc)[k - 1];
    prompt = `From ${list}, which is the ${ord(k)} ${side} number?`;
    const other = (side === 'greatest' ? asc : desc)[k - 1];
    pairs = [[other, 'class-5-order-slip'], [(side === 'greatest' ? desc : asc)[k], 'class-5-order-slip'], [(side === 'greatest' ? desc : asc)[k - 2], 'class-5-order-slip'], [nums[k - 1], 'class-5-order-slip']];
    hint = `Sort all five numbers first, then count to the ${ord(k)} ${side}.`;
    explanation = `Sorted from ${side === 'greatest' ? 'greatest' : 'smallest'}: ${(side === 'greatest' ? desc : asc).map(numberText).join(', ')}. The ${ord(k)} is ${numberText(answer)}.`;
  } else {
    const k = r.pick([2, 3, 4]);
    const place = r.pick(['tens', 'hundreds']);
    given.k = k;
    given.place = place;
    const power = place === 'tens' ? 10 : 100;
    const digitOf = n => Math.floor(n / power) % 10;
    answer = digitOf(desc[k - 1]);
    prompt = `Arrange ${list} from greatest to smallest. What is the ${place} digit of the ${ord(k)} number?`;
    pairs = [[digitOf(asc[k - 1]), 'class-5-order-slip'], [digitOf(nums[k - 1]), 'class-5-order-slip'], [digitOf(desc[k]), 'class-5-order-slip'], [digitOf(desc[k - 2]), 'class-5-order-slip'], [(answer + 1) % 10, 'face-value']];
    hint = 'Sort the numbers from greatest first, pick the position asked, then read the digit.';
    explanation = `Greatest first: ${desc.map(numberText).join(', ')}. The ${ord(k)} is ${numberText(desc[k - 1])}; its ${place} digit is ${answer}.`;
  }
  return {
    family, prompt, answer: String(answer), hint, explanation,
    proof: { family, givens: given }, visual: null,
    choices: pickChoices(answer, pairs, choiceCount(grade), r, { numeric: true }),
  };
};
SOLVE['class-5-order-middle'] = q => {
  const { nums, mode, side, k, place } = q.proof.givens;
  const asc = [...nums].sort((a, b) => a - b);
  const desc = [...asc].reverse();
  if (mode === 'middle') return String(asc[2]);
  if (mode === 'kth') return String((side === 'greatest' ? desc : asc)[k - 1]);
  const power = place === 'tens' ? 10 : 100;
  return String(Math.floor(desc[k - 1] / power) % 10);
};

// ---------------------------------------------------------------------------
// Walk with turns
// ---------------------------------------------------------------------------
const walkEnd = legs => legs.reduce(([x, y], { dir, d }) => [x + DIRS[dir].dx * d, y + DIRS[dir].dy * d], [0, 0]);
const compassOf = (dx, dy) => {
  const ns = dy > 0 ? 'north' : dy < 0 ? 'south' : '';
  const ew = dx > 0 ? 'east' : dx < 0 ? 'west' : '';
  return [ns, ew].filter(Boolean).join('-');
};
const OPPOSITE_WORD = { north: 'south', south: 'north', east: 'west', west: 'east', 'north-east': 'south-west', 'south-west': 'north-east', 'north-west': 'south-east', 'south-east': 'north-west' };
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]];

DRAFT['class-5-walk-distance'] = (family, grade, level, r) => {
  const legCount = level === 1 ? 3 : 4;
  let found = null;
  for (let attempt = 0; attempt < 120 && !found; attempt++) {
    let dir = r.pick(DIR_ORDER);
    const legs = [{ dir, turn: null, d: r.int(2, level === 1 ? 7 : 12) }];
    for (let i = 1; i < legCount; i++) {
      const turn = r.pick(['left', 'right']);
      dir = turnDir(dir, turn);
      legs.push({ dir, turn, d: r.int(2, level === 1 ? 7 : 12) });
    }
    const [dx, dy] = walkEnd(legs);
    if (dx === 0 && dy === 0) continue;
    if (dx === 0 || dy === 0) found = { legs, mode: 'place' };
    else if (level >= 2 && TRIPLES.some(([a, b]) => (Math.abs(dx) === a && Math.abs(dy) === b) || (Math.abs(dx) === b && Math.abs(dy) === a))) found = { legs, mode: 'straight' };
  }
  if (!found) throw new QuestionRetry('No clean walk found');
  const { legs, mode } = found;
  const [dx, dy] = walkEnd(legs);
  const name = r.pick(CADETS);
  const home = r.pick(['the start', 'the base', 'the gate', 'the dock', 'the lab', 'the camp']);
  const legText = legs.map((leg, i) => (i === 0 ? `${leg.d} m ${DIRS[leg.dir].word}` : `turns ${leg.turn} and walks ${leg.d} m`)).join(', ');
  const drawn = r.int(0, 1) === 1;
  let points = [[0, 0]];
  for (const { dir, d } of legs) { const [x, y] = points[points.length - 1]; points.push([x + DIRS[dir].dx * d, y + DIRS[dir].dy * d]); }
  const dist = Math.abs(dx) + Math.abs(dy);
  const hyp = Math.round(Math.hypot(dx, dy));
  const word = compassOf(dx, dy);
  let answer;
  let pairs;
  if (mode === 'place') {
    answer = `${dist} m ${word} of ${home}`;
    const perp = DIR_ORDER.map(k => DIRS[k].word).filter(w => w !== word && w !== OPPOSITE_WORD[word]);
    pairs = [
      [`${dist} m ${OPPOSITE_WORD[word]} of ${home}`, 'turn-frame'],
      [`${dist} m ${perp[0]} of ${home}`, 'turn-frame'],
      [`${legs.reduce((total, leg) => total + leg.d, 0)} m ${word} of ${home}`, 'class-5-walk-cancel'],
      [`${dist + 2} m ${word} of ${home}`, 'class-5-walk-cancel'],
      [`${Math.max(1, dist - 2)} m ${word} of ${home}`, 'class-5-walk-cancel'],
      [`${Math.max(1, dist - 1)} m ${word} of ${home}`, 'class-5-walk-cancel'],
      [`${Math.max(1, dist - 4)} m ${word} of ${home}`, 'class-5-walk-cancel'],
      [`${dist + 4} m ${word} of ${home}`, 'class-5-walk-cancel'],
    ];
  } else {
    answer = `${hyp} m`;
    pairs = [[`${Math.abs(dx) + Math.abs(dy)} m`, 'class-5-walk-cancel'], [`${hyp + 2} m`, 'class-5-walk-cancel'], [`${Math.abs(Math.abs(dx) - Math.abs(dy))} m`, 'class-5-walk-cancel'], [`${hyp - 1} m`, 'wrong-operation'], [`${hyp + 1} m`, 'wrong-operation'], [`${Math.max(1, hyp - 3)} m`, 'wrong-operation']];
  }
  const ask = mode === 'place' ? `Where is ${name} from ${home}?` : `What is ${name}'s straight-line distance from ${home}?`;
  const prompt = drawn
    ? `${name}'s walk is drawn on the map (north is up). ${ask}`
    : `${name} walks ${legText}. ${ask}`;
  const visual = drawn ? {
    kind: 'v3-class-5-walk', pts: points, labels: legs.map(leg => `${leg.d} m`),
    description: `A map path from ${home} S through ${legs.length} straight legs of ${legs.map(l => `${l.d} m`).join(', ')}, ending at E. North is up.`,
  } : null;
  return {
    family, prompt, answer, visual,
    hint: 'Moves in opposite directions cancel. Find how far east-west and north-south you end up.',
    explanation: mode === 'place'
      ? `Net movement: ${Math.abs(dx)} m ${dx > 0 ? 'east' : dx < 0 ? 'west' : 'across'}, ${Math.abs(dy)} m ${dy > 0 ? 'north' : dy < 0 ? 'south' : 'up'}. So ${name} is ${dist} m ${word} of ${home}.`
      : `Net movement is ${Math.abs(dx)} m across and ${Math.abs(dy)} m up. A right triangle with these sides has a hypotenuse of ${hyp} m.`,
    proof: { family, givens: { legs: legs.map(({ dir, d }) => ({ dir, d })), mode, home } },
    choices: pickChoices(answer, pairs, choiceCount(grade), r),
  };
};
SOLVE['class-5-walk-distance'] = q => {
  const { legs, mode, home } = q.proof.givens;
  const [dx, dy] = walkEnd(legs);
  return mode === 'place' ? `${Math.abs(dx) + Math.abs(dy)} m ${compassOf(dx, dy)} of ${home}` : `${Math.round(Math.hypot(dx, dy))} m`;
};

const renderWalk = visual => {
  const xs = visual.pts.map(p => p[0]);
  const ys = visual.pts.map(p => p[1]);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const scale = Math.min(300 / Math.max(maxX - minX, 1), 170 / Math.max(maxY - minY, 1), 34);
  const ox = 80 + (300 - (maxX - minX) * scale) / 2;
  const oy = 55 + (170 - (maxY - minY) * scale) / 2;
  const px = ([x, y]) => [ox + (x - minX) * scale, oy + (maxY - y) * scale];
  let body = rect(0, 0, 480, 280, { fill: '#f4f1e4', stroke: '#d8d2c0', rx: 10, strokeWidth: 1 });
  body += line(446, 90, 446, 44, { width: 3 }) + path('M446 36 438 52H454Z', { fill: INK }) + text(446, 112, 'N', { size: 18 });
  const pts = visual.pts.map(px);
  body += path(`M${pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L')}`, { stroke: ORANGE, strokeWidth: 5 });
  visual.labels.forEach((label, i) => {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    const horizontal = Math.abs(pts[i][1] - pts[i + 1][1]) < 1;
    body += text(horizontal ? mx : mx + 28, horizontal ? my - 12 : my + 6, label, { size: 17 });
  });
  body += circle(pts[0][0], pts[0][1], 9, { fill: GREEN }) + text(pts[0][0] - 20, pts[0][1] + 6, 'S', { size: 18, weight: 800 });
  const end = pts[pts.length - 1];
  body += circle(end[0], end[1], 9, { fill: PAPER }) + text(end[0] + 20, end[1] + 6, 'E', { size: 18, weight: 800 });
  return svg(body, visual.description, 480, 280);
};

// ---------------------------------------------------------------------------
// Blood relations
// ---------------------------------------------------------------------------
const RELATIONS = [
  { lvl: 1, text: '{F1} is the mother of {M1}. {M1} is the brother of {F2}. How is {F1} related to {F2}?', answer: 'mother', wrongs: ['grandmother', 'aunt', 'sister'], need: [1, 1, 1, 1] },
  { lvl: 1, text: '{M1} is the only son of {M2}. {F1} is the daughter of {M1}. How is {M2} related to {F1}?', answer: 'grandfather', wrongs: ['father', 'uncle', 'brother'], need: [2, 0, 1, 0] },
  { lvl: 1, text: '{M1} is the husband of {F1}. {F1} is the mother of {F2}. How is {M1} related to {F2}?', answer: 'father', wrongs: ['grandfather', 'uncle', 'brother'], need: [1, 0, 2, 0] },
  { lvl: 1, text: "{F1}'s mother is {F2}. {F2}'s husband is {M1}. How is {M1} related to {F1}?", answer: 'grandfather', wrongs: ['father', 'uncle', 'brother'], need: [1, 0, 2, 0] },
  { lvl: 1, text: "{F1}'s father {M1} has a brother {M2}. How is {M2} related to {F1}?", answer: 'uncle', wrongs: ['father', 'grandfather', 'brother'], need: [2, 0, 1, 0] },
  { lvl: 1, text: "{M1}'s son is {M2}. {M2}'s sister is {F1}. How is {M1} related to {F1}?", answer: 'father', wrongs: ['uncle', 'grandfather', 'brother'], need: [2, 0, 1, 0] },
  { lvl: 2, text: '{F1} is the sister of {M1}. {M1} is the father of {F2}. How is {F1} related to {F2}?', answer: 'aunt', wrongs: ['mother', 'grandmother', 'cousin'], need: [1, 1, 1, 1] },
  { lvl: 2, text: "{M1} is the brother of {F1}. {F1}'s daughter is {F2}. How is {M1} related to {F2}?", answer: 'uncle', wrongs: ['father', 'grandfather', 'brother'], need: [1, 0, 2, 0] },
  { lvl: 2, text: '{F1} is the mother of {M1}. {M1} is the father of {F2}. How is {F1} related to {F2}?', answer: 'grandmother', wrongs: ['mother', 'aunt', 'sister'], need: [1, 1, 1, 1] },
  { lvl: 2, text: '{M1} is the father of {F1}. {F1} is the sister of {M2}. {M2} is the father of {F2}. How is {M1} related to {F2}?', answer: 'grandfather', wrongs: ['father', 'uncle', 'brother'], need: [2, 0, 1, 1] },
  { lvl: 3, text: '{F1} is the daughter of {M1}. {M1} is the brother of {F2}. {F2} has a son, {M2}. How is {F1} related to {M2}?', answer: 'cousin', wrongs: ['sister', 'niece', 'aunt'], need: [2, 0, 2, 0] },
  { lvl: 3, text: 'Pointing at {M1}, {F1} says, "He is the son of my mother\'s only brother." How is {M1} related to {F1}?', answer: 'cousin', wrongs: ['brother', 'uncle', 'nephew'], need: [1, 1, 0, 0] },
  { lvl: 3, text: 'Pointing at {F1}, {M1} says, "She is the daughter of my father\'s only son." How is {F1} related to {M1}?', answer: 'daughter', wrongs: ['sister', 'niece', 'cousin'], need: [1, 1, 0, 0] },
  { lvl: 3, text: '{M1} is the brother of {M2}. {M2} is the son of {F1}. {F1} is the mother of {F2}. How is {M1} related to {F2}?', answer: 'brother', wrongs: ['uncle', 'father', 'cousin'], need: [2, 0, 1, 1] },
  { lvl: 1, text: '{F1} is the wife of {M1}. {M1} is the father of {F2}. How is {F1} related to {F2}?', answer: 'mother', wrongs: ['grandmother', 'aunt', 'sister'], need: [1, 1, 1, 1] },
  { lvl: 1, text: "{M1}'s sister is {F1}. {F1} has a daughter, {F2}. How is {M1} related to {F2}?", answer: 'uncle', wrongs: ['father', 'grandfather', 'brother'], need: [1, 0, 2, 0] },
  { lvl: 1, text: '{F1} is the only daughter of {F2}. How is {F2} related to {F1}?', answer: 'mother', wrongs: ['sister', 'aunt', 'grandmother'], need: [0, 0, 2, 0] },
  { lvl: 1, text: '{M1} is the son of {F1}. How is {F1} related to {M1}?', answer: 'mother', wrongs: ['sister', 'aunt', 'grandmother'], need: [1, 0, 1, 0] },
  { lvl: 1, text: '{M1} is the father of {M2}. How is {M2} related to {M1}?', answer: 'son', wrongs: ['brother', 'nephew', 'uncle'], need: [2, 0, 0, 0] },
  { lvl: 1, text: '{M1} and {M2} are brothers. {M2} has a daughter, {F1}. How is {M1} related to {F1}?', answer: 'uncle', wrongs: ['father', 'grandfather', 'cousin'], need: [2, 0, 1, 0] },
  { lvl: 1, text: '{F1} and {F2} are sisters. {F2} has a son, {M1}. How is {F1} related to {M1}?', answer: 'aunt', wrongs: ['mother', 'grandmother', 'cousin'], need: [1, 0, 2, 0] },
  { lvl: 1, text: '{M1} is the father of {F1}. {F1} is the mother of {M2}. How is {M1} related to {M2}?', answer: 'grandfather', wrongs: ['father', 'uncle', 'brother'], need: [2, 0, 1, 0] },
  { lvl: 1, text: '{F1} is the mother of {F2}. {F2} is the mother of {M1}. How is {F1} related to {M1}?', answer: 'grandmother', wrongs: ['mother', 'aunt', 'sister'], need: [1, 0, 2, 0] },
  { lvl: 1, text: '{M1} is the brother of {F1}. How is {F1} related to {M1}?', answer: 'sister', wrongs: ['mother', 'aunt', 'cousin'], need: [1, 0, 1, 0] },
  { lvl: 1, text: '{F1} is the sister of {M1}. How is {M1} related to {F1}?', answer: 'brother', wrongs: ['father', 'uncle', 'cousin'], need: [1, 0, 1, 0] },
  { lvl: 1, text: "{M1}'s wife is {F1}. How is {M1} related to {F1}?", answer: 'husband', wrongs: ['brother', 'father', 'son'], need: [1, 0, 1, 0] },
  { lvl: 1, text: "{F1}'s daughter is {F2}. {F2}'s brother is {M1}. How is {F1} related to {M1}?", answer: 'mother', wrongs: ['grandmother', 'aunt', 'sister'], need: [1, 0, 2, 0] },
  { lvl: 1, text: "{M1}'s father is {M2}. {M2}'s wife is {F1}. How is {F1} related to {M1}?", answer: 'grandmother', wrongs: ['mother', 'aunt', 'sister'], need: [2, 0, 1, 0] },
  { lvl: 1, text: "{F1}'s brother is {M1}. {M1}'s son is {M2}. How is {F1} related to {M2}?", answer: 'aunt', wrongs: ['mother', 'grandmother', 'sister'], need: [2, 0, 1, 0] },
  { lvl: 1, text: "{M1}'s mother is {F1}. {F1}'s son is {M2}. How is {M1} related to {M2}?", answer: 'brother', wrongs: ['father', 'uncle', 'cousin'], need: [2, 0, 1, 0] },
];
const fillRelation = (template, picks) => template.replace(/\{(M|F)(\d)\}/g, (all, g, n) => picks[`${g}${n}`]);

DRAFT['class-5-blood-relation'] = (family, grade, level, r) => {
  const pool = RELATIONS.filter(item => (level === 1 ? item.lvl === 1 : level === 2 ? item.lvl <= 2 : item.lvl >= 2));
  const index = RELATIONS.indexOf(r.pick(pool));
  const item = RELATIONS[index];
  const males = r.shuffle(MALE);
  const females = r.shuffle(FEMALE);
  const picks = { M1: males[0], M2: males[1], F1: females[0], F2: females[1] };
  const prompt = fillRelation(item.text, picks);
  return {
    family, prompt, answer: item.answer, visual: null,
    hint: 'Go one link at a time. Note whether each person is a man or a woman from the clue.',
    explanation: `Following each link in order, the person asked about is the ${item.answer} of the other person.`,
    proof: { family, givens: { index, picks } },
    choices: pickChoices(item.answer, item.wrongs.map(word => [word, 'class-5-relation-gen']), choiceCount(grade), r),
  };
};
SOLVE['class-5-blood-relation'] = q => RELATIONS[q.proof.givens.index].answer;

// ---------------------------------------------------------------------------
// Mirror clock and the angle between hands
// ---------------------------------------------------------------------------
DRAFT['class-5-mirror-clock'] = (family, grade, level, r) => {
  const mode = r.pick(['mirror', 'angle']);
  const picture = r.int(0, 1) === 1;
  if (mode === 'mirror') {
    const hour = r.int(1, 11);
    const minute = r.pick(level === 1 ? [0, 30, 15, 45] : [5, 10, 20, 25, 35, 40, 50, 55]);
    const shown = hour * 60 + minute;
    if (shown % 360 === 0) throw new QuestionRetry('Symmetric time');
    const actual = (720 - shown) % 720;
    const answer = timeText(actual);
    const pairs = [
      [timeText(shown), 'class-5-mirror-time'],
      [timeText((shown + 360) % 720), 'class-5-mirror-time'],
      [timeText((720 - ((shown + 60) % 720)) % 720), 'class-5-mirror-time'],
      [timeText(((720 - shown + 60) % 720)), 'class-5-mirror-time'],
      [timeText(((720 - shown + 720 - 60) % 720)), 'class-5-mirror-time'],
    ];
    return {
      family, answer, visual: picture ? { kind: 'v3-class-5-clock', minutes: shown, description: clockDescription(shown) } : null,
      prompt: picture ? 'This clock is seen in a mirror. What is the real time?' : `A clock in a mirror seems to show ${timeText(shown)}. What is the real time?`,
      hint: 'Subtract the mirror time from 11:60. Hours from 11, minutes from 60.',
      explanation: `Real time = 11:60 - ${timeText(shown)} = ${answer}.`,
      proof: { family, givens: { mode, shown } },
      choices: pickChoices(answer, pairs, choiceCount(grade), r),
    };
  }
  const hour = r.int(1, 11);
  const minute = r.pick(level === 1 ? [0, 30] : [0, 30, 20, 40, 10, 50]);
  const minutes = hour * 60 + minute;
  const raw = Math.abs(30 * hour - 5.5 * minute);
  const angle = raw > 180 ? 360 - raw : raw;
  if (angle === 0 || angle === 180 || !Number.isInteger(angle)) throw new QuestionRetry('Plain angle');
  const naive = Math.abs(30 * hour - 6 * minute);
  const pairs = [[`${naive > 180 ? 360 - naive : naive} deg`, 'clock-hands'], [`${360 - angle} deg`, 'angle-relation'], [`${angle + 15} deg`, 'clock-hands'], [`${Math.abs(angle - 15)} deg`, 'clock-hands'], [`${angle + 30} deg`, 'clock-hands']];
  return {
    family, answer: `${angle} deg`, visual: picture ? { kind: 'v3-class-5-clock', minutes, description: clockDescription(minutes) } : null,
    prompt: picture ? 'What is the smaller angle between the two hands of this clock?' : `What is the smaller angle between the hands of a clock at ${timeText(minutes)}?`,
    hint: 'The hour hand moves 30 degrees an hour, and the minute hand 6 degrees a minute. Move the hour hand too.',
    explanation: `At ${timeText(minutes)} the hour hand is at ${30 * hour + minute / 2} degrees and the minute hand at ${6 * minute}. The gap is ${angle} degrees.`,
    proof: { family, givens: { mode, minutes } },
    choices: pickChoices(`${angle} deg`, pairs, choiceCount(grade), r),
  };
};
SOLVE['class-5-mirror-clock'] = q => {
  const { mode, shown, minutes } = q.proof.givens;
  if (mode === 'mirror') return timeText((720 - shown) % 720);
  const hour = Math.floor(minutes / 60) % 12;
  const minute = minutes % 60;
  const raw = Math.abs(30 * hour + minute / 2 - 6 * minute);
  return `${raw > 180 ? 360 - raw : raw} deg`;
};

// ---------------------------------------------------------------------------
// Letter codes
// ---------------------------------------------------------------------------
const CODE_WORDS = ['MOON', 'STAR', 'SHIP', 'LAND', 'FUEL', 'ROCK', 'BEAM', 'GRID', 'CODE', 'DUST', 'HELM', 'PORT', 'NOVA', 'DOCK', 'COMET', 'ORBIT', 'PROBE', 'RADAR', 'LASER', 'SOLAR'];
const shiftWord = (word, amounts) => [...word].map((ch, i) => letterAt(posOf(ch) + amounts[i % amounts.length])).join('');
const inRange = (word, amounts) => [...word].every((ch, i) => { const p = posOf(ch) + amounts[i % amounts.length]; return p >= 1 && p <= 26; });
const mirrorWord = word => [...word].map(ch => letterAt(27 - posOf(ch))).join('');
const numberWord = word => [...word].map(ch => posOf(ch)).join('-');

DRAFT['class-5-letter-code'] = (family, grade, level, r) => {
  const modes = level === 1 ? ['shift', 'sum', 'shift'] : level === 2 ? ['shift', 'sum', 'reverse', 'digits'] : ['progressive', 'reverse', 'digits', 'sum', 'shift'];
  const mode = r.pick(modes);
  const [w1, w2] = r.shuffle(CODE_WORDS);
  const count = choiceCount(grade);
  if (mode === 'sum') {
    const word = r.pick(CODE_WORDS);
    const total = [...word].reduce((t, ch) => t + posOf(ch), 0);
    return {
      family, answer: String(total), visual: null,
      prompt: `If A = 1, B = 2, C = 3 and so on, what is the sum of the letter values in ${word}?`,
      hint: 'Write each letter with its place in the alphabet, then add them all.',
      explanation: `${[...word].map(ch => `${ch} = ${posOf(ch)}`).join(', ')}. The sum is ${total}.`,
      proof: { family, givens: { mode, word } },
      choices: pickChoices(total, [[total + 1, 'class-5-letter-position'], [total - 1, 'class-5-letter-position'], [total + 10, 'class-5-letter-position'], [total - 3, 'class-5-letter-position'], [total + 2, 'class-5-letter-position']], count, r, { numeric: true }),
    };
  }
  if (mode === 'reverse') {
    const answer = mirrorWord(w2);
    return {
      family, answer, visual: null,
      prompt: `In a code, each letter is swapped for its partner from the other end of the alphabet (A with Z, B with Y). Write ${w2} in this code.`,
      hint: 'Partner letters add up to 27: A is 1 and Z is 26. Find each partner.',
      explanation: `${[...w2].map(ch => `${ch} becomes ${letterAt(27 - posOf(ch))}`).join(', ')}, giving ${answer}.`,
      proof: { family, givens: { mode, word: w2 } },
      choices: pickChoices(answer, [[w2.split('').reverse().join(''), 'code-order'], [answer.split('').reverse().join(''), 'code-order'], [[...w2].map(ch => letterAt(26 - posOf(ch) || 1)).join(''), 'class-5-letter-position'], [[...w2].map(ch => letterAt(posOf(ch) === 26 ? 1 : 28 - posOf(ch))).join(''), 'class-5-letter-position']], count, r),
    };
  }
  if (mode === 'digits') {
    const answer = numberWord(w2);
    return {
      family, answer, visual: null,
      prompt: `In a code, ${w1} is written as ${numberWord(w1)}. How is ${w2} written in the same code?`,
      hint: 'Match the letters of the first word with its numbers to find what each number stands for.',
      explanation: `Each number is the place of its letter in the alphabet. ${w2} becomes ${answer}.`,
      proof: { family, givens: { mode, word: w2 } },
      choices: pickChoices(answer, [
        [[...w2].map(ch => posOf(ch) + 1).join('-'), 'class-5-letter-position'],
        [[...w2].map(ch => posOf(ch) - 1).join('-'), 'class-5-letter-position'],
        [[...w2].map(ch => posOf(ch)).reverse().join('-'), 'code-order'],
        [[...w2].map((ch, i) => posOf(ch) + (i === 0 ? 1 : 0)).join('-'), 'class-5-letter-position'],
      ], count, r),
    };
  }
  let amounts;
  if (mode === 'shift') amounts = [r.pick(level === 1 ? [1, 2, 3] : [2, 3, -1, -2, -3])];
  else amounts = [1, 2, 3, 4];
  const usable = r.shuffle(CODE_WORDS).filter(word => inRange(word, amounts));
  const [a, b] = usable.filter((word, i, all) => word !== all[0] || i === 0).slice(0, 2);
  const target = b ?? a;
  const example = a;
  if (example === target) throw new QuestionRetry('Need two words');
  const answer = shiftWord(target, amounts);
  const k = amounts[0];
  const near = [shiftWord(target, amounts.map(v => v + 1)), shiftWord(target, amounts.map(v => v - 1)), shiftWord(target, amounts.map(v => -v)), shiftWord(target, amounts.map(v => 0)).replace(/^./, c => c)];
  const candidates = mode === 'shift'
    ? [[near[0], 'class-5-letter-position'], [near[1], 'class-5-letter-position'], [near[2], 'class-5-letter-position'], [answer.split('').reverse().join(''), 'code-order']]
    : [[shiftWord(target, [1]), 'class-5-letter-position'], [shiftWord(target, [2]), 'class-5-letter-position'], [shiftWord(target, [1, 2, 3, 4].map(v => 5 - v)), 'code-order'], [shiftWord(target, [2, 3, 4, 5]), 'class-5-letter-position']]
      .filter(([value]) => inRange(target, [1]) || true);
  const safe = candidates.filter(([value]) => typeof value === 'string' && /^[A-Z]+$/.test(value));
  return {
    family, answer, visual: null,
    prompt: `In a code, ${example} is written as ${shiftWord(example, amounts)}. How is ${target} written in that code?`,
    hint: mode === 'shift' ? 'Compare the letters of the first pair to see how far each letter moves.' : 'Compare each letter pair: the move can change from one position to the next.',
    explanation: mode === 'shift'
      ? `Each letter moves ${Math.abs(k)} place${Math.abs(k) === 1 ? '' : 's'} ${k > 0 ? 'forward' : 'back'}, so ${target} becomes ${answer}.`
      : `The letters move 1, 2, 3, 4 places forward in turn, so ${target} becomes ${answer}.`,
    proof: { family, givens: { mode, word: target, amounts } },
    choices: pickChoices(answer, safe, count, r),
  };
};
SOLVE['class-5-letter-code'] = q => {
  const { mode, word, amounts } = q.proof.givens;
  if (mode === 'sum') return String([...word].reduce((t, ch) => t + posOf(ch), 0));
  if (mode === 'reverse') return mirrorWord(word);
  if (mode === 'digits') return numberWord(word);
  return shiftWord(word, amounts);
};

// ---------------------------------------------------------------------------
// Compass map
// ---------------------------------------------------------------------------
DRAFT['class-5-compass-map'] = (family, grade, level, r) => {
  const who = r.shuffle(CADETS).slice(0, 4);
  const steps = [];
  let x = 0; let y = 0;
  for (let i = 0; i < 3; i++) {
    const dir = r.pick(DIR_ORDER);
    const d = level === 1 ? 1 : r.int(2, 9);
    steps.push({ dir, d });
    x += DIRS[dir].dx * d;
    y += DIRS[dir].dy * d;
  }
  if (x === 0 && y === 0) throw new QuestionRetry('Back at start');
  const answer = compassOf(x, y);
  const sentences = steps.map(({ dir, d }, i) => {
    const near = r.pick([true, false]);
    const [subject, other, word] = near
      ? [who[i + 1], who[i], DIRS[dir].word]
      : [who[i], who[i + 1], DIRS[DIR_ORDER[(DIR_ORDER.indexOf(dir) + 2) % 4]].word];
    return level === 1 ? `${subject} is to the ${word} of ${other}.` : `${subject} is ${d} m ${word} of ${other}.`;
  });
  const opposite = OPPOSITE_WORD[answer];
  const ring = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  const at = ring.indexOf(answer);
  const pairs = [[opposite, 'class-5-compass-point'], [ring[(at + 1) % 8], 'class-5-compass-point'], [ring[(at + 7) % 8], 'class-5-compass-point'], [ring[(at + 4 + 1) % 8], 'class-5-compass-point'], [ring[(at + 3) % 8], 'class-5-compass-point']];
  return {
    family, answer, visual: null,
    prompt: `${sentences.join(' ')} In which direction is ${who[3]} from ${who[0]}?`,
    hint: 'Sketch the four people on a map. Then read the last position from the first.',
    explanation: `Adding the moves gives ${Math.abs(x)} ${x >= 0 ? 'east' : 'west'} and ${Math.abs(y)} ${y >= 0 ? 'north' : 'south'}, so ${who[3]} is ${answer} of ${who[0]}.`,
    proof: { family, givens: { steps } },
    choices: pickChoices(answer, pairs, choiceCount(grade), r),
  };
};
SOLVE['class-5-compass-map'] = q => {
  let x = 0; let y = 0;
  for (const { dir, d } of q.proof.givens.steps) { x += DIRS[dir].dx * d; y += DIRS[dir].dy * d; }
  return compassOf(x, y);
};

// ---------------------------------------------------------------------------
// Rank in a row before and after a swap
// ---------------------------------------------------------------------------
DRAFT['class-5-row-swap-rank'] = (family, grade, level, r) => {
  const mode = r.pick(level === 1 ? ['between', 'right'] : ['total', 'between', 'right', 'total']);
  const [A, B] = r.shuffle(CADETS);
  const total = r.int(24, 44);
  const count = choiceCount(grade);
  if (mode === 'total') {
    const a = r.int(5, total - 5);
    const c = r.int(5, total - 5);
    if (a === c) throw new QuestionRetry('Same place');
    const b = total - c + 1;
    return {
      family, answer: String(total), visual: null,
      prompt: `${A} is ${ord(a)} from the left and ${B} is ${ord(b)} from the right in a row. After they swap places, ${A} is ${ord(c)} from the left. How many are in the row?`,
      hint: `After the swap, ${A} stands where ${B} stood. Use that place and ${B}'s rank from the right.`,
      explanation: `${B} stood ${ord(c)} from the left and ${ord(b)} from the right: ${c} + ${b} - 1 = ${total} in the row.`,
      proof: { family, givens: { mode, b, c } },
      choices: pickChoices(total, [[c + b, 'rank-endpoints'], [a + b - 1, 'class-5-order-slip'], [a + b, 'rank-endpoints'], [c + b + 1, 'rank-endpoints'], [a + c, 'class-5-order-slip']], count, r, { numeric: true }),
    };
  }
  if (mode === 'right') {
    const a = r.int(4, total - 8);
    const c = r.int(a + 3, total - 2);
    const answer = total - c + 1;
    return {
      family, answer: ord(answer), visual: null,
      prompt: `In a row of ${total}, ${A} is ${ord(a)} from the left and ${B} is ${ord(c)} from the left. They swap places. What is ${A}'s place from the right now?`,
      hint: `${A} takes ${B}'s old place. Count that place from the right end.`,
      explanation: `${A} now stands ${ord(c)} from the left. From the right that is ${total} - ${c} + 1 = ${answer}.`,
      proof: { family, givens: { mode, total, c } },
      choices: pickChoices(ord(answer), [[ord(total - a + 1), 'class-5-order-slip'], [ord(total - c), 'rank-endpoints'], [ord(total - a), 'rank-endpoints'], [ord(c), 'class-5-order-slip']], count, r),
    };
  }
  const a = r.int(4, Math.floor(total / 2) - 2);
  const b = r.int(4, Math.floor(total / 2) - 2);
  const between = total - a - b;
  return {
    family, answer: String(between), visual: null,
    prompt: `In a row of ${total} cadets, ${A} is ${ord(a)} from the left and ${B} is ${ord(b)} from the right. How many cadets stand between them?`,
    hint: 'Count the cadets before the first person and after the second person, then remove them from the row.',
    explanation: `Not between them: ${a} on the left side (including ${A}) and ${b} on the right side (including ${B}). ${total} - ${a} - ${b} = ${between}.`,
    proof: { family, givens: { mode, total, a, b } },
    choices: pickChoices(between, [[between + 1, 'rank-endpoints'], [between - 1, 'rank-endpoints'], [between + 2, 'rank-endpoints'], [total - a - b + 3, 'class-5-order-slip'], [total - Math.max(a, b), 'class-5-order-slip']], count, r, { numeric: true }),
  };
};
SOLVE['class-5-row-swap-rank'] = q => {
  const { mode, b, c, total, a } = q.proof.givens;
  if (mode === 'total') return String(c + b - 1);
  if (mode === 'right') return ord(total - c + 1);
  return String(total - a - b);
};

// ---------------------------------------------------------------------------
// Odd one out
// ---------------------------------------------------------------------------
const palin = n => String(n) === [...String(n)].reverse().join('');
const isTriangular = n => { const k = Math.round((Math.sqrt(8 * n + 1) - 1) / 2); return k * (k + 1) / 2 === n; };
const NUM_RULES = {
  even: n => n % 2 === 0,
  odd: n => n % 2 === 1,
  prime: isPrime,
  square: isSquare,
  cube: isCube,
  palindrome: palin,
  triangular: isTriangular,
  'power-2': n => n > 0 && (n & (n - 1)) === 0,
  'digit-sum-even': n => digitSum(n) % 2 === 0,
  'digit-sum-odd': n => digitSum(n) % 2 === 1,
  'mult-3': n => n % 3 === 0,
  'mult-4': n => n % 4 === 0,
  'mult-5': n => n % 5 === 0,
  'mult-6': n => n % 6 === 0,
  'mult-7': n => n % 7 === 0,
  'mult-9': n => n % 9 === 0,
  'mult-11': n => n % 11 === 0,
};
const ODD_PLAN = {
  1: [['mult-3', 10, 60], ['mult-4', 8, 60], ['mult-5', 5, 60], ['prime', 2, 40], ['even', 10, 40], ['odd', 10, 40]],
  2: [['square', 4, 150], ['mult-7', 14, 100], ['mult-9', 18, 120], ['palindrome', 100, 999], ['prime', 10, 99], ['digit-sum-even', 10, 99]],
  3: [['cube', 1, 1000], ['triangular', 1, 200], ['power-2', 2, 1024], ['square', 4, 300], ['mult-11', 11, 200], ['digit-sum-odd', 10, 200], ['mult-6', 6, 120]],
};
const WORD_CATS = {
  planets: ['Mars', 'Venus', 'Earth', 'Saturn', 'Neptune', 'Mercury', 'Jupiter'],
  moons: ['Titan', 'Europa', 'Io', 'Triton', 'Phobos', 'Ganymede'],
  stars: ['Sirius', 'Vega', 'Rigel', 'Polaris', 'Altair'],
  craft: ['rover', 'shuttle', 'rocket', 'lander', 'probe'],
  tools: ['telescope', 'compass', 'ruler', 'scale', 'clock'],
};
const lonerOf = (items, pred) => {
  const flags = items.map(pred);
  const yes = flags.filter(Boolean).length;
  if (yes === 1) return items[flags.indexOf(true)];
  if (yes === items.length - 1) return items[flags.indexOf(false)];
  return null;
};

DRAFT['class-5-odd-one-out'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  if (r.int(0, 4) === 0) {
    const [catA, catB] = r.shuffle(Object.keys(WORD_CATS)).slice(0, 2);
    const items = [...r.shuffle(WORD_CATS[catA]).slice(0, 3), r.pick(WORD_CATS[catB])];
    const odd = items[3];
    const shown = r.shuffle(items);
    return {
      family, answer: odd, visual: null,
      prompt: r.pick(['Which word does not belong with the others?', 'Select the odd one out.', 'Three of these words belong together. Which one does not?']),
      hint: 'Name the group that three words share. The word outside it is the odd one.',
      explanation: `${items.slice(0, 3).join(', ')} are all ${catA}; ${odd} is not.`,
      proof: { family, givens: { kind: 'word', catA, items: shown } },
      choices: pickChoices(odd, shown.filter(w => w !== odd).map(w => [w, 'class-5-odd-rule']), count, r),
    };
  }
  for (let attempt = 0; attempt < 60; attempt++) {
    const [ruleName, lo, hi] = r.pick(ODD_PLAN[level]);
    const pred = NUM_RULES[ruleName];
    const yes = []; const no = [];
    for (let n = lo; n <= hi; n++) (pred(n) ? yes : no).push(n);
    if (yes.length < 3 || no.length < 1) continue;
    const items = [...r.shuffle(yes).slice(0, 3), r.pick(no)];
    const odd = items[3];
    const loners = new Set(Object.values(NUM_RULES).map(rule => lonerOf(items, rule)).filter(v => v !== null));
    if (loners.size !== 1 || !loners.has(odd)) continue;
    const shown = r.shuffle(items);
    const label = {
      even: 'even', odd: 'odd', prime: 'prime', square: 'square numbers', cube: 'cube numbers', palindrome: 'palindromes', triangular: 'triangular numbers', 'power-2': 'powers of 2',
      'digit-sum-even': 'an even digit sum', 'digit-sum-odd': 'an odd digit sum',
    }[ruleName] ?? `multiples of ${ruleName.split('-')[1]}`;
    return {
      family, answer: String(odd), visual: null,
      prompt: r.pick(['Which number does not belong with the others?', 'Select the odd one out.', 'Three of these numbers share a rule. Which one does not?']),
      hint: 'Test each number against possible rules: multiples, squares, primes, digit sums.',
      explanation: `${items.slice(0, 3).join(', ')} follow the rule "${label}"; ${odd} does not.`,
      proof: { family, givens: { kind: 'number', rule: ruleName, items: shown } },
      choices: pickChoices(odd, shown.filter(n => n !== odd).map(n => [n, 'class-5-odd-rule']), count, r),
    };
  }
  throw new QuestionRetry('No unambiguous odd one');
};
SOLVE['class-5-odd-one-out'] = q => {
  const { kind, rule, catA, items } = q.proof.givens;
  if (kind === 'word') return items.find(w => !WORD_CATS[catA].includes(w));
  const pred = NUM_RULES[rule];
  return String(items.find(n => !pred(n)));
};

// ---------------------------------------------------------------------------
// Letter series
// ---------------------------------------------------------------------------
function alphaTerms(type, p) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    if (type === 'skip') out.push(letterAt(p.start + i * p.step));
    else if (type === 'alt') out.push(letterAt(p.start + Math.ceil(i / 2) * p.a + Math.floor(i / 2) * p.b));
    else if (type === 'grow') out.push(letterAt(p.start + (i * (2 * p.g + i - 1)) / 2));
    else if (type === 'pair') out.push(`${letterAt(p.start + i)}${letterAt(p.end - i)}`);
    else if (type === 'inter') out.push(i % 2 === 0 ? letterAt(p.start + (i / 2) * p.step) : letterAt(p.end - ((i - 1) / 2) * p.step));
  }
  return out;
}
const alphaValid = terms => terms.every(t => !/undefined/.test(t) && [...t].every(ch => ch && posOf(ch) >= 1));

DRAFT['class-5-alpha-series'] = (family, grade, level, r) => {
  const type = r.pick(level === 1 ? ['skip', 'pair'] : level === 2 ? ['skip', 'alt', 'inter', 'pair'] : ['alt', 'grow', 'inter', 'pair', 'grow']);
  const p = {
    start: r.int(1, 8), step: r.int(2, 4), a: r.int(1, 3), b: r.int(2, 4), g: r.int(1, 2), end: r.int(20, 26),
  };
  if (type === 'alt' && p.a === p.b) p.b += 1;
  let terms;
  try { terms = alphaTerms(type, p); } catch { throw new QuestionRetry('Out of range'); }
  if (!alphaValid(terms)) throw new QuestionRetry('Out of the alphabet');
  const hidden = r.pick([3, 4, 5]);
  const shown = terms.map((t, i) => (i === hidden ? '?' : t));
  const answer = terms[hidden];
  const shiftTerm = (term, d1, d2) => (term.length === 1 ? letterAt(posOf(term) + d1) : letterAt(posOf(term[0]) + d1) + letterAt(posOf(term[1]) + d2));
  const prev = terms[hidden - 1];
  const pairs = [[shiftTerm(answer, 1, -1), 'class-5-series-gap'], [shiftTerm(answer, -1, 1), 'class-5-series-gap'], [shiftTerm(answer, 2, -2), 'class-5-series-gap'], [shiftTerm(answer, -2, 2), 'class-5-series-gap'], [shiftTerm(prev, 1, 1), 'class-5-series-gap']];
  const safe = pairs.filter(([value]) => !/undefined/.test(value) && [...value].every(ch => LETTER_SET.has(ch)));
  return {
    family, answer, visual: null,
    prompt: `Find the missing term in the series: ${shown.join(', ')}.`,
    hint: 'Turn the letters into alphabet places and look at the gaps between neighbouring terms.',
    explanation: `The series is ${terms.join(', ')}. The missing term is ${answer}.`,
    proof: { family, givens: { type, p, hidden } },
    choices: pickChoices(answer, safe, choiceCount(grade), r),
  };
};
const LETTER_SET = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
SOLVE['class-5-alpha-series'] = q => alphaTerms(q.proof.givens.type, q.proof.givens.p)[q.proof.givens.hidden];

// ---------------------------------------------------------------------------
// Number series
// ---------------------------------------------------------------------------
function numTerms(type, p) {
  const t = [];
  if (type === 'diff2') { let v = p.a; for (let i = 0; i < 6; i++) { t.push(v); v += p.d + p.e * i; } }
  else if (type === 'muladd') { let v = p.a; for (let i = 0; i < 6; i++) { t.push(v); v = v * p.m + p.c; } }
  else if (type === 'alt') for (let i = 0; i < 6; i++) t.push(i % 2 === 0 ? p.a + (i / 2) * p.s : p.b + ((i - 1) / 2) * p.u);
  else if (type === 'sq') for (let i = 0; i < 6; i++) t.push((p.a + i) ** 2 + p.k);
  else if (type === 'fib') { t.push(p.a, p.b); for (let i = 2; i < 6; i++) t.push(t[i - 1] + t[i - 2]); }
  else if (type === 'mulgrow') { let v = p.a; for (let i = 0; i < 6; i++) { t.push(v); v *= p.m + i; } }
  else if (type === 'cube') for (let i = 0; i < 6; i++) t.push((p.a + i) ** 3 + p.k);
  return t;
}

DRAFT['class-5-number-series'] = (family, grade, level, r) => {
  const type = r.pick(level === 1 ? ['diff2', 'muladd', 'sq'] : level === 2 ? ['diff2', 'muladd', 'alt', 'sq', 'fib'] : ['alt', 'fib', 'mulgrow', 'cube', 'muladd', 'diff2']);
  const p = {
    a: r.int(1, 6), d: r.int(1, 3), e: r.int(1, 3), m: r.int(2, 3), c: r.int(-1, 3), s: r.int(2, 6), u: r.int(3, 9), b: r.int(2, 30), k: r.int(-1, 3),
  };
  if (type === 'muladd' && (p.m === 3 || level < 3) && p.c <= 0) p.c = r.int(1, 2);
  if (type === 'fib') p.b = p.a + r.int(1, 4);
  if (type === 'mulgrow') { p.a = r.int(1, 2); p.m = r.int(1, 2); }
  if (type === 'sq') p.a = r.int(1, 5);
  if (type === 'cube') p.a = r.int(1, 3);
  const terms = numTerms(type, p);
  const hidden = r.pick([3, 4, 5]);
  const answer = terms[hidden];
  const shown = terms.map((t, i) => (i === hidden ? '?' : t));
  const linear = 2 * terms[hidden - 1] - terms[hidden - 2];
  const pairs = [[linear, 'class-5-series-gap'], [terms[hidden - 1] + (terms[1] - terms[0]), 'class-5-series-gap'], [answer + 1, 'class-5-series-gap'], [answer - 1, 'class-5-series-gap'], [answer + 2, 'class-5-series-gap'], [terms[hidden - 1] * 2, 'class-5-series-gap'], [answer + p.d + 2, 'class-5-series-gap']];
  return {
    family, answer: String(answer), visual: null,
    prompt: r.pick([`Find the missing number in the series: ${shown.join(', ')}.`, `Which number should replace the ? in this series: ${shown.join(', ')}.`, `What number is missing from this series: ${shown.join(', ')}.`]),
    hint: 'Find the rule: look at the gaps, multiplying or adding the previous terms.',
    explanation: `The series is ${terms.join(', ')}. The missing number is ${answer}.`,
    proof: { family, givens: { type, p, hidden } },
    choices: pickChoices(answer, pairs, choiceCount(grade), r, { numeric: true }),
  };
};
SOLVE['class-5-number-series'] = q => String(numTerms(q.proof.givens.type, q.proof.givens.p)[q.proof.givens.hidden]);

// ---------------------------------------------------------------------------
// Count squares or triangles
// ---------------------------------------------------------------------------
const squaresIn = (cols, rows) => { let total = 0; for (let k = 1; k <= Math.min(cols, rows); k++) total += (cols - k + 1) * (rows - k + 1); return total; };
const trianglesIn = (parts, lines) => (lines + 1) * (parts * (parts + 1)) / 2;
const rectanglesIn = (cols, rows) => ((cols * (cols + 1)) / 2) * ((rows * (rows + 1)) / 2);

DRAFT['class-5-count-grid'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const shape = r.pick(['squares', 'squares', 'rectangles', 'triangles']);
  if (shape === 'squares') {
    const cols = r.int(2, level === 1 ? 4 : 4 + (level === 3 ? 1 : 0));
    const rows = level === 1 ? r.int(2, 3) : r.int(2, 4 + (level === 3 ? 1 : 0));
    const total = squaresIn(cols, rows);
    const pairs = [[cols * rows, 'class-5-grid-count'], [cols * rows + 1, 'class-5-grid-count'], [total - 1, 'class-5-grid-count'], [total + 2, 'class-5-grid-count'], [cols * rows + (cols - 1) * (rows - 1), 'class-5-grid-count'], [total + cols, 'class-5-grid-count']];
    return {
      family, answer: String(total),
      prompt: r.pick(['How many squares of every size are in this', 'Count all the squares, big and small, in this', 'How many squares can you find in this']).replace(/in this$/, `in this ${r.pick(['figure', 'solar panel', 'floor plan', 'game board', 'shield grid', 'window'])}?`),
      visual: { kind: 'v3-class-5-gridsq', cols, rows, description: `A rectangle split into ${cols} columns and ${rows} rows of equal small squares.` },
      hint: 'Count the small squares first, then the 2 by 2 squares, then bigger ones.',
      explanation: `${Array.from({ length: Math.min(cols, rows) }, (_, i) => `${i + 1} by ${i + 1}: ${(cols - i) * (rows - i)}`).join(', ')}. The total is ${total}.`,
      proof: { family, givens: { shape: 'squares', cols, rows } },
      choices: pickChoices(total, pairs, count, r, { numeric: true }),
    };
  }
  if (shape === 'rectangles') {
    const cols = r.int(2, level === 1 ? 3 : 4);
    const rows = r.int(2, level === 1 ? 3 : 3);
    const total = rectanglesIn(cols, rows);
    const pairs = [[cols * rows, 'class-5-grid-count'], [squaresIn(cols, rows), 'class-5-grid-count'], [total - cols, 'class-5-grid-count'], [total + rows, 'class-5-grid-count'], [cols * rows + cols + rows, 'class-5-grid-count'], [total - 1, 'class-5-grid-count']];
    return {
      family, answer: String(total),
      prompt: r.pick(['How many rectangles of every size, squares included, are in this', 'Count every rectangle, squares too, in this']).concat(` ${r.pick(['figure', 'solar panel', 'floor plan', 'game board', 'shield grid', 'window'])}?`),
      visual: { kind: 'v3-class-5-gridsq', cols, rows, description: `A rectangle split into ${cols} columns and ${rows} rows of equal small squares.` },
      hint: 'Pick two vertical lines and two horizontal lines. Each choice makes one rectangle.',
      explanation: `Pairs of vertical lines: ${(cols * (cols + 1)) / 2}. Pairs of horizontal lines: ${(rows * (rows + 1)) / 2}. Rectangles: ${total}.`,
      proof: { family, givens: { shape: 'rectangles', cols, rows } },
      choices: pickChoices(total, pairs, count, r, { numeric: true }),
    };
  }
  const parts = r.int(3, level === 1 ? 5 : 6);
  const lines = level === 3 ? r.int(1, 2) : 0;
  const total = trianglesIn(parts, lines);
  const pairs = [[parts, 'class-5-grid-count'], [parts * (lines + 1), 'class-5-grid-count'], [parts * parts, 'class-5-grid-count'], [total - parts, 'class-5-grid-count'], [total + parts, 'class-5-grid-count'], [(parts * (parts - 1)) / 2 * (lines + 1), 'class-5-grid-count']];
  return {
    family, answer: String(total), prompt: r.pick(['How many triangles of every size are in this', 'Count all the triangles, big and small, in this']).concat(` ${r.pick(['figure', 'rocket fin', 'sail', 'tent', 'roof frame', 'banner'])}?`),
    visual: { kind: 'v3-class-5-fan', parts, lines, description: `A big triangle with its base split into ${parts} parts joined to the top corner${lines ? `, and ${lines} line${lines > 1 ? 's' : ''} across parallel to the base` : ''}.` },
    hint: 'Count triangles by the number of small parts they use along the base, in each band.',
    explanation: `Triangles at the top corner use ${parts * (parts + 1) / 2} choices of base parts in each of ${lines + 1} band${lines ? 's' : ''}: ${total}.`,
    proof: { family, givens: { shape: 'triangles', parts, lines } },
    choices: pickChoices(total, pairs, count, r, { numeric: true }),
  };
};
SOLVE['class-5-count-grid'] = q => {
  const g = q.proof.givens;
  if (g.shape === 'squares') return String(squaresIn(g.cols, g.rows));
  if (g.shape === 'rectangles') return String(rectanglesIn(g.cols, g.rows));
  return String(trianglesIn(g.parts, g.lines));
};

const renderGridSq = visual => {
  const size = Math.min(60, 380 / visual.cols, 230 / visual.rows);
  const ox = (480 - visual.cols * size) / 2;
  let body = '';
  for (let row = 0; row < visual.rows; row++) for (let col = 0; col < visual.cols; col++) body += rect(ox + col * size, 20 + row * size, size, size, { fill: PAPER, strokeWidth: 2.5 });
  return svg(body, visual.description, 480, 40 + visual.rows * size);
};
const renderFan = visual => {
  const apex = [240, 20];
  const left = [60, 250];
  const right = [420, 250];
  const baseAt = i => [left[0] + ((right[0] - left[0]) * i) / visual.parts, 250];
  let body = path(`M${apex.join(' ')} L${left.join(' ')} L${right.join(' ')}Z`, { fill: PAPER, strokeWidth: 3 });
  for (let i = 1; i < visual.parts; i++) body += line(apex[0], apex[1], baseAt(i)[0], 250, { width: 2.5 });
  for (let j = 1; j <= visual.lines; j++) {
    const t = j / (visual.lines + 1);
    const y = 20 + 230 * t;
    body += line(apex[0] + (left[0] - apex[0]) * t, y, apex[0] + (right[0] - apex[0]) * t, y, { width: 2.5, stroke: ORANGE });
  }
  return svg(body, visual.description, 480, 270);
};

// ---------------------------------------------------------------------------
// Days of the week
// ---------------------------------------------------------------------------
DRAFT['class-5-day-sequence'] = (family, grade, level, r) => {
  const form = r.int(0, 4);
  const anchor = r.int(0, 6);
  const day = WEEKDAYS[anchor];
  const far = level === 1 ? [3, 4, 5] : level === 2 ? [9, 10, 12, 15, 16] : [30, 45, 52, 60, 100];
  const k = r.pick(far);
  let prompt; let shift; let how;
  if (form === 0) { prompt = `Today is ${day}. What day of the week will it be ${k} days from today?`; shift = k; how = `${k} days after ${day}`; }
  else if (form === 1) { prompt = `If the day before yesterday was ${day}, what day will it be ${k} days after tomorrow?`; shift = 3 + k; how = `today is 2 days after ${day}, tomorrow 3, then ${k} more`; }
  else if (form === 2) { const j = r.pick(far); prompt = `${k} days ago it was ${day}. What day will it be ${j} days from today?`; shift = k + j; how = `today is ${k} days after ${day}, then ${j} more`; }
  else if (form === 3) { const a = r.int(3, 9); const b = r.int(20, 29); prompt = `The ${ord(a)} of a month is a ${day}. What day is the ${ord(b)} of that month?`; shift = b - a; how = `${b - a} days after ${day}`; }
  else { prompt = `If the day after tomorrow is ${day}, what day was it ${k} days ago?`; shift = -2 - k; how = `today is 2 days before ${day}; go back ${k} more`; }
  const index = ((anchor + shift) % 7 + 7) % 7;
  const answer = WEEKDAYS[index];
  const pairs = [[WEEKDAYS[(index + 1) % 7], 'class-5-day-offset'], [WEEKDAYS[(index + 6) % 7], 'class-5-day-offset'], [WEEKDAYS[(index + 2) % 7], 'class-5-day-offset'], [WEEKDAYS[(index + 5) % 7], 'class-5-day-offset'], [WEEKDAYS[(index + 3) % 7], 'class-5-day-offset']];
  return {
    family, prompt, answer, visual: null,
    hint: 'A week has 7 days. Find the total shift from the clue, then use the remainder after dividing by 7.',
    explanation: `The shift is ${shift} days (${how}). ${shift} leaves remainder ${((shift % 7) + 7) % 7} out of 7, so the day is ${answer}.`,
    proof: { family, givens: { anchor, shift } },
    choices: pickChoices(answer, pairs, choiceCount(grade), r),
  };
};
SOLVE['class-5-day-sequence'] = q => WEEKDAYS[((q.proof.givens.anchor + q.proof.givens.shift) % 7 + 7) % 7];

// ---------------------------------------------------------------------------
// Folding and cutting
// ---------------------------------------------------------------------------
DRAFT['class-5-fold-cut-count'] = (family, grade, level, r) => {
  const mode = r.pick(level === 1 ? ['holes', 'rope', 'posts'] : level === 2 ? ['holes', 'strip', 'rope', 'posts'] : ['holes', 'strip', 'ropetime', 'round']);
  const count = choiceCount(grade);
  if (mode === 'holes') {
    const folds = r.int(1, level === 3 ? 3 : 2);
    const holes = r.int(1, 3);
    const answer = holes * 2 ** folds;
    const sheet = r.pick(['square sheet', 'sheet of paper', 'paper napkin', 'square cloth']);
    const tool = r.pick(['punched through all the layers', 'made through all the layers with a pin']);
    return {
      family, answer: String(answer), visual: null,
      prompt: `A ${sheet} is folded in half ${folds} time${folds > 1 ? 's' : ''}. ${holes} hole${holes > 1 ? 's are' : ' is'} ${tool}. How many holes are there when it is opened out?`,
      hint: 'Each fold doubles the layers. The same punch goes through every layer.',
      explanation: `${folds} fold${folds > 1 ? 's' : ''} make ${2 ** folds} layers, so ${holes} x ${2 ** folds} = ${answer} holes.`,
      proof: { family, givens: { mode, folds, holes } },
      choices: pickChoices(answer, [[holes * folds, 'class-5-fold-double'], [holes + folds, 'class-5-fold-double'], [holes * 2, 'class-5-fold-double'], [holes * 2 ** (folds + 1), 'class-5-fold-double'], [holes * (2 ** folds - 1), 'class-5-fold-double']], count, r, { numeric: true }),
    };
  }
  if (mode === 'strip') {
    const folds = r.int(2, 3);
    const answer = 2 ** folds + 1;
    const strip = r.pick(['paper strip', 'ribbon', 'strip of card', 'long cloth strip']);
    return {
      family, answer: String(answer), visual: null,
      prompt: `A ${strip} is folded in half ${folds} times and then cut straight across, away from every fold. How many pieces are there when it is opened out?`,
      hint: 'Folding in half doubles the layers. One cut across all layers makes one cut in each layer.',
      explanation: `${2 ** folds} layers are cut once, giving ${2 ** folds} cuts in the strip. ${2 ** folds} cuts make ${answer} pieces.`,
      proof: { family, givens: { mode, folds } },
      choices: pickChoices(answer, [[2 ** folds, 'class-5-fold-double'], [2 ** folds + 2, 'class-5-fold-double'], [folds + 1, 'class-5-fold-double'], [2 ** (folds + 1), 'class-5-fold-double'], [2 * folds + 1, 'class-5-fold-double']], count, r, { numeric: true }),
    };
  }
  const piece = r.pick([2, 3, 4, 5]);
  const parts = r.int(5, 12);
  const length = piece * parts;
  if (mode === 'rope') {
    const answer = parts - 1;
    const rope = r.pick(['rope', 'ribbon', 'cable', 'wire', 'pipe']);
    return {
      family, answer: String(answer), visual: null,
      prompt: `A ${rope} ${length} m long is cut into pieces of ${piece} m each. How many cuts are needed?`,
      hint: 'Each cut makes one more piece, and the last piece needs no cut.',
      explanation: `${length} / ${piece} = ${parts} pieces. The number of cuts is one less: ${answer}.`,
      proof: { family, givens: { mode, length, piece } },
      choices: pickChoices(answer, [[parts, 'counted-endpoints'], [parts + 1, 'counted-endpoints'], [parts - 2, 'counted-endpoints'], [length - piece, 'wrong-operation']], count, r, { numeric: true }),
    };
  }
  if (mode === 'ropetime') {
    const minutes = r.int(2, 6);
    const answer = (parts - 1) * minutes;
    return {
      family, answer: `${answer} min`, visual: null,
      prompt: `A pipe ${length} m long is cut into ${piece} m pieces. Each cut takes ${minutes} minutes. How long do all the cuts take?`,
      hint: 'Find the number of pieces, then the number of cuts, then the time for the cuts.',
      explanation: `${parts} pieces need ${parts - 1} cuts. ${parts - 1} x ${minutes} = ${answer} minutes.`,
      proof: { family, givens: { mode, length, piece, minutes } },
      choices: pickChoices(`${answer} min`, [[`${parts * minutes} min`, 'counted-endpoints'], [`${(parts + 1) * minutes} min`, 'counted-endpoints'], [`${(parts - 2) * minutes} min`, 'counted-endpoints'], [`${parts - 1 + minutes} min`, 'wrong-operation']], count, r),
    };
  }
  if (mode === 'posts') {
    const answer = parts + 1;
    return {
      family, answer: String(answer), visual: null,
      prompt: `Posts are put ${piece} m apart along a straight fence ${length} m long, with a post at each end. How many posts are there?`,
      hint: 'Count the gaps between posts first. A straight fence has one more post than gaps.',
      explanation: `${length} / ${piece} = ${parts} gaps, so there are ${parts} + 1 = ${answer} posts.`,
      proof: { family, givens: { mode, length, piece } },
      choices: pickChoices(answer, [[parts, 'counted-endpoints'], [parts + 2, 'counted-endpoints'], [parts - 1, 'counted-endpoints'], [length - piece, 'wrong-operation']], count, r, { numeric: true }),
    };
  }
  const answer = parts;
  return {
    family, answer: String(answer), visual: null,
    prompt: `Posts are put ${piece} m apart around a round pond with a boundary of ${length} m. How many posts are needed?`,
    hint: 'Around a closed loop the last gap meets the first post, so posts equal gaps.',
    explanation: `${length} / ${piece} = ${parts} gaps. On a closed loop that is ${parts} posts.`,
    proof: { family, givens: { mode, length, piece } },
    choices: pickChoices(answer, [[parts + 1, 'counted-endpoints'], [parts - 1, 'counted-endpoints'], [parts + 2, 'counted-endpoints'], [length - piece, 'wrong-operation']], count, r, { numeric: true }),
  };
};
SOLVE['class-5-fold-cut-count'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'holes') return String(g.holes * 2 ** g.folds);
  if (g.mode === 'strip') return String(2 ** g.folds + 1);
  const parts = g.length / g.piece;
  if (g.mode === 'rope') return String(parts - 1);
  if (g.mode === 'ropetime') return `${(parts - 1) * g.minutes} min`;
  if (g.mode === 'posts') return String(parts + 1);
  return String(parts);
};

// ---------------------------------------------------------------------------
// Two-group survey
// ---------------------------------------------------------------------------
const GAME_PAIRS = [['chess', 'cricket'], ['robotics', 'art'], ['music', 'chess'], ['swimming', 'football'], ['drawing', 'coding']];
DRAFT['class-5-venn-survey'] = (family, grade, level, r) => {
  const both = r.int(3, 10);
  const onlyA = r.int(4, 15);
  const onlyB = r.int(4, 15);
  const none = r.int(2, 9);
  if (onlyA === onlyB) throw new QuestionRetry('Distinct');
  const total = both + onlyA + onlyB + none;
  const a = onlyA + both;
  const b = onlyB + both;
  const [gA, gB] = r.pick(GAME_PAIRS);
  const mode = r.pick(level === 1 ? ['both', 'both', 'neither'] : ['both', 'only', 'neither', 'only']);
  const count = choiceCount(grade);
  if (mode === 'both') {
    const picture = r.int(0, 1) === 1;
    return {
      family, answer: String(both),
      visual: picture ? { kind: 'v3-class-5-venn', a, b, none, total, gA, gB, description: `Two overlapping circles: ${gA} ${a} and ${gB} ${b}. Outside both: ${none}. The overlap is marked with a question mark.` } : null,
      prompt: picture
        ? `A class has ${total} cadets. How many play both ${gA} and ${gB}?`
        : `In a class of ${total}, ${a} play ${gA}, ${b} play ${gB} and ${none} play neither. How many play both?`,
      hint: 'Cadets who play at least one game are the class total minus those who play neither.',
      explanation: `At least one game: ${total} - ${none} = ${total - none}. Both = ${a} + ${b} - ${total - none} = ${both}.`,
      proof: { family, givens: { mode, total, a, b, none } },
      choices: pickChoices(both, [[a + b - total, 'class-5-venn-overlap'], [a + b - (total - none) + 1, 'class-5-venn-overlap'], [total - none - Math.max(a, b), 'class-5-venn-overlap'], [Math.abs(a - b), 'class-5-venn-overlap'], [a + b - total + none + both, 'class-5-venn-overlap']], count, r, { numeric: true }),
    };
  }
  if (mode === 'only') {
    const answer = onlyA;
    return {
      family, answer: String(answer), visual: null,
      prompt: `In a class of ${total}, ${a} play ${gA}, ${b} play ${gB} and ${none} play neither. How many play only ${gA}?`,
      hint: 'Find how many play both games first, then take them away from the group that plays your game.',
      explanation: `Both = ${a} + ${b} - (${total} - ${none}) = ${both}. Only ${gA} = ${a} - ${both} = ${answer}.`,
      proof: { family, givens: { mode, total, a, b, none } },
      choices: pickChoices(answer, [[a, 'class-5-venn-overlap'], [both, 'class-5-venn-overlap'], [a - none, 'class-5-venn-overlap'], [onlyB, 'class-5-venn-overlap'], [a - both + 1, 'class-5-venn-overlap']], count, r, { numeric: true }),
    };
  }
  return {
    family, answer: String(none), visual: null,
    prompt: `In a class of ${total}, ${a} play ${gA} and ${b} play ${gB}. ${both} play both. How many play neither?`,
    hint: 'Cadets playing both games are counted twice when you add the two groups.',
    explanation: `At least one game: ${a} + ${b} - ${both} = ${a + b - both}. Neither: ${total} - ${a + b - both} = ${none}.`,
    proof: { family, givens: { mode, total, a, b, both } },
    choices: pickChoices(none, [[total - a - b, 'class-5-venn-overlap'], [total - a - b + both * 2, 'class-5-venn-overlap'], [total - a - b - both, 'class-5-venn-overlap'], [total - Math.max(a, b), 'class-5-venn-overlap'], [none + 1, 'class-5-venn-overlap']], count, r, { numeric: true }),
  };
};
SOLVE['class-5-venn-survey'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'both') return String(g.a + g.b - (g.total - g.none));
  if (g.mode === 'only') return String(g.a - (g.a + g.b - (g.total - g.none)));
  return String(g.total - (g.a + g.b - g.both));
};

const renderVenn = visual => {
  let body = circle(190, 135, 100, { fill: 'rgba(77,153,134,.35)' }) + circle(290, 135, 100, { fill: 'rgba(215,148,70,.35)' });
  body += text(130, 125, visual.gA, { size: 18 }) + text(130, 150, String(visual.a), { size: 22, weight: 800 });
  body += text(350, 125, visual.gB, { size: 18 }) + text(350, 150, String(visual.b), { size: 22, weight: 800 });
  body += text(240, 145, '?', { size: 34, weight: 800 });
  body += text(60, 255, `None: ${visual.none}`, { size: 18, anchor: 'start' });
  return svg(body, visual.description, 480, 270);
};

// ---------------------------------------------------------------------------
// Ordering people from comparison clues
// ---------------------------------------------------------------------------
const THEMES = [
  ['taller', 'shorter', 'tallest', 'shortest'],
  ['heavier', 'lighter', 'heaviest', 'lightest'],
  ['faster', 'slower', 'fastest', 'slowest'],
  ['older', 'younger', 'oldest', 'youngest'],
];
const rankOf = (pairs, who) => {
  const below = new Map(who.map(n => [n, new Set()]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const [hi, lo] of pairs) {
      for (const n of [lo, ...below.get(lo)]) if (!below.get(hi).has(n)) { below.get(hi).add(n); changed = true; }
    }
  }
  return [...who].sort((x, y) => below.get(y).size - below.get(x).size);
};

DRAFT['class-5-order-people'] = (family, grade, level, r) => {
  const n = level === 3 ? 5 : 4;
  const who = r.shuffle(CADETS).slice(0, n);
  const theme = r.pick(THEMES);
  const pairs = who.slice(0, n - 1).map((p, i) => [p, who[i + 1]]);
  const sentences = r.shuffle(pairs).map(([hi, lo]) => (r.int(0, 1) === 1 ? `${hi} is ${theme[0]} than ${lo}.` : `${lo} is ${theme[1]} than ${hi}.`));
  const kind = r.pick(n === 5 ? ['top', 'bottom', 'middle'] : ['top', 'bottom', 'second']);
  const idx = kind === 'top' ? 0 : kind === 'bottom' ? n - 1 : kind === 'middle' ? 2 : 1;
  const word = kind === 'top' ? theme[2] : kind === 'bottom' ? theme[3] : `second ${theme[2]}`;
  const question = kind === 'middle' ? `Who is in the middle when the five are lined up from ${theme[2]} to ${theme[3]}?` : `Who is the ${word}?`;
  const answer = who[idx];
  const others = who.filter(w => w !== answer);
  return {
    family, answer, visual: null,
    prompt: `${sentences.join(' ')} ${question}`,
    hint: 'Join the clues into one line from highest to lowest, then read off the place asked.',
    explanation: `Order from ${theme[2]}: ${who.join(', ')}. So the answer is ${answer}.`,
    proof: { family, givens: { who: [...who].sort(), pairs, idx } },
    choices: pickChoices(answer, others.map(o => [o, 'class-5-chain-order']), choiceCount(grade), r),
  };
};
SOLVE['class-5-order-people'] = q => rankOf(q.proof.givens.pairs, q.proof.givens.who)[q.proof.givens.idx];

// ---------------------------------------------------------------------------
export function renderReasoning(visual) {
  if (visual.kind === 'v3-class-5-walk') return renderWalk(visual);
  if (visual.kind === 'v3-class-5-gridsq') return renderGridSq(visual);
  if (visual.kind === 'v3-class-5-fan') return renderFan(visual);
  if (visual.kind === 'v3-class-5-venn') return renderVenn(visual);
  return null;
}

export { KNOWN, MALE, FEMALE, gcd, unitsOnly };
