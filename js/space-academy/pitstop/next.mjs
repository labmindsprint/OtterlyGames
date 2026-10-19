import { classById } from './data.mjs';
import { launchReady, nextPart, nextSky, nextStep } from './progress.mjs';
import { classState } from './progress.mjs';
import { fuelStatus } from './fuel.mjs';

// What a mock test costs, in words: the first mock test of a class is free, then 1 fuel.
export function mockCost(save, classId) {
  const fuel = fuelStatus(save, classId);
  if (fuel.unlimited) return { short: 'unlimited fuel', button: 'unlimited fuel' };
  return fuel.firstFree ? { short: 'free first try', button: 'free first try' } : { short: '1 fuel', button: '1 fuel' };
}

// The single next thing the child should do, shared by the lab, the weld screen and the discovery card.
// Loop: weld every part (one chapter each, free), then a mock test per launch. Free roam finds schematics; a Print test prints them.
export function nextAction(save, classId) {
  const step = nextStep(save, classId);
  const info = classById(classId);
  const flown = Object.keys(classState(save, classId).flown).length;
  const total = info.sky.length;
  if (step === 'fly') {
    return { step, label: 'Launch!', sub: 'Mock test passed. Launching is free.', view: 'launch', params: { objectId: launchReady(save, classId) } };
  }
  if (step === 'build') {
    const part = nextPart(save, classId);
    const number = info.parts.indexOf(part) + 1;
    const left = info.parts.length - number;
    return {
      step, label: `Build: ${part.label}`,
      sub: `Part ${number} of ${info.parts.length} · ${part.topic} · free${left ? ` · weld all ${info.parts.length} parts, then take Mock test 1 of ${total} to launch` : ` · last part, then take Mock test 1 of ${total} to launch`}`,
      view: 'pit', params: { partId: part.id },
    };
  }
  if (step === 'mock') {
    return { step, label: `Mock test ${flown + 1} of ${total}`, sub: `Mock test ${flown + 1} of ${total} to launch to a new object · ${mockCost(save, classId).short}.`, view: 'mock-intro', params: {} };
  }
  return { step, label: 'Practice mock test', sub: `All ${total} objects found. Mock tests are practice now · ${mockCost(save, classId).short}.`, view: 'mock-intro', params: {} };
}

export { nextSky };
