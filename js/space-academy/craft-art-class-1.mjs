// Mars Rescue Rover (class-1): soft-3D drawing code. Slot centres follow the original flat art; the joints sit on the
// collars, hinge plates and bosses drawn here. In flight the rover rides an orbital carrier with two thruster pods.
import {
  PAPER, STEEL, GOLD, GLASS_LIGHT, num, tone, feature, group, mirror3d, radial, polygon, cylinder, volume,
  bevelPanel, glassLens, glassPane, specular, rivets, hazardStripes, contactShadow, lamp, flame3,
} from './craft-shading.mjs';

const WIDTH = 420;
const RED = '#ff5368';
const AMBER = '#ffb84d';
const GREEN = '#7dffb0';
const ORB = [[0, .62], [.2, .34], [.52, 0], [.8, -.28], [.94, -.46], [1, -.38]];
const TYRE = [[0, '#4d5878'], [.62, '#2d3552'], [1, '#151b2e']];
const RECESS = [[0, '#33405f'], [1, '#10162a']];
const HULL = 'M148 184H272Q282 184 286 193L289 205V250Q289 257 284 261L272 272Q268 276 262 276H158Q152 276 148 272L136 261Q131 257 131 250V205L134 193Q138 184 148 184Z';

const el = (tag, values) => `<${tag}${Object.entries(values).filter(([, value]) => value !== undefined)
  .map(([name, value]) => ` ${name}="${typeof value === 'number' ? num(value) : value}"`).join('')}/>`;
const carried = art => group(art, { transform: 'translate(63 22) scale(.7)', 'data-feature': 'carried-rover' });
const tenth = value => Math.round(value * 10) / 10;

// Round ball with one shared bounding-box gradient (the kit's sphere builds a new gradient for every ball).
function ball(c, cx, cy, r, fill = c.color, glint = true) {
  if (c.blueprint) return c.circle(cx, cy, r, 'none');
  const lit = c.scope.lit;
  return c.circle(cx, cy, r, radial(c, ORB.map(([at, amount]) => [at, tone(fill, amount)]), [.5, .5, .51, .5 + lit * .18, .31]), tone(fill, -.62), 1.6)
    + (glint ? specular(c, cx + lit * r * .4, cy - r * .44, r * .24, r * .13, -lit * 38) : '');
}

// Metal arm between two points, drawn as a polygon so every arm shares one diagonal gradient. The ghost outline stops
// at the wheel rims (r1, r2) so no dashes tangle inside the wheels.
function limb(c, x1, y1, x2, y2, width, r1 = 0, r2 = 0) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const [ux, uy] = [(x2 - x1) / length, (y2 - y1) / length];
  const [nx, ny] = [uy * width / 2, ux * width / 2];
  const [ax, ay, bx, by] = c.blueprint ? [x1 + ux * r1, y1 + uy * r1, x2 - ux * r2, y2 - uy * r2] : [x1, y1, x2, y2];
  return volume(c, polygon([[ax - nx, ay + ny], [bx - nx, by + ny], [bx + nx, by - ny], [ax + nx, ay - ny]]), { fill: STEEL, axis: 'diag' });
}

function slots(c, x, y, width, count, gap) {
  const d = Array.from({ length: count }, (_, index) => `M${num(x)} ${num(y + index * gap)}h${num(width)}`).join('');
  const stroke = { d, fill: 'none', 'stroke-linecap': 'round' };
  return c.detail(el('path', { ...stroke, stroke: tone(c.color, -.6), 'stroke-width': 2.6 })
    + el('path', { ...stroke, stroke: tone(c.color, .55), 'stroke-opacity': .6, 'stroke-width': 1.2, transform: 'translate(0 1.7)' }));
}

function gear(cx, cy) {
  const points = [];
  for (let tooth = 0; tooth < 8; tooth++) {
    for (const [turn, radius] of [[-.38, 11.5], [-.2, 14.8], [.2, 14.8], [.38, 11.5]]) {
      const angle = (tooth + turn) * Math.PI / 4;
      points.push([tenth(cx + Math.cos(angle) * radius), tenth(cy + Math.sin(angle) * radius)]);
    }
  }
  return polygon(points);
}

function wheel(c, cx, cy, r, bolts = false) {
  if (c.blueprint) return feature('wheel', c.circle(cx, cy, r, 'none'));
  const lit = c.scope.lit;
  const tread = Array.from({ length: 8 }, (_, index) => {
    const angle = index * Math.PI / 4 + .2;
    const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
    return `M${num(tenth(cx + cos * r * .8))} ${num(tenth(cy + sin * r * .8))}l${num(tenth(cos * r * .15))} ${num(tenth(sin * r * .15))}`;
  }).join('');
  return feature('wheel',
    c.circle(cx, cy, r, radial(c, TYRE, [.5, .5, .5, .5 + lit * .14, .36]), '#5b6890', 2)
    + el('path', { d: tread, fill: 'none', stroke: '#6a77a0', 'stroke-width': 2.2, 'stroke-linecap': 'round' })
    + ball(c, cx, cy, r * .58)
    + (bolts ? rivets(c, [0, 1, 2].map(step => [cx + Math.cos(step * 2.09 - 1.2) * r * .36, cy + Math.sin(step * 2.09 - 1.2) * r * .36]), { base: STEEL, r: 1.5 }) : '')
    + c.circle(cx, cy, r * .2, GOLD, tone(GOLD, -.62), 1.2)
    + specular(c, cx + lit * r * .5, cy - r * .64, r * .15, r * .07, -lit * 40, { opacity: .6 }));
}

function radar(c, cx, cy) {
  return c.detail(el('path', { d: `M${cx - 17} ${cy}A17 17 0 0 1 ${cx + 17} ${cy}M${cx - 9} ${cy}A9 9 0 0 1 ${cx + 9} ${cy}M${cx} ${cy}l11 -11`, fill: 'none', stroke: GLASS_LIGHT, 'stroke-opacity': .85, 'stroke-width': 1.3 })
    + el('circle', { cx: cx + 7, cy: cy - 10, r: 1.9, fill: AMBER })
    + el('circle', { cx: cx - 8, cy: cy - 5, r: 1.5, fill: AMBER }));
}

function nose(c) {
  return feature('stereo-camera',
    c.detail(cylinder(c, 153, 44, 14, 26, { fill: STEEL, rx: 6, shine: false, rim: false })
      + cylinder(c, 253, 44, 14, 26, { fill: STEEL, rx: 6, shine: false, rim: false })
      + el('path', { d: 'M241 30L249 12', fill: 'none', stroke: tone(STEEL, -.62), 'stroke-width': 4.8 })
      + el('path', { d: 'M241 30L249 12', fill: 'none', stroke: STEEL, 'stroke-width': 2.6 })
      + el('circle', { cx: 249.5, cy: 9.5, r: 4.6, fill: GOLD, stroke: tone(GOLD, -.62), 'stroke-width': 1.5 })
      + specular(c, 248, 8, 1.6, 1, -30))
    + cylinder(c, 201, 80, 18, 30, { fill: STEEL, rx: 3, shine: false, rim: false })
    + cylinder(c, 198, 91, 24, 6, { fill: STEEL, rx: 3, shine: false, rim: false })
    + contactShadow(c, 210, 114, 26, 3.6, { opacity: .5 })
    + cylinder(c, 188, 103, 44, 10, { fill: STEEL, rx: 5, shine: false, rim: false })
    + rivets(c, [[195, 108], [225, 108]], { base: STEEL })
    + cylinder(c, 163, 26, 94, 60, { axis: 'x', rx: 28 })
    + glassLens(c, 190, 57, 17, { ring: 4.6 })
    + glassLens(c, 230, 57, 17, { ring: 4.6 })
    + lamp(c, 210, 34, 2.4, { color: GREEN }));
}

function cockpit(c) {
  return feature('rover-computer',
    cylinder(c, 170, 108, 80, 79, { fill: PAPER, rx: 22 })
    + c.detail(bevelPanel(c, 180, 118, 60, 42, { fill: c.color, rx: 11 })
      + glassPane(c, 187, 124, 46, 30, { rx: 8, ring: 2.8 })
      + radar(c, 210, 148.5)
      + c.rect(184, 163, 52, 14, tone(PAPER, -.16), 7, tone(PAPER, -.55), 1.4)
      + lamp(c, 194, 170, 2.6, { color: RED }) + lamp(c, 210, 170, 2.6, { color: AMBER }) + lamp(c, 226, 170, 2.6, { color: GREEN }))
    + cylinder(c, 175, 180, 70, 10, { fill: STEEL, rx: 5, shine: false, rim: false })
    + rivets(c, [[183, 185], [237, 185]], { base: STEEL }));
}

function crate(c) {
  return c.detail(el('path', { d: 'M183.5 222h7v8.5h8.5v7h-8.5v8.5h-7v-8.5H175v-7h8.5Z', fill: RED, stroke: tone(RED, -.55), 'stroke-width': 1.2 }));
}

function samples(c) {
  return c.detail(el('circle', { cx: 224, cy: 243, r: 4.2, fill: '#d98a5f' })
    + el('circle', { cx: 234, cy: 245, r: 3.4, fill: '#9ed6c6' })
    + el('circle', { cx: 243, cy: 243, r: 3.8, fill: '#e9b44c' }));
}

function chassis(c) {
  return feature('cargo-chassis',
    c.detail(bevelPanel(c, 147, 168, 24, 20, { fill: GOLD, rx: 4 })
      + el('path', { d: 'M154 169q5-10 10 0M147 178h24', fill: 'none', stroke: tone(GOLD, -.5), 'stroke-width': 1.8, 'stroke-linecap': 'round' })
      + c.rect(250, 179, 20, 8, STEEL, 3, tone(STEEL, -.62), 1.6)
      + lamp(c, 260, 176, 5.5, { color: RED }))
    + cylinder(c, 131, 184, 158, 92, { axis: 'x', path: HULL, rx: 20 })
    + c.detail(contactShadow(c, 210, 190, 54, 7, { opacity: .55 })
      + cylinder(c, 166, 181, 88, 7, { fill: STEEL, rx: 3, shine: false, rim: false })
      + bevelPanel(c, 160, 209, 100, 48, { fill: PAPER, rx: 12 })
      + bevelPanel(c, 168, 215, 38, 36, { fill: GOLD, rx: 7 })
      + crate(c)
      + glassPane(c, 214, 215, 38, 36, { rx: 9, ring: 3 })
      + samples(c))
    + hazardStripes(c, 156, 263, 108, 8)
    + ball(c, 137, 251, 9, STEEL)
    + ball(c, 283, 251, 9, STEEL)
    + c.detail(c.circle(137, 251, 3.6, GOLD, tone(GOLD, -.62), 1.2) + c.circle(283, 251, 3.6, GOLD, tone(GOLD, -.62), 1.2)));
}

function drive(c) {
  return feature('drive-motor',
    cylinder(c, 168, 284, 84, 62, { axis: 'x', rx: 20 })
    + contactShadow(c, 210, 290, 34, 5, { opacity: .5 })
    + cylinder(c, 188, 271, 44, 16, { fill: STEEL, rx: 7, shine: false })
    + rivets(c, [[195, 279], [225, 279]], { base: STEEL })
    + c.circle(210, 313, 21, radial(c, RECESS), tone(STEEL, -.5), 2.2)
    + c.detail(cylinder(c, 195, 298, 30, 30, { path: gear(210, 313), fill: STEEL, shine: false, rim: false })
      + lamp(c, 210, 313, 4.4, { color: AMBER })
      + el('circle', { cx: 210, cy: 313, r: 20, fill: 'none', stroke: STEEL, 'stroke-width': 3 })
      + specular(c, 199, 302, 6, 2.4, -38, { opacity: .6}))
    + slots(c, 173, 303, 9, 3, 8)
    + slots(c, 238, 303, 9, 3, 8)
    + hazardStripes(c, 178, 336, 64, 7));
}

function wheels(c, full = true) {
  return limb(c, 142, 251, 76, 277, 13, 0, 24)
    + limb(c, 74, 277, 40, 309, 10, 24, 18)
    + limb(c, 74, 277, 110, 309, 10, 24, 18)
    + bevelPanel(c, 117, 237, 27, 30, { fill: STEEL, rx: 8 })
    + (full ? rivets(c, [[123, 243], [123, 261]], { base: STEEL }) : '')
    + wheel(c, 40, 309, 18) + wheel(c, 110, 309, 18) + wheel(c, 74, 277, 24, full);
}

function thruster(c, x) {
  return flame3(c, x, 352, 30, 36)
    + cylinder(c, x - 21, 306, 42, 22, { axis: 'x', rx: 8, shine: false })
    + cylinder(c, x - 16, 324, 32, 28, { path: `M${x - 10} 324H${x + 10}Q${x + 14} 340 ${x + 16} 352H${x - 16}Q${x - 14} 340 ${x - 10} 324Z`, fill: STEEL, shine: false, rim: false })
    + c.detail(el('ellipse', { cx: x, cy: 352, rx: 15, ry: 3.4, fill: '#ff9a3a', stroke: tone(STEEL, .3), 'stroke-width': 1.6 }));
}

function carrierEngine(c) {
  return feature('carrier-thrusters', thruster(c, 152) + thruster(c, 268)) + carried(drive(c));
}

function carrierBody(c) {
  return feature('orbital-carrier',
    cylinder(c, 161, 208, 10, 70, { fill: STEEL, rx: 3, shine: false, rim: false })
    + cylinder(c, 249, 208, 10, 70, { fill: STEEL, rx: 3, shine: false, rim: false })
    + cylinder(c, 70, 276, 280, 36, { axis: 'x', rx: 14, fill: PAPER })
    + bevelPanel(c, 157, 268, 18, 11, { fill: GOLD, rx: 4 }) + bevelPanel(c, 245, 268, 18, 11, { fill: GOLD, rx: 4 })
    + cylinder(c, 148, 285, 124, 18, { axis: 'x', rx: 7, shine: false })
    + hazardStripes(c, 98, 290, 38, 8) + hazardStripes(c, 284, 290, 38, 8)
    + lamp(c, 86, 294, 3, { color: AMBER }) + lamp(c, 334, 294, 3, { color: AMBER })
    + carried(chassis(c)));
}

export const class1Art = Object.freeze({
  engine: drive,
  body: chassis,
  cockpit,
  nose,
  leftFin: wheels,
  rightFin: c => mirror3d(c, WIDTH, wheels),
  // Carried wheels are drawn at 70%, so their bolts are left out to keep the flight picture light.
  flight: Object.freeze({
    engine: carrierEngine,
    body: carrierBody,
    leftFin: c => carried(wheels(c, false)),
    rightFin: c => carried(mirror3d(c, WIDTH, mirrored => wheels(mirrored, false))),
  }),
});
