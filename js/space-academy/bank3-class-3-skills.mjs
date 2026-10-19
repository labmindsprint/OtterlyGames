// Class 3 number and operation families written after real SOF Class 3 papers: ordering digits, missing numbers,
// clue puzzles, word problems with 3- and 4-digit numbers, ages and order of operations.
import { QuestionRetry } from './bank-shared.mjs';
import { NAMES, person } from './bank3-class-3-helpers.mjs';
import { count, digitSum, numberQ, permutations, sum, textQ, words } from './bank3-class-3-kit.mjs';

const BOYS = ['Arun', 'Leo', 'Omar', 'Dev', 'Kiran', 'Rohan', 'Kabir', 'Sam'];
const GIRLS = ['Mira', 'Zara', 'Nia', 'Priya', 'Tara', 'Anya', 'Meera', 'Isha'];
const ITEMS = ['stamps', 'beads', 'stickers', 'marbles', 'pencils', 'books', 'coins', 'shells'];
const byRank = (nums, ask) => {
  const sorted = [...nums].sort((a, b) => b - a);
  return { greatest: sorted[0], smallest: sorted[sorted.length - 1], 'second greatest': sorted[1], 'second smallest': sorted[sorted.length - 2] }[ask];
};

function draftOrderDigits(family, grade, level, r) {
  const width = level === 1 ? 3 : 4;
  const digits = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, width);
  const pool = r.shuffle(permutations(digits).map(list => Number(list.join(''))));
  const mode = level === 1 ? 'pick' : r.pick(['pick', 'arrange']);
  if (mode === 'pick') {
    const nums = pool.slice(0, 4);
    const ask = r.pick(level === 3 ? ['greatest', 'smallest', 'second greatest', 'second smallest'] : ['greatest', 'smallest']);
    const answer = byRank(nums, ask);
    return textQ({
      family,
      prompt: `Which is the ${ask} number: ${nums.join(', ')}?`,
      answer,
      hint: 'Compare the digits from the left. The first place that differs decides.',
      explanation: `Comparing place by place from the left, the ${ask} number is ${answer}.`,
      givens: { mode, nums, ask },
      wrongs: nums.filter(value => value !== answer).map(value => [value, 'place-shift']),
    });
  }
  const nums = pool.slice(0, level === 3 ? 4 : 3);
  const ascending = r.pick([true, false]);
  const order = list => [...list].sort((a, b) => (ascending ? a - b : b - a));
  const answer = order(nums).join(', ');
  const reversed = [...order(nums)].reverse().join(', ');
  const others = permutations(nums).map(list => list.join(', ')).filter(text => text !== answer && text !== reversed);
  return textQ({
    family,
    prompt: `Arrange ${r.shuffle(nums).join(', ')} from ${ascending ? 'smallest to greatest' : 'greatest to smallest'}.`,
    answer,
    hint: ascending ? 'Find the smallest first. Compare digits from the left.' : 'Find the greatest first. Compare digits from the left.',
    explanation: `From ${ascending ? 'smallest to greatest' : 'greatest to smallest'}: ${answer}.`,
    givens: { mode, nums, ascending },
    wrongs: [[reversed, 'class-3-order-direction'], ...r.shuffle(others).slice(0, 3).map(text => [text, 'place-shift'])],
  });
}

function solveOrderDigits(question) {
  const { mode, nums, ask, ascending } = question.proof.givens;
  if (mode === 'pick') return byRank(nums, ask);
  return [...nums].sort((a, b) => (ascending ? a - b : b - a)).join(', ');
}

const SIGN = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const forward = (value, [op, k]) => (op === '+' ? value + k : op === '-' ? value - k : op === '*' ? value * k : value / k);
const backward = (value, [op, k]) => (op === '+' ? value - k : op === '-' ? value + k : op === '*' ? value / k : value * k);

function draftBoxChain(family, grade, level, r) {
  let x;
  const steps = [];
  if (level === 1) {
    const op = r.pick(['+', '-', '*', '/']);
    const k = op === '+' || op === '-' ? r.int(11, 79) : r.int(3, 9);
    x = op === '/' ? k * r.int(4, 15) : op === '-' ? k + r.int(5, 60) : r.int(op === '*' ? 4 : 5, op === '*' ? 15 : 90);
    steps.push([op, k]);
  } else {
    const first = level === 3 ? '/' : r.pick(['*', '/']);
    const k = r.int(2, 9);
    x = first === '/' ? k * r.int(5, level === 3 ? 40 : 60) : r.int(12, 99);
    steps.push([first, k]);
    let value = forward(x, steps[0]);
    if (level === 3) {
      const m = r.int(2, 9);
      steps.push(['*', m]);
      value = forward(value, steps[1]);
    }
    const op = r.pick(['+', '-']);
    steps.push([op, op === '-' ? r.int(2, Math.min(60, value - 2)) : r.int(2, 60)]);
  }
  const result = steps.reduce(forward, x);
  const chain = steps.map(([op, k], index) => `${index ? ' ' : ''}${index ? '' : '? '}${SIGN[op]} ${k}`).join('');
  const undo = steps.reduceRight(backward, result);
  const forwardOrder = steps.reduce(backward, result);
  const skip = steps.filter(([op]) => op === '+' || op === '-').reduceRight(backward, result);
  const flipped = steps.map(([op, k]) => [op === '+' || op === '-' ? (op === '+' ? '-' : '+') : op, k]).reduceRight(backward, result);
  return numberQ(r, {
    family,
    prompt: `Find the number that makes this true: ${chain} = ${result}`,
    answer: undo,
    hint: 'Work backwards. Undo the last step first.',
    explanation: `Undo each step from the end. ${steps.length > 1 ? 'The first step is undone last. ' : ''}The number is ${undo}.`,
    givens: { steps, result },
    wrongs: [[skip, 'missing-step'], [forwardOrder, 'reversed-operation'], [flipped, 'reversed-operation']],
    min: 1, max: 99999,
  });
}

const solveBoxChain = question => question.proof.givens.steps.reduceRight(backward, question.proof.givens.result);

function draftPlaceFill(family, grade, level, r) {
  const kinds = level === 1 ? ['digit', 'value', 'tens-and'] : level === 2 ? ['digit', 'value', 'tens-in', 'hundreds-in'] : ['value', 'tens-in', 'hundreds-in', 'tens-and', 'digit'];
  const kind = r.pick(kinds);
  const long = level > 1 && kind !== 'tens-and';
  const d = Array.from({ length: long ? 4 : 3 }, () => r.int(1, 9));
  const n = Number(d.join(''));
  const hole = d.length - 2;
  if (kind === 'tens-and') {
    const tens = r.int(level === 1 ? 12 : 120, level === 1 ? 98 : 480);
    const ones = r.int(1, 9);
    const answer = tens * 10 + ones;
    return numberQ(r, {
      family,
      prompt: `${count(tens, 'ten')} and ${count(ones, 'one')} make which number?`,
      answer,
      hint: 'A ten is worth 10. Change the tens into ones, then add the ones.',
      explanation: `${count(tens, 'ten')} is ${tens * 10}. Add ${count(ones, 'one')}: ${answer}.`,
      givens: { kind, tens, ones },
      wrongs: [[tens + ones, 'face-value'], [tens * 100 + ones, 'place-shift'], [tens * 10 + ones * 10, 'place-shift']],
      min: 1, max: 99999,
    });
  }
  if (kind === 'tens-in' || kind === 'hundreds-in') {
    const unit = kind === 'tens-in' ? 10 : 100;
    const answer = Math.floor(n / unit);
    return numberQ(r, {
      family,
      prompt: `How many ${kind === 'tens-in' ? 'tens' : 'hundreds'} are there in ${n}?`,
      answer,
      hint: `Think how many groups of ${unit} fit into the number.`,
      explanation: `${n} ÷ ${unit} is ${answer} with some left over, so there are ${answer} ${kind === 'tens-in' ? 'tens' : 'hundreds'}.`,
      givens: { kind, n },
      wrongs: [[d[kind === 'tens-in' ? d.length - 2 : d.length - 3], 'face-value'], [Math.floor(n / (unit * 10)), 'place-shift'], [n % unit === 0 ? answer + 1 : Math.floor(n / unit) * 10, 'place-shift']],
      min: 1, max: 9999,
    });
  }
  const parts = d.map((digit, index) => digit * 10 ** (d.length - 1 - index));
  if (kind === 'digit') {
    const shown = parts.map((value, index) => (index === hole ? '? × 10' : `${d[index]} × ${10 ** (d.length - 1 - index)}`)).join(' + ');
    return numberQ(r, {
      family,
      prompt: `Fill in the missing digit: ${shown} = ${n}`,
      answer: d[hole],
      hint: 'Each digit is multiplied by its place value. Look at the tens place in the number.',
      explanation: `${n} has ${d[hole]} in the tens place, so ? is ${d[hole]}.`,
      givens: { kind, n, hole },
      wrongs: [[d[hole] * 10, 'face-value'], [d[d.length - 1], 'class-3-digit-swap'], [d[hole - 1], 'class-3-digit-swap']],
      min: 1, max: 999,
    });
  }
  const shown = parts.map((value, index) => (index === hole ? '?' : String(value))).join(' + ');
  return numberQ(r, {
    family,
    prompt: `Fill in the missing number: ${n} = ${shown}`,
    answer: parts[hole],
    hint: 'Split the number by place. Say the value of the tens digit.',
    explanation: `The tens digit of ${n} is ${d[hole]}, worth ${parts[hole]}. So ? is ${parts[hole]}.`,
    givens: { kind, n, hole },
    wrongs: [[d[hole], 'face-value'], [d[hole] * 100, 'place-shift'], [d[hole] * 1000, 'place-shift']],
    min: 1, max: 9999,
  });
}

function solvePlaceFill(question) {
  const g = question.proof.givens;
  if (g.kind === 'tens-and') return g.tens * 10 + g.ones;
  if (g.kind === 'tens-in') return Math.floor(g.n / 10);
  if (g.kind === 'hundreds-in') return Math.floor(g.n / 100);
  const digit = Number(String(g.n)[g.hole]);
  return g.kind === 'digit' ? digit : digit * 10 ** (String(g.n).length - 1 - g.hole);
}

function draftRound(family, grade, level, r) {
  const kinds = level === 1 ? ['step', 'ten'] : level === 2 ? ['step', 'ten', 'hundred'] : ['step', 'hundred', 'thousand', 'step'];
  const kind = r.pick(kinds);
  if (kind === 'step') {
    const unit = r.pick(level === 1 ? [10, 100] : [10, 100, 1000]);
    const up = r.pick([true, false]);
    const n = level === 3 ? r.pick([2990, 3999, 4990, 5000, 6900, 7099, 8000, 9990]) + r.int(0, 3) * 10 : r.int(level === 1 ? 120 : 1200, level === 1 ? 890 : 8800);
    const answer = up ? n + unit : n - unit;
    if (answer < 100 || answer > 9999) throw new QuestionRetry('out of range');
    return numberQ(r, {
      family,
      prompt: `What is ${unit} ${up ? 'more' : 'less'} than ${n}?`,
      answer,
      hint: `Change only the digit in the ${unit === 10 ? 'tens' : unit === 100 ? 'hundreds' : 'thousands'} place, and regroup if needed.`,
      explanation: `${n} ${up ? '+' : '−'} ${unit} = ${answer}.`,
      givens: { kind, n, unit, up },
      wrongs: [[up ? n + unit / 10 : n - unit / 10, 'place-shift'], [up ? n + unit * 10 : n - unit * 10, 'place-shift'], [up ? n - unit : n + unit, 'time-direction']],
      min: 1, max: 9999,
    });
  }
  const unit = { ten: 10, hundred: 100, thousand: 1000 }[kind];
  let n;
  do n = r.int(level === 1 ? 101 : 1001, level === 1 ? 989 : 9989); while (n % unit === 0 || (n % unit) * 2 === unit);
  const answer = Math.round(n / unit) * unit;
  const down = Math.floor(n / unit) * unit;
  const up = down + unit;
  return numberQ(r, {
    family,
    prompt: `Round ${n} to the nearest ${kind}.`,
    answer,
    hint: `Look at the digit to the right of the ${kind}s place. 5 or more rounds up.`,
    explanation: `${n} is between ${down} and ${up}. It is nearer to ${answer}.`,
    givens: { kind, n, unit },
    wrongs: [[answer === down ? up : down, 'missing-step'], [Math.round(n / (unit * 10)) * unit * 10, 'place-shift'], [Math.round(n / (unit / 10)) * (unit / 10), 'place-shift']],
    min: 1, max: 10000,
  });
}

function solveRound(question) {
  const g = question.proof.givens;
  if (g.kind === 'step') return g.up ? g.n + g.unit : g.n - g.unit;
  return Math.round(g.n / g.unit) * g.unit;
}

const CLUE = {
  sum: (n, v) => digitSum(n) === v,
  tens: (n, v) => Math.floor(n / 10) % 10 === v,
  ones: (n, v) => n % 10 === v,
  hundreds: (n, v) => Math.floor(n / 100) % 10 === v,
  even: n => n % 2 === 0,
  odd: n => n % 2 === 1,
  less: (n, v) => n < v,
  more: (n, v) => n > v,
  multiple: (n, v) => n % v === 0,
};
const clueIs = (clue, voice) => {
  const me = voice === 'me';
  return {
    sum: me ? `My digits add up to ${clue.v}` : `has digits that add up to ${clue.v}`,
    tens: me ? `My tens digit is ${clue.v}` : `has ${clue.v} in the tens place`,
    ones: me ? `My ones digit is ${clue.v}` : `has ${clue.v} in the ones place`,
    hundreds: me ? `My hundreds digit is ${clue.v}` : `has ${clue.v} in the hundreds place`,
    even: me ? 'I am an even number' : 'is even',
    odd: me ? 'I am an odd number' : 'is odd',
    less: me ? `I am less than ${clue.v}` : `is less than ${clue.v}`,
    more: me ? `I am more than ${clue.v}` : `is more than ${clue.v}`,
    multiple: me ? `I am a multiple of ${clue.v}` : `is a multiple of ${clue.v}`,
  }[clue.kind];
};
const fits = (n, clues) => clues.every(clue => CLUE[clue.kind](n, clue.v));
const passed = (n, clues) => clues.filter(clue => CLUE[clue.kind](n, clue.v)).length;

function clueMenu(n) {
  const menu = [
    { kind: 'sum', v: digitSum(n) }, { kind: 'tens', v: Math.floor(n / 10) % 10 }, { kind: 'ones', v: n % 10 },
    { kind: n % 2 ? 'odd' : 'even', v: 0 },
    { kind: 'less', v: Math.ceil((n + 1) / 100) * 100 }, { kind: 'more', v: Math.floor((n - 1) / 100) * 100 },
  ];
  if (n % 5 === 0) menu.push({ kind: 'multiple', v: 5 });
  if (n % 3 === 0) menu.push({ kind: 'multiple', v: 3 });
  return menu;
}

function draftWhichNumber(family, grade, level, r) {
  const long = level === 3;
  const low = long ? 1000 : 100;
  const high = long ? 9999 : 999;
  const ask = level === 1 ? 'am' : r.pick(['am', 'not', 'not']);
  const target = r.int(low + 50, high - 50);
  const menu = r.shuffle(clueMenu(target));
  const clues = menu.slice(0, ask === 'am' ? 3 : 2);
  if (new Set(clues.map(clue => clue.kind)).size !== clues.length) throw new QuestionRetry('repeated clue');
  const digits = long ? '4-digit' : '3-digit';
  let options;
  let answer;
  let prompt;
  let near;
  if (ask === 'am') {
    near = [];
    for (let tries = 0; tries < 400 && near.length < 3; tries++) {
      const n = r.int(low, high);
      if (n !== target && !near.includes(n) && passed(n, clues) === 2) near.push(n);
    }
    if (near.length < 3) throw new QuestionRetry('not enough near misses');
    answer = target;
    options = [target, ...near];
    prompt = `I am a ${digits} number. ${clues.map(clue => `${clueIs(clue, 'me')}.`).join(' ')} Which number am I?`;
  } else {
    const fit = [];
    for (let n = low; n <= high; n += 1) if (fits(n, clues)) fit.push(n);
    if (fit.length < 6) throw new QuestionRetry('clues too tight');
    const good = r.shuffle(fit).slice(0, 3);
    let miss = null;
    for (let tries = 0; tries < 400 && miss === null; tries++) {
      const n = r.int(low, high);
      if (passed(n, clues) === clues.length - 1) miss = n;
    }
    if (miss === null) throw new QuestionRetry('no near miss');
    answer = miss;
    options = [...good, miss];
    near = good;
    prompt = `A ${digits} number ${clues.map(clue => clueIs(clue, 'it')).join(' and ')}. Which of these can NOT be that number?`;
  }
  const shown = r.shuffle(options);
  const keep = ask === 'am' ? target : answer;
  return textQ({
    family,
    prompt: ask === 'am' ? prompt : `${prompt} ${shown.join(', ')}`,
    answer: keep,
    hint: ask === 'am' ? 'Test each number against every clue. Cross out numbers that break one.' : 'Three numbers fit every clue. Find the one that breaks a clue.',
    explanation: ask === 'am' ? `${answer} is the only number that fits every clue.` : `${answer} breaks a clue. The other three numbers fit them all.`,
    givens: { ask, clues },
    wrongs: (ask === 'am' ? near : near).map(value => [value, 'ignored-condition']),
    options: shown,
  });
}

function solveWhichNumber(question) {
  const { ask, clues } = question.proof.givens;
  const nums = question.options.map(option => Number(option));
  const hits = nums.filter(n => (ask === 'am' ? fits(n, clues) : !fits(n, clues)));
  if (hits.length !== 1) throw new Error('clue numbers');
  return hits[0];
}

const swapAdjacent = (n, at) => {
  const list = String(n).split('');
  [list[at], list[at + 1]] = [list[at + 1], list[at]];
  return Number(list.join(''));
};

function zeroNumber(r) {
  const holes = r.shuffle([1, 2, 3]).slice(0, r.int(1, 2));
  return Number(Array.from({ length: 4 }, (_, index) => (holes.includes(index) ? 0 : r.int(1, 9))).join(''));
}

function draftNumberWords(family, grade, level, r) {
  const toNumber = level === 1 || r.int(0, 1) === 1;
  const target = level === 1 ? r.pick([r.int(100, 999), r.int(1000, 9999)]) : zeroNumber(r);
  const text = String(target);
  const swaps = [];
  for (let index = 0; index < text.length - 1; index++) {
    const swapped = swapAdjacent(target, index);
    if (swapped !== target && String(swapped).length === text.length && !swaps.some(([value]) => value === swapped)) {
      swaps.push([swapped, text[index] === '0' || text[index + 1] === '0' ? 'ignored-zero' : 'class-3-digit-swap']);
    }
  }
  if (toNumber) {
    const alts = [...swaps, [target * 10, 'place-shift']];
    if (text.includes('0')) alts.push([Number(text.replaceAll('0', '')), 'ignored-zero']);
    return numberQ(r, {
      family,
      prompt: `Which number is written as ${words(target)}?`,
      answer: target,
      hint: 'Write each part in its place. Use 0 for a place that is not named.',
      explanation: `${words(target)} is written ${target}.`,
      givens: { toNumber, target },
      wrongs: alts,
      min: 100, max: 99999,
    });
  }
  return textQ({
    family,
    prompt: `Which shows ${target} in words?`,
    answer: words(target),
    hint: 'Say the number in groups: thousands first, then hundreds, tens and ones.',
    explanation: `${target} is read ${words(target)}.`,
    givens: { toNumber, target },
    wrongs: swaps.map(([value, code]) => [words(value), code]),
  });
}

const solveNumberWords = question => (question.proof.givens.toNumber ? question.proof.givens.target : words(question.proof.givens.target));

function draftNumberFacts(family, grade, level, r) {
  const kind = r.pick(level === 1 ? ['odd-sum', 'multiples', 'greatest'] : ['odd-sum', 'multiples', 'greatest', 'smallest', 'digit-sum']);
  if (kind === 'odd-sum') {
    const from = r.int(level === 1 ? 10 : 20, 90);
    const to = from + r.int(5, 12);
    const list = [];
    for (let n = from; n <= to; n++) if (n % 2) list.push(n);
    if (list.length < 3) throw new QuestionRetry('too few');
    const answer = sum(list);
    return numberQ(r, {
      family,
      prompt: `What is the sum of all the odd numbers from ${from} to ${to}?`,
      answer,
      hint: 'List the odd numbers one by one, then add them.',
      explanation: `The odd numbers are ${list.join(', ')}. Their sum is ${answer}.`,
      givens: { kind, from, to },
      wrongs: [[sum(Array.from({ length: to - from + 1 }, (_, index) => from + index)), 'wrong-operation'], [answer - list[0] + list[list.length - 1] + 2, 'missing-step'], [answer + list[0], 'included-extra']],
      min: 10, max: 9999,
    });
  }
  if (kind === 'multiples') {
    const m = r.pick([3, 4, 5, 6, 7, 8, 9]);
    const from = r.int(10, 40);
    const to = from + r.int(30, 80);
    let total = 0;
    for (let n = from; n <= to; n++) if (n % m === 0) total++;
    return numberQ(r, {
      family,
      prompt: `How many multiples of ${m} are there from ${from} to ${to}?`,
      answer: total,
      hint: `Find the first multiple of ${m} in the range. Then keep adding ${m}.`,
      explanation: `Count the numbers ${m}, ${m * 2}, ${m * 3} and so on that fall from ${from} to ${to}. There are ${total}.`,
      givens: { kind, m, from, to },
      wrongs: [[Math.floor((to - from) / m), 'counted-endpoints'], [Math.floor((to - from) / m) + 2, 'counted-endpoints'], [Math.floor(to / m), 'missing-step']],
      min: 1, max: 99,
    });
  }
  const pool = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, level === 1 ? 3 : 4);
  if (kind === 'digit-sum') {
    const target = r.int(7, 16);
    let answer = null;
    for (let n = 100; n < 1000 && answer === null; n++) if (digitSum(n) === target) answer = n;
    return numberQ(r, {
      family,
      prompt: `What is the smallest 3-digit number whose digits add up to ${target}?`,
      answer,
      hint: 'Keep the hundreds digit as small as you can. Put the rest of the sum in the ones place.',
      explanation: `Start with 1 hundred. The other two digits must add up to ${target - 1}. The smallest number is ${answer}.`,
      givens: { kind, target },
      wrongs: [[Number(String(answer).split('').reverse().join('')), 'class-3-digit-swap'], [answer + 9, 'missing-step'], [swapAdjacent(answer, 1), 'class-3-digit-swap'], [answer + 18, 'missing-step']],
      min: 100, max: 999,
    });
  }
  const sorted = [...pool].sort((a, b) => (kind === 'greatest' ? b - a : a - b));
  if (kind === 'smallest' && sorted[0] === 0) [sorted[0], sorted[1]] = [sorted[1], sorted[0]];
  const answer = Number(sorted.join(''));
  const alts = [];
  const wrongOrder = Number([...pool].sort((a, b) => (kind === 'greatest' ? a - b : b - a)).join(''));
  alts.push([wrongOrder, 'class-3-order-direction']);
  if (kind === 'smallest') alts.push([Number([...pool].sort((a, b) => a - b).join('')), 'ignored-zero']);
  alts.push([swapAdjacent(answer, 1), 'class-3-digit-swap'], [swapAdjacent(answer, 0), 'class-3-digit-swap']);
  return numberQ(r, {
    family,
    prompt: `Use each digit ${pool.join(', ')} once. What is the ${kind} ${pool.length}-digit number you can make?`,
    answer,
    hint: kind === 'greatest' ? 'Put the biggest digit in the biggest place.' : 'Put the smallest digit first. A number cannot start with 0.',
    explanation: `The ${kind} number made from ${pool.join(', ')} is ${answer}.`,
    givens: { kind, pool },
    wrongs: alts,
    min: 100, max: 9999,
  });
}

function solveNumberFacts(question) {
  const g = question.proof.givens;
  if (g.kind === 'odd-sum') return sum(Array.from({ length: g.to - g.from + 1 }, (_, index) => g.from + index).filter(n => n % 2));
  if (g.kind === 'multiples') return Array.from({ length: g.to - g.from + 1 }, (_, index) => g.from + index).filter(n => n % g.m === 0).length;
  if (g.kind === 'digit-sum') {
    for (let n = 100; n < 1000; n++) if (digitSum(n) === g.target) return n;
  }
  const sorted = [...g.pool].sort((a, b) => (g.kind === 'greatest' ? b - a : a - b));
  if (g.kind === 'smallest' && sorted[0] === 0) [sorted[0], sorted[1]] = [sorted[1], sorted[0]];
  return Number(sorted.join(''));
}

function draftTwoNumbers(family, grade, level, r) {
  const who = person(r);
  if (level === 1) {
    const total = r.int(60, 190);
    const a = r.int(15, total - 15);
    return numberQ(r, {
      family,
      prompt: `Two numbers add up to ${total}. One of them is ${a}. What is the other number?`,
      answer: total - a,
      hint: 'Take the number you know away from the total.',
      explanation: `${total} − ${a} = ${total - a}.`,
      givens: { kind: 'other', total, a },
      wrongs: [[total + a, 'wrong-operation'], [a, 'missing-step'], [total - a + 10, 'missing-step']],
      min: 1, max: 999,
    });
  }
  if (level === 2) {
    const small = r.int(110, 190);
    const more = r.int(12, 40);
    const gap = r.int(30, 95);
    const answer = small + more + gap;
    return numberQ(r, {
      family,
      prompt: `${who} thinks of two numbers. The smaller is ${more} more than ${small}. The difference is ${gap}. What is the greater number?`,
      answer,
      hint: 'Find the smaller number first. Then add the difference.',
      explanation: `The smaller number is ${small} + ${more} = ${small + more}. The greater is ${small + more} + ${gap} = ${answer}.`,
      givens: { kind: 'difference', small, more, gap },
      wrongs: [[small + gap, 'missing-step'], [small + more, 'missing-step'], [small + more - gap, 'time-direction']],
      min: 1, max: 999,
    });
  }
  const gap = r.int(4, 40) * 2;
  const smaller = r.int(25, 160);
  const total = smaller * 2 + gap;
  return numberQ(r, {
    family,
    prompt: `Two numbers add up to ${total}. Their difference is ${gap}. What is the smaller number?`,
    answer: smaller,
    hint: 'Take the difference away from the total, then share what is left equally.',
    explanation: `${total} − ${gap} = ${total - gap}. Share equally: ${total - gap} ÷ 2 = ${smaller}.`,
    givens: { kind: 'sum-diff', total, gap },
    wrongs: [[smaller + gap, 'ignored-condition'], [total - gap, 'missing-step'], [Math.floor(total / 2), 'missing-step']],
    min: 1, max: 999,
  });
}

function solveTwoNumbers(question) {
  const g = question.proof.givens;
  if (g.kind === 'other') return g.total - g.a;
  if (g.kind === 'difference') return g.small + g.more + g.gap;
  return (g.total - g.gap) / 2;
}

const STORIES = [
  { place: 'A school', a: 'boys', b: 'girls', all: 'students' },
  { place: 'A fair', a: 'men', b: 'women', all: 'visitors' },
  { place: 'A library', a: 'story books', b: 'science books', all: 'books' },
  { place: 'A shop', a: 'red pens', b: 'blue pens', all: 'pens' },
  { place: 'A farm', a: 'hens', b: 'ducks', all: 'birds' },
  { place: 'A park', a: 'oak trees', b: 'palm trees', all: 'trees' },
];

function draftAddStory(family, grade, level, r) {
  const lo = level === 1 ? 120 : 1200;
  const hi = level === 1 ? 890 : 8800;
  const kinds = level === 1 ? ['total', 'part', 'left'] : level === 2 ? ['total', 'part', 'left', 'more'] : ['two-away', 'more-total', 'total'];
  const kind = r.pick(kinds);
  const s = r.pick(STORIES);
  const item = r.pick(ITEMS);
  const [who, other] = r.shuffle(NAMES);
  const a = r.int(lo, hi);
  const b = r.int(lo / 2, Math.min(hi, a - 50));
  const c = r.int(lo / 3, Math.min(hi / 2, 900));
  const spec = { family, hint: 'Decide whether to add or take away. Line up the places and regroup.', givens: { kind, a, b, c }, min: 1, max: 99999 };
  if (kind === 'total') {
    return numberQ(r, { ...spec, prompt: `${s.place} has ${a} ${s.a} and ${b} ${s.b}. How many ${s.all} are there in all?`, answer: a + b, explanation: `${a} + ${b} = ${a + b}.`, wrongs: [[a - b, 'wrong-operation'], [a + b + (level === 1 ? 100 : 1000), 'missing-step'], [a + b - (level === 1 ? 100 : 1000), 'missing-step']] });
  }
  if (kind === 'part') {
    return numberQ(r, { ...spec, prompt: `${a} ${s.all} came to ${s.place.toLowerCase()}. ${b} of them were ${s.a}. How many were ${s.b}?`, answer: a - b, explanation: `${a} − ${b} = ${a - b}.`, wrongs: [[a + b, 'wrong-operation'], [a - b + (level === 1 ? 100 : 1000), 'missing-step'], [b - (a - b) > 0 ? b - (a - b) : a - b - 10, 'missing-step']] });
  }
  if (kind === 'left') {
    return numberQ(r, { ...spec, prompt: `${who} had ${a} ${item}. ${other} took away ${b}. How many ${item} are left?`, answer: a - b, explanation: `${a} − ${b} = ${a - b}.`, wrongs: [[a + b, 'wrong-operation'], [a - b + 100, 'missing-step'], [a - b - 100, 'missing-step']] });
  }
  if (kind === 'more') {
    return numberQ(r, { ...spec, prompt: `${who} has ${a} ${item}. ${other} has ${b} more than ${who}. How many ${item} does ${other} have?`, answer: a + b, explanation: `${a} + ${b} = ${a + b}.`, wrongs: [[a - b, 'wrong-operation'], [a + b + 1000, 'missing-step'], [a + b - 1000, 'missing-step']] });
  }
  if (kind === 'more-total') {
    return numberQ(r, { ...spec, prompt: `${who} has ${a} ${item}. ${other} has ${b} more than ${who}. How many ${item} do they have together?`, answer: a + a + b, explanation: `${other} has ${a} + ${b} = ${a + b}. Together: ${a} + ${a + b} = ${a + a + b}.`, wrongs: [[a + b, 'missing-step'], [a + b + b, 'ignored-condition'], [a + a - b, 'wrong-operation']] });
  }
  return numberQ(r, { ...spec, prompt: `A shop had ${a + b + c} ${item}. It sold ${b} on Monday and ${c} on Tuesday. How many ${item} are left?`, answer: a, explanation: `${b} + ${c} = ${b + c} sold. ${a + b + c} − ${b + c} = ${a}.`, wrongs: [[a + b + c - b, 'missing-step'], [a + b + c - c, 'missing-step'], [a + 2 * (b + c), 'wrong-operation']] });
}

function solveAddStory(question) {
  const { kind, a, b, c } = question.proof.givens;
  if (kind === 'total' || kind === 'more') return a + b;
  if (kind === 'part' || kind === 'left') return a - b;
  if (kind === 'more-total') return a + a + b;
  return a + b + c - b - c;
}

const ROWS = [['crate', 'crates', 'mangoes'], ['shelf', 'shelves', 'books'], ['box', 'boxes', 'pencils'], ['tray', 'trays', 'buns'], ['carton', 'cartons', 'eggs'], ['jar', 'jars', 'marbles'], ['page', 'pages', 'stickers'], ['bag', 'bags', 'apples']];

function draftTimesStory(family, grade, level, r) {
  const [group, groupsName, thing] = r.pick(ROWS);
  const kind = level === 1 ? 'plain' : r.pick(level === 2 ? ['plain', 'plain', 'left'] : ['left', 'give', 'plain']);
  const per = level === 1 ? r.int(11, 49) : r.int(21, 98);
  const groups = level === 1 ? r.int(3, 9) : r.int(11, 39);
  const extra = r.int(3, 28);
  const product = per * groups;
  const who = person(r);
  const spec = { family, hint: level === 1 ? 'Multiply the number in each group by the number of groups.' : 'Multiply the tens and ones separately, then add the two products.', givens: { kind, per, groups, extra }, min: 1, max: 99999 };
  if (kind === 'plain') {
    return numberQ(r, { ...spec, prompt: `Each ${group} has ${per} ${thing}. How many ${thing} are there in ${groups} ${groupsName}?`, answer: product, explanation: `${per} × ${groups} = ${product}.`, wrongs: [[per + groups, 'wrong-operation'], [product + 10 * groups, 'missing-step'], [product - 10 * groups, 'missing-step']] });
  }
  if (kind === 'left') {
    return numberQ(r, { ...spec, prompt: `${who} packs ${per} ${thing} in each of ${groups} ${groupsName}. ${extra} ${thing} are left over. How many ${thing} does ${who} have in all?`, answer: product + extra, explanation: `${per} × ${groups} = ${product}. Then ${product} + ${extra} = ${product + extra}.`, wrongs: [[product, 'missing-step'], [per * extra + groups, 'ignored-condition'], [product + extra + 10, 'missing-step']] });
  }
  return numberQ(r, { ...spec, prompt: `${who} has ${groups} ${groupsName} with ${per} ${thing} in each. ${extra} ${thing} are given away. How many ${thing} are left?`, answer: product - extra, explanation: `${per} × ${groups} = ${product}. Then ${product} − ${extra} = ${product - extra}.`, wrongs: [[product, 'missing-step'], [product + extra, 'wrong-operation'], [product - extra - 10, 'missing-step']] });
}

function solveTimesStory(question) {
  const { kind, per, groups, extra } = question.proof.givens;
  const product = per * groups;
  return kind === 'plain' ? product : kind === 'left' ? product + extra : product - extra;
}

const PACKS = [['glasses', 'boxes'], ['players', 'teams'], ['pupils', 'vans'], ['pencils', 'cases'], ['sweets', 'bags'], ['apples', 'baskets']];

function draftDivideStory(family, grade, level, r) {
  const [thing, group] = r.pick(PACKS);
  const kind = level === 1 ? 'share' : r.pick(level === 2 ? ['left', 'full', 'need', 'share'] : ['left', 'full', 'need', 'share']);
  const big = level === 3;
  const size = big ? r.int(4, 9) : r.int(3, 9);
  const parts = big ? r.int(121, 260) : r.int(5, level === 1 ? 12 : 30);
  const exact = kind === 'share';
  const total = exact ? size * parts : size * parts + r.int(1, size - 1);
  const spec = { family, hint: kind === 'share' ? 'Share equally by dividing the total.' : 'Divide, then look at the question: full groups, left over or one more group.', givens: { kind, total, size }, min: 0, max: 99999 };
  if (kind === 'share') {
    const days = big ? r.pick([10, 5, 4, 6, 8]) : size;
    const all = days * parts;
    spec.givens = { kind, total: all, size: days };
    return numberQ(r, { ...spec, prompt: `${all} ${thing} are put equally into ${days} ${group}. How many ${thing} are in each of the ${group}?`, answer: parts, explanation: `${all} ÷ ${days} = ${parts}.`, wrongs: [[all - days, 'wrong-operation'], [days, 'wrong-operation'], [parts + 1, 'missing-step']] });
  }
  const full = Math.floor(total / size);
  const left = total % size;
  if (kind === 'left') {
    return numberQ(r, { ...spec, prompt: `${total} ${thing} are put in ${group} of ${size} each. How many ${thing} are left over?`, answer: left,     explanation: `${total} ÷ ${size} = ${full} remainder ${left}. So ${left} ${left === 1 ? 'is' : 'are'} left over.`, wrongs: [[full, 'remainder-rule'], [size - left, 'remainder-rule'], [left + size, 'remainder-rule']] });
  }
  if (kind === 'full') {
    return numberQ(r, { ...spec, prompt: `${total} ${thing} are put in ${group} of ${size} each. How many ${group} are filled completely?`, answer: full, explanation: `${total} ÷ ${size} = ${full} remainder ${left}. ${full} are full.`, wrongs: [[full + 1, 'remainder-rule'], [left, 'remainder-rule'], [full - 1, 'missing-step']] });
  }
  return numberQ(r, { ...spec, prompt: `${total} ${thing} must be put in ${group}, with ${size} in each. How many ${group} are needed in all?`, answer: full + 1, explanation: `${total} ÷ ${size} = ${full} remainder ${left}. The ${left} left over need one more.`, wrongs: [[full, 'remainder-rule'], [left, 'remainder-rule'], [full + 2, 'remainder-rule']] });
}

function solveDivideStory(question) {
  const { kind, total, size } = question.proof.givens;
  if (kind === 'share') return total / size;
  if (kind === 'left') return total % size;
  if (kind === 'full') return Math.floor(total / size);
  return Math.floor(total / size) + 1;
}

const GAINS = ['bought', 'found', 'was given'];
const LOSSES = ['gave away', 'lost', 'used'];

function draftStartAmount(family, grade, level, r) {
  const who = person(r);
  const item = r.pick(ITEMS);
  const size = level === 1 ? 1 : level === 2 ? 2 : 3;
  const changes = [];
  for (let index = 0; index < size; index++) changes.push({ sign: index === 1 || (size === 3 && index === 2) ? -1 : r.pick([1, -1]), k: r.int(level === 3 ? 120 : 12, level === 3 ? 640 : 80) });
  if (size > 1 && changes.every(change => change.sign === changes[0].sign)) changes[size - 1].sign *= -1;
  const start = r.int(level === 3 ? 400 : 60, level === 3 ? 2400 : 400);
  const end = start + sum(changes.map(change => change.sign * change.k));
  if (end < 20) throw new QuestionRetry('end too small');
  const verbs = r.shuffle(GAINS);
  const losses = r.shuffle(LOSSES);
  let gain = 0;
  let loss = 0;
  const told = changes.map(change => (change.sign > 0 ? `${verbs[gain++ % 3]} ${change.k} more` : `${losses[loss++ % 3]} ${change.k}`));
  const answer = start;
  const net = sum(changes.map(change => change.sign * change.k));
  return numberQ(r, {
    family,
    prompt: `${who} had some ${item}. Then ${who} ${told.join(' and then ')}. Now ${who} has ${end}. How many ${item} did ${who} have at first?`,
    answer,
    hint: 'Work backwards from the end. Undo every change.',
    explanation: `The changes add up to ${net >= 0 ? '+' : '−'}${Math.abs(net)}. At first there were ${end} ${net >= 0 ? '−' : '+'} ${Math.abs(net)} = ${answer}.`,
    givens: { end, changes },
    wrongs: [[end + net, 'reversed-operation'], [end + sum(changes.map(change => Math.abs(change.k))), 'reversed-operation'], [end - net + changes[0].k * 2 * changes[0].sign, 'missing-step']],
    min: 1, max: 99999,
  });
}

const solveStartAmount = question => question.proof.givens.end - sum(question.proof.givens.changes.map(change => change.sign * change.k));

function draftAgeStory(family, grade, level, r) {
  const boy = r.pick(BOYS);
  const girl = r.pick(GIRLS);
  const kind = r.pick(level === 1 ? ['now', 'later'] : level === 2 ? ['later', 'times', 'sum'] : ['times-gap', 'sum', 'times']);
  if (kind === 'now') {
    const yrs = r.int(3, 9);
    const age = r.int(7, 15);
    return numberQ(r, { family, prompt: `In ${yrs} years ${girl} will be ${age + yrs} years old. How old is ${girl} now?`, answer: age, hint: 'Take the years that are still to come away from the future age.', explanation: `${age + yrs} − ${yrs} = ${age}.`, givens: { kind, yrs, age }, wrongs: [[age + 2 * yrs, 'time-direction'], [yrs, 'missing-step'], [age + yrs, 'missing-step']], min: 1, max: 99 });
  }
  if (kind === 'later') {
    const age = r.int(6, 12);
    const yrs = r.int(3, 9);
    return numberQ(r, { family, prompt: `${boy} is ${age} years old. How old was ${boy}'s sister ${yrs} years ago if she is ${yrs + 2} years older than ${boy}?`, answer: age + 2, hint: 'Find the sister\'s age now. Then go back in time.', explanation: `The sister is ${age} + ${yrs + 2} = ${age + yrs + 2} now. ${yrs} years ago she was ${age + 2}.`, givens: { kind, age, yrs }, wrongs: [[age + yrs + 2, 'missing-step'], [age + 2 * yrs + 2, 'time-direction'], [age - 2, 'time-direction']], min: 1, max: 99 });
  }
  if (kind === 'times') {
    const age = r.int(5, 12);
    const m = r.int(3, 5);
    const yrs = r.int(2, 9);
    return numberQ(r, { family, prompt: `${girl} is ${age} years old. Her mother is ${m} times as old. How old will her mother be in ${yrs} years?`, answer: age * m + yrs, hint: 'Find the mother\'s age now. Then add the years.', explanation: `${age} × ${m} = ${age * m}. In ${yrs} years: ${age * m} + ${yrs} = ${age * m + yrs}.`, givens: { kind, age, m, yrs }, wrongs: [[age * m, 'missing-step'], [age + m + yrs, 'wrong-operation'], [age * m - yrs, 'time-direction']], min: 1, max: 99 });
  }
  if (kind === 'sum') {
    const young = r.int(5, 14);
    const gap = r.int(4, 14) * 2;
    return numberQ(r, { family, prompt: `${boy} and ${boy}'s father are ${young * 2 + gap} years old together. The father is ${gap} years older than ${boy}. How old is ${boy}?`, answer: young, hint: 'Take the age gap away, then share equally.', explanation: `${young * 2 + gap} − ${gap} = ${young * 2}. Share equally: ${young}.`, givens: { kind, young, gap }, wrongs: [[young + gap, 'ignored-condition'], [young * 2, 'missing-step'], [Math.floor((young * 2 + gap) / 2), 'missing-step']], min: 1, max: 99 });
  }
  const son = r.int(5, 9);
  const m = r.int(4, 6);
  const gap = r.int(2, 5);
  return numberQ(r, { family, prompt: `The father is ${m} times as old as his son. The son is ${son}. The father is ${gap} years older than the mother. How old is the mother?`, answer: son * m - gap, hint: 'Find the father\'s age first. The mother is younger.', explanation: `The father is ${son} × ${m} = ${son * m}. The mother is ${son * m} − ${gap} = ${son * m - gap}.`, givens: { kind, son, m, gap }, wrongs: [[son * m, 'missing-step'], [son * m + gap, 'time-direction'], [son + m - gap, 'wrong-operation']], min: 1, max: 99 });
}

function solveAgeStory(question) {
  const g = question.proof.givens;
  if (g.kind === 'now') return g.age;
  if (g.kind === 'later') return g.age + 2;
  if (g.kind === 'times') return g.age * g.m + g.yrs;
  if (g.kind === 'sum') return g.young;
  return g.son * g.m - g.gap;
}

const apply = (a, op, b) => (op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b);
const fmtTerm = ([a, op, b]) => `${a} ${SIGN[op]} ${b}`;

function draftExpression(family, grade, level, r) {
  if (level === 1) {
    const a = r.int(3, 20);
    const b = r.int(2, 9);
    const c = r.int(2, 9);
    const add = r.pick([true, false]);
    const answer = add ? a + b * c : a * b + c;
    const wrongValue = add ? (a + b) * c : a * (b + c);
    return numberQ(r, { family, prompt: add ? `What is ${a} + ${b} × ${c}?` : `What is ${a} × ${b} + ${c}?`, answer, hint: 'Do the multiplication before the addition.', explanation: add ? `${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${answer}.` : `${a} × ${b} = ${a * b}, then ${a * b} + ${c} = ${answer}.`, givens: { kind: 'plain', a, b, c, add }, wrongs: [[wrongValue, 'wrong-operation'], [answer + 1, 'missing-step'], [a + b + c, 'wrong-operation']], min: 1, max: 999 });
  }
  if (level === 2) {
    const a = r.int(2, 9);
    const b = r.int(3, 9);
    const c = r.int(2, 9);
    const d = r.int(2, 9);
    const answer = (a + b) * c - d;
    return numberQ(r, { family, prompt: `What is (${a} + ${b}) × ${c} − ${d}?`, answer, hint: 'Do the brackets first. Then multiply. Then take away.', explanation: `${a} + ${b} = ${a + b}. ${a + b} × ${c} = ${(a + b) * c}. Then − ${d} = ${answer}.`, givens: { kind: 'brackets', a, b, c, d }, wrongs: [[a + b * c - d, 'wrong-operation'], [(a + b) * (c - d), 'wrong-operation'], [(a + b) * c, 'missing-step']], min: 1, max: 999 });
  }
  const p = r.pick([[100, '/', 2], [60, '/', 3], [90, '/', 3], [80, '/', 4], [20, '*', 5]]);
  const q2 = r.pick([[400, '*', 2], [200, '*', 3], [300, '*', 2], [50, '*', 4]]);
  const rr = r.pick([[20, '*', 4], [10, '*', 5], [25, '*', 4], [20, '*', 2]]);
  const s = r.pick([[3, '+', 2], [7, '-', 2], [2, '+', 4], [9, '-', 4]]);
  const terms = [p, q2, rr, s];
  const [P, Q, R, S] = terms.map(([a, op, b]) => apply(a, op, b));
  if (Q % R !== 0 || P + Q / R - S <= 0) throw new QuestionRetry('not whole');
  const answer = P + Q / R - S;
  return numberQ(r, { family, prompt: `P = ${fmtTerm(p)}, Q = ${fmtTerm(q2)}, R = ${fmtTerm(rr)}, S = ${fmtTerm(s)}. What is P + Q ÷ R − S?`, answer, hint: 'Find P, Q, R and S first. Divide before you add or take away.', explanation: `P = ${P}, Q = ${Q}, R = ${R}, S = ${S}. Q ÷ R = ${Q / R}. ${P} + ${Q / R} − ${S} = ${answer}.`, givens: { kind: 'letters', terms }, wrongs: [[(P + Q) / R - S, 'wrong-operation'], [P + Q / R + S, 'wrong-operation'], [P + Q / (R - S), 'wrong-operation'], [Q / R, 'missing-step']], min: 1, max: 9999 });
}

function solveExpression(question) {
  const g = question.proof.givens;
  if (g.kind === 'plain') return g.add ? g.a + g.b * g.c : g.a * g.b + g.c;
  if (g.kind === 'brackets') return (g.a + g.b) * g.c - g.d;
  const [P, Q, R, S] = g.terms.map(([a, op, b]) => apply(a, op, b));
  return P + Q / R - S;
}

function draftCompareValues(family, grade, level, r) {
  const ask = r.pick(['largest', 'smallest']);
  let exprs;
  if (level === 1) {
    const d = r.pick([60, 72, 84, 120, 90]);
    const divisors = r.shuffle([2, 3, 4, 5, 6].filter(v => d % v === 0)).slice(0, 4);
    if (divisors.length < 4) throw new QuestionRetry('few divisors');
    exprs = divisors.map(v => [d, '/', v]);
  } else if (level === 2) {
    const nums = r.shuffle([4, 5, 6, 7, 8, 9, 11, 12, 15]).slice(0, 4);
    const total = r.pick([48, 60, 72, 120, 240]);
    exprs = nums.map(v => [Math.round(total / 10) * v % 7 === 0 ? v : v, '*', Math.max(2, Math.round(total / v / 2))]);
  } else {
    const base = r.int(20, 90);
    exprs = r.shuffle([[base, '+', r.int(10, 60)], [base + r.int(5, 20), '*', 2], [r.int(80, 200), '-', r.int(20, 80)], [r.int(300, 600), '/', r.pick([5, 6, 4])]]);
    exprs = exprs.filter(([a, op, b]) => Number.isInteger(apply(a, op, b)));
    if (exprs.length < 4) throw new QuestionRetry('not whole');
  }
  const values = exprs.map(([a, op, b]) => apply(a, op, b));
  if (!values.every(Number.isInteger) || new Set(values).size !== 4) throw new QuestionRetry('values tie');
  const best = ask === 'largest' ? Math.max(...values) : Math.min(...values);
  const shown = exprs.map(fmtTerm);
  const answer = shown[values.indexOf(best)];
  return textQ({
    family,
    prompt: `Which has the ${ask} value: ${shown.join(', ')}?`,
    answer,
    hint: level === 1 ? 'Work each one out. Sharing among fewer gives more each.' : 'Work out every value, then compare the answers.',
    explanation: `The values are ${values.join(', ')}. The ${ask} is ${best}, from ${answer}.`,
    givens: { ask },
    options: shown,
    wrongs: shown.filter(text => text !== answer).map(text => [text, 'ignored-condition']),
  });
}

function solveCompareValues(question) {
  const parse = text => {
    const [a, op, b] = text.split(' ');
    return apply(Number(a), { '+': '+', '−': '-', '×': '*', '÷': '/' }[op], Number(b));
  };
  const values = question.options.map(parse);
  const best = question.proof.givens.ask === 'largest' ? Math.max(...values) : Math.min(...values);
  return question.options[values.indexOf(best)];
}

export const DRAFT = {
  'class-3-order-digits': draftOrderDigits,
  'class-3-box-chain': draftBoxChain,
  'class-3-place-fill': draftPlaceFill,
  'class-3-near-round': draftRound,
  'class-3-which-number': draftWhichNumber,
  'class-3-number-words': draftNumberWords,
  'class-3-number-facts': draftNumberFacts,
  'class-3-two-numbers': draftTwoNumbers,
  'class-3-add-story': draftAddStory,
  'class-3-times-story': draftTimesStory,
  'class-3-divide-story': draftDivideStory,
  'class-3-start-amount': draftStartAmount,
  'class-3-age-story': draftAgeStory,
  'class-3-expression': draftExpression,
  'class-3-compare-values': draftCompareValues,
};

export const SOLVE = {
  'class-3-order-digits': solveOrderDigits,
  'class-3-box-chain': solveBoxChain,
  'class-3-place-fill': solvePlaceFill,
  'class-3-near-round': solveRound,
  'class-3-which-number': solveWhichNumber,
  'class-3-number-words': solveNumberWords,
  'class-3-number-facts': solveNumberFacts,
  'class-3-two-numbers': solveTwoNumbers,
  'class-3-add-story': solveAddStory,
  'class-3-times-story': solveTimesStory,
  'class-3-divide-story': solveDivideStory,
  'class-3-start-amount': solveStartAmount,
  'class-3-age-story': solveAgeStory,
  'class-3-expression': solveExpression,
  'class-3-compare-values': solveCompareValues,
};

export const FAMILIES = {
  'class-3-order-digits': { skill: 'compare', title: 'Order numbers made from the same digits' },
  'class-3-box-chain': { skill: 'mystery', title: 'Find the missing number in a chain of steps' },
  'class-3-place-fill': { skill: 'expand', title: 'Fill in a missing place-value number' },
  'class-3-near-round': { skill: 'place', title: 'Round or step a number by tens and hundreds' },
  'class-3-which-number': { skill: 'mystery', title: 'Pick the number that fits every clue' },
  'class-3-number-words': { skill: 'place', title: 'Match numbers with their words' },
  'class-3-number-facts': { skill: 'sequence', title: 'Solve number puzzles with odd, multiples and digits' },
  'class-3-two-numbers': { skill: 'mystery', title: 'Find two numbers from a total or a difference' },
  'class-3-add-story': { skill: 'addition', title: 'Add or subtract big numbers in a story' },
  'class-3-times-story': { skill: 'groups', title: 'Multiply rows and groups in a story' },
  'class-3-divide-story': { skill: 'sharing', title: 'Divide, and decide what the remainder means' },
  'class-3-start-amount': { skill: 'subtraction', title: 'Work backwards to the amount at first' },
  'class-3-age-story': { skill: 'mystery', title: 'Solve an age story' },
  'class-3-expression': { skill: 'mystery', title: 'Work out a sum with brackets and several signs' },
  'class-3-compare-values': { skill: 'compare', title: 'Find the largest value among sums and shares' },
};
