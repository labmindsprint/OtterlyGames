#!/usr/bin/env node
// Read-only production-bank audit. The optional report is the only file written.
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_VERSION, FAMILIES, GRADES, LEVELS } from '../js/space-academy/curriculum.mjs';
import { createMission } from '../js/space-academy/questions.mjs';

const args = process.argv.slice(2);
const allowed = new Set(['--seeds', '--output', '--grade']);
const settings = { seeds: 200 };
for (let index = 0; index < args.length; index += 2) {
  const flag = args[index];
  if (!allowed.has(flag) || !args[index + 1] || args[index + 1].startsWith('--')) {
    throw new Error('Usage: node scripts\\audit-academy-questions.mjs [--seeds 200] [--grade class-1] [--output report.json]');
  }
  settings[flag.slice(2)] = flag === '--seeds' ? Number(args[index + 1]) : args[index + 1];
}
if (!Number.isInteger(settings.seeds) || settings.seeds < 1 || settings.seeds > 10000) {
  throw new RangeError('--seeds must be an integer from 1 to 10000.');
}
if (settings.grade && !GRADES.some(grade => grade.id === settings.grade)) throw new RangeError('Unknown grade.');

const rounded = value => Math.round(value * 10000) / 10000;
const numberNormalised = value => String(value).toLowerCase()
  .replace(/[-+]?\d+(?:[.,:/]\d+)*/g, '#').replace(/\s+/g, ' ').trim();
const stable = value => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
};
const serialise = value => JSON.stringify(stable(value));
const digest = value => createHash('sha256').update(value).digest('hex');
const increment = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const schema = value => {
  if (Array.isArray(value)) return value.map(schema);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort()
      .filter(key => !['description', 'code', 'tag', 'name'].includes(key))
      .map(key => [key, schema(value[key])]));
  }
  if (typeof value === 'number') return '#';
  if (typeof value === 'boolean') return '?';
  return typeof value === 'string' ? numberNormalised(value) : value;
};
const start = Date.now();
const sourceDirectory = fileURLToPath(new URL('../js/space-academy/', import.meta.url));
const sourceHashes = {};
for (const name of (await readdir(sourceDirectory)).filter(name => name.endsWith('.mjs')).sort()) {
  sourceHashes[name] = digest(await readFile(resolve(sourceDirectory, name)));
}
const rows = [];
for (const grade of GRADES.filter(item => !settings.grade || item.id === settings.grade)) {
  for (const chapter of grade.chapters) {
    for (const level of LEVELS) {
      const prompts = new Map(), nearPrompts = new Map(), exact = new Set(), structures = new Set();
      const familyCounts = new Map(), positions = new Map(), visualKinds = new Map(), errors = [];
      let total = 0, withinMissionNearRepeats = 0, successfulMissions = 0;
      let maxPromptIntegerDigits = 0, questionsWithEightDigitPromptIntegers = 0;
      for (let seed = 0; seed < settings.seeds; seed += 1) {
        let mission;
        try {
          mission = createMission({
            grade: grade.id, chapter: chapter.id, level: level.id,
            mode: 'chapter', seed: `audit-${seed}`,
          });
        } catch (error) {
          errors.push({ seed: `audit-${seed}`, message: error.message });
          continue;
        }
        successfulMissions += 1;
        const within = new Set();
        for (const question of mission.questions) {
          total += 1;
          const digitLengths = (question.prompt.match(/\b\d[\d,]*\b/g) ?? [])
            .map(token => token.replaceAll(',', '').length);
          maxPromptIntegerDigits = Math.max(maxPromptIntegerDigits, ...digitLengths);
          if (digitLengths.some(length => length >= 8)) questionsWithEightDigitPromptIntegers += 1;
          increment(prompts, question.prompt);
          const near = numberNormalised(question.prompt);
          increment(nearPrompts, near);
          if (within.has(near)) withinMissionNearRepeats += 1;
          within.add(near);
          exact.add(digest(serialise({
            family: question.family, prompt: question.prompt, visual: question.visual ?? null,
            answer: question.answer,
            choices: question.options.map((text, index) => ({
              text, visual: question.optionVisuals?.[index] ?? null,
            })).sort((a, b) => serialise(a).localeCompare(serialise(b))),
          })));
          structures.add(serialise({
            family: question.family, prompt: near, visual: schema(question.visual ?? null),
            optionVisuals: question.optionVisuals
              ? question.optionVisuals.map(schema).map(serialise).sort() : null,
          }));
          increment(familyCounts, question.family);
          increment(visualKinds, question.visual?.kind ?? 'text-only');
          const optionCount = question.options.length;
          if (!positions.has(optionCount)) positions.set(optionCount, Array(optionCount).fill(0));
          positions.get(optionCount)[question.correctIndex] += 1;
        }
      }
      const answerPositions = [...positions].map(([optionCount, counts]) => {
        const n = counts.reduce((sum, count) => sum + count, 0), expected = n / optionCount;
        return {
          optionCount, counts, expectedPerPosition: expected,
          maxAbsoluteDeviation: rounded(Math.max(...counts.map(count => Math.abs(count / n - 1 / optionCount)))),
          chiSquare: rounded(counts.reduce((sum, count) => sum + (count - expected) ** 2 / expected, 0)),
          biasFlag: n >= 100 && Math.max(...counts.map(count => Math.abs(count / n - 1 / optionCount))) > 0.08,
        };
      });
      const plannedFamilies = chapter.families[level.id - 1];
      const missingFamilies = plannedFamilies.filter(family => !familyCounts.has(family));
      const repeatRate = total ? 1 - exact.size / total : 0;
      const dominantNormalisedPromptShare = total ? Math.max(...nearPrompts.values()) / total : 0;
      const flags = [];
      if (errors.length) flags.push('generation-errors');
      if (familyCounts.size < 4) flags.push('fewer-than-four-families');
      if (repeatRate > 0.5) flags.push('exact-repeat-over-half');
      if (structures.size < 6) flags.push('fewer-than-six-structures');
      if (dominantNormalisedPromptShare > 0.45) flags.push('dominant-normalised-prompt');
      if (missingFamilies.length) flags.push('unobserved-planned-family');
      if (answerPositions.some(item => item.biasFlag)) flags.push('answer-position-bias');
      rows.push({
        grade: grade.id, chapter: chapter.id, level: level.id, seeds: settings.seeds,
        successfulMissions, totalQuestions: total, errors,
        uniqueQuestions: exact.size, uniquePrompts: prompts.size, uniqueNumberNormalisedPrompts: nearPrompts.size,
        uniqueVisualAwareStructures: structures.size, exactRepeatRate: rounded(repeatRate),
        maxPromptIntegerDigits, questionsWithEightDigitPromptIntegers,
        promptRepeatRate: rounded(total ? 1 - prompts.size / total : 0),
        numberNormalisedNearDuplicateRate: rounded(total ? 1 - nearPrompts.size / total : 0),
        withinMissionNearDuplicateRate: rounded(total ? withinMissionNearRepeats / total : 0),
        dominantNormalisedPromptShare: rounded(dominantNormalisedPromptShare),
        familyCount: familyCounts.size, plannedFamilyCount: plannedFamilies.length,
        families: Object.fromEntries([...familyCounts].sort()), missingFamilies,
        visualKinds: Object.fromEntries([...visualKinds].sort()), answerPositions, flags,
        priorityScore: rounded(errors.length * 100 + missingFamilies.length * 20 +
          Math.max(0, 4 - familyCounts.size) * 10 + repeatRate * 20 +
          dominantNormalisedPromptShare * 10 + (structures.size < 6 ? 10 : 0)),
      });
    }
  }
  console.error(`Audited ${grade.id}: ${grade.chapters.length} chapters × ${LEVELS.length} levels × ${settings.seeds} seeds.`);
}
const paperProbes = [];
for (const grade of GRADES.filter(item => item.year > 0 && (!settings.grade || item.id === settings.grade))) {
  const sections = new Map(), sourceGrades = new Set(), errors = [];
  let reasoningChapterAchieversQuestions = 0, achieversQuestions = 0;
  const seeds = Math.min(20, settings.seeds);
  for (let seed = 0; seed < seeds; seed += 1) {
    try {
      const mission = createMission({ grade: grade.id, mode: 'paper', level: 2, seed: `audit-paper-${seed}` });
      for (const question of mission.questions) {
        increment(sections, question.section);
        sourceGrades.add(question.grade);
        if (question.section !== 'stretch') continue;
        achieversQuestions += 1;
        if (grade.chapters.find(chapter => chapter.id === question.chapter)?.section === 'reasoning') {
          reasoningChapterAchieversQuestions += 1;
        }
      }
    } catch (error) {
      errors.push({ seed: `audit-paper-${seed}`, message: error.message });
    }
  }
  paperProbes.push({
    grade: grade.id, level: 2, seeds, sections: Object.fromEntries(sections),
    sourceGrades: [...sourceGrades], achieversQuestions, reasoningChapterAchieversQuestions, errors,
    caveat: 'Source-grade IDs do not measure curricular current/previous-class topic overlap.',
  });
}
const ranking = [...rows].sort((a, b) => b.priorityScore - a.priorityScore);
const report = {
  generatedAt: new Date().toISOString(), contentVersion: CONTENT_VERSION, settings,
  methodology: {
    unit: 'One complete production chapter mission per seed; same createMission API used by worksheet-academy.mjs.',
    exact: 'Prompt + family + diagram + answer + order-independent text/picture choices; not IDs or option shuffle.',
    near: 'Prompt only, case/whitespace folded and numeric literals replaced by #. High values are expected for visual tasks; not a correctness verdict.',
    structure: 'Family + number-normalised prompt + recursive diagram/option schema; numeric values and incidental name/tag/code/description fields removed.',
    bias: 'Counts grouped by number of choices. Flag when n >= 100 and any position differs from uniform by more than 8 percentage points. Chi-square descriptive only.',
    range: 'Longest numeral token in prompt after removing grouping commas; a finite sample does not establish a generator maximum. Inspect source bounds as well.',
    paperProbe: 'Up to 20 Level-2 paper seeds per formal grade; count section slots and Achievers drawn from reasoning-labelled chapters.',
    limits: 'Finite deterministic sample, no semantic equivalence oracle, no pedagogical correctness or rendered-image legibility review. Production verification checks solver consistency, not independent mathematical truth.',
  },
  sourceHashes, catalogHash: digest(serialise(GRADES)),
  summary: {
    gradeCount: new Set(rows.map(row => row.grade)).size,
    chapterCount: rows.length / LEVELS.length, chapterLevelCount: rows.length,
    seedsPerChapterLevel: settings.seeds,
    missionCount: rows.reduce((sum, row) => sum + row.successfulMissions, 0),
    questionCount: rows.reduce((sum, row) => sum + row.totalQuestions, 0),
    generationErrorCount: rows.reduce((sum, row) => sum + row.errors.length, 0),
    paperGenerationErrorCount: paperProbes.reduce((sum, row) => sum + row.errors.length, 0),
    flaggedChapterLevels: rows.filter(row => row.flags.length).length,
    answerBiasFlags: rows.filter(row => row.flags.includes('answer-position-bias')).length,
    elapsedSeconds: rounded((Date.now() - start) / 1000),
  },
  familyCatalog: FAMILIES, rows, paperProbes,
  ranking: ranking.map(({ grade, chapter, level, priorityScore, flags }) => ({ grade, chapter, level, priorityScore, flags })),
};
if (settings.output) {
  const output = resolve(settings.output);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify({ summary: report.summary, topTen: report.ranking.slice(0, 10) }, null, 2));
if (report.summary.generationErrorCount || report.summary.paperGenerationErrorCount) process.exitCode = 1;
