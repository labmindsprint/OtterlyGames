import { esc, liveRegion, button } from './core.mjs';

export const type = 'patternBuilder';

const tile = (t) => (t.img
  ? `<img src="${esc(t.img)}" alt="" width="${t.size ?? 40}" height="${t.size ?? 40}" style="object-fit:contain">`
  : `<span class="mp-tile-face" style="--tile:${esc(t.color ?? '#888')}" aria-hidden="true">${esc(t.icon ?? '')}</span>`);

export function render(config) {
  const byId = new Map(config.palette.map((t) => [t.id, t]));
  const cells = config.sequence.map((id) => (id === null ? '<li class="mp-slot mp-slot--gap" aria-label="missing">?</li>'
    : `<li class="mp-slot" aria-label="${esc(byId.get(id).label)}">${tile(byId.get(id))}</li>`)).join('');
  return `<figure class="mp-w mp-pattern"><ol class="mp-slots">${cells}</ol>${config.caption ? `<figcaption>${esc(config.caption)}</figcaption>` : ''}</figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const byId = new Map(config.palette.map((t) => [t.id, t]));
  const fixed = config.sequence;
  const gaps = fixed.map((id, i) => (id === null ? i : -1)).filter((i) => i >= 0);
  const fill = new Map();
  let active = gaps[0];
  root.classList.add('mp-w', 'mp-pattern');
  root.innerHTML = '<ol class="mp-slots" data-slots></ol><p class="mp-tray-title">Choose a tile for the highlighted gap</p><div class="mp-tray" data-palette></div><p class="mp-readout" data-readout></p>';
  const say = liveRegion(root);
  const slots = root.querySelector('[data-slots]');
  const pal = root.querySelector('[data-palette]');
  function draw() {
    slots.innerHTML = '';
    fixed.forEach((id, i) => {
      const li = doc.createElement('li');
      if (id !== null) { li.className = 'mp-slot'; li.setAttribute('aria-label', byId.get(id).label); li.innerHTML = tile(byId.get(id)); slots.append(li); return; }
      const f = fill.get(i);
      li.className = 'mp-slot mp-slot--gap';
      const b = button(doc, { className: `mp-slot-btn${active === i ? ' is-active' : ''}`, text: f ? tile(byId.get(f)) : '?', label: `Gap ${gaps.indexOf(i) + 1}${f ? `, ${byId.get(f).label}` : ', empty'}. ${active === i ? 'Selected.' : 'Tap to select.'}`, onClick: () => { active = i; draw(); slots.querySelector('.is-active')?.focus(); } });
      li.append(b);
      slots.append(li);
    });
  }
  for (const t of config.palette) {
    pal.append(button(doc, { className: 'mp-tile-btn', text: tile(t), label: t.label, onClick: () => {
      if (active === undefined) return;
      fill.set(active, t.id);
      say(`${t.label} placed in gap ${gaps.indexOf(active) + 1}.`);
      const next = gaps.find((g) => !fill.has(g));
      active = next ?? active;
      draw();
      hooks.onChange?.(api.getState());
    } }));
  }
  draw();
  const api = {
    getState: () => ({ fill: Object.fromEntries(fill) }),
    matches: () => {
      const ok = gaps.every((g) => fill.get(g) === config.answer[gaps.indexOf(g)]);
      const full = gaps.every((g) => fill.has(g));
      return { ok, message: ok ? 'Yes! The pattern repeats the right way.' : full ? 'Not yet. Say the pattern out loud from the start and listen for the repeat.' : 'Fill every gap first.' };
    },
    reset: () => { fill.clear(); active = gaps[0]; draw(); },
  };
  return api;
}
