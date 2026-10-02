import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2] || join(site, '..', 'Math Tank'));
const next = join(source, 'node_modules', 'next', 'dist', 'bin', 'next');
if (!existsSync(next)) throw new Error(`Install Math Tank dependencies before syncing: ${source}`);
const workspace = mkdtempSync(join(tmpdir(), 'mathtank-website-'));
try {
  // An isolated source tree keeps this export away from the native release and dev server.
  for (const file of ['src', 'public', 'package.json', 'tsconfig.json', 'next.config.js', 'tailwind.config.js', 'postcss.config.js']) {
    cpSync(join(source, file), join(workspace, file), { recursive: true });
  }
  const { symlinkSync } = await import('node:fs');
  symlinkSync(join(source, 'node_modules'), join(workspace, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const result = spawnSync(process.execPath, [next, 'build'], {
    cwd: workspace, stdio: 'inherit',
    env: { ...process.env, NEXT_PUBLIC_BASE_PATH: '/games/mathtank', NEXT_PUBLIC_WEBSITE_DEMO: 'true', NEXT_BUILD_DIR: '.next' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Math Tank website build failed (${result.status})`);
  const output = join(workspace, 'out');
  const target = join(site, 'games', 'mathtank');
  // Ship only battle assets; no universe atlases, native audio masters, or development pages.
  const selected = ['index.html', 'index.txt', '404.html', '_next', 'art-preview/scout', 'art-preview/tanks', 'art-preview/decals', 'sounds/battle'];
  const staged = join(workspace, 'website');
  mkdirSync(staged);
  for (const file of selected) {
    if (!existsSync(join(output, file))) throw new Error(`Missing export: ${file}`);
    cpSync(join(output, file), join(staged, file), { recursive: true });
  }
  const originals = join(staged, 'sounds', 'battle', 'Original');
  if (existsSync(originals)) rmSync(originals, { recursive: true });
  writeFileSync(join(staged, 'version.json'), JSON.stringify({
    version: JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')).version,
    mode: 'website-battle-demo',
  }, null, 2) + '\n');
  mkdirSync(target, { recursive: true });
  cpSync(staged, target, { recursive: true });
  function removeStale(dir, relative = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(relative, entry.name);
      if (entry.isDirectory()) {
        removeStale(join(dir, entry.name), path);
      } else if (!existsSync(join(staged, path))) {
        unlinkSync(join(dir, entry.name));
      }
    }
  }
  removeStale(target);
  console.log(`Updated ${target}`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
