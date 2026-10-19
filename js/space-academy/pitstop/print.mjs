// Pit Stop print bay: the comic 3D-printer reward animation and the ship customiser.
import { PAINTS, STICKERS } from './data.mjs';
import { stickerName } from './schematics.mjs';
import { STICKER_ART, stickerSVG } from './stickers.mjs';
import { loadShip, shipData, shipSVG } from './ships/index.mjs';

const INK = '#2b2b2b';
const PAPER = '#fffdf8';
const GREY = '#d9d6cf';
const MID = '#8a8780';
const GOLD = '#f5b82e';
const GOLD_SOFT = '#fde9a8';
const BLUE = '#4a8fe0';
const BLUE_SOFT = '#d3e6fb';
const NIGHT = '#2f3650';
const NIGHT2 = '#3b4468';
const GOOD = '#3aa56b';

const FULL_MS = 1800;
const REDUCED_MS = 400;
const SKIP_GUARD_MS = 160;


const paintById = id => PAINTS.find(item => item.id === id) ?? null;
const paintByColor = color => (color ? PAINTS.find(item => item.color.toLowerCase() === String(color).toLowerCase()) ?? null : null);
const resolveColor = value => (paintById(value)?.color ?? (typeof value === 'string' && value.startsWith('#') ? value : null));

const r1 = value => Math.round(value * 10) / 10;
const burstPoints = (cx, cy, rx, ry, count, inner) => {
  const points = [];
  for (let i = 0; i < count * 2; i += 1) {
    const k = i % 2 ? inner : 1;
    const angle = -Math.PI / 2 + (i * Math.PI) / count;
    points.push(`${r1(cx + rx * k * Math.cos(angle))},${r1(cy + ry * k * Math.sin(angle))}`);
  }
  return points.join(' ');
};

const SPARK_PATH = 'M0 -8L2.2 -2.2L8 0L2.2 2.2L0 8L-2.2 2.2L-8 0L-2.2 -2.2Z';
const sparkles = (cx, cy) => [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
  const angle = (i * Math.PI) / 4 + 0.2;
  const reach = i % 2 ? 78 : 98;
  const dx = r1(Math.cos(angle) * reach);
  const dy = r1(Math.sin(angle) * reach * 0.8);
  const color = i % 3 === 0 ? '#fff' : GOLD;
  const scale = i % 2 ? 0.8 : 1.15;
  return `<g class="ps-print-sp" style="--dx:${dx}px;--dy:${dy}px"><path transform="translate(${cx} ${cy}) scale(${scale})" d="${SPARK_PATH}" fill="${color}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/></g>`;
}).join('');

function frame(spoolColor) {
  return `<ellipse cx="150" cy="291" rx="124" ry="7" fill="${GREY}"/>` +
    `<rect x="40" y="276" width="42" height="13" rx="5" fill="${NIGHT2}" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="218" y="276" width="42" height="13" rx="5" fill="${NIGHT2}" stroke="${INK}" stroke-width="3"/>` +
    `<circle cx="248" cy="30" r="17" fill="${spoolColor}" stroke="${INK}" stroke-width="3"/>` +
    `<circle cx="248" cy="30" r="6" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M236 20Q248 12 260 20M236 40Q248 48 260 40" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>` +
    `<path d="M240 46Q232 56 220 54" fill="none" stroke="${spoolColor}" stroke-width="3" stroke-linecap="round"/>` +
    `<rect x="14" y="36" width="272" height="246" rx="22" fill="${NIGHT}" stroke="${INK}" stroke-width="3"/>` +
    `<circle cx="38" cy="54" r="5.5" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>` +
    `<circle class="ps-print-led" cx="58" cy="54" r="5.5" fill="${MID}" stroke="${INK}" stroke-width="2"/>` +
    `<circle class="ps-print-led-ok" cx="78" cy="54" r="5.5" fill="${MID}" stroke="${INK}" stroke-width="2"/>` +
    `<text x="214" y="60" text-anchor="middle" class="ps-print-title">PRINT BAY</text>` +
    `<path d="M28 276H40M260 276H272" stroke="${NIGHT2}" stroke-width="3" stroke-linecap="round"/>` +
    `<rect x="30" y="72" width="240" height="196" rx="12" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="35" y="77" width="8" height="186" rx="3" fill="${GREY}" stroke="${INK}" stroke-width="2.2"/>` +
    `<rect x="257" y="77" width="8" height="186" rx="3" fill="${GREY}" stroke="${INK}" stroke-width="2.2"/>`;
}

function gantry(barX, barW, tool, extra) {
  return '<g class="ps-print-park"><g class="ps-print-gantry">' +
    `<rect x="${barX}" y="-17" width="${barW}" height="11" rx="4" fill="${GREY}" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M${barX + 6} -14H${barX + barW - 6}" stroke="#fff" stroke-width="2" stroke-linecap="round"/>` +
    `<g class="ps-print-carriage">${tool}${extra}</g></g></g>`;
}

const NOZZLE =
  `<rect x="-13" y="-31" width="26" height="22" rx="5" fill="${BLUE_SOFT}" stroke="${INK}" stroke-width="2.5"/>` +
  `<path d="M-6 -26H6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>` +
  `<path d="M-7 -10H7L2.6 -1H-2.6Z" fill="${GOLD}" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"/>`;
const SPARKS = `<g class="ps-print-spark" fill="none" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"><path d="M-8 4L-14 8M8 4L14 8M0 6V13"/></g>`;

function stickerScene(art) {
  const bar = (x, y, w, h) => `x="${x}" y="${y}" width="${w}" height="${h}"`;
  return frame(GOLD_SOFT) +
    `<rect ${bar(52, 240, 196, 18)} rx="5" fill="${GREY}" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M64 249H236" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>` +
    `<g class="ps-print-art"><g transform="translate(85 110) scale(2.1667)">${art}</g></g>` +
    `<rect class="ps-print-cover" ${bar(83, 110, 134, 130)} fill="${PAPER}"/>` +
    `<rect class="ps-print-foot" ${bar(85, 110, 130, 130)} rx="14" fill="none" stroke="${MID}" stroke-width="2" stroke-dasharray="6 5"/>` +
    gantry(34, 232, NOZZLE, SPARKS) + sparkles(150, 176);
}

function paintScene(color, name, oldColor, classId) {
  let ship = '';
  try {
    shipData(classId);
    ship = shipSVG(classId, { built: 'all', paint: null, attrs: 'x="124" y="62" width="150" height="210"' });
  } catch {
    ship = '';
  }
  const roller =
    `<rect x="-12" y="-33" width="24" height="12" rx="4" fill="${BLUE_SOFT}" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M0 -21V-17" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
    `<rect x="-17" y="-18" width="34" height="18" rx="9" fill="${color}" stroke="${INK}" stroke-width="2.5"/>` +
    '<path d="M-9 -12H6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>';
  const puff = [[-36, -22, 15], [34, -34, 13], [44, 24, 16], [-38, 34, 14], [2, -64, 12], [4, 62, 13]]
    .map(([x, y, r]) => `<circle cx="${199 + x}" cy="${168 + y}" r="${r}" fill="${color}" stroke="${INK}" stroke-width="2.2"/>`).join('');
  return frame(color) +
    `<rect x="48" y="100" width="88" height="140" rx="8" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="52" y="104" width="80" height="104" rx="4" fill="none" stroke="${MID}" stroke-width="2" stroke-dasharray="6 5"/>` +
    `<g class="ps-print-fill"><rect x="52" y="104" width="80" height="104" rx="4" fill="${color}"/>` +
    '<path d="M62 114V150M70 114V126" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/></g>' +
    `<rect x="52" y="104" width="80" height="104" rx="4" fill="none" stroke="${INK}" stroke-width="2.5"/>` +
    `<text x="92" y="229" text-anchor="middle" class="ps-print-swatch-name">${name}</text>` +
    `<ellipse cx="199" cy="256" rx="54" ry="7" fill="${GREY}" stroke="${INK}" stroke-width="2.5"/>` +
    `<g class="ps-print-hop"><g class="ps-print-shipcol" style="--old:${oldColor};--new:${color}">${ship}</g></g>` +
    `<g class="ps-print-puff">${puff}</g>` +
    gantry(34, 106, roller, '') + sparkles(199, 170);
}

export function mountPrinter(root, opts = {}) {
  const { classId, reward = {}, paint = null, stickerArt = null, reducedMotion = false, onDone } = opts;
  const isPaint = reward.kind === 'paint';
  const art = stickerArt ?? STICKER_ART;
  const newPaint = isPaint ? paintById(reward.id) : null;
  const label = isPaint ? 'NEW COLOUR!' : 'NEW STICKER!';
  const body = isPaint
    ? paintScene(newPaint?.color ?? '#ff8a65', newPaint?.name ?? 'Colour', resolveColor(paint) ?? PAPER, classId)
    : stickerScene(art[reward.id] ?? art.star ?? '');
  const polygon = burstPoints(150, 313, 92, 26, 15, 0.84);
  root.innerHTML = `<div class="ps-print${isPaint ? ' ps-print-paint' : ''}${reducedMotion ? ' ps-print-rm' : ''}" role="button" tabindex="0" aria-label="${label} Tap to continue.">` +
    `<svg class="ps-print-svg" viewBox="0 0 300 342" aria-hidden="true" focusable="false">${body}` +
    `<g class="ps-print-label"><polygon points="${polygon}" fill="${GOLD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<text x="150" y="320" text-anchor="middle" class="ps-print-label-text">${label}</text></g></svg></div>`;
  const el = root.firstElementChild;
  const started = performance.now();
  let finished = false;
  let timer = 0;
  const detach = () => {
    clearTimeout(timer);
    el.removeEventListener('pointerdown', skip);
    document.removeEventListener('keydown', onKey);
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    detach();
    onDone?.();
  };
  function skip() {
    if (finished || performance.now() - started < SKIP_GUARD_MS) return;
    el.classList.add('ps-print-skip');
    finish();
  }
  function onKey(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      skip();
    }
  }
  el.addEventListener('pointerdown', skip);
  document.addEventListener('keydown', onKey);
  timer = setTimeout(finish, reducedMotion ? REDUCED_MS : FULL_MS);
  return {
    destroy() {
      finished = true;
      detach();
      if (root.firstElementChild === el) root.innerHTML = '';
    },
  };
}

const LOCK = `<svg class="ps-cust-lock" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><rect x="4" y="10" width="16" height="11" rx="3" fill="${GREY}" stroke="${INK}" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></svg>`;
const TICK = `<svg class="ps-cust-tick" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M5 13l5 5 9-11" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 13l5 5 9-11" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function mountCustomizer(root, opts = {}) {
  const { classId, stickerArt = null, unlockedPaints = [], unlockedStickers = [], lockHint = () => '', earnText = '', onChange, onDone } = opts;
  const art = stickerArt ?? STICKER_ART;
  const paintOpen = new Set(['cream', ...unlockedPaints]);
  const stickerOpen = new Set(unlockedStickers);
  const startPaint = opts.paint ?? null;
  const emitAsId = paintById(startPaint) !== null;
  let color = resolveColor(startPaint) ?? PAPER;
  let placed = (opts.stickers ?? []).filter(item => item && STICKERS.includes(item.id)).map(item => ({ slot: item.slot, id: item.id }));
  let pickSticker = null;
  let pickSlot = null;
  let lastSlot = null;
  let destroyed = false;
  let slots = [];

  root.innerHTML =
    '<section class="ps-cust" aria-label="Customise your ship">' +
    '<div class="ps-cust-ship"><div class="ps-cust-art"></div><div class="ps-cust-slots"></div></div>' +
    '<p class="ps-cust-hint" aria-live="polite"></p>' +
    '<div class="ps-cust-heading">Paint</div><div class="ps-cust-paints" role="group" aria-label="Paint colours"></div>' +
    '<div class="ps-cust-heading">Stickers</div><div class="ps-cust-stickers" role="group" aria-label="Stickers"></div>' +
    `<p class="ps-cust-earn">${earnText || 'Locked? Find its schematic in free roam, then take a Print test to print it.'}</p>` +
    '<div class="ps-cust-foot"><button type="button" class="ps-cust-done">Done</button></div></section>';
  const artEl = root.querySelector('.ps-cust-art');
  const slotsEl = root.querySelector('.ps-cust-slots');
  const hintEl = root.querySelector('.ps-cust-hint');
  const paintsEl = root.querySelector('.ps-cust-paints');
  const trayEl = root.querySelector('.ps-cust-stickers');
  const section = root.firstElementChild;

  const emit = () => onChange?.({
    paint: emitAsId ? (paintByColor(color)?.id ?? color) : color,
    stickers: placed.map(item => ({ ...item })),
  });

  function renderShip() {
    let html = '';
    try {
      html = shipSVG(classId, { built: 'all', paint: color });
    } catch {
      return;
    }
    const marks = placed.map(entry => {
      const slot = slots[entry.slot];
      const body = art[entry.id];
      if (!slot || !body) return '';
      const fresh = entry.slot === lastSlot ? ' ps-cust-mark-new' : '';
      return `<g class="ps-cust-mark${fresh}"><g transform="translate(${slot.x - slot.s / 2} ${slot.y - slot.s / 2}) scale(${slot.s / 60})">${body}</g></g>`;
    }).join('');
    artEl.innerHTML = html.replace(/<\/svg>\s*$/, `${marks}</svg>`);
  }

  function renderSlots() {
    const [vw, vh] = (shipData(classId).viewBox ?? '0 0 300 420').split(' ').slice(2).map(Number);
    slotsEl.classList.toggle('is-armed', Boolean(pickSticker));
    slotsEl.innerHTML = slots.map((slot, index) => {
      const entry = placed.find(item => item.slot === index);
      const state = entry ? `${stickerName(entry.id)} sticker. Tap to ${pickSticker ? 'swap it' : 'remove it'}` : 'empty';
      const cls = `ps-cust-slot${entry ? ' is-filled' : ''}${pickSlot === index ? ' is-picked' : ''}`;
      return `<button type="button" class="${cls}" data-slot="${index}" aria-pressed="${pickSlot === index}" aria-label="Spot ${index + 1}, ${state}" ` +
        `style="left:${r1((slot.x / vw) * 100)}%;top:${r1((slot.y / vh) * 100)}%;--sw:${r1((slot.s / vw) * 100)}"></button>`;
    }).join('');
  }

  function renderPaints() {
    paintsEl.innerHTML = PAINTS.map(item => {
      if (!paintOpen.has(item.id)) {
        const why = lockHint('paint', item.id);
        return `<button type="button" class="ps-cust-swatch is-locked${why.startsWith('Schematic in cargo') ? ' is-cargo' : ''}" aria-disabled="true" data-locked="${item.name} paint. ${why}" aria-label="${item.name} paint, locked. ${why}" title="${why}">${LOCK}</button>`;
      }
      const on = item.color.toLowerCase() === color.toLowerCase();
      return `<button type="button" class="ps-cust-swatch${on ? ' is-on' : ''}" data-paint="${item.id}" aria-pressed="${on}" aria-label="${item.name} paint" style="--c:${item.color}">${on ? TICK : ''}</button>`;
    }).join('');
  }

  function renderTray() {
    trayEl.innerHTML = STICKERS.map(id => {
      if (!stickerOpen.has(id)) {
        const why = lockHint('sticker', id);
        return `<button type="button" class="ps-cust-stk is-locked${why.startsWith('Schematic in cargo') ? ' is-cargo' : ''}" aria-disabled="true" data-locked="${stickerName(id)} sticker. ${why}" aria-label="${stickerName(id)} sticker, locked. ${why}" title="${why}">${stickerSVG(id, 38)}${LOCK}</button>`;
      }
      const on = pickSticker === id;
      return `<button type="button" class="ps-cust-stk${on ? ' is-on' : ''}" data-sticker="${id}" aria-pressed="${on}" aria-label="${stickerName(id)} sticker">${stickerSVG(id, 38)}</button>`;
    }).join('');
  }

  function renderHint(text) {
    if (text) hintEl.textContent = text;
    else if (pickSticker) hintEl.textContent = 'Now tap a dashed spot on your ship.';
    else if (pickSlot !== null) hintEl.textContent = 'Now pick a sticker below.';
    else hintEl.textContent = 'Pick a sticker, then tap a dashed spot.';
  }

  function refresh(text) {
    renderShip();
    renderSlots();
    renderTray();
    renderHint(text);
  }

  function place(slot, id) {
    placed = placed.filter(item => item.slot !== slot);
    placed.push({ slot, id });
    placed.sort((a, b) => a.slot - b.slot);
    pickSticker = null;
    pickSlot = null;
    lastSlot = slot;
    refresh('Nice! Tap a sticker on the ship to take it off.');
    emit();
  }

  function onSlot(slot) {
    const filled = placed.some(item => item.slot === slot);
    if (pickSticker) {
      place(slot, pickSticker);
    } else if (filled) {
      placed = placed.filter(item => item.slot !== slot);
      pickSlot = null;
      lastSlot = null;
      refresh('Sticker removed.');
      emit();
    } else {
      pickSlot = pickSlot === slot ? null : slot;
      renderSlots();
      renderHint();
    }
  }

  function onSticker(id) {
    if (pickSlot !== null) {
      place(pickSlot, id);
    } else {
      pickSticker = pickSticker === id ? null : id;
      renderTray();
      renderSlots();
      renderHint();
    }
  }

  section.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const slotBtn = target.closest('[data-slot]');
    const stickerBtn = target.closest('[data-sticker]');
    const paintBtn = target.closest('[data-paint]');
    const lockedBtn = target.closest('[data-locked]');
    if (lockedBtn) renderHint(lockedBtn.dataset.locked);
    else if (slotBtn) onSlot(Number(slotBtn.dataset.slot));
    else if (stickerBtn) onSticker(stickerBtn.dataset.sticker);
    else if (paintBtn) {
      color = paintById(paintBtn.dataset.paint).color;
      artEl.querySelector('svg')?.style.setProperty('--paint', color);
      renderPaints();
      emit();
    } else if (target.closest('.ps-cust-done')) onDone?.();
  });

  function start() {
    if (destroyed) return;
    slots = shipData(classId).stickerSlots ?? [];
    placed = placed.filter(item => slots[item.slot]);
    renderPaints();
    refresh();
  }

  try {
    shipData(classId);
    start();
  } catch {
    renderPaints();
    renderTray();
    renderHint();
    loadShip(classId).then(start, () => {});
  }

  return {
    destroy() {
      destroyed = true;
      if (root.firstElementChild === section) root.innerHTML = '';
    },
  };
}
