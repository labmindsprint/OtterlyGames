import { seededRandom } from '../seeded-random.mjs';
import { CONTENT_VERSION, getChapter, getGrade, LEVELS, SKILLS } from './curriculum-v1.mjs';

const SHAPES = [
  { id: 'circle', sides: 0 }, { id: 'triangle', sides: 3 },
  { id: 'square', sides: 4 }, { id: 'rectangle', sides: 4 },
  { id: 'pentagon', sides: 5 }, { id: 'hexagon', sides: 6 },
];
const NAMES = ['Ari', 'Bea', 'Cleo', 'Dev', 'Eli', 'Fia', 'Gus', 'Hana'];
const SEED = /^[A-Za-z0-9_-]{1,40}$/;
const number = value => Number(value).toLocaleString('en-IN');
const timeText = minutes => `${Math.floor(minutes / 60) % 12 || 12}:${String(minutes % 60).padStart(2, '0')}`;
const fraction = (top, bottom) => `${top}/${bottom}`;
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function hash(text) {
  let value = 2166136261;
  for (const character of text) value = Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0;
  return value.toString(36);
}

function context(seed) {
  const random = seededRandom(seed);
  const int = (low, high) => low + Math.floor(random() * (high - low + 1));
  const pick = values => values[int(0, values.length - 1)];
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

function numericOptions(answer, wrong = []) {
  const values = [answer, ...wrong].filter(value => Number.isFinite(value) && value >= 0);
  let distance = 1;
  while (new Set(values).size < 4) {
    values.push(answer + distance);
    if (answer >= distance) values.push(answer - distance);
    distance++;
  }
  return [...new Set(values)].slice(0, 4).map(String);
}

function draft(skill, grade, level, r) {
  const year = grade.year;
  const small = year < 0 ? 5 : year === 0 ? 10 : year === 1 ? 20 : 30;
  const a = r.int(2, Math.max(3, small));
  const b = r.int(1, Math.max(2, Math.min(12, small - 1)));
  const shapes = SHAPES.slice(0, year < 1 ? 4 : 6);
  const make = (prompt, answer, explanation, extra = {}) => ({
    prompt, answer: String(answer), explanation, hint: SKILLS[skill][1], ...extra,
  });
  const arithmetic = (prompt, result, explanation, operands, operation, extra = {}) =>
    make(prompt, result, explanation, {
      options: numericOptions(result, [result + 10, Math.max(0, result - 10)]),
      proof: { operation, operands }, ...extra,
    });

  switch (skill) {
    case 'count': {
      const count = r.int(1, year < 0 ? 5 + (level > 1 ? 1 : 0) : 20);
      const symbol = r.pick(['star', 'circle', 'triangle']);
      return make('How many objects are in this collection?', count,
        `Count each object once. There are ${count} objects altogether.`, {
          visual: { kind: 'objects', groups: [{ label: 'Count these', count, symbol }] },
          options: numericOptions(count), proof: { operation: 'sum', operands: [count] },
        });
    }
    case 'compare': {
      if (year < 1) {
        const left = r.int(1, year < 0 ? 6 : 12);
        const right = r.int(1, year < 0 ? 6 : 12);
        const more = r.pick([true, false]);
        const answer = left === right ? 'The same number' : (left > right) === more ? 'Group A' : 'Group B';
        return make(`Which group has ${more ? 'more' : 'fewer'} objects?`, answer,
          `Group A has ${left} and group B has ${right}. ${left === right ? 'The groups have the same number.' : `${answer} has ${more ? 'more' : 'fewer'}.`}`, {
            visual: { kind: 'objects', groups: [{ label: 'Group A', count: left, symbol: 'star' }, { label: 'Group B', count: right, symbol: 'star' }] },
            options: ['Group A', 'Group B', 'The same number'],
            proof: { operation: 'compare-groups', operands: [left, right], more },
          });
      }
      const digits = year === 5 ? (level === 3 ? 8 : 7) : Math.min(5, year + 1);
      const base = 10 ** (digits - 1);
      const values = [...new Set([r.int(base, base * 10 - 1), r.int(base, base * 10 - 1), r.int(base, base * 10 - 1), r.int(base, base * 10 - 1)])];
      if (values.length < 4) values.push(...[base, base + 1, base + 2, base + 3].filter(value => !values.includes(value)));
      const options = values.slice(0, 4);
      const greatest = r.pick([true, false]);
      const answer = (greatest ? Math.max : Math.min)(...options);
      return make(`Which is the ${greatest ? 'greatest' : 'smallest'} number?`, number(answer),
        `Compare from the largest place value to the smallest. ${number(answer)} is the ${greatest ? 'greatest' : 'smallest'} of these numbers.`, {
          options: options.map(number), proof: { operation: greatest ? 'max' : 'min', operands: options, formatted: true },
        });
    }
    case 'repeat': {
      const count = level === 1 ? 2 : 3;
      const block = r.shuffle(shapes).slice(0, count).map(shape => shape.id);
      const length = count * 2 + r.int(0, count - 1);
      const items = Array.from({ length }, (_, index) => block[index % count]);
      const answer = block[length % count];
      return make('Which picture comes next in this repeating pattern?', answer,
        `The repeating group is ${block.join(', ')}. Start that same group again: the next picture is a ${answer}.`, {
          visual: { kind: 'sequence', items: [...items, '?'] }, optionKind: 'shape',
          options: r.shuffle(shapes.map(shape => shape.id).filter(id => id !== answer)).slice(0, 3).concat(answer),
          proof: { operation: 'repeat', block, length },
        });
    }
    case 'odd': {
      const common = r.pick(shapes);
      const different = r.pick(shapes.filter(shape => shape.id !== common.id));
      const count = year < 0 ? 4 : 5;
      const oddIndex = r.int(0, count - 1);
      const items = Array.from({ length: count }, (_, index) => index === oddIndex ? different.id : common.id);
      return make(`All but one picture are ${common.id === 'rectangle' ? 'rectangles' : `${common.id}s`}. Which numbered picture is different?`,
        oddIndex + 1, `Picture ${oddIndex + 1} is a ${different.id}; every other picture is a ${common.id}.`, {
          visual: { kind: 'sequence', items, numbered: true },
          options: Array.from({ length: count }, (_, index) => String(index + 1)),
          proof: { operation: 'odd', items, common: common.id },
        });
    }
    case 'position': {
      const items = r.shuffle(shapes).slice(0, year < 1 ? 4 : 5).map(shape => shape.id);
      const index = r.int(1, items.length - 2);
      const after = r.pick([true, false]);
      return make(`Read from left to right. Which picture is immediately ${after ? 'after' : 'before'} the ${items[index]}?`,
        items[index + (after ? 1 : -1)], `In the given order, the ${items[index + (after ? 1 : -1)]} is immediately ${after ? 'after' : 'before'} the ${items[index]}.`, {
          visual: { kind: 'sequence', items }, options: items, optionKind: 'shape',
          proof: { operation: 'position', items, index, offset: after ? 1 : -1 },
        });
    }
    case 'shape': {
      const shape = r.pick(shapes);
      const corners = r.pick([true, false]);
      const answer = shape.sides;
      return make(`How many ${corners ? 'corners' : 'straight sides'} does this ${shape.id} have?`, answer,
        `A ${shape.id} has ${answer} ${corners ? 'corners' : 'straight sides'}.${shape.id === 'circle' ? ' Its edge is curved.' : ' Trace the boundary once to check.'}`, {
          visual: { kind: 'shape', shape: shape.id },
          options: numericOptions(answer, [0, 3, 4, 5, 6]),
          proof: { operation: 'shape', shape: shape.id },
        });
    }
    case 'sequence': {
      const step = r.int(1, year < 1 ? 2 : 3 + level * 2);
      const start = r.int(1, year < 1 ? 10 : 10 ** Math.min(year, 3));
      const blank = r.int(1, 4);
      const values = Array.from({ length: 5 }, (_, index) => start + step * index);
      const answer = values[blank];
      return arithmetic('The same number is added each time. Which number fills the gap?', answer,
        `Each step adds ${step}. ${start} + ${blank} x ${step} = ${answer}.`, [start, blank * step], 'sum', {
          visual: { kind: 'sequence', items: values.map((value, index) => index === blank ? '?' : String(value)) },
        });
    }
    case 'addition': {
      const maximum = year < 1 ? 10 : year === 1 ? 40 : 100 * year;
      const first = r.int(1, maximum - 2);
      const second = r.int(1, maximum - first);
      if (level === 1) return arithmetic(`The rover collects ${first} rocks, then ${second} more. How many rocks does it have?`,
        first + second, `${first} + ${second} = ${first + second}. Combine both groups.`, [first, second], 'sum', {
          ...(year < 1 ? { visual: { kind: 'objects', groups: [{ label: 'First', count: first, symbol: 'circle' }, { label: 'More', count: second, symbol: 'circle' }] } } : {}),
        });
      return arithmetic(`There are ${first} blue flags and some yellow flags. There are ${first + second} flags in all. How many are yellow?`,
        second, `Take the ${first} blue flags away from the total: ${first + second} - ${first} = ${second}.`,
        [first + second, first], 'difference');
    }
    case 'subtraction': {
      const total = r.int(3, year < 1 ? 10 : year === 1 ? 50 : 200 * year);
      const used = r.int(1, total - 1);
      const extra = level === 3 && year > 0 ? r.int(1, total - used) : 0;
      return arithmetic(`${total} supplies are ready. The crew uses ${used}${extra ? `, then uses another ${extra}` : ''}. How many remain?`,
        total - used - extra, `Start with ${total} and take away the used supplies: ${total} - ${used}${extra ? ` - ${extra}` : ''} = ${total - used - extra}.`,
        [total, used + extra], 'difference');
    }
    case 'place': {
      const digits = year === 5 ? (level === 3 ? 8 : 7) : Math.max(2, Math.min(5, year + 1));
      const value = r.int(10 ** (digits - 1), 10 ** digits - 1);
      const position = r.int(0, digits - 1);
      const digit = Math.floor(value / 10 ** position) % 10;
      const names = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'lakhs', 'ten-lakhs', 'crores'];
      return arithmetic(`In ${number(value)}, what is the value of the digit in the ${names[position]} place?`,
        digit * 10 ** position, `The ${names[position]} digit is ${digit}. Its value is ${digit} x ${number(10 ** position)} = ${number(digit * 10 ** position)}.`,
        [digit, 10 ** position], 'product');
    }
    case 'expand': {
      const digits = year === 5 ? (level === 3 ? 8 : 7) : Math.max(2, Math.min(5, year + 1));
      const parts = Array.from({ length: digits }, (_, index) => r.int(index === digits - 1 ? 1 : 0, 9) * 10 ** index).reverse();
      const sum = parts.reduce((total, part) => total + part, 0);
      return arithmetic(`Which number is ${parts.map(number).join(' + ')}?`, sum,
        `Keep each digit in its place: ${parts.map(number).join(' + ')} = ${number(sum)}.`, parts, 'sum');
    }
    case 'groups': {
      const groups = r.int(2, year < 3 ? 5 : 12);
      const each = r.int(2, year < 3 ? 5 : level === 3 ? 25 : 12);
      const removed = level > 1 ? r.int(1, groups * each - 1) : 0;
      const result = groups * each - removed;
      return arithmetic(`There are ${groups} boxes with ${each} fuel cells in each.${removed ? ` The crew uses ${removed} cells.` : ''} How many fuel cells ${removed ? 'remain' : 'are there altogether'}?`,
        result, `Each of the ${groups} boxes has ${each} cells. ${groups} x ${each} = ${groups * each}.${removed ? ` Then ${groups * each} - ${removed} = ${result}.` : ''}`,
        [groups, each, removed], 'groups');
    }
    case 'sharing': {
      const groups = r.int(2, year < 3 ? 5 : 12);
      const each = r.int(2, year < 3 ? 5 : 15);
      const kept = level > 1 ? r.int(1, 12) : 0;
      const total = groups * each + kept;
      return arithmetic(`The crew has ${total} tokens.${kept ? ` It keeps ${kept} aside, then shares the rest` : ' It shares them'} equally between ${groups} explorers. How many does each explorer receive?`,
        each, `${kept ? `${total} - ${kept} = ${total - kept}. Then ` : ''}${total - kept} / ${groups} = ${each}. Check: ${each} x ${groups} = ${total - kept}.`,
        [total, kept, groups], 'sharing');
    }
    case 'measure': {
      if (year < 2) {
        const first = r.int(2, year < 1 ? 8 : 15);
        const second = r.int(1, first - 1);
        return arithmetic('These measuring blocks are all the same length. How many blocks longer is strip A than strip B?',
          first - second, `Strip A is ${first} blocks long and strip B is ${second}. ${first} - ${second} = ${first - second} blocks.`, [first, second], 'difference', {
            visual: { kind: 'bars', unit: 'equal blocks', rows: [{ label: 'A', value: first }, { label: 'B', value: second }] },
          });
      }
      const unit = r.pick([{ big: 'm', small: 'cm', factor: 100 }, { big: 'kg', small: 'g', factor: 1000 }, { big: 'L', small: 'mL', factor: 1000 }]);
      const whole = r.int(1, year === 2 ? 5 : 12);
      const extra = level > 1 ? r.int(1, 9) * (unit.factor / 10) : 0;
      return arithmetic(`How many ${unit.small} are ${whole} ${unit.big}${extra ? ` and ${extra} ${unit.small}` : ''}? Use 1 ${unit.big} = ${unit.factor} ${unit.small}.`,
        whole * unit.factor + extra, `Convert the whole ${unit.big} first, then add any remaining ${unit.small}: ${whole} x ${unit.factor}${extra ? ` + ${extra}` : ''} = ${whole * unit.factor + extra} ${unit.small}.`,
        [whole * unit.factor, extra], 'sum');
    }
    case 'time': {
      const hour = r.int(1, 10);
      const minute = year === 1 ? r.pick([0, 30]) : r.pick([0, 15, 30, 45]);
      const start = hour * 60 + minute;
      if (level === 1) {
        const answer = timeText(start);
        return make('What time does this clock show?', answer,
          `The short hand shows the hour. The long hand is at ${minute === 0 ? '12, so it is an exact hour' : `${minute / 5}, meaning ${minute} minutes`}. The time is ${answer}.`, {
            visual: { kind: 'clock', hour, minute },
            options: [start, start + 60, start + 5, start + 30].map(timeText),
            proof: { operation: 'time', operands: [start] },
          });
      }
      const duration = year === 1 ? r.pick([30, 60]) : r.int(1, year < 4 ? 8 : 16) * 15;
      const end = start + duration;
      return make(`A practice flight starts at ${timeText(start)} in the morning and lasts ${duration} minutes. What time does it end?`, timeText(end),
        `${Math.floor(duration / 60)} whole hour(s) and ${duration % 60} more minute(s) pass. ${timeText(start)} plus ${duration} minutes is ${timeText(end)}${end === 720 ? ' at noon' : end > 720 ? ' in the afternoon' : ' in the morning'}.`, {
          options: [end, end + 15, end + 60, end - 15].map(timeText),
          proof: { operation: 'time', operands: [start, duration] },
        });
    }
    case 'money': {
      const price = r.int(2, year === 1 ? 10 : year * 20);
      const quantity = level === 1 || year === 1 ? 1 : r.int(2, 5);
      const cost = price * quantity;
      const change = r.int(1, year === 1 ? 15 : 50);
      const paid = cost + change;
      return arithmetic(`One mission patch costs Rs ${price}. You buy ${quantity} and pay Rs ${paid}. How many rupees should you get back?`,
        change, `The cost is ${quantity} x ${price} = Rs ${cost}. Change is ${paid} - ${cost} = Rs ${change}.`,
        [paid, cost], 'difference');
    }
    case 'chart': {
      const scale = year < 3 ? r.pick([1, 2]) : r.int(2, 5);
      const values = [r.int(2, 7), r.int(1, 7), r.int(1, 7)];
      const labels = ['Moon team', 'Mars team', 'Star team'];
      const total = level === 1 ? values[0] * scale : (values[0] + values[1]) * scale;
      return arithmetic(level === 1 ? 'How many samples did the Moon team collect?' : 'How many samples did the Moon and Mars teams collect altogether?',
        total, `Each symbol stands for ${scale} samples. ${level === 1 ? `${values[0]} x ${scale}` : `(${values[0]} + ${values[1]}) x ${scale}`} = ${total}.`,
        level === 1 ? [values[0], scale] : [values[0] + values[1], scale], 'product', {
          visual: { kind: 'pictograph', scale, rows: values.map((value, index) => ({ label: labels[index], value })) },
        });
    }
    case 'fraction-read': {
      const denominator = r.pick([3, 4, 5, 6, 8]);
      const numerator = r.int(1, denominator - 1);
      const answer = fraction(numerator, denominator);
      return make('What fraction of this whole is shaded? All the parts are equal.', answer,
        `${numerator} out of ${denominator} equal parts are shaded, so the fraction is ${answer}.`, {
          visual: { kind: 'fraction', numerator, denominator },
          options: [answer, fraction(denominator - numerator, denominator), fraction(numerator, denominator + 1), fraction(denominator, numerator), fraction(1, denominator)],
          proof: { operation: 'fraction', numerator, denominator },
        });
    }
    case 'fraction-of': {
      const denominator = r.int(2, year === 3 ? 5 : 10);
      const numerator = level === 1 ? 1 : r.int(1, denominator - 1);
      const share = r.int(2, 12);
      const total = denominator * share;
      return arithmetic(`What is ${fraction(numerator, denominator)} of ${total} supply tokens?`, numerator * share,
        `Divide into ${denominator} equal shares: ${total} / ${denominator} = ${share}. Take ${numerator} such share(s): ${share} x ${numerator} = ${share * numerator}.`,
        [total, denominator, numerator], 'fraction-of');
    }
    case 'fraction-compare': {
      const denominator = r.pick([4, 6, 8, 10, 12]);
      const first = r.int(1, denominator - 2);
      const second = r.int(first + 1, denominator - 1);
      if (year === 3 || level === 1) {
        return make('These fractions refer to the same-sized whole. Which is greater?', fraction(second, denominator),
          `Both wholes have ${denominator} equal parts. ${second} parts are more than ${first}, so ${fraction(second, denominator)} is greater.`, {
            options: [fraction(first, denominator), fraction(second, denominator), 'They are equal', 'There is not enough information'],
            proof: { operation: 'greater-fraction', fractions: [[first, denominator], [second, denominator]] },
          });
      }
      const candidates = [[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [5, 6], [1, 3]];
      const pair = r.shuffle(candidates).slice(0, 2);
      const [x, y] = pair;
      const answer = x[0] * y[1] > y[0] * x[1] ? x : y;
      return make(`Which is greater, ${fraction(...x)} or ${fraction(...y)}, for the same whole?`, fraction(...answer),
        `Use denominator ${x[1] * y[1]}: ${fraction(...x)} = ${fraction(x[0] * y[1], x[1] * y[1])} and ${fraction(...y)} = ${fraction(y[0] * x[1], x[1] * y[1])}. Compare the numerators.`, {
          options: [fraction(...x), fraction(...y), 'They are equal', 'There is not enough information'],
          proof: { operation: 'greater-fraction', fractions: pair },
        });
    }
    case 'decimals': {
      const first = r.int(11, 899);
      const second = r.int(1, 99);
      if (level === 1) {
        return make(`Write ${first} hundredths as a decimal.`, (first / 100).toFixed(2),
          `${first} / 100 = ${(first / 100).toFixed(2)}. There are two places after the decimal point.`, {
            options: [first / 100, first / 10, first / 1000, first].map(value => value.toFixed(2)),
            proof: { operation: 'decimal', operands: [first], scale: 100 },
          });
      }
      return make(`What is ${(first / 100).toFixed(2)} + ${(second / 100).toFixed(2)}?`, ((first + second) / 100).toFixed(2),
        `Line up the decimal places. ${first} hundredths + ${second} hundredths = ${first + second} hundredths = ${((first + second) / 100).toFixed(2)}.`, {
          options: [first + second, first + second + 10, first + second - 10, first + second + 100].map(value => (value / 100).toFixed(2)),
          proof: { operation: 'decimal', operands: [first, second], scale: 100 },
        });
    }
    case 'perimeter': {
      const width = r.int(2, 12 + level * 3);
      const height = r.int(2, 10);
      if (level === 3) {
        return arithmetic(`A rectangular landing pad has perimeter ${2 * (width + height)} m and length ${width} m. What is its width in metres?`,
          height, `Half the perimeter is ${width + height} m. Subtract the length: ${width + height} - ${width} = ${height} m.`,
          [2 * (width + height), width], 'missing-side');
      }
      return arithmetic(`A rectangular landing pad is ${width} m long and ${height} m wide. What is its perimeter in metres?`,
        2 * (width + height), `Add all four sides: ${width} + ${height} + ${width} + ${height} = ${2 * (width + height)} m.`,
        [width, height, width, height], 'sum');
    }
    case 'area': {
      const width = r.int(2, 16);
      const height = r.int(2, 12);
      return arithmetic(`A rectangular solar panel is ${width} cm long and ${height} cm wide. What is its area in square centimetres?`,
        width * height, `Area = length x width = ${width} x ${height} = ${width * height} square centimetres.`, [width, height], 'product');
    }
    case 'angles': {
      const total = r.pick([90, 180, 360]);
      const known = r.int(1, total / 10 - 1) * 10;
      return arithmetic(`Two angles together make ${total} degrees${total === 90 ? ' (a right angle)' : total === 180 ? ' (a straight angle)' : ' (a full turn)'}. One is ${known} degrees. How many degrees is the other?`,
        total - known, `${total} - ${known} = ${total - known} degrees.`, [total, known], 'difference');
    }
    case 'symmetry': {
      const directions = ['left', 'right', 'up', 'down'];
      const mirror = { left: 'right', right: 'left', up: 'up', down: 'down' };
      const direction = r.pick(directions);
      const second = level === 3 ? r.pick(directions) : null;
      const answer = second ? `${mirror[direction]}, then ${mirror[second]}` : mirror[direction];
      return make(second
        ? 'Read the original arrows from left to right. Reflect each in the mirror on the right. For those original arrows, in that order, which directions result?'
        : 'A mirror stands on the right of the picture. Which direction does the arrow point in its image?',
        answer, `A vertical mirror swaps left and right, not up and down. ${direction}${second ? `, then ${second}` : ''} becomes ${answer}.`, {
          visual: { kind: 'arrows', items: [direction, ...(second ? [second] : [])], mirror: true },
          options: second ? [...new Set([answer, `${direction}, then ${second}`, `${mirror[direction]}, then ${second}`, `${direction}, then ${mirror[second]}`, 'up, then right', 'down, then left', 'right, then up', 'left, then down'])] : directions,
          proof: { operation: 'mirror', items: [direction, ...(second ? [second] : [])] },
        });
    }
    case 'coding': {
      const offset = year < 4 ? 0 : level - 1;
      const length = year < 3 ? 2 : 3;
      const word = Array.from({ length }, () => letters[r.int(0, 8)]).join('');
      const values = [...word].map(character => letters.indexOf(character) + 1 + offset);
      const answer = values.join('-');
      return make(`Use A = ${1 + offset}, B = ${2 + offset}, C = ${3 + offset}, and continue the same rule. What is the code for ${word}?`,
        answer, `${[...word].map((character, index) => `${character} = ${values[index]}`).join(', ')}. Keep the original letter order: ${answer}.`, {
          options: [answer, values.map(value => value + 1).join('-'), [...values].reverse().join('-'), values.map(value => value + 2).join('-'), values.map(value => value + 3).join('-')],
          proof: { operation: 'code', word, offset },
        });
    }
    case 'ranking': {
      const count = r.int(4, year < 2 ? 8 : 20);
      const rank = r.int(1, count);
      const name = r.pick(NAMES);
      const answer = count - rank + 1;
      return arithmetic(`${count} explorers stand in one line. ${name} is number ${rank} counting from the front. What is ${name}'s position counting from the back?`,
        answer, `There are ${count - rank} explorers behind ${name}. Include ${name}: ${count} - ${rank} + 1 = ${answer}.`,
        [count, rank], 'rank');
    }
    case 'directions': {
      const east = r.int(2, 9);
      const north = r.int(2, 9);
      const west = level > 1 ? r.int(1, east + 3) : 0;
      const x = east - west;
      const answer = x === 0 ? 'North' : x > 0 ? 'North-east' : 'North-west';
      return make(`A rover moves ${east} blocks east, then ${north} blocks north${west ? `, then ${west} blocks west` : ''}. In which direction is it from its starting point?`,
        answer, `East-west movement is ${east} - ${west} = ${x}; northward movement is ${north}. The rover is ${answer.toLowerCase()} of its start.`, {
          options: ['North', 'North-east', 'North-west', 'South-east'],
          proof: { operation: 'direction', east, north, west },
        });
    }
    case 'mystery': {
      const value = r.int(2, year === 1 ? 10 : 20 * Math.max(1, year));
      const factor = year < 2 ? 1 : r.int(2, 5 + level);
      const added = r.int(1, year < 2 ? 9 : 20);
      return arithmetic(`I think of a number${factor > 1 ? `, multiply it by ${factor}` : ''}, then add ${added}. The result is ${value * factor + added}. What was my number?`,
        value, `Work backwards: ${value * factor + added} - ${added} = ${value * factor}.${factor > 1 ? ` Then ${value * factor} / ${factor} = ${value}.` : ` The starting number was ${value}.`}`,
        [value * factor + added, added, factor], 'sharing');
    }
    case 'combinations': {
      const bodies = r.int(2, 5);
      const noses = r.int(2, 5);
      const result = bodies * noses;
      return arithmetic(`There are ${bodies} rocket body colours and ${noses} nose-cone colours. Any body can go with any nose cone. How many different colour pairs are possible?`,
        result, `Each of the ${bodies} body colours has ${noses} possible nose colours. ${bodies} x ${noses} = ${result} pairs.`, [bodies, noses], 'product');
    }
    default: throw new Error(`No original question family exists for ${skill}.`);
  }
}

export function verifyQuestion(question) {
  const p = question.proof;
  let expected;
  const sum = values => values.reduce((total, value) => total + value, 0);
  switch (p.operation) {
    case 'sum': expected = sum(p.operands); break;
    case 'difference': expected = p.operands[0] - p.operands[1]; break;
    case 'product': expected = p.operands.reduce((total, value) => total * value, 1); break;
    case 'groups': expected = p.operands[0] * p.operands[1] - p.operands[2]; break;
    case 'sharing': expected = (p.operands[0] - p.operands[1]) / p.operands[2]; break;
    case 'fraction-of': expected = p.operands[0] / p.operands[1] * p.operands[2]; break;
    case 'missing-side': expected = p.operands[0] / 2 - p.operands[1]; break;
    case 'rank': expected = p.operands[0] - p.operands[1] + 1; break;
    case 'time': expected = timeText(sum(p.operands)); break;
    case 'decimal': expected = (sum(p.operands) / p.scale).toFixed(2); break;
    case 'fraction': expected = fraction(p.numerator, p.denominator); break;
    case 'max': expected = number(Math.max(...p.operands)); break;
    case 'min': expected = number(Math.min(...p.operands)); break;
    case 'shape': expected = SHAPES.find(shape => shape.id === p.shape).sides; break;
    case 'repeat': expected = p.block[p.length % p.block.length]; break;
    case 'odd': expected = p.items.findIndex(item => item !== p.common) + 1; break;
    case 'position': expected = p.items[p.index + p.offset]; break;
    case 'code': expected = [...p.word].map(character => letters.indexOf(character) + 1 + p.offset).join('-'); break;
    case 'mirror': expected = p.items.map(item => ({ left: 'right', right: 'left', up: 'up', down: 'down' })[item]).join(', then '); break;
    case 'direction': expected = p.east === p.west ? 'North' : p.east > p.west ? 'North-east' : 'North-west'; break;
    case 'compare-groups': expected = p.operands[0] === p.operands[1] ? 'The same number' : (p.operands[0] > p.operands[1]) === p.more ? 'Group A' : 'Group B'; break;
    case 'greater-fraction': {
      const [a, b] = p.fractions;
      if (a[0] * b[1] === b[0] * a[1]) throw new Error('A comparison question needs unequal fractions.');
      expected = fraction(...(a[0] * b[1] > b[0] * a[1] ? a : b));
      break;
    }
    default: throw new Error(`Unknown answer proof: ${p.operation}`);
  }
  if (String(expected) !== question.answer || question.options[question.correctIndex] !== question.answer ||
      new Set(question.options).size !== question.options.length || question.options.length < 3 ||
      !question.prompt || !question.explanation || !question.hint) {
    throw new Error(`Invalid original question: ${question.id ?? question.prompt}`);
  }
  return true;
}

export function createMission({ grade: gradeId, chapter: chapterId, level = 1, mode = 'chapter', seed }) {
  const grade = getGrade(gradeId);
  if (!LEVELS.some(item => item.id === level)) throw new RangeError('Choose a challenge level from 1 to 3.');
  if (typeof seed !== 'string' || !SEED.test(seed)) throw new RangeError('Invalid mission seed.');
  if (!['chapter', 'mixed', 'paper'].includes(mode)) throw new RangeError('Unknown mission mode.');
  if (mode !== 'chapter' && chapterId != null) throw new RangeError('Mixed missions and practice papers do not use a chapter setting.');
  if (mode === 'paper' && grade.year < 1) throw new RangeError('Pre-primary learners have picture missions, not exam papers.');
  const chapters = mode === 'chapter' ? [getChapter(gradeId, chapterId)] : grade.chapters;
  const r = context(`academy-${CONTENT_VERSION}|${gradeId}|${chapterId ?? mode}|${level}|${seed}`);
  const count = mode === 'paper' ? (grade.year === 5 ? 50 : 35) : grade.missionSize;
  const sections = mode !== 'paper' ? null : [
    ...Array(grade.year === 5 ? 15 : 10).fill('reasoning'),
    ...Array(grade.year === 5 ? 20 : 10).fill('maths'),
    ...Array(10).fill('everyday'), ...Array(5).fill('stretch'),
  ];
  const questions = [];
  const seen = new Set();
  let attempts = 0;
  while (questions.length < count && attempts++ < count * 150) {
    const section = sections?.[questions.length];
    const pool = section && section !== 'stretch'
      ? chapters.filter(chapter => chapter.section === section) : chapters;
    if (!pool.length) throw new Error(`The ${gradeId} curriculum has no ${section} questions.`);
    const chapter = pool[(questions.length + r.int(0, pool.length - 1)) % pool.length];
    const skill = chapter.skills[questions.length % chapter.skills.length];
    const questionLevel = section === 'stretch' ? 3 : level;
    const candidate = draft(skill, grade, questionLevel, r);
    const options = [...new Set(candidate.options)];
    if (!options.includes(candidate.answer)) throw new Error('The correct answer is missing.');
    const ordered = r.shuffle([candidate.answer, ...options.filter(value => value !== candidate.answer).slice(0, 3)]);
    const id = `q${CONTENT_VERSION}-${gradeId}-${skill}-${hash(JSON.stringify([candidate.prompt, candidate.visual ?? null, candidate.answer]))}`;
    if (seen.has(id)) continue;
    const question = {
      ...candidate, id, grade: gradeId, chapter: chapter.id, skill, level: questionLevel,
      section: section ?? chapter.section, options: ordered, correctIndex: ordered.indexOf(candidate.answer),
    };
    verifyQuestion(question);
    seen.add(id);
    questions.push(question);
  }
  if (questions.length !== count) throw new Error('This mission could not produce enough different questions. Try another chapter or seed.');
  return {
    id: `m${CONTENT_VERSION}:${gradeId}:${mode}:${chapterId ?? 'all'}:${level}:${seed}`,
    contentVersion: CONTENT_VERSION, grade: gradeId, chapter: mode === 'chapter' ? chapterId : null,
    level, mode, seed,
    title: mode === 'chapter' ? chapters[0].title : mode === 'paper' ? 'Olympiad-style practice paper' : 'Mixed mission',
    questions,
  };
}
