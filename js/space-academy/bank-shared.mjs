import { seededRandom } from '../seeded-random.mjs';

export class QuestionRetry extends Error {}

export function randomContext(seed) {
  const random = seededRandom(seed);
  const int = (low, high) => {
    if (!Number.isSafeInteger(low) || !Number.isSafeInteger(high) || high < low) throw new RangeError('Invalid question-generation range.');
    return low + Math.floor(random() * (high - low + 1));
  };
  const pick = values => {
    if (!values.length) throw new RangeError('Cannot choose from an empty question pool.');
    return values[int(0, values.length - 1)];
  };
  const shuffle = values => {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index--) {
      const swap = int(0, index);
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  };
  return { int, pick, shuffle };
}

export const MISCONCEPTIONS = Object.fromEntries([
  ['missed-object', 'Counting each object', 'Point to each matching object once, including objects inside the scene.'],
  ['included-extra', 'Selecting the right objects', 'Count only objects that satisfy every condition in the question.'],
  ['compare-spacing', 'Comparing quantities', 'Spacing and picture size do not change how many objects there are.'],
  ['ignored-change', 'Tracking a change', 'Update the original amounts before deciding which is larger.'],
  ['repeat-unit', 'Finding the whole pattern', 'Find the entire repeating group, not just the last picture.'],
  ['ignored-mark', 'Checking every picture property', 'Check markings and position as well as the shape.'],
  ['sorting-rule', 'Keeping the named sorting rule', 'Use the property named in the question; other marks or colours may not matter.'],
  ['position-end', 'Starting at the named end', 'Find the left or right end named in the question, then count toward the middle one position at a time.'],
  ['calendar-column', 'Calendar weekday headings', 'Match the date column to the weekday heading above it.'],
  ['wrong-transform', 'Reflection and rotation', 'A turn and a mirror image move the parts differently.'],
  ['face-value', 'Digit value versus place value', 'Use the place occupied by the digit, not just the digit itself.'],
  ['place-shift', 'Changing a place-value rod', 'Moving a bead changes both the rod it leaves and the rod it joins.'],
  ['ignored-zero', 'Zero placeholders', 'Keep each digit in its correct place, including empty places.'],
  ['wrong-operation', 'Choosing an operation', 'Decide what is being combined, removed, shared or compared.'],
  ['missing-step', 'Completing all the steps', 'Check whether another change happens before the final answer.'],
  ['reversed-operation', 'Working backwards', 'Undo the last operation first, using its inverse.'],
  ['remainder-rule', 'Interpreting a remainder', 'Check whether the question asks for full groups, leftovers or one extra container.'],
  ['ignored-condition', 'Using every condition', 'Check the proposed answer against every clue, not just one.'],
  ['whole-parts', 'Identifying the whole', 'The denominator counts all equal parts of the stated whole.'],
  ['fraction-complement', 'Shaded versus unshaded', 'Check whether the question asks about the shaded part or what remains.'],
  ['changed-whole', 'A fraction of what remains', 'For the next fraction, first identify the new remaining whole.'],
  ['fraction-denominator', 'Comparing fractions', 'Compare equal wholes; a larger denominator does not by itself mean a larger fraction.'],
  ['scale-interval', 'Reading the scale interval', 'Use the labelled marks to find the value of one interval.'],
  ['scale-zero', 'Starting away from zero', 'Subtract the starting reading from the finishing reading.'],
  ['unit-conversion', 'Using matching units', 'Convert the quantities to the same unit before combining them.'],
  ['balance-total', 'Both sides of a balance', 'Both pans have the same total mass; subtract the known mass first.'],
  ['clock-hands', 'Hour and minute hands', 'The shorter hand follows hours; the longer hand follows minutes.'],
  ['hour-carry', 'Crossing an hour', 'Regroup 60 minutes as one hour.'],
  ['time-direction', 'Before versus after', 'Check whether you should count forwards or work backwards.'],
  ['clock-error', 'Fast or slow clocks', 'A fast clock is ahead of the real time; a slow clock is behind it.'],
  ['counted-endpoints', 'Counting time intervals', 'Count the gaps between dates or times, not both endpoints.'],
  ['coin-count', 'Coin values', 'Add the values on the coins, rather than just counting the coins.'],
  ['price-total', 'Cost of every item', 'Include the stated quantity of each purchased item.'],
  ['change-order', 'Money left after paying', 'Subtract the total cost from the amount available.'],
  ['graph-key', 'Graph keys and scales', 'A symbol or grid interval may represent more than one item.'],
  ['graph-difference', 'Difference versus total', 'Check whether the question asks how many altogether or how many more.'],
  ['graph-update', 'Updating data first', 'Apply the transfer or new result before comparing the groups.'],
  ['internal-edges', 'The outside boundary', 'Count exposed edges only; a shared inside edge is not on the perimeter.'],
  ['area-perimeter', 'Area versus perimeter', 'Area measures a surface in square units; perimeter measures its outside edge.'],
  ['missing-dimension', 'Finding the missing length', 'Use the given relation to find the missing dimension before calculating.'],
  ['opposite-faces', 'Folding a cube net', 'Track the faces after folding; neighbours in the net cannot be opposite.'],
  ['angle-relation', 'Angle relationships', 'Identify the straight angle or parallel-line relation before calculating.'],
  ['rank-endpoints', 'Ranks from opposite ends', 'The same person appears in both ranks, so count that person only once.'],
  ['turn-frame', 'Left and right after a turn', 'Left and right depend on the direction you are currently facing.'],
  ['path-constraint', 'Allowed routes', 'Count only paths that follow the arrows and satisfy the checkpoint rule.'],
  ['code-order', 'Following a code', 'Apply the same rule to each position and keep the required order.'],
  ['factor-multiple', 'Factors versus multiples', 'Equal largest groups and first shared meeting times require different methods.'],
  ['decimal-place', 'Decimal place value', 'Tenths and hundredths are different units; keep the decimal point fixed.'],
  ['decimal-align', 'Aligning decimal quantities', 'Line up equal place values before calculating.'],
].map(([code, title, message]) => [code, { title, message }]));

export function answerChoices(answer, alternatives, count = 4, visual = null, known = MISCONCEPTIONS) {
  const value = String(answer);
  const seen = new Set([value]);
  const choices = [{ value, code: null, ...(visual ? { visual } : {}) }];
  for (const alternative of alternatives) {
    if (!alternative || !known[alternative.code]) throw new Error('A question distractor needs a known feedback code.');
    if (typeof alternative.value === 'number' && !Number.isFinite(alternative.value)) throw new Error('A question distractor is not finite.');
    const candidate = String(alternative.value);
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    choices.push({ ...alternative, value: candidate });
  }
  // Random givens can make two wrong methods coincide. Regenerate, never invent filler answers.
  if (choices.length < count) throw new QuestionRetry('The question needs more distinct misconception-based choices.');
  return choices.slice(0, count);
}

export const wrong = (value, code, visual = null) => ({ value: String(value), code, ...(visual ? { visual } : {}) });
export const choiceCount = grade => grade.choices ?? (grade.year < 0 ? 2 : grade.year === 0 ? 3 : 4);
export const sum = values => values.reduce((total, value) => total + value, 0);
// "p.m." already ends with a full stop, so a sentence stop after it is dropped.
export const tidyStops = text => String(text).replace(/\b([ap]\.m\.)\.(?!\.)/gi, '$1');
export const wordArticle = word => {
  const lower = String(word).toLowerCase();
  const vowel = /^[aeiou]/.test(lower) && !/^(uni|use|usu|uti|eu|one|once|ubi|ura|uro|uk)/.test(lower) || /^(hour|honest|heir|honou?r)/.test(lower);
  return vowel ? 'an' : 'a';
};
export const numberArticle = value => {
  const digits = String(value).replace(/\D.*$/, '');
  return digits === '11' || digits === '18' || digits.startsWith('8') ? 'an' : 'a';
};
export const numberText = value => Number(value).toLocaleString('en-IN');
export const timeText = minutes => {
  const normal = ((minutes % 720) + 720) % 720;
  return `${Math.floor(normal / 60) || 12}:${String(normal % 60).padStart(2, '0')}`;
};
