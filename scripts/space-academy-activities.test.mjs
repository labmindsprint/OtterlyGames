import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createActivity, validateActivity, applyActivityAction, isActivityComplete, renderActivity,
} from '../js/space-academy/campaign-activities.mjs';
import { DESTINATIONS } from '../js/space-academy/destinations.mjs';

const GRADES = ['pp1', 'pp2', 'class-1', 'class-2', 'class-3', 'class-4', 'class-5'];
const make = (gradeId, seed = 'activity-test', destinationId = 'earth') =>
  createActivity({ gradeId, destinationId, seed });
const act = (activity, type, value = null) => applyActivityAction(activity, { type, value });
const copy = value => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function invalidUnchanged(activity, type, value, message) {
  const before = copy(activity);
  freeze(activity);
  assert.throws(() => act(activity, type, value), message);
  assert.deepEqual(activity, before, 'an invalid action must not change even nested history');
}

function roverSolution(model) {
  const all = (1 << model.crates.length) - 1;
  const maskAt = cell => model.crates.reduce((mask, crate, index) => mask | (crate === cell ? 1 << index : 0), 0);
  const queue = [{ cell: model.start, mask: maskAt(model.start), moves: [] }];
  const seen = new Set([`${model.start}:${queue[0].mask}`]);
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (current.cell === model.exit && current.mask === all) return current.moves;
    for (const [direction, dx, dy] of [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]]) {
      const x = current.cell % model.width + dx;
      const y = Math.floor(current.cell / model.width) + dy;
      if (x < 0 || x >= model.width || y < 0 || y >= model.height) continue;
      const cell = y * model.width + x;
      if (model.walls.includes(cell)) continue;
      const mask = current.mask | maskAt(cell);
      const key = `${cell}:${mask}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ cell, mask, moves: [...current.moves, direction] });
    }
  }
  throw new Error('Independent BFS found no rover solution.');
}

function cargoChoices(model) {
  const solutions = [];
  function enumerate(counts = []) {
    if (counts.length < model.items.length) {
      for (let amount = 0; amount <= model.maxPerItem; amount++) enumerate([...counts, amount]);
      return;
    }
    const totals = { fuel: 0, supplies: 0, cargo: 0, cost: 0 };
    model.items.forEach((item, index) => {
      for (const key of Object.keys(totals)) totals[key] += item[key] * counts[index];
    });
    if (totals.fuel >= model.requiredFuel && totals.supplies >= model.requiredSupplies
      && totals.cargo <= model.cargoCapacity && totals.cost <= model.budget) solutions.push(counts);
  }
  enumerate();
  return solutions.sort((a, b) => a.reduce((sum, count) => sum + count, 0) - b.reduce((sum, count) => sum + count, 0));
}

function beaconRoutes(model) {
  const routes = [];
  function visit(route, spent) {
    if (route.at(-1) === model.end) {
      routes.push({ route, spent, checkpoint: route.includes(model.checkpoint) });
      return;
    }
    for (const edge of model.edges.filter(candidate => candidate.from === route.at(-1))) {
      if (!route.includes(edge.to) && spent + edge.cost <= model.fuelBudget) visit([...route, edge.to], spent + edge.cost);
    }
  }
  visit([model.start], 0);
  return routes;
}

function rectangleCells(model, module, placement) {
  const width = placement.turned ? module.height : module.width;
  const height = placement.turned ? module.width : module.height;
  const x = placement.cell % model.width;
  const y = Math.floor(placement.cell / model.width);
  if (x + width > model.width || y + height > model.height) return null;
  const cells = [];
  for (let row = y; row < y + height; row++) {
    for (let column = x; column < x + width; column++) cells.push(row * model.width + column);
  }
  return cells;
}
function connectedStation(model, occupied) {
  const reached = new Set([model.core]);
  const pending = [model.core];
  while (pending.length) {
    const cell = pending.pop();
    const x = cell % model.width;
    const y = Math.floor(cell / model.width);
    for (const next of occupied) {
      if (!reached.has(next) && Math.abs(next % model.width - x)
        + Math.abs(Math.floor(next / model.width) - y) === 1) {
        reached.add(next);
        pending.push(next);
      }
    }
  }
  return reached.size === occupied.size;
}
function stationArrangement(model, wantConnected = true) {
  const candidates = model.modules.map(module => {
    const list = [];
    for (const turned of module.width === module.height ? [false] : [false, true]) {
      for (let cell = 0; cell < model.width * model.height; cell++) {
        const placement = { cell, turned };
        const cells = rectangleCells(model, module, placement);
        if (cells && !cells.includes(model.core)) list.push({ placement, cells });
      }
    }
    return list;
  });
  function search(placements, occupied) {
    if (placements.length === model.modules.length) {
      return connectedStation(model, occupied) === wantConnected ? placements : null;
    }
    for (const candidate of candidates[placements.length]) {
      if (candidate.cells.some(cell => occupied.has(cell))) continue;
      const result = search([...placements, candidate.placement], new Set([...occupied, ...candidate.cells]));
      if (result) return result;
    }
    return null;
  }
  return search([], new Set([model.core]));
}

function commandChoices(model) {
  const choices = [];
  function search(assignments, used) {
    if (assignments.length < model.sectors.length) {
      for (const probe of model.probes) {
        if (!used.has(probe.id) && probe.compatible.includes(model.sectors[assignments.length].id)) {
          search([...assignments, probe.id], new Set([...used, probe.id]));
        }
      }
      return;
    }
    let cost = 0;
    let energy = 0;
    let science = 0;
    assignments.forEach((id, index) => {
      const probe = model.probes.find(candidate => candidate.id === id);
      const specialist = probe.speciality === model.sectors[index].id;
      cost += probe.cost;
      energy += probe.energy - (specialist ? model.specialistSaving : 0);
      science += probe.science + (specialist ? model.specialistScience : 0);
    });
    choices.push({ assignments, cost, energy, science,
      legal: cost <= model.budget && energy <= model.energyCapacity,
      solved: cost <= model.budget && energy <= model.energyCapacity && science >= model.requiredScience });
  }
  search([], new Set());
  return choices;
}
function placeStation(activity, placements) {
  for (let index = 0; index < placements.length; index++) {
    activity = act(activity, 'select', activity.model.modules[index].id);
    if (placements[index].turned) activity = act(activity, 'rotate');
    activity = act(activity, 'place', String(placements[index].cell));
  }
  return activity;
}
function assignCommand(activity, assignments) {
  assignments.forEach((id, index) => {
    activity = act(activity, 'select', id);
    activity = act(activity, 'assign', activity.model.sectors[index].id);
  });
  return activity;
}
function solve(activity) {
  const { gradeId, model } = activity;
  switch (gradeId) {
    case 'pp1':
      for (const object of model.objects.filter(object => object.type === model.targetType).slice(0, model.targetCount)) {
        activity = act(activity, 'toggle', object.id);
      }
      return activity;
    case 'pp2':
      for (let index = 0; index < model.slotCount; index++) {
        const component = model.cycle[(model.givenCount + index) % model.cycle.length];
        if (activity.state.selected !== component) activity = act(activity, 'select', component);
        activity = act(activity, 'place', String(index));
      }
      return activity;
    case 'class-1':
      for (const direction of roverSolution(model)) activity = act(activity, 'move', direction);
      return activity;
    case 'class-2': {
      const counts = cargoChoices(model)[0];
      assert.ok(counts, 'independent enumeration must find a feasible cargo allocation');
      counts.forEach((count, index) => {
        for (let amount = 0; amount < count; amount++) activity = act(activity, 'increase', model.items[index].id);
      });
      return activity;
    }
    case 'class-3': {
      const route = beaconRoutes(model).find(candidate => candidate.checkpoint)?.route;
      assert.ok(route, 'independent graph traversal must find a checkpoint route');
      for (const node of route.slice(1)) activity = act(activity, 'travel', node);
      return activity;
    }
    case 'class-4': {
      const arrangement = stationArrangement(model);
      assert.ok(arrangement, 'independent rectangle packing must find a connected layout');
      return placeStation(activity, arrangement);
    }
    case 'class-5': {
      const choice = commandChoices(model).find(candidate => candidate.solved);
      assert.ok(choice, 'independent assignment enumeration must find a feasible team');
      return assignCommand(activity, choice.assignments);
    }
    default: throw new Error('Unknown test grade');
  }
}
function partial(activity) {
  switch (activity.gradeId) {
    case 'pp1': return act(activity, 'toggle', activity.model.objects[0].id);
    case 'pp2': return act(act(activity, 'select', activity.model.components[0]), 'place', '0');
    case 'class-1': return act(activity, 'move', roverSolution(activity.model)[0]);
    case 'class-2': return act(activity, 'increase', activity.model.items[0].id);
    case 'class-3': return act(activity, 'travel', activity.model.edges.find(edge => edge.from === activity.model.start).to);
    case 'class-4': {
      const placement = stationArrangement(activity.model)[0];
      activity = act(activity, 'select', activity.model.modules[0].id);
      if (placement.turned) activity = act(activity, 'rotate');
      return act(activity, 'place', String(placement.cell));
    }
    case 'class-5': return act(act(activity, 'select', 'scout'), 'assign', 'dust');
    default: throw new Error('Unknown test grade');
  }
}

test('creation is deterministic, standalone, grade-specific and rejects unknown or oversized inputs', () => {
  const kinds = new Set();
  for (const gradeId of GRADES) {
    const first = make(gradeId);
    assert.deepEqual(first, make(gradeId));
    assert.equal(validateActivity(first), first);
    assert.equal(isActivityComplete(first), false);
    assert.deepEqual(first, JSON.parse(JSON.stringify(first)));
    kinds.add(first.kind);
    assert.throws(() => createActivity({ gradeId, destinationId: 'secret-world', seed: 'test' }), /destination/);
  }
  assert.equal(kinds.size, 7);
  for (const gradeId of ['PP1', 'class-6', '__proto__', null]) assert.throws(() => make(gradeId), /grade/);
  for (const seed of ['', 'a'.repeat(161), null, 22]) assert.throws(() => make('pp1', seed), /seed/);
  assert.throws(() => createActivity({ gradeId: 'pp1', destinationId: 'earth', seed: 'test', complete: true }), /options/);
  assert.throws(() => createActivity(null), /options/);
  assert.notDeepEqual(make('pp1', 'one').model, make('pp1', 'two').model);
});

for (const gradeId of GRADES) {
  test(`${gradeId}: independent solution, incomplete undo, reset, immutable moves and partial-state round trip`, () => {
    const initial = freeze(make(gradeId));
    const before = copy(initial);
    const started = partial(initial);
    assert.notEqual(started, initial);
    assert.deepEqual(initial, before);
    assert.equal(isActivityComplete(started), false);
    const restored = JSON.parse(JSON.stringify(started));
    assert.deepEqual(validateActivity(restored), started);
    assert.equal(renderActivity(restored), renderActivity(started));
    const beforeUndo = copy(restored);
    const undone = act(freeze(restored), 'undo');
    assert.deepEqual(restored, beforeUndo);
    assert.notDeepEqual(undone.state, restored.state);
    assert.equal(isActivityComplete(undone), false);
    const solved = solve(initial);
    assert.equal(isActivityComplete(solved), true);
    assert.equal(isActivityComplete(JSON.parse(JSON.stringify(solved))), true);
    assert.equal(isActivityComplete(act(solved, 'undo')), false, 'undoing the last board move must remove success');
    assert.deepEqual(act(solved, 'reset'), initial, 'reset keeps the canonical seeded model, not a fresh random board');
    invalidUnchanged(initial, 'undo', null, /no move to undo/);
    invalidUnchanged(initial, 'unknown', 'x', /not available/);
    invalidUnchanged(initial, 'reset', 'unwanted', /does not need/);
  });
}

test('Moon Camp counts selected objects, rejects wrong types and excess, and supports deselection', () => {
  let activity = make('pp1');
  const target = activity.model.objects.filter(object => object.type === activity.model.targetType);
  const distractor = activity.model.objects.find(object => object.type !== activity.model.targetType);
  activity = act(activity, 'toggle', distractor.id);
  for (const object of target.slice(0, activity.model.targetCount - 1)) activity = act(activity, 'toggle', object.id);
  assert.equal(activity.state.selected.length, activity.model.targetCount);
  assert.equal(isActivityComplete(activity), false, 'a correct item count with a star or wrong part is not solved');
  assert.match(renderActivity(activity), /Put back 1 item/);
  activity = act(activity, 'toggle', distractor.id);
  activity = act(activity, 'toggle', target[activity.model.targetCount - 1].id);
  assert.equal(isActivityComplete(activity), true);
  activity = act(activity, 'toggle', target[activity.model.targetCount].id);
  assert.equal(isActivityComplete(activity), false, 'packing too many correct objects is not solved');
  activity = act(activity, 'undo');
  assert.equal(isActivityComplete(activity), true);
  invalidUnchanged(activity, 'toggle', 'part-900', /part shown/);
});

test('Planet Hopper needs actual repeated placements, allows replacement/removal, and explains missing selection', () => {
  let activity = make('pp2');
  invalidUnchanged(activity, 'place', '0', /component.*first/);
  const wrong = activity.model.components.find(component => component !== activity.model.cycle[0]);
  activity = act(activity, 'select', wrong);
  for (let index = 0; index < activity.model.slotCount; index++) activity = act(activity, 'place', String(index));
  assert.equal(isActivityComplete(activity), false);
  assert.match(renderActivity(activity), /Not yet: compare/);
  const before = activity;
  activity = act(activity, 'remove', '0');
  assert.equal(activity.state.slots[0], null);
  assert.deepEqual(act(activity, 'undo').state.slots, before.state.slots);
  activity = act(activity, 'reset');
  activity = solve(activity);
  const desired = activity.state.slots[0];
  const other = activity.model.components.find(component => component !== desired);
  activity = act(activity, 'select', other);
  activity = act(activity, 'place', '0');
  assert.equal(isActivityComplete(activity), false, 'replacing a correct placement must make the board incomplete');
  invalidUnchanged(activity, 'select', 'purple', /component tray/);
  for (const value of ['01', '+1', '1.0', ' 1 ', '1e0', '-1', '4', null, '0'.repeat(81)]) {
    invalidUnchanged(activity, 'place', value, /board|button/);
  }
});

test('Rover Rescue rejects walls and edges, undoes pickups, and bounds the persisted path', () => {
  const initial = make('class-1');
  const { model } = initial;
  const edgeDirection = model.start % model.width === 0 ? 'left' : 'right';
  invalidUnchanged(initial, 'move', edgeDirection, /leaves the map/);
  invalidUnchanged(initial, 'move', 'diagonal', /Up, Down, Left or Right/);
  let activity = initial;
  let hitCrate = false;
  for (const direction of roverSolution(model)) {
    const before = activity;
    activity = act(activity, 'move', direction);
    if (model.crates.includes(activity.state.path.at(-1)) && !before.state.path.includes(activity.state.path.at(-1))) {
      assert.deepEqual(act(activity, 'undo'), before);
      hitCrate = true;
    }
  }
  assert.ok(hitCrate);
  assert.equal(isActivityComplete(activity), true);
  const visited = [initial];
  const seen = new Set([model.start]);
  let wallAttempt = false;
  for (let index = 0; index < visited.length; index++) {
    const board = visited[index];
    const position = board.state.path.at(-1);
    for (const [direction, dx, dy] of [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]]) {
      const x = position % model.width + dx;
      const y = Math.floor(position / model.width) + dy;
      if (x < 0 || x >= model.width || y < 0 || y >= model.height) continue;
      const cell = y * model.width + x;
      if (model.walls.includes(cell)) {
        invalidUnchanged(board, 'move', direction, /rock blocks/);
        wallAttempt = true;
      } else if (!seen.has(cell)) {
        seen.add(cell);
        visited.push(act(board, 'move', direction));
      }
    }
  }
  assert.ok(wallAttempt, 'an actual reachable wall boundary is exercised');
  const outbound = roverSolution(model)[0];
  const inbound = { up: 'down', down: 'up', left: 'right', right: 'left' }[outbound];
  let full = initial;
  for (let index = 0; index < model.maxSteps; index++) full = act(full, 'move', index % 2 ? inbound : outbound);
  invalidUnchanged(full, 'move', outbound, /trail is full/);
  assert.equal(full.state.path.length, model.maxSteps + 1);
  assert.equal(act(full, 'undo').state.path.length, model.maxSteps);
});

test('Voyager uses fuel, supplies, cargo and credit constraints, with more than one feasible allocation', () => {
  const initial = make('class-2');
  const choices = cargoChoices(initial.model);
  assert.ok(choices.length > 1);
  const alternatives = choices.slice(0, 2).map(counts => {
    let activity = initial;
    counts.forEach((count, index) => {
      for (let amount = 0; amount < count; amount++) activity = act(activity, 'increase', initial.model.items[index].id);
    });
    return activity;
  });
  assert.ok(alternatives.every(isActivityComplete));
  assert.notDeepEqual(alternatives[0].state.counts, alternatives[1].state.counts);
  invalidUnchanged(initial, 'decrease', 'tank', /none.*remove/);
  invalidUnchanged(initial, 'increase', 'mystery-pack', /pack shown/);
  let cargoFull = initial;
  for (let count = 0; count < 3; count++) cargoFull = act(cargoFull, 'increase', 'tank');
  assert.equal(isActivityComplete(cargoFull), false, 'fuel without supplies is not enough');
  invalidUnchanged(cargoFull, 'increase', 'tank', /cargo capacity/);
  let creditsFull = initial;
  for (let count = 0; count < 4; count++) creditsFull = act(creditsFull, 'increase', 'cell');
  if (initial.model.budget === 14) creditsFull = act(creditsFull, 'increase', 'ration');
  else creditsFull = act(creditsFull, 'increase', 'cell');
  invalidUnchanged(creditsFull, 'increase', 'ration', /credits/);
  const less = act(alternatives[0], 'decrease', initial.model.items[alternatives[0].state.counts.findIndex(count => count > 0)].id);
  assert.deepEqual(act(less, 'undo'), alternatives[0]);
});

test('Star Navigator operates a directed graph, checks checkpoint/fuel and permits a wrong-goal route', () => {
  const initial = make('class-3');
  invalidUnchanged(initial, 'travel', 'signal', /no one-way link/);
  invalidUnchanged(initial, 'travel', 'base', /already in your route/);
  const routes = beaconRoutes(initial.model);
  assert.ok(routes.some(route => route.checkpoint));
  const bypass = routes.find(route => !route.checkpoint);
  assert.ok(bypass, 'the graph must offer a legal route that misses the checkpoint');
  let wrong = initial;
  for (const id of bypass.route.slice(1)) wrong = act(wrong, 'travel', id);
  assert.equal(isActivityComplete(wrong), false);
  assert.match(renderActivity(wrong), /missed the checkpoint/);
  let expensive = act(act(initial, 'travel', 'echo'), 'travel', 'relay');
  invalidUnchanged(expensive, 'travel', 'signal', /not enough fuel/);
  const before = expensive;
  expensive = act(expensive, 'travel', 'gate');
  assert.deepEqual(act(expensive, 'undo'), before);
  assert.equal(isActivityComplete(act(expensive, 'travel', 'signal')), true);
});

test('Research Station uses rectangle geometry, free relocation/removal, rotation and real side connectivity', () => {
  const initial = make('class-4');
  invalidUnchanged(initial, 'place', '0', /module first/);
  invalidUnchanged(initial, 'rotate', null, /module first/);
  let selected = act(initial, 'select', 'crew');
  invalidUnchanged(selected, 'place', String(initial.model.core), /overlap Core/);
  invalidUnchanged(selected, 'place', '24', /outside the grid/);
  const turned = act(selected, 'rotate');
  assert.equal(turned.state.turned, true);
  assert.deepEqual(act(turned, 'undo'), selected);
  const square = act(selected, 'select', 'lab');
  invalidUnchanged(square, 'rotate', null, /square/);
  const disconnected = stationArrangement(initial.model, false);
  assert.ok(disconnected);
  const wrong = placeStation(initial, disconnected);
  assert.equal(wrong.state.placements.filter(Boolean).length, 3);
  assert.equal(isActivityComplete(wrong), false, 'all modules fitting is not enough without a side-connected station');
  assert.match(renderActivity(wrong), /still need a side-to-side link/);
  const solved = solve(initial);
  const removed = act(solved, 'remove', 'lab');
  assert.equal(isActivityComplete(removed), false);
  assert.deepEqual(act(removed, 'undo'), solved);
  const filled = act(solved, 'select', 'crew');
  invalidUnchanged(filled, 'place', String(solved.state.placements[1].cell), /overlap/);
  const movedBase = act(act(initial, 'select', 'crew'), 'place', String(stationArrangement(initial.model)[0].cell));
  const current = movedBase.state.placements[0];
  const relocation = Array.from({ length: 25 }, (_, cell) => ({ cell, turned: false }))
    .find(placement => placement.cell !== current.cell && rectangleCells(initial.model, initial.model.modules[0], placement)
      ?.every(cell => cell !== initial.model.core));
  assert.ok(relocation);
  const moved = act(movedBase, 'place', String(relocation.cell));
  assert.equal(moved.state.placements[0].cell, relocation.cell);
  assert.deepEqual(act(moved, 'undo'), movedBase);
});

test('Galaxy Command combines distinct probes, compatibility, credits, energy and science without one answer key', () => {
  const initial = make('class-5');
  const choices = commandChoices(initial.model);
  const solutions = choices.filter(choice => choice.solved);
  assert.ok(solutions.length >= 2);
  for (const choice of solutions.slice(0, 2)) assert.equal(isActivityComplete(assignCommand(initial, choice.assignments)), true);
  const lowScience = choices.find(choice => choice.legal && !choice.solved);
  assert.ok(lowScience);
  const wrong = assignCommand(initial, lowScience.assignments);
  assert.equal(isActivityComplete(wrong), false);
  assert.match(renderActivity(wrong), /more science is needed/);
  invalidUnchanged(initial, 'assign', 'dust', /probe first/);
  invalidUnchanged(act(initial, 'select', 'spectra'), 'assign', 'dust', /cannot work/);
  let expensive = act(act(initial, 'select', 'scout'), 'assign', 'dust');
  expensive = act(act(expensive, 'select', 'mapper'), 'assign', 'ice');
  expensive = act(expensive, 'select', 'spectra');
  invalidUnchanged(expensive, 'assign', 'glow', /credit budget/);
  let highEnergy = act(act(initial, 'select', 'mapper'), 'assign', 'dust');
  highEnergy = act(act(highEnergy, 'select', 'spectra'), 'assign', 'ice');
  highEnergy = act(highEnergy, 'select', 'lifter');
  invalidUnchanged(highEnergy, 'assign', 'glow', /energy limit/);
  let moved = act(act(initial, 'select', 'scout'), 'assign', 'dust');
  moved = act(moved, 'assign', 'ice');
  assert.deepEqual(moved.state.assignments, [null, 'scout', null], 'moving a probe must remove its old assignment');
  const replaced = act(act(moved, 'select', 'mapper'), 'assign', 'ice');
  assert.deepEqual(replaced.state.assignments, [null, 'mapper', null], 'a sector has at most one probe');
  const removed = act(replaced, 'remove', 'ice');
  assert.deepEqual(removed.state.assignments, [null, null, null]);
  assert.deepEqual(act(removed, 'undo'), replaced);
});

test('validation rejects changed canonical models, grades, versions, unknown completion flags and non-JSON state', () => {
  for (const gradeId of GRADES) {
    const activity = partial(make(gradeId));
    const changed = copy(activity);
    changed.model.extra = true;
    assert.throws(() => validateActivity(changed), /model/);
    const changedValue = copy(activity);
    const key = Object.keys(changedValue.model).find(key => typeof changedValue.model[key] === 'number');
    if (key) changedValue.model[key]++;
    else changedValue.model.objects[0].type = 'star-from-corrupt-save';
    assert.throws(() => validateActivity(changedValue), /model/);
    const completed = copy(activity);
    completed.state.complete = true;
    assert.throws(() => validateActivity(completed), /state/);
    const flag = copy(activity);
    flag.complete = true;
    assert.throws(() => isActivityComplete(flag), /record/);
    const version = copy(activity);
    version.version = 2;
    assert.throws(() => validateActivity(version), /version/);
    const mismatched = copy(activity);
    mismatched.kind = 'different-board';
    assert.throws(() => validateActivity(mismatched), /kind/);
    const seedChanged = copy(activity);
    seedChanged.seed = 'x'.repeat(161);
    assert.throws(() => validateActivity(seedChanged), /seed/);
    assert.throws(() => renderActivity(completed), /state/);
  }
  const accessor = make('pp1');
  Object.defineProperty(accessor.state, 'selected', { get() { throw new Error('getter must not run'); }, enumerable: true });
  assert.throws(() => validateActivity(accessor), /Invalid activity state/);
  const sparse = make('pp2');
  delete sparse.state.slots[0];
  assert.throws(() => validateActivity(sparse), /slots/);
  const alteredArray = make('class-2');
  Object.setPrototypeOf(alteredArray.state.counts, { every: () => true });
  assert.throws(() => validateActivity(alteredArray), /counts/);
  const symbolic = make('pp1');
  symbolic.state[Symbol('hidden')] = 1;
  assert.throws(() => validateActivity(symbolic), /state/);
  const cyclic = make('pp1');
  cyclic.model.objects[0] = cyclic.model;
  assert.throws(() => validateActivity(cyclic), /model/);
});

test('each kind strictly rejects corrupt mutable state, including impossible saved paths and placements', () => {
  const cases = [
    ['pp1', activity => { activity.state.selected = ['part-1', 'part-1']; }],
    ['pp1', activity => { activity.state.selected = Array(100).fill('part-1'); }],
    ['pp1', activity => { activity.state.selected = ['alien']; }],
    ['pp2', activity => { activity.state.slots[0] = 'missing-shape'; }],
    ['pp2', activity => { activity.state.selected = 'missing-shape'; }],
    ['pp2', activity => { activity.state.slots.pop(); }],
    ['class-1', activity => { activity.state.path = [activity.model.start, activity.model.exit]; }],
    ['class-1', activity => { activity.state.path.push(activity.model.walls[0]); }],
    ['class-1', activity => { activity.state.path = Array(100).fill(activity.model.start); }],
    ['class-2', activity => { activity.state.counts[0] = -1; }],
    ['class-2', activity => { activity.state.counts = [5, 5, 5, 5]; }],
    ['class-2', activity => { activity.state.counts[0] = 0.5; }],
    ['class-3', activity => { activity.state.route = ['base', 'signal']; }],
    ['class-3', activity => { activity.state.route = ['base', 'echo', 'base']; }],
    ['class-3', activity => { activity.state.route = ['base', 'echo', 'relay', 'signal']; }],
    ['class-4', activity => { activity.state.placements[0] = { cell: activity.model.core, turned: false }; }],
    ['class-4', activity => { activity.state.placements[0] = { cell: 24, turned: false }; }],
    ['class-4', activity => { activity.state.placements[0] = { cell: -1, turned: false }; }],
    ['class-4', activity => { activity.state.placements[1] = { cell: 0, turned: true }; }],
    ['class-4', activity => { activity.state.turned = true; }],
    ['class-5', activity => { activity.state.assignments = ['scout', 'scout', null]; }],
    ['class-5', activity => { activity.state.assignments = ['spectra', null, null]; }],
    ['class-5', activity => { activity.state.assignments = ['mapper', 'spectra', 'lifter']; }],
    ['class-5', activity => { activity.state.assignments = ['scout', 'mapper', 'spectra']; }],
  ];
  for (const [grade, mutate] of cases) {
    const activity = make(grade);
    mutate(activity);
    assert.throws(() => validateActivity(activity), /Invalid activity/, `${grade}: ${mutate}`);
  }
  const overlap = solve(make('class-4'));
  overlap.state.placements[0] = { ...overlap.state.placements[1] };
  assert.throws(() => validateActivity(overlap), /overlap/);
  const badHistory = partial(make('pp2'));
  badHistory.state.history[0].slots = ['invalid'];
  assert.throws(() => validateActivity(badHistory), /slots/);
});

test('history is bounded, legal, serializable and resettable rather than an unbounded save log', () => {
  let activity = make('pp1');
  const id = activity.model.objects[0].id;
  for (let count = 0; count < 65; count++) activity = act(activity, 'toggle', id);
  assert.equal(activity.state.history.length, 24);
  assert.equal(validateActivity(JSON.parse(JSON.stringify(activity))).state.history.length, 24);
  const tooMuchHistory = copy(activity);
  tooMuchHistory.state.history.push(copy(tooMuchHistory.state.history[0]));
  assert.throws(() => validateActivity(tooMuchHistory), /history/);
  for (let count = 0; count < 24; count++) activity = act(activity, 'undo');
  invalidUnchanged(activity, 'undo', null, /no move/);
  assert.deepEqual(act(activity, 'reset'), make('pp1'));
  assert.ok(JSON.stringify(activity).length < 20000);
});

test('actions require typed bounded values and cannot smuggle other state through the reducer', () => {
  const initial = freeze(make('pp1'));
  for (const action of [
    null, {}, { type: 1 }, { type: 'toggle', value: 1 }, { type: 'toggle', value: undefined },
    { type: 'toggle', value: {} }, { type: 'toggle', value: 'part-1', complete: true },
    { type: 'x'.repeat(33), value: null }, { type: 'toggle', value: 'a'.repeat(81) },
  ]) assert.throws(() => applyActivityAction(initial, action), /activity button/);
  assert.deepEqual(applyActivityAction(initial, { type: 'reset' }), initial);
});

test('renderer exposes actual escaped givens, stable operable buttons, anonymous signals and computed feedback', () => {
  for (const gradeId of GRADES) {
    const activity = make(gradeId, '<img src=x onerror="bad">&\'', 'black_hole');
    const html = renderActivity(activity);
    assert.match(html, new RegExp(`<section class="sa-activity [^"]*" data-activity-kind="${activity.kind}"`));
    assert.match(html, /<h3>/);
    assert.match(html, /role="status" aria-live="polite"/);
    assert.match(html, /next signal/i);
    assert.doesNotMatch(html, /black_hole|A black hole|onerror|<img|<script|javascript:|https?:|data-complete=/i);
    const buttons = [...html.matchAll(/<button\b[^>]*>/g)].map(match => match[0]);
    assert.ok(buttons.length >= 4);
    for (const markup of buttons) {
      assert.match(markup, /type="button"/);
      assert.match(markup, /data-action="activity"/);
      assert.match(markup, /data-activity-op="[^"]+"/);
      assert.match(markup, /aria-label="[^"]+"/);
    }
    assert.ok(buttons.some(markup => /data-activity-op="reset"/.test(markup)));
    assert.ok(buttons.some(markup => /data-activity-op="undo"/.test(markup)));
    assert.doesNotMatch(html, /Board ready!/);
    assert.match(renderActivity(solve(activity)), /Board ready!/);
    const firstMoves = {
      pp1: ['toggle', activity.model.objects?.[0]?.id],
      pp2: ['select', activity.model.components?.[0]],
      'class-1': ['move', gradeId === 'class-1' ? roverSolution(activity.model)[0] : null],
      'class-2': ['increase', activity.model.items?.[0]?.id],
      'class-3': ['travel', activity.model.edges?.find(edge => edge.from === activity.model.start)?.to],
      'class-4': ['select', activity.model.modules?.[0]?.id],
      'class-5': ['select', activity.model.probes?.[0]?.id],
    };
    const [expectedOp, expectedValue] = firstMoves[gradeId];
    const enabledMove = buttons.find(markup => !/ disabled/.test(markup)
      && markup.includes(`data-activity-op="${expectedOp}"`) && markup.includes(`data-activity-value="${expectedValue}"`));
    assert.ok(enabledMove, `${gradeId}: a legal board operation is present as a real enabled button`);
    const op = /data-activity-op="([^"]+)"/.exec(enabledMove)[1];
    const value = /data-activity-value="([^"]+)"/.exec(enabledMove)?.[1] ?? null;
    assert.doesNotThrow(() => act(activity, op, value), `${gradeId}: the rendered legal move must operate the board`);
  }
  let parts = make('pp1');
  assert.ok(parts.model.objects.some(object => object.type === 'bolt'));
  assert.match(renderActivity(parts), /Nut &amp; bolt/);
  assert.doesNotMatch(renderActivity(parts), /Nut & bolt/);
  assert.match(renderActivity(parts), /aria-label="Nut &amp; bolt, part \d+"/);
  const pattern = make('pp2');
  const patternHtml = renderActivity(pattern);
  for (const component of pattern.model.cycle) assert.ok(patternHtml.includes(`data-activity-value="${component}"`));
  assert.equal((patternHtml.match(/data-activity-op="place"/g) ?? []).length, 4);
  const graph = make('class-3');
  const graphHtml = renderActivity(graph);
  for (const edge of graph.model.edges) assert.ok(graphHtml.includes(`· ${edge.cost} fuel`));
  assert.match(graphHtml, /one-way/);
  assert.equal((renderActivity(make('class-4')).match(/data-activity-op="place"/g) ?? []).length, 25);
  assert.match(renderActivity(make('class-5')), /<table[^>]*>[\s\S]*Credits[\s\S]*Energy[\s\S]*Science/);
});

test('compact station keeps dimensions and connection rules visible with optional native how-to', () => {
  const activity = make('class-4');
  const html = renderActivity(activity);
  const visible = html.replace(/<details\b[\s\S]*?<\/details>/g, '');
  assert.match(visible, /5 × 5 grid/);
  assert.match(visible, /no overlaps/);
  assert.match(visible, /Core by shared sides/);
  assert.match(visible, /through another module/);
  assert.match(visible, /Corners do not connect/);
  assert.match(visible, /top-left square/);
  assert.match(visible, /Sizes: across × down/);
  for (const module of activity.model.modules) {
    assert.ok(visible.includes(`<span>${module.width} × ${module.height}</span>`));
    assert.ok(visible.includes(`Area ${module.width * module.height}`));
    assert.ok(visible.includes(`aria-label="Remove station module ${module.name}"`));
  }
  assert.match(html, /<details class="sa-activity-station-help"><summary>/);
  const selected = act(activity, 'select', 'crew');
  const turned = act(selected, 'rotate');
  assert.match(renderActivity(turned), new RegExp(`Crew preview: <strong>1 across × ${activity.model.modules[0].width} down`));
  assert.deepEqual(turned.model, activity.model);
});

test('game-first boards keep real givens visible and move only detailed how-to into disclosures', () => {
  const text = markup => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  for (const grade of GRADES.filter(grade => grade !== 'class-4')) {
    const activity = make(grade);
    const { model } = activity;
    const html = renderActivity(activity);
    const details = html.match(/<details\b[\s\S]*?<\/details>/g);
    assert.equal(details.length, 1);
    assert.match(details[0], /<summary>How to play<\/summary>/);
    assert.doesNotMatch(details[0], /<button/);
    const visible = html.replace(/<details\b[\s\S]*?<\/details>/g, '');
    const goal = /<p class="sa-activity-instructions">([\s\S]*?)<\/p>/.exec(visible)[1];
    assert.ok(text(goal).split(' ').length <= 30, `${grade} has one short goal, not an instruction wall`);
    if (grade === 'pp1') {
      assert.ok(visible.includes(`Exactly ${model.targetCount}`));
      assert.match(visible, /Other kinds[\s\S]*Must be 0/);
    } else if (grade === 'pp2') {
      assert.match(visible, /repeating pattern/);
      assert.equal((visible.match(/data-activity-op="place"/g) ?? []).length, model.slotCount);
      assert.equal((visible.match(/class="sa-activity-number"/g) ?? []).length, model.givenCount);
    } else if (grade === 'class-1') {
      assert.ok(visible.includes(`${model.crates.length} repair crates`));
      assert.ok(visible.includes(`${model.maxSteps} moves max`));
      assert.match(visible, /Rocks block/);
      assert.match(visible, /1 square per move/);
      assert.match(visible, /Exit flag/);
    } else if (grade === 'class-2') {
      assert.ok(visible.includes(`Need at least ${model.requiredFuel}`));
      assert.ok(visible.includes(`Need at least ${model.requiredSupplies}`));
      assert.ok(visible.includes(`Max ${model.cargoCapacity} spaces`));
      assert.ok(visible.includes(`Max ${model.budget}`));
      assert.match(visible, /gain fuel \+ supplies; use cargo \+ credits/);
      for (const item of model.items) {
        assert.ok(visible.includes(`${item.name} per-pack values`));
      }
    } else if (grade === 'class-3') {
      assert.ok(visible.includes(`${model.fuelBudget} total`));
      assert.match(visible, /checkpoint[\s\S]*Must visit/);
      assert.match(visible, /One-way links · No repeat visits/);
      for (const edge of model.edges) assert.ok(visible.includes(`· ${edge.cost} fuel`));
    } else if (grade === 'class-5') {
      assert.match(visible, /different probe to each sector/);
      assert.ok(visible.includes(`Max ${model.budget}`));
      assert.ok(visible.includes(`Max ${model.energyCapacity}`));
      assert.ok(visible.includes(`Need at least ${model.requiredScience}`));
      assert.ok(visible.includes(`−${model.specialistSaving} energy, +${model.specialistScience} science`));
      assert.match(visible, /Listed sectors = compatible/);
      for (const probe of model.probes) {
        const row = new RegExp(`<button[^>]*data-activity-op="select"[^>]*data-activity-value="${probe.id}"[^>]*>([\\s\\S]*?)<\\/button>`).exec(visible)[1];
        for (const id of probe.compatible) {
          const name = model.sectors.find(sector => sector.id === id).name.replace(/ sector$/, '');
          assert.ok(text(row).includes(name), `${probe.name} visibly lists compatible sector ${name}`);
        }
        assert.ok(text(row).includes('★'));
      }
    }
  }
});

test('rover terrain is pictorial while retaining tile descriptions and one complete control set', () => {
  const activity = make('class-1');
  const html = renderActivity(activity);
  const tiles = [...html.matchAll(/<div class="sa-activity-rover-cell[^"]*"[^>]*>([\s\S]*?)<\/div>/g)];
  assert.equal(tiles.length, activity.model.width * activity.model.height);
  for (const [markup, body] of tiles) {
    assert.match(markup, /role="img" aria-label="Row \d+, column \d+:/);
    assert.equal(body.replace(/<[^>]*>/g, '').trim(), '', 'terrain uses pictures, not repeated Clear/Rock/Crate words');
  }
  for (const label of ['Rocks block', 'Collect', 'Finish', '1 square per move']) assert.ok(html.includes(label));
  assert.equal((html.match(/data-activity-op="move"/g) ?? []).length, 4);
  assert.equal((html.match(/data-activity-op="undo"/g) ?? []).length, 1);
  assert.equal((html.match(/data-activity-op="reset"/g) ?? []).length, 1);
  const solved = solve(activity);
  assert.equal(isActivityComplete(solved), true);
  assert.match(renderActivity(solved), /class="sa-activity-rover-pickup"/);
  assert.match(renderActivity(solved), /class="sa-activity-rover-flag"/);
});

test('activity CSS is scoped and preserves minimum targets, zero-minimum tracks and visible focus', () => {
  const css = readFileSync(new URL('../css/campaign-activities.css', import.meta.url), 'utf8');
  const selectors = css.replace(/@media[^{]+\{/g, '').match(/[^{}]+(?=\{)/g);
  assert.ok(selectors.every(selector => selector.trim().split(',').every(part => part.trim().startsWith('.sa-activity-'))));
  assert.match(css, /min-height: 46px/);
  assert.match(css, /min-width: 44px/);
  assert.match(css, /minmax\(0, 1fr\)/);
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(css, /position:\s*(fixed|absolute)|animation:|outline:\s*(none|0)/);
});

test('representative seed/destination sweep independently proves all seven boards feasible and replayable', () => {
  const seen = new Map(GRADES.map(grade => [grade, new Set()]));
  for (let index = 0; index < 12; index++) {
    const destination = DESTINATIONS[(index * 7) % DESTINATIONS.length].id;
    for (const grade of GRADES) {
      const activity = make(grade, `feasibility-${index}`, destination);
      seen.get(grade).add(JSON.stringify(activity.model));
      assert.equal(isActivityComplete(activity), false);
      const restored = JSON.parse(JSON.stringify(partial(activity)));
      assert.deepEqual(validateActivity(restored), restored);
      const solved = solve(activity);
      assert.equal(isActivityComplete(solved), true, `${grade}, ${destination}, seed ${index}`);
      assert.deepEqual(act(solved, 'reset'), activity);
      assert.ok(JSON.stringify(solved).length < 20000);
      if (grade === 'class-2') assert.ok(cargoChoices(activity.model).length > 1);
      if (grade === 'class-3') assert.ok(beaconRoutes(activity.model).some(route => !route.checkpoint));
      if (grade === 'class-5') assert.ok(commandChoices(activity.model).filter(choice => choice.solved).length >= 2);
    }
  }
  for (const [grade, models] of seen) assert.ok(models.size >= 2, `${grade} must change actual board givens across seeds`);
});
