// PP1 chapter: Sorting satellites. Five sorting games: odd one out, which box, find the twin, count by size and kind, spot the wrong tray.
import { MISCONCEPTIONS as SHARED, answerChoices, choiceCount } from './bank-shared.mjs';
import { ORANGE } from './diagram-kit.mjs';
import {
  COST, HUES, INK, PAPER, QuestionRetry, THINGS, TOKENS, badge, build, listText, pickOption, plate, put, say, scatterPoints,
  spreadWrongs, sum, svg, thingWord, token, wrong,
} from './bank3-pp1-art.mjs';

export const MISCONCEPTIONS = {
  'pp1-odd-kind': { title: 'Find the different one', message: 'Those two are alike. Find the one that is a different kind of thing.' },
  'pp1-odd-size': { title: 'Look at the size', message: 'Those two are the same size. Find the one that is a different size.' },
  'pp1-odd-count': { title: 'Count each card', message: 'Those two cards show the same number. Find the card with a different number.' },
  'pp1-belong-other': { title: 'Look in the box', message: 'Look at the things in the box. Pick the box with the same kind of thing.' },
  'pp1-belong-kind': { title: 'Match the kind', message: 'That box has a different kind of thing. Match the kind, not just the size.' },
  'pp1-belong-size': { title: 'Match the size too', message: 'That box has the right kind of thing but a different size. Check the size too.' },
  'pp1-twin-other': { title: 'Look again', message: 'That is a different picture. Find the one that matches exactly.' },
  'pp1-twin-turn': { title: 'Check which way it points', message: 'That one is turned another way. Find the one turned the same way.' },
  'pp1-twin-order': { title: 'Check the order', message: 'Those things are in a different order. Match each place from left to right.' },
  'pp1-twin-change': { title: 'Spot the change', message: 'One thing in that picture is different. Check every place.' },
  'pp1-sortcount-all': { title: 'Count only some', message: 'That counts everything. Count only the ones the question asks for.' },
  'pp1-sortcount-other': { title: 'Count the right group', message: 'That counts a different group. Check the kind and the size that are asked.' },
  'pp1-sortcount-off': { title: 'Touch each one once', message: 'Touch each one one time as you count. Do not skip any or count one twice.' },
  'pp1-tray-fits': { title: 'Find the one that does not fit', message: 'That one is in the right tray. Find the one that does not match its tray.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

const an = word => (/^[aeiou]/i.test(word) ? 'an' : 'a');
const cap = word => word[0].toUpperCase() + word.slice(1);
const name = thing => THINGS[thing].one;
const withA = thing => `${an(name(thing))} ${name(thing)}`;
const withThe = thing => `the ${name(thing)}`;

// Moon Camp things in five groups. Groups that could be mixed up (a rocket or a planet is also "in the sky") are never shown together.
const GROUPS = {
  sky: { members: ['star', 'planet', 'ringed', 'moon', 'comet', 'sun'], plural: 'sky things', one: 'a sky thing', not: 'in the sky' },
  machines: { members: ['rover', 'rocket', 'ufo', 'satellite'], plural: 'machines', one: 'a machine', not: 'a machine' },
  friends: { members: ['alien', 'astro', 'otter'], plural: 'space friends', one: 'a space friend', not: 'alive' },
  camp: { members: ['crate', 'fuel', 'flag'], plural: 'camp things', one: 'a camp thing', not: 'camp gear' },
  treasure: { members: ['crystal', 'rock', 'coin'], plural: 'treasures', one: 'a treasure', not: null },
};
const CATS = Object.keys(GROUPS);
const CLASH = [['sky', 'machines'], ['sky', 'treasure'], ['camp', 'machines']];
const clashes = (a, b) => CLASH.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
const PAIRS = CATS.flatMap(a => CATS.filter(b => b !== a && !clashes(a, b)).map(b => [a, b]));
const TRIPLES = CATS.flatMap((a, i) => CATS.slice(i + 1).flatMap((b, j) => CATS.slice(i + j + 2).map(c => [a, b, c])))
  .filter(([a, b, c]) => !clashes(a, b) && !clashes(a, c) && !clashes(b, c));
const CAT_OF = Object.fromEntries(CATS.flatMap(cat => GROUPS[cat].members.map(thing => [thing, cat])));

// Things that look alike are not picked together when a question depends on telling them apart.
const NEAR = [['star', 'sun'], ['planet', 'ringed', 'moon', 'coin', 'rock']];
const near = (a, b) => NEAR.some(group => group.includes(a) && group.includes(b));
function pickApart(r, pool, count) {
  const picks = [];
  for (const thing of r.shuffle(pool)) if (picks.length < count && !picks.some(other => near(thing, other))) picks.push(thing);
  if (picks.length < count) throw new QuestionRetry('Not enough different things.');
  return picks;
}

// ---- Pictures shared by the picture-choice families ----
const frame = (inner, w = 110, h = 110) => `<rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="20" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"/>${inner}`;
const drawItems = items => items.map(([thing, x, y, size, rot, flip]) => put(thing, x, y, size, { rotate: rot, flip })).join('');
const itemCard = (thing, size, tag = name(thing), description = `${cap(withA(thing))} on a card.`) => ({
  kind: 'v3-pp1-sort-card', w: 110, h: 110, tag, items: [[thing, 55, 55, size]], description,
});
function checkTags(question) {
  question.options.forEach((label, index) => {
    if (label !== question.optionVisuals?.[index]?.tag) throw new Error('A picture choice does not match its label.');
  });
  return question.optionVisuals;
}
const uniqueIndex = keys => {
  const singles = keys.map((key, index) => [key, index]).filter(([key]) => keys.filter(other => other === key).length === 1);
  if (singles.length !== 1) throw new Error('There is not exactly one odd card.');
  return singles[0][1];
};

// ---- 1. Odd one out: three big picture choices and no other picture. ----
const ODD_MODES = { 1: ['kind', 'kind', 'size'], 2: ['kind', 'size', 'count'], 3: ['kind', 'count', 'size', 'count'] };
const NOISE = [88, 70, 54];
const ODD_SIZES = { 1: [84, 44], 2: [80, 52], 3: [78, 56] };

function oddKind(grade, level, r) {
  const [major, minor] = r.pick(PAIRS);
  const same = pickApart(r, GROUPS[major].members, 2);
  const lone = r.pick(GROUPS[minor].members);
  const sizes = level === 1 ? [78, 78, 78] : r.shuffle(NOISE);
  const cards = [...same, lone].map((thing, index) => itemCard(thing, sizes[index]));
  const not = GROUPS[major].not;
  const explicit = level === 1 && not;
  return build({
    family: 'pp1-sort-odd',
    prompt: say(r, explicit
      ? [`Which one is not ${not}?`, `Find the one that is not ${not}.`, `Touch the one that is not ${not}.`]
      : ['Which one does not belong?', 'Which one is the odd one out?', 'Which one is not like the others?']),
    answer: name(lone),
    hint: explicit ? `2 of them are ${GROUPS[major].plural}. Which one is not?` : '2 of them go together. Which one does not?',
    explanation: `${cap(withThe(same[0]))} and ${withThe(same[1])} are ${GROUPS[major].plural}. ${cap(withThe(lone))} is not.`,
    givens: { mode: 'kind', things: [...same, lone], sizes },
    choices: answerChoices(name(lone), same.map((thing, index) => wrong(name(thing), 'pp1-odd-kind', cards[index])), choiceCount(grade), cards[2], KNOWN),
  });
}

function oddSize(grade, level, r) {
  const things = pickApart(r, GROUPS[r.pick(['sky', 'machines', 'friends', 'camp'])].members, 3);
  const [big, small] = ODD_SIZES[level];
  const oddBig = r.int(0, 1) === 1;
  const sizes = oddBig ? [small, small, big] : [big, big, small];
  const words = sizes.map(size => (size === big ? 'big' : 'small'));
  const cards = things.map((thing, index) => itemCard(thing, sizes[index], `${words[index]} ${name(thing)}`, `${cap(an(words[index]))} ${words[index]} ${name(thing)} on a card.`));
  return build({
    family: 'pp1-sort-odd',
    prompt: say(r, ['Which one is a different size?', 'Which one is not the same size?', 'Find the one that is a different size.']),
    answer: cards[2].tag, hint: 'Look at how big each one is.',
    explanation: `2 are ${words[0]} and one is ${words[2]}. The ${words[2]} one is different.`,
    givens: { mode: 'size', things, sizes },
    choices: answerChoices(cards[2].tag, [0, 1].map(index => wrong(cards[index].tag, 'pp1-odd-size', cards[index])), choiceCount(grade), cards[2], KNOWN),
  });
}

function oddCount(grade, level, r) {
  const kinds = r.shuffle(TOKENS).slice(0, 3);
  const top = level === 2 ? 5 : 6;
  const same = r.int(1, top);
  const odd = r.pick(Array.from({ length: top }, (_, index) => index + 1).filter(n => Math.abs(n - same) >= (level === 2 ? 2 : 1)));
  const counts = [same, same, odd];
  const cards = counts.map((n, index) => {
    const size = n <= 3 ? 36 : 28;
    const pts = scatterPoints(r, n, { x: 7, y: 7, w: 96, h: 96, size, gap: n <= 3 ? 4 : 2 }).map(point => [point.x, point.y]);
    const tag = `${n} ${thingWord(kinds[index], n)}`;
    return { kind: 'v3-pp1-sort-tokens', token: kinds[index], size, pts, tag, description: `A card with ${tag}.` };
  });
  return build({
    family: 'pp1-sort-odd',
    prompt: say(r, ['Which card shows a different number?', 'Which card has a different number?', 'Which one has a different number?']),
    answer: cards[2].tag, hint: 'Count the things on each card.',
    explanation: `2 cards show ${same}. This card shows ${odd}, so it is different.`,
    givens: { mode: 'count', kinds, counts },
    choices: answerChoices(cards[2].tag, [0, 1].map(index => wrong(cards[index].tag, 'pp1-odd-count', cards[index])), choiceCount(grade), cards[2], KNOWN),
  });
}
function draftOdd(grade, level, r) {
  const mode = r.pick(ODD_MODES[level]);
  return (mode === 'kind' ? oddKind : mode === 'size' ? oddSize : oddCount)(grade, level, r);
}
function solveOdd(question) {
  const cards = checkTags(question);
  const { mode } = question.proof.givens;
  const keys = cards.map(card => (mode === 'kind' ? CAT_OF[card.items[0][0]] : mode === 'size' ? card.items[0][3] : card.pts.length));
  return question.options[uniqueIndex(keys)];
}

// ---- 2. Which box does the mystery thing go in? ----
const BOX_BIG = 56;
const BOX_SMALL = 36;
const BOX_X = [10, 170, 330];
const sizeWord = size => (size === BOX_SMALL ? 'small' : 'big');

function draftBelong(grade, level, r) {
  const both = level === 3;
  let cats;
  let boxes;
  let mystery;
  let rightIndex;
  let codes;
  if (both) {
    const [home, other] = r.pick(PAIRS);
    const members = r.shuffle(GROUPS[home].members);
    const side = r.pick([BOX_BIG, BOX_SMALL]);
    const homeItems = members.slice(1, 3);
    const otherItems = r.shuffle(GROUPS[other].members).slice(0, 2);
    const specs = r.shuffle([
      { cat: home, size: side, things: homeItems, code: null },
      { cat: home, size: side === BOX_BIG ? BOX_SMALL : BOX_BIG, things: homeItems, code: 'pp1-belong-size' },
      { cat: other, size: side, things: otherItems, code: 'pp1-belong-kind' },
    ]);
    rightIndex = specs.findIndex(spec => spec.code === null);
    cats = specs.map(spec => spec.cat);
    boxes = specs.map(spec => ({ items: spec.things.map(thing => [thing, spec.size]) }));
    mystery = [members[0], side];
    codes = specs.map(spec => spec.code);
  } else {
    cats = r.shuffle(r.pick(TRIPLES));
    rightIndex = r.int(0, 2);
    const members = r.shuffle(GROUPS[cats[rightIndex]].members);
    const size = level === 1 ? BOX_BIG : r.pick([BOX_BIG, BOX_SMALL]);
    const opposite = size === BOX_BIG ? BOX_SMALL : BOX_BIG;
    const trapAt = r.pick([0, 1, 2].filter(index => index !== rightIndex));
    boxes = cats.map((cat, index) => {
      const things = index === rightIndex ? members.slice(1, 3) : r.shuffle(GROUPS[cat].members).slice(0, 2);
      let sizes;
      if (level === 1) sizes = [BOX_BIG, BOX_BIG];
      else if (index === rightIndex) sizes = r.pick([[opposite, opposite], [opposite, size], [size, opposite]]);
      else if (index === trapAt) sizes = [size, size];
      else sizes = [r.pick([BOX_BIG, BOX_SMALL]), r.pick([BOX_BIG, BOX_SMALL])];
      return { items: things.map((thing, k) => [thing, sizes[k]]) };
    });
    mystery = [members[0], size];
    codes = boxes.map((box, index) => (index === rightIndex ? null : level > 1 && box.items.every(([, s]) => s === size) ? 'pp1-belong-kind' : 'pp1-belong-other'));
  }
  const weight = sum(boxes.flatMap(box => box.items.map(([thing]) => COST[thing]))) + COST[mystery[0]];
  if (weight > 11500) throw new QuestionRetry('The boxes would be too crowded.');
  const kind = both ? 'both' : 'kind';
  const word = name(mystery[0]);
  const sized = level > 1;
  const itemWords = box => listText(box.items.map(([thing, size]) => (sized ? `a ${sizeWord(size)} ${name(thing)}` : withA(thing))));
  const group = GROUPS[cats[rightIndex]];
  const answer = `Box ${rightIndex + 1}`;
  const mine = both ? `${sizeWord(mystery[1])} ` : '';
  return build({
    family: 'pp1-sort-belong',
    prompt: say(r, both
      ? [`Which box does the ${mine}${word} go in?`, `Where does the ${mine}${word} go?`, `Find a box for the ${mine}${word}.`]
      : [`Which box does the ${word} go in?`, `Where does the ${word} go?`, `Which box is right for the ${word}?`, `Put the ${word} in a box. Which one?`]),
    answer,
    hint: both ? 'Check the kind of thing and the size.' : 'Look at the 2 things in each box. Which are like it?',
    explanation: both
      ? `The ${mine}${word} is ${group.one}. ${answer} has ${mine}${group.plural}.`
      : `The ${word} is ${group.one}. ${answer} has ${group.plural}.`,
    givens: { mode: kind },
    visual: {
      kind: 'v3-pp1-sort-boxes', boxes, mystery,
      description: `3 boxes. ${boxes.map((box, index) => `Box ${index + 1} holds ${itemWords(box)}.`).join(' ')} ${cap(`${withThe(mystery[0]).replace('the ', sized ? `the ${sizeWord(mystery[1])} ` : 'the ')}`)} waits to be sorted.`,
    },
    choices: answerChoices(answer, boxes.map((_, index) => index).filter(index => index !== rightIndex).map(index => wrong(`Box ${index + 1}`, codes[index])), choiceCount(grade), null, KNOWN),
  });
}
function solveBelong(question) {
  const { boxes, mystery } = question.visual;
  const both = question.proof.givens.mode === 'both';
  const fits = box => box.items.every(([thing, size]) => CAT_OF[thing] === CAT_OF[mystery[0]] && (!both || size === mystery[1]));
  const hits = boxes.map((box, index) => [fits(box), index]).filter(([fit]) => fit);
  if (hits.length !== 1) throw new Error('Exactly one box must fit the mystery thing.');
  return `Box ${hits[0][1] + 1}`;
}
function boxesPicture(v) {
  const parts = [plate('mint', 480, 250)];
  parts.push(`<circle cx="240" cy="62" r="47" fill="${PAPER}" stroke="${ORANGE}" stroke-width="5" stroke-dasharray="10 7"/>`, put(v.mystery[0], 240, 62, v.mystery[1]));
  v.boxes.forEach((box, index) => {
    const x = BOX_X[index];
    parts.push(`<rect x="${x}" y="132" width="140" height="108" rx="16" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>`);
    box.items.forEach(([thing, size], k) => parts.push(put(thing, x + 38 + k * 64, 192, size)));
    parts.push(badge(x + 24, 134, 20, index + 1, { fill: HUES.yellow, size: 28 }));
  });
  return svg(parts.join(''), v.description, 480, 250);
}

// ---- 3. Find the twin: one big picture to match, three picture choices. ----
const TURNS = {
  rocket: [[0, 'pointing up'], [90, 'pointing right'], [180, 'pointing down'], [-90, 'pointing left']],
  comet: [[0, 'flying up and right'], [90, 'flying down and right'], [180, 'flying down and left'], [-90, 'flying up and left']],
  fuel: [[0, 'standing up'], [180, 'upside down'], [90, 'lying, cap on the right'], [-90, 'lying, cap on the left']],
};
const ROW_POOL = ['star', 'planet', 'moon', 'comet', 'rocket', 'rover', 'ufo', 'alien', 'astro', 'crate', 'fuel', 'flag', 'crystal', 'ringed'];
const lookOf = items => items.map(([thing, , , , rot = 0, flip = false]) => `${thing}:${rot}:${flip ? 1 : 0}`).join('|');

function draftTwin(grade, level, r) {
  const mode = level === 1 ? 'copy' : level === 2 ? r.pick(['copy', 'facing', 'facing']) : r.pick(['facing', 'row', 'row']);
  let target;
  let cards;
  let prompt;
  let hint;
  let explanation;
  let givens;
  let description;
  if (mode === 'copy') {
    const things = pickApart(r, level === 1 ? Object.keys(CAT_OF) : GROUPS[r.pick(['sky', 'machines', 'friends', 'camp'])].members, 3);
    target = [[things[0], 200, 76, 112]];
    cards = things.map((thing, index) => ({ ...itemCard(thing, 76), code: index ? 'pp1-twin-other' : null }));
    prompt = say(r, ['Which one is the same?', 'Find the twin.', 'Which one matches?', 'Which one looks just the same?']);
    hint = 'Look at the shape and the colours. Find the one that matches.';
    explanation = `The ${name(things[0])} that looks just the same is the match.`;
    givens = { mode, things };
    description = `${cap(withA(things[0]))} to match.`;
  } else if (mode === 'facing') {
    const thing = r.pick(Object.keys(TURNS));
    const turns = r.shuffle(TURNS[thing]).slice(0, 3);
    target = [[thing, 200, 76, 112, ...(turns[0][0] ? [turns[0][0]] : [])]];
    cards = turns.map(([rot, words], index) => {
      const card = itemCard(thing, 76, `${name(thing)} ${words}`, `${cap(withA(thing))} ${words} on a card.`);
      if (rot) card.items[0].push(rot);
      return { ...card, code: index ? 'pp1-twin-turn' : null };
    });
    prompt = say(r, ['Which one is turned the same way?', 'Which one faces the same way?', 'Which one matches?', 'Find the one turned the same way.']);
    hint = 'Look at which way it points. Find the same one.';
    explanation = `The ${name(thing)} ${turns[0][1]} is the match.`;
    givens = { mode, thing, turns: turns.map(([rot]) => rot) };
    description = `${cap(withA(thing))} ${turns[0][1]} to match.`;
  } else {
    const [a, b, c, d] = pickApart(r, ROW_POOL, 4);
    const swap = r.pick([[0, 1], [1, 2], [0, 2]]);
    const swapped = [a, b, c];
    [swapped[swap[0]], swapped[swap[1]]] = [swapped[swap[1]], swapped[swap[0]]];
    const changed = [a, b, c];
    changed[r.int(0, 2)] = d;
    const variants = [[[a, b, c], null], [swapped, 'pp1-twin-order'], [changed, 'pp1-twin-change']];
    if (variants.some(([things]) => sum(things.map(thing => COST[thing])) > 4200)) throw new QuestionRetry('A card would be too crowded.');
    target = [a, b, c].map((thing, index) => [thing, 112 + index * 88, 76, 78]);
    cards = variants.map(([things, code]) => ({
      kind: 'v3-pp1-sort-card', w: 176, h: 110, tag: listText(things.map(name)),
      items: things.map((thing, index) => [thing, 34 + index * 54, 55, 48]), description: `A card with ${listText(things.map(withA))}.`, code,
    }));
    prompt = say(r, ['Which picture is just the same?', 'Which one matches the picture?', 'Find the picture that is the same.']);
    hint = 'Check each place, one by one, from left to right.';
    explanation = 'The same things in the same places make the match.';
    givens = { mode, things: [a, b, c, d], swap };
    description = `A row with ${listText([a, b, c].map(withA))} to match.`;
  }
  const answerCard = cards.find(card => !card.code);
  const options = cards.map(({ code, ...visual }) => ({ visual, code }));
  return build({
    family: 'pp1-sort-twin', prompt, answer: answerCard.tag, hint, explanation, givens,
    visual: { kind: 'v3-pp1-sort-target', items: target, description },
    choices: answerChoices(answerCard.tag, options.filter(option => option.code).map(option => wrong(option.visual.tag, option.code, option.visual)), choiceCount(grade), options.find(option => !option.code).visual, KNOWN),
  });
}
function solveTwin(question) {
  const cards = checkTags(question);
  const target = lookOf(question.visual.items);
  const hits = cards.map((card, index) => [lookOf(card.items) === target, index]).filter(([same]) => same);
  if (hits.length !== 1) throw new Error('Exactly one picture must match.');
  return question.options[hits[0][1]];
}

// ---- 4. Count by size and by kind on a camp shelf. ----
const SHELF = { big: 74, small: 40 };
const COUNT_POOL = ['star', 'rocket', 'flag', 'crate', 'fuel', 'comet', 'ufo', 'rover', 'alien', 'crystal', 'astro', 'planet'];
const matches = (cell, ask) => {
  if (ask.by === 'size') return cell.big === (ask.size === 'big');
  if (ask.by === 'kind') return cell.thing === ask.thing;
  if (ask.by === 'both') return cell.thing === ask.thing && cell.big === (ask.size === 'big');
  return cell.thing !== ask.thing;
};
const tally = (cells, ask) => cells.filter(cell => matches(cell, ask)).length;

function draftCount(grade, level, r) {
  const by = level === 1 ? 'size' : level === 2 ? r.pick(['size', 'kind']) : r.pick(['both', 'not']);
  const total = level === 1 ? r.int(4, 7) : level === 2 ? r.int(5, 8) : r.int(7, 10);
  const kinds = pickApart(r, COUNT_POOL, level === 1 ? 1 : by === 'not' ? 3 : 2);
  const ask = { by, size: r.pick(['big', 'small']), thing: kinds[0] };
  let cells = null;
  let answer = 0;
  for (let attempt = 0; attempt < 40 && !cells; attempt++) {
    const draw = Array.from({ length: total }, () => ({ thing: r.pick(kinds), big: r.int(0, 1) === 1 }));
    const found = tally(draw, ask);
    const sizeOnly = tally(draw, { by: 'size', size: ask.size });
    const kindOnly = tally(draw, { by: 'kind', thing: ask.thing });
    const good = found >= 1 && found <= Math.min(level === 1 ? 5 : 6, total - 1)
      && kinds.every(kind => draw.some(cell => cell.thing === kind)) && draw.some(cell => cell.big) && draw.some(cell => !cell.big)
      && (by !== 'both' || (sizeOnly !== found && kindOnly !== found && draw.some(cell => cell.thing === ask.thing && cell.big !== (ask.size === 'big'))))
      && (by !== 'not' || kindOnly !== found);
    if (good) {
      cells = draw;
      answer = found;
    }
  }
  if (!cells) throw new QuestionRetry('The shelf does not fit the question.');
  const top = Math.ceil(total / 2);
  const rows = [cells.slice(0, top), cells.slice(top)];
  const baselines = [112, 218];
  const items = rows.flatMap((row, rowIndex) => row.map((cell, index) => {
    const size = cell.big ? SHELF.big : SHELF.small;
    return [cell.thing, Math.round(240 + (index - (row.length - 1) / 2) * 96 + r.int(-5, 5)), baselines[rowIndex] - size / 2 + 2, size];
  }));
  if (sum(items.map(([thing]) => COST[thing])) > 12500) throw new QuestionRetry('The shelf would be too crowded.');
  const many = THINGS[ask.thing].many;
  const stems = {
    size: [`How many are ${ask.size}?`, `Count the ${ask.size} ones.`, `How many ${ask.size} ones do you see?`],
    kind: [`How many ${many} are there?`, `Count the ${many}. How many?`, `How many ${many} do you see?`],
    both: [`How many ${ask.size} ${many}?`, `Count the ${ask.size} ${many}.`, `How many ${ask.size} ${many} are there?`],
    not: [`How many are not ${many}?`, `Count the ones that are not ${many}.`, `Count only the ones that are not ${many}.`],
  }[by];
  const hints = {
    size: `Touch each ${ask.size} one as you count.`, kind: `Touch each ${name(ask.thing)}. Skip the others.`,
    both: `Count only the ${ask.size} ${many}. Skip the rest.`, not: `Skip the ${many}. Count all the others.`,
  };
  const reasons = {
    size: answer === 1 ? `There is 1 ${ask.size} one.` : `There are ${answer} ${ask.size} ones.`,
    kind: answer === 1 ? `There is 1 ${name(ask.thing)}.` : `There are ${answer} ${many}.`,
    both: `${answer} of the ${many} ${answer === 1 ? 'is' : 'are'} ${ask.size}.`,
    not: answer === 1 ? `1 of the things is not ${withA(ask.thing)}.` : `${answer} of the things are not ${many}.`,
  };
  const others = {
    size: [{ n: total - answer, code: 'pp1-sortcount-other' }],
    kind: [{ n: total - answer, code: 'pp1-sortcount-other' }],
    both: [{ n: tally(cells, { by: 'size', size: ask.size }), code: 'pp1-sortcount-other' }, { n: tally(cells, { by: 'kind', thing: ask.thing }), code: 'pp1-sortcount-other' }],
    not: [{ n: tally(cells, { by: 'kind', thing: ask.thing }), code: 'pp1-sortcount-other' }],
  }[by];
  const counts = new Map();
  for (const cell of cells) {
    const key = `${cell.big ? 'big' : 'small'} ${cell.thing}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const shelfWords = listText([...counts].map(([key, count]) => {
    const [size, thing] = key.split(' ');
    return `${count} ${size} ${thingWord(thing, count)}`;
  }));
  return build({
    family: 'pp1-sort-count', prompt: say(r, stems), answer, hint: hints[by], explanation: reasons[by],
    givens: { ask },
    visual: { kind: 'v3-pp1-sort-shelf', items, description: `A camp shelf with ${shelfWords}.` },
    choices: answerChoices(String(answer), spreadWrongs(r, answer, [
      ...others, { n: total, code: 'pp1-sortcount-all' },
      { n: answer + 1, code: 'pp1-sortcount-off' }, { n: answer - 1, code: 'pp1-sortcount-off' }, { n: answer + 2, code: 'pp1-sortcount-off' },
    ], { min: 1, max: total }), choiceCount(grade), null, KNOWN),
  });
}
function solveCount(question) {
  const { ask } = question.proof.givens;
  return String(tally(question.visual.items.map(([thing, , , size]) => ({ thing, big: size > 57 })), ask));
}
function shelfPicture(v) {
  const planks = [112, 218].map(y => `<rect x="12" y="${y}" width="456" height="12" rx="5" fill="#c89a62" stroke="${INK}" stroke-width="3"/>`).join('');
  return svg(plate('sunny', 480, 240) + planks + v.items.map(([thing, x, y, size]) => put(thing, x, y, size)).join(''), v.description, 480, 240);
}

// ---- 5. Spot the wrong tray: one thing sits in a tray where it does not belong. ----
const TRAY_TINTS = ['#e4efff', '#ffeede', '#e6f6e4'];
const traySlots = (count, x, w) => {
  const mid = x + w / 2;
  return count === 2 ? [[mid - w * 0.24, 76], [mid + w * 0.24, 76]] : [[mid - w * 0.24, 54], [mid + w * 0.24, 54], [mid, 102]];
};

function draftTrays(grade, level, r) {
  const three = level === 3;
  const picks = three ? r.pick(TRIPLES) : r.pick(PAIRS);
  const [home, host, third] = three ? r.shuffle(picks) : picks;
  const homeThings = r.shuffle(GROUPS[home].members);
  const intruder = homeThings[2];
  const hostThings = r.shuffle(GROUPS[host].members).slice(0, 2);
  const defs = [
    { things: homeThings.slice(0, 2) },
    { things: r.shuffle([...hostThings, intruder]) },
    ...(three ? [{ things: r.shuffle(GROUPS[third].members).slice(0, 2) }] : []),
  ];
  const order = r.shuffle(defs);
  if (sum(order.flatMap(def => def.things.map(thing => COST[thing]))) > 11000) throw new QuestionRetry('The trays would be too crowded.');
  const size = level === 1 ? 56 : three ? r.pick([46, 36]) : r.pick([56, 40]);
  const width = three ? 122 : 188;
  const trays = order.map((def, index) => {
    const x = three ? 9 + index * 130 : 8 + index * 196;
    return {
      x, w: width,
      items: def.things.map((thing, k) => {
        const [cx, cy] = traySlots(def.things.length, x, width)[k];
        const own = level === 1 ? size : r.pick([size, three ? 36 : 40]);
        return [thing, Math.round(cx), cy, own];
      }),
    };
  });
  const places = three ? ['left', 'middle', 'right'] : ['left', 'right'];
  const wrongThings = [homeThings[0], hostThings[0]];
  const cards = [intruder, ...wrongThings].map(thing => itemCard(thing, 78));
  return build({
    family: 'pp1-sort-trays',
    prompt: say(r, ['Which one is in the wrong tray?', 'Which one does not fit its tray?', 'Find the one in the wrong tray.', 'Which one is not in the right tray?']),
    answer: name(intruder),
    hint: 'Look at the things in each tray. Which one is different?',
    explanation: `${cap(withThe(intruder))} is ${GROUPS[home].one}. It does not go with ${GROUPS[host].plural}.`,
    givens: { trays: trays.map(tray => tray.items.map(([thing]) => thing)) },
    visual: {
      kind: 'v3-pp1-sort-trays', trays,
      description: `${three ? 3 : 2} trays. ${trays.map((tray, index) => `The ${places[index]} tray holds ${listText(tray.items.map(([thing]) => withA(thing)))}.`).join(' ')}`,
    },
    choices: answerChoices(name(intruder), wrongThings.map((thing, index) => wrong(name(thing), 'pp1-tray-fits', cards[index + 1])), choiceCount(grade), cards[0], KNOWN),
  });
}
function solveTrays(question) {
  const mixed = question.visual.trays.filter(tray => new Set(tray.items.map(([thing]) => CAT_OF[thing])).size > 1);
  if (mixed.length !== 1) throw new Error('Exactly one tray must hold a thing that does not fit.');
  const cats = mixed[0].items.map(([thing]) => CAT_OF[thing]);
  const lone = mixed[0].items.filter(([thing]) => cats.filter(cat => cat === CAT_OF[thing]).length === 1);
  if (lone.length !== 1) throw new Error('Exactly one thing must be out of place.');
  checkTags(question);
  return pickOption(question, visual => visual.items[0][0] === lone[0][0]);
}
function traysPicture(v) {
  const parts = [plate('lavender', 400, 150)];
  v.trays.forEach((tray, index) => {
    parts.push(`<rect x="${tray.x}" y="14" width="${tray.w}" height="122" rx="16" fill="${TRAY_TINTS[index]}" stroke="${INK}" stroke-width="4"/>`);
    parts.push(`<rect x="${tray.x + 10}" y="125" width="${tray.w - 20}" height="5" rx="2.5" fill="${INK}"/>`);
    tray.items.forEach(([thing, x, y, size]) => parts.push(put(thing, x, y, size)));
  });
  return svg(parts.join(''), v.description, 400, 150);
}

const DEFS = {
  'pp1-sort-odd': { skill: 'odd', title: 'Find the odd one out', draft: draftOdd, solve: solveOdd },
  'pp1-sort-belong': { skill: 'groups', title: 'Which box does it go in', draft: draftBelong, solve: solveBelong },
  'pp1-sort-twin': { skill: 'visual', title: 'Find the matching twin', draft: draftTwin, solve: solveTwin },
  'pp1-sort-count': { skill: 'count', title: 'Count by size and by kind', draft: draftCount, solve: solveCount },
  'pp1-sort-trays': { skill: 'groups', title: 'Spot the wrong tray', draft: draftTrays, solve: solveTrays },
};
export const FAMILIES = Object.fromEntries(Object.entries(DEFS).map(([id, def]) => [id, { skill: def.skill, title: def.title }]));
export const draft = (family, grade, level, r) => DEFS[family].draft(grade, level, r);
export const solve = question => DEFS[question.family].solve(question);

const RENDER = {
  'v3-pp1-sort-card': v => svg(frame(drawItems(v.items), v.w, v.h), v.description, v.w, v.h),
  'v3-pp1-sort-tokens': v => svg(frame(v.pts.map(([x, y]) => token(v.token, x, y, v.size)).join('')), v.description, 110, 110),
  'v3-pp1-sort-boxes': boxesPicture,
  'v3-pp1-sort-target': v => svg(plate('sunny', 400, 150) + drawItems(v.items), v.description, 400, 150),
  'v3-pp1-sort-shelf': shelfPicture,
  'v3-pp1-sort-trays': traysPicture,
};
export const render = visual => RENDER[visual.kind]?.(visual) ?? null;
