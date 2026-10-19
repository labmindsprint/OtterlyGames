// Rocket fuel: every mock test after the first one burns one fuel. Pure functions over the save, no DOM.
import { classState } from './progress.mjs';

export const DAILY_FREE = 2;
export const MAX_ADS = 2;
export const AD_FUEL = 1;

export const PACKS = [
  { id: 'fuel-5', fuel: 5, label: '5 fuel' },
  { id: 'fuel-15', fuel: 15, label: '15 fuel' },
];
export const REMOVE_ADS = { id: 'remove-ads', rupees: 150, label: 'Unlimited fuel · no ads' };

export const blankFuel = () => ({ day: '', used: 0, ads: 0, bank: 0 });

const pad = value => String(value).padStart(2, '0');
export const dayKey = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

// A new local day resets the daily tank and ad count. A device clock set backwards never refills it.
function rolled(fuel, now) {
  const today = dayKey(now);
  if (fuel.day && today <= fuel.day) return fuel;
  return { ...fuel, day: today, used: 0, ads: 0 };
}

export const unlimited = save => Boolean(save.premium?.unlimited);

export function fuelStatus(save, classId, now = new Date()) {
  const fuel = rolled({ ...blankFuel(), ...(save.fuel ?? {}) }, now);
  const cap = DAILY_FREE + fuel.ads * AD_FUEL;
  const daily = Math.max(0, cap - fuel.used);
  const first = Boolean(classId) && (classState(save, classId).paperRuns ?? 0) === 0;
  const infinite = unlimited(save);
  return {
    unlimited: infinite,
    firstFree: first,
    daily,
    bank: fuel.bank,
    available: daily + fuel.bank,
    adsLeft: infinite ? 0 : Math.max(0, MAX_ADS - fuel.ads),
    canStart: infinite || first || daily + fuel.bank > 0,
  };
}

const copy = value => structuredClone(value);

function writeFuel(draft, now) {
  draft.fuel = rolled({ ...blankFuel(), ...(draft.fuel ?? {}) }, now);
  return draft.fuel;
}

// Called when a mock test starts. Daily fuel burns before bought fuel.
export function applySpend(save, classId, now = new Date()) {
  const status = fuelStatus(save, classId, now);
  if (!status.canStart) throw new Error('The tank is empty.');
  if (status.unlimited || status.firstFree) return save;
  const draft = copy(save);
  const fuel = writeFuel(draft, now);
  if (status.daily > 0) fuel.used += 1;
  else fuel.bank -= 1;
  draft.revision += 1;
  return draft;
}

export function applyAdFuel(save, now = new Date()) {
  if (fuelStatus(save, null, now).adsLeft < 1) throw new Error('No more ads today.');
  const draft = copy(save);
  writeFuel(draft, now).ads += 1;
  draft.revision += 1;
  return draft;
}

export function applyBoughtFuel(save, amount, now = new Date()) {
  if (!Number.isSafeInteger(amount) || amount < 1) throw new RangeError('Bad fuel amount.');
  const draft = copy(save);
  writeFuel(draft, now).bank += amount;
  draft.revision += 1;
  return draft;
}

export function applyUnlimited(save, via, at = new Date().toISOString()) {
  if (unlimited(save)) return save;
  const draft = copy(save);
  draft.premium = { unlimited: true, via, at };
  draft.revision += 1;
  return draft;
}
