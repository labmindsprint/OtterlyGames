/* For parents page: per-section "Expand all / Collapse all" buttons, opening a
   closed accordion when a link targets inside it, and opening every accordion
   while printing. The page is fully readable without this script. */
(function () {
  'use strict';

  function items(group) { return Array.prototype.slice.call(group.querySelectorAll('details')); }

  function setupToggle(button) {
    var group = document.getElementById(button.getAttribute('aria-controls'));
    if (!group) return;
    var list = items(group);
    function sync() {
      button.textContent = list.every(function (d) { return d.open; }) ? 'Collapse all' : 'Expand all';
    }
    button.hidden = false;
    sync();
    button.addEventListener('click', function () {
      var open = !list.every(function (d) { return d.open; });
      list.forEach(function (d) { d.open = open; });
      sync();
    });
    list.forEach(function (d) { d.addEventListener('toggle', sync); });
  }

  function openHashTarget() {
    if (!location.hash) return;
    var target;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { return; }
    var details = target && target.closest('details');
    if (details) details.open = true;
  }

  var reopen = [];
  window.addEventListener('beforeprint', function () {
    reopen = items(document).filter(function (d) { return !d.open; });
    reopen.forEach(function (d) { d.open = true; });
  });
  window.addEventListener('afterprint', function () {
    reopen.forEach(function (d) { d.open = false; });
    reopen = [];
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-par-toggle]'), setupToggle);
  window.addEventListener('hashchange', openHashTarget);
  openHashTarget();

  function setupTocHighlight() {
    if (!('IntersectionObserver' in window)) return;
    var links = Array.prototype.slice.call(document.querySelectorAll('.par-toc a[href^="#"]'));
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var sections = Object.keys(byId).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!sections.length) return;
    var visible = {};
    function mark() {
      var current = sections.filter(function (s) { return visible[s.id]; })[0];
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (current) byId[current.id].setAttribute('aria-current', 'true');
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      mark();
    }, { rootMargin: '-20% 0px -60% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }
  setupTocHighlight();
})();
