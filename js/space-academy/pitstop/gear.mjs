// Pit Stop flight gear: 6 turrets + 4 shields, found as schematics in free roam and printed by a Print test. Pure data + inline SVG strings, no DOM at import time.
const INK = '#2b2b2b';
const PAPER = '#fffdf8';
const STEEL = '#cfd6e4';
const ST = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const ST2 = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;

export const TURRETS = [
  { id: 'pulse-blaster', kind: 'turret', name: 'Pulse Blaster', blurb: 'A steady beam of blue zaps. Never runs out!', color: '#4a8fe0', damage: 10, cooldownMs: 420, speed: 620, pattern: 'single', pierce: 0, power: 1 },
  { id: 'twin-laser', kind: 'turret', name: 'Twin Laser', blurb: 'Two speedy pink lasers side by side.', color: '#ff5c8a', damage: 8, cooldownMs: 380, speed: 900, pattern: 'twin', pierce: 0, power: 2 },
  { id: 'scatter-gun', kind: 'turret', name: 'Scatter Gun', blurb: 'Sprays three shots at once. Great for crowds!', color: '#f5b82e', damage: 7, cooldownMs: 650, speed: 560, pattern: 'spread3', pierce: 0, power: 3 },
  { id: 'missile-pod', kind: 'turret', name: 'Missile Pod', blurb: 'Slow rockets that chase the bad guys. Boom!', color: '#ff8a65', damage: 40, cooldownMs: 1100, speed: 380, pattern: 'homing', pierce: 0, power: 3 },
  { id: 'arc-lightning', kind: 'turret', name: 'Arc Lightning', blurb: 'Zaps up close and jumps through many foes.', color: '#b57cff', damage: 14, cooldownMs: 500, speed: 1100, pattern: 'beam', pierce: 3, power: 4 },
  { id: 'plasma-cannon', kind: 'turret', name: 'Plasma Cannon', blurb: 'One giant green blast that smashes through!', color: '#4fc98a', damage: 60, cooldownMs: 1500, speed: 300, pattern: 'single', pierce: 4, power: 5 },
];

export const SHIELDS = [
  { id: 'bubble-shield', kind: 'shield', name: 'Bubble Shield', blurb: 'A bouncy bubble that blocks 3 hits.', color: '#4a8fe0', hits: 3, regenSec: 8, effect: 'bubble', power: 1 },
  { id: 'mirror-shield', kind: 'shield', name: 'Mirror Shield', blurb: 'Shiny glass that bounces shots right back!', color: '#5fd6e0', hits: 4, regenSec: 7, effect: 'reflect', power: 2 },
  { id: 'heal-shield', kind: 'shield', name: 'Heal Shield', blurb: 'Turns blocked hits into ship hearts.', color: '#ff7fae', hits: 5, regenSec: 6, effect: 'absorb', power: 4 },
  { id: 'nova-shield', kind: 'shield', name: 'Nova Shield', blurb: 'Pops with a starry blast that zaps nearby foes!', color: '#f5b82e', hits: 6, regenSec: 5, effect: 'nova', power: 5 },
];

export const GEAR_ORDER = [
  'pulse-blaster', 'bubble-shield', 'twin-laser', 'mirror-shield', 'scatter-gun',
  'heal-shield', 'missile-pod', 'nova-shield', 'arc-lightning', 'plasma-cannon',
];

const ALL = [...TURRETS, ...SHIELDS];
const BY_ID = new Map(ALL.map(item => [item.id, item]));

export const gearById = id => BY_ID.get(id) || null;
export const gearUnlockedBy = count => {
  const take = Math.max(0, Math.min(GEAR_ORDER.length, Math.floor(Number(count) || 0)));
  return GEAR_ORDER.slice(0, take).map(gearById);
};

const svg = (viewBox, cls, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="${cls}" aria-hidden="true" focusable="false">` +
  `${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;

const n1 = value => Math.round(value * 10) / 10;
const starPoints = (cx, cy, outer, inner, count, rot = -90) => {
  const points = [];
  for (let i = 0; i < count * 2; i += 1) {
    const radius = i % 2 ? inner : outer;
    const angle = (rot * Math.PI) / 180 + (i * Math.PI) / count;
    points.push(`${n1(cx + radius * Math.cos(angle))},${n1(cy + radius * Math.sin(angle))}`);
  }
  return points.join(' ');
};
const sparkle = (cx, cy, r, color = '#fff') =>
  `<path d="M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z" fill="${color}"/>`;

// ---- Turret sprites (40 x 56, barrel at the top) ----
const dome = color =>
  `<path d="M5 54V46Q5 37 20 37Q35 37 35 46V54Z" fill="${STEEL}" ${ST}/>` +
  `<rect x="12" y="45" width="16" height="5" rx="2.5" fill="${color}" stroke="${INK}" stroke-width="2"/>`;
const barrel = (x, y, w, h, color) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${color}" ${ST}/>` +
  `<path d="M${x + 2.5} ${y + 5}V${y + h - 5}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7" fill="none"/>`;
const cap = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="7" rx="2.5" fill="${PAPER}" ${ST2}/>`;

const TURRET_ART = {
  'pulse-blaster': color => barrel(15, 12, 10, 28, color) + cap(12, 6, 16) + dome(color),
  'twin-laser': color =>
    barrel(5, 10, 9, 30, color) + barrel(26, 10, 9, 30, color) + cap(4, 5, 11) + cap(25, 5, 11) +
    `<rect x="12" y="26" width="16" height="12" rx="3" fill="${STEEL}" ${ST2}/>` + dome(color),
  'scatter-gun': color => {
    const fan = angle => `<g transform="rotate(${angle} 20 42)">${barrel(16, 9, 8, 33, color)}${cap(14, 5, 12)}</g>`;
    return fan(-26) + fan(26) + fan(0) + dome(color);
  },
  'missile-pod': color => {
    const cone = cx =>
      `<path d="M${cx - 4.5} 17L${cx} 3L${cx + 4.5} 17Z" fill="${PAPER}" ${ST2}/>` +
      `<path d="M${cx - 3.4} 11.5H${cx + 3.4}" stroke="#e5484d" stroke-width="3" fill="none"/>`;
    return cone(12) + cone(20) + cone(28) +
      `<rect x="6" y="16" width="28" height="24" rx="5" fill="${color}" ${ST}/>` +
      `<path d="M13 17V39M20 17V39M27 17V39" stroke="${INK}" stroke-width="2" opacity=".55" fill="none"/>` + dome(color);
  },
  'arc-lightning': color =>
    `<rect x="17" y="20" width="6" height="20" fill="${STEEL}" ${ST2}/>` +
    `<path d="M9 10V19Q9 26 20 26Q31 26 31 19V10" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M9 10V19Q9 26 20 26Q31 26 31 19V10" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="9" cy="8" r="4.5" fill="${PAPER}" ${ST2}/><circle cx="31" cy="8" r="4.5" fill="${PAPER}" ${ST2}/>` +
    `<path d="M20 3L15.5 12L23.5 15L18.5 25" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M20 3L15.5 12L23.5 15L18.5 25" fill="none" stroke="#fff5a0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` + dome(color),
  'plasma-cannon': color =>
    `<path d="M11 10H29L33 40H7Z" fill="#59627a" ${ST}/>` +
    `<rect x="6" y="3" width="28" height="10" rx="4" fill="${color}" ${ST}/>` +
    `<path d="M9 20H31M8 29H32" stroke="${INK}" stroke-width="2.5" opacity=".6" fill="none"/>` +
    `<circle cx="20" cy="26" r="7" fill="${color}" ${ST2}/><circle cx="18" cy="24" r="2.6" fill="#fff" opacity=".85"/>` + dome(color),
};

// ---- Projectiles (24 x 48, pointing up) ----
const PROJECTILE_ART = {
  'pulse-blaster': color =>
    `<rect x="6.5" y="6" width="11" height="34" rx="5.5" fill="${color}" ${ST2}/>` +
    `<rect x="10" y="10" width="4" height="22" rx="2" fill="#fff"/>`,
  'twin-laser': color =>
    `<rect x="8.5" y="2" width="7" height="44" rx="3.5" fill="${color}" ${ST2}/>` +
    `<rect x="11" y="6" width="2" height="34" rx="1" fill="#fff"/>`,
  'scatter-gun': color =>
    `<path d="M12 30L7.5 46H16.5Z" fill="${color}" opacity=".55"/>` +
    `<circle cx="12" cy="20" r="9" fill="${color}" ${ST2}/>` +
    `<circle cx="9" cy="16.5" r="3" fill="#fff" opacity=".85"/>`,
  'missile-pod': color =>
    `<path d="M12 32Q6 38 8 47Q12 43 12 43Q12 43 16 47Q18 38 12 32Z" fill="#ffd54a" ${ST2}/>` +
    `<path d="M7 20L2 32H8ZM17 20L22 32H16Z" fill="${color}" ${ST2}/>` +
    `<path d="M12 1Q18 8 17 14V32H7V14Q6 8 12 1Z" fill="${PAPER}" ${ST2}/>` +
    `<path d="M7 18H17V23H7Z" fill="${color}" stroke="${INK}" stroke-width="2"/>` +
    `<circle cx="12" cy="27" r="2" fill="${INK}"/>`,
  'arc-lightning': color =>
    `<path d="M14 1L5 20H12L8 32L19 14H12Z" fill="${color}" ${ST2}/>` +
    `<path d="M13 5L8.5 18L14 17L10.5 26" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M10 33L7 42M14 34L17 44" stroke="${color}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
  'plasma-cannon': color =>
    `<path d="M12 28Q4 38 7 47Q12 42 12 42Q12 42 17 47Q20 38 12 28Z" fill="${color}" opacity=".5"/>` +
    `<ellipse cx="12" cy="17" rx="10.5" ry="15" fill="${color}" ${ST2}/>` +
    `<ellipse cx="12" cy="18" rx="6.2" ry="10" fill="#d6ffe9"/>` +
    `<ellipse cx="12" cy="19" rx="2.8" ry="5.5" fill="#fff"/>`,
};

// ---- Shield sprites (200 x 200, translucent so the ship shows through) ----
const radial = (id, color, edge, mid = 0.12) =>
  `<radialGradient id="${id}-g" cx="50%" cy="50%" r="50%">` +
  `<stop offset="0" stop-color="${color}" stop-opacity="0"/>` +
  `<stop offset=".7" stop-color="${color}" stop-opacity="${mid}"/>` +
  `<stop offset="1" stop-color="${color}" stop-opacity="${edge}"/></radialGradient>`;

const SHIELD_ART = {
  'bubble-shield': color => ({
    defs: radial('bubble-shield', color, 0.55),
    body:
      `<circle cx="100" cy="100" r="92" fill="url(#bubble-shield-g)" fill-opacity="1"/>` +
      `<circle cx="100" cy="100" r="92" fill="none" stroke="${color}" stroke-width="6" stroke-opacity=".85"/>` +
      `<circle cx="100" cy="100" r="85" fill="none" stroke="#fff" stroke-width="2" stroke-opacity=".5"/>` +
      `<path d="M36 82Q44 52 74 36" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-opacity=".8"/>` +
      `<path d="M150 158Q166 144 172 122" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-opacity=".6"/>` +
      `<g fill-opacity=".95">${sparkle(148, 44, 14)}${sparkle(168, 70, 7)}${sparkle(52, 150, 8)}</g>`,
  }),
  'mirror-shield': color => ({
    defs: radial('mirror-shield', color, 0.4, 0.1),
    body:
      `<polygon points="${hexPoints(94)}" fill="url(#mirror-shield-g)" fill-opacity="1" stroke="${color}" stroke-width="6" stroke-linejoin="round" stroke-opacity=".9"/>` +
      `<polygon points="${hexPoints(70)}" fill="${color}" fill-opacity=".1" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-opacity=".6"/>` +
      `<path d="M${hexVertices(94).map(([x, y]) => `${x} ${y}L${n1(100 + (x - 100) * 0.74)} ${n1(100 + (y - 100) * 0.74)}M`).join('').slice(0, -1)}" stroke="#fff" stroke-width="2.5" stroke-opacity=".6" fill="none"/>` +
      `<path d="M40 74L74 40" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-opacity=".85"/>` +
      `<path d="M52 98L98 52" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-opacity=".6"/>` +
      `<path d="M138 164L162 140" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-opacity=".6"/>` +
      `<g fill-opacity=".95">${sparkle(148, 56, 10)}</g>`,
  }),
  'heal-shield': color => ({
    defs: radial('heal-shield', color, 0.5, 0.16),
    body:
      `<circle cx="100" cy="100" r="92" fill="url(#heal-shield-g)" fill-opacity="1"/>` +
      `<circle cx="100" cy="100" r="92" fill="none" stroke="${color}" stroke-width="6" stroke-opacity=".85"/>` +
      `<circle cx="100" cy="100" r="82" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 9" stroke-linecap="round" stroke-opacity=".7"/>` +
      `<path d="M100 36C88 22 66 28 66 44C66 58 86 68 100 78C114 68 134 58 134 44C134 28 112 22 100 36Z" transform="translate(0 -6)" fill="${color}" fill-opacity=".85" stroke="#fff" stroke-width="4" stroke-opacity=".9" stroke-linejoin="round"/>` +
      `<path d="M30 112h18M39 103v18M152 150h14M159 143v14M158 66h12M164 60v12" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-opacity=".85"/>` +
      `<path d="M38 80Q44 56 66 42" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-opacity=".6"/>`,
  }),
  'nova-shield': color => ({
    defs: radial('nova-shield', color, 0.45, 0.12),
    body:
      `<polygon points="${starPoints(100, 100, 98, 80, 14)}" fill="url(#nova-shield-g)" fill-opacity="1" stroke="${color}" stroke-width="5" stroke-linejoin="round" stroke-opacity=".95"/>` +
      `<circle cx="100" cy="100" r="72" fill="none" stroke="#fff" stroke-width="2.5" stroke-opacity=".55"/>` +
      `<polygon points="${starPoints(100, 100, 66, 56, 14, -83)}" fill="none" stroke="#fff3b0" stroke-width="2" stroke-linejoin="round" stroke-opacity=".7"/>` +
      `<path d="M44 78Q52 54 76 42" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-opacity=".75"/>` +
      `<g fill-opacity=".95">${sparkle(154, 48, 12)}${sparkle(46, 154, 8)}</g>`,
  }),
};

function hexVertices(r) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (-90 + i * 60) * Math.PI / 180;
    return [n1(100 + r * Math.cos(angle)), n1(100 + r * Math.sin(angle))];
  });
}
function hexPoints(r) {
  return hexVertices(r).map(point => point.join(',')).join(' ');
}

// ---- Menu icons (64 x 64): round badge with the gear drawn inside ----
const CREST = 'M32 9L51 16V32Q51 47 32 56Q13 47 13 32V16Z';
const SHIELD_ICON = {
  'bubble-shield': color =>
    `<path d="${CREST}" fill="${color}" ${ST}/><path d="M20 24Q22 19 28 17" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="32" cy="36" r="10" fill="#d3e6fb" ${ST2}/><path d="M27 33Q28 30 31 29" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>` +
    sparkle(41, 28, 4.5),
  'mirror-shield': color =>
    `<path d="${CREST}" fill="${color}" ${ST}/>` +
    `<polygon points="${hexVertices(13).map(([x, y]) => `${n1(x - 68)},${n1(y - 65)}`).join(' ')}" fill="#e9fcff" ${ST2}/>` +
    `<path d="M26 34L36 26" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`,
  'heal-shield': color =>
    `<path d="${CREST}" fill="${color}" ${ST}/>` +
    `<path d="M32 46C22 39 21 29 26.5 27C29.5 26 31.5 28 32 30C32.5 28 34.5 26 37.5 27C43 29 42 39 32 46Z" fill="${PAPER}" ${ST2}/>`,
  'nova-shield': color =>
    `<path d="${CREST}" fill="${color}" ${ST}/>` +
    `<polygon points="${starPoints(32, 34, 14, 6.5, 5)}" fill="${PAPER}" ${ST2}/>`,
};

export const turretSprite = id => {
  const gear = gearById(id);
  const art = gear && TURRET_ART[id];
  return art ? svg('0 0 40 56', `gear-turret gear-${id}`, art(gear.color)) : '';
};

export const projectileSVG = id => {
  const gear = gearById(id);
  const art = gear && PROJECTILE_ART[id];
  return art ? svg('0 0 24 48', `gear-shot gear-${id}-shot`, art(gear.color)) : '';
};

export const shieldSprite = id => {
  const gear = gearById(id);
  const art = gear && SHIELD_ART[id];
  if (!art) return '';
  const { defs, body } = art(gear.color);
  return svg('0 0 200 200', `gear-shield gear-${id}-bubble`, body, defs);
};

export const gearIcon = id => {
  const gear = gearById(id);
  if (!gear) return '';
  const plate = `<circle cx="32" cy="32" r="29" fill="${PAPER}" ${ST}/><circle cx="32" cy="32" r="23" fill="${gear.color}" fill-opacity=".22"/>`;
  const art = gear.kind === 'turret'
    ? `<g transform="translate(15.2 11.6) scale(.74)">${TURRET_ART[id](gear.color)}</g>`
    : SHIELD_ICON[id](gear.color);
  return svg('0 0 64 64', `gear-icon gear-${id}-icon`, plate + art);
};
