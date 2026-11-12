// Shared helpers for the Otterly Maths Path manipulatives. Every widget exports
// render(config) -> HTML string (also used by the Node page generator, so it must not touch the DOM)
// and mount(root, config, hooks) -> controller for the interactive version.

export const esc = (value) => String(value).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function numberWords(n) {
  if (!Number.isInteger(n) || n < 0 || n > 100) throw new RangeError('numberWords handles 0 to 100');
  if (n === 100) return 'one hundred';
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// Fresh sheet/check seed: letters and digits only, within the worksheet seed pattern (1-32 chars).
export function newSeed(prefix = 'mp') {
  const bytes = new Uint32Array(2);
  (globalThis.crypto ?? { getRandomValues: (a) => a.fill(Math.floor(Math.random() * 2 ** 32)) }).getRandomValues(bytes);
  return `${prefix}-${bytes[0].toString(36)}${bytes[1].toString(36)}`.slice(0, 30);
}

let counter = 0;
export const uid = (prefix) => `${prefix}-${++counter}`;

export function reducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// A polite live region inside the widget; every state change is announced in words.
export function liveRegion(root) {
  const node = root.ownerDocument.createElement('p');
  node.className = 'mp-live';
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  node.setAttribute('aria-atomic', 'true');
  root.append(node);
  return (message) => { node.textContent = message; };
}

// Roving tabindex with arrow keys for a group of buttons laid out in rows.
export function rovingFocus(container, selector, columns = 1) {
  const items = () => [...container.querySelectorAll(selector)];
  const setCurrent = (target) => {
    for (const item of items()) item.tabIndex = item === target ? 0 : -1;
  };
  const list = items();
  if (list.length) setCurrent(list.find((item) => item.tabIndex === 0) ?? list[0]);
  container.addEventListener('focusin', (event) => {
    if (event.target.matches?.(selector)) setCurrent(event.target);
  });
  container.addEventListener('keydown', (event) => {
    const all = items();
    const at = all.indexOf(event.target);
    if (at < 0) return;
    const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns, Home: -at, End: all.length - 1 - at };
    if (!(event.key in moves)) return;
    const next = all[clamp(at + moves[event.key], 0, all.length - 1)];
    if (next && next !== event.target) {
      event.preventDefault();
      setCurrent(next);
      next.focus();
    }
  });
}

export function button(doc, { text, label, className = 'mp-btn', onClick, pressed, disabled }) {
  const node = doc.createElement('button');
  node.type = 'button';
  node.className = className;
  node.innerHTML = text;
  if (label) node.setAttribute('aria-label', label);
  if (pressed !== undefined) node.setAttribute('aria-pressed', String(pressed));
  if (disabled) node.disabled = true;
  if (onClick) node.addEventListener('click', onClick);
  return node;
}
