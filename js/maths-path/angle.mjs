import { esc, liveRegion, button, clamp } from './core.mjs';

export const type = 'angle';

// A round protractor with one fixed arm and one arm that builds or shows an angle.
// config: { angle?, mode? ('build' | 'name'), step? (default 5), caption?, showValue? }
//   build: drag or key the arm to make an angle. target: { angle } exact degrees, or { kind } one of the kinds below.
//   name: the angle is fixed; pick its kind. target: { kind }.
// kinds: zero, acute, right, obtuse, straight, reflex, full
export const sample = { config: { angle: 30, mode: 'build', step: 5 }, target: { angle: 90 } };

export const KINDS = [
  { id: 'acute', label: 'Acute', rule: 'less than a right angle' },
  { id: 'right', label: 'Right', rule: 'exactly a quarter turn, 90°' },
  { id: 'obtuse', label: 'Obtuse', rule: 'more than a right angle but less than a straight line' },
  { id: 'straight', label: 'Straight', rule: 'exactly a half turn, 180°' },
  { id: 'reflex', label: 'Reflex', rule: 'more than a straight line but less than a full turn' },
  { id: 'full', label: 'Full turn', rule: 'exactly one whole turn, 360°' },
];

export function kindOf(angle) {
  if (angle <= 0) return 'zero';
  if (angle < 90) return 'acute';
  if (angle === 90) return 'right';
  if (angle < 180) return 'obtuse';
  if (angle === 180) return 'straight';
  if (angle < 360) return 'reflex';
  return 'full';
}

const kindText = (angle) => {
  const kind = kindOf(angle);
  if (kind === 'zero') return 'The arms are together: no turn yet';
  if (kind === 'full') return 'A full turn';
  return `${kind === 'acute' || kind === 'obtuse' ? 'An' : 'A'} ${kind} angle`;
};
const sentence = (angle) => `The angle is ${angle}°. ${kindText(angle)}.`;

const polar = (angle, radius) => {
  const a = (angle * Math.PI) / 180;
  return [100 + radius * Math.cos(a), 100 - radius * Math.sin(a)];
};
const pt = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

function wedge(angle) {
  if (angle <= 0) return '';
  if (angle >= 360) return '<circle cx="100" cy="100" r="34" class="mp-ang-wedge"/>';
  const [x, y] = polar(angle, 34);
  return `<path class="mp-ang-wedge" d="M 134 100 A 34 34 0 ${angle > 180 ? 1 : 0} 0 ${x.toFixed(1)} ${y.toFixed(1)} L 100 100 Z"/>`;
}

function face(angle, interactive) {
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const deg = i * 5;
    const major = deg % 30 === 0;
    const mid = deg % 10 === 0;
    const [x1, y1] = polar(deg, major ? 84 : mid ? 87 : 90);
    const [x2, y2] = polar(deg, 94);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="mp-ang-tick${major ? ' is-major' : ''}"/>`;
  }).join('');
  const labels = Array.from({ length: 12 }, (_, i) => {
    const [x, y] = polar(i * 30, 73);
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="mp-ang-num" text-anchor="middle">${i * 30}</text>`;
  }).join('');
  const [ex, ey] = polar(angle, 94);
  const [hx, hy] = polar(angle, 88);
  const square = angle === 90 ? '<path class="mp-ang-square" d="M 118 100 L 118 82 L 100 82"/>' : '';
  const arm = (interactive ? `<line x1="100" y1="100" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" class="mp-ang-hit"/>` : '') + `<line x1="100" y1="100" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" class="mp-ang-arm"/>` +
    (interactive ? `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="7" class="mp-ang-knob"/>` : '');
  return `<svg class="mp-ang-svg" viewBox="0 0 200 200" ${interactive ? '' : 'aria-hidden="true" focusable="false"'}><circle cx="100" cy="100" r="96" class="mp-ang-face"/>${ticks}` +
    `${wedge(angle)}${square}<line x1="100" y1="100" x2="196" y2="100" class="mp-ang-base"/>` +
    `<g class="mp-ang-handle" ${interactive ? 'data-arm' : ''}>${arm}</g>${labels}<circle cx="100" cy="100" r="5" class="mp-ang-pin"/></svg>`;
}

export function render(config) {
  const angle = clamp(Math.round(config.angle ?? 0), 0, 360);
  const alt = config.alt ?? `A round protractor. One arm points right and the other is turned ${angle} degrees anticlockwise. ${sentence(angle)}`;
  return `<figure class="mp-w mp-angle" role="img" aria-label="${esc(alt)}"><div class="mp-ang-wrap">${face(angle, false)}</div>` +
    `<figcaption>${config.caption ? esc(config.caption) : esc(sentence(angle))}</figcaption></figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const step = config.step ?? 5;
  const mode = config.mode ?? 'build';
  const start = clamp(Math.round(config.angle ?? 0), 0, 360);
  let angle = start;
  let chosen = null;
  root.classList.add('mp-w', 'mp-angle');
  root.innerHTML = '<div class="mp-ang-wrap" data-face></div><p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>';
  const say = liveRegion(root);
  const holder = root.querySelector('[data-face]');
  const readout = root.querySelector('[data-readout]');
  const controls = root.querySelector('[data-controls]');
  const showValue = config.showValue !== false;
  const text = () => (mode === 'name' && !chosen ? `Look at the angle. Which kind is it?` : mode === 'name' ? `You chose ${chosen}. The angle is ${angle}°.` : sentence(angle));

  function draw(focus) {
    holder.innerHTML = face(angle, mode === 'build');
    const svg = holder.querySelector('svg');
    if (mode !== 'build') {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', `A round protractor showing an angle of ${angle} degrees.`);
    } else {
      svg.setAttribute('role', 'group');
      svg.setAttribute('aria-label', 'Protractor. Drag the arm, or use the arrow keys. Shift or Page Up and Page Down move 15 degrees.');
      const g = svg.querySelector('[data-arm]');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'slider');
      g.setAttribute('aria-label', 'Angle arm');
      g.setAttribute('aria-valuemin', '0');
      g.setAttribute('aria-valuemax', '360');
      g.setAttribute('aria-valuenow', String(angle));
      g.setAttribute('aria-valuetext', sentence(angle));
      g.addEventListener('keydown', onKey);
      if (focus) g.focus();
    }
    readout.textContent = showValue || mode === 'build' ? text() : 'Look at the angle. Which kind is it?';
  }
  function set(next, announce = true) {
    const value = clamp(Math.round(next), 0, 360);
    if (value === angle) return;
    angle = value;
    chosen = null;
    draw(true);
    if (announce) say(sentence(angle));
    hooks.onChange?.(api.getState());
  }
  function onKey(event) {
    const big = event.shiftKey;
    const keys = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step };
    let delta = keys[event.key] !== undefined ? keys[event.key] * (big ? 3 : 1) : null;
    if (event.key === 'PageUp') delta = 15;
    if (event.key === 'PageDown') delta = -15;
    if (event.key === 'Home') { event.preventDefault(); set(0); return; }
    if (event.key === 'End') { event.preventDefault(); set(360); return; }
    if (delta === null) return;
    event.preventDefault();
    set(angle + delta);
  }

  let dragging = false;
  holder.addEventListener('pointerdown', (event) => {
    if (mode !== 'build' || !event.target.closest?.('[data-arm]')) return;
    dragging = true;
    holder.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  holder.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const box = holder.querySelector('svg').getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    let degrees = ((Math.atan2(-dy, dx) * 180) / Math.PI + 360) % 360;
    // Crossing the base arm sticks at 0 or 360 instead of jumping across the circle.
    if (angle >= 270 && degrees < 90) degrees = 360;
    else if (angle <= 90 && degrees > 270) degrees = 0;
    const snapped = Math.round(degrees / step) * step;
    if (snapped === angle) return;
    angle = clamp(snapped, 0, 360);
    chosen = null;
    draw(false);
    say(sentence(angle));
    hooks.onChange?.(api.getState());
  });
  const stop = () => { if (dragging) { dragging = false; draw(true); } };
  holder.addEventListener('pointerup', stop);
  holder.addEventListener('pointercancel', stop);

  if (mode === 'build') {
    for (const delta of [-15, -5, 5, 15]) {
      controls.append(button(doc, {
        text: `${delta > 0 ? '+' : '−'} ${Math.abs(delta)}°`,
        label: `${delta > 0 ? 'Open the arm wider by' : 'Close the arm by'} ${Math.abs(delta)} degrees`,
        onClick: () => set(angle + delta),
      }));
    }
  } else {
    for (const kind of KINDS.filter((k) => !config.kinds || config.kinds.includes(k.id))) {
      controls.append(button(doc, {
        text: kind.label,
        label: `${kind.label} angle: ${kind.rule}`,
        pressed: false,
        onClick: (event) => {
          chosen = kind.label.toLowerCase();
          for (const b of controls.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b === event.currentTarget));
          readout.textContent = text();
          say(`You chose ${chosen}.`);
          hooks.onChange?.(api.getState());
        },
      }));
    }
  }
  draw(false);

  const api = {
    getState: () => ({ angle, kind: kindOf(angle), chosen }),
    matches: (target) => {
      if (mode === 'name') {
        const want = target.kind ?? kindOf(angle);
        const got = chosen === 'full turn' ? 'full' : chosen;
        const ok = got === want;
        return {
          ok,
          message: ok ? `Yes! ${angle}° is ${want === 'full' ? 'a full turn' : `${want === 'obtuse' ? 'an' : 'a'} ${want} angle`}.`
            : got ? `Not quite. Compare the arm with the straight line and the corner of a square.`
              : 'Pick a kind of angle first.',
        };
      }
      const want = target.angle;
      const ok = want !== undefined ? angle === want : kindOf(angle) === target.kind;
      return {
        ok,
        message: ok ? `Yes! ${sentence(angle)}`
          : `Your angle is ${angle}°. ${want !== undefined ? `Turn the arm until it reads ${want}°.` : `Make ${target.kind === 'full' ? 'a full turn' : `a ${target.kind} angle`}: ${KINDS.find((k) => k.id === target.kind)?.rule ?? ''}.`}`,
      };
    },
    reset: () => { angle = start; chosen = null; for (const b of controls.querySelectorAll('button')) if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', 'false'); draw(false); say(sentence(angle)); hooks.onChange?.(api.getState()); },
  };
  return api;
}
