import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  rmdirSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import {
  computedImportCount, guardOutput, MANIFEST_NAME, moduleImports, nativeOverlays, prepareSpaceAcademyAndroid,
  REPOSITORY_ROOT,
} from './prepare-space-academy-android.mjs';

const id = `${process.pid}-${randomUUID()}`;
// Deliberately outside both the repository and session state; never use an OS temp directory.
const workspace = join(dirname(REPOSITORY_ROOT), `otterly-space-academy-android-test-${id}`);
const hash = data => createHash('sha256').update(data).digest('hex');
const at = (root, path) => join(root, ...path.split('/'));
const MAIN = 'js/space-academy/pitstop/main.mjs';
const FUEL = 'js/space-academy/pitstop/view-fuel.mjs';
const VIEWS = 'js/space-academy/pitstop/views.mjs';
const OVERLAID = ['play/pit-stop.html', MAIN, FUEL, VIEWS];
let baseline;
let originals;

before(() => {
  mkdirSync(workspace);
  writeFileSync(join(workspace, '.test-owner'), id, { flag: 'wx' });
  baseline = prepareSpaceAcademyAndroid(join(workspace, 'baseline', 'assets'));
  originals = new Map(baseline.manifest.sources.map(source => {
    const data = readFileSync(at(REPOSITORY_ROOT, source.path));
    assert.equal(hash(data), source.sha256, `source changed while test snapshot was captured: ${source.path}`);
    return [source.path, data];
  }));
});

after(() => {
  if (!existsSync(workspace) || readFileSync(join(workspace, '.test-owner'), 'utf8') !== id) return;
  const removeOwned = directory => {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const full = join(directory, item.name);
      assert.equal(lstatSync(full).isSymbolicLink(), false, 'never follow a link during fixture cleanup');
      if (item.isDirectory()) removeOwned(full);
      else unlinkSync(full);
    }
    rmdirSync(directory);
  };
  removeOwned(workspace);
});

function fixture(name) {
  const source = join(workspace, name, 'source');
  for (const [path, data] of originals) {
    mkdirSync(dirname(at(source, path)), { recursive: true });
    writeFileSync(at(source, path), data);
  }
  return { source, output: join(workspace, name, 'assets') };
}

const loadExport = path => import(pathToFileURL(at(baseline.output, `js/space-academy/${path}.mjs`)).href);

test('CLI requires an explicit output, resolves it and emits usable copy statistics', () => {
  const script = join(REPOSITORY_ROOT, 'scripts', 'prepare-space-academy-android.mjs');
  const missing = spawnSync(process.execPath, [script], { encoding: 'utf8', cwd: REPOSITORY_ROOT });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /--output/);
  const output = join(workspace, 'cli', 'assets');
  const exported = spawnSync(process.execPath, [script, '--output', relative(REPOSITORY_ROOT, output)], {
    encoding: 'utf8', cwd: REPOSITORY_ROOT,
  });
  assert.equal(exported.status, 0, exported.stderr);
  const result = JSON.parse(exported.stdout);
  assert.equal(result.output, resolve(output));
  assert.equal(result.files, baseline.manifest.files.length);
  assert.equal(result.bytes, baseline.manifest.stats.bytes);
  assert.equal(result.written, result.files);
  assert.ok(existsSync(join(output, MANIFEST_NAME)));
});

test('unsafe repository/source/website paths and their ancestors/descendants are rejected without writing', () => {
  const native = join(REPOSITORY_ROOT, 'android', 'space-academy', 'app', 'build', 'generated', 'academy-assets');
  assert.equal(guardOutput(native), native);
  for (const path of [
    '', REPOSITORY_ROOT, dirname(REPOSITORY_ROOT), join(REPOSITORY_ROOT, 'js'),
    join(REPOSITORY_ROOT, 'js', 'space-academy'), join(REPOSITORY_ROOT, 'play'),
    join(REPOSITORY_ROOT, 'games'), join(REPOSITORY_ROOT, 'build', 'site'),
    join(REPOSITORY_ROOT, 'build', 'site', 'play', 'assets'),
    dirname(native), join(native, 'nested'), join(workspace, 'not-an-isolated-output', '..', '..'),
  ]) assert.throws(() => guardOutput(path), /Unsafe|required/, path);
  const { source } = fixture('guard');
  for (const path of [source, dirname(source), join(source, 'js'), join(source, 'generated')]) {
    assert.throws(() => prepareSpaceAcademyAndroid(path, { sourceRoot: source }), /Unsafe/);
  }
  const arbitrary = join(dirname(REPOSITORY_ROOT), `unapproved-assets-${id}`);
  assert.throws(() => prepareSpaceAcademyAndroid(arbitrary), /Unsafe/);
  assert.equal(existsSync(arbitrary), false);
});

test('the Pit Stop entry, every screen, every ship and every referenced asset are bundled and resolvable', () => {
  const before = readFileSync(baseline.manifestPath);
  const repeated = prepareSpaceAcademyAndroid(baseline.output);
  assert.deepEqual(readFileSync(repeated.manifestPath), before, 'export is deterministic');
  assert.equal(repeated.written, 0);
  assert.equal(baseline.manifest.entrypoint, '/play/pit-stop.html');
  const paths = new Set(baseline.manifest.files.map(file => file.path));
  for (const file of baseline.manifest.files) {
    const data = readFileSync(at(baseline.output, file.path));
    assert.equal(data.length, file.bytes, file.path);
    assert.equal(hash(data), file.sha256, file.path);
    if (file.source.startsWith('scripts/')) assert.deepEqual(data, readFileSync(at(REPOSITORY_ROOT, file.source)), `brand file: ${file.path}`);
    else if (!OVERLAID.includes(file.path)) assert.deepEqual(data, originals.get(file.source), `unmodified: ${file.path}`);
    if (file.path.endsWith('.mjs')) {
      for (const specifier of moduleImports(data.toString('utf8'))) {
        assert.ok(existsSync(resolve(dirname(at(baseline.output, file.path)), specifier)), `${file.path}: ${specifier}`);
      }
    }
    if (file.path.endsWith('.css')) {
      for (const match of data.toString('utf8').matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
        if (match[2].startsWith('data:')) continue;
        assert.ok(paths.has(match[2].replace(/^\//, '')), `${file.path} requests offline route ${match[2]}`);
      }
    }
  }
  const html = readFileSync(at(baseline.output, 'play/pit-stop.html'), 'utf8');
  for (const match of html.matchAll(/\b(?:href|src)="(\/[^"]+)"/g)) assert.ok(paths.has(match[1].slice(1)), `launcher requests ${match[1]}`);
  const main = readFileSync(at(baseline.output, MAIN), 'utf8');
  for (const match of main.matchAll(/\['(\.\/[\w-]+\.mjs)', '\w+'\]/g)) {
    assert.ok(paths.has(`js/space-academy/pitstop/${match[1].slice(2)}`), `screen module ${match[1]}`);
  }
  for (const ship of ['pp1', 'pp2', 'class-1', 'class-2', 'class-3', 'class-4', 'class-5']) {
    assert.ok(paths.has(`js/space-academy/pitstop/ships/${ship}.mjs`), ship);
  }
  for (const path of ['audio/starfield.wav', 'fonts/patrick-hand-latin.woff2', 'favicon.ico', 'css/pit-stop.css',
    'js/space-academy/pitstop/sky.mjs', 'js/space-academy/pitstop/flight.mjs', 'js/space-academy/pitstop/print.mjs']) {
    assert.ok(paths.has(path), path);
  }
  for (const path of paths) {
    assert.doesNotMatch(path, /^(?:play\/space-academy\.html|js\/space-academy\/app\.mjs|games\/)/, `retired/large asset: ${path}`);
    assert.doesNotMatch(path, /\.(?:test\.mjs|md|py|svg|jpg)$/, `dev-only or master file: ${path}`);
    if (/^images\/|\.(?:png|webp)$/.test(path)) assert.match(path, /^images\/(?:brand\/(?:otter-buddy-320\.webp|osa-icon-512\.png)|ringo\/ringo-(?:happy|think|cheer)(?:-bust)?\.webp)$/, `only the launch splash art and Ringo guide art are images: ${path}`);
  }
  assert.ok(paths.has('css/otterly-brand-splash.css') && paths.has('js/otterly-brand-splash.js') && paths.has('fonts/Fredoka-OFL.txt'), 'brand splash bundled with its font licence');
  assert.match(html, /id="brand-splash"[\s\S]*Otterly Games[\s\S]*Otterly Space Academy/, 'brand splash markup is in the launcher');
  assert.match(readFileSync(at(baseline.output, VIEWS), 'utf8'), /Made with care by Otterly Games/);
  assert.ok(baseline.manifest.stats.bytes < 12 * 1024 * 1024, 'bundle stays small');
});

test('bundled game data loads and every class can build its ship from the exported tree', async () => {
  const { CLASSES } = await import(pathToFileURL(at(baseline.output, 'js/space-academy/pitstop/data.mjs')).href);
  const { loadShip } = await import(pathToFileURL(at(baseline.output, 'js/space-academy/pitstop/ships/index.mjs')).href);
  const { createMission } = await loadExport('questions');
  const { createMission: production } = await import('../js/space-academy/questions.mjs');
  assert.equal(CLASSES.length, 7);
  for (const item of CLASSES) {
    assert.ok((await loadShip(item.id)).parts.length > 0, item.id);
    const options = { grade: item.id, mode: 'mixed', level: 1, seed: `offline-${item.id}` };
    assert.deepEqual(createMission(options), production(options), item.id);
  }
});

test('missing assets and unreviewed source drift fail before creating a bundle', () => {
  const cases = [
    ['audio', 'audio/starfield.wav', null, /missing/],
    ['font', 'fonts/patrick-hand-latin.woff2', null, /missing/],
    ['ship', 'js/space-academy/pitstop/ships/class-3.mjs', null, /missing/],
    ['overlay-main', MAIN, text => text.replace('boot();', 'startApp();'), /Source drift/],
    ['overlay-fuel', FUEL, text => text.replace('Support us on Ko-fi', 'Support us'), /Source drift/],
    ['computed-import', 'js/space-academy/pitstop/progress.mjs', text => `${text}\nconst more = await import(name);\n`, /computed dynamic imports/],
    ['network', 'js/space-academy/pitstop/flight.mjs', text => `${text}\nnew WebSocket('wss://example.invalid');\n`, /networking/],
    ['request', 'js/space-academy/pitstop/sky.mjs', text => `${text}\nfetch('/data.json');\n`, /automatic asset requests/],
  ];
  for (const [name, path, change, expected] of cases) {
    const { source, output } = fixture(name);
    if (change) writeFileSync(at(source, path), change(readFileSync(at(source, path), 'utf8')));
    else unlinkSync(at(source, path));
    assert.throws(() => prepareSpaceAcademyAndroid(output, { sourceRoot: source }), expected, name);
    assert.equal(existsSync(output), false, `${name} must fail before writing anything`);
  }
});

test('unknown/unowned or modified output is never overwritten; failed preflight preserves the old bundle', () => {
  const { source, output } = fixture('ownership');
  mkdirSync(output, { recursive: true });
  const unknown = join(output, 'keep-me.txt');
  writeFileSync(unknown, 'not owned by exporter');
  assert.throws(() => prepareSpaceAcademyAndroid(output, { sourceRoot: source }), /unowned/);
  assert.equal(readFileSync(unknown, 'utf8'), 'not owned by exporter');
  unlinkSync(unknown);
  const exported = prepareSpaceAcademyAndroid(output, { sourceRoot: source });
  const manifestBefore = readFileSync(exported.manifestPath);
  writeFileSync(unknown, 'still not owned');
  assert.throws(() => prepareSpaceAcademyAndroid(output, { sourceRoot: source }), /Unknown\/unowned/);
  assert.deepEqual(readFileSync(exported.manifestPath), manifestBefore);
  unlinkSync(unknown);
  const mainPath = at(output, MAIN);
  const mainBefore = readFileSync(mainPath);
  writeFileSync(mainPath, 'user edit');
  assert.throws(() => prepareSpaceAcademyAndroid(output, { sourceRoot: source }), /modified outside/);
  assert.equal(readFileSync(mainPath, 'utf8'), 'user edit');
  writeFileSync(mainPath, mainBefore);
  unlinkSync(at(source, 'audio/starfield.wav'));
  assert.throws(() => prepareSpaceAcademyAndroid(output, { sourceRoot: source }), /missing/);
  assert.deepEqual(readFileSync(exported.manifestPath), manifestBefore);
  assert.deepEqual(readFileSync(mainPath), mainBefore);
});

test('only explicitly owned, unchanged stale files are removed, and malformed inventories are refused', () => {
  const output = join(workspace, 'stale', 'assets');
  const exported = prepareSpaceAcademyAndroid(output);
  const stale = 'css/old-native-style.css';
  const data = Buffer.from('old generated stylesheet');
  writeFileSync(at(output, stale), data);
  const previous = JSON.parse(readFileSync(exported.manifestPath, 'utf8'));
  previous.files.push({ path: stale, bytes: data.length, sha256: hash(data) });
  writeFileSync(exported.manifestPath, JSON.stringify(previous));
  const updated = prepareSpaceAcademyAndroid(output);
  assert.equal(updated.removed, 1);
  assert.equal(existsSync(at(output, stale)), false);
  previous.files.push({ path: '../outside.txt', sha256: hash(data) });
  writeFileSync(exported.manifestPath, JSON.stringify(previous));
  assert.throws(() => prepareSpaceAcademyAndroid(output), /Invalid owned/);
});

test('import parser follows literal dynamic imports and flags computed ones', () => {
  assert.deepEqual(moduleImports("import a from './a.mjs';\nconst { b } = await import('./b.mjs');\nexport * from './c.mjs';"),
    ['./a.mjs', './c.mjs', './b.mjs']);
  assert.equal(computedImportCount("await import('./b.mjs'); await import(file); await import(`./${id}.mjs`);"), 2);
});

test('native overlays apply once and keep website-only behaviour (Ko-fi codes, test switches) out of the app', () => {
  const original = {
    launcher: originals.get('play/pit-stop.html').toString('utf8'),
    main: originals.get(MAIN).toString('utf8'),
    fuel: originals.get(FUEL).toString('utf8'),
    views: originals.get(VIEWS).toString('utf8'),
  };
  const modified = nativeOverlays(original);
  assert.throws(() => nativeOverlays(modified), /Source drift/);
  assert.match(modified.launcher, /<body class="ps-body ps-native">/);
  assert.doesNotMatch(modified.fuel, /ko-fi|KOFI|data-fuel="code"|Supporter code/i);
  assert.match(modified.fuel, /billing\.buy|data-fuel="restore"/, 'Play Billing and restore remain');
  assert.match(modified.fuel, /revealAdButton/, 'rewarded ad button remains');
  const bridge = readFileSync(at(baseline.output, 'js/space-academy/pitstop/fuel-bridge.mjs'), 'utf8');
  assert.match(bridge, /\['localhost', '127\.0\.0\.1'\]\.includes\(location\.hostname\)/, 'fake native stays developer-only');
  const html = readFileSync(at(baseline.output, 'play/pit-stop.html'), 'utf8');
  assert.doesNotMatch(html, /https?:\/\/(?!www\.w3\.org)|includes\.js|<!-- og:/, 'launcher has no external or site-chrome request');
});

function lifecycle() {
  const state = { hidden: false, events: [], speech: 0 };
  const listeners = new Map();
  class Document { get hidden() { return state.hidden; } }
  const document = new Document();
  document.dispatchEvent = event => state.events.push(event.type);
  const context = vm.createContext({
    Document, document, Event: class { constructor(type) { this.type = type; } }, globalThis: null,
    window: {
      addEventListener: (name, callback) => listeners.set(name, callback),
      speechSynthesis: { cancel() { state.speech++; } },
    },
    boot: async () => {},
  });
  context.globalThis = context;
  const { main } = nativeOverlays({
    launcher: originals.get('play/pit-stop.html').toString('utf8'),
    main: originals.get(MAIN).toString('utf8'),
    fuel: originals.get(FUEL).toString('utf8'),
    views: originals.get(VIEWS).toString('utf8'),
  });
  const start = main.indexOf('// Android host:');
  assert.ok(start > 0);
  vm.runInContext(main.slice(start), context);
  return { state, context, event: detail => listeners.get('otterly-native-visibility')({ detail }) };
}

test('host lifecycle hides the page, stops speech and signals readiness without touching saves', async () => {
  const app = lifecycle();
  assert.equal(app.context.document.hidden, false);
  app.event(false);
  assert.equal(app.context.document.hidden, true, 'activity pause counts as a hidden page');
  assert.deepEqual(app.state.events, ['visibilitychange']);
  assert.equal(app.state.speech, 1);
  app.event(true);
  assert.equal(app.context.document.hidden, false);
  app.event('false');
  assert.equal(app.context.document.hidden, false, 'non-boolean details are ignored');
  app.state.hidden = true;
  assert.equal(app.context.document.hidden, true, 'a genuinely hidden document still wins');
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(app.context.__otterlyAcademyNativeReady, true);
});
