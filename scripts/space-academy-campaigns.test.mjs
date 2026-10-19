import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GRADES } from '../js/space-academy/curriculum.mjs';
import { CAMPAIGNS, getCampaign } from '../js/space-academy/campaigns.mjs';
import { DESTINATIONS, PARTS } from '../js/space-academy/destinations.mjs';
import { createMission } from '../js/space-academy/questions.mjs';
import {
  applyAction, campaignRecommendation, campaignStatus, chapterObjectives, currentActivity,
  currentJourney, newSave, skillReport, universePassport, validateSave,
} from '../js/space-academy/progress.mjs';
import { applyAction as legacyAction, newSave as legacySave } from '../js/space-academy/progress-v1.mjs';

const at = '2026-10-17T16:00:00.000Z';
const act = (save, action) => applyAction(save, action, at);
const roundTrip = save => validateSave(JSON.parse(JSON.stringify(save)));
const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

function answerSet(save, mission, reduce = act, supported = false) {
  save = reduce(save, { type: 'start', mission });
  for (const [index, question] of mission.questions.entries()) {
    if (supported) save = reduce(save, { type: 'hint', missionId: mission.id });
    save = reduce(save, {
      type: 'answer', missionId: mission.id,
      choice: supported ? (question.correctIndex + 1) % question.options.length : question.correctIndex,
    });
    if (index < mission.questions.length - 1) save = reduce(save, { type: 'next', missionId: mission.id });
  }
  return save;
}

function finish(save, mission, reduce = act, supported = false) {
  return reduce(answerSet(save, mission, reduce, supported), { type: 'complete', missionId: mission.id });
}

function collectForDeparture(save) {
  const activity = currentActivity(save);
  assert.equal(activity.kind, 'picture-collection');
  const wanted = activity.model.objects.filter(item => item.type === activity.model.targetType)
    .slice(0, activity.model.targetCount).map(item => item.id);
  for (const id of activity.state.selected.filter(id => !wanted.includes(id))) {
    save = act(save, { type: 'activity', move: { type: 'toggle', value: id } });
  }
  for (const id of wanted) {
    if (!currentActivity(save).state.selected.includes(id)) {
      save = act(save, { type: 'activity', move: { type: 'toggle', value: id } });
    }
  }
  const final = currentActivity(save);
  assert.equal(final.state.selected.length, final.model.targetCount);
  assert.ok(final.state.selected.every(id => final.model.objects.find(item => item.id === id).type === final.model.targetType));
  assert.equal(campaignStatus(save).solved, true);
  return roundTrip(save);
}

test('seven campaign routes cover the universe once and every chapter belongs to a real system', () => {
  const route = Object.values(CAMPAIGNS).flatMap(campaign => campaign.destinations);
  assert.deepEqual([...route].sort(), DESTINATIONS.map(world => world.id).sort());
  assert.equal(new Set(route).size, route.length);
  for (const grade of GRADES) {
    const campaign = getCampaign(grade.id);
    assert.deepEqual(campaign.systems.flatMap(system => system.chapters).sort(), grade.chapters.map(chapter => chapter.id).sort());
    assert.deepEqual(campaign.stages[0].parts, ['engine', 'body', 'cockpit']);
    assert.deepEqual(campaign.stages.at(-1).parts, PARTS.map(part => part.id));
    for (let index = 1; index < campaign.stages.length; index++) {
      assert.ok(campaign.stages[index - 1].parts.every(part => campaign.stages[index].parts.includes(part)));
    }
  }
});

test('different completed chapter questions unlock the right systems in every grade, without perfection gates', () => {
  for (const grade of GRADES) {
    let save = act(newSave(), { type: 'grade', id: grade.id });
    for (const chapter of grade.chapters) {
      for (let round = 0; round < 4 && !chapterObjectives(grade.id, currentJourney(save)).find(goal => goal.id === chapter.id).complete; round++) {
        save = finish(save, createMission({
          grade: grade.id, chapter: chapter.id, level: 1, seed: `systems-${grade.id}-${chapter.id}-${round}`,
        }), act, true);
      }
      assert.equal(chapterObjectives(grade.id, currentJourney(save)).find(goal => goal.id === chapter.id).complete, true, `${grade.id}/${chapter.id}`);
    }
    const journey = currentJourney(roundTrip(save));
    assert.deepEqual(journey.earned, PARTS.map(part => part.id));
    assert.equal(journey.charges, journey.completed.length);
    assert.equal(journey.lastResult.correct, 0);
    assert.equal(journey.lastResult.helped, grade.missionSize);
    assert.ok(chapterObjectives(grade.id, journey).every(goal => goal.count === goal.target));
    for (const skill of new Set(grade.chapters.flatMap(chapter => chapter.skills))) {
      assert.equal(skillReport(journey, skill, 1).count, 0);
    }
  }
});

test('farming one chapter earns charges but cannot unlock the whole craft', () => {
  let save = newSave();
  for (let index = 0; index < 7; index++) {
    save = finish(save, createMission({ grade: 'class-1', chapter: 'operations', seed: `one-chapter-${index}` }));
  }
  const journey = currentJourney(save);
  assert.deepEqual(journey.earned, ['engine']);
  assert.equal(journey.charges, 7);
  assert.equal(journey.expedition.credits.operations.length, 8);
  assert.equal(campaignRecommendation('class-1', journey, 1).chapter.id, 'numbers');
});

test('even an answered last question cannot grant participation or rewards before completion commits', () => {
  const mission = createMission({ grade: 'class-1', chapter: 'operations', seed: 'completion-boundary' });
  let save = answerSet(newSave(), mission);
  assert.deepEqual(currentJourney(save).expedition.credits, {});
  assert.deepEqual(currentJourney(save).earned, []);
  assert.equal(currentJourney(save).charges, 0);
  save = act(save, { type: 'complete', missionId: mission.id });
  assert.equal(currentJourney(save).expedition.credits.operations.length, 8);
  assert.deepEqual(currentJourney(save).lastResult.parts, ['engine']);
  assert.strictEqual(act(save, { type: 'complete', missionId: mission.id }), save);
});

test('mixed missions and papers contribute bounded chapter participation instead of only mission counts', () => {
  let save = act(newSave(), { type: 'grade', id: 'class-5' });
  for (const mode of ['mixed', 'paper']) {
    save = finish(save, createMission({ grade: 'class-5', mode, level: 2, seed: `participation-${mode}` }));
  }
  const journey = currentJourney(roundTrip(save));
  const goals = chapterObjectives('class-5', journey);
  assert.ok(goals.filter(goal => goal.count > 0).length > 5);
  assert.ok(goals.reduce((sum, goal) => sum + goal.count, 0) > journey.completed.length);
  assert.ok(goals.every(goal => goal.count <= goal.target));
  const ids = Object.values(journey.expedition.credits).flatMap(credits => credits.map(credit => credit.id));
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(journey.charges, 2);
});

test('starter departures require only three core systems, but cannot skip the actual activity', () => {
  let save = newSave();
  for (const chapter of ['numbers', 'operations', 'geometry']) {
    save = finish(save, createMission({ grade: 'class-1', chapter, seed: `starter-${chapter}` }));
  }
  for (const part of ['engine', 'body', 'cockpit']) save = act(save, { type: 'fit', part, slot: part });
  const status = campaignStatus(save);
  assert.deepEqual(status.missing, []);
  assert.equal(status.solved, false);
  assert.equal(status.ready, false);
  assert.equal(currentJourney(save).fitted.length, 3);
  assert.throws(() => act(save, { type: 'launch' }), /activity/);
  assert.throws(() => act(save, { type: 'fit', part: 'nose', slot: 'nose' }), /chapter objectives/);
  assert.throws(() => act(save, { type: 'fit', part: 'engine', slot: 'body' }), /matching/);
});

test('both genuine pre-campaign backups migrate without mutating old snapshots, resources or bookmarks', () => {
  for (const name of ['space-academy-v1-save.json', 'space-academy-pre-campaign-save.json']) {
    const original = fixture(name);
    const before = JSON.stringify(original);
    const save = validateSave(original);
    assert.equal(save.version, 2);
    assert.equal(save.revision, original.revision + 1);
    assert.equal(JSON.stringify(original), before);
    assert.strictEqual(validateSave(save), save);
    if (currentJourney(original).completed.length) {
      const duplicate = act(original, { type: 'complete', missionId: currentJourney(original).completed.at(-1) });
      assert.equal(duplicate.version, 2);
      assert.equal(duplicate.revision, original.revision + 1);
    }
    for (const [id, explorer] of Object.entries(original.explorers)) {
      for (const [grade, journey] of Object.entries(explorer.journeys)) {
        const migrated = save.explorers[id].journeys[grade];
        for (const field of ['fitted', 'paint', 'charges', 'visits', 'flight', 'active', 'completed', 'history', 'attempts', 'lastResult']) {
          assert.deepEqual(migrated[field], journey[field], `${name}/${id}/${grade}/${field}`);
        }
        assert.ok(journey.earned.every(part => migrated.earned.includes(part)));
        assert.deepEqual(migrated.expedition.legacyParts, journey.earned);
        assert.deepEqual(migrated.expedition.legacyCompleted, journey.completed);
      }
    }
    assert.deepEqual(roundTrip(save), save);
  }
});

test('an old pending Moon flight keeps its destination and debit, then joins the shared Passport once', () => {
  let save = validateSave(fixture('space-academy-pre-campaign-save.json'));
  save = act(save, { type: 'grade', id: 'class-5' });
  const before = structuredClone(currentJourney(save));
  assert.equal(before.flight.destination, 'moon');
  assert.deepEqual(universePassport(save).map(world => world.id), ['earth']);
  const arrival = { type: 'arrive', flightId: before.flight.id, destination: before.flight.destination };
  save = act(roundTrip(save), arrival);
  assert.equal(currentJourney(save).charges, before.charges);
  assert.deepEqual(currentJourney(save).visits, ['earth', 'moon']);
  assert.deepEqual(currentJourney(save).expedition.visits, []);
  assert.deepEqual(universePassport(save).map(world => world.id), ['earth', 'moon']);
  assert.strictEqual(act(save, arrival), save);
});

test('migration retains old ownership and honours actual completed chapters without inventing mastery', () => {
  let old = legacyAction(legacySave(), { type: 'grade', id: 'class-5' }, at);
  old = finish(old, createMission({ grade: 'class-5', chapter: 'geometry', seed: 'old-geometry', contentVersion: 2 }), legacyAction);
  assert.deepEqual(currentJourney(old).earned, ['engine']);
  const save = validateSave(old);
  assert.deepEqual(currentJourney(save).earned, ['engine', 'body']);
  const goals = chapterObjectives('class-5', currentJourney(save));
  assert.equal(goals.find(goal => goal.id === 'geometry').complete, true);
  assert.equal(goals.find(goal => goal.id === 'operations').count, 0);
  assert.equal(currentJourney(save).charges, 1);
});

test('corrupt objective evidence, rewards, campaign routes and activity identities are rejected', () => {
  const save = finish(newSave(), createMission({ grade: 'class-1', chapter: 'operations', seed: 'strict-objectives' }));
  const changes = [
    journey => { journey.expedition.credits.operations[0].missionId = 'missing-mission'; },
    journey => { journey.expedition.credits.operations[0].id = 'q2-class-5-not-this-grade'; },
    journey => { journey.expedition.credits.operations.push(journey.expedition.credits.operations[0]); },
    journey => { journey.earned.push('cockpit'); },
    journey => { journey.expedition.version = 99; },
    journey => { journey.expedition.visits.push('earth'); },
    journey => { journey.expedition.paid.push('mars'); },
    journey => {
      const other = act(newSave(), { type: 'grade', id: 'pp1' });
      journey.expedition.activity = currentActivity(other);
    },
  ];
  for (const change of changes) {
    const corrupt = structuredClone(save);
    change(currentJourney(corrupt));
    assert.throws(() => validateSave(corrupt));
  }
  const old = fixture('space-academy-pre-campaign-save.json');
  old.explorers['explorer-1'].journeys['class-5'].earned = [];
  assert.throws(() => validateSave(old), /Earned rocket parts/);
});

test('the Passport follows the explorer across grades, never siblings or another explorer reset', () => {
  let save = validateSave(fixture('space-academy-pre-campaign-save.json'));
  save = act(save, { type: 'grade', id: 'pp1' });
  assert.equal(universePassport(save).length, 1);
  const first = structuredClone(save.explorers['explorer-1']);
  save = act(save, { type: 'explorer', id: 'explorer-2' });
  assert.equal(universePassport(save).length, 0);
  save = act(save, { type: 'reset-explorer' });
  assert.deepEqual(save.explorers['explorer-1'], first);
  assert.equal(universePassport(save, 'explorer-1').length, 1);
  assert.equal(universePassport(save).length, 0);
});

test('partial activities persist; three-system paid flights advance only their campaign and arrive once', () => {
  let save = act(newSave(), { type: 'grade', id: 'pp1' });
  for (const chapter of ['counting', 'shapes', 'patterns']) {
    save = finish(save, createMission({ grade: 'pp1', chapter, seed: `moon-starter-${chapter}` }));
  }
  for (const part of ['engine', 'body', 'cockpit']) save = act(save, { type: 'fit', part, slot: part });
  const initial = currentActivity(save);
  const item = initial.model.objects.find(item => item.type === initial.model.targetType);
  save = act(save, { type: 'activity', move: { type: 'toggle', value: item.id } });
  const partial = structuredClone(currentActivity(save));
  save = roundTrip(save);
  assert.deepEqual(currentActivity(save), partial);
  assert.equal(campaignStatus(save).solved, false);
  const untouched = JSON.stringify(save);
  assert.throws(() => act(save, { type: 'activity', move: { type: 'toggle', value: 'part-999' } }));
  assert.equal(JSON.stringify(save), untouched);
  save = act(save, { type: 'activity', move: { type: 'reset', value: null } });
  assert.deepEqual(currentActivity(save).model, initial.model);
  assert.equal(currentActivity(save).seed, initial.seed);
  assert.deepEqual(currentActivity(save).state.selected, []);
  save = collectForDeparture(save);
  assert.equal(campaignStatus(save).ready, true);
  const before = currentJourney(save).charges;
  save = act(save, { type: 'launch' });
  const flight = structuredClone(currentJourney(save).flight);
  assert.equal(flight.destination, 'earth');
  assert.equal(flight.charged, true);
  assert.equal(currentJourney(save).fitted.length, 3);
  assert.equal(currentJourney(save).charges, before - 1);
  save = roundTrip(save);
  assert.deepEqual(currentJourney(save).flight, flight);
  assert.throws(() => act(save, { type: 'launch' }), /already saved/);
  assert.throws(() => act(save, { type: 'remove', part: 'engine' }), /during a flight/);
  assert.throws(() => act(save, { type: 'activity', move: { type: 'reset', value: null } }), /saved flight/);
  const corruptions = [
    journey => { journey.flight.charged = false; },
    journey => { journey.flight.campaignVersion = 99; },
    journey => { journey.flight.stage++; },
    journey => { journey.flight.id += '-changed'; },
    journey => { journey.charges++; },
    journey => { journey.fitted = journey.fitted.filter(id => id !== 'body'); },
  ];
  for (const change of corruptions) {
    const corrupt = structuredClone(save);
    change(currentJourney(corrupt));
    assert.throws(() => validateSave(corrupt));
  }
  const arrival = { type: 'arrive', flightId: flight.id, destination: flight.destination };
  assert.throws(() => act(save, { ...arrival, destination: 'moon' }), /not pending/);
  save = act(save, arrival);
  assert.deepEqual(currentJourney(save).visits, []);
  assert.deepEqual(currentJourney(save).expedition.visits, ['earth']);
  assert.deepEqual(currentJourney(save).expedition.paid, ['earth']);
  assert.equal(currentJourney(save).charges, before - 1);
  assert.deepEqual(universePassport(save).map(world => world.id), ['earth']);
  assert.strictEqual(act(save, arrival), save);
  assert.ok(campaignStatus(save).missing.length > 0);
  assert.throws(() => act(save, { type: 'launch' }), /checklist/);

  for (const chapter of ['comparing', 'sorting', 'position']) {
    save = finish(save, createMission({ grade: 'pp1', chapter, seed: `moon-upgrade-${chapter}` }));
  }
  for (const part of PARTS) save = act(save, { type: 'fit', part: part.id, slot: part.id });
  while (campaignStatus(save).stage) {
    save = collectForDeparture(save);
    save = act(save, { type: 'launch' });
    const pending = currentJourney(save).flight;
    save = act(roundTrip(save), { type: 'arrive', flightId: pending.id, destination: pending.destination });
  }
  const journey = currentJourney(roundTrip(save));
  assert.deepEqual(journey.expedition.visits, getCampaign('pp1').destinations);
  assert.deepEqual(journey.expedition.paid, journey.expedition.visits);
  assert.equal(journey.charges, journey.completed.length - 3);
  assert.equal(universePassport(save).length, 3);
  assert.equal(currentActivity(save), null);
  assert.throws(() => act(save, { type: 'launch' }), /campaign is complete/);
  assert.throws(() => act(save, { type: 'activity', move: { type: 'reset', value: null } }), /campaign is complete/);
});

test('known passport destinations support free activity-based revisits even with zero charges', () => {
  let old = legacyAction(legacySave(), { type: 'grade', id: 'pp1' }, at);
  for (let index = 0; index < 6; index++) {
    old = finish(old, createMission({ grade: 'pp1', chapter: 'counting', seed: `legacy-free-${index}`, contentVersion: 2 }), legacyAction);
  }
  for (const part of PARTS) old = legacyAction(old, { type: 'fit', part: part.id, slot: part.id }, at);
  for (let index = 0; index < 6; index++) {
    old = legacyAction(old, { type: 'launch' }, at);
    const flight = currentJourney(old).flight;
    old = legacyAction(old, { type: 'arrive', flightId: flight.id, destination: flight.destination }, at);
  }
  let save = validateSave(old);
  const collected = universePassport(save).map(world => world.id);
  assert.equal(currentJourney(save).charges, 0);
  assert.equal(campaignStatus(save).known, true);
  let revisits = 0;
  while (campaignStatus(save).stage && campaignStatus(save).known) {
    save = collectForDeparture(save);
    assert.equal(campaignStatus(save).ready, true);
    save = act(save, { type: 'launch' });
    const flight = currentJourney(save).flight;
    assert.equal(flight.charged, false);
    assert.equal(currentJourney(save).charges, 0);
    save = act(roundTrip(save), { type: 'arrive', flightId: flight.id, destination: flight.destination });
    assert.deepEqual(universePassport(save).map(world => world.id), collected);
    assert.deepEqual(currentJourney(save).expedition.paid, []);
    revisits++;
  }
  assert.ok(revisits > 0);
  if (campaignStatus(save).stage) {
    save = collectForDeparture(save);
    assert.equal(campaignStatus(save).ready, false);
    assert.throws(() => act(save, { type: 'launch' }), /launch charge/);
  }
});
