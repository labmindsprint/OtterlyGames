import { PitSave } from './save.mjs';
import { armAudio, setSound } from './audio.mjs';
import { loadShip } from './ships/index.mjs';
import { esc } from './ui.mjs';
import { needsGuide } from './onboarding.mjs';
import { installPurchaseRecovery } from './purchase-sync.mjs';

const VIEWS = {
  start: ['./views.mjs', 'start'],
  guide: ['./view-onboarding.mjs', 'guide'],
  map: ['./lab.mjs', 'map'],
  pit: ['./views.mjs', 'pit'],
  launch: ['./views.mjs', 'launch'],
  flight: ['./views.mjs', 'flight'],
  roam: ['./views.mjs', 'roam'],
  gear: ['./view-gear.mjs', 'gear'],
  discover: ['./views.mjs', 'discover'],
  skills: ['./views.mjs', 'skills'],
  'mock-intro': ['./views.mjs', 'mockIntro'],
  'mock-result': ['./views.mjs', 'mockResult'],
  'print-test': ['./view-print-test.mjs', 'printTest'],
  'print-result': ['./view-print-test.mjs', 'printResult'],
  look: ['./views.mjs', 'look'],
  grownups: ['./views.mjs', 'grownups'],
  quiz: ['./view-quiz.mjs', 'show'],
};

const root = document.getElementById('pit-root');
const store = new PitSave();
let cleanup = null;
let token = 0;
let toastTimer = 0;
let failed = false;

const app = {
  root,
  state: () => store.state,
  commit: next => store.commit(next),
  reduced() {
    const setting = store.state.settings.reducedMotion;
    return setting ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  toast(message) {
    let node = document.querySelector('.ps-toast');
    if (!node) {
      node = document.createElement('p');
      node.className = 'ps-toast';
      node.setAttribute('role', 'status');
      document.body.append(node);
    }
    node.textContent = message;
    node.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { node.hidden = true; }, 2600);
  },
  fail(error) {
    failed = true;
    cleanup?.();
    cleanup = null;
    root.innerHTML = `<main class="ps-screen ps-error" tabindex="-1" role="alert">
      <h1>Pit Stop needs a moment</h1>
      <p>${esc(error?.message ?? 'Something went wrong.')}</p>
      <button type="button" class="ps-primary" onclick="location.reload()">Reload</button></main>`;
  },
  async go(name, params = {}, { replace = false } = {}) {
    if (failed) return;
    const mine = ++token;
    try {
      const [file, exportName] = VIEWS[name];
      const module = await import(file);
      const active = store.state.activeClass;
      if (active) await loadShip(active);
      if (mine !== token) return;
      cleanup?.();
      cleanup = null;
      window.speechSynthesis?.cancel();
      const entry = { screen: name };
      if (replace || name === 'map' || name === 'start') history.replaceState(entry, '');
      else history.pushState(entry, '');
      const next = await module[exportName](app, params);
      if (mine !== token) { next?.(); return; }
      cleanup = typeof next === 'function' ? next : null;
      window.scrollTo(0, 0);
      document.body.dataset.screen = name;
    } catch (error) {
      if (mine === token) app.fail(error);
    }
  },
};

const home = () => (needsGuide(store.state) ? 'guide' : store.state.activeClass ? 'map' : 'start');

window.addEventListener('popstate', () => {
  if (failed) return;
  app.go(home(), {}, { replace: true });
});

async function boot() {
  try {
    await store.open();
  } catch (error) {
    app.fail(error);
    return;
  }
  if (new URLSearchParams(location.search).get('test') === '1') window.__pitstop = app;
  const params = new URLSearchParams(location.search);
  if (params.get('demo')) await startDemo(params);
  else app.purchases = installPurchaseRecovery(app);
  setSound(store.state.settings.sound !== false);
  armAudio();
  app.go(params.get('demo') === 'gear' ? 'gear' : params.get('demo') === 'roam' ? 'roam' : home(), {}, { replace: true });
}

// A try-out journey held only in memory: a built rocket and every turret and shield, so free roam can be played at once. Nothing is saved.
async function startDemo(params) {
  const [{ CLASSES, classById }, { GEAR_ORDER }, progress] = await Promise.all([import('./data.mjs'), import('./gear.mjs'), import('./progress.mjs')]);
  const classId = CLASSES.some(item => item.id === params.get('class')) ? params.get('class') : 'class-2';
  let demo = progress.blankSave();
  demo.activeClass = classId;
  const state = progress.blankClass();
  for (const part of classById(classId).parts) state.parts[part.id] = { stars: 3, runs: 1, at: new Date().toISOString() };
  state.gear = [...GEAR_ORDER];
  demo.classes[classId] = state;
  for (const id of ['twin-laser', 'scatter-gun', 'mirror-shield']) demo = progress.applyLoadout(demo, classId, id);
  store.state = demo;
  store.commit = async next => { store.state = next; return next; };
  app.toast('Try-out mode: nothing here is saved.');
}

boot();
