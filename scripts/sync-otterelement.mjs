import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, rmdirSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { prepareOtterelementWeb } from './prepare-otterelement-web.mjs';

// Builds the website preview of Otter Element (the first two nodes of the current game) and exports it to games/otterelement.
// The build runs on an isolated copy of the game's source with the preview overlays applied (see scripts/otterelement-web/README.md);
// the game's own working tree is only read.
// Usage: node scripts/sync-otterelement.mjs [path-to-Otter-Element-project]
// OTTERELEMENT_WORKSPACE_ROOT chooses the directory the isolated copy is made in (default: the OS temp directory).
const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '..');
const source = resolve(process.argv[2] || join(site, '..', 'Otter Element'));
const bin = (...parts) => join(source, 'node_modules', ...parts);
for (const tool of [bin('vite', 'bin', 'vite.js'), bin('typescript', 'bin', 'tsc')]) {
  if (!existsSync(tool)) throw new Error(`Install the Otter Element dependencies before syncing: ${source}`);
}

// Siege is not part of the preview: its art, the developer pages and the game's own privacy page are not copied.
const LEFT_OUT = ['dev', 'privacy.html', 'art/siege', 'art/td', 'art/td-hifi', 'art/td-pads', 'art/td-ui-v3'];
const underPublic = (path) => relative(join(source, 'public'), path).split(sep).join('/');
const publicFilter = (path) => {
  const rel = underPublic(path);
  return !LEFT_OUT.some((left) => rel === left || rel.startsWith(`${left}/`));
};
const srcFilter = (path) => !/\.test\.tsx?$/.test(path);

function files(root, base = root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? files(path, base) : [relative(base, path).split(sep).join('/')];
  }).sort();
}

function fingerprint(root, entries) {
  const hash = createHash('sha256');
  for (const entry of entries) {
    hash.update(`${entry}\0`);
    hash.update(readFileSync(join(root, entry)));
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

function git(...args) {
  const result = spawnSync('git', ['-C', source, ...args], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

function run(label, script, args, cwd, env) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd, stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed (${result.status})`);
}

// A string that only the live ranking service, purchases and ads would need; none of them is in the preview.
const FORBIDDEN_IN_BUILD = ['azurewebsites.net', 'googlesyndication', 'play.google.com/billing'];

const workspace = mkdtempSync(join(process.env.OTTERELEMENT_WORKSPACE_ROOT || tmpdir(), 'otterelement-website-'));
try {
  // Environment files stay behind on purpose: the live service address and key are not part of the preview.
  cpSync(join(source, 'src'), join(workspace, 'src'), { recursive: true, filter: srcFilter });
  cpSync(join(source, 'public'), join(workspace, 'public'), { recursive: true, filter: publicFilter });
  for (const file of ['index.html', 'package.json', 'tsconfig.json', 'vite.config.ts']) cpSync(join(source, file), join(workspace, file));
  const copied = [...files(join(workspace, 'src')).map((file) => `src/${file}`), ...files(join(workspace, 'public')).map((file) => `public/${file}`), 'index.html', 'package.json', 'tsconfig.json', 'vite.config.ts'];
  const sourceFingerprint = fingerprint(workspace, copied);
  symlinkSync(bin(), join(workspace, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');

  prepareOtterelementWeb(workspace, source);
  cpSync(join(source, 'public', 'art', 'siege', 'otter'), join(workspace, 'public', 'art', 'guide-otter'), { recursive: true });
  writeFileSync(join(workspace, 'tsconfig.preview.json'), JSON.stringify({
    extends: './tsconfig.json',
    compilerOptions: { noUnusedLocals: false, noUnusedParameters: false },
    include: [],
    files: ['src/main.tsx'],
  }, null, 2));

  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('VITE_')));
  run('Otter Element type check', bin('typescript', 'bin', 'tsc'), ['-p', 'tsconfig.preview.json'], workspace, env);
  const dist = join(workspace, 'dist');
  run('Otter Element website build', bin('vite', 'bin', 'vite.js'), ['build', '--outDir', dist, '--emptyOutDir'], workspace, env);

  for (const left of LEFT_OUT) {
    if (existsSync(join(dist, left))) throw new Error(`The build contains ${left}, which the preview leaves out`);
  }
  for (const file of files(dist).filter((name) => /\.(js|css|html)$/.test(name))) {
    const text = readFileSync(join(dist, file), 'utf8');
    const hit = FORBIDDEN_IN_BUILD.find((needle) => text.includes(needle));
    if (hit) throw new Error(`The build references ${hit} (${file}); the preview must not reach it`);
  }

  const status = git('status', '--porcelain', '--', 'src', 'public', 'index.html', 'package.json', 'tsconfig.json', 'vite.config.ts');
  const overlayFiles = files(join(here, 'otterelement-web', 'src'));
  const version = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')).version;
  const staged = join(workspace, 'website');
  cpSync(dist, staged, { recursive: true });
  writeFileSync(join(staged, 'version.json'), JSON.stringify({
    version,
    mode: 'website-two-node-preview',
    nodeCap: 2,
    storage: 'local-browser',
    syncedAt: new Date().toISOString(),
    source: { commit: git('rev-parse', 'HEAD'), uncommittedChanges: status === null ? null : status.length > 0, fingerprint: sourceFingerprint },
    overlay: fingerprint(here, [...overlayFiles.map((file) => `otterelement-web/src/${file}`), 'prepare-otterelement-web.mjs']),
  }, null, 2) + '\n');

  const target = join(site, 'games', 'otterelement');
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(staged, target, { recursive: true });
  console.log(`Exported the Otter Element ${version} two-node preview to ${target} (${files(target).length} files)`);
} finally {
  // The dependency folder is a link to the game's own; remove the link itself and never what it points to.
  try { if (statSync(join(workspace, 'node_modules')).isDirectory()) rmdirSync(join(workspace, 'node_modules')); } catch { /* not created */ }
  rmSync(workspace, { recursive: true, force: true });
}
