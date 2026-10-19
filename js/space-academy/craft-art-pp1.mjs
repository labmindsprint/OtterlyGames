// Moon Camp Capsule (pp1): soft-3D drawing code. Silhouettes, slot centres and joints match the original flat art.
import {
  PAPER, STEEL, GOLD, tone, mirror3d, cylinder, volume, sphere, bevelPanel, nozzleBell, glassLens, rivets, seam,
  vents, hazardStripes, glow, flame3, rimLight, shine, specular, softLight, shadeBand,
} from './craft-shading.mjs';

const HULL = 'M119 190H241V269Q241 313 199 313H161Q119 313 119 269Z';
const DOME = 'M118 194v-30c0-37 23-60 62-60s62 23 62 60v30Z';
const CAP = 'M130 110V86q0-60 50-60t50 60v24Z';
const FIN = 'M121 238Q73 232 38 281L35 317Q70 316 121 286Z';

function engine(c) {
  return flame3(c, 180, 373, 51, 44)
    + cylinder(c, 133, 302, 94, 23, { axis: 'x', rx: 10 })
    + rivets(c, [[146, 313.5], [214, 313.5]], { base: STEEL })
    + glow(c, 180, 313.5, 3.4, { color: '#ffb84d' })
    + nozzleBell(c, 146, 324, 68, 49);
}

function body(c) {
  return cylinder(c, 119, 190, 122, 123, { path: HULL, rx: 34, shine: false })
    + shine(c, 123, 212, 6, 62)
    + shadeBand(c, 120, 191, 120, 18, { edge: 'top', opacity: .5 })
    + seam(c, 'M121 208H239')
    + c.detail(bevelPanel(c, 143, 218, 74, 63, { fill: PAPER, rx: 25 })
      + glassLens(c, 180, 248, 13, { ring: 3.4 }))
    + rivets(c, [[155, 230], [205, 230], [155, 269], [205, 269]], { base: STEEL })
    + vents(c, 222, 226, 14, 32, 4)
    + glow(c, 229, 216, 2.8, { color: '#7dffb0' })
    + seam(c, 'M122 283H238')
    + hazardStripes(c, 127, 286, 106, 8);
}

function cockpit(c) {
  return volume(c, DOME, { fill: PAPER })
    + softLight(c, 146, 128, 22, 13, { angle: -38, opacity: .6 })
    + shadeBand(c, 119, 180, 122, 13, { edge: 'bottom', opacity: .45 })
    + seam(c, 'M122 183H238')
    + glassLens(c, 180, 153, 35, { frame: STEEL, ring: 8 })
    + c.detail(sphere(c, 137, 182, 5, { fill: c.color }) + sphere(c, 223, 182, 5, { fill: c.color }));
}

function nose(c) {
  return volume(c, CAP)
    + softLight(c, 152, 60, 17, 28, { angle: 18, opacity: .55 })
    + specular(c, 153, 64, 15, 3.4, -62)
    + specular(c, 146, 90, 2.6, 2.6, 0, { opacity: .7 })
    + shadeBand(c, 131, 95, 98, 14, { edge: 'bottom', opacity: .5 })
    + seam(c, 'M131 98H229')
    + c.detail(sphere(c, 210, 83, 6, { fill: GOLD }));
}

function fin(c) {
  return volume(c, FIN, { axis: 'diag' })
    + rimLight(c, 'M117 243Q76 238 46 283', { base: c.color, width: 2.4, opacity: .75 })
    + shadeBand(c, 96, 240, 24, 44, { edge: 'right', opacity: .5 })
    + seam(c, 'M102 254Q80 260 60 303')
    + cylinder(c, 30, 304, 82, 17, { axis: 'x', rx: 8, fill: PAPER })
    + hazardStripes(c, 42, 309.5, 58, 6)
    + c.detail(sphere(c, 108, 260, 7, { fill: GOLD }));
}

export const pp1Art = Object.freeze({
  engine, body, cockpit, nose, leftFin: fin, rightFin: c => mirror3d(c, 360, fin),
});
