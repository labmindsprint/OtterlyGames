// First-run guide state: who needs the comic guide, what it says, and the single save changes it makes. Pure, no DOM.
import { CLASSES } from './data.mjs';
import { applyActiveClass, applySetting } from './progress.mjs';

// One line per class so a child (or parent) can pick without knowing school grades.
export const CLASS_AGES = {
  pp1: 'Ages 4–5', pp2: 'Ages 5–6', 'class-1': 'Ages 6–7', 'class-2': 'Ages 7–8',
  'class-3': 'Ages 8–9', 'class-4': 'Ages 9–10', 'class-5': 'Ages 10–11',
};

// The four steps of the loop. art picks the real icon the view draws. Costs match the fuel rules: only launch mocks and Print tests burn fuel.
export const STEPS = [
  { id: 'build', title: 'Build', art: 'build', cost: 'Free', body: 'Answer chapter puzzles to weld the parts of your rocket.' },
  { id: 'launch', title: 'Mock test & launch', art: 'launch', cost: '1 fuel', body: 'Take one of 10 mock tests to launch to a new space object. Your first one is free. Fuel refills every day.' },
  { id: 'roam', title: 'Free roam', art: 'roam', cost: 'Free', body: 'Rocket built? Fly anywhere and zap enemies. Find schematics for gear, stickers and paint.' },
  { id: 'print', title: 'Print', art: 'print', cost: '1 fuel', body: 'Take a 10-question Print test. Get 7 or more right to print the schematics you found.' },
];

export const PANELS = ['welcome', 'class', 'how'];

// Real progress means the player is not new, whatever the guide flag says (saves from before the guide existed).
export function hasProgress(save) {
  if (save.premium?.unlimited) return true;
  if (Object.keys(save.chapters ?? {}).length) return true;
  return Object.values(save.classes ?? {}).some(state =>
    Object.keys(state.parts ?? {}).length || Object.keys(state.flown ?? {}).length || state.paperRuns > 0);
}

export const needsGuide = save => save.settings?.guideSeen !== true && !hasProgress(save);

// Picking a class sets the class the game opens on and remembers the pick.
export function chooseClass(save, classId) {
  if (save.activeClass === classId && save.settings.preferredClass === classId) return save;
  const next = applyActiveClass(save, classId);
  next.settings.preferredClass = classId;
  return next;
}

export const finishGuide = save => (save.settings.guideSeen === true ? save : applySetting(save, { guideSeen: true }));

export const isClassId = id => CLASSES.some(item => item.id === id);
