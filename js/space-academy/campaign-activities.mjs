import { seededRandom } from '../seeded-random.mjs';
import { DESTINATIONS } from './destinations.mjs';

const KINDS = Object.freeze({
  pp1: 'picture-collection',
  pp2: 'pattern-blueprint',
  'class-1': 'rover-rescue',
  'class-2': 'probe-loading',
  'class-3': 'beacon-route',
  'class-4': 'station-layout',
  'class-5': 'galaxy-command',
});
const DESTINATION_IDS = new Set(DESTINATIONS.map(destination => destination.id));
const HISTORY_LIMIT = 24;
const TITLES = {
  'picture-collection': 'Moon Camp · Picture collection',
  'pattern-blueprint': 'Planet Hopper · Pattern blueprint',
  'rover-rescue': 'Mars Rover Rescue · Repair trail',
  'probe-loading': 'Outer Planet Voyager · Load the probe',
  'beacon-route': 'Star Navigator · Plan a beacon route',
  'station-layout': 'Nebula Research Station',
  'galaxy-command': 'Galaxy Command · Assign the probes',
};
const PART_NAMES = {
  rock: ['Moon rock', 'moon rocks'],
  bolt: ['Nut & bolt', 'nuts & bolts'],
  star: ['Star', 'stars'],
};
const SHAPE_NAMES = {
  'round-dot': 'Dotted circle',
  'striped-square': 'Striped square',
  triangle: 'Triangle',
  star: 'Star',
};
const BOARD_KEYS = {
  'picture-collection': ['selected'],
  'pattern-blueprint': ['selected', 'slots'],
  'rover-rescue': ['path'],
  'probe-loading': ['counts'],
  'beacon-route': ['route'],
  'station-layout': ['selected', 'turned', 'placements'],
  'galaxy-command': ['selected', 'assignments'],
};
const HAS_HISTORY = new Set([
  'picture-collection', 'pattern-blueprint', 'probe-loading', 'station-layout', 'galaxy-command',
]);

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const clone = value => JSON.parse(JSON.stringify(value));
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function hasKeys(value, keys) {
  return plain(value) && Reflect.ownKeys(value).length === keys.length && keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor?.enumerable && Object.hasOwn(descriptor, 'value');
  });
}
function record(value, keys, label) {
  if (!hasKeys(value, keys)) throw new Error(`Invalid activity ${label}.`);
}
function arrayShape(value, min, max) {
  return Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype && integer(value.length, min, max)
    && Reflect.ownKeys(value).length === value.length + 1
    && Array.from({ length: value.length }, (_, index) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      return descriptor?.enumerable && Object.hasOwn(descriptor, 'value');
    }).every(Boolean);
}
function array(value, min, max, label) {
  if (!arrayShape(value, min, max)) throw new Error(`Invalid activity ${label}.`);
}
function sameJSON(actual, expected) {
  if (Array.isArray(expected)) {
    return arrayShape(actual, expected.length, expected.length)
      && expected.every((value, index) => sameJSON(actual[index], value));
  }
  if (plain(expected)) {
    const keys = Object.keys(expected);
    return hasKeys(actual, keys) && keys.every(key => sameJSON(actual[key], expected[key]));
  }
  return actual === expected;
}
function identity(gradeId, destinationId, seed) {
  if (typeof gradeId !== 'string' || !Object.hasOwn(KINDS, gradeId)) throw new Error('Invalid activity grade.');
  if (typeof destinationId !== 'string' || !DESTINATION_IDS.has(destinationId)) throw new Error('Invalid activity destination.');
  if (typeof seed !== 'string' || seed.length < 1 || seed.length > 160) throw new Error('Invalid activity seed (use 1–160 characters).');
}
function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}
function modelFor(gradeId, destinationId, seed) {
  const random = seededRandom(JSON.stringify([gradeId, destinationId, seed]));
  const pick = values => values[Math.floor(random() * values.length)];
  switch (gradeId) {
    case 'pp1': {
      const targetType = pick(['rock', 'bolt']);
      const targetCount = pick([3, 4]);
      const types = shuffle([
        ...Array(targetCount + 1).fill(targetType),
        targetType === 'rock' ? 'bolt' : 'rock', 'star', 'star',
      ], random);
      return { targetType, targetCount, objects: types.map((type, index) => ({ id: `part-${index + 1}`, type })) };
    }
    case 'pp2': {
      const components = shuffle(Object.keys(SHAPE_NAMES), random);
      const cycle = pick([
        [components[0], components[1]],
        [components[0], components[0], components[1]],
        [components[0], components[1], components[2]],
      ]);
      return { components, cycle, givenCount: cycle.length * 2, slotCount: 4 };
    }
    case 'class-1': {
      const safe = [0, 1, 5, 9, 10, 11, 15];
      const rotation = pick([0, 1, 2, 3]);
      const mirror = random() < 0.5;
      const transform = cell => {
        let x = cell % 4;
        let y = Math.floor(cell / 4);
        if (mirror) x = 3 - x;
        for (let turn = 0; turn < rotation; turn++) [x, y] = [3 - y, x];
        return y * 4 + x;
      };
      return {
        width: 4, height: 4, start: transform(0), exit: transform(15),
        walls: shuffle(Array.from({ length: 16 }, (_, index) => index).filter(cell => !safe.includes(cell)), random)
          .slice(0, pick([3, 4, 5])).map(transform).sort((a, b) => a - b),
        crates: shuffle(safe.slice(1, -1), random).slice(0, 2).map(transform).sort((a, b) => a - b),
        maxSteps: 48,
      };
    }
    case 'class-2':
      return {
        items: [
          { id: 'tank', name: 'Fuel tank', fuel: 5, supplies: 0, cargo: 3, cost: 4 },
          { id: 'cell', name: 'Compact cell', fuel: 3, supplies: 0, cargo: 1, cost: 3 },
          { id: 'ration', name: 'Supply kit', fuel: 0, supplies: 2, cargo: 1, cost: 2 },
          { id: 'combo', name: 'Combo pack', fuel: 2, supplies: 1, cargo: 2, cost: 2 },
        ],
        requiredFuel: pick([8, 9, 10]), requiredSupplies: pick([4, 5, 6]),
        cargoCapacity: pick([9, 10]), budget: pick([14, 15]), maxPerItem: 5,
      };
    case 'class-3': {
      const a = pick([2, 3]);
      const c = pick([2, 3]);
      const g = pick([1, 2]);
      const i = pick([2, 3]);
      return {
        nodes: [
          { id: 'base', name: 'Base' }, { id: 'echo', name: 'Echo' },
          { id: 'flare', name: 'Flare' }, { id: 'relay', name: 'Relay' },
          { id: 'gate', name: 'Gate' }, { id: 'signal', name: 'Next signal' },
        ],
        edges: [
          { from: 'base', to: 'echo', cost: a }, { from: 'base', to: 'flare', cost: pick([1, 2]) },
          { from: 'echo', to: 'relay', cost: c }, { from: 'echo', to: 'gate', cost: 1 },
          { from: 'flare', to: 'relay', cost: c + pick([2, 3]) }, { from: 'flare', to: 'gate', cost: pick([1, 2]) },
          { from: 'relay', to: 'gate', cost: g }, { from: 'relay', to: 'signal', cost: g + i + 2 },
          { from: 'gate', to: 'signal', cost: i },
        ],
        start: 'base', end: 'signal', checkpoint: 'relay', fuelBudget: a + c + g + i + pick([0, 1]),
      };
    }
    case 'class-4':
      return {
        width: 5, height: 5, core: pick([7, 11, 12, 13, 17]),
        modules: [
          { id: 'crew', name: 'Crew', width: pick([2, 3]), height: 1 },
          { id: 'lab', name: 'Lab', width: 2, height: 2 },
          { id: 'power', name: 'Power', width: pick([2, 3]), height: 1 },
        ],
      };
    case 'class-5':
      return {
        sectors: [
          { id: 'dust', name: 'Dust sector' }, { id: 'ice', name: 'Ice sector' }, { id: 'glow', name: 'Glow sector' },
        ],
        probes: [
          { id: 'scout', name: 'Scout', cost: 3, energy: 2, science: 3, speciality: 'dust', compatible: ['dust', 'ice', 'glow'] },
          { id: 'mapper', name: 'Mapper', cost: 4, energy: 3, science: 4, speciality: 'ice', compatible: ['dust', 'ice', 'glow'] },
          { id: 'spectra', name: 'Spectra', cost: 6, energy: 4, science: 6, speciality: 'glow', compatible: ['ice', 'glow'] },
          { id: 'lifter', name: 'Lifter', cost: 2, energy: 4, science: 3, speciality: 'dust', compatible: ['dust', 'glow'] },
        ],
        budget: 12, energyCapacity: pick([8, 9]), requiredScience: pick([14, 15]),
        specialistScience: 2, specialistSaving: 1,
      };
    default:
      throw new Error('Invalid activity grade.');
  }
}
function initialState(kind, model) {
  switch (kind) {
    case 'picture-collection': return { selected: [], history: [] };
    case 'pattern-blueprint': return { selected: null, slots: Array(model.slotCount).fill(null), history: [] };
    case 'rover-rescue': return { path: [model.start] };
    case 'probe-loading': return { counts: model.items.map(() => 0), history: [] };
    case 'beacon-route': return { route: [model.start] };
    case 'station-layout': return { selected: null, turned: false, placements: model.modules.map(() => null), history: [] };
    case 'galaxy-command': return { selected: null, assignments: model.sectors.map(() => null), history: [] };
    default: throw new Error('Invalid activity kind.');
  }
}

export function createActivity(options) {
  record(options, ['gradeId', 'destinationId', 'seed'], 'options');
  const { gradeId, destinationId, seed } = options;
  identity(gradeId, destinationId, seed);
  const kind = KINDS[gradeId];
  const model = modelFor(gradeId, destinationId, seed);
  return { version: 1, gradeId, destinationId, seed, kind, model, state: initialState(kind, model) };
}

function loadingTotals(model, counts) {
  return model.items.reduce((totals, item, index) => {
    for (const key of ['fuel', 'supplies', 'cargo', 'cost']) totals[key] += item[key] * counts[index];
    return totals;
  }, { fuel: 0, supplies: 0, cargo: 0, cost: 0 });
}
function routeCost(model, route) {
  return route.slice(1).reduce((total, node, index) => total
    + model.edges.find(edge => edge.from === route[index] && edge.to === node).cost, 0);
}
function moduleCells(model, module, placement) {
  const width = placement.turned ? module.height : module.width;
  const height = placement.turned ? module.width : module.height;
  const x = placement.cell % model.width;
  const y = Math.floor(placement.cell / model.width);
  if (!integer(placement.cell, 0, model.width * model.height - 1) || x + width > model.width || y + height > model.height) return null;
  return Array.from({ length: height }, (_, row) => Array.from({ length: width }, (_, column) =>
    (y + row) * model.width + x + column)).flat();
}
function stationOccupied(model, placements, omit = -1) {
  const occupied = new Map([[model.core, 'Core']]);
  placements.forEach((placement, index) => {
    if (placement && index !== omit) {
      for (const cell of moduleCells(model, model.modules[index], placement)) occupied.set(cell, model.modules[index].name);
    }
  });
  return occupied;
}
function linkedCells(model, placements) {
  const occupied = stationOccupied(model, placements);
  const seen = new Set([model.core]);
  const queue = [model.core];
  for (let index = 0; index < queue.length; index++) {
    const cell = queue[index];
    const x = cell % model.width;
    const y = Math.floor(cell / model.width);
    const neighbours = [
      ...(x > 0 ? [cell - 1] : []), ...(x + 1 < model.width ? [cell + 1] : []),
      ...(y > 0 ? [cell - model.width] : []), ...(y + 1 < model.height ? [cell + model.width] : []),
    ];
    for (const next of neighbours) if (occupied.has(next) && !seen.has(next)) {
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}
function probeOutcome(model, probe, sector) {
  const specialist = probe.speciality === sector.id;
  return {
    cost: probe.cost,
    energy: probe.energy - (specialist ? model.specialistSaving : 0),
    science: probe.science + (specialist ? model.specialistScience : 0),
  };
}
function commandTotals(model, assignments) {
  return assignments.reduce((totals, id, index) => {
    if (id !== null) {
      const outcome = probeOutcome(model, model.probes.find(probe => probe.id === id), model.sectors[index]);
      for (const key of ['cost', 'energy', 'science']) totals[key] += outcome[key];
    }
    return totals;
  }, { cost: 0, energy: 0, science: 0 });
}
function validateState(kind, model, state, withHistory = HAS_HISTORY.has(kind)) {
  record(state, [...BOARD_KEYS[kind], ...(withHistory ? ['history'] : [])], 'state');
  switch (kind) {
    case 'picture-collection':
      array(state.selected, 0, model.objects.length, 'collection');
      if (new Set(state.selected).size !== state.selected.length
        || !state.selected.every(id => model.objects.some(object => object.id === id))) throw new Error('Invalid activity selected parts.');
      break;
    case 'pattern-blueprint':
      array(state.slots, model.slotCount, model.slotCount, 'pattern slots');
      if (!(state.selected === null || model.components.includes(state.selected))
        || !state.slots.every(id => id === null || model.components.includes(id))) throw new Error('Invalid activity pattern components.');
      break;
    case 'rover-rescue': {
      array(state.path, 1, model.maxSteps + 1, 'rover path');
      if (state.path[0] !== model.start) throw new Error('Invalid activity rover start.');
      state.path.forEach((cell, index) => {
        if (!integer(cell, 0, model.width * model.height - 1) || model.walls.includes(cell)) throw new Error('Invalid activity rover square.');
        if (index) {
          const previous = state.path[index - 1];
          if (Math.abs(cell % model.width - previous % model.width)
            + Math.abs(Math.floor(cell / model.width) - Math.floor(previous / model.width)) !== 1) throw new Error('Invalid activity rover path: no teleporting.');
        }
      });
      break;
    }
    case 'probe-loading': {
      array(state.counts, model.items.length, model.items.length, 'cargo counts');
      if (!state.counts.every(count => integer(count, 0, model.maxPerItem))) throw new Error('Invalid activity cargo count.');
      const totals = loadingTotals(model, state.counts);
      if (totals.cost > model.budget || totals.cargo > model.cargoCapacity) throw new Error('Invalid activity cargo capacity or budget.');
      break;
    }
    case 'beacon-route':
      array(state.route, 1, model.nodes.length, 'beacon route');
      if (state.route[0] !== model.start || new Set(state.route).size !== state.route.length
        || !state.route.every(id => model.nodes.some(node => node.id === id))) throw new Error('Invalid activity beacon route.');
      if (!state.route.slice(1).every((id, index) =>
        model.edges.some(edge => edge.from === state.route[index] && edge.to === id))) throw new Error('Invalid activity route connection.');
      if (routeCost(model, state.route) > model.fuelBudget) throw new Error('Invalid activity route fuel budget.');
      break;
    case 'station-layout': {
      if (!(state.selected === null || model.modules.some(module => module.id === state.selected))
        || typeof state.turned !== 'boolean' || (state.selected === null && state.turned)) throw new Error('Invalid activity module selection.');
      const selected = model.modules.find(module => module.id === state.selected);
      if (selected?.width === selected?.height && state.turned) throw new Error('Invalid activity square rotation.');
      array(state.placements, model.modules.length, model.modules.length, 'module placements');
      const occupied = new Set([model.core]);
      state.placements.forEach((placement, index) => {
        if (placement === null) return;
        record(placement, ['cell', 'turned'], 'module placement');
        const module = model.modules[index];
        if (typeof placement.turned !== 'boolean' || (module.width === module.height && placement.turned)) throw new Error('Invalid activity module rotation.');
        const cells = moduleCells(model, module, placement);
        if (!cells || cells.some(cell => occupied.has(cell))) throw new Error('Invalid activity module bounds or overlap.');
        cells.forEach(cell => occupied.add(cell));
      });
      break;
    }
    case 'galaxy-command': {
      if (!(state.selected === null || model.probes.some(probe => probe.id === state.selected))) throw new Error('Invalid activity probe selection.');
      array(state.assignments, model.sectors.length, model.sectors.length, 'sector assignments');
      const used = new Set();
      state.assignments.forEach((id, index) => {
        if (id === null) return;
        const probe = model.probes.find(candidate => candidate.id === id);
        if (!probe || used.has(id) || !probe.compatible.includes(model.sectors[index].id)) throw new Error('Invalid activity probe assignment or compatibility.');
        used.add(id);
      });
      const totals = commandTotals(model, state.assignments);
      if (totals.cost > model.budget || totals.energy > model.energyCapacity) throw new Error('Invalid activity command budget or energy.');
      break;
    }
    default: throw new Error('Invalid activity kind.');
  }
  if (withHistory) {
    array(state.history, 0, HISTORY_LIMIT, 'undo history');
    for (const previous of state.history) validateState(kind, model, previous, false);
  }
}

export function validateActivity(activity) {
  record(activity, ['version', 'gradeId', 'destinationId', 'seed', 'kind', 'model', 'state'], 'record');
  if (activity.version !== 1) throw new Error('Invalid activity version.');
  identity(activity.gradeId, activity.destinationId, activity.seed);
  if (activity.kind !== KINDS[activity.gradeId]) throw new Error('Invalid activity kind for grade.');
  if (!sameJSON(activity.model, modelFor(activity.gradeId, activity.destinationId, activity.seed))) throw new Error('Invalid activity model: its givens have changed.');
  validateState(activity.kind, activity.model, activity.state);
  return activity;
}

function remember(kind, state) {
  const previous = Object.fromEntries(BOARD_KEYS[kind].map(key => [key, state[key]]));
  state.history = [...state.history, clone(previous)].slice(-HISTORY_LIMIT);
}
function indexValue(value, length, label) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,2})$/.test(value) || !integer(Number(value), 0, length - 1)) {
    throw new Error(`Choose a ${label} that is on this board.`);
  }
  return Number(value);
}
function chosenIndex(items, value, label) {
  const index = items.findIndex(item => item.id === value);
  if (index < 0) throw new Error(`Choose a ${label} shown on this board.`);
  return index;
}
function noValue(value) {
  if (value !== null) throw new Error('This button does not need an extra choice.');
}
function actionInput(action) {
  if (!plain(action) || !Object.hasOwn(action, 'type')
    || !hasKeys(action, Object.hasOwn(action, 'value') ? ['type', 'value'] : ['type'])
    || typeof action.type !== 'string' || action.type.length > 32
    || (Object.hasOwn(action, 'value') && action.value !== null && (typeof action.value !== 'string' || action.value.length > 80))) {
    throw new Error('Choose an activity button to make your move.');
  }
  return { type: action.type, value: Object.hasOwn(action, 'value') ? action.value : null };
}
function unsupported() {
  throw new Error('That move is not available here. Use one of this board’s buttons.');
}

export function applyActivityAction(activity, action) {
  validateActivity(activity);
  const { type, value } = actionInput(action);
  const next = clone(activity);
  const { kind, model, state } = next;
  if (type === 'reset') {
    noValue(value);
    next.state = initialState(kind, model);
    return next;
  }
  if (type === 'undo') {
    noValue(value);
    if (HAS_HISTORY.has(kind)) {
      if (!state.history.length) throw new Error('There is no move to undo yet.');
      const previous = state.history.pop();
      next.state = { ...previous, history: state.history };
    } else {
      const path = kind === 'rover-rescue' ? state.path : state.route;
      if (path.length <= 1) throw new Error('There is no move to undo yet.');
      path.pop();
    }
    return next;
  }
  switch (kind) {
    case 'picture-collection': {
      if (type !== 'toggle') unsupported();
      chosenIndex(model.objects, value, 'part');
      remember(kind, state);
      state.selected = state.selected.includes(value) ? state.selected.filter(id => id !== value) : [...state.selected, value];
      break;
    }
    case 'pattern-blueprint':
      if (type === 'select') {
        if (!model.components.includes(value)) throw new Error('Choose a shape from the component tray.');
        if (state.selected === value) throw new Error('That component is already selected. Tap a slot to place it.');
        remember(kind, state);
        state.selected = value;
      } else if (type === 'place' || type === 'remove') {
        const index = indexValue(value, model.slotCount, 'pattern slot');
        if (type === 'place' && state.selected === null) throw new Error('Choose a component from the tray first, then tap a slot.');
        const component = type === 'remove' ? null : state.selected;
        if (state.slots[index] === component) throw new Error(type === 'remove'
          ? 'That slot is already empty.' : 'That shape is already in this slot. Choose another shape to replace it.');
        remember(kind, state);
        state.slots[index] = component;
      } else unsupported();
      break;
    case 'rover-rescue': {
      if (type !== 'move') unsupported();
      const deltas = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      if (!Object.hasOwn(deltas, value)) throw new Error('Choose Up, Down, Left or Right.');
      const current = state.path.at(-1);
      const x = current % model.width + deltas[value][0];
      const y = Math.floor(current / model.width) + deltas[value][1];
      if (x < 0 || x >= model.width || y < 0 || y >= model.height) throw new Error('That move leaves the map. Try another direction.');
      const cell = y * model.width + x;
      if (model.walls.includes(cell)) throw new Error('A rock blocks that square. Try another direction.');
      if (state.path.length > model.maxSteps) throw new Error('Your trail is full. Undo some moves or reset to make a new plan. There is no timer.');
      state.path.push(cell);
      break;
    }
    case 'probe-loading': {
      if (type !== 'increase' && type !== 'decrease') unsupported();
      const index = chosenIndex(model.items, value, 'supply pack');
      if (type === 'decrease' && state.counts[index] === 0) throw new Error('There are none of those packs to remove.');
      if (type === 'increase' && state.counts[index] === model.maxPerItem) throw new Error(`You can load at most ${model.maxPerItem} of each pack.`);
      const counts = [...state.counts];
      counts[index] += type === 'increase' ? 1 : -1;
      const totals = loadingTotals(model, counts);
      if (totals.cargo > model.cargoCapacity) throw new Error(`That would exceed the cargo capacity of ${model.cargoCapacity}. Remove a pack first.`);
      if (totals.cost > model.budget) throw new Error(`That would cost more than ${model.budget} credits. Remove a pack first.`);
      remember(kind, state);
      state.counts = counts;
      break;
    }
    case 'beacon-route': {
      if (type !== 'travel') unsupported();
      chosenIndex(model.nodes, value, 'beacon');
      if (state.route.includes(value)) throw new Error('That beacon is already in your route. Undo to try a different route.');
      const current = state.route.at(-1);
      const edge = model.edges.find(candidate => candidate.from === current && candidate.to === value);
      if (!edge) throw new Error('There is no one-way link from your current beacon to that beacon. Follow an outgoing arrow.');
      if (routeCost(model, state.route) + edge.cost > model.fuelBudget) throw new Error('There is not enough fuel for that link. Undo to plan a shorter route.');
      state.route.push(value);
      break;
    }
    case 'station-layout':
      if (type === 'select') {
        const index = chosenIndex(model.modules, value, 'module');
        if (state.selected === value) throw new Error('That module is already selected. Choose its top-left square, or turn its preview.');
        remember(kind, state);
        state.selected = value;
        state.turned = state.placements[index]?.turned ?? false;
      } else if (type === 'rotate') {
        noValue(value);
        const module = model.modules.find(candidate => candidate.id === state.selected);
        if (!module) throw new Error('Choose a module first, then turn its preview.');
        if (module.width === module.height) throw new Error('This module is square, so turning does not change its shape.');
        remember(kind, state);
        state.turned = !state.turned;
      } else if (type === 'place') {
        const cell = indexValue(value, model.width * model.height, 'square');
        const index = model.modules.findIndex(module => module.id === state.selected);
        if (index < 0) throw new Error('Choose a station module first, then tap its top-left square.');
        const placement = { cell, turned: state.turned };
        const cells = moduleCells(model, model.modules[index], placement);
        if (!cells) throw new Error('That rectangle would go outside the grid. Try a different top-left square or turn the preview.');
        const occupied = stationOccupied(model, state.placements, index);
        const overlap = cells.find(candidate => occupied.has(candidate));
        if (overlap !== undefined) throw new Error(`That would overlap ${occupied.get(overlap)}. Choose free squares or move the other module.`);
        if (sameJSON(placement, state.placements[index])) throw new Error('That module is already in this position. Choose another square to move it.');
        remember(kind, state);
        state.placements[index] = placement;
      } else if (type === 'remove') {
        const index = chosenIndex(model.modules, value, 'module');
        if (state.placements[index] === null) throw new Error('That module has not been placed yet.');
        remember(kind, state);
        state.placements[index] = null;
      } else unsupported();
      break;
    case 'galaxy-command':
      if (type === 'select') {
        chosenIndex(model.probes, value, 'probe');
        if (state.selected === value) throw new Error('That probe is already selected. Choose a sector for it.');
        remember(kind, state);
        state.selected = value;
      } else if (type === 'assign') {
        const index = chosenIndex(model.sectors, value, 'sector');
        const probe = model.probes.find(candidate => candidate.id === state.selected);
        if (!probe) throw new Error('Choose a probe first, then choose its sector.');
        if (!probe.compatible.includes(value)) throw new Error(`${probe.name} cannot work in that sector. Check its compatible sectors.`);
        if (state.assignments[index] === probe.id) throw new Error('That probe is already assigned here. Choose a different sector or probe.');
        const assignments = state.assignments.map(id => id === probe.id ? null : id);
        assignments[index] = probe.id;
        const totals = commandTotals(model, assignments);
        if (totals.cost > model.budget) throw new Error('That assignment would exceed the credit budget. Remove a probe or choose a cheaper one.');
        if (totals.energy > model.energyCapacity) throw new Error('That assignment would exceed the energy limit. Try a specialist sector or a lower-energy probe.');
        remember(kind, state);
        state.assignments = assignments;
      } else if (type === 'remove') {
        const index = chosenIndex(model.sectors, value, 'sector');
        if (state.assignments[index] === null) throw new Error('There is no probe in that sector to remove.');
        remember(kind, state);
        state.assignments[index] = null;
      } else unsupported();
      break;
    default: unsupported();
  }
  validateState(kind, model, next.state);
  return next;
}

function complete(activity) {
  const { kind, model, state } = activity;
  switch (kind) {
    case 'picture-collection':
      return state.selected.length === model.targetCount
        && state.selected.every(id => model.objects.find(object => object.id === id).type === model.targetType);
    case 'pattern-blueprint':
      return state.slots.every((id, index) => id === model.cycle[(model.givenCount + index) % model.cycle.length]);
    case 'rover-rescue':
      return state.path.at(-1) === model.exit && model.crates.every(cell => state.path.includes(cell));
    case 'probe-loading': {
      const totals = loadingTotals(model, state.counts);
      return totals.fuel >= model.requiredFuel && totals.supplies >= model.requiredSupplies
        && totals.cargo <= model.cargoCapacity && totals.cost <= model.budget;
    }
    case 'beacon-route':
      return state.route.at(-1) === model.end && state.route.includes(model.checkpoint)
        && routeCost(model, state.route) <= model.fuelBudget;
    case 'station-layout':
      return state.placements.every(placement => placement !== null)
        && linkedCells(model, state.placements).size === stationOccupied(model, state.placements).size;
    case 'galaxy-command': {
      const totals = commandTotals(model, state.assignments);
      return state.assignments.every(id => id !== null) && totals.cost <= model.budget
        && totals.energy <= model.energyCapacity && totals.science >= model.requiredScience;
    }
    default: return false;
  }
}

export function isActivityComplete(activity) {
  validateActivity(activity);
  return complete(activity);
}

function button(type, value, body, label, { pressed, disabled = false, className = '', description = '' } = {}) {
  return `<button type="button" class="sa-activity-button ${escape(className)}" data-action="activity" data-activity-op="${escape(type)}"${value === null ? '' : ` data-activity-value="${escape(value)}"`} aria-label="${escape(label)}"${pressed === undefined ? '' : ` aria-pressed="${pressed}"`}${description ? ` aria-description="${escape(description)}"` : ''}${disabled ? ' disabled' : ''}>${body}</button>`;
}
function icon(type, label) {
  const shapes = {
    rock: '<path d="m10 42 5-23 20-9 16 16 3 21-23 8Z" fill="#b8b9bd"/><path d="m15 19 16 14 20-7M31 33v22" fill="none"/>',
    bolt: '<path d="m17 10 14-5 14 10-1 17-14 6-14-9Z" fill="#f6cb7d"/><circle cx="30" cy="21" r="7" fill="#fffaf0"/><path d="m29 37 12-5 12 20-12 7Z" fill="#b8b9bd"/><path d="m34 40 11-5m-6 13 10-5"/>',
    star: '<path d="m32 5 8 17 19 3-14 14 3 19-16-9-17 9 4-19L5 25l19-3Z" fill="#f6cb7d"/>',
    'round-dot': '<circle cx="32" cy="32" r="24" fill="#9cddcf"/><circle cx="32" cy="32" r="6" fill="#23334f"/>',
    'striped-square': '<rect x="9" y="9" width="46" height="46" rx="3" fill="#c9b8eb"/><path d="M12 42 42 12M23 52 52 23M11 26 26 11" stroke-width="4"/>',
    triangle: '<path d="M32 7 59 55H5Z" fill="#f5b49b"/>',
    crate: '<rect x="10" y="11" width="44" height="43" rx="5" fill="#f6cb7d"/><path d="M10 25h44M25 11v43M39 11v43"/><path d="M20 32h24v15H20Z" fill="#fffaf0"/>',
    rover: '<rect x="9" y="24" width="46" height="24" rx="6" fill="#9cddcf"/><path d="M24 24V14h18v10M33 14V7"/><circle cx="19" cy="50" r="7" fill="#23334f"/><circle cx="46" cy="50" r="7" fill="#23334f"/><circle cx="23" cy="34" r="3" fill="#23334f"/>',
    exit: '<path d="M17 57V8m0 1h35L42 22l10 13H17" fill="#9cddcf"/><path d="m22 20 6 6 12-12" fill="none"/>',
  };
  return `<svg class="sa-activity-icon" viewBox="0 0 64 64" role="img" aria-label="${escape(label)}" focusable="false" fill="none" stroke="#23334f" stroke-width="2.5" stroke-linejoin="round">${shapes[type]}</svg>`;
}
function status(activity, message) {
  return `<p class="sa-activity-status${complete(activity) ? ' sa-activity-status-ready' : ''}" role="status" aria-live="polite" aria-atomic="true">${escape(complete(activity) ? 'Board ready! You can continue to the next signal. ' : '')}${escape(message)}</p>`;
}
function hud(items) {
  return `<dl class="sa-activity-hud sa-activity-hud-${items.length}" aria-label="Board progress and limits">${items.map(([label, value, rule]) =>
    `<div><dt>${escape(label)}</dt><dd><strong>${escape(value)}</strong><span>${escape(rule)}</span></dd></div>`).join('')}</dl>`;
}
function help(body) {
  return `<details class="sa-activity-help"><summary>How to play</summary>${body}</details>`;
}
function footer(activity) {
  const { kind, state } = activity;
  const canUndo = HAS_HISTORY.has(kind) ? state.history.length > 0 : (state.path ?? state.route).length > 1;
  const note = kind === 'station-layout'
    ? `No timer or penalties. Change your plan or reset for free. Undo keeps your last ${HISTORY_LIMIT} actions.`
    : `Untimed · Free undo & reset${HAS_HISTORY.has(kind) ? ` · Last ${HISTORY_LIMIT} actions` : ''}`;
  return `<div class="sa-activity-tools">${button('undo', null, 'Undo', 'Undo last activity action', { disabled: !canUndo })}${button('reset', null, 'Reset board', 'Reset this activity board')}</div><p class="sa-activity-note">${escape(note)}</p>`;
}
function renderCollection(activity) {
  const { model, state } = activity;
  const correct = state.selected.filter(id => model.objects.find(object => object.id === id).type === model.targetType).length;
  const wrong = state.selected.length - correct;
  return `<p class="sa-activity-instructions">${icon(model.targetType, `Requested part: ${PART_NAMES[model.targetType][0]}`)}<span>Pack exactly <strong>${model.targetCount} ${escape(PART_NAMES[model.targetType][1])}</strong>.</span></p>
    ${hud([['Packed', state.selected.length, `Exactly ${model.targetCount}`], ['Other kinds', wrong, 'Must be 0']])}
    <div class="sa-activity-collection" role="group" aria-label="Parts to collect">${model.objects.map((object, index) => {
    const selected = state.selected.includes(object.id);
    return button('toggle', object.id, `${icon(object.type, `${PART_NAMES[object.type][0]}, part ${index + 1}`)}<strong>${escape(PART_NAMES[object.type][0])}</strong><span class="sa-activity-chip">${selected ? '✓ Packed' : '+ Pack'}</span>`,
      `Toggle part ${index + 1}: ${PART_NAMES[object.type][0]}`, { pressed: selected, className: 'sa-activity-object' });
  }).join('')}</div>
    ${status(activity, wrong ? `Put back ${wrong} item${wrong === 1 ? '' : 's'} of the other kinds.`
    : correct > model.targetCount ? `Put back ${correct - model.targetCount} extra item${correct - model.targetCount === 1 ? '' : 's'}.`
      : correct < model.targetCount ? `Find ${model.targetCount - correct} more ${PART_NAMES[model.targetType][1]}.` : 'Collection packed.')}
    ${help('<p>Tap a picture to pack it for the next signal. Tap a packed picture again to put it back. Only the requested kind counts; pack exactly the target number.</p>')}`;
}
function renderPattern(activity) {
  const { model, state } = activity;
  const filled = state.slots.filter(Boolean).length;
  return `<p class="sa-activity-instructions">Continue the repeating pattern in all <strong>${model.slotCount} empty slots</strong>.</p>
    <h4>Shown pattern</h4><ol class="sa-activity-pattern-givens sa-activity-pattern-givens-${model.cycle.length}" aria-label="Shown repeating pattern">${Array.from({ length: model.givenCount }, (_, index) => {
    const component = model.cycle[index % model.cycle.length];
    return `<li><span class="sa-activity-number">${index + 1}</span>${icon(component, SHAPE_NAMES[component])}<span>${escape(SHAPE_NAMES[component])}</span></li>`;
  }).join('')}</ol>
    <h4>Choose a shape</h4><div class="sa-activity-tray" role="group" aria-label="Choose a pattern component">${model.components.map(component =>
    button('select', component, `${icon(component, SHAPE_NAMES[component])}<strong>${escape(SHAPE_NAMES[component])}${state.selected === component ? ' ✓' : ''}</strong>`, `Choose component: ${SHAPE_NAMES[component]}`, { pressed: state.selected === component })).join('')}</div>
    <h4>Tap a slot to build</h4><div class="sa-activity-slots" role="group" aria-label="Pattern continuation slots">${state.slots.map((component, index) =>
    `<div class="sa-activity-slot">${button('place', String(index), `<strong>Slot ${index + 1}</strong>${component ? icon(component, SHAPE_NAMES[component]) : '<span class="sa-activity-empty" aria-hidden="true">＋</span>'}<span>${component ? escape(SHAPE_NAMES[component]) : 'Empty'}</span>`, `Place chosen component in pattern slot ${index + 1}`)}${button('remove', String(index), 'Clear', `Clear pattern slot ${index + 1}`, { disabled: component === null })}</div>`).join('')}</div>
    ${status(activity, `${filled}/${model.slotCount} slots fitted.${state.selected ? ` ${SHAPE_NAMES[state.selected]} selected.` : ''}${filled === model.slotCount && !complete(activity) ? ' Not yet: compare your sequence with the shown repeat.' : ''}`)}
    ${help('<p>Build the blueprint for the next signal. Read the numbered pictures left to right, row by row. Choose a shape, then a slot. Keep repeating the shown block. Tap a filled slot to replace its shape, or use Clear to empty it.</p>')}`;
}
function renderRover(activity) {
  const { model, state } = activity;
  const current = state.path.at(-1);
  const collected = model.crates.filter(cell => state.path.includes(cell)).length;
  return `<div class="sa-activity-rover-layout"><div class="sa-activity-rover-brief"><p class="sa-activity-instructions">Collect <strong>${model.crates.length} repair crates</strong>, then reach the <strong>Exit flag</strong>.</p>
    ${hud([['Crates', `${collected} / ${model.crates.length}`, 'Collect all'], ['Trail moves left', model.maxSteps - state.path.length + 1, `${model.maxSteps} moves max`]])}
    <div class="sa-activity-legend">${icon('rock', 'Rock blocks movement')}<span>Rocks block</span>${icon('crate', 'Repair crate to collect')}<span>Collect</span>${icon('exit', 'Exit flag is the finish')}<span>Finish</span><span>1 square per move</span></div></div>
    <div class="sa-activity-rover-grid" role="group" aria-label="Four by four rover map, read left to right, row by row">${Array.from({ length: model.width * model.height }, (_, cell) => {
    const isCrate = model.crates.includes(cell);
    const packed = isCrate && state.path.includes(cell);
    const type = cell === current ? 'rover' : model.walls.includes(cell) ? 'rock' : isCrate && !packed ? 'crate' : cell === model.exit ? 'exit' : null;
    const name = cell === current ? 'Rover' : model.walls.includes(cell) ? 'Rock' : isCrate ? packed ? 'Crate ✓' : 'Crate' : cell === model.exit ? 'Exit' : 'Clear';
    const description = `Row ${Math.floor(cell / model.width) + 1}, column ${cell % model.width + 1}: ${name}${cell === model.exit && name !== 'Exit' ? ', exit flag' : ''}${isCrate ? packed ? ', crate collected' : ', repair crate' : ''}`;
    return `<div class="sa-activity-rover-cell${cell === current ? ' sa-activity-rover-current' : ''}${model.walls.includes(cell) ? ' sa-activity-rover-wall' : ''}" role="img" aria-label="${escape(description)}">${type ? icon(type, name) : '<span class="sa-activity-rover-ground" aria-hidden="true"></span>'}${packed ? '<span class="sa-activity-rover-pickup" aria-hidden="true">✓</span>' : ''}${cell === current && cell === model.exit ? `<span class="sa-activity-rover-flag">${icon('exit', 'Exit flag')}</span>` : ''}</div>`;
  }).join('')}</div>
    <div class="sa-activity-rover-controls"><div class="sa-activity-direction-pad" role="group" aria-label="Rover direction buttons">${[['up', '↑', 'Up'], ['left', '←', 'Left'], ['down', '↓', 'Down'], ['right', '→', 'Right']].map(([direction, arrow, label]) =>
    button('move', direction, `<span aria-hidden="true">${arrow}</span> ${label}`, `Move rover ${direction}`, { className: `sa-activity-direction-${direction}` })).join('')}</div>${footer(activity)}</div>
    <div class="sa-activity-rover-feedback">${status(activity, `Rover: row ${Math.floor(current / model.width) + 1}, column ${current % model.width + 1}.${current === model.exit && collected < model.crates.length ? ' Crates still missing—move back.' : ''}`)}
    ${help('<p>Use Up, Down, Left and Right to rescue the rover for the next signal. Each press moves one square; rocks and map edges block movement. Undo takes back a move and any crate first collected on that move. The trail limit counts moves, not time; undo or reset to make room.</p>')}</div></div>`;
}
function renderCargo(activity) {
  const { model, state } = activity;
  const totals = loadingTotals(model, state.counts);
  return `<p class="sa-activity-instructions">Pack fuel and supplies for the <strong>next signal</strong>. Make the load fit.</p>
    ${hud([['Fuel', totals.fuel, `Need at least ${model.requiredFuel}`], ['Supplies', totals.supplies, `Need at least ${model.requiredSupplies}`], ['Cargo', totals.cargo, `Max ${model.cargoCapacity} spaces`], ['Credits', totals.cost, `Max ${model.budget}`]])}
    <p class="sa-activity-legend">Per pack: gain fuel + supplies; use cargo + credits.</p>
    <div class="sa-activity-resource-cards">${model.items.map((item, index) =>
    `<div class="sa-activity-resource-card"><h4>${escape(item.name)}</h4><dl class="sa-activity-pack-stats" aria-label="${escape(item.name)} per-pack values">${[['Fuel', item.fuel], ['Supplies', item.supplies], ['Cargo', item.cargo], ['Credits', item.cost]].map(([label, amount]) => `<div><dt>${label}</dt><dd>${amount}</dd></div>`).join('')}</dl><p class="sa-activity-quantity"><strong>${state.counts[index]} / ${model.maxPerItem}</strong> loaded</p><div class="sa-activity-stepper">${button('decrease', item.id, '−', `Remove one ${item.name}`, { disabled: state.counts[index] === 0 })}${button('increase', item.id, '+', `Add one ${item.name}`, { disabled: state.counts[index] === model.maxPerItem })}</div></div>`).join('')}</div>
    ${status(activity, totals.fuel >= model.requiredFuel && totals.supplies >= model.requiredSupplies ? 'Load fits.' : `Need ${Math.max(0, model.requiredFuel - totals.fuel)} more fuel and ${Math.max(0, model.requiredSupplies - totals.supplies)} more supplies.`)}
    ${help(`<p>Add or remove packs with + and −. Each card shows what one pack provides and costs. Reach both fuel and supply targets without exceeding cargo or credits. You can load at most ${model.maxPerItem} of each pack; many different loads can work.</p>`)}`;
}
function renderRoute(activity) {
  const { model, state } = activity;
  const name = id => model.nodes.find(node => node.id === id).name;
  const current = state.route.at(-1);
  const cost = routeCost(model, state.route);
  return `<p class="sa-activity-instructions">Start at <strong>${escape(name(model.start))}</strong>. Visit <strong>${escape(name(model.checkpoint))}</strong>, then reach the <strong>next signal</strong>.</p>
    ${hud([['Fuel left', model.fuelBudget - cost, `${model.fuelBudget} total`], [`${name(model.checkpoint)} checkpoint`, state.route.includes(model.checkpoint) ? '1 / 1' : '0 / 1', 'Must visit']])}
    <p class="sa-activity-legend">→ One-way links · No repeat visits</p>
    <ol class="sa-activity-trail" aria-label="Route so far">${state.route.map((id, index) => `<li>${index ? '<span aria-hidden="true">→ </span>' : ''}${escape(name(id))}</li>`).join('')}</ol>
    <div class="sa-activity-network" role="group" aria-label="Directed beacon graph; arrows list one-way connections and fuel costs">${model.nodes.map(node => {
    const edges = model.edges.filter(edge => edge.from === node.id);
    const next = model.edges.some(edge => edge.from === current && edge.to === node.id);
    const here = node.id === current;
    const badge = here ? 'Here' : next ? 'Next' : node.id === model.start ? 'Start' : node.id === model.end ? 'Finish' : '';
    return button('travel', node.id, `<strong>${escape(node.name)}</strong>${badge ? `<span class="sa-activity-chip">${escape(badge)}</span>` : ''}<span class="sa-activity-connections">${edges.length ? edges.map(edge => `<span>→ ${escape(name(edge.to))} <strong>· ${edge.cost} fuel</strong></span>`).join('') : '<span>No onward links</span>'}</span>`, `Travel to beacon ${node.name}`, { pressed: here, className: 'sa-activity-beacon' });
  }).join('')}</div>
    ${status(activity, `Current beacon: ${name(current)}.${current === model.end && !state.route.includes(model.checkpoint) ? ' You missed the checkpoint: undo to choose a different route.' : ''}`)}
    ${help('<p>Tap a beacon connected by an outgoing arrow from your current beacon. The number beside an arrow is its fuel cost. Visit the required checkpoint before finishing, stay within fuel, and never revisit a beacon. Undo a stop to try another route.</p>')}`;
}
function renderStation(activity) {
  const { model, state } = activity;
  const occupied = stationOccupied(model, state.placements);
  const linked = linkedCells(model, state.placements);
  const placed = state.placements.filter(Boolean).length;
  const connected = state.placements.filter((placement, index) =>
    placement && moduleCells(model, model.modules[index], placement).every(cell => linked.has(cell))).length;
  const selected = model.modules.find(module => module.id === state.selected);
  const dimensions = module => `${module.width} across × ${module.height} down`;
  return `<p class="sa-activity-instructions">Fit all <strong>3 modules</strong> inside the <strong>${model.width} × ${model.height} grid</strong>, with <strong>no overlaps</strong>. Link each to <strong>Core by shared sides</strong>—directly or through another module. Corners do not connect.</p>
    <p class="sa-activity-note sa-activity-station-cue">Choose a module, then tap its <strong>top-left square</strong>. Sizes: across × down.</p>
    <div class="sa-activity-module-tray" role="group" aria-label="Station modules">${model.modules.map((module, index) => {
    const placement = state.placements[index];
    const position = placement ? `Row ${Math.floor(placement.cell / model.width) + 1}, column ${placement.cell % model.width + 1}${placement.turned ? ' · turned' : ''}` : 'Not placed';
    return `<div class="sa-activity-module-card">${button('select', module.id, `<strong>${escape(module.name)}${state.selected === module.id ? ' ✓' : ''}</strong><span>${module.width} × ${module.height}</span><span class="sa-activity-note">Area ${module.width * module.height}</span>`, `Choose station module ${module.name}`, { pressed: state.selected === module.id, description: `${dimensions(module)}; area ${module.width * module.height} squares. ${position}.` })}${button('remove', module.id, 'Remove', `Remove station module ${module.name}`, { disabled: !placement })}</div>`;
  }).join('')}</div>
    <div class="sa-activity-station-controls">${button('rotate', null, '↻ Turn preview', 'Turn selected module preview by a quarter turn', { disabled: !selected || selected.width === selected.height })}<p class="sa-activity-note">${selected ? `${escape(selected.name)} preview: <strong>${state.turned ? selected.height : selected.width} across × ${state.turned ? selected.width : selected.height} down</strong>` : 'Choose a module to preview its size.'}</p></div>
    <div class="sa-activity-grid-scroll"><div class="sa-activity-station-grid" role="group" aria-label="Station placement grid: five rows and five columns"><span aria-hidden="true"></span>${Array.from({ length: model.width }, (_, column) => `<span class="sa-activity-axis" aria-hidden="true">${column + 1}</span>`).join('')}${Array.from({ length: model.height }, (_, row) =>
    `<span class="sa-activity-axis" aria-hidden="true">${row + 1}</span>${Array.from({ length: model.width }, (_, column) => {
      const cell = row * model.width + column;
      const occupant = occupied.get(cell);
      return button('place', String(cell), `<strong>${escape(occupant ?? 'Free')}</strong>`, `Place selected module at row ${row + 1}, column ${column + 1}`, { className: `sa-activity-station-cell${occupant ? ' sa-activity-station-filled' : ''}${cell === model.core ? ' sa-activity-station-core' : ''}`, description: occupant ? `Occupied by ${occupant}${linked.has(cell) ? ', linked to Core' : ', not yet linked to Core'}.` : 'Empty square.' });
    }).join('')}`).join('')}</div></div>
    ${status(activity, `${placed}/${model.modules.length} modules placed; ${connected} connected to Core. Occupied area ${occupied.size}/${model.width * model.height} squares, including Core.${placed > connected ? ' Some modules still need a side-to-side link to Core.' : ''}`)}
    <details class="sa-activity-station-help"><summary>How to place, turn and move</summary><p>Build a station for the next signal. Choose a module, turn its preview if wanted, then tap its <strong>top-left square</strong>. Turning changes the next placement, not the module already on the grid. To move a module, keep it selected and tap another square. Remove frees its squares.</p><p>Sizes are across × down; area counts the squares a module covers. Column numbers run across the top; row numbers run down the left. Core is fixed at row ${Math.floor(model.core / model.width) + 1}, column ${model.core % model.width + 1}. Connect every module to Core by shared sides, directly or through other modules. Corners do not connect.</p></details>`;
}
function renderCommand(activity) {
  const { model, state } = activity;
  const totals = commandTotals(model, state.assignments);
  const sectorName = id => model.sectors.find(sector => sector.id === id).name;
  const shortSector = id => sectorName(id).replace(/ sector$/, '');
  const selected = model.probes.find(probe => probe.id === state.selected);
  return `<p class="sa-activity-instructions">Choose a probe, then a sector. Send a <strong>different probe to each sector</strong>.</p>
    ${hud([['Sectors', `${state.assignments.filter(Boolean).length} / ${model.sectors.length}`, `Fill all ${model.sectors.length}`], ['Credits', totals.cost, `Max ${model.budget}`], ['Energy', totals.energy, `Max ${model.energyCapacity}`], ['Science', totals.science, `Need at least ${model.requiredScience}`]])}
    <p class="sa-activity-legend">Listed sectors = compatible.<br><strong>★ Specialist: −${model.specialistSaving} energy, +${model.specialistScience} science</strong></p>
    <table class="sa-activity-cost-table"><caption>Probe bay · Base values</caption><thead><tr><th scope="col">Probe</th><th scope="col">Credits</th><th scope="col">Energy</th><th scope="col">Science</th></tr></thead><tbody>${model.probes.map(probe =>
    `<tr><th scope="row">${button('select', probe.id, `<strong>${escape(probe.name)}${state.selected === probe.id ? ' ✓' : ''}</strong><span class="sa-activity-probe-tags">${probe.compatible.map(id => `<span>${escape(shortSector(id))}${probe.speciality === id ? ' ★' : ''}</span>`).join('')}</span>`, `Choose probe ${probe.name}`, { pressed: state.selected === probe.id, description: `Compatible: ${probe.compatible.map(sectorName).join(', ')}. Specialist: ${sectorName(probe.speciality)}.` })}</th><td>${probe.cost}</td><td>${probe.energy}</td><td>${probe.science}</td></tr>`).join('')}</tbody></table>
    <div class="sa-activity-sector-grid" role="group" aria-label="Assign probes to sectors">${model.sectors.map((sector, index) => {
    const probe = model.probes.find(candidate => candidate.id === state.assignments[index]);
    const outcome = probe ? probeOutcome(model, probe, sector) : null;
    const preview = selected && selected.id !== probe?.id ? probeOutcome(model, selected, sector) : null;
    const previewText = preview ? selected.compatible.includes(sector.id)
      ? `Next: ${preview.energy} energy · ${preview.science} science` : 'Not compatible' : '';
    return `<div class="sa-activity-sector-card">${button('assign', sector.id, `<strong>${escape(shortSector(sector.id))}</strong><span>${probe ? escape(probe.name) : 'Empty'}</span>${outcome ? `<span class="sa-activity-sector-values">${outcome.energy} energy<br>${outcome.science} science</span>` : ''}${previewText ? `<span class="sa-activity-sector-preview">${escape(previewText)}</span>` : ''}`, `Assign selected probe to ${sector.name}`, { description: outcome ? `Assigned ${probe.name}: ${outcome.cost} credits, ${outcome.energy} energy, ${outcome.science} science.` : 'No probe assigned.' })}${button('remove', sector.id, 'Remove', `Remove probe from ${sector.name}`, { disabled: !probe })}</div>`;
  }).join('')}</div>
    ${status(activity, state.assignments.every(Boolean) && totals.science < model.requiredScience
    ? 'All sectors assigned, but more science is needed. Try specialist placements or another team.'
    : selected ? `${selected.name} selected. Choose a sector.` : 'Choose a probe to start.')}
    ${help('<p>Command the fleet for the next signal. Each probe can visit only the sectors listed below its name. The table gives base values; ★ marks the sector where its specialist bonus applies. Choose a probe, then a sector. Moving a probe clears its old sector; assigning to an occupied sector replaces the old probe. Meet science while staying within both resource limits.</p>')}`;
}

export function renderActivity(activity) {
  validateActivity(activity);
  const renderers = {
    'picture-collection': renderCollection,
    'pattern-blueprint': renderPattern,
    'rover-rescue': renderRover,
    'probe-loading': renderCargo,
    'beacon-route': renderRoute,
    'station-layout': renderStation,
    'galaxy-command': renderCommand,
  };
  return `<section class="sa-activity sa-activity-panel sa-activity-${escape(activity.kind)}" data-activity-kind="${escape(activity.kind)}" aria-label="${escape(TITLES[activity.kind])}"><h3>${escape(TITLES[activity.kind])}</h3>${renderers[activity.kind](activity)}${activity.kind === 'rover-rescue' ? '' : footer(activity)}</section>`;
}
