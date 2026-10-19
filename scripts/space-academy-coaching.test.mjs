import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createMission, verifyQuestion } from '../js/space-academy/questions.mjs';
import { MISCONCEPTIONS } from '../js/space-academy/bank-shared.mjs';
import { applyAction, currentJourney, newSave, validateSave } from '../js/space-academy/progress.mjs';
import { coachingHint, coachingFeedback, coachingFocus } from '../js/space-academy/coaching.mjs';

// These tests assert specific bank 2 questions, so they pin that bank explicitly.
const observed = { grade: 'class-1', chapter: 'numbers', level: 1, seed: 'coaching-observed-78', contentVersion: 2 };
const smallest = { grade: 'class-2', chapter: 'numbers', level: 1, seed: 'coaching-smallest-2', contentVersion: 2 };
const constrained = { grade: 'class-3', chapter: 'numbers', level: 3, seed: 'coaching-constrained-0', contentVersion: 2 };
const abacus = { grade: 'class-1', chapter: 'numbers', level: 2, seed: 'coaching-abacus-0', contentVersion: 2 };
const clues = { grade: 'class-1', chapter: 'numbers', level: 3, seed: 'coaching-digit-clues-0', contentVersion: 2 };
const ruler = { grade: 'class-1', chapter: 'measurement', level: 1, seed: 'coaching-other-0', contentVersion: 2 };
const sample = (request, id) => {
  const question = createMission(request).questions.find(question => question.id === id);
  assert.ok(question, `The real generator must still produce ${id}.`);
  return question;
};
const choice = (question, value) => {
  const index = question.options.indexOf(value);
  assert.ok(index >= 0, `Expected the real choice ${value}.`);
  return index;
};

test('the observed 5 and 0 digit cards receive card-specific coaching, not bead or nonexistent parity advice', () => {
  const question = sample(observed, 'q2-class-1-expand-delg6n');
  assert.deepEqual(question.visual.digits, [5, 0]);
  assert.equal(question.visual.order, 'greatest');
  assert.equal(question.visual.parity, null);
  assert.equal(question.visual.limit, null);
  const index = choice(question, '5');
  assert.equal(question.feedback[index].code, 'place-shift');
  assert.equal(question.feedback[index].message, MISCONCEPTIONS['place-shift'].message);
  assert.match(question.hint, /last-digit condition/);
  const hint = coachingHint(question);
  assert.match(hint, /every digit card exactly once/);
  assert.match(hint, /first digit cannot be zero/);
  assert.match(hint, /larger digits first.*greatest number/);
  assert.doesNotMatch(hint, /last-digit|even|odd|bound|bead|rod/);
  const feedback = coachingFeedback(question, index);
  assert.match(feedback, /zero card still needs a place/);
  assert.match(feedback, /every card exactly once/);
  assert.doesNotMatch(feedback, /bead|rod|last-digit/);
  assert.match(coachingFeedback(question, choice(question, '0')), /all 2 digit cards exactly once/);
  assert.match(coachingFeedback(question, choice(question, '55')), /every card exactly once/);
  assert.equal(coachingFeedback(question, question.correctIndex), null);
});

test('number-building help follows the actual order, parity and strict size conditions in the visual schema', () => {
  const question = sample(smallest, 'q2-class-2-expand-1k0o8dy');
  assert.match(coachingHint(question), /smallest nonzero digit.*remaining digits in increasing order/);
  assert.doesNotMatch(coachingHint(question), /ones place|last-digit|even|odd/);
  assert.match(coachingFeedback(question, choice(question, '602')), /left to right.*smallest number/);
  const cards = createMission(constrained).questions.filter(question => question.family === 'number-build');
  assert.deepEqual(new Set(cards.map(question => question.visual.parity)), new Set(['even', 'odd']));
  assert.deepEqual(new Set(cards.map(question => question.visual.limit.direction)), new Set(['greater', 'less']));
  for (const card of cards) {
    const { parity, limit, order } = card.visual;
    const hint = coachingHint(card);
    assert.ok(hint.includes(`Reserve an ${parity} digit for the ones place.`));
    assert.ok(hint.includes(`${limit.direction} than ${limit.value.toLocaleString('en-IN')}`));
    assert.ok(hint.includes(`choose the ${order} number`));
  }
  const even = cards[0];
  assert.match(coachingFeedback(even, choice(even, '4625')), /must be even.*ones place/);
  assert.match(coachingFeedback(even, choice(even, '6542')), /must be less than 5,264/);
  assert.match(coachingFeedback(even, choice(even, '2456')), /greatest number that meets all the conditions/);
  const odd = cards.find(card => card.visual.parity === 'odd');
  assert.match(coachingFeedback(odd, choice(odd, '1940')), /must be odd.*ones place/);
});

test('real bead-transfer and unrelated feedback remain intact, while the shared bead message is omitted for digit clues', () => {
  const transfer = sample(abacus, 'q2-class-1-place-sd774x');
  assert.equal(coachingHint(transfer), transfer.hint);
  for (let index = 0; index < transfer.options.length; index++) {
    assert.equal(coachingFeedback(transfer, index), transfer.feedback[index]?.message ?? null);
  }
  const measure = sample(ruler, 'q2-class-1-measure-16241tm');
  const scaleZero = measure.feedback.findIndex(feedback => feedback?.code === 'scale-zero');
  assert.ok(scaleZero >= 0);
  assert.equal(coachingHint(measure), measure.hint);
  assert.equal(coachingFeedback(measure, scaleZero), MISCONCEPTIONS['scale-zero'].message);
  const digitClues = sample(clues, 'q2-class-1-place-165cjci');
  const index = digitClues.feedback.findIndex(feedback => feedback?.code === 'place-shift');
  assert.ok(index >= 0);
  const before = structuredClone(digitClues);
  assert.equal(coachingFeedback(digitClues, index), null);
  assert.equal(coachingHint(digitClues), digitClues.hint);
  assert.deepEqual(digitClues, before, 'The correct original workings must remain available as the fallback.');
});

test('unsupported context and non-answer indices cannot leak the shared bead diagnostic', () => {
  const question = sample(observed, 'q2-class-1-expand-delg6n');
  for (const index of [-1, question.options.length, 0.5, '2', null]) {
    assert.equal(coachingFeedback(question, index), null);
  }
  const unsupported = structuredClone(question);
  unsupported.visual.kind = 'v2-number-unknown';
  assert.equal(coachingFeedback(unsupported, choice(unsupported, '5')), null);
  assert.doesNotMatch(coachingHint(unsupported), /bead|rod|last-digit/);
  const legacy = createMission({ ...observed, contentVersion: 1 }).questions[0];
  assert.equal(coachingHint(legacy), legacy.hint);
  assert.equal(coachingFeedback(legacy, (legacy.correctIndex + 1) % legacy.options.length), null);
});

test('practice-focus display is representation-neutral without changing the recorded code, count or other focuses', () => {
  const focus = Object.freeze({ code: 'place-shift', count: 4, ...MISCONCEPTIONS['place-shift'] });
  const display = coachingFocus(focus);
  assert.equal(display.code, focus.code);
  assert.equal(display.count, focus.count);
  assert.match(display.title, /place value/);
  assert.match(display.message, /place occupied by each digit/);
  assert.doesNotMatch(display.message, /bead|rod/);
  assert.equal(focus.message, MISCONCEPTIONS['place-shift'].message);
  const other = { code: 'scale-zero', count: 3, ...MISCONCEPTIONS['scale-zero'] };
  assert.strictEqual(coachingFocus(other), other);
  assert.equal(coachingFocus(null), null);
});

test('display coaching preserves frozen v2 mission snapshots, strict save validation, accuracy and misconception codes', () => {
  const mission = createMission(observed);
  const snapshot = structuredClone(mission);
  // Captured from the unchanged generator before adding the display helper.
  assert.equal(createHash('sha256').update(JSON.stringify(mission)).digest('hex'),
    'f42e4f454a5c10d064305595cca2106201f49e9fc2a89e0021ee9238d0e245f3');
  for (const request of [observed, smallest, constrained, abacus, clues, ruler]) {
    const set = createMission(request);
    const before = structuredClone(set);
    for (const question of set.questions) {
      coachingHint(question);
      question.options.forEach((_, index) => coachingFeedback(question, index));
      assert.equal(verifyQuestion(question), true);
    }
    assert.deepEqual(set, before);
    assert.deepEqual(createMission(request), set);
  }
  let save = applyAction(newSave(), { type: 'start', mission });
  const questionIndex = mission.questions.findIndex(question => question.id === 'q2-class-1-expand-delg6n');
  for (let index = 0; index <= questionIndex; index++) {
    const question = mission.questions[index];
    const selected = index === questionIndex ? choice(question, '5') : question.correctIndex;
    coachingHint(question);
    coachingFeedback(question, selected);
    save = applyAction(save, { type: 'answer', missionId: mission.id, choice: selected });
    if (index < questionIndex) save = applyAction(save, { type: 'next', missionId: mission.id });
  }
  const journey = currentJourney(validateSave(JSON.parse(JSON.stringify(save))));
  assert.deepEqual(journey.active.mission, snapshot);
  const attempt = journey.attempts.find(attempt => attempt.id === mission.questions[questionIndex].id);
  assert.equal(attempt.correct, false);
  assert.equal(attempt.hinted, false);
  assert.equal(attempt.misconception, 'place-shift');
  assert.deepEqual(mission, snapshot);
});
