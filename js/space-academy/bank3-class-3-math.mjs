import { QuestionRetry, wrong } from './bank-shared.mjs';
import {
  biased, equivalent, fractionText, hook, matchPictures, person, pictureChoices, q, textChoices,
} from './bank3-class-3-helpers.mjs';

const digitSum = value => String(value).split('').reduce((sum, digit) => sum + Number(digit), 0);
const digitsOf = (value, width) => String(value).padStart(width, '0').slice(-width).split('').map(Number);
const swapDigits = value => {
  const text = String(value);
  if (text.length < 2 || text[text.length - 1] === text[text.length - 2]) return value + 10;
  return Number(text.slice(0, -2) + text[text.length - 1] + text[text.length - 2]);
};
const blockLabel = model => `${placeCount(model.hundreds, 'flat')}, ${placeCount(model.tens, 'rod')}, ${placeCount(model.ones, 'cube')}`;
const blockValue = model => model.hundreds * 100 + model.tens * 10 + model.ones;
const blockVisual = model => ({
  kind: 'v3-class-3-blocks', compact: true, hundreds: model.hundreds, tens: model.tens, ones: model.ones,
  description: `${placeCount(model.hundreds, 'flat')}, ${placeCount(model.tens, 'rod')} and ${placeCount(model.ones, 'cube')}.`,
});
const placeCount = (value, one) => `${value} ${value === 1 ? one : `${one}s`}`;
const barLabel = (name, value, unknown = false) => (unknown ? `${name} ?` : `${name} ${value}`);

function say(answer, pairs) {
  const options = [String(answer), ...pairs.map(([value]) => String(value))];
  const lengths = options.map(value => value.length);
  if (new Set(options).size !== options.length || Math.max(...lengths) - Math.min(...lengths) >= 3 || options.some(value => value.length > 44)) {
    throw new QuestionRetry('option length');
  }
  return textChoices(answer, pairs.map(([value, code]) => wrong(value, code)));
}

function beadNumber(rods) {
  return rods[0] * 1000 + rods[1] * 100 + rods[2] * 10 + rods[3];
}

function draftBeads(family, grade, level, r) {
  const rods = [0, 1, 2, 3].map(place => r.int(0, level === 1 && place === 0 ? 2 : 6));
  if (rods.every(count => count === 0)) rods[3] = r.int(1, 6);
  const number = beadNumber(rods);
  const places = [1000, 100, 10, 1];
  const names = ['thousands', 'hundreds', 'tens', 'ones'];
  let ask = 'number';
  let answer = number;
  let prompt = r.pick(['What number do the beads show?', 'Which number matches the abacus?']);
  let explanation = `${placeCount(rods[0], 'thousand')}, ${placeCount(rods[1], 'hundred')}, ${placeCount(rods[2], 'ten')} and ${placeCount(rods[3], 'one')} make ${number}.`;
  const givens = { ask };
  if (level === 2) {
    const rod = r.int(0, 3);
    ask = r.pick(['count', 'value']);
    givens.ask = ask;
    givens.rod = rod;
    if (ask === 'count') {
      answer = rods[rod];
      prompt = `How many beads are on the ${names[rod]} rod?`;
      explanation = `The ${names[rod]} rod has ${placeCount(answer, 'bead')}.`;
    } else {
      answer = rods[rod] * places[rod];
      prompt = `What is the value of the ${names[rod]} beads?`;
      explanation = `${placeCount(rods[rod], 'bead')} in the ${names[rod]} place ${rods[rod] === 1 ? 'is' : 'are'} worth ${answer}.`;
    }
  } else if (level >= 3) {
    const from = rods.findIndex(count => count > 0);
    const to = [0, 1, 2, 3].find(index => index !== from && rods[index] < 6);
    if (from < 0 || to == null) throw new QuestionRetry('bead move');
    const next = [...rods];
    next[from] -= 1;
    next[to] += 1;
    ask = 'move';
    givens.ask = ask;
    givens.from = from;
    givens.to = to;
    answer = beadNumber(next);
    prompt = `Move 1 bead from ${names[from]} to ${names[to]}. What number is that?`;
    explanation = `The beads change from ${number} to ${answer}.`;
  }
  const swapped = swapDigits(answer);
  const hint = ask === 'count'
    ? 'Count only the beads on the rod the question names.'
    : ask === 'value'
      ? 'Count the beads on that rod, then use its place value.'
      : ask === 'move'
        ? 'A bead on a new rod changes both places.'
        : 'Read each rod by its place: thousands, hundreds, tens, then ones.';
  return q({
    family,
    prompt: hook(r, prompt),
    answer,
    hint,
    explanation,
    givens,
    visual: {
      kind: 'v3-class-3-abacus', rods,
      description: `Abacus rods labelled Th, H, T and O have ${rods[0]}, ${rods[1]}, ${rods[2]} and ${rods[3]} beads.`,
    },
    choices: biased(r, answer, [
      { value: swapped, code: 'class-3-digit-swap' },
      { value: ask === 'count' ? answer * places[givens.rod || 0] : number + places[1], code: 'face-value' },
      { value: answer + 10, code: 'place-shift' },
      { value: Math.max(0, answer - 10), code: 'missing-step' },
    ], { min: 0, max: 9999 }),
  });
}

function solveBeads(question) {
  const rods = question.visual?.rods;
  if (!Array.isArray(rods) || rods.length !== 4 || rods.some(count => !Number.isInteger(count) || count < 0 || count > 6)) throw new Error('abacus');
  const givens = question.proof.givens;
  const places = [1000, 100, 10, 1];
  if (givens.ask === 'number') return beadNumber(rods);
  if (givens.ask === 'count') return rods[givens.rod];
  if (givens.ask === 'value') return rods[givens.rod] * places[givens.rod];
  if (givens.ask === 'move') {
    const next = [...rods];
    if (next[givens.from] < 1 || next[givens.to] > 5) throw new Error('abacus move');
    next[givens.from] -= 1;
    next[givens.to] += 1;
    return beadNumber(next);
  }
  throw new Error('abacus ask');
}

function draftBlocks(family, grade, level, r) {
  const correct = { hundreds: r.int(0, 3), tens: r.int(0, 4), ones: r.int(0, 4) };
  if (blockValue(correct) === 0) correct.ones = r.int(1, 4);
  let target = blockValue(correct);
  let prompt = `Which blocks show ${target}?`;
  if (level >= 3) {
    const bump = r.pick([10, 20, 100]);
    const base = target - bump;
    if (base >= 0) {
      target = blockValue(correct);
      prompt = `Which blocks show ${bump} more than ${base}?`;
    }
  } else if (level === 2) {
    prompt = r.pick([`Which blocks match ${target}?`, `Pick the blocks for ${target}.`]);
  }
  const models = [];
  const push = (model, code) => {
    if (model.hundreds < 0 || model.hundreds > 3 || model.tens < 0 || model.tens > 4 || model.ones < 0 || model.ones > 4) return;
    if (models.some(item => blockValue(item.model) === blockValue(model)) || blockValue(model) === blockValue(correct)) return;
    models.push({ model, code });
  };
  push({ hundreds: correct.tens, tens: correct.hundreds, ones: correct.ones }, 'class-3-digit-swap');
  push({ hundreds: correct.ones, tens: correct.tens, ones: correct.hundreds }, 'class-3-digit-swap');
  push({ ...correct, tens: correct.tens + 1 }, 'place-shift');
  push({ ...correct, ones: correct.ones + 1 }, 'face-value');
  push({ ...correct, hundreds: correct.hundreds + 1 }, 'place-shift');
  push({ ...correct, ones: Math.max(0, correct.ones - 1) }, 'missing-step');
  if (models.length < 3 || !models.some(item => item.code === 'class-3-digit-swap')) throw new QuestionRetry('blocks');
  return q({
    family,
    prompt: hook(r, prompt),
    answer: blockLabel(correct),
    hint: 'A flat is 100, a rod is 10 and a cube is 1.',
    explanation: `${target} is ${placeCount(correct.hundreds, 'hundred')}, ${placeCount(correct.tens, 'ten')} and ${placeCount(correct.ones, 'one')}.`,
    givens: { target },
    choices: pictureChoices(blockLabel(correct), blockVisual(correct), models.slice(0, 5).map(item => wrong(blockLabel(item.model), item.code, blockVisual(item.model)))),
  });
}

function solveBlocks(question) {
  matchPictures(question, blockLabel);
  const hits = question.optionVisuals.filter(visual => blockValue(visual) === question.proof.givens.target);
  if (hits.length !== 1) throw new Error('blocks');
  return blockLabel(hits[0]);
}

function nearestLabel(visual) {
  let best = 0;
  for (let index = 0; index < visual.count; index += visual.labelEvery) {
    if (Math.abs(index - visual.arrow) < Math.abs(best - visual.arrow)) best = index;
  }
  return visual.start + best * visual.step;
}

function draftLine(family, grade, level, r) {
  const step = level === 1 ? r.pick([1, 2, 5]) : r.pick([5, 10, 20]);
  const count = r.int(6, 9);
  const labelEvery = level >= 3 ? 2 : 1;
  const start = level === 1 ? r.pick([0, 10, 20]) : r.int(1, 8) * 10;
  const arrow = level >= 3 ? r.int(0, Math.floor((count - 2) / 2)) * 2 + 1 : r.int(0, count - 1);
  const exact = start + arrow * step;
  const nearest = nearestLabel({ start, step, count, labelEvery, arrow });
  const askNearest = level >= 3 && nearest !== exact;
  const answer = askNearest ? nearest : exact;
  const end = start + (count - 1) * step;
  const prompt = askNearest
    ? 'Which labelled mark is closest to the arrow?'
    : r.pick(['What number is the arrow pointing to?', 'Which number sits under the arrow?']);
  return q({
    family,
    prompt: hook(r, prompt),
    answer,
    hint: 'Count the gaps from a labelled mark. Each gap is the same size.',
    explanation: askNearest
      ? `The arrow is at ${exact}. The closest labelled mark is ${nearest}.`
      : `The line starts at ${start} and each gap is ${step}. The arrow is ${answer}.`,
    givens: { ask: askNearest ? 'nearest' : 'exact' },
    visual: {
      kind: 'v3-class-3-line', start, step, count, labelEvery, arrow,
      description: `Number line from ${start} to ${end} with gaps of ${step}. Labels sit on every ${labelEvery === 1 ? 'mark' : 'second mark'}. The arrow is ${placeCount(arrow, 'gap')} after ${start}.`,
    },
    choices: biased(r, answer, [
      { value: nearest === answer ? end : nearest, code: 'class-3-nearest-end' },
      { value: exact === answer ? start : exact, code: 'scale-interval' },
      { value: answer + step, code: 'missing-step' },
      { value: start, code: 'scale-zero' },
    ], { min: 0, max: 9999 }),
  });
}

function solveLine(question) {
  const visual = question.visual;
  if (!visual || visual.count < 2 || visual.arrow < 0 || visual.arrow >= visual.count) throw new Error('line');
  const exact = visual.start + visual.arrow * visual.step;
  return question.proof.givens.ask === 'nearest' ? nearestLabel(visual) : exact;
}

function lockHits(givens) {
  const hits = [];
  for (let value = givens.low; value <= givens.high; value++) {
    if (digitSum(value) !== givens.sum || value % 10 !== givens.ones) continue;
    if (givens.tens != null && Math.floor(value / 10) % 10 !== givens.tens) continue;
    hits.push(value);
  }
  return hits;
}

function draftLock(family, grade, level, r) {
  const width = level === 1 ? 2 : level === 2 ? 3 : 4;
  const lowBound = 10 ** (width - 1);
  const highBound = Math.min(9999, 10 ** width - 1);
  const number = r.int(lowBound, highBound);
  const span = r.int(8, 18);
  const low = Math.max(lowBound, number - span);
  const high = Math.min(highBound, number + span);
  const givens = { low, high, sum: digitSum(number), ones: number % 10, tens: level >= 3 ? Math.floor(number / 10) % 10 : null };
  if (lockHits(givens).length !== 1) throw new QuestionRetry('lock');
  const clues = [`It is from ${low} to ${high}.`, `Its digits add to ${givens.sum}.`, `Its ones digit is ${givens.ones}.`];
  if (givens.tens != null) clues.push(`Its tens digit is ${givens.tens}.`);
  const prompt = `${clues.join(' ')} What is the code?`;
  return q({
    family,
    prompt: hook(r, prompt),
    answer: number,
    hint: 'Keep a code only when every clue fits. One clue is not enough.',
    explanation: `${number} is inside the range, its digits add to ${givens.sum} and its ones digit is ${givens.ones}.`,
    givens,
    choices: biased(r, number, [
      { value: swapDigits(number), code: 'class-3-digit-swap' },
      { value: number + 1, code: 'ignored-condition' },
      { value: number + 10, code: 'place-shift' },
      { value: number - 10, code: 'missing-step' },
    ], { min: 0, max: 9999 }),
  });
}

function solveLock(question) {
  const hits = lockHits(question.proof.givens);
  if (hits.length !== 1) throw new Error('lock');
  return hits[0];
}

function cardNumbers(digits) {
  const usable = digits.filter((digit, index) => digit !== 0 || index !== 0 || digits.some(item => item !== 0));
  const build = ordered => {
    const cards = [...ordered];
    if (cards[0] === 0) {
      const swap = cards.findIndex(digit => digit !== 0);
      [cards[0], cards[swap]] = [cards[swap], cards[0]];
    }
    return Number(cards.join(''));
  };
  const largest = build([...digits].sort((a, b) => b - a));
  const smallest = build([...digits].sort((a, b) => a - b));
  return { largest, smallest };
}

function draftCards(family, grade, level, r) {
  const digits = [];
  while (digits.length < 4) {
    const digit = r.int(0, 9);
    if (!digits.includes(digit)) digits.push(digit);
  }
  if (level === 1 && digits[0] === 0) digits[0] = r.int(1, 9);
  const { largest, smallest } = cardNumbers(digits);
  const ask = level === 1 ? 'largest' : level === 2 ? 'smallest' : 'difference';
  const answer = ask === 'largest' ? largest : ask === 'smallest' ? smallest : largest - smallest;
  const prompt = ask === 'largest'
    ? 'What is the largest number you can make with all four cards?'
    : ask === 'smallest'
      ? 'What is the smallest number you can make with all four cards?'
      : 'How much larger is the biggest number than the smallest number?';
  return q({
    family,
    prompt: hook(r, prompt),
    answer,
    hint: 'Use every card once. A zero cannot be the first digit of the smallest number.',
    explanation: ask === 'difference'
      ? `The largest is ${largest} and the smallest is ${smallest}. The gap is ${answer}.`
      : `The cards ${digits.join(', ')} make ${answer} for this rule.`,
    givens: { ask },
    visual: {
      kind: 'v3-class-3-cards', digits,
      description: `Four digit cards show ${digits.join(', ')}.`,
    },
    choices: biased(r, answer, [
      { value: swapDigits(answer), code: 'class-3-digit-swap' },
      { value: ask === 'difference' ? largest : smallest, code: 'ignored-condition' },
      { value: ask === 'largest' ? largest - smallest : largest, code: 'wrong-operation' },
      { value: answer + 9, code: 'place-shift' },
    ], { min: 0, max: 9999 }),
  });
}

function solveCards(question) {
  const digits = question.visual?.digits;
  if (!Array.isArray(digits) || digits.length !== 4) throw new Error('cards');
  const { largest, smallest } = cardNumbers(digits);
  const ask = question.proof.givens.ask;
  if (ask === 'largest') return largest;
  if (ask === 'smallest') return smallest;
  if (ask === 'difference') return largest - smallest;
  throw new Error('cards ask');
}

function applyRule(rule, input) {
  if (rule.op === '+') return input + rule.n;
  if (rule.op === '-') return input - rule.n;
  if (rule.op === 'x') return input * rule.n;
  return input * rule.n + rule.m;
}

function fittingRules(examples) {
  const rules = [];
  const [left, right] = examples[0];
  if (right >= left) rules.push({ op: '+', n: right - left });
  else rules.push({ op: '-', n: left - right });
  if (left && right % left === 0) rules.push({ op: 'x', n: right / left });
  for (let factor = 2; factor <= 5; factor++) {
    const extra = right - left * factor;
    if (extra !== 0) rules.push({ op: 'x+', n: factor, m: extra });
  }
  return rules.filter(rule => Number.isInteger(rule.n) && examples.every(pair => applyRule(rule, pair[0]) === pair[1]));
}

function ruleText(rule) {
  if (!rule) return '?';
  if (rule.op === '+') return `+ ${rule.n}`;
  if (rule.op === '-') return `- ${rule.n}`;
  if (rule.op === 'x') return `x ${rule.n}`;
  return `x ${rule.n}`;
}

function draftRule(family, grade, level, r) {
  const rule = level >= 3
    ? r.pick([{ op: 'x+', n: 2, m: 1 }, { op: 'x+', n: 3, m: 1 }, { op: 'x', n: r.int(2, 5) }])
    : r.pick([{ op: '+', n: r.int(2, 9) }, { op: '-', n: r.int(2, 6) }, { op: 'x', n: r.int(2, 5) }]);
  const examples = [];
  let seed = r.int(2, 8);
  while (examples.length < 2) {
    const output = applyRule(rule, seed);
    if (output >= 0 && output <= 80 && !examples.some(pair => pair[0] === seed)) examples.push([seed, output]);
    seed += r.int(1, 3);
    if (seed > 20) throw new QuestionRetry('rule examples');
  }
  const ask = r.int(2, 9);
  const answer = applyRule(rule, ask);
  if (answer < 0 || answer > 99 || examples.some(pair => pair[0] === ask)) throw new QuestionRetry('rule ask');
  const shown = level === 1 ? rule : null;
  if (!shown && fittingRules(examples).length !== 1) throw new QuestionRetry('rule unique');
  const wrongRule = rule.op === 'x' || rule.op === 'x+' ? { op: '+', n: rule.n } : { op: 'x', n: Math.max(2, rule.n) };
  return q({
    family,
    prompt: hook(r, r.pick(['What number comes out of the machine?', 'Which number does the machine make?'])),
    answer,
    hint: 'Use the same rule on the new input. Check it on both examples.',
    explanation: shown
      ? `The rule ${ruleText(rule)} changes ${ask} into ${answer}.`
      : `The examples follow one rule, so ${ask} becomes ${answer}.`,
    givens: { ask },
    visual: {
      kind: 'v3-class-3-machine', ask, rule: ruleText(shown), examples,
      description: shown
        ? `Machine with input ${ask} and rule ${ruleText(rule)}. Examples ${examples.map(pair => `${pair[0]} to ${pair[1]}`).join(', ')}.`
        : `Machine with input ${ask} and a hidden rule. Examples ${examples.map(pair => `${pair[0]} to ${pair[1]}`).join(', ')}.`,
    },
    choices: biased(r, answer, [
      { value: applyRule(wrongRule, ask), code: 'class-3-rule-step' },
      { value: applyRule(rule, examples[0][1]), code: 'missing-step' },
      { value: ask + examples[0][1], code: 'wrong-operation' },
      { value: answer + rule.n, code: 'reversed-operation' },
    ], { min: 0, max: 999 }),
  });
}

function solveRule(question) {
  const visual = question.visual;
  const parsed = visual.rule === '?' ? null : visual.rule;
  let rule = null;
  if (parsed && parsed.startsWith('+ ')) rule = { op: '+', n: Number(parsed.slice(2)) };
  else if (parsed && parsed.startsWith('- ')) rule = { op: '-', n: Number(parsed.slice(2)) };
  else if (parsed && parsed.startsWith('x ')) rule = { op: 'x', n: Number(parsed.slice(2)) };
  if (!rule) {
    const fits = fittingRules(visual.examples);
    if (fits.length !== 1) throw new Error('rule');
    rule = fits[0];
  }
  if (!visual.examples.every(pair => applyRule(rule, pair[0]) === pair[1])) throw new Error('rule examples');
  return applyRule(rule, visual.ask);
}

function draftArray(family, grade, level, r) {
  const rows = r.int(2, level === 1 ? 5 : 6);
  const cols = r.int(2, 8);
  const total = rows * cols;
  const who = person(r);
  const thing = r.pick(['stars', 'star stickers', 'star badges', 'star cards', 'star tiles', 'star patches', 'star magnets', 'star cookies']);
  let answer = total;
  let prompt = `${who} packs ${thing} in ${rows} rows of ${cols}. How many ${thing} is that?`;
  let explanation = `${rows} rows of ${cols} is ${rows} x ${cols} = ${total}.`;
  const givens = { ask: 'total', extra: 0 };
  if (level === 2) {
    const used = r.int(1, rows - 1);
    answer = (rows - used) * cols;
    givens.ask = 'left';
    givens.extra = used;
    const verb = used === 1 ? 'is' : 'are';
    prompt = `${used} of the ${rows} rows ${verb} sent away. How many ${thing} stay?`;
    explanation = `${rows - used} rows of ${cols} stay: ${answer} ${thing}.`;
  } else if (level >= 3) {
    const more = r.int(1, 3);
    answer = total + more * cols;
    givens.ask = 'more';
    givens.extra = more;
    prompt = `Another tray has ${more} more ${more === 1 ? 'row' : 'rows'} of ${cols}. How many ${thing} are on both trays?`;
    explanation = `This tray has ${total}. The extra ${more === 1 ? 'row adds' : 'rows add'} ${more * cols}. Together that is ${answer}.`;
  }
  return q({
    family,
    prompt: hook(r, prompt),
    answer,
    hint: givens.ask === 'left'
      ? `Count the rows that stay, then multiply by the ${thing} in one row.`
      : givens.ask === 'more'
        ? `Count the ${thing} in this tray, then add the extra rows.`
        : `Multiply the rows by the ${thing} in one row.`,
    explanation,
    givens,
    visual: {
      kind: 'v3-class-3-array', rows, cols,
      description: `${rows} rows with ${cols} ${thing} in each row.`,
    },
    choices: biased(r, answer, [
      { value: rows + cols, code: 'class-3-array-add' },
      { value: total, code: 'missing-step' },
      { value: rows * cols + rows, code: 'wrong-operation' },
      { value: Math.max(0, answer - cols), code: 'remainder-rule' },
    ], { min: 0, max: 999 }),
  });
}

function solveArray(question) {
  const { rows, cols } = question.visual;
  const { ask, extra } = question.proof.givens;
  if (ask === 'total') return rows * cols;
  if (ask === 'left') return (rows - extra) * cols;
  if (ask === 'more') return rows * cols + extra * cols;
  throw new Error('array');
}

function draftBar(family, grade, level, r) {
  const left = r.int(8, 18);
  const right = r.int(8, 18);
  const total = left + right;
  const who = person(r);
  let parts = [
    { name: 'A', value: left, label: barLabel('A', left) },
    { name: 'B', value: right, label: barLabel('B', right, true), unknown: true },
  ];
  let answer = right;
  let caption = `total ${total}`;
  let prompt = `${who} has ${total} crates. Part A shows ${left}. How many are in part B?`;
  let explanation = `${total} - ${left} = ${answer}.`;
  let givens = { ask: 'part' };
  if (level >= 3) {
    parts = [
      { name: 'A', value: left, label: barLabel('A', left) },
      { name: 'B', value: right, label: barLabel('B', right) },
    ];
    answer = Math.abs(left - right);
    caption = '';
    const more = left > right ? 'A' : 'B';
    prompt = `How many more are in part ${more} than in the other part?`;
    explanation = `${Math.max(left, right)} - ${Math.min(left, right)} = ${answer}.`;
    givens = { ask: 'gap' };
  } else if (level === 2) {
    const moved = r.int(2, 5);
    answer = right - moved;
    if (answer < 1) throw new QuestionRetry('bar');
    givens = { ask: 'change', moved };
    prompt = `Part B is unknown. Then ${moved} leave part B. How many stay in B?`;
    explanation = `Part B starts at ${total} - ${left} = ${right}. After ${moved} leave, ${answer} stay.`;
  }
  return q({
    family,
    prompt: hook(r, prompt),
    answer,
    hint: 'The whole bar is the total. Subtract the part you already know.',
    explanation,
    givens,
    visual: {
      kind: 'v3-class-3-bar', total, caption, parts,
      description: level >= 3
        ? `A bar in two parts. Part A is ${left} and part B is ${right}.`
        : `A bar totalling ${total}. Part A is ${left} and part B is marked unknown.`,
    },
    choices: biased(r, answer, [
      { value: left, code: 'ignored-condition' },
      { value: total, code: 'missing-step' },
      { value: left + right, code: 'wrong-operation' },
      { value: answer + 2, code: 'reversed-operation' },
    ], { min: 0, max: 200 }),
  });
}

function solveBar(question) {
  const visual = question.visual;
  const known = visual.parts.filter(part => !part.unknown).reduce((sum, part) => sum + part.value, 0);
  const givens = question.proof.givens;
  if (givens.ask === 'gap') {
    const [first, second] = visual.parts;
    return Math.abs(first.value - second.value);
  }
  const hidden = visual.total - known;
  if (givens.ask === 'part') return hidden;
  if (givens.ask === 'change') return hidden - givens.moved;
  throw new Error('bar');
}

function draftShare(family, grade, level, r) {
  const who = person(r);
  const groups = r.int(2, 9);
  const each = r.int(2, 9);
  const leftover = level === 1 ? 0 : r.int(1, groups - 1);
  const total = groups * each + leftover;
  let answer = each;
  let prompt = `${who} shares ${total} star cards among ${groups} teams. How many cards does each team get?`;
  let explanation = `${total} split by ${groups} is ${each} each.`;
  const givens = { total, groups, leftover, ask: 'each' };
  if (level === 2) {
    answer = leftover;
    givens.ask = 'left';
    prompt = `${total} cards are shared among ${groups} teams until no more full shares fit. How many cards are left over?`;
    explanation = `${groups} x ${each} = ${groups * each}, so ${leftover} ${leftover === 1 ? 'is' : 'are'} left over.`;
  } else if (level >= 3) {
    answer = leftover ? each + 1 : each;
    givens.ask = 'crates';
    prompt = `${total} wheels go in crates of ${groups}. How many crates are needed to hold them all?`;
    explanation = leftover
      ? `${groups} x ${each} = ${groups * each}, with ${leftover} left, so ${answer} crates are needed.`
      : `${total} fills ${groups} crates exactly.`;
  }
  return q({
    family,
    prompt: hook(r, prompt),
    answer,
    hint: 'Share into equal groups first. Then see what the question asks about the leftover.',
    explanation,
    givens,
    choices: biased(r, answer, [
      { value: leftover === 0 ? each + 1 : groups, code: 'remainder-rule' },
      { value: total - groups, code: 'wrong-operation' },
      { value: total, code: 'missing-step' },
      { value: each + leftover, code: 'ignored-condition' },
    ], { min: 0, max: 200 }),
  });
}

function solveShare(question) {
  const { total, groups, leftover, ask } = question.proof.givens;
  if (total !== groups * Math.floor(total / groups) + (total % groups) || leftover !== total % groups) throw new Error('share');
  if (ask === 'each') return Math.floor(total / groups);
  if (ask === 'left') return total % groups;
  if (ask === 'crates') return Math.ceil(total / groups);
  throw new Error('share ask');
}

function columnValue(digits) {
  return Number(digits.map(digit => (digit < 0 ? '0' : digit)).join(''));
}

function columnDigit(visual) {
  const rows = ['top', 'bottom', 'result'];
  const blanks = [];
  rows.forEach(row => visual[row].forEach((digit, index) => { if (digit < 0) blanks.push({ row, index }); }));
  if (blanks.length > 1) throw new Error('column');
  if (blanks.length === 1) {
    const hits = [];
    for (let digit = 0; digit <= 9; digit++) {
      if (blanks[0].index === 0 && digit === 0) continue;
      const filled = Object.fromEntries(rows.map(row => [row, visual[row].map((item, index) => (row === blanks[0].row && index === blanks[0].index ? digit : item))]));
      const top = columnValue(filled.top);
      const bottom = columnValue(filled.bottom);
      const result = columnValue(filled.result);
      if ((visual.op === '+' ? top + bottom : top - bottom) === result) hits.push(digit);
    }
    if (hits.length !== 1) throw new Error('column digit');
    return hits[0];
  }
  const top = columnValue(visual.top);
  const bottom = columnValue(visual.bottom);
  const shown = columnValue(visual.result);
  const real = visual.op === '+' ? top + bottom : top - bottom;
  const width = visual.width;
  const realDigits = digitsOf(real, width);
  const shownDigits = digitsOf(shown, width);
  const diffs = realDigits.map((digit, index) => (digit === shownDigits[index] ? -1 : digit)).filter(digit => digit >= 0);
  if (diffs.length !== 1) throw new Error('column error');
  return diffs[0];
}

function draftColumn(family, grade, level, r) {
  const width = level === 1 ? 2 : 3;
  const op = level === 1 ? '+' : r.pick(['+', '-']);
  const limit = 10 ** width;
  let top = r.int(level === 1 ? 12 : 120, limit - 1);
  const lowBottom = level === 1 ? 11 : 110;
  const highBottom = op === '+' ? limit - top - 1 : top;
  if (highBottom < lowBottom) throw new QuestionRetry('column');
  let bottom = r.int(lowBottom, highBottom);
  if (op === '-' && bottom > top) [top, bottom] = [bottom, top];
  const result = op === '+' ? top + bottom : top - bottom;
  if (result <= 0 || result >= limit || top < 10 ** (width - 1)) throw new QuestionRetry('column');
  const topDigits = digitsOf(top, width);
  const bottomDigits = digitsOf(bottom, width);
  const resultDigits = digitsOf(result, width);
  const spot = level >= 3;
  let hidden = { row: 'result', index: width - 1 };
  if (!spot) hidden = { row: r.pick(['top', 'bottom', 'result']), index: r.int(1, width - 1) };
  const shown = { top: [...topDigits], bottom: [...bottomDigits], result: [...resultDigits] };
  if (spot) {
    const index = r.int(0, width - 1);
    let wrongDigit = (resultDigits[index] + r.int(1, 3)) % 10;
    if (index === 0 && wrongDigit === 0) wrongDigit = 2;
    shown.result[index] = wrongDigit;
  } else {
    shown[hidden.row][hidden.index] = -1;
  }
  const visual = { kind: 'v3-class-3-column', width, op, top: shown.top, bottom: shown.bottom, result: shown.result };
  let answer;
  try {
    answer = columnDigit(visual);
  } catch {
    throw new QuestionRetry('column');
  }
  const place = ['hundreds', 'tens', 'ones'].slice(-width)[spot ? shown.result.findIndex((digit, index) => digit !== resultDigits[index]) : hidden.index];
  const describe = row => row.map(digit => (digit < 0 ? 'hidden' : String(digit))).join(' ');
  return q({
    family,
    prompt: hook(r, spot ? 'One digit in the answer row is wrong. What should that digit be?' : `Which digit is hidden in the ${place} place?`),
    answer,
    hint: 'Work one column at a time and remember a carry or a regroup.',
    explanation: spot
      ? `The columns ${op === '+' ? 'add' : 'subtract'} to ${result}. The wrong digit should be ${answer}.`
      : `The hidden ${place} digit is ${answer}.`,
    givens: { ask: spot ? 'error' : 'blank' },
    visual: {
      ...visual,
      description: `${op === '+' ? 'Addition' : 'Subtraction'} columns. Top ${describe(shown.top)}. Bottom ${describe(shown.bottom)}. Answer ${describe(shown.result)}.`,
    },
    choices: biased(r, answer, [
      { value: (answer + 1) % 10, code: 'class-3-hidden-digit' },
      { value: Math.max(0, answer - 1), code: 'missing-step' },
      { value: (answer + 2) % 10, code: 'wrong-operation' },
      { value: topDigits[width - 1], code: 'face-value' },
    ], { min: 0, max: 9 }),
  });
}

function solveColumn(question) {
  return columnDigit(question.visual);
}

function symbolTotal(shapes, values) {
  return shapes.reduce((sum, shape) => sum + values[shape], 0);
}

function solveSymbols(visual) {
  const known = {};
  let moved = true;
  while (moved) {
    moved = false;
    for (const line of visual.lines) {
      if (line.result < 0) continue;
      const pending = [...new Set(line.shapes.filter(shape => known[shape] == null))];
      if (pending.length > 1) continue;
      if (pending.length === 0) {
        if (symbolTotal(line.shapes, known) !== line.result) throw new Error('symbols');
        continue;
      }
      const shape = pending[0];
      const rest = line.shapes.filter(item => item !== shape).reduce((sum, item) => sum + known[item], 0);
      const count = line.shapes.filter(item => item === shape).length;
      const value = (line.result - rest) / count;
      if (!Number.isInteger(value) || value < 0) throw new Error('symbols');
      if (known[shape] == null) {
        known[shape] = value;
        moved = true;
      } else if (known[shape] !== value) throw new Error('symbols');
    }
  }
  const asked = visual.lines.find(line => line.result < 0);
  if (!asked || asked.shapes.some(shape => known[shape] == null)) throw new Error('symbols');
  return symbolTotal(asked.shapes, known);
}

function draftSymbols(family, grade, level, r) {
  const star = r.int(2, 8);
  const circle = r.int(2, 8);
  const square = r.int(2, 6);
  const lines = [{ shapes: ['star', 'star'], result: star * 2 }];
  if (level >= 2) lines.push({ shapes: ['circle', 'circle'], result: circle * 2 });
  if (level >= 3) lines.push({ shapes: ['square', 'square'], result: square * 2 });
  lines.push({
    shapes: level === 1 ? ['star', 'star', 'star'] : level === 2 ? ['star', 'circle'] : ['star', 'circle', 'square'],
    result: -1,
  });
  const visual = { kind: 'v3-class-3-symbols', lines };
  let answer;
  try {
    answer = solveSymbols(visual);
  } catch {
    throw new QuestionRetry('symbols');
  }
  const linked = level === 1 ? star * 2 : level === 2 ? star * 2 + circle * 2 : star * 2 + circle * 2 + square * 2;
  const words = lines.map(line => `${line.shapes.join(' + ')} = ${line.result < 0 ? 'question mark' : line.result}`);
  return q({
    family,
    prompt: hook(r, r.pick(['What number should replace the question mark?', 'Which number completes the last line?'])),
    answer,
    hint: 'Find one shape from a finished line, then use that value in the next line.',
    explanation: level === 1
      ? `Each star is ${star}. Three stars make ${answer}.`
      : `Star is ${star} and circle is ${circle}${level >= 3 ? `, and square is ${square}` : ''}. The last line is ${answer}.`,
    givens: { shapes: level >= 3 ? 3 : 2 },
    visual: { ...visual, description: `Shape equations. ${words.join('. ')}.` },
    choices: biased(r, answer, [
      { value: linked, code: 'class-3-symbol-link' },
      { value: star + circle, code: 'missing-step' },
      { value: star * circle, code: 'wrong-operation' },
      { value: answer + star, code: 'reversed-operation' },
    ], { min: 0, max: 200 }),
  });
}

const STRIP_THINGS = [
  { name: 'chocolate bar', tone: '#7b4a2d', colour: 'brown' },
  { name: 'ribbon', tone: '#d16b4f', colour: 'coral' },
  { name: 'garden bed', tone: '#4f9a4f', colour: 'green' },
  { name: 'flag', tone: '#29415f', colour: 'navy' },
  { name: 'solar panel', tone: '#3a6ea5', colour: 'blue' },
  { name: 'cake', tone: '#d9739a', colour: 'pink' },
  { name: 'paper strip', tone: '#2f7d78', colour: 'teal' },
  { name: 'rectangle', tone: '#8d79b8', colour: 'purple' },
];

function draftShade(family, grade, level, r) {
  const parts = r.int(level === 1 ? 2 : 4, 8);
  const shaded = r.int(1, parts - 1);
  const way = parts > 5 ? 'cols' : r.pick(['rows', 'cols']);
  const ask = level === 1 ? 'shaded' : level === 2 ? 'open' : 'next';
  const thing = r.pick(STRIP_THINGS);
  if (ask === 'next' && shaded >= parts - 1) throw new QuestionRetry('shade');
  const answerNum = ask === 'open' ? parts - shaded : ask === 'next' ? shaded + 1 : shaded;
  const answer = fractionText(answerNum, parts);
  const prompt = ask === 'shaded'
    ? `What fraction of the ${thing.name} is shaded?`
    : ask === 'open'
      ? `What fraction of the ${thing.name} is not shaded?`
      : `One more part of the ${thing.name} is shaded. What fraction is shaded then?`;
  return q({
    family,
    prompt,
    answer,
    hint: 'The denominator is every equal part. The numerator is the parts the question asks about.',
    explanation: ask === 'open'
      ? `${parts - shaded} of ${parts} parts are open, so the fraction is ${answer}.`
      : `${answerNum} of ${parts} equal parts are shaded.`,
    givens: { ask },
    visual: {
      kind: 'v3-class-3-shade', parts, shaded, way, tone: thing.tone,
      description: `A ${thing.name} split into ${parts} equal ${way}. ${shaded === 1 ? '1 part is' : `${shaded} parts are`} shaded ${thing.colour}. Every part has one dot.`,
    },
    choices: biased(r, answerNum, [
      { value: parts - answerNum, code: 'fraction-complement' },
      { value: Math.min(parts, answerNum + 1), code: 'missing-step' },
      { value: shaded, code: 'whole-parts' },
      { value: Math.max(0, answerNum - 1), code: 'fraction-denominator' },
    ], { min: 0, max: parts }).map(choice => ({ ...choice, value: fractionText(Number(choice.value), parts) })),
  });
}

function solveShade(question) {
  const { parts, shaded } = question.visual;
  const ask = question.proof.givens.ask;
  if (ask === 'shaded') return fractionText(shaded, parts);
  if (ask === 'open') return fractionText(parts - shaded, parts);
  return fractionText(shaded + 1, parts);
}

const SET_ITEMS = [
  { name: 'berries', tone: '#c2415d' },
  { name: 'stars', tone: '#e0b14a' },
  { name: 'shells', tone: '#d9a58a' },
  { name: 'apples', tone: '#5fa84a' },
  { name: 'beads', tone: '#8d79b8' },
  { name: 'marbles', tone: '#3a6ea5' },
  { name: 'cookies', tone: '#a9713f' },
  { name: 'buttons', tone: '#d16b4f' },
];

function draftGroups(family, grade, level, r) {
  const groups = r.int(2, 5);
  const each = r.int(2, 6);
  const num = level === 1 ? 1 : r.int(1, groups - 1);
  const taken = num * each;
  const extra = level >= 3 ? r.int(1, taken - 1) : 0;
  const answer = taken - extra;
  const who = person(r);
  const item = r.pick(SET_ITEMS);
  const prompt = level >= 3
    ? `${who} takes ${num}/${groups} of the ${item.name}, then gives away ${extra}. How many ${item.name} stay with ${who}?`
    : `How many ${item.name} is ${num}/${groups} of this set?`;
  return q({
    family,
    prompt,
    answer,
    hint: 'Find one equal group first, then take the numerator of those groups.',
    explanation: extra
      ? `${num}/${groups} of ${groups * each} is ${taken}. After giving away ${extra}, ${answer} stay.`
      : `${num} group${num === 1 ? '' : 's'} of ${each} is ${answer}.`,
    givens: { num, extra },
    visual: {
      kind: 'v3-class-3-groups', groups, each, tone: item.tone,
      description: `${groups} equal boxes with ${each} ${item.name} in each box.`,
    },
    choices: biased(r, answer, [
      { value: groups * each, code: 'whole-parts' },
      { value: taken, code: 'changed-whole' },
      { value: num * groups, code: 'fraction-denominator' },
      { value: each, code: 'missing-step' },
    ], { min: 0, max: 80 }),
  });
}

function solveGroups(question) {
  const { groups, each } = question.visual;
  const { num, extra } = question.proof.givens;
  return num * each - extra;
}

function draftFractionLine(family, grade, level, r) {
  const parts = r.int(4, 10);
  const first = r.int(1, parts - 3);
  const second = r.int(first + 2, parts - 1);
  const marks = [first, second];
  const [nameA, nameB] = r.pick([['A', 'B'], ['P', 'Q'], ['M', 'N'], ['X', 'Y']]);
  const ask = level === 1 ? 'A' : level === 2 ? 'gap' : 'larger';
  const answerNum = ask === 'A' ? first : ask === 'gap' ? second - first : second;
  const answer = fractionText(answerNum, parts);
  const prompt = ask === 'A'
    ? `What fraction of the line is arrow ${nameA} pointing to?`
    : ask === 'gap'
      ? `What fraction of the whole line is the gap from ${nameA} to ${nameB}?`
      : `What fraction names the mark farther from 0, ${nameA} or ${nameB}?`;
  return q({
    family,
    prompt,
    answer,
    hint: 'Count equal gaps from 0. The last mark is 1 whole.',
    explanation: ask === 'gap'
      ? `${nameB} is ${second}/${parts} and ${nameA} is ${first}/${parts}. The gap is ${answer}.`
      : `The farther mark is ${second} of ${parts} equal gaps, so ${answer}.`,
    givens: { ask },
    visual: {
      kind: 'v3-class-3-fline', parts, marks, names: [nameA, nameB],
      description: `A line from 0 to 1 split into ${parts} equal gaps. Arrow ${nameA} is at gap ${first} and arrow ${nameB} is at gap ${second}.`,
    },
    choices: biased(r, answerNum, [
      { value: ask === 'gap' ? second : first, code: 'fraction-denominator' },
      { value: parts - answerNum, code: 'fraction-complement' },
      { value: Math.min(parts, answerNum + 1), code: 'missing-step' },
      { value: Math.max(0, answerNum - 1), code: 'scale-interval' },
    ], { min: 0, max: parts }).map(choice => ({ ...choice, value: fractionText(Number(choice.value), parts) })),
  });
}

function solveFractionLine(question) {
  const { parts, marks } = question.visual;
  const [first, second] = marks;
  const ask = question.proof.givens.ask;
  if (ask === 'A') return fractionText(first, parts);
  if (ask === 'gap') return fractionText(second - first, parts);
  return fractionText(Math.max(first, second), parts);
}

function barChoice(shaded, parts, tone, colour) {
  return {
    value: `${shaded} of ${parts} shaded`,
    visual: {
      kind: 'v3-class-3-fbar', compact: true, shaded, parts, tone,
      description: `${shaded} of ${parts} equal parts are shaded ${colour}.`,
    },
  };
}

function draftEqualBars(family, grade, level, r) {
  const pairs = level === 1 ? [[1, 2], [1, 3], [1, 4], [2, 5], [1, 5], [1, 6]] : level === 2 ? [[2, 3], [3, 4], [2, 4], [3, 5], [2, 6], [4, 6], [3, 6]] : [[2, 3], [3, 4], [1, 3], [1, 4], [3, 5], [5, 6], [2, 5]];
  const thing = r.pick(STRIP_THINGS);
  const fits = [];
  for (const [num, den] of pairs) {
    for (const scale of [2, 3, 4]) {
      const parts = den * scale;
      if (parts > 12) continue;
      let wrongCount = 0;
      for (let value = 1; value < parts; value++) if (!equivalent(value, parts, num, den)) wrongCount++;
      if (wrongCount >= 3) fits.push([num, den, scale]);
    }
  }
  const [baseNum, baseDen, scale] = r.pick(fits);
  const parts = baseDen * scale;
  const shaded = baseNum * scale;
  const correct = barChoice(shaded, parts, thing.tone, thing.colour);
  const wrongs = [];
  for (let value = 1; value < parts; value++) {
    if (equivalent(value, parts, baseNum, baseDen)) continue;
    wrongs.push({ ...barChoice(value, parts, thing.tone, thing.colour), code: value === baseNum ? 'class-3-not-same-amount' : 'fraction-denominator' });
  }
  const custom = wrongs.find(item => item.code === 'class-3-not-same-amount') || wrongs[0];
  if (custom) custom.code = 'class-3-not-same-amount';
  const chosen = [custom, ...r.shuffle(wrongs.filter(item => item !== custom))].filter(Boolean).slice(0, 3);
  if (chosen.length < 3) throw new QuestionRetry('bars');
  return q({
    family,
    prompt: `Which ${thing.name} has the same shaded amount as ${baseNum}/${baseDen}?`,
    answer: correct.value,
    hint: 'Match the shaded amount of the whole, even if the cuts are different.',
    explanation: `${shaded} of ${parts} is the same amount as ${baseNum}/${baseDen}.`,
    givens: { num: baseNum, den: baseDen },
    choices: pictureChoices(correct.value, correct.visual, chosen.map(item => wrong(item.value, item.code, item.visual))),
  });
}

function solveEqualBars(question) {
  matchPictures(question, visual => `${visual.shaded} of ${visual.parts} shaded`);
  const { num, den } = question.proof.givens;
  const hits = question.optionVisuals.filter(visual => equivalent(visual.shaded, visual.parts, num, den));
  if (hits.length !== 1) throw new Error('equal bars');
  return `${hits[0].shaded} of ${hits[0].parts} shaded`;
}

function draftFractionTrue(family, grade, level, r) {
  const who = person(r);
  if (level === 1) {
    const den = r.pick([2, 4, 6, 8]);
    const num = den / 2;
    const total = den * r.int(2, 4);
    const eaten = total / den * num;
    const answer = `Ate ${eaten} berries`;
    const pairs = [1, 2, 3].map(step => [`Ate ${eaten + step * (total / den)} berries`, step === 1 ? 'fraction-complement' : 'whole-parts']);
    return q({
      family,
      prompt: hook(r, `${who} has ${total} berries and eats ${num}/${den} of them. Which sentence is true?`),
      answer,
      hint: 'Find one equal share of the berries, then take the numerator.',
      explanation: `${num}/${den} of ${total} is ${eaten}.`,
      givens: { total, num, den, ask: 'eat' },
      choices: say(answer, pairs),
    });
  }
  if (level === 2) {
    const den = r.pick([4, 5, 6, 7, 8, 9, 10]);
    const low = r.int(1, den - 2);
    const high = low + r.int(1, den - low - 1);
    const bigger = r.int(0, 1) === 1;
    const answer = bigger ? `${high}/${den} is more` : `${low}/${den} is less`;
    return q({
      family,
      prompt: `Which sentence about ${low}/${den} and ${high}/${den} is true?`,
      answer,
      hint: 'The denominators match, so compare the numerators.',
      explanation: `${low} is smaller than ${high}, so ${low}/${den} is less and ${high}/${den} is more.`,
      givens: { low, high, den, ask: bigger ? 'more' : 'less' },
      choices: say(answer, bigger
        ? [
          [`${low}/${den} is more`, 'fraction-denominator'],
          [`${den}/${den} is more`, 'whole-parts'],
          [`${high}/${den} is same`, 'fraction-complement'],
        ]
        : [
          [`${high}/${den} is less`, 'fraction-denominator'],
          [`${den}/${den} is less`, 'whole-parts'],
          [`${low}/${den} is same`, 'fraction-complement'],
        ]),
    });
  }
  const den = r.pick([4, 5, 6, 8]);
  const num = r.int(1, den - 1);
  const total = den * r.int(2, 4);
  const eaten = total / den * num;
  const left = total - eaten;
  const answer = `Left with ${left}`;
  return q({
    family,
    prompt: hook(r, `${total} berries are in a crate. ${who} eats ${num}/${den} of them. Which sentence is true?`),
    answer,
    hint: 'Subtract the eaten berries from the whole crate.',
    explanation: `${who} eats ${eaten}, so ${left} berries are left.`,
    givens: { total, num, den, ask: 'left' },
    choices: say(answer, [
      [`Left with ${eaten}`, 'fraction-complement'],
      [`Left with ${total}`, 'ignored-change'],
      [`Left with ${Math.max(0, left - total / den)}`, 'missing-step'],
    ]),
  });
}

function solveFractionTrue(question) {
  const givens = question.proof.givens;
  if (givens.ask === 'eat') return `Ate ${givens.total / givens.den * givens.num} berries`;
  if (givens.ask === 'less') return `${givens.low}/${givens.den} is less`;
  if (givens.ask === 'more') return `${givens.high}/${givens.den} is more`;
  if (givens.ask === 'left') return `Left with ${givens.total - givens.total / givens.den * givens.num}`;
  throw new Error('fraction statement');
}

export const DRAFT = {
  'class-3-bead-count': draftBeads,
  'class-3-block-match': draftBlocks,
  'class-3-line-mark': draftLine,
  'class-3-clue-lock': draftLock,
  'class-3-digit-cards': draftCards,
  'class-3-rule-box': draftRule,
  'class-3-array-trays': draftArray,
  'class-3-bar-story': draftBar,
  'class-3-share-left': draftShare,
  'class-3-column-gap': draftColumn,
  'class-3-symbol-sum': draftSymbols,
  'class-3-shade-read': draftShade,
  'class-3-group-share': draftGroups,
  'class-3-fraction-line': draftFractionLine,
  'class-3-equal-bars': draftEqualBars,
  'class-3-fraction-true': draftFractionTrue,
};

export const SOLVE = {
  'class-3-bead-count': solveBeads,
  'class-3-block-match': solveBlocks,
  'class-3-line-mark': solveLine,
  'class-3-clue-lock': solveLock,
  'class-3-digit-cards': solveCards,
  'class-3-rule-box': solveRule,
  'class-3-array-trays': solveArray,
  'class-3-bar-story': solveBar,
  'class-3-share-left': solveShare,
  'class-3-column-gap': solveColumn,
  'class-3-symbol-sum': question => solveSymbols(question.visual),
  'class-3-shade-read': solveShade,
  'class-3-group-share': solveGroups,
  'class-3-fraction-line': solveFractionLine,
  'class-3-equal-bars': solveEqualBars,
  'class-3-fraction-true': solveFractionTrue,
};
