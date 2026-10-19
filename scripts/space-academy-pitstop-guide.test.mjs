import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CLASSES } from '../js/space-academy/pitstop/data.mjs';
import { applyPart, applySetting, blankSave, validateSave } from '../js/space-academy/pitstop/progress.mjs';
import { CLASS_AGES, STEPS, chooseClass, finishGuide, hasProgress, needsGuide } from '../js/space-academy/pitstop/onboarding.mjs';

const answers = chapter => [{ chapter, correct: true }, { chapter, correct: true }];
const withProgress = () => {
  const info = CLASSES.find(item => item.id === 'class-2');
  return applyPart(blankSave(), 'class-2', info.parts[0].id, answers(info.parts[0].chapters[0]));
};

test('a blank save is first run and shows the guide', () => {
  const save = blankSave();
  assert.equal(needsGuide(save), true);
  assert.equal(hasProgress(save), false);
});

test('saves with progress, or that already saw the guide, never get a surprise guide', () => {
  assert.equal(needsGuide(withProgress()), false);
  assert.equal(needsGuide(applySetting(blankSave(), { guideSeen: true })), false);
  assert.equal(needsGuide({ ...blankSave(), premium: { unlimited: true } }), false);
  const oldSave = JSON.parse(JSON.stringify(blankSave()));
  delete oldSave.settings.guideSeen;
  oldSave.chapters['class-1/numbers'] = { right: 3, total: 4, recent: '1110', at: 'x' };
  assert.equal(needsGuide(validateSave(oldSave)), false);
});

test('picking a class sets the active class and remembers the pick, once', () => {
  const first = chooseClass(blankSave(), 'class-3');
  assert.equal(first.activeClass, 'class-3');
  assert.equal(first.settings.preferredClass, 'class-3');
  assert.equal(chooseClass(first, 'class-3'), first, 'same pick changes nothing');
  assert.equal(chooseClass(first, 'pp1').activeClass, 'pp1');
  assert.equal(blankSave().activeClass, null, 'the old save is not mutated');
  assert.throws(() => chooseClass(blankSave(), 'class-9'), RangeError);
});

test('mid-guide quit keeps the class but still shows the guide again', () => {
  const picked = validateSave(JSON.parse(JSON.stringify(chooseClass(blankSave(), 'class-3'))));
  assert.equal(picked.activeClass, 'class-3');
  assert.equal(needsGuide(picked), true);
});

test('finishing the guide persists guideSeen through validation and a JSON round trip', () => {
  const done = finishGuide(chooseClass(blankSave(), 'class-3'));
  assert.equal(done.settings.guideSeen, true);
  const stored = validateSave(JSON.parse(JSON.stringify(done)));
  assert.equal(needsGuide(stored), false);
  assert.equal(finishGuide(done), done, 'already seen: no extra revision');
  assert.equal(stored.activeClass, 'class-3');
});

test('validateSave accepts the optional guide settings and rejects damaged ones', () => {
  assert.doesNotThrow(() => validateSave(blankSave()));
  const ok = blankSave();
  ok.settings.guideSeen = false;
  ok.settings.preferredClass = null;
  assert.doesNotThrow(() => validateSave(ok));
  for (const settings of [{ guideSeen: 'yes' }, { guideSeen: 1 }, { preferredClass: 'class-9' }, { preferredClass: 3 }]) {
    const bad = blankSave();
    Object.assign(bad.settings, settings);
    assert.throws(() => validateSave(bad), /guide settings/, JSON.stringify(settings));
  }
});

test('every class has an age hint and the four steps say the product-owner rules', () => {
  assert.deepEqual(Object.keys(CLASS_AGES).sort(), CLASSES.map(item => item.id).sort());
  const ages = CLASSES.map(item => CLASS_AGES[item.id]);
  assert.match(ages[0], /4.5/);
  assert.match(ages.at(-1), /10.11/);
  const text = Object.fromEntries(STEPS.map(step => [step.id, step]));
  assert.deepEqual(STEPS.map(step => step.id), ['build', 'launch', 'roam', 'print']);
  assert.equal(text.build.cost, 'Free');
  assert.match(text.launch.body, /10 mock tests/);
  assert.match(text.launch.body, /first one is free/);
  assert.match(text.launch.body, /Fuel refills every day/);
  assert.equal(text.launch.cost, '1 fuel');
  assert.equal(text.roam.cost, 'Free');
  assert.match(text.roam.body, /schematics/);
  assert.match(text.print.body, /10-question Print test/);
  assert.match(text.print.body, /7 or more/);
  assert.equal(text.print.cost, '1 fuel');
});

test('the guide is wired in: stylesheet, route, grown-ups replay and map chip', () => {
  const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  assert.match(read('play/pit-stop.html'), /\/css\/pit-stop-guide\.css/);
  assert.match(read('js/space-academy/pitstop/main.mjs'), /guide: \['\.\/view-onboarding\.mjs', 'guide'\]/);
  assert.match(read('js/space-academy/pitstop/views.mjs'), /data-act="guide"/);
  assert.match(read('js/space-academy/pitstop/lab.mjs'), /data-act="guide"/);
});
