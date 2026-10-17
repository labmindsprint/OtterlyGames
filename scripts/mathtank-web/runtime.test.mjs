import assert from 'node:assert/strict';
import { cpSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import { prepareMathtankWeb } from '../prepare-mathtank-web.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const source = resolve(here, '..', '..', '..', 'Math Tank');
const ts = require(join(source, 'node_modules', 'typescript'));

function runtime(embedded = false) {
  let now = 0;
  let nextTimer = 1;
  const timers = new Map();
  const documentEvents = new Map();
  const windowEvents = new Map();
  const messages = [];
  const document = {
    hidden: false, documentElement: {},
    addEventListener: (name, fn) => documentEvents.set(name, fn),
    removeEventListener: name => documentEvents.delete(name),
  };
  const window = {
    location: { origin: 'https://example.test' },
    addEventListener: (name, fn) => windowEvents.set(name, fn),
    removeEventListener: name => windowEvents.delete(name),
  };
  window.parent = embedded ? { postMessage: data => messages.push(data) } : window;
  let intersect;
  const context = vm.createContext({
    document, window, performance: { now: () => now },
    IntersectionObserver: class {
      constructor(callback) { intersect = callback; }
      observe() {}
      disconnect() {}
    },
    setTimeout: (fn, delay) => {
      const id = nextTimer++;
      timers.set(id, { fn, at: now + delay });
      return id;
    },
    clearTimeout: id => timers.delete(id),
  });
  function load(name, imports) {
    const { outputText } = ts.transpileModule(readFileSync(join(here, name), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    const module = { exports: {} };
    const run = vm.runInContext(`(function(require, module, exports) { ${outputText}\n})`, context);
    run(id => {
      if (!(id in imports)) throw new Error(`Unexpected import ${id}`);
      return imports[id];
    }, module, module.exports);
    return module.exports;
  }
  const visibility = load('useAppVisibility.ts', { react: {} });
  const scheduling = load('websiteTimers.ts', { './useAppVisibility': visibility });
  const scoped = load('useWebsiteTimers.ts', {
    react: {}, './websiteTimers': scheduling, './useAppVisibility': visibility,
  });
  return {
    ...visibility, ...scheduling, ...scoped, messages,
    intersect: value => intersect([{ isIntersecting: value }]),
    hidden: value => { document.hidden = value; documentEvents.get('visibilitychange')?.(); },
    message: (type, origin = window.location.origin, source = window.parent) =>
      windowEvents.get('message')?.({ data: { type }, origin, source }),
    advance: ms => {
      const end = now + ms;
      while (true) {
        const next = [...timers.entries()].filter(([, value]) => value.at <= end)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].fn();
      }
      now = end;
    },
  };
}

test('gameplay delay freezes across document-hidden time and resumes its remaining delay', () => {
  const game = runtime();
  const unsubscribe = game.subscribeWebsiteVisibility(() => {});
  let completions = 0;
  game.scheduleWhenVisible(() => completions++, 100);
  game.advance(40);
  game.hidden(true);
  game.advance(1000);
  assert.equal(completions, 0);
  game.hidden(false);
  game.advance(59);
  assert.equal(completions, 0);
  game.advance(1);
  assert.equal(completions, 1);
  unsubscribe();
});

test('iframe starts paused, handshakes and requires intersection plus trusted parent resume', () => {
  const game = runtime(true);
  const unsubscribe = game.subscribeWebsiteVisibility(() => {});
  assert.equal(game.messages[0].type, 'mathReady');
  let completions = 0;
  game.scheduleWhenVisible(() => completions++, 100);
  game.intersect(true);
  game.message('resumeAudio', 'https://untrusted.test');
  game.advance(500);
  assert.equal(completions, 0);
  game.message('resumeAudio');
  game.advance(40);
  game.message('pauseAudio');
  game.advance(1000);
  assert.equal(completions, 0);
  game.message('resumeAudio');
  game.intersect(false);
  game.advance(1000);
  assert.equal(completions, 0);
  game.intersect(true);
  game.advance(60);
  assert.equal(completions, 1);
  unsubscribe();
});

test('cancelled paused callbacks cannot grant progress or run after returning home', () => {
  const game = runtime();
  const unsubscribe = game.subscribeWebsiteVisibility(() => {});
  let completions = 0;
  const timer = game.scheduleWhenVisible(() => completions++, 100);
  game.advance(20);
  game.hidden(true);
  timer.cancel();
  game.hidden(false);
  game.advance(1000);
  assert.equal(completions, 0);
  unsubscribe();
});

test('full-app scoped timeouts and intervals freeze, cancel on navigation, and use active time', () => {
  const game = runtime();
  const unsubscribe = game.subscribeWebsiteVisibility(() => {});
  const scoped = game.createWebsiteTimers();
  let ticks = 0;
  let completions = 0;
  scoped.setInterval(() => ticks++, 100);
  scoped.setTimeout(() => completions++, 150);
  game.advance(40);
  assert.equal(scoped.now(), 40);
  game.hidden(true);
  game.advance(1000);
  assert.equal(scoped.now(), 40);
  assert.equal(ticks, 0);
  game.hidden(false);
  game.advance(60);
  assert.equal(ticks, 1);
  assert.equal(completions, 0);
  game.advance(50);
  assert.equal(completions, 1);
  scoped.cancelAll();
  game.advance(1000);
  assert.equal(ticks, 1);
  unsubscribe();
});

test('reward and banner APIs explicitly return unavailable with no reward', async () => {
  const { outputText } = ts.transpileModule(readFileSync(join(here, 'adService.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const module = { exports: {} };
  vm.runInNewContext(`(function(require,module,exports){${outputText}\n})`)(() => ({
    GAME_CONFIG: { fuel: { maxAdsPerDay: 10, adCooldownMinutes: 5 } },
  }), module, module.exports);
  const ads = module.exports;
  for (const method of ['showRewardedAdForFuel', 'showRewardedAdForCoins', 'showRewardedAdForHint']) {
    const result = await ads[method]();
    assert.equal(result.success, false);
    assert.equal(result.reward, 0);
  }
  assert.equal(await ads.showBannerAd(), false);
  assert.equal(await ads.initializeAds(), false);
  assert.equal(ads.getUniverseAdStatus().canShow, false);
});

test('one-shot preparation guards delayed browser speech after pause and cancellation', async () => {
  const work = join(here, `.runtime-test-${process.pid}`);
  mkdirSync(work);
  try {
    cpSync(join(source, 'src'), join(work, 'src'), { recursive: true });
    cpSync(join(source, 'tailwind.config.js'), join(work, 'tailwind.config.js'));
    prepareMathtankWeb(work);
    assert.throws(() => prepareMathtankWeb(work), /already applied/);
    const { outputText } = ts.transpileModule(readFileSync(join(work, 'src', 'app', 'lib', 'ttsService.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    const pending = [];
    let paused = false;
    let spoken = 0;
    const module = { exports: {} };
    const imports = {
      '@capacitor/core': { Capacitor: { isNativePlatform: () => false } },
      './sound': { duckMusicForTTS() {}, restoreMusicAfterTTS() {} },
      './useAppVisibility': { isWebsitePaused: () => paused },
    };
    vm.runInNewContext(`(function(require,module,exports){${outputText}\n})`, {
      console: { log() {}, error() {}, warn() {} },
      window: { speechSynthesis: {
        getVoices: () => [], cancel() {},
        speak: utterance => { spoken++; utterance.onend?.(); },
      } },
      SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
      setTimeout: callback => pending.push(callback),
    })(id => {
      if (!(id in imports)) throw new Error(`Unexpected import ${id}`);
      return imports[id];
    }, module, module.exports);
    const tts = module.exports;
    await tts.initializeTTS();
    for (const method of ['speak', 'speakQuestion', 'speakFeedback']) {
      const cancelled = tts[method]('Hello world');
      await tts.stopSpeaking();
      pending.shift()();
      await cancelled;
      assert.equal(spoken, 0);
    }
    paused = true;
    const hidden = tts.speak('Not while hidden');
    pending.shift()();
    await hidden;
    assert.equal(spoken, 0);
    paused = false;
    const audible = tts.speak('Visible again');
    pending.shift()();
    await audible;
    assert.equal(spoken, 1);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
