import { LEVELS } from '../space-academy/curriculum.mjs';
import { escapeHTML } from '../space-academy/art.mjs';
import { generateAcademyWorksheet, questionMarkup, answerMarkup } from '../worksheet-academy.mjs';
import { newSeed } from './core.mjs';

const COUNTS = [5, 10, 12, 20];

// Builds the printable worksheet on the page itself from the production worksheet generator.
export function mountPrint(root, { grade, chapter, classLabel, title, builderHref, progress, classId, chapterId }) {
  const doc = root.ownerDocument;
  let seed = newSeed('ws');
  let level = 1;
  let count = 10;
  let key = false;

  root.innerHTML = `<div class="mp-controls mp-print-controls">
      <label class="mp-field">Level <select data-ws-level>${LEVELS.map((l) => `<option value="${l.id}">Level ${l.id}: ${escapeHTML(l.name)}</option>`).join('')}</select></label>
      <label class="mp-field">Questions <select data-ws-count>${COUNTS.map((n) => `<option value="${n}"${n === count ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="mp-check-field"><input type="checkbox" data-ws-key> Add an answer key page</label>
    </div>
    <p class="mp-actions"><button type="button" class="mp-btn mp-btn--primary" data-ws-print>Print this worksheet</button>
      <button type="button" class="mp-btn" data-ws-new>New set</button></p>
    <p class="mp-result" data-ws-status role="status" aria-live="polite"></p>
    <div class="mp-sheet-area" data-ws-area></div>
    <p class="mp-fine mp-print-link"><a href="${builderHref}">Open full worksheet builder</a></p>`;
  const area = root.querySelector('[data-ws-area]');
  const status = root.querySelector('[data-ws-status]');

  function render() {
    status.textContent = '';
    status.dataset.ok = '';
    let sheet;
    try {
      sheet = generateAcademyWorksheet({ grade, chapter, level, count, seed });
    } catch (error) {
      area.innerHTML = '';
      status.dataset.ok = 'false';
      status.textContent = `The worksheet could not be made. ${error.message} Press New set to try again.`;
      return;
    }
    const levelName = LEVELS.find((l) => l.id === sheet.settings.level)?.name ?? '';
    const items = sheet.questions.map((q, i) => `<li class="worksheet-question worksheet-mcq">${questionMarkup(q, i + 1)}</li>`).join('');
    const keyItems = sheet.questions.map((q, i) => `<li><span class="worksheet-key-number">${i + 1}.</span> ${answerMarkup(q)}</li>`).join('');
    area.innerHTML = `<article class="mp-sheet" aria-label="Worksheet preview">
        <header class="mp-sheet-head"><p class="mp-sheet-brand">OTTERLY MATHS PATH &middot; ${escapeHTML(classLabel)}</p><h3>${escapeHTML(title)}</h3>
          <p>Level ${sheet.settings.level}: ${escapeHTML(levelName)} &middot; ${sheet.questions.length} questions &middot; Set code ${escapeHTML(sheet.settings.seed)}</p>
          <p class="mp-sheet-name"><span>Name</span><span>Date</span></p><p>Circle the letter of the best answer.</p></header>
        <ol class="mp-sheet-questions">${items}</ol>
        <footer class="mp-sheet-foot">Original Otterly practice. Not an official exam. otterlygames.com/learn/maths/</footer>
      </article>${key ? `<article class="mp-sheet mp-sheet-key" aria-label="Answer key"><header class="mp-sheet-head"><p class="mp-sheet-brand">ANSWER KEY &middot; SET CODE ${escapeHTML(sheet.settings.seed)}</p><h3>${escapeHTML(title)}</h3></header><ol class="mp-sheet-keylist">${keyItems}</ol></article>` : ''}`;
  }

  root.querySelector('[data-ws-level]').addEventListener('change', (e) => { level = Number(e.target.value); render(); });
  root.querySelector('[data-ws-count]').addEventListener('change', (e) => { count = Number(e.target.value); render(); });
  root.querySelector('[data-ws-key]').addEventListener('change', (e) => { key = e.target.checked; render(); });
  root.querySelector('[data-ws-new]').addEventListener('click', () => { seed = newSeed('ws'); render(); });
  root.querySelector('[data-ws-print]').addEventListener('click', () => {
    if (!area.firstElementChild) { render(); }
    const saved = progress.update(classId, chapterId, { printed: true });
    status.dataset.ok = saved ? 'true' : 'false';
    status.textContent = saved
      ? 'Opening the print window. Choose A4 and turn off headers and footers if you like.'
      : 'Opening the print window. This browser cannot save that you printed, so the chapter will not show "Printed".';
    globalThis.print();
  });
  render();
  return { render };
}
