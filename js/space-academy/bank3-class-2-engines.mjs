import { MISCONCEPTIONS as SHARED, QuestionRetry, answerChoices, choiceCount, sum, timeText, wrong } from './bank-shared.mjs';
import { clockDescription } from './diagram-kit.mjs';

export const CUSTOM_CODES = {
  'class-2-block-count': { title: 'Counting blocks not values', message: 'A flat is 100, a rod is 10, and a cube is 1. Use each block value.' },
  'class-2-tick-step': { title: 'Number-line step', message: 'Find how much each tick mark adds before reading the arrow.' },
  'class-2-order-rank': { title: 'Order and position', message: 'Sort all four numbers from smallest to greatest, then check the asked position.' },
  'class-2-added-sides': { title: 'Rows plus columns', message: 'For an array of rows and columns, multiply rows by columns instead of adding.' },
  'class-2-jump-marks': { title: 'Counting marks not jumps', message: 'Count the curved jumps and multiply by the size of each jump.' },
  'class-2-carry-borrow': { title: 'Regrouping ten', message: 'When ones or tens cross 10, regroup 1 ten or 1 hundred carefully.' },
  'class-2-full-diff': { title: 'Giving the whole difference', message: 'Give only half the difference so both trays end up with the same amount.' },
  'class-2-tile-step': { title: 'Growing pattern step', message: 'Find how many new tiles are added at each step, then add that to the last figure.' },
  'class-2-hidden-cube': { title: 'Hidden bottom cubes', message: 'A tall column has cubes underneath holding up the top cube.' },
  'class-2-heavier-side': { title: 'Reading balance tilt', message: 'The heavier object makes its pan go down; the lighter pan goes up.' },
  'class-2-full-transfer': { title: 'Tally bundle of five', message: 'A crossed tally group counts as 5, not 4.' },
};

const KNOWN = { ...SHARED, ...CUSTOM_CODES };

const NAMES = ['Avi', 'Dia', 'Kai', 'Leo', 'Mia', 'Nia', 'Rio', 'Sam', 'Tia', 'Zoe'];
const SHAPES = ['circle', 'triangle', 'square', 'star'];
const MARKS = ['none', 'dot', 'ring'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STEP_WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];

export const plural = (n, one, many = `${one}s`) => `${n} ${Number(n) === 1 ? one : many}`;

const numChoices = (answer, pairs, count = 4, visual = null) => {
  const ans = Number(answer);
  const valid = pairs
    .filter(([val]) => Number.isFinite(val) && val > 0 && Math.round(val) === val && val !== ans);
  const fallbackCode = valid[0]?.[1] ?? 'wrong-operation';
  const step = ans >= 100 ? 10 : ans >= 20 ? 2 : 1;
  const mode = Math.abs(ans * 31 + valid.length * 7) % 3;
  let ordered = valid;
  if (mode === 0 && !visual) {
    const higher = [
      ...valid.filter(([v]) => v > ans),
      [ans + step, fallbackCode],
      [ans + step * 2, fallbackCode],
      [ans + step * 3, fallbackCode],
    ];
    ordered = [...higher, ...valid];
  } else if (mode === 1 && !visual && ans > step * 3) {
    const lower = [
      ...valid.filter(([v]) => v < ans),
      [ans - step, fallbackCode],
      [ans - step * 2, fallbackCode],
      [ans - step * 3, fallbackCode],
    ];
    ordered = [...lower, ...valid];
  }
  const list = ordered.map(([val, code, vis]) => wrong(val, code, vis));
  return answerChoices(ans, list, count, visual, KNOWN);
};

const strChoices = (answer, pairs, count = 4, visual = null) =>
  answerChoices(answer, pairs.filter(([val]) => String(val) !== String(answer)).map(([val, code, vis]) => wrong(val, code, vis)), count, visual, KNOWN);

const expectKind = (visual, kind) => {
  if (visual?.kind !== kind) throw new Error(`Expected diagram ${kind}, got ${visual?.kind}`);
  return visual;
};

const checkOptionVisuals = (question, kind, keyFn) => {
  if (!Array.isArray(question.optionVisuals) || question.optionVisuals.length !== question.options.length) {
    throw new Error('Missing optionVisuals');
  }
  question.optionVisuals.forEach((v, i) => {
    if (v?.kind !== kind || keyFn(v) !== question.options[i]) {
      throw new Error(`Option visual mismatch at ${i}: expected ${question.options[i]}, got ${v ? keyFn(v) : 'null'}`);
    }
  });
  return question.optionVisuals;
};

export const DRAFT_MAP = {};
export const SOLVE_MAP = {};

// ============================================================================
// CHAPTER 1: NUMBERS
// ============================================================================

// 1. class-2-place-blocks
DRAFT_MAP['class-2-place-blocks'] = (family, grade, level, r) => {
  const h = r.int(1, level === 1 ? 5 : 8);
  const t = level === 1 ? r.int(1, 7) : r.int(0, 8);
  const o = r.int(1, 8);
  const extraT = level === 3 ? r.int(1, 2) * 10 : 0;
  const value = h * 100 + t * 10 + o + extraT;
  if (h === t && t === o) throw new QuestionRetry('Distinct block counts preferred');
  const visual = {
    kind: 'v3-class-2-blocks', h, t, o,
    description: `Base-ten blocks: ${plural(h, 'hundred-flat')}, ${plural(t, 'ten-rod')}, and ${plural(o, 'one-cube')}.`,
  };
  const prompt = extraT
    ? `Each flat is 100, each rod is 10, and each cube is 1. Add ${plural(extraT / 10, 'more ten-rod', 'more ten-rods')} to the blocks shown. What number do you get?`
    : 'Each flat is 100, each rod is 10, and each cube is 1. What number do the blocks show?';
  const hint = extraT
    ? 'Find the number shown by the flats, rods, and cubes first, then add the extra ten-rods.'
    : 'Count the hundreds, tens, and ones separately, then combine their place values.';
  const explanation = `First find each group's value: ${plural(h, 'hundred')} = ${h * 100}, ${plural(t, 'ten')} = ${t * 10}, and ${plural(o, 'one')} = ${o}${extraT ? `, plus ${extraT} more` : ''}. Adding ${h * 100} + ${t * 10} + ${o}${extraT ? ` + ${extraT}` : ''} = ${value} in all.`;
  return {
    family, prompt, answer: String(value),
    hint,
    explanation,
    proof: { family, givens: { extraT } },
    visual,
    choices: numChoices(value, [
      [h + t + o + extraT / 10, 'class-2-block-count'],
      [h * 100 + o * 10 + t, 'place-shift'],
      [o * 100 + t * 10 + h, 'place-shift'],
      [value + (extraT ? -extraT : 100), extraT ? 'missing-step' : 'face-value'],
      [value + 10, 'class-2-block-count'],
      [value - 10, 'class-2-block-count'],
    ]),
  };
};
SOLVE_MAP['class-2-place-blocks'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-blocks');
  return String(v.h * 100 + v.t * 10 + v.o + (q.proof.givens.extraT ?? 0));
};

// 2. class-2-number-line
DRAFT_MAP['class-2-number-line'] = (family, grade, level, r) => {
  const step = level === 1 ? r.pick([2, 5, 10]) : level === 2 ? r.pick([5, 10, 20, 25]) : r.pick([10, 20, 25, 50]);
  const start = r.int(2, 12) * 20;
  const ticks = 6;
  const arrowIndex = r.int(1, ticks - 1);
  const deltaSteps = level === 3 ? r.pick([-1, 1, 2]) : 0;
  const landIndex = arrowIndex + deltaSteps;
  const refIdx = arrowIndex === 2 ? 4 : 2;
  if (landIndex <= 0 || landIndex >= ticks || landIndex === refIdx) {
    throw new QuestionRetry('Keep final number off labeled reference ticks');
  }
  const delta = deltaSteps * step;
  const arrowVal = start + arrowIndex * step;
  const answer = arrowVal + delta;
  const visual = {
    kind: 'v3-class-2-numline', start, step, ticks, arrowIndex,
    description: `Number line with ${ticks + 1} evenly spaced marks from ${start} to ${start + ticks * step}. The ? points to mark ${arrowIndex} after ${start}.`,
  };
  const prompt = delta
    ? `The number line runs from ${start} to ${start + ticks * step} with equal steps. Start at the ? mark and move ${Math.abs(delta)} ${delta > 0 ? 'to the right' : 'to the left'}. What number do you reach?`
    : `The marks on this number line from ${start} to ${start + ticks * step} are equally spaced. What number goes at the ? mark?`;
  const hint = delta
    ? 'Find how much one tick step adds to read the arrow first, then move along the line.'
    : 'Subtract the start from the end and divide by 6 equal steps to find what one step adds.';
  const explanation = `From ${start} to ${start + ticks * step} in ${ticks} equal steps means each step adds ${step}. Counting ${plural(arrowIndex, 'step')} from ${start} puts '?' at ${arrowVal}${delta ? `, and moving ${delta > 0 ? '+' : ''}${delta} reaches ${answer}` : ''}.`;
  return {
    family, prompt, answer: String(answer),
    hint,
    explanation,
    proof: { family, givens: { delta } },
    visual,
    choices: numChoices(answer, [
      [start + arrowIndex, 'class-2-tick-step'],
      [arrowVal - step, 'class-2-tick-step'],
      [arrowVal + step, 'class-2-tick-step'],
      [delta ? arrowVal : arrowVal + 10, delta ? 'missing-step' : 'class-2-tick-step'],
      [start + (ticks - arrowIndex) * step, 'position-end'],
      [answer + step * 2, 'class-2-tick-step'],
    ]),
  };
};
SOLVE_MAP['class-2-number-line'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-numline');
  return String(v.start + v.arrowIndex * v.step + (q.proof.givens.delta ?? 0));
};

// 3. class-2-expanded-story
DRAFT_MAP['class-2-expanded-story'] = (family, grade, level, r) => {
  const mode = level === 1 ? 'direct' : level === 2 ? 'regroup' : 'diff';
  const h = r.int(2, 8);
  const t = level === 2 ? r.int(11, 18) : r.int(1, 9);
  const o = r.int(1, 9);
  const orderSwap = mode !== 'diff' && r.pick([true, false]);
  const visual = {
    kind: 'v3-class-2-expanded', mode, h, t, o, orderSwap,
    description: `Crate code cards: ${orderSwap ? `${plural(t, 'ten')}, ${plural(h, 'hundred')}, and ${plural(o, 'one')}` : `${plural(h, 'hundred')}, ${plural(t, 'ten')}, and ${plural(o, 'one')}`}.`,
  };
  if (mode === 'diff') {
    const pairs = [['hundreds', 'tens'], ['hundreds', 'ones'], ['tens', 'ones']];
    const pairIdx = r.int(0, 2);
    const [bigName, smallName] = pairs[pairIdx];
    const vals = { hundreds: h * 100, tens: t * 10, ones: o };
    const num = h * 100 + t * 10 + o;
    const answer = vals[bigName] - vals[smallName];
    const digits = { hundreds: h, tens: t, ones: o };
    return {
      family,
      prompt: `Look at the three place-value cards. How much greater is the value of the ${bigName} card than the value of the ${smallName} card?`,
      answer: String(answer),
      hint: `Find the full value of each of the two cards first, then subtract the smaller value from the larger value.`,
      explanation: `On the cards for ${num}, the ${bigName} card is worth ${vals[bigName]} and the ${smallName} card is worth ${vals[smallName]}. Subtracting ${vals[bigName]} - ${vals[smallName]} = ${answer}.`,
      proof: { family, givens: { mode, pairIdx } },
      visual,
      choices: numChoices(answer, [
        [Math.abs(digits[bigName] - digits[smallName]), 'face-value'],
        [vals[bigName] + vals[smallName], 'wrong-operation'],
        [vals[bigName] - digits[smallName], 'place-shift'],
        [digits[bigName] * 10 - vals[smallName], 'place-shift'],
        [answer + 10, 'class-2-carry-borrow'],
        [answer - 10, 'class-2-carry-borrow'],
      ]),
    };
  }
  const value = h * 100 + t * 10 + o;
  return {
    family,
    prompt: 'Look at the three place-value cards. What 3-digit number is the crate code?',
    answer: String(value),
    hint: mode === 'regroup'
      ? 'Ten tens make one hundred: convert the tens card to its full value before adding.'
      : 'Write the value of the hundreds, the tens, and the ones cards, then add them together.',
    explanation: `First convert each card to its value: ${plural(h, 'hundred')} = ${h * 100}, ${plural(t, 'ten')} = ${t * 10}, and ${plural(o, 'one')} = ${o}. Adding ${h * 100} + ${t * 10} + ${o} = ${value} in all.`,
    proof: { family, givens: { mode } },
    visual,
    choices: numChoices(value, [
      [t < 10 ? t * 100 + h * 10 + o : (t % 10) * 100 + h * 10 + o, 'place-shift'],
      [h * 100 + o * 10 + (t % 10), 'place-shift'],
      [h + t + o, 'face-value'],
      [value - 100, 'class-2-carry-borrow'],
      [value + 90, 'place-shift'],
    ]),
  };
};
SOLVE_MAP['class-2-expanded-story'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-expanded');
  if (v.mode === 'diff') {
    const vals = { hundreds: v.h * 100, tens: v.t * 10, ones: v.o };
    const [big, small] = [['hundreds', 'tens'], ['hundreds', 'ones'], ['tens', 'ones']][q.proof.givens.pairIdx];
    return String(vals[big] - vals[small]);
  }
  return String(v.h * 100 + v.t * 10 + v.o);
};

// 4. class-2-order-four
const BEACON_CODES = ['Alpha', 'Beta', 'Gamma', 'Delta'];
DRAFT_MAP['class-2-order-four'] = (family, grade, level, r) => {
  const baseH = r.int(2, 7);
  const candidates = new Set();
  while (candidates.size < 4) {
    const h = r.pick([baseH, baseH, baseH + 1, baseH - 1]);
    const d2 = r.int(1, 8);
    const d3 = r.int(1, 8);
    candidates.add(h * 100 + d2 * 10 + d3);
  }
  const nums = r.shuffle([...candidates]);
  const sorted = [...nums].sort((a, b) => a - b);
  const asks = level === 1
    ? [['smallest', 0], ['greatest', 3]]
    : [['second smallest', 1], ['second greatest', 2], ['smallest', 0], ['greatest', 3]];
  const [askLabel, rankIdx] = r.pick(asks);
  const askTens = level === 3 && r.pick([true, false]);
  const askBeacon = !askTens && r.pick([true, false]);
  const targetNum = sorted[rankIdx];
  const targetBeacon = BEACON_CODES[nums.indexOf(targetNum)];
  const answer = askTens ? Math.floor(targetNum / 10) % 10 : askBeacon ? targetBeacon : targetNum;
  const visual = {
    kind: 'v3-class-2-beacons', nums,
    description: `Four relay beacons: Alpha ${nums[0]}, Beta ${nums[1]}, Gamma ${nums[2]}, Delta ${nums[3]}.`,
  };
  const prompt = askTens
    ? `Order the four beacon numbers. What is the tens digit of the ${askLabel} number?`
    : askBeacon
      ? `Look at the four beacons. Which beacon has the ${askLabel} number?`
      : `Look at the four beacons. Which beacon number is the ${askLabel}?`;
  const otherRanks = rankIdx === 2 ? [3, 1, 0] : rankIdx === 1 ? [0, 2, 3] : rankIdx === 3 ? [2, 1, 0] : [1, 2, 3];
  const beaconWrongs = otherRanks.map(idx => [
    askBeacon ? BEACON_CODES[nums.indexOf(sorted[idx])] : String(sorted[idx]),
    'class-2-order-rank',
  ]);
  return {
    family, prompt, answer: String(answer),
    hint: askTens
      ? 'Sort the four beacon numbers from smallest to greatest first, then read the middle digit of that number.'
      : 'Compare the hundreds digits first, then the tens digits, then the ones digits.',
    explanation: `Compare hundreds and tens to sort from smallest to greatest: ${sorted.join(', ')}. The ${askLabel} number is ${targetNum} (${targetBeacon})${askTens ? `, and its middle (tens) digit is ${answer}` : ''}.`,
    proof: { family, givens: { rankIdx, askTens, askBeacon } },
    visual,
    choices: askTens
      ? numChoices(answer, [
        [Math.floor(targetNum / 100), 'place-shift'],
        [targetNum % 10, 'place-shift'],
        [Math.floor(sorted[3 - rankIdx] / 10) % 10, 'class-2-order-rank'],
        [Math.max(1, (answer + 2) % 10), 'face-value'],
        [Math.max(1, (answer + 5) % 10), 'class-2-order-rank'],
      ])
      : strChoices(String(answer), beaconWrongs),
  };
};
SOLVE_MAP['class-2-order-four'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-beacons');
  const sorted = [...v.nums].sort((a, b) => a - b);
  const target = sorted[q.proof.givens.rankIdx];
  if (q.proof.givens.askTens) return String(Math.floor(target / 10) % 10);
  if (q.proof.givens.askBeacon) return BEACON_CODES[v.nums.indexOf(target)];
  return String(target);
};

// 5. class-2-block-choice (picture choices)
const blockKey = (h, t, o) => `${plural(h, 'flat')}, ${plural(t, 'rod')}, ${plural(o, 'cube')}`;
const blockMini = (h, t, o) => ({
  kind: 'v3-class-2-block-mini', h, t, o,
  description: `${plural(h, 'hundred-flat')}, ${plural(t, 'ten-rod')} and ${plural(o, 'one-cube')}.`,
});
DRAFT_MAP['class-2-block-choice'] = (family, grade, level, r) => {
  const h = r.int(1, 4);
  const t = r.int(1, 5);
  const o = r.int(1, 6);
  if (h === t || t === o || h === o) throw new QuestionRetry('Distinct digits for block choice');
  const base = h * 100 + t * 10 + o;
  const add = level === 3 ? r.pick([10, 20, 100]) : 0;
  const target = base - add;
  const ansKey = blockKey(h, t, o);
  const prompt = add
    ? `A counter shows ${target}. Add ${add} more. Which block picture shows the new total?`
    : `Which base-ten block picture shows ${base}?`;
  const explanation = `${add ? `First add ${target} + ${add} = ${base}. ` : ''}Break ${base} into place values: ${plural(h, 'hundred-flat')} (${h * 100}), ${plural(t, 'ten-rod')} (${t * 10}), and ${plural(o, 'unit cube')} (${o}).`;
  return {
    family, prompt, answer: ansKey,
    hint: add
      ? 'Add to find the new 3-digit total first, then match hundreds to flats, tens to rods, and ones to cubes.'
      : 'Match the hundreds digit to flats, the tens digit to rods, and the ones digit to small cubes.',
    explanation,
    proof: { family, givens: { h, t, o } },
    choices: strChoices(ansKey, [
      [blockKey(h, o, t), 'place-shift', blockMini(h, o, t)],
      [blockKey(t, h, o), 'place-shift', blockMini(t, h, o)],
      [blockKey(o, t, h), 'place-shift', blockMini(o, t, h)],
      [blockKey(h + 1, t, o), 'class-2-block-count', blockMini(h + 1, t, o)],
    ], 4, blockMini(h, t, o)),
  };
};
SOLVE_MAP['class-2-block-choice'] = q => {
  checkOptionVisuals(q, 'v3-class-2-block-mini', v => blockKey(v.h, v.t, v.o));
  const { h, t, o } = q.proof.givens;
  return blockKey(h, t, o);
};

// ============================================================================
// CHAPTER 2: OPERATIONS
// ============================================================================

// 6. class-2-array-grid
DRAFT_MAP['class-2-array-grid'] = (family, grade, level, r) => {
  const rows = r.int(2, 5);
  const cols = r.int(3, level === 1 ? 6 : 8);
  const missing = level === 1 ? 0 : r.int(1, rows - 1);
  const item = r.pick(['solar cells', 'fuel pods', 'sample jars', 'beacon lights', 'core bolts']);
  const answer = rows * cols - missing;
  const visual = {
    kind: 'v3-class-2-array', rows, cols, missing, item,
    description: `An array of ${plural(rows, 'row')} and ${plural(cols, 'column')} of ${item}${missing ? `, with ${plural(missing, 'empty slot')} in the last row` : ''}.`,
  };
  const prompt = missing
    ? `A rack of ${item} has some empty dashed slots. How many ${item} are on the rack?`
    : `Look at the array of ${item}. How many ${item} are there in all?`;
  const hint = missing
    ? 'Multiply the number of rows by the number of slots in a full row, then subtract the empty dashed slots.'
    : 'Count how many rows there are and how many items are in each row, then multiply them together.';
  const explanation = missing
    ? `A full rack of ${plural(rows, 'row')} with ${cols} in each row holds ${rows} x ${cols} = ${rows * cols} slots. Subtract ${plural(missing, 'empty slot')}: ${rows * cols} - ${missing} = ${answer} ${item}.`
    : `Count ${plural(rows, 'equal row')} with ${cols} in each row and multiply: ${rows} x ${cols} = ${answer} ${item} in all.`;
  return {
    family, prompt, answer: String(answer),
    hint,
    explanation,
    proof: { family, givens: {} },
    visual,
    choices: numChoices(answer, [
      [rows + cols - missing, 'class-2-added-sides'],
      [rows * cols + (missing || cols), missing ? 'wrong-operation' : 'included-extra'],
      [rows * cols, 'ignored-condition'],
      [(rows - 1) * cols, 'missed-object'],
      [answer + 2, 'missed-object'],
      [Math.max(1, answer - 2), 'missed-object'],
    ]),
  };
};
SOLVE_MAP['class-2-array-grid'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-array');
  return String(v.rows * v.cols - v.missing);
};

// 7. class-2-jump-line
DRAFT_MAP['class-2-jump-line'] = (family, grade, level, r) => {
  const step = r.pick([2, 3, 4, 5, 10]);
  const jumps = r.int(3, 6);
  const askStep = level === 3 && r.pick([true, false]);
  const start = level === 1 ? r.int(0, 3) * step : r.int(2, 5) * step;
  const end = start + jumps * step;
  const answer = askStep ? step : end;
  const visual = {
    kind: 'v3-class-2-jumps', start, step, jumps, askStep, craft: 'Hopper',
    description: askStep
      ? `Number line from ${start} to ${end} showing ${plural(jumps, 'equal curved jump')}.`
      : `Number line starting at ${start} showing ${plural(jumps, 'equal curved jump')} of +${step} each.`,
  };
  const prompt = askStep
    ? `The hopper makes ${jumps} equal jumps from ${start} to ${end}. How long is ONE jump?`
    : `The hopper starts at ${start} and makes equal jumps on the number line. Where does it land at '?'?`;
  return {
    family, prompt, answer: String(answer),
    hint: askStep
      ? 'Subtract the start number from the landing number, then share that distance equally among the jumps.'
      : 'Multiply the number of curved jumps by the size of each jump, then add the starting number.',
    explanation: askStep
      ? `First find the total distance travelled: ${end} - ${start} = ${jumps * step}. Share ${jumps * step} equally into ${plural(jumps, 'jump')}: ${jumps * step} / ${jumps} = ${step} per jump.`
      : `Multiply ${plural(jumps, 'jump')} by ${step} each: ${jumps} x ${step} = ${jumps * step}. Add to the start ${start}: ${start} + ${jumps * step} = ${end}.`,
    proof: { family, givens: { askStep } },
    visual,
    choices: askStep
      ? numChoices(answer, [
        [jumps, 'class-2-jump-marks'],
        [end - start, 'missing-step'],
        [step + 1, 'class-2-jump-marks'],
        [Math.max(1, step - 1), 'class-2-jump-marks'],
        [step + 2, 'scale-interval'],
      ])
      : numChoices(answer, [
        [start + (jumps + 1) * step, 'class-2-jump-marks'],
        [start + (jumps - 1) * step, 'class-2-jump-marks'],
        [jumps * step, 'scale-zero'],
        [start + jumps + step, 'class-2-added-sides'],
        [end + step, 'class-2-jump-marks'],
      ]),
  };
};
SOLVE_MAP['class-2-jump-line'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-jumps');
  return String(v.askStep ? v.step : v.start + v.jumps * v.step);
};

// 8. class-2-regroup-story
DRAFT_MAP['class-2-regroup-story'] = (family, grade, level, r) => {
  const [item, sp] = r.pick([
    ['crystals', 'crystal'],
    ['fuel cells', 'fuel-cell'],
    ['crates', 'crate'],
    ['samples', 'asteroid'],
    ['beacons', 'satellite'],
  ]);
  const a = r.int(185, 385);
  const b = r.int(46, Math.min(168, a - 25));
  const c = level === 3 ? r.int(18, 65) : 0;
  const sub = level >= 2 && r.pick([true, false]);
  if ((a % 10) + (b % 10) < 10 && !sub) throw new QuestionRetry('Force regrouping');
  if (sub && (a % 10) >= (b % 10)) throw new QuestionRetry('Force borrowing');
  const answer = sub ? a - b + c : a + b - c;
  if (answer <= 0) throw new QuestionRetry('Keep positive story answer');
  const aO = a % 10;
  const bO = b % 10;
  const visual = {
    kind: 'v3-class-2-regroup', item, sp, a, b, c, sub,
    description: c
      ? (sub ? `Mission log: Start ${a} ${item}, Sent Out ${b}, Found ${c}.` : `Mission log: Packed ${a} ${item}, Added ${b}, Used ${c}.`)
      : (sub ? `Mission log: Had ${a} ${item} in store, Used ${b}.` : `Mission log: Monday ${a} ${item}, Tuesday + ${b}.`),
  };
  const prompt = level === 3
    ? `Look at the three-part ${item} log. How many ${item} are there now?`
    : (sub
      ? `Look at the ${item} log. After using that batch, how many ${item} are left?`
      : `Look at the ${item} log for Monday and Tuesday. How many ${item} were collected in all?`);
  const noRegroup = sub ? a - b + 10 + c : a + b - 10 - c;
  const explanation = level === 3
    ? (sub
      ? `Step 1: Subtract what was sent (${a} - ${b} = ${a - b} ${item}, borrowing 1 ten since ${aO} < ${bO}). Step 2: Add the ${c} found (${a - b} + ${c} = ${answer} ${item}).`
      : `Step 1: Add the two batches (${a} + ${b} = ${a + b} ${item}, carrying 1 ten since ${aO} + ${bO} = ${aO + bO}). Step 2: Subtract the ${c} used (${a + b} - ${c} = ${answer} ${item}).`)
    : (sub
      ? `In the ones column (${aO} < ${bO}), borrow 1 ten to make ${plural(aO + 10 - bO, 'one')}. Then subtract the tens and hundreds to get ${a} - ${b} = ${answer} ${item}.`
      : `Ones column: ${aO} + ${bO} = ${aO + bO}, so write ${(aO + bO) % 10} in the ones place and carry 1 ten. Adding the tens and hundreds gives ${a} + ${b} = ${answer} ${item}.`);
  return {
    family, prompt, answer: String(answer),
    hint: level === 3
      ? 'Solve the two steps from left to right: finish the first change before applying the second.'
      : 'Line up hundreds, tens and ones, and regroup 1 ten when the ones column crosses ten.',
    explanation,
    proof: { family, givens: {} },
    visual,
    choices: numChoices(answer, [
      [noRegroup, 'class-2-carry-borrow'],
      [answer + 10, 'class-2-carry-borrow'],
      [answer - 10, 'class-2-carry-borrow'],
      [sub ? a + b : Math.abs(a - b), 'wrong-operation'],
      [c ? (sub ? a - b : a + b) : answer + 100, c ? 'missing-step' : 'class-2-carry-borrow'],
    ]),
  };
};
SOLVE_MAP['class-2-regroup-story'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-regroup');
  return String(v.sub ? v.a - v.b + v.c : v.a + v.b - v.c);
};

// 9. class-2-missing-digit
DRAFT_MAP['class-2-missing-digit'] = (family, grade, level, r) => {
  const op = level === 3 && r.pick([true, false]) ? '-' : '+';
  const a1 = r.int(2, 6);
  const a2 = r.int(1, 8);
  const a3 = r.int(2, 8);
  const b1 = r.int(1, op === '-' ? a1 - 1 : 3);
  const b2 = r.int(1, 8);
  const b3 = r.int(2, 8);
  const top = a1 * 100 + a2 * 10 + a3;
  const bot = b1 * 100 + b2 * 10 + b3;
  if (op === '+' && a3 + b3 < 10) throw new QuestionRetry('Prefer carry in ones');
  if (op === '-' && a3 >= b3) throw new QuestionRetry('Prefer borrow in ones');
  const res = op === '+' ? top + bot : top - bot;
  if (res >= 1000 || res < 100) throw new QuestionRetry('Keep 3-digit result');
  const hideCol = r.pick([1, 2]); // 1 = tens of top, 2 = ones of bot
  const topStr = String(top);
  const botStr = String(bot);
  const resStr = String(res);
  const answer = Number(hideCol === 1 ? topStr[1] : botStr[2]);
  if (answer === 0) throw new QuestionRetry('Keep non-zero missing digit');
  const topMask = hideCol === 1 ? `${topStr[0]}?${topStr[2]}` : topStr;
  const botMask = hideCol === 2 ? `${botStr[0]}${botStr[1]}?` : botStr;
  const noCarryAns = (answer + (op === '+' ? 1 : 9)) % 10;
  const visual = {
    kind: 'v3-class-2-colsum', op, topMask, botMask, resStr,
    description: `Vertical ${op === '+' ? 'addition' : 'subtraction'}: ${topMask} ${op} ${botMask} = ${resStr}.`,
  };
  const rO = Number(resStr[2]);
  const rT = Number(resStr[1]);
  let explanation;
  if (op === '+') {
    if (hideCol === 2) {
      explanation = `The ones column ends in ${rO}, so ${a3} + ? must make ${rO + 10} (write ${rO}, carry 1 ten). ${rO + 10} - ${a3} = ${answer}, so the missing ones digit is ${answer}.`;
    } else {
      const need = rT - b2 - 1;
      explanation = `First add the ones: ${a3} + ${b3} = ${a3 + b3}, so write ${rO} and carry 1 ten. In the tens column, ? + ${b2} + 1 carried ten ends in ${rT}: ${need < 0 ? `${rT + 10}` : rT} - ${b2} - 1 = ${answer}, so ? = ${answer}.`;
    }
  } else if (hideCol === 2) {
    explanation = `The ones digit ${a3} is smaller than the ones digit being taken away, so borrow 1 ten to make ${a3 + 10}. ${a3 + 10} - ? = ${rO}, so ? = ${a3 + 10} - ${rO} = ${answer}.`;
  } else {
    const total = rT + b2 + 1;
    explanation = `Ones: borrow 1 ten, so ${a3 + 10} - ${b3} = ${rO}. Tens: ? lends 1 ten, so ? - 1 - ${b2} must give ${rT}${total >= 10 ? ` (after borrowing from the hundreds: ${rT} + ${b2} + 1 - 10 = ${answer})` : `: ${rT} + ${b2} + 1 = ${answer}`}.`;
  }
  const digitPairs = [
    [noCarryAns, 'class-2-carry-borrow'],
    [(answer + 2) % 10, 'class-2-carry-borrow'],
    [answer - 1, 'class-2-carry-borrow'],
    [answer + 1, 'class-2-carry-borrow'],
    [(answer + 5) % 10, 'wrong-operation'],
    [Number(resStr[hideCol]), 'face-value'],
    [answer - 2, 'class-2-carry-borrow'],
    [answer + 3, 'wrong-operation'],
  ].filter(([d]) => d >= 1 && d <= 9).map(([d, code]) => [String(d), code]);
  return {
    family,
    prompt: `Which digit belongs in the '?' box of this vertical ${op === '+' ? 'addition' : 'subtraction'}?`,
    answer: String(answer),
    hint: hideCol === 2
      ? 'Look at the ones column on the right and remember to regroup 1 ten.'
      : 'Check the ones column first to see if 1 ten was carried or borrowed into the tens column.',
    explanation,
    proof: { family, givens: {} },
    visual,
    choices: strChoices(String(answer), digitPairs),
  };
};
SOLVE_MAP['class-2-missing-digit'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-colsum');
  for (let d = 0; d <= 9; d++) {
    const t = Number(v.topMask.replace('?', String(d)));
    const b = Number(v.botMask.replace('?', String(d)));
    const expected = v.op === '+' ? t + b : t - b;
    if (expected === Number(v.resStr)) return String(d);
  }
  throw new Error('No valid digit solves vertical sum');
};

// 10. class-2-equalize-trays
DRAFT_MAP['class-2-equalize-trays'] = (family, grade, level, r) => {
  const [nameA, nameB] = r.shuffle(NAMES).slice(0, 2);
  const item = r.pick(['crystals', 'fuel cells', 'moon rocks', 'star badges']);
  const halfDiff = r.int(2, level === 1 ? 4 : 6);
  const low = r.int(4, 10);
  const high = low + halfDiff * 2;
  const askEach = level === 3 && r.pick([true, false]);
  const answer = askEach ? low + halfDiff : halfDiff;
  const visual = {
    kind: 'v3-class-2-trays', nameA, nameB, high, low, item,
    description: `${nameA}'s tray has ${high} ${item}. ${nameB}'s tray has ${low} ${item}.`,
  };
  const prompt = askEach
    ? `Look at ${nameA}'s and ${nameB}'s trays of ${item}. After they share equally, how many ${item} does each cadet have?`
    : `Look at the two trays of ${item}. How many must ${nameA} give ${nameB} so both trays have the same number?`;
  const hint = askEach
    ? 'Add both trays together and divide by 2 to find each cadet\'s equal share.'
    : 'Subtract to find the difference between the two trays, then give half of that difference.';
  const explanation = askEach
    ? `First add both trays: ${high} + ${low} = ${high + low} ${item}. Share equally between the 2 cadets: ${high + low} / 2 = ${answer} ${item} each.`
    : `First find the difference between the trays: ${high} - ${low} = ${halfDiff * 2}. Give half of ${halfDiff * 2} (${halfDiff}) so both trays have ${low + halfDiff}.`;
  return {
    family, prompt, answer: String(answer),
    hint,
    explanation,
    proof: { family, givens: { askEach } },
    visual,
    choices: numChoices(answer, [
      [askEach ? halfDiff : halfDiff * 2, 'class-2-full-diff'],
      [askEach ? high + low : low + halfDiff, 'wrong-operation'],
      [answer + 1, 'missed-object'],
      [Math.max(1, answer - 1), 'missed-object'],
      [high, 'ignored-change'],
    ]),
  };
};
SOLVE_MAP['class-2-equalize-trays'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-trays');
  const half = (v.high - v.low) / 2;
  return String(q.proof.givens.askEach ? v.low + half : half);
};

// ============================================================================
// CHAPTER 3: PATTERNS
// ============================================================================

// 11. class-2-bead-rule (picture choices)
const badgeKey = b => b.mark === 'none' ? `plain ${b.shape}` : `${b.shape} with a ${b.mark}`;
const badgeMini = b => ({
  kind: 'v3-class-2-badge-mini', shape: b.shape, mark: b.mark,
  description: badgeKey(b),
});
DRAFT_MAP['class-2-bead-rule'] = (family, grade, level, r) => {
  const shapes = r.shuffle(SHAPES).slice(0, 3);
  const marks = r.shuffle(MARKS);
  const unit = level === 1
    ? [
      { shape: shapes[0], mark: marks[0] },
      { shape: shapes[1], mark: marks[1] },
    ]
    : level === 2
      ? [
        { shape: shapes[0], mark: marks[0] },
        { shape: shapes[0], mark: marks[1] },
        { shape: shapes[1], mark: marks[2] },
      ]
      : [
        { shape: shapes[0], mark: marks[0] },
        { shape: shapes[1], mark: marks[1] },
        { shape: shapes[2], mark: marks[0] },
        { shape: shapes[1], mark: marks[2] },
      ];
  const len = unit.length * 2 + 1;
  const gapIndex = level === 1 ? r.pick([unit.length, len - 1]) : r.int(2, len - 2);
  const row = Array.from({ length: len }, (_, i) => i === gapIndex ? null : unit[i % unit.length]);
  const ans = unit[gapIndex % unit.length];
  const visual = {
    kind: 'v3-class-2-beads', row, gapIndex,
    description: `Repeating badge row: ${row.map(b => b ? badgeKey(b) : 'question mark').join(', ')}.`,
  };
  const alts = [
    { shape: ans.shape, mark: marks.find(m => m !== ans.mark) },
    { shape: shapes.find(s => s !== ans.shape), mark: ans.mark },
    unit[(gapIndex + 1) % unit.length],
    { shape: shapes[2], mark: marks[2] },
  ];
  return {
    family,
    prompt: `Which badge belongs in the '?' box at position ${gapIndex + 1}?`,
    answer: badgeKey(ans),
    hint: 'Find how many badges make one repeating group, then check both the outer shape and inner mark.',
    explanation: `The strip repeats a group of ${plural(unit.length, 'badge')}: ${unit.map(badgeKey).join(', ')}. Position ${gapIndex + 1} matches a ${badgeKey(ans)}.`,
    proof: { family, givens: { unit, gapIndex } },
    visual,
    choices: strChoices(badgeKey(ans), alts.map((b, idx) => [badgeKey(b), idx === 0 ? 'ignored-mark' : 'repeat-unit', badgeMini(b)]), 4, badgeMini(ans)),
  };
};
SOLVE_MAP['class-2-bead-rule'] = q => {
  expectKind(q.visual, 'v3-class-2-beads');
  checkOptionVisuals(q, 'v3-class-2-badge-mini', badgeKey);
  const { unit, gapIndex } = q.proof.givens;
  return badgeKey(unit[gapIndex % unit.length]);
};

// 12. class-2-growing-tiles
DRAFT_MAP['class-2-growing-tiles'] = (family, grade, level, r) => {
  const base = r.int(1, 6);
  const add = r.int(2, 6);
  const askStep = level === 3 && r.pick([true, false]);
  const targetStep = level === 1 ? r.pick([4, 5]) : level === 2 ? r.pick([5, 6, 7]) : r.pick([6, 7, 8]);
  const steps = [1, 2, 3].map(s => base + (s - 1) * add);
  const tiles = base + (targetStep - 1) * add;
  const answer = askStep ? targetStep : tiles;
  const visual = {
    kind: 'v3-class-2-growing', steps, add,
    description: `Growing tile pattern: Step One shows ${plural(steps[0], 'tile')}, Step Two shows ${plural(steps[1], 'tile')}, Step Three shows ${plural(steps[2], 'tile')}.`,
  };
  return {
    family,
    prompt: askStep
      ? `The tile pattern keeps growing in the same way. Which step has ${tiles} tiles?`
      : `The tile pattern keeps growing in the same way. How many tiles will Step ${targetStep} have?`,
    answer: String(answer),
    hint: 'Subtract Step One from Step Two to find how many new tiles are added at each step.',
    explanation: askStep
      ? `Each step adds ${steps[1]} - ${steps[0]} = ${add} tiles. From ${steps[0]} tiles, ${tiles} - ${steps[0]} = ${tiles - steps[0]} more tiles means ${(tiles - steps[0]) / add} steps after Step One, so it is Step ${targetStep}.`
      : `Each step adds ${steps[1]} - ${steps[0]} = ${add} tiles. Step ${targetStep} is ${targetStep - 1} steps after Step One: ${steps[0]} + ${targetStep - 1} x ${add} = ${tiles} tiles.`,
    proof: { family, givens: { targetStep, askStep } },
    visual,
    choices: askStep
      ? numChoices(answer, [
        [targetStep - 1, 'class-2-tile-step'],
        [targetStep + 1, 'class-2-tile-step'],
        [Math.round(tiles / add), 'wrong-operation'],
        [targetStep - 2, 'class-2-tile-step'],
        [targetStep + 2, 'class-2-tile-step'],
      ])
      : numChoices(answer, [
        [answer - add, 'class-2-tile-step'],
        [answer + add, 'class-2-tile-step'],
        [steps[2] + targetStep, 'wrong-operation'],
        [steps[0] * targetStep, 'class-2-tile-step'],
        [answer + 1, 'missed-object'],
      ]),
  };
};
SOLVE_MAP['class-2-growing-tiles'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-growing');
  const { targetStep, askStep } = q.proof.givens;
  return String(askStep ? targetStep : v.steps[0] + (targetStep - 1) * v.add);
};

// 13. class-2-function-machine
DRAFT_MAP['class-2-function-machine'] = (family, grade, level, r) => {
  const mult = r.pick([2, 3, 4, 5, 10]);
  const offset = level === 1 ? r.int(3, 15) : r.int(2, 9);
  const input = r.int(3, 9);
  const mode = level === 1 ? 'add' : level === 2 ? 'two-step' : 'reverse';
  const ruleText = mode === 'add' ? `+ ${offset} then - 2` : `x ${mult} then + ${offset}`;
  const output = mode === 'add' ? input + offset - 2 : input * mult + offset;
  const answer = mode === 'reverse' ? input : output;
  const shownIn = mode === 'reverse' ? '?' : String(input);
  const shownOut = mode === 'reverse' ? String(output) : '?';
  const visual = {
    kind: 'v3-class-2-machine', shownIn, ruleText, shownOut,
    description: `Number machine: Input ${shownIn} goes into rule "${ruleText}" and gives Output ${shownOut}.`,
  };
  const prompt = mode === 'reverse'
    ? `The rule machine gives the OUT number shown. What IN number at '?' went into it?`
    : `The IN number enters the rule machine. What number comes OUT at '?'?`;
  return {
    family, prompt, answer: String(answer),
    hint: mode === 'reverse'
      ? 'Work backwards from the OUT number: undo the addition first, then divide.'
      : 'Apply the first part of the rule to the IN number, then apply the second part to that result.',
    explanation: mode === 'reverse'
      ? `Work backwards from ${output}: first undo + ${offset} (${output} - ${offset} = ${output - offset}), then undo x ${mult} (${output - offset} / ${mult} = ${input}).`
      : mode === 'add'
        ? `Start with ${input}, add ${offset} to get ${input + offset}, then subtract 2 to get ${output}.`
        : `Start with ${input}, multiply by ${mult} to get ${input * mult}, then add ${offset} to get ${output}.`,
    proof: { family, givens: { mode, input, mult, offset, output } },
    visual,
    choices: numChoices(answer, [
      [mode === 'reverse' ? output - offset : input * mult, 'missing-step'],
      [mode === 'reverse' ? Math.floor(output / mult) + offset : (input + offset) * mult, 'reversed-operation'],
      [answer + mult, 'wrong-operation'],
      [Math.max(1, answer - 2), 'missing-step'],
      [answer + offset, 'wrong-operation'],
    ]),
  };
};
SOLVE_MAP['class-2-function-machine'] = q => {
  expectKind(q.visual, 'v3-class-2-machine');
  const { mode, input, mult, offset } = q.proof.givens;
  if (mode === 'reverse') return String(input);
  return String(mode === 'add' ? input + offset - 2 : input * mult + offset);
};

// 14. class-2-matrix-cell (picture choices)
DRAFT_MAP['class-2-matrix-cell'] = (family, grade, level, r) => {
  const rowShapes = r.shuffle(SHAPES).slice(0, 3);
  const colMarks = r.shuffle(MARKS);
  const grid = rowShapes.map(s => colMarks.map(m => ({ shape: s, mark: m })));
  const missR = r.int(1, 2);
  const missC = r.int(1, 2);
  const ans = grid[missR][missC];
  const visual = {
    kind: 'v3-class-2-matrix', grid, missR, missC,
    description: `3 by 3 badge matrix with a question mark at row ${missR + 1}, column ${missC + 1}.`,
  };
  const alts = [
    { shape: ans.shape, mark: colMarks[(missC + 1) % 3] },
    { shape: rowShapes[(missR + 1) % 3], mark: ans.mark },
    { shape: rowShapes[(missR + 2) % 3], mark: colMarks[(missC + 2) % 3] },
    { shape: SHAPES.find(s => !rowShapes.includes(s)), mark: ans.mark },
  ];
  return {
    family,
    prompt: `Which badge fits the '?' at row ${missR + 1}, column ${missC + 1} of the 3 by 3 badge grid?`,
    answer: badgeKey(ans),
    hint: 'Check across the row to find the outer shape, then check down the column to find the inner mark.',
    explanation: `Across row ${missR + 1} every badge has a ${ans.shape} shape, and down column ${missC + 1} every badge has ${ans.mark === 'none' ? 'no inner mark' : `a ${ans.mark}`}, giving a ${badgeKey(ans)}.`,
    proof: { family, givens: { ans } },
    visual,
    choices: strChoices(badgeKey(ans), alts.map((b, i) => [badgeKey(b), i === 0 ? 'ignored-mark' : 'sorting-rule', badgeMini(b)]), 4, badgeMini(ans)),
  };
};
SOLVE_MAP['class-2-matrix-cell'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-matrix');
  checkOptionVisuals(q, 'v3-class-2-badge-mini', badgeKey);
  return badgeKey(v.grid[v.missR][v.missC]);
};

// 15. class-2-story-step
DRAFT_MAP['class-2-story-step'] = (family, grade, level, r) => {
  const [item, sp] = r.pick([
    ['signals', 'satellite'],
    ['probes', 'rover'],
    ['crystals', 'crystal'],
    ['comets', 'comet'],
  ]);
  const start = r.int(15, 65);
  const step1 = r.pick([3, 4, 5, 10, 20]);
  const step2 = level === 3 ? r.pick([2, 6, 8]) : step1;
  const dir = level === 2 && r.pick([true, false]) ? -1 : 1;
  const seq = [start];
  for (let i = 1; i < 5; i++) {
    const delta = (i % 2 === 1 ? step1 : step2) * dir;
    seq.push(seq[i - 1] + delta);
  }
  if (seq.some(n => n <= 5)) throw new QuestionRetry('Keep positive sequence');
  const answer = seq[4];
  const sign = dir > 0 ? '+' : '-';
  const visual = {
    kind: 'v3-class-2-storystep', sp, seq: seq.slice(0, 4),
    description: `Hourly log: Hour 1 = ${seq[0]}, Hour 2 = ${seq[1]}, Hour 3 = ${seq[2]}, Hour 4 = ${seq[3]}, Hour 5 = ?.`,
  };
  return {
    family,
    prompt: `The hourly ${item} log follows a pattern. What number goes in Hour 5 at '?'?`,
    answer: String(answer),
    hint: level === 3 && step1 !== step2 ? 'Check the jump between each pair of hourly cards: two jump sizes alternate.' : 'Subtract neighbouring hourly cards to find how much the count changes each hour.',
    explanation: step1 === step2
      ? `Each step changes by ${sign}${step1} (${seq[0]} ${sign} ${step1} = ${seq[1]}). Applying ${sign}${step1} to ${seq[3]} gives ${answer}.`
      : `The rule alternates ${sign}${step1} and ${sign}${step2} (${seq[0]} -> ${seq[1]} -> ${seq[2]} -> ${seq[3]}). Next apply ${sign}${step2} to ${seq[3]} to get ${answer}.`,
    proof: { family, givens: {} },
    visual,
    choices: numChoices(answer, [
      [seq[3] + step1 * dir + (step1 === step2 ? dir * 2 : 0), 'repeat-unit'],
      [seq[3] - step2 * dir, 'wrong-operation'],
      [answer + step1, 'repeat-unit'],
      [Math.max(1, answer - step1), 'repeat-unit'],
    ]),
  };
};
SOLVE_MAP['class-2-story-step'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-storystep');
  const d2 = v.seq[2] - v.seq[1];
  return String(v.seq[3] + d2);
};

// ============================================================================
// CHAPTER 4: GEOMETRY
// ============================================================================

// 16. class-2-hidden-shapes
DRAFT_MAP['class-2-hidden-shapes'] = (family, grade, level, r) => {
  const portholes = r.int(2, 5); // circles
  const fins = r.pick([2, 4]); // triangles
  const panels = r.int(2, 4); // rectangles
  const nose = 1; // triangle
  const wheels = r.pick([0, 2, 4]); // circles
  const counts = {
    circle: portholes + wheels,
    triangle: fins + nose,
    rectangle: panels + 1,
  };
  const target = r.pick(['circle', 'triangle', 'rectangle']);
  const answer = counts[target];
  const visual = {
    kind: 'v3-class-2-craft-shapes', portholes, fins, panels, wheels,
    description: `Rocket blueprint with 1 rectangular hull, ${plural(panels, 'inner rectangular panel')}, 1 triangular nose cone, ${plural(fins, 'triangular fin')}, ${plural(portholes, 'circular porthole')}${wheels ? `, and ${plural(wheels, 'circular wheel')}` : ''}.`,
  };
  const partBreakdown = target === 'circle'
    ? `${plural(portholes, 'porthole')}${wheels ? ` and ${plural(wheels, 'wheel')}` : ''} (${portholes}${wheels ? ` + ${wheels}` : ''} = ${answer})`
    : target === 'triangle'
      ? `1 nose cone and ${plural(fins, 'fin')} (1 + ${fins} = ${answer})`
      : `1 large outer hull and ${plural(panels, 'smaller inner panel')} (1 + ${panels} = ${answer})`;
  const scanParts = target === 'circle'
    ? 'the portholes and any wheels'
    : target === 'triangle'
      ? 'the nose cone and the fins'
      : 'the outer hull and the inner panels';
  return {
    family,
    prompt: `How many ${target}s are in this rocket blueprint in total?`,
    answer: String(answer),
    hint: `Scan ${scanParts} and count every ${target}.`,
    explanation: `Count each ${target} by part: ${partBreakdown}, giving ${plural(answer, target)} in all.`,
    proof: { family, givens: { target } },
    visual,
    choices: numChoices(answer, [
      [answer - 1, 'missed-object'],
      [answer + 1, 'included-extra'],
      [answer + 2, 'included-extra'],
      [counts.circle + counts.triangle, 'included-extra'],
      [Math.max(1, answer - 2), 'missed-object'],
    ]),
  };
};
SOLVE_MAP['class-2-hidden-shapes'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-craft-shapes');
  const counts = { circle: v.portholes + v.wheels, triangle: v.fins + 1, rectangle: v.panels + 1 };
  return String(counts[q.proof.givens.target]);
};

// 17. class-2-symmetry-half (picture choices)
const symKey = rows => `rows ${rows.join(', ')}`;
const symMini = rows => ({
  kind: 'v3-class-2-sym-mini', rows,
  description: `Right-half grid with row widths ${rows.join(', ')} from the mirror line.`,
});
DRAFT_MAP['class-2-symmetry-half'] = (family, grade, level, r) => {
  const w1 = r.int(1, 3);
  const w2 = r.int(1, 3);
  const w3 = r.int(1, 3);
  const w4 = r.int(1, 3);
  const rows = [w1, w2, w3, w4];
  if (w1 === w4 && w2 === w3) throw new QuestionRetry('Avoid upside-down symmetry so flip distractor is distinct');
  if (new Set(rows).size < 2) throw new QuestionRetry('Need varied row widths');
  const visual = {
    kind: 'v3-class-2-sym-left', rows,
    description: `Left half of a symmetric shield against a vertical dashed mirror line.`,
  };
  const inv = rows.map(w => 4 - w);
  const flipUD = [...rows].reverse();
  const changed = [rows[0], Math.max(1, (rows[1] % 3) + 1), rows[2], rows[3]];
  return {
    family,
    prompt: `The dashed line is a mirror line for this shield. Which right-hand half completes it?`,
    answer: symKey(rows),
    hint: 'Count how many green squares touch the dashed mirror line in each row from top to bottom.',
    explanation: `In a mirror reflection, each row on the right stretches the same number of squares from the dashed line: ${rows.join(', ')} from top to bottom.`,
    proof: { family, givens: { rows } },
    visual,
    choices: strChoices(symKey(rows), [
      [symKey(flipUD), 'wrong-transform', symMini(flipUD)],
      [symKey(inv), 'wrong-transform', symMini(inv)],
      [symKey(changed), 'ignored-mark', symMini(changed)],
      [symKey([rows[1], rows[0], rows[3], rows[2]]), 'wrong-transform', symMini([rows[1], rows[0], rows[3], rows[2]])],
    ], 4, symMini(rows)),
  };
};
SOLVE_MAP['class-2-symmetry-half'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-sym-left');
  checkOptionVisuals(q, 'v3-class-2-sym-mini', m => symKey(m.rows));
  return symKey(v.rows);
};

// 18. class-2-cube-stack
DRAFT_MAP['class-2-cube-stack'] = (family, grade, level, r) => {
  const cols = [
    r.int(1, 3),
    r.int(2, 4),
    r.int(1, 3),
    ...(level >= 2 ? [r.int(1, 3)] : []),
  ];
  const total = sum(cols);
  const targetBox = level === 3 ? 12 : 0;
  const answer = targetBox ? targetBox - total : total;
  if (answer <= 0) throw new QuestionRetry('Keep positive cube count');
  const visual = {
    kind: 'v3-class-2-cubes', cols,
    description: `Stack of unit cubes with ${plural(cols.length, 'column')}.`,
  };
  const prompt = targetBox
    ? `Look at the cube stack. How many MORE unit cubes are needed to make ${targetBox} cubes in all?`
    : `Count all the unit cubes in this stack of ${plural(cols.length, 'column')}.`;
  const hint = targetBox
    ? 'Add the heights of all columns first, then subtract that total from twelve.'
    : 'Count the full height of every column from the floor up and add them together.';
  return {
    family, prompt, answer: String(answer),
    hint,
    explanation: `First add the column heights from left to right: ${cols.join(' + ')} = ${plural(total, 'cube')}${targetBox ? `. Then subtract from ${targetBox}: ${targetBox} - ${total} = ${plural(answer, 'more cube', 'more cubes')} needed` : ' in total'}.`,
    proof: { family, givens: { targetBox } },
    visual,
    choices: numChoices(answer, [
      [targetBox ? total : cols.length, targetBox ? 'missing-step' : 'class-2-hidden-cube'],
      [answer - 1, 'class-2-hidden-cube'],
      [answer + 1, 'included-extra'],
      [answer + 2, 'included-extra'],
      [Math.max(1, answer - 2), 'class-2-hidden-cube'],
    ]),
  };
};
SOLVE_MAP['class-2-cube-stack'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-cubes');
  const total = sum(v.cols);
  return String(q.proof.givens.targetBox ? q.proof.givens.targetBox - total : total);
};

// 19. class-2-grid-perimeter
DRAFT_MAP['class-2-grid-perimeter'] = (family, grade, level, r) => {
  const w = r.int(2, 8);
  const h = r.int(2, 5);
  const extra = level >= 2 ? r.int(1, 2) : 0;
  const cells = Array.from({ length: h + 1 }, (_, rr) =>
    Array.from({ length: w + 1 }, (_, cc) => (rr < h && cc < w) || (rr === h && cc < extra) ? 1 : 0));
  let perim = 0;
  let area = 0;
  for (let rr = 0; rr <= h; rr++) {
    for (let cc = 0; cc <= w; cc++) {
      if (!cells[rr][cc]) continue;
      area++;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!cells[rr + dr]?.[cc + dc]) perim++;
      }
    }
  }
  if (perim === area) throw new QuestionRetry('Keep perimeter distinct from area');
  const visual = {
    kind: 'v3-class-2-perim', cells, w, h, extra,
    description: `Shaded grid shape made of ${plural(h, 'full row')} of ${w} squares${extra ? ` plus ${plural(extra, 'extra square')} on the bottom row` : ''}.`,
  };
  return {
    family,
    prompt: `Look at the shaded shape on the 1 m grid. What is its outside perimeter in metres?`,
    answer: String(perim),
    hint: 'Trace all the way around the outer boundary of the green shape and count 1 m for each outside cell edge.',
    explanation: extra
      ? `The ${w} by ${h} block has ${w} + ${h} + ${w} + ${h} = ${2 * (w + h)} m around it; the ${plural(extra, 'extra square')} on the bottom row ${extra === 1 ? 'adds' : 'add'} 2 m in all, so ${2 * (w + h)} + 2 = ${perim} m.`
      : `Add the top (${w} m), right (${h} m), bottom (${w} m), and left (${h} m) sides: ${w} + ${h} + ${w} + ${h} = ${perim} m.`,
    proof: { family, givens: { perim } },
    visual,
    choices: numChoices(perim, [
      [area, 'area-perimeter'],
      [area * 4, 'internal-edges'],
      [perim - 2, 'missed-object'],
      [perim + 2, 'internal-edges'],
      [w + h + extra, 'missing-step'],
    ]),
  };
};
SOLVE_MAP['class-2-grid-perimeter'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-perim');
  let perim = 0;
  for (let rr = 0; rr < v.cells.length; rr++) {
    for (let cc = 0; cc < v.cells[0].length; cc++) {
      if (!v.cells[rr][cc]) continue;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!v.cells[rr + dr]?.[cc + dc]) perim++;
      }
    }
  }
  return String(perim);
};

// 20. class-2-shape-riddle
const SOLID_FACTS = {
  cube: { edges: 12, corners: 8, flatFaces: 6, curvedSurfaces: 0 },
  cuboid: { edges: 12, corners: 8, flatFaces: 6, curvedSurfaces: 0 },
  cylinder: { flatFaces: 2, curvedSurfaces: 1 },
  cone: { flatFaces: 1, curvedSurfaces: 1 },
  sphere: { flatFaces: 0, curvedSurfaces: 1 },
};
const PROP_LABELS = {
  edges: ['straight edge', 'straight edges'],
  corners: ['corner', 'corners'],
  flatFaces: ['flat face', 'flat faces'],
  curvedSurfaces: ['curved surface', 'curved surfaces'],
};
DRAFT_MAP['class-2-shape-riddle'] = (family, grade, level, r) => {
  const prop = r.pick(['edges', 'corners', 'flatFaces', 'curvedSurfaces']);
  const boxPool = ['cube', 'cuboid'];
  const pool = prop === 'flatFaces' ? ['cube', 'cuboid', 'cylinder', 'cone', 'sphere']
    : prop === 'curvedSurfaces' ? ['cylinder', 'cone', 'sphere', 'cube']
      : boxPool;
  const shapeA = r.pick(pool.filter(s => s !== 'sphere' || prop === 'curvedSurfaces'));
  const countA = r.int(2, 5);
  const shapeB = level >= 2 ? r.pick(pool.filter(s => s !== shapeA)) : null;
  const countB = shapeB ? r.int(1, 3) : 0;
  const perA = SOLID_FACTS[shapeA][prop];
  const perB = shapeB ? SOLID_FACTS[shapeB][prop] : 0;
  const answer = countA * perA + countB * perB;
  if (answer <= 0) throw new QuestionRetry('Keep a positive riddle total');
  const [labelOne, labelMany] = PROP_LABELS[prop];
  const propLabel = labelMany;
  const visual = {
    kind: 'v3-class-2-solids', shapeA, countA, shapeB, countB,
    description: `Solid models on a tray: ${plural(countA, shapeA)}${shapeB ? ` and ${plural(countB, shapeB)}` : ''}.`,
  };
  const prompt = shapeB
    ? `A tray holds ${plural(countA, shapeA)} and ${plural(countB, shapeB)}. How many ${propLabel} do all these solids have in total?`
    : `A tray holds ${plural(countA, shapeA)}. How many ${propLabel} do they have in all?`;
  const per = n => plural(n, labelOne, labelMany);
  return {
    family, prompt, answer: String(answer),
    hint: shapeB
      ? `Find how many ${propLabel} each type of solid has, multiply by its count, and add the two totals.`
      : `Find how many ${propLabel} a single ${shapeA} has, then multiply by the number of ${shapeA}s.`,
    explanation: `Each ${shapeA} has ${per(perA)} (${countA} x ${perA} = ${countA * perA})${shapeB ? ` and each ${shapeB} has ${per(perB)} (${countB} x ${perB} = ${countB * perB})` : ''}, giving ${answer} ${answer === 1 ? labelOne : labelMany} in all.`,
    proof: { family, givens: { shapeA, countA, shapeB, countB, prop } },
    visual,
    choices: numChoices(answer, [
      [perA + perB, 'missing-step'],
      [answer + perA, 'included-extra'],
      [Math.max(1, answer - 2), 'ignored-condition'],
      [answer + 4, 'ignored-condition'],
      [countA + countB, 'wrong-operation'],
    ]),
  };
};
SOLVE_MAP['class-2-shape-riddle'] = q => {
  expectKind(q.visual, 'v3-class-2-solids');
  const { shapeA, countA, shapeB, countB, prop } = q.proof.givens;
  return String(countA * SOLID_FACTS[shapeA][prop] + (shapeB ? countB * SOLID_FACTS[shapeB][prop] : 0));
};

// ============================================================================
// CHAPTER 5: MEASUREMENT
// ============================================================================

// 21. class-2-clip-length
DRAFT_MAP['class-2-clip-length'] = (family, grade, level, r) => {
  const unitVal = level === 1 ? 1 : r.pick([2, 3, 5]);
  const aBlocks = r.int(5, level === 1 ? 10 : 9);
  const bBlocks = r.int(2, aBlocks - 2);
  const ask = r.pick(level === 1 ? ['one', 'diff'] : level === 2 ? ['one', 'diff', 'shorter'] : ['sum', 'diff', 'shorter']);
  const askSum = ask === 'sum';
  const lenA = aBlocks * unitVal;
  const lenB = bBlocks * unitVal;
  const answer = ask === 'one' ? lenA : askSum ? lenA + lenB : lenA - lenB;
  const [itemA, itemB] = r.shuffle(['Wrench', 'Antenna', 'Probe Rod', 'Solar Bar', 'Laser Tube']).slice(0, 2);
  const visual = {
    kind: 'v3-class-2-clips', itemA, itemB, aBlocks, bBlocks, unitVal,
    description: `${itemA} spans ${plural(aBlocks, 'block')} and ${itemB} spans ${plural(bBlocks, 'block')}. Each block is ${unitVal} cm.`,
  };
  const prompt = ask === 'one'
    ? `Each block is ${unitVal} cm long. How long is the ${itemA} in cm?`
    : askSum
      ? `Look at the block measurement of the ${itemA} and the ${itemB}. What is their combined length in cm?`
      : ask === 'shorter'
        ? `Look at the block measurement. How many cm shorter is the ${itemB} than the ${itemA}?`
        : `Look at the block measurement. How many cm longer is the ${itemA} than the ${itemB}?`;
  return {
    family, prompt, answer: String(answer),
    hint: 'Count the measuring blocks for each object, multiply by the cm per block, and then combine.',
    explanation: ask === 'one'
      ? `The ${itemA} spans ${aBlocks} blocks of ${unitVal} cm each: ${aBlocks} x ${unitVal} = ${answer} cm.`
      : `${itemA} is ${aBlocks} x ${unitVal} = ${lenA} cm and ${itemB} is ${bBlocks} x ${unitVal} = ${lenB} cm. ${askSum ? `Adding ${lenA} + ${lenB}` : `Subtracting ${lenA} - ${lenB}`} gives ${answer} cm.`,
    proof: { family, givens: { askSum, ask } },
    visual,
    choices: numChoices(answer, [
      [ask === 'one' ? aBlocks : askSum ? aBlocks + bBlocks : aBlocks - bBlocks, 'scale-interval'],
      [ask === 'one' ? lenB : askSum ? lenA - lenB : lenA + lenB, 'wrong-operation'],
      [ask === 'one' ? (aBlocks + 1) * unitVal : lenA, ask === 'one' ? 'counted-endpoints' : 'missing-step'],
      [answer + unitVal, 'counted-endpoints'],
      [Math.max(1, answer - unitVal), 'counted-endpoints'],
    ]),
  };
};
SOLVE_MAP['class-2-clip-length'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-clips');
  const { ask, askSum } = q.proof.givens;
  if (ask === 'one') return String(v.aBlocks * v.unitVal);
  return String((askSum ? v.aBlocks + v.bBlocks : v.aBlocks - v.bBlocks) * v.unitVal);
};

// 22. class-2-pan-compare
DRAFT_MAP['class-2-pan-compare'] = (family, grade, level, r) => {
  const items = r.shuffle(['Cube', 'Orb', 'Cone', 'Pod', 'Core', 'Gem']).slice(0, 3);
  const swapPans = r.pick([true, false]);
  const asks = level === 1
    ? [['heaviest', 0, 'heaviest'], ['lightest', 2, 'lightest']]
    : [['heaviest', 0, 'heaviest'], ['lightest', 2, 'lightest'], ['middle weight', 1, 'middle'], ['heavier', 0, 'above'], ['lighter', 2, 'below']];
  const [askWord, askIdx, askKind] = r.pick(asks);
  const answer = items[askIdx];
  const visual = {
    kind: 'v3-class-2-pans', items, swapPans,
    description: `Scale A shows ${items[0]} heavier than ${items[1]}. Scale B shows ${items[1]} heavier than ${items[2]}.`,
  };
  const prompt = askKind === 'above'
    ? `A heavier pan tips DOWN. Which object is heavier than the ${items[1]}?`
    : askKind === 'below'
      ? `A heavier pan tips DOWN. Which object is lighter than the ${items[1]}?`
      : `A heavier pan tips DOWN. Look at the two balance scales. Which object is the ${askWord}?`;
  return {
    family,
    prompt,
    answer,
    hint: 'The pan that sits lower holds the heavier object. Chain Scale A and Scale B together.',
    explanation: `On Scale A, ${items[0]} tips down below ${items[1]}. On Scale B, ${items[1]} tips down below ${items[2]}. From heaviest to lightest: ${items[0]}, ${items[1]}, ${items[2]}, so ${answer} is the one that is ${askKind === 'above' ? `heavier than the ${items[1]}` : askKind === 'below' ? `lighter than the ${items[1]}` : `the ${askWord}`}.`,
    proof: { family, givens: { askIdx } },
    visual,
    choices: strChoices(answer, [
      ...items.filter(x => x !== answer).map(x => [x, 'class-2-heavier-side']),
      ['Cannot tell', 'ignored-condition'],
    ]),
  };
};
SOLVE_MAP['class-2-pan-compare'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-pans');
  return v.items[q.proof.givens.askIdx];
};

// 23. class-2-jug-pour
DRAFT_MAP['class-2-jug-pour'] = (family, grade, level, r) => {
  const cup = r.pick([2, 3, 4, 5]);
  const totalJugs = r.int(5, 10);
  const mode = level === 1 ? r.pick(['jugs-empty', 'litres-poured'])
    : level === 2 ? r.pick(['jugs-more', 'litres-more'])
      : r.pick(['jugs-more', 'litres-more', 'after-pour']);
  const already = mode === 'jugs-empty' || mode === 'litres-poured' ? 0 : r.int(1, totalJugs - 3);
  const poured = mode === 'litres-poured' ? r.int(2, totalJugs - 1) : mode === 'after-pour' ? r.int(1, totalJugs - already - 1) : 0;
  const tankCap = totalJugs * cup;
  const currentVol = already * cup;
  const liquid = r.pick(['water', 'coolant', 'fuel', 'juice']);
  const answer = mode === 'jugs-empty' ? totalJugs
    : mode === 'litres-poured' ? poured * cup
      : mode === 'jugs-more' ? totalJugs - already
        : mode === 'litres-more' ? tankCap - currentVol
          : tankCap - currentVol - poured * cup;
  const visual = {
    kind: 'v3-class-2-jugs', cup, tankCap, currentVol, liquid,
    description: `Small jug holds ${cup} L. Large tank holds ${tankCap} L and currently shows ${currentVol} L of ${liquid}.`,
  };
  const prompt = mode === 'jugs-empty'
    ? `The empty tank holds ${tankCap} L. Each jug holds ${cup} L of ${liquid}. How many full jugs fill the tank?`
    : mode === 'litres-poured'
      ? `Each jug holds ${cup} L. ${poured} full jugs of ${liquid} are poured into the empty tank. How many litres is that?`
      : mode === 'jugs-more'
        ? `The tank already has some ${liquid}. How many MORE full jugs are needed to fill the tank to the top?`
        : mode === 'litres-more'
          ? `The tank already has some ${liquid}. How many more litres are needed to fill the tank to the top?`
          : `The tank already has some ${liquid}. ${plural(poured, 'more full jug')} ${poured === 1 ? 'is' : 'are'} poured in. How many litres are still needed to fill the tank?`;
  const space = tankCap - currentVol;
  const explanation = mode === 'jugs-empty'
    ? `Divide the ${tankCap} L tank capacity by ${cup} L in each small jug: ${tankCap} / ${cup} = ${plural(answer, 'full jug')}.`
    : mode === 'litres-poured'
      ? `Each jug adds ${cup} L, so ${plural(poured, 'jug')} ${poured === 1 ? 'adds' : 'add'} ${poured} x ${cup} = ${answer} L.`
      : mode === 'jugs-more'
        ? `First find the empty space in the tank: ${tankCap} - ${currentVol} = ${space} L. Divide by ${cup} L per jug: ${space} / ${cup} = ${plural(answer, 'jug')}.`
        : mode === 'litres-more'
          ? `The tank holds ${tankCap} L and already has ${currentVol} L, so ${tankCap} - ${currentVol} = ${answer} L more are needed.`
          : `${plural(poured, 'jug')} ${poured === 1 ? 'adds' : 'add'} ${poured} x ${cup} = ${poured * cup} L, so the tank has ${currentVol} + ${poured * cup} = ${currentVol + poured * cup} L. Still needed: ${tankCap} - ${currentVol + poured * cup} = ${answer} L.`;
  return {
    family, prompt, answer: String(answer),
    hint: mode === 'jugs-empty'
      ? 'Divide the full tank capacity by the capacity of one small jug.'
      : mode === 'litres-poured'
        ? 'Multiply the number of jugs by the litres in one jug.'
        : mode === 'after-pour'
          ? 'Work out how many litres the jugs add, then see how far the tank is from full.'
          : mode === 'litres-more'
            ? 'Subtract the litres already in the tank from the tank capacity.'
            : 'Subtract the liquid already in the tank from the tank capacity, then divide by one small jug.',
    explanation,
    proof: { family, givens: { mode, poured } },
    visual,
    choices: numChoices(answer, [
      [mode === 'jugs-more' ? space : mode === 'litres-poured' ? poured : tankCap, 'missing-step'],
      [mode === 'jugs-more' ? totalJugs + already : mode === 'after-pour' ? space : answer + cup, mode === 'jugs-more' ? 'ignored-change' : 'ignored-change'],
      [Math.max(1, answer - 1), 'scale-interval'],
      [answer + 2, 'scale-interval'],
      [mode === 'litres-poured' ? poured + cup : mode === 'litres-more' ? space / cup : tankCap - cup, 'wrong-operation'],
    ]),
  };
};
SOLVE_MAP['class-2-jug-pour'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-jugs');
  const { mode, poured } = q.proof.givens;
  const space = v.tankCap - v.currentVol;
  if (mode === 'jugs-empty') return String(v.tankCap / v.cup);
  if (mode === 'litres-poured') return String(poured * v.cup);
  if (mode === 'jugs-more') return String(space / v.cup);
  if (mode === 'litres-more') return String(space);
  return String(space - poured * v.cup);
};

// 24. class-2-unit-sense
DRAFT_MAP['class-2-unit-sense'] = (family, grade, level, r) => {
  if (level === 1) {
    const scenarios = [
      ['length of a pencil', 10, 19, 'cm', ['cm', 'm', 'kg', 'L'], 'flag', 'Pencil Length'],
      ['length of a spoon', 12, 18, 'cm', ['cm', 'm', 'g', 'mL'], 'flag', 'Spoon Length'],
      ['length of a notebook', 20, 28, 'cm', ['cm', 'm', 'kg', 'L'], 'crate', 'Notebook Length'],
      ['mass of a watermelon', 2, 5, 'kg', ['kg', 'g', 'cm', 'L'], 'planet', 'Watermelon Mass'],
      ['mass of a school bag', 2, 6, 'kg', ['kg', 'g', 'm', 'mL'], 'crate', 'School Bag Mass'],
      ['mass of an apple', 120, 190, 'g', ['g', 'kg', 'cm', 'L'], 'moon', 'Apple Mass'],
      ['mass of a key', 10, 25, 'g', ['g', 'kg', 'm', 'L'], 'coin', 'Key Mass'],
      ['water in a mug', 200, 280, 'mL', ['mL', 'L', 'kg', 'm'], 'fuel-cell', 'Mug Capacity'],
      ['juice in a small cup', 150, 220, 'mL', ['mL', 'L', 'g', 'cm'], 'fuel-cell', 'Cup Capacity'],
      ['height of a room door', 2, 2, 'm', ['m', 'cm', 'kg', 'L'], 'rocket', 'Door Height'],
      ['length of a school bus', 8, 12, 'm', ['m', 'cm', 'kg', 'mL'], 'rover', 'Bus Length'],
      ['fuel in a rover tank', 30, 60, 'L', ['L', 'mL', 'cm', 'g'], 'rover', 'Rover Tank'],
      ['water in a big bucket', 8, 15, 'L', ['L', 'mL', 'kg', 'cm'], 'fuel-cell', 'Bucket Capacity'],
      ['length of a cricket bat', 80, 95, 'cm', ['cm', 'm', 'g', 'mL'], 'flag', 'Bat Length'],
      ['mass of a pumpkin', 3, 7, 'kg', ['kg', 'g', 'cm', 'mL'], 'planet', 'Pumpkin Mass'],
      ['mass of a pencil', 5, 12, 'g', ['g', 'kg', 'm', 'L'], 'coin', 'Pencil Mass'],
      ['water in a bathtub', 90, 130, 'L', ['L', 'mL', 'cm', 'g'], 'fuel-cell', 'Bathtub Capacity'],
      ['medicine in a spoon', 5, 10, 'mL', ['mL', 'L', 'kg', 'm'], 'fuel-cell', 'Spoon Medicine'],
    ];
    const [thing, lo, hi, unit, units, sp, thingTitle] = r.pick(scenarios);
    const num = r.int(lo, hi);
    const answer = `${num} ${unit}`;
    const others = units.slice(1).map(u => `${num} ${u}`);
    const visual = {
      kind: 'v3-class-2-unitsense', mode: 'sense', sp, thingTitle, num, unit,
      description: `Measurement card for ${thingTitle} showing ${num} with a missing unit.`,
    };
    return {
      family,
      prompt: `Look at the measurement card for the ${thing}. Which measurement makes the most sense?`,
      answer,
      hint: 'Use cm or m for length, g or kg for mass, and mL or L for liquid capacity.',
      explanation: `We measure the ${thing} using ${unit}, so ${answer} is the sensible measurement.`,
      proof: { family, givens: { mode: 'sense' } },
      visual,
      choices: strChoices(answer, others.map(o => [o, 'unit-conversion'])),
    };
  }
  const m = r.int(1, 4);
  const cm = r.int(15, 85);
  const extraCm = r.int(10, 75);
  const calcMode = level === 2 ? r.pick(['convert', 'add']) : r.pick(['add', 'sub', 'gap']);
  const goalM = m + r.int(1, 2);
  const totalCm = m * 100 + cm;
  const answer = calcMode === 'convert' ? totalCm
    : calcMode === 'add' ? totalCm + extraCm
      : calcMode === 'sub' ? totalCm - extraCm
        : goalM * 100 - totalCm;
  const sub = calcMode === 'sub';
  const cable = r.pick(['solar cable', 'fuel hose', 'tether rope', 'steel rail']);
  const visual = {
    kind: 'v3-class-2-unitsense', mode: 'calc', calcMode, cable, m, cm, extraCm, sub, goalM,
    description: calcMode === 'convert'
      ? `A ${cable} is ${m} m ${cm} cm long.`
      : calcMode === 'gap'
        ? `A ${cable} is ${m} m ${cm} cm long and must reach ${goalM} m.`
        : `A ${cable} is ${m} m ${cm} cm long and we ${sub ? 'cut off' : 'add'} ${extraCm} cm.`,
  };
  const prompt = calcMode === 'convert'
    ? `A ${cable} is ${m} m ${cm} cm long. How long is it in cm?`
    : calcMode === 'add'
      ? `A ${cable} is ${m} m ${cm} cm long. Another ${extraCm} cm is joined to it. What is the combined length in cm?`
      : calcMode === 'sub'
        ? `A ${cable} is ${m} m ${cm} cm long. A piece of ${extraCm} cm is cut off. How many cm remain?`
        : `A ${cable} is ${m} m ${cm} cm long. How many more cm are needed to make it ${goalM} m long?`;
  const explanation = calcMode === 'convert'
    ? `1 m is 100 cm, so ${m} m is ${m * 100} cm. Add the ${cm} cm: ${m * 100} + ${cm} = ${answer} cm.`
    : calcMode === 'gap'
      ? `${goalM} m is ${goalM * 100} cm and the ${cable} is ${m} m ${cm} cm = ${totalCm} cm. ${goalM * 100} - ${totalCm} = ${answer} cm more are needed.`
      : `First convert ${m} m ${cm} cm into centimetres: ${m * 100} + ${cm} = ${totalCm} cm. Then compute ${totalCm} ${sub ? '-' : '+'} ${extraCm} = ${answer} cm.`;
  return {
    family, prompt, answer: String(answer),
    hint: 'Remember that one metre equals one hundred centimetres. Convert the metres to cm first.',
    explanation,
    proof: { family, givens: { mode: 'calc', calcMode } },
    visual,
    choices: numChoices(answer, [
      [m + cm + (calcMode === 'convert' ? 0 : calcMode === 'sub' ? -extraCm : calcMode === 'gap' ? 0 : extraCm), 'unit-conversion'],
      [m * 10 + cm + (calcMode === 'convert' || calcMode === 'gap' ? 0 : sub ? -extraCm : extraCm), 'unit-conversion'],
      [calcMode === 'gap' ? goalM * 100 - cm : calcMode === 'convert' ? m * 10 + cm : sub ? totalCm + extraCm : totalCm - extraCm, 'wrong-operation'],
      [calcMode === 'gap' ? totalCm : totalCm, 'missing-step'],
      [answer + 10, 'class-2-carry-borrow'],
    ]),
  };
};
SOLVE_MAP['class-2-unit-sense'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-unitsense');
  if (v.mode === 'sense') return `${v.num} ${v.unit}`;
  const totalCm = v.m * 100 + v.cm;
  if (q.proof.givens.calcMode === 'convert') return String(totalCm);
  if (q.proof.givens.calcMode === 'gap') return String(v.goalM * 100 - totalCm);
  return String(v.sub ? totalCm - v.extraCm : totalCm + v.extraCm);
};

// 25. class-2-thermometer-diff
DRAFT_MAP['class-2-thermometer-diff'] = (family, grade, level, r) => {
  const step = r.pick([2, 5, 10]);
  const tickA = r.int(2, 5);
  const tickB = r.int(tickA + 2, 9);
  const tempA = tickA * step;
  const tempB = tickB * step;
  const change = level === 3 ? r.int(1, 3) * step : 0;
  const answer = tempB - tempA - change;
  if (answer <= 0) throw new QuestionRetry('Keep positive temperature difference');
  const [podA, podB] = r.shuffle(['Pod A', 'Pod B', 'Pod C', 'Pod D']).slice(0, 2);
  const visual = {
    kind: 'v3-class-2-thermo', podA, podB, tempA, tempB, step,
    description: `Two thermometers marked in steps of ${step} degrees C: ${podA} reads ${tempA} C and ${podB} reads ${tempB} C.`,
  };
  const prompt = change
    ? `Read the two thermometers. If ${podB} cools by ${change} C, how many degrees C warmer is ${podB} than ${podA} now?`
    : `Read the two thermometers. How many degrees C warmer is ${podB} than ${podA}?`;
  return {
    family, prompt, answer: String(answer),
    hint: change
      ? 'Read both thermometer scales first, subtract the cooling change from the warmer pod, then compare.'
      : 'Read the temperature on each thermometer scale, then subtract the cooler temperature from the warmer one.',
    explanation: `On the scale, ${podB} reads ${tempB} C${change ? ` and cools to ${tempB} - ${change} = ${tempB - change} C` : ''}, while ${podA} reads ${tempA} C. Subtracting ${tempB - change} - ${tempA} gives ${answer} C.`,
    proof: { family, givens: { change } },
    visual,
    choices: numChoices(answer, [
      [tempB - tempA + (change || step), change ? 'ignored-change' : 'scale-interval'],
      [tempA + tempB, 'wrong-operation'],
      [tickB - tickA, 'scale-interval'],
      [tempB, 'missing-step'],
      [Math.max(1, answer - step), 'scale-interval'],
    ]),
  };
};
SOLVE_MAP['class-2-thermometer-diff'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-thermo');
  return String(v.tempB - v.tempA - (q.proof.givens.change ?? 0));
};

// ============================================================================
// CHAPTER 6: TIME
// ============================================================================

// 26. class-2-clock-match (picture choices)
const clockMini = minutes => {
  const m = ((minutes % 720) + 720) % 720;
  return {
    kind: 'v3-class-2-clock-mini', minutes: m,
    description: clockDescription(m),
  };
};
DRAFT_MAP['class-2-clock-match'] = (family, grade, level, r) => {
  const hour = r.int(1, 11);
  const min = level === 1 ? r.pick([0, 15, 30, 45]) : r.int(1, 11) * 5;
  if (Math.floor(min / 5) === hour) throw new QuestionRetry('Need swapped-hands distractor distinct from correct');
  const baseMin = hour * 60 + min;
  const shift = level === 3 ? r.pick([15, 20, 25, 30]) : 0;
  const targetMin = baseMin + shift;
  const ansText = timeText(targetMin);
  const event = r.pick(['Moonwalk', 'Comms check', 'Docking', 'Lunch bell', 'Probe launch']);
  const swapped = (Math.floor(((targetMin % 60) || 60) / 5) || 12) * 60 + ((Math.floor(targetMin / 60) % 12) * 5);
  const prompt = shift
    ? `${event} starts ${shift} minutes after ${timeText(baseMin)}. Which clock shows the start time?`
    : `${event} is at ${ansText}. Which clock shows ${ansText}?`;
  const ansH = Math.floor(((targetMin % 720) + 720) % 720 / 60) || 12;
  const ansM = ((targetMin % 60) + 60) % 60;
  return {
    family, prompt, answer: ansText,
    hint: shift
      ? 'Add the minutes to find the start time first, then check the short hour hand and long minute hand.'
      : 'The shorter hand points to the hour; the longer hand counts minutes by 5s around the dial.',
    explanation: `${shift ? `Adding ${shift} minutes to ${timeText(baseMin)} gives ${ansText}. ` : ''}At ${ansText}, the short hour hand is past ${ansH} and the long minute hand points to ${ansM === 0 ? 12 : ansM / 5} (${ansM} minutes).`,
    proof: { family, givens: { targetMin } },
    choices: strChoices(ansText, [
      [timeText(swapped), 'clock-hands', clockMini(swapped)],
      [timeText(targetMin + 60), 'hour-carry', clockMini(targetMin + 60)],
      [timeText(targetMin - (shift || 15)), 'time-direction', clockMini(targetMin - (shift || 15))],
      [timeText(targetMin + 30), 'clock-hands', clockMini(targetMin + 30)],
    ], 4, clockMini(targetMin)),
  };
};
SOLVE_MAP['class-2-clock-match'] = q => {
  checkOptionVisuals(q, 'v3-class-2-clock-mini', v => timeText(v.minutes));
  return timeText(q.proof.givens.targetMin);
};

// 27. class-2-timeline-bar
DRAFT_MAP['class-2-timeline-bar'] = (family, grade, level, r) => {
  const startH = r.int(2, 9);
  const startM = r.pick([5, 10, 15, 20, 25, 35, 40]);
  const part1 = 60 - startM;
  const part2 = r.int(1, 7) * 5;
  const startTotal = startH * 60 + startM;
  const endTotal = startTotal + part1 + part2;
  const pause = level === 3 ? r.pick([5, 10, 15]) : 0;
  const ask = pause ? 'total' : r.pick(level === 1 ? ['total', 'first'] : ['total', 'first', 'second']);
  const answer = ask === 'first' ? part1 : ask === 'second' ? part2 : part1 + part2 - pause;
  const task = r.pick(['Rover drill', 'Star scan', 'Suit test', 'Radio link', 'Solar charge']);
  const visual = {
    kind: 'v3-class-2-timeline',
    startText: timeText(startTotal),
    midText: timeText(startTotal + part1),
    endText: timeText(endTotal),
    part1, part2, task,
    description: `Timeline for ${task} from ${timeText(startTotal)} through ${timeText(startTotal + part1)} to ${timeText(endTotal)}.`,
  };
  const prompt = pause
    ? `Look at the timeline for ${task}. With a ${pause}-minute pause, how many minutes is ${task} active?`
    : ask === 'first'
      ? `Look at the timeline for ${task}. How many minutes pass from ${visual.startText} to ${visual.midText}?`
      : ask === 'second'
        ? `Look at the timeline for ${task}. How many minutes pass from ${visual.midText} to ${visual.endText}?`
        : `Look at the timeline for ${task}. How many minutes does ${task} take in all?`;
  const hint = pause
    ? 'Add the two bar durations on the timeline first, then subtract the pause minutes.'
    : ask === 'total'
      ? 'Add the minutes before the whole hour to the minutes after the whole hour.'
      : 'Count the minutes forward on the timeline from the earlier time to the later time.';
  return {
    family, prompt, answer: String(answer),
    hint,
    explanation: ask === 'first'
      ? `From ${visual.startText} to the whole hour ${visual.midText} is 60 - ${startM} = ${part1} min.`
      : ask === 'second'
        ? `From ${visual.midText} to ${visual.endText} is ${part2} min, because the minute hand moves from 0 to ${part2}.`
        : `From ${visual.startText} to ${visual.midText} is ${part1} min, plus ${part2} min to ${visual.endText} makes ${part1 + part2} min${pause ? `. Subtracting the ${pause} min pause leaves ${answer} min` : ''}.`,
    proof: { family, givens: { pause, ask } },
    visual,
    choices: numChoices(answer, [
      [ask === 'total' ? part1 + part2 + (pause ? 0 : 40) : part1 + part2, ask === 'total' && pause ? 'missing-step' : 'hour-carry'],
      [ask === 'first' ? startM : ask === 'second' ? part1 : Math.max(10, Math.abs(part1 - part2) || 15), 'wrong-operation'],
      [answer + 10, 'hour-carry'],
      [Math.max(5, answer - 10), 'hour-carry'],
      [part1 + part2 + (pause || 5), 'wrong-operation'],
    ]),
  };
};
SOLVE_MAP['class-2-timeline-bar'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-timeline');
  const { ask, pause } = q.proof.givens;
  if (ask === 'first') return String(v.part1);
  if (ask === 'second') return String(v.part2);
  return String(v.part1 + v.part2 - (pause ?? 0));
};

// 28. class-2-schedule-table
DRAFT_MAP['class-2-schedule-table'] = (family, grade, level, r) => {
  const baseH = r.int(7, 10);
  const mins = r.shuffle([4, 5, 6, 7, 8, 9, 10]).slice(0, 4).map(n => n * 5);
  const [d1, d2, d3, d4] = mins;
  const t0 = baseH * 60 + 10;
  const t1 = t0 + d1;
  const t2 = t1 + d2;
  const t3 = t2 + d3;
  const t4 = t3 + d4;
  const rows = [
    { name: 'Briefing', start: timeText(t0), end: timeText(t1) },
    { name: 'Moon Walk', start: timeText(t1), end: timeText(t2) },
    { name: 'Lab Check', start: timeText(t2), end: timeText(t3) },
    { name: 'Cleanup', start: timeText(t3), end: timeText(t4) },
  ];
  const pickIdx = r.int(0, 3);
  const ask = level === 1 ? r.pick(['dur', 'longest', 'shortest'])
    : level === 2 ? r.pick(['dur', 'longest', 'end', 'start'])
      : r.pick(['pair', 'range', 'total']);
  const pairIdx = r.shuffle([0, 1, 2, 3]).slice(0, 2).sort();
  const longestIdx = mins.indexOf(Math.max(...mins));
  const shortestIdx = mins.indexOf(Math.min(...mins));
  const answer = ask === 'dur' ? mins[pickIdx]
    : ask === 'longest' ? rows[longestIdx].name
      : ask === 'shortest' ? rows[shortestIdx].name
        : ask === 'end' ? rows[pickIdx].end
          : ask === 'start' ? rows[pickIdx].start
            : ask === 'pair' ? mins[pairIdx[0]] + mins[pairIdx[1]]
              : ask === 'range' ? Math.max(...mins) - Math.min(...mins)
                : d1 + d2 + d3;
  const visual = {
    kind: 'v3-class-2-schedule', rows: rows.map(({ name: rName, start, end }) => ({ name: rName, start, end })),
    description: `Mission schedule table: ${rows.map(row => `${row.name} ${row.start} to ${row.end}`).join('; ')}.`,
  };
  const prompt = ask === 'dur' ? `Read the mission timetable. How many minutes does ${rows[pickIdx].name} last?`
    : ask === 'longest' ? 'Read the mission timetable. Which task takes the longest time?'
      : ask === 'shortest' ? 'Read the mission timetable. Which task takes the shortest time?'
        : ask === 'end' ? `Read the mission timetable. At what time does ${rows[pickIdx].name} end?`
          : ask === 'start' ? `Read the mission timetable. At what time does ${rows[pickIdx].name} start?`
            : ask === 'pair' ? `Read the mission timetable. How many minutes do ${rows[pairIdx[0]].name} and ${rows[pairIdx[1]].name} take altogether?`
              : ask === 'range' ? 'Read the mission timetable. How many minutes longer is the longest task than the shortest task?'
                : `Read the mission timetable. How many minutes pass from the start of ${rows[0].name} to the end of ${rows[2].name}?`;
  const durText = i => `${rows[i].name} (${rows[i].start} to ${rows[i].end}) takes ${mins[i]} min`;
  const explanation = ask === 'dur' ? `In the table, ${rows[pickIdx].name} runs from ${rows[pickIdx].start} to ${rows[pickIdx].end}, which takes ${answer} minutes.`
    : ask === 'longest' || ask === 'shortest' ? `The tasks take ${rows.map((row, i) => `${row.name} ${mins[i]} min`).join(', ')}, so ${answer} takes the ${ask === 'longest' ? 'longest' : 'shortest'} time.`
      : ask === 'end' || ask === 'start' ? `Find the ${rows[pickIdx].name} row: it starts at ${rows[pickIdx].start} and ends at ${rows[pickIdx].end}.`
        : ask === 'pair' ? `${durText(pairIdx[0])} and ${durText(pairIdx[1])}. Adding ${mins[pairIdx[0]]} + ${mins[pairIdx[1]]} gives ${answer} min.`
          : ask === 'range' ? `The longest task takes ${Math.max(...mins)} min and the shortest takes ${Math.min(...mins)} min, so ${Math.max(...mins)} - ${Math.min(...mins)} = ${answer} min.`
            : `The three tasks follow each other: ${d1} + ${d2} + ${d3} = ${answer} min from ${rows[0].start} to ${rows[2].end}.`;
  const wrongs = ask === 'dur' ? [
    [mins[(pickIdx + 1) % 4], 'ignored-condition'],
    [mins[(pickIdx + 2) % 4], 'ignored-condition'],
    [answer + 15, 'hour-carry'],
    [Math.max(5, answer - 10), 'hour-carry'],
    [mins[(pickIdx + 3) % 4], 'ignored-condition'],
  ] : ask === 'pair' ? [
    [mins[pairIdx[0]] + mins[(pairIdx[1] + 1) % 4], 'ignored-condition'],
    [d1 + d2 + d3 + d4, 'included-extra'],
    [answer + 15, 'hour-carry'],
    [Math.max(5, answer - 10), 'hour-carry'],
    [Math.abs(mins[pairIdx[0]] - mins[pairIdx[1]]), 'wrong-operation'],
  ] : ask === 'range' ? [
    [Math.max(...mins), 'missing-step'],
    [Math.max(...mins) + Math.min(...mins), 'wrong-operation'],
    [answer + 5, 'hour-carry'],
    [answer + 10, 'hour-carry'],
    [Math.min(...mins), 'missing-step'],
  ] : [
    [d1 + d3, 'ignored-condition'],
    [d1 + d2, 'ignored-condition'],
    [answer + 15, 'hour-carry'],
    [answer - 10, 'hour-carry'],
    [d1 + d2 + d3 + d4, 'included-extra'],
  ];
  return {
    family, prompt, answer: String(answer),
    hint: ask === 'dur' ? 'Find the row for that task and count the minutes from its start time to its end time.'
      : ask === 'longest' || ask === 'shortest' ? 'Work out how many minutes each task lasts, then compare them.'
        : ask === 'end' ? 'Find the row for that task and read its end time.'
          : ask === 'start' ? 'Find the row for that task and read its start time.'
            : ask === 'pair' ? 'Find how many minutes each of the two tasks lasts, then add them.'
              : ask === 'range' ? 'Find how many minutes each task lasts, then subtract the shortest from the longest.'
                : 'Add the minutes of all three tasks, or count on from the first start time to the last end time.',
    explanation,
    proof: { family, givens: { mins, pickIdx, ask, pairIdx } },
    visual,
    choices: ask === 'longest' || ask === 'shortest'
      ? strChoices(answer, rows.map(row => [row.name, 'ignored-condition']))
      : ask === 'end' || ask === 'start'
        ? strChoices(answer, [
          ...rows.map(row => [ask === 'end' ? row.end : row.start, 'ignored-condition']),
          [ask === 'end' ? rows[pickIdx].start : rows[pickIdx].end, 'time-direction'],
          ...rows.map(row => [ask === 'end' ? row.start : row.end, 'time-direction']),
        ])
        : numChoices(answer, wrongs),
  };
};
SOLVE_MAP['class-2-schedule-table'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-schedule');
  const { mins, pickIdx, ask, pairIdx } = q.proof.givens;
  if (ask === 'dur') return String(mins[pickIdx]);
  if (ask === 'longest') return v.rows[mins.indexOf(Math.max(...mins))].name;
  if (ask === 'shortest') return v.rows[mins.indexOf(Math.min(...mins))].name;
  if (ask === 'end') return v.rows[pickIdx].end;
  if (ask === 'start') return v.rows[pickIdx].start;
  if (ask === 'pair') return String(mins[pairIdx[0]] + mins[pairIdx[1]]);
  if (ask === 'range') return String(Math.max(...mins) - Math.min(...mins));
  return String(mins[0] + mins[1] + mins[2]);
};

// 29. class-2-duration-story
DRAFT_MAP['class-2-duration-story'] = (family, grade, level, r) => {
  const mode = r.pick(['hr-min', 'week-day', 'year-month', 'day-hr']);
  if (mode === 'day-hr') {
    const dys = r.int(1, 3);
    const hrs = level >= 2 ? r.int(2, 11) : 0;
    const answer = dys * 24 + hrs;
    const visual = {
      kind: 'v3-class-2-duration', sp: 'moon',
      mainCount: dys, remCount: hrs, unitMult: 24,
      mainText: plural(dys, 'day'), remText: plural(hrs, 'hour'),
      ruleText: '1 day = 24 hours', askUnit: 'hours',
      description: `Mission timer: ${plural(dys, 'day')}${hrs ? ` plus ${plural(hrs, 'hour')}` : ''}.`,
    };
    return {
      family,
      prompt: 'A moon walk lasts as long as the timer shows. How many hours is that in total?',
      answer: String(answer),
      hint: 'Every day has twenty-four hours. Multiply the days by twenty-four first.',
      explanation: `Multiply ${plural(dys, 'day')} by 24 hours per day to get ${dys * 24} hours${hrs ? `, then add ${plural(hrs, 'extra hour')} to get ${answer} hours` : ' in all'}.`,
      proof: { family, givens: {} },
      visual,
      choices: numChoices(answer, [
        [dys * 10 + hrs, 'unit-conversion'],
        [dys * 12 + hrs, 'unit-conversion'],
        [dys * 24, 'missing-step'],
        [answer + 12, 'unit-conversion'],
        [Math.max(1, answer - 6), 'unit-conversion'],
      ]),
    };
  }
  if (mode === 'hr-min') {
    const hrs = r.int(1, 3);
    const mins = r.int(1, 11) * 5;
    const answer = hrs * 60 + mins;
    const visual = {
      kind: 'v3-class-2-duration', sp: 'rocket',
      mainCount: hrs, remCount: mins, unitMult: 60,
      mainText: plural(hrs, 'hour'), remText: plural(mins, 'minute'),
      ruleText: '1 hour = 60 min', askUnit: 'minutes',
      description: `Mission timer: ${plural(hrs, 'hour')} plus ${plural(mins, 'minute')}.`,
    };
    return {
      family,
      prompt: 'The probe flight timer shows hours and minutes. How many minutes is the flight in total?',
      answer: String(answer),
      hint: 'Each whole hour has sixty minutes, not one hundred minutes.',
      explanation: `First convert ${plural(hrs, 'hour')} to minutes (${hrs} x 60 = ${hrs * 60} min), then add ${mins} min to get ${answer} minutes.`,
      proof: { family, givens: {} },
      visual,
      choices: numChoices(answer, [
        [hrs * 100 + mins, 'unit-conversion'],
        [hrs + mins, 'unit-conversion'],
        [answer - 30, 'hour-carry'],
        [answer + 20, 'hour-carry'],
      ]),
    };
  }
  if (mode === 'week-day') {
    const wks = r.int(2, 6);
    const days = level >= 2 ? r.int(2, 6) : 0;
    const answer = wks * 7 + days;
    const visual = {
      kind: 'v3-class-2-duration', sp: 'rover',
      mainCount: wks, remCount: days, unitMult: 7,
      mainText: plural(wks, 'week'), remText: plural(days, 'day'),
      ruleText: '1 week = 7 days', askUnit: 'days',
      description: `Mission timer: ${plural(wks, 'week')}${days ? ` plus ${plural(days, 'day')}` : ''}.`,
    };
    return {
      family,
      prompt: 'The Titan camp timer shows weeks and days. How many days is the camp in all?',
      answer: String(answer),
      hint: 'Every week has seven days. Multiply the weeks by seven first.',
      explanation: `Multiply ${plural(wks, 'week')} by 7 days per week to get ${wks * 7} days${days ? `, then add ${plural(days, 'extra day')} to get ${answer} days` : ' in all'}.`,
      proof: { family, givens: {} },
      visual,
      choices: numChoices(answer, [
        [wks * 5 + days, 'unit-conversion'],
        [wks * 10 + days, 'unit-conversion'],
        [wks * 7, 'missing-step'],
        [answer + 7, 'counted-endpoints'],
        [Math.max(1, answer - 3), 'unit-conversion'],
      ]),
    };
  }
  const yrs = r.int(2, 4);
  const mos = level >= 2 ? r.int(2, 9) : 0;
  const answer = yrs * 12 + mos;
  const visual = {
    kind: 'v3-class-2-duration', sp: 'satellite',
    mainCount: yrs, remCount: mos, unitMult: 12,
    mainText: plural(yrs, 'year'), remText: plural(mos, 'month'),
    ruleText: '1 year = 12 months', askUnit: 'months',
    description: `Mission timer: ${plural(yrs, 'year')}${mos ? ` plus ${plural(mos, 'month')}` : ''}.`,
  };
  return {
    family,
    prompt: 'The deep-space satellite timer shows years and months. How many months does it travel in total?',
    answer: String(answer),
    hint: 'One year has twelve months. Multiply the years by twelve first.',
    explanation: `Multiply ${plural(yrs, 'year')} by 12 months per year to get ${yrs * 12} months${mos ? `, then add ${plural(mos, 'month')} to get ${answer} months` : ' in total'}.`,
    proof: { family, givens: {} },
    visual,
    choices: numChoices(answer, [
      [yrs * 10 + mos, 'unit-conversion'],
      [yrs * 12, 'missing-step'],
      [answer + 6, 'unit-conversion'],
      [Math.max(1, answer - 4), 'unit-conversion'],
    ]),
  };
};
SOLVE_MAP['class-2-duration-story'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-duration');
  return String(v.mainCount * v.unitMult + v.remCount);
};

// 30. class-2-calendar-span
const MONTH_DAYS = [
  ['January', 31], ['February', 28], ['March', 31], ['April', 30], ['May', 31], ['June', 30],
  ['July', 31], ['August', 31], ['September', 30], ['October', 31], ['November', 30], ['December', 31],
];
DRAFT_MAP['class-2-calendar-span'] = (family, grade, level, r) => {
  const startDay = r.int(0, 6);
  const [monthName, totalDays] = r.pick(MONTH_DAYS);
  const visual = {
    kind: 'v3-class-2-cal', monthName, startDay, totalDays,
    description: `Calendar for ${monthName} with ${totalDays} days starting on ${WEEKDAYS_FULL[startDay]}.`,
  };
  const dayOf = d => (startDay + d - 1) % 7;
  const mode = level === 1 ? r.pick(['span', 'weekday'])
    : level === 2 ? r.pick(['countW', 'nth', 'weekday'])
      : r.pick(['span', 'later']);
  if (mode === 'countW') {
    const targetW = r.int(0, 6);
    let count = 0;
    for (let d = 1; d <= totalDays; d++) {
      if (dayOf(d) === targetW) count++;
    }
    const dayFull = WEEKDAYS_FULL[targetW];
    return {
      family,
      prompt: `Look at the ${monthName} calendar. How many ${dayFull}s are in this month?`,
      answer: String(count),
      hint: `Find the ${dayFull} (${WEEKDAYS[targetW]}) column and count every date in that column.`,
      explanation: `Find the ${dayFull} (${WEEKDAYS[targetW]}) column on the ${monthName} calendar and count down: there are ${plural(count, dayFull)} in ${monthName}.`,
      proof: { family, givens: { mode: 'countW', targetW } },
      visual,
      choices: numChoices(count, [
        [count === 5 ? 4 : 5, 'calendar-column'],
        [3, 'missed-object'],
        [6, 'included-extra'],
        [7, 'unit-conversion'],
      ]),
    };
  }
  if (mode === 'nth') {
    const targetW = r.int(0, 6);
    const nth = r.int(2, 3);
    const first = ((targetW - startDay + 7) % 7) + 1;
    const answer = first + (nth - 1) * 7;
    const nthWord = nth === 2 ? 'second' : 'third';
    const dayFull = WEEKDAYS_FULL[targetW];
    return {
      family,
      prompt: `Look at the ${monthName} calendar. On which date is the ${nthWord} ${dayFull}?`,
      answer: String(answer),
      hint: `Find the first ${dayFull} in the ${WEEKDAYS[targetW]} column, then move down one row for each next ${dayFull}.`,
      explanation: `The first ${dayFull} is on ${monthName} ${first}. The next ${dayFull} is 7 days later, so the ${nthWord} ${dayFull} is on ${monthName} ${answer}.`,
      proof: { family, givens: { mode: 'nth', targetW, nth } },
      visual,
      choices: numChoices(answer, [
        [first, 'calendar-column'],
        [answer + 1, 'counted-endpoints'],
        [answer - 1, 'counted-endpoints'],
        [answer + 7, 'calendar-column'],
        [answer - 7, 'calendar-column'],
      ]),
    };
  }
  if (mode === 'weekday') {
    const date = r.int(2, 28);
    const answer = WEEKDAYS_FULL[dayOf(date)];
    return {
      family,
      prompt: `Look at the ${monthName} calendar. Which day of the week is ${monthName} ${date}?`,
      answer,
      hint: 'Find the date in its row, then read the day name at the top of that column.',
      explanation: `${monthName} starts on a ${WEEKDAYS_FULL[startDay]}. Counting along the rows, ${monthName} ${date} falls in the ${answer} column.`,
      proof: { family, givens: { mode: 'weekday', date } },
      visual,
      choices: strChoices(answer, [
        [WEEKDAYS_FULL[(dayOf(date) + 1) % 7], 'calendar-column'],
        [WEEKDAYS_FULL[(dayOf(date) + 6) % 7], 'calendar-column'],
        [WEEKDAYS_FULL[(dayOf(date) + 2) % 7], 'calendar-column'],
        [WEEKDAYS_FULL[(dayOf(date) + 5) % 7], 'calendar-column'],
      ]),
    };
  }
  if (mode === 'later') {
    const date = r.int(2, 14);
    const gap = r.pick([9, 10, 11, 12, 16, 17]);
    const answer = WEEKDAYS_FULL[dayOf(date + gap)];
    return {
      family,
      prompt: `Look at the ${monthName} calendar. What day of the week is it ${gap} days after ${monthName} ${date}?`,
      answer,
      hint: 'Every 7 days brings the same day of the week again, so only count the days left over.',
      explanation: `${monthName} ${date} + ${gap} days = ${monthName} ${date + gap}. On the calendar, ${monthName} ${date + gap} falls on a ${answer}.`,
      proof: { family, givens: { mode: 'later', date, gap } },
      visual,
      choices: strChoices(answer, [
        [WEEKDAYS_FULL[(dayOf(date + gap) + 1) % 7], 'calendar-column'],
        [WEEKDAYS_FULL[(dayOf(date + gap) + 6) % 7], 'counted-endpoints'],
        [WEEKDAYS_FULL[dayOf(date)], 'calendar-column'],
        [WEEKDAYS_FULL[(dayOf(date + gap) + 2) % 7], 'calendar-column'],
      ]),
    };
  }
  const startDate = r.int(2, 9);
  const pracDays = r.int(4, 7);
  const breakDays = level === 3 ? r.int(2, 5) : 0;
  const answer = startDate + pracDays + breakDays;
  const prompt = breakDays
    ? `A crew trains for ${plural(pracDays, 'day')} starting on ${monthName} ${startDate}, then takes a ${breakDays}-day break. On what date does the crew return?`
    : `A camp starts on ${monthName} ${startDate} and lasts ${plural(pracDays, 'day')}. What is the first date AFTER the camp ends?`;
  return {
    family, prompt, answer: String(answer),
    hint: 'Start on the given date on the calendar and step forward one day at a time.',
    explanation: `Starting on ${monthName} ${startDate}, add ${plural(pracDays, 'camp day')}${breakDays ? ` plus ${plural(breakDays, 'break day')}` : ''}: ${startDate} + ${pracDays}${breakDays ? ` + ${breakDays}` : ''} = ${monthName} ${answer}.`,
    proof: { family, givens: { mode: 'span', startDate, pracDays, breakDays } },
    visual,
    choices: numChoices(answer, [
      [answer - 1, 'counted-endpoints'],
      [answer + 1, 'counted-endpoints'],
      [startDate + pracDays, 'missing-step'],
      [answer + 2, 'calendar-column'],
      [Math.max(1, answer - 2), 'counted-endpoints'],
    ]),
  };
};
SOLVE_MAP['class-2-calendar-span'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-cal');
  const g = q.proof.givens;
  const dayOf = d => (v.startDay + d - 1) % 7;
  if (g.mode === 'countW') {
    let c = 0;
    for (let d = 1; d <= v.totalDays; d++) if (dayOf(d) === g.targetW) c++;
    return String(c);
  }
  if (g.mode === 'nth') return String(((g.targetW - v.startDay + 7) % 7) + 1 + (g.nth - 1) * 7);
  if (g.mode === 'weekday') return WEEKDAYS_FULL[dayOf(g.date)];
  if (g.mode === 'later') return WEEKDAYS_FULL[dayOf(g.date + g.gap)];
  return String(g.startDate + g.pracDays + g.breakDays);
};

// ============================================================================
// CHAPTER 7: MONEY
// ============================================================================

// 31. class-2-note-combo (picture choices)
const purseKey = notes => `Rs ${notes.join(', ')}`;
const purseMini = notes => ({
  kind: 'v3-class-2-purse-mini', notes,
  description: `Purse with rupee notes and coins: ${notes.map(n => `Rs ${n}`).join(', ')}.`,
});
DRAFT_MAP['class-2-note-combo'] = (family, grade, level, r) => {
  const n50 = r.int(0, 1);
  const n20 = r.int(1, 2);
  const n10 = r.int(0, 2);
  const n5 = r.int(0, 1);
  const n2 = r.int(1, 2);
  const notes = [
    ...Array(n50).fill(50),
    ...Array(n20).fill(20),
    ...Array(n10).fill(10),
    ...Array(n5).fill(5),
    ...Array(n2).fill(2),
  ].slice(0, 5);
  const total = sum(notes);
  const paid = level === 3 ? total + r.pick([10, 20]) : 0;
  const itemPrice = paid ? paid - total : total;
  const thing = r.pick(['badge', 'patch', 'torch', 'star map']);
  const ansKey = purseKey(notes);
  const w1 = [...notes.slice(0, -1), notes.at(-1) === 2 ? 5 : 2];
  const w2 = [notes[0] === 50 ? 20 : 50, ...notes.slice(1)];
  const w3 = [...notes.slice(0, -1), 10];
  const w4 = [10, 10, 5, 2];
  const prompt = paid
    ? `A shopper pays Rs ${paid} for a Rs ${itemPrice} ${thing}. Which purse shows the exact change?`
    : `A shopper needs exactly Rs ${total} for a ${thing}. Which purse has notes and coins adding to Rs ${total}?`;
  return {
    family, prompt, answer: ansKey,
    hint: paid
      ? 'Subtract the price from the amount paid first, then add the notes and coins in each purse.'
      : 'Add the rupee numbers printed on every note and coin in each purse.',
    explanation: `${paid ? `Change = Rs ${paid} - Rs ${itemPrice} = Rs ${total}. ` : ''}Adding the notes and coins (${notes.map(n => `Rs ${n}`).join(' + ')}) gives Rs ${total}.`,
    proof: { family, givens: { total } },
    choices: strChoices(ansKey, [
      [purseKey(w1), 'coin-count', purseMini(w1)],
      [purseKey(w2), 'coin-count', purseMini(w2)],
      [purseKey(w3), 'price-total', purseMini(w3)],
      [purseKey(w4), 'coin-count', purseMini(w4)],
    ].filter(([k]) => sum(k.replace(/^Rs /, '').split(', ').map(Number)) !== total), 4, purseMini(notes)),
  };
};
SOLVE_MAP['class-2-note-combo'] = q => {
  const visuals = checkOptionVisuals(q, 'v3-class-2-purse-mini', v => purseKey(v.notes));
  const match = visuals.find(v => sum(v.notes) === q.proof.givens.total);
  if (!match) throw new Error('No purse matches target total');
  return purseKey(match.notes);
};

// 32. class-2-receipt-missing
DRAFT_MAP['class-2-receipt-missing'] = (family, grade, level, r) => {
  const [i1, i2, i3] = r.shuffle(['Star Map', 'Fuel Cell', 'Moon Map', 'Patch', 'Compass', 'Visor']).slice(0, 3);
  const p1 = r.int(12, 38);
  const p2 = r.int(14, 36);
  const qty = level === 3 ? 2 : 1;
  const p3 = r.int(8, 25);
  const total = p1 + p2 + qty * p3;
  const visual = {
    kind: 'v3-class-2-receipt',
    lines: [
      { label: `1 x ${i1}`, price: `Rs ${p1}` },
      { label: `1 x ${i2}`, price: `Rs ${p2}` },
      { label: `${qty} x ${i3}`, price: '?' },
    ],
    total,
    description: `Receipt: 1 x ${i1} = Rs ${p1}, 1 x ${i2} = Rs ${p2}, ${qty} x ${i3} = ?, Total = Rs ${total}.`,
  };
  const prompt = qty > 1
    ? `Look at the supply receipt. What is the price of ONE ${i3.toLowerCase()}, in rupees?`
    : `Look at the supply receipt. How many rupees did the ${i3.toLowerCase()} cost?`;
  return {
    family, prompt, answer: String(p3),
    hint: qty > 1
      ? 'Add the two known prices, subtract from the receipt total, and divide by 2.'
      : 'Add the two known item prices first, then subtract that sum from the receipt total.',
    explanation: `First add the known items: Rs ${p1} + Rs ${p2} = Rs ${p1 + p2}. Subtract from Rs ${total} to get Rs ${qty * p3}${qty > 1 ? `, then divide by ${qty} to get Rs ${p3} each` : ` for the ${i3}`}.`,
    proof: { family, givens: { p1, p2, qty, total } },
    visual,
    choices: numChoices(p3, [
      [qty > 1 ? qty * p3 : p1 + p2, 'missing-step'],
      [total - p1, 'missing-step'],
      [p3 + 10, 'class-2-carry-borrow'],
      [Math.max(1, p3 - 5), 'class-2-carry-borrow'],
      [total - p2, 'missing-step'],
    ]),
  };
};
SOLVE_MAP['class-2-receipt-missing'] = q => {
  expectKind(q.visual, 'v3-class-2-receipt');
  const { p1, p2, qty, total } = q.proof.givens;
  return String((total - p1 - p2) / qty);
};

// 33. class-2-two-item-buy
DRAFT_MAP['class-2-two-item-buy'] = (family, grade, level, r) => {
  const names = r.shuffle(['Pen', 'Book', 'Flag', 'Lamp', 'Mug', 'Toy', 'Cap', 'Key']).slice(0, 4);
  const prices = r.shuffle([12, 15, 18, 21, 24, 27, 32, 35]).slice(0, 4);
  const pairs = [];
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      pairs.push({ i, j, sum: prices[i] + prices[j], label: `${names[i]} and ${names[j]}` });
    }
  }
  const chosen = r.pick(pairs);
  if (pairs.filter(p => p.sum === chosen.sum).length !== 1) throw new QuestionRetry('Pair sum must be unique');
  const items = names.map((itemName, idx) => ({ name: itemName, price: prices[idx] }));
  const visual = {
    kind: 'v3-class-2-shop4', items,
    description: `Shop shelf with 4 items: ${items.map(it => `${it.name} Rs ${it.price}`).join(', ')}.`,
  };
  return {
    family,
    prompt: `A shopper spends EXACTLY Rs ${chosen.sum} on two different items from the shelf. Which two items were bought?`,
    answer: chosen.label,
    hint: 'Check the price tags on the shelf and add pairs until you match the exact total.',
    explanation: `Check the shelf price tags: ${names[chosen.i]} costs Rs ${prices[chosen.i]} and ${names[chosen.j]} costs Rs ${prices[chosen.j]}, and ${prices[chosen.i]} + ${prices[chosen.j]} = Rs ${chosen.sum}.`,
    proof: { family, givens: { targetSum: chosen.sum } },
    visual,
    choices: strChoices(chosen.label, pairs.filter(p => p.label !== chosen.label).map(p => [p.label, 'price-total'])),
  };
};
SOLVE_MAP['class-2-two-item-buy'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-shop4');
  const target = q.proof.givens.targetSum;
  for (let i = 0; i < v.items.length; i++) {
    for (let j = i + 1; j < v.items.length; j++) {
      if (v.items[i].price + v.items[j].price === target) return `${v.items[i].name} and ${v.items[j].name}`;
    }
  }
  throw new Error('No matching pair');
};

// 34. class-2-saving-story
DRAFT_MAP['class-2-saving-story'] = (family, grade, level, r) => {
  const start = r.int(35, 95);
  const earned = r.int(15, 55);
  const price = level === 1 ? 0 : r.int(20, start + earned - 15);
  const needMore = level === 3;
  const answer = level === 1 ? start + earned : start + earned - price;
  const goalPrice = start + earned + r.int(12, 38);
  const finalAns = needMore ? goalPrice - (start + earned) : answer;
  const subMode = level === 1 ? 'add' : needMore ? 'goal' : 'left';
  const visual = {
    kind: 'v3-class-2-saving', start, earned, price, goalPrice, subMode,
    description: `Space Bank: Saved Rs ${start}, Earned Rs ${earned}${subMode === 'left' ? `, Book Cost Rs ${price}` : subMode === 'goal' ? `, Telescope Price Rs ${goalPrice}` : ''}.`,
  };
  const prompt = level === 1
    ? 'Look at the Space Bank cards. How many rupees are there in all?'
    : needMore
      ? 'Look at the Space Bank cards. How many MORE rupees are needed to buy the telescope?'
      : 'Look at the Space Bank cards. After buying the book, how many rupees are left?';
  const hint = level === 1
    ? 'Add the saved rupees card and the earned rupees card together.'
    : 'First add the saved money and earned money, then subtract with the third card.';
  const explanation = level === 1
    ? `Add the saved money and the earned money together: Rs ${start} + Rs ${earned} = Rs ${finalAns} in all.`
    : needMore
      ? `First add the money: Rs ${start} + Rs ${earned} = Rs ${start + earned}. Subtract from the Rs ${goalPrice} telescope price: ${goalPrice} - ${start + earned} = Rs ${finalAns} more needed.`
      : `First add the money: Rs ${start} + Rs ${earned} = Rs ${start + earned}. Subtract the Rs ${price} book: ${start + earned} - ${price} = Rs ${finalAns} left.`;
  return {
    family, prompt, answer: String(finalAns),
    hint,
    explanation,
    proof: { family, givens: {} },
    visual,
    choices: numChoices(finalAns, [
      [start + earned, 'missing-step'],
      [needMore ? goalPrice - start : Math.max(1, start - price + 50), 'missing-step'],
      [finalAns + 10, 'class-2-carry-borrow'],
      [Math.max(1, finalAns - 10), 'class-2-carry-borrow'],
      [finalAns + 5, 'change-order'],
    ]),
  };
};
SOLVE_MAP['class-2-saving-story'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-saving');
  if (v.subMode === 'add') return String(v.start + v.earned);
  if (v.subMode === 'goal') return String(v.goalPrice - (v.start + v.earned));
  return String(v.start + v.earned - v.price);
};

// 35. class-2-best-pack
DRAFT_MAP['class-2-best-pack'] = (family, grade, level, r) => {
  const singlePrice = r.int(6, 15);
  const packQty = r.pick([3, 4, 5]);
  const savePerPack = r.int(3, 9);
  const packPrice = singlePrice * packQty - savePerPack;
  const packsBought = level === 3 ? 2 : 1;
  const answer = savePerPack * packsBought;
  const item = r.pick(['star stickers', 'ration bars', 'battery cells', 'glow rods', 'sample vials']);
  const singularItem = item.slice(0, -1);
  const visual = {
    kind: 'v3-class-2-packs', item, singlePrice, packQty, packPrice,
    description: `Deal A: ${plural(1, singularItem)} for Rs ${singlePrice}. Deal B: Pack of ${plural(packQty, singularItem, item)} for Rs ${packPrice}.`,
  };
  const totalItems = packsBought * packQty;
  const singleCost = singlePrice * totalItems;
  const packCost = packPrice * packsBought;
  const prompt = `Look at the two shop deals. How many rupees do you SAVE buying ${totalItems} ${item} in packs instead of singles?`;
  return {
    family, prompt, answer: String(answer),
    hint: 'Find the cost of buying that many singles one by one, then subtract the pack price.',
    explanation: `Buying ${totalItems} singles costs ${totalItems} x Rs ${singlePrice} = Rs ${singleCost}. Buying ${plural(packsBought, 'pack')} costs Rs ${packCost}. You save Rs ${singleCost} - Rs ${packCost} = Rs ${answer}.`,
    proof: { family, givens: { packsBought } },
    visual,
    choices: numChoices(answer, [
      [packPrice - singlePrice, 'price-total'],
      [singleCost, 'missing-step'],
      [savePerPack + (packsBought === 2 ? 0 : 4), 'missing-step'],
      [answer + 2, 'change-order'],
      [Math.max(1, answer - 2), 'change-order'],
    ]),
  };
};
SOLVE_MAP['class-2-best-pack'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-packs');
  return String((v.singlePrice * v.packQty - v.packPrice) * q.proof.givens.packsBought);
};

// ============================================================================
// CHAPTER 8: DATA
// ============================================================================

// 36. class-2-tally-table
DRAFT_MAP['class-2-tally-table'] = (family, grade, level, r) => {
  const labels = r.shuffle(['Comets', 'Moons', 'Rings', 'Stars', 'Meteors']).slice(0, 3);
  const counts = r.shuffle([6, 7, 8, 9, 11, 12, 13, 14, 16, 17]).slice(0, 3);
  const rows = labels.map((label, i) => ({ label, count: counts[i] }));
  const mode = level === 1 ? 'single' : level === 2 ? 'diff' : 'sum';
  const pickIdx = r.int(0, 2);
  const [iA, iB] = r.shuffle([0, 1, 2]).slice(0, 2).sort((a, b) => counts[b] - counts[a]);
  const answer = mode === 'single' ? counts[pickIdx] : mode === 'diff' ? counts[iA] - counts[iB] : counts[0] + counts[1] + counts[2];
  const fourMiscount = n => Math.floor(n / 5) * 4 + (n % 5);
  const visual = {
    kind: 'v3-class-2-tally', rows,
    description: `Tally table: ${rows.map(row => `${row.label} shows ${plural(row.count, 'tally mark')}`).join('; ')}.`,
  };
  const prompt = mode === 'single'
    ? `Each crossed bundle is 5. In the tally table, how many ${rows[pickIdx].label} were recorded?`
    : mode === 'diff'
      ? `Read the tally table. How many more ${rows[iA].label} than ${rows[iB].label} were recorded?`
      : 'Read the tally table. How many sightings were recorded in all?';
  return {
    family, prompt, answer: String(answer),
    hint: 'Count five for every crossed bundle of tallies, then add the single strokes in each row.',
    explanation: `Each crossed bundle is 5, so the row totals are ${rows.map(row => `${row.label} = ${row.count}`).join(', ')}. ${mode === 'single' ? `That gives ${answer} ${rows[pickIdx].label}.` : mode === 'diff' ? `Subtracting ${counts[iA]} - ${counts[iB]} gives ${answer}.` : `Adding all three rows gives ${answer}.`}`,
    proof: { family, givens: { mode, iA, iB, pickIdx } },
    visual,
    choices: numChoices(answer, [
      [mode === 'single' ? fourMiscount(counts[pickIdx]) : mode === 'diff' ? fourMiscount(counts[iA]) - fourMiscount(counts[iB]) : sum(counts.map(fourMiscount)), 'class-2-full-transfer'],
      [mode === 'diff' ? counts[iA] + counts[iB] : counts[0] + counts[1], 'graph-difference'],
      [answer + 1, 'missed-object'],
      [Math.max(1, answer - 1), 'missed-object'],
      [answer + 5, 'class-2-full-transfer'],
    ]),
  };
};
SOLVE_MAP['class-2-tally-table'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-tally');
  const { mode, iA, iB, pickIdx } = q.proof.givens;
  return String(mode === 'single' ? v.rows[pickIdx].count : mode === 'diff' ? v.rows[iA].count - v.rows[iB].count : sum(v.rows.map(r => r.count)));
};

// 37. class-2-bar-gap
DRAFT_MAP['class-2-bar-gap'] = (family, grade, level, r) => {
  const scale = level === 1 ? 2 : r.pick([2, 5, 10]);
  const labels = r.shuffle(['Io', 'Titan', 'Mars', 'Luna', 'Pluto', 'Ceres']).slice(0, 4);
  const ticks = r.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  const values = ticks.map(t => t * scale);
  const [high, low] = [0, 1].sort((a, b) => values[b] - values[a]);
  const askAll = level === 3 && r.pick([true, false]);
  const answer = askAll ? sum(values) : values[high] - values[low];
  const visual = {
    kind: 'v3-class-2-bars', labels, values, scale,
    description: `Bar graph with scale step ${scale}: ${labels.map((l, i) => `${l} = ${values[i]}`).join(', ')}.`,
  };
  const prompt = askAll
    ? 'Read the bar graph of moon probes. How many probes were sent to all four worlds in total?'
    : `Read the bar graph of moon probes. How many more probes went to ${labels[high]} than ${labels[low]}?`;
  return {
    family, prompt, answer: String(answer),
    hint: 'Read the number scale along the left axis to find each bar height before adding or subtracting.',
    explanation: askAll
      ? `Read each bar on the scale of ${scale}: ${labels.map((l, i) => `${l} = ${values[i]}`).join(', ')}. Adding ${values.join(' + ')} gives ${answer} probes.`
      : `On the scale of ${scale}, ${labels[high]} has ${values[high]} probes and ${labels[low]} has ${values[low]}: ${values[high]} - ${values[low]} = ${answer} more probes.`,
    proof: { family, givens: { high, low, askAll } },
    visual,
    choices: numChoices(answer, [
      [askAll ? sum(ticks) : ticks[high] - ticks[low], 'graph-key'],
      [askAll ? values[0] + values[1] + values[2] : values[high] + values[low], 'graph-difference'],
      [values[high], 'missing-step'],
      [answer + scale, 'graph-key'],
      [Math.max(1, answer - scale), 'graph-key'],
    ]),
  };
};
SOLVE_MAP['class-2-bar-gap'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-bars');
  const { high, low, askAll } = q.proof.givens;
  return String(askAll ? sum(v.values) : v.values[high] - v.values[low]);
};

// 38. class-2-pictograph-half
DRAFT_MAP['class-2-pictograph-half'] = (family, grade, level, r) => {
  const keyVal = r.pick([2, 4, 5, 10]);
  const labels = r.shuffle(['Crew A', 'Crew B', 'Crew C', 'Crew D']).slice(0, 3);
  const icons = r.shuffle([2, 3, 4, 5, 6, 7]).slice(0, 3);
  const vals = icons.map(ic => ic * keyVal);
  const [iMax, iMin] = [0, 1].sort((a, b) => vals[b] - vals[a]);
  const mode = level === 2 ? 'sum2' : 'diff';
  const answer = mode === 'sum2' ? vals[0] + vals[1] : vals[iMax] - vals[iMin];
  const visual = {
    kind: 'v3-class-2-picto', labels, icons, keyVal,
    description: `Pictograph where 1 star = ${plural(keyVal, 'crate')}: ${labels.map((l, i) => `${l} shows ${plural(icons[i], 'star')}`).join('; ')}.`,
  };
  const prompt = mode === 'sum2'
    ? `Look at the pictograph and its key. How many crates did ${labels[0]} and ${labels[1]} pack altogether?`
    : `Look at the pictograph and its key. How many more crates did ${labels[iMax]} pack than ${labels[iMin]}?`;
  return {
    family, prompt, answer: String(answer),
    hint: 'Check the key at the bottom first, then multiply the number of stars by the key value.',
    explanation: mode === 'sum2'
      ? `Each star stands for ${keyVal} crates, so (${icons[0]} + ${icons[1]}) stars x ${keyVal} = ${answer} crates altogether.`
      : `Each star stands for ${keyVal} crates, so (${icons[iMax]} - ${icons[iMin]}) stars x ${keyVal} = ${answer} more crates.`,
    proof: { family, givens: { mode, iMax, iMin } },
    visual,
    choices: numChoices(answer, [
      [mode === 'sum2' ? icons[0] + icons[1] : icons[iMax] - icons[iMin], 'graph-key'],
      [mode === 'sum2' ? Math.abs(vals[0] - vals[1]) : vals[iMax] + vals[iMin], 'graph-difference'],
      [answer + keyVal, 'graph-key'],
      [Math.max(1, answer - keyVal), 'graph-key'],
      [vals[iMax], 'missing-step'],
    ]),
  };
};
SOLVE_MAP['class-2-pictograph-half'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-picto');
  const { mode, iMax, iMin } = q.proof.givens;
  return String(mode === 'sum2' ? (v.icons[0] + v.icons[1]) * v.keyVal : (v.icons[iMax] - v.icons[iMin]) * v.keyVal);
};

// 39. class-2-chart-true
DRAFT_MAP['class-2-chart-true'] = (family, grade, level, r) => {
  const teams = r.shuffle(['Red', 'Blue', 'Gold']).slice(0, 3);
  const c0 = r.int(12, 24);
  const diff = r.int(4, 9);
  const c1 = c0 + diff;
  const c2 = r.int(10, 22);
  if (c2 === c0 || c2 === c1) throw new QuestionRetry('Keep team scores distinct');
  const rows = [
    { team: teams[0], score: c0 },
    { team: teams[1], score: c1 },
    { team: teams[2], score: c2 },
  ];
  const total = c0 + c1 + c2;
  const maxTeam = rows.reduce((a, b) => b.score > a.score ? b : a).team;
  const minTeam = rows.reduce((a, b) => b.score < a.score ? b : a).team;
  const correctIdx = r.int(0, 2);
  const statements = [
    correctIdx === 0 ? `${teams[1]} has ${diff} more than ${teams[0]}` : `${teams[0]} has ${diff} more than ${teams[1]}`,
    correctIdx === 1 ? `${maxTeam} has the highest score` : `${minTeam} has the highest score`,
    correctIdx === 2 ? `Total score is ${total}` : `Total score is ${total + 10}`,
    `${teams[0]} + ${teams[1]} = ${c0 + c1 + 5}`,
  ];
  const answer = statements[correctIdx];
  const visual = {
    kind: 'v3-class-2-scoretable', rows,
    description: `Score table: ${rows.map(row => `${row.team} = ${row.score}`).join(', ')}.`,
  };
  return {
    family,
    prompt: 'Check the team score table. Which statement about the scores is TRUE?',
    answer,
    hint: 'Test each option against the three team numbers shown in the score table.',
    explanation: `In the table, ${rows.map(row => `${row.team} has ${row.score}`).join(', ')} (total ${total}), which proves "${answer}" is true.`,
    proof: { family, givens: { answer } },
    visual,
    choices: strChoices(answer, statements.filter(s => s !== answer).map(s => [s, 'ignored-condition'])),
  };
};
SOLVE_MAP['class-2-chart-true'] = q => {
  expectKind(q.visual, 'v3-class-2-scoretable');
  return q.proof.givens.answer;
};

// 40. class-2-data-story
DRAFT_MAP['class-2-data-story'] = (family, grade, level, r) => {
  const [n1, n2, n3] = r.shuffle(NAMES).slice(0, 3);
  const c1 = r.int(12, 28);
  const more = r.int(4, 12);
  const c2 = c1 + more;
  const c3 = r.int(10, 25);
  const total = c1 + c2 + c3;
  const askMissing = level === 3;
  const answer = askMissing ? c3 : total;
  const visual = {
    kind: 'v3-class-2-datastory', n1, n2, n3, c1, more, c3, total, askMissing,
    description: askMissing
      ? `Badge log (Total ${total}): ${n1} has ${c1}, ${n2} has ${more} more than ${n1}, ${n3} has the rest.`
      : `Space book log: ${n1} read ${c1}, ${n2} read ${more} more than ${n1}, ${n3} read ${c3}.`,
  };
  const prompt = askMissing
    ? `Look at the badge log board. How many badges does ${n3} have?`
    : `Look at the space book log board. How many books did ${n1}, ${n2} and ${n3} read in all?`;
  return {
    family, prompt, answer: String(answer),
    hint: `First add to find ${n2}'s count, then combine with the others.`,
    explanation: `First find ${n2}'s count: ${c1} + ${more} = ${c2}. Then ${askMissing ? `subtract from ${total}: ${total} - (${c1} + ${c2}) = ${c3}` : `add all three counts: ${c1} + ${c2} + ${c3} = ${total}`}.`,
    proof: { family, givens: {} },
    visual,
    choices: numChoices(answer, [
      [askMissing ? total - c1 - more : c1 + more + c3, 'missing-step'],
      [c1 + c2, 'missing-step'],
      [answer + 10, 'class-2-carry-borrow'],
      [Math.max(1, answer - 6), 'wrong-operation'],
      [answer + more, 'graph-difference'],
    ]),
  };
};
SOLVE_MAP['class-2-data-story'] = q => {
  const v = expectKind(q.visual, 'v3-class-2-datastory');
  const c2 = v.c1 + v.more;
  return String(v.askMissing ? v.total - (v.c1 + c2) : v.c1 + c2 + v.c3);
};
