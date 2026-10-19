import { classById, PAPER_QUESTIONS } from './data.mjs';
import { PRINT_QUESTIONS } from './schematics.mjs';
import { createMission } from '../questions.mjs';

export const PART_QUESTIONS = 8;
const PRE_PRIMARY = new Set(['pp1', 'pp2']);
export const partSize = classId => (PRE_PRIMARY.has(classId) ? 5 : PART_QUESTIONS);
// Pre-primary children get a 20-picture parade instead of an exam-length paper.
export const paperSize = classId => (PRE_PRIMARY.has(classId) ? 20 : PAPER_QUESTIONS);

export const freshSeed = () => `ps-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

// Each question keeps its chapter so every answer feeds the right proficiency bar.
const take = (mission, count) => mission.questions.slice(0, count).map(question => ({ ...question, chapter: question.chapter ?? mission.chapter }));

// A part's mission is split evenly over its chapters. Replays of the same part rise from Explore to Reason to Stretch.
export function partMission(classId, partId, { runs = 0, seed = freshSeed() } = {}) {
  const part = classById(classId).parts.find(item => item.id === partId);
  if (!part) throw new RangeError(`Unknown part: ${partId}`);
  const level = Math.min(3, runs + 1);
  // A part that covers two chapters gets enough questions for both to count as completed.
  const size = Math.max(partSize(classId), PRE_PRIMARY.has(classId) ? 0 : 5 * part.chapters.length);
  const each = Math.ceil(size / part.chapters.length);
  const questions = part.chapters.flatMap((chapter, index) =>
    take(createMission({ grade: classId, chapter, level, mode: 'chapter', seed: `${seed}-${index}` }), each)).slice(0, size);
  return { kind: 'part', classId, partId, level, seed, title: part.label, questions };
}

export function trainMission(classId, chapterId, level, seed = freshSeed()) {
  const mission = createMission({ grade: classId, chapter: chapterId, level, mode: 'chapter', seed });
  return { kind: 'train', classId, level, seed, title: mission.title, questions: take(mission, partSize(classId)) };
}

// Mock test number `index` (0-based) mixes every chapter; later launches get harder papers.
export const mockLevel = (classId, index) => Math.min(PRE_PRIMARY.has(classId) ? 2 : 3, 1 + Math.floor(index / 2));

// A Print test: 10 questions, one from each chapter in turn, so the whole class's chapters are mixed.
export function printTestMission(classId, seed = freshSeed()) {
  const pool = paperMission(classId, 2, seed).questions;
  const lanes = new Map();
  for (const question of pool) (lanes.get(question.chapter) ?? lanes.set(question.chapter, []).get(question.chapter)).push(question);
  const questions = [];
  for (let round = 0; questions.length < PRINT_QUESTIONS && [...lanes.values()].some(lane => lane.length > round); round += 1) {
    for (const lane of lanes.values()) if (lane[round] && questions.length < PRINT_QUESTIONS) questions.push(lane[round]);
  }
  return { kind: 'printtest', classId, level: 2, seed, title: 'Print test', questions };
}

export function paperMission(classId, level = 2, seed = freshSeed()) {
  const size = paperSize(classId);
  if (PRE_PRIMARY.has(classId)) {
    const questions = [];
    for (let round = 0; questions.length < size; round += 1) {
      const mission = createMission({ grade: classId, level: Math.min(level, 2), mode: 'mixed', seed: `${seed}-${round}` });
      questions.push(...take(mission, mission.questions.length));
    }
    return { kind: 'paper', classId, level, seed, title: 'Mock test', questions: questions.slice(0, size) };
  }
  const mission = createMission({ grade: classId, level, mode: 'paper', seed });
  return { kind: 'paper', classId, level, seed, title: 'Mock test', questions: take(mission, size) };
}
