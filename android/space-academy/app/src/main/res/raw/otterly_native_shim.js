// Injected before the game's own scripts (and re-injected on page start on old WebViews). It publishes
// window.OtterlyNative, the contract read by js/space-academy/pitstop/fuel-bridge.mjs:
//   rewardedAd: { available(): Promise<boolean>, show(): Promise<{ rewarded: boolean }> }
//   billing:    { products(): Promise<{ id, price }[]>, buy(id): Promise<{ ok: boolean }>, restore(): Promise<{ ids: string[] }> }
//   tts:        { speak(text): Promise<{ ok: boolean }>, stop(): Promise<boolean> }   (text capped at 600 characters)
// Every promise resolves; a native error, timeout or missing host becomes rewarded:false / ok:false / [] / false.
(() => {
  'use strict';
  const root = globalThis;
  if (root.OtterlyNative) return;

  const token = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('') || 'page';
  const pending = new Map();
  let nextId = 1;

  const strings = list => (Array.isArray(list) ? list.filter(item => typeof item === 'string') : []);

  function send(method, arg, fallback, timeoutMs, normalise) {
    return new Promise(resolve => {
      const id = nextId++;
      let timer = 0;
      const finish = value => {
        if (!pending.delete(id)) return;
        if (timer) clearTimeout(timer);
        resolve(value);
      };
      pending.set(id, { finish, fallback, normalise });
      if (timeoutMs) timer = setTimeout(() => finish(fallback), timeoutMs);
      try {
        const host = root.OtterlyNativeHost;
        if (!host || typeof host.request !== 'function') {
          finish(fallback);
          return;
        }
        host.request(JSON.stringify({ token, id, method, arg: arg ?? null }));
      } catch {
        finish(fallback);
      }
    });
  }

  // Called by the Android host with the page token, request id and a JSON value.
  function settle(pageToken, id, value) {
    if (pageToken !== token) return;
    const entry = pending.get(id);
    if (!entry) return;
    let result;
    try { result = entry.normalise(value); } catch { result = entry.fallback; }
    entry.finish(result);
  }

  const api = Object.freeze({
    rewardedAd: Object.freeze({
      available: () => send('rewardedAd.available', null, false, 6000, value => value === true),
      show: () => send('rewardedAd.show', null, { rewarded: false }, 600000, value => ({ rewarded: value?.rewarded === true })),
    }),
    billing: Object.freeze({
      products: () => send('billing.products', null, [], 20000, value => (Array.isArray(value) ? value : [])
        .filter(item => item && typeof item.id === 'string' && typeof item.price === 'string' && item.price)
        .map(item => ({ id: item.id, price: item.price }))),
      buy: id => (typeof id === 'string' && id
        ? send('billing.buy', id, { ok: false }, 900000, value => ({ ok: value?.ok === true }))
        : Promise.resolve({ ok: false })),
      restore: () => send('billing.restore', null, { ids: [] }, 30000, value => ({ ids: strings(value?.ids) })),
    }),
    // Read-aloud through Android TextToSpeech; read by js/space-academy/pitstop/tts.mjs. Text is capped at 600 characters.
    tts: Object.freeze({
      speak: text => (typeof text === 'string' && text.trim()
        ? send('tts.speak', text.slice(0, 600), { ok: false }, 8000, value => ({ ok: value?.ok === true }))
        : Promise.resolve({ ok: false })),
      stop: () => send('tts.stop', null, false, 3000, value => value === true),
    }),
  });

  try {
    Object.defineProperty(root, '__otterlyNativeSettle', { value: settle });
    Object.defineProperty(root, 'OtterlyNative', { value: api, enumerable: true });
  } catch {
    // A page that already defined these names keeps them; the game then simply sees no native host.
  }
})();
