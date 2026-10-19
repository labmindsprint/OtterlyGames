import { classById } from '../data.mjs';

const CACHE = new Map();

// Ship art is loaded one class at a time; preload with loadShip() before calling shipSVG().
export async function loadShip(classId) {
  if (!classById(classId)) throw new RangeError(`Unknown class: ${classId}`);
  if (!CACHE.has(classId)) {
    const { default: ship } = await import(`./${classId}.mjs`);
    const expected = classById(classId).parts.map(item => item.id).join(',');
    if (ship.parts.map(item => item.id).join(',') !== expected) throw new Error(`Ship ${classId} parts do not match data.mjs.`);
    CACHE.set(classId, ship);
  }
  return CACHE.get(classId);
}

export function shipData(classId) {
  const ship = CACHE.get(classId);
  if (!ship) throw new Error(`Ship ${classId} is not loaded. Call loadShip() first.`);
  return ship;
}

// built: array of part ids or 'all'. Unbuilt parts show as a blueprint when ghost is set, otherwise they are hidden.
export function shipSVG(classId, { built = 'all', paint = null, stickers = [], ghost = false, flame = false, only = null, attrs = '', stickerArt = null } = {}) {
  const ship = shipData(classId);
  const done = built === 'all' ? new Set(ship.parts.map(item => item.id)) : new Set(built);
  const parts = ship.parts.map(item => {
    if (only && item.id !== only) return '';
    if (done.has(item.id) || only) return `<g class="ps-part" data-part="${item.id}">${item.svg}</g>`;
    return ghost ? `<g class="ps-part ps-ghost" data-part="${item.id}">${item.svg}</g>` : '';
  }).join('');
  const marks = !only && stickerArt ? stickers.map(entry => {
    const slot = ship.stickerSlots[entry.slot];
    const art = stickerArt[entry.id];
    if (!slot || !art) return '';
    return `<g class="ps-sticker" transform="translate(${slot.x - slot.s / 2} ${slot.y - slot.s / 2}) scale(${slot.s / 60})">${art}</g>`;
  }).join('') : '';
  const style = paint ? ` style="--paint:${paint}"` : '';
  return `<svg class="ps-ship" viewBox="${ship.viewBox}"${style} aria-hidden="true" focusable="false" ${attrs}>` +
    `${ship.base ?? ''}${flame && ship.flame ? `<g class="ps-flame">${ship.flame}</g>` : ''}${parts}${marks}</svg>`;
}
