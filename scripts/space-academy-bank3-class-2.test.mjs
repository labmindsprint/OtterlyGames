import test from 'node:test';
import assert from 'node:assert/strict';
import { runBattery } from './space-academy-bank3-battery.mjs';
import * as grade from '../js/space-academy/bank3-class-2.mjs';
import { createBank, createMission } from '../js/space-academy/questions.mjs';
import { diagram } from '../js/space-academy/art.mjs';

runBattery('class-2', grade);

test('[class-2] regression: no negative options, no <= 0 story answers, explanations >= 40 chars, no singular/plural slips, and no number-line answer in <text>', () => {
  const bank = createBank({ 'class-2': grade });
  const class2 = bank.grades.find(g => g.id === 'class-2');
  const pluralSlipRe = /\b1 (?!less\b|plus\b|minus\b|bus\b|gas\b|glass\b|class\b|Mars\b|cross\b|has\b|shows\b)([A-Za-z-]+s)\b/;
  const shortDayPluralRe = /\b(Mon|Tues?|Wed|Thu|Fri|Sat|Sun)s\b/;
  for (const chapter of class2.chapters) {
    for (const level of [1, 2, 3]) {
      for (let s = 0; s < 20; s++) {
        const mission = createMission({ grade: 'class-2', chapter: chapter.id, level, seed: `reg-${s}`, contentVersion: 3 }, bank);
        for (const q of mission.questions) {
          for (const opt of q.options) {
            assert.equal(String(opt).trim().startsWith('-'), false, `${q.family} produced negative option "${opt}"`);
          }
          if (/how many\b.*\b(left|more|altogether|in all|total|now|remain)/i.test(q.prompt) || (grade.FAMILIES[q.family] && /^-?\d+$/.test(q.answer))) {
            if (/^-?\d+$/.test(q.answer)) {
              assert.equal(Number(q.answer) > 0, true, `${q.family} produced answer <= 0 (${q.answer}) for "${q.prompt}"`);
            }
          }
          if (grade.FAMILIES[q.family]) {
            assert.equal(q.explanation.length >= 40, true, `${q.family} explanation too short (${q.explanation.length}): "${q.explanation}"`);
            assert.notEqual(q.explanation.trim(), q.hint.trim(), `${q.family} hint equals explanation`);
            for (const [field, txt] of [['prompt', q.prompt], ['explanation', q.explanation], ['hint', q.hint]]) {
              assert.equal(pluralSlipRe.test(txt), false, `${q.family} singular/plural slip in ${field}: "${txt}"`);
              assert.equal(shortDayPluralRe.test(txt), false, `${q.family} short day plural in ${field}: "${txt}"`);
            }
          }
          if (q.family === 'class-2-number-line') {
            const svg = diagram(q.visual);
            const texts = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1].trim());
            assert.equal(texts.includes(String(q.answer).trim()), false, `class-2-number-line main picture printed answer ${q.answer} in <text>: ${texts.join(', ')}`);
          }
        }
      }
    }
  }
});
