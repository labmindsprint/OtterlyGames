// The weld bay on the question page. It is mounted once per mission and stays put: every right answer welds one more
// seam in place (the arms glide to it), every wrong answer sputters and smokes. Only a rectangle around the part shows.
import { classById } from './data.mjs';
import { shipData, shipSVG } from './ships/index.mjs';
import { play } from './audio.mjs';
import { SHIP, armPair, backdrop, H, W } from './arms.mjs';
import { STAGE, fitCrop, framePoints } from './bay-fit.mjs';
import { smokeAt, sparksAt } from './weld.mjs';
import { esc } from './ui.mjs';

const GLIDE_MS = 320;
const WORK_MS = 1100;
const BAD_MS = 900;
const ease = t => t * t * (3 - 2 * t);

export function mountBay(host, { classId, partId, label, built, paint, steps, step = 0, reduced = false }) {
  const info = shipData(classId);
  const part = info.parts.find(item => item.id === partId);
  const joints = part.joints.length ? part.joints : [{ x: 150, y: 210 }];
  const centre = { x: joints.reduce((sum, joint) => sum + joint.x, 0) / joints.length, y: joints.reduce((sum, joint) => sum + joint.y, 0) / joints.length };
  const stagePoint = point => ({ x: SHIP.x + point.x * SHIP.k, y: SHIP.y + point.y * SHIP.k });
  const middle = stagePoint(centre);
  const framed = framePoints([...joints.map(stagePoint), middle]);
  const plateText = current => `WELD ${Math.min(current, steps)} OF ${steps} · ${label.toUpperCase()}`;

  host.innerHTML = `<div class="ps-bay-crop">
      <section class="ps-lab ps-lab--weld ps-lab--bay is-in" aria-hidden="true">
        ${backdrop(classById(classId))}
        <div class="ps-lab-ship">${shipSVG(classId, { built: [...built, partId], paint, ghost: true })}<span class="ps-lab-scan" aria-hidden="true"></span></div>
        <svg class="ps-lab-svg ps-lab-svg--front" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false"><g class="ps-arms"></g></svg>
      </section>
      <p class="ps-bay-plate"></p>
    </div>`;
  const crop = host.querySelector('.ps-bay-crop');
  const world = host.querySelector('.ps-lab');
  const front = host.querySelector('.ps-lab-svg--front');
  const armLayer = front.querySelector('.ps-arms');
  const plate = host.querySelector('.ps-bay-plate');
  const shipSvg = host.querySelector('svg.ps-ship');
  const group = shipSvg.querySelector(`[data-part="${partId}"]`);
  group.classList.remove('ps-ghost');

  // The crop's real size decides the framing, so it is measured now and again whenever the screen changes shape.
  const frame = () => {
    const width = crop.clientWidth;
    const height = crop.clientHeight;
    if (!width || !height) return;
    const fit = fitCrop(framed, { width, height, inset: plate.offsetHeight });
    crop.style.setProperty('--lab', `${(STAGE * fit.scale).toFixed(1)}px`);
    crop.style.setProperty('--ox', `${fit.ox.toFixed(1)}px`);
    crop.style.setProperty('--oy', `${fit.oy.toFixed(1)}px`);
  };
  let watcher = null;

  let current = step;
  let spot = null;
  let raf = 0;
  const timers = [];
  const later = (fn, ms) => { timers.push(window.setTimeout(fn, ms)); };
  const seam = index => joints[(Math.max(index, 1) - 1) % joints.length];
  const drawArms = (focus, working, word) => { armLayer.innerHTML = armPair(part.joints, { focus, working, wordOffset: word }); };
  const progress = () => {
    group.style.opacity = String(0.3 + 0.7 * (current / steps));
    plate.textContent = plateText(current + (current < steps ? 1 : 0));
    host.dataset.welds = String(current);
  };
  const retire = () => { timers.splice(0).forEach(window.clearTimeout); window.cancelAnimationFrame(raf); };

  const glide = (from, to, done) => {
    window.cancelAnimationFrame(raf);
    if (reduced) { done(); return; }
    const start = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - start) / GLIDE_MS);
      const k = ease(t);
      drawArms({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k }, false, 0);
      if (t < 1) raf = window.requestAnimationFrame(tick); else done();
    };
    raf = window.requestAnimationFrame(tick);
  };

  const flash = cls => {
    world.classList.remove(cls);
    void world.offsetWidth;
    world.classList.add(cls);
  };

  const run = (next, effect, working = true) => {
    retire();
    front.classList.add('is-live');
    const from = spot ?? centre;
    play('servo');
    glide(from, next, () => {
      spot = next;
      drawArms(next, working && !reduced, current);
      effect(stagePoint(next));
      later(() => drawArms(next, false, current), WORK_MS);
    });
  };

  const api = {
    // One more seam welded: the part firms up and the arms fuse the next joint.
    weld() {
      current = Math.min(steps, current + 1);
      progress();
      run(seam(current), point => {
        play('weld');
        flash('is-shake');
        if (!reduced) sparksAt(front, point);
      });
    },
    // A wrong answer: the torch sputters on the same seam and smoke curls up; the part does not advance.
    bad() {
      run(seam(current + 1), point => {
        play('badWeld');
        flash('is-shake');
        world.classList.add('is-bad');
        if (!reduced) smokeAt(front, point);
        later(() => world.classList.remove('is-bad'), BAD_MS);
      }, false);
    },
    destroy() { retire(); watcher?.disconnect(); host.innerHTML = ''; },
  };

  drawArms(centre, false, 0);
  spot = centre;
  progress();
  frame();
  if (typeof ResizeObserver === 'function') { watcher = new ResizeObserver(frame); watcher.observe(crop); }
  return api;
}
