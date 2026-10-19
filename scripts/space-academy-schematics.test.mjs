import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CLASSES } from '../js/space-academy/pitstop/data.mjs';
import { GEAR_ORDER } from '../js/space-academy/pitstop/gear.mjs';
import * as progress from '../js/space-academy/pitstop/progress.mjs';
import {
  CARGO_CAP, CATALOGUE, HINT_CARGO, HINT_FIND, HINT_SHIP, PRINT_PASS, PRINT_QUESTIONS, cargoList, lockHint, nextSchematic, printGate,
} from '../js/space-academy/pitstop/schematics.mjs';
import { printTestMission } from '../js/space-academy/pitstop/missions.mjs';
import { mockCost, nextAction } from '../js/space-academy/pitstop/next.mjs';
import { applySpend, fuelStatus } from '../js/space-academy/pitstop/fuel.mjs';

const info = CLASSES.find(item => item.id === 'class-3') ?? CLASSES[3];
const id = info.id;
const right = (n, total = 10) => Array.from({ length: total }, (_, i) => ({ chapter: 'c', correct: i < n }));

const built = () => {
  let save = progress.blankSave();
  for (const part of info.parts) save = progress.applyPart(save, id, part.id, [{ chapter: info.parts[0].chapters[0], correct: true }]);
  return save;
};

const withCargo = (save, items) => {
  const draft = structuredClone(save);
  draft.classes[id].cargo = items;
  return draft;
};

test('the catalogue has no duplicates and covers every gear, paint and sticker', () => {
  const keys = CATALOGUE.map(item => `${item.kind}:${item.id}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(CATALOGUE.filter(item => item.kind === 'gear').map(item => item.id), GEAR_ORDER);
  assert.ok(CATALOGUE.some(item => item.kind === 'paint') && CATALOGUE.some(item => item.kind === 'sticker'));
  assert.deepEqual(CATALOGUE.slice(0, 1), [{ kind: 'gear', id: GEAR_ORDER[0] }]);
});

test('roam drops are schematics: never owned, never duplicated, capped by the cargo hold', () => {
  let save = built();
  const seen = new Set();
  for (let drop = 0; drop < CARGO_CAP; drop += 1) {
    const item = progress.nextPickup(save, id);
    assert.ok(item, `drop ${drop}`);
    assert.ok(!seen.has(`${item.kind}:${item.id}`), 'no duplicate drops');
    seen.add(`${item.kind}:${item.id}`);
    save = progress.applyPickup(save, id);
  }
  assert.equal(progress.cargoOf(save, id).length, CARGO_CAP);
  assert.equal(progress.nextPickup(save, id), null, 'a full hold drops nothing');
  assert.equal(progress.applyPickup(save, id), save, 'applyPickup on a full hold changes nothing');
  assert.equal(nextSchematic(built().classes[id], CARGO_CAP), null);
  assert.notDeepEqual(nextSchematic(built().classes[id], 0), nextSchematic(built().classes[id], 1), 'reserved drops are skipped');
});

test('a Print test needs 7 of 10: 6 prints nothing and loses nothing, 7 prints the whole hold once', () => {
  let save = built();
  for (let drop = 0; drop < 4; drop += 1) save = progress.applyPickup(save, id);
  const hold = progress.cargoOf(save, id);
  assert.equal(hold.length, 4);

  const failed = progress.applyPrintTest(save, id, 6, right(6));
  assert.deepEqual(progress.cargoOf(failed, id), hold, 'nothing lost');
  assert.equal(progress.gearOf(failed, id).length, 0);
  assert.equal(failed.classes[id].printed, 0);
  assert.ok(failed.revision > save.revision);

  const passed = progress.applyPrintTest(failed, id, PRINT_PASS, right(7));
  assert.deepEqual(progress.cargoOf(passed, id), [], 'the hold is empty');
  assert.equal(passed.classes[id].printed, 4);
  for (const item of hold) {
    if (item.kind === 'gear') assert.ok(passed.classes[id].gear.includes(item.id));
    if (item.kind === 'paint') assert.ok(passed.classes[id].paints.includes(item.id));
    if (item.kind === 'sticker') assert.ok(passed.classes[id].unlockedStickers.includes(item.id));
  }
  const again = progress.applyPrintTest(passed, id, 10, right(10));
  assert.equal(again.classes[id].printed, 4, 'no double printing');
  assert.equal(new Set(again.classes[id].gear).size, again.classes[id].gear.length);
  assert.equal(PRINT_PASS, 7);
  assert.equal(PRINT_QUESTIONS, 10);
});

test('printed gear is installed by the loadout rules: 2 turrets, 1 shield', () => {
  const save = withCargo(built(), GEAR_ORDER.slice(0, 6).map(gear => ({ kind: 'gear', id: gear })));
  const printed = progress.applyPrintTest(save, id, 10, right(10));
  const load = progress.loadoutOf(printed, id);
  assert.ok(load.turrets.length <= progress.MAX_TURRETS);
  assert.ok(load.shield);
  assert.equal(progress.gearOf(printed, id).length, 6);
});

test('a mock test launches and nothing more; old cargo objects stay schematics', () => {
  let save = built();
  save = withCargo(save, [{ kind: 'paint', id: CATALOGUE.find(item => item.kind === 'paint').id }, { kind: 'bogus', id: 'x' }, null]);
  const paint = CATALOGUE.find(item => item.kind === 'paint');
  save = progress.applyPaperEnd(save, id, 20, []);
  assert.equal(progress.launchReady(save, id), info.sky[0]);
  assert.deepEqual(progress.cargoOf(save, id), [{ kind: 'paint', id: paint.id }], 'junk is dropped, the old reward stays');
  assert.equal(progress.gearOf(save, id).length, 0);
  assert.equal(save.classes[id].printed, 0);
});

test('Print test gate and lock hints say exactly what to do', () => {
  const open = built();
  assert.deepEqual(printGate(open.classes[id], true), { ok: false, count: 0, reason: 'Nothing to print yet. Find schematics in free roam.' });
  assert.deepEqual(printGate(progress.blankSave().classes[id] ?? progress.blankClass(), false).reason, 'Finish your rocket to unlock free roam.');
  const held = progress.applyPickup(open, id);
  assert.equal(printGate(held.classes[id], true).ok, true);
  const item = progress.cargoOf(held, id)[0];
  assert.equal(lockHint(held.classes[id], item, true), HINT_CARGO);
  assert.equal(lockHint(open.classes[id], item, true), HINT_FIND);
  assert.equal(lockHint(open.classes[id], item, false), HINT_SHIP);
  assert.equal(HINT_FIND, 'Find its schematic in free roam');
  assert.equal(HINT_SHIP, 'Finish your rocket first to unlock free roam');
  assert.equal(HINT_CARGO, 'Schematic in cargo: take a Print test to print it');
});

test('a print test mixes 10 questions across the chapters', () => {
  for (const klass of CLASSES) {
    const mission = printTestMission(klass.id, 'seed-a');
    assert.equal(mission.kind, 'printtest');
    assert.equal(mission.questions.length, PRINT_QUESTIONS, klass.id);
    assert.ok(new Set(mission.questions.map(question => question.chapter)).size >= 3, `${klass.id} mixes chapters`);
  }
});

test('print tests always cost 1 fuel; only the first launch mock is free', () => {
  const save = built();
  assert.equal(fuelStatus(save, id).firstFree, true);
  assert.equal(fuelStatus(save, null).firstFree, false);
  const spent = applySpend(save, null);
  assert.equal(fuelStatus(spent, null).daily, fuelStatus(save, null).daily - 1);
  assert.equal(mockCost(save, id).short, 'free first try');
  const ran = progress.applyPaperEnd(save, id, 5, []);
  assert.match(mockCost(ran, id).button, /1 fuel/);
});

test('journey copy: weld, mock to launch, free roam for schematics, print test', () => {
  const welding = nextAction(progress.blankSave(), id);
  assert.match(welding.sub, /Mock test 1 of 10 to launch/);
  const mock = nextAction(built(), id);
  assert.match(mock.sub, /Mock test 1 of 10 to launch/);
  assert.match(mock.sub, /free first try/);
  assert.doesNotMatch(JSON.stringify([welding, mock]), /printer|prize|finish mock test/i);
});

test('old and new save shapes validate and keep owned items, cargo, launch, fuel and premium', () => {
  const old = built();
  Object.assign(old.classes[id], {
    gear: ['pulse-blaster'], loadout: { turrets: ['pulse-blaster'], shield: null },
    paints: ['cream', 'mint'], paint: 'mint', unlockedStickers: ['star'], printed: 3, paperRuns: 2,
    cargo: [{ kind: 'sticker', id: 'heart' }], launchReady: info.sky[0],
  });
  old.fuel = { day: '2026-01-01', used: 1, ads: 1, bank: 4 };
  old.premium = { unlimited: true };
  assert.doesNotThrow(() => progress.validateSave(old));

  const minimal = structuredClone(old);
  delete minimal.classes[id].cargo;
  delete minimal.classes[id].gear;
  assert.doesNotThrow(() => progress.validateSave(minimal), 'cargo and gear are optional');
  assert.deepEqual(progress.cargoOf(minimal, id), []);
  assert.throws(() => progress.validateSave({ ...old, classes: { [id]: { ...old.classes[id], cargo: 'x' } } }));

  const next = progress.applyPrintTest(old, id, 7, right(7));
  assert.deepEqual(next.fuel, old.fuel);
  assert.deepEqual(next.premium, old.premium);
  assert.equal(next.classes[id].launchReady, info.sky[0]);
  assert.equal(next.classes[id].paint, 'mint');
  assert.ok(next.classes[id].gear.includes('pulse-blaster'));
  assert.ok(next.classes[id].paints.includes('mint'));
  assert.ok(next.classes[id].unlockedStickers.includes('star'));
  assert.ok(next.classes[id].unlockedStickers.includes('heart'), 'the old cargo reward printed');
  assert.equal(next.classes[id].printed, 4);
  assert.equal(next.classes[id].paperRuns, 2);
  assert.doesNotThrow(() => progress.validateSave(next));
});

test('the home mock test result screen has no printing, prize or gear copy', () => {
  const source = readFileSync(new URL('../js/space-academy/pitstop/views.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('export function mockIntro');
  const end = source.indexOf('export async function launch', start);
  const section = source.slice(start, end);
  assert.ok(section.length > 500);
  assert.doesNotMatch(section, /printer|Winning prize|finds waiting|gearIcon|data-print/i);
  assert.match(section, /Unlocked:/);
  assert.match(section, /Start mock test · \$\{/);
  assert.equal(cargoList({ cargo: [{ kind: 'gear', id: GEAR_ORDER[0] }] }).length, 1);
});
