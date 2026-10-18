/* Tools hub: renders _data/tools.json into skill groups inside #tools-container.
   The build writes a <noscript> fallback with every tool link, so the hub still
   lists everything without JavaScript. Unknown tool ids fall into "More tools". */
(function () {
  'use strict';

  var ICONS = {
    'hour-hand': 'i-hour', 'minute-hand': 'i-minute', 'am-pm': 'i-sun-moon', 'clock-lessons': 'i-clock',
    'multiplication-practice': 'i-times', 'division-practice': 'i-divide', 'multiplication-table': 'i-grid',
    'column-multiplication': 'i-stack', 'long-division': 'i-bracket', 'math-quiz': 'i-bolt',
    'calculator': 'i-calc', 'worksheet-builder': 'i-printer', 'spelling-bee': 'i-spell'
  };

  var BEST_FOR = {
    'hour-hand': 'reading o\u2019clock times',
    'minute-hand': 'counting minutes past the hour',
    'am-pm': 'morning and afternoon words',
    'clock-lessons': 'reading a full analogue clock',
    'multiplication-practice': 'untimed times-table recall',
    'division-practice': 'exact division facts',
    'multiplication-table': 'looking up facts and spotting patterns',
    'column-multiplication': 'the written multiplication method',
    'long-division': 'bracket division with remainders',
    'math-quiz': 'a short, optional timed warm-up',
    'calculator': 'checking homework answers',
    'worksheet-builder': 'paper practice away from the screen',
    'spelling-bee': 'hearing a word and typing it'
  };

  var GROUPS = [
    { id: 'time', title: 'Telling the time', accent: 'blue', icon: 'i-clock', cols: 4,
      intro: 'Start with the hour hand, then minutes, AM and PM, and finally whole-clock reading.',
      ids: ['hour-hand', 'minute-hand', 'am-pm', 'clock-lessons'] },
    { id: 'times-tables', title: 'Times tables & division', accent: 'purple', icon: 'i-times', cols: 4,
      intro: 'Look up the facts, practise them without a timer, then try the written methods.',
      ids: ['multiplication-practice', 'division-practice', 'multiplication-table', 'column-multiplication', 'long-division', 'math-quiz', 'calculator'],
      featured: 'multiplication-practice' },
    { id: 'spelling', title: 'Spelling', accent: 'amber', icon: 'i-spell', duo: true,
      intro: 'Hear a word, read the hint and type it.',
      ids: ['spelling-bee'] },
    { id: 'printables', title: 'Printables', accent: 'green', icon: 'i-printer', duo: true,
      intro: 'Make a clean sheet for pencil-and-paper practice.',
      ids: ['worksheet-builder'] }
  ];

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function icon(id, className) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'icon' + (className ? ' ' + className : ''));
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '/images/icons.svg#' + id);
    svg.appendChild(use);
    return svg;
  }

  function card(tool, featured) {
    var link = el('a', 'tools-card' + (featured ? ' tools-card--feature' : ''));
    link.href = tool.url;

    var top = el('div', 'tools-card-top');
    var ico = el('span', 'tools-ico');
    ico.appendChild(icon(ICONS[tool.id] || 'i-compass'));
    top.appendChild(ico);
    if (tool.ageRange) top.appendChild(el('span', 'chip', tool.ageRange));
    link.appendChild(top);

    link.appendChild(el('h3', '', tool.title));
    link.appendChild(el('p', 'tools-desc', tool.fullDescription || tool.description || ''));

    if (BEST_FOR[tool.id]) {
      var best = el('p', 'tools-best');
      best.appendChild(el('strong', '', 'Best for: '));
      best.appendChild(document.createTextNode(BEST_FOR[tool.id]));
      link.appendChild(best);
    }

    var cta = el('span', 'tools-cta', String(tool.cta || 'Open').replace(/\s*\u2192\s*$/, ''));
    cta.appendChild(icon('i-arrow-right'));
    link.appendChild(cta);
    return link;
  }

  function group(spec, byId) {
    var tools = spec.ids.map(function (id) { return byId[id]; }).filter(Boolean);
    if (!tools.length) return null;

    var section = el('section', 'tools-group tools-accent-' + spec.accent);
    section.id = spec.id;
    section.setAttribute('aria-labelledby', spec.id + '-title');

    var head = el('div', 'tools-group-head');
    var ico = el('span', 'tools-group-ico');
    ico.appendChild(icon(spec.icon));
    head.appendChild(ico);
    var copy = el('div');
    var h2 = el('h2', '', spec.title);
    h2.id = spec.id + '-title';
    copy.appendChild(h2);
    copy.appendChild(el('p', '', spec.intro));
    head.appendChild(copy);
    section.appendChild(head);

    var grid = el('div', 'tools-cards');
    tools.forEach(function (tool) { grid.appendChild(card(tool, spec.featured === tool.id)); });
    section.appendChild(grid);
    return section;
  }

  function render(container, tools) {
    var byId = {};
    tools.forEach(function (tool) { byId[tool.id] = tool; });
    var placed = {};
    var frag = document.createDocumentFragment();
    var duo = null;

    GROUPS.forEach(function (spec) {
      var section = group(spec, byId);
      spec.ids.forEach(function (id) { placed[id] = true; });
      if (!section) return;
      if (spec.duo) {
        if (!duo) { duo = el('div', 'tools-duo'); frag.appendChild(duo); }
        duo.appendChild(section);
      } else {
        frag.appendChild(section);
      }
    });

    var extra = tools.filter(function (tool) { return !placed[tool.id]; });
    if (extra.length) {
      var more = group({ id: 'more', title: 'More tools', accent: 'pink', icon: 'i-compass', intro: 'More small activities to try together.',
        ids: extra.map(function (tool) { return tool.id; }) }, byId);
      if (more) frag.appendChild(more);
    }

    container.textContent = '';
    container.appendChild(frag);
    container.removeAttribute('aria-busy');
  }

  function init() {
    var container = document.getElementById('tools-container');
    if (!container) return;
    container.setAttribute('aria-busy', 'true');
    fetch('/_data/tools.json')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var tools = (data.tools || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        render(container, tools);
      })
      .catch(function () {
        container.removeAttribute('aria-busy');
        var message = el('p', 'tools-error', 'The tool list could not load. Please refresh the page and try again.');
        container.textContent = '';
        container.appendChild(message);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
