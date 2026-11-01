import { GRADES, LEVELS, gameLink } from './space-academy/curriculum.mjs';
import { createMission } from './space-academy/questions.mjs';
import { answerChoice, diagram, escapeHTML } from './space-academy/art.mjs';
import { choiceDescription } from './space-academy/question-display.mjs';
import { isAcademyPaper, normalizeSettings } from './worksheet-generator.mjs';

export const SECTION_TITLES = Object.freeze({
  reasoning: 'Logical reasoning',
  maths: 'Mathematical reasoning',
  everyday: 'Everyday mathematics',
  stretch: 'Achievers: stretch questions',
});
const MAXIMUM_EXTRA_MISSIONS = 12;

// Chapters shown by the worksheet builder come from the same curriculum the game plays.
export function academyCatalog() {
  return GRADES.map(grade => ({
    id: grade.id,
    label: grade.label,
    paper: grade.year >= 1,
    chapters: grade.chapters.map(chapter => ({ id: chapter.id, title: chapter.title })),
  }));
}

function chapterPool(settings, level, wanted) {
  const mode = settings.chapter === 'mixed' ? 'mixed' : 'chapter';
  const pool = [];
  const seen = new Set();
  // The first mission uses the sheet seed itself, so it matches the game's mission for that seed.
  for (let round = 0; pool.length < wanted && round <= MAXIMUM_EXTRA_MISSIONS; round += 1) {
    const seed = round === 0 ? settings.seed : `${settings.seed}-b${round}`;
    const mission = createMission({
      grade: settings.grade, level, mode, seed,
      ...(mode === 'chapter' ? { chapter: settings.chapter } : {}),
    });
    for (const question of mission.questions) {
      if (!seen.has(question.id)) {
        seen.add(question.id);
        pool.push(question);
      }
    }
  }
  if (pool.length < wanted) {
    throw new Error('This chapter could not make enough different questions. Choose fewer questions or another seed.');
  }
  return pool;
}

export function generateAcademyWorksheet(input = {}) {
  const normalized = normalizeSettings({ ...input, activity: 'academy' });
  const { settings, warnings } = normalized;
  const grade = GRADES.find(item => item.id === settings.grade);
  const chapter = grade.chapters.find(item => item.id === settings.chapter);
  if (!chapter && !['mixed', 'paper'].includes(settings.chapter)) {
    settings.chapter = 'mixed';
    warnings.push('That chapter is not part of the chosen grade. Mixed chapters were selected.');
  }

  let questions;
  if (isAcademyPaper(settings)) {
    questions = createMission({ grade: settings.grade, level: settings.level, mode: 'paper', seed: settings.seed }).questions;
  } else {
    const levels = settings.level === 'all' ? LEVELS.map(item => item.id) : [settings.level];
    const pools = levels.map(level => chapterPool(settings, level, Math.ceil(settings.count / levels.length)));
    questions = Array.from({ length: settings.count }, (_, index) => pools[index % pools.length][Math.floor(index / pools.length)]);
  }
  const selected = grade.chapters.find(item => item.id === settings.chapter);
  const title = settings.chapter === 'paper' ? 'Olympiad-style practice paper'
    : settings.chapter === 'mixed' ? 'Mixed chapters' : selected.title;
  const link = gameLink({
    grade: settings.grade,
    level: settings.level === 'all' ? 1 : settings.level,
    mode: settings.chapter === 'paper' ? 'paper' : settings.chapter === 'mixed' ? 'mixed' : 'chapter',
    ...(selected ? { chapter: selected.id } : {}),
    seed: settings.seed,
  });
  return {
    settings, warnings, questions,
    heading: { grade: grade.label, title, readiness: grade.year < 1, paper: isAcademyPaper(settings) },
    gameLink: link,
  };
}

export function optionLetter(index) {
  return String.fromCharCode(65 + index);
}

// All markup is built from the bank's own renderers, which escape their text. The question page carries no answer or explanation.
export function questionMarkup(question, number) {
  const options = question.options.map((_, index) => {
    const letter = question.optionVisuals?.[index] ? '' : `<span class="worksheet-option-letter">${optionLetter(index)}</span>`;
    return `<li class="worksheet-option">${letter}${answerChoice(question, index)}</li>`;
  }).join('');
  return `<span class="worksheet-question-number">${number}.</span>` +
    `<div class="worksheet-mcq-body"><p class="worksheet-mcq-prompt">${escapeHTML(question.prompt)}</p>` +
    `${diagram(question.visual)}<ol class="worksheet-options" aria-label="Answer choices">${options}</ol></div>`;
}

export function answerMarkup(question) {
  const letter = optionLetter(question.correctIndex);
  const answer = question.optionVisuals?.[question.correctIndex]
    ? escapeHTML(choiceDescription(question, question.correctIndex))
    : `${letter}. ${escapeHTML(question.answer)}`;
  return `<strong>${answer}</strong><span class="worksheet-key-explanation">${escapeHTML(question.explanation)}</span>`;
}
