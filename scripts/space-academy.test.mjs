import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_VERSION, FAMILIES, GRADES, gameLink } from '../js/space-academy/curriculum.mjs';
import { createMission, verifyQuestion } from '../js/space-academy/questions.mjs';
import { applyAction, currentJourney, newSave, recommendChapter, skillReport, universePassport, validateSave } from '../js/space-academy/progress.mjs';
import { applyAction as legacyAction, newSave as legacySave } from '../js/space-academy/progress-v1.mjs';
import { DESTINATIONS, PARTS } from '../js/space-academy/destinations.mjs';
import { ActiveClock, escapeHTML } from '../js/space-academy/art.mjs';
import { academyPages, buildAcademy } from './build-space-academy.mjs';

const mission = (seed = 'test-1', extra = {}) => createMission({ grade: 'class-1', chapter: 'operations', seed, ...extra });
function finish(save, set, wrong = false, hinted = false, reduce = applyAction) {
  save = reduce(save, { type: 'start', mission: set });
  for (let index = 0; index < set.questions.length; index++) {
    const question = set.questions[index];
    if (hinted) save = reduce(save, { type: 'hint', missionId: set.id });
    save = reduce(save, { type: 'answer', missionId: set.id, choice: wrong ? (question.correctIndex + 1) % question.options.length : question.correctIndex });
    if (index < set.questions.length - 1) save = reduce(save, { type: 'next', missionId: set.id });
  }
  return reduce(save, { type: 'complete', missionId: set.id });
}

test('all grade/chapter/level missions have distinct, proved answers and real explanations', () => {
  let checked = 0;
  const families = new Set();
  for (const grade of GRADES) {
    for (const chapter of grade.chapters) {
      for (const level of [1, 2, 3]) {
        for (let seed = 0; seed < 12; seed++) {
          const set = createMission({ grade: grade.id, chapter: chapter.id, level, seed: `coverage-${seed}` });
          assert.equal(set.contentVersion, CONTENT_VERSION);
          assert.equal(set.questions.length, grade.missionSize);
          assert.equal(new Set(set.questions.map(question => question.id)).size, set.questions.length);
          for (const question of set.questions) {
            assert.equal(verifyQuestion(question), true);
            assert.ok(chapter.skills.includes(question.skill));
            assert.ok(chapter.families[level - 1].includes(question.family));
            families.add(question.family);
            // v3 worked-answer explanations are deliberately terse ("7 - 2 = 5."); size ceilings live in the bank3 battery.
            assert.ok(question.explanation.length > (set.contentVersion >= 3 ? 8 : 20));
            assert.notEqual(question.explanation.trim(), String(question.answer).trim());
            assert.ok(question.hint !== question.explanation);
            assert.equal(question.feedback.length, question.options.length);
            assert.equal(question.feedback[question.correctIndex], null);
            if (question.proof.operation === 'sharing') {
              const [total, kept, groups] = question.proof.operands;
              assert.equal((total - kept) % groups, 0);
            }
            checked++;
          }
        }
      }
    }
  }
  // Legacy v2 families stay registered for saved attempts, so compare with what the live plans schedule.
  const planned = new Set(GRADES.flatMap(grade => grade.chapters.flatMap(chapter => chapter.families.flat())));
  assert.ok([...planned].every(family => FAMILIES[family]));
  assert.deepEqual([...families].sort(), [...planned].sort());
  assert.ok(checked > 10000);
});

test('verification rejects changed scale data and incorrectly labelled clock picture options', () => {
  // These families exist only in the v2 bank; v3 grade banks are covered by their bank3 batteries.
  const contentVersion = 2;
  const find = (request, family) => structuredClone(createMission({ ...request, seed: 'visual-proof', contentVersion }).questions.find(question => question.family === family));
  const ruler = find({ grade: 'class-1', chapter: 'measurement', level: 1 }, 'ruler-read');
  ruler.visual.end++;
  assert.throws(() => verifyQuestion(ruler), /diagram|givens/);
  const clock = find({ grade: 'class-2', chapter: 'time', level: 2 }, 'clock-options');
  clock.optionVisuals[clock.correctIndex].minutes = (clock.optionVisuals[clock.correctIndex].minutes + 5) % 720;
  assert.throws(() => verifyQuestion(clock), /picture|diagram/);
});

test('a shared seed reproduces the same set; a new seed changes the actual problems', () => {
  assert.deepEqual(mission('shared'), mission('shared'));
  assert.notDeepEqual(mission('shared').questions.map(question => question.id), mission('fresh').questions.map(question => question.id));
  assert.throws(() => mission('bad seed'), /seed/);
  assert.throws(() => mission('seed', { level: 4 }), /level/);
  assert.throws(() => createMission({ grade: 'pp1', mode: 'paper', seed: 'paper' }), /not exam/);
  const question = structuredClone(mission().questions[0]);
  question.answer = '99999999';
  assert.throws(() => verifyQuestion(question), /Invalid/);
});

test('original practice papers use grade-specific section counts, not tiny missions labelled as exams', () => {
  for (const grade of GRADES.filter(grade => grade.year > 0)) {
    const set = createMission({ grade: grade.id, mode: 'paper', seed: 'paper', level: 2 });
    assert.equal(set.questions.length, grade.year === 5 ? 50 : 35);
    assert.equal(set.questions.filter(question => question.section === 'reasoning').length, grade.year === 5 ? 15 : 10);
    assert.equal(set.questions.filter(question => question.section === 'maths').length, grade.year === 5 ? 20 : 10);
    assert.equal(set.questions.filter(question => question.section === 'everyday').length, 10);
    assert.equal(set.questions.filter(question => question.section === 'stretch').length, 5);
    assert.ok(set.questions.filter(question => question.section === 'stretch').every(question => question.level === 3));
  }
});

test('chapter, mixed and paper links recreate exactly the mission that can be saved', () => {
  for (const mode of ['chapter', 'mixed', 'paper']) {
    const set = createMission({ grade: 'class-4', chapter: mode === 'chapter' ? 'fractions' : null, mode, level: 3, seed: 'linked-set' });
    const params = new URL(gameLink(set), 'https://otterlygames.com').searchParams;
    const restored = createMission({
      grade: params.get('grade'), chapter: params.get('chapter'),
      level: Number(params.get('level')), mode: params.get('mode'), seed: params.get('seed'), contentVersion: Number(params.get('bank')),
    });
    assert.deepEqual(restored, set);
    assert.doesNotThrow(() => applyAction(applyAction(newSave(), { type: 'grade', id: 'class-4' }), { type: 'start', mission: restored }));
  }
  assert.throws(() => createMission({ grade: 'class-1', chapter: 'numbers', mode: 'mixed', seed: 'bad-settings' }), /chapter setting/);
});

test('answers, hints and mission bookmarks survive a serialised save without granting early rewards', () => {
  const set = mission();
  let save = applyAction(newSave(), { type: 'start', mission: set });
  assert.throws(() => applyAction(save, { type: 'complete', missionId: set.id }), /Every question/);
  save = applyAction(save, { type: 'hint', missionId: set.id });
  save = applyAction(save, { type: 'answer', missionId: set.id, choice: set.questions[0].correctIndex });
  save = validateSave(JSON.parse(JSON.stringify(save)));
  assert.equal(currentJourney(save).active.answers[0].hinted, true);
  assert.deepEqual(currentJourney(save).earned, []);
  assert.throws(() => applyAction(save, { type: 'answer', missionId: set.id, choice: 0 }), /already saved/);
  assert.throws(() => applyAction(save, { type: 'start', mission: mission('replace') }), /explicitly replace/);
  const futureHint = structuredClone(save);
  currentJourney(futureHint).active.answers[1].hinted = true;
  assert.throws(() => validateSave(futureHint), /bookmark/);
});

test('completion, not perfection, earns one part and charge; duplicate completion cannot mint rewards', () => {
  const set = mission();
  const save = finish(newSave(), set, true);
  const journey = currentJourney(save);
  assert.equal(journey.lastResult.correct, 0);
  assert.deepEqual(journey.earned, ['engine']);
  assert.equal(journey.charges, 1);
  assert.deepEqual(applyAction(save, { type: 'complete', missionId: set.id }), save);
  assert.throws(() => applyAction(save, { type: 'start', mission: set }), /already complete/);
  for (const [key, value] of [['correct', 8], ['helped', -1], ['part', 'unearned-part']]) {
    const corrupted = structuredClone(save);
    currentJourney(corrupted).lastResult[key] = value;
    assert.throws(() => validateSave(corrupted), /reward or answer totals/);
  }
});

test('legacy assembly and pending flights survive migration, preserve charges and arrive once', () => {
  let save = legacySave();
  assert.throws(() => legacyAction(save, { type: 'fit', part: 'engine', slot: 'engine' }), /earn/);
  for (let index = 0; index < PARTS.length; index++) save = finish(save, mission(`rocket-${index}`, { contentVersion: 2 }), false, false, legacyAction);
  assert.throws(() => legacyAction(save, { type: 'launch' }), /Fit all six/);
  assert.throws(() => legacyAction(save, { type: 'fit', part: 'engine', slot: 'nose' }), /matching/);
  for (const part of PARTS) save = legacyAction(save, { type: 'fit', part: part.id, slot: part.id });
  save = legacyAction(save, { type: 'launch' });
  save = validateSave(JSON.parse(JSON.stringify(save)));
  const flight = currentJourney(save).flight;
  assert.equal(currentJourney(save).charges, 5);
  assert.throws(() => applyAction(save, { type: 'remove', part: 'engine' }), /during a flight/);
  save = applyAction(save, { type: 'arrive', flightId: flight.id, destination: flight.destination });
  assert.deepEqual(currentJourney(save).visits, ['earth']);
  assert.equal(currentJourney(save).earned.length, 6);
  assert.deepEqual(applyAction(save, { type: 'arrive', flightId: flight.id, destination: flight.destination }), save);
});

test('a complete legacy passport migrates without losing discoveries or accepting a fabricated flight', () => {
  let save = legacySave();
  for (let index = 0; index <= DESTINATIONS.length; index++) save = finish(save, mission(`last-stop-${index}`, { contentVersion: 2 }), false, false, legacyAction);
  for (const part of PARTS) save = legacyAction(save, { type: 'fit', part: part.id, slot: part.id });
  for (const world of DESTINATIONS) {
    save = legacyAction(save, { type: 'launch' });
    const flight = currentJourney(save).flight;
    assert.equal(flight.destination, world.id);
    save = legacyAction(save, { type: 'arrive', flightId: flight.id, destination: world.id });
  }
  save = validateSave(save);
  assert.equal(currentJourney(save).charges, 1);
  assert.equal(universePassport(save).length, 30);
  assert.throws(() => applyAction(save, { type: 'launch' }), /activity/);
  const invalid = structuredClone(save);
  currentJourney(invalid).flight = { id: 'flight:class-1:30' };
  currentJourney(invalid).charges = 0;
  assert.throws(() => validateSave(invalid), /saved flight/);
});

test('reports require enough independent evidence, separate levels and hints, and collapse repeat questions', () => {
  let save = finish(newSave(), mission('helped'), false, true);
  for (const skill of ['addition', 'subtraction', 'mystery']) {
    const report = skillReport(currentJourney(save), skill, 1);
    assert.equal(report.count, 0);
    assert.equal(report.status, 'Gathering evidence');
  }
  for (let index = 0; index < 4; index++) save = finish(save, mission(`weak-${index}`), true);
  const report = skillReport(currentJourney(save), 'addition', 1);
  assert.ok(report.count >= 5);
  assert.equal(report.status, 'Practise next');
  assert.equal(skillReport(currentJourney(save), 'addition', 2).count, 0);
  assert.equal(recommendChapter('class-1', currentJourney(save), 1).chapter.id, 'operations');
  assert.equal(new Set(currentJourney(save).attempts.map(attempt => `${attempt.id}:${attempt.level}`)).size, currentJourney(save).attempts.length);
});

test('explorer resets and grade changes cannot erase another learner or another grade', () => {
  let save = finish(newSave(), mission());
  save = applyAction(save, { type: 'grade', id: 'pp1' });
  save = finish(save, createMission({ grade: 'pp1', chapter: 'counting', seed: 'tiny' }));
  save = applyAction(save, { type: 'explorer', id: 'explorer-2' });
  save = finish(save, mission('sibling'));
  save = applyAction(save, { type: 'reset-explorer' });
  assert.equal(currentJourney(save).completed.length, 0);
  save = applyAction(save, { type: 'explorer', id: 'explorer-1' });
  assert.equal(currentJourney(save).completed.length, 1);
  save = applyAction(save, { type: 'grade', id: 'class-1' });
  assert.equal(currentJourney(save).completed.length, 1);
  const invalid = structuredClone(save);
  invalid.explorers['explorer-1'].journeys['class-1'].charges = 999;
  assert.throws(() => validateSave(invalid), /balance/);
  assert.throws(() => validateSave({ ...save, version: 99 }), /not a supported/);
});

test('active flight time excludes paused gaps and resumes the remaining duration', () => {
  const clock = new ActiveClock();
  assert.equal(clock.tick(100, true), 0);
  assert.equal(clock.tick(350, true), 250);
  clock.pause();
  assert.equal(clock.tick(8000, false), 250);
  assert.equal(clock.tick(10000, true), 250);
  assert.equal(clock.tick(10200, true), 450);
});

test('discovery generation keeps worked samples reproducible and refuses unowned pages before any write', () => {
  const pages = academyPages();
  const fixtureBase = fileURLToPath(new URL('../build/academy-test-fixtures/', import.meta.url));
  mkdirSync(fixtureBase, { recursive: true });
  const fixture = mkdtempSync(join(fixtureBase, 'lessons-'));
  try {
    mkdirSync(join(fixture, '_data'));
    mkdirSync(join(fixture, '_includes'));
    for (const file of ['nav.html', 'footer.html']) {
      copyFileSync(fileURLToPath(new URL(`../_includes/${file}`, import.meta.url)), join(fixture, '_includes', file));
    }
    const inventory = { origin: 'https://otterlygames.com', pages: pages.map(page => ({ route: page.route })) };
    const inventoryPath = join(fixture, '_data', 'public-pages.json');
    writeFileSync(inventoryPath, JSON.stringify(inventory));
    const checked = buildAcademy({ root: fixture });
    assert.equal(checked.changed, pages.length);
    assert.equal(existsSync(join(fixture, 'learn')), false);
    assert.equal(buildAcademy({ root: fixture, write: true }).changed, pages.length);
    assert.equal(buildAcademy({ root: fixture }).changed, 0);
    for (const grade of GRADES) {
      for (const chapter of grade.chapters) {
        const html = readFileSync(join(fixture, 'learn', 'olympiad', grade.id, `${chapter.id}.html`), 'utf8');
        assert.match(html, /Answer &amp; method/);
        assert.match(html, /Independent educator review/);
        const set = createMission({ grade: grade.id, chapter: chapter.id, level: 1, seed: `guide-${grade.id}-${chapter.id}` });
        assert.ok(html.includes(escapeHTML(set.questions[0].prompt)));
        assert.ok(html.includes(escapeHTML(set.questions[0].explanation)));
        assert.ok(!html.includes(set.questions[0].id));
        assert.match(html, /data-lesson-sample/);
        assert.equal((html.match(/<nav class="nav"/g) ?? []).length, 1);
      }
    }
    const unowned = join(fixture, 'learn', 'olympiad', 'pp1', 'counting.html');
    const guarded = join(fixture, 'learn', 'olympiad', 'index.html');
    const previous = readFileSync(guarded, 'utf8');
    writeFileSync(guarded, previous + '\n<!-- deliberate stale fixture -->');
    writeFileSync(unowned, '<!DOCTYPE html><title>Do not replace me</title>');
    assert.throws(() => buildAcademy({ root: fixture, write: true }), /Refusing to overwrite/);
    assert.equal(readFileSync(guarded, 'utf8'), previous + '\n<!-- deliberate stale fixture -->');
    inventory.pages.pop();
    writeFileSync(inventoryPath, JSON.stringify(inventory));
    assert.throws(() => buildAcademy({ root: fixture, write: true }), /explicitly/);
  } finally {
    rmSync(fixture, { recursive: true });
  }
});
