# Otterly Games — Site Architecture Audit & Blueprint

## 1. Current State: Problems Found

### 1.1 Tool Inventory Mismatch (Critical)

**12 tool pages exist** in `tools/`, but they are listed inconsistently:

| Tool File              | tools/index.html | Homepage | Schema JSON-LD |
|------------------------|:---:|:---:|:---:|
| multiplication-practice | ✅ | ✅ | ✅ |
| division-practice       | ✅ | ✅ | ✅ |
| multiplication-table    | ✅ | ✅ | ✅ |
| column-multiplication   | ✅ | ❌ | ✅ |
| long-division           | ✅ | ✅ | ✅ |
| math-quiz               | ✅ | ✅ | ✅ |
| calculator              | ✅ | ❌ | ✅ |
| spelling-bee            | ✅ | ✅ | ✅ |
| clock-lessons           | ✅ | ❌ | ✅ |
| **hour-hand**           | ❌ | ✅ | ❌ |
| **minute-hand**         | ❌ | ✅ | ❌ |
| **am-pm**               | ❌ | ❌ | ❌ |

**Impact**: Hour Hand, Minute Hand are linked from the homepage but **invisible** from the
Tools listing page. AM-PM exists on disk but is orphaned — linked from nowhere. Schema
says "9 tools" but 12 exist.

### 1.2 CSS Duplication (High)

| Component | Where CSS Lives |
|-----------|----------------|
| `.tool-card` (homepage) | `css/homepage.css` (inline-card with icon+text layout) |
| `.tool-card` (tools index) | Inline `<style>` in `tools/index.html` (emoji + h3 + p + cta layout) |
| `.tool-card` (dark-brand) | `css/dark-brand.css` (yet another definition) |
| Nav bar | Copy-pasted inline in **every** tool & blog page, plus `css/homepage.css` |
| Footer | Copy-pasted inline in **every** tool & blog page |
| CSS Variables | `--pp/#c4b5fd` in tool pages vs `--pastel-purple/#c4b5fd` in index pages |
| Base reset | Repeated in every single HTML file |

**Impact**: A brand change (colors, fonts, nav links) requires editing **15+ files**
manually. Tool pages and the tools listing page use completely different card HTML
structures, so visual improvements to one don't apply to the other.

### 1.3 No Shared Components

Every page is a fully self-contained HTML file with:
- Its own `<style>` block (nav, footer, variables, reset, page-specific)
- Its own copy of the nav HTML with hard-coded links
- Its own copy of the footer HTML
- Its own Google Analytics + AdSense snippet
- Its own favicon definition

**Impact**: Silo development. Fix the nav in one tool page? The other 14 pages still
have the old nav.

### 1.4 Blog Has the Same Problem

Homepage hardcodes 3 blog cards. Blog index has its own card list. Adding a new blog
post requires editing:
1. The new blog post HTML file
2. `blog/index.html` (add to listing)
3. `index.html` (update the preview section)
4. `sitemap.xml`

### 1.5 Adding a New Tool Today = 5 Manual Edits

1. Create `tools/new-tool.html` (copy-paste 60+ lines of boilerplate)
2. Add card to `tools/index.html`
3. Add card to `index.html` homepage section
4. Update Schema JSON-LD `numberOfItems` + `itemListElement` in `tools/index.html`
5. Update `sitemap.xml`

If any step is forgotten, the tool is partially orphaned — exactly the problem with
hour-hand, minute-hand, and am-pm.

---

## 2. Target Architecture

### 2.1 Design Principles

| Principle | Rule |
|-----------|------|
| **Single Source of Truth** | Every tool and blog post is defined once in a central registry |
| **DRY Components** | Nav, footer, head-meta, analytics = shared includes, defined once |
| **Data-Driven Rendering** | Listing pages and homepage previews render from the same data |
| **Convention > Configuration** | New tool = add file + one registry entry; everything else auto-generates |
| **Progressive Enhancement** | Works as static HTML; JS adds interactivity only |
| **No Build Step Required** | All solutions work with vanilla HTML/CSS/JS on GitHub Pages |

### 2.2 File Structure (Target)

```
/
├── _data/
│   ├── tools.json          ← Single registry of ALL tools
│   ├── blogs.json           ← Single registry of ALL blog posts
│   └── site.json            ← Brand-level config (name, colors, analytics IDs)
│
├── _includes/
│   ├── nav.html             ← Shared navigation (injected by JS)
│   ├── footer.html          ← Shared footer (injected by JS)
│   └── head-common.html     ← Analytics, AdSense, favicon, fonts
│
├── css/
│   ├── base.css             ← Reset, variables, typography, utilities
│   ├── components.css       ← .tool-card, .blog-card, .nav, .footer (ONE definition)
│   ├── homepage.css          ← Homepage-specific layout
│   └── tool-page.css         ← Shared layout for individual tool pages
│
├── js/
│   ├── includes.js          ← Loads nav + footer from _includes/
│   ├── registry.js          ← Reads tools.json + blogs.json, renders grids
│   └── main.js              ← Scroll effects, nav toggle, shared UX
│
├── tools/
│   ├── index.html           ← Renders ALL tools from tools.json automatically
│   ├── hour-hand.html        ← Individual tool page (uses shared CSS + JS)
│   ├── minute-hand.html
│   ├── am-pm.html
│   └── ...
│
├── blog/
│   ├── index.html           ← Renders ALL posts from blogs.json automatically
│   └── *.html
│
├── index.html               ← Homepage (tools preview + blog preview from JSON)
└── sitemap.xml               ← Can be auto-generated from registry
```

---

## 3. Implementation Plan

### Phase 1: Registry (Single Source of Truth)

Create `_data/tools.json` — the canonical list of every tool:

```json
{
  "tools": [
    {
      "id": "hour-hand",
      "title": "Hour Hand",
      "shortTitle": "Hour Hand",
      "emoji": "🖐️",
      "description": "Drag the short hand, see the hour",
      "fullDescription": "Interactive hour hand lesson for kids. Drag the short hand around the clock to see the hour change.",
      "url": "/tools/hour-hand.html",
      "category": "time",
      "ageRange": "Ages 5–8",
      "cta": "Learn Free →",
      "featured": true,
      "order": 1
    },
    {
      "id": "minute-hand",
      "title": "Minute Hand",
      "shortTitle": "Minute Hand",
      "emoji": "⏱️",
      "description": "Grab the long hand, count minutes",
      "fullDescription": "Interactive minute hand lesson for kids. Drag the long hand around the clock and see minutes change.",
      "url": "/tools/minute-hand.html",
      "category": "time",
      "ageRange": "Ages 5–8",
      "cta": "Learn Free →",
      "featured": true,
      "order": 2
    },
    {
      "id": "am-pm",
      "title": "AM & PM",
      "shortTitle": "AM & PM",
      "emoji": "🌅",
      "description": "Learn morning vs afternoon",
      "fullDescription": "Interactive AM and PM lesson for kids. Slide through a full day and learn which activities happen in AM and PM.",
      "url": "/tools/am-pm.html",
      "category": "time",
      "ageRange": "Ages 5–8",
      "cta": "Learn Free →",
      "featured": false,
      "order": 3
    }
  ]
}
```

Similarly `_data/blogs.json`:

```json
{
  "posts": [
    {
      "id": "division-for-kids",
      "title": "Division for Kids Explained Simply",
      "excerpt": "How to teach division to kids in a way they actually understand.",
      "url": "/blog/division-for-kids-explained-simply.html",
      "date": "2026-03-02",
      "displayDate": "Mar 2, 2026",
      "featured": true,
      "order": 1
    }
  ]
}
```

### Phase 2: Shared Components

#### `_includes/nav.html` — one nav, used everywhere:

```html
<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-brand">
      <img src="/images/Otter-mascot.png" alt="Otterly Games" width="40" height="40">
      <span class="brand-text">Otterly Games</span>
    </a>
    <button class="nav-toggle" id="navToggle" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
    <div class="nav-links" id="navLinks">
      <a href="/#games">Games</a>
      <a href="/tools/">Tools</a>
      <a href="/blog/">Blog</a>
      <a href="/about.html">About</a>
      <a href="/contact.html">Contact</a>
      <a href="/#games" class="nav-cta">Get Our Games →</a>
    </div>
  </div>
</nav>
```

#### `js/includes.js` — inject shared components:

```js
(function() {
  // Load and inject a component
  async function loadComponent(url, targetSelector, position) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) return;
      const html = await resp.text();
      const target = document.querySelector(targetSelector);
      if (target) target.insertAdjacentHTML(position, html);
    } catch(e) { console.warn('Component load failed:', url, e); }
  }

  // Inject nav at top of body, footer at bottom
  loadComponent('/_includes/nav.html', 'body', 'afterbegin');
  loadComponent('/_includes/footer.html', 'body', 'beforeend');

  // Highlight active nav link
  document.addEventListener('DOMContentLoaded', () => {
    const path = location.pathname;
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === path || (href !== '/' && path.startsWith(href))) {
        a.classList.add('active');
      }
    });
    // Nav toggle
    const toggle = document.getElementById('navToggle');
    if (toggle) toggle.addEventListener('click', () =>
      document.getElementById('navLinks').classList.toggle('open')
    );
  });
})();
```

### Phase 3: Data-Driven Rendering

#### `js/registry.js` — render tool grids and blog previews from JSON:

```js
const OG = window.OG || {};

OG.loadRegistry = async function() {
  if (OG._tools) return;
  try {
    const [toolsResp, blogsResp] = await Promise.all([
      fetch('/_data/tools.json'),
      fetch('/_data/blogs.json')
    ]);
    OG._tools = (await toolsResp.json()).tools;
    OG._blogs = (await blogsResp.json()).posts;
  } catch(e) { console.warn('Registry load failed', e); }
};

// Render FULL tools grid (for tools/index.html)
OG.renderToolsGrid = async function(containerSelector, options = {}) {
  await OG.loadRegistry();
  const container = document.querySelector(containerSelector);
  if (!container || !OG._tools) return;

  const categories = {};
  OG._tools.forEach(t => {
    if (!categories[t.category]) categories[t.category] = [];
    categories[t.category].push(t);
  });

  const categoryLabels = { math: '🧮 Math Practice & Drills', time: '🕐 Time & Clocks', language: '📚 English' };

  let html = '';
  for (const [cat, tools] of Object.entries(categories)) {
    tools.sort((a,b) => a.order - b.order);
    html += `<div class="tools-category fade-in">
      <div class="tools-category-header"><h2>${categoryLabels[cat] || cat}</h2></div>
      <div class="tools-grid">
        ${tools.map(t => OG._toolCardFull(t)).join('')}
      </div>
    </div>`;
  }
  container.innerHTML = html;
};

// Render PREVIEW tools grid (for homepage)
OG.renderToolsPreview = async function(containerSelector, maxItems = 8) {
  await OG.loadRegistry();
  const container = document.querySelector(containerSelector);
  if (!container || !OG._tools) return;

  const featured = OG._tools
    .filter(t => t.featured)
    .sort((a,b) => a.order - b.order)
    .slice(0, maxItems);

  container.innerHTML = featured.map(t =>
    `<a href="${t.url}" class="tool-card fade-in" data-category="${t.category}">
      <span class="tool-icon">${t.emoji}</span>
      <div class="tool-text">
        <strong>${t.shortTitle}</strong>
        <small>${t.description}</small>
      </div>
    </a>`
  ).join('');
};

// Render blog previews (for homepage)
OG.renderBlogPreview = async function(containerSelector, maxItems = 3) {
  await OG.loadRegistry();
  const container = document.querySelector(containerSelector);
  if (!container || !OG._blogs) return;

  const featured = OG._blogs
    .filter(p => p.featured)
    .sort((a,b) => new Date(b.date) - new Date(a.date))
    .slice(0, maxItems);

  container.innerHTML = featured.map(p =>
    `<a href="${p.url}" class="blog-preview-card fade-in">
      <span class="blog-preview-date">${p.displayDate}</span>
      <h4>${p.title}</h4>
      <p>${p.excerpt}</p>
    </a>`
  ).join('');
};

// Full tool card template (for tools/index.html)
OG._toolCardFull = function(t) {
  return `<a href="${t.url}" class="tool-card">
    <span class="tool-emoji">${t.emoji}</span>
    <h3>${t.title}</h3>
    <span class="age-badge">${t.ageRange}</span>
    <p>${t.fullDescription}</p>
    <span class="tool-cta">${t.cta}</span>
  </a>`;
};

window.OG = OG;
```

### Phase 4: Shared CSS

#### `css/base.css` — universal reset + variables + typography:

```css
/* Single source of truth for variables */
:root {
  --pastel-purple: #c4b5fd;
  --pastel-pink: #f9a8d4;
  --pastel-blue: #93c5fd;
  --pastel-green: #86efac;
  --pastel-amber: #fcd34d;
  --dark-bg: #0a0a0f;
  --dark-card: #141420;
  --dark-surface: #1a1a2e;
  --dark-border: #2a2a3e;
  --text-primary: #f0f0f8;
  --text-secondary: #9898b0;
  --font-heading: 'Nunito', sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
}
```

#### `css/components.css` — ONE definition for tool-card, blog-card, nav, footer:

All `.tool-card`, `.blog-card`, `.nav`, `.footer` styles live here — used by
every page. No more inline `<style>` blocks redefining them.

---

## 4. Migration Path (Step by Step)

The migration does NOT require rewriting everything at once. It's incremental:

### Step 1: Create `_data/tools.json` with all 12 tools ✅ (no disruption)
### Step 2: Create `_data/blogs.json` with all 8 posts ✅ (no disruption)
### Step 3: Create `css/base.css` + `css/components.css`
   - Extract shared nav, footer, card, variable styles
   - Existing pages continue to work (additive)
### Step 4: Create `js/includes.js` + `js/registry.js`
### Step 5: Update `tools/index.html`
   - Remove hardcoded cards → `<div id="tools-container"></div>` + `OG.renderToolsGrid()`
   - Remove inline styles → `<link rel="stylesheet" href="/css/base.css">` + `<link rel="stylesheet" href="/css/components.css">`
   - Remove inline nav/footer → loaded by `includes.js`
### Step 6: Update `index.html` homepage
   - Tools preview section → `<div id="tools-preview"></div>` + `OG.renderToolsPreview()`
   - Blog preview section → `<div id="blog-preview"></div>` + `OG.renderBlogPreview()`
### Step 7: Update individual tool pages
   - Replace inline nav/footer/styles with shared CSS + includes.js
   - This can be done one page at a time
### Step 8: Update individual blog pages (same pattern)

---

## 5. Adding a New Tool (After Migration)

**One step**:

1. Create `tools/new-tool.html` using the tool page template
2. Add one entry to `_data/tools.json`

That's it. The tool automatically appears on:
- `tools/index.html` (renders from JSON)
- Homepage tools preview (if `"featured": true`)
- Schema JSON-LD (generated from JSON)

No more forgetting to update 5 files. No more orphaned tools.

---

## 6. Adding a New Blog Post (After Migration)

1. Create `blog/new-post.html` using the blog page template
2. Add one entry to `_data/blogs.json`

Automatically appears on blog index and homepage preview.

---

## 7. Immediate Fixes (Before Full Migration)

Even before the full architecture migration, these gaps should be fixed **now**:

### 7.1 Add missing tools to `tools/index.html`
- **Hour Hand** (exists as file, linked from homepage, missing from tools listing)
- **Minute Hand** (same)
- **AM & PM** (exists as file, orphaned entirely)

### 7.2 Update Schema JSON-LD
- Change `numberOfItems` from 9 → 12
- Add Hour Hand, Minute Hand, AM & PM to `itemListElement`

### 7.3 Add missing tools to homepage
- **Calculator**, **Column Multiplication**, **Clock Lessons** are on the tools page
  but not on the homepage preview (or at minimum ensure the "View all tools →" link
  is prominent)

### 7.4 Update `sitemap.xml`
- Ensure `am-pm.html`, `hour-hand.html`, `minute-hand.html` are listed

---

## 8. Tool Page Template

Standard structure for any new tool page. **Every section marked MANDATORY must
be present before the page goes live.** See Section 10 for the content-quality
rules that drive these requirements.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TOOL_TITLE}} | Otterly Games</title>
  <meta name="description" content="{{TOOL_DESCRIPTION}}">
  <link rel="canonical" href="https://otterlygames.com/tools/{{TOOL_SLUG}}.html">
  <!-- OG + Twitter meta tags -->
  <!-- Schema JSON-LD: WebApplication + BreadcrumbList + FAQPage (MANDATORY) -->
  <link rel="icon" href="data:image/svg+xml,...">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/components.css">
  <link rel="stylesheet" href="/css/tool-page.css">
  <script src="/js/includes.js" defer></script>
  <!-- Analytics (from base.css or a shared snippet) -->
  <!-- ⚠️  NO AdSense on noindex pages (404, redirects, error pages) -->
</head>
<body>
  <!-- Nav injected by includes.js -->

  <!-- MANDATORY: Breadcrumb back-link -->
  <a href="/tools/" class="breadcrumb-back">← All Tools</a>

  <section class="hero">
    <h1>{{TOOL_TITLE}}</h1>
    <p>{{TOOL_SUBTITLE}}</p>
  </section>

  <main class="main">
    <!-- Tool-specific interactive content here -->
  </main>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- MANDATORY: Educational Prose (min 400 words, see §10.3)   -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="edu-prose" style="max-width:700px;margin:2rem auto;padding:0 1.5rem">
    <h2>{{TOPIC_HEADING_1}}</h2>
    <p>…original educational content…</p>

    <h2>{{TOPIC_HEADING_2}}</h2>
    <p>…original educational content…</p>

    <h2>Teaching Tips for Parents</h2>
    <p>…actionable parenting advice…</p>
  </section>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- MANDATORY: FAQ Section (min 3 Q&As, see §10.3)            -->
  <!-- Must match the FAQPage schema in <head>                   -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="faq-section" style="max-width:700px;margin:1.5rem auto;padding:0 1.5rem">
    <h2>Frequently Asked Questions</h2>
    <details><summary>{{QUESTION_1}}</summary><p>{{ANSWER_1}}</p></details>
    <details><summary>{{QUESTION_2}}</summary><p>{{ANSWER_2}}</p></details>
    <details><summary>{{QUESTION_3}}</summary><p>{{ANSWER_3}}</p></details>
  </section>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- MANDATORY: Related Tools grid (min 3 links, see §10.3)    -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="related-tools" style="max-width:700px;margin:1.5rem auto;padding:0 1.5rem">
    <h2>Related Tools</h2>
    <div class="related-grid">
      <a href="/tools/{{RELATED_1}}.html" class="related-card">…</a>
      <a href="/tools/{{RELATED_2}}.html" class="related-card">…</a>
      <a href="/tools/{{RELATED_3}}.html" class="related-card">…</a>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- MANDATORY: <noscript> fallback (see §10.4)                -->
  <!-- Googlebot must see meaningful content without JS           -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <noscript>
    <section style="max-width:700px;margin:2rem auto;padding:1rem 1.5rem">
      <h2>{{TOOL_TITLE}}</h2>
      <p>This interactive tool requires JavaScript. {{TOOL_STATIC_DESCRIPTION}}</p>
      <p><a href="/tools/">← Browse all free learning tools</a></p>
    </section>
  </noscript>

  <!-- Footer injected by includes.js -->
  <script src="/js/main.js"></script>
</body>
</html>
```

---

## 9. Checklist: What Makes a Good Tool Page

### 9a. Technical Quality

- [ ] Listed in `_data/tools.json`
- [ ] Has proper `<title>` and `<meta description>`
- [ ] Has canonical URL
- [ ] Has OG + Twitter meta tags
- [ ] Has Schema JSON-LD: **WebApplication + BreadcrumbList + FAQPage**
- [ ] Uses shared nav (via includes.js or inline from template)
- [ ] Uses shared footer
- [ ] Uses shared CSS (base.css + components.css)
- [ ] Mobile responsive
- [ ] Has breadcrumb back to Tools (visible `← All Tools` link)
- [ ] Cross-links to ≥ 3 related tools
- [ ] Included in sitemap.xml
- [ ] Has `<noscript>` fallback with static description + link back to tools index

### 9b. Content Quality (AdSense Gate — see §10)

- [ ] **≥ 400 words** of original educational prose below the interactive tool
- [ ] **≥ 3 FAQ items** (visible `<details>` elements matching FAQPage schema)
- [ ] Prose is **unique** — not duplicated from another tool page
- [ ] Prose provides **genuine teaching value** for parents (tips, milestones, explanations)
- [ ] Related Tools section with ≥ 3 cross-links to sibling tool pages
- [ ] **No AdSense script** on any page that has `<meta name="robots" content="noindex">`
- [ ] Googlebot can see ≥ 500 words of static HTML **without executing JavaScript**

> **Rule: No page goes live until EVERY box is checked.** A page that fails 9b
> is "thin content" and risks another AdSense rejection for the entire domain.

---

## Summary

| Problem | Root Cause | Solution |
|---------|-----------|----------|
| 3 tools missing from tools listing | No single registry | `_data/tools.json` |
| Tools on homepage ≠ tools on listing page | Hardcoded in two places | Render both from same JSON |
| Nav/footer vary across 15+ pages | Copy-paste development | Shared includes |
| CSS defined 3+ times for `.tool-card` | No shared stylesheet | `css/components.css` |
| Adding a tool requires 5 edits | No convention | JSON registry + auto-render |
| Brand change = edit 15+ files | No shared variables | `css/base.css` with single `:root` |
| **AdSense "Low value content" rejection** | Thin tool pages, JS-only listing pages, ads on 404 | §10: Content minimums, `<noscript>` fallbacks, AdSense placement rules |
| Googlebot sees empty listing pages | No `<noscript>` fallback for JS-rendered content | §10.4: Every JS-rendered block needs static HTML fallback |
| AdSense on noindex pages | No policy awareness in template | §10.5: Never place AdSense on noindex/error pages |
| Tool pages with < 200 words | No content-quality gate | §10.3: Min 400 words prose + FAQ + related tools per tool page |
| Missing FAQPage schema on tool pages | No structured data checklist | §10.6: Required schema types per page type |

---

## 10. AdSense & Content Quality Standards

> **Context:** In early 2026 Google AdSense rejected the site for **"Low value
> content"**, citing failure to meet *minimum content requirements*, *unique &
> high-quality content*, and *webmaster quality guidelines (thin content)*.
> This section documents the root causes and the enforceable rules that prevent
> a repeat.

### 10.1 What Went Wrong (Root-Cause Analysis)

| # | Problem | Why It Matters | Pages Affected |
|---|---------|---------------|----------------|
| 1 | **JS-only listing pages** — `blog/index.html` and `tools/index.html` rendered their entire content via JavaScript. Googlebot's renderer sometimes doesn't execute JS, so Google saw near-empty pages (~40 words of static text). | Google treats a page with no crawlable body text as "thin content". Two key index pages appearing empty tanks the site-wide quality score. | `blog/index.html`, `tools/index.html` |
| 2 | **AdSense on a `noindex` 404 page** — `404.html` loaded the AdSense script despite having `<meta name="robots" content="noindex">`. | Google explicitly flags AdSense on non-indexable pages as a policy violation. It signals that ads are placed without regard for user or crawler experience. | `404.html` |
| 3 | **Thin interactive-only tool pages** — `am-pm.html`, `hour-hand.html`, `minute-hand.html` had an interactive widget but zero educational prose, no FAQ, no related links, and no `<noscript>` fallback. | Without JS the page was essentially blank. Even with JS, the total crawlable text was < 200 words — well below the threshold Google expects for a page displaying ads. | `tools/am-pm.html`, `tools/hour-hand.html`, `tools/minute-hand.html` |
| 4 | **No `<noscript>` fallbacks anywhere** — Pages that depend on JS for core content had no static alternative. | Crawlers, accessibility tools, and users with JS disabled saw empty containers. | All JS-rendered listing pages, thin tool pages |
| 5 | **Missing structured data** — Thin pages lacked `FAQPage` and `BreadcrumbList` schema, reducing their perceived richness in Google's evaluation. | While schema alone doesn't fix thin content, its absence meant Google had fewer signals to understand the page's purpose and value. | `tools/am-pm.html`, `tools/hour-hand.html`, `tools/minute-hand.html` |

### 10.2 The Fix Applied

| Page | What Was Added |
|------|----------------|
| `blog/index.html` | BreadcrumbList schema, visible breadcrumb nav, ~200-word intro prose, `<noscript>` fallback with all 8 blog post cards as static HTML, ~300-word "What We Write About" section |
| `404.html` | Removed AdSense and Analytics scripts entirely |
| `tools/index.html` | BreadcrumbList schema, visible breadcrumb nav, `<noscript>` fallback with all 12 tools as static HTML cards organized by category |
| `tools/am-pm.html` | FAQPage schema (3 Q&As), breadcrumb back-link, ~500 words educational prose, FAQ section, related tools grid (3 tools), `<noscript>` fallback |
| `tools/hour-hand.html` | FAQPage schema (3 Q&As), breadcrumb back-link, ~600 words educational prose, FAQ section, related tools grid (3 tools), `<noscript>` fallback |
| `tools/minute-hand.html` | FAQPage schema (3 Q&As), breadcrumb back-link, ~700 words educational prose, FAQ section, related tools grid (3 tools), `<noscript>` fallback |

### 10.3 Content Minimum Standards (Mandatory)

These are hard rules. No page should be published or merged without meeting them.

#### Per-Page Word Counts

| Page Type | Min Static Words | Required Sections |
|-----------|:---:|---|
| **Tool page** | 400 | Educational prose (≥ 2 `<h2>` subsections), FAQ (≥ 3 `<details>`), Related Tools (≥ 3 links), `<noscript>` |
| **Blog post** | 700 | Full article body, author/date, breadcrumb, related posts |
| **Listing page** (tools index, blog index) | 200 | Intro paragraph, `<noscript>` fallback with **every** item as static HTML |
| **App page** | 300 | Feature list, screenshots/description, download links, SoftwareApplication schema |
| **Static page** (about, contact, privacy) | 200 | Substantive original content relevant to site purpose |

> **"Static words"** = text visible in the raw HTML source without executing
> JavaScript. This is what Googlebot's initial parser sees.

#### Content Must Be Unique

- Every tool page's prose must be **original** — not copied/paraphrased from
  another tool page on the site.
- FAQ answers must be **specific** to that tool's subject. Generic filler like
  "This tool is great for kids" repeated across pages counts as duplicate content.
- Use the tool's subject matter to generate genuinely helpful educational
  guidance (teaching tips, developmental milestones, common mistakes, etc.).

### 10.4 Noscript & Static Fallback Rules

| Rule | Rationale |
|------|-----------|
| Every page that renders **any** content via JavaScript MUST have a `<noscript>` block with equivalent static HTML | Googlebot may not execute JS. Without fallback, the page appears empty → thin content. |
| Listing pages (`blog/index.html`, `tools/index.html`) must include **every item** in the `<noscript>` block as a static card (title, excerpt, link) | Partial fallbacks still leave the page looking thin. Full coverage ensures Google sees the complete content catalogue. |
| The `<noscript>` block must be **kept in sync** with `_data/tools.json` / `_data/blogs.json` | When a new tool or blog post is added, its static card must be added to the relevant `<noscript>` block too. |
| Interactive tool pages must have enough **non-JS prose** (edu-prose + FAQ + related tools) that the page exceeds 400 words even if the `<canvas>`/`<script>` tool doesn't render | The educational sections are pure HTML — they always render. This is the safety net. |

### 10.5 AdSense Placement Rules

| Rule | Detail |
|------|---------|
| **Never** place AdSense on `noindex` pages | 404, redirects, error pages, staging previews. Google explicitly flags this. |
| **Never** place AdSense on pages with < 400 static words | The page will be classified as thin content with ads = policy violation. |
| **Never** place AdSense on pages that are substantially JS-rendered without a full `<noscript>` fallback | Google's ad crawler may see an empty page — instant flag. |
| AdSense `<script>` goes in `<head>` of approved pages only | Keep it out of shared includes if any include is used on noindex pages. Consider a conditional like `data-adsense="true"` attribute. |
| After **any** structural site change, re-audit ad placement | New pages, moved pages, or template changes can inadvertently put ads on thin/noindex pages. |

### 10.6 Structured Data Requirements

| Page Type | Required Schema Types |
|-----------|-----------------------|
| Tool page | `WebApplication` + `BreadcrumbList` + `FAQPage` |
| Blog post | `Article` (or `BlogPosting`) + `BreadcrumbList` |
| Listing page | `CollectionPage` + `ItemList` + `BreadcrumbList` |
| App page | `SoftwareApplication` + `BreadcrumbList` |
| Homepage | `Organization` + `WebSite` |

- FAQPage schema `mainEntity` array must **exactly match** the visible FAQ
  `<details>` elements on the page (same questions, same answers).
- `ItemList.numberOfItems` must match the actual count of items rendered.
- Run Google's Rich Results Test on every new page before publishing.

### 10.7 New Page Launch Checklist (Pre-Publish Gate)

Before any new page is deployed to production:

```
□  Word count ≥ minimum for page type (§10.3)
□  Content is original — not duplicated from another page on the site
□  <noscript> fallback present if any content is JS-rendered
□  AdSense script is absent if page is noindex or below word threshold
□  All required Schema JSON-LD types are present (§10.6)
□  Schema data matches visible page content
□  Page is listed in _data/tools.json or _data/blogs.json
□  Page is listed in sitemap.xml
□  Google Rich Results Test passes
□  Page renders meaningful content with JavaScript disabled
□  Breadcrumb visible and links back to parent listing
□  ≥ 3 cross-links to related pages within the site
```

> **Enforcement:** Treat this checklist as a merge-blocking gate. Every page
> must satisfy it before going live. A single thin page can trigger an
> AdSense rejection for the **entire domain**, not just that page.

### 10.8 Ongoing Maintenance

- **When adding a tool:** Add entry to `_data/tools.json`, add static card to
  `tools/index.html` `<noscript>`, update `sitemap.xml`, and ensure the tool
  page itself passes the full §10.7 checklist.
- **When adding a blog post:** Add entry to `_data/blogs.json`, add static card
  to `blog/index.html` `<noscript>`, update `sitemap.xml`.
- **Quarterly audit:** Review all pages against §10.3 word-count minimums.
  Tools that have grown stale or lost content should be refreshed.
- **After any AdSense change:** Re-verify that no noindex page loads the
  AdSense script.
