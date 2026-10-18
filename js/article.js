/* Article table of contents: progressive enhancement over the static <ol>.
   Without JS the list is fully visible and every link is a plain #anchor.
   Adds a collapse toggle below 1040px and marks the section being read. */
(function () {
  'use strict';
  var toc = document.querySelector('[data-article-toc]');
  if (!toc) return;
  var list = toc.querySelector('.article-toc-list');
  var title = toc.querySelector('.article-toc-title');
  if (!list || !title) return;

  var label = title.textContent.trim();
  var mobile = window.matchMedia('(max-width: 1039px)');
  var button = null;

  function setCollapsed(collapsed) {
    toc.setAttribute('data-collapsed', collapsed ? 'true' : 'false');
    if (button) button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }

  function build() {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'article-toc-toggle';
    button.setAttribute('aria-controls', list.id);
    button.innerHTML = '<span></span><svg class="icon" aria-hidden="true"><use href="/images/icons.svg#i-chevron"/></svg>';
    button.firstChild.textContent = label;
    button.addEventListener('click', function () {
      setCollapsed(toc.getAttribute('data-collapsed') !== 'true');
    });
    title.textContent = '';
    title.appendChild(button);
  }

  function apply() {
    if (mobile.matches) {
      if (!button) build();
      setCollapsed(true);
    } else {
      if (button) {
        title.textContent = label;
        button = null;
      }
      toc.removeAttribute('data-collapsed');
    }
  }

  apply();
  if (mobile.addEventListener) mobile.addEventListener('change', apply);
  else if (mobile.addListener) mobile.addListener(apply);

  if (!('IntersectionObserver' in window)) return;
  var links = {};
  Array.prototype.forEach.call(list.querySelectorAll('a[href^="#"]'), function (a) {
    links[decodeURIComponent(a.getAttribute('href').slice(1))] = a;
  });
  var headings = Array.prototype.filter.call(
    document.querySelectorAll('.article-body h2[id]'),
    function (h) { return links[h.id]; }
  );
  if (!headings.length) return;

  var current = null;
  function mark(id) {
    if (current === id) return;
    if (current && links[current]) links[current].removeAttribute('aria-current');
    current = id;
    if (current && links[current]) links[current].setAttribute('aria-current', 'location');
  }

  var observer = new IntersectionObserver(function (entries) {
    var visible = headings.filter(function (h) {
      var r = h.getBoundingClientRect();
      return r.top < window.innerHeight * 0.4;
    });
    if (visible.length) mark(visible[visible.length - 1].id);
    else if (entries.length) mark(null);
  }, { rootMargin: '0px 0px -60% 0px' });
  headings.forEach(function (h) { observer.observe(h); });
})();
