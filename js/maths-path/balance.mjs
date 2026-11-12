import { esc, liveRegion, button, clamp } from './core.mjs';

export const type = 'balance';

function beam(left, right) {
  const tilt = left === right ? 0 : left > right ? -8 : 8;
  const pile = (n, cls) => `<div class="mp-pan-items ${cls}">${Array.from({ length: Math.min(n, 20) }, () => '<i></i>').join('')}</div>`;
  return `<div class="mp-balance-vis" aria-hidden="true"><div class="mp-beam" style="--tilt:${tilt}deg"><div class="mp-pan">${pile(left, 'is-left')}<b>${left}</b></div><div class="mp-pan">${pile(right, 'is-right')}<b>${right}</b></div></div><div class="mp-balance-post"></div></div>`;
}
const verdict = (l, r) => (l === r ? 'Both sides are equal.' : l > r ? 'The left side is heavier.' : 'The right side is heavier.');

export function render(config) {
  const { left, right } = config;
  return `<figure class="mp-w mp-balance" role="img" aria-label="${esc(`A balance. Left side ${left}, right side ${right}. ${verdict(left, right)}`)}">${beam(left, right)}<figcaption>${esc(config.caption ?? verdict(left, right))}</figcaption></figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const max = config.max ?? 12;
  let left = config.left ?? 0;
  const right = config.right ?? 0;
  let mine = config.start ?? 0;
  root.classList.add('mp-w', 'mp-balance');
  root.innerHTML = '<div data-vis></div><p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>';
  const say = liveRegion(root);
  const draw = () => {
    root.querySelector('[data-vis]').innerHTML = beam(left + mine, right);
    const t = `Left ${left + mine}, right ${right}. ${verdict(left + mine, right)}`;
    root.querySelector('[data-readout]').textContent = t;
    say(t);
    hooks.onChange?.(api.getState());
  };
  root.querySelector('[data-controls]').append(
    button(doc, { text: 'Add one to the left', onClick: () => { mine = clamp(mine + 1, 0, max); draw(); } }),
    button(doc, { text: 'Take one off the left', onClick: () => { mine = clamp(mine - 1, 0, max); draw(); } }),
  );
  draw();
  const api = {
    getState: () => ({ added: mine, left: left + mine, right }),
    matches: (target) => {
      const ok = target.added !== undefined ? mine === target.added : left + mine === right;
      return { ok, message: ok ? 'Yes! The balance is level.' : verdict(left + mine, right) + ' Keep changing the left side.' };
    },
    reset: () => { mine = config.start ?? 0; draw(); },
  };
  return api;
}
