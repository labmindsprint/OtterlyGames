import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GRADES, gameLink, getChapter } from '../js/space-academy/curriculum.mjs';
import { createMission } from '../js/space-academy/questions.mjs';
import {
  applyAction, blankJourney, currentJourney, isCurrentAttempt, readMissionLink,
  recommendChapter, skillReport, validateSave,
} from '../js/space-academy/progress.mjs';
import { answerChoice, diagram, escapeHTML } from '../js/space-academy/art.mjs';
import { choiceDescription, choiceLabel, questionReadAloud } from '../js/space-academy/question-display.mjs';
import { MISCONCEPTIONS } from '../js/space-academy/bank-shared.mjs';

const fixture = readFileSync(new URL('./fixtures/space-academy-v1-save.json', import.meta.url), 'utf8');
const oldSave = () => JSON.parse(fixture);
const at = '2026-10-17T12:00:00.000Z';
const act = (save, action) => applyAction(save, action, at);
const originalFlightJourney = save => save.explorers['explorer-1'].journeys['class-1'];

function finishActive(save) {
  while (currentJourney(save).active) {
    const { mission, index, answers } = currentJourney(save).active;
    if (answers[index].choice === null) {
      save = act(save, { type: 'answer', missionId: mission.id, choice: mission.questions[index].correctIndex });
    }
    save = act(save, {
      type: index === answers.length - 1 ? 'complete' : 'next', missionId: mission.id,
    });
  }
  return validateSave(JSON.parse(JSON.stringify(save)));
}

test('migration leaves the pre-change backup untouched and preserves all original-bank snapshots exactly', () => {
  const save = oldSave();
  const before = JSON.stringify(save);
  const migrated = validateSave(save);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.revision, save.revision + 1);
  assert.strictEqual(validateSave(migrated), migrated);
  assert.equal(JSON.stringify(save), before);
  for (const explorer of Object.values(migrated.explorers)) {
    for (const journey of Object.values(explorer.journeys)) {
      for (const mission of [journey.active?.mission, journey.lastResult?.mission].filter(Boolean)) {
        assert.deepEqual(createMission(mission), mission);
        assert.equal(mission.contentVersion, 1);
      }
    }
  }
  const changed = oldSave();
  changed.explorers['explorer-1'].journeys.pp1.active.mission.questions[0].prompt += ' changed';
  assert.throws(() => validateSave(changed), /does not match this question-bank version/);
});

test('both original-bank bookmarks finish without changing the fitted rocket, pending flight or other explorers', () => {
  let save = validateSave(oldSave());
  const flightJourney = structuredClone(originalFlightJourney(save));
  const explorerTwo = structuredClone(save.explorers['explorer-2']);
  const explorerThree = structuredClone(save.explorers['explorer-3']);
  const preschoolBookmark = structuredClone(save.explorers['explorer-1'].journeys.pp1.active);
  save = act(save, { type: 'grade', id: 'pp1' });
  save = finishActive(save);
  const preschool = currentJourney(save);
  assert.equal(preschool.lastResult.mission.id, preschoolBookmark.mission.id);
  assert.deepEqual(preschool.lastResult.answers[0], preschoolBookmark.answers[0]);
  assert.deepEqual(preschool.earned, ['engine']);
  assert.equal(preschool.charges, 1);
  assert.deepEqual(originalFlightJourney(save), flightJourney);
  assert.deepEqual(save.explorers['explorer-2'], explorerTwo);
  assert.deepEqual(save.explorers['explorer-3'], explorerThree);

  const explorerOne = structuredClone(save.explorers['explorer-1']);
  save = act(save, { type: 'explorer', id: 'explorer-2' });
  const olderBookmark = structuredClone(currentJourney(save).active);
  save = finishActive(save);
  assert.equal(currentJourney(save).lastResult.mission.id, olderBookmark.mission.id);
  assert.deepEqual(currentJourney(save).lastResult.answers[0], olderBookmark.answers[0]);
  assert.equal(currentJourney(save).lastResult.helped, 1);
  assert.deepEqual(currentJourney(save).earned, ['body']);
  assert.equal(currentJourney(save).charges, 1);
  assert.deepEqual(save.explorers['explorer-1'], explorerOne);
  assert.deepEqual(save.explorers['explorer-3'], explorerThree);

  save = act(save, { type: 'explorer', id: 'explorer-1' });
  save = act(save, { type: 'grade', id: 'class-1' });
  const flight = currentJourney(save).flight;
  save = act(save, { type: 'arrive', flightId: flight.id, destination: flight.destination });
  assert.deepEqual(currentJourney(save).visits, ['earth']);
  for (const field of ['earned', 'fitted', 'paint', 'charges', 'completed', 'history', 'lastResult']) {
    assert.deepEqual(currentJourney(save)[field], flightJourney[field]);
  }
  assert.strictEqual(act(save, { type: 'arrive', flightId: flight.id, destination: flight.destination }), save);
});

test('bank 2 and bank 3 rewards coexist with all original-bank completions and the saved flight', () => {
  for (const contentVersion of [2, 3]) {
    let save = validateSave(oldSave());
    const original = structuredClone(originalFlightJourney(save));
    const otherExplorers = [structuredClone(save.explorers['explorer-2']), structuredClone(save.explorers['explorer-3'])];
    const mission = createMission({ grade: 'class-1', chapter: 'operations', seed: 'compat-new-bank', contentVersion });
    assert.equal(mission.contentVersion, contentVersion);
    assert.match(mission.id, new RegExp(`^m${contentVersion}:class-1:`));
    assert.ok(mission.questions.every(question => question.id.startsWith(`q${contentVersion}-class-1-`)));
    save = finishActive(act(save, { type: 'start', mission }));
    const journey = currentJourney(save);
    assert.deepEqual(journey.completed, [...original.completed, mission.id]);
    assert.equal(journey.charges, original.charges + 1);
    for (const field of ['earned', 'fitted', 'paint', 'flight', 'visits']) {
      assert.deepEqual(journey[field], original[field]);
    }
    assert.deepEqual(journey.history.slice(0, -1), original.history);
    assert.equal(journey.lastResult.mission.contentVersion, contentVersion);
    assert.deepEqual(save.explorers['explorer-2'], otherExplorers[0]);
    assert.deepEqual(save.explorers['explorer-3'], otherExplorers[1]);
  }
});

test('legacy skills use their own chapter definitions and malformed attempts fail before dereferencing', () => {
  const save = oldSave();
  const legacy = createMission({ grade: 'class-1', chapter: 'geometry', level: 1, seed: 'compat-old-position', contentVersion: 1 });
  const question = legacy.questions.find(item => item.skill === 'position');
  assert.ok(question, 'The frozen mission contains a legacy position question.');
  assert.ok(!getChapter('class-1', 'geometry').skills.includes(question.skill));
  originalFlightJourney(save).attempts.push({
    id: question.id, skill: question.skill, chapter: question.chapter, level: question.level,
    correct: true, hinted: false, at,
  });
  assert.doesNotThrow(() => validateSave(save));

  const wrongBank = structuredClone(save);
  originalFlightJourney(wrongBank).attempts.at(-1).id = question.id.replace(/^q1-/, 'q2-');
  assert.throws(() => validateSave(wrongBank), /saved skill result/);
  for (const invalid of [null, false, 'not an attempt']) {
    const broken = oldSave();
    originalFlightJourney(broken).attempts.push(invalid);
    assert.throws(() => validateSave(broken), /saved skill result/);
  }
  for (const prefix of ['m0', 'm3', 'm21']) {
    const broken = oldSave();
    originalFlightJourney(broken).completed[0] = originalFlightJourney(broken).completed[0].replace(/^m1/, prefix);
    assert.throws(() => validateSave(broken), /mission-completion history/);
  }
});

test('old evidence stays in history but is excluded from current skill reports and recommendations', () => {
  const journey = originalFlightJourney(oldSave());
  assert.ok(journey.attempts.length > 5);
  for (const skill of new Set(journey.attempts.map(attempt => attempt.skill))) {
    const report = skillReport(journey, skill, 1);
    assert.equal(report.count, 0);
    assert.equal(report.helped, 0);
    assert.equal(report.status, 'Gathering evidence');
    assert.equal(report.practiceFocus, null);
  }
  assert.ok(journey.attempts.every(attempt => !isCurrentAttempt(attempt)));
  const oldOnly = blankJourney();
  for (const chapter of GRADES.find(grade => grade.id === 'class-1').chapters) {
    const count = chapter.id === 'patterns' ? 1 : 8;
    const skill = getChapter('class-1', chapter.id, 1).skills[0];
    for (let index = 0; index < count; index++) oldOnly.attempts.push({
      id: `q1-class-1-${skill}-${chapter.id}${index}`, chapter: chapter.id, skill, level: 1,
      correct: true, hinted: false, at,
    });
  }
  assert.equal(recommendChapter('class-1', oldOnly, 1).chapter.id, 'numbers');
  assert.equal(journey.history.length, 6);
});

const evidence = (index, extra = {}) => ({
  id: `q2-class-1-mystery-${index.toString(36)}`, contentVersion: 2,
  chapter: 'operations', skill: 'mystery', level: 2, correct: false, hinted: false,
  misconception: 'missing-step', at, ...extra,
});

test('practice focuses need repeated independent evidence and reports keep their unique, level-specific twenty-question limit', () => {
  const journey = { attempts: [...originalFlightJourney(oldSave()).attempts, ...Array.from({ length: 4 }, (_, index) => evidence(index))] };
  let report = skillReport(journey, 'mystery', 2);
  assert.equal(report.count, 4);
  assert.equal(report.status, 'Gathering evidence');
  assert.equal(report.practiceFocus, null);
  journey.attempts.push(evidence(4, { correct: true, misconception: undefined }));
  journey.attempts.push(evidence(5, { hinted: true }));
  journey.attempts.push(evidence(6, { level: 1 }));
  report = skillReport(journey, 'mystery', 2);
  assert.equal(report.count, 5);
  assert.equal(report.correct, 1);
  assert.equal(report.helped, 1);
  assert.equal(report.practiceFocus.code, 'missing-step');
  assert.equal(report.practiceFocus.count, 4);

  const sparse = { attempts: [evidence(0), evidence(1), ...[2, 3, 4].map(index => evidence(index, { correct: true, misconception: undefined }))] };
  assert.equal(skillReport(sparse, 'mystery', 2).practiceFocus, null);
  const repeats = { attempts: Array.from({ length: 6 }, () => evidence(0)) };
  assert.equal(skillReport(repeats, 'mystery', 2).count, 1);
  assert.equal(skillReport(repeats, 'mystery', 2).practiceFocus, null);

  const recent = { attempts: Array.from({ length: 25 }, (_, index) => evidence(index, {
    correct: index >= 5, misconception: index < 5 ? 'missing-step' : undefined,
  })) };
  report = skillReport(recent, 'mystery', 2);
  assert.equal(report.count, 20);
  assert.equal(report.correct, 20);
  assert.equal(report.practiceFocus, null);
  assert.deepEqual(report.trend, { recent: 5, previous: 5 });
});

test('a bank 2 or 3 incorrect first choice records only a known optional focus code and a repeated question replaces it', () => {
  for (const contentVersion of [2, 3]) {
    const mission = createMission({ grade: 'class-1', chapter: 'operations', level: 2, seed: 'compat-choice-feedback', contentVersion });
    const question = mission.questions[0];
    const choice = question.feedback.findIndex((feedback, index) => index !== question.correctIndex && feedback?.code);
    assert.ok(choice >= 0);
    const code = question.feedback[choice].code;
    assert.ok(Object.hasOwn(MISCONCEPTIONS, code));
    let save = act(oldSave(), { type: 'start', mission });
    save = act(save, { type: 'answer', missionId: mission.id, choice });
    let attempt = currentJourney(save).attempts.find(item => item.id === question.id);
    assert.equal(attempt.misconception, code);
    assert.equal(attempt.contentVersion, contentVersion);
    for (const invalid of ['not-a-known-code', 'toString']) {
      const broken = structuredClone(save);
      currentJourney(broken).attempts.find(item => item.id === question.id).misconception = invalid;
      assert.throws(() => validateSave(broken), /practice-focus code/);
    }
    const inconsistent = structuredClone(save);
    currentJourney(inconsistent).attempts.find(item => item.id === question.id).contentVersion = 1;
    assert.throws(() => validateSave(inconsistent), /inconsistent question-bank version/);

    save = act(save, { type: 'start', mission, replace: true });
    save = act(save, { type: 'answer', missionId: mission.id, choice: question.correctIndex });
    const matching = currentJourney(save).attempts.filter(item => item.id === question.id && item.level === question.level);
    assert.equal(matching.length, 1);
    [attempt] = matching;
    assert.equal(attempt.correct, true);
    assert.equal(Object.hasOwn(attempt, 'misconception'), false);
  }
});

test('explicit-bank links reproduce every bank and pre-change seeded links still select the original bank', () => {
  for (const contentVersion of [1, 2, 3]) {
    for (const mode of ['chapter', 'mixed', 'paper']) {
      const mission = createMission({
        grade: 'class-5', chapter: mode === 'chapter' ? 'fractions' : null,
        level: 2, mode, seed: `compat-link-${contentVersion}`, contentVersion,
      });
      const link = new URL(gameLink(mission), 'https://otterlygames.com');
      assert.equal(link.searchParams.get('bank'), String(contentVersion));
      const request = readMissionLink(link.search);
      assert.equal(request.contentVersion, contentVersion);
      assert.deepEqual(createMission(request), mission);
    }
  }
  const legacy = oldSave().explorers['explorer-1'].journeys.pp1.active.mission;
  const beforeBankField = new URL(gameLink(legacy), 'https://otterlygames.com');
  beforeBankField.searchParams.delete('bank');
  assert.deepEqual(createMission(readMissionLink(beforeBankField.search)), legacy);
  assert.equal(readMissionLink('?grade=class-1&chapter=numbers').contentVersion, 3);
  assert.equal(readMissionLink('?grade=class-1&chapter=numbers&bank=2').contentVersion, 2);
  assert.equal(readMissionLink('?grade=class-1&chapter=numbers&bank=1').contentVersion, 1);
  assert.equal(readMissionLink(''), null);

  const replacement = createMission(readMissionLink(beforeBankField.search));
  let save = act(oldSave(), { type: 'grade', id: 'pp1' });
  save = act(save, { type: 'start', mission: replacement, replace: true });
  assert.equal(currentJourney(save).active.mission.contentVersion, 1);
  assert.deepEqual(currentJourney(save).active.mission, legacy);
});

test('unknown banks and repeated or unrecognised link fields are rejected, never silently substituted', () => {
  for (const contentVersion of [0, 4, 21]) {
    assert.throws(() => gameLink({ grade: 'class-1', chapter: 'numbers', contentVersion }), /Unsupported/);
    assert.throws(() => createMission({ grade: 'class-1', chapter: 'numbers', seed: 'compat-unknown', contentVersion }), /Unsupported/);
  }
  for (const search of ['?bank=0', '?bank=4', '?bank=', '?bank=01', '?bank=2&bank=2', '?bank=1&bank=2', '?seed=a&seed=b', '?grade=pp1&grade=pp2', '?name=private']) {
    assert.throws(() => readMissionLink(search), /Unsupported|Unrecognised or repeated/);
  }
  assert.throws(() => readMissionLink('?grade=pp1&mode=paper&bank=1'), /not exam/);
  assert.throws(() => readMissionLink('?mode=mixed&chapter=numbers&bank=2'), /chapter setting/);
});

test('picture answers show and speak descriptions, never their internal semantic keys; legacy shapes keep their names', () => {
  const question = createMission({
    grade: 'class-2', chapter: 'geometry', level: 2, seed: 'compat-picture-choices',
  }).questions.find(item => item.optionVisuals?.some(Boolean));
  assert.ok(question, 'The current geometry mission includes graphical choices.');
  const shown = structuredClone(question);
  shown.optionVisuals.forEach((visual, index) => {
    if (visual) shown.options[index] = `PRIVATE-KEY-${index}-<unsafe>`;
  });
  for (const [index, visual] of shown.optionVisuals.entries()) {
    if (!visual) continue;
    assert.equal(choiceLabel(shown, index), `Picture ${String.fromCharCode(65 + index)}`);
    assert.ok(choiceDescription(shown, index).includes(visual.description));
    const html = answerChoice(shown, index);
    assert.ok(html.includes(escapeHTML(choiceLabel(shown, index))));
    assert.ok(html.includes(escapeHTML(visual.description)));
    assert.match(html, /<svg[^>]*role="img"/);
    assert.doesNotMatch(html, /PRIVATE-KEY/);
    assert.doesNotMatch(html, /<div/);
  }
  const spoken = questionReadAloud(shown);
  assert.ok(spoken.includes(shown.prompt));
  if (shown.visual) assert.ok(spoken.includes(shown.visual.description));
  assert.doesNotMatch(spoken, /PRIVATE-KEY/);

  const plain = { prompt: 'Choose a comparison.', options: ['2 < 3 & 4 > 1'] };
  assert.equal(choiceDescription(plain, 0), plain.options[0]);
  assert.match(answerChoice(plain, 0), /2 &lt; 3 &amp; 4 &gt; 1/);
  const legacy = { options: ['circle', 'square'], optionKind: 'shape' };
  assert.equal(choiceLabel(legacy, 1), 'square');
  assert.equal(choiceDescription(legacy, 1), 'square');
  assert.match(answerChoice(legacy, 1), /<svg/);
  assert.doesNotMatch(answerChoice(legacy, 1), /Picture B/);
  assert.throws(() => choiceDescription({ options: ['private'], optionVisuals: [{ kind: 'v2-reasoning-grid' }] }, 0), /needs a description/);
});

test('all eight original diagram kinds remain renderable beside the new bank renderers', () => {
  const visuals = [
    { kind: 'objects', groups: [{ label: 'A', count: 2, symbol: 'star' }] },
    { kind: 'sequence', items: ['circle', 'square'], numbered: true },
    { kind: 'shape', shape: 'triangle' },
    { kind: 'bars', rows: [{ label: 'A', value: 3 }, { label: 'B', value: 2 }] },
    { kind: 'pictograph', scale: 2, rows: [{ label: 'A', value: 3 }] },
    { kind: 'fraction', numerator: 2, denominator: 6 },
    { kind: 'clock', hour: 3, minute: 20 },
    { kind: 'arrows', items: ['right', 'left'], mirror: true },
  ];
  for (const visual of visuals) assert.match(diagram(visual), /class="sa-picture/);
});
