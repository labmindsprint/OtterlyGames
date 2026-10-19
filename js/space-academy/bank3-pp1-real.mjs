// PP1 families taken from the official SOF Class 1 sample papers: thickest and thinnest, and sharing equally onto plates.
import { MISCONCEPTIONS as SHARED, answerChoices, choiceCount } from './bank-shared.mjs';
import { text } from './diagram-kit.mjs';
import {
  INK, QuestionRetry, TOKENS, build, n1, plate, say, spreadWrongs, svg, thingWord, token, wrong,
} from './bank3-pp1-art.mjs';

export const MISCONCEPTIONS = {
  'pp1-thick-flip': { title: 'Thick or thin?', message: 'Thick means wide. Thin means narrow. Check which one the question asks for.' },
  'pp1-thick-mid': { title: 'Compare all of them', message: 'That one is in between. Look for the widest or the narrowest of all.' },
  'pp1-share-plates': { title: 'Count the things', message: 'That is the number of plates. Count how many go on one plate.' },
  'pp1-share-total': { title: 'The same on each plate', message: 'That is all of them. Share them out, one for each plate in turn.' },
  'pp1-share-off': { title: 'Share one at a time', message: 'Give one to each plate in turn until none are left. Then count one plate.' },
  'pp1-share-groups': { title: 'Count the groups', message: 'Make groups of the same size from all of the things. The number of groups is the number of plates.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };
const counted = (n, key) => `${n} ${thingWord(key, n)}`;

// ---- 1. Which bar is the thickest or the thinnest? ----
const BAR_LETTERS = ['P', 'Q', 'R', 'S', 'T'];
const BAR_NOUNS = ['stick', 'pole', 'rod', 'plank', 'pipe', 'rope', 'tube', 'log'];
const WIDTHS = [10, 20, 31, 43, 56];
const BAR_FILL = ['#e4b06a', '#c98f4d', '#d9a15c', '#b9803f', '#cf9a55'];


function draftThick(grade, level, r) {
  const count = level + 2;
  const letters = r.shuffle(BAR_LETTERS).slice(0, count);
  const widths = r.shuffle(WIDTHS).slice(0, count).sort((a, b) => a - b);
  const bars = r.shuffle(letters.map((letter, index) => [letter, widths[index]]));
  const ranked = [...bars].sort((a, b) => a[1] - b[1]);
  const thickest = r.int(0, 1) === 0;
  const answer = (thickest ? ranked[count - 1] : ranked[0])[0];
  const opposite = (thickest ? ranked[0] : ranked[count - 1])[0];
  const middles = ranked.slice(1, count - 1).map(item => item[0]);
  const noun = r.pick(BAR_NOUNS);
  const word = thickest ? 'thickest' : 'thinnest';
  const stems = [`Which ${noun} is the ${word}?`, `Find the ${word} ${noun}.`, `Which one is the ${word} ${noun}?`, `Touch the ${word} ${noun}.`];
  return build({
    family: 'pp1-cmp-thick', prompt: say(r, stems), answer,
    hint: thickest ? 'Thick means wide. Find the widest one.' : 'Thin means narrow. Find the narrowest one.',
    explanation: `From thinnest to thickest: ${ranked.map(item => item[0]).join(', ')}. So ${answer} is the ${word}.`,
    givens: { thickest },
    visual: {
      kind: 'v3-pp1-thick', bars,
      description: `${count} ${noun}s of different widths standing in a row, marked ${bars.map(item => item[0]).join(', ')} from left to right.`,
    },
    choices: answerChoices(answer, [
      wrong(opposite, 'pp1-thick-flip'), ...r.shuffle(middles).map(letter => wrong(letter, 'pp1-thick-mid')),
    ], choiceCount(grade), null, KNOWN),
  });
}
const solveThick = question => {
  const ranked = [...question.visual.bars].sort((a, b) => a[1] - b[1]);
  return (question.proof.givens.thickest ? ranked[ranked.length - 1] : ranked[0])[0];
};
function thickPicture(v) {
  const count = v.bars.length;
  const parts = [plate('sunny', 480, 220)];
  const xs = v.bars.map((_, index) => n1(480 * (index + 1) / (count + 1)));
  v.bars.forEach(([letter, width], index) => {
    parts.push(`<rect x="${n1(xs[index] - width / 2)}" y="26" width="${width}" height="136" rx="6" fill="${BAR_FILL[index]}" stroke="${INK}" stroke-width="4"/>`);
    parts.push(text(xs[index], 198, letter, { size: 26, weight: 800 }));
  });
  return svg(parts.join(''), v.description, 480, 220);
}

// ---- 2. Share things equally onto plates. ----
function draftShare(grade, level, r) {
  const plates = level === 1 ? r.int(2, 3) : r.int(2, 5);
  const each = level === 1 ? r.int(1, 3) : level === 2 ? r.int(2, 4) : r.int(3, 5);
  const total = plates * each;
  if (total > 20) throw new QuestionRetry('Too many things to draw.');
  const ask = level === 1 || r.int(0, 1) === 0 ? 'each' : 'plates';
  if (ask === 'plates' && plates < 2) throw new QuestionRetry('Need at least two plates.');
  const kind = r.pick(TOKENS);
  const stems = ask === 'each' ? [
    `Share ${counted(total, kind)} equally on ${plates} plates. How many on each?`,
    `${plates} plates share ${counted(total, kind)} equally. How many on each?`,
    `Put ${counted(total, kind)} on ${plates} plates equally. How many each?`,
  ] : [
    `Put ${each} on each plate. How many plates for ${counted(total, kind)}?`,
    `${counted(total, kind)} go on plates, ${each} on each. How many plates?`,
    `${counted(total, kind)}. Each plate holds ${each}. How many plates?`,
  ];
  const perRow = total <= 10 ? total : Math.ceil(total / 2);
  const rows = Math.ceil(total / perRow);
  const size = Math.min(44, Math.floor(440 / perRow) - 6);
  const items = Array.from({ length: total }, (_, index) => {
    const row = Math.floor(index / perRow);
    const inRow = Math.min(perRow, total - row * perRow);
    const startX = 240 - (inRow * (size + 6) - 6) / 2 + size / 2;
    return [n1(startX + (index % perRow) * (size + 6)), n1(34 + row * (size + 6))];
  });
  const plateY = 62 + rows * (size + 6);
  const shown = ask === 'each' ? plates : 0;
  const answer = ask === 'each' ? each : plates;
  const candidates = ask === 'each' ? [
    { n: plates, code: 'pp1-share-plates' }, { n: total, code: 'pp1-share-total' },
    { n: each + 1, code: 'pp1-share-off' }, { n: each - 1, code: 'pp1-share-off' }, { n: each + 2, code: 'pp1-share-off' },
  ] : [
    { n: each, code: 'pp1-share-groups' }, { n: total, code: 'pp1-share-groups' },
    { n: plates + 1, code: 'pp1-share-groups' }, { n: plates - 1, code: 'pp1-share-groups' }, { n: plates + 2, code: 'pp1-share-groups' },
  ];
  return build({
    family: 'pp1-share-plates', prompt: say(r, stems), answer,
    hint: ask === 'each' ? 'Give one to each plate in turn. Then count one plate.' : 'Make groups of the same size. Count the groups.',
    explanation: ask === 'each'
      ? `${total} shared on ${plates} plates is ${each} on each plate.`
      : `${total} in groups of ${each} makes ${plates} groups, so ${plates} plates.`,
    givens: { kind, ask, each },
    visual: {
      kind: 'v3-pp1-share', token: kind, size, items, plates: shown, plateY,
      description: ask === 'each'
        ? `${counted(total, kind)} in ${rows === 1 ? 'a row' : 'rows'} above ${plates} empty plates.`
        : `${counted(total, kind)} in ${rows === 1 ? 'a row' : 'rows'}.`,
    },
    choices: answerChoices(String(answer), spreadWrongs(r, answer, candidates, { min: 1, max: 20 }), choiceCount(grade), null, KNOWN),
  });
}
const solveShare = question => {
  const { ask, each } = question.proof.givens;
  const total = question.visual.items.length;
  return String(ask === 'each' ? total / question.visual.plates : total / each);
};
function sharePicture(v) {
  const parts = [plate('mint', 480, 260 + (v.plateY > 130 ? 20 : 0))];
  v.items.forEach(([x, y]) => parts.push(token(v.token, x, y, v.size * 0.9)));
  const width = Math.min(84, Math.floor(480 / (v.plates + 1)) - 14);
  for (let index = 0; index < v.plates; index++) {
    const x = n1(480 * (index + 1) / (v.plates + 1));
    parts.push(`<ellipse cx="${x}" cy="${v.plateY + 30}" rx="${n1(width / 2)}" ry="${n1(width / 5)}" fill="#fffdf5" stroke="${INK}" stroke-width="4"/>`);
  }
  return svg(parts.join(''), v.description, 480, 260 + (v.plateY > 130 ? 20 : 0));
}

const DEFS = {
  'pp1-cmp-thick': { skill: 'compare', title: 'Thickest and thinnest', draft: draftThick, solve: solveThick },
  'pp1-share-plates': { skill: 'sharing', title: 'Share equally onto plates', draft: draftShare, solve: solveShare },
};
export const FAMILIES = Object.fromEntries(Object.entries(DEFS).map(([id, def]) => [id, { skill: def.skill, title: def.title }]));
export const draft = (family, grade, level, r) => DEFS[family].draft(grade, level, r);
export const solve = question => DEFS[question.family].solve(question);

const RENDER = { 'v3-pp1-thick': thickPicture, 'v3-pp1-share': sharePicture };
export const render = visual => RENDER[visual.kind]?.(visual) ?? null;
