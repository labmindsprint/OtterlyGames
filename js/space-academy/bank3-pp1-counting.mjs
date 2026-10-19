// PP1 chapter: Little star counters. Six counting families, each with its own picture and its own ask.
import { MISCONCEPTIONS as SHARED, answerChoices, choiceCount } from './bank-shared.mjs';
import { ORANGE, text } from './diagram-kit.mjs';
import { tenFrame } from './sprites.mjs';
import {
  COST, HUES, INK, QuestionRetry, THINGS, TOKENS, badge, boulder, build, cloud, die, distinctKinds, domino, listText, pickOption, pips, plate, put,
  say, scatterPoints, spreadWrongs, sum, svg, thingWord, token, tokenFrame,
} from './bank3-pp1-art.mjs';

export const MISCONCEPTIONS = {
  'pp1-counted-other': { title: 'Count only one kind', message: 'Count only the kind the question names. Skip the other things.' },
  'pp1-count-twice': { title: 'Touch each one once', message: 'Touch each thing one time only. Do not count any thing twice.' },
  'pp1-one-die': { title: 'Count every dot', message: 'Count the dots on both dice or both halves, not just on one.' },
  'pp1-frame-swap': { title: 'Full or empty', message: 'Full squares hold a picture. Empty squares are blank.' },
  'pp1-count-visible': { title: 'Some are hiding', message: 'You can only see some of them. Find how many are hiding.' },
  'pp1-hidden-total': { title: 'Take away the ones you see', message: 'All of them is the total. Take away the ones you can see.' },
  'pp1-path-slip': { title: 'Look at the numbers around', message: 'The empty stone is a new number, not a copy of its neighbour.' },
  'pp1-path-step': { title: 'Follow the steps', message: 'Check how much the numbers change from one stone to the next.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

const night = (body, description, height = 240, stars = 9) => svg(plate('night', 480, height, { stars }) + body, description, 480, height);
const range = count => Array.from({ length: count }, (_, index) => index);
const counted = (n, key) => `${n} ${thingWord(key, n)}`;
const there = (n, key) => `There ${n === 1 ? 'is' : 'are'} ${counted(n, key)}`;
const dotsOf = n => `${n} ${n === 1 ? 'dot' : 'dots'}`;

// Counting wrongs: one more or one less are the classic slips. lower and upper decide which side they fall on.
const slips = (n, extra = []) => [
  ...extra,
  { n: n - 1, code: 'missed-object' }, { n: n + 1, code: 'pp1-count-twice' },
  { n: n - 2, code: 'missed-object' }, { n: n + 2, code: 'pp1-count-twice' },
];
const numberChoices = (r, grade, answer, candidates, min = 1, max = 12) => answerChoices(answer, spreadWrongs(r, answer, candidates, { min, max }), choiceCount(grade), null, KNOWN);

const SKY = ['star', 'rock', 'fuel', 'flag', 'alien', 'crystal', 'coin', 'planet', 'comet', 'ufo', 'crate', 'rocket'];

// 1. Count one kind among other things in the night sky.
function draftSky(grade, level, r) {
  const n = level === 1 ? r.int(1, 5) : level === 2 ? r.int(3, 7) : r.int(5, 9);
  const decoyKinds = level === 3 ? 2 : level === 2 ? 1 : r.int(0, 3) === 0 ? 0 : 1;
  const [target, ...others] = distinctKinds(r, 1 + decoyKinds, SKY);
  const decoys = others.map(kind => ({ kind, count: level === 1 ? r.int(1, 3) : level === 2 ? r.int(2, 5) : r.int(2, 4) }));
  const decoyTotal = sum(decoys.map(decoy => decoy.count));
  const total = n + decoyTotal;
  const weight = n * COST[target] + sum(decoys.map(decoy => decoy.count * COST[decoy.kind]));
  if (total > 13 || weight > 13500) throw new QuestionRetry('The sky would be too crowded.');
  const size = total <= 3 ? 86 : total <= 6 ? 74 : total <= 9 ? 62 : 50;
  const points = scatterPoints(r, total, { x: 16, y: 16, w: 448, h: 208, size, gap: 10 });
  const order = r.shuffle([...Array(n).fill(target), ...decoys.flatMap(decoy => Array(decoy.count).fill(decoy.kind))]);
  const items = points.map((point, index) => [order[index], point.x, point.y]);
  const many = THINGS[target].many;
  const stems = [`How many ${many} do you see?`, `Count the ${many}. How many are there?`, `Touch each ${THINGS[target].one}. How many ${many}?`];
  if (decoys.length) stems.push(`Count only the ${many}. How many?`);
  const first = decoys[0];
  const answer = n;
  return build({
    family: 'pp1-count-sky', prompt: say(r, stems), answer,
    hint: `Touch each ${THINGS[target].one} one time.${decoys.length ? ' Skip the other things.' : ''}`,
    explanation: decoys.length ? `${there(n, target)}. The other things are not ${many}.` : `Touch each one and count: ${counted(n, target)}.`,
    givens: { target },
    visual: {
      kind: 'v3-pp1-count-sky', target, size, items,
      description: `Night sky with ${listText([counted(n, target), ...decoys.map(decoy => counted(decoy.count, decoy.kind))])}.`,
    },
    choices: numberChoices(r, grade, answer, slips(n, [
      ...(decoyTotal ? [{ n: total, code: 'included-extra' }, { n: first.count, code: 'pp1-counted-other' }] : []),
    ]), 1, 15),
  });
}
const solveSky = question => String(question.visual.items.filter(([kind]) => kind === question.proof.givens.target).length);

// 2. Count the dots on one die, two dice or a domino.
const DIE_HUES = Object.keys(HUES);
function draftDice(grade, level, r) {
  const style = level === 1 ? 'die' : r.pick(['dice', 'domino', 'dice']);
  let values;
  if (style === 'die') values = [r.int(1, 6)];
  else if (style === 'domino') values = [r.int(1, level === 2 ? 4 : 5), r.int(1, level === 2 ? 4 : 5)];
  else {
    const a = r.int(1, level === 2 ? 4 : 6);
    values = [a, r.int(1, level === 2 ? 4 : Math.min(6, 10 - a))];
  }
  const total = sum(values);
  const hues = r.shuffle(DIE_HUES).slice(0, 2);
  const rots = values.map(() => r.int(-9, 9));
  const stems = {
    die: ['How many dots are on the die?', 'Count the dots on the die.', 'How many dots do you see?'],
    dice: ['How many dots are on both dice?', 'Count all the dots on both dice.', 'How many dots in all?'],
    domino: ['How many dots are on the domino?', 'Count all the dots on the domino.', 'How many dots in all?'],
  }[style];
  const parts = values.length === 1 ? 'the die' : style === 'domino' ? 'both halves' : 'both dice';
  return build({
    family: 'pp1-count-dice', prompt: say(r, stems), answer: total,
    hint: values.length === 1 ? 'Touch each dot one time.' : `Count the dots on ${parts}.`,
    explanation: values.length === 1 ? `The die shows ${dotsOf(total)}.` : `${dotsOf(values[0])} and ${dotsOf(values[1])} make ${dotsOf(total)} in all.`,
    givens: { style },
    visual: {
      kind: 'v3-pp1-count-dice', style, values, hues, rots,
      description: values.length === 1 ? `A die showing ${dotsOf(total)}.` : style === 'domino' ? `A domino with ${dotsOf(values[0])} on one half and ${dotsOf(values[1])} on the other half.` : `2 dice, one with ${dotsOf(values[0])} and one with ${dotsOf(values[1])}.`,
    },
    choices: numberChoices(r, grade, total, slips(total, values.length === 2 ? values.map(value => ({ n: value, code: 'pp1-one-die' })) : []), 1, 12),
  });
}
const solveDice = question => String(sum(question.visual.values));

// 3. A numeral is shown; pick the picture that holds that many.
const cardLabel = visual => (visual.mode === 'dots' ? dotsOf(visual.count) : counted(visual.count, visual.thing));
function cardVisual(r, mode, n, shared) {
  if (mode === 'dots') return { kind: 'v3-pp1-count-card', mode, count: n, hue: shared.hue, description: `A die face with ${n} ${n === 1 ? 'dot' : 'dots'}.` };
  if (mode === 'frame') return { kind: 'v3-pp1-count-card', mode, count: n, thing: shared.thing, description: `A 10-frame with ${counted(n, shared.thing)}.` };
  const pts = scatterPoints(r, n, { x: 8, y: 8, w: 164, h: 94, size: shared.size, gap: 4 }).map(point => [point.x, point.y]);
  return { kind: 'v3-pp1-count-card', mode, count: n, thing: shared.thing, size: shared.size, pts, description: `A card with ${counted(n, shared.thing)}.` };
}
function draftCards(grade, level, r) {
  const mode = level === 1 ? 'objects' : r.pick(level === 2 ? ['objects', 'dots', 'objects'] : ['objects', 'frame', 'dots']);
  const top = mode === 'dots' ? 6 : level === 1 ? 5 : level === 2 ? 7 : 10;
  const n = r.int(mode === 'dots' ? 2 : level === 1 ? 2 : 3, mode === 'dots' ? 5 : top - 1);
  const shared = { thing: r.pick(TOKENS), hue: HUES[r.pick(DIE_HUES)], size: top <= 5 ? 38 : top <= 7 ? 34 : 28 };
  const near = slips(n).filter(item => item.n >= 1 && item.n <= top);
  const choices = spreadWrongs(r, n, near.map(item => ({ ...item, visual: cardVisual(r, mode, item.n, shared), label: cardLabel({ mode, count: item.n, thing: shared.thing }) })));
  const answerVisual = cardVisual(r, mode, n, shared);
  const many = THINGS[shared.thing].many;
  const stems = {
    objects: ['Which card has this many?', `Find the card with this many ${many}.`, 'Which picture matches the number?'],
    dots: ['Which die shows this many dots?', 'Find the die that matches the number.'],
    frame: ['Which frame shows this many?', `Find the frame with this many ${many}.`],
  }[mode];
  return build({
    family: 'pp1-count-cards', prompt: say(r, stems), answer: cardLabel(answerVisual),
    hint: 'Count each picture. Match the number.',
    explanation: `The badge shows ${n}. Only the card with ${cardLabel(answerVisual)} matches.`,
    givens: { mode },
    visual: { kind: 'v3-pp1-numeral', value: n, description: `The number ${n} written on a big badge.` },
    choices: answerChoices(cardLabel(answerVisual), choices, choiceCount(grade), answerVisual, KNOWN),
  });
}
function solveCards(question) {
  question.optionVisuals.forEach((visual, index) => {
    if (visual?.kind !== 'v3-pp1-count-card' || cardLabel(visual) !== question.options[index]) throw new Error('A card choice does not match its label.');
  });
  return pickOption(question, visual => visual.count === question.visual.value);
}

// 4. Five-frame or ten-frame: how many are in it, or how many squares are empty.
const FRAME_THINGS = ['star', 'rock', 'fuel', 'crystal', 'coin', 'flag', 'alien'];
function draftFrame(grade, level, r) {
  const rows = level === 1 ? 1 : 2;
  const capacity = 5 * rows;
  const ask = r.pick(level === 1 ? ['filled', 'filled', 'empty'] : ['filled', 'empty']);
  const filled = level === 1 ? r.int(1, 4) : level === 2 ? r.int(2, 8) : r.int(3, 9);
  const cells = level === 3 ? r.shuffle(range(capacity)).slice(0, filled).sort((a, b) => a - b) : range(filled);
  const thing = r.pick(FRAME_THINGS);
  const many = THINGS[thing].many;
  const empty = capacity - filled;
  const answer = ask === 'filled' ? filled : empty;
  const stems = ask === 'filled'
    ? [`How many ${many} are in the frame?`, `Count the ${many} in the frame.`, `How many ${many} do you see?`]
    : ['How many empty squares are there?', 'How many empty spaces are in the frame?', `How many more ${many} fill the frame?`];
  return build({
    family: 'pp1-count-frame', prompt: say(r, stems), answer,
    hint: ask === 'filled' ? 'Count the squares that have a picture.' : 'Count the blank squares only.',
    explanation: ask === 'filled' ? `${counted(filled, thing)} ${filled === 1 ? 'is' : 'are'} in the frame. Count the full squares.`
      : `The frame has ${capacity} squares. ${filled} ${filled === 1 ? 'is' : 'are'} full, so ${capacity} - ${filled} = ${empty} ${empty === 1 ? 'is' : 'are'} empty.`,
    givens: { ask },
    visual: {
      kind: 'v3-pp1-count-frame', columns: 5, rows, cells, thing,
      description: `A ${rows === 1 ? '5' : '10'}-frame with ${counted(filled, thing)} and ${empty} empty ${empty === 1 ? 'square' : 'squares'}.`,
    },
    choices: numberChoices(r, grade, answer, slips(answer, [{ n: ask === 'filled' ? empty : filled, code: 'pp1-frame-swap' }]), 1, capacity),
  });
}
function solveFrame(question) {
  const { cells, columns, rows } = question.visual;
  return String(question.proof.givens.ask === 'filled' ? cells.length : columns * rows - cells.length);
}

// 5. Some are hiding behind a cloud or a rock; the total is in the question.
function draftCloud(grade, level, r) {
  const total = level === 1 ? r.int(3, 5) : level === 2 ? r.int(4, 8) : r.int(6, 10);
  const hidden = level === 1 ? r.int(1, 2) : level === 2 ? r.int(1, Math.min(4, total - 1)) : r.int(2, 5);
  const seen = total - hidden;
  const thing = r.pick(FRAME_THINGS);
  const cover = r.pick(['cloud', 'rock']);
  const size = seen <= 4 ? 60 : 48;
  const pts = scatterPoints(r, seen, { x: 16, y: 16, w: 270, h: 208, size, gap: 10 }).map(point => [point.x, point.y]);
  const many = THINGS[thing].many;
  return build({
    family: 'pp1-count-cloud',
    prompt: say(r, [`There are ${total} ${many} in all. How many hide?`, `There are ${total} ${many}. A ${cover} hides some. How many hide?`, `In all there are ${total} ${many}. How many are hiding?`]),
    answer: hidden,
    hint: `Count the ${many} you see. Some are hiding.`,
    explanation: `${total} in all and ${seen} you can see. ${total} take away ${seen} leaves ${hidden}.`,
    givens: { total },
    visual: {
      kind: 'v3-pp1-count-cloud', thing, cover, size, pts,
      description: `${counted(seen, thing)} are in view. A ${cover === 'cloud' ? 'cloud' : 'big rock'} with a question mark hides the rest.`,
    },
    choices: numberChoices(r, grade, hidden, [
      { n: seen, code: 'pp1-count-visible' }, { n: total, code: 'pp1-hidden-total' },
      { n: hidden - 1, code: 'missed-object' }, { n: hidden + 1, code: 'pp1-count-twice' }, { n: hidden + 2, code: 'pp1-count-twice' },
    ], 1, 12),
  });
}
const solveCloud = question => String(question.proof.givens.total - question.visual.pts.length);

// 6. A path of number stones with one stone left empty.
function draftStones(grade, level, r) {
  const mode = level === 1 ? 'up' : level === 2 ? r.pick(['up', 'down']) : r.pick(['down', 'skip', 'skipDown']);
  const step = mode === 'up' ? 1 : mode === 'down' ? -1 : mode === 'skip' ? 2 : -2;
  const top = level === 1 ? 6 : level === 2 ? 10 : 14;
  const start = step > 0 ? r.int(1, top - 4 * step) : r.int(1 - 4 * step, top);
  const full = range(5).map(index => start + step * index);
  const hole = r.int(0, 4);
  const values = full.map((value, index) => (index === hole ? null : value));
  const answer = full[hole];
  const left = hole > 0 ? full[hole - 1] : null;
  const right = hole < 4 ? full[hole + 1] : null;
  const stems = ['Which number is missing?', 'Which number goes on the empty stone?', 'Fill the empty stone. Which number?'];
  if (mode === 'up' && hole === 4) stems.push('What number comes next?');
  if (mode === 'down' || mode === 'skipDown') stems.push('Count back. Which number is missing?');
  if (mode === 'skip') stems.push('Count by twos. Which number is missing?');
  return build({
    family: 'pp1-count-stones', prompt: say(r, stems), answer,
    hint: mode === 'skip' || mode === 'skipDown' ? 'The stones jump by the same number each time. Check the stones beside it.' : mode === 'down' ? 'The numbers get smaller as you walk. Look at the stones beside the gap.' : 'The numbers get bigger by 1. Look at the stones beside the gap.',
    explanation: `The stones go ${step > 0 ? 'up' : 'down'} by ${Math.abs(step)}, so the empty stone is ${answer}.`,
    givens: { step },
    visual: {
      kind: 'v3-pp1-count-stones', values, guide: r.pick(['rover', 'otter', 'alien']), goal: r.pick(['flag', 'rocket', 'planet', 'ufo']),
      description: `A path of 5 stones with the numbers ${values.map(value => (value === null ? 'an empty stone' : value)).join(', ')}.`,
    },
    choices: numberChoices(r, grade, answer, [
      ...[left, right].filter(value => value !== null).map(value => ({ n: value, code: 'pp1-path-slip' })),
      { n: answer + (Math.abs(step) === 2 ? -1 : 2), code: 'pp1-path-step' }, { n: answer + (Math.abs(step) === 2 ? 1 : -2), code: 'pp1-path-step' },
      { n: answer + 1, code: 'pp1-count-twice' }, { n: answer - 1, code: 'missed-object' },
    ], 1, 16),
  });
}
function solveStones(question) {
  const { values } = question.visual;
  const known = values.map((value, index) => [value, index]).filter(([value]) => value !== null);
  const [[v0, i0], [v1, i1]] = known;
  return String(v0 + (v1 - v0) / (i1 - i0) * (values.indexOf(null) - i0));
}

const DEFS = {
  'pp1-count-sky': { skill: 'count', title: 'Count one kind of moon thing', draft: draftSky, solve: solveSky },
  'pp1-count-dice': { skill: 'count', title: 'Count the dots on dice', draft: draftDice, solve: solveDice },
  'pp1-count-cards': { skill: 'count', title: 'Match a number to a picture', draft: draftCards, solve: solveCards },
  'pp1-count-frame': { skill: 'count', title: 'Full and empty counting frames', draft: draftFrame, solve: solveFrame },
  'pp1-count-cloud': { skill: 'addition', title: 'How many are hiding?', draft: draftCloud, solve: solveCloud },
  'pp1-count-stones': { skill: 'sequence', title: 'Number stones on the path', draft: draftStones, solve: solveStones },
};
export const FAMILIES = Object.fromEntries(Object.entries(DEFS).map(([id, def]) => [id, { skill: def.skill, title: def.title }]));
export const draft = (family, grade, level, r) => DEFS[family].draft(grade, level, r);
export const solve = question => DEFS[question.family].solve(question);

const DIE_SIZE = { die: 124, dice: 104, domino: 108 };
const RENDER = {
  'v3-pp1-count-sky': v => night(v.items.map(([kind, x, y]) => put(kind, x, y, v.size)).join(''), v.description, 240, 0),
  'v3-pp1-count-dice': v => {
    const size = DIE_SIZE[v.style];
    let body;
    if (v.style === 'domino') body = domino(240, 120, size, v.values, { rot: v.rots[0] });
    else if (v.values.length === 1) body = die(240, 120, size, v.values[0], { fill: HUES[v.hues[0]], rot: v.rots[0] });
    else body = v.values.map((value, index) => die(index ? 326 : 154, 120, size, value, { fill: HUES[v.hues[index]], rot: v.rots[index] })).join('');
    return night(body, v.description);
  },
  'v3-pp1-numeral': v => svg(plate('night', 480, 120, { stars: 0 }) + badge(240, 60, 48, v.value, { size: 72 }), v.description, 480, 120),
  'v3-pp1-count-card': v => {
    if (v.mode === 'dots') {
      return svg(`<rect x="6" y="6" width="98" height="98" rx="20" fill="${v.hue}" stroke="${INK}" stroke-width="4"/>${pips(v.count, 55, 55, 98)}`, v.description, 110, 110);
    }
    if (v.mode === 'frame') return svg(tokenFrame(v.count, 10, 12, 30, v.thing), v.description, 170, 84);
    return svg(`<rect x="3" y="3" width="174" height="104" rx="16" fill="#fffdf5" stroke="${INK}" stroke-width="4"/>${v.pts.map(([x, y]) => token(v.thing, x, y, v.size)).join('')}`, v.description, 180, 110);
  },
  'v3-pp1-count-frame': v => {
    const cell = v.rows === 1 ? 78 : 70;
    return night(tenFrame(v.cells, (480 - v.columns * cell) / 2, (200 - v.rows * cell) / 2, { cell, columns: v.columns, rows: v.rows, name: THINGS[v.thing].sprite }), v.description, 200, 0);
  },
  'v3-pp1-count-cloud': v => {
    const cover = v.cover === 'cloud' ? cloud(376, 112, 164, 124) : boulder(376, 126, 156, 124);
    return night(v.pts.map(([x, y]) => put(v.thing, x, y, v.size)).join('') + cover + badge(376, v.cover === 'cloud' ? 118 : 126, 28, '?', { fill: HUES.yellow, size: 34 }), v.description, 240, 0);
  },
  'v3-pp1-count-stones': v => {
    const xs = [60, 150, 240, 330, 420];
    const ys = [156, 134, 156, 134, 156];
    const body = v.values.map((value, index) => (value === null
      ? `<ellipse cx="${xs[index]}" cy="${ys[index]}" rx="40" ry="32" fill="#fff0c2" stroke="${ORANGE}" stroke-width="4.5" stroke-dasharray="9 6"/>${text(xs[index], ys[index] + 13, '?', { size: 38, weight: 800, fill: ORANGE })}`
      : `<ellipse cx="${xs[index]}" cy="${ys[index]}" rx="40" ry="32" fill="#cfd6e4" stroke="${INK}" stroke-width="4.5"/>${text(xs[index], ys[index] + 13, String(value), { size: 38, weight: 800 })}`)).join('');
    return night(body + put(v.guide, xs[0], ys[0] - 74, 64) + put(v.goal, xs[4], ys[4] - 74, 64), v.description, 230, 0);
  },
};
export const render = visual => RENDER[visual.kind]?.(visual) ?? null;
