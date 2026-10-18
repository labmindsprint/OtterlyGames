import { seededRandom } from './seeded-random.mjs';

export const DEFAULT_SETTINGS = Object.freeze({
  activity: 'multiplication',
  table: 6,
  clock: 'five-minutes',
  count: 10,
  seed: 'otterly-1',
});

export const QUESTION_COUNTS = Object.freeze([5, 10, 12, 20]);
const ACTIVITIES = ['multiplication', 'division', 'clock'];
const CLOCK_STEPS = ['hours', 'five-minutes'];
const PARAMETER_NAMES = ['activity', 'table', 'clock', 'count', 'seed'];
const SEED_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

export function normalizeSettings(input = {}) {
  const settings = { ...DEFAULT_SETTINGS };
  const warnings = [];

  if (input.activity !== undefined) {
    if (ACTIVITIES.includes(input.activity)) settings.activity = input.activity;
    else warnings.push('Unknown activity. Multiplication was selected instead.');
  }
  if (input.table !== undefined && settings.activity !== 'clock') {
    if (/^(?:[2-9]|1[0-2])$/.test(String(input.table))) settings.table = Number(input.table);
    else warnings.push('Choose a table or divisor from 2 to 12. The value was reset to 6.');
  }
  if (input.clock !== undefined && settings.activity === 'clock') {
    if (CLOCK_STEPS.includes(input.clock)) settings.clock = input.clock;
    else warnings.push('Unknown clock step. Five-minute steps were selected instead.');
  }
  if (input.count !== undefined) {
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

  const maximum = settings.activity === 'clock' && settings.clock === 'five-minutes' ? 144 : 12;
  if (settings.count > maximum) {
    settings.count = 12;
    warnings.push('This activity has 12 different questions. The count was reduced to 12 so that no question repeats.');
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
  const irrelevant = normalized.settings.activity === 'clock'
    ? parameters.has('table')
    : parameters.has('clock');
  if (irrelevant) warnings.push('Settings for a different activity were removed from the link.');
  return { settings: normalized.settings, warnings: [...warnings, ...normalized.warnings] };
}

export function settingsToSearch(input) {
  const { settings } = normalizeSettings(input);
  const parameters = new URLSearchParams({ activity: settings.activity });
  if (settings.activity === 'clock') parameters.set('clock', settings.clock);
  else parameters.set('table', String(settings.table));
  parameters.set('count', String(settings.count));
  parameters.set('seed', settings.seed);
  return parameters.toString();
}

export function generateWorksheet(input = {}) {
  const { settings, warnings } = normalizeSettings(input);
  const questions = [];
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
  for (let index = questions.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [questions[index], questions[swap]] = [questions[swap], questions[index]];
  }
  return { settings, warnings, questions: questions.slice(0, settings.count) };
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
