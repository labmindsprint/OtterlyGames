import { esc, liveRegion, rovingFocus, button, plural, clamp } from './core.mjs';

export const type = 'tenFrame';
const SIZE = 10;

function describe({ count, second = 0, frames = 1 }) {
  const total = frames * SIZE;
  const empty = total - count - second;
  const parts = [];
  if (count) parts.push(`${plural(count, 'orange counter')}`);
  if (second) parts.push(`${plural(second, 'blue counter')}`);
  if (!parts.length) parts.push('no counters');
  return `${frames === 1 ? 'A ten frame' : 'Two ten frames'} with ${parts.join(' and ')}. ${plural(empty, 'empty box', 'empty boxes')}.`;
}

function frameHtml(index, { count, second = 0 }, interactive) {
  const cells = [];
  for (let i = 0; i < SIZE; i++) {
    const n = index * SIZE + i;
    const kind = n < count ? 'a' : n < count + second ? 'b' : '';
    const dot = kind ? `<span class="mp-counter mp-counter--${kind}"></span>` : '';
    cells.push(interactive
      ? `<button type="button" class="mp-tf-cell" data-n="${n}" aria-label="Box ${n + 1}, ${kind ? 'has a counter' : 'empty'}">${dot}</button>`
      : `<span class="mp-tf-cell" aria-hidden="true">${dot}</span>`);
  }
  return `<div class="mp-tf-frame" ${interactive ? 'role="group" aria-label="Ten frame ' + (index + 1) + '"' : ''}>${cells.join('')}</div>`;
}

export function render(config) {
  const frames = config.frames ?? 1;
  const state = { count: config.count ?? 0, second: config.second ?? 0, frames };
  const caption = config.caption ? `<figcaption>${esc(config.caption)}</figcaption>` : '';
  return `<figure class="mp-w mp-tenframe" role="img" aria-label="${esc(config.alt ?? describe(state))}">` +
    `<div class="mp-tf-frames" aria-hidden="true">${Array.from({ length: frames }, (_, i) => frameHtml(i, state, false)).join('')}</div>${caption}</figure>`;
}

export function mount(root, config, hooks = {}) {
  const frames = config.frames ?? 1;
  const max = frames * SIZE;
  let count = clamp(config.start ?? 0, 0, max);
  const doc = root.ownerDocument;
  root.classList.add('mp-w', 'mp-tenframe');
  root.innerHTML = '<div class="mp-tf-frames"></div><p class="mp-readout" data-readout></p><div class="mp-controls"></div>';
  const board = root.querySelector('.mp-tf-frames');
  const readout = root.querySelector('[data-readout]');
  const controls = root.querySelector('.mp-controls');
  const say = liveRegion(root);

  const message = () => {
    if (count === 0) return 'No counters yet. Tap a box to add one.';
    const toTen = SIZE - (count % SIZE || SIZE);
    const base = plural(count, 'counter');
    return count < SIZE ? `${base}. ${toTen === 0 ? '' : `${plural(SIZE - count, 'more')} makes 10.`}`.trim()
      : count === SIZE ? '10 counters. The frame is full!' : `${base}. That is 10 and ${count - SIZE} more.`;
  };
  const draw = (focusN) => {
    board.innerHTML = Array.from({ length: frames }, (_, i) => frameHtml(i, { count }, true)).join('');
    for (const group of board.querySelectorAll('.mp-tf-frame')) rovingFocus(group, '.mp-tf-cell', 5);
    readout.textContent = message();
    if (focusN !== undefined) board.querySelector(`[data-n="${focusN}"]`)?.focus();
  };
  const set = (next, focusN) => {
    count = clamp(next, 0, max);
    draw(focusN);
    say(message());
    hooks.onChange?.(api.getState());
  };
  board.addEventListener('click', (event) => {
    const cell = event.target.closest('.mp-tf-cell');
    if (!cell) return;
    const n = Number(cell.dataset.n);
    set(n < count ? n : n + 1, n);
  });
  controls.append(
    button(doc, { text: 'Add one', onClick: () => set(count + 1) }),
    button(doc, { text: 'Take one away', onClick: () => set(count - 1) }),
    button(doc, { text: 'Clear', className: 'mp-btn mp-btn--ghost', onClick: () => set(0) }),
  );
  draw();

  const api = {
    getState: () => ({ count }),
    matches: (target) => {
      const ok = count === target.count;
      return { ok, message: ok ? `Yes! ${plural(count, 'counter')}.` : `You have ${plural(count, 'counter')}. Look at the task again.` };
    },
    reset: () => set(config.start ?? 0),
  };
  return api;
}
