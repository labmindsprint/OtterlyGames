import { createMission } from '../space-academy/questions.mjs';
import { answerChoice, diagram, escapeHTML } from '../space-academy/art.mjs';
import { choiceDescription } from '../space-academy/question-display.mjs';
import { PASS_MARK, CHECK_LENGTH } from './progress.mjs';
import { newSeed } from './core.mjs';

// Five questions, one at a time, from the same generator the Space Academy game uses.
export function mountCheck(root, { classId, grade, chapter, source = chapter, progress, onResult }) {
  const doc = root.ownerDocument;
  let questions = [];
  let at = 0;
  let answers = [];
  let seed = '';
  let unsaved = false;

  const status = () => root.querySelector('[data-check-status]');

  function intro() {
    const warn = !progress.saves
      ? '<p class="mp-alert" role="alert"><strong>Your browser is not letting this page save.</strong> You can still take the check, but your pass will not be remembered and the next chapter will not unlock by itself.</p>' : '';
    root.innerHTML = `<div class="mp-check-card">${warn}<p>Five questions. Get ${PASS_MARK} right to pass. You can try again with new questions.</p>` +
      (progress.saves
        ? '<button type="button" class="mp-btn mp-btn--primary" data-start>Start the check</button>'
        : '<button type="button" class="mp-btn mp-btn--primary" data-start>Take the check without saving</button>') + '</div>';
    unsaved = !progress.saves;
    root.querySelector('[data-start]').addEventListener('click', start);
  }

  function start() {
    seed = newSeed();
    questions = createMission({ grade, chapter: source, level: 1, seed }).questions.slice(0, CHECK_LENGTH);
    answers = [];
    at = 0;
    ask();
  }

  function ask() {
    const q = questions[at];
    const options = q.options.map((_, i) => `<li><button type="button" class="mp-choice" data-i="${i}" aria-label="${escapeHTML(choiceDescription(q, i))}">${answerChoice(q, i)}</button></li>`).join('');
    root.innerHTML = `<div class="mp-check-card"><p class="mp-check-count" data-check-status role="status">Question ${at + 1} of ${questions.length}</p>` +
      `<h4 class="mp-question" tabindex="-1">${escapeHTML(q.prompt)}</h4>${q.visual ? `<div class="mp-question-art">${diagram(q.visual)}</div>` : ''}<ul class="mp-choices">${options}</ul></div>`;
    root.querySelector('.mp-question').focus({ preventScroll: true });
    root.querySelectorAll('.mp-choice').forEach((b) => b.addEventListener('click', () => {
      answers.push(Number(b.dataset.i));
      at += 1;
      at < questions.length ? ask() : finish();
    }));
  }

  function finish() {
    const score = questions.filter((q, i) => answers[i] === q.correctIndex).length;
    const passed = score >= PASS_MARK;
    const saved = unsaved ? false : progress.recordCheck(classId, chapter, score);
    const review = questions.map((q, i) => {
      const right = answers[i] === q.correctIndex;
      return `<li class="${right ? 'is-right' : 'is-wrong'}"><strong>${right ? 'Right' : 'Not quite'}.</strong> ${escapeHTML(q.prompt)}<br>` +
        `${right ? '' : `You chose: ${escapeHTML(q.options[answers[i]])}. `}Answer: ${escapeHTML(q.options[q.correctIndex])}. <span>${escapeHTML(q.explanation)}</span></li>`;
    }).join('');
    const warn = unsaved ? '<p class="mp-alert" role="alert">This result was not saved because the browser blocks saving.</p>'
      : saved ? '' : '<p class="mp-alert" role="alert"><strong>Could not save your result.</strong> Your browser refused to store it. Try again after freeing space or allowing site data.</p>';
    root.innerHTML = `<div class="mp-check-card">${warn}<h4 class="mp-question" tabindex="-1">${passed ? `You passed: ${score} out of ${questions.length}!` : `You scored ${score} out of ${questions.length}.`}</h4>` +
      `<p>${passed ? 'Great work.' : `You need ${PASS_MARK} to pass. Read the answers below, then try again.`}</p><ol class="mp-review">${review}</ol>` +
      '<div class="mp-controls"><button type="button" class="mp-btn mp-btn--primary" data-again>Try again with new questions</button></div></div>';
    root.querySelector('.mp-question').focus({ preventScroll: true });
    root.querySelector('[data-again]').addEventListener('click', start);
    onResult?.({ score, passed, saved: saved && !unsaved });
  }

  intro();
  return { start, seedUsed: () => seed };
}
