// PP1 chapter: Shape station. Name a shape, count corners, hunt shapes in a picture, match shadows, find the missing piece, pick solid things.
import { MISCONCEPTIONS as SHARED, answerChoices, choiceCount } from './bank-shared.mjs';
import { ORANGE, text } from './diagram-kit.mjs';
import {
  HUES, INK, PAPER, QuestionRetry, build, darker, lighter, moonGround, n1, pickOption, plate, say, shapeSvg, spreadWrongs, svg, wrong,
} from './bank3-pp1-art.mjs';

export const MISCONCEPTIONS = {
  'pp1-shape-other': { title: 'Check the corners', message: 'That is a different shape. Count its corners and sides.' },
  'pp1-shape-round': { title: 'Round or pointy', message: 'That one is round. Look for the shape with straight sides and corners.' },
  'pp1-shape-corners': { title: 'Round has no corners', message: 'A round shape has no corners. Look for the smooth one.' },
  'pp1-corners-off': { title: 'Count each corner once', message: 'Touch each corner one time as you count. Do not skip or repeat.' },
  'pp1-scene-miss': { title: 'Look all around', message: 'You missed one. Look all around the picture and touch each one.' },
  'pp1-scene-extra': { title: 'Count only that shape', message: 'Count only the shape you are asked for. Skip the other shapes.' },
  'pp1-scene-other': { title: 'Wrong shape counted', message: 'That is how many of a different shape. Count the shape you were asked for.' },
  'pp1-shadow-other': { title: 'Match the outline', message: 'The outline is different. Trace the shadow with your finger.' },
  'pp1-hole-other': { title: 'Look at the other pieces', message: 'That is a different shape. Look at the pieces beside the gap.' },
  'pp1-hole-turn': { title: 'Point the right way', message: 'The shape is right, but it points the wrong way for the gap.' },
  'pp1-solid-flat': { title: 'Flat sides do not roll', message: 'Flat sides slide, they do not roll. Look for a round one.' },
  'pp1-solid-round': { title: 'Round tops do not stack', message: 'A round or pointy top does not stack. Look for a flat top.' },
  'pp1-solid-other': { title: 'Look at the solid again', message: 'That is a different solid. Think about its sides and its top.' },
  'pp1-solid-notip': { title: 'Look for a point', message: 'That one has no pointy top. Look for a tip.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

const range = count => Array.from({ length: count }, (_, index) => index);
const an = word => (/^[aeiou]/i.test(word) ? 'an' : 'a');
const cap = word => word[0].toUpperCase() + word.slice(1);
const HUE_KEYS = Object.keys(HUES);

// ---- Shapes and how they are drawn ----
const POOLS = {
  1: ['circle', 'square', 'triangle', 'star', 'heart'],
  2: ['circle', 'square', 'triangle', 'star', 'heart', 'rectangle', 'diamond'],
  3: ['circle', 'square', 'triangle', 'star', 'heart', 'rectangle', 'diamond', 'oval', 'hexagon'],
};
// Near-twins are never offered together: a square is a kind of rectangle and a diamond, and a circle is a kind of oval.
const CLASH = [['square', 'rectangle', 'diamond'], ['circle', 'oval']];
const clash = (a, b) => CLASH.some(group => group.includes(a) && group.includes(b));
const ROUND = ['circle', 'oval', 'heart'];
const codeFor = (target, other) => {
  if (ROUND.includes(other) && !ROUND.includes(target)) return 'pp1-shape-round';
  if (ROUND.includes(target) && !ROUND.includes(other)) return 'pp1-shape-corners';
  return 'pp1-shape-other';
};
const CORNERS = { triangle: 3, square: 4, rectangle: 4, diamond: 4, pentagon: 5, hexagon: 6 };
const CLUES = {
  circle: 'is round and has no corners', square: 'has 4 equal sides and 4 corners', triangle: 'has 3 sides and 3 corners',
  rectangle: 'has 4 corners and 2 long sides', star: 'has pointy tips all around', heart: 'is round on top and pointy below',
  diamond: 'has 4 sides and 4 pointy corners', oval: 'is round like an egg', hexagon: 'has 6 sides and 6 corners',
};
const BOX = { rectangle: [1.25, 0.75], oval: [1.25, 0.8], triangle: [1.15, 1], diamond: [0.92, 1.15], hexagon: [1.1, 1] };
const TILTS = { triangle: [180, 24, -24], star: [18, -18], heart: [14, -14], rectangle: [90] };
const WAYS = { 0: 'up', 90: 'right', 180: 'down', 270: 'left' };
const turnOf = rot => (((rot ?? 0) % 360) + 360) % 360;

function pickShapes(r, pool, need) {
  const picks = [];
  for (const shape of r.shuffle(pool)) {
    if (picks.length < need && !picks.some(other => clash(shape, other))) picks.push(shape);
  }
  if (picks.length < need) throw new QuestionRetry('Not enough different shapes.');
  return picks;
}
function poseOf(r, shape, hue, level) {
  const pose = { shape, hue, rot: 0, skew: 0 };
  if (level >= 2 && TILTS[shape] && r.int(0, 2) > 0) pose.rot = r.pick(TILTS[shape]);
  if (level === 3 && shape === 'triangle' && !pose.rot) pose.skew = r.pick([-0.2, 0.2]);
  return pose;
}
function drawShape(pose, cx, cy, size, { fill = HUES[pose.hue], stroke = INK, sw = 4 } = {}) {
  const [kw, kh] = BOX[pose.shape] ?? [1, 1];
  return shapeSvg(pose.shape, cx, cy, size * kw, size * kh, { fill, rot: pose.rot ?? 0, skew: pose.skew ?? 0, stroke, sw });
}
const labelOf = pose => `${pose.hue} ${pose.shape}${pose.way ? ` ${pose.way}` : ''}`;
function cardVisual(pose) {
  const words = `${pose.rot && !pose.way ? 'tilted ' : ''}${labelOf(pose)}`;
  return { kind: 'v3-pp1-shape-card', pose, description: `${cap(an(words))} ${words}.` };
}
function checkCards(question) {
  question.options.forEach((label, index) => {
    const pose = question.optionVisuals?.[index]?.pose;
    if (!pose || label !== labelOf(pose)) throw new Error('A shape choice does not match its label.');
  });
}
const frame = (inner, w = 110, h = 110) => `<rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="20" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"/>${inner}`;

// ---- 1. Which one is the named shape? Three big pictures, no other picture. ----
function draftFind(grade, level, r) {
  const need = choiceCount(grade);
  const picks = pickShapes(r, POOLS[level], need);
  const target = picks[0];
  const hues = r.shuffle(HUE_KEYS);
  const poses = picks.map((shape, index) => poseOf(r, shape, hues[index], level));
  const wrongs = poses.slice(1).map(pose => wrong(labelOf(pose), codeFor(target, pose.shape), cardVisual(pose)));
  return build({
    family: 'pp1-shape-find',
    prompt: say(r, [`Which one is ${an(target)} ${target}?`, `Touch the ${target}.`, `Find the ${target}.`, `Where is the ${target}?`]),
    answer: labelOf(poses[0]), hint: `${cap(an(target))} ${target} ${CLUES[target]}.`,
    explanation: `${cap(an(target))} ${target} ${CLUES[target]}. This one matches.`,
    givens: { shape: target }, choices: answerChoices(labelOf(poses[0]), wrongs, need, cardVisual(poses[0]), KNOWN),
  });
}
function solveFind(question) {
  checkCards(question);
  return pickOption(question, visual => visual.pose.shape === question.proof.givens.shape);
}

// ---- 2. One big shape: how many corners or sides? ----
const CORNER_SHAPES = {
  1: ['triangle', 'square', 'rectangle'],
  2: ['triangle', 'square', 'rectangle', 'diamond'],
  3: ['triangle', 'rectangle', 'diamond', 'square'],
};
function draftCorners(grade, level, r) {
  const shape = r.pick(CORNER_SHAPES[level]);
  const answer = CORNERS[shape];
  const ask = r.pick(['corners', 'sides']);
  const pose = poseOf(r, shape, r.pick(HUE_KEYS), level);
  const wrongs = spreadWrongs(r, answer, [
    { n: answer + 1, code: 'pp1-corners-off' }, { n: answer - 1, code: 'pp1-corners-off' },
    { n: answer + 2, code: 'pp1-corners-off' }, { n: answer - 2, code: 'pp1-corners-off' },
  ], { min: 2, max: 8 });
  return build({
    family: 'pp1-shape-corners',
    prompt: say(r, ask === 'corners'
      ? ['How many corners does it have?', 'Count the corners. How many?', 'How many corners can you count?']
      : ['How many sides does it have?', 'Count the sides. How many?', 'How many sides can you count?']),
    answer, hint: ask === 'corners' ? 'Touch each corner and count. Do not count one twice.' : 'Run your finger along each side and count them.',
    explanation: `${cap(an(shape))} ${shape} has ${answer} ${ask}.`,
    givens: { ask }, visual: { kind: 'v3-pp1-shape-corners', pose, marks: level === 1 && ask === 'corners', description: `One big ${pose.hue} shape on a light panel.` },
    choices: answerChoices(String(answer), wrongs, choiceCount(grade), null, KNOWN),
  });
}
const solveCorners = question => String(CORNERS[question.visual.pose.shape]);
function cornerPoints(shape, cx, cy, w, h) {
  if (shape === 'triangle') return [[cx, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
  if (shape === 'diamond') return [[cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]];
  return [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
}
function cornersPicture(v) {
  const size = 164;
  const [kw, kh] = BOX[v.pose.shape] ?? [1, 1];
  const dots = v.marks
    ? cornerPoints(v.pose.shape, 240, 115, size * kw, size * kh).map(([x, y]) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="11" fill="${ORANGE}" stroke="${INK}" stroke-width="3.5"/>`).join('') : '';
  return svg(plate('sky', 480, 230) + drawShape(v.pose, 240, 115, size) + dots, v.description, 480, 230);
}

// ---- Scenes built from flat shapes (a rover, a rocket, a village). Every part is { s, x, y, w, h, hue, role, rot?, skew? } on a 300 x 150 canvas. ----
const P = (s, x, y, w, h, hue, role, extra = {}) => ({ s, x, y, w, h, hue, role, ...extra });
function buildRover(r, level, { plain = false } = {}) {
  const [body, cabin, wheel, flag] = r.shuffle(HUE_KEYS);
  const wheels = r.int(2, 3);
  const flags = r.int(1, level === 1 ? 2 : 3);
  const parts = [P('rectangle', 150, 100, 176, 46, body, 'body'), P('square', 112, 55, 44, 44, cabin, 'cabin')];
  [192, 158, 226].slice(0, flags).forEach(x => parts.push(P('triangle', x, 62, 26, 30, flag, 'flag')));
  (wheels === 2 ? [96, 204] : [78, 150, 222]).forEach(x => parts.push(P('circle', x, 130, 38, 38, wheel, 'wheel')));
  if (!plain && level > 1 && r.int(0, 1)) parts.push(P('circle', 224, 100, 16, 16, 'yellow', 'lamp'));
  return parts;
}
function buildRocket(r, level, { plain = false } = {}) {
  const [body, nose, fin, glass, flame] = r.shuffle(HUE_KEYS);
  const windows = r.int(1, 3);
  const parts = [
    P('rectangle', 140, 72, 136, 50, body, 'body'), P('triangle', 230, 72, 50, 44, nose, 'nose', { rot: 90 }),
    P('triangle', 96, 27, 46, 40, fin, 'fin', { skew: -0.5 }), P('triangle', 96, 117, 46, 40, fin, 'fin', { skew: 0.5, rot: 180 }),
  ];
  range(windows).forEach(index => parts.push(P('circle', 140 + (index - (windows - 1) / 2) * 38, 72, 24, 24, glass, 'window')));
  if (plain ? r.int(0, 1) : level === 1 || r.int(0, 1)) parts.push(P('triangle', 52, 72, 36, 36, flame, 'flame', { rot: -90 }));
  return parts;
}
const VILLAGE_X = { 2: [90, 210], 3: [58, 150, 242], 4: [45, 115, 185, 255], 5: [34, 92, 150, 208, 266] };
const WALL = { 2: 66, 3: 62, 4: 52, 5: 44 };
function buildVillage(r, level, { plain = false, maxHouses = 5 } = {}) {
  const houses = r.int(level === 1 ? 2 : 3, Math.min(maxHouses, level === 1 ? 3 : level === 2 ? 4 : 5));
  const [wallA, wallB, roof] = r.shuffle(HUE_KEYS);
  const wall = WALL[houses];
  const parts = [];
  VILLAGE_X[houses].forEach((x, index) => {
    parts.push(P('square', x, 128 - wall / 2, wall, wall, index % 2 ? wallB : wallA, 'wall'));
    parts.push(P('triangle', x, 128 - wall - 17, wall + 12, 34, roof, 'roof'));
    const size = Math.max(14, Math.round(wall * 0.27));
    const two = !plain && level > 1 && r.int(0, 1);
    if (two) [-1, 1].forEach(side => parts.push(P('circle', x + side * wall * 0.2, 128 - wall / 2, size, size, 'yellow', 'pane')));
    else parts.push(P('circle', x, 128 - wall / 2, size, size, 'yellow', 'pane'));
    if (!plain && level > 1 && r.int(0, 2) === 0) parts.push(P('triangle', x, 128 - wall - 42, 14, 16, 'yellow', 'spire'));
  });
  return parts;
}
const SCENES = { rover: buildRover, rocket: buildRocket, village: buildVillage };
const SCENE_NAMES = { rover: 'moon rover', rocket: 'rocket', village: 'moon village' };
const ASKABLE = { rover: ['circle', 'triangle'], rocket: ['circle', 'triangle'], village: ['square', 'triangle', 'circle'] };
const GROUND = { rover: 142, rocket: null, village: 128 };
const PANEL = { k: 0.96, ox: 56, oy: 3 };
const SHADOW = '#2f3b57';

function drawParts(parts, { k, ox, oy, silhouette = false, hide = -1, sw = 4 }) {
  return parts.map((part, index) => {
    if (index === hide) return '';
    return shapeSvg(part.s, ox + part.x * k, oy + part.y * k, part.w * k, part.h * k, {
      fill: silhouette ? SHADOW : HUES[part.hue], stroke: silhouette ? SHADOW : INK, sw: silhouette ? 2 : sw, rot: part.rot ?? 0, skew: part.skew ?? 0,
    });
  }).join('');
}
function backdrop(scene, width, height, k, oy) {
  if (scene === 'rocket') return plate('night', width, height, { stars: 0 });
  return plate('sky', width, height) + moonGround(width, height, n1(oy + GROUND[scene] * k));
}

// ---- 3. How many circles, triangles or squares can you find in the picture? ----
function draftScene(grade, level, r) {
  const scene = r.pick(Object.keys(SCENES));
  const parts = SCENES[scene](r, level);
  const shape = r.pick(ASKABLE[scene]);
  const count = name => parts.filter(part => part.s === name).length;
  const answer = count(shape);
  if (answer < 1 || answer > 8) throw new QuestionRetry('The count is out of range.');
  const wrongs = spreadWrongs(r, answer, [
    ...ASKABLE[scene].filter(other => other !== shape).map(other => ({ n: count(other), code: 'pp1-scene-other' })),
    { n: answer - 1, code: 'pp1-scene-miss' }, { n: answer + 1, code: 'pp1-scene-extra' },
    { n: answer + 2, code: 'pp1-scene-extra' }, { n: answer - 2, code: 'pp1-scene-miss' },
  ], { min: 1, max: 10 });
  return build({
    family: 'pp1-shape-scene',
    prompt: say(r, [`How many ${shape}s do you see?`, `Count the ${shape}s. How many?`, `How many ${shape}s are hiding here?`, `Find the ${shape}s. How many?`]),
    answer, hint: `Look at each ${shape}. Touch each one as you count.`,
    explanation: answer === 1 ? `There is 1 ${shape}. Count only the ${shape}s.` : `There are ${answer} ${shape}s. Count only the ${shape}s.`,
    givens: { shape }, visual: { kind: 'v3-pp1-shape-scene', scene, parts, description: `A ${SCENE_NAMES[scene]} built from flat shapes.` },
    choices: answerChoices(String(answer), wrongs, choiceCount(grade), null, KNOWN),
  });
}
const solveScene = question => String(question.visual.parts.filter(part => part.s === question.proof.givens.shape).length);
function scenePicture(v) {
  const k = 1.55;
  const ox = 7;
  const oy = 8;
  return svg(backdrop(v.scene, 480, 250, k, oy) + drawParts(v.parts, { k, ox, oy }), v.description, 480, 250);
}

// ---- 4. Which shape (or picture) makes this shadow? ----
const sceneCard = (scene, parts) => ({ kind: 'v3-pp1-scene-card', scene, parts, description: `A ${SCENE_NAMES[scene]} made of shapes.` });
function draftShadow(grade, level, r) {
  const need = choiceCount(grade);
  if (level === 3) {
    const kinds = r.shuffle(Object.keys(SCENES)).slice(0, need);
    const made = kinds.map(scene => ({ scene, parts: SCENES[scene](r, 1, { maxHouses: 3 }) }));
    const wrongs = made.slice(1).map(item => wrong(SCENE_NAMES[item.scene], 'pp1-shadow-other', sceneCard(item.scene, item.parts)));
    return build({
      family: 'pp1-shape-shadow', prompt: say(r, ['Which picture makes this shadow?', 'Whose shadow is this?', 'Match the shadow to its picture.']),
      answer: SCENE_NAMES[made[0].scene], hint: 'Look at the outline. Which picture has the same outline?',
      explanation: `The shadow has the outline of the ${SCENE_NAMES[made[0].scene]}.`,
      givens: { mode: 'scene' },
      visual: { kind: 'v3-pp1-shape-shadow', mode: 'scene', scene: made[0].scene, parts: made[0].parts, description: 'A dark shadow of a picture made of shapes.' },
      choices: answerChoices(SCENE_NAMES[made[0].scene], wrongs, need, sceneCard(made[0].scene, made[0].parts), KNOWN),
    });
  }
  const picks = pickShapes(r, POOLS[level], need);
  const hues = r.shuffle(HUE_KEYS);
  const poses = picks.map((shape, index) => ({ shape, hue: hues[index], rot: 0, skew: 0 }));
  const shadow = { shape: picks[0], hue: hues[0], rot: level === 2 && (picks[0] === 'star' || picks[0] === 'heart') ? r.pick(TILTS[picks[0]]) : 0, skew: 0 };
  const wrongs = poses.slice(1).map(pose => wrong(labelOf(pose), 'pp1-shadow-other', cardVisual(pose)));
  return build({
    family: 'pp1-shape-shadow', prompt: say(r, ['Which shape makes this shadow?', 'Whose shadow is this?', 'Match the shadow to its shape.']),
    answer: labelOf(poses[0]), hint: 'Look at the outline. Which shape has the same outline?',
    explanation: `The shadow has the outline of the ${picks[0]}.`,
    givens: { mode: 'shape' },
    visual: { kind: 'v3-pp1-shape-shadow', mode: 'shape', pose: shadow, description: 'A dark shadow of one shape on a light panel.' },
    choices: answerChoices(labelOf(poses[0]), wrongs, need, cardVisual(poses[0]), KNOWN),
  });
}
function solveShadow(question) {
  const { visual } = question;
  if (visual.mode === 'scene') {
    question.options.forEach((label, index) => {
      if (label !== SCENE_NAMES[question.optionVisuals?.[index]?.scene]) throw new Error('A picture choice does not match its label.');
    });
    return pickOption(question, option => option.scene === visual.scene);
  }
  checkCards(question);
  return pickOption(question, option => option.pose.shape === visual.pose.shape);
}
function shadowPicture(v) {
  const { k, ox, oy } = PANEL;
  const body = v.mode === 'scene'
    ? drawParts(v.parts, { k, ox, oy, silhouette: true })
    : drawShape(v.pose, 200, 75, 108, { fill: SHADOW, stroke: SHADOW, sw: 2 });
  return svg(plate('lavender', 400, 150) + body, v.description, 400, 150);
}

// ---- 5. One piece is missing from the picture. Which piece fills the gap? ----
const HOLE_ROLES = { 1: ['wheel', 'roof', 'cabin', 'window'], 2: ['wheel', 'roof', 'cabin', 'window', 'flag'], 3: ['nose', 'flame', 'roof', 'flag'] };
function draftHole(grade, level, r) {
  const need = choiceCount(grade);
  const scene = r.pick(Object.keys(SCENES));
  const parts = SCENES[scene](r, level, { plain: true });
  const spots = parts.map((part, index) => ({ part, index })).filter(({ part }) => HOLE_ROLES[level].includes(part.role));
  if (!spots.length) throw new QuestionRetry('This picture has no piece to hide.');
  const { part, index } = r.pick(spots);
  const hues = r.shuffle(HUE_KEYS);
  const make = (shape, rot, hue) => {
    const pose = { shape, hue, rot, skew: 0 };
    if (level === 3 && shape === 'triangle') pose.way = WAYS[turnOf(rot)];
    return pose;
  };
  const right = make(part.s, part.rot ?? 0, hues[0]);
  right.skew = part.skew ?? 0;
  const others = r.shuffle(POOLS[1].filter(shape => shape !== part.s && !clash(shape, part.s)));
  const wrongs = [];
  if (level === 3) {
    const turns = r.shuffle([0, 90, 180, 270].filter(deg => deg !== turnOf(part.rot)));
    wrongs.push({ pose: make(part.s, turns[0], hues[1]), code: 'pp1-hole-turn' }, { pose: make(others[0], 0, hues[2]), code: 'pp1-hole-other' });
  } else {
    wrongs.push({ pose: make(others[0], 0, hues[1]), code: 'pp1-hole-other' }, { pose: make(others[1], 0, hues[2]), code: 'pp1-hole-other' });
  }
  return build({
    family: 'pp1-shape-hole',
    prompt: say(r, ['Which piece fills the gap?', 'One piece is missing. Which one?', 'Which piece goes in the gap?']),
    answer: labelOf(right), hint: 'Look at the pieces beside the gap. Which shape is missing?',
    explanation: `The gap needs ${an(part.s)} ${part.s}${right.way ? ` pointing ${right.way}` : ''}.`,
    givens: { level },
    visual: { kind: 'v3-pp1-shape-hole', scene, parts, hide: index, outline: level === 1, description: `A ${SCENE_NAMES[scene]} built from shapes with one piece missing.` },
    choices: answerChoices(labelOf(right), wrongs.slice(0, need - 1).map(item => wrong(labelOf(item.pose), item.code, cardVisual(item.pose))), need, cardVisual(right), KNOWN),
  });
}
function solveHole(question) {
  checkCards(question);
  const part = question.visual.parts[question.visual.hide];
  return pickOption(question, option => option.pose.shape === part.s && turnOf(option.pose.rot) === turnOf(part.rot));
}
function holePicture(v) {
  const { k, ox, oy } = PANEL;
  const part = v.parts[v.hide];
  const cx = ox + part.x * k;
  const cy = oy + part.y * k;
  const reach = Math.max(part.w, part.h) * k;
  const mark = Math.max(18, Math.min(32, Math.round(reach * 0.85)));
  const gap = v.outline
    ? shapeSvg(part.s, cx, cy, part.w * k, part.h * k, { fill: '#fffdf5', stroke: ORANGE, dash: '8 6', sw: 4, rot: part.rot ?? 0, skew: part.skew ?? 0 })
    : `<rect x="${n1(cx - reach / 2 - 3)}" y="${n1(cy - reach / 2 - 3)}" width="${n1(reach + 6)}" height="${n1(reach + 6)}" rx="8" fill="#fffdf5" stroke="${ORANGE}" stroke-width="4" stroke-dasharray="8 6"/>`;
  return svg(backdrop(v.scene, 400, 150, k, oy) + drawParts(v.parts, { k, ox, oy, hide: v.hide }) + gap
    + text(n1(cx), n1(cy + mark * 0.36), '?', { size: mark, weight: 800, fill: ORANGE }), v.description, 400, 150);
}

// ---- 6. Solid things: what rolls, what has a flat top, what is a ball, a can or a cone? ----
const SOLIDS = {
  ball: { roll: true, flat: false, tip: false, clue: 'is round all over' },
  can: { roll: true, flat: true, tip: false, clue: 'has a round side and flat circles at each end' },
  cube: { roll: false, flat: true, tip: false, clue: 'has flat sides that are all squares' },
  brick: { roll: false, flat: true, tip: false, clue: 'has flat sides and is long' },
  cone: { roll: null, flat: false, tip: true, clue: 'has a round base and a pointy top' },
  pyramid: { roll: false, flat: false, tip: true, clue: 'has a pointy top and flat triangle sides' },
};
const SOLID_CLASH = [['cube', 'brick'], ['cone', 'pyramid']];
const solidCard = (solid, hue) => ({ kind: 'v3-pp1-solid', solid, hue, description: `${cap(an(hue))} ${hue} ${solid}.` });
const solidLabel = (solid, hue) => `${hue} ${solid}`;
const SOLID_ASKS = {
  roll: { test: v => SOLIDS[v.solid].roll === true, ok: ['ball', 'can'], bad: ['cube', 'brick', 'pyramid'], code: () => 'pp1-solid-flat' },
  flat: { test: v => SOLIDS[v.solid].flat, ok: ['cube', 'brick', 'can'], bad: ['ball', 'cone', 'pyramid'], code: () => 'pp1-solid-round' },
  tip: { test: v => SOLIDS[v.solid].tip, ok: ['cone', 'pyramid'], bad: ['ball', 'cube', 'can', 'brick'], code: () => 'pp1-solid-notip' },
  both: { test: v => SOLIDS[v.solid].roll === true && SOLIDS[v.solid].flat, ok: ['can'], bad: ['ball', 'cube', 'brick', 'pyramid'], code: solid => (solid === 'ball' ? 'pp1-solid-round' : 'pp1-solid-flat') },
};
const SOLID_PROMPTS = {
  roll: ['Which one can roll?', 'Which one rolls away?', 'Which one will roll down a hill?'],
  flat: ['Which one has a flat top to stack on?', 'Which one is good for a tower?', 'Which one has a flat top?'],
  tip: ['Which one has a pointy top?', 'Which one has a tip?', 'Find the one with a point on top.'],
  both: ['Which one can roll and stack?', 'Which one rolls and has a flat top?'],
};
const SOLID_HINTS = {
  roll: 'Round things roll. Flat sides do not.', flat: 'Look for a top that is flat, like a table.',
  tip: 'Look for a point at the top, like a party hat.', both: 'It must be round to roll and flat on top to stack.',
};
const SOLID_ASK_BY_LEVEL = { 1: ['roll', 'name'], 2: ['roll', 'flat', 'tip', 'name'], 3: ['flat', 'tip', 'both', 'name', 'roll'] };
const NAMEABLE = { 1: ['ball', 'cube', 'can'], 2: ['ball', 'cube', 'can', 'cone'], 3: ['ball', 'cube', 'can', 'cone', 'brick', 'pyramid'] };
function draftSolid(grade, level, r) {
  const need = choiceCount(grade);
  const ask = r.pick(SOLID_ASK_BY_LEVEL[level]);
  const hues = r.shuffle(HUE_KEYS);
  let right;
  let others;
  let prompt;
  let code;
  let hint;
  let why;
  if (ask === 'name') {
    right = r.pick(NAMEABLE[level]);
    const pool = r.shuffle(NAMEABLE[level].filter(solid => solid !== right && !SOLID_CLASH.some(group => group.includes(solid) && group.includes(right))));
    others = pool.slice(0, need - 1);
    prompt = say(r, [`Which one is ${an(right)} ${right}?`, `Touch the ${right}.`, `Find the ${right}.`]);
    code = () => 'pp1-solid-other';
    hint = `Look for the one that ${SOLIDS[right].clue}.`;
    why = `${cap(an(right))} ${right} ${SOLIDS[right].clue}.`;
  } else {
    const spec = SOLID_ASKS[ask];
    right = r.pick(level === 1 ? spec.ok.filter(solid => solid !== 'brick') : spec.ok);
    others = [];
    for (const solid of r.shuffle(spec.bad)) {
      if (others.length < need - 1 && !SOLID_CLASH.some(group => group.includes(solid) && [right, ...others].some(other => group.includes(other)))) others.push(solid);
    }
    prompt = say(r, SOLID_PROMPTS[ask]);
    code = spec.code;
    hint = SOLID_HINTS[ask];
    why = ask === 'both' ? 'A can is round to roll and flat on top to stack.' : `${cap(an(right))} ${right} ${SOLIDS[right].clue}.`;
  }
  if (others.length < need - 1) throw new QuestionRetry('Not enough different solids.');
  const wrongs = others.map((solid, index) => wrong(solidLabel(solid, hues[index + 1]), code(solid), solidCard(solid, hues[index + 1])));
  return build({
    family: 'pp1-solid-pick', prompt, answer: solidLabel(right, hues[0]), hint, explanation: why,
    givens: { ask, name: ask === 'name' ? right : null }, choices: answerChoices(solidLabel(right, hues[0]), wrongs, need, solidCard(right, hues[0]), KNOWN),
  });
}
function solveSolid(question) {
  const { ask, name } = question.proof.givens;
  question.options.forEach((label, index) => {
    const visual = question.optionVisuals?.[index];
    if (!visual || label !== solidLabel(visual.solid, visual.hue)) throw new Error('A solid choice does not match its label.');
  });
  return pickOption(question, ask === 'name' ? visual => visual.solid === name : SOLID_ASKS[ask].test);
}
function solidArt(kind, hue) {
  const base = HUES[hue];
  const top = lighter(base, 0.32);
  const side = darker(base, 0.2);
  const edge = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"`;
  const poly = (points, fill) => `<polygon points="${points}" fill="${fill}" ${edge}/>`;
  const floor = `<ellipse cx="55" cy="96" rx="${kind === 'brick' ? 40 : 30}" ry="5" fill="#c3c9d6"/>`;
  let body;
  if (kind === 'ball') body = `<circle cx="55" cy="54" r="34" fill="${base}" ${edge}/><ellipse cx="43" cy="41" rx="11" ry="7" fill="${top}" transform="rotate(-35 43 41)"/>`;
  else if (kind === 'cube') body = `<rect x="24" y="42" width="44" height="44" fill="${base}" ${edge}/>${poly('24,42 42,24 86,24 68,42', top)}${poly('68,42 86,24 86,68 68,86', side)}`;
  else if (kind === 'brick') body = `<rect x="12" y="48" width="66" height="30" fill="${base}" ${edge}/>${poly('12,48 28,32 94,32 78,48', top)}${poly('78,48 94,32 94,62 78,78', side)}`;
  else if (kind === 'can') body = `<path d="M26 32V76A29 11 0 0 0 84 76V32Z" fill="${base}" ${edge}/><ellipse cx="55" cy="32" rx="29" ry="11" fill="${top}" ${edge}/>`;
  else if (kind === 'cone') body = `<path d="M55 14L86 78A31 11 0 0 1 24 78Z" fill="${base}" ${edge}/>`;
  else body = `${poly('55,14 18,76 58,92', base)}${poly('55,14 58,92 94,72', side)}`;
  return floor + body;
}

const DEFS = {
  'pp1-shape-find': { skill: 'shape', title: 'Find the named shape', draft: draftFind, solve: solveFind },
  'pp1-shape-corners': { skill: 'shape', title: 'Count the corners or sides', draft: draftCorners, solve: solveCorners },
  'pp1-shape-scene': { skill: 'shape', title: 'Count one shape in a picture', draft: draftScene, solve: solveScene },
  'pp1-shape-shadow': { skill: 'visual', title: 'Match the shadow', draft: draftShadow, solve: solveShadow },
  'pp1-shape-hole': { skill: 'visual', title: 'Which piece is missing', draft: draftHole, solve: solveHole },
  'pp1-solid-pick': { skill: 'solids', title: 'Roll, stack and name solid things', draft: draftSolid, solve: solveSolid },
};
export const FAMILIES = Object.fromEntries(Object.entries(DEFS).map(([id, def]) => [id, { skill: def.skill, title: def.title }]));
export const draft = (family, grade, level, r) => DEFS[family].draft(grade, level, r);
export const solve = question => DEFS[question.family].solve(question);

const RENDER = {
  'v3-pp1-shape-corners': cornersPicture,
  'v3-pp1-shape-scene': scenePicture,
  'v3-pp1-shape-shadow': shadowPicture,
  'v3-pp1-shape-hole': holePicture,
  'v3-pp1-shape-card': v => svg(frame(drawShape(v.pose, 55, 55, 62)), v.description, 110, 110),
  'v3-pp1-scene-card': v => svg(frame(drawParts(v.parts, { k: 0.7, ox: 5, oy: 7.5, sw: 3 }), 220, 120), v.description, 220, 120),
  'v3-pp1-solid': v => svg(frame(solidArt(v.solid, v.hue)), v.description, 110, 110),
};
export const render = visual => RENDER[visual.kind]?.(visual) ?? null;
