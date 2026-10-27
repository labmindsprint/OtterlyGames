import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareOtterelementWeb, replaceExact, replaceRegion } from './prepare-otterelement-web.mjs';

// The patch step of the Otter Element website preview (see scripts/otterelement-web/README.md).
const here = fileURLToPath(new URL('.', import.meta.url));
const site = resolve(here, '..');
const overlays = join(here, 'otterelement-web', 'src');
const game = resolve(process.env.OTTERELEMENT_SOURCE || join(site, '..', 'Otter Element'));

test('a patch that no longer matches the game fails instead of shipping', () => {
  assert.equal(replaceExact('a b a', 'b', 'c', 1, 'x.ts'), 'a c a');
  assert.throws(() => replaceExact('a b a', 'a', 'c', 1, 'x.ts'), /Otter Element source changed in x\.ts \(2 matches, expected 1\)/);
  assert.throws(() => replaceExact('a b a', 'z', 'c', 1, 'x.ts'), /0 matches/);
  assert.equal(replaceRegion('one [two] three', '[', ']', '(2)'), 'one (2) three');
  assert.throws(() => replaceRegion('[a] [b]', '[', ']', 'x'), /not unique/);
  assert.throws(() => replaceRegion('no markers', '[', ']', 'x'), /not found/);
});

test('every patch applies to the current game source, on a copy only', { skip: !existsSync(join(game, 'src', 'main.tsx')) && 'the Otter Element checkout is not next to this site' }, () => {
  const workspace = mkdtempSync(join(process.env.OTTERELEMENT_WORKSPACE_ROOT || tmpdir(), 'otterelement-patch-test-'));
  try {
    const before = readFileSync(join(game, 'src', 'game', 'loop.ts'), 'utf8');
    cpSync(join(game, 'src'), join(workspace, 'src'), { recursive: true, filter: (path) => !/\.test\.tsx?$/.test(path) });
    prepareOtterelementWeb(workspace, game);
    const loop = readFileSync(join(workspace, 'src', 'game', 'loop.ts'), 'utf8');
    assert.match(loop, /PREVIEW_NODE_CAP as PLAYABLE_ELEMENTS/);
    for (const file of ['previewEnv.ts', 'previewCap.ts', 'components/PreviewEnd.tsx', 'components/SiegeBadge.tsx', 'components/shop/ShopSheet.tsx']) {
      assert.equal(readFileSync(join(workspace, 'src', file), 'utf8'), readFileSync(join(overlays, file), 'utf8'), `${file} comes from the overlay`);
    }
    assert.equal(readFileSync(join(game, 'src', 'game', 'loop.ts'), 'utf8'), before, 'the game checkout is untouched');
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('the overlay will not write into the game or the website', () => {
  assert.throws(() => prepareOtterelementWeb(site, game), /Refusing to apply website overlays/);
  assert.throws(() => prepareOtterelementWeb(join(site, 'scripts'), game), /Refusing to apply website overlays/);
});
