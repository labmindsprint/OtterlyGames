// Picks how the weld bay frames the ship so that every weld point of a part (and the torch that reaches it) is on screen.
// Pure maths on stage units (the 360 x 360 workshop drawing); the bay measures its real crop size and calls this.
export const STAGE = 360;
// Offset of the second arm's torch when one seam is worked on (see armPair in arms.mjs).
export const SECOND_TORCH = { x: 26, y: -12 };

// Every spot that must stay visible: each joint plus the idle partner torch beside it.
export function framePoints(stagePoints) {
  return stagePoints.flatMap(point => [point, { x: point.x + SECOND_TORCH.x, y: point.y + SECOND_TORCH.y }]);
}

const clamp = (value, low, high) => Math.min(Math.max(value, low), Math.max(low, high));

// width/height: the crop in px, inset: px at the bottom hidden by the name plate, margin: share of the crop kept clear on every side.
export function fitCrop(points, { width, height, inset = 0, margin = 0.12, pad = 8, maxZoom = 1.5 }) {
  const visible = Math.max(1, height - inset);
  const minX = Math.min(...points.map(point => point.x)) - pad;
  const maxX = Math.max(...points.map(point => point.x)) + pad;
  const minY = Math.min(...points.map(point => point.y)) - pad;
  const maxY = Math.max(...points.map(point => point.y)) + pad;
  const fit = Math.min(width * (1 - 2 * margin) / (maxX - minX), visible * (1 - 2 * margin) / (maxY - minY));
  const scale = Math.min(fit, maxZoom * width / STAGE);
  const place = (size, low, high, edge) => {
    const centred = size / 2 - (low + high) / 2 * scale;
    const covering = clamp(centred, edge - STAGE * scale, 0);
    return STAGE * scale >= edge ? clamp(covering, size * margin - low * scale, size * (1 - margin) - high * scale) : centred;
  };
  return { scale, zoom: scale * STAGE / width, ox: place(width, minX, maxX, width), oy: place(visible, minY, maxY, height) };
}
