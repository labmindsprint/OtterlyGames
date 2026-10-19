// Pure helpers for free-roam steering and object taps (no DOM), so the rules can be unit tested.
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Free roam cruises at ROAM_SPEED x the class speed (it was 1.5x). Holding the boost button adds SPRINT_BOOST on top.
export const ROAM_SPEED = 3;
export const SPRINT_BOOST = 1.5;
// Gravity wells keep the strength they had at the old 1.5x cruise, so the faster ship can still climb out of them.
export const GRAVITY_SPEED = 1.5;
export const FLOAT_REACH = 70;
export const TAP_SLOP = 14;
export const TAP_MS = 600;
export const AIM_AFTER_MS = 220;
export const SWEEP_STEP = 24;
export const TAP_HIT_SLOP = 40;

export const roamTopSpeed = classSpeed => classSpeed * ROAM_SPEED;

// How long a name-and-fact card stays up: long enough for a young reader, scaled by the text length.
export const readMs = (text, min = 6000) => clamp(2800 + String(text).length * 70, min, 14000);
export const factText = body => `${body.name}. ${body.fact}`;

// Floating stick: finger offset from where the touch began, with a small dead zone.
export function dragVector(dx, dy, reach = FLOAT_REACH) {
  const len = Math.hypot(dx, dy);
  const m = Math.min(1, len / reach);
  return m < 0.12 ? { x: 0, y: 0 } : { x: dx / len * m, y: dy / len * m };
}

// Hold-to-aim: fly toward a finger that rests on the stage; the farther from the ship, the faster.
export function aimVector(dx, dy) {
  const len = Math.hypot(dx, dy);
  if (len < 24) return { x: 0, y: 0 };
  const m = clamp((len - 24) / 90, 0.25, 1);
  return { x: dx / len * m, y: dy / len * m };
}

// A fast ship is checked along its path in steps this long, so it cannot skip over a body, hole or wormhole.
export const sweepSteps = run => Math.max(1, Math.ceil(run / SWEEP_STEP));

// The named body under a world point. A body's tap area is its visual size plus a finger-sized slop.
// Bodies the point is inside rank by size (smallest first); otherwise the nearest wins.
export function pickBody(bodies, x, y, slop = TAP_HIT_SLOP) {
  let best = null;
  let bestKey = Infinity;
  for (const b of bodies) {
    if (b.off || !b.name) continue;
    const radius = b.hit ?? b.r;
    const gap = Math.hypot(b.x - x, b.y - y) - radius;
    if (gap > slop) continue;
    const key = gap <= 0 ? -1e6 + radius : gap;
    if (key < bestKey) { bestKey = key; best = b; }
  }
  return best;
}

export function nearestBody(bodies, x, y, range) {
  let best = null;
  let bestGap = range;
  for (const b of bodies) {
    if (b.off || !b.name) continue;
    const gap = Math.hypot(b.x - x, b.y - y) - (b.hit ?? b.r);
    if (gap < bestGap) { bestGap = gap; best = b; }
  }
  return best;
}
