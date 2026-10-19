import { CLASSES, PAPER_QUESTIONS, LEVEL_NAMES, classById } from './data.mjs';
import { gearById } from './gear.mjs';
import { CARGO_CAP, PRINT_PASS, cargoList, nextSchematic, printAll } from './schematics.mjs';

export const SAVE_VERSION = 1;
const RECENT = 12;
const MIN_ANSWERS = 4;
export const MAX_TURRETS = 2;
export { CARGO_CAP, PRINT_PASS };

// gear: printed flight gear; loadout: what is installed; cargo: schematics found in free roam, waiting for a Print test.
// printed: how many schematics have been printed. Older saves only counted paints and stickers there.
export const blankClass = () => ({
  parts: {}, flown: {}, paint: 'cream', stickers: [], paints: ['cream'], unlockedStickers: [],
  paperRuns: 0, paperBest: 0, printed: 0, launchReady: null,
  gear: [], loadout: { turrets: [], shield: null }, cargo: [],
});

export const blankSave = () => ({
  version: SAVE_VERSION, revision: 0, activeClass: null,
  settings: { reducedMotion: null, sound: true },
  classes: {}, chapters: {},
});

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateSave(save) {
  if (!isObject(save) || save.version !== SAVE_VERSION || !Number.isSafeInteger(save.revision) ||
      !isObject(save.classes) || !isObject(save.chapters) || !isObject(save.settings)) {
    throw new Error('This saved journey is not in a format Pit Stop understands.');
  }
  if (save.activeClass !== null && !classById(save.activeClass)) throw new Error('The saved class is unknown.');
  const fuel = save.fuel;
  if (fuel !== undefined && (!isObject(fuel) || ![fuel.used, fuel.ads, fuel.bank].every(n => Number.isSafeInteger(n) && n >= 0) || typeof fuel.day !== 'string')) {
    throw new Error('The saved fuel tank is damaged.');
  }
  if (save.premium !== undefined && (!isObject(save.premium) || typeof save.premium.unlimited !== 'boolean')) throw new Error('The saved supporter status is damaged.');
  const { guideSeen, preferredClass } = save.settings;
  if ((guideSeen !== undefined && typeof guideSeen !== 'boolean') ||
      (preferredClass !== undefined && preferredClass !== null && !classById(preferredClass))) {
    throw new Error('The saved guide settings are damaged.');
  }
  for (const [id, state] of Object.entries(save.classes)) {
    if (!classById(id) || !isObject(state) || !isObject(state.parts) || !isObject(state.flown) ||
        !Array.isArray(state.stickers) || !Array.isArray(state.paints) || !Array.isArray(state.unlockedStickers)) {
      throw new Error(`The saved ship for ${id} is damaged.`);
    }
    // Old and new saves both pass: cargo and gear are optional lists, and cargo may hold anything older versions wrote.
    if ((state.cargo !== undefined && !Array.isArray(state.cargo)) || (state.gear !== undefined && !Array.isArray(state.gear))) {
      throw new Error(`The saved cargo for ${id} is damaged.`);
    }
  }
  return save;
}

const copy = value => structuredClone(value);
export const classState = (save, classId) => save.classes[classId] ?? blankClass();
const writeClass = (draft, classId) => (draft.classes[classId] ??= blankClass());

export const builtParts = (save, classId) =>
  classById(classId).parts.filter(item => classState(save, classId).parts[item.id]).map(item => item.id);

export const nextPart = (save, classId) =>
  classById(classId).parts.find(item => !classState(save, classId).parts[item.id]) ?? null;

export const shipComplete = (save, classId) => nextPart(save, classId) === null;

// The next sky object to visit, in order; null once the whole sky has been explored.
export const nextSky = (save, classId) =>
  classById(classId).sky.find(id => !classState(save, classId).flown[id]) ?? null;

// The object a finished mock test has unlocked a launch to (null until a mock test is done).
export const launchReady = (save, classId) => classState(save, classId).launchReady ?? null;

export const journeyDone = (save, classId) => nextSky(save, classId) === null;

// Build every part, then each launch needs its own mock test; a finished sky leaves mock tests as free practice.
export function nextStep(save, classId) {
  if (launchReady(save, classId)) return 'fly';
  if (nextPart(save, classId)) return 'build';
  return nextSky(save, classId) ? 'mock' : 'practice';
}

function recordAnswers(draft, classId, answers, at) {
  for (const answer of answers) {
    const key = `${classId}/${answer.chapter}`;
    const row = draft.chapters[key] ??= { right: 0, total: 0, recent: '', at };
    row.total += 1;
    row.right += answer.correct ? 1 : 0;
    row.recent = `${row.recent}${answer.correct ? 1 : 0}`.slice(-RECENT);
    row.at = at;
  }
}

export const starsFor = (right, total) => (right / total >= 0.85 ? 3 : right / total >= 0.6 ? 2 : 1);

// A part only welds when at least half of its questions were right first time.
export const PASS_RATIO = 0.5;
export const passed = (right, total) => total > 0 && right / total >= PASS_RATIO;

// answers: [{ chapter, correct }] where correct means right at the first try.
export function applyPart(save, classId, partId, answers, at = new Date().toISOString()) {
  if (!classById(classId)?.parts.some(item => item.id === partId)) throw new RangeError(`Unknown part: ${partId}`);
  const draft = copy(save);
  const state = writeClass(draft, classId);
  const right = answers.filter(item => item.correct).length;
  const previous = state.parts[partId];
  if (passed(right, answers.length)) {
    const stars = starsFor(right, answers.length);
    state.parts[partId] = { stars: Math.max(stars, previous?.stars ?? 0), runs: (previous?.runs ?? 0) + 1, at };
  }
  recordAnswers(draft, classId, answers, at);
  draft.activeClass = classId;
  draft.revision += 1;
  return draft;
}

export function applyTraining(save, classId, answers, at = new Date().toISOString()) {
  const draft = copy(save);
  recordAnswers(draft, classId, answers, at);
  draft.revision += 1;
  return draft;
}

export function applyFlight(save, classId, objectId) {
  if (!classById(classId)?.sky.includes(objectId)) throw new RangeError(`Unknown sky object: ${objectId}`);
  const draft = copy(save);
  const state = writeClass(draft, classId);
  state.flown[objectId] = true;
  if (state.launchReady === objectId) state.launchReady = null;
  draft.revision += 1;
  return draft;
}

// The schematics in the cargo hold (old saves' reward objects count: they are the same kind of thing).
export const cargoOf = (save, classId) => cargoList(classState(save, classId));

// A free-roam drop is a schematic for something not owned yet; it waits in the cargo hold until a Print test prints it.
export const nextPickup = (save, classId, reserved = 0) => nextSchematic(classState(save, classId), reserved);

export function applyPickup(save, classId) {
  const item = nextPickup(save, classId);
  if (!item) return save;
  const draft = copy(save);
  const state = writeClass(draft, classId);
  state.cargo = [...cargoList(state), item];
  draft.revision += 1;
  return draft;
}

// A Print test passes with at least this many right first time.
export const printPassed = right => right >= PRINT_PASS;

// Passing prints every schematic in the hold at once; failing prints nothing and loses nothing. The answers feed the skills either way.
export function applyPrintTest(save, classId, right, answers, at = new Date().toISOString()) {
  const draft = copy(save);
  const state = writeClass(draft, classId);
  if (printPassed(right)) printAll(state, MAX_TURRETS);
  recordAnswers(draft, classId, answers, at);
  draft.revision += 1;
  return draft;
}

export const gearOf = (save, classId) => (classState(save, classId).gear ?? []).map(gearById).filter(Boolean);
export const loadoutOf = (save, classId) => {
  const { turrets = [], shield = null } = classState(save, classId).loadout ?? {};
  return { turrets: turrets.map(gearById).filter(Boolean), shield: shield ? gearById(shield) : null };
};

// Tapping an installed item removes it; tapping a free one installs it (2 turrets, 1 shield; a new shield replaces the old).
export function applyLoadout(save, classId, id) {
  const item = gearById(id);
  const state0 = classState(save, classId);
  if (!item || !(state0.gear ?? []).includes(id)) throw new RangeError(`Gear not earned: ${id}`);
  const draft = copy(save);
  const state = writeClass(draft, classId);
  const load = state.loadout = { turrets: [], shield: null, ...(state.loadout ?? {}) };
  if (item.kind === 'shield') load.shield = load.shield === id ? null : id;
  else if (load.turrets.includes(id)) load.turrets = load.turrets.filter(entry => entry !== id);
  else load.turrets = [...load.turrets, id].slice(-MAX_TURRETS);
  draft.revision += 1;
  return draft;
}

export function applyPaperEnd(save, classId, correct, answers, at = new Date().toISOString()) {
  const draft = copy(save);
  const state = writeClass(draft, classId);
  state.paperRuns += 1;
  state.paperBest = Math.max(state.paperBest, Math.min(correct, PAPER_QUESTIONS));
  // Finishing a mock test unlocks exactly one launch, and only once the whole ship is welded. It prints and awards nothing.
  if (!state.launchReady && shipComplete(draft, classId) && nextSky(draft, classId)) state.launchReady = nextSky(draft, classId);
  recordAnswers(draft, classId, answers, at);
  draft.revision += 1;
  return draft;
}

export function applyLook(save, classId, { paint, stickers }) {
  const draft = copy(save);
  const state = writeClass(draft, classId);
  if (paint && state.paints.includes(paint)) state.paint = paint;
  if (Array.isArray(stickers)) {
    state.stickers = stickers.filter(item => Number.isInteger(item.slot) && state.unlockedStickers.includes(item.id)).slice(0, 4);
  }
  draft.revision += 1;
  return draft;
}

export function applySetting(save, patch) {
  const draft = copy(save);
  Object.assign(draft.settings, patch);
  draft.revision += 1;
  return draft;
}

export function applyActiveClass(save, classId) {
  if (!classById(classId)) throw new RangeError(`Unknown class: ${classId}`);
  const draft = copy(save);
  draft.activeClass = classId;
  draft.revision += 1;
  return draft;
}

export function levelFor(row) {
  if (!row || row.total < MIN_ANSWERS) return { index: -1, name: 'New', pct: row && row.total ? Math.round(row.right / row.total * 100) : 0 };
  const recent = [...row.recent];
  const pct = Math.round(recent.filter(item => item === '1').length / recent.length * 100);
  return { index: pct >= 85 ? 3 : pct >= 65 ? 2 : pct >= 40 ? 1 : 0, name: LEVEL_NAMES[pct >= 85 ? 3 : pct >= 65 ? 2 : pct >= 40 ? 1 : 0], pct };
}

// One row per chapter of the class, in curriculum order, for the skills page.
export function proficiency(save, classId, chapters) {
  return chapters.map(chapter => {
    const row = save.chapters[`${classId}/${chapter.id}`];
    return { chapter: chapter.id, title: chapter.title, total: row?.total ?? 0, right: row?.right ?? 0, ...levelFor(row) };
  });
}

export function weakest(rows) {
  const scored = rows.filter(item => item.index >= 0).sort((a, b) => a.pct - b.pct);
  return scored.find(item => item.index <= 1) ?? null;
}

export { CLASSES };
