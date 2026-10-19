import { PAINTS } from './destinations.mjs';
import {
  INK, PAPER, STEEL, GLASS, PANEL, GOLD, escape, attributes, group, feature,
  createBrush, createScope,
} from './craft-shading.mjs';
import { pp1Art } from './craft-art-pp1.mjs';
import { class4Art } from './craft-art-class-4.mjs';
import { class5Art } from './craft-art-class-5.mjs';
import { class1Art } from './craft-art-class-1.mjs';
import { pp2Art } from './craft-art-pp2.mjs';
import { class2Art } from './craft-art-class-2.mjs';
import { class3Art } from './craft-art-class-3.mjs';

// Slot coordinates are centres, not label corners. Keep the metadata aspect ratio
// and centre controls up to 86 × 48 px on a workshop board at least 280 px wide.
// Artwork and tray crops are authored here; no DOM measurement or live SVG IDs.
const IDS = ['engine', 'body', 'cockpit', 'nose', 'left-fin', 'right-fin'];
const LAYER_ORDER = ['left-fin', 'right-fin', 'engine', 'body', 'cockpit', 'nose'];
const COLORS = new Map(PAINTS.map(({ id, color }) => [id, color]));

// The brush (and the shading scope that registers a module's gradients) lives in craft-shading.mjs.
const brush = createBrush;

function solarArray(c, x, y, width, height, columns = 3, rows = 3) {
  const inset = 6;
  return feature('solar-array', c.rect(x, y, width, height, c.color, 5)
    + c.detail(c.rect(x + inset, y + inset, width - inset * 2, height - inset * 2, PANEL, 2, PAPER, 2)
      + Array.from({ length: columns - 1 }, (_, index) => {
        const xx = x + inset + (width - inset * 2) * (index + 1) / columns;
        return c.line(xx, y + inset, xx, y + height - inset, GLASS, 1.5);
      }).join('')
      + Array.from({ length: rows - 1 }, (_, index) => {
        const yy = y + inset + (height - inset * 2) * (index + 1) / rows;
        return c.line(x + inset, yy, x + width - inset, yy, GLASS, 1.5);
      }).join('')));
}

const part = (id, name, purpose, x, y, box, draw, flightDraw) =>
  ({ id, name, purpose, x, y, box, draw, flightDraw });

function moonFin(c) {
  return c.path('M121 238Q73 232 38 281L35 317Q70 316 121 286Z', c.color)
    + c.rect(30, 304, 82, 17, PAPER, 8)
    + c.detail(c.path('M48 287Q72 259 103 253', 'none', PAPER, 6)
      + c.circle(108, 260, 7, GOLD));
}

function landerLeg(c) {
  return c.path('M143 219 74 267 50 325', 'none', PAPER, 16)
    + c.detail(c.path('M143 219 74 267 50 325', 'none', INK, 8))
    + c.circle(74, 267, 17, c.color)
    + c.rect(25, 320, 79, 18, PAPER, 9)
    + c.detail(c.circle(74, 267, 6, GOLD) + c.line(36, 329, 92, 329, STEEL, 3));
}

function carried(art) {
  return group(art, { transform: 'translate(63 22) scale(.7)', 'data-feature': 'carried-rover' });
}

function probeWing(c) {
  return c.line(126, 230, 157, 230, PAPER, 12)
    + c.detail(c.line(126, 230, 157, 230, STEEL, 5))
    + solarArray(c, 22, 180, 106, 108);
}

const DESIGNS = {
  pp1: {
    name: 'Moon Camp Capsule', noun: 'capsule', width: 360, height: 420,
    parts: [
      part('engine', 'Moon thruster', 'Pushes the little capsule away from its launch pad.', 180, 350, [125, 295, 110, 86],
        pp1Art.engine),
      part('body', 'Capsule body', 'Holds the supplies for a small Moon camp.', 180, 250, [110, 182, 140, 139],
        pp1Art.body),
      part('cockpit', 'Explorer window', 'A protected window helps the explorers look outside.', 180, 155, [109, 95, 142, 107],
        pp1Art.cockpit),
      part('nose', 'Moon cap', 'A rounded protective cap closes the top of the capsule.', 180, 63, [121, 17, 118, 101],
        pp1Art.nose),
      part('left-fin', 'Left landing fin', 'A broad left fin helps the capsule stand at Moon camp.', 64, 282, [22, 229, 107, 100], pp1Art.leftFin),
      part('right-fin', 'Right landing fin', 'The right fin balances the matching landing fin.', 296, 282, [231, 229, 107, 100],
        pp1Art.rightFin),
    ],
  },
  pp2: {
    name: 'Planet Hopper Lander', noun: 'lander', width: 420, height: 400,
    parts: [
      part('engine', 'Landing thruster', 'Slows the lander for a gentle touchdown on rocky ground.', 210, 329, [166, 271, 88, 91],
        pp2Art.engine),
      part('body', 'Supply deck', 'Carries supplies and the fuel tanks above the landing legs.', 210, 231, [109, 175, 202, 116],
        pp2Art.body),
      part('cockpit', 'Pilot cabin', 'The protected cabin holds the controls for each short hop.', 210, 145, [157, 94, 106, 100],
        pp2Art.cockpit),
      part('nose', 'Ground sensor', 'Scans the surface to help find a flat landing place.', 210, 54, [161, 17, 98, 102],
        pp2Art.nose),
      part('left-fin', 'Left landing leg', 'A hinged left leg spreads the lander’s weight over its foot.', 74, 267, [16, 210, 136, 137], pp2Art.leftFin),
      part('right-fin', 'Right landing leg', 'The right leg and foot keep the supply deck level.', 346, 267, [268, 210, 136, 137],
        pp2Art.rightFin),
    ],
  },
  'class-1': {
    name: 'Mars Rescue Rover', noun: 'rover', width: 420, height: 400,
    parts: [
      part('engine', 'Drive unit', 'Turns the wheels on Mars. A separate carrier thruster moves the rover through space.', 210, 314, [162, 265, 96, 87],
        class1Art.engine, class1Art.flight.engine),
      part('body', 'Cargo chassis', 'Supports the rover’s sample crates and locks into its orbital carrier for travel.', 210, 231, [122, 154, 176, 128],
        class1Art.body, class1Art.flight.body),
      part('cockpit', 'Control core', 'A protected computer steers the rover and checks its rescue supplies.', 210, 143, [164, 102, 92, 94],
        class1Art.cockpit),
      part('nose', 'Camera mast', 'A raised stereo camera looks for a safe route across Mars.', 210, 54, [147, 1, 126, 119],
        class1Art.nose),
      part('left-fin', 'Left wheels', 'Three linked left wheels roll over uneven rocky ground.', 74, 277, [16, 232, 134, 100], class1Art.leftFin, class1Art.flight.leftFin),
      part('right-fin', 'Right wheels', 'Three linked right wheels share the rover’s weight.', 346, 277, [270, 232, 134, 100],
        class1Art.rightFin, class1Art.flight.rightFin),
    ],
  },
  'class-2': {
    name: 'Outer Planet Voyager', noun: 'probe', width: 420, height: 400,
    parts: [
      part('engine', 'Ion drive', 'Uses a small, steady thrust to change the robotic probe’s course.', 210, 329, [176, 265, 68, 96],
        class2Art.engine),
      part('body', 'Probe bus', 'The insulated central bus holds fuel, batteries and flight electronics.', 210, 231, [137, 172, 145, 116],
        class2Art.body),
      part('cockpit', 'Instrument bay', 'Robotic cameras and sensors collect measurements without a crew.', 210, 146, [170, 102, 80, 90],
        class2Art.cockpit),
      part('nose', 'Radio dish', 'Points a radio signal towards home to send the probe’s discoveries.', 210, 58, [160, 10, 100, 113],
        class2Art.nose),
      part('left-fin', 'Left solar panel', 'Converts sunlight into electricity for the probe’s instruments.', 74, 232, [13, 171, 152, 126], class2Art.leftFin),
      part('right-fin', 'Right solar panel', 'A second solar panel increases the probe’s available power.', 346, 232, [255, 171, 152, 126],
        class2Art.rightFin),
    ],
  },
  'class-3': {
    name: 'Star Navigator', noun: 'explorer', width: 400, height: 440,
    parts: [
      part('engine', 'Cruise engine', 'Provides thrust while the navigation systems check the explorer’s heading.', 200, 363, [144, 300, 112, 100],
        class3Art.engine),
      part('body', 'Explorer hull', 'A tapered hull carries supplies along a strong central spine.', 200, 251, [137, 163, 126, 173],
        class3Art.body),
      part('cockpit', 'Flight cabin', 'A forward-facing cabin gives the navigator a clear view.', 200, 153, [155, 94, 90, 100],
        class3Art.cockpit),
      part('nose', 'Star compass', 'Compares star directions to help the explorer find its heading.', 200, 58, [158, 18, 84, 101],
        class3Art.nose),
      part('left-fin', 'Left scanner wing', 'A swept wing holds a navigation scanner away from the hull.', 70, 263, [21, 203, 139, 111], class3Art.leftFin),
      part('right-fin', 'Right scanner wing', 'The second scanner compares its view with the left scanner.', 330, 263, [240, 203, 139, 111],
        class3Art.rightFin),
    ],
  },
  'class-4': {
    name: 'Nebula Research Station', noun: 'station', width: 420, height: 420,
    parts: [
      part('engine', 'Transfer tug', 'A docked propulsion tug moves the station between research orbits.', 210, 348, [153, 293, 114, 105],
        class4Art.engine),
      part('body', 'Habitat ring', 'Linked living and research rooms surround a central docking passage.', 210, 244, [140, 178, 140, 132],
        class4Art.body),
      part('cockpit', 'Lab & control hub', 'The hub joins the observation lab to the station’s flight controls.', 210, 146, [158, 82, 92, 121],
        class4Art.cockpit),
      part('nose', 'Survey telescope', 'A wide mirror gathers light from distant nebulae for the research lab.', 210, 58, [180, 4, 90, 106],
        class4Art.nose),
      part('left-fin', 'Left power wing', 'Two hinged solar leaves power the habitat and telescope.', 74, 245, [15, 162, 142, 166],
        class4Art.leftFin, class4Art.flight.leftFin),
      part('right-fin', 'Right power wing', 'The matching power wing folds closer to the station during transfer.', 346, 245, [263, 162, 142, 166],
        class4Art.rightFin, class4Art.flight.rightFin),
    ],
  },
  'class-5': {
    name: 'Galaxy Command Flagship', noun: 'flagship', width: 420, height: 440,
    parts: [
      part('engine', 'Propulsion cluster', 'A main engine and two smaller thrusters manoeuvre the modular flagship.', 210, 359, [148, 317, 124, 103],
        class5Art.engine),
      part('body', 'Command spine', 'A strong central spine connects the bridge, engines and detachable pods.', 210, 247, [104, 164, 212, 175],
        class5Art.body),
      part('cockpit', 'Command bridge', 'The panoramic bridge coordinates navigation and research across the fleet.', 210, 151, [148, 100, 124, 89],
        class5Art.cockpit),
      part('nose', 'Deep-space array', 'Several sensors measure directions and relay discoveries to the command bridge.', 210, 58, [151, 10, 118, 110],
        class5Art.nose),
      part('left-fin', 'Science pod', 'A detachable laboratory pod carries sample lockers and research instruments.', 74, 255, [24, 161, 103, 158],
        class5Art.leftFin),
      part('right-fin', 'Habitat pod', 'A separate living pod gives the research crew protected space to rest.', 346, 255, [293, 172, 103, 147],
        class5Art.rightFin),
    ],
  },
};

export const CRAFTS = Object.freeze(Object.fromEntries(Object.entries(DESIGNS).map(([id, craft]) => [
  id, Object.freeze({
    name: craft.name, noun: craft.noun, width: craft.width, height: craft.height,
    parts: Object.freeze(craft.parts.map(item => Object.freeze({
      id: item.id, name: item.name, purpose: item.purpose,
      x: item.x / craft.width * 100, y: item.y / craft.height * 100,
    }))),
  }),
])));

/** Read-only grade-specific names, purposes, viewBox size and centred slot positions. */
export function craftFor(gradeId) {
  if (typeof gradeId !== 'string' || !Object.hasOwn(CRAFTS, gradeId)) {
    throw new Error(`Unknown craft grade: ${String(gradeId)}.`);
  }
  return CRAFTS[gradeId];
}

function colorFor(paint) {
  if (!COLORS.has(paint)) throw new Error(`Unknown craft paint: ${String(paint)}.`);
  return COLORS.get(paint);
}

function partFor(gradeId, partId) {
  craftFor(gradeId);
  const item = DESIGNS[gradeId].parts.find(candidate => candidate.id === partId);
  if (!item) throw new Error(`Unknown craft part: ${String(partId)}.`);
  return item;
}

function fittedSet(fittedIds) {
  if (!Array.isArray(fittedIds)) throw new TypeError('Fitted craft IDs must be an array.');
  const fitted = new Set();
  for (const id of fittedIds) {
    if (!IDS.includes(id)) throw new Error(`Unknown fitted craft part: ${String(id)}.`);
    if (fitted.has(id)) throw new Error(`Duplicate fitted craft part: ${id}.`);
    fitted.add(id);
  }
  return fitted;
}

function moduleArt(gradeId, item, color, fitted, flying, paint) {
  const scope = createScope({ grade: gradeId, part: item.id, paint, flying, blueprint: !fitted });
  const c = brush(color, !fitted, flying, scope);
  let art;
  if (flying && item.flightDraw) art = item.flightDraw(c);
  else if (flying && gradeId === 'class-1') art = carried(item.draw(c));
  else art = item.draw(c);
  return group(scope.defs() + art, {
    'data-craft-part': item.id, class: `sa-craft-module ${fitted ? 'is-fitted' : 'is-blueprint'}`,
  });
}

function rootSVG(className, viewBox, label, description, art, values = {}) {
  return `<svg ${attributes({
    xmlns: 'http://www.w3.org/2000/svg', class: className, viewBox, role: 'img',
    'aria-label': label, focusable: 'false', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...values,
  })}><title>${escape(label)}</title><desc>${escape(description)}</desc>${art}</svg>`;
}

/**
 * Draw fitted modules in colour and unfitted workshop modules as blueprint ghosts.
 * In flight only fitted modules are present; the rover travels aboard a carrier.
 */
export function renderCraft(gradeId, fittedIds = [], paint = 'coral', flying = false) {
  const craft = craftFor(gradeId);
  const color = colorFor(paint);
  const fitted = fittedSet(fittedIds);
  if (typeof flying !== 'boolean') throw new TypeError('The craft flying flag must be a boolean.');
  const parts = DESIGNS[gradeId].parts;
  const ordered = LAYER_ORDER.map(id => parts.find(item => item.id === id));
  const ghosts = flying ? '' : ordered.filter(item => !fitted.has(item.id))
    .map(item => moduleArt(gradeId, item, color, false, false, paint)).join('');
  const colored = ordered.filter(item => fitted.has(item.id))
    .map(item => moduleArt(gradeId, item, color, true, flying, paint)).join('');
  const names = craft.parts.filter(item => fitted.has(item.id)).map(item => item.name);
  const configuration = flying
    ? gradeId === 'class-1' ? 'Orbital carrier transporting the rover. Carrier thrusters provide space propulsion.'
      : gradeId === 'class-4' ? 'Transfer configuration with fitted power wings folded in.'
        : 'Flight configuration.'
    : 'Workshop configuration. Dashed outlines show modules not yet fitted.';
  const label = `${craft.name}. ${flying ? 'In flight' : 'Workshop'}. ${fitted.size} of 6 modules fitted.`;
  return rootSVG(`sa-craft sa-craft--${gradeId}${flying ? ' is-flying' : ''}`,
    `0 0 ${craft.width} ${craft.height}`, label,
    `${configuration} Fitted modules: ${names.length ? names.join(', ') : 'none'}.`, ghosts + colored,
    { 'data-craft-grade': gradeId, 'data-configuration': flying && gradeId === 'class-1' ? 'orbital-carrier' : flying ? 'flight' : 'workshop' });
}

/** The actual workshop module, tightly cropped for a tray tile or a drag ghost. */
export function renderCraftPart(gradeId, partId, paint = 'coral') {
  const item = partFor(gradeId, partId);
  const craft = craftFor(gradeId);
  const color = colorFor(paint);
  return rootSVG('sa-craft-part', item.box.join(' '), `${craft.name}: ${item.name}`, item.purpose,
    moduleArt(gradeId, item, color, true, false, paint), { 'data-craft-grade': gradeId, 'data-part-id': partId });
}
