import { esc, liveRegion, button } from './core.mjs';

export const type = 'calendar';

// One month. config: { month: 'March', year?: 2026, days: 31, startDay: 0..6 (0 = Monday), highlights?: [dates], editable?, caption? }
// target: { date: n } the chosen date | { weekday: 'Friday' } the chosen date falls on that day
export const sample = { config: { month: 'March', year: 2026, days: 31, startDay: 6, highlights: [1], editable: true }, target: { weekday: 'Sunday' } };

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const weekdayOf = (config, date) => WEEKDAYS[(config.startDay + date - 1) % 7];

function body(config, picked, interactive) {
  const head = WEEKDAYS.map((d) => `<th scope="col"><abbr title="${d}">${d.slice(0, 3)}</abbr></th>`).join('');
  const rows = [];
  let cells = Array.from({ length: config.startDay }, () => '<td></td>');
  for (let d = 1; d <= config.days; d += 1) {
    const hi = (config.highlights ?? []).includes(d) ? ' is-mark' : '';
    const on = picked === d ? ' is-on' : '';
    cells.push(`<td>${interactive
      ? `<button type="button" class="mp-day${hi}${on}" data-d="${d}" aria-pressed="${picked === d}" aria-label="${weekdayOf(config, d)} ${d} ${esc(config.month)}">${d}</button>`
      : `<span class="mp-day${hi}${on}">${d}</span>`}</td>`);
    if (cells.length === 7) { rows.push(`<tr>${cells.join('')}</tr>`); cells = []; }
  }
  if (cells.length) { while (cells.length < 7) cells.push('<td></td>'); rows.push(`<tr>${cells.join('')}</tr>`); }
  return `<table class="mp-cal"><caption>${esc(config.month)}${config.year ? ` ${config.year}` : ''}</caption><thead><tr>${head}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

export function render(config) {
  const marked = (config.highlights ?? []).map((d) => `${weekdayOf(config, d)} ${d}`).join(', ');
  return `<figure class="mp-w mp-calwrap">${body(config, null, false)}<figcaption>${esc(config.caption ?? `${config.month} has ${config.days} days. The 1st is a ${weekdayOf(config, 1)}.${marked ? ` Marked: ${marked}.` : ''}`)}</figcaption></figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  let picked = null;
  root.classList.add('mp-w', 'mp-calwrap');
  root.innerHTML = '<div data-cal></div><p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>';
  const say = liveRegion(root);
  const message = () => (picked ? `${weekdayOf(config, picked)} ${picked} ${config.month} is picked.` : 'Tap a date.');
  const draw = (focus) => {
    root.querySelector('[data-cal]').innerHTML = body(config, picked, true);
    root.querySelector('[data-readout]').textContent = message();
    if (focus) root.querySelector(`[data-d="${focus}"]`)?.focus();
  };
  root.addEventListener('click', (event) => {
    const day = event.target.closest('.mp-day[data-d]');
    if (!day) return;
    picked = Number(day.dataset.d);
    draw(picked);
    say(message());
    hooks.onChange?.(api.getState());
  });
  root.querySelector('[data-controls]').append(button(doc, { text: 'Clear', className: 'mp-btn mp-btn--ghost', onClick: () => api.reset() }));
  draw();
  const api = {
    getState: () => ({ date: picked, weekday: picked ? weekdayOf(config, picked) : null }),
    matches: (target) => {
      const ok = picked !== null && (target.date !== undefined ? picked === target.date : weekdayOf(config, picked) === target.weekday);
      return { ok, message: ok ? `Yes! ${message()}` : picked ? `${message()} Check the day names across the top, then try again.` : 'Pick a date first.' };
    },
    reset: () => { picked = null; draw(); say(message()); hooks.onChange?.(api.getState()); },
  };
  return api;
}
