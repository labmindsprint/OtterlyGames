import { esc, liveRegion, button } from './core.mjs';

export const type = 'grid';

// Square-grid workbench for shapes, symmetry, area and perimeter, grid reading and shading.
// config: { rows, cols, filled?: [[r,c]...], editable?, mirror?: 'vertical' | 'horizontal', showMeasures?, labels?: bool, caption? }
// target: { cells: [[r,c]...] } exact shaded cells | { count } | { area, perimeter } | { symmetric: true }
// With `mirror`, shading one square also shades its mirror twin (a symmetry painter).
export const sample = {
  config: { rows: 4, cols: 4, filled: [[0, 0], [1, 0]], editable: true, mirror: 'vertical', showMeasures: true },
  target: { symmetric: true },
};

const key = (r, c) => `${r},${c}`;
const measures = (set) => {
  let perimeter = 0;
  for (const k of set) {
    const [r, c] = k.split(',').map(Number);
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!set.has(key(r + dr, c + dc))) perimeter += 1;
  }
  return { area: set.size, perimeter };
};
const colLabel = (c) => String.fromCharCode(65 + c);
const words = (set, config) => {
  const m = measures(set);
  return config.showMeasures ? `${m.area} squares shaded. Area ${m.area} square units. Perimeter ${m.perimeter} units.` : `${m.area} squares shaded.`;
};

function cells(config, set, interactive) {
  const out = [];
  for (let r = 0; r < config.rows; r += 1) for (let c = 0; c < config.cols; c += 1) {
    const on = set.has(key(r, c));
    const name = `Row ${r + 1}, column ${config.labels ? colLabel(c) : c + 1}`;
    out.push(interactive
      ? `<button type="button" class="mp-gcell${on ? ' is-on' : ''}" data-r="${r}" data-c="${c}" aria-pressed="${on}" aria-label="${name}"></button>`
      : `<span class="mp-gcell${on ? ' is-on' : ''}" aria-hidden="true"></span>`);
  }
  return out.join('');
}
const frame = (config, inner) => `<div class="mp-grid${config.mirror ? ` mp-grid--${config.mirror}` : ''}" style="--cols:${config.cols};--rows:${config.rows}">${inner}</div>`;

export function render(config) {
  const set = new Set((config.filled ?? []).map(([r, c]) => key(r, c)));
  return `<figure class="mp-w mp-gridwrap" role="img" aria-label="${esc(`A grid of ${config.rows} rows and ${config.cols} columns. ${words(set, config)}`)}">${frame(config, cells(config, set, false))}${config.caption ? `<figcaption>${esc(config.caption)}</figcaption>` : ''}</figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const start = (config.filled ?? []).map(([r, c]) => key(r, c));
  let set = new Set(start);
  root.classList.add('mp-w', 'mp-gridwrap');
  root.innerHTML = '<div data-board></div><p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>';
  const say = liveRegion(root);
  const board = root.querySelector('[data-board]');
  const draw = (focus) => {
    board.innerHTML = frame(config, cells(config, set, true));
    root.querySelector('[data-readout]').textContent = words(set, config);
    if (focus) board.querySelector(`[data-r="${focus[0]}"][data-c="${focus[1]}"]`)?.focus();
  };
  const twin = (r, c) => (config.mirror === 'vertical' ? [r, config.cols - 1 - c] : config.mirror === 'horizontal' ? [config.rows - 1 - r, c] : null);
  board.addEventListener('click', (event) => {
    const cell = event.target.closest('.mp-gcell[data-r]');
    if (!cell) return;
    const r = Number(cell.dataset.r); const c = Number(cell.dataset.c);
    const turnOn = !set.has(key(r, c));
    for (const [rr, cc] of [[r, c], twin(r, c)].filter(Boolean)) { if (turnOn) set.add(key(rr, cc)); else set.delete(key(rr, cc)); }
    draw([r, c]);
    say(words(set, config));
    hooks.onChange?.(api.getState());
  });
  root.querySelector('[data-controls]').append(button(doc, { text: 'Clear', className: 'mp-btn mp-btn--ghost', onClick: () => api.reset() }));
  draw();
  const symmetric = () => [...set].every((k) => { const [r, c] = k.split(',').map(Number); const t = config.mirror === 'horizontal' ? [config.rows - 1 - r, c] : [r, config.cols - 1 - c]; return set.has(key(...t)); });
  const api = {
    getState: () => ({ cells: [...set].map((k) => k.split(',').map(Number)), ...measures(set) }),
    matches: (target) => {
      const m = measures(set);
      let ok = true;
      if (target.cells) ok = ok && target.cells.length === set.size && target.cells.every(([r, c]) => set.has(key(r, c)));
      if (target.count !== undefined) ok = ok && set.size === target.count;
      if (target.area !== undefined) ok = ok && m.area === target.area;
      if (target.perimeter !== undefined) ok = ok && m.perimeter === target.perimeter;
      if (target.symmetric) ok = ok && set.size > 0 && symmetric();
      return { ok, message: ok ? `Yes! ${words(set, config)}` : `Not yet. ${words(set, config)} Look at the picture again.` };
    },
    reset: () => { set = new Set(start); draw(); say(words(set, config)); hooks.onChange?.(api.getState()); },
  };
  return api;
}
