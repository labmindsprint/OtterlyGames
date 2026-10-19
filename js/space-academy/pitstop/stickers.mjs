// Pit Stop stickers: comic die-cut stickers drawn in a 0..60 box. Pure strings, no DOM at import time.
import { STICKERS } from './data.mjs';

const INK = '#2b2b2b';
const PAPER = '#fffdf8';
const GOLD = '#f5b82e';
const GOLD_SOFT = '#fde9a8';
const BLUE = '#4a8fe0';
const BLUE_SOFT = '#d3e6fb';
const GREEN = '#6fcf97';
const PINK = '#ff8fb8';
const CORAL = '#ff8a65';
const OTTER = '#b9855a';
const CREAM = '#efe6d2';
const NIGHT = '#2f3650';

const n1 = value => Math.round(value * 10) / 10;
const circle = (cx, cy, r) => `M${n1(cx - r)} ${n1(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const ellipse = (cx, cy, rx, ry, rot = 0) => {
  const a = (rot * Math.PI) / 180;
  const dx = rx * Math.cos(a);
  const dy = rx * Math.sin(a);
  return `M${n1(cx - dx)} ${n1(cy - dy)}A${rx} ${ry} ${rot} 1 0 ${n1(cx + dx)} ${n1(cy + dy)}A${rx} ${ry} ${rot} 1 0 ${n1(cx - dx)} ${n1(cy - dy)}Z`;
};
const polygon = points => `M${points.map(point => point.join(' ')).join('L')}Z`;
const starPoints = (cx, cy, outer, inner, count) => {
  const points = [];
  for (let i = 0; i < count * 2; i += 1) {
    const radius = i % 2 ? inner : outer;
    const angle = -Math.PI / 2 + (i * Math.PI) / count;
    points.push([n1(cx + radius * Math.cos(angle)), n1(cy + radius * Math.sin(angle))]);
  }
  return points;
};
const star = (cx, cy, outer, inner, count) => polygon(starPoints(cx, cy, outer, inner, count));

const fill = (d, color, extra = '') => `<path d="${d}" fill="${color}"${extra}/>`;
const line = (d, extra = '') => `<path d="${d}"${extra}/>`;
const shine = d => line(d, ' stroke="#fff" stroke-width="2.6"');
const dot = (cx, cy, r, color = INK) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="none"/>`;
const face = (lx, rx, ey, my, wide = 4) =>
  dot(lx, ey, 1.9) + dot(rx, ey, 1.9) + line(`M${lx + 1.5} ${my}Q${(lx + rx) / 2} ${my + wide} ${rx - 1.5} ${my}`, ' stroke-width="2"');

// Every sticker is a thick grey+white die-cut silhouette under a comic inked drawing.
const sticker = (sil, body, tf = '') => {
  const open = tf ? `<g transform="${tf}">` : '<g>';
  return `<g class="ps-stk">${open}` +
    `<path d="${sil}" transform="translate(.8 1.4)" fill="#c9c5bc" stroke="#c9c5bc" stroke-width="7.5" stroke-linejoin="round"/>` +
    `<path d="${sil}" fill="#fff" stroke="#fff" stroke-width="6.5" stroke-linejoin="round"/>` +
    `<g fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${body}</g></g></g>`;
};

const spiralPath = () => {
  const points = [];
  for (let i = 0; i <= 44; i += 1) {
    const angle = i * 0.3;
    const radius = 1.5 + i * 0.36;
    points.push(`${n1(30 + radius * Math.cos(angle))} ${n1(30 + radius * Math.sin(angle))}`);
  }
  return `M${points.join('L')}`;
};

const zigPoints = [[7, 40], [16, 20], [25, 40], [34, 20], [43, 40], [52, 20]];
const zigBand = polygon([
  ...zigPoints.map(([x, y]) => [x, y - 5]),
  ...[...zigPoints].reverse().map(([x, y]) => [x, y + 5]),
]);

const HEART = 'M30 53C10 38 5 25 10 16C15 8 26 9 30 19C34 9 45 8 50 16C55 25 50 38 30 53Z';
const CLOUD = 'M16 46C5 46 4 31 14 29C13 17 28 13 34 22C41 14 55 22 49 33C58 35 56 46 46 46Z';
const FLAME = 'M30 4C34 14 46 20 46 36C46 47 38 55 30 55C22 55 14 47 14 36C14 28 19 24 22 18C24 23 26 24 27 25C28 17 28 10 30 4Z';
const MOON = 'M26.3 9A23 23 0 1 0 48.7 39.7A19 19 0 0 1 26.3 9Z';
const BOLT = polygon([[36, 4], [12, 32], [27, 32], [22, 56], [49, 23], [34, 23]]);
const CROWN = 'M9 44L6 17L20 29L30 10L40 29L54 17L51 44Z';
const CROWN_BAND = 'M9 44H51V52H9Z';
const GEM = 'M17 9H43L55 24L30 54L5 24Z';
const LEAF = 'M9 51C6 25 22 9 51 8C53 35 38 53 9 51Z';
const COMET_TAIL = 'M47 33Q26 26 6 6Q26 34 33 47Z';
const ROCKET_BODY = 'M30 5C40 13 42 28 39 42H21C18 28 20 13 30 5Z';
const ROCKET_FINS = 'M21 34L10 47L21 44Z M39 34L50 47L39 44Z';
const ROCKET_FLAME = 'M24 42L30 57L36 42Z';
const FISH_TAIL = 'M44 30L58 17L58 43Z';
const FISH_FIN = 'M19 19L27 8L35 19Z';
const FLAG = 'M14 8C24 4 30 12 40 8C46 6 50 7 52 8L52 31C46 30 42 29 40 31C30 35 24 27 14 31Z';
const SUN = star(30, 30, 27.5, 19, 12);
const PLANET_RING = ellipse(30, 31, 25, 8, -20);
const PLANET_FRONT = 'M7.4 39.5A25 8 -20 0 0 52.6 22.5';

export const STICKER_ART = {
  star: sticker(star(30, 31, 26, 11.5, 5),
    fill(star(30, 31, 26, 11.5, 5), GOLD) + shine('M19 22L25 13') + face(25.5, 34.5, 31, 36) +
    line('M44 40L49 47M13 41L9 47', ' stroke-width="1.8"')),
  heart: sticker(HEART,
    fill(HEART, PINK) + shine('M13 21C14 16 18 13 22 14') + face(24, 36, 26, 32) +
    dot(19, 32, 2.6, '#ff6f9f') + dot(41, 32, 2.6, '#ff6f9f')),
  bolt: sticker(BOLT,
    fill(BOLT, GOLD) + shine('M33 10L20 28') + line('M34 23L24 38M28 42L25 50', ' stroke-width="1.6"')),
  moon: sticker(MOON,
    fill(MOON, GOLD_SOFT) + dot(17, 24, 3, '#f5b82e') + dot(15, 40, 2.2, '#f5b82e') + dot(26, 46, 2, '#f5b82e') +
    shine('M9 20C11 14 15 10 19 9') + dot(21, 32, 1.7) + line('M16 37Q21 40 25 36', ' stroke-width="1.8"')),
  rocket: sticker(`${ROCKET_BODY} ${ROCKET_FINS} ${ROCKET_FLAME}`,
    fill(ROCKET_FLAME, GOLD) + fill('M27 42L30 51L33 42Z', GOLD_SOFT, ' stroke="none"') +
    fill(ROCKET_FINS.split(' M')[0], CORAL) + fill(`M${ROCKET_FINS.split(' M')[1]}`, CORAL) +
    fill(ROCKET_BODY, PAPER) + fill('M30 5C34 8 37 12 38 17H22C23 12 26 8 30 5Z', CORAL) +
    `<circle cx="30" cy="27" r="5.2" fill="${BLUE_SOFT}"/>` + shine('M25 30L22 35'),
  'rotate(40 30 30)'),
  planet: sticker(`${circle(30, 30, 14)} ${PLANET_RING}`,
    line(PLANET_RING, ` stroke-width="8.2" stroke="${INK}"`) + line(PLANET_RING, ` stroke-width="4.4" stroke="${GOLD_SOFT}"`) +
    fill(circle(30, 30, 14), '#a78bfa') + line('M17 26Q30 31 43 24M17 35Q30 41 42 35', ' stroke-width="1.8"') +
    shine('M21 22C23 19 26 17 29 17') +
    line(PLANET_FRONT, ` stroke-width="8.2" stroke="${INK}"`) + line(PLANET_FRONT, ` stroke-width="4.4" stroke="${GOLD_SOFT}"`)),
  smile: sticker(circle(30, 30, 24),
    fill(circle(30, 30, 24), '#ffd84d') + shine('M13 22C15 16 19 12 24 10') +
    `<ellipse cx="22" cy="26" rx="2.5" ry="3.6" fill="${INK}" stroke="none"/><ellipse cx="38" cy="26" rx="2.5" ry="3.6" fill="${INK}" stroke="none"/>` +
    line('M16 36Q30 50 44 36', ' stroke-width="2.8"') + dot(15, 34, 3.2, CORAL) + dot(45, 34, 3.2, CORAL)),
  flame: sticker(FLAME,
    fill(FLAME, CORAL) + fill('M30 26C34 32 39 36 39 42C39 48 35 52 30 52C25 52 21 48 21 42C21 36 27 32 30 26Z', GOLD_SOFT) +
    fill('M30 38C33 41 34 44 34 47C34 50 32 51 30 51C28 51 26 50 26 47C26 44 28 41 30 38Z', GOLD, ' stroke="none"') +
    shine('M19 38C19 33 21 30 23 28')),
  crown: sticker(`${CROWN} ${CROWN_BAND}`,
    fill(CROWN, GOLD) + fill(CROWN_BAND, GOLD_SOFT) + shine('M12 40L10 25') +
    `<circle cx="6" cy="17" r="3.3" fill="${CORAL}"/><circle cx="30" cy="10" r="3.6" fill="${BLUE}"/><circle cx="54" cy="17" r="3.3" fill="${CORAL}"/>` +
    `<circle cx="19" cy="48" r="2.2" fill="${CORAL}" stroke="none"/><circle cx="30" cy="48" r="2.4" fill="${BLUE}" stroke="none"/><circle cx="41" cy="48" r="2.2" fill="${CORAL}" stroke="none"/>`),
  flag: sticker(`${FLAG} M11 4H17V56H11Z M5 55H25V58H5Z`,
    fill('M7 53Q14 47 21 53Z', '#c9c5bc') + fill('M12 8H16V54H12Z', CREAM) + fill(FLAG, CORAL) +
    fill(star(32, 19, 7.5, 3.2, 5), '#fff', ' stroke-width="1.8"') + dot(14, 6, 3, GOLD).replace('stroke="none"', `stroke="${INK}" stroke-width="2"`)),
  comet: sticker(`${COMET_TAIL} ${circle(40, 40, 11)}`,
    fill(COMET_TAIL, GOLD_SOFT) + line('M42 36Q28 28 14 14M36 43Q27 34 14 14', ' stroke="#f5b82e" stroke-width="1.8"') +
    fill(circle(40, 40, 11), BLUE_SOFT) + dot(37, 43, 2.2, '#9ec3ef') + dot(44, 37, 1.8, '#9ec3ef') + shine('M34 37C35 34 37 32 40 31')),
  ring: sticker(`${circle(30, 38, 16.5)} ${polygon([[21, 9], [39, 9], [45, 17], [30, 31], [15, 17]])}`,
    line(circle(30, 38, 12), ` stroke="${INK}" stroke-width="9.4"`) + line(circle(30, 38, 12), ` stroke="${GOLD}" stroke-width="5"`) +
    shine('M20 46C22 49 25 50 28 50') +
    fill(polygon([[21, 9], [39, 9], [45, 17], [30, 31], [15, 17]]), BLUE_SOFT) +
    line('M15 17H45M21 9L24 17L30 31L36 17L39 9M24 17H36', ' stroke-width="1.8"') + shine('M22 12L26 12')),
  otter: sticker(`${circle(30, 33, 21)} ${circle(13, 15, 6)} ${circle(47, 15, 6)}`,
    fill(circle(13, 15, 5.6), OTTER) + fill(circle(47, 15, 5.6), OTTER) + dot(13, 15.5, 2.4, '#7a5538') + dot(47, 15.5, 2.4, '#7a5538') +
    fill(circle(30, 33, 20.5), OTTER) + fill(ellipse(30, 39, 12.5, 9.5), CREAM) +
    `<ellipse cx="30" cy="33.5" rx="4.4" ry="3" fill="${INK}" stroke="none"/>` +
    line('M30 36.5V40M25 42Q30 45.5 35 42', ' stroke-width="2"') +
    dot(21.5, 26, 2.3) + dot(38.5, 26, 2.3) + dot(22.4, 25.2, 0.8, '#fff') + dot(39.4, 25.2, 0.8, '#fff') +
    line('M18 38L9 36M18 41L9 43M42 38L51 36M42 41L51 43', ' stroke-width="1.5"')),
  gem: sticker(GEM,
    fill(GEM, BLUE) + fill('M17 9H43L55 24H5Z', BLUE_SOFT) + line('M22 24L30 54L38 24M17 9L22 24M43 9L38 24M30 9V24', ' stroke-width="1.8"') +
    shine('M12 24L19 13')),
  leaf: sticker(LEAF,
    fill(LEAF, GREEN) + line('M9 51C20 38 32 26 44 15', ' stroke-width="2.2"') +
    line('M19 41L17 30M27 34L36 36M33 28L33 18M24 46L36 45', ' stroke-width="1.7"') + shine('M14 22C17 17 22 14 27 12')),
  cloud: sticker(CLOUD,
    fill(CLOUD, BLUE_SOFT) + shine('M10 35C9 32 11 30 13 30') + face(24, 36, 34, 38) + dot(19, 39, 2.6, '#9ec3ef') + dot(41, 39, 2.6, '#9ec3ef') +
    line('M30 20C34 18 37 19 38 21', ' stroke="#fff" stroke-width="2.4"')),
  cat: sticker(`${ellipse(30, 35, 22, 18)} M10 24L12 6L27 17Z M50 24L48 6L33 17Z`,
    fill('M10 24L12 6L27 17Z', '#f4c58b') + fill('M50 24L48 6L33 17Z', '#f4c58b') +
    fill('M14 19L14.5 11.5L21 16Z', PINK, ' stroke="none"') + fill('M46 19L45.5 11.5L39 16Z', PINK, ' stroke="none"') +
    fill(ellipse(30, 35, 22, 18), '#f4c58b') + line('M30 18V23M23 19L24.5 24M37 19L35.5 24', ' stroke="#d9904f" stroke-width="2.2"') +
    `<ellipse cx="21.5" cy="33" rx="2.4" ry="3.2" fill="${INK}" stroke="none"/><ellipse cx="38.5" cy="33" rx="2.4" ry="3.2" fill="${INK}" stroke="none"/>` +
    dot(22.2, 31.6, 0.9, '#fff') + dot(39.2, 31.6, 0.9, '#fff') +
    fill('M27.6 38H32.4L30 41Z', PINK, ' stroke-width="1.6"') + line('M30 41Q27 45 23.5 43M30 41Q33 45 36.5 43', ' stroke-width="1.8"') +
    line('M17 41L8 39M17 44L8 47M43 41L52 39M43 44L52 47', ' stroke-width="1.5"')),
  fish: sticker(`${ellipse(28, 30, 21, 14)} ${FISH_TAIL} ${FISH_FIN}`,
    fill(FISH_TAIL, '#ffb86b') + fill(FISH_FIN, '#ffb86b') + fill(ellipse(28, 30, 21, 14), BLUE) +
    fill('M11 36C20 44 38 44 47 36C38 40 20 40 11 36Z', BLUE_SOFT, ' stroke="none"') +
    line('M24 22Q28 30 24 38M34 21Q38 30 34 39', ' stroke-width="1.7"') +
    `<circle cx="16" cy="26" r="3.6" fill="#fff"/>` + dot(15.4, 26.4, 1.7) + line('M8 32Q11 34 13 33', ' stroke-width="1.8"') + shine('M17 18C21 15 26 15 30 16')),
  wave: sticker(circle(30, 30, 24),
    fill(circle(30, 30, 24), BLUE) +
    line('M11 21q4.5-6 9 0t9 0t9 0t9 0', ' stroke="#fff" stroke-width="3"') +
    line('M10 31q5-6 10 0t10 0t10 0t10 0', ' stroke="#fff" stroke-width="3"') +
    line('M12 41q4.5-6 9 0t9 0t9 0t9 0', ' stroke="#d3e6fb" stroke-width="3"')),
  sun: sticker(SUN,
    fill(SUN, GOLD_SOFT) + fill(circle(30, 30, 14.5), GOLD) + shine('M22 24C24 21 27 20 30 20') +
    dot(25.5, 29, 1.9) + dot(34.5, 29, 1.9) + line('M25 34Q30 39 35 34', ' stroke-width="2"') + dot(21, 34, 2.1, CORAL) + dot(39, 34, 2.1, CORAL)),
  check: sticker(circle(30, 30, 24),
    fill(circle(30, 30, 24), GREEN) + shine('M14 20C16 15 20 12 25 10') +
    line('M17 31L26 40L43 20', ` stroke="${INK}" stroke-width="9"`) + line('M17 31L26 40L43 20', ' stroke="#fff" stroke-width="5"')),
  dot: sticker(circle(30, 30, 24),
    fill(circle(30, 30, 24), BLUE) + fill(circle(30, 30, 16), PAPER) + fill(circle(30, 30, 8.5), CORAL) +
    shine('M15 22C17 17 21 14 25 12')),
  zig: sticker(zigBand,
    fill(zigBand, GOLD_SOFT) + line(`M${zigPoints.map(point => point.join(' ')).join('L')}`, ` stroke="${CORAL}" stroke-width="3.2"`) +
    shine('M9 33L16 18')),
  spiral: sticker(circle(30, 30, 24),
    fill(circle(30, 30, 24), '#7fd9b8') + line(spiralPath(), ' stroke-width="2.8"') + shine('M14 20C16 15 20 12 25 10')),
  eye: sticker('M4 30C14 14 46 14 56 30C46 46 14 46 4 30Z',
    fill('M4 30C14 14 46 14 56 30C46 46 14 46 4 30Z', PAPER) + fill(circle(30, 30, 11), BLUE) + fill(circle(30, 30, 5), INK) +
    line('M22 36Q30 40 38 36', ' stroke="#d3e6fb" stroke-width="1.8"') + dot(26.5, 26, 2.6, '#fff') + dot(33, 33, 1.2, '#fff') +
    line('M10 28C17 20 25 18 30 18', ' stroke-width="2.4"')),
  bee: sticker(`${ellipse(33, 36, 17, 13)} ${circle(13, 36, 9.5)} ${ellipse(30, 20, 7, 11, -20)} ${ellipse(41, 20, 7, 11, 25)} M50 31L58 36L50 41Z`,
    fill(ellipse(30, 20, 7, 11, -20), BLUE_SOFT) + fill(ellipse(41, 20, 7, 11, 25), BLUE_SOFT) +
    fill('M50 31L58 36L50 41Z', INK) + fill(ellipse(33, 36, 17, 13), GOLD) +
    line('M30 23.5Q27 36 30 48.5M38.5 23.8Q35.5 36 38.5 48.2', ` stroke-width="4.6" stroke-linecap="butt"`) +
    fill(circle(13, 36, 9.5), GOLD) + line('M10 27Q8 20 4 17M15 27Q17 19 14 14', ' stroke-width="1.8"') +
    dot(4, 17, 1.8) + dot(14, 14, 1.8) + dot(10.5, 34, 1.8) + dot(16.5, 34, 1.8) + line('M10 40Q13.5 43 17 40', ' stroke-width="1.8"') +
    shine('M27 27L23 31')),
};

export function stickerSVG(id, size = 48, extra = '') {
  const art = STICKER_ART[id];
  if (!art) return '';
  return `<svg class="ps-stk-svg" viewBox="0 0 60 60" width="${size}" height="${size}" aria-hidden="true" focusable="false" ${extra}>${art}</svg>`;
}

export const STICKER_IDS = STICKERS;
