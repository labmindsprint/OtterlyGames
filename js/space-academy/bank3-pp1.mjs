// Question bank 3 for PP1 (Moon Camp): six chapters, each built from its own families and its own pictures.
import * as counting from './bank3-pp1-counting.mjs';
import * as patterns from './bank3-pp1-patterns.mjs';
import * as shapes from './bank3-pp1-shapes.mjs';
import * as sorting from './bank3-pp1-sorting.mjs';
import * as position from './bank3-pp1-position.mjs';
import * as comparing from './bank3-pp1-comparing.mjs';
import * as numbers from './bank3-pp1-numbers.mjs';
import * as spaces from './bank3-pp1-spaces.mjs';
import * as real from './bank3-pp1-real.mjs';

const PARTS = [counting, patterns, shapes, sorting, position, comparing, numbers, spaces, real];

export const FAMILIES = Object.assign({}, ...PARTS.map(part => part.FAMILIES));
export const MISCONCEPTIONS = Object.assign({}, ...PARTS.map(part => part.MISCONCEPTIONS));

export const PLAN = {
  counting: [
    'pp1-count-sky pp1-count-dice pp1-count-cards pp1-count-frame pp1-num-near pp1-add-join',
    'pp1-count-sky pp1-count-cards pp1-count-cloud pp1-share-plates pp1-num-near pp1-num-name pp1-add-take',
    'pp1-count-dice pp1-count-frame pp1-count-cloud pp1-count-stones pp1-add-take pp1-share-plates pp1-num-near',
  ],
  patterns: [
    'pp1-pat-next pp1-pat-gap pp1-pat-steps pp1-pat-alpha pp1-num-skip pp1-day-week',
    'pp1-pat-next pp1-pat-gap pp1-pat-rows pp1-pat-twin pp1-time-clock pp1-num-skip pp1-day-week',
    'pp1-pat-gap pp1-pat-twin pp1-pat-turn pp1-pat-steps pp1-pat-rows pp1-time-clock pp1-pat-alpha',
  ],
  shapes: [
    'pp1-shape-find pp1-shape-corners pp1-shape-scene pp1-shape-shadow pp1-shape-hole pp1-shape-name',
    'pp1-shape-scene pp1-shape-hole pp1-shape-shadow pp1-shape-corners pp1-solid-pick pp1-shape-name',
    'pp1-shape-scene pp1-solid-pick pp1-shape-hole pp1-shape-shadow pp1-shape-corners pp1-shape-name',
  ],
  sorting: [
    'pp1-sort-odd pp1-sort-belong pp1-sort-twin pp1-sort-count pp1-sort-trays',
    'pp1-sort-odd pp1-sort-belong pp1-sort-trays pp1-sort-count pp1-sort-twin',
    'pp1-sort-count pp1-sort-odd pp1-sort-belong pp1-sort-trays pp1-sort-twin',
  ],
  position: [
    'pp1-pos-stack pp1-pos-race pp1-pos-scene pp1-pos-row pp1-pos-line pp1-pos-inside',
    'pp1-pos-race pp1-pos-stack pp1-pos-words pp1-pos-scene pp1-pos-floors pp1-pos-way pp1-pos-side',
    'pp1-pos-swap pp1-pos-way pp1-pos-scene pp1-pos-row pp1-pos-floors pp1-pos-side',
  ],
  comparing: [
    'pp1-cmp-more pp1-cmp-extreme pp1-cmp-thick pp1-cmp-seesaw pp1-cmp-same pp1-num-bigger',
    'pp1-cmp-more pp1-cmp-extreme pp1-cmp-seesaw pp1-cmp-equal pp1-cmp-same pp1-cmp-thick',
    'pp1-cmp-more pp1-cmp-equal pp1-cmp-seesaw pp1-cmp-extreme pp1-cmp-jars pp1-cmp-thick pp1-num-bigger',
  ],
};

const owner = new Map(PARTS.flatMap(part => Object.keys(part.FAMILIES).map(id => [id, part])));
const partFor = family => {
  const part = owner.get(family);
  if (!part) throw new Error(`Unknown PP1 family: ${family}`);
  return part;
};

export const draft = (family, grade, level, r) => partFor(family).draft(family, grade, level, r);
export const solve = question => partFor(question.family).solve(question);

export function render(visual) {
  for (const part of PARTS) {
    const markup = part.render(visual);
    if (markup !== null) return markup;
  }
  throw new Error(`Unsupported PP1 diagram: ${visual.kind}`);
}
