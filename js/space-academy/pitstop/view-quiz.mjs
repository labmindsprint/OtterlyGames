import { answerChoice, diagram } from '../art.mjs';
import { coachingFeedback, coachingHint } from '../coaching.mjs';
import * as voice from './tts.mjs';
import { applyPart, applyPaperEnd, applyPrintTest, applyTraining, builtParts, cargoOf, classState, passed, PRINT_PASS } from './progress.mjs';
import { PAINTS, classById } from './data.mjs';
import { mountBay } from './bay.mjs';
import { play } from './audio.mjs';
import { ICONS, esc, ringo } from './ui.mjs';

const ADVANCE_MS = 1000;
const PART_ADVANCE_MS = 1500;
const paintColor = look => PAINTS.find(item => item.id === look.paint)?.color ?? null;

function answerGrid(question) {
  const pictures = Boolean(question.optionVisuals);
  const short = question.options.every(option => option.length <= 16);
  return pictures || short ? 'ps-answers ps-answers--grid' : 'ps-answers';
}

// Runs any mission: a part mission welds a part, a training mission feeds the skills page, a mock test unlocks a launch, a print test prints the cargo.
export function show(app, { mission }) {
  const { root } = app;
  const voiceOn = () => voice.isEnabled(voice.defaultOn(mission.classId));
  const questions = mission.questions;
  const total = questions.length;
  const outcome = [];
  let index = 0;
  let timer = 0;
  let bay = null;
  let welds = 0;
  let state = null;
  let busy = false;

  const pips = () => {
    if (total > 12) {
      const done = outcome.filter(Boolean).length;
      return `<div class="ps-progress" role="img" aria-label="Question ${index + 1} of ${total}"><i style="width:${Math.round(done / total * 100)}%"></i><span>${index + 1}/${total}</span></div>`;
    }
    return `<ol class="ps-pips" aria-label="Question ${index + 1} of ${total}">${questions.map((_, position) => {
      const done = outcome[position];
      const cls = done ? (done.correct ? 'is-good' : 'is-miss') : position === index ? 'is-now' : '';
      return `<li class="${cls}"></li>`;
    }).join('')}</ol>`;
  };

  // The shell (header, weld bay, print layer) is built once so the bay never resets; only the question body is redrawn.
  const shell = () => {
    root.innerHTML = `<main class="ps-screen ps-quiz ps-quiz--${mission.kind}" tabindex="-1" aria-label="${esc(mission.title)}">
      <header class="ps-quiz-top">
        <button type="button" class="ps-icon-button" data-act="leave" aria-label="Leave this mission">${ICONS.close}</button>
        ${pips()}
      </header>
      ${mission.kind === 'part' ? '<section class="ps-bay" data-bay aria-hidden="true"></section>' : ''}
      <div class="ps-qbody" data-body></div>
    </main>`;
    if (mission.kind === 'part') startBay();
  };

  const draw = () => {
    const question = questions[index];
    state = { tries: 0, missed: new Set(), done: false };
    if (!root.querySelector('[data-body]')) shell();
    else root.querySelector('.ps-pips, .ps-progress').outerHTML = pips();
    root.querySelector('[data-body]').innerHTML = `<section class="ps-qcard">
        <p class="ps-qprompt" id="ps-prompt">${esc(question.prompt)}</p>
        ${voice.isSupported() ? `<button type="button" class="ps-icon-button ps-speak" data-act="speak" aria-label="Read the question aloud" title="Hear the question">${ICONS.speak}</button>` : ''}
        ${question.visual ? `<div class="ps-qvisual">${diagram(question.visual)}</div>` : ''}
      </section>
      <div class="ps-coach" data-coach hidden aria-live="polite"></div>
      <div class="${answerGrid(question)}" role="group" aria-labelledby="ps-prompt" data-count="${question.options.length}">
        ${question.options.map((_, choice) => `<button type="button" class="ps-answer" data-choice="${choice}">${answerChoice(question, choice)}</button>`).join('')}
      </div>
      <footer class="ps-quiz-foot">
        <button type="button" class="ps-chip" data-act="hint">${ICONS.bulb}<span>Hint</span></button>
        <button type="button" class="ps-primary" data-act="next" hidden>Next</button>
      </footer>`;
    root.querySelector('.ps-screen').focus({ preventScroll: true });
    window.scrollTo(0, 0);
    if (voiceOn()) voice.speak(voice.questionSpeech(question));
  };

  // The weld bay stays on the question page: it shows the part filling in, each right answer fuses one seam in place.
  const startBay = () => {
    const host = root.querySelector('[data-bay]');
    const save = app.state();
    const part = classById(mission.classId).parts.find(item => item.id === mission.partId);
    bay = mountBay(host, {
      classId: mission.classId, partId: mission.partId, label: part.label,
      built: builtParts(save, mission.classId).filter(id => id !== mission.partId),
      paint: paintColor(classState(save, mission.classId)),
      steps: total, step: welds, reduced: app.reduced(),
    });
  };

  const say = (text, mood = 'happy') => {
    const coach = root.querySelector('[data-coach]');
    coach.hidden = false;
    coach.innerHTML = `${ringo(52, mood)}<p>${esc(text)}</p>`;
    coach.scrollIntoView({ block: 'nearest', behavior: app.reduced() ? 'auto' : 'smooth' });
  };

  // Age-7 wording: one short sentence, never the long worked-out coaching text.
  const simpleHelp = text => {
    const first = String(text ?? '').split(/(?<=[.!?])\s+/)[0].trim();
    return first && first.length <= 90 ? first : '';
  };

  const mark = (choice, kind) => {
    const button = root.querySelector(`[data-choice="${choice}"]`);
    button.classList.add(kind);
    if (kind === 'is-miss') button.disabled = true;
  };

  const showNext = label => {
    const next = root.querySelector('[data-act="next"]');
    next.textContent = label;
    next.hidden = false;
    next.focus({ preventScroll: true });
  };

  const finish = async () => {
    busy = true;
    const answers = outcome.map(item => ({ chapter: item.chapter, correct: item.correct }));
    const right = answers.filter(item => item.correct).length;
    try {
      if (mission.kind === 'part') {
        const next = await app.commit(applyPart(app.state(), mission.classId, mission.partId, answers));
        if (!passed(right, total)) app.go('pit', { mode: 'retry', partId: mission.partId, right, total });
        else app.go('pit', { mode: 'weld', partId: mission.partId, stars: next.classes[mission.classId].parts[mission.partId].stars, right, total });
      } else if (mission.kind === 'train') {
        await app.commit(applyTraining(app.state(), mission.classId, answers));
        app.go('skills', { trained: { right, total } });
      } else if (mission.kind === 'printtest') {
        // Pass: every schematic in the hold is printed in one save. Fail: only the answers are kept.
        const items = right >= PRINT_PASS ? cargoOf(app.state(), mission.classId) : [];
        await app.commit(applyPrintTest(app.state(), mission.classId, right, answers));
        app.go('print-result', { right, total, items });
      } else {
        await app.commit(applyPaperEnd(app.state(), mission.classId, right, answers));
        app.go('mock-result', { right, total });
      }
    } catch (error) {
      busy = false;
      app.fail(error);
    }
  };

  const advance = () => {
    window.clearTimeout(timer);
    voice.stop();
    if (busy) return;
    if (index + 1 >= total) { finish(); return; }
    index += 1;
    draw();
  };

  const record = correct => {
    outcome[index] = { chapter: questions[index].chapter, correct };
    root.querySelector('.ps-pips, .ps-progress').outerHTML = pips();
  };

  // Every correct answer in a part mission is a weld: the robot arms fix one more seam in the bay that stays above the question.
  const weldBeat = () => {
    welds += 1;
    bay?.weld();
  };

  const choose = async choice => {
    if (state.done || busy) return;
    voice.stop();
    const question = questions[index];
    if (choice === question.correctIndex) {
      state.done = true;
      const first = state.tries === 0;
      mark(choice, 'is-good');
      record(first);
      play('right');
      say(first ? 'Yes! That is it.' : 'You got it!', 'cheer');
      if (mission.kind === 'part') { weldBeat(); timer = window.setTimeout(advance, PART_ADVANCE_MS); return; }
      timer = window.setTimeout(advance, ADVANCE_MS);
      return;
    }
    play('wrong');
    bay?.bad();
    state.tries += 1;
    state.missed.add(choice);
    mark(choice, 'is-miss');
    if (state.tries >= 2 || question.options.length - state.missed.size <= 1) {
      state.done = true;
      mark(question.correctIndex, 'is-good');
      record(false);
      say(question.explanation, 'think');
      showNext(index + 1 >= total ? 'Finish' : 'Next');
      return;
    }
    const detail = simpleHelp(coachingFeedback(question, choice)) || simpleHelp(coachingHint(question));
    say(detail ? `Not quite. ${detail}` : 'Not quite. Look again and try another one.', 'think');
  };

  const confirmLeave = () => {
    const burned = mission.kind === 'paper' || mission.kind === 'printtest';
    const sheet = document.createElement('div');
    sheet.className = 'ps-sheet';
    sheet.innerHTML = `<div class="ps-sheet-card" role="dialog" aria-modal="true" aria-label="Leave this mission?">
      <p>Leave this mission? Your answers so far will not be kept.${burned ? ' The fuel is already used.' : ''}</p>
      <div class="ps-sheet-actions"><button type="button" class="ps-chip" data-sheet="stay">Keep playing</button><button type="button" class="ps-chip" data-sheet="leave">Leave</button></div></div>`;
    root.querySelector('.ps-screen').append(sheet);
    sheet.querySelector('[data-sheet="stay"]').focus();
    sheet.addEventListener('click', event => {
      const choice = event.target.closest('[data-sheet]')?.dataset.sheet;
      if (choice === 'stay') sheet.remove();
      if (choice === 'leave') app.go(mission.kind === 'part' ? 'pit' : mission.kind === 'train' ? 'skills' : mission.kind === 'printtest' ? 'print-test' : 'map');
    });
  };

  const onClick = event => {
    const target = event.target.closest('[data-act],[data-choice]');
    if (!target) return;
    if (target.dataset.choice !== undefined) { choose(Number(target.dataset.choice)); return; }
    const action = target.dataset.act;
    if (action === 'next') advance();
    if (action === 'hint') {
      const hint = simpleHelp(coachingHint(questions[index])) || 'Read the question again and look at each answer.';
      say(hint, 'think');
      if (voiceOn()) voice.speak(hint);
    }
    if (action === 'speak') voice.speak(voice.questionSpeech(questions[index]));
    if (action === 'leave') { voice.stop(); confirmLeave(); }
  };

  const onKey = event => {
    if (busy || root.querySelector('.ps-sheet')) return;
    if (state.done) return;
    const number = Number(event.key);
    if (number >= 1 && number <= questions[index].options.length) choose(number - 1);
  };

  app.mission = mission;
  voice.prepare();
  draw();
  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  return () => {
    window.clearTimeout(timer);
    root.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
    voice.stop();
    bay?.destroy();
  };
}
