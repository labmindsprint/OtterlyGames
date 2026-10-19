import assert from 'node:assert/strict';
import test from 'node:test';
import { runBattery } from './space-academy-bank3-battery.mjs';
import { createBank, createMission, verifyQuestion } from '../js/space-academy/questions.mjs';
import * as grade from '../js/space-academy/bank3-class-3.mjs';
import { countPaths } from '../js/space-academy/bank3-class-3-world.mjs';

runBattery('class-3', grade);

test('right-and-up path counts skip blocked crossings', () => {
  assert.equal(countPaths(2, 2), 6);
  assert.equal(countPaths(3, 2), 10);
  assert.equal(countPaths(2, 1, [[1, 1]]), 1);
  assert.equal(countPaths(1, 1, [[0, 0]]), 0);
  assert.equal(countPaths(2, 2, [[1, 1]]), 2);
});

const bank = createBank({ 'class-3': grade });
const papers = [1, 2, 3].flatMap(level => Array.from({ length: 12 }, (_, index) => createMission({ grade: 'class-3', contentVersion: 3, mode: 'paper', level, seed: `real-${index}` }, bank)));
const questions = papers.flatMap(paper => paper.questions);
const template = question => `${question.family}|${question.prompt.replace(/\d+/g, '#')}`;

test('class 3 fractions are not one repeated template and cover numbers, shapes and sets', () => {
  const fractions = questions.filter(question => question.chapter === 'fractions');
  const counts = new Map();
  fractions.forEach(question => counts.set(template(question), (counts.get(template(question)) ?? 0) + 1));
  const families = new Set(fractions.map(question => question.family));
  assert.ok(families.size >= 12, `only ${families.size} fraction families`);
  assert.ok(counts.size >= 30, `only ${counts.size} fraction templates`);
  assert.ok(Math.max(...counts.values()) / fractions.length <= 0.15, 'one fraction template dominates');
  for (const family of ['class-3-frac-of-amount', 'class-3-frac-mixed', 'class-3-frac-cells', 'class-3-frac-sets', 'class-3-frac-equal']) assert.ok(families.has(family), `${family} never appears`);
});

test('class 3 papers use real-paper formats: four options and no repeated template over 3% of a paper set', () => {
  assert.ok(questions.every(question => question.options.length === 4));
  const counts = new Map();
  questions.forEach(question => counts.set(template(question), (counts.get(template(question)) ?? 0) + 1));
  assert.ok(Math.max(...counts.values()) / questions.length <= 0.03);
  assert.ok(new Set(questions.map(question => question.family)).size >= 90);
});

test('class 3 verifier rejects a wrong answer for new families', () => {
  const seen = new Set();
  for (const question of questions) {
    if (seen.has(question.family)) continue;
    seen.add(question.family);
    assert.ok(verifyQuestion(question, bank), `${question.family} should verify`);
    const wrongIndex = question.options.findIndex((_, index) => index !== question.correctIndex);
    const forged = { ...question, answer: question.options[wrongIndex], correctIndex: wrongIndex };
    let accepted;
    try { accepted = verifyQuestion(forged, bank); } catch { accepted = false; }
    assert.ok(!accepted, `${question.family} accepted a wrong answer`);
  }
});


test('class 3 gap families (figures, analogies, picture sums, division, cubes, calendar) appear and verify', () => {
  const wanted = ['embedded-letter', 'figure-analogy', 'picture-sum', 'long-division', 'figure-places', 'cube-stack', 'month-days'].map(name => `class-3-${name}`);
  const wide = [1, 2, 3].flatMap(level => Array.from({ length: 12 }, (_, index) => createMission({ grade: 'class-3', contentVersion: 3, mode: 'paper', level, seed: `gap-${index}` }, bank)).flatMap(paper => paper.questions));
  for (const family of wanted) {
    const own = wide.filter(question => question.family === family);
    assert.ok(own.length > 0, `${family} never appears`);
    assert.ok(own.every(question => question.visual && question.options.length === 4 && verifyQuestion(question, bank)), `${family} has an invalid question`);
  }
});
