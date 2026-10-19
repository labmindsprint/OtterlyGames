import assert from 'node:assert/strict';
import test from 'node:test';
import { blankClass, blankSave } from '../js/space-academy/pitstop/progress.mjs';
import { DAILY_FREE, MAX_ADS, applyAdFuel, applyBoughtFuel, applySpend, applyUnlimited, fuelStatus } from '../js/space-academy/pitstop/fuel.mjs';
import { verifyCode } from '../js/space-academy/pitstop/fuel-bridge.mjs';

const day = (d, h = 10) => new Date(2030, 0, d, h);
const withRuns = (runs = 1) => { const save = blankSave(); save.classes['class-2'] = { ...blankClass(), paperRuns: runs }; return save; };

test('the first mock test of a class is free and never burns fuel', () => {
  const save = withRuns(0);
  assert.equal(fuelStatus(save, 'class-2', day(1)).canStart, true);
  assert.equal(applySpend(save, 'class-2', day(1)), save);
});

test('two free fuel a day, then two ads, then nothing', () => {
  let save = withRuns();
  for (let i = 0; i < DAILY_FREE; i += 1) save = applySpend(save, 'class-2', day(1));
  assert.equal(fuelStatus(save, 'class-2', day(1)).canStart, false);
  for (let i = 0; i < MAX_ADS; i += 1) {
    save = applyAdFuel(save, day(1));
    assert.equal(fuelStatus(save, 'class-2', day(1)).canStart, true);
    save = applySpend(save, 'class-2', day(1));
  }
  assert.equal(fuelStatus(save, 'class-2', day(1)).adsLeft, 0);
  assert.throws(() => applyAdFuel(save, day(1)));
  assert.throws(() => applySpend(save, 'class-2', day(1)));
});

test('a new day refills the tank and the ad count, but a clock set back does not', () => {
  let save = withRuns();
  for (let i = 0; i < DAILY_FREE; i += 1) save = applySpend(save, 'class-2', day(5));
  assert.equal(fuelStatus(save, 'class-2', day(4)).canStart, false);
  assert.equal(fuelStatus(save, 'class-2', day(5, 23)).canStart, false);
  assert.equal(fuelStatus(save, 'class-2', day(6)).daily, DAILY_FREE);
});

test('bought fuel is spent after the daily tank and never expires', () => {
  let save = applyBoughtFuel(withRuns(), 3, day(1));
  for (let i = 0; i < DAILY_FREE + 3; i += 1) save = applySpend(save, 'class-2', day(1));
  assert.equal(fuelStatus(save, 'class-2', day(1)).canStart, false);
  save = applyBoughtFuel(save, 5, day(1));
  assert.equal(fuelStatus(save, 'class-2', day(30)).available, DAILY_FREE + 5);
});

test('unlimited fuel skips the tank and the ads', () => {
  const save = applyUnlimited(withRuns(), 'code');
  assert.equal(fuelStatus(save, 'class-2', day(1)).adsLeft, 0);
  assert.equal(applySpend(save, 'class-2', day(1)), save);
});

test('supporter codes must be signed by the Otterly key', async () => {
  assert.equal(await verifyCode(''), null);
  assert.equal(await verifyCode('T1RUMXx1bmxpbWl0ZWR8QW5u.AAAA'), null);
  assert.equal(await verifyCode('not a code'), null);
});
