// Real-paper style everyday Class 3 families: measurement, time and money.
import { QuestionRetry } from './bank-shared.mjs';
import { DAYS, person } from './bank3-class-3-helpers.mjs';
import { UNIT_PAIRS, count, measureText, measureValue, numberQ, sum, textQ } from './bank3-class-3-kit.mjs';

export const DRAFT = {};
export const SOLVE = {};
export const FAMILIES = {
  'class-3-mixed-units': { skill: 'measure', title: 'Add or take away litres, kilograms and metres' },
  'class-3-longest-length': { skill: 'measure', title: 'Find the longest or heaviest of four amounts' },
  'class-3-closest-qty': { skill: 'measure', title: 'Pick the closest real-life amount' },
  'class-3-weigh-items': { skill: 'measure', title: 'Read two dial scales and work out a mass' },
  'class-3-route-pick': { skill: 'routes', title: 'Find a route length on a road map' },
  'class-3-trail-gap': { skill: 'measure', title: 'Find a missing part of a trail' },
  'class-3-elapsed-words': { skill: 'time', title: 'Find how long an event lasts or when it ends' },
  'class-3-time-after': { skill: 'time', title: 'Find the time a few hours before or after' },
  'class-3-day-count': { skill: 'calendar', title: 'Count days, weeks and weekdays' },
  'class-3-time-units': { skill: 'time', title: 'Change between hours, minutes and seconds' },
  'class-3-toy-trio': { skill: 'money', title: 'Pick toys that cost exactly a given amount' },
  'class-3-price-times': { skill: 'money', title: 'Work out the cost or change for several items' },
  'class-3-big-price': { skill: 'money', title: 'Add and compare four-digit prices' },
  'class-3-note-count': { skill: 'money', title: 'Count the notes that make an amount' },
};

const amountText = (pair, value) => measureText(pair, Math.floor(value / pair.k), value % pair.k);

const MIXED_ADD = {
  capacity: (w, a, b) => `${w} drinks ${a} of milk in the morning and ${b} at night. How much milk is that in all?`,
  mass: (w, a, b) => `${w} buys ${a} of rice and ${b} of sugar. What is the total mass?`,
  length: (w, a, b) => `A red ribbon is ${a} long and a blue ribbon is ${b} long. How long are they together?`,
  distance: (w, a, b) => `${w} walks ${a} to the shop and ${b} to the park. How far does ${w} walk in all?`,
};
const MIXED_SUB = {
  capacity: (w, a, b) => `A jug has ${a} of juice. ${w} pours out ${b}. How much juice is left?`,
  mass: (w, a, b) => `A sack holds ${a} of flour. ${w} uses ${b}. How much flour is left?`,
  length: (w, a, b) => `A rope is ${a} long. ${w} cuts off ${b}. How long is the rest?`,
  distance: (w, a, b) => `A trail is ${a} long. ${w} has walked ${b}. How far is left to walk?`,
};
const MIXED_THREE = {
  capacity: (w, a, b, c) => `A tank has ${a} of water. ${b} more is added. Then ${c} is used. How much water is left?`,
  mass: (w, a, b, c) => `A sack holds ${a} of rice. ${w} adds ${b} more and sells ${c}. How much rice is left?`,
  length: (w, a, b, c) => `A rope is ${a} long. ${w} ties on ${b} more and cuts off ${c}. How long is it now?`,
  distance: (w, a, b, c) => `${w} walks ${a} east, then ${b} further east, then ${c} back west. How far is ${w} from the start?`,
};

function mixedValue(kind, a, b, c) {
  if (kind === 'add') return a + b;
  if (kind === 'sub') return a - b;
  return a + b - c;
}

function draftMixedUnits(family, grade, level, r) {
  const key = r.pick(level === 1 ? ['capacity', 'mass'] : ['capacity', 'mass', 'length', 'distance']);
  const pair = UNIT_PAIRS[key];
  const grain = pair.k === 100 ? 5 : 25;
  const rest = () => r.int(1, pair.k / grain - 1) * grain;
  const part = high => r.int(1, high) * pair.k + rest();
  const kind = level === 1 ? 'add' : r.pick(level === 2 ? ['add', 'sub', 'sub'] : ['sub', 'three', 'add']);
  const a = part(level === 1 ? 3 : 6);
  const b = r.int(0, 1) === 1 ? rest() : part(level === 1 ? 2 : 4);
  const c = r.int(1, 3) * grain * r.int(1, 4);
  if (kind === 'sub' && b >= a) throw new QuestionRetry('subtract needs a smaller second amount');
  if (kind === 'three' && c >= a + b) throw new QuestionRetry('used too much');
  const w = person(r);
  const text = value => amountText(pair, value);
  const prompt = kind === 'add' ? MIXED_ADD[key](w, text(a), text(b)) : kind === 'sub' ? MIXED_SUB[key](w, text(a), text(b)) : MIXED_THREE[key](w, text(a), text(b), text(c));
  const answer = mixedValue(kind, a, b, c);
  const wrongs = [];
  if (kind === 'add' && (a % pair.k) + (b % pair.k) >= pair.k) {
    wrongs.push([`${Math.floor(a / pair.k) + Math.floor(b / pair.k)} ${pair.big} ${(a % pair.k) + (b % pair.k)} ${pair.small}`, 'class-3-unit-carry']);
  }
  [[answer + pair.k, 'class-3-unit-carry'], [answer - pair.k, 'class-3-unit-carry'], [answer + grain, 'missing-step'], [answer - grain, 'missing-step'], [answer + pair.k / 2, 'unit-conversion']].forEach(([value, code]) => {
    if (value > 0) wrongs.push([typeof value === 'string' ? value : text(value), code]);
  });
  return textQ({
    family,
    prompt,
    answer: text(answer),
    hint: 'Change big units to small units first, or add the small units and carry. Then write the answer in big and small units.',
    explanation: `${kind === 'add' ? `${text(a)} + ${text(b)}` : kind === 'sub' ? `${text(a)} − ${text(b)}` : `${text(a)} + ${text(b)} − ${text(c)}`} = ${text(answer)}.`,
    givens: { key, kind, a, b, c },
    wrongs,
  });
}

function solveMixedUnits(question) {
  const { key, kind, a, b, c } = question.proof.givens;
  return amountText(UNIT_PAIRS[key], mixedValue(kind, a, b, c));
}
DRAFT['class-3-mixed-units'] = draftMixedUnits;
SOLVE['class-3-mixed-units'] = solveMixedUnits;

const LONGEST_WORDS = {
  length: [['longest', 'max'], ['shortest', 'min']],
  mass: [['heaviest', 'max'], ['lightest', 'min']],
  capacity: [['most', 'max'], ['least', 'min']],
};

function formatAmount(pair, value, preferSmall) {
  if (preferSmall || value % pair.k === 0 || value < pair.k) return `${value} ${pair.small}`;
  return amountText(pair, value);
}

function draftLongest(family, grade, level, r) {
  const key = r.pick(level === 1 ? ['length', 'mass'] : ['length', 'mass', 'capacity']);
  const pair = UNIT_PAIRS[key];
  const step = pair.k / (level === 1 ? 4 : level === 2 ? 10 : 20);
  const base = r.int(2, 8) * pair.k + pair.k / 2;
  const jitter = r.shuffle([-3, -2, -1, 0, 1, 2, 3]).slice(0, 4);
  const values = jitter.map(offset => base + offset * step);
  const forms = values.map(value => formatAmount(pair, value, r.int(0, 1) === 1));
  if (new Set(forms).size < 4 || !forms.some(form => form.includes(` ${pair.big} `)) || !forms.some(form => !form.includes(` ${pair.big} `))) throw new QuestionRetry('needs mixed forms');
  const [word, mode] = r.pick(LONGEST_WORDS[key]);
  const w = person(r);
  const prompt = key === 'length'
    ? `${w} measures four ribbons. Which ribbon is the ${word}?`
    : key === 'mass' ? `${w} weighs four parcels. Which parcel is the ${word}?` : `${w} fills four bottles. Which bottle holds the ${word} water?`;
  const target = mode === 'max' ? Math.max(...values) : Math.min(...values);
  const answer = forms[values.indexOf(target)];
  return textQ({
    family,
    prompt,
    answer,
    hint: 'Change every amount to the same small unit before you compare.',
    explanation: `In ${pair.small}, the amounts are ${values.join(', ')}. The ${word} is ${answer}.`,
    givens: { key, mode, forms },
    wrongs: forms.filter(form => form !== answer).map(form => [form, 'unit-conversion']),
  });
}

function solveLongest(question) {
  const { key, mode } = question.proof.givens;
  const pair = UNIT_PAIRS[key];
  const values = question.options.map(option => measureValue(option, pair));
  const target = mode === 'max' ? Math.max(...values) : Math.min(...values);
  return question.options[values.indexOf(target)];
}
DRAFT['class-3-longest-length'] = draftLongest;
SOLVE['class-3-longest-length'] = solveLongest;

const UNIT_VALUE = { mm: 0.1, cm: 1, m: 100, km: 100000, mL: 1, L: 1000, g: 1, kg: 1000 };
const qtyValue = text => [...text.matchAll(/(\d+) ([A-Za-z]+)/g)].reduce((total, [, amount, unit]) => total + Number(amount) * UNIT_VALUE[unit], 0);

const QUANTITIES = [
  ['the water a glass holds', '250 mL', ['25 mL', '2 L', '25 L', '2 mL']],
  ['the water in a bucket', '10 L', ['100 mL', '1 L', '100 L', '1 mL']],
  ['one spoon of medicine', '5 mL', ['50 mL', '500 mL', '5 L', '1 L']],
  ['the milk in a cup', '200 mL', ['20 mL', '2 L', '20 L', '2 mL']],
  ['the water in a bathtub', '150 L', ['15 L', '150 mL', '15 mL', '1500 L']],
  ['the mass of an apple', '150 g', ['15 g', '1 kg 500 g', '15 kg', '1 g']],
  ['the mass of a school bag', '3 kg', ['30 g', '300 g', '30 kg', '3 g']],
  ['the mass of a pencil', '10 g', ['1 g', '100 g', '1 kg', '10 kg']],
  ['the mass of a cat', '4 kg', ['40 g', '400 g', '40 kg', '4 g']],
  ['the mass of a watermelon', '5 kg', ['50 g', '500 g', '50 kg', '5 g']],
  ['the mass of an egg', '50 g', ['5 g', '500 g', '5 kg', '50 kg']],
  ['the mass of a bicycle', '15 kg', ['150 g', '1 kg', '150 kg', '15 g']],
  ['the length of a pencil', '15 cm', ['15 mm', '15 m', '150 cm', '1 cm']],
  ['the height of a door', '2 m', ['20 cm', '20 m', '200 m', '2 cm']],
  ['the length of a classroom', '8 m', ['80 cm', '80 m', '8 km', '8 cm']],
  ['the length of a bus', '10 m', ['1 m', '100 m', '1 km', '10 cm']],
  ['the height of a child aged 8', '130 cm', ['13 cm', '13 m', '1300 cm', '13 mm']],
  ['the width of a thumb', '2 cm', ['2 mm', '20 cm', '2 m', '20 m']],
  ['the distance from home to school', '2 km', ['20 m', '200 m', '20 km', '2 m']],
  ['the length of a football pitch', '100 m', ['10 m', '1 m', '10 km', '100 km']],
];

function draftClosest(family, grade, level, r) {
  const [thing, good, decoys] = r.pick(QUANTITIES);
  const chosen = r.shuffle(decoys).slice(0, 3);
  const prompt = r.pick([`Which is the best estimate for ${thing}?`, `Which amount is closest to ${thing}?`, `${person(r)} guesses ${thing}. Which guess is the most sensible?`]);
  return textQ({
    family,
    prompt,
    answer: good,
    hint: 'Think of something you know, such as a bottle or a door. Then choose the unit that fits.',
    explanation: `${good} is a sensible size for ${thing}. The other amounts are far too big or too small.`,
    givens: { good },
    wrongs: chosen.map(value => [value, 'unit-conversion']),
  });
}

function solveClosest(question) {
  const base = qtyValue(question.proof.givens.good);
  const distance = option => Math.abs(Math.log(qtyValue(option) / base));
  return [...question.options].sort((x, y) => distance(x) - distance(y))[0];
}
DRAFT['class-3-closest-qty'] = draftClosest;
SOLVE['class-3-closest-qty'] = solveClosest;

const DIALS = [['kg', 10], ['kg', 20], ['kg', 50], ['g', 500], ['g', 1000]];
const DIAL_NAMES = [['P', 'Q'], ['A', 'B'], ['X', 'Y'], ['M', 'N'], ['R', 'S']];

function draftWeigh(family, grade, level, r) {
  const [unit, max] = r.pick(DIALS);
  const step = max / 10;
  const kind = r.pick(level === 1 ? ['sum', 'diff'] : level === 2 ? ['sum', 'diff', 'times'] : ['pack', 'times', 'diff']);
  let tickA = r.int(1, 9);
  let tickB = r.int(1, 9);
  if (kind === 'times') {
    const factor = r.int(2, 4);
    tickA = r.int(1, Math.floor(9 / factor));
    tickB = tickA * factor;
  }
  if (tickA === tickB) throw new QuestionRetry('equal dials');
  if (kind === 'diff' && tickB < tickA) [tickA, tickB] = [tickB, tickA];
  const [one, two] = r.pick(DIAL_NAMES);
  const a = tickA * step;
  const b = tickB * step;
  const extra = r.int(1, 4) * (unit === 'kg' ? Math.max(1, step) : 50);
  const names = unit === 'kg' ? 'kilograms' : 'grams';
  const base = { family, hint: 'Read each dial pointer at its mark. Then work out the answer.' };
  const visual = {
    kind: 'v3-class-3-scales', max, unit,
    items: [{ label: `Box ${one}`, value: a }, { label: `Box ${two}`, value: b }],
    description: `Two dial scales that go up to ${max} ${unit}. Box ${one} shows ${a} ${unit} and box ${two} shows ${b} ${unit}.`,
  };
  let answer;
  let prompt;
  let explanation;
  const wrongs = [];
  if (kind === 'sum') {
    answer = a + b;
    prompt = `Box ${one} and box ${two} are put on one tray. How many ${names} do they weigh together?`;
    explanation = `${a} + ${b} = ${answer} ${unit}.`;
    wrongs.push([Math.abs(a - b), 'wrong-operation'], [Math.max(a, b), 'missing-step']);
  } else if (kind === 'diff') {
    answer = b - a;
    prompt = `How many ${names} heavier is box ${two} than box ${one}?`;
    explanation = `${b} − ${a} = ${answer} ${unit}.`;
    wrongs.push([a + b, 'wrong-operation'], [b, 'missing-step']);
  } else if (kind === 'times') {
    answer = tickB / tickA;
    prompt = `Box ${two} weighs how many times as much as box ${one}?`;
    explanation = `${b} ÷ ${a} = ${answer}.`;
    wrongs.push([b - a, 'wrong-operation'], [tickB, 'missing-step']);
  } else {
    answer = a + b + extra;
    prompt = `Box ${one} and box ${two} go into a carton that weighs ${extra} ${unit}. How many ${names} is that in all?`;
    explanation = `${a} + ${b} = ${a + b}. Add the carton: ${a + b} + ${extra} = ${answer} ${unit}.`;
    wrongs.push([a + b, 'missing-step'], [Math.abs(a - b) + extra, 'wrong-operation']);
  }
  return numberQ(r, { ...base, prompt, answer, explanation, givens: { kind, extra }, wrongs, visual, min: 1, max: 9999 });
}

function solveWeigh(question) {
  const { kind, extra } = question.proof.givens;
  const [a, b] = question.visual.items.map(item => item.value);
  if (kind === 'sum') return a + b;
  if (kind === 'diff') return Math.abs(b - a);
  if (kind === 'times') return b / a;
  return a + b + extra;
}
DRAFT['class-3-weigh-items'] = draftWeigh;
SOLVE['class-3-weigh-items'] = solveWeigh;

const TOWNS = 'ABCDEFGHJKLMNRSTUVWZ';
const ROAD_SPOTS = [[44, 115], [210, 44], [210, 186], [396, 115]];

function roadPaths(edges, from, to) {
  const found = [];
  const walk = (node, trail, length) => {
    if (node === to) {
      found.push({ trail, length });
      return;
    }
    edges.forEach(edge => {
      const next = edge.a === node ? edge.b : edge.b === node ? edge.a : null;
      if (next && !trail.includes(next)) walk(next, [...trail, next], length + edge.km);
    });
  };
  walk(from, [from], 0);
  return found;
}

function draftRoutes(family, grade, level, r) {
  const names = r.shuffle([...TOWNS]).slice(0, 4);
  const [s, p, qn, e] = names;
  const top = level === 1 ? 12 : 18;
  const km = () => r.int(3, top);
  const edges = [{ a: s, b: p, km: km() }, { a: s, b: qn, km: km() }, { a: p, b: e, km: km() }, { a: qn, b: e, km: km() }, { a: p, b: qn, km: r.int(2, 8) }];
  const nodes = names.map((name, index) => ({ name, x: ROAD_SPOTS[index][0], y: ROAD_SPOTS[index][1] }));
  const visual = {
    kind: 'v3-class-3-roads', nodes, edges,
    description: `Road map with four towns ${s}, ${p}, ${qn} and ${e}. Roads: ${edges.map(edge => `${edge.a} to ${edge.b} ${edge.km} km`).join(', ')}.`,
  };
  const kind = r.pick(level === 1 ? ['via', 'via', 'read'] : level === 2 ? ['shortest', 'longest'] : ['pick-shortest', 'pick-longest', 'shortest']);
  const base = { family, hint: 'Add the road lengths on each route. Never visit the same town twice.', visual };
  const paths = roadPaths(edges, s, e);
  const lengths = paths.map(item => item.length).sort((x, y) => x - y);
  const unique = (kind.includes('longest') ? lengths[lengths.length - 1] !== lengths[lengths.length - 2] : lengths[0] !== lengths[1]);
  if (kind === 'via') {
    const answer = edges[0].km + edges[2].km;
    return numberQ(r, { ...base, prompt: `How far is it from ${s} to ${e} if you go through ${p}?`, answer, explanation: `${edges[0].km} + ${edges[2].km} = ${answer} km.`, givens: { kind, from: s, to: e, via: p }, wrongs: [[edges[1].km + edges[3].km, 'path-constraint'], [edges[0].km + edges[4].km, 'path-constraint']], min: 2, max: 99 });
  }
  if (kind === 'read') {
    const answer = edges[4].km;
    return numberQ(r, { ...base, prompt: `How long is the road from ${p} to ${qn}?`, answer, explanation: `The road between ${p} and ${qn} is ${answer} km.`, givens: { kind, from: p, to: qn }, wrongs: [[edges[0].km, 'missing-step'], [edges[2].km, 'missing-step']], min: 1, max: 99 });
  }
  if (!unique) throw new QuestionRetry('tied routes');
  const longest = kind.includes('longest');
  const word = longest ? 'longest' : 'shortest';
  const target = longest ? lengths[lengths.length - 1] : lengths[0];
  if (kind === 'shortest' || kind === 'longest') {
    return numberQ(r, {
      ...base,
      prompt: `${r.pick(['A bus', 'A cyclist', 'A van'])} goes from ${s} to ${e} without visiting a town twice. How long is the ${word} route?`,
      answer: target,
      explanation: `Routes: ${paths.map(item => `${item.trail.join('-')} = ${item.length} km`).join('; ')}. The ${word} is ${target} km.`,
      givens: { kind, from: s, to: e },
      wrongs: paths.filter(item => item.length !== target).map(item => [item.length, 'path-constraint']),
      min: 2, max: 99,
    });
  }
  const best = paths.find(item => item.length === target);
  return textQ({
    ...base,
    prompt: `Which route from ${s} to ${e} is the ${word} one?`,
    answer: best.trail.join('-'),
    explanation: `Routes: ${paths.map(item => `${item.trail.join('-')} = ${item.length} km`).join('; ')}. The ${word} is ${best.trail.join('-')}.`,
    givens: { kind, from: s, to: e },
    wrongs: paths.filter(item => item !== best).map(item => [item.trail.join('-'), 'path-constraint']),
  });
}

function solveRoutes(question) {
  const { kind, from, to, via } = question.proof.givens;
  const { edges } = question.visual;
  const length = (x, y) => edges.find(edge => (edge.a === x && edge.b === y) || (edge.a === y && edge.b === x)).km;
  if (kind === 'via') return length(from, via) + length(via, to);
  if (kind === 'read') return length(from, to);
  const paths = roadPaths(edges, from, to);
  const longest = kind.includes('longest');
  const pick = (a, b) => (longest ? b.length - a.length : a.length - b.length);
  const best = [...paths].sort(pick)[0];
  return kind.startsWith('pick') ? best.trail.join('-') : best.length;
}
DRAFT['class-3-route-pick'] = draftRoutes;
SOLVE['class-3-route-pick'] = solveRoutes;

function draftTrail(family, grade, level, r) {
  const stops = level === 1 ? 4 : 5;
  const points = [...r.shuffle([...TOWNS]).slice(0, stops)].sort();
  const unit = r.pick(['m', 'km']);
  const grain = unit === 'm' ? 50 : 5;
  const legs = Array.from({ length: stops - 1 }, () => r.int(2, unit === 'm' ? 9 : 8) * grain);
  const total = sum(legs);
  const kind = level === 3 ? 'span' : level === 2 ? r.pick(['leg', 'span']) : 'leg';
  const hidden = r.int(0, legs.length - 1);
  const shown = kind === 'leg' ? legs.map((leg, index) => (index === hidden ? null : leg)) : legs;
  const from = kind === 'leg' ? hidden : r.int(0, stops - 3);
  const to = kind === 'leg' ? hidden + 1 : r.int(from + 2, stops - 1);
  const answer = kind === 'leg' ? legs[hidden] : sum(legs.slice(from, to));
  if (kind === 'span' && from === 0 && to === stops - 1) throw new QuestionRetry('whole trail');
  const known = sum(shown.filter(leg => leg !== null));
  const visual = {
    kind: 'v3-class-3-trail', points, legs: shown, total, unit,
    description: `A trail through ${points.join(', ')}. ${shown.map((leg, index) => `${points[index]} to ${points[index + 1]} is ${leg === null ? 'not shown' : `${leg} ${unit}`}`).join('; ')}. ${points[0]} to ${points[stops - 1]} is ${total} ${unit} in all.`,
  };
  const wrongs = kind === 'leg'
    ? [[known, 'wrong-operation'], [total, 'missing-step'], [Math.abs(total - known - grain), 'missing-step']]
    : [[total, 'ignored-condition'], [answer + legs[from], 'counted-endpoints'], [Math.max(grain, answer - legs[to - 1]), 'counted-endpoints']];
  return numberQ(r, {
    family,
    prompt: `A trail goes through ${points.join(', ')} in order. How far is it from ${points[from]} to ${points[to]} in ${unit === 'm' ? 'metres' : 'kilometres'}?`,
    answer,
    hint: kind === 'leg' ? 'The parts add up to the whole trail. Take the parts you know away from the whole.' : 'Add only the parts between the two named points.',
    explanation: kind === 'leg' ? `${total} − ${known} = ${answer} ${unit}.` : `${legs.slice(from, to).join(' + ')} = ${answer} ${unit}.`,
    givens: { kind, from, to },
    visual, wrongs, min: 1, max: 9999,
  });
}

function solveTrail(question) {
  const { kind, from, to } = question.proof.givens;
  const { legs, total } = question.visual;
  if (kind === 'leg') return total - sum(legs.filter(leg => leg !== null));
  return sum(legs.slice(from, to));
}
DRAFT['class-3-trail-gap'] = draftTrail;
SOLVE['class-3-trail-gap'] = solveTrail;

const t12 = minutes => {
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'am' : 'pm'}`;
};
const span = minutes => {
  if (minutes < 60) return count(minutes, 'minute');
  const hours = count(Math.floor(minutes / 60), 'hour');
  return minutes % 60 ? `${hours} ${count(minutes % 60, 'minute')}` : hours;
};
const inDay = minutes => minutes >= 60 && minutes < 1440;

const EVENTS = ['A film', 'A cricket match', 'A school trip', 'A birthday party', 'A science fair', 'A concert'];

function draftElapsed(family, grade, level, r) {
  const grain = level === 1 ? 30 : 5;
  const start = r.int((level === 1 ? 6 * 60 : 7 * 60) / grain, (level === 1 ? 11 * 60 : 14 * 60) / grain) * grain;
  const length = level === 1 ? r.int(2, 9) * 60 + r.int(0, 1) * 30 : r.int(15, 120) * 5;
  const end = start + length;
  if (!inDay(end) || end > 23 * 60 + 50) throw new QuestionRetry('past midnight');
  const kind = r.pick(level === 1 ? ['length'] : level === 2 ? ['length', 'length', 'end'] : ['length', 'end', 'start']);
  const event = r.pick(EVENTS);
  const spec = { family, hint: 'Count the hours first, then the extra minutes. Check am and pm.', givens: { kind, start, length }, };
  const flips = value => [value + 720, value - 720].filter(inDay);
  if (kind === 'length') {
    const wrongs = [[length + 60, 'hour-carry'], [Math.max(5, length - 60), 'hour-carry'], [length + 30, 'clock-error'], [Math.max(5, Math.abs((end % 720) - (start % 720))), 'clock-error']];
    return textQ({ ...spec, prompt: `${event} starts at ${t12(start)} and ends at ${t12(end)}. How long does it last?`, answer: span(length), explanation: `From ${t12(start)} to ${t12(end)} is ${span(length)}.`, wrongs: wrongs.map(([value, code]) => [span(value), code]) });
  }
  if (kind === 'end') {
    const wrongs = [[end + 60, 'hour-carry'], [end - 60, 'hour-carry'], ...flips(end).map(value => [value, 'clock-error']), [end + 10, 'clock-error'], [end - 10, 'clock-error']];
    return textQ({ ...spec, prompt: `${event} starts at ${t12(start)} and lasts ${span(length)}. At what time does it end?`, answer: t12(end), explanation: `${t12(start)} plus ${span(length)} is ${t12(end)}.`, wrongs: wrongs.filter(([value]) => inDay(value)).map(([value, code]) => [t12(value), code]) });
  }
  const wrongs = [[end + length, 'time-direction'], [start + 60, 'hour-carry'], [start - 60, 'hour-carry'], ...flips(start).map(value => [value, 'clock-error'])];
  return textQ({ ...spec, prompt: `${event} ends at ${t12(end)} and lasted ${span(length)}. At what time did it start?`, answer: t12(start), explanation: `${t12(end)} minus ${span(length)} is ${t12(start)}.`, wrongs: wrongs.filter(([value]) => inDay(value)).map(([value, code]) => [t12(value), code]) });
}

function solveElapsed(question) {
  const { kind, start, length } = question.proof.givens;
  if (kind === 'length') return span(length);
  return kind === 'end' ? t12(start + length) : t12(start);
}
DRAFT['class-3-elapsed-words'] = draftElapsed;
SOLVE['class-3-elapsed-words'] = solveElapsed;

function draftTimeAfter(family, grade, level, r) {
  const before = level === 3 && r.int(0, 1) === 1;
  const start = (level === 1 ? r.int(2, 9) * 12 + 2 : r.int(15, 270)) * 5;
  const length = level === 1 ? r.int(1, 6) * 60 : r.int(1, level === 2 ? 4 : 8) * 60 + r.int(1, 11) * 5;
  const result = before ? start - length : start + length;
  if (!inDay(result) || !inDay(start)) throw new QuestionRetry('crosses midnight');
  const flips = value => [value + 720, value - 720].filter(inDay);
  const wrongs = [[result + 60, 'hour-carry'], [result - 60, 'hour-carry'], ...flips(result).map(value => [value, 'clock-error']), [before ? start + length : start - length, 'time-direction'], [result + 10, 'clock-error'], [result - 10, 'clock-error']];
  return textQ({
    family,
    prompt: before ? `What time was it ${span(length)} before ${t12(start)}?` : `What time is ${span(length)} after ${t12(start)}?`,
    answer: t12(result),
    hint: 'Add the hours, then the minutes. Say am or pm when you pass noon.',
    explanation: `${t12(start)} ${before ? 'minus' : 'plus'} ${span(length)} is ${t12(result)}.`,
    givens: { before, start, length },
    wrongs: wrongs.filter(([value]) => inDay(value)).map(([value, code]) => [t12(value), code]),
  });
}

function solveTimeAfter(question) {
  const { before, start, length } = question.proof.givens;
  return t12(before ? start - length : start + length);
}
DRAFT['class-3-time-after'] = draftTimeAfter;
SOLVE['class-3-time-after'] = solveTimeAfter;

const MONTHS = [['March', 31], ['April', 30], ['May', 31], ['June', 30], ['July', 31], ['August', 31], ['September', 30], ['October', 31], ['November', 30]];

function dayGap(first, second) {
  const [m1, d1] = first;
  const [m2, d2] = second;
  let total = 0;
  for (let month = m1; month < m2; month++) total += MONTHS[month][1];
  return total + d2 - d1;
}

function draftDayCount(family, grade, level, r) {
  const kind = r.pick(level === 1 ? ['weeks-in', 'days-in'] : level === 2 ? ['weeks-days', 'weekday', 'days-in'] : ['gap', 'weekday', 'weeks-days']);
  const w = person(r);
  const base = { family, hint: 'A week has 7 days. Use that to change between weeks and days.' };
  if (kind === 'weeks-in') {
    const weeks = r.int(4, 12);
    return numberQ(r, { ...base, prompt: `How many weeks are there in ${weeks * 7} days?`, answer: weeks, explanation: `${weeks * 7} ÷ 7 = ${count(weeks, 'week')}.`, givens: { kind, weeks }, wrongs: [[weeks * 7 - 7, 'unit-conversion'], [Math.round(weeks * 7 / 30), 'unit-conversion']], min: 1, max: 99 });
  }
  if (kind === 'days-in') {
    const weeks = r.int(3, 12);
    const extra = level === 1 ? 0 : r.int(1, 6);
    const answer = weeks * 7 + extra;
    return numberQ(r, { ...base, prompt: extra ? `${w} will be away for ${count(weeks, 'week')} and ${count(extra, 'day')}. For how many days is that?` : `${w} goes on a trip for ${count(weeks, 'week')}. How many days is that?`, answer, explanation: `${weeks} × 7 = ${weeks * 7}${extra ? `. Then ${weeks * 7} + ${extra} = ${answer}` : ''} days.`, givens: { kind, weeks, extra }, wrongs: [[weeks + extra, 'wrong-operation'], [weeks * 7 - extra, 'wrong-operation'], [weeks * 5 + extra, 'unit-conversion']], min: 1, max: 999 });
  }
  if (kind === 'weeks-days') {
    const weeks = r.int(3, 12);
    const extra = r.int(1, 6);
    const days = weeks * 7 + extra;
    return textQ({ ...base, prompt: `${w} reads for ${days} days. How many weeks and days is that?`, answer: `${count(weeks, 'week')} ${count(extra, 'day')}`, explanation: `${days} ÷ 7 = ${weeks} remainder ${extra}.`, givens: { kind, days }, wrongs: [[`${count(weeks, 'week')} ${count(7 - extra, 'day')}`, 'remainder-rule'], [`${count(weeks + 1, 'week')} ${count(extra, 'day')}`, 'remainder-rule'], [`${count(extra, 'week')} ${count(weeks, 'day')}`, 'wrong-operation']] });
  }
  if (kind === 'weekday') {
    const today = r.int(0, 6);
    const after = r.int(level === 2 ? 8 : 15, level === 2 ? 20 : 60);
    const answer = DAYS[(today + after) % 7];
    return textQ({ ...base, prompt: `Today is ${DAYS[today]}. What day of the week will it be after ${after} days?`, answer, hint: 'Take away whole weeks. Count on the days that are left over.', explanation: `${after} days is ${count(Math.floor(after / 7), 'week')} and ${count(after % 7, 'day')}. ${DAYS[today]} plus ${count(after % 7, 'day')} is ${answer}.`, givens: { kind, today, after }, wrongs: [[DAYS[(today + after + 1) % 7], 'calendar-column'], [DAYS[(today + after + 6) % 7], 'calendar-column'], [DAYS[(today + Math.floor(after / 7)) % 7], 'remainder-rule'], [DAYS[(today + after + 2) % 7], 'missing-step']] });
  }
  const m1 = r.int(0, 7);
  const m2 = r.int(m1, m1 + 1);
  const d1 = r.int(1, MONTHS[m1][1]);
  const d2 = r.int(1, MONTHS[m2][1]);
  const first = [m1, d1];
  const second = [m2, d2];
  const answer = dayGap(first, second);
  if (answer < 3 || answer > 45) throw new QuestionRetry('date gap');
  return numberQ(r, { ...base, prompt: `${w} leaves on ${d1} ${MONTHS[m1][0]} and returns on ${d2} ${MONTHS[m2][0]}. For how many days is ${w} away?`, hint: `Count the days left in ${MONTHS[m1][0]}, then add the days of the next month.`, answer, explanation: `${MONTHS[m1][0]} has ${MONTHS[m1][1]} days. ${m1 === m2 ? `${d2} − ${d1} = ${answer}.` : `${MONTHS[m1][1]} − ${d1} = ${MONTHS[m1][1] - d1}, then add ${d2}: ${answer}.`}`, givens: { kind, m1, d1, m2, d2 }, wrongs: [[answer + 1, 'counted-endpoints'], [answer - 1, 'counted-endpoints'], [answer + (MONTHS[m1][1] === 31 ? -1 : 1), 'calendar-column']], min: 1, max: 99 });
}

function solveDayCount(question) {
  const g = question.proof.givens;
  if (g.kind === 'weeks-in') return g.weeks;
  if (g.kind === 'days-in') return g.weeks * 7 + g.extra;
  if (g.kind === 'weeks-days') return `${count(Math.floor(g.days / 7), 'week')} ${count(g.days % 7, 'day')}`;
  if (g.kind === 'weekday') return DAYS[(g.today + g.after) % 7];
  return dayGap([g.m1, g.d1], [g.m2, g.d2]);
}
DRAFT['class-3-day-count'] = draftDayCount;
SOLVE['class-3-day-count'] = solveDayCount;

function draftTimeUnits(family, grade, level, r) {
  const kind = r.pick(level === 1 ? ['hours-minutes', 'minutes-seconds', 'quarters'] : level === 2 ? ['hm-minutes', 'days-hours', 'quarters', 'minutes-seconds'] : ['minutes-hm', 'hm-minutes', 'seconds-minutes']);
  const w = person(r);
  const base = { family, hint: 'Remember: 1 hour is 60 minutes, 1 minute is 60 seconds and 1 day is 24 hours.' };
  if (kind === 'hours-minutes') {
    const h = r.int(2, 9);
    return numberQ(r, { ...base, prompt: `${w} studies for ${count(h, 'hour')}. How many minutes is that?`, answer: h * 60, explanation: `${h} × 60 = ${h * 60} minutes.`, givens: { kind, h }, wrongs: [[h * 100, 'unit-conversion'], [h * 30, 'unit-conversion'], [h + 60, 'wrong-operation']], min: 1, max: 9999 });
  }
  if (kind === 'minutes-seconds') {
    const m = r.int(2, 15);
    return numberQ(r, { ...base, prompt: `A song lasts ${count(m, 'minute')}. How many seconds is that?`, answer: m * 60, explanation: `${m} × 60 = ${m * 60} seconds.`, givens: { kind, m }, wrongs: [[m * 100, 'unit-conversion'], [m * 30, 'unit-conversion'], [m + 60, 'wrong-operation']], min: 1, max: 9999 });
  }
  if (kind === 'quarters') {
    const quarters = r.int(2, 7);
    return numberQ(r, { ...base, prompt: `How many minutes are there in ${quarters} quarters of an hour?`, answer: quarters * 15, explanation: `A quarter of an hour is 15 minutes. ${quarters} × 15 = ${quarters * 15}.`, givens: { kind, quarters }, wrongs: [[quarters * 25, 'unit-conversion'], [quarters * 10, 'unit-conversion'], [quarters * 20, 'unit-conversion']], min: 1, max: 999 });
  }
  if (kind === 'days-hours') {
    const d = r.int(2, 9);
    return numberQ(r, { ...base, prompt: `${w} is away for ${count(d, 'day')}. How many hours is that?`, answer: d * 24, explanation: `${d} × 24 = ${d * 24} hours.`, givens: { kind, d }, wrongs: [[d * 12, 'unit-conversion'], [d * 60, 'unit-conversion'], [d * 20, 'unit-conversion']], min: 1, max: 999 });
  }
  if (kind === 'hm-minutes') {
    const h = r.int(1, 6);
    const m = r.int(1, 11) * 5;
    return numberQ(r, { ...base, prompt: `A trip takes ${count(h, 'hour')} ${count(m, 'minute')}. How many minutes is that?`, answer: h * 60 + m, explanation: `${h} × 60 = ${h * 60}. Then ${h * 60} + ${m} = ${h * 60 + m} minutes.`, givens: { kind, h, m }, wrongs: [[h * 100 + m, 'unit-conversion'], [h + m, 'wrong-operation'], [h * 60, 'missing-step']], min: 1, max: 999 });
  }
  if (kind === 'minutes-hm') {
    const h = r.int(1, 6);
    const m = r.int(1, 11) * 5;
    return textQ({ ...base, prompt: `A film is ${h * 60 + m} minutes long. How long is it in hours and minutes?`, answer: span(h * 60 + m), explanation: `${h * 60 + m} ÷ 60 = ${h} remainder ${m}.`, givens: { kind, total: h * 60 + m }, wrongs: [[span((h + 1) * 60 + m), 'hour-carry'], [`${count(Math.floor((h * 60 + m) / 100), 'hour')} ${count((h * 60 + m) % 100, 'minute')}`, 'unit-conversion'], [span(h * 60 + m + 60), 'hour-carry'], [span(m * 60 + h), 'wrong-operation']].filter(([text]) => !/^0 /.test(text)) });
  }
  const minutes = r.int(3, 15);
  return numberQ(r, { ...base, prompt: `${w} runs for ${minutes * 60} seconds. For how many minutes does ${w} run?`, answer: minutes, explanation: `${minutes * 60} ÷ 60 = ${minutes} minutes.`, givens: { kind, minutes }, wrongs: [[minutes * 60 / 10, 'unit-conversion'], [minutes + 1, 'missing-step']], min: 1, max: 99 });
}

function solveTimeUnits(question) {
  const g = question.proof.givens;
  switch (g.kind) {
    case 'hours-minutes': return g.h * 60;
    case 'minutes-seconds': return g.m * 60;
    case 'quarters': return g.quarters * 15;
    case 'days-hours': return g.d * 24;
    case 'hm-minutes': return g.h * 60 + g.m;
    case 'minutes-hm': return span(g.total);
    default: return g.minutes;
  }
}
DRAFT['class-3-time-units'] = draftTimeUnits;
SOLVE['class-3-time-units'] = solveTimeUnits;

const TOYS = ['Car', 'Ball', 'Kite', 'Robot', 'Drum', 'Doll', 'Puzzle', 'Top', 'Bat', 'Train', 'Teddy', 'Whistle', 'Ludo', 'Yo-yo'];

function combos(list, size) {
  if (size === 0) return [[]];
  return list.flatMap((item, index) => combos(list.slice(index + 1), size - 1).map(rest => [item, ...rest]));
}

function draftToyTrio(family, grade, level, r) {
  const pairMode = level === 3 && r.int(0, 1) === 1;
  const size = pairMode ? 2 : 3;
  const names = r.shuffle(TOYS).slice(0, 6);
  const prices = names.map(() => r.int(2, 19) * 5);
  const lists = combos(names.map((name, index) => ({ name, price: prices[index] })), size);
  const totals = lists.map(list => sum(list.map(item => item.price)));
  const unique = totals.filter(total => totals.filter(other => other === total).length === 1);
  if (!unique.length) throw new QuestionRetry('target is not unique');
  const target = r.pick(unique);
  const hits = lists.filter(list => sum(list.map(item => item.price)) === target);
  const others = r.shuffle(lists.filter(list => sum(list.map(item => item.price)) !== target)).slice(0, 12)
    .sort((x, y) => Math.abs(sum(x.map(item => item.price)) - target) - Math.abs(sum(y.map(item => item.price)) - target)).slice(0, 3);
  const label = list => list.map(item => item.name).join(', ');
  const kind = level === 1 ? 'exact' : pairMode ? 'pair' : r.pick(['exact', 'change']);
  const paid = target + r.int(1, 6) * 10;
  const who = person(r);
  const prompt = kind === 'change'
    ? `${who} pays Rs ${paid} for three toys and gets Rs ${paid - target} back. Which three toys did ${who} buy?`
    : pairMode ? `${who} buys two toys for Rs ${target} in all. Which two toys are they?` : `${who} has Rs ${target}. Which three toys cost exactly Rs ${target} together?`;
  const rows = names.map((name, index) => ({ left: name, right: `Rs ${prices[index]}` }));
  return textQ({
    family,
    prompt,
    answer: label(hits[0]),
    hint: 'Add the prices of each choice. Only one choice makes the right total.',
    explanation: `${hits[0].map(item => item.price).join(' + ')} = ${target}, so ${label(hits[0])}.`,
    givens: { size, target },
    visual: { kind: 'v3-class-3-board', title: 'Toy prices', rows, description: `Toy price board. ${rows.map(row => `${row.left} ${row.right}`).join(', ')}.` },
    wrongs: others.map(list => [label(list), 'price-total']),
  });
}

function solveToyTrio(question) {
  const { size, target } = question.proof.givens;
  const price = Object.fromEntries(question.visual.rows.map(row => [row.left, Number(row.right.replace('Rs ', ''))]));
  const hits = question.options.filter(option => {
    const items = option.split(', ');
    return items.length === size && sum(items.map(item => price[item])) === target;
  });
  if (hits.length !== 1) throw new Error('toy choices');
  return hits[0];
}
DRAFT['class-3-toy-trio'] = draftToyTrio;
SOLVE['class-3-toy-trio'] = solveToyTrio;

const GOODS = [['book', 'books'], ['pen', 'pens'], ['toy', 'toys'], ['kite', 'kites'], ['ball', 'balls'], ['notebook', 'notebooks'], ['cap', 'caps'], ['bottle', 'bottles']];

function draftPriceTimes(family, grade, level, r) {
  const [one, many] = r.pick(GOODS);
  const [other] = r.pick(GOODS.filter(([name]) => name !== one));
  const w = person(r);
  const kind = r.pick(level === 1 ? ['times', 'how-many'] : level === 2 ? ['times', 'two-items', 'change'] : ['change', 'two-items', 'rent']);
  const base = { family, hint: 'Find the cost of each part first. Then add or take away.' };
  if (kind === 'times') {
    const price = r.int(2, 19) * 5 + (level === 1 ? 0 : r.int(0, 4));
    const n = r.int(3, 9);
    return numberQ(r, { ...base, prompt: `A ${one} costs Rs ${price}. How many rupees do ${n} ${many} cost?`, answer: price * n, explanation: `${price} × ${n} = ${price * n}.`, givens: { kind, price, n }, wrongs: [[price + n, 'wrong-operation'], [price * (n - 1), 'missing-step'], [price * (n + 1), 'missing-step']], min: 1, max: 9999 });
  }
  if (kind === 'how-many') {
    const price = r.int(2, 9) * 5;
    const n = r.int(3, 9);
    return numberQ(r, { ...base, prompt: `${w} has Rs ${price * n}. Each ${one} costs Rs ${price}. How many ${many} can ${w} buy?`, answer: n, explanation: `${price * n} ÷ ${price} = ${n}.`, givens: { kind, price, n }, wrongs: [[price * n - price, 'wrong-operation'], [n + 1, 'missing-step'], [n - 1, 'missing-step']], min: 1, max: 99 });
  }
  if (kind === 'two-items') {
    const price = r.int(4, 20) * 5;
    const n = r.int(2, 6);
    const otherPrice = r.int(5, 40) * 5;
    const answer = price * n + otherPrice;
    return numberQ(r, { ...base, prompt: `${w} buys ${n} ${many} at Rs ${price} each and one ${other} for Rs ${otherPrice}. How many rupees is that in all?`, answer, explanation: `${price} × ${n} = ${price * n}. Then ${price * n} + ${otherPrice} = ${answer}.`, givens: { kind, price, n, otherPrice }, wrongs: [[(price + otherPrice) * n, 'ignored-condition'], [price + otherPrice, 'missing-step'], [price * n - otherPrice, 'wrong-operation']], min: 1, max: 9999 });
  }
  if (kind === 'change') {
    const price = r.int(8, 40) * 5 - r.int(0, 1) * 5;
    const n = r.int(3, 8);
    const note = Math.ceil((price * n + 1) / 100) * 100 + r.int(0, 1) * 100;
    const answer = note - price * n;
    return numberQ(r, { ...base, prompt: `${w} buys ${n} ${many} at Rs ${price} each and pays with a Rs ${note} note. How much change does ${w} get?`, answer, explanation: `${price} × ${n} = ${price * n}. Then ${note} − ${price * n} = ${answer}.`, givens: { kind, price, n, note }, wrongs: [[price * n, 'change-order'], [note - price, 'missing-step'], [note + price * n, 'wrong-operation']], min: 1, max: 9999 });
  }
  const day = r.int(4, 14) * 5;
  const days = r.int(3, 9);
  const fee = r.int(1, 6) * 10;
  const answer = day * days + fee;
  return numberQ(r, { ...base, prompt: `A cycle costs Rs ${day} to rent for a day. ${w} rents it for ${days} days and pays Rs ${fee} extra for a helmet. How much does ${w} pay in all?`, answer, explanation: `${day} × ${days} = ${day * days}. Then ${day * days} + ${fee} = ${answer}.`, givens: { kind, day, days, fee }, wrongs: [[day * days, 'missing-step'], [(day + fee) * days, 'ignored-condition'], [day + days + fee, 'wrong-operation']], min: 1, max: 9999 });
}

function solvePriceTimes(question) {
  const g = question.proof.givens;
  if (g.kind === 'times') return g.price * g.n;
  if (g.kind === 'how-many') return g.n;
  if (g.kind === 'two-items') return g.price * g.n + g.otherPrice;
  if (g.kind === 'change') return g.note - g.price * g.n;
  return g.day * g.days + g.fee;
}
DRAFT['class-3-price-times'] = draftPriceTimes;
SOLVE['class-3-price-times'] = solvePriceTimes;

const PAIRS = [['a TV', 'a video game'], ['a fridge', 'a washing machine'], ['a bicycle', 'a helmet'], ['a phone', 'a tablet'], ['a sofa', 'a table'], ['a camera', 'a lens']];

function draftBigPrice(family, grade, level, r) {
  const [bigName, smallName] = r.pick(PAIRS);
  const big = r.int(150, 480) * 10;
  const less = r.int(20, Math.min(120, big / 10 - 40)) * 10;
  const small = big - less;
  const w = person(r);
  const kind = r.pick(level === 1 ? ['total-less', 'difference'] : level === 2 ? ['total-less', 'need', 'difference'] : ['total-less', 'need', 'two-step']);
  const base = { family, hint: 'Work out each price first. Then add or take away. Line up the places.' };
  if (kind === 'total-less') {
    return numberQ(r, { ...base, prompt: `${bigName[0].toUpperCase()}${bigName.slice(1)} costs Rs ${big}. ${smallName[0].toUpperCase()}${smallName.slice(1)} costs Rs ${less} less. What is the cost of both?`, answer: big + small, explanation: `${smallName} costs ${big} − ${less} = ${small}. Both cost ${big} + ${small} = ${big + small}.`, givens: { kind, big, less }, wrongs: [[big + less, 'ignored-condition'], [big, 'missing-step'], [big - less, 'wrong-operation']], min: 1, max: 99999 });
  }
  if (kind === 'difference') {
    return numberQ(r, { ...base, prompt: `${bigName[0].toUpperCase()}${bigName.slice(1)} costs Rs ${big}. ${smallName[0].toUpperCase()}${smallName.slice(1)} costs Rs ${small}. How many rupees more does ${bigName} cost?`, answer: less, explanation: `${big} − ${small} = ${less}.`, givens: { kind, big, less }, wrongs: [[big + small, 'wrong-operation'], [less + 100, 'missing-step'], [less - 100, 'missing-step']], min: 1, max: 99999 });
  }
  if (kind === 'need') {
    const saved = r.int(8, Math.floor(big / 100) * 10 - 10) * 10;
    return numberQ(r, { ...base, prompt: `${w} wants ${bigName} that costs Rs ${big}. ${w} has saved Rs ${saved}. How many more rupees does ${w} need?`, answer: big - saved, explanation: `${big} − ${saved} = ${big - saved}.`, givens: { kind, big, saved }, wrongs: [[big + saved, 'wrong-operation'], [saved, 'missing-step'], [big - saved + 100, 'missing-step']], min: 1, max: 99999 });
  }
  const paid = Math.ceil((big + small + 100) / 1000) * 1000;
  return numberQ(r, { ...base, prompt: `${bigName[0].toUpperCase()}${bigName.slice(1)} costs Rs ${big} and ${smallName} costs Rs ${small}. ${w} pays Rs ${paid} for both. How much change does ${w} get?`, answer: paid - big - small, explanation: `${big} + ${small} = ${big + small}. Then ${paid} − ${big + small} = ${paid - big - small}.`, givens: { kind, big, small, paid }, wrongs: [[paid - big, 'missing-step'], [big + small, 'change-order'], [paid + big + small, 'wrong-operation']], min: 1, max: 99999 });
}

function solveBigPrice(question) {
  const g = question.proof.givens;
  if (g.kind === 'total-less') return g.big + g.big - g.less;
  if (g.kind === 'difference') return g.less;
  if (g.kind === 'need') return g.big - g.saved;
  return g.paid - g.big - g.small;
}
DRAFT['class-3-big-price'] = draftBigPrice;
SOLVE['class-3-big-price'] = solveBigPrice;

function fewestNotes(amount, notes) {
  let left = amount;
  let total = 0;
  [...notes].sort((x, y) => y - x).forEach(note => {
    total += Math.floor(left / note);
    left %= note;
  });
  return total;
}

function draftNoteCount(family, grade, level, r) {
  const kind = r.pick(level === 1 ? ['notes-in', 'notes-in', 'mixed'] : level === 2 ? ['mixed', 'notes-in', 'fewest'] : ['fewest', 'mixed']);
  const w = person(r);
  const base = { family, hint: 'Think of each note as a number you can count in. Then add or divide.' };
  if (kind === 'notes-in') {
    const note = r.pick([5, 10, 20, 50]);
    const n = r.int(3, 12);
    return numberQ(r, { ...base, prompt: `${w} has Rs ${note * n} in Rs ${note} notes. How many notes does ${w} have?`, answer: n, explanation: `${note * n} ÷ ${note} = ${n} notes.`, givens: { kind, note, n }, wrongs: [[note * n - note, 'coin-count'], [n + 1, 'coin-count'], [n - 1, 'coin-count']], min: 1, max: 99 });
  }
  if (kind === 'mixed') {
    const small = r.pick([[5, 10], [10, 20], [20, 50], [50, 100]]);
    const [x, y] = small;
    const countX = r.int(2, 9);
    const countY = r.int(2, 9);
    const answer = x * countX + y * countY;
    return numberQ(r, { ...base, prompt: `${w} has ${count(countX, `Rs ${x} note`)} and ${count(countY, `Rs ${y} note`)}. How many rupees is that in all?`, answer, explanation: `${x} × ${countX} = ${x * countX} and ${y} × ${countY} = ${y * countY}. Together: ${answer}.`, givens: { kind, x, y, countX, countY }, wrongs: [[x * countY + y * countX, 'coin-count'], [(x + y) * (countX + countY), 'ignored-condition'], [countX + countY, 'wrong-operation']], min: 1, max: 9999 });
  }
  const notes = r.pick([[100, 50, 20, 10], [500, 100, 50, 10], [50, 20, 10, 5]]);
  const amount = r.int(2, 9) * notes[3] * r.int(3, 9);
  const answer = fewestNotes(amount, notes);
  if (answer < 3 || answer > 20) throw new QuestionRetry('note count');
  return numberQ(r, { ...base, prompt: `${w} has Rs ${notes.join(', Rs ')} notes. What is the fewest notes needed to make Rs ${amount}?`, hint: 'Start with the biggest note that fits. Then use the next biggest for what is left.', answer, explanation: `Use the biggest notes first. Rs ${amount} needs ${answer} notes.`, givens: { kind, notes, amount }, wrongs: [[answer + 1, 'coin-count'], [answer + 2, 'coin-count'], [Math.round(amount / notes[3]), 'coin-count']], min: 1, max: 99 });
}

function solveNoteCount(question) {
  const g = question.proof.givens;
  if (g.kind === 'notes-in') return g.n;
  if (g.kind === 'mixed') return g.x * g.countX + g.y * g.countY;
  return fewestNotes(g.amount, g.notes);
}
DRAFT['class-3-note-count'] = draftNoteCount;
SOLVE['class-3-note-count'] = solveNoteCount;
