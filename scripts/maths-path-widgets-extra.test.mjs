import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { WIDGETS } from '../js/maths-path/widgets.mjs';
import { kindOf } from '../js/maths-path/angle.mjs';
import { formatNumber, numberWords } from '../js/maths-path/place-value-big.mjs';
import { dataProblems } from './maths-path-schema.mjs';
import { loadData } from './build-maths-path.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('angle and big place-value widgets render with samples and no undefined values', () => {
  for (const name of ['angle', 'placeValueBig']) {
    const w = WIDGETS[name];
    assert.ok(w?.sample?.config && w.sample.target, `${name} sample`);
    const html = w.render(w.sample.config);
    assert.ok(html.length > 200 && !/undefined|NaN|\[object/.test(html), name);
  }
  assert.match(WIDGETS.angle.render({ angle: 90 }), /right angle/);
  assert.match(WIDGETS.angle.render({ angle: 360 }), /full turn/i);
  assert.match(WIDGETS.placeValueBig.render({ value: 2405000, cols: 8 }), /24,05,000/);
});

test('angle kinds, Indian and international grouping and number words are right', () => {
  assert.deepEqual([0, 45, 90, 135, 180, 270, 360].map(kindOf), ['zero', 'acute', 'right', 'obtuse', 'straight', 'reflex', 'full']);
  assert.equal(formatNumber(24050000, 'indian'), '2,40,50,000');
  assert.equal(formatNumber(2405000, 'indian'), '24,05,000');
  assert.equal(formatNumber(2405000, 'international'), '2,405,000');
  assert.equal(formatNumber(4265, 'indian'), '4,265');
  assert.equal(numberWords(2405000, 'indian'), 'twenty-four lakh five thousand');
  assert.equal(numberWords(2405000, 'international'), 'two million four hundred five thousand');
  assert.equal(numberWords(40605), 'forty thousand six hundred five');
});

test('shipped chapters use the new widgets and the data still validates', () => {
  const data = loadData(root);
  assert.deepEqual(dataProblems(data, { root }), []);
  const used = (id, chapter) => data.classes.find((c) => c.id === id).chapters.find((c) => c.id === chapter).try.map((t) => t.widget.w);
  assert.ok(used('class-5', 'geometry').filter((w) => w === 'angle').length >= 2);
  for (const id of ['class-3', 'class-4', 'class-5', 'class-2']) assert.ok(used(id, 'numbers').includes('placeValueBig'), id);
  assert.ok(!used('class-2', 'numbers').includes('array'), 'class 2 no longer fakes a hundred with an array');
});

const MIME = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };
async function browser() {
  const candidates = [process.env.PLAYWRIGHT_CORE, 'C:\\Namasya Development\\Otter Element\\node_modules\\playwright-core'].filter(Boolean);
  const dir = candidates.find((c) => existsSync(c));
  if (!dir) return null;
  try {
    const { chromium } = createRequire(pathToFileURL(join(dir, 'x.js')))('playwright-core');
    return await chromium.launch({ channel: 'msedge' });
  } catch { return null; }
}

test('in a real browser: pointer drag and arrow keys build angles, and the columns make a target number', async (t) => {
  const b = await browser();
  if (!b) return t.skip('Edge or playwright-core not available');
  try {
    const page = await b.newPage({ viewport: { width: 800, height: 700 } });
    await page.route('http://mp.test/**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<link rel="stylesheet" href="/css/maths-path.css"><div id="a"></div><div id="b"></div>' });
      const file = join(root, ...decodeURIComponent(url.pathname).split('/').filter(Boolean));
      return existsSync(file) ? route.fulfill({ contentType: MIME[extname(file)] ?? 'application/octet-stream', body: readFileSync(file) }) : route.fulfill({ status: 404 });
    });
    await page.goto('http://mp.test/');
    await page.evaluate(async () => {
      const { widget } = await import('/js/maths-path/widgets.mjs');
      window.angle = widget('angle').mount(document.getElementById('a'), { angle: 30, mode: 'build' });
      window.pv = widget('placeValueBig').mount(document.getElementById('b'), { cols: 8, goal: 2405000 });
    });
    const arm = page.locator('#a [data-arm]');
    await arm.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal((await page.evaluate(() => window.angle.getState())).angle, 35);
    await page.keyboard.press('Shift+ArrowUp');
    assert.equal((await page.evaluate(() => window.angle.getState())).angle, 50);
    await page.keyboard.press('PageDown');
    await page.keyboard.press('End');
    assert.equal((await page.evaluate(() => window.angle.getState())).kind, 'full');
    await page.keyboard.press('Home');

    const box = await page.locator('#a svg').boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const at = (deg) => [cx + 70 * (box.width / 200) * Math.cos(deg * Math.PI / 180), cy - 70 * (box.width / 200) * Math.sin(deg * Math.PI / 180)];
    const [sx, sy] = at(0);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (const deg of [30, 60, 90, 120]) { const [x, y] = at(deg); await page.mouse.move(x, y, { steps: 3 }); }
    await page.mouse.up();
    const dragged = await page.evaluate(() => window.angle.getState());
    assert.equal(dragged.angle, 120);
    assert.equal(await page.evaluate(() => window.angle.matches({ kind: 'obtuse' }).ok), true);
    assert.equal(await page.evaluate(() => window.angle.matches({ angle: 90 }).ok), false);

    for (const [col, times] of [[6, 2], [5, 4], [3, 5]]) {
      for (let i = 0; i < times; i++) await page.locator(`#b [data-add="${col}"]`).click();
    }
    const state = await page.evaluate(() => window.pv.getState());
    assert.equal(state.value, 2405000);
    assert.equal(await page.evaluate(() => window.pv.matches({ value: 2405000 }).ok), true);
    assert.equal((await page.locator('#b .mp-pvb-total').textContent()), '24,05,000');
    await page.getByRole('button', { name: 'International commas' }).click();
    assert.equal((await page.locator('#b .mp-pvb-total').textContent()), '2,405,000');
    // Ten in one column trades up and keeps the total.
    for (let i = 0; i < 10; i++) await page.locator('#b [data-add="0"]').click();
    assert.equal((await page.evaluate(() => window.pv.getState())).value, 2405010);
  } finally { await b.close(); }
});
