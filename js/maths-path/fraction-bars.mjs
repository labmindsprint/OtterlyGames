import { esc, liveRegion, button } from './core.mjs';

export const type = 'fractionBars';

// config: { bars: [{ label, parts, shaded?, editable? }], caption? }
// target (for matches): { shaded: n }  first editable bar must have n shaded parts
//                       { shaded: [a, b] } per editable bar, in order
//                       { sameAs: true }  the first two bars must show equal fractions
export const sample = {
  config: { bars: [{ label: 'Half', parts: 2, shaded: 1 }, { label: 'Your bar', parts: 4, shaded: 0, editable: true }], caption: 'Shade the same amount as the half.' },
  target: { sameAs: true },
};

const segments = (bar, shaded, interactive) => Array.from({ length: bar.parts }, (_, i) => (interactive
  ? `<button type="button" class="mp-fseg${i < shaded ? ' is-on' : ''}" data-i="${i}" aria-pressed="${i < shaded}" aria-label="Part ${i + 1} of ${bar.parts}"></button>`
  : `<span class="mp-fseg${i < shaded ? ' is-on' : ''}" aria-hidden="true"></span>`)).join('');

const row = (bar, shaded, interactive) => `<div class="mp-frow" role="${interactive ? 'group' : 'img'}" aria-label="${esc(`${bar.label}: ${shaded} of ${bar.parts} equal parts shaded`)}">` +
  `<span class="mp-flabel">${esc(bar.label)} <b>${shaded}/${bar.parts}</b></span><div class="mp-fbar" style="--parts:${bar.parts}">${segments(bar, shaded, interactive)}</div></div>`;

export function render(config) {
  return `<figure class="mp-w mp-fractions">${config.bars.map((b) => row(b, b.shaded ?? 0, false)).join('')}${config.caption ? `<figcaption>${esc(config.caption)}</figcaption>` : ''}</figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const shaded = config.bars.map((b) => b.shaded ?? 0);
  root.classList.add('mp-w', 'mp-fractions');
  root.innerHTML = '<div data-rows></div><p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>';
  const say = liveRegion(root);
  const rows = root.querySelector('[data-rows]');
  const readout = root.querySelector('[data-readout]');
  const editable = config.bars.map((b, i) => (b.editable ? i : -1)).filter((i) => i >= 0);
  const message = () => editable.map((i) => `${config.bars[i].label}: ${shaded[i]} of ${config.bars[i].parts} parts shaded.`).join(' ');
  function draw(focusAt) {
    rows.innerHTML = config.bars.map((b, i) => row(b, shaded[i], Boolean(b.editable))).join('');
    readout.textContent = message();
    if (focusAt !== undefined) rows.querySelectorAll('.mp-fbar')[focusAt.bar]?.querySelector(`[data-i="${focusAt.i}"]`)?.focus();
  }
  rows.addEventListener('click', (event) => {
    const seg = event.target.closest('.mp-fseg[data-i]');
    if (!seg) return;
    const bar = [...rows.querySelectorAll('.mp-fbar')].indexOf(seg.closest('.mp-fbar'));
    const i = Number(seg.dataset.i);
    shaded[bar] = shaded[bar] === i + 1 ? i : i + 1;
    draw({ bar, i });
    say(message());
    hooks.onChange?.(api.getState());
  });
  root.querySelector('[data-controls]').append(button(doc, { text: 'Clear', className: 'mp-btn mp-btn--ghost', onClick: () => api.reset() }));
  draw();
  const api = {
    getState: () => ({ shaded: [...shaded] }),
    matches: (target) => {
      let ok;
      if (target.sameAs) ok = shaded[0] * config.bars[1].parts === shaded[1] * config.bars[0].parts && shaded[0] > 0;
      else {
        const want = [].concat(target.shaded);
        ok = editable.every((bar, n) => shaded[bar] === want[n]);
      }
      return { ok, message: ok ? 'Yes! The shaded parts are right.' : 'Not yet. Count the equal parts, then shade the ones you need.' };
    },
    reset: () => { config.bars.forEach((b, i) => { shaded[i] = b.shaded ?? 0; }); draw(); say(message()); hooks.onChange?.(api.getState()); },
  };
  return api;
}
