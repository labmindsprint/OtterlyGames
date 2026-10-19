import { BANK3, CONTENT_VERSION, FAMILIES_V2, assembleBank3, getChapter, getGrade, LEVELS, SKILLS } from './curriculum.mjs';
import { createMission as legacyMission, verifyQuestion as verifyLegacy } from './questions-v1.mjs';
import { MISCONCEPTIONS, QuestionRetry, randomContext } from './bank-shared.mjs';
import { NUMBER_FAMILIES, draftNumbers, solveNumbers } from './bank-numbers.mjs';
import { REASONING_FAMILIES, draftReasoning, solveReasoning } from './bank-reasoning.mjs';
import { EVERYDAY_FAMILIES, draftEveryday, solveEveryday } from './bank-everyday.mjs';

const ENGINES = new Map();
for (const [families, draft, solve] of [
  [NUMBER_FAMILIES, draftNumbers, solveNumbers],
  [REASONING_FAMILIES, draftReasoning, solveReasoning],
  [EVERYDAY_FAMILIES, draftEveryday, solveEveryday],
]) {
  for (const family of families) {
    if (!FAMILIES_V2[family] || ENGINES.has(family)) throw new Error(`Unknown or repeated question engine: ${family}`);
    ENGINES.set(family, { draft, solve });
  }
}
for (const family of Object.keys(FAMILIES_V2)) if (!ENGINES.has(family)) throw new Error(`Missing question engine: ${family}`);

// A bank is the version 3 curriculum plus an engine for every family. Tests may build one from a single grade module.
export function createBank(modules = BANK3.modules) {
  const bank = modules === BANK3.modules ? BANK3 : assembleBank3(modules);
  const engines = new Map([...ENGINES].map(([family, engine]) =>
    [family, { ...engine, draft: (name, grade, level, r) => engine.draft(name, grade, level, r, true) }]));
  for (const module of Object.values(modules)) {
    for (const family of Object.keys(module.FAMILIES ?? {})) engines.set(family, { draft: module.draft, solve: module.solve });
  }
  for (const family of Object.keys(bank.families)) if (!engines.has(family)) throw new Error(`Missing question engine: ${family}`);
  return { ...bank, engines };
}
const BANK = createBank();

function hash(text) {
  let result = 2166136261;
  for (const character of text) result = Math.imul(result ^ character.charCodeAt(0), 16777619) >>> 0;
  return result.toString(36);
}

function validateVisual(visual, prefixes) {
  if (!visual || typeof visual.kind !== 'string' || !prefixes.some(prefix => visual.kind.startsWith(prefix)) ||
      typeof visual.description !== 'string' || !visual.description.trim()) {
    throw new Error('An original diagram needs a supported model and an accessible description.');
  }
}

export function verifyQuestion(question, bank = BANK) {
  if (question?.id?.startsWith('q1-')) return verifyLegacy(question);
  const version = question?.id?.startsWith('q3-') ? 3 : 2;
  const engine = (version === 3 ? bank.engines : ENGINES).get(question?.family);
  const known = version === 3 ? bank.misconceptions : MISCONCEPTIONS;
  const prefixes = version === 3 ? ['v2-', 'v3-'] : ['v2-'];
  if (!engine || !question.id?.startsWith(`q${version}-${question.grade}-`) ||
      !question.prompt || !question.hint || !question.explanation ||
      !Array.isArray(question.options) || question.options.length < 2 ||
      question.options.some(option => typeof option !== 'string' || !option.length) ||
      new Set(question.options).size !== question.options.length ||
      !Number.isSafeInteger(question.correctIndex) ||
      question.options[question.correctIndex] !== question.answer ||
      !Array.isArray(question.feedback) || question.feedback.length !== question.options.length) {
    throw new Error(`Invalid original question: ${question?.id ?? 'unknown'}`);
  }
  if (question.visual) validateVisual(question.visual, prefixes);
  if (question.optionVisuals) {
    if (question.optionVisuals.length !== question.options.length) throw new Error('Picture choices are not aligned with their labels.');
    const seen = new Set();
    for (const visual of question.optionVisuals) {
      if (visual === null) continue;
      validateVisual(visual, prefixes);
      const { description, ...model } = visual;
      const key = JSON.stringify(model);
      if (seen.has(key)) throw new Error('Two picture choices show the same diagram.');
      seen.add(key);
    }
  }
  question.feedback.forEach((feedback, index) => {
    if (index === question.correctIndex) {
      if (feedback !== null) throw new Error('A correct option cannot have misconception feedback.');
    } else if (!feedback || !known[feedback.code] || feedback.message !== known[feedback.code].message) {
      throw new Error('A wrong option needs its own valid practice feedback.');
    }
  });
  if (String(engine.solve(question)) !== question.answer) throw new Error(`The diagram and givens do not support the answer: ${question.id}`);
  return true;
}

// Version 2 is frozen: saved missions are regenerated from their seed and compared as JSON.
function missionV2({ grade: gradeId, chapter: chapterId, level = 1, mode = 'chapter', seed }) {
  const grade = getGrade(gradeId, 2);
  if (!LEVELS.some(item => item.id === level)) throw new RangeError('Choose a challenge level from 1 to 3.');
  if (typeof seed !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(seed)) throw new RangeError('Invalid mission seed.');
  if (!['chapter', 'mixed', 'paper'].includes(mode)) throw new RangeError('Unknown mission mode.');
  if (mode !== 'chapter' && chapterId != null) throw new RangeError('Mixed missions and practice papers do not use a chapter setting.');
  if (mode === 'paper' && grade.year < 1) throw new RangeError('Pre-primary learners have picture missions, not exam papers.');
  const chapters = mode === 'chapter' ? [getChapter(gradeId, chapterId, 2)] : grade.chapters;
  const r = randomContext(`academy-2|${gradeId}|${chapterId ?? mode}|${level}|${seed}`);
  const count = mode === 'paper' ? (grade.year === 5 ? 50 : 35) : grade.missionSize;
  const sections = mode !== 'paper' ? null : [
    ...Array(grade.year === 5 ? 15 : 10).fill('reasoning'),
    ...Array(grade.year === 5 ? 20 : 10).fill('maths'),
    ...Array(10).fill('everyday'), ...Array(5).fill('stretch'),
  ];
  const questions = [];
  const seen = new Set();
  const chapterCounts = new Map();
  for (let attempt = 0; questions.length < count && attempt < count * 200; attempt++) {
    const section = sections?.[questions.length];
    const pool = section && section !== 'stretch' ? chapters.filter(chapter => chapter.section === section) : chapters;
    if (!pool.length) throw new Error(`The ${gradeId} curriculum has no ${section} questions.`);
    const chapter = r.pick(pool);
    const questionLevel = section === 'stretch' ? 3 : level;
    const families = chapter.families[questionLevel - 1];
    const chapterKey = `${chapter.id}:${questionLevel}`;
    const familyIndex = chapterCounts.get(chapterKey) ?? r.int(0, families.length - 1);
    const family = families[familyIndex % families.length];
    let candidate;
    try {
      candidate = ENGINES.get(family).draft(family, grade, questionLevel, r);
    } catch (error) {
      if (error instanceof QuestionRetry) continue;
      throw error;
    }
    const { choices, ...base } = candidate;
    if (!Array.isArray(choices) || choices.filter(choice => choice.value === candidate.answer && choice.code === null).length !== 1) {
      throw new Error(`The ${family} question needs exactly one correct answer.`);
    }
    const skill = FAMILIES_V2[family].skill;
    const id = `q2-${gradeId}-${skill}-${hash(JSON.stringify([family, candidate.prompt, candidate.visual ?? null, candidate.answer, candidate.proof]))}`;
    if (seen.has(id)) continue;
    const ordered = r.shuffle(choices);
    const question = {
      ...base, hint: candidate.hint ?? SKILLS[skill][1], id,
      grade: gradeId, chapter: chapter.id, skill, level: questionLevel, family,
      section: section ?? chapter.section,
      options: ordered.map(choice => choice.value),
      correctIndex: ordered.findIndex(choice => choice.code === null),
      feedback: ordered.map(choice => choice.code === null ? null : { code: choice.code, message: MISCONCEPTIONS[choice.code]?.message }),
      ...(ordered.some(choice => choice.visual) ? { optionVisuals: ordered.map(choice => choice.visual ?? null) } : {}),
    };
    verifyQuestion(question);
    seen.add(id);
    questions.push(question);
    chapterCounts.set(chapterKey, familyIndex + 1);
  }
  if (questions.length !== count) throw new Error(`The ${gradeId} ${mode} could not produce enough different questions. Keep your current set and try another seed.`);
  return {
    id: `m2:${gradeId}:${mode}:${chapterId ?? 'all'}:${level}:${seed}`,
    contentVersion: 2, grade: gradeId, chapter: mode === 'chapter' ? chapterId : null,
    level, mode, seed,
    title: mode === 'chapter' ? chapters[0].title : mode === 'paper' ? 'Olympiad-style practice paper' : 'Mixed mission',
    questions,
  };
}

function draftQuestion(bank, grade, chapter, family, level, r, section) {
  let candidate;
  try {
    candidate = bank.engines.get(family).draft(family, grade, level, r);
  } catch (error) {
    if (error instanceof QuestionRetry) return null;
    throw error;
  }
  const { choices, ...base } = candidate;
  if (!Array.isArray(choices) || choices.filter(choice => choice.value === candidate.answer && choice.code === null).length !== 1) {
    throw new Error(`The ${family} question needs exactly one correct answer.`);
  }
  const skill = bank.families[family].skill;
  const id = `q3-${grade.id}-${skill}-${hash(JSON.stringify([family, candidate.prompt, candidate.visual ?? null, candidate.answer, candidate.proof]))}`;
  const ordered = r.shuffle(choices);
  const question = {
    ...base, hint: candidate.hint ?? SKILLS[skill][1], id,
    grade: grade.id, chapter: chapter.id, skill, level, family,
    section: section ?? chapter.section,
    options: ordered.map(choice => choice.value),
    correctIndex: ordered.findIndex(choice => choice.code === null),
    feedback: ordered.map(choice => choice.code === null ? null : { code: choice.code, message: bank.misconceptions[choice.code]?.message }),
    ...(ordered.some(choice => choice.visual) ? { optionVisuals: ordered.map(choice => choice.visual ?? null) } : {}),
  };
  verifyQuestion(question, bank);
  return question;
}

// Version 3 walks each row's families in a shuffled cycle, so a set uses every format before repeating one.
// Each pick prefers, in order: a different family from the last question, a prompt not yet used in the set,
// and a different kind of picture from the last question.
function missionV3({ grade: gradeId, chapter: chapterId, level = 1, mode = 'chapter', seed }, bank) {
  const grade = bank.grades.find(item => item.id === gradeId);
  if (!grade) throw new RangeError(`Unknown Academy grade: ${gradeId}`);
  if (!LEVELS.some(item => item.id === level)) throw new RangeError('Choose a challenge level from 1 to 3.');
  if (typeof seed !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(seed)) throw new RangeError('Invalid mission seed.');
  if (!['chapter', 'mixed', 'paper'].includes(mode)) throw new RangeError('Unknown mission mode.');
  if (mode !== 'chapter' && chapterId != null) throw new RangeError('Mixed missions and practice papers do not use a chapter setting.');
  if (mode === 'paper' && grade.year < 1) throw new RangeError('Pre-primary learners have picture missions, not exam papers.');
  const selected = mode === 'chapter' ? grade.chapters.find(item => item.id === chapterId) : null;
  if (mode === 'chapter' && !selected) throw new RangeError(`Unknown Academy chapter: ${gradeId}/${chapterId}`);
  const chapters = selected ? [selected] : grade.chapters;
  const r = randomContext(`academy-3|${gradeId}|${chapterId ?? mode}|${level}|${seed}`);
  const count = mode === 'paper' ? (grade.year === 5 ? 50 : 35) : grade.missionSize;
  const sections = mode !== 'paper' ? null : [
    ...Array(grade.year === 5 ? 15 : 10).fill('reasoning'),
    ...Array(grade.year === 5 ? 20 : 10).fill('maths'),
    ...Array(10).fill('everyday'), ...Array(5).fill('stretch'),
  ];
  const queues = new Map();
  const lastTaken = new Map();
  const queueFor = (key, items) => {
    let queue = queues.get(key);
    if (!queue?.length) {
      queue = r.shuffle(items);
      if (queue.length > 1 && queue[0] === lastTaken.get(key)) queue.push(queue.shift());
      queues.set(key, queue);
    }
    return queue;
  };
  const consume = (key, item) => {
    const queue = queues.get(key);
    queue.splice(queue.indexOf(item), 1);
    lastTaken.set(key, item);
  };
  const questions = [];
  const seen = new Set();
  const prompts = new Set();
  const fixedPrompt = new Set();
  let previousKind = null;
  let previousFamily = null;
  // A new question, redrawn to avoid a repeated prompt. A family whose prompt never changes (its picture carries the
  // variety) returns its repeat, and is then allowed one repeated-prompt draw per pick instead of six.
  // A draw that was already used or retried does not count against that allowance.
  const freshQuestion = (chapter, family, questionLevel, section) => {
    let repeat = null;
    let repeats = 0;
    for (let tries = 0; tries < 12 && repeats < (fixedPrompt.has(family) ? 1 : 6); tries++) {
      const question = draftQuestion(bank, grade, chapter, family, questionLevel, r, section);
      if (!question || seen.has(question.id)) continue;
      if (!prompts.has(question.prompt)) return { question, repeated: false };
      repeat ??= question;
      repeats++;
    }
    if (!repeat) return null;
    fixedPrompt.add(family);
    return { question: repeat, repeated: true };
  };
  for (let attempt = 0; questions.length < count && attempt < count * 100; attempt++) {
    const section = sections?.[questions.length];
    const pool = section && section !== 'stretch' ? chapters.filter(chapter => chapter.section === section) : chapters;
    if (!pool.length) throw new Error(`The ${gradeId} curriculum has no ${section} questions.`);
    const chapterKey = `chapter:${section ?? 'all'}`;
    const chapter = queueFor(chapterKey, pool)[0];
    consume(chapterKey, chapter);
    const questionLevel = section === 'stretch' ? 3 : level;
    const familyKey = `family:${chapter.id}:${questionLevel}`;
    const row = chapter.families[questionLevel - 1];
    const queue = queueFor(familyKey, row);
    // When only the family just used is left in this round, bring the rest of the row back in so it never repeats back to back.
    if (queue.length === 1 && queue[0] === previousFamily && row.length > 1) queue.push(...r.shuffle(row.filter(family => family !== previousFamily)));
    let chosen = null;
    let rank = Infinity;
    for (const family of [...queue]) {
      const found = freshQuestion(chapter, family, questionLevel, section);
      if (!found) {
        consume(familyKey, family);
        continue;
      }
      const kind = found.question.visual?.kind;
      const score = (family === previousFamily ? 4 : 0) + (found.repeated ? 2 : 0) + (kind && kind === previousKind ? 1 : 0);
      if (score < rank) {
        chosen = { family, question: found.question };
        rank = score;
      }
      if (!rank) break;
    }
    if (!chosen) continue;
    consume(familyKey, chosen.family);
    seen.add(chosen.question.id);
    prompts.add(chosen.question.prompt);
    questions.push(chosen.question);
    previousKind = chosen.question.visual?.kind ?? null;
    previousFamily = chosen.family;
  }
  if (questions.length !== count) throw new Error(`The ${gradeId} ${mode} could not produce enough different questions. Keep your current set and try another seed.`);
  return {
    id: `m3:${gradeId}:${mode}:${chapterId ?? 'all'}:${level}:${seed}`,
    contentVersion: 3, grade: gradeId, chapter: mode === 'chapter' ? chapterId : null,
    level, mode, seed,
    title: mode === 'chapter' ? chapters[0].title : mode === 'paper' ? 'Olympiad-style practice paper' : 'Mixed mission',
    questions,
  };
}

export function createMission({ grade: gradeId, chapter: chapterId, level = 1, mode = 'chapter', seed, contentVersion = CONTENT_VERSION }, bank = BANK) {
  getGrade(gradeId, contentVersion);
  const request = { grade: gradeId, chapter: chapterId, level, mode, seed };
  if (contentVersion === 1) return legacyMission(request);
  return contentVersion === 2 ? missionV2(request) : missionV3(request, bank);
}
