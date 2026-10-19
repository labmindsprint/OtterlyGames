import { CONTENT_VERSION, CONTENT_VERSIONS, EVIDENCE_VERSIONS, ALL_MISCONCEPTIONS as MISCONCEPTIONS, gameLink, getChapter, getGrade, GRADES, LEVELS, SKILLS } from './curriculum.mjs';
import { DESTINATIONS, PAINTS, PARTS } from './destinations.mjs';
import { createMission } from './questions.mjs';
import { CAMPAIGN_VERSION, activitySeed, chapterSystem, getCampaign } from './campaigns.mjs';
import { applyActivityAction, createActivity, isActivityComplete, validateActivity } from './campaign-activities.mjs';
import { validateSave as validateLegacySave } from './progress-v1.mjs';

export const SAVE_VERSION = 2;
export const EXPLORERS = [
  { id: 'explorer-1', name: 'Explorer 1', callSign: 'Nova' },
  { id: 'explorer-2', name: 'Explorer 2', callSign: 'Comet' },
  { id: 'explorer-3', name: 'Explorer 3', callSign: 'Orbit' },
];

const blankExplorer = () => ({ grade: 'class-1', level: 1, journeys: {} });
const blankExpedition = () => ({
  version: CAMPAIGN_VERSION, legacyCompleted: [], legacyParts: [], legacyChapters: [],
  credits: {}, visits: [], paid: [], activity: null,
});
export const blankJourney = () => ({
  earned: [], fitted: [], paint: 'coral', charges: 0, visits: [], flight: null,
  active: null, completed: [], history: [], attempts: [], lastResult: null,
  expedition: blankExpedition(),
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
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function legacyChapters(gradeId, completed) {
  return getGrade(gradeId).chapters.filter(chapter => completed.some(id =>
    CONTENT_VERSIONS.some(version => id.startsWith(`m${version}:${gradeId}:chapter:${chapter.id}:`))))
    .map(chapter => chapter.id);
}

function migrateSave(save) {
  validateLegacySave(save);
  const next = structuredClone(save);
  next.version = SAVE_VERSION;
  next.revision++;
  for (const explorer of Object.values(next.explorers)) {
    for (const [gradeId, journey] of Object.entries(explorer.journeys)) {
      journey.expedition = {
        ...blankExpedition(), legacyCompleted: [...journey.completed], legacyParts: [...journey.earned],
        legacyChapters: legacyChapters(gradeId, journey.completed),
      };
      journey.earned = eligibleParts(journey, gradeId);
    }
  }
  return next;
}

function chapterFinished(journey, gradeId, chapterId, before = journey.completed.length) {
  const expedition = journey.expedition;
  return expedition.legacyChapters.includes(chapterId) ||
    (expedition.credits[chapterId] ?? []).filter(credit =>
      journey.completed.indexOf(credit.missionId) < before).length >= getCampaign(gradeId).questionTarget;
}

function eligibleParts(journey, gradeId, before = journey.completed.length) {
  return getCampaign(gradeId).systems.filter(system =>
    journey.expedition.legacyParts.includes(system.id) ||
    system.chapters.every(chapter => chapterFinished(journey, gradeId, chapter, before)))
    .map(system => system.id);
}

export function chapterObjectives(gradeId, journey) {
  const campaign = getCampaign(gradeId);
  return getGrade(gradeId).chapters.map(chapter => {
    const retained = journey.expedition.legacyChapters.includes(chapter.id);
    const count = retained ? campaign.questionTarget : (journey.expedition.credits[chapter.id] ?? []).length;
    return {
      id: chapter.id, title: chapter.title, count, target: campaign.questionTarget,
      complete: count === campaign.questionTarget, retained, part: chapterSystem(gradeId, chapter.id).id,
    };
  });
}

export function universePassport(save, explorerId = save.activeExplorer) {
  demand(EXPLORERS.some(explorer => explorer.id === explorerId), 'Choose an existing local explorer.');
  const discovered = new Set(Object.values(save.explorers[explorerId].journeys)
    .flatMap(journey => [...journey.visits, ...journey.expedition.visits]));
  return DESTINATIONS.filter(world => discovered.has(world.id));
}

export function currentActivity(save) {
  const gradeId = currentExplorer(save).grade;
  const journey = currentJourney(save);
  const stage = getCampaign(gradeId).stages[journey.expedition.visits.length];
  if (!stage) return null;
  return journey.expedition.activity ?? createActivity({
    gradeId, destinationId: stage.destination, seed: activitySeed(gradeId, stage.index),
  });
}

export function campaignStatus(save) {
  const gradeId = currentExplorer(save).grade;
  const journey = currentJourney(save);
  const campaign = getCampaign(gradeId);
  const stage = campaign.stages[journey.expedition.visits.length] ?? null;
  const missing = stage ? stage.parts.filter(part => !journey.fitted.includes(part)) : [];
  const activity = currentActivity(save);
  const solved = activity !== null && isActivityComplete(activity);
  const known = stage !== null && universePassport(save).some(world => world.id === stage.destination);
  return {
    campaign, stage, missing, activity, solved, known,
    ready: stage !== null && !journey.flight && missing.length === 0 && solved && (known || journey.charges > 0),
  };
}

export function campaignRecommendation(gradeId, journey, level) {
  const stage = getCampaign(gradeId).stages[journey.expedition.visits.length];
  const needed = stage?.parts.filter(part => !journey.earned.includes(part)) ?? [];
  const objective = chapterObjectives(gradeId, journey).find(chapter => !chapter.complete && needed.includes(chapter.part));
  if (!objective) return recommendChapter(gradeId, journey, level);
  return {
    chapter: getChapter(gradeId, objective.id),
    reason: `Complete ${objective.target - objective.count} more different question${objective.target - objective.count === 1 ? '' : 's'} in finished missions towards a system for your next expedition. Hints and wrong answers still count as participation.`,
  };
}

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
  return object(attempt) && typeof attempt.id === 'string' && EVIDENCE_VERSIONS.some(version => attempt.id.startsWith(`q${version}-`)) &&
    (attempt.contentVersion === undefined || EVIDENCE_VERSIONS.includes(attempt.contentVersion));
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
  if (object(save) && save.version === 1) return validateSave(migrateSave(save));
  demand(object(save) && save.version === SAVE_VERSION, 'This is not a supported Space Academy save. Nothing has been reset.');
  demand(integer(save.revision) && EXPLORERS.some(explorer => explorer.id === save.activeExplorer), 'The saved explorer selection is invalid.');
  demand(object(save.explorers) && Object.keys(save.explorers).length === EXPLORERS.length, 'The save needs all three local explorer slots.');
  for (const { id } of EXPLORERS) {
    const explorer = save.explorers[id];
    demand(object(explorer) && GRADES.some(grade => grade.id === explorer.grade) &&
      LEVELS.some(level => level.id === explorer.level) && object(explorer.journeys), 'A saved explorer is invalid.');
    for (const [gradeId, journey] of Object.entries(explorer.journeys)) {
      const grade = getGrade(gradeId);
      demand(object(journey) && unique(journey.completed) && journey.completed.every(value =>
        typeof value === 'string' && CONTENT_VERSIONS.some(version => value.startsWith(`m${version}:${gradeId}:`))),
        'The mission-completion history is invalid.');
      const expedition = journey.expedition;
      const campaign = getCampaign(gradeId);
      demand(object(expedition) && expedition.version === CAMPAIGN_VERSION, 'The saved grade campaign is unsupported. Nothing has been reset.');
      demand(unique(expedition.legacyCompleted) && same(expedition.legacyCompleted, journey.completed.slice(0, expedition.legacyCompleted.length)),
        'The retained mission history is invalid.');
      demand(same(expedition.legacyParts, PARTS.slice(0, Math.min(PARTS.length, expedition.legacyCompleted.length)).map(part => part.id)) &&
        same(expedition.legacyChapters, legacyChapters(gradeId, expedition.legacyCompleted)), 'The retained chapter or craft rewards are invalid.');
      demand(object(expedition.credits), 'The chapter-objective history is invalid.');
      const credited = new Set();
      for (const [chapterId, credits] of Object.entries(expedition.credits)) {
        getChapter(gradeId, chapterId);
        demand(Array.isArray(credits) && credits.length <= campaign.questionTarget, 'A chapter has too many participation credits.');
        let previous = expedition.legacyCompleted.length;
        for (const credit of credits) {
          demand(object(credit) && typeof credit.id === 'string' &&
            CONTENT_VERSIONS.some(version => credit.id.startsWith(`q${version}-${gradeId}-`)) &&
            typeof credit.missionId === 'string', 'A chapter participation credit is invalid.');
          const index = journey.completed.indexOf(credit.missionId);
          demand(index >= previous && !credited.has(credit.id), 'Participation must come from different questions in completed missions.');
          credited.add(credit.id);
          previous = index;
        }
      }
      demand(same(journey.earned, eligibleParts(journey, gradeId)), 'Earned craft systems do not match chapter objectives or retained rewards.');
      demand(unique(journey.fitted) && journey.fitted.every(part => journey.earned.includes(part)), 'An unearned or repeated rocket part is fitted.');
      demand(PAINTS.some(paint => paint.id === journey.paint), 'The rocket paint is invalid.');
      demand(unique(journey.visits) && journey.visits.length <= DESTINATIONS.length &&
        journey.visits.every((key, index) => DESTINATIONS[index]?.id === key), 'The discovery route is invalid.');
      demand(journey.visits.length <= expedition.legacyCompleted.length &&
        unique(expedition.visits) && expedition.visits.length <= campaign.stages.length &&
        expedition.visits.every((key, index) => campaign.stages[index]?.destination === key), 'The grade expedition route is invalid.');
      demand(unique(expedition.paid) && same(expedition.paid, expedition.visits.filter(id => expedition.paid.includes(id))),
        'The expedition launch-charge history is invalid.');
      const legacyDiscovery = destination => Object.values(explorer.journeys).some(other =>
        Array.isArray(other.visits) && other.visits.includes(destination));
      demand(expedition.visits.every(destination => expedition.paid.includes(destination) || legacyDiscovery(destination)),
        'A free expedition revisit needs an existing discovery in this explorer passport.');
      if (expedition.activity !== null) {
        validateActivity(expedition.activity);
        const stage = campaign.stages[expedition.visits.length];
        demand(stage && expedition.activity.gradeId === gradeId &&
          expedition.activity.destinationId === stage.destination &&
          expedition.activity.seed === activitySeed(gradeId, stage.index), 'The saved activity belongs to a different expedition.');
      }
      if (journey.flight !== null) {
        demand(object(journey.flight), 'The saved flight is invalid.');
        if (journey.flight.campaignVersion === undefined) {
          demand(journey.visits.length < DESTINATIONS.length &&
            journey.visits.length < expedition.legacyCompleted.length &&
            journey.flight.destination === DESTINATIONS[journey.visits.length]?.id &&
            journey.flight.id === `flight:${gradeId}:${journey.visits.length}` && journey.fitted.length === PARTS.length,
          'The retained saved flight is invalid.');
        } else {
          const stage = campaign.stages[expedition.visits.length];
          demand(stage && journey.flight.campaignVersion === CAMPAIGN_VERSION &&
            journey.flight.stage === stage.index && journey.flight.destination === stage.destination &&
            journey.flight.id === `expedition:${CAMPAIGN_VERSION}:${gradeId}:${stage.index}` &&
            typeof journey.flight.charged === 'boolean' &&
            (journey.flight.charged || legacyDiscovery(stage.destination)) &&
            stage.parts.every(part => journey.fitted.includes(part)) &&
            expedition.activity !== null && isActivityComplete(expedition.activity), 'The saved campaign flight is invalid.');
        }
      }
      const reserved = journey.flight && (journey.flight.campaignVersion === undefined || journey.flight.charged) ? 1 : 0;
      demand(integer(journey.charges) && journey.charges === journey.completed.length - journey.visits.length - expedition.paid.length - reserved,
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
        demand(attempt.misconception === undefined || (EVIDENCE_VERSIONS.includes(contentVersion) && !attempt.correct &&
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
        let parts;
        if (expedition.legacyCompleted.includes(result.mission.id)) {
          parts = [PARTS[expedition.legacyCompleted.indexOf(result.mission.id)]?.id].filter(Boolean);
        } else {
          const previous = eligibleParts(journey, gradeId, journey.completed.length - 1);
          parts = journey.earned.filter(part => !previous.includes(part));
          demand(same(result.parts, parts), 'The saved chapter-system rewards do not match participation.');
        }
        demand(result.correct === correct && result.helped === helped && result.part === (parts[0] ?? null),
          'The saved reward or answer totals do not match the completed mission.');
      }
      demand(grade.chapters.length > 0, 'The saved grade has no curriculum.');
    }
  }
  return save;
}

export function applyAction(save, action, at = new Date().toISOString()) {
  const current = validateSave(save);
  const next = structuredClone(current);
  const explorer = currentExplorer(next);
  const gradeId = explorer.grade;
  const journey = explorer.journeys[gradeId] ?? blankJourney();
  if (!['explorer', 'grade', 'level', 'reset-explorer'].includes(action.type)) explorer.journeys[gradeId] = journey;
  const active = journey.active;
  switch (action.type) {
    case 'explorer':
      demand(EXPLORERS.some(explorer => explorer.id === action.id), 'Choose an existing local explorer.');
      next.activeExplorer = action.id;
      break;
    case 'grade':
      getGrade(action.id);
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
      const misconception = !correct && EVIDENCE_VERSIONS.includes(active.mission.contentVersion)
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
      if (journey.completed.includes(action.missionId)) return current;
      demand(active && active.mission.id === action.missionId && active.answers.every(answer => answer.choice !== null),
        'Every question must be answered before the mission can be completed.');
      const correct = active.answers.filter((answer, index) => answer.choice === active.mission.questions[index].correctIndex).length;
      const helped = active.answers.filter(answer => answer.hinted).length;
      journey.charges++;
      journey.completed.push(active.mission.id);
      const credited = new Set(Object.values(journey.expedition.credits).flatMap(credits => credits.map(credit => credit.id)));
      for (const question of active.mission.questions) {
        const credits = journey.expedition.credits[question.chapter] ??= [];
        if (credits.length < getCampaign(gradeId).questionTarget && !credited.has(question.id) &&
            !journey.expedition.legacyChapters.includes(question.chapter)) {
          credits.push({ id: question.id, missionId: active.mission.id });
          credited.add(question.id);
        }
      }
      const earned = eligibleParts(journey, gradeId);
      const parts = earned.filter(part => !journey.earned.includes(part));
      journey.earned = earned;
      journey.history.push({
        id: active.mission.id, title: active.mission.title, level: active.mission.level,
        correct, helped, count: active.answers.length, at,
      });
      journey.history = journey.history.slice(-20);
      journey.lastResult = { mission: active.mission, answers: active.answers, part: parts[0] ?? null, parts, correct, helped };
      journey.active = null;
      break;
    }
    case 'fit':
      demand(!journey.flight, 'Finish your saved flight before changing the rocket.');
      demand(PARTS.some(part => part.id === action.part) && journey.earned.includes(action.part), 'Complete the linked chapter objectives to earn this system first.');
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
    case 'activity': {
      demand(!journey.flight, 'Finish the saved flight before changing your activity.');
      const activity = currentActivity(next);
      demand(activity, 'This grade campaign is complete. You can revisit your discoveries in the Passport.');
      journey.expedition.activity = applyActivityAction(activity, action.move);
      break;
    }
    case 'launch': {
      const readiness = campaignStatus(next);
      demand(!journey.flight, 'A flight is already saved. Continue it without spending another charge.');
      demand(readiness.stage, 'This campaign is complete. Choose another grade or revisit your Passport.');
      demand(!readiness.missing.length, 'Fit the systems on this expedition checklist before launching.');
      demand(readiness.solved, 'Complete the expedition activity before launching.');
      demand(readiness.known || journey.charges > 0, 'Complete another question mission to earn a launch charge.');
      journey.flight = {
        id: `expedition:${CAMPAIGN_VERSION}:${gradeId}:${readiness.stage.index}`,
        destination: readiness.stage.destination, campaignVersion: CAMPAIGN_VERSION,
        stage: readiness.stage.index, charged: !readiness.known,
      };
      if (!readiness.known) journey.charges--;
      break;
    }
    case 'arrive':
      if (!journey.flight && [...journey.visits, ...journey.expedition.visits].includes(action.destination)) return current;
      demand(journey.flight?.id === action.flightId && journey.flight.destination === action.destination, 'This flight is not pending.');
      if (journey.flight.campaignVersion === undefined) journey.visits.push(journey.flight.destination);
      else {
        journey.expedition.visits.push(journey.flight.destination);
        if (journey.flight.charged) journey.expedition.paid.push(journey.flight.destination);
        journey.expedition.activity = null;
      }
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
  const chapters = getGrade(gradeId).chapters;
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
