import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADES_V2 as GRADES } from '../js/space-academy/curriculum.mjs';
import { QuestionRetry, randomContext, choiceCount } from '../js/space-academy/bank-shared.mjs';
import { REASONING_FAMILIES, draftReasoning, solveReasoning, renderReasoning } from '../js/space-academy/bank-reasoning.mjs';

const key = cells => `grid:${cells.length}x${cells[0].length}:${cells.map(row => row.join('')).join('/')}`;
const visual = (kind, givens, description) => ({ kind: `v2-reasoning-${kind}`, ...structuredClone(givens), description });
const gridVisual = cells => visual('grid', { cells }, `Marked tile choice with rows ${cells.map(row => row.join(', ')).join('; ')}.`);

function fixture(family, model, answer, alternatives, correctVisual = null) {
  return {
    family, visual: model, proof: { family, givens: structuredClone(model) }, answer,
    choices: [
      { value: answer, code: null, ...(correctVisual ? { visual: correctVisual } : {}) },
      ...alternatives.map(item => typeof item === 'string'
        ? { value: item, code: 'ignored-condition' } : { code: 'wrong-transform', ...item }),
    ],
  };
}

function gridFixture(family, model, correct, alternatives) {
  return fixture(family, model, key(correct), alternatives.map(cells => ({ value: key(cells), visual: gridVisual(cells) })), gridVisual(correct));
}

function draw(family, grade, level, r) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { return draftReasoning(family, grade, level, r); }
    catch (error) { if (!(error instanceof QuestionRetry)) throw error; }
  }
  assert.fail(`${grade.id}/${family}/${level} exhausted the bounded retry budget.`);
}

test('marked reflection, clockwise rotation and analogy have independently specified images', () => {
  const source = [[2, 1, 0], [0, 3, 0], [1, 0, 0]];
  const reflected = [[0, 1, 2], [0, 3, 0], [0, 0, 1]];
  const clockwise = [[1, 0, 2], [0, 3, 1], [0, 0, 0]];
  const half = [[0, 0, 1], [0, 3, 0], [0, 1, 2]];
  const mirror = gridFixture('mirror-grid',
    visual('mirror', { cells: source, axis: 'vertical' }, 'A marked three by three square with a vertical mirror line on the right.'),
    reflected, [source, clockwise, half]);
  const rotation = gridFixture('rotate-grid',
    visual('rotation', { cells: source, turn: 'turn-right' }, 'A marked three by three square with a clockwise quarter-turn instruction.'),
    clockwise, [source, reflected, half]);
  assert.equal(solveReasoning(mirror), key(reflected));
  assert.equal(solveReasoning(rotation), key(clockwise));

  const c = [[0, 2, 0], [1, 0, 3], [0, 1, 0]];
  const cReflected = [[0, 2, 0], [3, 0, 1], [0, 1, 0]];
  const analogy = gridFixture('figure-analogy',
    visual('analogy', { a: source, b: reflected, c }, 'A reflects to B; a differently marked picture C must follow the same example.'),
    cReflected, [c, source, half]);
  assert.equal(solveReasoning(analogy), key(cReflected));

  const alteredDiagram = structuredClone(mirror);
  alteredDiagram.visual.cells[0][0] = 3;
  assert.throws(() => solveReasoning(alteredDiagram), /diagram and proof/);
  const alteredChoice = structuredClone(rotation);
  alteredChoice.choices[0].visual.cells[0][2] = 3;
  assert.throws(() => solveReasoning(alteredChoice), /value disagrees/);
  const absentImage = structuredClone(mirror);
  delete absentImage.choices[0].visual;
  assert.throws(() => solveReasoning(absentImage), /missing its diagram/);
  const repeatedImage = structuredClone(mirror);
  repeatedImage.choices[1].visual = structuredClone(repeatedImage.choices[0].visual);
  assert.throws(() => solveReasoning(repeatedImage), /value disagrees/);
});

test('embedded patterns use exact adjacent submatrices and symmetry respects the markings', () => {
  const cells = [[2, 0, 1, 0], [1, 3, 0, 2], [0, 1, 2, 0], [3, 0, 1, 1]];
  const present = [[3, 0], [1, 2]];
  const absent = [[2, 3], [3, 2]];
  const other = [[2, 0], [1, 3]];
  const last = [[2, 0], [1, 1]];
  const positive = gridFixture('embedded-grid',
    visual('embedded', { cells, size: 2, find: 'present' }, 'A four by four marked grid; find the exact two by two block without turning.'),
    present, [absent, [[3, 3], [2, 2]], [[1, 1], [3, 3]]]);
  assert.equal(solveReasoning(positive), key(present));
  const negative = gridFixture('embedded-grid',
    visual('embedded', { cells, size: 2, find: 'absent' }, 'A four by four marked grid; find the two by two choice that is not present.'),
    absent, [present, other, last]);
  assert.equal(solveReasoning(negative), key(absent));
  const ambiguous = structuredClone(negative);
  ambiguous.choices[1] = { value: key([[3, 3], [3, 3]]), code: 'ignored-condition', visual: gridVisual([[3, 3], [3, 3]]) };
  assert.throws(() => solveReasoning(ambiguous), /exactly one choice/);

  const symmetric = [[2, 0, 0, 2], [1, 3, 3, 1], [0, 1, 1, 0], [1, 0, 0, 1]];
  const axisVisual = axis => visual('axis', { cells: symmetric, axis }, `The original marked square with a dashed ${axis} line.`);
  const symmetry = fixture('symmetry-grid',
    visual('symmetry', { cells: symmetric }, 'A marked four by four square; every cross and dot must match across the chosen line.'),
    'axis:vertical', ['horizontal', 'diagonal-main', 'diagonal-anti'].map(axis => ({ value: `axis:${axis}`, visual: axisVisual(axis) })),
    axisVisual('vertical'));
  assert.equal(solveReasoning(symmetry), 'axis:vertical');
  const differentOption = structuredClone(symmetry);
  differentOption.choices[0].visual.cells[0][0] = 0;
  assert.throws(() => solveReasoning(differentOption), /original grid/);
});

test('cube opposites are obtained by folding, while composite perimeter counts exposed edges', () => {
  const faces = [
    { x: 1, y: 0, label: 'A' }, { x: 0, y: 1, label: 'B' }, { x: 1, y: 1, label: 'C' },
    { x: 2, y: 1, label: 'D' }, { x: 1, y: 2, label: 'E' }, { x: 1, y: 3, label: 'F' },
  ];
  for (const [target, answer] of [['A', 'E'], ['B', 'D'], ['C', 'F']]) {
    const faceVisual = label => visual('face', { label }, `One square cube face labelled ${label}.`);
    const question = fixture('cube-net',
      visual('net', { faces, target }, 'Six labelled squares in a cross-shaped net, with the final square below the stem.'),
      answer, faces.filter(face => ![target, answer].includes(face.label)).slice(0, 3)
        .map(face => ({ value: face.label, visual: faceVisual(face.label) })), faceVisual(answer));
    assert.equal(solveReasoning(question), answer);
  }
  const invalidNet = faces.map((face, index) => ({ ...face, x: index % 3, y: Math.floor(index / 3) }));
  const invalid = fixture('cube-net',
    visual('net', { faces: invalidNet, target: 'A' }, 'A two by three rectangle of squares, which cannot close into a cube.'),
    'E', ['B', 'C', 'D'].map(label => ({ value: label, visual: visual('face', { label }, `Cube face marked with letter ${label}.`) })),
    visual('face', { label: 'E' }, 'Cube face marked with the letter E.'));
  assert.throws(() => solveReasoning(invalid), /fold|overlap/);

  const boundary = fixture('grid-boundary',
    visual('boundary', { cells: [[1, 0, 1], [1, 0, 1], [1, 1, 1]], unit: 3 },
      'Seven squares form a U with a two-square-deep open notch. Each square side is three centimetres.'),
    '48 cm', ['84 cm', '36 cm', '63 cm']);
  assert.equal(solveReasoning(boundary), '48 cm');
  const ignoredScale = structuredClone(boundary);
  ignoredScale.visual.unit = 4;
  ignoredScale.proof.givens = structuredClone(ignoredScale.visual);
  assert.throws(() => solveReasoning(ignoredScale), /solved answer|supplied answer/);
});

test('checkpoint paths are counted from actual arrows with the independent closed-junction condition', () => {
  const nodes = [
    { id: 'S', x: 30, y: 145 }, { id: 'A', x: 175, y: 60 }, { id: 'B', x: 175, y: 225 },
    { id: 'C', x: 320, y: 60 }, { id: 'D', x: 320, y: 225 }, { id: 'F', x: 470, y: 145 },
  ];
  const edges = [['S', 'A'], ['S', 'B'], ['A', 'C'], ['A', 'D'], ['B', 'C'], ['C', 'F'], ['D', 'F']];
  const model = { nodes, edges, start: 'S', finish: 'F', checkpoint: 'C', forbidden: null };
  const checkpoint = fixture('path-condition', visual('paths', model,
    'Arrows S-A, S-B, A-C, A-D, B-C, C-F, D-F. Count only S-to-F routes passing C; only circles join.'),
  '2 routes', ['3 routes', '1 route', '7 routes']);
  assert.equal(solveReasoning(checkpoint), '2 routes');
  const closed = fixture('path-condition', visual('paths', { ...model, forbidden: 'B' },
    'The same directed map has checkpoint C and closed junction B, which no allowed route may visit.'),
  '1 route', ['2 routes', '3 routes', '7 routes']);
  assert.equal(solveReasoning(closed), '1 route');
  const unrestricted = fixture('path-count', visual('paths', { ...model, checkpoint: null },
    'Arrows S-A, S-B, A-C, A-D, B-C, C-F, D-F. Count every directed route from S to F.'),
  '3 routes', ['2 routes', '4 routes', '7 routes']);
  assert.equal(solveReasoning(unrestricted), '3 routes');
  const reversedArrow = structuredClone(checkpoint);
  reversedArrow.visual.edges[0].reverse();
  reversedArrow.proof.givens = structuredClone(reversedArrow.visual);
  assert.throws(() => solveReasoning(reversedArrow), /arrows must lead/);
});

test('indirect area and parallel-line angles require the missing intermediate result', () => {
  const area = fixture('area-inference',
    visual('area', { mode: 'inferred', outerWidth: 18, perimeter: 60, cutWidth: 6, cutHeight: 4 },
      'The complete rectangle has perimeter 60 cm and width 18 cm; a top-right six by four cm corner is unshaded.'),
    '192 cm²', ['216 cm²', '24 cm²', '96 cm²']);
  assert.equal(solveReasoning(area), '192 cm²'); // Height is 12, not 60 − 18.
  const noStoredAnswer = structuredClone(area);
  delete noStoredAnswer.answer;
  noStoredAnswer.proof.answer = '999 cm²';
  assert.equal(solveReasoning(noStoredAnswer), '192 cm²');
  const hiddenHeight = structuredClone(area);
  hiddenHeight.visual.outerHeight = 12;
  hiddenHeight.proof.givens = structuredClone(hiddenHeight.visual);
  assert.throws(() => solveReasoning(hiddenHeight), /hidden height/);
  const alteredCutout = structuredClone(area);
  alteredCutout.visual.cutHeight = 5;
  assert.throws(() => solveReasoning(alteredCutout), /diagram and proof/);

  const relatedPerimeters = fixture('rectangle-constraint',
    visual('rectangle', { mode: 'related', reference: { length: 18, width: 9 }, delta: 8, knownSide: 'width', known: 7 },
      'Rectangle P is 18 by 9 cm. Q is 7 cm wide and its perimeter is eight centimetres greater than P’s.'),
    '24 cm', ['55 cm', '31 cm', '18 cm']);
  assert.equal(solveReasoning(relatedPerimeters), '24 cm');

  const parallel = fixture('angle-reason',
    visual('angles', {
      mode: 'parallel', parallel: true,
      known: { intersection: 'top', sector: 'LL', value: 68 },
      query: { intersection: 'bottom', sector: 'UL', offset: 12 },
    }, 'Two parallel horizontal lines: top lower-left angle 68 degrees, bottom upper-left angle x plus 12 degrees.'),
    '100°', ['68°', '112°', '56°']);
  assert.equal(solveReasoning(parallel), '100°');
  const corresponding = fixture('angle-reason',
    visual('angles', {
      mode: 'parallel', parallel: true,
      known: { intersection: 'top', sector: 'UR', value: 54 },
      query: { intersection: 'bottom', sector: 'UR', offset: 0 },
    }, 'Two parallel lines cut by a transversal: corresponding upper-right angles are 54 degrees and x.'),
    '54°', ['126°', '36°', '108°']);
  assert.equal(solveReasoning(corresponding), '54°');
  const unsupported = structuredClone(parallel);
  unsupported.visual.parallel = false;
  unsupported.proof.givens = structuredClone(unsupported.visual);
  assert.throws(() => solveReasoning(unsupported), /marked parallel/);
});

test('codes, queue changes, relative turns and excluded pairs use every stated constraint', () => {
  const coded = fixture('code-infer',
    visual('code-infer', {
      examples: [{ word: 'MAP', code: '372' }, { word: 'PEN', code: '251' }, { word: 'NAP', code: '172' }],
      target: 'MAN', orders: ['forward', 'backward'],
    }, 'MAP is 372, PEN is 251 and NAP is 172. Fixed distinct digits, one consistent reading direction; code MAN.'),
    '371', ['173', '731', '125']);
  assert.equal(solveReasoning(coded), '371');
  const contradictory = structuredClone(coded);
  contradictory.visual.examples[1].code = '257';
  contradictory.proof.givens = structuredClone(contradictory.visual);
  assert.throws(() => solveReasoning(contradictory), /one consistent code/);

  const ranks = fixture('ranking',
    visual('ranking', { mode: 'two', frontRank: 7, backRank: 6, between: 4 },
      'Mina is seventh from the front; Ravi sixth from the back, with exactly four children between and Mina ahead.'),
    '17 children', ['16 children', '18 children', '12 children']);
  assert.equal(solveReasoning(ranks), '17 children');
  const queue = fixture('ranking-change',
    visual('ranking-change', { mode: 'pair', total: 28, frontRank: 16, backRank: 23, joinFront: 3, leaveBack: 2 },
      'In 28 children, Mina is 16th from front and Ravi 23rd from back. They swap; three join front and two leave back.'),
    'Front 9; back 11', ['Front 19; back 21', 'Front 6; back 11', 'Front 9; back 13']);
  assert.equal(solveReasoning(queue), 'Front 9; back 11');
  const turns = fixture('turn-route',
    visual('turn-route', { facing: 'north', ask: 'position', steps: [
      { turn: 'none', distance: 3 }, { turn: 'left', distance: 4 }, { turn: 'right', distance: 2 },
    ] }, 'Start facing north; move three metres, turn left and move four, then turn right and move two.'),
    '4 m west and 5 m north', ['4 m east and 5 m north', '4 m west and 1 m north', '5 m west and 4 m north']);
  assert.equal(solveReasoning(turns), '4 m west and 5 m north');
  const combinations = fixture('combinations',
    visual('combinations', { flags: ['A', 'B', 'C'], badges: [
      { id: '1', shape: 'circle' }, { id: '2', shape: 'triangle' }, { id: '3', shape: 'star' },
    ], excluded: [['A', '1'], ['A', '2'], ['B', '2']] },
    'Choose flag A, B or C and badge 1, 2 or 3. Only pairs A-1, A-2 and B-2 are forbidden.'),
    '6 pairs', ['9 pairs', '8 pairs', '3 pairs']);
  assert.equal(solveReasoning(combinations), '6 pairs');
  const duplicateExclusion = structuredClone(combinations);
  duplicateExclusion.visual.excluded.push(['A', '1']);
  duplicateExclusion.proof.givens = structuredClone(duplicateExclusion.visual);
  assert.throws(() => solveReasoning(duplicateExclusion), /repeated/);
});

test('every owned current-blueprint family produces distinct semantic pictures and survives option shuffling', () => {
  const used = new Set();
  let checked = 0;
  for (const grade of GRADES) for (const chapter of grade.chapters) {
    for (const [index, families] of chapter.families.entries()) for (const family of families) {
      if (!REASONING_FAMILIES.includes(family)) continue;
      used.add(family);
      const r = randomContext(`reasoning-${grade.id}-${chapter.id}-${index}-${family}`);
      for (let seed = 0; seed < 10; seed++) {
        const draft = draw(family, grade, index + 1, r);
        assert.equal(solveReasoning(draft), draft.answer);
        assert.equal(draft.choices.length, choiceCount(grade));
        assert.ok(draft.hint && draft.hint !== draft.explanation);
        const ordered = r.shuffle(draft.choices);
        const { choices, ...base } = draft;
        const final = {
          ...base, grade: grade.id, level: index + 1,
          options: ordered.map(choice => choice.value), optionVisuals: ordered.map(choice => choice.visual ?? null),
        };
        assert.equal(solveReasoning(final), draft.answer);
        const descriptors = [draft.visual, ...ordered.flatMap(choice => choice.visual ? [choice.visual] : [])];
        for (const descriptor of descriptors) {
          assert.match(descriptor.kind, /^v2-reasoning-/);
          assert.ok(descriptor.description.length >= 15);
          const output = renderReasoning(descriptor);
          assert.match(output, /role="img" aria-label="/);
          assert.doesNotMatch(output, /(?:NaN|undefined|<script)/);
        }
        const graphical = ordered.filter(choice => choice.visual).map(choice => {
          const { description, ...model } = choice.visual;
          return JSON.stringify(model);
        });
        assert.equal(new Set(graphical).size, graphical.length);
        checked++;
      }
    }
  }
  assert.ok(checked >= 500, `Only ${checked} current-blueprint cases were checked.`);
  assert.deepEqual([...used].sort(), [...REASONING_FAMILIES].sort());
  for (const year of [3, 5]) {
    const grade = GRADES.find(item => item.year === year);
    const question = draw('turn-route', grade, 2, randomContext(`unused-turn-family-${year}`));
    assert.equal(solveReasoning(question), question.answer);
    assert.match(renderReasoning(question.visual), /role="img"/);
  }
  assert.throws(() => draftReasoning('unknown-family', GRADES[0], 1, randomContext('unknown')), /unknown reasoning family/);
  assert.throws(() => renderReasoning({ kind: 'v2-reasoning-unknown', description: 'An unknown, unsupported reasoning picture.' }), /Unknown reasoning visual kind/);
});
