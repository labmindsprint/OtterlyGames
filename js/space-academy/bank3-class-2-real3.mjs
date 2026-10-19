// Class 2 "real paper" gap families: place-value sign comparison, cardinal vs ordinal, tree gaps, circle seating, boat positions.
// Modelled on the official SOF IMO Class 2 sample papers. Imported by bank3-class-2.mjs.
import { answerChoices, choiceCount, QuestionRetry, wrong } from './bank-shared.mjs';
import { KNOWN, NAMES, choose } from './bank3-class-2-real.mjs';
import { plural } from './bank3-class-2-engines.mjs';
import { circle, line, path, svg, text, GREEN, ORANGE, PAPER } from './diagram-kit.mjs';

export const REAL3_CODES = {
  'class-2-ordinal-cardinal': { title: 'Counting or position', message: 'A cardinal number tells how many, like 9 children. An ordinal number tells the position, like 4th.' },
  'class-2-tree-gap': { title: 'Trees and gaps', message: 'With a tree at each end, there is one more tree than there are gaps. Count the gaps first.' },
  'class-2-circle-count': { title: 'Counting round a circle', message: 'Count seat by seat round the circle. After the last number comes number 1 again.' },
  'class-2-sign-compare': { title: 'Comparing two values', message: 'Work out each value first. Place value uses the digit\'s place; face value is just the digit.' },
};
Object.assign(KNOWN, REAL3_CODES);

export const REAL3_FAMILIES = {
  'class-2-place-sign': { skill: 'compare', title: 'Put the right sign between two place or face values' },
  'class-2-cardinal-ordinal': { skill: 'position', title: 'Tell cardinal numbers from ordinal numbers' },
  'class-2-tree-interval': { skill: 'sequence', title: 'Use trees and gaps along a road' },
  'class-2-circle-seats': { skill: 'position', title: 'Count seats round a circle' },
  'class-2-boat-position': { skill: 'position', title: 'Find a boat position in a row from either side' },
};

export const DRAFT = {};
export const SOLVE = {};

const ord = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
const positive = pairs => pairs.filter(([value]) => Number(String(value).replace(/\D/g, '')) > 0);

// ---------------------------------------------------------------------------
// Which sign goes between two place or face values?
// ---------------------------------------------------------------------------
const valueOf = (digit, number, kind) => (kind === 'face' ? digit : digit * 10 ** (String(number).length - 1 - String(number).indexOf(String(digit))));
const relation = (a, b) => (a > b ? '>' : a < b ? '<' : '=');
const valueName = kind => (kind === 'face' ? 'Face value' : 'Place value');
const randomNumber = (r, size) => {
  const digits = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, size);
  if (digits[0] === 0) digits.reverse();
  if (digits[0] === 0) throw new QuestionRetry('Leading zero');
  return Number(digits.join(''));
};
const pickDigit = (r, number) => Number(r.pick([...String(number)].filter(d => d !== '0')));

const placeSignOnce = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const target = r.pick(['>', '<', '=']);
  const kinds = r.pick(level === 1 ? [['place', 'place']] : [['place', 'place'], ['place', 'face'], ['face', 'face'], ['place', 'face']]);
  const size = level === 1 ? 3 : r.pick([3, 3, 4]);
  let X = randomNumber(r, size);
  let Y = randomNumber(r, size);
  let a = pickDigit(r, X);
  let b = pickDigit(r, Y);
  if (target === '=') {
    // Equal values need the same digit: in the same place, or any place for face values, or the ones place against a face value.
    if (kinds[0] === 'place' && kinds[1] === 'place') {
      const cut = r.int(0, size - 1);
      a = Number(String(X)[cut]);
      if (a === 0) throw new QuestionRetry('Zero digit');
      Y = Number(String(Y).slice(0, cut) + a + String(Y).slice(cut + 1));
      if (String(Y).includes(String(a), cut + 1) || String(Y).slice(0, cut).includes(String(a))) throw new QuestionRetry('Repeated digit');
      if (Y === X) throw new QuestionRetry('Same number');
      b = a;
    } else if (kinds[0] === 'face' && kinds[1] === 'face') {
      b = a;
      if (!String(Y).includes(String(a))) throw new QuestionRetry('Digit not in second number');
    } else {
      a = Number(String(X).slice(-1));
      if (a === 0) throw new QuestionRetry('Zero digit');
      b = a;
      if (!String(Y).includes(String(a))) throw new QuestionRetry('Digit not in second number');
    }
  }
  if ([...String(X)].filter(d => d === String(a)).length > 1 || [...String(Y)].filter(d => d === String(b)).length > 1) throw new QuestionRetry('Repeated digit');
  const A = valueOf(a, X, kinds[0]);
  const B = valueOf(b, Y, kinds[1]);
  if (relation(A, B) !== target) throw new QuestionRetry('Wrong relation');
  const options = ['>', '<', '=', 'Cannot be told'];
  return {
    family, answer: target,
    prompt: `Which sign goes in the blank? ${valueName(kinds[0])} of ${a} in ${X} ___ ${valueName(kinds[1]).toLowerCase()} of ${b} in ${Y}.`,
    hint: 'Work out each value first. Place value uses the place of the digit; face value is the digit itself.',
    explanation: `${valueName(kinds[0])} of ${a} in ${X} is ${A}. ${valueName(kinds[1])} of ${b} in ${Y} is ${B}. So ${A} ${target} ${B}.`,
    proof: { family, givens: { X, Y, a, b, kinds } },
    choices: answerChoices(target, options.filter(o => o !== target).map(o => wrong(o, 'class-2-sign-compare')), count, null, KNOWN),
  };
};
DRAFT['class-2-place-sign'] = (family, grade, level, r) => {
  let last;
  for (let tries = 0; tries < 60; tries++) {
    try {
      return placeSignOnce(family, grade, level, r);
    } catch (error) {
      if (!(error instanceof QuestionRetry)) throw error;
      last = error;
    }
  }
  throw last;
};
SOLVE['class-2-place-sign'] = q => {
  const { X, Y, a, b, kinds } = q.proof.givens;
  return relation(valueOf(a, X, kinds[0]), valueOf(b, Y, kinds[1]));
};

// ---------------------------------------------------------------------------
// Cardinal and ordinal numbers
// ---------------------------------------------------------------------------
const WORDS = ['six', 'seven', 'eight', 'nine', 'ten', 'twelve', 'fifteen', 'twenty'];
DRAFT['class-2-cardinal-ordinal'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['which', 'ordinal'] : ['cardinal', 'ordinal', 'which', 'cardinal']);
  const scene = r.pick([['A runner came', 'a race', 'runners'], ['A rocket finished', 'a race', 'rockets'], ['A robot stands', 'a line', 'robots'], ['A child is', 'a queue', 'children'], ['A team came', 'a contest', 'teams']]);
  const place = r.int(2, 9);
  const total = r.int(place + 2, place + 14);
  if (mode === 'which') {
    const word = r.pick(WORDS);
    const answer = ord(place);
    return {
      family, answer, visual: null,
      prompt: 'Which of these is an ordinal number?',
      hint: 'An ordinal number tells the position in a line, a race or a list.',
      explanation: `${answer} tells a position, so it is ordinal. ${total} and ${word} only tell how many.`,
      proof: { family, givens: { mode, place, total, word } },
      choices: choose(answer, [[String(total), 'class-2-ordinal-cardinal'], [word, 'class-2-ordinal-cardinal'], [`${total} more`, 'class-2-ordinal-cardinal'], [String(place + total), 'class-2-ordinal-cardinal']], count, r),
    };
  }
  const cardinal = mode === 'cardinal';
  const answer = cardinal ? String(total) : ord(place);
  return {
    family, answer, visual: null,
    prompt: `${scene[0]} ${ord(place)} in ${scene[1]} of ${total} ${scene[2]}. Which is the ${cardinal ? 'cardinal' : 'ordinal'} number?`,
    hint: cardinal ? 'A cardinal number tells how many there are.' : 'An ordinal number tells the position, such as 3rd.',
    explanation: `${total} tells how many ${scene[2]} there are, so it is cardinal. ${ord(place)} tells the position, so it is ordinal.`,
    proof: { family, givens: { mode, place, total } },
    choices: choose(answer, cardinal
      ? [[ord(place), 'class-2-ordinal-cardinal'], [String(place), 'class-2-ordinal-cardinal'], [ord(total), 'class-2-ordinal-cardinal'], [String(total + place), 'class-2-ordinal-cardinal']]
      : [[String(total), 'class-2-ordinal-cardinal'], [String(place), 'class-2-ordinal-cardinal'], [ord(total), 'class-2-ordinal-cardinal'], [ord(place + 1), 'class-2-ordinal-cardinal']], count, r),
  };
};
SOLVE['class-2-cardinal-ordinal'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'which' || g.mode === 'ordinal') return ord(g.place);
  return String(g.total);
};

// ---------------------------------------------------------------------------
// Trees along a road
// ---------------------------------------------------------------------------
DRAFT['class-2-tree-interval'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const mode = r.pick(level === 1 ? ['length', 'count'] : ['gap', 'length', 'count', 'gap']);
  const gap = r.pick([2, 3, 4, 5, 6, 8, 10]);
  const gaps = r.int(4, level === 1 ? 8 : 15);
  const trees = gaps + 1;
  const road = gap * gaps;
  if (mode === 'gap') {
    const answer = `${gap} m`;
    return {
      family, answer, visual: null,
      prompt: `A road is ${road} m long. ${trees} trees, equally spaced, stand along it, one at each end. How far apart are the trees?`,
      hint: 'Count the gaps between the trees. There is one gap fewer than there are trees.',
      explanation: `${trees} trees have ${gaps} gaps. ${road} m shared into ${gaps} gaps is ${gap} m each.`,
      proof: { family, givens: { mode, road, trees } },
      choices: choose(answer, positive([[`${Math.round(road / trees)} m`, 'class-2-tree-gap'], [`${Math.round(road / (trees + 1))} m`, 'class-2-tree-gap'], [`${gap + 1} m`, 'class-2-tree-gap'], [`${gap - 1} m`, 'class-2-tree-gap'], [`${gap * 2} m`, 'class-2-tree-gap']]), count, r, { numeric: true }),
    };
  }
  if (mode === 'length') {
    const answer = `${road} m`;
    return {
      family, answer, visual: null,
      prompt: `${trees} trees stand in a row, ${gap} m apart. How far is it from the first tree to the last tree?`,
      hint: 'Count the gaps between the trees, not the trees. Then multiply by the gap size.',
      explanation: `A tree at each end means ${trees} trees have ${gaps} gaps. ${gaps} x ${gap} = ${road} m.`,
      proof: { family, givens: { mode, trees, gap } },
      choices: choose(answer, positive([[`${trees * gap} m`, 'class-2-tree-gap'], [`${(trees + 1) * gap} m`, 'class-2-tree-gap'], [`${road - 1} m`, 'class-2-tree-gap'], [`${road + gap + gap} m`, 'class-2-tree-gap'], [`${road - gap - gap} m`, 'class-2-tree-gap']]), count, r, { numeric: true }),
    };
  }
  const answer = String(trees);
  return {
    family, answer, visual: null,
    prompt: `A path is ${road} m long. A lamp stands every ${gap} m, with one at each end. How many lamps are there?`,
    hint: 'Count the gaps first. A lamp stands at both ends, so there is one more lamp than gaps.',
    explanation: `${road} / ${gap} = ${gaps} gaps. With a lamp at both ends there are ${gaps} + 1 = ${trees} lamps.`,
    proof: { family, givens: { mode, road, gap } },
    choices: choose(answer, positive([[String(gaps), 'class-2-tree-gap'], [String(gaps + 2), 'class-2-tree-gap'], [String(gaps - 1), 'class-2-tree-gap'], [String(trees + gap), 'class-2-tree-gap']]), count, r, { numeric: true }),
  };
};
SOLVE['class-2-tree-interval'] = q => {
  const g = q.proof.givens;
  if (g.mode === 'gap') return `${g.road / (g.trees - 1)} m`;
  if (g.mode === 'length') return `${(g.trees - 1) * g.gap} m`;
  return String(g.road / g.gap + 1);
};

// ---------------------------------------------------------------------------
// Seats round a circle
// ---------------------------------------------------------------------------
DRAFT['class-2-circle-seats'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const size = r.pick(level === 1 ? [6, 8] : [6, 8, 10, 12]);
  const mode = r.pick(level === 1 ? ['opposite', 'steps'] : level === 2 ? ['opposite', 'steps', 'between', 'total'] : ['steps', 'between', 'total', 'back']);
  const seatWord = n => `seat ${n}`;
  const wrap = n => ((n - 1 + size * 4) % size) + 1;
  if (mode === 'total') {
    const from = r.int(1, size / 2);
    const to = from + size / 2;
    return {
      family, answer: String(size), visual: null,
      prompt: `Children sit round a circle in numbered seats, equally spaced. Seat ${from} is exactly opposite seat ${to}. How many children are there?`,
      hint: 'Opposite seats are halfway round, so the gap between them is half the circle.',
      explanation: `From seat ${from} to seat ${to} is ${to} - ${from} = ${size / 2} steps. That is half the circle, so ${size / 2} + ${size / 2} = ${size}.`,
      proof: { family, givens: { mode, size, from } },
      choices: choose(String(size), positive([[String(size / 2), 'class-2-circle-count'], [String(size + 2), 'class-2-circle-count'], [String(size - 2), 'class-2-circle-count'], [String(to), 'class-2-circle-count'], [String(size + 1), 'class-2-circle-count']]), count, r, { numeric: true }),
    };
  }
  if (mode === 'back') {
    const from = r.int(1, size - 3);
    const move = r.int(from + 1, size - 1);
    const answer = wrap(from - move);
    return {
      family, answer: String(answer), visual: null,
      prompt: `${size} children sit round a circle in seats 1 to ${size}, numbered clockwise. Move ${move} seats anticlockwise from ${seatWord(from)}. Which seat is it?`,
      hint: 'Anticlockwise means counting down. After seat 1, go to the last seat.',
      explanation: `${from} - ${move} is below 1, so add ${size}: ${from} - ${move} + ${size} = ${answer}.`,
      proof: { family, givens: { mode, size, from, move } },
      choices: choose(String(answer), positive([[String(from + move > size ? from + move - size : from + move), 'class-2-circle-count'], [String(answer + 1), 'class-2-circle-count'], [String(answer - 1), 'class-2-circle-count'], [String(move - from), 'class-2-circle-count'], [String(size - from), 'class-2-circle-count']]), count, r, { numeric: true }),
    };
  }
  if (mode === 'opposite') {
    const from = r.int(1, size);
    const answer = wrap(from + size / 2);
    return {
      family, answer: String(answer), visual: null,
      prompt: `${size} children sit round a circle, equally spaced, in seats numbered 1 to ${size}. Who sits opposite ${seatWord(from)}?`,
      hint: 'Opposite is exactly halfway round the circle. Half the children is the number of steps.',
      explanation: from + size / 2 > size
        ? `Halfway round is ${size / 2} seats. ${from} + ${size / 2} = ${from + size / 2}, past ${size}, so take away ${size}: seat ${answer}.`
        : `Halfway round is ${size / 2} seats. ${from} + ${size / 2} lands on seat ${answer}.`,
      proof: { family, givens: { mode, size, from } },
      choices: choose(String(answer), positive([[String(wrap(answer + 1)), 'class-2-circle-count'], [String(wrap(answer - 1)), 'class-2-circle-count'], [String(from + size / 2), 'class-2-circle-count'], [String(size - from), 'class-2-circle-count'], [String(wrap(from + size / 2 - 2)), 'class-2-circle-count']]), count, r, { numeric: true }),
    };
  }
  if (mode === 'steps') {
    const from = r.int(2, size);
    const move = r.int(2, size - 1);
    const answer = wrap(from + move);
    if (from + move <= size) throw new QuestionRetry('No wrap-around');
    return {
      family, answer: String(answer), visual: null,
      prompt: `${size} children sit round a circle in seats 1 to ${size}, numbered clockwise. Move ${move} seats clockwise from ${seatWord(from)}. Which seat is it?`,
      hint: 'Count seat by seat. After the last seat, go back to seat 1.',
      explanation: `${from} + ${move} = ${from + move}. That is past ${size}, so take away ${size}: seat ${answer}.`,
      proof: { family, givens: { mode, size, from, move } },
      choices: choose(String(answer), positive([[String(from + move), 'class-2-circle-count'], [String(answer + 1), 'class-2-circle-count'], [String(answer - 1), 'class-2-circle-count'], [String(from - move + size), 'class-2-circle-count'], [String(from + move - size + 2), 'class-2-circle-count']]), count, r, { numeric: true }),
    };
  }
  const from = r.int(1, size - 4);
  const to = r.int(from + 3, size);
  const answer = to - from - 1;
  return {
    family, answer: String(answer), visual: null,
    prompt: `${size} children sit round a circle in seats 1 to ${size}, numbered clockwise. How many children sit between seat ${from} and seat ${to}, going clockwise?`,
    hint: 'Do not count the two end seats. Count only the seats in the middle.',
    explanation: `${to} - ${from} = ${to - from}. Take away the seat you start on: ${to - from} - 1 = ${answer}.`,
    proof: { family, givens: { mode, size, from, to } },
    choices: choose(String(answer), positive([[String(to - from), 'class-2-circle-count'], [String(to - from + 1), 'class-2-circle-count'], [String(size - to + from - 1), 'class-2-circle-count'], [String(answer - 1), 'class-2-circle-count'], [String(answer + 2), 'class-2-circle-count']]), count, r, { numeric: true }),
  };
};
SOLVE['class-2-circle-seats'] = q => {
  const g = q.proof.givens;
  const wrap = n => ((n - 1 + g.size * 4) % g.size) + 1;
  if (g.mode === 'total') return String(g.size);
  if (g.mode === 'back') return String(wrap(g.from - g.move));
  if (g.mode === 'opposite') return String(wrap(g.from + g.size / 2));
  if (g.mode === 'steps') return String(wrap(g.from + g.move));
  return String(g.to - g.from - 1);
};

// ---------------------------------------------------------------------------
// A row of boats
// ---------------------------------------------------------------------------
const BOAT_LETTERS = 'ABCDEFGHKLMNPRSTW';
DRAFT['class-2-boat-position'] = (family, grade, level, r) => {
  const count = choiceCount(grade);
  const size = r.int(level === 1 ? 5 : 6, 8);
  const letters = r.shuffle([...BOAT_LETTERS]).slice(0, size);
  const mode = r.pick(level === 1 ? ['from-right', 'left-of'] : ['from-right', 'left-of', 'letter']);
  const spot = r.int(2, size - 1);
  const ring = mode === 'letter' ? null : spot - 1;
  const visual = {
    kind: 'v3-class-2-boats', letters, ring,
    description: `A row of ${size} boats labelled ${letters.join(', ')} from left to right${ring === null ? '.' : `, and the encircled boat is labelled ${letters[ring]}.`}`,
  };
  if (mode === 'from-right') {
    const answer = ord(size - spot + 1);
    return {
      family, answer, visual,
      prompt: `The encircled boat is ${ord(spot)} from the left. What place is it from the right?`,
      hint: 'Count all the boats in the row first. Then count the boats that sit to its right.',
      explanation: `There are ${size} boats. ${size} - ${spot} = ${size - spot}, so ${plural(size - spot, 'boat')} on its right. It is ${answer} from the right.`,
      proof: { family, givens: { mode, spot } },
      choices: choose(answer, positive([[ord(size - spot), 'class-2-row-count'], [ord(spot), 'class-2-row-count'], [ord(size - spot + 2), 'class-2-row-count'], [ord(size - spot + 1 + 2), 'class-2-row-count'], [ord(size - spot - 1), 'class-2-row-count']]), count, r),
    };
  }
  if (mode === 'left-of') {
    const answer = String(spot - 1);
    return {
      family, answer, visual,
      prompt: 'How many boats are to the left of the encircled boat?',
      hint: 'Do not count the encircled boat itself. Count only the boats before it.',
      explanation: `The encircled boat is ${ord(spot)} from the left. The number of boats before it is ${spot} - 1 = ${spot - 1}.`,
      proof: { family, givens: { mode, spot } },
      choices: choose(answer, positive([[String(spot), 'class-2-row-count'], [String(spot + 1), 'class-2-row-count'], [String(size - spot), 'class-2-row-count'], [String(size - spot + 1), 'class-2-row-count'], [String(spot - 2), 'class-2-row-count']]), count, r, { numeric: true }),
    };
  }
  const fromRight = r.int(2, size - 1);
  const answer = letters[size - fromRight];
  return {
    family, answer, visual,
    prompt: `Which letter is on the boat that is ${ord(fromRight)} from the right?`,
    hint: 'Start at the right end of the row and count towards the left.',
    explanation: `Counting from the right, the ${ord(fromRight)} boat is boat ${answer}.`,
    proof: { family, givens: { mode, fromRight } },
    choices: choose(answer, [[letters[fromRight - 1], 'class-2-row-count'], [letters[size - fromRight - 1], 'class-2-row-count'], [letters[Math.min(size - 1, size - fromRight + 1)], 'class-2-row-count'], [letters[0], 'class-2-row-count'], [letters[size - 1], 'class-2-row-count']], count, r),
  };
};
SOLVE['class-2-boat-position'] = q => {
  const g = q.proof.givens;
  const size = q.visual.letters.length;
  if (g.mode === 'from-right') return ord(size - g.spot + 1);
  if (g.mode === 'left-of') return String(g.spot - 1);
  return q.visual.letters[size - g.fromRight];
};

const renderBoats = visual => {
  const size = visual.letters.length;
  const step = 460 / size;
  let body = '';
  visual.letters.forEach((letter, i) => {
    const cx = 10 + step * (i + 0.5);
    body += path(`M${cx - 20} 92 L${cx + 20} 92 L${cx + 12} 110 L${cx - 12} 110 Z`, { fill: '#8aa9c9' });
    body += line(cx, 92, cx, 52, { width: 3 });
    body += path(`M${cx + 3} 54 L${cx + 3} 88 L${cx + 24} 88 Z`, { fill: PAPER });
    body += text(cx, 140, letter, { size: 20, weight: 800 });
  });
  if (visual.ring !== null) {
    const cx = 10 + step * (visual.ring + 0.5);
    body += circle(cx, 84, Math.min(34, step / 2), { fill: 'none', stroke: ORANGE, strokeWidth: 4 });
  }
  body += path('M0 112 Q 30 104 60 112 T 120 112 T 180 112 T 240 112 T 300 112 T 360 112 T 420 112 T 480 112', { stroke: GREEN, strokeWidth: 3 });
  return svg(body, visual.description, 480, 160);
};

export function renderReal3(visual) {
  if (visual.kind === 'v3-class-2-boats') return renderBoats(visual);
  return null;
}
