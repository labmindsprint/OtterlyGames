import { readFileSync, readdirSync, realpathSync, existsSync, writeFileSync, lstatSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderGames, validateGames } from './site-games.mjs';

export const ARCHIVE_ROUTES = [
  '/index-old-backup.html', '/index-v2-backup.html', '/index-v3-backup.html', '/index-v3.html',
  '/sangram.html', '/sangram-v2.html', '/sangram-v3.html', '/sangram-v4.html', '/sangram-v5.html', '/sangram-v6.html',
  '/Arcade/index-old.html', '/math-tank-feature-graphic.html', '/og-image-generator.html',
];
const PUBLIC_DIRECTORIES = ['apps', 'play', 'tools', 'blog', 'learn', 'parents', 'Arcade'];
const CUSTOM_SHELL_ROUTES = [
  '/Arcade/game.html', '/Arcade/pigeon.html', '/Arcade/shepherd.html', '/Arcade/zombie.html',
];
const ACCOUNT = 'ca-pub-5489426086320283';
const ASSET_URLS = {
  '/images/Otter-mascot.png': '/images/brand/otter-buddy-320.webp',
  '/images/Otter-tank.png': '/images/brand/otter-tank-640.webp',
  '/images/About.png': '/images/brand/about-800.webp',
  '/images/Blog.png': '/images/brand/blog-800.webp',
  '/images/tool.png': '/images/brand/tools-800.webp',
};
const VOID_ELEMENTS = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const RAW_ELEMENTS = new Set(['script', 'style', 'title', 'textarea']);
const ACTIVE_POLICY = /googletagmanager\.com|google-analytics\.com|googlesyndication\.com|\bgtag\s*\(|\badsbygoogle\b|\bkofiWidgetOverlay\b|storage\.ko-fi\.com/i;
const KOFI_EMBED = /^(?:https?:)?\/\/(?:[^/]+\.)?ko-fi\.com(?:\/|$)/i;
const GOOGLE_FONTS = /fonts\.(?:googleapis|gstatic)\.com/i;
const GA_BOOTSTRAP = "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-NX29GXGV7H');";
const KOFI_BOOTSTRAP = "kofiWidgetOverlay.draw('otterly_games',{'type':'floating-chat','floating-chat.donateButton.text':'Support me','floating-chat.donateButton.background-color':'#00b9fe','floating-chat.donateButton.text-color':'#fff'});";
const ADS_BOOTSTRAPS = [
  '(adsbygoogle=window.adsbygoogle||[]).push({});',
  '(window.adsbygoogle=window.adsbygoogle||[]).push({});',
];
const compactScript = (s) => s.replace(/\s+/g, '').replaceAll('"', "'");
const escapeHtml = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const lineAt = (s, offset) => s.slice(0, offset).split('\n').length;
const problem = (file, html, offset, message) => new Error(`${file}:${lineAt(html, offset)}: ${message}`);

// Keep source bytes outside guarded elements intact, including HTML-looking game strings.
export function htmlTokens(html, file = '<html>') {
  const result = [];
  let cursor = 0;
  while (cursor < html.length) {
    const start = html.indexOf('<', cursor);
    if (start === -1) break;
    if (html.startsWith('<!--', start)) {
      const close = html.indexOf('-->', start + 4);
      if (close === -1) throw problem(file, html, start, 'Unclosed HTML comment');
      result.push({ kind: 'comment', start, end: close + 3, raw: html.slice(start, close + 3) });
      cursor = close + 3;
      continue;
    }
    const match = /^<(\/?)([a-z][\w:-]*)\b/i.exec(html.slice(start));
    if (!match) { cursor = start + 1; continue; }
    let end = start + match[0].length;
    let quote = '';
    for (; end < html.length; end++) {
      const char = html[end];
      if (quote) { if (char === quote) quote = ''; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === '>') break;
    }
    if (end === html.length) throw problem(file, html, start, 'Unclosed HTML tag');
    end++;
    const token = {
      kind: match[1] ? 'close' : 'open', name: match[2].toLowerCase(),
      start, end, openEnd: end, raw: html.slice(start, end),
    };
    if (token.kind === 'open' && RAW_ELEMENTS.has(token.name)) {
      const closing = new RegExp(`</${token.name}\\s*>`, 'ig');
      closing.lastIndex = end;
      const close = closing.exec(html);
      if (!close) throw problem(file, html, start, `Unclosed ${token.name} element`);
      token.kind = 'raw';
      token.content = html.slice(end, close.index);
      token.contentStart = end;
      token.contentEnd = close.index;
      token.end = close.index + close[0].length;
    }
    result.push(token);
    cursor = token.end;
  }
  return result;
}

function attributes(token) {
  const start = /^<[\w:-]+/.exec(token.raw)?.[0].length ?? token.raw.length;
  const re = /\s+([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  re.lastIndex = start;
  return [...token.raw.matchAll(re)].map((m) => ({
    name: m[1].toLowerCase(), value: m[2] ?? m[3] ?? m[4] ?? '',
    start: m.index, end: m.index + m[0].length,
  }));
}

function attr(token, name) {
  const matches = attributes(token).filter((a) => a.name === name);
  if (matches.length > 1) throw new Error(`Duplicate ${name} attribute in ${token.raw}`);
  return matches[0]?.value;
}
const hasClass = (token, name) => (attr(token, 'class') ?? '').split(/\s+/).includes(name);
const isElement = (token) => token.kind === 'open' || token.kind === 'raw';

function setAttribute(token, name, value) {
  const existing = attributes(token).filter((a) => a.name === name);
  if (existing.length > 1) throw new Error(`Duplicate ${name} attribute in ${token.raw}`);
  if (existing.length) {
    const a = existing[0];
    return token.raw.slice(0, a.start) + (value === null ? '' : ` ${name}="${escapeHtml(value)}"`) + token.raw.slice(a.end);
  }
  return value === null ? token.raw : token.raw.replace(/(\s*\/?>)$/, ` ${name}="${escapeHtml(value)}"$1`);
}

function elementRange(tokens, token, html, file) {
  if (token.kind === 'raw' || VOID_ELEMENTS.has(token.name) || /\/>$/.test(token.raw)) return token;
  let depth = 0;
  for (const other of tokens) {
    if (other.start < token.start || other.name !== token.name) continue;
    if (other.kind === 'open') depth++;
    if (other.kind === 'close' && --depth === 0) return { start: token.start, end: other.end };
  }
  throw problem(file, html, token.start, `Unclosed ${token.name} element`);
}

function applyEdits(html, edits) {
  const ordered = edits.sort((a, b) => b.start - a.start);
  let next = html.length + 1;
  for (const edit of ordered) {
    if (edit.end > next) throw new Error('Overlapping site-build edits; no files were written');
    html = html.slice(0, edit.start) + edit.text + html.slice(edit.end);
    next = edit.start;
  }
  return html;
}

function markerRange(html, name, file) {
  const comments = htmlTokens(html, file).filter((t) => t.kind === 'comment' && t.raw.includes(`og:${name}:`));
  if (!comments.length) return null;
  if (comments.length !== 2 || !new RegExp(`^<!--\\s*og:${name}:start\\s*-->$`).test(comments[0].raw) ||
      !new RegExp(`^<!--\\s*og:${name}:end\\s*-->$`).test(comments[1].raw)) {
    throw problem(file, html, comments[0].start, `Expected one ordered og:${name}:start/end marker pair`);
  }
  return { start: comments[0].start, end: comments[1].end };
}
const block = (name, contents) => `<!-- og:${name}:start -->\n${contents.trim()}\n<!-- og:${name}:end -->`;

function closingToken(html, name, file) {
  const tokens = htmlTokens(html, file).filter((t) => t.kind === 'close' && t.name === name);
  if (tokens.length !== 1) throw new Error(`${file}: Expected one closing ${name} tag`);
  return tokens[0];
}
function addToHead(html, contents, file) {
  const head = closingToken(html, 'head', file);
  return applyEdits(html, [{ start: head.start, end: head.start, text: `  ${contents}\n` }]);
}

export function normalizeRoute(value) {
  if (typeof value !== 'string' || !/^\/(?:[a-z0-9._-]+\/)*[a-z0-9._-]*\/?$/i.test(value) ||
      value.includes('//') || value.split('/').some((s) => s === '.' || s === '..')) {
    throw new Error(`Invalid public route: ${JSON.stringify(value)}`);
  }
  let route = value.replace(/\/index\.html$/i, '/');
  if (!route.endsWith('/') && !route.endsWith('.html')) route += '/';
  return route;
}
const fileForRoute = (route) => route === '/' ? 'index.html' : `${route.slice(1)}${route.endsWith('/') ? 'index.html' : ''}`;

export function validateInventory(data) {
  if (!data || !Array.isArray(data.pages) || !data.pages.length) throw new Error('Public inventory needs a nonempty pages array');
  const origin = new URL(data.origin);
  if (origin.protocol !== 'https:' || origin.origin !== data.origin) throw new Error('Inventory origin must be an HTTPS origin without a trailing slash');
  const seen = new Set();
  const pages = data.pages.map((entry) => {
    const page = typeof entry === 'string' ? { route: entry } : { ...entry };
    page.route = normalizeRoute(page.route);
    const first = page.route.split('/')[1];
    if (ARCHIVE_ROUTES.includes(page.route) || page.route === '/404.html' ||
        (page.route !== '/' && !(page.route.slice(1).endsWith('.html') && !page.route.slice(1).includes('/')) &&
         !PUBLIC_DIRECTORIES.includes(first))) {
      throw new Error(`Excluded or non-public route in inventory: ${page.route}`);
    }
    if (seen.has(page.route)) throw new Error(`Duplicate canonical route: ${page.route}`);
    seen.add(page.route);
    page.shell ??= 'site';
    if (!['site', 'custom'].includes(page.shell) ||
        (page.shell === 'custom' && !CUSTOM_SHELL_ROUTES.includes(page.route))) {
      throw new Error(`Unsupported shell policy for ${page.route}`);
    }
    if (page.adsenseVerification !== undefined && typeof page.adsenseVerification !== 'boolean') {
      throw new Error(`adsenseVerification must be a boolean for ${page.route}`);
    }
    if (page.lastmod !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(page.lastmod) ||
        !Number.isFinite(Date.parse(page.lastmod)) || new Date(page.lastmod).toISOString().slice(0, 10) !== page.lastmod)) {
      throw new Error(`Invalid known lastmod for ${page.route}`);
    }
    return page;
  });
  return { origin: origin.origin, pages };
}

export function renderSitemap(inventory) {
  const { origin, pages } = validateInventory(inventory);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.map((p) => `  <url>\n    <loc>${escapeHtml(origin + p.route)}</loc>\n` +
      (p.lastmod ? `    <lastmod>${p.lastmod}</lastmod>\n` : '') + '  </url>').join('\n') + '\n</urlset>\n';
}

export function rewriteKnownAssets(html) {
  for (const [before, after] of Object.entries(ASSET_URLS)) {
    const path = before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const url = new RegExp(`(?<![a-z0-9./:-])((?:https?:)?//otterlygames\\.com)?${path}(?=[\\s"'\\x60<>?#),;\\]}]|$)`, 'g');
    html = html.replace(url, (_, origin = '') => origin + after);
  }
  return html;
}

function knownSdk(src, base) {
  const url = new URL(src, base);
  const endpoint = url.hostname + url.pathname;
  return ({
    'www.googletagmanager.com/gtag/js': 'GA4 SDK',
    'googletagmanager.com/gtag/js': 'GA4 SDK',
    'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js': 'AdSense SDK',
    'storage.ko-fi.com/cdn/scripts/overlay-widget.js': 'Ko-fi overlay SDK',
  })[endpoint];
}

export function stripPublicPolicy(html, { file = '<html>', base = 'https://otterlygames.com/' } = {}) {
  const edits = [];
  const removals = [];
  for (const token of htmlTokens(html, file)) {
    if (!isElement(token)) continue;
    const src = attr(token, 'src');
    if (token.name === 'script') {
      const sdk = src && knownSdk(src, base);
      const type = (attr(token, 'type') ?? '').toLowerCase();
      const executable = !type || ['module', 'text/javascript', 'application/javascript'].includes(type);
      const body = compactScript(token.content);
      const inline = !src && (
        body === compactScript(GA_BOOTSTRAP) ? 'GA4 bootstrap' :
        body === compactScript(KOFI_BOOTSTRAP) ? 'Ko-fi overlay init' :
        ADS_BOOTSTRAPS.includes(body) ? 'AdSense queue init' : null
      );
      if (sdk && (token.content.trim() || attributes(token).some((a) => a.name.startsWith('on') && a.value.trim()))) {
        throw problem(file, html, token.start, `${sdk} tag also contains code; split it manually to preserve gameplay`);
      }
      if (sdk || inline) {
        edits.push({ ...token, text: '' });
        removals.push({ line: lineAt(html, token.start), reason: sdk || inline });
      } else if ((src && (ACTIVE_POLICY.test(src) || KOFI_EMBED.test(src))) || (executable && ACTIVE_POLICY.test(token.content))) {
        throw problem(file, html, token.start, 'Unrecognized analytics/ad/Ko-fi script (possibly mixed with game code); refusing to delete it');
      }
    } else if (token.name === 'link' && GOOGLE_FONTS.test(attr(token, 'href') ?? '')) {
      const url = new URL(attr(token, 'href'), base);
      if (!['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
        throw problem(file, html, token.start, 'Unrecognized Google font URL');
      }
      edits.push({ ...token, text: '' });
      removals.push({ line: lineAt(html, token.start), reason: 'Remote Google font link/preconnect' });
    } else if (token.name === 'style' && GOOGLE_FONTS.test(token.content)) {
      throw problem(file, html, token.start, 'Inline Google font import/URL needs an explicit local-font migration');
    } else if (src && (ACTIVE_POLICY.test(src) || KOFI_EMBED.test(src))) {
      throw problem(file, html, token.start, 'Active tracking/ad/Ko-fi embed needs manual removal');
    }
    for (const a of attributes(token)) {
      if (a.name.startsWith('on') && ACTIVE_POLICY.test(a.value)) {
        throw problem(file, html, token.start, 'Active inline tracking handler needs manual removal');
      }
    }
  }
  return { html: applyEdits(html, edits), removals };
}

export function validateTemplates(templates) {
  for (const name of ['nav', 'footer']) {
    const file = `_includes\\${name}.html`;
    const policy = stripPublicPolicy(templates[name], { file });
    if (policy.removals.length) throw new Error(`${file}:${policy.removals[0].line}: Shared templates must not contain SDKs or remote Google fonts`);
    const tokens = htmlTokens(templates[name], file);
    const elements = tokens.filter((t) => isElement(t) && t.name === name && hasClass(t, name));
    if (elements.length !== 1) throw new Error(`_includes\\${name}.html: Expected exactly one ${name}.${name}`);
  }
  const skip = htmlTokens(templates.nav).filter((t) => isElement(t) && t.name === 'a' &&
    hasClass(t, 'skip-link') && attr(t, 'href') === '#main-content');
  if (skip.length !== 1) throw new Error('_includes\\nav.html: Expected one a.skip-link with href="#main-content"');
}

function renderShell(html, page, templates, file) {
  let tokens = htmlTokens(html, file);
  const opts = new Set();
  for (const token of tokens.filter((t) => t.kind === 'open' && ['html', 'body'].includes(t.name))) {
    const value = attr(token, 'data-og-includes');
    if (value !== undefined) {
      for (const part of value.split(',').map((s) => s.trim())) {
        if (!['nav', 'footer'].includes(part)) throw problem(file, html, token.start, `Unknown data-og-includes part: ${part}`);
        opts.add(part);
      }
    }
  }
  const navRange = markerRange(html, 'nav', file);
  const skipEdits = tokens.filter((t) => page.shell !== 'custom' && isElement(t) && t.name === 'a' && hasClass(t, 'skip-link') &&
    attr(t, 'href') === '#main-content' && (!navRange || t.start < navRange.start || t.start >= navRange.end))
    .map((t) => ({ ...elementRange(tokens, t, html, file), text: '' }));
  html = applyEdits(html, skipEdits);
  for (const name of ['nav', 'footer']) {
    tokens = htmlTokens(html, file);
    const range = markerRange(html, name, file);
    const inline = tokens.filter((t) => t.kind === 'open' && t.name === name && hasClass(t, name) &&
      (!range || t.start < range.start || t.start >= range.end));
    if (inline.length > 1 || (range && inline.length)) throw new Error(`${file}: Duplicate shared ${name}; custom game/post navigation must use its own class`);
    if (page.shell === 'custom') {
      if (range || inline.length || opts.has(name)) throw new Error(`${file}: Custom game chrome cannot also opt into the shared ${name}`);
      if (name === 'nav') {
        const skip = htmlTokens(templates.nav).find((t) => isElement(t) && t.name === 'a' && hasClass(t, 'skip-link'));
        const skipRange = elementRange(htmlTokens(templates.nav), skip, templates.nav, '_includes\\nav.html');
        const contents = templates.nav.slice(skipRange.start, skipRange.end);
        const existing = tokens.filter((t) => isElement(t) && t.name === 'a' && hasClass(t, 'skip-link') && attr(t, 'href') === '#main-content');
        if (existing.length) {
          html = applyEdits(html, existing.map((t, i) => ({ ...elementRange(tokens, t, html, file), text: i ? '' : contents })));
        } else {
          const body = tokens.find((t) => t.kind === 'open' && t.name === 'body');
          if (!body) throw new Error(`${file}: Missing body`);
          html = applyEdits(html, [{ start: body.end, end: body.end, text: `\n${contents}\n` }]);
        }
      }
      continue;
    }
    const contents = block(name, templates[name]);
    if (range || inline.length) {
      html = applyEdits(html, [{ ...(range || elementRange(tokens, inline[0], html, file)), text: contents }]);
    } else if (opts.has(name)) {
      const body = name === 'nav' ? tokens.find((t) => t.kind === 'open' && t.name === 'body') : closingToken(html, 'body', file);
      if (!body) throw new Error(`${file}: Missing body`);
      const position = name === 'nav' ? body.end : body.start;
      html = applyEdits(html, [{ start: position, end: position, text: `\n${contents}\n` }]);
    } else {
      throw new Error(`${file}: Missing shared ${name}; new content pages need body data-og-includes="nav,footer"`);
    }
  }
  tokens = htmlTokens(html, file);
  return applyEdits(html, tokens.filter((t) => t.kind === 'open' && ['html', 'body'].includes(t.name) &&
    attr(t, 'data-og-includes') !== undefined).map((t) => ({ ...t, text: setAttribute(t, 'data-og-includes', null) })));
}

function ensureDeferredScript(html, base, file, source = '/js/includes.js') {
  const scripts = htmlTokens(html, file).filter((t) => t.name === 'script' && attr(t, 'src') &&
    new URL(attr(t, 'src'), base).href.split(/[?#]/)[0] === new URL(source, base).href);
  for (const script of scripts) {
    if (script.content.trim()) throw problem(file, html, script.start, `${source} tag contains additional inline code`);
  }
  const canonical = `<script src="${source}" defer></script>`;
  return scripts.length ? applyEdits(html, scripts.map((t, i) => ({ ...t, text: i ? '' : canonical }))) : addToHead(html, canonical, file);
}

function ensureSkipTarget(html, file, page) {
  const tokens = htmlTokens(html, file);
  const inertRanges = tokens.filter((t) => t.kind === 'open' && ['noscript', 'template'].includes(t.name))
    .map((t) => elementRange(tokens, t, html, file));
  const isInert = (token) => inertRanges.some((range) => token.start >= range.start && token.end <= range.end);
  const targets = tokens.filter((t) => isElement(t) && attr(t, 'id') === 'main-content');
  if (targets.length > 1) throw new Error(`${file}: Duplicate main-content target`);
  if (targets.length) {
    const target = targets[0];
    if (isInert(target)) {
      return ensureSkipTarget(applyEdits(html, [{
        start: target.start, end: target.openEnd, text: setAttribute(target, 'id', null),
      }]), file, page);
    }
    return applyEdits(html, [{ start: target.start, end: target.openEnd, text: setAttribute(target, 'tabindex', '-1') }]);
  }
  const main = tokens.find((t) => t.kind === 'open' && t.name === 'main' && !isInert(t)) ||
    (page.shell === 'custom' && tokens.find((t) => t.kind === 'open' && hasClass(t, 'game-area')));
  if (main && !attr(main, 'id')) {
    let raw = setAttribute(main, 'id', 'main-content');
    raw = setAttribute({ ...main, raw }, 'tabindex', '-1');
    return applyEdits(html, [{ start: main.start, end: main.openEnd, text: raw }]);
  }
  const body = tokens.find((t) => t.kind === 'open' && t.name === 'body');
  if (!body) throw new Error(`${file}: Missing body`);
  const nav = markerRange(html, 'nav', file);
  const firstContent = main || tokens.find((t) => t.kind === 'open' &&
    ['section', 'article', 'h1', 'h2'].includes(t.name) && !isInert(t) &&
    t.start > body.end && (!nav || t.start >= nav.end));
  const position = firstContent?.start ?? nav?.end ?? body.end;
  return applyEdits(html, [{ start: position, end: position, text: '\n<span id="main-content" tabindex="-1"></span>\n' }]);
}

function upsertHeadTag(html, predicate, contents, file) {
  const close = closingToken(html, 'head', file);
  const tags = htmlTokens(html, file).filter((t) => isElement(t) && predicate(t));
  if (tags.some((t) => t.start > close.start)) throw new Error(`${file}: Head metadata found outside head`);
  return tags.length ? applyEdits(html, tags.map((t, i) => ({ start: t.start, end: t.openEnd, text: i ? '' : contents }))) :
    contents ? addToHead(html, contents, file) : html;
}

function canonicalMetadata(html, page, origin, file) {
  html = upsertHeadTag(html, (t) => t.name === 'link' && (attr(t, 'rel') ?? '').toLowerCase().split(/\s+/).includes('canonical'),
    `<link rel="canonical" href="${escapeHtml(origin + page.route)}">`, file);
  const verification = (t) => t.name === 'meta' && (attr(t, 'name') ?? '').toLowerCase() === 'google-adsense-account';
  const accounts = htmlTokens(html, file).filter((t) => isElement(t) && verification(t));
  if (accounts.some((t) => attr(t, 'content') !== ACCOUNT)) throw new Error(`${file}: Unexpected AdSense verification account; review it explicitly`);
  return upsertHeadTag(html, verification,
    page.adsenseVerification ? `<meta name="google-adsense-account" content="${ACCOUNT}">` : '', file);
}

export function transformArchive(html, route, file = fileForRoute(route)) {
  if (!ARCHIVE_ROUTES.includes(route)) throw new Error(`Refusing to noindex a non-archive route: ${route}`);
  const existing = htmlTokens(html, file).filter((t) => isElement(t) && t.name === 'meta' &&
    (attr(t, 'name') ?? '').toLowerCase() === 'robots');
  if (existing.some((t) => /\b(?:noindex|none)\b/i.test(attr(t, 'content') ?? ''))) return html;
  return upsertHeadTag(html, (t) => t.name === 'meta' && (attr(t, 'name') ?? '').toLowerCase() === 'robots',
    '<meta name="robots" content="noindex,follow">', file);
}

function registryItems(registry, key, inventory) {
  const items = registry?.[key];
  if (!Array.isArray(items) || !items.length) throw new Error(`_data\\${key === 'tools' ? 'tools' : 'blogs'}.json: Missing ${key} entries`);
  const prefix = key === 'tools' ? '/tools/' : '/blog/';
  const expected = inventory.pages.filter((p) => p.route.startsWith(prefix) && !p.route.endsWith('/')).map((p) => p.route);
  const urls = items.map((item) => normalizeRoute(item.url));
  if (new Set(urls).size !== urls.length || expected.length !== urls.length || expected.some((url) => !urls.includes(url))) {
    throw new Error(`_data\\${key === 'tools' ? 'tools' : 'blogs'}.json: Registry URLs must exactly match public ${prefix} detail routes`);
  }
  const fields = key === 'tools' ? ['title', 'fullDescription', 'category', 'ageRange', 'emoji', 'cta'] :
    ['title', 'excerpt', 'category', 'emoji', 'displayDate', 'readTime', 'date'];
  for (const item of items) {
    for (const field of fields) {
      if (typeof item[field] !== 'string' || !item[field].trim()) throw new Error(`${item.url}: Missing registry ${field}`);
    }
  }
  if (key === 'tools') {
    if (!registry.categories || items.some((item) => !registry.categories[item.category]?.label)) {
      throw new Error('_data\\tools.json: Each tool needs a defined category label');
    }
    return [...items].sort((a, b) => (registry.categories[a.category].order - registry.categories[b.category].order) ||
      ((a.order ?? 0) - (b.order ?? 0)));
  }
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

function fallbackMarkup(kind, items, registry) {
  if (kind === 'tools') {
    const groups = [...new Set(items.map((t) => t.category))].map((category) => {
      const cards = items.filter((t) => t.category === category).map((t) =>
        `      <a href="${escapeHtml(t.url)}" class="tool-card--full"><span class="tool-emoji" aria-hidden="true">${escapeHtml(t.emoji)}</span><h3>${escapeHtml(t.title)}</h3><span class="age-badge">${escapeHtml(t.ageRange)}</span><p>${escapeHtml(t.fullDescription)}</p><span class="tool-cta">${escapeHtml(t.cta)}</span></a>`).join('\n');
      return `  <div class="tools-category"><div class="tools-category-header"><h2>${escapeHtml(registry.categories[category].label)}</h2></div>\n    <div class="tools-grid--full">\n${cards}\n    </div>\n  </div>`;
    }).join('\n');
    return `<noscript>\n${groups}\n</noscript>`;
  }
  return '<noscript>\n  <div class="blog-grid">\n' + items.map((p) =>
    `    <a href="${escapeHtml(p.url)}" class="blog-card"><span class="blog-card-emoji" aria-hidden="true">${escapeHtml(p.emoji)}</span><div class="blog-card-body"><span class="blog-card-cat">${escapeHtml(p.category)}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.excerpt)}</p><div class="blog-meta"><span>${escapeHtml(p.displayDate)}</span><span aria-hidden="true">·</span><span>${escapeHtml(p.readTime)}</span></div></div></a>`).join('\n') + '\n  </div>\n</noscript>';
}

function renderFallback(html, kind, items, registry, file) {
  const name = `${kind}-fallback`;
  const existing = markerRange(html, name, file);
  const tokens = htmlTokens(html, file);
  const fallbacks = tokens.filter((t) => t.kind === 'open' && t.name === 'noscript' &&
    (!existing || t.start < existing.start || t.start >= existing.end));
  if ((!existing && fallbacks.length !== 1) || (existing && fallbacks.length)) {
    throw new Error(`${file}: Expected one ${name} marker block or one legacy noscript listing`);
  }
  return applyEdits(html, [{ ...(existing || elementRange(tokens, fallbacks[0], html, file)),
    text: block(name, fallbackMarkup(kind, items, registry)) }]);
}

function updateToolCounts(html, tools, origin, isHub, file) {
  let tokens = htmlTokens(html, file);
  const counts = tokens.filter((t) => t.kind === 'open' && attr(t, 'data-tool-count') !== undefined);
  html = applyEdits(html, counts.map((t) => {
    const range = elementRange(tokens, t, html, file);
    const closing = tokens.find((end) => end.kind === 'close' && end.end === range.end);
    if (!closing || !/^\s*\d+\s*$/.test(html.slice(t.end, closing.start))) throw problem(file, html, t.start, 'data-tool-count must contain only a numeric count');
    return { start: t.end, end: closing.start, text: String(tools.length) };
  }));
  if (!isHub) return html;
  tokens = htmlTokens(html, file);
  const lists = [];
  for (const token of tokens.filter((t) => t.name === 'script' && attr(t, 'type') === 'application/ld+json')) {
    let data;
    try { data = JSON.parse(token.content); } catch { throw problem(file, html, token.start, 'Invalid tools hub JSON-LD'); }
    if (data['@type'] === 'ItemList') lists.push({ token, data });
  }
  if (lists.length > 1) throw new Error(`${file}: Multiple tools ItemList schemas`);
  const data = lists[0]?.data ?? { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Free Learning Tools for Kids' };
  data.numberOfItems = tools.length;
  data.itemListElement = tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.title, url: origin + normalizeRoute(t.url) }));
  const contents = JSON.stringify(data).replaceAll('<', '\\u003c');
  return lists.length ? applyEdits(html, [{ start: lists[0].token.contentStart, end: lists[0].token.contentEnd, text: `\n  ${contents}\n  ` }]) :
    addToHead(html, `<script type="application/ld+json">\n  ${contents}\n  </script>`, file);
}

function metadata(html, file) {
  const tokens = htmlTokens(html, file);
  const head = tokens.find((t) => isElement(t) && t.name === 'head');
  const close = closingToken(html, 'head', file);
  const headTokens = head ? tokens.filter((t) => t.start >= head.end && t.end <= close.start) : [];
  const titles = headTokens.filter((t) => t.name === 'title');
  const descriptions = headTokens.filter((t) => isElement(t) && t.name === 'meta' && (attr(t, 'name') ?? '').toLowerCase() === 'description');
  if (titles.length !== 1 || !titles[0].content.trim() || descriptions.length !== 1 || !attr(descriptions[0], 'content')?.trim()) {
    throw new Error(`${file}: Public pages need one nonempty title and meta description`);
  }
  for (const token of tokens.filter((t) => isElement(t) && t.name === 'meta' && (attr(t, 'name') ?? '').toLowerCase() === 'robots')) {
    if (/\b(?:noindex|none)\b/i.test(attr(token, 'content') ?? '')) throw problem(file, html, token.start, 'A public inventory route cannot be noindex');
  }
  return { title: titles[0].content.trim(), description: attr(descriptions[0], 'content').trim() };
}

function renderArcadeCards(html, templates, file) {
  const range = markerRange(html, 'arcade-games', file);
  if (!range) throw new Error(`${file}: Expected one og:arcade-games:start/end marker pair`);
  const fragment = templates.arcade?.trim();
  if (!fragment) throw new Error(`${file}: Missing _includes\\arcade-games.html`);
  const tokens = htmlTokens(fragment, '_includes\\arcade-games.html');
  const cards = tokens.filter((t) => t.kind === 'open' && t.name === 'a' && hasClass(t, 'game-card'));
  if (!cards.length || new Set(cards.map((t) => attr(t, 'href'))).size !== cards.length ||
      cards.some((t) => !/^\/Arcade\/[\w-]+\.html$/.test(attr(t, 'href') ?? '')) ||
      tokens.some((t) => ['script', 'iframe', 'style', 'link'].includes(t.name))) {
    throw new Error(`${file}: Arcade cards need unique local game links and no embedded scripts or resources`);
  }
  return applyEdits(html, [{ ...range, text: block('arcade-games', fragment) }]);
}

function renderEditorialAd(html, page, templates, editorialRoutes, origin, file) {
  const range = markerRange(html, 'editorial-ad', file);
  const tokens = htmlTokens(html, file);
  const unmanaged = tokens.filter((t) => isElement(t) && attr(t, 'data-editorial-ad') !== undefined &&
    (!range || t.start < range.start || t.start >= range.end));
  if (unmanaged.length) throw problem(file, html, unmanaged[0].start, 'Unmanaged editorial ad placement; use the generated marker block');
  if (!editorialRoutes?.has(page.route)) {
    if (range) throw new Error(`${file}: Editorial ads are not allowed on this route`);
    return html;
  }
  const fragment = templates.editorial?.trim();
  if (!fragment) throw new Error(`${file}: Missing _includes\\editorial-ad.html`);
  const parts = htmlTokens(fragment, '_includes\\editorial-ad.html');
  const roots = parts.filter((t) => isElement(t) && t.name === 'aside' && attr(t, 'data-editorial-ad') !== undefined);
  const root = roots[0];
  const rootRange = root && elementRange(parts, root, fragment, '_includes\\editorial-ad.html');
  const unsafe = parts.some((t) => isElement(t) && (
    !['aside', 'div', 'p', 'span', 'ins'].includes(t.name) ||
    attributes(t).some((a) => a.name.startsWith('on') || ['src', 'srcset', 'href', 'style'].includes(a.name))
  ));
  if (roots.length !== 1 || attr(root, 'hidden') === undefined || attr(root, 'aria-label') !== 'Advertisement' ||
      fragment.slice(0, rootRange.start).trim() || fragment.slice(rootRange.end).trim() || unsafe) {
    throw new Error('_includes\\editorial-ad.html: Expected one hidden, labelled editorial aside without executable, interactive or resource-loading content');
  }
  const footer = markerRange(html, 'footer', file);
  if (!footer) throw new Error(`${file}: Editorial placement requires the shared footer`);
  if (range && (range.end > footer.start || html.slice(range.end, footer.start).trim())) {
    throw new Error(`${file}: Editorial ad block must follow authored content immediately before the shared footer`);
  }
  const contents = block('editorial-ad', fragment);
  html = applyEdits(html, [{ ...(range || { start: footer.start, end: footer.start }),
    text: range ? contents : `${contents}\n` }]);
  const base = origin + page.route;
  html = upsertHeadTag(html, (t) => t.name === 'link' &&
    (attr(t, 'rel') ?? '').toLowerCase().split(/\s+/).includes('stylesheet') &&
    new URL(attr(t, 'href') ?? '', base).href.split(/[?#]/)[0] === new URL('/css/web-ads.css', base).href,
  '<link rel="stylesheet" href="/css/web-ads.css">', file);
  return ensureDeferredScript(html, base, file, '/js/web-game-ads.js');
}

export function transformPublicPage(html, page, { templates, origin, tools = [], toolRegistry, blogs = [], games, editorialRoutes }, file = fileForRoute(page.route)) {
  const policy = stripPublicPolicy(html, { file, base: origin + page.route });
  let output = canonicalMetadata(policy.html, page, origin, file);
  output = renderShell(output, page, templates, file);
  output = ensureDeferredScript(output, origin + page.route, file);
  output = ensureSkipTarget(output, file, page);
  const catalogue = markerRange(output, 'game-catalogue', file);
  if (catalogue) {
    if (!games || !['/', '/play/'].includes(page.route)) throw new Error(`${file}: A game catalogue needs its registry and a supported hub route`);
    output = applyEdits(output, [{ ...catalogue, text: block('game-catalogue', renderGames(games, origin)) }]);
  } else if (['/play/', '/Arcade/'].includes(page.route)) output = renderArcadeCards(output, templates, file);
  if (page.route === '/tools/') output = renderFallback(output, 'tools', tools, toolRegistry, file);
  if (page.route === '/blog/') output = renderFallback(output, 'blog', blogs, null, file);
  output = updateToolCounts(output, tools, origin, page.route === '/tools/', file);
  output = renderEditorialAd(output, page, templates, editorialRoutes, origin, file);
  output = rewriteKnownAssets(output);
  const warnings = [];
  for (const token of htmlTokens(html, file).filter((t) => t.name === 'script' && !attr(t, 'src'))) {
    if (/\bnavToggle\b/.test(token.content) && /addEventListener\s*\(\s*['"]click|\.onclick\s*=/.test(token.content)) {
      warnings.push(`${file}:${lineAt(html, token.start)}: Legacy inline nav click binding retained; includes.js must arbitrate it`);
    }
  }
  return { html: output, removals: policy.removals, warnings, metadata: metadata(output, file) };
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) { throw new Error(`${path}: ${error.message}`); }
}
function publicFiles(root) {
  const files = readdirSync(root, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.html')).map((e) => e.name);
  const visit = (dir) => {
    if (!existsSync(join(root, dir))) return;
    if (lstatSync(join(root, dir)).isSymbolicLink()) throw new Error(`${dir}: Symlinks are not public build inputs`);
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error(`${join(dir, entry.name)}: Symlinks are not public build inputs`);
      if (entry.isDirectory()) visit(join(dir, entry.name));
      else if (entry.name.endsWith('.html')) files.push(join(dir, entry.name));
    }
  };
  PUBLIC_DIRECTORIES.forEach(visit);
  return files;
}

export function buildSite({ root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), write = false } = {}) {
  root = resolve(root);
  const result = { errors: [], warnings: [], changes: [], pages: 0, wrote: false, written: 0 };
  const errorText = (file, error) => error.message.startsWith(`${file}:`) ? error.message : `${file}: ${error.message}`;
  try {
    const inventory = validateInventory(readJson(join(root, '_data', 'public-pages.json')));
    const templates = {
      nav: readFileSync(join(root, '_includes', 'nav.html'), 'utf8').trim(),
      footer: readFileSync(join(root, '_includes', 'footer.html'), 'utf8').trim(),
    };
    if (inventory.pages.some((p) => ['/play/', '/Arcade/'].includes(p.route))) {
      templates.arcade = readFileSync(join(root, '_includes', 'arcade-games.html'), 'utf8').trim();
    }
    validateTemplates(templates);
    const toolRegistry = readJson(join(root, '_data', 'tools.json'));
    const blogRegistry = readJson(join(root, '_data', 'blogs.json'));
    const gamesPath = join(root, '_data', 'games.json');
    const games = existsSync(gamesPath) ? validateGames(readJson(gamesPath), new Set(inventory.pages.map((page) => page.route))) : undefined;
    for (const game of games?.games ?? []) {
      const [asset, symbol] = game.art.split('#');
      const artFile = join(root, asset);
      if (!existsSync(artFile)) throw new Error(`${game.id}: Game art is missing: ${game.art}`);
      if (symbol && !htmlTokens(readFileSync(artFile, 'utf8'), asset).some((token) =>
        isElement(token) && token.name === 'symbol' && attr(token, 'id') === symbol)) {
        throw new Error(`${game.id}: Game art symbol is missing: ${game.art}`);
      }
    }
    const tools = inventory.pages.some((p) => p.route.startsWith('/tools/')) ? registryItems(toolRegistry, 'tools', inventory) : [];
    const blogs = inventory.pages.some((p) => p.route.startsWith('/blog/')) ? registryItems(blogRegistry, 'posts', inventory) : [];
    const editorialRoutes = new Set(blogs.map((post) => normalizeRoute(post.url)));
    if (inventory.pages.some((page) => page.route === '/parents/')) editorialRoutes.add('/parents/');
    if (editorialRoutes.size) templates.editorial = readFileSync(join(root, '_includes', 'editorial-ad.html'), 'utf8').trim();
    const scopedFiles = new Set([...inventory.pages.map((p) => fileForRoute(p.route)), ...ARCHIVE_ROUTES.map(fileForRoute), '404.html'].map((p) => p.split('/').join(sep)));
    for (const file of publicFiles(root)) {
      if (!scopedFiles.has(file)) result.errors.push(`${file}: Public HTML is absent from _data\\public-pages.json (do not auto-index it)`);
    }
    const seenTitles = new Map();
    const seenDescriptions = new Map();
    const stage = (file, before, after, removals = []) => {
      if (before !== after) result.changes.push({ file, before, after, removals });
    };
    const safeRead = (file) => {
      const target = join(root, file);
      if (lstatSync(target).isSymbolicLink()) throw new Error(`${file}: Symlinks are not public build inputs`);
      const resolved = relative(realpathSync(root), realpathSync(target));
      if (isAbsolute(resolved) || resolved.startsWith(`..${sep}`) || resolved === '..' || !resolved) {
        throw new Error(`${file}: Build input resolves outside the website root`);
      }
      return readFileSync(target, 'utf8');
    };
    for (const page of inventory.pages) {
      const file = fileForRoute(page.route).split('/').join(sep);
      try {
        const before = safeRead(file);
        const transformed = transformPublicPage(before, page, { templates, origin: inventory.origin, tools, toolRegistry, blogs, games, editorialRoutes }, file);
        for (const [key, seen] of [['title', seenTitles], ['description', seenDescriptions]]) {
          const value = transformed.metadata[key].replace(/\s+/g, ' ').toLowerCase();
          if (seen.has(value)) result.errors.push(`${file}: Duplicate public ${key} (also ${seen.get(value)})`);
          seen.set(value, file);
        }
        result.warnings.push(...transformed.warnings);
        stage(file, before, transformed.html, transformed.removals);
        result.pages++;
      } catch (error) { result.errors.push(errorText(file, error)); }
    }
    for (const route of ARCHIVE_ROUTES) {
      const file = fileForRoute(route).split('/').join(sep);
      if (!existsSync(join(root, file))) continue;
      try {
        const before = safeRead(file);
        stage(file, before, transformArchive(before, route, file));
      } catch (error) { result.errors.push(errorText(file, error)); }
    }
    const sitemap = join(root, 'sitemap.xml');
    stage('sitemap.xml', existsSync(sitemap) ? safeRead('sitemap.xml') : '', renderSitemap(inventory));
    if (write && !result.errors.length) {
      for (const change of result.changes) {
        writeFileSync(join(root, change.file), change.after, 'utf8');
        result.written++;
      }
      result.wrote = true;
    }
  } catch (error) { result.errors.push(error.message); }
  return result;
}

function cli(args) {
  let write = false;
  let explicitMode = false;
  let root;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help') {
      console.log('node .\\scripts\\build-site.mjs --write | --check [--root <fixture-root>]\nDefault: read-only --check. Writes only inventoried public HTML, known archive robots metadata, and sitemap.xml.');
      return 0;
    }
    if (args[i] === '--write' || args[i] === '--check') {
      if (explicitMode) throw new Error('Choose exactly one of --write and --check');
      write = args[i] === '--write';
      explicitMode = true;
    } else if (args[i] === '--root' && args[i + 1] && !args[i + 1].startsWith('--')) root = args[++i];
    else throw new Error(`Unknown or incomplete option: ${args[i]}`);
  }
  const result = buildSite({ root, write });
  for (const warning of result.warnings) console.warn(`WARN ${warning}`);
  for (const error of result.errors) console.error(`ERROR ${error}`);
  if (!write || result.errors.length) {
    for (const change of result.changes.slice(result.written)) {
      console.log(`STALE ${change.file}`);
      for (const removal of change.removals) console.log(`  ${change.file}:${removal.line}: Remove ${removal.reason}`);
    }
  }
  if (result.errors.length) {
    console.error(`Site build failed (${result.errors.length} errors); ${result.written ? `stopped after ${result.written} writes; rerun after resolving the error` : 'no files written'}.`);
    return 1;
  }
  if (!write && result.changes.length) {
    console.error(`Site build is stale (${result.changes.length} files). Run node .\\scripts\\build-site.mjs --write after content edits finish.`);
    return 1;
  }
  console.log(write ? `Built ${result.pages} public pages; updated ${result.changes.length} files.` : `Site build is current (${result.pages} public pages).`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = cli(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
}
