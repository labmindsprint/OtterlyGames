import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { adReady, sources, watchAd } from '../js/space-academy/pitstop/fuel-bridge.mjs';

const SHIM = readFileSync(new URL('../android/space-academy/app/src/main/res/raw/otterly_native_shim.js', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

// A page with the injected shim and a scriptable stand-in for the Kotlin host. `reply(request)` returns the value the
// host would settle with, `undefined` to never answer, or throws to simulate a broken bridge.
function page(reply) {
  const timers = [];
  const calls = [];
  const context = vm.createContext({
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    clearTimeout: id => { if (timers[id - 1]) timers[id - 1].fn = null; },
  });
  if (reply) {
    context.OtterlyNativeHost = {
      request(payload) {
        const request = JSON.parse(payload);
        calls.push(request);
        const value = reply(request);
        if (value !== undefined) queueMicrotask(() => context.__otterlyNativeSettle(request.token, request.id, value));
      },
    };
  }
  vm.runInContext(SHIM, context);
  return { context, timers, calls, native: context.OtterlyNative };
}

test('window.OtterlyNative exposes exactly the contract fuel-bridge.mjs and tts.mjs expect', () => {
  const { native } = page(() => true);
  assert.deepEqual(Object.keys(native).sort(), ['billing', 'rewardedAd', 'tts']);
  assert.deepEqual(Object.keys(native.tts).sort(), ['speak', 'stop']);
  assert.deepEqual(Object.keys(native.rewardedAd).sort(), ['available', 'show']);
  assert.deepEqual(Object.keys(native.billing).sort(), ['buy', 'products', 'restore']);
  assert.equal(Object.isFrozen(native), true);
});

test('available is true only when the host says exactly true', async () => {
  assert.equal(await page(() => true).native.rewardedAd.available(), true);
  assert.equal(await page(() => false).native.rewardedAd.available(), false);
  assert.equal(await page(() => 'true').native.rewardedAd.available(), false);
});

test('show resolves rewarded:true only for a completed ad and never throws', async () => {
  assert.deepEqual(plain(await page(() => ({ rewarded: true })).native.rewardedAd.show()), { rewarded: true });
  assert.deepEqual(plain(await page(() => ({ rewarded: false })).native.rewardedAd.show()), { rewarded: false });
  assert.deepEqual(plain(await page(() => ({ rewarded: 'yes' })).native.rewardedAd.show()), { rewarded: false });
  assert.deepEqual(plain(await page(() => { throw new Error('bridge down'); }).native.rewardedAd.show()), { rewarded: false });
});

test('products returns id and localised price pairs and drops malformed rows', async () => {
  const { native } = page(() => [
    { id: 'fuel-5', price: '₹49.00' }, { id: 'fuel-15', price: '' }, { id: 7, price: 'x' }, null, { id: 'remove-ads', price: '₹150.00', extra: 1 },
  ]);
  assert.deepEqual(plain(await native.billing.products()), [{ id: 'fuel-5', price: '₹49.00' }, { id: 'remove-ads', price: '₹150.00' }]);
  assert.deepEqual(plain(await page(() => 'nope').native.billing.products()), []);
});

test('tts.speak sends capped text, resolves ok only for ok:true, and never throws', async () => {
  const host = page(() => ({ ok: true }));
  assert.deepEqual(plain(await host.native.tts.speak('x'.repeat(900))), { ok: true });
  assert.equal(host.calls[0].method, 'tts.speak');
  assert.equal(host.calls[0].arg.length, 600);
  assert.deepEqual(plain(await host.native.tts.speak('   ')), { ok: false });
  assert.deepEqual(plain(await host.native.tts.speak(42)), { ok: false });
  assert.equal(host.calls.length, 1);
  assert.deepEqual(plain(await page(() => ({ ok: 'yes' })).native.tts.speak('hi')), { ok: false });
  assert.deepEqual(plain(await page(() => { throw new Error('x'); }).native.tts.speak('hi')), { ok: false });
  assert.equal(await page(() => true).native.tts.stop(), true);
  assert.equal(await page().native.tts.stop(), false);
});

test('buy sends the product id and resolves ok only for ok:true; bad ids never reach the host', async () => {
  const granted = page(request => ({ ok: request.arg === 'fuel-5' }));
  assert.deepEqual(plain(await granted.native.billing.buy('fuel-5')), { ok: true });
  assert.deepEqual(plain(await granted.native.billing.buy('fuel-15')), { ok: false });
  assert.deepEqual(plain(await granted.native.billing.buy(undefined)), { ok: false });
  assert.deepEqual(plain(await granted.native.billing.buy('')), { ok: false });
  assert.deepEqual(granted.calls.map(call => call.arg), ['fuel-5', 'fuel-15']);
  assert.deepEqual(plain(await page(() => { throw new Error('x'); }).native.billing.buy('fuel-5')), { ok: false });
});

test('restore returns only string ids', async () => {
  assert.deepEqual(plain(await page(() => ({ ids: ['remove-ads', 3, null] })).native.billing.restore()), { ids: ['remove-ads'] });
  assert.deepEqual(plain(await page(() => ({})).native.billing.restore()), { ids: [] });
});

test('without a native host every call resolves to its failure value', async () => {
  const { native } = page(null);
  assert.equal(await native.rewardedAd.available(), false);
  assert.deepEqual(plain(await native.rewardedAd.show()), { rewarded: false });
  assert.deepEqual(plain(await native.billing.products()), []);
  assert.deepEqual(plain(await native.billing.buy('fuel-5')), { ok: false });
  assert.deepEqual(plain(await native.billing.restore()), { ids: [] });
});

test('a host that never answers times out to the failure value, and a late answer is ignored', async () => {
  const { native, timers, context, calls } = page(() => undefined);
  const wait = native.rewardedAd.available();
  const buying = native.billing.buy('fuel-5');
  assert.deepEqual(timers.map(timer => timer.ms), [6000, 900000]);
  timers[0].fn();
  timers[1].fn();
  assert.equal(await wait, false);
  assert.deepEqual(plain(await buying), { ok: false });
  context.__otterlyNativeSettle(calls[1].token, calls[1].id, { ok: true });
});

test('answers carrying another page token or an unknown id are ignored', async () => {
  const { native, context, calls } = page(() => undefined);
  const pending = native.billing.restore();
  const { token, id } = calls[0];
  context.__otterlyNativeSettle('otherpage', id, { ids: ['remove-ads'] });
  context.__otterlyNativeSettle(token, id + 99, { ids: ['remove-ads'] });
  context.__otterlyNativeSettle(token, id, { ids: ['remove-ads'] });
  assert.deepEqual(plain(await pending), { ids: ['remove-ads'] });
});

test('injecting twice keeps the first bridge, and the page cannot overwrite it', () => {
  const { context, native } = page(() => true);
  vm.runInContext(SHIM, context);
  assert.equal(context.OtterlyNative, native);
  vm.runInContext("'use strict'; try { OtterlyNative = {}; } catch {}", context);
  assert.equal(context.OtterlyNative, native);
});

test('the real fuel-bridge reads the injected bridge for ads', async () => {
  const { context } = page(request => (request.method === 'rewardedAd.available' ? true : { rewarded: true }));
  globalThis.window = context;
  globalThis.location = { search: '', hostname: 'appassets.androidplatform.net' };
  try {
    assert.equal(sources().native, true);
    assert.equal(await adReady(), true);
    assert.equal(await watchAd(), true);
  } finally {
    delete globalThis.window;
    delete globalThis.location;
  }
});
