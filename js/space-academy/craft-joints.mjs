// Where each workshop module meets the rest of its craft, in craft viewBox units (see campaign-crafts.mjs).
// points: 1 to 3 spark / flash / steam origins on the seam. seam: the line that glows while the weld cools.
// spread: width (radians) of the upward spark fan; the effect defaults it when omitted.
// Keep every point inside the part's tray crop box (+8) and inside the craft viewBox: the joints test enforces it.
const RAW = {
  pp1: {
    engine: { points: [[150, 312], [180, 314], [210, 312]], seam: [[140, 313], [220, 313]], spread: 2.8 },
    body: { points: [[148, 192], [212, 192], [180, 312]], seam: [[124, 192], [236, 192]], spread: 3 },
    cockpit: { points: [[148, 193], [212, 193], [180, 108]], seam: [[124, 193], [236, 193]], spread: 2.6 },
    nose: { points: [[150, 109], [180, 109], [210, 109]], seam: [[136, 109], [224, 109]], spread: 2.2 },
    'left-fin': { points: [[121, 246], [121, 264], [121, 282]], seam: [[121, 240], [121, 286]], spread: 2.4 },
    'right-fin': { points: [[239, 246], [239, 264], [239, 282]], seam: [[239, 240], [239, 286]], spread: 2.4 },
  },
  pp2: {
    engine: { points: [[192, 284], [210, 284], [228, 284]], seam: [[186, 283], [234, 283]], spread: 2.8 },
    body: { points: [[190, 185], [230, 185], [210, 282]], seam: [[168, 185], [252, 185]], spread: 3 },
    cockpit: { points: [[186, 185], [234, 185], [210, 104]], seam: [[168, 185], [252, 185]], spread: 2.6 },
    nose: { points: [[205, 104], [215, 104]], seam: [[200, 104], [220, 104]], spread: 2 },
    'left-fin': { points: [[120, 230], [119, 242]], seam: [[119, 227], [119, 245]], spread: 2.4 },
    'right-fin': { points: [[300, 230], [301, 242]], seam: [[301, 227], [301, 245]], spread: 2.4 },
  },
  'class-1': {
    engine: { points: [[195, 279], [210, 279], [225, 279]], seam: [[188, 279], [232, 279]], spread: 2.8 },
    body: { points: [[185, 185], [235, 185], [210, 275]], seam: [[162, 185], [258, 185]], spread: 3 },
    cockpit: { points: [[190, 185], [230, 185], [210, 109]], seam: [[176, 185], [244, 185]], spread: 2.6 },
    nose: { points: [[205, 108], [215, 108]], seam: [[201, 108], [219, 108]], spread: 2 },
    'left-fin': { points: [[136, 247], [134, 255]], seam: [[134, 244], [134, 258]], spread: 2.4 },
    'right-fin': { points: [[284, 247], [286, 255]], seam: [[286, 244], [286, 258]], spread: 2.4 },
  },
  'class-2': {
    engine: { points: [[192, 280], [210, 280], [228, 280]], seam: [[186, 280], [234, 280]], spread: 2.8 },
    body: { points: [[190, 182], [230, 182], [210, 279]], seam: [[176, 182], [244, 182]], spread: 3 },
    cockpit: { points: [[192, 183], [228, 183], [210, 113]], seam: [[182, 183], [238, 183]], spread: 2.6 },
    nose: { points: [[205, 113], [215, 113]], seam: [[201, 113], [219, 113]], spread: 2 },
    'left-fin': { points: [[147, 224], [147, 236]], seam: [[147, 221], [147, 239]], spread: 2.4 },
    'right-fin': { points: [[273, 224], [273, 236]], seam: [[273, 221], [273, 239]], spread: 2.4 },
  },
  'class-3': {
    engine: { points: [[188, 318], [200, 321], [212, 318]], seam: [[180, 319], [220, 319]], spread: 2.8 },
    body: { points: [[182, 188], [218, 188], [200, 319]], seam: [[168, 187], [232, 187]], spread: 3 },
    cockpit: { points: [[182, 185], [218, 185], [200, 110]], seam: [[168, 186], [232, 186]], spread: 2.6 },
    nose: { points: [[196, 108], [204, 108]], seam: [[193, 108], [207, 108]], spread: 2 },
    'left-fin': { points: [[149, 222], [148, 250], [147, 276]], seam: [[149, 215], [147, 281]], spread: 2.4 },
    'right-fin': { points: [[251, 222], [252, 250], [253, 276]], seam: [[251, 215], [253, 281]], spread: 2.4 },
  },
  'class-4': {
    engine: { points: [[196, 304], [210, 304], [224, 304]], seam: [[191, 304], [229, 304]], spread: 2.8 },
    body: { points: [[196, 189], [224, 189], [210, 301]], seam: [[188, 190], [232, 190]], spread: 3 },
    cockpit: { points: [[198, 191], [222, 191], [210, 103]], seam: [[190, 192], [230, 192]], spread: 2.6 },
    nose: { points: [[205, 102], [215, 102]], seam: [[201, 101], [219, 101]], spread: 2 },
    'left-fin': { points: [[146, 238], [146, 250]], seam: [[146, 234], [146, 254]], spread: 2.4 },
    'right-fin': { points: [[274, 238], [274, 250]], seam: [[274, 234], [274, 254]], spread: 2.4 },
  },
  'class-5': {
    engine: { points: [[195, 329], [210, 329], [225, 329]], seam: [[190, 328], [230, 328]], spread: 2.8 },
    body: { points: [[196, 178], [224, 178], [210, 327]], seam: [[184, 177], [236, 177]], spread: 3 },
    cockpit: { points: [[194, 178], [226, 178], [210, 109]], seam: [[182, 177], [238, 177]], spread: 2.6 },
    nose: { points: [[203, 109], [217, 109]], seam: [[199, 109], [221, 109]], spread: 2 },
    'left-fin': { points: [[119, 241], [119, 255]], seam: [[119, 237], [119, 259]], spread: 2.4 },
    'right-fin': { points: [[301, 241], [301, 255]], seam: [[301, 237], [301, 259]], spread: 2.4 },
  },
};

function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export const JOINTS = freeze(RAW);

/** Frozen joint data for one module: { points, seam?, spread? }. Throws for an unknown grade or part. */
export function jointsFor(gradeId, partId) {
  if (typeof gradeId !== 'string' || !Object.hasOwn(JOINTS, gradeId)) {
    throw new Error(`Unknown craft grade: ${String(gradeId)}.`);
  }
  if (typeof partId !== 'string' || !Object.hasOwn(JOINTS[gradeId], partId)) {
    throw new Error(`Unknown craft part: ${String(partId)}.`);
  }
  return JOINTS[gradeId][partId];
}
