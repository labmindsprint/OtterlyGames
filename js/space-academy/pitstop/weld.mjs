// Weld scenes: robot arms swing in over the ship, the torch flares, sparks fly and a comic word pops.
// 'beat' is the short scene after every correct answer; 'finale' is the big "part complete" scene.
import { classById } from './data.mjs';
import { shipData, shipSVG } from './ships/index.mjs';
import { play } from './audio.mjs';
import { armPair, backdrop, H, W } from './arms.mjs';
import { burst, esc } from './ui.mjs';

const BEAT_MS = 1300;
const rand = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7);

// A failed weld: a few weak sparks and thick dark smoke curling up from the seam.
export function smokeAt(svg, joint) {
  const ns = 'http://www.w3.org/2000/svg';
  const fx = document.createElementNS(ns, 'g');
  fx.setAttribute('class', 'ps-fx');
  svg.append(fx);
  const make = (attrs, keyframes, options) => {
    const node = document.createElementNS(ns, 'circle');
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    node.style.transformOrigin = `${attrs.cx}px ${attrs.cy}px`;
    fx.append(node);
    node.animate(keyframes, options);
  };
  for (let index = 0; index < 6; index += 1) {
    const x = joint.x + (index - 2.5) * 6;
    const rise = -46 - rand() * 36;
    make({ cx: x, cy: joint.y - 2, r: 8 + rand() * 4, fill: index % 2 ? '#5b5b63' : '#3d3d44', stroke: '#2b2b2b', 'stroke-width': 2.4 },
      [{ transform: 'translate(0,0) scale(.4)', opacity: 0.95 }, { transform: `translate(${(rand() - 0.5) * 30}px,${rise}px) scale(2.1)`, opacity: 0 }],
      { duration: 1500 + rand() * 500, delay: index * 90, easing: 'ease-out', fill: 'backwards' });
  }
  for (let index = 0; index < 4; index += 1) {
    const angle = -Math.PI / 2 + (rand() - 0.5) * 2.2;
    make({ cx: joint.x, cy: joint.y, r: 2.6, fill: '#ff6a28', stroke: '#2b2b2b', 'stroke-width': 1.2 },
      [{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${Math.cos(angle) * 18}px,${Math.sin(angle) * 18 + 10}px)`, opacity: 0 }],
      { duration: 420, easing: 'ease-out' });
  }
  const word = document.createElementNS(ns, 'text');
  word.setAttribute('x', String(Math.max(52, Math.min(W - 52, joint.x))));
  word.setAttribute('y', String(Math.max(34, joint.y - 40)));
  word.setAttribute('text-anchor', 'middle');
  word.setAttribute('class', 'ps-lab-word ps-lab-word--bad');
  word.textContent = 'PFFFT!';
  word.style.animation = 'ps-word 1.6s ease-out both';
  fx.append(word);
  window.setTimeout(() => fx.remove(), 2400);
}

export function sparksAt(svg, joint) {
  const ns = 'http://www.w3.org/2000/svg';
  const fx = document.createElementNS(ns, 'g');
  fx.setAttribute('class', 'ps-fx');
  svg.append(fx);
  const make = (tag, attrs) => {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    fx.append(node);
    return node;
  };
  const flash = make('circle', { cx: joint.x, cy: joint.y, r: 16, fill: '#ffd166', stroke: '#2b2b2b', 'stroke-width': 3, opacity: 0 });
  flash.style.transformOrigin = `${joint.x}px ${joint.y}px`;
  flash.animate([{ opacity: 0.95, transform: 'scale(0.2)' }, { opacity: 0, transform: 'scale(1.5)' }], { duration: 520, easing: 'ease-out' });
  for (let index = 0; index < 9; index += 1) {
    const angle = (index / 9) * Math.PI * 2 + rand();
    const spark = make('circle', { cx: joint.x, cy: joint.y, r: 3.2, fill: index % 2 ? '#ff6a28' : '#ffd166', stroke: '#2b2b2b', 'stroke-width': 1.4 });
    const length = 28 + rand() * 26;
    spark.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${Math.cos(angle) * length}px,${Math.sin(angle) * length - 8}px)`, opacity: 0 }], { duration: 640 + rand() * 260, easing: 'cubic-bezier(.2,.7,.4,1)' });
  }
  for (let index = 0; index < 3; index += 1) {
    const x = joint.x + (index - 1) * 8;
    const puff = make('circle', { cx: x, cy: joint.y - 4, r: 7, fill: '#fffdf8', stroke: '#8a8780', 'stroke-width': 2.4 });
    puff.style.transformOrigin = `${x}px ${joint.y - 4}px`;
    puff.animate([{ transform: 'translateY(0) scale(0.5)', opacity: 0.9 }, { transform: `translateY(${-34 - index * 12}px) scale(1.8)`, opacity: 0 }], { duration: 1300, delay: 160 + index * 120, easing: 'ease-out', fill: 'backwards' });
  }
  window.setTimeout(() => fx.remove(), 2000);
}

export function mountWeld(host, { classId, partId, label, built, paint, step = 1, steps = 1, mode = 'beat', reduced = false, wordOffset = 0, onDone = () => {} }) {
  const info = shipData(classId);
  const part = info.parts.find(item => item.id === partId);
  const finale = mode === 'finale';
  const idle = mode === 'idle';
  const joints = part.joints.length ? part.joints : [{ x: 150, y: 210 }];
  const focus = finale || idle ? null : joints[(step - 1) % joints.length];
  const plate = finale ? `PART WELDED · ${label.toUpperCase()}` : `WELD ${step} OF ${steps} · ${label.toUpperCase()}`;
  host.innerHTML = `<section class="ps-lab ps-lab--weld ps-lab--${mode}" aria-label="${esc(plate.toLowerCase())}">
      ${backdrop(classById(classId))}
      <div class="ps-lab-ship">${shipSVG(classId, { built: [...built, partId], paint, ghost: true })}<span class="ps-lab-scan" aria-hidden="true"></span></div>
      <svg class="ps-lab-svg ps-lab-svg--front" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${armPair(part.joints, { focus, wordOffset: wordOffset + step })}</svg>
      <p class="ps-lab-plate">${esc(plate)}</p>
      ${finale ? `<div class="ps-weld-burst" hidden>${burst('WELDED!')}</div>` : ''}
    </section>`;
  const stage = host.querySelector('.ps-lab');
  const svg = host.querySelector('svg.ps-ship');
  const group = svg.querySelector(`[data-part="${partId}"]`);
  group.classList.remove('ps-ghost');
  group.style.opacity = finale ? 1 : String(0.3 + 0.7 * (step / steps));

  const timers = [];
  let done = false;
  const later = (fn, ms) => timers.push(window.setTimeout(fn, ms));
  const finish = () => {
    if (done) return;
    done = true;
    timers.forEach(window.clearTimeout);
    onDone();
  };

  if (idle) {
    stage.classList.add('is-in');
  } else if (reduced) {
    play(finale ? 'partDone' : 'weld');
    if (finale) host.querySelector('.ps-weld-burst').hidden = false;
    later(finish, finale ? 300 : 450);
  } else if (finale) {
    stage.classList.add('is-in');
    play('partIn');
    group.animate([
      { transform: `translate(${part.from.dx}px,${part.from.dy}px)`, opacity: 0 },
      { transform: `translate(${part.from.dx * 0.5}px,${part.from.dy * 0.5}px)`, opacity: 1, offset: 0.4 },
      { transform: 'translate(0,0)', opacity: 1 },
    ], { duration: 1000, easing: 'cubic-bezier(.3,.9,.4,1)' });
    joints.forEach((joint, index) => later(() => { play('weld'); stage.classList.remove('is-shake'); void stage.offsetWidth; stage.classList.add('is-shake'); sparksAt(svg, joint); }, 1000 + index * 420));
    const end = 1000 + joints.length * 420;
    later(() => { host.querySelector('.ps-weld-burst').hidden = false; play('partDone'); }, end);
    later(finish, end + 500);
  } else {
    stage.classList.add('is-in');
    play('servo');
    if (step === 1) {
      group.animate([
        { transform: `translate(${part.from.dx}px,${part.from.dy}px)`, opacity: 0 },
        { transform: 'translate(0,0)', opacity: 1 },
      ], { duration: 450, easing: 'cubic-bezier(.3,.9,.4,1)' });
    }
    later(() => { play('weld'); stage.classList.add('is-shake'); sparksAt(svg, focus); }, 380);
    later(finish, BEAT_MS);
    host.addEventListener('click', finish, { once: true });
  }

  return { skip: finish, destroy() { done = true; timers.forEach(window.clearTimeout); host.removeEventListener('click', finish); } };
}
