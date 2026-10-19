// Outer Planet Voyager (class-2): soft-3D drawing code. Silhouettes, slot centres and joints match the original flat art.
// Only the original silhouettes stay visible in blueprint mode; interior parts sit inside c.detail().
import {
  PAPER, STEEL, GOLD, tone, mirror3d, feature, cylinder, volume, bevelPanel, nozzleBell, glassLens, solarCells,
  rivets, seam, vents, contactShadow, lamp, flame3, rimLight, specular, softLight, tint, linear, strut,
} from './craft-shading.mjs';

const HEX = 'M176 181H244L271 222 252 279H168L149 222Z';
const SHELL = 'M169 57Q210 2 251 57L235 78H185Z';
const SHADOW = '#101a36';
const DOWN = [0, 0, 0, 1];

const rod = (c, x1, y1, x2, y2, width, fill) => c.line(x1, y1, x2, y2, tone(fill, -.5), width + 2.4)
  + c.line(x1, y1, x2, y2, fill, width)
  + c.line(x1 - .7, y1 - .3, x2 - .7, y2 - .3, tone(fill, .7), Math.max(.8, width * .22));

const dot = (c, x, y, r, color) => c.circle(x, y, r, color, tone(color, -.55), .7);

function engine(c) {
  return flame3(c, 210, 353, 32, 38, { palette: 'ion' })
    + cylinder(c, 184, 274, 52, 29, { rx: 3 })
    + seam(c, 'M185 282H235M185 295H235', { base: c.color, width: 1.1 })
    + rivets(c, [[192, 288.5], [228, 288.5]], { base: STEEL })
    + lamp(c, 210, 288.5, 3.2, { color: '#58b6ff' })
    + nozzleBell(c, 188, 303, 44, 50, { palette: 'ion' });
}

function body(c) {
  const facets = tint(c, 'M176 181H244L238 199H182Z', { opacity: .34 })
    + tint(c, 'M176 181L182 199V222H149Z', { opacity: .2 })
    + tint(c, 'M244 181L271 222H238V199Z', { color: SHADOW, opacity: .1 })
    + tint(c, 'M271 222L252 279L238 262V222Z', { color: SHADOW, opacity: .24 })
    + tint(c, 'M168 279H252L238 262H182Z', { color: SHADOW, opacity: .32 });
  return feature('faceted-probe-bus', volume(c, HEX, { fill: GOLD, axis: 'diag' })
    + contactShadow(c, 210, 187, 30, 5, { opacity: .5 })
    + facets
    + seam(c, 'M176 181L182 199M244 181L238 199M168 279L182 262M252 279L238 262M149 222H182M238 222H271', { base: GOLD, width: 1.1 })
    + tint(c, 'M151 223L182 241V262L170 277Z', { opacity: .13 })
    + tint(c, 'M269 223L238 240V262L250 277Z', { color: SHADOW, opacity: .1 })
    + tint(c, 'M160 207L174 185H181L166 209Z', { opacity: .34 })
    + tint(c, 'M169 211L180 193H183L172 213Z', { opacity: .22 })
    + softLight(c, 190, 191, 28, 7, { angle: -10, opacity: .55 })
    + rimLight(c, 'M151 221L177 184H241', { base: GOLD, opacity: .8, width: 1.4 })
    + specular(c, 164, 205, 4.6, 1.4, -56, { opacity: .8 })
    + cylinder(c, 145, 215, 15, 29, { rx: 5 })
    + cylinder(c, 260, 215, 15, 29, { rx: 5 })
    + seam(c, 'M146 224H159M146 236H159M261 224H274M261 236H274', { base: c.color, width: 1 })
    + c.detail(rod(c, 164, 225, 177, 261, 3.4, PAPER) + rod(c, 256, 225, 243, 261, 3.4, PAPER))
    + c.detail(bevelPanel(c, 182, 199, 56, 63, { fill: PAPER, rx: 10, screws: true })
      + bevelPanel(c, 189, 210, 42, 38, { fill: c.color, rx: 4 })
      + c.rect(195, 216, 30, 19, '#0c1a33', 3, '#06101f', 1.2)
      + c.rect(199, 220, 20, 2.6, '#6fe3dc', 1.3, 'none', 0)
      + c.rect(199, 225, 13, 2.6, '#7dffb0', 1.3, 'none', 0)
      + c.rect(199, 230, 17, 2.6, '#ffb84d', 1.3, 'none', 0)
      + tint(c, 'M195 216H208L199 235H195Z', { opacity: .14 })
      + dot(c, 199, 242, 1.9, '#7dffb0') + dot(c, 210, 242, 1.9, '#ffb84d') + dot(c, 221, 242, 1.9, '#ff7a6a'))
    + rivets(c, [[184, 189], [236, 189], [175, 272], [245, 272]], { base: GOLD }));
}

function bay(c) {
  return feature('probe-instruments', cylinder(c, 179, 111, 62, 73, { rx: 18 })
    + c.detail(c.path('M179 158V166A18 18 0 0 0 197 184H223A18 18 0 0 0 241 166V158Z', linear(c, [[0, SHADOW, 0], [1, SHADOW, .42]], DOWN), 'none', 0))
    + glassLens(c, 199, 133, 13, { frame: PAPER })
    + glassLens(c, 224, 158, 11, { frame: PAPER })
    + vents(c, 188, 162, 14, 7, 2)
    + rivets(c, [[232, 124], [191, 177], [231, 177]], { base: STEEL }));
}

function dish(c) {
  const face = linear(c, [[0, tone(c.color, -.5)], [.55, tone(c.color, -.12)], [1, tone(c.color, .42)]], DOWN);
  return feature('radio-dish', strut(c, 210, 78, 210, 114, 13, { fill: PAPER })
    + contactShadow(c, 210, 79.5, 13, 3, { opacity: .55 })
    + volume(c, SHELL, { fill: PAPER, axis: 'diag' })
    + c.detail(c.path('M180 66H240L235 78H185Z', linear(c, [[0, SHADOW, 0], [1, SHADOW, .4]], DOWN), 'none', 0))
    + tint(c, 'M175 62L185 78H202L194 68Z', { opacity: .3 })
    + tint(c, 'M245 62L235 78H218L226 68Z', { color: SHADOW, opacity: .22 })
    + c.detail(c.ellipse(210, 57, 38.6, 11.6, 'none', tone(PAPER, .3), 2.6))
    + softLight(c, 194, 41, 17, 9, { angle: -30, opacity: .75 })
    + rimLight(c, 'M174 50Q181 36 200 32', { base: PAPER, opacity: .9, width: 1.4 })
    + c.detail(seam(c, 'M210 33Q196 40 187 53M210 33Q224 40 233 53', { base: PAPER, width: 1 })
      + c.ellipse(210, 57, 36, 10, face, tone(PAPER, -.45), 1.8)
      + c.ellipse(210, 57.5, 25, 6.4, 'none', tone(c.color, -.6), 1)
      + rimLight(c, 'M177 60Q196 71 222 69', { base: PAPER, opacity: .9, width: 1.4 })
      + rod(c, 210, 56, 210, 33, 3.4, STEEL)
      + glassLens(c, 210, 29, 7, { frame: STEEL, ring: 2 }))
    + specular(c, 190, 39, 7, 2.2, -40));
}

function wing(c) {
  return strut(c, 126, 230, 157, 230, 11, { fill: PAPER })
    + c.detail(c.rect(22, 183.4, 106, 108, tone(c.color, -.62), 5, 'none', 0))
    + feature('solar-array', solarCells(c, 22, 180, 106, 108, { cols: 4, rows: 4, frame: c.color, screws: true }))
    + tint(c, 'M30 188H120V193H30Z', { opacity: .14 })
    + c.detail(bevelPanel(c, 127, 221, 10, 18, { fill: STEEL, rx: 2.5 }));
}

export const class2Art = Object.freeze({
  engine, body, cockpit: bay, nose: dish, leftFin: wing, rightFin: c => mirror3d(c, 420, wing),
});
