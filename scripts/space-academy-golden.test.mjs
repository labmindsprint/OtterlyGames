import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getGrade } from '../js/space-academy/curriculum.mjs';
import { createMission } from '../js/space-academy/questions.mjs';
import { diagram } from '../js/space-academy/art.mjs';

// Saved missions are regenerated from their seed and compared as JSON, so bank versions 1 and 2 must never drift.
// Run with SPACE_ACADEMY_GOLDEN=write only when a frozen bank is deliberately changed.
const FIXTURE = fileURLToPath(new URL('./space-academy-golden-hashes.json', import.meta.url));
const GRADES = ['pp1', 'pp2', 'class-1', 'class-2', 'class-3', 'class-4', 'class-5'];
const SEEDS = ['gold-a', 'gold-b', 'gold-c'];
const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 16);

function artwork(mission) {
  const parts = [];
  for (const question of mission.questions) {
    parts.push(question.visual ? diagram(question.visual) : '');
    for (const option of question.optionVisuals ?? []) parts.push(option ? diagram(option) : '');
  }
  return digest(parts.join('\n'));
}

function snapshot() {
  const result = {};
  for (const version of [1, 2]) {
    for (const gradeId of GRADES) {
      const grade = getGrade(gradeId, version);
      const requests = [];
      for (const level of [1, 2, 3]) {
        for (const seed of SEEDS) {
          for (const chapter of grade.chapters) requests.push({ grade: gradeId, chapter: chapter.id, level, mode: 'chapter', seed });
          requests.push({ grade: gradeId, level, mode: 'mixed', seed });
          if (grade.year >= 1) requests.push({ grade: gradeId, level, mode: 'paper', seed });
        }
      }
      for (const request of requests) {
        const key = `v${version}|${gradeId}|${request.mode}|${request.chapter ?? '-'}|${request.level}|${request.seed}`;
        try {
          const mission = createMission({ ...request, contentVersion: version });
          result[key] = { mission: digest(JSON.stringify(mission)), art: artwork(mission) };
        } catch (error) {
          result[key] = { error: String(error.message).slice(0, 120) };
        }
      }
    }
  }
  return result;
}

test('question banks 1 and 2 stay byte-identical for every grade, mode, level and seed', { timeout: 600000 }, () => {
  const actual = snapshot();
  if (process.env.SPACE_ACADEMY_GOLDEN === 'write') {
    writeFileSync(FIXTURE, `${JSON.stringify(actual, null, 1)}\n`);
    return;
  }
  assert.ok(existsSync(FIXTURE), 'The golden snapshot is missing. Create it from the last verified bank.');
  const expected = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), 'The set of snapshot missions changed.');
  const changed = Object.keys(expected).filter(key => JSON.stringify(actual[key]) !== JSON.stringify(expected[key]));
  assert.deepEqual(changed.slice(0, 8), [], `${changed.length} frozen missions changed`);
});
