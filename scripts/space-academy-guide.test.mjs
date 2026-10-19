import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADES } from '../js/space-academy/curriculum.mjs';
import { activitySeed, getCampaign } from '../js/space-academy/campaigns.mjs';
import { applyActivityAction, createActivity } from '../js/space-academy/campaign-activities.mjs';
import { craftFor } from '../js/space-academy/campaign-crafts.mjs';
import { createMission } from '../js/space-academy/questions.mjs';
import {
  applyAction, blankJourney, campaignRecommendation, campaignStatus, currentActivity, currentJourney, newSave,
} from '../js/space-academy/progress.mjs';
import { MAX_SAY_WORDS, nextStep } from '../js/space-academy/guide.mjs';

const at = '2026-10-17T16:00:00.000Z';
const act = (save, action) => applyAction(save, action, at);
const words = text => text.trim().split(/\s+/).length;
const KID_JARGON = /\b(missions?|explore|expedition|signals?|launch charges?|fit parts|earn parts|craft lab)\b/i;

function answerAll(save, mission) {
  save = act(save, { type: 'start', mission });
  for (const [index, question] of mission.questions.entries()) {
    save = act(save, { type: 'answer', missionId: mission.id, choice: question.correctIndex });
    if (index < mission.questions.length - 1) save = act(save, { type: 'next', missionId: mission.id });
  }
  return save;
}

const finish = (save, mission) => act(answerAll(save, mission), { type: 'complete', missionId: mission.id });
const pp1 = () => act(newSave(), { type: 'grade', id: 'pp1' });
const win = (save, chapter, seed = chapter) => finish(save, createMission({ grade: 'pp1', chapter, seed: `guide-${seed}` }));
const fit = (save, ...parts) => parts.reduce((next, part) => act(next, { type: 'fit', part, slot: part }), save);
const edit = (save, change) => {
  const copy = structuredClone(save);
  const explorer = copy.explorers[copy.activeExplorer];
  explorer.journeys[explorer.grade] ??= blankJourney();
  change(explorer.journeys[explorer.grade]);
  return copy;
};

function solvedActivity(gradeId, stage) {
  let activity = createActivity({ gradeId, destinationId: stage.destination, seed: activitySeed(gradeId, stage.index) });
  const { model } = activity;
  for (const item of model.objects.filter(object => object.type === model.targetType).slice(0, model.targetCount)) {
    activity = applyActivityAction(activity, { type: 'toggle', value: item.id });
  }
  return activity;
}

function solvePuzzle(save) {
  const activity = currentActivity(save);
  assert.equal(activity.kind, 'picture-collection');
  const wanted = activity.model.objects.filter(item => item.type === activity.model.targetType)
    .slice(0, activity.model.targetCount).map(item => item.id);
  for (const id of activity.state.selected.filter(id => !wanted.includes(id))) {
    save = act(save, { type: 'activity', move: { type: 'toggle', value: id } });
  }
  for (const id of wanted) {
    if (!currentActivity(save).state.selected.includes(id)) save = act(save, { type: 'activity', move: { type: 'toggle', value: id } });
  }
  assert.equal(campaignStatus(save).solved, true);
  return save;
}

const stateOf = guide => Object.fromEntries(guide.steps.map(item => [item.id, item.state]));

test('a fresh explorer is told to win the first part with one PLAY button', () => {
  const save = pp1();
  const guide = nextStep(save);
  const recommended = campaignRecommendation('pp1', currentJourney(save), 1).chapter;
  assert.equal(guide.state, 'win-part');
  assert.equal(guide.step, 'play');
  assert.match(guide.say, /^Win the .+!$/);
  assert.equal(guide.button.label, 'PLAY');
  assert.equal(guide.button.action, 'start');
  assert.equal(guide.button.attributes['data-chapter'], recommended.id);
  assert.equal(guide.button.attributes['aria-label'], `Play ${recommended.title}`);
  assert.ok(craftFor('pp1').parts.some(part => guide.say.includes(part.name)));
  assert.equal(guide.part, getCampaign('pp1').systems.find(system => system.chapters.includes(recommended.id)).id);
  assert.deepEqual(guide.blockers, ['part-to-win', 'puzzle', 'fuel']);
  assert.equal(guide.firstRun, true);
  assert.deepEqual(stateOf(guide), { play: 'next', build: 'dim', launch: 'dim' });
  assert.deepEqual(guide.steps.map(item => item.badge), [null, '0/6', '0/3']);
  assert.deepEqual(guide.steps.map(item => item.view), ['missions', 'workshop', 'map']);
  assert.equal(guide.progress.parts.needed, 3);
  assert.equal(guide.progress.stage, 0);
});

test('an unfinished mission comes first and is never a first run', () => {
  const mission = createMission({ grade: 'pp1', chapter: 'counting', seed: 'guide-resume' });
  const save = act(pp1(), { type: 'start', mission });
  const guide = nextStep(save);
  assert.equal(guide.state, 'active');
  assert.equal(guide.step, 'play');
  assert.equal(guide.say, "Let's finish your game!");
  assert.equal(guide.button.action, 'resume');
  assert.equal(guide.button.attributes['aria-label'], 'Resume saved mission');
  assert.ok(guide.button.attributes['aria-label'].toLowerCase().includes(guide.button.label.toLowerCase()));
  assert.equal(guide.firstRun, false);
});

test('mixed and paper sets in progress say so and resume the same saved set', () => {
  for (const [mode, say] of [['mixed', 'Finish your mixed game!'], ['paper', 'Finish your practice paper!']]) {
    const mission = createMission({ grade: 'class-4', mode, level: 1, seed: `guide-${mode}` });
    const save = act(act(newSave(), { type: 'grade', id: 'class-4' }), { type: 'start', mission });
    const guide = nextStep(save, { screen: 'missions' });
    assert.equal(guide.state, 'active', mode);
    assert.equal(guide.say, say);
    assert.equal(guide.button.action, 'resume');
    assert.equal(guide.step, 'play');
  }
});

test('a linked set that can start now is offered as the single PLAY button', () => {
  const guide = nextStep(pp1(), { screen: 'missions', linkReady: true });
  assert.equal(guide.state, 'linked');
  assert.equal(guide.button.action, 'start-linked');
  assert.equal(guide.button.label, 'PLAY');
  assert.equal(guide.step, 'play');
  const mission = createMission({ grade: 'pp1', chapter: 'counting', seed: 'guide-link-active' });
  const active = nextStep(act(pp1(), { type: 'start', mission }), { linkReady: true });
  assert.equal(active.state, 'active', 'an unfinished mission is resumed before a link replaces it');
});

test('a part earned but not fitted sends the child to Build, then fits it in one tap', () => {
  const save = win(pp1(), 'counting');
  assert.deepEqual(currentJourney(save).earned, ['engine']);
  const result = nextStep(save, { screen: 'result' });
  assert.equal(result.state, 'reward');
  assert.equal(result.say, "You won a part! Let's build!");
  assert.equal(result.button.label, 'BUILD');
  assert.equal(result.button.action, 'view');
  assert.deepEqual(result.button.attributes, { 'data-view': 'workshop', 'data-part': 'engine', 'aria-label': 'Build: fit my new part' });
  assert.equal(result.step, 'build');
  const home = nextStep(save, { screen: 'missions' });
  assert.equal(home.state, 'build');
  assert.equal(home.button.attributes['data-part'], 'engine');
  assert.equal(home.step, 'build');
  const workshop = nextStep(save, { screen: 'workshop', selectedPart: 'engine' });
  assert.equal(workshop.state, 'fit');
  assert.equal(workshop.say, 'Drop it on the glowing spot');
  assert.equal(workshop.button.label, 'FIT IT');
  assert.equal(workshop.button.action, 'fit-selected');
  assert.equal(workshop.button.attributes['data-part'], 'engine');
  assert.equal(workshop.part, 'engine');
  assert.deepEqual(stateOf(workshop), { play: 'open', build: 'next', launch: 'dim' });
  assert.ok(workshop.blockers.includes('part-to-fit'));
});

test('on the Build screen the guide follows the part the child selected', () => {
  let save = win(pp1(), 'counting');
  save = win(save, 'shapes');
  assert.deepEqual(currentJourney(save).earned, ['engine', 'body']);
  assert.equal(nextStep(save, { screen: 'workshop' }).part, 'engine');
  assert.equal(nextStep(save, { screen: 'workshop', selectedPart: 'body' }).part, 'body');
  assert.equal(nextStep(save, { screen: 'workshop', selectedPart: 'nose' }).part, 'engine', 'an unearned selection is ignored');
});

test('a part is fitted but more parts are missing: win the next one', () => {
  const save = fit(win(pp1(), 'counting'), 'engine');
  const guide = nextStep(save, { screen: 'workshop' });
  const recommended = campaignRecommendation('pp1', currentJourney(save), 1).chapter;
  assert.equal(guide.state, 'win-part');
  assert.equal(guide.step, 'play');
  assert.equal(guide.button.action, 'start');
  assert.equal(guide.button.attributes['data-chapter'], recommended.id);
  assert.deepEqual(guide.blockers, ['part-to-win', 'puzzle']);
  assert.deepEqual(stateOf(guide), { play: 'next', build: 'dim', launch: 'dim' });
  assert.deepEqual(guide.steps.map(item => item.badge), [null, '1/6', '1/3']);
  assert.equal(guide.progress.parts.neededFitted, 1);
  assert.equal(guide.firstRun, false);
});

test('every needed part fitted but the puzzle unsolved: the button opens the puzzle', () => {
  let save = pp1();
  for (const chapter of ['counting', 'shapes', 'patterns']) save = win(save, chapter);
  save = fit(save, 'engine', 'body', 'cockpit');
  const guide = nextStep(save, { screen: 'workshop' });
  assert.equal(guide.state, 'puzzle');
  assert.equal(guide.step, 'launch');
  assert.equal(guide.say, 'Solve the puzzle to launch!');
  assert.equal(guide.button.action, 'puzzle');
  assert.deepEqual(guide.blockers, ['puzzle']);
  assert.deepEqual(stateOf(guide), { play: 'done', build: 'done', launch: 'next' });
  assert.equal(guide.steps[2].badge, '2/3');
});

test('parts fitted, puzzle solved and fuel in the tank: ready for takeoff', () => {
  let save = pp1();
  for (const chapter of ['counting', 'shapes', 'patterns']) save = win(save, chapter);
  save = solvePuzzle(fit(save, 'engine', 'body', 'cockpit'));
  for (const screen of ['workshop', 'missions', 'map', 'progress', 'passport']) {
    const guide = nextStep(save, { screen });
    assert.equal(guide.state, 'ready', screen);
    assert.equal(guide.step, 'launch');
    assert.equal(guide.say, 'Ready for takeoff!');
    assert.equal(guide.button.label, 'LAUNCH');
    assert.equal(guide.button.action, 'launch');
    assert.equal(guide.button.attributes['aria-label'], 'Launch to the next signal');
    assert.deepEqual(guide.blockers, []);
    assert.deepEqual(stateOf(guide), { play: 'done', build: 'done', launch: 'next' });
    assert.deepEqual(guide.steps.map(item => item.badge), [null, null, null]);
  }
});

test('all fitted and solved but the tank is empty: win a game for fuel', () => {
  let save = pp1();
  for (const chapter of ['counting', 'shapes', 'patterns']) save = win(save, chapter);
  save = edit(solvePuzzle(fit(save, 'engine', 'body', 'cockpit')), journey => { journey.charges = 0; });
  const guide = nextStep(save);
  assert.equal(guide.state, 'fuel');
  assert.equal(guide.step, 'play');
  assert.equal(guide.say, 'Win a game for fuel!');
  assert.equal(guide.button.action, 'start');
  assert.match(guide.button.attributes['aria-label'], / for fuel$/);
  assert.deepEqual(guide.blockers, ['fuel']);
  assert.equal(guide.progress.fuel.charges, 0);
  assert.deepEqual(stateOf(guide), { play: 'next', build: 'done', launch: 'dim' });
});

test('a flight in progress says so and watching it is the only action', () => {
  let save = pp1();
  for (const chapter of ['counting', 'shapes', 'patterns']) save = win(save, chapter);
  save = act(solvePuzzle(fit(save, 'engine', 'body', 'cockpit')), { type: 'launch' });
  assert.ok(currentJourney(save).flight);
  for (const screen of ['missions', 'workshop', 'map']) {
    const guide = nextStep(save, { screen });
    assert.equal(guide.state, 'flying');
    assert.equal(guide.step, 'launch');
    assert.equal(guide.say, 'Your capsule is flying!');
    assert.equal(guide.button.action, 'view');
    assert.equal(guide.button.attributes['data-view'], 'map');
    assert.deepEqual(guide.blockers, ['flight']);
    assert.equal(guide.steps[2].badge, null);
  }
});

test('after a discovery the guide cheers and points at the next adventure', () => {
  let save = pp1();
  for (const chapter of ['counting', 'shapes', 'patterns']) save = win(save, chapter);
  save = act(solvePuzzle(fit(save, 'engine', 'body', 'cockpit')), { type: 'launch' });
  const flight = currentJourney(save).flight;
  save = act(save, { type: 'arrive', flightId: flight.id, destination: flight.destination });
  assert.equal(currentJourney(save).expedition.visits.length, 1);
  const guide = nextStep(save, { screen: 'discovery' });
  const recommended = campaignRecommendation('pp1', currentJourney(save), 1).chapter;
  assert.equal(guide.state, 'win-part');
  assert.equal(guide.say, 'Great find! Next adventure!');
  assert.equal(guide.step, 'play');
  assert.equal(guide.button.label, 'PLAY');
  assert.equal(guide.button.attributes['data-chapter'], recommended.id);
  assert.equal(nextStep(save, { screen: 'missions' }).say.startsWith('Win the '), true);
  assert.equal(guide.progress.worlds, 1);
});

test('the finished adventure celebrates and offers a new trip from the worlds page', () => {
  const grade = getCampaign('pp1');
  const save = edit(pp1(), journey => { journey.expedition.visits = [...grade.destinations]; });
  const guide = nextStep(save, { screen: 'map' });
  assert.equal(campaignStatus(save).stage, null);
  assert.equal(guide.state, 'complete');
  assert.equal(guide.say, 'You found every world here!');
  assert.equal(guide.button.label, 'NEW TRIP');
  assert.equal(guide.button.attributes['data-view'], 'passport');
  assert.deepEqual(guide.blockers, []);
  assert.deepEqual(stateOf(guide), { play: 'done', build: 'done', launch: 'done' });
  assert.equal(nextStep(save, { screen: 'discovery' }).say, 'Great find! You found every world here!');
  assert.equal(guide.progress.stage, null);
});

test('a known world is a free revisit, so an empty tank does not block takeoff', () => {
  let save = pp1();
  for (const chapter of ['counting', 'shapes', 'patterns']) save = win(save, chapter);
  save = solvePuzzle(fit(save, 'engine', 'body', 'cockpit'));
  const known = edit(save, journey => { journey.charges = 0; journey.visits = [getCampaign('pp1').stages[0].destination]; });
  assert.equal(campaignStatus(known).known, true);
  const guide = nextStep(known);
  assert.equal(guide.state, 'ready');
  assert.equal(guide.progress.fuel.free, true);
});

test('the guide is pure: it never changes the save and gives the same answer twice', () => {
  const save = win(pp1(), 'counting');
  const before = JSON.stringify(save);
  const first = nextStep(save, { screen: 'workshop' });
  const second = nextStep(save, { screen: 'workshop' });
  assert.equal(JSON.stringify(save), before);
  assert.deepEqual(first, second);
});

test('every spoken line is at most eight kid words, for every grade, stage, screen and progress', () => {
  const screens = [null, 'missions', 'mission', 'result', 'workshop', 'map', 'passport', 'discovery', 'progress'];
  const buttons = new Set();
  let checked = 0;
  for (const grade of GRADES) {
    const campaign = getCampaign(grade.id);
    const craft = craftFor(grade.id);
    for (const stage of campaign.stages) {
      for (let earned = 0; earned <= stage.parts.length; earned++) {
        for (let fitted = 0; fitted <= earned; fitted++) {
          for (const solved of grade.id === 'pp1' ? [false, true] : [false]) {
            for (const charges of [0, 2]) {
              const copy = edit(act(newSave(), { type: 'grade', id: grade.id }), journey => {
                journey.earned = stage.parts.slice(0, earned);
                journey.fitted = stage.parts.slice(0, fitted);
                journey.charges = charges;
                journey.expedition.visits = campaign.destinations.slice(0, stage.index);
                if (solved) journey.expedition.activity = solvedActivity(grade.id, stage);
              });
              assert.equal(campaignStatus(copy).solved, solved);
              for (const screen of screens) {
                const guide = nextStep(copy, { screen, selectedPart: stage.parts.slice(0, earned)[0] ?? null });
                assert.ok(guide.say.length > 0);
                assert.ok(words(guide.say) <= MAX_SAY_WORDS, `${grade.id}/${stage.index}/${screen}: "${guide.say}"`);
                assert.ok(words(guide.button.label) <= 2, guide.button.label);
                assert.ok(!KID_JARGON.test(guide.say), guide.say);
                assert.ok(!KID_JARGON.test(guide.button.label), guide.button.label);
                assert.ok(['play', 'build', 'launch'].includes(guide.step));
                assert.ok(guide.steps.filter(item => item.state === 'next').length <= 1);
                const label = guide.button.attributes['aria-label'];
                assert.ok(label.toLowerCase().includes(guide.button.label.toLowerCase()), `${guide.button.label} is not part of "${label}"`);
                assert.equal(craft.parts.length, 6);
                buttons.add(guide.button.action);
                checked++;
              }
            }
          }
        }
      }
    }
  }
  assert.ok(checked > 1000);
  for (const action of ['start', 'view', 'fit-selected', 'puzzle', 'launch']) assert.ok(buttons.has(action), action);
});
