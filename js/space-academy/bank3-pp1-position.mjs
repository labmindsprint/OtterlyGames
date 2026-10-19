// PP1 chapter: Where is the rover? Seven place games: shelf levels, a race, a row, place-word scenes, arrows and swaps.
import { MISCONCEPTIONS as SHARED, answerChoices, choiceCount } from './bank-shared.mjs';
import { ORANGE } from './diagram-kit.mjs';
import {
  HUES, INK, THINGS, arrow, boulder, build, distinctKinds, listText, moonGround, n1, pickOption, plate, put, say, spreadWrongs, svg, wrong,
} from './bank3-pp1-art.mjs';
import { cap, checkTags, drawItems, frame, name, thingCard, withA } from './bank3-pp1-cards.mjs';

export const MISCONCEPTIONS = {
  'pp1-stack-flip': { title: 'Top or bottom?', message: 'Top is the highest shelf and bottom is the lowest. Check which one is asked.' },
  'pp1-stack-other': { title: 'Look at each shelf', message: 'Check the shelf the question asks about. Go from the top shelf down.' },
  'pp1-race-end': { title: 'First or last?', message: 'The one nearest the flag is first. The one farthest from the flag is last.' },
  'pp1-race-place': { title: 'Count the places', message: 'Start at the flag. The nearest is first, then second, then last.' },
  'pp1-row-side': { title: 'Left or right?', message: 'That one is on the other side. Check which side the question asks about.' },
  'pp1-row-far': { title: 'Look right next to it', message: 'That one is not right next to it. Find the one that sits beside it.' },
  'pp1-row-named': { title: 'Find the one between', message: 'That one is named in the question. Find the one in the middle of the two.' },
  'pp1-row-count': { title: 'Count from the right end', message: 'Count one by one from the side the question says. Do not skip any.' },
  'pp1-where-word': { title: 'Look at the place', message: 'Look at where the thing is. Is it on, under, behind, in front or next to?' },
  'pp1-scene-place': { title: 'Match the place word', message: 'That picture shows a different place. Find the one that matches the words.' },
  'pp1-scene-thing': { title: 'Check the thing too', message: 'That picture has a different thing. The thing and the place must both match.' },
  'pp1-way-opposite': { title: 'The other way', message: 'That is the other way. Look from the start to the end.' },
  'pp1-way-turn': { title: 'Look along the line', message: 'That is sideways. The flag is not in that direction.' },
  'pp1-way-count': { title: 'Count the steps', message: 'Count each step the rover takes. Do not count the square it starts on.' },
  'pp1-swap-before': { title: 'Look after the swap', message: 'That one was there before the swap. The two arrows trade places.' },
  'pp1-swap-other': { title: 'Follow the swap', message: 'Follow the two things that trade places. The third one stays where it is.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

// Friendly, easy-to-tell-apart things for the "who" games.
const WHO = ['star', 'planet', 'rocket', 'rover', 'alien', 'astro', 'otter', 'ufo', 'comet', 'crate', 'fuel', 'flag', 'crystal', 'satellite'];
// Only things that can move take part in a race.
const RACERS = ['rocket', 'rover', 'alien', 'astro', 'otter', 'ufo', 'comet', 'satellite'];

const card = thing => thingCard('v3-pp1-pos-card', thing);
const whoChoices = (grade, answer, wrongs) => answerChoices(
  name(answer), wrongs.map(([thing, code]) => wrong(name(thing), code, card(thing))), choiceCount(grade), card(answer), KNOWN,
);
const pickWho = (question, thing) => {
  checkTags(question);
  return pickOption(question, visual => visual.items[0][0] === thing);
};
const manyOf = thing => THINGS[thing].many;

// ---- 1. Shelf: top, middle and bottom. ----
const SHELVES = ['top', 'middle', 'bottom'];
const SHELF_WORD = { top: 'Top shelf', middle: 'Middle shelf', bottom: 'Bottom shelf' };
const STACK_ASKS = {
  1: ['top', 'bottom', 'where'],
  2: ['top', 'bottom', 'middle', 'where', 'where'],
  3: ['middle', 'above', 'under', 'above', 'under', 'where'],
};

function draftStack(grade, level, r) {
  const rows = distinctKinds(r, 3, WHO);
  const ask = r.pick(STACK_ASKS[level]);
  const visual = {
    kind: 'v3-pp1-pos-stack', rows, tall: ask === 'where',
    description: `A shelf with 3 levels. The top shelf has 2 ${manyOf(rows[0])}. The middle shelf has 2 ${manyOf(rows[1])}. The bottom shelf has 2 ${manyOf(rows[2])}.`,
  };
  if (ask === 'where') {
    const at = r.int(0, 2);
    const thing = rows[at];
    const answer = SHELF_WORD[SHELVES[at]];
    return build({
      family: 'pp1-pos-stack',
      prompt: say(r, [`Where is the ${name(thing)}?`, `Which shelf is the ${name(thing)} on?`, `Where do you find the ${name(thing)}?`, `Find the ${name(thing)}. Which shelf?`]),
      answer, hint: 'Look for it. Is it high up, in the middle or low down?',
      explanation: `The ${name(thing)} is on the ${answer.toLowerCase()}.`,
      givens: { ask, thing }, visual,
      choices: answerChoices(answer, [0, 1, 2].filter(index => index !== at).map(index => wrong(SHELF_WORD[SHELVES[index]], Math.abs(index - at) === 2 ? 'pp1-stack-flip' : 'pp1-stack-other')), choiceCount(grade), null, KNOWN),
    });
  }
  let anchor = 0;
  if (ask === 'above') anchor = r.int(1, 2);
  if (ask === 'under') anchor = r.int(0, 1);
  const target = ask === 'above' ? anchor - 1 : ask === 'under' ? anchor + 1 : SHELVES.indexOf(ask);
  const flipAt = ask === 'top' ? 2 : ask === 'bottom' ? 0 : anchor === 1 ? 2 - target : -1;
  const hints = {
    top: 'The top shelf is the highest one.', bottom: 'The bottom shelf is the lowest one.', middle: 'The middle shelf is between the top and the bottom.',
    above: 'Above means higher up. Look at the shelf over it.', under: 'Under means lower down. Look at the shelf below it.',
  };
  const answerName = name(rows[target]);
  const reasons = {
    top: `The ${answerName} is on the top shelf.`, bottom: `The ${answerName} is on the bottom shelf.`, middle: `The ${answerName} is on the middle shelf.`,
    above: `The ${answerName} is just above the ${name(rows[anchor])}.`, under: `The ${answerName} is just under the ${name(rows[anchor])}.`,
  };
  const stems = {
    top: ['What is on the top shelf?', 'Which one is on the top shelf?', 'What is at the top?', 'Find the one on the top shelf.'],
    bottom: ['What is on the bottom shelf?', 'Which one is on the bottom shelf?', 'What is at the bottom?', 'Find the one on the bottom shelf.'],
    middle: ['What is on the middle shelf?', 'Which one is in the middle?', 'What is between the top and bottom?', 'Find the one on the middle shelf.'],
    above: [`What is above the ${name(rows[anchor])}?`, `Which one is just above the ${name(rows[anchor])}?`, `What sits above the ${name(rows[anchor])}?`],
    under: [`What is under the ${name(rows[anchor])}?`, `Which one is just under the ${name(rows[anchor])}?`, `What sits below the ${name(rows[anchor])}?`],
  }[ask];
  return build({
    family: 'pp1-pos-stack', prompt: say(r, stems), answer: answerName, hint: hints[ask], explanation: reasons[ask],
    givens: { ask, anchor }, visual,
    choices: whoChoices(grade, rows[target], [0, 1, 2].filter(index => index !== target).map(index => [rows[index], index === flipAt ? 'pp1-stack-flip' : 'pp1-stack-other'])),
  });
}
function solveStack(question) {
  const { rows } = question.visual;
  const { ask, thing, anchor } = question.proof.givens;
  if (ask === 'where') return SHELF_WORD[SHELVES[rows.indexOf(thing)]];
  const index = ask === 'above' ? anchor - 1 : ask === 'under' ? anchor + 1 : SHELVES.indexOf(ask);
  return pickWho(question, rows[index]);
}
function stackPicture(v) {
  const height = v.tall ? 232 : 150;
  const level = (height - 16) / 3;
  const size = Math.min(60, Math.round(level - 8));
  const parts = [plate('sky', 400, height), `<rect x="52" y="8" width="296" height="${height - 14}" rx="10" fill="#fff6dc" stroke="${INK}" stroke-width="4"/>`];
  v.rows.forEach((thing, index) => {
    const base = 8 + level * (index + 1);
    parts.push(`<rect x="52" y="${n1(base - 10)}" width="296" height="10" fill="#c89a62" stroke="${INK}" stroke-width="3.5"/>`);
    [138, 262].forEach(x => parts.push(put(thing, x, base - 8 - size / 2, size)));
  });
  return svg(parts.join(''), v.description, 400, height);
}

// ---- 2. Race: who is first, second or last? ----
const RACE_ASKS = { 1: ['first', 'last'], 2: ['first', 'last', 'second'], 3: ['second', 'behind', 'ahead', 'behind', 'ahead'] };
const LANE_Y = lane => 27 + lane * 46;

function draftRace(grade, level, r) {
  const order = distinctKinds(r, 3, RACERS);
  const first = r.int(250, 312);
  const xs = [first, first - r.int(66, 96)];
  xs.push(xs[1] - r.int(66, 96));
  const lanes = r.shuffle([0, 1, 2]);
  const racers = order.map((thing, rank) => [thing, xs[rank], lanes[rank]]).sort((a, b) => a[2] - b[2]);
  const ask = r.pick(RACE_ASKS[level]);
  let anchor = 0;
  if (ask === 'behind') anchor = r.int(0, 1);
  if (ask === 'ahead') anchor = r.int(1, 2);
  const target = { first: 0, second: 1, last: 2 }[ask] ?? (ask === 'behind' ? anchor + 1 : anchor - 1);
  const flipAt = ask === 'first' ? 2 : ask === 'last' ? 0 : -1;
  const hints = {
    first: 'The one closest to the finish line is first.', last: 'The one farthest from the finish line is last.', second: 'Second comes right after the one in front.',
    behind: 'Behind means farther from the finish line.', ahead: 'Ahead means closer to the finish line.',
  };
  const answerName = name(order[target]);
  const reasons = {
    first: `The ${answerName} is closest to the finish line, so it is first.`, last: `The ${answerName} is farthest from the finish line, so it is last.`,
    second: `The ${answerName} is the second one from the finish line.`,
    behind: `The ${answerName} is just behind the ${name(order[anchor])}.`, ahead: `The ${answerName} is just ahead of the ${name(order[anchor])}.`,
  };
  const stems = {
    first: ['Who is first?', 'Who is winning the race?', 'Who is nearest the finish?', 'Who is in front?'],
    last: ['Who is last?', 'Who is at the back?', 'Who is the last one?', 'Who is last in the race?'],
    second: ['Who is second?', 'Who is in second place?', 'Who comes second?'],
    behind: [`Who is just behind the ${name(order[anchor])}?`, `Who is right behind the ${name(order[anchor])}?`, `Who comes after the ${name(order[anchor])}?`],
    ahead: [`Who is just ahead of the ${name(order[anchor])}?`, `Who is right in front of the ${name(order[anchor])}?`, `Who comes before the ${name(order[anchor])}?`],
  }[ask];
  return build({
    family: 'pp1-pos-race', prompt: say(r, stems), answer: answerName, hint: hints[ask], explanation: reasons[ask],
    givens: { ask, anchor },
    visual: {
      kind: 'v3-pp1-pos-race', racers,
      description: `A race to the finish line with 3 racers. The ${name(order[0])} is closest to the finish line. The ${name(order[1])} is next. The ${name(order[2])} is farthest back.`,
    },
    choices: whoChoices(grade, order[target], [0, 1, 2].filter(index => index !== target).map(index => [order[index], index === flipAt ? 'pp1-race-end' : 'pp1-race-place'])),
  });
}
function solveRace(question) {
  const ranked = [...question.visual.racers].sort((a, b) => b[1] - a[1]).map(([thing]) => thing);
  const { ask, anchor } = question.proof.givens;
  const index = { first: 0, second: 1, last: 2 }[ask] ?? (ask === 'behind' ? anchor + 1 : anchor - 1);
  return pickWho(question, ranked[index]);
}
function racePicture(v) {
  const parts = [plate('paper', 400, 150)];
  for (let lane = 0; lane < 3; lane++) {
    parts.push(`<rect x="12" y="${6 + lane * 46}" width="376" height="42" rx="10" fill="${lane % 2 ? '#e8ecf6' : '#d3dbec'}" stroke="#7d889f" stroke-width="2.5"/>`);
  }
  parts.push(`<rect x="350" y="6" width="26" height="134" fill="#ffffff" stroke="${INK}" stroke-width="3"/>`);
  for (let row = 0; row < 12; row++) parts.push(`<rect x="${350 + (row % 2) * 13}" y="${n1(6 + row * 11.17)}" width="13" height="11.17" fill="${INK}"/>`);
  v.racers.forEach(([thing, x, lane]) => parts.push(put(thing, x, LANE_Y(lane), 36)));
  return svg(parts.join(''), v.description, 400, 150);
}

// ---- 3. Row: next to, between, and counting from the left or right. ----
const ROW_ASKS = { 1: ['left', 'right'], 2: ['left', 'right', 'between'], 3: ['nth', 'nth', 'between'] };
const ORDINAL = { 2: 'second', 3: 'third' };

function draftRow(grade, level, r) {
  const count = level === 3 ? 5 : 4;
  const things = distinctKinds(r, count, WHO);
  const ask = r.pick(ROW_ASKS[level]);
  const indexes = Array.from({ length: count }, (_, index) => index);
  let target;
  let wrongs;
  let givens;
  let prompt;
  let hint;
  let explanation;
  if (ask === 'left' || ask === 'right') {
    const anchor = r.int(1, 2);
    target = ask === 'left' ? anchor - 1 : anchor + 1;
    const across = ask === 'left' ? anchor + 1 : anchor - 1;
    wrongs = [[across, 'pp1-row-side'], ...indexes.filter(index => ![anchor, target, across].includes(index)).map(index => [index, 'pp1-row-far'])];
    const subject = name(things[anchor]);
    prompt = say(r, ask === 'left'
      ? [`What is next to the ${subject}, on the left?`, `Which one is just left of the ${subject}?`, `What is right beside the ${subject}, on the left?`]
      : [`What is next to the ${subject}, on the right?`, `Which one is just right of the ${subject}?`, `What is right beside the ${subject}, on the right?`]);
    hint = 'Look at the side the question says. Take one step that way.';
    explanation = `The ${name(things[target])} is just ${ask} of the ${subject}.`;
    givens = { ask, anchor: things[anchor] };
  } else if (ask === 'between') {
    const start = r.int(0, count - 3);
    target = start + 1;
    const named = [start, start + 2];
    const outside = indexes.filter(index => index < start || index > start + 2);
    wrongs = [[r.pick(named), 'pp1-row-named'], [r.pick(outside), 'pp1-row-far']];
    const [one, two] = named.map(index => name(things[index]));
    prompt = say(r, [`What is between the ${one} and the ${two}?`, `Which one is in between the ${one} and the ${two}?`, `What sits between the ${one} and the ${two}?`]);
    hint = 'Find both. The one in the middle of them is the answer.';
    explanation = `The ${name(things[target])} is between the ${one} and the ${two}.`;
    givens = { ask, a: things[named[0]], b: things[named[1]] };
  } else {
    const from = r.pick(['left', 'right']);
    const n = r.pick([2, 3]);
    target = from === 'left' ? n - 1 : count - n;
    const mirror = count - 1 - target;
    wrongs = r.shuffle([...(mirror === target ? [] : [[mirror, 'pp1-row-side']]), ...[target + 1, target - 1].filter(index => index >= 0 && index < count && index !== mirror).map(index => [index, 'pp1-row-count'])]);
    prompt = say(r, [`Which one is ${ORDINAL[n]} from the ${from}?`, `What is ${ORDINAL[n]} from the ${from}?`, `Find the one that is ${ORDINAL[n]} from the ${from}.`]);
    hint = 'Count from that side. Touch each one: first, second, third.';
    explanation = `The ${name(things[target])} is ${ORDINAL[n]} from the ${from}.`;
    givens = { ask, from, n };
  }
  return build({
    family: 'pp1-pos-row', prompt, answer: name(things[target]), hint, explanation, givens,
    visual: { kind: 'v3-pp1-pos-row', things, description: `A row of ${count} things on the moon, from left to right: ${listText(things.map(withA))}.` },
    choices: whoChoices(grade, things[target], wrongs.map(([index, code]) => [things[index], code])),
  });
}
function solveRow(question) {
  const { things } = question.visual;
  const g = question.proof.givens;
  let index;
  if (g.ask === 'left') index = things.indexOf(g.anchor) - 1;
  else if (g.ask === 'right') index = things.indexOf(g.anchor) + 1;
  else if (g.ask === 'between') index = (things.indexOf(g.a) + things.indexOf(g.b)) / 2;
  else index = g.from === 'left' ? g.n - 1 : things.length - g.n;
  return pickWho(question, things[index]);
}
function rowPicture(v) {
  const size = v.things.length === 5 ? 54 : 62;
  const gap = v.things.length === 5 ? 76 : 92;
  const x0 = 200 - gap * (v.things.length - 1) / 2;
  const parts = [plate('sky', 400, 150), moonGround(400, 150, 104)];
  v.things.forEach((thing, index) => parts.push(put(thing, x0 + index * gap, 112 - size / 2, size)));
  return svg(parts.join(''), v.description, 400, 150);
}

// ---- 4 and 5. Scenes: where is the thing? One picture with word choices, or word with picture choices. ----
const SIDE_PHRASE = { left: 'to the left of', right: 'to the right of' };
const SIDE_WORD = { left: 'To the left', right: 'To the right' };
const LANDMARKS = {
  table: { name: 'table', rels: ['on', 'under', 'left', 'right'], phrase: { on: 'on top of', under: 'under', ...SIDE_PHRASE }, word: { on: 'On top', under: 'Under', ...SIDE_WORD } },
  rock: { name: 'big rock', rels: ['behind', 'front', 'left', 'right'], phrase: { behind: 'behind', front: 'in front of', ...SIDE_PHRASE }, word: { behind: 'Behind', front: 'In front', ...SIDE_WORD } },
  bush: { name: 'bush', rels: ['behind', 'front', 'left', 'right'], phrase: { behind: 'behind', front: 'in front of', ...SIDE_PHRASE }, word: { behind: 'Behind', front: 'In front', ...SIDE_WORD } },
  wall: { name: 'wall', rels: ['behind', 'front', 'left', 'right'], phrase: { behind: 'behind', front: 'in front of', ...SIDE_PHRASE }, word: { behind: 'Behind', front: 'In front', ...SIDE_WORD } },
};
const SCENE_LANDMARKS = { 1: ['table', 'rock', 'bush'], 2: ['table', 'rock', 'bush', 'wall'], 3: ['table', 'rock', 'bush', 'wall'] };
// Left and right are drawn by mirroring the scene; the other places can be drawn either way round.
const mirrorFor = (rel, spare) => (rel === 'left' ? true : rel === 'right' ? false : spare);

function solidArt(landmark, cx, cy, w, h, k) {
  const stroke = n1(4 * k);
  if (landmark === 'bush') {
    return `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(w / 2)}" ry="${n1(h / 2)}" fill="#5bb86d" stroke="${INK}" stroke-width="${stroke}"/>`
      + `<ellipse cx="${n1(cx - w * 0.2)}" cy="${n1(cy - h * 0.12)}" rx="${n1(w * 0.14)}" ry="${n1(h * 0.12)}" fill="#8bd49a"/>`;
  }
  if (landmark === 'wall') {
    return `<rect x="${n1(cx - w / 2)}" y="${n1(cy - h / 2)}" width="${n1(w)}" height="${n1(h)}" rx="${n1(3 * k)}" fill="#d98c6a" stroke="${INK}" stroke-width="${stroke}"/>`
      + `<path d="M${n1(cx - w / 2)} ${n1(cy)}H${n1(cx + w / 2)}M${n1(cx)} ${n1(cy - h / 2)}V${n1(cy)}M${n1(cx - w / 4)} ${n1(cy)}V${n1(cy + h / 2)}M${n1(cx + w / 4)} ${n1(cy)}V${n1(cy + h / 2)}" stroke="${INK}" stroke-width="${n1(2.5 * k)}" fill="none"/>`;
  }
  return boulder(cx, cy, w, h);
}

// A thing and a landmark in a 110 x 110 scene, scaled by k and moved to (ox, oy). A mirrored scene swaps left and right.
function sceneArt(landmark, thing, rel, mirror, k, ox, oy) {
  const X = x => n1(ox + (mirror ? 110 - x : x) * k);
  const Y = y => n1(oy + y * k);
  const S = value => n1(value * k);
  const block = (x, y, w, h, fill) => `<rect x="${n1(ox + (mirror ? 110 - x - w : x) * k)}" y="${Y(y)}" width="${S(w)}" height="${S(h)}" rx="${S(2)}" fill="${fill}" stroke="${INK}" stroke-width="${n1(3.5 * k)}"/>`;
  const ground = `<rect x="${n1(ox + 8 * k)}" y="${Y(99)}" width="${S(94)}" height="${S(7)}" rx="${S(3.5)}" fill="#98a2b5"/>`;
  const beside = rel === 'left' || rel === 'right';
  if (landmark === 'table') {
    const [slab, left, right] = beside ? [[10, 56], 14, 54] : [[24, 62], 29, 73];
    const table = block(slab[0], 50, slab[1], 11, '#c89a62') + block(left, 61, 8, 38, '#a97c46') + block(right, 61, 8, 38, '#a97c46');
    const [x, y] = { on: [55, 34], under: [55, 82], left: [86, 82], right: [86, 82] }[rel];
    const sprite = put(thing, X(x), Y(y), S(32));
    return ground + (rel === 'on' ? table + sprite : sprite + table);
  }
  const solid = solidArt(landmark, X(beside ? 36 : 55), Y(76), S(58), S(46), k);
  const [x, y] = { behind: [55, 50], front: [55, 84], left: [86, 84], right: [86, 84] }[rel];
  const sprite = put(thing, X(x), Y(y), S(32));
  return ground + (rel === 'behind' ? sprite + solid : solid + sprite);
}
const sceneCard = (landmark, thing, rel, spare) => {
  const spot = LANDMARKS[landmark];
  return {
    kind: 'v3-pp1-pos-scene', w: 110, h: 110, landmark, thing, rel, mirror: mirrorFor(rel, spare),
    tag: `${name(thing)} ${spot.phrase[rel]} ${spot.name}`,
    description: `${cap(withA(thing))} ${spot.phrase[rel]} a ${spot.name}.`,
  };
};

function draftScene(grade, level, r) {
  const landmark = r.pick(SCENE_LANDMARKS[level]);
  const spot = LANDMARKS[landmark];
  const thing = r.pick(WHO);
  const rel = r.pick(spot.rels);
  const others = r.shuffle(spot.rels.filter(other => other !== rel));
  const flips = [r.int(0, 1) === 1, r.int(0, 1) === 1, r.int(0, 1) === 1];
  const right = sceneCard(landmark, thing, rel, flips[0]);
  const wrongs = level < 3
    ? others.slice(0, 2).map((other, index) => [sceneCard(landmark, thing, other, flips[index + 1]), 'pp1-scene-place'])
    : [[sceneCard(landmark, r.pick(WHO.filter(other => other !== thing)), rel, flips[1]), 'pp1-scene-thing'], [sceneCard(landmark, thing, others[0], flips[2]), 'pp1-scene-place']];
  const place = `${spot.phrase[rel]} the ${spot.name}`;
  return build({
    family: 'pp1-pos-scene',
    prompt: say(r, [`Which one has the ${name(thing)} ${place}?`, `Find the ${name(thing)} ${place}.`, `Which picture shows the ${name(thing)} ${place}?`, `Touch the ${name(thing)} that is ${place}.`]),
    answer: right.tag, hint: `Look at where the ${name(thing)} is. Match the place words.`,
    explanation: `The ${name(thing)} is ${place} in that picture.`,
    givens: { landmark, thing, rel },
    choices: answerChoices(right.tag, wrongs.map(([visual, code]) => wrong(visual.tag, code, visual)), choiceCount(grade), right, KNOWN),
  });
}
function solveScene(question) {
  checkTags(question);
  const { landmark, thing, rel } = question.proof.givens;
  return pickOption(question, visual => visual.landmark === landmark && visual.thing === thing && visual.rel === rel);
}

function draftWords(grade, level, r) {
  const landmark = r.pick(SCENE_LANDMARKS[level]);
  const spot = LANDMARKS[landmark];
  const thing = r.pick(WHO);
  const rel = r.pick(spot.rels);
  const ask = r.pick(['where', 'what']);
  const place = `${spot.phrase[rel]} the ${spot.name}`;
  const visual = {
    kind: 'v3-pp1-pos-big', landmark, thing, rel, mirror: mirrorFor(rel, r.int(0, 1) === 1),
    description: `${cap(withA(thing))} ${spot.phrase[rel]} a ${spot.name}.`,
  };
  if (ask === 'what') {
    const others = distinctKinds(r, 3, WHO.filter(other => other !== thing)).slice(0, choiceCount(grade) - 1);
    return build({
      family: 'pp1-pos-words',
      prompt: say(r, [`What is ${place}?`, `Which thing is ${place}?`, `Name the thing ${place}.`]),
      answer: name(thing), hint: `Find the ${spot.name} first. Then check each thing around it.`,
      explanation: `The ${name(thing)} is ${place}.`,
      givens: { ask }, visual,
      choices: answerChoices(name(thing), others.map(other => wrong(name(other), 'pp1-scene-thing')), choiceCount(grade), null, KNOWN),
    });
  }
  const answer = spot.word[rel];
  return build({
    family: 'pp1-pos-words',
    prompt: say(r, [`Where is the ${name(thing)}?`, `Where is the ${name(thing)} now?`, `Tell where the ${name(thing)} is.`, `Where is the ${name(thing)}? Look at the ${spot.name}.`]),
    answer, hint: `Look at the ${name(thing)} and the ${spot.name}. Where is it?`,
    explanation: `The ${name(thing)} is ${place}.`,
    givens: { ask }, visual,
    choices: answerChoices(answer, r.shuffle(spot.rels.filter(other => other !== rel)).slice(0, choiceCount(grade) - 1).map(other => wrong(spot.word[other], 'pp1-where-word')), choiceCount(grade), null, KNOWN),
  });
}
const solveWords = question => (question.proof.givens.ask === 'what' ? name(question.visual.thing) : LANDMARKS[question.visual.landmark].word[question.visual.rel]);

// ---- 6. Way: which arrow takes the rover to the flag? ----
const DIRS = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
const OPPOSITE = { right: 'left', left: 'right', up: 'down', down: 'up' };
const SIDEWAYS = { right: ['up', 'down'], left: ['up', 'down'], up: ['left', 'right'], down: ['left', 'right'] };
const PLACE = { right: 'to the right of', left: 'to the left of', up: 'above', down: 'below' };
const PLACE_WORD = { right: 'To the right', left: 'To the left', up: 'Above', down: 'Below' };
const WAY_MODES = { 1: ['to', 'where'], 2: ['to', 'from', 'where', 'steps'], 3: ['to', 'from', 'steps', 'steps'] };
const COLS = 5;
const ROWS = 2;
const ROW_NAME = ['top row', 'bottom row'];
const arrowCard = dir => ({ kind: 'v3-pp1-pos-arrows', w: 110, h: 110, dir, tag: dir, description: `An arrow pointing ${dir}.` });
const dirBetween = (from, to) => Object.keys(DIRS).find(dir => DIRS[dir][0] === Math.sign(to[0] - from[0]) && DIRS[dir][1] === Math.sign(to[1] - from[1]));

function draftWay(grade, level, r) {
  const mode = r.pick(WAY_MODES[level]);
  const dir = mode === 'steps' ? r.pick(['left', 'right']) : r.pick(Object.keys(DIRS));
  const k = mode === 'steps' ? r.int(2, level === 2 ? 3 : 4) : level === 1 || !DIRS[dir][0] ? 1 : r.int(2, 4);
  const [dx, dy] = DIRS[dir].map(step => step * k);
  const spots = [];
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) if (col + dx >= 0 && col + dx < COLS && row + dy >= 0 && row + dy < ROWS) spots.push([col, row]);
  }
  const rover = r.pick(spots);
  const flag = [rover[0] + dx, rover[1] + dy];
  let answer;
  let choices;
  let prompt;
  let hint;
  let explanation;
  if (mode === 'steps') {
    answer = String(k);
    prompt = say(r, ['How many steps to the flag?', 'How many steps does the rover take to reach the flag?', 'Count the steps from the rover to the flag.']);
    hint = 'Move one square at a time. Count each step you take.';
    explanation = `The flag is ${k} squares ${PLACE[dir]} the rover, so the rover takes ${k} steps.`;
    const wrongs = spreadWrongs(r, k, [k + 1, k - 1, k + 2, k - 2].map(n => ({ n, code: 'pp1-way-count' })), { min: 1, max: 6 });
    choices = answerChoices(answer, wrongs, choiceCount(grade), null, KNOWN);
  } else if (mode === 'where') {
    answer = PLACE_WORD[dir];
    prompt = say(r, ['Where is the flag, from the rover?', 'Where is the flag? Start at the rover.', 'Tell where the flag is, from the rover.']);
    hint = 'Stand on the rover. Is the flag up, down, left or right?';
    explanation = `The flag is ${PLACE[dir]} the rover.`;
    const wrongs = [[OPPOSITE[dir], 'pp1-way-opposite'], ...SIDEWAYS[dir].map(side => [side, 'pp1-way-turn'])];
    choices = answerChoices(answer, r.shuffle(wrongs).slice(0, choiceCount(grade) - 1).map(([side, code]) => wrong(PLACE_WORD[side], code)), choiceCount(grade), null, KNOWN);
  } else {
    const way = mode === 'to' ? dir : OPPOSITE[dir];
    const right = arrowCard(way);
    answer = right.tag;
    const wrongs = r.shuffle([[OPPOSITE[way], 'pp1-way-opposite'], [SIDEWAYS[way][0], 'pp1-way-turn'], [SIDEWAYS[way][1], 'pp1-way-turn']]).map(([one, code]) => [arrowCard(one), code]);
    prompt = say(r, mode === 'to'
      ? ['Which way to the flag?', 'Which way should the rover go?', 'Which arrow leads to the flag?', 'Show the way to the flag.']
      : ['Which way from the flag to the rover?', 'Which arrow goes from the flag to the rover?', 'Start at the flag. Which way to the rover?']);
    hint = mode === 'to' ? 'Look at where the flag is. Pick the arrow that points there.' : 'Start at the flag. Which way is the rover?';
    explanation = mode === 'to' ? `The flag is ${PLACE[way]} the rover, so go ${way}.` : `The rover is ${PLACE[way]} the flag, so go ${way}.`;
    choices = answerChoices(answer, wrongs.map(([visual, code]) => wrong(visual.tag, code, visual)), choiceCount(grade), right, KNOWN);
  }
  const where = ([col, row]) => `the ${ROW_NAME[row]}, square ${col + 1} from the left`;
  return build({
    family: 'pp1-pos-way', prompt, answer, hint, explanation,
    givens: { mode },
    visual: { kind: 'v3-pp1-pos-grid', rover, flag, description: `A grid of squares. The rover is in ${where(rover)}. The flag is in ${where(flag)}.` },
    choices,
  });
}
function solveWay(question) {
  const { rover, flag } = question.visual;
  const { mode } = question.proof.givens;
  const dir = dirBetween(rover, flag);
  if (mode === 'steps') {
    if (rover[1] !== flag[1]) throw new Error('The flag is not in the rover row.');
    return String(Math.abs(flag[0] - rover[0]));
  }
  if (mode === 'where') return PLACE_WORD[dir];
  checkTags(question);
  const need = mode === 'from' ? OPPOSITE[dir] : dir;
  return pickOption(question, visual => visual.dir === need);
}
function gridPicture(v) {
  const x0 = 45;
  const y0 = 13;
  const parts = [plate('mint', 400, 150)];
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) parts.push(`<rect x="${x0 + col * 62 + 2}" y="${y0 + row * 62 + 2}" width="58" height="58" rx="10" fill="#f6f8fc" stroke="#8d98af" stroke-width="3"/>`);
  }
  const centre = ([col, row]) => [x0 + col * 62 + 31, y0 + row * 62 + 31];
  parts.push(put('flag', ...centre(v.flag), 48), put('rover', ...centre(v.rover), 48));
  return svg(parts.join(''), v.description, 400, 150);
}

// ---- 7. Swap: two neighbours trade places. Who is first, in the middle or last now? ----
function draftSwap(grade, level, r) {
  const things = distinctKinds(r, 3, WHO);
  const at = r.int(0, 1);
  const ask = r.pick(at === 0 ? ['first', 'middle'] : ['middle', 'last']);
  const index = { first: 0, middle: 1, last: 2 }[ask];
  const after = [...things];
  [after[at], after[at + 1]] = [after[at + 1], after[at]];
  const where = { first: 'first', middle: 'in the middle', last: 'last' }[ask];
  return build({
    family: 'pp1-pos-swap',
    prompt: say(r, [`The 2 with arrows swap. Which one is ${where} now?`, `The arrows swap 2 things. Which one is ${where} now?`, `After the swap, which one is ${where}?`]),
    answer: name(after[index]), hint: 'The 2 with arrows trade places. Picture it, then look again.',
    explanation: `The ${name(things[at])} and the ${name(things[at + 1])} swap. Now: ${after.map(name).join(', ')}. The ${name(after[index])} is ${where}.`,
    givens: { ask },
    visual: {
      kind: 'v3-pp1-pos-swap', things, at,
      description: `3 things in a row: ${listText(things.map(withA))}. 2 arrows between the ${name(things[at])} and the ${name(things[at + 1])} show they swap places.`,
    },
    choices: whoChoices(grade, after[index], [[things[index], 'pp1-swap-before'], [things[at === 0 ? 2 : 0], 'pp1-swap-other']]),
  });
}
function solveSwap(question) {
  const { things, at } = question.visual;
  const after = [...things];
  [after[at], after[at + 1]] = [after[at + 1], after[at]];
  return pickWho(question, after[{ first: 0, middle: 1, last: 2 }[question.proof.givens.ask]]);
}
function swapPicture(v) {
  const xs = [72, 200, 328];
  const mid = (xs[v.at] + xs[v.at + 1]) / 2;
  const parts = [plate('lavender', 400, 150)];
  v.things.forEach((thing, index) => parts.push(put(thing, xs[index], 79, 56)));
  parts.push(arrow(mid, 63, 40, 'right', ORANGE), arrow(mid, 95, 40, 'left', HUES.blue));
  return svg(parts.join(''), v.description, 400, 150);
}

const DEFS = {
  'pp1-pos-stack': { skill: 'position', title: 'Shelf places: top, middle and bottom', draft: draftStack, solve: solveStack },
  'pp1-pos-race': { skill: 'position', title: 'Race places: first, second and last', draft: draftRace, solve: solveRace },
  'pp1-pos-row': { skill: 'position', title: 'Next to, between and counting along a row', draft: draftRow, solve: solveRow },
  'pp1-pos-scene': { skill: 'position', title: 'Pick the picture that matches the place words', draft: draftScene, solve: solveScene },
  'pp1-pos-words': { skill: 'position', title: 'Say where it is, or what is there', draft: draftWords, solve: solveWords },
  'pp1-pos-way': { skill: 'routes', title: 'Which arrow takes the rover to the flag', draft: draftWay, solve: solveWay },
  'pp1-pos-swap': { skill: 'position', title: 'Two things swap places', draft: draftSwap, solve: solveSwap },
};
export const FAMILIES = Object.fromEntries(Object.entries(DEFS).map(([id, def]) => [id, { skill: def.skill, title: def.title }]));
export const draft = (family, grade, level, r) => DEFS[family].draft(grade, level, r);
export const solve = question => DEFS[question.family].solve(question);

const RENDER = {
  'v3-pp1-pos-card': v => svg(frame(drawItems(v.items), v.w, v.h), v.description, v.w, v.h),
  'v3-pp1-pos-scene': v => svg(frame(sceneArt(v.landmark, v.thing, v.rel, v.mirror, 1, 0, 0)), v.description, 110, 110),
  'v3-pp1-pos-arrows': v => svg(frame(arrow(55, 55, 74, v.dir)), v.description, 110, 110),
  'v3-pp1-pos-stack': stackPicture,
  'v3-pp1-pos-race': racePicture,
  'v3-pp1-pos-row': rowPicture,
  'v3-pp1-pos-big': v => svg(plate('sunny', 280, 216) + sceneArt(v.landmark, v.thing, v.rel, v.mirror, 1.9, 35.5, 3), v.description, 280, 216),
  'v3-pp1-pos-grid': gridPicture,
  'v3-pp1-pos-swap': swapPicture,
};
export const render = visual => RENDER[visual.kind]?.(visual) ?? null;
