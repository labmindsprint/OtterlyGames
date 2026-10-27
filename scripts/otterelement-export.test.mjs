import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Checks the committed website preview of Otter Element (games/otterelement). It needs no game checkout.
const site = fileURLToPath(new URL('..', import.meta.url));
const root = join(site, 'games', 'otterelement');

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [relative(root, path).split(sep).join('/')];
  });
}
const all = files(root);
const text = (name) => readFileSync(join(root, name), 'utf8');
const code = all.filter((name) => /\.(js|css|html)$/.test(name));

test('the export records what it was built from and the two-node cap', () => {
  const version = JSON.parse(text('version.json'));
  assert.equal(version.mode, 'website-two-node-preview');
  assert.equal(version.nodeCap, 2);
  assert.equal(version.storage, 'local-browser');
  assert.match(version.source.commit, /^[0-9a-f]{40}$/);
  assert.match(version.source.fingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.match(version.overlay, /^sha256:[0-9a-f]{64}$/);
});

test('the export has an entry page whose scripts and styles exist and stay on this site', () => {
  const html = text('index.html');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  const local = refs.filter((ref) => /\.(js|css)$/.test(ref));
  assert.ok(local.some((ref) => ref.endsWith('.js')), 'the entry page loads a script');
  for (const ref of refs.filter((value) => /^https?:/.test(value))) assert.fail(`the entry page loads ${ref}`);
  for (const ref of local) assert.ok(existsSync(join(root, ref.replace(/^\.?\/?(games\/otterelement\/)?/, ''))), `${ref} is exported`);
});

test('Siege, the developer pages and the game privacy page are not exported', () => {
  for (const name of all) {
    assert.ok(!/^(dev|art\/siege|art\/td[^/]*)\//.test(name), `${name} must not be exported`);
    assert.notEqual(name, 'privacy.html');
  }
});

test('the build holds no live service, ad or billing address, and no Siege wording in the save notices', () => {
  for (const name of code) {
    const body = text(name);
    for (const needle of ['azurewebsites.net', 'googlesyndication', 'play.google.com/billing', 'Lab Siege plans', 'Full Lab Siege transfer']) {
      assert.ok(!body.includes(needle), `${name} contains ${needle}`);
    }
  }
});

test('the stylesheet keeps the rules the real arena page and the save notices use', () => {
  const css = code.filter((name) => name.endsWith('.css')).map(text).join('\n');
  // Both come in through files the preview replaces, so a stub that forgets their import loses them silently.
  assert.ok(css.includes('.hl4'), 'the home layout styles are exported');
  assert.ok(css.includes('.save-error.is-notice'), 'the save notice styles are exported');
});

test('the full-game link is the official Google Play listing and the preview keeps its own storage', () => {
  const body = code.filter((name) => name.endsWith('.js')).map(text).join('\n');
  assert.ok(body.includes('https://play.google.com/store/apps/details?id=com.otterlygames.otterelement'));
  assert.ok(body.includes('otter-element-web-preview'));
  assert.ok(body.includes('oe-web-preview:'));
  assert.ok(body.includes('closed testing for invited testers'));
});
