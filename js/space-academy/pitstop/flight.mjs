// Pit Stop flight: the child steers the ship (thumb stick / arrows / WASD) to the next sky object.
// No timers, lives or fail states: asteroids only bounce the ship.
import { CLASSES } from './data.mjs';
import { play } from './audio.mjs';
import { loadShip, shipSVG } from './ships/index.mjs';
import { mountRoam } from './roam.mjs';
import { mountUniverse, WORLD } from './universe.mjs';
import {
  AIM_AFTER_MS, FLOAT_REACH, GRAVITY_SPEED, SPRINT_BOOST, SWEEP_STEP, TAP_HIT_SLOP, TAP_MS, TAP_SLOP,
  aimVector, dragVector, roamTopSpeed, sweepSteps,
} from './steer.mjs';

const ORANGE = '#ff6a28';
const HOLD_SECONDS = 0.6;
const ARRIVE_DELAY = 700;
const HINT_MS = 5000;
const STICK = 130;
const KNOB = 56;
const TILE_FAR = 256;
const TILE_NEAR = 320;
const AUTO_MAX_S = 45;

// Per-class flight feel: top speed (px/s), inertia (seconds to reach speed; lower = more agile), bounce strength.
const FEEL = {
  pp1: { speed: 150, tau: 0.45, bounce: 0.9 },
  pp2: { speed: 200, tau: 0.32, bounce: 1 },
  'class-1': { speed: 230, tau: 0.28, bounce: 1 },
  'class-2': { speed: 270, tau: 0.24, bounce: 1 },
  'class-3': { speed: 300, tau: 0.12, bounce: 1.1 },
  'class-4': { speed: 360, tau: 0.2, bounce: 1 },
  'class-5': { speed: 330, tau: 0.5, bounce: 0.6 },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function seeded(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function prettify(id) {
  return String(id || 'the next object').replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
}

function el(tag, className, parent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (parent) parent.appendChild(node);
  return node;
}

function rockSVG(rng, size) {
  const pts = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 38 + rng() * 11;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`);
  }
  const fills = ['#d9d6cf', '#efe6d2', '#b9a98f', '#c9c4ba'];
  const fill = fills[Math.floor(rng() * fills.length)];
  const crater = (cx, cy, r) => `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.7}" fill="#8a8780" fill-opacity=".45" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>`;
  const craters = crater(36 + rng() * 8, 38 + rng() * 8, 8 + rng() * 4) + crater(58 + rng() * 8, 56 + rng() * 8, 6 + rng() * 4);
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" focusable="false">` +
    `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>` +
    `${craters}<path d="M24 66 Q32 80 46 84 M66 22 Q76 28 80 38" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round" opacity=".7"/></svg>`;
}

function fallbackShip() {
  return '<svg class="ps-ship" viewBox="0 0 300 420" aria-hidden="true" focusable="false"><g class="ps-flame"><path d="M130 330 Q150 420 170 330 Z" fill="#f5b82e" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/></g>' +
    '<path d="M150 40 Q205 130 205 300 L95 300 Q95 130 150 40 Z" fill="var(--paint,#fffdf8)" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="150" cy="150" r="26" fill="#d3e6fb" stroke="#2b2b2b" stroke-width="3"/></svg>';
}

function chevronSVG() {
  return `<svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true" focusable="false">` +
    `<path d="M14 7 L31 22 L14 37" fill="none" stroke="#2b2b2b" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M14 7 L31 22 L14 37" fill="none" stroke="${ORANGE}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function ringSVG(R) {
  const size = R * 2 + 12;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true" focusable="false">` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${R}" fill="${ORANGE}" fill-opacity=".1"/>` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${R}" fill="none" stroke="${ORANGE}" stroke-width="5" stroke-dasharray="14 11" stroke-linecap="round"/></svg>`;
}

export function mountFlight(root, opts = {}) {
  const {
    classId, objectId, paint = null, stickers = [], stickerArt = null, reducedMotion = false, onArrive, onExit,
    mode = 'fly', loadout = { turrets: [], shield: null }, getReward = () => null, takeReward = () => null,
  } = opts;
  const roamMode = mode === 'roam';
  const feel = FEEL[classId] || FEEL['class-1'];
  const classIndex = Math.max(0, CLASSES.findIndex(c => c.id === classId));
  const rm = !!reducedMotion;

  const prevPosition = root.style.position;
  if (getComputedStyle(root).position === 'static') root.style.position = 'relative';

  let destroyed = false;
  let raf = 0;
  let hintTimer = 0;
  let arriveTimer = 0;
  let arrived = false;
  let arrivedAt = 0;

  // ---------- DOM ----------
  const stage = el('div', `ps-flight${rm ? ' is-reduced' : ''}${roamMode ? ' is-roam' : ''}`);
  stage.setAttribute('role', 'application');
  stage.tabIndex = 0;
  let targetName = prettify(objectId);
  const setLabel = () => stage.setAttribute('aria-label', roamMode
    ? 'Free roam. Touch and drag anywhere to steer, or use the on-screen stick, the arrow keys or W A S D. Tap a space object, or press E, to hear about it. Your turrets fire on their own.'
    : `Flight game. Steer your ship to ${targetName}. Touch and drag anywhere, or use the on-screen stick, the arrow keys or W A S D.`);
  setLabel();

  const starsFar = el('div', 'ps-flight-stars ps-flight-stars-far', stage);
  const starsNear = el('div', 'ps-flight-stars ps-flight-stars-near', stage);
  const world = el('div', 'ps-flight-world', stage);
  const targetEl = el('div', 'ps-flight-target', world);

  const vw0 = root.clientWidth || 390;
  const vh0 = root.clientHeight || 700;
  const small = Math.min(vw0, vh0) < 600;
  const shipW = small ? 70 : 90;
  const shipH = shipW * 1.4;
  const shipR = shipW * 0.34;
  const R = Math.round(shipW * 0.9);

  const ringGrow = el('div', 'ps-flight-ringgrow', targetEl);
  const ringPulse = el('div', 'ps-flight-ring', ringGrow);
  ringPulse.innerHTML = ringSVG(R);
  const objectEl = el('div', 'ps-flight-object', targetEl);
  const objSize = Math.round(R * 1.05);
  objectEl.style.cssText = `width:${objSize}px;height:${objSize}px;margin:${-objSize / 2}px 0 0 ${-objSize / 2}px`;
  const ringSize = R * 2 + 12;
  ringGrow.style.cssText = `width:${ringSize}px;height:${ringSize}px;margin:${-ringSize / 2}px 0 0 ${-ringSize / 2}px`;
  const placeholder = size => `<svg viewBox="0 0 60 60" width="${size}" height="${size}" aria-hidden="true" focusable="false"><circle cx="30" cy="30" r="22" fill="#fde9a8" stroke="#2b2b2b" stroke-width="3"/></svg>`;
  const drawObject = art => {
    objectEl.innerHTML = `<svg viewBox="0 0 60 60" width="${objSize}" height="${objSize}" aria-hidden="true" focusable="false">${art}</svg>`;
  };
  objectEl.innerHTML = placeholder(objSize);
  import('./sky.mjs').then(mod => {
    const entry = mod.SKY && mod.SKY[objectId];
    if (destroyed || !entry) return;
    drawObject(entry.svg);
    targetName = entry.name || targetName;
    setLabel();
    if (!roamMode) live.textContent = `Fly to ${targetName}. Steer into the glowing ring.`;
  }).catch(() => {});

  const rocks = [];
  const rockLayer = el('div', 'ps-flight-rocks', world);

  const shipEl = el('div', 'ps-flight-ship', world);
  shipEl.style.cssText = `width:${shipW}px;height:${shipH}px;left:${-shipW / 2}px;top:${-shipH / 2}px`;
  let thrL = null;
  let thrR = null;
  const SIDE_FLAME = side => `<svg viewBox="0 0 44 30" width="100%" height="100%" aria-hidden="true" focusable="false" style="transform:scaleX(${side === 'l' ? -1 : 1})"><path class="ps-thr-out" d="M2 15 C12 3 30 6 42 15 C30 24 12 27 2 15 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/><path class="ps-thr-in" d="M2 15 C10 9 20 10 27 15 C20 20 10 21 2 15 Z" fill="#fff" stroke="#2b2b2b" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const addThrusters = () => {
    thrL = el('div', 'ps-thruster ps-thruster--l', shipEl);
    thrR = el('div', 'ps-thruster ps-thruster--r', shipEl);
    thrL.innerHTML = SIDE_FLAME('l');
    thrR.innerHTML = SIDE_FLAME('r');
  };
  const setShip = () => {
    try {
      shipEl.innerHTML = shipSVG(classId, { built: 'all', paint, stickers, stickerArt, flame: true });
    } catch {
      shipEl.innerHTML = fallbackShip();
      loadShip(classId).then(() => {
        if (destroyed) return;
        shipEl.innerHTML = shipSVG(classId, { built: 'all', paint, stickers, stickerArt, flame: true });
        addThrusters();
      }).catch(() => {});
    }
    addThrusters();
  };
  setShip();

  const arrow = el('div', 'ps-flight-arrow', stage);
  const arrowInner = el('div', 'ps-flight-arrow-in', arrow);
  arrowInner.innerHTML = chevronSVG();

  const hint = el('div', 'ps-flight-hint', stage);
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = roamMode ? 'Touch and drag anywhere to fly. Tap a planet to learn about it.' : 'Steer into the glowing ring';

  const exitBtn = el('button', 'ps-flight-exit', stage);
  exitBtn.type = 'button';
  exitBtn.setAttribute('aria-label', 'Back');
  exitBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M15 5 L8 12 L15 19" fill="none" stroke="#2b2b2b" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let askBtn = null;
  let boostBtn = null;
  if (roamMode) {
    askBtn = el('button', 'ps-flight-ask', stage);
    askBtn.type = 'button';
    askBtn.setAttribute('aria-label', 'What is this? Tells you about the nearest space object. Shortcut: E');
    askBtn.innerHTML = '<span aria-hidden="true">?</span>';
    boostBtn = el('button', 'ps-flight-boost', stage);
    boostBtn.type = 'button';
    boostBtn.setAttribute('aria-label', 'Boost. Hold to fly faster. Shortcut: Shift or Space');
    boostBtn.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false"><path d="M13 2 5 13.5h5.5L9.5 22 19 9.5h-5.8Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="2" stroke-linejoin="round"/></svg>';
  }

  const live = el('div', 'ps-flight-live', stage);
  live.setAttribute('aria-live', 'polite');
  live.textContent = roamMode ? '' : `Fly to ${targetName}. Steer into the glowing ring.`;

  const stick = el('div', 'ps-flight-stick', stage);
  stick.innerHTML = '<i class="ps-flight-stick-mark is-up"></i><i class="ps-flight-stick-mark is-down"></i><i class="ps-flight-stick-mark is-left"></i><i class="ps-flight-stick-mark is-right"></i>';
  const knob = el('div', 'ps-flight-knob', stick);
  stick.style.width = stick.style.height = `${STICK}px`;
  knob.style.cssText = `width:${KNOB}px;height:${KNOB}px;margin:${-KNOB / 2}px 0 0 ${-KNOB / 2}px`;

  // Floating stick: appears under any finger that drags on the open stage.
  const floatEl = el('div', 'ps-flight-float', stage);
  const floatKnob = el('div', 'ps-flight-float-knob', floatEl);
  floatEl.hidden = true;

  const burst = el('div', 'ps-flight-burst', targetEl);

  root.appendChild(stage);
  try { stage.focus({ preventScroll: true }); } catch { /* focus is a nicety */ }

  // ---------- world ----------
  let vw = vw0;
  let vh = vh0;
  const W = roamMode ? WORLD : Math.max(Math.round(vw0 * 1.6), 900);
  const H = roamMode ? WORLD : Math.max(Math.round(vh0 * 2), 1300);
  const rng = seeded(roamMode ? `${classId}|roam|${Math.random()}` : `${classId}|${objectId}`);

  const ship = { x: W * (0.35 + rng() * 0.3), y: H - Math.max(130, vh0 * 0.3), vx: 0, vy: 0, heading: 0 };
  const topSpeed = roamMode ? roamTopSpeed(feel.speed) : feel.speed;
  const gravitySpeed = feel.speed * (roamMode ? GRAVITY_SPEED : 1);
  let boosting = false;
  let auto = null;
  const dist = Math.min(H * 0.78, feel.speed * 8) * (rm ? 0.5 : 1);
  // Free roam has no goal ring: the waypoint chevron follows the nearest wormhole instead.
  let tx = roamMode ? -1e5 : clamp(ship.x + (rng() < 0.5 ? -1 : 1) * (W * (0.12 + rng() * 0.18)), R + 60, W - R - 60);
  let ty = roamMode ? -1e5 : Math.max(R + 80, ship.y - Math.sqrt(Math.max(0, dist * dist - (tx - ship.x) ** 2)));
  targetEl.style.transform = `translate3d(${tx}px,${ty}px,0)`;
  if (roamMode) { targetEl.hidden = true; ship.y = H * 0.7; }

  const rockCount = roamMode ? 0 : clamp(4 + Math.round(classIndex * 5 / 6), 4, 9);
  const placed = [];
  for (let i = 0; i < rockCount; i++) {
    const r = 20 + rng() * 22;
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 60; tries++) {
      x = 60 + rng() * (W - 120);
      y = 60 + rng() * (H - 120);
      const farShip = Math.hypot(x - ship.x, y - ship.y) > r + shipR + 150;
      const farTarget = Math.hypot(x - tx, y - ty) > R + r + 70;
      const farRocks = placed.every(p => Math.hypot(x - p.x, y - p.y) > r + p.r + 40);
      if (farShip && farTarget && farRocks) break;
    }
    const ang = rng() * Math.PI * 2;
    const sp = 8 + rng() * 20;
    const node = el('div', 'ps-flight-rock', rockLayer);
    node.style.cssText = `width:${r * 2}px;height:${r * 2}px;left:${-r}px;top:${-r}px`;
    node.innerHTML = rockSVG(rng, r * 2);
    const rock = { x, y, r, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, rot: rng() * 360, vr: (rng() - 0.5) * 30, node };
    placed.push(rock);
    rocks.push(rock);
  }

  let shake = 0;
  // Fly there: the ship steers itself toward a tapped object, and any touch or key takes the wheel back.
  const startAuto = body => {
    const stop = body.kind === 'worm' ? 0 : body.kind === 'belt' ? body.r * 0.4 : body.r + shipR + 150;
    auto = { x: body.x, y: body.y, stop, body, t: 0 };
    roam?.say(`Flying to ${body.name}. Touch the screen to steer yourself.`, 2600);
  };
  const roam = roamMode ? mountRoam({
    stage, world, shipEl, ship, shipW, shipH, shipR, W, H, rng, rm, classIndex, stickerArt, live,
    loadout, getReward, takeReward, kick: amount => { if (!rm) shake = Math.max(shake, amount); },
    onFly: startAuto,
  }) : null;
  const uni = roamMode ? mountUniverse({
    stage, world, ship, shipR, speed: gravitySpeed, rm,
    say: (text, ms) => roam.say(text, ms),
    intro: body => roam.card(body),
    kick: amount => { if (!rm) shake = Math.max(shake, amount); },
    onWarp: () => { cam = centerCam(); auto = null; roam.reset(); },
    onMine: (x, y) => roam.mine(x, y),
    onDiscover: body => roam.discover(body),
  }) : null;
  if (uni && /[?&]test=1/.test(location.search)) window.__roam = { ship, uni, roam, tap: (x, y) => tapAt(x, y), flight: () => ({ topSpeed, boosting, auto, free }) };

  // ---------- input ----------
  const keys = { left: false, right: false, up: false, down: false };
  const pad = { x: 0, y: 0, id: null };
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  };
  const typing = t => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  const onKeyDown = e => {
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
    if (roamMode) {
      const onButton = e.target?.tagName === 'BUTTON';
      if (e.code === 'KeyE' || (e.code === 'Enter' && !onButton)) {
        if (!e.repeat) askNearest();
        e.preventDefault();
        return;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || (e.code === 'Space' && !onButton)) {
        boosting = true;
        e.preventDefault();
        return;
      }
    }
    const k = KEYMAP[e.code];
    if (!k) return;
    keys[k] = true;
    e.preventDefault();
  };
  const onKeyUp = e => {
    const k = KEYMAP[e.code];
    if (k) keys[k] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') boosting = !!boostBtn?.classList.contains('is-down');
  };
  const clearKeys = () => {
    keys.left = keys.right = keys.up = keys.down = false;
    boosting = false;
    boostBtn?.classList.remove('is-down');
  };

  const reach = (STICK - KNOB) / 2 + 10;
  const stickMove = e => {
    const rect = stick.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > reach) { dx = dx / len * reach; dy = dy / len * reach; }
    knob.style.transform = `translate3d(${dx}px,${dy}px,0)`;
    const m = Math.hypot(dx, dy) / reach;
    if (m < 0.12) { pad.x = 0; pad.y = 0; } else { pad.x = dx / reach; pad.y = dy / reach; }
  };
  const stickEnd = () => {
    pad.id = null;
    pad.x = pad.y = 0;
    knob.style.transform = 'translate3d(0,0,0)';
    stick.classList.remove('is-active');
  };
  const onPadDown = e => {
    if (pad.id !== null) return;
    pad.id = e.pointerId;
    try { stick.setPointerCapture(e.pointerId); } catch { /* synthetic pointers */ }
    stick.classList.add('is-active');
    stickMove(e);
    e.preventDefault();
  };
  const onPadMove = e => { if (e.pointerId === pad.id) stickMove(e); };
  const onPadUp = e => { if (e.pointerId === pad.id) stickEnd(); };
  const exitClick = () => { if (typeof onExit === 'function') onExit(); };

  // ---------- steer anywhere: floating stick, hold-to-aim and tap-for-info on the open stage ----------
  const free = { id: null, ox: 0, oy: 0, x: 0, y: 0, t0: 0, mode: 'tap', moved: false };
  const stagePoint = e => {
    const r = stage.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * ((stage.clientWidth || r.width) / (r.width || 1)),
      y: (e.clientY - r.top) * ((stage.clientHeight || r.height) / (r.height || 1)),
    };
  };
  const showFloat = () => {
    const live2 = free.id !== null && free.mode !== 'tap';
    floatEl.hidden = !live2;
    if (!live2) return;
    const aim = free.mode === 'aim';
    floatEl.classList.toggle('is-aim', aim);
    floatEl.style.transform = `translate3d(${aim ? free.x : free.ox}px,${aim ? free.y : free.oy}px,0)`;
    let kx = 0;
    let ky = 0;
    if (!aim) {
      kx = free.x - free.ox;
      ky = free.y - free.oy;
      const len = Math.hypot(kx, ky);
      if (len > FLOAT_REACH) { kx = kx / len * FLOAT_REACH; ky = ky / len * FLOAT_REACH; }
    }
    floatKnob.style.transform = `translate3d(${kx}px,${ky}px,0)`;
  };
  const freeEnd = () => {
    free.id = null;
    free.mode = 'tap';
    free.moved = false;
    showFloat();
  };
  const freeVec = () => {
    if (free.id === null) return { x: 0, y: 0 };
    if (free.mode === 'tap' && !free.moved && performance.now() - free.t0 > AIM_AFTER_MS) { free.mode = 'aim'; showFloat(); }
    if (free.mode === 'drag') return dragVector(free.x - free.ox, free.y - free.oy);
    if (free.mode === 'aim') return aimVector(free.x - (ship.x - cam.x), free.y - (ship.y - cam.y));
    return { x: 0, y: 0 };
  };
  const NOT_STAGE = 'button, a, input, select, textarea, .ps-flight-stick, .ps-roam-card';
  const onStageDown = e => {
    if (free.id !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (e.target?.closest?.(NOT_STAGE)) return;
    const p = stagePoint(e);
    Object.assign(free, { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y, t0: performance.now(), mode: 'tap', moved: false });
    auto = null;
    try { stage.setPointerCapture(e.pointerId); } catch { /* synthetic pointers */ }
    try { stage.focus({ preventScroll: true }); } catch { /* focus is a nicety */ }
  };
  const onStageMove = e => {
    if (e.pointerId !== free.id) return;
    const p = stagePoint(e);
    free.x = p.x;
    free.y = p.y;
    if (!free.moved && Math.hypot(p.x - free.ox, p.y - free.oy) > TAP_SLOP) {
      free.moved = true;
      if (free.mode === 'tap') free.mode = 'drag';
    }
    showFloat();
  };
  const onStageUp = e => {
    if (e.pointerId !== free.id) return;
    const p = stagePoint(e);
    const wasTap = e.type === 'pointerup' && !free.moved && performance.now() - free.t0 < TAP_MS;
    freeEnd();
    if (wasTap) tapAt(p.x, p.y);
  };
  const onStageLost = e => { if (e.pointerId === free.id) freeEnd(); };

  // A tap on a space object shows its name and fact again, every time, however it was first discovered.
  function tapAt(sx, sy) {
    if (!uni || arrived) return false;
    const body = uni.pickBody(sx + cam.x, sy + cam.y, TAP_HIT_SLOP);
    if (!body) return false;
    uni.ping(body);
    play('tap');
    roam.card(body);
    return true;
  }
  function askNearest() {
    if (!uni || arrived) return;
    const body = uni.nearestBody(ship.x, ship.y, 1500);
    if (body) {
      uni.ping(body);
      play('tap');
      roam.card(body);
    } else roam.say(uni.sectorIntro(), 5000);
  }

  const boostOn = e => {
    boosting = true;
    boostBtn.classList.add('is-down');
    try { boostBtn.setPointerCapture(e.pointerId); } catch { /* synthetic pointers */ }
    e.preventDefault();
  };
  const boostOff = () => {
    boostBtn.classList.remove('is-down');
    boosting = false;
  };
  const noMenu = e => e.preventDefault();

  stick.addEventListener('pointerdown', onPadDown);
  stick.addEventListener('pointermove', onPadMove);
  stick.addEventListener('pointerup', onPadUp);
  stick.addEventListener('pointercancel', onPadUp);
  stick.addEventListener('lostpointercapture', onPadUp);
  exitBtn.addEventListener('click', exitClick);
  stage.addEventListener('pointerdown', onStageDown);
  stage.addEventListener('pointermove', onStageMove);
  stage.addEventListener('pointerup', onStageUp);
  stage.addEventListener('pointercancel', onStageUp);
  stage.addEventListener('lostpointercapture', onStageLost);
  stage.addEventListener('contextmenu', noMenu);
  askBtn?.addEventListener('click', askNearest);
  if (boostBtn) {
    boostBtn.addEventListener('pointerdown', boostOn);
    boostBtn.addEventListener('pointerup', boostOff);
    boostBtn.addEventListener('pointercancel', boostOff);
    boostBtn.addEventListener('lostpointercapture', boostOff);
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', clearKeys);

  let ro = null;
  const measure = () => {
    vw = stage.clientWidth || vw;
    vh = stage.clientHeight || vh;
  };
  if (typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(measure);
    ro.observe(stage);
  }

  hintTimer = setTimeout(() => hint.classList.add('is-gone'), HINT_MS);

  // ---------- loop ----------
  let cam = { x: 0, y: 0 };
  const centerCam = () => ({
    x: W <= vw ? (W - vw) / 2 : clamp(ship.x - vw / 2, 0, W - vw),
    y: H <= vh ? (H - vh) / 2 : clamp(ship.y - vh / 2, 0, H - vh),
  });
  cam = centerCam();

  let tilt = 0;
  let wobble = 0;
  let wobblePhase = 0;
  let wobbleCool = 0;
  let hold = 0;
  let thrusting = false;
  let arrowShown = false;
  let wpShown = false;
  let last = 0;
  let clock = 0;

  const burstOut = () => {
    burst.innerHTML = '<b class="ps-flight-burst-ring"></b>' + Array.from({ length: 12 }, (_, i) =>
      `<i class="ps-flight-spark" style="--a:${i * 30}deg;--d:${Math.round(R * (1.3 + (i % 3) * 0.28))}px"></i>`).join('');
  };

  const arrive = () => {
    arrived = true;
    arrivedAt = clock;
    stage.classList.add('is-arrived');
    ringGrow.style.transform = '';
    burstOut();
    live.textContent = `You reached ${targetName}!`;
    arriveTimer = setTimeout(() => {
      if (!destroyed && typeof onArrive === 'function') onArrive();
    }, ARRIVE_DELAY);
  };

  const frame = now => {
    raf = 0;
    if (destroyed || document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    clock += dt;

    let ix = pad.x + (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let iy = pad.y + (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    const fv = freeVec();
    ix += fv.x;
    iy += fv.y;
    let il = Math.hypot(ix, iy);
    if (il > 1) { ix /= il; iy /= il; il = 1; }
    if (arrived || uni?.locked) { ix = iy = il = 0; }
    if (auto) {
      const adx = auto.x - ship.x;
      const ady = auto.y - ship.y;
      const ad = Math.hypot(adx, ady) || 1;
      auto.t += dt;
      if (il > 0.1 || ad <= auto.stop || auto.t > AUTO_MAX_S || uni?.locked) auto = null;
      else {
        il = clamp((ad - auto.stop) / (topSpeed * 0.4), 0.2, 1);
        ix = adx / ad * il;
        iy = ady / ad * il;
      }
    }
    if (boosting && roamMode && il < 0.1 && !arrived && !uni?.locked) {
      ix = Math.sin(ship.heading);
      iy = -Math.cos(ship.heading);
      il = 1;
    }
    const cruise = topSpeed * (boosting && roamMode ? SPRINT_BOOST : 1);

    let dx = tx - ship.x;
    let dy = ty - ship.y;
    const d = Math.hypot(dx, dy);
    let desVX = ix * cruise;
    let desVY = iy * cruise;
    if (uni) {
      const g = uni.pull();
      desVX += g.x;
      desVY += g.y;
    }

    // Gentle gravity well around the ring so a fast ship can still settle inside it.
    if (!arrived && !roamMode && d < R * 1.5) {
      const k = clamp((d - R * 0.5) / R, 0, 1);
      const scale = 0.45 + 0.55 * k;
      const pull = 70 * (1 - d / (R * 1.5));
      desVX = desVX * scale + (dx / (d || 1)) * pull;
      desVY = desVY * scale + (dy / (d || 1)) * pull;
    }
    if (arrived) {
      const hx = tx;
      const hy = ty + R * 0.7;
      desVX = clamp((hx - ship.x) * 4, -180, 180);
      desVY = clamp((hy - ship.y) * 4, -180, 180);
    }

    const blend = 1 - Math.exp(-dt / feel.tau);
    ship.vx += (desVX - ship.vx) * blend;
    ship.vy += (desVY - ship.vy) * blend;
    const prevX = ship.x;
    const prevY = ship.y;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    const margin = shipR + 6;
    if (ship.x < margin) { ship.x = margin; ship.vx = Math.abs(ship.vx) * 0.3; }
    if (ship.x > W - margin) { ship.x = W - margin; ship.vx = -Math.abs(ship.vx) * 0.3; }
    if (ship.y < (roamMode ? Math.max(margin, 190) : margin)) { ship.y = roamMode ? Math.max(margin, 190) : margin; ship.vy = Math.abs(ship.vy) * 0.3; }
    if (ship.y > H - margin) { ship.y = H - margin; ship.vy = -Math.abs(ship.vy) * 0.3; }

    // A fast ship covers many pixels per frame: walk the path in short steps so it cannot skip over a body, hole or wormhole.
    if (uni && !uni.locked) {
      const run = Math.hypot(ship.x - prevX, ship.y - prevY);
      if (run > SWEEP_STEP) {
        const endX = ship.x;
        const endY = ship.y;
        const steps = sweepSteps(run);
        let stopped = false;
        for (let i = 1; i < steps && !stopped; i++) {
          ship.x = prevX + (endX - prevX) * i / steps;
          ship.y = prevY + (endY - prevY) * i / steps;
          stopped = uni.probe();
        }
        if (!stopped) { ship.x = endX; ship.y = endY; }
      }
    }

    // Asteroids drift and softly bounce the ship; nothing is ever damaged.
    wobbleCool -= dt;
    for (const a of rocks) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rot += a.vr * dt;
      if (a.x < a.r + 20) { a.x = a.r + 20; a.vx = Math.abs(a.vx); }
      if (a.x > W - a.r - 20) { a.x = W - a.r - 20; a.vx = -Math.abs(a.vx); }
      if (a.y < a.r + 20) { a.y = a.r + 20; a.vy = Math.abs(a.vy); }
      if (a.y > H - a.r - 20) { a.y = H - a.r - 20; a.vy = -Math.abs(a.vy); }
      const tdx = a.x - tx;
      const tdy = a.y - ty;
      const td = Math.hypot(tdx, tdy);
      if (td < R + a.r + 12) {
        const push = Math.abs(a.vx) + Math.abs(a.vy) + 10;
        a.vx = (tdx / (td || 1)) * push * 0.7;
        a.vy = (tdy / (td || 1)) * push * 0.7;
      }
      const ax = ship.x - a.x;
      const ay = ship.y - a.y;
      const ad = Math.hypot(ax, ay);
      const min = a.r * 0.88 + shipR;
      if (ad < min && !arrived) {
        const nx = ax / (ad || 1);
        const ny = ad ? ay / ad : -1;
        ship.x += nx * (min - ad);
        ship.y += ny * (min - ad);
        const vn = ship.vx * nx + ship.vy * ny;
        const kick = 150 * feel.bounce;
        if (vn < kick) {
          ship.vx += nx * (kick - vn);
          ship.vy += ny * (kick - vn);
        }
        a.vx = clamp(a.vx - nx * 25, -55, 55);
        a.vy = clamp(a.vy - ny * 25, -55, 55);
        if (wobbleCool <= 0) {
          wobbleCool = 0.35;
          if (!rm) { wobble = 0.3 * (feel.bounce > 1 ? 1.1 : 1); wobblePhase = 0; shake = 5; }
        }
      }
    }

    if (!arrived && !roamMode) {
      if (d < R) hold += dt; else hold = Math.max(0, hold - dt * 1.5);
      const p = clamp(hold / HOLD_SECONDS, 0, 1);
      ringGrow.style.transform = p > 0 ? `scale(${(1 + p * 0.16).toFixed(3)})` : '';
      if (hold >= HOLD_SECONDS) arrive();
    }
    roam?.update(dt, clock);
    if (roamMode) {
      const speedNow = Math.hypot(ship.vx, ship.vy);
      const want = il > 0.1 ? Math.atan2(ix, -iy) : speedNow > 50 ? Math.atan2(ship.vx, -ship.vy) : ship.heading;
      let diff = want - ship.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      ship.heading += clamp(diff, -7 * dt, 7 * dt);
    }
    uni?.update(dt, cam, clock);
    if (uni) {
      const wp = uni.locked ? null : uni.waypoint();
      if (wp) { tx = wp.x; ty = wp.y; }
      wpShown = Boolean(wp);
    }

    // camera
    const want = centerCam();
    const follow = 1 - Math.exp(-dt * (roamMode ? 10 : 6));
    cam.x += (want.x - cam.x) * follow;
    cam.y += (want.y - cam.y) * follow;
    let sx = 0;
    let sy = 0;
    if (shake > 0.05) {
      shake *= Math.exp(-dt * 9);
      sx = Math.sin(clock * 90) * shake;
      sy = Math.cos(clock * 77) * shake;
    }
    const cx = cam.x - sx;
    const cy = cam.y - sy;
    world.style.transform = `translate3d(${-cx}px,${-cy}px,0)`;
    starsFar.style.transform = `translate3d(${-((cam.x * 0.2) % TILE_FAR)}px,${-((cam.y * 0.2) % TILE_FAR)}px,0)`;
    starsNear.style.transform = `translate3d(${-((cam.x * 0.55) % TILE_NEAR)}px,${-((cam.y * 0.55) % TILE_NEAR)}px,0)`;

    // ship sprite
    let rot = 0;
    let sxs = 1;
    let sys = 1;
    if (!rm) {
      tilt += (clamp(ship.vx / feel.speed, -1, 1) * 14 - tilt) * (1 - Math.exp(-dt * 8));
      rot = roamMode ? ship.heading * 180 / Math.PI : tilt;
      if (wobble > 0.005) {
        wobblePhase += dt * 24;
        const w = Math.sin(wobblePhase) * wobble;
        sxs = 1 + w;
        sys = 1 - w * 0.8;
        wobble *= Math.exp(-dt * 5);
      }
    }
    const celebrate = arrived ? Math.max(0.8, 1 - (clock - arrivedAt) * 0.5) : 1;
    shipEl.style.transform = `translate3d(${ship.x}px,${ship.y}px,0) rotate(${rot.toFixed(2)}deg) scale(${(sxs * celebrate).toFixed(3)},${(sys * celebrate).toFixed(3)})`;
    const thrust = !arrived && il > 0.1;
    if (thrust !== thrusting) { thrusting = thrust; shipEl.classList.toggle('is-thrust', thrust); }
    // Side thrusters: steering left fires the right nozzle and vice versa, with a puff of sound.
    const lean = arrived || roamMode ? 0 : clamp(ship.vx / feel.speed, -1, 1);
    const fireR = lean < -0.12;
    const fireL = lean > 0.12;
    if (thrR && thrL) {
      if (fireR !== thrR.classList.contains('is-on') || fireL !== thrL.classList.contains('is-on')) {
        if ((fireR && !thrR.classList.contains('is-on')) || (fireL && !thrL.classList.contains('is-on'))) play('rcs');
        thrR.classList.toggle('is-on', fireR);
        thrL.classList.toggle('is-on', fireL);
      }
      thrR.style.setProperty('--p', fireR ? Math.min(1, -lean).toFixed(2) : '0');
      thrL.style.setProperty('--p', fireL ? Math.min(1, lean).toFixed(2) : '0');
    }

    for (const a of rocks) {
      a.node.style.transform = `translate3d(${a.x}px,${a.y}px,0) rotate(${a.rot.toFixed(1)}deg)`;
    }

    // orange chevron pointing at the target when it is off-screen
    const scrX = tx - cam.x;
    const scrY = ty - cam.y;
    const pad2 = 24;
    const off = scrX < pad2 || scrX > vw - pad2 || scrY < pad2 || scrY > vh - pad2;
    const show = off && !arrived && (roamMode ? wpShown : true);
    if (show !== arrowShown) { arrowShown = show; arrow.classList.toggle('is-on', show); }
    if (show) {
      const ccx = vw / 2;
      const ccy = vh / 2;
      const vx = scrX - ccx;
      const vy = scrY - ccy;
      const left = 34;
      const right = vw - 34;
      const top = 70;
      const bottom = vh - 34;
      let t = Infinity;
      if (vx > 0) t = Math.min(t, (right - ccx) / vx); else if (vx < 0) t = Math.min(t, (left - ccx) / vx);
      if (vy > 0) t = Math.min(t, (bottom - ccy) / vy); else if (vy < 0) t = Math.min(t, (top - ccy) / vy);
      if (!Number.isFinite(t)) t = 0;
      const ax = ccx + vx * t;
      const ay = ccy + vy * t;
      arrow.style.transform = `translate3d(${ax.toFixed(1)}px,${ay.toFixed(1)}px,0) rotate(${(Math.atan2(vy, vx) * 180 / Math.PI).toFixed(1)}deg)`;
    }

    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (raf || destroyed || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  };
  const onVisibility = () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      clearKeys();
    } else start();
  };
  document.addEventListener('visibilitychange', onVisibility);
  measure();
  start();

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      clearTimeout(hintTimer);
      clearTimeout(arriveTimer);
      roam?.destroy();
      uni?.destroy();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', onVisibility);
      stick.removeEventListener('pointerdown', onPadDown);
      stick.removeEventListener('pointermove', onPadMove);
      stick.removeEventListener('pointerup', onPadUp);
      stick.removeEventListener('pointercancel', onPadUp);
      stick.removeEventListener('lostpointercapture', onPadUp);
      exitBtn.removeEventListener('click', exitClick);
      stage.removeEventListener('pointerdown', onStageDown);
      stage.removeEventListener('pointermove', onStageMove);
      stage.removeEventListener('pointerup', onStageUp);
      stage.removeEventListener('pointercancel', onStageUp);
      stage.removeEventListener('lostpointercapture', onStageLost);
      stage.removeEventListener('contextmenu', noMenu);
      if (ro) ro.disconnect();
      stage.remove();
      root.style.position = prevPosition;
    },
  };
}
