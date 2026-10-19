// Shared workshop drawing: the blueprint backdrop and the two-link robot arms used by the lab home and the weld scenes.
import { esc } from './ui.mjs';
import { SECOND_TORCH } from './bay-fit.mjs';

export const INK = '#2b2b2b';
export const W = 360;
export const H = 360;
// The ship sits in a 180 x 252 box inside the stage; ship units (300 x 420) map onto it.
export const SHIP = { x: 90, y: 48, k: 0.6 };
export const toStage = joint => ({ x: SHIP.x + joint.x * SHIP.k, y: SHIP.y + joint.y * SHIP.k });
export const WORDS = ['ZZZAP!', 'KA-CHUNK!', 'BZZT!', 'CLANK!', 'PSSSHH!', 'WHIRRR!', 'KRAK-A-ZZT!', 'SKREEE!'];
const SPARKS = [[-26, -30], [28, -34], [-34, -6], [34, -10], [-12, -42], [14, -44], [0, -26]];

// Two-link arm: the elbow is found from the target distance; bend picks which way the elbow folds.
function reach(base, target, length, bend) {
  const dx = target.x - base.x;
  const dy = target.y - base.y;
  const maxReach = length * 2 - 4;
  const distance = Math.max(24, Math.min(Math.hypot(dx, dy), maxReach));
  const heading = Math.atan2(dy, dx);
  const fold = Math.acos(Math.max(-1, Math.min(1, distance / (2 * length))));
  const angle = heading + bend * fold;
  return {
    elbow: { x: base.x + length * Math.cos(angle), y: base.y + length * Math.sin(angle) },
    tip: { x: base.x + distance * Math.cos(heading), y: base.y + distance * Math.sin(heading) },
  };
}

export function armSVG({ base, target, bend, color, side, working, word, delay }) {
  const length = Math.max(104, Math.hypot(target.x - base.x, target.y - base.y) / 2 + 4);
  const { elbow, tip } = reach(base, target, length, bend);
  const heading = Math.atan2(tip.y - elbow.y, tip.x - elbow.x) * 180 / Math.PI;
  const wordX = Math.max(46, Math.min(W - 46, tip.x + (side === 'left' ? -22 : 22)));
  const wordY = Math.max(40, tip.y - 40);
  const path = `M${base.x} ${base.y} L${elbow.x.toFixed(1)} ${elbow.y.toFixed(1)} L${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`;
  const sparks = working ? SPARKS.map(([dx, dy], index) =>
    `<circle class="ps-lab-spark" r="${index % 3 ? 2.6 : 3.4}" cx="0" cy="0" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${((index * 0.13) + delay).toFixed(2)}s" fill="${index % 2 ? '#ff6a28' : '#ffd166'}" stroke="${INK}" stroke-width="1.2"/>`).join('') : '';
  return `<g class="ps-arm ps-arm--${side}${working ? ' is-working' : ''}" style="transform-origin:${base.x}px ${base.y}px;--delay:${delay}s">
    <path d="${path}" fill="none" stroke="${INK}" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${path}" fill="none" stroke="#fffdf8" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 11" opacity=".55"/>
    <circle cx="${base.x}" cy="${base.y}" r="11" fill="#d9d6cf" stroke="${INK}" stroke-width="3"/><circle cx="${base.x}" cy="${base.y}" r="3" fill="${INK}"/>
    <circle cx="${elbow.x.toFixed(1)}" cy="${elbow.y.toFixed(1)}" r="9.5" fill="#d9d6cf" stroke="${INK}" stroke-width="3"/><circle cx="${elbow.x.toFixed(1)}" cy="${elbow.y.toFixed(1)}" r="2.6" fill="${INK}"/>
    <g transform="translate(${tip.x.toFixed(1)} ${tip.y.toFixed(1)}) rotate(${heading.toFixed(1)})">
      <path d="M-22 -7 L-8 -5 L0 0 L-8 5 L-22 7 Z" fill="#8a8780" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="-30" y="-9" width="10" height="18" rx="3" fill="#fffdf8" stroke="${INK}" stroke-width="3"/>
    </g>
    <g transform="translate(${tip.x.toFixed(1)} ${tip.y.toFixed(1)})">
      ${working ? `<circle class="ps-lab-glow" r="11" fill="#fff6c8" stroke="${INK}" stroke-width="2.4"/>` : ''}${sparks}
    </g>
    ${working ? `<text class="ps-lab-word" x="${wordX.toFixed(0)}" y="${wordY.toFixed(0)}" text-anchor="middle" style="animation-delay:${delay}s">${word}</text>` : ''}
  </g>`;
}

export function backdrop(info) {
  const dimX = 62;
  return `<svg class="ps-lab-svg ps-lab-svg--back" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">
    <defs><pattern id="ps-hazard" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="16" fill="#f5b82e"/><rect x="8" width="8" height="16" fill="${INK}"/></pattern></defs>
    <rect x="0" y="9" width="${W}" height="16" fill="#3b4468" stroke="${INK}" stroke-width="3"/>
    <path d="M10 17h340" stroke="#8a8780" stroke-width="2" stroke-dasharray="6 8"/>
    <circle class="ps-lab-lamp" cx="14" cy="34" r="5" fill="#d9534f" stroke="${INK}" stroke-width="2"/><circle class="ps-lab-lamp ps-lab-lamp--b" cx="346" cy="34" r="5" fill="#d9534f" stroke="${INK}" stroke-width="2"/>
    <g stroke="#6b78a8" stroke-width="1.6" fill="none" stroke-dasharray="5 5" opacity=".8">
      <path d="M${dimX} ${SHIP.y} v252"/><path d="M${dimX - 6} ${SHIP.y} h12M${dimX - 6} ${SHIP.y + 252} h12"/>
      <path d="M${SHIP.x} 324 h180"/><path d="M${SHIP.x} 318 v12M${SHIP.x + 180} 318 v12"/>
      <circle cx="${SHIP.x + 90}" cy="${SHIP.y + 130}" r="122" opacity=".4"/>
    </g>
    <text x="${dimX - 8}" y="${SHIP.y + 140}" font-size="12" fill="#9fb0e6" text-anchor="middle" transform="rotate(-90 ${dimX - 8} ${SHIP.y + 140})">HEIGHT 42 cm</text>
    <text x="${SHIP.x + 90}" y="335" font-size="11" fill="#9fb0e6" text-anchor="middle">${esc(info.shipName.toUpperCase())} · WIDTH 30 cm</text>
    <rect x="0" y="340" width="${W}" height="20" fill="url(#ps-hazard)" stroke="${INK}" stroke-width="3"/>
    <rect x="62" y="304" width="236" height="12" rx="4" fill="#8a8780" stroke="${INK}" stroke-width="3"/>
    ${[84, 118, 152, 186, 220, 254, 288].map(x => `<circle cx="${x - 10}" cy="310" r="3.6" fill="#d9d6cf" stroke="${INK}" stroke-width="2"/>`).join('')}
    <g class="ps-lab-vent"><circle cx="318" cy="332" r="7"/><circle cx="326" cy="332" r="6"/><circle cx="310" cy="332" r="5"/></g>
  </svg>`;
}

// Both arms swing to the part's joints: the left arm takes the leftmost joint, the right arm the rightmost.
export function armPair(joints, { working = true, wordOffset = 0, focus = null } = {}) {
  const stage = joints.map(toStage).sort((a, b) => a.x - b.x);
  const only = focus ? [toStage(focus)] : stage;
  const left = only[0] ?? { x: 104, y: 150 };
  const right = only.length > 1 ? only[only.length - 1] : only[0] ? { x: only[0].x + SECOND_TORCH.x, y: only[0].y + SECOND_TORCH.y } : { x: 256, y: 150 };
  return armSVG({ base: { x: 28, y: 36 }, target: left, bend: -1, color: '#f5b82e', side: 'left', working, word: WORDS[wordOffset % WORDS.length], delay: 0.2 })
    + armSVG({ base: { x: 332, y: 36 }, target: right, bend: 1, color: '#4a8fe0', side: 'right', working, word: WORDS[(wordOffset + 3) % WORDS.length], delay: working ? 0.5 : 1.1 });
}
