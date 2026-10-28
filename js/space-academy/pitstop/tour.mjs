// Ringo's spotlight tour of the rocket lab: pure state, no DOM. Each tip points at a real control and is
// retired when the player taps it, skips, or replays tips from For grown-ups. Lines stay short and say
// what a control is and where, never a hard sell.
import { classState, shipComplete, applySetting } from './progress.mjs';
import { hasProgress } from './onboarding.mjs';

// Order matters: the first tip that applies and is unseen is shown.
export const TIPS = [
  { id: 'build', target: 'go', mood: 'cheer', line: 'Tap here to weld your rocket!',
    applies: (save, classId) => !shipComplete(save, classId) },
  { id: 'mock', target: 'plan-next', mood: 'happy', line: 'Mock tests launch your rocket. First is free!',
    applies: (save, classId) => {
      const state = classState(save, classId);
      return shipComplete(save, classId) && !state.launchReady && !Object.keys(state.flown).length;
    } },
  { id: 'launch', target: 'go', mood: 'cheer', line: 'Rocket ready. Tap here to launch!',
    applies: (save, classId) => Boolean(classState(save, classId).launchReady) },
  { id: 'grownups', target: 'grownups', mood: 'happy', line: 'Grown-ups can go ad-free here.', webLine: 'Grown-ups can unlock unlimited fuel here.',
    applies: save => save.premium?.unlimited !== true && hasProgress(save) },
];

export const TIP_IDS = TIPS.map(tip => tip.id);

export const seenTips = save => (Array.isArray(save.settings?.tipsSeen) ? save.settings.tipsSeen : []);

// The tip to show on the map right now, or null when the tour is finished or does not apply.
// The website shows no ads, so only the app (native) keeps the ad-free wording.
export function tipView(save, native = false) {
  const classId = save.activeClass;
  if (!classId) return null;
  const seen = seenTips(save);
  const tip = TIPS.find(item => !seen.includes(item.id) && item.applies(save, classId));
  return tip ? { id: tip.id, target: tip.target, mood: tip.mood, line: native ? tip.line : tip.webLine ?? tip.line } : null;
}

export const markTipSeen = (save, id) => (seenTips(save).includes(id) ? save : applySetting(save, { tipsSeen: [...seenTips(save), id] }));
export const skipTips = save => applySetting(save, { tipsSeen: [...TIP_IDS] });
export const replayTips = save => applySetting(save, { tipsSeen: [] });
