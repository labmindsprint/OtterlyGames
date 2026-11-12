import { createMission } from '../space-academy/questions.mjs';
import { LEVELS } from '../space-academy/curriculum.mjs';
import { answerChoice, diagram, escapeHTML } from '../space-academy/art.mjs';
import { choiceDescription } from '../space-academy/question-display.mjs';
import { coachingFeedback, coachingHint } from '../space-academy/coaching.mjs';
import { newSeed } from './core.mjs';

// Untimed practice on the page: one question at a time, a hint, and an explanation after every answer. It never affects the chapter pass.
export function mountPractice(root, { grade, chapter }) {
  let level = 1;
  let questions = [];
  let at = 0;
  let right = 0;
  let locked = false;

  function setup() {
    questions = createMission({ grade, chapter, level, seed: newSeed('pr') }).questions;
    at = 0; right = 0;
    ask();
  }

  const shell = (inner) => {
    const options = LEVELS.map((l) => `<option value="${l.id}"${l.id === level ? ' selected' : ''}>Level ${l.id}: ${escapeHTML(l.name)}</option>`).join('');
    root.innerHTML = `<div class="mp-controls"><label class="mp-field">Level <select data-level>${options}</select></label>` +
      '<button type="button" class="mp-btn" data-new>New questions</button></div>' +
      `<div class="mp-check-card" data-card>${inner}</div>`;
    root.querySelector('[data-level]').addEventListener('change', (event) => { level = Number(event.target.value); setup(); });
    root.querySelector('[data-new]').addEventListener('click', setup);
  };

  function ask() {
    locked = false;
    const q = questions[at];
    const options = q.options.map((_, i) => `<li><button type="button" class="mp-choice" data-i="${i}" aria-label="${escapeHTML(choiceDescription(q, i))}">${answerChoice(q, i)}</button></li>`).join('');
    shell(`<p class="mp-check-count" role="status">Question ${at + 1} of ${questions.length}</p>` +
      `<h4 class="mp-question" tabindex="-1">${escapeHTML(q.prompt)}</h4>${q.visual ? `<div class="mp-question-art">${diagram(q.visual)}</div>` : ''}` +
      `<ul class="mp-choices">${options}</ul><p class="mp-controls"><button type="button" class="mp-btn mp-btn--ghost" data-hint>Show a hint</button></p>` +
      '<div class="mp-feedback" data-feedback role="status" aria-live="polite"></div>');
    const feedback = root.querySelector('[data-feedback]');
    root.querySelector('[data-hint]').addEventListener('click', () => { feedback.dataset.ok = 'hint'; feedback.textContent = coachingHint(q) ?? q.hint ?? 'Read the question again and look at the picture.'; });
    root.querySelectorAll('.mp-choice').forEach((b) => b.addEventListener('click', () => {
      if (locked) return;
      const i = Number(b.dataset.i);
      const ok = i === q.correctIndex;
      if (ok) { locked = true; right += 1; }
      else b.disabled = true;
      feedback.dataset.ok = String(ok);
      const note = ok ? '' : coachingFeedback(q, i) ?? '';
      feedback.innerHTML = `<strong>${ok ? 'Right!' : 'Not quite. Try another answer.'}</strong> ${escapeHTML(ok ? q.explanation : note)}`;
      if (ok) {
        root.querySelectorAll('.mp-choice').forEach((c) => { c.disabled = true; });
        const nextBtn = root.ownerDocument.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'mp-btn mp-btn--primary';
        nextBtn.textContent = at + 1 < questions.length ? 'Next question' : 'See how I did';
        nextBtn.addEventListener('click', () => { at += 1; at < questions.length ? ask() : done(); });
        feedback.after(nextBtn);
        nextBtn.focus();
      }
    }));
  }

  function done() {
    shell(`<h4 class="mp-question" tabindex="-1">Practice finished</h4><p>You answered ${questions.length} questions. Choose a harder level or press New questions for more.</p>`);
    root.querySelector('.mp-question').focus({ preventScroll: true });
  }

  setup();
  return { setup };
}
