import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADES_V2 as GRADES } from '../js/space-academy/curriculum.mjs';
import { MISCONCEPTIONS, QuestionRetry, choiceCount, randomContext } from '../js/space-academy/bank-shared.mjs';
import { NUMBER_FAMILIES, draftNumbers, solveNumbers, renderNumbers } from '../js/space-academy/bank-numbers.mjs';

function generated(family, grade, level, seed) {
  const r = randomContext(seed);
  for (let attempt = 0; attempt < 100; attempt++) {
    try { return draftNumbers(family, grade, level, r); }
    catch (error) { if (!(error instanceof QuestionRetry)) throw error; }
  }
  throw new Error(`No distinct misconception choices for ${grade.id}/${level}/${family}/${seed}`);
}
function finalForm(draft, family, seed) {
  const { choices, ...base } = structuredClone(draft);
  const options = randomContext(seed).shuffle(choices);
  return {
    ...base, family,
    options: options.map(option => option.value),
    optionVisuals: options.map(option => option.visual ?? null),
  };
}
function hasAnswerField(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, entry]) => /^(answer|expected|correct|correctIndex)$/i.test(key) || hasAnswerField(entry));
}
function checkDrawing(visual) {
  assert.match(visual.kind, /^v2-number-/);
  assert.ok(visual.description.length > 15);
  const drawing = renderNumbers(visual);
  assert.match(drawing, /<svg[^>]+role="img"[^>]+aria-label=/);
  assert.ok((drawing.match(/<(?:rect|circle|line|path|text)\b/g) ?? []).length > 3);
  assert.doesNotMatch(drawing, /NaN|undefined|\[object Object\]/);
  assert.match(drawing, /viewBox="0 0 480 \d+"/);
}
const parts = (numerator, denominator) => [Array.from({ length: denominator }, (_, index) => index < numerator ? 1 : 0)];
const hundredths = count => Array.from({ length: 10 }, (_, row) =>
  Array.from({ length: 10 }, (_, column) => row * 10 + column < count ? 1 : 0));
function given(family, type, givens, proof = {}) {
  return {
    family, answer: 'This deliberately wrong stored answer must not be read by the solver.',
    visual: { kind: `v2-number-${type}`, description: 'An independently specified original diagram containing the numerical givens.', ...structuredClone(givens) },
    proof: { family, diagram: structuredClone(givens), ...proof },
  };
}
function resnapshot(question) {
  const { kind, description, ...facts } = question.visual;
  question.proof.diagram = structuredClone(facts);
  return question;
}
const grade = year => GRADES.find(item => item.year === year);

test('every numeric blueprint family works at each actual grade/level with several seeded givens', () => {
  const plans = new Map();
  for (const grade of GRADES) {
    for (const chapter of grade.chapters) {
      chapter.families.forEach((families, index) => {
        for (const family of families.filter(item => NUMBER_FAMILIES.includes(item))) {
          plans.set(`${grade.id}/${index + 1}/${family}`, { grade, family, level: index + 1 });
        }
      });
    }
  }
  assert.deepEqual([...new Set([...plans.values()].map(plan => plan.family))].sort(), [...NUMBER_FAMILIES].sort());
  for (const [key, plan] of plans) {
    const distinctGivens = new Set();
    for (let seed = 0; seed < 6; seed++) {
      const draft = generated(plan.family, plan.grade, plan.level, `numbers-${key}-${seed}`);
      assert.ok(draft.prompt.length > 20, key);
      assert.ok(draft.explanation.length > 35, key);
      assert.ok(draft.hint.length > 10, key);
      assert.equal(draft.choices.length, choiceCount(plan.grade), key);
      assert.equal(new Set(draft.choices.map(option => option.value)).size, draft.choices.length, key);
      assert.equal(draft.choices.filter(option => option.code === null).length, 1, key);
      assert.equal(draft.choices.find(option => option.code === null).value, draft.answer, key);
      draft.choices.filter(option => option.code !== null).forEach(option => assert.ok(MISCONCEPTIONS[option.code], key));
      assert.equal(hasAnswerField(draft.proof), false, key);
      assert.equal(solveNumbers(draft), draft.answer, key);
      assert.equal(solveNumbers(finalForm(draft, plan.family, `shuffle-${seed}`)), draft.answer, key);
      const drawings = [draft.visual, ...draft.choices.map(option => option.visual)].filter(Boolean);
      assert.ok(drawings.length > 0, key);
      drawings.forEach(checkDrawing);
      const graphicalKeys = draft.choices.filter(option => option.visual).map(option => {
        const { description, ...model } = option.visual;
        return JSON.stringify(model);
      });
      assert.equal(new Set(graphicalKeys).size, graphicalKeys.length, key);
      distinctGivens.add(JSON.stringify(draft.proof));
    }
    assert.ok(distinctGivens.size >= 3, `The givens did not vary for ${key}`);
  }
});

test('abacus transfers change both rods; the subsequent exchange happens only after addition', () => {
  const transfer = given('abacus-change', 'abacus', {
    rods: [{ place: 100, beads: 4 }, { place: 10, beads: 0 }, { place: 1, beads: 7 }], label: 'Before',
  }, { from: 100, to: 10, swap: null });
  assert.equal(solveNumbers(transfer), '317');
  const combine = given('abacus-combine', 'abacus-pair', {
    panels: [
      { label: 'A', rods: [{ place: 10, beads: 2 }, { place: 1, beads: 8 }] },
      { label: 'B', rods: [{ place: 10, beads: 1 }, { place: 1, beads: 7 }] },
    ],
  }, { swap: [10, 1] });
  assert.equal(solveNumbers(combine), '54'); // 28 + 17 = 45, then exchange.
  const impossible = structuredClone(transfer);
  impossible.proof.from = 10;
  impossible.proof.to = 1;
  assert.throws(() => solveNumbers(impossible), /transfer is not possible/);
});

test('reverse fraction shading, a fixed second use and a fraction of the remainder have known answers', () => {
  assert.equal(solveNumbers(given('fraction-change', 'fraction', { cells: parts(6, 10), label: 'After' }, { action: 'shade', amount: 2 })), '4/10 shaded');
  assert.equal(solveNumbers(given('fraction-change', 'fraction', { cells: parts(4, 10), label: 'After' }, { action: 'erase', amount: 3 })), '7/10 shaded');
  assert.equal(solveNumbers(given('fraction-group', 'fraction', { cells: parts(3, 8), label: 'Given away' }, { mode: 'reverse', remaining: 20 })), '32');
  assert.equal(solveNumbers(given('fraction-left', 'fraction', { cells: parts(1, 4), label: 'Used first' }, { mode: 'reverse-fixed', extraUsed: 9, remaining: 27 })), '48');
  const stages = [
    { label: 'First: original', cells: parts(1, 4) },
    { label: 'Next: remainder', cells: parts(1, 3) },
  ];
  assert.equal(solveNumbers(given('fraction-left', 'fraction-chain', { stages }, { mode: 'forward', total: 48 })), '24');
  assert.equal(solveNumbers(given('fraction-left', 'fraction-chain', { stages }, { mode: 'reverse', remaining: 24 })), '48');
});

test('full groups, leftovers and enough containers are different remainder rules after repacking', () => {
  const model = { groups: 4, groupSize: 6, leftover: 3 }; // 27 initially; 22 after removing five. Counters are repacked into bags of 4, not the pictured crate size.
  for (const [ask, answer] of [['full', '5'], ['leftover', '2'], ['containers', '6']]) {
    assert.equal(solveNumbers(given('sharing-remainder', 'sharing', model, { change: -5, ask, bag: 4 })), answer);
  }
  assert.equal(solveNumbers(given('sharing-remainder', 'sharing', model, { change: 0, ask: 'containers', bag: 4 })), '7');
  assert.throws(() => solveNumbers(given('sharing-remainder', 'sharing', model, { change: 0, ask: 'full', bag: 6 })), /different group size/);
});

test('decimal statements independently evaluate both claims in integer hundredths', () => {
  for (const [unit, statedCents, answer] of [
    ['hundredths', 46, 'Both statements are true'],
    ['hundredths', 37, 'Only statement 1 is true'],
    ['tenths', 46, 'Only statement 2 is true'],
    ['tenths', 37, 'Neither statement is true'],
  ]) {
    const question = given('decimal-statements', 'decimal-statements', {
      cells: hundredths(29), firstClaim: { count: 29, unit },
      secondClaim: { addendCents: 17, statedCents },
    });
    assert.equal(solveNumbers(question), answer);
  }
  assert.equal(solveNumbers(given('decimal-statements', 'decimal-statements', {
    cells: hundredths(30), firstClaim: { count: 3, unit: 'tenths' },
    secondClaim: { addendCents: 20, statedCents: 50 },
  })), 'Both statements are true');
  assert.equal(solveNumbers(given('decimal-context', 'decimal-story', {
    mode: 'reverse', tubeCount: 4, tubeCents: 35, addedCents: 65, finalCents: 210,
  })), '2.85');
});

test('HCF packs and LCM meeting times select different operations and apply the final question', () => {
  assert.equal(solveNumbers(given('factor-compare', 'factor-pair', { a: 24, b: 36, task: 'hcf' })), '12');
  assert.equal(solveNumbers(given('factor-compare', 'factor-pair', { a: 24, b: 36, task: 'lcm' })), '72');
  const supplies = { context: 'packs', red: 27, blue: 41, reserveRed: 3, reserveBlue: 5 };
  assert.equal(solveNumbers(given('factor-application', 'factor-story', { ...supplies, task: 'pack-count' })), '12');
  assert.equal(solveNumbers(given('factor-application', 'factor-story', { ...supplies, task: 'items-per-pack' })), '5');
  assert.equal(solveNumbers(given('factor-application', 'factor-story', { context: 'beacons', a: 6, b: 8, window: null })), '24');
  assert.equal(solveNumbers(given('factor-application', 'factor-story', { context: 'beacons', a: 6, b: 8, window: 72 })), '3');
  assert.equal(solveNumbers(given('factor-application', 'factor-story', { context: 'beacons', a: 6, b: 8, window: 71 })), '2');
});

test('constrained digit clues, leading zeroes, linked symbol relations and missing carries are solved from givens', () => {
  assert.equal(solveNumbers(given('number-clues', 'digit-clues', {
    width: 3, prefix: '', tailWidth: 3, rules: [
      { kind: 'sum', positions: [0, 1, 2], total: 15 },
      { kind: 'difference', left: 1, right: 0, difference: 2 },
      { kind: 'difference', left: 0, right: 2, difference: 2 },
    ],
  })), '573');
  assert.equal(solveNumbers(given('number-build', 'digit-cards', {
    digits: [0, 3, 7, 2], order: 'smallest', parity: 'even', limit: { direction: 'greater', value: 3000 },
  })), '3072');
  assert.equal(solveNumbers(given('number-build', 'digit-cards', {
    digits: [0, 2, 5], order: 'smallest', parity: null, limit: null,
  })), '205');
  assert.equal(solveNumbers(given('symbol-equations', 'equations', {
    equations: [
      { terms: ['star', 'star', 'circle'], total: 11 },
      { terms: ['star', 'circle', 'circle'], total: 10 },
    ], target: ['star', 'star', 'circle', 'circle'],
  })), '14');
  assert.equal(solveNumbers(given('digit-algorithm', 'calculation', { topMask: '38□', factor: 4, bottomMask: '□524' })), '1');
});

test('semantic diagram mutations are rejected, or recomputed when both sets of givens are coherently changed', () => {
  const question = given('abacus-change', 'abacus', {
    rods: [{ place: 100, beads: 4 }, { place: 10, beads: 0 }, { place: 1, beads: 7 }], label: 'Before',
  }, { from: 100, to: 10, swap: null });
  question.visual.rods[0].beads = 5;
  assert.throws(() => solveNumbers(question), /diagram givens disagree/);
  assert.equal(solveNumbers(resnapshot(question)), '417');
  const fraction = given('fraction-picture', 'fraction', { cells: parts(2, 5), label: '' });
  fraction.visual.cells[0][2] = 1;
  assert.throws(() => solveNumbers(fraction), /diagram givens disagree/);
  assert.equal(solveNumbers(resnapshot(fraction)), '3/5');
  const decimal = given('decimal-model', 'hundredths', { cells: hundredths(27) });
  decimal.visual.cells[9][9] = 1;
  assert.throws(() => solveNumbers(decimal), /diagram givens disagree/);
  assert.equal(solveNumbers(resnapshot(decimal)), '0.28');
});

test('graphical option keys must agree with every fraction and place-value option after shuffling', () => {
  for (const [family, year, level, field] of [
    ['fraction-change', 4, 2, 'cells'], ['number-compare', 2, 2, 'rods'], ['abacus-change', 3, 2, 'rods'],
  ]) {
    const draft = generated(family, grade(year), level, `mutation-${family}`);
    const question = finalForm(draft, family, 'shuffled-options');
    const visual = question.optionVisuals.find(Boolean);
    if (field === 'cells') visual.cells[0][0] = 1 - visual.cells[0][0];
    else visual.rods.at(-1).beads = (visual.rods.at(-1).beads + 1) % 10;
    assert.throws(() => solveNumbers(question), /option key disagrees/);
  }
});

test('number diagram renderer refuses other families and unknown number models explicitly', () => {
  assert.throws(() => renderNumbers({ kind: 'v2-everyday-clock', description: 'A clock from a different bank.' }), /Unknown number diagram/);
  assert.throws(() => renderNumbers({ kind: 'v2-number-not-real', description: 'An unsupported number diagram.' }), /Unknown number diagram/);
});
