import {
  existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync,
  rmdirSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';

export const REPOSITORY_ROOT = resolve(import.meta.dirname, '..');
export const MANIFEST_NAME = 'academy-assets-manifest.json';
const OWNER = 'otterly-space-academy-android-assets';
const ENTRY = 'play/pit-stop.html';
const MAIN = 'js/space-academy/pitstop/main.mjs';
const FUEL_VIEW = 'js/space-academy/pitstop/view-fuel.mjs';
const VIEWS = 'js/space-academy/pitstop/views.mjs';
const SHIPS = 'js/space-academy/pitstop/ships/';
// Otterly Games launch-splash files owned by this script (not website sources): [file, bundle path, kind].
const BRAND_DIR = 'scripts/space-academy-android';
const BRAND_FILES = [
  ['brand-splash.css', 'css/otterly-brand-splash.css', 'stylesheet'],
  ['brand-splash.js', 'js/otterly-brand-splash.js', 'script'],
  ['otter-buddy-320.webp', 'images/brand/otter-buddy-320.webp', 'image'],
  ['osa-icon-512.png', 'images/brand/osa-icon-512.png', 'image'],
  ['fredoka-600-latin.woff2', 'fonts/fredoka-600-latin.woff2', 'font'],
  ['Fredoka-OFL.txt', 'fonts/Fredoka-OFL.txt', 'font-license'],
];
// Modules loaded through a computed specifier, which the import parser cannot see. Each one is checked below.
const COMPUTED_IMPORTS = new Map([[MAIN, 1], [`${SHIPS}index.mjs`, 1]]);
const hash = data => createHash('sha256').update(data).digest('hex');
const portable = path => path.split(sep).join('/');
const diskPath = (root, path) => join(root, ...path.split('/'));
const inside = (parent, child) => {
  const part = relative(parent, child);
  return part === '' || (!part.startsWith(`..${sep}`) && part !== '..' && !isAbsolute(part));
};
const overlaps = (a, b) => inside(a, b) || inside(b, a);
const ordered = values => [...values].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

function exact(source, before, after, id, count = 1) {
  const found = source.split(before).length - 1;
  if (found !== count) throw new Error(`Source drift / overlay ${id}: found ${found} contexts, expected ${count}.`);
  return source.split(before).join(after);
}

/** Transform copies only. A second application intentionally fails rather than stacking overlays. */
export function nativeOverlays({ launcher, main, fuel, views }) {
  launcher = launcher.replaceAll('\r\n', '\n');
  main = main.replaceAll('\r\n', '\n');
  fuel = fuel.replaceAll('\r\n', '\n');
  views = views.replaceAll('\r\n', '\n');
  const ids = [];
  const edit = (text, path, id, before, after) => {
    ids.push({ id, path });
    return exact(text, before, after, id);
  };
  launcher = edit(launcher, ENTRY, 'native-launcher-body-v1', '<body class="ps-body">', `<body class="ps-body ps-native">
<div id="brand-splash" class="brand-splash" role="status" aria-label="Otterly Games">
  <div class="brand-splash-orbs" aria-hidden="true"><i class="brand-splash-orb orb-0"></i><i class="brand-splash-orb orb-1"></i><i class="brand-splash-orb orb-2"></i><i class="brand-splash-orb orb-3"></i><i class="brand-splash-orb orb-4"></i><i class="brand-splash-orb orb-5"></i></div>
  <div class="brand-splash-beat brand-splash-brand">
    <div class="brand-splash-mascot-pop"><img class="brand-splash-mascot" src="/images/brand/otter-buddy-320.webp" alt="" width="150" height="150"></div>
    <h1 class="brand-splash-studio">Otterly Games</h1>
    <p class="brand-splash-line">Otterly Smart.</p>
    <p class="brand-splash-subline">Learning like no otter.</p>
  </div>
  <div class="brand-splash-beat brand-splash-game">
    <img class="brand-splash-icon" src="/images/brand/osa-icon-512.png" alt="" width="148" height="148">
    <h2 class="brand-splash-title">Otterly Space Academy</h2>
    <p class="brand-splash-line">Build a ship. Answer. Explore.</p>
  </div>
  <p class="brand-splash-copyright">&copy; Otterly Games</p>
</div>
<script src="/js/otterly-brand-splash.js"></script>`);
  launcher = edit(launcher, ENTRY, 'native-brand-splash-css-v1', '  <link rel="stylesheet" href="/css/pit-stop-print.css">\n',
    '  <link rel="stylesheet" href="/css/pit-stop-print.css">\n  <link rel="stylesheet" href="/css/otterly-brand-splash.css">\n');
  views = edit(views, VIEWS, 'native-otterly-credit-v1',
    '      <p>Questions follow Olympiad-style chapters for each class. The Skills page shows where a child needs more practice.</p>\n',
    '      <p>Questions follow Olympiad-style chapters for each class. The Skills page shows where a child needs more practice.</p>\n      <p>Made with care by Otterly Games. Otterly Smart. Learning like no otter.</p>\n');

  main = edit(main, MAIN, 'native-host-lifecycle-v1', '\nboot();\n', `
// Android host: the activity lifecycle, not just the tab, decides whether the page is hidden (music, flight loop, speech).
let hostHidden = false;
const pageHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden').get;
Object.defineProperty(document, 'hidden', { configurable: true, get: () => hostHidden || pageHidden.call(document) });
window.addEventListener('otterly-native-visibility', event => {
  if (typeof event.detail !== 'boolean') return;
  hostHidden = !event.detail;
  if (hostHidden) window.speechSynthesis?.cancel();
  document.dispatchEvent(new Event('visibilitychange'));
});

boot().finally(() => { globalThis.__otterlyAcademyNativeReady = true; });
`);

  // The website offers Ko-fi supporter codes. Inside the app, purchases go only through Google Play Billing.
  const shopStart = fuel.indexOf('  return `${head}<div class="ps-fuel-shop">\n    <p>Support us on Ko-fi');
  const shopEnd = fuel.indexOf('</div>`;\n}\n\nexport function fuelSection');
  if (shopStart < 0 || shopEnd < 0) throw new Error('Source drift / overlay native-no-website-shop-v1: website shop block not found.');
  const websiteShop = fuel.slice(shopStart, shopEnd + '</div>`;\n'.length);
  fuel = edit(fuel, FUEL_VIEW, 'native-no-website-shop-v1', websiteShop,
    '  return `${head}<div class="ps-fuel-shop"><p>Fuel purchases are not available on this device right now. Free fuel comes back tomorrow.</p></div>`;\n');
  fuel = edit(fuel, FUEL_VIEW, 'native-no-kofi-link-v1', "const KOFI = 'https://ko-fi.com/otterly_games';\n\n", '');
  return { launcher, main, fuel, views, overlays: ids };
}

function rejectSymlinks(path) {
  let current = resolve(path);
  while (dirname(current) !== current) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      throw new Error(`Refusing symlink/junction path: ${current}`);
    }
    current = dirname(current);
  }
}

/** Only the native generated asset directory or a clearly isolated external verification tree is writable. */
export function guardOutput(output, sourceRoot = REPOSITORY_ROOT) {
  if (typeof output !== 'string' || !output.trim()) throw new Error('--output <directory> is required.');
  const target = resolve(output);
  const source = realpathSync(sourceRoot);
  rejectSymlinks(target);
  const native = join(REPOSITORY_ROOT, 'android', 'space-academy', 'app', 'build', 'generated', 'academy-assets');
  if (target === native && source === REPOSITORY_ROOT) return target;
  if (overlaps(REPOSITORY_ROOT, target) || overlaps(source, target)) {
    throw new Error(`Unsafe output overlaps the repository/source/public website: ${target}`);
  }
  let parent = dirname(target);
  while (dirname(parent) !== parent) {
    if (/^otterly-space-academy-android-(?:test|verification)-[a-z0-9][a-z0-9_-]{5,}$/i.test(basename(parent))) {
      return target;
    }
    parent = dirname(parent);
  }
  throw new Error('Unsafe output: use android\\space-academy\\app\\build\\generated\\academy-assets, or a child of an external otterly-space-academy-android-verification-<unique-id> directory.');
}

export function moduleImports(text) {
  const imports = [];
  for (const match of text.matchAll(/^\s*import\s+(?:[^;'"]*?\s+from\s*)?(['"])([^'"]+)\1\s*;?/gm)) {
    imports.push(match[2]);
  }
  for (const match of text.matchAll(/\bexport\s+(?:\*|\{[^}]*\})\s+from\s*(['"])([^'"]+)\1/g)) imports.push(match[2]);
  for (const match of text.matchAll(/\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g)) imports.push(match[2]);
  return imports;
}

/** Number of import() calls whose specifier is not a plain string literal. */
export function computedImportCount(text) {
  return [...text.matchAll(/\bimport\s*\(/g)].length -
    [...text.matchAll(/\bimport\s*\(\s*(['"])[^'"]+\1\s*\)/g)].length;
}

function webpSize(data, name) {
  if (data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`Invalid WebP asset: ${name}`);
  }
  for (let offset = 12; offset + 8 <= data.length;) {
    const kind = data.toString('ascii', offset, offset + 4);
    const length = data.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (start + length > data.length) break;
    if (kind === 'VP8X' && length >= 10) return [1 + data.readUIntLE(start + 4, 3), 1 + data.readUIntLE(start + 7, 3)];
    if (kind === 'VP8 ' && length >= 10) return [data.readUInt16LE(start + 6) & 0x3fff, data.readUInt16LE(start + 8) & 0x3fff];
    if (kind === 'VP8L' && length >= 5) {
      const bits = data.readUInt32LE(start + 1);
      return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
    }
    offset = start + length + length % 2;
  }
  throw new Error(`WebP dimensions could not be read: ${name}`);
}

function createBundle(sourceRoot) {
  const sources = new Map();
  const files = new Map();
  const read = path => {
    if (sources.has(path)) return sources.get(path).data;
    const full = diskPath(sourceRoot, path);
    rejectSymlinks(full);
    if (!inside(sourceRoot, full) || !existsSync(full) || !lstatSync(full).isFile()) {
      throw new Error(`Required offline source/asset is missing or unsafe: ${path}`);
    }
    const data = readFileSync(full);
    sources.set(path, { path, bytes: data.length, sha256: hash(data), data });
    return data;
  };
  const add = (path, kind = 'asset', data = read(path), source = path) => {
    files.set(path, { path, kind, source, data, bytes: data.length, sha256: hash(data) });
  };
  const modules = new Set();
  const visitModule = path => {
    if (modules.has(path)) return;
    if (!path.startsWith('js/') || !path.endsWith('.mjs')) throw new Error(`Unexpected production module: ${path}`);
    modules.add(path);
    const data = read(path);
    const text = data.toString('utf8');
    const resolveLocal = specifier => {
      if (!specifier.startsWith('.')) throw new Error(`Non-local module dependency in ${path}: ${specifier}`);
      return portable(relative(sourceRoot, resolve(dirname(diskPath(sourceRoot, path)), specifier)));
    };
    for (const specifier of moduleImports(text)) visitModule(resolveLocal(specifier));
    if (computedImportCount(text) !== (COMPUTED_IMPORTS.get(path) ?? 0)) {
      throw new Error(`Source drift: computed dynamic imports changed in ${path}; update the offline inventory.`);
    }
    if (path === MAIN) {
      // The screen table names each view module by a string.
      const views = [...text.matchAll(/^\s+['\w-]+: \['(\.\/[\w-]+\.mjs)', '\w+'\],?$/gm)].map(match => match[1]);
      if (views.length < 10) throw new Error('Source drift: the Pit Stop screen table was not found.');
      for (const view of views) visitModule(resolveLocal(view));
    }
    if (path === `${SHIPS}index.mjs`) {
      const classes = [...read('js/space-academy/pitstop/data.mjs').toString('utf8').matchAll(/id: '((?:pp|class-)\d)', label:/g)].map(match => match[1]);
      if (classes.length !== 7) throw new Error(`Source drift: expected 7 classes, found ${classes.length}.`);
      for (const id of classes) visitModule(`${SHIPS}${id}.mjs`);
    }
    add(path, 'module', data);
  };
  visitModule(MAIN);
  for (const name of ['questions', 'curriculum', 'coaching', 'art', 'question-display']) {
    if (!modules.has(`js/space-academy/${name}.mjs`)) throw new Error(`Production game dependency disappeared: ${name}`);
  }
  const transformed = nativeOverlays({
    launcher: read(ENTRY).toString('utf8'), main: read(MAIN).toString('utf8'), fuel: read(FUEL_VIEW).toString('utf8'),
    views: read(VIEWS).toString('utf8'),
  });
  add(ENTRY, 'launcher', Buffer.from(transformed.launcher));
  add(MAIN, 'module', Buffer.from(transformed.main));
  add(FUEL_VIEW, 'module', Buffer.from(transformed.fuel));
  add(VIEWS, 'module', Buffer.from(transformed.views));
  for (const [name, path, kind] of BRAND_FILES) {
    const full = join(import.meta.dirname, 'space-academy-android', name);
    rejectSymlinks(full);
    if (!existsSync(full) || !lstatSync(full).isFile()) throw new Error(`Required brand splash file is missing: ${name}`);
    add(path, kind, readFileSync(full), `${BRAND_DIR}/${name}`);
  }

  const routePath = (url, referring) => {
    if (/^(?:https?:)?\/\//i.test(url)) throw new Error(`Automatic external request is not offline: ${referring} -> ${url}`);
    if (/^(?:data:|#)/.test(url)) return null;
    if (/[?#]/.test(url) || /^[a-z]+:/i.test(url)) throw new Error(`Uninventoried asset URL: ${url}`);
    const path = portable(relative(sourceRoot, resolve(
      url.startsWith('/') ? sourceRoot : dirname(diskPath(sourceRoot, referring)),
      ...url.replace(/^\//, '').split('/'))));
    if (!inside(sourceRoot, diskPath(sourceRoot, path))) throw new Error(`Asset escapes the source tree: ${url}`);
    return path;
  };
  const kindOf = path => path.endsWith('.css') ? 'stylesheet' : path.endsWith('.woff2') ? 'font' :
    path.endsWith('.wav') ? 'audio' : 'asset';
  const visitResource = (url, referring) => {
    const path = routePath(url, referring);
    if (!path || files.has(path)) return;
    if (path.endsWith('.mjs')) return visitModule(path);
    const data = read(path);
    add(path, kindOf(path), data);
    if (path.endsWith('.css')) {
      for (const match of data.toString('utf8').matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) visitResource(match[2], path);
    }
  };
  for (const tag of transformed.launcher.matchAll(/<(?:script|link|img|source|audio|video|iframe|embed|object)\b[^>]*>/g)) {
    if (/^<link\b/.test(tag[0]) && !/\brel="(?:stylesheet|icon)"/.test(tag[0])) continue;
    for (const url of tag[0].matchAll(/\b(?:href|src|poster|data)="([^"]+)"/g)) visitResource(url[1], ENTRY);
  }
  // The Space Academy world atlases belong to the retired launcher scene; Pit Stop draws its own SVG sky.
  const unusedAtlasRoot = '/games/clockmaster/art/universe/';
  for (const path of modules) {
    const text = read(path).toString('utf8');
    if (/\b(?:XMLHttpRequest|WebSocket|EventSource|Worker|sendBeacon)\b/.test(text)) {
      throw new Error(`Source drift: unreviewed networking API in ${path}`);
    }
    const fetches = [...text.matchAll(/\bfetch\s*\(/g)].length;
    const images = [...text.matchAll(/\bnew\s+(?:Image|Audio)\s*\(/g)].length;
    const expectedFetches = path === 'js/space-academy/art.mjs' ? 1 : 0;
    const expectedMedia = path === 'js/space-academy/art.mjs' || path === 'js/space-academy/pitstop/audio.mjs' ? 1 : 0;
    if (fetches !== expectedFetches || images !== expectedMedia) {
      throw new Error(`Source drift: automatic asset requests changed in ${path}`);
    }
    for (const url of text.matchAll(/(['"`])(\/(?:images|games|fonts|css|js|audio)\/[^'"`\s<>{}]+)\1/g)) {
      if (url[2] !== unusedAtlasRoot) visitResource(url[2], path);
    }
  }
  for (const path of modules.keys()) {
    if (path.startsWith('js/space-academy/pitstop/') && /\b(?:SpaceScene|ART_ROOT)\b/.test(read(path).toString('utf8'))) {
      throw new Error(`Source drift: Pit Stop now uses the world atlases (${path}); add them to the offline inventory.`);
    }
  }
  for (const license of ['fonts/Inter-OFL.txt', 'fonts/Nunito-OFL.txt']) {
    const family = license.slice('fonts/'.length, license.indexOf('-OFL'));
    if ([...files.keys()].some(path => path.startsWith(`fonts/${family.toLowerCase()}-`))) add(license, 'font-license');
  }
  const outputFiles = ordered(files.values()).map(({ data, ...entry }) => entry);
  const sourceFiles = ordered(sources.values()).map(({ data, ...entry }) => entry);
  const manifest = {
    owner: OWNER, schemaVersion: 1,
    entrypoint: `/${ENTRY}`, origin: 'https://appassets.androidplatform.net',
    canonicalOrigin: 'https://otterlygames.com',
    overlays: transformed.overlays,
    sources: sourceFiles,
    files: outputFiles,
    assets: outputFiles.filter(file => !['module', 'launcher'].includes(file.kind)).map(file => file.path),
    stats: {
      files: files.size, bytes: outputFiles.reduce((sum, file) => sum + file.bytes, 0),
      modules: modules.size, sourceFiles: sources.size, overlaidFiles: 4, brandFiles: BRAND_FILES.length,
    },
    exclusions: ['website navigation/footer/includes', 'other games and native originals', 'retired Space Academy launcher and world atlases', 'research/source provenance paths', 'analytics, website supporter codes and Ko-fi links'],
  };
  manifest.bundleSha256 = hash(JSON.stringify(manifest));
  return { sources, files, manifest, data: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

function validOwnedPath(path) {
  return typeof path === 'string' && path !== MANIFEST_NAME && /^[a-zA-Z0-9_./-]+$/.test(path) &&
    !path.startsWith('/') && !path.split('/').some(part => part === '..' || part === '.' || !part);
}

function inspectOutput(target) {
  if (!existsSync(target)) return { files: new Map(), directories: [] };
  if (!lstatSync(target).isDirectory()) throw new Error('Output must be a directory.');
  const marker = join(target, MANIFEST_NAME);
  let previous;
  if (existsSync(marker)) {
    if (lstatSync(marker).isSymbolicLink()) throw new Error('Ownership manifest cannot be a symlink.');
    previous = JSON.parse(readFileSync(marker, 'utf8'));
    if (previous.owner !== OWNER || previous.schemaVersion !== 1 || !Array.isArray(previous.files)) {
      throw new Error('Unknown output ownership manifest; nothing was changed.');
    }
  } else if (readdirSync(target).length) throw new Error('Refusing a nonempty, unowned output directory.');
  const files = new Map();
  for (const file of previous?.files ?? []) {
    if (!validOwnedPath(file.path) || !/^[a-f0-9]{64}$/.test(file.sha256) || files.has(file.path)) {
      throw new Error('Invalid owned file inventory; nothing was changed.');
    }
    files.set(file.path, file);
  }
  const directories = [];
  const walk = path => {
    for (const item of readdirSync(path, { withFileTypes: true })) {
      const full = join(path, item.name);
      const name = portable(relative(target, full));
      if (item.isSymbolicLink()) throw new Error(`Unowned symlink in output: ${name}`);
      if (item.isDirectory()) {
        if (![...files.keys()].some(file => file.startsWith(`${name}/`))) throw new Error(`Unknown/unowned output directory: ${name}`);
        directories.push(full);
        walk(full);
      } else if (name !== MANIFEST_NAME) {
        const owned = files.get(name);
        if (!owned || !item.isFile()) throw new Error(`Unknown/unowned output file: ${name}`);
        if (hash(readFileSync(full)) !== owned.sha256) throw new Error(`Owned output was modified outside the exporter: ${name}`);
      }
    }
  };
  walk(target);
  return { files, directories };
}

export function prepareSpaceAcademyAndroid(output, { sourceRoot = REPOSITORY_ROOT } = {}) {
  sourceRoot = realpathSync(sourceRoot);
  const target = guardOutput(output, sourceRoot);
  const previous = inspectOutput(target);
  const bundle = createBundle(sourceRoot);
  // Validate the complete snapshot before making any output directories or changing an existing export.
  for (const source of bundle.sources.values()) {
    if (hash(readFileSync(diskPath(sourceRoot, source.path))) !== source.sha256) {
      throw new Error(`Source drift during export: ${source.path}. Retry after source changes finish.`);
    }
  }
  inspectOutput(target);
  mkdirSync(target, { recursive: true });
  let written = 0;
  for (const file of bundle.files.values()) {
    const full = diskPath(target, file.path);
    if (existsSync(full) && hash(readFileSync(full)) === file.sha256) continue;
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, file.data);
    written++;
  }
  let removed = 0;
  for (const path of previous.files.keys()) {
    if (!bundle.files.has(path) && existsSync(diskPath(target, path))) {
      unlinkSync(diskPath(target, path));
      removed++;
    }
  }
  for (const directory of previous.directories.sort((a, b) => b.length - a.length)) {
    if (existsSync(directory) && readdirSync(directory).length === 0) rmdirSync(directory);
  }
  writeFileSync(join(target, MANIFEST_NAME), bundle.data);
  return { output: target, manifestPath: join(target, MANIFEST_NAME), manifest: bundle.manifest, written, removed };
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 2 || args[0] !== '--output' || !args[1] || args[1].startsWith('--')) {
      throw new Error('Usage: node scripts\\prepare-space-academy-android.mjs --output <directory>');
    }
    const result = prepareSpaceAcademyAndroid(args[1]);
    console.log(JSON.stringify({
      output: result.output, manifest: result.manifestPath, bundleSha256: result.manifest.bundleSha256,
      ...result.manifest.stats, written: result.written, removedStaleOwnedFiles: result.removed,
    }, null, 2));
  } catch (error) {
    console.error(`Space Academy Android assets: ${error.message}`);
    process.exitCode = 1;
  }
}
