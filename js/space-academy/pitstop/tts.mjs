// Read-aloud for questions. Modelled on Clock Master's ttsService: one slow, child-friendly voice, no overlapping
// speech, speech stops the moment the child moves on or the app is hidden. The Android app speaks through
// window.OtterlyNative.tts (native TextToSpeech, works even when the WebView has no browser voices); everything
// else uses speechSynthesis. Nothing here ever throws into the game: no voice simply means silence.
const STORE_KEY = 'osa-pitstop-voice';
const MAX_CHARS = 600;
const RATE = 0.9;
const PITCH = 1.05;
const VOICE_WAIT_MS = 800;
let generation = 0;
let nativeActive = false;
let utterance = null;
let remembered = null;
let watching = false;

const synthesis = () => (globalThis.speechSynthesis && globalThis.SpeechSynthesisUtterance ? globalThis.speechSynthesis : null);
const nativeTts = () => {
  const tts = globalThis.OtterlyNative?.tts;
  return tts && typeof tts.speak === 'function' ? tts : null;
};

export function isSupported() {
  return Boolean(nativeTts() || synthesis());
}

// ---------- the on/off switch ----------
export const defaultOn = () => false;

export function isEnabled(fallback = false) {
  let stored = null;
  try { stored = globalThis.localStorage?.getItem(STORE_KEY) ?? null; } catch { stored = null; }
  const value = stored === '1' || stored === '0' ? stored : remembered;
  return value === null ? Boolean(fallback) : value === '1';
}

// Storage can be denied (private browsing, blocked cookies); the choice then lasts until the page closes.
export function setEnabled(on) {
  remembered = on ? '1' : '0';
  try { globalThis.localStorage?.setItem(STORE_KEY, remembered); } catch { /* kept in memory */ }
  if (!on) stop();
}

// ---------- turning question text into something a voice reads well ----------
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ORDINAL_END = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
const UNITS = { km: 'kilometres', cm: 'centimetres', mm: 'millimetres', kg: 'kilograms', ml: 'millilitres', m: 'metres', g: 'grams', l: 'litres' };
const FRACTIONS = { '½': ' one half ', '¼': ' one quarter ', '¾': ' three quarters ', '⅓': ' one third ', '⅔': ' two thirds ' };

function wholeWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '');
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${wholeWords(n % 100)}` : ''}`;
  const scale = n >= 1e6 ? [1e6, 'million'] : [1e3, 'thousand'];
  return `${wholeWords(Math.floor(n / scale[0]))} ${scale[1]}${n % scale[0] ? ` ${wholeWords(n % scale[0])}` : ''}`;
}

const spell = digits => [...digits].map(digit => ONES[Number(digit)]).join(' ');

function numberWords(token) {
  const [whole, fraction] = token.replace(/,/g, '').split('.');
  const long = whole.length > 9 || (whole.length > 1 && whole.startsWith('0'));
  const head = long ? spell(whole) : wholeWords(Number(whole));
  return fraction === undefined ? head : `${head} point ${spell(fraction)}`;
}

function ordinalWords(count) {
  const words = wholeWords(Number(count)).split(' ');
  const last = words.pop();
  const end = ORDINAL_END[last] ?? (last.endsWith('y') ? `${last.slice(0, -1)}ieth` : `${last}th`);
  return [...words, end].join(' ');
}

export function speakable(text) {
  const equation = String(text ?? '').includes('=');
  let line = String(text ?? '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]/gu, ' ')
    // Raw ids such as part_wing or class-3-ch2 mean nothing to a child.
    .replace(/\b[A-Za-z0-9]+(?:_[A-Za-z0-9]+)+\b/g, ' ')
    .replace(/\b(?:pp1|pp2|class)(?:-[a-z0-9]+){2,}\b/gi, ' ')
    .replace(/_{2,}|[□▢]|\[\s*\]/g, ' blank ')
    .replace(/([=+×÷*−-]\s?)\?/g, '$1 what number ')
    .replace(/\?(\s?[=+×÷*−-])/g, ' what number $1')
    .replace(/[½¼¾⅓⅔]/g, char => FRACTIONS[char])
    .replace(/(\d{1,2}):(\d{2})\b/g, (_, hours, minutes) =>
      (Number(minutes) === 0 ? `${hours} o'clock` : Number(minutes) < 10 ? `${hours} oh ${Number(minutes)}` : `${hours} ${minutes}`))
    .replace(/(\d)\s*[x*]\s*(?=\d)/g, '$1 times ')
    .replace(/[×*]/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/\s\/\s/g, ' divided by ')
    .replace(/(\d)\/(\d)/g, '$1 over $2')
    .replace(/\+/g, ' plus ')
    .replace(/(\d)\s+[-−]\s+(?=\d)/g, '$1 minus ')
    .replace(/(^|[\s(])[-−](?=\d)/g, '$1minus ')
    .replace(/(\d)\s*[-−]\s*(?=\d)/g, equation ? '$1 minus ' : '$1 to ')
    .replace(/≠/g, ' is not equal to ')
    .replace(/≤/g, ' is less than or equal to ')
    .replace(/≥/g, ' is greater than or equal to ')
    .replace(/=/g, ' equals ')
    .replace(/</g, ' is less than ')
    .replace(/>/g, ' is greater than ')
    .replace(/(\d)\s*%/g, '$1 percent')
    .replace(/₹\s*(\d[\d,.]*)/g, '$1 rupees')
    .replace(/°\s*C\b/g, ' degrees Celsius')
    .replace(/°/g, ' degrees')
    .replace(/²/g, ' squared')
    .replace(/³/g, ' cubed')
    .replace(/&/g, ' and ')
    .replace(/(\d)\s?(km|cm|mm|kg|ml|m|g|l)\b/g, (_, digit, unit) => `${digit} ${UNITS[unit]}`)
    .replace(/(\d+)(st|nd|rd|th)\b/gi, (_, count) => ` ${ordinalWords(count)} `)
    .replace(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g, (token, offset, whole) => {
      const before = /[A-Za-z]/.test(whole[offset - 1] ?? '') ? ' ' : '';
      const after = /[A-Za-z]/.test(whole[offset + token.length] ?? '') ? ' ' : '';
      return `${before}${numberWords(token)}${after}`;
    })
    .replace(/[#^~`|\\{}[\]()"]/g, ' ')
    .replace(/,(?=\S)/g, ', ')
    .replace(/\//g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.!?])(\s*[.,;:])+/g, '$1')
    .trim();
  if (line.length > MAX_CHARS) {
    const cut = line.slice(0, MAX_CHARS);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
    line = end > MAX_CHARS / 2 ? cut.slice(0, end + 1) : cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : MAX_CHARS);
  }
  return line;
}

const optionRaw = (question, index) => question.optionVisuals?.[index]?.description || question.options[index];
const trimEnd = text => String(text).trim().replace(/[.:]+$/, '');
const joinLines = lines => lines.filter(Boolean).reduce((all, line) => (all ? `${all}${/[?!]$/.test(all) ? ' ' : '. '}${line}` : line), '');

// What the child hears for a question. Never includes the correct answer, the explanation or a hint.
export function questionSpeech(question) {
  return joinLines([question?.prompt].filter(text => typeof text === 'string' && text.trim()).map(trimEnd));
}

export function optionsSpeech(question) {
  return joinLines((question?.options ?? []).map((_, index) => `Option ${String.fromCharCode(65 + index)}: ${trimEnd(optionRaw(question, index))}`));
}

export function fullSpeech(question) {
  return joinLines([questionSpeech(question), optionsSpeech(question)]);
}

// ---------- the voice ----------
export function pickVoice(voices) {
  const rank = ['en-in', 'en-gb', 'en-us'];
  const score = voice => {
    const lang = String(voice?.lang ?? '').toLowerCase().replace('_', '-');
    if (!lang.startsWith('en')) return -1;
    const name = String(voice.name ?? '');
    const place = rank.indexOf(lang);
    let points = place >= 0 ? (rank.length - place) * 10 : 2;
    if (/natural|neural|online/i.test(name)) points += 8;
    if (/female|zira|aria|jenny|samantha|heera|veena|neerja|libby|sonia|hazel|susan|google (uk|us|india)/i.test(name)) points += 5;
    if (/(^|[^a-z])male\b|david|mark|ravi|george|james|guy|daniel|fred/i.test(name)) points -= 5;
    return points + (voice.default ? 1 : 0);
  };
  let best = null;
  let bestScore = -1;
  for (const voice of voices ?? []) {
    const points = score(voice);
    if (points > bestScore) { best = voice; bestScore = points; }
  }
  return best;
}

function voicesReady(synth) {
  if (synth.getVoices().length || typeof synth.addEventListener !== 'function') return Promise.resolve();
  return new Promise(resolve => {
    let timer = 0;
    const finish = () => {
      globalThis.clearTimeout(timer);
      synth.removeEventListener?.('voiceschanged', finish);
      resolve();
    };
    timer = globalThis.setTimeout(finish, VOICE_WAIT_MS);
    synth.addEventListener('voiceschanged', finish);
  });
}

// Voices load late in most browsers; ask early so the first question is not delayed.
export function prepare() {
  try { synthesis()?.getVoices(); } catch { /* no voices */ }
  watchVisibility();
}

async function browserSpeak(line, mine) {
  const synth = synthesis();
  if (!synth) return false;
  await voicesReady(synth);
  if (mine !== generation) return false;
  const voice = pickVoice(synth.getVoices());
  const next = new globalThis.SpeechSynthesisUtterance(line);
  next.rate = RATE;
  next.pitch = PITCH;
  next.lang = voice?.lang || 'en-IN';
  if (voice) next.voice = voice;
  next.onend = next.onerror = () => { if (utterance === next) utterance = null; };
  utterance = next;
  try { synth.speak(next); } catch { utterance = null; return false; }
  return true;
}

// Resolves true once the line was handed to a speech engine. A newer speak() or stop() supersedes this one.
export async function speak(text) {
  if (!isSupported()) return false;
  const line = speakable(text);
  if (!line) return false;
  watchVisibility();
  const mine = ++generation;
  try { synthesis()?.cancel(); } catch { /* nothing was speaking */ }
  const native = nativeTts();
  if (native) {
    nativeActive = true;
    let ok = false;
    try { ok = (await native.speak(line))?.ok === true; } catch { ok = false; }
    if (mine !== generation) return false;
    if (ok) return true;
  }
  try { return await browserSpeak(line, mine); } catch { return false; }
}

export function stop() {
  generation += 1;
  utterance = null;
  try { synthesis()?.cancel(); } catch { /* nothing was speaking */ }
  if (nativeActive) {
    nativeActive = false;
    try { nativeTts()?.stop?.(); } catch { /* the host is gone */ }
  }
}

// Reads only when the child left read-aloud on (or, for a first-time player, when this class defaults to it).
export function speakIfEnabled(text, fallback = false) {
  return isEnabled(fallback) ? speak(text) : Promise.resolve(false);
}

function watchVisibility() {
  if (watching || typeof document === 'undefined') return;
  watching = true;
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  globalThis.addEventListener?.('pagehide', stop);
  globalThis.addEventListener?.('otterly-native-visibility', event => { if (event.detail === false) stop(); });
}

// Test hook: forget every cached choice so a test starts from a clean module.
export function resetForTests() {
  generation = 0;
  nativeActive = false;
  utterance = null;
  remembered = null;
}
