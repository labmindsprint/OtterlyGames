// PP2 "Time" chapter: o'clock, half past, days and parts of the day. Age-5 time never asks for elapsed minutes.
import { MISCONCEPTIONS as SHARED, QuestionRetry } from './bank-shared.mjs';
import { build, retrying } from './bank3-gap-kit.mjs';
import { INK, PAPER, circle, line, svg, text } from './diagram-kit.mjs';
import { clockHandEndpoints } from '../worksheet-generator.mjs';

export const TIME_CHAPTER = {
  id: 'time', title: 'Clocks and days', section: 'everyday', skills: ['time', 'sequence'],
  description: 'Read o\'clock and half past, and know the parts of a day.',
};

export const TIME_FAMILIES = {
  'pp2-oclock': { skill: 'time', title: 'Read and move o\'clock times on a clock' },
  'pp2-half-past': { skill: 'time', title: 'Tell half past from o\'clock' },
  'pp2-clock-match': { skill: 'time', title: 'Match a time with its clock picture' },
  'pp2-day-part': { skill: 'time', title: 'Match things we do with parts of the day' },
  'pp2-time-order': { skill: 'sequence', title: 'Say which day or part of the day comes next' },
  'pp2-time-sense': { skill: 'time', title: 'Pick the quickest or longest thing' },
};

export const TIME_CODES = {
  'pp2-time-hands': { title: 'Short hand and long hand', message: 'The short hand tells the hour. When the long hand points to 12 it is o\'clock.' },
  'pp2-time-hour': { title: 'The right hour', message: 'Look at where the short hand points. That number is the hour.' },
  'pp2-time-half': { title: 'Half past', message: 'At half past the long hand points to 6, and the short hand is just past the hour.' },
  'pp2-time-shift': { title: 'Later and earlier', message: 'Later means a bigger number on the clock. Earlier means a smaller number.' },
  'pp2-time-part': { title: 'Parts of the day', message: 'Think of the sky: sunrise is morning, then afternoon, then evening and then night.' },
  'pp2-time-day': { title: 'Days in order', message: 'Say the days in order and stop at the one next to it.' },
  'pp2-time-long': { title: 'Short and long times', message: 'Picture each thing. The quick one is over in a moment; the long one takes a lot of time.' },
};
const KNOWN = { ...SHARED, ...TIME_CODES };
const COUNT = 4;

const wrap = hour => ((hour - 1) % 12 + 12) % 12 + 1;
const label = (hour, half) => (half ? `half past ${hour}` : `${hour} o'clock`);
const minutesOf = (hour, half) => hour * 60 + (half ? 30 : 0);
const clockText = (hour, half) => (half
  ? `A clock with the short hand just past ${hour} and the long hand on 6.`
  : `A clock with the short hand on ${hour} and the long hand on 12.`);
const clock = (hour, half, kind = 'v3-pp2-time-clock') => ({ kind, time: minutesOf(hour, half), description: clockText(hour, half) });
const readClock = visual => {
  const hour = Math.floor(visual.time / 60) || 12;
  return { hour, half: visual.time % 60 === 30 };
};
const tell = visual => {
  const { hour, half } = readClock(visual);
  return label(hour, half);
};
const hoursNear = (answer, count = 4) => {
  const picks = [];
  for (const step of [1, -1, 2, -2, 3, -3]) {
    const hour = wrap(answer + step);
    if (!picks.includes(hour)) picks.push(hour);
  }
  return picks.slice(0, count);
};

const DRAFT = {};
const SOLVE = {};

DRAFT['pp2-oclock'] = retrying((family, grade, level, r) => {
  const hour = r.int(1, 12);
  const mode = r.pick(level === 1 ? ['read'] : level === 2 ? ['read', 'later', 'earlier'] : ['later', 'earlier', 'later', 'read']);
  const jump = mode === 'read' ? 0 : level === 3 && r.int(0, 1) ? 2 : 1;
  const target = mode === 'later' ? wrap(hour + jump) : mode === 'earlier' ? wrap(hour - jump) : hour;
  const wrongs = hoursNear(target, 5).map(value => ({ value: label(value, false), code: 'pp2-time-hour' }));
  if (mode === 'read') {
    if (level > 1) wrongs.unshift({ value: label(hour, true), code: 'pp2-time-hands' });
  } else {
    wrongs.unshift({ value: label(hour, false), code: 'pp2-time-shift' });
    wrongs.unshift({ value: label(mode === 'later' ? wrap(hour - jump) : wrap(hour + jump), false), code: 'pp2-time-shift' });
  }
  const unique = [...new Map(wrongs.filter(item => item.value !== label(target, false)).map(item => [item.value, item])).values()];
  const prompt = mode === 'read'
    ? r.pick(['What time does the clock show?', 'Read the clock. What time is it?', 'The long hand is on 12. What time is it?'])
    : `The clock shows ${hour} o'clock. What time is ${jump === 2 ? 'two hours' : 'one hour'} ${mode === 'later' ? 'later' : 'earlier'}?`;
  return build({
    family, known: KNOWN, count: COUNT, prompt, answer: label(target, false), wrongs: unique,
    hint: mode === 'read' ? 'Look at the short hand.' : 'Count the hours on the clock.',
    explanation: mode === 'read' ? `The short hand is on ${hour} and the long hand is on 12. It is ${hour} o'clock.`
      : `${jump === 2 ? 'Two hours' : 'One hour'} ${mode} than ${hour} o'clock is ${target} o'clock.`,
    givens: { mode, hour, jump }, visual: clock(hour, false),
  });
});
SOLVE['pp2-oclock'] = question => {
  const { mode, hour, jump } = question.proof.givens;
  const shown = readClock(question.visual);
  if (question.visual?.kind !== 'v3-pp2-time-clock' || shown.hour !== hour || shown.half) throw new Error('The clock changed.');
  return label(mode === 'later' ? wrap(hour + jump) : mode === 'earlier' ? wrap(hour - jump) : hour, false);
};

DRAFT['pp2-half-past'] = retrying((family, grade, level, r) => {
  const hour = r.int(1, 12);
  const mode = r.pick(level === 1 ? ['read'] : level === 2 ? ['read', 'pick'] : ['pick', 'read', 'pick']);
  if (mode === 'read') {
    const wrongs = [
      { value: label(hour, false), code: 'pp2-time-half' },
      { value: label(wrap(hour + 1), true), code: 'pp2-time-half' },
      { value: label(wrap(hour + 1), false), code: 'pp2-time-hands' },
      { value: label(wrap(hour - 1), true), code: 'pp2-time-hour' },
    ];
    return build({
      family, known: KNOWN, count: COUNT,
      prompt: r.pick(['What time does the clock show?', 'The long hand is on 6. What time is it?', 'Read the clock. What time is it?']),
      answer: label(hour, true), wrongs, hint: 'The long hand on 6 means half past.',
      explanation: `The long hand is on 6, so it is half past. The short hand has just passed ${hour}. It is half past ${hour}.`,
      givens: { mode, hour }, visual: clock(hour, true),
    });
  }
  const options = [
    { half: true, hour, code: null },
    { half: false, hour, code: 'pp2-time-half' },
    { half: true, hour: wrap(hour + 1), code: 'pp2-time-half' },
    { half: true, hour: wrap(hour - 1), code: 'pp2-time-hour' },
    { half: false, hour: wrap(hour + 1), code: 'pp2-time-hands' },
  ];
  return build({
    family, known: KNOWN, count: COUNT,
    prompt: r.pick([`Which clock shows half past ${hour}?`, `Pip has a snack at half past ${hour}. Which clock?`]),
    answer: label(hour, true),
    correctVisual: clock(hour, true, 'v3-pp2-time-small'),
    wrongs: options.slice(1).map(item => ({ value: label(item.hour, item.half), code: item.code, visual: clock(item.hour, item.half, 'v3-pp2-time-small') })),
    hint: 'Find the long hand on 6.',
    explanation: `Half past ${hour} has the long hand on 6 and the short hand just past ${hour}.`,
    givens: { mode, hour },
  });
});
SOLVE['pp2-half-past'] = question => {
  const { mode, hour } = question.proof.givens;
  if (mode === 'read') {
    const shown = readClock(question.visual);
    if (shown.hour !== hour || !shown.half) throw new Error('The clock changed.');
    return label(hour, true);
  }
  return matchPictures(question, label(hour, true));
};

// Finds the one option whose clock picture shows the named time, and checks every label matches its own picture.
function matchPictures(question, wanted) {
  if (!question.optionVisuals || question.optionVisuals.length !== question.options.length) throw new Error('Picture choices are missing.');
  const matches = [];
  question.optionVisuals.forEach((visual, index) => {
    if (visual?.kind !== 'v3-pp2-time-small' || tell(visual) !== question.options[index]) throw new Error('A picture does not match its label.');
    if (question.options[index] === wanted) matches.push(question.options[index]);
  });
  if (matches.length !== 1) throw new Error('There is not exactly one matching clock.');
  return matches[0];
}

DRAFT['pp2-clock-match'] = retrying((family, grade, level, r) => {
  const hour = r.int(1, 12);
  const half = level > 1 && r.int(0, 1) === 1;
  const spots = [
    { hour: wrap(hour + 1), half, code: 'pp2-time-hour' },
    { hour: wrap(hour - 1), half, code: 'pp2-time-hour' },
    { hour, half: !half, code: 'pp2-time-half' },
    { hour: wrap(hour + 2), half, code: 'pp2-time-hour' },
  ];
  if (level === 3) spots.push({ hour: wrap(hour + 1), half: !half, code: 'pp2-time-hands' });
  const prompt = r.pick([`Which clock shows ${label(hour, half)}?`, `Find the clock for ${label(hour, half)}.`,
    `It is ${label(hour, half)}. Which clock is right?`]);
  return build({
    family, known: KNOWN, count: COUNT, prompt, answer: label(hour, half),
    correctVisual: clock(hour, half, 'v3-pp2-time-small'),
    wrongs: r.shuffle(spots).map(item => ({ value: label(item.hour, item.half), code: item.code, visual: clock(item.hour, item.half, 'v3-pp2-time-small') })),
    hint: half ? 'Half past has the long hand on 6.' : 'O\'clock has the long hand on 12.',
    explanation: `${label(hour, half)} has the short hand ${half ? `just past ${hour}` : `on ${hour}`} and the long hand on ${half ? 6 : 12}.`,
    givens: { hour, half },
  });
});
SOLVE['pp2-clock-match'] = question => matchPictures(question, label(question.proof.givens.hour, question.proof.givens.half));

const PARTS = {
  morning: ['wake up', 'eat breakfast', 'see the sunrise', 'school starts', 'get dressed', 'hear birds sing'],
  afternoon: ['school ends', 'play after lunch', 'after-school snack', 'eat lunch', 'leave school', 'nap after lunch'],
  evening: ['eat dinner', 'watch the sunset', 'sky turns orange', 'dinner is ready', 'wash after dinner', 'read before bed'],
  night: ['sleep in bed', 'stars twinkle', 'hear an owl', 'dream in bed', 'see the moon', 'put on pajamas'],
};
const PART_NAMES = Object.keys(PARTS);
const partOf = item => PART_NAMES.find(name => PARTS[name].includes(item));

DRAFT['pp2-day-part'] = retrying((family, grade, level, r) => {
  const mode = r.pick(level === 1 ? ['when'] : ['when', 'which']);
  if (mode === 'when') {
    const part = r.pick(PART_NAMES);
    const item = r.pick(PARTS[part]);
    return build({
      family, known: KNOWN, count: COUNT, prompt: r.pick([`Which part of the day: ${item}?`, `When is it? "${item}".`, `Pip says "${item}". Which part of the day?`]),
      answer: part, wrongs: PART_NAMES.filter(name => name !== part).map(value => ({ value, code: 'pp2-time-part' })),
      hint: 'Think about the sky.', explanation: `"${item[0].toUpperCase()}${item.slice(1)}" is for the ${part}. The day goes morning, afternoon, evening, night.`,
      givens: { mode, item },
    });
  }
  const part = r.pick(PART_NAMES);
  const picks = [part, ...r.shuffle(PART_NAMES.filter(name => name !== part))].map(name => r.pick(PARTS[name]));
  return build({
    family, known: KNOWN, count: COUNT, prompt: r.pick([`Which happens in the ${part}?`, `What do we do in the ${part}?`, `Find the thing for the ${part}.`]),
    answer: picks[0], wrongs: picks.slice(1).map(value => ({ value, code: 'pp2-time-part' })),
    hint: 'Think about the sky.', explanation: `${picks[0][0].toUpperCase()}${picks[0].slice(1)} is for the ${part}. The others happen at other times.`,
    givens: { mode, part },
  });
});
SOLVE['pp2-day-part'] = question => {
  const { mode, item, part } = question.proof.givens;
  if (mode === 'when') return partOf(item);
  const fits = question.options.filter(option => partOf(option) === part);
  if (fits.length !== 1) throw new Error('There is not exactly one match.');
  return fits[0];
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

DRAFT['pp2-time-order'] = retrying((family, grade, level, r) => {
  const mode = r.pick(level === 1 ? ['after', 'before', 'part-after'] : level === 2 ? ['after', 'before', 'between', 'part-before'] : ['after', 'before', 'between', 'after2']);
  if (mode.startsWith('part')) {
    const index = mode === 'part-after' ? r.int(0, 2) : r.int(1, 3);
    const given = PART_NAMES[index];
    const answer = PART_NAMES[mode === 'part-after' ? index + 1 : index - 1];
    return build({
      family, known: KNOWN, count: COUNT,
      prompt: mode === 'part-after' ? r.pick([`Which part of the day comes after ${given}?`, `After ${given}, which part of the day is next?`])
        : r.pick([`Which part of the day comes before ${given}?`, `Which part of the day is just before ${given}?`]),
      answer, wrongs: PART_NAMES.filter(name => name !== answer && name !== given).concat([given]).map(value => ({ value, code: 'pp2-time-day' })),
      hint: 'Think of the sky from sunrise to bedtime.', explanation: `The day goes morning, afternoon, evening, night. ${answer[0].toUpperCase()}${answer.slice(1)} is next to ${given}.`,
      givens: { mode, index },
    });
  }
  const index = mode === 'after' ? r.int(0, 5) : mode === 'before' ? r.int(1, 6) : mode === 'after2' ? r.int(0, 4) : r.int(0, 4);
  const step = { after: 1, before: -1, between: 1, after2: 2 }[mode];
  const answer = DAYS[index + step];
  const prompt = mode === 'after' ? r.pick([`Which day comes after ${DAYS[index]}?`, `It is ${DAYS[index]} today. What day is tomorrow?`])
    : mode === 'before' ? r.pick([`Which day comes before ${DAYS[index]}?`, `It is ${DAYS[index]} today. What day was yesterday?`])
      : mode === 'after2' ? r.pick([`Which day is two days after ${DAYS[index]}?`, `Today is ${DAYS[index]}. What day is it in two days?`])
        : r.pick([`Which day is between ${DAYS[index]} and ${DAYS[index + 2]}?`, `${DAYS[index]}, ?, ${DAYS[index + 2]}. Which day is missing?`]);
  const wrongs = DAYS.filter(day => day !== answer).map(value => ({ value, code: 'pp2-time-day' }));
  return build({
    family, known: KNOWN, count: COUNT, prompt, answer, wrongs: r.shuffle(wrongs).slice(0, 5),
    hint: 'Say the days in order.', explanation: `The days go ${DAYS.slice(0, 3).join(', ')} and on. ${answer} is the one asked for.`,
    givens: { mode, index },
  });
});
SOLVE['pp2-time-order'] = question => {
  const { mode, index } = question.proof.givens;
  if (mode.startsWith('part')) return PART_NAMES[index + (mode === 'part-after' ? 1 : -1)];
  return DAYS[index + { after: 1, before: -1, between: 1, after2: 2 }[mode]];
};

const LENGTHS = ['one blink', 'one clap', 'one jump', 'wash hands', 'brush teeth', 'eat lunch', 'watch a film', 'a school day', 'one week', 'one month', 'one year'];

DRAFT['pp2-time-sense'] = retrying((family, grade, level, r) => {
  const longest = r.int(0, 1) === 1;
  const gap = level === 1 ? 2 : 1;
  const picks = [];
  const ranks = r.shuffle(LENGTHS.map((_, index) => index));
  for (const rank of ranks) {
    if (picks.every(other => Math.abs(other - rank) >= gap)) picks.push(rank);
    if (picks.length === COUNT) break;
  }
  if (picks.length < COUNT) throw new QuestionRetry('Too close together');
  const items = picks.map(rank => LENGTHS[rank]);
  const answer = LENGTHS[longest ? Math.max(...picks) : Math.min(...picks)];
  return build({
    family, known: KNOWN, count: COUNT,
    prompt: longest ? r.pick(['Which takes the longest time?', 'Which one takes most time?']) : r.pick(['Which is over the quickest?', 'Which takes the least time?']),
    answer, wrongs: items.filter(item => item !== answer).map(value => ({ value, code: 'pp2-time-long' })),
    hint: 'Picture each one happening.', explanation: `${answer[0].toUpperCase()}${answer.slice(1)} takes ${longest ? 'the longest' : 'the least'} time of the four.`,
    givens: { longest, items: [...items].sort() },
  });
});
SOLVE['pp2-time-sense'] = question => {
  const { longest, items } = question.proof.givens;
  if (items.join(',') !== [...question.options].sort().join(',')) throw new Error('The things changed.');
  const ranked = [...items].sort((a, b) => LENGTHS.indexOf(a) - LENGTHS.indexOf(b));
  return longest ? ranked[ranked.length - 1] : ranked[0];
};

export const TIME_PLAN = [
  'pp2-oclock pp2-clock-match pp2-day-part pp2-time-order pp2-time-sense',
  'pp2-oclock pp2-clock-match pp2-day-part pp2-time-order pp2-half-past pp2-time-sense',
  'pp2-oclock pp2-clock-match pp2-day-part pp2-time-order pp2-half-past pp2-time-sense',
];

export const TIME_DRAFT = DRAFT;
export const TIME_SOLVE = SOLVE;

// A plain clock with only the twelve numbers keeps each picture choice small enough for a phone.
function plainClock(minutes) {
  const hands = clockHandEndpoints(Math.floor(((minutes % 720) + 720) % 720 / 60) || 12, ((minutes % 60) + 60) % 60);
  const numbers = Array.from({ length: 12 }, (_, index) => {
    const angle = (index + 1) * Math.PI / 6;
    return text(100 + Math.sin(angle) * 72, 106 - Math.cos(angle) * 72, index + 1, { size: 16 });
  }).join('');
  return `${circle(100, 100, 96, { fill: PAPER, strokeWidth: 3 })}${numbers}${line(100, 100, hands.hour.x2, hands.hour.y2, { stroke: '#675082', width: 8 })}${line(100, 100, hands.minute.x2, hands.minute.y2, { stroke: '#9d4e2d', width: 4 })}${circle(100, 100, 5, { fill: INK })}`;
}

export function renderTime(visual) {
  if (visual.kind === 'v3-pp2-time-clock') return svg(plainClock(visual.time), visual.description, 200, 200);
  if (visual.kind === 'v3-pp2-time-small') return svg(plainClock(visual.time), visual.description, 200, 200);
  return null;
}
