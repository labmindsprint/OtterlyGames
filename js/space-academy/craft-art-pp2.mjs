// Planet Hopper Lander (pp2): soft-3D drawing code. Silhouettes, slot centres and joints match the original flat art.
// Only the original silhouettes stay visible in blueprint mode; interior parts sit inside c.detail().
import {
  PAPER, STEEL, GOLD, tone, mirror3d, cylinder, volume, sphere, bevelPanel, strut, nozzleBell, glassLens, glassPane,
  rivets, seam, vents, hazardStripes, contactShadow, glow, lamp, flame3, rimLight, specular, softLight, shadeBand, linear,
} from './craft-shading.mjs';

const HULL = 'M144 184H276L302 216V257L276 282H144L118 257V216Z';
const FACE = 'M148.3 193H271.7L293 219.2V253.2L272.4 273H147.6L127 253.2V219.2Z';
const DOME = 'M166 186v-36q0-48 44-48t44 48v36Z';
const EYE = 'M170 54Q210 10 250 54Q210 95 170 54Z';
const EYE_IN = 'M184 54Q210 31 236 54Q210 75 184 54Z';

function engine(c) {
  return flame3(c, 210, 354, 42, 36)
    + cylinder(c, 180, 279, 60, 27, { axis: 'x', rx: 9 })
    + rivets(c, [[190, 295], [230, 295]], { base: STEEL })
    + glow(c, 210, 294.5, 3.4, { color: '#ffb84d' })
    + nozzleBell(c, 178, 306, 64, 48);
}

function tank(c, x) {
  const strap = y => c.rect(x - .5, y, 30, 6.5, linear(c, [[0, tone(STEEL, -.35)], [.25, tone(STEEL, .45)], [.7, STEEL], [1, tone(STEEL, -.5)]]), 1.5, tone(STEEL, -.62), 1.1);
  return contactShadow(c, x + 14.5, 258, 15, 3.4, { opacity: .45 })
    + cylinder(c, x, 209, 29, 47, { fill: GOLD, rx: 12 })
    + strap(220) + strap(238);
}

function body(c) {
  return volume(c, HULL, { axis: 'diag' })
    + softLight(c, 168, 200, 34, 9, { angle: -8, opacity: .4 })
    + seam(c, FACE)
    + rimLight(c, 'M121.5 253V216.5L147.2 187H274', { base: c.color, opacity: .75, width: 1.6 })
    + shadeBand(c, 146, 185, 128, 14, { edge: 'top', opacity: .5 })
    + shadeBand(c, 146, 262, 128, 20, { edge: 'bottom', opacity: .38 })
    + c.detail(tank(c, 132) + tank(c, 259))
    + vents(c, 165, 228, 8, 15, 3)
    + lamp(c, 169, 216, 2.4, { color: '#7dffb0' })
    + lamp(c, 251, 216, 2.4, { color: '#ffb84d' })
    + c.detail(bevelPanel(c, 177, 207, 66, 52, { fill: PAPER, rx: 11 })
      + glassLens(c, 210, 233, 14, { ring: 3.4 }))
    + rivets(c, [[186, 216], [234, 216], [186, 251], [234, 251]], { base: STEEL })
    + hazardStripes(c, 177, 263, 66, 6, { pitch: 12 });
}

function cockpit(c) {
  return volume(c, DOME, { fill: PAPER })
    + softLight(c, 188, 120, 22, 12, { angle: -38, opacity: .6 })
    + shadeBand(c, 167, 172, 86, 14, { edge: 'bottom', opacity: .45 })
    + c.detail(glassPane(c, 177, 124, 66, 40, { rx: 16 })
      + strut(c, 210, 128, 210, 160, 3, { fill: STEEL })
      + cylinder(c, 188, 170, 44, 9, { axis: 'x', rx: 4 }))
    + rivets(c, [[174, 180], [246, 180]], { base: STEEL });
}

function nose(c) {
  return strut(c, 210, 79, 210, 110, 13, { fill: PAPER })
    + volume(c, EYE, { fill: PAPER, axis: 'down' })
    + specular(c, 190, 43, 12, 2.6, -24)
    + c.detail(volume(c, EYE_IN, { fill: c.color, axis: 'down', outline: tone(c.color, -.5), width: 1.4 })
      + c.path(EYE_IN, linear(c, [[0, '#101a36', .4], [.55, '#101a36', 0]], [0, 0, 0, 1]), 'none', 0)
      + glassLens(c, 210, 54, 10, { frame: STEEL, ring: 2.6 })
      + strut(c, 210, 30, 210, 45, 3, { fill: STEEL }))
    + glow(c, 210, 27, 2.6, { color: '#ff7a6a' });
}

function leg(c) {
  return strut(c, 143, 219, 74, 267, 13, { fill: STEEL })
    + strut(c, 74, 267, 50, 325, 13, { fill: STEEL })
    + c.detail(strut(c, 130, 228, 107.5, 244, 17, { fill: PAPER }))
    + sphere(c, 74, 267, 17, { fill: c.color })
    + c.detail(sphere(c, 74, 267, 6.5, { fill: GOLD }))
    + cylinder(c, 25, 320, 79, 18, { axis: 'x', rx: 9, fill: PAPER })
    + seam(c, 'M37 330H92', { base: PAPER })
    + rivets(c, [[40, 325], [88, 325]], { base: STEEL });
}

export const pp2Art = Object.freeze({
  engine, body, cockpit, nose, leftFin: leg, rightFin: c => mirror3d(c, 420, leg),
});
