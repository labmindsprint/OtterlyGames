// PP1 chapter: More or fewer? Six comparing games: two trays, most and fewest, the see-saw, jars of water, how many more, and the same number.
import { MISCONCEPTIONS as SHARED, answerChoices, choiceCount } from './bank-shared.mjs';
import {
  COST, HUES, INK, PAPER, QuestionRetry, THINGS, TOKENS, build, darker, distinctKinds, lighter, moonGround, n1, pickOption, plate, put, say,
  scatterPoints, spreadWrongs, svg, thingWord, token, wrong,
} from './bank3-pp1-art.mjs';
import { cap, checkTags, frame, name, withA } from './bank3-pp1-cards.mjs';

export const MISCONCEPTIONS = {
  'pp1-more-flip': { title: 'More or fewer', message: 'More is the bigger number. Fewer is the smaller number. Count both groups.' },
  'pp1-more-same': { title: 'Not the same number', message: 'The two groups have different numbers. Count each group.' },
  'pp1-more-looks': { title: 'Count, do not guess', message: 'A group can look big and still have fewer. Count each group.' },
  'pp1-extreme-flip': { title: 'The other end', message: 'That one is the opposite. Check what the question asks for.' },
  'pp1-extreme-next': { title: 'Look at all three', message: 'That one is in the middle. Compare all three to find the one at the end.' },
  'pp1-extreme-looks': { title: 'Size can trick you', message: 'Big things can be fewer. Count each card, do not judge by size.' },
  'pp1-seesaw-high': { title: 'Heavy goes down', message: 'The heavier side goes down. The lighter side goes up.' },
  'pp1-seesaw-same': { title: 'It is not level', message: 'The see-saw tips, so the two things do not weigh the same.' },
  'pp1-seesaw-big': { title: 'Big is not heavy', message: 'Big things can be light. Look at which side of the see-saw is down.' },
  'pp1-seesaw-level': { title: 'A level see-saw', message: 'A level see-saw means both sides weigh the same.' },
  'pp1-jar-flip': { title: 'More or less', message: 'That jar is the other way round. Check if it asks for more or less.' },
  'pp1-jar-same': { title: 'Same is not different', message: 'That jar has the same water as this jar. Find a different one.' },
  'pp1-jar-near': { title: 'Match the water line', message: 'That jar has a different amount of water. Check the water line again.' },
  'pp1-equal-total': { title: 'That counts them all', message: 'That is how many are in the bigger group. Count only the ones missing.' },
  'pp1-equal-have': { title: 'Count the missing ones', message: 'That is how many are already there. Count only the ones still missing.' },
  'pp1-equal-off': { title: 'Pair them one by one', message: 'Pair each one with a partner. Count the ones left without a partner.' },
  'pp1-same-equal': { title: 'That card is the same', message: 'That card has the same number as this one. Find one more or one fewer.' },
  'pp1-same-flip': { title: 'Other way round', message: 'One more is a bigger number. One fewer is a smaller number.' },
  'pp1-same-near': { title: 'Close, but not the same', message: 'That card is off by one. Count each card and match the number.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

const range = count => Array.from({ length: count }, (_, index) => index);
const counted = (n, key) => `${n} ${thingWord(key, n)}`;
const many = key => THINGS[key].many;
const plural = key => cap(many(key));
const pairs = points => points.map(point => [point.x, point.y]);
const choices = (grade, answer, wrongs, answerVisual = null) => answerChoices(answer, wrongs, choiceCount(grade), answerVisual, KNOWN);
const hueOf = (r, pool) => r.pick(pool);
const HUE_POOL = [HUES.red, HUES.blue, HUES.green, HUES.orange, HUES.purple, HUES.teal];
const CARD = { w: 110, h: 110 };

// Things in tidy rows, each row centred in the box. Returns centres.
const perRowFor = count => (count <= 3 ? count : Math.ceil(count / 2));
function fitSize(count, w, h, gap, max) {
  const perRow = perRowFor(count);
  const rows = Math.ceil(count / perRow);
  return Math.min(max, Math.floor((w - (perRow - 1) * gap) / perRow), Math.floor((h - (rows - 1) * gap) / rows));
}
function tidyPoints(count, { x, y, w, h, size, gap }, perRow = perRowFor(count)) {
  const rows = Math.ceil(count / perRow);
  const top = y + (h - (rows * size + (rows - 1) * gap)) / 2 + size / 2;
  return range(count).map(index => {
    const row = Math.floor(index / perRow);
    const inRow = Math.min(perRow, count - row * perRow);
    const left = x + (w - (inRow * size + (inRow - 1) * gap)) / 2 + size / 2;
    return [n1(left + (index % perRow) * (size + gap)), n1(top + row * (size + gap))];
  });
}
const layout = (r, style, count, box, size, gap) => (style === 'tidy' ? tidyPoints(count, { ...box, size, gap }) : pairs(scatterPoints(r, count, { ...box, size, gap })));

// A card of small tokens, tidy or scattered.
const tokenCard = (r, kind, n, style, size = 28) => {
  const box = { x: 7, y: 7, w: 96, h: 96 };
  const tidy = style === 'tidy' && n <= 6;
  const each = tidy ? fitSize(n, 96, 96, 4, 34) : size;
  const tag = counted(n, kind);
  return {
    kind: 'v3-pp1-cmp-tokens', ...CARD, token: kind, size: each, pts: tidy ? tidyPoints(n, { ...box, size: each, gap: 4 }) : pairs(scatterPoints(r, n, { ...box, size: each, gap: 2 })),
    tag, description: `A card with ${tag}.`,
  };
};

// ---- 1. Two trays: more or fewer? ----
const SAME = 'Same number';
const RICH = ['star', 'rock', 'fuel', 'flag', 'alien', 'crystal', 'coin', 'crate', 'astro', 'rocket'];
const TRAY_BOX = index => ({ x: 18 + index * 240, y: 18, w: 204, h: 180 });

function draftMore(grade, level, r) {
  const rich = level === 1;
  const kinds = rich ? distinctKinds(r, 2, RICH) : r.shuffle(TOKENS).slice(0, 2);
  const top = [0, 5, 8, 10][level];
  const low = [0, 1, 2, 3][level];
  const minGap = level === 1 ? 2 : 1;
  const equal = r.int(1, 5) === 1;
  const small = r.int(low, top - (equal ? 0 : minGap));
  const big = equal ? small : small + r.int(minGap, Math.min(top - small, level === 3 ? 3 : 4));
  const counts = r.int(0, 1) === 1 ? [big, small] : [small, big];
  if (rich && counts[0] * COST[kinds[0]] + counts[1] * COST[kinds[1]] > 13500) throw new QuestionRetry('The trays would be too crowded.');
  let sizes;
  if (level === 1) sizes = [fitSize(big, 204, 180, 12, 56), fitSize(big, 204, 180, 12, 56)];
  else if (level === 2) sizes = [36, 36];
  else sizes = counts[0] < counts[1] || (equal && r.int(0, 1) === 1) ? [40, 26] : [26, 40];
  const gap = level === 1 ? 12 : 6;
  const groups = [0, 1].map(index => ({
    kind: kinds[index], size: sizes[index], pts: layout(r, level === 1 ? 'tidy' : 'scatter', counts[index], TRAY_BOX(index), sizes[index], gap),
  }));
  const ask = r.pick(level === 1 ? ['more', 'more', 'fewer'] : ['more', 'fewer']);
  const [a, b] = kinds;
  const higher = counts[0] > counts[1] ? 0 : 1;
  const target = ask === 'more' ? higher : 1 - higher;
  const trapped = level === 3 && !equal;
  const answer = equal ? SAME : plural(kinds[target]);
  const wrongs = equal
    ? [wrong(plural(a), 'pp1-more-looks'), wrong(plural(b), 'pp1-more-looks')]
    : [wrong(plural(kinds[1 - target]), trapped ? 'pp1-more-looks' : 'pp1-more-flip'), wrong(SAME, 'pp1-more-same')];
  const stems = ask === 'more'
    ? [`Are there more ${many(a)} or more ${many(b)}?`, `Which group has more, ${many(a)} or ${many(b)}?`, `Count both groups. Are there more ${many(a)} or ${many(b)}?`]
    : [`Are there fewer ${many(a)} or fewer ${many(b)}?`, `Which group has fewer, ${many(a)} or ${many(b)}?`, `Count both groups. Are there fewer ${many(a)} or ${many(b)}?`];
  const both = `${counted(counts[0], a)} and ${counted(counts[1], b)}`;
  return build({
    family: 'pp1-cmp-more', prompt: say(r, stems), answer,
    hint: `Count each group. ${ask === 'more' ? 'The bigger number is more.' : 'The smaller number is fewer.'}`,
    explanation: equal ? `You see ${both}. The numbers are the same.` : `You see ${both}. ${plural(kinds[target])} are ${ask}.`,
    givens: { ask },
    visual: {
      kind: 'v3-pp1-cmp-groups', rich, groups,
      description: `2 trays. The left tray has ${counted(counts[0], a)}. The right tray has ${counted(counts[1], b)}.`,
    },
    choices: choices(grade, answer, wrongs),
  });
}
function solveMore(question) {
  const [a, b] = question.visual.groups;
  if (a.pts.length === b.pts.length) return SAME;
  const wantMore = question.proof.givens.ask === 'more';
  return plural((a.pts.length > b.pts.length) === wantMore ? a.kind : b.kind);
}
function groupsPicture(v) {
  const parts = [plate('lavender', 480, 216)];
  v.groups.forEach((group, index) => {
    parts.push(`<rect x="${10 + index * 240}" y="10" width="220" height="196" rx="16" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>`);
    parts.push(...group.pts.map(([x, y]) => (v.rich ? put(group.kind, x, y, group.size) : token(group.kind, x, y, group.size))));
  });
  return svg(parts.join(''), v.description, 480, 216);
}

// ---- 2. Most, fewest, tallest, longest, biggest: three cards, pick the one at the end. ----
const EXTREME_MODES = { 1: ['size', 'tower', 'rope', 'count'], 2: ['tower', 'rope', 'count', 'count', 'size'], 3: ['count', 'count', 'tower', 'rope'] };
const SUPER = { count: ['most', 'fewest'], tower: ['tallest', 'shortest'], rope: ['longest', 'shortest'], size: ['biggest', 'smallest'] };
const BIG_THINGS = ['rocket', 'rover', 'alien', 'astro', 'otter', 'planet', 'crate', 'fuel', 'ufo', 'satellite'];

// Three values from..to, smallest first, at least span apart. The one asked for stands gap clear of the middle one.
function spread3(r, from, to, span, ask, gap) {
  for (let tries = 0; tries < 40; tries++) {
    const lo = r.int(from, to - span);
    const hi = r.int(lo + span, to);
    const mid = r.int(lo + 1, hi - 1);
    if ((ask === 'high' ? hi - mid : mid - lo) >= gap) return [lo, mid, hi];
  }
  throw new QuestionRetry('No three numbers fit that spread.');
}

function countCards(r, level, ask) {
  const kind = r.pick(TOKENS);
  const trap = level === 3 && r.int(0, 1) === 1;
  let values;
  if (trap) {
    const lo = r.int(2, 4);
    const hi = r.int(lo + 3, 9);
    values = [lo, r.int(lo + 1, hi - 1), hi];
  } else if (level === 1) values = spread3(r, 1, 5, 3, ask, 2);
  else if (level === 2) values = spread3(r, 2, 7, 3, ask, 1);
  else values = spread3(r, 3, 9, 2, ask, 1);
  const sizes = trap ? [44, values[1] <= 4 ? 38 : 28, 24] : [30, 30, 30];
  return { trap, values, cards: values.map((n, index) => tokenCard(r, kind, n, level === 1 ? 'tidy' : 'scatter', sizes[index])) };
}
function towerCards(r, level, ask) {
  const values = level === 1 ? spread3(r, 1, 5, 3, ask, 2) : spread3(r, 1, level === 3 ? 6 : 5, 2, ask, 1);
  const hue = hueOf(r, HUE_POOL);
  const words = ['Short', 'Middle', 'Tall'];
  return {
    trap: false, values,
    cards: values.map((blocks, index) => ({ kind: 'v3-pp1-cmp-tower', ...CARD, blocks, hue, tag: `${words[index]} tower`, description: `A tower of ${blocks} ${blocks === 1 ? 'block' : 'blocks'}.` })),
  };
}
function ropeCards(r, level) {
  const base = level === 2 ? r.int(18, 42) : r.int(30, 58);
  const values = level === 1 ? [24, 56, 90] : level === 2 ? [base, base + 24, base + 48] : [base, base + 16, base + 32];
  const hue = hueOf(r, HUE_POOL);
  const words = ['Short', 'Middle', 'Long'];
  return {
    trap: false, values,
    cards: values.map((len, index) => ({ kind: 'v3-pp1-cmp-rope', ...CARD, len, hue, tag: `${words[index]} rope`, description: `A ${words[index].toLowerCase()} rope.` })),
  };
}
function sizeCards(r, level) {
  const thing = r.pick(BIG_THINGS);
  const values = level === 1 ? [30, 58, 88] : [38, 58, 78];
  const words = ['Small', 'Middle', 'Big'];
  return {
    trap: false, values,
    cards: values.map((size, index) => ({
      kind: 'v3-pp1-cmp-size', ...CARD, thing, size, tag: `${words[index]} ${name(thing)}`, description: `A ${words[index].toLowerCase()} ${name(thing)}.`,
    })),
  };
}
const extremeKey = card => card.pts?.length ?? card.blocks ?? card.len ?? card.size;

function draftExtreme(grade, level, r) {
  const mode = r.pick(EXTREME_MODES[level]);
  const ask = r.pick(['high', 'low']);
  const { cards, trap, values } = { count: countCards, tower: towerCards, rope: ropeCards, size: sizeCards }[mode](r, level, ask);
  const word = SUPER[mode][ask === 'high' ? 0 : 1];
  const [fewest, middle, most] = cards;
  const answer = ask === 'high' ? most : fewest;
  const opposite = ask === 'high' ? fewest : most;
  const noun = mode === 'size' ? name(fewest.thing) : mode === 'count' ? many(fewest.token) : mode;
  const stems = mode === 'count'
    ? [`Which card has the ${word} ${noun}?`, `Find the card with the ${word} ${noun}.`, `Which card shows the ${word} ${noun}?`]
    : [`Which ${noun} is the ${word}?`, `Find the ${word} ${noun}.`, `Touch the ${word} ${noun}.`];
  const hints = {
    count: ['Count each card. Pick the biggest number.', 'Count each card. Pick the smallest number.'],
    tower: ['Look at how high each tower goes.', 'Look for the tower that is the lowest.'],
    rope: ['Look at how far each rope reaches.', 'Look for the rope that is the shortest.'],
    size: ['Look at how big each one is.', 'Look for the one that is the smallest.'],
  }[mode][ask === 'high' ? 0 : 1];
  return build({
    family: 'pp1-cmp-extreme', prompt: say(r, stems), answer: answer.tag, hint: hints,
    explanation: mode === 'count' ? `That card has ${answer.tag}. That is the ${word}.` : `That ${noun} is the ${word}.`,
    givens: { mode, ask, values, trap },
    choices: choices(grade, answer.tag, [
      wrong(opposite.tag, trap ? 'pp1-extreme-looks' : 'pp1-extreme-flip', opposite),
      wrong(middle.tag, 'pp1-extreme-next', middle),
    ], answer),
  });
}
function solveExtreme(question) {
  const cards = checkTags(question);
  const values = cards.map(extremeKey);
  const target = question.proof.givens.ask === 'high' ? Math.max(...values) : Math.min(...values);
  return pickOption(question, card => extremeKey(card) === target);
}
function towerArt(blocks, hue) {
  const parts = ['<rect x="21" y="95" width="68" height="7" rx="3.5" fill="#98a2b5"/>'];
  for (let index = 0; index < blocks; index++) {
    parts.push(`<rect x="33" y="${95 - 14 * (index + 1)}" width="44" height="14" fill="${index % 2 ? lighter(hue, 0.25) : hue}" stroke="${INK}" stroke-width="2.5"/>`);
  }
  return parts.join('');
}
function ropeArt(len, hue) {
  const twists = [];
  for (let at = 17; at < len - 2; at += 11) twists.push(`<path d="M${at} 48L${at + 6} 62" fill="none" stroke="${darker(hue, 0.3)}" stroke-width="3" stroke-linecap="round"/>`);
  return `<rect x="10" y="46" width="${len}" height="18" rx="9" fill="${hue}" stroke="${INK}" stroke-width="3.5"/>${twists.join('')}`;
}

// ---- 3. See-saw: which side is down is the heavier one. ----
const HEAVY = ['rock', 'crate', 'rover', 'fuel', 'rocket'];
const LIGHT = ['flag', 'coin', 'crystal', 'star'];
const WEIGHT = 'Same weight';
const thingLabel = thing => cap(name(thing));

function draftSeesaw(grade, level, r) {
  const flat = level > 1 && r.int(1, level === 2 ? 7 : 4) === 1;
  let things;
  let down;
  let trap = false;
  if (flat) {
    things = r.shuffle(r.pick([HEAVY, LIGHT])).slice(0, 2);
    down = 'level';
  } else {
    const heavy = r.pick(HEAVY);
    const light = r.pick(LIGHT);
    down = r.pick(['left', 'right']);
    things = down === 'left' ? [heavy, light] : [light, heavy];
    trap = level > 1 && r.int(1, 10) <= (level === 2 ? 4 : 6);
  }
  const sizes = things.map(thing => (trap ? (HEAVY.includes(thing) ? 46 : 74) : 60));
  const ask = r.pick(level === 1 ? ['heavier', 'heavier', 'lighter'] : ['heavier', 'lighter']);
  const lower = down === 'right' ? things[1] : things[0];
  const upper = down === 'right' ? things[0] : things[1];
  const pick = ask === 'heavier' ? lower : upper;
  const [A, B] = things.map(name);
  const answer = flat ? WEIGHT : thingLabel(pick);
  const wrongs = flat
    ? things.map(thing => wrong(thingLabel(thing), 'pp1-seesaw-level'))
    : [wrong(thingLabel(pick === lower ? upper : lower), trap ? 'pp1-seesaw-big' : 'pp1-seesaw-high'), wrong(WEIGHT, 'pp1-seesaw-same')];
  const stems = [`Which is ${ask}, the ${A} or the ${B}?`, `Is the ${A} or the ${B} ${ask}?`, `Which is ${ask} on the see-saw, ${A} or ${B}?`];
  return build({
    family: 'pp1-cmp-seesaw', prompt: say(r, stems), answer,
    hint: flat ? 'Look at the see-saw. Is one side lower?' : ask === 'heavier' ? 'The heavy side goes down. Which side is low?' : 'The light side goes up. Which side is high?',
    explanation: flat ? 'The see-saw is level, so both weigh the same.' : ask === 'heavier' ? `The ${name(lower)} is on the low side, so it is heavier.` : `The ${name(upper)} is on the high side, so it is lighter.`,
    givens: { ask },
    visual: {
      kind: 'v3-pp1-cmp-seesaw', things, sizes, down,
      description: flat
        ? `A level see-saw with ${withA(things[0])} on the left and ${withA(things[1])} on the right.`
        : `A see-saw tipped down on the ${down} side. ${cap(withA(lower))} sits on the low end and ${withA(upper)} sits on the high end.`,
    },
    choices: choices(grade, answer, wrongs),
  });
}
function solveSeesaw(question) {
  const { things, down } = question.visual;
  if (down === 'level') return WEIGHT;
  const lower = down === 'right' ? things[1] : things[0];
  const upper = down === 'right' ? things[0] : things[1];
  return thingLabel(question.proof.givens.ask === 'heavier' ? lower : upper);
}
function seesawPicture(v) {
  const angle = v.down === 'left' ? -12 : v.down === 'right' ? 12 : 0;
  const rad = angle * Math.PI / 180;
  const px = 200;
  const py = 124;
  const parts = [plate('sky', 400, 200), moonGround(400, 200, 170)];
  parts.push(`<path d="M${px - 34} 170L${px} ${py + 6}L${px + 34} 170Z" fill="#e5a73c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`);
  parts.push(`<g transform="rotate(${angle} ${px} ${py})"><rect x="${px - 150}" y="${py - 7}" width="300" height="14" rx="6" fill="#c89a62" stroke="${INK}" stroke-width="4"/></g>`);
  parts.push(`<circle cx="${px}" cy="${py}" r="7" fill="${INK}"/>`);
  v.things.forEach((thing, index) => {
    const side = index === 0 ? -1 : 1;
    parts.push(put(thing, px + side * 138 * Math.cos(rad), py + side * 138 * Math.sin(rad) - 4 - v.sizes[index] / 2, v.sizes[index]));
  });
  return svg(parts.join(''), v.description, 400, 200);
}

// ---- 4. Jars: more, less or the same water as this jar. ----
const jarCard = (level, hue, tag) => ({ kind: 'v3-pp1-cmp-jar', ...CARD, level, hue, tag, description: `A jar with the water at line ${level} of 5.` });

function draftJars(grade, level, r) {
  const ask = r.pick(level === 1 ? ['more', 'less'] : level === 2 ? ['more', 'less', 'same'] : ['more', 'less', 'same', 'plus1', 'minus1']);
  const ref = ask === 'plus1' ? r.int(1, 4) : ask === 'minus1' ? r.int(2, 5) : r.pick(level === 1 ? [2, 3, 3, 4] : [2, 3, 4]);
  const hue = hueOf(r, [HUES.blue, HUES.green, HUES.purple, HUES.orange, HUES.pink, HUES.teal]);
  let target;
  let others;
  if (ask === 'plus1' || ask === 'minus1') {
    const sign = ask === 'plus1' ? 1 : -1;
    target = ref + sign;
    const far = ref + 2 * sign >= 1 && ref + 2 * sign <= 5 ? ref + 2 * sign : ref - sign;
    others = [[ref, 'pp1-jar-same'], [far, 'pp1-jar-near']];
  } else {
    const higher = r.int(ref + 1, 5);
    const lower = r.int(1, ref - 1);
    [target, others] = {
      more: [higher, [[ref, 'pp1-jar-same'], [lower, 'pp1-jar-flip']]],
      less: [lower, [[ref, 'pp1-jar-same'], [higher, 'pp1-jar-flip']]],
      same: [ref, [[higher, 'pp1-jar-near'], [lower, 'pp1-jar-near']]],
    }[ask];
  }
  const tags = r.shuffle(['Jar A', 'Jar B', 'Jar C']);
  const answer = jarCard(target, hue, tags[0]);
  const stems = {
    more: ['Which jar has more water than this one?', 'Find the jar with more water.', 'Which jar is fuller than this one?'],
    less: ['Which jar has less water than this one?', 'Find the jar with less water.', 'Which jar is emptier than this one?'],
    same: ['Which jar has the same water as this one?', 'Find the jar with the same water.', 'Which jar is filled the same as this one?'],
    plus1: ['Which jar has one line more water than this?', 'Find the jar that is one line fuller.', 'Which jar is one line higher than this one?'],
    minus1: ['Which jar has one line less water than this?', 'Find the jar that is one line emptier.', 'Which jar is one line lower than this one?'],
  }[ask];
  return build({
    family: 'pp1-cmp-jars', prompt: say(r, stems), answer: answer.tag,
    hint: {
      more: 'Look at the water line. Higher means more.', less: 'Look at the water line. Lower means less.', same: 'Find the jar with the water at the same line.',
      plus1: 'Count the lines up from the water in this jar.', minus1: 'Count the lines down from the water in this jar.',
    }[ask],
    explanation: {
      more: 'That jar has more water than the jar in the picture.', less: 'That jar has less water than the jar in the picture.',
      same: 'That jar has the same water as the jar in the picture.',
      plus1: `This jar is at line ${ref}. One line up is line ${target}.`, minus1: `This jar is at line ${ref}. One line down is line ${target}.`,
    }[ask],
    givens: { ask },
    visual: { kind: 'v3-pp1-cmp-jar-ref', level: ref, hue, description: `A jar with the water at line ${ref} of 5.` },
    choices: choices(grade, answer.tag, others.map(([n, code], index) => {
      const card = jarCard(n, hue, tags[index + 1]);
      return wrong(card.tag, code, card);
    }), answer),
  });
}
function solveJars(question) {
  checkTags(question);
  const ref = question.visual.level;
  const test = {
    more: card => card.level > ref, less: card => card.level < ref, same: card => card.level === ref,
    plus1: card => card.level === ref + 1, minus1: card => card.level === ref - 1,
  }[question.proof.givens.ask];
  return pickOption(question, test);
}
function jarArt(cx, top, w, h, level, hue) {
  const x = cx - w / 2;
  const bottom = top + h;
  const corner = w * 0.22;
  const inset = 3;
  const inner = h - inset * 2;
  const lineY = bottom - inset - inner * level / 5;
  const shell = `M${n1(x)} ${n1(top)}H${n1(x + w)}V${n1(bottom - corner)}Q${n1(x + w)} ${n1(bottom)} ${n1(x + w - corner)} ${n1(bottom)}H${n1(x + corner)}Q${n1(x)} ${n1(bottom)} ${n1(x)} ${n1(bottom - corner)}Z`;
  const ix = x + inset;
  const iw = w - inset * 2;
  const ic = corner - inset;
  const base = bottom - inset;
  const water = `M${n1(ix)} ${n1(lineY)}H${n1(ix + iw)}V${n1(base - ic)}Q${n1(ix + iw)} ${n1(base)} ${n1(ix + iw - ic)} ${n1(base)}H${n1(ix + ic)}Q${n1(ix)} ${n1(base)} ${n1(ix)} ${n1(base - ic)}Z`;
  const ticks = [1, 2, 3, 4].map(k => {
    const y = n1(bottom - inset - inner * k / 5);
    return `<line x1="${n1(x + w - 15)}" y1="${y}" x2="${n1(x + w - 5)}" y2="${y}" stroke="#6b7a96" stroke-width="2.5" stroke-linecap="round"/>`;
  }).join('');
  return `<path d="${shell}" fill="#eaf6ff"/><path d="${water}" fill="${hue}"/>${ticks}<path d="${shell}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
    + `<rect x="${n1(x - 3)}" y="${n1(top - 8)}" width="${n1(w + 6)}" height="10" rx="4" fill="#dfeefa" stroke="${INK}" stroke-width="3.5"/>`;
}
function jarRefPicture(v) {
  const shelf = `<rect x="110" y="130" width="180" height="10" rx="5" fill="#c89a62" stroke="${INK}" stroke-width="3.5"/>`;
  return svg(plate('mint', 400, 150) + shelf + jarArt(200, 26, 68, 104, v.level, v.hue), v.description, 400, 150);
}

// ---- 5. How many more to make them equal? ----
const EQUAL_PAIRS = [['alien', 'flag'], ['rover', 'fuel'], ['astro', 'flag'], ['rocket', 'fuel'], ['alien', 'ufo'], ['astro', 'rover'], ['rover', 'flag'], ['astro', 'crate']];
const CHEAP = ['star', 'coin', 'crystal', 'flag', 'crate', 'fuel', 'rock'];

function draftEqual(grade, level, r) {
  const slots = level < 3;
  const n = level === 1 ? r.int(3, 5) : level === 2 ? r.int(3, 6) : r.int(5, 9);
  const d = level === 1 ? r.int(1, 2) : level === 2 ? r.int(1, 3) : r.int(1, 4);
  const m = n - d;
  const [bigKind, smallKind] = slots ? r.pick(EQUAL_PAIRS) : distinctKinds(r, 2, CHEAP);
  if (n * COST[bigKind] + m * COST[smallKind] > 13500) throw new QuestionRetry('The rows would be too crowded.');
  const bigTop = r.int(0, 1) === 1;
  const rows = bigTop ? [{ kind: bigKind, count: n }, { kind: smallKind, count: m }] : [{ kind: smallKind, count: m }, { kind: bigKind, count: n }];
  const stems = slots
    ? [`How many more ${many(smallKind)} so each ${THINGS[bigKind].one} has one?`, `Each ${THINGS[bigKind].one} needs a ${THINGS[smallKind].one}. How many more ${many(smallKind)}?`, `How many ${many(smallKind)} are missing for the ${many(bigKind)}?`]
    : [`How many more ${many(smallKind)} to match the ${many(bigKind)}?`, `How many more ${many(bigKind)} than ${many(smallKind)}?`, `How many fewer ${many(smallKind)} than ${many(bigKind)}?`];
  return build({
    family: 'pp1-cmp-equal', prompt: say(r, stems), answer: d,
    hint: slots ? `Pair each ${THINGS[bigKind].one} with a ${THINGS[smallKind].one}. Count the ones left.` : 'Match one to one. Count the ones left over.',
    explanation: `You see ${counted(n, bigKind)} and ${counted(m, smallKind)}. ${n} - ${m} = ${d}, so ${d} more ${thingWord(smallKind, d)} ${d === 1 ? 'makes' : 'make'} them equal.`,
    givens: { slots },
    visual: {
      kind: 'v3-pp1-cmp-rows', slots, rows,
      description: `2 rows. The top row has ${counted(rows[0].count, rows[0].kind)}. The bottom row has ${counted(rows[1].count, rows[1].kind)}.`,
    },
    choices: choices(grade, d, spreadWrongs(r, d, [
      { n: m, code: 'pp1-equal-have' }, { n, code: 'pp1-equal-total' },
      { n: d + 1, code: 'pp1-equal-off' }, { n: d - 1, code: 'pp1-equal-off' }, { n: d + 2, code: 'pp1-equal-off' }, { n: d - 2, code: 'pp1-equal-off' },
    ], { min: 1, max: 12 })),
  });
}
const solveEqual = question => String(Math.abs(question.visual.rows[0].count - question.visual.rows[1].count));
function rowsPicture(v) {
  const parts = [plate('mint', 480, 216), '<line x1="24" y1="108" x2="456" y2="108" stroke="#b3c2b8" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>'];
  const longest = Math.max(v.rows[0].count, v.rows[1].count);
  const step = Math.min(72, Math.floor(440 / longest));
  const size = Math.min(58, step - 8);
  const left = (480 - step * longest) / 2 + step / 2;
  v.rows.forEach((row, index) => {
    const cy = index === 0 ? 60 : 156;
    for (let slot = 0; slot < longest; slot++) {
      const cx = left + slot * step;
      if (slot < row.count) parts.push(put(row.kind, cx, cy, size));
      else if (v.slots) parts.push(`<rect x="${n1(cx - size / 2)}" y="${n1(cy - size / 2)}" width="${size}" height="${size}" rx="10" fill="none" stroke="#7d889f" stroke-width="3" stroke-dasharray="6 5"/>`);
    }
  });
  return svg(parts.join(''), v.description, 480, 216);
}

// ---- 6. Which card has the same number as this tray? One more? One fewer? ----
const SAME_KINDS = ['fuel', 'flag', 'alien', 'astro', 'rocket', 'crate'];

function draftSame(grade, level, r) {
  const n = level === 1 ? r.int(3, 5) : level === 2 ? r.int(3, 6) : r.int(4, 7);
  const ask = r.pick(level === 1 ? ['same'] : level === 2 ? ['same', 'same', 'more', 'fewer'] : ['same', 'more', 'fewer', 'more', 'fewer']);
  const step = level === 1 ? 2 : 1;
  const [target, others] = {
    same: [n, [[n + step, 'pp1-same-near'], [n - step, 'pp1-same-near']]],
    more: [n + 1, [[n, 'pp1-same-equal'], [n - 1, 'pp1-same-flip']]],
    fewer: [n - 1, [[n, 'pp1-same-equal'], [n + 1, 'pp1-same-flip']]],
  }[ask];
  const refKind = r.pick(SAME_KINDS);
  if (n * COST[refKind] > 13500) throw new QuestionRetry('The tray would be too crowded.');
  const box = { x: 12, y: 12, w: 376, h: 126 };
  const size = level === 1 ? 54 : 44;
  const pts = level === 1 ? tidyPoints(n, { ...box, size, gap: 14 }, n) : pairs(scatterPoints(r, n, { ...box, size, gap: 8 }));
  const kinds = r.shuffle(TOKENS);
  const style = () => (level === 1 ? 'tidy' : level === 2 ? r.pick(['tidy', 'scatter']) : 'scatter');
  const answer = tokenCard(r, kinds[0], target, style());
  const stems = {
    same: ['Which card has the same number as this?', 'Find the card with the same number.', 'Which card has as many as this tray?'],
    more: ['Which card has one more than this?', 'Find the card with one more.', 'Which card has one more than this tray?'],
    fewer: ['Which card has one fewer than this?', 'Find the card with one fewer.', 'Which card has one fewer than this tray?'],
  }[ask];
  return build({
    family: 'pp1-cmp-same', prompt: say(r, stems), answer: answer.tag,
    hint: { same: 'Count this tray. Then count each card.', more: 'Count this tray. Find the card with one more.', fewer: 'Count this tray. Find the card with one fewer.' }[ask],
    explanation: {
      same: `This tray has ${counted(n, refKind)}. The card with ${answer.tag} matches.`,
      more: `One more than ${n} is ${n + 1}. That card has ${answer.tag}.`,
      fewer: `One fewer than ${n} is ${n - 1}. That card has ${answer.tag}.`,
    }[ask],
    givens: { ask },
    visual: { kind: 'v3-pp1-cmp-ref', thing: refKind, size, pts, description: `A tray with ${counted(n, refKind)}.` },
    choices: choices(grade, answer.tag, others.map(([count, code], index) => {
      const card = tokenCard(r, kinds[index + 1], count, style());
      return wrong(card.tag, code, card);
    }), answer),
  });
}
function solveSame(question) {
  checkTags(question);
  const ref = question.visual.pts.length;
  const want = { same: ref, more: ref + 1, fewer: ref - 1 }[question.proof.givens.ask];
  return pickOption(question, card => card.pts.length === want);
}
const refPicture = v => svg(plate('mint', 400, 150) + v.pts.map(([x, y]) => put(v.thing, x, y, v.size)).join(''), v.description, 400, 150);

const DEFS = {
  'pp1-cmp-more': { skill: 'compare', title: 'Which tray has more or fewer', draft: draftMore, solve: solveMore },
  'pp1-cmp-extreme': { skill: 'compare', title: 'Most, fewest, tallest, longest and biggest', draft: draftExtreme, solve: solveExtreme },
  'pp1-cmp-seesaw': { skill: 'compare', title: 'Heavier or lighter on the see-saw', draft: draftSeesaw, solve: solveSeesaw },
  'pp1-cmp-jars': { skill: 'compare', title: 'Jars with more, less or the same water', draft: draftJars, solve: solveJars },
  'pp1-cmp-equal': { skill: 'compare', title: 'How many more make the rows equal', draft: draftEqual, solve: solveEqual },
  'pp1-cmp-same': { skill: 'compare', title: 'Which card has the same number', draft: draftSame, solve: solveSame },
};
export const FAMILIES = Object.fromEntries(Object.entries(DEFS).map(([id, def]) => [id, { skill: def.skill, title: def.title }]));
export const draft = (family, grade, level, r) => DEFS[family].draft(grade, level, r);
export const solve = question => DEFS[question.family].solve(question);

const RENDER = {
  'v3-pp1-cmp-groups': groupsPicture,
  'v3-pp1-cmp-tokens': v => svg(frame(v.pts.map(([x, y]) => token(v.token, x, y, v.size)).join('')), v.description, 110, 110),
  'v3-pp1-cmp-tower': v => svg(frame(towerArt(v.blocks, v.hue)), v.description, 110, 110),
  'v3-pp1-cmp-rope': v => svg(frame(ropeArt(v.len, v.hue)), v.description, 110, 110),
  'v3-pp1-cmp-size': v => svg(frame(put(v.thing, 55, 55, v.size)), v.description, 110, 110),
  'v3-pp1-cmp-seesaw': seesawPicture,
  'v3-pp1-cmp-jar-ref': jarRefPicture,
  'v3-pp1-cmp-jar': v => svg(frame(jarArt(55, 22, 52, 76, v.level, v.hue)), v.description, 110, 110),
  'v3-pp1-cmp-rows': rowsPicture,
  'v3-pp1-cmp-ref': refPicture,
};
export const render = visual => RENDER[visual.kind]?.(visual) ?? null;
