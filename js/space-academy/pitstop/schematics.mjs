// Schematics: the one catalogue of everything that can be found in free roam and printed with a Print test.
// Pure data and rules, no DOM. A schematic is { kind: 'gear' | 'paint' | 'sticker', id }.
import { PAINTS, PAPER_REWARDS } from './data.mjs';
import { GEAR_ORDER, gearById } from './gear.mjs';

export const CARGO_CAP = 6;
export const PRINT_QUESTIONS = 10;
export const PRINT_PASS = 7;

const STICKER_NAMES = { zig: 'Zigzag', dot: 'Bullseye', ring: 'Gold ring', check: 'Tick', wave: 'Wave', eye: 'Eye' };
export const stickerName = id => STICKER_NAMES[id] ?? `${id.charAt(0).toUpperCase()}${id.slice(1)}`;

// Fixed order: a piece of gear, then two paints or stickers, over and over; whatever is left follows.
export const CATALOGUE = (() => {
  const gear = GEAR_ORDER.map(id => ({ kind: 'gear', id }));
  const looks = PAPER_REWARDS.map(({ kind, id }) => ({ kind, id }));
  const order = [];
  let at = 0;
  for (const item of gear) order.push(item, ...looks.slice(at, at += 2));
  return [...order, ...looks.slice(at)];
})();

const keyOf = item => `${item.kind}:${item.id}`;
export const isSchematic = item => Boolean(item) && CATALOGUE.some(entry => entry.kind === item.kind && entry.id === item.id);

// The schematics of a class in the hold, tolerating saves from before this field changed (and junk in it).
export function cargoList(state) {
  const seen = new Set();
  const out = [];
  for (const item of state?.cargo ?? []) {
    if (!isSchematic(item) || seen.has(keyOf(item)) || isOwned(state, item)) continue;
    seen.add(keyOf(item));
    out.push({ kind: item.kind, id: item.id });
  }
  return out;
}

export function isOwned(state, item) {
  if (item.kind === 'gear') return (state?.gear ?? []).includes(item.id);
  if (item.kind === 'paint') return item.id === 'cream' || (state?.paints ?? []).includes(item.id);
  return (state?.unlockedStickers ?? []).includes(item.id);
}

export const inCargo = (state, item) => cargoList(state).some(entry => keyOf(entry) === keyOf(item));

// The next schematic a roam drop would carry. `reserved` skips drops that are still being saved.
export function nextSchematic(state, reserved = 0) {
  const held = cargoList(state);
  if (held.length + reserved >= CARGO_CAP) return null;
  const heldKeys = new Set(held.map(keyOf));
  const free = CATALOGUE.filter(item => !isOwned(state, item) && !heldKeys.has(keyOf(item)));
  return free[reserved] ?? null;
}

export function schematicName(item) {
  if (item.kind === 'gear') return gearById(item.id)?.name ?? item.id;
  if (item.kind === 'paint') return PAINTS.find(paint => paint.id === item.id)?.name ?? item.id;
  return stickerName(item.id);
}

// 'Heal Shield (shield)', 'Coral (paint)', 'Star (sticker)'.
export const schematicLabel = item => `${schematicName(item)} (${item.kind === 'gear' ? gearById(item.id)?.kind ?? 'gear' : item.kind})`;

export const HINT_FIND = 'Find its schematic in free roam';
export const HINT_SHIP = 'Finish your rocket first to unlock free roam';
export const HINT_CARGO = 'Schematic in cargo: take a Print test to print it';

// How to get a locked item: the same words everywhere (Flight gear and Look).
export function lockHint(state, item, shipDone) {
  if (inCargo(state, item)) return HINT_CARGO;
  return shipDone ? HINT_FIND : HINT_SHIP;
}

// Whether a Print test can be started (the fuel is a separate question).
export function printGate(state, shipDone) {
  const count = cargoList(state).length;
  if (count > 0) return { ok: true, count, reason: '' };
  return { ok: false, count, reason: shipDone ? 'Nothing to print yet. Find schematics in free roam.' : 'Finish your rocket to unlock free roam.' };
}

// Cargo and owned lists after a pass: every schematic in the hold is installed or unlocked.
export function printAll(state, maxTurrets) {
  const items = cargoList(state);
  const gear = state.gear ??= [];
  const load = state.loadout = { turrets: [], shield: null, ...(state.loadout ?? {}) };
  for (const item of items) {
    if (item.kind === 'gear') {
      gear.push(item.id);
      if (gearById(item.id).kind === 'shield') load.shield ??= item.id;
      else if (load.turrets.length < maxTurrets) load.turrets.push(item.id);
    } else if (item.kind === 'paint') (state.paints ??= ['cream']).push(item.id);
    else (state.unlockedStickers ??= []).push(item.id);
    state.printed = (state.printed ?? 0) + 1;
  }
  state.cargo = [];
  return items;
}
