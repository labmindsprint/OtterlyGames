import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { prepareClockMaster } from './prepare-clockmaster-web.mjs';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2] || join(site, '..', 'Clock Master', 'Clock-Master---Time-for-Junior-Olympiad-'));
const vite = join(source, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(vite)) throw new Error(`Install the Clock Master dependencies before syncing: ${source}`);
const workspace = mkdtempSync(join(site, '.clockmaster-build-'));
const base = '/games/clockmaster/';
try {
  for (const file of ['src', 'public', 'package.json', 'vite.config.ts', 'postcss.config.mjs', 'index.html']) {
    cpSync(join(source, file), join(workspace, file), { recursive: true });
  }
  symlinkSync(join(source, 'node_modules'), join(workspace, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  prepareClockMaster(workspace, site, source);
  const result = spawnSync(process.execPath, [vite, 'build', '--mode', 'website', '--base', base,
    '--outDir', 'website', '--emptyOutDir'], { cwd: workspace, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Clock Master build failed (${result.status})`);
  const output = join(workspace, 'website');
  const manifestPath = join(output, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'), (_, value) =>
    typeof value === 'string' && value.startsWith('/') ? base + value.slice(1) : value);
  delete manifest.screenshots;
  manifest.shortcuts = [{ name: 'Start Learning', url: base }, { name: 'Time Race', url: `${base}?mode=race` }];
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  // Development art masters and promotional HTML are not runtime assets.
  for (const file of ['feature-graphic-export.html', 'feature-graphic.svg']) rmSync(join(output, file), { force: true });
  function excludeMasters(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) excludeMasters(path);
      else if (/\.(psd|xcf|blend|zip)$/i.test(entry.name) || /(?:-master|-original)\./i.test(entry.name)) rmSync(path);
    }
  }
  excludeMasters(output);
  writeFileSync(join(output, 'version.json'), JSON.stringify({ version: JSON.parse(readFileSync(join(source, 'package.json'))).version,
    mode: 'website-full-game-and-race-demo', storage: 'local-browser', rewardedAds: false }, null, 2) + '\n');
  const target = join(site, 'games', 'clockmaster');
  mkdirSync(target, { recursive: true });
  cpSync(output, target, { recursive: true });
  function removeStale(dir, relative = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(relative, entry.name);
      if (entry.isDirectory()) removeStale(join(dir, entry.name), path);
      else if (!existsSync(join(output, path))) rmSync(join(dir, entry.name));
    }
  }
  removeStale(target);
  console.log(`Updated ${target}`);
} finally {
  // Removing a junction unlinks it, never recurses into the installed dependencies.
  rmSync(join(workspace, 'node_modules'), { force: true, recursive: true });
  rmSync(workspace, { recursive: true, force: true });
}
