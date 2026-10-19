// Small helpers for PP1 chapters whose choices are picture cards: words for things, a card frame, and a check that each card matches its label.
import { INK, PAPER, THINGS, put } from './bank3-pp1-art.mjs';

export const an = word => (/^[aeiou]/i.test(word) ? 'an' : 'a');
export const cap = word => word[0].toUpperCase() + word.slice(1);
export const name = thing => THINGS[thing].one;
export const withA = thing => `${an(name(thing))} ${name(thing)}`;
export const withThe = thing => `the ${name(thing)}`;

export const frame = (inner, w = 110, h = 110) => `<rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="20" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"/>${inner}`;

// Items are [thing, cx, cy, size, rotate?, flip?].
export const drawItems = items => items.map(([thing, x, y, size, rot, flip]) => put(thing, x, y, size, { rotate: rot, flip })).join('');

// A card holding one thing. The tag is the label of the choice that shows it.
export const thingCard = (kind, thing, size = 78, tag = name(thing), description = `${cap(withA(thing))} on a card.`) => ({
  kind, w: 110, h: 110, tag, items: [[thing, 55, 55, size]], description,
});

export function checkTags(question) {
  question.options.forEach((label, index) => {
    if (label !== question.optionVisuals?.[index]?.tag) throw new Error('A picture choice does not match its label.');
  });
  return question.optionVisuals;
}
