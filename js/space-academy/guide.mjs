import { campaignRecommendation, campaignStatus, currentExplorer, currentJourney, universePassport } from './progress.mjs';
import { chapterSystem } from './campaigns.mjs';
import { craftFor } from './campaign-crafts.mjs';

// The otter guide: one pure decision, "what is the ONE thing to do next?", derived from the save alone.
// Nothing is stored; the optional context only says what the child is looking at.
export const MAX_SAY_WORDS = 8;

const VIEWS = { play: 'missions', build: 'workshop', launch: 'map' };
const wordCount = text => text.trim().split(/\s+/).length;
const within = (text, fallback) => (wordCount(text) <= MAX_SAY_WORDS ? text : fallback);
const control = (label, action, attributes = {}) => ({ label, action, attributes });

/**
 * nextStep(save, { screen, selectedPart, linkReady })
 *  -> { state, step, say, part, button: { label, action, attributes }, progress, blockers, steps, firstRun }
 * `step` is play | build | launch. `steps` is the ribbon (play, build, launch) with a state of
 * next | done | dim | open and an optional tiny badge.
 */
export function nextStep(save, context = {}) {
  const { screen = null, selectedPart = null, linkReady = false } = context;
  const explorer = currentExplorer(save);
  const journey = currentJourney(save);
  const craft = craftFor(explorer.grade);
  const status = campaignStatus(save);
  const { stage } = status;
  const nameOf = id => craft.parts.find(part => part.id === id)?.name ?? 'part';
  const needed = stage ? stage.parts : [];
  const fuelOk = status.known || journey.charges > 0;
  const toWin = status.missing.filter(id => !journey.earned.includes(id));
  const toFit = craft.parts.map(part => part.id)
    .filter(id => journey.earned.includes(id) && !journey.fitted.includes(id))
    .sort((a, b) => Number(needed.includes(b)) - Number(needed.includes(a)));
  const active = journey.active?.mission ?? null;
  const checks = stage ? [status.missing.length === 0, status.solved, fuelOk] : [true, true, true];
  const lastRewards = journey.lastResult?.parts ?? (journey.lastResult?.part ? [journey.lastResult.part] : []);
  const reward = lastRewards.find(id => toFit.includes(id)) ?? null;

  const blockers = [];
  if (journey.flight) blockers.push('flight');
  if (stage) {
    if (status.missing.some(id => journey.earned.includes(id))) blockers.push('part-to-fit');
    if (toWin.length) blockers.push('part-to-win');
    if (!status.solved) blockers.push('puzzle');
    if (!fuelOk) blockers.push('fuel');
  }

  const recommended = () => campaignRecommendation(explorer.grade, journey, explorer.level).chapter;
  const playControl = (suffix = '') => {
    const chapter = recommended();
    return control('PLAY', 'start', { 'data-chapter': chapter.id, 'aria-label': `Play ${chapter.title}${suffix}` });
  };
  const buildControl = part => control('BUILD', 'view', { 'data-view': 'workshop', 'data-part': part, 'aria-label': 'Build: fit my new part' });
  const winPart = () => {
    const earns = chapterSystem(explorer.grade, recommended().id).id;
    return toWin.includes(earns) ? earns : toWin[0];
  };
  const cheer = text => (screen === 'discovery' ? within(`Great find! ${text}`, text) : text);

  let state;
  let step;
  let say;
  let button;
  let part = null;
  if (active) {
    state = 'active'; step = 'play';
    say = active.mode === 'paper' ? 'Finish your practice paper!' : active.mode === 'mixed' ? 'Finish your mixed game!' : "Let's finish your game!";
    button = control('RESUME', 'resume', { 'aria-label': 'Resume saved mission' });
  } else if (linkReady) {
    state = 'linked'; step = 'play'; say = 'A shared set is waiting!';
    button = control('PLAY', 'start-linked', { 'aria-label': 'Play the shared set' });
  } else if (journey.flight) {
    state = 'flying'; step = 'launch'; say = `Your ${craft.noun} is flying!`;
    button = control('WATCH', 'view', { 'data-view': 'map', 'aria-label': 'Watch your flight' });
  } else if (!stage) {
    state = 'complete'; step = 'launch'; say = cheer('You found every world here!');
    button = control('NEW TRIP', 'view', { 'data-view': 'passport', 'aria-label': 'New trip: pick another adventure' });
  } else if (screen === 'result' && reward) {
    state = 'reward'; step = 'build'; say = "You won a part! Let's build!"; part = reward; button = buildControl(reward);
  } else if (toFit.length && screen === 'workshop') {
    part = toFit.includes(selectedPart) ? selectedPart : toFit[0];
    state = 'fit'; step = 'build'; say = 'Drop it on the glowing spot';
    button = control('FIT IT', 'fit-selected', { 'data-part': part, 'aria-label': `Fit it: ${nameOf(part)}` });
  } else if (toFit.length) {
    part = toFit[0];
    state = 'build'; step = 'build'; say = cheer("New part ready! Let's build!"); button = buildControl(part);
  } else if (toWin.length) {
    part = winPart();
    state = 'win-part'; step = 'play';
    say = screen === 'discovery' ? 'Great find! Next adventure!' : within(`Win the ${nameOf(part)}!`, 'Win a new part!');
    button = playControl();
  } else if (!status.solved) {
    state = 'puzzle'; step = 'launch'; say = cheer('Solve the puzzle to launch!');
    button = control('PUZZLE', 'puzzle', { 'aria-label': 'Show me the puzzle' });
  } else if (!fuelOk) {
    state = 'fuel'; step = 'play'; say = cheer('Win a game for fuel!'); button = playControl(' for fuel');
  } else {
    state = 'ready'; step = 'launch'; say = cheer('Ready for takeoff!');
    button = control('LAUNCH', 'launch', { 'aria-label': 'Launch to the next signal' });
  }

  const playDone = !stage || (toWin.length === 0 && fuelOk);
  const buildDone = !stage || status.missing.length === 0;
  const buildDim = !buildDone && toFit.length === 0;
  const launchDim = Boolean(stage) && !status.ready;
  const ribbon = [
    { id: 'play', done: playDone, dim: false, badge: null },
    { id: 'build', done: buildDone, dim: buildDim, badge: buildDim ? `${journey.fitted.length}/${craft.parts.length}` : null },
    { id: 'launch', done: !stage, dim: launchDim, badge: launchDim && !journey.flight ? `${checks.filter(Boolean).length}/${checks.length}` : null },
  ].map(({ id, done, dim, badge }) => ({
    id, view: VIEWS[id], badge,
    state: stage && id === step ? 'next' : done ? 'done' : dim ? 'dim' : 'open',
  }));

  return {
    state, step, say, part, button, blockers, steps: ribbon,
    firstRun: journey.completed.length === 0 && !journey.active,
    progress: {
      parts: {
        fitted: journey.fitted.length, total: craft.parts.length, needed: needed.length,
        neededFitted: needed.length - status.missing.length, earned: journey.earned.length,
      },
      puzzle: stage ? status.solved : true,
      fuel: { charges: journey.charges, free: status.known },
      checks: { done: checks.filter(Boolean).length, of: checks.length },
      worlds: universePassport(save).length,
      stage: stage ? stage.index : null,
      stages: status.campaign.stages.length,
    },
  };
}
