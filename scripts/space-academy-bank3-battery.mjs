// Shared quality gate for question bank 3 grade modules.
// A grade's test file imports its module and calls runBattery('<grade-id>', module, options).
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import test from 'node:test';
import { LEVELS, SKILLS } from '../js/space-academy/curriculum.mjs';
import { escape } from '../js/space-academy/diagram-kit.mjs';
import { createBank, createMission, verifyQuestion } from '../js/space-academy/questions.mjs';

const WRAPPER = /^<div class="sa-picture sa-v2-picture"><svg viewBox="0 0 ([\d.]+) ([\d.]+)" role="img" aria-label="/;
const UNSAFE = /<script|<image|<foreignObject|<style|<iframe|<animate|<use|<a[\s>]|\shref=|xlink:|javascript:|https?:|\son[a-z]+=|url\(|\sid=/i;
const BROKEN = /\bNaN\b|\bundefined\b|\bInfinity\b|\bnull\b/;
const EMOJI = /\p{Extended_Pictographic}/u;
const MARKUP = /[`*]|&[a-z#0-9]+;/i;
const MAIN_PICTURE = { width: 520, height: 320, font: 16, bytes: 16000 };
const CHOICE_PICTURE = { width: 220, height: 220, font: 14, bytes: 5000 };

const limitsFor = year => year < 0 ? { prompt: 80, words: 12, hint: 80, explanation: 130, option: 16 }
  : year === 0 ? { prompt: 90, words: 14, hint: 90, explanation: 150, option: 18 }
    : year === 1 ? { prompt: 120, words: 20, hint: 110, explanation: 180, option: 28 }
      : year === 2 ? { prompt: 140, words: 24, hint: 120, explanation: 200, option: 28 }
        : { prompt: 200, words: 36, hint: 140, explanation: 260, option: 44 };

// "1 jumps", "1 tens", "There are 1 ..." are grammar slips. A capitalised label before the 1 ("Row 1 slips", "Box 1 has") is a name, not a count.
const SLIP_LABELS = 'Row|Box|Tray|Tablet|Log|Beacon|Jar|Level|Page|Card|Group|Part|Step|Day|Gate|Door|Shelf|Lab|Bay|Pod|Slot|Lane|Number|Task|Stop|Zone|Dock|Test|Set|Round|Mission|Table|Chart|Panel|Tower|Stone|Plan|Case|Rod|Track|Line|Dial|Tank|Cart|Station|Bar|Bin|Cup|Pan|Side|Ring|Wheel|Key|Gear|Net|Map|Tile|Cell|Seat|Pot|Sack|Bag|Rack|Rail|Port|Deck|Hall|Room|Floor|Ship|Craft|Jug|Frame|Plate|Pad|Ramp|Beam|Wire|Disc|Pile|Stack|Team|Trail|Route|Path|Code|Rule|Clue|Lock|Panel|Gauge';
const SLIP_QUALIFIERS = 'more|fewer|less|extra|small|big|tiny|large|red|blue|green|yellow|orange|pink|purple|teal|white|black';
const SLIP_NOT_NOUNS = new Set(['does', 'goes', 'becomes', 'remains', 'leaves', 'makes', 'needs', 'gives', 'comes', 'shows', 'means', 'stays', 'takes', 'adds', 'moves', 'lands', 'fits', 'equals', 'costs', 'holds', 'covers', 'points', 'reads', 'matches', 'sits', 'stands', 'falls', 'rises', 'turns', 'times', 'counts', 'weighs', 'lies', 'gets', 'sees', 'wins']);
const SLIP = new RegExp(`(?:^|[^\\w.,/:-])(?:(${SLIP_LABELS}) )?1 (?:(?:${SLIP_QUALIFIERS}) )?([a-z]{3,}s)\\b`, 'g');
const ARE_ONE = /\b(?:are|were) 1\b(?! (?:of|or|and)\b)/;
function countSlips(text) {
  const slips = [];
  for (const match of text.matchAll(SLIP)) {
    const [whole, label, noun] = match;
    if (label || SLIP_NOT_NOUNS.has(noun) || /(?:ss|us|is|as)$/.test(noun)) continue;
    slips.push(whole.trim());
  }
  if (ARE_ONE.test(text)) slips.push((/.{0,12}\b(?:are|were) 1\b.{0,12}/.exec(text) ?? [text])[0]);
  return slips;
}

const unique = values => [...new Set(values)];
const formatOf =  question => `${question.visual?.kind ?? 'text'}${question.optionVisuals ? '+pictures' : ''}`;

function expectNone(problems) {
  const lines = unique(problems);
  if (lines.length) assert.fail(`${lines.length} problem(s):\n${lines.slice(0, 14).join('\n')}${lines.length > 14 ? `\n... and ${lines.length - 14} more` : ''}`);
}

function collect(bank, grade, config) {
  const make = request => createMission({ grade: grade.id, contentVersion: 3, ...request }, bank);
  const started = performance.now();
  const rows = [];
  let missions = 0;
  const unknown = (config.chapters ?? []).filter(id => !grade.chapters.some(chapter => chapter.id === id));
  if (unknown.length) throw new Error(`Unknown chapter(s) ${unknown.join(', ')}; the grade's chapters are ${grade.chapters.map(chapter => chapter.id).join(', ')}`);
  for (const chapter of grade.chapters.filter(item => !config.chapters || config.chapters.includes(item.id))) {
    for (const level of LEVELS) {
      const list = [];
      for (let index = 0; index < config.seeds; index++) list.push(make({ chapter: chapter.id, level: level.id, seed: `bat-${index}` }));
      missions += list.length;
      rows.push({ chapter, level: level.id, families: chapter.families[level.id - 1], missions: list });
    }
  }
  const msPerMission = (performance.now() - started) / missions;
  // A chapter-filtered run is a quick check while writing; mixed and paper missions need every chapter, so only the full run covers them.
  const mixed = config.chapters ? [] : LEVELS.flatMap(level => Array.from({ length: config.mixedSeeds }, (_, index) => make({ mode: 'mixed', level: level.id, seed: `bat-${index}` })));
  const papers = config.chapters || grade.year < 1 ? [] : LEVELS.flatMap(level => [0, 1].map(index => make({ mode: 'paper', level: level.id, seed: `bat-${index}` })));
  return { rows, mixed, papers, msPerMission };
}

function inspectPicture(html, visual, limit, where, problems) {
  const match = WRAPPER.exec(html);
  if (!match) {
    problems.push(`${where}: render() must return the svg() wrapper from diagram-kit.mjs`);
    return;
  }
  if (!html.includes(`aria-label="${escape(visual.description)}"`)) problems.push(`${where}: the picture's aria-label must be exactly the visual description`);
  const unsafe = UNSAFE.exec(html);
  if (unsafe) problems.push(`${where}: unsupported SVG markup "${unsafe[0].trim()}"`);
  if (BROKEN.test(html)) problems.push(`${where}: the drawing contains NaN, undefined, Infinity or null`);
  if (Number(match[1]) > limit.width || Number(match[2]) > limit.height) problems.push(`${where}: picture is ${match[1]}x${match[2]} units; the limit is ${limit.width}x${limit.height}`);
  if (html.length > limit.bytes) problems.push(`${where}: picture markup is ${html.length} characters; the limit is ${limit.bytes}`);
  for (const [, size] of html.matchAll(/font-size="([\d.]+)"/g)) {
    if (Number(size) < limit.font) problems.push(`${where}: text is ${size} units high; at least ${limit.font} are needed`);
  }
}

export function runBattery(gradeId, module, options = {}) {
  const config = { minRow: 4, minNew: 2, minFormats: 3, minUnique: 0.85, uniqueWindow: 10, minPerFamily: 20, seeds: 40, mixedSeeds: 12, maxMsPerMission: 30, ...options };
  // BANK3_CHAPTERS=counting,patterns limits generation to those chapters for a fast check while writing.
  if (!config.chapters) config.chapters = (process.env.BANK3_CHAPTERS ?? '').split(',').map(id => id.trim()).filter(Boolean);
  if (!config.chapters.length) config.chapters = null;
  const label = text => `[${gradeId}] ${text}`;
  let setup;
  let gathered;
  const context = () => setup ??= (() => {
    const bank = createBank({ [gradeId]: module });
    const grade = bank.grades.find(item => item.id === gradeId);
    return { bank, grade, own: new Set(Object.keys(module.FAMILIES ?? {})), limits: limitsFor(grade.year) };
  })();
  const sample = () => gathered ??= collect(context().bank, context().grade, config);
  const everyMission = () => [...sample().rows.flatMap(row => row.missions), ...sample().mixed, ...sample().papers];
  // Only the grade's own families are judged on wording and drawings; shared version 2 families are frozen.
  const ownQuestions = () => {
    const seen = new Map();
    for (const mission of everyMission()) {
      for (const question of mission.questions) if (context().own.has(question.family) && !seen.has(question.id)) seen.set(question.id, question);
    }
    return [...seen.values()];
  };

  test(label('the module follows the bank 3 contract and every plan row is varied'), () => {
    const { bank, grade, own } = context();
    const problems = [];
    const used = new Set();
    for (const chapter of grade.chapters) {
      chapter.families.forEach((row, index) => {
        const where = `${chapter.id}/${LEVELS[index].name}`;
        row.forEach(id => used.add(id));
        if (row.length < config.minRow) problems.push(`${where} has ${row.length} families; at least ${config.minRow} are required`);
        const fresh = row.filter(id => own.has(id)).length;
        if (fresh < config.minNew) problems.push(`${where} has ${fresh} new families; at least ${config.minNew} are required`);
        const titles = row.map(id => bank.families[id].title);
        if (new Set(titles).size !== titles.length) problems.push(`${where} repeats a family title`);
      });
    }
    for (const id of own) {
      if (!used.has(id)) problems.push(`family ${id} is not used by any plan row`);
      if (module.FAMILIES[id].title.length > 64) problems.push(`family ${id} has a title over 64 characters`);
    }
    for (const [code, entry] of Object.entries(module.MISCONCEPTIONS ?? {})) {
      if (entry.title.length > 40 || entry.message.length > 140) problems.push(`feedback ${code} is too long (title 40, message 140)`);
    }
    expectNone(problems);
  });

  test(label('every planned family appears, with many different questions and picture formats'), t => {
    const problems = [];
    for (const row of sample().rows) {
      const where = `${row.chapter.id}/L${row.level}`;
      const questions = row.missions.flatMap(mission => mission.questions);
      const seen = new Set(questions.map(question => question.family));
      for (const id of row.families) if (!seen.has(id)) problems.push(`${where}: family ${id} never appeared in ${row.missions.length} missions`);
      const formats = unique(questions.map(formatOf));
      if (row.families.length >= config.minRow && formats.length < config.minFormats) {
        problems.push(`${where}: only ${formats.length} different formats (${formats.join(', ')}); ${config.minFormats} are required`);
      }
      const window = row.missions.slice(0, config.uniqueWindow).flatMap(mission => mission.questions);
      const ratio = new Set(window.map(question => question.id)).size / window.length;
      if (ratio < config.minUnique) problems.push(`${where}: only ${Math.round(ratio * 100)}% of the questions in ${config.uniqueWindow} missions are different; ${Math.round(config.minUnique * 100)}% are required`);
      const perFamily = new Map();
      for (const question of questions) {
        if (!perFamily.has(question.family)) perFamily.set(question.family, new Set());
        perFamily.get(question.family).add(question.id);
      }
      for (const [id, ids] of perFamily) if (ids.size < config.minPerFamily) problems.push(`${where}: family ${id} produced only ${ids.size} different questions; ${config.minPerFamily} are required`);
      t.diagnostic(`${where}: ${row.families.length} families, ${formats.length} formats, ${Math.round(ratio * 100)}% different`);
    }
    expectNone(problems);
  });

  test(label('missions rotate families and never repeat a prompt or a picture kind back to back'), () => {
    const { own } = context();
    const problems = [];
    let sameKind = 0;
    let kindPairs = 0;
    for (const row of sample().rows) {
      const size = row.missions[0].questions.length;
      const kinds = new Set(row.missions.flatMap(mission => mission.questions.map(question => question.visual?.kind).filter(Boolean)));
      for (const mission of row.missions) {
        const families = mission.questions.map(question => question.family);
        const need = Math.min(size, row.families.length);
        if (new Set(families).size < need) problems.push(`${mission.id}: ${new Set(families).size} different families; ${need} expected`);
        const prompts = mission.questions.filter(question => own.has(question.family)).map(question => question.prompt);
        if (new Set(prompts).size !== prompts.length) problems.push(`${mission.id}: two questions share a prompt; put the changing numbers, names or objects in the prompt`);
        mission.questions.forEach((question, index) => {
          if (!index) return;
          const before = mission.questions[index - 1];
          if (row.families.length > 1 && question.family === before.family) problems.push(`${mission.id}: question ${index + 1} repeats the family of question ${index}`);
          if (kinds.size >= 3 && question.visual?.kind && before.visual?.kind) {
            kindPairs++;
            if (question.visual.kind === before.visual.kind) sameKind++;
          }
        });
      }
    }
    if (kindPairs > 50 && sameKind / kindPairs > 0.4) problems.push(`${Math.round(100 * sameKind / kindPairs)}% of neighbouring questions share one picture kind; spread the kinds across families`);
    let pairs = 0;
    let sameFamily = 0;
    for (const mission of sample().mixed) {
      mission.questions.forEach((question, index) => {
        if (!index) return;
        pairs++;
        if (question.family === mission.questions[index - 1].family) sameFamily++;
      });
    }
    if (pairs && sameFamily / pairs > 0.08) problems.push(`${Math.round(100 * sameFamily / pairs)}% of neighbouring questions in mixed missions share a family`);
    expectNone(problems);
  });

  test(label('wording is short, plain and specific'), () => {
    const { limits, grade } = context();
    const problems = [];
    const questions = ownQuestions();
    for (const question of questions) {
      const where = question.family;
      const words = question.prompt.trim().split(/\s+/).length;
      if (question.prompt.length > limits.prompt || words > limits.words) problems.push(`${where}: prompt has ${question.prompt.length} characters and ${words} words; limits are ${limits.prompt} and ${limits.words}: "${question.prompt}"`);
      if (question.hint.length > limits.hint) problems.push(`${where}: hint is ${question.hint.length} characters; the limit is ${limits.hint}`);
      if (question.hint === SKILLS[question.skill][1]) problems.push(`${where}: write a short hint specific to this family`);
      if (question.explanation.length > limits.explanation) problems.push(`${where}: explanation is ${question.explanation.length} characters; the limit is ${limits.explanation}`);
      const fields = [['prompt', question.prompt], ['hint', question.hint], ['explanation', question.explanation]];
      if (!question.optionVisuals) {
        for (const option of question.options) {
          if (option.length > limits.option) problems.push(`${where}: answer "${option}" is over ${limits.option} characters`);
          fields.push(['answer', option]);
        }
      }
      for (const [name, value] of fields) {
        if (EMOJI.test(value)) problems.push(`${where}: ${name} contains an emoji; draw a picture instead`);
        if (MARKUP.test(value) || (grade.year <= 0 && /[<>]/.test(value))) problems.push(`${where}: ${name} contains markup characters`);
        if (value !== value.trim() || /\s{2,}/.test(value)) problems.push(`${where}: ${name} has stray whitespace`);
        for (const slip of countSlips(value)) problems.push(`${where}: ${name} has a singular/plural slip ("${slip}"); write "1 jump" or "1 ten" and "There is 1"`);
      }
      // Counts, sums and measures never go below zero before Class 5; a negative distractor is a giveaway.
      if (grade.year <= 4) for (const option of question.options) if (/^[-\u2212\u2013]\s?\d/.test(option)) problems.push(`${where}: answer "${option}" is negative; keep every wrong answer a plausible positive value`);
      if (/^\d{2,}$/.test(question.answer) && new RegExp(`(^|\\D)${question.answer}(\\D|$)`).test(question.hint)) problems.push(`${where}: the hint gives the answer away`);
    }
    const codes = new Set(questions.flatMap(question => question.feedback.filter(Boolean).map(feedback => feedback.code)));
    if (!config.chapters) for (const code of Object.keys(module.MISCONCEPTIONS ?? {})) if (!codes.has(code)) problems.push(`feedback ${code} is never used by a question`);
    expectNone(problems);
  });

  test(label('pictures are described, safe, distinct and sized for a phone'), () => {
    const problems = [];
    const rendered = new Map();
    const draw = (visual, limit, where) => {
      const key = JSON.stringify(visual);
      if (!rendered.has(key)) {
        if (!visual.kind.startsWith(`v3-${gradeId}-`)) return null;
        const html = module.render(visual);
        if (module.render(visual) !== html) problems.push(`${where}: render() is not deterministic`);
        inspectPicture(html, visual, limit, where, problems);
        rendered.set(key, html);
      }
      return rendered.get(key);
    };
    for (const question of ownQuestions()) {
      const where = question.family;
      if (question.visual) {
        if (!question.visual.kind.startsWith('v3-') && !question.visual.kind.startsWith('v2-')) problems.push(`${where}: unknown picture kind ${question.visual.kind}`);
        if (question.visual.kind.startsWith('v3-') && !question.visual.kind.startsWith(`v3-${gradeId}-`)) problems.push(`${where}: picture kinds must start with v3-${gradeId}-`);
        if (question.visual.description.length < 15) problems.push(`${where}: the picture description is too short`);
        draw(question.visual, MAIN_PICTURE, where);
      }
      if (question.optionVisuals) {
        const pictures = question.optionVisuals.map(visual => visual && draw(visual, CHOICE_PICTURE, `${where} (picture choice)`));
        if (question.optionVisuals.some(visual => !visual)) problems.push(`${where}: every answer needs a picture when any answer has one`);
        const looks = pictures.filter(Boolean).map(html => html.replace(/aria-label="[^"]*"/, ''));
        if (looks.length && new Set(looks).size !== looks.length) problems.push(`${where}: two picture choices are drawn the same way`);
        const spoken = question.optionVisuals.filter(Boolean).map(visual => visual.description);
        if (spoken.some(text => text.length < 8) || new Set(spoken).size !== spoken.length) problems.push(`${where}: picture choices need different descriptions`);
      }
    }
    expectNone(problems);
  });

  test(label('solve() recomputes the answer, so a wrong claim is rejected'), () => {
    const { bank } = context();
    const problems = [];
    const first = new Map();
    for (const question of ownQuestions()) {
      const key = `${question.family}:${question.level}`;
      if (!first.has(key)) first.set(key, question);
    }
    for (const question of first.values()) {
      const wrongIndex = question.options.findIndex((_, index) => index !== question.correctIndex);
      const claim = structuredClone(question);
      const code = question.feedback[wrongIndex].code;
      claim.feedback[question.correctIndex] = { code, message: bank.misconceptions[code].message };
      claim.feedback[wrongIndex] = null;
      claim.answer = question.options[wrongIndex];
      claim.correctIndex = wrongIndex;
      try {
        verifyQuestion(claim, bank);
        problems.push(`${question.family}: solve() accepted a wrong answer; it must recompute from the visual or proof.givens`);
      } catch {
        // The wrong claim was rejected.
      }
    }
    expectNone(problems);
  });

  test(label('missions are deterministic and verify again after a save round trip'), () => {
    const { bank } = context();
    const problems = [];
    const check = mission => {
      const parsed = JSON.parse(JSON.stringify(mission));
      if (JSON.stringify(createMission(parsed, bank)) !== JSON.stringify(parsed)) problems.push(`${mission.id}: regenerating the saved mission gives a different mission`);
      for (const question of parsed.questions) {
        const before = JSON.stringify(question);
        try {
          verifyQuestion(question, bank);
        } catch (error) {
          problems.push(`${question.id}: ${error.message}`);
        }
        if (JSON.stringify(question) !== before) problems.push(`${question.id}: solve() changed the question it was given`);
      }
    };
    for (const row of sample().rows) row.missions.slice(0, 3).forEach(check);
    sample().mixed.slice(0, 3).forEach(check);
    sample().papers.slice(0, 2).forEach(check);
    const signatures = sample().rows.map(row => new Set(row.missions.slice(0, 12).map(mission => mission.questions.map(question => question.id).join('|'))).size);
    if (signatures.some(count => count < 11)) problems.push('different seeds often give the same mission; the question space is too small');
    expectNone(problems);
  });

  test(label('wrong answers are not guessable from length or from the middle number'), () => {
    const problems = [];
    let eligibleLong = 0;
    let longest = 0;
    let eligibleNumber = 0;
    let middle = 0;
    let expected = 0;
    for (const question of ownQuestions()) {
      if (question.optionVisuals || question.options.length < 3) continue;
      const lengths = question.options.map(option => option.length);
      const top = Math.max(...lengths);
      if (lengths.filter(length => length === top).length === 1 && top - Math.min(...lengths) >= 3) {
        eligibleLong++;
        if (lengths[question.correctIndex] === top) longest++;
      }
      const numbers = question.options.map(option => Number(/-?\d+(?:\.\d+)?/.exec(option.replaceAll(',', ''))?.[0]));
      if (numbers.every(Number.isFinite) && new Set(numbers).size === numbers.length) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const place = sorted.indexOf(numbers[question.correctIndex]);
        eligibleNumber++;
        expected += (sorted.length - 2) / sorted.length;
        if (place > 0 && place < sorted.length - 1) middle++;
      }
    }
    if (eligibleLong >= 40 && longest / eligibleLong > 0.45) problems.push(`the correct answer is the longest in ${Math.round(100 * longest / eligibleLong)}% of questions; vary the length of wrong answers`);
    if (eligibleNumber >= 40 && middle / eligibleNumber > expected / eligibleNumber + 0.2) problems.push(`the correct number is the middle value in ${Math.round(100 * middle / eligibleNumber)}% of questions; include wrong answers on both sides`);
    expectNone(problems);
  });

  test(label('a mission is generated fast enough for a phone'), () => {
    sample();
    assert.ok(sample().msPerMission <= config.maxMsPerMission, `${sample().msPerMission.toFixed(1)} ms per mission; the limit is ${config.maxMsPerMission}`);
  });
}
