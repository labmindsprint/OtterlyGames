/* ============================================================================
   Otterly Games — Shared Component Includes
   Loads nav and footer from /_includes/ and injects them into the page.
   Also handles nav toggle & active link highlighting.
   Usage: <script src="/js/includes.js" defer></script>
   ============================================================================ */
(function () {
  'use strict';

  /**
   * Fetch an HTML fragment and inject it into the page.
   * @param {string} url   – path to the HTML fragment
   * @param {string} where – 'body-start' | 'body-end' | CSS selector
   */
  async function loadComponent(url, where) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Component request failed (' + resp.status + ')');
      const html = await resp.text();

      if (where === 'body-start') {
        document.body.insertAdjacentHTML('afterbegin', html);
      } else if (where === 'body-end') {
        document.body.insertAdjacentHTML('beforeend', html);
      } else {
        const target = document.querySelector(where);
        if (target) target.innerHTML = html;
      }
    } catch (e) {
      console.warn('[includes] Failed to load', url, e);
    }
  }

  /**
   * Mark the current nav link as active.
   */
  function highlightActiveLink() {
    const path = location.pathname.replace(/index\.html$/, '');
    const section = document.body.dataset.navSection || (path === '/about.html' ? '/parents/' :
      path.startsWith('/apps/') ? '/play/' : path);
    const navLinks = document.querySelectorAll('.nav-links a, .nav-play');
    const hasExact = Array.from(navLinks).some(function (a) {
      return a.getAttribute('href') === path;
    });
    navLinks.forEach(function (a) {
      const href = a.getAttribute('href');
      if (!href) return;
      // Remove any existing active class
      a.classList.remove('active');
      a.removeAttribute('aria-current');
      // Exact match or prefix match (but not '/')
      if (href === path || (!hasExact && href.endsWith('/') && href !== '/' && section.startsWith(href))) {
        a.classList.add('active');
        a.setAttribute('aria-current', href === path ? 'page' : 'location');
      }
    });
  }

  /**
   * Wire up the mobile nav toggle.
   */
  function initNavToggle() {
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (!toggle || !links || toggle.dataset.navigationReady) return;
    toggle.dataset.navigationReady = 'true';
    document.documentElement.setAttribute('data-nav-ready', '');
    function setOpen(open) {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    setOpen(false);
    // Older pages have an inline toggle listener. Only this shared handler owns it.
    toggle.addEventListener('click', function (event) {
      event.stopImmediatePropagation();
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    }, true);
    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.nav')) setOpen(false);
    });
    matchMedia('(min-width: 961px)').addEventListener('change', function () { setOpen(false); });
  }

  /**
   * Initialise fade-in intersection observer.
   */
  function initFadeObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show everything
      document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(function (el) {
      obs.observe(el);
    });
  }

  /**
   * Scroll-to-top button.
   */
  function initScrollTop() {
    var btn = document.getElementById('scrollTop');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('show', window.scrollY > 500);
    });
    if (!btn.hasAttribute('onclick')) {
      btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      });
    }
  }

  /* ---- Boot ---- */

  // Check if nav/footer should be loaded from includes.
  // Pages opt-in by adding data-og-includes to <body> or <html>.
  // e.g. <body data-og-includes="nav,footer">
  var includesAttr = document.body.getAttribute('data-og-includes') ||
                     document.documentElement.getAttribute('data-og-includes');

  if (includesAttr) {
    var parts = includesAttr.split(',').map(function (s) { return s.trim(); });
    var promises = [];

    if (parts.indexOf('nav') !== -1) {
      promises.push(loadComponent('/_includes/nav.html', 'body-start'));
    }
    if (parts.indexOf('footer') !== -1) {
      promises.push(loadComponent('/_includes/footer.html', 'body-end'));
    }

    Promise.all(promises).then(function () {
      highlightActiveLink();
      initNavToggle();
      initFadeObserver();
      initScrollTop();
    });
  } else {
    // Nav/footer already inline — just wire up behaviour
    function enhance() {
      highlightActiveLink();
      initNavToggle();
      initFadeObserver();
      initScrollTop();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance);
    else enhance();
  }
})();
