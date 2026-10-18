import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, '_data', 'web-ads.json'), 'utf8'));
const loader = readFileSync(join(root, 'js', 'web-game-ads.js'), 'utf8');
const provider = readFileSync(join(root, 'scripts', 'fixtures', 'web-ads-provider.js'), 'utf8');
const articlePath = config.placements.blogArticleEnd.paths[0];
const copy = value => structuredClone(value);

function element(tag = 'div') {
  return {
    tagName: tag.toUpperCase(), dataset: {}, style: {}, children: [], attributes: {}, listeners: {},
    get childElementCount() { return this.children.length; },
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    setAttribute(name, value) {
      this.attributes[name] = value;
      if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    },
    addEventListener(type, listener) { this.listeners[type] = listener; },
  };
}

function placement({ legacy = false, insideControls = false, unitCount = 1 } = {}) {
  const units = Array.from({ length: unitCount }, () => element());
  return {
    ...element('aside'), hidden: true, units,
    before(control) { this.control = control; },
    hasAttribute: name => name === (legacy ? 'data-web-game-ad' : 'data-editorial-ad'),
    closest: () => insideControls ? {} : null,
    querySelectorAll: selector => selector === '[data-web-ad-unit]' ? units : [],
    querySelector: selector => selector === '.editorial-ad-label'
      ? { textContent: 'Advertisement' } : ['ins', '[data-web-ad-unit]'].includes(selector) ? units[0] : null,
  };
}

async function run({
  path = articlePath, settings = config, containers = [placement()],
  status = 200, fetchError, jsonError, globalPrivacyControl = false,
} = {}) {
  const requests = [], scripts = [], errors = [], timers = new Map();
  let timerId = 0;
  const window = { ...element(), location: { pathname: path } };
  const document = {
    ...element(),
    querySelectorAll: () => containers,
    querySelector: selector => selector === '[data-web-ad-unit] > ins' ? containers[0]?.units[0]?.children[0] : null,
    createElement: element,
    head: { append: script => scripts.push(script) },
    body: element('body'),
    hidden: false,
  };
  const context = {
    window, document,
    navigator: { globalPrivacyControl },
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
    clearTimeout: id => timers.delete(id),
    console: { error: message => errors.push(message), warn() {} },
    MutationObserver: class { observe() {} disconnect() {} },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (fetchError) throw fetchError;
      const current = typeof settings === 'function' ? settings(requests.length) : settings;
      return {
        ok: status >= 200 && status < 300, status,
        json: async () => {
          if (jsonError) throw jsonError;
          return copy(current);
        },
      };
    },
  };
  vm.createContext(context);
  vm.runInContext(loader, context, { filename: 'web-game-ads.js' });
  await new Promise(resolve => setImmediate(resolve));
  return {
    containers, requests, scripts, errors, window, document,
    async startProvider(options = {}) {
      window.__webAdFixtureOptions = options;
      vm.runInContext(provider, context, { filename: 'web-ads-provider.js' });
      scripts[0].onload();
      await new Promise(resolve => setImmediate(resolve));
      return window.__webAdFixture;
    },
    fireTimer(delay) {
      for (const [id, timer] of timers) if (timer.delay === delay) {
        timers.delete(id);
        timer.callback();
      }
    },
  };
}

function assertInert(result, expectedState) {
  assert.equal(result.scripts.length, 0, 'No provider SDK may be appended');
  assert.equal(result.window.adsbygoogle, undefined, 'No provider queue may be created');
  for (const container of result.containers) {
    assert.equal(container.hidden, true);
    assert.equal(container.dataset.webAdState, expectedState);
    for (const unit of container.units) {
      assert.deepEqual(unit.children, []);
      assert.equal(unit.dataset.adSlot, undefined);
    }
  }
  assert.ok(result.requests.every(request => request.url === '/_data/web-ads.json'));
}

function enabledEditorial(name = 'blogArticleEnd') {
  const settings = copy(config);
  settings.enabled = true;
  settings.siteApprovalVerified = true;
  settings.privacySetupVerified = true;
  settings.placements[name].enabled = true;
  settings.placements[name].slot = '1234567890';
  return settings;
}

test('registered editorial units stay disabled and limited to registered editorial paths', () => {
  assert.equal(config.enabled, false);
  assert.equal(config.siteApprovalVerified, false);
  assert.equal(config.privacySetupVerified, false);
  assert.equal(config.mathTankSlot, '');
  for (const settings of Object.values(config.placements)) {
    assert.equal(settings.enabled, false);
    assert.match(settings.slot, /^\d+$/);
  }
  const posts = JSON.parse(readFileSync(join(root, '_data', 'blogs.json'), 'utf8')).posts;
  assert.deepEqual([...config.placements.blogArticleEnd.paths].sort(), posts.map(post => post.url).sort());
  assert.deepEqual(config.placements.parentGuideEnd.paths, ['/parents/']);
});

test('every explicitly eligible editorial path stays hidden and makes only the first-party config request', async () => {
  const paths = Object.values(config.placements).flatMap(settings => settings.paths);
  for (const path of paths) {
    const result = await run({ path });
    assertInert(result, 'disabled');
    assert.deepEqual(result.errors, []);
    assert.equal(result.requests.length, 1);
    assert.equal(result.requests[0].options.mode, 'same-origin');
    assert.equal(result.requests[0].options.redirect, 'error');
    assert.equal(result.requests[0].options.credentials, 'omit');
  }
});

test('Math Tank keeps its disabled legacy marker and configuration contract', async () => {
  for (const settings of [config, { enabled: false, privacySetupVerified: false, mathTankSlot: '' }]) {
    const result = await run({
      path: '/play/math-tank.html', settings, containers: [placement({ legacy: true })],
    });
    assertInert(result, 'disabled');
    assert.deepEqual(result.errors, []);
  }
});

test('site approval, privacy verification and placement enablement are independent pre-SDK gates', async () => {
  const cases = [
    { settings: { ...enabledEditorial(), siteApprovalVerified: false }, code: 'site-not-approved' },
    { settings: { ...enabledEditorial(), siteApprovalVerified: undefined }, code: 'site-not-approved' },
    { settings: { ...enabledEditorial(), privacySetupVerified: false }, code: 'privacy-not-verified' },
    {
      path: '/play/math-tank.html', containers: [placement({ legacy: true })],
      settings: { enabled: true, privacySetupVerified: true, mathTankSlot: '1234567890' },
      code: 'activation-unimplemented',
    },
  ];
  for (const options of cases) {
    const result = await run(options);
    assertInert(result, 'blocked');
    assert.equal(result.containers[0].dataset.webAdError, options.code);
    assert.equal(result.errors.length, 1);
  }
  const disabled = await run({ settings: { ...config, enabled: true } });
  assertInert(disabled, 'disabled');
  assert.deepEqual(disabled.errors, []);
});

test('invalid enabled configurations produce explicit errors without creating any ad unit or request', async () => {
  const invalid = [
    settings => { settings.enabled = 'true'; },
    settings => { settings.siteApprovalVerified = 'true'; },
    settings => { settings.privacySetupVerified = 'true'; },
    settings => { settings.mathTankSlot = 123; },
    settings => { settings.placements.blogArticleEnd.slot = ''; },
    settings => { settings.placements.blogArticleEnd.slot = 'not-a-unit'; },
    settings => { settings.placements.blogArticleEnd.paths = []; },
    settings => { settings.placements.blogArticleEnd.paths = ['/tools/calculator.html']; },
    settings => { settings.placements.blogArticleEnd.paths = ['/blog/index.html']; },
    settings => { settings.placements.parentGuideEnd.paths = ['/play/clock-master.html']; },
    settings => { settings.placements.blogArticleEnd.paths.push(articlePath); },
    settings => { settings.consentGranted = true; },
    settings => { settings.placements.sitewide = settings.placements.blogArticleEnd; },
  ];
  for (const mutate of invalid) {
    const settings = enabledEditorial();
    mutate(settings);
    const result = await run({ settings });
    assertInert(result, 'blocked');
    assert.equal(result.containers[0].dataset.webAdError, 'invalid-configuration');
    assert.equal(result.errors.length, 1);
  }
});

test('verified operators can bootstrap only a paused, non-personalized Google SDK, not establish visitor consent', async () => {
  const result = await run({ settings: enabledEditorial() });
  assert.equal(result.scripts.length, 1);
  assert.equal(result.scripts[0].src, 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5489426086320283');
  assert.equal(result.scripts[0].attributes['data-privacy-treatments'], 'disablePersonalization');
  assert.equal(result.scripts[0].crossOrigin, 'anonymous');
  assert.equal(result.window.adsbygoogle.pauseAdRequests, 1);
  assert.equal(result.window.adsbygoogle.requestNonPersonalizedAds, 1);
  assert.equal(result.window.adsbygoogle.length, 0);
  assert.equal(result.containers[0].hidden, true);
  assert.deepEqual(result.containers[0].units[0].children, []);
  result.fireTimer(15000);
  assert.equal(result.containers[0].dataset.webAdError, 'consent-unavailable');
  assert.equal(result.window.adsbygoogle.pauseAdRequests, 1);
  assert.match(result.errors[0], /not visitor consent/);
});

test('browser opt-out prevents even the SDK and queue from being created', async () => {
  const result = await run({ settings: enabledEditorial(), globalPrivacyControl: true });
  assertInert(result, 'browser-optout');
  assert.deepEqual(result.errors, []);
});

test('API readiness without privacy responses expires, but a reported pending decision does not', async () => {
  for (const options of [{ noApiReady: true }, { hangTcf: true }, { hangGpp: true }]) {
    const result = await run({ settings: enabledEditorial() });
    const fixture = await result.startProvider(options);
    result.fireTimer(15000);
    assert.equal(result.containers[0].dataset.webAdError, 'consent-unavailable');
    assert.equal(fixture.requests.length, 0);
    assert.equal(result.window.adsbygoogle.pauseAdRequests, 1);
  }
  const pending = await run({ settings: enabledEditorial() });
  const fixture = await pending.startProvider({ tcf: { gdprApplies: null } });
  pending.fireTimer(15000);
  assert.equal(pending.containers[0].dataset.webAdState, 'waiting-consent');
  assert.equal(fixture.requests.length, 0);
  assert.deepEqual(pending.errors, []);
});

test('an unavailable SDK reports a visible failure and never queues an ad', async () => {
  const result = await run({ settings: enabledEditorial() });
  result.scripts[0].onerror();
  assert.equal(result.containers[0].dataset.webAdError, 'provider-unavailable');
  assert.equal(result.containers[0].hidden, true);
  assert.equal(result.window.adsbygoogle.length, 0);
  assert.match(result.errors[0], /could not load/);
});

test('a kill-switch change while the CMP is loading prevents an ad request', async () => {
  const result = await run({ settings: count => count === 1 ? enabledEditorial() : config });
  const fixture = await result.startProvider();
  assert.equal(result.requests.length, 2);
  assert.equal(fixture.requests.length, 0);
  assert.equal(fixture.pushes, 0);
  assert.equal(result.containers[0].dataset.webAdState, 'disabled');
  assert.equal(result.window.adsbygoogle.pauseAdRequests, 1);
  assert.deepEqual(result.errors, []);
});

test('consent permits one guarded manual request; expiry and late callbacks cannot resurrect it', async () => {
  const result = await run({ settings: enabledEditorial() });
  const fixture = await result.startProvider({ fill: 'pending' });
  assert.equal(fixture.requests.length, 1);
  assert.equal(fixture.requests[0].tagForAgeTreatment, '1');
  assert.equal(fixture.requests[0].restrictDataProcessing, '1');
  assert.equal(fixture.requests[0].nonPersonalized, 1);
  result.fireTimer(20000);
  assert.equal(result.containers[0].dataset.webAdError, 'ad-unavailable');
  fixture.changeTcf({ gdprApplies: false });
  assert.equal(fixture.requests.length, 1);
  assert.equal(result.window.adsbygoogle.pauseAdRequests, 1);
  assert.deepEqual(result.containers[0].units[0].children, []);
});

test('Google privacy revision still works after navigation or an ad-status failure without restarting ads', async () => {
  for (const navigation of [true, false]) {
    const result = await run({ settings: enabledEditorial() });
    const fixture = await result.startProvider({ region: 'eu', fill: 'pending' });
    if (navigation) result.window.listeners.pagehide();
    else result.fireTimer(20000);
    result.containers[0].control.children[1].listeners.click();
    assert.equal(fixture.revocations, 1);
    assert.equal(fixture.requests.length, 1);
    assert.equal(result.window.adsbygoogle.pauseAdRequests, 1);
    assert.equal(result.containers[0].hidden, true);
    assert.deepEqual(result.containers[0].units[0].children, []);
  }
});

test('initial US opt-outs, sensitive-data refusal and GPP privacy protection never queue an ad', async () => {
  const source = await run({ settings: enabledEditorial() });
  const initial = await source.startProvider({ region: 'usnat' });
  const mutations = [
    data => { data.parsedSections.usnat[0].SaleOptOut = 1; },
    data => { data.parsedSections.usnat[0].TargetedAdvertisingOptOut = 1; },
    data => { data.parsedSections.usnat[0].SensitiveDataProcessing[0] = 1; },
    data => { data.parsedSections.usnat[0].KnownChildSensitiveDataConsents[0] = 1; },
    data => { data.parsedSections.usnat.push({ SubsectionType: 1, Gpc: true }); },
  ];
  for (const mutate of mutations) {
    const gpp = copy(initial.gpp);
    mutate(gpp);
    const result = await run({ settings: enabledEditorial() });
    const fixture = await result.startProvider({ region: 'usnat', gpp });
    assert.equal(result.containers[0].dataset.webAdState, 'consent-denied');
    assert.equal(fixture.pushes, 0);
    assert.equal(fixture.requests.length, 0);
    assert.equal(result.window.adsbygoogle.pauseAdRequests, 1);
    assert.deepEqual(result.errors, []);
  }
});

test('the master disabled setting remains a kill switch even with opted-in slots', async () => {
  const settings = enabledEditorial();
  settings.enabled = false;
  settings.mathTankSlot = '1234567890';
  const result = await run({ settings });
  assertInert(result, 'disabled');
  assert.deepEqual(result.errors, []);
});

test('loading the helper or copying a marker never opts unrelated pages into advertising', async () => {
  for (const path of ['/', '/blog/', '/blog/index.html', '/parents/index.html',
    '/tools/calculator.html', '/learn/telling-time.html', '/play/clock-master.html',
    '/games/mathtank/', '/Arcade/game.html']) {
    const result = await run({ path, settings: enabledEditorial() });
    assertInert(result, 'ineligible');
    assert.equal(result.requests.length, 0);
    assert.deepEqual(result.errors, []);
  }
  for (const path of [articlePath, '/parents/', '/play/math-tank.html']) {
    const result = await run({ path, containers: [] });
    assertInert(result, 'ineligible');
    assert.equal(result.requests.length, 0, 'A script alone must not create a placement');
  }
  const unlisted = await run({ path: '/blog/not-an-eligible-article.html' });
  assertInert(unlisted, 'ineligible');
});

test('duplicate or task-adjacent editorial markup is blocked before fetching config', async () => {
  for (const containers of [
    [placement(), placement()], [placement({ insideControls: true })],
    [placement({ unitCount: 0 })], [placement({ unitCount: 2 })],
  ]) {
    const result = await run({ containers });
    assertInert(result, 'blocked');
    assert.equal(result.containers[0].dataset.webAdError, 'invalid-markup');
    assert.equal(result.requests.length, 0);
    assert.equal(result.errors.length, 1);
  }
});

test('unavailable or malformed first-party config is reported and still fails closed', async () => {
  for (const options of [
    { status: 404 }, { fetchError: new Error('Network unavailable') },
    { jsonError: new SyntaxError('Invalid JSON') }, { settings: null },
  ]) {
    const result = await run(options);
    assertInert(result, 'blocked');
    assert.equal(result.errors.length, 1);
  }
});
