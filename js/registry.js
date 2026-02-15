/* ============================================================================
   Otterly Games — Data Registry
   Loads tools.json and blogs.json, renders grids and previews from them.
   Single source of truth: add a tool/blog to the JSON → shows everywhere.
   Usage: <script src="/js/registry.js" defer></script>
   Then call: OG.renderToolsGrid('#container')  or  OG.renderToolsPreview('#container')
   ============================================================================ */
(function () {
  'use strict';

  var OG = window.OG || {};
  OG._tools = null;
  OG._blogs = null;
  OG._categories = null;

  /* ---- Data Loading ---- */

  OG.loadRegistry = function () {
    if (OG._loaded) return OG._loaded;
    OG._loaded = Promise.all([
      fetch('/_data/tools.json').then(function (r) { return r.json(); }),
      fetch('/_data/blogs.json').then(function (r) { return r.json(); })
    ]).then(function (data) {
      OG._categories = data[0].categories;
      OG._tools = data[0].tools;
      OG._blogs = data[1].posts;
    }).catch(function (e) {
      console.warn('[registry] Failed to load data', e);
    });
    return OG._loaded;
  };

  /* ---- Tool Templates ---- */

  /** Full tool card (for tools/index.html) */
  function toolCardFull(t, idx) {
    return '<a href="' + t.url + '" class="tool-card--full fade-in stagger-' + (idx + 1) + '">' +
      '<span class="tool-emoji">' + t.emoji + '</span>' +
      '<h3>' + t.title + '</h3>' +
      '<span class="age-badge">' + t.ageRange + '</span>' +
      '<p>' + t.fullDescription + '</p>' +
      '<span class="tool-cta">' + t.cta + '</span>' +
    '</a>';
  }

  /** Compact tool card (for homepage preview) */
  function toolCardCompact(t, idx) {
    return '<a href="' + t.url + '" class="tool-card--compact fade-in stagger-' + (idx + 1) + '" data-category="' + t.category + '">' +
      '<span class="tool-icon">' + t.emoji + '</span>' +
      '<div class="tool-text">' +
        '<strong>' + t.title + '</strong>' +
        '<small>' + t.description + '</small>' +
      '</div>' +
    '</a>';
  }

  /* ---- Blog Templates ---- */

  /** Blog preview card (for homepage) */
  function blogPreviewCard(p, idx) {
    return '<a href="' + p.url + '" class="blog-preview-card fade-in stagger-' + (idx + 1) + '">' +
      '<span class="blog-preview-date">' + p.displayDate + '</span>' +
      '<h4>' + p.title + '</h4>' +
      '<p>' + p.excerpt + '</p>' +
    '</a>';
  }

  /** Full blog card (for blog/index.html) */
  function blogCardFull(p, idx) {
    return '<a href="' + p.url + '" class="blog-card fade-in stagger-' + (idx + 1) + '">' +
      '<div class="blog-card-emoji">' + p.emoji + '</div>' +
      '<div class="blog-card-body">' +
        '<span class="blog-card-cat ' + p.categoryClass + '">' + p.category + '</span>' +
        '<h3>' + p.title + '</h3>' +
        '<p>' + p.excerpt + '</p>' +
        '<div class="blog-meta">' +
          '<span>🦦 Otterly Games</span><span>&middot;</span>' +
          '<span>' + p.displayDate + '</span><span>&middot;</span>' +
          '<span>' + p.readTime + '</span>' +
        '</div>' +
      '</div>' +
    '</a>';
  }

  /* ---- Render Functions ---- */

  /**
   * Render FULL categorised tools grid (for tools/index.html).
   * @param {string} containerSelector - CSS selector for the container
   */
  OG.renderToolsGrid = function (containerSelector) {
    return OG.loadRegistry().then(function () {
      var container = document.querySelector(containerSelector);
      if (!container || !OG._tools) return;

      // Group by category
      var groups = {};
      OG._tools.forEach(function (t) {
        if (!groups[t.category]) groups[t.category] = [];
        groups[t.category].push(t);
      });

      // Sort categories by their defined order
      var sortedCats = Object.keys(OG._categories).sort(function (a, b) {
        return OG._categories[a].order - OG._categories[b].order;
      });

      var html = '';
      sortedCats.forEach(function (cat) {
        var tools = groups[cat];
        if (!tools || tools.length === 0) return;
        tools.sort(function (a, b) { return a.order - b.order; });

        html += '<div class="tools-category fade-in">' +
          '<div class="tools-category-header"><h2>' + OG._categories[cat].label + '</h2></div>' +
          '<div class="tools-grid--full">' +
            tools.map(function (t, i) { return toolCardFull(t, i); }).join('') +
          '</div>' +
        '</div>';
      });

      container.innerHTML = html;

      // Update the tool count in about section
      var countEls = document.querySelectorAll('[data-tool-count]');
      countEls.forEach(function (el) {
        el.textContent = OG._tools.length;
      });

      // Update schema numberOfItems
      updateToolsSchema();

      // Re-observe new fade-in elements
      reobserveFadeIns(container);
    });
  };

  /**
   * Render compact tools preview (for homepage).
   * Shows featured tools only.
   * @param {string} containerSelector - CSS selector
   * @param {number} [maxItems=12] - max tools to show
   */
  OG.renderToolsPreview = function (containerSelector, maxItems) {
    maxItems = maxItems || 12;
    return OG.loadRegistry().then(function () {
      var container = document.querySelector(containerSelector);
      if (!container || !OG._tools) return;

      var featured = OG._tools
        .filter(function (t) { return t.featured; })
        .sort(function (a, b) {
          // Sort by category order first, then tool order
          var catA = OG._categories[a.category] ? OG._categories[a.category].order : 99;
          var catB = OG._categories[b.category] ? OG._categories[b.category].order : 99;
          if (catA !== catB) return catA - catB;
          return a.order - b.order;
        })
        .slice(0, maxItems);

      container.innerHTML = featured.map(function (t, i) {
        return toolCardCompact(t, i);
      }).join('');

      reobserveFadeIns(container);
    });
  };

  /**
   * Render blog preview (for homepage).
   * Shows most recent featured posts.
   * @param {string} containerSelector - CSS selector
   * @param {number} [maxItems=3] - max posts to show
   */
  OG.renderBlogPreview = function (containerSelector, maxItems) {
    maxItems = maxItems || 3;
    return OG.loadRegistry().then(function () {
      var container = document.querySelector(containerSelector);
      if (!container || !OG._blogs) return;

      var posts = OG._blogs
        .slice() // clone
        .sort(function (a, b) { return new Date(b.date) - new Date(a.date); })
        .slice(0, maxItems);

      container.innerHTML = posts.map(function (p, i) {
        return blogPreviewCard(p, i);
      }).join('');

      reobserveFadeIns(container);
    });
  };

  /**
   * Render full blog listing (for blog/index.html).
   * @param {string} containerSelector - CSS selector
   */
  OG.renderBlogGrid = function (containerSelector) {
    return OG.loadRegistry().then(function () {
      var container = document.querySelector(containerSelector);
      if (!container || !OG._blogs) return;

      var posts = OG._blogs
        .slice()
        .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

      container.innerHTML = posts.map(function (p, i) {
        return blogCardFull(p, i);
      }).join('');

      reobserveFadeIns(container);
    });
  };

  /* ---- Schema Helpers ---- */

  function updateToolsSchema() {
    if (!OG._tools) return;
    // Find existing ItemList schema script and update it
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(function (s) {
      try {
        var data = JSON.parse(s.textContent);
        if (data['@type'] === 'ItemList') {
          data.numberOfItems = OG._tools.length;
          data.itemListElement = OG._tools.map(function (t, i) {
            return {
              '@type': 'ListItem',
              position: i + 1,
              name: t.title,
              url: 'https://otterlygames.com' + t.url
            };
          });
          s.textContent = JSON.stringify(data);
        }
      } catch (e) { /* not JSON-LD */ }
    });
  }

  /* ---- Utilities ---- */

  function reobserveFadeIns(container) {
    if (!('IntersectionObserver' in window)) {
      container.querySelectorAll('.fade-in').forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    container.querySelectorAll('.fade-in').forEach(function (el) {
      obs.observe(el);
    });
  }

  window.OG = OG;
})();
