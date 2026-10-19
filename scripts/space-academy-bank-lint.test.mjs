import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOW, formatReport, runLint } from './space-academy-bank-lint.mjs';

const GRADES = ['pp1', 'pp2', 'class-1', 'class-2', 'class-3', 'class-4', 'class-5'];

test('lint allow-list entries are justified and stay tiny', () => {
  assert.ok(ALLOW.length <= 8, 'the allow-list must stay tiny; fix the question instead');
  for (const entry of ALLOW) {
    assert.ok(entry.family && entry.rule, 'an allow-list entry needs a family and a rule');
    assert.ok(typeof entry.why === 'string' && entry.why.length >= 20, `${entry.family}: say why this exception is needed`);
  }
});

// One subtest per grade, so a failing grade names itself. Grades being fixed by other people may fail here until their
// banks are clean: run `node scripts/space-academy-bank-lint.mjs --grade <id>` for the full table.
for (const grade of GRADES) {
  test(`bank lint: ${grade} wording, variety, options and age caps`, () => {
    const { violations } = runLint({ grades: [grade] });
    assert.equal(violations.length, 0, `\n${formatReport(violations, { all: false, limit: 12 })}\n\nRe-run: node scripts/space-academy-bank-lint.mjs --grade ${grade}`);
  });
}
