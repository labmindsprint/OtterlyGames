import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import {
  defaultOn, fullSpeech, isEnabled, isSupported, optionsSpeech, pickVoice, questionSpeech, resetForTests, setEnabled, speak, speakIfEnabled, speakable, stop,
} from '../js/space-academy/pitstop/tts.mjs';

const NAMES = ['speechSynthesis', 'SpeechSynthesisUtterance', 'localStorage', 'OtterlyNative'];
const saved = new Map();
const put = (name, value) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });

beforeEach(() => {
  for (const name of NAMES) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    put(name, undefined);
  }
  resetForTests();
});

afterEach(() => {
  for (const name of NAMES) {
    const original = saved.get(name);
    if (original) Object.defineProperty(globalThis, name, original);
    else delete globalThis[name];
  }
});

function fakeSynth(voices = []) {
  const log = [];
  const listeners = new Set();
  const synth = {
    log,
    voices,
    getVoices: () => synth.voices,
    speak: item => log.push(['speak', item.text, item.voice?.name ?? null, item.rate, item.lang]),
    cancel: () => log.push(['cancel']),
    addEventListener: (type, fn) => { if (type === 'voiceschanged') listeners.add(fn); },
    removeEventListener: (type, fn) => listeners.delete(fn),
    loaded(next) { synth.voices = next; for (const fn of [...listeners]) fn(); },
  };
  put('speechSynthesis', synth);
  put('SpeechSynthesisUtterance', class { constructor(text) { this.text = text; } });
  return synth;
}

const spoken = synth => synth.log.filter(entry => entry[0] === 'speak');

test('maths symbols, numbers and ids become words a voice can read', () => {
  assert.equal(speakable('3 x 4 = 12'), 'three times four equals twelve');
  assert.equal(speakable('8 ÷ 2'), 'eight divided by two');
  assert.equal(speakable('1/2 of 8'), 'one over two of eight');
  assert.equal(speakable('5 > 3 and 2 < 4'), 'five is greater than three and two is less than four');
  assert.equal(speakable('9 - 4 = ?'), 'nine minus four equals what number');
  assert.equal(speakable('-5 + 12'), 'minus five plus twelve');
  assert.equal(speakable('1,250 and 3.05'), 'one thousand two hundred fifty and three point zero five');
  assert.equal(speakable('Class 3: the 2nd bus at 3:30'), 'Class three: the second bus at three thirty');
  assert.equal(speakable('12 cm + 5 cm'), 'twelve centimetres plus five centimetres');
  assert.equal(speakable('part_wing 🚀 Pick the rocket ★'), 'Pick the rocket');
  assert.equal(speakable('Fill __ the gap'), 'Fill blank the gap');
  assert.equal(speakable(null), '');
});

test('long text is capped at a sentence or word boundary', () => {
  const long = speakable('Count the stars. '.repeat(80));
  assert.ok(long.length <= 600);
  assert.ok(long.endsWith('.'));
  assert.ok(speakable('word '.repeat(300)).length <= 600);
});

test('questions are read with their options but never the answer, explanation or ids', () => {
  const question = {
    id: 'class-2-ch1-q7', prompt: 'What is 3 x 4?', options: ['10', '12', '14', '16'], correctIndex: 1,
    explanation: 'SECRET three fours make twelve', visual: { description: 'Three rows of four dots' },
  };
  assert.equal(questionSpeech(question), 'What is 3 x 4?');
  assert.equal(optionsSpeech(question), 'Option A: 10. Option B: 12. Option C: 14. Option D: 16');
  const line = speakable(fullSpeech(question));
  assert.match(line, /^What is three times four\? Option A: ten\. Option B: twelve/);
  assert.doesNotMatch(line, /SECRET|class-2|correct/i);
  const pictures = { prompt: 'Pick the circle', options: ['a', 'b'], optionVisuals: [{ description: 'a round shape' }, { description: 'a square shape' }] };
  assert.equal(optionsSpeech(pictures), 'Option A: a round shape. Option B: a square shape');
});

test('voice pick prefers a natural female en-IN, then en-GB, then en-US, and ignores other languages', () => {
  const voices = [
    { name: 'Google Deutsch', lang: 'de-DE' }, { name: 'Microsoft Mark', lang: 'en-US' },
    { name: 'Google UK English Female', lang: 'en-GB' }, { name: 'Microsoft Neerja Online (Natural)', lang: 'en_IN' },
  ];
  assert.equal(pickVoice(voices).name, 'Microsoft Neerja Online (Natural)');
  assert.equal(pickVoice(voices.slice(0, 3)).name, 'Google UK English Female');
  assert.equal(pickVoice([{ name: 'Google Deutsch', lang: 'de-DE' }]), null);
  assert.equal(pickVoice([]), null);
});

test('speech is slow, uses the picked voice and a new line replaces the old one', async () => {
  const synth = fakeSynth([{ name: 'Google UK English Female', lang: 'en-GB' }]);
  assert.equal(await speak('What is 2 + 2?'), true);
  assert.equal(await speak('Pick the biggest'), true);
  assert.deepEqual(synth.log, [
    ['cancel'], ['speak', 'What is two plus two?', 'Google UK English Female', 0.9, 'en-GB'],
    ['cancel'], ['speak', 'Pick the biggest', 'Google UK English Female', 0.9, 'en-GB'],
  ]);
});

test('stop cancels speech and a line still waiting for voices is never spoken', async () => {
  const synth = fakeSynth([]);
  const pending = speak('Hello there');
  stop();
  synth.loaded([{ name: 'Natural', lang: 'en-US' }]);
  assert.equal(await pending, false);
  assert.equal(spoken(synth).length, 0);
  stop();
  assert.equal(synth.log.filter(entry => entry[0] === 'cancel').length >= 3, true);
});

test('it waits for voiceschanged once, then speaks with the new voice', async () => {
  const synth = fakeSynth([]);
  const pending = speak('Count the stars');
  assert.equal(spoken(synth).length, 0);
  synth.loaded([{ name: 'Samantha', lang: 'en-US' }]);
  assert.equal(await pending, true);
  assert.deepEqual(spoken(synth), [['speak', 'Count the stars', 'Samantha', 0.9, 'en-US']]);
});

test('with no voices at all it still speaks using the default voice after a short wait', async () => {
  const synth = fakeSynth([]);
  assert.equal(await speak('Count the stars'), true);
  assert.deepEqual(spoken(synth), [['speak', 'Count the stars', null, 0.9, 'en-IN']]);
});

test('unsupported browsers stay silent and never throw', async () => {
  assert.equal(isSupported(), false);
  assert.equal(await speak('Hello'), false);
  assert.equal(await speakIfEnabled('Hello', true), false);
  stop();
  fakeSynth([]);
  assert.equal(isSupported(), true);
  assert.equal(await speak('   '), false);
});

test('the switch persists, falls back to memory when storage is denied, and is off by default for every class', () => {
  assert.deepEqual(['pp1', 'pp2', 'class-1', 'class-2', 'class-5'].map(defaultOn), [false, false, false, false, false]);
  const store = new Map();
  put('localStorage', { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) });
  assert.equal(isEnabled(true), true);
  assert.equal(isEnabled(false), false);
  setEnabled(false);
  assert.equal(isEnabled(true), false);
  assert.deepEqual([...store.values()], ['0']);
  setEnabled(true);
  assert.equal(isEnabled(false), true);
  assert.deepEqual([...store.values()], ['1']);

  resetForTests();
  const denied = () => { throw new Error('SecurityError'); };
  put('localStorage', { getItem: denied, setItem: denied });
  assert.equal(isEnabled(true), true);
  setEnabled(false);
  assert.equal(isEnabled(true), false);
  setEnabled(true);
  assert.equal(isEnabled(false), true);
});

test('speakIfEnabled reads only when the child left read-aloud on, and turning it off stops speech', async () => {
  const synth = fakeSynth([{ name: 'Samantha', lang: 'en-US' }]);
  assert.equal(await speakIfEnabled('Hi', false), false);
  assert.equal(spoken(synth).length, 0);
  assert.equal(await speakIfEnabled('Hi', true), true);
  const before = synth.log.length;
  setEnabled(false);
  assert.equal(synth.log.length > before && synth.log.at(-1)[0] === 'cancel', true);
  assert.equal(await speakIfEnabled('Hi', true), false);
});

test('Android native speech is preferred, stops natively, and falls back to the browser when it fails', async () => {
  const synth = fakeSynth([{ name: 'Samantha', lang: 'en-US' }]);
  const calls = [];
  let answer = { ok: true };
  put('OtterlyNative', { tts: { speak: async text => { calls.push(['speak', text]); return answer; }, stop: async () => { calls.push(['stop']); return true; } } });
  assert.equal(await speak('Read me'), true);
  assert.deepEqual(calls, [['speak', 'Read me']]);
  assert.equal(spoken(synth).length, 0);
  stop();
  assert.deepEqual(calls.at(-1), ['stop']);
  stop();
  assert.equal(calls.filter(call => call[0] === 'stop').length, 1);

  answer = { ok: false };
  assert.equal(await speak('Read me again'), true);
  assert.deepEqual(spoken(synth), [['speak', 'Read me again', 'Samantha', 0.9, 'en-US']]);
});

test('an older native request that finishes late does not speak over a newer one', async () => {
  const synth = fakeSynth([{ name: 'Samantha', lang: 'en-US' }]);
  const releases = [];
  put('OtterlyNative', { tts: { speak: text => new Promise(resolve => releases.push(() => resolve({ ok: false, text }))), stop: async () => true } });
  const first = speak('First line');
  const second = speak('Second line');
  releases[0]();
  assert.equal(await first, false);
  releases[1]();
  assert.equal(await second, true);
  assert.deepEqual(spoken(synth).map(entry => entry[1]), ['Second line']);
});

test('a native bridge without a speak method is ignored', async () => {
  const synth = fakeSynth([{ name: 'Samantha', lang: 'en-US' }]);
  put('OtterlyNative', { rewardedAd: {} });
  assert.equal(await speak('Hello'), true);
  assert.equal(spoken(synth).length, 1);
});
