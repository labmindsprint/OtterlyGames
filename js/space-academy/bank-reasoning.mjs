import { QuestionRetry, MISCONCEPTIONS, answerChoices, wrong, choiceCount } from './bank-shared.mjs';
import { svg, text, line, rect, circle, path, icon, tileGrid, gridDescription, INK, GREEN, ORANGE, PAPER } from './diagram-kit.mjs';

export const REASONING_FAMILIES = [
  'mirror-grid', 'rotate-grid', 'figure-analogy', 'embedded-grid', 'symmetry-grid',
  'cube-net', 'grid-boundary', 'rectangle-constraint', 'shaded-area', 'area-inference',
  'angle-reason', 'code-key', 'code-infer', 'ranking', 'ranking-change', 'directions',
  'turn-route', 'path-count', 'path-condition', 'combinations',
];

const PREFIX = 'v2-reasoning-';
const TRANSFORMS = ['identity', 'mirror-lr', 'mirror-tb', 'turn-right', 'turn-half', 'turn-left', 'diagonal-main', 'diagonal-anti'];
const AXES = ['vertical', 'horizontal', 'diagonal-main', 'diagonal-anti'];
const SHAPES = ['circle', 'triangle', 'square', 'star', 'pentagon', 'hexagon'];
const COMPASS = ['north', 'east', 'south', 'west'];
const VECTORS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const clone = value => structuredClone(value);
const total = values => values.reduce((a, b) => a + b, 0);
const ensure = (condition, message) => { if (!condition) throw new Error(`Invalid reasoning question: ${message}`); };
const integer = (value, low = 0, high = 10000) => Number.isInteger(value) && value >= low && value <= high;
const stable = value => JSON.stringify(value, (_, item) => item && !Array.isArray(item) && typeof item === 'object'
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const routesText = count => `${count} ${count === 1 ? 'route' : 'routes'}`;
const cm = value => `${value} cm`;
const squareCm = value => `${value} cm²`;
const degrees = value => `${value}°`;
const ordinal = value => `${value}${value % 100 >= 11 && value % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[value % 10] ?? 'th')}`;

function checkGrid(cells, { square = false, binary = false } = {}) {
  ensure(Array.isArray(cells) && integer(cells.length, 1, 8), 'a grid needs 1–8 rows.');
  ensure(Array.isArray(cells[0]) && integer(cells[0].length, 1, 8), 'a grid needs 1–8 columns.');
  const columns = cells[0].length;
  ensure(cells.every(row => Array.isArray(row) && row.length === columns
    && row.every(value => integer(value, 0, binary ? 1 : 3))), 'the grid cells are not a rectangular marked grid.');
  ensure(!square || cells.length === columns, 'the transformation grid must be square.');
  return cells;
}

function transform(cells, operation) {
  checkGrid(cells, { square: true });
  const n = cells.length;
  const take = {
    identity: (r, c) => cells[r][c],
    'mirror-lr': (r, c) => cells[r][n - 1 - c],
    'mirror-tb': (r, c) => cells[n - 1 - r][c],
    'turn-right': (r, c) => cells[n - 1 - c][r],
    'turn-half': (r, c) => cells[n - 1 - r][n - 1 - c],
    'turn-left': (r, c) => cells[c][n - 1 - r],
    'diagonal-main': (r, c) => cells[c][r],
    'diagonal-anti': (r, c) => cells[n - 1 - c][n - 1 - r],
  }[operation];
  ensure(take, `unknown tile transformation ${operation}.`);
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => take(r, c)));
}

const gridKey = cells => {
  checkGrid(cells);
  return `grid:${cells.length}x${cells[0].length}:${cells.map(row => row.join('')).join('/')}`;
};
const sameGrid = (left, right) => gridKey(left) === gridKey(right);
const changedMarks = cells => cells.map(row => row.map(value => value === 2 ? 3 : value === 3 ? 2 : value));
const asymmetric = cells => new Set(TRANSFORMS.map(operation => gridKey(transform(cells, operation)))).size === 8;

function randomGrid(r, size) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const cells = Array.from({ length: size }, () => Array(size).fill(0));
    const positions = r.shuffle(Array.from({ length: size * size }, (_, index) => index));
    const count = r.int(size + 1, Math.min(size * size - 2, size * 2 + 1));
    positions.slice(0, count).forEach((position, index) => {
      cells[Math.floor(position / size)][position % size] = index === 0 ? 2 : index === 1 ? 3 : 1;
    });
    if (asymmetric(cells)) return cells;
  }
  throw new QuestionRetry('Could not draw a tile picture with eight distinct orientations.');
}

function windows(cells, size) {
  checkGrid(cells);
  ensure(integer(size, 1, Math.min(cells.length, cells[0].length)), 'the embedded pattern size is invalid.');
  const found = [];
  for (let y = 0; y <= cells.length - size; y++) {
    for (let x = 0; x <= cells[0].length - size; x++) {
      found.push(cells.slice(y, y + size).map(row => row.slice(x, x + size)));
    }
  }
  return found;
}

function axesOf(cells) {
  checkGrid(cells, { square: true });
  return AXES.filter(axis => sameGrid(cells, transform(cells, ({
    vertical: 'mirror-lr', horizontal: 'mirror-tb', 'diagonal-main': 'diagonal-main', 'diagonal-anti': 'diagonal-anti',
  })[axis])));
}

function boundaryFacts(cells) {
  checkGrid(cells, { binary: true });
  const occupied = new Set();
  cells.forEach((row, y) => row.forEach((value, x) => { if (value) occupied.add(`${x},${y}`); }));
  ensure(occupied.size > 0, 'the composite shape is empty.');
  let exposed = 0;
  let shared = 0;
  for (const coordinate of occupied) {
    const [x, y] = coordinate.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!occupied.has(`${x + dx},${y + dy}`)) exposed++;
    }
    if (occupied.has(`${x + 1},${y}`)) shared++;
    if (occupied.has(`${x},${y + 1}`)) shared++;
  }
  const reached = new Set();
  const stack = [occupied.values().next().value];
  while (stack.length) {
    const coordinate = stack.pop();
    if (reached.has(coordinate)) continue;
    reached.add(coordinate);
    const [x, y] = coordinate.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = `${x + dx},${y + dy}`;
      if (occupied.has(next) && !reached.has(next)) stack.push(next);
    }
  }
  ensure(reached.size === occupied.size, 'the boundary picture must be one connected shape.');
  return { exposed, shared, squares: occupied.size };
}

const negate = vector => vector.map(value => -value);
const vectorKey = vector => vector.join(',');

function foldNet(faces) {
  ensure(Array.isArray(faces) && faces.length === 6, 'a cube net needs six faces.');
  ensure(faces.every(face => integer(face.x, 0, 6) && integer(face.y, 0, 6)
    && typeof face.label === 'string' && /^[A-F1-6]$/.test(face.label)), 'the cube faces have invalid labels or positions.');
  ensure(new Set(faces.map(face => `${face.x},${face.y}`)).size === 6
    && new Set(faces.map(face => face.label)).size === 6, 'cube faces must have distinct positions and labels.');
  const byPosition = new Map(faces.map(face => [`${face.x},${face.y}`, face]));
  const orientations = new Map([[faces[0].label, { u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] }]]);
  const pending = [faces[0]];
  while (pending.length) {
    const face = pending.shift();
    const { u, v, n } = orientations.get(face.label);
    const neighbours = [
      [1, 0, { u: negate(n), v, n: u }],
      [-1, 0, { u: n, v, n: negate(u) }],
      [0, 1, { u, v: negate(n), n: v }],
      [0, -1, { u, v: n, n: negate(v) }],
    ];
    for (const [dx, dy, orientation] of neighbours) {
      const neighbour = byPosition.get(`${face.x + dx},${face.y + dy}`);
      if (!neighbour) continue;
      if (orientations.has(neighbour.label)) {
        ensure(stable(orientations.get(neighbour.label)) === stable(orientation), 'the net cannot fold consistently.');
      } else {
        orientations.set(neighbour.label, orientation);
        pending.push(neighbour);
      }
    }
  }
  ensure(orientations.size === 6 && new Set([...orientations.values()].map(value => vectorKey(value.n))).size === 6,
    'the six squares overlap when folded, so this is not a cube net.');
  return orientations;
}

function oppositeFace(visual) {
  const folded = foldNet(visual.faces);
  ensure(folded.has(visual.target), 'the named cube face is missing.');
  const opposite = vectorKey(negate(folded.get(visual.target).n));
  return [...folded].find(([, orientation]) => vectorKey(orientation.n) === opposite)[0];
}

function rectangleFacts(visual) {
  if (visual.mode === 'single') {
    ensure(integer(visual.perimeter, 8) && integer(visual.known, 1) && visual.perimeter % 2 === 0,
      'a rectangle needs an even perimeter and a positive known side.');
    const missing = visual.perimeter / 2 - visual.known;
    ensure(integer(missing, 1), 'the missing rectangle side is not positive.');
    return { perimeter: visual.perimeter, missing };
  }
  ensure(visual.mode === 'related' && ['length', 'width'].includes(visual.knownSide),
    'the rectangle relation is unknown.');
  ensure(integer(visual.reference?.length, 1) && integer(visual.reference?.width, 1)
    && integer(visual.delta, -1000, 1000) && visual.delta % 2 === 0 && integer(visual.known, 1),
  'the related rectangle givens are invalid.');
  const perimeter = 2 * (visual.reference.length + visual.reference.width) + visual.delta;
  const missing = perimeter / 2 - visual.known;
  ensure(integer(missing, 1), 'the perimeter relation gives no positive missing side.');
  return { perimeter, missing };
}

function areaFacts(visual) {
  ensure(['given', 'inferred'].includes(visual.mode) && integer(visual.outerWidth, 3)
    && integer(visual.cutWidth, 1) && integer(visual.cutHeight, 1), 'the area dimensions are invalid.');
  const height = visual.mode === 'inferred' ? visual.perimeter / 2 - visual.outerWidth : visual.outerHeight;
  if (visual.mode === 'inferred') {
    ensure(integer(visual.perimeter, 8) && visual.perimeter % 2 === 0 && !('outerHeight' in visual),
      'an inferred height must come from the complete rectangle perimeter, not a hidden height.');
  }
  ensure(integer(height, 3) && visual.cutWidth < visual.outerWidth && visual.cutHeight < height,
    'the unshaded corner must fit strictly inside the complete rectangle.');
  return { height, whole: visual.outerWidth * height, cut: visual.cutWidth * visual.cutHeight };
}

function angleFacts(visual) {
  if (visual.mode === 'straight') {
    ensure(integer(visual.left, 1, 170) && integer(visual.middle, 1, 170)
      && visual.left + visual.middle < 180, 'the pieces must fit on a straight angle.');
    return { answer: 180 - visual.left - visual.middle };
  }
  ensure(visual.mode === 'parallel' && visual.parallel === true, 'the two lines must be explicitly marked parallel.');
  const known = visual.known;
  const query = visual.query;
  ensure(known?.intersection === 'top' && query?.intersection === 'bottom'
    && ['UR', 'UL', 'LL', 'LR'].includes(known.sector) && ['UR', 'UL', 'LL', 'LR'].includes(query.sector)
    && integer(known.value, 1, 179) && integer(query.offset, 0, 80), 'the marked angle positions are invalid.');
  const acute = ['UR', 'LL'].includes(known.sector) ? known.value : 180 - known.value;
  ensure(acute > 0 && acute < 90, 'the drawn transversal must slope upwards to the right at an acute angle.');
  const target = ['UR', 'LL'].includes(query.sector) ? acute : 180 - acute;
  ensure(target > query.offset, 'the labelled angle expression gives no positive x.');
  return { acute, target, answer: target - query.offset };
}

function keyFacts(visual) {
  ensure(Array.isArray(visual.key) && visual.key.length >= 3 && visual.key.length <= 6
    && visual.key.every(item => SHAPES.includes(item.shape) && integer(item.digit, 1, 9)), 'the symbol key is invalid.');
  ensure(new Set(visual.key.map(item => item.shape)).size === visual.key.length
    && new Set(visual.key.map(item => item.digit)).size === visual.key.length, 'the code key is not one-to-one.');
  const key = new Map(visual.key.map(item => [item.shape, String(item.digit)]));
  ensure(Array.isArray(visual.message) && visual.message.length >= 3 && visual.message.length <= 6
    && visual.message.every(shape => key.has(shape)) && ['forward', 'backward'].includes(visual.order),
  'the message cannot be translated by the key.');
  const message = visual.order === 'backward' ? [...visual.message].reverse() : visual.message;
  return { key, code: message.map(shape => key.get(shape)).join('') };
}

function inferCode(visual) {
  ensure(Array.isArray(visual.examples) && visual.examples.length >= 2 && visual.examples.length <= 5
    && visual.examples.every(item => /^[A-Z]{2,6}$/.test(item.word) && /^[1-9]{2,6}$/.test(item.code)
      && item.word.length === item.code.length)
    && /^[A-Z]{2,6}$/.test(visual.target), 'the word-code examples are invalid.');
  ensure(Array.isArray(visual.orders) && visual.orders.length >= 1 && visual.orders.length <= 2
    && new Set(visual.orders).size === visual.orders.length
    && visual.orders.every(order => ['forward', 'backward'].includes(order)), 'the stated possible reading directions are invalid.');
  const possibilities = [];
  for (const order of visual.orders) {
    const key = new Map();
    const usedDigits = new Map();
    let consistent = true;
    for (const example of visual.examples) {
      const letters = order === 'backward' ? [...example.word].reverse() : [...example.word];
      letters.forEach((letter, index) => {
        const digit = example.code[index];
        if ((key.has(letter) && key.get(letter) !== digit) || (usedDigits.has(digit) && usedDigits.get(digit) !== letter)) consistent = false;
        key.set(letter, digit);
        usedDigits.set(digit, letter);
      });
    }
    if (!consistent || [...visual.target].some(letter => !key.has(letter))) continue;
    const letters = order === 'backward' ? [...visual.target].reverse() : [...visual.target];
    possibilities.push({ order, key, code: letters.map(letter => key.get(letter)).join('') });
  }
  ensure(possibilities.length === 1, 'the examples do not determine one consistent code and reading direction.');
  return possibilities[0];
}

function rankingFacts(visual) {
  ensure(integer(visual.frontRank, 1, 50) && integer(visual.backRank, 1, 50), 'the ranks must be positive whole numbers.');
  if (visual.mode === 'single') return visual.frontRank + visual.backRank - 1;
  ensure(visual.mode === 'two' && integer(visual.between, 1, 30), 'the two-person ranking gap is invalid.');
  return visual.frontRank + visual.between + visual.backRank;
}

function rankingChangeFacts(visual) {
  ensure(integer(visual.total, 6, 100) && integer(visual.frontRank, 1, visual.total)
    && integer(visual.backRank, 1, visual.total) && integer(visual.joinFront, 0, 10)
    && integer(visual.leaveBack, 0, 10), 'the queue-change givens are invalid.');
  const otherFront = visual.total - visual.backRank + 1;
  ensure(otherFront < visual.frontRank && visual.frontRank <= visual.total - visual.leaveBack,
    'the two children must be distinct and neither may be among the children who leave.');
  ensure(['move', 'pair'].includes(visual.mode), 'the queue-change question is unknown.');
  if (visual.mode === 'move') {
    ensure(visual.joinFront === 0 && visual.leaveBack === 0, 'the displacement question has an unstated queue change.');
    return { otherFront, answer: `${visual.frontRank - otherFront} places` };
  }
  return {
    otherFront,
    front: otherFront + visual.joinFront,
    back: visual.total - visual.frontRank + 1 - visual.leaveBack,
    answer: `Front ${otherFront + visual.joinFront}; back ${visual.total - visual.frontRank + 1 - visual.leaveBack}`,
  };
}

function routePositions(visual) {
  ensure(Array.isArray(visual.steps) && visual.steps.length >= 2 && visual.steps.length <= 6
    && visual.steps.every(step => COMPASS.includes(step.direction) && integer(step.distance, 1, 100)),
  'each route leg needs a compass direction and a labelled distance.');
  const positions = [{ x: 0, y: 0 }];
  for (const step of visual.steps) {
    const [dx, dy] = VECTORS[COMPASS.indexOf(step.direction)];
    const previous = positions.at(-1);
    positions.push({ x: previous.x + dx * step.distance, y: previous.y + dy * step.distance });
  }
  return positions;
}

function positionText(x, y) {
  const parts = [];
  if (x) parts.push(`${Math.abs(x)} m ${x > 0 ? 'east' : 'west'}`);
  if (y) parts.push(`${Math.abs(y)} m ${y > 0 ? 'north' : 'south'}`);
  return parts.length ? parts.join(' and ') : 'At S';
}

function turnFacts(visual, mode = 'actual') {
  ensure(COMPASS.includes(visual.facing) && ['facing', 'position'].includes(visual.ask)
    && Array.isArray(visual.steps) && visual.steps.length >= 2 && visual.steps.length <= 5
    && visual.steps.every(step => ['none', 'left', 'right', 'back'].includes(step.turn)
      && integer(step.distance, 1, 30)), 'the turn instructions are invalid.');
  let facing = COMPASS.indexOf(visual.facing);
  let x = 0;
  let y = 0;
  visual.steps.forEach((step, index) => {
    const turn = mode === 'skip-last' && index === visual.steps.length - 1 ? 'none' : step.turn;
    if (mode === 'fixed-frame' && turn !== 'none') facing = ({ left: 3, right: 1, back: 2 })[turn];
    else facing = (facing + ({ none: 0, left: 3, right: 1, back: 2 })[turn]) % 4;
    const [dx, dy] = VECTORS[facing];
    x += dx * step.distance;
    y += dy * step.distance;
  });
  return { facing: COMPASS[facing], x, y, answer: visual.ask === 'facing' ? COMPASS[facing] : positionText(x, y) };
}

function graphFacts(visual) {
  ensure(Array.isArray(visual.nodes) && visual.nodes.length >= 4 && visual.nodes.length <= 12
    && visual.nodes.every(node => /^[A-Z]$/.test(node.id) && integer(node.x, 15, 485) && integer(node.y, 20, 270)),
  'the route diagram has invalid junctions.');
  const nodes = new Map(visual.nodes.map(node => [node.id, node]));
  ensure(nodes.size === visual.nodes.length && nodes.has(visual.start) && nodes.has(visual.finish)
    && visual.start !== visual.finish, 'the route endpoints are invalid.');
  ensure(Array.isArray(visual.edges) && visual.edges.length > 0 && visual.edges.length <= 40
    && visual.edges.every(edge => Array.isArray(edge) && edge.length === 2
      && nodes.has(edge[0]) && nodes.has(edge[1]) && edge[0] !== edge[1]), 'the directed paths are invalid.');
  ensure(new Set(visual.edges.map(edge => edge.join('>'))).size === visual.edges.length, 'a directed path is drawn twice.');
  const incoming = new Map([...nodes.keys()].map(id => [id, []]));
  const outgoing = new Map([...nodes.keys()].map(id => [id, []]));
  for (const [from, to] of visual.edges) {
    ensure(nodes.get(from).x < nodes.get(to).x, 'arrows must lead towards the next layer, never form a cycle.');
    incoming.get(to).push(from);
    outgoing.get(from).push(to);
  }
  ensure(incoming.get(visual.start).length === 0 && outgoing.get(visual.finish).length === 0,
    'the start and finish arrows are reversed.');
  ensure([...nodes.keys()].every(id => (id === visual.start || incoming.get(id).length > 0)
    && (id === visual.finish || outgoing.get(id).length > 0)), 'every junction must lie on a start-to-finish route.');
  ensure(visual.checkpoint == null || (nodes.has(visual.checkpoint) && ![visual.start, visual.finish].includes(visual.checkpoint)),
    'the checkpoint must be an intermediate junction.');
  ensure(visual.forbidden == null || (nodes.has(visual.forbidden)
    && ![visual.start, visual.finish, visual.checkpoint].includes(visual.forbidden)), 'the closed junction is invalid.');
  const count = ({ checkpoint = null, forbidden = null, start = visual.start, finish = visual.finish } = {}) => {
    const memo = new Map();
    const walk = (id, visited) => {
      if (id === forbidden) return 0;
      const passed = visited || id === checkpoint;
      if (id === finish) return checkpoint == null || passed ? 1 : 0;
      const key = `${id}:${passed}`;
      if (memo.has(key)) return memo.get(key);
      const ways = total(outgoing.get(id).map(next => walk(next, passed)));
      memo.set(key, ways);
      return ways;
    };
    return walk(start, false);
  };
  return { nodes, incoming, outgoing, count };
}

function combinationFacts(visual) {
  ensure(Array.isArray(visual.flags) && visual.flags.length >= 2 && visual.flags.length <= 5
    && visual.flags.every(label => /^[A-E]$/.test(label)) && new Set(visual.flags).size === visual.flags.length,
  'the flag choices are invalid.');
  ensure(Array.isArray(visual.badges) && visual.badges.length >= 2 && visual.badges.length <= 5
    && visual.badges.every(item => /^[1-5]$/.test(item.id) && SHAPES.includes(item.shape))
    && new Set(visual.badges.map(item => item.id)).size === visual.badges.length, 'the badge choices are invalid.');
  ensure(Array.isArray(visual.excluded) && visual.excluded.length > 0
    && visual.excluded.every(pair => Array.isArray(pair) && pair.length === 2
      && visual.flags.includes(pair[0]) && visual.badges.some(badge => badge.id === pair[1]))
    && new Set(visual.excluded.map(pair => pair.join(':'))).size === visual.excluded.length,
  'the excluded flag–badge pairs are invalid or repeated.');
  const all = visual.flags.length * visual.badges.length;
  ensure(visual.excluded.length < all, 'at least one flag–badge pair must be allowed.');
  let allowed = 0;
  for (const flag of visual.flags) for (const badge of visual.badges) {
    if (!visual.excluded.some(pair => pair[0] === flag && pair[1] === badge.id)) allowed++;
  }
  return { all, allowed };
}

function describe(visual) {
  switch (visual.kind.slice(PREFIX.length)) {
    case 'grid': return `Marked tile choice. ${gridDescription(visual.cells)}.`;
    case 'mirror': return `Tile picture with a mirror line ${visual.axis === 'vertical' ? 'on its right' : 'below it'}. ${gridDescription(visual.cells)}.`;
    case 'rotation': return `Tile picture to turn ${visual.turn === 'turn-half' ? 'half a turn' : 'a quarter-turn clockwise'}. ${gridDescription(visual.cells)}.`;
    case 'analogy': return `Picture rule A to B, then C to a missing picture. A: ${gridDescription(visual.a)}. B: ${gridDescription(visual.b)}. C: ${gridDescription(visual.c)}.`;
    case 'embedded': return `Large marked grid. ${gridDescription(visual.cells)}. Choices are ${visual.size} by ${visual.size} patterns, kept the same way up. Find the pattern ${visual.find === 'absent' ? 'not present' : 'present'} as adjacent rows and columns.`;
    case 'symmetry': return `Find the only mirror line of this marked tile square. Markings count. ${gridDescription(visual.cells)}.`;
    case 'axis': return `${visual.axis.replaceAll('-', ' ')} dashed mirror-line choice. ${gridDescription(visual.cells)}.`;
    case 'net': return `Cube net, square positions read as column and row from zero: ${visual.faces.map(face => `${face.label} at (${face.x}, ${face.y})`).join('; ')}. Find the face opposite ${visual.target}.`;
    case 'face': return `A single cube face labelled ${visual.label}.`;
    case 'boundary': return `One composite shape of equal squares; each square side is ${visual.unit} cm. ${visual.cells.map((row, index) => `Row ${index + 1}: ${row.map(value => value ? 'square' : 'gap').join(', ')}`).join('. ')}. Count only exposed edges.`;
    case 'rectangle': return visual.mode === 'single'
      ? `Rectangle with length ${visual.known} cm, unknown width and perimeter ${visual.perimeter} cm. Diagram not to scale.`
      : `Rectangle P has length ${visual.reference.length} cm and width ${visual.reference.width} cm. Rectangle Q has ${visual.knownSide} ${visual.known} cm; its other side is unknown. Q's perimeter is ${visual.delta === 0 ? 'the same as P’s' : `${Math.abs(visual.delta)} cm ${visual.delta > 0 ? 'greater' : 'less'} than P’s`}. Diagrams not to scale.`;
    case 'area': return `Complete rectangle width ${visual.outerWidth} cm, ${visual.mode === 'inferred' ? `unknown height and complete perimeter ${visual.perimeter} cm` : `height ${visual.outerHeight} cm`}. Its top-right unshaded corner is ${visual.cutWidth} cm wide and ${visual.cutHeight} cm high. Find the remaining shaded area. Diagram not to scale.`;
    case 'angles': return visual.mode === 'straight'
      ? `A straight angle is split into consecutive angles ${visual.left} degrees, ${visual.middle} degrees and x.`
      : `Two explicitly marked parallel horizontal lines are cut by one transversal sloping up to the right. At the top crossing the ${visual.known.sector} sector is ${visual.known.value} degrees; at the bottom crossing the ${visual.query.sector} sector is labelled ${visual.query.offset ? `x plus ${visual.query.offset} degrees` : 'x'}. UR, UL, LL and LR mean upper-right, upper-left, lower-left and lower-right.`;
    case 'code-key': return `Symbol code key: ${visual.key.map(item => `${item.shape} = ${item.digit}`).join('; ')}. Message, left to right: ${visual.message.join(', ')}. Read ${visual.order === 'forward' ? 'left to right' : 'right to left'}.`;
    case 'code-infer': return `Each letter has one fixed, distinct digit. ${visual.examples.map(item => `${item.word} is coded ${item.code}`).join('; ')}. ${visual.orders.length === 1 ? 'Read letters from left to right.' : 'All words are read in the same direction, either left to right or right to left.'} Find the code for ${visual.target}.`;
    case 'ranking': return visual.mode === 'single'
      ? `Mina is ${ordinal(visual.frontRank)} from the front and ${ordinal(visual.backRank)} from the back of one line. Find the total number of children.`
      : `Mina is ${ordinal(visual.frontRank)} from the front. Ravi is ${ordinal(visual.backRank)} from the back. Mina is ahead of Ravi with exactly ${visual.between} children between them. Find the total.`;
    case 'ranking-change': return `A line has ${visual.total} children. Mina is ${ordinal(visual.frontRank)} from the front; Ravi is ${ordinal(visual.backRank)} from the back. They swap places. ${visual.mode === 'move' ? 'Find how many places Mina moves towards the front.' : `Then ${visual.joinFront} new children join at the front and ${visual.leaveBack} children leave from the back; neither named child leaves. Find Mina’s front rank and Ravi’s back rank.`}`;
    case 'directions': return `Compass: north up, east right, south down, west left. Starting at S, follow ${visual.steps.map(step => `${step.distance} m ${step.direction}`).join(', then ')} to F. ${visual.ask === 'axis-position' ? 'Find the distance and direction of F from S.' : 'Find the shortest distance from S to F using only north/south and east/west grid lines.'}`;
    case 'turn-route': return `At S, face ${visual.facing}. ${visual.steps.map((step, index) => `Step ${index + 1}: ${step.turn === 'none' ? 'keep facing the same way' : `turn ${step.turn === 'back' ? 'around' : step.turn}`} and move ${step.distance} m`).join('; ')}. Find the final ${visual.ask === 'facing' ? 'facing direction' : 'position relative to S'}.`;
    case 'paths': return `Directed route map. Only labelled circles are junctions; crossing lines do not join. Arrows: ${visual.edges.map(edge => `${edge[0]} to ${edge[1]}`).join('; ')}. Travel from ${visual.start} to ${visual.finish}${visual.checkpoint ? ` through checkpoint ${visual.checkpoint}` : ''}${visual.forbidden ? ` without visiting closed junction ${visual.forbidden}` : ''}.`;
    case 'combinations': return `Choose one flag (${visual.flags.join(', ')}) and one badge (${visual.badges.map(badge => `${badge.id}, a ${badge.shape}`).join('; ')}). Only these pairs are excluded: ${visual.excluded.map(pair => `flag ${pair[0]} with badge ${pair[1]}`).join('; ')}. Count all allowed pairs.`;
    default: throw new Error(`Unknown reasoning visual kind: ${visual.kind}`);
  }
}

function picture(kind, givens) {
  const visual = { kind: `${PREFIX}${kind}`, ...clone(givens) };
  visual.description = describe(visual);
  return visual;
}

function checkVisual(visual) {
  ensure(visual && typeof visual.kind === 'string' && visual.kind.startsWith(PREFIX), 'the reasoning diagram kind is missing.');
  ensure(typeof visual.description === 'string' && visual.description.trim().length >= 15,
    'the diagram needs a meaningful accessible description.');
  // Recognise even option-only kinds before a renderer or solver uses their data.
  describe(visual);
}

function choicesOf(question) {
  if (Array.isArray(question.choices)) return question.choices;
  ensure(Array.isArray(question.options), 'the answer choices are missing.');
  ensure(question.optionVisuals == null || (Array.isArray(question.optionVisuals)
    && question.optionVisuals.length === question.options.length), 'graphical choices are not aligned with their values.');
  return question.options.map((value, index) => ({ value, visual: question.optionVisuals?.[index] ?? null }));
}

function checkChoices(question, answer, main) {
  if (question.answer !== undefined) ensure(question.answer === answer, 'the supplied answer does not match the givens.');
  const choices = choicesOf(question);
  ensure(choices.length >= 2 && choices.every(choice => typeof choice.value === 'string')
    && new Set(choices.map(choice => choice.value)).size === choices.length, 'answer choices must be distinct strings.');
  const family = question.family ?? question.proof.family;
  const graphical = ['mirror-grid', 'rotate-grid', 'figure-analogy', 'embedded-grid', 'symmetry-grid', 'cube-net'].includes(family);
  const optionKind = family === 'symmetry-grid' ? 'axis' : family === 'cube-net' ? 'face' : 'grid';
  for (const choice of choices) {
    if ('code' in choice) ensure(choice.value === answer ? choice.code === null : Boolean(MISCONCEPTIONS[choice.code]),
      'the correct choice or misconception code is invalid.');
    if (!choice.visual) {
      ensure(!graphical, 'a graphical answer is missing its diagram.');
      continue;
    }
    checkVisual(choice.visual);
    const option = choice.visual;
    ensure(graphical && option.kind === `${PREFIX}${optionKind}`, 'the answer diagram has the wrong semantic kind.');
    if (option.kind === `${PREFIX}grid`) {
      ensure(choice.value === gridKey(option.cells), 'a graphical answer value disagrees with its tile marks.');
      const sample = main.cells ?? main.c;
      const size = main.kind === `${PREFIX}embedded` ? main.size : sample.length;
      ensure(option.cells.length === size && option.cells[0].length === size, 'the answer picture has the wrong grid dimensions.');
    } else if (option.kind === `${PREFIX}axis`) {
      ensure(AXES.includes(option.axis) && choice.value === `axis:${option.axis}` && sameGrid(option.cells, main.cells),
        'a symmetry answer must show the original grid and the stated line.');
    } else if (option.kind === `${PREFIX}face`) {
      ensure(choice.value === option.label && main.faces.some(face => face.label === option.label),
        'the graphical face answer disagrees with the cube net.');
    } else {
      throw new Error(`Unknown reasoning answer visual kind: ${option.kind}`);
    }
  }
  ensure(choices.filter(choice => choice.value === answer).length === 1, 'the independently solved answer must occur exactly once.');
  return answer;
}

export function solveReasoning(question) {
  const family = question.family ?? question.proof?.family;
  ensure(REASONING_FAMILIES.includes(family), `unknown reasoning family ${family}.`);
  ensure(question.proof?.family === family && question.proof.givens, 'the reasoning proof family or givens are missing.');
  checkVisual(question.visual);
  ensure(stable(question.visual) === stable(question.proof.givens), 'the diagram and proof givens disagree.');
  const visual = question.visual;
  const expect = kind => ensure(visual.kind === `${PREFIX}${kind}`, `the ${family} diagram has the wrong kind.`);
  let answer;
  switch (family) {
    case 'mirror-grid':
      expect('mirror');
      ensure(['vertical', 'horizontal'].includes(visual.axis) && asymmetric(visual.cells), 'the mirror picture must be asymmetric and the mirror line specified.');
      answer = gridKey(transform(visual.cells, visual.axis === 'vertical' ? 'mirror-lr' : 'mirror-tb'));
      break;
    case 'rotate-grid':
      expect('rotation');
      ensure(['turn-right', 'turn-half'].includes(visual.turn) && asymmetric(visual.cells), 'the rotation must specify a turn of an asymmetric picture.');
      answer = gridKey(transform(visual.cells, visual.turn));
      break;
    case 'figure-analogy': {
      expect('analogy');
      ensure(asymmetric(visual.a) && asymmetric(visual.c) && visual.a.length === visual.c.length,
        'the analogy pictures must have distinct orientations and matching dimensions.');
      const rules = TRANSFORMS.filter(operation => sameGrid(transform(visual.a, operation), visual.b));
      ensure(rules.length === 1 && rules[0] !== 'identity', 'the example must determine exactly one non-trivial picture rule.');
      answer = gridKey(transform(visual.c, rules[0]));
      break;
    }
    case 'embedded-grid': {
      expect('embedded');
      ensure(['present', 'absent'].includes(visual.find), 'the embedded-picture condition is unknown.');
      const present = new Set(windows(visual.cells, visual.size).map(gridKey));
      const matches = choicesOf(question).filter(choice => {
        ensure(choice.visual?.kind === `${PREFIX}grid`, 'embedded-picture choices must be tile grids.');
        return present.has(gridKey(choice.visual.cells)) === (visual.find === 'present');
      });
      ensure(matches.length === 1, 'the embedded-picture condition must select exactly one choice.');
      answer = matches[0].value;
      break;
    }
    case 'symmetry-grid': {
      expect('symmetry');
      const axes = axesOf(visual.cells);
      ensure(axes.length === 1, 'the marked grid must have exactly one of the four mirror lines.');
      answer = `axis:${axes[0]}`;
      break;
    }
    case 'cube-net':
      expect('net');
      answer = oppositeFace(visual);
      break;
    case 'grid-boundary':
      expect('boundary');
      ensure(integer(visual.unit, 1, 10), 'the square-side length must be labelled.');
      answer = cm(boundaryFacts(visual.cells).exposed * visual.unit);
      break;
    case 'rectangle-constraint':
      expect('rectangle');
      answer = cm(rectangleFacts(visual).missing);
      break;
    case 'shaded-area':
    case 'area-inference': {
      expect('area');
      ensure(visual.mode === (family === 'shaded-area' ? 'given' : 'inferred'), 'the area question uses the wrong givens.');
      const facts = areaFacts(visual);
      answer = squareCm(facts.whole - facts.cut);
      break;
    }
    case 'angle-reason':
      expect('angles');
      answer = degrees(angleFacts(visual).answer);
      break;
    case 'code-key':
      expect('code-key');
      answer = keyFacts(visual).code;
      break;
    case 'code-infer':
      expect('code-infer');
      answer = inferCode(visual).code;
      break;
    case 'ranking':
      expect('ranking');
      answer = `${rankingFacts(visual)} children`;
      break;
    case 'ranking-change':
      expect('ranking-change');
      answer = rankingChangeFacts(visual).answer;
      break;
    case 'directions': {
      expect('directions');
      ensure(['axis-position', 'grid-distance'].includes(visual.ask), 'the map question is unknown.');
      const end = routePositions(visual).at(-1);
      if (visual.ask === 'axis-position') {
        ensure((end.x === 0) !== (end.y === 0), 'the younger map question must end along exactly one compass axis.');
        answer = positionText(end.x, end.y);
      } else answer = `${Math.abs(end.x) + Math.abs(end.y)} m`;
      break;
    }
    case 'turn-route':
      expect('turn-route');
      answer = turnFacts(visual).answer;
      break;
    case 'path-count':
    case 'path-condition': {
      expect('paths');
      ensure(family === 'path-condition' ? visual.checkpoint != null : visual.checkpoint == null && visual.forbidden == null,
        'the route question and checkpoint condition disagree.');
      const graph = graphFacts(visual);
      const count = graph.count({ checkpoint: visual.checkpoint, forbidden: visual.forbidden });
      ensure(count > 0, 'there must be at least one allowed route.');
      answer = routesText(count);
      break;
    }
    case 'combinations':
      expect('combinations');
      answer = `${combinationFacts(visual).allowed} pairs`;
      break;
    default: throw new Error(`Unknown reasoning family: ${family}`);
  }
  return checkChoices(question, answer, visual);
}

function candidate(family, grade, visual, prompt, answer, alternatives, explanation, hint, correctVisual = null) {
  const question = {
    family, prompt, answer: String(answer), explanation, hint,
    proof: { family, givens: clone(visual) }, visual,
    choices: answerChoices(answer, alternatives, choiceCount(grade), correctVisual),
  };
  solveReasoning(question);
  return question;
}

const wrongGrid = (cells, code = 'wrong-transform') => wrong(gridKey(cells), code, picture('grid', { cells }));

function draftTransform(family, grade, level, r) {
  const cells = randomGrid(r, grade.year >= 4 ? 4 : 3);
  if (family === 'mirror-grid') {
    const axis = grade.year >= 3 && level >= 2 ? r.pick(['vertical', 'horizontal']) : 'vertical';
    const operation = axis === 'vertical' ? 'mirror-lr' : 'mirror-tb';
    const result = transform(cells, operation);
    return candidate(family, grade, picture('mirror', { cells, axis }),
      `Which picture is the mirror image in the dashed line ${axis === 'vertical' ? 'on the right' : 'below'}? Keep every cross and dot.`,
      gridKey(result),
      [wrongGrid(changedMarks(result), 'ignored-mark'), wrongGrid(cells), wrongGrid(transform(cells, 'turn-right')), wrongGrid(transform(cells, 'turn-half'))],
      `A ${axis === 'vertical' ? 'right-side mirror reverses left and right within each row' : 'mirror below reverses the order of the rows'}. The cross and dot move with their tiles; they do not change into each other.`,
      `Track the crossed tile first. It must be the same distance from the mirror, on the other side.`,
      picture('grid', { cells: result }));
  }
  const turn = grade.year >= 3 ? r.pick(['turn-right', 'turn-half']) : 'turn-right';
  const result = transform(cells, turn);
  return candidate(family, grade, picture('rotation', { cells, turn }),
    `Which picture shows ${turn === 'turn-half' ? 'a half-turn' : 'a quarter-turn clockwise (the way clock hands turn)'} of the tile square?`,
    gridKey(result),
    [wrongGrid(cells), wrongGrid(transform(cells, 'turn-left')), wrongGrid(changedMarks(result), 'ignored-mark'), wrongGrid(transform(cells, 'mirror-lr'))],
    `${turn === 'turn-half' ? 'A half-turn takes each tile to the opposite row and column' : 'In a clockwise quarter-turn, the top row becomes the right-hand column'}. Follow the cross and dot as well as the filled tiles.`,
    'Follow one corner and the crossed tile through the stated turn.',
    picture('grid', { cells: result }));
}

function draftAnalogy(grade, r) {
  const size = grade.year >= 4 ? 4 : 3;
  const a = randomGrid(r, size);
  const c = randomGrid(r, size);
  const operation = r.pick(grade.year <= 2 ? ['mirror-lr', 'turn-right'] : grade.year === 3
    ? ['mirror-lr', 'mirror-tb', 'turn-right', 'turn-half']
    : TRANSFORMS.filter(value => value !== 'identity'));
  const b = transform(a, operation);
  const result = transform(c, operation);
  const names = {
    'mirror-lr': 'reflect left to right', 'mirror-tb': 'reflect top to bottom',
    'turn-right': 'turn a quarter-turn clockwise', 'turn-half': 'turn halfway round',
    'turn-left': 'turn a quarter-turn anticlockwise',
    'diagonal-main': 'reflect across the top-left to bottom-right diagonal',
    'diagonal-anti': 'reflect across the top-right to bottom-left diagonal',
  };
  return candidate('figure-analogy', grade, picture('analogy', { a, b, c }),
    'A changes to B by one picture rule. Which picture completes C → ? using exactly the same rule?',
    gridKey(result),
    [wrongGrid(c), wrongGrid(changedMarks(result), 'ignored-mark'),
      ...TRANSFORMS.filter(value => value !== operation && value !== 'identity').map(value => wrongGrid(transform(c, value)))],
    `The rule from A to B is: ${names[operation]}. Apply it to every tile of C, including both markings, not just its outline.`,
    'Work out where both the cross and dot move from A to B; use that movement on C.',
    picture('grid', { cells: result }));
}

function draftEmbedded(grade, r) {
  const size = grade.year >= 5 ? 3 : 2;
  const outer = grade.year >= 5 ? 6 : grade.year >= 3 ? 5 : 4;
  const cells = Array.from({ length: outer }, () => Array.from({ length: outer }, () => r.pick(grade.year === 1 ? [0, 0, 1, 2] : [0, 0, 1, 2, 3])));
  const present = [...new Map(windows(cells, size).map(grid => [gridKey(grid), grid])).values()];
  const presentKeys = new Set(present.map(gridKey));
  const absent = [];
  for (const source of r.shuffle(present)) {
    for (const operation of TRANSFORMS.filter(value => value !== 'identity')) {
      const transformed = transform(source, operation);
      if (!presentKeys.has(gridKey(transformed)) && !absent.some(grid => sameGrid(grid, transformed))) absent.push(transformed);
    }
    const movedMark = source.map(row => row.map(value => value === 2 ? 0 : value === 0 ? 2 : value));
    if (!presentKeys.has(gridKey(movedMark)) && !absent.some(grid => sameGrid(grid, movedMark))) absent.push(movedMark);
  }
  if (absent.length < 3 || present.length < 3) throw new QuestionRetry('The large grid needs distinct present and absent answer patterns.');
  const find = grade.year >= 5 ? 'absent' : 'present';
  const result = r.pick(find === 'absent' ? absent : present);
  const alternatives = r.shuffle(find === 'absent' ? present : absent).map(grid => wrongGrid(grid, find === 'absent' ? 'ignored-condition' : 'wrong-transform'));
  return candidate('embedded-grid', grade, picture('embedded', { cells, size, find }),
    `Which ${size} × ${size} small picture is ${find === 'absent' ? 'NOT present' : 'present'} inside the large grid? Use neighbouring rows and columns. Do not turn or flip the picture.`,
    gridKey(result), alternatives,
    find === 'absent'
      ? 'Slide each small picture over every possible block of neighbouring rows and columns. Three choices match exactly; the answer does not match anywhere without changing a mark or orientation.'
      : 'Slide the small picture without turning it. The correct choice matches every filled, empty and crossed tile in one block of neighbouring rows and columns.',
    'Check the crossed tile and its neighbouring empty tiles, not just the number of filled tiles.',
    picture('grid', { cells: result }));
}

function draftSymmetry(grade, r) {
  const axis = r.pick(AXES);
  const reflect = {
    vertical: (y, x) => [y, 3 - x],
    horizontal: (y, x) => [3 - y, x],
    'diagonal-main': (y, x) => [x, y],
    'diagonal-anti': (y, x) => [3 - x, 3 - y],
  }[axis];
  let cells;
  for (let attempt = 0; attempt < 60; attempt++) {
    const seed = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => r.pick([0, 0, 1, 2, 3])));
    cells = seed.map((row, y) => row.map((_, x) => {
      const [otherY, otherX] = reflect(y, x);
      const index = Math.min(y * 4 + x, otherY * 4 + otherX);
      return seed[Math.floor(index / 4)][index % 4];
    }));
    if (axesOf(cells).length === 1) break;
    cells = null;
  }
  if (!cells) throw new QuestionRetry('The marked square needs exactly one mirror line.');
  return candidate('symmetry-grid', grade, picture('symmetry', { cells }),
    'Which dashed line is a line of symmetry? A cross must match a cross, and a dot must match a dot.',
    `axis:${axis}`,
    AXES.filter(value => value !== axis).map(value => wrong(`axis:${value}`, 'ignored-mark', picture('axis', { cells, axis: value }))),
    `Only the ${axis.replaceAll('-', ' ')} line pairs every tile with an identical tile on the other side. The other lines fail when the tile markings are checked.`,
    'Imagine folding on each dashed line. Do all the markings land on identical markings?',
    picture('axis', { cells, axis }));
}

const CUBE_NETS = [
  [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [2, 2]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [3, 2]],
];

function draftCube(grade, r) {
  let positions = clone(r.pick(CUBE_NETS));
  const turns = r.int(0, 3);
  for (let turn = 0; turn < turns; turn++) positions = positions.map(([x, y]) => [-y, x]);
  if (r.pick([false, true])) positions = positions.map(([x, y]) => [-x, y]);
  const minX = Math.min(...positions.map(value => value[0]));
  const minY = Math.min(...positions.map(value => value[1]));
  const labels = r.shuffle(['A', 'B', 'C', 'D', 'E', 'F']);
  const faces = positions.map(([x, y], index) => ({ x: x - minX, y: y - minY, label: labels[index] }));
  const target = r.pick(labels);
  const visual = picture('net', { faces, target });
  const answer = oppositeFace(visual);
  const folded = foldNet(faces);
  const pairs = [...folded].filter(([label]) => label < oppositeFace({ faces, target: label }))
    .map(([label]) => `${label}–${oppositeFace({ faces, target: label })}`).join(', ');
  return candidate('cube-net', grade, visual,
    `The net folds into a cube. Which face is opposite face ${target}?`,
    answer, r.shuffle(labels.filter(label => ![target, answer].includes(label)))
      .map(label => wrong(label, 'opposite-faces', picture('face', { label }))),
    `Fold the squares into six different cube faces. The opposite pairs are ${pairs}. Therefore ${answer} is across from ${target}, not touching it along an edge.`,
    'Fold the four side faces around the cube; a neighbour in the flat net cannot be the opposite face.',
    picture('face', { label: answer }));
}

function draftBoundary(grade, r) {
  const width = r.int(3, grade.year >= 5 ? 6 : grade.year >= 4 ? 5 : 4);
  const height = r.int(3, grade.year >= 4 ? 5 : 3);
  const notchWidth = r.int(1, width - 2);
  const notchStart = r.int(1, width - notchWidth - 1);
  const depth = r.int(1, height - 1);
  const unit = r.int(1, grade.year >= 4 ? 4 : 2);
  let cells = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) =>
    y < depth && x >= notchStart && x < notchStart + notchWidth ? 0 : 1));
  if (r.pick([false, true])) cells = [...cells].reverse();
  if (r.pick([false, true])) cells = cells.map(row => [...row].reverse());
  const facts = boundaryFacts(cells);
  const answer = facts.exposed * unit;
  return candidate('grid-boundary', grade, picture('boundary', { cells, unit }),
    `Each small square has side ${unit} cm. What is the perimeter of the one shaded shape, including the edges inside the open notch?`,
    cm(answer),
    [wrong(cm(facts.squares * 4 * unit), 'internal-edges'), wrong(cm(2 * (width + height) * unit), 'internal-edges'),
      wrong(cm(facts.squares * unit * unit), 'area-perimeter'), wrong(cm(facts.exposed), 'unit-conversion')],
    `There are ${facts.squares} squares and ${facts.shared} shared edges. Shared edges are inside, so the exposed-edge count is 4 × ${facts.squares} − 2 × ${facts.shared} = ${facts.exposed}. Perimeter = ${facts.exposed} × ${unit} = ${answer} cm.`,
    'Trace the boundary into and out of the notch. Do not count edges shared by two shaded squares.');
}

function draftRectangle(grade, level, r) {
  let givens;
  if (grade.year <= 3) {
    const known = r.int(8, 16);
    const missing = r.int(3, 7);
    givens = { mode: 'single', known, perimeter: 2 * (known + missing) };
  } else {
    const reference = { length: r.int(12, 24), width: r.int(7, 11) };
    const same = grade.year === 4 && level >= 3;
    const delta = same ? 0 : 2 * r.pick([-4, -3, 3, 4, 5]);
    const knownSide = same ? 'length' : r.pick(['length', 'width']);
    const proposed = same ? reference.length + r.int(2, 5)
      : knownSide === 'length' ? reference.length + r.int(1, 4) : reference.width + r.int(1, 4);
    const known = Math.min(proposed, reference.length + reference.width + delta / 2 - 2);
    givens = { mode: 'related', reference, delta, knownSide, known };
  }
  const visual = picture('rectangle', givens);
  const facts = rectangleFacts(visual);
  const prompt = givens.mode === 'single'
    ? 'The rectangle has the perimeter shown. What is its missing width?'
    : `Use the perimeter relation between P and Q. What is Q’s missing ${givens.knownSide === 'length' ? 'width' : 'length'}?`;
  const alternatives = [
    wrong(cm(facts.perimeter - givens.known), 'missing-dimension'),
    wrong(cm(facts.perimeter / 2), 'missing-step'),
    wrong(cm(facts.perimeter - 2 * givens.known), 'missing-dimension'),
    ...(givens.mode === 'related' ? [
      wrong(cm(givens.knownSide === 'length' ? givens.reference.width : givens.reference.length), 'ignored-change'),
      wrong(cm(facts.perimeter / 2 - givens.known + givens.delta / 2), 'missing-dimension'),
    ] : []),
  ].filter(item => Number.parseFloat(item.value) > 0);
  return candidate('rectangle-constraint', grade, visual, prompt, cm(facts.missing), alternatives,
    `${givens.mode === 'related' ? `P’s perimeter is 2 × (${givens.reference.length} + ${givens.reference.width}) = ${2 * (givens.reference.length + givens.reference.width)} cm. Q’s perimeter is therefore ${facts.perimeter} cm. ` : ''}One length plus one width is half the perimeter: ${facts.perimeter} ÷ 2 = ${facts.perimeter / 2} cm. The missing side is ${facts.perimeter / 2} − ${givens.known} = ${facts.missing} cm.`,
    'A perimeter includes two lengths and two widths. First find half of Q’s perimeter.');
}

function draftArea(family, grade, r) {
  const outerWidth = r.int(12, 23);
  const height = r.int(8, 14);
  const cutWidth = r.int(3, Math.min(8, outerWidth - 4));
  const cutHeight = r.int(2, Math.min(6, height - 3));
  const inferred = family === 'area-inference';
  const visual = picture('area', {
    mode: inferred ? 'inferred' : 'given', outerWidth, cutWidth, cutHeight,
    ...(inferred ? { perimeter: 2 * (outerWidth + height) } : { outerHeight: height }),
  });
  const facts = areaFacts(visual);
  return candidate(family, grade, visual,
    `${inferred ? 'The perimeter shown belongs to the COMPLETE rectangle, including the unshaded corner. Find its missing height first. ' : ''}What is the area of the shaded part?`,
    squareCm(facts.whole - facts.cut),
    [wrong(squareCm(facts.whole), 'missing-step'), wrong(squareCm(facts.cut), 'fraction-complement'),
      wrong(squareCm((outerWidth - cutWidth) * (height - cutHeight)), 'missing-dimension'),
      ...(inferred ? [wrong(squareCm(outerWidth * (visual.perimeter - outerWidth) - facts.cut), 'missing-dimension')] : []),
      wrong(squareCm(2 * (outerWidth + height)), 'area-perimeter')],
    `${inferred ? `The height is ${visual.perimeter} ÷ 2 − ${outerWidth} = ${height} cm. ` : ''}The complete rectangle has area ${outerWidth} × ${height} = ${facts.whole} cm². The unshaded corner has area ${cutWidth} × ${cutHeight} = ${facts.cut} cm². Shaded area = ${facts.whole} − ${facts.cut} = ${facts.whole - facts.cut} cm².`,
    inferred ? 'The perimeter gives length + height after dividing by two. Then subtract the corner’s area, not its side lengths.'
      : 'Find the complete rectangle’s area, then remove the unshaded corner’s area.');
}

function draftAngles(grade, level, r) {
  let givens;
  if (level === 2 && r.pick([false, true])) {
    givens = { mode: 'straight', left: r.int(25, 55), middle: r.int(30, 65) };
  } else {
    const angle = r.pick([38, 42, 48, 54, 62, 68, 74]);
    const supplementary = level >= 3 || r.pick([false, true]);
    givens = {
      mode: 'parallel', parallel: true,
      known: { intersection: 'top', sector: supplementary ? 'LL' : 'UR', value: angle },
      query: { intersection: 'bottom', sector: supplementary ? 'UL' : 'UR', offset: level >= 3 ? r.int(8, 24) : 0 },
    };
  }
  const visual = picture('angles', givens);
  const facts = angleFacts(visual);
  const alternatives = givens.mode === 'straight'
    ? [wrong(degrees(180 - givens.left), 'missing-step'), wrong(degrees(givens.left + givens.middle), 'angle-relation'),
      wrong(degrees(180 - givens.middle), 'missing-step'), wrong(degrees(Math.abs(givens.left - givens.middle)), 'wrong-operation')]
    : [wrong(degrees(givens.known.value), 'angle-relation'), wrong(degrees(180 - givens.known.value), 'missing-step'),
      wrong(degrees(Math.abs(givens.known.value - givens.query.offset)), 'angle-relation'),
      wrong(degrees(90 - givens.known.value), 'angle-relation'),
      wrong(degrees(facts.target + givens.query.offset), 'reversed-operation')];
  return candidate('angle-reason', grade, visual,
    givens.mode === 'straight' ? 'The three marked angles make one straight angle. What is x?'
      : `The matching arrow marks show that l and m are parallel. ${givens.query.offset ? `The lower angle is labelled x + ${givens.query.offset}°. ` : ''}What is x?`,
    degrees(facts.answer), alternatives.filter(item => item.value !== '0°'),
    givens.mode === 'straight'
      ? `Angles on a straight line total 180°. Therefore x = 180° − ${givens.left}° − ${givens.middle}° = ${facts.answer}°.`
      : `${givens.known.sector === givens.query.sector ? 'Corresponding angles on parallel lines are equal' : 'The same-side interior angles between parallel lines total 180°'}. The complete lower marked angle is ${facts.target}°.${givens.query.offset ? ` Thus x = ${facts.target}° − ${givens.query.offset}° = ${facts.answer}°.` : ` So x = ${facts.answer}°.`}`,
    givens.mode === 'straight' ? 'Subtract both known pieces from 180°.' : 'Use the marked parallel lines first; then check whether the lower label is x or x plus another angle.');
}

function draftKey(grade, r) {
  const length = grade.year <= 2 ? 3 : grade.year === 3 ? 4 : 5;
  const shapes = r.shuffle(SHAPES).slice(0, grade.year <= 2 ? 3 : 4);
  const digits = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const key = shapes.map((shape, index) => ({ shape, digit: digits[index] }));
  const message = [...r.shuffle(shapes), ...r.shuffle(shapes)].slice(0, length);
  const order = grade.year >= 4 ? r.pick(['forward', 'backward']) : 'forward';
  const visual = picture('code-key', { key, message, order });
  const facts = keyFacts(visual);
  const swapped = [...facts.code];
  [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  const shiftedKey = new Map(shapes.map((shape, index) => [shape, String(digits[(index + 1) % shapes.length])]));
  const ordered = order === 'forward' ? message : [...message].reverse();
  return candidate('code-key', grade, visual,
    `Use the symbol key. What is the code for the message, read ${order === 'forward' ? 'left to right' : 'RIGHT TO LEFT'}?`,
    facts.code,
    [wrong([...facts.code].reverse().join(''), 'code-order'), wrong(swapped.join(''), 'code-order'),
      wrong(ordered.map(shape => shiftedKey.get(shape)).join(''), 'code-order'),
      wrong([...facts.code].sort().join(''), 'code-order')],
    `Read the symbols ${order === 'forward' ? 'from the left' : 'from the right'}. Their values in that order are ${[...facts.code].join(', ')}, so the complete code is ${facts.code}. Repeated symbols keep the same value.`,
    'Look up every symbol in the key and keep the stated reading order.');
}

function draftInfer(grade, r) {
  const templates = grade.year <= 2
    ? [{ words: ['MAP', 'PEN', 'NAP'], targets: ['MAN', 'PAN', 'NAME'] }]
    : grade.year === 3 ? [{ words: ['STAR', 'TARP', 'RATS'], targets: ['PART', 'TRAP', 'PAST'] }]
      : grade.year === 4 ? [{ words: ['SALT', 'LAST', 'TALL'], targets: ['STALL', 'ATLAS'] }]
        : [{ words: ['PLANE', 'PANEL', 'LEAP'], targets: ['NEPAL', 'PENAL'] }];
  const template = r.pick(templates);
  const letters = [...new Set(template.words.join(''))];
  const digits = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, letters.length).map(String);
  const secret = new Map(letters.map((letter, index) => [letter, digits[index]]));
  const order = grade.year >= 4 ? r.pick(['forward', 'backward']) : 'forward';
  const encode = word => (order === 'forward' ? [...word] : [...word].reverse()).map(letter => secret.get(letter)).join('');
  const examples = template.words.map(word => ({ word, code: encode(word) }));
  const target = r.pick(template.targets);
  const visual = picture('code-infer', { examples, target, orders: grade.year >= 4 ? ['forward', 'backward'] : ['forward'] });
  const facts = inferCode(visual);
  const swapped = [...facts.code];
  [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  const shifted = new Map(letters.map((letter, index) => [letter, digits[(index + 1) % digits.length]]));
  const targetLetters = facts.order === 'forward' ? [...target] : [...target].reverse();
  return candidate('code-infer', grade, visual,
    `Each letter always has the same distinct digit. ${grade.year >= 4 ? 'The examples also determine whether words are read forwards or backwards. ' : ''}What is the code for ${target}?`,
    facts.code,
    [wrong([...facts.code].reverse().join(''), 'code-order'), wrong(swapped.join(''), 'code-order'),
      wrong(targetLetters.map(letter => shifted.get(letter)).join(''), 'ignored-condition'),
      wrong([...facts.code].sort().join(''), 'code-order')],
    `Matching repeated letters across ALL examples gives ${[...facts.key].map(([letter, digit]) => `${letter} = ${digit}`).join(', ')}. Read ${facts.order === 'forward' ? 'left to right' : 'right to left'} consistently: ${target} becomes ${facts.code}.`,
    'Match repeated letters across different examples. A proposed key and reading direction must fit every example.');
}

function draftRanking(grade, r) {
  const young = grade.year <= 1;
  const mode = grade.year >= 4 ? 'two' : 'single';
  const frontRank = r.int(young ? 2 : 5, young ? 4 : grade.year >= 4 ? 18 : 12);
  const backRank = r.int(young ? 2 : 4, young ? 4 : grade.year >= 4 ? 16 : 10);
  const givens = { mode, frontRank, backRank, ...(mode === 'two' ? { between: r.int(2, 7) } : {}) };
  const visual = picture('ranking', givens);
  const answer = rankingFacts(visual);
  const values = mode === 'single' ? [frontRank + backRank, frontRank + backRank - 2, Math.abs(frontRank - backRank) + 1]
    : [frontRank + backRank - 1, answer + 1, answer - 1, frontRank + backRank];
  return candidate('ranking', grade, visual,
    mode === 'single' ? 'Mina has a rank from each end of the same line. How many children are there altogether?'
      : 'Mina stands ahead of Ravi, with the exact gap shown. How many children are in the whole line?',
    `${answer} children`, values.map(value => wrong(`${value} children`, 'rank-endpoints')),
    mode === 'single'
      ? `The front group and back group both include Mina. Count her once: ${frontRank} + ${backRank} − 1 = ${answer} children.`
      : `Count the front group including Mina (${frontRank}), the ${givens.between} children between them, and the back group including Ravi (${backRank}). These groups do not overlap: ${frontRank} + ${givens.between} + ${backRank} = ${answer}.`,
    mode === 'single' ? 'The same child is included in both ranks.' : 'Keep the children between Mina and Ravi separate from the two end groups.');
}

function draftRankingChange(grade, r) {
  const count = r.int(grade.year >= 4 ? 22 : 12, grade.year >= 4 ? 38 : 21);
  const otherFront = r.int(2, Math.floor(count / 3));
  const frontRank = r.int(otherFront + 3, count - 5);
  const backRank = count - otherFront + 1;
  const mode = grade.year >= 4 ? 'pair' : 'move';
  const joinFront = mode === 'pair' ? r.int(1, 4) : 0;
  const leaveBack = mode === 'pair' ? r.int(1, 3) : 0;
  const visual = picture('ranking-change', { mode, total: count, frontRank, backRank, joinFront, leaveBack });
  const facts = rankingChangeFacts(visual);
  const pair = (front, back) => `Front ${front}; back ${back}`;
  const alternatives = mode === 'move'
    ? [wrong(`${frontRank - otherFront - 1} places`, 'rank-endpoints'),
      wrong(`${frontRank - otherFront + 1} places`, 'rank-endpoints'),
      wrong(`${Math.abs(frontRank - backRank)} places`, 'rank-endpoints'),
      wrong(`${otherFront} places`, 'ignored-change')]
    : [wrong(pair(frontRank + joinFront, backRank - leaveBack), 'ignored-change'),
      wrong(pair(otherFront, facts.back), 'missing-step'), wrong(pair(facts.front, count - frontRank + 1), 'missing-step'),
      wrong(pair(facts.front - 1, facts.back - 1), 'rank-endpoints')];
  return candidate('ranking-change', grade, visual,
    mode === 'move' ? 'Mina and Ravi swap places. How many places does Mina move towards the front?'
      : 'Follow the swap, then both changes to the line. Which pair gives Mina’s final rank from the FRONT and Ravi’s final rank from the BACK?',
    facts.answer, alternatives,
    `Ravi starts ${count} − ${backRank} + 1 = ${otherFront} from the front. After the swap, Mina is at ${otherFront} and Ravi is at ${frontRank} from the front. ${mode === 'move'
      ? `Mina moves ${frontRank} − ${otherFront} = ${frontRank - otherFront} places, counting gaps rather than both endpoints.`
      : `The ${joinFront} arrivals put Mina at ${otherFront} + ${joinFront} = ${facts.front} from the front. Ravi’s back rank is ${count} − ${frontRank} + 1 − ${leaveBack} = ${facts.back}; arrivals at the front do not change his back rank.`}`,
    'Convert the back rank into a front position before swapping. Joining at one end changes ranks counted from that end.');
}

function draftDirections(grade, r) {
  const a = r.int(6, grade.year >= 4 ? 20 : 12);
  const b = r.int(4, grade.year >= 4 ? 16 : 10);
  const c = grade.year <= 3 ? a : r.int(2, a - 2);
  const d = grade.year <= 3 ? 0 : r.int(1, b - 2);
  const rotation = r.int(0, 3);
  const instructions = [[1, a], [0, b], [3, c], ...(d ? [[2, d]] : [])];
  const steps = instructions.map(([direction, distance]) => ({ direction: COMPASS[(direction + rotation) % 4], distance }));
  const ask = grade.year <= 3 ? 'axis-position' : 'grid-distance';
  const visual = picture('directions', { steps, ask });
  const end = routePositions(visual).at(-1);
  const distance = Math.abs(end.x) + Math.abs(end.y);
  const travelled = total(steps.map(step => step.distance));
  const alternatives = ask === 'axis-position'
    ? [wrong(positionText(-end.x, -end.y), 'turn-frame'),
      wrong(positionText(end.x ? Math.sign(end.x) * travelled : 0, end.y ? Math.sign(end.y) * travelled : 0), 'wrong-operation'),
      wrong(positionText(...VECTORS[COMPASS.indexOf(steps[0].direction)].map(value => value * a)), 'missing-step')]
    : [wrong(`${travelled} m`, 'wrong-operation'), wrong(`${a + b} m`, 'ignored-change'),
      wrong(`${Math.abs(Math.abs(end.x) - Math.abs(end.y))} m`, 'wrong-operation'),
      wrong(`${Math.abs(end.x)} m`, 'missing-step'), wrong(`${Math.abs(end.y)} m`, 'missing-step')];
  return candidate('directions', grade, visual,
    ask === 'axis-position' ? 'Follow the labelled route from S to F. How far, and in which direction, is F from S?'
      : 'After the route, what is the SHORTEST distance from S to F if you may move only north/south or east/west along grid lines?',
    ask === 'axis-position' ? positionText(end.x, end.y) : `${distance} m`, alternatives.filter(item => item.value !== '0 m'),
    `Opposite moves cancel. The final offset is ${positionText(end.x, end.y)}.${ask === 'grid-distance'
      ? ` A shortest grid-line route uses ${Math.abs(end.x)} + ${Math.abs(end.y)} = ${distance} m, not the whole ${travelled} m travelled.`
      : ` The ${a} m outward move and ${c} m opposite move cancel; the remaining move determines the position.`}`,
    'Use the compass and subtract moves in opposite directions. Route length and distance from the start are different.');
}

function draftTurns(grade, r) {
  const facing = r.pick(COMPASS);
  const ask = grade.year >= 4 ? 'position' : 'facing';
  const steps = [
    { turn: 'none', distance: r.int(3, 9) },
    { turn: r.pick(['left', 'right']), distance: r.int(2, 8) },
    { turn: r.pick(['left', 'right', 'back']), distance: r.int(2, 7) },
  ];
  const visual = picture('turn-route', { facing, ask, steps });
  const facts = turnFacts(visual);
  const alternatives = ask === 'facing'
    ? COMPASS.filter(direction => direction !== facts.facing).map(direction => wrong(direction, 'turn-frame'))
    : [wrong(turnFacts(visual, 'fixed-frame').answer, 'turn-frame'), wrong(turnFacts(visual, 'skip-last').answer, 'missing-step'),
      wrong(positionText(-facts.x, -facts.y), 'turn-frame'),
      wrong(positionText(...VECTORS[COMPASS.indexOf(facts.facing)].map(value => value * total(steps.map(step => step.distance)))), 'wrong-operation')];
  return candidate('turn-route', grade, visual,
    ask === 'facing' ? 'Start facing the arrow shown. After all the instructions, which way are you facing?'
      : 'Start facing the arrow shown. After every move and turn, where are you relative to S?',
    facts.answer, alternatives,
    `Left and right use the direction you face at that step, not the page. Following all instructions gives a final facing direction of ${facts.facing}${ask === 'position' ? ` and a final position of ${positionText(facts.x, facts.y)}` : ''}.`,
    'Turn your imaginary compass after each instruction before reading the next left or right.');
}

function makeGraph(grade, r, constrained) {
  const widths = grade.year <= 3 ? [1, 2, 2, 1] : grade.year === 4 ? [1, 2, 3, 2, 1] : [1, 3, 3, 2, 1];
  let nextLetter = 0;
  const layers = widths.map((width, layer) => Array.from({ length: width }, (_, index) => ({
    id: layer === 0 ? 'S' : layer === widths.length - 1 ? 'F' : 'ABCDEGHIJK'[nextLetter++],
    x: Math.round(30 + layer * 440 / (widths.length - 1)),
    y: width === 1 ? 145 : Math.round(55 + index * 180 / (width - 1)),
  })));
  const edges = [];
  for (let index = 0; index < layers.length - 1; index++) {
    const left = layers[index];
    const right = layers[index + 1];
    const add = (from, to) => { if (!edges.some(edge => edge[0] === from && edge[1] === to)) edges.push([from, to]); };
    left.forEach(node => add(node.id, r.pick(right).id));
    right.forEach(node => add(r.pick(left).id, node.id));
    left.forEach(from => right.forEach(to => { if (r.pick([false, true])) add(from.id, to.id); }));
  }
  const checkpoint = constrained ? r.pick(layers[Math.floor(layers.length / 2)]).id : null;
  const forbidden = constrained && grade.year >= 5 ? r.pick(layers[1]).id : null;
  return { nodes: layers.flat(), edges, start: 'S', finish: 'F', checkpoint, forbidden };
}

function draftPaths(family, grade, r) {
  const constrained = family === 'path-condition';
  const givens = makeGraph(grade, r, constrained);
  const visual = picture('paths', givens);
  const graph = graphFacts(visual);
  const all = graph.count();
  const allowed = graph.count({ checkpoint: givens.checkpoint, forbidden: givens.forbidden });
  if (all < 3 || allowed < 1 || (constrained && allowed === all)) throw new QuestionRetry('The route map needs a meaningful choice and checkpoint.');
  const layerSizes = [...new Set(givens.nodes.map(node => node.x))].slice(1, -1)
    .map(x => givens.nodes.filter(node => node.x === x).length);
  const possible = layerSizes.reduce((product, value) => product * value, 1);
  const values = constrained ? [
    all, all - graph.count({ checkpoint: givens.checkpoint }), graph.count({ checkpoint: givens.checkpoint }),
    graph.count({ forbidden: givens.forbidden }),
    graph.count({ finish: givens.checkpoint, forbidden: givens.forbidden })
      + graph.count({ start: givens.checkpoint, forbidden: givens.forbidden }),
    givens.edges.length, givens.nodes.length - 2,
  ] : [givens.edges.length, givens.nodes.length - 2, layerSizes.length + 1, possible, graph.outgoing.get(givens.start).length];
  const through = constrained ? graph.count({ checkpoint: givens.checkpoint, forbidden: givens.forbidden }) : null;
  return candidate(family, grade, visual,
    `How many different routes follow the arrows from S to F${constrained ? ` through checkpoint ${givens.checkpoint}` : ''}${givens.forbidden ? ` WITHOUT visiting ${givens.forbidden}` : ''}? Only circles are junctions; crossings do not join.`,
    routesText(allowed), values.filter(value => value > 0).map(value => wrong(routesText(value), 'path-constraint')),
    constrained
      ? `Count only arrow-following routes that visit ${givens.checkpoint}${givens.forbidden ? ` and never visit ${givens.forbidden}` : ''}. Track whether the checkpoint has been visited at every junction; this gives ${through} allowed routes, compared with ${all} routes before applying the conditions. Crossing lines do not create extra junctions.`
      : `Start with one way at S. At each circle, add the ways arriving along its incoming arrows. Keep different incoming routes separate even when they share a later arrow. This gives ${all} routes at F; counting arrows or circles alone does not count routes.`,
    'Write the number of ways at each junction. For a checkpoint question, keep routes that have visited the checkpoint separate.');
}

function draftCombinations(grade, r) {
  const flagCount = r.int(grade.year >= 5 ? 4 : 3, grade.year >= 5 ? 5 : 4);
  const badgeCount = r.int(grade.year <= 3 ? 2 : 3, grade.year >= 5 ? 5 : grade.year === 4 ? 4 : 3);
  const flags = r.shuffle(['A', 'B', 'C', 'D', 'E']).slice(0, flagCount).sort();
  const badges = r.shuffle(SHAPES).slice(0, badgeCount).map((shape, index) => ({ id: String(index + 1), shape }));
  const pairs = flags.flatMap(flag => badges.map(badge => [flag, badge.id]));
  const excludedCount = r.int(grade.year >= 5 ? 3 : grade.year === 4 ? 2 : 1, grade.year >= 5 ? 6 : grade.year === 4 ? 4 : 3);
  const excluded = r.shuffle(pairs).slice(0, excludedCount);
  const visual = picture('combinations', { flags, badges, excluded });
  const facts = combinationFacts(visual);
  return candidate('combinations', grade, visual,
    'Choose ONE flag and ONE badge. The crossed-out pairs are not allowed; all other pairs are allowed. How many different pairs can you make?',
    `${facts.allowed} pairs`,
    [wrong(`${facts.all} pairs`, 'ignored-condition'), wrong(`${facts.all - 1} pairs`, 'missing-step'),
      wrong(`${flags.length + badges.length - excluded.length} pairs`, 'wrong-operation'),
      wrong(`${excluded.length} pairs`, 'ignored-condition'),
      wrong(`${facts.all - new Set(excluded.map(pair => pair[0])).size} pairs`, 'ignored-condition')],
    `Each of the ${flags.length} flags can first be paired with each of the ${badges.length} badges: ${flags.length} × ${badges.length} = ${facts.all}. Remove the ${excluded.length} distinct crossed-out pairs once each: ${facts.all} − ${excluded.length} = ${facts.allowed} allowed pairs.`,
    'Count all one-from-each pairs first. Then remove each forbidden pair, not every pair containing that flag.');
}

export function draftReasoning(family, grade, level, r) {
  ensure(REASONING_FAMILIES.includes(family), `unknown reasoning family ${family}.`);
  ensure(integer(grade?.year, -1, 5) && integer(level, 1, 3), 'the grade or challenge level is invalid.');
  switch (family) {
    case 'mirror-grid':
    case 'rotate-grid': return draftTransform(family, grade, level, r);
    case 'figure-analogy': return draftAnalogy(grade, r);
    case 'embedded-grid': return draftEmbedded(grade, r);
    case 'symmetry-grid': return draftSymmetry(grade, r);
    case 'cube-net': return draftCube(grade, r);
    case 'grid-boundary': return draftBoundary(grade, r);
    case 'rectangle-constraint': return draftRectangle(grade, level, r);
    case 'shaded-area':
    case 'area-inference': return draftArea(family, grade, r);
    case 'angle-reason': return draftAngles(grade, level, r);
    case 'code-key': return draftKey(grade, r);
    case 'code-infer': return draftInfer(grade, r);
    case 'ranking': return draftRanking(grade, r);
    case 'ranking-change': return draftRankingChange(grade, r);
    case 'directions': return draftDirections(grade, r);
    case 'turn-route': return draftTurns(grade, r);
    case 'path-count':
    case 'path-condition': return draftPaths(family, grade, r);
    case 'combinations': return draftCombinations(grade, r);
    default: throw new Error(`Unknown reasoning family: ${family}`);
  }
}

function arrow(x1, y1, x2, y2, { width = 2.5, stroke = INK, head = 9 } = {}) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const a = { x: x2 - head * Math.cos(angle - Math.PI / 6), y: y2 - head * Math.sin(angle - Math.PI / 6) };
  const b = { x: x2 - head * Math.cos(angle + Math.PI / 6), y: y2 - head * Math.sin(angle + Math.PI / 6) };
  return line(x1, y1, x2, y2, { width, stroke })
    + path(`M${a.x} ${a.y} L${x2} ${y2} L${b.x} ${b.y}`, { stroke, strokeWidth: width });
}

function dimension(x1, y1, x2, y2, label, vertical = false) {
  const dx = vertical ? 5 : 0;
  const dy = vertical ? 0 : 5;
  return line(x1, y1, x2, y2, { width: 1.5 })
    + line(x1 - dx, y1 - dy, x1 + dx, y1 + dy, { width: 1.5 })
    + line(x2 - dx, y2 - dy, x2 + dx, y2 + dy, { width: 1.5 })
    + text((x1 + x2) / 2 + (vertical ? 12 : 0), (y1 + y2) / 2 + (vertical ? 5 : -9), label,
      { size: 18, anchor: vertical ? 'start' : 'middle' });
}

function gridPanel(cells, x, y, size, label = '') {
  return (label ? text(x + cells[0].length * size / 2, y - 12, label, { size: 20 }) : '') + tileGrid(cells, x, y, size);
}

function renderTile(visual, name) {
  if (name === 'grid' || name === 'axis') {
    checkGrid(visual.cells, { square: true });
    const n = visual.cells.length;
    const size = 116 / n;
    let body = tileGrid(visual.cells, 32, 18, size);
    if (name === 'axis') {
      ensure(AXES.includes(visual.axis), 'the option mirror line is unknown.');
      const endpoints = {
        vertical: [90, 8, 90, 144], horizontal: [22, 76, 158, 76],
        'diagonal-main': [24, 10, 156, 142], 'diagonal-anti': [156, 10, 24, 142],
      }[visual.axis];
      body += line(...endpoints, { stroke: '#7a3455', width: 3, dash: '7 4' });
    }
    return svg(body, visual.description, 180, 154);
  }
  if (name === 'analogy') {
    const size = 108 / visual.a.length;
    const body = gridPanel(visual.a, 68, 34, size, 'A') + gridPanel(visual.b, 302, 34, size, 'B')
      + arrow(205, 86, 267, 86)
      + gridPanel(visual.c, 68, 192, size, 'C') + arrow(205, 245, 267, 245)
      + rect(302, 192, 108, 108, { stroke: INK, rx: 5 }) + text(356, 263, '?', { size: 46 });
    return svg(body, visual.description, 480, 318);
  }
  checkGrid(visual.cells, { square: true });
  const n = visual.cells.length;
  const side = name === 'embedded' ? 206 : 156;
  const size = side / n;
  const x = name === 'embedded' ? 137 : 140;
  const y = name === 'embedded' ? 25 : 38;
  let body = tileGrid(visual.cells, x, y, size);
  if (name === 'mirror') {
    body += visual.axis === 'vertical'
      ? line(x + side + 24, y - 12, x + side + 24, y + side + 12, { width: 3, dash: '7 5' }) + text(x + side + 26, y + side + 38, 'Mirror', { size: 18 })
      : line(x - 15, y + side + 22, x + side + 15, y + side + 22, { width: 3, dash: '7 5' }) + text(x + side / 2, y + side + 50, 'Mirror', { size: 18 });
  } else if (name === 'rotation') {
    body += path('M335 62 C390 60 396 139 352 150', { strokeWidth: 3 })
      + arrow(365, 145, 349, 152) + text(365, 183, visual.turn === 'turn-half' ? '½ turn' : '¼ turn', { size: 19 });
  } else if (name === 'symmetry') {
    body += text(240, 230, 'Markings must match too.', { size: 18 });
  } else if (name === 'embedded') {
    body += text(240, 258, visual.find === 'absent' ? 'Find the pattern NOT present.' : 'Keep the small pattern the same way up.', { size: 18 });
  }
  return svg(body, visual.description, 480, name === 'embedded' ? 278 : 260);
}

function renderNet(visual) {
  foldNet(visual.faces);
  const columns = Math.max(...visual.faces.map(face => face.x)) + 1;
  const rows = Math.max(...visual.faces.map(face => face.y)) + 1;
  const size = Math.min(58, 215 / rows);
  const left = (480 - columns * size) / 2;
  const body = visual.faces.map(face => rect(left + face.x * size, 14 + face.y * size, size, size)
    + text(left + (face.x + 0.5) * size, 14 + (face.y + 0.5) * size + 8, face.label, { size: 26 })).join('')
    + text(240, 253, `Opposite ${visual.target}?`, { size: 20 });
  return svg(body, visual.description, 480, 273);
}

function renderBoundary(visual) {
  boundaryFacts(visual.cells);
  const rows = visual.cells.length;
  const columns = visual.cells[0].length;
  const size = Math.min(42, 206 / rows, 285 / columns);
  const left = (480 - columns * size) / 2;
  const top = 25;
  let body = '';
  visual.cells.forEach((row, y) => row.forEach((value, x) => {
    if (!value) return;
    const xx = left + x * size;
    const yy = top + y * size;
    body += rect(xx, yy, size, size, { fill: '#c7ded5', strokeWidth: 1 });
    body += line(xx + 5, yy + size - 6, xx + size - 6, yy + 5, { stroke: GREEN, width: 1 });
    for (const [dx, dy, edge] of [
      [0, -1, [xx, yy, xx + size, yy]], [0, 1, [xx, yy + size, xx + size, yy + size]],
      [-1, 0, [xx, yy, xx, yy + size]], [1, 0, [xx + size, yy, xx + size, yy + size]],
    ]) {
      if (!visual.cells[y + dy]?.[x + dx]) body += line(...edge, { width: 3 });
    }
  }));
  body += text(240, top + rows * size + 35, `Every square side = ${visual.unit} cm`, { size: 19 });
  return svg(body, visual.description, 480, top + rows * size + 56);
}

function renderRectangle(visual) {
  rectangleFacts(visual);
  if (visual.mode === 'single') {
    return svg(rect(108, 72, 240, 116, { fill: '#e6eee6' })
      + dimension(108, 57, 348, 57, cm(visual.known))
      + dimension(365, 72, 365, 188, '? cm', true)
      + text(240, 226, `Perimeter = ${visual.perimeter} cm`, { size: 21 })
      + text(240, 253, 'Not to scale', { size: 16 }), visual.description, 480, 270);
  }
  const body = text(108, 26, 'P', { size: 22 }) + text(335, 26, 'Q', { size: 22 })
    + rect(40, 78, 135, 100, { fill: '#e6eee6' }) + rect(270, 78, 130, 100, { fill: '#f5e6cb' })
    + dimension(40, 61, 175, 61, cm(visual.reference.length))
    + dimension(190, 78, 190, 178, cm(visual.reference.width), true)
    + dimension(270, 61, 400, 61, visual.knownSide === 'length' ? cm(visual.known) : '? cm')
    + dimension(415, 78, 415, 178, visual.knownSide === 'width' ? cm(visual.known) : '? cm', true)
    + text(240, 238, visual.delta === 0 ? 'Same perimeter' : `Q’s perimeter = P’s ${visual.delta > 0 ? '+' : '−'} ${Math.abs(visual.delta)} cm`, { size: 20 })
    + text(240, 264, 'Diagrams not to scale.', { size: 17 });
  return svg(body, visual.description, 480, 282);
}

function renderArea(visual) {
  const facts = areaFacts(visual);
  const left = 85;
  const top = 68;
  const width = 264;
  const height = 156;
  const cutWidth = width * visual.cutWidth / visual.outerWidth;
  const cutHeight = height * visual.cutHeight / facts.height;
  const notchX = left + width - cutWidth;
  let body = rect(left, top, width, height, { fill: '#d4e5da' });
  // Short diagonal strokes distinguish the shaded region without relying on colour.
  for (let x = left + 10; x < left + width; x += 18) {
    for (let y = top + 11; y < top + height; y += 21) {
      if (x < notchX - 5 || y > top + cutHeight + 5) body += line(x - 4, y + 4, x + 4, y - 4, { stroke: GREEN, width: 1.2 });
    }
  }
  body += rect(notchX, top, cutWidth, cutHeight, { fill: PAPER })
    + dimension(left, 244, left + width, 244, cm(visual.outerWidth))
    + dimension(365, top, 365, top + cutHeight, cm(visual.cutHeight), true)
    + dimension(notchX, top - 12, left + width, top - 12, cm(visual.cutWidth))
    + text(61, 154, visual.mode === 'inferred' ? '?' : cm(facts.height), { size: 18 })
    + text(240, 28, visual.mode === 'inferred' ? `Complete rectangle perimeter = ${visual.perimeter} cm` : 'Find the hatched area.', { size: 20 })
    + text(240, 281, 'Unhatched corner is removed. Not to scale.', { size: 17 });
  return svg(body, visual.description, 480, 299);
}

function angleArc(x, y, radius, start, end) {
  const point = angle => [x + radius * Math.cos(angle * Math.PI / 180), y - radius * Math.sin(angle * Math.PI / 180)];
  const a = point(start);
  const b = point(end);
  return path(`M${a[0]} ${a[1]} A${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 0 ${b[0]} ${b[1]}`, { stroke: '#7a3455', strokeWidth: 2 });
}

function sectorMark(x, y, acute, sector, label) {
  const [start, end] = { UR: [0, acute], UL: [acute, 180], LL: [180, 180 + acute], LR: [180 + acute, 360] }[sector];
  const angle = (start + end) / 2 * Math.PI / 180;
  const radius = label.length > 5 ? 56 : 48;
  return angleArc(x, y, 27, start, end)
    + text(x + radius * Math.cos(angle), y - radius * Math.sin(angle) + 5, label, { size: 18 });
}

function renderAngles(visual) {
  const facts = angleFacts(visual);
  if (visual.mode === 'straight') {
    const x = 240;
    const y = 215;
    const radius = 155;
    const first = 180 - visual.left;
    const second = first - visual.middle;
    const ray = angle => line(x, y, x + radius * Math.cos(angle * Math.PI / 180), y - radius * Math.sin(angle * Math.PI / 180), { width: 3 });
    const mark = (start, end, label) => {
      const angle = (start + end) / 2 * Math.PI / 180;
      return angleArc(x, y, 40, start, end) + text(x + 76 * Math.cos(angle), y - 76 * Math.sin(angle), label, { size: 20 });
    };
    const body = line(40, y, 440, y, { width: 3 }) + ray(first) + ray(second)
      + mark(first, 180, degrees(visual.left)) + mark(second, first, degrees(visual.middle)) + mark(0, second, 'x')
      + circle(x, y, 4, { fill: INK }) + text(240, 251, 'One straight angle = 180°', { size: 20 });
    return svg(body, visual.description, 480, 275);
  }
  const acute = facts.acute;
  const topY = 86;
  const bottomY = 205;
  const bottomX = 190;
  const topX = bottomX + (bottomY - topY) / Math.tan(acute * Math.PI / 180);
  const pointAt = y => bottomX + (bottomY - y) / Math.tan(acute * Math.PI / 180);
  let body = line(35, topY, 445, topY, { width: 3 }) + line(35, bottomY, 445, bottomY, { width: 3 })
    + line(pointAt(268), 268, pointAt(24), 24, { width: 3 });
  for (const y of [topY, bottomY]) {
    body += path(`M84 ${y - 6} L93 ${y} L84 ${y + 6} M94 ${y - 6} L103 ${y} L94 ${y + 6}`, { strokeWidth: 2 });
  }
  body += text(25, topY - 13, 'l', { size: 21 }) + text(25, bottomY - 13, 'm', { size: 21 })
    + sectorMark(topX, topY, acute, visual.known.sector, degrees(visual.known.value))
    + sectorMark(bottomX, bottomY, acute, visual.query.sector, visual.query.offset ? `x + ${visual.query.offset}°` : 'x')
    + text(396, 264, 'l ∥ m', { size: 20 });
  return svg(body, visual.description, 480, 288);
}

function renderCode(visual, name) {
  if (name === 'code-key') {
    keyFacts(visual);
    const spacing = 420 / visual.key.length;
    let body = text(240, 24, 'CODE KEY', { size: 19 });
    visual.key.forEach((item, index) => {
      const x = 30 + index * spacing;
      body += icon(item.shape, x, 42, 40, GREEN) + text(x + 62, 70, `= ${item.digit}`, { size: 23 });
    });
    const messageWidth = visual.message.length * 57;
    body += text(240, 130, visual.order === 'forward' ? 'MESSAGE: read left → right' : 'MESSAGE: read right → left', { size: 19 });
    visual.message.forEach((shape, index) => { body += icon(shape, (480 - messageWidth) / 2 + index * 57, 151, 43, ORANGE); });
    return svg(body, visual.description, 480, 221);
  }
  inferCode(visual);
  let body = text(240, 27, 'ONE FIXED DIGIT FOR EACH LETTER', { size: 18 });
  visual.examples.forEach((example, index) => {
    const y = 69 + index * 44;
    body += rect(78, y - 25, 324, 36, { fill: index % 2 ? '#eaf0e8' : PAPER, rx: 5 })
      + text(154, y, example.word, { size: 24 }) + arrow(215, y - 8, 252, y - 8)
      + text(327, y, example.code, { size: 24 });
  });
  const bottom = 69 + visual.examples.length * 44;
  body += text(240, bottom + 8, `${visual.target}  →  ?`, { size: 27 });
  if (visual.orders.length > 1) body += text(240, bottom + 39, 'Same reading direction in every example.', { size: 17 });
  return svg(body, visual.description, 480, bottom + 57);
}

function rankCard(x, y, label, detail, fill = PAPER) {
  return rect(x, y, 194, 70, { rx: 8, fill }) + text(x + 97, y + 27, label, { size: 22 })
    + text(x + 97, y + 54, detail, { size: 18 });
}

function renderRanking(visual, name) {
  if (name === 'ranking') {
    rankingFacts(visual);
    if (visual.mode === 'single') {
      const body = text(62, 49, 'FRONT', { size: 18 }) + text(418, 49, 'BACK', { size: 18 })
        + arrow(90, 80, 193, 80) + arrow(390, 80, 287, 80)
        + rankCard(143, 109, 'Mina', `${ordinal(visual.frontRank)} front; ${ordinal(visual.backRank)} back`, '#e7eee4')
        + text(240, 218, 'The same child belongs to both counts.', { size: 18 });
      return svg(body, visual.description, 480, 243);
    }
    const body = rankCard(20, 42, 'Mina', `${ordinal(visual.frontRank)} from front`, '#e7eee4')
      + rankCard(266, 42, 'Ravi', `${ordinal(visual.backRank)} from back`, '#f4e7cf')
      + arrow(218, 77, 260, 77) + text(240, 154, `${visual.between} children strictly between`, { size: 21 })
      + text(240, 190, 'FRONT → Mina → gap → Ravi → BACK', { size: 18 });
    return svg(body, visual.description, 480, 222);
  }
  rankingChangeFacts(visual);
  let body = text(240, 28, `${visual.total} children in the line`, { size: 22 })
    + rankCard(20, 51, 'Mina', `${ordinal(visual.frontRank)} from front`, '#e7eee4')
    + rankCard(266, 51, 'Ravi', `${ordinal(visual.backRank)} from back`, '#f4e7cf')
    + arrow(193, 144, 285, 144) + arrow(285, 158, 193, 158)
    + text(240, 190, '1. Swap Mina and Ravi', { size: 20 });
  if (visual.mode === 'pair') {
    body += text(240, 226, `2. ${visual.joinFront} join at FRONT`, { size: 20 })
      + text(240, 258, `3. ${visual.leaveBack} leave from BACK`, { size: 20 });
  } else body += text(240, 226, 'How many places does Mina move?', { size: 20 });
  return svg(body, visual.description, 480, visual.mode === 'pair' ? 280 : 250);
}

function compass(x, y, size = 26) {
  return arrow(x, y + size, x, y - size, { width: 1.8, head: 7 }) + line(x - size, y, x + size, y, { width: 1.8 })
    + text(x, y - size - 8, 'N', { size: 17 }) + text(x + size + 12, y + 5, 'E', { size: 17 })
    + text(x, y + size + 20, 'S', { size: 17 }) + text(x - size - 12, y + 5, 'W', { size: 17 });
}

function renderDirections(visual) {
  const positions = routePositions(visual);
  const xs = positions.map(point => point.x);
  const ys = positions.map(point => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX || 1;
  const spanY = Math.max(...ys) - minY || 1;
  const scale = Math.min(275 / spanX, 155 / spanY);
  const map = point => ({ x: 65 + (point.x - minX) * scale, y: 222 - (point.y - minY) * scale });
  let body = compass(420, 65);
  positions.slice(1).forEach((position, index) => {
    const from = map(positions[index]);
    const to = map(position);
    body += arrow(from.x, from.y, to.x, to.y, { width: 3, head: 11 });
    const horizontal = from.y === to.y;
    body += text((from.x + to.x) / 2 + (horizontal ? 0 : 25), (from.y + to.y) / 2 + (horizontal ? -13 : 5),
      `${visual.steps[index].distance} m`, { size: 18 });
  });
  positions.forEach((position, index) => {
    const point = map(position);
    const label = index === 0 ? 'S' : index === positions.length - 1 ? 'F' : String.fromCharCode(64 + index);
    body += circle(point.x, point.y, 5, { fill: PAPER, strokeWidth: 2 })
      + text(point.x - 14, point.y + 22, label, { size: 20 });
  });
  body += text(240, 280, 'All distances are labelled in metres.', { size: 18 });
  return svg(body, visual.description, 480, 300);
}

function renderTurns(visual) {
  turnFacts(visual);
  const facing = COMPASS.indexOf(visual.facing);
  const [dx, dy] = VECTORS[facing];
  let body = compass(413, 65) + circle(91, 76, 25, { fill: PAPER }) + text(91, 82, 'S', { size: 23 })
    + arrow(91 + dx * 30, 76 - dy * 30, 91 + dx * 63, 76 - dy * 63, { width: 3 })
    + text(260, 75, `Start facing ${visual.facing}`, { size: 20 });
  visual.steps.forEach((step, index) => {
    const y = 134 + index * 43;
    const instruction = step.turn === 'none' ? 'Go straight' : step.turn === 'back' ? 'Turn around' : `Turn ${step.turn}`;
    body += rect(49, y - 22, 382, 35, { rx: 6, fill: index % 2 ? '#f5e9d4' : '#e8eee5' })
      + text(240, y + 2, `${index + 1}. ${instruction}; move ${step.distance} m`, { size: 20 });
  });
  return svg(body, visual.description, 480, 151 + visual.steps.length * 43);
}

function renderPaths(visual) {
  const graph = graphFacts(visual);
  let body = '';
  for (const [fromId, toId] of visual.edges) {
    const from = graph.nodes.get(fromId);
    const to = graph.nodes.get(toId);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    body += arrow(from.x + Math.cos(angle) * 19, from.y + Math.sin(angle) * 19,
      to.x - Math.cos(angle) * 21, to.y - Math.sin(angle) * 21, { width: 2.2, head: 9 });
  }
  for (const node of visual.nodes) {
    body += circle(node.x, node.y, 18, { fill: PAPER, strokeWidth: 2.3 })
      + text(node.x, node.y + 6, node.id, { size: 20 });
    if (node.id === visual.checkpoint) body += circle(node.x, node.y, 23, { fill: 'none', strokeWidth: 2 })
      + text(node.x, node.y + 43, 'check', { size: 16 });
    if (node.id === visual.forbidden) body += line(node.x - 14, node.y - 14, node.x + 14, node.y + 14, { width: 3 })
      + line(node.x + 14, node.y - 14, node.x - 14, node.y + 14, { width: 3 });
  }
  body += text(250, 293, 'Only circles are junctions. Follow the arrows.', { size: 18 });
  return svg(body, visual.description, 500, 312);
}

function flag(label, x, y, size = 38) {
  const style = label.charCodeAt(0) % 3;
  let body = line(x + 4, y, x + 4, y + size + 9, { width: 2.5 })
    + path(`M${x + 4} ${y} H${x + size} L${x + size - 9} ${y + size / 2} L${x + size} ${y + size} H${x + 4} Z`, { fill: '#d6e5d7', strokeWidth: 2 });
  if (style === 0) body += line(x + 8, y + 9, x + size - 5, y + 9) + line(x + 8, y + 24, x + size - 5, y + 24);
  if (style === 1) body += circle(x + 17, y + 12, 2.5, { fill: INK }) + circle(x + 24, y + 25, 2.5, { fill: INK });
  if (style === 2) body += line(x + 10, y + 6, x + 28, y + 30) + line(x + 27, y + 6, x + 10, y + 30);
  return body;
}

function renderCombinations(visual) {
  combinationFacts(visual);
  let body = text(240, 25, 'FLAGS — choose one', { size: 19 });
  visual.flags.forEach((label, index) => {
    const x = 45 + index * 400 / visual.flags.length;
    body += flag(label, x, 40) + text(x + 23, 112, label, { size: 21 });
  });
  body += text(240, 146, 'BADGES — choose one', { size: 19 });
  visual.badges.forEach((badge, index) => {
    const x = 45 + index * 400 / visual.badges.length;
    body += icon(badge.shape, x, 162, 40, ORANGE) + text(x + 22, 224, badge.id, { size: 21 });
  });
  body += text(240, 260, 'THESE PAIRS ONLY ARE NOT ALLOWED', { size: 18 });
  visual.excluded.forEach((pair, index) => {
    const x = 24 + index % 3 * 154;
    const y = 277 + Math.floor(index / 3) * 57;
    body += rect(x, y, 143, 44, { rx: 5 }) + text(x + 71, y + 28, `${pair[0]} + ${pair[1]}`, { size: 23 })
      + line(x + 11, y + 37, x + 132, y + 7, { stroke: '#7a3455', width: 2.5 });
  });
  return svg(body, visual.description, 480, 289 + Math.ceil(visual.excluded.length / 3) * 57);
}

export function renderReasoning(visual) {
  checkVisual(visual);
  const name = visual.kind.slice(PREFIX.length);
  switch (name) {
    case 'grid':
    case 'mirror':
    case 'rotation':
    case 'analogy':
    case 'embedded':
    case 'symmetry':
    case 'axis': return renderTile(visual, name);
    case 'net': return renderNet(visual);
    case 'face':
      ensure(/^[A-F1-6]$/.test(visual.label), 'the face label is invalid.');
      return svg(rect(40, 15, 80, 80) + text(80, 68, visual.label, { size: 34 }), visual.description, 160, 112);
    case 'boundary': return renderBoundary(visual);
    case 'rectangle': return renderRectangle(visual);
    case 'area': return renderArea(visual);
    case 'angles': return renderAngles(visual);
    case 'code-key':
    case 'code-infer': return renderCode(visual, name);
    case 'ranking':
    case 'ranking-change': return renderRanking(visual, name);
    case 'directions': return renderDirections(visual);
    case 'turn-route': return renderTurns(visual);
    case 'paths': return renderPaths(visual);
    case 'combinations': return renderCombinations(visual);
    default: throw new Error(`Unknown reasoning visual kind: ${visual.kind}`);
  }
}
