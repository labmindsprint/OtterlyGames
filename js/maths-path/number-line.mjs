import { esc, liveRegion, button, clamp, rovingFocus } from './core.mjs';

export const type = 'numberLine';

function arcs(hops, min, max) {
  const span = max - min;
  const paths = hops.map(([from, to]) => {
    const a = from - min;
    const b = to - min;
    const mid = (a + b) / 2;
    const lift = Math.min(26, 8 + Math.abs(b - a) * 3);
    return `<path d="M${a} 34 Q${mid} ${34 - lift} ${b} 34" class="mp-nl-hop" vector-effect="non-scaling-stroke"/>`;
  });
  return `<svg class="mp-nl-arcs" viewBox="0 0 ${span} 36" preserveAspectRatio="none" aria-hidden="true" focusable="false">${paths.join('')}</svg>`;
}

function ticksHtml({ min = 0, max = 10, labelEvery = 1 }, interactive, marker) {
  const span = max - min;
  const out = [];
  for (let n = min; n <= max; n++) {
    const pct = ((n - min) / span) * 100;
    const labelled = (n - min) % labelEvery === 0 || n === max;
    const label = labelled ? `<span class="mp-nl-label">${n}</span>` : '';
    out.push(interactive
      ? `<button type="button" class="mp-nl-tick${n === marker ? ' is-on' : ''}" style="left:${pct}%" data-n="${n}" aria-label="${n}"><i></i>${label}</button>`
      : `<span class="mp-nl-tick${n === marker ? ' is-on' : ''}" style="left:${pct}%" aria-hidden="true"><i></i>${label}</span>`);
  }
  return out.join('');
}

export function render(config) {
  const { min = 0, max = 10, hops = [], marker } = config;
  const alt = config.alt ?? `A number line from ${min} to ${max}${hops.length ? `. ${hops.map(([a, b]) => `A hop from ${a} to ${b}`).join('. ')}` : ''}.`;
  return `<figure class="mp-w mp-numberline" role="img" aria-label="${esc(alt)}"><div class="mp-nl" aria-hidden="true">${hops.length ? arcs(hops, min, max) : '<div class="mp-nl-gap"></div>'}<div class="mp-nl-axis">${ticksHtml({ ...config, min, max }, false, marker)}</div></div>` +
    (config.caption ? `<figcaption>${esc(config.caption)}</figcaption>` : '') + '</figure>';
}

export function mount(root, config, hooks = {}) {
  const { min = 0, max = 20 } = config;
  const doc = root.ownerDocument;
  const start = clamp(config.start ?? min, min, max);
  let at = start;
  let hops = [];
  root.classList.add('mp-w', 'mp-numberline');
  root.innerHTML = '<div class="mp-nl"><div data-arcs></div><div class="mp-nl-axis" data-axis></div></div><p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>';
  const axis = root.querySelector('[data-axis]');
  const say = liveRegion(root);
  const step = config.step ?? 1;

  const message = () => hops.length
    ? `You are on ${at}. Last hop: ${hops[hops.length - 1][0]} to ${at}.`
    : `You are on ${at}. Tap a number or use the hop buttons.`;
  function draw(focus) {
    axis.innerHTML = ticksHtml({ ...config, min, max }, true, at);
    root.querySelector('[data-arcs]').innerHTML = hops.length ? arcs(hops.slice(-6), min, max) : '<div class="mp-nl-gap"></div>';
    rovingFocus(axis, '.mp-nl-tick');
    const current = axis.querySelector(`[data-n="${at}"]`);
    for (const tick of axis.querySelectorAll('.mp-nl-tick')) tick.tabIndex = tick === current ? 0 : -1;
    if (focus) current?.focus();
    root.querySelector('[data-readout]').textContent = message();
  }
  function go(to, focus = true) {
    to = clamp(to, min, max);
    if (to === at) return;
    hops.push([at, to]);
    at = to;
    draw(focus);
    say(message());
    hooks.onChange?.(api.getState());
  }
  axis.addEventListener('click', (event) => {
    const tick = event.target.closest('.mp-nl-tick');
    if (tick) go(Number(tick.dataset.n));
  });
  root.querySelector('[data-controls]').append(
    button(doc, { text: `Hop back ${step}`, onClick: () => go(at - step, false) }),
    button(doc, { text: `Hop forward ${step}`, onClick: () => go(at + step, false) }),
    button(doc, { text: 'Start again', className: 'mp-btn mp-btn--ghost', onClick: () => api.reset() }),
  );
  draw();

  const api = {
    getState: () => ({ position: at, hops: hops.length, hopped: hops.reduce((sum, [a, b]) => sum + Math.abs(b - a), 0) }),
    matches: (target) => {
      const ok = at === target.position;
      return { ok, message: ok ? `Yes! You landed on ${at}.` : `You are on ${at}. Where should you land? Try again.` };
    },
    reset: () => { hops = []; at = start; draw(); say(message()); hooks.onChange?.(api.getState()); },
  };
  return api;
}
