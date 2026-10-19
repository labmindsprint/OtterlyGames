// Real-paper style Class 3 reasoning families: positions, words and letters, number and figure patterns,
// odd one out, rule puzzles, secret codes, ordering clues and counting choices.
import { QuestionRetry } from './bank-shared.mjs';
import { NAMES } from './bank3-class-3-helpers.mjs';
import { LETTERS, count, numberQ, range, textQ } from './bank3-class-3-kit.mjs';
import { COLOURS, SIDES } from './bank3-class-3-imo-art.mjs';

export const DRAFT = {};
export const SOLVE = {};
export const FAMILIES = {
  'class-3-notebook-position': { skill: 'position', title: 'Find a book from its place on a shelf' },
  'class-3-word-jumble': { skill: 'coding', title: 'Unscramble letters to find a word' },
  'class-3-word-form': { skill: 'coding', title: 'Pick the word that can or cannot be made from letters' },
  'class-3-alpha-step': { skill: 'coding', title: 'Move along the alphabet' },
  'class-3-number-series': { skill: 'sequence', title: 'Find the next or missing number in a series' },
  'class-3-figure-pattern': { skill: 'repeat', title: 'Find the shape or colour that comes next' },
  'class-3-odd-out': { skill: 'odd', title: 'Find the odd one out in a row of figures' },
  'class-3-pair-rule': { skill: 'sequence', title: 'Use a rule found from two number pairs' },
  'class-3-triangle-rule': { skill: 'mystery', title: 'Find the rule that links triangle corners to the centre' },
  'class-3-word-code': { skill: 'coding', title: 'Follow a secret code that renames things' },
  'class-3-order-clues': { skill: 'ranking', title: 'Order friends from comparing clues' },
  'class-3-pick-ways': { skill: 'combinations', title: 'Count the ways to pick or pair things' },
};

const ord = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;

// ---- books on a shelf ----
function draftNotebook(family, grade, level, r) {
  const total = r.int(5, level === 1 ? 6 : 7);
  const items = r.shuffle(Object.keys(COLOURS)).slice(0, total).map(color => ({ color }));
  const kind = level === 1 ? r.pick(['offset', 'from-end']) : r.pick(['offset', 'offset', 'between', 'from-end']);
  const visual = { kind: 'v3-class-3-shelf', items, description: `A shelf of ${total} books from left to right: ${items.map(item => item.color).join(', ')}.` };
  if (kind === 'offset') {
    const side = r.pick(['right', 'left']);
    const rank = r.int(2, total - 2);
    const steps = r.int(1, 3);
    const anchor = side === 'right' ? total - rank : rank - 1;
    const index = side === 'right' ? anchor - steps : anchor + steps;
    if (index < 0 || index >= total) throw new QuestionRetry('off the shelf');
    const toward = side === 'right' ? 'left' : 'right';
    const mirror = side === 'right' ? anchor + steps : anchor - steps;
    const near = [anchor, mirror, index - 1, index + 1].filter(position => position >= 0 && position < total && position !== index);
    const codes = ['position-end', 'turn-frame', 'rank-endpoints', 'rank-endpoints'];
    const wrongs = [...near.map(position => [items[position].color, position === anchor ? codes[0] : position === mirror ? codes[1] : codes[2]]),
      ...items.map(item => [item.color, 'missing-step'])];
    return textQ({
      family,
      prompt: `Which book is ${ord(steps)} to the ${toward} of the ${ord(rank)} book from the ${side}?`,
      answer: items[index].color,
      hint: `Find the ${ord(rank)} book from the ${side} first. Then move ${steps} ${steps === 1 ? 'place' : 'places'} to the ${toward}.`,
      explanation: `The ${ord(rank)} book from the ${side} is ${items[anchor].color}. ${steps} to the ${toward} is ${items[index].color}.`,
      givens: { kind, side, rank, steps },
      visual,
      wrongs,
    });
  }
  if (kind === 'between') {
    const [a, b] = r.shuffle(range(0, total - 1)).slice(0, 2).sort((x, y) => x - y);
    if (b - a < 2) throw new QuestionRetry('nothing between');
    return numberQ(r, {
      family,
      prompt: `How many books are between the ${items[a].color} book and the ${items[b].color} book?`,
      answer: b - a - 1,
      hint: 'Count only the books in the gap. Do not count the two named books.',
      explanation: `The books are in places ${a + 1} and ${b + 1} from the left. ${count(b - a - 1, 'book')} ${b - a - 1 === 1 ? 'sits' : 'sit'} between them.`,
      givens: { kind, a, b },
      visual,
      wrongs: [[b - a + 1, 'counted-endpoints'], [b - a, 'counted-endpoints'], [total - 2, 'missing-step']],
      min: 1, max: 8,
    });
  }
  const index = r.int(1, total - 2);
  return numberQ(r, {
    family,
    prompt: `The ${items[index].color} book is ${ord(index + 1)} from the left. What place is it from the right?`,
    answer: total - index,
    hint: 'Count the books on the right side of it, then add the book itself.',
    explanation: `${count(total - index - 1, 'book')} ${total - index - 1 === 1 ? 'is' : 'are'} to its right, so it is ${ord(total - index)} from the right.`,
    givens: { kind, index },
    visual,
    wrongs: [[total - index - 1, 'rank-endpoints'], [index + 1, 'position-end'], [total - index + 1, 'rank-endpoints']],
    min: 1, max: 8,
  });
}

function solveNotebook(question) {
  const g = question.proof.givens;
  const { items } = question.visual;
  const total = items.length;
  if (g.kind === 'offset') {
    const anchor = g.side === 'right' ? total - g.rank : g.rank - 1;
    return items[g.side === 'right' ? anchor - g.steps : anchor + g.steps].color;
  }
  if (g.kind === 'between') return g.b - g.a - 1;
  return total - g.index;
}
DRAFT['class-3-notebook-position'] = draftNotebook;
SOLVE['class-3-notebook-position'] = solveNotebook;

// ---- jumbled words ----
const CATEGORIES = {
  animal: ['TIGER', 'ZEBRA', 'HORSE', 'MOUSE', 'EAGLE', 'PANDA', 'CAMEL', 'SHEEP', 'KOALA', 'OTTER'],
  fruit: ['APPLE', 'MANGO', 'LEMON', 'GRAPE', 'PEACH', 'GUAVA', 'BERRY'],
  planet: ['EARTH', 'VENUS', 'SATURN', 'URANUS', 'JUPITER', 'MERCURY'],
  colour: ['GREEN', 'BROWN', 'WHITE', 'BLACK', 'PURPLE', 'YELLOW', 'ORANGE'],
  country: ['INDIA', 'JAPAN', 'CHINA', 'SPAIN', 'ITALY', 'EGYPT', 'KENYA'],
  vehicle: ['TRAIN', 'PLANE', 'TRUCK', 'SCOOTER', 'ROCKET', 'BICYCLE'],
};
const WORD_LIST = Object.entries(CATEGORIES).flatMap(([category, list]) => list.map(word => ({ word, category })));
const sorted = word => word.split('').sort().join('');
const byLetters = new Map(WORD_LIST.map(entry => [sorted(entry.word), entry]));
if (byLetters.size !== WORD_LIST.length) throw new Error('Two jumble words share the same letters.');

function scramble(r, word) {
  for (let tries = 0; tries < 20; tries++) {
    const jumble = r.shuffle(word.split('')).join('');
    if (jumble !== word) return jumble;
  }
  throw new QuestionRetry('jumble');
}

function draftJumble(family, grade, level, r) {
  const kind = level === 1 ? r.pick(['category', 'pick']) : r.pick(['category', 'pick', 'letter']);
  const names = Object.keys(CATEGORIES);
  const entry = r.pick(WORD_LIST);
  const jumble = scramble(r, entry.word);
  if (kind === 'category') {
    return textQ({
      family,
      prompt: `The letters ${jumble} can be rearranged to make a word. What kind of word is it?`,
      answer: entry.category,
      hint: 'Rearrange the letters until they spell a word you know. Then decide which group it belongs to.',
      explanation: `${jumble} makes ${entry.word}, which is ${/^[aeiou]/.test(entry.category) ? 'an' : 'a'} ${entry.category}.`,
      givens: { kind, jumble },
      wrongs: r.shuffle(names.filter(name => name !== entry.category)).slice(0, 3).map(name => [name, 'missed-object']),
    });
  }
  if (kind === 'pick') {
    const others = r.shuffle(WORD_LIST.filter(item => item.category !== entry.category && item.word.length === entry.word.length)).slice(0, 8);
    const picked = [];
    for (const item of [...others, ...r.shuffle(WORD_LIST.filter(item => item.category !== entry.category && Math.abs(item.word.length - entry.word.length) <= 1))]) {
      if (!picked.some(seen => seen.category === item.category)) picked.push(item);
    }
    if (picked.length < 3) throw new QuestionRetry('not enough jumbles');
    return textQ({
      family,
      prompt: `Which of these jumbled words makes the name of ${/^[aeiou]/.test(entry.category) ? 'an' : 'a'} ${entry.category}?`,
      answer: jumble,
      hint: 'Rearrange the letters of each choice. Only one makes a word in that group.',
      explanation: `${jumble} makes ${entry.word}, which is ${/^[aeiou]/.test(entry.category) ? 'an' : 'a'} ${entry.category}.`,
      givens: { kind, category: entry.category },
      wrongs: picked.slice(0, 3).map(item => [scramble(r, item.word), 'missed-object']),
    });
  }
  const place = r.int(1, entry.word.length);
  const letters = entry.word.split('');
  const wrongs = [letters[place % letters.length], letters[(place + letters.length - 2) % letters.length], jumble[place - 1], ...letters]
    .filter(letter => letter !== letters[place - 1]).map(letter => [letter, 'missing-step']);
  return textQ({
    family,
    prompt: `Rearrange ${jumble} to make a word. What is the ${ord(place)} letter of the word?`,
    answer: letters[place - 1],
    hint: 'Find the real word first. Then count along its letters to the place asked.',
    explanation: `${jumble} makes ${entry.word}. Its ${ord(place)} letter is ${letters[place - 1]}.`,
    givens: { kind, jumble, place },
    wrongs,
  });
}

function solveJumble(question) {
  const g = question.proof.givens;
  if (g.kind === 'category') return byLetters.get(sorted(g.jumble)).category;
  if (g.kind === 'pick') return question.options.find(option => byLetters.get(sorted(option))?.category === g.category);
  return byLetters.get(sorted(g.jumble)).word[g.place - 1];
}
DRAFT['class-3-word-jumble'] = draftJumble;
SOLVE['class-3-word-jumble'] = solveJumble;

// ---- words made from the letters of a longer word ----
const SOURCES = ['ASSEMBLE', 'ELEPHANT', 'TRIANGLE', 'CHOCOLATE', 'MOUNTAIN', 'CALENDAR', 'ADVENTURE', 'SANDWICH', 'KEYBOARD', 'UMBRELLA', 'HOSPITAL', 'NOTEBOOK', 'BIRTHDAY', 'DIAMOND', 'PLANET', 'GARDEN', 'RAINBOW', 'DOLPHIN', 'MARKET', 'FOREST', 'TEACHER', 'BLANKET'];
const SMALL_WORDS = ('ALE ANT APE ARM BAG BAT BED BEE BELL BELT BIRD BLUE BOAT BOOK BOOT CAKE CAMEL CAT CHAIR CLAP CLOCK COAT COIN CORN CRAB CUP DARE DEAL DEER DOLL DOOR DRUM EAR EAST EASEL EGG FAN FARM FISH FLAG FROG GAME GATE GOAT HAND HEAT HEN HOLE HOME HORN INK JAM JAR KITE LAMB LAMP LEAF LEASE LESS LION MAP MASS MEAL MESS MILK MOON NAIL NEST NOTE OVEN PAIR PEAR PEN PLATE RAIN RING ROAD ROOM SAIL SALE SAND SEAL SEAM SHIP SNAIL STAR TAIL TEAM TENT TOAD TRAIN TREE TRAP WATER WIND ' +
  'BASE BEAM BLESS ABLE BALE MEAT HEAL LATE LAND LINE TEN TIN PIN HAT PAT NET LET LEG EEL TALE TEAL ANGLE ALONE LEMON MELON SEAT BEAT BOARD DOG ROD BAD DAD MAD MOAT GRAIN BRAIN CHAIN DRAIN DIAL RAID NAME MANE MEAN MOAN OMEN WOMAN BADGE CABLE LABEL HOLY DAY BAY HID BID BIT RIB RAT HAIR DIRT THIRD BIRTH DRY HOT ' +
  'PLAN PLANT LANE NEAT PANT PEAT LEAN PAN TAP NAP PAL PET LAP NEAR EARN BEAR BEARD READ DEAR EAR TEA EAT ARE ONE ROPE ROSE NOSE STONE STORE SORE TONE SPORT PORT POST STOP SPOT TOP POT TIP SIP HIP HOP SHOP DISH WISH WITH WIN WILD WALL TALL TELL ' +
  'DEN RAN RAGE GRADE DANGER GEAR AGE DARE BOW ROW WAR RAW BRAWN ROBIN BARN BORN BRAN NOW OWN WON NOR BIN RAIN AIR HOLD HOLD OIL LION NIP HELP KEEP TAKE MAKE RAKE TEAR TREAT TRACK TEACH REACH CHEAT CHEER CRATE CREAM CHART ARM ' +
  'KNEE MARK TAKE TEAM RAKE RATE MATE MAT RAM ARK KITE REST REEF FREE FIRE FIST FORT SOFT SORT ROTE TORE SET TEN NEST NET BAKE BLANK BLAME LAKE TANK BANK BEAK ALE').split(' ');
const DICTIONARY = [...new Set(SMALL_WORDS)];

function formable(word, source) {
  const pool = {};
  for (const letter of source) pool[letter] = (pool[letter] ?? 0) + 1;
  for (const letter of word) {
    if (!pool[letter]) return false;
    pool[letter] -= 1;
  }
  return true;
}

function whyNot(word, source) {
  const pool = {};
  for (const letter of source) pool[letter] = (pool[letter] ?? 0) + 1;
  for (const letter of word) {
    if (!pool[letter]) {
      const had = source.split('').filter(item => item === letter).length;
      return had === 0 ? `${source} has no ${letter}.` : `${source} has only ${had} ${letter} but ${word} needs more.`;
    }
    pool[letter] -= 1;
  }
  return '';
}

function draftWordForm(family, grade, level, r) {
  const source = r.pick(SOURCES);
  const yes = DICTIONARY.filter(word => word.length >= 3 && word.length < source.length && formable(word, source));
  const no = DICTIONARY.filter(word => word.length >= 3 && !formable(word, source) && word.split('').some(letter => source.includes(letter)));
  if (yes.length < 3 || no.length < 3) throw new QuestionRetry('not enough words');
  const kind = level === 1 ? 'cannot' : r.pick(['cannot', 'can', 'cannot']);
  const near = r.shuffle(no.filter(word => word.split('').every(letter => source.includes(letter))));
  const pickNo = n => [...near, ...r.shuffle(no.filter(word => !near.includes(word)))].slice(0, n);
  const pickYes = n => r.shuffle(yes).slice(0, n);
  const answer = kind === 'cannot' ? pickNo(1)[0] : pickYes(1)[0];
  const wrongs = kind === 'cannot' ? pickYes(3) : pickNo(4).filter(word => word !== answer);
  const text = kind === 'cannot'
    ? `Which word cannot be made from the letters of ${source}? Use each letter only as often as it appears.`
    : `Which word can be made from the letters of ${source}? Use each letter only as often as it appears.`;
  return textQ({
    family,
    prompt: text,
    answer,
    hint: 'Cross off a letter of the long word each time you use it. A letter cannot be used twice if it appears once.',
    explanation: kind === 'cannot' ? `${answer} cannot be made. ${whyNot(answer, source)}` : `${answer} uses only letters that ${source} has enough of.`,
    givens: { kind, source },
    wrongs: wrongs.slice(0, 3).map(word => [word, 'class-3-letter-reuse']),
  });
}

function solveWordForm(question) {
  const { kind, source } = question.proof.givens;
  const wanted = question.options.filter(option => formable(option, source) === (kind === 'can'));
  if (wanted.length !== 1) throw new Error('Exactly one word must fit.');
  return wanted[0];
}
DRAFT['class-3-word-form'] = draftWordForm;
SOLVE['class-3-word-form'] = solveWordForm;

// ---- alphabet steps ----
function draftAlpha(family, grade, level, r) {
  const kind = level === 1 ? r.pick(['after', 'before', 'place']) : r.pick(['after', 'before', 'between', 'place', 'end']);
  const letter = index => LETTERS[index];
  if (kind === 'after' || kind === 'before') {
    const steps = r.int(2, level === 1 ? 4 : 7);
    const index = kind === 'after' ? r.int(0, 25 - steps) : r.int(steps, 25);
    const target = kind === 'after' ? index + steps : index - steps;
    const wrongs = [
      [letter(target + (kind === 'after' ? 1 : -1)), 'counted-endpoints'],
      [letter(kind === 'after' ? index - steps : index + steps), 'class-3-order-direction'],
      [letter(target + (kind === 'after' ? -1 : 1)), 'counted-endpoints'],
      [letter(index + (kind === 'after' ? 1 : -1)), 'missing-step'],
    ].filter(([value]) => value);
    return textQ({
      family,
      prompt: `Which letter is ${count(steps, 'place')} ${kind} ${letter(index)} in the alphabet?`,
      answer: letter(target),
      hint: `Say the letters one at a time, starting after ${letter(index)}. Move ${kind === 'after' ? 'forward' : 'backward'} ${count(steps, 'place')}.`,
      explanation: `${letter(index)} moves ${steps} ${kind === 'after' ? 'forward' : 'back'} to ${letter(target)}.`,
      givens: { kind, index, steps },
      wrongs: [...wrongs, [letter(index), 'missing-step']],
    });
  }
  if (kind === 'between') {
    const a = r.int(0, 18);
    const b = r.int(a + 3, Math.min(25, a + 12));
    return numberQ(r, {
      family,
      prompt: `How many letters are between ${letter(a)} and ${letter(b)} in the alphabet?`,
      answer: b - a - 1,
      hint: 'Do not count the two named letters. Count only the letters in the gap.',
      explanation: `${letter(a)} is number ${a + 1} and ${letter(b)} is number ${b + 1}. ${count(b - a - 1, 'letter')} ${b - a - 1 === 1 ? 'is' : 'are'} between.`,
      givens: { kind, a, b },
      wrongs: [[b - a, 'counted-endpoints'], [b - a + 1, 'counted-endpoints'], [b + 1 - a - 3, 'missing-step']],
      min: 1, max: 24,
    });
  }
  const index = r.int(2, 24);
  if (kind === 'place') {
    return numberQ(r, {
      family,
      prompt: `Counting A as 1, B as 2 and so on, what number is ${letter(index)}?`,
      answer: index + 1,
      hint: 'Count A, B, C and so on, one letter at a time, until you reach the letter.',
      explanation: `${letter(index)} is number ${index + 1}.`,
      givens: { kind, index },
      wrongs: [[index, 'counted-endpoints'], [index + 2, 'counted-endpoints'], [26 - index, 'class-3-order-direction']],
      min: 1, max: 26,
    });
  }
  return numberQ(r, {
    family,
    prompt: `Count from the end of the alphabet, with Z as number 1. What number is ${letter(index)}?`,
    answer: 26 - index,
    hint: 'Z is number 1, Y is number 2. Count back from Z until you reach the letter.',
    explanation: `Z is 1, so ${letter(index)} is ${26 - index}.`,
    givens: { kind, index },
    wrongs: [[index + 1, 'class-3-order-direction'], [25 - index, 'counted-endpoints'], [27 - index, 'counted-endpoints']],
    min: 1, max: 26,
  });
}

function solveAlpha(question) {
  const g = question.proof.givens;
  if (g.kind === 'after') return LETTERS[g.index + g.steps];
  if (g.kind === 'before') return LETTERS[g.index - g.steps];
  if (g.kind === 'between') return g.b - g.a - 1;
  if (g.kind === 'place') return g.index + 1;
  return 26 - g.index;
}
DRAFT['class-3-alpha-step'] = draftAlpha;
SOLVE['class-3-alpha-step'] = solveAlpha;

// ---- number series ----
function seriesTerms(type, p, length) {
  const out = [p.start];
  for (let index = 1; index < length; index++) {
    const last = out[index - 1];
    if (type === 'add') out.push(last + p.step);
    else if (type === 'sub') out.push(last - p.step);
    else if (type === 'alt') out.push(index % 2 ? last + p.up : last - p.down);
    else if (type === 'grow') out.push(last + p.step + (index - 1) * p.grow);
    else if (type === 'double') out.push(last * p.times);
    else out.push(index % 2 ? out[index - 1] + p.up : out[index - 1] - p.down);
  }
  return out;
}

function interleaved(p, length) {
  return Array.from({ length }, (_, index) => (index % 2 === 0 ? p.start + (index / 2) * p.up : p.other - ((index - 1) / 2) * p.down));
}

function draftSeries(family, grade, level, r) {
  const type = r.pick(level === 1 ? ['add', 'sub'] : level === 2 ? ['add', 'sub', 'alt', 'grow', 'double', 'weave'] : ['alt', 'grow', 'double', 'weave', 'sub']);
  let p;
  if (type === 'add') p = { start: r.int(2, 60), step: r.int(2, 12) };
  else if (type === 'sub') p = { start: r.int(80, 200), step: r.int(3, 11) };
  else if (type === 'alt') p = { start: r.int(10, 40), up: r.int(4, 12), down: r.int(2, 6) };
  else if (type === 'grow') p = { start: r.int(1, 20), step: r.int(1, 3), grow: r.int(1, 2) };
  else if (type === 'double') p = { start: r.int(2, 6), times: r.pick([2, 3]) };
  else p = { start: r.int(2, 12), other: r.int(40, 70), up: r.int(2, 5), down: r.int(2, 6) };
  const length = type === 'double' ? 5 : 6;
  const terms = type === 'weave' ? interleaved(p, length + 1) : seriesTerms(type, p, length + 1);
  const hole = r.pick([length, length, length - 2, length - 3].filter(index => index >= 2));
  const answer = terms[hole];
  const shown = terms.slice(0, hole + 1).map((value, index) => (index === hole ? '?' : value));
  const tail = hole === length ? [] : terms.slice(hole + 1, length + 1).slice(0, 2);
  const line = [...shown, ...tail].join(', ');
  const last = terms[hole - 1];
  const gap = last - terms[hole - 2];
  const gapBefore = terms[hole - 2] - (terms[hole - 3] ?? terms[hole - 2] - 1);
  const wrongs = [[last + gap, 'class-3-rule-flip'], [last + gapBefore, 'class-3-rule-flip'], [answer + 1, 'missing-step'], [answer - 1, 'missing-step'], [last, 'missing-step']];
  if (type === 'double') wrongs.unshift([last + p.start, 'class-3-rule-flip']);
  return numberQ(r, {
    family,
    prompt: hole === length ? `What number comes next in the pattern ${line}` : `Which number is missing in the pattern ${line}?`,
    answer,
    hint: type === 'weave' ? 'Two patterns are mixed. Look at every second number on its own.' : 'Find how the numbers change from one to the next. The rule may change a little each time.',
    explanation: `The pattern continues with ${answer}.`,
    givens: { type, p, hole, length },
    wrongs, min: 0, max: 2000,
  });
}

function solveSeries(question) {
  const { type, p, hole, length } = question.proof.givens;
  return (type === 'weave' ? interleaved(p, length + 1) : seriesTerms(type, p, length + 1))[hole];
}
DRAFT['class-3-number-series'] = draftSeries;
SOLVE['class-3-number-series'] = solveSeries;

// ---- figure patterns ----
const PATTERN_SHAPES = ['circle', 'triangle', 'square', 'star', 'pentagon', 'hexagon'];
const PATTERN_COLOURS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];

function draftFigurePattern(family, grade, level, r) {
  const ask = r.pick(['shape', 'color']);
  const ps = level === 1 ? 2 : r.pick([2, 3, 3]);
  const pc = ask === 'color' ? r.pick(level === 1 ? [2] : [2, 3]) : r.pick(level === 1 ? [1, 2] : [1, 2, 3]);
  const shapes = r.shuffle(PATTERN_SHAPES).slice(0, ps);
  const colours = r.shuffle(PATTERN_COLOURS).slice(0, pc);
  const length = ps === 3 && pc >= 2 ? 7 : 6;
  const items = Array.from({ length }, (_, index) => ({ shape: shapes[index % ps], color: colours[index % pc] }));
  const next = { shape: shapes[length % ps], color: colours[length % pc] };
  const period = ask === 'shape' ? ps : pc;
  const cycle = ask === 'shape' ? shapes : colours;
  const pool = ask === 'shape' ? PATTERN_SHAPES : PATTERN_COLOURS;
  const answer = next[ask];
  const wrongs = [
    [items[length - 1][ask], 'class-3-pattern-period'],
    ...cycle.filter(value => value !== answer).map(value => [value, 'class-3-pattern-period']),
    ...r.shuffle(pool.filter(value => !cycle.includes(value))).map(value => [value, 'missed-object']),
  ];
  const slots = length + 1;
  return textQ({
    family,
    prompt: ask === 'shape' ? 'Which shape goes in the box with the question mark?' : 'What colour is the shape in the box with the question mark?',
    answer,
    hint: `Look at how often the ${ask === 'shape' ? 'shape' : 'colour'} repeats. Then carry on the pattern.`,
    explanation: `The ${ask === 'shape' ? 'shapes' : 'colours'} repeat every ${period} figures, so the next one is ${answer}.`,
    givens: { ask, period },
    visual: {
      kind: 'v3-class-3-seq', items, next: true, cols: slots > 6 ? 4 : slots,
      description: `A row of figures: ${items.map(item => `${item.color} ${item.shape}`).join(', ')}, then a box with a question mark.`,
    },
    wrongs,
  });
}

function solveFigurePattern(question) {
  const { ask, period } = question.proof.givens;
  const { items } = question.visual;
  return items[items.length - period][ask];
}
DRAFT['class-3-figure-pattern'] = draftFigurePattern;
SOLVE['class-3-figure-pattern'] = solveFigurePattern;

// ---- odd one out ----
function draftOddOut(family, grade, level, r) {
  const prop = r.pick(level === 1 ? ['colour', 'shape'] : ['colour', 'shape', 'sides', 'size']);
  const odd = r.int(0, 3);
  let items;
  let prompt;
  if (prop === 'colour') {
    const [main, other] = r.shuffle(PATTERN_COLOURS);
    const shape = r.pick(PATTERN_SHAPES);
    items = Array.from({ length: 4 }, (_, index) => ({ shape, color: index === odd ? other : main }));
    prompt = 'Three of the figures have the same colour. Which figure is the odd one out?';
  } else if (prop === 'shape') {
    const [main, other] = r.shuffle(PATTERN_SHAPES);
    const color = r.pick(PATTERN_COLOURS);
    items = Array.from({ length: 4 }, (_, index) => ({ shape: index === odd ? other : main, color }));
    prompt = 'Three of the figures have the same shape. Which figure is the odd one out?';
  } else if (prop === 'sides') {
    const color = r.pick(PATTERN_COLOURS);
    const group = r.pick(['square', 'diamond']);
    const lone = r.pick(['triangle', 'pentagon', 'hexagon']);
    const mates = group === 'square' ? ['square', 'diamond', 'square'] : ['diamond', 'square', 'diamond'];
    let slot = 0;
    items = Array.from({ length: 4 }, (_, index) => ({ shape: index === odd ? lone : mates[slot++], color }));
    prompt = 'Three of the figures have the same number of sides. Which figure is the odd one out?';
  } else {
    const shape = r.pick(PATTERN_SHAPES);
    const color = r.pick(PATTERN_COLOURS);
    items = Array.from({ length: 4 }, (_, index) => ({ shape, color, size: index === odd ? 'small' : 'big' }));
    prompt = 'Three of the figures are the same size. Which figure is the odd one out?';
  }
  const letters = ['A', 'B', 'C', 'D'];
  return textQ({
    family,
    prompt,
    answer: letters[odd],
    hint: 'Compare the figures. Find what three of them share, then pick the one that is different.',
    explanation: `Three figures match and figure ${letters[odd]} is different.`,
    givens: { prop },
    visual: {
      kind: 'v3-class-3-seq', items, labels: true,
      description: `Four figures labelled A to D: ${items.map((item, index) => `${letters[index]} is ${/^[aeiou]/.test(item.size === 'small' ? 'small' : item.color) ? 'an' : 'a'} ${item.size === 'small' ? 'small ' : ''}${item.color} ${item.shape}`).join('; ')}.`,
    },
    wrongs: letters.filter((_, index) => index !== odd).map(letter => [letter, 'ignored-condition']),
  });
}

function solveOddOut(question) {
  const { prop } = question.proof.givens;
  const { items } = question.visual;
  const key = { colour: item => item.color, shape: item => item.shape, sides: item => SIDES[item.shape], size: item => item.size ?? 'big' }[prop];
  const keys = items.map(key);
  const odd = keys.findIndex(value => keys.filter(other => other === value).length === 1);
  return 'ABCD'[odd];
}
DRAFT['class-3-odd-out'] = draftOddOut;
SOLVE['class-3-odd-out'] = solveOddOut;

// ---- rule from two pairs ----
function draftPairRule(family, grade, level, r) {
  const mode = level === 1 ? r.pick(['times', 'plus']) : r.pick(['times', 'plus', 'both', 'both', 'minus']);
  const k = mode === 'times' || mode === 'both' ? r.int(2, 6) : 1;
  const j = mode === 'times' ? 0 : mode === 'plus' ? r.int(2, 15) : mode === 'minus' ? -r.int(1, 6) : r.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]);
  const xs = r.shuffle(range(2, 12)).slice(0, 3).sort((a, b) => a - b);
  const [x1, x2] = xs;
  const z = xs[2];
  const out = x => k * x + j;
  if ([x1, x2, z].some(x => out(x) < 1)) throw new QuestionRetry('negative output');
  const [y1, y2] = [out(x1), out(x2)];
  const answer = out(z);
  const wrongs = [[k * z, 'class-3-rule-flip'], [z + (y2 - x2), 'class-3-rule-flip'], [z + j, 'class-3-rule-flip'], [y2 + (z - x2), 'class-3-rule-flip'], [answer + 1, 'missing-step']];
  return numberQ(r, {
    family,
    prompt: `A rule machine changes ${x1} into ${y1} and ${x2} into ${y2}. What does it change ${z} into?`,
    answer,
    hint: 'Look at how the first number turns into the second in both pairs. Use that same rule on the new number.',
    explanation: `The rule turns ${x1} into ${y1} and ${x2} into ${y2}, so ${z} becomes ${answer}.`,
    givens: { x1, y1, x2, y2, z },
    wrongs, min: 1, max: 200,
  });
}

function solvePairRule(question) {
  const { x1, y1, x2, y2, z } = question.proof.givens;
  const k = (y2 - y1) / (x2 - x1);
  return k * z + (y1 - k * x1);
}
DRAFT['class-3-pair-rule'] = draftPairRule;
SOLVE['class-3-pair-rule'] = solvePairRule;

// ---- triangle corners and centre ----
const TRIANGLE_RULES = [
  ([a, b, c]) => a + b + c,
  ([a, b, c]) => a * b + c,
  ([a, b, c]) => (a + b) * c,
  ([a, b, c]) => a * c + b,
  ([a, b, c]) => a + b * c,
  ([a, b, c]) => a * b * c,
];

function draftTriangleRule(family, grade, level, r) {
  const pool = level === 1 ? [0, 1] : [0, 1, 2, 3, 4, 5];
  const ruleIndex = r.pick(pool);
  const rule = TRIANGLE_RULES[ruleIndex];
  const corners = () => [r.int(2, 6), r.int(2, 6), r.int(2, 6)];
  const first = corners();
  const second = corners();
  const third = corners();
  const fitsBoth = fn => fn(first) === rule(first) && fn(second) === rule(second);
  const rivals = TRIANGLE_RULES.filter((fn, index) => index !== ruleIndex && index < (level === 1 ? 2 : 6));
  if (rivals.some(fitsBoth) || rule(first) > 99 || rule(second) > 99 || rule(third) > 120) throw new QuestionRetry('rule not unique');
  const answer = rule(third);
  const wrongs = rivals.map(fn => [fn(third), 'class-3-rule-flip']);
  return numberQ(r, {
    family,
    prompt: `Triangle 1: corners ${first.join(', ')}, centre ${rule(first)}. Triangle 2: corners ${second.join(', ')}, centre ${rule(second)}. Triangle 3: corners ${third.join(', ')}. What is its centre?`,
    answer,
    hint: 'Find one rule that gives the centre for both triangles. Then use it on triangle 3.',
    explanation: `The same rule gives the centre of triangle 3 as ${answer}.`,
    givens: { examples: [[first, rule(first)], [second, rule(second)]], third, limit: level === 1 ? 2 : 6 },
    wrongs, min: 1, max: 160,
  });
}

function solveTriangleRule(question) {
  const { examples, third, limit } = question.proof.givens;
  const fits = TRIANGLE_RULES.slice(0, limit).filter(fn => examples.every(([corners, centre]) => fn(corners) === centre));
  if (fits.length !== 1) throw new Error('Exactly one rule must fit.');
  return fits[0](third);
}
DRAFT['class-3-triangle-rule'] = draftTriangleRule;
SOLVE['class-3-triangle-rule'] = solveTriangleRule;

// ---- secret codes ----
const CODE_SETS = [
  { cow: 'gives us milk', hen: 'lays eggs', dog: 'barks', sheep: 'gives us wool', duck: 'says quack', cat: 'says meow', horse: 'pulls a cart' },
  { pen: 'we write with', clock: 'tells the time', cup: 'we drink from', book: 'we read', bed: 'we sleep on', spoon: 'we eat soup with', bag: 'carries our books' },
];

function draftCode(family, grade, level, r) {
  const set = r.pick(CODE_SETS);
  const names = Object.keys(set);
  const size = level === 1 ? 3 : r.pick([3, 4]);
  const cycle = r.shuffle(names).slice(0, size);
  const real = r.pick(cycle);
  const next = cycle[(cycle.indexOf(real) + 1) % size];
  const previous = cycle[(cycle.indexOf(real) + size - 1) % size];
  const rule = cycle.map((name, index) => `a ${name} is called a ${cycle[(index + 1) % size]}`);
  const outside = r.shuffle(names.filter(name => !cycle.includes(name)))[0];
  const clue = set === CODE_SETS[0] ? `the animal that ${set[real]}` : `the thing ${set[real]}`;
  const wrongs = [[real, 'class-3-code-chain'], [previous, 'class-3-code-chain'], ...cycle.filter(name => ![real, previous, next].includes(name)).map(name => [name, 'class-3-code-chain']), [outside, 'missed-object']];
  return textQ({
    family,
    prompt: `In a code, ${rule.slice(0, -1).join(', ')} and ${rule[size - 1]}. What is ${clue} called in the code?`,
    answer: next,
    hint: 'First name the real thing from the clue. Then use the code to change its name.',
    explanation: `${clue.replace(/^the /, 'The ')} is a ${real}. In the code, a ${real} is called a ${next}.`,
    givens: { cycle, set: set === CODE_SETS[0] ? 0 : 1, prop: set[real] },
    wrongs,
  });
}

function solveCode(question) {
  const { cycle, prop, set } = question.proof.givens;
  const table = CODE_SETS[set];
  const real = Object.keys(table).find(name => table[name] === prop);
  return cycle[(cycle.indexOf(real) + 1) % cycle.length];
}
DRAFT['class-3-word-code'] = draftCode;
SOLVE['class-3-word-code'] = solveCode;

// ---- ordering clues ----
const COMPARES = [
  { more: 'taller', less: 'shorter', top: 'tallest', low: 'shortest' },
  { more: 'older', less: 'younger', top: 'oldest', low: 'youngest' },
  { more: 'heavier', less: 'lighter', top: 'heaviest', low: 'lightest' },
  { more: 'faster', less: 'slower', top: 'fastest', low: 'slowest' },
];

function draftOrderClues(family, grade, level, r) {
  const word = r.pick(COMPARES);
  const order = r.shuffle(NAMES).slice(0, 4);
  const clues = [0, 1, 2].map(index => {
    const flip = r.int(0, 1) === 1;
    return flip
      ? { text: `${order[index + 1]} is ${word.less} than ${order[index]}.`, pair: [index, index + 1] }
      : { text: `${order[index]} is ${word.more} than ${order[index + 1]}.`, pair: [index, index + 1] };
  });
  const shown = r.shuffle(clues);
  const kind = level === 1 ? r.pick(['top', 'low']) : r.pick(['top', 'low', 'second', 'third', 'above']);
  const pairs = shown.map(clue => clue.pair);
  const givens = { kind, pairs, names: order };
  let prompt;
  let answer;
  let target;
  if (kind === 'top') { prompt = `Who is the ${word.top}?`; answer = order[0]; }
  else if (kind === 'low') { prompt = `Who is the ${word.low}?`; answer = order[3]; }
  else if (kind === 'second') { prompt = `Who is the second ${word.top}?`; answer = order[1]; }
  else if (kind === 'third') { prompt = `Who is the second ${word.low}?`; answer = order[2]; }
  else { target = r.int(1, 3); prompt = `How many children are ${word.more} than ${order[target]}?`; answer = target; givens.target = target; }
  const stem = shown.map(clue => clue.text).join(' ');
  if (kind === 'above') {
    return numberQ(r, {
      family, prompt: `${stem} ${prompt}`, answer,
      hint: 'Put the four children in one line from first to last. Then count the ones before the named child.',
      explanation: `The order is ${order.join(', ')}. ${answer} ${answer === 1 ? 'child is' : 'children are'} ${word.more}.`,
      givens, wrongs: [[answer + 1, 'class-3-order-clue'], [answer - 1, 'class-3-order-clue'], [3 - answer, 'class-3-order-clue']], min: 0, max: 3,
    });
  }
  const others = order.filter(name => name !== answer);
  const near = kind === 'top' ? order[1] : kind === 'low' ? order[2] : kind === 'second' ? order[2] : order[1];
  const wrongs = [near, ...others.filter(name => name !== near)].map(name => [name, 'class-3-order-clue']);
  return textQ({
    family, prompt: `${stem} ${prompt}`, answer,
    hint: 'Put the four children in one line from first to last. Use every clue.',
    explanation: `The order is ${order.join(', ')}. So the answer is ${answer}.`,
    givens, wrongs,
  });
}

function solveOrderClues(question) {
  const { kind, pairs, names, target } = question.proof.givens;
  const beats = names.map(() => new Set());
  for (let round = 0; round < 3; round++) for (const [hi, lo] of pairs) { beats[hi].add(lo); for (const below of beats[lo]) beats[hi].add(below); }
  const ranked = names.map((name, index) => ({ name, wins: beats[index].size })).sort((a, b) => b.wins - a.wins);
  if (kind === 'above') return names.filter((_, index) => beats[index].has(target)).length;
  const place = { top: 0, low: 3, second: 1, third: 2 }[kind];
  return ranked[place].name;
}
DRAFT['class-3-order-clues'] = draftOrderClues;
SOLVE['class-3-order-clues'] = solveOrderClues;

// ---- counting ways ----
const PAIRS = [
  ['spoon', 'spoons', 'bowl', 'bowls'],
  ['bottle', 'bottles', 'lunch box', 'lunch boxes'],
  ['cap', 'caps', 'scarf', 'scarves'],
  ['pen', 'pens', 'notebook', 'notebooks'],
  ['shirt', 'shirts', 'skirt', 'skirts'],
  ['bat', 'bats', 'ball', 'balls'],
];
const THIRDS = [['sticker', 'stickers'], ['ribbon', 'ribbons'], ['badge', 'badges'], ['bag', 'bags']];

function draftPickWays(family, grade, level, r) {
  const kind = level === 1 ? r.pick(['two']) : r.pick(['two', 'three', 'shake', 'two', 'ban']);
  const [oneA, manyA, oneB, manyB] = r.pick(PAIRS);
  const a = r.int(2, level === 1 ? 5 : 9);
  const b = r.int(2, level === 1 ? 5 : 8);
  const who = NAMES[r.int(0, NAMES.length - 1)];
  const list = (n, one, many) => count(n, one, many);
  if (kind === 'two') {
    return numberQ(r, {
      family, prompt: `${who} has ${list(a, oneA, manyA)} and ${list(b, oneB, manyB)}. ${who} picks one of each. How many different pairs can ${who} make?`,
      answer: a * b, hint: 'Each choice of the first can go with every choice of the second. Multiply.',
      explanation: `${a} × ${b} = ${a * b} pairs.`, givens: { kind, a, b },
      wrongs: [[a + b, 'class-3-ways-product'], [a * b - a, 'missing-step'], [a * b + a, 'missing-step']], min: 4, max: 99,
    });
  }
  if (kind === 'three') {
    const [oneC, manyC] = r.pick(THIRDS);
    const c = r.int(2, 4);
    return numberQ(r, {
      family, prompt: `${who} has ${list(a, oneA, manyA)}, ${list(b, oneB, manyB)} and ${list(c, oneC, manyC)}. ${who} picks one of each kind. How many different sets are there?`,
      answer: a * b * c, hint: 'Multiply the number of choices for each kind, one after the other.',
      explanation: `${a} × ${b} × ${c} = ${a * b * c} sets.`, givens: { kind, a, b, c },
      wrongs: [[a + b + c, 'class-3-ways-product'], [a * b + c, 'class-3-ways-product'], [a * b, 'missing-step']], min: 6, max: 400,
    });
  }
  if (kind === 'ban') {
    const banned = r.int(1, Math.max(1, Math.min(3, a * b - 4)));
    return numberQ(r, {
      family, prompt: `${who} has ${list(a, oneA, manyA)} and ${list(b, oneB, manyB)}. ${who} picks one of each, but ${count(banned, 'pair')} ${banned === 1 ? 'does' : 'do'} not go together. How many pairs are allowed?`,
      answer: a * b - banned, hint: 'Count all the pairs first. Then take away the pairs that are not allowed.',
      explanation: `${a} × ${b} = ${a * b}. ${a * b} − ${banned} = ${a * b - banned}.`, givens: { kind, a, b, banned },
      wrongs: [[a * b, 'class-3-ways-product'], [a * b + banned, 'wrong-operation'], [a + b - banned, 'class-3-ways-product']], min: 3, max: 99,
    });
  }
  const people = r.int(3, 7);
  return numberQ(r, {
    family, prompt: `${people} friends meet. Each friend shakes hands once with every other friend. How many handshakes are there?`,
    answer: people * (people - 1) / 2, hint: 'Each pair of friends shakes hands once. Count a pair only one time.',
    explanation: `${people} × ${people - 1} = ${people * (people - 1)}. Each handshake is counted twice, so ${people * (people - 1) / 2}.`, givens: { kind, people },
    wrongs: [[people * (people - 1), 'class-3-ways-product'], [people * (people - 1) / 2 + people, 'included-extra'], [people, 'wrong-operation']], min: 1, max: 50,
  });
}

function solvePickWays(question) {
  const g = question.proof.givens;
  if (g.kind === 'two') return g.a * g.b;
  if (g.kind === 'three') return g.a * g.b * g.c;
  if (g.kind === 'ban') return g.a * g.b - g.banned;
  return g.people * (g.people - 1) / 2;
}
DRAFT['class-3-pick-ways'] = draftPickWays;
SOLVE['class-3-pick-ways'] = solvePickWays;
