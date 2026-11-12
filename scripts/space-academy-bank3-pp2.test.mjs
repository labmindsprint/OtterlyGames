import test from 'node:test';
import assert from 'node:assert/strict';
import { runBattery } from './space-academy-bank3-battery.mjs';
import * as grade from '../js/space-academy/bank3-pp2.mjs';
import { createMission } from '../js/space-academy/questions.mjs';

runBattery('pp2', grade);

// Families that used to repeat the same wording and numbers; each needs real variety at every level.
const VARIED = {
  shapes: ['pp2-sides-count', 'pp2-corner-choice', 'pp2-solid-choice'],
  measurement: ['pp2-cup-jug', 'pp2-unit-rod', 'pp2-balance-box', 'pp2-size-compare'],
  operations: ['pp2-join-gardens', 'pp2-cross-out', 'pp2-bar-missing', 'pp2-hop-count', 'pp2-match-rows'],
  numbers: ['pp2-ten-frame', 'pp2-bundle-pods', 'pp2-before-after'],
  patterns: ['pp2-growing-tiles', 'pp2-broken-chain'],
};

test('[pp2] repeated families keep many distinct wordings and few exact repeats', () => {
  const prompts = new Map();
  const exact = new Map();
  for (const [chapter, families] of Object.entries(VARIED)) {
    for (const level of [1, 2, 3]) {
      for (let seed = 0; seed < 40; seed += 1) {
        const mission = createMission({ grade: 'pp2', chapter, level, mode: 'chapter', seed: `variety-${seed}` });
        for (const question of mission.questions.filter(item => families.includes(item.family))) {
          const key = `${question.family}:${level}`;
          (prompts.get(key) ?? prompts.set(key, new Set()).get(key)).add(question.prompt.replace(/\d+/g, '#'));
          const entry = exact.get(key) ?? { total: 0, seen: new Set() };
          entry.total += 1;
          entry.seen.add(JSON.stringify([question.prompt, question.visual ?? null, question.answer, [...question.options].sort()]));
          exact.set(key, entry);
        }
      }
    }
  }
  for (const [key, set] of prompts) assert.ok(set.size >= 5, `${key} has only ${set.size} distinct wordings.`);
  for (const [key, entry] of exact) {
    const repeat = 1 - entry.seen.size / entry.total;
    assert.ok(repeat < 0.3, `${key} repeats ${Math.round(repeat * 100)} percent of its questions exactly.`);
  }
});
