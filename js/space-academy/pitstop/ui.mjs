export const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

// Escapes text and keeps hyphenated words (ad-free, Grown-ups) on one line instead of wrapping at the hyphen.
export const noBreakHyphens = value => esc(value).replace(/\b[A-Za-z]+(?:-[A-Za-z]+)+\b/g, word => `<span class="nb">${word}</span>`);

export const INK = '#2b2b2b';

// Ringo the otter: the friendly guide, rendered in Blender (store-assets/ringo).
// mood is 'happy', 'think' or 'cheer'; small sizes use the head-and-scarf crop.
const RINGO = {
  happy: ['/images/ringo/ringo-happy.webp', '/images/ringo/ringo-happy-bust.webp'],
  think: ['/images/ringo/ringo-think.webp', '/images/ringo/ringo-think-bust.webp'],
  cheer: ['/images/ringo/ringo-cheer.webp', '/images/ringo/ringo-cheer-bust.webp']
};
export function ringo(size = 56, mood = 'happy') {
  const [full, bust] = RINGO[mood] || RINGO.happy;
  return `<img class="ps-ringo" src="${size <= 64 ? bust : full}" width="${size}" height="${size}" alt="" aria-hidden="true" decoding="async" draggable="false">`;
}
export const ICONS = {
  skills: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 27V15h6v12M13 27V6h6v21M21 27V11h6v16" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  ship: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3c6 5 7 12 6 19h-12c-1-7 0-14 6-19Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M10 20 4 27l6-1M22 20l6 7-6-1M13 28h6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  paint: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4C8 4 3 10 3 16c0 6 5 12 11 12 3 0 3-3 1-5-2-3 0-5 3-5h5c3 0 6-2 6-5 0-6-6-9-13-9Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="10" cy="14" r="2" fill="currentColor"/><circle cx="16" cy="9" r="2" fill="currentColor"/><circle cx="22" cy="13" r="2" fill="currentColor"/></svg>',
  back: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M20 5 9 16l11 11" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 7l18 18M25 7 7 25" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>',
  speak: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 12h5l7-6v20l-7-6H5Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M22 11q4 5 0 10M25 7q7 9 0 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  bulb: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3a9 9 0 0 0-5 16c1 1 1 3 1 4h8c0-1 0-3 1-4A9 9 0 0 0 16 3Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M12 28h8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 12h5l7-6v20l-7-6H4Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M21 12l8 8M29 12l-8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  lock: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="14" width="20" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><path d="M10 14V10a6 6 0 0 1 12 0v4" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  star: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 3 4 9 10 1-7.5 6.5 2.3 9.5L16 24l-8.8 5 2.3-9.5L2 13l10-1Z" fill="currentColor" stroke="#2b2b2b" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  gear: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 26 8v9c0 6-4 10-10 12C10 27 6 23 6 17V8Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M16 10v10M11 15h10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  fuel: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3c5 6 8 10 8 15a8 8 0 0 1-16 0c0-5 3-9 8-15Z" fill="#ffb347" stroke="#2b2b2b" stroke-width="2.6" stroke-linejoin="round"/><path d="M13 20a3.5 3.5 0 0 0 3 3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
};

export function stars(count, total = 3) {
  return `<span class="ps-stars" role="img" aria-label="${count} of ${total} stars">${Array.from({ length: total }, (_, index) =>
    `<span class="${index < count ? 'is-on' : ''}">${ICONS.star}</span>`).join('')}</span>`;
}

// Soft comic starburst behind short words such as WELDED!
export function burst(text, size = 220) {
  const points = Array.from({ length: 24 }, (_, index) => {
    const angle = index / 24 * Math.PI * 2;
    const radius = index % 2 ? 62 : 96;
    return `${(110 + Math.cos(angle) * radius * 1.1).toFixed(1)},${(110 + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(' ');
  return `<svg class="ps-burst" width="${size}" height="${size * 0.7}" viewBox="0 0 220 154" aria-hidden="true"><g transform="translate(0 -28)"><polygon points="${points}" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></g><text x="110" y="88" text-anchor="middle" font-size="34" font-weight="bold" fill="#2b2b2b" transform="rotate(-6 110 88)">${esc(text)}</text></svg>`;
}

export const WOBBLE_FILTER = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><filter id="ps-wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter></svg>`;
