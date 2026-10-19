// PP1 places and shapes, matched to real pre-primary papers: before and after along an arrow, floors above and below,
// inside and outside a box, the left and right side of a fence, and naming flat shapes.
import { MISCONCEPTIONS as SHARED, answerChoices, choiceCount } from './bank-shared.mjs';
import { ORANGE } from './diagram-kit.mjs';
import {
  COST, HUES, INK, QuestionRetry, THINGS, arrow, build, distinctKinds, listText, moonGround, n1, pickOption, plate, put, say, scatterPoints,
  shapeSvg, spreadWrongs, svg, thingWord, wrong,
} from './bank3-pp1-art.mjs';
import { checkTags, name, thingCard } from './bank3-pp1-cards.mjs';

export const MISCONCEPTIONS = {
  'pp1-line-flip': { title: 'Follow the arrow', message: 'That one is on the other side. Before and after follow the way the arrow points.' },
  'pp1-line-far': { title: 'Right next to it', message: 'That one is farther away. Find the one right beside it.' },
  'pp1-line-same': { title: 'A different one', message: 'That is the one named in the question. Find its neighbour.' },
  'pp1-floor-flip': { title: 'Above or below?', message: 'Above is higher up. Below is lower down. Check which one is asked.' },
  'pp1-floor-far': { title: 'The very next floor', message: 'That one is farther away. Find the floor right next to it.' },
  'pp1-floor-same': { title: 'A different floor', message: 'That is the one named in the question. Look at its neighbour.' },
  'pp1-zone-flip': { title: 'The other place', message: 'That is the other place. Check where the question asks to count.' },
  'pp1-zone-all': { title: 'Count one place only', message: 'That counts every one. Count only the ones in the place asked.' },
  'pp1-zone-decoy': { title: 'Count only one kind', message: 'That counts other things too. Count only the kind the question names.' },
  'pp1-zone-off': { title: 'Touch each one once', message: 'Touch each one one time as you count. Do not skip or repeat any.' },
  'pp1-shape-alike': { title: 'Look at the sides', message: 'That shape looks a bit alike. Count the sides and check how they are shaped.' },
  'pp1-shape-other': { title: 'Look at the whole shape', message: 'That is a different shape. Look at the sides and corners.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

const WHO = ['star', 'planet', 'rocket', 'rover', 'alien', 'astro', 'otter', 'ufo', 'comet', 'crate', 'fuel', 'flag', 'crystal', 'satellite'];
const card = thing => thingCard('v3-pp1-pos-card', thing);
const whoChoices = (grade, answer, wrongs) => answerChoices(
  name(answer), wrongs.map(([thing, code]) => wrong(name(thing), code, card(thing))), choiceCount(grade), card(answer), KNOWN,
);
const pickWho = (question, thing) => {
  checkTags(question);
  return pickOption(question, visual => visual.items[0][0] === thing);
};
const counted = (n, key) => `${n} ${thingWord(key, n)}`;
const there = (n, key) => `There ${n === 1 ? 'is' : 'are'} ${counted(n, key)}`;
const verb = (n, extra) => (n === 1 && !extra ? 'is' : 'are');

// Picks the two wrong neighbours: the flipped one first, then the named one, then the rest.
function wrongPool(r, things, answerAt, anchorAt, flipAt, codes) {
  const pool = [];
  if (flipAt >= 0 && flipAt < things.length && flipAt !== answerAt) pool.push([things[flipAt], codes.flip]);
  pool.push([things[anchorAt], codes.same]);
  things.forEach((thing, index) => {
    if (![answerAt, anchorAt, flipAt].includes(index)) pool.push([thing, codes.far]);
  });
  const first = pool.slice(0, 1);
  return [...first, ...r.shuffle(pool.slice(1))].slice(0, 2);
}

// ---- 1. Follow the arrow: what comes before or after? ----
function draftLine(grade, level, r) {
  const count = level === 1 ? 3 : level === 2 ? 4 : 5;
  const things = distinctKinds(r, count, WHO);
  const dir = level === 1 ? 'right' : r.pick(['right', 'left']);
  const ask = r.pick(['after', 'before']);
  const step = (ask === 'after' ? 1 : -1) * (dir === 'right' ? 1 : -1);
  const anchors = things.map((_, index) => index).filter(index => index + step >= 0 && index + step < count);
  const anchorAt = r.pick(anchors);
  const answerAt = anchorAt + step;
  const x = name(things[anchorAt]);
  const stems = ask === 'after'
    ? [`Follow the arrow. What comes after the ${x}?`, `Follow the arrow. What is just after the ${x}?`]
    : [`Follow the arrow. What comes before the ${x}?`, `Follow the arrow. What is just before the ${x}?`];
  const side = dir === 'right' ? 'right' : 'left';
  return build({
    family: 'pp1-pos-line', prompt: say(r, stems), answer: name(things[answerAt]),
    hint: ask === 'after' ? 'After means the next one along the arrow.' : 'Before means the one just earlier along the arrow.',
    explanation: `The arrow points ${side}, so the ${name(things[answerAt])} comes ${ask} the ${x}.`,
    givens: { ask, anchor: things[anchorAt] },
    visual: {
      kind: 'v3-pp1-pos-line', things, dir,
      description: `A row of things from left to right: ${listText(things.map(thing => `the ${name(thing)}`))}. A big arrow above them points ${side}.`,
    },
    choices: whoChoices(grade, things[answerAt], wrongPool(r, things, answerAt, anchorAt, anchorAt - step, { flip: 'pp1-line-flip', same: 'pp1-line-same', far: 'pp1-line-far' })),
  });
}
function solveLine(question) {
  const { things, dir } = question.visual;
  const { ask, anchor } = question.proof.givens;
  const step = (ask === 'after' ? 1 : -1) * (dir === 'right' ? 1 : -1);
  return pickWho(question, things[things.indexOf(anchor) + step]);
}
function linePicture(v) {
  const count = v.things.length;
  const slot = 440 / count;
  const size = Math.min(84, Math.floor(slot) - 8);
  const parts = [plate('sunny', 480, 190), moonGround(480, 190, 148), arrow(240, 34, 74, v.dir, ORANGE)];
  v.things.forEach((thing, index) => parts.push(put(thing, n1(20 + slot * (index + 0.5)), 106, size)));
  return svg(parts.join(''), v.description, 480, 190);
}

// ---- 2. Floors: who lives above, below or between? ----
function draftFloors(grade, level, r) {
  const floors = distinctKinds(r, 4, WHO);
  const ask = level === 1 ? r.pick(['above', 'below']) : r.pick(['above', 'below', 'between']);
  const codes = { flip: 'pp1-floor-flip', same: 'pp1-floor-same', far: 'pp1-floor-far' };
  const visual = {
    kind: 'v3-pp1-pos-floors', floors,
    description: `A tower with 4 floors. From the top floor down: ${listText(floors.map(thing => `the ${name(thing)}`))}.`,
  };
  if (ask === 'between') {
    const top = r.int(0, 1);
    const answerAt = top + 1;
    const [a, b] = [floors[top], floors[top + 2]];
    return build({
      family: 'pp1-pos-floors', prompt: say(r, [`Which one is between the ${name(a)} and the ${name(b)}?`, `What is on the floor between the ${name(a)} and the ${name(b)}?`]), answer: name(floors[answerAt]),
      hint: 'Between means in the middle. Look at the floor in the middle.', explanation: `The ${name(floors[answerAt])} is on the floor between them.`,
      givens: { ask, top }, visual,
      choices: whoChoices(grade, floors[answerAt], [[a, codes.same], [b, codes.same]]),
    });
  }
  const step = ask === 'above' ? -1 : 1;
  const anchorAt = r.pick(floors.map((_, index) => index).filter(index => index + step >= 0 && index + step < 4));
  const answerAt = anchorAt + step;
  const x = name(floors[anchorAt]);
  const stems = ask === 'above'
    ? [`Which one is on the floor above the ${x}?`, `Which one is just above the ${x}?`]
    : [`Which one is on the floor below the ${x}?`, `Which one is just below the ${x}?`];
  return build({
    family: 'pp1-pos-floors', prompt: say(r, stems), answer: name(floors[answerAt]),
    hint: ask === 'above' ? 'Above means higher up. Look at the floor over it.' : 'Below means lower down. Look at the floor under it.',
    explanation: `The ${name(floors[answerAt])} is just ${ask} the ${x}.`,
    givens: { ask, anchor: floors[anchorAt] }, visual,
    choices: whoChoices(grade, floors[answerAt], wrongPool(r, floors, answerAt, anchorAt, anchorAt - step, codes)),
  });
}
function solveFloors(question) {
  const { floors } = question.visual;
  const { ask, anchor, top } = question.proof.givens;
  if (ask === 'between') return pickWho(question, floors[top + 1]);
  return pickWho(question, floors[floors.indexOf(anchor) + (ask === 'above' ? -1 : 1)]);
}
function floorsPicture(v) {
  const parts = [plate('sky', 400, 280), `<path d="M62 52L200 10L338 52Z" fill="#c9674f" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`];
  v.floors.forEach((thing, index) => {
    const y = 52 + index * 56;
    parts.push(`<rect x="62" y="${y}" width="276" height="56" fill="#fff6dc" stroke="${INK}" stroke-width="4"/><rect x="166" y="${y + 6}" width="68" height="44" rx="8" fill="#cfe6fb" stroke="${INK}" stroke-width="3"/>`, put(thing, 200, y + 28, 40));
  });
  return svg(parts.join(''), v.description, 400, 280);
}

// ---- 3 and 4. Count one kind inside or outside a box, or on the left or right side of a fence. ----
const ZONE_KINDS = ['star', 'rock', 'fuel', 'flag', 'alien', 'crystal', 'crate', 'rocket', 'otter', 'astro', 'comet', 'ufo'];
const BOX = { x: 150, y: 30, w: 180, h: 180 };
const ZONES = {
  inside: { a: [{ x: BOX.x + 8, y: BOX.y + 8, w: BOX.w - 16, h: BOX.h - 16 }], b: [{ x: 12, y: 14, w: 126, h: 212 }, { x: 342, y: 14, w: 126, h: 212 }], words: ['inside', 'outside'] },
  side: { a: [{ x: 12, y: 14, w: 218, h: 212 }], b: [{ x: 250, y: 14, w: 218, h: 212 }], words: ['on the left side', 'on the right side'] },
};
function draftZone(mode) {
  return (grade, level, r) => {
    const zone = ZONES[mode];
    const [target, decoy] = distinctKinds(r, 2, ZONE_KINDS);
    const askA = r.int(0, 1) === 0;
    const lo = level === 1 ? 1 : 2;
    const counts = { a: r.int(lo, level === 1 ? 4 : 5), b: r.int(level === 1 ? 1 : 2, level === 1 ? 3 : 5) };
    const decoys = { a: level === 1 ? 0 : r.int(0, 3), b: level === 1 ? 0 : r.int(1, 3) };
    if (level === 3) {
      counts.a += 1;
      decoys.a += 1;
    }
    const total = counts.a + counts.b + decoys.a + decoys.b;
    const weight = (counts.a + counts.b) * COST[target] + (decoys.a + decoys.b) * COST[decoy];
    if (total > 13 || weight > 12500 || (mode === 'inside' && (counts.b + decoys.b > 10 || counts.a + decoys.a > 6))) throw new QuestionRetry('The scene would be too crowded.');
    const size = total <= 8 ? 44 : 38;
    const items = [];
    for (const side of ['a', 'b']) {
      const parts = side === 'a' ? zone.a : zone.b;
      const list = [...Array(counts[side]).fill(target), ...Array(decoys[side]).fill(decoy)];
      const share = parts.map(() => []);
      r.shuffle(list).forEach((kind, index) => share[parts.length === 1 ? 0 : index % parts.length].push(kind));
      parts.forEach((box, index) => {
        scatterPoints(r, share[index].length, { ...box, size, gap: 6 }).forEach((point, k) => items.push([share[index][k], point.x, point.y]));
      });
    }
    const where = zone.words[askA ? 0 : 1];
    const answer = askA ? counts.a : counts.b;
    const many = THINGS[target].many;
    const stems = mode === 'inside'
      ? [`How many ${many} are ${where} the box?`, `Count the ${many} ${where} the box.`]
      : [`How many ${many} are ${where}?`, `Count the ${many} ${where}.`];
    const other = askA ? counts.b : counts.a;
    const here = askA ? decoys.a : decoys.b;
    return build({
      family: mode === 'inside' ? 'pp1-pos-inside' : 'pp1-pos-side', prompt: say(r, stems), answer,
      hint: `Count only the ${many}. Look ${mode === 'inside' ? `${where} the box` : where}.`,
      explanation: `${there(answer, target)} ${mode === 'inside' ? `${where} the box` : where}.`,
      givens: { mode, kind: target, askA },
      visual: {
        kind: 'v3-pp1-pos-zone', mode, size, items,
        description: mode === 'inside'
          ? `A box in the middle with ${counted(counts.a, target)}${decoys.a ? ` and ${counted(decoys.a, decoy)}` : ''} inside. Outside the box ${verb(counts.b, decoys.b)} ${counted(counts.b, target)}${decoys.b ? ` and ${counted(decoys.b, decoy)}` : ''}.`
          : `A fence down the middle. On the left side ${verb(counts.a, decoys.a)} ${counted(counts.a, target)}${decoys.a ? ` and ${counted(decoys.a, decoy)}` : ''}. On the right side ${verb(counts.b, decoys.b)} ${counted(counts.b, target)}${decoys.b ? ` and ${counted(decoys.b, decoy)}` : ''}.`,
      },
      choices: answerChoices(String(answer), spreadWrongs(r, answer, [
        { n: other, code: 'pp1-zone-flip' }, ...(here ? [{ n: answer + here, code: 'pp1-zone-decoy' }] : []), { n: counts.a + counts.b, code: 'pp1-zone-all' },
        { n: answer + 1, code: 'pp1-zone-off' }, { n: answer - 1, code: 'pp1-zone-off' }, { n: answer + 2, code: 'pp1-zone-off' },
      ], { min: 0, max: 14 }), choiceCount(grade), null, KNOWN),
    });
  };
}
function solveZone(question) {
  const { visual } = question;
  const { mode, kind, askA } = question.proof.givens;
  const inA = mode === 'inside'
    ? ([, x, y]) => x > BOX.x && x < BOX.x + BOX.w && y > BOX.y && y < BOX.y + BOX.h
    : ([, x]) => x < 240;
  return String(visual.items.filter(item => item[0] === kind && inA(item) === askA).length);
}
function zonePicture(v) {
  const parts = [plate('night', 480, 240, { stars: 5 })];
  if (v.mode === 'inside') parts.push(`<rect x="${BOX.x}" y="${BOX.y}" width="${BOX.w}" height="${BOX.h}" rx="14" fill="#e8e1fa" stroke="${INK}" stroke-width="5"/>`);
  else {
    parts.push(`<rect x="236" y="10" width="8" height="220" rx="4" fill="#c89a62" stroke="${INK}" stroke-width="3"/>`);
    [34, 96, 158, 210].forEach(y => parts.push(`<rect x="226" y="${y - 6}" width="28" height="12" rx="4" fill="#d9ad74" stroke="${INK}" stroke-width="2.5"/>`));
  }
  v.items.forEach(([kind, x, y]) => parts.push(put(kind, x, y, v.size)));
  return svg(parts.join(''), v.description, 480, 240);
}

// ---- 5. Name the flat shape. ----
const SHAPE_SETS = { 1: ['circle', 'square', 'triangle', 'star'], 2: ['circle', 'square', 'triangle', 'star', 'rectangle', 'heart', 'oval'], 3: ['circle', 'square', 'triangle', 'star', 'rectangle', 'heart', 'oval', 'diamond'] };
const ALIKE = { circle: ['oval'], oval: ['circle'], square: [], rectangle: [], diamond: [], triangle: [], star: [], heart: [] };
// A square is also a rectangle and a tilted square is a diamond, so these never share an option set.
const OVERLAP = { square: ['rectangle', 'diamond'], rectangle: ['square'], diamond: ['square'] };
const SHAPE_SIZE = { circle: [112, 112], oval: [150, 100], square: [102, 102], rectangle: [152, 92], triangle: [130, 112], star: [132, 132], heart: [124, 112], diamond: [108, 132], hexagon: [128, 116], pentagon: [122, 118] };
const COLOURS = ['red', 'blue', 'green', 'orange', 'purple', 'teal', 'pink', 'yellow'];
function draftShapeName(grade, level, r) {
  const pool = SHAPE_SETS[level];
  const shape = r.pick(pool);
  const colour = r.pick(COLOURS);
  const alike = ALIKE[shape].filter(other => pool.includes(other));
  const others = [];
  for (const other of r.shuffle(pool.filter(item => item !== shape && !alike.includes(item) && !(OVERLAP[shape] ?? []).includes(item)))) {
    if (!others.some(kept => (OVERLAP[kept] ?? []).includes(other))) others.push(other);
  }
  const wrongs = [...alike.map(other => wrong(other, 'pp1-shape-alike')), ...others.map(other => wrong(other, 'pp1-shape-other'))];
  const article = /^[aeiou]/.test(shape) ? 'an' : 'a';
  return build({
    family: 'pp1-shape-name', prompt: say(r, [`What shape is this ${colour} one?`, `Which name fits this ${colour} shape?`, `Name the ${colour} shape.`]), answer: shape,
    hint: 'Count the sides and corners. Look for round parts.', explanation: `The ${colour} shape is ${article} ${shape}.`,
    givens: { shape }, visual: { kind: 'v3-pp1-shape-big', shape, hue: colour, description: `A big ${colour} shape on a card.` },
    choices: answerChoices(shape, [...wrongs.slice(0, 1), ...r.shuffle(wrongs.slice(1))].slice(0, 2), choiceCount(grade), null, KNOWN),
  });
}
const solveShapeName = question => question.visual.shape;

const DEFS = {
  'pp1-pos-line': { skill: 'position', title: 'Follow the arrow: before and after', draft: draftLine, solve: solveLine },
  'pp1-pos-floors': { skill: 'position', title: 'Tower floors: above, below and between', draft: draftFloors, solve: solveFloors },
  'pp1-pos-inside': { skill: 'position', title: 'Count the ones inside or outside', draft: draftZone('inside'), solve: solveZone },
  'pp1-pos-side': { skill: 'position', title: 'Count the left side or right side', draft: draftZone('side'), solve: solveZone },
  'pp1-shape-name': { skill: 'shape', title: 'Name the flat shape', draft: draftShapeName, solve: solveShapeName },
};
export const FAMILIES = Object.fromEntries(Object.entries(DEFS).map(([id, def]) => [id, { skill: def.skill, title: def.title }]));
export const draft = (family, grade, level, r) => DEFS[family].draft(grade, level, r);
export const solve = question => DEFS[question.family].solve(question);

const RENDER = {
  'v3-pp1-pos-line': linePicture,
  'v3-pp1-pos-floors': floorsPicture,
  'v3-pp1-pos-zone': zonePicture,
  'v3-pp1-shape-big': v => {
    const [w, h] = SHAPE_SIZE[v.shape];
    return svg(plate('lavender', 280, 200) + shapeSvg(v.shape, 140, 100, w, h, { fill: HUES[v.hue] }), v.description, 280, 200);
  },
};
export const render = visual => RENDER[visual.kind]?.(visual) ?? null;
