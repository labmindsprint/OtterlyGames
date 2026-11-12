import { esc, liveRegion, button, clamp } from './core.mjs';

export const type = 'placeValueBig';

// Place-value columns from ones up to crores or millions, with Indian or international commas.
// config: { value?, cols? (3-9, default 5), system? ('indian' | 'international'), toggle?, goal?, caption? }
// target: { value } the number the columns must make
export const sample = { config: { value: 4265, cols: 5, system: 'indian' }, target: { value: 4265 } };

const PLACES = {
  indian: [['O', 'Ones', 'one'], ['T', 'Tens', 'ten'], ['H', 'Hundreds', 'hundred'], ['Th', 'Thousands', 'thousand'], ['TTh', 'Ten thousands', 'ten thousand'],
    ['L', 'Lakhs', 'lakh'], ['TL', 'Ten lakhs', 'ten lakh'], ['Cr', 'Crores', 'crore'], ['TCr', 'Ten crores', 'ten crore']],
  international: [['O', 'Ones', 'one'], ['T', 'Tens', 'ten'], ['H', 'Hundreds', 'hundred'], ['Th', 'Thousands', 'thousand'], ['TTh', 'Ten thousands', 'ten thousand'],
    ['HTh', 'Hundred thousands', 'hundred thousand'], ['M', 'Millions', 'million'], ['TM', 'Ten millions', 'ten million'], ['HM', 'Hundred millions', 'hundred million']],
};

const SMALL = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const below100 = (n) => (n < 20 ? SMALL[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${SMALL[n % 10]}` : ''));
const below1000 = (n) => [n >= 100 ? `${SMALL[Math.floor(n / 100)]} hundred` : '', below100(n % 100)].filter(Boolean).join(' ');

export function formatNumber(n, system = 'indian') {
  const s = String(n);
  if (s.length <= 3) return s;
  const head = s.slice(0, -3);
  const tail = s.slice(-3);
  const group = system === 'indian' ? /\B(?=(\d{2})+(?!\d))/g : /\B(?=(\d{3})+(?!\d))/g;
  return `${head.replace(group, ',')},${tail}`;
}

export function numberWords(n, system = 'indian') {
  if (n === 0) return 'zero';
  const units = system === 'indian'
    ? [[10000000, 'crore'], [100000, 'lakh'], [1000, 'thousand']]
    : [[1000000, 'million'], [1000, 'thousand']];
  let rest = n;
  const parts = [];
  for (const [size, name] of units) {
    const count = Math.floor(rest / size);
    if (count) parts.push(`${below1000(count)} ${name}`);
    rest %= size;
  }
  if (rest) parts.push(below1000(rest));
  return parts.join(' ');
}

const digitsOf = (value, cols) => Array.from({ length: cols }, (_, i) => Math.floor(value / 10 ** i) % 10);
const valueOf = (digits) => digits.reduce((sum, d, i) => sum + d * 10 ** i, 0);
const colsOf = (config) => clamp(config.cols ?? 5, 3, 9);
const describe = (value, system) => `${formatNumber(value, system)}, ${numberWords(value, system)}`;

function column(digit, index, system, interactive) {
  const [abbr, name] = PLACES[system][index];
  const groupStart = system === 'indian' ? [3, 5, 7].includes(index) : [3, 6].includes(index);
  const chips = '<i></i>'.repeat(digit);
  return `<div class="mp-pvb-col${groupStart ? ' is-group' : ''}" data-col="${index}">` +
    `<span class="mp-pvb-head" title="${esc(name)}"><b>${abbr}</b><small>${esc(name)}</small></span>` +
    `<div class="mp-pvb-stack" aria-hidden="true">${chips}</div><strong class="mp-pvb-digit" aria-hidden="true">${digit}</strong>` +
    (interactive ? `<span class="mp-pvb-btns"><button type="button" class="mp-btn mp-btn--round" data-add="${index}"></button><button type="button" class="mp-btn mp-btn--round" data-take="${index}"></button></span>` : '') +
    '</div>';
}

function board(digits, system, interactive) {
  return [...digits.keys()].reverse().map((i) => column(digits[i], i, system, interactive)).join('');
}

export function render(config) {
  const cols = colsOf(config);
  const system = config.system ?? 'indian';
  const value = config.value ?? 0;
  const alt = config.alt ?? `Place-value columns showing ${describe(value, system)}.`;
  return `<figure class="mp-w mp-pvb" role="img" aria-label="${esc(alt)}"><div class="mp-pvb-board" aria-hidden="true">${board(digitsOf(value, cols), system, false)}</div>` +
    `<figcaption>${config.caption ? esc(config.caption) : `<strong>${formatNumber(value, system)}</strong> (${numberWords(value, system)})`}</figcaption></figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const cols = colsOf(config);
  const max = 10 ** cols - 1;
  let system = config.system ?? 'indian';
  let digits = digitsOf(clamp(config.value ?? 0, 0, max), cols);
  root.classList.add('mp-w', 'mp-pvb');
  root.innerHTML = `${config.goal !== undefined ? '<p class="mp-pvb-goal" data-goal></p>' : ''}<div class="mp-pvb-board" data-board></div>` +
    '<p class="mp-pvb-total" data-total></p><p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>';
  const say = liveRegion(root);
  const q = (s) => root.querySelector(s);
  const controls = q('[data-controls]');
  const groupButtons = {};
  if (config.toggle !== false && cols > 5) {
    for (const id of ['indian', 'international']) {
      groupButtons[id] = button(doc, {
        text: id === 'indian' ? 'Indian commas' : 'International commas', pressed: id === system,
        onClick: () => { system = id; draw(); update(`Now using ${id} grouping.`); },
      });
      controls.append(groupButtons[id]);
    }
  }
  const clear = button(doc, { text: 'Clear all', className: 'mp-btn mp-btn--ghost', onClick: () => { digits = digits.map(() => 0); draw(); update('All columns cleared.'); } });
  controls.append(clear);
  if (config.goal !== undefined) q('[data-goal]').textContent = `Goal: ${formatNumber(config.goal, system)}`;

  function draw() {
    q('[data-board]').innerHTML = board(digits, system, true);
    q('[data-board]').setAttribute('role', 'group');
    q('[data-board]').setAttribute('aria-label', 'Place-value columns. Use the plus and minus buttons under each column.');
    for (const add of root.querySelectorAll('[data-add]')) {
      const i = Number(add.dataset.add);
      const name = PLACES[system][i][2];
      add.textContent = '+';
      add.setAttribute('aria-label', `Add 1 ${name}`);
      add.disabled = valueOf(digits) + 10 ** i > max;
      add.addEventListener('click', () => adjust(i, 1));
      const take = root.querySelector(`[data-take="${i}"]`);
      take.textContent = '−';
      take.setAttribute('aria-label', `Take away 1 ${name}`);
      take.disabled = digits[i] <= 0;
      take.addEventListener('click', () => adjust(i, -1));
    }
    if (config.goal !== undefined) q('[data-goal]').textContent = `Goal: ${formatNumber(config.goal, system)}`;
    for (const [id, b] of Object.entries(groupButtons)) b.setAttribute('aria-pressed', String(id === system));
  }
  function adjust(i, delta) {
    const next = valueOf(digits) + delta * 10 ** i;
    // Adding to a full column or taking from an empty one regroups into the next column, so the total stays right.
    if (next < 0 || next > max || (delta < 0 && digits[i] === 0)) return;
    const carried = delta > 0 && digits[i] === 9;
    digits = digitsOf(next, cols);
    draw();
    root.querySelector(`[data-${delta > 0 ? 'add' : 'take'}="${i}"]`)?.focus();
    update(carried ? `10 ${PLACES[system][i][1].toLowerCase()} make 1 ${PLACES[system][i + 1][2]}.` : '');
  }  function update(extra) {
    const value = valueOf(digits);
    q('[data-total]').textContent = formatNumber(value, system);
    const text = `${describe(value, system)}.`;
    q('[data-readout]').textContent = numberWords(value, system);
    say(`${extra ? `${extra} ` : ''}${text}`);
    hooks.onChange?.(api.getState());
  }
  draw();
  q('[data-total]').textContent = formatNumber(valueOf(digits), system);
  q('[data-readout]').textContent = numberWords(valueOf(digits), system);

  const api = {
    getState: () => ({ digits: [...digits], value: valueOf(digits), system }),
    matches: (target) => {
      const value = valueOf(digits);
      const ok = value === target.value;
      return {
        ok,
        message: ok ? `Yes! ${describe(value, system)}.`
          : `You made ${formatNumber(value, system)}. Compare each column with the digits of ${formatNumber(target.value, system)}.`,
      };
    },
    reset: () => { digits = digitsOf(clamp(config.value ?? 0, 0, max), cols); draw(); update('Columns reset.'); },
  };
  return api;
}
