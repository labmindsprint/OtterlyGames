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

Standard structure for any new tool page:

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
  <!-- Schema JSON-LD: WebApplication + BreadcrumbList -->
  <link rel="icon" href="data:image/svg+xml,...">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/components.css">
  <link rel="stylesheet" href="/css/tool-page.css">
  <script src="/js/includes.js" defer></script>
  <!-- Analytics (from base.css or a shared snippet) -->
</head>
<body>
  <!-- Nav injected by includes.js -->

  <section class="hero">
    <h1>{{TOOL_TITLE}}</h1>
    <p>{{TOOL_SUBTITLE}}</p>
  </section>

  <main class="main">
    <!-- Tool-specific content here -->
  </main>

  <!-- Footer injected by includes.js -->
  <script src="/js/main.js"></script>
</body>
</html>
```

---

## 9. Checklist: What Makes a Good Tool Page

- [ ] Listed in `_data/tools.json`
- [ ] Has proper `<title>` and `<meta description>`
- [ ] Has canonical URL
- [ ] Has OG + Twitter meta tags
- [ ] Has Schema JSON-LD (WebApplication + BreadcrumbList)
- [ ] Uses shared nav (via includes.js or inline from template)
- [ ] Uses shared footer
- [ ] Uses shared CSS (base.css + components.css)
- [ ] Mobile responsive
- [ ] Has breadcrumb back to Tools
- [ ] Cross-links to related tools
- [ ] Included in sitemap.xml

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
