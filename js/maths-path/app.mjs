import { widget } from './widgets.mjs';
import { createProgress, browserStorage, stateLabel, PASS_MARK } from './progress.mjs';
import { reducedMotion } from './core.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const progress = createProgress(browserStorage());

function storageBanner() {
  if (!progress.problem) return;
  const banner = document.createElement('p');
  banner.className = 'mp-alert mp-alert--page';
  banner.setAttribute('role', 'alert');
  banner.innerHTML = progress.problem === 'unavailable'
    ? '<strong>Progress cannot be saved.</strong> This browser is blocking site storage, so passes and unlocked chapters will not be remembered. You can still learn and practise.'
    : '<strong>Some saved progress could not be read.</strong> Your results may be missing until saving works again.';
  $('#main-content')?.prepend(banner);
}

const STATUS_TEXT = { passed: 'Passed', started: 'In progress', new: 'Not started' };

function classChapters(page) {
  return $$('[data-mp-chapter-link]', page).map((el) => el.dataset.mpChapterLink);
}

function hubAndClass() {
  const entries = $$('[data-mp-status]');
  let passedCount = 0;
  const byClass = new Map();
  for (const el of entries) {
    const [classId, chapterId] = el.dataset.mpStatus.split('/');
    const state = stateLabel(progress.get(classId, chapterId));
    if (state === 'passed') passedCount += 1;
    el.dataset.state = state;
    el.textContent = STATUS_TEXT[state];
    if (!byClass.has(classId)) byClass.set(classId, []);
    byClass.get(classId).push([chapterId, state, el]);
  }
  for (const [classId, list] of byClass) {
    list.forEach(([chapterId, state, el], index) => {
      const prev = list[index - 1];
      if (state === 'new' && prev && prev[1] !== 'passed') {
        el.textContent = `Pass ${prev[2].closest('[data-mp-row]')?.dataset.mpTitle ?? 'the chapter before'} first`;
        el.dataset.state = 'locked';
      } else if (state === 'new' && (!prev || prev[1] === 'passed') && el.closest('[data-mp-row]')?.dataset.mpLive === 'true') {
        el.textContent = 'Start here';
        el.dataset.state = 'next';
      }
    });
    $$(`[data-mp-count="${classId}"]`).forEach((el) => {
      el.textContent = `${list.filter((item) => item[1] === 'passed').length} of ${list.length} passed`;
    });
  }
  $$('[data-mp-total]').forEach((el) => { el.textContent = `${passedCount} chapter${passedCount === 1 ? '' : 's'} passed on this device`; });
}

function seeIt(page) {
  const wrap = $('[data-mp-see]', page);
  if (!wrap) return;
  const screens = $$('.mp-screen', wrap);
  if (screens.length < 2) return;
  wrap.classList.add('is-js');
  let at = 0;
  const controls = document.createElement('div');
  controls.className = 'mp-screen-controls';
  controls.innerHTML = '<button type="button" class="mp-btn" data-back>Back</button><p class="mp-screen-count" role="status" aria-live="polite"></p><button type="button" class="mp-btn mp-btn--primary" data-next>Next</button>';
  wrap.append(controls);
  const back = $('[data-back]', controls);
  const next = $('[data-next]', controls);
  const count = $('.mp-screen-count', controls);
  const dots = document.createElement('ol');
  dots.className = 'mp-dots';
  screens.forEach((_, i) => { dots.insertAdjacentHTML('beforeend', `<li><button type="button" class="mp-dot" aria-label="Go to screen ${i + 1} of ${screens.length}" data-dot="${i}"></button></li>`); });
  controls.after(dots);
  const show = (i, move) => {
    at = Math.max(0, Math.min(screens.length - 1, i));
    screens.forEach((screen, index) => { screen.hidden = index !== at; });
    back.disabled = at === 0;
    next.textContent = at === screens.length - 1 ? 'Done: try it' : 'Next';
    count.textContent = `Screen ${at + 1} of ${screens.length}`;
    $$('.mp-dot', dots).forEach((dot, index) => dot.setAttribute('aria-current', index === at ? 'step' : 'false'));
    if (move) {
      const heading = $('h3', screens[at]);
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      if (!reducedMotion()) screens[at].animate?.([{ opacity: 0.4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220 });
    }
    if (at === screens.length - 1) progress.update(page.dataset.class, page.dataset.chapter, { seen: true });
  };
  back.addEventListener('click', () => show(at - 1, true));
  next.addEventListener('click', () => {
    if (at === screens.length - 1) { $('#try-it')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' }); $('#try-it h2')?.focus({ preventScroll: true }); return; }
    show(at + 1, true);
  });
  dots.addEventListener('click', (event) => { const dot = event.target.closest('[data-dot]'); if (dot) show(Number(dot.dataset.dot), true); });
  wrap.addEventListener('keydown', (event) => {
    if (event.target.closest('.mp-w') && event.target.closest('input, select, textarea')) return;
    if (event.target.closest('.mp-screen .mp-w')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); show(at + 1, true); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(at - 1, true); }
  });
  show(0, false);
  progress.update(page.dataset.class, page.dataset.chapter, {});
}

function tryIt(page, specs) {
  const holders = $$('[data-try]', page);
  const done = new Set();
  holders.forEach((holder) => {
    const index = Number(holder.dataset.try);
    const spec = specs[index];
    const stage = $('[data-try-stage]', holder);
    const result = $('[data-try-result]', holder);
    stage.innerHTML = '';
    const controller = widget(spec.widget.w).mount(stage, spec.widget.c, {});
    const check = document.createElement('button');
    check.type = 'button';
    check.className = 'mp-btn mp-btn--primary';
    check.textContent = 'Check my answer';
    const hintBtn = document.createElement('button');
    hintBtn.type = 'button';
    hintBtn.className = 'mp-btn mp-btn--ghost';
    hintBtn.textContent = 'Show a hint';
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'mp-btn mp-btn--ghost';
    reset.textContent = 'Start again';
    const bar = document.createElement('div');
    bar.className = 'mp-controls';
    bar.append(check, hintBtn, reset);
    stage.after(bar);
    check.addEventListener('click', () => {
      const verdict = controller.matches(spec.target ?? {});
      result.dataset.ok = String(verdict.ok);
      result.textContent = verdict.ok ? `${verdict.message} ${spec.success}`.trim() : verdict.message;
      if (verdict.ok) {
        done.add(index);
        holder.dataset.done = 'true';
        if (done.size === holders.length) progress.update(page.dataset.class, page.dataset.chapter, { tried: true });
      }
    });
    hintBtn.addEventListener('click', () => { result.dataset.ok = 'hint'; result.textContent = spec.hint; });
    reset.addEventListener('click', () => { controller.reset(); result.textContent = ''; result.dataset.ok = ''; });
  });
}

async function checkIt(page) {
  const root = $('[data-mp-check]', page);
  if (!root) return;
  const { mountCheck } = await import('./check.mjs');
  mountCheck(root, {
    classId: page.dataset.class, grade: page.dataset.grade, chapter: page.dataset.chapter, source: page.dataset.source || page.dataset.chapter, progress,
    onResult: ({ passed }) => { if (passed) unlockNotice(page); },
  });
}

function unlockNotice(page) {
  const slot = $('[data-mp-next]', page);
  if (slot) slot.hidden = false;
}

async function stepWidgets(page) {
  const practice = $('[data-mp-practice]', page);
  const print = $('[data-mp-print]', page);
  const fail = (root, what) => { if (root) root.innerHTML = `<p class="mp-alert" role="alert"><strong>${what} could not load.</strong> Reload the page and try again. If it keeps happening, your browser may be blocking scripts.</p>`; };
  if (practice) {
    import('./practice.mjs').then(({ mountPractice }) => mountPractice(practice, { grade: practice.dataset.grade, chapter: practice.dataset.source }))
      .catch((error) => { fail(practice, 'Practice'); console.error(error); });
  }
  if (print) {
    import('./print.mjs').then(({ mountPrint }) => mountPrint(print, {
      grade: print.dataset.grade, chapter: print.dataset.source, classLabel: print.dataset.classLabel, title: print.dataset.title,
      builderHref: print.dataset.builder, progress, classId: page.dataset.class, chapterId: page.dataset.chapter,
    })).catch((error) => { fail(print, 'The worksheet'); console.error(error); });
    const printed = $('[data-mp-printed]', page);
    const showPrinted = () => { if (printed && !progress.problem && progress.get(page.dataset.class, page.dataset.chapter).printed) printed.hidden = false; };
    showPrinted();
    print.addEventListener('click', (event) => { if (event.target.closest('[data-ws-print]')) showPrinted(); });
  }
}

function chapterPage(page) {
  const specs = JSON.parse(document.getElementById('mp-activities')?.textContent ?? '[]');
  const entry = progress.get(page.dataset.class, page.dataset.chapter);
  const prev = page.dataset.prev;
  if (prev && !progress.get(page.dataset.class, prev).passed) {
    const note = $('[data-mp-prereq]', page);
    if (note) note.hidden = false;
  }
  if (entry.passed) unlockNotice(page);
  seeIt(page);
  if (specs.length) tryIt(page, specs);
  stepWidgets(page);
  checkIt(page).catch((error) => {
    const root = $('[data-mp-check]', page);
    if (root) root.innerHTML = '<p class="mp-alert" role="alert"><strong>The check could not load.</strong> Reload the page and try again. If it keeps happening, your browser may be blocking scripts.</p>';
    console.error(error);
  });
}

document.documentElement.classList.add('mp-js');
const kind = document.body.dataset.mp;
storageBanner();
if (kind === 'hub' || kind === 'class') hubAndClass();
if (kind === 'chapter') chapterPage($('[data-mp-chapter]'));
export { PASS_MARK };
