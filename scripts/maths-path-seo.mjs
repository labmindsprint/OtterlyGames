// SEO and crawlability rules for /learn/ and every /learn/maths/ page. Pure string checks so build-site and tests share them.
const one = (html, re) => [...html.matchAll(re)];
const text = (value) => value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const meta = (html, attrName, key) => {
  const tag = one(html, /<meta\s[^>]*>/gi).map((m) => m[0]).find((t) => new RegExp(`${attrName}="${key}"`, 'i').test(t));
  return tag?.match(/content="([^"]*)"/i)?.[1];
};

export const isLearnSeoRoute = (route) => route === '/learn/' || route.startsWith('/learn/maths/');

export function seoProblems(html, route, origin) {
  const out = [];
  const add = (message) => out.push(`${route}: ${message}`);
  const title = one(html, /<title>([^<]*)<\/title>/gi);
  if (title.length !== 1) add('needs exactly one <title>');
  else if (title[0][1].length > 80) add(`title is ${title[0][1].length} characters; keep it at 80 or fewer`);
  const description = meta(html, 'name', 'description');
  if (!description || description.length < 60 || description.length > 175) add('meta description must be 60-175 characters');
  const canonical = one(html, /<link\s[^>]*rel="canonical"[^>]*>/gi).map((m) => m[0].match(/href="([^"]*)"/)?.[1]);
  if (canonical.length !== 1 || canonical[0] !== origin + route) add(`canonical must be ${origin}${route}`);
  for (const key of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt']) if (!meta(html, 'property', key)) add(`missing ${key}`);
  if (meta(html, 'property', 'og:url') !== origin + route) add('og:url must equal the canonical URL');
  if (!/^https:\/\/.+\.(png|jpe?g|webp)$/i.test(meta(html, 'property', 'og:image') ?? '')) add('og:image must be an absolute raster image URL');
  if (meta(html, 'name', 'twitter:card') !== 'summary_large_image' || !meta(html, 'name', 'twitter:image')) add('missing twitter card and image');
  if (/noindex/i.test(meta(html, 'name', 'robots') ?? '')) add('indexable page must not be noindex');
  const h1 = one(html, /<h1[\s>]/gi);
  if (h1.length !== 1) add(`needs exactly one h1 (found ${h1.length})`);
  let last = 0;
  for (const [, level] of one(html, /<h([1-6])[\s>]/gi)) {
    if (last && Number(level) > last + 1) add(`heading level jumps from h${last} to h${level}`);
    last = Number(level);
  }
  for (const img of one(html, /<img\s[^>]*>/gi)) if (!/\salt="/i.test(img[0])) add(`image without alt: ${img[0].slice(0, 60)}`);
  const ld = one(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi).map((m) => {
    try { return JSON.parse(m[1]); } catch (error) { add('invalid JSON-LD'); return {}; }
  });
  const crumbs = ld.find((item) => item['@type'] === 'BreadcrumbList');
  if (!crumbs?.itemListElement?.length) add('missing BreadcrumbList JSON-LD');
  else if (crumbs.itemListElement.at(-1).item !== origin + route && route !== '/learn/') add('breadcrumb must end on this page');
  const raw = JSON.stringify(ld);
  if (/aggregateRating|"review"|ratingValue/.test(raw)) add('ratings and reviews are not allowed in structured data');
  if (/^\/learn\/maths\/class-[^/]+\/[^/]+\/$/.test(route) || /^\/learn\/maths\/pp\d\/[^/]+\/$/.test(route)) {
    const lesson = ld.find((item) => item['@type'] === 'LearningResource');
    if (!lesson?.educationalLevel || !lesson?.teaches?.length || lesson.isAccessibleForFree !== true) add('chapter needs LearningResource with educationalLevel, teaches and isAccessibleForFree');
    if (!/<article class="mp-screen"/.test(html)) add('lesson screens must be present as static HTML');
    if (!/href="\/learn\/maths\/[^"]*\/"[^>]*>(?:Back to|&larr;)/.test(html)) add('missing link back to the class map');
    if (!html.includes('href="/learn/maths/"')) add('missing link to the Maths Path hub');
  }
  if (/\b(IMO|SOF)\b/.test(text(html.replace(/<script[\s\S]*?<\/script>/gi, '')))) add('public copy must not name IMO or SOF');
  return out;
}
