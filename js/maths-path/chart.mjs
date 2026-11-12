import { esc, liveRegion, button, clamp } from './core.mjs';

export const type = 'chart';

// Bar chart or picture graph the child can build.
// config: { kind?: 'bar' | 'picture', title, unit?: 'children', max, categories: [{ id, label, value, color? }], editable?, caption? }
// target: { values: { <id>: n } }  every listed category must have that value
export const sample = {
  config: { kind: 'bar', title: 'Pets in our class', max: 6, unit: 'children', editable: true, categories: [{ id: 'cat', label: 'Cat', value: 2 }, { id: 'dog', label: 'Dog', value: 0 }, { id: 'fish', label: 'Fish', value: 1 }] },
  target: { values: { cat: 2, dog: 4, fish: 1 } },
};

const colors = ['#f59e0b', '#38bdf8', '#a78bfa', '#34d399', '#fb7185', '#f97316'];
const summary = (config, values) => `${config.title}: ${config.categories.map((c) => `${c.label} ${values[c.id]}`).join(', ')}.`;

function chartHtml(config, values, interactive) {
  const max = config.max ?? Math.max(...config.categories.map((c) => c.value), 1);
  const picture = config.kind === 'picture';
  const cols = config.categories.map((c, i) => {
    const v = values[c.id];
    const fill = picture
      ? `<span class="mp-pic-stack">${'<i></i>'.repeat(v)}</span>`
      : `<span class="mp-bar-fill" style="height:${(v / max) * 100}%"></span>`;
    const ctrl = interactive
      ? `<span class="mp-chart-ctrl"><button type="button" class="mp-btn" data-id="${esc(c.id)}" data-d="-1" aria-label="One less ${esc(c.label)}">−</button><button type="button" class="mp-btn" data-id="${esc(c.id)}" data-d="1" aria-label="One more ${esc(c.label)}">+</button></span>`
      : '';
    return `<div class="mp-chart-col" style="--c:${esc(c.color ?? colors[i % colors.length])}"><span class="mp-chart-val">${v}</span><div class="mp-chart-plot${picture ? ' is-picture' : ''}">${fill}</div><span class="mp-chart-label">${esc(c.label)}</span>${ctrl}</div>`;
  }).join('');
  return `<div class="mp-chart" style="--max:${max}"><p class="mp-chart-title">${esc(config.title)}${config.unit ? ` <small>(${esc(config.unit)})</small>` : ''}</p><div class="mp-chart-cols">${cols}</div></div>`;
}

export function render(config) {
  const values = Object.fromEntries(config.categories.map((c) => [c.id, c.value]));
  return `<figure class="mp-w mp-chartwrap" role="img" aria-label="${esc(summary(config, values))}">${chartHtml(config, values, false)}${config.caption ? `<figcaption>${esc(config.caption)}</figcaption>` : ''}</figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const start = Object.fromEntries(config.categories.map((c) => [c.id, c.value]));
  const max = config.max ?? 10;
  let values = { ...start };
  root.classList.add('mp-w', 'mp-chartwrap');
  root.innerHTML = '<div data-chart></div><p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>';
  const say = liveRegion(root);
  const draw = (focus) => {
    root.querySelector('[data-chart]').innerHTML = chartHtml(config, values, config.editable !== false);
    root.querySelector('[data-readout]').textContent = summary(config, values);
    if (focus) root.querySelector(`[data-id="${focus.id}"][data-d="${focus.d}"]`)?.focus();
  };
  root.addEventListener('click', (event) => {
    const b = event.target.closest('[data-id][data-d]');
    if (!b) return;
    const d = Number(b.dataset.d);
    values[b.dataset.id] = clamp(values[b.dataset.id] + d, 0, max);
    draw({ id: b.dataset.id, d });
    say(summary(config, values));
    hooks.onChange?.(api.getState());
  });
  root.querySelector('[data-controls]').append(button(doc, { text: 'Start again', className: 'mp-btn mp-btn--ghost', onClick: () => api.reset() }));
  draw();
  const api = {
    getState: () => ({ values: { ...values }, total: Object.values(values).reduce((a, b) => a + b, 0) }),
    matches: (target) => {
      const ok = Object.entries(target.values).every(([id, v]) => values[id] === v);
      return { ok, message: ok ? 'Yes! Your chart matches the data.' : `Not yet. ${summary(config, values)} Check each count against the data.` };
    },
    reset: () => { values = { ...start }; draw(); say(summary(config, values)); hooks.onChange?.(api.getState()); },
  };
  return api;
}
