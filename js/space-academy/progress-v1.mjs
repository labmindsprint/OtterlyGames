import { gameLink, getChapter, getGrade, GRADES, LEVELS, SKILLS } from './curriculum.mjs';
import { DESTINATIONS, PAINTS, PARTS } from './destinations.mjs';
import { createMission } from './questions.mjs';
import { MISCONCEPTIONS } from './bank-shared.mjs';

// This reducer is frozen for the original save format, which only ever held banks 1 and 2; bank 2 was its current bank.
const CONTENT_VERSION = 2;
const CONTENT_VERSIONS = [1, 2];

export const SAVE_VERSION = 1;
export const EXPLORERS = [
  { id: 'explorer-1', name: 'Explorer 1', callSign: 'Nova' },
  { id: 'explorer-2', name: 'Explorer 2', callSign: 'Comet' },
  { id: 'explorer-3', name: 'Explorer 3', callSign: 'Orbit' },
];

const blankExplorer = () => ({ grade: 'class-1', level: 1, journeys: {} });
export const blankJourney = () => ({
  earned: [], fitted: [], paint: 'coral', charges: 0, visits: [], flight: null,
  active: null, completed: [], history: [], attempts: [], lastResult: null,
});

export function newSave() {
  return {
    version: SAVE_VERSION, revision: 0, activeExplorer: EXPLORERS[0].id,
    explorers: Object.fromEntries(EXPLORERS.map(explorer => [explorer.id, blankExplorer()])),
  };
}

export function currentExplorer(save) {
  return save.explorers[save.activeExplorer];
}

export function currentJourney(save) {
  const explorer = currentExplorer(save);
  return explorer.journeys[explorer.grade] ?? blankJourney();
}

const demand = (condition, message) => { if (!condition) throw new Error(message); };
const integer = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= min && value <= max;
const unique = values => Array.isArray(values) && new Set(values).size === values.length;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function readMissionLink(search) {
  const params = new URLSearchParams(search);
  if (!params.size) return null;
  const allowed = ['grade', 'chapter', 'mode', 'level', 'seed', 'bank'];
  demand(![...params.keys()].some(key => !allowed.includes(key)) &&
    !allowed.some(key => params.getAll(key).length > 1),
  'Unrecognised or repeated link settings were not used. Do not put personal information in mission links.');
  const bank = params.get('bank');
  demand(bank === null || CONTENT_VERSIONS.some(version => String(version) === bank),
    'Unsupported Academy question-bank version in this mission link.');
  const contentVersion = bank === null ? (params.has('seed') ? 1 : CONTENT_VERSION) : Number(bank);
  const grade = getGrade(params.get('grade') ?? 'class-1', contentVersion);
  const mode = params.get('mode') ?? 'chapter';
  const request = {
    grade: grade.id, mode, contentVersion,
    level: Number(params.get('level') ?? 1),
    chapter: mode === 'chapter' ? params.get('chapter') ?? grade.chapters[0].id : null,
    ...(params.has('seed') ? { seed: params.get('seed') } : {}),
  };
  demand(mode === 'chapter' || !params.has('chapter'), 'A mixed set does not use a chapter setting.');
  gameLink(request);
  return request;
}

export function isCurrentAttempt(attempt) {
  return object(attempt) && typeof attempt.id === 'string' && attempt.id.startsWith(`q${CONTENT_VERSION}-`) &&
    (attempt.contentVersion === undefined || attempt.contentVersion === CONTENT_VERSION);
}

function validateMission(mission, gradeId) {
  demand(object(mission) && mission.grade === gradeId, 'The saved mission has a different grade.');
  demand(CONTENT_VERSIONS.includes(mission.contentVersion), 'The saved mission uses an unsupported question-bank version. Nothing has been reset.');
  const expected = createMission(mission);
  demand(JSON.stringify(expected) === JSON.stringify(mission), 'The saved mission does not match this question-bank version. Keep your backup and contact support.');
}

function validateAnswers(mission, answers, complete) {
  demand(Array.isArray(answers) && answers.length === mission.questions.length, 'The saved answers are incomplete.');
  answers.forEach((answer, index) => {
    demand(object(answer) && typeof answer.hinted === 'boolean' &&
      (answer.choice === null ? !complete : integer(answer.choice, 0, mission.questions[index].options.length - 1)),
    'A saved answer is invalid.');
  });
}

export function validateSave(save) {
  demand(object(save) && save.version === SAVE_VERSION, 'This is not a supported Space Academy save. Nothing has been reset.');
  demand(integer(save.revision) && EXPLORERS.some(explorer => explorer.id === save.activeExplorer), 'The saved explorer selection is invalid.');
  demand(object(save.explorers) && Object.keys(save.explorers).length === EXPLORERS.length, 'The save needs all three local explorer slots.');
  for (const { id } of EXPLORERS) {
    const explorer = save.explorers[id];
    demand(object(explorer) && GRADES.some(grade => grade.id === explorer.grade) &&
      LEVELS.some(level => level.id === explorer.level) && object(explorer.journeys), 'A saved explorer is invalid.');
    for (const [gradeId, journey] of Object.entries(explorer.journeys)) {
      const grade = getGrade(gradeId, CONTENT_VERSION);
      demand(object(journey) && unique(journey.completed) && journey.completed.every(value =>
        typeof value === 'string' && CONTENT_VERSIONS.some(version => value.startsWith(`m${version}:${gradeId}:`))),
        'The mission-completion history is invalid.');
      const expectedParts = PARTS.slice(0, Math.min(PARTS.length, journey.completed.length)).map(part => part.id);
      demand(JSON.stringify(journey.earned) === JSON.stringify(expectedParts), 'Earned rocket parts do not match completed missions.');
      demand(unique(journey.fitted) && journey.fitted.every(part => journey.earned.includes(part)), 'An unearned or repeated rocket part is fitted.');
      demand(PAINTS.some(paint => paint.id === journey.paint), 'The rocket paint is invalid.');
      demand(unique(journey.visits) && journey.visits.length <= DESTINATIONS.length &&
        journey.visits.every((key, index) => DESTINATIONS[index]?.id === key), 'The discovery route is invalid.');
      if (journey.flight !== null) {
        demand(journey.visits.length < DESTINATIONS.length && object(journey.flight) &&
          journey.flight.destination === DESTINATIONS[journey.visits.length]?.id &&
          journey.flight.id === `flight:${gradeId}:${journey.visits.length}` && journey.fitted.length === PARTS.length,
        'The saved flight is invalid.');
      }
      demand(integer(journey.charges) && journey.charges === journey.completed.length - journey.visits.length - (journey.flight ? 1 : 0),
        'The launch-charge balance does not match completed missions and flights.');
      demand(Array.isArray(journey.attempts), 'The learning history is invalid.');
      const seen = new Set();
      for (const attempt of journey.attempts) {
        demand(object(attempt), 'A saved skill result is invalid.');
        const contentVersion = CONTENT_VERSIONS.find(version =>
          typeof attempt.id === 'string' && attempt.id.startsWith(`q${version}-${gradeId}-`));
        demand(contentVersion !== undefined && (attempt.contentVersion === undefined || attempt.contentVersion === contentVersion),
          'A saved skill result has an unsupported or inconsistent question-bank version.');
        const chapter = getChapter(gradeId, attempt.chapter, contentVersion);
        demand(
          chapter.skills.includes(attempt.skill) && LEVELS.some(level => level.id === attempt.level) &&
          typeof attempt.correct === 'boolean' && typeof attempt.hinted === 'boolean' &&
          typeof attempt.at === 'string' && Number.isFinite(Date.parse(attempt.at)),
        'A saved skill result is invalid.');
        demand(attempt.misconception === undefined || (contentVersion === CONTENT_VERSION && !attempt.correct &&
          typeof attempt.misconception === 'string' && Object.hasOwn(MISCONCEPTIONS, attempt.misconception)),
        'A saved practice-focus code is invalid.');
        const key = `${attempt.id}:${attempt.level}`;
        demand(!seen.has(key), 'Repeated questions cannot count as separate skill evidence.');
        seen.add(key);
      }
      demand(Array.isArray(journey.history) && journey.history.length <= 20, 'The recent mission log is invalid.');
      for (const result of journey.history) {
        demand(object(result) && journey.completed.includes(result.id) && typeof result.title === 'string' &&
          integer(result.count, 1, 50) && integer(result.correct, 0, result.count) &&
          integer(result.helped, 0, result.count) && LEVELS.some(level => level.id === result.level) &&
          typeof result.at === 'string' && Number.isFinite(Date.parse(result.at)), 'A recent mission result is invalid.');
      }
      if (journey.active !== null) {
        const active = journey.active;
        demand(object(active), 'The unfinished mission is invalid.');
        validateMission(active.mission, gradeId);
        validateAnswers(active.mission, active.answers, false);
        demand(!journey.completed.includes(active.mission.id) &&
          integer(active.index, 0, active.answers.length - 1) &&
          active.answers.every((answer, index) => index < active.index ? answer.choice !== null : index === active.index || answer.choice === null && !answer.hinted),
        'The mission bookmark is invalid.');
      }
      if (journey.lastResult !== null) {
        const result = journey.lastResult;
        demand(object(result) && journey.completed.at(-1) === result.mission?.id, 'The saved answer review is invalid.');
        validateMission(result.mission, gradeId);
        validateAnswers(result.mission, result.answers, true);
        const correct = result.answers.filter((answer, index) => answer.choice === result.mission.questions[index].correctIndex).length;
        const helped = result.answers.filter(answer => answer.hinted).length;
        const part = PARTS[journey.completed.length - 1]?.id ?? null;
        demand(result.correct === correct && result.helped === helped && result.part === part,
          'The saved reward or answer totals do not match the completed mission.');
      }
      demand(grade.chapters.length > 0, 'The saved grade has no curriculum.');
    }
  }
  return save;
}

export function applyAction(save, action, at = new Date().toISOString()) {
  const next = structuredClone(save);
  const explorer = currentExplorer(next);
  const gradeId = explorer.grade;
  explorer.journeys[gradeId] ??= blankJourney();
  const journey = explorer.journeys[gradeId];
  const active = journey.active;
  switch (action.type) {
    case 'explorer':
      demand(EXPLORERS.some(explorer => explorer.id === action.id), 'Choose an existing local explorer.');
      next.activeExplorer = action.id;
      break;
    case 'grade':
      getGrade(action.id, CONTENT_VERSION);
      explorer.grade = action.id;
      break;
    case 'level':
      demand(LEVELS.some(level => level.id === action.level), 'Choose a challenge level from 1 to 3.');
      explorer.level = action.level;
      break;
    case 'start': {
      validateMission(action.mission, gradeId);
      demand(!journey.completed.includes(action.mission.id), 'This exact set is already complete. Use a fresh mission for a new reward.');
      demand(!active || action.replace === true, 'An unfinished mission is saved. Resume it or explicitly replace it.');
      journey.active = {
        mission: action.mission, index: 0,
        answers: action.mission.questions.map(() => ({ choice: null, hinted: false })),
      };
      break;
    }
    case 'hint':
      demand(active && active.mission.id === action.missionId && active.answers[active.index].choice === null, 'A hint is only available before answering the current question.');
      active.answers[active.index].hinted = true;
      break;
    case 'answer': {
      demand(active && active.mission.id === action.missionId, 'This mission is no longer active.');
      const question = active.mission.questions[active.index];
      const answer = active.answers[active.index];
      demand(answer.choice === null, 'This answer is already saved.');
      demand(integer(action.choice, 0, question.options.length - 1), 'Choose one of the displayed answers.');
      answer.choice = action.choice;
      const key = `${question.id}:${question.level}`;
      journey.attempts = journey.attempts.filter(attempt => `${attempt.id}:${attempt.level}` !== key);
      const correct = question.correctIndex === answer.choice;
      const misconception = !correct && active.mission.contentVersion === CONTENT_VERSION
        ? question.feedback?.[answer.choice]?.code : undefined;
      journey.attempts.push({
        id: question.id, skill: question.skill, chapter: question.chapter, level: question.level,
        contentVersion: active.mission.contentVersion, correct, hinted: answer.hinted, at,
        ...(misconception === undefined ? {} : { misconception }),
      });
      break;
    }
    case 'next':
      demand(active && active.mission.id === action.missionId && active.answers[active.index].choice !== null &&
        active.index < active.answers.length - 1, 'Answer the current question before moving on.');
      active.index++;
      break;
    case 'complete': {
      if (journey.completed.includes(action.missionId)) return save;
      demand(active && active.mission.id === action.missionId && active.answers.every(answer => answer.choice !== null),
        'Every question must be answered before the mission can be completed.');
      const correct = active.answers.filter((answer, index) => answer.choice === active.mission.questions[index].correctIndex).length;
      const helped = active.answers.filter(answer => answer.hinted).length;
      const part = PARTS[journey.earned.length]?.id ?? null;
      if (part) journey.earned.push(part);
      journey.charges++;
      journey.completed.push(active.mission.id);
      journey.history.push({
        id: active.mission.id, title: active.mission.title, level: active.mission.level,
        correct, helped, count: active.answers.length, at,
      });
      journey.history = journey.history.slice(-20);
      journey.lastResult = { mission: active.mission, answers: active.answers, part, correct, helped };
      journey.active = null;
      break;
    }
    case 'fit':
      demand(!journey.flight, 'Finish your saved flight before changing the rocket.');
      demand(PARTS.some(part => part.id === action.part) && journey.earned.includes(action.part), 'Complete a mission to earn this part first.');
      demand(action.slot === action.part, 'That part belongs in its matching labelled slot.');
      if (!journey.fitted.includes(action.part)) journey.fitted.push(action.part);
      break;
    case 'remove':
      demand(!journey.flight && journey.fitted.includes(action.part), 'Only a fitted part can be removed, and not during a flight.');
      journey.fitted = journey.fitted.filter(part => part !== action.part);
      break;
    case 'paint':
      demand(PAINTS.some(paint => paint.id === action.id), 'Choose an available rocket paint.');
      journey.paint = action.id;
      break;
    case 'launch':
      demand(!journey.flight && journey.fitted.length === PARTS.length, 'Fit all six earned parts before launching.');
      demand(journey.charges > 0, 'Complete another mission to earn a launch charge.');
      demand(journey.visits.length < DESTINATIONS.length, 'Every destination is already discovered. You can revisit them without spending a charge.');
      journey.flight = { id: `flight:${gradeId}:${journey.visits.length}`, destination: DESTINATIONS[journey.visits.length].id };
      journey.charges--;
      break;
    case 'arrive':
      if (!journey.flight && journey.visits.includes(action.destination)) return save;
      demand(journey.flight?.id === action.flightId && journey.flight.destination === action.destination, 'This flight is not pending.');
      journey.visits.push(journey.flight.destination);
      journey.flight = null;
      break;
    case 'reset-explorer':
      next.explorers[next.activeExplorer] = blankExplorer();
      break;
    default: throw new Error('Unknown Academy progress action.');
  }
  next.revision++;
  return validateSave(next);
}

export function skillReport(journey, skill, level) {
  demand(SKILLS[skill] && LEVELS.some(item => item.id === level), 'Unknown skill or challenge level.');
  const records = [...new Map(journey.attempts.filter(attempt =>
    isCurrentAttempt(attempt) && attempt.skill === skill && attempt.level === level)
    .map(attempt => [`${attempt.id}:${attempt.level}`, attempt])).values()];
  const independent = records.filter(attempt => !attempt.hinted).slice(-20);
  const correct = independent.filter(attempt => attempt.correct).length;
  const rate = independent.length ? correct / independent.length : null;
  const status = independent.length < 5 ? 'Gathering evidence' : rate >= 0.8 ? 'Going well' : rate <= 0.6 ? 'Practise next' : 'Building confidence';
  const trend = independent.length >= 10 ? {
    recent: independent.slice(-5).filter(attempt => attempt.correct).length,
    previous: independent.slice(-10, -5).filter(attempt => attempt.correct).length,
  } : null;
  const focuses = new Map();
  for (const attempt of independent) {
    if (!attempt.correct && typeof attempt.misconception === 'string' && Object.hasOwn(MISCONCEPTIONS, attempt.misconception)) {
      focuses.set(attempt.misconception, (focuses.get(attempt.misconception) ?? 0) + 1);
    }
  }
  const common = [...focuses].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const practiceFocus = independent.length >= 5 && common?.[1] >= 3
    ? { code: common[0], count: common[1], ...MISCONCEPTIONS[common[0]] } : null;
  return {
    skill, title: SKILLS[skill][0], tip: SKILLS[skill][1], status,
    count: independent.length, correct, helped: records.filter(attempt => attempt.hinted).length, rate, trend, practiceFocus,
  };
}

export function recommendChapter(gradeId, journey, level) {
  const chapters = getGrade(gradeId, CONTENT_VERSION).chapters;
  const attempts = journey.attempts.filter(attempt => isCurrentAttempt(attempt) && attempt.level === level);
  const weak = chapters.find(chapter => chapter.skills.some(skill => skillReport(journey, skill, level).status === 'Practise next'));
  if (weak) return { chapter: weak, reason: 'A few fresh questions on this skill would be a useful next step.' };
  const fresh = chapters.find(chapter => !attempts.some(attempt => attempt.chapter === chapter.id));
  if (fresh) return { chapter: fresh, reason: 'Explore a chapter you have not tried at this challenge level.' };
  return {
    chapter: [...chapters].sort((a, b) =>
      attempts.filter(attempt => attempt.chapter === a.id).length -
      attempts.filter(attempt => attempt.chapter === b.id).length)[0],
    reason: 'Revisit this chapter with a fresh set, or choose another mission below.',
  };
}
