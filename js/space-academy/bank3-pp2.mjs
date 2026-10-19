import { MISCONCEPTIONS as SHARED, QuestionRetry, answerChoices, wrong } from './bank-shared.mjs';
import { renderPP2 } from './bank3-pp2-art.mjs';

// Real SOF papers always give four options, so PP2 does too instead of the three the grade settings suggest.
const OPTIONS = 4;
const noun = (n, one, many) => n === 1 ? one : many;
const an = word => `${/^[aeiou]/i.test(word) ? 'An' : 'A'} ${word}`;
const ORDINALS = ['', '1st', '2nd', '3rd'];
const nth = n => n < 4 ? ORDINALS[n] : `${n}th`;
const MARK_PHRASE = { dots: 'dots', stripe: 'a stripe', ring: 'a ring', cross: 'a cross' };

export const FAMILIES = {
  'pp2-trail-gap': { skill: 'sequence', title: 'Find a hidden neighbour on a number trail' },
  'pp2-ten-frame': { skill: 'count', title: 'Read filled and empty ten-frames' },
  'pp2-bundle-pods': { skill: 'place', title: 'Build a number from a ten and loose cubes' },
  'pp2-sign-order': { skill: 'compare', title: 'Order four numbers on planet signs' },
  'pp2-skip-stones': { skill: 'sequence', title: 'Find a missing skip-counting stone' },
  'pp2-join-gardens': { skill: 'addition', title: 'Join groups of seed pods' },
  'pp2-cross-out': { skill: 'subtraction', title: 'Count the pods that stay' },
  'pp2-bar-missing': { skill: 'mystery', title: 'Find a hidden part of a whole bar' },
  'pp2-hop-count': { skill: 'addition', title: 'Follow forward and backward hops' },
  'pp2-match-rows': { skill: 'compare', title: 'Pair rows to find how many more' },
  'pp2-pattern-tail': { skill: 'repeat', title: 'Continue a patterned chain' },
  'pp2-pattern-hole': { skill: 'repeat', title: 'Find a missing middle pattern tile' },
  'pp2-growing-tiles': { skill: 'sequence', title: 'Predict a growing row of tiles' },
  'pp2-rule-table': { skill: 'coding', title: 'Discover a number machine rule' },
  'pp2-broken-chain': { skill: 'odd', title: 'Find a chain that breaks its rule' },
  'pp2-shape-scene': { skill: 'shape', title: 'Count selected shapes in a scene' },
  'pp2-corner-choice': { skill: 'shape', title: 'Pick a shape by its corners' },
  'pp2-solid-choice': { skill: 'solids', title: 'Match a solid to what it can do' },
  'pp2-mirror-tiles': { skill: 'symmetry', title: 'Complete a mirror picture' },
  'pp2-build-sign': { skill: 'shape', title: 'Choose two shapes to build a sign' },
  'pp2-unit-rod': { skill: 'measure', title: 'Measure a rod with unit blocks' },
  'pp2-ruler-length': { skill: 'measure', title: 'Read a ruler from its start and end' },
  'pp2-three-rods': { skill: 'compare', title: 'Compare four rods by their lengths' },
  'pp2-balance-box': { skill: 'measure', title: 'Balance a missing weight' },
  'pp2-cup-jug': { skill: 'measure', title: 'Count the cups that fit in a jug' },
  'pp2-alien-line': { skill: 'position', title: 'Find an alien in a queue' },
  'pp2-two-marks': { skill: 'odd', title: 'Match an alien with two clues' },
  'pp2-grid-analogy': { skill: 'visual', title: 'Complete a two-rule picture grid' },
  'pp2-shape-changes': { skill: 'visual', title: 'Spot the shapes that changed' },
  'pp2-rover-map': { skill: 'directions', title: 'Follow arrows across a planet map' },
  'pp2-before-after': { skill: 'sequence', title: 'Say the number before, after or between' },
  'pp2-story-sum': { skill: 'addition', title: 'Solve a short add or take-away story' },
  'pp2-sides-count': { skill: 'shape', title: 'Count the sides or corners of a shape' },
  'pp2-size-compare': { skill: 'compare', title: 'Pick the heaviest, longest or tallest thing' },
  'pp2-odd-one': { skill: 'odd', title: 'Spot the thing that does not belong' },
};

export const MISCONCEPTIONS = {
  'pp2-neighbour': { title: 'A number next door', message: 'Step to the very next stone, not two stones away.' },
  'pp2-frame': { title: 'Reading both ten-frames', message: 'Look through every row of both frames before you count.' },
  'pp2-bundle': { title: 'One ten and loose ones', message: 'The tied bundle is ten; then count the loose cubes.' },
  'pp2-order': { title: 'Number order', message: 'Put all three numbers in order before choosing a sign.' },
  'pp2-skip': { title: 'Equal-sized hops', message: 'Each hop on this trail has the same size.' },
  'pp2-join': { title: 'Joining groups', message: 'The new pods join the old ones, so count both groups.' },
  'pp2-leave': { title: 'Pods that leave', message: 'Crossed-out pods have gone; count the ones still showing.' },
  'pp2-bar': { title: 'Parts and whole', message: 'The known parts and the hidden part together make the whole.' },
  'pp2-hop': { title: 'Hop direction', message: 'A hop right adds; a hop left takes away.' },
  'pp2-pairs': { title: 'Matching pairs', message: 'Match the two rows one by one, then count what is left unmatched.' },
  'pp2-unit': { title: 'Whole pattern unit', message: 'Find the whole group that repeats, not only the last tile.' },
  'pp2-gap': { title: 'The blank takes a turn', message: 'A blank still takes one place in the repeating chain.' },
  'pp2-growing': { title: 'The next row grows', message: 'Count how many new tiles each row gains.' },
  'pp2-rule': { title: 'Finding the machine rule', message: 'Check both finished rows before using the rule.' },
  'pp2-broken': { title: 'A broken pattern', message: 'Check each picture against the repeating group.' },
  'pp2-scene': { title: 'Selecting a shape', message: 'Count only the named shape; other patches do not count.' },
  'pp2-corners': { title: 'Counting corners', message: 'A corner is where two straight sides meet.' },
  'pp2-solid': { title: 'Rolling and stacking', message: 'Check whether the solid rolls and whether it has a flat top.' },
  'pp2-mirror': { title: 'Mirror order', message: 'The nearest tile to the mirror stays nearest on the other side.' },
  'pp2-compose': { title: 'Joining two pieces', message: 'Match both pieces and keep the top piece on top.' },
  'pp2-blocks': { title: 'Measuring with blocks', message: 'Count every equal block touching the rod from end to end.' },
  'pp2-ruler': { title: 'Finding the start mark', message: 'A ruler length is the end mark minus the start mark.' },
  'pp2-rods': { title: 'Starting together', message: 'All rods start at the same place; compare their ends.' },
  'pp2-balance': { title: 'Equal weights', message: 'A level balance has the same weight on each pan.' },
  'pp2-jug': { title: 'Empty cup spaces', message: 'Count empty spaces; filled spaces already hold cups.' },
  'pp2-line': { title: 'Finding a place in line', message: 'Start at the named alien and move one place at a time.' },
  'pp2-attributes': { title: 'Both alien marks', message: 'The right alien must match both the shape and its mark.' },
  'pp2-grid': { title: 'Two grid rules', message: 'Follow the top row and the left column to finish the corner.' },
  'pp2-changes': { title: 'Matching both rows', message: 'Compare each top sign with the sign directly underneath it.' },
  'pp2-route': { title: 'Following arrows', message: 'Start at the rover and follow the arrows in order.' },
  'pp2-size': { title: 'Comparing real things', message: 'Picture each real thing, then compare how heavy, long or tall it is.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

const NUMBERS = 'pp2-trail-gap pp2-ten-frame pp2-before-after pp2-bundle-pods pp2-sign-order pp2-skip-stones';
const OPERATIONS = 'pp2-join-gardens pp2-story-sum pp2-cross-out pp2-bar-missing pp2-hop-count pp2-match-rows';
const PATTERNS = 'pp2-pattern-tail pp2-pattern-hole pp2-growing-tiles pp2-rule-table pp2-broken-chain';
const SHAPES = 'pp2-shape-scene pp2-sides-count pp2-corner-choice pp2-solid-choice pp2-mirror-tiles pp2-build-sign';
const MEASUREMENT = 'pp2-unit-rod pp2-ruler-length pp2-size-compare pp2-three-rods pp2-balance-box pp2-cup-jug';
const REASONING = 'pp2-alien-line pp2-odd-one pp2-two-marks pp2-grid-analogy pp2-shape-changes pp2-rover-map';

const without = (row, ...ids) => row.split(' ').filter(id => !ids.includes(id)).join(' ');

export const PLAN = {
  numbers: [without(NUMBERS, 'pp2-sign-order'), without(NUMBERS, 'pp2-skip-stones'), NUMBERS],
  operations: [without(OPERATIONS, 'pp2-hop-count'), without(OPERATIONS, 'pp2-match-rows'), OPERATIONS],
  patterns: [PATTERNS, PATTERNS, PATTERNS],
  shapes: [without(SHAPES, 'pp2-mirror-tiles'), without(SHAPES, 'pp2-build-sign'), SHAPES],
  measurement: [without(MEASUREMENT, 'pp2-three-rods'), without(MEASUREMENT, 'pp2-balance-box'), MEASUREMENT],
  reasoning: [without(REASONING, 'pp2-grid-analogy'), without(REASONING, 'pp2-rover-map'), REASONING],
};

// Names stay only where they label something the child must find (aliens in a queue, planets on a map).
const ALIENS = ['Pip', 'Nia', 'Ari', 'Milo', 'Bo', 'Lia', 'Kai', 'Zoe'];
const PLANETS = ['Mars', 'Venus', 'Saturn', 'Jupiter', 'Neptune', 'Mercury', 'Uranus', 'Pluto'];
const STORY_ITEMS = [['star', 'stars'], ['crystal', 'crystals'], ['rock', 'rocks'], ['seed', 'seeds'],
  ['coin', 'coins'], ['sticker', 'stickers'], ['shell', 'shells'], ['balloon', 'balloons']];
const SCALES = {
  weight: { words: ['heaviest', 'lightest'], things: ['feather', 'apple', 'book', 'dog', 'car', 'bus'] },
  length: { words: ['longest', 'shortest'], things: ['ant', 'pencil', 'broom', 'car', 'bus', 'train'] },
  height: { words: ['tallest', 'shortest'], things: ['ant', 'cup', 'chair', 'door', 'tree'] },
};
const GROUPS = {
  fruits: ['apple', 'banana', 'grape', 'orange', 'pear'],
  animals: ['cat', 'dog', 'cow', 'hen', 'fish'],
  vehicles: ['car', 'bus', 'bike', 'train', 'boat'],
  clothes: ['hat', 'shoe', 'sock', 'coat', 'scarf'],
  'space things': ['star', 'moon', 'comet', 'sun', 'planet'],
  toys: ['ball', 'doll', 'kite', 'drum', 'puzzle'],
  'body parts': ['hand', 'foot', 'nose', 'ear', 'eye'],
};
const SIDES = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 };
const SYMBOLS = ['star', 'circle', 'triangle', 'square', 'pentagon'];
// PP2 numbers stay within 20 at every level; later levels get harder ideas, not bigger numbers.
const MAX = () => 20;
const numberWrongs = (answer, r, code, max = 20, min = 0) => {
  const below = [answer - 1, answer - 2, answer - 3];
  const above = [answer + 1, answer + 2, answer + 3];
  const direction = r.pick([-1, -1, 0, 1, 1]);
  const values = direction < 0 ? [...below, ...above]
    : direction > 0 ? [...above, ...below]
      : [below[0], above[0], below[1], above[1], below[2], above[2]];
  return values.filter(value => value >= min && value <= max).map(value => [value, code]);
};

function make(family, grade, { prompt, answer, hint, explanation, givens, visual, wrongs, picture }) {
  return {
    family, prompt, answer: String(answer), hint, explanation, proof: { family, givens },
    ...(visual ? { visual } : {}),
    choices: answerChoices(answer, wrongs.filter(([value]) => typeof value !== 'number' ||     value >= 0 && value <= 20)
      .map(([value, code, image]) => wrong(value, code, image)), OPTIONS, picture ?? null, KNOWN),
  };
}

function main(question, kind) {
  if (question.visual?.kind !== `v3-pp2-${kind}`) throw new Error('The question lost its picture.');
  return question.visual;
}

function pictures(question, kind, label) {
  if (!question.optionVisuals || question.optionVisuals.length !== question.options.length) {
    throw new Error('Picture choices are missing.');
  }
  question.optionVisuals.forEach((visual, index) => {
    if (visual?.kind !== `v3-pp2-${kind}` || label(visual) !== question.options[index]) {
      throw new Error('A picture choice does not match its label.');
    }
  });
}

const labelAt = (visual, index) => visual.labels[index];
const uniqueN = (r, min, max, count) => r.shuffle(Array.from({ length: max - min + 1 }, (_, index) => min + index)).slice(0, count);
const RANK_PICK = {
  biggest: sorted => sorted[sorted.length - 1],
  smallest: sorted => sorted[0],
  'second biggest': sorted => sorted[sorted.length - 2],
  'second smallest': sorted => sorted[1],
};
const ROD_PICK = {
  longest: RANK_PICK.biggest,
  shortest: RANK_PICK.smallest,
  'second longest': RANK_PICK['second biggest'],
  'second shortest': RANK_PICK['second smallest'],
};
const symbolImage = shape => ({ kind: 'v3-pp2-symbol', shape, description: `A bold ${shape} picture tile.` });
const stripImage = sequence => ({ kind: 'v3-pp2-pattern-strip', sequence,
  description: `A chain showing ${sequence.join(', ')} in order.` });
const stripKey = sequence => sequence.join(', ');
const mirrorKey = rows => rows.map(row => row.map(cell => cell ? 'filled' : 'empty').join(' + ')).join('; ');
const mirrorImage = rows => ({ kind: 'v3-pp2-mirror-option', rows,
  description: `Right-side tiles: ${rows.map((row, i) => `row ${i + 1} ${row.map(cell => cell ? 'filled' : 'empty').join(' then ')}`).join('; ')}.` });
const pieceKey = (top, bottom) => `${top} above ${bottom}`;
const pieceImage = (top, bottom) => ({ kind: 'v3-pp2-combo-choice', top, bottom,
  description: `Two separate pieces: a ${top} above a ${bottom}.` });
const MARKS = ['dots', 'stripe', 'ring', 'cross'];
const alienKey = (shape, mark) => `${shape} with ${MARK_PHRASE[mark]}`;
const alienImage = (shape, mark) => ({ kind: 'v3-pp2-alien-choice', shape, mark,
  description: `An alien-shaped ${shape} marked with ${mark === 'dots' ? 'a pair of dots' : MARK_PHRASE[mark]}.` });

export function draft(family, grade, level, r) {
  if (family === 'pp2-trail-gap') {
    const count = level === 1 ? 4 : 5;
    const start = r.int(level === 3 ? 8 : 1, MAX(level) - count + 1);
    const missing = r.int(1, count - 2);
    const answer = start + missing;
    const stones = Array.from({ length: count }, (_, i) => start + i);
    const visual = { kind: 'v3-pp2-trail', start, count, missing,
      description: `${count} numbered stones start at ${start} and go up by one. The ${nth(missing + 1)} stone is covered.` };
    return make(family, grade, {
      prompt: r.pick([`A trail starts at ${start}. Which number is on the covered stone?`,
        `The stones go up by one from ${start}. What is hidden?`,
        `The ${nth(missing + 1)} stone is covered. Which number is on it?`,
        `What number is under the cover on this trail?`,
        `Count up the stones from ${start}. Which number is missing?`]),
      answer, hint: 'Read the stones in order, one step at a time.',
      explanation: `The stones go ${stones.join(', ')}. The covered stone is ${answer}.`,
      givens: { start, missing }, visual, wrongs: numberWrongs(answer, r, 'pp2-neighbour', MAX(level)),
    });
  }
  if (family === 'pp2-ten-frame') {
    const frames = level === 1 ? 1 : 2;
    const filled = frames === 1 ? r.int(1, 9) : r.int(level === 3 ? 10 : 7, level === 3 ? 19 : 17);
    const total = frames * 10;
    if (filled * 2 === total) throw new QuestionRetry('Equal filled and empty counts cannot tell the two questions apart.');
    const ask = r.pick(['filled', 'empty']);
    const answer = ask === 'filled' ? filled : total - filled;
    const frameWords = frames === 1 ? 'this ten-frame' : 'these two ten-frames';
    const visual = { kind: 'v3-pp2-frame', frames, filled, ask,
      description: `${frames} ten-frame${frames === 1 ? '' : 's'} with ${filled} filled ${noun(filled, 'spot', 'spots')} and ${total - filled} empty ${noun(total - filled, 'spot', 'spots')}.` };
    return make(family, grade, {
      prompt: ask === 'filled'
        ? r.pick([`How many spots are filled in ${frameWords}?`, `Count the stars in ${frameWords}.`,
          `How many filled spots can you count?`])
        : r.pick([`How many spots are empty in ${frameWords}?`, `Count the empty spots in ${frameWords}.`,
          `How many more stars fill ${frames === 1 ? 'the frame' : 'both frames'}?`]),
      answer, hint: `Count only the ${ask} spots, row by row.`,
      explanation: `${total} spots in all: ${filled} filled and ${total - filled} empty. The ${ask} count is ${answer}.`,
      givens: { frames, filled, ask }, visual, wrongs: [
        [total - answer, 'pp2-frame'], ...numberWrongs(answer, r, 'missed-object', total),
      ],
    });
  }
  if (family === 'pp2-bundle-pods') {
    const loose = r.int(level === 3 ? 3 : 2, 9);
    const change = level === 3 ? r.pick([-1, -2, -3, 1, 2, 3].filter(step => 10 + loose + step <= 20 && loose + step >= 1))
      : level === 2 ? r.pick([0, 1, 2].filter(step => 10 + loose + step <= 20)) : 0;
    const answer = 10 + loose + change;
    const cubes = n => `${n} ${noun(n, 'cube', 'cubes')}`;
    const visual = { kind: 'v3-pp2-bundles', loose, change,
      description: `One bundle of ten cubes and ${cubes(loose)} on their own. ${change ? `${cubes(Math.abs(change))} ${change > 0 ? 'join them' : 'roll away'}.` : 'Nothing changes.'}` };
    return make(family, grade, {
      prompt: change < 0 ? r.pick([`One ten and ${loose} loose cubes. ${cubes(-change)} ${noun(-change, 'rolls', 'roll')} away. How many are left?`,
        `Ten cubes in a bundle, ${loose} loose. Take away ${-change}. How many are left?`])
        : change > 0 ? r.pick([`One ten and ${loose} loose cubes. ${cubes(change)} ${noun(change, 'joins', 'join')}. How many now?`,
          `Ten cubes in a bundle, ${loose} loose. Add ${change}. How many cubes now?`])
          : r.pick([`One bundle of ten and ${loose} loose cubes. What number is it?`,
            `Ten cubes in a bundle and ${loose} loose cubes make what number?`,
            `How many cubes are in one bundle of ten and ${loose} loose ones?`,
            `What number is one ten and ${loose} ones?`]),
      answer, hint: 'Start with the bundle of ten, then count loose cubes.',
      explanation: change ? `Ten and ${loose} make ${10 + loose}. ${10 + loose} ${change > 0 ? '+' : '-'} ${Math.abs(change)} = ${answer}.`
        : `Ten and ${loose} make ${answer}.`,
      givens: { loose, change }, visual, wrongs: [
        [loose + change, 'pp2-bundle'], ...numberWrongs(answer, r, 'missing-step', MAX(level)),
      ],
    });
  }
  if (family === 'pp2-sign-order') {
    const values = uniqueN(r, level === 3 ? 6 : 1, MAX(level), 4);
    const ask = level === 1 ? r.pick(['biggest', 'smallest']) : r.pick(['biggest', 'smallest', 'second biggest', 'second smallest']);
    const labels = ['A', 'B', 'C', 'D'];
    const sorted = [...values].sort((a, b) => a - b);
    const answer = labels[values.indexOf(RANK_PICK[ask](sorted))];
    const visual = { kind: 'v3-pp2-signs', values, labels, ask,
      description: `Four signs: ${labels.map((label, i) => `${label} shows ${values[i]}`).join(', ')}.` };
    return make(family, grade, {
      prompt: r.pick([`Which sign shows the ${ask} number?`,
        `Look at the four signs. Which one is ${ask}?`,
        `Find the ${ask} number. Which sign holds it?`,
        `Which letter is on the ${ask} number?`]),
      answer, hint: 'Put the four sign numbers in order first.',
      explanation: `From smallest to biggest: ${sorted.join(', ')}. Sign ${answer} has the ${ask} number.`,
      givens: { ask }, visual, wrongs: labels.filter(value => value !== answer).map(value => [value, 'pp2-order']),
    });
  }
  if (family === 'pp2-skip-stones') {
    const step = level === 1 ? 2 : r.pick([2, 2, 5]);
    const count = level === 3 ? 4 : 5;
    const lastStart = MAX(level) - (count - 1) * step;
    const starts = Array.from({ length: lastStart + 1 }, (_, value) => value)
      .filter(value => value % step === 0 || (level === 3 && step === 2));
    const first = r.pick(starts);
    const missing = r.int(1, count - 2);
    const values = Array.from({ length: count }, (_, i) => first + i * step);
    const answer = values[missing];
    const visual = { kind: 'v3-pp2-skips', step, start: first, count, missing,
      description: `${count} stones count by ${step} from ${first}; the ${nth(missing + 1)} stone is blank.` };
    return make(family, grade, {
      prompt: r.pick([`Hop by ${step}s from ${first}. What goes on the blank stone?`,
        `Count by ${step}s from ${first}. Which stone is missing?`,
        `Each hop adds ${step}. What number is hidden?`,
        `The trail counts by ${step}s. What is under the blank?`]),
      answer, hint: `Add ${step} at each hop; do not count by ones.`,
      explanation: `Counting by ${step}s: ${values.join(', ')}. The blank stone is ${answer}.`,
      givens: { start: first, step, missing }, visual, wrongs: [
        [first + missing, 'pp2-skip'], ...numberWrongs(answer, r, 'pp2-skip', MAX(level)),
      ],
    });
  }
  if (family === 'pp2-join-gardens') {
    const first = r.int(2, level === 3 ? 8 : 6);
    const second = r.int(1, level === 3 ? 7 : 10 - first);
    const parts = level === 3 ? [first, second, r.int(1, Math.min(5, 20 - first - second))] : [first, second];
    const answer = parts.reduce((total, value) => total + value, 0);
    const pods = n => `${n} seed ${noun(n, 'pod', 'pods')}`;
    const visual = { kind: 'v3-pp2-gardens', parts,
      description: `${parts.length} separate garden beds hold ${parts.map(pods).join(', ')}.` };
    return make(family, grade, {
      prompt: r.pick([`How many pods are in these ${parts.length} beds altogether?`,
        `Count all the pods in the ${parts.length} garden beds.`,
        `Add up the pods from every bed. How many?`,
        `${parts.length} beds hold pods. How many pods in all?`]),
      answer, hint: 'Count the pods from every bed, not only one.',
      explanation: `${parts.join(' + ')} = ${answer}, so there are ${answer} pods altogether.`,
      givens: { parts }, visual, wrongs: [
        [parts[0], 'pp2-join'], [answer + 1, 'included-extra'], [parts[1], 'pp2-join'],
        ...numberWrongs(answer, r, 'missed-object', level === 3 ? 30 : 12),
      ],
    });
  }
  if (family === 'pp2-cross-out') {
    const total = r.int(level === 3 ? 10 : 4, level === 3 ? 18 : 10);
    const removed = r.int(1, Math.min(total - 2, level === 3 ? 9 : 6));
    const answer = total - removed;
    const visual = { kind: 'v3-pp2-leaving', total, removed,
      description: `${total} seed pods, with ${removed} crossed out.` };
    return make(family, grade, {
      prompt: r.pick([`${total} pods. ${removed} ${noun(removed, 'pod goes', 'pods go')} away. How many stay?`,
        `${total} pods. ${removed} ${noun(removed, 'pod rolls', 'pods roll')} away. How many remain?`,
        `${total} pods grow here. ${removed} ${noun(removed, 'is', 'are')} crossed out. How many are left?`,
        `Count the pods that stay. ${removed} of ${total} ${noun(removed, 'has', 'have')} gone.`]),
      answer, hint: 'Crossed-out pods have gone; count the rest.',
      explanation: `${total} - ${removed} = ${answer}, so ${answer} pods stay.`,
      givens: { total, removed }, visual, wrongs: [
        [removed, 'pp2-leave'], [total, 'ignored-change'],
        ...numberWrongs(answer, r, 'missed-object', MAX(level)),
      ],
    });
  }
  if (family === 'pp2-bar-missing') {
    const known = level === 3 ? [r.int(3, 6), r.int(3, 6)] : [r.int(2, 6)];
    const missing = r.int(2, level === 3 ? 8 : Math.min(6, 10 - known[0]));
    const whole = known.reduce((sum, value) => sum + value, missing);
    const visual = { kind: 'v3-pp2-partbar', known, missing, whole,
      description: `A bar holds ${whole} pods in all. Its known parts are ${known.join(' and ')}; one part is covered.` };
    return make(family, grade, {
      prompt: r.pick([`The whole bar is ${whole}. How many are hiding?`,
        `${whole} pods in all. How many are under the cover?`,
        `The parts make ${whole}. What is the hidden part?`,
        `Part of the bar is covered. The whole is ${whole}. How many are hidden?`]),
      answer: missing, hint: 'The shown parts and the hidden part make the whole.',
      explanation: `${known.join(' + ')} + ? = ${whole}, and ${whole} - ${whole - missing} = ${missing}. The hidden part is ${missing}.`,
      givens: { whole, known }, visual, wrongs: [
        [whole, 'pp2-bar'], [known.reduce((sum, value) => sum + value, 0), 'pp2-bar'],
        ...numberWrongs(missing, r, 'missing-step', MAX(level)),
      ],
    });
  }
  if (family === 'pp2-hop-count') {
    const start = level === 3 ? r.int(6, 12) : level === 2 ? r.int(3, 6) : r.int(1, 6);
    const steps = level === 1 ? [r.int(1, 10 - start)]
      : level === 2 ? [r.int(1, 2), r.int(1, 2)]
        : [r.int(2, 5), -r.int(1, 4)];
    const answer = start + steps.reduce((sum, value) => sum + value, 0);
    if (answer === start) throw new QuestionRetry('The hops cancel out, so the answer would repeat the start.');
    const visual = { kind: 'v3-pp2-hopline', start, steps,     max: level === 3 ? 20 : 10,
      description: `Number line from 0 to ${level === 3 ? 20 : 10}. Start at ${start}; hop ${steps.map(n => n > 0 ? `${n} right` : `${-n} left`).join(', then ')}.` };
    return make(family, grade, {
      prompt: r.pick([`Start on ${start} and follow the hops. Where do you land?`,
        `A rover starts at ${start}. What is the last stop?`,
        `From ${start}, follow the arrows. What number is last?`,
        `Hop along the number line from ${start}. Where do you stop?`]),
      answer, hint: 'Move right to add, left to take away.',
      explanation: `${start}${steps.map(step => ` ${step > 0 ? '+' : '-'} ${Math.abs(step)}`).join('')} = ${answer}.`,
      givens: { start, steps }, visual, wrongs: [
        [start, 'pp2-hop'], [start + steps[0], 'missing-step'],
        [start - steps.reduce((sum, value) => sum + value, 0), 'pp2-hop'],
        ...numberWrongs(answer, r, 'pp2-hop', MAX(level)),
      ],
    });
  }
  if (family === 'pp2-match-rows') {
    const top = r.int(level === 3 ? 9 : 5, level === 3 ? 13 : 10);
    const bottom = r.int(level === 3 ? 3 : 2, top - (level === 3 ? 3 : 1));
    const gain = level === 3 ? r.int(1, Math.min(2, top - bottom - 1)) : 0;
    const answer = top - bottom - gain;
    const pods = n => `${n} ${noun(n, 'pod', 'pods')}`;
    const visual = { kind: 'v3-pp2-pairs', top, bottom, gain,
      description: `Top row has ${pods(top)}; bottom row has ${pods(bottom)}. ${gain ? `${pods(gain)} ${noun(gain, 'joins', 'join')} the bottom row later.` : 'Match the rows one by one.'}` };
    return make(family, grade, {
      prompt: gain ? `${gain} more ${noun(gain, 'pod joins', 'pods join')} the bottom row. How many more are on top now?`
        : r.pick([`How many more pods are in the top row?`,
          `Match the rows one to one. How many top pods have no pair?`,
          `Pair these two rows. How many extra pods sit on top?`,
          `How many more pods does the top row have than the bottom row?`]),
      answer, hint: 'Match one top pod to one bottom pod; count extras.',
      explanation: gain ? `The bottom row now has ${bottom} + ${gain} = ${bottom + gain}. ${top} - ${bottom + gain} = ${answer}.`
        : `${top} - ${bottom} = ${answer}, so ${answer} top pods have no pair.`,
      givens: { top, bottom, gain }, visual, wrongs: [
        [top - bottom, 'missing-step'], [bottom + gain, 'pp2-pairs'],
        [top + bottom + gain, 'wrong-operation'], ...numberWrongs(answer, r, 'pp2-pairs', MAX(level)),
      ],
    });
  }
  if (family === 'pp2-pattern-tail' || family === 'pp2-pattern-hole') {
    const symbols = r.shuffle(SYMBOLS).slice(0, 3);
    const unit = level === 1 ? symbols.slice(0, 2)
      : level === 2 ? r.pick([[symbols[0], symbols[0], symbols[1]],
        [symbols[0], symbols[1], symbols[1]]]) : r.pick([symbols, [symbols[0], symbols[1], symbols[1], symbols[2]]]);
    const length = r.int(level === 3 ? 6 : 5, level === 3 ? 7 : 6);
    const missing = family === 'pp2-pattern-tail' ? length : r.int(1, length - 2);
    const sequence = Array.from({ length: length + (missing === length ? 1 : 0) },
      (_, index) => index === missing ? null : unit[index % unit.length]);
    const answer = unit[missing % unit.length];
    const visual = { kind: `v3-pp2-${missing === length ? 'chain' : 'chain-gap'}`, unit, sequence, missing,
      description: `${sequence.length} tiles in order: ${sequence.map(shape => shape ?? 'blank').join(', ')}. Find the pattern.` };
    const incorrect = r.shuffle(SYMBOLS.filter(shape => shape !== answer)).slice(0, 3)
      .map(shape => [shape, family === 'pp2-pattern-tail' ? 'pp2-unit' : 'pp2-gap', symbolImage(shape)]);
    return make(family, grade, {
      prompt: family === 'pp2-pattern-tail'
        ? r.pick([`What comes next in this chain?`,
          `Which tile continues the pattern?`,
          `Which shape goes at the end of this chain?`,
          `Follow the pattern. What shape comes next?`])
        : r.pick([`What is missing inside this chain?`,
          `One tile is hidden in the middle. Which shape is it?`,
          `Which shape fills the blank in this chain?`,
          `The pattern has a blank. Which shape belongs there?`]),
      answer, hint: family === 'pp2-pattern-tail'
        ? 'Find the whole repeating group, then start it again.'
        : 'Count each place, including the blank, as you repeat.',
      explanation: `The repeat is ${unit.join(', ')}. The missing tile is ${answer}.`,
      givens: { unit, missing }, visual, wrongs: incorrect, picture: symbolImage(answer),
    });
  }
  if (family === 'pp2-growing-tiles') {
    const base = r.int(1, level === 3 ? 4 : 5);
    const grow = r.int(1, level === 3 ? 3 : 2);
    const target = level === 1 ? 4 : r.int(4, 5);
    const rows = [base, base + grow, base + 2 * grow];
    const answer = base + (target - 1) * grow;
    if (answer === target || rows[2] > 8) throw new QuestionRetry('The answer would repeat the row number, or the picture would be too wide.');
    const visual = { kind: 'v3-pp2-growing', rows, target, grow,
      description: `Rows 1, 2, 3 have ${rows.join(', ')} tiles. Every next row grows by ${grow}; row ${target} is missing.` };
    return make(family, grade, {
      prompt: r.pick([`How many tiles will row ${target} hold?`,
        `The rows keep growing. How many tiles go in row ${target}?`,
        `The tile rows grow. Count the tiles in row ${target}.`,
        `Count ahead to row ${target}. How many tiles are there?`]),
      answer, hint: 'Compare two rows; the same number of tiles is added.',
      explanation: `Rows go ${rows.join(', ')}: ${grow} more each time. Row ${target} has ${answer}.`,
      givens: { base, grow, target }, visual, wrongs: [
        [rows[2], 'pp2-growing'], [answer + grow, 'pp2-growing'],
        ...numberWrongs(answer, r, 'pp2-growing', 20),
      ],
    });
  }
  if (family === 'pp2-rule-table') {
    const rule = level === 1 ? 'add' : r.pick(level === 2 ? ['add', 'take'] : ['add', 'take', 'double']);
    const change = rule === 'add' ? r.int(1, level === 1 ? 3 : 4) : rule === 'take' ? r.int(1, 3) : 0;
    const apply = n => rule === 'double' ? n * 2 : rule === 'add' ? n + change : n - change;
    const [low, high] = rule === 'double' ? [1, 10] : rule === 'take' ? [change + 1, 14] : [1, level === 1 ? 9 : 12];
    const inputs = uniqueN(r, low, high, 3);
    const reverse = level === 3 && r.pick([true, false]);
    const target = reverse ? apply(inputs[2]) : inputs[2];
    const answer = reverse ? inputs[2] : apply(inputs[2]);
    const visual = { kind: 'v3-pp2-machine', examples: inputs.slice(0, 2).map(n => [n, apply(n)]),
      target, reverse, description: `Number machine: ${inputs[0]} becomes ${apply(inputs[0])}, ${inputs[1]} becomes ${apply(inputs[1])}. ${reverse ? `An unknown input becomes ${target}.` : `Input ${target} has an unknown output.`}` };
    const ruleText = rule === 'add' ? `${change} more than` : rule === 'take' ? `${change} less than` : 'double';
    const wrongOperation = reverse ? (rule === 'add' ? target + change : rule === 'take' ? target - change : target * 2)
      : (rule === 'add' ? target - change : rule === 'take' ? target + change : target + 2);
    return make(family, grade, {
      prompt: reverse ? r.pick([`The machine makes ${target}. What went in?`,
        `${target} comes out. Which number went in?`])
        : r.pick([`The machine gets ${target}. What comes out?`,
          `Feed ${target} into the machine. What comes out?`,
          `What does the machine make from ${target}?`]),
      answer, hint: 'Look at both finished rows to find the same rule.',
      explanation: `Each output is ${ruleText} its input, like ${inputs[0]} to ${apply(inputs[0])}. ${reverse ? `${answer} goes in to give ${target}` : `${target} becomes ${answer}`}.`,
      givens: { examples: visual.examples, target, reverse }, visual, wrongs: [
        [target, 'pp2-rule'], [wrongOperation, 'wrong-operation'],
        ...numberWrongs(answer, r, 'pp2-rule', MAX(level), 1),
      ],
    });
  }
  if (family === 'pp2-broken-chain') {
    const [a, b, c] = r.shuffle(SYMBOLS).slice(0, 3);
    const unit = level === 1 ? [a, b] : level === 2 ? r.pick([[a, b], [a, a, b]]) : r.pick([[a, b, c], [a, a, b], [a, b, b, c]]);
    const chain = length => Array.from({ length }, (_, index) => unit[index % unit.length]);
    const goodLong = chain(5);
    const breakAt = r.int(Math.min(unit.length, 3), 4);
    const broken = [...goodLong];
    broken[breakAt] = r.pick(unit.filter(shape => shape !== goodLong[breakAt]));
    const answer = stripKey(broken);
    const visualChoices = [stripImage(chain(3)), stripImage(chain(4)), stripImage(broken), stripImage(goodLong)];
    return make(family, grade, {
      prompt: r.pick([`Repeat ${unit.join(', ')}. Which chain has a mistake?`,
        `The pattern repeats ${unit.join(', ')}. Which row breaks it?`,
        `Which chain does not follow ${unit.join(', ')}?`]),
      answer, hint: 'Check each tile against the repeating group.',
      explanation: `The group is ${unit.join(', ')}. In ${answer}, tile ${breakAt + 1} should be ${goodLong[breakAt]}.`,
      givens: { unit }, wrongs: [
        [stripKey(chain(3)), 'pp2-broken', visualChoices[0]],
        [stripKey(chain(4)), 'pp2-broken', visualChoices[1]],
        [stripKey(goodLong), 'pp2-broken', visualChoices[3]],
      ], picture: visualChoices[2],
    });
  }
  if (family === 'pp2-shape-scene') {
    const shapes = ['triangle', 'circle', 'square', 'rectangle', 'star', 'pentagon'];
    const target = r.pick(shapes.slice(0, level === 1 ? 3 : 5));
    // A square is also a rectangle, so a scene counting one never contains the other.
    const lookAlike = { square: 'rectangle', rectangle: 'square' }[target];
    const others = shapes.filter(shape => shape !== target && shape !== lookAlike);
    const count = level === 1 ? 5 : level === 2 ? 6 : 8;
    const matches = r.int(1, Math.min(4, count - 2));
    const pieces = r.shuffle([...Array(matches).fill(target),
      ...Array.from({ length: count - matches }, () => r.pick(others))]);
    const visual = { kind: 'v3-pp2-patches', pieces, target,
      description: `A rover carries shape patches: ${pieces.join(', ')}. Count only the ${target} patches.` };
    return make(family, grade, {
      prompt: r.pick([`How many ${target} patches are on the rover panel?`,
        `Count the ${target}s on the panel.`,
        `How many of the patches are ${target}s?`,
        `Look at the panel. How many ${target}s can you find?`]),
      answer: matches, hint: `Point to each ${target}, not every patch.`,
      explanation: `${matches} of the ${pieces.length} patches ${noun(matches, `is a ${target}`, `are ${target}s`)}.`,
      givens: { target }, visual, wrongs: [
        ...numberWrongs(matches, r, 'pp2-scene', pieces.length),
        [pieces.length, 'pp2-scene'],
      ],
    });
  }
  if (family === 'pp2-corner-choice') {
    const ask = r.pick(['corners', 'sides']);
    const groups = [
      [['circle', 0]],
      [['triangle', 3]],
      [['square', 4], ['rectangle', 4]],
      [['pentagon', 5]],
      [['hexagon', 6]],
    ].filter(group => ask === 'corners' || group[0][1] > 0);
    const choices = r.shuffle(groups).slice(0, 4).map(group => r.pick(group));
    const wanted = r.pick(choices)[1];
    const answer = choices.find(([, corners]) => corners === wanted)[0];
    const image = ([shape, corners]) => ({ kind: 'v3-pp2-corner', shape, corners,
      description: corners ? `A clear ${shape} with ${corners} corners and ${corners} sides.` : `A clear ${shape} with no corners.` });
    const count = wanted ? `${wanted} ${ask}` : `no ${ask}`;
    return make(family, grade, {
      prompt: r.pick([`Which shape has ${count}?`,
        `Count the ${ask}. Which shape has ${count}?`,
        `Which of these shapes has ${count}?`,
        `Find the shape with ${count}.`]),
      answer, hint: ask === 'corners' ? 'Touch each point where two straight sides meet.' : 'Run a finger along each straight side.',
      explanation: wanted ? `The ${answer} has ${wanted} ${ask}.` : `The ${answer} is round, so it has no corners.`,
      givens: { wanted, candidates: choices.map(([shape]) => shape).sort() },
      wrongs: choices.filter(([shape]) => shape !== answer)
        .map(choice => [choice[0], 'pp2-corners', image(choice)]),
      picture: image([answer, wanted]),
    });
  }
  if (family === 'pp2-solid-choice') {
    const clue = r.pick(['roll', 'stand', 'slide', 'point']);
    const answer = { roll: 'ball', stand: 'can', slide: 'box', point: 'cone' }[clue];
    const image = solid => ({ kind: 'v3-pp2-solid', solid,
      description: `A large ${solid} shape: ${solid === 'ball' ? 'round all over' : solid === 'can' ? 'curved side and flat ends' : solid === 'box' ? 'only flat faces' : 'a flat base and a pointed top'}.` });
    const prompts = {
      roll: [`Which solid rolls and has no flat base?`, `Which solid has no flat face at all?`,
        `Which solid is round all over?`, `Which solid rolls in every direction?`,
        `Which solid is shaped like a football?`, `Which solid has one curved surface and no corners?`,
        `Which solid is shaped like a marble?`, `Which solid looks the same from every side?`,
        `Which solid is shaped like a planet?`, `Which solid has no edges and no corners?`],
      stand: [`Which solid has two flat ends and a curved side?`, `Which solid is shaped like a soup tin?`,
        `Which solid has two flat circles?`, `Which solid is shaped like a drink can?`,
        `Which solid rolls sideways and stacks on its flat end?`, `Which solid has a curved side and two flat circles?`,
        `Which solid is shaped like a drum?`, `Which solid is shaped like a tin of beans?`,
        `Which solid has round flat ends and a curved side?`, `Which solid is shaped like a paper roll?`],
      slide: [`Which solid has only flat faces?`, `Which solid has no curved part at all?`,
        `Which solid is shaped like a dice?`, `Which solid is shaped like a gift box?`,
        `Which solid has square flat faces and corners?`, `Which solid has flat faces and sharp edges only?`,
        `Which solid is shaped like a cereal box?`, `Which solid is shaped like a brick?`,
        `Which solid has six flat faces?`, `Which solid is shaped like a shoe box?`],
      point: [`Which solid has a point and a flat base?`, `Which solid is shaped like a party hat?`,
        `Which solid has one flat circle and one tip?`, `Which solid is shaped like an ice cream cone?`,
        `Which solid has one flat base and ends in a point?`, `Which solid has a round base and a tip?`,
        `Which solid is shaped like a traffic cone?`, `Which solid has a tip on top and a round base?`,
        `Which solid is shaped like a rocket nose?`, `Which solid has one tip and one flat face?`],
    };
    const otherSolids = r.shuffle(['ball', 'can', 'box', 'cone'].filter(solid => solid !== answer));
    return make(family, grade, {
      prompt: r.pick(prompts[clue]), answer, hint: 'Check the curved parts and the flat ends.',
      explanation: `${answer === 'ball' ? 'A ball is round all over' : answer === 'can' ? 'A can rolls on its side and stacks on its flat end' : answer === 'box' ? 'A box has only flat sides' : 'A cone has one flat base and one tip'}.`,
      givens: { clue, candidates: [answer, ...otherSolids].sort() }, wrongs: otherSolids
        .map(solid => [solid, 'pp2-solid', image(solid)]),
      picture: image(answer),
    });
  }
  if (family === 'pp2-mirror-tiles') {
    const height = level === 3 ? 4 : 3;
    const rows = Array.from({ length: height }, () => [r.int(0, 1), r.int(0, 1)]);
    const filled = rows.flat().reduce((sum, value) => sum + value, 0);
    if (filled < 2 || filled > height * 2 - 2 || rows.every(([a, b]) => a === b)) {
      throw new QuestionRetry('Choose a clear, asymmetric mirror pattern.');
    }
    const reflected = rows.map(row => [...row].reverse());
    const withError = reflected.map(row => [...row]);
    const errorAt = r.int(0, height - 1);
    withError[errorAt][r.int(0, 1)] ^= 1;
    const otherError = reflected.map(row => [...row]);
    otherError[(errorAt + r.int(1, height - 1)) % height][r.int(0, 1)] ^= 1;
    const visual = { kind: 'v3-pp2-mirror', rows,
      description: `Left half of a mirror grid. ${rows.map((row, i) => `Row ${i + 1}: ${row[0] ? 'filled' : 'empty'} then ${row[1] ? 'filled' : 'empty'}`).join('; ')}. The right half is blank.` };
    return make(family, grade, {
      prompt: r.pick([`Which half mirrors these tiles?`,
        `Find the right half to mirror these ${height} tile rows.`,
        `Which tiles belong across the mirror line?`]),
      answer: mirrorKey(reflected), hint: 'The tile nearest the middle stays nearest on the other side.',
      explanation: `Flip each row across the middle: row 1 is ${rows[0][0] ? 'filled' : 'empty'} then ${rows[0][1] ? 'filled' : 'empty'}, so it becomes ${reflected[0][0] ? 'filled' : 'empty'} then ${reflected[0][1] ? 'filled' : 'empty'}.`,
      givens: { rows }, visual, wrongs: [
        [mirrorKey(rows), 'pp2-mirror', mirrorImage(rows)],
        [mirrorKey(withError), 'pp2-mirror', mirrorImage(withError)],
        [mirrorKey(otherError), 'pp2-mirror', mirrorImage(otherError)],
      ], picture: mirrorImage(reflected),
    });
  }
  if (family === 'pp2-build-sign') {
    const pool = level === 1 ? ['triangle', 'circle', 'square', 'star', 'pentagon']
      : ['triangle', 'circle', 'square', 'rectangle', 'pentagon', 'star'];
    const top = r.pick(pool);
    const bottom = r.pick(pool.filter(shape => shape !== top));
    const wrongTop = r.pick(pool.filter(shape => shape !== top && shape !== bottom));
    const wrongBottom = r.pick(pool.filter(shape => shape !== top && shape !== bottom));
    const visual = { kind: 'v3-pp2-combo', top, bottom,
      description: `A space sign joined from a ${top} on top of a ${bottom}. Find both pieces in this order.` };
    return make(family, grade, {
      prompt: r.pick([`Which two pieces build this sign?`,
        `Match the top and bottom shapes in this sign.`,
        `Which pair can make this space sign?`]),
      answer: pieceKey(top, bottom), hint: 'Match the shape at the top and the shape below it.',
      explanation: `The sign has a ${top} on top and a ${bottom} below it. Both pieces must match.`,
      givens: { top, bottom }, visual, wrongs: [
        [pieceKey(wrongTop, bottom), 'pp2-compose', pieceImage(wrongTop, bottom)],
        [pieceKey(top, wrongBottom), 'pp2-compose', pieceImage(top, wrongBottom)],
        [pieceKey(bottom, top), 'pp2-compose', pieceImage(bottom, top)],
      ], picture: pieceImage(top, bottom),
    });
  }
  if (family === 'pp2-unit-rod') {
    const units = r.int(level === 3 ? 5 : 2, level === 3 ? 12 : level === 2 ? 10 : 8);
    const unit = r.pick(['cubes', 'tiles', 'blocks']);
    const visual = { kind: 'v3-pp2-unitrod', units, unit,
      description: `A straight rod reaches across exactly ${units} touching, equally sized ${unit}.` };
    return make(family, grade, {
      prompt: r.pick([`How many ${unit} long is this rod?`,
        `Count the ${unit} under this rod. How long is it?`,
        `The rod covers how many whole ${unit}?`]),
      answer: units, hint: 'Start at one end and count each equal piece.',
      explanation: `Counting the ${unit} one by one from end to end gives ${units}.`,
      givens: { units, unit }, visual, wrongs: numberWrongs(units, r, 'pp2-blocks', MAX(level)),
    });
  }
  if (family === 'pp2-ruler-length') {
    const start = level === 1 ? 0 : r.int(level === 3 ? 2 : 1, level === 3 ? 4 : 2);
    const length = r.int(2, Math.min(8, 10 - start));
    const end = start + length;
    const item = r.pick(['beam', 'bridge', 'ribbon', 'antenna', 'rope', 'plank', 'rail', 'ladder']);
    const visual = { kind: 'v3-pp2-ruler', start, end, item,
      description: `${an(item)} starts at ruler mark ${start} and ends at ruler mark ${end}; marks are one unit apart.` };
    return make(family, grade, {
      prompt: r.pick([`How long is the ${item}?`,
        `The ${item} starts at ${start}. What is its length?`,
        `Read this ruler. How many units long is the ${item}?`]),
      answer: length, hint: 'Find both end marks; count the spaces between them.',
      explanation: `From mark ${start} to mark ${end} is ${length} spaces, so ${end} - ${start} = ${length}.`,
      givens: { start, end }, visual, wrongs: [
        [end, 'pp2-ruler'], ...numberWrongs(length, r, 'pp2-ruler', 10),
      ],
    });
  }
  if (family === 'pp2-three-rods') {
    const lengths = uniqueN(r, level === 3 ? 4 : 2, level === 3 ? 13 : 10, 4);
    const labels = ['A', 'B', 'C', 'D'];
    const ask = level === 1 ? r.pick(['longest', 'shortest']) : r.pick(['longest', 'shortest', 'second longest', 'second shortest']);
    const changed = level === 3 ? r.int(0, 3) : -1;
    const gain = level === 3 ? r.pick([-2, -1, 1, 2]) : 0;
    const after = lengths.map((value, index) => value + (index === changed ? gain : 0));
    if (new Set(after).size !== 4 || after.some(n => n < 1 || n > 13)) {
      throw new QuestionRetry('The rods must have four clear lengths.');
    }
    const ordered = [...after].sort((a, b) => a - b);
    const answer = labels[after.indexOf(ROD_PICK[ask](ordered))];
    const gainText = `${gain > 0 ? 'gains' : 'loses'} ${Math.abs(gain)} ${noun(Math.abs(gain), 'block', 'blocks')}`;
    const visual = { kind: 'v3-pp2-rods', lengths, labels, changed, gain, ask,
      description: `Rods A, B, C, D start together and measure ${lengths.join(', ')} blocks. ${gain ? `Rod ${labels[changed]} then ${gainText}.` : 'No lengths change.'}` };
    return make(family, grade, {
      prompt: gain ? `Rod ${labels[changed]} ${gainText}. Which is ${ask} now?`
        : r.pick([`Which rod is ${ask}?`, `Which of these rods is the ${ask}?`,
          `Find the ${ask} rod. Is it A, B, C or D?`]),
      answer, hint: 'Start them together; compare where their ends reach.',
      explanation: `${gain ? 'Now' : 'The lengths are'} ${labels.map((label, index) => `${label} is ${after[index]}`).join(', ')}. Rod ${answer} is ${ask}.`,
      givens: { ask, gain, changed }, visual,
      wrongs: labels.filter(label => label !== answer).map(label => [label, 'pp2-rods']),
    });
  }
  if (family === 'pp2-balance-box') {
    const left = level === 1 ? [r.int(4, 9)]
      : level === 2 ? [r.int(2, 4), r.int(2, 4)] : [r.int(4, 7), r.int(3, 6)];
    const total = left.reduce((sum, n) => sum + n, 0);
    const right = level === 3 ? [r.int(1, 3), r.int(1, Math.min(3, total - 4))]
      : [r.int(1, total - 2)];
    const shown = right.reduce((sum, n) => sum + n, 0);
    const answer = total - shown;
    const visual = { kind: 'v3-pp2-balance', left, right,
      description: `A level balance: the left pan has ${noun(left.length, 'a weight of', 'weights of')} ${left.join(' and ')}; the right pan has ${noun(right.length, 'a weight of', 'weights of')} ${right.join(' and ')} and one hidden weight.` };
    return make(family, grade, {
      prompt: r.pick([`The balance is level. How heavy is the hidden weight?`,
        `What weight is hidden under the question mark?`,
        `Both pans weigh the same. What is missing?`]),
      answer, hint: 'The weight on each side must be equal.',
      explanation: `Left weighs ${left.length > 1 ? `${left.join(' + ')} = ` : ''}${total}. Right shows ${right.length > 1 ? `${right.join(' + ')} = ` : ''}${shown}, so ${total} - ${shown} = ${answer}.`,
      givens: { left, right }, visual, wrongs: [
        [total, 'pp2-balance'], [shown, 'pp2-balance'],
        ...numberWrongs(answer, r, 'pp2-balance', MAX(level), 1),
      ],
    });
  }
  if (family === 'pp2-cup-jug') {
    const capacity = r.int(level === 3 ? 8 : 5, level === 3 ? 12 : level === 2 ? 10 : 8);
    const filled = r.int(1, capacity - (level === 3 ? 4 : 2));
    const add = level === 3 ? r.int(1, 3) : 0;
    const answer = capacity - filled - add;
    if (answer === filled) throw new QuestionRetry('The answer must differ from the filled count.');
    const visual = { kind: 'v3-pp2-jug', capacity, filled, add,
      description: `A jug has room for ${capacity} cups; ${filled} ${noun(filled, 'space is', 'spaces are')} filled. ${add ? `${add} more ${noun(add, 'cup', 'cups')} will be poured in.` : 'Nothing else is added.'}` };
    return make(family, grade, {
      prompt: add ? `Pour ${add} more ${noun(add, 'cup', 'cups')} into this jug. How many spaces stay empty?`
        : r.pick([`This jug holds ${capacity} cups. How many more fit?`,
          `Count the empty cup spaces in this ${capacity}-cup jug.`,
          `How many more cups can fill this jug?`]),
      answer, hint: 'Count only spaces that are still empty.',
      explanation: `${capacity} - ${filled} = ${capacity - filled} ${noun(capacity - filled, 'space is', 'spaces are')} empty${add ? `; after ${add} ${noun(add, 'cup', 'cups')}, ${capacity - filled} - ${add} = ${answer} stay empty` : ''}.`,
      givens: { capacity, filled, add }, visual, wrongs: [
        [filled, 'pp2-jug'], [capacity, 'pp2-jug'], [capacity - filled, 'missing-step'],
        ...numberWrongs(answer, r, 'pp2-jug', MAX(level)),
      ],
    });
  }
  if (family === 'pp2-alien-line') {
    const count = level === 1 ? 4 : 5;
    const names = r.shuffle(ALIENS).slice(0, count);
    const portraits = r.shuffle(SYMBOLS).slice(0, count);
    const target = level === 1 ? 1 : r.int(1, count - 2);
    const swap = level === 3 ? r.shuffle(Array.from({ length: count }, (_, i) => i)).slice(0, 2) : [];
    const after = [...names];
    if (swap.length) [after[swap[0]], after[swap[1]]] = [after[swap[1]], after[swap[0]]];
    const relation = level === 1 ? 'between' : level === 2 ? r.pick(['between', 'right', 'left']) : 'right';
    const prompt = level === 3
      ? `${names[swap[0]]} and ${names[swap[1]]} swap. Who is right of ${after[target - 1]}?`
      : relation === 'between'
        ? r.pick([`Who stands between ${names[target - 1]} and ${names[target + 1]}?`,
          `Which alien is in the middle of ${names[target - 1]} and ${names[target + 1]}?`])
        : `Who is just ${relation} of ${names[target + (relation === 'right' ? -1 : 1)]}?`;
    const visual = { kind: 'v3-pp2-queue', names, portraits,
      description: `Aliens in order from left to right: ${names.join(', ')}. Their shapes are ${portraits.join(', ')}.` };
    return make(family, grade, {
      prompt, answer: after[target], hint: 'Read the line from left to right, one alien at a time.',
      explanation: `${swap.length ? `After the swap, the order is ${after.join(', ')}. ` : `The line is ${names.join(', ')}. `}${after[target]} is ${relation === 'between' ? 'between the named friends' : `just ${relation} of the named friend`}.`,
      givens: { target, swap }, visual,
      wrongs: r.shuffle(names.filter(name => name !== after[target])).map(name => [name, 'pp2-line']),
    });
  }
  if (family === 'pp2-two-marks') {
    const SHAPES6 = ['star', 'circle', 'triangle', 'square', 'pentagon', 'hexagon'];
    const shape = r.pick(SHAPES6);
    const mark = r.pick(MARKS);
    const otherShape = r.pick(SHAPES6.filter(item => item !== shape));
    const otherMark = r.pick(MARKS.filter(item => item !== mark));
    const alien = `${shape} with ${MARK_PHRASE[mark]}`;
    return make(family, grade, {
      prompt: r.pick([`Which alien is a ${alien}?`,
        `Find the ${shape} that has ${MARK_PHRASE[mark]}.`,
        `Which alien has the shape ${shape} and ${MARK_PHRASE[mark]}?`]),
      answer: alienKey(shape, mark), hint: 'Check the outside shape AND the mark inside.',
      explanation: `The outside shape is a ${shape} and the mark is ${MARK_PHRASE[mark]}.`,
      givens: { shape, mark }, wrongs: [
        [alienKey(shape, otherMark), 'pp2-attributes', alienImage(shape, otherMark)],
        [alienKey(otherShape, mark), 'pp2-attributes', alienImage(otherShape, mark)],
        [alienKey(otherShape, otherMark), 'pp2-attributes', alienImage(otherShape, otherMark)],
      ], picture: alienImage(shape, mark),
    });
  }
  if (family === 'pp2-grid-analogy') {
    const [topShape, bottomShape] = r.shuffle(['star', 'circle', 'triangle', 'square', 'pentagon']).slice(0, 2);
    const [topMark, bottomMark] = r.shuffle(MARKS).slice(0, 2);
    const visual = { kind: 'v3-pp2-analogy', topShape, bottomShape, topMark, bottomMark,
      description: `Two by two picture grid: top-left ${topShape} with ${MARK_PHRASE[topMark]}, top-right ${bottomShape} with ${MARK_PHRASE[topMark]}, bottom-left ${topShape} with ${MARK_PHRASE[bottomMark]}, bottom-right empty.` };
    const answer = alienKey(bottomShape, bottomMark);
    return make(family, grade, {
      prompt: r.pick([`Use both grid rules. What goes in the empty square?`,
        `Which alien fills the empty grid square?`,
        `Find the shape and mark for the last grid box.`]),
      answer, hint: 'One row keeps a mark; one column keeps a shape.',
      explanation: `The bottom row has ${MARK_PHRASE[bottomMark]}; the right column has a ${bottomShape}. So it is a ${bottomShape} with ${MARK_PHRASE[bottomMark]}.`,
      givens: { topShape, bottomShape, topMark, bottomMark }, visual, wrongs: [
        [alienKey(topShape, bottomMark), 'pp2-grid', alienImage(topShape, bottomMark)],
        [alienKey(bottomShape, topMark), 'pp2-grid', alienImage(bottomShape, topMark)],
        [alienKey(topShape, topMark), 'pp2-grid', alienImage(topShape, topMark)],
      ], picture: alienImage(bottomShape, bottomMark),
    });
  }
  if (family === 'pp2-shape-changes') {
    const count = level === 1 ? r.int(3, 4) : level === 2 ? r.int(4, 5) : 5;
    const before = Array.from({ length: count }, () => r.pick(SYMBOLS));
    const changedPlaces = r.shuffle(Array.from({ length: count }, (_, index) => index))
      .slice(0, r.int(1, count - 1));
    const after = before.map((shape, index) => changedPlaces.includes(index)
      ? r.pick(SYMBOLS.filter(candidate => candidate !== shape)) : shape);
    const ask = level === 1 ? 'changed' : r.pick(['changed', 'same']);
    const answer = ask === 'changed' ? changedPlaces.length : count - changedPlaces.length;
    const visual = { kind: 'v3-pp2-changes', before, after, ask,
      description: `Two aligned rows. Before: ${before.join(', ')}. After: ${after.join(', ')}. Compare shapes in each column.` };
    const placesText = places => `${noun(places.length, 'Place', 'Places')} ${places.map(i => i + 1).join(', ')}`;
    const sameAt = Array.from({ length: count }, (_, index) => index).filter(index => !changedPlaces.includes(index));
    const sortedChanged = [...changedPlaces].sort((x, y) => x - y);
    return make(family, grade, {
      prompt: r.pick([`How many signs ${ask === 'changed' ? 'changed shape' : 'kept their shape'}?`,
        `Compare the two rows. How many signs ${ask === 'changed' ? 'changed' : 'stayed the same'}?`,
        `Look at both rows. How many shapes are ${ask === 'changed' ? 'different' : 'the same'}?`]),
      answer, hint: 'Pair each top sign with the sign right underneath.',
      explanation: ask === 'changed' ? `${placesText(sortedChanged)} ${noun(sortedChanged.length, 'is', 'are')} different, so ${answer}.`
        : `${placesText(sameAt)} ${noun(sameAt.length, 'is', 'are')} the same, so ${answer}.`,
      givens: { before, after, ask }, visual, wrongs: [
        ...numberWrongs(answer, r, 'pp2-changes', count),
        [count - answer, 'pp2-changes'],
      ],
    });
  }
  if (family === 'pp2-rover-map') {
    const directions = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
    const steps = [];
    let x = 1;
    let y = 1;
    for (let i = 0; i < level; i++) {
      const allowed = directions.filter(([, dx, dy]) => x + dx >= 0 && x + dx < 3 && y + dy >= 0 && y + dy < 3);
      const [name, dx, dy] = r.pick(allowed);
      steps.push(name);
      x += dx;
      y += dy;
    }
    if (x === 1 && y === 1) throw new QuestionRetry('Choose a route that reaches a planet.');
    const otherCells = r.shuffle(Array.from({ length: 9 }, (_, i) => [i % 3, Math.floor(i / 3)])
      .filter(([cx, cy]) => !(cx === 1 && cy === 1) && !(cx === x && cy === y))).slice(0, 3);
    const names = r.shuffle(PLANETS).slice(0, 4);
    const planets = r.shuffle([[x, y], ...otherCells]).map(([px, py], i) => ({ name: names[i], x: px, y: py }));
    const answer = planets.find(planet => planet.x === x && planet.y === y).name;
    const visual = { kind: 'v3-pp2-map', steps, planets,
      description: `Three by three map. Rover starts in the middle. Arrows: ${steps.join(', ')}. Planets: ${planets.map(p => `${p.name} at row ${p.y + 1}, column ${p.x + 1}`).join('; ')}.` };
    return make(family, grade, {
      prompt: r.pick([`Follow ${steps.length} ${noun(steps.length, 'arrow', 'arrows')} from the rover. Which planet?`,
        `The rover follows the arrows. Which planet is last?`,
        `Start at the rover. Where ${noun(steps.length, 'does this arrow lead', 'do these ' + steps.length + ' arrows lead')}?`]),
      answer, hint: 'Begin in the middle; take one arrow at a time.',
      explanation: `Go ${steps.join(', then ')} from the rover to reach ${answer}.`,
      givens: { steps, planets }, visual,
      wrongs: planets.filter(planet => planet.name !== answer).map(planet => [planet.name, 'pp2-route']),
    });
  }
  if (family === 'pp2-before-after') {
    const ask = level === 1 ? r.pick(['after', 'before']) : level === 2 ? r.pick(['after', 'before', 'between'])
      : r.pick(['after', 'before', 'between', 'after2', 'before2']);
    const top = 19;
    const n = ask === 'before' ? r.int(2, top + 1) : ask === 'before2' ? r.int(3, top + 1) : r.int(1, top - 1);
    const answer = { after: n + 1, before: n - 1, between: n + 1, after2: n + 2, before2: n - 2 }[ask];
    const prompt = {
      after: r.pick([`What number comes just after ${n}?`, `Count on from ${n}. What number is next?`,
        `Which number comes right after ${n}?`]),
      before: r.pick([`What number comes just before ${n}?`, `Count back from ${n}. What number is next?`,
        `Which number comes right before ${n}?`]),
      between: r.pick([`Which number sits between ${n} and ${n + 2}?`, `${n}, ?, ${n + 2}. What is the missing number?`]),
      after2: r.pick([`What number comes 2 after ${n}?`, `Count on 2 from ${n}. Where do you land?`]),
      before2: r.pick([`What number comes 2 before ${n}?`, `Count back 2 from ${n}. Where do you land?`]),
    }[ask];
    return make(family, grade, {
      prompt, answer, hint: ask === 'between' ? 'Say the numbers in order and find the one in the gap.'
        : `Count in order and move ${ask.endsWith('2') ? 'two steps' : 'one step'} ${ask.startsWith('after') ? 'forward' : 'back'}.`,
      explanation: ask === 'between' ? `Counting goes ${n}, ${n + 1}, ${n + 2}, so ${answer} is between.`
        : ask === 'after2' ? `Counting on: ${n}, ${n + 1}, ${n + 2}. You land on ${answer}.`
          : ask === 'before2' ? `Counting back: ${n}, ${n - 1}, ${n - 2}. You land on ${answer}.`
            : `One step ${ask === 'after' ? 'after' : 'before'} ${n} is ${answer}.`,
      givens: { ask, n }, wrongs: [
        [ask.startsWith('before') ? n + 1 : n - 1, 'pp2-neighbour'], [ask === 'between' ? n + 3 : n, 'pp2-neighbour'],
        ...numberWrongs(answer, r, 'pp2-neighbour', top + 2),
      ],
    });
  }
  if (family === 'pp2-story-sum') {
    const [one, many] = r.pick(STORY_ITEMS);
    const op = level === 1 ? r.pick(['add', 'take', 'total']) : level === 2 ? r.pick(['add', 'take', 'total', 'more'])
      : r.pick(['add', 'take', 'total', 'more', 'need']);
    const limit = level === 1 ? 9 : level === 2 ? 14 : 20;
    const a = r.int(op === 'add' || op === 'total' ? 2 : 4, op === 'add' || op === 'total' ? limit - 2 : limit);
    const b = op === 'add' || op === 'total' ? r.int(1, limit - a) : r.int(1, a - 2);
    const answer = op === 'add' || op === 'total' ? a + b : a - b;
    const items = noun(a, one, many);
    const prompt = {
      add: r.pick([`A box holds ${a} ${items}. ${b} more ${noun(b, 'goes', 'go')} in. How many now?`,
        `A shelf has ${a} ${items}. ${b} more ${noun(b, 'is', 'are')} added. How many now?`]),
      take: r.pick([`A bag has ${a} ${items}. ${b} ${noun(b, 'falls', 'fall')} out. How many are left?`,
        `${a} ${items} ${noun(a, 'is', 'are')} in a jar. ${b} ${noun(b, 'is', 'are')} taken out. How many remain?`]),
      total: r.pick([`Red bag: ${a} ${items}. Blue bag: ${b}. How many in all?`,
        `Bag A has ${a} ${items}. Bag B has ${b}. How many together?`]),
      more: `Bag A has ${a} ${items}. Bag B has ${b}. How many more in A?`,
      need: `A box needs ${a} ${items}. It has ${b}. How many more are needed?`,
    }[op];
    return make(family, grade, {
      prompt,
      answer, hint: op === 'add' ? 'Finding more makes the group bigger.' : op === 'total' ? 'Put the two groups together.'
        : op === 'take' ? 'Taking some out makes the group smaller.'
          : op === 'more' ? 'Take the smaller group away from the bigger group.' : 'Find how far it is from the number needed.',
      explanation: op === 'add' || op === 'total' ? `${a} + ${b} = ${answer}.`
        : op === 'take' ? `${a} - ${b} = ${answer} left.`
          : op === 'more' ? `${a} - ${b} = ${answer}, so A has ${answer} more.` : `${a} - ${b} = ${answer} more needed.`,
      givens: { op, a, b }, wrongs: [
        [op === 'add' || op === 'total' ? a - b : a + b, 'wrong-operation'], [a, 'ignored-change'], [b, 'missing-step'],
        ...numberWrongs(answer, r, 'missing-step', limit + 2),
      ],
    });
  }
  if (family === 'pp2-size-compare') {
    const scale = r.pick(Object.keys(SCALES));
    const ask = r.pick(['most', 'least']);
    const things = r.shuffle(SCALES[scale].things).slice(0, 4);
    const words = SCALES[scale].words[ask === 'most' ? 0 : 1];
    const ranked = [...things].sort((x, y) => SCALES[scale].things.indexOf(x) - SCALES[scale].things.indexOf(y));
    const answer = ask === 'most' ? ranked[3] : ranked[0];
    const [most, least] = SCALES[scale].words;
    return make(family, grade, {
      prompt: r.pick([`Which of these is the ${words}?`, `Which real thing is the ${words}?`,
        `Pick the ${words} thing.`]),
      answer, hint: `Think how ${scale === 'weight' ? 'heavy' : scale === 'length' ? 'long' : 'tall'} each real thing is.`,
      explanation: `From ${least} to ${most}: ${ranked.join(', ')}. So the ${words} is the ${answer}.`,
      givens: { scale, ask, things: [...things].sort() },
      wrongs: things.filter(thing => thing !== answer).map(thing => [thing, 'pp2-size']),
    });
  }
  if (family === 'pp2-odd-one') {
    const [group, intruderGroup] = r.shuffle(Object.keys(GROUPS)).slice(0, 2);
    const same = r.shuffle(GROUPS[group]).slice(0, 3);
    const answer = r.pick(GROUPS[intruderGroup]);
    const items = r.shuffle([...same, answer]);
    return make(family, grade, {
      prompt: r.pick([`Which one does not belong in the group?`, `Which of these four is the odd one out?`,
        `Three go together. Which one does not?`]),
      answer, hint: 'Find what three of them share.',
      explanation: `${same.join(', ')} are ${group}. ${an(answer)} is not.`,
      givens: { items: [...items].sort() },
      wrongs: same.map(item => [item, 'sorting-rule']),
    });
  }
  if (family === 'pp2-sides-count') {
    const shape = r.pick(Object.keys(SIDES).slice(0, level === 1 ? 3 : level === 2 ? 4 : 5));
    const ask = level === 1 ? r.pick(['sides', 'corners']) : r.pick(['sides', 'corners', 'both']);
    const times = level === 3 ? r.int(1, 3) : level === 2 ? r.int(1, 2) : 1;
    const answer = SIDES[shape] * (ask === 'both' ? 2 : 1) * times;
    if (answer > 20) throw new QuestionRetry('Keep the total within 20.');
    const what = ask === 'both' ? 'sides and corners' : ask;
    const prompt = times > 1 ? `How many ${what} do ${times} ${shape}s have in all?`
      : ask === 'both' ? r.pick([`How many sides and corners does a ${shape} have together?`,
        `Count the sides and the corners of a ${shape}. How many?`])
        : r.pick([`How many ${what} does a ${shape} have?`, `Count the ${what} of a ${shape}. How many?`,
          `A ${shape} has how many ${what}?`,
          ask === 'sides' ? `How many straight sides make a ${shape}?` : `How many corners are on a ${shape}?`,
          ask === 'sides' ? `Trace round a ${shape}. How many sides are there?` : `Point to each corner of a ${shape}. How many?`]);
    return make(family, grade, {
      prompt, answer, hint: 'Picture the shape and count one side or corner at a time.',
      explanation: times > 1 ? `One ${shape} has ${SIDES[shape] * (ask === 'both' ? 2 : 1)} ${what}; ${times} of them have ${answer}.`
        : ask === 'both' ? `A ${shape} has ${SIDES[shape]} sides and ${SIDES[shape]} corners: ${SIDES[shape]} + ${SIDES[shape]} = ${answer}.`
          : `A ${shape} has ${answer} ${what}.`,
      givens: { shape, ask, times }, wrongs: [
        [SIDES[shape], 'pp2-corners'], [SIDES[shape] + 1, 'pp2-corners'], [SIDES[shape] - 1, 'pp2-corners'],
        ...numberWrongs(answer, r, 'pp2-corners', 20, 1),
      ],
    });
  }
  throw new Error(`Unfinished PP2 family: ${family}`);
}

export function solve(question) {
  switch (question.family) {
    case 'pp2-before-after': {
      const { ask, n } = question.proof.givens;
      return String(n + { after: 1, before: -1, between: 1, after2: 2, before2: -2 }[ask]);
    }
    case 'pp2-story-sum': {
      const { op, a, b } = question.proof.givens;
      return String(op === 'add' || op === 'total' ? a + b : a - b);
    }
    case 'pp2-size-compare': {
      const { scale, ask, things } = question.proof.givens;
      const order = SCALES[scale].things;
      if (things.join(',') !== [...question.options].sort().join(',')) throw new Error('The things changed.');
      const ranked = [...things].sort((x, y) => order.indexOf(x) - order.indexOf(y));
      return ask === 'most' ? ranked[ranked.length - 1] : ranked[0];
    }
    case 'pp2-odd-one': {
      const { items } = question.proof.givens;
      if (items.join(',') !== [...question.options].sort().join(',')) throw new Error('The things changed.');
      const groupOf = item => Object.keys(GROUPS).find(group => GROUPS[group].includes(item));
      const odd = items.filter(item => items.filter(other => groupOf(other) === groupOf(item)).length === 1);
      if (odd.length !== 1) throw new Error('There is no single odd one out.');
      return odd[0];
    }
    case 'pp2-sides-count': {
      const { shape, ask, times } = question.proof.givens;
      return String(SIDES[shape] * (ask === 'both' ? 2 : 1) * times);
    }
  }
  return solveDrawn(question);
}

function solveDrawn(question) {
  switch (question.family) {
    case 'pp2-trail-gap': {
      const v = main(question, 'trail');
      return String(v.start + v.missing);
    }
    case 'pp2-ten-frame': {
      const v = main(question, 'frame');
      return String(v.ask === 'filled' ? v.filled : v.frames * 10 - v.filled);
    }
    case 'pp2-bundle-pods': {
      const v = main(question, 'bundles');
      return String(10 + v.loose + v.change);
    }
    case 'pp2-sign-order': {
      const v = main(question, 'signs');
      const sorted = [...v.values].sort((a, b) => a - b);
      return labelAt(v, v.values.indexOf(RANK_PICK[v.ask](sorted)));
    }
    case 'pp2-skip-stones': {
      const v = main(question, 'skips');
      return String(v.start + v.step * v.missing);
    }
    case 'pp2-join-gardens': {
      const v = main(question, 'gardens');
      return String(v.parts.reduce((sum, value) => sum + value, 0));
    }
    case 'pp2-cross-out': {
      const v = main(question, 'leaving');
      return String(v.total - v.removed);
    }
    case 'pp2-bar-missing': {
      const v = main(question, 'partbar');
      return String(v.whole - v.known.reduce((sum, value) => sum + value, 0));
    }
    case 'pp2-hop-count': {
      const v = main(question, 'hopline');
      return String(v.start + v.steps.reduce((sum, step) => sum + step, 0));
    }
    case 'pp2-match-rows': {
      const v = main(question, 'pairs');
      return String(v.top - v.bottom - v.gain);
    }
    case 'pp2-pattern-tail':
    case 'pp2-pattern-hole': {
      const v = main(question, question.family === 'pp2-pattern-tail' ? 'chain' : 'chain-gap');
      pictures(question, 'symbol', visual => visual.shape);
      return v.unit[v.missing % v.unit.length];
    }
    case 'pp2-growing-tiles': {
      const v = main(question, 'growing');
      return String(v.rows[0] + (v.target - 1) * v.grow);
    }
    case 'pp2-rule-table': {
      const v = main(question, 'machine');
      const [[in1, out1], [in2, out2]] = v.examples;
      const change = out1 - in1;
      const doubles = out1 === in1 * 2 && out2 === in2 * 2;
      if (!doubles && out2 - in2 !== change) throw new Error('The machine examples disagree.');
      const apply = n => doubles ? n * 2 : n + change;
      const undo = n => doubles ? n / 2 : n - change;
      return String(v.reverse ? undo(v.target) : apply(v.target));
    }
    case 'pp2-broken-chain': {
      pictures(question, 'pattern-strip', visual => stripKey(visual.sequence));
      const { unit } = question.proof.givens;
      const broken = question.optionVisuals.filter(visual =>
        visual.sequence.some((shape, index) => shape !== unit[index % unit.length]));
      if (broken.length !== 1) throw new Error('The chains do not have one clear mistake.');
      return stripKey(broken[0].sequence);
    }
    case 'pp2-shape-scene': {
      const v = main(question, 'patches');
      return String(v.pieces.filter(shape => shape === v.target).length);
    }
    case 'pp2-corner-choice': {
      pictures(question, 'corner', visual => visual.shape);
      const wanted = question.proof.givens.wanted;
      if (question.optionVisuals.map(v => v.shape).sort().join(',') !== question.proof.givens.candidates.join(',')) {
        throw new Error('The corner options changed from their clues.');
      }
      const found = question.optionVisuals.filter(v => v.corners === wanted);
      if (found.length !== 1) throw new Error('The corner clue has no unique shape.');
      return found[0].shape;
    }
    case 'pp2-solid-choice': {
      pictures(question, 'solid', visual => visual.solid);
      const { clue, candidates } = question.proof.givens;
      if (question.optionVisuals.map(v => v.solid).sort().join(',') !== candidates.join(',')) {
        throw new Error('The solid options changed from their clues.');
      }
      const target = { roll: 'ball', stand: 'can', slide: 'box', point: 'cone' }[clue];
      if (!question.optionVisuals.some(v => v.solid === target)) throw new Error('The solid choices lost their answer.');
      return target;
    }
    case 'pp2-mirror-tiles': {
      const v = main(question, 'mirror');
      pictures(question, 'mirror-option', picture => mirrorKey(picture.rows));
      return mirrorKey(v.rows.map(row => [...row].reverse()));
    }
    case 'pp2-build-sign': {
      const v = main(question, 'combo');
      pictures(question, 'combo-choice', visual => pieceKey(visual.top, visual.bottom));
      return pieceKey(v.top, v.bottom);
    }
    case 'pp2-unit-rod': {
      const v = main(question, 'unitrod');
      return String(v.units);
    }
    case 'pp2-ruler-length': {
      const v = main(question, 'ruler');
      return String(v.end - v.start);
    }
    case 'pp2-three-rods': {
      const v = main(question, 'rods');
      const after = v.lengths.map((value, index) => value + (index === v.changed ? v.gain : 0));
      const sorted = [...after].sort((a, b) => a - b);
      return labelAt(v, after.indexOf(ROD_PICK[v.ask](sorted)));
    }
    case 'pp2-balance-box': {
      const v = main(question, 'balance');
      return String(v.left.reduce((sum, value) => sum + value, 0) - v.right.reduce((sum, value) => sum + value, 0));
    }
    case 'pp2-cup-jug': {
      const v = main(question, 'jug');
      return String(v.capacity - v.filled - v.add);
    }
    case 'pp2-alien-line': {
      const v = main(question, 'queue');
      const after = [...v.names];
      const { swap, target } = question.proof.givens;
      if (swap.length) [after[swap[0]], after[swap[1]]] = [after[swap[1]], after[swap[0]]];
      return after[target];
    }
    case 'pp2-two-marks': {
      pictures(question, 'alien-choice', visual => alienKey(visual.shape, visual.mark));
      const { shape, mark } = question.proof.givens;
      return alienKey(shape, mark);
    }
    case 'pp2-grid-analogy': {
      const v = main(question, 'analogy');
      pictures(question, 'alien-choice', visual => alienKey(visual.shape, visual.mark));
      return alienKey(v.bottomShape, v.bottomMark);
    }
    case 'pp2-shape-changes': {
      const v = main(question, 'changes');
      const changed = v.before.filter((shape, index) => shape !== v.after[index]).length;
      return String(v.ask === 'changed' ? changed : v.before.length - changed);
    }
    case 'pp2-rover-map': {
      const v = main(question, 'map');
      const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      let x = 1;
      let y = 1;
      for (const step of v.steps) {
        x += directions[step][0];
        y += directions[step][1];
      }
      const targets = v.planets.filter(planet => planet.x === x && planet.y === y);
      if (targets.length !== 1) throw new Error('The rover map has no unique destination.');
      return targets[0].name;
    }
    default: throw new Error(`Unfinished PP2 family: ${question.family}`);
  }
}

export const render = renderPP2;
