// Part-fit game feel: a seeded, reproducible plan of flashes, welding sparks, steam and a solder seam for one fitted
// module, plus a small DOM runner that mounts it above the craft. The motion itself lives in the fx block of
// css/space-academy.css; this file only places particles and cleans them up.
import { craftFor } from './campaign-crafts.mjs';
import { jointsFor } from './craft-joints.mjs';

export const IMPACT_MS = 140;
export const FIT_MS = 1400;
export const COMPLETE_MS = 2200;
export const REDUCED_MS = 300;
export const SETTLE_MS = 640;
export const POP_MS = 460;
export const CELEBRATE_MS = 820;
export const SPARKS_PER_JOINT = Object.freeze([8, 14]);
export const STEAM_PER_JOINT = Object.freeze([3, 5]);

// Where each module comes from before it clunks home (viewBox units), the edge it hits with, and its squash.
const SETTLE = Object.freeze({
  engine: { x: 0, y: 24, origin: '50% 0%', sq: [1.07, 0.92] },
  body: { x: 0, y: -20, origin: '50% 100%', sq: [1.05, 0.94] },
  cockpit: { x: 0, y: -22, origin: '50% 100%', sq: [1.05, 0.94] },
  nose: { x: 0, y: -28, origin: '50% 100%', sq: [1.06, 0.93] },
  'left-fin': { x: -28, y: 0, origin: '100% 50%', sq: [0.92, 1.06] },
  'right-fin': { x: 28, y: 0, origin: '0% 50%', sq: [0.92, 1.06] },
});

const UNITS = Object.freeze({ x: '%', y: '%', angle: 'rad', delay: 'ms', dur: 'ms' });
const round = (value, places = 2) => Math.round(value * 10 ** places) / 10 ** places;

export function hashSeed(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Everything one successful fit should show. Positions are percentages of the craft box, distances are viewBox
 * units (the runner scales them with --u), times are milliseconds from the moment the module starts moving.
 */
export function planFit({ grade, part, complete = false, reduced = false, seed } = {}) {
  const craft = craftFor(grade);
  const joint = jointsFor(grade, part);
  const slot = craft.parts.find(item => item.id === part);
  const at = ([x, y]) => ({ x: round(x / craft.width * 100, 3), y: round(y / craft.height * 100, 3) });
  const plan = {
    grade, part, complete: Boolean(complete), reduced: Boolean(reduced), duration: 0,
    settle: null, pop: null, ring: null, seam: null, aura: null,
    flashes: [], sparks: [], steam: [], twinkles: [], glows: [],
  };
  if (reduced) {
    plan.glows = joint.points.map(point => ({ ...at(point), size: 38, delay: 0, dur: REDUCED_MS }));
    plan.duration = REDUCED_MS;
    return plan;
  }

  const rand = mulberry32(seed ?? hashSeed(`${grade}:${part}`));
  const between = (low, high) => low + rand() * (high - low);
  const whole = (low, high) => low + Math.floor(rand() * (high - low + 1));
  const spread = joint.spread ?? 2.6;
  const entry = SETTLE[part];
  plan.settle = { x: entry.x, y: entry.y, origin: entry.origin, sqx: entry.sq[0], sqy: entry.sq[1], dur: SETTLE_MS };
  plan.pop = { delay: IMPACT_MS, dur: POP_MS };
  plan.ring = { x: round(slot.x, 3), y: round(slot.y, 3), delay: IMPACT_MS, dur: 560 };

  joint.points.forEach((point, order) => {
    const origin = at(point);
    const start = IMPACT_MS + order * 55;
    plan.flashes.push({ ...origin, size: round(between(34, 46), 1), delay: start, dur: 380 });
    const sparks = whole(SPARKS_PER_JOINT[0], SPARKS_PER_JOINT[1]);
    for (let index = 0; index < sparks; index += 1) {
      const angle = -Math.PI / 2 + (rand() - 0.5) * spread;
      const speed = between(30, 84);
      plan.sparks.push({
        ...origin, dx: round(Math.cos(angle) * speed, 1), dy: round(Math.sin(angle) * speed, 1),
        fall: round(between(44, 88), 1), size: round(between(3.2, 6.4), 1),
        delay: start + whole(0, 90), dur: whole(420, 760),
      });
    }
    const puffs = whole(STEAM_PER_JOINT[0], STEAM_PER_JOINT[1]);
    for (let index = 0; index < puffs; index += 1) {
      plan.steam.push({
        ...origin, dx: round(between(-10, 10), 1), dy: round(-between(26, 54), 1), size: round(between(12, 20), 1),
        grow: round(between(2.1, 3.1), 2), delay: start + 70 + index * 40 + whole(0, 80), dur: whole(600, 800),
      });
    }
  });

  if (joint.seam) {
    const [[x1, y1], [x2, y2]] = joint.seam;
    plan.seam = {
      ...at([(x1 + x2) / 2, (y1 + y2) / 2]), len: round(Math.hypot(x2 - x1, y2 - y1), 1),
      angle: round(Math.atan2(y2 - y1, x2 - x1), 3), delay: IMPACT_MS, dur: 1100,
    };
  }

  if (complete) {
    const bottomUp = craft.parts.map(item => jointsFor(grade, item.id).points[0])
      .sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    bottomUp.forEach((point, index) => {
      plan.twinkles.push({ ...at(point), size: round(between(20, 26), 1), delay: CELEBRATE_MS + index * 130, dur: 520 });
    });
    plan.aura = { x: 50, y: 50, delay: CELEBRATE_MS, dur: 1300 };
  }

  const timed = [...plan.flashes, ...plan.sparks, ...plan.steam, ...plan.twinkles, plan.ring, plan.pop, plan.seam, plan.aura];
  plan.duration = Math.max(SETTLE_MS, ...timed.filter(Boolean).map(item => item.delay + item.dur));
  return plan;
}

/** CSS custom properties for one particle record: percentages for x/y, ms for times, radians for the seam angle. */
export function styleFor(item) {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => [`--${key}`, `${value}${UNITS[key] ?? ''}`]));
}

let active = null;
let timer = 0;
let rig = null;

const clock = () => (typeof performance === 'object' ? performance.now() : Date.now());

/** Stop the cleanup timer and the stage's resize watcher (the scene is being rebuilt); an unfinished fit effect resumes on the next runFx call. */
export function stopFx() {
  clearTimeout(timer);
  timer = 0;
  rig?.observer?.disconnect();
  rig = null;
}

function finish() {
  timer = 0;
  const assembly = active?.root.querySelector('.sa-craft-assembly');
  active = null;
  if (!assembly) return;
  assembly.classList.remove('is-fx-pop');
  assembly.removeAttribute('data-fx');
  assembly.style.removeProperty('--fx-lag');
  assembly.querySelector('.sa-fx-layer')?.replaceChildren();
  const module = assembly.querySelector('.is-just-fitted');
  if (module) {
    module.classList.remove('is-just-fitted');
    for (const name of ['--fx-x', '--fx-y', '--fx-origin', '--fx-sq-x', '--fx-sq-y', '--fx-lag']) module.style.removeProperty(name);
  }
}

function mount(assembly, layer, module, plan, elapsed) {
  const craft = craftFor(plan.grade);
  const width = layer.clientWidth;
  layer.style.setProperty('--u', `${width > 0 ? round(width / craft.width, 4) : 1}px`);
  layer.style.setProperty('--elapsed', `${Math.round(elapsed)}ms`);
  layer.replaceChildren();
  layer.addEventListener('animationend', event => {
    if (event.pseudoElement === '' && event.target.parentNode === layer) event.target.remove();
  });
  const add = (kind, items) => {
    for (const item of items) {
      if (item.delay + item.dur <= elapsed) continue;
      const node = document.createElement('i');
      node.className = `sa-fx-${kind}`;
      for (const [name, value] of Object.entries(styleFor(item))) node.style.setProperty(name, value);
      layer.append(node);
    }
  };
  add('aura', plan.aura ? [plan.aura] : []);
  add('glow', plan.glows);
  add('seam', plan.seam ? [plan.seam] : []);
  add('steam', plan.steam);
  add('ring', plan.ring ? [plan.ring] : []);
  add('flash', plan.flashes);
  add('spark', plan.sparks);
  add('twinkle', plan.twinkles);
  assembly.dataset.fx = plan.complete ? 'complete' : 'fit';
  if (!plan.settle) return;
  const lag = `${-Math.round(elapsed)}ms`;
  const { settle } = plan;
  for (const [name, value] of Object.entries({
    '--fx-x': `${settle.x}px`, '--fx-y': `${settle.y}px`, '--fx-origin': settle.origin,
    '--fx-sq-x': settle.sqx, '--fx-sq-y': settle.sqy, '--fx-lag': lag,
  })) module.style.setProperty(name, value);
  module.classList.add('is-just-fitted');
  assembly.style.setProperty('--fx-lag', lag);
  assembly.classList.add('is-fx-pop');
}

/**
 * Called at the end of every render. A new request starts an effect; later renders inside the same effect window
 * re-mount it part-way through, so rebuilding the screen never cuts the animation off. Always returns null so the
 * caller can write `pendingFx = runFx(root, pendingFx)`.
 */
export function runFx(root, request = null) {
  stopFx();
  try { rigFlight(root); } catch { stopFx(); }
  try {
    if (request?.arrival) {
      veil(root);
      request = null;
    }
    if (request) {
      const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      active = { root, plan: planFit({ ...request, reduced }), started: clock() };
    }
    if (!active) return null;
    active.root = root;
    const elapsed = clock() - active.started;
    const { plan } = active;
    const assembly = root.querySelector('.sa-craft-assembly');
    const layer = assembly?.querySelector('.sa-fx-layer');
    const module = assembly?.querySelector(`[data-craft-part="${plan.part}"].is-fitted`);
    if (elapsed >= plan.duration || !layer || !module) {
      active = null;
      return null;
    }
    mount(assembly, layer, module, plan, elapsed);
    timer = setTimeout(finish, plan.duration - elapsed + 80);
  } catch {
    active = null;
  }
  return null;
}

// ----------------------------------------------------------------------------------------------------------------
// Launch stage. SpaceScene (art.mjs) drives it from the ACTIVE flight clock: each tick it writes --lift, --climb,
// --thrust, --travel, --scroll, --bank, --world and --flash plus data-phase / data-digit on [data-flight]. This part is
// static markup, pure sizing helpers and a small rig that measures the drawn craft once.
// ----------------------------------------------------------------------------------------------------------------

// Face colours (highlight, body, shadow) for the destination that grows from a dot at the end of the flight.
const TINT = Object.freeze({
  earth: '#9fdcff #2f7fd0 #123a73', moon: '#f4f1ea #b3b0ab #5a5960', iss: '#f6f8fc #a3afc4 #4a5670',
  sun: '#fff6b8 #ffb82e #e2561b', mercury: '#eadfd2 #a08f7e #4d423c', venus: '#fff1cc #e5b86e #8f5d2e',
  mars: '#ffb593 #d65a33 #70261a', asteroid_belt: '#ddcdbb #917e6c #43392f', jupiter: '#f8dfb8 #d29d66 #7c4c2e',
  saturn: '#fcecc0 #dab870 #82663a', enceladus: '#f6fcff #c0e0f2 #6089a8', uranus: '#dcfcff #7dd4df #327f96',
  neptune: '#acc9ff #4263d4 #1b2c7c', pluto: '#f3e5d4 #bc9d85 #604a3d',
  alpha_centauri: '#fff2c2 #ffc65a #c4631f', betelgeuse: '#ffd2a0 #ff7a3c #a32a14', sirius: '#f2f8ff #b8d4ff #5f86d6',
  pulsar: '#e8f4ff #8fc4ff #3c5fd1', quasar: '#fff0d6 #ffa8d0 #6b3bd1',
});
const DEEP_TINTS = Object.freeze([
  '#ffd1ec #c25bd8 #3b1f7a', '#bfe9ff #4a8df0 #1b2f86', '#ffe2b0 #f08a4b #6a2a43',
  '#d6ffe9 #46c7a5 #14516a', '#ffc9d9 #ff6f9a #5b2275', '#e6dcff #8a74f0 #2c2a82',
]);
const STAR_WORLDS = new Set(['sun', 'alpha_centauri', 'betelgeuse', 'sirius', 'pulsar', 'quasar']);

/** How the destination is painted: a shaded planet, a glowing star, a soft nebula or galaxy, or a black hole. */
export function worldLook(id) {
  const key = String(id ?? '');
  const colors = (TINT[key] ?? DEEP_TINTS[hashSeed(key) % DEEP_TINTS.length]).split(' ');
  const kind = key === 'black_hole' ? 'hole' : STAR_WORLDS.has(key) ? 'star' : TINT[key] ? 'planet' : 'deep';
  return { kind, colors, ring: key === 'saturn' };
}

// Peak bank pose of the craft box, mirrored from the .sa-flying-rocket rule: turned 11deg about its 50% 60% point,
// shifted left by 10% of its width, and still almost full size when the bank is complete.
const BANK_TURN = 11 * Math.PI / 180;
const BANK_SHIFT = 0.1;
const BANK_SCALE = 0.98;

/**
 * Size the craft for the stage that is actually on screen so it is never clipped: the largest craft whose nozzle can
 * climb to its cruise height with the bank swing still below the top edge, and whose banked box stays inside the
 * stage width. Heights are fractions of the stage height; size and padWidth are CSS pixels.
 */
export function flightFit({ width, height, ratio = 1, dropK = 0.12 } = {}) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const wide = w > h * 1.45;
  const padTop = wide ? 0.15 : 0.18;
  const rise = wide ? 0.17 : 0.24;
  const above = 1 - dropK + 0.1;
  const swing = BANK_SCALE * (Math.cos(BANK_TURN) / 2 + 0.4 * Math.sin(BANK_TURN) / ratio) + BANK_SHIFT;
  const size = Math.max(48, Math.min((0.95 - padTop - rise) * h / above, 0.8 * w / ratio, (w / 2 - 1) / (swing * ratio)));
  return { size: round(size, 1), padWidth: round(Math.min(size * ratio * 1.75, w * 1.02), 1), padTop, rise };
}

/**
 * Where the engine flames sit on the craft, as percentages of the craft box, from the measured flame outlines
 * (viewBox units). dropK is the fraction of the box below the lowest nozzle: it lets the craft stand on the pad.
 */
export function jetPlan(flames, view) {
  const width = view?.width > 0 ? view.width : 1;
  const height = view?.height > 0 ? view.height : 1;
  const jets = (flames ?? []).filter(flame => flame.width > 0 && flame.height > 0).map(flame => ({
    x: round((flame.x + flame.width / 2) / width * 100, 2),
    y: round(flame.y / height * 100, 2),
    w: round(flame.width / width * 100, 2),
  }));
  const lowest = jets.length ? Math.max(...jets.map(jet => jet.y)) : 88;
  return { ratio: round(width / height, 4), dropK: round(Math.min(0.4, Math.max(0, (100 - lowest) / 100)), 4), jets };
}

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

// Pad cluster, drawn in a 460 x 260 box; the craft's nozzles stand on y = 200.
const PAD_STRIPES = Array.from({ length: 12 }, (_, index) => `M${60 + index * 29} 222h15l-9 10h-15z`).join('');
const PAD_RUNGS = [196, 160, 124, 88, 52].map(y => `M16 ${y}H60`).join('');
const PAD = `<svg class="sa-fl-pad" viewBox="0 0 460 260" focusable="false">
  <ellipse cx="230" cy="238" rx="214" ry="10" fill="#070b1f" opacity=".5"/>
  <path d="M112 230H348L358 252H102Z" fill="#232b49"/>
  <path d="M60 204H400V232H60Z" fill="#46507a"/>
  <path d="M60 222H400V232H60Z" fill="#232b49"/>
  <path d="${PAD_STRIPES}" fill="#f2c94c"/>
  <path d="M76 190H384L402 204H58Z" fill="#7d89b3"/>
  <rect x="190" y="207" width="80" height="13" rx="3" fill="#161b33"/>
  <rect class="sa-fl-trench" x="193" y="210" width="74" height="8" rx="2" fill="#ffa447"/>
  <path d="M16 232V22M60 232V22" stroke="#59658f" stroke-width="6" fill="none"/>
  <path d="M16 232L60 196 16 160 60 124 16 88 60 52 16 16" stroke="#7683ad" stroke-width="3" fill="none"/>
  <path d="${PAD_RUNGS}" stroke="#59658f" stroke-width="3"/>
  <rect x="10" y="10" width="56" height="10" rx="3" fill="#2d3560"/>
  <circle class="sa-fl-lamp" cx="38" cy="7" r="5" fill="#ff5d4f"/>
  <g class="sa-fl-arm sa-fl-arm--a" style="transform-origin:60px 76px"><rect x="60" y="72" width="92" height="8" rx="2" fill="#6f7ca8"/><rect x="146" y="67" width="10" height="18" rx="2" fill="#f2c94c"/></g>
  <g class="sa-fl-arm sa-fl-arm--b" style="transform-origin:60px 140px"><rect x="60" y="136" width="92" height="8" rx="2" fill="#6f7ca8"/><rect x="146" y="131" width="10" height="18" rx="2" fill="#f2c94c"/></g>
  <path d="M418 232V44" stroke="#59658f" stroke-width="5"/>
  <rect x="404" y="36" width="30" height="11" rx="3" fill="#2d3560"/>
  <path d="M408 47L330 196H430Z" fill="#ffe9a8" opacity=".09"/>
  <circle class="sa-fl-lamp sa-fl-lamp--b" cx="419" cy="41" r="4" fill="#ffe9a8"/>
</svg>`;
const HILLS = `<svg class="sa-fl-hills" viewBox="0 0 400 100" preserveAspectRatio="none" focusable="false"><path d="M0 62C40 38 80 64 130 46S230 22 290 48 370 40 400 30V100H0Z" fill="#2a3870" opacity=".75"/><path d="M0 78C50 62 100 84 160 70S280 58 340 74 390 70 400 66V100H0Z" fill="#1d2858"/></svg>`;

// Steam and smoke from the pad: [x, drift, rise, size, grow, delay s, duration s], in 1% of the craft height.
const BACK_PUFFS = [[-34, -46, 20, 30, 2.4, 0, 2.2], [-10, -16, 34, 38, 2.6, 0.6, 2.4], [14, 20, 38, 36, 2.5, 1.2, 2.2], [38, 48, 22, 30, 2.2, 0.3, 2], [-56, -72, 4, 22, 2.6, 0.9, 2.6], [56, 72, 4, 22, 2.6, 1.5, 2.6]];
const FRONT_PUFFS = [[-22, -34, 20, 38, 2.6, 0.4, 2.3], [4, 4, 30, 42, 2.8, 1.1, 2.5], [26, 38, 18, 34, 2.4, 1.7, 2.1]];
const puffs = list => list.map(([x, drift, rise, size, grow, delay, duration]) =>
  `<i class="sa-fl-puff" style="--px:${x};--dx:${drift};--rise:${rise};--s:${size};--grow:${grow};--d:${-delay}s;--t:${duration}s"></i>`).join('');
const STREAKS = [12, 26, 72, 86, 95].map((left, index) =>
  `<i style="left:${left}%;--sd:${(0.46 + index * 0.07).toFixed(2)}s;--sl:${(-index * 0.17).toFixed(2)}s"></i>`).join('');

/** The whole launch picture. Decorative layers are aria-hidden; the craft SVG and the progress meter stay exposed. */
export function flightStage({ craft = '', grade = '', destination = '', paused = false } = {}) {
  const look = worldLook(destination);
  const [high, body, low] = look.colors;
  return `<div class="sa-flight" data-flight data-elapsed="0" data-phase="countdown" data-digit="3" data-live="true" data-craft="${esc(grade)}" data-world="${esc(destination)}" data-kind="${look.kind}"${look.ring ? ' data-ring' : ''}${paused ? ' data-paused' : ''} style="--orb-a:${high};--orb-b:${body};--orb-c:${low}">
    <div class="sa-fl-space" aria-hidden="true"><i class="sa-fl-stars sa-fl-stars--far"></i><i class="sa-fl-stars sa-fl-stars--mid"></i><i class="sa-fl-stars sa-fl-stars--near"></i></div>
    <div class="sa-fl-sky" aria-hidden="true"></div>
    <div class="sa-fl-drift" aria-hidden="true"><i class="sa-fl-body sa-fl-body--ringed"></i><i class="sa-fl-body sa-fl-body--moon"></i><i class="sa-fl-body sa-fl-body--rock-a"></i><i class="sa-fl-body sa-fl-body--rock-b"></i></div>
    <div class="sa-fl-world" aria-hidden="true"><i class="sa-fl-orb"></i></div>
    <div class="sa-fl-speed" aria-hidden="true">${STREAKS}</div>
    <div class="sa-fl-cam">
      <div class="sa-fl-ground" aria-hidden="true">${HILLS}<i class="sa-fl-floor"></i>${PAD}<i class="sa-fl-bloom"></i><div class="sa-fl-puffs">${puffs(BACK_PUFFS)}</div><i class="sa-fl-shock"></i></div>
      <div class="sa-fl-rise"><div class="sa-flying-rocket"><i class="sa-fl-glow" aria-hidden="true"></i>${craft}</div></div>
      <div class="sa-fl-ground sa-fl-ground--front" aria-hidden="true"><div class="sa-fl-puffs">${puffs(FRONT_PUFFS)}</div></div>
    </div>
    <div class="sa-fl-count" aria-hidden="true"><span data-n="3">3</span><span data-n="2">2</span><span data-n="1">1</span></div>
    <div class="sa-fl-flash" aria-hidden="true"><i class="sa-fl-ring"></i></div>
    <progress class="sa-fl-meter" max="1" value="0" aria-label="Flight progress"></progress>
  </div>`;
}

/**
 * Measure the drawn craft once (nozzle positions, aspect ratio), add one glowing jet per engine flame, and keep the
 * craft sized to the stage. The only layout reads happen here, never per animation frame.
 */
function rigFlight(root) {
  const flight = root.querySelector('[data-flight]');
  const holder = flight?.querySelector('.sa-flying-rocket');
  if (!holder) return;
  const svg = holder.querySelector('svg');
  const flames = [];
  for (const group of svg?.querySelectorAll('[data-feature="exhaust"]') ?? []) {
    const shape = group.querySelector('[data-flame="outer"]') ?? group.querySelector('path') ?? group;
    const { x, y, width, height } = shape.getBBox();
    flames.push({ x, y, width, height });
  }
  const plan = jetPlan(flames, svg?.viewBox?.baseVal);
  flight.style.setProperty('--craft-ar', plan.ratio);
  flight.style.setProperty('--drop-k', plan.dropK);
  for (const jet of plan.jets) {
    const node = document.createElement('i');
    node.className = 'sa-fl-jet';
    node.setAttribute('aria-hidden', 'true');
    node.style.cssText = `--jx:${jet.x}%;--jy:${jet.y}%;--jw:${jet.w}%`;
    node.append(document.createElement('b'));
    holder.append(node);
  }
  const fit = () => {
    const { clientWidth: width, clientHeight: height } = flight;
    if (!width || !height) return;
    const size = flightFit({ width, height, ratio: plan.ratio, dropK: plan.dropK });
    flight.style.setProperty('--fl-h', `${size.size}px`);
    flight.style.setProperty('--pad-w', `${size.padWidth}px`);
    flight.style.setProperty('--pad-top', `${round(size.padTop * 100, 1)}%`);
    flight.style.setProperty('--rise', `${round(-size.rise * 100, 1)}%`);
  };
  fit();
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(fit);
    observer.observe(flight);
    rig = { observer };
  }
}

/** A soft white wash that fades out over the discovery screen right after the arrival flash. */
function veil(root) {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = (root.querySelector('.sa-content') ?? root).getBoundingClientRect();
  const node = document.createElement('div');
  node.className = 'sa-fx-veil';
  node.setAttribute('aria-hidden', 'true');
  node.style.cssText = `top:${Math.round(box.top)}px;left:${Math.round(box.left)}px;width:${Math.round(box.width)}px;height:${Math.round(box.height)}px`;
  node.addEventListener('animationend', () => node.remove(), { once: true });
  root.append(node);
}
