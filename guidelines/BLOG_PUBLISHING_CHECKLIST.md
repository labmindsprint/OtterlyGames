# Blog Publishing Guideline — Otterly Games

Every post published to otterlygames.com **must** follow all steps below.
Missing any single step creates orphaned pages, broken navigation, or SEO/AdSense issues — all of which have caused real problems in the past.

---

## 1. File Creation

### 1.1 File Location & Naming

- Save the file to: `blog/<slug>.html`
- **Slug rules:** lowercase, hyphens only, no underscores, no special characters
  - ✅ `how-to-teach-fractions-to-kids.html`
  - ❌ `How_To_Teach_Fractions.html`
- The slug must match the `id` field in `_data/blogs.json` exactly

### 1.2 Required `<head>` Elements

Every post file must include all of the following in `<head>`:

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Post Title] — Otterly Games</title>
<meta name="description" content="[150–160 char summary]">
<meta name="keywords" content="[5–8 relevant keywords]">
<link rel="canonical" href="https://otterlygames.com/blog/[slug].html">

<!-- Open Graph -->
<meta property="og:title" content="[Post Title]">
<meta property="og:description" content="[Summary]">
<meta property="og:type" content="article">
<meta property="og:image" content="https://otterlygames.com/images/og-default.png">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Post Title]">
<meta name="twitter:description" content="[Summary]">
<meta name="twitter:image" content="https://otterlygames.com/images/og-default.png">

<!-- Article JSON-LD -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Post Title]",
  "author": { "@type": "Person", "name": "Otterly Games" },
  "publisher": {
    "@type": "Organization",
    "name": "Otterly Games",
    "logo": { "@type": "ImageObject", "url": "https://otterlygames.com/images/Otter-mascot.png" }
  },
  "datePublished": "YYYY-MM-DD",
  "dateModified": "YYYY-MM-DD",
  "image": "https://otterlygames.com/images/og-default.png",
  "description": "[Summary]"
}
</script>

<!-- BreadcrumbList JSON-LD -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://otterlygames.com/" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://otterlygames.com/blog/" },
    { "@type": "ListItem", "position": 3, "name": "[Post Title]" }
  ]
}
</script>

<!-- Stylesheets -->
<link rel="stylesheet" href="/css/base.css">
<link rel="stylesheet" href="/css/components.css">

<!-- Favicons -->
<link rel="icon" type="image/png" sizes="48x48" href="/images/favicon-48x48.png">
<link rel="icon" type="image/png" sizes="96x96" href="/images/favicon-96x96.png">
<link rel="icon" type="image/png" sizes="192x192" href="/images/favicon-192x192.png">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-NX29GXGV7H"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-NX29GXGV7H');</script>

<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5489426086320283" crossorigin="anonymous"></script>
```

### 1.3 Required `<body>` Structure

The `<body>` tag must have `data-og-includes="nav,footer"` — this is how the shared nav and footer are injected by `js/includes.js`:

```html
<body data-og-includes="nav,footer">
```

The page body must follow this exact section order:

```html
<body data-og-includes="nav,footer">

  <!-- 1. Post hero / header -->
  <section class="post-hero">
    <div class="container">
      <div class="breadcrumbs">
        <a href="/">Home</a> <span>/</span> <a href="/blog/">Blog</a> <span>/</span> [Category]
      </div>
      <div class="post-meta">
        <span class="post-category">[Category]</span>
        <span>[Month D, YYYY]</span>
        <span>&middot;</span>
        <span>[N min read]</span>
      </div>
      <h1 class="post-title">[Post Title]</h1>
    </div>
  </section>

  <!-- 2. Post body -->
  <article class="post-content">
    <!-- article content goes here -->

    <!-- 2a. CTA at the bottom of the article -->
    <div class="post-cta">
      <h3>[CTA Headline]</h3>
      <p>[CTA Description linking to a relevant tool or app]</p>
    </div>
  </article>

  <!-- 3. Author bio — REQUIRED on every post -->
  <aside class="author-bio">
    <img src="/images/Otter-mascot.png" alt="Otterly Games" class="author-bio-avatar">
    <div class="author-bio-info">
      <span class="author-bio-name">Written by Otterly Games</span>
      <p class="author-bio-desc">A mom-built studio creating safe educational games that kids actually want to play. Clock Master and Math Tank are used by families across 50+ countries. Zero data collected, COPPA certified. <a href="/about.html">Read our story →</a></p>
    </div>
  </aside>

  <!-- 4. Related posts — rendered by registry.js, must NOT be omitted -->
  <section class="related-posts" id="related-posts"></section>

  <!-- 5. Post navigation — rendered by registry.js, must NOT be omitted -->
  <nav class="post-nav" id="post-nav"></nav>

  <!-- 6. Scripts — order matters -->
  <script src="/js/includes.js" defer></script>
  <script src="/js/registry.js" defer></script>
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      if (window.OG) {
        OG.renderRelatedPosts('#related-posts');
        OG.renderPostNav('#post-nav');
      }
    });
  </script>

  <!-- 7. Ko-fi widget -->
  <script src='https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'></script>
  <script>kofiWidgetOverlay.draw('otterly_games',{'type':'floating-chat','floating-chat.donateButton.text':'Support me','floating-chat.donateButton.background-color':'#00b9fe','floating-chat.donateButton.text-color':'#fff'});</script>

</body>
```

> **Why this order matters:** `includes.js` injects nav/footer; `registry.js` populates
> `#related-posts` and `#post-nav`. Both scripts are `defer` so they fire after the DOM is
> parsed. The `DOMContentLoaded` callback must call both render functions. Omitting any of
> these leaves the post as a dead-end page with no navigation.

---

## 2. Register the Post in `_data/blogs.json`

This is **the most critical step**. The file `_data/blogs.json` is the single source of truth for the entire blog system. If a post is not registered here:

- It will not appear on `blog/index.html`
- It will not appear in the related-posts section of any other post
- It will have no prev/next navigation
- Google will see it as a low-value orphaned page

### 2.1 Entry Format

Prepend a new object at the **top** of the `posts` array (newest first). Increment the `order` of every existing entry by 1.

```json
{
  "id": "<slug-without-.html>",
  "title": "<Full Post Title>",
  "excerpt": "<One or two sentence summary, 120–160 chars>",
  "url": "/blog/<slug>.html",
  "date": "YYYY-MM-DD",
  "displayDate": "Mon D, YYYY",
  "emoji": "<single relevant emoji>",
  "category": "<one of: Learning Guide | Parenting Tips | Digital Parenting | Learning Resources | App Reviews | Our Story>",
  "categoryClass": "<one of: guide | tips | digital | resources | reviews | story>",
  "readTime": "<N min read>",
  "featured": true,
  "order": 1
}
```

### 2.2 Category / categoryClass Reference

| `category` | `categoryClass` |
|---|---|
| Learning Guide | `guide` |
| Parenting Tips | `tips` |
| Digital Parenting | `digital` |
| Learning Resources | `resources` |
| App Reviews | `reviews` |
| Our Story | `story` |

### 2.3 After Updating blogs.json

Verify:
- All other posts have had their `order` incremented by 1
- No two posts share the same `order` number
- The `id` field matches the HTML filename exactly (without `.html`)
- The `url` field starts with `/blog/` and ends with `.html`

---

## 3. Add the Post to `sitemap.xml`

Insert a new `<url>` block **before the closing `</urlset>` tag**, and update the `blog/` index `<lastmod>` to today's date.

```xml
<url>
  <loc>https://otterlygames.com/blog/<slug>.html</loc>
  <lastmod>YYYY-MM-DD</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.6</priority>
</url>
```

Also update the blog index entry:

```xml
<url>
  <loc>https://otterlygames.com/blog/</loc>
  <lastmod>YYYY-MM-DD</lastmod>   <!-- ← update to today -->
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>
```

---

## 4. Content Quality Requirements

These requirements exist to maintain Google AdSense eligibility and E-E-A-T signals.

### 4.1 Word Count & Structure

| Requirement | Minimum |
|---|---|
| Total word count | 800 words |
| Number of H2 sections | 5 |
| Number of H3 subsections | 1 (where appropriate) |
| Internal links to tools or other posts | 2 |

### 4.2 Content Rules

- **Original content only.** No copy-pasting from other sources. No AI-generated filler text or overly generic phrasing.
- **Accurate dates.** The `datePublished` in JSON-LD, the `displayDate` in the post hero, and the `date` in `blogs.json` must all match. Never reference a past year as "current" (e.g., don't say "Best Apps of 2025" when the post is published in 2026).
- **Honest affiliate disclosure.** Any Amazon or affiliate link must be followed by a disclosure line: *"Some links are affiliate links — if you buy through them, we earn a small commission at no extra cost to you."*
- **Internal linking.** Every post should link to at least one free tool (e.g., `/tools/multiplication-table.html`) and ideally one related blog post.
- **Call to action.** The `<div class="post-cta">` at the bottom of the `<article>` must be present and link to a relevant tool or app.

### 4.3 Meta Description

- Length: 140–160 characters
- Must describe what the reader will learn or get from the post
- Must not duplicate the H1 title word-for-word

---

## 5. Pre-Publish Verification Checklist

Run through this before considering the post complete:

- [ ] HTML file saved to `blog/<slug>.html`
- [ ] `<title>` ends with `— Otterly Games`
- [ ] `<link rel="canonical">` URL matches the actual file path
- [ ] `datePublished` and `dateModified` in JSON-LD are set to today's date (`YYYY-MM-DD`)
- [ ] `<body data-og-includes="nav,footer">` is present
- [ ] `<section class="post-hero">` contains breadcrumbs, post-meta, and H1
- [ ] `<article class="post-content">` contains all body content and a `post-cta` div
- [ ] `<aside class="author-bio">` is present after `</article>`
- [ ] `<section class="related-posts" id="related-posts"></section>` is present
- [ ] `<nav class="post-nav" id="post-nav"></nav>` is present
- [ ] `includes.js`, `registry.js`, and DOMContentLoaded init script are all present before `</body>`
- [ ] Ko-fi overlay script is present before `</body>`
- [ ] Post is registered in `_data/blogs.json` as order 1 with all other orders incremented
- [ ] Post URL is added to `sitemap.xml`
- [ ] `blog/` index `<lastmod>` in `sitemap.xml` is updated to today

---

## 6. What Went Wrong Before (Root Causes)

This section documents the specific failures that led to a Google AdSense "Low Value Content" rejection, so the same mistakes are not repeated.

| Problem | Root Cause | Fix Applied |
|---|---|---|
| 4 posts invisible on blog listing page | Not registered in `_data/blogs.json` | Added all 4 to registry |
| 4 posts had no related-posts or prev/next nav | `registry.js` not included in those files | Added script + sections to all 4 |
| 4 posts missing from sitemap | Forgotten during publishing | Added to `sitemap.xml` |
| No Terms of Service page | Never created | Created `terms.html` |
| No visible author on blog posts | Author only in JSON-LD, not on page | Added `<aside class="author-bio">` to all 12 posts |
| Stale year in post title | Not updated when year rolled over | Fixed "2025" → "2026" |

The common thread: **partial publishing** — creating the HTML file without completing all the registration and integration steps. This guideline exists to make partial publishing impossible to do accidentally.
