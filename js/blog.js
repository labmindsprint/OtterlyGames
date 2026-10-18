/* Blog hub topic filters: progressive enhancement over the static card grid.
   Chips are real anchors (/blog/#topic-...) that CSS :target already filters without JS; this script
   upgrades them in place (no scroll jump) and still accepts legacy /blog/?topic=... links. */
(function () {
  'use strict';
  var grid = document.querySelector('[data-blog-grid]');
  var nav = document.querySelector('.blog-filters');
  if (!grid || !nav) return;

  // The plain list of every guide is only for visitors without scripting.
  var plain = document.querySelector('.blog-nojs');
  if (plain) plain.hidden = true;

  var items = Array.prototype.slice.call(grid.querySelectorAll('.blog-item'));
  var chips = Array.prototype.slice.call(nav.querySelectorAll('[data-topic]'));
  var status = document.querySelector('[data-blog-status]');
  var empty = document.querySelector('[data-blog-empty]');
  var known = chips.map(function (c) { return c.getAttribute('data-topic'); });

  function topicFromUrl() {
    var hash = window.location.hash.match(/^#topic-([a-z]+)$/);
    var t = hash ? hash[1] : new URLSearchParams(window.location.search).get('topic');
    return known.indexOf(t) > 0 ? t : 'all';
  }

  function apply(topic, announce) {
    var shown = 0;
    items.forEach(function (item) {
      var match = topic === 'all' || (item.getAttribute('data-topics') || '').split(' ').indexOf(topic) !== -1;
      item.hidden = !match;
      item.classList.remove('blog-item--feature');
      if (match) {
        if (shown === 0) item.classList.add('blog-item--feature');
        shown += 1;
      }
    });
    chips.forEach(function (chip) {
      if (chip.getAttribute('data-topic') === topic) chip.setAttribute('aria-current', 'true');
      else chip.removeAttribute('aria-current');
    });
    if (empty) empty.hidden = shown !== 0;
    if (announce && status) {
      var active = chips.filter(function (c) { return c.getAttribute('data-topic') === topic; })[0];
      var name = active ? active.textContent.replace(/\s*\d+\s*$/, '').trim() : 'All guides';
      status.textContent = 'Showing ' + shown + (shown === 1 ? ' guide' : ' guides') + ': ' + name;
    }
  }

  nav.addEventListener('click', function (event) {
    var chip = event.target.closest('[data-topic]');
    if (!chip || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    var topic = chip.getAttribute('data-topic');
    var url = topic === 'all' ? '/blog/' : '/blog/#topic-' + topic;
    window.history.replaceState(null, '', url);
    apply(topic, true);
  });

  window.addEventListener('popstate', function () { apply(topicFromUrl(), true); });
  window.addEventListener('hashchange', function () { apply(topicFromUrl(), true); });
  // From here on the script owns filtering, so the CSS :target fallback steps aside.
  var live = grid.closest('.blog-live');
  if (live) live.classList.add('is-enhanced');
  apply(topicFromUrl(), false);
})();
