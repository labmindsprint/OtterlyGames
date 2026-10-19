import assert from 'node:assert/strict';
import test from 'node:test';
import { runBattery } from './space-academy-bank3-battery.mjs';
import * as grade from '../js/space-academy/bank3-class-4.mjs';
import { REAL_FAMILIES } from '../js/space-academy/bank3-class-4-real.mjs';
import { QuestionRetry, randomContext } from '../js/space-academy/bank-shared.mjs';

runBattery('class-4', grade);

function sample(family, level, seed) {
  const r = randomContext(seed);
  for (let attempt = 0; attempt < 120; attempt++) {
    try { return grade.draft(family, { id: 'class-4', year: 4, choices: 4 }, level, r); }
    catch (error) { if (!(error instanceof QuestionRetry)) throw error; }
  }
  throw new Error(`No sample for ${family}.`);
}

test('[class-4] checkpoint answers match exhaustive path enumeration', () => {
  for (const level of [1, 2, 3]) for (let seed = 0; seed < 45; seed++) {
    const question = sample('class-4-checkpoint-routes', level, `routes-${level}-${seed}`);
    const v = question.visual, mode = question.proof.givens.mode;
    function walk(x, y, visited = false) {
      const through = visited || Boolean(v.checkpoint && x === v.checkpoint.x && y === v.checkpoint.y);
      if (x === v.width && y === v.height) return mode === 'all' || (mode === 'through' ? through : !through) ? 1 : 0;
      const rightOpen = !(v.closed?.direction === 'R' && v.closed.x === x && v.closed.y === y);
      const upOpen = !(v.closed?.direction === 'U' && v.closed.x === x && v.closed.y === y);
      return (x < v.width && rightOpen ? walk(x + 1, y, through) : 0) + (y < v.height && upOpen ? walk(x, y + 1, through) : 0);
    }
    assert.equal(question.answer, String(walk(0, 0)));
    assert.equal(grade.solve(question), question.answer);
  }
});

test('[class-4] cube opposites survive every net rotation', () => {
  const cells = [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]];
  const opposites = [4, 3, 5, 1, 0, 2];
  for (let rotation = 0; rotation < 4; rotation++) {
    const faces = cells.map(([x, y], i) => {
      for (let turn = 0; turn < rotation; turn++) [x, y] = [-y, x];
      return { x, y, label: String.fromCharCode(65 + i) };
    });
    for (let target = 0; target < faces.length; target++) {
      assert.equal(grade.solve({
        family: 'class-4-folded-cube', proof: { givens: { target: faces[target].label } }, visual: { faces },
      }), faces[opposites[target]].label);
    }
  }
});

test('[class-4] every picture-choice solver rejects a mislabelled picture', () => {
  for (const family of ['class-4-equivalent-bars', 'class-4-mirror-panel', 'class-4-clock-repair']) {
    const draft = sample(family, 3, `picture-contract-${family}`);
    const question = {
      ...draft, options: draft.choices.map(choice => choice.value),
      optionVisuals: draft.choices.map(choice => structuredClone(choice.visual)),
    };
    assert.equal(grade.solve(question), draft.answer);
    const first = question.optionVisuals[0];
    if (first.minutes !== undefined) first.minutes = (first.minutes + 5) % 720;
    else if (first.numerator !== undefined) first.numerator++;
    else first.cells[0][0] ^= 1;
    assert.throws(() => grade.solve(question), /picture does not match/i);
  }
});

test('[class-4] real-paper style families recompute their answer and reject a changed picture', () => {
  const real = Object.keys(REAL_FAMILIES);
  let pictures = 0;
  for (const family of real) for (const level of [1, 2, 3]) for (let seed = 0; seed < 4; seed++) {
    let question;
    try { question = sample(family, level, `real-${family}-${level}-${seed}`); } catch { continue; }
    assert.equal(question.choices.length, 4, `${family} needs four options`);
    const published = { ...question, options: question.choices.map(choice => choice.value) };
    if (question.choices.some(choice => choice.visual)) published.optionVisuals = question.choices.map(choice => structuredClone(choice.visual));
    assert.equal(grade.solve(published), question.answer, family);
    if (published.optionVisuals) {
      pictures++;
      const damaged = structuredClone(published);
      damaged.optionVisuals[0].cells[0][0] ^= 1;
      assert.throws(() => grade.solve(damaged), /picture does not match/i, `${family} accepted a mislabelled picture`);
    }
    if (/^\d{2,}$/.test(question.answer)) assert.ok(!new RegExp(`(^|\\D)${question.answer}(\\D|$)`).test(question.hint), `${family} hint leaks the answer`);
    if (Array.isArray(question.visual?.rows)) {
      pictures++;
      const changed = { ...question, visual: { ...question.visual, rows: [...question.visual.rows, [1, 2, 3]] } };
      assert.throws(() => grade.solve(changed), undefined, `${family} accepted a changed picture`);
    }
  }
  assert.ok(pictures > 0);
});

test('[class-4] figure families match answers re-derived from their pictures alone', () => {
  for (let level = 1; level <= 3; level++) for (let seed = 0; seed < 12; seed++) {
    const scales = sample('class-4-scale-weights', level, `figs-w-${level}-${seed}`);
    const shape = /one (\w+) in/.exec(scales.prompt)[1];
    const index = ['square', 'circle', 'triangle'].indexOf(shape), found = new Set();
    for (let s = 1; s <= 60; s++) for (let c = 1; c <= 60; c++) for (let t = 1; t <= 60; t++) {
      if (scales.visual.rows.every(row => row.parts.filter(p => p === 'square').length * s + row.parts.filter(p => p === 'circle').length * c + row.parts.filter(p => p === 'triangle').length * t === row.total)) found.add([s, c, t][index]);
    }
    assert.deepEqual([...found], [Number(scales.answer)]);

    const fold = sample('class-4-paper-fold', level, `figs-f-${level}-${seed}`);
    const n = Number(/A (\d) by/.exec(fold.prompt)[1]), { cols, rows, hole } = fold.visual;
    const holes = new Set([`R${hole.r}C${hole.c}`]);
    if (cols.length < n) for (const h of [...holes]) { const [, r, c] = /R(\d)C(\d)/.exec(h); holes.add(`R${r}C${n + 1 - c}`); }
    if (rows.length < n) for (const h of [...holes]) { const [, r, c] = /R(\d)C(\d)/.exec(h); holes.add(`R${n + 1 - r}C${c}`); }
    const pairs = [...holes].map(h => /R(\d)C(\d)/.exec(h).slice(1).map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    assert.equal(fold.answer, pairs.map(([r, c]) => `R${r}C${c}`).join(', '));

    const embedded = sample('class-4-embedded-figure', level, `figs-e-${level}-${seed}`);
    const big = embedded.visual.cells;
    const inside = text => { const piece = text.split('/').map(row => [...row].map(Number)); return big.some((_, top) => big[0].some((_, left) => piece.every((row, i) => row.every((value, j) => big[top + i]?.[left + j] === value)))); };
    assert.deepEqual(embedded.choices.map(choice => inside(choice.value)), embedded.choices.map(choice => choice.value === embedded.answer));

    const bars = sample('class-4-bar-scale', level, `figs-b-${level}-${seed}`);
    const values = bars.visual.units.map(u => u * bars.visual.scale);
    if (/in all/.test(bars.prompt)) assert.equal(Number(bars.answer), values.reduce((a, b) => a + b, 0));
    if (/busiest/.test(bars.prompt)) assert.equal(Number(bars.answer), Math.max(...values) - Math.min(...values));
  }
});

