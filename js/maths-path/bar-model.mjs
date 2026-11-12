import { esc, liveRegion, button, clamp } from './core.mjs';

export const type = 'barModel';

function bars(a, b, total, unknown) {
  const sum = Math.max(1, a + b);
  const show = (value, hidden) => (hidden ? '?' : value);
  return `<div class="mp-bar" aria-hidden="true"><div class="mp-bar-total"><span>${show(total ?? a + b, unknown === 'total')}</span></div>` +
    `<div class="mp-bar-parts"><div class="mp-bar-part mp-bar-part--a" style="flex:${Math.max(a, 0.4) / sum}"><span>${show(a, unknown === 'a')}</span></div>` +
    `<div class="mp-bar-part mp-bar-part--b" style="flex:${Math.max(b, 0.4) / sum}"><span>${show(b, unknown === 'b')}</span></div></div></div>`;
}

export function render(config) {
  const [a, b] = config.parts ?? [config.a ?? 0, config.b ?? 0];
  const total = config.total ?? a + b;
  const unknown = config.unknown;
  const alt = config.alt ?? `A bar model. The whole bar is ${unknown === 'total' ? 'not known' : total}, split into ${unknown === 'a' ? 'an unknown part' : `a part of ${a}`} and ${unknown === 'b' ? 'an unknown part' : `a part of ${b}`}.`;
  return `<figure class="mp-w mp-barmodel" role="img" aria-label="${esc(alt)}">${bars(a, b, total, unknown)}` +
    (config.caption ? `<figcaption>${esc(config.caption)}</figcaption>` : '') + '</figure>';
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const max = config.max ?? 20;
  let a = clamp(config.a ?? 0, 0, max);
  let b = clamp(config.b ?? 0, 0, max);
  root.classList.add('mp-w', 'mp-barmodel');
  root.innerHTML = `<div data-bar></div><div class="mp-steppers"><div class="mp-stepper" data-a><span>First part</span></div><div class="mp-stepper" data-b><span>Second part</span></div></div><p class="mp-readout" data-readout></p>`;
  const say = liveRegion(root);
  const readout = root.querySelector('[data-readout]');
  const make = (slot, name, get, set) => {
    const holder = root.querySelector(slot);
    const out = doc.createElement('output');
    out.setAttribute('aria-label', `${name} value`);
    holder.append(
      button(doc, { text: '−', label: `Take one off the ${name.toLowerCase()}`, className: 'mp-btn mp-btn--round', onClick: () => { set(get() - 1); update(); } }),
      out,
      button(doc, { text: '+', label: `Add one to the ${name.toLowerCase()}`, className: 'mp-btn mp-btn--round', onClick: () => { set(get() + 1); update(); } }),
    );
    return out;
  };
  const outA = make('[data-a]', 'First part', () => a, (v) => { a = clamp(v, 0, max); });
  const outB = make('[data-b]', 'Second part', () => b, (v) => { b = clamp(v, 0, max); });
  function update() {
    root.querySelector('[data-bar]').innerHTML = bars(a, b, a + b, null);
    outA.textContent = a;
    outB.textContent = b;
    const text = `${a} and ${b} make ${a + b} altogether.`;
    readout.textContent = text;
    say(text);
    hooks.onChange?.(api.getState());
  }
  update();
  const api = {
    getState: () => ({ a, b, total: a + b }),
    matches: (target) => {
      const ok = target.total !== undefined ? a + b === target.total && (target.a === undefined || (a === target.a && b === target.b))
        : a === target.a && b === target.b;
      return { ok, message: ok ? `Yes! ${a} and ${b} make ${a + b}.` : `Your parts make ${a + b}. Change a part and look again.` };
    },
    reset: () => { a = config.a ?? 0; b = config.b ?? 0; update(); },
  };
  return api;
}
