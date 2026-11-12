import { esc, liveRegion, button, clamp } from './core.mjs';

export const type = 'array';

// Rows and columns of dots for equal groups, multiplication and sharing.
// config: { rows, cols, editable?, max?, word? ('rows' | 'groups'), caption? }
// target: { rows, cols } exact, or { total } any array with that many dots
export const sample = { config: { rows: 2, cols: 3, editable: true, max: 8 }, target: { total: 12 } };

const dots = (rows, cols) => `<div class="mp-array" style="--cols:${cols}" aria-hidden="true">${'<i></i>'.repeat(rows * cols)}</div>`;
const sentence = (rows, cols, word) => (word === 'groups'
  ? `${rows} ${rows === 1 ? 'group' : 'groups'} of ${cols} = ${rows * cols} in all. ${rows} × ${cols} = ${rows * cols}.`
  : `${rows} ${rows === 1 ? 'row' : 'rows'} of ${cols} = ${rows * cols} dots. ${rows} × ${cols} = ${rows * cols}.`);

export function render(config) {
  const { rows, cols, word } = config;
  return `<figure class="mp-w mp-arraywrap" role="img" aria-label="${esc(sentence(rows, cols, word))}">${dots(rows, cols)}<figcaption>${esc(config.caption ?? sentence(rows, cols, word))}</figcaption></figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const max = config.max ?? 10;
  let rows = config.rows;
  let cols = config.cols;
  root.classList.add('mp-w', 'mp-arraywrap');
  root.innerHTML = '<div data-grid></div><p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>';
  const say = liveRegion(root);
  const word = config.word ?? 'rows';
  const draw = () => {
    root.querySelector('[data-grid]').innerHTML = dots(rows, cols);
    root.querySelector('[data-readout]').textContent = sentence(rows, cols, word);
  };
  const change = (dr, dc) => {
    const nr = clamp(rows + dr, 1, max); const nc = clamp(cols + dc, 1, max);
    if (nr === rows && nc === cols) return;
    rows = nr; cols = nc; draw(); say(sentence(rows, cols, word)); hooks.onChange?.(api.getState());
  };
  if (config.editable !== false) {
    const noun = word === 'groups' ? 'groups' : 'rows';
    const per = word === 'groups' ? 'in each group' : 'in each row';
    root.querySelector('[data-controls]').append(
      button(doc, { text: `− ${noun}`, label: `One fewer ${noun === 'groups' ? 'group' : 'row'}`, onClick: () => change(-1, 0) }),
      button(doc, { text: `+ ${noun}`, label: `One more ${noun === 'groups' ? 'group' : 'row'}`, onClick: () => change(1, 0) }),
      button(doc, { text: `− ${per}`, label: `One fewer ${per}`, onClick: () => change(0, -1) }),
      button(doc, { text: `+ ${per}`, label: `One more ${per}`, onClick: () => change(0, 1) }),
    );
  }
  draw();
  const api = {
    getState: () => ({ rows, cols, total: rows * cols }),
    matches: (target) => {
      const ok = target.total !== undefined ? rows * cols === target.total : rows === target.rows && cols === target.cols;
      return { ok, message: ok ? `Yes! ${sentence(rows, cols, word)}` : `You have ${rows * cols}. Change the rows or the dots in each row and try again.` };
    },
    reset: () => { rows = config.rows; cols = config.cols; draw(); say(sentence(rows, cols, word)); hooks.onChange?.(api.getState()); },
  };
  return api;
}
