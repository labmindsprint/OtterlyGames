import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FAMILY_GUIDES, academyPages } from './build-space-academy.mjs';
import { CHAPTER_GUIDES } from './academy-guides/chapters.mjs';
import { CONTENT_VERSION, GRADES, LEVELS, chapterRoute, gameLink } from '../js/space-academy/curriculum.mjs';
import { createMission } from '../js/space-academy/questions.mjs';
import { answerChoice, diagram, escapeHTML as e } from '../js/space-academy/art.mjs';
import { choiceDescription } from '../js/space-academy/question-display.mjs';
import { coachingHint } from '../js/space-academy/coaching.mjs';
import { parseSettings } from '../js/worksheet-generator.mjs';

const pages = academyPages();
const pageAt = route => {
  const page = pages.find(page => page.route === route);
  assert.ok(page, `Missing route ${route}`);
  return page.html;
};
const examplesIn = html => [...html.matchAll(/<article\b[^>]*\bdata-lesson-sample\b[\s\S]*?<\/article>/g)].map(match => match[0]);

function original(grade, chapter, level) {
  const settings = {
    grade: grade.id, chapter: chapter.id, level,
    seed: `guide-${grade.id}-${chapter.id}${level === 1 ? '' : `-l${level}`}`,
    contentVersion: CONTENT_VERSION,
  };
  return { question: createMission(settings).questions[0], link: gameLink(settings) };
}

function checkExample(html, { question, link }) {
  assert.match(html, new RegExp(`data-correct-index="${question.correctIndex}"`));
  assert.ok(html.includes(e(question.prompt)));
  assert.ok(html.includes(diagram(question.visual)));
  assert.ok(html.includes(e(coachingHint(question))));
  assert.ok(html.includes(e(question.explanation)));
  assert.ok(!html.includes(question.id), 'Question identifiers must not become reader copy');
  assert.equal((html.match(/data-lesson-option\b/g) ?? []).length, question.options.length);
  for (let index = 0; index < question.options.length; index++) {
    assert.ok(html.includes(answerChoice(question, index)), 'Preserve original picture and text choices');
    const label = e(`Answer ${String.fromCharCode(65 + index)}. ${choiceDescription(question, index)}`);
    assert.ok(html.includes(`data-choice-label="${label}"`), 'Picture controls need original accessible descriptions');
  }
  assert.match(html, /<div class="al-response" data-lesson-response hidden>/);
  assert.match(html, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html, /<button[^>]+type="button" data-lesson-retry hidden>Try again/);
  assert.match(html, /<details[^>]+data-lesson-hint><summary>Need a hint\?/);
  assert.match(html, /<details[^>]+data-lesson-method><summary>Answer &amp; method/);
  assert.ok(html.includes(`href="${e(link)}"`), 'Keep the full versioned, seeded mission link internally');
  assert.match(html, />Try more in game /);
}

test('all 64 lesson routes keep SEO, progressive enhancement and non-technical public copy', () => {
  const inventory = JSON.parse(readFileSync(new URL('../_data/public-pages.json', import.meta.url)));
  const routes = inventory.pages.map(page => typeof page === 'string' ? page : page.route)
    .filter(route => route.startsWith('/learn/olympiad/'));
  assert.equal(pages.length, 64);
  assert.deepEqual(new Set(pages.map(page => page.route)), new Set(routes));
  for (const { route, html } of pages) {
    assert.match(html, /<main id="main-content"[^>]+tabindex="-1">/);
    assert.ok(html.includes(`<link rel="canonical" href="${inventory.origin}${route}">`));
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, /<script type="application\/ld\+json">/);
    assert.match(html, /href="\/css\/academy-lessons\.css"/);
    assert.match(html, /<script type="module" src="\/js\/academy-lessons\.mjs"><\/script>/);
    assert.match(html, /<details[^>]*class="al-parent-notes"><summary[^>]*>For grown-ups/);
    assert.doesNotMatch(html, /Original question code|question-bank version|question bank version|full reproducible set|\bq[12]-|reproducible seed|bank=[12]<\/code>/i);
    assert.match(html, /Original Otterly practice, not an official exam/);
    assert.match(html, /Game progress stays on this browser/);
    assert.match(html, /not copied paper questions|no copied provider questions/i);
    assert.match(html, /no cloud sync/i);
    if (route !== '/learn/olympiad/') {
      assert.match(html, /Not saved; no game rewards/);
      assert.match(html, /<noscript><p[^>]*>Read the choices, then open a hint or worked answer/);
    }
  }
  assert.match(pageAt('/learn/olympiad/'), /<details id="content" class="al-parent-notes">/);
});

test('all 175 interactive examples preserve their actual prompt, figures, constraints and worked answer', () => {
  let checked = 0;
  let pictureChoices = 0;
  for (const grade of GRADES) {
    for (const chapter of grade.chapters) {
      const html = pageAt(chapterRoute(grade.id, chapter.id));
      const examples = examplesIn(html);
      assert.equal(examples.length, LEVELS.length);
      assert.ok(html.indexOf('data-lesson-sample') < html.indexOf('id="chapter-ideas"'));
      assert.ok(html.indexOf('data-lesson-sample') < html.indexOf('id="level-formats"'));
      for (const [index, level] of LEVELS.entries()) {
        const expected = original(grade, chapter, level.id);
        checkExample(examples[index], expected);
        if (expected.question.optionVisuals) pictureChoices++;
        checked++;
      }
      const chapterIndex = grade.chapters.indexOf(chapter);
      const previous = grade.chapters[(chapterIndex + grade.chapters.length - 1) % grade.chapters.length];
      const next = grade.chapters[(chapterIndex + 1) % grade.chapters.length];
      assert.match(html, /aria-label="Other chapters"/);
      for (const other of [previous, next]) assert.ok(html.includes(`href="${chapterRoute(grade.id, other.id)}"`));
    }
    const gradeHTML = pageAt(`/learn/olympiad/${grade.id}/`);
    const chapter = grade.chapters.find(chapter => chapter.section === 'reasoning');
    const examples = examplesIn(gradeHTML);
    assert.equal(examples.length, 1);
    checkExample(examples[0], original(grade, chapter, 2));
    assert.ok(gradeHTML.includes(e(gameLink({ grade: grade.id, mode: 'mixed' }))));
    if (grade.year > 0) assert.ok(gradeHTML.includes(e(gameLink({ grade: grade.id, mode: 'paper', level: 2 }))));
    checked++;
  }
  assert.equal(checked, 175);
  assert.ok(pictureChoices > 20, 'Exercise actual SVG choices, not only text answers');
});

test('search-facing headings and chapter links describe the practice without presenting PP grades as Olympiad levels', () => {
  assert.match(pageAt('/learn/olympiad/'), /<h1>Maths Olympiad Practice for Classes 1-5<\/h1>/);
  for (const grade of GRADES) {
    const gradeHTML = pageAt(`/learn/olympiad/${grade.id}/`);
    const practice = grade.year > 0 ? 'Maths Olympiad Practice' : 'Maths &amp; Picture Reasoning Practice';
    assert.ok(gradeHTML.includes(`<h1>${e(grade.label)} ${practice}</h1>`));
    for (const chapter of grade.chapters) {
      assert.ok(gradeHTML.includes(`href="${chapterRoute(grade.id, chapter.id)}">${e(grade.label)} ${e(chapter.title)}</a>`));
      const chapterHTML = pageAt(chapterRoute(grade.id, chapter.id));
      const chapterPractice = grade.year > 0 ? 'Maths Olympiad Practice' : 'Maths &amp; Reasoning Practice';
      assert.ok(chapterHTML.includes(`<h1>${e(grade.label)} ${e(chapter.title)}: ${chapterPractice}</h1>`));
    }
  }
});

test('grade and chapter worksheet links preserve the chosen curriculum and readiness limits', () => {
  const worksheetSettings = html => {
    const match = html.match(/href="(\/tools\/worksheet-builder\.html\?[^"]+)"/);
    assert.ok(match, 'Offer a worksheet alongside the playable mission');
    const url = new URL(match[1].replaceAll('&amp;', '&'), 'https://otterlygames.com');
    const parsed = parseSettings(url.search);
    assert.deepEqual(parsed.warnings, []);
    return parsed.settings;
  };
  for (const grade of GRADES) {
    const gradeSettings = worksheetSettings(pageAt(`/learn/olympiad/${grade.id}/`));
    assert.equal(gradeSettings.activity, 'academy');
    assert.equal(gradeSettings.grade, grade.id);
    assert.equal(gradeSettings.chapter, grade.year > 0 ? 'paper' : 'mixed');
    for (const chapter of grade.chapters) {
      const settings = worksheetSettings(pageAt(chapterRoute(grade.id, chapter.id)));
      assert.equal(settings.grade, grade.id);
      assert.equal(settings.chapter, chapter.id);
    }
  }
});

test('every chapter, grade and rendered example family carries authored teaching, not boilerplate', () => {
  const methodSteps = new Set();
  for (const grade of GRADES) {
    const gradeHTML = pageAt('/learn/olympiad/' + grade.id + '/');
    assert.match(gradeHTML, /id="grade-routine"/);
    assert.ok(gradeHTML.indexOf('data-lesson-sample') < gradeHTML.indexOf('id="grade-routine"'));
    for (const chapter of grade.chapters) {
      const html = pageAt(chapterRoute(grade.id, chapter.id));
      const guide = CHAPTER_GUIDES[grade.id + '/' + chapter.id];
      assert.ok(guide, 'Missing chapter guide ' + grade.id + '/' + chapter.id);
      for (const text of [guide.idea, guide.slip, guide.tryAtHome.title, ...guide.tryAtHome.steps]) assert.ok(html.includes(e(text)));
      assert.ok(html.indexOf('data-lesson-sample') < html.indexOf('id="chapter-lesson"'));
      assert.equal((html.match(/class="al-path"/g) ?? []).length, LEVELS.length);
      for (const level of LEVELS) {
        const { question } = original(grade, chapter, level.id);
        const family = FAMILY_GUIDES[question.family];
        assert.ok(family && family.steps.length >= 3 && family.slip, 'Missing worked reasoning for ' + question.family);
        for (const step of family.steps) assert.ok(html.includes(e(step)));
        methodSteps.add(family.steps.join('|'));
      }
    }
  }
  assert.ok(methodSteps.size >= 150, 'Worked reasoning must be family-specific');
});
