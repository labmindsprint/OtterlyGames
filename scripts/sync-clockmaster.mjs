import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2] || join(site, '..', 'Clock Master', 'Clock-Master---Time-for-Junior-Olympiad-'));
const vite = join(source, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(vite)) throw new Error(`Install the Clock Master dependencies before syncing: ${source}`);
const output = mkdtempSync(join(tmpdir(), 'clockmaster-website-'));
const base = '/games/clockmaster/';
try {
  const result = spawnSync(process.execPath, [vite, 'build', '--mode', 'website', '--base', base,
    '--outDir', output, '--emptyOutDir'], { cwd: source, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Clock Master build failed (${result.status})`);

  // Vite rebases HTML and imported assets; public manifest URLs need their own scope.
  const manifestPath = join(output, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'), (_, value) =>
    typeof value === 'string' && value.startsWith('/') ? base + value.slice(1) : value);
  delete manifest.screenshots; // The native release screenshots are not shipped with the web app.
  manifest.shortcuts = [
    { name: 'Start Learning', url: base },
    { name: 'Time Race', url: `${base}?mode=race` },
  ];
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  const target = join(site, 'games', 'clockmaster');
  mkdirSync(target, { recursive: true });
  cpSync(output, target, { recursive: true });
  for (const file of readdirSync(join(target, 'assets'))) {
    if (/\.(js|css)$/.test(file) && !existsSync(join(output, 'assets', file))) {
      unlinkSync(join(target, 'assets', file));
    }
  }
  console.log(`Updated ${target}`);
} finally {
  rmSync(output, { recursive: true, force: true });
}
