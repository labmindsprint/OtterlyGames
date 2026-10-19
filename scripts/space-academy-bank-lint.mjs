// Space Academy bank lint: a permanent wording, variety and age-appropriateness gate for every grade and family.
//   node scripts/space-academy-bank-lint.mjs                       all grades
//   node scripts/space-academy-bank-lint.mjs --grade pp1           one or more grades (comma separated)
//   node scripts/space-academy-bank-lint.mjs --grade class-3 --family shade --level 2 --rule hint-leak
//   --draws N (default 200)  --out <file> (raw list)  --all (print every group)  --min-variety N  --min-skeletons N
// It drives each family's engine directly (grade x family x level x seeded draws), so it sees the same text a child sees.
// Exit code 1 on any violation. Exceptions go in ALLOW below, each with a one-line justification.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { SKILLS } from '../js/space-academy/curriculum.mjs';
import { createBank } from '../js/space-academy/questions.mjs';
import { QuestionRetry, randomContext } from '../js/space-academy/bank-shared.mjs';

// Keep this list tiny. Each entry silences one rule for one family (optionally one grade/level) and must say why.
export const ALLOW = [
  // { grade: 'pp2', family: 'pp2-example', rule: 'age-number', level: 3, why: 'A stretch question that deliberately counts past 20.' },
];

export const RULES = {
  'grammar-slip': 'singular/plural slip such as "1 apples", "3 is", "1 are"',
  'grammar-ordinal': 'wrong ordinal suffix such as 2th or 11st',
  'grammar-article': 'a/an used before the wrong sound',
  'grammar-punct': 'double punctuation such as "..", "p.m..", "??" or ",,"',
  'filler-token': 'meaningless label plus number ("Log 458") that nothing else uses',
  'filler-orphan': 'short opening sentence whose numbers are never used again',
  variety: 'too few different questions once names are masked (names alone do not count as variety)',
  skeleton: 'too few different sentence templates',
  'option-superset': 'two options where one is also true of the other (square and rectangle)',
  'option-in-prompt': 'an answer option is written out in the prompt',
  'option-raw-id': 'an option shows an internal id or hex colour',
  'option-joined': 'an option is a machine-joined string',
  'option-duplicate': 'two options mean the same thing',
  'option-negative': 'a negative distractor where counts cannot be negative',
  'option-nondigit': 'a text distractor next to a numeric answer',
  'hint-leak': 'the hint contains the answer',
  'age-number': 'a number above the grade cap',
  'age-number-word': 'number words in a pre-primary question',
  'age-half-hour': 'half hours in a PP1 question',
  'age-shape': 'a shape name above the grade (pentagon, hexagon...)',
  'age-ordinal': 'an ordinal above third in PP1',
  crash: 'the engine threw an error',
};

const NAME_STOP = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Rs', 'Class', 'Grade', 'Year', 'Roman', 'Indian', 'India', 'Celsius', 'Earth', 'Moon', 'Sun', 'Mars', 'Venus', 'Jupiter', 'Saturn', 'Mercury', 'Neptune', 'Uranus', 'Pluto', 'True', 'False', 'None', 'Yes', 'No', 'Both', 'Neither', 'Day', 'Week', 'Month', 'Row', 'Column', 'Level', 'Step', 'Part', 'Page', 'Question', 'Figure', 'Box', 'Table', 'Chart', 'Graph', 'Line', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
const COLOURS = 'red|blue|green|yellow|orange|purple|pink|teal|gold|golden|silver|black|white|brown|grey|gray|coral|cyan|violet|lilac|navy|sky';
const NUMBER_WORDS = 'zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|half|quarter|third|fourth|fifth|sixth|eighth|tenth';

const FILLER_LABELS = 'Log|Beacon|Flight log|Scan log|Convoy tag|Net check|Mirror check|Grid check|Gauge|Bay|Sensor|Ticket|Case|Entry|Mission';
const FILLER = new RegExp(`\\b(?:${FILLER_LABELS})\\s*#?\\d+\\b`, 'g');
const LABEL_NUMBER = /\b([A-Z][a-z]{2,}(?: [A-Z][a-z]+)?) #?(\d+)\b/g;
const LABEL_SKIP = new Set(['Rs', 'Class', 'Grade', 'Year', 'Week', 'Day', 'Page', 'Level', 'Row', 'Column', 'Question', 'Step', 'Part', 'Round', 'Month', 'Figure', 'Number', 'Chapter', 'Arrange', 'Order', 'Sort', 'Then', 'Put', 'Write', 'Next', 'Now', 'Count', 'Find', 'Add', 'Another', 'Share', 'Pour', 'Feed', 'Docking', 'History', 'Science', 'Story', 'Maths', 'Art', ...NAME_STOP]);
const FILLER_VERB = /\b(?:opens?|logs?|files?|scans?|checks?|reads?|stamps?|signs?) (?:the |a |an )?(?:log|logbook|ticket|case|entry|file|tag|slip|report)\b/i;

const SLIP_LABELS = 'Row|Box|Tray|Tablet|Log|Beacon|Jar|Level|Page|Card|Group|Part|Step|Day|Gate|Door|Shelf|Lab|Bay|Pod|Slot|Lane|Number|Task|Stop|Zone|Dock|Test|Set|Round|Mission|Table|Chart|Panel|Tower|Stone|Plan|Case|Rod|Track|Line|Dial|Tank|Cart|Station|Bar|Bin|Cup|Pan|Side|Ring|Wheel|Key|Gear|Net|Map|Tile|Cell|Seat|Pot|Sack|Bag|Rack|Rail|Port|Deck|Hall|Room|Floor|Ship|Craft|Jug|Frame|Plate|Pad|Ramp|Beam|Wire|Disc|Pile|Stack|Team|Trail|Route|Path|Code|Rule|Clue|Lock|Gauge|Figure|Shape|Picture|Tile|Block|Week|Month|Year|Class|Grade|Chapter|Question';
const SLIP_QUALIFIERS = 'more|fewer|less|extra|small|big|tiny|large|red|blue|green|yellow|orange|pink|purple|teal|white|black';
const SLIP_NOT_NOUNS = new Set(['does', 'goes', 'becomes', 'remains', 'leaves', 'makes', 'needs', 'gives', 'comes', 'shows', 'means', 'stays', 'takes', 'adds', 'moves', 'lands', 'fits', 'equals', 'costs', 'holds', 'covers', 'points', 'reads', 'matches', 'sits', 'stands', 'falls', 'rises', 'turns', 'times', 'counts', 'weighs', 'lies', 'gets', 'sees', 'wins', 'has', 'was', 'its', 'yes', 'always', 'sometimes', 'across', 'perhaps', 'jumps', 'hops', 'steps', 'bigger', 'less', 'plus', 'minus', 'this', 'thus', 'unless', 'versus', 'cms', 'lasts', 'starts', 'ends', 'tells', 'looks', 'stops', 'begins', 'wants', 'asks', 'says', 'picks', 'sends', 'keeps', 'ties', 'uses', 'shares', 'buys', 'sells', 'eats', 'draws', 'pays', 'wears', 'loses', 'finds', 'puts', 'cuts', 'folds', 'flips', 'weighs', 'measures', 'rolls', 'spins']);
const SLIP = new RegExp(`(?:^|[^\\w.,/:#-])(?:(${SLIP_LABELS}) )?1 (?:(?:${SLIP_QUALIFIERS}) )?([a-z]{3,}s)\\b`, 'g');

const MONTH_WORDS = 'January|February|March|April|May|June|July|August|September|October|November|December';

function grammar(text) {
  const out = [];
  for (const match of text.matchAll(SLIP)) {
    const [whole, label, noun] = match;
    if (label || SLIP_NOT_NOUNS.has(noun) || /(?:ss|us|is|as)$/.test(noun)) continue;
    // "5, 6 and 1 beads": the 1 ends a list, so the plural is right.
    if (/\d(?:,| and| or)\s*$/.test(text.slice(0, match.index + whole.indexOf('1')))) continue;
    out.push(['grammar-slip', text.slice(Math.max(0, match.index - 8), match.index + whole.length + 22).trim()]);
  }
  const areOne = /\b(?:are|were) 1\b(?! (?:of|or|and|more|less|fewer|st|nd|rd)\b)/.exec(text);
  if (areOne) out.push(['grammar-slip', text.slice(Math.max(0, areOne.index - 12), areOne.index + 14)]);
  const oneAre = /(?:^|[^\w.,/:#-])1 (?:are|were)\b/.exec(text);
  if (oneAre && !/\d(?:,| and| or)\s*$/.test(text.slice(0, oneAre.index + oneAre[0].indexOf('1')))) out.push(['grammar-slip', text.slice(Math.max(0, oneAre.index - 20), oneAre.index + 24)]);
  // "3 is" is only a slip when the number counts things ("There are 3 is"); a digit being talked about ("the 3 is in tens") is fine.
  for (const match of text.matchAll(/\b([2-9]) (is|was)\b/g)) {
    const before = text.slice(Math.max(0, match.index - 24), match.index);
    if (!/\b(?:there|here) (?:are|were)\s+$|\b(?:has|have|had|with) $/i.test(before)) continue;
    out.push(['grammar-slip', `${before}${match[0]}`.trim()]);
  }
  for (const match of text.matchAll(/\b(\d+)(st|nd|rd|th)\b/g)) {
    const n = Number(match[1]);
    const mod = n % 100 >= 11 && n % 100 <= 13 ? 4 : n % 10;
    const want = mod === 1 ? 'st' : mod === 2 ? 'nd' : mod === 3 ? 'rd' : 'th';
    if (want !== match[2]) out.push(['grammar-ordinal', match[0]]);
  }
  for (const match of text.matchAll(/\b(a|an|A|An) ([A-Za-z0-9][A-Za-z0-9'-]*)/g)) {
    const [whole, article, word] = match;
    const lower = word.toLowerCase();
    const an = article.toLowerCase() === 'an';
    if (/^\d/.test(word)) {
      if (article === 'A' && !/(?:^|[.!?]\s+)$/.test(text.slice(0, match.index))) continue;
      const digits = word.replace(/\D.*$/, '');
      const vowel = digits === '11' || digits === '18' || /^8/.test(digits);
      if (vowel === an) continue;
      out.push(['grammar-article', whole]);
      continue;
    }
    if (/^[A-Z]$/.test(word.split('-')[0])) {
      const letter = word.split('-')[0];
      if (!an && /^[FHLMNRSX]$/.test(letter) && article === 'a') out.push(['grammar-article', whole]);
      if (an && !/^[AEFHILMNORSX]$/.test(letter)) out.push(['grammar-article', whole]);
      continue;
    }
    if (/^[A-Z]{2,}$/.test(word) && !an) continue;
    if (['and', 'or', 'are', 'is', 'at', 'as', 'in', 'on', 'if', 'of', 'all', 'also'].includes(lower) && article === 'A') continue;
    const vowelStart = /^[aeiou]/.test(lower) && !/^(uni|use|usu|uti|eu|one|once|ubi|ura|uro|uk)/.test(lower) || /^(hour|honest|heir|honou?r)/.test(lower);
    const vowelDigitsLike = /^(uni|use|usu|uti|eu|one|once|ubi)/.test(lower);
    if (an && (!vowelStart || vowelDigitsLike)) out.push(['grammar-article', whole]);
    if (!an && vowelStart) out.push(['grammar-article', whole]);
  }
  for (const match of text.matchAll(/\b[2-9]\d* (?!and\b|or\b|then\b|it\b)[a-z]+ leaves\b/g)) out.push(['grammar-slip', match[0]]);
  if (/\.\.(?!\.)/.test(text.replace(/\.\.\./g, '…'))) out.push(['grammar-punct', (/.{0,12}\.\..{0,6}/.exec(text) ?? [text])[0]]);
  for (const pattern of [/[ap]\.m\.\./i, /\?\?/, /,,/, /!!/, /\.,/]) {
    const hit = pattern.exec(text);
    if (hit) out.push(['grammar-punct', text.slice(Math.max(0, hit.index - 10), hit.index + 10)]);
  }
  return out;
}

const norm = text => String(text).toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim();
const escapeRe = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordIn = (needle, hay) => new RegExp(`(?<![A-Za-z0-9])${escapeRe(needle)}(?![A-Za-z0-9])`, 'i').test(hay);

const SUPERSETS = { square: ['rectangle', 'rhombus', 'diamond', 'quadrilateral', 'parallelogram'], rectangle: ['quadrilateral', 'parallelogram'], rhombus: ['parallelogram', 'quadrilateral'], diamond: ['quadrilateral', 'parallelogram'] };
const NONE_LIKE = /^(none|cannot be told|not enough|impossible|all of these|none of these|can't tell|cannot tell|no way|neither|both|all|same)/i;
const RAW_ID = [/-#[0-9a-f]{6}-/i, /#[0-9a-f]{6}\b/i, /\b[a-z]+-\d+\b/, /\b[a-z]+_[a-z0-9_]+\b/, /\bJar line \d/i, /\b[a-z]+[A-Z][a-z]+[A-Z]/];

function ageCaps(year) {
  if (year === -1) return { numbers: 20, words: true, half: true, shapes: true, ordinals: true };
  if (year === 0) return { numbers: 20 };
  return null;
}
const ORDINAL_WORDS = /\b(fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|twentieth)\b/i;
const SMALL_NUMBER_WORDS = /\b(zero|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\b/i;
const HALF_HOUR = /\bhalf (?:past|an hour)\b|\bhalf-past\b|(?:\b|^)\d{1,2}:30\b|\b30 minutes\b/i;
const SHAPES_ABOVE = /\b(pentagon|hexagon|heptagon|octagon|decagon|rhombus|trapezium|parallelogram)s?\b/i;

function fieldsOf(c) {
  const fields = [['prompt', c.prompt], ['hint', c.hint], ['explanation', c.explanation]];
  if (c.visual?.description) fields.push(['picture', c.visual.description]);
  for (const choice of c.choices) {
    fields.push(['option', String(choice.value)]);
    if (choice.visual?.description) fields.push(['option picture', choice.visual.description]);
  }
  return fields;
}

function lintDraw(c, ctx) {
  const found = [];
  const add = (rule, field, text) => found.push({ rule, field, text: String(text).slice(0, 160) });
  const fields = fieldsOf(c);
  const rest = field => fields.filter(([name]) => name !== field).map(([, value]) => value).join(' \n ').toLowerCase();
  const answer = String(c.answer);
  const options = c.choices.map(choice => String(choice.value));
  const hasPictureChoices = c.choices.some(choice => choice.visual);

  for (const [field, text] of fields) {
    for (const [rule, example] of grammar(text)) add(rule, field, example);
  }

  const elsewhere = c.hint.toLowerCase() + ' ' + c.explanation.toLowerCase() + ' ' + options.join(' ').toLowerCase() + ' ' + (c.visual?.description ?? '').toLowerCase() + ' ' + c.choices.map(choice => choice.visual?.description ?? '').join(' ').toLowerCase();
  for (const match of c.prompt.matchAll(FILLER)) {
    if (!elsewhere.includes(match[0].toLowerCase())) add('filler-token', 'prompt', match[0]);
  }
  const labelled = [...c.prompt.matchAll(LABEL_NUMBER)];
  for (const match of labelled) {
    if (labelled.length >= 3) break;
    if (LABEL_SKIP.has(match[1]) || MONTH_WORDS.includes(match[1]) || ctx.lower.has(match[1].toLowerCase())) continue;
    if (!elsewhere.includes(match[0].toLowerCase()) && !elsewhere.includes(`${match[1].toLowerCase()} ${match[2]}`)) add('filler-token', 'prompt', match[0]);
  }
  if (FILLER_VERB.test(c.prompt)) add('filler-token', 'prompt', FILLER_VERB.exec(c.prompt)[0]);
  const sentences = c.prompt.split(/(?<=[.!?])\s+/);
  if (sentences.length > 1) {
    // An opening "Log 458 at Vega Dock." style sentence: a short statement tying a big number to a made-up place or label.
    const first = sentences[0];
    const numbers = first.match(/\d{3,}/g) ?? [];
    const words = first.trim().split(/\s+/).length;
    const later = sentences.slice(1).join(' ') + ' ' + elsewhere + ' ' + answer;
    const placeLike = /\b(?:at|in|on|near|from|by) (?:[A-Z][a-z]+ ){1,2}[A-Z][a-z]+\b|\b(?:at|in|near) [A-Z][a-z]+\.?$|^[A-Z][a-z]+ #?\d{3,}\b/.test(first.replace(/^\S+ /, m => m));
    if (!first.includes('?') && words <= 7 && numbers.length && placeLike && numbers.every(n => !new RegExp(`(?<!\\d)${n}(?!\\d)`).test(later))) add('filler-orphan', 'prompt', first);
  }

  const joinedOptions = options.map(norm);
  if (new Set(joinedOptions).size !== joinedOptions.length) add('option-duplicate', 'option', options.join(' | '));
  for (const option of options) {
    for (const pattern of RAW_ID) if (pattern.test(option)) { add('option-raw-id', 'option', option); break; }
    if (!hasPictureChoices) {
      if (/^(?=.*[a-z])[a-z0-9]+(?:-[a-z0-9]+){2,}$/.test(option) || /\b[a-z]+ \d+(?:, [a-z]+ \d+){2,}/.test(option) || /[|_]/.test(option)) add('option-joined', 'option', option);
    }
  }
  if (!hasPictureChoices) {
    const lowerOptions = options.map(option => option.toLowerCase());
    // Square next to rectangle is only a trap when the question is about a property both share, not about picture patterns or symmetry.
    if (!/symmetry|pattern|swap|places|sequence|analogy|figure|picture|column|row|next/i.test(c.prompt)) {
      for (const [shape, bigger] of Object.entries(SUPERSETS)) {
        if (lowerOptions.some(option => wordIn(shape, option)) && lowerOptions.some(option => bigger.some(other => wordIn(other, option) && !wordIn(shape, option)))) add('option-superset', 'option', options.join(' | '));
      }
    }
    // Only the question sentence matters, and only when the prompt is not a list of the choices: setup sentences legitimately
    // name people, days or colours, and "which is more, A or B?" lists its options by design.
    const questionSentence = c.prompt.split(/(?<=[.!?])\s+/).filter(sentence => sentence.includes('?')).pop() ?? '';
    const listed = options.filter(option => option.length >= 3 && wordIn(option, c.prompt)).length;
    if (listed === 1 && (questionSentence.match(/,/g) ?? []).length < 3 && answer.length >= 4 && /[A-Za-z]{4}/.test(answer) && !NONE_LIKE.test(answer) && !NAME_STOP.has(answer) && wordIn(answer, questionSentence)) add('option-in-prompt', 'prompt', `${answer} in "${c.prompt}"`);
    if (/^\d+$/.test(answer)) {
      for (const option of options) if (/[A-Za-z]/.test(option) && !NONE_LIKE.test(option) && !/^\d+(?:st|nd|rd|th)$/.test(option)) add('option-nondigit', 'option', `${option} (answer ${answer})`);
    }
  }
  if (ctx.year <= 4 && !/^[-\u2212\u2013]/.test(answer)) {
    for (const option of options) if (/^[-\u2212\u2013]\s?\d/.test(option)) add('option-negative', 'option', `${option} (answer ${answer})`);
  }

  const hint = c.hint;
  const inPrompt = answer.length > 0 && wordIn(answer, c.prompt);
  if (!inPrompt && !NONE_LIKE.test(answer) && !/^[A-Z](?:(?:,| and|, and) [A-Z])*$/.test(answer)) {
    if (/^\d{2,}$/.test(answer) && new RegExp(`(?<![\\d.,])${answer}(?![\\d])`).test(hint)) add('hint-leak', 'hint', `${answer} in "${hint}"`);
    else if (/^[A-Za-z][A-Za-z '-]{3,}$/.test(answer) && wordIn(answer, hint)) add('hint-leak', 'hint', `${answer} in "${hint}"`);
  }

  const caps = ageCaps(ctx.year);
  if (caps) {
    const all = fields.filter(([name]) => name !== 'option picture' || true);
    for (const [field, text] of all) {
      for (const match of text.matchAll(/(?<![\d.])\d+(?:[.,]\d+)*(?![\d])/g)) {
        const value = Number(match[0].replace(/,/g, ''));
        if (value > caps.numbers) { add('age-number', field, `${match[0]} in "${text.slice(0, 90)}"`); break; }
      }
      if (caps.words && SMALL_NUMBER_WORDS.test(text)) add('age-number-word', field, SMALL_NUMBER_WORDS.exec(text)[0]);
      if (caps.half && HALF_HOUR.test(text)) add('age-half-hour', field, HALF_HOUR.exec(text)[0]);
      if (caps.shapes && SHAPES_ABOVE.test(text)) add('age-shape', field, SHAPES_ABOVE.exec(text)[0]);
      if (caps.ordinals) {
        const high = [...text.matchAll(/\b(\d+)(?:st|nd|rd|th)\b/g)].find(match => Number(match[1]) > 3);
        if (high) add('age-ordinal', field, high[0]);
        if (ORDINAL_WORDS.test(text)) add('age-ordinal', field, ORDINAL_WORDS.exec(text)[0]);
      }
    }
  }
  return found;
}

function properNouns(texts) {
  const lower = new Set();
  const capital = new Set();
  for (const text of texts) {
    for (const word of text.match(/[A-Za-z][a-z]+/g) ?? []) {
      if (/^[a-z]/.test(word)) lower.add(word);
    }
  }
  for (const text of texts) {
    for (const word of text.match(/\b[A-Z][a-z]{2,}\b/g) ?? []) if (!lower.has(word.toLowerCase()) && !NAME_STOP.has(word)) capital.add(word);
  }
  return capital;
}

function maskNames(text, names) {
  return names.size ? text.replace(/\b[A-Z][a-z]{2,}\b/g, word => (names.has(word) ? 'N' : word)) : text;
}

function skeleton(text, names) {
  return maskNames(text, names)
    .replace(new RegExp(`\\b(?:${COLOURS})\\b`, 'gi'), 'C')
    .replace(new RegExp(`\\b(?:${NUMBER_WORDS})\\b`, 'gi'), '#')
    .replace(/\d+(?:[.,/]\d+)*/g, '#')
    .replace(/# ([a-z]{3,})/gi, '# W')
    .replace(/\s+/g, ' ').toLowerCase().trim();
}

function collect(bank, grade, config) {
  const rows = [];
  const seen = new Set();
  const plan = [];
  for (const chapter of grade.chapters) {
    for (let level = 1; level <= 3; level++) {
      for (const family of chapter.families[level - 1]) {
        const key = `${family}|${level}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (config.families && !config.families.test(family)) continue;
        if (config.levels && !config.levels.includes(level)) continue;
        plan.push({ family, level, chapter });
      }
    }
  }
  for (const item of plan) {
    const draws = [];
    const crashes = new Map();
    const started = performance.now();
    let attempts = 0;
    for (let index = 0; draws.length < config.draws && index < config.draws * 3; index++) {
      if (performance.now() - started > config.maxMs) break;
      attempts++;
      const r = randomContext(`lint|${grade.id}|${item.family}|${item.level}|${index}`);
      try {
        const c = bank.engines.get(item.family).draft(item.family, grade, item.level, r);
        const skill = bank.families[item.family].skill;
        draws.push({ ...c, hint: c.hint ?? SKILLS[skill][1] });
      } catch (error) {
        if (error instanceof QuestionRetry) continue;
        crashes.set(error.message, (crashes.get(error.message) ?? 0) + 1);
        if ([...crashes.values()].reduce((a, b) => a + b, 0) >= 5) break;
      }
    }
    rows.push({ ...item, draws, crashes, attempts });
  }
  return rows;
}

export function runLint(options = {}) {
  const config = { draws: 120, maxMs: 250, minVariety: 20, minSkeletons: 0, rules: null, ...options };
  const bank = createBank();
  const violations = [];
  const stats = [];
  for (const grade of bank.grades) {
    if (config.grades && !config.grades.includes(grade.id)) continue;
    const rows = collect(bank, grade, config);
    const corpus = rows.flatMap(row => row.draws.flatMap(c => [c.prompt, c.explanation, ...c.choices.map(choice => String(choice.value))]));
    const names = properNouns(corpus);
    const lower = new Set(corpus.flatMap(text => (text.match(/\b[a-z]{3,}\b/g) ?? [])));
    const perFamily = new Map();
    for (const row of rows) {
      const push = (rule, field, text, example) => violations.push({ rule, grade: grade.id, family: row.family, level: row.level, field, text, example: example ?? text });
      for (const [message, count] of row.crashes) push('crash', 'engine', `${count}x ${message}`);
      const family = perFamily.get(row.family) ?? { raw: new Set(), masked: new Set(), skeletons: new Set(), draws: 0, level: row.level };
      perFamily.set(row.family, family);
      family.draws += row.draws.length;
      family.level = Math.min(family.level, row.level);
      const dedupe = new Set();
      for (const c of row.draws) {
        const visual = c.visual ? JSON.stringify(c.visual) : '';
        family.raw.add(JSON.stringify([c.prompt, visual, c.answer]));
        family.masked.add(JSON.stringify([maskNames(c.prompt, names), maskNames(visual, names), c.answer]));
        family.skeletons.add(skeleton(c.prompt, names));
        for (const hit of lintDraw(c, { year: grade.year, lower })) {
          const key = `${hit.rule}|${hit.field}|${hit.text.replace(/\d+/g, '#')}`;
          if (dedupe.has(key)) continue;
          dedupe.add(key);
          push(hit.rule, hit.field, hit.text, c.prompt);
        }
      }
      stats.push({ grade: grade.id, family: row.family, level: row.level, draws: row.draws.length });
    }
    // Variety is judged per family across its levels, like the battery does; a level on its own may legitimately be small.
    for (const [familyId, family] of perFamily) {
      const push = (rule, text) => violations.push({ rule, grade: grade.id, family: familyId, level: 0, field: 'family', text, example: [...family.skeletons][0] ?? '' });
      if (family.draws < Math.min(config.draws, 40)) continue;
      if (family.masked.size < config.minVariety) push('variety', `${family.masked.size} different questions in ${family.draws} draws once names are masked (${family.raw.size} before masking; ${config.minVariety} needed)`);
      if (config.minSkeletons && family.skeletons.size < config.minSkeletons) push('skeleton', `${family.skeletons.size} sentence templates (${config.minSkeletons} needed)`);
    }
  }
  for (const entry of ALLOW) if (!entry.why || !entry.rule || !entry.family) throw new Error('Every ALLOW entry needs a family, a rule and a why.');
  const allowed = violation => ALLOW.some(entry => entry.family === violation.family && entry.rule === violation.rule && (!entry.grade || entry.grade === violation.grade) && (!entry.level || entry.level === violation.level));
  const kept = violations.filter(violation => !allowed(violation) && (!config.rules || config.rules.includes(violation.rule)));
  return { violations: kept, stats };
}

export function groupViolations(violations) {
  const groups = new Map();
  for (const violation of violations) {
    const key = `${violation.rule}|${violation.grade}|${violation.family}|${violation.level}`;
    const group = groups.get(key) ?? { ...violation, count: 0 };
    group.count++;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.rule.localeCompare(b.rule) || a.grade.localeCompare(b.grade) || a.family.localeCompare(b.family) || a.level - b.level);
}

const clip = (text, size) => (text.length > size ? `${text.slice(0, size - 1)}…` : text);

export function formatReport(violations, { all = true, limit = 25 } = {}) {
  if (!violations.length) return 'Bank lint: no violations.';
  const groups = groupViolations(violations);
  const lines = [`Bank lint: ${violations.length} violations in ${groups.length} family/level/rule groups.`, ''];
  const byRule = new Map();
  for (const group of groups) byRule.set(group.rule, [...(byRule.get(group.rule) ?? []), group]);
  lines.push('rule'.padEnd(18) + 'groups'.padStart(7) + 'hits'.padStart(7) + '  grades');
  for (const [rule, list] of byRule) {
    const grades = [...new Set(list.map(group => group.grade))].join(',');
    lines.push(rule.padEnd(18) + String(list.length).padStart(7) + String(list.reduce((sum, group) => sum + group.count, 0)).padStart(7) + `  ${grades}`);
  }
  for (const [rule, list] of byRule) {
    lines.push('', `== ${rule}: ${RULES[rule] ?? ''}`);
    lines.push('grade'.padEnd(8) + 'family'.padEnd(36) + 'L  ' + 'n'.padEnd(4) + 'example');
    for (const group of all ? list : list.slice(0, limit)) {
      lines.push(group.grade.padEnd(8) + clip(group.family, 35).padEnd(36) + `${group.level}  ` + String(group.count).padEnd(4) + clip(group.text, 110));
    }
    if (!all && list.length > limit) lines.push(`   ... ${list.length - limit} more groups (use --all)`);
  }
  return lines.join('\n');
}

export function formatRaw(violations) {
  return violations.map(v => `${v.rule}\t${v.grade}\t${v.family}\tL${v.level}\t${v.field}\t${v.text.replace(/\s+/g, ' ')}\t| ${String(v.example).replace(/\s+/g, ' ').slice(0, 200)}`).join('\n');
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const next = () => argv[++index];
    if (arg === '--grade') options.grades = next().split(',');
    else if (arg === '--family') options.families = new RegExp(next(), 'i');
    else if (arg === '--level') options.levels = next().split(',').map(Number);
    else if (arg === '--rule') options.rules = next().split(',');
    else if (arg === '--draws') options.draws = Number(next());
    else if (arg === '--min-variety') options.minVariety = Number(next());
    else if (arg === '--min-skeletons') options.minSkeletons = Number(next());
    else if (arg === '--out') options.out = next();
    else if (arg === '--all') options.all = true;
    else if (arg === '--help') options.help = true;
    else throw new Error(`Unknown option ${arg}. Use --help.`);
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('node scripts/space-academy-bank-lint.mjs [--grade pp1,class-3] [--family regex] [--level 1,2] [--rule hint-leak] [--draws 200] [--out file] [--all] [--min-variety 20] [--min-skeletons N]\nRules:\n' + Object.entries(RULES).map(([rule, text]) => `  ${rule.padEnd(18)}${text}`).join('\n'));
    process.exit(0);
  }
  const started = performance.now();
  const { violations, stats } = runLint(options);
  if (options.out) {
    mkdirSync(dirname(options.out), { recursive: true });
    writeFileSync(options.out, formatRaw(violations) + '\n');
  }
  console.log(formatReport(violations, { all: options.all ?? true }));
  console.log(`\n${stats.length} grade/family/level combinations, ${Math.round((performance.now() - started) / 1000)}s${options.out ? `, raw list in ${options.out}` : ''}.`);
  process.exit(violations.length ? 1 : 0);
}
