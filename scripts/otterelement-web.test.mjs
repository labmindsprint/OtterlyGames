import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { prepareOtterelementWeb, replaceExact, replaceRegion } from './prepare-otterelement-web.mjs';

// The patch step of the Otter Element website preview (see scripts/otterelement-web/README.md).
const here = fileURLToPath(new URL('.', import.meta.url));
const site = resolve(here, '..');
const overlays = join(here, 'otterelement-web', 'src');
const game = resolve(process.env.OTTERELEMENT_SOURCE || join(site, '..', 'Otter Element'));

function checkVisibilityBridge(workspace) {
  const ts = createRequire(join(game, 'package.json'))('typescript');
  const window = new EventTarget();
  const parent = {};
  const values = new Map();
  Object.assign(window, {
    parent, location: { origin: 'https://otterlygames.com' },
    localStorage: {
      get length() { return values.size; },
      key: (index) => [...values.keys()][index] ?? null,
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  });
  const load = (file, require) => {
    const exports = {};
    const code = ts.transpileModule(readFileSync(join(workspace, 'src', file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    runInNewContext(code, { exports, require, window, CustomEvent });
    return exports;
  };
  const state = load('native/appState.ts', (name) => {
    if (name === '@capacitor/core') return { Capacitor: { getPlatform: () => 'web' } };
    if (name === '@capacitor/app') return { App: { getState: () => assert.fail('browser refresh must not query the native bridge') } };
    if (name === '../game/flowGuard') return { withDeadline: () => assert.fail('browser refresh must not schedule a native deadline') };
    assert.fail(`unexpected import: ${name}`);
  });
  load('previewEnv.ts', (name) => {
    assert.equal(name, './native/appState');
    return state;
  });
  const observed = [];
  window.addEventListener(state.APP_ACTIVE_EVENT, (event) => observed.push(event.detail));
  const send = (data, origin = window.location.origin, source = parent) => {
    window.dispatchEvent(Object.assign(new Event('message'), { data, origin, source }));
  };
  assert.equal(state.nativeAppActive(), true);
  send({ type: 'oe-preview-active', active: false });
  assert.equal(state.nativeAppActive(), false, 'host pause updates the cached lifecycle authority');
  send({ type: 'oe-preview-active', active: true }, 'https://other.example');
  send({ type: 'oe-preview-active', active: true }, window.location.origin, {});
  send({ type: 'oe-preview-active', active: 'true' });
  assert.equal(state.nativeAppActive(), false, 'untrusted or invalid messages cannot resume the game');
  return state.refreshAppActive().then(() => {
    assert.equal(state.nativeAppActive(), false, 'browser refresh preserves the host pause');
    send({ type: 'oe-preview-active', active: true });
    assert.equal(state.nativeAppActive(), true);
    assert.deepEqual(observed, [false, true], 'only valid host messages notify lifecycle subscribers');
  });
}

test('a patch that no longer matches the game fails instead of shipping', () => {
  assert.equal(replaceExact('a b a', 'b', 'c', 1, 'x.ts'), 'a c a');
  assert.throws(() => replaceExact('a b a', 'a', 'c', 1, 'x.ts'), /Otter Element source changed in x\.ts \(2 matches, expected 1\)/);
  assert.throws(() => replaceExact('a b a', 'z', 'c', 1, 'x.ts'), /0 matches/);
  assert.equal(replaceRegion('one [two] three', '[', ']', '(2)'), 'one (2) three');
  assert.throws(() => replaceRegion('[a] [b]', '[', ']', 'x'), /not unique/);
  assert.throws(() => replaceRegion('no markers', '[', ']', 'x'), /not found/);
});

test('every patch applies to the selected game source, on a copy only', { skip: !process.env.OTTERELEMENT_SOURCE && 'optional rebuild check: set OTTERELEMENT_SOURCE to the game checkout' }, async (t) => {
  const workspace = mkdtempSync(join(process.env.OTTERELEMENT_WORKSPACE_ROOT || tmpdir(), 'otterelement-patch-test-'));
  try {
    const before = readFileSync(join(game, 'src', 'game', 'loop.ts'), 'utf8');
    cpSync(join(game, 'src'), join(workspace, 'src'), { recursive: true, filter: (path) => !/\.test\.tsx?$/.test(path) });
    cpSync(join(game, 'index.html'), join(workspace, 'index.html'));
    const appStatePath = join(workspace, 'src', 'native', 'appState.ts');
    const androidPath = join(workspace, 'src', 'native', 'android.ts');
    const appState = readFileSync(appStatePath, 'utf8');
    const android = readFileSync(androidPath, 'utf8');
    const main = readFileSync(join(workspace, 'src', 'main.tsx'), 'utf8');
    writeFileSync(appStatePath, appState.replace("'oe:app-active'", "'oe:renamed'"));
    assert.throws(() => prepareOtterelementWeb(workspace, game), /source changed in src\/native\/appState\.ts/);
    assert.equal(readFileSync(join(workspace, 'src', 'main.tsx'), 'utf8'), main, 'event drift fails before any patched source is written');
    writeFileSync(appStatePath, appState);
    writeFileSync(androidPath, android.replace("export { APP_ACTIVE_EVENT } from './appState';", "export { APP_ACTIVE_EVENT } from './otherState';"));
    assert.throws(() => prepareOtterelementWeb(workspace, game), /source changed in src\/native\/android\.ts/);
    writeFileSync(androidPath, android);
    prepareOtterelementWeb(workspace, game);
    const loop = readFileSync(join(workspace, 'src', 'game', 'loop.ts'), 'utf8');
    assert.match(loop, /PREVIEW_NODE_CAP as PLAYABLE_ELEMENTS/);
    assert.match(readFileSync(join(workspace, 'index.html'), 'utf8'), /<meta http-equiv="Content-Security-Policy" content="script-src 'self'; /);
    for (const file of ['previewEnv.ts', 'previewCap.ts', 'components/PreviewEnd.tsx', 'components/SiegeBadge.tsx', 'components/shop/ShopSheet.tsx']) {
      assert.equal(readFileSync(join(workspace, 'src', file), 'utf8'), readFileSync(join(overlays, file), 'utf8'), `${file} comes from the overlay`);
    }
    assert.equal(readFileSync(join(game, 'src', 'game', 'loop.ts'), 'utf8'), before, 'the game checkout is untouched');
    assert.equal(readFileSync(join(game, 'src', 'native', 'appState.ts'), 'utf8'), appState, 'the native lifecycle source is untouched');
    await t.test('host visibility controls cached app state without native calls', { skip: !existsSync(join(game, 'node_modules', 'typescript')) && 'the game build dependencies are not installed' }, () => checkVisibilityBridge(workspace));
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('the overlay will not write into the game or the website', () => {
  assert.throws(() => prepareOtterelementWeb(site, game), /Refusing to apply website overlays/);
  assert.throws(() => prepareOtterelementWeb(join(site, 'scripts'), game), /Refusing to apply website overlays/);
});
