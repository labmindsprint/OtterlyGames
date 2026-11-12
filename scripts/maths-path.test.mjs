import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMathsPath, loadData, mathsPages, redirectPages, redirects, classRoute, chapterRoute } from './build-maths-path.mjs';
import { ARCHIVE_ROUTES } from './build-site.mjs';
import { WIDGETS } from '../js/maths-path/widgets.mjs';
import { createProgress, PASS_MARK, CHECK_LENGTH, KEY } from '../js/maths-path/progress.mjs';
import { createMission } from '../js/space-academy/questions.mjs';
import { getChapter, getGrade } from '../js/space-academy/curriculum.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = loadData(root);
const live = data.classes.filter((c) => c.live);
const inventory = JSON.parse(readFileSync(join(root, '_data', 'public-pages.json'), 'utf8'));
const inventoried = new Set((inventory.pages ?? inventory).map((p) => p.route ?? p));

test('every live chapter has outcomes, vocabulary, 3-5 See-it screens and a Try-it activity', () => {
  assert.ok(live.length >= 1);
  for (const cls of live) for (const ch of cls.chapters) {
    const id = `${cls.id}/${ch.id}`;
    assert.ok(ch.outcomes?.length >= 3, `${id} outcomes`);
    assert.ok(ch.vocab?.length >= 2, `${id} vocab`);
    assert.ok(ch.see?.length >= 3 && ch.see.length <= 5, `${id} see-it screens`);
    assert.ok(ch.try?.length >= 1, `${id} try-it`);
    for (const t of ch.try) assert.ok(WIDGETS[t.widget.w] ?? Object.hasOwn(WIDGETS, t.widget.w), `${id} unknown widget ${t.widget.w}`);
    for (const s of ch.see) if (s.w) assert.ok(Object.hasOwn(WIDGETS, s.w.w), `${id} unknown see widget ${s.w.w}`);
  }
});

test('every class lists chapters with outcomes, and Class 1 chapters map to production Space Academy chapters', () => {
  for (const cls of data.classes) {
    assert.ok(cls.chapters.length >= 6, `${cls.id} chapters`);
    for (const ch of cls.chapters) assert.ok(ch.outcomes?.length, `${cls.id}/${ch.id} outcomes`);
  }
  for (const ch of data.classes.find((c) => c.id === 'class-1').chapters) assert.ok(getChapter('class-1', ch.source?.split('/')[1] ?? ch.id));
});

test('generated pages are inventoried, link to inventoried routes, and avoid unaffiliated exam names', () => {
  const pages = [...mathsPages(data), ...redirectPages(data)];
  const routes = new Set(mathsPages(data).map((p) => p.route));
  for (const page of mathsPages(data)) assert.ok(inventoried.has(page.route), `${page.route} missing from public-pages.json`);
  for (const page of pages) {
    assert.doesNotMatch(page.html, /\b(IMO|SOF)\b/, `${page.route} names an unaffiliated body`);
    for (const [, href] of page.html.matchAll(/href="(\/learn\/maths\/[^"#?]*)/g)) assert.ok(routes.has(href), `${page.route} links to missing ${href}`);
    for (const [, src] of page.html.matchAll(/(?:src|href)="(\/(?:images|js|css|tools)\/[^"#?]+)/g)) assert.ok(existsSync(join(root, ...src.slice(1).split('/'))), `${page.route} references missing ${src}`);
  }
  for (const cls of live) for (const ch of cls.chapters) assert.ok(routes.has(chapterRoute(cls, ch)));
  for (const cls of data.classes.filter((c) => !c.live)) {
    const html = mathsPages(data).find((p) => p.route === classRoute(cls)).html;
    assert.match(html, /Lesson coming/);
    for (const ch of cls.chapters) assert.ok(!routes.has(chapterRoute(cls, ch)), `${cls.id}/${ch.id} must not have a page yet`);
  }
});

test('chapter pages keep the five steps, a no-JS lesson and a parents box', () => {
  const html = mathsPages(data).find((p) => p.route === '/learn/maths/class-1/time/').html;
  for (const step of ['See it', 'Try it', 'Practise it', 'Print it', 'Check it']) assert.ok(html.includes(step), step);
  assert.match(html, /For parents/);
  assert.match(html, /Play Clock Master/);
  assert.match(html, /worksheet-builder\.html\?activity=academy&(amp;)?grade=class-1/);
  assert.match(html, /class="mp-screen"/);
});

test('old Class 1 Olympiad-style pages redirect to inventoried new pages and are archive routes', () => {
  const list = redirects(data);
  // Redirects cover the old Space Academy pages, the old hub and the renamed preparation guide; a Maths Path chapter without an old page (PP2 time) has none.
  assert.equal(list.length, 2 + live.reduce((n, cls) => n + 1 + getGrade(cls.grade ?? cls.id).chapters.length, 0));
  for (const { from, to } of list) {
    assert.ok(ARCHIVE_ROUTES.includes(from), `${from} not in ARCHIVE_ROUTES`);
    assert.ok(inventoried.has(to), `${to} not inventoried`);
    assert.ok(!inventoried.has(from), `${from} still inventoried`);
  }
});

test('generation is deterministic and the committed files are current', () => {
  assert.deepEqual(mathsPages(data).map((p) => p.html), mathsPages(loadData(root)).map((p) => p.html));
  const result = buildMathsPath({ root, write: false });
  assert.equal(result.changed, 0, `stale: ${result.files?.join(', ')}`);
});

test('mastery check uses the production generator with enough questions for a 4/5 pass', () => {
  assert.equal(PASS_MARK, 4);
  assert.equal(CHECK_LENGTH, 5);
  for (const ch of data.classes.find((c) => c.id === 'class-1').chapters) {
    const id = ch.source?.split('/')[1] ?? ch.id;
    const a = createMission({ grade: 'class-1', chapter: id, level: 1, seed: 'mp-test-a' });
    const b = createMission({ grade: 'class-1', chapter: id, level: 1, seed: 'mp-test-b' });
    assert.ok(a.questions.length >= CHECK_LENGTH);
    assert.notDeepEqual(a.questions.map((q) => q.prompt), b.questions.map((q) => q.prompt));
  }
});

function memoryStorage({ failSet = false } = {}) {
  const map = new Map();
  return { getItem: (k) => map.get(k) ?? null, removeItem: (k) => map.delete(k), setItem(k, v) { if (failSet) throw new Error('quota'); map.set(k, v); } };
}

test('progress passes at 4/5, keeps the best score, and reports storage failures instead of hiding them', () => {
  const store = memoryStorage();
  const p = createProgress(store);
  assert.equal(p.saves, true);
  p.recordCheck('class-1', 'time', 3);
  assert.equal(p.get('class-1', 'time').passed, false);
  p.recordCheck('class-1', 'time', 4);
  p.recordCheck('class-1', 'time', 2);
  assert.deepEqual([p.get('class-1', 'time').passed, p.get('class-1', 'time').best, p.get('class-1', 'time').attempts], [true, 4, 3]);
  assert.ok(createProgress(store).get('class-1', 'time').passed, 'persisted');
  const blocked = createProgress(memoryStorage({ failSet: true }));
  assert.equal(blocked.problem, 'unavailable');
  assert.equal(blocked.recordCheck('class-1', 'time', 5), false);
  const none = createProgress(null);
  assert.equal(none.saves, false);
  const corrupt = memoryStorage(); corrupt.setItem(KEY, '{bad');
  const c = createProgress(corrupt);
  assert.equal(c.get('class-1', 'time').passed, undefined);
  assert.equal(c.problem, 'read');
});

import { seoProblems, isLearnSeoRoute } from './maths-path-seo.mjs';
import { generateAcademyWorksheet } from '../js/worksheet-academy.mjs';

const mathsRoutes = () => [...inventoried].filter((r) => isLearnSeoRoute(r));
const origin = 'https://otterlygames.com';

test('every /learn/ and Maths Path page passes the SEO rules and has a unique title and description', () => {
  const titles = new Set(); const descriptions = new Set();
  const routes = mathsRoutes();
  assert.ok(routes.includes('/learn/') && routes.includes('/learn/maths/class-1/numbers/'));
  for (const route of routes) {
    const file = join(root, ...route.slice(1).split('/'), 'index.html');
    const html = readFileSync(file, 'utf8');
    assert.deepEqual(seoProblems(html, route, origin), [], route);
    const title = html.match(/<title>([^<]*)/)[1]; const description = html.match(/name="description" content="([^"]*)"/)[1];
    assert.ok(!titles.has(title) && !descriptions.has(description), `${route} duplicates metadata`);
    titles.add(title); descriptions.add(description);
  }
});

test('the SEO checker rejects ratings, a missing LearningResource and a missing canonical', () => {
  const route = '/learn/maths/class-1/numbers/';
  const html = readFileSync(join(root, 'learn', 'maths', 'class-1', 'numbers', 'index.html'), 'utf8');
  assert.ok(seoProblems(html.replace('"isAccessibleForFree":true', '"aggregateRating":{"ratingValue":5}'), route, origin).length);
  assert.ok(seoProblems(html.replace('rel="canonical"', 'rel="alternate"'), route, origin).length);
  assert.ok(seoProblems(html.replace('<h1', '<h1 data-x></h1><h1'), route, origin).length);
});

test('redirect stubs are noindex archive routes kept out of the sitemap, while new pages are listed', () => {
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  for (const { from } of redirects(data)) {
    assert.ok(ARCHIVE_ROUTES.includes(from) || ARCHIVE_ROUTES.has?.(from), from);
    assert.ok(!sitemap.includes(`${origin}${from}<`), `${from} must not be in the sitemap`);
    assert.match(readFileSync(join(root, ...from.slice(1).split('/'), ...(from.endsWith('/') ? ['index.html'] : [])), 'utf8'), /noindex/);
  }
  for (const route of mathsRoutes()) assert.ok(sitemap.includes(`<loc>${origin}${route}</loc>`), `${route} in sitemap`);
});

test('chapter pages mount in-page Practise and Print widgets with static fallbacks and a back/next pager', () => {
  for (const cls of live) for (const ch of cls.chapters) {
    const html = readFileSync(join(root, ...chapterRoute(cls, ch).slice(1).split('/'), 'index.html'), 'utf8');
    const grade = ch.source?.split('/')[0] ?? cls.grade ?? cls.id;
    assert.match(html, new RegExp(`data-mp-practice data-grade="${grade}"`));
    assert.match(html, new RegExp(`data-mp-print data-grade="${grade}"`));
    assert.match(html, /data-mp-printed hidden/);
    assert.match(html, /Open the full worksheet builder|open the full worksheet builder/);
    assert.match(html, /aria-label="Chapter navigation"/);
    assert.ok(html.includes(`Back to ${cls.label} map`));
  }
});

test('the worksheet generator serves every chapter at every level and count the Print step offers', () => {
  for (const ch of data.classes.find((c) => c.id === 'class-1').chapters) for (const level of [1, 2, 3]) for (const count of [5, 20]) {
    const sheet = generateAcademyWorksheet({ grade: 'class-1', chapter: ch.source?.split('/')[1] ?? ch.id, level, count, seed: 'test-seed-1' });
    assert.equal(sheet.questions.length, count);
  }
});

test('Maths Path pages and scripts use no cookies, analytics, ads or third-party requests', () => {
  for (const route of mathsRoutes()) {
    const html = readFileSync(join(root, ...route.slice(1).split('/'), 'index.html'), 'utf8');
    assert.ok(!/document\.cookie|adsbygoogle|googletagmanager|google-analytics|gtag\(|<iframe/i.test(html), route);
    for (const [, src] of html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)) assert.ok(src.startsWith(origin), `${route} external ${src}`);
  }
  for (const file of ['app', 'core', 'check', 'progress', 'print', 'practice']) {
    assert.ok(!/document\.cookie|fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(readFileSync(join(root, 'js', 'maths-path', `${file}.mjs`), 'utf8')), file);
  }
});

test('progress records printed and reports when it cannot be saved', () => {
  const p = createProgress(memoryStorage());
  assert.equal(p.update('class-1', 'time', { printed: true }), true);
  assert.equal(p.get('class-1', 'time').printed, true);
  assert.equal(createProgress(memoryStorage({ failSet: true })).update('class-1', 'time', { printed: true }), false);
});

import { dataProblems } from './maths-path-schema.mjs';
import { syncInventoryText, pickList } from './build-maths-path.mjs';
import { runProgram } from '../js/maths-path/logic-board.mjs';
import { weekdayOf } from '../js/maths-path/calendar.mjs';

test('content lives in one file per class and the index lists them in order', () => {
  const index = JSON.parse(readFileSync(join(root, '_data', 'maths-path.json'), 'utf8'));
  assert.deepEqual(loadData(root).classes.map((c) => c.id), index.classes);
  for (const id of index.classes) assert.equal(JSON.parse(readFileSync(join(root, '_data', 'maths-path', `${id}.json`), 'utf8')).id, id);
});

test('the data validator accepts the shipped data and explains common authoring mistakes', () => {
  assert.deepEqual(dataProblems(data, { root }), []);
  const broken = structuredClone(data);
  const ch = broken.classes.find((c) => c.id === 'class-1').chapters[0];
  ch.outcomes = ['I can count.'];
  ch.see[0].widget = { w: 'nope', c: {} };
  ch.see[1].text = ['This is IMO practice.'];
  ch.try[0].target = null;
  ch.play = { game: 'other' };
  const problems = dataProblems(broken, { root }).join('\n');
  for (const part of ['at least 3 outcomes', 'unknown widget "nope"', 'IMO or SOF', 'needs a target object', 'play.game must be one of']) assert.ok(problems.includes(part), part);
});

test('the inventory sync keeps the committed block and the learn class picker is generated', () => {
  const text = readFileSync(join(root, '_data', 'public-pages.json'), 'utf8');
  assert.equal(syncInventoryText(text, mathsPages(data).map((p) => p.route)), text);
  assert.ok(syncInventoryText(text, ['/learn/maths/', '/learn/maths/x/']).includes('"/learn/maths/x/"'));
  assert.ok(readFileSync(join(root, 'learn', 'index.html'), 'utf8').replaceAll('\r\n', '\n').includes(pickList(data)));
});

test('every widget renders without undefined values and the new manipulatives ship a working sample', () => {
  for (const name of ['fractionBars', 'array', 'grid', 'chart', 'calendar', 'logicBoard']) {
    const w = WIDGETS[name];
    assert.ok(w?.sample?.config && w.sample.target, `${name} sample`);
    const html = w.render(w.sample.config);
    assert.ok(html.length > 50 && !/undefined|NaN|\[object/.test(html), name);
    assert.equal(typeof w.mount, 'function');
  }
  assert.equal(runProgram(WIDGETS.logicBoard.sample.config, ['E', 'E', 'N', 'N']).atGoal, true);
  assert.equal(runProgram(WIDGETS.logicBoard.sample.config, ['N', 'N']).atGoal, false);
  assert.equal(runProgram({ ...WIDGETS.logicBoard.sample.config, commands: 'turtle' }, ['forward', 'left', 'forward']).path.length, 2);
  assert.equal(weekdayOf(WIDGETS.calendar.sample.config, 1), 'Sunday');
  assert.equal(weekdayOf(WIDGETS.calendar.sample.config, 8), 'Sunday');
});

test('old Space Academy pages of a live class redirect to the chapter that teaches them, or to the class map', () => {
  const map = new Map(redirects(data).map((r) => [r.from, r.to]));
  assert.equal(map.get('/learn/olympiad/class-1/'), '/learn/maths/class-1/');
  assert.equal(map.get('/learn/olympiad/class-1/time.html'), '/learn/maths/class-1/time/');
  const fake = structuredClone(data);
  const c3 = fake.classes.find((c) => c.id === 'class-3'); c3.live = true; c3.grade = 'class-3';
  const rd = new Map(redirects(fake).map((r) => [r.from, r.to]));
  assert.equal(rd.get('/learn/olympiad/class-3/reasoning.html'), '/learn/maths/class-3/patterns/', 'first chapter that uses the source wins');
  assert.ok(rd.get('/learn/olympiad/class-3/'));
});


test('hub and old guide URL redirect to canonical pages and are excluded from the sitemap', () => {
  const map = new Map(redirects(data).map((r) => [r.from, r.to]));
  assert.equal(map.get('/learn/olympiad/'), '/learn/maths/');
  assert.equal(map.get('/learn/imo-preparation.html'), '/learn/olympiad-style-maths-preparation.html');
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  for (const from of map.keys()) assert.ok(!sitemap.includes(`otterlygames.com${from}<`), `${from} must not be in the sitemap`);
  assert.ok(sitemap.includes('/learn/olympiad-style-maths-preparation.html<'));
  assert.ok(inventoried.has('/learn/olympiad-style-maths-preparation.html'));
  assert.ok(!inventoried.has('/learn/imo-preparation.html'));
});

test('public HTML, metadata, JSON-LD and user-visible JS strings never name IMO or SOF', () => {
  const files = [];
  for (const route of inventoried) files.push(join(root, ...route.slice(1).split('/'), ...(route.endsWith('/') ? ['index.html'] : [])));
  for (const from of redirects(data).map((r) => r.from)) files.push(join(root, ...from.slice(1).split('/'), ...(from.endsWith('/') ? ['index.html'] : [])));
  for (const rel of ['js/worksheet-builder.js', 'js/space-academy/app.mjs', 'js/space-academy/curriculum.mjs', 'js/space-academy/curriculum-v1.mjs']) files.push(join(root, rel));
  for (const file of files) {
    if (!existsSync(file)) continue;
    let text = readFileSync(file, 'utf8');
    if (/\.m?js$/.test(file)) text = text.split('\n').filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line)).join('\n');
    assert.doesNotMatch(text, /\b(IMO|SOF)\b/, `${file} names IMO or SOF`);
  }
});