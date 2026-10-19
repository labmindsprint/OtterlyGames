// Everyday-maths families for Class 4 (time, money, measurement) written the way the printed papers ask them.
import { NAMES, mixedText, plural, pronoun } from './bank3-class-4-real-core.mjs';

const wrongs = (values, code) => values.map(value => [value, code]);
const cap = text => text[0].toUpperCase() + text.slice(1);
const an = word => /^[aeiou]/i.test(word) ? 'an' : 'a';
const pad = n => String(n).padStart(2, '0');

const fmt12 = minutes => `${Math.floor(minutes / 60) % 12 || 12}:${pad(minutes % 60)} ${minutes < 720 ? 'a.m.' : 'p.m.'}`;
const fmt24 = minutes => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const fmtHM = (h, m) => [h && plural(h, 'hour'), m && plural(m, 'minute')].filter(Boolean).join(' ') || '0 minutes';
const fmtDur = minutes => fmtHM(Math.floor(minutes / 60), minutes % 60);
const ageText = (y, m) => `${plural(y, 'year')} ${plural(m, 'month')}`;

const MONTHS = [['January', 31], ['February', 28], ['March', 31], ['April', 30], ['May', 31], ['June', 30], ['July', 31], ['August', 31], ['September', 30], ['October', 31], ['November', 30], ['December', 31]];
function addDays(month, day, n) {
  let m = month, d = day + n;
  while (d > MONTHS[m][1]) { d -= MONTHS[m][1]; m = (m + 1) % 12; }
  return { m, d };
}
const dateText = ({ m, d }) => `${d} ${MONTHS[m][0]}`;
const dayOfYear = (m, d) => MONTHS.slice(0, m).reduce((sum, [, len]) => sum + len, 0) + d;

const UNITS = [
  { big: 'kg', small: 'g', per: 1000 },
  { big: 'km', small: 'm', per: 1000 },
  { big: 'L', small: 'mL', per: 1000 },
  { big: 'm', small: 'cm', per: 100 },
];
const measureText = (total, u) => [Math.floor(total / u.per) && `${Math.floor(total / u.per)} ${u.big}`, total % u.per && `${total % u.per} ${u.small}`].filter(Boolean).join(' ') || `0 ${u.small}`;
const pairText = (big, small, u) => [big && `${big} ${u.big}`, small && `${small} ${u.small}`].filter(Boolean).join(' ') || `0 ${u.small}`;
const toSmall = (big, small, u) => big * u.per + small;

const THINGS = [['doll', 'teddy'], ['kite', 'ball'], ['bag', 'lunch box'], ['cap', 'scarf'], ['jug', 'bowl'], ['torch', 'clock'], ['story book', 'atlas'], ['skirt', 'shirt']];
const ACTIVITIES = ['a walk', 'a film', 'a class', 'a cricket match', 'a painting lesson', 'a train ride', 'a science show'];
const PERIODS = ['week', 'month'];
const LITRES = halves => `${mixedText(halves, 2)} ${halves <= 2 ? 'litre' : 'litres'}`;

export const EVERYDAY_SPECS = {
  'class-4-age-sum': {
    gen(level, r) {
      const [a, b] = r.shuffle(NAMES).slice(0, 2);
      const mode = level === 1 ? 'sum' : r.pick(['sum', 'diff']);
      const y1 = r.int(level === 1 ? 3 : 6, level === 3 ? 14 : 11);
      const y2 = mode === 'sum' ? r.int(2, y1 - 1) : r.int(2, y1 - 2);
      let m1, m2;
      if (mode === 'diff') {
        m1 = r.int(1, 10);
        m2 = r.int(m1 + 1, 11);
      } else if (level === 1) {
        do { m1 = r.int(1, 11); m2 = r.int(1, 11); } while (m1 + m2 === 12);
      } else {
        m1 = r.int(2, 11);
        m2 = r.int(Math.max(1, 13 - m1), 11);
      }
      return { a, b, mode, y1, y2, m1, m2 };
    },
    calc(g) {
      const first = g.y1 * 12 + g.m1, second = g.y2 * 12 + g.m2;
      const total = g.mode === 'sum' ? first + second : first - second;
      const ty = Math.floor(total / 12), tm = total % 12;
      const answer = ageText(ty, tm);
      const intro = `${g.a} is ${ageText(g.y1, g.m1)} old. ${g.b} is ${ageText(g.y2, g.m2)} old.`;
      if (g.mode === 'sum') {
        const loose = g.m1 + g.m2;
        return {
          prompt: `${intro} What is their total age?`, answer,
          wrongs: [[ageText(g.y1 + g.y2, loose), 'unit-conversion'], [ageText(g.y1 + g.y2 + Math.floor(loose / 10), loose % 10), 'unit-conversion'], [ageText(ty + 1, tm), 'missing-step'], [ageText(ty - 1, tm), 'missing-step'], [ageText(ty, (tm + 1) % 12), 'counted-endpoints'], [ageText(Math.floor((first - second) / 12), (first - second) % 12), 'wrong-operation']],
          hint: 'Add the years, add the months, then change every 12 months into 1 year.',
          explanation: `Years: ${g.y1} + ${g.y2} = ${g.y1 + g.y2}. Months: ${g.m1} + ${g.m2} = ${loose}. Change 12 months to 1 year to get ${answer}.`,
        };
      }
      return {
        prompt: `${intro} How much older is ${g.a} than ${g.b}?`, answer,
        wrongs: [[ageText(g.y1 - g.y2, Math.abs(g.m1 - g.m2)), 'unit-conversion'], [ageText(ty + 1, tm), 'missing-step'], [ageText(Math.max(0, ty - 1), tm), 'missing-step'], [ageText(ty, (tm + 1) % 12), 'counted-endpoints'], [ageText(Math.floor((first + second) / 12), (first + second) % 12), 'wrong-operation']],
        hint: 'Turn both ages into months, subtract, then change back into years and months.',
        explanation: `${ageText(g.y1, g.m1)} is ${plural(first, 'month')} and ${ageText(g.y2, g.m2)} is ${plural(second, 'month')}. The gap is ${plural(total, 'month')}: ${answer}.`,
      };
    },
  },

  'class-4-clock-duration': {
    gen(level, r) {
      const style = level === 1 ? '12' : r.pick(['12', '24']);
      const mode = r.pick(level === 1 ? ['after', 'between'] : ['after', 'before', 'between']);
      const step = level === 1 ? 15 : 5;
      const dur = level === 1 ? r.int(1, 7) * 15 : r.int(1, 3) * 60 + r.int(1, 11) * 5;
      const start = r.int(Math.ceil((level === 3 ? 360 : 420) / step), Math.floor((level === 1 ? 960 : 1080) / step)) * step;
      return { style, mode, dur, start, who: r.pick(NAMES), act: r.pick(ACTIVITIES) };
    },
    calc(g) {
      const t = minutes => g.style === '12' ? fmt12(minutes) : fmt24(minutes);
      const end = g.start + g.dur;
      if (g.mode === 'between') {
        const [sh, sm, eh, em] = [Math.floor(g.start / 60), g.start % 60, Math.floor(end / 60), end % 60];
        return {
          prompt: `${cap(g.act)} starts at ${t(g.start)} and ends at ${t(end)}. How long does it last?`, answer: fmtDur(g.dur),
          wrongs: [[fmtHM(eh - sh, Math.abs(em - sm)), 'hour-carry'], [fmtDur(g.dur + 60), 'hour-carry'], [fmtDur(Math.max(5, g.dur - 60)), 'hour-carry'], [fmtDur(g.dur + 10), 'clock-error'], [fmtDur(Math.max(5, g.dur - 10)), 'clock-error']],
          hint: 'Count on from the start to the next hour, then to the end time.',
          explanation: `From ${t(g.start)} to ${t(end)} is ${fmtDur(g.dur)}.`,
        };
      }
      if (g.mode === 'before') {
        return {
          prompt: `${cap(g.act)} ends at ${t(end)}. It lasted ${fmtDur(g.dur)}. At what time did it start?`, answer: t(g.start),
          wrongs: [[t(g.start + 60), 'hour-carry'], [t(g.start - 60), 'hour-carry'], [t(g.start + 10), 'clock-error'], [t(g.start - 10), 'clock-error'], [t(end + g.dur), 'time-direction']].filter(([, c]) => c !== 'time-direction' || end + g.dur < 1440),
          hint: 'Go back in time from the end: take away the hours first, then the minutes.',
          explanation: `Go back ${fmtDur(g.dur)} from ${t(end)} to reach ${t(g.start)}.`,
        };
      }
      return {
        prompt: `${g.who} starts ${g.act} at ${t(g.start)}. It lasts ${fmtDur(g.dur)}. At what time does it end?`, answer: t(end),
        wrongs: [[t(end + 60), 'hour-carry'], [t(end - 60), 'hour-carry'], [t(end + 10), 'clock-error'], [t(end - 10), 'clock-error'], [t(g.start - g.dur), 'time-direction']].filter(([, c]) => c !== 'time-direction' || g.start - g.dur >= 0),
        hint: 'Add the hours first, then the minutes. If the minutes pass 60, carry 1 hour.',
        explanation: `${t(g.start)} plus ${fmtDur(g.dur)} is ${t(end)}.`,
      };
    },
  },

  'class-4-time-units': {
    gen(level, r) {
      const mode = r.pick(level === 1 ? ['minutes', 'days'] : ['minutes', 'hm', 'days', 'hours']);
      return {
        mode, h: r.int(1, level === 1 ? 3 : 9), m: r.int(1, 11) * 5 + (level === 3 ? r.int(0, 4) : 0),
        w: r.int(2, level === 1 ? 5 : 12), d: r.int(1, 6), hours: r.int(2, 22), total: r.int(level === 1 ? 105 : 130, level === 3 ? 640 : 360),
      };
    },
    calc(g) {
      if (g.mode === 'minutes') {
        const t = g.h * 60 + g.m;
        return {
          prompt: `How many minutes are there in ${fmtHM(g.h, g.m)}?`, answer: t,
          wrongs: wrongs([g.h * 100 + g.m, g.h * 60, g.h + g.m, t + 60, t - 60], 'unit-conversion'),
          hint: 'There are 60 minutes in 1 hour. Change the hours first.',
          explanation: `${g.h} × 60 = ${g.h * 60}. Add ${g.m} more minutes: ${t}.`,
        };
      }
      if (g.mode === 'hm') {
        const total = g.total % 60 ? g.total : g.total + 5;
        const h = Math.floor(total / 60), m = total % 60, answer = fmtHM(h, m);
        return {
          prompt: `Change ${total} minutes into hours and minutes.`, answer,
          wrongs: [[fmtHM(Math.floor(total / 100), total % 100), 'unit-conversion'], [fmtHM(h + 1, m), 'hour-carry'], [fmtHM(h, m + 10), 'clock-error'], [fmtHM(h - 1 || h + 2, m), 'hour-carry'], [fmtHM(m, h), 'wrong-operation']],
          hint: 'Take out as many whole hours of 60 minutes as you can.',
          explanation: `${plural(h, 'hour')} is ${h * 60} minutes. ${total} - ${h * 60} = ${plural(m, 'minute')} left, so ${answer}.`,
        };
      }
      if (g.mode === 'days') {
        const t = g.w * 7 + g.d;
        return {
          prompt: `How many days are there in ${plural(g.w, 'week')} and ${plural(g.d, 'day')}?`, answer: t,
          wrongs: [[g.w * 5 + g.d, 'unit-conversion'], [g.w * 7, 'missing-step'], [g.w + g.d, 'wrong-operation'], [t + 7, 'counted-endpoints'], [t - 7, 'counted-endpoints']],
          hint: 'There are 7 days in 1 week. Change the weeks first.',
          explanation: `${g.w} × 7 = ${g.w * 7}. Add ${plural(g.d, 'day')}: ${t}.`,
        };
      }
      const t = g.d * 24 + g.hours;
      return {
        prompt: `How many hours are there in ${plural(g.d, 'day')} and ${plural(g.hours, 'hour')}?`, answer: t,
        wrongs: [[g.d * 12 + g.hours, 'unit-conversion'], [g.d * 24, 'missing-step'], [g.d + g.hours, 'wrong-operation'], [t + 24, 'counted-endpoints'], [t - 24, 'counted-endpoints']],
        hint: 'There are 24 hours in 1 day. Change the days first.',
        explanation: `${g.d} × 24 = ${g.d * 24}. Add ${plural(g.hours, 'hour')}: ${t}.`,
      };
    },
  },

  'class-4-date-gap': {
    gen(level, r) {
      const month = r.int(0, 10), len = MONTHS[month][1];
      const day = r.int(Math.max(12, len - 17), len - 1);
      const mode = level === 1 ? 'between' : r.pick(['after', 'between']);
      return { mode, month, day, n: r.int(len - day + 3, len - day + (level === 3 ? 26 : 15)), d2: r.int(3, 20), who: r.pick(NAMES) };
    },
    calc(g) {
      const next = (g.month + 1) % 12;
      if (g.mode === 'between') {
        const gap = dayOfYear(next, g.d2) - dayOfYear(g.month, g.day);
        const from = dateText({ m: g.month, d: g.day }), to = dateText({ m: next, d: g.d2 });
        return {
          prompt: `How many days are there from ${from} to ${to}?`, answer: gap,
          wrongs: [[gap + 1, 'counted-endpoints'], [gap - 1, 'counted-endpoints'], [Math.abs(g.d2 - g.day), 'wrong-operation'], [g.day + g.d2, 'wrong-operation'], [gap + 7, 'missing-step']],
          hint: `Count the days left in ${MONTHS[g.month][0]}, then add the days in ${MONTHS[next][0]}.`,
          explanation: `${plural(MONTHS[g.month][1], 'day')} in ${MONTHS[g.month][0]}. ${MONTHS[g.month][1]} - ${g.day} = ${MONTHS[g.month][1] - g.day}, and ${MONTHS[g.month][1] - g.day} + ${g.d2} = ${gap}.`,
        };
      }
      const from = dateText({ m: g.month, d: g.day });
      const shift = off => dateText(addDays(g.month, g.day, g.n + off));
      return {
        prompt: `${g.who} borrows a book on ${from}. It must be returned ${g.n} days later. On which date must it be returned?`, answer: shift(0),
        wrongs: [[shift(1), 'counted-endpoints'], [shift(-1), 'counted-endpoints'], [shift(7), 'missing-step'], [shift(-7), 'missing-step']],
        hint: `Use up the days of ${MONTHS[g.month][0]} first, then carry on into the next month.`,
        explanation: `${plural(MONTHS[g.month][1] - g.day, 'day')} remain in ${MONTHS[g.month][0]}. ${g.n} - ${MONTHS[g.month][1] - g.day} = ${g.n - MONTHS[g.month][1] + g.day}, so the date is ${shift(0)}.`,
      };
    },
  },

  'class-4-savings-weeks': {
    gen(level, r) {
      const earn = level === 1 ? r.int(30, 90) * 10 : r.int(2000, 6500);
      const spend = level === 1 ? r.int(10, earn / 10 - 5) * 10 : r.int(500, earn - 500);
      return { earn, spend, times: level === 3 ? r.int(12, 30) : r.int(3, level === 1 ? 9 : 12), period: r.pick(PERIODS), who: r.pick(NAMES) };
    },
    calc(g) {
      const { earn, spend, times } = g, answer = (earn - spend) * times;
      return {
        prompt: `${g.who} earns Rs ${earn} every ${g.period} and spends Rs ${spend}. How much does ${pronoun(g.who).subject.toLowerCase()} save in ${plural(times, g.period)}?`, answer,
        wrongs: wrongs([earn * times - spend, earn * times, spend * times, (earn + spend) * times, (earn - spend) + times, answer + times * 10], 'missing-step'),
        hint: 'Find what is saved in one period first. Then multiply.',
        explanation: `${earn} - ${spend} = ${earn - spend} saved each ${g.period}. ${earn - spend} × ${times} = ${answer}.`,
      };
    },
  },

  'class-4-round-total': {
    gen(level, r) {
      return { a: r.int(1200, 4900), b: r.int(900, 3900), place: level === 1 ? 10 : r.pick([10, 100]), who: r.pick(NAMES) };
    },
    calc(g) {
      const total = g.a + g.b, round = (n, p) => Math.round(n / p) * p;
      const answer = round(total, g.place), other = g.place === 10 ? 100 : 10;
      return {
        prompt: `${g.who} buys a story book for Rs ${g.a}. Two other books cost Rs ${g.b} together. Round the total cost to the nearest ${g.place}.`, answer,
        wrongs: [[total, 'place-shift'], [round(total, other), 'place-shift'], [answer + g.place, 'ignored-change'], [answer - g.place, 'ignored-change'], [round(g.a, g.place) + round(g.b, g.place) + g.place, 'missing-step'], [Math.floor(total / g.place) * g.place - g.place, 'ignored-change']],
        hint: 'Add first. Then look at the digit just right of the place you are rounding to.',
        explanation: `${g.a} + ${g.b} = ${total}. Rounded to the nearest ${g.place}, it is ${answer}.`,
      };
    },
  },

  'class-4-price-gap': {
    gen(level, r) {
      const more = r.int(0, 3) !== 0, y = r.int(level === 1 ? 20 : 200, level === 3 ? 3900 : 1900), d = r.int(level === 1 ? 3 : 20, level === 1 ? 20 : 650);
      return { pair: r.pick(THINGS), mode: level === 1 ? 'other' : r.pick(['other', 'both']), more, d: more ? d : Math.min(d, y - 5), y };
    },
    calc(g) {
      const [p, q] = g.pair, other = g.more ? g.y + g.d : g.y - g.d, both = g.y + other;
      const prompt = `${cap(an(p))} ${p} costs Rs ${g.d} ${g.more ? 'more' : 'less'} than ${an(q)} ${q}. The ${q} costs Rs ${g.y}.`;
      if (g.mode === 'other') {
        return {
          prompt: `${prompt} What does the ${p} cost?`, answer: other,
          wrongs: wrongs([g.more ? g.y - g.d : g.y + g.d, g.d, both, g.y + 2 * g.d, g.y], 'wrong-operation'),
          hint: `Read ${g.more ? 'more' : 'less'} carefully, then ${g.more ? 'add' : 'subtract'}.`,
          explanation: `${g.more ? 'More' : 'Less'} means ${g.more ? 'add' : 'subtract'}: ${g.y} ${g.more ? '+' : '-'} ${g.d} = ${other}.`,
        };
      }
      return {
        prompt: `${prompt} What do the two cost together?`, answer: both,
        wrongs: wrongs([other, 2 * g.y, g.more ? 2 * g.y - g.d : 2 * g.y + g.d, g.y + other + g.d, g.d + g.y], 'missing-step'),
        hint: `First find the cost of the ${p}. Then add both prices.`,
        explanation: `The ${p} costs ${g.y} ${g.more ? '+' : '-'} ${g.d} = ${other}. Together: ${g.y} + ${other} = ${both}.`,
      };
    },
  },

  'class-4-unit-rate': {
    gen(level, r) {
      const mode = r.pick(level === 1 ? ['cost', 'cost', 'sauce'] : ['cost', 'sauce']);
      const k = r.int(3, level === 1 ? 6 : 9), u = r.int(level === 1 ? 4 : 11, level === 3 ? 79 : 48);
      return { mode, k, u, m: k + r.int(2, level === 1 ? 4 : 7), sauceK: r.pick([12, 15, 18, 20, 24]), mult: r.int(2, 5), item: r.pick(['pens', 'notebooks', 'erasers', 'pencils', 'stickers']) };
    },
    calc(g) {
      if (g.mode === 'sauce') {
        const answer = LITRES(g.mult);
        return {
          prompt: `${g.sauceK} tomatoes make half a litre of sauce. How much sauce can ${g.sauceK * g.mult} tomatoes make?`, answer,
          wrongs: [[LITRES(g.mult * 2), 'wrong-operation'], [LITRES(g.mult + 1), 'counted-endpoints'], [LITRES(Math.max(1, g.mult - 1)), 'counted-endpoints'], [LITRES(g.mult + 2), 'missing-step'], [LITRES(g.mult * 2 + 1), 'wrong-operation']],
          hint: 'Find how many groups of the first tomato number fit in the new number.',
          explanation: `${g.sauceK * g.mult} ÷ ${g.sauceK} = ${g.mult} groups. Each group makes half a litre, so the sauce is ${answer}.`,
        };
      }
      const answer = g.m * g.u, total = g.k * g.u;
      return {
        prompt: `${g.k} ${g.item} cost Rs ${total}. How much do ${g.m} ${g.item} cost?`, answer,
        wrongs: [[(g.m - g.k) * g.u, 'missing-step'], [total + g.m, 'wrong-operation'], [(g.m + g.k) * g.u, 'included-extra'], [g.m * total, 'wrong-operation'], [answer + g.u * 2, 'counted-endpoints'], [g.u, 'missing-step']],
        hint: 'Find the cost of 1 first by dividing. Then multiply.',
        explanation: `1 costs ${total} ÷ ${g.k} = Rs ${g.u}. ${g.m} cost ${g.m} × ${g.u} = Rs ${answer}.`,
      };
    },
  },

  'class-4-bill-change': {
    gen(level, r) {
      const price = level === 1 ? r.int(2, 9) * 5 : r.int(18, 95), extra = level === 1 ? r.int(2, 9) * 5 : r.int(25, 480);
      const count = r.int(2, level === 1 ? 4 : 8);
      const total = price * count + extra;
      const paid = [100, 200, 500, 1000, 2000].find(v => v > total + 15);
      return { price, extra, count, paid, who: r.pick(NAMES), thing: r.pick(['notebook', 'pencil box', 'sketch pen', 'toy car', 'hair clip']), other: r.pick(['school bag', 'water bottle', 'lunch box', 'cricket bat']) };
    },
    calc(g) {
      const total = g.price * g.count + g.extra, answer = g.paid - total;
      return {
        prompt: `${g.who} buys ${g.count} ${g.thing}s at Rs ${g.price} each and ${an(g.other)} ${g.other} for Rs ${g.extra}. ${pronoun(g.who).subject} pays Rs ${g.paid}. How much change does ${pronoun(g.who).subject.toLowerCase()} get?`, answer,
        wrongs: [[g.paid - g.price - g.extra, 'price-total'], [g.paid - g.price * g.count, 'missing-step'], [g.paid - g.extra, 'missing-step'], [total, 'change-order'], [answer + g.price, 'price-total']],
        hint: 'Find the full cost first. Then take it away from the money paid.',
        explanation: `${g.count} × ${g.price} = ${g.price * g.count}. Add ${g.extra}: ${total}. Change: ${g.paid} - ${total} = ${answer}.`,
      };
    },
  },

  'class-4-mass-units': {
    gen(level, r) {
      const u = r.pick(UNITS.slice(0, 3)), add = r.int(0, 1) === 0;
      const b1 = r.int(1, level === 3 ? 60 : 30), a1 = add ? r.int(2, level === 3 ? 99 : 40) : b1 + r.int(2, level === 3 ? 40 : 25);
      let a2, b2;
      if (level === 1) {
        a2 = r.int(2, 9) * 50;
        b2 = add ? r.int(1, 9) * 50 % (1000 - a2) || 50 : r.int(1, a2 / 50 - 1) * 50;
      } else if (add) {
        a2 = r.int(51, 99) * 10;
        b2 = r.int(101 - a2 / 10, 99) * 10;
      } else {
        a2 = r.int(0, 3) === 0 ? 0 : r.int(1, 98) * 10;
        b2 = r.int(a2 / 10 + 1, 99) * 10;
      }
      return { unit: UNITS.indexOf(u), add, a1, a2, b1, b2 };
    },
    calc(g) {
      const u = UNITS[g.unit], a = toSmall(g.a1, g.a2, u), b = toSmall(g.b1, g.b2, u);
      const total = g.add ? a + b : a - b, answer = measureText(total, u);
      const noCarry = g.add ? pairText(g.a1 + g.b1, g.a2 + g.b2, u) : pairText(g.a1 - g.b1, Math.abs(g.a2 - g.b2), u);
      const list = [[noCarry, 'unit-conversion'], [measureText(total + u.per, u), 'unit-conversion'], [measureText(total - u.per, u), 'unit-conversion'], [measureText(total + 100, u), 'place-shift'], [measureText(total - 100, u), 'place-shift'], [measureText(total + 50, u), 'missing-step']];
      return {
        prompt: `Find ${g.add ? 'the sum' : 'the difference'}: ${pairText(g.a1, g.a2, u)} ${g.add ? '+' : '-'} ${pairText(g.b1, g.b2, u)}.`, answer,
        wrongs: list,
        hint: g.add ? `Add the ${u.small} first. Every ${u.per} ${u.small} makes 1 ${u.big}.` : `If the ${u.small} you take away is more, borrow 1 ${u.big} as ${u.per} ${u.small}.`,
        explanation: `${g.add ? 'Add' : 'Subtract'} in ${u.small}: ${a} ${g.add ? '+' : '-'} ${b} = ${total} ${u.small}, which is ${answer}.`,
      };
    },
  },

  'class-4-rice-packs': {
    gen(level, r) {
      const u = UNITS[r.pick([0, 0, 2])];
      const k = r.int(level === 1 ? 3 : 6, level === 3 ? 18 : 12), pack = r.int(1, level === 1 ? 4 : 9) * u.per + r.pick([250, 500, 750]);
      const left = r.int(1, 30) * u.per + r.int(1, 19) * 50;
      return { unit: UNITS.indexOf(u), k, pack, left, thing: u.big === 'kg' ? r.pick(['rice', 'sugar', 'wheat flour']) : r.pick(['juice', 'milk', 'oil']) };
    },
    calc(g) {
      const u = UNITS[g.unit], total = g.left + g.k * g.pack, answer = measureText(g.left, u);
      const kind = u.big === 'kg' ? 'packets' : 'bottles';
      return {
        prompt: `A drum has ${measureText(total, u)} of ${g.thing}. ${g.k} ${kind} of ${measureText(g.pack, u)} each are filled from it. How much ${g.thing} is left?`, answer,
        wrongs: [[measureText(total - (g.k - 1) * g.pack, u), 'missing-step'], [measureText(total - (g.k + 1) * g.pack, u), 'missing-step'], [measureText(g.left + 1000, u), 'unit-conversion'], [measureText(Math.max(0, g.left - 1000), u), 'unit-conversion'], [measureText(g.left + 100, u), 'place-shift'], [measureText(Math.max(0, g.left - 100), u), 'place-shift']],
        hint: 'Find how much all the packs hold. Then take that from the whole.',
        explanation: `${g.k} × ${measureText(g.pack, u)} = ${measureText(g.k * g.pack, u)}. ${measureText(total, u)} - ${measureText(g.k * g.pack, u)} = ${answer}.`,
      };
    },
  },

  'class-4-measure-share': {
    gen(level, r) {
      const u = UNITS[r.pick([0, 2, 3])];
      const mode = r.pick(['equal', 'count']);
      const k = r.int(3, level === 1 ? 6 : 9);
      const piece = mode === 'equal' ? r.int(1, level === 1 ? 4 : 12) * u.per + r.int(1, 19) * (u.per === 100 ? 5 : 50) : r.pick(u.per === 100 ? [20, 25, 50] : [100, 125, 250, 500]);
      return { unit: UNITS.indexOf(u), mode, k, piece, who: r.pick(NAMES) };
    },
    calc(g) {
      const u = UNITS[g.unit], total = g.k * g.piece;
      if (g.mode === 'equal') {
        const answer = measureText(g.piece, u);
        const prompt = u.big === 'm' ? `A rope of ${measureText(total, u)} is cut into ${g.k} equal pieces. How long is each piece?`
          : u.big === 'kg' ? `${g.who} shares ${measureText(total, u)} of flour equally among ${g.k} friends. How much does each friend get?`
            : `${measureText(total, u)} of juice is poured equally into ${g.k} jugs. How much juice is in each jug?`;
        return {
          prompt, answer,
          wrongs: [[measureText(g.piece + (u.per === 100 ? 5 : 50), u), 'missing-step'], [measureText(Math.max(5, g.piece - (u.per === 100 ? 5 : 50)), u), 'missing-step'], [measureText(g.piece * 10, u), 'place-shift'], [measureText(Math.floor(total / (g.k + 1)), u), 'wrong-operation'], [measureText(g.piece + u.per, u), 'unit-conversion'], [measureText(Math.floor(total / (g.k - 1)), u), 'wrong-operation']],
          hint: `Change everything to ${u.small}, divide, then change back.`,
          explanation: `${measureText(total, u)} is ${total} ${u.small}. ${total} ÷ ${g.k} = ${g.piece} ${u.small}, which is ${answer}.`,
        };
      }
      const vessel = u.big === 'L' ? 'tank' : u.big === 'kg' ? 'sack' : 'ribbon';
      const unitWord = u.big === 'L' ? `${g.piece} mL cups` : u.big === 'kg' ? `${g.piece} g bags` : `${g.piece} cm pieces`;
      return {
        prompt: `A ${vessel} holds ${measureText(total, u)}. How many ${unitWord} can be filled from it?`, answer: g.k,
        wrongs: wrongs([g.k + 1, g.k - 1, g.k * 10, g.k * 2, Math.max(1, Math.floor(g.k / 2))], 'unit-conversion'),
        hint: `Change the whole amount into ${u.small}. Then see how many equal parts fit.`,
        explanation: `${measureText(total, u)} is ${total} ${u.small}. ${total} ÷ ${g.piece} = ${g.k}.`,
      };
    },
  },
};
