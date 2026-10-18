import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync, rmSync, rmdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  ARCHIVE_ROUTES, buildSite, htmlTokens, normalizeRoute, renderSitemap, rewriteKnownAssets,
  stripPublicPolicy, transformArchive, transformPublicPage, validateInventory, validateTemplates,
} from './build-site.mjs';

const origin = 'https://otterlygames.com';
const templates = {
  nav: '<a class="skip-link" href="#main-content">Skip to content</a>\n<nav class="nav"><a href="/">Home</a><button id="navToggle">Menu</button></nav>',
  footer: '<footer class="footer"><a href="/privacy.html">Privacy</a></footer>',
};
const editorialTemplate = '<aside data-editorial-ad hidden aria-label="Advertisement"><p>Advertisement</p><ins data-editorial-ad-unit></ins></aside>';
const context = { templates, origin };
const ga = "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-NX29GXGV7H');";
const kofi = "kofiWidgetOverlay.draw('otterly_games',{'type':'floating-chat','floating-chat.donateButton.text':'Support me','floating-chat.donateButton.background-color':'#00b9fe','floating-chat.donateButton.text-color':'#fff'});";
const sdkTags = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-NX29GXGV7H"></script>
<script>${ga}</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5489426086320283" crossorigin="anonymous"></script>
<script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"></script><script>${kofi}</script>`;
const html = (body = '<main><h1>Home</h1></main>', { title = 'Home', description = `${title} description`, head = '', attrs = ' data-og-includes="nav,footer"' } = {}) =>
  `<!doctype html><html lang="en"><head><title>${title}</title><meta name="description" content="${description}">${head}</head><body${attrs}>${body}</body></html>`;
const transform = (source, page = { route: '/', shell: 'site' }, extra = {}) =>
  transformPublicPage(source, page, { ...context, ...extra }, 'fixture.html');
const open = (source, name) => htmlTokens(source).filter((t) => (t.kind === 'open' || t.kind === 'raw') && t.name === name);

// Fixtures live under the repository's ignored build folder, never in OS temporary storage.
function fixture(t, { pages = [{ route: '/', adsenseVerification: true }], files = {}, tools = { categories: {}, tools: [] }, blogs = { posts: [] } } = {}) {
  const base = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'build', 'site-build-fixtures');
  const root = join(base, randomUUID());
  mkdirSync(root, { recursive: true });
  const write = (file, contents) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), contents, 'utf8');
  };
  const read = (file) => readFileSync(join(root, file), 'utf8');
  for (const [file, contents] of Object.entries({
    [join('_data', 'public-pages.json')]: JSON.stringify({ origin, pages }),
    [join('_data', 'tools.json')]: JSON.stringify(tools),
    [join('_data', 'blogs.json')]: JSON.stringify(blogs),
    [join('_includes', 'nav.html')]: templates.nav,
    [join('_includes', 'footer.html')]: templates.footer,
    [join('_includes', 'editorial-ad.html')]: editorialTemplate,
    'index.html': html(),
    'sitemap.xml': 'old sitemap',
    ...files,
  })) write(file, contents);
  t.after(() => {
    rmSync(root, { recursive: true, force: true });
    try { rmdirSync(base); } catch (error) { if (!['ENOTEMPTY', 'ENOENT'].includes(error.code)) throw error; }
  });
  return { root, read, write };
}

test('replaces only site nav/footer, preserves game strings and does not duplicate on rebuild', () => {
  const gameCode = '<script>const html = `<nav class="nav">game text</nav>`; window.round = () => 42;</script>';
  const source = html('<nav class="nav"><a href="/old">Old</a></nav><nav class="game-nav">Controls</nav>' +
    '<main id="games"><h1>Game</h1></main>' + gameCode + '<footer class="footer">Old footer</footer>', { attrs: '' });
  const once = transform(source).html;
  assert.equal(transform(once).html, once);
  assert.equal(open(once, 'nav').length, 2);
  assert.match(once, /<nav class="game-nav">Controls<\/nav>/);
  assert.equal(open(once, 'footer').length, 1);
  assert.equal((once.match(/<!-- og:nav:start -->/g) ?? []).length, 1);
  assert.equal((once.match(/<!-- og:footer:end -->/g) ?? []).length, 1);
  assert.match(once, /id="main-content" tabindex="-1"><\/span>\s*<main id="games">/);
  assert.ok(once.includes(gameCode));
});

test('bakes body opt-in, focuses real main and makes includes.js deferred exactly once', () => {
  const source = html('<main><h1>Tool</h1></main><script src="/js/includes.js" async></script><script src="../js/includes.js" defer></script>');
  const once = transform(source, { route: '/tools/example.html' }).html;
  assert.doesNotMatch(once, /data-og-includes/);
  const scripts = open(once, 'script').filter((t) => t.raw.includes('includes.js'));
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].raw, '<script src="/js/includes.js" defer>');
  assert.match(once, /<main id="main-content" tabindex="-1">/);
  assert.equal(transform(once, { route: '/tools/example.html' }).html, once);
});

test('SVG accessibility titles do not replace or duplicate the document head metadata', () => {
  const craft = '<svg role="img" aria-label="Explorer craft"><title>Explorer craft</title><desc>Its fitted modules.</desc><path d="M0 0h10v10z"/></svg>';
  const once = transform(html(`<main><h1>Home</h1>${craft}</main>`)).html;
  assert.ok(once.includes(craft));
  assert.match(once, /<head><title>Home<\/title><meta name="description" content="Home description">/);
  assert.equal(transform(once).html, once);
  assert.throws(() => transform(html(craft, { title: '' })), /one nonempty title/);
  assert.throws(() => transform(html(craft, { head: '<title>Duplicate document title</title>' })), /one nonempty title/);
});

test('bakes one inert editorial placement after content on eligible routes without altering games or tools', () => {
  const extra = {
    templates: { ...templates, editorial: editorialTemplate },
    editorialRoutes: new Set(['/blog/parent-guide.html', '/parents/']),
  };
  const content = '<main><article><h1>A useful guide</h1><a href="/tools/">Try a tool</a></article></main>';
  for (const route of extra.editorialRoutes) {
    const page = { route, shell: 'site' };
    const once = transform(html(content), page, extra).html;
    assert.ok(once.includes(content.replace('<main>', '<main id="main-content" tabindex="-1">')));
    assert.match(once, /<aside data-editorial-ad hidden aria-label="Advertisement">/);
    assert.ok(once.indexOf('og:editorial-ad:start') > once.indexOf('</main>'));
    assert.ok(once.indexOf('og:editorial-ad:end') < once.indexOf('og:footer:start'));
    assert.equal((once.match(/og:editorial-ad:start/g) ?? []).length, 1);
    assert.equal(open(once, 'script').filter((t) => t.raw.includes('/js/web-game-ads.js')).length, 1);
    assert.equal(open(once, 'link').filter((t) => t.raw.includes('/css/web-ads.css')).length, 1);
    assert.doesNotMatch(once, /googlesyndication\.com/);
    assert.equal(transform(once, page, extra).html, once);
  }
  for (const route of ['/', '/blog/', '/tools/example.html', '/learn/example.html', '/play/clock-master.html', '/play/math-tank.html']) {
    const source = html(content + (route === '/blog/' ? '<noscript>Parent guides</noscript>' : ''));
    const once = transform(source, { route }, extra).html;
    assert.doesNotMatch(once, /data-editorial-ad|web-ads\.css|web-game-ads\.js/);
  }
  const nativePlacement = '<main><h1>Math Tank</h1><ins id="existing-game-ad" class="adsbygoogle" hidden></ins></main>' +
    '<script src="/js/web-game-ads.js" defer></script>';
  const game = transform(html(nativePlacement), { route: '/play/math-tank.html' }, extra).html;
  assert.match(game, /id="existing-game-ad" class="adsbygoogle" hidden/);
  assert.equal(open(game, 'script').filter((t) => t.raw.includes('/js/web-game-ads.js')).length, 1);
});

test('rejects unowned, duplicated, misplaced or unsafe editorial placements before writing', () => {
  const page = { route: '/parents/' };
  const extra = { templates: { ...templates, editorial: editorialTemplate }, editorialRoutes: new Set(['/parents/']) };
  assert.throws(() => transform(html(`<main><h1>Parents</h1>${editorialTemplate}</main>`), page, extra), /Unmanaged editorial ad/);
  const once = transform(html(), page, extra).html;
  assert.throws(() => transform(once, { route: '/tools/example.html' }, extra), /not allowed on this route/);
  assert.throws(() => transform(once.replace('<!-- og:editorial-ad:end -->', ''), page, extra), /marker pair/);
  assert.throws(() => transform(once.replace('<!-- og:footer:start -->', '<p>Later content</p><!-- og:footer:start -->'), page, extra), /must follow authored content/);
  for (const bad of [
    editorialTemplate.replace(' hidden', ''),
    editorialTemplate + editorialTemplate,
    editorialTemplate.replace('</aside>', '<script>loadAds()</script></aside>'),
    editorialTemplate.replace('<ins ', '<ins onclick="loadAds()" '),
    editorialTemplate.replace('</aside>', '<img src="https://example.com/pixel"></aside>'),
    editorialTemplate.replace('<ins ', '<ins style="background:url(https://example.com/pixel)" '),
  ]) {
    assert.throws(() => transform(html(), page, { ...extra, templates: { ...templates, editorial: bad } }),
      /hidden, labelled editorial aside/);
  }
});

test('build checks track editorial template drift and preserve authored parent content', (t) => {
  const source = html('<main><h1>Parents</h1><p>Keep this learning plan intact.</p></main>', { title: 'Parents' });
  const f = fixture(t, { pages: ['/', '/parents/'], files: { [join('parents', 'index.html')]: source } });
  assert.deepEqual(buildSite({ root: f.root, write: true }).errors, []);
  const once = f.read(join('parents', 'index.html'));
  assert.match(once, /Keep this learning plan intact/);
  assert.match(once, /og:editorial-ad:start/);
  assert.equal(buildSite({ root: f.root }).changes.length, 0);
  f.write(join('_includes', 'editorial-ad.html'), editorialTemplate.replace('<p>', '<p class="ad-label">'));
  const changed = buildSite({ root: f.root });
  assert.deepEqual(changed.errors, []);
  assert.deepEqual(changed.changes.map((change) => change.file), [join('parents', 'index.html')]);
  assert.equal(f.read(join('parents', 'index.html')), once);
});

test('bakes the same accessible arcade cards into both hubs and detects source drift', () => {
  const arcade = '<div class="arcade-grid"><a class="game-card" href="/Arcade/game.html"><h3>Ninja Shuriken</h3><p>Touch or keyboard</p></a></div>';
  const extra = { templates: { ...templates, arcade } };
  const source = html('<main><h1>Play</h1><!-- og:arcade-games:start -->old<!-- og:arcade-games:end --></main>');
  for (const route of ['/play/', '/Arcade/']) {
    const page = { route, shell: 'site' };
    const once = transform(source, page, extra).html;
    assert.ok(once.includes(arcade));
    assert.equal(transform(once, page, extra).html, once);
    assert.match(transform(once, page, { templates: { ...templates, arcade: arcade.replace('Touch or keyboard', 'Made by kids') } }).html, /Made by kids/);
    assert.throws(() => transform(source, page), /Missing _includes/);
    assert.throws(() => transform(html(), page, extra), /Expected one og:arcade-games/);
    for (const bad of [arcade + '<script>run()</script>', arcade.replace('/Arcade/game.html', 'https://example.com/game')]) {
      assert.throws(() => transform(source, page, { templates: { ...templates, arcade: bad } }), /unique local game links/);
    }
  }
});

test('adds a safe target without wrapping tools/scripts and reports legacy navigation bindings', () => {
  const binding = "<script>document.getElementById('navToggle').addEventListener('click', () => gameMenu());</script>";
  const source = html('<section><h1>Tool</h1><canvas id="tool"></canvas></section>' + binding);
  const result = transform(source);
  assert.match(result.html, /<span id="main-content" tabindex="-1"><\/span>\s*<section>/);
  assert.ok(result.html.includes(binding));
  assert.match(result.warnings[0], /fixture\.html:1: Legacy inline nav click binding retained/);
  assert.equal(transform(result.html).html, result.html);
});

test('bakes a single games registry into both hubs and detects same-count editorial drift', () => {
  const game = {
    id: 'first-game', title: 'First game', url: '/play/first-game.html', categories: ['learning'],
    genre: 'Puzzles', description: 'A puzzle to try.', note: 'Untimed.',
    art: '/images/game.webp', fit: 'icon', tone: 'purple'
  };
  const games = { categories: [{ id: 'learning', label: 'Learning' }], games: [game] };
  const source = html('<main><h1>Games</h1><!-- og:game-catalogue:start -->old<!-- og:game-catalogue:end --></main>');
  for (const route of ['/', '/play/']) {
    const page = { route, shell: 'site' };
    const once = transform(source, page, { games }).html;
    assert.match(once, /href="\/play\/first-game.html"/);
    assert.doesNotMatch(once, /og:arcade-games/);
    assert.equal(transform(once, page, { games }).html, once);
    const changed = { ...games, games: [{ ...game, title: 'An edited game' }] };
    assert.match(transform(once, page, { games: changed }).html, /An edited game/);
    assert.throws(() => transform(source, page), /catalogue needs its registry/);
  }
  assert.throws(() => transform(source, { route: '/about.html' }, { games }), /supported hub route/);
});

test('catalogue builds fail without writing when a landing page or artwork is missing', (t) => {
  const game = {
    id: 'first-game', title: 'First game', url: '/play/first-game.html', categories: ['learning'],
    genre: 'Puzzles', description: 'Try a puzzle.', note: 'Untimed.',
    art: '/images/game.webp', fit: 'icon', tone: 'purple'
  };
  const data = { categories: [{ id: 'learning', label: 'Learning' }], games: [game] };
  const source = html('<main><h1>Games</h1><!-- og:game-catalogue:start --><!-- og:game-catalogue:end --></main>');
  const f = fixture(t, { files: { 'index.html': source, [join('_data', 'games.json')]: JSON.stringify(data) } });
  let result = buildSite({ root: f.root, write: true });
  assert.match(result.errors.join('\n'), /public inventory/);
  assert.equal(f.read('index.html'), source);
  f.write(join('_data', 'public-pages.json'), JSON.stringify({ origin, pages: ['/', '/play/first-game.html'] }));
  f.write(join('play', 'first-game.html'), html('<main><h1>First game</h1></main>', { title: 'First game' }));
  result = buildSite({ root: f.root, write: true });
  assert.match(result.errors.join('\n'), /art is missing/);
  assert.equal(f.read('index.html'), source);
  f.write(join('images', 'game.webp'), 'fixture art');
  result = buildSite({ root: f.root, write: true });
  assert.deepEqual(result.errors, []);
  assert.match(f.read('index.html'), /data-game-card="first-game"/);
  assert.equal(buildSite({ root: f.root }).changes.length, 0);
  data.games[0].art = '/images/world.svg#missing';
  f.write(join('_data', 'games.json'), JSON.stringify(data));
  f.write(join('images', 'world.svg'), '<svg><symbol id="known"></symbol></svg>');
  f.write('index.html', source);
  result = buildSite({ root: f.root, write: true });
  assert.match(result.errors.join('\n'), /art symbol is missing/);
  assert.equal(f.read('index.html'), source);
});

test('keeps the skip target outside noscript/template content and repairs a misplaced target', () => {
  for (const fallback of [
    '<noscript><div><h2>Enable JavaScript</h2><p>The tool needs scripting.</p></div></noscript>',
    '<noscript><div><span id="main-content" tabindex="-1"></span><h2>Enable JavaScript</h2></div></noscript>',
    '<template><main><h2>Not rendered yet</h2></main></template>',
  ]) {
    const once = transform(html(fallback + '<section><h1>Learning tool</h1></section>')).html;
    const target = open(once, 'span').find((t) => /\bid="main-content"/.test(t.raw));
    const inertEnd = once.indexOf('</' + (fallback.startsWith('<noscript') ? 'noscript' : 'template') + '>');
    assert.ok(target.start > inertEnd);
    assert.equal((once.match(/\bid="main-content"/g) ?? []).length, 1);
    assert.match(once, /<section><h1>Learning tool<\/h1><\/section>/);
    assert.equal(transform(once).html, once);
  }
});

test('keeps standalone Arcade chrome and targets the game area without adding a site header/footer', () => {
  const source = html('<div class="game-topbar"><a href="index.html">Arcade</a></div><div class="game-area"><canvas id="game"></canvas></div><script>window.game = true;</script>', { attrs: '' });
  const page = { route: '/Arcade/game.html', shell: 'custom' };
  const once = transform(source, page).html;
  assert.equal(open(once, 'nav').length, 0);
  assert.equal(open(once, 'footer').length, 0);
  assert.equal((once.match(/class="skip-link"/g) ?? []).length, 1);
  assert.match(once, /<div class="game-area" id="main-content" tabindex="-1">/);
  assert.equal(transform(once, page).html, once);
});

test('removes only recognized SDK/bootstrap/font elements, retaining ordinary links, data and game code', () => {
  const gameCode = '<script>const angle = 3; function aim() { return angle; }</script>';
  const source = html('<main><h1>Game</h1><a href="https://ko-fi.com/otterly_games">Support</a><a href="https://example.com/?affiliate=42">Book</a>' +
    '<ins class="adsbygoogle" hidden></ins></main>' + gameCode, {
    head: sdkTags + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Nunito" rel="stylesheet"><link rel="stylesheet" href="/css/fonts.css">',
  });
  const result = transform(source, { route: '/', adsenseVerification: true });
  assert.equal(result.removals.length, 7);
  assert.doesNotMatch(result.html, /googletagmanager|googlesyndication|kofiWidgetOverlay|fonts\.googleapis|fonts\.gstatic/);
  assert.ok(result.html.includes(gameCode));
  assert.match(result.html, /href="https:\/\/ko-fi\.com\/otterly_games"/);
  assert.match(result.html, /affiliate=42/);
  assert.match(result.html, /<ins class="adsbygoogle" hidden>/);
  assert.match(result.html, /name="google-adsense-account" content="ca-pub-5489426086320283"/);
  assert.match(result.html, /href="\/css\/fonts\.css"/);
  assert.equal(transform(result.html, { route: '/', adsenseVerification: true }).html, result.html);
});

test('rejects mixed or unknown tracking code and inline remote fonts with actionable locations', () => {
  assert.throws(() => stripPublicPolicy(`\n<script>${ga} startRound();</script>`, { file: 'tools\\game.html' }),
    /tools\\game\.html:2: Unrecognized.*mixed with game code/);
  assert.throws(() => stripPublicPolicy('<script src="https://www.googletagmanager.com/gtag/js">startRound();</script>'),
    /also contains code.*preserve gameplay/);
  assert.throws(() => stripPublicPolicy('<script src="https://www.googletagmanager.com/gtag/js" onload="startRound()"></script>'),
    /also contains code.*preserve gameplay/);
  assert.throws(() => stripPublicPolicy('<script>gtag("event", "round");</script>'), /Unrecognized analytics/);
  assert.throws(() => stripPublicPolicy('<script src="https://ko-fi.com/unknown-widget.js"></script>'), /Unrecognized analytics\/ad\/Ko-fi script/);
  assert.throws(() => stripPublicPolicy('<style>@import url("https://fonts.googleapis.com/css2?family=Inter");</style>'),
    /Inline Google font import/);
});

test('rewrites only exact known owned asset URLs and leaves legacy/foreign filenames alone', () => {
  const source = '<img src="/images/Otter-mascot.png"><img src="/images/Otter-tank.png?size=2">' +
    '<meta content="https://otterlygames.com/images/About.png"><style>section{background:url(\'/images/Blog.png\')}</style>' +
    '<img src="/images/tool.png"><a href="/images/About.png.bak">Backup</a><img src="https://example.com/images/About.png">';
  const rewritten = rewriteKnownAssets(source);
  assert.match(rewritten, /\/images\/brand\/otter-buddy-320\.webp/);
  assert.match(rewritten, /\/images\/brand\/otter-tank-640\.webp\?size=2/);
  assert.match(rewritten, /https:\/\/otterlygames\.com\/images\/brand\/about-800\.webp/);
  assert.match(rewritten, /\/images\/brand\/blog-800\.webp/);
  assert.match(rewritten, /\/images\/brand\/tools-800\.webp/);
  assert.match(rewritten, /\/images\/About\.png\.bak/);
  assert.match(rewritten, /https:\/\/example\.com\/images\/About\.png/);
  assert.equal(rewriteKnownAssets(rewritten), rewritten);
  const extra = { templates: { ...templates, footer: '<footer class="footer"><img src="/images/Otter-mascot.png"></footer>' } };
  const baked = transform(html(), { route: '/' }, extra).html;
  assert.doesNotMatch(baked, /Otter-mascot\.png/);
  assert.equal(transform(baked, { route: '/' }, extra).html, baked);
});

test('normalizes index routes and excludes archives, runtimes and invented freshness from sitemap', () => {
  assert.equal(normalizeRoute('/index.html'), '/');
  assert.equal(normalizeRoute('/learn/index.html'), '/learn/');
  assert.equal(normalizeRoute('/tools'), '/tools/');
  const inventory = { origin, pages: ['/', '/tools/index.html', '/Arcade/game.html', '/about.html'] };
  const sitemap = renderSitemap(inventory);
  assert.match(sitemap, /<loc>https:\/\/otterlygames\.com\/tools\/<\/loc>/);
  assert.doesNotMatch(sitemap, /lastmod|games\/clockmaster|index-old|index\.html/);
  for (const route of ['/games/clockmaster/', '/games/mathtank/', '/Math-Tank/index.html', '/scripts/example.html', ...ARCHIVE_ROUTES]) {
    assert.throws(() => validateInventory({ origin, pages: [route] }), /Excluded or non-public/);
  }
  assert.throws(() => renderSitemap({ origin, pages: ['/', '/index.html'] }), /Duplicate canonical route/);
  assert.throws(() => normalizeRoute('/tools/../games/'), /Invalid public route/);
  assert.throws(() => renderSitemap({ origin, pages: [{ route: '/', lastmod: '2026-02-30' }] }), /Invalid known lastmod/);
  assert.match(renderSitemap({ origin, pages: [{ route: '/', lastmod: '2026-01-02' }] }), /<lastmod>2026-01-02<\/lastmod>/);
});

test('noindexes only the explicit archive allowlist without stripping its code/art or changing other metadata', () => {
  const source = html('<section>Old art</section><script>oldGame();</script>', { head: sdkTags + '<link href="/images/About.png">', attrs: '' });
  const once = transformArchive(source, '/index-v3.html');
  assert.match(once, /<meta name="robots" content="noindex,follow">/);
  assert.ok(once.includes(sdkTags));
  assert.ok(once.includes('<link href="/images/About.png">'));
  assert.ok(once.includes('<script>oldGame();</script>'));
  assert.equal(transformArchive(once, '/index-v3.html'), once);
  assert.throws(() => transformArchive(source, '/about.html'), /Refusing to noindex/);
  const privatePage = html('<main><h1>Private portfolio</h1></main>', {
    head: '<meta name="robots" content="noindex, nofollow">',
  });
  assert.equal(transformArchive(privatePage, '/sangram.html'), privatePage);
});

test('generates matching tools/blog fallback links, text, static counts and ItemList schema', (t) => {
  const tools = {
    categories: { math: { label: 'Math & practice', order: 1 } },
    tools: [
      { url: '/tools/one.html', title: 'One & Two', fullDescription: 'Try <3 sums', category: 'math', ageRange: 'Ages 5–8', emoji: '1', cta: 'Try', order: 1 },
      { url: '/tools/two.html', title: 'Two', fullDescription: 'More sums', category: 'math', ageRange: 'Ages 5–8', emoji: '2', cta: 'Try', order: 2 },
    ],
  };
  const blogs = { posts: [
    { url: '/blog/one.html', title: 'First', excerpt: 'Read first', category: 'Guide', emoji: 'A', displayDate: 'Jan 1', readTime: '3 min', date: '2026-01-01' },
    { url: '/blog/two.html', title: 'Second', excerpt: 'Read second', category: 'Guide', emoji: 'B', displayDate: 'Jan 2', readTime: '4 min', date: '2026-01-02' },
  ] };
  const pages = ['/', '/tools/', ...tools.tools.map((item) => item.url), '/blog/', ...blogs.posts.map((item) => item.url)];
  const files = {
    [join('tools', 'index.html')]: html('<h1>Tools</h1><span data-tool-count>99</span><noscript><a href="/tools/old.html">Old</a></noscript>', { title: 'Tools' }),
    [join('blog', 'index.html')]: html('<h1>Blog</h1><noscript><a href="/blog/old.html">Old</a></noscript>', { title: 'Blog' }),
  };
  for (const item of [...tools.tools, ...blogs.posts]) files[item.url.slice(1).split('/').join('\\')] = html('<main><h1>Detail</h1></main>', { title: `Detail ${item.url}` });
  const f = fixture(t, { pages, files, tools, blogs });
  const result = buildSite({ root: f.root, write: true });
  assert.deepEqual(result.errors, []);
  const toolHub = f.read(join('tools', 'index.html'));
  const blogHub = f.read(join('blog', 'index.html'));
  assert.match(toolHub, /<!-- og:tools-fallback:start -->/);
  assert.match(toolHub, /data-tool-count>2<\/span>/);
  assert.match(toolHub, /One &amp; Two/);
  assert.match(toolHub, /Try &lt;3 sums/);
  assert.match(toolHub, /"numberOfItems":2/);
  assert.doesNotMatch(toolHub + blogHub, /href="\/(?:tools|blog)\/old\.html"/);
  assert.ok(blogHub.indexOf('Read second') < blogHub.indexOf('Read first'));
  assert.equal(open(blogHub, 'noscript').length, 1);
  assert.equal(buildSite({ root: f.root }).changes.length, 0);
  tools.tools[0].title = 'Updated without changing the count';
  f.write(join('_data', 'tools.json'), JSON.stringify(tools));
  const stale = buildSite({ root: f.root });
  assert.deepEqual(stale.errors, []);
  assert.ok(stale.changes.some((c) => c.file === join('tools', 'index.html')));
});

test('read-only check detects drift; write touches only scoped pages, archives and sitemap; second check is clean', (t) => {
  const runtime = '<html><script>gtag("runtime-owned", 1);</script></html>';
  const f = fixture(t, { files: {
    'index-v3.html': html('<h1>Archive</h1>', { attrs: '' }),
    [join('games', 'clockmaster', 'index.html')]: runtime,
    'ads.txt': 'google.com, pub-5489426086320283, DIRECT, f08c47fec0942fa0',
  } });
  const source = f.read('index.html');
  const first = buildSite({ root: f.root });
  assert.deepEqual(first.errors, []);
  assert.ok(first.changes.some((c) => c.file === 'sitemap.xml'));
  assert.equal(first.wrote, false);
  assert.equal(f.read('index.html'), source);
  assert.equal(f.read('sitemap.xml'), 'old sitemap');
  assert.deepEqual(buildSite({ root: f.root, write: true }).errors, []);
  assert.equal(buildSite({ root: f.root }).changes.length, 0);
  assert.equal(f.read(join('games', 'clockmaster', 'index.html')), runtime);
  assert.equal(f.read('ads.txt'), 'google.com, pub-5489426086320283, DIRECT, f08c47fec0942fa0');
  assert.match(f.read('index-v3.html'), /noindex,follow/);
  assert.doesNotMatch(f.read('sitemap.xml'), /index-v3|games\/clockmaster/);
  f.write(join('_includes', 'footer.html'), templates.footer.replace('Privacy', 'Privacy policy'));
  assert.ok(buildSite({ root: f.root }).changes.some((c) => c.file === 'index.html'));
});

test('unknown public HTML and unsafe mixed scripts prevent every write, with no success fallback', (t) => {
  const badSource = html('<main><h1>Game</h1></main>', { head: `<script>${ga} startRound();</script>` });
  const f = fixture(t, { files: { 'index.html': badSource, [join('tools', 'unlisted.html')]: html() } });
  const result = buildSite({ root: f.root, write: true });
  assert.equal(result.wrote, false);
  assert.ok(result.errors.some((e) => e.includes('unlisted.html') && e.includes('absent from')));
  assert.ok(result.errors.some((e) => e.includes('mixed with game code')));
  assert.equal(f.read('index.html'), badSource);
  assert.equal(f.read('sitemap.xml'), 'old sitemap');
});

test('template/metadata guards reject missing skip links, malformed markers and duplicate titles', (t) => {
  assert.throws(() => validateTemplates({ ...templates, nav: '<nav class="nav">Home</nav>' }), /skip-link/);
  assert.throws(() => validateTemplates({ ...templates, footer: templates.footer + sdkTags }), /Shared templates must not contain SDKs/);
  assert.throws(() => transform(html('<!-- og:nav:start --><main>Content</main>')), /marker pair/);
  const f = fixture(t, { pages: ['/', '/about.html'], files: { 'about.html': html() } });
  const result = buildSite({ root: f.root, write: true });
  assert.ok(result.errors.some((e) => e.includes('Duplicate public title')));
  assert.equal(result.wrote, false);
  assert.equal(f.read('sitemap.xml'), 'old sitemap');
});

test('CLI returns nonzero for stale output and invalid flags, then zero after fixture build', (t) => {
  const f = fixture(t);
  const script = fileURLToPath(new URL('./build-site.mjs', import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [script, ...args, '--root', f.root], { encoding: 'utf8' });
  assert.equal(run('--check').status, 1);
  assert.match(run('--check').stdout, /STALE index\.html/);
  assert.equal(run('--check', '--write').status, 2);
  assert.equal(run('--write').status, 0);
  assert.equal(run('--check').status, 0);
  assert.equal(run().status, 0);
});
