import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Builds the Otter Element web runtime from its own project and exports it for the website preview.
// Usage: node scripts/sync-otterelement.mjs [path-to-Otter-Element-project]
const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2] || join(site, '..', 'Otter Element'));
const vite = join(source, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(vite)) throw new Error(`Install the Otter Element dependencies before syncing: ${source}`);
const output = mkdtempSync(join(tmpdir(), 'otterelement-build-'));
const target = join(site, 'games', 'otterelement');
try {
  const result = spawnSync(process.execPath, [vite, 'build', '--outDir', output, '--emptyOutDir'], { cwd: source, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Otter Element build failed (${result.status})`);
  // Developer-only tools are never part of a shipped build.
  rmSync(join(output, 'dev'), { recursive: true, force: true });
  rmSync(target, { recursive: true, force: true });
  cpSync(output, target, { recursive: true });
  const { version } = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
  writeFileSync(join(target, 'version.json'), JSON.stringify({ version, syncedAt: new Date().toISOString() }, null, 2) + '\n');
  console.log(`Exported Otter Element ${version} to ${target}`);
} finally {
  rmSync(output, { recursive: true, force: true });
}
