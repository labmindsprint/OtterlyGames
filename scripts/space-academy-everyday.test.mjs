import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADES_V2 as GRADES } from '../js/space-academy/curriculum.mjs';
import { QuestionRetry, randomContext } from '../js/space-academy/bank-shared.mjs';
import { draftEveryday, EVERYDAY_FAMILIES, renderEveryday, solveEveryday } from '../js/space-academy/bank-everyday.mjs';

function generated(family, grade, level, seed) {
  const r = randomContext(seed);
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const candidate = draftEveryday(family, grade, level, r);
      return {
        ...candidate, family,
        options: candidate.choices.map(choice => choice.value),
        optionVisuals: candidate.choices.map(choice => choice.visual ?? null),
      };
    } catch (error) {
      if (!(error instanceof QuestionRetry)) throw error;
    }
  }
  throw new Error(`No viable ${grade.id}/${family}/${level} question for ${seed}.`);
}

test('every everyday family has grade-appropriate proved variants and original accessible diagrams', () => {
  const covered = new Set();
  let checked = 0;
  for (const grade of GRADES) {
    for (const chapter of grade.chapters) {
      chapter.families.forEach((families, levelIndex) => {
        for (const family of families.filter(family => EVERYDAY_FAMILIES.includes(family))) {
          for (let seed = 0; seed < 6; seed++) {
            const question = generated(family, grade, levelIndex + 1, `everyday-${grade.id}-${chapter.id}-${levelIndex}-${seed}`);
            assert.equal(solveEveryday(question), question.answer, `${grade.id}/${family}/${levelIndex + 1}`);
            if (family === 'measure-change') {
              assert.ok(question.visual.rows.every(row => ['mm', 'cm', 'm'].includes(row.unit)),
                'Strip and roll stories must use length units, not mass or capacity units.');
            }
            assert.equal(new Set(question.options).size, question.options.length);
            assert.equal(question.choices.filter(choice => choice.code === null).length, 1);
            for (const visual of [question.visual, ...question.optionVisuals].filter(Boolean)) {
              assert.match(renderEveryday(visual), /role="img" aria-label="/);
              assert.ok(visual.description.length > 5);
            }
            covered.add(family);
            checked++;
          }
        }
      });
    }
  }
  assert.deepEqual([...covered].sort(), [...EVERYDAY_FAMILIES].sort());
  assert.ok(checked > 600);
});

test('readings come from ruler, graduated scale and balanced-pan data, not a stored answer', () => {
  const ruler = { family: 'ruler-read', proof: {}, visual: { kind: 'v2-everyday-ruler', start: 3, end: 8, step: 5 } };
  assert.equal(solveEveryday(ruler), '25');
  ruler.visual.end = 9;
  assert.equal(solveEveryday(ruler), '30');
  assert.equal(solveEveryday({ family: 'instrument-read', proof: {}, visual: { kind: 'v2-everyday-container', min: 10, interval: 5, fillIndex: 3 } }), '25');
  assert.equal(solveEveryday({ family: 'balance-missing', proof: {}, visual: { kind: 'v2-everyday-balance', left: [24], right: [4], unknowns: 2 } }), '10');
  assert.equal(solveEveryday({ family: 'temperature', proof: { drop: 7, rise: 3 }, visual: { kind: 'v2-everyday-thermometer', min: 10, interval: 2, fillIndex: 6 } }), '18');
});

test('clock correction and reverse journeys account for all elapsed intervals', () => {
  const correction = { family: 'clock-error', proof: { initial: 5, rate: 3, period: 2, hours: 8, fast: true }, visual: { kind: 'v2-everyday-clock', minutes: 617 } };
  assert.equal(solveEveryday(correction), '10:00');
  correction.proof.fast = false;
  correction.visual.minutes = 523;
  assert.equal(solveEveryday(correction), '9:00');
  assert.equal(solveEveryday({ family: 'time-chain', proof: { first: 17, stop: 12, last: 28, backwards: true }, visual: { kind: 'v2-everyday-clock', minutes: 72 } }), '12:15');
});

test('calendar calculations use actual leap-month weekdays and precise endpoint rules', () => {
  const visual = { kind: 'v2-everyday-calendar', year: 2028, month: 1 };
  assert.equal(solveEveryday({ family: 'calendar', visual, proof: { query: 'weekday', date: 29, after: 0 } }), 'Tue');
  assert.equal(solveEveryday({ family: 'calendar', visual, proof: { query: 'occurrence', day: 4, occurrence: 3, offset: 5 } }), '22');
  assert.equal(solveEveryday({ family: 'calendar', visual, proof: { query: 'schooldays', from: 18, to: 29, holiday: 24 } }), '6');
});

test('graph changes apply keys and both sides of a transfer before comparing', () => {
  const visual = { kind: 'v2-everyday-chart', scale: 4, rows: [{ marks: 6 }, { marks: 3 }, { marks: 5 }] };
  assert.equal(solveEveryday({ family: 'chart-update', visual, proof: { a: 0, b: 1, transfer: 5, extra: 2 } }), '0');
  visual.scale = 3;
  visual.rows = [{ marks: 6 }, { marks: 2 }, { marks: 5 }, { marks: 4 }];
  const question = { family: 'graph-parts', visual, proof: { removed: 4, added: 2 } };
  assert.equal(solveEveryday(question), '9');
  visual.scale = 4;
  assert.equal(solveEveryday(question), '14');
});

test('a budget answer must satisfy every purchase condition and include the fee', () => {
  const counts = [[1, 3], [2, 2], [3, 1], [4, 0]];
  const question = {
    family: 'shopping-budget',
    visual: { kind: 'v2-everyday-shop', items: [{ price: 8 }, { price: 5 }] },
    proof: { totalItems: 4, budget: 30, fee: 3 },
    options: counts.map(counts => `bundle:${counts.join(':')}`),
    optionVisuals: counts.map(counts => ({ kind: 'v2-everyday-bundle', counts })),
  };
  assert.equal(solveEveryday(question), 'bundle:2:2');
  question.optionVisuals[1].counts = [3, 1];
  assert.throws(() => solveEveryday(question), /does not match/);
});
