import { getGrade } from '../curriculum.mjs';
import { CLASSES, PAINTS, PAPER_QUESTIONS, classById } from './data.mjs';
import { partMission, paperMission, paperSize, trainMission, mockLevel } from './missions.mjs';
import { mountWeld } from './weld.mjs';
import {
  PASS_RATIO, applyActiveClass, applyFlight, applyLook, applyPickup, applySetting, blankSave, builtParts, classState,
  loadoutOf, nextPart, nextPickup, nextSky, proficiency, shipComplete, starsFor, weakest,
} from './progress.mjs';
import { nextAction, mockCost } from './next.mjs';
import { play, setSound } from './audio.mjs';
import { SKY } from './sky.mjs';
import { loadShip, shipSVG } from './ships/index.mjs';
import { ICONS, esc, ringo, stars } from './ui.mjs';
import { applyAdFuel, applySpend, fuelStatus } from './fuel.mjs';
import { sources, watchAd } from './fuel-bridge.mjs';
import * as voice from './tts.mjs';
import { emptyTank, fuelBadge, fuelNote, fuelSection, revealAdButton, wireFuelSection } from './view-fuel.mjs';

export { nextAction };
export const paintColor = (save, classId) => PAINTS.find(item => item.id === classState(save, classId).paint)?.color ?? null;
export const skyArt = (id, cls = '') => `<svg class="ps-sky ${cls}" viewBox="-4 -4 68 68" aria-hidden="true" focusable="false">${SKY[id]?.svg ?? ''}</svg>`;
export const mount = (app, html, name) => {
  app.root.innerHTML = `<main class="ps-screen ps-${name}" tabindex="-1">${html}</main>`;
  app.root.querySelector('.ps-screen').focus({ preventScroll: true });
};
export const chip = (act, icon, label, extra = '') => `<button type="button" class="ps-chip" data-act="${act}" ${extra}>${icon}<span>${label}</span></button>`;
export const soundButton = app => {
  const on = app.state().settings.sound !== false;
  return `<button type="button" class="ps-icon-button" data-act="sound" aria-pressed="${on}" aria-label="${on ? 'Mute sound and music' : 'Turn sound and music on'}">${on ? ICONS.speak : ICONS.mute}</button>`;
};
export const grownupsButton = `<button type="button" class="ps-icon-button" data-act="grownups" aria-label="For grown-ups: purchases, remove ads, settings">${ICONS.lock}</button>`;
export const copyright = `<p class="ps-copy">© ${new Date().getFullYear()} Otterly Games. All rights reserved. Otterly Space Academy is a trademark of Otterly Games.</p>`;
export const listen = (app, handler) => {
  const onClick = async event => {
    const target = event.target.closest('[data-act]');
    if (target?.dataset.act === 'sound') {
      const on = app.state().settings.sound === false;
      setSound(on);
      try { await app.commit(applySetting(app.state(), { sound: on })); } catch (error) { app.fail(error); return; }
      target.setAttribute('aria-pressed', String(on));
      target.setAttribute('aria-label', on ? 'Mute sound and music' : 'Turn sound and music on');
      target.innerHTML = on ? ICONS.speak : ICONS.mute;
      return;
    }
    if (target && !target.disabled) handler(target.dataset.act, target, event);
  };
  app.root.addEventListener('click', onClick);
  return () => app.root.removeEventListener('click', onClick);
};

export function shipPicture(app, classId, options = {}) {
  const save = app.state();
  return shipSVG(classId, { paint: paintColor(save, classId), stickers: classState(save, classId).stickers, ...options });
}

// ---------- class picker ----------
export async function start(app) {
  await Promise.all(CLASSES.map(item => loadShip(item.id)));
  const save = app.state();
  const cards = CLASSES.map(item => {
    const built = builtParts(save, item.id).length;
    const done = shipComplete(save, item.id);
    return `<button type="button" class="ps-class" data-act="pick" data-class="${item.id}" aria-label="${esc(item.label)}: ${esc(item.shipName)}, ${built} of ${item.parts.length} parts built">
      <span class="ps-class-ship">${shipSVG(item.id, { built: 'all', paint: paintColor(save, item.id), stickers: [] })}</span>
      <span class="ps-class-label">${esc(item.label)}</span>
      <span class="ps-class-name">${esc(item.shipName)}</span>
      <span class="ps-class-meta">${done ? 'Ship ready ✓' : built ? `${built}/${item.parts.length} parts` : 'New'}</span>
    </button>`;
  }).join('');
  mount(app, `<header class="ps-head">
      ${save.activeClass ? chip('map', ICONS.back, 'Back to map') : '<a class="ps-chip" href="/play/">Otterly Games</a>'}
      <h1>Otterly Space Academy</h1>
      <div class="ps-head-tools">${soundButton(app)}</div>
    </header>
    <p class="ps-lead">${ringo(46, 'cheer')}<span>Pick your class. Every class builds a different ship!</span></p>
    <div class="ps-classes">${cards}</div>
    <footer class="ps-foot"><button type="button" class="ps-link" data-act="grownups">For grown-ups</button>${copyright}</footer>`, 'start');
  return listen(app, async (act, target) => {
    if (act === 'map') app.go('map');
    if (act === 'grownups') app.go('grownups');
    if (act === 'pick') {
      try {
        await app.commit(applyActiveClass(app.state(), target.dataset.class));
        app.go('map');
      } catch (error) { app.fail(error); }
    }
  });
}

// ---------- pit stop: build and weld ----------

export async function pit(app, params = {}) {
  const save = app.state();
  const classId = save.activeClass;
  const info = classById(classId);
  await loadShip(classId);
  let weld = null;

  if (params.mode === 'weld') {
    const part = info.parts.find(item => item.id === params.partId);
    const action = nextAction(save, classId);
    const built = builtParts(save, classId).filter(id => id !== part.id);
    mount(app, `<header class="ps-head"><h1>${esc(part.label)}</h1></header>
      <div class="ps-weld-host" data-weld></div>
      <section class="ps-result" hidden>
        <p class="ps-result-line">${ringo(44, 'cheer')}<span>${params.right} of ${params.total} right first time.</span></p>
        ${stars(params.stars)}
      </section>
      <footer class="ps-cta" hidden><p>${esc(action.sub)}</p><button type="button" class="ps-primary ps-primary--big" data-act="go">${esc(action.label)}</button></footer>`, 'weld');
    weld = mountWeld(app.root.querySelector('[data-weld]'), {
      classId, partId: part.id, label: part.label, built, paint: paintColor(save, classId),
      mode: 'finale', reduced: app.reduced(), steps: params.total, step: params.total,
      onDone: () => {
        app.root.querySelector('.ps-result').hidden = false;
        app.root.querySelector('.ps-cta').hidden = false;
        play('stars');
        app.root.querySelector('.ps-primary')?.focus({ preventScroll: true });
      },
    });
    const off = listen(app, act => { if (act === 'go') app.go(action.view, action.params); });
    return () => { weld.destroy(); off(); };
  }

  const part = info.parts.find(item => item.id === params.partId) ?? nextPart(save, classId);
  const number = info.parts.indexOf(part) + 1;
  const replay = Boolean(save.classes[classId]?.parts[part.id]);
  const retry = params.mode === 'retry';
  const need = Math.ceil(params.total * PASS_RATIO);
  mount(app, `<header class="ps-head">${chip('map', ICONS.back, 'Back to map')}<h1>Pit Stop</h1></header>
    <section class="ps-stage">${shipPicture(app, classId, { built: builtParts(save, classId), ghost: true })}</section>
    <section class="ps-brief"><p class="ps-kicker">Part ${number} of ${info.parts.length}</p><h2>${esc(part.label)}</h2>${retry
    ? `<p class="ps-try-again">${ringo(44, 'think')}<span>Not welded yet! You got ${params.right} of ${params.total} right first time. Get ${need} right to weld this part. Try again!</span></p>`
    : `<p>${esc(part.topic)} · every right answer is a weld${replay ? ' · play again to earn more stars' : ''}</p>`}</section>
    <footer class="ps-cta"><button type="button" class="ps-primary ps-primary--big" data-act="start">${retry ? 'Try again' : 'Start'}</button>${retry ? `<button type="button" class="ps-link" data-act="skills">Practise skills first</button>` : ''}</footer>`, 'pit');
  app.root.querySelector(`[data-part="${part.id}"]`)?.classList.add('is-next');
  return listen(app, act => {
    if (act === 'map') app.go('map');
    if (act === 'skills') app.go('skills');
    if (act === 'start') {
      const runs = save.classes[classId]?.parts[part.id]?.runs ?? 0;
      app.go('quiz', { mission: partMission(classId, part.id, { runs }) });
    }
  });
}

// ---------- flight and discovery ----------
export async function flight(app, { objectId }) {
  const save = app.state();
  const classId = save.activeClass;
  await loadShip(classId);
  const { STICKER_ART } = await import('./stickers.mjs');
  const { mountFlight } = await import('./flight.mjs');
  app.root.innerHTML = '<div class="ps-screen ps-flightscreen"></div>';
  const host = app.root.firstElementChild;
  const running = mountFlight(host, {
    classId, objectId, paint: paintColor(save, classId), stickers: classState(save, classId).stickers, stickerArt: STICKER_ART,
    reducedMotion: app.reduced(),
    onArrive: async () => {
      try {
        await app.commit(applyFlight(app.state(), classId, objectId));
        app.go('discover', { objectId });
      } catch (error) { app.fail(error); }
    },
    onExit: () => app.go('map'),
  });
  return () => running.destroy();
}

export function discover(app, { objectId }) {
  const save = app.state();
  const classId = save.activeClass;
  const action = nextAction(save, classId);
  const item = SKY[objectId];
  const number = classById(classId).sky.indexOf(objectId) + 1;
  mount(app, `<header class="ps-head"><h1>You found it!</h1></header>
    <section class="ps-discovery">
      <div class="ps-discovery-art">${skyArt(objectId, 'ps-sky--big')}</div>
      <h2>${esc(item.name)}</h2>
      <p class="ps-fact">${ringo(44, 'cheer')}<span>${esc(item.fact)}</span></p>
      <p class="ps-kicker">${number} of ${classById(classId).sky.length} found</p>
    </section>
    <footer class="ps-cta"><p>${esc(action.sub)}</p><button type="button" class="ps-primary ps-primary--big" data-act="go">${esc(action.label)}</button>${chip('roam', ICONS.ship, 'Free roam: find schematics (free)')}<button type="button" class="ps-link" data-act="map">Back to map</button></footer>`, 'discover');
  play('arrive');
  return listen(app, act => {
    if (act === 'go') app.go(action.view, action.params);
    if (act === 'map') app.go('map');
    if (act === 'roam') app.go('roam');
  });
}

// Free roam: an open sky with enemies to zap and schematics (gear, stickers, paint) to collect. A Print test prints them.
export async function roam(app) {
  const save = app.state();
  const classId = save.activeClass;
  await loadShip(classId);
  const [{ STICKER_ART }, { mountFlight }] = await Promise.all([import('./stickers.mjs'), import('./flight.mjs')]);
  app.root.innerHTML = '<div class="ps-screen ps-flightscreen"></div>';
  const host = app.root.firstElementChild;
  let pending = 0;
  let chain = Promise.resolve();
  const getReward = () => nextPickup(app.state(), classId, pending);
  // The save is written in order behind the scenes; the game never waits for it.
  const takeReward = () => {
    const reward = getReward();
    if (!reward) return null;
    pending += 1;
    chain = chain.then(() => app.commit(applyPickup(app.state(), classId))).catch(error => app.fail(error)).finally(() => { pending -= 1; });
    return reward;
  };
  const running = mountFlight(host, {
    classId, objectId: null, mode: 'roam', paint: paintColor(save, classId), stickers: classState(save, classId).stickers, stickerArt: STICKER_ART,
    reducedMotion: app.reduced(), loadout: loadoutOf(save, classId), getReward, takeReward,
    onExit: () => app.go('map'),
  });
  return () => running.destroy();
}

// ---------- skills ----------
export function skills(app, params = {}) {
  const save = app.state();
  const classId = save.activeClass;
  const info = classById(classId);
  const rows = proficiency(save, classId, getGrade(classId).chapters);
  const focus = weakest(rows);
  const bar = row => `<span class="ps-level" aria-hidden="true">${[0, 1, 2, 3].map(step => `<i class="${row.index >= step ? 'is-on' : ''}"></i>`).join('')}</span>`;
  const list = rows.map(row => `<li><button type="button" class="ps-skill ${focus?.chapter === row.chapter ? 'is-focus' : ''}" data-act="train" data-chapter="${row.chapter}" data-level="${Math.max(1, Math.min(3, row.index + 1))}" aria-label="${esc(row.title)}: ${row.name}. Tap to train.">
      <span class="ps-skill-title">${esc(row.title)}</span>${bar(row)}<span class="ps-skill-name">${row.name}</span></button></li>`).join('');
  mount(app, `<header class="ps-head">${chip('map', ICONS.back, 'Back to map')}<h1>My skills</h1></header>
    ${params.trained ? `<p class="ps-banner" role="status">${ringo(40, 'cheer')}<span>Training done! ${params.trained.right} of ${params.trained.total} right first time.</span></p>` : ''}
    <p class="ps-lead">${esc(info.label)} · tap a skill to train it.</p>
    <ul class="ps-skills">${list}</ul>
    <footer class="ps-cta">${focus
      ? `<p>Your best chance to grow: ${esc(focus.title)}.</p><button type="button" class="ps-primary ps-primary--big" data-act="train" data-chapter="${focus.chapter}" data-level="${Math.max(1, Math.min(3, focus.index + 1))}">Train ${esc(focus.title)}</button>`
      : `<p>Build parts to see your skills grow.</p><button type="button" class="ps-chip" data-act="map">Back to map</button>`}</footer>`, 'skills');
  return listen(app, (act, target) => {
    if (act === 'map') app.go('map');
    if (act === 'train') app.go('quiz', { mission: trainMission(classId, target.dataset.chapter, Number(target.dataset.level)) });
  });
}

// ---------- mock tests and launch ----------
export function mockIntro(app) {
  const save = app.state();
  const classId = save.activeClass;
  const info = classById(classId);
  const state = classState(save, classId);
  const action = nextAction(save, classId);
  if (action.step === 'build' || action.step === 'fly') { app.go('map'); return null; }
  const flown = Object.keys(state.flown).length;
  const size = paperSize(classId);
  const practice = action.step === 'practice';
  const pre = size !== PAPER_QUESTIONS;
  const target = nextSky(save, classId);
  const fuel = fuelStatus(save, classId);
  const cost = mockCost(save, classId);
  mount(app, `<header class="ps-head">${chip('map', ICONS.back, 'Back to map')}<h1>Mock test</h1>${fuelBadge(fuel)}</header>
    <section class="ps-brief ps-brief--mock">
      <p class="ps-kicker">${practice ? 'Practice' : `Mock test ${flown + 1} of ${info.sky.length}`}</p>
      <div class="ps-mock-target">${target ? `<span class="ps-plan-art"><b aria-hidden="true">?</b></span>` : skyArt(info.sky[info.sky.length - 1])}</div>
      <h2>${size} ${pre ? 'picture ' : ''}questions · every chapter</h2>
      <p class="ps-fact">${ringo(48, 'cheer')}<span>${practice
        ? 'You found every object! Mock tests are practice now.'
        : 'Finish this mock test to launch to the next object in space.'}</span></p>
    </section>
    <footer class="ps-cta"><p>${state.paperBest ? `Best score ${state.paperBest}/${size}` : 'Stickers, paint and gear come from schematics found in free roam.'}</p>
      ${fuel.canStart
        ? `<p class="ps-fuel-note">${esc(fuelNote(fuel))}</p><button type="button" class="ps-primary ps-primary--big" data-act="start">Start mock test · ${esc(cost.button)}</button>`
        : emptyTank(fuel)}</footer>`, 'mock');
  if (!fuel.canStart) revealAdButton(app.root, fuel);
  let busy = false;
  return listen(app, async act => {
    if (act === 'map') app.go('map');
    if (act === 'practise') { app.go('pit', { partId: builtParts(save, classId)[0] ?? info.parts[0].id }); return; }
    if (act === 'grown') app.go('grownups');
    if (busy) return;
    busy = true;
    try {
      if (act === 'start') {
        // Fuel burns when the mock test starts, so leaving halfway does not give it back.
        await app.commit(applySpend(app.state(), classId));
        app.go('quiz', { mission: paperMission(classId, mockLevel(classId, flown)) });
      } else if (act === 'ad') {
        if (await watchAd()) {
          await app.commit(applyAdFuel(app.state()));
          app.go('mock-intro', {}, { replace: true });
        } else app.toast('Watch the whole ad to earn fuel.');
      }
    } catch (error) { app.toast(error.message); } finally { busy = false; }
  });
}

// A mock test only unlocks the launch: score, stars, the object it unlocked and the Launch button. Nothing is printed or won here.
export async function mockResult(app, { right, total }) {
  const save = app.state();
  const classId = save.activeClass;
  const action = nextAction(save, classId);
  const unlocked = action.step === 'fly';
  const info = classById(classId);
  await loadShip(classId);
  const { STICKER_ART } = await import('./stickers.mjs');
  mount(app, `<header class="ps-head"><h1>Mock test done!</h1></header>
    <section class="ps-stage ps-stage--short">${shipPicture(app, classId, { stickerArt: STICKER_ART })}</section>
    <section class="ps-result">
      <p class="ps-result-line">${ringo(44, 'cheer')}<span>${right} of ${total} right first time.</span></p>
      ${stars(starsFor(right, total))}
      ${unlocked ? `<p class="ps-gain ps-gain--sky"><span class="ps-gain-icon">${skyArt(action.params.objectId)}</span><span><b>Unlocked: ${esc(SKY[action.params.objectId].name)}</b><small>Mock test ${info.sky.indexOf(action.params.objectId) + 1} of ${info.sky.length} · ready to visit!</small></span></p>` : ''}
    </section>
    <footer class="ps-cta"><p>${esc(action.sub)}</p>
      <button type="button" class="ps-primary ps-primary--big" data-act="go">${esc(unlocked ? action.label : 'Back to map')}</button></footer>`, 'mock-result');
  play(unlocked ? 'stars' : 'tap');
  return listen(app, act => {
    if (act === 'go') app.go(unlocked ? action.view : 'map', unlocked ? action.params : {});
  });
}

// Countdown on the pad, then lift-off straight into the flight.
export async function launch(app, { objectId }) {
  const save = app.state();
  const classId = save.activeClass;
  await loadShip(classId);
  const { STICKER_ART } = await import('./stickers.mjs');
  const reduced = app.reduced();
  mount(app, `<header class="ps-head">${chip('map', ICONS.back, 'Back to map')}<h1>Launch pad</h1></header>
    <section class="ps-launch" data-launch>
      <div class="ps-launch-sky" aria-hidden="true"></div>
      <div class="ps-launch-ship">${shipPicture(app, classId, { stickerArt: STICKER_ART })}<div class="ps-launch-flame" aria-hidden="true"></div></div>
      <div class="ps-launch-pad" aria-hidden="true"><i></i><i></i></div>
      <p class="ps-launch-count" role="status" aria-live="assertive">Ready</p>
    </section>
    <footer class="ps-cta"><button type="button" class="ps-chip ps-launch-skip" data-act="skip">Skip countdown</button></footer>`, 'launch');
  const stage = app.root.querySelector('[data-launch]');
  const label = app.root.querySelector('.ps-launch-count');
  const timers = [];
  let gone = false;
  const at = (fn, ms) => timers.push(window.setTimeout(fn, ms));
  const fly = () => { if (!gone) { gone = true; app.go('flight', { objectId }); } };
  const tick = (text, final = false) => {
    label.textContent = text;
    label.classList.remove('is-tick');
    void label.offsetWidth;
    label.classList.add('is-tick');
    play('count', final);
  };
  if (reduced) {
    label.textContent = 'Lift off!';
    play('launch');
    at(fly, 700);
  } else {
    [['3', 500], ['2', 1400], ['1', 2300]].forEach(([text, ms]) => at(() => { stage.classList.add('is-shake'); tick(text); }, ms));
    at(() => { tick('LIFT OFF!', true); play('launch'); stage.classList.add('is-lift'); }, 3200);
    at(fly, 5200);
  }
  const off = listen(app, act => {
    if (act === 'map') app.go('map');
    if (act === 'skip') fly();
  });
  return () => { gone = true; timers.forEach(window.clearTimeout); off(); };
}

// ---------- look: paint and stickers ----------
export async function look(app) {
  const save = app.state();
  const classId = save.activeClass;
  await loadShip(classId);
  const { STICKER_ART } = await import('./stickers.mjs');
  const { mountCustomizer } = await import('./print.mjs');
  const { printBar } = await import('./view-print-test.mjs');
  const { lockHint } = await import('./schematics.mjs');
  const state = classState(save, classId);
  const shipDone = shipComplete(save, classId);
  app.root.innerHTML = `<main class="ps-screen ps-look" tabindex="-1"><header class="ps-head">${chip('map', ICONS.back, 'Back to map')}<h1>My ship look</h1></header>${printBar(save, classId)}<div class="ps-look-host"></div></main>`;
  const host = app.root.querySelector('.ps-look-host');
  let pending = null;
  let queue = Promise.resolve();
  const save$ = () => {
    if (!pending) return queue;
    const change = pending;
    pending = null;
    queue = queue.then(() => app.commit(applyLook(app.state(), classId, change))).catch(error => app.fail(error));
    return queue;
  };
  const running = mountCustomizer(host, {
    classId, paint: state.paint, stickers: state.stickers, stickerArt: STICKER_ART,
    unlockedPaints: state.paints, unlockedStickers: state.unlockedStickers,
    lockHint: (kind, id) => lockHint(state, { kind, id }, shipDone),
    onChange: change => { pending = change; save$(); },
    onDone: async () => { await save$(); app.go('map'); },
  });
  const off = listen(app, async act => {
    if (act === 'map') { await save$(); app.go('map'); }
    if (act === 'print') { await save$(); app.go('print-test'); }
  });
  return () => { running.destroy(); off(); };
}

// ---------- grown-ups ----------
export function grownups(app) {
  const save = app.state();
  mount(app, `<header class="ps-head">${chip('back', ICONS.back, 'Back to map')}<h1>For grown-ups</h1></header>
    <section class="ps-gate" data-gate>
      <p>Press and hold the button for two seconds.</p>
      <button type="button" class="ps-primary" data-hold>Hold to open</button>
    </section>
    <section class="ps-grown" data-panel hidden>
      <p>${sources().native
        ? 'Progress is saved only on this device. Your answers and progress are not sent to Otterly Games. Optional rewarded ads and purchases are handled by Google (AdMob and Google Play), which receive the technical details they need to work. See our privacy page.'
        : 'Progress is saved only on this device, in this browser. Clearing site data or private browsing removes it. Your answers and progress are not sent to Otterly Games, and this website shows no ads.'}</p>
      <p>Questions follow Olympiad-style chapters for each class. The Skills page shows where a child needs more practice.</p>
      <label class="ps-toggle"><input type="checkbox" data-motion ${app.reduced() ? 'checked' : ''}> Reduce motion</label>
      <label class="ps-toggle"><input type="checkbox" data-sound ${save.settings.sound !== false ? 'checked' : ''}> Sound and music</label>
      ${voice.isSupported() ? `<label class="ps-toggle"><input type="checkbox" data-voice ${voice.isEnabled(voice.defaultOn(save.activeClass)) ? 'checked' : ''}> Read questions aloud</label>` : ''}
      <p><button type="button" class="ps-chip" data-act="guide">${ICONS.bulb}<span>How to play</span></button> <a class="ps-chip" href="/learn/">Lessons for practice</a></p>
      ${fuelSection()}
      <button type="button" class="ps-chip ps-chip--danger" data-act="reset">Reset all progress</button>
      ${copyright}
    </section>`, 'grownups');
  let unwire = () => {};
  wireFuelSection(app).then(stop => { unwire = stop; }, error => app.fail(error));
  const gate = app.root.querySelector('[data-hold]');
  let hold = 0;
  const open = () => { app.root.querySelector('[data-gate]').hidden = true; app.root.querySelector('[data-panel]').hidden = false; };
  const begin = () => { window.clearTimeout(hold); gate.classList.add('is-holding'); hold = window.setTimeout(open, 2000); };
  const end = () => { window.clearTimeout(hold); gate.classList.remove('is-holding'); };
  gate.addEventListener('pointerdown', begin);
  for (const name of ['pointerup', 'pointerleave', 'pointercancel']) gate.addEventListener(name, end);
  gate.addEventListener('keydown', event => { if (event.key === ' ' || event.key === 'Enter') begin(); });
  gate.addEventListener('keyup', end);
  const motion = app.root.querySelector('[data-motion]');
  motion.addEventListener('change', async () => {
    try { await app.commit(applySetting(app.state(), { reducedMotion: motion.checked })); } catch (error) { app.fail(error); }
  });
  const sound = app.root.querySelector('[data-sound]');
  app.root.querySelector('[data-voice]')?.addEventListener('change', event => voice.setEnabled(event.target.checked));
  sound.addEventListener('change', async () => {
    setSound(sound.checked);
    try { await app.commit(applySetting(app.state(), { sound: sound.checked })); } catch (error) { app.fail(error); }
  });
  const off = listen(app, async act => {
    if (act === 'back') app.go(app.state().activeClass ? 'map' : 'start');
    if (act === 'guide') app.go('guide', { replay: true });
    if (act === 'reset' && window.confirm('Reset every ship, star and skill on this device?')) {
      try {
        // Resetting progress must not refill the tank or drop a purchase.
        const { fuel, premium } = app.state();
        await app.commit({ ...blankSave(), settings: { ...blankSave().settings, guideSeen: true }, ...(fuel ? { fuel } : {}), ...(premium ? { premium } : {}), revision: app.state().revision + 1 });
        app.go('start');
      } catch (error) { app.fail(error); }
    }
  });
  return () => { end(); off(); unwire(); };
}
