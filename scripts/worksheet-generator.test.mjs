import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clockHandEndpoints,
  generateWorksheet,
  normalizeSettings,
  parseSettings,
  settingsToSearch,
} from '../js/worksheet-generator.mjs';

test('every table produces unique, correct products for factors 1–12', () => {
  for (let table = 2; table <= 12; table += 1) {
    const { questions } = generateWorksheet({ activity: 'multiplication', table, count: 12 });
    assert.equal(questions.length, 12);
    assert.equal(new Set(questions.map(question => question.id)).size, 12);
    assert.deepEqual(questions.map(question => question.right).sort((a, b) => a - b),
      Array.from({ length: 12 }, (_, index) => index + 1));
    for (const question of questions) {
      assert.equal(question.left, table);
      assert.equal(Number(question.answer), table * question.right);
    }
  }
});

test('every division sheet is exact, positive and bounded, without repeated questions', () => {
  for (let table = 2; table <= 12; table += 1) {
    const { questions } = generateWorksheet({ activity: 'division', table, count: 12, seed: 'division-check' });
    assert.equal(new Set(questions.map(question => question.prompt)).size, 12);
    for (const question of questions) {
      assert.equal(question.right, table);
      assert.ok(question.left > 0);
      assert.equal(question.left % question.right, 0);
      assert.ok(Number(question.answer) >= 1 && Number(question.answer) <= 12);
      assert.equal(Number(question.answer) * question.right, question.left);
    }
  }
});

test('clock answers match their hour/minute data and never duplicate within a sheet', () => {
  for (let index = 0; index < 50; index += 1) {
    for (const clock of ['hours', 'five-minutes']) {
      const { settings, questions } = generateWorksheet({
        activity: 'clock', clock, count: 20, seed: `clock-${index}`,
      });
      assert.equal(questions.length, clock === 'hours' ? 12 : 20);
      assert.equal(new Set(questions.map(question => question.answer)).size, questions.length);
      for (const question of questions) {
        assert.ok(question.hour >= 1 && question.hour <= 12);
        assert.ok(question.minute >= 0 && question.minute < 60);
        assert.equal(question.minute % (clock === 'hours' ? 60 : 5), 0);
        assert.equal(question.answer, `${question.hour}:${String(question.minute).padStart(2, '0')}`);
      }
      assert.equal(settings.count, questions.length);
    }
  }
});

test('a seed and its canonical share URL reproduce identical questions and answer order', () => {
  for (const activity of ['multiplication', 'division', 'clock']) {
    const settings = { activity, table: 9, clock: 'five-minutes', count: 10, seed: 'a-repeatable-code' };
    const original = generateWorksheet(settings);
    const fromLink = generateWorksheet(parseSettings(`?${settingsToSearch(settings)}`).settings);
    assert.deepEqual(fromLink.questions, original.questions);
    assert.deepEqual(generateWorksheet(settings).questions, original.questions);
    assert.notDeepEqual(generateWorksheet({ ...settings, seed: 'another-code' }).questions, original.questions);
  }
});

test('irrelevant settings cannot change a sheet reconstructed from its share link', () => {
  const clock = generateWorksheet({ activity: 'clock', table: 12, clock: 'hours', seed: 'same' });
  assert.deepEqual(clock.questions,
    generateWorksheet(parseSettings(settingsToSearch(clock.settings)).settings).questions);
  const math = generateWorksheet({ activity: 'multiplication', table: 4, clock: 'hours', seed: 'same' });
  assert.deepEqual(math.questions,
    generateWorksheet(parseSettings(settingsToSearch(math.settings)).settings).questions);
});

test('cardinal hands and fractional-hour movement use the same geometry as the rendered clocks', () => {
  const expected = [[12, 100, 55], [3, 145, 100], [6, 100, 145], [9, 55, 100]];
  for (const [hour, x2, y2] of expected) {
    const hands = clockHandEndpoints(hour, 0);
    assert.equal(hands.hour.x2, x2);
    assert.equal(hands.hour.y2, y2);
    assert.equal(hands.minute.x2, 100);
    assert.equal(hands.minute.y2, 38);
  }
  const halfPast = clockHandEndpoints(3, 30);
  assert.equal(halfPast.hour.angle, 105);
  assert.ok(halfPast.hour.x2 > 100 && halfPast.hour.y2 > 100);
  assert.equal(halfPast.minute.x2, 100);
  assert.equal(halfPast.minute.y2, 162);
  assert.equal(clockHandEndpoints(12, 15).hour.angle, 7.5);
  assert.throws(() => clockHandEndpoints(0, 0), RangeError);
  assert.throws(() => clockHandEndpoints(12, 60), RangeError);
});

test('invalid URL values are visibly reportable, canonical and unable to create unbounded sheets', () => {
  const invalid = parseSettings('?activity=unknown&table=0&clock=bad&count=999999999&seed=%3Cscript%3E&name=not-kept');
  assert.equal(invalid.settings.activity, 'multiplication');
  assert.equal(invalid.settings.table, 6);
  assert.equal(invalid.settings.count, 10);
  assert.equal(invalid.settings.seed, 'otterly-1');
  assert.ok(invalid.warnings.length >= 5);
  const canonical = settingsToSearch(invalid.settings);
  assert.equal(canonical, 'activity=multiplication&table=6&count=10&seed=otterly-1');
  assert.deepEqual(parseSettings(canonical).warnings, []);
  assert.equal(generateWorksheet({ count: Infinity }).questions.length, 10);
  for (const count of ['-1', '0', '5.0', '1000000', 'NaN']) {
    assert.equal(parseSettings(`?count=${count}`).settings.count, 10);
  }
  for (const table of ['0', '1', '13', '2.5', '02', '-2', 'Infinity']) {
    assert.equal(parseSettings(`?table=${table}`).settings.table, 6);
  }
  for (const seed of ['', 'has space', 'a'.repeat(33), '☀']) {
    assert.ok(parseSettings(`?seed=${encodeURIComponent(seed)}`).warnings.length > 0);
  }
});

test('duplicate, irrelevant and unknown URL settings are stripped without echoing their values', () => {
  const parsed = parseSettings('?activity=clock&activity=division&clock=hours&table=12&count=20&seed=valid&child=private-value');
  assert.equal(parsed.settings.activity, 'clock');
  assert.equal(parsed.settings.count, 12);
  assert.ok(parsed.warnings.some(message => message.includes('12 different')));
  assert.ok(parsed.warnings.some(message => message.includes('Repeated')));
  assert.ok(!parsed.warnings.join(' ').includes('private-value'));
  assert.equal(settingsToSearch(parsed.settings), 'activity=clock&clock=hours&count=12&seed=valid');
  assert.deepEqual(parseSettings(settingsToSearch(parsed.settings)).warnings, []);
});

test('counts beyond the fixed fact bank are capped with an explanation, not repeated questions', () => {
  for (const activity of ['multiplication', 'division']) {
    const sheet = generateWorksheet({ activity, table: 2, count: 20 });
    assert.equal(sheet.questions.length, 12);
    assert.equal(sheet.settings.count, 12);
    assert.ok(sheet.warnings.some(message => message.includes('no question repeats')));
  }
  assert.equal(normalizeSettings({ activity: 'clock', clock: 'five-minutes', count: 20 }).settings.count, 20);
});
