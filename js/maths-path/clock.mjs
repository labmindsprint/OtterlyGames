import { esc, liveRegion, button, clamp } from './core.mjs';

export const type = 'clock';

export function timeWords(hour, minute) {
  const h = ((hour - 1) % 12 + 12) % 12 + 1;
  if (minute === 0) return `${h} o'clock`;
  if (minute === 30) return `half past ${h}`;
  return `${h}:${String(minute).padStart(2, '0')}`;
}
export const digital = (hour, minute) => `${(((hour - 1) % 12 + 12) % 12) + 1}:${String(minute).padStart(2, '0')}`;

function face(hour, minute, interactive) {
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const minuteAngle = minute * 6;
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const major = i % 5 === 0;
    return `<line x1="100" y1="${major ? 12 : 14}" x2="100" y2="${major ? 21 : 18}" class="mp-clock-tick${major ? ' is-major' : ''}" transform="rotate(${i * 6} 100 100)"/>`;
  }).join('');
  const numerals = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const a = (n * 30 * Math.PI) / 180;
    return `<text x="${(100 + 70 * Math.sin(a)).toFixed(1)}" y="${(100 - 70 * Math.cos(a) + 7).toFixed(1)}" class="mp-clock-num" text-anchor="middle">${n}</text>`;
  }).join('');
  const hand = (cls, angle, length, label, extra = '') =>
    `<g class="mp-clock-hand ${cls}" ${interactive ? `data-hand="${cls}"` : ''} ${extra}><line x1="100" y1="100" x2="100" y2="${100 - length}" transform="rotate(${angle} 100 100)" class="mp-clock-line"/>` +
    (interactive ? `<line x1="100" y1="100" x2="100" y2="${100 - length}" transform="rotate(${angle} 100 100)" class="mp-clock-hit"/>` : '') + '</g>';
  return `<svg class="mp-clock-svg" viewBox="0 0 200 200" ${interactive ? '' : 'aria-hidden="true" focusable="false"'}><circle cx="100" cy="100" r="94" class="mp-clock-face"/>${ticks}${numerals}` +
    `${hand('hour', hourAngle, 48)}${hand('minute', minuteAngle, 72)}<circle cx="100" cy="100" r="6" class="mp-clock-pin"/></svg>`;
}

export function render(config) {
  const { hour = 12, minute = 0 } = config;
  const alt = config.alt ?? `A clock. The short hour hand points near ${hour} and the long minute hand points to ${minute === 0 ? '12' : minute / 5}. It shows ${timeWords(hour, minute)}.`;
  return `<figure class="mp-w mp-clock" role="img" aria-label="${esc(alt)}">${face(hour, minute, false)}` +
    `<figcaption>${config.caption ? esc(config.caption) : esc(timeWords(hour, minute))}</figcaption></figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const snap = config.snap ?? 30;
  let hour = config.hour ?? 12;
  let minute = config.minute ?? 0;
  root.classList.add('mp-w', 'mp-clock');
  root.innerHTML = '<div class="mp-clock-wrap" data-face></div><p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>';
  const say = liveRegion(root);
  const holder = root.querySelector('[data-face]');
  const readout = root.querySelector('[data-readout]');
  const message = () => `The clock shows ${digital(hour, minute)}, ${timeWords(hour, minute)}.`;

  function draw(focusHand) {
    holder.innerHTML = face(hour, minute, true);
    const svg = holder.querySelector('svg');
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', 'Clock you can move. Drag the hands, or use the buttons below.');
    for (const g of svg.querySelectorAll('[data-hand]')) {
      const isMinute = g.dataset.hand === 'minute';
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'slider');
      g.setAttribute('aria-label', isMinute ? 'Long minute hand' : 'Short hour hand');
      g.setAttribute('aria-valuemin', isMinute ? '0' : '1');
      g.setAttribute('aria-valuemax', isMinute ? '59' : '12');
      g.setAttribute('aria-valuenow', String(isMinute ? minute : ((hour - 1) % 12) + 1));
      g.setAttribute('aria-valuetext', message());
      g.addEventListener('keydown', (event) => {
        const dir = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 0;
        if (!dir) return;
        event.preventDefault();
        if (isMinute) moveMinute(dir * snap); else setHour(hour + dir);
        draw(g.dataset.hand);
      });
    }
    if (focusHand) holder.querySelector(`[data-hand="${focusHand}"]`)?.focus();
    readout.textContent = message();
  }
  function setHour(h) { hour = ((h - 1) % 12 + 12) % 12 + 1; changed(); }
  function setMinute(m) { minute = m; changed(); }
  function moveMinute(delta) {
    const next = minute + delta;
    if (next >= 60) { minute = next - 60; hour = hour % 12 + 1; } else if (next < 0) { minute = next + 60; hour = (hour + 10) % 12 + 1; } else minute = next;
    changed();
  }
  function changed() { say(message()); hooks.onChange?.(api.getState()); }

  let dragging = null;
  holder.addEventListener('pointerdown', (event) => {
    const g = event.target.closest('[data-hand]');
    if (!g) return;
    dragging = g.dataset.hand;
    holder.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  holder.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const svg = holder.querySelector('svg');
    const box = svg.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const degrees = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    if (dragging === 'minute') {
      const next = (Math.round(degrees / 6 / snap) * snap) % 60;
      if (next === minute) return;
      const wasLate = minute >= 45;
      const wasEarly = minute <= 15;
      if (wasLate && next <= 15) hour = hour % 12 + 1;
      else if (wasEarly && next >= 45) hour = (hour + 10) % 12 + 1;
      minute = next;
    } else {
      const next = Math.round(degrees / 30) % 12 || 12;
      if (next === hour) return;
      hour = next;
    }
    draw();
    changed();
  });
  const stop = () => { if (dragging) { const was = dragging; dragging = null; draw(was); } };
  holder.addEventListener('pointerup', stop);
  holder.addEventListener('pointercancel', stop);

  const controls = root.querySelector('[data-controls]');
  const label = snap === 30 ? 'half hour' : `${snap} minutes`;
  controls.append(
    button(doc, { text: `Long hand: back ${label}`, onClick: () => { moveMinute(-snap); draw(); } }),
    button(doc, { text: `Long hand: forward ${label}`, onClick: () => { moveMinute(snap); draw(); } }),
    button(doc, { text: 'Short hand: forward 1 hour', onClick: () => { setHour(hour + 1); draw(); } }),
    button(doc, { text: 'Short hand: back 1 hour', onClick: () => { setHour(hour - 1); draw(); } }),
  );
  draw();

  const api = {
    getState: () => ({ hour, minute }),
    matches: (target) => {
      const ok = hour === target.hour && minute === target.minute;
      return {
        ok,
        message: ok ? `Yes! ${digital(hour, minute)} is ${timeWords(hour, minute)}.`
          : `Your clock shows ${timeWords(hour, minute)}. Check the short hand for the hour and the long hand for the minutes.`,
      };
    },
    reset: () => { hour = config.hour ?? 12; minute = config.minute ?? 0; draw(); changed(); },
  };
  return api;
}
