import { esc, liveRegion, button } from './core.mjs';

export const type = 'sorter';

// `size` (px) lets an item show bigger or smaller than 56, e.g. to compare a tall and a short tower at true scale.
const itemInner = (it) => (it.img
  ? `<img src="${esc(it.img)}" alt="" width="${it.size ?? 56}" height="${it.size ?? 56}" style="width:${it.size ?? 56}px;height:${it.size ?? 56}px" loading="lazy"><span>${esc(it.label)}</span>`
  : `<span class="mp-emoji" aria-hidden="true">${esc(it.icon ?? '')}</span><span>${esc(it.label)}</span>`);

export function render(config) {
  const items = config.items.map((it) => `<li class="mp-sort-item mp-sort-item--static">${itemInner(it)}</li>`).join('');
  return `<figure class="mp-w mp-sorter"><ul class="mp-sort-items">${items}</ul>` +
    `<figcaption>${esc(config.caption ?? config.bins.map((b) => b.label).join(' or '))}</figcaption></figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const placed = new Map();
  let selected = null;
  root.classList.add('mp-w', 'mp-sorter');
  root.innerHTML = '<p class="mp-tray-title" data-hint>Tap a picture, then tap the box where it belongs.</p><div class="mp-sort-items" data-items></div><div class="mp-bins" data-bins></div><p class="mp-readout" data-readout></p>';
  const say = liveRegion(root);
  const itemsEl = root.querySelector('[data-items]');
  const binsEl = root.querySelector('[data-bins]');
  const byId = new Map(config.items.map((it) => [it.id, it]));

  function draw() {
    itemsEl.innerHTML = '';
    for (const it of config.items) {
      if (placed.has(it.id)) continue;
      const b = button(doc, { className: `mp-sort-item${selected === it.id ? ' is-selected' : ''}`, text: itemInner(it), label: `${it.label}${selected === it.id ? ', picked up' : ''}`, onClick: () => { selected = selected === it.id ? null : it.id; say(selected ? `${it.label} picked up. Now choose a box.` : 'Put down.'); draw(); itemsEl.querySelector('.is-selected')?.focus(); } });
      b.setAttribute('aria-pressed', String(selected === it.id));
      itemsEl.append(b);
    }
    if (!itemsEl.children.length) itemsEl.innerHTML = '<p class="mp-note">All sorted!</p>';
    binsEl.innerHTML = '';
    for (const bin of config.bins) {
      const box = doc.createElement('div');
      box.className = 'mp-bin';
      const head = button(doc, { className: 'mp-bin-head', text: esc(bin.label), label: `Put the picked picture in: ${bin.label}`, onClick: () => {
        if (!selected) { say('First tap a picture.'); return; }
        placed.set(selected, bin.id);
        const it = byId.get(selected);
        selected = null;
        say(`${it.label} is in ${bin.label}.`);
        draw();
        hooks.onChange?.(api.getState());
      } });
      const list = doc.createElement('div');
      list.className = 'mp-bin-items';
      for (const [id, binId] of placed) {
        if (binId !== bin.id) continue;
        const it = byId.get(id);
        list.append(button(doc, { className: 'mp-sort-item mp-sort-item--small', text: itemInner(it), label: `${it.label}. Tap to take it out.`, onClick: () => { placed.delete(id); say(`${it.label} taken out.`); draw(); hooks.onChange?.(api.getState()); } }));
      }
      box.append(head, list);
      binsEl.append(box);
    }
  }
  draw();
  const api = {
    getState: () => ({ placed: Object.fromEntries(placed) }),
    matches: () => {
      const wrong = config.items.filter((it) => placed.has(it.id) && placed.get(it.id) !== it.bin);
      const missing = config.items.filter((it) => !placed.has(it.id));
      const ok = !wrong.length && !missing.length;
      return { ok, message: ok ? 'Yes! Everything is in the right box.' : missing.length ? `${missing.length} still to sort.` : `Look again at: ${wrong.map((w) => w.label).join(', ')}.` };
    },
    reset: () => { placed.clear(); selected = null; draw(); },
  };
  return api;
}
