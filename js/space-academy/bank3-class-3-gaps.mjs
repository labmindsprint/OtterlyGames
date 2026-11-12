// Class 3 question-bank gaps: direction sense with turns and compass points, and figures hidden inside bigger line figures.
import { MISCONCEPTIONS as SHARED, choiceCount } from './bank-shared.mjs';
import { build, embedQuestion, renderEmbed, retrying, solveEmbed, TEMPLATE_NAMES } from './bank3-gap-kit.mjs';
import { INK, ORANGE, circle, line, svg, text } from './diagram-kit.mjs';

export const GAP3_CODES = {
  'class-3-way-turn': { title: 'Left and right turns', message: 'Turn the way the words say, one turn at a time. Right is clockwise: North, East, South, West.' },
  'class-3-way-opposite': { title: 'Opposite direction', message: 'To go back, face the opposite way: North and South are opposites, and so are East and West.' },
  'class-3-way-frame': { title: 'Left of you, not of the map', message: 'Left and right depend on the way the person faces. Turn yourself to face that way first.' },
  'class-3-embed-other': { title: 'A different figure', message: 'A hidden figure must have exactly the same lines. Check every line, not just the overall look.' },
  'class-3-embed-turned': { title: 'Turned or flipped', message: 'A flipped or turned figure can look alike but may not be inside. Check it in the position shown.' },
  'class-3-embed-near': { title: 'One line different', message: 'One extra or missing line makes it a different figure, so it is not hidden.' },
  'class-3-embed-found': { title: 'That one is hidden', message: 'This figure is hidden in the big one. The question asks for the figure that is not hidden.' },
};
const KNOWN = { ...SHARED, ...GAP3_CODES };

export const GAP3_FAMILIES = {
  'class-3-way-finder': { skill: 'directions', title: 'Find directions after turns, walks and sun clues' },
  'class-3-embed-shape': { skill: 'shape', title: 'Find a shape hidden in a bigger line figure' },
};

export const DRAFT = {};
export const SOLVE = {};
const POINTS = ['North', 'East', 'South', 'West'];
const turnBy = (start, quarters) => POINTS[(POINTS.indexOf(start) + quarters + 40) % 4];
const NAMES = ['Mira', 'Arun', 'Zara', 'Leo', 'Nia', 'Omar', 'Priya', 'Sam', 'Tara', 'Dev', 'Kiran', 'Anya'];
const PLACES = ['the library', 'the market', 'the school', 'the park', 'the temple', 'the bakery', 'the station', 'the pond'];
const COMPOUND = { '0,1': 'North', '1,0': 'East', '0,-1': 'South', '-1,0': 'West', '1,1': 'North-East', '-1,1': 'North-West', '1,-1': 'South-East', '-1,-1': 'South-West' };
const COMPOUND_NAMES = ['North-East', 'North-West', 'South-East', 'South-West'];
const compass = (facing, description) => ({ kind: 'v3-class-3-compass', facing, description });

DRAFT['class-3-way-finder'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['turns', 'sun'] : level === 2 ? ['turns', 'sun', 'relative', 'back'] : ['turns', 'relative', 'back', 'sun']);
  const name = r.pick(NAMES);
  let prompt;
  let answer;
  let wrongs;
  let hint;
  let explanation;
  let givens;
  let visual = null;
  if (mode === 'turns') {
    const start = r.pick(POINTS);
    const moves = Array.from({ length: level === 1 ? 1 : level === 2 ? 2 : 3 }, () => r.pick([['right', 1], ['left', -1], ['right', 1], ['left', -1], ['about', 2]]));
    const total = moves.reduce((sum, move) => sum + move[1], 0);
    answer = turnBy(start, total);
    const words = moves.map(move => (move[0] === 'about' ? 'turns right round to face the back' : `turns ${move[0]}`));
    prompt = `${name} faces ${start}. ${name} ${words.join(', then ')}. Which way does ${name} face now?`;
    const swapped = turnBy(start, -total);
    wrongs = [
      { value: swapped, code: 'class-3-way-frame' }, { value: turnBy(start, total + 2), code: 'class-3-way-opposite' },
      { value: turnBy(start, moves[0][1]), code: 'class-3-way-turn' }, { value: turnBy(start, total + 1), code: 'class-3-way-turn' }, { value: start, code: 'class-3-way-turn' },
    ];
    hint = 'Turn one move at a time. A right turn goes clockwise.';
    explanation = `Starting at ${start}, each turn moves the way ${name} faces. After all the turns ${name} faces ${answer}.`;
    givens = { mode, start, moves: moves.map(move => move[1]) };
    visual = compass(start, `A compass with North, East, South and West. ${name} starts facing ${start}.`);
  } else if (mode === 'sun') {
    const morning = r.pick([true, false]);
    const side = r.pick(['left', 'right', 'back', 'front']);
    const sunPoint = morning ? 'East' : 'West';
    const faceSun = r.pick([true, false]);
    const facing = faceSun ? sunPoint : turnBy(sunPoint, 2);
    const quarter = { left: -1, right: 1, back: 2, front: 0 }[side];
    answer = turnBy(facing, quarter);
    prompt = `In the ${morning ? 'morning' : 'evening'}, ${name} stands with the sun ${faceSun ? 'in front' : 'behind'}. Which direction is on ${name}'s ${side === 'front' ? 'front' : side === 'back' ? 'back' : side}?`;
    wrongs = [
      { value: turnBy(facing, -quarter || 2), code: 'class-3-way-frame' }, { value: turnBy(answer, 2), code: 'class-3-way-opposite' },
      { value: sunPoint, code: 'class-3-way-turn' }, { value: turnBy(sunPoint, 2), code: 'class-3-way-opposite' }, { value: turnBy(facing, 1), code: 'class-3-way-turn' },
    ];
    hint = morning ? 'The sun rises in the East. Work out which way the child faces.' : 'The sun sets in the West. Work out which way the child faces.';
    explanation = `The sun is in the ${sunPoint}, so ${name} faces ${facing}. ${side === 'front' ? 'In front' : side === 'back' ? 'Behind' : `On the ${side}`} is ${answer}.`;
    givens = { mode, morning, faceSun, side };
  } else if (mode === 'relative') {
    const [a, b, c] = r.shuffle(PLACES);
    const first = r.pick(POINTS);
    const second = r.pick(POINTS.filter(point => point !== first && point !== turnBy(first, 2)));
    const vec = point => ({ North: [0, 1], East: [1, 0], South: [0, -1], West: [-1, 0] }[point]);
    const v1 = vec(first);
    const v2 = vec(second);
    answer = COMPOUND[`${v1[0] + v2[0]},${v1[1] + v2[1]}`];
    prompt = `${a} is ${first} of ${b}. ${c} is ${second} of ${a}. In which direction is ${c} from ${b}?`.replace(/^(\w)/, x => x.toUpperCase());
    const mix = [first, second].map(point => vec(turnBy(point, 2)));
    wrongs = [
      { value: COMPOUND[`${-v1[0] - v2[0]},${-v1[1] - v2[1]}`], code: 'class-3-way-opposite' },
      { value: COMPOUND[`${mix[0][0] + v2[0]},${mix[0][1] + v2[1]}`], code: 'class-3-way-turn' },
      { value: COMPOUND[`${v1[0] + mix[1][0]},${v1[1] + mix[1][1]}`], code: 'class-3-way-turn' },
      { value: first, code: 'class-3-way-frame' }, { value: second, code: 'class-3-way-frame' },
    ];
    hint = 'Draw the first step, then the second step from there.';
    explanation = `From ${b} go ${first} to ${a}, then ${second} to ${c}. So ${c} is ${answer} of ${b}.`;
    givens = { mode, first, second };
    visual = compass(null, 'A compass with North at the top, East on the right, South at the bottom and West on the left.');
  } else {
    const first = r.pick(POINTS);
    const second = r.pick(POINTS.filter(point => point !== first && point !== turnBy(first, 2)));
    const steps = [r.int(2, 7), r.int(2, 7)];
    const vec = point => ({ North: [0, 1], East: [1, 0], South: [0, -1], West: [-1, 0] }[point]);
    const back = COMPOUND[`${-vec(first)[0] - vec(second)[0]},${-vec(first)[1] - vec(second)[1]}`];
    answer = back;
    prompt = `${name} walks ${steps[0]} steps ${first}, then ${steps[1]} steps ${second}. Which way is the start from ${name} now?`;
    const forward = COMPOUND[`${vec(first)[0] + vec(second)[0]},${vec(first)[1] + vec(second)[1]}`];
    wrongs = [
      { value: forward, code: 'class-3-way-opposite' },
      { value: COMPOUND[`${-vec(first)[0] + vec(second)[0]},${-vec(first)[1] + vec(second)[1]}`], code: 'class-3-way-turn' },
      { value: COMPOUND[`${vec(first)[0] - vec(second)[0]},${vec(first)[1] - vec(second)[1]}`], code: 'class-3-way-turn' },
      { value: turnBy(second, 2), code: 'class-3-way-frame' }, { value: turnBy(first, 2), code: 'class-3-way-frame' },
    ];
    hint = 'To go home, undo both walks. Each walk is reversed.';
    explanation = `Going home means walking ${turnBy(first, 2)} and ${turnBy(second, 2)}, so the start is ${back} of ${name}.`;
    givens = { mode, first, second };
  }
  return build({ family, known: KNOWN, count, prompt, answer, wrongs, hint, explanation, givens, ...(visual ? { visual } : {}) });
});

SOLVE['class-3-way-finder'] = question => {
  const g = question.proof.givens;
  const vec = point => ({ North: [0, 1], East: [1, 0], South: [0, -1], West: [-1, 0] }[point]);
  if (g.mode === 'turns') return turnBy(g.start, g.moves.reduce((sum, move) => sum + move, 0));
  if (g.mode === 'sun') {
    const sunPoint = g.morning ? 'East' : 'West';
    return turnBy(g.faceSun ? sunPoint : turnBy(sunPoint, 2), { left: -1, right: 1, back: 2, front: 0 }[g.side]);
  }
  const a = vec(g.first);
  const b = vec(g.second);
  return g.mode === 'relative' ? COMPOUND[`${a[0] + b[0]},${a[1] + b[1]}`] : COMPOUND[`${-a[0] - b[0]},${-a[1] - b[1]}`];
};
void COMPOUND_NAMES;

// ---------------------------------------------------------------------------
// Hidden line figures
// ---------------------------------------------------------------------------
const EMBED_CODES = { other: 'class-3-embed-other', turned: 'class-3-embed-turned', near: 'class-3-embed-near', found: 'class-3-embed-found' };
const EMBED_NAMES = ['step', 'hook', 'cup', 'flag', 'tee', 'plus', 'zigzag', 'ell', 'stairs', 'bracket'].filter(name => TEMPLATE_NAMES.includes(name));
DRAFT['class-3-embed-shape'] = retrying((family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['find', 'find', 'not'] : ['find', 'not', 'find']);
  const frame = level === 1 ? { cols: 4, rows: 3, extra: 3 } : level === 2 ? { cols: 5, rows: 4, extra: 5 } : { cols: 5, rows: 4, extra: 7 };
  const turning = level === 3 && mode === 'find';
  return embedQuestion({
    family, known: KNOWN, count, r, level, ...frame, mode, turning, kindPrefix: 'v3-class-3-embed', names: EMBED_NAMES, codes: EMBED_CODES,
    contexts: [0],
    prompt: () => (mode === 'find'
      ? `Which small figure is hidden in the big figure?${turning ? ' You may turn the small figure.' : ' Do not turn it.'}`
      : 'Three small figures are hidden in the big figure. Which one is NOT hidden in it?'),
    hint: 'Place each small figure over the big one and check every line.',
    explanation: mode === 'find'
      ? 'Only this figure fits exactly on the lines of the big figure. The other figures have a line that is not in the big one.'
      : 'The other three fit on the lines of the big figure. This one has a line that is missing from the big figure.',
  });
});
SOLVE['class-3-embed-shape'] = solveEmbed;

const rose = (facing, size = 200) => {
  const c = size / 2;
  const reach = 62;
  const tip = facing && { North: [c, c - reach], East: [c + reach, c], South: [c, c + reach], West: [c - reach, c] }[facing];
  return circle(c, c, 70, { fill: '#fffdf5', strokeWidth: 3 })
    + line(c, c - 70, c, c + 70, { stroke: '#b9b09a', width: 1 }) + line(c - 70, c, c + 70, c, { stroke: '#b9b09a', width: 1 })
    + text(c, 22, 'N', { size: 20 }) + text(size - 18, c + 7, 'E', { size: 20 }) + text(c, size - 10, 'S', { size: 20 }) + text(18, c + 7, 'W', { size: 20 })
    + (tip ? line(c, c, tip[0], tip[1], { stroke: ORANGE, width: 6 }) + circle(tip[0], tip[1], 7, { fill: ORANGE, stroke: INK }) : '')
    + circle(c, c, 6, { fill: INK });
};
export function renderGaps(visual) {
  if (visual.kind === 'v3-class-3-compass') return svg(rose(visual.facing), visual.description, 200, 200);
  if (visual.kind.startsWith('v3-class-3-embed')) return renderEmbed(visual, svg);
  return null;
}
