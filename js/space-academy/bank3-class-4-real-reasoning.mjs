// Logical-reasoning families modelled on the printed SOF IMO Class 4 papers (word codes, compass turns,
// row clues, day counts, letter positions, number grids). Every spec's calc() recomputes from the givens.
import { QuestionRetry } from './bank-shared.mjs';
import { NAMES, mod, ordinal, pic, plural } from './bank3-class-4-real-core.mjs';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WORDS4 = ['ROAD', 'SWAN', 'LAMP', 'DESK', 'BIRD', 'FISH', 'PLAN', 'COIN', 'MARK', 'HOPE', 'MILK', 'TUNE', 'PINK', 'GOLD', 'WIND', 'JUMP'];
const WORDS5 = ['PLANT', 'TRAIN', 'BRICK', 'CLOUD', 'FLAME', 'GRAPE', 'MOUSE', 'SPACE', 'NIGHT', 'WORLD', 'HORSE', 'STORM'];
const ARRANGE = ['PLAN', 'MILK', 'DESK', 'BIRD', 'ROAD', 'PLANT', 'TRAIN', 'STAMP', 'WATER', 'MOUSE', 'SPACE', 'CLOUD', 'ORANGE', 'SPIDER', 'ROCKET', 'PLANET', 'BASKET', 'GARDEN'];
const PLACES = ['Bank', 'School', 'Park', 'Zoo', 'Shop', 'Pier', 'Mall', 'Fort', 'Hotel', 'Temple', 'Library', 'Station'];
const BEADS = [['bead', 'beads'], ['tile', 'tiles'], ['flag', 'flags'], ['lamp', 'lamps'], ['seat', 'seats'], ['house', 'houses']];
const DICTIONARY = ['PEN', 'PET', 'PAN', 'PIN', 'PLUM', 'PEAR', 'POND', 'BAT', 'BALL', 'BELL', 'BOAT', 'CAKE', 'CAMP', 'CAT', 'COIN', 'DESK', 'DOLL', 'DUCK', 'FAN', 'FISH', 'FROG', 'GOAT', 'GIFT', 'HAT', 'HEN', 'INK', 'JAM', 'KITE', 'LAMP', 'LEAF', 'MAP', 'MILK', 'NEST', 'OWL', 'RAIN', 'SUN', 'SALT', 'TREE', 'TOY', 'WIND'];
const wrongList = (values, code) => values.map(value => [value, code]);

function inferPermutation(example, coded) {
  const positions = [...coded].map(letter => [...example].indexOf(letter));
  if (positions.some(p => p < 0) || new Set(positions).size !== positions.length) throw new Error('The coded word is not a rearrangement.');
  return positions;
}

const specs = {
  'class-4-word-code': {
    gen(level, r) {
      const long = level === 3, pool = long ? WORDS5 : WORDS4, n = long ? 5 : 4;
      let perm;
      do perm = r.shuffle([...Array(n).keys()]); while (perm.every((p, i) => p === i) || perm.every((p, i) => p === n - 1 - i));
      const [example, target] = r.shuffle(pool);
      return { example, coded: perm.map(p => example[p]).join(''), target };
    },
    calc(g) {
      const perm = inferPermutation(g.example, g.coded);
      const apply = word => perm.map(p => word[p]).join('');
      const inverse = perm.map((_, i) => perm.indexOf(i));
      const t = g.target;
      return {
        prompt: `In a code, ${g.example} is written as ${g.coded}. How is ${t} written in that code?`,
        answer: apply(t),
        wrongs: wrongList([inverse.map(p => t[p]).join(''), [...t].reverse().join(''), t.slice(1) + t[0], t[1] + t[0] + t.slice(2)], 'code-order'),
        hint: 'Find where each letter of the first word moved, then move the second word the same way.',
        explanation: `Positions ${perm.map(p => p + 1).join(', ')} of ${g.example} give ${g.coded}. The same positions of ${t} give ${apply(t)}.`,
      };
    },
  },

  'class-4-letter-shift': {
    gen(level, r) {
      const shifts = level === 3 ? [r.int(1, 4), -r.int(1, 3)] : [r.int(1, 5)];
      const [example, target] = r.shuffle(level === 1 ? WORDS4 : [...WORDS4, ...WORDS5]);
      return { example, shifts, target };
    },
    calc(g) {
      const move = (word, shifts) => [...word].map((letter, i) => ABC[mod(ABC.indexOf(letter) + shifts[i % shifts.length], 26)]).join('');
      const coded = move(g.example, g.shifts);
      const first = g.shifts[0];
      const sign = value => value > 0 ? `${value} forward` : `${-value} back`;
      const description = g.shifts.length === 1 ? `every letter moves ${plural(Math.abs(first), 'place')} ${first > 0 ? 'forward' : 'back'}` : `letters alternate between ${sign(g.shifts[0])} and ${sign(g.shifts[1])}`;
      return {
        prompt: `In a code, ${g.example} is written as ${coded}. How is ${g.target} written in that code?`,
        answer: move(g.target, g.shifts),
        wrongs: wrongList([move(g.target, g.shifts.map(value => -value)), move(g.target, [g.shifts[0]]), move(g.target, g.shifts.map(value => value + 1)), move(g.target, g.shifts.map(value => value - 1))], 'code-order'),
        hint: 'Compare the first letters of the example to see how far each letter moves.',
        explanation: `In ${g.example} → ${coded}, ${description}. Doing the same to ${g.target} gives ${move(g.target, g.shifts)}.`,
      };
    },
  },

  'class-4-cycle-position': {
    gen(level, r) {
      const size = level === 1 ? 3 : r.int(3, 5);
      const cycle = r.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, size);
      const n = level === 1 ? r.int(8, 25) : level === 2 ? r.int(20, 60) : r.int(50, 150);
      return { cycle, n, noun: r.int(0, BEADS.length - 1) };
    },
    calc(g) {
      const { cycle, n } = g, size = cycle.length, [one, many] = BEADS[g.noun];
      const answer = cycle[(n - 1) % size];
      const shown = [...cycle, ...cycle].join(', ');
      return {
        prompt: `${many[0].toUpperCase() + many.slice(1)} are numbered ${shown}, ... and the pattern keeps repeating. What number is on ${one} ${n}?`,
        answer,
        wrongs: [...cycle.filter(value => value !== answer).map(value => [value, 'repeat-unit']), [cycle[0] + cycle[1], 'code-order'], [size, 'remainder-rule']],
        hint: 'Divide the position by the length of one repeat and use the remainder.',
        explanation: `The pattern has ${size} numbers. ${n} ÷ ${size} leaves remainder ${n % size}, so ${n % size ? `${one} ${n} matches position ${n % size}` : `${one} ${n} matches the last number`}: ${answer}.`,
      };
    },
  },

  'class-4-compass-turn': {
    gen(level, r) {
      const places = r.shuffle(PLACES).slice(0, 8);
      const eighths = level === 1 ? r.pick([2, 4, 6]) : r.int(1, 7);
      return { places, start: r.int(0, 7), eighths, clockwise: level === 1 ? true : r.int(0, 1) === 1, who: r.pick(NAMES) };
    },
    calc(g) {
      const step = g.clockwise ? g.eighths : -g.eighths;
      const at = index => g.places[mod(index, 8)];
      const text = { 2: '1/4', 4: '1/2', 6: '3/4' }[g.eighths] ?? `${g.eighths}/8`;
      return {
        prompt: `Places around a circle, clockwise: ${g.places.join(', ')}. ${g.who} faces the ${g.places[g.start]} and turns ${text} of a full turn ${g.clockwise ? 'clockwise' : 'anticlockwise'}. Which place does ${g.who} face now?`,
        answer: at(g.start + step),
        wrongs: [[at(g.start - step), 'turn-frame'], [at(g.start + step + 1), 'counted-endpoints'], [at(g.start + step - 1), 'counted-endpoints'], [at(g.start + 4), 'turn-frame']],
        hint: 'A full turn passes eight places. Count that many places in the turning direction.',
        explanation: `${text} of a turn is ${plural(g.eighths, 'place')}. Counting ${g.clockwise ? 'clockwise' : 'anticlockwise'} from ${g.places[g.start]} reaches ${at(g.start + step)}.`,
      };
    },
  },

  'class-4-letter-arrange': {
    gen(level, r) {
      const pool = ARRANGE.filter(word => word.length === (level === 1 ? 4 : level === 2 ? 5 : 6) || (level === 3 && word.length === 5));
      const word = r.pick(pool);
      const order = r.shuffle([...Array(word.length).keys()]);
      return { pairs: order.map(i => [word[i], i + 1]) };
    },
    calc(g) {
      const build = pairs => pairs.map(([letter]) => letter).join('');
      const sorted = [...g.pairs].sort((a, b) => a[1] - b[1]);
      const answer = build(sorted);
      const listed = build(g.pairs);
      if (listed === answer) throw new QuestionRetry('The letters are already in order.');
      const swapped = [...answer];
      [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
      return {
        prompt: `Put the letters in order of their numbers: ${g.pairs.map(([letter, number]) => `${letter} (${number})`).join(', ')}. Which word is formed?`,
        answer,
        wrongs: wrongList([listed, build([...sorted].reverse()), swapped.join(''), answer.slice(-1) + answer.slice(0, -1)], 'code-order'),
        hint: 'Write the letter numbered 1 first, then 2, and so on.',
        explanation: `Order the letters by number: ${sorted.map(([letter, number]) => `${number}=${letter}`).join(', ')}. The word is ${answer}.`,
      };
    },
  },

  'class-4-alphabet-position': {
    gen(level, r) {
      const fromRight = level === 1 ? 'left' : r.pick(['right', 'left']);
      const a = r.int(3, 11), b = r.int(3, 9);
      return { fromRight, a, b, step: r.pick(['left', 'right']) };
    },
    calc(g) {
      const base = g.fromRight === 'right' ? 27 - g.a : g.a;
      const answerIndex = g.step === 'left' ? base - g.b : base + g.b;
      if (answerIndex < 1 || answerIndex > 26) throw new QuestionRetry('The letter is outside the alphabet.');
      const letter = index => ABC[index - 1];
      return {
        prompt: `Which letter is ${ordinal(g.b)} to the ${g.step} of the ${ordinal(g.a)} letter from the ${g.fromRight} in the English alphabet?`,
        answer: letter(answerIndex),
        wrongs: [[letter(Math.min(26, answerIndex + 1)), 'position-end'], [letter(Math.max(1, answerIndex - 1)), 'position-end'], [letter(27 - answerIndex), 'position-end'], [letter(g.step === 'left' ? Math.min(26, base + g.b) : Math.max(1, base - g.b)), 'turn-frame']],
        hint: 'First find the starting letter by its alphabet number, then move that many letters.',
        explanation: `The ${ordinal(g.a)} letter from the ${g.fromRight} is ${letter(base)}, number ${base}. Moving ${g.b} to the ${g.step} reaches number ${answerIndex}: ${letter(answerIndex)}.`,
      };
    },
  },

  'class-4-row-order': {
    gen(level, r) {
      const n = level === 1 ? 4 : 5;
      const names = r.shuffle(NAMES).slice(0, n);
      const row = r.shuffle(names);
      const at = name => row.indexOf(name);
      const pool = [];
      for (const a of names) for (const b of names) if (a !== b) {
        if (at(a) < at(b)) pool.push({ t: 'left', a, b });
        if (Math.abs(at(a) - at(b)) === 1) pool.push({ t: 'next', a, b });
        if (at(b) - at(a) === 1) pool.push({ t: 'just', a, b });
      }
      for (const a of names) {
        if (at(a) === 0 || at(a) === n - 1) pool.push({ t: 'end', a });
        pool.push({ t: 'from', a, k: at(a) + 1 });
      }
      const clues = [];
      let alive = permute(names);
      const limit = n === 5 ? 4 : 3;
      while (alive.length > 1 && clues.length < limit) {
        const scored = r.shuffle(pool).map(clue => ({ clue, left: alive.filter(candidate => clueHolds(candidate, clue)).length }));
        const best = scored.reduce((a, b) => b.left < a.left ? b : a);
        clues.push(best.clue);
        alive = alive.filter(candidate => clueHolds(candidate, best.clue));
      }
      if (alive.length !== 1) throw new QuestionRetry('The clues do not give one row.');
      const asks = n === 5 ? [{ at: 1 }, { at: 3 }, { at: 2 }, { at: 5 }, { at: 4 }] : [{ at: 1 }, { at: 4 }, { at: 2 }, { at: 3 }];
      const open = asks.filter(a => !clues.some(c => c.t === 'from' && c.k === a.at));
      if (!open.length) throw new QuestionRetry('Every position is given away.');
      return { names, clues, ask: r.pick(open).at };
    },
    calc(g) {
      const rows = rowsMatching(g.names, g.clues);
      if (rows.length !== 1) throw new Error('The clues do not give exactly one row.');
      const row = rows[0], n = g.names.length;
      const where = g.ask === 1 ? 'at the left end' : g.ask === n ? 'at the right end' : g.ask === 3 && n === 5 ? 'in the middle' : `${ordinal(g.ask)} from the left`;
      return {
        prompt: `${g.names.join(', ')} stand in a row. ${g.clues.map(clueText).join(' ')} Who stands ${where}?`,
        answer: row[g.ask - 1],
        wrongs: g.names.filter(name => name !== row[g.ask - 1]).map(name => [name, 'ignored-condition']),
        hint: 'Place the surest clue first, then test every other clue against your row.',
        explanation: `Only one row fits every clue: ${row.join(', ')}. ${row[g.ask - 1]} stands ${where}.`,
      };
    },
  },

  'class-4-day-count': {
    gen(level, r) {
      let k;
      do k = level === 1 ? r.int(3, 13) : level === 2 ? r.int(9, 45) : r.int(30, 120); while (k % 7 === 0);
      return { ref: r.pick(['yesterday', 'tomorrow', 'today', 'dayAfter', 'dayBefore']), day: r.int(0, 6), k, back: level > 1 && r.int(0, 2) === 0 };
    },
    calc(g) {
      const shift = { yesterday: 1, tomorrow: -1, today: 0, dayAfter: -2, dayBefore: 2 }[g.ref];
      const phrase = { yesterday: 'yesterday was', tomorrow: 'tomorrow is', today: 'today is', dayAfter: 'the day after tomorrow is', dayBefore: 'the day before yesterday was' }[g.ref];
      const today = g.day + shift, move = g.back ? -g.k : g.k;
      const dayAt = index => DAYS[mod(index, 7)];
      return {
        prompt: `If ${phrase} ${DAYS[g.day]}, what day ${g.back ? 'was it' : 'will it be'} ${plural(g.k, 'day')} ${g.back ? 'ago' : 'from today'}?`,
        answer: dayAt(today + move),
        wrongs: [[dayAt(g.day + move), 'ignored-change'], [dayAt(today + move + 1), 'counted-endpoints'], [dayAt(today + move - 1), 'counted-endpoints'], [dayAt(today - move), 'time-direction']],
        hint: 'Work out what day today is first. Then use the remainder after dividing by 7.',
        explanation: `Today is ${dayAt(today)}. ${g.k} ÷ 7 leaves ${g.k % 7}, so ${g.back ? 'going back' : 'going forward'} ${plural(g.k % 7, 'day')} gives ${dayAt(today + move)}.`,
      };
    },
  },

  'class-4-number-analogy': {
    gen(level, r) {
      const rule = analogyRules(level, r);
      const x = r.int(2, level === 1 ? 6 : 9);
      let target = r.int(2, 12);
      if (target === x) target++;
      return { x, y: rule(x), target };
    },
    calc(g) {
      const matches = ANALOGY.filter(rule => rule.f(g.x) === g.y);
      const answers = new Set(matches.map(rule => rule.f(g.target)));
      if (answers.size !== 1) throw new QuestionRetry('The pair fits more than one rule.');
      const rule = matches[0];
      return {
        prompt: `${g.x} : ${g.y} :: ${g.target} : ?`,
        answer: rule.f(g.target),
        wrongs: ANALOGY.filter(other => other.f(g.target) !== rule.f(g.target)).map(other => [other.f(g.target), 'wrong-operation']),
        hint: 'Find one rule that turns the first number into the second, then apply it again.',
        explanation: `The rule is ${rule.text}. ${g.x} becomes ${g.y}, so ${g.target} becomes ${rule.f(g.target)}.`,
      };
    },
  },

  'class-4-symmetry-letters': {
    gen(level, r) {
      const mode = r.pick(['one', 'group', 'count', 'group']);
      const bad = r.shuffle([...NONSYM]), good = r.shuffle([...SYM]);
      if (mode === 'one') return { mode, letters: r.shuffle([bad[0], good[0], good[1], good[2]]), want: 'none' };
      if (mode === 'count') return { mode, letters: r.shuffle([...bad.slice(0, r.int(1, 3)), ...good.slice(0, r.int(2, 3))]), want: 'count' };
      const groups = [bad.slice(0, 3), [bad[3], bad[4], good[0]], [bad[5], good[1], bad[6]], [good[2], bad[7], bad[8]]];
      return { mode, groups: r.shuffle(groups), want: 'none' };
    },
    calc(g) {
      const has = letter => SYM.includes(letter);
      if (g.mode === 'one') {
        const answer = g.letters.filter(letter => !has(letter));
        if (answer.length !== 1) throw new Error('Exactly one letter must lack a line of symmetry.');
        return {
          prompt: `Which of these capital letters has no line of symmetry: ${g.letters.join(', ')}?`,
          answer: answer[0],
          wrongs: g.letters.filter(letter => has(letter)).map(letter => [letter, 'wrong-transform']),
          hint: 'Imagine folding each letter. A line of symmetry makes both halves match exactly.',
          explanation: `${g.letters.filter(has).join(', ')} can be folded to match. ${answer[0]} cannot, so it has no line of symmetry.`,
        };
      }
      if (g.mode === 'count') {
        const count = g.letters.filter(has).length;
        return {
          prompt: `How many of the capital letters ${g.letters.join(', ')} have a line of symmetry?`,
          answer: count,
          wrongs: [[count + 1, 'wrong-transform'], [count + 2, 'wrong-transform'], [Math.max(0, count - 1), 'wrong-transform'], [g.letters.length, 'wrong-transform'], [count + 3, 'wrong-transform']],
          hint: 'Fold each letter in your mind, top to bottom and side to side.',
          explanation: `${g.letters.filter(has).join(', ')} have a line of symmetry. That makes ${count}.`,
        };
      }
      const flawless = g.groups.filter(group => group.every(letter => !has(letter)));
      if (flawless.length !== 1) throw new Error('Exactly one group must have no line of symmetry.');
      return {
        prompt: 'Which group of capital letters has no line of symmetry in any letter?',
        answer: flawless[0].join(', '),
        wrongs: g.groups.filter(group => group !== flawless[0]).map(group => [group.join(', '), 'wrong-transform']),
        hint: 'A turn is not a fold. Test each letter with a fold line.',
        explanation: `Every letter in ${flawless[0].join(', ')} fails the fold test. Each other group has a letter that folds onto itself.`,
      };
    },
  },

  'class-4-grid-rule': {
    gen(level, r) {
      const rule = r.pick(GRID_RULES.slice(0, level === 1 ? 2 : level === 2 ? 4 : 6));
      const rows = Array.from({ length: 3 }, () => {
        const a = r.int(2, 9), b = r.int(2, 9);
        return [a, b, rule.f(a, b)];
      });
      rows[2][2] = null;
      return { rows };
    },
    calc(g) {
      const done = g.rows.slice(0, 2), [a, b] = g.rows[2];
      const fits = GRID_RULES.filter(rule => done.every(([x, y, z]) => rule.f(x, y) === z));
      if (!fits.length || new Set(fits.map(rule => rule.f(a, b))).size !== 1) throw new QuestionRetry('The rows do not give one rule.');
      const answer = fits[0].f(a, b);
      return {
        prompt: `Each row follows the same rule. What number replaces ? in the last row, ${a}, ${b}, ?`,
        answer,
        wrongs: [...GRID_RULES.filter(rule => rule.f(a, b) !== answer).map(rule => [rule.f(a, b), 'wrong-operation']), [a + b + 1, 'code-order']],
        hint: 'Test the complete rows first to find how the first two numbers make the third.',
        explanation: `In the complete rows, ${fits[0].text}. So the last row gives ${answer}.`,
        visual: pic('grid-rule', { rows: g.rows }, `Number grid with three rows. ${g.rows.map(row => `${row[0]}, ${row[1]}, ${row[2] ?? 'question mark'}`).join('; ')}. Each row follows one rule.`),
      };
    },
  },

  'class-4-number-series': {
    gen(level, r) {
      const kinds = level === 1 ? ['add', 'mul'] : level === 2 ? ['add', 'mul', 'grow', 'alt', 'fib'] : ['mul', 'grow', 'alt', 'square', 'fib', 'fib'];
      const kind = r.pick(kinds);
      if (kind === 'fib') return { kind, start: r.int(2, 14), p: r.int(3, 16), q: 0 };
      if (kind === 'add') return { kind, start: r.int(3, 40), p: r.int(3, 15), q: 0 };
      if (kind === 'mul') return { kind, start: r.int(1, 5), p: r.int(2, 4), q: 0 };
      if (kind === 'grow') return { kind, start: r.int(1, 20), p: r.int(1, 4), q: r.int(1, 3) };
      if (kind === 'alt') return { kind, start: r.int(20, 60), p: r.int(5, 12), q: r.int(2, 4) };
      return { kind, start: r.int(2, 5), p: r.int(0, 3), q: 0 };
    },
    calc(g) {
      const terms = [g.start];
      for (let i = 1; i < 6; i++) {
        const last = terms[i - 1];
        terms.push(g.kind === 'fib' ? (i === 1 ? g.p : last + terms[i - 2]) : g.kind === 'add' ? last + g.p : g.kind === 'mul' ? last * g.p : g.kind === 'grow' ? last + g.p + g.q * (i - 1) : g.kind === 'alt' ? (i % 2 ? last + g.p : last - g.q) : (g.start + i) ** 2 + g.p);
      }
      if (g.kind === 'square') terms[0] = g.start ** 2 + g.p;
      const shown = terms.slice(0, 5), answer = terms[5], last = terms[4], gap = last - terms[3];
      const rule = { fib: 'each number is the sum of the two numbers before it', add: `add ${g.p} each time`, mul: `multiply by ${g.p} each time`, grow: `the gap grows by ${g.q}: +${g.p}, +${g.p + g.q}, ...`, alt: `add ${g.p}, then subtract ${g.q}, and repeat`, square: `square numbers${g.p ? ` plus ${g.p}` : ''}` }[g.kind];
      return {
        prompt: `Find the next number in the series: ${shown.join(', ')}, ?`,
        answer,
        wrongs: [[last + gap, 'repeat-unit'], [answer + 1, 'repeat-unit'], [Math.max(1, answer - 1), 'repeat-unit'], [last * 2, 'wrong-operation'], [last + g.p, 'wrong-operation']],
        hint: g.kind === 'fib' ? 'Try adding two neighbouring numbers and compare the sum with the next one.' : 'Look at the gaps or the ratio between neighbouring numbers.',
        explanation: `The rule is ${rule}. After ${last} comes ${answer}.`,
      };
    },
  },

  'class-4-dictionary-order': {
    gen(level, r) {
      const words = r.shuffle(DICTIONARY).slice(0, level === 1 ? 4 : 5);
      return { words, k: r.int(1, words.length) };
    },
    calc(g) {
      const sorted = [...g.words].sort();
      const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
      return {
        prompt: `Arrange these words in dictionary order: ${g.words.join(', ')}. Which word comes ${ordinals[g.k - 1]}?`,
        answer: sorted[g.k - 1],
        wrongs: g.words.filter(word => word !== sorted[g.k - 1]).map(word => [word, 'code-order']),
        hint: 'Compare first letters. When they match, compare the next letters.',
        explanation: `In dictionary order: ${sorted.join(', ')}. The ${ordinals[g.k - 1]} word is ${sorted[g.k - 1]}.`,
      };
    },
  },

  'class-4-odd-one-out': {
    gen(level, r) {
      const kind = r.pick(level === 1 ? ['multiple', 'even'] : ['multiple', 'square', 'prime', 'multiple']);
      const k = kind === 'multiple' ? r.pick([3, 4, 6, 7, 9, 11]) : 0;
      const fits = value => PROPERTIES[kind](value, k);
      const want = r.int(0, 1) === 1;
      const pool = Array.from({ length: kind === 'square' ? 150 : 99 }, (_, i) => i + 2).filter(value => fits(value) === want);
      const others = Array.from({ length: 150 }, (_, i) => i + 2).filter(value => fits(value) !== want);
      const trio = r.shuffle(pool).slice(0, 3), odd = r.pick(others);
      return { kind, k, numbers: r.shuffle([...trio, odd]) };
    },
    calc(g) {
      const flags = g.numbers.map(value => PROPERTIES[g.kind](value, g.k));
      const yes = g.numbers.filter((_, i) => flags[i]), no = g.numbers.filter((_, i) => !flags[i]);
      const odd = yes.length === 1 ? yes : no.length === 1 ? no : [];
      if (odd.length !== 1) throw new Error('Exactly one number must break the pattern.');
      const name = { multiple: `multiples of ${g.k}`, even: 'even numbers', square: 'square numbers', prime: 'prime numbers' }[g.kind];
      const rest = g.numbers.filter(value => value !== odd[0]).join(', ');
      return {
        prompt: `Which number is the odd one out: ${g.numbers.join(', ')}?`,
        answer: odd[0],
        wrongs: g.numbers.filter(value => value !== odd[0]).map(value => [value, 'ignored-condition']),
        hint: 'Look for a property three numbers share, such as factors or squares.',
        explanation: yes.length === 1 ? `Only ${odd[0]} is in the group of ${name}; ${rest} are not.` : `${rest} are all ${name}, but ${odd[0]} is not.`,
      };
    },
  },
};

const SYM = 'ABCDEHIKMOTUVWXY';
const NONSYM = 'FGJLNPQRSZ';
const PROPERTIES = {
  multiple: (value, k) => value % k === 0,
  even: value => value % 2 === 0,
  square: value => Number.isInteger(Math.sqrt(value)),
  prime: value => value > 1 && Array.from({ length: Math.floor(Math.sqrt(value)) - 1 }, (_, i) => i + 2).every(d => value % d),
};
const GRID_RULES = [
  { f: (a, b) => a * b, text: 'the first number times the second gives the third' },
  { f: (a, b) => a + b, text: 'the first number plus the second gives the third' },
  { f: (a, b) => 2 * a + b, text: 'twice the first plus the second gives the third' },
  { f: (a, b) => a * b + a, text: 'the first times the second, plus the first, gives the third' },
  { f: (a, b) => a * b - b, text: 'the first times the second, minus the second, gives the third' },
  { f: (a, b) => (a + b) * 2, text: 'the sum of the first two, doubled, gives the third' },
];
const ANALOGY = [
  ...Array.from({ length: 8 }, (_, i) => ({ f: n => n * (i + 2), text: `multiply by ${i + 2}` })),
  ...Array.from({ length: 12 }, (_, i) => ({ f: n => n + i + 2, text: `add ${i + 2}` })),
  { f: n => n * n, text: 'multiply the number by itself' },
  { f: n => n * n * n, text: 'multiply the number by itself three times' },
  ...[1, 2, 3].map(k => ({ f: n => 2 * n + k, text: `double and add ${k}` })),
  ...[1, 2, 3].map(k => ({ f: n => n * n + k, text: `square and add ${k}` })),
];
function analogyRules(level, r) {
  const pool = level === 1 ? ANALOGY.slice(0, 20) : level === 2 ? ANALOGY.slice(0, 22) : ANALOGY.slice(8);
  const rule = r.pick(pool);
  return rule.f;
}

function rowsMatching(names, clues) {
  const all = permute(names);
  return all.filter(row => clues.every(clue => clueHolds(row, clue)));
}
function permute(values) {
  return values.length <= 1 ? [values] : values.flatMap((value, i) => permute(values.filter((_, j) => j !== i)).map(rest => [value, ...rest]));
}
function clueHolds(row, clue) {
  const at = name => row.indexOf(name);
  if (clue.t === 'left') return at(clue.a) < at(clue.b);
  if (clue.t === 'next') return Math.abs(at(clue.a) - at(clue.b)) === 1;
  if (clue.t === 'just') return at(clue.b) - at(clue.a) === 1;
  if (clue.t === 'end') return at(clue.a) === 0 || at(clue.a) === row.length - 1;
  return at(clue.a) === clue.k - 1;
}
function clueText(clue) {
  if (clue.t === 'left') return `${clue.a} is somewhere left of ${clue.b}.`;
  if (clue.t === 'next') return `${clue.a} stands next to ${clue.b}.`;
  if (clue.t === 'just') return `${clue.a} is just left of ${clue.b}.`;
  if (clue.t === 'end') return `${clue.a} stands at an end.`;
  return `${clue.a} is ${ordinal(clue.k)} from the left.`;
}

export const REASONING_SPECS = specs;
