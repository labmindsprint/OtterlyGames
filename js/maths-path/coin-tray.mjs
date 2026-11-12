import { esc, liveRegion, button, plural } from './core.mjs';

export const type = 'coinTray';

const ART = '/images/maths-path/';
const item = (kind, value) => ({
  kind, value,
  src: `${ART}${kind === 'note' ? 'note' : 'coin'}-${value}.webp`,
  name: `Rs ${value} ${kind}`,
});
const size = (m) => (m.kind === 'note' ? 'width="96" height="60"' : 'width="64" height="64"');

export function render(config) {
  const shown = (config.show ?? []).map(([kind, value]) => item(kind, value));
  const imgs = shown.map((m) => `<img class="mp-money mp-money--${m.kind}" src="${m.src}" alt="${esc(m.name)}" ${size(m)} loading="lazy">`).join('');
  const total = shown.reduce((sum, m) => sum + m.value, 0);
  return `<figure class="mp-w mp-coins"><div class="mp-money-row">${imgs}</div>` +
    `<figcaption>${config.caption ? esc(config.caption) : `Total: Rs ${total}`}</figcaption></figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const kinds = [...(config.coins ?? [1, 2, 5, 10]).map((v) => item('coin', v)), ...(config.notes ?? []).map((v) => item('note', v))];
  let purse = [];
  root.classList.add('mp-w', 'mp-coins');
  root.innerHTML = '<p class="mp-tray-title">Tap to add to your purse</p><div class="mp-tray" data-tray></div><p class="mp-tray-title">Your purse <span data-count></span></p><div class="mp-purse" data-purse></div><p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>';
  const say = liveRegion(root);
  const tray = root.querySelector('[data-tray]');
  const purseEl = root.querySelector('[data-purse]');
  for (const k of kinds) {
    tray.append(button(doc, {
      className: 'mp-money-btn',
      label: `Add ${k.name} to the purse`,
      text: `<img class="mp-money mp-money--${k.kind}" src="${k.src}" alt="" ${size(k)}>`,
      onClick: () => { purse.push(k); update(`Added ${k.name}.`); },
    }));
  }
  const total = () => purse.reduce((sum, m) => sum + m.value, 0);
  function update(extra) {
    purseEl.innerHTML = '';
    purse.forEach((m, index) => {
      purseEl.append(button(doc, {
        className: 'mp-money-btn mp-money-btn--placed', label: `Take ${m.name} out of the purse`,
        text: `<img class="mp-money mp-money--${m.kind}" src="${m.src}" alt="" ${size(m)}>`,
        onClick: () => { purse.splice(index, 1); update(`Took out ${m.name}.`); },
      }));
    });
    const text = purse.length ? `${plural(purse.length, 'coin or note', 'coins and notes')}. Total: Rs ${total()}.` : 'The purse is empty. Total: Rs 0.';
    root.querySelector('[data-readout]').textContent = text;
    root.querySelector('[data-count]').textContent = purse.length ? `(${purse.length})` : '';
    say(`${extra ? `${extra} ` : ''}${text}`);
    hooks.onChange?.(api.getState());
  }
  root.querySelector('[data-controls]').append(button(doc, { text: 'Empty the purse', className: 'mp-btn mp-btn--ghost', onClick: () => { purse = []; update('Purse emptied.'); } }));
  update();
  const api = {
    getState: () => ({ total: total(), count: purse.length }),
    matches: (target) => {
      const okTotal = total() === target.total;
      const okCount = target.count === undefined || purse.length === target.count;
      const ok = okTotal && okCount;
      return {
        ok,
        message: ok ? `Yes! ${plural(purse.length, 'coin or note', 'coins and notes')} make Rs ${total()}.`
          : !okTotal ? `Your purse has Rs ${total()}. You need Rs ${target.total}.`
            : `Rs ${total()} is right, but the task asks for exactly ${target.count} ${target.count === 1 ? 'coin or note' : 'coins or notes'}. Try different ones.`,
      };
    },
    reset: () => { purse = []; update(); },
  };
  return api;
}
