import { seededRandom } from './seeded-random.mjs';

export const DEFAULT_SETTINGS = Object.freeze({
  activity: 'multiplication',
  table: 6,
  clock: 'five-minutes',
  level: 1,
  grade: 'class-1',
  chapter: 'mixed',
  count: 10,
  seed: 'otterly-1',
});

export const QUESTION_COUNTS = Object.freeze([5, 10, 12, 20]);
export const ACADEMY_GRADES = Object.freeze(['pp1', 'pp2', 'class-1', 'class-2', 'class-3', 'class-4', 'class-5']);
export const ACTIVITIES = Object.freeze([
  'multiplication', 'division', 'clock', 'addition', 'subtraction', 'multiplication-array', 'division-groups', 'academy',
]);
// Link fields that each activity reads. Anything else is removed from a canonical link.
const ACTIVITY_FIELDS = Object.freeze({
  multiplication: ['table'],
  division: ['table'],
  clock: ['clock'],
  addition: ['level'],
  subtraction: ['level'],
  'multiplication-array': [],
  'division-groups': [],
  academy: ['grade', 'chapter', 'level'],
});
const CLOCK_STEPS = ['hours', 'five-minutes'];
const SETTING_FIELDS = ['table', 'clock', 'level', 'grade', 'chapter'];
const PARAMETER_NAMES = ['activity', ...SETTING_FIELDS, 'count', 'seed'];
const SEED_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;
const CHAPTER_PATTERN = /^(?:mixed|paper|[a-z][a-z0-9-]{0,23})$/;
// Arithmetic ranges: level 1 stays within 20, level 2 uses the 10–50 operands of the site's Math Speed Quiz, level 3 reaches 1000.
const ARITHMETIC_LEVELS = Object.freeze({
  1: { min: 2, max: 10, limit: 20 },
  2: { min: 10, max: 50, limit: 100 },
  3: { min: 100, max: 500, limit: 1000 },
});
// Math Tank shows pictured equal groups only when both factors are at most 5, and pictured sharing for dividends up to 20 among 2–5 friends.
const GROUP_FACTORS = Object.freeze([2, 3, 4, 5]);
const SHARING_DIVISORS = Object.freeze([2, 3, 4, 5]);
const SHARING_LIMIT = 20;

export function academyPaperSize(grade) {
  return grade === 'class-5' ? 50 : 35;
}

export function isAcademyPaper(settings) {
  return settings.activity === 'academy' && settings.chapter === 'paper';
}

function countCapacity(settings) {
  if (settings.activity === 'clock' && settings.clock === 'five-minutes') return 144;
  if (settings.activity === 'multiplication-array') return GROUP_FACTORS.length ** 2;
  if (settings.activity === 'division-groups') return SHARING_DIVISORS.reduce((sum, divisor) => sum + Math.floor(SHARING_LIMIT / divisor), 0);
  if (['addition', 'subtraction', 'academy'].includes(settings.activity)) return Infinity;
  return 12;
}

export function normalizeSettings(input = {}) {
  const settings = { ...DEFAULT_SETTINGS };
  const warnings = [];

  if (input.activity !== undefined) {
    if (ACTIVITIES.includes(input.activity)) settings.activity = input.activity;
    else warnings.push('Unknown activity. Multiplication was selected instead.');
  }
  const uses = name => ACTIVITY_FIELDS[settings.activity].includes(name);
  if (input.table !== undefined && uses('table')) {
    if (/^(?:[2-9]|1[0-2])$/.test(String(input.table))) settings.table = Number(input.table);
    else warnings.push('Choose a table or divisor from 2 to 12. The value was reset to 6.');
  }
  if (input.clock !== undefined && uses('clock')) {
    if (CLOCK_STEPS.includes(input.clock)) settings.clock = input.clock;
    else warnings.push('Unknown clock step. Five-minute steps were selected instead.');
  }
  if (input.level !== undefined && uses('level')) {
    const academy = settings.activity === 'academy';
    if (/^[1-3]$/.test(String(input.level))) settings.level = Number(input.level);
    else if (academy && input.level === 'all') settings.level = 'all';
    else warnings.push(`Choose challenge level 1, 2 or 3${academy ? ', or all levels' : ''}. Level 1 was selected.`);
  }
  if (input.grade !== undefined && uses('grade')) {
    if (ACADEMY_GRADES.includes(input.grade)) settings.grade = input.grade;
    else warnings.push('Unknown grade. Class 1 was selected instead.');
  }
  if (input.chapter !== undefined && uses('chapter')) {
    if (typeof input.chapter === 'string' && CHAPTER_PATTERN.test(input.chapter)) settings.chapter = input.chapter;
    else warnings.push('Unknown chapter. Mixed chapters were selected instead.');
  }
  if (settings.activity === 'academy' && settings.chapter === 'paper') {
    if (settings.grade.startsWith('pp')) {
      settings.chapter = 'mixed';
      warnings.push('Pre-primary sheets are picture and readiness practice, not exam papers. Mixed chapters were selected.');
    } else if (settings.level === 'all') {
      settings.level = 1;
      warnings.push('A practice paper uses one challenge level. Level 1 was selected.');
    }
  }
  const paperInput = settings.activity === 'academy' && input.chapter === 'paper';
  if (input.count !== undefined && !paperInput) {
    if (QUESTION_COUNTS.some(count => String(count) === String(input.count))) {
      settings.count = Number(input.count);
    } else {
      warnings.push('Choose 5, 10, 12 or 20 questions. The count was reset to 10.');
    }
  }
  if (input.seed !== undefined) {
    if (typeof input.seed === 'string' && SEED_PATTERN.test(input.seed)) settings.seed = input.seed;
    else warnings.push('Use a sheet seed of 1–32 letters, numbers, hyphens or underscores. The default seed was used.');
  }

  const capacity = countCapacity(settings);
  if (isAcademyPaper(settings)) {
    settings.count = academyPaperSize(settings.grade);
  } else if (settings.count > capacity) {
    const bank = capacity === 12 ? '12' : String(capacity);
    settings.count = [...QUESTION_COUNTS].reverse().find(count => count <= capacity);
    warnings.push(`This activity has ${bank} different questions. The count was reduced to ${settings.count} so that no question repeats.`);
  }
  return { settings, warnings };
}

export function parseSettings(search = '') {
  const parameters = new URLSearchParams(search);
  const input = Object.create(null);
  const warnings = [];
  if ([...parameters.keys()].some(name => !PARAMETER_NAMES.includes(name))) {
    warnings.push('Unrecognised link parameters were removed. Only activity settings and a sheet seed are used.');
  }
  if (PARAMETER_NAMES.some(name => parameters.getAll(name).length > 1)) {
    warnings.push('Repeated link settings were ignored. The first value for each setting was used.');
  }
  for (const name of PARAMETER_NAMES) {
    if (parameters.has(name)) input[name] = parameters.get(name);
  }
  const normalized = normalizeSettings(input);
  const { settings } = normalized;
  const relevant = [...ACTIVITY_FIELDS[settings.activity], ...(isAcademyPaper(settings) ? [] : ['count'])];
  const irrelevant = [...SETTING_FIELDS, 'count'].some(name => parameters.has(name) && !relevant.includes(name) &&
    (name !== 'count' || isAcademyPaper(settings)));
  if (irrelevant) warnings.push('Settings for a different activity were removed from the link.');
  return { settings, warnings: [...warnings, ...normalized.warnings] };
}

export function settingsToSearch(input) {
  const { settings } = normalizeSettings(input);
  const parameters = new URLSearchParams({ activity: settings.activity });
  for (const name of ACTIVITY_FIELDS[settings.activity]) parameters.set(name, String(settings[name]));
  if (!isAcademyPaper(settings)) parameters.set('count', String(settings.count));
  parameters.set('seed', settings.seed);
  return parameters.toString();
}

function shuffleInPlace(items, random) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [items[index], items[swap]] = [items[swap], items[index]];
  }
  return items;
}

function carries(first, second) {
  for (let a = first, b = second; a > 0 || b > 0; a = Math.floor(a / 10), b = Math.floor(b / 10)) {
    if (a % 10 + b % 10 >= 10) return true;
  }
  return false;
}

function borrows(minuend, subtrahend) {
  for (let a = minuend, b = subtrahend; b > 0; a = Math.floor(a / 10), b = Math.floor(b / 10)) {
    if (a % 10 < b % 10) return true;
  }
  return false;
}

function arithmeticQuestions(settings, random) {
  const { min, max, limit } = ARITHMETIC_LEVELS[settings.level];
  const subtraction = settings.activity === 'subtraction';
  const regroupTarget = Math.ceil(settings.count / 2);
  const questions = [];
  const seen = new Set();
  let regrouped = 0;
  for (let attempt = 0; questions.length < settings.count && attempt < 20000; attempt += 1) {
    const first = min + Math.floor(random() * (max - min + 1));
    const second = min + Math.floor(random() * (max - min + 1));
    if (first + second > limit) continue;
    const left = subtraction ? first + second : first;
    const right = second;
    const regroup = subtraction ? borrows(left, right) : carries(first, second);
    if (regroup ? regrouped >= regroupTarget : questions.length - regrouped >= settings.count - regroupTarget) continue;
    const prompt = `${left} ${subtraction ? '−' : '+'} ${right} =`;
    if (seen.has(prompt)) continue;
    seen.add(prompt);
    if (regroup) regrouped += 1;
    questions.push({
      id: `${settings.activity}:${settings.level}:${left}:${right}`,
      kind: settings.activity,
      left,
      right,
      prompt,
      regroup,
      answer: String(subtraction ? first : first + second),
    });
  }
  if (questions.length !== settings.count) throw new Error('Not enough different arithmetic questions could be made. Try another seed.');
  return questions;
}

function pictureQuestions(settings) {
  const questions = [];
  if (settings.activity === 'multiplication-array') {
    for (const groups of GROUP_FACTORS) {
      for (const each of GROUP_FACTORS) {
        questions.push({
          id: `groups:${groups}:${each}`,
          kind: 'groups',
          left: groups,
          right: each,
          prompt: `${groups} × ${each} =`,
          answer: String(groups * each),
          visual: { kind: 'groups', groups, each },
        });
      }
    }
  } else {
    for (const friends of SHARING_DIVISORS) {
      for (let share = 1; friends * share <= SHARING_LIMIT; share += 1) {
        questions.push({
          id: `sharing:${friends * share}:${friends}`,
          kind: 'sharing',
          left: friends * share,
          right: friends,
          prompt: `${friends * share} ÷ ${friends} =`,
          answer: String(share),
          visual: { kind: 'sharing', total: friends * share, friends },
        });
      }
    }
  }
  return questions;
}

export function generateWorksheet(input = {}) {
  const { settings, warnings } = normalizeSettings(input);
  if (settings.activity === 'academy') {
    throw new RangeError('Space Academy question papers are made by generateAcademyWorksheet().');
  }
  if (['addition', 'subtraction'].includes(settings.activity)) {
    const random = seededRandom(`${settings.seed}|${settings.activity}|${settings.level}`);
    return { settings, warnings, questions: arithmeticQuestions(settings, random) };
  }
  const questions = [];
  if (settings.activity === 'multiplication-array' || settings.activity === 'division-groups') {
    questions.push(...pictureQuestions(settings));
    const random = seededRandom(`${settings.seed}|${settings.activity}`);
    return { settings, warnings, questions: shuffleInPlace(questions, random).slice(0, settings.count) };
  }
  if (settings.activity === 'clock') {
    const step = settings.clock === 'hours' ? 60 : 5;
    for (let total = 0; total < 720; total += step) {
      const hour = Math.floor(total / 60) || 12;
      const minute = total % 60;
      questions.push({
        id: `clock:${total}`,
        kind: 'clock',
        hour,
        minute,
        answer: `${hour}:${String(minute).padStart(2, '0')}`,
      });
    }
  } else {
    for (let value = 1; value <= 12; value += 1) {
      const division = settings.activity === 'division';
      const left = division ? settings.table * value : settings.table;
      const right = division ? settings.table : value;
      questions.push({
        id: `${settings.activity}:${settings.table}:${value}`,
        kind: settings.activity,
        left,
        right,
        prompt: `${left} ${division ? '÷' : '×'} ${right} =`,
        answer: String(division ? value : left * right),
      });
    }
  }

  const random = seededRandom(`${settings.seed}|${settings.activity}|${settings.table}|${settings.clock}`);
  return { settings, warnings, questions: shuffleInPlace(questions, random).slice(0, settings.count) };
}

export function clockHandEndpoints(hour, minute) {
  if (!Number.isInteger(hour) || hour < 1 || hour > 12 ||
      !Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new RangeError('Clock hands need an hour from 1 to 12 and a minute from 0 to 59.');
  }
  const endpoint = (angle, length) => ({
    angle,
    x1: 100,
    y1: 100,
    x2: Number((100 + Math.sin(angle * Math.PI / 180) * length).toFixed(3)),
    y2: Number((100 - Math.cos(angle * Math.PI / 180) * length).toFixed(3)),
  });
  return {
    hour: endpoint((hour % 12) * 30 + minute * 0.5, 45),
    minute: endpoint(minute * 6, 62),
  };
}
