// First-run comic guide: welcome, pick a class, how the game works. Also replayed from the map and the grown-ups page.
import { CLASSES, classById } from './data.mjs';
import { loadShip, shipSVG } from './ships/index.mjs';
import { SKY } from './sky.mjs';
import { gearIcon } from './gear.mjs';
import { STICKER_IDS, stickerSVG } from './stickers.mjs';
import { ICONS, esc, ringo } from './ui.mjs';
import { CLASS_AGES, PANELS, STEPS, chooseClass, finishGuide } from './onboarding.mjs';

const PRINTER = `<svg class="psg-printer" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
  <path d="M18 24V8h28v16" fill="#fff" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/><path d="M24 14h16M24 19h10" stroke="#4a8fe0" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="7" y="24" width="50" height="22" rx="6" fill="#d9d6cf" stroke="#2b2b2b" stroke-width="3"/><circle cx="48" cy="33" r="3" fill="#ff6a28" stroke="#2b2b2b" stroke-width="1.5"/>
  <path d="M17 41h30v16H17Z" fill="#fff" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/><path d="M23 48h18M23 53h11" stroke="#4a8fe0" stroke-width="2.5" stroke-linecap="round"/></svg>`;

const PANEL_NAMES = { welcome: 'Welcome', class: 'Pick your class', how: 'How it works' };

function stepArt(art, classId) {
  const info = classById(classId);
  if (art === 'build') return `<span class="psg-ship">${shipSVG(classId, { built: info.parts.slice(0, 2).map(item => item.id), ghost: true })}</span>`;
  if (art === 'launch') return `<svg class="psg-sky" viewBox="-4 -4 68 68" aria-hidden="true" focusable="false">${SKY[info.sky[0]]?.svg ?? ''}</svg>`;
  if (art === 'roam') return `<span class="psg-duo">${gearIcon('twin-laser')}${stickerSVG(STICKER_IDS[0], 36)}</span>`;
  return PRINTER;
}

const pill = cost => `<span class="psg-pill ${cost === 'Free' ? 'is-free' : 'is-fuel'}">${cost === 'Free' ? '' : ICONS.fuel}${esc(cost)}</span>`;

function welcomePanel(classId) {
  return `<section class="psg-panel psg-panel--welcome" aria-labelledby="psg-title">
    <div class="psg-scene"><span class="psg-ship psg-ship--hero">${shipSVG(classId, { built: 'all' })}</span></div>
    <div class="psg-say">${ringo(84, 'cheer')}
      <div class="psg-bubble"><h1 id="psg-title" tabindex="-1" data-focus>Welcome to Otterly Space Academy!</h1><p>Build a rocket by solving puzzles.</p></div></div>
  </section>`;
}

function classPanel(active, replay) {
  const cards = CLASSES.map(item => `<li><button type="button" class="psg-card${item.id === active ? ' is-picked' : ''}" data-class="${item.id}" aria-pressed="${item.id === active}">
      <span class="psg-card-ship">${shipSVG(item.id, { built: 'all' })}</span>
      <span class="psg-card-text"><b>${esc(item.label)}</b><span>${esc(item.shipName)}</span><small>${esc(CLASS_AGES[item.id])}</small></span>
      <span class="psg-card-check" aria-hidden="true">✓</span></button></li>`).join('');
  return `<section class="psg-panel psg-panel--class" aria-labelledby="psg-title">
    <div class="psg-say psg-say--small">${ringo(52, 'happy')}
      <div class="psg-bubble"><h1 id="psg-title" tabindex="-1" data-focus>${replay ? 'Change your class?' : 'Pick your class'}</h1><p>Every class builds a different rocket. You can change class any time.</p></div></div>
    <ul class="psg-cards">${cards}</ul>
  </section>`;
}

function howPanel(classId) {
  const steps = STEPS.map((step, index) => `<li class="psg-step psg-step--${step.id}">
      <span class="psg-no" aria-hidden="true">${index + 1}</span>
      <span class="psg-step-art">${stepArt(step.art, classId)}</span>
      <span class="psg-step-text"><span class="psg-step-head"><b>${esc(step.title)}</b>${pill(step.cost)}</span><span class="psg-step-body">${esc(step.body)}</span></span>
    </li>`).join('');
  return `<section class="psg-panel psg-panel--how" aria-labelledby="psg-title">
    <div class="psg-say psg-say--small">${ringo(52, 'happy')}
      <div class="psg-bubble"><h1 id="psg-title" tabindex="-1" data-focus>How it works</h1></div></div>
    <ol class="psg-steps">${steps}</ol>
    <p class="psg-free">Building, practice, roaming and flying never cost fuel.</p>
  </section>`;
}

export async function guide(app, params = {}) {
  await Promise.all(CLASSES.map(item => loadShip(item.id)));
  const replay = Boolean(params.replay) && Boolean(app.state().activeClass);
  let index = replay ? 2 : 0;
  let busy = false;
  let pending = Promise.resolve();
  const active = () => app.state().activeClass;
  const art = () => active() ?? app.state().settings.preferredClass ?? 'class-1';

  app.root.innerHTML = `<main class="ps-screen ps-guide${app.reduced() ? ' is-reduced' : ''}" tabindex="-1" aria-label="How to play">
    <header class="psg-top"><ol class="psg-dots" aria-label="Guide progress">${PANELS.map(() => '<li></li>').join('')}</ol>
      <button type="button" class="ps-chip psg-skip" data-g="skip">${replay ? 'Close' : 'Skip'}</button></header>
    <div class="psg-stage" data-stage></div>
    <nav class="psg-nav" aria-label="Guide steps"><button type="button" class="ps-chip psg-back" data-g="back">${ICONS.back}<span>Back</span></button>
      <button type="button" class="ps-primary psg-next" data-g="next">Next</button></nav>
    <p class="psg-sr" role="status" aria-live="polite" data-live></p>
  </main>`;
  const screen = app.root.querySelector('.ps-guide');
  const stage = screen.querySelector('[data-stage]');
  const next = screen.querySelector('[data-g="next"]');
  const back = screen.querySelector('[data-g="back"]');
  const skip = screen.querySelector('[data-g="skip"]');
  const live = screen.querySelector('[data-live]');

  const render = (focus = true) => {
    const panel = PANELS[index];
    stage.innerHTML = panel === 'welcome' ? welcomePanel(art()) : panel === 'class' ? classPanel(active(), replay) : howPanel(art());
    stage.scrollTop = 0;
    screen.dataset.panel = panel;
    screen.querySelectorAll('.psg-dots li').forEach((dot, position) => {
      dot.className = position < index ? 'is-done' : position === index ? 'is-now' : '';
      if (position === index) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current');
      dot.textContent = '';
      if (position === index) dot.insertAdjacentHTML('beforeend', `<span class="psg-sr">Step ${index + 1} of ${PANELS.length}: ${PANEL_NAMES[panel]}</span>`);
    });
    const needClass = panel === 'class' && !active();
    back.style.visibility = index === 0 ? 'hidden' : 'visible';
    next.disabled = needClass;
    next.textContent = index === PANELS.length - 1 ? (replay ? 'Back to the map' : "Let's build!") : 'Next';
    skip.hidden = needClass;
    if (focus) stage.querySelector('[data-focus]')?.focus({ preventScroll: true });
  };

  const go = target => {
    if (target < 0 || target >= PANELS.length) return;
    index = target;
    render();
  };

  const finish = async () => {
    if (busy) return;
    busy = true;
    try {
      const done = finishGuide(app.state());
      if (done !== app.state()) await app.commit(done);
      app.go(active() ? 'map' : 'start');
    } catch (error) { busy = false; app.fail(error); }
  };

  const onSkip = async () => {
    await pending;
    if (!active()) go(1);
    else finish();
  };

  const onNext = async () => {
    if (next.disabled) return;
    await pending;
    if (index === PANELS.length - 1) finish(); else go(index + 1);
  };

  const pick = classId => {
    if (busy) return;
    pending = pending.then(async () => {
      try {
        const done = chooseClass(app.state(), classId);
        if (done !== app.state()) await app.commit(done);
      } catch (error) { app.fail(error); return; }
      stage.querySelectorAll('.psg-card').forEach(card => {
        const on = card.dataset.class === classId;
        card.classList.toggle('is-picked', on);
        card.setAttribute('aria-pressed', String(on));
      });
      next.disabled = false;
      skip.hidden = false;
      live.textContent = `${classById(classId).label} picked. ${classById(classId).shipName}.`;
    });
  };

  const onClick = event => {
    const card = event.target.closest('[data-class]');
    if (card) { pick(card.dataset.class); return; }
    const button = event.target.closest('[data-g]');
    if (!button || button.disabled) return;
    if (button.dataset.g === 'next') onNext();
    if (button.dataset.g === 'back') go(index - 1);
    if (button.dataset.g === 'skip') onSkip();
  };

  const onKey = event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); onNext(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1); }
    else if (event.key === 'Escape' && !skip.hidden) { event.preventDefault(); onSkip(); }
  };

  screen.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  render();
  return () => { screen.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
}
